(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var MongoID = Package['mongo-id'].MongoID;
var DiffSequence = Package['diff-sequence'].DiffSequence;
var Random = Package.random.Random;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var ObserveSequence, seqChangedToEmpty, seqChangedToArray, seqChangedToCursor;

var require = meteorInstall({"node_modules":{"meteor":{"observe-sequence":{"observe_sequence.js":function module(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/observe-sequence/observe_sequence.js                                                               //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
const isObject = function (value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
};
const has = function (obj, key) {
  var keyParts = key.split('.');
  return !!obj && (keyParts.length > 1 ? has(obj[key.split('.')[0]], keyParts.slice(1).join('.')) : hasOwnProperty.call(obj, key));
};
const warn = function () {
  if (ObserveSequence._suppressWarnings) {
    ObserveSequence._suppressWarnings--;
  } else {
    if (typeof console !== 'undefined' && console.warn) console.warn.apply(console, arguments);
    ObserveSequence._loggedWarnings++;
  }
};

// isArray returns true for arrays of these types:
// standard arrays: instanceof Array === true, _.isArray(arr) === true
// vm generated arrays: instanceOf Array === false, _.isArray(arr) === true
// subclassed arrays: instanceof Array === true, _.isArray(arr) === false
// see specific tests
function isArray(arr) {
  return arr instanceof Array || Array.isArray(arr);
}

// isIterable returns trues for objects implementing iterable protocol,
// except strings, as {{#each 'string'}} doesn't make much sense.
// Requires ES6+ and does not work in IE (but degrades gracefully).
// Does not support the `length` + index protocol also supported by Array.from
function isIterable(object) {
  const iter = typeof Symbol != 'undefined' && Symbol.iterator;
  return iter && object instanceof Object // note: returns false for strings
  && typeof object[iter] == 'function'; // implements iterable protocol
}
const idStringify = MongoID.idStringify;
const idParse = MongoID.idParse;
ObserveSequence = {
  _suppressWarnings: 0,
  _loggedWarnings: 0,
  // A mechanism similar to cursor.observe which receives a reactive
  // function returning a sequence type and firing appropriate callbacks
  // when the value changes.
  //
  // @param sequenceFunc {Function} a reactive function returning a
  //     sequence type. The currently supported sequence types are:
  //     Array, Cursor, and null.
  //
  // @param callbacks {Object} similar to a specific subset of
  //     callbacks passed to `cursor.observe`
  //     (http://docs.meteor.com/#observe), with minor variations to
  //     support the fact that not all sequences contain objects with
  //     _id fields.  Specifically:
  //
  //     * addedAt(id, item, atIndex, beforeId)
  //     * changedAt(id, newItem, oldItem, atIndex)
  //     * removedAt(id, oldItem, atIndex)
  //     * movedTo(id, item, fromIndex, toIndex, beforeId)
  //
  // @returns {Object(stop: Function)} call 'stop' on the return value
  //     to stop observing this sequence function.
  //
  // We don't make any assumptions about our ability to compare sequence
  // elements (ie, we don't assume EJSON.equals works; maybe there is extra
  // state/random methods on the objects) so unlike cursor.observe, we may
  // sometimes call changedAt() when nothing actually changed.
  // XXX consider if we *can* make the stronger assumption and avoid
  //     no-op changedAt calls (in some cases?)
  //
  // XXX currently only supports the callbacks used by our
  // implementation of {{#each}}, but this can be expanded.
  //
  // XXX #each doesn't use the indices (though we'll eventually need
  // a way to get them when we support `@index`), but calling
  // `cursor.observe` causes the index to be calculated on every
  // callback using a linear scan (unless you turn it off by passing
  // `_no_indices`).  Any way to avoid calculating indices on a pure
  // cursor observe like we used to?
  observe: function (sequenceFunc, callbacks) {
    var lastSeq = null;
    var activeObserveHandle = null;

    // 'lastSeqArray' contains the previous value of the sequence
    // we're observing. It is an array of objects with '_id' and
    // 'item' fields.  'item' is the element in the array, or the
    // document in the cursor.
    //
    // '_id' is whichever of the following is relevant, unless it has
    // already appeared -- in which case it's randomly generated.
    //
    // * if 'item' is an object:
    //   * an '_id' field, if present
    //   * otherwise, the index in the array
    //
    // * if 'item' is a number or string, use that value
    //
    // XXX this can be generalized by allowing {{#each}} to accept a
    // general 'key' argument which could be a function, a dotted
    // field name, or the special @index value.
    var lastSeqArray = []; // elements are objects of form {_id, item}
    var computation = Tracker.autorun(function () {
      var seq = sequenceFunc();
      Tracker.nonreactive(function () {
        var seqArray; // same structure as `lastSeqArray` above.

        if (activeObserveHandle) {
          // If we were previously observing a cursor, replace lastSeqArray with
          // more up-to-date information.  Then stop the old observe.
          lastSeqArray = lastSeq.fetch().map(function (doc) {
            return {
              _id: doc._id,
              item: doc
            };
          });
          activeObserveHandle.stop();
          activeObserveHandle = null;
        }
        if (!seq) {
          seqArray = seqChangedToEmpty(lastSeqArray, callbacks);
        } else if (isArray(seq)) {
          seqArray = seqChangedToArray(lastSeqArray, seq, callbacks);
        } else if (isStoreCursor(seq)) {
          var result /* [seqArray, activeObserveHandle] */ = seqChangedToCursor(lastSeqArray, seq, callbacks);
          seqArray = result[0];
          activeObserveHandle = result[1];
        } else if (isIterable(seq)) {
          const array = Array.from(seq);
          seqArray = seqChangedToArray(lastSeqArray, array, callbacks);
        } else {
          throw badSequenceError(seq);
        }
        diffArray(lastSeqArray, seqArray, callbacks);
        lastSeq = seq;
        lastSeqArray = seqArray;
      });
    });
    return {
      stop: function () {
        computation.stop();
        if (activeObserveHandle) activeObserveHandle.stop();
      }
    };
  },
  // Fetch the items of `seq` into an array, where `seq` is of one of the
  // sequence types accepted by `observe`.  If `seq` is a cursor, a
  // dependency is established.
  fetch: function (seq) {
    if (!seq) {
      return [];
    } else if (isArray(seq)) {
      return seq;
    } else if (isStoreCursor(seq)) {
      return seq.fetch();
    } else if (isIterable(seq)) {
      return Array.from(seq);
    } else {
      throw badSequenceError(seq);
    }
  }
};
function ellipsis(longStr, maxLength) {
  if (!maxLength) maxLength = 100;
  if (longStr.length < maxLength) return longStr;
  return longStr.substr(0, maxLength - 1) + '…';
}
function arrayToDebugStr(value, maxLength) {
  var out = '',
    sep = '';
  for (var i = 0; i < value.length; i++) {
    var item = value[i];
    out += sep + toDebugStr(item, maxLength);
    if (out.length > maxLength) return out;
    sep = ', ';
  }
  return out;
}
function toDebugStr(value, maxLength) {
  if (!maxLength) maxLength = 150;
  const type = typeof value;
  switch (type) {
    case 'undefined':
      return type;
    case 'number':
      return value.toString();
    case 'string':
      return JSON.stringify(value);
    // add quotes
    case 'object':
      if (value === null) {
        return 'null';
      } else if (Array.isArray(value)) {
        return 'Array [' + arrayToDebugStr(value, maxLength) + ']';
      } else if (Symbol.iterator in value) {
        // Map and Set are not handled by JSON.stringify
        return value.constructor.name + ' [' + arrayToDebugStr(Array.from(value), maxLength) + ']'; // Array.from doesn't work in IE, but neither do iterators so it's unreachable
      } else {
        // use JSON.stringify (sometimes toString can be better but we don't know)
        return value.constructor.name + ' ' + ellipsis(JSON.stringify(value), maxLength);
      }
    default:
      return type + ': ' + value.toString();
  }
}
function sequenceGotValue(sequence) {
  try {
    return ' Got ' + toDebugStr(sequence);
  } catch (e) {
    return '';
  }
}
const badSequenceError = function (sequence) {
  return new Error("{{#each}} currently only accepts " + "arrays, cursors, iterables or falsey values." + sequenceGotValue(sequence));
};
const isFunction = func => {
  return typeof func === "function";
};
const isStoreCursor = function (cursor) {
  return cursor && isObject(cursor) && isFunction(cursor.observe) && isFunction(cursor.fetch);
};

// Calculates the differences between `lastSeqArray` and
// `seqArray` and calls appropriate functions from `callbacks`.
// Reuses Minimongo's diff algorithm implementation.
const diffArray = function (lastSeqArray, seqArray, callbacks) {
  var diffFn = Package['diff-sequence'].DiffSequence.diffQueryOrderedChanges;
  var oldIdObjects = [];
  var newIdObjects = [];
  var posOld = {}; // maps from idStringify'd ids
  var posNew = {}; // ditto
  var posCur = {};
  var lengthCur = lastSeqArray.length;
  seqArray.forEach(function (doc, i) {
    newIdObjects.push({
      _id: doc._id
    });
    posNew[idStringify(doc._id)] = i;
  });
  lastSeqArray.forEach(function (doc, i) {
    oldIdObjects.push({
      _id: doc._id
    });
    posOld[idStringify(doc._id)] = i;
    posCur[idStringify(doc._id)] = i;
  });

  // Arrays can contain arbitrary objects. We don't diff the
  // objects. Instead we always fire 'changedAt' callback on every
  // object. The consumer of `observe-sequence` should deal with
  // it appropriately.
  diffFn(oldIdObjects, newIdObjects, {
    addedBefore: function (id, doc, before) {
      var position = before ? posCur[idStringify(before)] : lengthCur;
      if (before) {
        // If not adding at the end, we need to update indexes.
        // XXX this can still be improved greatly!
        Object.entries(posCur).forEach(function (_ref) {
          let [id, pos] = _ref;
          if (pos >= position) posCur[id]++;
        });
      }
      lengthCur++;
      posCur[idStringify(id)] = position;
      callbacks.addedAt(id, seqArray[posNew[idStringify(id)]].item, position, before);
    },
    movedBefore: function (id, before) {
      if (id === before) return;
      var oldPosition = posCur[idStringify(id)];
      var newPosition = before ? posCur[idStringify(before)] : lengthCur;

      // Moving the item forward. The new element is losing one position as it
      // was removed from the old position before being inserted at the new
      // position.
      // Ex.:   0  *1*  2   3   4
      //        0   2   3  *1*  4
      // The original issued callback is "1" before "4".
      // The position of "1" is 1, the position of "4" is 4.
      // The generated move is (1) -> (3)
      if (newPosition > oldPosition) {
        newPosition--;
      }

      // Fix up the positions of elements between the old and the new positions
      // of the moved element.
      //
      // There are two cases:
      //   1. The element is moved forward. Then all the positions in between
      //   are moved back.
      //   2. The element is moved back. Then the positions in between *and* the
      //   element that is currently standing on the moved element's future
      //   position are moved forward.
      Object.entries(posCur).forEach(function (_ref2) {
        let [id, elCurPosition] = _ref2;
        if (oldPosition < elCurPosition && elCurPosition < newPosition) posCur[id]--;else if (newPosition <= elCurPosition && elCurPosition < oldPosition) posCur[id]++;
      });

      // Finally, update the position of the moved element.
      posCur[idStringify(id)] = newPosition;
      callbacks.movedTo(id, seqArray[posNew[idStringify(id)]].item, oldPosition, newPosition, before);
    },
    removed: function (id) {
      var prevPosition = posCur[idStringify(id)];
      Object.entries(posCur).forEach(function (_ref3) {
        let [id, pos] = _ref3;
        if (pos >= prevPosition) posCur[id]--;
      });
      delete posCur[idStringify(id)];
      lengthCur--;
      callbacks.removedAt(id, lastSeqArray[posOld[idStringify(id)]].item, prevPosition);
    }
  });
  Object.entries(posNew).forEach(function (_ref4) {
    let [idString, pos] = _ref4;
    var id = idParse(idString);
    if (has(posOld, idString)) {
      // specifically for primitive types, compare equality before
      // firing the 'changedAt' callback. otherwise, always fire it
      // because doing a deep EJSON comparison is not guaranteed to
      // work (an array can contain arbitrary objects, and 'transform'
      // can be used on cursors). also, deep diffing is not
      // necessarily the most efficient (if only a specific subfield
      // of the object is later accessed).
      var newItem = seqArray[pos].item;
      var oldItem = lastSeqArray[posOld[idString]].item;
      if (typeof newItem === 'object' || newItem !== oldItem) callbacks.changedAt(id, newItem, oldItem, pos);
    }
  });
};
seqChangedToEmpty = function (lastSeqArray, callbacks) {
  return [];
};
seqChangedToArray = function (lastSeqArray, array, callbacks) {
  var idsUsed = {};
  var seqArray = array.map(function (item, index) {
    var id;
    if (typeof item === 'string') {
      // ensure not empty, since other layers (eg DomRange) assume this as well
      id = "-" + item;
    } else if (typeof item === 'number' || typeof item === 'boolean' || item === undefined || item === null) {
      id = item;
    } else if (typeof item === 'object') {
      id = item && '_id' in item ? item._id : index;
    } else {
      throw new Error("{{#each}} doesn't support arrays with " + "elements of type " + typeof item);
    }
    var idString = idStringify(id);
    if (idsUsed[idString]) {
      if (item && typeof item === 'object' && '_id' in item) warn("duplicate id " + id + " in", array);
      id = Random.id();
    } else {
      idsUsed[idString] = true;
    }
    return {
      _id: id,
      item: item
    };
  });
  return seqArray;
};
seqChangedToCursor = function (lastSeqArray, cursor, callbacks) {
  var initial = true; // are we observing initial data from cursor?
  var seqArray = [];
  var observeHandle = cursor.observe({
    addedAt: function (document, atIndex, before) {
      if (initial) {
        // keep track of initial data so that we can diff once
        // we exit `observe`.
        if (before !== null) throw new Error("Expected initial data from observe in order");
        seqArray.push({
          _id: document._id,
          item: document
        });
      } else {
        callbacks.addedAt(document._id, document, atIndex, before);
      }
    },
    changedAt: function (newDocument, oldDocument, atIndex) {
      callbacks.changedAt(newDocument._id, newDocument, oldDocument, atIndex);
    },
    removedAt: function (oldDocument, atIndex) {
      callbacks.removedAt(oldDocument._id, oldDocument, atIndex);
    },
    movedTo: function (document, fromIndex, toIndex, before) {
      callbacks.movedTo(document._id, document, fromIndex, toIndex, before);
    }
  });
  initial = false;
  return [seqArray, observeHandle];
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/observe-sequence/observe_sequence.js");

/* Exports */
Package._define("observe-sequence", {
  ObserveSequence: ObserveSequence
});

})();

//# sourceURL=meteor://💻app/packages/observe-sequence.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb2JzZXJ2ZS1zZXF1ZW5jZS9vYnNlcnZlX3NlcXVlbmNlLmpzIl0sIm5hbWVzIjpbImlzT2JqZWN0IiwidmFsdWUiLCJ0eXBlIiwiaGFzIiwib2JqIiwia2V5Iiwia2V5UGFydHMiLCJzcGxpdCIsImxlbmd0aCIsInNsaWNlIiwiam9pbiIsImhhc093blByb3BlcnR5IiwiY2FsbCIsIndhcm4iLCJPYnNlcnZlU2VxdWVuY2UiLCJfc3VwcHJlc3NXYXJuaW5ncyIsImNvbnNvbGUiLCJhcHBseSIsImFyZ3VtZW50cyIsIl9sb2dnZWRXYXJuaW5ncyIsImlzQXJyYXkiLCJhcnIiLCJBcnJheSIsImlzSXRlcmFibGUiLCJvYmplY3QiLCJpdGVyIiwiU3ltYm9sIiwiaXRlcmF0b3IiLCJPYmplY3QiLCJpZFN0cmluZ2lmeSIsIk1vbmdvSUQiLCJpZFBhcnNlIiwib2JzZXJ2ZSIsInNlcXVlbmNlRnVuYyIsImNhbGxiYWNrcyIsImxhc3RTZXEiLCJhY3RpdmVPYnNlcnZlSGFuZGxlIiwibGFzdFNlcUFycmF5IiwiY29tcHV0YXRpb24iLCJUcmFja2VyIiwiYXV0b3J1biIsInNlcSIsIm5vbnJlYWN0aXZlIiwic2VxQXJyYXkiLCJmZXRjaCIsIm1hcCIsImRvYyIsIl9pZCIsIml0ZW0iLCJzdG9wIiwic2VxQ2hhbmdlZFRvRW1wdHkiLCJzZXFDaGFuZ2VkVG9BcnJheSIsImlzU3RvcmVDdXJzb3IiLCJyZXN1bHQiLCJzZXFDaGFuZ2VkVG9DdXJzb3IiLCJhcnJheSIsImZyb20iLCJiYWRTZXF1ZW5jZUVycm9yIiwiZGlmZkFycmF5IiwiZWxsaXBzaXMiLCJsb25nU3RyIiwibWF4TGVuZ3RoIiwic3Vic3RyIiwiYXJyYXlUb0RlYnVnU3RyIiwib3V0Iiwic2VwIiwiaSIsInRvRGVidWdTdHIiLCJ0b1N0cmluZyIsIkpTT04iLCJzdHJpbmdpZnkiLCJjb25zdHJ1Y3RvciIsIm5hbWUiLCJzZXF1ZW5jZUdvdFZhbHVlIiwic2VxdWVuY2UiLCJlIiwiRXJyb3IiLCJpc0Z1bmN0aW9uIiwiZnVuYyIsImN1cnNvciIsImRpZmZGbiIsIlBhY2thZ2UiLCJEaWZmU2VxdWVuY2UiLCJkaWZmUXVlcnlPcmRlcmVkQ2hhbmdlcyIsIm9sZElkT2JqZWN0cyIsIm5ld0lkT2JqZWN0cyIsInBvc09sZCIsInBvc05ldyIsInBvc0N1ciIsImxlbmd0aEN1ciIsImZvckVhY2giLCJwdXNoIiwiYWRkZWRCZWZvcmUiLCJpZCIsImJlZm9yZSIsInBvc2l0aW9uIiwiZW50cmllcyIsIl9yZWYiLCJwb3MiLCJhZGRlZEF0IiwibW92ZWRCZWZvcmUiLCJvbGRQb3NpdGlvbiIsIm5ld1Bvc2l0aW9uIiwiX3JlZjIiLCJlbEN1clBvc2l0aW9uIiwibW92ZWRUbyIsInJlbW92ZWQiLCJwcmV2UG9zaXRpb24iLCJfcmVmMyIsInJlbW92ZWRBdCIsIl9yZWY0IiwiaWRTdHJpbmciLCJuZXdJdGVtIiwib2xkSXRlbSIsImNoYW5nZWRBdCIsImlkc1VzZWQiLCJpbmRleCIsInVuZGVmaW5lZCIsIlJhbmRvbSIsImluaXRpYWwiLCJvYnNlcnZlSGFuZGxlIiwiZG9jdW1lbnQiLCJhdEluZGV4IiwibmV3RG9jdW1lbnQiLCJvbGREb2N1bWVudCIsImZyb21JbmRleCIsInRvSW5kZXgiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsTUFBTUEsUUFBUSxHQUFHLFNBQUFBLENBQVVDLEtBQUssRUFBRTtFQUNoQyxJQUFJQyxJQUFJLEdBQUcsT0FBT0QsS0FBSztFQUN2QixPQUFPQSxLQUFLLElBQUksSUFBSSxLQUFLQyxJQUFJLElBQUksUUFBUSxJQUFJQSxJQUFJLElBQUksVUFBVSxDQUFDO0FBQ2xFLENBQUM7QUFDRCxNQUFNQyxHQUFHLEdBQUcsU0FBQUEsQ0FBVUMsR0FBRyxFQUFFQyxHQUFHLEVBQUU7RUFDOUIsSUFBSUMsUUFBUSxHQUFHRCxHQUFHLENBQUNFLEtBQUssQ0FBQyxHQUFHLENBQUM7RUFFN0IsT0FBTyxDQUFD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LEVBQUU7TUFDdkQ1RCxTQUFTLENBQUN1RSxPQUFPLENBQ2ZnQixRQUFRLENBQUMxRSxHQUFHLEVBQUUwRSxRQUFRLEVBQUVJLFNBQVMsRUFBRUMsT0FBTyxFQUFFaEMsTUFBTSxDQUFDO0lBQ3ZEO0VBQ0YsQ0FBQyxDQUFDO0VBQ0Z5QixPQUFPLEdBQUcsS0FBSztFQUVmLE9BQU8sQ0FBQzVFLFFBQVEsRUFBRTZFLGFBQWEsQ0FBQztBQUNsQyxDQUFDLEMiLCJmaWxlIjoiL3BhY2thZ2VzL29ic2VydmUtc2VxdWVuY2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBpc09iamVjdCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcbiAgcmV0dXJuIHZhbHVlICE9IG51bGwgJiYgKHR5cGUgPT0gJ29iamVjdCcgfHwgdHlwZSA9PSAnZnVuY3Rpb24nKTtcbn1cbmNvbnN0IGhhcyA9IGZ1bmN0aW9uIChvYmosIGtleSkge1xuICB2YXIga2V5UGFydHMgPSBrZXkuc3BsaXQoJy4nKTtcblxuICByZXR1cm4gISFvYmogJiYgKFxuICAgIGtleVBhcnRzLmxlbmd0aCA+IDFcbiAgICAgID8gaGFzKG9ialtrZXkuc3BsaXQoJy4nKVswXV0sIGtleVBhcnRzLnNsaWNlKDEpLmpvaW4oJy4nKSlcbiAgICAgIDogaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSlcbiAgKTtcbn07XG5cbmNvbnN0IHdhcm4gPSBmdW5jdGlvbiAoKSB7XG4gIGlmIChPYnNlcnZlU2VxdWVuY2UuX3N1cHByZXNzV2FybmluZ3MpIHtcbiAgICBPYnNlcnZlU2VxdWVuY2UuX3N1cHByZXNzV2FybmluZ3MtLTtcbiAgfSBlbHNlIHtcbiAgICBpZiAodHlwZW9mIGNvbnNvbGUgIT09ICd1bmRlZmluZWQnICYmIGNvbnNvbGUud2FybilcbiAgICAgIGNvbnNvbGUud2Fybi5hcHBseShjb25zb2xlLCBhcmd1bWVudHMpO1xuXG4gICAgT2JzZXJ2ZVNlcXVlbmNlLl9sb2dnZWRXYXJuaW5ncysrO1xuICB9XG59O1xuXG4vLyBpc0FycmF5IHJldHVybnMgdHJ1ZSBmb3IgYXJyYXlzIG9mIHRoZXNlIHR5cGVzOlxuLy8gc3RhbmRhcmQgYXJyYXlzOiBpbnN0YW5jZW9mIEFycmF5ID09PSB0cnVlLCBfLmlzQXJyYXkoYXJyKSA9PT0gdHJ1ZVxuLy8gdm0gZ2VuZXJhdGVkIGFycmF5czogaW5zdGFuY2VPZiBBcnJheSA9PT0gZmFsc2UsIF8uaXNBcnJheShhcnIpID09PSB0cnVlXG4vLyBzdWJjbGFzc2VkIGFycmF5czogaW5zdGFuY2VvZiBBcnJheSA9PT0gdHJ1ZSwgXy5pc0FycmF5KGFycikgPT09IGZhbHNlXG4vLyBzZWUgc3BlY2lmaWMgdGVzdHNcbmZ1bmN0aW9uIGlzQXJyYXkoYXJyKSB7XG4gIHJldHVybiBhcnIgaW5zdGFuY2VvZiBBcnJheSB8fCBBcnJheS5pc0FycmF5KGFycik7XG59XG5cbi8vIGlzSXRlcmFibGUgcmV0dXJucyB0cnVlcyBmb3Igb2JqZWN0cyBpbXBsZW1lbnRpbmcgaXRlcmFibGUgcHJvdG9jb2wsXG4vLyBleGNlcHQgc3RyaW5ncywgYXMge3sjZWFjaCAnc3RyaW5nJ319IGRvZXNuJ3QgbWFrZSBtdWNoIHNlbnNlLlxuLy8gUmVxdWlyZXMgRVM2KyBhbmQgZG9lcyBub3Qgd29yayBpbiBJRSAoYnV0IGRlZ3JhZGVzIGdyYWNlZnVsbHkpLlxuLy8gRG9lcyBub3Qgc3VwcG9ydCB0aGUgYGxlbmd0aGAgKyBpbmRleCBwcm90b2NvbCBhbHNvIHN1cHBvcnRlZCBieSBBcnJheS5mcm9tXG5mdW5jdGlvbiBpc0l0ZXJhYmxlIChvYmplY3QpIHtcbiAgY29uc3QgaXRlciA9IHR5cGVvZiBTeW1ib2wgIT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLml0ZXJhdG9yO1xuICByZXR1cm4gaXRlclxuICAgICYmIG9iamVjdCBpbnN0YW5jZW9mIE9iamVjdCAvLyBub3RlOiByZXR1cm5zIGZhbHNlIGZvciBzdHJpbmdzXG4gICAgJiYgdHlwZW9mIG9iamVjdFtpdGVyXSA9PSAnZnVuY3Rpb24nOyAvLyBpbXBsZW1lbnRzIGl0ZXJhYmxlIHByb3RvY29sXG59XG5cbmNvbnN0IGlkU3RyaW5naWZ5ID0gTW9uZ29JRC5pZFN0cmluZ2lmeTtcbmNvbnN0IGlkUGFyc2UgPSBNb25nb0lELmlkUGFyc2U7XG5cbk9ic2VydmVTZXF1ZW5jZSA9IHtcbiAgX3N1cHByZXNzV2FybmluZ3M6IDAsXG4gIF9sb2dnZWRXYXJuaW5nczogMCxcblxuICAvLyBBIG1lY2hhbmlzbSBzaW1pbGFyIHRvIGN1cnNvci5vYnNlcnZlIHdoaWNoIHJlY2VpdmVzIGEgcmVhY3RpdmVcbiAgLy8gZnVuY3Rpb24gcmV0dXJuaW5nIGEgc2VxdWVuY2UgdHlwZSBhbmQgZmlyaW5nIGFwcHJvcHJpYXRlIGNhbGxiYWNrc1xuICAvLyB3aGVuIHRoZSB2YWx1ZSBjaGFuZ2VzLlxuICAvL1xuICAvLyBAcGFyYW0gc2VxdWVuY2VGdW5jIHtGdW5jdGlvbn0gYSByZWFjdGl2ZSBmdW5jdGlvbiByZXR1cm5pbmcgYVxuICAvLyAgICAgc2VxdWVuY2UgdHlwZS4gVGhlIGN1cnJlbnRseSBzdXBwb3J0ZWQgc2VxdWVuY2UgdHlwZXMgYXJlOlxuICAvLyAgICAgQXJyYXksIEN1cnNvciwgYW5kIG51bGwuXG4gIC8vXG4gIC8vIEBwYXJhbSBjYWxsYmFja3Mge09iamVjdH0gc2ltaWxhciB0byBhIHNwZWNpZmljIHN1YnNldCBvZlxuICAvLyAgICAgY2FsbGJhY2tzIHBhc3NlZCB0byBgY3Vyc29yLm9ic2VydmVgXG4gIC8vICAgICAoaHR0cDovL2RvY3MubWV0ZW9yLmNvbS8jb2JzZXJ2ZSksIHdpdGggbWlub3IgdmFyaWF0aW9ucyB0b1xuICAvLyAgICAgc3VwcG9ydCB0aGUgZmFjdCB0aGF0IG5vdCBhbGwgc2VxdWVuY2VzIGNvbnRhaW4gb2JqZWN0cyB3aXRoXG4gIC8vICAgICBfaWQgZmllbGRzLiAgU3BlY2lmaWNhbGx5OlxuICAvL1xuICAvLyAgICAgKiBhZGRlZEF0KGlkLCBpdGVtLCBhdEluZGV4LCBiZWZvcmVJZClcbiAgLy8gICAgICogY2hhbmdlZEF0KGlkLCBuZXdJdGVtLCBvbGRJdGVtLCBhdEluZGV4KVxuICAvLyAgICAgKiByZW1vdmVkQXQoaWQsIG9sZEl0ZW0sIGF0SW5kZXgpXG4gIC8vICAgICAqIG1vdmVkVG8oaWQsIGl0ZW0sIGZyb21JbmRleCwgdG9JbmRleCwgYmVmb3JlSWQpXG4gIC8vXG4gIC8vIEByZXR1cm5zIHtPYmplY3Qoc3RvcDogRnVuY3Rpb24pfSBjYWxsICdzdG9wJyBvbiB0aGUgcmV0dXJuIHZhbHVlXG4gIC8vICAgICB0byBzdG9wIG9ic2VydmluZyB0aGlzIHNlcXVlbmNlIGZ1bmN0aW9uLlxuICAvL1xuICAvLyBXZSBkb24ndCBtYWtlIGFueSBhc3N1bXB0aW9ucyBhYm91dCBvdXIgYWJpbGl0eSB0byBjb21wYXJlIHNlcXVlbmNlXG4gIC8vIGVsZW1lbnRzIChpZSwgd2UgZG9uJ3QgYXNzdW1lIEVKU09OLmVxdWFscyB3b3JrczsgbWF5YmUgdGhlcmUgaXMgZXh0cmFcbiAgLy8gc3RhdGUvcmFuZG9tIG1ldGhvZHMgb24gdGhlIG9iamVjdHMpIHNvIHVubGlrZSBjdXJzb3Iub2JzZXJ2ZSwgd2UgbWF5XG4gIC8vIHNvbWV0aW1lcyBjYWxsIGNoYW5nZWRBdCgpIHdoZW4gbm90aGluZyBhY3R1YWxseSBjaGFuZ2VkLlxuICAvLyBYWFggY29uc2lkZXIgaWYgd2UgKmNhbiogbWFrZSB0aGUgc3Ryb25nZXIgYXNzdW1wdGlvbiBhbmQgYXZvaWRcbiAgLy8gICAgIG5vLW9wIGNoYW5nZWRBdCBjYWxscyAoaW4gc29tZSBjYXNlcz8pXG4gIC8vXG4gIC8vIFhYWCBjdXJyZW50bHkgb25seSBzdXBwb3J0cyB0aGUgY2FsbGJhY2tzIHVzZWQgYnkgb3VyXG4gIC8vIGltcGxlbWVudGF0aW9uIG9mIHt7I2VhY2h9fSwgYnV0IHRoaXMgY2FuIGJlIGV4cGFuZGVkLlxuICAvL1xuICAvLyBYWFggI2VhY2ggZG9lc24ndCB1c2UgdGhlIGluZGljZXMgKHRob3VnaCB3ZSdsbCBldmVudHVhbGx5IG5lZWRcbiAgLy8gYSB3YXkgdG8gZ2V0IHRoZW0gd2hlbiB3ZSBzdXBwb3J0IGBAaW5kZXhgKSwgYnV0IGNhbGxpbmdcbiAgLy8gYGN1cnNvci5vYnNlcnZlYCBjYXVzZXMgdGhlIGluZGV4IHRvIGJlIGNhbGN1bGF0ZWQgb24gZXZlcnlcbiAgLy8gY2FsbGJhY2sgdXNpbmcgYSBsaW5lYXIgc2NhbiAodW5sZXNzIHlvdSB0dXJuIGl0IG9mZiBieSBwYXNzaW5nXG4gIC8vIGBfbm9faW5kaWNlc2ApLiAgQW55IHdheSB0byBhdm9pZCBjYWxjdWxhdGluZyBpbmRpY2VzIG9uIGEgcHVyZVxuICAvLyBjdXJzb3Igb2JzZXJ2ZSBsaWtlIHdlIHVzZWQgdG8/XG4gIG9ic2VydmU6IGZ1bmN0aW9uIChzZXF1ZW5jZUZ1bmMsIGNhbGxiYWNrcykge1xuICAgIHZhciBsYXN0U2VxID0gbnVsbDtcbiAgICB2YXIgYWN0aXZlT2JzZXJ2ZUhhbmRsZSA9IG51bGw7XG5cbiAgICAvLyAnbGFzdFNlcUFycmF5JyBjb250YWlucyB0aGUgcHJldmlvdXMgdmFsdWUgb2YgdGhlIHNlcXVlbmNlXG4gICAgLy8gd2UncmUgb2JzZXJ2aW5nLiBJdCBpcyBhbiBhcnJheSBvZiBvYmplY3RzIHdpdGggJ19pZCcgYW5kXG4gICAgLy8gJ2l0ZW0nIGZpZWxkcy4gICdpdGVtJyBpcyB0aGUgZWxlbWVudCBpbiB0aGUgYXJyYXksIG9yIHRoZVxuICAgIC8vIGRvY3VtZW50IGluIHRoZSBjdXJzb3IuXG4gICAgLy9cbiAgICAvLyAnX2lkJyBpcyB3aGljaGV2ZXIgb2YgdGhlIGZvbGxvd2luZyBpcyByZWxldmFudCwgdW5sZXNzIGl0IGhhc1xuICAgIC8vIGFscmVhZHkgYXBwZWFyZWQgLS0gaW4gd2hpY2ggY2FzZSBpdCdzIHJhbmRvbWx5IGdlbmVyYXRlZC5cbiAgICAvL1xuICAgIC8vICogaWYgJ2l0ZW0nIGlzIGFuIG9iamVjdDpcbiAgICAvLyAgICogYW4gJ19pZCcgZmllbGQsIGlmIHByZXNlbnRcbiAgICAvLyAgICogb3RoZXJ3aXNlLCB0aGUgaW5kZXggaW4gdGhlIGFycmF5XG4gICAgLy9cbiAgICAvLyAqIGlmICdpdGVtJyBpcyBhIG51bWJlciBvciBzdHJpbmcsIHVzZSB0aGF0IHZhbHVlXG4gICAgLy9cbiAgICAvLyBYWFggdGhpcyBjYW4gYmUgZ2VuZXJhbGl6ZWQgYnkgYWxsb3dpbmcge3sjZWFjaH19IHRvIGFjY2VwdCBhXG4gICAgLy8gZ2VuZXJhbCAna2V5JyBhcmd1bWVudCB3aGljaCBjb3VsZCBiZSBhIGZ1bmN0aW9uLCBhIGRvdHRlZFxuICAgIC8vIGZpZWxkIG5hbWUsIG9yIHRoZSBzcGVjaWFsIEBpbmRleCB2YWx1ZS5cbiAgICB2YXIgbGFzdFNlcUFycmF5ID0gW107IC8vIGVsZW1lbnRzIGFyZSBvYmplY3RzIG9mIGZvcm0ge19pZCwgaXRlbX1cbiAgICB2YXIgY29tcHV0YXRpb24gPSBUcmFja2VyLmF1dG9ydW4oZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHNlcSA9IHNlcXVlbmNlRnVuYygpO1xuXG4gICAgICBUcmFja2VyLm5vbnJlYWN0aXZlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHNlcUFycmF5OyAvLyBzYW1lIHN0cnVjdHVyZSBhcyBgbGFzdFNlcUFycmF5YCBhYm92ZS5cblxuICAgICAgICBpZiAoYWN0aXZlT2JzZXJ2ZUhhbmRsZSkge1xuICAgICAgICAgIC8vIElmIHdlIHdlcmUgcHJldmlvdXNseSBvYnNlcnZpbmcgYSBjdXJzb3IsIHJlcGxhY2UgbGFzdFNlcUFycmF5IHdpdGhcbiAgICAgICAgICAvLyBtb3JlIHVwLXRvLWRhdGUgaW5mb3JtYXRpb24uICBUaGVuIHN0b3AgdGhlIG9sZCBvYnNlcnZlLlxuICAgICAgICAgIGxhc3RTZXFBcnJheSA9IGxhc3RTZXEuZmV0Y2goKS5tYXAoZnVuY3Rpb24gKGRvYykge1xuICAgICAgICAgICAgcmV0dXJuIHtfaWQ6IGRvYy5faWQsIGl0ZW06IGRvY307XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgYWN0aXZlT2JzZXJ2ZUhhbmRsZS5zdG9wKCk7XG4gICAgICAgICAgYWN0aXZlT2JzZXJ2ZUhhbmRsZSA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXNlcSkge1xuICAgICAgICAgIHNlcUFycmF5ID0gc2VxQ2hhbmdlZFRvRW1wdHkobGFzdFNlcUFycmF5LCBjYWxsYmFja3MpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzQXJyYXkoc2VxKSkge1xuICAgICAgICAgIHNlcUFycmF5ID0gc2VxQ2hhbmdlZFRvQXJyYXkobGFzdFNlcUFycmF5LCBzZXEsIGNhbGxiYWNrcyk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNTdG9yZUN1cnNvcihzZXEpKSB7XG4gICAgICAgICAgdmFyIHJlc3VsdCAvKiBbc2VxQXJyYXksIGFjdGl2ZU9ic2VydmVIYW5kbGVdICovID1cbiAgICAgICAgICAgICAgICBzZXFDaGFuZ2VkVG9DdXJzb3IobGFzdFNlcUFycmF5LCBzZXEsIGNhbGxiYWNrcyk7XG4gICAgICAgICAgc2VxQXJyYXkgPSByZXN1bHRbMF07XG4gICAgICAgICAgYWN0aXZlT2JzZXJ2ZUhhbmRsZSA9IHJlc3VsdFsxXTtcbiAgICAgICAgfSBlbHNlIGlmIChpc0l0ZXJhYmxlKHNlcSkpIHtcbiAgICAgICAgICBjb25zdCBhcnJheSA9IEFycmF5LmZyb20oc2VxKTtcbiAgICAgICAgICBzZXFBcnJheSA9IHNlcUNoYW5nZWRUb0FycmF5KGxhc3RTZXFBcnJheSwgYXJyYXksIGNhbGxiYWNrcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgYmFkU2VxdWVuY2VFcnJvcihzZXEpO1xuICAgICAgICB9XG5cbiAgICAgICAgZGlmZkFycmF5KGxhc3RTZXFBcnJheSwgc2VxQXJyYXksIGNhbGxiYWNrcyk7XG4gICAgICAgIGxhc3RTZXEgPSBzZXE7XG4gICAgICAgIGxhc3RTZXFBcnJheSA9IHNlcUFycmF5O1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgc3RvcDogZnVuY3Rpb24gKCkge1xuICAgICAgICBjb21wdXRhdGlvbi5zdG9wKCk7XG4gICAgICAgIGlmIChhY3RpdmVPYnNlcnZlSGFuZGxlKVxuICAgICAgICAgIGFjdGl2ZU9ic2VydmVIYW5kbGUuc3RvcCgpO1xuICAgICAgfVxuICAgIH07XG4gIH0sXG5cbiAgLy8gRmV0Y2ggdGhlIGl0ZW1zIG9mIGBzZXFgIGludG8gYW4gYXJyYXksIHdoZXJlIGBzZXFgIGlzIG9mIG9uZSBvZiB0aGVcbiAgLy8gc2VxdWVuY2UgdHlwZXMgYWNjZXB0ZWQgYnkgYG9ic2VydmVgLiAgSWYgYHNlcWAgaXMgYSBjdXJzb3IsIGFcbiAgLy8gZGVwZW5kZW5jeSBpcyBlc3RhYmxpc2hlZC5cbiAgZmV0Y2g6IGZ1bmN0aW9uIChzZXEpIHtcbiAgICBpZiAoIXNlcSkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH0gZWxzZSBpZiAoaXNBcnJheShzZXEpKSB7XG4gICAgICByZXR1cm4gc2VxO1xuICAgIH0gZWxzZSBpZiAoaXNTdG9yZUN1cnNvcihzZXEpKSB7XG4gICAgICByZXR1cm4gc2VxLmZldGNoKCk7XG4gICAgfSBlbHNlIGlmIChpc0l0ZXJhYmxlKHNlcSkpIHtcbiAgICAgIHJldHVybiBBcnJheS5mcm9tKHNlcSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IGJhZFNlcXVlbmNlRXJyb3Ioc2VxKTtcbiAgICB9XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGVsbGlwc2lzKGxvbmdTdHIsIG1heExlbmd0aCkge1xuICBpZighbWF4TGVuZ3RoKSBtYXhMZW5ndGggPSAxMDA7XG4gIGlmKGxvbmdTdHIubGVuZ3RoIDwgbWF4TGVuZ3RoKSByZXR1cm4gbG9uZ1N0cjtcbiAgcmV0dXJuIGxvbmdTdHIuc3Vic3RyKDAsIG1heExlbmd0aC0xKSArICfigKYnO1xufVxuXG5mdW5jdGlvbiBhcnJheVRvRGVidWdTdHIodmFsdWUsIG1heExlbmd0aCkge1xuICB2YXIgb3V0ID0gJycsIHNlcCA9ICcnO1xuICBmb3IodmFyIGkgPSAwOyBpIDwgdmFsdWUubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgaXRlbSA9IHZhbHVlW2ldO1xuICAgIG91dCArPSBzZXAgKyB0b0RlYnVnU3RyKGl0ZW0sIG1heExlbmd0aCk7XG4gICAgaWYob3V0Lmxlbmd0aCA+IG1heExlbmd0aCkgcmV0dXJuIG91dDtcbiAgICBzZXAgPSAnLCAnO1xuICB9XG4gIHJldHVybiBvdXQ7XG59XG5cbmZ1bmN0aW9uIHRvRGVidWdTdHIodmFsdWUsIG1heExlbmd0aCkge1xuICBpZighbWF4TGVuZ3RoKSBtYXhMZW5ndGggPSAxNTA7XG4gIGNvbnN0IHR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gIHN3aXRjaCh0eXBlKSB7XG4gICAgY2FzZSAndW5kZWZpbmVkJzpcbiAgICAgIHJldHVybiB0eXBlO1xuICAgIGNhc2UgJ251bWJlcic6XG4gICAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcbiAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHZhbHVlKTsgLy8gYWRkIHF1b3Rlc1xuICAgIGNhc2UgJ29iamVjdCc6XG4gICAgICBpZih2YWx1ZSA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gJ251bGwnO1xuICAgICAgfSBlbHNlIGlmKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiAnQXJyYXkgWycgKyBhcnJheVRvRGVidWdTdHIodmFsdWUsIG1heExlbmd0aCkgKyAnXSc7XG4gICAgICB9IGVsc2UgaWYoU3ltYm9sLml0ZXJhdG9yIGluIHZhbHVlKSB7IC8vIE1hcCBhbmQgU2V0IGFyZSBub3QgaGFuZGxlZCBieSBKU09OLnN0cmluZ2lmeVxuICAgICAgICByZXR1cm4gdmFsdWUuY29uc3RydWN0b3IubmFtZVxuICAgICAgICAgICsgJyBbJyArIGFycmF5VG9EZWJ1Z1N0cihBcnJheS5mcm9tKHZhbHVlKSwgbWF4TGVuZ3RoKVxuICAgICAgICAgICsgJ10nOyAvLyBBcnJheS5mcm9tIGRvZXNuJ3Qgd29yayBpbiBJRSwgYnV0IG5laXRoZXIgZG8gaXRlcmF0b3JzIHNvIGl0J3MgdW5yZWFjaGFibGVcbiAgICAgIH0gZWxzZSB7IC8vIHVzZSBKU09OLnN0cmluZ2lmeSAoc29tZXRpbWVzIHRvU3RyaW5nIGNhbiBiZSBiZXR0ZXIgYnV0IHdlIGRvbid0IGtub3cpXG4gICAgICAgIHJldHVybiB2YWx1ZS5jb25zdHJ1Y3Rvci5uYW1lICsgJyAnXG4gICAgICAgICAgICAgKyBlbGxpcHNpcyhKU09OLnN0cmluZ2lmeSh2YWx1ZSksIG1heExlbmd0aCk7XG4gICAgICB9XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiB0eXBlICsgJzogJyArIHZhbHVlLnRvU3RyaW5nKCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2VxdWVuY2VHb3RWYWx1ZShzZXF1ZW5jZSkge1xuICB0cnkge1xuICAgIHJldHVybiAnIEdvdCAnICsgdG9EZWJ1Z1N0cihzZXF1ZW5jZSk7XG4gIH0gY2F0Y2goZSkge1xuICAgIHJldHVybiAnJ1xuICB9XG59XG5cbmNvbnN0IGJhZFNlcXVlbmNlRXJyb3IgPSBmdW5jdGlvbiAoc2VxdWVuY2UpIHtcbiAgcmV0dXJuIG5ldyBFcnJvcihcInt7I2VhY2h9fSBjdXJyZW50bHkgb25seSBhY2NlcHRzIFwiICtcbiAgICAgICAgICAgICAgICAgICBcImFycmF5cywgY3Vyc29ycywgaXRlcmFibGVzIG9yIGZhbHNleSB2YWx1ZXMuXCIgK1xuICAgICAgICAgICAgICAgICAgIHNlcXVlbmNlR290VmFsdWUoc2VxdWVuY2UpKTtcbn07XG5cbmNvbnN0IGlzRnVuY3Rpb24gPSAoZnVuYykgPT4ge1xuICByZXR1cm4gdHlwZW9mIGZ1bmMgPT09IFwiZnVuY3Rpb25cIjtcbn1cblxuY29uc3QgaXNTdG9yZUN1cnNvciA9IGZ1bmN0aW9uIChjdXJzb3IpIHtcbiAgcmV0dXJuIGN1cnNvciAmJiBpc09iamVjdChjdXJzb3IpICYmXG4gICAgaXNGdW5jdGlvbihjdXJzb3Iub2JzZXJ2ZSkgJiYgaXNGdW5jdGlvbihjdXJzb3IuZmV0Y2gpO1xufTtcblxuLy8gQ2FsY3VsYXRlcyB0aGUgZGlmZmVyZW5jZXMgYmV0d2VlbiBgbGFzdFNlcUFycmF5YCBhbmRcbi8vIGBzZXFBcnJheWAgYW5kIGNhbGxzIGFwcHJvcHJpYXRlIGZ1bmN0aW9ucyBmcm9tIGBjYWxsYmFja3NgLlxuLy8gUmV1c2VzIE1pbmltb25nbydzIGRpZmYgYWxnb3JpdGhtIGltcGxlbWVudGF0aW9uLlxuY29uc3QgZGlmZkFycmF5ID0gZnVuY3Rpb24gKGxhc3RTZXFBcnJheSwgc2VxQXJyYXksIGNhbGxiYWNrcykge1xuICB2YXIgZGlmZkZuID0gUGFja2FnZVsnZGlmZi1zZXF1ZW5jZSddLkRpZmZTZXF1ZW5jZS5kaWZmUXVlcnlPcmRlcmVkQ2hhbmdlcztcbiAgdmFyIG9sZElkT2JqZWN0cyA9IFtdO1xuICB2YXIgbmV3SWRPYmplY3RzID0gW107XG4gIHZhciBwb3NPbGQgPSB7fTsgLy8gbWFwcyBmcm9tIGlkU3RyaW5naWZ5J2QgaWRzXG4gIHZhciBwb3NOZXcgPSB7fTsgLy8gZGl0dG9cbiAgdmFyIHBvc0N1ciA9IHt9O1xuICB2YXIgbGVuZ3RoQ3VyID0gbGFzdFNlcUFycmF5Lmxlbmd0aDtcblxuICBzZXFBcnJheS5mb3JFYWNoKGZ1bmN0aW9uIChkb2MsIGkpIHtcbiAgICBuZXdJZE9iamVjdHMucHVzaCh7X2lkOiBkb2MuX2lkfSk7XG4gICAgcG9zTmV3W2lkU3RyaW5naWZ5KGRvYy5faWQpXSA9IGk7XG4gIH0pO1xuICBsYXN0U2VxQXJyYXkuZm9yRWFjaChmdW5jdGlvbiAoZG9jLCBpKSB7XG4gICAgb2xkSWRPYmplY3RzLnB1c2goe19pZDogZG9jLl9pZH0pO1xuICAgIHBvc09sZFtpZFN0cmluZ2lmeShkb2MuX2lkKV0gPSBpO1xuICAgIHBvc0N1cltpZFN0cmluZ2lmeShkb2MuX2lkKV0gPSBpO1xuICB9KTtcblxuICAvLyBBcnJheXMgY2FuIGNvbnRhaW4gYXJiaXRyYXJ5IG9iamVjdHMuIFdlIGRvbid0IGRpZmYgdGhlXG4gIC8vIG9iamVjdHMuIEluc3RlYWQgd2UgYWx3YXlzIGZpcmUgJ2NoYW5nZWRBdCcgY2FsbGJhY2sgb24gZXZlcnlcbiAgLy8gb2JqZWN0LiBUaGUgY29uc3VtZXIgb2YgYG9ic2VydmUtc2VxdWVuY2VgIHNob3VsZCBkZWFsIHdpdGhcbiAgLy8gaXQgYXBwcm9wcmlhdGVseS5cbiAgZGlmZkZuKG9sZElkT2JqZWN0cywgbmV3SWRPYmplY3RzLCB7XG4gICAgYWRkZWRCZWZvcmU6IGZ1bmN0aW9uIChpZCwgZG9jLCBiZWZvcmUpIHtcbiAgICAgIHZhciBwb3NpdGlvbiA9IGJlZm9yZSA/IHBvc0N1cltpZFN0cmluZ2lmeShiZWZvcmUpXSA6IGxlbmd0aEN1cjtcblxuICAgICAgaWYgKGJlZm9yZSkge1xuICAgICAgICAvLyBJZiBub3QgYWRkaW5nIGF0IHRoZSBlbmQsIHdlIG5lZWQgdG8gdXBkYXRlIGluZGV4ZXMuXG4gICAgICAgIC8vIFhYWCB0aGlzIGNhbiBzdGlsbCBiZSBpbXByb3ZlZCBncmVhdGx5IVxuICAgICAgICBPYmplY3QuZW50cmllcyhwb3NDdXIpLmZvckVhY2goZnVuY3Rpb24gKFtpZCwgcG9zXSkge1xuICAgICAgICAgIGlmIChwb3MgPj0gcG9zaXRpb24pXG4gICAgICAgICAgICBwb3NDdXJbaWRdKys7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBsZW5ndGhDdXIrKztcbiAgICAgIHBvc0N1cltpZFN0cmluZ2lmeShpZCldID0gcG9zaXRpb247XG5cbiAgICAgIGNhbGxiYWNrcy5hZGRlZEF0KFxuICAgICAgICBpZCxcbiAgICAgICAgc2VxQXJyYXlbcG9zTmV3W2lkU3RyaW5naWZ5KGlkKV1dLml0ZW0sXG4gICAgICAgIHBvc2l0aW9uLFxuICAgICAgICBiZWZvcmUpO1xuICAgIH0sXG4gICAgbW92ZWRCZWZvcmU6IGZ1bmN0aW9uIChpZCwgYmVmb3JlKSB7XG4gICAgICBpZiAoaWQgPT09IGJlZm9yZSlcbiAgICAgICAgcmV0dXJuO1xuXG4gICAgICB2YXIgb2xkUG9zaXRpb24gPSBwb3NDdXJbaWRTdHJpbmdpZnkoaWQpXTtcbiAgICAgIHZhciBuZXdQb3NpdGlvbiA9IGJlZm9yZSA/IHBvc0N1cltpZFN0cmluZ2lmeShiZWZvcmUpXSA6IGxlbmd0aEN1cjtcblxuICAgICAgLy8gTW92aW5nIHRoZSBpdGVtIGZvcndhcmQuIFRoZSBuZXcgZWxlbWVudCBpcyBsb3Npbmcgb25lIHBvc2l0aW9uIGFzIGl0XG4gICAgICAvLyB3YXMgcmVtb3ZlZCBmcm9tIHRoZSBvbGQgcG9zaXRpb24gYmVmb3JlIGJlaW5nIGluc2VydGVkIGF0IHRoZSBuZXdcbiAgICAgIC8vIHBvc2l0aW9uLlxuICAgICAgLy8gRXguOiAgIDAgICoxKiAgMiAgIDMgICA0XG4gICAgICAvLyAgICAgICAgMCAgIDIgICAzICAqMSogIDRcbiAgICAgIC8vIFRoZSBvcmlnaW5hbCBpc3N1ZWQgY2FsbGJhY2sgaXMgXCIxXCIgYmVmb3JlIFwiNFwiLlxuICAgICAgLy8gVGhlIHBvc2l0aW9uIG9mIFwiMVwiIGlzIDEsIHRoZSBwb3NpdGlvbiBvZiBcIjRcIiBpcyA0LlxuICAgICAgLy8gVGhlIGdlbmVyYXRlZCBtb3ZlIGlzICgxKSAtPiAoMylcbiAgICAgIGlmIChuZXdQb3NpdGlvbiA+IG9sZFBvc2l0aW9uKSB7XG4gICAgICAgIG5ld1Bvc2l0aW9uLS07XG4gICAgICB9XG5cbiAgICAgIC8vIEZpeCB1cCB0aGUgcG9zaXRpb25zIG9mIGVsZW1lbnRzIGJldHdlZW4gdGhlIG9sZCBhbmQgdGhlIG5ldyBwb3NpdGlvbnNcbiAgICAgIC8vIG9mIHRoZSBtb3ZlZCBlbGVtZW50LlxuICAgICAgLy9cbiAgICAgIC8vIFRoZXJlIGFyZSB0d28gY2FzZXM6XG4gICAgICAvLyAgIDEuIFRoZSBlbGVtZW50IGlzIG1vdmVkIGZvcndhcmQuIFRoZW4gYWxsIHRoZSBwb3NpdGlvbnMgaW4gYmV0d2VlblxuICAgICAgLy8gICBhcmUgbW92ZWQgYmFjay5cbiAgICAgIC8vICAgMi4gVGhlIGVsZW1lbnQgaXMgbW92ZWQgYmFjay4gVGhlbiB0aGUgcG9zaXRpb25zIGluIGJldHdlZW4gKmFuZCogdGhlXG4gICAgICAvLyAgIGVsZW1lbnQgdGhhdCBpcyBjdXJyZW50bHkgc3RhbmRpbmcgb24gdGhlIG1vdmVkIGVsZW1lbnQncyBmdXR1cmVcbiAgICAgIC8vICAgcG9zaXRpb24gYXJlIG1vdmVkIGZvcndhcmQuXG4gICAgICBPYmplY3QuZW50cmllcyhwb3NDdXIpLmZvckVhY2goZnVuY3Rpb24gKFtpZCwgZWxDdXJQb3NpdGlvbl0pIHtcbiAgICAgICAgaWYgKG9sZFBvc2l0aW9uIDwgZWxDdXJQb3NpdGlvbiAmJiBlbEN1clBvc2l0aW9uIDwgbmV3UG9zaXRpb24pXG4gICAgICAgICAgcG9zQ3VyW2lkXS0tO1xuICAgICAgICBlbHNlIGlmIChuZXdQb3NpdGlvbiA8PSBlbEN1clBvc2l0aW9uICYmIGVsQ3VyUG9zaXRpb24gPCBvbGRQb3NpdGlvbilcbiAgICAgICAgICBwb3NDdXJbaWRdKys7XG4gICAgICB9KTtcblxuICAgICAgLy8gRmluYWxseSwgdXBkYXRlIHRoZSBwb3NpdGlvbiBvZiB0aGUgbW92ZWQgZWxlbWVudC5cbiAgICAgIHBvc0N1cltpZFN0cmluZ2lmeShpZCldID0gbmV3UG9zaXRpb247XG5cbiAgICAgIGNhbGxiYWNrcy5tb3ZlZFRvKFxuICAgICAgICBpZCxcbiAgICAgICAgc2VxQXJyYXlbcG9zTmV3W2lkU3RyaW5naWZ5KGlkKV1dLml0ZW0sXG4gICAgICAgIG9sZFBvc2l0aW9uLFxuICAgICAgICBuZXdQb3NpdGlvbixcbiAgICAgICAgYmVmb3JlKTtcbiAgICB9LFxuICAgIHJlbW92ZWQ6IGZ1bmN0aW9uIChpZCkge1xuICAgICAgdmFyIHByZXZQb3NpdGlvbiA9IHBvc0N1cltpZFN0cmluZ2lmeShpZCldO1xuXG4gICAgICBPYmplY3QuZW50cmllcyhwb3NDdXIpLmZvckVhY2goZnVuY3Rpb24gKFtpZCwgcG9zXSkge1xuICAgICAgICBpZiAocG9zID49IHByZXZQb3NpdGlvbilcbiAgICAgICAgICBwb3NDdXJbaWRdLS07XG4gICAgICB9KTtcblxuICAgICAgZGVsZXRlIHBvc0N1cltpZFN0cmluZ2lmeShpZCldO1xuICAgICAgbGVuZ3RoQ3VyLS07XG5cbiAgICAgIGNhbGxiYWNrcy5yZW1vdmVkQXQoXG4gICAgICAgIGlkLFxuICAgICAgICBsYXN0U2VxQXJyYXlbcG9zT2xkW2lkU3RyaW5naWZ5KGlkKV1dLml0ZW0sXG4gICAgICAgIHByZXZQb3NpdGlvbik7XG4gICAgfVxuICB9KTtcbiAgXG4gIE9iamVjdC5lbnRyaWVzKHBvc05ldykuZm9yRWFjaChmdW5jdGlvbiAoW2lkU3RyaW5nLCBwb3NdKSB7XG5cbiAgICB2YXIgaWQgPSBpZFBhcnNlKGlkU3RyaW5nKTtcbiAgICBcbiAgICBpZiAoaGFzKHBvc09sZCwgaWRTdHJpbmcpKSB7XG4gICAgICAvLyBzcGVjaWZpY2FsbHkgZm9yIHByaW1pdGl2ZSB0eXBlcywgY29tcGFyZSBlcXVhbGl0eSBiZWZvcmVcbiAgICAgIC8vIGZpcmluZyB0aGUgJ2NoYW5nZWRBdCcgY2FsbGJhY2suIG90aGVyd2lzZSwgYWx3YXlzIGZpcmUgaXRcbiAgICAgIC8vIGJlY2F1c2UgZG9pbmcgYSBkZWVwIEVKU09OIGNvbXBhcmlzb24gaXMgbm90IGd1YXJhbnRlZWQgdG9cbiAgICAgIC8vIHdvcmsgKGFuIGFycmF5IGNhbiBjb250YWluIGFyYml0cmFyeSBvYmplY3RzLCBhbmQgJ3RyYW5zZm9ybSdcbiAgICAgIC8vIGNhbiBiZSB1c2VkIG9uIGN1cnNvcnMpLiBhbHNvLCBkZWVwIGRpZmZpbmcgaXMgbm90XG4gICAgICAvLyBuZWNlc3NhcmlseSB0aGUgbW9zdCBlZmZpY2llbnQgKGlmIG9ubHkgYSBzcGVjaWZpYyBzdWJmaWVsZFxuICAgICAgLy8gb2YgdGhlIG9iamVjdCBpcyBsYXRlciBhY2Nlc3NlZCkuXG4gICAgICB2YXIgbmV3SXRlbSA9IHNlcUFycmF5W3Bvc10uaXRlbTtcbiAgICAgIHZhciBvbGRJdGVtID0gbGFzdFNlcUFycmF5W3Bvc09sZFtpZFN0cmluZ11dLml0ZW07XG5cbiAgICAgIGlmICh0eXBlb2YgbmV3SXRlbSA9PT0gJ29iamVjdCcgfHwgbmV3SXRlbSAhPT0gb2xkSXRlbSlcbiAgICAgICAgICBjYWxsYmFja3MuY2hhbmdlZEF0KGlkLCBuZXdJdGVtLCBvbGRJdGVtLCBwb3MpO1xuICAgICAgfVxuICB9KTtcbn07XG5cbnNlcUNoYW5nZWRUb0VtcHR5ID0gZnVuY3Rpb24gKGxhc3RTZXFBcnJheSwgY2FsbGJhY2tzKSB7XG4gIHJldHVybiBbXTtcbn07XG5cbnNlcUNoYW5nZWRUb0FycmF5ID0gZnVuY3Rpb24gKGxhc3RTZXFBcnJheSwgYXJyYXksIGNhbGxiYWNrcykge1xuICB2YXIgaWRzVXNlZCA9IHt9O1xuICB2YXIgc2VxQXJyYXkgPSBhcnJheS5tYXAoZnVuY3Rpb24gKGl0ZW0sIGluZGV4KSB7XG4gICAgdmFyIGlkO1xuICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIC8vIGVuc3VyZSBub3QgZW1wdHksIHNpbmNlIG90aGVyIGxheWVycyAoZWcgRG9tUmFuZ2UpIGFzc3VtZSB0aGlzIGFzIHdlbGxcbiAgICAgIGlkID0gXCItXCIgKyBpdGVtO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInIHx8XG4gICAgICAgICAgICAgICB0eXBlb2YgaXRlbSA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgICAgICAgICBpdGVtID09PSB1bmRlZmluZWQgfHxcbiAgICAgICAgICAgICAgIGl0ZW0gPT09IG51bGwpIHtcbiAgICAgIGlkID0gaXRlbTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBpdGVtID09PSAnb2JqZWN0Jykge1xuICAgICAgaWQgPSAoaXRlbSAmJiAoJ19pZCcgaW4gaXRlbSkpID8gaXRlbS5faWQgOiBpbmRleDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwie3sjZWFjaH19IGRvZXNuJ3Qgc3VwcG9ydCBhcnJheXMgd2l0aCBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgXCJlbGVtZW50cyBvZiB0eXBlIFwiICsgdHlwZW9mIGl0ZW0pO1xuICAgIH1cblxuICAgIHZhciBpZFN0cmluZyA9IGlkU3RyaW5naWZ5KGlkKTtcbiAgICBpZiAoaWRzVXNlZFtpZFN0cmluZ10pIHtcbiAgICAgIGlmIChpdGVtICYmIHR5cGVvZiBpdGVtID09PSAnb2JqZWN0JyAmJiAnX2lkJyBpbiBpdGVtKVxuICAgICAgICB3YXJuKFwiZHVwbGljYXRlIGlkIFwiICsgaWQgKyBcIiBpblwiLCBhcnJheSk7XG4gICAgICBpZCA9IFJhbmRvbS5pZCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZHNVc2VkW2lkU3RyaW5nXSA9IHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgX2lkOiBpZCwgaXRlbTogaXRlbSB9O1xuICB9KTtcblxuICByZXR1cm4gc2VxQXJyYXk7XG59O1xuXG5zZXFDaGFuZ2VkVG9DdXJzb3IgPSBmdW5jdGlvbiAobGFzdFNlcUFycmF5LCBjdXJzb3IsIGNhbGxiYWNrcykge1xuICB2YXIgaW5pdGlhbCA9IHRydWU7IC8vIGFyZSB3ZSBvYnNlcnZpbmcgaW5pdGlhbCBkYXRhIGZyb20gY3Vyc29yP1xuICB2YXIgc2VxQXJyYXkgPSBbXTtcblxuICB2YXIgb2JzZXJ2ZUhhbmRsZSA9IGN1cnNvci5vYnNlcnZlKHtcbiAgICBhZGRlZEF0OiBmdW5jdGlvbiAoZG9jdW1lbnQsIGF0SW5kZXgsIGJlZm9yZSkge1xuICAgICAgaWYgKGluaXRpYWwpIHtcbiAgICAgICAgLy8ga2VlcCB0cmFjayBvZiBpbml0aWFsIGRhdGEgc28gdGhhdCB3ZSBjYW4gZGlmZiBvbmNlXG4gICAgICAgIC8vIHdlIGV4aXQgYG9ic2VydmVgLlxuICAgICAgICBpZiAoYmVmb3JlICE9PSBudWxsKVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkV4cGVjdGVkIGluaXRpYWwgZGF0YSBmcm9tIG9ic2VydmUgaW4gb3JkZXJcIik7XG4gICAgICAgIHNlcUFycmF5LnB1c2goeyBfaWQ6IGRvY3VtZW50Ll9pZCwgaXRlbTogZG9jdW1lbnQgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjYWxsYmFja3MuYWRkZWRBdChkb2N1bWVudC5faWQsIGRvY3VtZW50LCBhdEluZGV4LCBiZWZvcmUpO1xuICAgICAgfVxuICAgIH0sXG4gICAgY2hhbmdlZEF0OiBmdW5jdGlvbiAobmV3RG9jdW1lbnQsIG9sZERvY3VtZW50LCBhdEluZGV4KSB7XG4gICAgICBjYWxsYmFja3MuY2hhbmdlZEF0KG5ld0RvY3VtZW50Ll9pZCwgbmV3RG9jdW1lbnQsIG9sZERvY3VtZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICBhdEluZGV4KTtcbiAgICB9LFxuICAgIHJlbW92ZWRBdDogZnVuY3Rpb24gKG9sZERvY3VtZW50LCBhdEluZGV4KSB7XG4gICAgICBjYWxsYmFja3MucmVtb3ZlZEF0KG9sZERvY3VtZW50Ll9pZCwgb2xkRG9jdW1lbnQsIGF0SW5kZXgpO1xuICAgIH0sXG4gICAgbW92ZWRUbzogZnVuY3Rpb24gKGRvY3VtZW50LCBmcm9tSW5kZXgsIHRvSW5kZXgsIGJlZm9yZSkge1xuICAgICAgY2FsbGJhY2tzLm1vdmVkVG8oXG4gICAgICAgIGRvY3VtZW50Ll9pZCwgZG9jdW1lbnQsIGZyb21JbmRleCwgdG9JbmRleCwgYmVmb3JlKTtcbiAgICB9XG4gIH0pO1xuICBpbml0aWFsID0gZmFsc2U7XG5cbiAgcmV0dXJuIFtzZXFBcnJheSwgb2JzZXJ2ZUhhbmRsZV07XG59O1xuIl19
