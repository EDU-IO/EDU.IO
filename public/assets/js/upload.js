const input = document.getElementById("input");
const createbtn = document.getElementById("createbtn");

input.addEventListener("change", getFiles, false);
var file = null;

async function getFiles() {
    file = this.files[0]; /* now you can work with the file list */

    const client = await ElvClient.FromConfigurationUrl({
        configUrl: "https://demov3.net955210.contentfabric.io/config"
      });
    
      const wallet = client.GenerateWallet();
      const signer = wallet.AddAccount({
        privateKey: "0x752912b0ae8c68867a1619c0505bf22a775dfc897f78ab6ca3f84f6c973c72ee"
      });
    
      console.log(signer)
    
      client.SetSigner({signer});
      const address = "0xcc0db6ba6e4202aca161e8242ac21e36645d3ca2";
      const libraryId = client.utils.AddressToLibraryId(address);
    
      console.log(libraryId);
    
      const createResponse = await client.CreateContentObject({libraryId});
      const objectId = createResponse.id;
      const writeToken = createResponse.write_token;
    
      console.log(objectId)
      console.log(writeToken)
    
      await client.ReplaceMetadata({
        libraryId,
        objectId,
        writeToken,
        metadata: {
          "public": "test"
        }
      });
  
      await client.UploadFiles({
        libraryId,
        objectId,
        writeToken,
        fileInfo: [
          {
            path: "video.mp4",
            mime_type: "video/mp4",
            size: file["size"],
            data: file
          }
        ]
      });
    
      const finalizeResponse = await client.FinalizeContentObject({
        libraryId,
        objectId,
        writeToken
      });
    
      const versionHash = finalizeResponse.hash;
      console.log(versionHash)
}

function handleFiles() {
    if (file == null) {
        return;
    }
}


