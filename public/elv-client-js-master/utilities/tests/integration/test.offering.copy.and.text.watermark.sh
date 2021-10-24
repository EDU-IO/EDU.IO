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
echo Mez ID: $MEZ_ID
echo Source offering: $SOURCE_OFFERING_KEY
echo Target offering: $TARGET_OFFERING_KEY
echo -------------------
echo


# -------------------------
# CHECK THAT MEZ HAS THE SOURCE OFFERING,
# AND THAT IT CONTAINS media_struct
# -------------------------
print_heading Check metadata for existence of media_struct at /offerings/$SOURCE_OFFERING_KEY/media_struct

OUTPUT=$(node "$ELV_CLIENT_PATH/utilities/ObjectGetMetadata.js" \
  --objectId $MEZ_ID \
  --subtree "/offerings/$SOURCE_OFFERING_KEY/media_struct" \
  --ethContractTimeout $ETH_CONTRACT_TIMEOUT \
  --json -v)

check_exit_code $?


# -------------------------
# SAVE CURRENT VERSION COUNT
# -------------------------
print_heading Counting number of versions

OUTPUT=$(node "$ELV_CLIENT_PATH/utilities/ObjectListVersions.js" \
  --objectId $MEZ_ID \
  --ethContractTimeout $ETH_CONTRACT_TIMEOUT \
  --json -v)

check_exit_code $?

ORIGINAL_VERSION_COUNT=$(echo $OUTPUT | jq '.data.version_count' | tr -d '"')
print_spaced Original version count: $ORIGINAL_VERSION_COUNT


# -------------------------
# COPY OFFERING
# -------------------------
print_heading Copy Metadata for offering from $SOURCE_OFFERING_KEY to $TARGET_OFFERING_KEY

OUTPUT=$(node "$ELV_CLIENT_PATH/utilities/ObjectCopyMetadata.js" \
  --objectId $MEZ_ID \
  --sourcePath "/offerings/$SOURCE_OFFERING_KEY" \
  --targetPath "/offerings/$TARGET_OFFERING_KEY" \
  --ethContractTimeout $ETH_CONTRACT_TIMEOUT \
  --json -v)

check_exit_code $?

VERSION_HASH=$(echo $OUTPUT | jq '.data.version_hash' | tr -d '"')
print_spaced version_hash=$VERSION_HASH

# -------------------------
# Add simple_watermark
# -------------------------
print_heading Add simple_watermark to new offering metadata --force

OUTPUT=$(node "$ELV_CLIENT_PATH/utilities/ObjectSetMetadata.js" \
  --objectId $MEZ_ID \
  --path "/offerings/$TARGET_OFFERING_KEY/simple_watermark" \
  --metadata \'$TEXT_WATERMARK\' \
  --ethContractTimeout $ETH_CONTRACT_TIMEOUT \
  --force --json -v)

check_exit_code $?

VERSION_HASH=$(echo $OUTPUT | jq '.data.version_hash' | tr -d '"')
print_spaced version_hash=$VERSION_HASH

# -------------------------
# Retrieve and check metadata
# -------------------------
print_heading Check new offering metadata

OUTPUT=$(node "$ELV_CLIENT_PATH/utilities/ObjectGetMetadata.js" \
  --versionHash $VERSION_HASH \
  --subtree "/offerings/$TARGET_OFFERING_KEY/simple_watermark" \
  --ethContractTimeout $ETH_CONTRACT_TIMEOUT \
  --json -v)

check_exit_code $?

SIMPLE_WATERMARK_ORIGINAL=$(echo $TEXT_WATERMARK | jq)
SIMPLE_WATERMARK_CHECK=$(echo $OUTPUT | jq '.data.metadata')

if [[ $SIMPLE_WATERMARK_ORIGINAL == $SIMPLE_WATERMARK_CHECK ]]
then
  print_spaced metadata at /offerings/$TARGET_OFFERING_KEY/simple_metadata matches
else
  print_spaced FAIL - metadata at /offerings/$TARGET_OFFERING_KEY/simple_metadata does not match
  exit 1
fi

# -------------------------
# Delete versions added by test
# -------------------------
print_heading Removing versions added by test

OUTPUT=$(node "$ELV_CLIENT_PATH/utilities/ObjectPruneVersions.js" \
  --objectId $MEZ_ID \
  --keep $ORIGINAL_VERSION_COUNT \
  --keepOld \
  --ethContractTimeout $ETH_CONTRACT_TIMEOUT \
  --json -v)

check_exit_code $?

print_spaced SUCCESS
exit 0