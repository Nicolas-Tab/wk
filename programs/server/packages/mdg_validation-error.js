(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var check = Package.check.check;
var Match = Package.check.Match;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var ValidationError;

var require = meteorInstall({"node_modules":{"meteor":{"mdg:validation-error":{"validation-error.js":function module(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/mdg_validation-error/validation-error.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// The "details" property of the ValidationError must be an array of objects
// containing at least two properties. The "name" and "type" properties are
// required.
const errorsPattern = [Match.ObjectIncluding({
  name: String,
  type: String
})];
ValidationError = class extends Meteor.Error {
  constructor(errors) {
    let message = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : ValidationError.DEFAULT_MESSAGE;
    check(errors, errorsPattern);
    check(message, String);
    return super(ValidationError.ERROR_CODE, message, errors);
  }

  // Static method checking if a given Meteor.Error is an instance of
  // ValidationError.
  static is(err) {
    return err instanceof Meteor.Error && err.error === ValidationError.ERROR_CODE;
  }
};

// Universal validation error code to be use in applications and packages.
ValidationError.ERROR_CODE = 'validation-error';
// Default validation error message that can be changed globally.
ValidationError.DEFAULT_MESSAGE = 'Validation failed';
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/mdg:validation-error/validation-error.js");

/* Exports */
Package._define("mdg:validation-error", {
  ValidationError: ValidationError
});

})();

//# sourceURL=meteor://💻app/packages/mdg_validation-error.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbWRnOnZhbGlkYXRpb24tZXJyb3IvdmFsaWRhdGlvbi1lcnJvci5qcyJdLCJuYW1lcyI6WyJlcnJvcnNQYXR0ZXJuIiwiTWF0Y2giLCJPYmplY3RJbmNsdWRpbmciLCJuYW1lIiwiU3RyaW5nIiwidHlwZSIsIlZhbGlkYXRpb25FcnJvciIsIk1ldGVvciIsIkVycm9yIiwiY29uc3RydWN0b3IiLCJlcnJvcnMiLCJtZXNzYWdlIiwiYXJndW1lbnRzIiwibGVuZ3RoIiwidW5kZWZpbmVkIiwiREVGQVVMVF9NRVNTQUdFIiwiY2hlY2siLCJFUlJPUl9DT0RFIiwiaXMiLCJlcnIiLCJlcnJvciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQSxNQUFNQSxhQUFhLEdBQUcsQ0FBQ0MsS0FBSyxDQUFDQyxlQUFlLENBQUM7RUFDM0NDLElBQUksRUFBRUMsTUFBTTtFQUNaQyxJQUFJLEVBQUVEO0FBQ1IsQ0FBQyxDQUFDLENBQUM7QUFFSEUsZUFBZSxHQUFHLGNBQWNDLE1BQU0sQ0FBQ0MsS0FBSyxDQUFDO0VBQzNDQyxXQUFXQSxDQUFDQyxNQUFNLEVBQTZDO0lBQUEsSUFBM0NDLE9BQU8sR0FBQUMsU0FBQSxDQUFBQyxNQUFBLFFBQUFELFNBQUEsUUFBQUUsU0FBQSxHQUFBRixTQUFBLE1BQUdOLGVBQWUsQ0FBQ1MsZUFBZTtJQUMzREMsS0FBSyxDQUFDTixNQUFNLEVBQUVWLGFBQWEsQ0FBQztJQUM1QmdCLEtBQUssQ0FBQ0wsT0FBTyxFQUFFUCxNQUFNLENBQUM7SUFFdEIsT0FBTyxLQUFLLENBQUNFLGVBQWUsQ0FBQ1csVUFBVSxFQUFFTixPQUFPLEVBQUVELE1BQU0sQ0FBQztFQUMzRDs7RUFFQTtFQUNBO0VBQ0EsT0FBT1EsRUFBRUEsQ0FBQ0MsR0FBRyxFQUFFO0lBQ2IsT0FBT0EsR0FBRyxZQUFZWixNQUFNLENBQUNDLEtBQUssSUFBSVcsR0FBRyxDQUFDQyxLQUFLLEtBQUtkLGVBQWUsQ0FBQ1csVUFBVTtFQUNoRjtBQUNGLENBQUM7O0FBRUQ7QUFDQVgsZUFBZSxDQUFDVyxVQUFVLEdBQUcsa0JBQWtCO0FBQy9DO0FBQ0FYLGVBQWUsQ0FBQ1MsZUFBZSxHQUFHLG1CQUFtQixDIiwiZmlsZSI6Ii9wYWNrYWdlcy9tZGdfdmFsaWRhdGlvbi1lcnJvci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFRoZSBcImRldGFpbHNcIiBwcm9wZXJ0eSBvZiB0aGUgVmFsaWRhdGlvbkVycm9yIG11c3QgYmUgYW4gYXJyYXkgb2Ygb2JqZWN0c1xuLy8gY29udGFpbmluZyBhdCBsZWFzdCB0d28gcHJvcGVydGllcy4gVGhlIFwibmFtZVwiIGFuZCBcInR5cGVcIiBwcm9wZXJ0aWVzIGFyZVxuLy8gcmVxdWlyZWQuXG5jb25zdCBlcnJvcnNQYXR0ZXJuID0gW01hdGNoLk9iamVjdEluY2x1ZGluZyh7XG4gIG5hbWU6IFN0cmluZyxcbiAgdHlwZTogU3RyaW5nXG59KV07XG5cblZhbGlkYXRpb25FcnJvciA9IGNsYXNzIGV4dGVuZHMgTWV0ZW9yLkVycm9yIHtcbiAgY29uc3RydWN0b3IoZXJyb3JzLCBtZXNzYWdlID0gVmFsaWRhdGlvbkVycm9yLkRFRkFVTFRfTUVTU0FHRSkge1xuICAgIGNoZWNrKGVycm9ycywgZXJyb3JzUGF0dGVybik7XG4gICAgY2hlY2sobWVzc2FnZSwgU3RyaW5nKTtcblxuICAgIHJldHVybiBzdXBlcihWYWxpZGF0aW9uRXJyb3IuRVJST1JfQ09ERSwgbWVzc2FnZSwgZXJyb3JzKTtcbiAgfVxuXG4gIC8vIFN0YXRpYyBtZXRob2QgY2hlY2tpbmcgaWYgYSBnaXZlbiBNZXRlb3IuRXJyb3IgaXMgYW4gaW5zdGFuY2Ugb2ZcbiAgLy8gVmFsaWRhdGlvbkVycm9yLlxuICBzdGF0aWMgaXMoZXJyKSB7XG4gICAgcmV0dXJuIGVyciBpbnN0YW5jZW9mIE1ldGVvci5FcnJvciAmJiBlcnIuZXJyb3IgPT09IFZhbGlkYXRpb25FcnJvci5FUlJPUl9DT0RFO1xuICB9O1xufTtcblxuLy8gVW5pdmVyc2FsIHZhbGlkYXRpb24gZXJyb3IgY29kZSB0byBiZSB1c2UgaW4gYXBwbGljYXRpb25zIGFuZCBwYWNrYWdlcy5cblZhbGlkYXRpb25FcnJvci5FUlJPUl9DT0RFID0gJ3ZhbGlkYXRpb24tZXJyb3InO1xuLy8gRGVmYXVsdCB2YWxpZGF0aW9uIGVycm9yIG1lc3NhZ2UgdGhhdCBjYW4gYmUgY2hhbmdlZCBnbG9iYWxseS5cblZhbGlkYXRpb25FcnJvci5ERUZBVUxUX01FU1NBR0UgPSAnVmFsaWRhdGlvbiBmYWlsZWQnO1xuIl19
