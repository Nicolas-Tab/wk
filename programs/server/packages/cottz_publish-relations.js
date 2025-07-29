(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var check = Package.check.check;
var Match = Package.check.Match;
var DDPServer = Package['ddp-server'].DDPServer;
var _ = Package.underscore._;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;
var DDP = Package['ddp-client'].DDP;

/* Package-scope variables */
var PublishRelations, callbacks, collection, onAdded;

var require = meteorInstall({"node_modules":{"meteor":{"cottz:publish-relations":{"lib":{"server":{"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/cottz_publish-relations/lib/server/index.js                                                        //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
let PublishRelations;
module.link("./publish_relations", {
  default(v) {
    PublishRelations = v;
  }
}, 0);
module.link("./methods");
module.exportDefault(PublishRelations);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"handler_controller.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/cottz_publish-relations/lib/server/handler_controller.js                                           //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
module.export({
  default: () => HandlerController
});
let _;
module.link("meteor/underscore", {
  _(v) {
    _ = v;
  }
}, 0);
class HandlerController {
  constructor() {
    this.handlers = {};
  }
  set(handler) {
    return this.handler = handler;
  }
  addBasic(collection, handler) {
    const oldHandler = this.handlers[collection];
    return oldHandler || (this.handlers[collection] = handler || new HandlerController());
  }
  add(cursor, options) {
    if (!cursor) throw new Error("you're not sending the cursor");
    const description = cursor._cursorDescription;
    const collection = options.collection || description.collectionName;
    const selector = description.selector;
    /*
      the selector uses references, in cases that a selector has objects inside
      this validation isn't gonna work
     let oldHandler = this.handlers[collection];
    if (oldHandler) {
      // when the selector equals method stops running, no change occurs and everything
      // will still work properly without running the same observer again
      oldHandler.equalSelector = _.isEqual(oldHandler.selector, selector);
      if (oldHandler.equalSelector)
        return oldHandler;
       oldHandler.stop();
    }*/

    const newHandler = options.handler ? cursor[options.handler](options.callbacks) : new HandlerController();
    newHandler.selector = selector;
    return this.handlers[collection] = newHandler;
  }
  stop() {
    let handlers = this.handlers;
    this.handler && this.handler.stop();
    for (let key in handlers) {
      handlers[key].stop();
    }
    ;
    this.handlers = [];
  }
  remove(_id) {
    let handler = this.handlers[_id];
    if (handler) {
      handler.stop();
      delete this.handlers[_id];
    }
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/cottz_publish-relations/lib/server/methods.js                                                      //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 0);
let check, Match;
module.link("meteor/check", {
  check(v) {
    check = v;
  },
  Match(v) {
    Match = v;
  }
}, 1);
let DDPServer;
module.link("meteor/ddp-server", {
  DDPServer(v) {
    DDPServer = v;
  }
}, 2);
const crossbar = DDPServer._InvalidationCrossbar;
Meteor.methods({
  'PR.changePagination'(data) {
    check(data, {
      _id: String,
      field: String,
      skip: Match.Integer
    });
    crossbar.fire(_.extend({
      collection: 'paginations',
      id: this.connection.id
    }, data));
  },
  'PR.fireListener'(collection, options) {
    check(collection, String);
    check(options, Object);
    crossbar.fire(_.extend({
      collection: 'listen-' + collection,
      id: this.connection.id
    }, options));
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publish_relations.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/cottz_publish-relations/lib/server/publish_relations.js                                            //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
module.export({
  PublishRelations: () => PublishRelations
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 0);
let HandlerController;
module.link("./handler_controller", {
  default(v) {
    HandlerController = v;
  }
}, 1);
let CursorMethods;
module.link("./cursor", {
  default(v) {
    CursorMethods = v;
  }
}, 2);
module.runSetters(PublishRelations = function (name, callback) {
  return Meteor.publish(name, function () {
    let handler = new HandlerController(),
      cursors = new CursorMethods(this, handler);
    this._publicationName = name;
    this.onStop(() => handler.stop());
    for (var _len = arguments.length, params = new Array(_len), _key = 0; _key < _len; _key++) {
      params[_key] = arguments[_key];
    }
    let cb = callback.apply(_.extend(cursors, this), params);
    // kadira show me alerts when I use this return (but works well)
    // return cb || (!this._ready && this.ready());
    return cb;
  });
}, ["PublishRelations"]);
Meteor.publishRelations = PublishRelations;
module.exportDefault(PublishRelations);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"cursor":{"change_parent_doc.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/cottz_publish-relations/lib/server/cursor/change_parent_doc.js                                     //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
let CursorMethods;
module.link("./cursor", {
  default(v) {
    CursorMethods = v;
  }
}, 0);
// DEPRECATED
// designed to change something in the master document while the callbacks are executed
// changes to the document are sent to the main document with the return of the callbacks
CursorMethods.prototype.changeParentDoc = function (cursor, callbacks, onRemoved) {
  const sub = this.sub;
  const _id = this._id;
  const collection = this.collection;
  let result = this;
  if (!_id || !collection) throw new Error("you can't use this method without being within a document");
  callbacks = this._getCallbacks(callbacks, onRemoved);
  this.handler.add(cursor, {
    handler: 'observeChanges',
    callbacks: {
      added(id, doc) {
        result._addedWithCPD = callbacks.added(id, doc);
      },
      changed(id, doc) {
        var changes = callbacks.changed(id, doc);
        if (changes) sub.changed(collection, _id, changes);
      },
      removed(id) {
        var changes = callbacks.removed(id);
        if (changes) sub.changed(collection, _id, changes);
      }
    }
  });
  return result._addedWithCPD || {};
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"crossbar.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/cottz_publish-relations/lib/server/cursor/crossbar.js                                              //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
let _;
module.link("meteor/underscore", {
  _(v) {
    _ = v;
  }
}, 0);
let CursorMethods;
module.link("./cursor", {
  default(v) {
    CursorMethods = v;
  }
}, 1);
let DDPServer;
module.link("meteor/ddp-server", {
  DDPServer(v) {
    DDPServer = v;
  }
}, 2);
const crossbar = DDPServer._InvalidationCrossbar;
// designed to paginate a list, works in conjunction with the methods
// do not call back to the main callback, only the array is changed in the collection
CursorMethods.prototype.paginate = function (fieldData, limit, infinite) {
  const sub = this.sub;
  const collection = this.collection;
  if (!this._id || !collection) throw new Error("you can't use this method without being within a document");
  const field = Object.keys(fieldData)[0];
  const copy = _.clone(fieldData)[field];
  const max = copy.length;
  const connectionId = sub.connection.id;
  fieldData[field] = copy.slice(0, limit);
  const listener = crossbar.listen({
    collection: 'paginations',
    id: connectionId
  }, data => {
    if (!data.id || data.id !== connectionId) return;
    let skip = data.skip;
    if (skip >= max && !infinite) return;
    fieldData[field] = infinite ? copy.slice(0, skip) : copy.slice(skip, skip + limit);
    sub.changed(collection, data._id, fieldData);
  });
  this.handler.addBasic(field, listener);
  return fieldData[field];
};
CursorMethods.prototype.listen = function (options, callback, run) {
  const sub = this.sub;
  const name = 'listen-' + this._publicationName;
  const listener = crossbar.listen({
    collection: name,
    id: sub.connection.id
  }, data => {
    if (!data.id || data.id !== sub.connection.id) return;
    _.extend(options, _.omit(data, 'collection', 'id'));
    callback(false);
  });
  const handler = this.handler.addBasic(name);
  if (run !== false) callback(true);
  return handler.set(listener);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"cursor.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/cottz_publish-relations/lib/server/cursor/cursor.js                                                //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
module.export({
  default: () => CursorMethods
});
let _;
module.link("meteor/underscore", {
  _(v) {
    _ = v;
  }
}, 0);
let CursorMethodsNR;
module.link("./nonreactive", {
  default(v) {
    CursorMethodsNR = v;
  }
}, 1);
class CursorMethods extends CursorMethodsNR {
  constructor(sub, handler, _id, collection) {
    super(sub);
    this.handler = handler;
    this._id = _id;
    this.collection = collection;
  }
  cursor(cursor, collection, callbacks) {
    const sub = this.sub;
    if (!_.isString(collection)) {
      callbacks = collection;
      collection = cursor._getCollectionName();
    }
    const handler = this.handler.add(cursor, {
      collection: collection
    });
    // if (handler.equalSelector)
    //   return handler;

    if (callbacks) callbacks = this._getCallbacks(callbacks);
    function applyCallback(id, doc, method) {
      const cb = callbacks && callbacks[method];
      if (cb) {
        let methods = new CursorMethods(sub, handler.addBasic(id), id, collection),
          isChanged = method === 'changed';
        return cb.call(methods, id, doc, isChanged) || doc;
      } else return doc;
    }
    ;
    let observeChanges = cursor.observeChanges({
      added(id, doc) {
        sub.added(collection, id, applyCallback(id, doc, 'added'));
      },
      changed(id, doc) {
        sub.changed(collection, id, applyCallback(id, doc, 'changed'));
      },
      removed(id) {
        if (callbacks) {
          callbacks.removed(id);
          handler.remove(id);
        }
        sub.removed(collection, id);
      }
    });
    return handler.set(observeChanges);
  }
}
;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/cottz_publish-relations/lib/server/cursor/index.js                                                 //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
let CursorMethods;
module.link("./cursor", {
  default(v) {
    CursorMethods = v;
  }
}, 0);
module.link("./join");
module.link("./observe");
module.link("./change_parent_doc");
module.link("./crossbar");
module.link("./utils");
module.exportDefault(CursorMethods);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"join.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/cottz_publish-relations/lib/server/cursor/join.js                                                  //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
let _;
module.link("meteor/underscore", {
  _(v) {
    _ = v;
  }
}, 0);
let CursorMethods;
module.link("./cursor", {
  default(v) {
    CursorMethods = v;
  }
}, 1);
CursorMethods.prototype.join = function () {
  for (var _len = arguments.length, params = new Array(_len), _key = 0; _key < _len; _key++) {
    params[_key] = arguments[_key];
  }
  return new CursorJoin(this, ...params);
};
class CursorJoin {
  constructor(methods, collection, options, name) {
    this.methods = methods;
    this.collection = collection;
    this.options = options;
    this.name = name;
    this.data = [];
    this.sent = false;
  }
  push() {
    let changed;
    for (var _len2 = arguments.length, _ids = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      _ids[_key2] = arguments[_key2];
    }
    _.each(_ids, _id => {
      if (!_id || _.contains(this.data, _id)) return;
      this.data.push(_id);
      changed = true;
    });
    if (this.sent && changed) return this._cursor();
  }
  send() {
    this.sent = true;
    if (!this.data.length) return;
    return this._cursor();
  }
  _selector() {
    let _id = {
      $in: this.data
    };
    return _.isFunction(this.selector) ? this.selector(_id) : {
      _id: _id
    };
  }
  _cursor() {
    return this.methods.cursor(this.collection.find(this._selector(), this.options), this.name);
  }
}
;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"observe.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/cottz_publish-relations/lib/server/cursor/observe.js                                               //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
let CursorMethods;
module.link("./cursor", {
  default(v) {
    CursorMethods = v;
  }
}, 0);
CursorMethods.prototype.observe = function (cursor, callbacks) {
  this.handler.add(cursor, {
    handler: 'observe',
    callbacks: callbacks
  });
};
CursorMethods.prototype.observeChanges = function (cursor, callbacks) {
  this.handler.add(cursor, {
    handler: 'observeChanges',
    callbacks: callbacks
  });
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"utils.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/cottz_publish-relations/lib/server/cursor/utils.js                                                 //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
let _;
module.link("meteor/underscore", {
  _(v) {
    _ = v;
  }
}, 0);
let CursorMethods;
module.link("./cursor", {
  default(v) {
    CursorMethods = v;
  }
}, 1);
function getCB(cb, method) {
  var callback = cb[method];
  if (callback && !_.isFunction(callback)) throw new Error(method + ' should be a function or undefined');
  return callback || function () {};
}
;
CursorMethods.prototype._getCallbacks = function (cb, onRemoved) {
  if (_.isFunction(cb)) {
    return {
      added: cb,
      changed: cb,
      removed: getCB({
        onRemoved: onRemoved
      }, 'onRemoved')
    };
  }
  return {
    added: getCB(cb, 'added'),
    changed: getCB(cb, 'changed'),
    removed: getCB(cb, 'removed')
  };
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"nonreactive":{"cursor.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/cottz_publish-relations/lib/server/cursor/nonreactive/cursor.js                                    //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
module.export({
  default: () => CursorMethodsNR
});
let _;
module.link("meteor/underscore", {
  _(v) {
    _ = v;
  }
}, 0);
class CursorMethodsNR {
  constructor(sub) {
    this.sub = sub;
  }
  cursorNonreactive(cursor, collection, onAdded) {
    const sub = this.sub;
    if (!_.isString(collection)) {
      onAdded = collection;
      collection = cursor._getCollectionName();
    }
    if (!_.isFunction(onAdded)) onAdded = function () {};
    cursor.forEach(doc => {
      let _id = doc._id;
      sub.added(collection, _id, onAdded.call(new CursorMethodsNR(sub), _id, doc) || doc);
    });
  }
}
;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/cottz_publish-relations/lib/server/cursor/nonreactive/index.js                                     //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
let CursorMethodsNR;
module.link("./cursor", {
  default(v) {
    CursorMethodsNR = v;
  }
}, 0);
module.link("./join");
module.exportDefault(CursorMethodsNR);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"join.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/cottz_publish-relations/lib/server/cursor/nonreactive/join.js                                      //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
let _;
module.link("meteor/underscore", {
  _(v) {
    _ = v;
  }
}, 0);
let CursorMethodsNR;
module.link("./cursor", {
  default(v) {
    CursorMethodsNR = v;
  }
}, 1);
CursorMethodsNR.prototype.joinNonreactive = function () {
  for (var _len = arguments.length, params = new Array(_len), _key = 0; _key < _len; _key++) {
    params[_key] = arguments[_key];
  }
  return new CursorJoinNonreactive(this.sub, ...params);
};
class CursorJoinNonreactive {
  constructor(sub, collection, options, name) {
    this.sub = sub;
    this.collection = collection;
    this.options = options;
    this.name = name || collection._name;
    this.data = [];
    this.sent = false;
  }
  _selector() {
    let _id = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
      $in: this.data
    };
    return _.isFunction(this.selector) ? this.selector(_id) : {
      _id: _id
    };
  }
  push() {
    let newIds = [];
    for (var _len2 = arguments.length, _ids = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      _ids[_key2] = arguments[_key2];
    }
    _.each(_ids, _id => {
      if (!_id || _.contains(this.data, _id)) return;
      this.data.push(_id);
      newIds.push(_id);
    });
    if (this.sent && newIds.length) return this.added(newIds.length > 1 ? {
      $in: newIds
    } : newIds[0]);
  }
  send() {
    this.sent = true;
    if (!this.data.length) return;
    return this.added();
  }
  added(_id) {
    this.collection.find(this._selector(_id), this.options).forEach(doc => {
      this.sub.added(this.name, doc._id, _.omit(doc, '_id'));
    });
  }
}
;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/cottz:publish-relations/lib/server/index.js");

/* Exports */
Package._define("cottz:publish-relations", exports, {
  PublishRelations: PublishRelations
});

})();

//# sourceURL=meteor://💻app/packages/cottz_publish-relations.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvY290dHo6cHVibGlzaC1yZWxhdGlvbnMvbGliL3NlcnZlci9pbmRleC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvY290dHo6cHVibGlzaC1yZWxhdGlvbnMvbGliL3NlcnZlci9oYW5kbGVyX2NvbnRyb2xsZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2NvdHR6OnB1Ymxpc2gtcmVsYXRpb25zL2xpYi9zZXJ2ZXIvbWV0aG9kcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvY290dHo6cHVibGlzaC1yZWxhdGlvbnMvbGliL3NlcnZlci9wdWJsaXNoX3JlbGF0aW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvY290dHo6cHVibGlzaC1yZWxhdGlvbnMvbGliL3NlcnZlci9jdXJzb3IvY2hhbmdlX3BhcmVudF9kb2MuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2NvdHR6OnB1Ymxpc2gtcmVsYXRpb25zL2xpYi9zZXJ2ZXIvY3Vyc29yL2Nyb3NzYmFyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9jb3R0ejpwdWJsaXNoLXJlbGF0aW9ucy9saWIvc2VydmVyL2N1cnNvci9jdXJzb3IuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2NvdHR6OnB1Ymxpc2gtcmVsYXRpb25zL2xpYi9zZXJ2ZXIvY3Vyc29yL2luZGV4LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9jb3R0ejpwdWJsaXNoLXJlbGF0aW9ucy9saWIvc2VydmVyL2N1cnNvci9qb2luLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9jb3R0ejpwdWJsaXNoLXJlbGF0aW9ucy9saWIvc2VydmVyL2N1cnNvci9vYnNlcnZlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9jb3R0ejpwdWJsaXNoLXJlbGF0aW9ucy9saWIvc2VydmVyL2N1cnNvci91dGlscy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvY290dHo6cHVibGlzaC1yZWxhdGlvbnMvbGliL3NlcnZlci9jdXJzb3Ivbm9ucmVhY3RpdmUvY3Vyc29yLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9jb3R0ejpwdWJsaXNoLXJlbGF0aW9ucy9saWIvc2VydmVyL2N1cnNvci9ub25yZWFjdGl2ZS9pbmRleC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvY290dHo6cHVibGlzaC1yZWxhdGlvbnMvbGliL3NlcnZlci9jdXJzb3Ivbm9ucmVhY3RpdmUvam9pbi5qcyJdLCJuYW1lcyI6WyJQdWJsaXNoUmVsYXRpb25zIiwibW9kdWxlIiwibGluayIsImRlZmF1bHQiLCJ2IiwiZXhwb3J0RGVmYXVsdCIsImV4cG9ydCIsIkhhbmRsZXJDb250cm9sbGVyIiwiXyIsImNvbnN0cnVjdG9yIiwiaGFuZGxlcnMiLCJzZXQiLCJoYW5kbGVyIiwiYWRkQmFzaWMiLCJjb2xsZWN0aW9uIiwib2xkSGFuZGxlciIsImFkZCIsImN1cnNvciIsIm9wdGlvbnMiLCJFcnJvciIsImRlc2NyaXB0aW9uIiwiX2N1cnNvckRlc2NyaXB0aW9uIiwiY29sbGVjdGlvbk5hbWUiLCJzZWxlY3RvciIsIm5ld0hhbmRsZXIiLCJjYWxsYmFja3MiLCJzdG9wIiwia2V5IiwicmVtb3ZlIiwiX2lkIiwiTWV0ZW9yIiwiY2hlY2siLCJNYXRjaCIsIkREUFNlcnZlciIsImNyb3NzYmFyIiwiX0ludmFsaWRhdGlvbkNyb3NzYmFyIiwibWV0aG9kcyIsIlBSLmNoYW5nZVBhZ2luYXRpb24iLCJkYXRhIiwiU3RyaW5nIiwiZmllbGQiLCJza2lwIiwiSW50ZWdlciIsImZpcmUiLCJleHRlbmQiLCJpZCIsImNvbm5lY3Rpb24iLCJQUi5maXJlTGlzdGVuZXIiLCJPYmplY3QiLCJDdXJzb3JNZXRob2RzIiwicnVuU2V0dGVycyIsIm5hbWUiLCJjYWxsYmFjayIsInB1Ymxpc2giLCJjdXJzb3JzIiwiX3B1YmxpY2F0aW9uTmFtZSIsIm9uU3RvcCIsIl9sZW4iLCJhcmd1bWVudHMiLCJsZW5ndGgiLCJwYXJhbXMiLCJBcnJheSIsIl9rZXkiLCJjYiIsImFwcGx5IiwicHVibGlzaFJlbGF0aW9ucyIsInByb3RvdHlwZSIsImNoYW5nZVBhcmVudERvYyIsIm9uUmVtb3ZlZCIsInN1YiIsInJlc3VsdCIsIl9nZXRDYWxsYmFja3MiLCJhZGRlZCIsImRvYyIsIl9hZGRlZFdpdGhDUEQiLCJjaGFuZ2VkIiwiY2hhbmdlcyIsInJlbW92ZWQiLCJwYWdpbmF0ZSIsImZpZWxkRGF0YSIsImxpbWl0IiwiaW5maW5pdGUiLCJrZXlzIiwiY29weSIsImNsb25lIiwibWF4IiwiY29ubmVjdGlvbklkIiwic2xpY2UiLCJsaXN0ZW5lciIsImxpc3RlbiIsInJ1biIsIm9taXQiLCJDdXJzb3JNZXRob2RzTlIiLCJpc1N0cmluZyIsIl9nZXRDb2xsZWN0aW9uTmFtZSIsImFwcGx5Q2FsbGJhY2siLCJtZXRob2QiLCJpc0NoYW5nZWQiLCJjYWxsIiwib2JzZXJ2ZUNoYW5nZXMiLCJqb2luIiwiQ3Vyc29ySm9pbiIsInNlbnQiLCJwdXNoIiwiX2xlbjIiLCJfaWRzIiwiX2tleTIiLCJlYWNoIiwiY29udGFpbnMiLCJfY3Vyc29yIiwic2VuZCIsIl9zZWxlY3RvciIsIiRpbiIsImlzRnVuY3Rpb24iLCJmaW5kIiwib2JzZXJ2ZSIsImdldENCIiwiY3Vyc29yTm9ucmVhY3RpdmUiLCJvbkFkZGVkIiwiZm9yRWFjaCIsImpvaW5Ob25yZWFjdGl2ZSIsIkN1cnNvckpvaW5Ob25yZWFjdGl2ZSIsIl9uYW1lIiwidW5kZWZpbmVkIiwibmV3SWRzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUlBLGdCQUFnQjtBQUFDQyxNQUFNLENBQUNDLElBQUksQ0FBQyxxQkFBcUIsRUFBQztFQUFDQyxPQUFPQSxDQUFDQyxDQUFDLEVBQUM7SUFBQ0osZ0JBQWdCLEdBQUNJLENBQUM7RUFBQTtBQUFDLENBQUMsRUFBQyxD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LElBQUksQ0FBQzFFLEdBQUcsQ0FBQztNQUNuQitGLE1BQU0sQ0FBQ3JCLElBQUksQ0FBQzFFLEdBQUcsQ0FBQztJQUNsQixDQUFDLENBQUM7SUFFRixJQUFJLElBQUksQ0FBQ3lFLElBQUksSUFBSXNCLE1BQU0sQ0FBQ2pFLE1BQU0sRUFDNUIsT0FBTyxJQUFJLENBQUNhLEtBQUssQ0FBQ29ELE1BQU0sQ0FBQ2pFLE1BQU0sR0FBRyxDQUFDLEdBQUc7TUFBQ3FELEdBQUcsRUFBRVk7SUFBTSxDQUFDLEdBQUVBLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNuRTtFQUNBZCxJQUFJQSxDQUFBLEVBQUk7SUFDTixJQUFJLENBQUNSLElBQUksR0FBRyxJQUFJO0lBQ2hCLElBQUksQ0FBQyxJQUFJLENBQUNoRSxJQUFJLENBQUNxQixNQUFNLEVBQUU7SUFFdkIsT0FBTyxJQUFJLENBQUNhLEtBQUssQ0FBQyxDQUFDO0VBQ3JCO0VBQ0FBLEtBQUtBLENBQUUzQyxHQUFHLEVBQUU7SUFDVixJQUFJLENBQUNmLFVBQVUsQ0FBQ29HLElBQUksQ0FBQyxJQUFJLENBQUNILFNBQVMsQ0FBQ2xGLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQ1gsT0FBTyxDQUFDLENBQUNxRyxPQUFPLENBQUM5QyxHQUFHLElBQUk7TUFDckUsSUFBSSxDQUFDSixHQUFHLENBQUNHLEtBQUssQ0FBQyxJQUFJLENBQUNyQixJQUFJLEVBQUVzQixHQUFHLENBQUM1QyxHQUFHLEVBQUVyQixDQUFDLENBQUNtRixJQUFJLENBQUNsQixHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDeEQsQ0FBQyxDQUFDO0VBQ0o7QUFDRjtBQUFDLEMiLCJmaWxlIjoiL3BhY2thZ2VzL2NvdHR6X3B1Ymxpc2gtcmVsYXRpb25zLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFB1Ymxpc2hSZWxhdGlvbnMgZnJvbSAnLi9wdWJsaXNoX3JlbGF0aW9ucyc7XG5pbXBvcnQgJy4vbWV0aG9kcyc7XG5cbmV4cG9ydCBkZWZhdWx0IFB1Ymxpc2hSZWxhdGlvbnM7IiwiaW1wb3J0IHsgXyB9IGZyb20gJ21ldGVvci91bmRlcnNjb3JlJztcbi8vIFRoZSBhaW0gb2YgaGFuZGxlciBDb250cm9sbGVyIGlzIHRvIGtlZXAgYWxsIG9ic2VydmVycyB0aGF0IGNhbiBiZSBjcmVhdGVkIHdpdGhpbiBtZXRob2RzXG4vLyBpdHMgc3RydWN0dXJlIGlzIHZlcnkgc2ltcGxlLCBoYXMgYSAnaGFuZGxlcnMnIG9iamVjdCBjb250YWluaW5nIGFsbCBvYnNlcnZlcnMgY2hpbGRyZW4gYW5kXG4vLyB0aGUgb2JzZXJ2ZXIgZmF0aGVyIGlzIHN0b3JlZCB3aXRoaW4gJ2hhbmRsZXInXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIYW5kbGVyQ29udHJvbGxlciB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLmhhbmRsZXJzID0ge307XG4gIH1cbiAgc2V0IChoYW5kbGVyKSB7XG4gICAgcmV0dXJuIHRoaXMuaGFuZGxlciA9IGhhbmRsZXI7XG4gIH1cbiAgYWRkQmFzaWMgKGNvbGxlY3Rpb24sIGhhbmRsZXIpIHtcbiAgICBjb25zdCBvbGRIYW5kbGVyID0gdGhpcy5oYW5kbGVyc1tjb2xsZWN0aW9uXTtcbiAgICByZXR1cm4gb2xkSGFuZGxlciB8fCAodGhpcy5oYW5kbGVyc1tjb2xsZWN0aW9uXSA9IGhhbmRsZXIgfHwgbmV3IEhhbmRsZXJDb250cm9sbGVyKCkpO1xuICB9XG4gIGFkZCAoY3Vyc29yLCBvcHRpb25zKSB7XG4gICAgaWYgKCFjdXJzb3IpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ5b3UncmUgbm90IHNlbmRpbmcgdGhlIGN1cnNvclwiKTtcblxuICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gY3Vyc29yLl9jdXJzb3JEZXNjcmlwdGlvbjtcbiAgICBjb25zdCBjb2xsZWN0aW9uID0gb3B0aW9ucy5jb2xsZWN0aW9uIHx8IGRlc2NyaXB0aW9uLmNvbGxlY3Rpb25OYW1lO1xuICAgIGNvbnN0IHNlbGVjdG9yID0gZGVzY3JpcHRpb24uc2VsZWN0b3I7XG4gICAgLypcbiAgICAgIHRoZSBzZWxlY3RvciB1c2VzIHJlZmVyZW5jZXMsIGluIGNhc2VzIHRoYXQgYSBzZWxlY3RvciBoYXMgb2JqZWN0cyBpbnNpZGVcbiAgICAgIHRoaXMgdmFsaWRhdGlvbiBpc24ndCBnb25uYSB3b3JrXG5cbiAgICBsZXQgb2xkSGFuZGxlciA9IHRoaXMuaGFuZGxlcnNbY29sbGVjdGlvbl07XG4gICAgaWYgKG9sZEhhbmRsZXIpIHtcbiAgICAgIC8vIHdoZW4gdGhlIHNlbGVjdG9yIGVxdWFscyBtZXRob2Qgc3RvcHMgcnVubmluZywgbm8gY2hhbmdlIG9jY3VycyBhbmQgZXZlcnl0aGluZ1xuICAgICAgLy8gd2lsbCBzdGlsbCB3b3JrIHByb3Blcmx5IHdpdGhvdXQgcnVubmluZyB0aGUgc2FtZSBvYnNlcnZlciBhZ2FpblxuICAgICAgb2xkSGFuZGxlci5lcXVhbFNlbGVjdG9yID0gXy5pc0VxdWFsKG9sZEhhbmRsZXIuc2VsZWN0b3IsIHNlbGVjdG9yKTtcbiAgICAgIGlmIChvbGRIYW5kbGVyLmVxdWFsU2VsZWN0b3IpXG4gICAgICAgIHJldHVybiBvbGRIYW5kbGVyO1xuXG4gICAgICBvbGRIYW5kbGVyLnN0b3AoKTtcbiAgICB9Ki9cblxuICAgIGNvbnN0IG5ld0hhbmRsZXIgPSBvcHRpb25zLmhhbmRsZXJcbiAgICA/IGN1cnNvcltvcHRpb25zLmhhbmRsZXJdKG9wdGlvbnMuY2FsbGJhY2tzKVxuICAgIDogbmV3IEhhbmRsZXJDb250cm9sbGVyKCk7XG5cbiAgICBuZXdIYW5kbGVyLnNlbGVjdG9yID0gc2VsZWN0b3I7XG5cbiAgICByZXR1cm4gdGhpcy5oYW5kbGVyc1tjb2xsZWN0aW9uXSA9IG5ld0hhbmRsZXI7XG4gIH1cbiAgc3RvcCAoKSB7XG4gICAgbGV0IGhhbmRsZXJzID0gdGhpcy5oYW5kbGVycztcblxuICAgIHRoaXMuaGFuZGxlciAmJiB0aGlzLmhhbmRsZXIuc3RvcCgpO1xuXG4gICAgZm9yIChsZXQga2V5IGluIGhhbmRsZXJzKSB7XG4gICAgICBoYW5kbGVyc1trZXldLnN0b3AoKTtcbiAgICB9O1xuXG4gICAgdGhpcy5oYW5kbGVycyA9IFtdO1xuICB9XG4gIHJlbW92ZSAoX2lkKSB7XG4gICAgbGV0IGhhbmRsZXIgPSB0aGlzLmhhbmRsZXJzW19pZF07XG4gICAgaWYgKGhhbmRsZXIpIHtcbiAgICAgIGhhbmRsZXIuc3RvcCgpO1xuICAgICAgZGVsZXRlIHRoaXMuaGFuZGxlcnNbX2lkXTtcbiAgICB9XG4gIH1cbn0iLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IGNoZWNrLCBNYXRjaCB9IGZyb20gJ21ldGVvci9jaGVjayc7XG5pbXBvcnQgeyBERFBTZXJ2ZXIgfSBmcm9tICdtZXRlb3IvZGRwLXNlcnZlcic7XG5cbmNvbnN0IGNyb3NzYmFyID0gRERQU2VydmVyLl9JbnZhbGlkYXRpb25Dcm9zc2JhcjtcblxuTWV0ZW9yLm1ldGhvZHMoe1xuICAnUFIuY2hhbmdlUGFnaW5hdGlvbicgKGRhdGEpIHtcbiAgICBjaGVjayhkYXRhLCB7XG4gICAgICBfaWQ6IFN0cmluZyxcbiAgICAgIGZpZWxkOiBTdHJpbmcsXG4gICAgICBza2lwOiBNYXRjaC5JbnRlZ2VyXG4gICAgfSk7XG5cbiAgICBjcm9zc2Jhci5maXJlKF8uZXh0ZW5kKHtcbiAgICAgIGNvbGxlY3Rpb246ICdwYWdpbmF0aW9ucycsXG4gICAgICBpZDogdGhpcy5jb25uZWN0aW9uLmlkXG4gICAgfSwgZGF0YSkpO1xuICB9LFxuICAnUFIuZmlyZUxpc3RlbmVyJyAoY29sbGVjdGlvbiwgb3B0aW9ucykge1xuICAgIGNoZWNrKGNvbGxlY3Rpb24sIFN0cmluZyk7XG4gICAgY2hlY2sob3B0aW9ucywgT2JqZWN0KTtcblxuICAgIGNyb3NzYmFyLmZpcmUoXy5leHRlbmQoe1xuICAgICAgY29sbGVjdGlvbjogJ2xpc3Rlbi0nICsgY29sbGVjdGlvbixcbiAgICAgIGlkOiB0aGlzLmNvbm5lY3Rpb24uaWQsXG4gICAgfSwgb3B0aW9ucykpO1xuICB9XG59KTsiLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCBIYW5kbGVyQ29udHJvbGxlciBmcm9tICcuL2hhbmRsZXJfY29udHJvbGxlcic7XG5pbXBvcnQgQ3Vyc29yTWV0aG9kcyBmcm9tICcuL2N1cnNvcic7XG5cblB1Ymxpc2hSZWxhdGlvbnMgPSBmdW5jdGlvbiAobmFtZSwgY2FsbGJhY2spIHtcbiAgcmV0dXJuIE1ldGVvci5wdWJsaXNoKG5hbWUsIGZ1bmN0aW9uICguLi5wYXJhbXMpIHtcbiAgICBsZXQgaGFuZGxlciA9IG5ldyBIYW5kbGVyQ29udHJvbGxlcigpLFxuICAgIGN1cnNvcnMgPSBuZXcgQ3Vyc29yTWV0aG9kcyh0aGlzLCBoYW5kbGVyKTtcblxuICAgIHRoaXMuX3B1YmxpY2F0aW9uTmFtZSA9IG5hbWU7XG4gICAgdGhpcy5vblN0b3AoKCkgPT4gaGFuZGxlci5zdG9wKCkpO1xuXG4gICAgbGV0IGNiID0gY2FsbGJhY2suYXBwbHkoXy5leHRlbmQoY3Vyc29ycywgdGhpcyksIHBhcmFtcyk7XG4gICAgLy8ga2FkaXJhIHNob3cgbWUgYWxlcnRzIHdoZW4gSSB1c2UgdGhpcyByZXR1cm4gKGJ1dCB3b3JrcyB3ZWxsKVxuICAgIC8vIHJldHVybiBjYiB8fCAoIXRoaXMuX3JlYWR5ICYmIHRoaXMucmVhZHkoKSk7XG4gICAgcmV0dXJuIGNiO1xuICB9KTtcbn07XG5cbk1ldGVvci5wdWJsaXNoUmVsYXRpb25zID0gUHVibGlzaFJlbGF0aW9ucztcblxuZXhwb3J0IGRlZmF1bHQgUHVibGlzaFJlbGF0aW9ucztcbmV4cG9ydCB7IFB1Ymxpc2hSZWxhdGlvbnMgfTsiLCJpbXBvcnQgQ3Vyc29yTWV0aG9kcyBmcm9tICcuL2N1cnNvcic7XG4vLyBERVBSRUNBVEVEXG4vLyBkZXNpZ25lZCB0byBjaGFuZ2Ugc29tZXRoaW5nIGluIHRoZSBtYXN0ZXIgZG9jdW1lbnQgd2hpbGUgdGhlIGNhbGxiYWNrcyBhcmUgZXhlY3V0ZWRcbi8vIGNoYW5nZXMgdG8gdGhlIGRvY3VtZW50IGFyZSBzZW50IHRvIHRoZSBtYWluIGRvY3VtZW50IHdpdGggdGhlIHJldHVybiBvZiB0aGUgY2FsbGJhY2tzXG5DdXJzb3JNZXRob2RzLnByb3RvdHlwZS5jaGFuZ2VQYXJlbnREb2MgPSBmdW5jdGlvbiAoY3Vyc29yLCBjYWxsYmFja3MsIG9uUmVtb3ZlZCkge1xuICBjb25zdCBzdWIgPSB0aGlzLnN1YjtcbiAgY29uc3QgX2lkID0gdGhpcy5faWQ7XG4gIGNvbnN0IGNvbGxlY3Rpb24gPSB0aGlzLmNvbGxlY3Rpb247XG5cbiAgbGV0IHJlc3VsdCA9IHRoaXM7XG5cbiAgaWYgKCFfaWQgfHwgIWNvbGxlY3Rpb24pXG4gICAgdGhyb3cgbmV3IEVycm9yKFwieW91IGNhbid0IHVzZSB0aGlzIG1ldGhvZCB3aXRob3V0IGJlaW5nIHdpdGhpbiBhIGRvY3VtZW50XCIpO1xuXG4gIGNhbGxiYWNrcyA9IHRoaXMuX2dldENhbGxiYWNrcyhjYWxsYmFja3MsIG9uUmVtb3ZlZCk7XG5cbiAgdGhpcy5oYW5kbGVyLmFkZChjdXJzb3IsIHtcbiAgICBoYW5kbGVyOiAnb2JzZXJ2ZUNoYW5nZXMnLFxuICAgIGNhbGxiYWNrczoge1xuICAgICAgYWRkZWQgKGlkLCBkb2MpIHtcbiAgICAgICAgcmVzdWx0Ll9hZGRlZFdpdGhDUEQgPSBjYWxsYmFja3MuYWRkZWQoaWQsIGRvYyk7XG4gICAgICB9LFxuICAgICAgY2hhbmdlZCAoaWQsIGRvYykge1xuICAgICAgICB2YXIgY2hhbmdlcyA9IGNhbGxiYWNrcy5jaGFuZ2VkKGlkLCBkb2MpO1xuICAgICAgICBpZiAoY2hhbmdlcylcbiAgICAgICAgICBzdWIuY2hhbmdlZChjb2xsZWN0aW9uLCBfaWQsIGNoYW5nZXMpO1xuICAgICAgfSxcbiAgICAgIHJlbW92ZWQgKGlkKSB7XG4gICAgICAgIHZhciBjaGFuZ2VzID0gY2FsbGJhY2tzLnJlbW92ZWQoaWQpO1xuICAgICAgICBpZiAoY2hhbmdlcylcbiAgICAgICAgICBzdWIuY2hhbmdlZChjb2xsZWN0aW9uLCBfaWQsIGNoYW5nZXMpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIHJlc3VsdC5fYWRkZWRXaXRoQ1BEIHx8IHt9O1xufTsiLCJpbXBvcnQgeyBfIH0gZnJvbSAnbWV0ZW9yL3VuZGVyc2NvcmUnO1xuaW1wb3J0IEN1cnNvck1ldGhvZHMgZnJvbSAnLi9jdXJzb3InO1xuaW1wb3J0IHsgRERQU2VydmVyIH0gZnJvbSAnbWV0ZW9yL2RkcC1zZXJ2ZXInO1xuXG5jb25zdCBjcm9zc2JhciA9IEREUFNlcnZlci5fSW52YWxpZGF0aW9uQ3Jvc3NiYXI7XG4vLyBkZXNpZ25lZCB0byBwYWdpbmF0ZSBhIGxpc3QsIHdvcmtzIGluIGNvbmp1bmN0aW9uIHdpdGggdGhlIG1ldGhvZHNcbi8vIGRvIG5vdCBjYWxsIGJhY2sgdG8gdGhlIG1haW4gY2FsbGJhY2ssIG9ubHkgdGhlIGFycmF5IGlzIGNoYW5nZWQgaW4gdGhlIGNvbGxlY3Rpb25cbkN1cnNvck1ldGhvZHMucHJvdG90eXBlLnBhZ2luYXRlID0gZnVuY3Rpb24gKGZpZWxkRGF0YSwgbGltaXQsIGluZmluaXRlKSB7XG4gIGNvbnN0IHN1YiA9IHRoaXMuc3ViO1xuICBjb25zdCBjb2xsZWN0aW9uID0gdGhpcy5jb2xsZWN0aW9uO1xuXG4gIGlmICghdGhpcy5faWQgfHwgIWNvbGxlY3Rpb24pXG4gICAgdGhyb3cgbmV3IEVycm9yKFwieW91IGNhbid0IHVzZSB0aGlzIG1ldGhvZCB3aXRob3V0IGJlaW5nIHdpdGhpbiBhIGRvY3VtZW50XCIpO1xuXG4gIGNvbnN0IGZpZWxkID0gT2JqZWN0LmtleXMoZmllbGREYXRhKVswXTtcbiAgY29uc3QgY29weSA9IF8uY2xvbmUoZmllbGREYXRhKVtmaWVsZF07XG4gIGNvbnN0IG1heCA9IGNvcHkubGVuZ3RoO1xuICBjb25zdCBjb25uZWN0aW9uSWQgPSBzdWIuY29ubmVjdGlvbi5pZDtcblxuICBmaWVsZERhdGFbZmllbGRdID0gY29weS5zbGljZSgwLCBsaW1pdCk7XG5cbiAgY29uc3QgbGlzdGVuZXIgPSBjcm9zc2Jhci5saXN0ZW4oe1xuICAgIGNvbGxlY3Rpb246ICdwYWdpbmF0aW9ucycsXG4gICAgaWQ6IGNvbm5lY3Rpb25JZCxcbiAgfSwgKGRhdGEpID0+IHtcbiAgICBpZiAoIWRhdGEuaWQgfHwgZGF0YS5pZCAhPT0gY29ubmVjdGlvbklkKSByZXR1cm47XG5cbiAgICBsZXQgc2tpcCA9IGRhdGEuc2tpcDtcblxuICAgIGlmIChza2lwID49IG1heCAmJiAhaW5maW5pdGUpXG4gICAgICByZXR1cm47XG5cbiAgICBmaWVsZERhdGFbZmllbGRdID0gaW5maW5pdGUgPyBjb3B5LnNsaWNlKDAsIHNraXApOiBjb3B5LnNsaWNlKHNraXAsIHNraXAgKyBsaW1pdCk7XG4gICAgc3ViLmNoYW5nZWQoY29sbGVjdGlvbiwgZGF0YS5faWQsIGZpZWxkRGF0YSk7XG4gIH0pO1xuXG4gIHRoaXMuaGFuZGxlci5hZGRCYXNpYyhmaWVsZCwgbGlzdGVuZXIpO1xuXG4gIHJldHVybiBmaWVsZERhdGFbZmllbGRdO1xufTtcblxuQ3Vyc29yTWV0aG9kcy5wcm90b3R5cGUubGlzdGVuID0gZnVuY3Rpb24gKG9wdGlvbnMsIGNhbGxiYWNrLCBydW4pIHtcbiAgY29uc3Qgc3ViID0gdGhpcy5zdWI7XG4gIGNvbnN0IG5hbWUgPSAnbGlzdGVuLScgKyB0aGlzLl9wdWJsaWNhdGlvbk5hbWU7XG5cbiAgY29uc3QgbGlzdGVuZXIgPSBjcm9zc2Jhci5saXN0ZW4oe1xuICAgIGNvbGxlY3Rpb246IG5hbWUsXG4gICAgaWQ6IHN1Yi5jb25uZWN0aW9uLmlkXG4gIH0sIChkYXRhKSA9PiB7XG4gICAgaWYgKCFkYXRhLmlkIHx8IGRhdGEuaWQgIT09IHN1Yi5jb25uZWN0aW9uLmlkKSByZXR1cm47XG5cbiAgICBfLmV4dGVuZChvcHRpb25zLCBfLm9taXQoZGF0YSwgJ2NvbGxlY3Rpb24nLCAnaWQnKSk7XG4gICAgY2FsbGJhY2soZmFsc2UpO1xuICB9KTtcblxuICBjb25zdCBoYW5kbGVyID0gdGhpcy5oYW5kbGVyLmFkZEJhc2ljKG5hbWUpO1xuXG4gIGlmIChydW4gIT09IGZhbHNlKSBjYWxsYmFjayh0cnVlKTtcblxuICByZXR1cm4gaGFuZGxlci5zZXQobGlzdGVuZXIpO1xufTsiLCJpbXBvcnQgeyBfIH0gZnJvbSAnbWV0ZW9yL3VuZGVyc2NvcmUnO1xuaW1wb3J0IEN1cnNvck1ldGhvZHNOUiBmcm9tICcuL25vbnJlYWN0aXZlJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ3Vyc29yTWV0aG9kcyBleHRlbmRzIEN1cnNvck1ldGhvZHNOUiB7XG4gIGNvbnN0cnVjdG9yIChzdWIsIGhhbmRsZXIsIF9pZCwgY29sbGVjdGlvbikge1xuICAgIHN1cGVyKHN1Yik7XG5cbiAgICB0aGlzLmhhbmRsZXIgPSBoYW5kbGVyO1xuICAgIHRoaXMuX2lkID0gX2lkO1xuICAgIHRoaXMuY29sbGVjdGlvbiA9IGNvbGxlY3Rpb247XG4gIH1cbiAgY3Vyc29yIChjdXJzb3IsIGNvbGxlY3Rpb24sIGNhbGxiYWNrcykge1xuICAgIGNvbnN0IHN1YiA9IHRoaXMuc3ViO1xuXG4gICAgaWYgKCFfLmlzU3RyaW5nKGNvbGxlY3Rpb24pKSB7XG4gICAgICBjYWxsYmFja3MgPSBjb2xsZWN0aW9uO1xuICAgICAgY29sbGVjdGlvbiA9IGN1cnNvci5fZ2V0Q29sbGVjdGlvbk5hbWUoKTtcbiAgICB9XG5cbiAgICBjb25zdCBoYW5kbGVyID0gdGhpcy5oYW5kbGVyLmFkZChjdXJzb3IsIHtjb2xsZWN0aW9uOiBjb2xsZWN0aW9ufSk7XG4gICAgLy8gaWYgKGhhbmRsZXIuZXF1YWxTZWxlY3RvcilcbiAgICAvLyAgIHJldHVybiBoYW5kbGVyO1xuXG4gICAgaWYgKGNhbGxiYWNrcylcbiAgICAgIGNhbGxiYWNrcyA9IHRoaXMuX2dldENhbGxiYWNrcyhjYWxsYmFja3MpO1xuXG4gICAgZnVuY3Rpb24gYXBwbHlDYWxsYmFjayAoaWQsIGRvYywgbWV0aG9kKSB7XG4gICAgICBjb25zdCBjYiA9IGNhbGxiYWNrcyAmJiBjYWxsYmFja3NbbWV0aG9kXTtcblxuICAgICAgaWYgKGNiKSB7XG4gICAgICAgIGxldCBtZXRob2RzID0gbmV3IEN1cnNvck1ldGhvZHMoc3ViLCBoYW5kbGVyLmFkZEJhc2ljKGlkKSwgaWQsIGNvbGxlY3Rpb24pLFxuICAgICAgICBpc0NoYW5nZWQgPSBtZXRob2QgPT09ICdjaGFuZ2VkJztcblxuICAgICAgICByZXR1cm4gY2IuY2FsbChtZXRob2RzLCBpZCwgZG9jLCBpc0NoYW5nZWQpIHx8IGRvYztcbiAgICAgIH0gZWxzZVxuICAgICAgICByZXR1cm4gZG9jO1xuICAgIH07XG5cbiAgICBsZXQgb2JzZXJ2ZUNoYW5nZXMgPSBjdXJzb3Iub2JzZXJ2ZUNoYW5nZXMoe1xuICAgICAgYWRkZWQgKGlkLCBkb2MpIHtcbiAgICAgICAgc3ViLmFkZGVkKGNvbGxlY3Rpb24sIGlkLCBhcHBseUNhbGxiYWNrKGlkLCBkb2MsICdhZGRlZCcpKTtcbiAgICAgIH0sXG4gICAgICBjaGFuZ2VkIChpZCwgZG9jKSB7XG4gICAgICAgIHN1Yi5jaGFuZ2VkKGNvbGxlY3Rpb24sIGlkLCBhcHBseUNhbGxiYWNrKGlkLCBkb2MsICdjaGFuZ2VkJykpO1xuICAgICAgfSxcbiAgICAgIHJlbW92ZWQgKGlkKSB7XG4gICAgICAgIGlmIChjYWxsYmFja3MpIHtcbiAgICAgICAgICBjYWxsYmFja3MucmVtb3ZlZChpZCk7XG4gICAgICAgICAgaGFuZGxlci5yZW1vdmUoaWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgc3ViLnJlbW92ZWQoY29sbGVjdGlvbiwgaWQpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGhhbmRsZXIuc2V0KG9ic2VydmVDaGFuZ2VzKTtcbiAgfVxufTsiLCJpbXBvcnQgQ3Vyc29yTWV0aG9kcyBmcm9tICcuL2N1cnNvcic7XG5pbXBvcnQgJy4vam9pbic7XG5pbXBvcnQgJy4vb2JzZXJ2ZSc7XG5pbXBvcnQgJy4vY2hhbmdlX3BhcmVudF9kb2MnO1xuaW1wb3J0ICcuL2Nyb3NzYmFyJztcbmltcG9ydCAnLi91dGlscyc7XG5cbmV4cG9ydCBkZWZhdWx0IEN1cnNvck1ldGhvZHM7IiwiaW1wb3J0IHsgXyB9IGZyb20gJ21ldGVvci91bmRlcnNjb3JlJztcbmltcG9ydCBDdXJzb3JNZXRob2RzIGZyb20gJy4vY3Vyc29yJztcblxuQ3Vyc29yTWV0aG9kcy5wcm90b3R5cGUuam9pbiA9IGZ1bmN0aW9uICguLi5wYXJhbXMpIHtcbiAgcmV0dXJuIG5ldyBDdXJzb3JKb2luKHRoaXMsIC4uLnBhcmFtcyk7XG59O1xuXG5jbGFzcyBDdXJzb3JKb2luIHtcbiAgY29uc3RydWN0b3IgKG1ldGhvZHMsIGNvbGxlY3Rpb24sIG9wdGlvbnMsIG5hbWUpIHtcbiAgICB0aGlzLm1ldGhvZHMgPSBtZXRob2RzO1xuICAgIHRoaXMuY29sbGVjdGlvbiA9IGNvbGxlY3Rpb247XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuXG4gICAgdGhpcy5kYXRhID0gW107XG4gICAgdGhpcy5zZW50ID0gZmFsc2U7XG4gIH1cbiAgcHVzaCAoLi4uX2lkcykge1xuICAgIGxldCBjaGFuZ2VkO1xuXG4gICAgXy5lYWNoKF9pZHMsIF9pZCA9PiB7XG4gICAgICBpZiAoIV9pZCB8fCBfLmNvbnRhaW5zKHRoaXMuZGF0YSwgX2lkKSlcbiAgICAgICAgcmV0dXJuO1xuXG4gICAgICB0aGlzLmRhdGEucHVzaChfaWQpO1xuICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgfSk7XG5cbiAgICBpZiAodGhpcy5zZW50ICYmIGNoYW5nZWQpXG4gICAgICByZXR1cm4gdGhpcy5fY3Vyc29yKCk7XG4gIH1cbiAgc2VuZCAoKSB7XG4gICAgdGhpcy5zZW50ID0gdHJ1ZTtcbiAgICBpZiAoIXRoaXMuZGF0YS5sZW5ndGgpIHJldHVybjtcblxuICAgIHJldHVybiB0aGlzLl9jdXJzb3IoKTtcbiAgfVxuICBfc2VsZWN0b3IgKCkge1xuICAgIGxldCBfaWQgPSB7JGluOiB0aGlzLmRhdGF9O1xuICAgIHJldHVybiBfLmlzRnVuY3Rpb24odGhpcy5zZWxlY3RvcikgPyB0aGlzLnNlbGVjdG9yKF9pZCk6IHtfaWQ6IF9pZH07XG4gIH1cbiAgX2N1cnNvciAoKSB7XG4gICAgcmV0dXJuIHRoaXMubWV0aG9kcy5jdXJzb3IodGhpcy5jb2xsZWN0aW9uLmZpbmQodGhpcy5fc2VsZWN0b3IoKSwgdGhpcy5vcHRpb25zKSwgdGhpcy5uYW1lKTtcbiAgfVxufTsiLCJpbXBvcnQgQ3Vyc29yTWV0aG9kcyBmcm9tICcuL2N1cnNvcic7XG5cbkN1cnNvck1ldGhvZHMucHJvdG90eXBlLm9ic2VydmUgPSBmdW5jdGlvbiAoY3Vyc29yLCBjYWxsYmFja3MpIHtcbiAgdGhpcy5oYW5kbGVyLmFkZChjdXJzb3IsIHtcbiAgICBoYW5kbGVyOiAnb2JzZXJ2ZScsXG4gICAgY2FsbGJhY2tzOiBjYWxsYmFja3NcbiAgfSk7XG59O1xuXG5DdXJzb3JNZXRob2RzLnByb3RvdHlwZS5vYnNlcnZlQ2hhbmdlcyA9IGZ1bmN0aW9uIChjdXJzb3IsIGNhbGxiYWNrcykge1xuICB0aGlzLmhhbmRsZXIuYWRkKGN1cnNvciwge1xuICAgIGhhbmRsZXI6ICdvYnNlcnZlQ2hhbmdlcycsXG4gICAgY2FsbGJhY2tzOiBjYWxsYmFja3NcbiAgfSk7XG59OyIsImltcG9ydCB7IF8gfSBmcm9tICdtZXRlb3IvdW5kZXJzY29yZSc7XG5pbXBvcnQgQ3Vyc29yTWV0aG9kcyBmcm9tICcuL2N1cnNvcic7XG5cbmZ1bmN0aW9uIGdldENCIChjYiwgbWV0aG9kKSB7XG4gIHZhciBjYWxsYmFjayA9IGNiW21ldGhvZF07XG4gIGlmIChjYWxsYmFjayAmJiAhXy5pc0Z1bmN0aW9uKGNhbGxiYWNrKSlcbiAgICB0aHJvdyBuZXcgRXJyb3IobWV0aG9kICsgJyBzaG91bGQgYmUgYSBmdW5jdGlvbiBvciB1bmRlZmluZWQnKTtcblxuICByZXR1cm4gY2FsbGJhY2sgfHwgZnVuY3Rpb24gKCkge307XG59O1xuXG5DdXJzb3JNZXRob2RzLnByb3RvdHlwZS5fZ2V0Q2FsbGJhY2tzID0gZnVuY3Rpb24gKGNiLCBvblJlbW92ZWQpIHtcbiAgaWYgKF8uaXNGdW5jdGlvbihjYikpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYWRkZWQ6IGNiLFxuICAgICAgY2hhbmdlZDogY2IsXG4gICAgICByZW1vdmVkOiBnZXRDQih7b25SZW1vdmVkOiBvblJlbW92ZWR9LCAnb25SZW1vdmVkJylcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBhZGRlZDogZ2V0Q0IoY2IsICdhZGRlZCcpLFxuICAgIGNoYW5nZWQ6IGdldENCKGNiLCAnY2hhbmdlZCcpLFxuICAgIHJlbW92ZWQ6IGdldENCKGNiLCAncmVtb3ZlZCcpXG4gIH07XG59OyIsImltcG9ydCB7IF8gfSBmcm9tICdtZXRlb3IvdW5kZXJzY29yZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEN1cnNvck1ldGhvZHNOUiB7XG4gIGNvbnN0cnVjdG9yIChzdWIpIHtcbiAgICB0aGlzLnN1YiA9IHN1YjtcbiAgfVxuICBjdXJzb3JOb25yZWFjdGl2ZSAoY3Vyc29yLCBjb2xsZWN0aW9uLCBvbkFkZGVkKSB7XG4gICAgY29uc3Qgc3ViID0gdGhpcy5zdWI7XG5cbiAgICBpZiAoIV8uaXNTdHJpbmcoY29sbGVjdGlvbikpIHtcbiAgICAgIG9uQWRkZWQgPSBjb2xsZWN0aW9uO1xuICAgICAgY29sbGVjdGlvbiA9IGN1cnNvci5fZ2V0Q29sbGVjdGlvbk5hbWUoKTtcbiAgICB9XG4gICAgaWYgKCFfLmlzRnVuY3Rpb24ob25BZGRlZCkpXG4gICAgICBvbkFkZGVkID0gZnVuY3Rpb24gKCkge307XG5cbiAgICBjdXJzb3IuZm9yRWFjaCgoZG9jKSA9PiB7XG4gICAgICBsZXQgX2lkID0gZG9jLl9pZDtcbiAgICAgIHN1Yi5hZGRlZChjb2xsZWN0aW9uLCBfaWQsIG9uQWRkZWQuY2FsbChuZXcgQ3Vyc29yTWV0aG9kc05SKHN1YiksIF9pZCwgZG9jKSB8fCBkb2MpO1xuICAgIH0pO1xuICB9XG59OyIsImltcG9ydCBDdXJzb3JNZXRob2RzTlIgZnJvbSAnLi9jdXJzb3InO1xuaW1wb3J0ICcuL2pvaW4nO1xuXG5leHBvcnQgZGVmYXVsdCBDdXJzb3JNZXRob2RzTlI7IiwiaW1wb3J0IHsgXyB9IGZyb20gJ21ldGVvci91bmRlcnNjb3JlJztcbmltcG9ydCBDdXJzb3JNZXRob2RzTlIgZnJvbSAnLi9jdXJzb3InO1xuXG5DdXJzb3JNZXRob2RzTlIucHJvdG90eXBlLmpvaW5Ob25yZWFjdGl2ZSA9IGZ1bmN0aW9uICguLi5wYXJhbXMpIHtcbiAgcmV0dXJuIG5ldyBDdXJzb3JKb2luTm9ucmVhY3RpdmUodGhpcy5zdWIsIC4uLnBhcmFtcyk7XG59O1xuXG5jbGFzcyBDdXJzb3JKb2luTm9ucmVhY3RpdmUge1xuICBjb25zdHJ1Y3RvciAoc3ViLCBjb2xsZWN0aW9uLCBvcHRpb25zLCBuYW1lKSB7XG4gICAgdGhpcy5zdWIgPSBzdWI7XG4gICAgdGhpcy5jb2xsZWN0aW9uID0gY29sbGVjdGlvbjtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMubmFtZSA9IG5hbWUgfHwgY29sbGVjdGlvbi5fbmFtZTtcblxuICAgIHRoaXMuZGF0YSA9IFtdO1xuICAgIHRoaXMuc2VudCA9IGZhbHNlO1xuICB9XG4gIF9zZWxlY3RvciAoX2lkID0geyRpbjogdGhpcy5kYXRhfSkge1xuICAgIHJldHVybiBfLmlzRnVuY3Rpb24odGhpcy5zZWxlY3RvcikgPyB0aGlzLnNlbGVjdG9yKF9pZCk6IHtfaWQ6IF9pZH07XG4gIH1cbiAgcHVzaCAoLi4uX2lkcykge1xuICAgIGxldCBuZXdJZHMgPSBbXTtcblxuICAgIF8uZWFjaChfaWRzLCBfaWQgPT4ge1xuICAgICAgaWYgKCFfaWQgfHwgXy5jb250YWlucyh0aGlzLmRhdGEsIF9pZCkpXG4gICAgICAgIHJldHVybjtcblxuICAgICAgdGhpcy5kYXRhLnB1c2goX2lkKTtcbiAgICAgIG5ld0lkcy5wdXNoKF9pZCk7XG4gICAgfSk7XG5cbiAgICBpZiAodGhpcy5zZW50ICYmIG5ld0lkcy5sZW5ndGgpXG4gICAgICByZXR1cm4gdGhpcy5hZGRlZChuZXdJZHMubGVuZ3RoID4gMSA/IHskaW46IG5ld0lkc306IG5ld0lkc1swXSk7XG4gIH1cbiAgc2VuZCAoKSB7XG4gICAgdGhpcy5zZW50ID0gdHJ1ZTtcbiAgICBpZiAoIXRoaXMuZGF0YS5sZW5ndGgpIHJldHVybjtcblxuICAgIHJldHVybiB0aGlzLmFkZGVkKCk7XG4gIH1cbiAgYWRkZWQgKF9pZCkge1xuICAgIHRoaXMuY29sbGVjdGlvbi5maW5kKHRoaXMuX3NlbGVjdG9yKF9pZCksIHRoaXMub3B0aW9ucykuZm9yRWFjaChkb2MgPT4ge1xuICAgICAgdGhpcy5zdWIuYWRkZWQodGhpcy5uYW1lLCBkb2MuX2lkLCBfLm9taXQoZG9jLCAnX2lkJykpO1xuICAgIH0pO1xuICB9XG59OyJdfQ==
