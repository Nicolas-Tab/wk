(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var _ = Package.underscore._;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var ComputedField = Package['peerlibrary:computed-field'].ComputedField;
var Promise = Package.promise.Promise;
var meteorInstall = Package.modules.meteorInstall;

/* Package-scope variables */
var __coffeescriptShare, path, obj, DataLookup;

var require = meteorInstall({"node_modules":{"meteor":{"peerlibrary:data-lookup":{"lib.coffee":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////
//                                                                   //
// packages/peerlibrary_data-lookup/lib.coffee                       //
//                                                                   //
///////////////////////////////////////////////////////////////////////
                                                                     //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
module.export({
  DataLookup: () => DataLookup
});
var DataLookup = class DataLookup {
  static lookup(obj, path) {
    var segment;
    if (_.isString(path)) {
      path = path.split('.');
    }
    if (_.isFunction(obj)) {
      obj = obj();
    }
    if (!_.isArray(path)) {
      return obj;
    }
    while (path.length > 0) {
      segment = path.shift();
      if (_.isObject(obj) && segment in obj) {
        obj = obj[segment];
        if (_.isFunction(obj)) {
          obj = obj();
        }
      } else {
        return void 0;
      }
    }
    return obj;
  }
  static get(obj, path, equalsFunc) {
    var result;
    if (!Tracker.active) {
      return this.lookup(obj, path);
    }
    result = new ComputedField(() => {
      return this.lookup(obj, path);
    }, equalsFunc);
    return result();
  }
};
///////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json",
    ".coffee"
  ]
});

var exports = require("/node_modules/meteor/peerlibrary:data-lookup/lib.coffee");

/* Exports */
Package._define("peerlibrary:data-lookup", exports, {
  DataLookup: DataLookup
});

})();

//# sourceURL=meteor://💻app/packages/peerlibrary_data-lookup.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcGVlcmxpYnJhcnlfZGF0YS1sb29rdXAvbGliLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvbGliLmNvZmZlZSJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJEYXRhTG9va3VwIiwibG9va3VwIiwib2JqIiwicGF0aCIsInNlZ21lbnQiLCJfIiwiaXNTdHJpbmciLCJzcGxpdCIsImlzRnVuY3Rpb24iLCJpc0FycmF5IiwibGVuZ3RoIiwic2hpZnQiLCJpc09iamVjdCIsImdldCIsImVxdWFsc0Z1bmMiLCJyZXN1bHQiLCJUcmFja2VyIiwiYWN0aXZlIiwiQ29tcHV0ZWRGaWVsZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsTUFBQSxDQUFBQyxNQUFhO0VBQUFDLFVBQU4sUUFBQUE7QUFBQTtBQUFQLElBQWFBLFVBQUEsR0FBTixNQUFBQSxVQUFBO0VBQ0ksT0FBUkMsTUFBUSxDQUFDQyxHQUFELEVBQU1DLElBQU47SUFDUCxJQUFBQyxPQUFBO0lBQUEsSUFBeUJDLENBQUMsQ0FBQ0MsUUFBRixDQUFXSCxJQUFYLENBQXpCO01BQUFBLElBQUEsR0FBT0EsSUFBSSxDQUFDSSxLQUFMLENBQVcsR0FBWDtJQ0dQO0lEREEsSUFBZUYsQ0FBQyxDQUFDRyxVQUFGLENBQWFOLEdBQWIsQ0FBZjtNQUFBQSxHQUFBLEdBQU1BLEdBQUE7SUNJTjtJREZBLEtBQWtCRyxDQUFDLENBQUNJLE9BQUYsQ0FBVU4sSUFBVixDQUFsQjtNQUFBLE9BQU9ELEdBQUE7SUNLUDtJREhBLE9BQU1DLElBQUksQ0FBQ08sTUFBTCxHQUFjLENBQXBCO01BQ0VOLE9BQUEsR0FBVUQsSUFBSSxDQUFDUSxLQUFMO01BQ1YsSUFBR04sQ0FBQyxDQUFDTyxRQUFGLENBQVdWLEdBQVgsS0FBb0JFLE9BQUEsSUFBV0YsR0FBbEM7UUFDRUEsR0FBQSxHQUFNQSxHQUFJLENBQUFFLE9BQUE7UUFDVixJQUFlQyxDQUFDLENBQUNHLFVBQUYsQ0FBYU4sR0FBYixDQUFmO1VBQUFBLEdBQUEsR0FBTUEsR0FBQTtRQ01OO01BQ0YsQ0RUQTtRQUlFLE9BQU87TUNPVDtJRGJGO0lDZUEsT0RQQUEsR0FBQTtFQWZPO0VBaUJILE9BQUxXLEdBQUssQ0FBQ1gsR0FBRCxFQUFNQyxJQUFOLEVBQVlXLFVBQVo7SUFDSixJQUFBQyxNQUFBO0lBQUEsS0FBZ0NDLE9BQU8sQ0FBQ0MsTUFBeEM7TUFBQSxPQUFPLElBQUMsQ0FBQWhCLE1BQUQsQ0FBUUMsR0FBUixFQUFhQyxJQUFiO0lDV1A7SURUQVksTUFBQSxHQUFTLElBQUlHLGFBQUosQ0FBa0I7TUNXekIsT0RWQSxJQUFDLENBQUFqQixNQUFELENBQVFDLEdBQVIsRUFBYUMsSUFBYjtJQUR5QixDQUFsQixFQUdQVyxVQUhPO0lDYVQsT0RSQUMsTUFBQTtFQVJJO0FBbEJELEUiLCJmaWxlIjoiL3BhY2thZ2VzL3BlZXJsaWJyYXJ5X2RhdGEtbG9va3VwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNsYXNzIERhdGFMb29rdXBcbiAgQGxvb2t1cDogKG9iaiwgcGF0aCkgLT5cbiAgICBwYXRoID0gcGF0aC5zcGxpdCAnLicgaWYgXy5pc1N0cmluZyBwYXRoXG5cbiAgICBvYmogPSBvYmooKSBpZiBfLmlzRnVuY3Rpb24gb2JqXG5cbiAgICByZXR1cm4gb2JqIHVubGVzcyBfLmlzQXJyYXkgcGF0aFxuXG4gICAgd2hpbGUgcGF0aC5sZW5ndGggPiAwXG4gICAgICBzZWdtZW50ID0gcGF0aC5zaGlmdCgpXG4gICAgICBpZiBfLmlzT2JqZWN0KG9iaikgYW5kIHNlZ21lbnQgb2Ygb2JqXG4gICAgICAgIG9iaiA9IG9ialtzZWdtZW50XVxuICAgICAgICBvYmogPSBvYmooKSBpZiBfLmlzRnVuY3Rpb24gb2JqXG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiB1bmRlZmluZWRcblxuICAgIG9ialxuXG4gIEBnZXQ6IChvYmosIHBhdGgsIGVxdWFsc0Z1bmMpIC0+XG4gICAgcmV0dXJuIEBsb29rdXAgb2JqLCBwYXRoIHVubGVzcyBUcmFja2VyLmFjdGl2ZVxuXG4gICAgcmVzdWx0ID0gbmV3IENvbXB1dGVkRmllbGQgPT5cbiAgICAgIEBsb29rdXAgb2JqLCBwYXRoXG4gICAgLFxuICAgICAgZXF1YWxzRnVuY1xuXG4gICAgcmVzdWx0KClcbiIsImV4cG9ydCB2YXIgRGF0YUxvb2t1cCA9IGNsYXNzIERhdGFMb29rdXAge1xuICBzdGF0aWMgbG9va3VwKG9iaiwgcGF0aCkge1xuICAgIHZhciBzZWdtZW50O1xuICAgIGlmIChfLmlzU3RyaW5nKHBhdGgpKSB7XG4gICAgICBwYXRoID0gcGF0aC5zcGxpdCgnLicpO1xuICAgIH1cbiAgICBpZiAoXy5pc0Z1bmN0aW9uKG9iaikpIHtcbiAgICAgIG9iaiA9IG9iaigpO1xuICAgIH1cbiAgICBpZiAoIV8uaXNBcnJheShwYXRoKSkge1xuICAgICAgcmV0dXJuIG9iajtcbiAgICB9XG4gICAgd2hpbGUgKHBhdGgubGVuZ3RoID4gMCkge1xuICAgICAgc2VnbWVudCA9IHBhdGguc2hpZnQoKTtcbiAgICAgIGlmIChfLmlzT2JqZWN0KG9iaikgJiYgc2VnbWVudCBpbiBvYmopIHtcbiAgICAgICAgb2JqID0gb2JqW3NlZ21lbnRdO1xuICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKG9iaikpIHtcbiAgICAgICAgICBvYmogPSBvYmooKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHZvaWQgMDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG9iajtcbiAgfVxuXG4gIHN0YXRpYyBnZXQob2JqLCBwYXRoLCBlcXVhbHNGdW5jKSB7XG4gICAgdmFyIHJlc3VsdDtcbiAgICBpZiAoIVRyYWNrZXIuYWN0aXZlKSB7XG4gICAgICByZXR1cm4gdGhpcy5sb29rdXAob2JqLCBwYXRoKTtcbiAgICB9XG4gICAgcmVzdWx0ID0gbmV3IENvbXB1dGVkRmllbGQoKCkgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMubG9va3VwKG9iaiwgcGF0aCk7XG4gICAgfSwgZXF1YWxzRnVuYyk7XG4gICAgcmV0dXJuIHJlc3VsdCgpO1xuICB9XG5cbn07XG4iXX0=
