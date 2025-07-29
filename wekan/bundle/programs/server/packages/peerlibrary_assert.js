(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;

/* Package-scope variables */
var assert;

(function(){

///////////////////////////////////////////////////////////////////////
//                                                                   //
// packages/peerlibrary_assert/server.js                             //
//                                                                   //
///////////////////////////////////////////////////////////////////////
                                                                     //
assert = Npm.require('assert');
///////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("peerlibrary:assert", {
  assert: assert
});

})();
