(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var check = Package.check.check;
var Match = Package.check.Match;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var Accounts = Package['accounts-base'].Accounts;
var ECMAScript = Package.ecmascript.ECMAScript;
var OAuth = Package.oauth.OAuth;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"accounts-oauth":{"oauth_common.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// packages/accounts-oauth/oauth_common.js                                                                         //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 0);
// TODO get from account-base
// config option keys
const VALID_CONFIG_KEYS = ['sendVerificationEmail', 'forbidClientAccountCreation', 'passwordEnrollTokenExpiration', 'passwordEnrollTokenExpirationInDays', 'restrictCreationByEmailDomain', 'loginExpirationInDays', 'loginExpiration', 'passwordResetTokenExpirationInDays', 'passwordResetTokenExpiration', 'ambiguousErrorMessages', 'bcryptRounds', 'defaultFieldSelector', 'loginTokenExpirationHours', 'tokenSequenceLength'];
Accounts.oauth = {};
const services = {};
const hasOwn = Object.prototype.hasOwnProperty;

// Helper for registering OAuth based accounts packages.
// On the server, adds an index to the user collection.
Accounts.oauth.registerService = name => {
  if (hasOwn.call(services, name)) throw new Error("Duplicate service: ".concat(name));
  services[name] = true;
  if (Meteor.server) {
    // Accounts.updateOrCreateUserFromExternalService does a lookup by this id,
    // so this should be a unique index. You might want to add indexes for other
    // fields returned by your service (eg services.github.login) but you can do
    // that in your app.
    Meteor.users.createIndexAsync("services.".concat(name, ".id"), {
      unique: true,
      sparse: true
    });
  }
};

// Removes a previously registered service.
// This will disable logging in with this service, and serviceNames() will not
// contain it.
// It's worth noting that already logged in users will remain logged in unless
// you manually expire their sessions.
Accounts.oauth.unregisterService = name => {
  if (!hasOwn.call(services, name)) throw new Error("Service not found: ".concat(name));
  delete services[name];
};
Accounts.oauth.serviceNames = () => Object.keys(services);

// loginServiceConfiguration and ConfigError are maintained for backwards compatibility
Meteor.startup(() => {
  var _Meteor$settings, _Meteor$settings$pack;
  const {
    ServiceConfiguration
  } = Package['service-configuration'];
  Accounts.loginServiceConfiguration = ServiceConfiguration.configurations;
  Accounts.ConfigError = ServiceConfiguration.ConfigError;
  const settings = (_Meteor$settings = Meteor.settings) === null || _Meteor$settings === void 0 ? void 0 : (_Meteor$settings$pack = _Meteor$settings.packages) === null || _Meteor$settings$pack === void 0 ? void 0 : _Meteor$settings$pack['accounts-base'];
  if (settings) {
    if (settings.oauthSecretKey) {
      if (!Package['oauth-encryption']) {
        throw new Error('The oauth-encryption package must be loaded to set oauthSecretKey');
      }
      Package['oauth-encryption'].OAuthEncryption.loadKey(settings.oauthSecretKey);
      delete settings.oauthSecretKey;
    }
    // Validate config options keys
    Object.keys(settings).forEach(key => {
      if (!VALID_CONFIG_KEYS.includes(key)) {
        // TODO Consider just logging a debug message instead to allow for additional keys in the settings here?
        throw new Meteor.Error("Accounts configuration: Invalid key: ".concat(key));
      } else {
        // set values in Accounts._options
        Accounts._options[key] = settings[key];
      }
    });
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"oauth_server.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// packages/accounts-oauth/oauth_server.js                                                                         //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
var _Package$oauthEncryp;
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 0);
// Listen to calls to `login` with an oauth option set. This is where
// users actually get logged in to meteor via oauth.
Accounts.registerLoginHandler(options => {
  if (!options.oauth) return undefined; // don't handle

  check(options.oauth, {
    credentialToken: String,
    // When an error occurs while retrieving the access token, we store
    // the error in the pending credentials table, with a secret of
    // null. The client can call the login method with a secret of null
    // to retrieve the error.
    credentialSecret: Match.OneOf(null, String)
  });
  const result = OAuth.retrieveCredential(options.oauth.credentialToken, options.oauth.credentialSecret);
  if (!result) {
    // OAuth credentialToken is not recognized, which could be either
    // because the popup was closed by the user before completion, or
    // some sort of error where the oauth provider didn't talk to our
    // server correctly and closed the popup somehow.
    //
    // We assume it was user canceled and report it as such, using a
    // numeric code that the client recognizes (XXX this will get
    // replaced by a symbolic error code at some point
    // https://trello.com/c/kMkw800Z/53-official-ddp-specification). This
    // will mask failures where things are misconfigured such that the
    // server doesn't see the request but does close the window. This
    // seems unlikely.
    //
    // XXX we want `type` to be the service name such as "facebook"
    return {
      type: "oauth",
      error: new Meteor.Error(Accounts.LoginCancelledError.numericError, "No matching login attempt found")
    };
  }
  if (result instanceof Error)
    // We tried to login, but there was a fatal error. Report it back
    // to the user.
    throw result;else {
    if (!Accounts.oauth.serviceNames().includes(result.serviceName)) {
      // serviceName was not found in the registered services list.
      // This could happen because the service never registered itself or
      // unregisterService was called on it.
      return {
        type: "oauth",
        error: new Meteor.Error(Accounts.LoginCancelledError.numericError, "No registered oauth service found for: ".concat(result.serviceName))
      };
    }
    return Accounts.updateOrCreateUserFromExternalService(result.serviceName, result.serviceData, result.options);
  }
});

///
/// OAuth Encryption Support
///

const OAuthEncryption = (_Package$oauthEncryp = Package["oauth-encryption"]) === null || _Package$oauthEncryp === void 0 ? void 0 : _Package$oauthEncryp.OAuthEncryption;
const usingOAuthEncryption = () => {
  return OAuthEncryption === null || OAuthEncryption === void 0 ? void 0 : OAuthEncryption.keyIsLoaded();
};

// Encrypt unencrypted login service secrets when oauth-encryption is
// added.
//
// XXX For the oauthSecretKey to be available here at startup, the
// developer must call Accounts.config({oauthSecretKey: ...}) at load
// time, instead of in a Meteor.startup block, because the startup
// block in the app code will run after this accounts-base startup
// block.  Perhaps we need a post-startup callback?

Meteor.startup(() => {
  if (!usingOAuthEncryption()) {
    return;
  }
  const {
    ServiceConfiguration
  } = Package['service-configuration'];
  ServiceConfiguration.configurations.find({
    $and: [{
      secret: {
        $exists: true
      }
    }, {
      "secret.algorithm": {
        $exists: false
      }
    }]
  }).forEach(config => {
    ServiceConfiguration.configurations.update(config._id, {
      $set: {
        secret: OAuthEncryption.seal(config.secret)
      }
    });
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/accounts-oauth/oauth_common.js");
require("/node_modules/meteor/accounts-oauth/oauth_server.js");

/* Exports */
Package._define("accounts-oauth");

})();

//# sourceURL=meteor://💻app/packages/accounts-oauth.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYWNjb3VudHMtb2F1dGgvb2F1dGhfY29tbW9uLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9hY2NvdW50cy1vYXV0aC9vYXV0aF9zZXJ2ZXIuanMiXSwibmFtZXMiOlsiTWV0ZW9yIiwibW9kdWxlIiwibGluayIsInYiLCJWQUxJRF9DT05GSUdfS0VZUyIsIkFjY291bnRzIiwib2F1dGgiLCJzZXJ2aWNlcyIsImhhc093biIsIk9iamVjdCIsInByb3RvdHlwZSIsImhhc093blByb3BlcnR5IiwicmVnaXN0ZXJTZXJ2aWNlIiwibmFtZSIsImNhbGwiLCJFcnJvciIsImNvbmNhdCIsInNlcnZlciIsInVzZXJzIiwiY3JlYXRlSW5kZXhBc3luYyIsInVuaXF1ZSIsInNwYXJzZSIsInVucmVnaXN0ZXJTZXJ2aWNlIiwic2VydmljZU5hbWVzIiwia2V5cyIsInN0YXJ0dXAiLCJfTWV0ZW9yJHNldHRpbmdzIiwiX01ldGVvciRzZXR0aW5ncyRwYWNrIiwiU2VydmljZUNvbmZpZ3VyYXRpb24iLCJQYWNrYWdlIiwibG9naW5TZXJ2aWNlQ29uZmlndXJhdGlvbiIsImNvbmZpZ3VyYXRpb25zIiwiQ29uZmlnRXJyb3IiLCJzZXR0aW5ncyIsInBhY2thZ2VzIiwib2F1dGhTZWNyZXRLZXkiLCJPQXV0aEVuY3J5cHRpb24iLCJsb2FkS2V5IiwiZm9yRWFjaCIsImtleSIsImluY2x1ZGVzIiwiX29wdGlvbnMiLCJyZWdpc3RlckxvZ2luSGFuZGxlciIsIm9wdGlvbnMiLCJ1bmRlZmluZWQiLCJjaGVjayIsImNyZWRlbnRpYWxUb2tlbiIsIlN0cmluZyIsImNyZWRlbnRpYWxTZWNyZXQiLCJNYXRjaCIsIk9uZU9mIiwicmVzdWx0IiwiT0F1dGgiLCJyZXRyaWV2ZUNyZWRlbnRpYWwiLCJ0eXBlIiwiZXJyb3IiLCJMb2dpbkNhbmNlbGxlZEVycm9yIiwibnVtZXJpY0Vycm9yIiwic2VydmljZU5hbWUiLCJ1cGRhdGVPckNyZWF0ZVVzZXJGcm9tRXh0ZXJuYWxTZXJ2aWNlIiwic2VydmljZURhdGEiLCJfUGFja2FnZSRvYXV0aEVuY3J5cCIsInVzaW5nT0F1dGhFbmNyeXB0aW9uIiwia2V5SXNMb2FkZWQiLCJmaW5kIiwiJGFuZCIsInNlY3JldCIsIiRleGlzdHMiLCJjb25maWciLCJ1cGRhdGUiLCJfaWQiLCIkc2V0Iiwic2VhbCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUlBLE1BQU07QUFBQ0MsTUFBTSxDQUFDQyxJQUFJLENBQUMsZUFBZSxFQUFDO0VBQUNGLE1BQU1BLENBQUNHLENBQUMsRUFBQztJQUFDSCxNQUFNLEdBQUNHLENBQUM7RUFBQTtBQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7QUFFL0Q7QUFDQTtBQUNBLE1BQU1DLGlCQUFpQixHQUFHLENBQ3hCLHVCQUF1QixFQUN2Qiw2QkFBNkIsRUFDN0IsK0JBQStCLEVBQy9CLHFDQUFxQyxFQUNyQywrQkFBK0IsRUFDL0IsdUJBQXVCLEVBQ3ZCLGlCQUFpQixFQUNqQixvQ0FBb0MsRUFDcEMsOEJBQThCLEVBQzlCLHdCQUF3QixFQUN4QixjQUFjLEVBQ2Qsc0JBQXNCLEVBQ3RCLDJCQUEyQixFQUMzQixxQkFBcUIsQ0FDdEI7QUFFREMsUUFBUSxDQUFDQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBRW5CLE1BQU1DLFFBQVEsR0FBRyxDQUFDLENBQUM7QUFDbkIsTUFBTUMsTUFBTSxHQUFHQyxNQUFNLENBQUNDLFNBQVMsQ0FBQ0MsY0FBYzs7QUFFOUM7QUFDQTtBQUNBTixRQUFRLENBQUNDLEtBQUssQ0FBQ00sZUFBZSxHQUFHQyxJQUFJLElBQUk7RUFDdkMsSUFBSUwsTUFBTSxDQUFDTSxJQUFJLENBQUNQLFFBQVEsRUFBRU0sSUFBSSxDQUFDLEVBQzdCLE1BQU0sSUFBSUUsS0FBSyx1QkFBQUMsTUFBQSxDQUF1QkgsSUFBSSxDQUFFLENBQUM7RUFDL0NOLFFBQVEsQ0FBQ00sSUFBSSxDQUFDLEdBQUcsSUFBSTtFQUVy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Q0E7QUFDQTs7QUFFQSxNQUFNUCxlQUFlLElBQUF5QixvQkFBQSxHQUFHaEMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLGNBQUFnQyxvQkFBQSx1QkFBM0JBLG9CQUFBLENBQTZCekIsZUFBZTtBQUVwRSxNQUFNMEIsb0JBQW9CLEdBQUdBLENBQUEsS0FBTTtFQUNqQyxPQUFPMUIsZUFBZSxhQUFmQSxlQUFlLHVCQUFmQSxlQUFlLENBQUUyQixXQUFXLENBQUMsQ0FBQztBQUN2QyxDQUFDOztBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEvRCxNQUFNLENBQUN5QixPQUFPLENBQUMsTUFBTTtFQUNuQixJQUFJLENBQUVxQyxvQkFBb0IsQ0FBQyxDQUFDLEVBQUU7SUFDNUI7RUFDRjtFQUVBLE1BQU07SUFBRWxDO0VBQXFCLENBQUMsR0FBR0MsT0FBTyxDQUFDLHVCQUF1QixDQUFDO0VBRWpFRCxvQkFBb0IsQ0FBQ0csY0FBYyxDQUFDaUMsSUFBSSxDQUFDO0lBQ3ZDQyxJQUFJLEVBQUUsQ0FBQztNQUNMQyxNQUFNLEVBQUU7UUFBRUMsT0FBTyxFQUFFO01BQUs7SUFDMUIsQ0FBQyxFQUFFO01BQ0Qsa0JBQWtCLEVBQUU7UUFBRUEsT0FBTyxFQUFFO01BQU07SUFDdkMsQ0FBQztFQUNILENBQUMsQ0FBQyxDQUFDN0IsT0FBTyxDQUFDOEIsTUFBTSxJQUFJO0lBQ25CeEMsb0JBQW9CLENBQUNHLGNBQWMsQ0FBQ3NDLE1BQU0sQ0FBQ0QsTUFBTSxDQUFDRSxHQUFHLEVBQUU7TUFDckRDLElBQUksRUFBRTtRQUNKTCxNQUFNLEVBQUU5QixlQUFlLENBQUNvQyxJQUFJLENBQUNKLE1BQU0sQ0FBQ0YsTUFBTTtNQUM1QztJQUNGLENBQUMsQ0FBQztFQUNKLENBQUMsQ0FBQztBQUNKLENBQUMsQ0FBQyxDIiwiZmlsZSI6Ii9wYWNrYWdlcy9hY2NvdW50cy1vYXV0aC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuXG4vLyBUT0RPIGdldCBmcm9tIGFjY291bnQtYmFzZVxuLy8gY29uZmlnIG9wdGlvbiBrZXlzXG5jb25zdCBWQUxJRF9DT05GSUdfS0VZUyA9IFtcbiAgJ3NlbmRWZXJpZmljYXRpb25FbWFpbCcsXG4gICdmb3JiaWRDbGllbnRBY2NvdW50Q3JlYXRpb24nLFxuICAncGFzc3dvcmRFbnJvbGxUb2tlbkV4cGlyYXRpb24nLFxuICAncGFzc3dvcmRFbnJvbGxUb2tlbkV4cGlyYXRpb25JbkRheXMnLFxuICAncmVzdHJpY3RDcmVhdGlvbkJ5RW1haWxEb21haW4nLFxuICAnbG9naW5FeHBpcmF0aW9uSW5EYXlzJyxcbiAgJ2xvZ2luRXhwaXJhdGlvbicsXG4gICdwYXNzd29yZFJlc2V0VG9rZW5FeHBpcmF0aW9uSW5EYXlzJyxcbiAgJ3Bhc3N3b3JkUmVzZXRUb2tlbkV4cGlyYXRpb24nLFxuICAnYW1iaWd1b3VzRXJyb3JNZXNzYWdlcycsXG4gICdiY3J5cHRSb3VuZHMnLFxuICAnZGVmYXVsdEZpZWxkU2VsZWN0b3InLFxuICAnbG9naW5Ub2tlbkV4cGlyYXRpb25Ib3VycycsXG4gICd0b2tlblNlcXVlbmNlTGVuZ3RoJyxcbl07XG5cbkFjY291bnRzLm9hdXRoID0ge307XG5cbmNvbnN0IHNlcnZpY2VzID0ge307XG5jb25zdCBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vLyBIZWxwZXIgZm9yIHJlZ2lzdGVyaW5nIE9BdXRoIGJhc2VkIGFjY291bnRzIHBhY2thZ2VzLlxuLy8gT24gdGhlIHNlcnZlciwgYWRkcyBhbiBpbmRleCB0byB0aGUgdXNlciBjb2xsZWN0aW9uLlxuQWNjb3VudHMub2F1dGgucmVnaXN0ZXJTZXJ2aWNlID0gbmFtZSA9PiB7XG4gIGlmIChoYXNPd24uY2FsbChzZXJ2aWNlcywgbmFtZSkpXG4gICAgdGhyb3cgbmV3IEVycm9yKGBEdXBsaWNhdGUgc2VydmljZTogJHtuYW1lfWApO1xuICBzZXJ2aWNlc1tuYW1lXSA9IHRydWU7XG5cbiAgaWYgKE1ldGVvci5zZXJ2ZXIpIHtcbiAgICAvLyBBY2NvdW50cy51cGRhdGVPckNyZWF0ZVVzZXJGcm9tRXh0ZXJuYWxTZXJ2aWNlIGRvZXMgYSBsb29rdXAgYnkgdGhpcyBpZCxcbiAgICAvLyBzbyB0aGlzIHNob3VsZCBiZSBhIHVuaXF1ZSBpbmRleC4gWW91IG1pZ2h0IHdhbnQgdG8gYWRkIGluZGV4ZXMgZm9yIG90aGVyXG4gICAgLy8gZmllbGRzIHJldHVybmVkIGJ5IHlvdXIgc2VydmljZSAoZWcgc2VydmljZXMuZ2l0aHViLmxvZ2luKSBidXQgeW91IGNhbiBkb1xuICAgIC8vIHRoYXQgaW4geW91ciBhcHAuXG4gICAgTWV0ZW9yLnVzZXJzLmNyZWF0ZUluZGV4QXN5bmMoYHNlcnZpY2VzLiR7bmFtZX0uaWRgLCB7dW5pcXVlOiB0cnVlLCBzcGFyc2U6IHRydWV9KTtcbiAgfVxufTtcblxuLy8gUmVtb3ZlcyBhIHByZXZpb3VzbHkgcmVnaXN0ZXJlZCBzZXJ2aWNlLlxuLy8gVGhpcyB3aWxsIGRpc2FibGUgbG9nZ2luZyBpbiB3aXRoIHRoaXMgc2VydmljZSwgYW5kIHNlcnZpY2VOYW1lcygpIHdpbGwgbm90XG4vLyBjb250YWluIGl0LlxuLy8gSXQncyB3b3J0aCBub3RpbmcgdGhhdCBhbHJlYWR5IGxvZ2dlZCBpbiB1c2VycyB3aWxsIHJlbWFpbiBsb2dnZWQgaW4gdW5sZXNzXG4vLyB5b3UgbWFudWFsbHkgZXhwaXJlIHRoZWlyIHNlc3Npb25zLlxuQWNjb3VudHMub2F1dGgudW5yZWdpc3RlclNlcnZpY2UgPSBuYW1lID0+IHtcbiAgaWYgKCFoYXNPd24uY2FsbChzZXJ2aWNlcywgbmFtZSkpXG4gICAgdGhyb3cgbmV3IEVycm9yKGBTZXJ2aWNlIG5vdCBmb3VuZDogJHtuYW1lfWApO1xuICBkZWxldGUgc2VydmljZXNbbmFtZV07XG59O1xuXG5BY2NvdW50cy5vYXV0aC5zZXJ2aWNlTmFtZXMgPSAoKSA9PiBPYmplY3Qua2V5cyhzZXJ2aWNlcyk7XG5cbi8vIGxvZ2luU2VydmljZUNvbmZpZ3VyYXRpb24gYW5kIENvbmZpZ0Vycm9yIGFyZSBtYWludGFpbmVkIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eVxuTWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuICBjb25zdCB7IFNlcnZpY2VDb25maWd1cmF0aW9uIH0gPSBQYWNrYWdlWydzZXJ2aWNlLWNvbmZpZ3VyYXRpb24nXTtcbiAgQWNjb3VudHMubG9naW5TZXJ2aWNlQ29uZmlndXJhdGlvbiA9IFNlcnZpY2VDb25maWd1cmF0aW9uLmNvbmZpZ3VyYXRpb25zO1xuICBBY2NvdW50cy5Db25maWdFcnJvciA9IFNlcnZpY2VDb25maWd1cmF0aW9uLkNvbmZpZ0Vycm9yO1xuXG4gIGNvbnN0IHNldHRpbmdzID0gTWV0ZW9yLnNldHRpbmdzPy5wYWNrYWdlcz8uWydhY2NvdW50cy1iYXNlJ107XG4gIGlmIChzZXR0aW5ncykge1xuICAgIGlmIChzZXR0aW5ncy5vYXV0aFNlY3JldEtleSkge1xuICAgICAgaWYgKCFQYWNrYWdlWydvYXV0aC1lbmNyeXB0aW9uJ10pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICdUaGUgb2F1dGgtZW5jcnlwdGlvbiBwYWNrYWdlIG11c3QgYmUgbG9hZGVkIHRvIHNldCBvYXV0aFNlY3JldEtleSdcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIFBhY2thZ2VbJ29hdXRoLWVuY3J5cHRpb24nXS5PQXV0aEVuY3J5cHRpb24ubG9hZEtleShcbiAgICAgICAgc2V0dGluZ3Mub2F1dGhTZWNyZXRLZXlcbiAgICAgICk7XG4gICAgICBkZWxldGUgc2V0dGluZ3Mub2F1dGhTZWNyZXRLZXk7XG4gICAgfVxuICAgIC8vIFZhbGlkYXRlIGNvbmZpZyBvcHRpb25zIGtleXNcbiAgICBPYmplY3Qua2V5cyhzZXR0aW5ncykuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgaWYgKCFWQUxJRF9DT05GSUdfS0VZUy5pbmNsdWRlcyhrZXkpKSB7XG4gICAgICAgIC8vIFRPRE8gQ29uc2lkZXIganVzdCBsb2dnaW5nIGEgZGVidWcgbWVzc2FnZSBpbnN0ZWFkIHRvIGFsbG93IGZvciBhZGRpdGlvbmFsIGtleXMgaW4gdGhlIHNldHRpbmdzIGhlcmU/XG4gICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXG4gICAgICAgICAgYEFjY291bnRzIGNvbmZpZ3VyYXRpb246IEludmFsaWQga2V5OiAke2tleX1gXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBzZXQgdmFsdWVzIGluIEFjY291bnRzLl9vcHRpb25zXG4gICAgICAgIEFjY291bnRzLl9vcHRpb25zW2tleV0gPSBzZXR0aW5nc1trZXldO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59KTtcbiIsImltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuXG4vLyBMaXN0ZW4gdG8gY2FsbHMgdG8gYGxvZ2luYCB3aXRoIGFuIG9hdXRoIG9wdGlvbiBzZXQuIFRoaXMgaXMgd2hlcmVcbi8vIHVzZXJzIGFjdHVhbGx5IGdldCBsb2dnZWQgaW4gdG8gbWV0ZW9yIHZpYSBvYXV0aC5cbkFjY291bnRzLnJlZ2lzdGVyTG9naW5IYW5kbGVyKG9wdGlvbnMgPT4ge1xuICBpZiAoIW9wdGlvbnMub2F1dGgpXG4gICAgcmV0dXJuIHVuZGVmaW5lZDsgLy8gZG9uJ3QgaGFuZGxlXG5cbiAgY2hlY2sob3B0aW9ucy5vYXV0aCwge1xuICAgIGNyZWRlbnRpYWxUb2tlbjogU3RyaW5nLFxuICAgIC8vIFdoZW4gYW4gZXJyb3Igb2NjdXJzIHdoaWxlIHJldHJpZXZpbmcgdGhlIGFjY2VzcyB0b2tlbiwgd2Ugc3RvcmVcbiAgICAvLyB0aGUgZXJyb3IgaW4gdGhlIHBlbmRpbmcgY3JlZGVudGlhbHMgdGFibGUsIHdpdGggYSBzZWNyZXQgb2ZcbiAgICAvLyBudWxsLiBUaGUgY2xpZW50IGNhbiBjYWxsIHRoZSBsb2dpbiBtZXRob2Qgd2l0aCBhIHNlY3JldCBvZiBudWxsXG4gICAgLy8gdG8gcmV0cmlldmUgdGhlIGVycm9yLlxuICAgIGNyZWRlbnRpYWxTZWNyZXQ6IE1hdGNoLk9uZU9mKG51bGwsIFN0cmluZylcbiAgfSk7XG5cbiAgY29uc3QgcmVzdWx0ID0gT0F1dGgucmV0cmlldmVDcmVkZW50aWFsKG9wdGlvbnMub2F1dGguY3JlZGVudGlhbFRva2VuLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMub2F1dGguY3JlZGVudGlhbFNlY3JldCk7XG5cbiAgaWYgKCFyZXN1bHQpIHtcbiAgICAvLyBPQXV0aCBjcmVkZW50aWFsVG9rZW4gaXMgbm90IHJlY29nbml6ZWQsIHdoaWNoIGNvdWxkIGJlIGVpdGhlclxuICAgIC8vIGJlY2F1c2UgdGhlIHBvcHVwIHdhcyBjbG9zZWQgYnkgdGhlIHVzZXIgYmVmb3JlIGNvbXBsZXRpb24sIG9yXG4gICAgLy8gc29tZSBzb3J0IG9mIGVycm9yIHdoZXJlIHRoZSBvYXV0aCBwcm92aWRlciBkaWRuJ3QgdGFsayB0byBvdXJcbiAgICAvLyBzZXJ2ZXIgY29ycmVjdGx5IGFuZCBjbG9zZWQgdGhlIHBvcHVwIHNvbWVob3cuXG4gICAgLy9cbiAgICAvLyBXZSBhc3N1bWUgaXQgd2FzIHVzZXIgY2FuY2VsZWQgYW5kIHJlcG9ydCBpdCBhcyBzdWNoLCB1c2luZyBhXG4gICAgLy8gbnVtZXJpYyBjb2RlIHRoYXQgdGhlIGNsaWVudCByZWNvZ25pemVzIChYWFggdGhpcyB3aWxsIGdldFxuICAgIC8vIHJlcGxhY2VkIGJ5IGEgc3ltYm9saWMgZXJyb3IgY29kZSBhdCBzb21lIHBvaW50XG4gICAgLy8gaHR0cHM6Ly90cmVsbG8uY29tL2Mva01rdzgwMFovNTMtb2ZmaWNpYWwtZGRwLXNwZWNpZmljYXRpb24pLiBUaGlzXG4gICAgLy8gd2lsbCBtYXNrIGZhaWx1cmVzIHdoZXJlIHRoaW5ncyBhcmUgbWlzY29uZmlndXJlZCBzdWNoIHRoYXQgdGhlXG4gICAgLy8gc2VydmVyIGRvZXNuJ3Qgc2VlIHRoZSByZXF1ZXN0IGJ1dCBkb2VzIGNsb3NlIHRoZSB3aW5kb3cuIFRoaXNcbiAgICAvLyBzZWVtcyB1bmxpa2VseS5cbiAgICAvL1xuICAgIC8vIFhYWCB3ZSB3YW50IGB0eXBlYCB0byBiZSB0aGUgc2VydmljZSBuYW1lIHN1Y2ggYXMgXCJmYWNlYm9va1wiXG4gICAgcmV0dXJuIHsgdHlwZTogXCJvYXV0aFwiLFxuICAgICAgICAgICAgIGVycm9yOiBuZXcgTWV0ZW9yLkVycm9yKFxuICAgICAgICAgICAgICAgQWNjb3VudHMuTG9naW5DYW5jZWxsZWRFcnJvci5udW1lcmljRXJyb3IsXG4gICAgICAgICAgICAgICBcIk5vIG1hdGNoaW5nIGxvZ2luIGF0dGVtcHQgZm91bmRcIikgfTtcbiAgfVxuXG4gIGlmIChyZXN1bHQgaW5zdGFuY2VvZiBFcnJvcilcbiAgICAvLyBXZSB0cmllZCB0byBsb2dpbiwgYnV0IHRoZXJlIHdhcyBhIGZhdGFsIGVycm9yLiBSZXBvcnQgaXQgYmFja1xuICAgIC8vIHRvIHRoZSB1c2VyLlxuICAgIHRocm93IHJlc3VsdDtcbiAgZWxzZSB7XG4gICAgaWYgKCEgQWNjb3VudHMub2F1dGguc2VydmljZU5hbWVzKCkuaW5jbHVkZXMocmVzdWx0LnNlcnZpY2VOYW1lKSkge1xuICAgICAgLy8gc2VydmljZU5hbWUgd2FzIG5vdCBmb3VuZCBpbiB0aGUgcmVnaXN0ZXJlZCBzZXJ2aWNlcyBsaXN0LlxuICAgICAgLy8gVGhpcyBjb3VsZCBoYXBwZW4gYmVjYXVzZSB0aGUgc2VydmljZSBuZXZlciByZWdpc3RlcmVkIGl0c2VsZiBvclxuICAgICAgLy8gdW5yZWdpc3RlclNlcnZpY2Ugd2FzIGNhbGxlZCBvbiBpdC5cbiAgICAgIHJldHVybiB7IHR5cGU6IFwib2F1dGhcIixcbiAgICAgICAgICAgICAgIGVycm9yOiBuZXcgTWV0ZW9yLkVycm9yKFxuICAgICAgICAgICAgICAgICBBY2NvdW50cy5Mb2dpbkNhbmNlbGxlZEVycm9yLm51bWVyaWNFcnJvcixcbiAgICAgICAgICAgICAgICAgYE5vIHJlZ2lzdGVyZWQgb2F1dGggc2VydmljZSBmb3VuZCBmb3I6ICR7cmVzdWx0LnNlcnZpY2VOYW1lfWApIH07XG5cbiAgICB9XG4gICAgcmV0dXJuIEFjY291bnRzLnVwZGF0ZU9yQ3JlYXRlVXNlckZyb21FeHRlcm5hbFNlcnZpY2UocmVzdWx0LnNlcnZpY2VOYW1lLCByZXN1bHQuc2VydmljZURhdGEsIHJlc3VsdC5vcHRpb25zKTtcbiAgfVxufSk7XG5cbi8vL1xuLy8vIE9BdXRoIEVuY3J5cHRpb24gU3VwcG9ydFxuLy8vXG5cbmNvbnN0IE9BdXRoRW5jcnlwdGlvbiA9IFBhY2thZ2VbXCJvYXV0aC1lbmNyeXB0aW9uXCJdPy5PQXV0aEVuY3J5cHRpb247XG5cbmNvbnN0IHVzaW5nT0F1dGhFbmNyeXB0aW9uID0gKCkgPT4ge1xuICByZXR1cm4gT0F1dGhFbmNyeXB0aW9uPy5rZXlJc0xvYWRlZCgpO1xufTtcblxuLy8gRW5jcnlwdCB1bmVuY3J5cHRlZCBsb2dpbiBzZXJ2aWNlIHNlY3JldHMgd2hlbiBvYXV0aC1lbmNyeXB0aW9uIGlzXG4vLyBhZGRlZC5cbi8vXG4vLyBYWFggRm9yIHRoZSBvYXV0aFNlY3JldEtleSB0byBiZSBhdmFpbGFibGUgaGVyZSBhdCBzdGFydHVwLCB0aGVcbi8vIGRldmVsb3BlciBtdXN0IGNhbGwgQWNjb3VudHMuY29uZmlnKHtvYXV0aFNlY3JldEtleTogLi4ufSkgYXQgbG9hZFxuLy8gdGltZSwgaW5zdGVhZCBvZiBpbiBhIE1ldGVvci5zdGFydHVwIGJsb2NrLCBiZWNhdXNlIHRoZSBzdGFydHVwXG4vLyBibG9jayBpbiB0aGUgYXBwIGNvZGUgd2lsbCBydW4gYWZ0ZXIgdGhpcyBhY2NvdW50cy1iYXNlIHN0YXJ0dXBcbi8vIGJsb2NrLiAgUGVyaGFwcyB3ZSBuZWVkIGEgcG9zdC1zdGFydHVwIGNhbGxiYWNrP1xuXG5NZXRlb3Iuc3RhcnR1cCgoKSA9PiB7XG4gIGlmICghIHVzaW5nT0F1dGhFbmNyeXB0aW9uKCkpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCB7IFNlcnZpY2VDb25maWd1cmF0aW9uIH0gPSBQYWNrYWdlWydzZXJ2aWNlLWNvbmZpZ3VyYXRpb24nXTtcblxuICBTZXJ2aWNlQ29uZmlndXJhdGlvbi5jb25maWd1cmF0aW9ucy5maW5kKHtcbiAgICAkYW5kOiBbe1xuICAgICAgc2VjcmV0OiB7ICRleGlzdHM6IHRydWUgfVxuICAgIH0sIHtcbiAgICAgIFwic2VjcmV0LmFsZ29yaXRobVwiOiB7ICRleGlzdHM6IGZhbHNlIH1cbiAgICB9XVxuICB9KS5mb3JFYWNoKGNvbmZpZyA9PiB7XG4gICAgU2VydmljZUNvbmZpZ3VyYXRpb24uY29uZmlndXJhdGlvbnMudXBkYXRlKGNvbmZpZy5faWQsIHtcbiAgICAgICRzZXQ6IHtcbiAgICAgICAgc2VjcmV0OiBPQXV0aEVuY3J5cHRpb24uc2VhbChjb25maWcuc2VjcmV0KVxuICAgICAgfVxuICAgIH0pO1xuICB9KTtcbn0pO1xuIl19
