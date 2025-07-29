(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Accounts = Package['accounts-base'].Accounts;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var ServiceConfiguration;

var require = meteorInstall({"node_modules":{"meteor":{"service-configuration":{"service_configuration_common.js":function module(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                        //
// packages/service-configuration/service_configuration_common.js                                         //
//                                                                                                        //
////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                          //
if (typeof ServiceConfiguration === 'undefined') {
  ServiceConfiguration = {};
}

// Table containing documents with configuration options for each
// login service
ServiceConfiguration.configurations = new Mongo.Collection('meteor_accounts_loginServiceConfiguration', {
  _preventAutopublish: true,
  connection: Meteor.isClient ? Accounts.connection : Meteor.connection
});
// Leave this collection open in insecure mode. In theory, someone could
// hijack your oauth connect requests to a different endpoint or appId,
// but you did ask for 'insecure'. The advantage is that it is much
// easier to write a configuration wizard that works only in insecure
// mode.

// Thrown when trying to use a login service which is not configured
ServiceConfiguration.ConfigError = function (serviceName) {
  if (Meteor.isClient && !Accounts.loginServicesConfigured()) {
    this.message = 'Login service configuration not yet loaded';
  } else if (serviceName) {
    this.message = 'Service ' + serviceName + ' not configured';
  } else {
    this.message = 'Service not configured';
  }
};
ServiceConfiguration.ConfigError.prototype = new Error();
ServiceConfiguration.ConfigError.prototype.name = 'ServiceConfiguration.ConfigError';
////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"service_configuration_server.js":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                        //
// packages/service-configuration/service_configuration_server.js                                         //
//                                                                                                        //
////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                          //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 0);
// Only one configuration should ever exist for each service.
// A unique index helps avoid various race conditions which could
// otherwise lead to an inconsistent database state (when there are multiple
// configurations for a single service, which configuration is correct?)
try {
  ServiceConfiguration.configurations.createIndexAsync({
    service: 1
  }, {
    unique: true
  });
} catch (err) {
  console.error('The service-configuration package persists configuration in the ' + 'meteor_accounts_loginServiceConfiguration collection in MongoDB. As ' + 'each service should have exactly one configuration, Meteor ' + 'automatically creates a MongoDB index with a unique constraint on the ' + ' meteor_accounts_loginServiceConfiguration collection. The ' + 'createIndex command which creates that index is failing.\n\n' + 'Meteor versions before 1.0.4 did not create this index. If you recently ' + 'upgraded and are seeing this error message for the first time, please ' + 'check your meteor_accounts_loginServiceConfiguration collection for ' + 'multiple configuration entries for the same service and delete ' + 'configuration entries until there is no more than one configuration ' + 'entry per service.\n\n' + 'If the meteor_accounts_loginServiceConfiguration collection looks ' + 'fine, the createIndex command is failing for some other reason.\n\n' + 'For more information on this history of this issue, please see ' + 'https://github.com/meteor/meteor/pull/3514.\n');
  throw err;
}
Meteor.startup(() => {
  var _Meteor$settings, _Meteor$settings$pack;
  const settings = (_Meteor$settings = Meteor.settings) === null || _Meteor$settings === void 0 ? void 0 : (_Meteor$settings$pack = _Meteor$settings.packages) === null || _Meteor$settings$pack === void 0 ? void 0 : _Meteor$settings$pack['service-configuration'];
  if (!settings) return;
  Object.keys(settings).forEach(key => {
    ServiceConfiguration.configurations.upsert({
      service: key
    }, {
      $set: settings[key]
    });
  });
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/service-configuration/service_configuration_common.js");
require("/node_modules/meteor/service-configuration/service_configuration_server.js");

/* Exports */
Package._define("service-configuration", {
  ServiceConfiguration: ServiceConfiguration
});

})();

//# sourceURL=meteor://💻app/packages/service-configuration.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc2VydmljZS1jb25maWd1cmF0aW9uL3NlcnZpY2VfY29uZmlndXJhdGlvbl9jb21tb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3NlcnZpY2UtY29uZmlndXJhdGlvbi9zZXJ2aWNlX2NvbmZpZ3VyYXRpb25fc2VydmVyLmpzIl0sIm5hbWVzIjpbIlNlcnZpY2VDb25maWd1cmF0aW9uIiwiY29uZmlndXJhdGlvbnMiLCJNb25nbyIsIkNvbGxlY3Rpb24iLCJfcHJldmVudEF1dG9wdWJsaXNoIiwiY29ubmVjdGlvbiIsIk1ldGVvciIsImlzQ2xpZW50IiwiQWNjb3VudHMiLCJDb25maWdFcnJvciIsInNlcnZpY2VOYW1lIiwibG9naW5TZXJ2aWNlc0NvbmZpZ3VyZWQiLCJtZXNzYWdlIiwicHJvdG90eXBlIiwiRXJyb3IiLCJuYW1lIiwibW9kdWxlIiwibGluayIsInYiLCJjcmVhdGVJbmRleEFzeW5jIiwic2VydmljZSIsInVuaXF1ZSIsImVyciIsImNvbnNvbGUiLCJlcnJvciIsInN0YXJ0dXAiLCJfTWV0ZW9yJHNldHRpbmdzIiwiX01ldGVvciRzZXR0aW5ncyRwYWNrIiwic2V0dGluZ3MiLCJwYWNrYWdlcyIsIk9iamVjdCIsImtleXMiLCJmb3JFYWNoIiwia2V5IiwidXBzZXJ0IiwiJHNldCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsSUFBSSxPQUFPQSxvQkFBb0IsS0FBSyxXQUFXLEVBQUU7RUFDL0NBLG9CQUFvQixHQUFHLENBQUMsQ0FBQztBQUMzQjs7QUFFQTtBQUNBO0FBQ0FBLG9CQUFvQixDQUFDQyxjQUFjLEdBQUcsSUFBSUMsS0FBSyxDQUFDQyxVQUFVLENBQ3hELDJDQUEyQyxFQUMzQztFQUNFQyxtQkFBbUIsRUFBRSxJQUFJO0VBQ3pCQyxVQUFVLEVBQUVDLE1BQU0sQ0FBQ0MsUUFBUSxHQUFHQyxRQUFRLENBQUNILFVBQVUsR0FBR0MsTUFBTSxDQUFDRDtBQUM3RCxDQUNGLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0FMLG9CQUFvQixDQUFDUyxXQUFXLEdBQUcsVUFBU0MsV0FBVyxFQUFFO0VBQ3ZELElBQUlKLE1BQU0sQ0FBQ0MsUUFBUSxJQUFJLENBQUNDLFFBQVEsQ0FBQ0csdUJBQXVCLENBQUMsQ0FBQyxFQUFFO0lBQzFELElBQUksQ0FBQ0MsT0FBTyxHQUFHLDRDQUE0QztFQUM3RCxDQUFDLE1BQU0sSUFBSUYsV0FBVyxFQUFFO0lBQ3RCLElBQUksQ0FBQ0UsT0FBTyxHQUFHLFVBQVUsR0FBR0YsV0FBVyxHQUFHLGlCQUFpQjtFQUM3RCxDQUFDLE1BQU07SUFDTCxJQUFJLENBQUNFLE9BQU8sR0FBRyx3QkFBd0I7RUFDekM7QUFDRixDQUFDO0FBQ0RaLG9CQUFvQixDQUFDUyxXQUFXLENBQUNJLFNBQVMsR0FBRyxJQUFJQyxLQUFLLENBQUMsQ0FBQztBQUN4RGQsb0JBQW9CLENBQUNTLFdBQVcsQ0FBQ0ksU0FBUyxDQUFDRSxJQUFJLEdBQzdDLGtDQUFrQyxDOzs7Ozs7Ozs7OztBQy9CcEMsSUFBSVQsTUFBTTtBQUFDVSxNQUFNLENBQUNDLElBQUksQ0FBQyxlQUFlLEVBQUM7RUFBQ1gsTUFBTUEsQ0FBQ1ksQ0FBQyxFQUFDO0lBQUNaLE1BQU0sR0FBQ1ksQ0FBQztFQUFBO0FBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztBQUUvRDtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUk7RUFDRmxCLG9CQUFvQixDQUFDQyxjQUFjLENBQUNrQixnQkFBZ0IsQ0FDbEQ7SUFBRUMsT0FBTyxFQUFFO0VBQUUsQ0FBQyxFQUNkO0lBQUVDLE1BQU0sRUFBRTtFQUFLLENBQ2pCLENBQUM7QUFDSCxDQUFDLENBQUMsT0FBT0MsR0FBRyxFQUFFO0VBQ1pDLE9BQU8sQ0FBQ0MsS0FBSyxDQUNYLGtFQUFrRSxHQUNoRSxzRUFBc0UsR0FDdEUsNkRBQTZELEdBQzdELHdFQUF3RSxHQUN4RSw2REFBNkQsR0FDN0QsOERBQThELEdBQzlELDBFQUEwRSxHQUMxRSx3RUFBd0UsR0FDeEUsc0VBQXNFLEdBQ3RFLGlFQUFpRSxHQUNqRSxzRUFBc0UsR0FDdEUsd0JBQXdCLEdBQ3hCLG9FQUFvRSxHQUNwRSxxRUFBcUUsR0FDckUsaUVBQWlFLEdBQ2pFLCtDQUNKLENBQUM7RUFDRCxNQUFNRixHQUFHO0FBQ1g7QUFFQWhCLE1BQU0sQ0FBQ21CLE9BQU8sQ0FBQyxNQUFNO0VBQUEsSUFBQUMsZ0JBQUEsRUFBQUMscUJBQUE7RUFDbkIsTUFBTUMsUUFBUSxJQUFBRixnQkFBQSxHQUFHcEIsTUFBTSxDQUFDc0IsUUFBUSxjQUFBRixnQkFBQSx3QkFBQUMscUJBQUEsR0FBZkQsZ0JBQUEsQ0FBaUJHLFFBQVEsY0FBQUYscUJBQUEsdUJBQXpCQSxxQkFBQSxDQUE0Qix1QkFBdUIsQ0FBQztFQUNyRSxJQUFJLENBQUNDLFFBQVEsRUFBRTtFQUNmRSxNQUFNLENBQUNDLElBQUksQ0FBQ0gsUUFBUSxDQUFDLENBQUNJLE9BQU8sQ0FBQ0MsR0FBRyxJQUFJO0lBQ25DakMsb0JBQW9CLENBQUNDLGNBQWMsQ0FBQ2lDLE1BQU0sQ0FDeEM7TUFBRWQsT0FBTyxFQUFFYTtJQUFJLENBQUMsRUFDaEI7TUFDRUUsSUFBSSxFQUFFUCxRQUFRLENBQUNLLEdBQUc7SUFDcEIsQ0FDRixDQUFDO0VBQ0gsQ0FBQyxDQUFDO0FBQ0osQ0FBQyxDQUFDLEMiLCJmaWxlIjoiL3BhY2thZ2VzL3NlcnZpY2UtY29uZmlndXJhdGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImlmICh0eXBlb2YgU2VydmljZUNvbmZpZ3VyYXRpb24gPT09ICd1bmRlZmluZWQnKSB7XG4gIFNlcnZpY2VDb25maWd1cmF0aW9uID0ge307XG59XG5cbi8vIFRhYmxlIGNvbnRhaW5pbmcgZG9jdW1lbnRzIHdpdGggY29uZmlndXJhdGlvbiBvcHRpb25zIGZvciBlYWNoXG4vLyBsb2dpbiBzZXJ2aWNlXG5TZXJ2aWNlQ29uZmlndXJhdGlvbi5jb25maWd1cmF0aW9ucyA9IG5ldyBNb25nby5Db2xsZWN0aW9uKFxuICAnbWV0ZW9yX2FjY291bnRzX2xvZ2luU2VydmljZUNvbmZpZ3VyYXRpb24nLFxuICB7XG4gICAgX3ByZXZlbnRBdXRvcHVibGlzaDogdHJ1ZSxcbiAgICBjb25uZWN0aW9uOiBNZXRlb3IuaXNDbGllbnQgPyBBY2NvdW50cy5jb25uZWN0aW9uIDogTWV0ZW9yLmNvbm5lY3Rpb24sXG4gIH1cbik7XG4vLyBMZWF2ZSB0aGlzIGNvbGxlY3Rpb24gb3BlbiBpbiBpbnNlY3VyZSBtb2RlLiBJbiB0aGVvcnksIHNvbWVvbmUgY291bGRcbi8vIGhpamFjayB5b3VyIG9hdXRoIGNvbm5lY3QgcmVxdWVzdHMgdG8gYSBkaWZmZXJlbnQgZW5kcG9pbnQgb3IgYXBwSWQsXG4vLyBidXQgeW91IGRpZCBhc2sgZm9yICdpbnNlY3VyZScuIFRoZSBhZHZhbnRhZ2UgaXMgdGhhdCBpdCBpcyBtdWNoXG4vLyBlYXNpZXIgdG8gd3JpdGUgYSBjb25maWd1cmF0aW9uIHdpemFyZCB0aGF0IHdvcmtzIG9ubHkgaW4gaW5zZWN1cmVcbi8vIG1vZGUuXG5cbi8vIFRocm93biB3aGVuIHRyeWluZyB0byB1c2UgYSBsb2dpbiBzZXJ2aWNlIHdoaWNoIGlzIG5vdCBjb25maWd1cmVkXG5TZXJ2aWNlQ29uZmlndXJhdGlvbi5Db25maWdFcnJvciA9IGZ1bmN0aW9uKHNlcnZpY2VOYW1lKSB7XG4gIGlmIChNZXRlb3IuaXNDbGllbnQgJiYgIUFjY291bnRzLmxvZ2luU2VydmljZXNDb25maWd1cmVkKCkpIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSAnTG9naW4gc2VydmljZSBjb25maWd1cmF0aW9uIG5vdCB5ZXQgbG9hZGVkJztcbiAgfSBlbHNlIGlmIChzZXJ2aWNlTmFtZSkge1xuICAgIHRoaXMubWVzc2FnZSA9ICdTZXJ2aWNlICcgKyBzZXJ2aWNlTmFtZSArICcgbm90IGNvbmZpZ3VyZWQnO1xuICB9IGVsc2Uge1xuICAgIHRoaXMubWVzc2FnZSA9ICdTZXJ2aWNlIG5vdCBjb25maWd1cmVkJztcbiAgfVxufTtcblNlcnZpY2VDb25maWd1cmF0aW9uLkNvbmZpZ0Vycm9yLnByb3RvdHlwZSA9IG5ldyBFcnJvcigpO1xuU2VydmljZUNvbmZpZ3VyYXRpb24uQ29uZmlnRXJyb3IucHJvdG90eXBlLm5hbWUgPVxuICAnU2VydmljZUNvbmZpZ3VyYXRpb24uQ29uZmlnRXJyb3InO1xuIiwiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5cbi8vIE9ubHkgb25lIGNvbmZpZ3VyYXRpb24gc2hvdWxkIGV2ZXIgZXhpc3QgZm9yIGVhY2ggc2VydmljZS5cbi8vIEEgdW5pcXVlIGluZGV4IGhlbHBzIGF2b2lkIHZhcmlvdXMgcmFjZSBjb25kaXRpb25zIHdoaWNoIGNvdWxkXG4vLyBvdGhlcndpc2UgbGVhZCB0byBhbiBpbmNvbnNpc3RlbnQgZGF0YWJhc2Ugc3RhdGUgKHdoZW4gdGhlcmUgYXJlIG11bHRpcGxlXG4vLyBjb25maWd1cmF0aW9ucyBmb3IgYSBzaW5nbGUgc2VydmljZSwgd2hpY2ggY29uZmlndXJhdGlvbiBpcyBjb3JyZWN0PylcbnRyeSB7XG4gIFNlcnZpY2VDb25maWd1cmF0aW9uLmNvbmZpZ3VyYXRpb25zLmNyZWF0ZUluZGV4QXN5bmMoXG4gICAgeyBzZXJ2aWNlOiAxIH0sXG4gICAgeyB1bmlxdWU6IHRydWUgfVxuICApO1xufSBjYXRjaCAoZXJyKSB7XG4gIGNvbnNvbGUuZXJyb3IoXG4gICAgJ1RoZSBzZXJ2aWNlLWNvbmZpZ3VyYXRpb24gcGFja2FnZSBwZXJzaXN0cyBjb25maWd1cmF0aW9uIGluIHRoZSAnICtcbiAgICAgICdtZXRlb3JfYWNjb3VudHNfbG9naW5TZXJ2aWNlQ29uZmlndXJhdGlvbiBjb2xsZWN0aW9uIGluIE1vbmdvREIuIEFzICcgK1xuICAgICAgJ2VhY2ggc2VydmljZSBzaG91bGQgaGF2ZSBleGFjdGx5IG9uZSBjb25maWd1cmF0aW9uLCBNZXRlb3IgJyArXG4gICAgICAnYXV0b21hdGljYWxseSBjcmVhdGVzIGEgTW9uZ29EQiBpbmRleCB3aXRoIGEgdW5pcXVlIGNvbnN0cmFpbnQgb24gdGhlICcgK1xuICAgICAgJyBtZXRlb3JfYWNjb3VudHNfbG9naW5TZXJ2aWNlQ29uZmlndXJhdGlvbiBjb2xsZWN0aW9uLiBUaGUgJyArXG4gICAgICAnY3JlYXRlSW5kZXggY29tbWFuZCB3aGljaCBjcmVhdGVzIHRoYXQgaW5kZXggaXMgZmFpbGluZy5cXG5cXG4nICtcbiAgICAgICdNZXRlb3IgdmVyc2lvbnMgYmVmb3JlIDEuMC40IGRpZCBub3QgY3JlYXRlIHRoaXMgaW5kZXguIElmIHlvdSByZWNlbnRseSAnICtcbiAgICAgICd1cGdyYWRlZCBhbmQgYXJlIHNlZWluZyB0aGlzIGVycm9yIG1lc3NhZ2UgZm9yIHRoZSBmaXJzdCB0aW1lLCBwbGVhc2UgJyArXG4gICAgICAnY2hlY2sgeW91ciBtZXRlb3JfYWNjb3VudHNfbG9naW5TZXJ2aWNlQ29uZmlndXJhdGlvbiBjb2xsZWN0aW9uIGZvciAnICtcbiAgICAgICdtdWx0aXBsZSBjb25maWd1cmF0aW9uIGVudHJpZXMgZm9yIHRoZSBzYW1lIHNlcnZpY2UgYW5kIGRlbGV0ZSAnICtcbiAgICAgICdjb25maWd1cmF0aW9uIGVudHJpZXMgdW50aWwgdGhlcmUgaXMgbm8gbW9yZSB0aGFuIG9uZSBjb25maWd1cmF0aW9uICcgK1xuICAgICAgJ2VudHJ5IHBlciBzZXJ2aWNlLlxcblxcbicgK1xuICAgICAgJ0lmIHRoZSBtZXRlb3JfYWNjb3VudHNfbG9naW5TZXJ2aWNlQ29uZmlndXJhdGlvbiBjb2xsZWN0aW9uIGxvb2tzICcgK1xuICAgICAgJ2ZpbmUsIHRoZSBjcmVhdGVJbmRleCBjb21tYW5kIGlzIGZhaWxpbmcgZm9yIHNvbWUgb3RoZXIgcmVhc29uLlxcblxcbicgK1xuICAgICAgJ0ZvciBtb3JlIGluZm9ybWF0aW9uIG9uIHRoaXMgaGlzdG9yeSBvZiB0aGlzIGlzc3VlLCBwbGVhc2Ugc2VlICcgK1xuICAgICAgJ2h0dHBzOi8vZ2l0aHViLmNvbS9tZXRlb3IvbWV0ZW9yL3B1bGwvMzUxNC5cXG4nXG4gICk7XG4gIHRocm93IGVycjtcbn1cblxuTWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuICBjb25zdCBzZXR0aW5ncyA9IE1ldGVvci5zZXR0aW5ncz8ucGFja2FnZXM/Llsnc2VydmljZS1jb25maWd1cmF0aW9uJ107XG4gIGlmICghc2V0dGluZ3MpIHJldHVybjtcbiAgT2JqZWN0LmtleXMoc2V0dGluZ3MpLmZvckVhY2goa2V5ID0+IHtcbiAgICBTZXJ2aWNlQ29uZmlndXJhdGlvbi5jb25maWd1cmF0aW9ucy51cHNlcnQoXG4gICAgICB7IHNlcnZpY2U6IGtleSB9LFxuICAgICAge1xuICAgICAgICAkc2V0OiBzZXR0aW5nc1trZXldLFxuICAgICAgfVxuICAgICk7XG4gIH0pO1xufSk7XG4iXX0=
