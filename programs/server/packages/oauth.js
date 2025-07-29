(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var check = Package.check.check;
var Match = Package.check.Match;
var ECMAScript = Package.ecmascript.ECMAScript;
var URL = Package.url.URL;
var URLSearchParams = Package.url.URLSearchParams;
var RoutePolicy = Package.routepolicy.RoutePolicy;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;
var Log = Package.logging.Log;
var fetch = Package.fetch.fetch;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var OAuth, OAuthTest;

var require = meteorInstall({"node_modules":{"meteor":{"oauth":{"oauth_server.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/oauth/oauth_server.js                                                                                   //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
const _excluded = ["headers", "queryParams", "body"];
let _objectSpread;
module.link("@babel/runtime/helpers/objectSpread2", {
  default(v) {
    _objectSpread = v;
  }
}, 0);
let _objectWithoutProperties;
module.link("@babel/runtime/helpers/objectWithoutProperties", {
  default(v) {
    _objectWithoutProperties = v;
  }
}, 1);
let bodyParser;
module.link("body-parser", {
  default(v) {
    bodyParser = v;
  }
}, 0);
OAuth = {};
OAuthTest = {};
RoutePolicy.declare('/_oauth/', 'network');
const registeredServices = {};

// Internal: Maps from service version to handler function. The
// 'oauth1' and 'oauth2' packages manipulate this directly to register
// for callbacks.
OAuth._requestHandlers = {};

/**
/* Register a handler for an OAuth service. The handler will be called
/* when we get an incoming http request on /_oauth/{serviceName}. This
/* handler should use that information to fetch data about the user
/* logging in.
/*
/* @param name {String} e.g. "google", "facebook"
/* @param version {Number} OAuth version (1 or 2)
/* @param urls   For OAuth1 only, specify the service's urls
/* @param handleOauthRequest {Function(oauthBinding|query)}
/*   - (For OAuth1 only) oauthBinding {OAuth1Binding} bound to the appropriate provider
/*   - (For OAuth2 only) query {Object} parameters passed in query string
/*   - return value is:
/*     - {serviceData:, (optional options:)} where serviceData should end
/*       up in the user's services[name] field
/*     - `null` if the user declined to give permissions
*/
OAuth.registerService = (name, version, urls, handleOauthRequest) => {
  if (registeredServices[name]) throw new Error("Already registered the ".concat(name, " OAuth service"));
  registeredServices[name] = {
    serviceName: name,
    version,
    urls,
    handleOauthRequest
  };
};

// For test cleanup.
OAuthTest.unregisterService = name => {
  delete registeredServices[name];
};
OAuth.retrieveCredential = (credentialToken, credentialSecret) => OAuth._retrievePendingCredential(credentialToken, credentialSecret);

// The state parameter is normally generated on the client using
// `btoa`, but for tests we need a version that runs on the server.
//
OAuth._generateState = (loginStyle, credentialToken, redirectUrl) => {
  return Buffer.from(JSON.stringify({
    loginStyle: loginStyle,
    credentialToken: credentialToken,
    redirectUrl: redirectUrl
  })).toString('base64');
};
OAuth._stateFromQuery = query => {
  let string;
  try {
    string = Buffer.from(query.state, 'base64').toString('binary');
  } catch (e) {
    Log.warn("Unable to base64 decode state from OAuth query: ".concat(query.state));
    throw e;
  }
  try {
    return JSON.parse(string);
  } catch (e) {
    Log.warn("Unable to parse state from OAuth query: ".concat(string));
    throw e;
  }
};
OAuth._loginStyleFromQuery = query => {
  let style;
  // For backwards-compatibility for older clients, catch any errors
  // that result from parsing the state parameter. If we can't parse it,
  // set login style to popup by default.
  try {
    style = OAuth._stateFromQuery(query).loginStyle;
  } catch (err) {
    style = "popup";
  }
  if (style !== "popup" && style !== "redirect") {
    throw new Error("Unrecognized login style: ".concat(style));
  }
  return style;
};
OAuth._credentialTokenFromQuery = query => {
  let state;
  // For backwards-compatibility for older clients, catch any errors
  // that result from parsing the state parameter. If we can't parse it,
  // assume that the state parameter's value is the credential token, as
  // it used to be for older clients.
  try {
    state = OAuth._stateFromQuery(query);
  } catch (err) {
    return query.state;
  }
  return state.credentialToken;
};
OAuth._isCordovaFromQuery = query => {
  try {
    return !!OAuth._stateFromQuery(query).isCordova;
  } catch (err) {
    // For backwards-compatibility for older clients, catch any errors
    // that result from parsing the state parameter. If we can't parse
    // it, assume that we are not on Cordova, since older Meteor didn't
    // do Cordova.
    return false;
  }
};

// Checks if the `redirectUrl` matches the app host.
// We export this function so that developers can override this
// behavior to allow apps from external domains to login using the
// redirect OAuth flow.
OAuth._checkRedirectUrlOrigin = redirectUrl => {
  const appHost = Meteor.absoluteUrl();
  const appHostReplacedLocalhost = Meteor.absoluteUrl(undefined, {
    replaceLocalhost: true
  });
  return redirectUrl.substr(0, appHost.length) !== appHost && redirectUrl.substr(0, appHostReplacedLocalhost.length) !== appHostReplacedLocalhost;
};
const middleware = (req, res, next) => Promise.asyncApply(() => {
  let requestData;

  // Make sure to catch any exceptions because otherwise we'd crash
  // the runner
  try {
    const serviceName = oauthServiceName(req);
    if (!serviceName) {
      // not an oauth request. pass to next middleware.
      next();
      return;
    }
    const service = registeredServices[serviceName];

    // Skip everything if there's no service set by the oauth middleware
    if (!service) throw new Error("Unexpected OAuth service ".concat(serviceName));

    // Make sure we're configured
    ensureConfigured(serviceName);
    const handler = OAuth._requestHandlers[service.version];
    if (!handler) throw new Error("Unexpected OAuth version ".concat(service.version));
    if (req.method === 'GET') {
      requestData = req.query;
    } else {
      requestData = req.body;
    }
    Promise.await(handler(service, requestData, res));
  } catch (err) {
    var _requestData;
    // if we got thrown an error, save it off, it will get passed to
    // the appropriate login call (if any) and reported there.
    //
    // The other option would be to display it in the popup tab that
    // is still open at this point, ignoring the 'close' or 'redirect'
    // we were passed. But then the developer wouldn't be able to
    // style the error or react to it in any way.
    if ((_requestData = requestData) !== null && _requestData !== void 0 && _requestData.state && err instanceof Error) {
      try {
        // catch any exceptions to avoid crashing runner
        OAuth._storePendingCredential(OAuth._credentialTokenFromQuery(requestData), err);
      } catch (err) {
        // Ignore the error and just give up. If we failed to store the
        // error, then the login will just fail with a generic error.
        Log.warn("Error in OAuth Server while storing pending login result.\n" + err.stack || err.message);
      }
    }

    // close the popup. because nobody likes them just hanging
    // there.  when someone sees this multiple times they might
    // think to check server logs (we hope?)
    // Catch errors because any exception here will crash the runner.
    try {
      OAuth._endOfLoginResponse(res, {
        query: requestData,
        loginStyle: OAuth._loginStyleFromQuery(requestData),
        error: err
      });
    } catch (err) {
      Log.warn("Error generating end of login response\n" + (err && (err.stack || err.message)));
    }
  }
});

// Listen to incoming OAuth http requests
WebApp.connectHandlers.use('/_oauth', bodyParser.json());
WebApp.connectHandlers.use('/_oauth', bodyParser.urlencoded({
  extended: false
}));
WebApp.connectHandlers.use(middleware);
OAuthTest.middleware = middleware;

// Handle /_oauth/* paths and extract the service name.
//
// @returns {String|null} e.g. "facebook", or null if this isn't an
// oauth request
const oauthServiceName = req => {
  // req.url will be "/_oauth/<service name>" with an optional "?close".
  const i = req.url.indexOf('?');
  let barePath;
  if (i === -1) barePath = req.url;else barePath = req.url.substring(0, i);
  const splitPath = barePath.split('/');

  // Any non-oauth request will continue down the default
  // middlewares.
  if (splitPath[1] !== '_oauth') return null;

  // Find service based on url
  const serviceName = splitPath[2];
  return serviceName;
};

// Make sure we're configured
const ensureConfigured = serviceName => {
  if (!ServiceConfiguration.configurations.findOne({
    service: serviceName
  })) {
    throw new ServiceConfiguration.ConfigError();
  }
};
const isSafe = value => {
  // This matches strings generated by `Random.secret` and
  // `Random.id`.
  return typeof value === "string" && /^[a-zA-Z0-9\-_]+$/.test(value);
};

// Internal: used by the oauth1 and oauth2 packages
OAuth._renderOauthResults = (res, query, credentialSecret) => {
  // For tests, we support the `only_credential_secret_for_test`
  // parameter, which just returns the credential secret without any
  // surrounding HTML. (The test needs to be able to easily grab the
  // secret and use it to log in.)
  //
  // XXX only_credential_secret_for_test could be useful for other
  // things beside tests, like command-line clients. We should give it a
  // real name and serve the credential secret in JSON.

  if (query.only_credential_secret_for_test) {
    res.writeHead(200, {
      'Content-Type': 'text/html'
    });
    res.end(credentialSecret, 'utf-8');
  } else {
    const details = {
      query,
      loginStyle: OAuth._loginStyleFromQuery(query)
    };
    if (query.error) {
      details.error = query.error;
    } else {
      const token = OAuth._credentialTokenFromQuery(query);
      const secret = credentialSecret;
      if (token && secret && isSafe(token) && isSafe(secret)) {
        details.credentials = {
          token: token,
          secret: secret
        };
      } else {
        details.error = "invalid_credential_token_or_secret";
      }
    }
    OAuth._endOfLoginResponse(res, details);
  }
};

// This "template" (not a real Spacebars template, just an HTML file
// with some ##PLACEHOLDER##s) communicates the credential secret back
// to the main window and then closes the popup.
OAuth._endOfPopupResponseTemplate = Assets.getText("end_of_popup_response.html");
OAuth._endOfRedirectResponseTemplate = Assets.getText("end_of_redirect_response.html");

// Renders the end of login response template into some HTML and JavaScript
// that closes the popup or redirects at the end of the OAuth flow.
//
// options are:
//   - loginStyle ("popup" or "redirect")
//   - setCredentialToken (boolean)
//   - credentialToken
//   - credentialSecret
//   - redirectUrl
//   - isCordova (boolean)
//
const renderEndOfLoginResponse = options => {
  // It would be nice to use Blaze here, but it's a little tricky
  // because our mustaches would be inside a <script> tag, and Blaze
  // would treat the <script> tag contents as text (e.g. encode '&' as
  // '&amp;'). So we just do a simple replace.

  const escape = s => {
    if (s) {
      return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/\'/g, "&#x27;").replace(/\//g, "&#x2F;");
    } else {
      return s;
    }
  };

  // Escape everything just to be safe (we've already checked that some
  // of this data -- the token and secret -- are safe).
  const config = {
    setCredentialToken: !!options.setCredentialToken,
    credentialToken: escape(options.credentialToken),
    credentialSecret: escape(options.credentialSecret),
    storagePrefix: escape(OAuth._storageTokenPrefix),
    redirectUrl: escape(options.redirectUrl),
    isCordova: !!options.isCordova
  };
  let template;
  if (options.loginStyle === 'popup') {
    template = OAuth._endOfPopupResponseTemplate;
  } else if (options.loginStyle === 'redirect') {
    template = OAuth._endOfRedirectResponseTemplate;
  } else {
    throw new Error("invalid loginStyle: ".concat(options.loginStyle));
  }
  const result = template.replace(/##CONFIG##/, JSON.stringify(config)).replace(/##ROOT_URL_PATH_PREFIX##/, __meteor_runtime_config__.ROOT_URL_PATH_PREFIX);
  return "<!DOCTYPE html>\n".concat(result);
};

// Writes an HTTP response to the popup window at the end of an OAuth
// login flow. At this point, if the user has successfully authenticated
// to the OAuth server and authorized this app, we communicate the
// credentialToken and credentialSecret to the main window. The main
// window must provide both these values to the DDP `login` method to
// authenticate its DDP connection. After communicating these values to
// the main window, we close the popup.
//
// We export this function so that developers can override this
// behavior, which is particularly useful in, for example, some mobile
// environments where popups and/or `window.opener` don't work. For
// example, an app could override `OAuth._endOfPopupResponse` to put the
// credential token and credential secret in the popup URL for the main
// window to read them there instead of using `window.opener`. If you
// override this function, you take responsibility for writing to the
// request and calling `res.end()` to complete the request.
//
// Arguments:
//   - res: the HTTP response object
//   - details:
//      - query: the query string on the HTTP request
//      - credentials: { token: *, secret: * }. If present, this field
//        indicates that the login was successful. Return these values
//        to the client, who can use them to log in over DDP. If
//        present, the values have been checked against a limited
//        character set and are safe to include in HTML.
//      - error: if present, a string or Error indicating an error that
//        occurred during the login. This can come from the client and
//        so shouldn't be trusted for security decisions or included in
//        the response without sanitizing it first. Only one of `error`
//        or `credentials` should be set.
OAuth._endOfLoginResponse = (res, details) => {
  res.writeHead(200, {
    'Content-Type': 'text/html'
  });
  let redirectUrl;
  if (details.loginStyle === 'redirect') {
    var _Meteor$settings, _Meteor$settings$pack, _Meteor$settings$pack2;
    redirectUrl = OAuth._stateFromQuery(details.query).redirectUrl;
    const appHost = Meteor.absoluteUrl();
    if (!((_Meteor$settings = Meteor.settings) !== null && _Meteor$settings !== void 0 && (_Meteor$settings$pack = _Meteor$settings.packages) !== null && _Meteor$settings$pack !== void 0 && (_Meteor$settings$pack2 = _Meteor$settings$pack.oauth) !== null && _Meteor$settings$pack2 !== void 0 && _Meteor$settings$pack2.disableCheckRedirectUrlOrigin) && OAuth._checkRedirectUrlOrigin(redirectUrl)) {
      details.error = "redirectUrl (".concat(redirectUrl) + ") is not on the same host as the app (".concat(appHost, ")");
      redirectUrl = appHost;
    }
  }
  const isCordova = OAuth._isCordovaFromQuery(details.query);
  if (details.error) {
    Log.warn("Error in OAuth Server: " + (details.error instanceof Error ? details.error.message : details.error));
    res.end(renderEndOfLoginResponse({
      loginStyle: details.loginStyle,
      setCredentialToken: false,
      redirectUrl,
      isCordova
    }), "utf-8");
    return;
  }

  // If we have a credentialSecret, report it back to the parent
  // window, with the corresponding credentialToken. The parent window
  // uses the credentialToken and credentialSecret to log in over DDP.
  res.end(renderEndOfLoginResponse({
    loginStyle: details.loginStyle,
    setCredentialToken: true,
    credentialToken: details.credentials.token,
    credentialSecret: details.credentials.secret,
    redirectUrl,
    isCordova
  }), "utf-8");
};
const OAuthEncryption = Package["oauth-encryption"] && Package["oauth-encryption"].OAuthEncryption;
const usingOAuthEncryption = () => OAuthEncryption && OAuthEncryption.keyIsLoaded();

// Encrypt sensitive service data such as access tokens if the
// "oauth-encryption" package is loaded and the oauth secret key has
// been specified.  Returns the unencrypted plaintext otherwise.
//
// The user id is not specified because the user isn't known yet at
// this point in the oauth authentication process.  After the oauth
// authentication process completes the encrypted service data fields
// will be re-encrypted with the user id included before inserting the
// service data into the user document.
//
OAuth.sealSecret = plaintext => {
  if (usingOAuthEncryption()) return OAuthEncryption.seal(plaintext);else return plaintext;
};

// Unencrypt a service data field, if the "oauth-encryption"
// package is loaded and the field is encrypted.
//
// Throws an error if the "oauth-encryption" package is loaded and the
// field is encrypted, but the oauth secret key hasn't been specified.
//
OAuth.openSecret = (maybeSecret, userId) => {
  if (!Package["oauth-encryption"] || !OAuthEncryption.isSealed(maybeSecret)) return maybeSecret;
  return OAuthEncryption.open(maybeSecret, userId);
};

// Unencrypt fields in the service data object.
//
OAuth.openSecrets = (serviceData, userId) => {
  const result = {};
  Object.keys(serviceData).forEach(key => result[key] = OAuth.openSecret(serviceData[key], userId));
  return result;
};
OAuth._addValuesToQueryParams = function () {
  let values = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  let queryParams = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new URLSearchParams();
  Object.entries(values).forEach(_ref => {
    let [key, value] = _ref;
    queryParams.set(key, "".concat(value));
  });
  return queryParams;
};
OAuth._fetch = function (url) {
  return Promise.asyncApply(() => {
    let method = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'GET';
    let _ref2 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    let {
        headers = {},
        queryParams = {},
        body
      } = _ref2,
      options = _objectWithoutProperties(_ref2, _excluded);
    const urlWithParams = new URL(url);
    OAuth._addValuesToQueryParams(queryParams, urlWithParams.searchParams);
    const requestOptions = _objectSpread(_objectSpread({
      method: method.toUpperCase(),
      headers
    }, body ? {
      body
    } : {}), options);
    return fetch(urlWithParams.toString(), requestOptions);
  });
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"pending_credentials.js":function module(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/oauth/pending_credentials.js                                                                            //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
//
// When an oauth request is made, Meteor receives oauth credentials
// in one browser tab, and temporarily persists them while that
// tab is closed, then retrieves them in the browser tab that
// initiated the credential request.
//
// _pendingCredentials is the storage mechanism used to share the
// credential between the 2 tabs
//

// Collection containing pending credentials of oauth credential requests
// Has key, credential, and createdAt fields.
OAuth._pendingCredentials = new Mongo.Collection("meteor_oauth_pendingCredentials", {
  _preventAutopublish: true
});
OAuth._pendingCredentials.createIndexAsync('key', {
  unique: true
});
OAuth._pendingCredentials.createIndexAsync('credentialSecret');
OAuth._pendingCredentials.createIndexAsync('createdAt');

// Periodically clear old entries that were never retrieved
const _cleanStaleResults = () => {
  // Remove credentials older than 1 minute
  const timeCutoff = new Date();
  timeCutoff.setMinutes(timeCutoff.getMinutes() - 1);
  OAuth._pendingCredentials.removeAsync({
    createdAt: {
      $lt: timeCutoff
    }
  });
};
const _cleanupHandle = Meteor.setInterval(_cleanStaleResults, 60 * 1000);

// Stores the key and credential in the _pendingCredentials collection.
// Will throw an exception if `key` is not a string.
//
// @param key {string}
// @param credential {Object}   The credential to store
// @param credentialSecret {string} A secret that must be presented in
//   addition to the `key` to retrieve the credential
//
OAuth._storePendingCredential = function (key, credential) {
  let credentialSecret = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  check(key, String);
  check(credentialSecret, Match.Maybe(String));
  if (credential instanceof Error) {
    credential = storableError(credential);
  } else {
    credential = OAuth.sealSecret(credential);
  }

  // We do an upsert here instead of an insert in case the user happens
  // to somehow send the same `state` parameter twice during an OAuth
  // login; we don't want a duplicate key error.
  OAuth._pendingCredentials.upsert({
    key
  }, {
    key,
    credential,
    credentialSecret,
    createdAt: new Date()
  });
};

// Retrieves and removes a credential from the _pendingCredentials collection
//
// @param key {string}
// @param credentialSecret {string}
//
OAuth._retrievePendingCredential = function (key) {
  let credentialSecret = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  check(key, String);
  const pendingCredential = OAuth._pendingCredentials.findOne({
    key,
    credentialSecret
  });
  if (pendingCredential) {
    OAuth._pendingCredentials.removeAsync({
      _id: pendingCredential._id
    });
    if (pendingCredential.credential.error) return recreateError(pendingCredential.credential.error);else return OAuth.openSecret(pendingCredential.credential);
  } else {
    return undefined;
  }
};

// Convert an Error into an object that can be stored in mongo
// Note: A Meteor.Error is reconstructed as a Meteor.Error
// All other error classes are reconstructed as a plain Error.
// TODO: Can we do this more simply with EJSON?
const storableError = error => {
  const plainObject = {};
  Object.getOwnPropertyNames(error).forEach(key => plainObject[key] = error[key]);

  // Keep track of whether it's a Meteor.Error
  if (error instanceof Meteor.Error) {
    plainObject['meteorError'] = true;
  }
  return {
    error: plainObject
  };
};

// Create an error from the error format stored in mongo
const recreateError = errorDoc => {
  let error;
  if (errorDoc.meteorError) {
    error = new Meteor.Error();
    delete errorDoc.meteorError;
  } else {
    error = new Error();
  }
  Object.getOwnPropertyNames(errorDoc).forEach(key => error[key] = errorDoc[key]);
  return error;
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"oauth_common.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/oauth/oauth_common.js                                                                                   //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let _objectSpread;
module.link("@babel/runtime/helpers/objectSpread2", {
  default(v) {
    _objectSpread = v;
  }
}, 0);
OAuth._storageTokenPrefix = "Meteor.oauth.credentialSecret-";
OAuth._redirectUri = (serviceName, config, params, absoluteUrlOptions) => {
  // Clone because we're going to mutate 'params'. The 'cordova' and
  // 'android' parameters are only used for picking the host of the
  // redirect URL, and not actually included in the redirect URL itself.
  let isCordova = false;
  let isAndroid = false;
  if (params) {
    params = _objectSpread({}, params);
    isCordova = params.cordova;
    isAndroid = params.android;
    delete params.cordova;
    delete params.android;
    if (Object.keys(params).length === 0) {
      params = undefined;
    }
  }
  if (Meteor.isServer && isCordova) {
    const url = Npm.require('url');
    let rootUrl = process.env.MOBILE_ROOT_URL || __meteor_runtime_config__.ROOT_URL;
    if (isAndroid) {
      // Match the replace that we do in cordova boilerplate
      // (boilerplate-generator package).
      // XXX Maybe we should put this in a separate package or something
      // that is used here and by boilerplate-generator? Or maybe
      // `Meteor.absoluteUrl` should know how to do this?
      const parsedRootUrl = url.parse(rootUrl);
      if (parsedRootUrl.hostname === "localhost") {
        parsedRootUrl.hostname = "10.0.2.2";
        delete parsedRootUrl.host;
      }
      rootUrl = url.format(parsedRootUrl);
    }
    absoluteUrlOptions = _objectSpread(_objectSpread({}, absoluteUrlOptions), {}, {
      // For Cordova clients, redirect to the special Cordova root url
      // (likely a local IP in development mode).
      rootUrl
    });
  }
  return URL._constructUrl(Meteor.absoluteUrl("_oauth/".concat(serviceName), absoluteUrlOptions), null, params);
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"node_modules":{"body-parser":{"package.json":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// node_modules/meteor/oauth/node_modules/body-parser/package.json                                                  //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.exports = {
  "name": "body-parser",
  "version": "1.19.0"
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// node_modules/meteor/oauth/node_modules/body-parser/index.js                                                      //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.useNode();
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/oauth/oauth_server.js");
require("/node_modules/meteor/oauth/pending_credentials.js");
require("/node_modules/meteor/oauth/oauth_common.js");

/* Exports */
Package._define("oauth", {
  OAuth: OAuth,
  OAuthTest: OAuthTest
});

})();

//# sourceURL=meteor://💻app/packages/oauth.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2F1dGgvb2F1dGhfc2VydmVyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9vYXV0aC9wZW5kaW5nX2NyZWRlbnRpYWxzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9vYXV0aC9vYXV0aF9jb21tb24uanMiXSwibmFtZXMiOlsiX29iamVjdFNwcmVhZCIsIm1vZHVsZSIsImxpbmsiLCJkZWZhdWx0IiwidiIsIl9vYmplY3RXaXRob3V0UHJvcGVydGllcyIsImJvZHlQYXJzZXIiLCJPQXV0aCIsIk9BdXRoVGVzdCIsIlJvdXRlUG9saWN5IiwiZGVjbGFyZSIsInJlZ2lzdGVyZWRTZXJ2aWNlcyIsIl9yZXF1ZXN0SGFuZGxlcnMiLCJyZWdpc3RlclNlcnZpY2UiLCJuYW1lIiwidmVyc2lvbiIsInVybHMiLCJoYW5kbGVPYXV0aFJlcXVlc3QiLCJFcnJvciIsImNvbmNhdCIsInNlcnZpY2VOYW1lIiwidW5yZWdpc3RlclNlcnZpY2UiLCJyZXRyaWV2ZUNyZWRlbnRpYWwiLCJjcmVkZW50aWFsVG9rZW4iLCJjcmVkZW50aWFsU2VjcmV0IiwiX3JldHJpZXZlUGVuZGluZ0NyZWRlbnRpYWwiLCJfZ2VuZXJhdGVTdGF0ZSIsImxvZ2luU3R5bGUiLCJyZWRpcmVjdFVybCIsIkJ1ZmZlciIsImZyb20iLCJKU09OIiwic3RyaW5naWZ5IiwidG9TdHJpbmciLCJfc3RhdGVGcm9tUXVlcnkiLCJxdWVyeSIsInN0cmluZyIsInN0YXRlIiwiZSIsIkxvZyIsIndhcm4iLCJwYXJzZSIsIl9sb2dpblN0eWxlRnJvbVF1ZXJ5Iiwic3R5bGUiLCJlcnIiLCJfY3JlZGVudGlhbFRva2VuRnJvbVF1ZXJ5IiwiX2lzQ29yZG92YUZyb21RdWVyeSIsImlzQ29yZG92YSIsIl9jaGVja1JlZGlyZWN0VXJsT3JpZ2luIiwiYXBwSG9zdCIsIk1ldGVvciIsImFic29sdXRlVXJsIiwiYXBwSG9zdFJlcGxhY2VkTG9jYWxob3N0IiwidW5kZWZpbmVkIiwicmVwbGFjZUxvY2FsaG9zdCIsInN1YnN0ciIsImxlbmd0aCIsIm1pZGRsZXdhcmUiLCJyZXEiLCJyZXMiLCJuZXh0IiwiUHJvbWlzZSIsImFzeW5jQXBwbHkiLCJyZXF1ZXN0RGF0YSIsIm9hdXRoU2VydmljZU5hbWUiLCJzZXJ2aWNlIiwiZW5zdXJlQ29uZmlndXJlZCIsImhhbmRsZXIiLCJtZXRob2QiLCJib2R5IiwiYXdhaXQiLCJfcmVxdWVzdERhdGEiLCJfc3RvcmVQZW5kaW5nQ3JlZGVudGlhbCIsInN0YWNrIiwibWVzc2FnZSIsIl9lbmRPZkxvZ2luUmVzcG9uc2UiLCJlcnJvciIsIldlYkFwcCIsImNvbm5lY3RIYW5kbGVycyIsInVzZSIsImpzb24iLCJ1cmxlbmNvZGVkIiwiZXh0ZW5kZWQiLCJpIiwidXJsIiwiaW5kZXhPZiIsImJhcmVQYXRoIiwic3Vic3RyaW5nIiwic3BsaXRQYXRoIiwic3BsaXQiLCJTZXJ2aWNlQ29uZmlndXJhdGlvbiIsImNvbmZpZ3VyYXRpb25zIiwiZmluZE9uZSIsIkNvbmZpZ0Vycm9yIiwiaXNTYWZlIiwidmFsdWUiLCJ0ZXN0IiwiX3JlbmRlck9hdXRoUmVzdWx0cyIsIm9ubHlfY3JlZGVudGlhbF9zZWNyZXRfZm9yX3Rlc3QiLCJ3cml0ZUhlYWQiLCJlbmQiLCJkZXRhaWxzIiwidG9rZW4iLCJzZWNyZXQiLCJjcmVkZW50aWFscyIsIl9lbmRPZlBvcHVwUmVzcG9uc2VUZW1wbGF0ZSIsIkFzc2V0cyIsImdldFRleHQiLCJfZW5kT2ZSZWRpcmVjdFJlc3BvbnNlVGVtcGxhdGUiLCJyZW5kZXJFbmRPZkxvZ2luUmVzcG9uc2UiLCJvcHRpb25zIiwiZXNjYXBlIiwicyIsInJlcGxhY2UiLCJjb25maWciLCJzZXRDcmVkZW50aWFsVG9rZW4iLCJzdG9yYWdlUHJlZml4IiwiX3N0b3JhZ2VUb2tlblByZWZpeCIsInRlbXBsYXRlIiwicmVzdWx0IiwiX19tZXRlb3JfcnVudGltZV9jb25maWdfXyIsIlJPT1RfVVJMX1BBVEhfUFJFRklYIiwiX01ldGVvciRzZXR0aW5ncyIsIl9NZXRlb3Ikc2V0dGluZ3MkcGFjayIsIl9NZXRlb3Ikc2V0dGluZ3MkcGFjazIiLCJzZXR0aW5ncyIsInBhY2thZ2VzIiwib2F1dGgiLCJkaXNhYmxlQ2hlY2tSZWRpcmVjdFVybE9yaWdpbiIsIk9BdXRoRW5jcnlwdGlvbiIsIlBhY2thZ2UiLCJ1c2luZ09BdXRoRW5jcnlwdGlvbiIsImtleUlzTG9hZGVkIiwic2VhbFNlY3JldCIsInBsYWludGV4dCIsInNlYWwiLCJvcGVuU2VjcmV0IiwibWF5YmVTZWNyZXQiLCJ1c2VySWQiLCJpc1NlYWxlZCIsIm9wZW4iLCJvcGVuU2VjcmV0cyIsInNlcnZpY2VEYXRhIiwiT2JqZWN0Iiwia2V5cyIsImZvckVhY2giLCJrZXkiLCJfYWRkVmFsdWVzVG9RdWVyeVBhcmFtcyIsInZhbHVlcyIsImFyZ3VtZW50cyIsInF1ZXJ5UGFyYW1zIiwiVVJMU2VhcmNoUGFyYW1zIiwiZW50cmllcyIsIl9yZWYiLCJzZXQiLCJfZmV0Y2giLCJfcmVmMiIsImhlYWRlcnMiLCJfZXhjbHVkZWQiLCJ1cmxXaXRoUGFyYW1zIiwiVVJMIiwic2VhcmNoUGFyYW1zIiwicmVxdWVzdE9wdGlvbnMiLCJ0b1VwcGVyQ2FzZSIsImZldGNoIiwiX3BlbmRpbmdDcmVkZW50aWFscyIsIk1vbmdvIiwiQ29sbGVjdGlvbiIsIl9wcmV2ZW50QXV0b3B1Ymxpc2giLCJjcmVhdGVJbmRleEFzeW5jIiwidW5pcXVlIiwiX2NsZWFuU3RhbGVSZXN1bHRzIiwidGltZUN1dG9mZiIsIkRhdGUiLCJzZXRNaW51dGVzIiwiZ2V0TWludXRlcyIsInJlbW92ZUFzeW5jIiwiY3JlYXRlZEF0IiwiJGx0IiwiX2NsZWFudXBIYW5kbGUiLCJzZXRJbnRlcnZhbCIsImNyZWRlbnRpYWwiLCJjaGVjayIsIlN0cmluZyIsIk1hdGNoIiwiTWF5YmUiLCJzdG9yYWJsZUVycm9yIiwidXBzZXJ0IiwicGVuZGluZ0NyZWRlbnRpYWwiLCJfaWQiLCJyZWNyZWF0ZUVycm9yIiwicGxhaW5PYmplY3QiLCJnZXRPd25Qcm9wZXJ0eU5hbWVzIiwiZXJyb3JEb2MiLCJtZXRlb3JFcnJvciIsIl9yZWRpcmVjdFVyaSIsInBhcmFtcyIsImFic29sdXRlVXJsT3B0aW9ucyIsImlzQW5kcm9pZCIsImNvcmRvdmEiLCJhbmRyb2lkIiwiaXNTZXJ2ZXIiLCJOcG0iLCJyZXF1aXJlIiwicm9vdFVybCIsInByb2Nlc3MiLCJlbnYiLCJNT0JJTEVfUk9PVF9VUkwiLCJST09UX1VSTCIsInBhcnNlZFJvb3RVcmwiLCJob3N0bmFtZSIsImhvc3QiLCJmb3JtYXQiLCJfY29uc3RydWN0VXJsIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUlBLGFBQWE7QUFBQ0MsTUFBTSxDQUFDQyxJQUFJLENBQUMsc0NBQXNDLEVBQUM7RUFBQ0MsT0FBT0EsQ0FBQ0MsQ0FBQyxFQUFDO0lBQUNKLGFBQWEsR0FBQ0ksQ0FBQztFQUFBO0FBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztBQUFDLElBQUlDLHdCQUF3QjtBQUFDSixNQUFNLENBQUNDLElBQUksQ0FBQyxnREFBZ0QsRUFBQztFQUFDQyxPQUFPQSxDQUFDQyxDQUFDLEVBQUM7SUFBQ0Msd0JBQXdCLEdBQUNELENBQUM7RUFBQTtBQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7QUFBM08sSUFBSUUsVUFBVTtBQUFDTCxNQUFNLENBQUNDLElBQUksQ0FBQyxhQUFhLEVBQUM7RUFBQ0MsT0FBT0EsQ0FBQ0MsQ0FBQyxFQUFDO0lBQUNFLFVBQVUsR0FBQ0YsQ0FBQztFQUFBO0FBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztBQUV0RUcsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUNWQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO0FBRWRDLFdBQVcsQ0FBQ0MsT0FBTyxDQUFDLFVBQVUsRUFBRSxTQUFTLENBQUM7QUFFMUMsTUFBTUMsa0JBQWtCLEdBQUcsQ0FBQyxDQUFDOztBQUU3QjtBQUNBO0FBQ0E7QUFDQUosS0FBSyxDQUFD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TSxLQUFLLENBQUMsRUFBRTtNQUNwQzRJLE1BQU0sR0FBRy9JLFNBQVM7SUFDcEI7RUFDRjtFQUVBLElBQUlILE1BQU0sQ0FBQ3VKLFFBQVEsSUFBSTFKLFNBQVMsRUFBRTtJQUNoQyxNQUFNcUMsR0FBRyxHQUFHc0gsR0FBRyxDQUFDQyxPQUFPLENBQUMsS0FBSyxDQUFDO0lBQzlCLElBQUlDLE9BQU8sR0FBR0MsT0FBTyxDQUFDQyxHQUFHLENBQUNDLGVBQWUsSUFDbkN2Rix5QkFBeUIsQ0FBQ3dGLFFBQVE7SUFFeEMsSUFBSVYsU0FBUyxFQUFFO01BQ2I7TUFDQTtNQUNBO01BQ0E7TUFDQTtNQUNBLE1BQU1XLGFBQWEsR0FBRzdILEdBQUcsQ0FBQzNDLEtBQUssQ0FBQ21LLE9BQU8sQ0FBQztNQUN4QyxJQUFJSyxhQUFhLENBQUNDLFFBQVEsS0FBSyxXQUFXLEVBQUU7UUFDMUNELGFBQWEsQ0FBQ0MsUUFBUSxHQUFHLFVBQVU7UUFDbkMsT0FBT0QsYUFBYSxDQUFDRSxJQUFJO01BQzNCO01BQ0FQLE9BQU8sR0FBR3hILEdBQUcsQ0FBQ2dJLE1BQU0sQ0FBQ0gsYUFBYSxDQUFDO0lBQ3JDO0lBRUFaLGtCQUFrQixHQUFBck0sYUFBQSxDQUFBQSxhQUFBLEtBQ2JxTSxrQkFBa0I7TUFDckI7TUFDQTtNQUNBTztJQUFPLEVBQ1I7RUFDSDtFQUVBLE9BQU81QyxHQUFHLENBQUNxRCxhQUFhLENBQ3RCbkssTUFBTSxDQUFDQyxXQUFXLFdBQUFoQyxNQUFBLENBQVdDLFdBQVcsR0FBSWlMLGtCQUFrQixDQUFDLEVBQy9ELElBQUksRUFDSkQsTUFBTSxDQUFDO0FBQ1gsQ0FBQyxDIiwiZmlsZSI6Ii9wYWNrYWdlcy9vYXV0aC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBib2R5UGFyc2VyIGZyb20gJ2JvZHktcGFyc2VyJztcblxuT0F1dGggPSB7fTtcbk9BdXRoVGVzdCA9IHt9O1xuXG5Sb3V0ZVBvbGljeS5kZWNsYXJlKCcvX29hdXRoLycsICduZXR3b3JrJyk7XG5cbmNvbnN0IHJlZ2lzdGVyZWRTZXJ2aWNlcyA9IHt9O1xuXG4vLyBJbnRlcm5hbDogTWFwcyBmcm9tIHNlcnZpY2UgdmVyc2lvbiB0byBoYW5kbGVyIGZ1bmN0aW9uLiBUaGVcbi8vICdvYXV0aDEnIGFuZCAnb2F1dGgyJyBwYWNrYWdlcyBtYW5pcHVsYXRlIHRoaXMgZGlyZWN0bHkgdG8gcmVnaXN0ZXJcbi8vIGZvciBjYWxsYmFja3MuXG5PQXV0aC5fcmVxdWVzdEhhbmRsZXJzID0ge307XG5cblxuLyoqXG4vKiBSZWdpc3RlciBhIGhhbmRsZXIgZm9yIGFuIE9BdXRoIHNlcnZpY2UuIFRoZSBoYW5kbGVyIHdpbGwgYmUgY2FsbGVkXG4vKiB3aGVuIHdlIGdldCBhbiBpbmNvbWluZyBodHRwIHJlcXVlc3Qgb24gL19vYXV0aC97c2VydmljZU5hbWV9LiBUaGlzXG4vKiBoYW5kbGVyIHNob3VsZCB1c2UgdGhhdCBpbmZvcm1hdGlvbiB0byBmZXRjaCBkYXRhIGFib3V0IHRoZSB1c2VyXG4vKiBsb2dnaW5nIGluLlxuLypcbi8qIEBwYXJhbSBuYW1lIHtTdHJpbmd9IGUuZy4gXCJnb29nbGVcIiwgXCJmYWNlYm9va1wiXG4vKiBAcGFyYW0gdmVyc2lvbiB7TnVtYmVyfSBPQXV0aCB2ZXJzaW9uICgxIG9yIDIpXG4vKiBAcGFyYW0gdXJscyAgIEZvciBPQXV0aDEgb25seSwgc3BlY2lmeSB0aGUgc2VydmljZSdzIHVybHNcbi8qIEBwYXJhbSBoYW5kbGVPYXV0aFJlcXVlc3Qge0Z1bmN0aW9uKG9hdXRoQmluZGluZ3xxdWVyeSl9XG4vKiAgIC0gKEZvciBPQXV0aDEgb25seSkgb2F1dGhCaW5kaW5nIHtPQXV0aDFCaW5kaW5nfSBib3VuZCB0byB0aGUgYXBwcm9wcmlhdGUgcHJvdmlkZXJcbi8qICAgLSAoRm9yIE9BdXRoMiBvbmx5KSBxdWVyeSB7T2JqZWN0fSBwYXJhbWV0ZXJzIHBhc3NlZCBpbiBxdWVyeSBzdHJpbmdcbi8qICAgLSByZXR1cm4gdmFsdWUgaXM6XG4vKiAgICAgLSB7c2VydmljZURhdGE6LCAob3B0aW9uYWwgb3B0aW9uczopfSB3aGVyZSBzZXJ2aWNlRGF0YSBzaG91bGQgZW5kXG4vKiAgICAgICB1cCBpbiB0aGUgdXNlcidzIHNlcnZpY2VzW25hbWVdIGZpZWxkXG4vKiAgICAgLSBgbnVsbGAgaWYgdGhlIHVzZXIgZGVjbGluZWQgdG8gZ2l2ZSBwZXJtaXNzaW9uc1xuKi9cbk9BdXRoLnJlZ2lzdGVyU2VydmljZSA9IChuYW1lLCB2ZXJzaW9uLCB1cmxzLCBoYW5kbGVPYXV0aFJlcXVlc3QpID0+IHtcbiAgaWYgKHJlZ2lzdGVyZWRTZXJ2aWNlc1tuYW1lXSlcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEFscmVhZHkgcmVnaXN0ZXJlZCB0aGUgJHtuYW1lfSBPQXV0aCBzZXJ2aWNlYCk7XG5cbiAgcmVnaXN0ZXJlZFNlcnZpY2VzW25hbWVdID0ge1xuICAgIHNlcnZpY2VOYW1lOiBuYW1lLFxuICAgIHZlcnNpb24sXG4gICAgdXJscyxcbiAgICBoYW5kbGVPYXV0aFJlcXVlc3QsXG4gIH07XG59O1xuXG4vLyBGb3IgdGVzdCBjbGVhbnVwLlxuT0F1dGhUZXN0LnVucmVnaXN0ZXJTZXJ2aWNlID0gbmFtZSA9PiB7XG4gIGRlbGV0ZSByZWdpc3RlcmVkU2VydmljZXNbbmFtZV07XG59O1xuXG5cbk9BdXRoLnJldHJpZXZlQ3JlZGVudGlhbCA9IChjcmVkZW50aWFsVG9rZW4sIGNyZWRlbnRpYWxTZWNyZXQpID0+XG4gIE9BdXRoLl9yZXRyaWV2ZVBlbmRpbmdDcmVkZW50aWFsKGNyZWRlbnRpYWxUb2tlbiwgY3JlZGVudGlhbFNlY3JldCk7XG5cblxuLy8gVGhlIHN0YXRlIHBhcmFtZXRlciBpcyBub3JtYWxseSBnZW5lcmF0ZWQgb24gdGhlIGNsaWVudCB1c2luZ1xuLy8gYGJ0b2FgLCBidXQgZm9yIHRlc3RzIHdlIG5lZWQgYSB2ZXJzaW9uIHRoYXQgcnVucyBvbiB0aGUgc2VydmVyLlxuLy9cbk9BdXRoLl9nZW5lcmF0ZVN0YXRlID0gKGxvZ2luU3R5bGUsIGNyZWRlbnRpYWxUb2tlbiwgcmVkaXJlY3RVcmwpID0+IHtcbiAgcmV0dXJuIEJ1ZmZlci5mcm9tKEpTT04uc3RyaW5naWZ5KHtcbiAgICBsb2dpblN0eWxlOiBsb2dpblN0eWxlLFxuICAgIGNyZWRlbnRpYWxUb2tlbjogY3JlZGVudGlhbFRva2VuLFxuICAgIHJlZGlyZWN0VXJsOiByZWRpcmVjdFVybH0pKS50b1N0cmluZygnYmFzZTY0Jyk7XG59O1xuXG5PQXV0aC5fc3RhdGVGcm9tUXVlcnkgPSBxdWVyeSA9PiB7XG4gIGxldCBzdHJpbmc7XG4gIHRyeSB7XG4gICAgc3RyaW5nID0gQnVmZmVyLmZyb20ocXVlcnkuc3RhdGUsICdiYXNlNjQnKS50b1N0cmluZygnYmluYXJ5Jyk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBMb2cud2FybihgVW5hYmxlIHRvIGJhc2U2NCBkZWNvZGUgc3RhdGUgZnJvbSBPQXV0aCBxdWVyeTogJHtxdWVyeS5zdGF0ZX1gKTtcbiAgICB0aHJvdyBlO1xuICB9XG5cbiAgdHJ5IHtcbiAgICByZXR1cm4gSlNPTi5wYXJzZShzdHJpbmcpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgTG9nLndhcm4oYFVuYWJsZSB0byBwYXJzZSBzdGF0ZSBmcm9tIE9BdXRoIHF1ZXJ5OiAke3N0cmluZ31gKTtcbiAgICB0aHJvdyBlO1xuICB9XG59O1xuXG5PQXV0aC5fbG9naW5TdHlsZUZyb21RdWVyeSA9IHF1ZXJ5ID0+IHtcbiAgbGV0IHN0eWxlO1xuICAvLyBGb3IgYmFja3dhcmRzLWNvbXBhdGliaWxpdHkgZm9yIG9sZGVyIGNsaWVudHMsIGNhdGNoIGFueSBlcnJvcnNcbiAgLy8gdGhhdCByZXN1bHQgZnJvbSBwYXJzaW5nIHRoZSBzdGF0ZSBwYXJhbWV0ZXIuIElmIHdlIGNhbid0IHBhcnNlIGl0LFxuICAvLyBzZXQgbG9naW4gc3R5bGUgdG8gcG9wdXAgYnkgZGVmYXVsdC5cbiAgdHJ5IHtcbiAgICBzdHlsZSA9IE9BdXRoLl9zdGF0ZUZyb21RdWVyeShxdWVyeSkubG9naW5TdHlsZTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgc3R5bGUgPSBcInBvcHVwXCI7XG4gIH1cbiAgaWYgKHN0eWxlICE9PSBcInBvcHVwXCIgJiYgc3R5bGUgIT09IFwicmVkaXJlY3RcIikge1xuICAgIHRocm93IG5ldyBFcnJvcihgVW5yZWNvZ25pemVkIGxvZ2luIHN0eWxlOiAke3N0eWxlfWApO1xuICB9XG4gIHJldHVybiBzdHlsZTtcbn07XG5cbk9BdXRoLl9jcmVkZW50aWFsVG9rZW5Gcm9tUXVlcnkgPSBxdWVyeSA9PiB7XG4gIGxldCBzdGF0ZTtcbiAgLy8gRm9yIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5IGZvciBvbGRlciBjbGllbnRzLCBjYXRjaCBhbnkgZXJyb3JzXG4gIC8vIHRoYXQgcmVzdWx0IGZyb20gcGFyc2luZyB0aGUgc3RhdGUgcGFyYW1ldGVyLiBJZiB3ZSBjYW4ndCBwYXJzZSBpdCxcbiAgLy8gYXNzdW1lIHRoYXQgdGhlIHN0YXRlIHBhcmFtZXRlcidzIHZhbHVlIGlzIHRoZSBjcmVkZW50aWFsIHRva2VuLCBhc1xuICAvLyBpdCB1c2VkIHRvIGJlIGZvciBvbGRlciBjbGllbnRzLlxuICB0cnkge1xuICAgIHN0YXRlID0gT0F1dGguX3N0YXRlRnJvbVF1ZXJ5KHF1ZXJ5KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIHF1ZXJ5LnN0YXRlO1xuICB9XG4gIHJldHVybiBzdGF0ZS5jcmVkZW50aWFsVG9rZW47XG59O1xuXG5PQXV0aC5faXNDb3Jkb3ZhRnJvbVF1ZXJ5ID0gcXVlcnkgPT4ge1xuICB0cnkge1xuICAgIHJldHVybiAhISBPQXV0aC5fc3RhdGVGcm9tUXVlcnkocXVlcnkpLmlzQ29yZG92YTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgLy8gRm9yIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5IGZvciBvbGRlciBjbGllbnRzLCBjYXRjaCBhbnkgZXJyb3JzXG4gICAgLy8gdGhhdCByZXN1bHQgZnJvbSBwYXJzaW5nIHRoZSBzdGF0ZSBwYXJhbWV0ZXIuIElmIHdlIGNhbid0IHBhcnNlXG4gICAgLy8gaXQsIGFzc3VtZSB0aGF0IHdlIGFyZSBub3Qgb24gQ29yZG92YSwgc2luY2Ugb2xkZXIgTWV0ZW9yIGRpZG4ndFxuICAgIC8vIGRvIENvcmRvdmEuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59O1xuXG4vLyBDaGVja3MgaWYgdGhlIGByZWRpcmVjdFVybGAgbWF0Y2hlcyB0aGUgYXBwIGhvc3QuXG4vLyBXZSBleHBvcnQgdGhpcyBmdW5jdGlvbiBzbyB0aGF0IGRldmVsb3BlcnMgY2FuIG92ZXJyaWRlIHRoaXNcbi8vIGJlaGF2aW9yIHRvIGFsbG93IGFwcHMgZnJvbSBleHRlcm5hbCBkb21haW5zIHRvIGxvZ2luIHVzaW5nIHRoZVxuLy8gcmVkaXJlY3QgT0F1dGggZmxvdy5cbk9BdXRoLl9jaGVja1JlZGlyZWN0VXJsT3JpZ2luID0gcmVkaXJlY3RVcmwgPT4ge1xuICBjb25zdCBhcHBIb3N0ID0gTWV0ZW9yLmFic29sdXRlVXJsKCk7XG4gIGNvbnN0IGFwcEhvc3RSZXBsYWNlZExvY2FsaG9zdCA9IE1ldGVvci5hYnNvbHV0ZVVybCh1bmRlZmluZWQsIHtcbiAgICByZXBsYWNlTG9jYWxob3N0OiB0cnVlXG4gIH0pO1xuICByZXR1cm4gKFxuICAgIHJlZGlyZWN0VXJsLnN1YnN0cigwLCBhcHBIb3N0Lmxlbmd0aCkgIT09IGFwcEhvc3QgJiZcbiAgICByZWRpcmVjdFVybC5zdWJzdHIoMCwgYXBwSG9zdFJlcGxhY2VkTG9jYWxob3N0Lmxlbmd0aCkgIT09IGFwcEhvc3RSZXBsYWNlZExvY2FsaG9zdFxuICApO1xufTtcblxuY29uc3QgbWlkZGxld2FyZSA9IGFzeW5jIChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICBsZXQgcmVxdWVzdERhdGE7XG5cbiAgLy8gTWFrZSBzdXJlIHRvIGNhdGNoIGFueSBleGNlcHRpb25zIGJlY2F1c2Ugb3RoZXJ3aXNlIHdlJ2QgY3Jhc2hcbiAgLy8gdGhlIHJ1bm5lclxuICB0cnkge1xuICAgIGNvbnN0IHNlcnZpY2VOYW1lID0gb2F1dGhTZXJ2aWNlTmFtZShyZXEpO1xuICAgIGlmICghc2VydmljZU5hbWUpIHtcbiAgICAgIC8vIG5vdCBhbiBvYXV0aCByZXF1ZXN0LiBwYXNzIHRvIG5leHQgbWlkZGxld2FyZS5cbiAgICAgIG5leHQoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBzZXJ2aWNlID0gcmVnaXN0ZXJlZFNlcnZpY2VzW3NlcnZpY2VOYW1lXTtcblxuICAgIC8vIFNraXAgZXZlcnl0aGluZyBpZiB0aGVyZSdzIG5vIHNlcnZpY2Ugc2V0IGJ5IHRoZSBvYXV0aCBtaWRkbGV3YXJlXG4gICAgaWYgKCFzZXJ2aWNlKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmV4cGVjdGVkIE9BdXRoIHNlcnZpY2UgJHtzZXJ2aWNlTmFtZX1gKTtcblxuICAgIC8vIE1ha2Ugc3VyZSB3ZSdyZSBjb25maWd1cmVkXG4gICAgZW5zdXJlQ29uZmlndXJlZChzZXJ2aWNlTmFtZSk7XG5cbiAgICBjb25zdCBoYW5kbGVyID0gT0F1dGguX3JlcXVlc3RIYW5kbGVyc1tzZXJ2aWNlLnZlcnNpb25dO1xuICAgIGlmICghaGFuZGxlcilcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5leHBlY3RlZCBPQXV0aCB2ZXJzaW9uICR7c2VydmljZS52ZXJzaW9ufWApO1xuXG4gICAgaWYgKHJlcS5tZXRob2QgPT09ICdHRVQnKSB7XG4gICAgICByZXF1ZXN0RGF0YSA9IHJlcS5xdWVyeTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVxdWVzdERhdGEgPSByZXEuYm9keTtcbiAgICB9XG5cbiAgICBhd2FpdCBoYW5kbGVyKHNlcnZpY2UsIHJlcXVlc3REYXRhLCByZXMpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICAvLyBpZiB3ZSBnb3QgdGhyb3duIGFuIGVycm9yLCBzYXZlIGl0IG9mZiwgaXQgd2lsbCBnZXQgcGFzc2VkIHRvXG4gICAgLy8gdGhlIGFwcHJvcHJpYXRlIGxvZ2luIGNhbGwgKGlmIGFueSkgYW5kIHJlcG9ydGVkIHRoZXJlLlxuICAgIC8vXG4gICAgLy8gVGhlIG90aGVyIG9wdGlvbiB3b3VsZCBiZSB0byBkaXNwbGF5IGl0IGluIHRoZSBwb3B1cCB0YWIgdGhhdFxuICAgIC8vIGlzIHN0aWxsIG9wZW4gYXQgdGhpcyBwb2ludCwgaWdub3JpbmcgdGhlICdjbG9zZScgb3IgJ3JlZGlyZWN0J1xuICAgIC8vIHdlIHdlcmUgcGFzc2VkLiBCdXQgdGhlbiB0aGUgZGV2ZWxvcGVyIHdvdWxkbid0IGJlIGFibGUgdG9cbiAgICAvLyBzdHlsZSB0aGUgZXJyb3Igb3IgcmVhY3QgdG8gaXQgaW4gYW55IHdheS5cbiAgICBpZiAocmVxdWVzdERhdGE/LnN0YXRlICYmIGVyciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICB0cnkgeyAvLyBjYXRjaCBhbnkgZXhjZXB0aW9ucyB0byBhdm9pZCBjcmFzaGluZyBydW5uZXJcbiAgICAgICAgT0F1dGguX3N0b3JlUGVuZGluZ0NyZWRlbnRpYWwoT0F1dGguX2NyZWRlbnRpYWxUb2tlbkZyb21RdWVyeShyZXF1ZXN0RGF0YSksIGVycik7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgLy8gSWdub3JlIHRoZSBlcnJvciBhbmQganVzdCBnaXZlIHVwLiBJZiB3ZSBmYWlsZWQgdG8gc3RvcmUgdGhlXG4gICAgICAgIC8vIGVycm9yLCB0aGVuIHRoZSBsb2dpbiB3aWxsIGp1c3QgZmFpbCB3aXRoIGEgZ2VuZXJpYyBlcnJvci5cbiAgICAgICAgTG9nLndhcm4oXCJFcnJvciBpbiBPQXV0aCBTZXJ2ZXIgd2hpbGUgc3RvcmluZyBwZW5kaW5nIGxvZ2luIHJlc3VsdC5cXG5cIiArXG4gICAgICAgICAgICAgICAgIGVyci5zdGFjayB8fCBlcnIubWVzc2FnZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gY2xvc2UgdGhlIHBvcHVwLiBiZWNhdXNlIG5vYm9keSBsaWtlcyB0aGVtIGp1c3QgaGFuZ2luZ1xuICAgIC8vIHRoZXJlLiAgd2hlbiBzb21lb25lIHNlZXMgdGhpcyBtdWx0aXBsZSB0aW1lcyB0aGV5IG1pZ2h0XG4gICAgLy8gdGhpbmsgdG8gY2hlY2sgc2VydmVyIGxvZ3MgKHdlIGhvcGU/KVxuICAgIC8vIENhdGNoIGVycm9ycyBiZWNhdXNlIGFueSBleGNlcHRpb24gaGVyZSB3aWxsIGNyYXNoIHRoZSBydW5uZXIuXG4gICAgdHJ5IHtcbiAgICAgIE9BdXRoLl9lbmRPZkxvZ2luUmVzcG9uc2UocmVzLCB7XG4gICAgICAgIHF1ZXJ5OiByZXF1ZXN0RGF0YSxcbiAgICAgICAgbG9naW5TdHlsZTogT0F1dGguX2xvZ2luU3R5bGVGcm9tUXVlcnkocmVxdWVzdERhdGEpLFxuICAgICAgICBlcnJvcjogZXJyXG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIExvZy53YXJuKFwiRXJyb3IgZ2VuZXJhdGluZyBlbmQgb2YgbG9naW4gcmVzcG9uc2VcXG5cIiArXG4gICAgICAgICAgICAgICAoZXJyICYmIChlcnIuc3RhY2sgfHwgZXJyLm1lc3NhZ2UpKSk7XG4gICAgfVxuICB9XG59O1xuXG4vLyBMaXN0ZW4gdG8gaW5jb21pbmcgT0F1dGggaHR0cCByZXF1ZXN0c1xuV2ViQXBwLmNvbm5lY3RIYW5kbGVycy51c2UoJy9fb2F1dGgnLCBib2R5UGFyc2VyLmpzb24oKSk7XG5XZWJBcHAuY29ubmVjdEhhbmRsZXJzLnVzZSgnL19vYXV0aCcsIGJvZHlQYXJzZXIudXJsZW5jb2RlZCh7IGV4dGVuZGVkOiBmYWxzZSB9KSk7XG5XZWJBcHAuY29ubmVjdEhhbmRsZXJzLnVzZShtaWRkbGV3YXJlKTtcblxuT0F1dGhUZXN0Lm1pZGRsZXdhcmUgPSBtaWRkbGV3YXJlO1xuXG4vLyBIYW5kbGUgL19vYXV0aC8qIHBhdGhzIGFuZCBleHRyYWN0IHRoZSBzZXJ2aWNlIG5hbWUuXG4vL1xuLy8gQHJldHVybnMge1N0cmluZ3xudWxsfSBlLmcuIFwiZmFjZWJvb2tcIiwgb3IgbnVsbCBpZiB0aGlzIGlzbid0IGFuXG4vLyBvYXV0aCByZXF1ZXN0XG5jb25zdCBvYXV0aFNlcnZpY2VOYW1lID0gcmVxID0+IHtcbiAgLy8gcmVxLnVybCB3aWxsIGJlIFwiL19vYXV0aC88c2VydmljZSBuYW1lPlwiIHdpdGggYW4gb3B0aW9uYWwgXCI/Y2xvc2VcIi5cbiAgY29uc3QgaSA9IHJlcS51cmwuaW5kZXhPZignPycpO1xuICBsZXQgYmFyZVBhdGg7XG4gIGlmIChpID09PSAtMSlcbiAgICBiYXJlUGF0aCA9IHJlcS51cmw7XG4gIGVsc2VcbiAgICBiYXJlUGF0aCA9IHJlcS51cmwuc3Vic3RyaW5nKDAsIGkpO1xuICBjb25zdCBzcGxpdFBhdGggPSBiYXJlUGF0aC5zcGxpdCgnLycpO1xuXG4gIC8vIEFueSBub24tb2F1dGggcmVxdWVzdCB3aWxsIGNvbnRpbnVlIGRvd24gdGhlIGRlZmF1bHRcbiAgLy8gbWlkZGxld2FyZXMuXG4gIGlmIChzcGxpdFBhdGhbMV0gIT09ICdfb2F1dGgnKVxuICAgIHJldHVybiBudWxsO1xuXG4gIC8vIEZpbmQgc2VydmljZSBiYXNlZCBvbiB1cmxcbiAgY29uc3Qgc2VydmljZU5hbWUgPSBzcGxpdFBhdGhbMl07XG4gIHJldHVybiBzZXJ2aWNlTmFtZTtcbn07XG5cbi8vIE1ha2Ugc3VyZSB3ZSdyZSBjb25maWd1cmVkXG5jb25zdCBlbnN1cmVDb25maWd1cmVkID0gc2VydmljZU5hbWUgPT4ge1xuICBpZiAoIVNlcnZpY2VDb25maWd1cmF0aW9uLmNvbmZpZ3VyYXRpb25zLmZpbmRPbmUoe3NlcnZpY2U6IHNlcnZpY2VOYW1lfSkpIHtcbiAgICB0aHJvdyBuZXcgU2VydmljZUNvbmZpZ3VyYXRpb24uQ29uZmlnRXJyb3IoKTtcbiAgfVxufTtcblxuY29uc3QgaXNTYWZlID0gdmFsdWUgPT4ge1xuICAvLyBUaGlzIG1hdGNoZXMgc3RyaW5ncyBnZW5lcmF0ZWQgYnkgYFJhbmRvbS5zZWNyZXRgIGFuZFxuICAvLyBgUmFuZG9tLmlkYC5cbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiAmJlxuICAgIC9eW2EtekEtWjAtOVxcLV9dKyQvLnRlc3QodmFsdWUpO1xufTtcblxuLy8gSW50ZXJuYWw6IHVzZWQgYnkgdGhlIG9hdXRoMSBhbmQgb2F1dGgyIHBhY2thZ2VzXG5PQXV0aC5fcmVuZGVyT2F1dGhSZXN1bHRzID0gKHJlcywgcXVlcnksIGNyZWRlbnRpYWxTZWNyZXQpID0+IHtcbiAgLy8gRm9yIHRlc3RzLCB3ZSBzdXBwb3J0IHRoZSBgb25seV9jcmVkZW50aWFsX3NlY3JldF9mb3JfdGVzdGBcbiAgLy8gcGFyYW1ldGVyLCB3aGljaCBqdXN0IHJldHVybnMgdGhlIGNyZWRlbnRpYWwgc2VjcmV0IHdpdGhvdXQgYW55XG4gIC8vIHN1cnJvdW5kaW5nIEhUTUwuIChUaGUgdGVzdCBuZWVkcyB0byBiZSBhYmxlIHRvIGVhc2lseSBncmFiIHRoZVxuICAvLyBzZWNyZXQgYW5kIHVzZSBpdCB0byBsb2cgaW4uKVxuICAvL1xuICAvLyBYWFggb25seV9jcmVkZW50aWFsX3NlY3JldF9mb3JfdGVzdCBjb3VsZCBiZSB1c2VmdWwgZm9yIG90aGVyXG4gIC8vIHRoaW5ncyBiZXNpZGUgdGVzdHMsIGxpa2UgY29tbWFuZC1saW5lIGNsaWVudHMuIFdlIHNob3VsZCBnaXZlIGl0IGFcbiAgLy8gcmVhbCBuYW1lIGFuZCBzZXJ2ZSB0aGUgY3JlZGVudGlhbCBzZWNyZXQgaW4gSlNPTi5cblxuICBpZiAocXVlcnkub25seV9jcmVkZW50aWFsX3NlY3JldF9mb3JfdGVzdCkge1xuICAgIHJlcy53cml0ZUhlYWQoMjAwLCB7J0NvbnRlbnQtVHlwZSc6ICd0ZXh0L2h0bWwnfSk7XG4gICAgcmVzLmVuZChjcmVkZW50aWFsU2VjcmV0LCAndXRmLTgnKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBkZXRhaWxzID0ge1xuICAgICAgcXVlcnksXG4gICAgICBsb2dpblN0eWxlOiBPQXV0aC5fbG9naW5TdHlsZUZyb21RdWVyeShxdWVyeSlcbiAgICB9O1xuICAgIGlmIChxdWVyeS5lcnJvcikge1xuICAgICAgZGV0YWlscy5lcnJvciA9IHF1ZXJ5LmVycm9yO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCB0b2tlbiA9IE9BdXRoLl9jcmVkZW50aWFsVG9rZW5Gcm9tUXVlcnkocXVlcnkpO1xuICAgICAgY29uc3Qgc2VjcmV0ID0gY3JlZGVudGlhbFNlY3JldDtcbiAgICAgIGlmICh0b2tlbiAmJiBzZWNyZXQgJiZcbiAgICAgICAgICBpc1NhZmUodG9rZW4pICYmIGlzU2FmZShzZWNyZXQpKSB7XG4gICAgICAgIGRldGFpbHMuY3JlZGVudGlhbHMgPSB7IHRva2VuOiB0b2tlbiwgc2VjcmV0OiBzZWNyZXR9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGV0YWlscy5lcnJvciA9IFwiaW52YWxpZF9jcmVkZW50aWFsX3Rva2VuX29yX3NlY3JldFwiO1xuICAgICAgfVxuICAgIH1cblxuICAgIE9BdXRoLl9lbmRPZkxvZ2luUmVzcG9uc2UocmVzLCBkZXRhaWxzKTtcbiAgfVxufTtcblxuLy8gVGhpcyBcInRlbXBsYXRlXCIgKG5vdCBhIHJlYWwgU3BhY2ViYXJzIHRlbXBsYXRlLCBqdXN0IGFuIEhUTUwgZmlsZVxuLy8gd2l0aCBzb21lICMjUExBQ0VIT0xERVIjI3MpIGNvbW11bmljYXRlcyB0aGUgY3JlZGVudGlhbCBzZWNyZXQgYmFja1xuLy8gdG8gdGhlIG1haW4gd2luZG93IGFuZCB0aGVuIGNsb3NlcyB0aGUgcG9wdXAuXG5PQXV0aC5fZW5kT2ZQb3B1cFJlc3BvbnNlVGVtcGxhdGUgPSBBc3NldHMuZ2V0VGV4dChcbiAgXCJlbmRfb2ZfcG9wdXBfcmVzcG9uc2UuaHRtbFwiKTtcblxuT0F1dGguX2VuZE9mUmVkaXJlY3RSZXNwb25zZVRlbXBsYXRlID0gQXNzZXRzLmdldFRleHQoXG4gIFwiZW5kX29mX3JlZGlyZWN0X3Jlc3BvbnNlLmh0bWxcIik7XG5cbi8vIFJlbmRlcnMgdGhlIGVuZCBvZiBsb2dpbiByZXNwb25zZSB0ZW1wbGF0ZSBpbnRvIHNvbWUgSFRNTCBhbmQgSmF2YVNjcmlwdFxuLy8gdGhhdCBjbG9zZXMgdGhlIHBvcHVwIG9yIHJlZGlyZWN0cyBhdCB0aGUgZW5kIG9mIHRoZSBPQXV0aCBmbG93LlxuLy9cbi8vIG9wdGlvbnMgYXJlOlxuLy8gICAtIGxvZ2luU3R5bGUgKFwicG9wdXBcIiBvciBcInJlZGlyZWN0XCIpXG4vLyAgIC0gc2V0Q3JlZGVudGlhbFRva2VuIChib29sZWFuKVxuLy8gICAtIGNyZWRlbnRpYWxUb2tlblxuLy8gICAtIGNyZWRlbnRpYWxTZWNyZXRcbi8vICAgLSByZWRpcmVjdFVybFxuLy8gICAtIGlzQ29yZG92YSAoYm9vbGVhbilcbi8vXG5jb25zdCByZW5kZXJFbmRPZkxvZ2luUmVzcG9uc2UgPSBvcHRpb25zID0+IHtcbiAgLy8gSXQgd291bGQgYmUgbmljZSB0byB1c2UgQmxhemUgaGVyZSwgYnV0IGl0J3MgYSBsaXR0bGUgdHJpY2t5XG4gIC8vIGJlY2F1c2Ugb3VyIG11c3RhY2hlcyB3b3VsZCBiZSBpbnNpZGUgYSA8c2NyaXB0PiB0YWcsIGFuZCBCbGF6ZVxuICAvLyB3b3VsZCB0cmVhdCB0aGUgPHNjcmlwdD4gdGFnIGNvbnRlbnRzIGFzIHRleHQgKGUuZy4gZW5jb2RlICcmJyBhc1xuICAvLyAnJmFtcDsnKS4gU28gd2UganVzdCBkbyBhIHNpbXBsZSByZXBsYWNlLlxuXG4gIGNvbnN0IGVzY2FwZSA9IHMgPT4ge1xuICAgIGlmIChzKSB7XG4gICAgICByZXR1cm4gcy5yZXBsYWNlKC8mL2csIFwiJmFtcDtcIikuXG4gICAgICAgIHJlcGxhY2UoLzwvZywgXCImbHQ7XCIpLlxuICAgICAgICByZXBsYWNlKC8+L2csIFwiJmd0O1wiKS5cbiAgICAgICAgcmVwbGFjZSgvXFxcIi9nLCBcIiZxdW90O1wiKS5cbiAgICAgICAgcmVwbGFjZSgvXFwnL2csIFwiJiN4Mjc7XCIpLlxuICAgICAgICByZXBsYWNlKC9cXC8vZywgXCImI3gyRjtcIik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzO1xuICAgIH1cbiAgfTtcblxuICAvLyBFc2NhcGUgZXZlcnl0aGluZyBqdXN0IHRvIGJlIHNhZmUgKHdlJ3ZlIGFscmVhZHkgY2hlY2tlZCB0aGF0IHNvbWVcbiAgLy8gb2YgdGhpcyBkYXRhIC0tIHRoZSB0b2tlbiBhbmQgc2VjcmV0IC0tIGFyZSBzYWZlKS5cbiAgY29uc3QgY29uZmlnID0ge1xuICAgIHNldENyZWRlbnRpYWxUb2tlbjogISEgb3B0aW9ucy5zZXRDcmVkZW50aWFsVG9rZW4sXG4gICAgY3JlZGVudGlhbFRva2VuOiBlc2NhcGUob3B0aW9ucy5jcmVkZW50aWFsVG9rZW4pLFxuICAgIGNyZWRlbnRpYWxTZWNyZXQ6IGVzY2FwZShvcHRpb25zLmNyZWRlbnRpYWxTZWNyZXQpLFxuICAgIHN0b3JhZ2VQcmVmaXg6IGVzY2FwZShPQXV0aC5fc3RvcmFnZVRva2VuUHJlZml4KSxcbiAgICByZWRpcmVjdFVybDogZXNjYXBlKG9wdGlvbnMucmVkaXJlY3RVcmwpLFxuICAgIGlzQ29yZG92YTogISEgb3B0aW9ucy5pc0NvcmRvdmFcbiAgfTtcblxuICBsZXQgdGVtcGxhdGU7XG4gIGlmIChvcHRpb25zLmxvZ2luU3R5bGUgPT09ICdwb3B1cCcpIHtcbiAgICB0ZW1wbGF0ZSA9IE9BdXRoLl9lbmRPZlBvcHVwUmVzcG9uc2VUZW1wbGF0ZTtcbiAgfSBlbHNlIGlmIChvcHRpb25zLmxvZ2luU3R5bGUgPT09ICdyZWRpcmVjdCcpIHtcbiAgICB0ZW1wbGF0ZSA9IE9BdXRoLl9lbmRPZlJlZGlyZWN0UmVzcG9uc2VUZW1wbGF0ZTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgbG9naW5TdHlsZTogJHtvcHRpb25zLmxvZ2luU3R5bGV9YCk7XG4gIH1cblxuICBjb25zdCByZXN1bHQgPSB0ZW1wbGF0ZS5yZXBsYWNlKC8jI0NPTkZJRyMjLywgSlNPTi5zdHJpbmdpZnkoY29uZmlnKSlcbiAgICAucmVwbGFjZShcbiAgICAgIC8jI1JPT1RfVVJMX1BBVEhfUFJFRklYIyMvLCBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLlJPT1RfVVJMX1BBVEhfUFJFRklYXG4gICAgKTtcblxuICByZXR1cm4gYDwhRE9DVFlQRSBodG1sPlxcbiR7cmVzdWx0fWA7XG59O1xuXG4vLyBXcml0ZXMgYW4gSFRUUCByZXNwb25zZSB0byB0aGUgcG9wdXAgd2luZG93IGF0IHRoZSBlbmQgb2YgYW4gT0F1dGhcbi8vIGxvZ2luIGZsb3cuIEF0IHRoaXMgcG9pbnQsIGlmIHRoZSB1c2VyIGhhcyBzdWNjZXNzZnVsbHkgYXV0aGVudGljYXRlZFxuLy8gdG8gdGhlIE9BdXRoIHNlcnZlciBhbmQgYXV0aG9yaXplZCB0aGlzIGFwcCwgd2UgY29tbXVuaWNhdGUgdGhlXG4vLyBjcmVkZW50aWFsVG9rZW4gYW5kIGNyZWRlbnRpYWxTZWNyZXQgdG8gdGhlIG1haW4gd2luZG93LiBUaGUgbWFpblxuLy8gd2luZG93IG11c3QgcHJvdmlkZSBib3RoIHRoZXNlIHZhbHVlcyB0byB0aGUgRERQIGBsb2dpbmAgbWV0aG9kIHRvXG4vLyBhdXRoZW50aWNhdGUgaXRzIEREUCBjb25uZWN0aW9uLiBBZnRlciBjb21tdW5pY2F0aW5nIHRoZXNlIHZhbHVlcyB0b1xuLy8gdGhlIG1haW4gd2luZG93LCB3ZSBjbG9zZSB0aGUgcG9wdXAuXG4vL1xuLy8gV2UgZXhwb3J0IHRoaXMgZnVuY3Rpb24gc28gdGhhdCBkZXZlbG9wZXJzIGNhbiBvdmVycmlkZSB0aGlzXG4vLyBiZWhhdmlvciwgd2hpY2ggaXMgcGFydGljdWxhcmx5IHVzZWZ1bCBpbiwgZm9yIGV4YW1wbGUsIHNvbWUgbW9iaWxlXG4vLyBlbnZpcm9ubWVudHMgd2hlcmUgcG9wdXBzIGFuZC9vciBgd2luZG93Lm9wZW5lcmAgZG9uJ3Qgd29yay4gRm9yXG4vLyBleGFtcGxlLCBhbiBhcHAgY291bGQgb3ZlcnJpZGUgYE9BdXRoLl9lbmRPZlBvcHVwUmVzcG9uc2VgIHRvIHB1dCB0aGVcbi8vIGNyZWRlbnRpYWwgdG9rZW4gYW5kIGNyZWRlbnRpYWwgc2VjcmV0IGluIHRoZSBwb3B1cCBVUkwgZm9yIHRoZSBtYWluXG4vLyB3aW5kb3cgdG8gcmVhZCB0aGVtIHRoZXJlIGluc3RlYWQgb2YgdXNpbmcgYHdpbmRvdy5vcGVuZXJgLiBJZiB5b3Vcbi8vIG92ZXJyaWRlIHRoaXMgZnVuY3Rpb24sIHlvdSB0YWtlIHJlc3BvbnNpYmlsaXR5IGZvciB3cml0aW5nIHRvIHRoZVxuLy8gcmVxdWVzdCBhbmQgY2FsbGluZyBgcmVzLmVuZCgpYCB0byBjb21wbGV0ZSB0aGUgcmVxdWVzdC5cbi8vXG4vLyBBcmd1bWVudHM6XG4vLyAgIC0gcmVzOiB0aGUgSFRUUCByZXNwb25zZSBvYmplY3Rcbi8vICAgLSBkZXRhaWxzOlxuLy8gICAgICAtIHF1ZXJ5OiB0aGUgcXVlcnkgc3RyaW5nIG9uIHRoZSBIVFRQIHJlcXVlc3Rcbi8vICAgICAgLSBjcmVkZW50aWFsczogeyB0b2tlbjogKiwgc2VjcmV0OiAqIH0uIElmIHByZXNlbnQsIHRoaXMgZmllbGRcbi8vICAgICAgICBpbmRpY2F0ZXMgdGhhdCB0aGUgbG9naW4gd2FzIHN1Y2Nlc3NmdWwuIFJldHVybiB0aGVzZSB2YWx1ZXNcbi8vICAgICAgICB0byB0aGUgY2xpZW50LCB3aG8gY2FuIHVzZSB0aGVtIHRvIGxvZyBpbiBvdmVyIEREUC4gSWZcbi8vICAgICAgICBwcmVzZW50LCB0aGUgdmFsdWVzIGhhdmUgYmVlbiBjaGVja2VkIGFnYWluc3QgYSBsaW1pdGVkXG4vLyAgICAgICAgY2hhcmFjdGVyIHNldCBhbmQgYXJlIHNhZmUgdG8gaW5jbHVkZSBpbiBIVE1MLlxuLy8gICAgICAtIGVycm9yOiBpZiBwcmVzZW50LCBhIHN0cmluZyBvciBFcnJvciBpbmRpY2F0aW5nIGFuIGVycm9yIHRoYXRcbi8vICAgICAgICBvY2N1cnJlZCBkdXJpbmcgdGhlIGxvZ2luLiBUaGlzIGNhbiBjb21lIGZyb20gdGhlIGNsaWVudCBhbmRcbi8vICAgICAgICBzbyBzaG91bGRuJ3QgYmUgdHJ1c3RlZCBmb3Igc2VjdXJpdHkgZGVjaXNpb25zIG9yIGluY2x1ZGVkIGluXG4vLyAgICAgICAgdGhlIHJlc3BvbnNlIHdpdGhvdXQgc2FuaXRpemluZyBpdCBmaXJzdC4gT25seSBvbmUgb2YgYGVycm9yYFxuLy8gICAgICAgIG9yIGBjcmVkZW50aWFsc2Agc2hvdWxkIGJlIHNldC5cbk9BdXRoLl9lbmRPZkxvZ2luUmVzcG9uc2UgPSAocmVzLCBkZXRhaWxzKSA9PiB7XG4gIHJlcy53cml0ZUhlYWQoMjAwLCB7J0NvbnRlbnQtVHlwZSc6ICd0ZXh0L2h0bWwnfSk7XG5cbiAgbGV0IHJlZGlyZWN0VXJsO1xuICBpZiAoZGV0YWlscy5sb2dpblN0eWxlID09PSAncmVkaXJlY3QnKSB7XG4gICAgcmVkaXJlY3RVcmwgPSBPQXV0aC5fc3RhdGVGcm9tUXVlcnkoZGV0YWlscy5xdWVyeSkucmVkaXJlY3RVcmw7XG4gICAgY29uc3QgYXBwSG9zdCA9IE1ldGVvci5hYnNvbHV0ZVVybCgpO1xuICAgIGlmIChcbiAgICAgICFNZXRlb3Iuc2V0dGluZ3M/LnBhY2thZ2VzPy5vYXV0aD8uZGlzYWJsZUNoZWNrUmVkaXJlY3RVcmxPcmlnaW4gJiZcbiAgICAgIE9BdXRoLl9jaGVja1JlZGlyZWN0VXJsT3JpZ2luKHJlZGlyZWN0VXJsKSkge1xuICAgICAgZGV0YWlscy5lcnJvciA9IGByZWRpcmVjdFVybCAoJHtyZWRpcmVjdFVybH1gICtcbiAgICAgICAgYCkgaXMgbm90IG9uIHRoZSBzYW1lIGhvc3QgYXMgdGhlIGFwcCAoJHthcHBIb3N0fSlgO1xuICAgICAgcmVkaXJlY3RVcmwgPSBhcHBIb3N0O1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGlzQ29yZG92YSA9IE9BdXRoLl9pc0NvcmRvdmFGcm9tUXVlcnkoZGV0YWlscy5xdWVyeSk7XG5cbiAgaWYgKGRldGFpbHMuZXJyb3IpIHtcbiAgICBMb2cud2FybihcIkVycm9yIGluIE9BdXRoIFNlcnZlcjogXCIgK1xuICAgICAgICAgICAgIChkZXRhaWxzLmVycm9yIGluc3RhbmNlb2YgRXJyb3IgP1xuICAgICAgICAgICAgICBkZXRhaWxzLmVycm9yLm1lc3NhZ2UgOiBkZXRhaWxzLmVycm9yKSk7XG4gICAgcmVzLmVuZChyZW5kZXJFbmRPZkxvZ2luUmVzcG9uc2Uoe1xuICAgICAgbG9naW5TdHlsZTogZGV0YWlscy5sb2dpblN0eWxlLFxuICAgICAgc2V0Q3JlZGVudGlhbFRva2VuOiBmYWxzZSxcbiAgICAgIHJlZGlyZWN0VXJsLFxuICAgICAgaXNDb3Jkb3ZhLFxuICAgIH0pLCBcInV0Zi04XCIpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIElmIHdlIGhhdmUgYSBjcmVkZW50aWFsU2VjcmV0LCByZXBvcnQgaXQgYmFjayB0byB0aGUgcGFyZW50XG4gIC8vIHdpbmRvdywgd2l0aCB0aGUgY29ycmVzcG9uZGluZyBjcmVkZW50aWFsVG9rZW4uIFRoZSBwYXJlbnQgd2luZG93XG4gIC8vIHVzZXMgdGhlIGNyZWRlbnRpYWxUb2tlbiBhbmQgY3JlZGVudGlhbFNlY3JldCB0byBsb2cgaW4gb3ZlciBERFAuXG4gIHJlcy5lbmQocmVuZGVyRW5kT2ZMb2dpblJlc3BvbnNlKHtcbiAgICBsb2dpblN0eWxlOiBkZXRhaWxzLmxvZ2luU3R5bGUsXG4gICAgc2V0Q3JlZGVudGlhbFRva2VuOiB0cnVlLFxuICAgIGNyZWRlbnRpYWxUb2tlbjogZGV0YWlscy5jcmVkZW50aWFscy50b2tlbixcbiAgICBjcmVkZW50aWFsU2VjcmV0OiBkZXRhaWxzLmNyZWRlbnRpYWxzLnNlY3JldCxcbiAgICByZWRpcmVjdFVybCxcbiAgICBpc0NvcmRvdmEsXG4gIH0pLCBcInV0Zi04XCIpO1xufTtcblxuXG5jb25zdCBPQXV0aEVuY3J5cHRpb24gPSBQYWNrYWdlW1wib2F1dGgtZW5jcnlwdGlvblwiXSAmJiBQYWNrYWdlW1wib2F1dGgtZW5jcnlwdGlvblwiXS5PQXV0aEVuY3J5cHRpb247XG5cbmNvbnN0IHVzaW5nT0F1dGhFbmNyeXB0aW9uID0gKCkgPT5cbiAgT0F1dGhFbmNyeXB0aW9uICYmIE9BdXRoRW5jcnlwdGlvbi5rZXlJc0xvYWRlZCgpO1xuXG4vLyBFbmNyeXB0IHNlbnNpdGl2ZSBzZXJ2aWNlIGRhdGEgc3VjaCBhcyBhY2Nlc3MgdG9rZW5zIGlmIHRoZVxuLy8gXCJvYXV0aC1lbmNyeXB0aW9uXCIgcGFja2FnZSBpcyBsb2FkZWQgYW5kIHRoZSBvYXV0aCBzZWNyZXQga2V5IGhhc1xuLy8gYmVlbiBzcGVjaWZpZWQuICBSZXR1cm5zIHRoZSB1bmVuY3J5cHRlZCBwbGFpbnRleHQgb3RoZXJ3aXNlLlxuLy9cbi8vIFRoZSB1c2VyIGlkIGlzIG5vdCBzcGVjaWZpZWQgYmVjYXVzZSB0aGUgdXNlciBpc24ndCBrbm93biB5ZXQgYXRcbi8vIHRoaXMgcG9pbnQgaW4gdGhlIG9hdXRoIGF1dGhlbnRpY2F0aW9uIHByb2Nlc3MuICBBZnRlciB0aGUgb2F1dGhcbi8vIGF1dGhlbnRpY2F0aW9uIHByb2Nlc3MgY29tcGxldGVzIHRoZSBlbmNyeXB0ZWQgc2VydmljZSBkYXRhIGZpZWxkc1xuLy8gd2lsbCBiZSByZS1lbmNyeXB0ZWQgd2l0aCB0aGUgdXNlciBpZCBpbmNsdWRlZCBiZWZvcmUgaW5zZXJ0aW5nIHRoZVxuLy8gc2VydmljZSBkYXRhIGludG8gdGhlIHVzZXIgZG9jdW1lbnQuXG4vL1xuT0F1dGguc2VhbFNlY3JldCA9IHBsYWludGV4dCA9PiB7XG4gIGlmICh1c2luZ09BdXRoRW5jcnlwdGlvbigpKVxuICAgIHJldHVybiBPQXV0aEVuY3J5cHRpb24uc2VhbChwbGFpbnRleHQpO1xuICBlbHNlXG4gICAgcmV0dXJuIHBsYWludGV4dDtcbn07XG5cbi8vIFVuZW5jcnlwdCBhIHNlcnZpY2UgZGF0YSBmaWVsZCwgaWYgdGhlIFwib2F1dGgtZW5jcnlwdGlvblwiXG4vLyBwYWNrYWdlIGlzIGxvYWRlZCBhbmQgdGhlIGZpZWxkIGlzIGVuY3J5cHRlZC5cbi8vXG4vLyBUaHJvd3MgYW4gZXJyb3IgaWYgdGhlIFwib2F1dGgtZW5jcnlwdGlvblwiIHBhY2thZ2UgaXMgbG9hZGVkIGFuZCB0aGVcbi8vIGZpZWxkIGlzIGVuY3J5cHRlZCwgYnV0IHRoZSBvYXV0aCBzZWNyZXQga2V5IGhhc24ndCBiZWVuIHNwZWNpZmllZC5cbi8vXG5PQXV0aC5vcGVuU2VjcmV0ID0gKG1heWJlU2VjcmV0LCB1c2VySWQpID0+IHtcbiAgaWYgKCFQYWNrYWdlW1wib2F1dGgtZW5jcnlwdGlvblwiXSB8fCAhT0F1dGhFbmNyeXB0aW9uLmlzU2VhbGVkKG1heWJlU2VjcmV0KSlcbiAgICByZXR1cm4gbWF5YmVTZWNyZXQ7XG5cbiAgcmV0dXJuIE9BdXRoRW5jcnlwdGlvbi5vcGVuKG1heWJlU2VjcmV0LCB1c2VySWQpO1xufTtcblxuLy8gVW5lbmNyeXB0IGZpZWxkcyBpbiB0aGUgc2VydmljZSBkYXRhIG9iamVjdC5cbi8vXG5PQXV0aC5vcGVuU2VjcmV0cyA9IChzZXJ2aWNlRGF0YSwgdXNlcklkKSA9PiB7XG4gIGNvbnN0IHJlc3VsdCA9IHt9O1xuICBPYmplY3Qua2V5cyhzZXJ2aWNlRGF0YSkuZm9yRWFjaChrZXkgPT5cbiAgICByZXN1bHRba2V5XSA9IE9BdXRoLm9wZW5TZWNyZXQoc2VydmljZURhdGFba2V5XSwgdXNlcklkKVxuICApO1xuICByZXR1cm4gcmVzdWx0O1xufTtcblxuT0F1dGguX2FkZFZhbHVlc1RvUXVlcnlQYXJhbXMgPSAoXG4gIHZhbHVlcyA9IHt9LFxuICBxdWVyeVBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMoKVxuKSA9PiB7XG4gIE9iamVjdC5lbnRyaWVzKHZhbHVlcykuZm9yRWFjaCgoW2tleSwgdmFsdWVdKSA9PiB7XG4gICAgcXVlcnlQYXJhbXMuc2V0KGtleSwgYCR7dmFsdWV9YCk7XG4gIH0pO1xuICByZXR1cm4gcXVlcnlQYXJhbXM7XG59O1xuXG5PQXV0aC5fZmV0Y2ggPSBhc3luYyAoXG4gIHVybCxcbiAgbWV0aG9kID0gJ0dFVCcsXG4gIHsgaGVhZGVycyA9IHt9LCBxdWVyeVBhcmFtcyA9IHt9LCBib2R5LCAuLi5vcHRpb25zIH0gPSB7fVxuKSA9PiB7XG4gIGNvbnN0IHVybFdpdGhQYXJhbXMgPSBuZXcgVVJMKHVybCk7XG5cbiAgT0F1dGguX2FkZFZhbHVlc1RvUXVlcnlQYXJhbXMocXVlcnlQYXJhbXMsIHVybFdpdGhQYXJhbXMuc2VhcmNoUGFyYW1zKTtcblxuICBjb25zdCByZXF1ZXN0T3B0aW9ucyA9IHtcbiAgICBtZXRob2Q6IG1ldGhvZC50b1VwcGVyQ2FzZSgpLFxuICAgIGhlYWRlcnMsXG4gICAgLi4uKGJvZHkgPyB7IGJvZHkgfSA6IHt9KSxcbiAgICAuLi5vcHRpb25zLFxuICB9O1xuICByZXR1cm4gZmV0Y2godXJsV2l0aFBhcmFtcy50b1N0cmluZygpLCByZXF1ZXN0T3B0aW9ucyk7XG59O1xuIiwiLy9cbi8vIFdoZW4gYW4gb2F1dGggcmVxdWVzdCBpcyBtYWRlLCBNZXRlb3IgcmVjZWl2ZXMgb2F1dGggY3JlZGVudGlhbHNcbi8vIGluIG9uZSBicm93c2VyIHRhYiwgYW5kIHRlbXBvcmFyaWx5IHBlcnNpc3RzIHRoZW0gd2hpbGUgdGhhdFxuLy8gdGFiIGlzIGNsb3NlZCwgdGhlbiByZXRyaWV2ZXMgdGhlbSBpbiB0aGUgYnJvd3NlciB0YWIgdGhhdFxuLy8gaW5pdGlhdGVkIHRoZSBjcmVkZW50aWFsIHJlcXVlc3QuXG4vL1xuLy8gX3BlbmRpbmdDcmVkZW50aWFscyBpcyB0aGUgc3RvcmFnZSBtZWNoYW5pc20gdXNlZCB0byBzaGFyZSB0aGVcbi8vIGNyZWRlbnRpYWwgYmV0d2VlbiB0aGUgMiB0YWJzXG4vL1xuXG5cbi8vIENvbGxlY3Rpb24gY29udGFpbmluZyBwZW5kaW5nIGNyZWRlbnRpYWxzIG9mIG9hdXRoIGNyZWRlbnRpYWwgcmVxdWVzdHNcbi8vIEhhcyBrZXksIGNyZWRlbnRpYWwsIGFuZCBjcmVhdGVkQXQgZmllbGRzLlxuT0F1dGguX3BlbmRpbmdDcmVkZW50aWFscyA9IG5ldyBNb25nby5Db2xsZWN0aW9uKFxuICBcIm1ldGVvcl9vYXV0aF9wZW5kaW5nQ3JlZGVudGlhbHNcIiwge1xuICAgIF9wcmV2ZW50QXV0b3B1Ymxpc2g6IHRydWVcbiAgfSk7XG5cbk9BdXRoLl9wZW5kaW5nQ3JlZGVudGlhbHMuY3JlYXRlSW5kZXhBc3luYygna2V5JywgeyB1bmlxdWU6IHRydWUgfSk7XG5PQXV0aC5fcGVuZGluZ0NyZWRlbnRpYWxzLmNyZWF0ZUluZGV4QXN5bmMoJ2NyZWRlbnRpYWxTZWNyZXQnKTtcbk9BdXRoLl9wZW5kaW5nQ3JlZGVudGlhbHMuY3JlYXRlSW5kZXhBc3luYygnY3JlYXRlZEF0Jyk7XG5cblxuXG4vLyBQZXJpb2RpY2FsbHkgY2xlYXIgb2xkIGVudHJpZXMgdGhhdCB3ZXJlIG5ldmVyIHJldHJpZXZlZFxuY29uc3QgX2NsZWFuU3RhbGVSZXN1bHRzID0gKCkgPT4ge1xuICAvLyBSZW1vdmUgY3JlZGVudGlhbHMgb2xkZXIgdGhhbiAxIG1pbnV0ZVxuICBjb25zdCB0aW1lQ3V0b2ZmID0gbmV3IERhdGUoKTtcbiAgdGltZUN1dG9mZi5zZXRNaW51dGVzKHRpbWVDdXRvZmYuZ2V0TWludXRlcygpIC0gMSk7XG4gIE9BdXRoLl9wZW5kaW5nQ3JlZGVudGlhbHMucmVtb3ZlQXN5bmMoeyBjcmVhdGVkQXQ6IHsgJGx0OiB0aW1lQ3V0b2ZmIH0gfSk7XG59O1xuY29uc3QgX2NsZWFudXBIYW5kbGUgPSBNZXRlb3Iuc2V0SW50ZXJ2YWwoX2NsZWFuU3RhbGVSZXN1bHRzLCA2MCAqIDEwMDApO1xuXG5cbi8vIFN0b3JlcyB0aGUga2V5IGFuZCBjcmVkZW50aWFsIGluIHRoZSBfcGVuZGluZ0NyZWRlbnRpYWxzIGNvbGxlY3Rpb24uXG4vLyBXaWxsIHRocm93IGFuIGV4Y2VwdGlvbiBpZiBga2V5YCBpcyBub3QgYSBzdHJpbmcuXG4vL1xuLy8gQHBhcmFtIGtleSB7c3RyaW5nfVxuLy8gQHBhcmFtIGNyZWRlbnRpYWwge09iamVjdH0gICBUaGUgY3JlZGVudGlhbCB0byBzdG9yZVxuLy8gQHBhcmFtIGNyZWRlbnRpYWxTZWNyZXQge3N0cmluZ30gQSBzZWNyZXQgdGhhdCBtdXN0IGJlIHByZXNlbnRlZCBpblxuLy8gICBhZGRpdGlvbiB0byB0aGUgYGtleWAgdG8gcmV0cmlldmUgdGhlIGNyZWRlbnRpYWxcbi8vXG5PQXV0aC5fc3RvcmVQZW5kaW5nQ3JlZGVudGlhbCA9IChrZXksIGNyZWRlbnRpYWwsIGNyZWRlbnRpYWxTZWNyZXQgPSBudWxsKSA9PiB7XG4gIGNoZWNrKGtleSwgU3RyaW5nKTtcbiAgY2hlY2soY3JlZGVudGlhbFNlY3JldCwgTWF0Y2guTWF5YmUoU3RyaW5nKSk7XG5cbiAgaWYgKGNyZWRlbnRpYWwgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgIGNyZWRlbnRpYWwgPSBzdG9yYWJsZUVycm9yKGNyZWRlbnRpYWwpO1xuICB9IGVsc2Uge1xuICAgIGNyZWRlbnRpYWwgPSBPQXV0aC5zZWFsU2VjcmV0KGNyZWRlbnRpYWwpO1xuICB9XG5cbiAgLy8gV2UgZG8gYW4gdXBzZXJ0IGhlcmUgaW5zdGVhZCBvZiBhbiBpbnNlcnQgaW4gY2FzZSB0aGUgdXNlciBoYXBwZW5zXG4gIC8vIHRvIHNvbWVob3cgc2VuZCB0aGUgc2FtZSBgc3RhdGVgIHBhcmFtZXRlciB0d2ljZSBkdXJpbmcgYW4gT0F1dGhcbiAgLy8gbG9naW47IHdlIGRvbid0IHdhbnQgYSBkdXBsaWNhdGUga2V5IGVycm9yLlxuICBPQXV0aC5fcGVuZGluZ0NyZWRlbnRpYWxzLnVwc2VydCh7XG4gICAga2V5LFxuICB9LCB7XG4gICAga2V5LFxuICAgIGNyZWRlbnRpYWwsXG4gICAgY3JlZGVudGlhbFNlY3JldCxcbiAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKClcbiAgfSk7XG59O1xuXG5cbi8vIFJldHJpZXZlcyBhbmQgcmVtb3ZlcyBhIGNyZWRlbnRpYWwgZnJvbSB0aGUgX3BlbmRpbmdDcmVkZW50aWFscyBjb2xsZWN0aW9uXG4vL1xuLy8gQHBhcmFtIGtleSB7c3RyaW5nfVxuLy8gQHBhcmFtIGNyZWRlbnRpYWxTZWNyZXQge3N0cmluZ31cbi8vXG5PQXV0aC5fcmV0cmlldmVQZW5kaW5nQ3JlZGVudGlhbCA9IChrZXksIGNyZWRlbnRpYWxTZWNyZXQgPSBudWxsKSA9PiB7XG4gIGNoZWNrKGtleSwgU3RyaW5nKTtcblxuICBjb25zdCBwZW5kaW5nQ3JlZGVudGlhbCA9IE9BdXRoLl9wZW5kaW5nQ3JlZGVudGlhbHMuZmluZE9uZSh7XG4gICAga2V5LFxuICAgIGNyZWRlbnRpYWxTZWNyZXQsXG4gIH0pO1xuXG4gIGlmIChwZW5kaW5nQ3JlZGVudGlhbCkge1xuICAgIE9BdXRoLl9wZW5kaW5nQ3JlZGVudGlhbHMucmVtb3ZlQXN5bmMoeyBfaWQ6IHBlbmRpbmdDcmVkZW50aWFsLl9pZCB9KTtcbiAgICBpZiAocGVuZGluZ0NyZWRlbnRpYWwuY3JlZGVudGlhbC5lcnJvcilcbiAgICAgIHJldHVybiByZWNyZWF0ZUVycm9yKHBlbmRpbmdDcmVkZW50aWFsLmNyZWRlbnRpYWwuZXJyb3IpO1xuICAgIGVsc2VcbiAgICAgIHJldHVybiBPQXV0aC5vcGVuU2VjcmV0KHBlbmRpbmdDcmVkZW50aWFsLmNyZWRlbnRpYWwpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbn07XG5cblxuLy8gQ29udmVydCBhbiBFcnJvciBpbnRvIGFuIG9iamVjdCB0aGF0IGNhbiBiZSBzdG9yZWQgaW4gbW9uZ29cbi8vIE5vdGU6IEEgTWV0ZW9yLkVycm9yIGlzIHJlY29uc3RydWN0ZWQgYXMgYSBNZXRlb3IuRXJyb3Jcbi8vIEFsbCBvdGhlciBlcnJvciBjbGFzc2VzIGFyZSByZWNvbnN0cnVjdGVkIGFzIGEgcGxhaW4gRXJyb3IuXG4vLyBUT0RPOiBDYW4gd2UgZG8gdGhpcyBtb3JlIHNpbXBseSB3aXRoIEVKU09OP1xuY29uc3Qgc3RvcmFibGVFcnJvciA9IGVycm9yID0+IHtcbiAgY29uc3QgcGxhaW5PYmplY3QgPSB7fTtcbiAgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoZXJyb3IpLmZvckVhY2goXG4gICAga2V5ID0+IHBsYWluT2JqZWN0W2tleV0gPSBlcnJvcltrZXldXG4gICk7XG5cbiAgLy8gS2VlcCB0cmFjayBvZiB3aGV0aGVyIGl0J3MgYSBNZXRlb3IuRXJyb3JcbiAgaWYoZXJyb3IgaW5zdGFuY2VvZiBNZXRlb3IuRXJyb3IpIHtcbiAgICBwbGFpbk9iamVjdFsnbWV0ZW9yRXJyb3InXSA9IHRydWU7XG4gIH1cblxuICByZXR1cm4geyBlcnJvcjogcGxhaW5PYmplY3QgfTtcbn07XG5cbi8vIENyZWF0ZSBhbiBlcnJvciBmcm9tIHRoZSBlcnJvciBmb3JtYXQgc3RvcmVkIGluIG1vbmdvXG5jb25zdCByZWNyZWF0ZUVycm9yID0gZXJyb3JEb2MgPT4ge1xuICBsZXQgZXJyb3I7XG5cbiAgaWYgKGVycm9yRG9jLm1ldGVvckVycm9yKSB7XG4gICAgZXJyb3IgPSBuZXcgTWV0ZW9yLkVycm9yKCk7XG4gICAgZGVsZXRlIGVycm9yRG9jLm1ldGVvckVycm9yO1xuICB9IGVsc2Uge1xuICAgIGVycm9yID0gbmV3IEVycm9yKCk7XG4gIH1cblxuICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhlcnJvckRvYykuZm9yRWFjaChrZXkgPT5cbiAgICBlcnJvcltrZXldID0gZXJyb3JEb2Nba2V5XVxuICApO1xuXG4gIHJldHVybiBlcnJvcjtcbn07XG4iLCJPQXV0aC5fc3RvcmFnZVRva2VuUHJlZml4ID0gXCJNZXRlb3Iub2F1dGguY3JlZGVudGlhbFNlY3JldC1cIjtcblxuT0F1dGguX3JlZGlyZWN0VXJpID0gKHNlcnZpY2VOYW1lLCBjb25maWcsIHBhcmFtcywgYWJzb2x1dGVVcmxPcHRpb25zKSA9PiB7XG4gIC8vIENsb25lIGJlY2F1c2Ugd2UncmUgZ29pbmcgdG8gbXV0YXRlICdwYXJhbXMnLiBUaGUgJ2NvcmRvdmEnIGFuZFxuICAvLyAnYW5kcm9pZCcgcGFyYW1ldGVycyBhcmUgb25seSB1c2VkIGZvciBwaWNraW5nIHRoZSBob3N0IG9mIHRoZVxuICAvLyByZWRpcmVjdCBVUkwsIGFuZCBub3QgYWN0dWFsbHkgaW5jbHVkZWQgaW4gdGhlIHJlZGlyZWN0IFVSTCBpdHNlbGYuXG4gIGxldCBpc0NvcmRvdmEgPSBmYWxzZTtcbiAgbGV0IGlzQW5kcm9pZCA9IGZhbHNlO1xuICBpZiAocGFyYW1zKSB7XG4gICAgcGFyYW1zID0geyAuLi5wYXJhbXMgfTtcbiAgICBpc0NvcmRvdmEgPSBwYXJhbXMuY29yZG92YTtcbiAgICBpc0FuZHJvaWQgPSBwYXJhbXMuYW5kcm9pZDtcbiAgICBkZWxldGUgcGFyYW1zLmNvcmRvdmE7XG4gICAgZGVsZXRlIHBhcmFtcy5hbmRyb2lkO1xuICAgIGlmIChPYmplY3Qua2V5cyhwYXJhbXMpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcGFyYW1zID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgfVxuXG4gIGlmIChNZXRlb3IuaXNTZXJ2ZXIgJiYgaXNDb3Jkb3ZhKSB7XG4gICAgY29uc3QgdXJsID0gTnBtLnJlcXVpcmUoJ3VybCcpO1xuICAgIGxldCByb290VXJsID0gcHJvY2Vzcy5lbnYuTU9CSUxFX1JPT1RfVVJMIHx8XG4gICAgICAgICAgX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5ST09UX1VSTDtcblxuICAgIGlmIChpc0FuZHJvaWQpIHtcbiAgICAgIC8vIE1hdGNoIHRoZSByZXBsYWNlIHRoYXQgd2UgZG8gaW4gY29yZG92YSBib2lsZXJwbGF0ZVxuICAgICAgLy8gKGJvaWxlcnBsYXRlLWdlbmVyYXRvciBwYWNrYWdlKS5cbiAgICAgIC8vIFhYWCBNYXliZSB3ZSBzaG91bGQgcHV0IHRoaXMgaW4gYSBzZXBhcmF0ZSBwYWNrYWdlIG9yIHNvbWV0aGluZ1xuICAgICAgLy8gdGhhdCBpcyB1c2VkIGhlcmUgYW5kIGJ5IGJvaWxlcnBsYXRlLWdlbmVyYXRvcj8gT3IgbWF5YmVcbiAgICAgIC8vIGBNZXRlb3IuYWJzb2x1dGVVcmxgIHNob3VsZCBrbm93IGhvdyB0byBkbyB0aGlzP1xuICAgICAgY29uc3QgcGFyc2VkUm9vdFVybCA9IHVybC5wYXJzZShyb290VXJsKTtcbiAgICAgIGlmIChwYXJzZWRSb290VXJsLmhvc3RuYW1lID09PSBcImxvY2FsaG9zdFwiKSB7XG4gICAgICAgIHBhcnNlZFJvb3RVcmwuaG9zdG5hbWUgPSBcIjEwLjAuMi4yXCI7XG4gICAgICAgIGRlbGV0ZSBwYXJzZWRSb290VXJsLmhvc3Q7XG4gICAgICB9XG4gICAgICByb290VXJsID0gdXJsLmZvcm1hdChwYXJzZWRSb290VXJsKTtcbiAgICB9XG5cbiAgICBhYnNvbHV0ZVVybE9wdGlvbnMgPSB7XG4gICAgICAuLi5hYnNvbHV0ZVVybE9wdGlvbnMsXG4gICAgICAvLyBGb3IgQ29yZG92YSBjbGllbnRzLCByZWRpcmVjdCB0byB0aGUgc3BlY2lhbCBDb3Jkb3ZhIHJvb3QgdXJsXG4gICAgICAvLyAobGlrZWx5IGEgbG9jYWwgSVAgaW4gZGV2ZWxvcG1lbnQgbW9kZSkuXG4gICAgICByb290VXJsLFxuICAgIH07XG4gIH1cblxuICByZXR1cm4gVVJMLl9jb25zdHJ1Y3RVcmwoXG4gICAgTWV0ZW9yLmFic29sdXRlVXJsKGBfb2F1dGgvJHtzZXJ2aWNlTmFtZX1gLCBhYnNvbHV0ZVVybE9wdGlvbnMpLFxuICAgIG51bGwsXG4gICAgcGFyYW1zKTtcbn07XG4iXX0=
