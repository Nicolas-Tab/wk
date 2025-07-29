(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var ECMAScript = Package.ecmascript.ECMAScript;
var _ = Package.underscore._;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"mquandalle:collection-mutations":{"mutations.js":function module(){

///////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                               //
// packages/mquandalle_collection-mutations/mutations.js                                         //
//                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                 //
Mongo.Collection.prototype.mutations = function (mutations) {
  const collection = this;
  collection.helpers(_.chain(mutations).map((action, name) => {
    return [name, function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      const mutation = action.apply(this, args);
      if (mutation) {
        collection.update(this._id, mutation);
      }
    }];
  }).object().value());
};
///////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/mquandalle:collection-mutations/mutations.js");

/* Exports */
Package._define("mquandalle:collection-mutations");

})();

//# sourceURL=meteor://💻app/packages/mquandalle_collection-mutations.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbXF1YW5kYWxsZTpjb2xsZWN0aW9uLW11dGF0aW9ucy9tdXRhdGlvbnMuanMiXSwibmFtZXMiOlsiTW9uZ28iLCJDb2xsZWN0aW9uIiwicHJvdG90eXBlIiwibXV0YXRpb25zIiwiY29sbGVjdGlvbiIsImhlbHBlcnMiLCJfIiwiY2hhaW4iLCJtYXAiLCJhY3Rpb24iLCJuYW1lIiwiX2xlbiIsImFyZ3VtZW50cyIsImxlbmd0aCIsImFyZ3MiLCJBcnJheSIsIl9rZXkiLCJtdXRhdGlvbiIsImFwcGx5IiwidXBkYXRlIiwiX2lkIiwib2JqZWN0IiwidmFsdWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxLQUFLLENBQUNDLFVBQVUsQ0FBQ0MsU0FBUyxDQUFDQyxTQUFTLEdBQUcsVUFBU0EsU0FBUyxFQUFFO0VBQ3pELE1BQU1DLFVBQVUsR0FBRyxJQUFJO0VBRXZCQSxVQUFVLENBQUNDLE9BQU8sQ0FBQ0MsQ0FBQyxDQUFDQyxLQUFLLENBQUNKLFNBQVMsQ0FBQyxDQUFDSyxHQUFHLENBQUMsQ0FBQ0MsTUFBTSxFQUFFQyxJQUFJLEtBQUs7SUFDMUQsT0FBTyxDQUFDQSxJQUFJLEVBQUUsWUFBa0I7TUFBQSxTQUFBQyxJQUFBLEdBQUFDLFNBQUEsQ0FBQUMsTUFBQSxFQUFOQyxJQUFJLE9BQUFDLEtBQUEsQ0FBQUosSUFBQSxHQUFBSyxJQUFBLE1BQUFBLElBQUEsR0FBQUwsSUFBQSxFQUFBSyxJQUFBO1FBQUpGLElBQUksQ0FBQUUsSUFBQSxJQUFBSixTQUFBLENBQUFJLElBQUE7TUFBQTtNQUM1QixNQUFNQyxRQUFRLEdBQUdSLE1BQU0sQ0FBQ1MsS0FBSyxDQUFDLElBQUksRUFBRUosSUFBSSxDQUFDO01BQ3pDLElBQUlHLFFBQVEsRUFBRTtRQUNaYixVQUFVLENBQUNlLE1BQU0sQ0FBQyxJQUFJLENBQUNDLEdBQUcsRUFBRUgsUUFBUSxDQUFDO01BQ3ZDO0lBQ0YsQ0FBQyxDQUFDO0VBQ0osQ0FBQyxDQUFDLENBQUNJLE1BQU0sQ0FBQyxDQUFDLENBQUNDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDdEIsQ0FBQyxDIiwiZmlsZSI6Ii9wYWNrYWdlcy9tcXVhbmRhbGxlX2NvbGxlY3Rpb24tbXV0YXRpb25zLmpzIiwic291cmNlc0NvbnRlbnQiOlsiTW9uZ28uQ29sbGVjdGlvbi5wcm90b3R5cGUubXV0YXRpb25zID0gZnVuY3Rpb24obXV0YXRpb25zKSB7XG4gIGNvbnN0IGNvbGxlY3Rpb24gPSB0aGlzO1xuXG4gIGNvbGxlY3Rpb24uaGVscGVycyhfLmNoYWluKG11dGF0aW9ucykubWFwKChhY3Rpb24sIG5hbWUpID0+IHtcbiAgICByZXR1cm4gW25hbWUsIGZ1bmN0aW9uKC4uLmFyZ3MpIHtcbiAgICAgIGNvbnN0IG11dGF0aW9uID0gYWN0aW9uLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgaWYgKG11dGF0aW9uKSB7XG4gICAgICAgIGNvbGxlY3Rpb24udXBkYXRlKHRoaXMuX2lkLCBtdXRhdGlvbik7XG4gICAgICB9XG4gICAgfV07XG4gIH0pLm9iamVjdCgpLnZhbHVlKCkpO1xufTtcbiJdfQ==
