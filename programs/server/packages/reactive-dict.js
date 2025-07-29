(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var EJSON = Package.ejson.EJSON;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var value, ReactiveDict;

var require = meteorInstall({"node_modules":{"meteor":{"reactive-dict":{"migration.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/reactive-dict/migration.js                                                                           //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
module.export({
  ReactiveDict: () => ReactiveDict
});
let ReactiveDict;
module.link("./reactive-dict", {
  ReactiveDict(v) {
    ReactiveDict = v;
  }
}, 0);
const hasOwn = Object.prototype.hasOwnProperty;
ReactiveDict._migratedDictData = {}; // name -> data
ReactiveDict._dictsToMigrate = {}; // name -> ReactiveDict

ReactiveDict._loadMigratedDict = function (dictName) {
  if (hasOwn.call(ReactiveDict._migratedDictData, dictName)) {
    const data = ReactiveDict._migratedDictData[dictName];
    delete ReactiveDict._migratedDictData[dictName];
    return data;
  }
  return null;
};
ReactiveDict._registerDictForMigrate = function (dictName, dict) {
  if (hasOwn.call(ReactiveDict._dictsToMigrate, dictName)) throw new Error("Duplicate ReactiveDict name: " + dictName);
  ReactiveDict._dictsToMigrate[dictName] = dict;
};
if (Meteor.isClient && Package.reload) {
  // Put old migrated data into ReactiveDict._migratedDictData,
  // where it can be accessed by ReactiveDict._loadMigratedDict.
  var migrationData = Package.reload.Reload._migrationData('reactive-dict');
  if (migrationData && migrationData.dicts) ReactiveDict._migratedDictData = migrationData.dicts;

  // On migration, assemble the data from all the dicts that have been
  // registered.
  Package.reload.Reload._onMigrate('reactive-dict', function () {
    var dictsToMigrate = ReactiveDict._dictsToMigrate;
    var dataToMigrate = {};
    for (var dictName in dictsToMigrate) dataToMigrate[dictName] = dictsToMigrate[dictName]._getMigrationData();
    return [true, {
      dicts: dataToMigrate
    }];
  });
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"reactive-dict.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/reactive-dict/reactive-dict.js                                                                       //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
module.export({
  ReactiveDict: () => ReactiveDict
});
const hasOwn = Object.prototype.hasOwnProperty;

// XXX come up with a serialization method which canonicalizes object key
// order, which would allow us to use objects as values for equals.
function stringify(value) {
  if (value === undefined) {
    return 'undefined';
  }
  return EJSON.stringify(value);
}
function parse(serialized) {
  if (serialized === undefined || serialized === 'undefined') {
    return undefined;
  }
  return EJSON.parse(serialized);
}
function changed(v) {
  v && v.changed();
}

// XXX COMPAT WITH 0.9.1 : accept migrationData instead of dictName
/**
 * @class
 * @instanceName ReactiveDict
 * @summary Constructor for a ReactiveDict, which represents a reactive dictionary of key/value pairs.
 * @locus Client
 * @param {String} [name] Optional.  When a name is passed, preserves contents across Hot Code Pushes
 * @param {Object} [initialValue] Optional.  The default values for the dictionary
 */
class ReactiveDict {
  constructor(dictName, dictData) {
    // this.keys: key -> value
    this.keys = {};
    if (dictName) {
      // name given; migration will be performed
      if (typeof dictName === 'string') {
        // the normal case, argument is a string name.

        // Only run migration logic on client, it will cause
        // duplicate name errors on server during reloads.
        // _registerDictForMigrate will throw an error on duplicate name.
        Meteor.isClient && ReactiveDict._registerDictForMigrate(dictName, this);
        const migratedData = Meteor.isClient && ReactiveDict._loadMigratedDict(dictName);
        if (migratedData) {
          // Don't stringify migrated data
          this.keys = migratedData;
        } else {
          // Use _setObject to make sure values are stringified
          this._setObject(dictData || {});
        }
        this.name = dictName;
      } else if (typeof dictName === 'object') {
        // back-compat case: dictName is actually migrationData
        // Use _setObject to make sure values are stringified
        this._setObject(dictName);
      } else {
        throw new Error("Invalid ReactiveDict argument: " + dictName);
      }
    } else if (typeof dictData === 'object') {
      this._setObject(dictData);
    }
    this.allDeps = new Tracker.Dependency();
    this.keyDeps = {}; // key -> Dependency
    this.keyValueDeps = {}; // key -> Dependency
  }

  // set() began as a key/value method, but we are now overloading it
  // to take an object of key/value pairs, similar to backbone
  // http://backbonejs.org/#Model-set
  /**
   * @summary Set a value for a key in the ReactiveDict. Notify any listeners
   * that the value has changed (eg: redraw templates, and rerun any
   * [`Tracker.autorun`](#tracker_autorun) computations, that called
   * [`ReactiveDict.get`](#ReactiveDict_get) on this `key`.)
   * @locus Client
   * @param {String} key The key to set, eg, `selectedItem`
   * @param {EJSONable | undefined} value The new value for `key`
   */
  set(keyOrObject, value) {
    if (typeof keyOrObject === 'object' && value === undefined) {
      // Called as `dict.set({...})`
      this._setObject(keyOrObject);
      return;
    }
    // the input isn't an object, so it must be a key
    // and we resume with the rest of the function
    const key = keyOrObject;
    value = stringify(value);
    const keyExisted = hasOwn.call(this.keys, key);
    const oldSerializedValue = keyExisted ? this.keys[key] : 'undefined';
    const isNewValue = value !== oldSerializedValue;
    this.keys[key] = value;
    if (isNewValue || !keyExisted) {
      // Using the changed utility function here because this.allDeps might not exist yet,
      // when setting initial data from constructor
      changed(this.allDeps);
    }

    // Don't trigger changes when setting initial data from constructor,
    // this.KeyDeps is undefined in this case
    if (isNewValue && this.keyDeps) {
      changed(this.keyDeps[key]);
      if (this.keyValueDeps[key]) {
        changed(this.keyValueDeps[key][oldSerializedValue]);
        changed(this.keyValueDeps[key][value]);
      }
    }
  }

  /**
   * @summary Set a value for a key if it hasn't been set before.
   * Otherwise works exactly the same as [`ReactiveDict.set`](#ReactiveDict-set).
   * @locus Client
   * @param {String} key The key to set, eg, `selectedItem`
   * @param {EJSONable | undefined} value The new value for `key`
   */
  setDefault(keyOrObject, value) {
    if (typeof keyOrObject === 'object' && value === undefined) {
      // Called as `dict.setDefault({...})`
      this._setDefaultObject(keyOrObject);
      return;
    }
    // the input isn't an object, so it must be a key
    // and we resume with the rest of the function
    const key = keyOrObject;
    if (!hasOwn.call(this.keys, key)) {
      this.set(key, value);
    }
  }

  /**
   * @summary Get the value assiciated with a key. If inside a [reactive
   * computation](#reactivity), invalidate the computation the next time the
   * value associated with this key is changed by
   * [`ReactiveDict.set`](#ReactiveDict-set).
   * This returns a clone of the value, so if it's an object or an array,
   * mutating the returned value has no effect on the value stored in the
   * ReactiveDict.
   * @locus Client
   * @param {String} key The key of the element to return
   */
  get(key) {
    this._ensureKey(key);
    this.keyDeps[key].depend();
    return parse(this.keys[key]);
  }

  /**
   * @summary Test if the stored entry for a key is equal to a value. If inside a
   * [reactive computation](#reactivity), invalidate the computation the next
   * time the variable changes to or from the value.
   * @locus Client
   * @param {String} key The name of the session variable to test
   * @param {String | Number | Boolean | null | undefined} value The value to
   * test against
   */
  equals(key, value) {
    // Mongo.ObjectID is in the 'mongo' package
    let ObjectID = null;
    if (Package.mongo) {
      ObjectID = Package.mongo.Mongo.ObjectID;
    }
    // We don't allow objects (or arrays that might include objects) for
    // .equals, because JSON.stringify doesn't canonicalize object key
    // order. (We can make equals have the right return value by parsing the
    // current value and using EJSON.equals, but we won't have a canonical
    // element of keyValueDeps[key] to store the dependency.) You can still use
    // "EJSON.equals(reactiveDict.get(key), value)".
    //
    // XXX we could allow arrays as long as we recursively check that there
    // are no objects
    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean' && typeof value !== 'undefined' && !(value instanceof Date) && !(ObjectID && value instanceof ObjectID) && value !== null) {
      throw new Error("ReactiveDict.equals: value must be scalar");
    }
    const serializedValue = stringify(value);
    if (Tracker.active) {
      this._ensureKey(key);
      if (!hasOwn.call(this.keyValueDeps[key], serializedValue)) {
        this.keyValueDeps[key][serializedValue] = new Tracker.Dependency();
      }
      var isNew = this.keyValueDeps[key][serializedValue].depend();
      if (isNew) {
        Tracker.onInvalidate(() => {
          // clean up [key][serializedValue] if it's now empty, so we don't
          // use O(n) memory for n = values seen ever
          if (!this.keyValueDeps[key][serializedValue].hasDependents()) {
            delete this.keyValueDeps[key][serializedValue];
          }
        });
      }
    }
    let oldValue = undefined;
    if (hasOwn.call(this.keys, key)) {
      oldValue = parse(this.keys[key]);
    }
    return EJSON.equals(oldValue, value);
  }

  /**
   * @summary Get all key-value pairs as a plain object. If inside a [reactive
   * computation](#reactivity), invalidate the computation the next time the
   * value associated with any key is changed by
   * [`ReactiveDict.set`](#ReactiveDict-set).
   * This returns a clone of each value, so if it's an object or an array,
   * mutating the returned value has no effect on the value stored in the
   * ReactiveDict.
   * @locus Client
   */
  all() {
    this.allDeps.depend();
    let ret = {};
    Object.keys(this.keys).forEach(key => {
      ret[key] = parse(this.keys[key]);
    });
    return ret;
  }

  /**
   * @summary remove all key-value pairs from the ReactiveDict. Notify any
   * listeners that the value has changed (eg: redraw templates, and rerun any
   * [`Tracker.autorun`](#tracker_autorun) computations, that called
   * [`ReactiveDict.get`](#ReactiveDict_get) on this `key`.)
   * @locus Client
   */
  clear() {
    const oldKeys = this.keys;
    this.keys = {};
    this.allDeps.changed();
    Object.keys(oldKeys).forEach(key => {
      changed(this.keyDeps[key]);
      if (this.keyValueDeps[key]) {
        changed(this.keyValueDeps[key][oldKeys[key]]);
        changed(this.keyValueDeps[key]['undefined']);
      }
    });
  }

  /**
   * @summary remove a key-value pair from the ReactiveDict. Notify any listeners
   * that the value has changed (eg: redraw templates, and rerun any
   * [`Tracker.autorun`](#tracker_autorun) computations, that called
   * [`ReactiveDict.get`](#ReactiveDict_get) on this `key`.)
   * @locus Client
   * @param {String} key The key to delete, eg, `selectedItem`
   */
  delete(key) {
    let didRemove = false;
    if (hasOwn.call(this.keys, key)) {
      const oldValue = this.keys[key];
      delete this.keys[key];
      changed(this.keyDeps[key]);
      if (this.keyValueDeps[key]) {
        changed(this.keyValueDeps[key][oldValue]);
        changed(this.keyValueDeps[key]['undefined']);
      }
      this.allDeps.changed();
      didRemove = true;
    }
    return didRemove;
  }

  /**
   * @summary Clear all values from the reactiveDict and prevent it from being
   * migrated on a Hot Code Pushes. Notify any listeners
   * that the value has changed (eg: redraw templates, and rerun any
   * [`Tracker.autorun`](#tracker_autorun) computations, that called
   * [`ReactiveDict.get`](#ReactiveDict_get) on this `key`.)
   * @locus Client
   */
  destroy() {
    this.clear();
    if (this.name && hasOwn.call(ReactiveDict._dictsToMigrate, this.name)) {
      delete ReactiveDict._dictsToMigrate[this.name];
    }
  }
  _setObject(object) {
    Object.keys(object).forEach(key => {
      this.set(key, object[key]);
    });
  }
  _setDefaultObject(object) {
    Object.keys(object).forEach(key => {
      this.setDefault(key, object[key]);
    });
  }
  _ensureKey(key) {
    if (!(key in this.keyDeps)) {
      this.keyDeps[key] = new Tracker.Dependency();
      this.keyValueDeps[key] = {};
    }
  }

  // Get a JSON value that can be passed to the constructor to
  // create a new ReactiveDict with the same contents as this one
  _getMigrationData() {
    // XXX sanitize and make sure it's JSONible?
    return this.keys;
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/reactive-dict/migration.js");

/* Exports */
Package._define("reactive-dict", exports, {
  ReactiveDict: ReactiveDict
});

})();

//# sourceURL=meteor://💻app/packages/reactive-dict.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcmVhY3RpdmUtZGljdC9taWdyYXRpb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JlYWN0aXZlLWRpY3QvcmVhY3RpdmUtZGljdC5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJSZWFjdGl2ZURpY3QiLCJsaW5rIiwidiIsImhhc093biIsIk9iamVjdCIsInByb3RvdHlwZSIsImhhc093blByb3BlcnR5IiwiX21pZ3JhdGVkRGljdERhdGEiLCJfZGljdHNUb01pZ3JhdGUiLCJfbG9hZE1pZ3JhdGVkRGljdCIsImRpY3ROYW1lIiwiY2FsbCIsImRhdGEiLCJfcmVnaXN0ZXJEaWN0Rm9yTWlncmF0ZSIsImRpY3QiLCJFcnJvciIsIk1ldGVvciIsImlzQ2xpZW50IiwiUGFja2FnZSIsInJlbG9hZCIsIm1pZ3JhdGlvbkRhdGEiLCJSZWxvYWQiLCJfbWlncmF0aW9uRGF0YSIsImRpY3RzIiwiX29uTWlncmF0ZSIsImRpY3RzVG9NaWdyYXRlIiwiZGF0YVRvTWlncmF0ZSIsIl9nZXRNaWdyYXRpb25EYXRhIiwic3RyaW5naWZ5IiwidmFsdWUiLCJ1bmRlZmluZWQiLCJFSlNPTiIsInBhcnNlIiwic2VyaWFsaXplZCIsImNoYW5nZWQiLCJjb25zdHJ1Y3RvciIsImRpY3REYXRhIiwia2V5cyIsIm1pZ3JhdGVkRGF0YSIsIl9zZXRPYmplY3QiLCJuYW1lIiwiYWxsRGVwcyIsIlRyYWNrZXIiLCJEZXBlbmRlbmN5Iiwia2V5RGVwcyIsImtleVZhbHVlRGVwcyIsInNldCIsImtleU9yT2JqZWN0Iiwia2V5Iiwia2V5RXhpc3RlZCIsIm9sZFNlcmlhbGl6ZWRWYWx1ZSIsImlzTmV3VmFsdWUiLCJzZXREZWZhdWx0IiwiX3NldERlZmF1bHRPYmplY3QiLCJnZXQiLCJfZW5zdXJlS2V5IiwiZGVwZW5kIiwiZXF1YWxzIiwiT2JqZWN0SUQiLCJtb25nbyIsIk1vbmdvIiwiRGF0ZSIsInNlcmlhbGl6ZWRWYWx1ZSIsImFjdGl2ZSIsImlzTmV3Iiwib25JbnZhbGlkYXRlIiwiaGFzRGVwZW5kZW50cyIsIm9sZFZhbHVlIiwiYWxsIiwicmV0IiwiZm9yRWFjaCIsImNsZWFyIiwib2xkS2V5cyIsImRlbGV0ZSIsImRpZFJlbW92ZSIsImRlc3Ryb3kiLCJvYmplY3QiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxNQUFNLENBQUNDLE1BQU0sQ0FBQztFQUFDQyxZQUFZLEVBQUNBLENBQUEsS0FBSUE7QUFBWSxDQUFDLENBQUM7QUFBQyxJQUFJQSxZQUFZO0FBQUNGLE1BQU0sQ0FBQ0csSUFBSSxDQUFDLGlCQUFpQixFQUFDO0VBQUNELFlBQVlBLENBQUNFLENBQUMsRUFBQztJQUFDRixZQUFZLEdBQUNFLENBQUM7RUFBQTtBQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7QUFFbEksTUFBTUMsTUFBTSxHQUFHQyxNQUFNLENBQUNDLFNBQVMsQ0FBQ0MsY0FBYztBQUU5Q04sWUFBWSxDQUFDTyxpQkFBaUIsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3JDUCxZQUFZLENBQUNRLGVBQWUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDOztBQUVuQ1IsWUFBWSxDQUFDUyxpQkFBaUIsR0FBRyxVQUFVQyxRQUFRLEVBQUU7RUFDbkQsSUFBSVAsTUFBTSxDQUFDUSxJQUFJLENBQUNYLFlBQVksQ0FBQ08saUJBQWlCLEVBQUVHLFFBQVEsQ0FBQyxFQUFFO0lBQ3pELE1BQU1FLElBQUksR0FBR1osWUFBWSxDQUFDTyxpQkFBaUIsQ0FBQ0csUUFBUSxDQUFDO0lBQ3JELE9BQU9WLFlBQVksQ0FBQ08saUJBQWlCLENBQUNHLFFBQVEsQ0FBQztJQUMvQyxPQUFPRSxJQUFJO0VBQ2I7RUFFQSxPQUFPLElBQUk7QUFDYixDQUFDO0FBRURaLFlBQVksQ0FBQ2EsdUJBQXVCLEdBQUcsVUFBVUgsUUFBUSxFQUFFSSxJQUFJLEVBQUU7RUFDL0QsSUFBSVgsTUFBTSxDQUFDUSxJQUFJLENBQUNYLFlB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LENBQUN1QyxNQUFNLENBQUMsQ0FBQ04sT0FBTyxDQUFDdEIsR0FBRyxJQUFJO01BQ2pDLElBQUksQ0FBQ0ksVUFBVSxDQUFDSixHQUFHLEVBQUU0QixNQUFNLENBQUM1QixHQUFHLENBQUMsQ0FBQztJQUNuQyxDQUFDLENBQUM7RUFDSjtFQUVBTyxVQUFVQSxDQUFDUCxHQUFHLEVBQUU7SUFDZCxJQUFJLEVBQUVBLEdBQUcsSUFBSSxJQUFJLENBQUNKLE9BQU8sQ0FBQyxFQUFFO01BQzFCLElBQUksQ0FBQ0EsT0FBTyxDQUFDSSxHQUFHLENBQUMsR0FBRyxJQUFJTixPQUFPLENBQUNDLFVBQVUsQ0FBRCxDQUFDO01BQzFDLElBQUksQ0FBQ0UsWUFBWSxDQUFDRyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDN0I7RUFDRjs7RUFFQTtFQUNBO0VBQ0FyQixpQkFBaUJBLENBQUEsRUFBRztJQUNsQjtJQUNBLE9BQU8sSUFBSSxDQUFDVSxJQUFJO0VBQ2xCO0FBQ0YsQyIsImZpbGUiOiIvcGFja2FnZXMvcmVhY3RpdmUtZGljdC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFJlYWN0aXZlRGljdCB9IGZyb20gJy4vcmVhY3RpdmUtZGljdCc7XG5cbmNvbnN0IGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cblJlYWN0aXZlRGljdC5fbWlncmF0ZWREaWN0RGF0YSA9IHt9OyAvLyBuYW1lIC0+IGRhdGFcblJlYWN0aXZlRGljdC5fZGljdHNUb01pZ3JhdGUgPSB7fTsgLy8gbmFtZSAtPiBSZWFjdGl2ZURpY3RcblxuUmVhY3RpdmVEaWN0Ll9sb2FkTWlncmF0ZWREaWN0ID0gZnVuY3Rpb24gKGRpY3ROYW1lKSB7XG4gIGlmIChoYXNPd24uY2FsbChSZWFjdGl2ZURpY3QuX21pZ3JhdGVkRGljdERhdGEsIGRpY3ROYW1lKSkge1xuICAgIGNvbnN0IGRhdGEgPSBSZWFjdGl2ZURpY3QuX21pZ3JhdGVkRGljdERhdGFbZGljdE5hbWVdO1xuICAgIGRlbGV0ZSBSZWFjdGl2ZURpY3QuX21pZ3JhdGVkRGljdERhdGFbZGljdE5hbWVdO1xuICAgIHJldHVybiBkYXRhO1xuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59O1xuXG5SZWFjdGl2ZURpY3QuX3JlZ2lzdGVyRGljdEZvck1pZ3JhdGUgPSBmdW5jdGlvbiAoZGljdE5hbWUsIGRpY3QpIHtcbiAgaWYgKGhhc093bi5jYWxsKFJlYWN0aXZlRGljdC5fZGljdHNUb01pZ3JhdGUsIGRpY3ROYW1lKSlcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJEdXBsaWNhdGUgUmVhY3RpdmVEaWN0IG5hbWU6IFwiICsgZGljdE5hbWUpO1xuXG4gIFJlYWN0aXZlRGljdC5fZGljdHNUb01pZ3JhdGVbZGljdE5hbWVdID0gZGljdDtcbn07XG5cbmlmIChNZXRlb3IuaXNDbGllbnQgJiYgUGFja2FnZS5yZWxvYWQpIHtcbiAgLy8gUHV0IG9sZCBtaWdyYXRlZCBkYXRhIGludG8gUmVhY3RpdmVEaWN0Ll9taWdyYXRlZERpY3REYXRhLFxuICAvLyB3aGVyZSBpdCBjYW4gYmUgYWNjZXNzZWQgYnkgUmVhY3RpdmVEaWN0Ll9sb2FkTWlncmF0ZWREaWN0LlxuICB2YXIgbWlncmF0aW9uRGF0YSA9IFBhY2thZ2UucmVsb2FkLlJlbG9hZC5fbWlncmF0aW9uRGF0YSgncmVhY3RpdmUtZGljdCcpO1xuICBpZiAobWlncmF0aW9uRGF0YSAmJiBtaWdyYXRpb25EYXRhLmRpY3RzKVxuICAgIFJlYWN0aXZlRGljdC5fbWlncmF0ZWREaWN0RGF0YSA9IG1pZ3JhdGlvbkRhdGEuZGljdHM7XG5cbiAgLy8gT24gbWlncmF0aW9uLCBhc3NlbWJsZSB0aGUgZGF0YSBmcm9tIGFsbCB0aGUgZGljdHMgdGhhdCBoYXZlIGJlZW5cbiAgLy8gcmVnaXN0ZXJlZC5cbiAgUGFja2FnZS5yZWxvYWQuUmVsb2FkLl9vbk1pZ3JhdGUoJ3JlYWN0aXZlLWRpY3QnLCBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGRpY3RzVG9NaWdyYXRlID0gUmVhY3RpdmVEaWN0Ll9kaWN0c1RvTWlncmF0ZTtcbiAgICB2YXIgZGF0YVRvTWlncmF0ZSA9IHt9O1xuXG4gICAgZm9yICh2YXIgZGljdE5hbWUgaW4gZGljdHNUb01pZ3JhdGUpXG4gICAgICBkYXRhVG9NaWdyYXRlW2RpY3ROYW1lXSA9IGRpY3RzVG9NaWdyYXRlW2RpY3ROYW1lXS5fZ2V0TWlncmF0aW9uRGF0YSgpO1xuXG4gICAgcmV0dXJuIFt0cnVlLCB7ZGljdHM6IGRhdGFUb01pZ3JhdGV9XTtcbiAgfSk7XG59XG5cbmV4cG9ydCB7IFJlYWN0aXZlRGljdCB9O1xuIiwiY29uc3QgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLy8gWFhYIGNvbWUgdXAgd2l0aCBhIHNlcmlhbGl6YXRpb24gbWV0aG9kIHdoaWNoIGNhbm9uaWNhbGl6ZXMgb2JqZWN0IGtleVxuLy8gb3JkZXIsIHdoaWNoIHdvdWxkIGFsbG93IHVzIHRvIHVzZSBvYmplY3RzIGFzIHZhbHVlcyBmb3IgZXF1YWxzLlxuZnVuY3Rpb24gc3RyaW5naWZ5KHZhbHVlKSB7XG4gIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuICd1bmRlZmluZWQnO1xuICB9XG4gIHJldHVybiBFSlNPTi5zdHJpbmdpZnkodmFsdWUpO1xufVxuXG5mdW5jdGlvbiBwYXJzZShzZXJpYWxpemVkKSB7XG4gIGlmIChzZXJpYWxpemVkID09PSB1bmRlZmluZWQgfHwgc2VyaWFsaXplZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG4gIHJldHVybiBFSlNPTi5wYXJzZShzZXJpYWxpemVkKTtcbn1cblxuZnVuY3Rpb24gY2hhbmdlZCh2KSB7XG4gIHYgJiYgdi5jaGFuZ2VkKCk7XG59XG5cbi8vIFhYWCBDT01QQVQgV0lUSCAwLjkuMSA6IGFjY2VwdCBtaWdyYXRpb25EYXRhIGluc3RlYWQgb2YgZGljdE5hbWVcbi8qKlxuICogQGNsYXNzXG4gKiBAaW5zdGFuY2VOYW1lIFJlYWN0aXZlRGljdFxuICogQHN1bW1hcnkgQ29uc3RydWN0b3IgZm9yIGEgUmVhY3RpdmVEaWN0LCB3aGljaCByZXByZXNlbnRzIGEgcmVhY3RpdmUgZGljdGlvbmFyeSBvZiBrZXkvdmFsdWUgcGFpcnMuXG4gKiBAbG9jdXMgQ2xpZW50XG4gKiBAcGFyYW0ge1N0cmluZ30gW25hbWVdIE9wdGlvbmFsLiAgV2hlbiBhIG5hbWUgaXMgcGFzc2VkLCBwcmVzZXJ2ZXMgY29udGVudHMgYWNyb3NzIEhvdCBDb2RlIFB1c2hlc1xuICogQHBhcmFtIHtPYmplY3R9IFtpbml0aWFsVmFsdWVdIE9wdGlvbmFsLiAgVGhlIGRlZmF1bHQgdmFsdWVzIGZvciB0aGUgZGljdGlvbmFyeVxuICovXG5leHBvcnQgY2xhc3MgUmVhY3RpdmVEaWN0IHtcbiAgY29uc3RydWN0b3IoZGljdE5hbWUsIGRpY3REYXRhKSB7XG4gICAgLy8gdGhpcy5rZXlzOiBrZXkgLT4gdmFsdWVcbiAgICB0aGlzLmtleXMgPSB7fTtcblxuICAgIGlmIChkaWN0TmFtZSkge1xuICAgICAgLy8gbmFtZSBnaXZlbjsgbWlncmF0aW9uIHdpbGwgYmUgcGVyZm9ybWVkXG4gICAgICBpZiAodHlwZW9mIGRpY3ROYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICAvLyB0aGUgbm9ybWFsIGNhc2UsIGFyZ3VtZW50IGlzIGEgc3RyaW5nIG5hbWUuXG5cbiAgICAgICAgLy8gT25seSBydW4gbWlncmF0aW9uIGxvZ2ljIG9uIGNsaWVudCwgaXQgd2lsbCBjYXVzZVxuICAgICAgICAvLyBkdXBsaWNhdGUgbmFtZSBlcnJvcnMgb24gc2VydmVyIGR1cmluZyByZWxvYWRzLlxuICAgICAgICAvLyBfcmVnaXN0ZXJEaWN0Rm9yTWlncmF0ZSB3aWxsIHRocm93IGFuIGVycm9yIG9uIGR1cGxpY2F0ZSBuYW1lLlxuICAgICAgICBNZXRlb3IuaXNDbGllbnQgJiYgUmVhY3RpdmVEaWN0Ll9yZWdpc3RlckRpY3RGb3JNaWdyYXRlKGRpY3ROYW1lLCB0aGlzKTtcbiAgICAgICAgY29uc3QgbWlncmF0ZWREYXRhID0gTWV0ZW9yLmlzQ2xpZW50ICYmIFJlYWN0aXZlRGljdC5fbG9hZE1pZ3JhdGVkRGljdChkaWN0TmFtZSk7XG5cbiAgICAgICAgaWYgKG1pZ3JhdGVkRGF0YSkge1xuICAgICAgICAgIC8vIERvbid0IHN0cmluZ2lmeSBtaWdyYXRlZCBkYXRhXG4gICAgICAgICAgdGhpcy5rZXlzID0gbWlncmF0ZWREYXRhO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIFVzZSBfc2V0T2JqZWN0IHRvIG1ha2Ugc3VyZSB2YWx1ZXMgYXJlIHN0cmluZ2lmaWVkXG4gICAgICAgICAgdGhpcy5fc2V0T2JqZWN0KGRpY3REYXRhIHx8IHt9KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm5hbWUgPSBkaWN0TmFtZTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGRpY3ROYW1lID09PSAnb2JqZWN0Jykge1xuICAgICAgICAvLyBiYWNrLWNvbXBhdCBjYXNlOiBkaWN0TmFtZSBpcyBhY3R1YWxseSBtaWdyYXRpb25EYXRhXG4gICAgICAgIC8vIFVzZSBfc2V0T2JqZWN0IHRvIG1ha2Ugc3VyZSB2YWx1ZXMgYXJlIHN0cmluZ2lmaWVkXG4gICAgICAgIHRoaXMuX3NldE9iamVjdChkaWN0TmFtZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIFJlYWN0aXZlRGljdCBhcmd1bWVudDogXCIgKyBkaWN0TmFtZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZGljdERhdGEgPT09ICdvYmplY3QnKSB7XG4gICAgICB0aGlzLl9zZXRPYmplY3QoZGljdERhdGEpO1xuICAgIH1cblxuICAgIHRoaXMuYWxsRGVwcyA9IG5ldyBUcmFja2VyLkRlcGVuZGVuY3k7XG4gICAgdGhpcy5rZXlEZXBzID0ge307IC8vIGtleSAtPiBEZXBlbmRlbmN5XG4gICAgdGhpcy5rZXlWYWx1ZURlcHMgPSB7fTsgLy8ga2V5IC0+IERlcGVuZGVuY3lcbiAgfVxuXG4gIC8vIHNldCgpIGJlZ2FuIGFzIGEga2V5L3ZhbHVlIG1ldGhvZCwgYnV0IHdlIGFyZSBub3cgb3ZlcmxvYWRpbmcgaXRcbiAgLy8gdG8gdGFrZSBhbiBvYmplY3Qgb2Yga2V5L3ZhbHVlIHBhaXJzLCBzaW1pbGFyIHRvIGJhY2tib25lXG4gIC8vIGh0dHA6Ly9iYWNrYm9uZWpzLm9yZy8jTW9kZWwtc2V0XG4gIC8qKlxuICAgKiBAc3VtbWFyeSBTZXQgYSB2YWx1ZSBmb3IgYSBrZXkgaW4gdGhlIFJlYWN0aXZlRGljdC4gTm90aWZ5IGFueSBsaXN0ZW5lcnNcbiAgICogdGhhdCB0aGUgdmFsdWUgaGFzIGNoYW5nZWQgKGVnOiByZWRyYXcgdGVtcGxhdGVzLCBhbmQgcmVydW4gYW55XG4gICAqIFtgVHJhY2tlci5hdXRvcnVuYF0oI3RyYWNrZXJfYXV0b3J1bikgY29tcHV0YXRpb25zLCB0aGF0IGNhbGxlZFxuICAgKiBbYFJlYWN0aXZlRGljdC5nZXRgXSgjUmVhY3RpdmVEaWN0X2dldCkgb24gdGhpcyBga2V5YC4pXG4gICAqIEBsb2N1cyBDbGllbnRcbiAgICogQHBhcmFtIHtTdHJpbmd9IGtleSBUaGUga2V5IHRvIHNldCwgZWcsIGBzZWxlY3RlZEl0ZW1gXG4gICAqIEBwYXJhbSB7RUpTT05hYmxlIHwgdW5kZWZpbmVkfSB2YWx1ZSBUaGUgbmV3IHZhbHVlIGZvciBga2V5YFxuICAgKi9cbiAgc2V0KGtleU9yT2JqZWN0LCB2YWx1ZSkge1xuICAgIGlmICgodHlwZW9mIGtleU9yT2JqZWN0ID09PSAnb2JqZWN0JykgJiYgKHZhbHVlID09PSB1bmRlZmluZWQpKSB7XG4gICAgICAvLyBDYWxsZWQgYXMgYGRpY3Quc2V0KHsuLi59KWBcbiAgICAgIHRoaXMuX3NldE9iamVjdChrZXlPck9iamVjdCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIHRoZSBpbnB1dCBpc24ndCBhbiBvYmplY3QsIHNvIGl0IG11c3QgYmUgYSBrZXlcbiAgICAvLyBhbmQgd2UgcmVzdW1lIHdpdGggdGhlIHJlc3Qgb2YgdGhlIGZ1bmN0aW9uXG4gICAgY29uc3Qga2V5ID0ga2V5T3JPYmplY3Q7XG5cbiAgICB2YWx1ZSA9IHN0cmluZ2lmeSh2YWx1ZSk7XG5cbiAgICBjb25zdCBrZXlFeGlzdGVkID0gaGFzT3duLmNhbGwodGhpcy5rZXlzLCBrZXkpO1xuICAgIGNvbnN0IG9sZFNlcmlhbGl6ZWRWYWx1ZSA9IGtleUV4aXN0ZWQgPyB0aGlzLmtleXNba2V5XSA6ICd1bmRlZmluZWQnO1xuICAgIGNvbnN0IGlzTmV3VmFsdWUgPSAodmFsdWUgIT09IG9sZFNlcmlhbGl6ZWRWYWx1ZSk7XG5cbiAgICB0aGlzLmtleXNba2V5XSA9IHZhbHVlO1xuXG4gICAgaWYgKGlzTmV3VmFsdWUgfHwgIWtleUV4aXN0ZWQpIHtcbiAgICAgIC8vIFVzaW5nIHRoZSBjaGFuZ2VkIHV0aWxpdHkgZnVuY3Rpb24gaGVyZSBiZWNhdXNlIHRoaXMuYWxsRGVwcyBtaWdodCBub3QgZXhpc3QgeWV0LFxuICAgICAgLy8gd2hlbiBzZXR0aW5nIGluaXRpYWwgZGF0YSBmcm9tIGNvbnN0cnVjdG9yXG4gICAgICBjaGFuZ2VkKHRoaXMuYWxsRGVwcyk7XG4gICAgfVxuXG4gICAgLy8gRG9uJ3QgdHJpZ2dlciBjaGFuZ2VzIHdoZW4gc2V0dGluZyBpbml0aWFsIGRhdGEgZnJvbSBjb25zdHJ1Y3RvcixcbiAgICAvLyB0aGlzLktleURlcHMgaXMgdW5kZWZpbmVkIGluIHRoaXMgY2FzZVxuICAgIGlmIChpc05ld1ZhbHVlICYmIHRoaXMua2V5RGVwcykge1xuICAgICAgY2hhbmdlZCh0aGlzLmtleURlcHNba2V5XSk7XG4gICAgICBpZiAodGhpcy5rZXlWYWx1ZURlcHNba2V5XSkge1xuICAgICAgICBjaGFuZ2VkKHRoaXMua2V5VmFsdWVEZXBzW2tleV1bb2xkU2VyaWFsaXplZFZhbHVlXSk7XG4gICAgICAgIGNoYW5nZWQodGhpcy5rZXlWYWx1ZURlcHNba2V5XVt2YWx1ZV0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBTZXQgYSB2YWx1ZSBmb3IgYSBrZXkgaWYgaXQgaGFzbid0IGJlZW4gc2V0IGJlZm9yZS5cbiAgICogT3RoZXJ3aXNlIHdvcmtzIGV4YWN0bHkgdGhlIHNhbWUgYXMgW2BSZWFjdGl2ZURpY3Quc2V0YF0oI1JlYWN0aXZlRGljdC1zZXQpLlxuICAgKiBAbG9jdXMgQ2xpZW50XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBrZXkgVGhlIGtleSB0byBzZXQsIGVnLCBgc2VsZWN0ZWRJdGVtYFxuICAgKiBAcGFyYW0ge0VKU09OYWJsZSB8IHVuZGVmaW5lZH0gdmFsdWUgVGhlIG5ldyB2YWx1ZSBmb3IgYGtleWBcbiAgICovXG4gIHNldERlZmF1bHQoa2V5T3JPYmplY3QsIHZhbHVlKSB7XG4gICAgaWYgKCh0eXBlb2Yga2V5T3JPYmplY3QgPT09ICdvYmplY3QnKSAmJiAodmFsdWUgPT09IHVuZGVmaW5lZCkpIHtcbiAgICAgIC8vIENhbGxlZCBhcyBgZGljdC5zZXREZWZhdWx0KHsuLi59KWBcbiAgICAgIHRoaXMuX3NldERlZmF1bHRPYmplY3Qoa2V5T3JPYmplY3QpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyB0aGUgaW5wdXQgaXNuJ3QgYW4gb2JqZWN0LCBzbyBpdCBtdXN0IGJlIGEga2V5XG4gICAgLy8gYW5kIHdlIHJlc3VtZSB3aXRoIHRoZSByZXN0IG9mIHRoZSBmdW5jdGlvblxuICAgIGNvbnN0IGtleSA9IGtleU9yT2JqZWN0O1xuXG4gICAgaWYgKCEgaGFzT3duLmNhbGwodGhpcy5rZXlzLCBrZXkpKSB7XG4gICAgICB0aGlzLnNldChrZXksIHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHN1bW1hcnkgR2V0IHRoZSB2YWx1ZSBhc3NpY2lhdGVkIHdpdGggYSBrZXkuIElmIGluc2lkZSBhIFtyZWFjdGl2ZVxuICAgKiBjb21wdXRhdGlvbl0oI3JlYWN0aXZpdHkpLCBpbnZhbGlkYXRlIHRoZSBjb21wdXRhdGlvbiB0aGUgbmV4dCB0aW1lIHRoZVxuICAgKiB2YWx1ZSBhc3NvY2lhdGVkIHdpdGggdGhpcyBrZXkgaXMgY2hhbmdlZCBieVxuICAgKiBbYFJlYWN0aXZlRGljdC5zZXRgXSgjUmVhY3RpdmVEaWN0LXNldCkuXG4gICAqIFRoaXMgcmV0dXJucyBhIGNsb25lIG9mIHRoZSB2YWx1ZSwgc28gaWYgaXQncyBhbiBvYmplY3Qgb3IgYW4gYXJyYXksXG4gICAqIG11dGF0aW5nIHRoZSByZXR1cm5lZCB2YWx1ZSBoYXMgbm8gZWZmZWN0IG9uIHRoZSB2YWx1ZSBzdG9yZWQgaW4gdGhlXG4gICAqIFJlYWN0aXZlRGljdC5cbiAgICogQGxvY3VzIENsaWVudFxuICAgKiBAcGFyYW0ge1N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIGVsZW1lbnQgdG8gcmV0dXJuXG4gICAqL1xuICBnZXQoa2V5KSB7XG4gICAgdGhpcy5fZW5zdXJlS2V5KGtleSk7XG4gICAgdGhpcy5rZXlEZXBzW2tleV0uZGVwZW5kKCk7XG4gICAgcmV0dXJuIHBhcnNlKHRoaXMua2V5c1trZXldKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBUZXN0IGlmIHRoZSBzdG9yZWQgZW50cnkgZm9yIGEga2V5IGlzIGVxdWFsIHRvIGEgdmFsdWUuIElmIGluc2lkZSBhXG4gICAqIFtyZWFjdGl2ZSBjb21wdXRhdGlvbl0oI3JlYWN0aXZpdHkpLCBpbnZhbGlkYXRlIHRoZSBjb21wdXRhdGlvbiB0aGUgbmV4dFxuICAgKiB0aW1lIHRoZSB2YXJpYWJsZSBjaGFuZ2VzIHRvIG9yIGZyb20gdGhlIHZhbHVlLlxuICAgKiBAbG9jdXMgQ2xpZW50XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBrZXkgVGhlIG5hbWUgb2YgdGhlIHNlc3Npb24gdmFyaWFibGUgdG8gdGVzdFxuICAgKiBAcGFyYW0ge1N0cmluZyB8IE51bWJlciB8IEJvb2xlYW4gfCBudWxsIHwgdW5kZWZpbmVkfSB2YWx1ZSBUaGUgdmFsdWUgdG9cbiAgICogdGVzdCBhZ2FpbnN0XG4gICAqL1xuICBlcXVhbHMoa2V5LCB2YWx1ZSkge1xuICAgIC8vIE1vbmdvLk9iamVjdElEIGlzIGluIHRoZSAnbW9uZ28nIHBhY2thZ2VcbiAgICBsZXQgT2JqZWN0SUQgPSBudWxsO1xuICAgIGlmIChQYWNrYWdlLm1vbmdvKSB7XG4gICAgICBPYmplY3RJRCA9IFBhY2thZ2UubW9uZ28uTW9uZ28uT2JqZWN0SUQ7XG4gICAgfVxuICAgIC8vIFdlIGRvbid0IGFsbG93IG9iamVjdHMgKG9yIGFycmF5cyB0aGF0IG1pZ2h0IGluY2x1ZGUgb2JqZWN0cykgZm9yXG4gICAgLy8gLmVxdWFscywgYmVjYXVzZSBKU09OLnN0cmluZ2lmeSBkb2Vzbid0IGNhbm9uaWNhbGl6ZSBvYmplY3Qga2V5XG4gICAgLy8gb3JkZXIuIChXZSBjYW4gbWFrZSBlcXVhbHMgaGF2ZSB0aGUgcmlnaHQgcmV0dXJuIHZhbHVlIGJ5IHBhcnNpbmcgdGhlXG4gICAgLy8gY3VycmVudCB2YWx1ZSBhbmQgdXNpbmcgRUpTT04uZXF1YWxzLCBidXQgd2Ugd29uJ3QgaGF2ZSBhIGNhbm9uaWNhbFxuICAgIC8vIGVsZW1lbnQgb2Yga2V5VmFsdWVEZXBzW2tleV0gdG8gc3RvcmUgdGhlIGRlcGVuZGVuY3kuKSBZb3UgY2FuIHN0aWxsIHVzZVxuICAgIC8vIFwiRUpTT04uZXF1YWxzKHJlYWN0aXZlRGljdC5nZXQoa2V5KSwgdmFsdWUpXCIuXG4gICAgLy9cbiAgICAvLyBYWFggd2UgY291bGQgYWxsb3cgYXJyYXlzIGFzIGxvbmcgYXMgd2UgcmVjdXJzaXZlbHkgY2hlY2sgdGhhdCB0aGVyZVxuICAgIC8vIGFyZSBubyBvYmplY3RzXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycgJiZcbiAgICAgICAgdHlwZW9mIHZhbHVlICE9PSAnbnVtYmVyJyAmJlxuICAgICAgICB0eXBlb2YgdmFsdWUgIT09ICdib29sZWFuJyAmJlxuICAgICAgICB0eXBlb2YgdmFsdWUgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgICEodmFsdWUgaW5zdGFuY2VvZiBEYXRlKSAmJlxuICAgICAgICAhKE9iamVjdElEICYmIHZhbHVlIGluc3RhbmNlb2YgT2JqZWN0SUQpICYmXG4gICAgICAgIHZhbHVlICE9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJSZWFjdGl2ZURpY3QuZXF1YWxzOiB2YWx1ZSBtdXN0IGJlIHNjYWxhclwiKTtcbiAgICB9XG4gICAgY29uc3Qgc2VyaWFsaXplZFZhbHVlID0gc3RyaW5naWZ5KHZhbHVlKTtcblxuICAgIGlmIChUcmFja2VyLmFjdGl2ZSkge1xuICAgICAgdGhpcy5fZW5zdXJlS2V5KGtleSk7XG5cbiAgICAgIGlmICghIGhhc093bi5jYWxsKHRoaXMua2V5VmFsdWVEZXBzW2tleV0sIHNlcmlhbGl6ZWRWYWx1ZSkpIHtcbiAgICAgICAgdGhpcy5rZXlWYWx1ZURlcHNba2V5XVtzZXJpYWxpemVkVmFsdWVdID0gbmV3IFRyYWNrZXIuRGVwZW5kZW5jeTtcbiAgICAgIH1cblxuICAgICAgdmFyIGlzTmV3ID0gdGhpcy5rZXlWYWx1ZURlcHNba2V5XVtzZXJpYWxpemVkVmFsdWVdLmRlcGVuZCgpO1xuICAgICAgaWYgKGlzTmV3KSB7XG4gICAgICAgIFRyYWNrZXIub25JbnZhbGlkYXRlKCgpID0+IHtcbiAgICAgICAgICAvLyBjbGVhbiB1cCBba2V5XVtzZXJpYWxpemVkVmFsdWVdIGlmIGl0J3Mgbm93IGVtcHR5LCBzbyB3ZSBkb24ndFxuICAgICAgICAgIC8vIHVzZSBPKG4pIG1lbW9yeSBmb3IgbiA9IHZhbHVlcyBzZWVuIGV2ZXJcbiAgICAgICAgICBpZiAoISB0aGlzLmtleVZhbHVlRGVwc1trZXldW3NlcmlhbGl6ZWRWYWx1ZV0uaGFzRGVwZW5kZW50cygpKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5rZXlWYWx1ZURlcHNba2V5XVtzZXJpYWxpemVkVmFsdWVdO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IG9sZFZhbHVlID0gdW5kZWZpbmVkO1xuICAgIGlmIChoYXNPd24uY2FsbCh0aGlzLmtleXMsIGtleSkpIHtcbiAgICAgIG9sZFZhbHVlID0gcGFyc2UodGhpcy5rZXlzW2tleV0pO1xuICAgIH1cbiAgICByZXR1cm4gRUpTT04uZXF1YWxzKG9sZFZhbHVlLCB2YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogQHN1bW1hcnkgR2V0IGFsbCBrZXktdmFsdWUgcGFpcnMgYXMgYSBwbGFpbiBvYmplY3QuIElmIGluc2lkZSBhIFtyZWFjdGl2ZVxuICAgKiBjb21wdXRhdGlvbl0oI3JlYWN0aXZpdHkpLCBpbnZhbGlkYXRlIHRoZSBjb21wdXRhdGlvbiB0aGUgbmV4dCB0aW1lIHRoZVxuICAgKiB2YWx1ZSBhc3NvY2lhdGVkIHdpdGggYW55IGtleSBpcyBjaGFuZ2VkIGJ5XG4gICAqIFtgUmVhY3RpdmVEaWN0LnNldGBdKCNSZWFjdGl2ZURpY3Qtc2V0KS5cbiAgICogVGhpcyByZXR1cm5zIGEgY2xvbmUgb2YgZWFjaCB2YWx1ZSwgc28gaWYgaXQncyBhbiBvYmplY3Qgb3IgYW4gYXJyYXksXG4gICAqIG11dGF0aW5nIHRoZSByZXR1cm5lZCB2YWx1ZSBoYXMgbm8gZWZmZWN0IG9uIHRoZSB2YWx1ZSBzdG9yZWQgaW4gdGhlXG4gICAqIFJlYWN0aXZlRGljdC5cbiAgICogQGxvY3VzIENsaWVudFxuICAgKi9cbiAgYWxsKCkge1xuICAgIHRoaXMuYWxsRGVwcy5kZXBlbmQoKTtcbiAgICBsZXQgcmV0ID0ge307XG4gICAgT2JqZWN0LmtleXModGhpcy5rZXlzKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICByZXRba2V5XSA9IHBhcnNlKHRoaXMua2V5c1trZXldKTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IHJlbW92ZSBhbGwga2V5LXZhbHVlIHBhaXJzIGZyb20gdGhlIFJlYWN0aXZlRGljdC4gTm90aWZ5IGFueVxuICAgKiBsaXN0ZW5lcnMgdGhhdCB0aGUgdmFsdWUgaGFzIGNoYW5nZWQgKGVnOiByZWRyYXcgdGVtcGxhdGVzLCBhbmQgcmVydW4gYW55XG4gICAqIFtgVHJhY2tlci5hdXRvcnVuYF0oI3RyYWNrZXJfYXV0b3J1bikgY29tcHV0YXRpb25zLCB0aGF0IGNhbGxlZFxuICAgKiBbYFJlYWN0aXZlRGljdC5nZXRgXSgjUmVhY3RpdmVEaWN0X2dldCkgb24gdGhpcyBga2V5YC4pXG4gICAqIEBsb2N1cyBDbGllbnRcbiAgICovXG4gIGNsZWFyKCkge1xuICAgIGNvbnN0IG9sZEtleXMgPSB0aGlzLmtleXM7XG4gICAgdGhpcy5rZXlzID0ge307XG5cbiAgICB0aGlzLmFsbERlcHMuY2hhbmdlZCgpO1xuXG4gICAgT2JqZWN0LmtleXMob2xkS2V5cykuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgY2hhbmdlZCh0aGlzLmtleURlcHNba2V5XSk7XG4gICAgICBpZiAodGhpcy5rZXlWYWx1ZURlcHNba2V5XSkge1xuICAgICAgICBjaGFuZ2VkKHRoaXMua2V5VmFsdWVEZXBzW2tleV1bb2xkS2V5c1trZXldXSk7XG4gICAgICAgIGNoYW5nZWQodGhpcy5rZXlWYWx1ZURlcHNba2V5XVsndW5kZWZpbmVkJ10pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IHJlbW92ZSBhIGtleS12YWx1ZSBwYWlyIGZyb20gdGhlIFJlYWN0aXZlRGljdC4gTm90aWZ5IGFueSBsaXN0ZW5lcnNcbiAgICogdGhhdCB0aGUgdmFsdWUgaGFzIGNoYW5nZWQgKGVnOiByZWRyYXcgdGVtcGxhdGVzLCBhbmQgcmVydW4gYW55XG4gICAqIFtgVHJhY2tlci5hdXRvcnVuYF0oI3RyYWNrZXJfYXV0b3J1bikgY29tcHV0YXRpb25zLCB0aGF0IGNhbGxlZFxuICAgKiBbYFJlYWN0aXZlRGljdC5nZXRgXSgjUmVhY3RpdmVEaWN0X2dldCkgb24gdGhpcyBga2V5YC4pXG4gICAqIEBsb2N1cyBDbGllbnRcbiAgICogQHBhcmFtIHtTdHJpbmd9IGtleSBUaGUga2V5IHRvIGRlbGV0ZSwgZWcsIGBzZWxlY3RlZEl0ZW1gXG4gICAqL1xuICBkZWxldGUoa2V5KSB7XG4gICAgbGV0IGRpZFJlbW92ZSA9IGZhbHNlO1xuXG4gICAgaWYgKGhhc093bi5jYWxsKHRoaXMua2V5cywga2V5KSkge1xuICAgICAgY29uc3Qgb2xkVmFsdWUgPSB0aGlzLmtleXNba2V5XTtcbiAgICAgIGRlbGV0ZSB0aGlzLmtleXNba2V5XTtcbiAgICAgIGNoYW5nZWQodGhpcy5rZXlEZXBzW2tleV0pO1xuICAgICAgaWYgKHRoaXMua2V5VmFsdWVEZXBzW2tleV0pIHtcbiAgICAgICAgY2hhbmdlZCh0aGlzLmtleVZhbHVlRGVwc1trZXldW29sZFZhbHVlXSk7XG4gICAgICAgIGNoYW5nZWQodGhpcy5rZXlWYWx1ZURlcHNba2V5XVsndW5kZWZpbmVkJ10pO1xuICAgICAgfVxuICAgICAgdGhpcy5hbGxEZXBzLmNoYW5nZWQoKTtcbiAgICAgIGRpZFJlbW92ZSA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBkaWRSZW1vdmU7XG4gIH1cblxuICAvKipcbiAgICogQHN1bW1hcnkgQ2xlYXIgYWxsIHZhbHVlcyBmcm9tIHRoZSByZWFjdGl2ZURpY3QgYW5kIHByZXZlbnQgaXQgZnJvbSBiZWluZ1xuICAgKiBtaWdyYXRlZCBvbiBhIEhvdCBDb2RlIFB1c2hlcy4gTm90aWZ5IGFueSBsaXN0ZW5lcnNcbiAgICogdGhhdCB0aGUgdmFsdWUgaGFzIGNoYW5nZWQgKGVnOiByZWRyYXcgdGVtcGxhdGVzLCBhbmQgcmVydW4gYW55XG4gICAqIFtgVHJhY2tlci5hdXRvcnVuYF0oI3RyYWNrZXJfYXV0b3J1bikgY29tcHV0YXRpb25zLCB0aGF0IGNhbGxlZFxuICAgKiBbYFJlYWN0aXZlRGljdC5nZXRgXSgjUmVhY3RpdmVEaWN0X2dldCkgb24gdGhpcyBga2V5YC4pXG4gICAqIEBsb2N1cyBDbGllbnRcbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy5jbGVhcigpO1xuICAgIGlmICh0aGlzLm5hbWUgJiYgaGFzT3duLmNhbGwoUmVhY3RpdmVEaWN0Ll9kaWN0c1RvTWlncmF0ZSwgdGhpcy5uYW1lKSkge1xuICAgICAgZGVsZXRlIFJlYWN0aXZlRGljdC5fZGljdHNUb01pZ3JhdGVbdGhpcy5uYW1lXTtcbiAgICB9XG4gIH1cblxuICBfc2V0T2JqZWN0KG9iamVjdCkge1xuICAgIE9iamVjdC5rZXlzKG9iamVjdCkuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgdGhpcy5zZXQoa2V5LCBvYmplY3Rba2V5XSk7XG4gICAgfSk7XG4gIH1cblxuICBfc2V0RGVmYXVsdE9iamVjdChvYmplY3QpIHtcbiAgICBPYmplY3Qua2V5cyhvYmplY3QpLmZvckVhY2goa2V5ID0+IHtcbiAgICAgIHRoaXMuc2V0RGVmYXVsdChrZXksIG9iamVjdFtrZXldKTtcbiAgICB9KTtcbiAgfVxuXG4gIF9lbnN1cmVLZXkoa2V5KSB7XG4gICAgaWYgKCEoa2V5IGluIHRoaXMua2V5RGVwcykpIHtcbiAgICAgIHRoaXMua2V5RGVwc1trZXldID0gbmV3IFRyYWNrZXIuRGVwZW5kZW5jeTtcbiAgICAgIHRoaXMua2V5VmFsdWVEZXBzW2tleV0gPSB7fTtcbiAgICB9XG4gIH1cblxuICAvLyBHZXQgYSBKU09OIHZhbHVlIHRoYXQgY2FuIGJlIHBhc3NlZCB0byB0aGUgY29uc3RydWN0b3IgdG9cbiAgLy8gY3JlYXRlIGEgbmV3IFJlYWN0aXZlRGljdCB3aXRoIHRoZSBzYW1lIGNvbnRlbnRzIGFzIHRoaXMgb25lXG4gIF9nZXRNaWdyYXRpb25EYXRhKCkge1xuICAgIC8vIFhYWCBzYW5pdGl6ZSBhbmQgbWFrZSBzdXJlIGl0J3MgSlNPTmlibGU/XG4gICAgcmV0dXJuIHRoaXMua2V5cztcbiAgfVxufVxuIl19
