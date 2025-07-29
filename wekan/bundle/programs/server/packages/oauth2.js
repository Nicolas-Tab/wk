(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Random = Package.random.Random;
var OAuth = Package.oauth.OAuth;
var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"oauth2":{"oauth2_server.js":function module(){

////////////////////////////////////////////////////////////////////////////////////
//                                                                                //
// packages/oauth2/oauth2_server.js                                               //
//                                                                                //
////////////////////////////////////////////////////////////////////////////////////
                                                                                  //
// connect middleware
OAuth._requestHandlers['2'] = (service, query, res) => Promise.asyncApply(() => {
  let credentialSecret;

  // check if user authorized access
  if (!query.error) {
    // Prepare the login results before returning.

    // Run service-specific handler.
    const oauthResult = Promise.await(service.handleOauthRequest(query));
    credentialSecret = Random.secret();
    const credentialToken = OAuth._credentialTokenFromQuery(query);

    // Store the login result so it can be retrieved in another
    // browser tab by the result handler
    OAuth._storePendingCredential(credentialToken, {
      serviceName: service.serviceName,
      serviceData: oauthResult.serviceData,
      options: oauthResult.options
    }, credentialSecret);
  }

  // Either close the window, redirect, or render nothing
  // if all else fails
  OAuth._renderOauthResults(res, query, credentialSecret);
});
////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/oauth2/oauth2_server.js");

/* Exports */
Package._define("oauth2");

})();

//# sourceURL=meteor://💻app/packages/oauth2.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2F1dGgyL29hdXRoMl9zZXJ2ZXIuanMiXSwibmFtZXMiOlsiT0F1dGgiLCJfcmVxdWVzdEhhbmRsZXJzIiwic2VydmljZSIsInF1ZXJ5IiwicmVzIiwiUHJvbWlzZSIsImFzeW5jQXBwbHkiLCJjcmVkZW50aWFsU2VjcmV0IiwiZXJyb3IiLCJvYXV0aFJlc3VsdCIsImF3YWl0IiwiaGFuZGxlT2F1dGhSZXF1ZXN0IiwiUmFuZG9tIiwic2VjcmV0IiwiY3JlZGVudGlhbFRva2VuIiwiX2NyZWRlbnRpYWxUb2tlbkZyb21RdWVyeSIsIl9zdG9yZVBlbmRpbmdDcmVkZW50aWFsIiwic2VydmljZU5hbWUiLCJzZXJ2aWNlRGF0YSIsIm9wdGlvbnMiLCJfcmVuZGVyT2F1dGhSZXN1bHRzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUNBQSxLQUFLLENBQUNDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQU9DLE9BQU8sRUFBRUMsS0FBSyxFQUFFQyxHQUFHLEtBQUFDLE9BQUEsQ0FBQUMsVUFBQSxPQUFLO0VBQzNELElBQUlDLGdCQUFnQjs7RUFFcEI7RUFDQSxJQUFJLENBQUNKLEtBQUssQ0FBQ0ssS0FBSyxFQUFFO0lBQ2hCOztJQUVBO0lBQ0EsTUFBTUMsV0FBVyxHQUFBSixPQUFBLENBQUFLLEtBQUEsQ0FBU1IsT0FBTyxDQUFDUyxrQkFBa0IsQ0FBQ1IsS0FBSyxDQUFDO0lBQzNESSxnQkFBZ0IsR0FBR0ssTUFBTSxDQUFDQyxNQUFNLENBQUMsQ0FBQztJQUVsQyxNQUFNQyxlQUFlLEdBQUdkLEtBQUssQ0FBQ2UseUJBQXlCLENBQUNaLEtBQUssQ0FBQzs7SUFFOUQ7SUFDQTtJQUNBSCxLQUFLLENBQUNnQix1QkFBdUIsQ0FBQ0YsZUFBZSxFQUFFO01BQzdDRyxXQUFXLEVBQUVmLE9BQU8sQ0FBQ2UsV0FBVztNQUNoQ0MsV0FBVyxFQUFFVCxXQUFXLENBQUNTLFdBQVc7TUFDcENDLE9BQU8sRUFBRVYsV0FBVyxDQUFDVTtJQUN2QixDQUFDLEVBQUVaLGdCQUFnQixDQUFDO0VBQ3RCOztFQUVBO0VBQ0E7RUFDQVAsS0FBSyxDQUFDb0IsbUJBQW1CLENBQUNoQixHQUFHLEVBQUVELEtBQUssRUFBRUksZ0JBQWdCLENBQUM7QUFDekQsQ0FBQyxFIiwiZmlsZSI6Ii9wYWNrYWdlcy9vYXV0aDIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBjb25uZWN0IG1pZGRsZXdhcmVcbk9BdXRoLl9yZXF1ZXN0SGFuZGxlcnNbJzInXSA9IGFzeW5jIChzZXJ2aWNlLCBxdWVyeSwgcmVzKSA9PiB7XG4gIGxldCBjcmVkZW50aWFsU2VjcmV0O1xuXG4gIC8vIGNoZWNrIGlmIHVzZXIgYXV0aG9yaXplZCBhY2Nlc3NcbiAgaWYgKCFxdWVyeS5lcnJvcikge1xuICAgIC8vIFByZXBhcmUgdGhlIGxvZ2luIHJlc3VsdHMgYmVmb3JlIHJldHVybmluZy5cblxuICAgIC8vIFJ1biBzZXJ2aWNlLXNwZWNpZmljIGhhbmRsZXIuXG4gICAgY29uc3Qgb2F1dGhSZXN1bHQgPSBhd2FpdCBzZXJ2aWNlLmhhbmRsZU9hdXRoUmVxdWVzdChxdWVyeSk7XG4gICAgY3JlZGVudGlhbFNlY3JldCA9IFJhbmRvbS5zZWNyZXQoKTtcblxuICAgIGNvbnN0IGNyZWRlbnRpYWxUb2tlbiA9IE9BdXRoLl9jcmVkZW50aWFsVG9rZW5Gcm9tUXVlcnkocXVlcnkpO1xuXG4gICAgLy8gU3RvcmUgdGhlIGxvZ2luIHJlc3VsdCBzbyBpdCBjYW4gYmUgcmV0cmlldmVkIGluIGFub3RoZXJcbiAgICAvLyBicm93c2VyIHRhYiBieSB0aGUgcmVzdWx0IGhhbmRsZXJcbiAgICBPQXV0aC5fc3RvcmVQZW5kaW5nQ3JlZGVudGlhbChjcmVkZW50aWFsVG9rZW4sIHtcbiAgICAgIHNlcnZpY2VOYW1lOiBzZXJ2aWNlLnNlcnZpY2VOYW1lLFxuICAgICAgc2VydmljZURhdGE6IG9hdXRoUmVzdWx0LnNlcnZpY2VEYXRhLFxuICAgICAgb3B0aW9uczogb2F1dGhSZXN1bHQub3B0aW9uc1xuICAgIH0sIGNyZWRlbnRpYWxTZWNyZXQpO1xuICB9XG5cbiAgLy8gRWl0aGVyIGNsb3NlIHRoZSB3aW5kb3csIHJlZGlyZWN0LCBvciByZW5kZXIgbm90aGluZ1xuICAvLyBpZiBhbGwgZWxzZSBmYWlsc1xuICBPQXV0aC5fcmVuZGVyT2F1dGhSZXN1bHRzKHJlcywgcXVlcnksIGNyZWRlbnRpYWxTZWNyZXQpO1xufTtcbiJdfQ==
