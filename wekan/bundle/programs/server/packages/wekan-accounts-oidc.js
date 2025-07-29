(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Accounts = Package['accounts-base'].Accounts;
var Oidc = Package['wekan-oidc'].Oidc;

(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                     //
// packages/wekan-accounts-oidc/oidc.js                                                                //
//                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                       //
Accounts.oauth.registerService('oidc');

if (Meteor.isClient) {
  Meteor.loginWithOidc = function(options, callback) {
    // support a callback without options
    if (! callback && typeof options === "function") {
      callback = options;
      options = null;
    }
    var credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback);
    Oidc.requestCredential(options, credentialRequestCompleteCallback);
  };
  }
  else {
  Accounts.addAutopublishFields({
    // not sure whether the OIDC api can be used from the browser,
    // thus not sure if we should be sending access tokens; but we do it
    // for all other oauth2 providers, and it may come in handy.
    forLoggedInUser: ['services.oidc'],
    forOtherUsers: ['services.oidc.id']
  });
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("wekan-accounts-oidc");

})();
