/* eslint-disable no-console */

const ScriptOffering = require("./parentClasses/ScriptOffering");
const fs = require("fs");

class OfferingAddTextWatermark extends ScriptOffering {
  async body() {
    const client = await this.client();

    const libraryId = this.args.libraryId;
    const objectId = this.args.objectId;
    const offeringKey = this.args.offeringKey;
    const watermarkJsonPath = this.args.watermarkJson;
    const watermarkJson = JSON.parse(fs.readFileSync(watermarkJsonPath));

    // client.ToggleLogging(true);

    let wallet = client.GenerateWallet();
    let signer = wallet.AddAccount({
      privateKey: process.env.PRIVATE_KEY
    });
    await client.SetSigner({signer});

    console.log("Retrieving mezzanine metadata...");

    const metadata = await client.ContentObjectMetadata({libraryId: libraryId, objectId: objectId});

    this.validateOffering(metadata, offeringKey);

    const targetOffering = metadata.offerings[offeringKey];
    if(targetOffering.image_watermark != null) {
      this.throwError("Offering already has an image watermark, " +
        "currently adding both kinds of watermarks on same offering is not supported. " +
        "Please run OfferingRemoveImageWatermark.js first to remove the text watermark.");

    }

    targetOffering.simple_watermark = watermarkJson;

    console.log("Writing metadata back to object.");
    const {write_token} = await client.EditContentObject({
      libraryId: libraryId,
      objectId: objectId
    });
    await client.ReplaceMetadata({
      metadata: metadata,
      libraryId: libraryId,
      objectId: objectId,
      writeToken: write_token
    });
    await client.FinalizeContentObject({libraryId: libraryId, objectId: objectId, writeToken: write_token});
  }

  header() {
    return "Adding text watermark to object '" + this.args.objectId + "'... ";
  }

  footer() {
    return "Done with adding text watermark to object '" + this.args.objectId + "'.";
  }

  options() {
    return super.options()
      .option("watermarkJson", {
        demandOption: true,
        describe: "Path to JSON file specifying watermark contents.",
        type: "string"
      }).epilogue("Sample --watermarkJson file contents:\n" +
        "  {\n" +
        "    \"font_color\":           \"white@0.5\",\n" +
        "    \"font_relative_height\": 0.05,\n" +
        "    \"shadow\":               true,\n" +
        "    \"shadow_color\":         \"black@0.5\",\n" +
        "    \"template\":             \"DO NOT DISTRIBUTE\",\n" +
        "    \"x\":                    \"(w-tw)/2\",\n" +
        "    \"y\":                    \"h-(2*lh)\"\n" +
        "  }\n" +
        "Attributes:\n" +
        "  font_color            color name or hex code + optional transparency (see https://ffmpeg.org/ffmpeg-utils.html#color-syntax)\n" +
        "  font_relative_height  font height as proportion of screen height (e.g. 0.05 = 5% of screen height)\n" +
        "  shadow                true | false - whether to add a shadow to text\n" +
        "  shadow_color          color name or hex code + optional transparency (see https://ffmpeg.org/ffmpeg-utils.html#color-syntax)\n" +
        "  template              watermark text ($USERNAME will be replaced with info from user account)\n" +
        "  x                     horizontal position of left edge of text, in pixels - supports formulas, see https://ffmpeg.org/ffmpeg-filters.html#drawtext-1)\n" +
        "  y                     vertical position of top edge of text - supports formulas, see https://ffmpeg.org/ffmpeg-filters.html#drawtext-1\n\n"
      );
  }
}

const script = new OfferingAddTextWatermark;
script.run();