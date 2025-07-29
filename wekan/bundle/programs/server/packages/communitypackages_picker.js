(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var ECMAScript = Package.ecmascript.ECMAScript;
var URL = Package.url.URL;
var URLSearchParams = Package.url.URLSearchParams;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"communitypackages:picker":{"lib":{"instance.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/communitypackages_picker/lib/instance.js                                                                //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.export({
  Picker: () => Picker
});
let WebApp;
module.link("meteor/webapp", {
  WebApp(v) {
    WebApp = v;
  }
}, 0);
let PickerImp;
module.link("./implementation", {
  PickerImp(v) {
    PickerImp = v;
  }
}, 1);
const Picker = new PickerImp();
WebApp.rawConnectHandlers.use(function (req, res, next) {
  Picker._dispatch(req, res, next);
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"implementation.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/communitypackages_picker/lib/implementation.js                                                          //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.export({
  PickerImp: () => PickerImp
});
let pathToRegexp;
module.link("path-to-regexp", {
  pathToRegexp(v) {
    pathToRegexp = v;
  }
}, 0);
let Fiber;
module.link("fibers", {
  default(v) {
    Fiber = v;
  }
}, 1);
function parseQuery(queryString) {
  if (!queryString) return {};
  let query = {};
  const pairs = queryString.replace(/^\?/, '').split('&');
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].split('=');
    query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
  }
  return query;
}
const PickerImp = function (filterFunction) {
  this.filterFunction = filterFunction;
  this.routes = [];
  this.subRouters = [];
  this.middlewares = [];
};
PickerImp.prototype.middleware = function (callback) {
  this.middlewares.push(callback);
  for (const subRouter of this.subRouters) {
    subRouter.middleware(callback);
  }
};
PickerImp.prototype.route = function (path, callback) {
  const keys = [];
  const regExp = pathToRegexp(path, keys);
  regExp.callback = callback;
  regExp.keys = keys;
  this.routes.push(regExp);
  return this;
};
PickerImp.prototype.filter = function (callback) {
  const subRouter = new PickerImp(callback);
  this.subRouters.push(subRouter);
  for (const middleware of this.middlewares) {
    subRouter.middleware(middleware);
  }
  return subRouter;
};
PickerImp.prototype._dispatch = function (req, res, bypass) {
  let currentRoute = 0;
  let currentSubRouter = 0;
  let currentMiddleware = 0;
  if (this.filterFunction) {
    const result = this.filterFunction(req, res);
    if (!result) {
      return bypass();
    }
  }
  const processNextMiddleware = onDone => {
    const middleware = this.middlewares[currentMiddleware++];
    if (middleware) {
      this._processMiddleware(middleware, req, res, () => processNextMiddleware(onDone));
    } else {
      onDone();
    }
  };
  const processNextRoute = () => {
    const route = this.routes[currentRoute++];
    if (route) {
      const uri = req.url.replace(/\?.*/, '');
      const m = uri.match(route);
      if (m) {
        processNextMiddleware(() => {
          var _req$_parsedUrl;
          const params = this._buildParams(route.keys, m);
          params.query = parseQuery((_req$_parsedUrl = req._parsedUrl) === null || _req$_parsedUrl === void 0 ? void 0 : _req$_parsedUrl.query);
          // See https://github.com/meteorhacks/picker/pull/39 for processNextRoute reason in the following method.
          this._processRoute(route.callback, params, req, res, processNextRoute);
        });
      } else {
        processNextRoute();
      }
    } else {
      processNextSubRouter();
    }
  };
  const processNextSubRouter = () => {
    const subRouter = this.subRouters[currentSubRouter++];
    if (subRouter) {
      subRouter._dispatch(req, res, processNextSubRouter);
    } else {
      bypass();
    }
  };
  processNextRoute();
};
PickerImp.prototype._buildParams = function (keys, m) {
  const params = {};
  for (let lc = 1; lc < m.length; lc++) {
    var _keys;
    const key = (_keys = keys[lc - 1]) === null || _keys === void 0 ? void 0 : _keys.name;
    params[key] = decodeURIComponent(m[lc]);
  }
  return params;
};
PickerImp.prototype._processRoute = function (callback, params, req, res, next) {
  if (Fiber.current) {
    doCall();
  } else {
    new Fiber(doCall).run();
  }
  function doCall() {
    callback.call(null, params, req, res, next);
  }
};
PickerImp.prototype._processMiddleware = function (middleware, req, res, next) {
  if (Fiber.current) {
    doCall();
  } else {
    new Fiber(doCall).run();
  }
  function doCall() {
    middleware.call(null, req, res, next);
  }
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"node_modules":{"path-to-regexp":{"package.json":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// node_modules/meteor/communitypackages_picker/node_modules/path-to-regexp/package.json                            //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.exports = {
  "name": "path-to-regexp",
  "version": "6.2.1",
  "main": "dist/index.js"
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"dist":{"index.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// node_modules/meteor/communitypackages_picker/node_modules/path-to-regexp/dist/index.js                           //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.useNode();
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/communitypackages:picker/lib/instance.js");

/* Exports */
Package._define("communitypackages:picker", exports);

})();

//# sourceURL=meteor://💻app/packages/communitypackages_picker.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvY29tbXVuaXR5cGFja2FnZXM6cGlja2VyL2xpYi9pbnN0YW5jZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvY29tbXVuaXR5cGFja2FnZXM6cGlja2VyL2xpYi9pbXBsZW1lbnRhdGlvbi5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJQaWNrZXIiLCJXZWJBcHAiLCJsaW5rIiwidiIsIlBpY2tlckltcCIsInJhd0Nvbm5lY3RIYW5kbGVycyIsInVzZSIsInJlcSIsInJlcyIsIm5leHQiLCJfZGlzcGF0Y2giLCJwYXRoVG9SZWdleHAiLCJGaWJlciIsImRlZmF1bHQiLCJwYXJzZVF1ZXJ5IiwicXVlcnlTdHJpbmciLCJxdWVyeSIsInBhaXJzIiwicmVwbGFjZSIsInNwbGl0IiwiaSIsImxlbmd0aCIsInBhaXIiLCJkZWNvZGVVUklDb21wb25lbnQiLCJmaWx0ZXJGdW5jdGlvbiIsInJvdXRlcyIsInN1YlJvdXRlcnMiLCJtaWRkbGV3YXJlcyIsInByb3RvdHlwZSIsIm1pZGRsZXdhcmUiLCJjYWxsYmFjayIsInB1c2giLCJzdWJSb3V0ZXIiLCJyb3V0ZSIsInBhdGgiLCJrZXlzIiwicmVnRXhwIiwiZmlsdGVyIiwiYnlwYXNzIiwiY3VycmVudFJvdXRlIiwiY3VycmVudFN1YlJvdXRlciIsImN1cnJlbnRNaWRkbGV3YXJlIiwicmVzdWx0IiwicHJvY2Vzc05leHRNaWRkbGV3YXJlIiwib25Eb25lIiwiX3Byb2Nlc3NNaWRkbGV3YXJlIiwicHJvY2Vzc05leHRSb3V0ZSIsInVyaSIsInVybCIsIm0iLCJtYXRjaCIsIl9yZXEkX3BhcnNlZFVybCIsInBhcmFtcyIsIl9idWlsZFBhcmFtcyIsIl9wYXJzZWRVcmwiLCJfcHJvY2Vzc1JvdXRlIiwicHJvY2Vzc05leHRTdWJSb3V0ZXIiLCJsYyIsIl9rZXlzIiwia2V5IiwibmFtZSIsImN1cnJlbnQiLCJkb0NhbGwiLCJydW4iLCJjYWxsIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxNQUFNLENBQUNDLE1BQU0sQ0FBQztFQUFDQyxNQUFNLEVBQUNBLENBQUEsS0FBSUE7QUFBTSxDQUFDLENBQUM7QUFBQyxJQUFJQyxNQUFNO0FBQUNILE1BQU0sQ0FBQ0ksSUFBSSxDQUFDLGVBQWUsRUFBQztFQUFDRCxNQUFNQSxDQUFDRSxDQUFDLEVBQUM7SUFBQ0YsTUFBTSxHQUFDRSxDQUFDO0VBQUE7QUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0FBQUMsSUFBSUMsU0FBUztBQUFDTixNQUFNLENBQUNJLElBQUksQ0FBQyxrQkFBa0IsRUFBQztFQUFDRSxTQUFTQSxDQUFDRCxDQUFDLEVBQUM7SUFBQ0MsU0FBUyxHQUFDRCxDQUFDO0VBQUE7QUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0FBR3ZLLE1BQU1ILE1BQU0sR0FBRyxJQUFJSSxTQUFTLENBQUMsQ0FBQztBQUNyQ0gsTUFBTSxDQUFDSSxrQkFBa0IsQ0FBQ0MsR0FBRyxDQUFDLFVBQVNDLEdBQUcsRUFBRUMsR0FBRyxFQUFFQyxJQUFJLEVBQUU7RUFDckRULE1BQU0sQ0FBQ1UsU0FBUyxDQUFDSCxHQUFHLEVBQUVDLEdBQUcsRUFBRUMsSUFBSSxDQUFDO0FBQ2xDLENBQUMsQ0FBQyxDOzs7Ozs7Ozs7OztBQ05GWCxNQUFNLENBQUNDLE1BQU0sQ0FBQztFQUFDSyxTQUFTLEVBQUNBLENBQUEsS0FBSUE7QUFBUyxDQUFDLENBQUM7QUFBQyxJQUFJTyxZQUFZO0FBQUNiLE1BQU0sQ0FBQ0ksSUFBSSxDQUFDLGdCQUFnQixFQUFDO0VBQUNTLFlBQVlBLENBQUNSLENBQUMsRUFBQztJQUFDUSxZQUFZLEdBQUNSLENBQUM7RUFBQTtBQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7QUFBQyxJQUFJUyxLQUFLO0FBQUNkLE1BQU0sQ0FBQ0ksSUFBSSxDQUFDLFFBQVEsRUFBQztFQUFDVyxPQUFPQSxDQUFDVixDQUFDLEVBQUM7SUFBQ1MsS0FBSyxHQUFDVCxDQUFDO0VBQUE7QUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0FBSW5MLFNBQVNXLFVBQVVBLENBQUNDLFdBQVcsRUFBRTtFQUMvQixJQUFJLENBQUNBLFdBQVcsRUFBRSxPQUFPLENBQUMsQ0FBQztFQUMzQixJQUFJQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0VBQ2QsTUFBTUMsS0FBSyxHQUFHRixXQUFXLENBQUNHLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUNDLEtBQUssQ0FBQyxHQUFHLENBQUM7RUFDdkQsS0FBSyxJQUFJQyxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUdILEtBQUssQ0FBQ0ksTUFBTSxFQUFFRCxDQUFDLEVBQUUsRUFBRTtJQUNyQyxNQUFNRSxJQUFJLEdBQUdMLEtBQUssQ0FBQ0csQ0FBQyxDQUFDLENBQUNELEtBQUssQ0FBQyxHQUFHLENBQUM7SUFDaENILEtBQUssQ0FBQ08sa0JBQWtCLENBQUNELElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUdDLGtCQUFrQixDQUFDRCxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0VBQ3hFO0VBQ0EsT0FBT04sS0FBSztBQUNkO0FBRU8sTUFBTVosU0FBUyxHQUFHLFNBQUFBLENBQVNvQixjQUFjLEVBQUU7RUFDaEQsSUFBSSxDQUFDQSxjQUFjLEdBQUdBLGNBQWM7RUFDcEMsSUFBSSxDQUFDQyxNQUFNLEdBQUcsRUFBRTtFQUNoQixJQUFJLENBQUNDLFVBQVUsR0FBRyxFQUFFO0VBQ3BCLElBQUksQ0FBQ0MsV0FBVyxHQUFHLEVBQUU7QUFDdkIsQ0FBQztBQUVEdkIsU0FBUyxDQUFDd0IsU0FBUyxDQUFDQyxVQUFVLEdBQUcsVUFBU0MsUUFBUSxFQUFFO0VBQ2xELElBQUksQ0FBQ0gsV0FBVyxDQUFDSSxJQUFJLENBQUNELFFBQVEsQ0FBQztFQUMvQixLQUFJLE1BQU1FLFNBQVMsSUFBSSxJQUFJLENBQUNOLFVBQVUsRUFBRTtJQUN0Q00sU0FBUyxDQUFDSCxVQUFVLENBQUNDLFFBQVEsQ0FBQztFQUNoQztBQUNGLENBQUM7QUFFRDFCLFNBQVMsQ0FBQ3dCLFNBQVMsQ0FBQ0ssS0FBSyxHQUFHLFVBQVNDLElBQUksRUFBRUosUUFBUSxFQUFFO0VBQ25ELE1BQU1LLElBQUksR0FBRyxFQUFFO0VBQ2YsTUFBTUMsTUFBTSxHQUFHekIsWUFBWSxDQUFDdUIsSUFBSSxFQUFFQyxJQUFJLENBQUM7RUFDdkNDLE1BQU0sQ0FBQ04sUUFBUSxHQUFHQSxRQUFRO0VBQzFCTSxNQUFNLENBQUNELElBQUksR0FBR0EsSUFBSTtFQUNsQixJQUFJLENBQUNWLE1BQU0sQ0FBQ00sSUFBSSxDQUFDSyxNQUFNLENBQUM7RUFDeEIsT0FBTyxJQUFJO0FBQ2IsQ0FBQztBQUVEaEMsU0FBUyxDQUFDd0IsU0FBUyxDQUFDUyxNQUFNLEdBQUcsVUFBU1AsUUFBUSxFQUFFO0VBQzlDLE1BQU1FLFNBQVMsR0FBRyxJQUFJNUIsU0FBUyxDQUFDMEIsUUFBUSxDQUFDO0VBQ3pDLElBQUksQ0FBQ0osVUFBVSxDQUFDSyxJQUFJLENBQUNDLFNBQVMsQ0FBQztFQUMvQixLQUFJLE1BQU1ILFVBQVUsSUFBSSxJQUFJLENBQUNGLFdBQVcsRUFBRTtJQUN4Q0ssU0FBUyxDQUFDSCxVQUFVLENBQUNBLFVBQVUsQ0FBQztFQUNsQztFQUNBLE9BQU9HLFNBQVM7QUFDbEIsQ0FBQztBQUVENUIsU0FBUyxDQUFDd0IsU0FBUyxDQUFDbEIsU0FBUyxHQUFHLFVBQVNILEdBQUcsRUFBRUMsR0FBRyxFQUFFOEIsTUFBTSxFQUFFO0VBQ3pELElBQUlDLFlBQVksR0FBRyxDQUFDO0VBQ3BCLElBQUlDLGdCQUFnQixHQUFHLENBQUM7RUFDeEIsSUFBSUMsaUJBQWlCLEdBQUcsQ0FBQztFQUV6QixJQUFHLElBQUksQ0FBQ2pCLGNBQWMsRUFBRTtJQUN0QixNQUFNa0IsTUFBTSxHQUFHLElBQUksQ0FBQ2xCLGNBQWMsQ0FBQ2pCLEdBQUcsRUFBRUMsR0FBRyxDQUFDO0lBQzVDLElBQUcsQ0FBQ2tDLE1BQU0sRUFBRTtNQUNWLE9BQU9KLE1BQU0sQ0FBQyxDQUFDO0lBQ2pCO0VBQ0Y7RUFFQSxNQUFNSyxxQkFBcUIsR0FBSUMsTUFBTSxJQUFLO0lBQ3hDLE1BQU1mLFVBQVUsR0FBRyxJQUFJLENBQUNGLFdBQVcsQ0FBQ2MsaUJBQWlCLEVBQUUsQ0FBQztJQUN4RCxJQUFHWixVQUFVLEVBQUU7TUFDYixJQUFJLENBQUNnQixrQkFBa0IsQ0FBQ2hCLFVBQVUsRUFBRXRCLEdBQUcsRUFBRUMsR0FBRyxFQUFFLE1BQU1tQyxxQkFBcUIsQ0FBQ0MsTUFBTSxDQUFDLENBQUM7SUFDcEYsQ0FBQyxNQUFNO01BQ0xBLE1BQU0sQ0FBQyxDQUFDO0lBQ1Y7RUFDRixDQUFDO0VBRUQsTUFBTUUsZ0JBQWdCLEdBQUdBLENBQUEsS0FBTTtJQUM3QixNQUFNYixLQUFLLEdBQUcsSUFBSSxDQUFDUixNQUFNLENBQUNjLFlBQVksRUFBRSxDQUFDO0lBQ3pDLElBQUdOLEtBQUssRUFBRTtNQUNSLE1BQU1jLEdBQUcsR0FBR3hDLEdBQUcsQ0FBQ3lDLEdBQUcsQ0FBQzlCLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO01BQ3ZDLE1BQU0rQixDQUFDLEdBQUdGLEdBQUcsQ0FBQ0csS0FBSyxDQUFDakIsS0FBSyxDQUFDO01BQzFCLElBQUdnQixDQUFDLEVBQUU7UUFDSk4scUJBQXFCLENBQUMsTUFBTTtVQUFBLElBQUFRLGVBQUE7VUFDMUIsTUFBTUMsTUFBTSxHQUFHLElBQUksQ0FBQ0MsWUFBWSxDQUFDcEIsS0FBSyxDQUFDRSxJQUFJLEVBQUVjLENBQUMsQ0FBQztVQUMvQ0csTUFBTSxDQUFDcEMsS0FBSyxHQUFHRixVQUFVLEVBQUFxQyxlQUFBLEdBQUM1QyxHQUFHLENBQUMrQyxVQUFVLGNBQUFILGVBQUEsdUJBQWRBLGVBQUEsQ0FBZ0JuQyxLQUFLLENBQUM7VUFDaEQ7VUFDQSxJQUFJLENBQUN1QyxhQUFhLENBQUN0QixLQUFLLENBQUNILFFBQVEsRUFBRXNCLE1BQU0sRUFBRTdDLEdBQUcsRUFBRUMsR0FBRyxFQUFFc0MsZ0JBQWdCLENBQUM7UUFDeEUsQ0FBQyxDQUFDO01BQ0osQ0FBQyxNQUFNO1FBQ0xBLGdCQUFnQixDQUFDLENBQUM7TUFDcEI7SUFDRixDQUFDLE1BQU07TUFDTFUsb0JBQW9CLENBQUMsQ0FBQztJQUN4QjtFQUNGLENBQUM7RUFFRCxNQUFNQSxvQkFBb0IsR0FBR0EsQ0FBQSxLQUFNO0lBQ2pDLE1BQU14QixTQUFTLEdBQUcsSUFBSSxDQUFDTixVQUFVLENBQUNjLGdCQUFnQixFQUFFLENBQUM7SUFDckQsSUFBR1IsU0FBUyxFQUFFO01BQ1pBLFNBQVMsQ0FBQ3RCLFNBQVMsQ0FBQ0gsR0FBRyxFQUFFQyxHQUFHLEVBQUVnRCxvQkFBb0IsQ0FBQztJQUNyRCxDQUFDLE1BQU07TUFDTGxCLE1BQU0sQ0FBQyxDQUFDO0lBQ1Y7RUFDRixDQUFDO0VBQ0RRLGdCQUFnQixDQUFDLENBQUM7QUFDcEIsQ0FBQztBQUVEMUMsU0FBUyxDQUFDd0IsU0FBUyxDQUFDeUIsWUFBWSxHQUFHLFVBQVNsQixJQUFJLEVBQUVjLENBQUMsRUFBRTtFQUNuRCxNQUFNRyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0VBQ2pCLEtBQUksSUFBSUssRUFBRSxHQUFHLENBQUMsRUFBRUEsRUFBRSxHQUFHUixDQUFDLENBQUM1QixNQUFNLEVBQUVvQyxFQUFFLEVBQUUsRUFBRTtJQUFBLElBQUFDLEtBQUE7SUFDbkMsTUFBTUMsR0FBRyxJQUFBRCxLQUFBLEdBQUd2QixJQUFJLENBQUNzQixFQUFFLEdBQUMsQ0FBQyxDQUFDLGNBQUFDLEtBQUEsdUJBQVZBLEtBQUEsQ0FBWUUsSUFBSTtJQUM1QlIsTUFBTSxDQUFDTyxHQUFHLENBQUMsR0FBR3BDLGtCQUFrQixDQUFDMEIsQ0FBQyxDQUFDUSxFQUFFLENBQUMsQ0FBQztFQUN6QztFQUVBLE9BQU9MLE1BQU07QUFDZixDQUFDO0FBRURoRCxTQUFTLENBQUN3QixTQUFTLENBQUMyQixhQUFhLEdBQUcsVUFBU3pCLFFBQVEsRUFBRXNCLE1BQU0sRUFBRTdDLEdBQUcsRUFBRUMsR0FBRyxFQUFFQyxJQUFJLEVBQUU7RUFDN0UsSUFBR0csS0FBSyxDQUFDaUQsT0FBTyxFQUFFO0lBQ2hCQyxNQUFNLENBQUMsQ0FBQztFQUNWLENBQUMsTUFBTTtJQUNMLElBQUlsRCxLQUFLLENBQUNrRCxNQUFNLENBQUMsQ0FBQ0MsR0FBRyxDQUFDLENBQUM7RUFDekI7RUFFQSxTQUFTRCxNQUFNQSxDQUFBLEVBQUk7SUFDakJoQyxRQUFRLENBQUNrQyxJQUFJLENBQUMsSUFBSSxFQUFFWixNQUFNLEVBQUU3QyxHQUFHLEVBQUVDLEdBQUcsRUFBRUMsSUFBSSxDQUFDO0VBQzdDO0FBQ0YsQ0FBQztBQUVETCxTQUFTLENBQUN3QixTQUFTLENBQUNpQixrQkFBa0IsR0FBRyxVQUFTaEIsVUFBVSxFQUFFdEIsR0FBRyxFQUFFQyxHQUFHLEVBQUVDLElBQUksRUFBRTtFQUM1RSxJQUFHRyxLQUFLLENBQUNpRCxPQUFPLEVBQUU7SUFDaEJDLE1BQU0sQ0FBQyxDQUFDO0VBQ1YsQ0FBQyxNQUFNO0lBQ0wsSUFBSWxELEtBQUssQ0FBQ2tELE1BQU0sQ0FBQyxDQUFDQyxHQUFHLENBQUMsQ0FBQztFQUN6QjtFQUVBLFNBQVNELE1BQU1BLENBQUEsRUFBRztJQUNoQmpDLFVBQVUsQ0FBQ21DLElBQUksQ0FBQyxJQUFJLEVBQUV6RCxHQUFHLEVBQUVDLEdBQUcsRUFBRUMsSUFBSSxDQUFDO0VBQ3ZDO0FBQ0YsQ0FBQyxDIiwiZmlsZSI6Ii9wYWNrYWdlcy9jb21tdW5pdHlwYWNrYWdlc19waWNrZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBXZWJBcHAgfSBmcm9tICdtZXRlb3Ivd2ViYXBwJztcbmltcG9ydCB7IFBpY2tlckltcCB9IGZyb20gJy4vaW1wbGVtZW50YXRpb24nO1xuXG5leHBvcnQgY29uc3QgUGlja2VyID0gbmV3IFBpY2tlckltcCgpO1xuV2ViQXBwLnJhd0Nvbm5lY3RIYW5kbGVycy51c2UoZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgUGlja2VyLl9kaXNwYXRjaChyZXEsIHJlcywgbmV4dCk7XG59KTtcbiIsImltcG9ydCB7IHBhdGhUb1JlZ2V4cCB9IGZyb20gJ3BhdGgtdG8tcmVnZXhwJztcbi8vIFRPRE8gcmVwbGFjZSBmaWJlcnNcbmltcG9ydCBGaWJlciBmcm9tICdmaWJlcnMnO1xuXG5mdW5jdGlvbiBwYXJzZVF1ZXJ5KHF1ZXJ5U3RyaW5nKSB7XG4gIGlmICghcXVlcnlTdHJpbmcpIHJldHVybiB7fVxuICBsZXQgcXVlcnkgPSB7fTtcbiAgY29uc3QgcGFpcnMgPSBxdWVyeVN0cmluZy5yZXBsYWNlKC9eXFw/LywgJycpLnNwbGl0KCcmJyk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcGFpcnMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBwYWlyID0gcGFpcnNbaV0uc3BsaXQoJz0nKTtcbiAgICBxdWVyeVtkZWNvZGVVUklDb21wb25lbnQocGFpclswXSldID0gZGVjb2RlVVJJQ29tcG9uZW50KHBhaXJbMV0gfHwgJycpO1xuICB9XG4gIHJldHVybiBxdWVyeTtcbn1cblxuZXhwb3J0IGNvbnN0IFBpY2tlckltcCA9IGZ1bmN0aW9uKGZpbHRlckZ1bmN0aW9uKSB7XG4gIHRoaXMuZmlsdGVyRnVuY3Rpb24gPSBmaWx0ZXJGdW5jdGlvbjtcbiAgdGhpcy5yb3V0ZXMgPSBbXTtcbiAgdGhpcy5zdWJSb3V0ZXJzID0gW107XG4gIHRoaXMubWlkZGxld2FyZXMgPSBbXTtcbn1cblxuUGlja2VySW1wLnByb3RvdHlwZS5taWRkbGV3YXJlID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgdGhpcy5taWRkbGV3YXJlcy5wdXNoKGNhbGxiYWNrKTtcbiAgZm9yKGNvbnN0IHN1YlJvdXRlciBvZiB0aGlzLnN1YlJvdXRlcnMpIHtcbiAgICBzdWJSb3V0ZXIubWlkZGxld2FyZShjYWxsYmFjayk7XG4gIH1cbn07XG5cblBpY2tlckltcC5wcm90b3R5cGUucm91dGUgPSBmdW5jdGlvbihwYXRoLCBjYWxsYmFjaykge1xuICBjb25zdCBrZXlzID0gW107XG4gIGNvbnN0IHJlZ0V4cCA9IHBhdGhUb1JlZ2V4cChwYXRoLCBrZXlzKTtcbiAgcmVnRXhwLmNhbGxiYWNrID0gY2FsbGJhY2s7XG4gIHJlZ0V4cC5rZXlzID0ga2V5cztcbiAgdGhpcy5yb3V0ZXMucHVzaChyZWdFeHApO1xuICByZXR1cm4gdGhpcztcbn07XG5cblBpY2tlckltcC5wcm90b3R5cGUuZmlsdGVyID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgY29uc3Qgc3ViUm91dGVyID0gbmV3IFBpY2tlckltcChjYWxsYmFjayk7XG4gIHRoaXMuc3ViUm91dGVycy5wdXNoKHN1YlJvdXRlcik7XG4gIGZvcihjb25zdCBtaWRkbGV3YXJlIG9mIHRoaXMubWlkZGxld2FyZXMpIHtcbiAgICBzdWJSb3V0ZXIubWlkZGxld2FyZShtaWRkbGV3YXJlKTtcbiAgfVxuICByZXR1cm4gc3ViUm91dGVyO1xufTtcblxuUGlja2VySW1wLnByb3RvdHlwZS5fZGlzcGF0Y2ggPSBmdW5jdGlvbihyZXEsIHJlcywgYnlwYXNzKSB7XG4gIGxldCBjdXJyZW50Um91dGUgPSAwO1xuICBsZXQgY3VycmVudFN1YlJvdXRlciA9IDA7XG4gIGxldCBjdXJyZW50TWlkZGxld2FyZSA9IDA7XG5cbiAgaWYodGhpcy5maWx0ZXJGdW5jdGlvbikge1xuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuZmlsdGVyRnVuY3Rpb24ocmVxLCByZXMpO1xuICAgIGlmKCFyZXN1bHQpIHtcbiAgICAgIHJldHVybiBieXBhc3MoKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBwcm9jZXNzTmV4dE1pZGRsZXdhcmUgPSAob25Eb25lKSA9PiB7XG4gICAgY29uc3QgbWlkZGxld2FyZSA9IHRoaXMubWlkZGxld2FyZXNbY3VycmVudE1pZGRsZXdhcmUrK107XG4gICAgaWYobWlkZGxld2FyZSkge1xuICAgICAgdGhpcy5fcHJvY2Vzc01pZGRsZXdhcmUobWlkZGxld2FyZSwgcmVxLCByZXMsICgpID0+IHByb2Nlc3NOZXh0TWlkZGxld2FyZShvbkRvbmUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb25Eb25lKCk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgcHJvY2Vzc05leHRSb3V0ZSA9ICgpID0+IHtcbiAgICBjb25zdCByb3V0ZSA9IHRoaXMucm91dGVzW2N1cnJlbnRSb3V0ZSsrXTtcbiAgICBpZihyb3V0ZSkge1xuICAgICAgY29uc3QgdXJpID0gcmVxLnVybC5yZXBsYWNlKC9cXD8uKi8sICcnKTtcbiAgICAgIGNvbnN0IG0gPSB1cmkubWF0Y2gocm91dGUpO1xuICAgICAgaWYobSkge1xuICAgICAgICBwcm9jZXNzTmV4dE1pZGRsZXdhcmUoKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHBhcmFtcyA9IHRoaXMuX2J1aWxkUGFyYW1zKHJvdXRlLmtleXMsIG0pO1xuICAgICAgICAgIHBhcmFtcy5xdWVyeSA9IHBhcnNlUXVlcnkocmVxLl9wYXJzZWRVcmw/LnF1ZXJ5KTtcbiAgICAgICAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL21ldGVvcmhhY2tzL3BpY2tlci9wdWxsLzM5IGZvciBwcm9jZXNzTmV4dFJvdXRlIHJlYXNvbiBpbiB0aGUgZm9sbG93aW5nIG1ldGhvZC5cbiAgICAgICAgICB0aGlzLl9wcm9jZXNzUm91dGUocm91dGUuY2FsbGJhY2ssIHBhcmFtcywgcmVxLCByZXMsIHByb2Nlc3NOZXh0Um91dGUpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHByb2Nlc3NOZXh0Um91dGUoKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcHJvY2Vzc05leHRTdWJSb3V0ZXIoKTtcbiAgICB9IFxuICB9XG5cbiAgY29uc3QgcHJvY2Vzc05leHRTdWJSb3V0ZXIgPSAoKSA9PiB7XG4gICAgY29uc3Qgc3ViUm91dGVyID0gdGhpcy5zdWJSb3V0ZXJzW2N1cnJlbnRTdWJSb3V0ZXIrK107XG4gICAgaWYoc3ViUm91dGVyKSB7XG4gICAgICBzdWJSb3V0ZXIuX2Rpc3BhdGNoKHJlcSwgcmVzLCBwcm9jZXNzTmV4dFN1YlJvdXRlcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJ5cGFzcygpO1xuICAgIH1cbiAgfVxuICBwcm9jZXNzTmV4dFJvdXRlKCk7XG59O1xuXG5QaWNrZXJJbXAucHJvdG90eXBlLl9idWlsZFBhcmFtcyA9IGZ1bmN0aW9uKGtleXMsIG0pIHtcbiAgY29uc3QgcGFyYW1zID0ge307XG4gIGZvcihsZXQgbGMgPSAxOyBsYyA8IG0ubGVuZ3RoOyBsYysrKSB7XG4gICAgY29uc3Qga2V5ID0ga2V5c1tsYy0xXT8ubmFtZTtcbiAgICBwYXJhbXNba2V5XSA9IGRlY29kZVVSSUNvbXBvbmVudChtW2xjXSk7XG4gIH1cblxuICByZXR1cm4gcGFyYW1zO1xufTtcblxuUGlja2VySW1wLnByb3RvdHlwZS5fcHJvY2Vzc1JvdXRlID0gZnVuY3Rpb24oY2FsbGJhY2ssIHBhcmFtcywgcmVxLCByZXMsIG5leHQpIHtcbiAgaWYoRmliZXIuY3VycmVudCkge1xuICAgIGRvQ2FsbCgpO1xuICB9IGVsc2Uge1xuICAgIG5ldyBGaWJlcihkb0NhbGwpLnJ1bigpO1xuICB9XG5cbiAgZnVuY3Rpb24gZG9DYWxsICgpIHtcbiAgICBjYWxsYmFjay5jYWxsKG51bGwsIHBhcmFtcywgcmVxLCByZXMsIG5leHQpOyBcbiAgfVxufTtcblxuUGlja2VySW1wLnByb3RvdHlwZS5fcHJvY2Vzc01pZGRsZXdhcmUgPSBmdW5jdGlvbihtaWRkbGV3YXJlLCByZXEsIHJlcywgbmV4dCkge1xuICBpZihGaWJlci5jdXJyZW50KSB7XG4gICAgZG9DYWxsKCk7XG4gIH0gZWxzZSB7XG4gICAgbmV3IEZpYmVyKGRvQ2FsbCkucnVuKCk7XG4gIH1cblxuICBmdW5jdGlvbiBkb0NhbGwoKSB7XG4gICAgbWlkZGxld2FyZS5jYWxsKG51bGwsIHJlcSwgcmVzLCBuZXh0KTtcbiAgfVxufTsiXX0=
