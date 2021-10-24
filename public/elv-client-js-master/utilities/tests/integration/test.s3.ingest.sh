#!/bin/bash

print_spaced() {
  echo
  echo $*
  echo
}

print_heading() {
  echo
  echo ---------------------------------------
  echo $*
  echo ---------------------------------------
  echo
}


print_output() {
  echo
  JSON_OUTPUT=$(echo $OUTPUT | jq 2>/dev/null)
  if [ $? -ne 0 ]
  then
    echo $OUTPUT
  else
    echo $JSON_OUTPUT
    ERRORS=$(echo $OUTPUT | jq '.errors' 2>/dev/null)
    if [ $? -eq 0 ]
    then
      if [ "$ERRORS" != "[]" ]
      then
        echo
        echo ERRORS:
        echo $ERRORS
        echo
      fi
    fi
  fi
}

check_exit_code() {
  EXIT_CODE=$1
  if [ $EXIT_CODE -ne 0 ]
  then
    print_output
    print_spaced FAIL
    exit 1
  else
    if [ "$VERBOSE" = "1" ]
    then
      print_output
    fi
  fi
}


if [ -z "$1" ]
  then
    print_spaced Missing name of variable setting script file.
    print_spaced Usage: $0 NAME_OF_SCRIPT_TO_SET_VARS
    exit 1
fi

# =========================
# SET VARIABLES
# =========================

export ELV_CALLER_SHELL_LEVEL=$SHLVL
source $1

# =========================
# TEST START
# =========================

echo
echo -------------------
echo INTEGRATION TEST START
echo $0
echo Title: $TITLE
echo $S3_PATH
echo -------------------
echo

TIMESTAMP=$(date +%Y-%m-%dT%H:%M:%S%z)

# -------------------------
# CREATE PRODUCTION MASTER
# -------------------------
print_heading Create Master

OUTPUT=$(node "$ELV_CLIENT_PATH/utilities/ProductionMasterCreate.js" \
  --type $MASTER_TYPE \
  --libraryId $MASTER_LIB \
  --title "$TITLE $TIMESTAMP" \
  --s3Reference \
  --json -v \
  --ethContractTimeout $ETH_CONTRACT_TIMEOUT \
  --files $S3_PATH)

check_exit_code $?

MASTER_OBJECT_ID=$(echo $OUTPUT | jq '.data.object_id' | tr -d '"')
echo object_id=$MASTER_OBJECT_ID

VERSION_HASH=$(echo $OUTPUT | jq '.data.version_hash' | tr -d '"')
echo version_hash=$VERSION_HASH

# -------------------------
# CREATE MEZZANINE
# -------------------------
print_heading Create Mez

OUTPUT=$(node "$ELV_CLIENT_PATH/utilities/MezzanineCreate.js" \
  --type $MEZ_TYPE \
  --libraryId $MEZ_LIB \
  --title "$TITLE $TIMESTAMP" \
  --masterHash $VERSION_HASH \
  --abrProfile $ABR_PROFILE_PATH \
  --ethContractTimeout $ETH_CONTRACT_TIMEOUT \
  --json -v)

if [ "$VERBOSE" = "1" ]
then
  echo
  echo $OUTPUT | jq
  echo
fi

if [ $? -ne 0 ]
then
  echo
  echo FAIL
  echo
  exit 1
fi


MEZ_OBJECT_ID=$(echo $OUTPUT | jq '.data.object_id' | tr -d '"')
echo object_id=$MEZ_OBJECT_ID

RUN_STATE=running

# -------------------------
# CHECK STATUS
# -------------------------

while [ "$RUN_STATE" = "running" ]
do
  print_heading Check Mez Status

  OUTPUT=$(node $ELV_CLIENT_PATH/utilities/MezzanineJobStatus.js \
    --objectId $MEZ_OBJECT_ID \
    --ethContractTimeout $ETH_CONTRACT_TIMEOUT \
    --json -v)

  check_exit_code $?

  RUN_STATE=$(echo $OUTPUT | jq '.data.status_summary.run_state' | tr -d '"')
  echo run_state=$RUN_STATE

  ETA=$(echo $OUTPUT | jq '.data.status_summary.estimated_time_left_h_m_s' | tr -d '"')
  echo ETA=$ETA

  if [ "$RUN_STATE" = "running" ]
  then
    echo sleep 15
    sleep 15
  fi

done

print_spaced Final run state: $RUN_STATE

if [ "$RUN_STATE" != "finished" ]
then
  print_spaced ERROR bad run state: $RUN_STATE
  exit 1
fi


# -------------------------
# FINALIZE
# -------------------------
print_heading Finalize Mez

OUTPUT=$(node $ELV_CLIENT_PATH/utilities/MezzanineJobStatus.js \
  --objectId $MEZ_OBJECT_ID \
  --finalize \
  --ethContractTimeout $ETH_CONTRACT_TIMEOUT \
  --json -v)

check_exit_code $?

# -------------------------
# ADD GROUP PERMISSIONS
# -------------------------
print_heading Add group permission: Master

OUTPUT=$(node $ELV_CLIENT_PATH/utilities/ObjectAddGroupPerms.js \
  --objectId $MASTER_OBJECT_ID \
  --groupAddress $ADMINS_GROUP_ADDRESS \
  --permissions manage \
  --ethContractTimeout $ETH_CONTRACT_TIMEOUT \
  --json -v)

check_exit_code $?

print_heading Add group permission: Mez

OUTPUT=$(node $ELV_CLIENT_PATH/utilities/ObjectAddGroupPerms.js \
  --objectId $MEZ_OBJECT_ID \
  --groupAddress $ADMINS_GROUP_ADDRESS \
  --permissions manage \
  --ethContractTimeout $ETH_CONTRACT_TIMEOUT \
  --json -v)

check_exit_code $?

# -------------------------
# SIGNAL SUCCESS
# -------------------------
print_spaced SUCCESS
exit 0