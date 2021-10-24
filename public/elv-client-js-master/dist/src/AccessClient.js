var _regeneratorRuntime = require("@babel/runtime/regenerator");

var _typeof = require("@babel/runtime/helpers/typeof");

var _classCallCheck = require("@babel/runtime/helpers/classCallCheck");

var _createClass = require("@babel/runtime/helpers/createClass");

if (typeof Buffer === "undefined") {
  Buffer = require("buffer/").Buffer;
}

var URI = require("urijs");

var Ethers = require("ethers");

var AuthorizationClient = require("./AuthorizationClient");

var ElvWallet = require("./ElvWallet");

var EthClient = require("./EthClient");

var UserProfileClient = require("./UserProfileClient");

var HttpClient = require("./HttpClient"); // const ContentObjectVerification = require("./ContentObjectVerification");


var Utils = require("./Utils");

if (Utils.Platform() === Utils.PLATFORM_NODE) {
  // Define Response in node
  // eslint-disable-next-line no-global-assign
  global.Response = require("node-fetch").Response;
} else if (Utils.Platform() === Utils.PLATFORM_REACT_NATIVE) {
  // React native polyfill
  require("unorm");
}
/**
 * See the Modules section on the sidebar for details about methods related to interacting with the Fabric.
 *
 */


var ElvClient =
/*#__PURE__*/
function () {
  "use strict";

  _createClass(ElvClient, [{
    key: "Log",
    value: function Log(message) {
      var error = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      if (!this.debug) {
        return;
      }

      if (_typeof(message) === "object") {
        message = JSON.stringify(message);
      }

      error ? // eslint-disable-next-line no-console
      console.error("\n(elv-client-js#ElvClient) ".concat(message, "\n")) : // eslint-disable-next-line no-console
      console.log("\n(elv-client-js#ElvClient) ".concat(message, "\n"));
    }
    /**
     * Enable or disable verbose logging
     *
     * @methodGroup Miscellaneous
     *
     * @param {boolean} enable - Set logging
     */

  }, {
    key: "ToggleLogging",
    value: function ToggleLogging(enable) {
      this.debug = enable;
      this.authClient ? this.authClient.debug = enable : undefined;
      this.ethClient ? this.ethClient.debug = enable : undefined;
      this.HttpClient ? this.HttpClient.debug = enable : undefined;
      this.userProfileClient ? this.userProfileClient.debug = enable : undefined;

      if (enable) {
        this.Log("Debug Logging Enabled:\n        Content Space: ".concat(this.contentSpaceId, "\n        Fabric URLs: [\n\t\t").concat(this.fabricURIs.join(", \n\t\t"), "\n\t]\n        Ethereum URLs: [\n\t\t").concat(this.ethereumURIs.join(", \n\t\t"), "\n\t]"));
      }
    }
    /**
     * Create a new ElvClient
     *
     * NOTE: It is highly recommended to use ElvClient.FromConfiguration to
     * automatically import the client settings from the fabric
     *
     * @constructor
     *
     * @namedParams
     * @param {string} contentSpaceId - ID of the content space
     * @param {Array<string>} fabricURIs - A list of full URIs to content fabric nodes
     * @param {Array<string>} ethereumURIs - A list of full URIs to ethereum nodes
     * @param {Array<string>} kmsURIs - List of KMS urls to use for OAuth authentication
     * @param {boolean=} noCache=false - If enabled, blockchain transactions will not be cached
     * @param {boolean=} noAuth=false - If enabled, blockchain authorization will not be performed
     *
     * @return {ElvClient} - New ElvClient connected to the specified content fabric and blockchain
     */

  }]);

  function ElvClient(_ref) {
    var contentSpaceId = _ref.contentSpaceId,
        fabricURIs = _ref.fabricURIs,
        ethereumURIs = _ref.ethereumURIs,
        _ref$kmsURIs = _ref.kmsURIs,
        kmsURIs = _ref$kmsURIs === void 0 ? [] : _ref$kmsURIs,
        _ref$noCache = _ref.noCache,
        noCache = _ref$noCache === void 0 ? false : _ref$noCache,
        _ref$noAuth = _ref.noAuth,
        noAuth = _ref$noAuth === void 0 ? false : _ref$noAuth;

    _classCallCheck(this, ElvClient);

    this.utils = Utils;
    this.contentSpaceId = contentSpaceId;
    this.contentSpaceAddress = this.utils.HashToAddress(contentSpaceId);
    this.contentSpaceLibraryId = this.utils.AddressToLibraryId(this.contentSpaceAddress);
    this.contentSpaceObjectId = this.utils.AddressToObjectId(this.contentSpaceAddress);
    this.fabricURIs = fabricURIs;
    this.ethereumURIs = ethereumURIs;
    this.kmsURIs = kmsURIs;
    this.noCache = noCache;
    this.noAuth = noAuth;
    this.debug = false;
    this.InitializeClients();
  }
  /**
   * Retrieve content space info and preferred fabric and blockchain URLs from the fabric
   *
   * @methodGroup Constructor
   * @namedParams
   * @param {string} configUrl - Full URL to the config endpoint
   * @param {Array<string>} kmsUrls - List of KMS urls to use for OAuth authentication
   * @param {string=} region - Preferred region - the fabric will auto-detect the best region if not specified
   * - Available regions: na-west-north na-west-south na-east eu-west
   *
   * @return {Promise<Object>} - Object containing content space ID and fabric and ethereum URLs
   */


  _createClass(ElvClient, [{
    key: "InitializeClients",
    value: function InitializeClients() {
      this.contentTypes = {};
      this.encryptionConks = {};
      this.reencryptionConks = {};
      this.stateChannelAccess = {};
      this.objectLibraryIds = {};
      this.HttpClient = new HttpClient({
        uris: this.fabricURIs,
        debug: this.debug
      });
      this.ethClient = new EthClient({
        uris: this.ethereumURIs,
        debug: this.debug
      });
      this.authClient = new AuthorizationClient({
        client: this,
        contentSpaceId: this.contentSpaceId,
        signer: this.signer,
        noCache: this.noCache,
        noAuth: this.noAuth,
        debug: this.debug
      });
      this.userProfileClient = new UserProfileClient({
        client: this,
        debug: this.debug
      });
    }
  }, {
    key: "SetAuth",
    value: function SetAuth(auth) {
      this.noAuth = !auth;
      this.authClient.noAuth = !auth;
    }
    /**
     * Update fabric URLs to prefer the specified region.
     *
     * Note: Client must have been initialized with FromConfiguration
     *
     * @methodGroup Nodes
     * @namedParams
     * @param {string} region - Preferred region - the fabric will auto-detect the best region if not specified
     * - Available regions: na-west-north na-west-south na-east eu-west
     *
     * @return {Promise<Object>} - An object containing the updated fabric and ethereum URLs in order of preference
     */

  }, {
    key: "UseRegion",
    value: function UseRegion(_ref2) {
      var region, _ref3, fabricURIs, ethereumURIs;

      return _regeneratorRuntime.async(function UseRegion$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              region = _ref2.region;

              if (this.configUrl) {
                _context.next = 3;
                break;
              }

              throw Error("Unable to change region: Configuration URL not set");

            case 3:
              _context.next = 5;
              return _regeneratorRuntime.awrap(ElvClient.Configuration({
                configUrl: this.configUrl,
                region: region
              }));

            case 5:
              _ref3 = _context.sent;
              fabricURIs = _ref3.fabricURIs;
              ethereumURIs = _ref3.ethereumURIs;
              this.fabricURIs = fabricURIs;
              this.ethereumURIs = ethereumURIs;
              this.HttpClient.uris = fabricURIs;
              this.HttpClient.uriIndex = 0;
              this.ethClient.ethereumURIs = ethereumURIs;
              this.ethClient.ethereumURIIndex = 0;
              return _context.abrupt("return", {
                fabricURIs: fabricURIs,
                ethereumURIs: ethereumURIs
              });

            case 15:
            case "end":
              return _context.stop();
          }
        }
      }, null, this);
    }
    /**
     * Reset fabric URLs to prefer the best region auto-detected by the fabric.
     *
     * Note: Client must have been initialized with FromConfiguration
     *
     * @methodGroup Nodes
     *
     * @return {Promise<Object>} - An object containing the updated fabric and ethereum URLs in order of preference
     */

  }, {
    key: "ResetRegion",
    value: function ResetRegion() {
      return _regeneratorRuntime.async(function ResetRegion$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              if (this.configUrl) {
                _context2.next = 2;
                break;
              }

              throw Error("Unable to change region: Configuration URL not set");

            case 2:
              _context2.next = 4;
              return _regeneratorRuntime.awrap(this.UseRegion({
                region: ""
              }));

            case 4:
              return _context2.abrupt("return", _context2.sent);

            case 5:
            case "end":
              return _context2.stop();
          }
        }
      }, null, this);
    }
    /**
     * Retrieve the node ID reported by the fabric for the specified region
     *
     * Note: Client must have been initialized with FromConfiguration
     *
     * @methodGroup Nodes
     *
     * @namedParams
     * @param {string} region - Region from which to retrieve the node ID
     *
     * @return {Promise<string>} - The node ID reported by the fabric
     */

  }, {
    key: "NodeId",
    value: function NodeId(_ref4) {
      var region, _ref5, nodeId;

      return _regeneratorRuntime.async(function NodeId$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              region = _ref4.region;
              _context3.next = 3;
              return _regeneratorRuntime.awrap(ElvClient.Configuration({
                configUrl: this.configUrl,
                region: region
              }));

            case 3:
              _ref5 = _context3.sent;
              nodeId = _ref5.nodeId;
              return _context3.abrupt("return", nodeId);

            case 6:
            case "end":
              return _context3.stop();
          }
        }
      }, null, this);
    }
    /**
     * Retrieve the fabric and ethereum nodes currently used by the client, in preference order
     *
     * @methodGroup Nodes
     *
     * @return {Promise<Object>} - An object containing the lists of fabric and ethereum urls in use by the client
     */

  }, {
    key: "Nodes",
    value: function Nodes() {
      return {
        fabricURIs: this.fabricURIs,
        ethereumURIs: this.ethereumURIs
      };
    }
    /**
     * Set the client to use the specified fabric and ethereum nodes, in preference order
     *
     * @namedParams
     * @param {Array<string>=} fabricURIs - A list of URLs for the fabric, in preference order
     * @param {Array<string>=} ethereumURIs - A list of URLs for the blockchain, in preference order
     *
     * @methodGroup Nodes
     */

  }, {
    key: "SetNodes",
    value: function SetNodes(_ref6) {
      var fabricURIs = _ref6.fabricURIs,
          ethereumURIs = _ref6.ethereumURIs;

      if (fabricURIs) {
        this.fabricURIs = fabricURIs;
        this.HttpClient.uris = fabricURIs;
        this.HttpClient.uriIndex = 0;
      }

      if (ethereumURIs) {
        this.ethereumURIs = ethereumURIs;
        this.ethClient.ethereumURIs = ethereumURIs;
        this.ethClient.ethereumURIIndex = 0;
      }
    }
    /* Wallet and signers */

    /**
     * Generate a new ElvWallet that is connected to the client's provider
     *
     * @methodGroup Signers
     * @returns {ElvWallet} - ElvWallet instance with this client's provider
     */

  }, {
    key: "GenerateWallet",
    value: function GenerateWallet() {
      return new ElvWallet(this.ethClient.Provider());
    }
    /**
     * Remove the signer from this client
     *
     * @methodGroup Signers
     */

  }, {
    key: "ClearSigner",
    value: function ClearSigner() {
      this.signer = undefined;
      this.InitializeClients();
    }
    /**
     * Clear saved access and state channel tokens
     *
     * @methodGroup Access Requests
     */

  }, {
    key: "ClearCache",
    value: function ClearCache() {
      this.authClient.ClearCache();
    }
    /**
     * Set the signer for this client to use for blockchain transactions
     *
     * @methodGroup Signers
     * @namedParams
     * @param {object} signer - The ethers.js signer object
     */

  }, {
    key: "SetSigner",
    value: function SetSigner(_ref7) {
      var signer = _ref7.signer;
      signer.connect(this.ethClient.Provider());
      signer.provider.pollingInterval = 250;
      this.signer = signer;
      this.InitializeClients();
    }
    /**
     * Set the signer for this client to use for blockchain transactions from an existing web3 provider.
     * Useful for integrating with MetaMask
     *
     * @see https://github.com/ethers-io/ethers.js/issues/59#issuecomment-358224800
     *
     * @methodGroup Signers
     * @namedParams
     * @param {object} provider - The web3 provider object
     */

  }, {
    key: "SetSignerFromWeb3Provider",
    value: function SetSignerFromWeb3Provider(_ref8) {
      var provider, ethProvider;
      return _regeneratorRuntime.async(function SetSignerFromWeb3Provider$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              provider = _ref8.provider;
              ethProvider = new Ethers.providers.Web3Provider(provider);
              ethProvider.pollingInterval = 250;
              this.signer = ethProvider.getSigner();
              _context4.next = 6;
              return _regeneratorRuntime.awrap(this.signer.getAddress());

            case 6:
              this.signer.address = _context4.sent;
              _context4.next = 9;
              return _regeneratorRuntime.awrap(this.InitializeClients());

            case 9:
            case "end":
              return _context4.stop();
          }
        }
      }, null, this);
    }
    /**
     * Get the account address of the current signer
     *
     * @methodGroup Signers
     * @returns {string} - The address of the current signer
     */

  }, {
    key: "CurrentAccountAddress",
    value: function CurrentAccountAddress() {
      return this.signer ? this.utils.FormatAddress(this.signer.address) : "";
    }
    /**
     * Set the OAuth token for use in state channel calls
     *
     * @param {string} token - The OAuth ID token
     */

  }, {
    key: "SetOauthToken",
    value: function SetOauthToken(_ref9) {
      var token, wallet, signer;
      return _regeneratorRuntime.async(function SetOauthToken$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              token = _ref9.token;
              this.oauthToken = token;
              wallet = this.GenerateWallet();
              signer = wallet.AddAccountFromMnemonic({
                mnemonic: wallet.GenerateMnemonic()
              });
              this.SetSigner({
                signer: signer
              });

            case 5:
            case "end":
              return _context5.stop();
          }
        }
      }, null, this);
    }
    /**
     * Set the signer for this client via OAuth token. The client will exchange the given token
     * for the user's private key using the KMS specified in the configuration.
     *
     * NOTE: The KMS URL(s) must be set in the initial configuration of the client (FromConfigurationUrl)
     *
     * @param {string} token - The OAuth ID
     */

  }, {
    key: "SetSignerFromOauthToken",
    value: function SetSignerFromOauthToken(_ref10) {
      var token, path, httpClient, response, privateKey, wallet, signer;
      return _regeneratorRuntime.async(function SetSignerFromOauthToken$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              token = _ref10.token;

              if (!(!this.kmsURIs || this.kmsURIs.length === 0)) {
                _context6.next = 3;
                break;
              }

              throw Error("Unable to authorize with OAuth token: No KMS URLs set");

            case 3:
              this.oauthToken = token;
              path = "/ks/jwt/wlt";
              httpClient = new HttpClient({
                uris: this.kmsURIs
              });
              _context6.next = 8;
              return _regeneratorRuntime.awrap(this.utils.ResponseToJson(httpClient.Request({
                headers: {
                  Authorization: "Bearer ".concat(token)
                },
                method: "PUT",
                path: path
              })));

            case 8:
              response = _context6.sent;
              privateKey = response["UserSKHex"];
              wallet = this.GenerateWallet();
              signer = wallet.AddAccount({
                privateKey: privateKey
              });
              this.SetSigner({
                signer: signer
              });

            case 13:
            case "end":
              return _context6.stop();
          }
        }
      }, null, this);
    }
    /* FrameClient related */
    // Whitelist of methods allowed to be called using the frame API

  }, {
    key: "FrameAllowedMethods",
    value: function FrameAllowedMethods() {
      var forbiddenMethods = ["constructor", "AccessGroupMembershipMethod", "CallFromFrameMessage", "ClearSigner", "FormatBlockNumbers", "FrameAllowedMethods", "FromConfigurationUrl", "GenerateWallet", "InitializeClients", "Log", "SetSigner", "SetSignerFromWeb3Provider", "ToggleLogging"];
      return Object.getOwnPropertyNames(Object.getPrototypeOf(this)).filter(function (method) {
        return !forbiddenMethods.includes(method);
      });
    } // Call a method specified in a message from a frame

  }, {
    key: "CallFromFrameMessage",
    value: function CallFromFrameMessage(message, Respond) {
      var _this = this;

      var callback, method, methodResults, responseError;
      return _regeneratorRuntime.async(function CallFromFrameMessage$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              if (!(message.type !== "ElvFrameRequest")) {
                _context7.next = 2;
                break;
              }

              return _context7.abrupt("return");

            case 2:
              if (message.callbackId) {
                callback = function callback(result) {
                  Respond(_this.utils.MakeClonable({
                    type: "ElvFrameResponse",
                    requestId: message.callbackId,
                    response: result
                  }));
                };

                message.args.callback = callback;
              }

              _context7.prev = 3;
              method = message.calledMethod;

              if (!(message.module === "userProfileClient")) {
                _context7.next = 13;
                break;
              }

              if (this.userProfileClient.FrameAllowedMethods().includes(method)) {
                _context7.next = 8;
                break;
              }

              throw Error("Invalid user profile method: " + method);

            case 8:
              _context7.next = 10;
              return _regeneratorRuntime.awrap(this.userProfileClient[method](message.args));

            case 10:
              methodResults = _context7.sent;
              _context7.next = 18;
              break;

            case 13:
              if (this.FrameAllowedMethods().includes(method)) {
                _context7.next = 15;
                break;
              }

              throw Error("Invalid method: " + method);

            case 15:
              _context7.next = 17;
              return _regeneratorRuntime.awrap(this[method](message.args));

            case 17:
              methodResults = _context7.sent;

            case 18:
              Respond(this.utils.MakeClonable({
                type: "ElvFrameResponse",
                requestId: message.requestId,
                response: methodResults
              }));
              _context7.next = 27;
              break;

            case 21:
              _context7.prev = 21;
              _context7.t0 = _context7["catch"](3);
              // eslint-disable-next-line no-console
              this.Log("Frame Message Error:\n        Method: ".concat(message.calledMethod, "\n        Arguments: ").concat(JSON.stringify(message.args, null, 2), "\n        Error: ").concat(_typeof(_context7.t0) === "object" ? JSON.stringify(_context7.t0, null, 2) : _context7.t0), true); // eslint-disable-next-line no-console

              console.error(_context7.t0);
              responseError = _context7.t0 instanceof Error ? _context7.t0.message : _context7.t0;
              Respond(this.utils.MakeClonable({
                type: "ElvFrameResponse",
                requestId: message.requestId,
                error: responseError
              }));

            case 27:
            case "end":
              return _context7.stop();
          }
        }
      }, null, this, [[3, 21]]);
    }
  }], [{
    key: "Configuration",
    value: function Configuration(_ref11) {
      var configUrl, _ref11$kmsUrls, kmsUrls, region, uri, fabricInfo, filterHTTPS, fabricURIs, ethereumURIs;

      return _regeneratorRuntime.async(function Configuration$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              configUrl = _ref11.configUrl, _ref11$kmsUrls = _ref11.kmsUrls, kmsUrls = _ref11$kmsUrls === void 0 ? [] : _ref11$kmsUrls, region = _ref11.region;
              _context8.prev = 1;
              uri = new URI(configUrl);

              if (region) {
                uri.addSearch("elvgeo", region);
              }

              _context8.next = 6;
              return _regeneratorRuntime.awrap(Utils.ResponseToJson(HttpClient.Fetch(uri.toString())));

            case 6:
              fabricInfo = _context8.sent;

              // If any HTTPS urls present, throw away HTTP urls so only HTTPS will be used
              filterHTTPS = function filterHTTPS(uri) {
                return uri.toLowerCase().startsWith("https");
              };

              fabricURIs = fabricInfo.network.seed_nodes.fabric_api;

              if (fabricURIs.find(filterHTTPS)) {
                fabricURIs = fabricURIs.filter(filterHTTPS);
              }

              ethereumURIs = fabricInfo.network.seed_nodes.ethereum_api;

              if (ethereumURIs.find(filterHTTPS)) {
                ethereumURIs = ethereumURIs.filter(filterHTTPS);
              }

              return _context8.abrupt("return", {
                nodeId: fabricInfo.node_id,
                contentSpaceId: fabricInfo.qspace.id,
                fabricURIs: fabricURIs,
                ethereumURIs: ethereumURIs,
                kmsURIs: kmsUrls
              });

            case 15:
              _context8.prev = 15;
              _context8.t0 = _context8["catch"](1);
              // eslint-disable-next-line no-console
              console.error("Error retrieving fabric configuration:"); // eslint-disable-next-line no-console

              console.error(_context8.t0);
              throw _context8.t0;

            case 20:
            case "end":
              return _context8.stop();
          }
        }
      }, null, null, [[1, 15]]);
    }
    /**
     * Create a new ElvClient from the specified configuration URL
     *
     * @methodGroup Constructor
     * @namedParams
     * @param {string} configUrl - Full URL to the config endpoint
     * @param {string=} region - Preferred region - the fabric will auto-detect the best region if not specified
     * - Available regions: na-west-north na-west-south na-east eu-west
     * @param {boolean=} noCache=false - If enabled, blockchain transactions will not be cached
     * @param {boolean=} noAuth=false - If enabled, blockchain authorization will not be performed
     *
     * @return {Promise<ElvClient>} - New ElvClient connected to the specified content fabric and blockchain
     */

  }, {
    key: "FromConfigurationUrl",
    value: function FromConfigurationUrl(_ref12) {
      var configUrl, region, _ref12$noCache, noCache, _ref12$noAuth, noAuth, _ref13, contentSpaceId, fabricURIs, ethereumURIs, client;

      return _regeneratorRuntime.async(function FromConfigurationUrl$(_context9) {
        while (1) {
          switch (_context9.prev = _context9.next) {
            case 0:
              configUrl = _ref12.configUrl, region = _ref12.region, _ref12$noCache = _ref12.noCache, noCache = _ref12$noCache === void 0 ? false : _ref12$noCache, _ref12$noAuth = _ref12.noAuth, noAuth = _ref12$noAuth === void 0 ? false : _ref12$noAuth;
              _context9.next = 3;
              return _regeneratorRuntime.awrap(ElvClient.Configuration({
                configUrl: configUrl,
                region: region
              }));

            case 3:
              _ref13 = _context9.sent;
              contentSpaceId = _ref13.contentSpaceId;
              fabricURIs = _ref13.fabricURIs;
              ethereumURIs = _ref13.ethereumURIs;
              client = new ElvClient({
                contentSpaceId: contentSpaceId,
                fabricURIs: fabricURIs,
                ethereumURIs: ethereumURIs,
                noCache: noCache,
                noAuth: noAuth
              });
              client.configUrl = configUrl;
              return _context9.abrupt("return", client);

            case 10:
            case "end":
              return _context9.stop();
          }
        }
      });
    }
  }]);

  return ElvClient;
}();

Object.assign(ElvClient.prototype, require("./client/AccessGroups").access);
Object.assign(ElvClient.prototype, require("./client/ContentAccess"));
Object.assign(ElvClient.prototype, require("./client/Contracts"));
Object.assign(ElvClient.prototype, require("./client/Files").access);
exports.AccessClient = ElvClient;