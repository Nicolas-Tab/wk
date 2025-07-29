(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var ReactiveVar = Package['reactive-var'].ReactiveVar;
var _ = Package.underscore._;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var storePrevious, equalsFunc, ReactiveField;

var require = meteorInstall({"node_modules":{"meteor":{"peerlibrary:reactive-field":{"lib.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// packages/peerlibrary_reactive-field/lib.js                                                                //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
module.export({
  ReactiveField: () => ReactiveField
});
class ReactiveField {
  constructor(initialValue, equalsFunc, storePrevious) {
    // To allow not passing equalsFunc, but just storePrevious.
    if (!_.isFunction(equalsFunc) && arguments.length === 2) {
      storePrevious = equalsFunc;
      equalsFunc = null;
    }
    let previousValue = undefined;
    const value = new ReactiveVar(initialValue, equalsFunc);
    const getterSetter = function (newValue) {
      if (arguments.length > 0) {
        if (storePrevious) {
          Tracker.nonreactive(() => {
            const oldValue = value.get();
            // Only if the new value is different than currently stored value, we update the previous value.
            if (!(equalsFunc || ReactiveVar._isEqual)(oldValue, newValue)) {
              previousValue = oldValue;
            }
          });
        }
        value.set(newValue);
        // We return the value as well, but we do not want to register a dependency.
        return Tracker.nonreactive(() => {
          return value.get();
        });
      }
      return value.get();
    };

    // We mingle the prototype so that getterSetter instanceof ReactiveField is true.
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(getterSetter, this.constructor.prototype);
    } else {
      getterSetter.__proto__ = this.constructor.prototype;
    }
    getterSetter.toString = function () {
      return "ReactiveField{".concat(this(), "}");
    };
    getterSetter.apply = function (obj, args) {
      if (args && args.length > 0) {
        return getterSetter(args[0]);
      } else {
        return getterSetter();
      }
    };
    getterSetter.call = function (obj, arg) {
      if (arguments.length > 1) {
        return getterSetter(arg);
      } else {
        return getterSetter();
      }
    };
    getterSetter.previous = function () {
      if (!storePrevious) {
        throw new Error("Storing previous value is not enabled.");
      }
      return previousValue;
    };
    return getterSetter;
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/peerlibrary:reactive-field/lib.js");

/* Exports */
Package._define("peerlibrary:reactive-field", exports, {
  ReactiveField: ReactiveField
});

})();

//# sourceURL=meteor://💻app/packages/peerlibrary_reactive-field.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcGVlcmxpYnJhcnk6cmVhY3RpdmUtZmllbGQvbGliLmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydCIsIlJlYWN0aXZlRmllbGQiLCJjb25zdHJ1Y3RvciIsImluaXRpYWxWYWx1ZSIsImVxdWFsc0Z1bmMiLCJzdG9yZVByZXZpb3VzIiwiXyIsImlzRnVuY3Rpb24iLCJhcmd1bWVudHMiLCJsZW5ndGgiLCJwcmV2aW91c1ZhbHVlIiwidW5kZWZpbmVkIiwidmFsdWUiLCJSZWFjdGl2ZVZhciIsImdldHRlclNldHRlciIsIm5ld1ZhbHVlIiwiVHJhY2tlciIsIm5vbnJlYWN0aXZlIiwib2xkVmFsdWUiLCJnZXQiLCJfaXNFcXVhbCIsInNldCIsIk9iamVjdCIsInNldFByb3RvdHlwZU9mIiwicHJvdG90eXBlIiwiX19wcm90b19fIiwidG9TdHJpbmciLCJjb25jYXQiLCJhcHBseSIsIm9iaiIsImFyZ3MiLCJjYWxsIiwiYXJnIiwicHJldmlvdXMiLCJFcnJvciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxNQUFNLENBQUNDLE1BQU0sQ0FBQztFQUFDQyxhQUFhLEVBQUNBLENBQUEsS0FBSUE7QUFBYSxDQUFDLENBQUM7QUFBekMsTUFBTUEsYUFBYSxDQUFDO0VBQ3pCQyxXQUFXQSxDQUFDQyxZQUFZLEVBQUVDLFVBQVUsRUFBRUMsYUFBYSxFQUFFO0lBQ25EO0lBQ0EsSUFBSSxDQUFDQyxDQUFDLENBQUNDLFVBQVUsQ0FBQ0gsVUFBVSxDQUFDLElBQUtJLFNBQVMsQ0FBQ0MsTUFBTSxLQUFLLENBQUUsRUFBRTtNQUN6REosYUFBYSxHQUFHRCxVQUFVO01BQzFCQSxVQUFVLEdBQUcsSUFBSTtJQUNuQjtJQUNBLElBQUlNLGFBQWEsR0FBR0MsU0FBUztJQUM3QixNQUFNQyxLQUFLLEdBQUcsSUFBSUMsV0FBVyxDQUFDVixZQUFZLEVBQUVDLFVBQVUsQ0FBQztJQUV2RCxNQUFNVSxZQUFZLEdBQUcsU0FBQUEsQ0FBVUMsUUFBUSxFQUFFO01BQ3ZDLElBQUlQLFNBQVMsQ0FBQ0MsTUFBTSxHQUFHLENBQUMsRUFBRTtRQUN4QixJQUFJSixhQUFhLEVBQUU7VUFDakJXLE9BQU8sQ0FBQ0MsV0FBVyxDQUFDLE1BQU07WUFDeEIsTUFBTUMsUUFBUSxHQUFHTixLQUFLLENBQUNPLEdBQUcsQ0FBQyxDQUFDO1lBQzVCO1lBQ0EsSUFBSSxDQUFDLENBQUNmLFVBQVUsSUFBSVMsV0FBVyxDQUFDTyxRQUFRLEVBQUVGLFFBQVEsRUFBRUgsUUFBUSxDQUFDLEVBQUU7Y0FDN0RMLGFBQWEsR0FBR1EsUUFBUTtZQUMxQjtVQUNGLENBQUMsQ0FBQztRQUNKO1FBRUFOLEtBQUssQ0FBQ1MsR0FBRyxDQUFDTixRQUFRLENBQUM7UUFDbkI7UUFDQSxPQUFPQyxPQUFPLENBQUNDLFdBQVcsQ0FBQyxNQUFNO1VBQy9CLE9BQU9MLEtBQUssQ0FBQ08sR0FBRyxDQUFDLENBQUM7UUFDcEIsQ0FBQyxDQUFDO01BQ0o7TUFFQSxPQUFPUCxLQUFLLENBQUNPLEdBQUcsQ0FBQyxDQUFDO0lBQ3BCLENBQUM7O0lBRUQ7SUFDQSxJQUFJRyxNQUFNLENBQUNDLGNBQWMsRUFBRTtNQUN6QkQsTUFBTSxDQUFDQyxjQUFjLENBQUNULFlBQVksRUFBRSxJQUFJLENBQUNaLFdBQVcsQ0FBQ3NCLFNBQVMsQ0FBQztJQUNqRSxDQUFDLE1BQ0k7TUFDSFYsWUFBWSxDQUFDVyxTQUFTLEdBQUcsSUFBSSxDQUFDdkIsV0FBVyxDQUFDc0IsU0FBUztJQUNyRDtJQUVBVixZQUFZLENBQUNZLFFBQVEsR0FBRyxZQUFZO01BQ2xDLHdCQUFBQyxNQUFBLENBQXdCLElBQUksQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFFRGIsWUFBWSxDQUFDYyxLQUFLLEdBQUcsVUFBVUMsR0FBRyxFQUFFQyxJQUFJLEVBQUU7TUFDeEMsSUFBSUEsSUFBSSxJQUFJQSxJQUFJLENBQUNyQixNQUFNLEdBQUcsQ0FBQyxFQUFFO1FBQzNCLE9BQU9LLFlBQVksQ0FBQ2dCLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUM5QixDQUFDLE1BQ0k7UUFDSCxPQUFPaEIsWUFBWSxDQUFDLENBQUM7TUFDdkI7SUFDRixDQUFDO0lBRURBLFlBQVksQ0FBQ2lCLElBQUksR0FBRyxVQUFVRixHQUFHLEVBQUVHLEdBQUcsRUFBRTtNQUN0QyxJQUFJeEIsU0FBUyxDQUFDQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1FBQ3hCLE9BQU9LLFlBQVksQ0FBQ2tCLEdBQUcsQ0FBQztNQUMxQixDQUFDLE1BQ0k7UUFDSCxPQUFPbEIsWUFBWSxDQUFDLENBQUM7TUFDdkI7SUFDRixDQUFDO0lBRURBLFlBQVksQ0FBQ21CLFFBQVEsR0FBRyxZQUFXO01BQ2pDLElBQUksQ0FBQzVCLGFBQWEsRUFBRTtRQUNsQixNQUFNLElBQUk2QixLQUFLLENBQUMsd0NBQXdDLENBQUM7TUFDM0Q7TUFDQSxPQUFPeEIsYUFBYTtJQUN0QixDQUFDO0lBRUQsT0FBT0ksWUFBWTtFQUNyQjtBQUNGLEMiLCJmaWxlIjoiL3BhY2thZ2VzL3BlZXJsaWJyYXJ5X3JlYWN0aXZlLWZpZWxkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNsYXNzIFJlYWN0aXZlRmllbGQge1xuICBjb25zdHJ1Y3Rvcihpbml0aWFsVmFsdWUsIGVxdWFsc0Z1bmMsIHN0b3JlUHJldmlvdXMpIHtcbiAgICAvLyBUbyBhbGxvdyBub3QgcGFzc2luZyBlcXVhbHNGdW5jLCBidXQganVzdCBzdG9yZVByZXZpb3VzLlxuICAgIGlmICghXy5pc0Z1bmN0aW9uKGVxdWFsc0Z1bmMpICYmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSkge1xuICAgICAgc3RvcmVQcmV2aW91cyA9IGVxdWFsc0Z1bmM7XG4gICAgICBlcXVhbHNGdW5jID0gbnVsbDtcbiAgICB9XG4gICAgbGV0IHByZXZpb3VzVmFsdWUgPSB1bmRlZmluZWQ7XG4gICAgY29uc3QgdmFsdWUgPSBuZXcgUmVhY3RpdmVWYXIoaW5pdGlhbFZhbHVlLCBlcXVhbHNGdW5jKTtcblxuICAgIGNvbnN0IGdldHRlclNldHRlciA9IGZ1bmN0aW9uIChuZXdWYWx1ZSkge1xuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGlmIChzdG9yZVByZXZpb3VzKSB7XG4gICAgICAgICAgVHJhY2tlci5ub25yZWFjdGl2ZSgoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBvbGRWYWx1ZSA9IHZhbHVlLmdldCgpO1xuICAgICAgICAgICAgLy8gT25seSBpZiB0aGUgbmV3IHZhbHVlIGlzIGRpZmZlcmVudCB0aGFuIGN1cnJlbnRseSBzdG9yZWQgdmFsdWUsIHdlIHVwZGF0ZSB0aGUgcHJldmlvdXMgdmFsdWUuXG4gICAgICAgICAgICBpZiAoIShlcXVhbHNGdW5jIHx8IFJlYWN0aXZlVmFyLl9pc0VxdWFsKShvbGRWYWx1ZSwgbmV3VmFsdWUpKSB7XG4gICAgICAgICAgICAgIHByZXZpb3VzVmFsdWUgPSBvbGRWYWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhbHVlLnNldChuZXdWYWx1ZSk7XG4gICAgICAgIC8vIFdlIHJldHVybiB0aGUgdmFsdWUgYXMgd2VsbCwgYnV0IHdlIGRvIG5vdCB3YW50IHRvIHJlZ2lzdGVyIGEgZGVwZW5kZW5jeS5cbiAgICAgICAgcmV0dXJuIFRyYWNrZXIubm9ucmVhY3RpdmUoKCkgPT4ge1xuICAgICAgICAgIHJldHVybiB2YWx1ZS5nZXQoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB2YWx1ZS5nZXQoKTtcbiAgICB9O1xuXG4gICAgLy8gV2UgbWluZ2xlIHRoZSBwcm90b3R5cGUgc28gdGhhdCBnZXR0ZXJTZXR0ZXIgaW5zdGFuY2VvZiBSZWFjdGl2ZUZpZWxkIGlzIHRydWUuXG4gICAgaWYgKE9iamVjdC5zZXRQcm90b3R5cGVPZikge1xuICAgICAgT2JqZWN0LnNldFByb3RvdHlwZU9mKGdldHRlclNldHRlciwgdGhpcy5jb25zdHJ1Y3Rvci5wcm90b3R5cGUpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGdldHRlclNldHRlci5fX3Byb3RvX18gPSB0aGlzLmNvbnN0cnVjdG9yLnByb3RvdHlwZTtcbiAgICB9XG5cbiAgICBnZXR0ZXJTZXR0ZXIudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gYFJlYWN0aXZlRmllbGR7JHt0aGlzKCl9fWA7XG4gICAgfTtcblxuICAgIGdldHRlclNldHRlci5hcHBseSA9IGZ1bmN0aW9uIChvYmosIGFyZ3MpIHtcbiAgICAgIGlmIChhcmdzICYmIGFyZ3MubGVuZ3RoID4gMCkge1xuICAgICAgICByZXR1cm4gZ2V0dGVyU2V0dGVyKGFyZ3NbMF0pO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBnZXR0ZXJTZXR0ZXIoKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgZ2V0dGVyU2V0dGVyLmNhbGwgPSBmdW5jdGlvbiAob2JqLCBhcmcpIHtcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICByZXR1cm4gZ2V0dGVyU2V0dGVyKGFyZyk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGdldHRlclNldHRlcigpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBnZXR0ZXJTZXR0ZXIucHJldmlvdXMgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICghc3RvcmVQcmV2aW91cykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTdG9yaW5nIHByZXZpb3VzIHZhbHVlIGlzIG5vdCBlbmFibGVkLlwiKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwcmV2aW91c1ZhbHVlO1xuICAgIH07XG5cbiAgICByZXR1cm4gZ2V0dGVyU2V0dGVyO1xuICB9XG59XG4iXX0=
