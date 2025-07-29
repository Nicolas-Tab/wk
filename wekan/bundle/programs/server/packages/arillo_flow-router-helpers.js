(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var check = Package.check.check;
var Match = Package.check.Match;
var _ = Package.underscore._;
var ActiveRoute = Package['zimme:active-route'].ActiveRoute;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var __coffeescriptShare, FlowRouterHelpers;

(function(){

///////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                           //
// packages/arillo_flow-router-helpers/client/helpers.coffee                                 //
//                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////
                                                                                             //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
// check for subscriptions to be ready
var currentRouteName,
  currentRouteOption,
  func,
  helpers,
  isSubReady,
  name,
  param,
  pathFor,
  queryParam,
  subsReady,
  urlFor,
  hasProp = {}.hasOwnProperty;
subsReady = function () {
  for (var _len = arguments.length, subs = new Array(_len), _key = 0; _key < _len; _key++) {
    subs[_key] = arguments[_key];
  }
  if (subs.length === 1) {
    return FlowRouter.subsReady();
  }
  subs = subs.slice(0, subs.length - 1);
  return _.reduce(subs, function (memo, sub) {
    return memo && FlowRouter.subsReady(sub);
  }, true);
};

// return path
pathFor = function (path) {
  let view = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    hash: {}
  };
  var hashBang, query, ref;
  if (!path) {
    throw new Error('no path defined');
  }
  if (!view.hash) {
    // set if run on server
    view = {
      hash: view
    };
  }
  if (((ref = path.hash) != null ? ref.route : void 0) != null) {
    view = path;
    path = view.hash.route;
    delete view.hash.route;
  }
  query = view.hash.query ? FlowRouter._qs.parse(view.hash.query) : {};
  hashBang = view.hash.hash ? view.hash.hash : '';
  return FlowRouter.path(path, view.hash, query) + (hashBang ? "#".concat(hashBang) : '');
};

// return absolute url
urlFor = function (path, view) {
  var relativePath;
  relativePath = pathFor(path, view);
  return Meteor.absoluteUrl(relativePath.substr(1));
};

// get parameter
param = function (name) {
  return FlowRouter.getParam(name);
};
queryParam = function (key) {
  return FlowRouter.getQueryParam(key);
};
currentRouteName = function () {
  return FlowRouter.getRouteName();
};

// get current route options
currentRouteOption = function (optionName) {
  return FlowRouter.current().route.options[optionName];
};

// deprecated
isSubReady = function (sub) {
  if (sub) {
    return FlowRouter.subsReady(sub);
  }
  return FlowRouter.subsReady();
};
helpers = {
  subsReady: subsReady,
  pathFor: pathFor,
  urlFor: urlFor,
  param: param,
  queryParam: queryParam,
  currentRouteName: currentRouteName,
  isSubReady: isSubReady,
  currentRouteOption: currentRouteOption
};
if (Meteor.isClient) {
  for (name in helpers) {
    if (!hasProp.call(helpers, name)) continue;
    func = helpers[name];
    Template.registerHelper(name, func);
  }
}
if (Meteor.isServer) {
  FlowRouterHelpers = {
    pathFor: pathFor,
    urlFor: urlFor
  };
}
///////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("arillo:flow-router-helpers", {
  FlowRouterHelpers: FlowRouterHelpers
});

})();

//# sourceURL=meteor://💻app/packages/arillo_flow-router-helpers.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYXJpbGxvX2Zsb3ctcm91dGVyLWhlbHBlcnMvY2xpZW50L2hlbHBlcnMuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9jbGllbnQvaGVscGVycy5jb2ZmZWUiXSwibmFtZXMiOlsiY3VycmVudFJvdXRlTmFtZSIsImN1cnJlbnRSb3V0ZU9wdGlvbiIsImZ1bmMiLCJoZWxwZXJzIiwiaXNTdWJSZWFkeSIsIm5hbWUiLCJwYXJhbSIsInBhdGhGb3IiLCJxdWVyeVBhcmFtIiwic3Vic1JlYWR5IiwidXJsRm9yIiwiaGFzUHJvcCIsImhhc093blByb3BlcnR5Iiwic3VicyIsImxlbmd0aCIsIkZsb3dSb3V0ZXIiLCJzbGljZSIsIl8iLCJyZWR1Y2UiLCJtZW1vIiwic3ViIiwicGF0aCIsInZpZXciLCJoYXNoIiwiaGFzaEJhbmciLCJxdWVyeSIsInJlZiIsIkVycm9yIiwicm91dGUiLCJfcXMiLCJwYXJzZSIsInJlbGF0aXZlUGF0aCIsIk1ldGVvciIsImFic29sdXRlVXJsIiwic3Vic3RyIiwiZ2V0UGFyYW0iLCJrZXkiLCJnZXRRdWVyeVBhcmFtIiwiZ2V0Um91dGVOYW1lIiwib3B0aW9uTmFtZSIsImN1cnJlbnQiLCJvcHRpb25zIiwiaXNDbGllbnQiLCJjYWxsIiwiVGVtcGxhdGUiLCJyZWdpc3RlckhlbHBlciIsImlzU2VydmVyIiwiRmxvd1JvdXRlckhlbHBlcnMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUEsSUFBQUEsZ0JBQUE7RUFBQUMsa0JBQUE7RUFBQUMsSUFBQTtFQUFBQyxPQUFBO0VBQUFDLFVBQUE7RUFBQUMsSUFBQTtFQUFBQyxLQUFBO0VBQUFDLE9BQUE7RUFBQUMsVUFBQTtFQUFBQyxTQUFBO0VBQUFDLE1BQUE7RUFBQUMsT0FBQSxNQUFBQyxjQUFBO0FBQ0FILFNBQUEsR0FBWTtFQUFBLGtDQUFDSSxJQUFEO0lBQUNBLElBQUQ7RUFBQTtFQUNWLElB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QUhQO0VBSUFFLFVBQUEsRUFBWUEsVUFKWjtFQUtBUixnQkFBQSxFQUFrQkEsZ0JBTGxCO0VBTUFJLFVBQUEsRUFBWUEsVUFOWjtFQU9BSCxrQkFBQSxFQUFvQkE7QUFQcEI7QUFTRixJQUFHK0IsTUFBTSxDQUFDVSxRQUFWO0VBQ3FDLEtBQUFyQyxJQUFBLElBQUFGLE9BQUE7SUMwQmpDLElBQUksQ0FBQ1EsT0FBTyxDQUFDZ0MsSUFBSSxDQUFDeEMsT0FBTyxFQUFFRSxJQUFJLENBQUMsRUFBRTtJQUNsQ0gsSUFBSSxHQUFHQyxPQUFPLENBQUNFLElBQUksQ0FBQztJRDNCdEJ1QyxRQUFRLENBQUNDLGNBQVQsQ0FBd0J4QyxJQUF4QixFQUE4QkgsSUFBOUI7RUFBbUM7QUM4QnJDO0FENUJBLElBQUc4QixNQUFNLENBQUNjLFFBQVY7RUFDRUMsaUJBQUEsR0FDRTtJQUFBeEMsT0FBQSxFQUFTQSxPQUFUO0lBQ0FHLE1BQUEsRUFBUUE7RUFEUjtBQ2lDSixDIiwiZmlsZSI6Ii9wYWNrYWdlcy9hcmlsbG9fZmxvdy1yb3V0ZXItaGVscGVycy5qcyIsInNvdXJjZXNDb250ZW50IjpbIiMgY2hlY2sgZm9yIHN1YnNjcmlwdGlvbnMgdG8gYmUgcmVhZHlcbnN1YnNSZWFkeSA9IChzdWJzLi4uKSAtPlxuICByZXR1cm4gRmxvd1JvdXRlci5zdWJzUmVhZHkoKSBpZiBzdWJzLmxlbmd0aCBpcyAxXG4gIHN1YnMgPSBzdWJzLnNsaWNlKDAsIHN1YnMubGVuZ3RoIC0gMSlcbiAgXy5yZWR1Y2Ugc3VicywgKG1lbW8sIHN1YikgLT5cbiAgICBtZW1vIGFuZCBGbG93Um91dGVyLnN1YnNSZWFkeShzdWIpXG4gICwgdHJ1ZVxuXG4jIHJldHVybiBwYXRoXG5wYXRoRm9yID0gKHBhdGgsIHZpZXcgPSB7aGFzaDp7fX0pIC0+XG4gIHRocm93IG5ldyBFcnJvcignbm8gcGF0aCBkZWZpbmVkJykgdW5sZXNzIHBhdGhcbiAgIyBzZXQgaWYgcnVuIG9uIHNlcnZlclxuICB2aWV3ID0gaGFzaDogdmlldyB1bmxlc3Mgdmlldy5oYXNoXG4gIGlmIHBhdGguaGFzaD8ucm91dGU/XG4gICAgdmlldyA9IHBhdGhcbiAgICBwYXRoID0gdmlldy5oYXNoLnJvdXRlXG4gICAgZGVsZXRlIHZpZXcuaGFzaC5yb3V0ZVxuICBxdWVyeSA9IGlmIHZpZXcuaGFzaC5xdWVyeSB0aGVuIEZsb3dSb3V0ZXIuX3FzLnBhcnNlKHZpZXcuaGFzaC5xdWVyeSkgZWxzZSB7fVxuICBoYXNoQmFuZyA9IGlmIHZpZXcuaGFzaC5oYXNoIHRoZW4gdmlldy5oYXNoLmhhc2ggZWxzZSAnJ1xuICBGbG93Um91dGVyLnBhdGgocGF0aCwgdmlldy5oYXNoLCBxdWVyeSkgKyAoaWYgaGFzaEJhbmcgdGhlbiBcIiMje2hhc2hCYW5nfVwiIGVsc2UgJycpXG5cbiMgcmV0dXJuIGFic29sdXRlIHVybFxudXJsRm9yID0gKHBhdGgsIHZpZXcpIC0+XG4gIHJlbGF0aXZlUGF0aCA9IHBhdGhGb3IocGF0aCwgdmlldylcbiAgTWV0ZW9yLmFic29sdXRlVXJsKHJlbGF0aXZlUGF0aC5zdWJzdHIoMSkpXG5cbiMgZ2V0IHBhcmFtZXRlclxucGFyYW0gPSAobmFtZSkgLT5cbiAgRmxvd1JvdXRlci5nZXRQYXJhbShuYW1lKTtcblxuIyBnZXQgcXVlcnkgcGFyYW1ldGVyXG5xdWVyeVBhcmFtID0gKGtleSkgLT5cbiAgRmxvd1JvdXRlci5nZXRRdWVyeVBhcmFtKGtleSk7XG5cbiMgZ2V0IGN1cnJlbnQgcm91dGUgbmFtZVxuY3VycmVudFJvdXRlTmFtZSA9ICgpIC0+XG4gIEZsb3dSb3V0ZXIuZ2V0Um91dGVOYW1lKClcblxuIyBnZXQgY3VycmVudCByb3V0ZSBvcHRpb25zXG5jdXJyZW50Um91dGVPcHRpb24gPSAob3B0aW9uTmFtZSkgLT5cbiAgRmxvd1JvdXRlci5jdXJyZW50KCkucm91dGUub3B0aW9uc1tvcHRpb25OYW1lXVxuXG4jIGRlcHJlY2F0ZWRcbmlzU3ViUmVhZHkgPSAoc3ViKSAtPlxuICByZXR1cm4gRmxvd1JvdXRlci5zdWJzUmVhZHkoc3ViKSBpZiBzdWJcbiAgcmV0dXJuIEZsb3dSb3V0ZXIuc3Vic1JlYWR5KClcblxuaGVscGVycyA9XG4gIHN1YnNSZWFkeTogc3Vic1JlYWR5XG4gIHBhdGhGb3I6IHBhdGhGb3JcbiAgdXJsRm9yOiB1cmxGb3JcbiAgcGFyYW06IHBhcmFtXG4gIHF1ZXJ5UGFyYW06IHF1ZXJ5UGFyYW1cbiAgY3VycmVudFJvdXRlTmFtZTogY3VycmVudFJvdXRlTmFtZVxuICBpc1N1YlJlYWR5OiBpc1N1YlJlYWR5XG4gIGN1cnJlbnRSb3V0ZU9wdGlvbjogY3VycmVudFJvdXRlT3B0aW9uXG5cbmlmIE1ldGVvci5pc0NsaWVudFxuICBUZW1wbGF0ZS5yZWdpc3RlckhlbHBlciBuYW1lLCBmdW5jIGZvciBvd24gbmFtZSwgZnVuYyBvZiBoZWxwZXJzXG4gIFxuaWYgTWV0ZW9yLmlzU2VydmVyXG4gIEZsb3dSb3V0ZXJIZWxwZXJzID0gXG4gICAgcGF0aEZvcjogcGF0aEZvclxuICAgIHVybEZvcjogdXJsRm9yXG4iLCIgIC8vIGNoZWNrIGZvciBzdWJzY3JpcHRpb25zIHRvIGJlIHJlYWR5XG52YXIgY3VycmVudFJvdXRlTmFtZSwgY3VycmVudFJvdXRlT3B0aW9uLCBmdW5jLCBoZWxwZXJzLCBpc1N1YlJlYWR5LCBuYW1lLCBwYXJhbSwgcGF0aEZvciwgcXVlcnlQYXJhbSwgc3Vic1JlYWR5LCB1cmxGb3IsICAgICAgICAgICAgICAgICAgIFxuICBoYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHk7XG5cbnN1YnNSZWFkeSA9IGZ1bmN0aW9uKC4uLnN1YnMpIHtcbiAgaWYgKHN1YnMubGVuZ3RoID09PSAxKSB7XG4gICAgcmV0dXJuIEZsb3dSb3V0ZXIuc3Vic1JlYWR5KCk7XG4gIH1cbiAgc3VicyA9IHN1YnMuc2xpY2UoMCwgc3Vicy5sZW5ndGggLSAxKTtcbiAgcmV0dXJuIF8ucmVkdWNlKHN1YnMsIGZ1bmN0aW9uKG1lbW8sIHN1Yikge1xuICAgIHJldHVybiBtZW1vICYmIEZsb3dSb3V0ZXIuc3Vic1JlYWR5KHN1Yik7XG4gIH0sIHRydWUpO1xufTtcblxuLy8gcmV0dXJuIHBhdGhcbnBhdGhGb3IgPSBmdW5jdGlvbihwYXRoLCB2aWV3ID0ge1xuICAgIGhhc2g6IHt9XG4gIH0pIHtcbiAgdmFyIGhhc2hCYW5nLCBxdWVyeSwgcmVmO1xuICBpZiAoIXBhdGgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ25vIHBhdGggZGVmaW5lZCcpO1xuICB9XG4gIGlmICghdmlldy5oYXNoKSB7XG4gICAgLy8gc2V0IGlmIHJ1biBvbiBzZXJ2ZXJcbiAgICB2aWV3ID0ge1xuICAgICAgaGFzaDogdmlld1xuICAgIH07XG4gIH1cbiAgaWYgKCgocmVmID0gcGF0aC5oYXNoKSAhPSBudWxsID8gcmVmLnJvdXRlIDogdm9pZCAwKSAhPSBudWxsKSB7XG4gICAgdmlldyA9IHBhdGg7XG4gICAgcGF0aCA9IHZpZXcuaGFzaC5yb3V0ZTtcbiAgICBkZWxldGUgdmlldy5oYXNoLnJvdXRlO1xuICB9XG4gIHF1ZXJ5ID0gdmlldy5oYXNoLnF1ZXJ5ID8gRmxvd1JvdXRlci5fcXMucGFyc2Uodmlldy5oYXNoLnF1ZXJ5KSA6IHt9O1xuICBoYXNoQmFuZyA9IHZpZXcuaGFzaC5oYXNoID8gdmlldy5oYXNoLmhhc2ggOiAnJztcbiAgcmV0dXJuIEZsb3dSb3V0ZXIucGF0aChwYXRoLCB2aWV3Lmhhc2gsIHF1ZXJ5KSArIChoYXNoQmFuZyA/IGAjJHtoYXNoQmFuZ31gIDogJycpO1xufTtcblxuLy8gcmV0dXJuIGFic29sdXRlIHVybFxudXJsRm9yID0gZnVuY3Rpb24ocGF0aCwgdmlldykge1xuICB2YXIgcmVsYXRpdmVQYXRoO1xuICByZWxhdGl2ZVBhdGggPSBwYXRoRm9yKHBhdGgsIHZpZXcpO1xuICByZXR1cm4gTWV0ZW9yLmFic29sdXRlVXJsKHJlbGF0aXZlUGF0aC5zdWJzdHIoMSkpO1xufTtcblxuLy8gZ2V0IHBhcmFtZXRlclxucGFyYW0gPSBmdW5jdGlvbihuYW1lKSB7XG4gIHJldHVybiBGbG93Um91dGVyLmdldFBhcmFtKG5hbWUpO1xufTtcblxucXVlcnlQYXJhbSA9IGZ1bmN0aW9uKGtleSkge1xuICByZXR1cm4gRmxvd1JvdXRlci5nZXRRdWVyeVBhcmFtKGtleSk7XG59O1xuXG5jdXJyZW50Um91dGVOYW1lID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBGbG93Um91dGVyLmdldFJvdXRlTmFtZSgpO1xufTtcblxuLy8gZ2V0IGN1cnJlbnQgcm91dGUgb3B0aW9uc1xuY3VycmVudFJvdXRlT3B0aW9uID0gZnVuY3Rpb24ob3B0aW9uTmFtZSkge1xuICByZXR1cm4gRmxvd1JvdXRlci5jdXJyZW50KCkucm91dGUub3B0aW9uc1tvcHRpb25OYW1lXTtcbn07XG5cbi8vIGRlcHJlY2F0ZWRcbmlzU3ViUmVhZHkgPSBmdW5jdGlvbihzdWIpIHtcbiAgaWYgKHN1Yikge1xuICAgIHJldHVybiBGbG93Um91dGVyLnN1YnNSZWFkeShzdWIpO1xuICB9XG4gIHJldHVybiBGbG93Um91dGVyLnN1YnNSZWFkeSgpO1xufTtcblxuaGVscGVycyA9IHtcbiAgc3Vic1JlYWR5OiBzdWJzUmVhZHksXG4gIHBhdGhGb3I6IHBhdGhGb3IsXG4gIHVybEZvcjogdXJsRm9yLFxuICBwYXJhbTogcGFyYW0sXG4gIHF1ZXJ5UGFyYW06IHF1ZXJ5UGFyYW0sXG4gIGN1cnJlbnRSb3V0ZU5hbWU6IGN1cnJlbnRSb3V0ZU5hbWUsXG4gIGlzU3ViUmVhZHk6IGlzU3ViUmVhZHksXG4gIGN1cnJlbnRSb3V0ZU9wdGlvbjogY3VycmVudFJvdXRlT3B0aW9uXG59O1xuXG5pZiAoTWV0ZW9yLmlzQ2xpZW50KSB7XG4gIGZvciAobmFtZSBpbiBoZWxwZXJzKSB7XG4gICAgaWYgKCFoYXNQcm9wLmNhbGwoaGVscGVycywgbmFtZSkpIGNvbnRpbnVlO1xuICAgIGZ1bmMgPSBoZWxwZXJzW25hbWVdO1xuICAgIFRlbXBsYXRlLnJlZ2lzdGVySGVscGVyKG5hbWUsIGZ1bmMpO1xuICB9XG59XG5cbmlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcbiAgRmxvd1JvdXRlckhlbHBlcnMgPSB7XG4gICAgcGF0aEZvcjogcGF0aEZvcixcbiAgICB1cmxGb3I6IHVybEZvclxuICB9O1xufVxuIl19
