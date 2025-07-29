(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var Collection2 = Package['aldeed:collection2-core'].Collection2;
var _ = Package.underscore._;
var LocalCollection = Package.minimongo.LocalCollection;
var Minimongo = Package.minimongo.Minimongo;
var check = Package.check.check;
var Match = Package.check.Match;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;
var SimpleSchema = Package['aldeed:simple-schema'].SimpleSchema;
var MongoObject = Package['aldeed:simple-schema'].MongoObject;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;

var require = meteorInstall({"node_modules":{"meteor":{"aldeed:schema-index":{"lib":{"indexing.js":function module(){

///////////////////////////////////////////////////////////////////////////////////////
//                                                                                   //
// packages/aldeed_schema-index/lib/indexing.js                                      //
//                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////
                                                                                     //
// Extend the schema options allowed by SimpleSchema
SimpleSchema.extendOptions({
  index: Match.Optional(Match.OneOf(Number, String, Boolean)),
  unique: Match.Optional(Boolean),
  sparse: Match.Optional(Boolean)
});

// Define validation error messages (legacy)
if (!SimpleSchema.version || SimpleSchema.version < 2) {
  SimpleSchema.messages({
    notUnique: '[label] must be unique'
  });
}
if (Meteor.isServer) {
  Collection2.on('schema.attached', function (collection, ss) {
    // Define validation error messages
    if (ss.version >= 2) {
      ss.messageBox.messages({
        notUnique: '{{label}} must be unique'
      });
    }
    function ensureIndex(index, indexName, unique, sparse) {
      Meteor.startup(function () {
        collection._collection._ensureIndex(index, {
          background: true,
          name: indexName,
          unique: unique,
          sparse: sparse
        });
      });
    }
    function dropIndex(indexName) {
      Meteor.startup(function () {
        try {
          collection._collection._dropIndex(indexName);
        } catch (err) {
          // no index with that name, which is what we want
        }
      });
    }
    const propName = ss.version === 2 ? 'mergedSchema' : 'schema';

    // Loop over fields definitions and ensure collection indexes (server side only)
    _.each(ss[propName](), function (definition, fieldName) {
      if ('index' in definition || definition.unique === true) {
        var index = {},
          indexValue;
        // If they specified `unique: true` but not `index`,
        // we assume `index: 1` to set up the unique index in mongo
        if ('index' in definition) {
          indexValue = definition.index;
          if (indexValue === true) indexValue = 1;
        } else {
          indexValue = 1;
        }
        var indexName = 'c2_' + fieldName;
        // In the index object, we want object array keys without the ".$" piece
        var idxFieldName = fieldName.replace(/\.\$\./g, ".");
        index[idxFieldName] = indexValue;
        var unique = !!definition.unique && (indexValue === 1 || indexValue === -1);
        var sparse = definition.sparse || false;

        // If unique and optional, force sparse to prevent errors
        if (!sparse && unique && definition.optional) sparse = true;
        if (indexValue === false) {
          dropIndex(indexName);
        } else {
          ensureIndex(index, indexName, unique, sparse);
        }
      }
    });
  });
}
///////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/aldeed:schema-index/lib/indexing.js");

/* Exports */
Package._define("aldeed:schema-index");

})();

//# sourceURL=meteor://💻app/packages/aldeed_schema-index.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYWxkZWVkOnNjaGVtYS1pbmRleC9saWIvaW5kZXhpbmcuanMiXSwibmFtZXMiOlsiU2ltcGxlU2NoZW1hIiwiZXh0ZW5kT3B0aW9ucyIsImluZGV4IiwiTWF0Y2giLCJPcHRpb25hbCIsIk9uZU9mIiwiTnVtYmVyIiwiU3RyaW5nIiwiQm9vbGVhbiIsInVuaXF1ZSIsInNwYXJzZSIsInZlcnNpb24iLCJtZXNzYWdlcyIsIm5vdFVuaXF1ZSIsIk1ldGVvciIsImlzU2VydmVyIiwiQ29sbGVjdGlvbjIiLCJvbiIsImNvbGxlY3Rpb24iLCJzcyIsIm1lc3NhZ2VCb3giLCJlbnN1cmVJbmRleCIsImluZGV4TmFtZSIsInN0YXJ0dXAiLCJfY29sbGVjdGlvbiIsIl9lbnN1cmVJbmRleCIsImJhY2tncm91bmQiLCJuYW1lIiwiZHJvcEluZGV4IiwiX2Ryb3BJbmRleCIsImVyciIsInByb3BOYW1lIiwiXyIsImVhY2giLCJkZWZpbml0aW9uIiwiZmllbGROYW1lIiwiaW5kZXhWYWx1ZSIsImlkeEZpZWxkTmFtZSIsInJlcGxhY2UiLCJvcHRpb25hbCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQ0FBLFlBQVksQ0FBQ0MsYUFBYSxDQUFDO0VBQ3pCQyxLQUFLLEVBQUVDLEtBQUssQ0FBQ0MsUUFBUSxDQUFDRCxLQUFLLENBQUNFLEtBQUssQ0FBQ0MsTUFBTSxFQUFFQyxNQUFNLEVBQUVDLE9BQU8sQ0FBQyxDQUFDO0VBQzNEQyxNQUFNLEVBQUVOLEtBQUssQ0FBQ0MsUUFBUSxDQUFDSSxPQUFPLENBQUM7RUFDL0JFLE1BQU0sRUFBRVAsS0FBSyxDQUFDQyxRQUFRLENBQUNJLE9BQU87QUFDaEMsQ0FBQyxDQUFDOztBQUVGO0FBQ0EsSUFBSSxDQUFDUixZQUFZLENBQUNXLE9BQU8sSUFBSVgsWUFBWSxDQUFDVyxPQUFPLEdBQUcsQ0FBQyxFQUFFO0VBQ3JEWCxZQUFZLENBQUNZ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Y2VzQ29udGVudCI6WyIvLyBFeHRlbmQgdGhlIHNjaGVtYSBvcHRpb25zIGFsbG93ZWQgYnkgU2ltcGxlU2NoZW1hXG5TaW1wbGVTY2hlbWEuZXh0ZW5kT3B0aW9ucyh7XG4gIGluZGV4OiBNYXRjaC5PcHRpb25hbChNYXRjaC5PbmVPZihOdW1iZXIsIFN0cmluZywgQm9vbGVhbikpLFxuICB1bmlxdWU6IE1hdGNoLk9wdGlvbmFsKEJvb2xlYW4pLFxuICBzcGFyc2U6IE1hdGNoLk9wdGlvbmFsKEJvb2xlYW4pLFxufSk7XG5cbi8vIERlZmluZSB2YWxpZGF0aW9uIGVycm9yIG1lc3NhZ2VzIChsZWdhY3kpXG5pZiAoIVNpbXBsZVNjaGVtYS52ZXJzaW9uIHx8IFNpbXBsZVNjaGVtYS52ZXJzaW9uIDwgMikge1xuICBTaW1wbGVTY2hlbWEubWVzc2FnZXMoe1xuICAgIG5vdFVuaXF1ZTogJ1tsYWJlbF0gbXVzdCBiZSB1bmlxdWUnLFxuICB9KTtcbn1cblxuaWYgKE1ldGVvci5pc1NlcnZlcikge1xuICBDb2xsZWN0aW9uMi5vbignc2NoZW1hLmF0dGFjaGVkJywgZnVuY3Rpb24gKGNvbGxlY3Rpb24sIHNzKSB7XG4gICAgLy8gRGVmaW5lIHZhbGlkYXRpb24gZXJyb3IgbWVzc2FnZXNcbiAgICBpZiAoc3MudmVyc2lvbiA+PSAyKSB7XG4gICAgICBzcy5tZXNzYWdlQm94Lm1lc3NhZ2VzKHtcbiAgICAgICAgbm90VW5pcXVlOiAne3tsYWJlbH19IG11c3QgYmUgdW5pcXVlJyxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGVuc3VyZUluZGV4KGluZGV4LCBpbmRleE5hbWUsIHVuaXF1ZSwgc3BhcnNlKSB7XG4gICAgICBNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbGxlY3Rpb24uX2NvbGxlY3Rpb24uX2Vuc3VyZUluZGV4KGluZGV4LCB7XG4gICAgICAgICAgYmFja2dyb3VuZDogdHJ1ZSxcbiAgICAgICAgICBuYW1lOiBpbmRleE5hbWUsXG4gICAgICAgICAgdW5pcXVlOiB1bmlxdWUsXG4gICAgICAgICAgc3BhcnNlOiBzcGFyc2VcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkcm9wSW5kZXgoaW5kZXhOYW1lKSB7XG4gICAgICBNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29sbGVjdGlvbi5fY29sbGVjdGlvbi5fZHJvcEluZGV4KGluZGV4TmFtZSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIC8vIG5vIGluZGV4IHdpdGggdGhhdCBuYW1lLCB3aGljaCBpcyB3aGF0IHdlIHdhbnRcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgcHJvcE5hbWUgPSBzcy52ZXJzaW9uID09PSAyID8gJ21lcmdlZFNjaGVtYScgOiAnc2NoZW1hJztcblxuICAgIC8vIExvb3Agb3ZlciBmaWVsZHMgZGVmaW5pdGlvbnMgYW5kIGVuc3VyZSBjb2xsZWN0aW9uIGluZGV4ZXMgKHNlcnZlciBzaWRlIG9ubHkpXG4gICAgXy5lYWNoKHNzW3Byb3BOYW1lXSgpLCBmdW5jdGlvbihkZWZpbml0aW9uLCBmaWVsZE5hbWUpIHtcbiAgICAgIGlmICgnaW5kZXgnIGluIGRlZmluaXRpb24gfHwgZGVmaW5pdGlvbi51bmlxdWUgPT09IHRydWUpIHtcbiAgICAgICAgdmFyIGluZGV4ID0ge30sIGluZGV4VmFsdWU7XG4gICAgICAgIC8vIElmIHRoZXkgc3BlY2lmaWVkIGB1bmlxdWU6IHRydWVgIGJ1dCBub3QgYGluZGV4YCxcbiAgICAgICAgLy8gd2UgYXNzdW1lIGBpbmRleDogMWAgdG8gc2V0IHVwIHRoZSB1bmlxdWUgaW5kZXggaW4gbW9uZ29cbiAgICAgICAgaWYgKCdpbmRleCcgaW4gZGVmaW5pdGlvbikge1xuICAgICAgICAgIGluZGV4VmFsdWUgPSBkZWZpbml0aW9uLmluZGV4O1xuICAgICAgICAgIGlmIChpbmRleFZhbHVlID09PSB0cnVlKSBpbmRleFZhbHVlID0gMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpbmRleFZhbHVlID0gMTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaW5kZXhOYW1lID0gJ2MyXycgKyBmaWVsZE5hbWU7XG4gICAgICAgIC8vIEluIHRoZSBpbmRleCBvYmplY3QsIHdlIHdhbnQgb2JqZWN0IGFycmF5IGtleXMgd2l0aG91dCB0aGUgXCIuJFwiIHBpZWNlXG4gICAgICAgIHZhciBpZHhGaWVsZE5hbWUgPSBmaWVsZE5hbWUucmVwbGFjZSgvXFwuXFwkXFwuL2csIFwiLlwiKTtcbiAgICAgICAgaW5kZXhbaWR4RmllbGROYW1lXSA9IGluZGV4VmFsdWU7XG4gICAgICAgIHZhciB1bmlxdWUgPSAhIWRlZmluaXRpb24udW5pcXVlICYmIChpbmRleFZhbHVlID09PSAxIHx8IGluZGV4VmFsdWUgPT09IC0xKTtcbiAgICAgICAgdmFyIHNwYXJzZSA9IGRlZmluaXRpb24uc3BhcnNlIHx8IGZhbHNlO1xuXG4gICAgICAgIC8vIElmIHVuaXF1ZSBhbmQgb3B0aW9uYWwsIGZvcmNlIHNwYXJzZSB0byBwcmV2ZW50IGVycm9yc1xuICAgICAgICBpZiAoIXNwYXJzZSAmJiB1bmlxdWUgJiYgZGVmaW5pdGlvbi5vcHRpb25hbCkgc3BhcnNlID0gdHJ1ZTtcblxuICAgICAgICBpZiAoaW5kZXhWYWx1ZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICBkcm9wSW5kZXgoaW5kZXhOYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbnN1cmVJbmRleChpbmRleCwgaW5kZXhOYW1lLCB1bmlxdWUsIHNwYXJzZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG59Il19
