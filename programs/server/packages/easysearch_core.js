(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var check = Package.check.check;
var Match = Package.check.Match;
var ECMAScript = Package.ecmascript.ECMAScript;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var _ = Package.underscore._;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var searchDefinition, searchString, EasySearch;

var require = meteorInstall({"node_modules":{"meteor":{"easysearch:core":{"lib":{"core":{"index.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/easysearch_core/lib/core/index.js                                                                       //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let Mongo;
module.link("meteor/mongo", {
  Mongo(v) {
    Mongo = v;
  }
}, 0);
let Engine;
module.link("./engine", {
  default(v) {
    Engine = v;
  }
}, 1);
/**
 * An Index represents the main entry point for searching with EasySearch. It relies on
 * the given engine to have the search functionality and defines the data that should be searchable.
 *
 * @type {Index}
 */
class Index {
  /**
   * Constructor
   *
   * @param {Object} config Configuration
   *
   * @constructor
   */
  constructor(config) {
    check(config, Object);
    check(config.fields, [String]);
    if (!config.ignoreCollectionCheck) check(config.collection, Mongo.Collection);
    if (!(config.engine instanceof Engine)) {
      throw new Meteor.Error('invalid-engine', 'engine needs to be instanceof Engine');
    }
    if (!config.name) config.name = (config.collection._name || '').toLowerCase();
    this.config = _.extend(Index.defaultConfiguration, config);
    this.defaultSearchOptions = _.defaults({}, this.config.defaultSearchOptions, {
      limit: 10,
      skip: 0,
      props: {}
    });

    // Engine specific code on index creation
    config.engine.onIndexCreate(this.config);
  }

  /**
   * Default configuration for an index.
   *
   * @returns {Object}
   */
  static get defaultConfiguration() {
    return {
      permission: () => true,
      defaultSearchOptions: {},
      countUpdateIntervalMs: 2000
    };
  }

  /**
   * Search the index.
   *
   * @param {Object|String} searchDefinition Search definition
   * @param {Object}        options          Options
   *
   * @returns {Cursor}
   */
  search(searchDefinition) {
    let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    this.config.engine.checkSearchParam(searchDefinition, this.config);
    check(options, {
      limit: Match.Optional(Number),
      skip: Match.Optional(Number),
      props: Match.Optional(Object),
      userId: Match.Optional(Match.OneOf(String, null))
    });
    options = {
      search: this._getSearchOptions(options),
      index: this.config
    };
    if (!this.config.permission(options.search)) {
      throw new Meteor.Error('not-allowed', "Not allowed to search this index!");
    }
    return this.config.engine.search(searchDefinition, options);
  }

  /**
   * Returns the search options based on the given options.
   *
   * @param {Object} options Options to use
   *
   * @returns {Object}
   */
  _getSearchOptions(options) {
    if (!Meteor.isServer) {
      delete options.userId;
    }
    if (typeof options.userId === "undefined" && Meteor.userId) {
      options.userId = Meteor.userId();
    }
    return _.defaults(options, this.defaultSearchOptions);
  }
}
module.exportDefault(Index);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"engine.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/easysearch_core/lib/core/engine.js                                                                      //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
/**
 * An Engine is the technology used for searching with EasySearch, with
 * customizable configuration to how it interacts with the data from the Index.
 *
 * @type {Engine}
 */
class Engine {
  /**
   * Constructor
   *
   * @param {Object} config configuration
   *
   * @constructor
   */
  constructor() {
    let config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    if (this.constructor === Engine) {
      throw new Error('Cannot initialize instance of Engine');
    }
    if (!_.isFunction(this.search)) {
      throw new Error('Engine needs to implement search method');
    }
    this.config = _.defaults({}, config, this.defaultConfiguration());
  }

  /**
   * Return default configuration.
   *
   * @returns {Object}
   */
  defaultConfiguration() {
    return {};
  }

  /**
   * Call a configuration method with the engine scope.
   *
   * @param {String} methodName Method name
   * @param {Object} args       Arguments for the method
   *
   * @returns {*}
   */
  callConfigMethod(methodName) {
    check(methodName, String);
    let func = this.config[methodName];
    if (func) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      return func.apply(this, args);
    }
  }

  /**
   * Check the given search parameter for validity
   *
   * @param search
   */
  checkSearchParam(search) {
    check(search, String);
  }

  /**
   *Code to run on index creation
   *
   * @param {Object} indexConfig Index configuraction
   */
  onIndexCreate(indexConfig) {
    if (!indexConfig.allowedFields) {
      indexConfig.allowedFields = indexConfig.fields;
    }
  }
}
module.exportDefault(Engine);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"reactive-engine.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/easysearch_core/lib/core/reactive-engine.js                                                             //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let SearchCollection;
module.link("./search-collection", {
  default(v) {
    SearchCollection = v;
  }
}, 0);
let Engine;
module.link("./engine", {
  default(v) {
    Engine = v;
  }
}, 1);
/**
 * A ReactiveEngine handles the reactive logic, such as subscribing
 * and publishing documents into a self contained collection.
 *
 * @type {ReactiveEngine}
 */
class ReactiveEngine extends Engine {
  /**
   * Constructor.
   *
   * @param {Object} config Configuration
   *
   * @constructor
   */
  constructor(config) {
    super(config);
    if (this === this.constructor) {
      throw new Error('Cannot initialize instance of ReactiveEngine');
    }
    if (!_.isFunction(this.getSearchCursor)) {
      throw new Error('Reactive engine needs to implement getSearchCursor method');
    }
  }

  /**
   * Return default configuration.
   *
   * @returns {Object}
   */
  defaultConfiguration() {
    return _.defaults({}, {
      transform: doc => doc,
      beforePublish: (event, doc) => doc
    }, super.defaultConfiguration());
  }

  /**
   * Code to run on index creation
   *
   * @param {Object} indexConfig Index configuration
   */
  onIndexCreate(indexConfig) {
    super.onIndexCreate(indexConfig);
    indexConfig.searchCollection = new SearchCollection(indexConfig, this);
    indexConfig.mongoCollection = indexConfig.searchCollection._collection;
  }

  /**
   * Transform the search definition.
   *
   * @param {String|Object} searchDefinition Search definition
   * @param {Object}        options          Search and index options
   *
   * @returns {Object}
   */
  transformSearchDefinition(searchDefinition, options) {
    if (_.isString(searchDefinition)) {
      let obj = {};
      _.each(options.index.fields, function (field) {
        obj[field] = searchDefinition;
      });
      searchDefinition = obj;
    }
    return searchDefinition;
  }

  /**
   * Check the given search parameter for validity
   *
   * @param search
   * @param indexOptions
   */
  checkSearchParam(search, indexOptions) {
    check(search, Match.OneOf(String, Object));
    if (_.isObject(search)) {
      _.each(search, function (val, field) {
        check(val, String);
        if (-1 === _.indexOf(indexOptions.allowedFields, field)) {
          throw new Meteor.Error("Not allowed to search over field \"".concat(field, "\""));
        }
      });
    }
  }

  /**
   * Reactively search on the collection.
   *
   * @param {Object} searchDefinition Search definition
   * @param {Object} options          Options
   *
   * @returns {Cursor}
   */
  search(searchDefinition, options) {
    if (Meteor.isClient) {
      return options.index.searchCollection.find(searchDefinition, options.search);
    } else {
      return this.getSearchCursor(this.transformSearchDefinition(searchDefinition, options), options);
    }
  }
}
module.exportDefault(ReactiveEngine);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"cursor.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/easysearch_core/lib/core/cursor.js                                                                      //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
/**
 * A Cursor represents a pointer to the search results. Since it's specific
 * to EasySearch it can also be used to check for valid return values.
 *
 * @type {Cursor}
 */
class Cursor {
  /**
   * Constructor
   *
   * @param {Mongo.Cursor} mongoCursor   Referenced mongo cursor
   * @param {Number}       count         Count of all documents found
   * @param {Boolean}      isReady       Cursor is ready
   * @param {Object}       publishHandle Publish handle to stop if on client
   *
   * @constructor
   *
   */
  constructor(mongoCursor, count) {
    let isReady = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    let publishHandle = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
    check(mongoCursor.fetch, Function);
    check(count, Number);
    check(isReady, Match.Optional(Boolean));
    check(publishHandle, Match.OneOf(null, Object));
    this._mongoCursor = mongoCursor;
    this._count = count;
    this._isReady = isReady;
    this._publishHandle = publishHandle;
  }

  /**
   * Fetch the search results.
   *
   * @returns {[Object]}
   */
  fetch() {
    return this._mongoCursor.fetch();
  }

  /**
   * Stop the subscription handle associated with the cursor.
   */
  stop() {
    if (this._publishHandle) {
      return this._publishHandle.stop();
    }
  }

  /**
   * Return count of all documents found
   *
   * @returns {Number}
   */
  count() {
    return this._count;
  }

  /**
   * Return if the cursor is ready.
   *
   * @returns {Boolean}
   */
  isReady() {
    return this._isReady;
  }

  /**
   * Return the raw mongo cursor.
   *
   * @returns {Mongo.Cursor}
   */
  get mongoCursor() {
    return this._mongoCursor;
  }

  /**
   * Return a fake empty cursor, without data.
   *
   * @returns {Object}
   */
  static get emptyCursor() {
    return {
      fetch: () => [],
      observe: () => {
        return {
          stop: () => null
        };
      },
      stop: () => {}
    };
  }
}
module.exportDefault(Cursor);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"search-collection.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/easysearch_core/lib/core/search-collection.js                                                           //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let Mongo;
module.link("meteor/mongo", {
  Mongo(v) {
    Mongo = v;
  }
}, 0);
let Cursor;
module.link("./cursor", {
  default(v) {
    Cursor = v;
  }
}, 1);
let ReactiveEngine;
module.link("./reactive-engine", {
  default(v) {
    ReactiveEngine = v;
  }
}, 2);
/**
 * A search collection represents a reactive collection on the client,
 * which is used by the ReactiveEngine for searching.
 *
 * @type {SearchCollection}
 */
class SearchCollection {
  /**
   * Constructor
   *
   * @param {Object}         indexConfiguration Index configuration
   * @param {ReactiveEngine} engine             Reactive Engine
   *
   * @constructor
   */
  constructor(indexConfiguration, engine) {
    check(indexConfiguration, Object);
    check(indexConfiguration.name, Match.OneOf(String, null));
    if (!(engine instanceof ReactiveEngine)) {
      throw new Meteor.Error('invalid-engine', 'engine needs to be instanceof ReactiveEngine');
    }
    this._indexConfiguration = indexConfiguration;
    this._name = "".concat(indexConfiguration.name, "/easySearch");
    this._engine = engine;
    if (Meteor.isClient) {
      this._collection = new Mongo.Collection(this._name);
    } else if (Meteor.isServer) {
      this._setUpPublication();
    }
  }

  /**
   * Get name
   *
   * @returns {String}
   */
  get name() {
    return this._name;
  }

  /**
   * Get engine
   *
   * @returns {ReactiveEngine}
   */
  get engine() {
    return this._engine;
  }

  /**
   * Find documents on the client.
   *
   * @param {Object} searchDefinition Search definition
   * @param {Object} options          Options
   *
   * @returns {Cursor}
   */
  find(searchDefinition, options) {
    if (!Meteor.isClient) {
      throw new Error('find can only be used on client');
    }
    let publishHandle = Meteor.subscribe(this.name, searchDefinition, options);
    let count = this._getCount(searchDefinition);
    let mongoCursor = this._getMongoCursor(searchDefinition, options);
    if (!_.isNumber(count)) {
      return new Cursor(mongoCursor, 0, false);
    }
    return new Cursor(mongoCursor, count, true, publishHandle);
  }

  /**
   * Get the count of the cursor.
   *
   * @params {Object} searchDefinition Search definition
   *
   * @returns {Cursor.count}
   *
   * @private
   */
  _getCount(searchDefinition) {
    let countDoc = this._collection.findOne('searchCount' + JSON.stringify(searchDefinition));
    if (countDoc) {
      return countDoc.count;
    }
  }

  /**
   * Get the mongo cursor on the client.
   *
   * @param {Object} searchDefinition Search definition
   * @param {Object} options          Search options
   *
   * @returns {Cursor}
   * @private
   */
  _getMongoCursor(searchDefinition, options) {
    const clientSort = this.engine.callConfigMethod('clientSort', searchDefinition, options);
    return this._collection.find({
      __searchDefinition: JSON.stringify(searchDefinition),
      __searchOptions: JSON.stringify(options.props)
    }, {
      transform: doc => {
        delete doc.__searchDefinition;
        delete doc.__searchOptions;
        delete doc.__sortPosition;
        doc = this.engine.config.transform(doc);
        return doc;
      },
      sort: clientSort ? clientSort : ['__sortPosition']
    });
  }

  /**
   * Return a unique document id for publication.
   *
   * @param {Document} doc
   *
   * @returns string
   */
  generateId(doc) {
    return doc._id + doc.__searchDefinition + doc.__searchOptions;
  }

  /**
   * Add custom fields to the given document
   *
   * @param {Document} doc
   * @param {Object}   data
   * @returns {*}
   */
  addCustomFields(doc, data) {
    _.forEach(data, function (val, key) {
      doc['__' + key] = val;
    });
    return doc;
  }

  /**
   * Set up publication.
   *
   * @private
   */
  _setUpPublication() {
    var collectionScope = this,
      collectionName = this.name;
    Meteor.publish(collectionName, function (searchDefinition, options) {
      check(searchDefinition, Match.OneOf(String, Object));
      check(options, Object);
      let definitionString = JSON.stringify(searchDefinition),
        optionsString = JSON.stringify(options.props);
      options.userId = this.userId;
      options.publicationScope = this;
      if (!collectionScope._indexConfiguration.permission(options)) {
        throw new Meteor.Error('not-allowed', "You're not allowed to search this index!");
      }
      collectionScope.engine.checkSearchParam(searchDefinition, collectionScope._indexConfiguration);
      let cursor = collectionScope.engine.search(searchDefinition, {
        search: options,
        index: collectionScope._indexConfiguration
      });
      const count = cursor.count();
      this.added(collectionName, 'searchCount' + definitionString, {
        count
      });
      let intervalID;
      if (collectionScope._indexConfiguration.countUpdateIntervalMs) {
        intervalID = Meteor.setInterval(() => this.changed(collectionName, 'searchCount' + definitionString, {
          count: cursor.mongoCursor.count && cursor.mongoCursor.count() || 0
        }), collectionScope._indexConfiguration.countUpdateIntervalMs);
      }
      this.onStop(function () {
        intervalID && Meteor.clearInterval(intervalID);
        resultsHandle && resultsHandle.stop();
      });
      let observedDocs = [];
      const updateDocWithCustomFields = (doc, sortPosition) => collectionScope.addCustomFields(doc, {
        originalId: doc._id,
        sortPosition,
        searchDefinition: definitionString,
        searchOptions: optionsString
      });
      let resultsHandle = cursor.mongoCursor.observe({
        addedAt: (doc, atIndex, before) => {
          doc = collectionScope.engine.config.beforePublish('addedAt', doc, atIndex, before);
          doc = updateDocWithCustomFields(doc, atIndex);
          this.added(collectionName, collectionScope.generateId(doc), doc);

          /*
           * Reorder all observed docs to keep valid sorting. Here we adjust the
           * sortPosition number field to give space for the newly added doc
           */
          if (observedDocs.map(d => d.__sortPosition).includes(atIndex)) {
            observedDocs = observedDocs.map((doc, docIndex) => {
              if (doc.__sortPosition >= atIndex) {
                doc = collectionScope.addCustomFields(doc, {
                  sortPosition: doc.__sortPosition + 1
                });

                // do not throw changed event on last doc as it will be removed from cursor
                if (docIndex < observedDocs.length) {
                  this.changed(collectionName, collectionScope.generateId(doc), doc);
                }
              }
              return doc;
            });
          }
          observedDocs = [...observedDocs, doc];
        },
        changedAt: (doc, oldDoc, atIndex) => {
          doc = collectionScope.engine.config.beforePublish('changedAt', doc, oldDoc, atIndex);
          doc = collectionScope.addCustomFields(doc, {
            searchDefinition: definitionString,
            searchOptions: optionsString,
            sortPosition: atIndex,
            originalId: doc._id
          });
          this.changed(collectionName, collectionScope.generateId(doc), doc);
        },
        movedTo: (doc, fromIndex, toIndex, before) => {
          doc = collectionScope.engine.config.beforePublish('movedTo', doc, fromIndex, toIndex, before);
          doc = updateDocWithCustomFields(doc, toIndex);
          let beforeDoc = collectionScope._indexConfiguration.collection.findOne(before);
          if (beforeDoc) {
            beforeDoc = collectionScope.addCustomFields(beforeDoc, {
              searchDefinition: definitionString,
              searchOptions: optionsString,
              sortPosition: fromIndex
            });
            this.changed(collectionName, collectionScope.generateId(beforeDoc), beforeDoc);
          }
          this.changed(collectionName, collectionScope.generateId(doc), doc);
        },
        removedAt: (doc, atIndex) => {
          doc = collectionScope.engine.config.beforePublish('removedAt', doc, atIndex);
          doc = collectionScope.addCustomFields(doc, {
            searchDefinition: definitionString,
            searchOptions: optionsString
          });
          this.removed(collectionName, collectionScope.generateId(doc));

          /*
           * Adjust sort position for all docs after the removed doc and
           * remove the doc from the observed docs array
           */
          observedDocs = observedDocs.map(doc => {
            if (doc.__sortPosition > atIndex) {
              doc.__sortPosition -= 1;
            }
            return doc;
          }).filter(d => collectionScope.generateId(d) !== collectionScope.generateId(doc));
        }
      });
      this.onStop(function () {
        resultsHandle.stop();
      });
      this.ready();
    });
  }
}
module.exportDefault(SearchCollection);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"engines":{"mongo-db.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/easysearch_core/lib/engines/mongo-db.js                                                                 //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let Cursor;
module.link("../core/cursor", {
  default(v) {
    Cursor = v;
  }
}, 0);
let ReactiveEngine;
module.link("../core/reactive-engine", {
  default(v) {
    ReactiveEngine = v;
  }
}, 1);
/**
 * The MongoDBEngine lets you search the index on the server side with MongoDB. Subscriptions and publications
 * are handled within the Engine.
 *
 * @type {MongoDBEngine}
 */
class MongoDBEngine extends ReactiveEngine {
  /**
   * Return default configuration.
   *
   * @returns {Object}
   */
  defaultConfiguration() {
    return _.defaults({}, MongoDBEngine.defaultMongoConfiguration(this), super.defaultConfiguration());
  }

  /**
   * Default mongo configuration, used in constructor and MinimongoEngine to get the configuration.
   *
   * @param {Object} engineScope Scope of the engine
   *
   * @returns {Object}
   */
  static defaultMongoConfiguration(engineScope) {
    return {
      aggregation: '$or',
      selector(searchObject, options, aggregation) {
        const selector = {};
        selector[aggregation] = [];
        _.each(searchObject, (searchString, field) => {
          const fieldSelector = engineScope.callConfigMethod('selectorPerField', field, searchString, options);
          if (fieldSelector) {
            selector[aggregation].push(fieldSelector);
          }
        });
        return selector;
      },
      selectorPerField(field, searchString) {
        const selector = {};
        searchString = searchString.replace(/(\W{1})/g, '\\$1');
        selector[field] = {
          '$regex': ".*".concat(searchString, ".*"),
          '$options': 'i'
        };
        return selector;
      },
      sort(searchObject, options) {
        return options.index.fields;
      }
    };
  }

  /**
   * Return the find options for the mongo find query.
   *
   * @param {String} searchDefinition Search definition
   * @param {Object} options          Search and index options
   */
  getFindOptions(searchDefinition, options) {
    return {
      skip: options.search.skip,
      limit: options.search.limit,
      disableOplog: this.config.disableOplog,
      pollingIntervalMs: this.config.pollingIntervalMs,
      pollingThrottleMs: this.config.pollingThrottleMs,
      sort: this.callConfigMethod('sort', searchDefinition, options),
      fields: this.callConfigMethod('fields', searchDefinition, options)
    };
  }

  /**
   * Return the reactive search cursor.
   *
   * @param {String} searchDefinition Search definition
   * @param {Object} options          Search and index options
   */
  getSearchCursor(searchDefinition, options) {
    const selector = this.callConfigMethod('selector', searchDefinition, options, this.config.aggregation),
      findOptions = this.getFindOptions(searchDefinition, options),
      collection = options.index.collection;
    check(options, Object);
    check(selector, Object);
    check(findOptions, Object);
    return new Cursor(collection.find(selector, findOptions), collection.find(selector).count());
  }
}
module.exportDefault(MongoDBEngine);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"minimongo.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/easysearch_core/lib/engines/minimongo.js                                                                //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let Engine;
module.link("../core/engine", {
  default(v) {
    Engine = v;
  }
}, 0);
let ReactiveEngine;
module.link("../core/reactive-engine", {
  default(v) {
    ReactiveEngine = v;
  }
}, 1);
let MongoDBEngine;
module.link("./mongo-db", {
  default(v) {
    MongoDBEngine = v;
  }
}, 2);
/**
 * The MinimongEngine lets you search the index on the client-side.
 *
 * @type {MinimongoEngine}
 */
class MinimongoEngine extends Engine {
  /**
   * Return default configuration.
   *
   * @returns {Object}
   */
  defaultConfiguration() {
    return _.defaults({}, MongoDBEngine.defaultMongoConfiguration(this), super.defaultConfiguration());
  }

  /**
   * Search the index.
   *
   * @param {Object} searchDefinition Search definition
   * @param {Object} options          Object of options
   *
   * @returns {cursor}
   */
  search(searchDefinition, options) {
    if (!Meteor.isClient) {
      throw new Meteor.Error('only-client', 'Minimongo can only be used on the client');
    }
    searchDefinition = this.transformSearchDefinition(searchDefinition, options);

    // check() calls are in getSearchCursor method
    return MongoDBEngine.prototype.getSearchCursor.apply(this, [searchDefinition, options]);
  }
}
MinimongoEngine.prototype.checkSearchParam = ReactiveEngine.prototype.checkSearchParam;
MinimongoEngine.prototype.transformSearchDefinition = ReactiveEngine.prototype.transformSearchDefinition;
MinimongoEngine.prototype.getFindOptions = function () {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }
  let findOptions = MongoDBEngine.prototype.getFindOptions.apply(this, args);
  findOptions.transform = this.config.transform;
  return findOptions;
};
module.exportDefault(MinimongoEngine);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"mongo-text-index.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/easysearch_core/lib/engines/mongo-text-index.js                                                         //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let ReactiveEngine;
module.link("../core/reactive-engine", {
  default(v) {
    ReactiveEngine = v;
  }
}, 0);
let MongoDBEngine;
module.link("./mongo-db", {
  default(v) {
    MongoDBEngine = v;
  }
}, 1);
/**
 * The MongoTextIndexEngine lets you search the index with Mongo text indexes.
 *
 * @type {MongoTextIndexEngine}
 */
class MongoTextIndexEngine extends ReactiveEngine {
  /**
   * Return default configuration.
   *
   * @returns {Object}
   */
  defaultConfiguration() {
    let mongoConfiguration = MongoDBEngine.defaultMongoConfiguration(this);
    mongoConfiguration.selector = function (searchString) {
      if (searchString.trim()) {
        return {
          $text: {
            $search: searchString
          }
        };
      }
      return {};
    };
    return _.defaults({}, mongoConfiguration, super.defaultConfiguration());
  }

  /**
   * Setup the index on creation.
   *
   * @param {Object} indexConfig Index configuration
   */
  onIndexCreate(indexConfig) {
    super.onIndexCreate(indexConfig);
    if (Meteor.isServer) {
      let textIndexesConfig = {};
      _.each(indexConfig.fields, function (field) {
        textIndexesConfig[field] = 'text';
      });
      if (indexConfig.weights) {
        textIndexesConfig.weights = options.weights();
      }
      indexConfig.collection._ensureIndex(textIndexesConfig);
    }
  }

  /**
   * Transform the search definition.
   *
   * @param {String|Object} searchDefinition Search definition
   * @param {Object}        options          Search and index options
   *
   * @returns {Object}
   */
  transformSearchDefinition(searchDefinition, options) {
    return searchDefinition;
  }

  /**
   * Check the given search parameter for validity
   *
   * @param search
   */
  checkSearchParam(search) {
    check(search, String);
  }
}

// Explicitely inherit getSearchCursor method functionality
MongoTextIndexEngine.prototype.getSearchCursor = MongoDBEngine.prototype.getSearchCursor;
MongoTextIndexEngine.prototype.getFindOptions = MongoDBEngine.prototype.getFindOptions;
module.exportDefault(MongoTextIndexEngine);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"globals.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/easysearch_core/lib/globals.js                                                                          //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let Index, Engine, ReactiveEngine, Cursor, MongoDBEngine, MinimongoEngine, MongoTextIndexEngine;
module.link("./main", {
  Index(v) {
    Index = v;
  },
  Engine(v) {
    Engine = v;
  },
  ReactiveEngine(v) {
    ReactiveEngine = v;
  },
  Cursor(v) {
    Cursor = v;
  },
  MongoDBEngine(v) {
    MongoDBEngine = v;
  },
  MinimongoEngine(v) {
    MinimongoEngine = v;
  },
  MongoTextIndexEngine(v) {
    MongoTextIndexEngine = v;
  }
}, 0);
EasySearch = {
  // Core
  Index,
  Engine,
  ReactiveEngine,
  Cursor,
  // Engines
  MongoDB: MongoDBEngine,
  Minimongo: MinimongoEngine,
  MongoTextIndex: MongoTextIndexEngine
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"main.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/easysearch_core/lib/main.js                                                                             //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.export({
  Index: () => Index,
  Engine: () => Engine,
  ReactiveEngine: () => ReactiveEngine,
  Cursor: () => Cursor,
  MongoDBEngine: () => MongoDBEngine,
  MinimongoEngine: () => MinimongoEngine,
  MongoTextIndexEngine: () => MongoTextIndexEngine
});
let Index;
module.link("./core/index", {
  default(v) {
    Index = v;
  }
}, 0);
let Engine;
module.link("./core/engine", {
  default(v) {
    Engine = v;
  }
}, 1);
let ReactiveEngine;
module.link("./core/reactive-engine", {
  default(v) {
    ReactiveEngine = v;
  }
}, 2);
let Cursor;
module.link("./core/cursor", {
  default(v) {
    Cursor = v;
  }
}, 3);
let MongoDBEngine;
module.link("./engines/mongo-db", {
  default(v) {
    MongoDBEngine = v;
  }
}, 4);
let MinimongoEngine;
module.link("./engines/minimongo", {
  default(v) {
    MinimongoEngine = v;
  }
}, 5);
let MongoTextIndexEngine;
module.link("./engines/mongo-text-index", {
  default(v) {
    MongoTextIndexEngine = v;
  }
}, 6);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/easysearch:core/lib/core/index.js");
require("/node_modules/meteor/easysearch:core/lib/core/engine.js");
require("/node_modules/meteor/easysearch:core/lib/core/reactive-engine.js");
require("/node_modules/meteor/easysearch:core/lib/core/cursor.js");
require("/node_modules/meteor/easysearch:core/lib/core/search-collection.js");
require("/node_modules/meteor/easysearch:core/lib/engines/mongo-db.js");
require("/node_modules/meteor/easysearch:core/lib/engines/minimongo.js");
require("/node_modules/meteor/easysearch:core/lib/engines/mongo-text-index.js");
require("/node_modules/meteor/easysearch:core/lib/globals.js");
var exports = require("/node_modules/meteor/easysearch:core/lib/main.js");

/* Exports */
Package._define("easysearch:core", exports, {
  EasySearch: EasySearch
});

})();

//# sourceURL=meteor://💻app/packages/easysearch_core.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvZWFzeXNlYXJjaDpjb3JlL2xpYi9jb3JlL2luZGV4LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9lYXN5c2VhcmNoOmNvcmUvbGliL2NvcmUvZW5naW5lLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9lYXN5c2VhcmNoOmNvcmUvbGliL2NvcmUvcmVhY3RpdmUtZW5naW5lLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9lYXN5c2VhcmNoOmNvcmUvbGliL2NvcmUvY3Vyc29yLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9lYXN5c2VhcmNoOmNvcmUvbGliL2NvcmUvc2VhcmNoLWNvbGxlY3Rpb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2Vhc3lzZWFyY2g6Y29yZS9saWIvZW5naW5lcy9tb25nby1kYi5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvZWFzeXNlYXJjaDpjb3JlL2xpYi9lbmdpbmVzL21pbmltb25nby5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvZWFzeXNlYXJjaDpjb3JlL2xpYi9lbmdpbmVzL21vbmdvLXRleHQtaW5kZXguanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2Vhc3lzZWFyY2g6Y29yZS9saWIvZ2xvYmFscy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvZWFzeXNlYXJjaDpjb3JlL2xpYi9tYWluLmpzIl0sIm5hbWVzIjpbIk1vbmdvIiwibW9kdWxlIiwibGluayIsInYiLCJFbmdpbmUiLCJkZWZhdWx0IiwiSW5kZXgiLCJjb25zdHJ1Y3RvciIsImNvbmZpZyIsImNoZWNrIiwiT2JqZWN0IiwiZmllbGRzIiwiU3RyaW5nIiwiaWdub3JlQ29sbGVjdGlvbkNoZWNrIiwiY29sbGVjdGlvbiIsIkNvbGxlY3Rpb24iLCJlbmdpbmUiLCJNZXRlb3IiLCJFcnJvciIsIm5hbWUiLCJfbmFtZSIsInRvTG93ZXJDYXNlIiwiXyIsImV4dGVuZCIsImRlZmF1bHRDb25maWd1cmF0aW9uIiwiZGVmYXVsdFNlYXJjaE9wdGlvbnMiLCJkZWZhdWx0cyIsImxpbWl0Iiwic2tpcCIsInByb3BzIiwib25JbmRleENyZWF0ZSIsInBlcm1pc3Npb24iLCJjb3VudFVwZGF0ZUludGVydmFsTXMiLCJzZWFyY2giLCJzZWFyY2hEZWZpbml0aW9uIiwib3B0aW9ucyIsImFyZ3VtZW50cyIsImxlbmd0aCIsInVuZGVmaW5lZCIsImNoZWNrU2VhcmNoUGFyYW0iLCJNYXRjaCIsIk9wdGlvbmFsIiwiTnVtYmVyIiwidXNlcklkIiwiT25lT2YiLCJfZ2V0U2VhcmNoT3B0aW9ucyIsImluZGV4IiwiaXNTZXJ2ZXIiLCJleHBvcnREZWZhdWx0IiwiaXNGdW5jdGlvbiIsImNhbGxDb25maWdNZXRob2QiLCJtZXRob2ROYW1lIiwiZnVuYyIsIl9sZW4iLCJhcmdzIiwiQXJyYXkiLCJfa2V5IiwiYXBwbHkiLCJpbmRleENvbmZpZyIsImFsbG93ZWRGaWVsZHMiLCJTZWFyY2hDb2xsZWN0aW9uIiwiUmVhY3RpdmVFbmdpbmUiLCJnZXRTZWFyY2hDdXJzb3IiLCJ0cmFuc2Zvcm0iLCJkb2MiLCJiZWZvcmVQdWJsaXNoIiwiZXZlbnQiLCJzZWFyY2hDb2xsZWN0aW9uIiwibW9uZ29Db2xsZWN0aW9uIiwiX2NvbGxlY3Rpb24iLCJ0cmFuc2Zvcm1TZWFyY2hEZWZpbml0aW9uIiwiaXNTdHJpbmciLCJvYmoiLCJlYWNoIiwiZmllbGQiLCJpbmRleE9wdGlvbnMiLCJpc09iamVjdCIsInZhbCIsImluZGV4T2YiLCJjb25jYXQiLCJpc0NsaWVudCIsImZpbmQiLCJDdXJzb3IiLCJtb25nb0N1cnNvciIsImNvdW50IiwiaXNSZWFkeSIsInB1Ymxpc2hIYW5kbGUiLCJmZXRjaCIsIkZ1bmN0aW9uIiwiQm9vbGVhbiIsIl9tb25nb0N1cnNvciIsIl9jb3VudCIsIl9pc1JlYWR5IiwiX3B1Ymxpc2hIYW5kbGUiLCJzdG9wIiwiZW1wdHlDdXJzb3IiLCJvYnNlcnZlIiwiaW5kZXhDb25maWd1cmF0aW9uIiwiX2luZGV4Q29uZmlndXJhdGlvbiIsIl9lbmdpbmUiLCJfc2V0VXBQdWJsaWNhdGlvbiIsInN1YnNjcmliZSIsIl9nZXRDb3VudCIsIl9nZXRNb25nb0N1cnNvciIsImlzTnVtYmVyIiwiY291bnREb2MiLCJmaW5kT25lIiwiSlNPTiIsInN0cmluZ2lmeSIsImNsaWVudFNvcnQiLCJfX3NlYXJjaERlZmluaXRpb24iLCJfX3NlYXJjaE9wdGlvbnMiLCJfX3NvcnRQb3NpdGlvbiIsInNvcnQiLCJnZW5lcmF0ZUlkIiwiX2lkIiwiYWRkQ3VzdG9tRmllbGRzIiwiZGF0YSIsImZvckVhY2giLCJrZXkiLCJjb2xsZWN0aW9uU2NvcGUiLCJjb2xsZWN0aW9uTmFtZSIsInB1Ymxpc2giLCJkZWZpbml0aW9uU3RyaW5nIiwib3B0aW9uc1N0cmluZyIsInB1YmxpY2F0aW9uU2NvcGUiLCJjdXJzb3IiLCJhZGRlZCIsImludGVydmFsSUQiLCJzZXRJbnRlcnZhbCIsImNoYW5nZWQiLCJvblN0b3AiLCJjbGVhckludGVydmFsIiwicmVzdWx0c0hhbmRsZSIsIm9ic2VydmVkRG9jcyIsInVwZGF0ZURvY1dpdGhDdXN0b21GaWVsZHMiLCJzb3J0UG9zaXRpb24iLCJvcmlnaW5hbElkIiwic2VhcmNoT3B0aW9ucyIsImFkZGVkQXQiLCJhdEluZGV4IiwiYmVmb3JlIiwibWFwIiwiZCIsImluY2x1ZGVzIiwiZG9jSW5kZXgiLCJjaGFuZ2VkQXQiLCJvbGREb2MiLCJtb3ZlZFRvIiwiZnJvbUluZGV4IiwidG9JbmRleCIsImJlZm9yZURvYyIsInJlbW92ZWRBdCIsInJlbW92ZWQiLCJmaWx0ZXIiLCJyZWFkeSIsIk1vbmdvREJFbmdpbmUiLCJkZWZhdWx0TW9uZ29Db25maWd1cmF0aW9uIiwiZW5naW5lU2NvcGUiLCJhZ2dyZWdhdGlvbiIsInNlbGVjdG9yIiwic2VhcmNoT2JqZWN0Iiwic2VhcmNoU3RyaW5nIiwiZmllbGRTZWxlY3RvciIsInB1c2giLCJzZWxlY3RvclBlckZpZWxkIiwicmVwbGFjZSIsImdldEZpbmRPcHRpb25zIiwiZGlzYWJsZU9wbG9nIiwicG9sbGluZ0ludGVydmFsTXMiLCJwb2xsaW5nVGhyb3R0bGVNcyIsImZpbmRPcHRpb25zIiwiTWluaW1vbmdvRW5naW5lIiwicHJvdG90eXBlIiwiTW9uZ29UZXh0SW5kZXhFbmdpbmUiLCJtb25nb0NvbmZpZ3VyYXRpb24iLCJ0cmltIiwiJHRleHQiLCIkc2VhcmNoIiwidGV4dEluZGV4ZXNDb25maWciLCJ3ZWlnaHRzIiwiX2Vuc3VyZUluZGV4IiwiRWFzeVNlYXJjaCIsIk1vbmdvREIiLCJNaW5pbW9uZ28iLCJNb25nb1RleHRJbmRleCIsImV4cG9ydCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxLQUFLO0FBQUNDLE1BQU0sQ0FBQ0MsSUFBSSxDQUFDLGNBQWMsRUFBQztFQUFDRixLQUFLQSxDQUFDRyxDQUFDLEVBQUM7SUFBQ0gsS0FBSyxHQUFDRyxDQUFDO0VBQUE7QUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0FBQUMsSUFBSUMsTUFBTTtBQUFDSCxNQUFNLENBQUNDLElBQUksQ0FBQyxVQUFVLEVBQUM7RUFBQ0csT0FBT0EsQ0FBQ0YsQ0FBQyxFQUFDO0lBQUNDLE1BQU0sR0FBQ0QsQ0FBQztFQUFBO0FBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztBQUd2SDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNRyxLQUFLLENBQUM7RUFDVjtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFQyxXQUFXQSxDQUFDQyxNQUFNLEVBQUU7SUFDbEJDLEtBQUssQ0FBQ0QsTUFBTSxFQUFFRSxNQUFNLENBQUM7SUFDckJELEtBQUssQ0FBQ0QsTUFBTSxDQUFDRyxNQUFNLEVBQUUsQ0FBQ0MsTUFBTSxDQUFDLENBQUM7SUFDOUIsSUFBRyxDQUFDSixNQUFNLENBQUNLLHFCQUFxQixFQUFFSixLQUFLLENBQUNELE1BQU0sQ0FBQ00s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QUFhLEdBQUN6SixDQUFDO0VBQUE7QUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0FBQUMsSUFBSXlLLGVBQWU7QUFBQzNLLE1BQU0sQ0FBQ0MsSUFBSSxDQUFDLHFCQUFxQixFQUFDO0VBQUNHLE9BQU9BLENBQUNGLENBQUMsRUFBQztJQUFDeUssZUFBZSxHQUFDekssQ0FBQztFQUFBO0FBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztBQUFDLElBQUkySyxvQkFBb0I7QUFBQzdLLE1BQU0sQ0FBQ0MsSUFBSSxDQUFDLDRCQUE0QixFQUFDO0VBQUNHLE9BQU9BLENBQUNGLENBQUMsRUFBQztJQUFDMkssb0JBQW9CLEdBQUMzSyxDQUFDO0VBQUE7QUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLEMiLCJmaWxlIjoiL3BhY2thZ2VzL2Vhc3lzZWFyY2hfY29yZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1vbmdvIH0gZnJvbSAnbWV0ZW9yL21vbmdvJ1xuaW1wb3J0IEVuZ2luZSBmcm9tICcuL2VuZ2luZSdcblxuLyoqXG4gKiBBbiBJbmRleCByZXByZXNlbnRzIHRoZSBtYWluIGVudHJ5IHBvaW50IGZvciBzZWFyY2hpbmcgd2l0aCBFYXN5U2VhcmNoLiBJdCByZWxpZXMgb25cbiAqIHRoZSBnaXZlbiBlbmdpbmUgdG8gaGF2ZSB0aGUgc2VhcmNoIGZ1bmN0aW9uYWxpdHkgYW5kIGRlZmluZXMgdGhlIGRhdGEgdGhhdCBzaG91bGQgYmUgc2VhcmNoYWJsZS5cbiAqXG4gKiBAdHlwZSB7SW5kZXh9XG4gKi9cbmNsYXNzIEluZGV4IHtcbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjb25maWcgQ29uZmlndXJhdGlvblxuICAgKlxuICAgKiBAY29uc3RydWN0b3JcbiAgICovXG4gIGNvbnN0cnVjdG9yKGNvbmZpZykge1xuICAgIGNoZWNrKGNvbmZpZywgT2JqZWN0KTtcbiAgICBjaGVjayhjb25maWcuZmllbGRzLCBbU3RyaW5nXSk7XG4gICAgaWYoIWNvbmZpZy5pZ25vcmVDb2xsZWN0aW9uQ2hlY2spIGNoZWNrKGNvbmZpZy5jb2xsZWN0aW9uLCBNb25nby5Db2xsZWN0aW9uKTtcblxuICAgIGlmICghKGNvbmZpZy5lbmdpbmUgaW5zdGFuY2VvZiBFbmdpbmUpKSB7XG4gICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLWVuZ2luZScsICdlbmdpbmUgbmVlZHMgdG8gYmUgaW5zdGFuY2VvZiBFbmdpbmUnKTtcbiAgICB9XG5cbiAgICBpZiAoIWNvbmZpZy5uYW1lKVxuICAgICAgY29uZmlnLm5hbWUgPSAoY29uZmlnLmNvbGxlY3Rpb24uX25hbWUgfHwgJycpLnRvTG93ZXJDYXNlKCk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IF8uZXh0ZW5kKEluZGV4LmRlZmF1bHRDb25maWd1cmF0aW9uLCBjb25maWcpO1xuICAgIHRoaXMuZGVmYXVsdFNlYXJjaE9wdGlvbnMgPSBfLmRlZmF1bHRzKFxuICAgICAge30sXG4gICAgICB0aGlzLmNvbmZpZy5kZWZhdWx0U2VhcmNoT3B0aW9ucyxcbiAgICAgIHsgbGltaXQ6IDEwLCBza2lwOiAwLCBwcm9wczoge30gfSxcbiAgICApO1xuXG4gICAgLy8gRW5naW5lIHNwZWNpZmljIGNvZGUgb24gaW5kZXggY3JlYXRpb25cbiAgICBjb25maWcuZW5naW5lLm9uSW5kZXhDcmVhdGUodGhpcy5jb25maWcpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlZmF1bHQgY29uZmlndXJhdGlvbiBmb3IgYW4gaW5kZXguXG4gICAqXG4gICAqIEByZXR1cm5zIHtPYmplY3R9XG4gICAqL1xuICBzdGF0aWMgZ2V0IGRlZmF1bHRDb25maWd1cmF0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICBwZXJtaXNzaW9uOiAoKSA9PiB0cnVlLFxuICAgICAgZGVmYXVsdFNlYXJjaE9wdGlvbnM6IHt9LFxuICAgICAgY291bnRVcGRhdGVJbnRlcnZhbE1zOiAyMDAwLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogU2VhcmNoIHRoZSBpbmRleC5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R8U3RyaW5nfSBzZWFyY2hEZWZpbml0aW9uIFNlYXJjaCBkZWZpbml0aW9uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICAgb3B0aW9ucyAgICAgICAgICBPcHRpb25zXG4gICAqXG4gICAqIEByZXR1cm5zIHtDdXJzb3J9XG4gICAqL1xuICBzZWFyY2goc2VhcmNoRGVmaW5pdGlvbiwgb3B0aW9ucyA9IHt9KSB7XG4gICAgdGhpcy5jb25maWcuZW5naW5lLmNoZWNrU2VhcmNoUGFyYW0oc2VhcmNoRGVmaW5pdGlvbiwgdGhpcy5jb25maWcpO1xuXG4gICAgY2hlY2sob3B0aW9ucywge1xuICAgICAgbGltaXQ6IE1hdGNoLk9wdGlvbmFsKE51bWJlciksXG4gICAgICBza2lwOiBNYXRjaC5PcHRpb25hbChOdW1iZXIpLFxuICAgICAgcHJvcHM6IE1hdGNoLk9wdGlvbmFsKE9iamVjdCksXG4gICAgICB1c2VySWQ6IE1hdGNoLk9wdGlvbmFsKE1hdGNoLk9uZU9mKFN0cmluZywgbnVsbCkpLFxuICAgIH0pO1xuXG4gICAgb3B0aW9ucyA9IHtcbiAgICAgIHNlYXJjaDogdGhpcy5fZ2V0U2VhcmNoT3B0aW9ucyhvcHRpb25zKSxcbiAgICAgIGluZGV4OiB0aGlzLmNvbmZpZyxcbiAgICB9O1xuXG4gICAgaWYgKCF0aGlzLmNvbmZpZy5wZXJtaXNzaW9uKG9wdGlvbnMuc2VhcmNoKSkge1xuICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignbm90LWFsbG93ZWQnLCBcIk5vdCBhbGxvd2VkIHRvIHNlYXJjaCB0aGlzIGluZGV4IVwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5jb25maWcuZW5naW5lLnNlYXJjaChzZWFyY2hEZWZpbml0aW9uLCBvcHRpb25zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBzZWFyY2ggb3B0aW9ucyBiYXNlZCBvbiB0aGUgZ2l2ZW4gb3B0aW9ucy5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgT3B0aW9ucyB0byB1c2VcbiAgICpcbiAgICogQHJldHVybnMge09iamVjdH1cbiAgICovXG4gIF9nZXRTZWFyY2hPcHRpb25zKG9wdGlvbnMpIHtcbiAgICBpZiAoIU1ldGVvci5pc1NlcnZlcikge1xuICAgICAgZGVsZXRlIG9wdGlvbnMudXNlcklkO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb3B0aW9ucy51c2VySWQgPT09IFwidW5kZWZpbmVkXCIgJiYgTWV0ZW9yLnVzZXJJZCkge1xuICAgICAgb3B0aW9ucy51c2VySWQgPSBNZXRlb3IudXNlcklkKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIF8uZGVmYXVsdHMob3B0aW9ucywgdGhpcy5kZWZhdWx0U2VhcmNoT3B0aW9ucyk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgSW5kZXg7XG4iLCIvKipcbiAqIEFuIEVuZ2luZSBpcyB0aGUgdGVjaG5vbG9neSB1c2VkIGZvciBzZWFyY2hpbmcgd2l0aCBFYXN5U2VhcmNoLCB3aXRoXG4gKiBjdXN0b21pemFibGUgY29uZmlndXJhdGlvbiB0byBob3cgaXQgaW50ZXJhY3RzIHdpdGggdGhlIGRhdGEgZnJvbSB0aGUgSW5kZXguXG4gKlxuICogQHR5cGUge0VuZ2luZX1cbiAqL1xuY2xhc3MgRW5naW5lIHtcbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjb25maWcgY29uZmlndXJhdGlvblxuICAgKlxuICAgKiBAY29uc3RydWN0b3JcbiAgICovXG4gIGNvbnN0cnVjdG9yKGNvbmZpZyA9IHt9KSB7XG4gICAgaWYgKHRoaXMuY29uc3RydWN0b3IgPT09IEVuZ2luZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgaW5pdGlhbGl6ZSBpbnN0YW5jZSBvZiBFbmdpbmUnKTtcbiAgICB9XG5cbiAgICBpZiAoIV8uaXNGdW5jdGlvbih0aGlzLnNlYXJjaCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRW5naW5lIG5lZWRzIHRvIGltcGxlbWVudCBzZWFyY2ggbWV0aG9kJyk7XG4gICAgfVxuXG4gICAgdGhpcy5jb25maWcgPSBfLmRlZmF1bHRzKHt9LCBjb25maWcsIHRoaXMuZGVmYXVsdENvbmZpZ3VyYXRpb24oKSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIGRlZmF1bHQgY29uZmlndXJhdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMge09iamVjdH1cbiAgICovXG4gIGRlZmF1bHRDb25maWd1cmF0aW9uKCkge1xuICAgIHJldHVybiB7fTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxsIGEgY29uZmlndXJhdGlvbiBtZXRob2Qgd2l0aCB0aGUgZW5naW5lIHNjb3BlLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbWV0aG9kTmFtZSBNZXRob2QgbmFtZVxuICAgKiBAcGFyYW0ge09iamVjdH0gYXJncyAgICAgICBBcmd1bWVudHMgZm9yIHRoZSBtZXRob2RcbiAgICpcbiAgICogQHJldHVybnMgeyp9XG4gICAqL1xuICBjYWxsQ29uZmlnTWV0aG9kKG1ldGhvZE5hbWUsIC4uLmFyZ3MpIHtcbiAgICBjaGVjayhtZXRob2ROYW1lLCBTdHJpbmcpO1xuXG4gICAgbGV0IGZ1bmMgPSB0aGlzLmNvbmZpZ1ttZXRob2ROYW1lXTtcblxuICAgIGlmIChmdW5jKSB7XG4gICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgdGhlIGdpdmVuIHNlYXJjaCBwYXJhbWV0ZXIgZm9yIHZhbGlkaXR5XG4gICAqXG4gICAqIEBwYXJhbSBzZWFyY2hcbiAgICovXG4gIGNoZWNrU2VhcmNoUGFyYW0oc2VhcmNoKSB7XG4gICAgY2hlY2soc2VhcmNoLCBTdHJpbmcpO1xuICB9XG5cbiAgLyoqXG4gICAqQ29kZSB0byBydW4gb24gaW5kZXggY3JlYXRpb25cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IGluZGV4Q29uZmlnIEluZGV4IGNvbmZpZ3VyYWN0aW9uXG4gICAqL1xuICBvbkluZGV4Q3JlYXRlKGluZGV4Q29uZmlnKSB7XG4gICAgaWYgKCFpbmRleENvbmZpZy5hbGxvd2VkRmllbGRzKSB7XG4gICAgICBpbmRleENvbmZpZy5hbGxvd2VkRmllbGRzID0gaW5kZXhDb25maWcuZmllbGRzO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBFbmdpbmU7XG4iLCJpbXBvcnQgU2VhcmNoQ29sbGVjdGlvbiBmcm9tICcuL3NlYXJjaC1jb2xsZWN0aW9uJ1xuaW1wb3J0IEVuZ2luZSBmcm9tICcuL2VuZ2luZSdcblxuLyoqXG4gKiBBIFJlYWN0aXZlRW5naW5lIGhhbmRsZXMgdGhlIHJlYWN0aXZlIGxvZ2ljLCBzdWNoIGFzIHN1YnNjcmliaW5nXG4gKiBhbmQgcHVibGlzaGluZyBkb2N1bWVudHMgaW50byBhIHNlbGYgY29udGFpbmVkIGNvbGxlY3Rpb24uXG4gKlxuICogQHR5cGUge1JlYWN0aXZlRW5naW5lfVxuICovXG5jbGFzcyBSZWFjdGl2ZUVuZ2luZSBleHRlbmRzIEVuZ2luZSB7XG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IGNvbmZpZyBDb25maWd1cmF0aW9uXG4gICAqXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKi9cbiAgY29uc3RydWN0b3IoY29uZmlnKSB7XG4gICAgc3VwZXIoY29uZmlnKTtcblxuICAgIGlmICh0aGlzID09PSB0aGlzLmNvbnN0cnVjdG9yKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBpbml0aWFsaXplIGluc3RhbmNlIG9mIFJlYWN0aXZlRW5naW5lJyk7XG4gICAgfVxuXG4gICAgaWYgKCFfLmlzRnVuY3Rpb24odGhpcy5nZXRTZWFyY2hDdXJzb3IpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlYWN0aXZlIGVuZ2luZSBuZWVkcyB0byBpbXBsZW1lbnQgZ2V0U2VhcmNoQ3Vyc29yIG1ldGhvZCcpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gZGVmYXVsdCBjb25maWd1cmF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyB7T2JqZWN0fVxuICAgKi9cbiAgZGVmYXVsdENvbmZpZ3VyYXRpb24oKSB7XG4gICAgcmV0dXJuIF8uZGVmYXVsdHMoe30sIHtcbiAgICAgIHRyYW5zZm9ybTogKGRvYykgPT4gZG9jLFxuICAgICAgYmVmb3JlUHVibGlzaDogKGV2ZW50LCBkb2MpID0+IGRvY1xuICAgIH0sIHN1cGVyLmRlZmF1bHRDb25maWd1cmF0aW9uKCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvZGUgdG8gcnVuIG9uIGluZGV4IGNyZWF0aW9uXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBpbmRleENvbmZpZyBJbmRleCBjb25maWd1cmF0aW9uXG4gICAqL1xuICBvbkluZGV4Q3JlYXRlKGluZGV4Q29uZmlnKSB7XG4gICAgc3VwZXIub25JbmRleENyZWF0ZShpbmRleENvbmZpZyk7XG4gICAgaW5kZXhDb25maWcuc2VhcmNoQ29sbGVjdGlvbiA9IG5ldyBTZWFyY2hDb2xsZWN0aW9uKGluZGV4Q29uZmlnLCB0aGlzKTtcbiAgICBpbmRleENvbmZpZy5tb25nb0NvbGxlY3Rpb24gPSBpbmRleENvbmZpZy5zZWFyY2hDb2xsZWN0aW9uLl9jb2xsZWN0aW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIFRyYW5zZm9ybSB0aGUgc2VhcmNoIGRlZmluaXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdH0gc2VhcmNoRGVmaW5pdGlvbiBTZWFyY2ggZGVmaW5pdGlvblxuICAgKiBAcGFyYW0ge09iamVjdH0gICAgICAgIG9wdGlvbnMgICAgICAgICAgU2VhcmNoIGFuZCBpbmRleCBvcHRpb25zXG4gICAqXG4gICAqIEByZXR1cm5zIHtPYmplY3R9XG4gICAqL1xuICB0cmFuc2Zvcm1TZWFyY2hEZWZpbml0aW9uKHNlYXJjaERlZmluaXRpb24sIG9wdGlvbnMpIHtcbiAgICBpZiAoXy5pc1N0cmluZyhzZWFyY2hEZWZpbml0aW9uKSkge1xuICAgICAgbGV0IG9iaiA9IHt9O1xuXG4gICAgICBfLmVhY2gob3B0aW9ucy5pbmRleC5maWVsZHMsIGZ1bmN0aW9uIChmaWVsZCkge1xuICAgICAgICBvYmpbZmllbGRdID0gc2VhcmNoRGVmaW5pdGlvbjtcbiAgICAgIH0pO1xuXG4gICAgICBzZWFyY2hEZWZpbml0aW9uID0gb2JqO1xuICAgIH1cblxuICAgIHJldHVybiBzZWFyY2hEZWZpbml0aW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIHRoZSBnaXZlbiBzZWFyY2ggcGFyYW1ldGVyIGZvciB2YWxpZGl0eVxuICAgKlxuICAgKiBAcGFyYW0gc2VhcmNoXG4gICAqIEBwYXJhbSBpbmRleE9wdGlvbnNcbiAgICovXG4gIGNoZWNrU2VhcmNoUGFyYW0oc2VhcmNoLCBpbmRleE9wdGlvbnMpIHtcbiAgICBjaGVjayhzZWFyY2gsIE1hdGNoLk9uZU9mKFN0cmluZywgT2JqZWN0KSk7XG5cbiAgICBpZiAoXy5pc09iamVjdChzZWFyY2gpKSB7XG4gICAgICBfLmVhY2goc2VhcmNoLCBmdW5jdGlvbiAodmFsLCBmaWVsZCkge1xuICAgICAgICBjaGVjayh2YWwsIFN0cmluZyk7XG5cbiAgICAgICAgaWYgKC0xID09PSBfLmluZGV4T2YoaW5kZXhPcHRpb25zLmFsbG93ZWRGaWVsZHMsIGZpZWxkKSkge1xuICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoYE5vdCBhbGxvd2VkIHRvIHNlYXJjaCBvdmVyIGZpZWxkIFwiJHtmaWVsZH1cImApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVhY3RpdmVseSBzZWFyY2ggb24gdGhlIGNvbGxlY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBzZWFyY2hEZWZpbml0aW9uIFNlYXJjaCBkZWZpbml0aW9uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zICAgICAgICAgIE9wdGlvbnNcbiAgICpcbiAgICogQHJldHVybnMge0N1cnNvcn1cbiAgICovXG4gIHNlYXJjaChzZWFyY2hEZWZpbml0aW9uLCBvcHRpb25zKSB7XG4gICAgaWYgKE1ldGVvci5pc0NsaWVudCkge1xuICAgICAgcmV0dXJuIG9wdGlvbnMuaW5kZXguc2VhcmNoQ29sbGVjdGlvbi5maW5kKHNlYXJjaERlZmluaXRpb24sIG9wdGlvbnMuc2VhcmNoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0U2VhcmNoQ3Vyc29yKFxuICAgICAgICB0aGlzLnRyYW5zZm9ybVNlYXJjaERlZmluaXRpb24oc2VhcmNoRGVmaW5pdGlvbiwgb3B0aW9ucyksXG4gICAgICAgIG9wdGlvbnNcbiAgICAgICk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFJlYWN0aXZlRW5naW5lO1xuIiwiLyoqXG4gKiBBIEN1cnNvciByZXByZXNlbnRzIGEgcG9pbnRlciB0byB0aGUgc2VhcmNoIHJlc3VsdHMuIFNpbmNlIGl0J3Mgc3BlY2lmaWNcbiAqIHRvIEVhc3lTZWFyY2ggaXQgY2FuIGFsc28gYmUgdXNlZCB0byBjaGVjayBmb3IgdmFsaWQgcmV0dXJuIHZhbHVlcy5cbiAqXG4gKiBAdHlwZSB7Q3Vyc29yfVxuICovXG5jbGFzcyBDdXJzb3Ige1xuICAvKipcbiAgICogQ29uc3RydWN0b3JcbiAgICpcbiAgICogQHBhcmFtIHtNb25nby5DdXJzb3J9IG1vbmdvQ3Vyc29yICAgUmVmZXJlbmNlZCBtb25nbyBjdXJzb3JcbiAgICogQHBhcmFtIHtOdW1iZXJ9ICAgICAgIGNvdW50ICAgICAgICAgQ291bnQgb2YgYWxsIGRvY3VtZW50cyBmb3VuZFxuICAgKiBAcGFyYW0ge0Jvb2xlYW59ICAgICAgaXNSZWFkeSAgICAgICBDdXJzb3IgaXMgcmVhZHlcbiAgICogQHBhcmFtIHtPYmplY3R9ICAgICAgIHB1Ymxpc2hIYW5kbGUgUHVibGlzaCBoYW5kbGUgdG8gc3RvcCBpZiBvbiBjbGllbnRcbiAgICpcbiAgICogQGNvbnN0cnVjdG9yXG4gICAqXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihtb25nb0N1cnNvciwgY291bnQsIGlzUmVhZHkgPSB0cnVlLCBwdWJsaXNoSGFuZGxlID0gbnVsbCkge1xuICAgIGNoZWNrKG1vbmdvQ3Vyc29yLmZldGNoLCBGdW5jdGlvbik7XG4gICAgY2hlY2soY291bnQsIE51bWJlcik7XG4gICAgY2hlY2soaXNSZWFkeSwgTWF0Y2guT3B0aW9uYWwoQm9vbGVhbikpO1xuICAgIGNoZWNrKHB1Ymxpc2hIYW5kbGUsIE1hdGNoLk9uZU9mKG51bGwsIE9iamVjdCkpO1xuXG4gICAgdGhpcy5fbW9uZ29DdXJzb3IgPSBtb25nb0N1cnNvcjtcbiAgICB0aGlzLl9jb3VudCA9IGNvdW50O1xuICAgIHRoaXMuX2lzUmVhZHkgPSBpc1JlYWR5O1xuICAgIHRoaXMuX3B1Ymxpc2hIYW5kbGUgPSBwdWJsaXNoSGFuZGxlO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIHRoZSBzZWFyY2ggcmVzdWx0cy5cbiAgICpcbiAgICogQHJldHVybnMge1tPYmplY3RdfVxuICAgKi9cbiAgZmV0Y2goKSB7XG4gICAgcmV0dXJuIHRoaXMuX21vbmdvQ3Vyc29yLmZldGNoKCk7XG4gIH1cblxuIC8qKlxuICAqIFN0b3AgdGhlIHN1YnNjcmlwdGlvbiBoYW5kbGUgYXNzb2NpYXRlZCB3aXRoIHRoZSBjdXJzb3IuXG4gICovXG4gIHN0b3AoKSB7XG4gICAgaWYgKHRoaXMuX3B1Ymxpc2hIYW5kbGUpIHtcbiAgICAgIHJldHVybiB0aGlzLl9wdWJsaXNoSGFuZGxlLnN0b3AoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIGNvdW50IG9mIGFsbCBkb2N1bWVudHMgZm91bmRcbiAgICpcbiAgICogQHJldHVybnMge051bWJlcn1cbiAgICovXG4gIGNvdW50KCkge1xuICAgIHJldHVybiB0aGlzLl9jb3VudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gaWYgdGhlIGN1cnNvciBpcyByZWFkeS5cbiAgICpcbiAgICogQHJldHVybnMge0Jvb2xlYW59XG4gICAqL1xuICBpc1JlYWR5KCkge1xuICAgIHJldHVybiB0aGlzLl9pc1JlYWR5O1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiB0aGUgcmF3IG1vbmdvIGN1cnNvci5cbiAgICpcbiAgICogQHJldHVybnMge01vbmdvLkN1cnNvcn1cbiAgICovXG4gIGdldCBtb25nb0N1cnNvcigpIHtcbiAgICByZXR1cm4gdGhpcy5fbW9uZ29DdXJzb3I7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIGEgZmFrZSBlbXB0eSBjdXJzb3IsIHdpdGhvdXQgZGF0YS5cbiAgICpcbiAgICogQHJldHVybnMge09iamVjdH1cbiAgICovXG4gIHN0YXRpYyBnZXQgZW1wdHlDdXJzb3IoKSB7XG4gICAgcmV0dXJuIHsgZmV0Y2g6ICgpID0+IFtdLCBvYnNlcnZlOiAoKSA9PiB7IHJldHVybiB7IHN0b3A6ICgpID0+IG51bGwgfTsgfSwgc3RvcDogKCkgPT4ge30gfTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBDdXJzb3I7XG4iLCJpbXBvcnQgeyBNb25nbyB9IGZyb20gJ21ldGVvci9tb25nbydcbmltcG9ydCBDdXJzb3IgZnJvbSAnLi9jdXJzb3InXG5pbXBvcnQgUmVhY3RpdmVFbmdpbmUgZnJvbSAnLi9yZWFjdGl2ZS1lbmdpbmUnXG5cbi8qKlxuICogQSBzZWFyY2ggY29sbGVjdGlvbiByZXByZXNlbnRzIGEgcmVhY3RpdmUgY29sbGVjdGlvbiBvbiB0aGUgY2xpZW50LFxuICogd2hpY2ggaXMgdXNlZCBieSB0aGUgUmVhY3RpdmVFbmdpbmUgZm9yIHNlYXJjaGluZy5cbiAqXG4gKiBAdHlwZSB7U2VhcmNoQ29sbGVjdGlvbn1cbiAqL1xuY2xhc3MgU2VhcmNoQ29sbGVjdGlvbiB7XG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RvclxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gICAgICAgICBpbmRleENvbmZpZ3VyYXRpb24gSW5kZXggY29uZmlndXJhdGlvblxuICAgKiBAcGFyYW0ge1JlYWN0aXZlRW5naW5lfSBlbmdpbmUgICAgICAgICAgICAgUmVhY3RpdmUgRW5naW5lXG4gICAqXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKi9cbiAgY29uc3RydWN0b3IoaW5kZXhDb25maWd1cmF0aW9uLCBlbmdpbmUpIHtcbiAgICBjaGVjayhpbmRleENvbmZpZ3VyYXRpb24sIE9iamVjdCk7XG4gICAgY2hlY2soaW5kZXhDb25maWd1cmF0aW9uLm5hbWUsIE1hdGNoLk9uZU9mKFN0cmluZywgbnVsbCkpO1xuXG4gICAgaWYgKCEoZW5naW5lIGluc3RhbmNlb2YgUmVhY3RpdmVFbmdpbmUpKSB7XG4gICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLWVuZ2luZScsICdlbmdpbmUgbmVlZHMgdG8gYmUgaW5zdGFuY2VvZiBSZWFjdGl2ZUVuZ2luZScpO1xuICAgIH1cblxuICAgIHRoaXMuX2luZGV4Q29uZmlndXJhdGlvbiA9IGluZGV4Q29uZmlndXJhdGlvbjtcbiAgICB0aGlzLl9uYW1lID0gYCR7aW5kZXhDb25maWd1cmF0aW9uLm5hbWV9L2Vhc3lTZWFyY2hgO1xuICAgIHRoaXMuX2VuZ2luZSA9IGVuZ2luZTtcblxuICAgIGlmIChNZXRlb3IuaXNDbGllbnQpIHtcbiAgICAgIHRoaXMuX2NvbGxlY3Rpb24gPSBuZXcgTW9uZ28uQ29sbGVjdGlvbih0aGlzLl9uYW1lKTtcbiAgICB9IGVsc2UgaWYgKE1ldGVvci5pc1NlcnZlcikge1xuICAgICAgdGhpcy5fc2V0VXBQdWJsaWNhdGlvbigpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgbmFtZVxuICAgKlxuICAgKiBAcmV0dXJucyB7U3RyaW5nfVxuICAgKi9cbiAgZ2V0IG5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX25hbWU7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGVuZ2luZVxuICAgKlxuICAgKiBAcmV0dXJucyB7UmVhY3RpdmVFbmdpbmV9XG4gICAqL1xuICBnZXQgZW5naW5lKCkge1xuICAgIHJldHVybiB0aGlzLl9lbmdpbmU7XG4gIH1cblxuICAvKipcbiAgICogRmluZCBkb2N1bWVudHMgb24gdGhlIGNsaWVudC5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IHNlYXJjaERlZmluaXRpb24gU2VhcmNoIGRlZmluaXRpb25cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgICAgICAgICAgT3B0aW9uc1xuICAgKlxuICAgKiBAcmV0dXJucyB7Q3Vyc29yfVxuICAgKi9cbiAgZmluZChzZWFyY2hEZWZpbml0aW9uLCBvcHRpb25zKSB7XG4gICAgaWYgKCFNZXRlb3IuaXNDbGllbnQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignZmluZCBjYW4gb25seSBiZSB1c2VkIG9uIGNsaWVudCcpO1xuICAgIH1cblxuICAgIGxldCBwdWJsaXNoSGFuZGxlID0gTWV0ZW9yLnN1YnNjcmliZSh0aGlzLm5hbWUsIHNlYXJjaERlZmluaXRpb24sIG9wdGlvbnMpO1xuXG4gICAgbGV0IGNvdW50ID0gdGhpcy5fZ2V0Q291bnQoc2VhcmNoRGVmaW5pdGlvbik7XG4gICAgbGV0IG1vbmdvQ3Vyc29yID0gdGhpcy5fZ2V0TW9uZ29DdXJzb3Ioc2VhcmNoRGVmaW5pdGlvbiwgb3B0aW9ucyk7XG5cbiAgICBpZiAoIV8uaXNOdW1iZXIoY291bnQpKSB7XG4gICAgICByZXR1cm4gbmV3IEN1cnNvcihtb25nb0N1cnNvciwgMCwgZmFsc2UpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgQ3Vyc29yKG1vbmdvQ3Vyc29yLCBjb3VudCwgdHJ1ZSwgcHVibGlzaEhhbmRsZSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBjb3VudCBvZiB0aGUgY3Vyc29yLlxuICAgKlxuICAgKiBAcGFyYW1zIHtPYmplY3R9IHNlYXJjaERlZmluaXRpb24gU2VhcmNoIGRlZmluaXRpb25cbiAgICpcbiAgICogQHJldHVybnMge0N1cnNvci5jb3VudH1cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9nZXRDb3VudChzZWFyY2hEZWZpbml0aW9uKSB7XG4gICAgbGV0IGNvdW50RG9jID0gdGhpcy5fY29sbGVjdGlvbi5maW5kT25lKCdzZWFyY2hDb3VudCcgKyBKU09OLnN0cmluZ2lmeShzZWFyY2hEZWZpbml0aW9uKSk7XG5cbiAgICBpZiAoY291bnREb2MpIHtcbiAgICAgIHJldHVybiBjb3VudERvYy5jb3VudDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBtb25nbyBjdXJzb3Igb24gdGhlIGNsaWVudC5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IHNlYXJjaERlZmluaXRpb24gU2VhcmNoIGRlZmluaXRpb25cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgICAgICAgICAgU2VhcmNoIG9wdGlvbnNcbiAgICpcbiAgICogQHJldHVybnMge0N1cnNvcn1cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9nZXRNb25nb0N1cnNvcihzZWFyY2hEZWZpbml0aW9uLCBvcHRpb25zKSB7XG4gICAgY29uc3QgY2xpZW50U29ydCA9IHRoaXMuZW5naW5lLmNhbGxDb25maWdNZXRob2QoJ2NsaWVudFNvcnQnLCBzZWFyY2hEZWZpbml0aW9uLCBvcHRpb25zKTtcblxuICAgIHJldHVybiB0aGlzLl9jb2xsZWN0aW9uLmZpbmQoXG4gICAgICB7IF9fc2VhcmNoRGVmaW5pdGlvbjogSlNPTi5zdHJpbmdpZnkoc2VhcmNoRGVmaW5pdGlvbiksIF9fc2VhcmNoT3B0aW9uczogSlNPTi5zdHJpbmdpZnkob3B0aW9ucy5wcm9wcykgfSxcbiAgICAgIHtcbiAgICAgICAgdHJhbnNmb3JtOiAoZG9jKSA9PiB7XG4gICAgICAgICAgZGVsZXRlIGRvYy5fX3NlYXJjaERlZmluaXRpb247XG4gICAgICAgICAgZGVsZXRlIGRvYy5fX3NlYXJjaE9wdGlvbnM7XG4gICAgICAgICAgZGVsZXRlIGRvYy5fX3NvcnRQb3NpdGlvbjtcblxuICAgICAgICAgIGRvYyA9IHRoaXMuZW5naW5lLmNvbmZpZy50cmFuc2Zvcm0oZG9jKTtcblxuICAgICAgICAgIHJldHVybiBkb2M7XG4gICAgICAgIH0sXG4gICAgICAgIHNvcnQ6IChjbGllbnRTb3J0ID8gY2xpZW50U29ydCA6IFsnX19zb3J0UG9zaXRpb24nXSlcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiBhIHVuaXF1ZSBkb2N1bWVudCBpZCBmb3IgcHVibGljYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7RG9jdW1lbnR9IGRvY1xuICAgKlxuICAgKiBAcmV0dXJucyBzdHJpbmdcbiAgICovXG4gIGdlbmVyYXRlSWQoZG9jKSB7XG4gICAgcmV0dXJuIGRvYy5faWQgKyBkb2MuX19zZWFyY2hEZWZpbml0aW9uICsgZG9jLl9fc2VhcmNoT3B0aW9ucztcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgY3VzdG9tIGZpZWxkcyB0byB0aGUgZ2l2ZW4gZG9jdW1lbnRcbiAgICpcbiAgICogQHBhcmFtIHtEb2N1bWVudH0gZG9jXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgIGRhdGFcbiAgICogQHJldHVybnMgeyp9XG4gICAqL1xuICBhZGRDdXN0b21GaWVsZHMoZG9jLCBkYXRhKSB7XG4gICAgXy5mb3JFYWNoKGRhdGEsIGZ1bmN0aW9uICh2YWwsIGtleSkge1xuICAgICAgZG9jWydfXycgKyBrZXldID0gdmFsO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGRvYztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdXAgcHVibGljYXRpb24uXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfc2V0VXBQdWJsaWNhdGlvbigpIHtcbiAgICB2YXIgY29sbGVjdGlvblNjb3BlID0gdGhpcyxcbiAgICAgIGNvbGxlY3Rpb25OYW1lID0gdGhpcy5uYW1lO1xuXG4gICAgTWV0ZW9yLnB1Ymxpc2goY29sbGVjdGlvbk5hbWUsIGZ1bmN0aW9uIChzZWFyY2hEZWZpbml0aW9uLCBvcHRpb25zKSB7XG4gICAgICBjaGVjayhzZWFyY2hEZWZpbml0aW9uLCBNYXRjaC5PbmVPZihTdHJpbmcsIE9iamVjdCkpO1xuICAgICAgY2hlY2sob3B0aW9ucywgT2JqZWN0KTtcblxuICAgICAgbGV0IGRlZmluaXRpb25TdHJpbmcgPSBKU09OLnN0cmluZ2lmeShzZWFyY2hEZWZpbml0aW9uKSxcbiAgICAgICAgb3B0aW9uc1N0cmluZyA9IEpTT04uc3RyaW5naWZ5KG9wdGlvbnMucHJvcHMpO1xuXG4gICAgICBvcHRpb25zLnVzZXJJZCA9IHRoaXMudXNlcklkO1xuICAgICAgb3B0aW9ucy5wdWJsaWNhdGlvblNjb3BlID0gdGhpcztcblxuICAgICAgaWYgKCFjb2xsZWN0aW9uU2NvcGUuX2luZGV4Q29uZmlndXJhdGlvbi5wZXJtaXNzaW9uKG9wdGlvbnMpKSB7XG4gICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ25vdC1hbGxvd2VkJywgXCJZb3UncmUgbm90IGFsbG93ZWQgdG8gc2VhcmNoIHRoaXMgaW5kZXghXCIpO1xuICAgICAgfVxuXG4gICAgICBjb2xsZWN0aW9uU2NvcGUuZW5naW5lLmNoZWNrU2VhcmNoUGFyYW0oc2VhcmNoRGVmaW5pdGlvbiwgY29sbGVjdGlvblNjb3BlLl9pbmRleENvbmZpZ3VyYXRpb24pO1xuXG4gICAgICBsZXQgY3Vyc29yID0gY29sbGVjdGlvblNjb3BlLmVuZ2luZS5zZWFyY2goc2VhcmNoRGVmaW5pdGlvbiwge1xuICAgICAgICBzZWFyY2g6IG9wdGlvbnMsXG4gICAgICAgIGluZGV4OiBjb2xsZWN0aW9uU2NvcGUuX2luZGV4Q29uZmlndXJhdGlvblxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGNvdW50ID0gY3Vyc29yLmNvdW50KCk7XG5cbiAgICAgIHRoaXMuYWRkZWQoY29sbGVjdGlvbk5hbWUsICdzZWFyY2hDb3VudCcgKyBkZWZpbml0aW9uU3RyaW5nLCB7IGNvdW50IH0pO1xuXG4gICAgICBsZXQgaW50ZXJ2YWxJRDtcblxuICAgICAgaWYgKGNvbGxlY3Rpb25TY29wZS5faW5kZXhDb25maWd1cmF0aW9uLmNvdW50VXBkYXRlSW50ZXJ2YWxNcykge1xuICAgICAgICBpbnRlcnZhbElEID0gTWV0ZW9yLnNldEludGVydmFsKFxuICAgICAgICAgICgpID0+IHRoaXMuY2hhbmdlZChcbiAgICAgICAgICAgIGNvbGxlY3Rpb25OYW1lLFxuICAgICAgICAgICAgJ3NlYXJjaENvdW50JyArIGRlZmluaXRpb25TdHJpbmcsXG4gICAgICAgICAgICB7IGNvdW50OiBjdXJzb3IubW9uZ29DdXJzb3IuY291bnQgJiYgY3Vyc29yLm1vbmdvQ3Vyc29yLmNvdW50KCkgfHwgMCB9XG4gICAgICAgICAgKSxcbiAgICAgICAgICBjb2xsZWN0aW9uU2NvcGUuX2luZGV4Q29uZmlndXJhdGlvbi5jb3VudFVwZGF0ZUludGVydmFsTXNcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5vblN0b3AoZnVuY3Rpb24gKCkge1xuICAgICAgICBpbnRlcnZhbElEICYmIE1ldGVvci5jbGVhckludGVydmFsKGludGVydmFsSUQpO1xuICAgICAgICByZXN1bHRzSGFuZGxlICYmIHJlc3VsdHNIYW5kbGUuc3RvcCgpO1xuICAgICAgfSk7XG5cbiAgICAgIGxldCBvYnNlcnZlZERvY3MgPSBbXTtcblxuICAgICAgY29uc3QgdXBkYXRlRG9jV2l0aEN1c3RvbUZpZWxkcyA9IChkb2MsIHNvcnRQb3NpdGlvbikgPT4gY29sbGVjdGlvblNjb3BlXG4gICAgICAgIC5hZGRDdXN0b21GaWVsZHMoZG9jLCB7XG4gICAgICAgICAgb3JpZ2luYWxJZDogZG9jLl9pZCxcbiAgICAgICAgICBzb3J0UG9zaXRpb24sXG4gICAgICAgICAgc2VhcmNoRGVmaW5pdGlvbjogZGVmaW5pdGlvblN0cmluZyxcbiAgICAgICAgICBzZWFyY2hPcHRpb25zOiBvcHRpb25zU3RyaW5nLFxuICAgICAgICB9KTtcblxuICAgICAgbGV0IHJlc3VsdHNIYW5kbGUgPSBjdXJzb3IubW9uZ29DdXJzb3Iub2JzZXJ2ZSh7XG4gICAgICAgIGFkZGVkQXQ6IChkb2MsIGF0SW5kZXgsIGJlZm9yZSkgPT4ge1xuICAgICAgICAgIGRvYyA9IGNvbGxlY3Rpb25TY29wZS5lbmdpbmUuY29uZmlnLmJlZm9yZVB1Ymxpc2goJ2FkZGVkQXQnLCBkb2MsIGF0SW5kZXgsIGJlZm9yZSk7XG4gICAgICAgICAgZG9jID0gdXBkYXRlRG9jV2l0aEN1c3RvbUZpZWxkcyhkb2MsIGF0SW5kZXgpO1xuXG4gICAgICAgICAgdGhpcy5hZGRlZChjb2xsZWN0aW9uTmFtZSwgY29sbGVjdGlvblNjb3BlLmdlbmVyYXRlSWQoZG9jKSwgZG9jKTtcblxuICAgICAgICAgIC8qXG4gICAgICAgICAgICogUmVvcmRlciBhbGwgb2JzZXJ2ZWQgZG9jcyB0byBrZWVwIHZhbGlkIHNvcnRpbmcuIEhlcmUgd2UgYWRqdXN0IHRoZVxuICAgICAgICAgICAqIHNvcnRQb3NpdGlvbiBudW1iZXIgZmllbGQgdG8gZ2l2ZSBzcGFjZSBmb3IgdGhlIG5ld2x5IGFkZGVkIGRvY1xuICAgICAgICAgICAqL1xuICAgICAgICAgIGlmIChvYnNlcnZlZERvY3MubWFwKGQgPT4gZC5fX3NvcnRQb3NpdGlvbikuaW5jbHVkZXMoYXRJbmRleCkpIHtcbiAgICAgICAgICAgIG9ic2VydmVkRG9jcyA9IG9ic2VydmVkRG9jcy5tYXAoKGRvYywgZG9jSW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGRvYy5fX3NvcnRQb3NpdGlvbiA+PSBhdEluZGV4KSB7XG4gICAgICAgICAgICAgICAgZG9jID0gY29sbGVjdGlvblNjb3BlLmFkZEN1c3RvbUZpZWxkcyhkb2MsIHtcbiAgICAgICAgICAgICAgICAgIHNvcnRQb3NpdGlvbjogZG9jLl9fc29ydFBvc2l0aW9uICsgMSxcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIGRvIG5vdCB0aHJvdyBjaGFuZ2VkIGV2ZW50IG9uIGxhc3QgZG9jIGFzIGl0IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIGN1cnNvclxuICAgICAgICAgICAgICAgIGlmIChkb2NJbmRleCA8IG9ic2VydmVkRG9jcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlZChcbiAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbk5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb25TY29wZS5nZW5lcmF0ZUlkKGRvYyksXG4gICAgICAgICAgICAgICAgICAgIGRvY1xuICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICByZXR1cm4gZG9jO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgb2JzZXJ2ZWREb2NzID0gWy4uLm9ic2VydmVkRG9jcyAsIGRvY107XG4gICAgICAgIH0sXG4gICAgICAgIGNoYW5nZWRBdDogKGRvYywgb2xkRG9jLCBhdEluZGV4KSA9PiB7XG4gICAgICAgICAgZG9jID0gY29sbGVjdGlvblNjb3BlLmVuZ2luZS5jb25maWcuYmVmb3JlUHVibGlzaCgnY2hhbmdlZEF0JywgZG9jLCBvbGREb2MsIGF0SW5kZXgpO1xuICAgICAgICAgIGRvYyA9IGNvbGxlY3Rpb25TY29wZS5hZGRDdXN0b21GaWVsZHMoZG9jLCB7XG4gICAgICAgICAgICBzZWFyY2hEZWZpbml0aW9uOiBkZWZpbml0aW9uU3RyaW5nLFxuICAgICAgICAgICAgc2VhcmNoT3B0aW9uczogb3B0aW9uc1N0cmluZyxcbiAgICAgICAgICAgIHNvcnRQb3NpdGlvbjogYXRJbmRleCxcbiAgICAgICAgICAgIG9yaWdpbmFsSWQ6IGRvYy5faWRcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHRoaXMuY2hhbmdlZChjb2xsZWN0aW9uTmFtZSwgY29sbGVjdGlvblNjb3BlLmdlbmVyYXRlSWQoZG9jKSwgZG9jKTtcbiAgICAgICAgfSxcbiAgICAgICAgbW92ZWRUbzogKGRvYywgZnJvbUluZGV4LCB0b0luZGV4LCBiZWZvcmUpID0+IHtcbiAgICAgICAgICBkb2MgPSBjb2xsZWN0aW9uU2NvcGUuZW5naW5lLmNvbmZpZy5iZWZvcmVQdWJsaXNoKCdtb3ZlZFRvJywgZG9jLCBmcm9tSW5kZXgsIHRvSW5kZXgsIGJlZm9yZSk7XG4gICAgICAgICAgZG9jID0gdXBkYXRlRG9jV2l0aEN1c3RvbUZpZWxkcyhkb2MsIHRvSW5kZXgpO1xuXG4gICAgICAgICAgbGV0IGJlZm9yZURvYyA9IGNvbGxlY3Rpb25TY29wZS5faW5kZXhDb25maWd1cmF0aW9uLmNvbGxlY3Rpb24uZmluZE9uZShiZWZvcmUpO1xuXG4gICAgICAgICAgaWYgKGJlZm9yZURvYykge1xuICAgICAgICAgICAgYmVmb3JlRG9jID0gY29sbGVjdGlvblNjb3BlLmFkZEN1c3RvbUZpZWxkcyhiZWZvcmVEb2MsIHtcbiAgICAgICAgICAgICAgc2VhcmNoRGVmaW5pdGlvbjogZGVmaW5pdGlvblN0cmluZyxcbiAgICAgICAgICAgICAgc2VhcmNoT3B0aW9uczogb3B0aW9uc1N0cmluZyxcbiAgICAgICAgICAgICAgc29ydFBvc2l0aW9uOiBmcm9tSW5kZXhcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5jaGFuZ2VkKGNvbGxlY3Rpb25OYW1lLCBjb2xsZWN0aW9uU2NvcGUuZ2VuZXJhdGVJZChiZWZvcmVEb2MpLCBiZWZvcmVEb2MpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuY2hhbmdlZChjb2xsZWN0aW9uTmFtZSwgY29sbGVjdGlvblNjb3BlLmdlbmVyYXRlSWQoZG9jKSwgZG9jKTtcbiAgICAgICAgfSxcbiAgICAgICAgcmVtb3ZlZEF0OiAoZG9jLCBhdEluZGV4KSA9PiB7XG4gICAgICAgICAgZG9jID0gY29sbGVjdGlvblNjb3BlLmVuZ2luZS5jb25maWcuYmVmb3JlUHVibGlzaCgncmVtb3ZlZEF0JywgZG9jLCBhdEluZGV4KTtcbiAgICAgICAgICBkb2MgPSBjb2xsZWN0aW9uU2NvcGUuYWRkQ3VzdG9tRmllbGRzKFxuICAgICAgICAgICAgZG9jLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzZWFyY2hEZWZpbml0aW9uOiBkZWZpbml0aW9uU3RyaW5nLFxuICAgICAgICAgICAgICBzZWFyY2hPcHRpb25zOiBvcHRpb25zU3RyaW5nXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB0aGlzLnJlbW92ZWQoY29sbGVjdGlvbk5hbWUsIGNvbGxlY3Rpb25TY29wZS5nZW5lcmF0ZUlkKGRvYykpO1xuXG4gICAgICAgICAgLypcbiAgICAgICAgICAgKiBBZGp1c3Qgc29ydCBwb3NpdGlvbiBmb3IgYWxsIGRvY3MgYWZ0ZXIgdGhlIHJlbW92ZWQgZG9jIGFuZFxuICAgICAgICAgICAqIHJlbW92ZSB0aGUgZG9jIGZyb20gdGhlIG9ic2VydmVkIGRvY3MgYXJyYXlcbiAgICAgICAgICAgKi9cbiAgICAgICAgICBvYnNlcnZlZERvY3MgPSBvYnNlcnZlZERvY3MubWFwKGRvYyA9PiB7XG4gICAgICAgICAgICBpZiAoZG9jLl9fc29ydFBvc2l0aW9uID4gYXRJbmRleCkge1xuICAgICAgICAgICAgICBkb2MuX19zb3J0UG9zaXRpb24gLT0gMTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGRvYztcbiAgICAgICAgICB9KS5maWx0ZXIoXG4gICAgICAgICAgICBkID0+IGNvbGxlY3Rpb25TY29wZS5nZW5lcmF0ZUlkKGQpICE9PSBjb2xsZWN0aW9uU2NvcGUuZ2VuZXJhdGVJZChkb2MpXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHRoaXMub25TdG9wKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmVzdWx0c0hhbmRsZS5zdG9wKCk7XG4gICAgICB9KTtcblxuICAgICAgdGhpcy5yZWFkeSgpO1xuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNlYXJjaENvbGxlY3Rpb247XG4iLCJpbXBvcnQgQ3Vyc29yIGZyb20gJy4uL2NvcmUvY3Vyc29yJztcbmltcG9ydCBSZWFjdGl2ZUVuZ2luZSBmcm9tICcuLi9jb3JlL3JlYWN0aXZlLWVuZ2luZSc7XG5cbi8qKlxuICogVGhlIE1vbmdvREJFbmdpbmUgbGV0cyB5b3Ugc2VhcmNoIHRoZSBpbmRleCBvbiB0aGUgc2VydmVyIHNpZGUgd2l0aCBNb25nb0RCLiBTdWJzY3JpcHRpb25zIGFuZCBwdWJsaWNhdGlvbnNcbiAqIGFyZSBoYW5kbGVkIHdpdGhpbiB0aGUgRW5naW5lLlxuICpcbiAqIEB0eXBlIHtNb25nb0RCRW5naW5lfVxuICovXG5jbGFzcyBNb25nb0RCRW5naW5lIGV4dGVuZHMgUmVhY3RpdmVFbmdpbmUge1xuICAvKipcbiAgICogUmV0dXJuIGRlZmF1bHQgY29uZmlndXJhdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMge09iamVjdH1cbiAgICovXG4gIGRlZmF1bHRDb25maWd1cmF0aW9uKCkge1xuICAgIHJldHVybiBfLmRlZmF1bHRzKHt9LCBNb25nb0RCRW5naW5lLmRlZmF1bHRNb25nb0NvbmZpZ3VyYXRpb24odGhpcyksIHN1cGVyLmRlZmF1bHRDb25maWd1cmF0aW9uKCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlZmF1bHQgbW9uZ28gY29uZmlndXJhdGlvbiwgdXNlZCBpbiBjb25zdHJ1Y3RvciBhbmQgTWluaW1vbmdvRW5naW5lIHRvIGdldCB0aGUgY29uZmlndXJhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IGVuZ2luZVNjb3BlIFNjb3BlIG9mIHRoZSBlbmdpbmVcbiAgICpcbiAgICogQHJldHVybnMge09iamVjdH1cbiAgICovXG4gIHN0YXRpYyBkZWZhdWx0TW9uZ29Db25maWd1cmF0aW9uKGVuZ2luZVNjb3BlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGFnZ3JlZ2F0aW9uOiAnJG9yJyxcbiAgICAgIHNlbGVjdG9yKHNlYXJjaE9iamVjdCwgb3B0aW9ucywgYWdncmVnYXRpb24pIHtcbiAgICAgICAgY29uc3Qgc2VsZWN0b3IgPSB7fTtcblxuICAgICAgICBzZWxlY3RvclthZ2dyZWdhdGlvbl0gPSBbXTtcblxuICAgICAgICBfLmVhY2goc2VhcmNoT2JqZWN0LCAoc2VhcmNoU3RyaW5nLCBmaWVsZCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGZpZWxkU2VsZWN0b3IgPSBlbmdpbmVTY29wZS5jYWxsQ29uZmlnTWV0aG9kKFxuICAgICAgICAgICAgJ3NlbGVjdG9yUGVyRmllbGQnLCBmaWVsZCwgc2VhcmNoU3RyaW5nLCBvcHRpb25zXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGlmIChmaWVsZFNlbGVjdG9yKSB7XG4gICAgICAgICAgICBzZWxlY3RvclthZ2dyZWdhdGlvbl0ucHVzaChmaWVsZFNlbGVjdG9yKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBzZWxlY3RvcjtcbiAgICAgIH0sXG4gICAgICBzZWxlY3RvclBlckZpZWxkKGZpZWxkLCBzZWFyY2hTdHJpbmcpIHtcbiAgICAgICAgY29uc3Qgc2VsZWN0b3IgPSB7fTtcblxuICAgICAgICBzZWFyY2hTdHJpbmcgPSBzZWFyY2hTdHJpbmcucmVwbGFjZSgvKFxcV3sxfSkvZywgJ1xcXFwkMScpO1xuICAgICAgICBzZWxlY3RvcltmaWVsZF0gPSB7ICckcmVnZXgnIDogYC4qJHtzZWFyY2hTdHJpbmd9LipgLCAnJG9wdGlvbnMnIDogJ2knfTtcblxuICAgICAgICByZXR1cm4gc2VsZWN0b3I7XG4gICAgICB9LFxuICAgICAgc29ydChzZWFyY2hPYmplY3QsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMuaW5kZXguZmllbGRzO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIHRoZSBmaW5kIG9wdGlvbnMgZm9yIHRoZSBtb25nbyBmaW5kIHF1ZXJ5LlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gc2VhcmNoRGVmaW5pdGlvbiBTZWFyY2ggZGVmaW5pdGlvblxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAgICAgICAgICBTZWFyY2ggYW5kIGluZGV4IG9wdGlvbnNcbiAgICovXG4gIGdldEZpbmRPcHRpb25zKHNlYXJjaERlZmluaXRpb24sIG9wdGlvbnMpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc2tpcDogb3B0aW9ucy5zZWFyY2guc2tpcCxcbiAgICAgIGxpbWl0OiBvcHRpb25zLnNlYXJjaC5saW1pdCxcbiAgICAgIGRpc2FibGVPcGxvZzogdGhpcy5jb25maWcuZGlzYWJsZU9wbG9nLFxuICAgICAgcG9sbGluZ0ludGVydmFsTXM6IHRoaXMuY29uZmlnLnBvbGxpbmdJbnRlcnZhbE1zLFxuICAgICAgcG9sbGluZ1Rocm90dGxlTXM6IHRoaXMuY29uZmlnLnBvbGxpbmdUaHJvdHRsZU1zLFxuICAgICAgc29ydDogdGhpcy5jYWxsQ29uZmlnTWV0aG9kKCdzb3J0Jywgc2VhcmNoRGVmaW5pdGlvbiwgb3B0aW9ucyksXG4gICAgICBmaWVsZHM6IHRoaXMuY2FsbENvbmZpZ01ldGhvZCgnZmllbGRzJywgc2VhcmNoRGVmaW5pdGlvbiwgb3B0aW9ucylcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiB0aGUgcmVhY3RpdmUgc2VhcmNoIGN1cnNvci5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHNlYXJjaERlZmluaXRpb24gU2VhcmNoIGRlZmluaXRpb25cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgICAgICAgICAgU2VhcmNoIGFuZCBpbmRleCBvcHRpb25zXG4gICAqL1xuICBnZXRTZWFyY2hDdXJzb3Ioc2VhcmNoRGVmaW5pdGlvbiwgb3B0aW9ucykge1xuICAgIGNvbnN0IHNlbGVjdG9yID0gdGhpcy5jYWxsQ29uZmlnTWV0aG9kKFxuICAgICAgICAnc2VsZWN0b3InLFxuICAgICAgICBzZWFyY2hEZWZpbml0aW9uLFxuICAgICAgICBvcHRpb25zLFxuICAgICAgICB0aGlzLmNvbmZpZy5hZ2dyZWdhdGlvblxuICAgICAgKSxcbiAgICAgIGZpbmRPcHRpb25zID0gdGhpcy5nZXRGaW5kT3B0aW9ucyhzZWFyY2hEZWZpbml0aW9uLCBvcHRpb25zKSxcbiAgICAgIGNvbGxlY3Rpb24gPSBvcHRpb25zLmluZGV4LmNvbGxlY3Rpb247XG5cbiAgICBjaGVjayhvcHRpb25zLCBPYmplY3QpO1xuICAgIGNoZWNrKHNlbGVjdG9yLCBPYmplY3QpO1xuICAgIGNoZWNrKGZpbmRPcHRpb25zLCBPYmplY3QpO1xuXG4gICAgcmV0dXJuIG5ldyBDdXJzb3IoXG4gICAgICBjb2xsZWN0aW9uLmZpbmQoc2VsZWN0b3IsIGZpbmRPcHRpb25zKSxcbiAgICAgIGNvbGxlY3Rpb24uZmluZChzZWxlY3RvcikuY291bnQoKVxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTW9uZ29EQkVuZ2luZTtcbiIsImltcG9ydCBFbmdpbmUgZnJvbSAnLi4vY29yZS9lbmdpbmUnO1xuaW1wb3J0IFJlYWN0aXZlRW5naW5lIGZyb20gJy4uL2NvcmUvcmVhY3RpdmUtZW5naW5lJztcbmltcG9ydCBNb25nb0RCRW5naW5lIGZyb20gJy4vbW9uZ28tZGInO1xuXG4vKipcbiAqIFRoZSBNaW5pbW9uZ0VuZ2luZSBsZXRzIHlvdSBzZWFyY2ggdGhlIGluZGV4IG9uIHRoZSBjbGllbnQtc2lkZS5cbiAqXG4gKiBAdHlwZSB7TWluaW1vbmdvRW5naW5lfVxuICovXG5jbGFzcyBNaW5pbW9uZ29FbmdpbmUgZXh0ZW5kcyBFbmdpbmUge1xuICAvKipcbiAgICogUmV0dXJuIGRlZmF1bHQgY29uZmlndXJhdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMge09iamVjdH1cbiAgICovXG4gIGRlZmF1bHRDb25maWd1cmF0aW9uKCkge1xuICAgIHJldHVybiBfLmRlZmF1bHRzKHt9LCBNb25nb0RCRW5naW5lLmRlZmF1bHRNb25nb0NvbmZpZ3VyYXRpb24odGhpcyksIHN1cGVyLmRlZmF1bHRDb25maWd1cmF0aW9uKCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlYXJjaCB0aGUgaW5kZXguXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBzZWFyY2hEZWZpbml0aW9uIFNlYXJjaCBkZWZpbml0aW9uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zICAgICAgICAgIE9iamVjdCBvZiBvcHRpb25zXG4gICAqXG4gICAqIEByZXR1cm5zIHtjdXJzb3J9XG4gICAqL1xuICBzZWFyY2goc2VhcmNoRGVmaW5pdGlvbiwgb3B0aW9ucykge1xuICAgIGlmICghTWV0ZW9yLmlzQ2xpZW50KSB7XG4gICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdvbmx5LWNsaWVudCcsICdNaW5pbW9uZ28gY2FuIG9ubHkgYmUgdXNlZCBvbiB0aGUgY2xpZW50Jyk7XG4gICAgfVxuXG4gICAgc2VhcmNoRGVmaW5pdGlvbiA9IHRoaXMudHJhbnNmb3JtU2VhcmNoRGVmaW5pdGlvbihzZWFyY2hEZWZpbml0aW9uLCBvcHRpb25zKTtcblxuICAgIC8vIGNoZWNrKCkgY2FsbHMgYXJlIGluIGdldFNlYXJjaEN1cnNvciBtZXRob2RcbiAgICByZXR1cm4gTW9uZ29EQkVuZ2luZS5wcm90b3R5cGUuZ2V0U2VhcmNoQ3Vyc29yLmFwcGx5KHRoaXMsIFtzZWFyY2hEZWZpbml0aW9uLCBvcHRpb25zXSk7XG4gIH1cbn1cblxuTWluaW1vbmdvRW5naW5lLnByb3RvdHlwZS5jaGVja1NlYXJjaFBhcmFtID0gUmVhY3RpdmVFbmdpbmUucHJvdG90eXBlLmNoZWNrU2VhcmNoUGFyYW07XG5NaW5pbW9uZ29FbmdpbmUucHJvdG90eXBlLnRyYW5zZm9ybVNlYXJjaERlZmluaXRpb24gPSBSZWFjdGl2ZUVuZ2luZS5wcm90b3R5cGUudHJhbnNmb3JtU2VhcmNoRGVmaW5pdGlvbjtcblxuTWluaW1vbmdvRW5naW5lLnByb3RvdHlwZS5nZXRGaW5kT3B0aW9ucyA9IGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gIGxldCBmaW5kT3B0aW9ucyA9IE1vbmdvREJFbmdpbmUucHJvdG90eXBlLmdldEZpbmRPcHRpb25zLmFwcGx5KHRoaXMsIGFyZ3MpO1xuXG4gIGZpbmRPcHRpb25zLnRyYW5zZm9ybSA9IHRoaXMuY29uZmlnLnRyYW5zZm9ybTtcblxuICByZXR1cm4gZmluZE9wdGlvbnM7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBNaW5pbW9uZ29FbmdpbmU7XG4iLCJpbXBvcnQgUmVhY3RpdmVFbmdpbmUgZnJvbSAnLi4vY29yZS9yZWFjdGl2ZS1lbmdpbmUnO1xuaW1wb3J0IE1vbmdvREJFbmdpbmUgZnJvbSAnLi9tb25nby1kYic7XG5cbi8qKlxuICogVGhlIE1vbmdvVGV4dEluZGV4RW5naW5lIGxldHMgeW91IHNlYXJjaCB0aGUgaW5kZXggd2l0aCBNb25nbyB0ZXh0IGluZGV4ZXMuXG4gKlxuICogQHR5cGUge01vbmdvVGV4dEluZGV4RW5naW5lfVxuICovXG5jbGFzcyBNb25nb1RleHRJbmRleEVuZ2luZSBleHRlbmRzIFJlYWN0aXZlRW5naW5lIHtcbiAgLyoqXG4gICAqIFJldHVybiBkZWZhdWx0IGNvbmZpZ3VyYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIHtPYmplY3R9XG4gICAqL1xuICBkZWZhdWx0Q29uZmlndXJhdGlvbigpIHtcbiAgICBsZXQgbW9uZ29Db25maWd1cmF0aW9uID0gTW9uZ29EQkVuZ2luZS5kZWZhdWx0TW9uZ29Db25maWd1cmF0aW9uKHRoaXMpO1xuXG4gICAgbW9uZ29Db25maWd1cmF0aW9uLnNlbGVjdG9yID0gZnVuY3Rpb24gKHNlYXJjaFN0cmluZykge1xuICAgICAgaWYgKHNlYXJjaFN0cmluZy50cmltKCkpIHtcbiAgICAgICAgcmV0dXJuIHsgJHRleHQ6IHsgJHNlYXJjaDogc2VhcmNoU3RyaW5nIH0gfTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHt9O1xuICAgIH07XG5cbiAgICByZXR1cm4gXy5kZWZhdWx0cyh7fSwgbW9uZ29Db25maWd1cmF0aW9uLCBzdXBlci5kZWZhdWx0Q29uZmlndXJhdGlvbigpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXR1cCB0aGUgaW5kZXggb24gY3JlYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBpbmRleENvbmZpZyBJbmRleCBjb25maWd1cmF0aW9uXG4gICAqL1xuICBvbkluZGV4Q3JlYXRlKGluZGV4Q29uZmlnKSB7XG4gICAgc3VwZXIub25JbmRleENyZWF0ZShpbmRleENvbmZpZyk7XG5cbiAgICBpZiAoTWV0ZW9yLmlzU2VydmVyKSB7XG4gICAgICBsZXQgdGV4dEluZGV4ZXNDb25maWcgPSB7fTtcblxuICAgICAgXy5lYWNoKGluZGV4Q29uZmlnLmZpZWxkcywgZnVuY3Rpb24gKGZpZWxkKSB7XG4gICAgICAgIHRleHRJbmRleGVzQ29uZmlnW2ZpZWxkXSA9ICd0ZXh0JztcbiAgICAgIH0pO1xuXG4gICAgICBpZiAoaW5kZXhDb25maWcud2VpZ2h0cykge1xuICAgICAgICB0ZXh0SW5kZXhlc0NvbmZpZy53ZWlnaHRzID0gb3B0aW9ucy53ZWlnaHRzKCk7XG4gICAgICB9XG5cbiAgICAgIGluZGV4Q29uZmlnLmNvbGxlY3Rpb24uX2Vuc3VyZUluZGV4KHRleHRJbmRleGVzQ29uZmlnKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVHJhbnNmb3JtIHRoZSBzZWFyY2ggZGVmaW5pdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fSBzZWFyY2hEZWZpbml0aW9uIFNlYXJjaCBkZWZpbml0aW9uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAgICAgICAgb3B0aW9ucyAgICAgICAgICBTZWFyY2ggYW5kIGluZGV4IG9wdGlvbnNcbiAgICpcbiAgICogQHJldHVybnMge09iamVjdH1cbiAgICovXG4gIHRyYW5zZm9ybVNlYXJjaERlZmluaXRpb24oc2VhcmNoRGVmaW5pdGlvbiwgb3B0aW9ucykge1xuICAgIHJldHVybiBzZWFyY2hEZWZpbml0aW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIHRoZSBnaXZlbiBzZWFyY2ggcGFyYW1ldGVyIGZvciB2YWxpZGl0eVxuICAgKlxuICAgKiBAcGFyYW0gc2VhcmNoXG4gICAqL1xuICBjaGVja1NlYXJjaFBhcmFtKHNlYXJjaCkge1xuICAgIGNoZWNrKHNlYXJjaCwgU3RyaW5nKTtcbiAgfVxufVxuXG4vLyBFeHBsaWNpdGVseSBpbmhlcml0IGdldFNlYXJjaEN1cnNvciBtZXRob2QgZnVuY3Rpb25hbGl0eVxuTW9uZ29UZXh0SW5kZXhFbmdpbmUucHJvdG90eXBlLmdldFNlYXJjaEN1cnNvciA9IE1vbmdvREJFbmdpbmUucHJvdG90eXBlLmdldFNlYXJjaEN1cnNvcjtcbk1vbmdvVGV4dEluZGV4RW5naW5lLnByb3RvdHlwZS5nZXRGaW5kT3B0aW9ucyA9IE1vbmdvREJFbmdpbmUucHJvdG90eXBlLmdldEZpbmRPcHRpb25zO1xuXG5leHBvcnQgZGVmYXVsdCBNb25nb1RleHRJbmRleEVuZ2luZTtcbiIsImltcG9ydCB7XG4gIEluZGV4LFxuICBFbmdpbmUsXG4gIFJlYWN0aXZlRW5naW5lLFxuICBDdXJzb3IsXG4gIE1vbmdvREJFbmdpbmUsXG4gIE1pbmltb25nb0VuZ2luZSxcbiAgTW9uZ29UZXh0SW5kZXhFbmdpbmVcbn0gZnJvbSAnLi9tYWluJztcblxuRWFzeVNlYXJjaCA9IHtcbiAgLy8gQ29yZVxuICBJbmRleCxcbiAgRW5naW5lLFxuICBSZWFjdGl2ZUVuZ2luZSxcbiAgQ3Vyc29yLFxuICAvLyBFbmdpbmVzXG4gIE1vbmdvREI6IE1vbmdvREJFbmdpbmUsXG4gIE1pbmltb25nbzogTWluaW1vbmdvRW5naW5lLFxuICBNb25nb1RleHRJbmRleDogTW9uZ29UZXh0SW5kZXhFbmdpbmVcbn07XG4iLCJpbXBvcnQgSW5kZXggZnJvbSAnLi9jb3JlL2luZGV4JztcbmltcG9ydCBFbmdpbmUgZnJvbSAnLi9jb3JlL2VuZ2luZSc7XG5pbXBvcnQgUmVhY3RpdmVFbmdpbmUgZnJvbSAnLi9jb3JlL3JlYWN0aXZlLWVuZ2luZSc7XG5pbXBvcnQgQ3Vyc29yIGZyb20gJy4vY29yZS9jdXJzb3InO1xuaW1wb3J0IE1vbmdvREJFbmdpbmUgZnJvbSAnLi9lbmdpbmVzL21vbmdvLWRiJztcbmltcG9ydCBNaW5pbW9uZ29FbmdpbmUgZnJvbSAnLi9lbmdpbmVzL21pbmltb25nbyc7XG5pbXBvcnQgTW9uZ29UZXh0SW5kZXhFbmdpbmUgZnJvbSAnLi9lbmdpbmVzL21vbmdvLXRleHQtaW5kZXgnO1xuXG5leHBvcnQge1xuICBJbmRleCxcbiAgRW5naW5lLFxuICBSZWFjdGl2ZUVuZ2luZSxcbiAgQ3Vyc29yLFxuICBNb25nb0RCRW5naW5lLFxuICBNaW5pbW9uZ29FbmdpbmUsXG4gIE1vbmdvVGV4dEluZGV4RW5naW5lXG59O1xuIl19
