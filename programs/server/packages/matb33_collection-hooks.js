(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var EJSON = Package.ejson.EJSON;
var LocalCollection = Package.minimongo.LocalCollection;
var Minimongo = Package.minimongo.Minimongo;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var CollectionHooks;

var require = meteorInstall({"node_modules":{"meteor":{"matb33:collection-hooks":{"server.js":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/matb33_collection-hooks/server.js                                                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  CollectionHooks: () => CollectionHooks
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 0);
let CollectionHooks;
module.link("./collection-hooks", {
  CollectionHooks(v) {
    CollectionHooks = v;
  }
}, 1);
module.link("./advices");
const publishUserId = new Meteor.EnvironmentVariable();
CollectionHooks.getUserId = function getUserId() {
  let userId;
  try {
    // Will throw an error unless within method call.
    // Attempt to recover gracefully by catching:
    userId = Meteor.userId && Meteor.userId();
  } catch (e) {}
  if (userId == null) {
    // Get the userId if we are in a publish function.
    userId = publishUserId.get();
  }
  if (userId == null) {
    userId = CollectionHooks.defaultUserId;
  }
  return userId;
};
const _publish = Meteor.publish;
Meteor.publish = function (name, handler, options) {
  return _publish.call(this, name, function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    // This function is called repeatedly in publications
    return publishUserId.withValue(this && this.userId, () => handler.apply(this, args));
  }, options);
};

// Make the above available for packages with hooks that want to determine
// whether they are running inside a publish function or not.
CollectionHooks.isWithinPublish = () => publishUserId.get() !== undefined;
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"advices.js":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/matb33_collection-hooks/advices.js                                                                        //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.link("./insert.js");
module.link("./update.js");
module.link("./remove.js");
module.link("./upsert.js");
module.link("./find.js");
module.link("./findone.js");
module.link("./users-compat.js");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"collection-hooks.js":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/matb33_collection-hooks/collection-hooks.js                                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
const _excluded = ["multi", "upsert"];
let _objectWithoutProperties;
module.link("@babel/runtime/helpers/objectWithoutProperties", {
  default(v) {
    _objectWithoutProperties = v;
  }
}, 0);
let _objectSpread;
module.link("@babel/runtime/helpers/objectSpread2", {
  default(v) {
    _objectSpread = v;
  }
}, 1);
module.export({
  CollectionHooks: () => CollectionHooks
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 0);
let Mongo;
module.link("meteor/mongo", {
  Mongo(v) {
    Mongo = v;
  }
}, 1);
let EJSON;
module.link("meteor/ejson", {
  EJSON(v) {
    EJSON = v;
  }
}, 2);
let LocalCollection;
module.link("meteor/minimongo", {
  LocalCollection(v) {
    LocalCollection = v;
  }
}, 3);
// Relevant AOP terminology:
// Aspect: User code that runs before/after (hook)
// Advice: Wrapper code that knows when to call user code (aspects)
// Pointcut: before/after
const advices = {};
const CollectionHooks = {
  defaults: {
    before: {
      insert: {},
      update: {},
      remove: {},
      upsert: {},
      find: {},
      findOne: {},
      all: {}
    },
    after: {
      insert: {},
      update: {},
      remove: {},
      find: {},
      findOne: {},
      all: {}
    },
    all: {
      insert: {},
      update: {},
      remove: {},
      find: {},
      findOne: {},
      all: {}
    }
  },
  directEnv: new Meteor.EnvironmentVariable(),
  directOp(func) {
    return this.directEnv.withValue(true, func);
  },
  hookedOp(func) {
    return this.directEnv.withValue(false, func);
  }
};
CollectionHooks.extendCollectionInstance = function extendCollectionInstance(self, constructor) {
  // Offer a public API to allow the user to define aspects
  // Example: collection.before.insert(func);
  ['before', 'after'].forEach(function (pointcut) {
    Object.entries(advices).forEach(function (_ref) {
      let [method, advice] = _ref;
      if (advice === 'upsert' && pointcut === 'after') return;
      Meteor._ensure(self, pointcut, method);
      Meteor._ensure(self, '_hookAspects', method);
      self._hookAspects[method][pointcut] = [];
      self[pointcut][method] = function (aspect, options) {
        let target = {
          aspect,
          options: CollectionHooks.initOptions(options, pointcut, method)
        };
        // adding is simply pushing it to the array
        self._hookAspects[method][pointcut].push(target);
        return {
          replace(aspect, options) {
            // replacing is done by determining the actual index of a given target
            // and replace this with the new one
            const src = self._hookAspects[method][pointcut];
            const targetIndex = src.findIndex(entry => entry === target);
            const newTarget = {
              aspect,
              options: CollectionHooks.initOptions(options, pointcut, method)
            };
            src.splice(targetIndex, 1, newTarget);
            // update the target to get the correct index in future calls
            target = newTarget;
          },
          remove() {
            // removing a hook is done by determining the actual index of a given target
            // and removing it form the source array
            const src = self._hookAspects[method][pointcut];
            const targetIndex = src.findIndex(entry => entry === target);
            self._hookAspects[method][pointcut].splice(targetIndex, 1);
          }
        };
      };
    });
  });

  // Offer a publicly accessible object to allow the user to define
  // collection-wide hook options.
  // Example: collection.hookOptions.after.update = {fetchPrevious: false};
  self.hookOptions = EJSON.clone(CollectionHooks.defaults);

  // Wrap mutator methods, letting the defined advice do the work
  Object.entries(advices).forEach(function (_ref2) {
    let [method, advice] = _ref2;
    const collection = Meteor.isClient || method === 'upsert' ? self : self._collection;

    // Store a reference to the original mutator method
    const _super = collection[method];
    Meteor._ensure(self, 'direct', method);
    self.direct[method] = function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      return CollectionHooks.directOp(function () {
        return constructor.prototype[method].apply(self, args);
      });
    };
    const asyncMethod = method + 'Async';
    if (constructor.prototype[asyncMethod]) {
      self.direct[asyncMethod] = function () {
        for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }
        return CollectionHooks.directOp(function () {
          return constructor.prototype[asyncMethod].apply(self, args);
        });
      };
    }
    collection[method] = function () {
      for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }
      if (CollectionHooks.directEnv.get() === true) {
        return _super.apply(collection, args);
      }

      // NOTE: should we decide to force `update` with `{upsert:true}` to use
      // the `upsert` hooks, this is what will accomplish it. It's important to
      // realize that Meteor won't distinguish between an `update` and an
      // `insert` though, so we'll end up with `after.update` getting called
      // even on an `insert`. That's why we've chosen to disable this for now.
      // if (method === "update" && Object(args[2]) === args[2] && args[2].upsert) {
      //   method = "upsert";
      //   advice = CollectionHooks.getAdvice(method);
      // }

      return advice.call(this, CollectionHooks.getUserId(), _super, self, method === 'upsert' ? {
        insert: self._hookAspects.insert || {},
        update: self._hookAspects.update || {},
        upsert: self._hookAspects.upsert || {}
      } : self._hookAspects[method] || {}, function (doc) {
        return typeof self._transform === 'function' ? function (d) {
          return self._transform(d || doc);
        } : function (d) {
          return d || doc;
        };
      }, args, false);
    };
  });
};
CollectionHooks.defineAdvice = (method, advice) => {
  advices[method] = advice;
};
CollectionHooks.getAdvice = method => advices[method];
CollectionHooks.initOptions = (options, pointcut, method) => CollectionHooks.extendOptions(CollectionHooks.defaults, options, pointcut, method);
CollectionHooks.extendOptions = (source, options, pointcut, method) => _objectSpread(_objectSpread(_objectSpread(_objectSpread(_objectSpread({}, options), source.all.all), source[pointcut].all), source.all[method]), source[pointcut][method]);
CollectionHooks.getDocs = function getDocs(collection, selector, options) {
  let fetchFields = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  let {
    useDirect = false
  } = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
  const findOptions = {
    transform: null,
    reactive: false
  };
  if (Object.keys(fetchFields).length > 0) {
    findOptions.fields = fetchFields;
  }

  /*
  // No "fetch" support at this time.
  if (!this._validators.fetchAllFields) {
    findOptions.fields = {};
    this._validators.fetch.forEach(function(fieldName) {
      findOptions.fields[fieldName] = 1;
    });
  }
  */

  // Bit of a magic condition here... only "update" passes options, so this is
  // only relevant to when update calls getDocs:
  if (options) {
    // This was added because in our case, we are potentially iterating over
    // multiple docs. If multi isn't enabled, force a limit (almost like
    // findOne), as the default for update without multi enabled is to affect
    // only the first matched document:
    if (!options.multi) {
      findOptions.limit = 1;
    }
    const {
        multi,
        upsert
      } = options,
      rest = _objectWithoutProperties(options, _excluded);
    Object.assign(findOptions, rest);
  }

  // Unlike validators, we iterate over multiple docs, so use
  // find instead of findOne:
  return (useDirect ? collection.direct : collection).find(selector, findOptions);
};

// This function normalizes the selector (converting it to an Object)
CollectionHooks.normalizeSelector = function (selector) {
  if (typeof selector === 'string' || selector && selector.constructor === Mongo.ObjectID) {
    return {
      _id: selector
    };
  } else {
    return selector;
  }
};

// This function contains a snippet of code pulled and modified from:
// ~/.meteor/packages/mongo-livedata/collection.js
// It's contained in these utility functions to make updates easier for us in
// case this code changes.
CollectionHooks.getFields = function getFields(mutator) {
  // compute modified fields
  const fields = [];
  // ====ADDED START=======================
  const operators = ['$addToSet', '$bit', '$currentDate', '$inc', '$max', '$min', '$pop', '$pull', '$pullAll', '$push', '$rename', '$set', '$unset'];
  // ====ADDED END=========================

  Object.entries(mutator).forEach(function (_ref3) {
    let [op, params] = _ref3;
    // ====ADDED START=======================
    if (operators.includes(op)) {
      // ====ADDED END=========================
      Object.keys(params).forEach(function (field) {
        // treat dotted fields as if they are replacing their
        // top-level part
        if (field.indexOf('.') !== -1) {
          field = field.substring(0, field.indexOf('.'));
        }

        // record the field we are trying to change
        if (!fields.includes(field)) {
          fields.push(field);
        }
      });
      // ====ADDED START=======================
    } else {
      fields.push(op);
    }
    // ====ADDED END=========================
  });
  return fields;
};
CollectionHooks.reassignPrototype = function reassignPrototype(instance, constr) {
  const hasSetPrototypeOf = typeof Object.setPrototypeOf === 'function';
  constr = constr || Mongo.Collection;

  // __proto__ is not available in < IE11
  // Note: Assigning a prototype dynamically has performance implications
  if (hasSetPrototypeOf) {
    Object.setPrototypeOf(instance, constr.prototype);
  } else if (instance.__proto__) {
    // eslint-disable-line no-proto
    instance.__proto__ = constr.prototype; // eslint-disable-line no-proto
  }
};
CollectionHooks.wrapCollection = function wrapCollection(ns, as) {
  if (!as._CollectionConstructor) as._CollectionConstructor = as.Collection;
  if (!as._CollectionPrototype) as._CollectionPrototype = new as.Collection(null);
  const constructor = ns._NewCollectionContructor || as._CollectionConstructor;
  const proto = as._CollectionPrototype;
  ns.Collection = function () {
    for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }
    const ret = constructor.apply(this, args);
    CollectionHooks.extendCollectionInstance(this, constructor);
    return ret;
  };
  // Retain a reference to the new constructor to allow further wrapping.
  ns._NewCollectionContructor = ns.Collection;
  ns.Collection.prototype = proto;
  ns.Collection.prototype.constructor = ns.Collection;
  for (const prop of Object.keys(constructor)) {
    ns.Collection[prop] = constructor[prop];
  }

  // Meteor overrides the apply method which is copied from the constructor in the loop above. Replace it with the
  // default method which we need if we were to further wrap ns.Collection.
  ns.Collection.apply = Function.prototype.apply;
};
CollectionHooks.modify = LocalCollection._modify;
if (typeof Mongo !== 'undefined') {
  CollectionHooks.wrapCollection(Meteor, Mongo);
  CollectionHooks.wrapCollection(Mongo, Mongo);
} else {
  CollectionHooks.wrapCollection(Meteor, Meteor);
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"find.js":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/matb33_collection-hooks/find.js                                                                           //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let CollectionHooks;
module.link("./collection-hooks", {
  CollectionHooks(v) {
    CollectionHooks = v;
  }
}, 0);
CollectionHooks.defineAdvice('find', function (userId, _super, instance, aspects, getTransform, args, suppressAspects) {
  const ctx = {
    context: this,
    _super,
    args
  };
  const selector = CollectionHooks.normalizeSelector(instance._getFindSelector(args));
  const options = instance._getFindOptions(args);
  let abort;
  // before
  if (!suppressAspects) {
    aspects.before.forEach(o => {
      const r = o.aspect.call(ctx, userId, selector, options);
      if (r === false) abort = true;
    });
    if (abort) return instance.find(undefined);
  }
  const after = cursor => {
    if (!suppressAspects) {
      aspects.after.forEach(o => {
        o.aspect.call(ctx, userId, selector, options, cursor);
      });
    }
  };
  const ret = _super.call(this, selector, options);
  after(ret);
  return ret;
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"findone.js":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/matb33_collection-hooks/findone.js                                                                        //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let CollectionHooks;
module.link("./collection-hooks", {
  CollectionHooks(v) {
    CollectionHooks = v;
  }
}, 0);
CollectionHooks.defineAdvice('findOne', function (userId, _super, instance, aspects, getTransform, args, suppressAspects) {
  const ctx = {
    context: this,
    _super,
    args
  };
  const selector = CollectionHooks.normalizeSelector(instance._getFindSelector(args));
  const options = instance._getFindOptions(args);
  let abort;

  // before
  if (!suppressAspects) {
    aspects.before.forEach(o => {
      const r = o.aspect.call(ctx, userId, selector, options);
      if (r === false) abort = true;
    });
    if (abort) return;
  }
  function after(doc) {
    if (!suppressAspects) {
      aspects.after.forEach(o => {
        o.aspect.call(ctx, userId, selector, options, doc);
      });
    }
  }
  const ret = _super.call(this, selector, options);
  after(ret);
  return ret;
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"insert.js":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/matb33_collection-hooks/insert.js                                                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let _objectSpread;
module.link("@babel/runtime/helpers/objectSpread2", {
  default(v) {
    _objectSpread = v;
  }
}, 0);
let EJSON;
module.link("meteor/ejson", {
  EJSON(v) {
    EJSON = v;
  }
}, 0);
let Mongo;
module.link("meteor/mongo", {
  Mongo(v) {
    Mongo = v;
  }
}, 1);
let CollectionHooks;
module.link("./collection-hooks", {
  CollectionHooks(v) {
    CollectionHooks = v;
  }
}, 2);
CollectionHooks.defineAdvice('insert', function (userId, _super, instance, aspects, getTransform, args, suppressAspects) {
  const ctx = {
    context: this,
    _super,
    args
  };
  let doc = args[0];
  let callback;
  if (typeof args[args.length - 1] === 'function') {
    callback = args[args.length - 1];
  }
  const async = typeof callback === 'function';
  let abort;
  let ret;

  // before
  if (!suppressAspects) {
    try {
      aspects.before.forEach(o => {
        const r = o.aspect.call(_objectSpread({
          transform: getTransform(doc)
        }, ctx), userId, doc);
        if (r === false) abort = true;
      });
      if (abort) return;
    } catch (e) {
      if (async) return callback.call(this, e);
      throw e;
    }
  }
  const after = (id, err) => {
    if (id) {
      // In some cases (namely Meteor.users on Meteor 1.4+), the _id property
      // is a raw mongo _id object. We need to extract the _id from this object
      if (typeof id === 'object' && id.ops) {
        // If _str then collection is using Mongo.ObjectID as ids
        if (doc._id._str) {
          id = new Mongo.ObjectID(doc._id._str.toString());
        } else {
          id = id.ops && id.ops[0] && id.ops[0]._id;
        }
      }
      doc = EJSON.clone(doc);
      doc._id = id;
    }
    if (!suppressAspects) {
      const lctx = _objectSpread({
        transform: getTransform(doc),
        _id: id,
        err
      }, ctx);
      aspects.after.forEach(o => {
        o.aspect.call(lctx, userId, doc);
      });
    }
    return id;
  };
  if (async) {
    const wrappedCallback = function (err, obj) {
      after(obj && obj[0] && obj[0]._id || obj, err);
      for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        args[_key - 2] = arguments[_key];
      }
      return callback.call(this, err, obj, ...args);
    };
    return _super.call(this, doc, wrappedCallback);
  } else {
    ret = _super.call(this, doc, callback);
    return after(ret && ret.insertedId || ret && ret[0] && ret[0]._id || ret);
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"remove.js":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/matb33_collection-hooks/remove.js                                                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let _objectSpread;
module.link("@babel/runtime/helpers/objectSpread2", {
  default(v) {
    _objectSpread = v;
  }
}, 0);
let EJSON;
module.link("meteor/ejson", {
  EJSON(v) {
    EJSON = v;
  }
}, 0);
let CollectionHooks;
module.link("./collection-hooks", {
  CollectionHooks(v) {
    CollectionHooks = v;
  }
}, 1);
const isEmpty = a => !Array.isArray(a) || !a.length;
CollectionHooks.defineAdvice('remove', function (userId, _super, instance, aspects, getTransform, args, suppressAspects) {
  const ctx = {
    context: this,
    _super,
    args
  };
  const [selector, callback] = args;
  const async = typeof callback === 'function';
  let docs;
  let abort;
  const prev = [];
  if (!suppressAspects) {
    try {
      if (!isEmpty(aspects.before) || !isEmpty(aspects.after)) {
        docs = CollectionHooks.getDocs.call(this, instance, selector).fetch();
      }

      // copy originals for convenience for the 'after' pointcut
      if (!isEmpty(aspects.after)) {
        docs.forEach(doc => prev.push(EJSON.clone(doc)));
      }

      // before
      aspects.before.forEach(o => {
        docs.forEach(doc => {
          const r = o.aspect.call(_objectSpread({
            transform: getTransform(doc)
          }, ctx), userId, doc);
          if (r === false) abort = true;
        });
      });
      if (abort) return 0;
    } catch (e) {
      if (async) return callback.call(this, e);
      throw e;
    }
  }
  function after(err) {
    if (!suppressAspects) {
      aspects.after.forEach(o => {
        prev.forEach(doc => {
          o.aspect.call(_objectSpread({
            transform: getTransform(doc),
            err
          }, ctx), userId, doc);
        });
      });
    }
  }
  if (async) {
    const wrappedCallback = function (err) {
      after(err);
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      return callback.call(this, err, ...args);
    };
    return _super.call(this, selector, wrappedCallback);
  } else {
    const result = _super.call(this, selector, callback);
    after();
    return result;
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"update.js":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/matb33_collection-hooks/update.js                                                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let _objectSpread;
module.link("@babel/runtime/helpers/objectSpread2", {
  default(v) {
    _objectSpread = v;
  }
}, 0);
let EJSON;
module.link("meteor/ejson", {
  EJSON(v) {
    EJSON = v;
  }
}, 0);
let CollectionHooks;
module.link("./collection-hooks", {
  CollectionHooks(v) {
    CollectionHooks = v;
  }
}, 1);
const isEmpty = a => !Array.isArray(a) || !a.length;
CollectionHooks.defineAdvice('update', function (userId, _super, instance, aspects, getTransform, args, suppressAspects) {
  const ctx = {
    context: this,
    _super,
    args
  };
  let [selector, mutator, options, callback] = args;
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  const async = typeof callback === 'function';
  let docs;
  let docIds;
  let fields;
  let abort;
  const prev = {};
  if (!suppressAspects) {
    try {
      // NOTE: fetching the full documents before when fetchPrevious is false and no before hooks are defined is wildly inefficient.
      const shouldFetchForBefore = !isEmpty(aspects.before);
      const shouldFetchForAfter = !isEmpty(aspects.after);
      let shouldFetchForPrevious = false;
      if (shouldFetchForAfter) {
        shouldFetchForPrevious = Object.values(aspects.after).some(o => o.options.fetchPrevious !== false) && CollectionHooks.extendOptions(instance.hookOptions, {}, 'after', 'update').fetchPrevious !== false;
      }
      fields = CollectionHooks.getFields(args[1]);
      const fetchFields = {};
      if (shouldFetchForPrevious || shouldFetchForBefore) {
        const afterAspectFetchFields = shouldFetchForPrevious ? Object.values(aspects.after).map(o => (o.options || {}).fetchFields || {}) : [];
        const beforeAspectFetchFields = shouldFetchForBefore ? Object.values(aspects.before).map(o => (o.options || {}).fetchFields || {}) : [];
        const afterGlobal = shouldFetchForPrevious ? CollectionHooks.extendOptions(instance.hookOptions, {}, 'after', 'update').fetchFields || {} : {};
        const beforeGlobal = shouldFetchForPrevious ? CollectionHooks.extendOptions(instance.hookOptions, {}, 'before', 'update').fetchFields || {} : {};
        Object.assign(fetchFields, afterGlobal, beforeGlobal, ...afterAspectFetchFields, ...beforeAspectFetchFields);
      }
      docs = CollectionHooks.getDocs.call(this, instance, args[0], args[2], fetchFields).fetch();
      docIds = Object.values(docs).map(doc => doc._id);

      // copy originals for convenience for the 'after' pointcut
      if (shouldFetchForAfter) {
        prev.mutator = EJSON.clone(args[1]);
        prev.options = EJSON.clone(args[2]);
        if (shouldFetchForPrevious) {
          prev.docs = {};
          docs.forEach(doc => {
            prev.docs[doc._id] = EJSON.clone(doc);
          });
        }
      }

      // before
      aspects.before.forEach(function (o) {
        docs.forEach(function (doc) {
          const r = o.aspect.call(_objectSpread({
            transform: getTransform(doc)
          }, ctx), userId, doc, fields, mutator, options);
          if (r === false) abort = true;
        });
      });
      if (abort) return 0;
    } catch (e) {
      if (async) return callback.call(this, e);
      throw e;
    }
  }
  const after = (affected, err) => {
    if (!suppressAspects) {
      let docs;
      let fields;
      if (!isEmpty(aspects.after)) {
        fields = CollectionHooks.getFields(args[1]);
        const fetchFields = {};
        const aspectFetchFields = Object.values(aspects.after).map(o => (o.options || {}).fetchFields || {});
        const globalFetchFields = CollectionHooks.extendOptions(instance.hookOptions, {}, 'after', 'update').fetchFields;
        if (aspectFetchFields || globalFetchFields) {
          Object.assign(fetchFields, globalFetchFields || {}, ...aspectFetchFields.map(a => a.fetchFields));
        }
        docs = CollectionHooks.getDocs.call(this, instance, {
          _id: {
            $in: docIds
          }
        }, options, fetchFields, {
          useDirect: true
        }).fetch();
      }
      aspects.after.forEach(o => {
        docs.forEach(doc => {
          o.aspect.call(_objectSpread({
            transform: getTransform(doc),
            previous: prev.docs && prev.docs[doc._id],
            affected,
            err
          }, ctx), userId, doc, fields, prev.mutator, prev.options);
        });
      });
    }
  };
  if (async) {
    const wrappedCallback = function (err, affected) {
      after(affected, err);
      for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        args[_key - 2] = arguments[_key];
      }
      return callback.call(this, err, affected, ...args);
    };
    return _super.call(this, selector, mutator, options, wrappedCallback);
  } else {
    const affected = _super.call(this, selector, mutator, options, callback);
    after(affected);
    return affected;
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"upsert.js":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/matb33_collection-hooks/upsert.js                                                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let _objectSpread;
module.link("@babel/runtime/helpers/objectSpread2", {
  default(v) {
    _objectSpread = v;
  }
}, 0);
let EJSON;
module.link("meteor/ejson", {
  EJSON(v) {
    EJSON = v;
  }
}, 0);
let CollectionHooks;
module.link("./collection-hooks", {
  CollectionHooks(v) {
    CollectionHooks = v;
  }
}, 1);
const isEmpty = a => !Array.isArray(a) || !a.length;
CollectionHooks.defineAdvice('upsert', function (userId, _super, instance, aspectGroup, getTransform, args, suppressAspects) {
  args[0] = CollectionHooks.normalizeSelector(instance._getFindSelector(args));
  const ctx = {
    context: this,
    _super,
    args
  };
  let [selector, mutator, options, callback] = args;
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  const async = typeof callback === 'function';
  let docs;
  let docIds;
  let abort;
  const prev = {};
  if (!suppressAspects) {
    if (!isEmpty(aspectGroup.upsert.before) || !isEmpty(aspectGroup.update.after)) {
      docs = CollectionHooks.getDocs.call(this, instance, selector, options).fetch();
      docIds = docs.map(doc => doc._id);
    }

    // copy originals for convenience for the 'after' pointcut
    if (!isEmpty(aspectGroup.update.after)) {
      if (aspectGroup.update.after.some(o => o.options.fetchPrevious !== false) && CollectionHooks.extendOptions(instance.hookOptions, {}, 'after', 'update').fetchPrevious !== false) {
        prev.mutator = EJSON.clone(mutator);
        prev.options = EJSON.clone(options);
        prev.docs = {};
        docs.forEach(doc => {
          prev.docs[doc._id] = EJSON.clone(doc);
        });
      }
    }

    // before
    aspectGroup.upsert.before.forEach(o => {
      const r = o.aspect.call(ctx, userId, selector, mutator, options);
      if (r === false) abort = true;
    });
    if (abort) return {
      numberAffected: 0
    };
  }
  const afterUpdate = (affected, err) => {
    if (!suppressAspects && !isEmpty(aspectGroup.update.after)) {
      const fields = CollectionHooks.getFields(mutator);
      const docs = CollectionHooks.getDocs.call(this, instance, {
        _id: {
          $in: docIds
        }
      }, options).fetch();
      aspectGroup.update.after.forEach(o => {
        docs.forEach(doc => {
          o.aspect.call(_objectSpread({
            transform: getTransform(doc),
            previous: prev.docs && prev.docs[doc._id],
            affected,
            err
          }, ctx), userId, doc, fields, prev.mutator, prev.options);
        });
      });
    }
  };
  const afterInsert = (_id, err) => {
    if (!suppressAspects && !isEmpty(aspectGroup.insert.after)) {
      const doc = CollectionHooks.getDocs.call(this, instance, {
        _id
      }, selector, {}).fetch()[0]; // 3rd argument passes empty object which causes magic logic to imply limit:1
      const lctx = _objectSpread({
        transform: getTransform(doc),
        _id,
        err
      }, ctx);
      aspectGroup.insert.after.forEach(o => {
        o.aspect.call(lctx, userId, doc);
      });
    }
  };
  if (async) {
    const wrappedCallback = function (err, ret) {
      if (err || ret && ret.insertedId) {
        // Send any errors to afterInsert
        afterInsert(ret.insertedId, err);
      } else {
        afterUpdate(ret && ret.numberAffected, err); // Note that err can never reach here
      }
      return CollectionHooks.hookedOp(function () {
        return callback.call(this, err, ret);
      });
    };
    return CollectionHooks.directOp(() => _super.call(this, selector, mutator, options, wrappedCallback));
  } else {
    const ret = CollectionHooks.directOp(() => _super.call(this, selector, mutator, options, callback));
    if (ret && ret.insertedId) {
      afterInsert(ret.insertedId);
    } else {
      afterUpdate(ret && ret.numberAffected);
    }
    return ret;
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"users-compat.js":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/matb33_collection-hooks/users-compat.js                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 0);
let Mongo;
module.link("meteor/mongo", {
  Mongo(v) {
    Mongo = v;
  }
}, 1);
let CollectionHooks;
module.link("./collection-hooks", {
  CollectionHooks(v) {
    CollectionHooks = v;
  }
}, 2);
if (Meteor.users) {
  // If Meteor.users has been instantiated, attempt to re-assign its prototype:
  CollectionHooks.reassignPrototype(Meteor.users);

  // Next, give it the hook aspects:
  CollectionHooks.extendCollectionInstance(Meteor.users, Mongo.Collection);
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json",
    ".d.ts"
  ]
});

var exports = require("/node_modules/meteor/matb33:collection-hooks/server.js");

/* Exports */
Package._define("matb33:collection-hooks", exports, {
  CollectionHooks: CollectionHooks
});

})();

//# sourceURL=meteor://💻app/packages/matb33_collection-hooks.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbWF0YjMzOmNvbGxlY3Rpb24taG9va3Mvc2VydmVyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9tYXRiMzM6Y29sbGVjdGlvbi1ob29rcy9hZHZpY2VzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9tYXRiMzM6Y29sbGVjdGlvbi1ob29rcy9jb2xsZWN0aW9uLWhvb2tzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9tYXRiMzM6Y29sbGVjdGlvbi1ob29rcy9maW5kLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9tYXRiMzM6Y29sbGVjdGlvbi1ob29rcy9maW5kb25lLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9tYXRiMzM6Y29sbGVjdGlvbi1ob29rcy9pbnNlcnQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21hdGIzMzpjb2xsZWN0aW9uLWhvb2tzL3JlbW92ZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbWF0YjMzOmNvbGxlY3Rpb24taG9va3MvdXBkYXRlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9tYXRiMzM6Y29sbGVjdGlvbi1ob29rcy91cHNlcnQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21hdGIzMzpjb2xsZWN0aW9uLWhvb2tzL3VzZXJzLWNvbXBhdC5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJDb2xsZWN0aW9uSG9va3MiLCJNZXRlb3IiLCJsaW5rIiwidiIsInB1Ymxpc2hVc2VySWQiLCJFbnZpcm9ubWVudFZhcmlhYmxlIiwiZ2V0VXNlcklkIiwidXNlcklkIiwiZSIsImdldCIsImRlZmF1bHRVc2VySWQiLCJfcHVibGlzaCIsInB1Ymxpc2giLCJuYW1lIiwiaGFuZGxlciIsIm9wdGlvbnMiLCJjYWxsIiwiX2xlbiIsImFyZ3VtZW50cyIsImxlbmd0aCIsImFyZ3MiLCJBcnJheSIsIl9rZXkiLCJ3aXRoVmFsdWUiLCJhcHBseSIsImlzV2l0aGluUHVibGlzaCIsInVuZGVmaW5lZCIsIl9vYmplY3RXaXRob3V0UHJvcGVydGllcyIsImRlZmF1bHQiLCJfb2JqZWN0U3ByZWFkIiwiTW9uZ28iLCJFSlNPTiIsIkxvY2FsQ29sbGVjdGlvbiIsImFkdmljZXMiLCJkZWZhdWx0cyIsImJlZm9yZSIsImluc2VydCIsInVwZGF0ZSIsInJlbW92ZSIsInVwc2VydCIsImZpbmQiLCJmaW5kT25lIiwiYWxsIiwiYWZ0ZXIiLCJkaXJlY3RFbnYiLCJkaXJlY3RPcCIsImZ1bmMiLCJob29rZWRPcCIsImV4dGVuZENvbGxlY3Rpb25JbnN0YW5jZSIsInNlbGYiLCJjb25zdHJ1Y3RvciIsImZvckVhY2giLCJwb2ludGN1dCIsIk9iamVjdCIsImVudHJpZXMiLCJfcmVmIiwibWV0aG9kIiwiYWR2aWNlIiwiX2Vuc3VyZSIsIl9ob29rQXNwZWN0cyIsImFzcGVjdCIsInRhcmdldCIsImluaXRPcHRpb25zIiwicHVzaCIsInJlcGxhY2UiLCJzcmMiLCJ0YXJnZXRJbmRleCIsImZpbmRJbmRleCIsImVudHJ5IiwibmV3VGFyZ2V0Iiwic3BsaWNlIiwiaG9va09wdGlvbnMiLCJjbG9uZSIsIl9yZWYyIiwiY29sbGVjdGlvbiIsImlzQ2xpZW50IiwiX2NvbGxlY3Rpb24iLCJfc3VwZXIiLCJkaXJlY3QiLCJwcm90b3R5cGUiLCJhc3luY01ldGhvZCIsIl9sZW4yIiwiX2tleTIiLCJfbGVuMyIsIl9rZXkzIiwiZG9jIiwiX3RyYW5zZm9ybSIsImQiLCJkZWZpbmVBZHZpY2UiLCJnZXRBZHZpY2UiLCJleHRlbmRPcHRpb25zIiwic291cmNlIiwiZ2V0RG9jcyIsInNlbGVjdG9yIiwiZmV0Y2hGaWVsZHMiLCJ1c2VEaXJlY3QiLCJmaW5kT3B0aW9ucyIsInRyYW5zZm9ybSIsInJlYWN0aXZlIiwia2V5cyIsImZpZWxkcyIsIm11bHRpIiwibGltaXQiLCJyZXN0IiwiX2V4Y2x1ZGVkIiwiYXNzaWduIiwibm9ybWFsaXplU2VsZWN0b3IiLCJPYmplY3RJRCIsIl9pZCIsImdldEZpZWxkcyIsIm11dGF0b3IiLCJvcGVyYXRvcnMiLCJfcmVmMyIsIm9wIiwicGFyYW1zIiwiaW5jbHVkZXMiLCJmaWVsZCIsImluZGV4T2YiLCJzdWJzdHJpbmciLCJyZWFzc2lnblByb3RvdHlwZSIsImluc3RhbmNlIiwiY29uc3RyIiwiaGFzU2V0UHJvdG90eXBlT2YiLCJzZXRQcm90b3R5cGVPZiIsIkNvbGxlY3Rpb24iLCJfX3Byb3RvX18iLCJ3cmFwQ29sbGVjdGlvbiIsIm5zIiwiYXMiLCJfQ29sbGVjdGlvbkNvbnN0cnVjdG9yIiwiX0NvbGxlY3Rpb25Qcm90b3R5cGUiLCJfTmV3Q29sbGVjdGlvbkNvbnRydWN0b3IiLCJwcm90byIsIl9sZW40IiwiX2tleTQiLCJyZXQiLCJwcm9wIiwiRnVuY3Rpb24iLCJtb2RpZnkiLCJfbW9kaWZ5IiwiYXNwZWN0cyIsImdldFRyYW5zZm9ybSIsInN1cHByZXNzQXNwZWN0cyIsImN0eCIsImNvbnRleHQiLCJfZ2V0RmluZFNlbGVjdG9yIiwiX2dldEZpbmRPcHRpb25zIiwiYWJvcnQiLCJvIiwiciIsImN1cnNvciIsImNhbGxiYWNrIiwiYXN5bmMiLCJpZCIsImVyciIsIm9wcyIsIl9zdHIiLCJ0b1N0cmluZyIsImxjdHgiLCJ3cmFwcGVkQ2FsbGJhY2siLCJvYmoiLCJpbnNlcnRlZElkIiwiaXNFbXB0eSIsImEiLCJpc0FycmF5IiwiZG9jcyIsInByZXYiLCJmZXRjaCIsInJlc3VsdCIsImRvY0lkcyIsInNob3VsZEZldGNoRm9yQmVmb3JlIiwic2hvdWxkRmV0Y2hGb3JBZnRlciIsInNob3VsZEZldGNoRm9yUHJldmlvdXMiLCJ2YWx1ZXMiLCJzb21lIiwiZmV0Y2hQcmV2aW91cyIsImFmdGVyQXNwZWN0RmV0Y2hGaWVsZHMiLCJtYXAiLCJiZWZvcmVBc3BlY3RGZXRjaEZpZWxkcyIsImFmdGVyR2xvYmFsIiwiYmVmb3JlR2xvYmFsIiwiYWZmZWN0ZWQiLCJhc3BlY3RGZXRjaEZpZWxkcyIsImdsb2JhbEZldGNoRmllbGRzIiwiJGluIiwicHJldmlvdXMiLCJhc3BlY3RHcm91cCIsIm51bWJlckFmZmVjdGVkIiwiYWZ0ZXJVcGRhdGUiLCJhZnRlckluc2VydCIsInVzZXJzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLE1BQU0sQ0FBQ0MsTUFBTSxDQUFDO0VBQUNDLGVBQWUsRUFBQ0EsQ0FBQSxLQUFJQTtBQUFlLENBQUMsQ0FBQztBQUFDLElBQUlDLE1BQU07QUFBQ0gsTUFBTSxDQUFDSSxJQUFJLENBQUMsZUFBZSxFQUFDO0VBQUNELE1BQU1BLENBQUNFLENBQUMsRUFBQztJQUFDRixNQUFNLEdBQUNFLENBQUM7RUFBQTtBQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7QUFBQyxJQUFJSCxlQUFlO0FBQUNGLE1BQU0sQ0FBQ0ksSUFBSSxDQUFDLG9CQUFvQixFQUFDO0VBQUNGLGVBQWVBLENBQUNHLENBQUMsRUFBQztJQUFDSCxlQUFlLEdBQUNHLENBQUM7RUFBQTtBQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7QUFBQ0wsTUFBTSxDQUFDSSxJQUFJLENBQUMsV0FBVyxDQUFDO0FBSzdPLE1BQU1FLGFBQWEsR0FBRyxJQUFJSCxNQUFNLENBQUNJLG1CQUFtQixDQUFDLENBQUM7QUFFdERMLGVBQWUsQ0FBQ00sU0FBUyxHQUFHLFNBQVNBLFNBQVNBLENBQUEsRUFBSTtFQUNoRCxJQUFJQyxNQUFNO0VBRVYsSUFBSTtJQUNGO0lBQ0E7SUFDQUEsTUFBTSxHQUFHTixNQUFNLENBQUNNLE1BQU0sSUFBSU4sTUFBTSxDQUFDTSxNQUFNLENBQUMsQ0FBQztFQUMzQyxDQUFDLENBQUMsT0FBT0MsQ0FBQyxFQUFFLENBQUM7RUFFYixJQUFJRCxNQUFNLElBQUksSUFBSSxFQUFFO0lBQ2xCO0lBQ0FBLE1BQU0sR0FBR0gsYUFBYSxDQUFDSyxHQUFHLENBQUMsQ0FBQztFQUM5QjtFQUVBLElBQUlGLE1BQU0sSUFBSSxJQUFJLEVBQUU7SUFDbEJBLE1BQU0sR0FBR1AsZUFBZSxDQUFDVSxhQUFhO0VBQ3hDO0VBRUEsT0FBT0gsTUFBTTtBQUNmLENBQUM7QUFFRCxNQUFNSSxRQUFRLEdBQUdWLE1BQU0sQ0FBQ1csT0FBTztBQUMvQlgsTUFBTSxDQUFDVyxPQUFPLEdBQUcsVUFBVUMsSUFBSSxFQUFFQyxPQUFPLEVBQUVDLE9BQU8sRUFBRTtFQUNqRCxPQUFPSixRQUFRLENBQUNLLElBQUksQ0FBQyxJQUFJLEVBQUVILElBQUksRUFBRSxZQUFtQjtJQUFBLFNBQUFJLElBQUEsR0FBQUMsU0FBQSxDQUFBQyxNQUFBLEVBQU5DLElBQUksT0FBQUMsS0FBQSxDQUFBSixJQUFBLEdBQUFLLElBQUEsTUFBQUEsSUFBQSxHQUFBTCxJQUFBLEVBQUFLLElBQUE7TUFBSkYsSUFBSSxDQUFBRSxJQUFBLElBQUFKLFNBQUEsQ0FBQUksSUFBQTtJQUFBO0lBQ2hEO0lBQ0EsT0FBT2xCLGFBQWEsQ0FBQ21CLFNBQVMsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDaEIsTUFBTSxFQUFFLE1BQU1PLE9BQU8sQ0FBQ1UsS0FBSyxDQUFDLElBQUksRUFBRUosSUFBSSxDQUFDLENBQUM7RUFDdEYsQ0FBQyxFQUFFTCxPQUFPLENBQUM7QUFDYixDQUFDOztBQUVEO0FBQ0E7QUFDQWYsZUFBZSxDQUFDeUIsZUFBZSxHQUFHLE1BQU1yQixhQUFhLENBQUNLLEdBQUcsQ0FBQyxDQUFDLEtBQUtpQixTQUFTLEM7Ozs7Ozs7Ozs7O0FDdEN6RTVCLE1BQU0sQ0FBQ0ksSUFBSSxDQUFDLGFBQWEsQ0FBQztBQUFDSixNQUFNLENBQUNJLElBQUksQ0FBQyxhQUFhLENBQUM7QUFBQ0osTUFBTSxDQUFDSSxJQUFJLENBQUMsYUFBYSxDQUFDO0FBQUNKLE1BQU0sQ0FBQ0ksSUFBSSxDQUFDLGFBQWEsQ0FBQztBQUFDSixNQUFNLENBQUNJLElBQUksQ0FBQyxXQUFXLENBQUM7QUFBQ0osTUFBTSxDQUFDSSxJQUFJLENBQUMsY0FBYyxDQUFDO0FBQUNKLE1BQU0sQ0FBQ0ksSUFBSSxDQUFDLG1CQUFtQixDQUFDLEM7Ozs7Ozs7Ozs7OztBQ0FqTSxJQUFJeUIsd0JBQXdCO0FBQUM3QixNQUFNLENBQUNJLElBQUksQ0FBQyxnREFBZ0QsRUFBQztFQUFDMEIsT0FBT0EsQ0FBQ3pCLENBQUMsRUFBQztJQUFDd0Isd0JBQXdCLEdBQUN4QixDQUFDO0VBQUE7QUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0FBQUMsSUFBSTBCLGFBQWE7QUFBQy9CLE1BQU0sQ0FBQ0ksSUFBSSxDQUFDLHNDQUFzQyxFQUFDO0VBQUMwQixPQUFPQSxDQUFDekIsQ0FBQyxFQUFDO0lBQUMwQixhQUFhLEdBQUMxQixDQUFDO0VBQUE7QUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0FBQTNPTCxNQUFNLENBQUNDLE1BQU0sQ0FBQztFQUFDQyxlQUFlLEVBQUNBLENBQUEsS0FBSUE7QUFBZSxDQUFDLENBQUM7QUFBQyxJQUFJQyxNQUFNO0FBQUNILE1BQU0sQ0FBQ0ksSUFBSSxDQUFDLGVBQWUsRUFBQztFQUFDRCxNQUFNQSxDQUFDRSxDQUFDLEVBQUM7SUFBQ0YsTUFBTSxHQUFDRSxDQUFDO0VBQUE7QUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0FBQUMsSUFBSTJCLEtBQUs7QUFBQ2hDLE1BQU0sQ0FBQ0ksSUFBSSxDQUFDLGNBQWMsRUFBQztFQUFDNEIsS0FBS0EsQ0FBQzNCLENBQUMsRUFBQztJQUFDMkIsS0FBSyxHQUFDM0IsQ0FBQztFQUFBO0FBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztBQUFDLElBQUk0QixLQUFLO0FBQUNqQyxNQUFNLENBQUNJLElBQUksQ0FBQyxjQUFjLEVBQUM7RUFBQzZCLEtBQUtBLENBQUM1QixDQUFDLEVBQUM7SUFBQzRCLEtBQUssR0FBQzVCLENBQUM7RUFBQTtBQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7QUFBQyxJQUFJNkIsZUFBZTtBQUFDbEMsTUFBTSxDQUFDSSxJQUFJLENBQUMsa0JBQWtCLEVBQUM7RUFBQzhCLGVBQWVBLENBQUM3QixDQUFDLEVBQUM7SUFBQzZCLGVBQWUsR0FBQzdCLENBQUM7RUFBQTtBQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7QUFLMVU7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNOEIsT0FBTyxHQUFHLENBQUMsQ0FBQztBQUVYLE1BQU1qQyxlQUFlLEdBQUc7RUFDN0JrQyxRQUFRLEVBQUU7SUFDUkMsTUFBTSxFQUFFO01BQUVDLE1BQU0sRUFBRSxDQUFDLENBQUM7TUFBRUMsTUFBTSxFQUFFLENBQUMsQ0FBQztNQUFFQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO01BQUVDLE1BQU0sRUFBRSxDQUFDLENBQUM7TUFBRUMsSUFBSSxFQUFFLENBQUMsQ0FBQztNQUFFQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO01BQUVDLEdBQUcsRUFBRSxDQUFDO0lBQUUsQ0FBQztJQUMxRkMsS0FBSyxFQUFFO01BQUVQLE1BQU0sRUFBRSxDQUFDLENBQUM7TUFBRUMsTUFBTSxFQUFFLENBQUMsQ0FBQztNQUFFQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO01BQUVFLElBQUksRUFBRSxDQUFDLENBQUM7TUFBRUMsT0FBTyxFQUFFLENBQUMsQ0FBQztNQUFFQyxHQUFHLEVBQUUsQ0FBQztJQUFFLENBQUM7SUFDN0VBLEdBQUcsRUFBRTtNQUFFTixNQUFNLEVBQUUsQ0FBQyxDQUFDO01BQUVDLE1BQU0sRUFBRSxDQUFDLENBQUM7TUFBRUMsTUFBTSxFQUFFLENBQUMsQ0FBQztNQUFFRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO01BQUVDLE9BQU8sRUFBRSxDQUFDLENBQUM7TUFBRUMsR0FBRyxFQUFFLENBQUM7SUFBRTtFQUM1RSxDQUFDO0VBQ0RFLFNBQVMsRUFBRSxJQUFJM0MsTUFBTSxDQUFDSSxtQkFBbUIsQ0FBQyxDQUFDO0VBQzNDd0MsUUFBUUEsQ0FBRUMsSUFBSSxFQUFFO0lBQ2QsT0FBTyxJQUFJLENBQUNGLFNBQVMsQ0FBQ3JCLFNBQVMsQ0FBQyxJQUFJLEVBQUV1QixJQUFJLENBQUM7RUFDN0MsQ0FBQztFQUNEQyxRQUFRQSxDQUFFRCxJQUFJLEVBQUU7SUFDZCxPQUFPLElBQUksQ0FBQ0YsU0FBUyxDQUFDckIsU0FBUyxDQUFDLEtBQUssRUFBRXVCLElBQUksQ0FBQztFQUM5QztBQUNGLENBQUM7QUFFRDlDLGVBQWUsQ0FBQ2dELHdCQUF3QixHQUFHLFNBQVNBLHdCQUF3QkEsQ0FBRUMsSUFBSSxFQUFFQyxXQUFXLEVBQUU7RUFDL0Y7RUFDQTtFQUNBLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDQyxPQUFPLENBQUMsVUFBVUMsUUFBUSxFQUFFO0lBQzlDQyxNQUFNLENBQUNDLE9BQU8sQ0FBQ3JCLE9BQU8sQ0FBQyxDQUFDa0IsT0FBTyxDQUFDLFVBQUFJLElBQUEsRUFBNEI7TUFBQSxJQUFsQixDQUFDQyxNQUFNLEVBQUVDLE1BQU0sQ0FBQyxHQUFBRixJQUFBO01BQ3hELElBQUlFLE1BQU0sS0FBSyxRQUFRLElBQUlMLFFBQVEsS0FBSyxPQUFPLEVBQUU7TUFFakRuRCxNQUFNLENBQUN5RCxPQUFPLENBQUNULElBQUksRUFBRUcsUUFBUSxFQUFFSSxNQUFNLENBQUM7TUFDdEN2RCxNQUFNLENBQUN5RCxPQUFPLENBQUNULElBQUksRUFBRSxjQUFjLEVBQUVPLE1BQU0sQ0FBQztNQUU1Q1AsSUFBSSxDQUFDVSxZQUFZLENBQUNILE1BQU0sQ0FBQyxDQUFDSixRQUFRLENBQUMsR0FBRyxFQUFFO01BQ3hDSCxJQUFJLENBQUNHLFFBQVEsQ0FBQyxDQUFDSSxNQUFNLENBQUMsR0FBRyxVQUFVSSxNQUFNLEVBQUU3QyxPQUFPLEVBQUU7UUFDbEQsSUFBSThDLE1BQU0sR0FBRztVQUNYRCxNQUFNO1VBQ043QyxPQUFPLEVBQUVmLGVBQWUsQ0FBQzhELFdBQVcsQ0FBQy9DLE9BQU8sRUFBRXFDLFFBQVEsRUFBRUksTUFBTTtRQUNoRSxDQUFDO1FBQ0Q7UUFDQVAsSUFBSSxDQUFDVSxZQUFZLENBQUNILE1BQU0sQ0FBQyxDQUFDSixRQUFRLENBQUMsQ0FBQ1csSUFBSSxDQUFDRixNQUFNLENBQUM7UUFFaEQsT0FBTztVQUNMRyxPQUFPQSxDQUFFSixNQUFNLEVBQUU3QyxPQUFPLEVBQUU7WUFDeEI7WUFDQTtZQUNBLE1BQU1rRCxHQUFHLEdBQUdoQixJQUFJLENBQUNVLFlBQVksQ0FBQ0gsTUFBTSxDQUFDLENBQUNKLFFBQVEsQ0FBQztZQUMvQyxNQUFNYyxXQUFXLEdBQUdELEdBQUcsQ0FBQ0UsU0FBUyxDQUFDQyxLQUFLLElBQUlBLEtBQUssS0FBS1AsTUFBTSxDQUFDO1lBQzVELE1BQU1RLFNBQVMsR0FBRztjQUNoQlQsTUFBTTtjQUNON0MsT0FBTyxFQUFFZixlQUFlLENBQUM4RCxXQUFXLENBQUMvQyxPQUFPLEVBQUVxQyxRQUFRLEVBQUVJLE1BQU07WUFDaEUsQ0FBQztZQUNEUyxHQUFHLENBQUNLLE1BQU0sQ0FBQ0osV0FBVyxFQUFFLENBQUMsRUFBRUcsU0FBUyxDQUFDO1lBQ3JDO1lBQ0FSLE1BQU0sR0FBR1EsU0FBUztVQUNwQixDQUFDO1VBQ0QvQixNQUFNQSxDQUFBLEVBQUk7WUFDUjtZQUNBO1lBQ0EsTUFBTTJCLEdBQUcsR0FBR2hCLElBQUksQ0FBQ1UsWUFBWSxDQUFDSCxNQUFNLENBQUMsQ0FBQ0osUUFBUSxDQUFDO1lBQy9DLE1BQU1jLFdBQVcsR0FBR0QsR0FBRyxDQUFDRSxTQUFTLENBQUNDLEtBQUssSUFBSUEsS0FBSyxLQUFLUCxNQUFNLENBQUM7WUFDNURaLElBQUksQ0FBQ1UsWUFBWSxDQUFDSCxNQUFNLENBQUMsQ0FBQ0osUUFBUSxDQUFDLENBQUNrQixNQUFNLENBQUNKLFdBQVcsRUFBRSxDQUFDLENBQUM7VUFDNUQ7UUFDRixDQUFDO01BQ0gsQ0FBQztJQUNILENBQUMsQ0FBQztFQUNKLENBQUMsQ0FBQzs7RUFFRjtFQUNBO0VBQ0E7RUFDQWpCLElBQUksQ0FBQ3NCLFdBQVcsR0FBR3hDLEtBQUssQ0FBQ3lDLEtBQUssQ0FBQ3hFLGVBQWUsQ0FBQ2tDLFFBQVEsQ0FBQzs7RUFFeEQ7RUFDQW1CLE1BQU0sQ0FBQ0MsT0FBTyxDQUFDckIsT0FBTyxDQUFDLENBQUNrQixPQUFPLENBQUMsVUFBQXNCLEtBQUEsRUFBNEI7SUFBQSxJQUFsQixDQUFDakIsTUFBTSxFQUFFQyxNQUFNLENBQUMsR0FBQWdCLEtBQUE7SUFDeEQsTUFBTUMsVUFBVSxHQUFHekUsTUFBTSxDQUFDMEUsUUFBUSxJQUFJbkIsTUFBTSxLQUFLLFFBQVEsR0FBR1AsSUFBSSxHQUFHQSxJQUFJLENBQUMyQixXQUFXOztJQUVuRjtJQUNBLE1BQU1DLE1BQU0sR0FBR0gsVUFBVSxDQUFDbEIsTUFBTSxDQUFDO0lBRWpDdkQsTUFBTSxDQUFDeUQsT0FBTyxDQUFDVCxJQUFJLEVBQUUsUUFBUSxFQUFFTyxNQUFNLENBQUM7SUFDdENQLElBQUksQ0FBQzZCLE1BQU0sQ0FBQ3RCLE1BQU0sQ0FBQyxHQUFHLFlBQW1CO01BQUEsU0FBQXZDLElBQUEsR0FBQUMsU0FBQSxDQUFBQyxNQUFBLEVBQU5DLElBQUksT0FBQUMsS0FBQSxDQUFBSixJQUFBLEdBQUFLLElBQUEsTUFBQUEsSUFBQSxHQUFBTCxJQUFBLEVBQUFLLElBQUE7UUFBSkYsSUFBSSxDQUFBRSxJQUFBLElBQUFKLFNBQUEsQ0FBQUksSUFBQTtNQUFBO01BQ3JDLE9BQU90QixlQUFlLENBQUM2QyxRQUFRLENBQUMsWUFBWTtRQUMxQyxPQUFPSyxXQUFXLENBQUM2QixTQUFTLENBQUN2QixNQUFNLENBQUMsQ0FBQ2hDLEtBQUssQ0FBQ3lCLElBQUksRUFBRTdCLElBQUksQ0FBQztNQUN4RCxDQUFDLENBQUM7SUFDSixDQUFDO0lBRUQsTUFBTTRELFdBQVcsR0FBR3hCLE1BQU0sR0FBRyxPQUFPO0lBRXBDLElBQUlOLFdBQVcsQ0FBQzZCLFNBQVMsQ0FBQ0MsV0FBVyxDQUFDLEVBQUU7TUFDdEMvQixJQUFJLENBQUM2QixNQUFNLENBQUNFLFdBQVcsQ0FBQyxHQUFHLFlBQW1CO1FBQUEsU0FBQUMsS0FBQSxHQUFBL0QsU0FBQSxDQUFBQyxNQUFBLEVBQU5DLElBQUksT0FBQUMsS0FBQSxDQUFBNEQsS0FBQSxHQUFBQyxLQUFBLE1BQUFBLEtBQUEsR0FBQUQsS0FBQSxFQUFBQyxLQUFBO1VBQUo5RCxJQUFJLENBQUE4RCxLQUFBLElBQUFoRSxTQUFBLENBQUFnRSxLQUFBO1FBQUE7UUFDMUMsT0FBT2xGLGVBQWUsQ0FBQzZDLFFBQVEsQ0FBQyxZQUFZO1VBQzFDLE9BQU9LLFdBQVcsQ0FBQzZCLFNBQVMsQ0FBQ0MsV0FBVyxDQUFDLENBQUN4RCxLQUFLLENBQUN5QixJQUFJLEVBQUU3QixJQUFJLENBQUM7UUFDN0QsQ0FBQyxDQUFDO01BQ0osQ0FBQztJQUNIO0lBRUFzRCxVQUFVLENBQUNsQixNQUFNLENBQUMsR0FBRyxZQUFtQjtNQUFBLFNBQUEyQixLQUFBLEdBQUFqRSxTQUFBLENBQUFDLE1BQUEsRUFBTkMsSUFBSSxPQUFBQyxLQUFBLENBQUE4RCxLQUFBLEdBQUFDLEtBQUEsTUFBQUEsS0FBQSxHQUFBRCxLQUFBLEVBQUFDLEtBQUE7UUFBSmhFLElBQUksQ0FBQWdFLEtBQUEsSUFBQWxFLFNBQUEsQ0FBQWtFLEtBQUE7TUFBQTtNQUNwQyxJQUFJcEYsZUFBZSxDQUFDNEMsU0FBUyxDQUFDbkMsR0FBRyxDQUFDLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDNUMsT0FBT29FLE1BQU0sQ0FBQ3JELEtBQUssQ0FBQ2tELFVBQVUsRUFBRXRELElBQUksQ0FBQztNQUN2Qzs7TUFFQTtNQUNBO01BQ0E7TUFDQTtNQUNBO01BQ0E7TUFDQTtNQUNBO01BQ0E7O01BRUEsT0FBT3FDLE1BQU0sQ0FBQ3pDLElBQUksQ0FBQyxJQUFJLEVBQ3JCaEIsZUFBZSxDQUFDTSxTQUFTLENBQUMsQ0FBQyxFQUMzQnVFLE1BQU0sRUFDTjVCLElBQUksRUFDSk8sTUFBTSxLQUFLLFFBQVEsR0FDZjtRQUNFcEIsTUFBTSxFQUFFYSxJQUFJLENBQUNVLFlBQVksQ0FBQ3ZCLE1BQU0sSUFBSSxDQUFDLENBQUM7UUFDdENDLE1BQU0sRUFBRVksSUFBSSxDQUFDVSxZQUFZLENBQUN0QixNQUFNLElBQUksQ0FBQyxDQUFDO1FBQ3RDRSxNQUFNLEVBQUVVLElBQUksQ0FBQ1UsWUFBWSxDQUFDcEIsTUFBTSxJQUFJLENBQUM7TUFDdkMsQ0FBQyxHQUNEVSxJQUFJLENBQUNVLFlBQVksQ0FBQ0gsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQ25DLFVBQVU2QixHQUFHLEVBQUU7UUFDYixPQUNFLE9BQU9wQyxJQUFJLENBQUNxQyxVQUFVLEtBQUssVUFBVSxHQUNqQyxVQUFVQyxDQUFDLEVBQUU7VUFBRSxPQUFPdEMsSUFBSSxDQUFDcUMsVUFBVSxDQUFDQyxDQUFDLElBQUlGLEdBQUcsQ0FBQztRQUFDLENBQUMsR0FDakQsVUFBVUUsQ0FBQyxFQUFFO1VBQUUsT0FBT0EsQ0FBQyxJQUFJRixHQUFHO1FBQUMsQ0FBQztNQUV4QyxDQUFDLEVBQ0RqRSxJQUFJLEVBQ0osS0FDRixDQUFDO0lBQ0gsQ0FBQztFQUNILENBQUMsQ0FBQztBQUNKLENBQUM7QUFFRHBCLGVBQWUsQ0FBQ3dGLFlBQVksR0FBRyxDQUFDaEMsTUFBTSxFQUFFQyxNQUFNLEtBQUs7RUFDakR4QixPQUFPLENBQUN1QixNQUFNLENBQUMsR0FBR0MsTUFBTTtBQUMxQixDQUFDO0FBRUR6RCxlQUFlLENBQUN5RixTQUFTLEdBQUdqQyxNQUFNLElBQUl2QixPQUFPLENBQUN1QixNQUFNLENBQUM7QUFFckR4RCxlQUFlLENBQUM4RCxXQUFXLEdBQUcsQ0FBQy9DLE9BQU8sRUFBRXFDLFFBQVEsRUFBRUksTUFBTSxLQUN0RHhELGVBQWUsQ0FBQzBGLGFBQWEsQ0FBQzFGLGVBQWUsQ0FBQ2tDLFFBQVEsRUFBRW5CLE9BQU8sRUFBRXFDLFFBQVEsRUFBRUksTUFBTSxDQUFDO0FBRXBGeEQsZUFBZSxDQUFDMEYsYUFBYSxHQUFHLENBQUNDLE1BQU0sRUFBRTVFLE9BQU8sRUFBRXFDLFFBQVEsRUFBRUksTUFBTSxLQUFBM0IsYUFBQSxDQUFBQSxhQUFBLENBQUFBLGFBQUEsQ0FBQUEsYUFBQSxDQUFBQSxhQUFBLEtBQzFEZCxPQUFPLEdBQUs0RSxNQUFNLENBQUNqRCxHQUFHLENBQUNBLEdBQUcsR0FBS2lELE1BQU0sQ0FBQ3ZDLFFBQVEsQ0FBQyxDQUFDVixHQUFHLEdBQUtpRCxNQUFNLENBQUNqRCxHQUFHLENBQUNjLE1BQU0sQ0FBQyxHQUFLbUMsTUFBTSxDQUFDdkMsUUFBUSxDQUFDLENBQUNJLE1BQU0sQ0FBQyxDQUFHO0FBRWxIeEQsZUFBZSxDQUFDNEYsT0FBTyxHQUFHLFNBQVNBLE9BQU9BLENBQUVsQixVQUFVLEVBQUVtQixRQUFRLEVBQUU5RSxPQUFPLEVBQWdEO0VBQUEsSUFBOUMrRSxXQUFXLEdBQUE1RSxTQUFBLENBQUFDLE1BQUEsUUFBQUQsU0FBQSxRQUFBUSxTQUFBLEdBQUFSLFNBQUEsTUFBRyxDQUFDLENBQUM7RUFBQSxJQUFFO0lBQUU2RSxTQUFTLEdBQUc7RUFBTSxDQUFDLEdBQUE3RSxTQUFBLENBQUFDLE1BQUEsUUFBQUQsU0FBQSxRQUFBUSxTQUFBLEdBQUFSLFNBQUEsTUFBRyxDQUFDLENBQUM7RUFDckgsTUFBTThFLFdBQVcsR0FBRztJQUFFQyxTQUFTLEVBQUUsSUFBSTtJQUFFQyxRQUFRLEVBQUU7RUFBTSxDQUFDO0VBRXhELElBQUk3QyxNQUFNLENBQUM4QyxJQUFJLENBQUNMLFdBQVcsQ0FBQyxDQUFDM0UsTUFBTSxHQUFHLENBQUMsRUFBRTtJQUN2QzZFLFdBQVcsQ0FBQ0ksTUFBTSxHQUFHTixXQUFXO0VBQ2xDOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7RUFFRTtFQUNBO0VBQ0EsSUFBSS9FLE9BQU8sRUFBRTtJQUNYO0lBQ0E7SUFDQTtJQUNBO0lBQ0EsSUFBSSxDQUFDQSxPQUFPLENBQUNzRixLQUFLLEVBQUU7TUFDbEJMLFdBQVcsQ0FBQ00sS0FBSyxHQUFHLENBQUM7SUFDdkI7SUFDQSxNQUFNO1FBQUVELEtBQUs7UUFBRTlEO01BQWdCLENBQUMsR0FBR3hCLE9BQU87TUFBaEJ3RixJQUFJLEdBQUE1RSx3QkFBQSxDQUFLWixPQUFPLEVBQUF5RixTQUFBO0lBQzFDbkQsTUFBTSxDQUFDb0QsTUFBTSxDQUFDVCxXQUFXLEVBQUVPLElBQUksQ0FBQztFQUNsQzs7RUFFQTtFQUNBO0VBQ0EsT0FBTyxDQUFDUixTQUFTLEdBQUdyQixVQUFVLENBQUNJLE1BQU0sR0FBR0osVUFBVSxFQUFFbEMsSUFBSSxDQUFDcUQsUUFBUSxFQUFFRyxXQUFXLENBQUM7QUFDakYsQ0FBQzs7QUFFRDtBQUNBaEcsZUFBZSxDQUFDMEcsaUJBQWlCLEdBQUcsVUFBVWIsUUFBUSxFQUFFO0VBQ3RELElBQUksT0FBT0EsUUFBUSxLQUFLLFFBQVEsSUFBS0EsUUFBUSxJQUFJQSxRQUFRLENBQUMzQyxXQUFXLEtBQUtwQixLQUFLLENBQUM2RSxRQUFTLEVBQUU7SUFDekYsT0FBTztNQUNMQyxHQUFHLEVBQUVmO0lBQ1AsQ0FBQztFQUNILENBQUMsTUFBTTtJQUNMLE9BQU9BLFFBQVE7RUFDakI7QUFDRixDQUFDOztBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E3RixlQUFlLENBQUM2RyxTQUFTLEdBQUcsU0FBU0EsU0FBU0EsQ0FBRUMsT0FBTyxFQUFFO0VBQ3ZEO0VBQ0EsTUFBTVYsTUFBTSxHQUFHLEVBQUU7RUFDakI7RUFDQSxNQUFNVyxTQUFTLEdBQUcsQ0FDaEIsV0FBVyxFQUNYLE1BQU0sRUFDTixjQUFjLEVBQ2QsTUFBTSxFQUNOLE1BQU0sRUFDTixNQUFNLEVBQ04sTUFBTSxFQUNOLE9BQU8sRUFDUCxVQUFVLEVBQ1YsT0FBTyxFQUNQLFNBQVMsRUFDVCxNQUFNLEVBQ04sUUFBUSxDQUNUO0VBQ0Q7O0VBRUExRCxNQUFNLENBQUNDLE9BQU8sQ0FBQ3dELE9BQU8sQ0FBQyxDQUFDM0QsT0FBTyxDQUFDLFVBQUE2RCxLQUFBLEVBQXdCO0lBQUEsSUFBZCxDQUFDQyxFQUFFLEVBQUVDLE1BQU0sQ0FBQyxHQUFBRixLQUFBO0lBQ3BEO0lBQ0EsSUFBSUQsU0FBUyxDQUFDSSxRQUFRLENBQUNGLEVBQUUsQ0FBQyxFQUFFO01BQzVCO01BQ0U1RCxNQUFNLENBQUM4QyxJQUFJLENBQUNlLE1BQU0sQ0FBQyxDQUFDL0QsT0FBTyxDQUFDLFVBQVVpRSxLQUFLLEVBQUU7UUFDM0M7UUFDQTtRQUNBLElBQUlBLEtBQUssQ0FBQ0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO1VBQzdCRCxLQUFLLEdBQUdBLEtBQUssQ0FBQ0UsU0FBUyxDQUFDLENBQUMsRUFBRUYsS0FBSyxDQUFDQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDaEQ7O1FBRUE7UUFDQSxJQUFJLENBQUNqQixNQUFNLENBQUNlLFFBQVEsQ0FBQ0MsS0FBSyxDQUFDLEVBQUU7VUFDM0JoQixNQUFNLENBQUNyQyxJQUFJLENBQUNxRCxLQUFLLENBQUM7UUFDcEI7TUFDRixDQUFDLENBQUM7TUFDRjtJQUNGLENBQUMsTUFBTTtNQUNMaEIsTUFBTSxDQUFDckMsSUFBSSxDQUFDa0QsRUFBRSxDQUFDO0lBQ2pCO0lBQ0E7RUFDRixDQUFDLENBQUM7RUFFRixPQUFPYixNQUFNO0FBQ2YsQ0FBQztBQUVEcEcsZUFBZSxDQUFDdUgsaUJBQWlCLEdBQUcsU0FBU0EsaUJBQWlCQSxDQUFFQyxRQUFRLEVBQUVDLE1BQU0sRUFBRTtFQUNoRixNQUFNQyxpQkFBaUIsR0FBRyxPQUFPckUsTUFBTSxDQUFDc0UsY0FBYyxLQUFLLFVBQVU7RUFDckVGLE1BQU0sR0FBR0EsTUFBTSxJQUFJM0YsS0FBSyxDQUFDOEYsVUFBVTs7RUFFbkM7RUFDQTtFQUNBLElBQUlGLGlCQUFpQixFQUFFO0lBQ3JCckUsTUFBTSxDQUFDc0UsY0FBYyxDQUFDSCxRQUFRLEVBQUVDLE1BQU0sQ0FBQzFDLFNBQVMsQ0FBQztFQUNuRCxDQUFDLE1BQU0sSUFBSXlDLFFBQVEsQ0FBQ0ssU0FBUyxFQUFFO0lBQUU7SUFDL0JMLFFBQVEsQ0FBQ0ssU0FBUyxHQUFHSixNQUFNLENBQUMxQyxTQUFTLEVBQUM7RUFDeEM7QUFDRixDQUFDO0FBRUQvRSxlQUFlLENBQUM4SCxjQUFjLEdBQUcsU0FBU0EsY0FBY0EsQ0FBRUMsRUFBRSxFQUFFQyxFQUFFLEVBQUU7RUFDaEUsSUFBSSxDQUFDQSxFQUFFLENBQUNDLHNCQUFzQixFQUFFRCxFQUFFLENBQUNDLHNCQUFzQixHQUFHRCxFQUFFLENBQUNKLFVBQVU7RUFDekUsSUFBSSxDQUFDSSxFQUFFLENBQUNFLG9CQUFvQixFQUFFRixFQUFFLENBQUNFLG9CQUFvQixHQUFHLElBQUlGLEVBQUUsQ0FBQ0osVUFBVSxDQUFDLElBQUksQ0FBQztFQUUvRSxNQUFNMUUsV0FBVyxHQUFHNkUsRUFBRSxDQUFDSSx3QkFBd0IsSUFBSUgsRUFBRSxDQUFDQyxzQkFBc0I7RUFDNUUsTUFBTUcsS0FBSyxHQUFHSixFQUFFLENBQUNFLG9CQUFvQjtFQUVyQ0gsRUFBRSxDQUFDSCxVQUFVLEdBQUcsWUFBbUI7SUFBQSxTQUFBUyxLQUFBLEdBQUFuSCxTQUFBLENBQUFDLE1BQUEsRUFBTkMsSUFBSSxPQUFBQyxLQUFBLENBQUFnSCxLQUFBLEdBQUFDLEtBQUEsTUFBQUEsS0FBQSxHQUFBRCxLQUFBLEVBQUFDLEtBQUE7TUFBSmxILElBQUksQ0FBQWtILEtBQUEsSUFBQXBILFNBQUEsQ0FBQW9ILEtBQUE7SUFBQTtJQUMvQixNQUFNQyxHQUFHLEdBQUdyRixXQUFXLENBQUMxQixLQUFLLENBQUMsSUFBSSxFQUFFSixJQUFJLENBQUM7SUFDekNwQixlQUFlLENBQUNnRCx3QkFBd0IsQ0FBQyxJQUFJLEVBQUVFLFdBQVcsQ0FBQztJQUMzRCxPQUFPcUYsR0FBRztFQUNaLENBQUM7RUFDRDtFQUNBUixFQUFFLENBQUNJLHdCQUF3QixHQUFHSixFQUFFLENBQUNILFVBQVU7RUFFM0NHLEVBQUUsQ0FBQ0gsVUFBVSxDQUFDN0MsU0FBUyxHQUFHcUQsS0FBSztFQUMvQkwsRUFBRSxDQUFDSCxVQUFVLENBQUM3QyxTQUFTLENBQUM3QixXQUFXLEdBQUc2RSxFQUFFLENBQUNILFVBQVU7RUFFbkQsS0FBSyxNQUFNWSxJQUFJLElBQUluRixNQUFNLENBQUM4QyxJQUFJLENBQUNqRCxXQUFXLENBQUMsRUFBRTtJQUMzQzZFLEVBQUUsQ0FBQ0gsVUFBVSxDQUFDWSxJQUFJLENBQUMsR0FBR3RGLFdBQVcsQ0FBQ3NGLElBQUksQ0FBQztFQUN6Qzs7RUFFQTtFQUNBO0VBQ0FULEVBQUUsQ0FBQ0gsVUFBVSxDQUFDcEcsS0FBSyxHQUFHaUgsUUFBUSxDQUFDMUQsU0FBUyxDQUFDdkQsS0FBSztBQUNoRCxDQUFDO0FBRUR4QixlQUFlLENBQUMwSSxNQUFNLEdBQUcxRyxlQUFlLENBQUMyRyxPQUFPO0FBRWhELElBQUksT0FBTzdHLEtBQUssS0FBSyxXQUFXLEVBQUU7RUFDaEM5QixlQUFlLENBQUM4SCxjQUFjLENBQUM3SCxNQUFNLEVBQUU2QixLQUFLLENBQUM7RUFDN0M5QixlQUFlLENBQUM4SCxjQUFjLENBQUNoRyxLQUFLLEVBQUVBLEtBQUssQ0FBQztBQUM5QyxDQUFDLE1BQU07RUFDTDlCLGVBQWUsQ0FBQzhILGNBQWMsQ0FBQzdILE1BQU0sRUFBRUEsTUFBTSxDQUFDO0FBQ2hELEM7Ozs7Ozs7Ozs7O0FDelNBLElBQUlELGVBQWU7QUFBQ0YsTUFBTSxDQUFDSSxJQUFJLENBQUMsb0JBQW9CLEVBQUM7RUFBQ0YsZUFBZUEsQ0FBQ0csQ0FBQyxFQUFDO0lBQUNILGVBQWUsR0FBQ0csQ0FBQztFQUFBO0FBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztBQUUvRkgsZUFBZSxDQUFDd0YsWUFBWSxDQUFDLE1BQU0sRUFBRSxVQUFVakYsTUFBTSxFQUFFc0UsTUFBTSxFQUFFMkMsUUFBUSxFQUFFb0IsT0FBTyxFQUFFQyxZQUFZLEVBQUV6SCxJQUFJLEVBQUUwSCxlQUFlLEVBQUU7RUFDckgsTUFBTUMsR0FBRyxHQUFHO0lBQUVDLE9BQU8sRUFBRSxJQUFJO0lBQUVuRSxNQUFNO0lBQUV6RDtFQUFLLENBQUM7RUFDM0MsTUFBTXlFLFFBQVEsR0FBRzdGLGVBQWUsQ0FBQzBHLGlCQUFpQixDQUFDYyxRQUFRLENBQUN5QixnQkFBZ0IsQ0FBQzdILElBQUksQ0FBQyxDQUFDO0VBQ25GLE1BQU1MLE9BQU8sR0FBR3lHLFFBQVEsQ0FBQzBCLGVBQWUsQ0FBQzlILElBQUksQ0FBQztFQUM5QyxJQUFJK0gsS0FBSztFQUNUO0VBQ0EsSUFBSSxDQUFDTCxlQUFlLEVBQUU7SUFDcEJGLE9BQU8sQ0FBQ3pHLE1BQU0sQ0FBQ2dCLE9BQU8sQ0FBRWlHLENBQUMsSUFBSztNQUM1QixNQUFNQyxDQUFDLEdBQUdELENBQUMsQ0FBQ3hGLE1BQU0sQ0FBQzVDLElBQUksQ0FBQytILEdBQUcsRUFBRXhJLE1BQU0sRUFBRXNGLFFBQVEsRUFBRTlFLE9BQU8sQ0FBQztNQUN2RCxJQUFJc0ksQ0FBQyxLQUFLLEtBQUssRUFBRUYsS0FBSyxHQUFHLElBQUk7SUFDL0IsQ0FBQyxDQUFDO0lBRUYsSUFBSUEsS0FBSyxFQUFFLE9BQU8zQixRQUFRLENBQUNoRixJQUFJLENBQUNkLFNBQVMsQ0FBQztFQUM1QztFQUVBLE1BQU1pQixLQUFLLEdBQUkyRyxNQUFNLElBQUs7SUFDeEIsSUFBSSxDQUFDUixlQUFlLEVBQUU7TUFDcEJGLE9BQU8sQ0FBQ2pHLEtBQUssQ0FBQ1EsT0FBTyxDQUFFaUcsQ0FBQyxJQUFLO1FBQzNCQSxDQUFDLENBQUN4RixNQUFNLENBQUM1QyxJQUFJLENBQUMrSCxHQUFHLEVBQUV4SSxNQUFNLEVBQUVzRixRQUFRLEVBQUU5RSxPQUFPLEVBQUV1SSxNQUFNLENBQUM7TUFDdkQsQ0FBQyxDQUFDO0lBQ0o7RUFDRixDQUFDO0VBRUQsTUFBTWYsR0FBRyxHQUFHMUQsTUFBTSxDQUFDN0QsSUFBSSxDQUFDLElBQUksRUFBRTZFLFFBQVEsRUFBRTlFLE9BQU8sQ0FBQztFQUNoRDRCLEtBQUssQ0FBQzRGLEdBQUcsQ0FBQztFQUVWLE9BQU9BLEdBQUc7QUFDWixDQUFDLENBQUMsQzs7Ozs7Ozs7Ozs7QUM3QkYsSUFBSXZJLGVBQWU7QUFBQ0YsTUFBTSxDQUFDSSxJQUFJLENBQUMsb0JBQW9CLEVBQUM7RUFBQ0YsZUFBZUEsQ0FBQ0csQ0FBQyxFQUFDO0lBQUNILGVBQWUsR0FBQ0csQ0FBQztFQUFBO0FBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztBQUUvRkgsZUFBZSxDQUFDd0YsWUFBWSxDQUFDLFNBQVMsRUFBRSxVQUFVakYsTUFBTSxFQUFFc0UsTUFBTSxFQUFFMkMsUUFBUSxFQUFFb0IsT0FBTyxFQUFFQyxZQUFZLEVBQUV6SCxJQUFJLEVBQUUwSCxlQUFlLEVBQUU7RUFDeEgsTUFBTUMsR0FBRyxHQUFHO0lBQUVDLE9BQU8sRUFBRSxJQUFJO0lBQUVuRSxNQUFNO0lBQUV6RDtFQUFLLENBQUM7RUFDM0MsTUFBTXlFLFFBQVEsR0FBRzdGLGVBQWUsQ0FBQzBHLGlCQUFpQixDQUFDYyxRQUFRLENBQUN5QixnQkFBZ0IsQ0FBQzdILElBQUksQ0FBQyxDQUFDO0VBQ25GLE1BQU1MLE9BQU8sR0FBR3lHLFFBQVEsQ0FBQzBCLGVBQWUsQ0FBQzlILElBQUksQ0FBQztFQUM5QyxJQUFJK0gsS0FBSzs7RUFFVDtFQUNBLElBQUksQ0FBQ0wsZUFBZSxFQUFFO0lBQ3BCRixPQUFPLENBQUN6RyxNQUFNLENBQUNnQixPQUFPLENBQUVpRyxDQUFDLElBQUs7TUFDNUIsTUFBTUMsQ0FBQyxHQUFHRCxDQUFDLENBQUN4RixNQUFNLENBQUM1QyxJQUFJLENBQUMrSCxHQUFHLEVBQUV4SSxNQUFNLEVBQUVzRixRQUFRLEVBQUU5RSxPQUFPLENBQUM7TUFDdkQsSUFBSXNJLENBQUMsS0FBSyxLQUFLLEVBQUVGLEtBQUssR0FBRyxJQUFJO0lBQy9CLENBQUMsQ0FBQztJQUVGLElBQUlBLEtBQUssRUFBRTtFQUNiO0VBRUEsU0FBU3hHLEtBQUtBLENBQUUwQyxHQUFHLEVBQUU7SUFDbkIsSUFBSSxDQUFDeUQsZUFBZSxFQUFFO01BQ3BCRixPQUFPLENBQUNqRyxLQUFLLENBQUNRLE9BQU8sQ0FBRWlHLENBQUMsSUFBSztRQUMzQkEsQ0FBQyxDQUFDeEYsTUFBTSxDQUFDNUMsSUFBSSxDQUFDK0gsR0FBRyxFQUFFeEksTUFBTSxFQUFFc0YsUUFBUSxFQUFFOUUsT0FBTyxFQUFFc0UsR0FBRyxDQUFDO01BQ3BELENBQUMsQ0FBQztJQUNKO0VBQ0Y7RUFFQSxNQUFNa0QsR0FBRyxHQUFHMUQsTUFBTSxDQUFDN0QsSUFBSSxDQUFDLElBQUksRUFBRTZFLFFBQVEsRUFBRTlFLE9BQU8sQ0FBQztFQUNoRDRCLEtBQUssQ0FBQzRGLEdBQUcsQ0FBQztFQUVWLE9BQU9BLEdBQUc7QUFDWixDQUFDLENBQUMsQzs7Ozs7Ozs7Ozs7QUM5QkYsSUFBSTFHLGFBQWE7QUFBQy9CLE1BQU0sQ0FBQ0ksSUFBSSxDQUFDLHNDQUFzQyxFQUFDO0VBQUMwQixPQUFPQSxDQUFDekIsQ0FBQyxFQUFDO0lBQUMwQixhQUFhLEdBQUMxQixDQUFDO0VBQUE7QUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0FBQXJHLElBQUk0QixLQUFLO0FBQUNqQyxNQUFNLENBQUNJLElBQUksQ0FBQyxjQUFjLEVBQUM7RUFBQzZCLEtBQUtBLENBQUM1QixDQUFDLEVBQUM7SUFBQzRCLEtBQUssR0FBQzVCLENBQUM7RUFBQTtBQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7QUFBQyxJQUFJMkIsS0FBSztBQUFDaEMsTUFBTSxDQUFDSSxJQUFJLENBQUMsY0FBYyxFQUFDO0VBQUM0QixLQUFLQSxDQUFDM0IsQ0FBQyxFQUFDO0lBQUMyQixLQUFLLEdBQUMzQixDQUFDO0VBQUE7QUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0FBQUMsSUFBSUgsZUFBZTtBQUFDRixNQUFNLENBQUNJLElBQUksQ0FBQyxvQkFBb0IsRUFBQztFQUFDRixlQUFlQSxDQUFDRyxDQUFDLEVBQUM7SUFBQ0gsZUFBZSxHQUFDRyxDQUFDO0VBQUE7QUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0FBSXZOSCxlQUFlLENBQUN3RixZQUFZLENBQUMsUUFBUSxFQUFFLFVBQVVqRixNQUFNLEVBQUVzRSxNQUFNLEVBQUUyQyxRQUFRLEVBQUVvQixPQUFPLEVBQUVDLFlBQVksRUFBRXpILElBQUksRUFBRTBILGVBQWUsRUFBRTtFQUN2SCxNQUFNQyxHQUFHLEdBQUc7SUFBRUMsT0FBTyxFQUFFLElBQUk7SUFBRW5FLE1BQU07SUFBRXpEO0VBQUssQ0FBQztFQUMzQyxJQUFJaUUsR0FBRyxHQUFHakUsSUFBSSxDQUFDLENBQUMsQ0FBQztFQUNqQixJQUFJbUksUUFBUTtFQUNaLElBQUksT0FBT25JLElBQUksQ0FBQ0EsSUFBSSxDQUFDRCxNQUFNLEdBQUcsQ0FBQyxDQUFDLEtBQUssVUFBVSxFQUFFO0lBQy9Db0ksUUFBUSxHQUFHbkksSUFBSSxDQUFDQSxJQUFJLENBQUNELE1BQU0sR0FBRyxDQUFDLENBQUM7RUFDbEM7RUFFQSxNQUFNcUksS0FBSyxHQUFHLE9BQU9ELFFBQVEsS0FBSyxVQUFVO0VBQzVDLElBQUlKLEtBQUs7RUFDVCxJQUFJWixHQUFHOztFQUVQO0VBQ0EsSUFBSSxDQUFDTyxlQUFlLEVBQUU7SUFDcEIsSUFBSTtNQUNGRixPQUFPLENBQUN6RyxNQUFNLENBQUNnQixPQUFPLENBQUVpRyxDQUFDLElBQUs7UUFDNUIsTUFBTUMsQ0FBQyxHQUFHRCxDQUFDLENBQUN4RixNQUFNLENBQUM1QyxJQUFJLENBQUFhLGFBQUE7VUFBR29FLFNBQVMsRUFBRTRDLFlBQVksQ0FBQ3hELEdBQUc7UUFBQyxHQUFLMEQsR0FBRyxHQUFJeEksTUFBTSxFQUFFOEUsR0FBRyxDQUFDO1FBQzlFLElBQUlnRSxDQUFDLEtBQUssS0FBSyxFQUFFRixLQUFLLEdBQUcsSUFBSTtNQUMvQixDQUFDLENBQUM7TUFFRixJQUFJQSxLQUFLLEVBQUU7SUFDYixDQUFDLENBQUMsT0FBTzNJLENBQUMsRUFBRTtNQUNWLElBQUlnSixLQUFLLEVBQUUsT0FBT0QsUUFBUSxDQUFDdkksSUFBSSxDQUFDLElBQUksRUFBRVIsQ0FBQyxDQUFDO01BQ3hDLE1BQU1BLENBQUM7SUFDVDtFQUNGO0VBRUEsTUFBTW1DLEtBQUssR0FBR0EsQ0FBQzhHLEVBQUUsRUFBRUMsR0FBRyxLQUFLO0lBQ3pCLElBQUlELEVBQUUsRUFBRTtNQUNOO01BQ0E7TUFDQSxJQUFJLE9BQU9BLEVBQUUsS0FBSyxRQUFRLElBQUlBLEVBQUUsQ0FBQ0UsR0FBRyxFQUFFO1FBQ3BDO1FBQ0EsSUFBSXRFLEdBQUcsQ0FBQ3VCLEdBQUcsQ0FBQ2dELElBQUksRUFBRTtVQUNoQkgsRUFBRSxHQUFHLElBQUkzSCxLQUFLLENBQUM2RSxRQUFRLENBQUN0QixHQUFHLENBQUN1QixHQUFHLENBQUNnRCxJQUFJLENBQUNDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDbEQsQ0FBQyxNQUFNO1VBQ0xKLEVBQUUsR0FBR0EsRUFBRSxDQUFDRSxHQUFHLElBQUlGLEVBQUUsQ0FBQ0UsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJRixFQUFFLENBQUNFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQy9DLEdBQUc7UUFDM0M7TUFDRjtNQUNBdkIsR0FBRyxHQUFHdEQsS0FBSyxDQUFDeUMsS0FBSyxDQUFDYSxHQUFHLENBQUM7TUFDdEJBLEdBQUcsQ0FBQ3VCLEdBQUcsR0FBRzZDLEVBQUU7SUFDZDtJQUNBLElBQUksQ0FBQ1gsZUFBZSxFQUFFO01BQ3BCLE1BQU1nQixJQUFJLEdBQUFqSSxhQUFBO1FBQUtvRSxTQUFTLEVBQUU0QyxZQUFZLENBQUN4RCxHQUFHLENBQUM7UUFBRXVCLEdBQUcsRUFBRTZDLEVBQUU7UUFBRUM7TUFBRyxHQUFLWCxHQUFHLENBQUU7TUFDbkVILE9BQU8sQ0FBQ2pHLEtBQUssQ0FBQ1EsT0FBTyxDQUFFaUcsQ0FBQyxJQUFLO1FBQzNCQSxDQUFDLENBQUN4RixNQUFNLENBQUM1QyxJQUFJLENBQUM4SSxJQUFJLEVBQUV2SixNQUFNLEVBQUU4RSxHQUFHLENBQUM7TUFDbEMsQ0FBQyxDQUFDO0lBQ0o7SUFDQSxPQUFPb0UsRUFBRTtFQUNYLENBQUM7RUFFRCxJQUFJRCxLQUFLLEVBQUU7SUFDVCxNQUFNTyxlQUFlLEdBQUcsU0FBQUEsQ0FBVUwsR0FBRyxFQUFFTSxHQUFHLEVBQVc7TUFDbkRySCxLQUFLLENBQUVxSCxHQUFHLElBQUlBLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSUEsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDcEQsR0FBRyxJQUFLb0QsR0FBRyxFQUFFTixHQUFHLENBQUM7TUFBQSxTQUFBekksSUFBQSxHQUFBQyxTQUFBLENBQUFDLE1BQUEsRUFESEMsSUFBSSxPQUFBQyxLQUFBLENBQUFKLElBQUEsT0FBQUEsSUFBQSxXQUFBSyxJQUFBLE1BQUFBLElBQUEsR0FBQUwsSUFBQSxFQUFBSyxJQUFBO1FBQUpGLElBQUksQ0FBQUUsSUFBQSxRQUFBSixTQUFBLENBQUFJLElBQUE7TUFBQTtNQUVqRCxPQUFPaUksUUFBUSxDQUFDdkksSUFBSSxDQUFDLElBQUksRUFBRTBJLEdBQUcsRUFBRU0sR0FBRyxFQUFFLEdBQUc1SSxJQUFJLENBQUM7SUFDL0MsQ0FBQztJQUNELE9BQU95RCxNQUFNLENBQUM3RCxJQUFJLENBQUMsSUFBSSxFQUFFcUUsR0FBRyxFQUFFMEUsZUFBZSxDQUFDO0VBQ2hELENBQUMsTUFBTTtJQUNMeEIsR0FBRyxHQUFHMUQsTUFBTSxDQUFDN0QsSUFBSSxDQUFDLElBQUksRUFBRXFFLEdBQUcsRUFBRWtFLFFBQVEsQ0FBQztJQUN0QyxPQUFPNUcsS0FBSyxDQUFFNEYsR0FBRyxJQUFJQSxHQUFHLENBQUMwQixVQUFVLElBQU0xQixHQUFHLElBQUlBLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSUEsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDM0IsR0FBSSxJQUFJMkIsR0FBRyxDQUFDO0VBQy9FO0FBQ0YsQ0FBQyxDQUFDLEM7Ozs7Ozs7Ozs7O0FDakVGLElBQUkxRyxhQUFhO0FBQUMvQixNQUFNLENBQUNJLElBQUksQ0FBQyxzQ0FBc0MsRUFBQztFQUFDMEIsT0FBT0EsQ0FBQ3pCLENBQUMsRUFBQztJQUFDMEIsYUFBYSxHQUFDMUIsQ0FBQztFQUFBO0FBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztBQUFyRyxJQUFJNEIsS0FBSztBQUFDakMsTUFBTSxDQUFDSSxJQUFJLENBQUMsY0FBYyxFQUFDO0VBQUM2QixLQUFLQSxDQUFDNUIsQ0FBQyxFQUFDO0lBQUM0QixLQUFLLEdBQUM1QixDQUFDO0VBQUE7QUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0FBQUMsSUFBSUgsZUFBZTtBQUFDRixNQUFNLENBQUNJLElBQUksQ0FBQyxvQkFBb0IsRUFBQztFQUFDRixlQUFlQSxDQUFDRyxDQUFDLEVBQUM7SUFBQ0gsZUFBZSxHQUFDRyxDQUFDO0VBQUE7QUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0FBRzNKLE1BQU0rSixPQUFPLEdBQUdDLENBQUMsSUFBSSxDQUFDOUksS0FBSyxDQUFDK0ksT0FBTyxDQUFDRCxDQUFDLENBQUMsSUFBSSxDQUFDQSxDQUFDLENBQUNoSixNQUFNO0FBRW5EbkIsZUFBZSxDQUFDd0YsWUFBWSxDQUFDLFFBQVEsRUFBRSxVQUFVakYsTUFBTSxFQUFFc0UsTUFBTSxFQUFFMkMsUUFBUSxFQUFFb0IsT0FBTyxFQUFFQyxZQUFZLEVBQUV6SCxJQUFJLEVBQUUwSCxlQUFlLEVBQUU7RUFDdkgsTUFBTUMsR0FBRyxHQUFHO0lBQUVDLE9BQU8sRUFBRSxJQUFJO0lBQUVuRSxNQUFNO0lBQUV6RDtFQUFLLENBQUM7RUFDM0MsTUFBTSxDQUFDeUUsUUFBUSxFQUFFMEQsUUFBUSxDQUFDLEdBQUduSSxJQUFJO0VBQ2pDLE1BQU1vSSxLQUFLLEdBQUcsT0FBT0QsUUFBUSxLQUFLLFVBQVU7RUFDNUMsSUFBSWMsSUFBSTtFQUNSLElBQUlsQixLQUFLO0VBQ1QsTUFBTW1CLElBQUksR0FBRyxFQUFFO0VBRWYsSUFBSSxDQUFDeEIsZUFBZSxFQUFFO0lBQ3BCLElBQUk7TUFDRixJQUFJLENBQUNvQixPQUFPLENBQUN0QixPQUFPLENBQUN6RyxNQUFNLENBQUMsSUFBSSxDQUFDK0gsT0FBTyxDQUFDdEIsT0FBTyxDQUFDakcsS0FBSyxDQUFDLEVBQUU7UUFDdkQwSCxJQUFJLEdBQUdySyxlQUFlLENBQUM0RixPQUFPLENBQUM1RSxJQUFJLENBQUMsSUFBSSxFQUFFd0csUUFBUSxFQUFFM0IsUUFBUSxDQUFDLENBQUMwRSxLQUFLLENBQUMsQ0FBQztNQUN2RTs7TUFFQTtNQUNBLElBQUksQ0FBQ0wsT0FBTyxDQUFDdEIsT0FBTyxDQUFDakcsS0FBSyxDQUFDLEVBQUU7UUFDM0IwSCxJQUFJLENBQUNsSCxPQUFPLENBQUNrQyxHQUFHLElBQUlpRixJQUFJLENBQUN2RyxJQUFJLENBQUNoQyxLQUFLLENBQUN5QyxLQUFLLENBQUNhLEdBQUcsQ0FBQyxDQUFDLENBQUM7TUFDbEQ7O01BRUE7TUFDQXVELE9BQU8sQ0FBQ3pHLE1BQU0sQ0FBQ2dCLE9BQU8sQ0FBRWlHLENBQUMsSUFBSztRQUM1QmlCLElBQUksQ0FBQ2xILE9BQU8sQ0FBRWtDLEdBQUcsSUFBSztVQUNwQixNQUFNZ0UsQ0FBQyxHQUFHRCxDQUFDLENBQUN4RixNQUFNLENBQUM1QyxJQUFJLENBQUFhLGFBQUE7WUFBR29FLFNBQVMsRUFBRTRDLFlBQVksQ0FBQ3hELEdBQUc7VUFBQyxHQUFLMEQsR0FBRyxHQUFJeEksTUFBTSxFQUFFOEUsR0FBRyxDQUFDO1VBQzlFLElBQUlnRSxDQUFDLEtBQUssS0FBSyxFQUFFRixLQUFLLEdBQUcsSUFBSTtRQUMvQixDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7TUFFRixJQUFJQSxLQUFLLEVBQUUsT0FBTyxDQUFDO0lBQ3JCLENBQUMsQ0FBQyxPQUFPM0ksQ0FBQyxFQUFFO01BQ1YsSUFBSWdKLEtBQUssRUFBRSxPQUFPRCxRQUFRLENBQUN2SSxJQUFJLENBQUMsSUFBSSxFQUFFUixDQUFDLENBQUM7TUFDeEMsTUFBTUEsQ0FBQztJQUNUO0VBQ0Y7RUFFQSxTQUFTbUMsS0FBS0EsQ0FBRStHLEdBQUcsRUFBRTtJQUNuQixJQUFJLENBQUNaLGVBQWUsRUFBRTtNQUNwQkYsT0FBTyxDQUFDakcsS0FBSyxDQUFDUSxPQUFPLENBQUVpRyxDQUFDLElBQUs7UUFDM0JrQixJQUFJLENBQUNuSCxPQUFPLENBQUVrQyxHQUFHLElBQUs7VUFDcEIrRCxDQUFDLENBQUN4RixNQUFNLENBQUM1QyxJQUFJLENBQUFhLGFBQUE7WUFBR29FLFNBQVMsRUFBRTRDLFlBQVksQ0FBQ3hELEdBQUcsQ0FBQztZQUFFcUU7VUFBRyxHQUFLWCxHQUFHLEdBQUl4SSxNQUFNLEVBQUU4RSxHQUFHLENBQUM7UUFDM0UsQ0FBQyxDQUFDO01BQ0osQ0FBQyxDQUFDO0lBQ0o7RUFDRjtFQUVBLElBQUltRSxLQUFLLEVBQUU7SUFDVCxNQUFNTyxlQUFlLEdBQUcsU0FBQUEsQ0FBVUwsR0FBRyxFQUFXO01BQzlDL0csS0FBSyxDQUFDK0csR0FBRyxDQUFDO01BQUEsU0FBQXpJLElBQUEsR0FBQUMsU0FBQSxDQUFBQyxNQUFBLEVBRDhCQyxJQUFJLE9BQUFDLEtBQUEsQ0FBQUosSUFBQSxPQUFBQSxJQUFBLFdBQUFLLElBQUEsTUFBQUEsSUFBQSxHQUFBTCxJQUFBLEVBQUFLLElBQUE7UUFBSkYsSUFBSSxDQUFBRSxJQUFBLFFBQUFKLFNBQUEsQ0FBQUksSUFBQTtNQUFBO01BRTVDLE9BQU9pSSxRQUFRLENBQUN2SSxJQUFJLENBQUMsSUFBSSxFQUFFMEksR0FBRyxFQUFFLEdBQUd0SSxJQUFJLENBQUM7SUFDMUMsQ0FBQztJQUNELE9BQU95RCxNQUFNLENBQUM3RCxJQUFJLENBQUMsSUFBSSxFQUFFNkUsUUFBUSxFQUFFa0UsZUFBZSxDQUFDO0VBQ3JELENBQUMsTUFBTTtJQUNMLE1BQU1TLE1BQU0sR0FBRzNGLE1BQU0sQ0FBQzdELElBQUksQ0FBQyxJQUFJLEVBQUU2RSxRQUFRLEVBQUUwRCxRQUFRLENBQUM7SUFDcEQ1RyxLQUFLLENBQUMsQ0FBQztJQUNQLE9BQU82SCxNQUFNO0VBQ2Y7QUFDRixDQUFDLENBQUMsQzs7Ozs7Ozs7Ozs7QUM1REYsSUFBSTNJLGFBQWE7QUFBQy9CLE1BQU0sQ0FBQ0ksSUFBSSxDQUFDLHNDQUFzQyxFQUFDO0VBQUMwQixPQUFPQSxDQUFDekIsQ0FBQyxFQUFDO0lBQUMwQixhQUFhLEdBQUMxQixDQUFDO0VBQUE7QUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0FBQXJHLElBQUk0QixLQUFLO0FBQUNqQyxNQUFNLENBQUNJLElBQUksQ0FBQyxjQUFjLEVBQUM7RUFBQzZCLEtBQUtBLENBQUM1QixDQUFDLEVBQUM7SUFBQzRCLEtBQUssR0FBQzVCLENBQUM7RUFBQTtBQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7QUFBQyxJQUFJSCxlQUFlO0FBQUNGLE1BQU0sQ0FBQ0ksSUFBSSxDQUFDLG9CQUFvQixFQUFDO0VBQUNGLGVBQWVBLENBQUNHLENBQUMsRUFBQztJQUFDSCxlQUFlLEdBQUNHLENBQUM7RUFBQTtBQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7QUFHM0osTUFBTStKLE9BQU8sR0FBR0MsQ0FBQyxJQUFJLENBQUM5SSxLQUFLLENBQUMrSSxPQUFPLENBQUNELENBQUMsQ0FBQyxJQUFJLENBQUNBLENBQUMsQ0FBQ2hKLE1BQU07QUFFbkRuQixlQUFlLENBQUN3RixZQUFZLENBQUMsUUFBUSxFQUFFLFVBQVVqRixNQUFNLEVBQUVzRSxNQUFNLEVBQUUyQyxRQUFRLEVBQUVvQixPQUFPLEVBQUVDLFlBQVksRUFBRXpILElBQUksRUFBRTBILGVBQWUsRUFBRTtFQUN2SCxNQUFNQyxHQUFHLEdBQUc7SUFBRUMsT0FBTyxFQUFFLElBQUk7SUFBRW5FLE1BQU07SUFBRXpEO0VBQUssQ0FBQztFQUMzQyxJQUFJLENBQUN5RSxRQUFRLEVBQUVpQixPQUFPLEVBQUUvRixPQUFPLEVBQUV3SSxRQUFRLENBQUMsR0FBR25JLElBQUk7RUFDakQsSUFBSSxPQUFPTCxPQUFPLEtBQUssVUFBVSxFQUFFO0lBQ2pDd0ksUUFBUSxHQUFHeEksT0FBTztJQUNsQkEsT0FBTyxHQUFHLENBQUMsQ0FBQztFQUNkO0VBQ0EsTUFBTXlJLEtBQUssR0FBRyxPQUFPRCxRQUFRLEtBQUssVUFBVTtFQUM1QyxJQUFJYyxJQUFJO0VBQ1IsSUFBSUksTUFBTTtFQUNWLElBQUlyRSxNQUFNO0VBQ1YsSUFBSStDLEtBQUs7RUFDVCxNQUFNbUIsSUFBSSxHQUFHLENBQUMsQ0FBQztFQUVmLElBQUksQ0FBQ3hCLGVBQWUsRUFBRTtJQUNwQixJQUFJO01BQ0Y7TUFDQSxNQUFNNEIsb0JBQW9CLEdBQUcsQ0FBQ1IsT0FBTyxDQUFDdEIsT0FBTyxDQUFDekcsTUFBTSxDQUFDO01BQ3JELE1BQU13SSxtQkFBbUIsR0FBRyxDQUFDVCxPQUFPLENBQUN0QixPQUFPLENBQUNqRyxLQUFLLENBQUM7TUFDbkQsSUFBSWlJLHNCQUFzQixHQUFHLEtBQUs7TUFDbEMsSUFBSUQsbUJBQW1CLEVBQUU7UUFDdkJDLHNCQUFzQixHQUFHdkgsTUFBTSxDQUFDd0gsTUFBTSxDQUFDakMsT0FBTyxDQUFDakcsS0FBSyxDQUFDLENBQUNtSSxJQUFJLENBQUMxQixDQUFDLElBQUlBLENBQUMsQ0FBQ3JJLE9BQU8sQ0FBQ2dLLGFBQWEsS0FBSyxLQUFLLENBQUMsSUFBSS9LLGVBQWUsQ0FBQzBGLGFBQWEsQ0FBQzhCLFFBQVEsQ0FBQ2pELFdBQVcsRUFBRSxDQUFDLENBQUMsRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUN3RyxhQUFhLEtBQUssS0FBSztNQUMxTTtNQUNBM0UsTUFBTSxHQUFHcEcsZUFBZSxDQUFDNkcsU0FBUyxDQUFDekYsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQzNDLE1BQU0wRSxXQUFXLEdBQUcsQ0FBRSxDQUFDO01BQ3ZCLElBQUk4RSxzQkFBc0IsSUFBSUYsb0JBQW9CLEVBQUU7UUFDbEQsTUFBTU0sc0JBQXNCLEdBQUdKLHNCQUFzQixHQUFHdkgsTUFBTSxDQUFDd0gsTUFBTSxDQUFDakMsT0FBTyxDQUFDakcsS0FBSyxDQUFDLENBQUNzSSxHQUFHLENBQUM3QixDQUFDLElBQUksQ0FBQ0EsQ0FBQyxDQUFDckksT0FBTyxJQUFJLENBQUMsQ0FBQyxFQUFFK0UsV0FBVyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRTtRQUN2SSxNQUFNb0YsdUJBQXVCLEdBQUdSLG9CQUFvQixHQUFHckgsTUFBTSxDQUFDd0gsTUFBTSxDQUFDakMsT0FBTyxDQUFDekcsTUFBTSxDQUFDLENBQUM4SSxHQUFHLENBQUM3QixDQUFDLElBQUksQ0FBQ0EsQ0FBQyxDQUFDckksT0FBTyxJQUFJLENBQUMsQ0FBQyxFQUFFK0UsV0FBVyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRTtRQUN2SSxNQUFNcUYsV0FBVyxHQUFHUCxzQkFBc0IsR0FBSTVLLGVBQWUsQ0FBQzBGLGFBQWEsQ0FBQzhCLFFBQVEsQ0FBQ2pELFdBQVcsRUFBRSxDQUFDLENBQUMsRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUN1QixXQUFXLElBQUksQ0FBQyxDQUFDLEdBQUksQ0FBQyxDQUFDO1FBQ2hKLE1BQU1zRixZQUFZLEdBQUdSLHNCQUFzQixHQUFJNUssZUFBZSxDQUFDMEYsYUFBYSxDQUFDOEIsUUFBUSxDQUFDakQsV0FBVyxFQUFFLENBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQ3VCLFdBQVcsSUFBSSxDQUFDLENBQUMsR0FBSSxDQUFDLENBQUM7UUFDbEp6QyxNQUFNLENBQUNvRCxNQUFNLENBQUNYLFdBQVcsRUFBRXFGLFdBQVcsRUFBRUMsWUFBWSxFQUFFLEdBQUdKLHNCQUFzQixFQUFFLEdBQUdFLHVCQUF1QixDQUFDO01BQzlHO01BQ0FiLElBQUksR0FBR3JLLGVBQWUsQ0FBQzRGLE9BQU8sQ0FBQzVFLElBQUksQ0FBQyxJQUFJLEVBQUV3RyxRQUFRLEVBQUVwRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUVBLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRTBFLFdBQVcsQ0FBQyxDQUFDeUUsS0FBSyxDQUFDLENBQUM7TUFDMUZFLE1BQU0sR0FBR3BILE1BQU0sQ0FBQ3dILE1BQU0sQ0FBQ1IsSUFBSSxDQUFDLENBQUNZLEdBQUcsQ0FBQzVGLEdBQUcsSUFBSUEsR0FBRyxDQUFDdUIsR0FBRyxDQUFDOztNQUVoRDtNQUNBLElBQUkrRCxtQkFBbUIsRUFBRTtRQUN2QkwsSUFBSSxDQUFDeEQsT0FBTyxHQUFHL0UsS0FBSyxDQUFDeUMsS0FBSyxDQUFDcEQsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25Da0osSUFBSSxDQUFDdkosT0FBTyxHQUFHZ0IsS0FBSyxDQUFDeUMsS0FBSyxDQUFDcEQsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25DLElBQUl3SixzQkFBc0IsRUFBRTtVQUMxQk4sSUFBSSxDQUFDRCxJQUFJLEdBQUcsQ0FBQyxDQUFDO1VBQ2RBLElBQUksQ0FBQ2xILE9BQU8sQ0FBRWtDLEdBQUcsSUFBSztZQUNwQmlGLElBQUksQ0FBQ0QsSUFBSSxDQUFDaEYsR0FBRyxDQUFDdUIsR0FBRyxDQUFDLEdBQUc3RSxLQUFLLENBQUN5QyxLQUFLLENBQUNhLEdBQUcsQ0FBQztVQUN2QyxDQUFDLENBQUM7UUFDSjtNQUNGOztNQUVBO01BQ0F1RCxPQUFPLENBQUN6RyxNQUFNLENBQUNnQixPQUFPLENBQUMsVUFBVWlHLENBQUMsRUFBRTtRQUNsQ2lCLElBQUksQ0FBQ2xILE9BQU8sQ0FBQyxVQUFVa0MsR0FBRyxFQUFFO1VBQzFCLE1BQU1nRSxDQUFDLEdBQUdELENBQUMsQ0FBQ3hGLE1BQU0sQ0FBQzVDLElBQUksQ0FBQWEsYUFBQTtZQUFHb0UsU0FBUyxFQUFFNEMsWUFBWSxDQUFDeEQsR0FBRztVQUFDLEdBQUswRCxHQUFHLEdBQUl4SSxNQUFNLEVBQUU4RSxHQUFHLEVBQUVlLE1BQU0sRUFBRVUsT0FBTyxFQUFFL0YsT0FBTyxDQUFDO1VBQ3hHLElBQUlzSSxDQUFDLEtBQUssS0FBSyxFQUFFRixLQUFLLEdBQUcsSUFBSTtRQUMvQixDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7TUFFRixJQUFJQSxLQUFLLEVBQUUsT0FBTyxDQUFDO0lBQ3JCLENBQUMsQ0FBQyxPQUFPM0ksQ0FBQyxFQUFFO01BQ1YsSUFBSWdKLEtBQUssRUFBRSxPQUFPRCxRQUFRLENBQUN2SSxJQUFJLENBQUMsSUFBSSxFQUFFUixDQUFDLENBQUM7TUFDeEMsTUFBTUEsQ0FBQztJQUNUO0VBQ0Y7RUFFQSxNQUFNbUMsS0FBSyxHQUFHQSxDQUFDMEksUUFBUSxFQUFFM0IsR0FBRyxLQUFLO0lBQy9CLElBQUksQ0FBQ1osZUFBZSxFQUFFO01BQ3BCLElBQUl1QixJQUFJO01BQ1IsSUFBSWpFLE1BQU07TUFDVixJQUFJLENBQUM4RCxPQUFPLENBQUN0QixPQUFPLENBQUNqRyxLQUFLLENBQUMsRUFBRTtRQUMzQnlELE1BQU0sR0FBR3BHLGVBQWUsQ0FBQzZHLFNBQVMsQ0FBQ3pGLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMzQyxNQUFNMEUsV0FBVyxHQUFHLENBQUMsQ0FBQztRQUN0QixNQUFNd0YsaUJBQWlCLEdBQUdqSSxNQUFNLENBQUN3SCxNQUFNLENBQUNqQyxPQUFPLENBQUNqRyxLQUFLLENBQUMsQ0FBQ3NJLEdBQUcsQ0FBQzdCLENBQUMsSUFBSSxDQUFDQSxDQUFDLENBQUNySSxPQUFPLElBQUksQ0FBQyxDQUFDLEVBQUUrRSxXQUFXLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDcEcsTUFBTXlGLGlCQUFpQixHQUFHdkwsZUFBZSxDQUFDMEYsYUFBYSxDQUFDOEIsUUFBUSxDQUFDakQsV0FBVyxFQUFFLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQ3VCLFdBQVc7UUFDaEgsSUFBSXdGLGlCQUFpQixJQUFJQyxpQkFBaUIsRUFBRTtVQUMxQ2xJLE1BQU0sQ0FBQ29ELE1BQU0sQ0FBQ1gsV0FBVyxFQUFFeUYsaUJBQWlCLElBQUksQ0FBQyxDQUFDLEVBQUUsR0FBR0QsaUJBQWlCLENBQUNMLEdBQUcsQ0FBQ2QsQ0FBQyxJQUFJQSxDQUFDLENBQUNyRSxXQUFXLENBQUMsQ0FBQztRQUNuRztRQUNBdUUsSUFBSSxHQUFHckssZUFBZSxDQUFDNEYsT0FBTyxDQUFDNUUsSUFBSSxDQUFDLElBQUksRUFBRXdHLFFBQVEsRUFBRTtVQUFFWixHQUFHLEVBQUU7WUFBRTRFLEdBQUcsRUFBRWY7VUFBTztRQUFFLENBQUMsRUFBRTFKLE9BQU8sRUFBRStFLFdBQVcsRUFBRTtVQUFFQyxTQUFTLEVBQUU7UUFBSyxDQUFDLENBQUMsQ0FBQ3dFLEtBQUssQ0FBQyxDQUFDO01BQ2xJO01BRUEzQixPQUFPLENBQUNqRyxLQUFLLENBQUNRLE9BQU8sQ0FBRWlHLENBQUMsSUFBSztRQUMzQmlCLElBQUksQ0FBQ2xILE9BQU8sQ0FBRWtDLEdBQUcsSUFBSztVQUNwQitELENBQUMsQ0FBQ3hGLE1BQU0sQ0FBQzVDLElBQUksQ0FBQWEsYUFBQTtZQUNYb0UsU0FBUyxFQUFFNEMsWUFBWSxDQUFDeEQsR0FBRyxDQUFDO1lBQzVCb0csUUFBUSxFQUFFbkIsSUFBSSxDQUFDRCxJQUFJLElBQUlDLElBQUksQ0FBQ0QsSUFBSSxDQUFDaEYsR0FBRyxDQUFDdUIsR0FBRyxDQUFDO1lBQ3pDeUUsUUFBUTtZQUNSM0I7VUFBRyxHQUNBWCxHQUFHLEdBQ0x4SSxNQUFNLEVBQUU4RSxHQUFHLEVBQUVlLE1BQU0sRUFBRWtFLElBQUksQ0FBQ3hELE9BQU8sRUFBRXdELElBQUksQ0FBQ3ZKLE9BQU8sQ0FBQztRQUNyRCxDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7SUFDSjtFQUNGLENBQUM7RUFFRCxJQUFJeUksS0FBSyxFQUFFO0lBQ1QsTUFBTU8sZUFBZSxHQUFHLFNBQUFBLENBQVVMLEdBQUcsRUFBRTJCLFFBQVEsRUFBVztNQUN4RDFJLEtBQUssQ0FBQzBJLFFBQVEsRUFBRTNCLEdBQUcsQ0FBQztNQUFBLFNBQUF6SSxJQUFBLEdBQUFDLFNBQUEsQ0FBQUMsTUFBQSxFQUQ4QkMsSUFBSSxPQUFBQyxLQUFBLENBQUFKLElBQUEsT0FBQUEsSUFBQSxXQUFBSyxJQUFBLE1BQUFBLElBQUEsR0FBQUwsSUFBQSxFQUFBSyxJQUFBO1FBQUpGLElBQUksQ0FBQUUsSUFBQSxRQUFBSixTQUFBLENBQUFJLElBQUE7TUFBQTtNQUV0RCxPQUFPaUksUUFBUSxDQUFDdkksSUFBSSxDQUFDLElBQUksRUFBRTBJLEdBQUcsRUFBRTJCLFFBQVEsRUFBRSxHQUFHakssSUFBSSxDQUFDO0lBQ3BELENBQUM7SUFDRCxPQUFPeUQsTUFBTSxDQUFDN0QsSUFBSSxDQUFDLElBQUksRUFBRTZFLFFBQVEsRUFBRWlCLE9BQU8sRUFBRS9GLE9BQU8sRUFBRWdKLGVBQWUsQ0FBQztFQUN2RSxDQUFDLE1BQU07SUFDTCxNQUFNc0IsUUFBUSxHQUFHeEcsTUFBTSxDQUFDN0QsSUFBSSxDQUFDLElBQUksRUFBRTZFLFFBQVEsRUFBRWlCLE9BQU8sRUFBRS9GLE9BQU8sRUFBRXdJLFFBQVEsQ0FBQztJQUN4RTVHLEtBQUssQ0FBQzBJLFFBQVEsQ0FBQztJQUNmLE9BQU9BLFFBQVE7RUFDakI7QUFDRixDQUFDLENBQUMsQzs7Ozs7Ozs7Ozs7QUMzR0YsSUFBSXhKLGFBQWE7QUFBQy9CLE1BQU0sQ0FBQ0ksSUFBSSxDQUFDLHNDQUFzQyxFQUFDO0VBQUMwQixPQUFPQSxDQUFDekIsQ0FBQyxFQUFDO0lBQUMwQixhQUFhLEdBQUMxQixDQUFDO0VBQUE7QUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0FBQXJHLElBQUk0QixLQUFLO0FBQUNqQyxNQUFNLENBQUNJLElBQUksQ0FBQyxjQUFjLEVBQUM7RUFBQzZCLEtBQUtBLENBQUM1QixDQUFDLEVBQUM7SUFBQzRCLEtBQUssR0FBQzVCLENBQUM7RUFBQTtBQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7QUFBQyxJQUFJSCxlQUFlO0FBQUNGLE1BQU0sQ0FBQ0ksSUFBSSxDQUFDLG9CQUFvQixFQUFDO0VBQUNGLGVBQWVBLENBQUNHLENBQUMsRUFBQztJQUFDSCxlQUFlLEdBQUNHLENBQUM7RUFBQTtBQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7QUFHM0osTUFBTStKLE9BQU8sR0FBR0MsQ0FBQyxJQUFJLENBQUM5SSxLQUFLLENBQUMrSSxPQUFPLENBQUNELENBQUMsQ0FBQyxJQUFJLENBQUNBLENBQUMsQ0FBQ2hKLE1BQU07QUFFbkRuQixlQUFlLENBQUN3RixZQUFZLENBQUMsUUFBUSxFQUFFLFVBQVVqRixNQUFNLEVBQUVzRSxNQUFNLEVBQUUyQyxRQUFRLEVBQUVrRSxXQUFXLEVBQUU3QyxZQUFZLEVBQUV6SCxJQUFJLEVBQUUwSCxlQUFlLEVBQUU7RUFDM0gxSCxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUdwQixlQUFlLENBQUMwRyxpQkFBaUIsQ0FBQ2MsUUFBUSxDQUFDeUIsZ0JBQWdCLENBQUM3SCxJQUFJLENBQUMsQ0FBQztFQUU1RSxNQUFNMkgsR0FBRyxHQUFHO0lBQUVDLE9BQU8sRUFBRSxJQUFJO0lBQUVuRSxNQUFNO0lBQUV6RDtFQUFLLENBQUM7RUFDM0MsSUFBSSxDQUFDeUUsUUFBUSxFQUFFaUIsT0FBTyxFQUFFL0YsT0FBTyxFQUFFd0ksUUFBUSxDQUFDLEdBQUduSSxJQUFJO0VBQ2pELElBQUksT0FBT0wsT0FBTyxLQUFLLFVBQVUsRUFBRTtJQUNqQ3dJLFFBQVEsR0FBR3hJLE9BQU87SUFDbEJBLE9BQU8sR0FBRyxDQUFDLENBQUM7RUFDZDtFQUVBLE1BQU15SSxLQUFLLEdBQUcsT0FBT0QsUUFBUSxLQUFLLFVBQVU7RUFDNUMsSUFBSWMsSUFBSTtFQUNSLElBQUlJLE1BQU07RUFDVixJQUFJdEIsS0FBSztFQUNULE1BQU1tQixJQUFJLEdBQUcsQ0FBQyxDQUFDO0VBRWYsSUFBSSxDQUFDeEIsZUFBZSxFQUFFO0lBQ3BCLElBQUksQ0FBQ29CLE9BQU8sQ0FBQ3dCLFdBQVcsQ0FBQ25KLE1BQU0sQ0FBQ0osTUFBTSxDQUFDLElBQUksQ0FBQytILE9BQU8sQ0FBQ3dCLFdBQVcsQ0FBQ3JKLE1BQU0sQ0FBQ00sS0FBSyxDQUFDLEVBQUU7TUFDN0UwSCxJQUFJLEdBQUdySyxlQUFlLENBQUM0RixPQUFPLENBQUM1RSxJQUFJLENBQUMsSUFBSSxFQUFFd0csUUFBUSxFQUFFM0IsUUFBUSxFQUFFOUUsT0FBTyxDQUFDLENBQUN3SixLQUFLLENBQUMsQ0FBQztNQUM5RUUsTUFBTSxHQUFHSixJQUFJLENBQUNZLEdBQUcsQ0FBQzVGLEdBQUcsSUFBSUEsR0FBRyxDQUFDdUIsR0FBRyxDQUFDO0lBQ25DOztJQUVBO0lBQ0EsSUFBSSxDQUFDc0QsT0FBTyxDQUFDd0IsV0FBVyxDQUFDckosTUFBTSxDQUFDTSxLQUFLLENBQUMsRUFBRTtNQUN0QyxJQUFJK0ksV0FBVyxDQUFDckosTUFBTSxDQUFDTSxLQUFLLENBQUNtSSxJQUFJLENBQUMxQixDQUFDLElBQUlBLENBQUMsQ0FBQ3JJLE9BQU8sQ0FBQ2dLLGFBQWEsS0FBSyxLQUFLLENBQUMsSUFDdkUvSyxlQUFlLENBQUMwRixhQUFhLENBQUM4QixRQUFRLENBQUNqRCxXQUFXLEVBQUUsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDd0csYUFBYSxLQUFLLEtBQUssRUFBRTtRQUNwR1QsSUFBSSxDQUFDeEQsT0FBTyxHQUFHL0UsS0FBSyxDQUFDeUMsS0FBSyxDQUFDc0MsT0FBTyxDQUFDO1FBQ25Dd0QsSUFBSSxDQUFDdkosT0FBTyxHQUFHZ0IsS0FBSyxDQUFDeUMsS0FBSyxDQUFDekQsT0FBTyxDQUFDO1FBRW5DdUosSUFBSSxDQUFDRCxJQUFJLEdBQUcsQ0FBQyxDQUFDO1FBQ2RBLElBQUksQ0FBQ2xILE9BQU8sQ0FBRWtDLEdBQUcsSUFBSztVQUNwQmlGLElBQUksQ0FBQ0QsSUFBSSxDQUFDaEYsR0FBRyxDQUFDdUIsR0FBRyxDQUFDLEdBQUc3RSxLQUFLLENBQUN5QyxLQUFLLENBQUNhLEdBQUcsQ0FBQztRQUN2QyxDQUFDLENBQUM7TUFDSjtJQUNGOztJQUVBO0lBQ0FxRyxXQUFXLENBQUNuSixNQUFNLENBQUNKLE1BQU0sQ0FBQ2dCLE9BQU8sQ0FBRWlHLENBQUMsSUFBSztNQUN2QyxNQUFNQyxDQUFDLEdBQUdELENBQUMsQ0FBQ3hGLE1BQU0sQ0FBQzVDLElBQUksQ0FBQytILEdBQUcsRUFBRXhJLE1BQU0sRUFBRXNGLFFBQVEsRUFBRWlCLE9BQU8sRUFBRS9GLE9BQU8sQ0FBQztNQUNoRSxJQUFJc0ksQ0FBQyxLQUFLLEtBQUssRUFBRUYsS0FBSyxHQUFHLElBQUk7SUFDL0IsQ0FBQyxDQUFDO0lBRUYsSUFBSUEsS0FBSyxFQUFFLE9BQU87TUFBRXdDLGNBQWMsRUFBRTtJQUFFLENBQUM7RUFDekM7RUFFQSxNQUFNQyxXQUFXLEdBQUdBLENBQUNQLFFBQVEsRUFBRTNCLEdBQUcsS0FBSztJQUNyQyxJQUFJLENBQUNaLGVBQWUsSUFBSSxDQUFDb0IsT0FBTyxDQUFDd0IsV0FBVyxDQUFDckosTUFBTSxDQUFDTSxLQUFLLENBQUMsRUFBRTtNQUMxRCxNQUFNeUQsTUFBTSxHQUFHcEcsZUFBZSxDQUFDNkcsU0FBUyxDQUFDQyxPQUFPLENBQUM7TUFDakQsTUFBTXVELElBQUksR0FBR3JLLGVBQWUsQ0FBQzRGLE9BQU8sQ0FBQzVFLElBQUksQ0FBQyxJQUFJLEVBQUV3RyxRQUFRLEVBQUU7UUFBRVosR0FBRyxFQUFFO1VBQUU0RSxHQUFHLEVBQUVmO1FBQU87TUFBRSxDQUFDLEVBQUUxSixPQUFPLENBQUMsQ0FBQ3dKLEtBQUssQ0FBQyxDQUFDO01BRXBHbUIsV0FBVyxDQUFDckosTUFBTSxDQUFDTSxLQUFLLENBQUNRLE9BQU8sQ0FBRWlHLENBQUMsSUFBSztRQUN0Q2lCLElBQUksQ0FBQ2xILE9BQU8sQ0FBRWtDLEdBQUcsSUFBSztVQUNwQitELENBQUMsQ0FBQ3hGLE1BQU0sQ0FBQzVDLElBQUksQ0FBQWEsYUFBQTtZQUNYb0UsU0FBUyxFQUFFNEMsWUFBWSxDQUFDeEQsR0FBRyxDQUFDO1lBQzVCb0csUUFBUSxFQUFFbkIsSUFBSSxDQUFDRCxJQUFJLElBQUlDLElBQUksQ0FBQ0QsSUFBSSxDQUFDaEYsR0FBRyxDQUFDdUIsR0FBRyxDQUFDO1lBQ3pDeUUsUUFBUTtZQUNSM0I7VUFBRyxHQUNBWCxHQUFHLEdBQ0x4SSxNQUFNLEVBQUU4RSxHQUFHLEVBQUVlLE1BQU0sRUFBRWtFLElBQUksQ0FBQ3hELE9BQU8sRUFBRXdELElBQUksQ0FBQ3ZKLE9BQU8sQ0FBQztRQUNyRCxDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7SUFDSjtFQUNGLENBQUM7RUFFRCxNQUFNOEssV0FBVyxHQUFHQSxDQUFDakYsR0FBRyxFQUFFOEMsR0FBRyxLQUFLO0lBQ2hDLElBQUksQ0FBQ1osZUFBZSxJQUFJLENBQUNvQixPQUFPLENBQUN3QixXQUFXLENBQUN0SixNQUFNLENBQUNPLEtBQUssQ0FBQyxFQUFFO01BQzFELE1BQU0wQyxHQUFHLEdBQUdyRixlQUFlLENBQUM0RixPQUFPLENBQUM1RSxJQUFJLENBQUMsSUFBSSxFQUFFd0csUUFBUSxFQUFFO1FBQUVaO01BQUksQ0FBQyxFQUFFZixRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQzBFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUM7TUFDM0YsTUFBTVQsSUFBSSxHQUFBakksYUFBQTtRQUFLb0UsU0FBUyxFQUFFNEMsWUFBWSxDQUFDeEQsR0FBRyxDQUFDO1FBQUV1QixHQUFHO1FBQUU4QztNQUFHLEdBQUtYLEdBQUcsQ0FBRTtNQUUvRDJDLFdBQVcsQ0FBQ3RKLE1BQU0sQ0FBQ08sS0FBSyxDQUFDUSxPQUFPLENBQUVpRyxDQUFDLElBQUs7UUFDdENBLENBQUMsQ0FBQ3hGLE1BQU0sQ0FBQzVDLElBQUksQ0FBQzhJLElBQUksRUFBRXZKLE1BQU0sRUFBRThFLEdBQUcsQ0FBQztNQUNsQyxDQUFDLENBQUM7SUFDSjtFQUNGLENBQUM7RUFFRCxJQUFJbUUsS0FBSyxFQUFFO0lBQ1QsTUFBTU8sZUFBZSxHQUFHLFNBQUFBLENBQVVMLEdBQUcsRUFBRW5CLEdBQUcsRUFBRTtNQUMxQyxJQUFJbUIsR0FBRyxJQUFLbkIsR0FBRyxJQUFJQSxHQUFHLENBQUMwQixVQUFXLEVBQUU7UUFDbEM7UUFDQTRCLFdBQVcsQ0FBQ3RELEdBQUcsQ0FBQzBCLFVBQVUsRUFBRVAsR0FBRyxDQUFDO01BQ2xDLENBQUMsTUFBTTtRQUNMa0MsV0FBVyxDQUFDckQsR0FBRyxJQUFJQSxHQUFHLENBQUNvRCxjQUFjLEVBQUVqQyxHQUFHLENBQUMsRUFBQztNQUM5QztNQUVBLE9BQU8xSixlQUFlLENBQUMrQyxRQUFRLENBQUMsWUFBWTtRQUMxQyxPQUFPd0csUUFBUSxDQUFDdkksSUFBSSxDQUFDLElBQUksRUFBRTBJLEdBQUcsRUFBRW5CLEdBQUcsQ0FBQztNQUN0QyxDQUFDLENBQUM7SUFDSixDQUFDO0lBRUQsT0FBT3ZJLGVBQWUsQ0FBQzZDLFFBQVEsQ0FBQyxNQUFNZ0MsTUFBTSxDQUFDN0QsSUFBSSxDQUFDLElBQUksRUFBRTZFLFFBQVEsRUFBRWlCLE9BQU8sRUFBRS9GLE9BQU8sRUFBRWdKLGVBQWUsQ0FBQyxDQUFDO0VBQ3ZHLENBQUMsTUFBTTtJQUNMLE1BQU14QixHQUFHLEdBQUd2SSxlQUFlLENBQUM2QyxRQUFRLENBQUMsTUFBTWdDLE1BQU0sQ0FBQzdELElBQUksQ0FBQyxJQUFJLEVBQUU2RSxRQUFRLEVBQUVpQixPQUFPLEVBQUUvRixPQUFPLEVBQUV3SSxRQUFRLENBQUMsQ0FBQztJQUVuRyxJQUFJaEIsR0FBRyxJQUFJQSxHQUFHLENBQUMwQixVQUFVLEVBQUU7TUFDekI0QixXQUFXLENBQUN0RCxHQUFHLENBQUMwQixVQUFVLENBQUM7SUFDN0IsQ0FBQyxNQUFNO01BQ0wyQixXQUFXLENBQUNyRCxHQUFHLElBQUlBLEdBQUcsQ0FBQ29ELGNBQWMsQ0FBQztJQUN4QztJQUVBLE9BQU9wRCxHQUFHO0VBQ1o7QUFDRixDQUFDLENBQUMsQzs7Ozs7Ozs7Ozs7QUMxR0YsSUFBSXRJLE1BQU07QUFBQ0gsTUFBTSxDQUFDSSxJQUFJLENBQUMsZUFBZSxFQUFDO0VBQUNELE1BQU1BLENBQUNFLENBQUMsRUFBQztJQUFDRixNQUFNLEdBQUNFLENBQUM7RUFBQTtBQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7QUFBQyxJQUFJMkIsS0FBSztBQUFDaEMsTUFBTSxDQUFDSSxJQUFJLENBQUMsY0FBYyxFQUFDO0VBQUM0QixLQUFLQSxDQUFDM0IsQ0FBQyxFQUFDO0lBQUMyQixLQUFLLEdBQUMzQixDQUFDO0VBQUE7QUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0FBQUMsSUFBSUgsZUFBZTtBQUFDRixNQUFNLENBQUNJLElBQUksQ0FBQyxvQkFBb0IsRUFBQztFQUFDRixlQUFlQSxDQUFDRyxDQUFDLEVBQUM7SUFBQ0gsZUFBZSxHQUFDRyxDQUFDO0VBQUE7QUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0FBSTNOLElBQUlGLE1BQU0sQ0FBQzZMLEtBQUssRUFBRTtFQUNoQjtFQUNBOUwsZUFBZSxDQUFDdUgsaUJBQWlCLENBQUN0SCxNQUFNLENBQUM2TCxLQUFLLENBQUM7O0VBRS9DO0VBQ0E5TCxlQUFlLENBQUNnRCx3QkFBd0IsQ0FBQy9DLE1BQU0sQ0FBQzZMLEtBQUssRUFBRWhLLEtBQUssQ0FBQzhGLFVBQVUsQ0FBQztBQUMxRSxDIiwiZmlsZSI6Ii9wYWNrYWdlcy9tYXRiMzNfY29sbGVjdGlvbi1ob29rcy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InXG5pbXBvcnQgeyBDb2xsZWN0aW9uSG9va3MgfSBmcm9tICcuL2NvbGxlY3Rpb24taG9va3MnXG5cbmltcG9ydCAnLi9hZHZpY2VzJ1xuXG5jb25zdCBwdWJsaXNoVXNlcklkID0gbmV3IE1ldGVvci5FbnZpcm9ubWVudFZhcmlhYmxlKClcblxuQ29sbGVjdGlvbkhvb2tzLmdldFVzZXJJZCA9IGZ1bmN0aW9uIGdldFVzZXJJZCAoKSB7XG4gIGxldCB1c2VySWRcblxuICB0cnkge1xuICAgIC8vIFdpbGwgdGhyb3cgYW4gZXJyb3IgdW5sZXNzIHdpdGhpbiBtZXRob2QgY2FsbC5cbiAgICAvLyBBdHRlbXB0IHRvIHJlY292ZXIgZ3JhY2VmdWxseSBieSBjYXRjaGluZzpcbiAgICB1c2VySWQgPSBNZXRlb3IudXNlcklkICYmIE1ldGVvci51c2VySWQoKVxuICB9IGNhdGNoIChlKSB7fVxuXG4gIGlmICh1c2VySWQgPT0gbnVsbCkge1xuICAgIC8vIEdldCB0aGUgdXNlcklkIGlmIHdlIGFyZSBpbiBhIHB1Ymxpc2ggZnVuY3Rpb24uXG4gICAgdXNlcklkID0gcHVibGlzaFVzZXJJZC5nZXQoKVxuICB9XG5cbiAgaWYgKHVzZXJJZCA9PSBudWxsKSB7XG4gICAgdXNlcklkID0gQ29sbGVjdGlvbkhvb2tzLmRlZmF1bHRVc2VySWRcbiAgfVxuXG4gIHJldHVybiB1c2VySWRcbn1cblxuY29uc3QgX3B1Ymxpc2ggPSBNZXRlb3IucHVibGlzaFxuTWV0ZW9yLnB1Ymxpc2ggPSBmdW5jdGlvbiAobmFtZSwgaGFuZGxlciwgb3B0aW9ucykge1xuICByZXR1cm4gX3B1Ymxpc2guY2FsbCh0aGlzLCBuYW1lLCBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIHJlcGVhdGVkbHkgaW4gcHVibGljYXRpb25zXG4gICAgcmV0dXJuIHB1Ymxpc2hVc2VySWQud2l0aFZhbHVlKHRoaXMgJiYgdGhpcy51c2VySWQsICgpID0+IGhhbmRsZXIuYXBwbHkodGhpcywgYXJncykpXG4gIH0sIG9wdGlvbnMpXG59XG5cbi8vIE1ha2UgdGhlIGFib3ZlIGF2YWlsYWJsZSBmb3IgcGFja2FnZXMgd2l0aCBob29rcyB0aGF0IHdhbnQgdG8gZGV0ZXJtaW5lXG4vLyB3aGV0aGVyIHRoZXkgYXJlIHJ1bm5pbmcgaW5zaWRlIGEgcHVibGlzaCBmdW5jdGlvbiBvciBub3QuXG5Db2xsZWN0aW9uSG9va3MuaXNXaXRoaW5QdWJsaXNoID0gKCkgPT4gcHVibGlzaFVzZXJJZC5nZXQoKSAhPT0gdW5kZWZpbmVkXG5cbmV4cG9ydCB7XG4gIENvbGxlY3Rpb25Ib29rc1xufVxuIiwiaW1wb3J0ICcuL2luc2VydC5qcydcbmltcG9ydCAnLi91cGRhdGUuanMnXG5pbXBvcnQgJy4vcmVtb3ZlLmpzJ1xuaW1wb3J0ICcuL3Vwc2VydC5qcydcbmltcG9ydCAnLi9maW5kLmpzJ1xuaW1wb3J0ICcuL2ZpbmRvbmUuanMnXG5cbi8vIExvYWQgYWZ0ZXIgYWxsIGFkdmljZXMgaGF2ZSBiZWVuIGRlZmluZWRcbmltcG9ydCAnLi91c2Vycy1jb21wYXQuanMnXG4iLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJ1xuaW1wb3J0IHsgTW9uZ28gfSBmcm9tICdtZXRlb3IvbW9uZ28nXG5pbXBvcnQgeyBFSlNPTiB9IGZyb20gJ21ldGVvci9lanNvbidcbmltcG9ydCB7IExvY2FsQ29sbGVjdGlvbiB9IGZyb20gJ21ldGVvci9taW5pbW9uZ28nXG5cbi8vIFJlbGV2YW50IEFPUCB0ZXJtaW5vbG9neTpcbi8vIEFzcGVjdDogVXNlciBjb2RlIHRoYXQgcnVucyBiZWZvcmUvYWZ0ZXIgKGhvb2spXG4vLyBBZHZpY2U6IFdyYXBwZXIgY29kZSB0aGF0IGtub3dzIHdoZW4gdG8gY2FsbCB1c2VyIGNvZGUgKGFzcGVjdHMpXG4vLyBQb2ludGN1dDogYmVmb3JlL2FmdGVyXG5jb25zdCBhZHZpY2VzID0ge31cblxuZXhwb3J0IGNvbnN0IENvbGxlY3Rpb25Ib29rcyA9IHtcbiAgZGVmYXVsdHM6IHtcbiAgICBiZWZvcmU6IHsgaW5zZXJ0OiB7fSwgdXBkYXRlOiB7fSwgcmVtb3ZlOiB7fSwgdXBzZXJ0OiB7fSwgZmluZDoge30sIGZpbmRPbmU6IHt9LCBhbGw6IHt9IH0sXG4gICAgYWZ0ZXI6IHsgaW5zZXJ0OiB7fSwgdXBkYXRlOiB7fSwgcmVtb3ZlOiB7fSwgZmluZDoge30sIGZpbmRPbmU6IHt9LCBhbGw6IHt9IH0sXG4gICAgYWxsOiB7IGluc2VydDoge30sIHVwZGF0ZToge30sIHJlbW92ZToge30sIGZpbmQ6IHt9LCBmaW5kT25lOiB7fSwgYWxsOiB7fSB9XG4gIH0sXG4gIGRpcmVjdEVudjogbmV3IE1ldGVvci5FbnZpcm9ubWVudFZhcmlhYmxlKCksXG4gIGRpcmVjdE9wIChmdW5jKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlyZWN0RW52LndpdGhWYWx1ZSh0cnVlLCBmdW5jKVxuICB9LFxuICBob29rZWRPcCAoZnVuYykge1xuICAgIHJldHVybiB0aGlzLmRpcmVjdEVudi53aXRoVmFsdWUoZmFsc2UsIGZ1bmMpXG4gIH1cbn1cblxuQ29sbGVjdGlvbkhvb2tzLmV4dGVuZENvbGxlY3Rpb25JbnN0YW5jZSA9IGZ1bmN0aW9uIGV4dGVuZENvbGxlY3Rpb25JbnN0YW5jZSAoc2VsZiwgY29uc3RydWN0b3IpIHtcbiAgLy8gT2ZmZXIgYSBwdWJsaWMgQVBJIHRvIGFsbG93IHRoZSB1c2VyIHRvIGRlZmluZSBhc3BlY3RzXG4gIC8vIEV4YW1wbGU6IGNvbGxlY3Rpb24uYmVmb3JlLmluc2VydChmdW5jKTtcbiAgWydiZWZvcmUnLCAnYWZ0ZXInXS5mb3JFYWNoKGZ1bmN0aW9uIChwb2ludGN1dCkge1xuICAgIE9iamVjdC5lbnRyaWVzKGFkdmljZXMpLmZvckVhY2goZnVuY3Rpb24gKFttZXRob2QsIGFkdmljZV0pIHtcbiAgICAgIGlmIChhZHZpY2UgPT09ICd1cHNlcnQnICYmIHBvaW50Y3V0ID09PSAnYWZ0ZXInKSByZXR1cm5cblxuICAgICAgTWV0ZW9yLl9lbnN1cmUoc2VsZiwgcG9pbnRjdXQsIG1ldGhvZClcbiAgICAgIE1ldGVvci5fZW5zdXJlKHNlbGYsICdfaG9va0FzcGVjdHMnLCBtZXRob2QpXG5cbiAgICAgIHNlbGYuX2hvb2tBc3BlY3RzW21ldGhvZF1bcG9pbnRjdXRdID0gW11cbiAgICAgIHNlbGZbcG9pbnRjdXRdW21ldGhvZF0gPSBmdW5jdGlvbiAoYXNwZWN0LCBvcHRpb25zKSB7XG4gICAgICAgIGxldCB0YXJnZXQgPSB7XG4gICAgICAgICAgYXNwZWN0LFxuICAgICAgICAgIG9wdGlvbnM6IENvbGxlY3Rpb25Ib29rcy5pbml0T3B0aW9ucyhvcHRpb25zLCBwb2ludGN1dCwgbWV0aG9kKVxuICAgICAgICB9XG4gICAgICAgIC8vIGFkZGluZyBpcyBzaW1wbHkgcHVzaGluZyBpdCB0byB0aGUgYXJyYXlcbiAgICAgICAgc2VsZi5faG9va0FzcGVjdHNbbWV0aG9kXVtwb2ludGN1dF0ucHVzaCh0YXJnZXQpXG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICByZXBsYWNlIChhc3BlY3QsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIC8vIHJlcGxhY2luZyBpcyBkb25lIGJ5IGRldGVybWluaW5nIHRoZSBhY3R1YWwgaW5kZXggb2YgYSBnaXZlbiB0YXJnZXRcbiAgICAgICAgICAgIC8vIGFuZCByZXBsYWNlIHRoaXMgd2l0aCB0aGUgbmV3IG9uZVxuICAgICAgICAgICAgY29uc3Qgc3JjID0gc2VsZi5faG9va0FzcGVjdHNbbWV0aG9kXVtwb2ludGN1dF1cbiAgICAgICAgICAgIGNvbnN0IHRhcmdldEluZGV4ID0gc3JjLmZpbmRJbmRleChlbnRyeSA9PiBlbnRyeSA9PT0gdGFyZ2V0KVxuICAgICAgICAgICAgY29uc3QgbmV3VGFyZ2V0ID0ge1xuICAgICAgICAgICAgICBhc3BlY3QsXG4gICAgICAgICAgICAgIG9wdGlvbnM6IENvbGxlY3Rpb25Ib29rcy5pbml0T3B0aW9ucyhvcHRpb25zLCBwb2ludGN1dCwgbWV0aG9kKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3JjLnNwbGljZSh0YXJnZXRJbmRleCwgMSwgbmV3VGFyZ2V0KVxuICAgICAgICAgICAgLy8gdXBkYXRlIHRoZSB0YXJnZXQgdG8gZ2V0IHRoZSBjb3JyZWN0IGluZGV4IGluIGZ1dHVyZSBjYWxsc1xuICAgICAgICAgICAgdGFyZ2V0ID0gbmV3VGFyZ2V0XG4gICAgICAgICAgfSxcbiAgICAgICAgICByZW1vdmUgKCkge1xuICAgICAgICAgICAgLy8gcmVtb3ZpbmcgYSBob29rIGlzIGRvbmUgYnkgZGV0ZXJtaW5pbmcgdGhlIGFjdHVhbCBpbmRleCBvZiBhIGdpdmVuIHRhcmdldFxuICAgICAgICAgICAgLy8gYW5kIHJlbW92aW5nIGl0IGZvcm0gdGhlIHNvdXJjZSBhcnJheVxuICAgICAgICAgICAgY29uc3Qgc3JjID0gc2VsZi5faG9va0FzcGVjdHNbbWV0aG9kXVtwb2ludGN1dF1cbiAgICAgICAgICAgIGNvbnN0IHRhcmdldEluZGV4ID0gc3JjLmZpbmRJbmRleChlbnRyeSA9PiBlbnRyeSA9PT0gdGFyZ2V0KVxuICAgICAgICAgICAgc2VsZi5faG9va0FzcGVjdHNbbWV0aG9kXVtwb2ludGN1dF0uc3BsaWNlKHRhcmdldEluZGV4LCAxKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG4gIH0pXG5cbiAgLy8gT2ZmZXIgYSBwdWJsaWNseSBhY2Nlc3NpYmxlIG9iamVjdCB0byBhbGxvdyB0aGUgdXNlciB0byBkZWZpbmVcbiAgLy8gY29sbGVjdGlvbi13aWRlIGhvb2sgb3B0aW9ucy5cbiAgLy8gRXhhbXBsZTogY29sbGVjdGlvbi5ob29rT3B0aW9ucy5hZnRlci51cGRhdGUgPSB7ZmV0Y2hQcmV2aW91czogZmFsc2V9O1xuICBzZWxmLmhvb2tPcHRpb25zID0gRUpTT04uY2xvbmUoQ29sbGVjdGlvbkhvb2tzLmRlZmF1bHRzKVxuXG4gIC8vIFdyYXAgbXV0YXRvciBtZXRob2RzLCBsZXR0aW5nIHRoZSBkZWZpbmVkIGFkdmljZSBkbyB0aGUgd29ya1xuICBPYmplY3QuZW50cmllcyhhZHZpY2VzKS5mb3JFYWNoKGZ1bmN0aW9uIChbbWV0aG9kLCBhZHZpY2VdKSB7XG4gICAgY29uc3QgY29sbGVjdGlvbiA9IE1ldGVvci5pc0NsaWVudCB8fCBtZXRob2QgPT09ICd1cHNlcnQnID8gc2VsZiA6IHNlbGYuX2NvbGxlY3Rpb25cblxuICAgIC8vIFN0b3JlIGEgcmVmZXJlbmNlIHRvIHRoZSBvcmlnaW5hbCBtdXRhdG9yIG1ldGhvZFxuICAgIGNvbnN0IF9zdXBlciA9IGNvbGxlY3Rpb25bbWV0aG9kXVxuXG4gICAgTWV0ZW9yLl9lbnN1cmUoc2VsZiwgJ2RpcmVjdCcsIG1ldGhvZClcbiAgICBzZWxmLmRpcmVjdFttZXRob2RdID0gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICAgIHJldHVybiBDb2xsZWN0aW9uSG9va3MuZGlyZWN0T3AoZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gY29uc3RydWN0b3IucHJvdG90eXBlW21ldGhvZF0uYXBwbHkoc2VsZiwgYXJncylcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgY29uc3QgYXN5bmNNZXRob2QgPSBtZXRob2QgKyAnQXN5bmMnXG5cbiAgICBpZiAoY29uc3RydWN0b3IucHJvdG90eXBlW2FzeW5jTWV0aG9kXSkge1xuICAgICAgc2VsZi5kaXJlY3RbYXN5bmNNZXRob2RdID0gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIENvbGxlY3Rpb25Ib29rcy5kaXJlY3RPcChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbnN0cnVjdG9yLnByb3RvdHlwZVthc3luY01ldGhvZF0uYXBwbHkoc2VsZiwgYXJncylcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb2xsZWN0aW9uW21ldGhvZF0gPSBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgICAgaWYgKENvbGxlY3Rpb25Ib29rcy5kaXJlY3RFbnYuZ2V0KCkgPT09IHRydWUpIHtcbiAgICAgICAgcmV0dXJuIF9zdXBlci5hcHBseShjb2xsZWN0aW9uLCBhcmdzKVxuICAgICAgfVxuXG4gICAgICAvLyBOT1RFOiBzaG91bGQgd2UgZGVjaWRlIHRvIGZvcmNlIGB1cGRhdGVgIHdpdGggYHt1cHNlcnQ6dHJ1ZX1gIHRvIHVzZVxuICAgICAgLy8gdGhlIGB1cHNlcnRgIGhvb2tzLCB0aGlzIGlzIHdoYXQgd2lsbCBhY2NvbXBsaXNoIGl0LiBJdCdzIGltcG9ydGFudCB0b1xuICAgICAgLy8gcmVhbGl6ZSB0aGF0IE1ldGVvciB3b24ndCBkaXN0aW5ndWlzaCBiZXR3ZWVuIGFuIGB1cGRhdGVgIGFuZCBhblxuICAgICAgLy8gYGluc2VydGAgdGhvdWdoLCBzbyB3ZSdsbCBlbmQgdXAgd2l0aCBgYWZ0ZXIudXBkYXRlYCBnZXR0aW5nIGNhbGxlZFxuICAgICAgLy8gZXZlbiBvbiBhbiBgaW5zZXJ0YC4gVGhhdCdzIHdoeSB3ZSd2ZSBjaG9zZW4gdG8gZGlzYWJsZSB0aGlzIGZvciBub3cuXG4gICAgICAvLyBpZiAobWV0aG9kID09PSBcInVwZGF0ZVwiICYmIE9iamVjdChhcmdzWzJdKSA9PT0gYXJnc1syXSAmJiBhcmdzWzJdLnVwc2VydCkge1xuICAgICAgLy8gICBtZXRob2QgPSBcInVwc2VydFwiO1xuICAgICAgLy8gICBhZHZpY2UgPSBDb2xsZWN0aW9uSG9va3MuZ2V0QWR2aWNlKG1ldGhvZCk7XG4gICAgICAvLyB9XG5cbiAgICAgIHJldHVybiBhZHZpY2UuY2FsbCh0aGlzLFxuICAgICAgICBDb2xsZWN0aW9uSG9va3MuZ2V0VXNlcklkKCksXG4gICAgICAgIF9zdXBlcixcbiAgICAgICAgc2VsZixcbiAgICAgICAgbWV0aG9kID09PSAndXBzZXJ0J1xuICAgICAgICAgID8ge1xuICAgICAgICAgICAgICBpbnNlcnQ6IHNlbGYuX2hvb2tBc3BlY3RzLmluc2VydCB8fCB7fSxcbiAgICAgICAgICAgICAgdXBkYXRlOiBzZWxmLl9ob29rQXNwZWN0cy51cGRhdGUgfHwge30sXG4gICAgICAgICAgICAgIHVwc2VydDogc2VsZi5faG9va0FzcGVjdHMudXBzZXJ0IHx8IHt9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgOiBzZWxmLl9ob29rQXNwZWN0c1ttZXRob2RdIHx8IHt9LFxuICAgICAgICBmdW5jdGlvbiAoZG9jKSB7XG4gICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIHR5cGVvZiBzZWxmLl90cmFuc2Zvcm0gPT09ICdmdW5jdGlvbidcbiAgICAgICAgICAgICAgPyBmdW5jdGlvbiAoZCkgeyByZXR1cm4gc2VsZi5fdHJhbnNmb3JtKGQgfHwgZG9jKSB9XG4gICAgICAgICAgICAgIDogZnVuY3Rpb24gKGQpIHsgcmV0dXJuIGQgfHwgZG9jIH1cbiAgICAgICAgICApXG4gICAgICAgIH0sXG4gICAgICAgIGFyZ3MsXG4gICAgICAgIGZhbHNlXG4gICAgICApXG4gICAgfVxuICB9KVxufVxuXG5Db2xsZWN0aW9uSG9va3MuZGVmaW5lQWR2aWNlID0gKG1ldGhvZCwgYWR2aWNlKSA9PiB7XG4gIGFkdmljZXNbbWV0aG9kXSA9IGFkdmljZVxufVxuXG5Db2xsZWN0aW9uSG9va3MuZ2V0QWR2aWNlID0gbWV0aG9kID0+IGFkdmljZXNbbWV0aG9kXVxuXG5Db2xsZWN0aW9uSG9va3MuaW5pdE9wdGlvbnMgPSAob3B0aW9ucywgcG9pbnRjdXQsIG1ldGhvZCkgPT5cbiAgQ29sbGVjdGlvbkhvb2tzLmV4dGVuZE9wdGlvbnMoQ29sbGVjdGlvbkhvb2tzLmRlZmF1bHRzLCBvcHRpb25zLCBwb2ludGN1dCwgbWV0aG9kKVxuXG5Db2xsZWN0aW9uSG9va3MuZXh0ZW5kT3B0aW9ucyA9IChzb3VyY2UsIG9wdGlvbnMsIHBvaW50Y3V0LCBtZXRob2QpID0+XG4gICh7IC4uLm9wdGlvbnMsIC4uLnNvdXJjZS5hbGwuYWxsLCAuLi5zb3VyY2VbcG9pbnRjdXRdLmFsbCwgLi4uc291cmNlLmFsbFttZXRob2RdLCAuLi5zb3VyY2VbcG9pbnRjdXRdW21ldGhvZF0gfSlcblxuQ29sbGVjdGlvbkhvb2tzLmdldERvY3MgPSBmdW5jdGlvbiBnZXREb2NzIChjb2xsZWN0aW9uLCBzZWxlY3Rvciwgb3B0aW9ucywgZmV0Y2hGaWVsZHMgPSB7fSwgeyB1c2VEaXJlY3QgPSBmYWxzZSB9ID0ge30pIHtcbiAgY29uc3QgZmluZE9wdGlvbnMgPSB7IHRyYW5zZm9ybTogbnVsbCwgcmVhY3RpdmU6IGZhbHNlIH1cblxuICBpZiAoT2JqZWN0LmtleXMoZmV0Y2hGaWVsZHMpLmxlbmd0aCA+IDApIHtcbiAgICBmaW5kT3B0aW9ucy5maWVsZHMgPSBmZXRjaEZpZWxkc1xuICB9XG5cbiAgLypcbiAgLy8gTm8gXCJmZXRjaFwiIHN1cHBvcnQgYXQgdGhpcyB0aW1lLlxuICBpZiAoIXRoaXMuX3ZhbGlkYXRvcnMuZmV0Y2hBbGxGaWVsZHMpIHtcbiAgICBmaW5kT3B0aW9ucy5maWVsZHMgPSB7fTtcbiAgICB0aGlzLl92YWxpZGF0b3JzLmZldGNoLmZvckVhY2goZnVuY3Rpb24oZmllbGROYW1lKSB7XG4gICAgICBmaW5kT3B0aW9ucy5maWVsZHNbZmllbGROYW1lXSA9IDE7XG4gICAgfSk7XG4gIH1cbiAgKi9cblxuICAvLyBCaXQgb2YgYSBtYWdpYyBjb25kaXRpb24gaGVyZS4uLiBvbmx5IFwidXBkYXRlXCIgcGFzc2VzIG9wdGlvbnMsIHNvIHRoaXMgaXNcbiAgLy8gb25seSByZWxldmFudCB0byB3aGVuIHVwZGF0ZSBjYWxscyBnZXREb2NzOlxuICBpZiAob3B0aW9ucykge1xuICAgIC8vIFRoaXMgd2FzIGFkZGVkIGJlY2F1c2UgaW4gb3VyIGNhc2UsIHdlIGFyZSBwb3RlbnRpYWxseSBpdGVyYXRpbmcgb3ZlclxuICAgIC8vIG11bHRpcGxlIGRvY3MuIElmIG11bHRpIGlzbid0IGVuYWJsZWQsIGZvcmNlIGEgbGltaXQgKGFsbW9zdCBsaWtlXG4gICAgLy8gZmluZE9uZSksIGFzIHRoZSBkZWZhdWx0IGZvciB1cGRhdGUgd2l0aG91dCBtdWx0aSBlbmFibGVkIGlzIHRvIGFmZmVjdFxuICAgIC8vIG9ubHkgdGhlIGZpcnN0IG1hdGNoZWQgZG9jdW1lbnQ6XG4gICAgaWYgKCFvcHRpb25zLm11bHRpKSB7XG4gICAgICBmaW5kT3B0aW9ucy5saW1pdCA9IDFcbiAgICB9XG4gICAgY29uc3QgeyBtdWx0aSwgdXBzZXJ0LCAuLi5yZXN0IH0gPSBvcHRpb25zXG4gICAgT2JqZWN0LmFzc2lnbihmaW5kT3B0aW9ucywgcmVzdClcbiAgfVxuXG4gIC8vIFVubGlrZSB2YWxpZGF0b3JzLCB3ZSBpdGVyYXRlIG92ZXIgbXVsdGlwbGUgZG9jcywgc28gdXNlXG4gIC8vIGZpbmQgaW5zdGVhZCBvZiBmaW5kT25lOlxuICByZXR1cm4gKHVzZURpcmVjdCA/IGNvbGxlY3Rpb24uZGlyZWN0IDogY29sbGVjdGlvbikuZmluZChzZWxlY3RvciwgZmluZE9wdGlvbnMpXG59XG5cbi8vIFRoaXMgZnVuY3Rpb24gbm9ybWFsaXplcyB0aGUgc2VsZWN0b3IgKGNvbnZlcnRpbmcgaXQgdG8gYW4gT2JqZWN0KVxuQ29sbGVjdGlvbkhvb2tzLm5vcm1hbGl6ZVNlbGVjdG9yID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gIGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09ICdzdHJpbmcnIHx8IChzZWxlY3RvciAmJiBzZWxlY3Rvci5jb25zdHJ1Y3RvciA9PT0gTW9uZ28uT2JqZWN0SUQpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIF9pZDogc2VsZWN0b3JcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHNlbGVjdG9yXG4gIH1cbn1cblxuLy8gVGhpcyBmdW5jdGlvbiBjb250YWlucyBhIHNuaXBwZXQgb2YgY29kZSBwdWxsZWQgYW5kIG1vZGlmaWVkIGZyb206XG4vLyB+Ly5tZXRlb3IvcGFja2FnZXMvbW9uZ28tbGl2ZWRhdGEvY29sbGVjdGlvbi5qc1xuLy8gSXQncyBjb250YWluZWQgaW4gdGhlc2UgdXRpbGl0eSBmdW5jdGlvbnMgdG8gbWFrZSB1cGRhdGVzIGVhc2llciBmb3IgdXMgaW5cbi8vIGNhc2UgdGhpcyBjb2RlIGNoYW5nZXMuXG5Db2xsZWN0aW9uSG9va3MuZ2V0RmllbGRzID0gZnVuY3Rpb24gZ2V0RmllbGRzIChtdXRhdG9yKSB7XG4gIC8vIGNvbXB1dGUgbW9kaWZpZWQgZmllbGRzXG4gIGNvbnN0IGZpZWxkcyA9IFtdXG4gIC8vID09PT1BRERFRCBTVEFSVD09PT09PT09PT09PT09PT09PT09PT09XG4gIGNvbnN0IG9wZXJhdG9ycyA9IFtcbiAgICAnJGFkZFRvU2V0JyxcbiAgICAnJGJpdCcsXG4gICAgJyRjdXJyZW50RGF0ZScsXG4gICAgJyRpbmMnLFxuICAgICckbWF4JyxcbiAgICAnJG1pbicsXG4gICAgJyRwb3AnLFxuICAgICckcHVsbCcsXG4gICAgJyRwdWxsQWxsJyxcbiAgICAnJHB1c2gnLFxuICAgICckcmVuYW1lJyxcbiAgICAnJHNldCcsXG4gICAgJyR1bnNldCdcbiAgXVxuICAvLyA9PT09QURERUQgRU5EPT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIE9iamVjdC5lbnRyaWVzKG11dGF0b3IpLmZvckVhY2goZnVuY3Rpb24gKFtvcCwgcGFyYW1zXSkge1xuICAgIC8vID09PT1BRERFRCBTVEFSVD09PT09PT09PT09PT09PT09PT09PT09XG4gICAgaWYgKG9wZXJhdG9ycy5pbmNsdWRlcyhvcCkpIHtcbiAgICAvLyA9PT09QURERUQgRU5EPT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgT2JqZWN0LmtleXMocGFyYW1zKS5mb3JFYWNoKGZ1bmN0aW9uIChmaWVsZCkge1xuICAgICAgICAvLyB0cmVhdCBkb3R0ZWQgZmllbGRzIGFzIGlmIHRoZXkgYXJlIHJlcGxhY2luZyB0aGVpclxuICAgICAgICAvLyB0b3AtbGV2ZWwgcGFydFxuICAgICAgICBpZiAoZmllbGQuaW5kZXhPZignLicpICE9PSAtMSkge1xuICAgICAgICAgIGZpZWxkID0gZmllbGQuc3Vic3RyaW5nKDAsIGZpZWxkLmluZGV4T2YoJy4nKSlcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHJlY29yZCB0aGUgZmllbGQgd2UgYXJlIHRyeWluZyB0byBjaGFuZ2VcbiAgICAgICAgaWYgKCFmaWVsZHMuaW5jbHVkZXMoZmllbGQpKSB7XG4gICAgICAgICAgZmllbGRzLnB1c2goZmllbGQpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAvLyA9PT09QURERUQgU1RBUlQ9PT09PT09PT09PT09PT09PT09PT09PVxuICAgIH0gZWxzZSB7XG4gICAgICBmaWVsZHMucHVzaChvcClcbiAgICB9XG4gICAgLy8gPT09PUFEREVEIEVORD09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgfSlcblxuICByZXR1cm4gZmllbGRzXG59XG5cbkNvbGxlY3Rpb25Ib29rcy5yZWFzc2lnblByb3RvdHlwZSA9IGZ1bmN0aW9uIHJlYXNzaWduUHJvdG90eXBlIChpbnN0YW5jZSwgY29uc3RyKSB7XG4gIGNvbnN0IGhhc1NldFByb3RvdHlwZU9mID0gdHlwZW9mIE9iamVjdC5zZXRQcm90b3R5cGVPZiA9PT0gJ2Z1bmN0aW9uJ1xuICBjb25zdHIgPSBjb25zdHIgfHwgTW9uZ28uQ29sbGVjdGlvblxuXG4gIC8vIF9fcHJvdG9fXyBpcyBub3QgYXZhaWxhYmxlIGluIDwgSUUxMVxuICAvLyBOb3RlOiBBc3NpZ25pbmcgYSBwcm90b3R5cGUgZHluYW1pY2FsbHkgaGFzIHBlcmZvcm1hbmNlIGltcGxpY2F0aW9uc1xuICBpZiAoaGFzU2V0UHJvdG90eXBlT2YpIHtcbiAgICBPYmplY3Quc2V0UHJvdG90eXBlT2YoaW5zdGFuY2UsIGNvbnN0ci5wcm90b3R5cGUpXG4gIH0gZWxzZSBpZiAoaW5zdGFuY2UuX19wcm90b19fKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tcHJvdG9cbiAgICBpbnN0YW5jZS5fX3Byb3RvX18gPSBjb25zdHIucHJvdG90eXBlIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tcHJvdG9cbiAgfVxufVxuXG5Db2xsZWN0aW9uSG9va3Mud3JhcENvbGxlY3Rpb24gPSBmdW5jdGlvbiB3cmFwQ29sbGVjdGlvbiAobnMsIGFzKSB7XG4gIGlmICghYXMuX0NvbGxlY3Rpb25Db25zdHJ1Y3RvcikgYXMuX0NvbGxlY3Rpb25Db25zdHJ1Y3RvciA9IGFzLkNvbGxlY3Rpb25cbiAgaWYgKCFhcy5fQ29sbGVjdGlvblByb3RvdHlwZSkgYXMuX0NvbGxlY3Rpb25Qcm90b3R5cGUgPSBuZXcgYXMuQ29sbGVjdGlvbihudWxsKVxuXG4gIGNvbnN0IGNvbnN0cnVjdG9yID0gbnMuX05ld0NvbGxlY3Rpb25Db250cnVjdG9yIHx8IGFzLl9Db2xsZWN0aW9uQ29uc3RydWN0b3JcbiAgY29uc3QgcHJvdG8gPSBhcy5fQ29sbGVjdGlvblByb3RvdHlwZVxuXG4gIG5zLkNvbGxlY3Rpb24gPSBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgIGNvbnN0IHJldCA9IGNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3MpXG4gICAgQ29sbGVjdGlvbkhvb2tzLmV4dGVuZENvbGxlY3Rpb25JbnN0YW5jZSh0aGlzLCBjb25zdHJ1Y3RvcilcbiAgICByZXR1cm4gcmV0XG4gIH1cbiAgLy8gUmV0YWluIGEgcmVmZXJlbmNlIHRvIHRoZSBuZXcgY29uc3RydWN0b3IgdG8gYWxsb3cgZnVydGhlciB3cmFwcGluZy5cbiAgbnMuX05ld0NvbGxlY3Rpb25Db250cnVjdG9yID0gbnMuQ29sbGVjdGlvblxuXG4gIG5zLkNvbGxlY3Rpb24ucHJvdG90eXBlID0gcHJvdG9cbiAgbnMuQ29sbGVjdGlvbi5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBucy5Db2xsZWN0aW9uXG5cbiAgZm9yIChjb25zdCBwcm9wIG9mIE9iamVjdC5rZXlzKGNvbnN0cnVjdG9yKSkge1xuICAgIG5zLkNvbGxlY3Rpb25bcHJvcF0gPSBjb25zdHJ1Y3Rvcltwcm9wXVxuICB9XG5cbiAgLy8gTWV0ZW9yIG92ZXJyaWRlcyB0aGUgYXBwbHkgbWV0aG9kIHdoaWNoIGlzIGNvcGllZCBmcm9tIHRoZSBjb25zdHJ1Y3RvciBpbiB0aGUgbG9vcCBhYm92ZS4gUmVwbGFjZSBpdCB3aXRoIHRoZVxuICAvLyBkZWZhdWx0IG1ldGhvZCB3aGljaCB3ZSBuZWVkIGlmIHdlIHdlcmUgdG8gZnVydGhlciB3cmFwIG5zLkNvbGxlY3Rpb24uXG4gIG5zLkNvbGxlY3Rpb24uYXBwbHkgPSBGdW5jdGlvbi5wcm90b3R5cGUuYXBwbHlcbn1cblxuQ29sbGVjdGlvbkhvb2tzLm1vZGlmeSA9IExvY2FsQ29sbGVjdGlvbi5fbW9kaWZ5XG5cbmlmICh0eXBlb2YgTW9uZ28gIT09ICd1bmRlZmluZWQnKSB7XG4gIENvbGxlY3Rpb25Ib29rcy53cmFwQ29sbGVjdGlvbihNZXRlb3IsIE1vbmdvKVxuICBDb2xsZWN0aW9uSG9va3Mud3JhcENvbGxlY3Rpb24oTW9uZ28sIE1vbmdvKVxufSBlbHNlIHtcbiAgQ29sbGVjdGlvbkhvb2tzLndyYXBDb2xsZWN0aW9uKE1ldGVvciwgTWV0ZW9yKVxufVxuIiwiaW1wb3J0IHsgQ29sbGVjdGlvbkhvb2tzIH0gZnJvbSAnLi9jb2xsZWN0aW9uLWhvb2tzJ1xuXG5Db2xsZWN0aW9uSG9va3MuZGVmaW5lQWR2aWNlKCdmaW5kJywgZnVuY3Rpb24gKHVzZXJJZCwgX3N1cGVyLCBpbnN0YW5jZSwgYXNwZWN0cywgZ2V0VHJhbnNmb3JtLCBhcmdzLCBzdXBwcmVzc0FzcGVjdHMpIHtcbiAgY29uc3QgY3R4ID0geyBjb250ZXh0OiB0aGlzLCBfc3VwZXIsIGFyZ3MgfVxuICBjb25zdCBzZWxlY3RvciA9IENvbGxlY3Rpb25Ib29rcy5ub3JtYWxpemVTZWxlY3RvcihpbnN0YW5jZS5fZ2V0RmluZFNlbGVjdG9yKGFyZ3MpKVxuICBjb25zdCBvcHRpb25zID0gaW5zdGFuY2UuX2dldEZpbmRPcHRpb25zKGFyZ3MpXG4gIGxldCBhYm9ydFxuICAvLyBiZWZvcmVcbiAgaWYgKCFzdXBwcmVzc0FzcGVjdHMpIHtcbiAgICBhc3BlY3RzLmJlZm9yZS5mb3JFYWNoKChvKSA9PiB7XG4gICAgICBjb25zdCByID0gby5hc3BlY3QuY2FsbChjdHgsIHVzZXJJZCwgc2VsZWN0b3IsIG9wdGlvbnMpXG4gICAgICBpZiAociA9PT0gZmFsc2UpIGFib3J0ID0gdHJ1ZVxuICAgIH0pXG5cbiAgICBpZiAoYWJvcnQpIHJldHVybiBpbnN0YW5jZS5maW5kKHVuZGVmaW5lZClcbiAgfVxuXG4gIGNvbnN0IGFmdGVyID0gKGN1cnNvcikgPT4ge1xuICAgIGlmICghc3VwcHJlc3NBc3BlY3RzKSB7XG4gICAgICBhc3BlY3RzLmFmdGVyLmZvckVhY2goKG8pID0+IHtcbiAgICAgICAgby5hc3BlY3QuY2FsbChjdHgsIHVzZXJJZCwgc2VsZWN0b3IsIG9wdGlvbnMsIGN1cnNvcilcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgY29uc3QgcmV0ID0gX3N1cGVyLmNhbGwodGhpcywgc2VsZWN0b3IsIG9wdGlvbnMpXG4gIGFmdGVyKHJldClcblxuICByZXR1cm4gcmV0XG59KVxuIiwiaW1wb3J0IHsgQ29sbGVjdGlvbkhvb2tzIH0gZnJvbSAnLi9jb2xsZWN0aW9uLWhvb2tzJ1xuXG5Db2xsZWN0aW9uSG9va3MuZGVmaW5lQWR2aWNlKCdmaW5kT25lJywgZnVuY3Rpb24gKHVzZXJJZCwgX3N1cGVyLCBpbnN0YW5jZSwgYXNwZWN0cywgZ2V0VHJhbnNmb3JtLCBhcmdzLCBzdXBwcmVzc0FzcGVjdHMpIHtcbiAgY29uc3QgY3R4ID0geyBjb250ZXh0OiB0aGlzLCBfc3VwZXIsIGFyZ3MgfVxuICBjb25zdCBzZWxlY3RvciA9IENvbGxlY3Rpb25Ib29rcy5ub3JtYWxpemVTZWxlY3RvcihpbnN0YW5jZS5fZ2V0RmluZFNlbGVjdG9yKGFyZ3MpKVxuICBjb25zdCBvcHRpb25zID0gaW5zdGFuY2UuX2dldEZpbmRPcHRpb25zKGFyZ3MpXG4gIGxldCBhYm9ydFxuXG4gIC8vIGJlZm9yZVxuICBpZiAoIXN1cHByZXNzQXNwZWN0cykge1xuICAgIGFzcGVjdHMuYmVmb3JlLmZvckVhY2goKG8pID0+IHtcbiAgICAgIGNvbnN0IHIgPSBvLmFzcGVjdC5jYWxsKGN0eCwgdXNlcklkLCBzZWxlY3Rvciwgb3B0aW9ucylcbiAgICAgIGlmIChyID09PSBmYWxzZSkgYWJvcnQgPSB0cnVlXG4gICAgfSlcblxuICAgIGlmIChhYm9ydCkgcmV0dXJuXG4gIH1cblxuICBmdW5jdGlvbiBhZnRlciAoZG9jKSB7XG4gICAgaWYgKCFzdXBwcmVzc0FzcGVjdHMpIHtcbiAgICAgIGFzcGVjdHMuYWZ0ZXIuZm9yRWFjaCgobykgPT4ge1xuICAgICAgICBvLmFzcGVjdC5jYWxsKGN0eCwgdXNlcklkLCBzZWxlY3Rvciwgb3B0aW9ucywgZG9jKVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICBjb25zdCByZXQgPSBfc3VwZXIuY2FsbCh0aGlzLCBzZWxlY3Rvciwgb3B0aW9ucylcbiAgYWZ0ZXIocmV0KVxuXG4gIHJldHVybiByZXRcbn0pXG4iLCJpbXBvcnQgeyBFSlNPTiB9IGZyb20gJ21ldGVvci9lanNvbidcbmltcG9ydCB7IE1vbmdvIH0gZnJvbSAnbWV0ZW9yL21vbmdvJ1xuaW1wb3J0IHsgQ29sbGVjdGlvbkhvb2tzIH0gZnJvbSAnLi9jb2xsZWN0aW9uLWhvb2tzJ1xuXG5Db2xsZWN0aW9uSG9va3MuZGVmaW5lQWR2aWNlKCdpbnNlcnQnLCBmdW5jdGlvbiAodXNlcklkLCBfc3VwZXIsIGluc3RhbmNlLCBhc3BlY3RzLCBnZXRUcmFuc2Zvcm0sIGFyZ3MsIHN1cHByZXNzQXNwZWN0cykge1xuICBjb25zdCBjdHggPSB7IGNvbnRleHQ6IHRoaXMsIF9zdXBlciwgYXJncyB9XG4gIGxldCBkb2MgPSBhcmdzWzBdXG4gIGxldCBjYWxsYmFja1xuICBpZiAodHlwZW9mIGFyZ3NbYXJncy5sZW5ndGggLSAxXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNhbGxiYWNrID0gYXJnc1thcmdzLmxlbmd0aCAtIDFdXG4gIH1cblxuICBjb25zdCBhc3luYyA9IHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJ1xuICBsZXQgYWJvcnRcbiAgbGV0IHJldFxuXG4gIC8vIGJlZm9yZVxuICBpZiAoIXN1cHByZXNzQXNwZWN0cykge1xuICAgIHRyeSB7XG4gICAgICBhc3BlY3RzLmJlZm9yZS5mb3JFYWNoKChvKSA9PiB7XG4gICAgICAgIGNvbnN0IHIgPSBvLmFzcGVjdC5jYWxsKHsgdHJhbnNmb3JtOiBnZXRUcmFuc2Zvcm0oZG9jKSwgLi4uY3R4IH0sIHVzZXJJZCwgZG9jKVxuICAgICAgICBpZiAociA9PT0gZmFsc2UpIGFib3J0ID0gdHJ1ZVxuICAgICAgfSlcblxuICAgICAgaWYgKGFib3J0KSByZXR1cm5cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoYXN5bmMpIHJldHVybiBjYWxsYmFjay5jYWxsKHRoaXMsIGUpXG4gICAgICB0aHJvdyBlXG4gICAgfVxuICB9XG5cbiAgY29uc3QgYWZ0ZXIgPSAoaWQsIGVycikgPT4ge1xuICAgIGlmIChpZCkge1xuICAgICAgLy8gSW4gc29tZSBjYXNlcyAobmFtZWx5IE1ldGVvci51c2VycyBvbiBNZXRlb3IgMS40KyksIHRoZSBfaWQgcHJvcGVydHlcbiAgICAgIC8vIGlzIGEgcmF3IG1vbmdvIF9pZCBvYmplY3QuIFdlIG5lZWQgdG8gZXh0cmFjdCB0aGUgX2lkIGZyb20gdGhpcyBvYmplY3RcbiAgICAgIGlmICh0eXBlb2YgaWQgPT09ICdvYmplY3QnICYmIGlkLm9wcykge1xuICAgICAgICAvLyBJZiBfc3RyIHRoZW4gY29sbGVjdGlvbiBpcyB1c2luZyBNb25nby5PYmplY3RJRCBhcyBpZHNcbiAgICAgICAgaWYgKGRvYy5faWQuX3N0cikge1xuICAgICAgICAgIGlkID0gbmV3IE1vbmdvLk9iamVjdElEKGRvYy5faWQuX3N0ci50b1N0cmluZygpKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlkID0gaWQub3BzICYmIGlkLm9wc1swXSAmJiBpZC5vcHNbMF0uX2lkXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGRvYyA9IEVKU09OLmNsb25lKGRvYylcbiAgICAgIGRvYy5faWQgPSBpZFxuICAgIH1cbiAgICBpZiAoIXN1cHByZXNzQXNwZWN0cykge1xuICAgICAgY29uc3QgbGN0eCA9IHsgdHJhbnNmb3JtOiBnZXRUcmFuc2Zvcm0oZG9jKSwgX2lkOiBpZCwgZXJyLCAuLi5jdHggfVxuICAgICAgYXNwZWN0cy5hZnRlci5mb3JFYWNoKChvKSA9PiB7XG4gICAgICAgIG8uYXNwZWN0LmNhbGwobGN0eCwgdXNlcklkLCBkb2MpXG4gICAgICB9KVxuICAgIH1cbiAgICByZXR1cm4gaWRcbiAgfVxuXG4gIGlmIChhc3luYykge1xuICAgIGNvbnN0IHdyYXBwZWRDYWxsYmFjayA9IGZ1bmN0aW9uIChlcnIsIG9iaiwgLi4uYXJncykge1xuICAgICAgYWZ0ZXIoKG9iaiAmJiBvYmpbMF0gJiYgb2JqWzBdLl9pZCkgfHwgb2JqLCBlcnIpXG4gICAgICByZXR1cm4gY2FsbGJhY2suY2FsbCh0aGlzLCBlcnIsIG9iaiwgLi4uYXJncylcbiAgICB9XG4gICAgcmV0dXJuIF9zdXBlci5jYWxsKHRoaXMsIGRvYywgd3JhcHBlZENhbGxiYWNrKVxuICB9IGVsc2Uge1xuICAgIHJldCA9IF9zdXBlci5jYWxsKHRoaXMsIGRvYywgY2FsbGJhY2spXG4gICAgcmV0dXJuIGFmdGVyKChyZXQgJiYgcmV0Lmluc2VydGVkSWQpIHx8IChyZXQgJiYgcmV0WzBdICYmIHJldFswXS5faWQpIHx8IHJldClcbiAgfVxufSlcbiIsImltcG9ydCB7IEVKU09OIH0gZnJvbSAnbWV0ZW9yL2Vqc29uJ1xuaW1wb3J0IHsgQ29sbGVjdGlvbkhvb2tzIH0gZnJvbSAnLi9jb2xsZWN0aW9uLWhvb2tzJ1xuXG5jb25zdCBpc0VtcHR5ID0gYSA9PiAhQXJyYXkuaXNBcnJheShhKSB8fCAhYS5sZW5ndGhcblxuQ29sbGVjdGlvbkhvb2tzLmRlZmluZUFkdmljZSgncmVtb3ZlJywgZnVuY3Rpb24gKHVzZXJJZCwgX3N1cGVyLCBpbnN0YW5jZSwgYXNwZWN0cywgZ2V0VHJhbnNmb3JtLCBhcmdzLCBzdXBwcmVzc0FzcGVjdHMpIHtcbiAgY29uc3QgY3R4ID0geyBjb250ZXh0OiB0aGlzLCBfc3VwZXIsIGFyZ3MgfVxuICBjb25zdCBbc2VsZWN0b3IsIGNhbGxiYWNrXSA9IGFyZ3NcbiAgY29uc3QgYXN5bmMgPSB0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbidcbiAgbGV0IGRvY3NcbiAgbGV0IGFib3J0XG4gIGNvbnN0IHByZXYgPSBbXVxuXG4gIGlmICghc3VwcHJlc3NBc3BlY3RzKSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICghaXNFbXB0eShhc3BlY3RzLmJlZm9yZSkgfHwgIWlzRW1wdHkoYXNwZWN0cy5hZnRlcikpIHtcbiAgICAgICAgZG9jcyA9IENvbGxlY3Rpb25Ib29rcy5nZXREb2NzLmNhbGwodGhpcywgaW5zdGFuY2UsIHNlbGVjdG9yKS5mZXRjaCgpXG4gICAgICB9XG5cbiAgICAgIC8vIGNvcHkgb3JpZ2luYWxzIGZvciBjb252ZW5pZW5jZSBmb3IgdGhlICdhZnRlcicgcG9pbnRjdXRcbiAgICAgIGlmICghaXNFbXB0eShhc3BlY3RzLmFmdGVyKSkge1xuICAgICAgICBkb2NzLmZvckVhY2goZG9jID0+IHByZXYucHVzaChFSlNPTi5jbG9uZShkb2MpKSlcbiAgICAgIH1cblxuICAgICAgLy8gYmVmb3JlXG4gICAgICBhc3BlY3RzLmJlZm9yZS5mb3JFYWNoKChvKSA9PiB7XG4gICAgICAgIGRvY3MuZm9yRWFjaCgoZG9jKSA9PiB7XG4gICAgICAgICAgY29uc3QgciA9IG8uYXNwZWN0LmNhbGwoeyB0cmFuc2Zvcm06IGdldFRyYW5zZm9ybShkb2MpLCAuLi5jdHggfSwgdXNlcklkLCBkb2MpXG4gICAgICAgICAgaWYgKHIgPT09IGZhbHNlKSBhYm9ydCA9IHRydWVcbiAgICAgICAgfSlcbiAgICAgIH0pXG5cbiAgICAgIGlmIChhYm9ydCkgcmV0dXJuIDBcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoYXN5bmMpIHJldHVybiBjYWxsYmFjay5jYWxsKHRoaXMsIGUpXG4gICAgICB0aHJvdyBlXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYWZ0ZXIgKGVycikge1xuICAgIGlmICghc3VwcHJlc3NBc3BlY3RzKSB7XG4gICAgICBhc3BlY3RzLmFmdGVyLmZvckVhY2goKG8pID0+IHtcbiAgICAgICAgcHJldi5mb3JFYWNoKChkb2MpID0+IHtcbiAgICAgICAgICBvLmFzcGVjdC5jYWxsKHsgdHJhbnNmb3JtOiBnZXRUcmFuc2Zvcm0oZG9jKSwgZXJyLCAuLi5jdHggfSwgdXNlcklkLCBkb2MpXG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIGlmIChhc3luYykge1xuICAgIGNvbnN0IHdyYXBwZWRDYWxsYmFjayA9IGZ1bmN0aW9uIChlcnIsIC4uLmFyZ3MpIHtcbiAgICAgIGFmdGVyKGVycilcbiAgICAgIHJldHVybiBjYWxsYmFjay5jYWxsKHRoaXMsIGVyciwgLi4uYXJncylcbiAgICB9XG4gICAgcmV0dXJuIF9zdXBlci5jYWxsKHRoaXMsIHNlbGVjdG9yLCB3cmFwcGVkQ2FsbGJhY2spXG4gIH0gZWxzZSB7XG4gICAgY29uc3QgcmVzdWx0ID0gX3N1cGVyLmNhbGwodGhpcywgc2VsZWN0b3IsIGNhbGxiYWNrKVxuICAgIGFmdGVyKClcbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cbn0pXG4iLCJpbXBvcnQgeyBFSlNPTiB9IGZyb20gJ21ldGVvci9lanNvbidcbmltcG9ydCB7IENvbGxlY3Rpb25Ib29rcyB9IGZyb20gJy4vY29sbGVjdGlvbi1ob29rcydcblxuY29uc3QgaXNFbXB0eSA9IGEgPT4gIUFycmF5LmlzQXJyYXkoYSkgfHwgIWEubGVuZ3RoXG5cbkNvbGxlY3Rpb25Ib29rcy5kZWZpbmVBZHZpY2UoJ3VwZGF0ZScsIGZ1bmN0aW9uICh1c2VySWQsIF9zdXBlciwgaW5zdGFuY2UsIGFzcGVjdHMsIGdldFRyYW5zZm9ybSwgYXJncywgc3VwcHJlc3NBc3BlY3RzKSB7XG4gIGNvbnN0IGN0eCA9IHsgY29udGV4dDogdGhpcywgX3N1cGVyLCBhcmdzIH1cbiAgbGV0IFtzZWxlY3RvciwgbXV0YXRvciwgb3B0aW9ucywgY2FsbGJhY2tdID0gYXJnc1xuICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICBjYWxsYmFjayA9IG9wdGlvbnNcbiAgICBvcHRpb25zID0ge31cbiAgfVxuICBjb25zdCBhc3luYyA9IHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJ1xuICBsZXQgZG9jc1xuICBsZXQgZG9jSWRzXG4gIGxldCBmaWVsZHNcbiAgbGV0IGFib3J0XG4gIGNvbnN0IHByZXYgPSB7fVxuXG4gIGlmICghc3VwcHJlc3NBc3BlY3RzKSB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIE5PVEU6IGZldGNoaW5nIHRoZSBmdWxsIGRvY3VtZW50cyBiZWZvcmUgd2hlbiBmZXRjaFByZXZpb3VzIGlzIGZhbHNlIGFuZCBubyBiZWZvcmUgaG9va3MgYXJlIGRlZmluZWQgaXMgd2lsZGx5IGluZWZmaWNpZW50LlxuICAgICAgY29uc3Qgc2hvdWxkRmV0Y2hGb3JCZWZvcmUgPSAhaXNFbXB0eShhc3BlY3RzLmJlZm9yZSlcbiAgICAgIGNvbnN0IHNob3VsZEZldGNoRm9yQWZ0ZXIgPSAhaXNFbXB0eShhc3BlY3RzLmFmdGVyKVxuICAgICAgbGV0IHNob3VsZEZldGNoRm9yUHJldmlvdXMgPSBmYWxzZVxuICAgICAgaWYgKHNob3VsZEZldGNoRm9yQWZ0ZXIpIHtcbiAgICAgICAgc2hvdWxkRmV0Y2hGb3JQcmV2aW91cyA9IE9iamVjdC52YWx1ZXMoYXNwZWN0cy5hZnRlcikuc29tZShvID0+IG8ub3B0aW9ucy5mZXRjaFByZXZpb3VzICE9PSBmYWxzZSkgJiYgQ29sbGVjdGlvbkhvb2tzLmV4dGVuZE9wdGlvbnMoaW5zdGFuY2UuaG9va09wdGlvbnMsIHt9LCAnYWZ0ZXInLCAndXBkYXRlJykuZmV0Y2hQcmV2aW91cyAhPT0gZmFsc2VcbiAgICAgIH1cbiAgICAgIGZpZWxkcyA9IENvbGxlY3Rpb25Ib29rcy5nZXRGaWVsZHMoYXJnc1sxXSlcbiAgICAgIGNvbnN0IGZldGNoRmllbGRzID0geyB9XG4gICAgICBpZiAoc2hvdWxkRmV0Y2hGb3JQcmV2aW91cyB8fCBzaG91bGRGZXRjaEZvckJlZm9yZSkge1xuICAgICAgICBjb25zdCBhZnRlckFzcGVjdEZldGNoRmllbGRzID0gc2hvdWxkRmV0Y2hGb3JQcmV2aW91cyA/IE9iamVjdC52YWx1ZXMoYXNwZWN0cy5hZnRlcikubWFwKG8gPT4gKG8ub3B0aW9ucyB8fCB7fSkuZmV0Y2hGaWVsZHMgfHwge30pIDogW11cbiAgICAgICAgY29uc3QgYmVmb3JlQXNwZWN0RmV0Y2hGaWVsZHMgPSBzaG91bGRGZXRjaEZvckJlZm9yZSA/IE9iamVjdC52YWx1ZXMoYXNwZWN0cy5iZWZvcmUpLm1hcChvID0+IChvLm9wdGlvbnMgfHwge30pLmZldGNoRmllbGRzIHx8IHt9KSA6IFtdXG4gICAgICAgIGNvbnN0IGFmdGVyR2xvYmFsID0gc2hvdWxkRmV0Y2hGb3JQcmV2aW91cyA/IChDb2xsZWN0aW9uSG9va3MuZXh0ZW5kT3B0aW9ucyhpbnN0YW5jZS5ob29rT3B0aW9ucywge30sICdhZnRlcicsICd1cGRhdGUnKS5mZXRjaEZpZWxkcyB8fCB7fSkgOiB7fVxuICAgICAgICBjb25zdCBiZWZvcmVHbG9iYWwgPSBzaG91bGRGZXRjaEZvclByZXZpb3VzID8gKENvbGxlY3Rpb25Ib29rcy5leHRlbmRPcHRpb25zKGluc3RhbmNlLmhvb2tPcHRpb25zLCB7fSwgJ2JlZm9yZScsICd1cGRhdGUnKS5mZXRjaEZpZWxkcyB8fCB7fSkgOiB7fVxuICAgICAgICBPYmplY3QuYXNzaWduKGZldGNoRmllbGRzLCBhZnRlckdsb2JhbCwgYmVmb3JlR2xvYmFsLCAuLi5hZnRlckFzcGVjdEZldGNoRmllbGRzLCAuLi5iZWZvcmVBc3BlY3RGZXRjaEZpZWxkcylcbiAgICAgIH1cbiAgICAgIGRvY3MgPSBDb2xsZWN0aW9uSG9va3MuZ2V0RG9jcy5jYWxsKHRoaXMsIGluc3RhbmNlLCBhcmdzWzBdLCBhcmdzWzJdLCBmZXRjaEZpZWxkcykuZmV0Y2goKVxuICAgICAgZG9jSWRzID0gT2JqZWN0LnZhbHVlcyhkb2NzKS5tYXAoZG9jID0+IGRvYy5faWQpXG5cbiAgICAgIC8vIGNvcHkgb3JpZ2luYWxzIGZvciBjb252ZW5pZW5jZSBmb3IgdGhlICdhZnRlcicgcG9pbnRjdXRcbiAgICAgIGlmIChzaG91bGRGZXRjaEZvckFmdGVyKSB7XG4gICAgICAgIHByZXYubXV0YXRvciA9IEVKU09OLmNsb25lKGFyZ3NbMV0pXG4gICAgICAgIHByZXYub3B0aW9ucyA9IEVKU09OLmNsb25lKGFyZ3NbMl0pXG4gICAgICAgIGlmIChzaG91bGRGZXRjaEZvclByZXZpb3VzKSB7XG4gICAgICAgICAgcHJldi5kb2NzID0ge31cbiAgICAgICAgICBkb2NzLmZvckVhY2goKGRvYykgPT4ge1xuICAgICAgICAgICAgcHJldi5kb2NzW2RvYy5faWRdID0gRUpTT04uY2xvbmUoZG9jKVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gYmVmb3JlXG4gICAgICBhc3BlY3RzLmJlZm9yZS5mb3JFYWNoKGZ1bmN0aW9uIChvKSB7XG4gICAgICAgIGRvY3MuZm9yRWFjaChmdW5jdGlvbiAoZG9jKSB7XG4gICAgICAgICAgY29uc3QgciA9IG8uYXNwZWN0LmNhbGwoeyB0cmFuc2Zvcm06IGdldFRyYW5zZm9ybShkb2MpLCAuLi5jdHggfSwgdXNlcklkLCBkb2MsIGZpZWxkcywgbXV0YXRvciwgb3B0aW9ucylcbiAgICAgICAgICBpZiAociA9PT0gZmFsc2UpIGFib3J0ID0gdHJ1ZVxuICAgICAgICB9KVxuICAgICAgfSlcblxuICAgICAgaWYgKGFib3J0KSByZXR1cm4gMFxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChhc3luYykgcmV0dXJuIGNhbGxiYWNrLmNhbGwodGhpcywgZSlcbiAgICAgIHRocm93IGVcbiAgICB9XG4gIH1cblxuICBjb25zdCBhZnRlciA9IChhZmZlY3RlZCwgZXJyKSA9PiB7XG4gICAgaWYgKCFzdXBwcmVzc0FzcGVjdHMpIHtcbiAgICAgIGxldCBkb2NzXG4gICAgICBsZXQgZmllbGRzXG4gICAgICBpZiAoIWlzRW1wdHkoYXNwZWN0cy5hZnRlcikpIHtcbiAgICAgICAgZmllbGRzID0gQ29sbGVjdGlvbkhvb2tzLmdldEZpZWxkcyhhcmdzWzFdKVxuICAgICAgICBjb25zdCBmZXRjaEZpZWxkcyA9IHt9XG4gICAgICAgIGNvbnN0IGFzcGVjdEZldGNoRmllbGRzID0gT2JqZWN0LnZhbHVlcyhhc3BlY3RzLmFmdGVyKS5tYXAobyA9PiAoby5vcHRpb25zIHx8IHt9KS5mZXRjaEZpZWxkcyB8fCB7fSlcbiAgICAgICAgY29uc3QgZ2xvYmFsRmV0Y2hGaWVsZHMgPSBDb2xsZWN0aW9uSG9va3MuZXh0ZW5kT3B0aW9ucyhpbnN0YW5jZS5ob29rT3B0aW9ucywge30sICdhZnRlcicsICd1cGRhdGUnKS5mZXRjaEZpZWxkc1xuICAgICAgICBpZiAoYXNwZWN0RmV0Y2hGaWVsZHMgfHwgZ2xvYmFsRmV0Y2hGaWVsZHMpIHtcbiAgICAgICAgICBPYmplY3QuYXNzaWduKGZldGNoRmllbGRzLCBnbG9iYWxGZXRjaEZpZWxkcyB8fCB7fSwgLi4uYXNwZWN0RmV0Y2hGaWVsZHMubWFwKGEgPT4gYS5mZXRjaEZpZWxkcykpXG4gICAgICAgIH1cbiAgICAgICAgZG9jcyA9IENvbGxlY3Rpb25Ib29rcy5nZXREb2NzLmNhbGwodGhpcywgaW5zdGFuY2UsIHsgX2lkOiB7ICRpbjogZG9jSWRzIH0gfSwgb3B0aW9ucywgZmV0Y2hGaWVsZHMsIHsgdXNlRGlyZWN0OiB0cnVlIH0pLmZldGNoKClcbiAgICAgIH1cblxuICAgICAgYXNwZWN0cy5hZnRlci5mb3JFYWNoKChvKSA9PiB7XG4gICAgICAgIGRvY3MuZm9yRWFjaCgoZG9jKSA9PiB7XG4gICAgICAgICAgby5hc3BlY3QuY2FsbCh7XG4gICAgICAgICAgICB0cmFuc2Zvcm06IGdldFRyYW5zZm9ybShkb2MpLFxuICAgICAgICAgICAgcHJldmlvdXM6IHByZXYuZG9jcyAmJiBwcmV2LmRvY3NbZG9jLl9pZF0sXG4gICAgICAgICAgICBhZmZlY3RlZCxcbiAgICAgICAgICAgIGVycixcbiAgICAgICAgICAgIC4uLmN0eFxuICAgICAgICAgIH0sIHVzZXJJZCwgZG9jLCBmaWVsZHMsIHByZXYubXV0YXRvciwgcHJldi5vcHRpb25zKVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICBpZiAoYXN5bmMpIHtcbiAgICBjb25zdCB3cmFwcGVkQ2FsbGJhY2sgPSBmdW5jdGlvbiAoZXJyLCBhZmZlY3RlZCwgLi4uYXJncykge1xuICAgICAgYWZ0ZXIoYWZmZWN0ZWQsIGVycilcbiAgICAgIHJldHVybiBjYWxsYmFjay5jYWxsKHRoaXMsIGVyciwgYWZmZWN0ZWQsIC4uLmFyZ3MpXG4gICAgfVxuICAgIHJldHVybiBfc3VwZXIuY2FsbCh0aGlzLCBzZWxlY3RvciwgbXV0YXRvciwgb3B0aW9ucywgd3JhcHBlZENhbGxiYWNrKVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IGFmZmVjdGVkID0gX3N1cGVyLmNhbGwodGhpcywgc2VsZWN0b3IsIG11dGF0b3IsIG9wdGlvbnMsIGNhbGxiYWNrKVxuICAgIGFmdGVyKGFmZmVjdGVkKVxuICAgIHJldHVybiBhZmZlY3RlZFxuICB9XG59KVxuIiwiaW1wb3J0IHsgRUpTT04gfSBmcm9tICdtZXRlb3IvZWpzb24nXG5pbXBvcnQgeyBDb2xsZWN0aW9uSG9va3MgfSBmcm9tICcuL2NvbGxlY3Rpb24taG9va3MnXG5cbmNvbnN0IGlzRW1wdHkgPSBhID0+ICFBcnJheS5pc0FycmF5KGEpIHx8ICFhLmxlbmd0aFxuXG5Db2xsZWN0aW9uSG9va3MuZGVmaW5lQWR2aWNlKCd1cHNlcnQnLCBmdW5jdGlvbiAodXNlcklkLCBfc3VwZXIsIGluc3RhbmNlLCBhc3BlY3RHcm91cCwgZ2V0VHJhbnNmb3JtLCBhcmdzLCBzdXBwcmVzc0FzcGVjdHMpIHtcbiAgYXJnc1swXSA9IENvbGxlY3Rpb25Ib29rcy5ub3JtYWxpemVTZWxlY3RvcihpbnN0YW5jZS5fZ2V0RmluZFNlbGVjdG9yKGFyZ3MpKVxuXG4gIGNvbnN0IGN0eCA9IHsgY29udGV4dDogdGhpcywgX3N1cGVyLCBhcmdzIH1cbiAgbGV0IFtzZWxlY3RvciwgbXV0YXRvciwgb3B0aW9ucywgY2FsbGJhY2tdID0gYXJnc1xuICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICBjYWxsYmFjayA9IG9wdGlvbnNcbiAgICBvcHRpb25zID0ge31cbiAgfVxuXG4gIGNvbnN0IGFzeW5jID0gdHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nXG4gIGxldCBkb2NzXG4gIGxldCBkb2NJZHNcbiAgbGV0IGFib3J0XG4gIGNvbnN0IHByZXYgPSB7fVxuXG4gIGlmICghc3VwcHJlc3NBc3BlY3RzKSB7XG4gICAgaWYgKCFpc0VtcHR5KGFzcGVjdEdyb3VwLnVwc2VydC5iZWZvcmUpIHx8ICFpc0VtcHR5KGFzcGVjdEdyb3VwLnVwZGF0ZS5hZnRlcikpIHtcbiAgICAgIGRvY3MgPSBDb2xsZWN0aW9uSG9va3MuZ2V0RG9jcy5jYWxsKHRoaXMsIGluc3RhbmNlLCBzZWxlY3Rvciwgb3B0aW9ucykuZmV0Y2goKVxuICAgICAgZG9jSWRzID0gZG9jcy5tYXAoZG9jID0+IGRvYy5faWQpXG4gICAgfVxuXG4gICAgLy8gY29weSBvcmlnaW5hbHMgZm9yIGNvbnZlbmllbmNlIGZvciB0aGUgJ2FmdGVyJyBwb2ludGN1dFxuICAgIGlmICghaXNFbXB0eShhc3BlY3RHcm91cC51cGRhdGUuYWZ0ZXIpKSB7XG4gICAgICBpZiAoYXNwZWN0R3JvdXAudXBkYXRlLmFmdGVyLnNvbWUobyA9PiBvLm9wdGlvbnMuZmV0Y2hQcmV2aW91cyAhPT0gZmFsc2UpICYmXG4gICAgICAgIENvbGxlY3Rpb25Ib29rcy5leHRlbmRPcHRpb25zKGluc3RhbmNlLmhvb2tPcHRpb25zLCB7fSwgJ2FmdGVyJywgJ3VwZGF0ZScpLmZldGNoUHJldmlvdXMgIT09IGZhbHNlKSB7XG4gICAgICAgIHByZXYubXV0YXRvciA9IEVKU09OLmNsb25lKG11dGF0b3IpXG4gICAgICAgIHByZXYub3B0aW9ucyA9IEVKU09OLmNsb25lKG9wdGlvbnMpXG5cbiAgICAgICAgcHJldi5kb2NzID0ge31cbiAgICAgICAgZG9jcy5mb3JFYWNoKChkb2MpID0+IHtcbiAgICAgICAgICBwcmV2LmRvY3NbZG9jLl9pZF0gPSBFSlNPTi5jbG9uZShkb2MpXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gYmVmb3JlXG4gICAgYXNwZWN0R3JvdXAudXBzZXJ0LmJlZm9yZS5mb3JFYWNoKChvKSA9PiB7XG4gICAgICBjb25zdCByID0gby5hc3BlY3QuY2FsbChjdHgsIHVzZXJJZCwgc2VsZWN0b3IsIG11dGF0b3IsIG9wdGlvbnMpXG4gICAgICBpZiAociA9PT0gZmFsc2UpIGFib3J0ID0gdHJ1ZVxuICAgIH0pXG5cbiAgICBpZiAoYWJvcnQpIHJldHVybiB7IG51bWJlckFmZmVjdGVkOiAwIH1cbiAgfVxuXG4gIGNvbnN0IGFmdGVyVXBkYXRlID0gKGFmZmVjdGVkLCBlcnIpID0+IHtcbiAgICBpZiAoIXN1cHByZXNzQXNwZWN0cyAmJiAhaXNFbXB0eShhc3BlY3RHcm91cC51cGRhdGUuYWZ0ZXIpKSB7XG4gICAgICBjb25zdCBmaWVsZHMgPSBDb2xsZWN0aW9uSG9va3MuZ2V0RmllbGRzKG11dGF0b3IpXG4gICAgICBjb25zdCBkb2NzID0gQ29sbGVjdGlvbkhvb2tzLmdldERvY3MuY2FsbCh0aGlzLCBpbnN0YW5jZSwgeyBfaWQ6IHsgJGluOiBkb2NJZHMgfSB9LCBvcHRpb25zKS5mZXRjaCgpXG5cbiAgICAgIGFzcGVjdEdyb3VwLnVwZGF0ZS5hZnRlci5mb3JFYWNoKChvKSA9PiB7XG4gICAgICAgIGRvY3MuZm9yRWFjaCgoZG9jKSA9PiB7XG4gICAgICAgICAgby5hc3BlY3QuY2FsbCh7XG4gICAgICAgICAgICB0cmFuc2Zvcm06IGdldFRyYW5zZm9ybShkb2MpLFxuICAgICAgICAgICAgcHJldmlvdXM6IHByZXYuZG9jcyAmJiBwcmV2LmRvY3NbZG9jLl9pZF0sXG4gICAgICAgICAgICBhZmZlY3RlZCxcbiAgICAgICAgICAgIGVycixcbiAgICAgICAgICAgIC4uLmN0eFxuICAgICAgICAgIH0sIHVzZXJJZCwgZG9jLCBmaWVsZHMsIHByZXYubXV0YXRvciwgcHJldi5vcHRpb25zKVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICBjb25zdCBhZnRlckluc2VydCA9IChfaWQsIGVycikgPT4ge1xuICAgIGlmICghc3VwcHJlc3NBc3BlY3RzICYmICFpc0VtcHR5KGFzcGVjdEdyb3VwLmluc2VydC5hZnRlcikpIHtcbiAgICAgIGNvbnN0IGRvYyA9IENvbGxlY3Rpb25Ib29rcy5nZXREb2NzLmNhbGwodGhpcywgaW5zdGFuY2UsIHsgX2lkIH0sIHNlbGVjdG9yLCB7fSkuZmV0Y2goKVswXSAvLyAzcmQgYXJndW1lbnQgcGFzc2VzIGVtcHR5IG9iamVjdCB3aGljaCBjYXVzZXMgbWFnaWMgbG9naWMgdG8gaW1wbHkgbGltaXQ6MVxuICAgICAgY29uc3QgbGN0eCA9IHsgdHJhbnNmb3JtOiBnZXRUcmFuc2Zvcm0oZG9jKSwgX2lkLCBlcnIsIC4uLmN0eCB9XG5cbiAgICAgIGFzcGVjdEdyb3VwLmluc2VydC5hZnRlci5mb3JFYWNoKChvKSA9PiB7XG4gICAgICAgIG8uYXNwZWN0LmNhbGwobGN0eCwgdXNlcklkLCBkb2MpXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIGlmIChhc3luYykge1xuICAgIGNvbnN0IHdyYXBwZWRDYWxsYmFjayA9IGZ1bmN0aW9uIChlcnIsIHJldCkge1xuICAgICAgaWYgKGVyciB8fCAocmV0ICYmIHJldC5pbnNlcnRlZElkKSkge1xuICAgICAgICAvLyBTZW5kIGFueSBlcnJvcnMgdG8gYWZ0ZXJJbnNlcnRcbiAgICAgICAgYWZ0ZXJJbnNlcnQocmV0Lmluc2VydGVkSWQsIGVycilcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFmdGVyVXBkYXRlKHJldCAmJiByZXQubnVtYmVyQWZmZWN0ZWQsIGVycikgLy8gTm90ZSB0aGF0IGVyciBjYW4gbmV2ZXIgcmVhY2ggaGVyZVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gQ29sbGVjdGlvbkhvb2tzLmhvb2tlZE9wKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmNhbGwodGhpcywgZXJyLCByZXQpXG4gICAgICB9KVxuICAgIH1cblxuICAgIHJldHVybiBDb2xsZWN0aW9uSG9va3MuZGlyZWN0T3AoKCkgPT4gX3N1cGVyLmNhbGwodGhpcywgc2VsZWN0b3IsIG11dGF0b3IsIG9wdGlvbnMsIHdyYXBwZWRDYWxsYmFjaykpXG4gIH0gZWxzZSB7XG4gICAgY29uc3QgcmV0ID0gQ29sbGVjdGlvbkhvb2tzLmRpcmVjdE9wKCgpID0+IF9zdXBlci5jYWxsKHRoaXMsIHNlbGVjdG9yLCBtdXRhdG9yLCBvcHRpb25zLCBjYWxsYmFjaykpXG5cbiAgICBpZiAocmV0ICYmIHJldC5pbnNlcnRlZElkKSB7XG4gICAgICBhZnRlckluc2VydChyZXQuaW5zZXJ0ZWRJZClcbiAgICB9IGVsc2Uge1xuICAgICAgYWZ0ZXJVcGRhdGUocmV0ICYmIHJldC5udW1iZXJBZmZlY3RlZClcbiAgICB9XG5cbiAgICByZXR1cm4gcmV0XG4gIH1cbn0pXG4iLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJ1xuaW1wb3J0IHsgTW9uZ28gfSBmcm9tICdtZXRlb3IvbW9uZ28nXG5pbXBvcnQgeyBDb2xsZWN0aW9uSG9va3MgfSBmcm9tICcuL2NvbGxlY3Rpb24taG9va3MnXG5cbmlmIChNZXRlb3IudXNlcnMpIHtcbiAgLy8gSWYgTWV0ZW9yLnVzZXJzIGhhcyBiZWVuIGluc3RhbnRpYXRlZCwgYXR0ZW1wdCB0byByZS1hc3NpZ24gaXRzIHByb3RvdHlwZTpcbiAgQ29sbGVjdGlvbkhvb2tzLnJlYXNzaWduUHJvdG90eXBlKE1ldGVvci51c2VycylcblxuICAvLyBOZXh0LCBnaXZlIGl0IHRoZSBob29rIGFzcGVjdHM6XG4gIENvbGxlY3Rpb25Ib29rcy5leHRlbmRDb2xsZWN0aW9uSW5zdGFuY2UoTWV0ZW9yLnVzZXJzLCBNb25nby5Db2xsZWN0aW9uKVxufVxuIl19
