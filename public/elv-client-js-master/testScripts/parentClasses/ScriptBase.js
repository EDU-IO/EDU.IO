/* eslint-disable no-console */

// abstract base class for scripts
//
// Properties
//
//   args        Arguments supplied to command, either via command line or via testArgs parameter during instantiation
//   elvClient   An elv-client-js client instance
//

const yargs = require("yargs");
const yargsTerminalWidth = yargs.terminalWidth();
const {ElvClient} = require("../../src/ElvClient");

module.exports = class ScriptBase {
  static deprecationNotice(newFileName) {
    console.log(`
***** DEPRECATION NOTICE *****

  This script will be removed later this year, please switch
  to /utilities/${newFileName} at your earliest convenience.

  More info: https://docs.google.com/document/d/1iKQZhea02rVGNg4qI59ig-RyxecUXsJC8KcGhHhrut8/edit#

******************************
`);
  }

  constructor(testArgs = null) {
    // make sure env var PRIVATE_KEY is set
    if(!process.env.PRIVATE_KEY) {
      this.throwError("Please set environment variable PRIVATE_KEY");
    }

    // if testArgs is present, we are running a test, use testArgs instead of yargs
    if(testArgs) {
      this.args = testArgs;
    } else {
      this.args = this.options().argv;
    }
    // if --configUrl was not passed in, try to read from ../TestConfiguration.json
    if(!this.args.configUrl) {
      const ClientConfiguration = require("../../TestConfiguration.json");
      this.args.configUrl = ClientConfiguration["config-url"];
    }
  }

  // actual work specific to individual script
  async body() {
    this.throwError("call to abstract base class method body()");
  }

  async client() {
    // get client if we have not already
    if(!this.elvClient) {
      this.elvClient = await ElvClient.FromConfigurationUrl({
        configUrl: this.args.configUrl,
        region: this.args.elvGeo
      });
      let wallet = this.elvClient.GenerateWallet();
      let signer = wallet.AddAccount({
        privateKey: process.env.PRIVATE_KEY
      });
      await this.elvClient.SetSigner({signer});
      this.elvClient.ToggleLogging(this.args.debug);
    }
    return this.elvClient;
  }

  // default footer
  footer() {
    return "Done.";
  }

  header() {
    this.throwError("call to abstract base class method header()");
  }

  // utility method, add new lines above and below error message for greater visibility
  throwError(msg) {
    throw new Error("\n\n" + msg + "\n");
  }

  // Returns yargs to allow extension
  //
  // Subclass this method to add command line options, e.g.:
  //
  // class NewScript extends ScriptBase {
  //    options() {
  //        return this.super()
  //          .option("newArg", {
  //             alias: "new-arg",
  //             demandOption: true,
  //             describe: "My new argument",
  //             type: "string"
  //          }
  //        )
  //    }
  // }
  options() {

    return yargs
      .option("debug", {
        describe: "Print debug logging for API calls",
        type: "boolean"
      })
      .option("configUrl", {
        alias: "config-url",
        describe: "URL pointing to the Fabric configuration, enclosed in quotes. e.g. for Eluvio demo network: --configUrl \"https://demov3.net955210.contentfabric.io/config\"",
        type: "string"
      })
      .option("elvGeo", {
        alias: "elv-geo",
        choices: ["as-east", "au-east", "eu-east", "eu-west", "na-east", "na-west-north", "na-west-south"],
        describe: "Geographic region for the fabric nodes.",
        type: "string",
      })
      .strict().version(false).wrap(yargsTerminalWidth);
  }

  run() {
    console.log("\n" + this.header());
    this.body().then(successValue => {
      console.log(this.footer() + "\n");
      return successValue;
    }, failureReason => {
      console.error(failureReason);
      process.exitCode = 1;
    });
  }

  // validate that a number is an integer
  validateInt(i, valueDescription) {
    if(i !== Math.trunc(i)) {
      this.throwError("Bad " + valueDescription + " (" + i + "): must be an integer");
    }
  }

  // validate that a number is zero or positive
  validateNonNegative(i, valueDescription) {
    if(i < 0) {
      this.throwError("Bad " + valueDescription + " (" + i + "): must be non-negative");
    }
  }

  // validate that a number is zero or positive and an integer
  validateNonNegativeInt(i, valueDescription) {
    this.validateNonNegative(i, valueDescription);
    this.validateInt(i, valueDescription);
  }

  // validate that number is greater than zero
  validatePositive(i, valueDescription) {
    if(i <= 0) {
      this.throwError("Bad " + valueDescription + " (" + i + "): must be positive");
    }
  }

  // validate that number is greater than zero and an integer
  validatePositiveInt(i, valueDescription) {
    this.validatePositive(i, valueDescription);
    this.validateInt(i, valueDescription);
  }
};
