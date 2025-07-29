(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var check = Package.check.check;
var Match = Package.check.Match;
var Random = Package.random.Random;
var ECMAScript = Package.ecmascript.ECMAScript;
var fetch = Package.fetch.fetch;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var _preCollection, _preCollectionName, allowClientCode, allowedOrigins, allowQueryStringCookies, cacheControl, chunkSize, collection, collectionName, continueUploadTTL, debug, disableDownload, disableUpload, downloadCallback, downloadRoute, getUser, integrityCheck, interceptDownload, interceptRequest, namingFunction, onAfterRemove, onAfterUpload, onBeforeRemove, onBeforeUpload, onInitiateUpload, parentDirPermissions, permissions, protected, public, responseHeaders, sanitize, schema, strict, FilesCollection;

var require = meteorInstall({"node_modules":{"meteor":{"ostrio:files":{"server.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ostrio_files/server.js                                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  FilesCollection: () => FilesCollection,
  helpers: () => helpers
});
let Mongo;
module.link("meteor/mongo", {
  Mongo(v) {
    Mongo = v;
  }
}, 0);
let fetch;
module.link("meteor/fetch", {
  fetch(v) {
    fetch = v;
  }
}, 1);
let WebApp;
module.link("meteor/webapp", {
  WebApp(v) {
    WebApp = v;
  }
}, 2);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 3);
let Random;
module.link("meteor/random", {
  Random(v) {
    Random = v;
  }
}, 4);
let Cookies;
module.link("meteor/ostrio:cookies", {
  Cookies(v) {
    Cookies = v;
  }
}, 5);
let check, Match;
module.link("meteor/check", {
  check(v) {
    check = v;
  },
  Match(v) {
    Match = v;
  }
}, 6);
let WriteStream;
module.link("./write-stream.js", {
  default(v) {
    WriteStream = v;
  }
}, 7);
let FilesCollectionCore;
module.link("./core.js", {
  default(v) {
    FilesCollectionCore = v;
  }
}, 8);
let fixJSONParse, fixJSONStringify, helpers;
module.link("./lib.js", {
  fixJSONParse(v) {
    fixJSONParse = v;
  },
  fixJSONStringify(v) {
    fixJSONStringify = v;
  },
  helpers(v) {
    helpers = v;
  }
}, 9);
let AbortController;
module.link("abort-controller", {
  default(v) {
    AbortController = v;
  }
}, 10);
let fs;
module.link("fs", {
  default(v) {
    fs = v;
  }
}, 11);
let nodeQs;
module.link("querystring", {
  default(v) {
    nodeQs = v;
  }
}, 12);
let nodePath;
module.link("path", {
  default(v) {
    nodePath = v;
  }
}, 13);
/**
 * @const {Object} bound  - Meteor.bindEnvironment (Fiber wrapper)
 * @const {Function} noop - No Operation function, placeholder for required callbacks
 */
const bound = Meteor.bindEnvironment(callback => callback());
const noop = function noop() {};

/**
 * Create (ensure) index on MongoDB collection, catch and log exception if thrown
 * @function createIndex
 * @param {Mongo.Collection} collection - Mongo.Collection instance
 * @param {object} keys - Field and value pairs where the field is the index key and the value describes the type of index for that field
 * @param {object} opts - Set of options that controls the creation of the index
 * @returns {void 0}
 */
const createIndex = (_collection, keys, opts) => Promise.asyncApply(() => {
  const collection = _collection.rawCollection();
  try {
    Promise.await(collection.createIndex(keys, opts));
  } catch (e) {
    if (e.code === 85) {
      let indexName;
      const indexes = Promise.await(collection.indexes());
      for (const index of indexes) {
        let allMatch = true;
        for (const indexKey of Object.keys(keys)) {
          if (typeof index.key[indexKey] === 'undefined') {
            allMatch = false;
            break;
          }
        }
        for (const indexKey of Object.keys(index.key)) {
          if (typeof keys[indexKey] === 'undefined') {
            allMatch = false;
            break;
          }
        }
        if (allMatch) {
          indexName = index.name;
          break;
        }
      }
      if (indexName) {
        Promise.await(collection.dropIndex(indexName));
        Promise.await(collection.createIndex(keys, opts));
      }
    } else {
      Meteor._debug("Can not set ".concat(Object.keys(keys).join(' + '), " index on \"").concat(_collection._name, "\" collection"), {
        keys,
        opts,
        details: e
      });
    }
  }
});

/**
 * @locus Anywhere
 * @class FilesCollection
 * @param config           {Object}   - [Both]   Configuration object with next properties:
 * @param config.debug     {Boolean}  - [Both]   Turn on/of debugging and extra logging
 * @param config.schema    {Object}   - [Both]   Collection Schema
 * @param config.public    {Boolean}  - [Both]   Store files in folder accessible for proxy servers, for limits, and more - read docs
 * @param config.strict    {Boolean}  - [Server] Strict mode for partial content, if is `true` server will return `416` response code, when `range` is not specified, otherwise server return `206`
 * @param config.protected {Function} - [Server] If `true` - files will be served only to authorized users, if `function()` - you're able to check visitor's permissions in your own way function's context has:
 *  - `request`
 *  - `response`
 *  - `user()`
 *  - `userId`
 * @param config.chunkSize      {Number}  - [Both] Upload chunk size, default: 524288 bytes (0,5 Mb)
 * @param config.permissions    {Number}  - [Server] Permissions which will be set to uploaded files (octal), like: `511` or `0o755`. Default: 0644
 * @param config.parentDirPermissions {Number}  - [Server] Permissions which will be set to parent directory of uploaded files (octal), like: `611` or `0o777`. Default: 0755
 * @param config.storagePath    {String|Function}  - [Server] Storage path on file system
 * @param config.cacheControl   {String}  - [Server] Default `Cache-Control` header
 * @param config.responseHeaders {Object|Function} - [Server] Custom response headers, if function is passed, must return Object
 * @param config.throttle       {Number}  - [Server] DEPRECATED bps throttle threshold
 * @param config.downloadRoute  {String}  - [Both]   Server Route used to retrieve files
 * @param config.collection     {Mongo.Collection} - [Both] Mongo Collection Instance
 * @param config.collectionName {String}  - [Both]   Collection name
 * @param config.namingFunction {Function}- [Both]   Function which returns `String`
 * @param config.integrityCheck {Boolean} - [Server] Check file's integrity before serving to users
 * @param config.onAfterUpload  {Function}- [Server] Called right after file is ready on FS. Use to transfer file somewhere else, or do other thing with file directly
 * @param config.onAfterRemove  {Function} - [Server] Called right after file is removed. Removed objects is passed to callback
 * @param config.continueUploadTTL {Number} - [Server] Time in seconds, during upload may be continued, default 3 hours (10800 seconds)
 * @param config.onBeforeUpload {Function}- [Both]   Function which executes on server after receiving each chunk and on client right before beginning upload. Function context is `File` - so you are able to check for extension, mime-type, size and etc.:
 *  - return `true` to continue
 *  - return `false` or `String` to abort upload
 * @param config.getUser        {Function} - [Server] Replace default way of recognizing user, usefull when you want to auth user based on custom cookie (or other way). arguments {http: {request: {...}, response: {...}}}, need to return {userId: String, user: Function}
 * @param config.onInitiateUpload {Function} - [Server] Function which executes on server right before upload is begin and right after `onBeforeUpload` hook. This hook is fully asynchronous.
 * @param config.onBeforeRemove {Function} - [Server] Executes before removing file on server, so you can check permissions. Return `true` to allow action and `false` to deny.
 * @param config.allowClientCode  {Boolean}  - [Both]   Allow to run `remove` from client
 * @param config.downloadCallback {Function} - [Server] Callback triggered each time file is requested, return truthy value to continue download, or falsy to abort
  * @param config.interceptRequest {Function} - [Server] Intercept incoming HTTP request, so you can whatever you want, no checks or preprocessing, arguments {http: {request: {...}, response: {...}}, params: {...}}
 * @param config.interceptDownload {Function} - [Server] Intercept download request, so you can serve file from third-party resource, arguments {http: {request: {...}, response: {...}}, fileRef: {...}}
 * @param config.disableUpload {Boolean} - Disable file upload, useful for server only solutions
 * @param config.disableDownload {Boolean} - Disable file download (serving), useful for file management only solutions
 * @param config.allowedOrigins  {Regex|Boolean}  - [Server]   Regex of Origins that are allowed CORS access or `false` to disable completely. Defaults to `/^http:\/\/localhost:12[0-9]{3}$/` for allowing Meteor-Cordova builds access
 * @param config.allowQueryStringCookies {Boolean} - Allow passing Cookies in a query string (in URL). Primary should be used only in Cordova environment. Note: this option will be used only on Cordova. Default: `false`
 * @param config.sanitize {Function} - Override default sanitize function
 * @param config._preCollection  {Mongo.Collection} - [Server] Mongo preCollection Instance
 * @param config._preCollectionName {String}  - [Server]  preCollection name
 * @summary Create new instance of FilesCollection
 */
class FilesCollection extends FilesCollectionCore {
  constructor(config) {
    super();
    let storagePath;
    if (config) {
      ({
        _preCollection: this._preCollection,
        _preCollectionName: this._preCollectionName,
        allowClientCode: this.allowClientCode,
        allowedOrigins: this.allowedOrigins,
        allowQueryStringCookies: this.allowQueryStringCookies,
        cacheControl: this.cacheControl,
        chunkSize: this.chunkSize,
        collection: this.collection,
        collectionName: this.collectionName,
        continueUploadTTL: this.continueUploadTTL,
        debug: this.debug,
        disableDownload: this.disableDownload,
        disableUpload: this.disableUpload,
        downloadCallback: this.downloadCallback,
        downloadRoute: this.downloadRoute,
        getUser: this.getUser,
        integrityCheck: this.integrityCheck,
        interceptDownload: this.interceptDownload,
        interceptRequest: this.interceptRequest,
        namingFunction: this.namingFunction,
        onAfterRemove: this.onAfterRemove,
        onAfterUpload: this.onAfterUpload,
        onBeforeRemove: this.onBeforeRemove,
        onBeforeUpload: this.onBeforeUpload,
        onInitiateUpload: this.onInitiateUpload,
        parentDirPermissions: this.parentDirPermissions,
        permissions: this.permissions,
        protected: this.protected,
        public: this.public,
        responseHeaders: this.responseHeaders,
        sanitize: this.sanitize,
        schema: this.schema,
        storagePath,
        strict: this.strict
      } = config);
    }
    const self = this;
    if (!helpers.isBoolean(this.debug)) {
      this.debug = false;
    }
    if (!helpers.isBoolean(this.public)) {
      this.public = false;
    }
    if (!this.protected) {
      this.protected = false;
    }
    if (!this.chunkSize) {
      this.chunkSize = 1024 * 512;
    }
    this.chunkSize = Math.floor(this.chunkSize / 8) * 8;
    if (!helpers.isString(this.collectionName) && !this.collection) {
      this.collectionName = 'MeteorUploadFiles';
    }
    if (!this.collection) {
      this.collection = new Mongo.Collection(this.collectionName);
    } else {
      this.collectionName = this.collection._name;
    }
    this.collection.filesCollection = this;
    check(this.collectionName, String);
    if (this.public && !this.downloadRoute) {
      throw new Meteor.Error(500, "[FilesCollection.".concat(this.collectionName, "]: \"downloadRoute\" must be precisely provided on \"public\" collections! Note: \"downloadRoute\" must be equal or be inside of your web/proxy-server (relative) root."));
    }
    if (!helpers.isString(this.downloadRoute)) {
      this.downloadRoute = '/cdn/storage';
    }
    this.downloadRoute = this.downloadRoute.replace(/\/$/, '');
    if (!helpers.isFunction(this.namingFunction)) {
      this.namingFunction = false;
    }
    if (!helpers.isFunction(this.onBeforeUpload)) {
      this.onBeforeUpload = false;
    }
    if (!helpers.isFunction(this.getUser)) {
      this.getUser = false;
    }
    if (!helpers.isBoolean(this.allowClientCode)) {
      this.allowClientCode = true;
    }
    if (!helpers.isFunction(this.onInitiateUpload)) {
      this.onInitiateUpload = false;
    }
    if (!helpers.isFunction(this.interceptRequest)) {
      this.interceptRequest = false;
    }
    if (!helpers.isFunction(this.interceptDownload)) {
      this.interceptDownload = false;
    }
    if (!helpers.isBoolean(this.strict)) {
      this.strict = true;
    }
    if (!helpers.isBoolean(this.allowQueryStringCookies)) {
      this.allowQueryStringCookies = false;
    }
    if (!helpers.isNumber(this.permissions)) {
      this.permissions = parseInt('644', 8);
    }
    if (!helpers.isNumber(this.parentDirPermissions)) {
      this.parentDirPermissions = parseInt('755', 8);
    }
    if (!helpers.isString(this.cacheControl)) {
      this.cacheControl = 'public, max-age=31536000, s-maxage=31536000';
    }
    if (!helpers.isFunction(this.onAfterUpload)) {
      this.onAfterUpload = false;
    }
    if (!helpers.isBoolean(this.disableUpload)) {
      this.disableUpload = false;
    }
    if (!helpers.isFunction(this.onAfterRemove)) {
      this.onAfterRemove = false;
    }
    if (!helpers.isFunction(this.onBeforeRemove)) {
      this.onBeforeRemove = false;
    }
    if (!helpers.isBoolean(this.integrityCheck)) {
      this.integrityCheck = true;
    }
    if (!helpers.isBoolean(this.disableDownload)) {
      this.disableDownload = false;
    }
    if (this.allowedOrigins === true || this.allowedOrigins === void 0) {
      this.allowedOrigins = /^http:\/\/localhost:12[0-9]{3}$/;
    }
    if (!helpers.isObject(this._currentUploads)) {
      this._currentUploads = {};
    }
    if (!helpers.isFunction(this.downloadCallback)) {
      this.downloadCallback = false;
    }
    if (!helpers.isNumber(this.continueUploadTTL)) {
      this.continueUploadTTL = 10800;
    }
    if (!helpers.isFunction(this.sanitize)) {
      this.sanitize = helpers.sanitize;
    }
    if (!helpers.isFunction(this.responseHeaders)) {
      this.responseHeaders = (responseCode, fileRef, versionRef) => {
        const headers = {};
        switch (responseCode) {
          case '206':
            headers.Pragma = 'private';
            headers['Transfer-Encoding'] = 'chunked';
            break;
          case '400':
            headers['Cache-Control'] = 'no-cache';
            break;
          case '416':
            headers['Content-Range'] = "bytes */".concat(versionRef.size);
            break;
          default:
            break;
        }
        headers.Connection = 'keep-alive';
        headers['Content-Type'] = versionRef.type || 'application/octet-stream';
        headers['Accept-Ranges'] = 'bytes';
        return headers;
      };
    }
    if (this.public && !storagePath) {
      throw new Meteor.Error(500, "[FilesCollection.".concat(this.collectionName, "] \"storagePath\" must be set on \"public\" collections! Note: \"storagePath\" must be equal on be inside of your web/proxy-server (absolute) root."));
    }
    if (!storagePath) {
      storagePath = function () {
        return "assets".concat(nodePath.sep, "app").concat(nodePath.sep, "uploads").concat(nodePath.sep).concat(self.collectionName);
      };
    }
    if (helpers.isString(storagePath)) {
      this.storagePath = () => storagePath;
    } else {
      this.storagePath = function () {
        let sp = storagePath.apply(self, arguments);
        if (!helpers.isString(sp)) {
          throw new Meteor.Error(400, "[FilesCollection.".concat(self.collectionName, "] \"storagePath\" function must return a String!"));
        }
        sp = sp.replace(/\/$/, '');
        return nodePath.normalize(sp);
      };
    }
    this._debug('[FilesCollection.storagePath] Set to:', this.storagePath({}));
    try {
      fs.mkdirSync(this.storagePath({}), {
        mode: this.parentDirPermissions,
        recursive: true
      });
    } catch (error) {
      if (error) {
        throw new Meteor.Error(401, "[FilesCollection.".concat(self.collectionName, "] Path \"").concat(this.storagePath({}), "\" is not writable!"), error);
      }
    }
    check(this.strict, Boolean);
    check(this.permissions, Number);
    check(this.storagePath, Function);
    check(this.cacheControl, String);
    check(this.onAfterRemove, Match.OneOf(false, Function));
    check(this.onAfterUpload, Match.OneOf(false, Function));
    check(this.disableUpload, Boolean);
    check(this.integrityCheck, Boolean);
    check(this.onBeforeRemove, Match.OneOf(false, Function));
    check(this.disableDownload, Boolean);
    check(this.downloadCallback, Match.OneOf(false, Function));
    check(this.interceptRequest, Match.OneOf(false, Function));
    check(this.interceptDownload, Match.OneOf(false, Function));
    check(this.continueUploadTTL, Number);
    check(this.responseHeaders, Match.OneOf(Object, Function));
    check(this.allowedOrigins, Match.OneOf(Boolean, RegExp));
    check(this.allowQueryStringCookies, Boolean);
    this._cookies = new Cookies({
      allowQueryStringCookies: this.allowQueryStringCookies,
      allowedCordovaOrigins: this.allowedOrigins
    });
    if (!this.disableUpload) {
      if (!helpers.isString(this._preCollectionName) && !this._preCollection) {
        this._preCollectionName = "__pre_".concat(this.collectionName);
      }
      if (!this._preCollection) {
        this._preCollection = new Mongo.Collection(this._preCollectionName);
      } else {
        this._preCollectionName = this._preCollection._name;
      }
      check(this._preCollectionName, String);
      createIndex(this._preCollection, {
        createdAt: 1
      }, {
        expireAfterSeconds: this.continueUploadTTL,
        background: true
      });
      const _preCollectionCursor = this._preCollection.find({}, {
        fields: {
          _id: 1,
          isFinished: 1
        }
      });
      _preCollectionCursor.observe({
        changed(doc) {
          if (doc.isFinished) {
            self._debug("[FilesCollection] [_preCollectionCursor.observe] [changed]: ".concat(doc._id));
            self._preCollection.remove({
              _id: doc._id
            }, noop);
          }
        },
        removed(doc) {
          // Free memory after upload is done
          // Or if upload is unfinished
          self._debug("[FilesCollection] [_preCollectionCursor.observe] [removed]: ".concat(doc._id));
          if (helpers.isObject(self._currentUploads[doc._id])) {
            self._currentUploads[doc._id].stop();
            self._currentUploads[doc._id].end();

            // We can be unlucky to run into a race condition where another server removed this document before the change of `isFinished` is registered on this server.
            // Therefore it's better to double-check with the main collection if the file is referenced there. Issue: https://github.com/veliovgroup/Meteor-Files/issues/672
            if (!doc.isFinished && self.collection.find({
              _id: doc._id
            }).count() === 0) {
              self._debug("[FilesCollection] [_preCollectionCursor.observe] [removeUnfinishedUpload]: ".concat(doc._id));
              self._currentUploads[doc._id].abort();
            }
            delete self._currentUploads[doc._id];
          }
        }
      });
      this._createStream = (_id, path, opts) => {
        this._currentUploads[_id] = new WriteStream(path, opts.fileLength, opts, this.permissions);
      };

      // This little function allows to continue upload
      // even after server is restarted (*not on dev-stage*)
      this._continueUpload = _id => {
        if (this._currentUploads[_id] && this._currentUploads[_id].file) {
          if (!this._currentUploads[_id].aborted && !this._currentUploads[_id].ended) {
            return this._currentUploads[_id].file;
          }
          this._createStream(_id, this._currentUploads[_id].file.file.path, this._currentUploads[_id].file);
          return this._currentUploads[_id].file;
        }
        const contUpld = this._preCollection.findOne({
          _id
        });
        if (contUpld) {
          this._createStream(_id, contUpld.file.path, contUpld);
          return this._currentUploads[_id].file;
        }
        return false;
      };
    }
    if (!this.schema) {
      this.schema = FilesCollectionCore.schema;
    }
    check(this.debug, Boolean);
    check(this.schema, Object);
    check(this.public, Boolean);
    check(this.getUser, Match.OneOf(false, Function));
    check(this.protected, Match.OneOf(Boolean, Function));
    check(this.chunkSize, Number);
    check(this.downloadRoute, String);
    check(this.namingFunction, Match.OneOf(false, Function));
    check(this.onBeforeUpload, Match.OneOf(false, Function));
    check(this.onInitiateUpload, Match.OneOf(false, Function));
    check(this.allowClientCode, Boolean);
    if (this.public && this.protected) {
      throw new Meteor.Error(500, "[FilesCollection.".concat(this.collectionName, "]: Files can not be public and protected at the same time!"));
    }
    this._checkAccess = http => {
      if (this.protected) {
        let result;
        const {
          user,
          userId
        } = this._getUser(http);
        if (helpers.isFunction(this.protected)) {
          let fileRef;
          if (helpers.isObject(http.params) && http.params._id) {
            fileRef = this.collection.findOne(http.params._id);
          }
          result = http ? this.protected.call(Object.assign(http, {
            user,
            userId
          }), fileRef || null) : this.protected.call({
            user,
            userId
          }, fileRef || null);
        } else {
          result = !!userId;
        }
        if (http && result === true || !http) {
          return true;
        }
        const rc = helpers.isNumber(result) ? result : 401;
        this._debug('[FilesCollection._checkAccess] WARN: Access denied!');
        if (http) {
          const text = 'Access denied!';
          if (!http.response.headersSent) {
            http.response.writeHead(rc, {
              'Content-Type': 'text/plain',
              'Content-Length': text.length
            });
          }
          if (!http.response.finished) {
            http.response.end(text);
          }
        }
        return false;
      }
      return true;
    };
    this._methodNames = {
      _Abort: "_FilesCollectionAbort_".concat(this.collectionName),
      _Write: "_FilesCollectionWrite_".concat(this.collectionName),
      _Start: "_FilesCollectionStart_".concat(this.collectionName),
      _Remove: "_FilesCollectionRemove_".concat(this.collectionName)
    };
    this.on('_handleUpload', this._handleUpload);
    this.on('_finishUpload', this._finishUpload);
    this._handleUploadSync = Meteor.wrapAsync(this._handleUpload.bind(this));
    if (this.disableUpload && this.disableDownload) {
      return;
    }
    WebApp.connectHandlers.use((httpReq, httpResp, next) => {
      if (this.allowedOrigins && httpReq._parsedUrl.path.includes("".concat(this.downloadRoute, "/")) && !httpResp.headersSent) {
        if (this.allowedOrigins.test(httpReq.headers.origin)) {
          httpResp.setHeader('Access-Control-Allow-Credentials', 'true');
          httpResp.setHeader('Access-Control-Allow-Origin', httpReq.headers.origin);
        }
        if (httpReq.method === 'OPTIONS') {
          httpResp.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          httpResp.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, x-mtok, x-start, x-chunkid, x-fileid, x-eof');
          httpResp.setHeader('Access-Control-Expose-Headers', 'Accept-Ranges, Content-Encoding, Content-Length, Content-Range');
          httpResp.setHeader('Allow', 'GET, POST, OPTIONS');
          httpResp.writeHead(200);
          httpResp.end();
          return;
        }
      }
      if (!this.disableUpload && httpReq._parsedUrl.path.includes("".concat(this.downloadRoute, "/").concat(this.collectionName, "/__upload"))) {
        if (httpReq.method !== 'POST') {
          next();
          return;
        }
        const handleError = _error => {
          let error = _error;
          Meteor._debug('[FilesCollection] [Upload] [HTTP] Exception:', error);
          if (!httpResp.headersSent) {
            httpResp.writeHead(500);
          }
          if (!httpResp.finished) {
            if (helpers.isObject(error) && helpers.isFunction(error.toString)) {
              error = error.toString();
            }
            if (!helpers.isString(error)) {
              error = 'Unexpected error!';
            }
            httpResp.end(JSON.stringify({
              error
            }));
          }
        };
        let body = '';
        const handleData = () => {
          try {
            let opts;
            let result;
            let user = this._getUser({
              request: httpReq,
              response: httpResp
            });
            if (httpReq.headers['x-start'] !== '1') {
              // CHUNK UPLOAD SCENARIO:
              opts = {
                fileId: this.sanitize(httpReq.headers['x-fileid'], 20, 'a')
              };
              if (httpReq.headers['x-eof'] === '1') {
                opts.eof = true;
              } else {
                opts.binData = Buffer.from(body, 'base64');
                opts.chunkId = parseInt(httpReq.headers['x-chunkid']);
              }
              const _continueUpload = this._continueUpload(opts.fileId);
              if (!_continueUpload) {
                throw new Meteor.Error(408, 'Can\'t continue upload, session expired. Start upload again.');
              }
              ({
                result,
                opts
              } = this._prepareUpload(Object.assign(opts, _continueUpload), user.userId, 'HTTP'));
              if (opts.eof) {
                // FINISH UPLOAD SCENARIO:
                this._handleUpload(result, opts, _error => {
                  let error = _error;
                  if (error) {
                    if (!httpResp.headersSent) {
                      httpResp.writeHead(500);
                    }
                    if (!httpResp.finished) {
                      if (helpers.isObject(error) && helpers.isFunction(error.toString)) {
                        error = error.toString();
                      }
                      if (!helpers.isString(error)) {
                        error = 'Unexpected error!';
                      }
                      httpResp.end(JSON.stringify({
                        error
                      }));
                    }
                  }
                  if (!httpResp.headersSent) {
                    httpResp.writeHead(200);
                  }
                  if (helpers.isObject(result.file) && result.file.meta) {
                    result.file.meta = fixJSONStringify(result.file.meta);
                  }
                  if (!httpResp.finished) {
                    httpResp.end(JSON.stringify(result));
                  }
                });
                return;
              }
              this.emit('_handleUpload', result, opts, noop);
              if (!httpResp.headersSent) {
                httpResp.writeHead(204);
              }
              if (!httpResp.finished) {
                httpResp.end();
              }
            } else {
              // START SCENARIO:
              try {
                opts = JSON.parse(body);
              } catch (jsonErr) {
                Meteor._debug('Can\'t parse incoming JSON from Client on [.insert() | upload], something went wrong!', jsonErr);
                opts = {
                  file: {}
                };
              }
              if (!helpers.isObject(opts.file)) {
                opts.file = {};
              }
              if (opts.fileId) {
                opts.fileId = this.sanitize(opts.fileId, 20, 'a');
              }
              this._debug("[FilesCollection] [File Start HTTP] ".concat(opts.file.name || '[no-name]', " - ").concat(opts.fileId));
              if (helpers.isObject(opts.file) && opts.file.meta) {
                opts.file.meta = fixJSONParse(opts.file.meta);
              }
              opts.___s = true;
              ({
                result
              } = this._prepareUpload(helpers.clone(opts), user.userId, 'HTTP Start Method'));
              if (this.collection.findOne(result._id)) {
                throw new Meteor.Error(400, 'Can\'t start upload, data substitution detected!');
              }
              opts._id = opts.fileId;
              opts.createdAt = new Date();
              opts.maxLength = opts.fileLength;
              this._preCollection.insert(helpers.omit(opts, '___s'));
              this._createStream(result._id, result.path, helpers.omit(opts, '___s'));
              if (opts.returnMeta) {
                if (!httpResp.headersSent) {
                  httpResp.writeHead(200);
                }
                if (!httpResp.finished) {
                  httpResp.end(JSON.stringify({
                    uploadRoute: "".concat(this.downloadRoute, "/").concat(this.collectionName, "/__upload"),
                    file: result
                  }));
                }
              } else {
                if (!httpResp.headersSent) {
                  httpResp.writeHead(204);
                }
                if (!httpResp.finished) {
                  httpResp.end();
                }
              }
            }
          } catch (httpRespErr) {
            handleError(httpRespErr);
          }
        };
        httpReq.setTimeout(20000, handleError);
        if (typeof httpReq.body === 'object' && Object.keys(httpReq.body).length !== 0) {
          body = JSON.stringify(httpReq.body);
          handleData();
        } else {
          httpReq.on('data', data => bound(() => {
            body += data;
          }));
          httpReq.on('end', () => bound(() => {
            handleData();
          }));
        }
        return;
      }
      if (!this.disableDownload) {
        let uri;
        if (!this.public) {
          if (httpReq._parsedUrl.path.includes("".concat(this.downloadRoute, "/").concat(this.collectionName))) {
            uri = httpReq._parsedUrl.path.replace("".concat(this.downloadRoute, "/").concat(this.collectionName), '');
            if (uri.indexOf('/') === 0) {
              uri = uri.substring(1);
            }
            const uris = uri.split('/');
            if (uris.length === 3) {
              const params = {
                _id: uris[0],
                query: httpReq._parsedUrl.query ? nodeQs.parse(httpReq._parsedUrl.query) : {},
                name: uris[2].split('?')[0],
                version: uris[1]
              };
              const http = {
                request: httpReq,
                response: httpResp,
                params
              };
              if (this.interceptRequest && helpers.isFunction(this.interceptRequest) && this.interceptRequest(http) === true) {
                return;
              }
              if (this._checkAccess(http)) {
                this.download(http, uris[1], this.collection.findOne(uris[0]));
              }
            } else {
              next();
            }
          } else {
            next();
          }
        } else {
          if (httpReq._parsedUrl.path.includes("".concat(this.downloadRoute))) {
            uri = httpReq._parsedUrl.path.replace("".concat(this.downloadRoute), '');
            if (uri.indexOf('/') === 0) {
              uri = uri.substring(1);
            }
            const uris = uri.split('/');
            let _file = uris[uris.length - 1];
            if (_file) {
              let version;
              if (_file.includes('-')) {
                version = _file.split('-')[0];
                _file = _file.split('-')[1].split('?')[0];
              } else {
                version = 'original';
                _file = _file.split('?')[0];
              }
              const params = {
                query: httpReq._parsedUrl.query ? nodeQs.parse(httpReq._parsedUrl.query) : {},
                file: _file,
                _id: _file.split('.')[0],
                version,
                name: _file
              };
              const http = {
                request: httpReq,
                response: httpResp,
                params
              };
              if (this.interceptRequest && helpers.isFunction(this.interceptRequest) && this.interceptRequest(http) === true) {
                return;
              }
              this.download(http, version, this.collection.findOne(params._id));
            } else {
              next();
            }
          } else {
            next();
          }
        }
        return;
      }
      next();
    });
    if (!this.disableUpload) {
      const _methods = {};

      // Method used to remove file
      // from Client side
      _methods[this._methodNames._Remove] = function (selector) {
        check(selector, Match.OneOf(String, Object));
        self._debug("[FilesCollection] [Unlink Method] [.remove(".concat(selector, ")]"));
        if (self.allowClientCode) {
          if (self.onBeforeRemove && helpers.isFunction(self.onBeforeRemove)) {
            const userId = this.userId;
            const userFuncs = {
              userId: this.userId,
              user() {
                if (Meteor.users) {
                  return Meteor.users.findOne(userId);
                }
                return null;
              }
            };
            if (!self.onBeforeRemove.call(userFuncs, self.find(selector) || null)) {
              throw new Meteor.Error(403, '[FilesCollection] [remove] Not permitted!');
            }
          }
          const cursor = self.find(selector);
          if (cursor.count() > 0) {
            self.remove(selector);
            return true;
          }
          throw new Meteor.Error(404, 'Cursor is empty, no files is removed');
        } else {
          throw new Meteor.Error(405, '[FilesCollection] [remove] Running code on a client is not allowed!');
        }
      };

      // Method used to receive "first byte" of upload
      // and all file's meta-data, so
      // it won't be transferred with every chunk
      // Basically it prepares everything
      // So user can pause/disconnect and
      // continue upload later, during `continueUploadTTL`
      _methods[this._methodNames._Start] = function (opts, returnMeta) {
        check(opts, {
          file: Object,
          fileId: String,
          FSName: Match.Optional(String),
          chunkSize: Number,
          fileLength: Number
        });
        check(returnMeta, Match.Optional(Boolean));
        opts.fileId = self.sanitize(opts.fileId, 20, 'a');
        self._debug("[FilesCollection] [File Start Method] ".concat(opts.file.name, " - ").concat(opts.fileId));
        opts.___s = true;
        const {
          result
        } = self._prepareUpload(helpers.clone(opts), this.userId, 'DDP Start Method');
        if (self.collection.findOne(result._id)) {
          throw new Meteor.Error(400, 'Can\'t start upload, data substitution detected!');
        }
        opts._id = opts.fileId;
        opts.createdAt = new Date();
        opts.maxLength = opts.fileLength;
        try {
          self._preCollection.insert(helpers.omit(opts, '___s'));
          self._createStream(result._id, result.path, helpers.omit(opts, '___s'));
        } catch (e) {
          self._debug("[FilesCollection] [File Start Method] [EXCEPTION:] ".concat(opts.file.name, " - ").concat(opts.fileId), e);
          throw new Meteor.Error(500, 'Can\'t start');
        }
        if (returnMeta) {
          return {
            uploadRoute: "".concat(self.downloadRoute, "/").concat(self.collectionName, "/__upload"),
            file: result
          };
        }
        return true;
      };

      // Method used to write file chunks
      // it receives very limited amount of meta-data
      // This method also responsible for EOF
      _methods[this._methodNames._Write] = function (_opts) {
        let opts = _opts;
        let result;
        check(opts, {
          eof: Match.Optional(Boolean),
          fileId: String,
          binData: Match.Optional(String),
          chunkId: Match.Optional(Number)
        });
        opts.fileId = self.sanitize(opts.fileId, 20, 'a');
        if (opts.binData) {
          opts.binData = Buffer.from(opts.binData, 'base64');
        }
        const _continueUpload = self._continueUpload(opts.fileId);
        if (!_continueUpload) {
          throw new Meteor.Error(408, 'Can\'t continue upload, session expired. Start upload again.');
        }
        this.unblock();
        ({
          result,
          opts
        } = self._prepareUpload(Object.assign(opts, _continueUpload), this.userId, 'DDP'));
        if (opts.eof) {
          try {
            return self._handleUploadSync(result, opts);
          } catch (handleUploadErr) {
            self._debug('[FilesCollection] [Write Method] [DDP] Exception:', handleUploadErr);
            throw handleUploadErr;
          }
        } else {
          self.emit('_handleUpload', result, opts, noop);
        }
        return true;
      };

      // Method used to Abort upload
      // - Freeing memory by ending writableStreams
      // - Removing temporary record from @_preCollection
      // - Removing record from @collection
      // - .unlink()ing chunks from FS
      _methods[this._methodNames._Abort] = function (_id) {
        check(_id, String);
        const _continueUpload = self._continueUpload(_id);
        self._debug("[FilesCollection] [Abort Method]: ".concat(_id, " - ").concat(helpers.isObject(_continueUpload.file) ? _continueUpload.file.path : ''));
        if (self._currentUploads && self._currentUploads[_id]) {
          self._currentUploads[_id].stop();
          self._currentUploads[_id].abort();
        }
        if (_continueUpload) {
          self._preCollection.remove({
            _id
          });
          self.remove({
            _id
          });
          if (helpers.isObject(_continueUpload.file) && _continueUpload.file.path) {
            self.unlink({
              _id,
              path: _continueUpload.file.path
            });
          }
        }
        return true;
      };
      Meteor.methods(_methods);
    }
  }

  /**
   * @locus Server
   * @memberOf FilesCollection
   * @name _prepareUpload
   * @summary Internal method. Used to optimize received data and check upload permission
   * @returns {Object}
   */
  _prepareUpload() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    let userId = arguments.length > 1 ? arguments[1] : undefined;
    let transport = arguments.length > 2 ? arguments[2] : undefined;
    let ctx;
    if (!helpers.isBoolean(opts.eof)) {
      opts.eof = false;
    }
    if (!opts.binData) {
      opts.binData = 'EOF';
    }
    if (!helpers.isNumber(opts.chunkId)) {
      opts.chunkId = -1;
    }
    if (!helpers.isString(opts.FSName)) {
      opts.FSName = opts.fileId;
    }
    this._debug("[FilesCollection] [Upload] [".concat(transport, "] Got #").concat(opts.chunkId, "/").concat(opts.fileLength, " chunks, dst: ").concat(opts.file.name || opts.file.fileName));
    const fileName = this._getFileName(opts.file);
    const {
      extension,
      extensionWithDot
    } = this._getExt(fileName);
    if (!helpers.isObject(opts.file.meta)) {
      opts.file.meta = {};
    }
    let result = opts.file;
    result.name = fileName;
    result.meta = opts.file.meta;
    result.extension = extension;
    result.ext = extension;
    result._id = opts.fileId;
    result.userId = userId || null;
    opts.FSName = this.sanitize(opts.FSName);
    if (this.namingFunction) {
      opts.FSName = this.namingFunction(opts);
    }
    result.path = "".concat(this.storagePath(result)).concat(nodePath.sep).concat(opts.FSName).concat(extensionWithDot);
    result = Object.assign(result, this._dataToSchema(result));
    if (this.onBeforeUpload && helpers.isFunction(this.onBeforeUpload)) {
      ctx = Object.assign({
        file: opts.file
      }, {
        chunkId: opts.chunkId,
        userId: result.userId,
        user() {
          if (Meteor.users && result.userId) {
            return Meteor.users.findOne(result.userId);
          }
          return null;
        },
        eof: opts.eof
      });
      const isUploadAllowed = this.onBeforeUpload.call(ctx, result);
      if (isUploadAllowed !== true) {
        throw new Meteor.Error(403, helpers.isString(isUploadAllowed) ? isUploadAllowed : '@onBeforeUpload() returned false');
      } else {
        if (opts.___s === true && this.onInitiateUpload && helpers.isFunction(this.onInitiateUpload)) {
          this.onInitiateUpload.call(ctx, result);
        }
      }
    } else if (opts.___s === true && this.onInitiateUpload && helpers.isFunction(this.onInitiateUpload)) {
      ctx = Object.assign({
        file: opts.file
      }, {
        chunkId: opts.chunkId,
        userId: result.userId,
        user() {
          if (Meteor.users && result.userId) {
            return Meteor.users.findOne(result.userId);
          }
          return null;
        },
        eof: opts.eof
      });
      this.onInitiateUpload.call(ctx, result);
    }
    return {
      result,
      opts
    };
  }

  /**
   * @locus Server
   * @memberOf FilesCollection
   * @name _finishUpload
   * @summary Internal method. Finish upload, close Writable stream, add record to MongoDB and flush used memory
   * @returns {undefined}
   */
  _finishUpload(result, opts, cb) {
    this._debug("[FilesCollection] [Upload] [finish(ing)Upload] -> ".concat(result.path));
    fs.chmod(result.path, this.permissions, noop);
    result.type = this._getMimeType(opts.file);
    result.public = this.public;
    this._updateFileTypes(result);
    this.collection.insert(helpers.clone(result), (colInsert, _id) => {
      if (colInsert) {
        cb && cb(colInsert);
        this._debug('[FilesCollection] [Upload] [_finishUpload] [insert] Error:', colInsert);
      } else {
        this._preCollection.update({
          _id: opts.fileId
        }, {
          $set: {
            isFinished: true
          }
        }, preUpdateError => {
          if (preUpdateError) {
            cb && cb(preUpdateError);
            this._debug('[FilesCollection] [Upload] [_finishUpload] [update] Error:', preUpdateError);
          } else {
            result._id = _id;
            this._debug("[FilesCollection] [Upload] [finish(ed)Upload] -> ".concat(result.path));
            this.onAfterUpload && this.onAfterUpload.call(this, result);
            this.emit('afterUpload', result);
            cb && cb(null, result);
          }
        });
      }
    });
  }

  /**
   * @locus Server
   * @memberOf FilesCollection
   * @name _handleUpload
   * @summary Internal method to handle upload process, pipe incoming data to Writable stream
   * @returns {undefined}
   */
  _handleUpload(result, opts, cb) {
    try {
      if (opts.eof) {
        this._currentUploads[result._id].end(() => {
          this.emit('_finishUpload', result, opts, cb);
        });
      } else {
        this._currentUploads[result._id].write(opts.chunkId, opts.binData, cb);
      }
    } catch (e) {
      this._debug('[_handleUpload] [EXCEPTION:]', e);
      cb && cb(e);
    }
  }

  /**
   * @locus Anywhere
   * @memberOf FilesCollection
   * @name _getMimeType
   * @param {Object} fileData - File Object
   * @summary Returns file's mime-type
   * @returns {String}
   */
  _getMimeType(fileData) {
    let mime;
    check(fileData, Object);
    if (helpers.isObject(fileData) && fileData.type) {
      mime = fileData.type;
    }
    if (!mime || !helpers.isString(mime)) {
      mime = 'application/octet-stream';
    }
    return mime;
  }

  /**
   * @locus Anywhere
   * @memberOf FilesCollection
   * @name _getUserId
   * @summary Returns `userId` matching the xmtok token derived from Meteor.server.sessions
   * @returns {String}
   */
  _getUserId(xmtok) {
    if (!xmtok) return null;

    // throw an error upon an unexpected type of Meteor.server.sessions in order to identify breaking changes
    if (!Meteor.server.sessions instanceof Map || !helpers.isObject(Meteor.server.sessions)) {
      throw new Error('Received incompatible type of Meteor.server.sessions');
    }
    if (Meteor.server.sessions instanceof Map && Meteor.server.sessions.has(xmtok) && helpers.isObject(Meteor.server.sessions.get(xmtok))) {
      // to be used with >= Meteor 1.8.1 where Meteor.server.sessions is a Map
      return Meteor.server.sessions.get(xmtok).userId;
    } else if (helpers.isObject(Meteor.server.sessions) && xmtok in Meteor.server.sessions && helpers.isObject(Meteor.server.sessions[xmtok])) {
      // to be used with < Meteor 1.8.1 where Meteor.server.sessions is an Object
      return Meteor.server.sessions[xmtok].userId;
    }
    return null;
  }

  /**
   * @locus Anywhere
   * @memberOf FilesCollection
   * @name _getUser
   * @summary Returns object with `userId` and `user()` method which return user's object
   * @returns {Object}
   */
  _getUser() {
    return this.getUser ? this.getUser(...arguments) : this._getUserDefault(...arguments);
  }

  /**
   * @locus Anywhere
   * @memberOf FilesCollection
   * @name _getUserDefault
   * @summary Default way of recognising user based on 'x_mtok' cookie, can be replaced by 'config.getUser' if defnied. Returns object with `userId` and `user()` method which return user's object
   * @returns {Object}
   */
  _getUserDefault(http) {
    const result = {
      user() {
        return null;
      },
      userId: null
    };
    if (http) {
      let mtok = null;
      if (http.request.headers['x-mtok']) {
        mtok = http.request.headers['x-mtok'];
      } else {
        const cookie = http.request.Cookies;
        if (cookie.has('x_mtok')) {
          mtok = cookie.get('x_mtok');
        }
      }
      if (mtok) {
        const userId = this._getUserId(mtok);
        if (userId) {
          result.user = () => Meteor.users.findOne(userId);
          result.userId = userId;
        }
      }
    }
    return result;
  }

  /**
   * @locus Server
   * @memberOf FilesCollection
   * @name write
   * @param {Buffer} buffer - Binary File's Buffer
   * @param {Object} opts - Object with file-data
   * @param {String} opts.name - File name, alias: `fileName`
   * @param {String} opts.type - File mime-type
   * @param {Object} opts.meta - File additional meta-data
   * @param {String} opts.userId - UserId, default *null*
   * @param {String} opts.fileId - _id, sanitized, max-length: 20; default *null*
   * @param {Function} callback - function(error, fileObj){...}
   * @param {Boolean} proceedAfterUpload - Proceed onAfterUpload hook
   * @summary Write buffer to FS and add to FilesCollection Collection
   * @returns {FilesCollection} Instance
   */
  write(buffer) {
    let _opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    let _callback = arguments.length > 2 ? arguments[2] : undefined;
    let _proceedAfterUpload = arguments.length > 3 ? arguments[3] : undefined;
    this._debug('[FilesCollection] [write()]');
    let opts = _opts;
    let callback = _callback;
    let proceedAfterUpload = _proceedAfterUpload;
    if (helpers.isFunction(opts)) {
      proceedAfterUpload = callback;
      callback = opts;
      opts = {};
    } else if (helpers.isBoolean(callback)) {
      proceedAfterUpload = callback;
    } else if (helpers.isBoolean(opts)) {
      proceedAfterUpload = opts;
    }
    check(opts, Match.Optional(Object));
    check(callback, Match.Optional(Function));
    check(proceedAfterUpload, Match.Optional(Boolean));
    opts.fileId = opts.fileId && this.sanitize(opts.fileId, 20, 'a');
    const fileId = opts.fileId || Random.id();
    const fsName = this.namingFunction ? this.namingFunction(opts) : fileId;
    const fileName = opts.name || opts.fileName ? opts.name || opts.fileName : fsName;
    const {
      extension,
      extensionWithDot
    } = this._getExt(fileName);
    opts.path = "".concat(this.storagePath(opts)).concat(nodePath.sep).concat(fsName).concat(extensionWithDot);
    opts.type = this._getMimeType(opts);
    if (!helpers.isObject(opts.meta)) {
      opts.meta = {};
    }
    if (!helpers.isNumber(opts.size)) {
      opts.size = buffer.length;
    }
    const result = this._dataToSchema({
      name: fileName,
      path: opts.path,
      meta: opts.meta,
      type: opts.type,
      size: opts.size,
      userId: opts.userId,
      extension
    });
    result._id = fileId;
    fs.stat(opts.path, (statError, stats) => {
      bound(() => {
        if (statError || !stats.isFile()) {
          const paths = opts.path.split('/');
          paths.pop();
          fs.mkdirSync(paths.join('/'), {
            recursive: true
          });
          fs.writeFileSync(opts.path, '');
        }
        const stream = fs.createWriteStream(opts.path, {
          flags: 'w',
          mode: this.permissions
        });
        stream.end(buffer, streamErr => {
          bound(() => {
            if (streamErr) {
              callback && callback(streamErr);
            } else {
              this.collection.insert(result, (insertErr, _id) => {
                if (insertErr) {
                  callback && callback(insertErr);
                  this._debug("[FilesCollection] [write] [insert] Error: ".concat(fileName, " -> ").concat(this.collectionName), insertErr);
                } else {
                  const fileRef = this.collection.findOne(_id);
                  callback && callback(null, fileRef);
                  if (proceedAfterUpload === true) {
                    this.onAfterUpload && this.onAfterUpload.call(this, fileRef);
                    this.emit('afterUpload', fileRef);
                  }
                  this._debug("[FilesCollection] [write]: ".concat(fileName, " -> ").concat(this.collectionName));
                }
              });
            }
          });
        });
      });
    });
    return this;
  }

  /**
   * @locus Server
   * @memberOf FilesCollection
   * @name load
   * @param {String} url - URL to file
   * @param {Object} [opts] - Object with file-data
   * @param {Object} opts.headers - HTTP headers to use when requesting the file
   * @param {String} opts.name - File name, alias: `fileName`
   * @param {String} opts.type - File mime-type
   * @param {Object} opts.meta - File additional meta-data
   * @param {String} opts.userId - UserId, default *null*
   * @param {String} opts.fileId - _id, sanitized, max-length: 20; default *null*
   * @param {Number} opts.timeout - Timeout in milliseconds, default: 360000 (6 mins)
   * @param {Function} callback - function(error, fileObj){...}
   * @param {Boolean} [proceedAfterUpload] - Proceed onAfterUpload hook
   * @summary Download file over HTTP, write stream to FS, and add to FilesCollection Collection
   * @returns {FilesCollection} Instance
   */
  load(url) {
    let _opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    let _callback = arguments.length > 2 ? arguments[2] : undefined;
    let _proceedAfterUpload = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    this._debug("[FilesCollection] [load(".concat(url, ", ").concat(JSON.stringify(_opts), ", callback)]"));
    let opts = _opts;
    let callback = _callback;
    let proceedAfterUpload = _proceedAfterUpload;
    if (helpers.isFunction(opts)) {
      proceedAfterUpload = callback;
      callback = opts;
      opts = {};
    } else if (helpers.isBoolean(callback)) {
      proceedAfterUpload = callback;
    } else if (helpers.isBoolean(opts)) {
      proceedAfterUpload = opts;
    }
    check(url, String);
    check(opts, Match.Optional(Object));
    check(callback, Match.Optional(Function));
    check(proceedAfterUpload, Match.Optional(Boolean));
    if (!helpers.isObject(opts)) {
      opts = {
        timeout: 360000
      };
    }
    if (!opts.timeout) {
      opts.timeout = 360000;
    }
    const fileId = opts.fileId && this.sanitize(opts.fileId, 20, 'a') || Random.id();
    const fsName = this.namingFunction ? this.namingFunction(opts) : fileId;
    const pathParts = url.split('/');
    const fileName = opts.name || opts.fileName ? opts.name || opts.fileName : pathParts[pathParts.length - 1].split('?')[0] || fsName;
    const {
      extension,
      extensionWithDot
    } = this._getExt(fileName);
    opts.path = "".concat(this.storagePath(opts)).concat(nodePath.sep).concat(fsName).concat(extensionWithDot);
    const storeResult = (result, cb) => {
      result._id = fileId;
      this.collection.insert(result, (error, _id) => {
        if (error) {
          cb && cb(error);
          this._debug("[FilesCollection] [load] [insert] Error: ".concat(fileName, " -> ").concat(this.collectionName), error);
        } else {
          const fileRef = this.collection.findOne(_id);
          cb && cb(null, fileRef);
          if (proceedAfterUpload === true) {
            this.onAfterUpload && this.onAfterUpload.call(this, fileRef);
            this.emit('afterUpload', fileRef);
          }
          this._debug("[FilesCollection] [load] [insert] ".concat(fileName, " -> ").concat(this.collectionName));
        }
      });
    };
    fs.stat(opts.path, (statError, stats) => {
      bound(() => {
        if (statError || !stats.isFile()) {
          const paths = opts.path.split('/');
          paths.pop();
          fs.mkdirSync(paths.join('/'), {
            recursive: true
          });
          fs.writeFileSync(opts.path, '');
        }
        let isEnded = false;
        let timer = null;
        const wStream = fs.createWriteStream(opts.path, {
          flags: 'w',
          mode: this.permissions,
          autoClose: true,
          emitClose: false
        });
        const onEnd = (_error, response) => {
          if (!isEnded) {
            if (timer) {
              Meteor.clearTimeout(timer);
              timer = null;
            }
            isEnded = true;
            if (response && response.status === 200) {
              this._debug("[FilesCollection] [load] Received: ".concat(url));
              const result = this._dataToSchema({
                name: fileName,
                path: opts.path,
                meta: opts.meta,
                type: opts.type || response.headers.get('content-type') || this._getMimeType({
                  path: opts.path
                }),
                size: opts.size || parseInt(response.headers.get('content-length') || 0),
                userId: opts.userId,
                extension
              });
              if (!result.size) {
                fs.stat(opts.path, (statErrorOnEnd, newStats) => {
                  bound(() => {
                    if (statErrorOnEnd) {
                      callback && callback(statErrorOnEnd);
                    } else {
                      result.versions.original.size = result.size = newStats.size;
                      storeResult(result, callback);
                    }
                  });
                });
              } else {
                storeResult(result, callback);
              }
            } else {
              const error = _error || new Meteor.Error((response === null || response === void 0 ? void 0 : response.status) || 408, (response === null || response === void 0 ? void 0 : response.statusText) || 'Bad response with empty details');
              this._debug("[FilesCollection] [load] [fetch(".concat(url, ")] Error:"), error);
              if (!wStream.destroyed) {
                wStream.destroy();
              }
              fs.unlink(opts.path, unlinkError => {
                bound(() => {
                  callback && callback(error);
                  if (unlinkError) {
                    this._debug("[FilesCollection] [load] [fetch(".concat(url, ")] [fs.unlink(").concat(opts.path, ")] unlinkError:"), unlinkError);
                  }
                });
              });
            }
          }
        };
        let resp = void 0;
        wStream.on('error', error => {
          bound(() => {
            onEnd(error);
          });
        });
        wStream.on('close', () => {
          bound(() => {
            onEnd(void 0, resp);
          });
        });
        wStream.on('finish', () => {
          bound(() => {
            onEnd(void 0, resp);
          });
        });
        const controller = new AbortController();
        fetch(url, {
          headers: opts.headers || {},
          signal: controller.signal
        }).then(res => {
          resp = res;
          res.body.on('error', error => {
            bound(() => {
              onEnd(error);
            });
          });
          res.body.pipe(wStream);
        }).catch(fetchError => {
          onEnd(fetchError);
        });
        if (opts.timeout > 0) {
          timer = Meteor.setTimeout(() => {
            onEnd(new Meteor.Error(408, "Request timeout after ".concat(opts.timeout, "ms")));
            controller.abort();
          }, opts.timeout);
        }
      });
    });
    return this;
  }

  /**
   * @locus Server
   * @memberOf FilesCollection
   * @name addFile
   * @param {String} path          - Path to file
   * @param {String} opts          - [Optional] Object with file-data
   * @param {String} opts.type     - [Optional] File mime-type
   * @param {Object} opts.meta     - [Optional] File additional meta-data
   * @param {String} opts.fileId   - _id, sanitized, max-length: 20 symbols default *null*
   * @param {Object} opts.fileName - [Optional] File name, if not specified file name and extension will be taken from path
   * @param {String} opts.userId   - [Optional] UserId, default *null*
   * @param {Function} callback    - [Optional] function(error, fileObj){...}
   * @param {Boolean} proceedAfterUpload - Proceed onAfterUpload hook
   * @summary Add file from FS to FilesCollection
   * @returns {FilesCollection} Instance
   */
  addFile(path) {
    let _opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    let _callback = arguments.length > 2 ? arguments[2] : undefined;
    let _proceedAfterUpload = arguments.length > 3 ? arguments[3] : undefined;
    this._debug("[FilesCollection] [addFile(".concat(path, ")]"));
    let opts = _opts;
    let callback = _callback;
    let proceedAfterUpload = _proceedAfterUpload;
    if (helpers.isFunction(opts)) {
      proceedAfterUpload = callback;
      callback = opts;
      opts = {};
    } else if (helpers.isBoolean(callback)) {
      proceedAfterUpload = callback;
    } else if (helpers.isBoolean(opts)) {
      proceedAfterUpload = opts;
    }
    if (this.public) {
      throw new Meteor.Error(403, 'Can not run [addFile] on public collection! Just Move file to root of your server, then add record to Collection');
    }
    check(path, String);
    check(opts, Match.Optional(Object));
    check(callback, Match.Optional(Function));
    check(proceedAfterUpload, Match.Optional(Boolean));
    fs.stat(path, (statErr, stats) => bound(() => {
      if (statErr) {
        callback && callback(statErr);
      } else if (stats.isFile()) {
        if (!helpers.isObject(opts)) {
          opts = {};
        }
        opts.path = path;
        if (!opts.fileName) {
          const pathParts = path.split(nodePath.sep);
          opts.fileName = path.split(nodePath.sep)[pathParts.length - 1];
        }
        const {
          extension
        } = this._getExt(opts.fileName);
        if (!helpers.isString(opts.type)) {
          opts.type = this._getMimeType(opts);
        }
        if (!helpers.isObject(opts.meta)) {
          opts.meta = {};
        }
        if (!helpers.isNumber(opts.size)) {
          opts.size = stats.size;
        }
        const result = this._dataToSchema({
          name: opts.fileName,
          path,
          meta: opts.meta,
          type: opts.type,
          size: opts.size,
          userId: opts.userId,
          extension,
          _storagePath: path.replace("".concat(nodePath.sep).concat(opts.fileName), ''),
          fileId: opts.fileId && this.sanitize(opts.fileId, 20, 'a') || null
        });
        this.collection.insert(result, (insertErr, _id) => {
          if (insertErr) {
            callback && callback(insertErr);
            this._debug("[FilesCollection] [addFile] [insert] Error: ".concat(result.name, " -> ").concat(this.collectionName), insertErr);
          } else {
            const fileRef = this.collection.findOne(_id);
            callback && callback(null, fileRef);
            if (proceedAfterUpload === true) {
              this.onAfterUpload && this.onAfterUpload.call(this, fileRef);
              this.emit('afterUpload', fileRef);
            }
            this._debug("[FilesCollection] [addFile]: ".concat(result.name, " -> ").concat(this.collectionName));
          }
        });
      } else {
        callback && callback(new Meteor.Error(400, "[FilesCollection] [addFile(".concat(path, ")]: File does not exist")));
      }
    }));
    return this;
  }

  /**
   * @locus Anywhere
   * @memberOf FilesCollection
   * @name remove
   * @param {String|Object} selector - Mongo-Style selector (http://docs.meteor.com/api/collections.html#selectors)
   * @param {Function} callback - Callback with one `error` argument
   * @summary Remove documents from the collection
   * @returns {FilesCollection} Instance
   */
  remove(selector, callback) {
    this._debug("[FilesCollection] [remove(".concat(JSON.stringify(selector), ")]"));
    if (selector === void 0) {
      return 0;
    }
    check(callback, Match.Optional(Function));
    const files = this.collection.find(selector);
    if (files.count() > 0) {
      files.forEach(file => {
        this.unlink(file);
      });
    } else {
      callback && callback(new Meteor.Error(404, 'Cursor is empty, no files is removed'));
      return this;
    }
    if (this.onAfterRemove) {
      const docs = files.fetch();
      const self = this;
      this.collection.remove(selector, function () {
        callback && callback.apply(this, arguments);
        self.onAfterRemove(docs);
      });
    } else {
      this.collection.remove(selector, callback || noop);
    }
    return this;
  }

  /**
   * @locus Server
   * @memberOf FilesCollection
   * @name deny
   * @param {Object} rules
   * @see  https://docs.meteor.com/api/collections.html#Mongo-Collection-deny
   * @summary link Mongo.Collection deny methods
   * @returns {Mongo.Collection} Instance
   */
  deny(rules) {
    this.collection.deny(rules);
    return this.collection;
  }

  /**
   * @locus Server
   * @memberOf FilesCollection
   * @name allow
   * @param {Object} rules
   * @see https://docs.meteor.com/api/collections.html#Mongo-Collection-allow
   * @summary link Mongo.Collection allow methods
   * @returns {Mongo.Collection} Instance
   */
  allow(rules) {
    this.collection.allow(rules);
    return this.collection;
  }

  /**
   * @locus Server
   * @memberOf FilesCollection
   * @name denyClient
   * @see https://docs.meteor.com/api/collections.html#Mongo-Collection-deny
   * @summary Shorthands for Mongo.Collection deny method
   * @returns {Mongo.Collection} Instance
   */
  denyClient() {
    this.collection.deny({
      insert() {
        return true;
      },
      update() {
        return true;
      },
      remove() {
        return true;
      }
    });
    return this.collection;
  }

  /**
   * @locus Server
   * @memberOf FilesCollection
   * @name allowClient
   * @see https://docs.meteor.com/api/collections.html#Mongo-Collection-allow
   * @summary Shorthands for Mongo.Collection allow method
   * @returns {Mongo.Collection} Instance
   */
  allowClient() {
    this.collection.allow({
      insert() {
        return true;
      },
      update() {
        return true;
      },
      remove() {
        return true;
      }
    });
    return this.collection;
  }

  /**
   * @locus Server
   * @memberOf FilesCollection
   * @name unlink
   * @param {Object} fileRef - fileObj
   * @param {String} version - [Optional] file's version
   * @param {Function} callback - [Optional] callback function
   * @summary Unlink files and it's versions from FS
   * @returns {FilesCollection} Instance
   */
  unlink(fileRef, version, callback) {
    this._debug("[FilesCollection] [unlink(".concat(fileRef._id, ", ").concat(version, ")]"));
    if (version) {
      if (helpers.isObject(fileRef.versions) && helpers.isObject(fileRef.versions[version]) && fileRef.versions[version].path) {
        fs.unlink(fileRef.versions[version].path, callback || noop);
      }
    } else {
      if (helpers.isObject(fileRef.versions)) {
        for (let vKey in fileRef.versions) {
          if (fileRef.versions[vKey] && fileRef.versions[vKey].path) {
            fs.unlink(fileRef.versions[vKey].path, callback || noop);
          }
        }
      } else {
        fs.unlink(fileRef.path, callback || noop);
      }
    }
    return this;
  }

  /**
   * @locus Server
   * @memberOf FilesCollection
   * @name _404
   * @summary Internal method, used to return 404 error
   * @returns {undefined}
   */
  _404(http) {
    this._debug("[FilesCollection] [download(".concat(http.request.originalUrl, ")] [_404] File not found"));
    const text = 'File Not Found :(';
    if (!http.response.headersSent) {
      http.response.writeHead(404, {
        'Content-Type': 'text/plain',
        'Content-Length': text.length
      });
    }
    if (!http.response.finished) {
      http.response.end(text);
    }
  }

  /**
   * @locus Server
   * @memberOf FilesCollection
   * @name download
   * @param {Object} http    - Server HTTP object
   * @param {String} version - Requested file version
   * @param {Object} fileRef - Requested file Object
   * @summary Initiates the HTTP response
   * @returns {undefined}
   */
  download(http) {
    let version = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'original';
    let fileRef = arguments.length > 2 ? arguments[2] : undefined;
    let vRef;
    this._debug("[FilesCollection] [download(".concat(http.request.originalUrl, ", ").concat(version, ")]"));
    if (fileRef) {
      if (helpers.has(fileRef, 'versions') && helpers.has(fileRef.versions, version)) {
        vRef = fileRef.versions[version];
        vRef._id = fileRef._id;
      } else {
        vRef = fileRef;
      }
    } else {
      vRef = false;
    }
    if (!vRef || !helpers.isObject(vRef)) {
      return this._404(http);
    } else if (fileRef) {
      if (helpers.isFunction(this.downloadCallback) && !this.downloadCallback.call(Object.assign(http, this._getUser(http)), fileRef)) {
        return this._404(http);
      }
      if (this.interceptDownload && helpers.isFunction(this.interceptDownload) && this.interceptDownload(http, fileRef, version) === true) {
        return void 0;
      }
      fs.stat(vRef.path, (statErr, stats) => bound(() => {
        let responseType;
        if (statErr || !stats.isFile()) {
          return this._404(http);
        }
        if (stats.size !== vRef.size && !this.integrityCheck) {
          vRef.size = stats.size;
        }
        if (stats.size !== vRef.size && this.integrityCheck) {
          responseType = '400';
        }
        return this.serve(http, fileRef, vRef, version, null, responseType || '200');
      }));
      return void 0;
    }
    return this._404(http);
  }

  /**
   * @locus Server
   * @memberOf FilesCollection
   * @name serve
   * @param {Object} http    - Server HTTP object
   * @param {Object} fileRef - Requested file Object
   * @param {Object} vRef    - Requested file version Object
   * @param {String} version - Requested file version
   * @param {stream.Readable|null} readableStream - Readable stream, which serves binary file data
   * @param {String} responseType - Response code
   * @param {Boolean} force200 - Force 200 response code over 206
   * @summary Handle and reply to incoming request
   * @returns {undefined}
   */
  serve(http, fileRef, vRef) {
    let version = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'original';
    let readableStream = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
    let _responseType = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : '200';
    let force200 = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : false;
    let partiral = false;
    let reqRange = false;
    let dispositionType = '';
    let start;
    let end;
    let take;
    let responseType = _responseType;
    if (http.params.query.download && http.params.query.download === 'true') {
      dispositionType = 'attachment; ';
    } else {
      dispositionType = 'inline; ';
    }
    const dispositionName = "filename=\"".concat(encodeURI(vRef.name || fileRef.name).replace(/\,/g, '%2C'), "\"; filename*=UTF-8''").concat(encodeURIComponent(vRef.name || fileRef.name), "; ");
    const dispositionEncoding = 'charset=UTF-8';
    if (!http.response.headersSent) {
      http.response.setHeader('Content-Disposition', dispositionType + dispositionName + dispositionEncoding);
    }
    if (http.request.headers.range && !force200) {
      partiral = true;
      const array = http.request.headers.range.split(/bytes=([0-9]*)-([0-9]*)/);
      start = parseInt(array[1]);
      end = parseInt(array[2]);
      if (isNaN(end)) {
        end = vRef.size - 1;
      }
      take = end - start;
    } else {
      start = 0;
      end = vRef.size - 1;
      take = vRef.size;
    }
    if (partiral || http.params.query.play && http.params.query.play === 'true') {
      reqRange = {
        start,
        end
      };
      if (isNaN(start) && !isNaN(end)) {
        reqRange.start = end - take;
        reqRange.end = end;
      }
      if (!isNaN(start) && isNaN(end)) {
        reqRange.start = start;
        reqRange.end = start + take;
      }
      if (start + take >= vRef.size) {
        reqRange.end = vRef.size - 1;
      }
      if (this.strict && (reqRange.start >= vRef.size - 1 || reqRange.end > vRef.size - 1)) {
        responseType = '416';
      } else {
        responseType = '206';
      }
    } else {
      responseType = '200';
    }
    const streamErrorHandler = error => {
      this._debug("[FilesCollection] [serve(".concat(vRef.path, ", ").concat(version, ")] [500]"), error);
      if (!http.response.finished) {
        http.response.end(error.toString());
      }
    };
    const headers = helpers.isFunction(this.responseHeaders) ? this.responseHeaders(responseType, fileRef, vRef, version, http) : this.responseHeaders;
    if (!headers['Cache-Control']) {
      if (!http.response.headersSent) {
        http.response.setHeader('Cache-Control', this.cacheControl);
      }
    }
    for (let key in headers) {
      if (!http.response.headersSent) {
        http.response.setHeader(key, headers[key]);
      }
    }
    const respond = (stream, code) => {
      stream._isEnded = false;
      const closeStreamCb = closeError => {
        if (!closeError) {
          stream._isEnded = true;
        } else {
          this._debug("[FilesCollection] [serve(".concat(vRef.path, ", ").concat(version, ")] [respond] [closeStreamCb] (this is error on the stream we wish to forcefully close after it isn't needed anymore. It's okay that it throws errors. Consider this as purely informational message)"), closeError);
        }
      };
      const closeStream = () => {
        if (!stream._isEnded && !stream.destroyed) {
          try {
            if (typeof stream.close === 'function') {
              stream.close(closeStreamCb);
            } else if (typeof stream.end === 'function') {
              stream.end(closeStreamCb);
            } else if (typeof stream.destroy === 'function') {
              stream.destroy('Got to close this stream', closeStreamCb);
            }
          } catch (closeStreamError) {
            // Perhaps one of the method has thrown an error
            // or stream has been already ended/closed/exhausted
          }
        }
      };
      if (!http.response.headersSent && readableStream) {
        http.response.writeHead(code);
      }
      http.request.on('aborted', () => {
        http.request.aborted = true;
      });
      stream.on('open', () => {
        if (!http.response.headersSent) {
          http.response.writeHead(code);
        }
      }).on('abort', () => {
        closeStream();
        if (!http.response.finished) {
          http.response.end();
        }
        if (!http.request.aborted) {
          http.request.destroy();
        }
      }).on('error', err => {
        closeStream();
        streamErrorHandler(err);
      }).on('end', () => {
        if (!http.response.finished) {
          http.response.end();
        }
      }).pipe(http.response);
    };
    switch (responseType) {
      case '400':
        this._debug("[FilesCollection] [serve(".concat(vRef.path, ", ").concat(version, ")] [400] Content-Length mismatch!"));
        var text = 'Content-Length mismatch!';
        if (!http.response.headersSent) {
          http.response.writeHead(400, {
            'Content-Type': 'text/plain',
            'Content-Length': text.length
          });
        }
        if (!http.response.finished) {
          http.response.end(text);
        }
        break;
      case '404':
        this._404(http);
        break;
      case '416':
        this._debug("[FilesCollection] [serve(".concat(vRef.path, ", ").concat(version, ")] [416] Content-Range is not specified!"));
        if (!http.response.headersSent) {
          http.response.writeHead(416);
        }
        if (!http.response.finished) {
          http.response.end();
        }
        break;
      case '206':
        this._debug("[FilesCollection] [serve(".concat(vRef.path, ", ").concat(version, ")] [206]"));
        if (!http.response.headersSent) {
          http.response.setHeader('Content-Range', "bytes ".concat(reqRange.start, "-").concat(reqRange.end, "/").concat(vRef.size));
        }
        respond(readableStream || fs.createReadStream(vRef.path, {
          start: reqRange.start,
          end: reqRange.end
        }), 206);
        break;
      default:
        if (!http.response.headersSent) {
          http.response.setHeader('Content-Length', "".concat(vRef.size));
        }
        this._debug("[FilesCollection] [serve(".concat(vRef.path, ", ").concat(version, ")] [200]"));
        respond(readableStream || fs.createReadStream(vRef.path), 200);
        break;
    }
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"core.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ostrio_files/core.js                                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => FilesCollectionCore
});
let EventEmitter;
module.link("eventemitter3", {
  EventEmitter(v) {
    EventEmitter = v;
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
let formatFleURL, helpers;
module.link("./lib.js", {
  formatFleURL(v) {
    formatFleURL = v;
  },
  helpers(v) {
    helpers = v;
  }
}, 2);
let FilesCursor, FileCursor;
module.link("./cursor.js", {
  FilesCursor(v) {
    FilesCursor = v;
  },
  FileCursor(v) {
    FileCursor = v;
  }
}, 3);
class FilesCollectionCore extends EventEmitter {
  constructor() {
    super();
  }
  /*
   * @locus Anywhere
   * @memberOf FilesCollectionCore
   * @name _debug
   * @summary Print logs in debug mode
   * @returns {void}
   */
  _debug() {
    if (this.debug) {
      (console.info || console.log || function () {}).apply(void 0, arguments);
    }
  }

  /*
   * @locus Anywhere
   * @memberOf FilesCollectionCore
   * @name _getFileName
   * @param {Object} fileData - File Object
   * @summary Returns file's name
   * @returns {String}
   */
  _getFileName(fileData) {
    const fileName = fileData.name || fileData.fileName;
    if (helpers.isString(fileName) && fileName.length > 0) {
      return (fileData.name || fileData.fileName).replace(/^\.\.+/, '').replace(/\.{2,}/g, '.').replace(/\//g, '');
    }
    return '';
  }

  /*
   * @locus Anywhere
   * @memberOf FilesCollectionCore
   * @name _getExt
   * @param {String} FileName - File name
   * @summary Get extension from FileName
   * @returns {Object}
   */
  _getExt(fileName) {
    if (fileName.includes('.')) {
      const extension = (fileName.split('.').pop().split('?')[0] || '').toLowerCase().replace(/([^a-z0-9\-\_\.]+)/gi, '').substring(0, 20);
      return {
        ext: extension,
        extension,
        extensionWithDot: ".".concat(extension)
      };
    }
    return {
      ext: '',
      extension: '',
      extensionWithDot: ''
    };
  }

  /*
   * @locus Anywhere
   * @memberOf FilesCollectionCore
   * @name _updateFileTypes
   * @param {Object} data - File data
   * @summary Internal method. Classify file based on 'type' field
   */
  _updateFileTypes(data) {
    data.isVideo = /^video\//i.test(data.type);
    data.isAudio = /^audio\//i.test(data.type);
    data.isImage = /^image\//i.test(data.type);
    data.isText = /^text\//i.test(data.type);
    data.isJSON = /^application\/json$/i.test(data.type);
    data.isPDF = /^application\/(x-)?pdf$/i.test(data.type);
  }

  /*
   * @locus Anywhere
   * @memberOf FilesCollectionCore
   * @name _dataToSchema
   * @param {Object} data - File data
   * @summary Internal method. Build object in accordance with default schema from File data
   * @returns {Object}
   */
  _dataToSchema(data) {
    const ds = {
      name: data.name,
      extension: data.extension,
      ext: data.extension,
      extensionWithDot: ".".concat(data.extension),
      path: data.path,
      meta: data.meta,
      type: data.type,
      mime: data.type,
      'mime-type': data.type,
      size: data.size,
      userId: data.userId || null,
      versions: {
        original: {
          path: data.path,
          size: data.size,
          type: data.type,
          extension: data.extension
        }
      },
      _downloadRoute: data._downloadRoute || this.downloadRoute,
      _collectionName: data._collectionName || this.collectionName
    };

    //Optional fileId
    if (data.fileId) {
      ds._id = data.fileId;
    }
    this._updateFileTypes(ds);
    ds._storagePath = data._storagePath || this.storagePath(Object.assign({}, data, ds));
    return ds;
  }

  /*
   * @locus Anywhere
   * @memberOf FilesCollectionCore
   * @name findOne
   * @param {String|Object} selector - Mongo-Style selector (http://docs.meteor.com/api/collections.html#selectors)
   * @param {Object} options - Mongo-Style selector Options (http://docs.meteor.com/api/collections.html#sortspecifiers)
   * @summary Find and return Cursor for matching document Object
   * @returns {FileCursor} Instance
   */
  findOne() {
    let selector = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    let options = arguments.length > 1 ? arguments[1] : undefined;
    this._debug("[FilesCollection] [findOne(".concat(JSON.stringify(selector), ", ").concat(JSON.stringify(options), ")]"));
    check(selector, Match.Optional(Match.OneOf(Object, String, Boolean, Number, null)));
    check(options, Match.Optional(Object));
    const doc = this.collection.findOne(selector, options);
    if (doc) {
      return new FileCursor(doc, this);
    }
    return doc;
  }

  /*
   * @locus Anywhere
   * @memberOf FilesCollectionCore
   * @name find
   * @param {String|Object} selector - Mongo-Style selector (http://docs.meteor.com/api/collections.html#selectors)
   * @param {Object}        options  - Mongo-Style selector Options (http://docs.meteor.com/api/collections.html#sortspecifiers)
   * @summary Find and return Cursor for matching documents
   * @returns {FilesCursor} Instance
   */
  find() {
    let selector = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    let options = arguments.length > 1 ? arguments[1] : undefined;
    this._debug("[FilesCollection] [find(".concat(JSON.stringify(selector), ", ").concat(JSON.stringify(options), ")]"));
    check(selector, Match.Optional(Match.OneOf(Object, String, Boolean, Number, null)));
    check(options, Match.Optional(Object));
    return new FilesCursor(selector, options, this);
  }

  /*
   * @locus Anywhere
   * @memberOf FilesCollectionCore
   * @name update
   * @see http://docs.meteor.com/#/full/update
   * @summary link Mongo.Collection update method
   * @returns {Mongo.Collection} Instance
   */
  update() {
    this.collection.update.apply(this.collection, arguments);
    return this.collection;
  }

  /*
   * @locus Anywhere
   * @memberOf FilesCollectionCore
   * @name link
   * @param {Object} fileRef - File reference object
   * @param {String} version - Version of file you would like to request
   * @param {String} uriBase - [Optional] URI base, see - https://github.com/veliovgroup/Meteor-Files/issues/626
   * @summary Returns downloadable URL
   * @returns {String} Empty string returned in case if file not found in DB
   */
  link(fileRef) {
    let version = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'original';
    let uriBase = arguments.length > 2 ? arguments[2] : undefined;
    this._debug("[FilesCollection] [link(".concat(helpers.isObject(fileRef) ? fileRef._id : void 0, ", ").concat(version, ")]"));
    check(fileRef, Object);
    if (!fileRef) {
      return '';
    }
    return formatFleURL(fileRef, version, uriBase);
  }
}
FilesCollectionCore.__helpers = helpers;
FilesCollectionCore.schema = {
  _id: {
    type: String
  },
  size: {
    type: Number
  },
  name: {
    type: String
  },
  type: {
    type: String
  },
  path: {
    type: String
  },
  isVideo: {
    type: Boolean
  },
  isAudio: {
    type: Boolean
  },
  isImage: {
    type: Boolean
  },
  isText: {
    type: Boolean
  },
  isJSON: {
    type: Boolean
  },
  isPDF: {
    type: Boolean
  },
  extension: {
    type: String,
    optional: true
  },
  ext: {
    type: String,
    optional: true
  },
  extensionWithDot: {
    type: String,
    optional: true
  },
  mime: {
    type: String,
    optional: true
  },
  'mime-type': {
    type: String,
    optional: true
  },
  _storagePath: {
    type: String
  },
  _downloadRoute: {
    type: String
  },
  _collectionName: {
    type: String
  },
  public: {
    type: Boolean,
    optional: true
  },
  meta: {
    type: Object,
    blackbox: true,
    optional: true
  },
  userId: {
    type: String,
    optional: true
  },
  updatedAt: {
    type: Date,
    optional: true
  },
  versions: {
    type: Object,
    blackbox: true
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"cursor.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ostrio_files/cursor.js                                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  FileCursor: () => FileCursor,
  FilesCursor: () => FilesCursor
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 0);
class FileCursor {
  constructor(_fileRef, _collection) {
    this._fileRef = _fileRef;
    this._collection = _collection;
    Object.assign(this, _fileRef);
  }

  /*
   * @locus Anywhere
   * @memberOf FileCursor
   * @name remove
   * @param callback {Function} - Triggered asynchronously after item is removed or failed to be removed
   * @summary Remove document
   * @returns {FileCursor}
   */
  remove(callback) {
    this._collection._debug('[FilesCollection] [FileCursor] [remove()]');
    if (this._fileRef) {
      this._collection.remove(this._fileRef._id, callback);
    } else {
      callback && callback(new Meteor.Error(404, 'No such file'));
    }
    return this;
  }

  /*
   * @locus Anywhere
   * @memberOf FileCursor
   * @name link
   * @param version {String} - Name of file's subversion
   * @param uriBase {String} - [Optional] URI base, see - https://github.com/veliovgroup/Meteor-Files/issues/626
   * @summary Returns downloadable URL to File
   * @returns {String}
   */
  link() {
    let version = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'original';
    let uriBase = arguments.length > 1 ? arguments[1] : undefined;
    this._collection._debug("[FilesCollection] [FileCursor] [link(".concat(version, ")]"));
    if (this._fileRef) {
      return this._collection.link(this._fileRef, version, uriBase);
    }
    return '';
  }

  /*
   * @locus Anywhere
   * @memberOf FileCursor
   * @name get
   * @param property {String} - Name of sub-object property
   * @summary Returns current document as a plain Object, if `property` is specified - returns value of sub-object property
   * @returns {Object|mix}
   */
  get(property) {
    this._collection._debug("[FilesCollection] [FileCursor] [get(".concat(property, ")]"));
    if (property) {
      return this._fileRef[property];
    }
    return this._fileRef;
  }

  /*
   * @locus Anywhere
   * @memberOf FileCursor
   * @name fetch
   * @summary Returns document as plain Object in Array
   * @returns {[Object]}
   */
  fetch() {
    this._collection._debug('[FilesCollection] [FileCursor] [fetch()]');
    return [this._fileRef];
  }

  /*
   * @locus Anywhere
   * @memberOf FileCursor
   * @name with
   * @summary Returns reactive version of current FileCursor, useful to use with `{{#with}}...{{/with}}` block template helper
   * @returns {[Object]}
   */
  with() {
    this._collection._debug('[FilesCollection] [FileCursor] [with()]');
    return Object.assign(this, this._collection.collection.findOne(this._fileRef._id));
  }
}
class FilesCursor {
  constructor() {
    let _selector = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    let options = arguments.length > 1 ? arguments[1] : undefined;
    let _collection = arguments.length > 2 ? arguments[2] : undefined;
    this._collection = _collection;
    this._selector = _selector;
    this._current = -1;
    this.cursor = this._collection.collection.find(this._selector, options);
  }

  /*
   * @locus Anywhere
   * @memberOf FilesCursor
   * @name get
   * @summary Returns all matching document(s) as an Array. Alias of `.fetch()`
   * @returns {[Object]}
   */
  get() {
    this._collection._debug('[FilesCollection] [FilesCursor] [get()]');
    return this.cursor.fetch();
  }

  /*
   * @locus Anywhere
   * @memberOf FilesCursor
   * @name hasNext
   * @summary Returns `true` if there is next item available on Cursor
   * @returns {Boolean}
   */
  hasNext() {
    this._collection._debug('[FilesCollection] [FilesCursor] [hasNext()]');
    return this._current < this.cursor.count() - 1;
  }

  /*
   * @locus Anywhere
   * @memberOf FilesCursor
   * @name next
   * @summary Returns next item on Cursor, if available
   * @returns {Object|undefined}
   */
  next() {
    this._collection._debug('[FilesCollection] [FilesCursor] [next()]');
    this.cursor.fetch()[++this._current];
  }

  /*
   * @locus Anywhere
   * @memberOf FilesCursor
   * @name hasPrevious
   * @summary Returns `true` if there is previous item available on Cursor
   * @returns {Boolean}
   */
  hasPrevious() {
    this._collection._debug('[FilesCollection] [FilesCursor] [hasPrevious()]');
    return this._current !== -1;
  }

  /*
   * @locus Anywhere
   * @memberOf FilesCursor
   * @name previous
   * @summary Returns previous item on Cursor, if available
   * @returns {Object|undefined}
   */
  previous() {
    this._collection._debug('[FilesCollection] [FilesCursor] [previous()]');
    this.cursor.fetch()[--this._current];
  }

  /*
   * @locus Anywhere
   * @memberOf FilesCursor
   * @name fetch
   * @summary Returns all matching document(s) as an Array.
   * @returns {[Object]}
   */
  fetch() {
    this._collection._debug('[FilesCollection] [FilesCursor] [fetch()]');
    return this.cursor.fetch() || [];
  }

  /*
   * @locus Anywhere
   * @memberOf FilesCursor
   * @name first
   * @summary Returns first item on Cursor, if available
   * @returns {Object|undefined}
   */
  first() {
    this._collection._debug('[FilesCollection] [FilesCursor] [first()]');
    this._current = 0;
    return this.fetch()[this._current];
  }

  /*
   * @locus Anywhere
   * @memberOf FilesCursor
   * @name last
   * @summary Returns last item on Cursor, if available
   * @returns {Object|undefined}
   */
  last() {
    this._collection._debug('[FilesCollection] [FilesCursor] [last()]');
    this._current = this.count() - 1;
    return this.fetch()[this._current];
  }

  /*
   * @locus Anywhere
   * @memberOf FilesCursor
   * @name count
   * @summary Returns the number of documents that match a query
   * @returns {Number}
   */
  count() {
    this._collection._debug('[FilesCollection] [FilesCursor] [count()]');
    return this.cursor.count();
  }

  /*
   * @locus Anywhere
   * @memberOf FilesCursor
   * @name remove
   * @param callback {Function} - Triggered asynchronously after item is removed or failed to be removed
   * @summary Removes all documents that match a query
   * @returns {FilesCursor}
   */
  remove(callback) {
    this._collection._debug('[FilesCollection] [FilesCursor] [remove()]');
    this._collection.remove(this._selector, callback);
    return this;
  }

  /*
   * @locus Anywhere
   * @memberOf FilesCursor
   * @name forEach
   * @param callback {Function} - Function to call. It will be called with three arguments: the `file`, a 0-based index, and cursor itself
   * @param context {Object} - An object which will be the value of `this` inside `callback`
   * @summary Call `callback` once for each matching document, sequentially and synchronously.
   * @returns {undefined}
   */
  forEach(callback) {
    let context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    this._collection._debug('[FilesCollection] [FilesCursor] [forEach()]');
    this.cursor.forEach(callback, context);
  }

  /*
   * @locus Anywhere
   * @memberOf FilesCursor
   * @name each
   * @summary Returns an Array of FileCursor made for each document on current cursor
   *          Useful when using in {{#each FilesCursor#each}}...{{/each}} block template helper
   * @returns {[FileCursor]}
   */
  each() {
    return this.map(file => {
      return new FileCursor(file, this._collection);
    });
  }

  /*
   * @locus Anywhere
   * @memberOf FilesCursor
   * @name map
   * @param callback {Function} - Function to call. It will be called with three arguments: the `file`, a 0-based index, and cursor itself
   * @param context {Object} - An object which will be the value of `this` inside `callback`
   * @summary Map `callback` over all matching documents. Returns an Array.
   * @returns {Array}
   */
  map(callback) {
    let context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    this._collection._debug('[FilesCollection] [FilesCursor] [map()]');
    return this.cursor.map(callback, context);
  }

  /*
   * @locus Anywhere
   * @memberOf FilesCursor
   * @name current
   * @summary Returns current item on Cursor, if available
   * @returns {Object|undefined}
   */
  current() {
    this._collection._debug('[FilesCollection] [FilesCursor] [current()]');
    if (this._current < 0) {
      this._current = 0;
    }
    return this.fetch()[this._current];
  }

  /*
   * @locus Anywhere
   * @memberOf FilesCursor
   * @name observe
   * @param callbacks {Object} - Functions to call to deliver the result set as it changes
   * @summary Watch a query. Receive callbacks as the result set changes.
   * @url http://docs.meteor.com/api/collections.html#Mongo-Cursor-observe
   * @returns {Object} - live query handle
   */
  observe(callbacks) {
    this._collection._debug('[FilesCollection] [FilesCursor] [observe()]');
    return this.cursor.observe(callbacks);
  }

  /*
   * @locus Anywhere
   * @memberOf FilesCursor
   * @name observeChanges
   * @param callbacks {Object} - Functions to call to deliver the result set as it changes
   * @summary Watch a query. Receive callbacks as the result set changes. Only the differences between the old and new documents are passed to the callbacks.
   * @url http://docs.meteor.com/api/collections.html#Mongo-Cursor-observeChanges
   * @returns {Object} - live query handle
   */
  observeChanges(callbacks) {
    this._collection._debug('[FilesCollection] [FilesCursor] [observeChanges()]');
    return this.cursor.observeChanges(callbacks);
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ostrio_files/lib.js                                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  fixJSONParse: () => fixJSONParse,
  fixJSONStringify: () => fixJSONStringify,
  formatFleURL: () => formatFleURL,
  helpers: () => helpers
});
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }
}, 0);
const helpers = {
  sanitize() {
    let str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    let max = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 28;
    let replacement = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '-';
    return str.replace(/([^a-z0-9\-\_]+)/gi, replacement).substring(0, max);
  },
  isUndefined(obj) {
    return obj === void 0;
  },
  isObject(obj) {
    if (this.isArray(obj) || this.isFunction(obj)) {
      return false;
    }
    return obj === Object(obj);
  },
  isArray(obj) {
    return Array.isArray(obj);
  },
  isBoolean(obj) {
    return obj === true || obj === false || Object.prototype.toString.call(obj) === '[object Boolean]';
  },
  isFunction(obj) {
    return typeof obj === 'function' || false;
  },
  isDate(date) {
    return !Number.isNaN(new Date(date).getDate());
  },
  isEmpty(obj) {
    if (this.isDate(obj)) {
      return false;
    }
    if (this.isObject(obj)) {
      return !Object.keys(obj).length;
    }
    if (this.isArray(obj) || this.isString(obj)) {
      return !obj.length;
    }
    return false;
  },
  clone(obj) {
    if (!this.isObject(obj)) return obj;
    return this.isArray(obj) ? obj.slice() : Object.assign({}, obj);
  },
  has(_obj, path) {
    let obj = _obj;
    if (!this.isObject(obj)) {
      return false;
    }
    if (!this.isArray(path)) {
      return this.isObject(obj) && Object.prototype.hasOwnProperty.call(obj, path);
    }
    const length = path.length;
    for (let i = 0; i < length; i++) {
      if (!Object.prototype.hasOwnProperty.call(obj, path[i])) {
        return false;
      }
      obj = obj[path[i]];
    }
    return !!length;
  },
  omit(obj) {
    const clear = Object.assign({}, obj);
    for (var _len = arguments.length, keys = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      keys[_key - 1] = arguments[_key];
    }
    for (let i = keys.length - 1; i >= 0; i--) {
      delete clear[keys[i]];
    }
    return clear;
  },
  now: Date.now,
  throttle(func, wait) {
    let options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    let previous = 0;
    let timeout = null;
    let result;
    const that = this;
    let self;
    let args;
    const later = () => {
      previous = options.leading === false ? 0 : that.now();
      timeout = null;
      result = func.apply(self, args);
      if (!timeout) {
        self = args = null;
      }
    };
    const throttled = function () {
      const now = that.now();
      if (!previous && options.leading === false) previous = now;
      const remaining = wait - (now - previous);
      self = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(self, args);
        if (!timeout) {
          self = args = null;
        }
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
    throttled.cancel = () => {
      clearTimeout(timeout);
      previous = 0;
      timeout = self = args = null;
    };
    return throttled;
  }
};
const _helpers = ['String', 'Number', 'Date'];
for (let i = 0; i < _helpers.length; i++) {
  helpers['is' + _helpers[i]] = function (obj) {
    return Object.prototype.toString.call(obj) === "[object ".concat(_helpers[i], "]");
  };
}

/*
 * @const {Function} fixJSONParse - Fix issue with Date parse
 */
const fixJSONParse = function (obj) {
  for (let key in obj) {
    if (helpers.isString(obj[key]) && obj[key].includes('=--JSON-DATE--=')) {
      obj[key] = obj[key].replace('=--JSON-DATE--=', '');
      obj[key] = new Date(parseInt(obj[key]));
    } else if (helpers.isObject(obj[key])) {
      obj[key] = fixJSONParse(obj[key]);
    } else if (helpers.isArray(obj[key])) {
      let v;
      for (let i = 0; i < obj[key].length; i++) {
        v = obj[key][i];
        if (helpers.isObject(v)) {
          obj[key][i] = fixJSONParse(v);
        } else if (helpers.isString(v) && v.includes('=--JSON-DATE--=')) {
          v = v.replace('=--JSON-DATE--=', '');
          obj[key][i] = new Date(parseInt(v));
        }
      }
    }
  }
  return obj;
};

/*
 * @const {Function} fixJSONStringify - Fix issue with Date stringify
 */
const fixJSONStringify = function (obj) {
  for (let key in obj) {
    if (helpers.isDate(obj[key])) {
      obj[key] = "=--JSON-DATE--=".concat(+obj[key]);
    } else if (helpers.isObject(obj[key])) {
      obj[key] = fixJSONStringify(obj[key]);
    } else if (helpers.isArray(obj[key])) {
      let v;
      for (let i = 0; i < obj[key].length; i++) {
        v = obj[key][i];
        if (helpers.isObject(v)) {
          obj[key][i] = fixJSONStringify(v);
        } else if (helpers.isDate(v)) {
          obj[key][i] = "=--JSON-DATE--=".concat(+v);
        }
      }
    }
  }
  return obj;
};

/*
 * @locus Anywhere
 * @private
 * @name formatFleURL
 * @param {Object} fileRef - File reference object
 * @param {String} version - [Optional] Version of file you would like build URL for
 * @param {String} uriBase - [Optional] URI base, see - https://github.com/veliovgroup/Meteor-Files/issues/626
 * @summary Returns formatted URL for file
 * @returns {String} Downloadable link
 */
const formatFleURL = function (fileRef) {
  let version = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'original';
  let _uriBase = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : (__meteor_runtime_config__ || {}).ROOT_URL;
  check(fileRef, Object);
  check(version, String);
  let uriBase = _uriBase;
  if (!helpers.isString(uriBase)) {
    uriBase = (__meteor_runtime_config__ || {}).ROOT_URL || '/';
  }
  const _root = uriBase.replace(/\/+$/, '');
  const vRef = fileRef.versions && fileRef.versions[version] || fileRef || {};
  let ext;
  if (helpers.isString(vRef.extension)) {
    ext = ".".concat(vRef.extension.replace(/^\./, ''));
  } else {
    ext = '';
  }
  if (fileRef.public === true) {
    return _root + (version === 'original' ? "".concat(fileRef._downloadRoute, "/").concat(fileRef._id).concat(ext) : "".concat(fileRef._downloadRoute, "/").concat(version, "-").concat(fileRef._id).concat(ext));
  }
  return "".concat(_root).concat(fileRef._downloadRoute, "/").concat(fileRef._collectionName, "/").concat(fileRef._id, "/").concat(version, "/").concat(fileRef._id).concat(ext);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"write-stream.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ostrio_files/write-stream.js                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => WriteStream
});
let fs;
module.link("fs-extra", {
  default(v) {
    fs = v;
  }
}, 0);
let nodePath;
module.link("path", {
  default(v) {
    nodePath = v;
  }
}, 1);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 2);
let helpers;
module.link("./lib.js", {
  helpers(v) {
    helpers = v;
  }
}, 3);
const noop = () => {};

/**
 * @const {Object} bound   - Meteor.bindEnvironment (Fiber wrapper)
 * @const {Object} fdCache - File Descriptors Cache
 */
const bound = Meteor.bindEnvironment(callback => callback());
const fdCache = {};

/**
 * @private
 * @locus Server
 * @class WriteStream
 * @param path        {String} - Path to file on FS
 * @param maxLength   {Number} - Max amount of chunks in stream
 * @param file        {Object} - fileRef Object
 * @param permissions {String} - Permissions which will be set to open descriptor (octal), like: `611` or `0o777`. Default: 0755
 * @summary writableStream wrapper class, makes sure chunks is written in given order. Implementation of queue stream.
 */
class WriteStream {
  constructor(path, maxLength, file, permissions) {
    this.path = path.trim();
    this.maxLength = maxLength;
    this.file = file;
    this.permissions = permissions;
    if (!this.path || !helpers.isString(this.path)) {
      return;
    }
    this.fd = null;
    this.ended = false;
    this.aborted = false;
    this.writtenChunks = 0;
    if (fdCache[this.path] && !fdCache[this.path].ended && !fdCache[this.path].aborted) {
      this.fd = fdCache[this.path].fd;
      this.writtenChunks = fdCache[this.path].writtenChunks;
    } else {
      fs.stat(this.path, (statError, stats) => {
        bound(() => {
          if (statError || !stats.isFile()) {
            const paths = this.path.split(nodePath.sep);
            paths.pop();
            try {
              fs.mkdirSync(paths.join(nodePath.sep), {
                recursive: true
              });
            } catch (mkdirError) {
              throw new Meteor.Error(500, "[FilesCollection] [writeStream] [constructor] [mkdirSync] ERROR: can not make/ensure directory \"".concat(paths.join(nodePath.sep), "\""), mkdirError);
            }
            try {
              fs.writeFileSync(this.path, '');
            } catch (writeFileError) {
              throw new Meteor.Error(500, "[FilesCollection] [writeStream] [constructor] [writeFileSync] ERROR: can not write file \"".concat(this.path, "\""), writeFileError);
            }
          }
          fs.open(this.path, 'r+', this.permissions, (oError, fd) => {
            bound(() => {
              if (oError) {
                this.abort();
                throw new Meteor.Error(500, '[FilesCollection] [writeStream] [constructor] [open] [Error:]', oError);
              } else {
                this.fd = fd;
                fdCache[this.path] = this;
              }
            });
          });
        });
      });
    }
  }

  /**
   * @memberOf writeStream
   * @name write
   * @param {Number} num - Chunk position in a stream
   * @param {Buffer} chunk - Buffer (chunk binary data)
   * @param {Function} callback - Callback
   * @summary Write chunk in given order
   * @returns {Boolean} - True if chunk is sent to stream, false if chunk is set into queue
   */
  write(num, chunk, callback) {
    if (!this.aborted && !this.ended) {
      if (this.fd) {
        fs.write(this.fd, chunk, 0, chunk.length, (num - 1) * this.file.chunkSize, (error, written, buffer) => {
          bound(() => {
            callback && callback(error, written, buffer);
            if (error) {
              Meteor._debug('[FilesCollection] [writeStream] [write] [Error:]', error);
              this.abort();
            } else {
              ++this.writtenChunks;
            }
          });
        });
      } else {
        Meteor.setTimeout(() => {
          this.write(num, chunk, callback);
        }, 25);
      }
    }
    return false;
  }

  /**
   * @memberOf writeStream
   * @name end
   * @param {Function} callback - Callback
   * @summary Finishes writing to writableStream, only after all chunks in queue is written
   * @returns {Boolean} - True if stream is fulfilled, false if queue is in progress
   */
  end(callback) {
    if (!this.aborted && !this.ended) {
      if (this.writtenChunks === this.maxLength) {
        fs.close(this.fd, () => {
          bound(() => {
            delete fdCache[this.path];
            this.ended = true;
            callback && callback(void 0, true);
          });
        });
        return true;
      }
      fs.stat(this.path, (error, stat) => {
        bound(() => {
          if (!error && stat) {
            this.writtenChunks = Math.ceil(stat.size / this.file.chunkSize);
          }
          return Meteor.setTimeout(() => {
            this.end(callback);
          }, 25);
        });
      });
    } else {
      callback && callback(void 0, this.ended);
    }
    return false;
  }

  /**
   * @memberOf writeStream
   * @name abort
   * @param {Function} callback - Callback
   * @summary Aborts writing to writableStream, removes created file
   * @returns {Boolean} - True
   */
  abort(callback) {
    this.aborted = true;
    delete fdCache[this.path];
    fs.unlink(this.path, callback || noop);
    return true;
  }

  /**
   * @memberOf writeStream
   * @name stop
   * @summary Stop writing to writableStream
   * @returns {Boolean} - True
   */
  stop() {
    this.aborted = true;
    delete fdCache[this.path];
    return true;
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"node_modules":{"fs-extra":{"package.json":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/ostrio_files/node_modules/fs-extra/package.json                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = {
  "name": "fs-extra",
  "version": "9.1.0",
  "main": "./lib/index.js"
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/ostrio_files/node_modules/fs-extra/lib/index.js                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.useNode();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"eventemitter3":{"package.json":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/ostrio_files/node_modules/eventemitter3/package.json                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = {
  "name": "eventemitter3",
  "version": "4.0.7",
  "main": "index.js"
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/ostrio_files/node_modules/eventemitter3/index.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.useNode();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"abort-controller":{"package.json":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/ostrio_files/node_modules/abort-controller/package.json                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = {
  "name": "abort-controller",
  "version": "3.0.0",
  "main": "dist/abort-controller"
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"dist":{"abort-controller.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/ostrio_files/node_modules/abort-controller/dist/abort-controller.js                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.useNode();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/ostrio:files/server.js");

/* Exports */
Package._define("ostrio:files", exports, {
  FilesCollection: FilesCollection
});

})();

//# sourceURL=meteor://💻app/packages/ostrio_files.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb3N0cmlvOmZpbGVzL3NlcnZlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb3N0cmlvOmZpbGVzL2NvcmUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29zdHJpbzpmaWxlcy9jdXJzb3IuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29zdHJpbzpmaWxlcy9saWIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL29zdHJpbzpmaWxlcy93cml0ZS1zdHJlYW0uanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0IiwiRmlsZXNDb2xsZWN0aW9uIiwiaGVscGVycyIsIk1vbmdvIiwibGluayIsInYiLCJmZXRjaCIsIldlYkFwcCIsIk1ldGVvciIsIlJhbmRvbSIsIkNvb2tpZXMiLCJjaGVjayIsIk1hdGNoIiwiV3JpdGVTdHJlYW0iLCJkZWZhdWx0IiwiRmlsZXNDb2xsZWN0aW9uQ29yZSIsImZpeEpTT05QYXJzZSIsImZpeEpTT05TdHJpbmdpZnkiLCJBYm9ydENvbnRyb2xsZXIiLCJmcyIsIm5vZGVRcyIsIm5vZGVQYXRoIiwiYm91bmQiLCJiaW5kRW52aXJvbm1lbnQiLCJjYWxsYmFjayIsIm5vb3AiLCJjcmVhdGVJbmRleCIsIl9jb2xsZWN0aW9uIiwia2V5cyIsIm9wdHMiLCJQcm9taXNlIiwiYXN5bmNBcHBseSIsImNvbGxlY3Rpb24iLCJyYXdDb2xsZWN0aW9uIiwiYXdhaXQiLCJlIiwiY29kZSIsImluZGV4TmFtZSIsImluZGV4ZXMiLCJpbmRleCIsImFsbE1hdGNoIiwiaW5kZXhLZXkiLCJPYmplY3QiLCJrZXkiLCJuYW1lIiwiZHJvcEluZGV4IiwiX2RlYnVnIiwiY29uY2F0Iiwiam9pbiIsIl9uYW1lIiwiZGV0YWlscyIsImNvbnN0cnVjdG9yIiwiY29uZmlnIiwic3RvcmFnZVBhdGgiLCJfcHJlQ29sbGVjdGlvbiIsIl9wcmVDb2xsZWN0aW9uTmFtZSIsImFsbG93Q2xpZW50Q29kZSIsImFsbG93ZWRPcmlnaW5zIiwiYWxsb3dRdWVyeVN0cmluZ0Nvb2tpZXMiLCJjYWNoZUNvbnRyb2wiLCJjaHVua1NpemUiLCJjb2xsZWN0aW9uTmFtZSIsImNvbnRpbnVlVXBsb2FkVFRMIiwiZGVidWciLCJkaXNhYmxlRG93bmxvYWQiLCJkaXNhYmxlVXBsb2FkIiwiZG93bmxvYWRDYWxsYmFjayIsImRvd25sb2FkUm91dGUiLCJnZXRVc2VyIiwiaW50ZWdyaXR5Q2hlY2siLCJpbnRlcmNlcHREb3dubG9hZCIsImludGVyY2VwdFJlcXVlc3QiLCJuYW1pbmdGdW5jdGlvbiIsIm9uQWZ0ZXJSZW1vdmUiLCJvbkFmdGVyVXBsb2FkIiwib25CZWZvcmVSZW1vdmUiLCJvbkJlZm9yZVVwbG9hZCIsIm9uSW5pdGlhdGVVcGxvYWQiLCJwYXJlbnREaXJQZXJtaXNzaW9ucyIsInBlcm1pc3Npb25zIiwicHJvdGVjdGVkIiwicHVibGljIiwicmVzcG9uc2VIZWFkZXJzIiwic2FuaXRpemUiLCJzY2hlbWEiLCJzdHJpY3QiLCJzZWxmIiwiaXNCb29sZWFuIiwiTWF0aCIsImZsb29yIiwiaXNTdHJpbmciLCJDb2xsZWN0aW9uIiwiZmlsZXNDb2xsZWN0aW9uIiwiU3RyaW5nIiwiRXJyb3IiLCJyZXBsYWNlIiwiaXNGdW5jdGlvbiIsImlzTnVtYmVyIiwicGFyc2VJbnQiLCJpc09iamVjdCIsIl9jdXJyZW50VXBsb2FkcyIsInJlc3BvbnNlQ29kZSIsImZpbGVSZWYiLCJ2ZXJzaW9uUmVmIiwiaGVhZGVycyIsIlByYWdtYSIsInNpemUiLCJDb25uZWN0aW9uIiwidHlwZSIsInNlcCIsInNwIiwiYXBwbHkiLCJhcmd1bWVudHMiLCJub3JtYWxpemUiLCJta2RpclN5bmMiLCJtb2RlIiwicmVjdXJzaXZlIiwiZXJyb3IiLCJCb29sZWFuIiwiTnVtYmVyIiwiRnVuY3Rpb24iLCJPbmVPZiIsIlJlZ0V4cCIsIl9jb29raWVzIiwiYWxsb3dlZENvcmRvdmFPcmlnaW5zIiwiY3JlYXRlZEF0IiwiZXhwaXJlQWZ0ZXJTZWNvbmRzIiwiYmFja2dyb3VuZCIsIl9wcmVDb2xsZWN0aW9uQ3Vyc29yIiwiZmluZCIsImZpZWxkcyIsIl9pZCIsImlzRmluaXNoZWQiLCJvYnNlcnZlIiwiY2hhbmdlZCIsImRvYyIsInJlbW92ZSIsInJlbW92ZWQiLCJzdG9wIiwiZW5kIiwiY291bnQiLCJhYm9ydCIsIl9jcmVhdGVTdHJlYW0iLCJwYXRoIiwiZmlsZUxlbmd0aCIsIl9jb250aW51ZVVwbG9hZCIsImZpbGUiLCJhYm9ydGVkIiwiZW5kZWQiLCJjb250VXBsZCIsImZpbmRPbmUiLCJfY2hlY2tBY2Nlc3MiLCJodHRwIiwicmVzdWx0IiwidXNlciIsInVzZXJJZCIsIl9nZXRVc2VyIiwicGFyYW1zIiwiY2FsbCIsImFzc2lnbiIsInJjIiwidGV4dCIsInJlc3BvbnNlIiwiaGVhZGVyc1NlbnQiLCJ3cml0ZUhlYWQiLCJsZW5ndGgiLCJmaW5pc2hlZCIsIl9tZXRob2ROYW1lcyIsIl9BYm9ydCIsIl9Xcml0ZSIsIl9TdGFydCIsIl9SZW1vdmUiLCJvbiIsIl9oYW5kbGVVcGxvYWQiLCJfZmluaXNoVXBsb2FkIiwiX2hhbmRsZVVwbG9hZFN5bmMiLCJ3cmFwQXN5bmMiLCJiaW5kIiwiY29ubmVjdEhhbmRsZXJzIiwidXNlIiwiaHR0cFJlcSIsImh0dHBSZXNwIiwibmV4dCIsIl9wYXJzZWRVcmwiLCJpbmNsdWRlcyIsInRlc3QiLCJvcmlnaW4iLCJzZXRIZWFkZXIiLCJtZXRob2QiLCJoYW5kbGVFcnJvciIsIl9lcnJvciIsInRvU3RyaW5nIiwiSlNPTiIsInN0cmluZ2lmeSIsImJvZHkiLCJoYW5kbGVEYXRhIiwicmVxdWVzdCIsImZpbGVJZCIsImVvZiIsImJpbkRhdGEiLCJCdWZmZXIiLCJmcm9tIiwiY2h1bmtJZCIsIl9wcmVwYXJlVXBsb2FkIiwibWV0YSIsImVtaXQiLCJwYXJzZSIsImpzb25FcnIiLCJfX19zIiwiY2xvbmUiLCJEYXRlIiwibWF4TGVuZ3RoIiwiaW5zZXJ0Iiwib21pdCIsInJldHVybk1ldGEiLCJ1cGxvYWRSb3V0ZSIsImh0dHBSZXNwRXJyIiwic2V0VGltZW91dCIsImRhdGEiLCJ1cmkiLCJpbmRleE9mIiwic3Vic3RyaW5nIiwidXJpcyIsInNwbGl0IiwicXVlcnkiLCJ2ZXJzaW9uIiwiZG93bmxvYWQiLCJfZmlsZSIsIl9tZXRob2RzIiwic2VsZWN0b3IiLCJ1c2VyRnVuY3MiLCJ1c2VycyIsImN1cnNvciIsIkZTTmFtZSIsIk9wdGlvbmFsIiwiX29wdHMiLCJ1bmJsb2NrIiwiaGFuZGxlVXBsb2FkRXJyIiwidW5saW5rIiwibWV0aG9kcyIsInVuZGVmaW5lZCIsInRyYW5zcG9ydCIsImN0eCIsImZpbGVOYW1lIiwiX2dldEZpbGVOYW1lIiwiZXh0ZW5zaW9uIiwiZXh0ZW5zaW9uV2l0aERvdCIsIl9nZXRFeHQiLCJleHQiLCJfZGF0YVRvU2NoZW1hIiwiaXNVcGxvYWRBbGxvd2VkIiwiY2IiLCJjaG1vZCIsIl9nZXRNaW1lVHlwZSIsIl91cGRhdGVGaWxlVHlwZXMiLCJjb2xJbnNlcnQiLCJ1cGRhdGUiLCIkc2V0IiwicHJlVXBkYXRlRXJyb3IiLCJ3cml0ZSIsImZpbGVEYXRhIiwibWltZSIsIl9nZXRVc2VySWQiLCJ4bXRvayIsInNlcnZlciIsInNlc3Npb25zIiwiTWFwIiwiaGFzIiwiZ2V0IiwiX2dldFVzZXJEZWZhdWx0IiwibXRvayIsImNvb2tpZSIsImJ1ZmZlciIsIl9jYWxsYmFjayIsIl9wcm9jZWVkQWZ0ZXJVcGxvYWQiLCJwcm9jZWVkQWZ0ZXJVcGxvYWQiLCJpZCIsImZzTmFtZSIsInN0YXQiLCJzdGF0RXJyb3IiLCJzdGF0cyIsImlzRmlsZSIsInBhdGhzIiwicG9wIiwid3JpdGVGaWxlU3luYyIsInN0cmVhbSIsImNyZWF0ZVdyaXRlU3RyZWFtIiwiZmxhZ3MiLCJzdHJlYW1FcnIiLCJpbnNlcnRFcnIiLCJsb2FkIiwidXJsIiwidGltZW91dCIsInBhdGhQYXJ0cyIsInN0b3JlUmVzdWx0IiwiaXNFbmRlZCIsInRpbWVyIiwid1N0cmVhbSIsImF1dG9DbG9zZSIsImVtaXRDbG9zZSIsIm9uRW5kIiwiY2xlYXJUaW1lb3V0Iiwic3RhdHVzIiwic3RhdEVycm9yT25FbmQiLCJuZXdTdGF0cyIsInZlcnNpb25zIiwib3JpZ2luYWwiLCJzdGF0dXNUZXh0IiwiZGVzdHJveWVkIiwiZGVzdHJveSIsInVubGlua0Vycm9yIiwicmVzcCIsImNvbnRyb2xsZXIiLCJzaWduYWwiLCJ0aGVuIiwicmVzIiwicGlwZSIsImNhdGNoIiwiZmV0Y2hFcnJvciIsImFkZEZpbGUiLCJzdGF0RXJyIiwiX3N0b3JhZ2VQYXRoIiwiZmlsZXMiLCJmb3JFYWNoIiwiZG9jcyIsImRlbnkiLCJydWxlcyIsImFsbG93IiwiZGVueUNsaWVudCIsImFsbG93Q2xpZW50IiwidktleSIsIl80MDQiLCJvcmlnaW5hbFVybCIsInZSZWYiLCJyZXNwb25zZVR5cGUiLCJzZXJ2ZSIsInJlYWRhYmxlU3RyZWFtIiwiX3Jlc3BvbnNlVHlwZSIsImZvcmNlMjAwIiwicGFydGlyYWwiLCJyZXFSYW5nZSIsImRpc3Bvc2l0aW9uVHlwZSIsInN0YXJ0IiwidGFrZSIsImRpc3Bvc2l0aW9uTmFtZSIsImVuY29kZVVSSSIsImVuY29kZVVSSUNvbXBvbmVudCIsImRpc3Bvc2l0aW9uRW5jb2RpbmciLCJyYW5nZSIsImFycmF5IiwiaXNOYU4iLCJwbGF5Iiwic3RyZWFtRXJyb3JIYW5kbGVyIiwicmVzcG9uZCIsIl9pc0VuZGVkIiwiY2xvc2VTdHJlYW1DYiIsImNsb3NlRXJyb3IiLCJjbG9zZVN0cmVhbSIsImNsb3NlIiwiY2xvc2VTdHJlYW1FcnJvciIsImVyciIsImNyZWF0ZVJlYWRTdHJlYW0iLCJFdmVudEVtaXR0ZXIiLCJmb3JtYXRGbGVVUkwiLCJGaWxlc0N1cnNvciIsIkZpbGVDdXJzb3IiLCJjb25zb2xlIiwiaW5mbyIsImxvZyIsInRvTG93ZXJDYXNlIiwiaXNWaWRlbyIsImlzQXVkaW8iLCJpc0ltYWdlIiwiaXNUZXh0IiwiaXNKU09OIiwiaXNQREYiLCJkcyIsIl9kb3dubG9hZFJvdXRlIiwiX2NvbGxlY3Rpb25OYW1lIiwib3B0aW9ucyIsInVyaUJhc2UiLCJfX2hlbHBlcnMiLCJvcHRpb25hbCIsImJsYWNrYm94IiwidXBkYXRlZEF0IiwiX2ZpbGVSZWYiLCJwcm9wZXJ0eSIsIndpdGgiLCJfc2VsZWN0b3IiLCJfY3VycmVudCIsImhhc05leHQiLCJoYXNQcmV2aW91cyIsInByZXZpb3VzIiwiZmlyc3QiLCJsYXN0IiwiY29udGV4dCIsImVhY2giLCJtYXAiLCJjdXJyZW50IiwiY2FsbGJhY2tzIiwib2JzZXJ2ZUNoYW5nZXMiLCJzdHIiLCJtYXgiLCJyZXBsYWNlbWVudCIsImlzVW5kZWZpbmVkIiwib2JqIiwiaXNBcnJheSIsIkFycmF5IiwicHJvdG90eXBlIiwiaXNEYXRlIiwiZGF0ZSIsImdldERhdGUiLCJpc0VtcHR5Iiwic2xpY2UiLCJfb2JqIiwiaGFzT3duUHJvcGVydHkiLCJpIiwiY2xlYXIiLCJfbGVuIiwiX2tleSIsIm5vdyIsInRocm90dGxlIiwiZnVuYyIsIndhaXQiLCJ0aGF0IiwiYXJncyIsImxhdGVyIiwibGVhZGluZyIsInRocm90dGxlZCIsInJlbWFpbmluZyIsInRyYWlsaW5nIiwiY2FuY2VsIiwiX2hlbHBlcnMiLCJfdXJpQmFzZSIsIl9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18iLCJST09UX1VSTCIsIl9yb290IiwiZmRDYWNoZSIsInRyaW0iLCJmZCIsIndyaXR0ZW5DaHVua3MiLCJta2RpckVycm9yIiwid3JpdGVGaWxlRXJyb3IiLCJvcGVuIiwib0Vycm9yIiwibnVtIiwiY2h1bmsiLCJ3cml0dGVuIiwiY2VpbCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLE1BQU0sQ0FBQ0MsTUFBTSxDQUFDO0VBQUNDLGVBQWUsRUFBQ0EsQ0FBQSxLQUFJQSxlQUFlO0VBQUNDLE9BQU8sRUFBQ0EsQ0FBQSxLQUFJQTtBQUFPLENBQUMsQ0FBQztBQUFDLElBQUlDLEtBQUs7QUFBQ0osTUFBTSxDQUFDSyxJQUFJLENBQUMsY0FBYyxFQUFDO0VBQUNELEtBQUtBLENBQUNFLENBQUMsRUFBQztJQUFDRixLQUFLLEdBQUNFLENBQUM7RUFBQTtBQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7QUFBQyxJQUFJQyxLQUFLO0FBQUNQLE1BQU0sQ0FBQ0ssSUFBSSxDQUFDLGNBQWMsRUFBQztFQUFDRSxLQUFLQSxDQUFDRCxDQUFDLEVBQUM7SUFBQ0MsS0FBSyxHQUFDRCxDQUFDO0VBQUE7QUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0FBQUMsSUFBSUUsTUFBTTtBQUFDUixNQUFNLENBQUNLLElBQUksQ0FBQyxlQUFlLEVBQUM7RUFBQ0csTUFBTUEsQ0FBQ0YsQ0FBQyxFQUFDO0lBQUNFLE1BQU0sR0FBQ0YsQ0FBQztFQUFBO0FBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztBQUFDLElBQUlHLE1BQU07QUFBQ1QsTUFBTSxDQUFDSyxJQUFJLENBQUMsZUFBZSxFQUFDO0VBQUNJLE1BQU1BLENBQUNILENBQUMsRUFBQztJQUFDRyxNQUFNLEdBQUNILENBQUM7RUFBQTtBQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7QUFBQyxJQUFJSSxNQUFNO0FBQUNWLE1BQU0sQ0FBQ0ssSUFBSSxDQUFDLGVBQWUsRUFBQztFQUFDSyxNQUFNQSxDQUFDSixDQUFDLEVBQUM7SUFBQ0ksTUFBTSxHQUFDSixDQUFDO0VBQUE7QUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0FBQUMsSUFBSUssT0FBTztBQUFDWCxNQUFNLENBQUNLLElBQUksQ0FBQyx1QkFBdUIsRUFBQztFQUFDTSxPQUFPQSxDQUFDTCxDQUFDLEVBQUM7SUFBQ0ssT0FBTyxHQUFDTCxDQUFDO0VBQUE7QUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0FBQUMsSUFBSU0sS0FBSyxFQUFDQyxLQUFLO0FBQUNiLE1BQU0sQ0FBQ0ssSUFBSSxDQUFDLGNBQWMsRUFBQztFQUFDTyxLQUFLQSxDQUFDTixDQUFDLEVBQUM7SUFBQ00sS0FBSyxHQUFDTixDQUFDO0VBQUEsQ0FBQztFQUFDTyxLQUFLQSxDQUFDUCxDQUFDLEVB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Q0E7RUFDRWlILElBQUlBLENBQUEsRUFBRztJQUNMLElBQUksQ0FBQ1MsT0FBTyxHQUFHLElBQUk7SUFDbkIsT0FBT2tTLE9BQU8sQ0FBQyxJQUFJLENBQUN0UyxJQUFJLENBQUM7SUFDekIsT0FBTyxJQUFJO0VBQ2I7QUFDRixDIiwiZmlsZSI6Ii9wYWNrYWdlcy9vc3RyaW9fZmlsZXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb25nbyB9IGZyb20gJ21ldGVvci9tb25nbyc7XG5pbXBvcnQgeyBmZXRjaCB9IGZyb20gJ21ldGVvci9mZXRjaCc7XG5pbXBvcnQgeyBXZWJBcHAgfSBmcm9tICdtZXRlb3Ivd2ViYXBwJztcbmltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuaW1wb3J0IHsgUmFuZG9tIH0gZnJvbSAnbWV0ZW9yL3JhbmRvbSc7XG5pbXBvcnQgeyBDb29raWVzIH0gZnJvbSAnbWV0ZW9yL29zdHJpbzpjb29raWVzJztcbmltcG9ydCB7IGNoZWNrLCBNYXRjaCB9IGZyb20gJ21ldGVvci9jaGVjayc7XG5cbmltcG9ydCBXcml0ZVN0cmVhbSBmcm9tICcuL3dyaXRlLXN0cmVhbS5qcyc7XG5pbXBvcnQgRmlsZXNDb2xsZWN0aW9uQ29yZSBmcm9tICcuL2NvcmUuanMnO1xuaW1wb3J0IHsgZml4SlNPTlBhcnNlLCBmaXhKU09OU3RyaW5naWZ5LCBoZWxwZXJzIH0gZnJvbSAnLi9saWIuanMnO1xuXG5pbXBvcnQgQWJvcnRDb250cm9sbGVyIGZyb20gJ2Fib3J0LWNvbnRyb2xsZXInO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBub2RlUXMgZnJvbSAncXVlcnlzdHJpbmcnO1xuaW1wb3J0IG5vZGVQYXRoIGZyb20gJ3BhdGgnO1xuXG4vKipcbiAqIEBjb25zdCB7T2JqZWN0fSBib3VuZCAgLSBNZXRlb3IuYmluZEVudmlyb25tZW50IChGaWJlciB3cmFwcGVyKVxuICogQGNvbnN0IHtGdW5jdGlvbn0gbm9vcCAtIE5vIE9wZXJhdGlvbiBmdW5jdGlvbiwgcGxhY2Vob2xkZXIgZm9yIHJlcXVpcmVkIGNhbGxiYWNrc1xuICovXG5jb25zdCBib3VuZCA9IE1ldGVvci5iaW5kRW52aXJvbm1lbnQoY2FsbGJhY2sgPT4gY2FsbGJhY2soKSk7XG5jb25zdCBub29wID0gZnVuY3Rpb24gbm9vcCAoKSB7fTtcblxuLyoqXG4gKiBDcmVhdGUgKGVuc3VyZSkgaW5kZXggb24gTW9uZ29EQiBjb2xsZWN0aW9uLCBjYXRjaCBhbmQgbG9nIGV4Y2VwdGlvbiBpZiB0aHJvd25cbiAqIEBmdW5jdGlvbiBjcmVhdGVJbmRleFxuICogQHBhcmFtIHtNb25nby5Db2xsZWN0aW9ufSBjb2xsZWN0aW9uIC0gTW9uZ28uQ29sbGVjdGlvbiBpbnN0YW5jZVxuICogQHBhcmFtIHtvYmplY3R9IGtleXMgLSBGaWVsZCBhbmQgdmFsdWUgcGFpcnMgd2hlcmUgdGhlIGZpZWxkIGlzIHRoZSBpbmRleCBrZXkgYW5kIHRoZSB2YWx1ZSBkZXNjcmliZXMgdGhlIHR5cGUgb2YgaW5kZXggZm9yIHRoYXQgZmllbGRcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRzIC0gU2V0IG9mIG9wdGlvbnMgdGhhdCBjb250cm9scyB0aGUgY3JlYXRpb24gb2YgdGhlIGluZGV4XG4gKiBAcmV0dXJucyB7dm9pZCAwfVxuICovXG5jb25zdCBjcmVhdGVJbmRleCA9IGFzeW5jIChfY29sbGVjdGlvbiwga2V5cywgb3B0cykgPT4ge1xuICBjb25zdCBjb2xsZWN0aW9uID0gX2NvbGxlY3Rpb24ucmF3Q29sbGVjdGlvbigpO1xuXG4gIHRyeSB7XG4gICAgYXdhaXQgY29sbGVjdGlvbi5jcmVhdGVJbmRleChrZXlzLCBvcHRzKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmIChlLmNvZGUgPT09IDg1KSB7XG4gICAgICBsZXQgaW5kZXhOYW1lO1xuICAgICAgY29uc3QgaW5kZXhlcyA9IGF3YWl0IGNvbGxlY3Rpb24uaW5kZXhlcygpO1xuICAgICAgZm9yIChjb25zdCBpbmRleCBvZiBpbmRleGVzKSB7XG4gICAgICAgIGxldCBhbGxNYXRjaCA9IHRydWU7XG4gICAgICAgIGZvciAoY29uc3QgaW5kZXhLZXkgb2YgT2JqZWN0LmtleXMoa2V5cykpIHtcbiAgICAgICAgICBpZiAodHlwZW9mIGluZGV4LmtleVtpbmRleEtleV0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBhbGxNYXRjaCA9IGZhbHNlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChjb25zdCBpbmRleEtleSBvZiBPYmplY3Qua2V5cyhpbmRleC5rZXkpKSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBrZXlzW2luZGV4S2V5XSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGFsbE1hdGNoID0gZmFsc2U7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYWxsTWF0Y2gpIHtcbiAgICAgICAgICBpbmRleE5hbWUgPSBpbmRleC5uYW1lO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChpbmRleE5hbWUpIHtcbiAgICAgICAgYXdhaXQgY29sbGVjdGlvbi5kcm9wSW5kZXgoaW5kZXhOYW1lKTtcbiAgICAgICAgYXdhaXQgY29sbGVjdGlvbi5jcmVhdGVJbmRleChrZXlzLCBvcHRzKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgTWV0ZW9yLl9kZWJ1ZyhgQ2FuIG5vdCBzZXQgJHtPYmplY3Qua2V5cyhrZXlzKS5qb2luKCcgKyAnKX0gaW5kZXggb24gXCIke19jb2xsZWN0aW9uLl9uYW1lfVwiIGNvbGxlY3Rpb25gLCB7IGtleXMsIG9wdHMsIGRldGFpbHM6IGUgfSk7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIEBsb2N1cyBBbnl3aGVyZVxuICogQGNsYXNzIEZpbGVzQ29sbGVjdGlvblxuICogQHBhcmFtIGNvbmZpZyAgICAgICAgICAge09iamVjdH0gICAtIFtCb3RoXSAgIENvbmZpZ3VyYXRpb24gb2JqZWN0IHdpdGggbmV4dCBwcm9wZXJ0aWVzOlxuICogQHBhcmFtIGNvbmZpZy5kZWJ1ZyAgICAge0Jvb2xlYW59ICAtIFtCb3RoXSAgIFR1cm4gb24vb2YgZGVidWdnaW5nIGFuZCBleHRyYSBsb2dnaW5nXG4gKiBAcGFyYW0gY29uZmlnLnNjaGVtYSAgICB7T2JqZWN0fSAgIC0gW0JvdGhdICAgQ29sbGVjdGlvbiBTY2hlbWFcbiAqIEBwYXJhbSBjb25maWcucHVibGljICAgIHtCb29sZWFufSAgLSBbQm90aF0gICBTdG9yZSBmaWxlcyBpbiBmb2xkZXIgYWNjZXNzaWJsZSBmb3IgcHJveHkgc2VydmVycywgZm9yIGxpbWl0cywgYW5kIG1vcmUgLSByZWFkIGRvY3NcbiAqIEBwYXJhbSBjb25maWcuc3RyaWN0ICAgIHtCb29sZWFufSAgLSBbU2VydmVyXSBTdHJpY3QgbW9kZSBmb3IgcGFydGlhbCBjb250ZW50LCBpZiBpcyBgdHJ1ZWAgc2VydmVyIHdpbGwgcmV0dXJuIGA0MTZgIHJlc3BvbnNlIGNvZGUsIHdoZW4gYHJhbmdlYCBpcyBub3Qgc3BlY2lmaWVkLCBvdGhlcndpc2Ugc2VydmVyIHJldHVybiBgMjA2YFxuICogQHBhcmFtIGNvbmZpZy5wcm90ZWN0ZWQge0Z1bmN0aW9ufSAtIFtTZXJ2ZXJdIElmIGB0cnVlYCAtIGZpbGVzIHdpbGwgYmUgc2VydmVkIG9ubHkgdG8gYXV0aG9yaXplZCB1c2VycywgaWYgYGZ1bmN0aW9uKClgIC0geW91J3JlIGFibGUgdG8gY2hlY2sgdmlzaXRvcidzIHBlcm1pc3Npb25zIGluIHlvdXIgb3duIHdheSBmdW5jdGlvbidzIGNvbnRleHQgaGFzOlxuICogIC0gYHJlcXVlc3RgXG4gKiAgLSBgcmVzcG9uc2VgXG4gKiAgLSBgdXNlcigpYFxuICogIC0gYHVzZXJJZGBcbiAqIEBwYXJhbSBjb25maWcuY2h1bmtTaXplICAgICAge051bWJlcn0gIC0gW0JvdGhdIFVwbG9hZCBjaHVuayBzaXplLCBkZWZhdWx0OiA1MjQyODggYnl0ZXMgKDAsNSBNYilcbiAqIEBwYXJhbSBjb25maWcucGVybWlzc2lvbnMgICAge051bWJlcn0gIC0gW1NlcnZlcl0gUGVybWlzc2lvbnMgd2hpY2ggd2lsbCBiZSBzZXQgdG8gdXBsb2FkZWQgZmlsZXMgKG9jdGFsKSwgbGlrZTogYDUxMWAgb3IgYDBvNzU1YC4gRGVmYXVsdDogMDY0NFxuICogQHBhcmFtIGNvbmZpZy5wYXJlbnREaXJQZXJtaXNzaW9ucyB7TnVtYmVyfSAgLSBbU2VydmVyXSBQZXJtaXNzaW9ucyB3aGljaCB3aWxsIGJlIHNldCB0byBwYXJlbnQgZGlyZWN0b3J5IG9mIHVwbG9hZGVkIGZpbGVzIChvY3RhbCksIGxpa2U6IGA2MTFgIG9yIGAwbzc3N2AuIERlZmF1bHQ6IDA3NTVcbiAqIEBwYXJhbSBjb25maWcuc3RvcmFnZVBhdGggICAge1N0cmluZ3xGdW5jdGlvbn0gIC0gW1NlcnZlcl0gU3RvcmFnZSBwYXRoIG9uIGZpbGUgc3lzdGVtXG4gKiBAcGFyYW0gY29uZmlnLmNhY2hlQ29udHJvbCAgIHtTdHJpbmd9ICAtIFtTZXJ2ZXJdIERlZmF1bHQgYENhY2hlLUNvbnRyb2xgIGhlYWRlclxuICogQHBhcmFtIGNvbmZpZy5yZXNwb25zZUhlYWRlcnMge09iamVjdHxGdW5jdGlvbn0gLSBbU2VydmVyXSBDdXN0b20gcmVzcG9uc2UgaGVhZGVycywgaWYgZnVuY3Rpb24gaXMgcGFzc2VkLCBtdXN0IHJldHVybiBPYmplY3RcbiAqIEBwYXJhbSBjb25maWcudGhyb3R0bGUgICAgICAge051bWJlcn0gIC0gW1NlcnZlcl0gREVQUkVDQVRFRCBicHMgdGhyb3R0bGUgdGhyZXNob2xkXG4gKiBAcGFyYW0gY29uZmlnLmRvd25sb2FkUm91dGUgIHtTdHJpbmd9ICAtIFtCb3RoXSAgIFNlcnZlciBSb3V0ZSB1c2VkIHRvIHJldHJpZXZlIGZpbGVzXG4gKiBAcGFyYW0gY29uZmlnLmNvbGxlY3Rpb24gICAgIHtNb25nby5Db2xsZWN0aW9ufSAtIFtCb3RoXSBNb25nbyBDb2xsZWN0aW9uIEluc3RhbmNlXG4gKiBAcGFyYW0gY29uZmlnLmNvbGxlY3Rpb25OYW1lIHtTdHJpbmd9ICAtIFtCb3RoXSAgIENvbGxlY3Rpb24gbmFtZVxuICogQHBhcmFtIGNvbmZpZy5uYW1pbmdGdW5jdGlvbiB7RnVuY3Rpb259LSBbQm90aF0gICBGdW5jdGlvbiB3aGljaCByZXR1cm5zIGBTdHJpbmdgXG4gKiBAcGFyYW0gY29uZmlnLmludGVncml0eUNoZWNrIHtCb29sZWFufSAtIFtTZXJ2ZXJdIENoZWNrIGZpbGUncyBpbnRlZ3JpdHkgYmVmb3JlIHNlcnZpbmcgdG8gdXNlcnNcbiAqIEBwYXJhbSBjb25maWcub25BZnRlclVwbG9hZCAge0Z1bmN0aW9ufS0gW1NlcnZlcl0gQ2FsbGVkIHJpZ2h0IGFmdGVyIGZpbGUgaXMgcmVhZHkgb24gRlMuIFVzZSB0byB0cmFuc2ZlciBmaWxlIHNvbWV3aGVyZSBlbHNlLCBvciBkbyBvdGhlciB0aGluZyB3aXRoIGZpbGUgZGlyZWN0bHlcbiAqIEBwYXJhbSBjb25maWcub25BZnRlclJlbW92ZSAge0Z1bmN0aW9ufSAtIFtTZXJ2ZXJdIENhbGxlZCByaWdodCBhZnRlciBmaWxlIGlzIHJlbW92ZWQuIFJlbW92ZWQgb2JqZWN0cyBpcyBwYXNzZWQgdG8gY2FsbGJhY2tcbiAqIEBwYXJhbSBjb25maWcuY29udGludWVVcGxvYWRUVEwge051bWJlcn0gLSBbU2VydmVyXSBUaW1lIGluIHNlY29uZHMsIGR1cmluZyB1cGxvYWQgbWF5IGJlIGNvbnRpbnVlZCwgZGVmYXVsdCAzIGhvdXJzICgxMDgwMCBzZWNvbmRzKVxuICogQHBhcmFtIGNvbmZpZy5vbkJlZm9yZVVwbG9hZCB7RnVuY3Rpb259LSBbQm90aF0gICBGdW5jdGlvbiB3aGljaCBleGVjdXRlcyBvbiBzZXJ2ZXIgYWZ0ZXIgcmVjZWl2aW5nIGVhY2ggY2h1bmsgYW5kIG9uIGNsaWVudCByaWdodCBiZWZvcmUgYmVnaW5uaW5nIHVwbG9hZC4gRnVuY3Rpb24gY29udGV4dCBpcyBgRmlsZWAgLSBzbyB5b3UgYXJlIGFibGUgdG8gY2hlY2sgZm9yIGV4dGVuc2lvbiwgbWltZS10eXBlLCBzaXplIGFuZCBldGMuOlxuICogIC0gcmV0dXJuIGB0cnVlYCB0byBjb250aW51ZVxuICogIC0gcmV0dXJuIGBmYWxzZWAgb3IgYFN0cmluZ2AgdG8gYWJvcnQgdXBsb2FkXG4gKiBAcGFyYW0gY29uZmlnLmdldFVzZXIgICAgICAgIHtGdW5jdGlvbn0gLSBbU2VydmVyXSBSZXBsYWNlIGRlZmF1bHQgd2F5IG9mIHJlY29nbml6aW5nIHVzZXIsIHVzZWZ1bGwgd2hlbiB5b3Ugd2FudCB0byBhdXRoIHVzZXIgYmFzZWQgb24gY3VzdG9tIGNvb2tpZSAob3Igb3RoZXIgd2F5KS4gYXJndW1lbnRzIHtodHRwOiB7cmVxdWVzdDogey4uLn0sIHJlc3BvbnNlOiB7Li4ufX19LCBuZWVkIHRvIHJldHVybiB7dXNlcklkOiBTdHJpbmcsIHVzZXI6IEZ1bmN0aW9ufVxuICogQHBhcmFtIGNvbmZpZy5vbkluaXRpYXRlVXBsb2FkIHtGdW5jdGlvbn0gLSBbU2VydmVyXSBGdW5jdGlvbiB3aGljaCBleGVjdXRlcyBvbiBzZXJ2ZXIgcmlnaHQgYmVmb3JlIHVwbG9hZCBpcyBiZWdpbiBhbmQgcmlnaHQgYWZ0ZXIgYG9uQmVmb3JlVXBsb2FkYCBob29rLiBUaGlzIGhvb2sgaXMgZnVsbHkgYXN5bmNocm9ub3VzLlxuICogQHBhcmFtIGNvbmZpZy5vbkJlZm9yZVJlbW92ZSB7RnVuY3Rpb259IC0gW1NlcnZlcl0gRXhlY3V0ZXMgYmVmb3JlIHJlbW92aW5nIGZpbGUgb24gc2VydmVyLCBzbyB5b3UgY2FuIGNoZWNrIHBlcm1pc3Npb25zLiBSZXR1cm4gYHRydWVgIHRvIGFsbG93IGFjdGlvbiBhbmQgYGZhbHNlYCB0byBkZW55LlxuICogQHBhcmFtIGNvbmZpZy5hbGxvd0NsaWVudENvZGUgIHtCb29sZWFufSAgLSBbQm90aF0gICBBbGxvdyB0byBydW4gYHJlbW92ZWAgZnJvbSBjbGllbnRcbiAqIEBwYXJhbSBjb25maWcuZG93bmxvYWRDYWxsYmFjayB7RnVuY3Rpb259IC0gW1NlcnZlcl0gQ2FsbGJhY2sgdHJpZ2dlcmVkIGVhY2ggdGltZSBmaWxlIGlzIHJlcXVlc3RlZCwgcmV0dXJuIHRydXRoeSB2YWx1ZSB0byBjb250aW51ZSBkb3dubG9hZCwgb3IgZmFsc3kgdG8gYWJvcnRcbiAgKiBAcGFyYW0gY29uZmlnLmludGVyY2VwdFJlcXVlc3Qge0Z1bmN0aW9ufSAtIFtTZXJ2ZXJdIEludGVyY2VwdCBpbmNvbWluZyBIVFRQIHJlcXVlc3QsIHNvIHlvdSBjYW4gd2hhdGV2ZXIgeW91IHdhbnQsIG5vIGNoZWNrcyBvciBwcmVwcm9jZXNzaW5nLCBhcmd1bWVudHMge2h0dHA6IHtyZXF1ZXN0OiB7Li4ufSwgcmVzcG9uc2U6IHsuLi59fSwgcGFyYW1zOiB7Li4ufX1cbiAqIEBwYXJhbSBjb25maWcuaW50ZXJjZXB0RG93bmxvYWQge0Z1bmN0aW9ufSAtIFtTZXJ2ZXJdIEludGVyY2VwdCBkb3dubG9hZCByZXF1ZXN0LCBzbyB5b3UgY2FuIHNlcnZlIGZpbGUgZnJvbSB0aGlyZC1wYXJ0eSByZXNvdXJjZSwgYXJndW1lbnRzIHtodHRwOiB7cmVxdWVzdDogey4uLn0sIHJlc3BvbnNlOiB7Li4ufX0sIGZpbGVSZWY6IHsuLi59fVxuICogQHBhcmFtIGNvbmZpZy5kaXNhYmxlVXBsb2FkIHtCb29sZWFufSAtIERpc2FibGUgZmlsZSB1cGxvYWQsIHVzZWZ1bCBmb3Igc2VydmVyIG9ubHkgc29sdXRpb25zXG4gKiBAcGFyYW0gY29uZmlnLmRpc2FibGVEb3dubG9hZCB7Qm9vbGVhbn0gLSBEaXNhYmxlIGZpbGUgZG93bmxvYWQgKHNlcnZpbmcpLCB1c2VmdWwgZm9yIGZpbGUgbWFuYWdlbWVudCBvbmx5IHNvbHV0aW9uc1xuICogQHBhcmFtIGNvbmZpZy5hbGxvd2VkT3JpZ2lucyAge1JlZ2V4fEJvb2xlYW59ICAtIFtTZXJ2ZXJdICAgUmVnZXggb2YgT3JpZ2lucyB0aGF0IGFyZSBhbGxvd2VkIENPUlMgYWNjZXNzIG9yIGBmYWxzZWAgdG8gZGlzYWJsZSBjb21wbGV0ZWx5LiBEZWZhdWx0cyB0byBgL15odHRwOlxcL1xcL2xvY2FsaG9zdDoxMlswLTldezN9JC9gIGZvciBhbGxvd2luZyBNZXRlb3ItQ29yZG92YSBidWlsZHMgYWNjZXNzXG4gKiBAcGFyYW0gY29uZmlnLmFsbG93UXVlcnlTdHJpbmdDb29raWVzIHtCb29sZWFufSAtIEFsbG93IHBhc3NpbmcgQ29va2llcyBpbiBhIHF1ZXJ5IHN0cmluZyAoaW4gVVJMKS4gUHJpbWFyeSBzaG91bGQgYmUgdXNlZCBvbmx5IGluIENvcmRvdmEgZW52aXJvbm1lbnQuIE5vdGU6IHRoaXMgb3B0aW9uIHdpbGwgYmUgdXNlZCBvbmx5IG9uIENvcmRvdmEuIERlZmF1bHQ6IGBmYWxzZWBcbiAqIEBwYXJhbSBjb25maWcuc2FuaXRpemUge0Z1bmN0aW9ufSAtIE92ZXJyaWRlIGRlZmF1bHQgc2FuaXRpemUgZnVuY3Rpb25cbiAqIEBwYXJhbSBjb25maWcuX3ByZUNvbGxlY3Rpb24gIHtNb25nby5Db2xsZWN0aW9ufSAtIFtTZXJ2ZXJdIE1vbmdvIHByZUNvbGxlY3Rpb24gSW5zdGFuY2VcbiAqIEBwYXJhbSBjb25maWcuX3ByZUNvbGxlY3Rpb25OYW1lIHtTdHJpbmd9ICAtIFtTZXJ2ZXJdICBwcmVDb2xsZWN0aW9uIG5hbWVcbiAqIEBzdW1tYXJ5IENyZWF0ZSBuZXcgaW5zdGFuY2Ugb2YgRmlsZXNDb2xsZWN0aW9uXG4gKi9cbmNsYXNzIEZpbGVzQ29sbGVjdGlvbiBleHRlbmRzIEZpbGVzQ29sbGVjdGlvbkNvcmUge1xuICBjb25zdHJ1Y3Rvcihjb25maWcpIHtcbiAgICBzdXBlcigpO1xuICAgIGxldCBzdG9yYWdlUGF0aDtcbiAgICBpZiAoY29uZmlnKSB7XG4gICAgICAoe1xuICAgICAgICBfcHJlQ29sbGVjdGlvbjogdGhpcy5fcHJlQ29sbGVjdGlvbixcbiAgICAgICAgX3ByZUNvbGxlY3Rpb25OYW1lOiB0aGlzLl9wcmVDb2xsZWN0aW9uTmFtZSxcbiAgICAgICAgYWxsb3dDbGllbnRDb2RlOiB0aGlzLmFsbG93Q2xpZW50Q29kZSxcbiAgICAgICAgYWxsb3dlZE9yaWdpbnM6IHRoaXMuYWxsb3dlZE9yaWdpbnMsXG4gICAgICAgIGFsbG93UXVlcnlTdHJpbmdDb29raWVzOiB0aGlzLmFsbG93UXVlcnlTdHJpbmdDb29raWVzLFxuICAgICAgICBjYWNoZUNvbnRyb2w6IHRoaXMuY2FjaGVDb250cm9sLFxuICAgICAgICBjaHVua1NpemU6IHRoaXMuY2h1bmtTaXplLFxuICAgICAgICBjb2xsZWN0aW9uOiB0aGlzLmNvbGxlY3Rpb24sXG4gICAgICAgIGNvbGxlY3Rpb25OYW1lOiB0aGlzLmNvbGxlY3Rpb25OYW1lLFxuICAgICAgICBjb250aW51ZVVwbG9hZFRUTDogdGhpcy5jb250aW51ZVVwbG9hZFRUTCxcbiAgICAgICAgZGVidWc6IHRoaXMuZGVidWcsXG4gICAgICAgIGRpc2FibGVEb3dubG9hZDogdGhpcy5kaXNhYmxlRG93bmxvYWQsXG4gICAgICAgIGRpc2FibGVVcGxvYWQ6IHRoaXMuZGlzYWJsZVVwbG9hZCxcbiAgICAgICAgZG93bmxvYWRDYWxsYmFjazogdGhpcy5kb3dubG9hZENhbGxiYWNrLFxuICAgICAgICBkb3dubG9hZFJvdXRlOiB0aGlzLmRvd25sb2FkUm91dGUsXG4gICAgICAgIGdldFVzZXI6IHRoaXMuZ2V0VXNlcixcbiAgICAgICAgaW50ZWdyaXR5Q2hlY2s6IHRoaXMuaW50ZWdyaXR5Q2hlY2ssXG4gICAgICAgIGludGVyY2VwdERvd25sb2FkOiB0aGlzLmludGVyY2VwdERvd25sb2FkLFxuICAgICAgICBpbnRlcmNlcHRSZXF1ZXN0OiB0aGlzLmludGVyY2VwdFJlcXVlc3QsXG4gICAgICAgIG5hbWluZ0Z1bmN0aW9uOiB0aGlzLm5hbWluZ0Z1bmN0aW9uLFxuICAgICAgICBvbkFmdGVyUmVtb3ZlOiB0aGlzLm9uQWZ0ZXJSZW1vdmUsXG4gICAgICAgIG9uQWZ0ZXJVcGxvYWQ6IHRoaXMub25BZnRlclVwbG9hZCxcbiAgICAgICAgb25CZWZvcmVSZW1vdmU6IHRoaXMub25CZWZvcmVSZW1vdmUsXG4gICAgICAgIG9uQmVmb3JlVXBsb2FkOiB0aGlzLm9uQmVmb3JlVXBsb2FkLFxuICAgICAgICBvbkluaXRpYXRlVXBsb2FkOiB0aGlzLm9uSW5pdGlhdGVVcGxvYWQsXG4gICAgICAgIHBhcmVudERpclBlcm1pc3Npb25zOiB0aGlzLnBhcmVudERpclBlcm1pc3Npb25zLFxuICAgICAgICBwZXJtaXNzaW9uczogdGhpcy5wZXJtaXNzaW9ucyxcbiAgICAgICAgcHJvdGVjdGVkOiB0aGlzLnByb3RlY3RlZCxcbiAgICAgICAgcHVibGljOiB0aGlzLnB1YmxpYyxcbiAgICAgICAgcmVzcG9uc2VIZWFkZXJzOiB0aGlzLnJlc3BvbnNlSGVhZGVycyxcbiAgICAgICAgc2FuaXRpemU6IHRoaXMuc2FuaXRpemUsXG4gICAgICAgIHNjaGVtYTogdGhpcy5zY2hlbWEsXG4gICAgICAgIHN0b3JhZ2VQYXRoLFxuICAgICAgICBzdHJpY3Q6IHRoaXMuc3RyaWN0LFxuICAgICAgfSA9IGNvbmZpZyk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICBpZiAoIWhlbHBlcnMuaXNCb29sZWFuKHRoaXMuZGVidWcpKSB7XG4gICAgICB0aGlzLmRlYnVnID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKCFoZWxwZXJzLmlzQm9vbGVhbih0aGlzLnB1YmxpYykpIHtcbiAgICAgIHRoaXMucHVibGljID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLnByb3RlY3RlZCkge1xuICAgICAgdGhpcy5wcm90ZWN0ZWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuY2h1bmtTaXplKSB7XG4gICAgICB0aGlzLmNodW5rU2l6ZSA9IDEwMjQgKiA1MTI7XG4gICAgfVxuXG4gICAgdGhpcy5jaHVua1NpemUgPSBNYXRoLmZsb29yKHRoaXMuY2h1bmtTaXplIC8gOCkgKiA4O1xuXG4gICAgaWYgKCFoZWxwZXJzLmlzU3RyaW5nKHRoaXMuY29sbGVjdGlvbk5hbWUpICYmICF0aGlzLmNvbGxlY3Rpb24pIHtcbiAgICAgIHRoaXMuY29sbGVjdGlvbk5hbWUgPSAnTWV0ZW9yVXBsb2FkRmlsZXMnO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5jb2xsZWN0aW9uKSB7XG4gICAgICB0aGlzLmNvbGxlY3Rpb24gPSBuZXcgTW9uZ28uQ29sbGVjdGlvbih0aGlzLmNvbGxlY3Rpb25OYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jb2xsZWN0aW9uTmFtZSA9IHRoaXMuY29sbGVjdGlvbi5fbmFtZTtcbiAgICB9XG5cbiAgICB0aGlzLmNvbGxlY3Rpb24uZmlsZXNDb2xsZWN0aW9uID0gdGhpcztcbiAgICBjaGVjayh0aGlzLmNvbGxlY3Rpb25OYW1lLCBTdHJpbmcpO1xuXG4gICAgaWYgKHRoaXMucHVibGljICYmICF0aGlzLmRvd25sb2FkUm91dGUpIHtcbiAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNTAwLCBgW0ZpbGVzQ29sbGVjdGlvbi4ke3RoaXMuY29sbGVjdGlvbk5hbWV9XTogXCJkb3dubG9hZFJvdXRlXCIgbXVzdCBiZSBwcmVjaXNlbHkgcHJvdmlkZWQgb24gXCJwdWJsaWNcIiBjb2xsZWN0aW9ucyEgTm90ZTogXCJkb3dubG9hZFJvdXRlXCIgbXVzdCBiZSBlcXVhbCBvciBiZSBpbnNpZGUgb2YgeW91ciB3ZWIvcHJveHktc2VydmVyIChyZWxhdGl2ZSkgcm9vdC5gKTtcbiAgICB9XG5cbiAgICBpZiAoIWhlbHBlcnMuaXNTdHJpbmcodGhpcy5kb3dubG9hZFJvdXRlKSkge1xuICAgICAgdGhpcy5kb3dubG9hZFJvdXRlID0gJy9jZG4vc3RvcmFnZSc7XG4gICAgfVxuXG4gICAgdGhpcy5kb3dubG9hZFJvdXRlID0gdGhpcy5kb3dubG9hZFJvdXRlLnJlcGxhY2UoL1xcLyQvLCAnJyk7XG5cbiAgICBpZiAoIWhlbHBlcnMuaXNGdW5jdGlvbih0aGlzLm5hbWluZ0Z1bmN0aW9uKSkge1xuICAgICAgdGhpcy5uYW1pbmdGdW5jdGlvbiA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmICghaGVscGVycy5pc0Z1bmN0aW9uKHRoaXMub25CZWZvcmVVcGxvYWQpKSB7XG4gICAgICB0aGlzLm9uQmVmb3JlVXBsb2FkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKCFoZWxwZXJzLmlzRnVuY3Rpb24odGhpcy5nZXRVc2VyKSkge1xuICAgICAgdGhpcy5nZXRVc2VyID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKCFoZWxwZXJzLmlzQm9vbGVhbih0aGlzLmFsbG93Q2xpZW50Q29kZSkpIHtcbiAgICAgIHRoaXMuYWxsb3dDbGllbnRDb2RlID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoIWhlbHBlcnMuaXNGdW5jdGlvbih0aGlzLm9uSW5pdGlhdGVVcGxvYWQpKSB7XG4gICAgICB0aGlzLm9uSW5pdGlhdGVVcGxvYWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoIWhlbHBlcnMuaXNGdW5jdGlvbih0aGlzLmludGVyY2VwdFJlcXVlc3QpKSB7XG4gICAgICB0aGlzLmludGVyY2VwdFJlcXVlc3QgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoIWhlbHBlcnMuaXNGdW5jdGlvbih0aGlzLmludGVyY2VwdERvd25sb2FkKSkge1xuICAgICAgdGhpcy5pbnRlcmNlcHREb3dubG9hZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmICghaGVscGVycy5pc0Jvb2xlYW4odGhpcy5zdHJpY3QpKSB7XG4gICAgICB0aGlzLnN0cmljdCA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKCFoZWxwZXJzLmlzQm9vbGVhbih0aGlzLmFsbG93UXVlcnlTdHJpbmdDb29raWVzKSkge1xuICAgICAgdGhpcy5hbGxvd1F1ZXJ5U3RyaW5nQ29va2llcyA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmICghaGVscGVycy5pc051bWJlcih0aGlzLnBlcm1pc3Npb25zKSkge1xuICAgICAgdGhpcy5wZXJtaXNzaW9ucyA9IHBhcnNlSW50KCc2NDQnLCA4KTtcbiAgICB9XG5cbiAgICBpZiAoIWhlbHBlcnMuaXNOdW1iZXIodGhpcy5wYXJlbnREaXJQZXJtaXNzaW9ucykpIHtcbiAgICAgIHRoaXMucGFyZW50RGlyUGVybWlzc2lvbnMgPSBwYXJzZUludCgnNzU1JywgOCk7XG4gICAgfVxuXG4gICAgaWYgKCFoZWxwZXJzLmlzU3RyaW5nKHRoaXMuY2FjaGVDb250cm9sKSkge1xuICAgICAgdGhpcy5jYWNoZUNvbnRyb2wgPSAncHVibGljLCBtYXgtYWdlPTMxNTM2MDAwLCBzLW1heGFnZT0zMTUzNjAwMCc7XG4gICAgfVxuXG4gICAgaWYgKCFoZWxwZXJzLmlzRnVuY3Rpb24odGhpcy5vbkFmdGVyVXBsb2FkKSkge1xuICAgICAgdGhpcy5vbkFmdGVyVXBsb2FkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKCFoZWxwZXJzLmlzQm9vbGVhbih0aGlzLmRpc2FibGVVcGxvYWQpKSB7XG4gICAgICB0aGlzLmRpc2FibGVVcGxvYWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoIWhlbHBlcnMuaXNGdW5jdGlvbih0aGlzLm9uQWZ0ZXJSZW1vdmUpKSB7XG4gICAgICB0aGlzLm9uQWZ0ZXJSZW1vdmUgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoIWhlbHBlcnMuaXNGdW5jdGlvbih0aGlzLm9uQmVmb3JlUmVtb3ZlKSkge1xuICAgICAgdGhpcy5vbkJlZm9yZVJlbW92ZSA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmICghaGVscGVycy5pc0Jvb2xlYW4odGhpcy5pbnRlZ3JpdHlDaGVjaykpIHtcbiAgICAgIHRoaXMuaW50ZWdyaXR5Q2hlY2sgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmICghaGVscGVycy5pc0Jvb2xlYW4odGhpcy5kaXNhYmxlRG93bmxvYWQpKSB7XG4gICAgICB0aGlzLmRpc2FibGVEb3dubG9hZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmFsbG93ZWRPcmlnaW5zID09PSB0cnVlIHx8IHRoaXMuYWxsb3dlZE9yaWdpbnMgPT09IHZvaWQgMCkge1xuICAgICAgdGhpcy5hbGxvd2VkT3JpZ2lucyA9IC9eaHR0cDpcXC9cXC9sb2NhbGhvc3Q6MTJbMC05XXszfSQvO1xuICAgIH1cblxuICAgIGlmICghaGVscGVycy5pc09iamVjdCh0aGlzLl9jdXJyZW50VXBsb2FkcykpIHtcbiAgICAgIHRoaXMuX2N1cnJlbnRVcGxvYWRzID0ge307XG4gICAgfVxuXG4gICAgaWYgKCFoZWxwZXJzLmlzRnVuY3Rpb24odGhpcy5kb3dubG9hZENhbGxiYWNrKSkge1xuICAgICAgdGhpcy5kb3dubG9hZENhbGxiYWNrID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKCFoZWxwZXJzLmlzTnVtYmVyKHRoaXMuY29udGludWVVcGxvYWRUVEwpKSB7XG4gICAgICB0aGlzLmNvbnRpbnVlVXBsb2FkVFRMID0gMTA4MDA7XG4gICAgfVxuXG4gICAgaWYgKCFoZWxwZXJzLmlzRnVuY3Rpb24odGhpcy5zYW5pdGl6ZSkpIHtcbiAgICAgIHRoaXMuc2FuaXRpemUgPSBoZWxwZXJzLnNhbml0aXplO1xuICAgIH1cblxuICAgIGlmICghaGVscGVycy5pc0Z1bmN0aW9uKHRoaXMucmVzcG9uc2VIZWFkZXJzKSkge1xuICAgICAgdGhpcy5yZXNwb25zZUhlYWRlcnMgPSAocmVzcG9uc2VDb2RlLCBmaWxlUmVmLCB2ZXJzaW9uUmVmKSA9PiB7XG4gICAgICAgIGNvbnN0IGhlYWRlcnMgPSB7fTtcbiAgICAgICAgc3dpdGNoIChyZXNwb25zZUNvZGUpIHtcbiAgICAgICAgY2FzZSAnMjA2JzpcbiAgICAgICAgICBoZWFkZXJzLlByYWdtYSA9ICdwcml2YXRlJztcbiAgICAgICAgICBoZWFkZXJzWydUcmFuc2Zlci1FbmNvZGluZyddID0gJ2NodW5rZWQnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICc0MDAnOlxuICAgICAgICAgIGhlYWRlcnNbJ0NhY2hlLUNvbnRyb2wnXSA9ICduby1jYWNoZSc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJzQxNic6XG4gICAgICAgICAgaGVhZGVyc1snQ29udGVudC1SYW5nZSddID0gYGJ5dGVzICovJHt2ZXJzaW9uUmVmLnNpemV9YDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGhlYWRlcnMuQ29ubmVjdGlvbiA9ICdrZWVwLWFsaXZlJztcbiAgICAgICAgaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSB2ZXJzaW9uUmVmLnR5cGUgfHwgJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbSc7XG4gICAgICAgIGhlYWRlcnNbJ0FjY2VwdC1SYW5nZXMnXSA9ICdieXRlcyc7XG4gICAgICAgIHJldHVybiBoZWFkZXJzO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5wdWJsaWMgJiYgIXN0b3JhZ2VQYXRoKSB7XG4gICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgYFtGaWxlc0NvbGxlY3Rpb24uJHt0aGlzLmNvbGxlY3Rpb25OYW1lfV0gXCJzdG9yYWdlUGF0aFwiIG11c3QgYmUgc2V0IG9uIFwicHVibGljXCIgY29sbGVjdGlvbnMhIE5vdGU6IFwic3RvcmFnZVBhdGhcIiBtdXN0IGJlIGVxdWFsIG9uIGJlIGluc2lkZSBvZiB5b3VyIHdlYi9wcm94eS1zZXJ2ZXIgKGFic29sdXRlKSByb290LmApO1xuICAgIH1cblxuICAgIGlmICghc3RvcmFnZVBhdGgpIHtcbiAgICAgIHN0b3JhZ2VQYXRoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gYGFzc2V0cyR7bm9kZVBhdGguc2VwfWFwcCR7bm9kZVBhdGguc2VwfXVwbG9hZHMke25vZGVQYXRoLnNlcH0ke3NlbGYuY29sbGVjdGlvbk5hbWV9YDtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKGhlbHBlcnMuaXNTdHJpbmcoc3RvcmFnZVBhdGgpKSB7XG4gICAgICB0aGlzLnN0b3JhZ2VQYXRoID0gKCkgPT4gc3RvcmFnZVBhdGg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc3RvcmFnZVBhdGggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxldCBzcCA9IHN0b3JhZ2VQYXRoLmFwcGx5KHNlbGYsIGFyZ3VtZW50cyk7XG4gICAgICAgIGlmICghaGVscGVycy5pc1N0cmluZyhzcCkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMCwgYFtGaWxlc0NvbGxlY3Rpb24uJHtzZWxmLmNvbGxlY3Rpb25OYW1lfV0gXCJzdG9yYWdlUGF0aFwiIGZ1bmN0aW9uIG11c3QgcmV0dXJuIGEgU3RyaW5nIWApO1xuICAgICAgICB9XG4gICAgICAgIHNwID0gc3AucmVwbGFjZSgvXFwvJC8sICcnKTtcbiAgICAgICAgcmV0dXJuIG5vZGVQYXRoLm5vcm1hbGl6ZShzcCk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIHRoaXMuX2RlYnVnKCdbRmlsZXNDb2xsZWN0aW9uLnN0b3JhZ2VQYXRoXSBTZXQgdG86JywgdGhpcy5zdG9yYWdlUGF0aCh7fSkpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGZzLm1rZGlyU3luYyh0aGlzLnN0b3JhZ2VQYXRoKHt9KSwge1xuICAgICAgICBtb2RlOiB0aGlzLnBhcmVudERpclBlcm1pc3Npb25zLFxuICAgICAgICByZWN1cnNpdmU6IHRydWVcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDEsIGBbRmlsZXNDb2xsZWN0aW9uLiR7c2VsZi5jb2xsZWN0aW9uTmFtZX1dIFBhdGggXCIke3RoaXMuc3RvcmFnZVBhdGgoe30pfVwiIGlzIG5vdCB3cml0YWJsZSFgLCBlcnJvcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY2hlY2sodGhpcy5zdHJpY3QsIEJvb2xlYW4pO1xuICAgIGNoZWNrKHRoaXMucGVybWlzc2lvbnMsIE51bWJlcik7XG4gICAgY2hlY2sodGhpcy5zdG9yYWdlUGF0aCwgRnVuY3Rpb24pO1xuICAgIGNoZWNrKHRoaXMuY2FjaGVDb250cm9sLCBTdHJpbmcpO1xuICAgIGNoZWNrKHRoaXMub25BZnRlclJlbW92ZSwgTWF0Y2guT25lT2YoZmFsc2UsIEZ1bmN0aW9uKSk7XG4gICAgY2hlY2sodGhpcy5vbkFmdGVyVXBsb2FkLCBNYXRjaC5PbmVPZihmYWxzZSwgRnVuY3Rpb24pKTtcbiAgICBjaGVjayh0aGlzLmRpc2FibGVVcGxvYWQsIEJvb2xlYW4pO1xuICAgIGNoZWNrKHRoaXMuaW50ZWdyaXR5Q2hlY2ssIEJvb2xlYW4pO1xuICAgIGNoZWNrKHRoaXMub25CZWZvcmVSZW1vdmUsIE1hdGNoLk9uZU9mKGZhbHNlLCBGdW5jdGlvbikpO1xuICAgIGNoZWNrKHRoaXMuZGlzYWJsZURvd25sb2FkLCBCb29sZWFuKTtcbiAgICBjaGVjayh0aGlzLmRvd25sb2FkQ2FsbGJhY2ssIE1hdGNoLk9uZU9mKGZhbHNlLCBGdW5jdGlvbikpO1xuICAgIGNoZWNrKHRoaXMuaW50ZXJjZXB0UmVxdWVzdCwgTWF0Y2guT25lT2YoZmFsc2UsIEZ1bmN0aW9uKSk7XG4gICAgY2hlY2sodGhpcy5pbnRlcmNlcHREb3dubG9hZCwgTWF0Y2guT25lT2YoZmFsc2UsIEZ1bmN0aW9uKSk7XG4gICAgY2hlY2sodGhpcy5jb250aW51ZVVwbG9hZFRUTCwgTnVtYmVyKTtcbiAgICBjaGVjayh0aGlzLnJlc3BvbnNlSGVhZGVycywgTWF0Y2guT25lT2YoT2JqZWN0LCBGdW5jdGlvbikpO1xuICAgIGNoZWNrKHRoaXMuYWxsb3dlZE9yaWdpbnMsIE1hdGNoLk9uZU9mKEJvb2xlYW4sIFJlZ0V4cCkpO1xuICAgIGNoZWNrKHRoaXMuYWxsb3dRdWVyeVN0cmluZ0Nvb2tpZXMsIEJvb2xlYW4pO1xuXG4gICAgdGhpcy5fY29va2llcyA9IG5ldyBDb29raWVzKHtcbiAgICAgIGFsbG93UXVlcnlTdHJpbmdDb29raWVzOiB0aGlzLmFsbG93UXVlcnlTdHJpbmdDb29raWVzLFxuICAgICAgYWxsb3dlZENvcmRvdmFPcmlnaW5zOiB0aGlzLmFsbG93ZWRPcmlnaW5zXG4gICAgfSk7XG5cbiAgICBpZiAoIXRoaXMuZGlzYWJsZVVwbG9hZCkge1xuICAgICAgaWYgKCFoZWxwZXJzLmlzU3RyaW5nKHRoaXMuX3ByZUNvbGxlY3Rpb25OYW1lKSAmJiAhdGhpcy5fcHJlQ29sbGVjdGlvbikge1xuICAgICAgICB0aGlzLl9wcmVDb2xsZWN0aW9uTmFtZSA9IGBfX3ByZV8ke3RoaXMuY29sbGVjdGlvbk5hbWV9YDtcbiAgICAgIH1cblxuICAgICAgaWYgKCF0aGlzLl9wcmVDb2xsZWN0aW9uKSB7XG4gICAgICAgIHRoaXMuX3ByZUNvbGxlY3Rpb24gPSBuZXcgTW9uZ28uQ29sbGVjdGlvbih0aGlzLl9wcmVDb2xsZWN0aW9uTmFtZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9wcmVDb2xsZWN0aW9uTmFtZSA9IHRoaXMuX3ByZUNvbGxlY3Rpb24uX25hbWU7XG4gICAgICB9XG4gICAgICBjaGVjayh0aGlzLl9wcmVDb2xsZWN0aW9uTmFtZSwgU3RyaW5nKTtcblxuICAgICAgY3JlYXRlSW5kZXgodGhpcy5fcHJlQ29sbGVjdGlvbiwgeyBjcmVhdGVkQXQ6IDEgfSwgeyBleHBpcmVBZnRlclNlY29uZHM6IHRoaXMuY29udGludWVVcGxvYWRUVEwsIGJhY2tncm91bmQ6IHRydWUgfSk7XG4gICAgICBjb25zdCBfcHJlQ29sbGVjdGlvbkN1cnNvciA9IHRoaXMuX3ByZUNvbGxlY3Rpb24uZmluZCh7fSwge1xuICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICBfaWQ6IDEsXG4gICAgICAgICAgaXNGaW5pc2hlZDogMVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgX3ByZUNvbGxlY3Rpb25DdXJzb3Iub2JzZXJ2ZSh7XG4gICAgICAgIGNoYW5nZWQoZG9jKSB7XG4gICAgICAgICAgaWYgKGRvYy5pc0ZpbmlzaGVkKSB7XG4gICAgICAgICAgICBzZWxmLl9kZWJ1ZyhgW0ZpbGVzQ29sbGVjdGlvbl0gW19wcmVDb2xsZWN0aW9uQ3Vyc29yLm9ic2VydmVdIFtjaGFuZ2VkXTogJHtkb2MuX2lkfWApO1xuICAgICAgICAgICAgc2VsZi5fcHJlQ29sbGVjdGlvbi5yZW1vdmUoe19pZDogZG9jLl9pZH0sIG5vb3ApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVtb3ZlZChkb2MpIHtcbiAgICAgICAgICAvLyBGcmVlIG1lbW9yeSBhZnRlciB1cGxvYWQgaXMgZG9uZVxuICAgICAgICAgIC8vIE9yIGlmIHVwbG9hZCBpcyB1bmZpbmlzaGVkXG4gICAgICAgICAgc2VsZi5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFtfcHJlQ29sbGVjdGlvbkN1cnNvci5vYnNlcnZlXSBbcmVtb3ZlZF06ICR7ZG9jLl9pZH1gKTtcbiAgICAgICAgICBpZiAoaGVscGVycy5pc09iamVjdChzZWxmLl9jdXJyZW50VXBsb2Fkc1tkb2MuX2lkXSkpIHtcbiAgICAgICAgICAgIHNlbGYuX2N1cnJlbnRVcGxvYWRzW2RvYy5faWRdLnN0b3AoKTtcbiAgICAgICAgICAgIHNlbGYuX2N1cnJlbnRVcGxvYWRzW2RvYy5faWRdLmVuZCgpO1xuXG4gICAgICAgICAgICAvLyBXZSBjYW4gYmUgdW5sdWNreSB0byBydW4gaW50byBhIHJhY2UgY29uZGl0aW9uIHdoZXJlIGFub3RoZXIgc2VydmVyIHJlbW92ZWQgdGhpcyBkb2N1bWVudCBiZWZvcmUgdGhlIGNoYW5nZSBvZiBgaXNGaW5pc2hlZGAgaXMgcmVnaXN0ZXJlZCBvbiB0aGlzIHNlcnZlci5cbiAgICAgICAgICAgIC8vIFRoZXJlZm9yZSBpdCdzIGJldHRlciB0byBkb3VibGUtY2hlY2sgd2l0aCB0aGUgbWFpbiBjb2xsZWN0aW9uIGlmIHRoZSBmaWxlIGlzIHJlZmVyZW5jZWQgdGhlcmUuIElzc3VlOiBodHRwczovL2dpdGh1Yi5jb20vdmVsaW92Z3JvdXAvTWV0ZW9yLUZpbGVzL2lzc3Vlcy82NzJcbiAgICAgICAgICAgIGlmICghZG9jLmlzRmluaXNoZWQgJiYgc2VsZi5jb2xsZWN0aW9uLmZpbmQoeyBfaWQ6IGRvYy5faWQgfSkuY291bnQoKSA9PT0gMCkge1xuICAgICAgICAgICAgICBzZWxmLl9kZWJ1ZyhgW0ZpbGVzQ29sbGVjdGlvbl0gW19wcmVDb2xsZWN0aW9uQ3Vyc29yLm9ic2VydmVdIFtyZW1vdmVVbmZpbmlzaGVkVXBsb2FkXTogJHtkb2MuX2lkfWApO1xuICAgICAgICAgICAgICBzZWxmLl9jdXJyZW50VXBsb2Fkc1tkb2MuX2lkXS5hYm9ydCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkZWxldGUgc2VsZi5fY3VycmVudFVwbG9hZHNbZG9jLl9pZF07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgdGhpcy5fY3JlYXRlU3RyZWFtID0gKF9pZCwgcGF0aCwgb3B0cykgPT4ge1xuICAgICAgICB0aGlzLl9jdXJyZW50VXBsb2Fkc1tfaWRdID0gbmV3IFdyaXRlU3RyZWFtKHBhdGgsIG9wdHMuZmlsZUxlbmd0aCwgb3B0cywgdGhpcy5wZXJtaXNzaW9ucyk7XG4gICAgICB9O1xuXG4gICAgICAvLyBUaGlzIGxpdHRsZSBmdW5jdGlvbiBhbGxvd3MgdG8gY29udGludWUgdXBsb2FkXG4gICAgICAvLyBldmVuIGFmdGVyIHNlcnZlciBpcyByZXN0YXJ0ZWQgKCpub3Qgb24gZGV2LXN0YWdlKilcbiAgICAgIHRoaXMuX2NvbnRpbnVlVXBsb2FkID0gKF9pZCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5fY3VycmVudFVwbG9hZHNbX2lkXSAmJiB0aGlzLl9jdXJyZW50VXBsb2Fkc1tfaWRdLmZpbGUpIHtcbiAgICAgICAgICBpZiAoIXRoaXMuX2N1cnJlbnRVcGxvYWRzW19pZF0uYWJvcnRlZCAmJiAhdGhpcy5fY3VycmVudFVwbG9hZHNbX2lkXS5lbmRlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2N1cnJlbnRVcGxvYWRzW19pZF0uZmlsZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5fY3JlYXRlU3RyZWFtKF9pZCwgdGhpcy5fY3VycmVudFVwbG9hZHNbX2lkXS5maWxlLmZpbGUucGF0aCwgdGhpcy5fY3VycmVudFVwbG9hZHNbX2lkXS5maWxlKTtcbiAgICAgICAgICByZXR1cm4gdGhpcy5fY3VycmVudFVwbG9hZHNbX2lkXS5maWxlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbnRVcGxkID0gdGhpcy5fcHJlQ29sbGVjdGlvbi5maW5kT25lKHtfaWR9KTtcbiAgICAgICAgaWYgKGNvbnRVcGxkKSB7XG4gICAgICAgICAgdGhpcy5fY3JlYXRlU3RyZWFtKF9pZCwgY29udFVwbGQuZmlsZS5wYXRoLCBjb250VXBsZCk7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuX2N1cnJlbnRVcGxvYWRzW19pZF0uZmlsZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmICghdGhpcy5zY2hlbWEpIHtcbiAgICAgIHRoaXMuc2NoZW1hID0gRmlsZXNDb2xsZWN0aW9uQ29yZS5zY2hlbWE7XG4gICAgfVxuXG4gICAgY2hlY2sodGhpcy5kZWJ1ZywgQm9vbGVhbik7XG4gICAgY2hlY2sodGhpcy5zY2hlbWEsIE9iamVjdCk7XG4gICAgY2hlY2sodGhpcy5wdWJsaWMsIEJvb2xlYW4pO1xuICAgIGNoZWNrKHRoaXMuZ2V0VXNlciwgTWF0Y2guT25lT2YoZmFsc2UsIEZ1bmN0aW9uKSk7XG4gICAgY2hlY2sodGhpcy5wcm90ZWN0ZWQsIE1hdGNoLk9uZU9mKEJvb2xlYW4sIEZ1bmN0aW9uKSk7XG4gICAgY2hlY2sodGhpcy5jaHVua1NpemUsIE51bWJlcik7XG4gICAgY2hlY2sodGhpcy5kb3dubG9hZFJvdXRlLCBTdHJpbmcpO1xuICAgIGNoZWNrKHRoaXMubmFtaW5nRnVuY3Rpb24sIE1hdGNoLk9uZU9mKGZhbHNlLCBGdW5jdGlvbikpO1xuICAgIGNoZWNrKHRoaXMub25CZWZvcmVVcGxvYWQsIE1hdGNoLk9uZU9mKGZhbHNlLCBGdW5jdGlvbikpO1xuICAgIGNoZWNrKHRoaXMub25Jbml0aWF0ZVVwbG9hZCwgTWF0Y2guT25lT2YoZmFsc2UsIEZ1bmN0aW9uKSk7XG4gICAgY2hlY2sodGhpcy5hbGxvd0NsaWVudENvZGUsIEJvb2xlYW4pO1xuXG4gICAgaWYgKHRoaXMucHVibGljICYmIHRoaXMucHJvdGVjdGVkKSB7XG4gICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgYFtGaWxlc0NvbGxlY3Rpb24uJHt0aGlzLmNvbGxlY3Rpb25OYW1lfV06IEZpbGVzIGNhbiBub3QgYmUgcHVibGljIGFuZCBwcm90ZWN0ZWQgYXQgdGhlIHNhbWUgdGltZSFgKTtcbiAgICB9XG5cbiAgICB0aGlzLl9jaGVja0FjY2VzcyA9IChodHRwKSA9PiB7XG4gICAgICBpZiAodGhpcy5wcm90ZWN0ZWQpIHtcbiAgICAgICAgbGV0IHJlc3VsdDtcbiAgICAgICAgY29uc3Qge3VzZXIsIHVzZXJJZH0gPSB0aGlzLl9nZXRVc2VyKGh0dHApO1xuXG4gICAgICAgIGlmIChoZWxwZXJzLmlzRnVuY3Rpb24odGhpcy5wcm90ZWN0ZWQpKSB7XG4gICAgICAgICAgbGV0IGZpbGVSZWY7XG4gICAgICAgICAgaWYgKGhlbHBlcnMuaXNPYmplY3QoaHR0cC5wYXJhbXMpICYmICBodHRwLnBhcmFtcy5faWQpIHtcbiAgICAgICAgICAgIGZpbGVSZWYgPSB0aGlzLmNvbGxlY3Rpb24uZmluZE9uZShodHRwLnBhcmFtcy5faWQpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJlc3VsdCA9IGh0dHAgPyB0aGlzLnByb3RlY3RlZC5jYWxsKE9iamVjdC5hc3NpZ24oaHR0cCwge3VzZXIsIHVzZXJJZH0pLCAoZmlsZVJlZiB8fCBudWxsKSkgOiB0aGlzLnByb3RlY3RlZC5jYWxsKHt1c2VyLCB1c2VySWR9LCAoZmlsZVJlZiB8fCBudWxsKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzdWx0ID0gISF1c2VySWQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKGh0dHAgJiYgKHJlc3VsdCA9PT0gdHJ1ZSkpIHx8ICFodHRwKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByYyA9IGhlbHBlcnMuaXNOdW1iZXIocmVzdWx0KSA/IHJlc3VsdCA6IDQwMTtcbiAgICAgICAgdGhpcy5fZGVidWcoJ1tGaWxlc0NvbGxlY3Rpb24uX2NoZWNrQWNjZXNzXSBXQVJOOiBBY2Nlc3MgZGVuaWVkIScpO1xuICAgICAgICBpZiAoaHR0cCkge1xuICAgICAgICAgIGNvbnN0IHRleHQgPSAnQWNjZXNzIGRlbmllZCEnO1xuICAgICAgICAgIGlmICghaHR0cC5yZXNwb25zZS5oZWFkZXJzU2VudCkge1xuICAgICAgICAgICAgaHR0cC5yZXNwb25zZS53cml0ZUhlYWQocmMsIHtcbiAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICd0ZXh0L3BsYWluJyxcbiAgICAgICAgICAgICAgJ0NvbnRlbnQtTGVuZ3RoJzogdGV4dC5sZW5ndGhcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghaHR0cC5yZXNwb25zZS5maW5pc2hlZCkge1xuICAgICAgICAgICAgaHR0cC5yZXNwb25zZS5lbmQodGV4dCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuICAgIHRoaXMuX21ldGhvZE5hbWVzID0ge1xuICAgICAgX0Fib3J0OiBgX0ZpbGVzQ29sbGVjdGlvbkFib3J0XyR7dGhpcy5jb2xsZWN0aW9uTmFtZX1gLFxuICAgICAgX1dyaXRlOiBgX0ZpbGVzQ29sbGVjdGlvbldyaXRlXyR7dGhpcy5jb2xsZWN0aW9uTmFtZX1gLFxuICAgICAgX1N0YXJ0OiBgX0ZpbGVzQ29sbGVjdGlvblN0YXJ0XyR7dGhpcy5jb2xsZWN0aW9uTmFtZX1gLFxuICAgICAgX1JlbW92ZTogYF9GaWxlc0NvbGxlY3Rpb25SZW1vdmVfJHt0aGlzLmNvbGxlY3Rpb25OYW1lfWBcbiAgICB9O1xuXG4gICAgdGhpcy5vbignX2hhbmRsZVVwbG9hZCcsIHRoaXMuX2hhbmRsZVVwbG9hZCk7XG4gICAgdGhpcy5vbignX2ZpbmlzaFVwbG9hZCcsIHRoaXMuX2ZpbmlzaFVwbG9hZCk7XG4gICAgdGhpcy5faGFuZGxlVXBsb2FkU3luYyA9IE1ldGVvci53cmFwQXN5bmModGhpcy5faGFuZGxlVXBsb2FkLmJpbmQodGhpcykpO1xuXG4gICAgaWYgKHRoaXMuZGlzYWJsZVVwbG9hZCAmJiB0aGlzLmRpc2FibGVEb3dubG9hZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBXZWJBcHAuY29ubmVjdEhhbmRsZXJzLnVzZSgoaHR0cFJlcSwgaHR0cFJlc3AsIG5leHQpID0+IHtcbiAgICAgIGlmICh0aGlzLmFsbG93ZWRPcmlnaW5zICYmIGh0dHBSZXEuX3BhcnNlZFVybC5wYXRoLmluY2x1ZGVzKGAke3RoaXMuZG93bmxvYWRSb3V0ZX0vYCkgJiYgIWh0dHBSZXNwLmhlYWRlcnNTZW50KSB7XG4gICAgICAgIGlmICh0aGlzLmFsbG93ZWRPcmlnaW5zLnRlc3QoaHR0cFJlcS5oZWFkZXJzLm9yaWdpbikpIHtcbiAgICAgICAgICBodHRwUmVzcC5zZXRIZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LUNyZWRlbnRpYWxzJywgJ3RydWUnKTtcbiAgICAgICAgICBodHRwUmVzcC5zZXRIZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbicsIGh0dHBSZXEuaGVhZGVycy5vcmlnaW4pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGh0dHBSZXEubWV0aG9kID09PSAnT1BUSU9OUycpIHtcbiAgICAgICAgICBodHRwUmVzcC5zZXRIZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHMnLCAnR0VULCBQT1NULCBPUFRJT05TJyk7XG4gICAgICAgICAgaHR0cFJlc3Auc2V0SGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJywgJ1JhbmdlLCBDb250ZW50LVR5cGUsIHgtbXRvaywgeC1zdGFydCwgeC1jaHVua2lkLCB4LWZpbGVpZCwgeC1lb2YnKTtcbiAgICAgICAgICBodHRwUmVzcC5zZXRIZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUV4cG9zZS1IZWFkZXJzJywgJ0FjY2VwdC1SYW5nZXMsIENvbnRlbnQtRW5jb2RpbmcsIENvbnRlbnQtTGVuZ3RoLCBDb250ZW50LVJhbmdlJyk7XG4gICAgICAgICAgaHR0cFJlc3Auc2V0SGVhZGVyKCdBbGxvdycsICdHRVQsIFBPU1QsIE9QVElPTlMnKTtcbiAgICAgICAgICBodHRwUmVzcC53cml0ZUhlYWQoMjAwKTtcbiAgICAgICAgICBodHRwUmVzcC5lbmQoKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCF0aGlzLmRpc2FibGVVcGxvYWQgJiYgaHR0cFJlcS5fcGFyc2VkVXJsLnBhdGguaW5jbHVkZXMoYCR7dGhpcy5kb3dubG9hZFJvdXRlfS8ke3RoaXMuY29sbGVjdGlvbk5hbWV9L19fdXBsb2FkYCkpIHtcbiAgICAgICAgaWYgKGh0dHBSZXEubWV0aG9kICE9PSAnUE9TVCcpIHtcbiAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaGFuZGxlRXJyb3IgPSAoX2Vycm9yKSA9PiB7XG4gICAgICAgICAgbGV0IGVycm9yID0gX2Vycm9yO1xuICAgICAgICAgIE1ldGVvci5fZGVidWcoJ1tGaWxlc0NvbGxlY3Rpb25dIFtVcGxvYWRdIFtIVFRQXSBFeGNlcHRpb246JywgZXJyb3IpO1xuXG4gICAgICAgICAgaWYgKCFodHRwUmVzcC5oZWFkZXJzU2VudCkge1xuICAgICAgICAgICAgaHR0cFJlc3Aud3JpdGVIZWFkKDUwMCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFodHRwUmVzcC5maW5pc2hlZCkge1xuICAgICAgICAgICAgaWYgKGhlbHBlcnMuaXNPYmplY3QoZXJyb3IpICYmIGhlbHBlcnMuaXNGdW5jdGlvbihlcnJvci50b1N0cmluZykpIHtcbiAgICAgICAgICAgICAgZXJyb3IgPSBlcnJvci50b1N0cmluZygpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWhlbHBlcnMuaXNTdHJpbmcoZXJyb3IpKSB7XG4gICAgICAgICAgICAgIGVycm9yID0gJ1VuZXhwZWN0ZWQgZXJyb3IhJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaHR0cFJlc3AuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3IgfSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBsZXQgYm9keSA9ICcnO1xuICAgICAgICBjb25zdCBoYW5kbGVEYXRhID0gKCkgPT4ge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgb3B0cztcbiAgICAgICAgICAgIGxldCByZXN1bHQ7XG4gICAgICAgICAgICBsZXQgdXNlciA9IHRoaXMuX2dldFVzZXIoe3JlcXVlc3Q6IGh0dHBSZXEsIHJlc3BvbnNlOiBodHRwUmVzcH0pO1xuXG4gICAgICAgICAgICBpZiAoaHR0cFJlcS5oZWFkZXJzWyd4LXN0YXJ0J10gIT09ICcxJykge1xuICAgICAgICAgICAgICAvLyBDSFVOSyBVUExPQUQgU0NFTkFSSU86XG4gICAgICAgICAgICAgIG9wdHMgPSB7XG4gICAgICAgICAgICAgICAgZmlsZUlkOiB0aGlzLnNhbml0aXplKGh0dHBSZXEuaGVhZGVyc1sneC1maWxlaWQnXSwgMjAsICdhJylcbiAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICBpZiAoaHR0cFJlcS5oZWFkZXJzWyd4LWVvZiddID09PSAnMScpIHtcbiAgICAgICAgICAgICAgICBvcHRzLmVvZiA9IHRydWU7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb3B0cy5iaW5EYXRhID0gQnVmZmVyLmZyb20oYm9keSwgJ2Jhc2U2NCcpO1xuICAgICAgICAgICAgICAgIG9wdHMuY2h1bmtJZCA9IHBhcnNlSW50KGh0dHBSZXEuaGVhZGVyc1sneC1jaHVua2lkJ10pO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgY29uc3QgX2NvbnRpbnVlVXBsb2FkID0gdGhpcy5fY29udGludWVVcGxvYWQob3B0cy5maWxlSWQpO1xuICAgICAgICAgICAgICBpZiAoIV9jb250aW51ZVVwbG9hZCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDA4LCAnQ2FuXFwndCBjb250aW51ZSB1cGxvYWQsIHNlc3Npb24gZXhwaXJlZC4gU3RhcnQgdXBsb2FkIGFnYWluLicpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgKHtyZXN1bHQsIG9wdHN9ID0gdGhpcy5fcHJlcGFyZVVwbG9hZChPYmplY3QuYXNzaWduKG9wdHMsIF9jb250aW51ZVVwbG9hZCksIHVzZXIudXNlcklkLCAnSFRUUCcpKTtcblxuICAgICAgICAgICAgICBpZiAob3B0cy5lb2YpIHtcbiAgICAgICAgICAgICAgICAvLyBGSU5JU0ggVVBMT0FEIFNDRU5BUklPOlxuICAgICAgICAgICAgICAgIHRoaXMuX2hhbmRsZVVwbG9hZChyZXN1bHQsIG9wdHMsIChfZXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICAgIGxldCBlcnJvciA9IF9lcnJvcjtcbiAgICAgICAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWh0dHBSZXNwLmhlYWRlcnNTZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgaHR0cFJlc3Aud3JpdGVIZWFkKDUwMCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoIWh0dHBSZXNwLmZpbmlzaGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKGhlbHBlcnMuaXNPYmplY3QoZXJyb3IpICYmIGhlbHBlcnMuaXNGdW5jdGlvbihlcnJvci50b1N0cmluZykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yID0gZXJyb3IudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICBpZiAoIWhlbHBlcnMuaXNTdHJpbmcoZXJyb3IpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvciA9ICdVbmV4cGVjdGVkIGVycm9yISc7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgaHR0cFJlc3AuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3IgfSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgIGlmICghaHR0cFJlc3AuaGVhZGVyc1NlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgaHR0cFJlc3Aud3JpdGVIZWFkKDIwMCk7XG4gICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgIGlmIChoZWxwZXJzLmlzT2JqZWN0KHJlc3VsdC5maWxlKSAmJiByZXN1bHQuZmlsZS5tZXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5maWxlLm1ldGEgPSBmaXhKU09OU3RyaW5naWZ5KHJlc3VsdC5maWxlLm1ldGEpO1xuICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICBpZiAoIWh0dHBSZXNwLmZpbmlzaGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGh0dHBSZXNwLmVuZChKU09OLnN0cmluZ2lmeShyZXN1bHQpKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICB0aGlzLmVtaXQoJ19oYW5kbGVVcGxvYWQnLCByZXN1bHQsIG9wdHMsIG5vb3ApO1xuXG4gICAgICAgICAgICAgIGlmICghaHR0cFJlc3AuaGVhZGVyc1NlbnQpIHtcbiAgICAgICAgICAgICAgICBodHRwUmVzcC53cml0ZUhlYWQoMjA0KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoIWh0dHBSZXNwLmZpbmlzaGVkKSB7XG4gICAgICAgICAgICAgICAgaHR0cFJlc3AuZW5kKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vIFNUQVJUIFNDRU5BUklPOlxuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIG9wdHMgPSBKU09OLnBhcnNlKGJvZHkpO1xuICAgICAgICAgICAgICB9IGNhdGNoIChqc29uRXJyKSB7XG4gICAgICAgICAgICAgICAgTWV0ZW9yLl9kZWJ1ZygnQ2FuXFwndCBwYXJzZSBpbmNvbWluZyBKU09OIGZyb20gQ2xpZW50IG9uIFsuaW5zZXJ0KCkgfCB1cGxvYWRdLCBzb21ldGhpbmcgd2VudCB3cm9uZyEnLCBqc29uRXJyKTtcbiAgICAgICAgICAgICAgICBvcHRzID0ge2ZpbGU6IHt9fTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmICghaGVscGVycy5pc09iamVjdChvcHRzLmZpbGUpKSB7XG4gICAgICAgICAgICAgICAgb3B0cy5maWxlID0ge307XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAob3B0cy5maWxlSWQpIHtcbiAgICAgICAgICAgICAgICBvcHRzLmZpbGVJZCA9IHRoaXMuc2FuaXRpemUob3B0cy5maWxlSWQsIDIwLCAnYScpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgdGhpcy5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFtGaWxlIFN0YXJ0IEhUVFBdICR7b3B0cy5maWxlLm5hbWUgfHwgJ1tuby1uYW1lXSd9IC0gJHtvcHRzLmZpbGVJZH1gKTtcbiAgICAgICAgICAgICAgaWYgKGhlbHBlcnMuaXNPYmplY3Qob3B0cy5maWxlKSAmJiBvcHRzLmZpbGUubWV0YSkge1xuICAgICAgICAgICAgICAgIG9wdHMuZmlsZS5tZXRhID0gZml4SlNPTlBhcnNlKG9wdHMuZmlsZS5tZXRhKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIG9wdHMuX19fcyA9IHRydWU7XG4gICAgICAgICAgICAgICh7cmVzdWx0fSA9IHRoaXMuX3ByZXBhcmVVcGxvYWQoaGVscGVycy5jbG9uZShvcHRzKSwgdXNlci51c2VySWQsICdIVFRQIFN0YXJ0IE1ldGhvZCcpKTtcblxuICAgICAgICAgICAgICBpZiAodGhpcy5jb2xsZWN0aW9uLmZpbmRPbmUocmVzdWx0Ll9pZCkpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMCwgJ0NhblxcJ3Qgc3RhcnQgdXBsb2FkLCBkYXRhIHN1YnN0aXR1dGlvbiBkZXRlY3RlZCEnKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIG9wdHMuX2lkID0gb3B0cy5maWxlSWQ7XG4gICAgICAgICAgICAgIG9wdHMuY3JlYXRlZEF0ID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgICAgb3B0cy5tYXhMZW5ndGggPSBvcHRzLmZpbGVMZW5ndGg7XG4gICAgICAgICAgICAgIHRoaXMuX3ByZUNvbGxlY3Rpb24uaW5zZXJ0KGhlbHBlcnMub21pdChvcHRzLCAnX19fcycpKTtcbiAgICAgICAgICAgICAgdGhpcy5fY3JlYXRlU3RyZWFtKHJlc3VsdC5faWQsIHJlc3VsdC5wYXRoLCBoZWxwZXJzLm9taXQob3B0cywgJ19fX3MnKSk7XG5cbiAgICAgICAgICAgICAgaWYgKG9wdHMucmV0dXJuTWV0YSkge1xuICAgICAgICAgICAgICAgIGlmICghaHR0cFJlc3AuaGVhZGVyc1NlbnQpIHtcbiAgICAgICAgICAgICAgICAgIGh0dHBSZXNwLndyaXRlSGVhZCgyMDApO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICghaHR0cFJlc3AuZmluaXNoZWQpIHtcbiAgICAgICAgICAgICAgICAgIGh0dHBSZXNwLmVuZChKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgICAgIHVwbG9hZFJvdXRlOiBgJHt0aGlzLmRvd25sb2FkUm91dGV9LyR7dGhpcy5jb2xsZWN0aW9uTmFtZX0vX191cGxvYWRgLFxuICAgICAgICAgICAgICAgICAgICBmaWxlOiByZXN1bHRcbiAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCFodHRwUmVzcC5oZWFkZXJzU2VudCkge1xuICAgICAgICAgICAgICAgICAgaHR0cFJlc3Aud3JpdGVIZWFkKDIwNCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCFodHRwUmVzcC5maW5pc2hlZCkge1xuICAgICAgICAgICAgICAgICAgaHR0cFJlc3AuZW5kKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBjYXRjaCAoaHR0cFJlc3BFcnIpIHtcbiAgICAgICAgICAgIGhhbmRsZUVycm9yKGh0dHBSZXNwRXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgaHR0cFJlcS5zZXRUaW1lb3V0KDIwMDAwLCBoYW5kbGVFcnJvcik7XG4gICAgICAgIGlmICh0eXBlb2YgaHR0cFJlcS5ib2R5ID09PSAnb2JqZWN0JyAmJiBPYmplY3Qua2V5cyhodHRwUmVxLmJvZHkpLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgIGJvZHkgPSBKU09OLnN0cmluZ2lmeShodHRwUmVxLmJvZHkpO1xuICAgICAgICAgIGhhbmRsZURhdGEoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBodHRwUmVxLm9uKCdkYXRhJywgKGRhdGEpID0+IGJvdW5kKCgpID0+IHtcbiAgICAgICAgICAgIGJvZHkgKz0gZGF0YTtcbiAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICBodHRwUmVxLm9uKCdlbmQnLCAoKSA9PiBib3VuZCgoKSA9PiB7XG4gICAgICAgICAgICBoYW5kbGVEYXRhKCk7XG4gICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKCF0aGlzLmRpc2FibGVEb3dubG9hZCkge1xuICAgICAgICBsZXQgdXJpO1xuXG4gICAgICAgIGlmICghdGhpcy5wdWJsaWMpIHtcbiAgICAgICAgICBpZiAoaHR0cFJlcS5fcGFyc2VkVXJsLnBhdGguaW5jbHVkZXMoYCR7dGhpcy5kb3dubG9hZFJvdXRlfS8ke3RoaXMuY29sbGVjdGlvbk5hbWV9YCkpIHtcbiAgICAgICAgICAgIHVyaSA9IGh0dHBSZXEuX3BhcnNlZFVybC5wYXRoLnJlcGxhY2UoYCR7dGhpcy5kb3dubG9hZFJvdXRlfS8ke3RoaXMuY29sbGVjdGlvbk5hbWV9YCwgJycpO1xuICAgICAgICAgICAgaWYgKHVyaS5pbmRleE9mKCcvJykgPT09IDApIHtcbiAgICAgICAgICAgICAgdXJpID0gdXJpLnN1YnN0cmluZygxKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgdXJpcyA9IHVyaS5zcGxpdCgnLycpO1xuICAgICAgICAgICAgaWYgKHVyaXMubGVuZ3RoID09PSAzKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHBhcmFtcyA9IHtcbiAgICAgICAgICAgICAgICBfaWQ6IHVyaXNbMF0sXG4gICAgICAgICAgICAgICAgcXVlcnk6IGh0dHBSZXEuX3BhcnNlZFVybC5xdWVyeSA/IG5vZGVRcy5wYXJzZShodHRwUmVxLl9wYXJzZWRVcmwucXVlcnkpIDoge30sXG4gICAgICAgICAgICAgICAgbmFtZTogdXJpc1syXS5zcGxpdCgnPycpWzBdLFxuICAgICAgICAgICAgICAgIHZlcnNpb246IHVyaXNbMV1cbiAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICBjb25zdCBodHRwID0ge3JlcXVlc3Q6IGh0dHBSZXEsIHJlc3BvbnNlOiBodHRwUmVzcCwgcGFyYW1zfTtcbiAgICAgICAgICAgICAgaWYgKHRoaXMuaW50ZXJjZXB0UmVxdWVzdCAmJiBoZWxwZXJzLmlzRnVuY3Rpb24odGhpcy5pbnRlcmNlcHRSZXF1ZXN0KSAmJiB0aGlzLmludGVyY2VwdFJlcXVlc3QoaHR0cCkgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAodGhpcy5fY2hlY2tBY2Nlc3MoaHR0cCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRvd25sb2FkKGh0dHAsIHVyaXNbMV0sIHRoaXMuY29sbGVjdGlvbi5maW5kT25lKHVyaXNbMF0pKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChodHRwUmVxLl9wYXJzZWRVcmwucGF0aC5pbmNsdWRlcyhgJHt0aGlzLmRvd25sb2FkUm91dGV9YCkpIHtcbiAgICAgICAgICAgIHVyaSA9IGh0dHBSZXEuX3BhcnNlZFVybC5wYXRoLnJlcGxhY2UoYCR7dGhpcy5kb3dubG9hZFJvdXRlfWAsICcnKTtcbiAgICAgICAgICAgIGlmICh1cmkuaW5kZXhPZignLycpID09PSAwKSB7XG4gICAgICAgICAgICAgIHVyaSA9IHVyaS5zdWJzdHJpbmcoMSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHVyaXMgPSB1cmkuc3BsaXQoJy8nKTtcbiAgICAgICAgICAgIGxldCBfZmlsZSA9IHVyaXNbdXJpcy5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgIGlmIChfZmlsZSkge1xuICAgICAgICAgICAgICBsZXQgdmVyc2lvbjtcbiAgICAgICAgICAgICAgaWYgKF9maWxlLmluY2x1ZGVzKCctJykpIHtcbiAgICAgICAgICAgICAgICB2ZXJzaW9uID0gX2ZpbGUuc3BsaXQoJy0nKVswXTtcbiAgICAgICAgICAgICAgICBfZmlsZSA9IF9maWxlLnNwbGl0KCctJylbMV0uc3BsaXQoJz8nKVswXTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2ZXJzaW9uID0gJ29yaWdpbmFsJztcbiAgICAgICAgICAgICAgICBfZmlsZSA9IF9maWxlLnNwbGl0KCc/JylbMF07XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBjb25zdCBwYXJhbXMgPSB7XG4gICAgICAgICAgICAgICAgcXVlcnk6IGh0dHBSZXEuX3BhcnNlZFVybC5xdWVyeSA/IG5vZGVRcy5wYXJzZShodHRwUmVxLl9wYXJzZWRVcmwucXVlcnkpIDoge30sXG4gICAgICAgICAgICAgICAgZmlsZTogX2ZpbGUsXG4gICAgICAgICAgICAgICAgX2lkOiBfZmlsZS5zcGxpdCgnLicpWzBdLFxuICAgICAgICAgICAgICAgIHZlcnNpb24sXG4gICAgICAgICAgICAgICAgbmFtZTogX2ZpbGVcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgY29uc3QgaHR0cCA9IHtyZXF1ZXN0OiBodHRwUmVxLCByZXNwb25zZTogaHR0cFJlc3AsIHBhcmFtc307XG4gICAgICAgICAgICAgIGlmICh0aGlzLmludGVyY2VwdFJlcXVlc3QgJiYgaGVscGVycy5pc0Z1bmN0aW9uKHRoaXMuaW50ZXJjZXB0UmVxdWVzdCkgJiYgdGhpcy5pbnRlcmNlcHRSZXF1ZXN0KGh0dHApID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHRoaXMuZG93bmxvYWQoaHR0cCwgdmVyc2lvbiwgdGhpcy5jb2xsZWN0aW9uLmZpbmRPbmUocGFyYW1zLl9pZCkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIG5leHQoKTtcbiAgICB9KTtcblxuICAgIGlmICghdGhpcy5kaXNhYmxlVXBsb2FkKSB7XG4gICAgICBjb25zdCBfbWV0aG9kcyA9IHt9O1xuXG4gICAgICAvLyBNZXRob2QgdXNlZCB0byByZW1vdmUgZmlsZVxuICAgICAgLy8gZnJvbSBDbGllbnQgc2lkZVxuICAgICAgX21ldGhvZHNbdGhpcy5fbWV0aG9kTmFtZXMuX1JlbW92ZV0gPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcbiAgICAgICAgY2hlY2soc2VsZWN0b3IsIE1hdGNoLk9uZU9mKFN0cmluZywgT2JqZWN0KSk7XG4gICAgICAgIHNlbGYuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbVW5saW5rIE1ldGhvZF0gWy5yZW1vdmUoJHtzZWxlY3Rvcn0pXWApO1xuXG4gICAgICAgIGlmIChzZWxmLmFsbG93Q2xpZW50Q29kZSkge1xuICAgICAgICAgIGlmIChzZWxmLm9uQmVmb3JlUmVtb3ZlICYmIGhlbHBlcnMuaXNGdW5jdGlvbihzZWxmLm9uQmVmb3JlUmVtb3ZlKSkge1xuICAgICAgICAgICAgY29uc3QgdXNlcklkID0gdGhpcy51c2VySWQ7XG4gICAgICAgICAgICBjb25zdCB1c2VyRnVuY3MgPSB7XG4gICAgICAgICAgICAgIHVzZXJJZDogdGhpcy51c2VySWQsXG4gICAgICAgICAgICAgIHVzZXIoKSB7XG4gICAgICAgICAgICAgICAgaWYgKE1ldGVvci51c2Vycykge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIE1ldGVvci51c2Vycy5maW5kT25lKHVzZXJJZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAoIXNlbGYub25CZWZvcmVSZW1vdmUuY2FsbCh1c2VyRnVuY3MsIChzZWxmLmZpbmQoc2VsZWN0b3IpIHx8IG51bGwpKSkge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMywgJ1tGaWxlc0NvbGxlY3Rpb25dIFtyZW1vdmVdIE5vdCBwZXJtaXR0ZWQhJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgY3Vyc29yID0gc2VsZi5maW5kKHNlbGVjdG9yKTtcbiAgICAgICAgICBpZiAoY3Vyc29yLmNvdW50KCkgPiAwKSB7XG4gICAgICAgICAgICBzZWxmLnJlbW92ZShzZWxlY3Rvcik7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDQsICdDdXJzb3IgaXMgZW1wdHksIG5vIGZpbGVzIGlzIHJlbW92ZWQnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwNSwgJ1tGaWxlc0NvbGxlY3Rpb25dIFtyZW1vdmVdIFJ1bm5pbmcgY29kZSBvbiBhIGNsaWVudCBpcyBub3QgYWxsb3dlZCEnKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuXG4gICAgICAvLyBNZXRob2QgdXNlZCB0byByZWNlaXZlIFwiZmlyc3QgYnl0ZVwiIG9mIHVwbG9hZFxuICAgICAgLy8gYW5kIGFsbCBmaWxlJ3MgbWV0YS1kYXRhLCBzb1xuICAgICAgLy8gaXQgd29uJ3QgYmUgdHJhbnNmZXJyZWQgd2l0aCBldmVyeSBjaHVua1xuICAgICAgLy8gQmFzaWNhbGx5IGl0IHByZXBhcmVzIGV2ZXJ5dGhpbmdcbiAgICAgIC8vIFNvIHVzZXIgY2FuIHBhdXNlL2Rpc2Nvbm5lY3QgYW5kXG4gICAgICAvLyBjb250aW51ZSB1cGxvYWQgbGF0ZXIsIGR1cmluZyBgY29udGludWVVcGxvYWRUVExgXG4gICAgICBfbWV0aG9kc1t0aGlzLl9tZXRob2ROYW1lcy5fU3RhcnRdID0gZnVuY3Rpb24gKG9wdHMsIHJldHVybk1ldGEpIHtcbiAgICAgICAgY2hlY2sob3B0cywge1xuICAgICAgICAgIGZpbGU6IE9iamVjdCxcbiAgICAgICAgICBmaWxlSWQ6IFN0cmluZyxcbiAgICAgICAgICBGU05hbWU6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG4gICAgICAgICAgY2h1bmtTaXplOiBOdW1iZXIsXG4gICAgICAgICAgZmlsZUxlbmd0aDogTnVtYmVyXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNoZWNrKHJldHVybk1ldGEsIE1hdGNoLk9wdGlvbmFsKEJvb2xlYW4pKTtcblxuICAgICAgICBvcHRzLmZpbGVJZCA9IHNlbGYuc2FuaXRpemUob3B0cy5maWxlSWQsIDIwLCAnYScpO1xuXG4gICAgICAgIHNlbGYuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbRmlsZSBTdGFydCBNZXRob2RdICR7b3B0cy5maWxlLm5hbWV9IC0gJHtvcHRzLmZpbGVJZH1gKTtcbiAgICAgICAgb3B0cy5fX19zID0gdHJ1ZTtcbiAgICAgICAgY29uc3QgeyByZXN1bHQgfSA9IHNlbGYuX3ByZXBhcmVVcGxvYWQoaGVscGVycy5jbG9uZShvcHRzKSwgdGhpcy51c2VySWQsICdERFAgU3RhcnQgTWV0aG9kJyk7XG5cbiAgICAgICAgaWYgKHNlbGYuY29sbGVjdGlvbi5maW5kT25lKHJlc3VsdC5faWQpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDAsICdDYW5cXCd0IHN0YXJ0IHVwbG9hZCwgZGF0YSBzdWJzdGl0dXRpb24gZGV0ZWN0ZWQhJyk7XG4gICAgICAgIH1cblxuICAgICAgICBvcHRzLl9pZCA9IG9wdHMuZmlsZUlkO1xuICAgICAgICBvcHRzLmNyZWF0ZWRBdCA9IG5ldyBEYXRlKCk7XG4gICAgICAgIG9wdHMubWF4TGVuZ3RoID0gb3B0cy5maWxlTGVuZ3RoO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHNlbGYuX3ByZUNvbGxlY3Rpb24uaW5zZXJ0KGhlbHBlcnMub21pdChvcHRzLCAnX19fcycpKTtcbiAgICAgICAgICBzZWxmLl9jcmVhdGVTdHJlYW0ocmVzdWx0Ll9pZCwgcmVzdWx0LnBhdGgsIGhlbHBlcnMub21pdChvcHRzLCAnX19fcycpKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIHNlbGYuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbRmlsZSBTdGFydCBNZXRob2RdIFtFWENFUFRJT046XSAke29wdHMuZmlsZS5uYW1lfSAtICR7b3B0cy5maWxlSWR9YCwgZSk7XG4gICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig1MDAsICdDYW5cXCd0IHN0YXJ0Jyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocmV0dXJuTWV0YSkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB1cGxvYWRSb3V0ZTogYCR7c2VsZi5kb3dubG9hZFJvdXRlfS8ke3NlbGYuY29sbGVjdGlvbk5hbWV9L19fdXBsb2FkYCxcbiAgICAgICAgICAgIGZpbGU6IHJlc3VsdFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9O1xuXG5cbiAgICAgIC8vIE1ldGhvZCB1c2VkIHRvIHdyaXRlIGZpbGUgY2h1bmtzXG4gICAgICAvLyBpdCByZWNlaXZlcyB2ZXJ5IGxpbWl0ZWQgYW1vdW50IG9mIG1ldGEtZGF0YVxuICAgICAgLy8gVGhpcyBtZXRob2QgYWxzbyByZXNwb25zaWJsZSBmb3IgRU9GXG4gICAgICBfbWV0aG9kc1t0aGlzLl9tZXRob2ROYW1lcy5fV3JpdGVdID0gZnVuY3Rpb24gKF9vcHRzKSB7XG4gICAgICAgIGxldCBvcHRzID0gX29wdHM7XG4gICAgICAgIGxldCByZXN1bHQ7XG4gICAgICAgIGNoZWNrKG9wdHMsIHtcbiAgICAgICAgICBlb2Y6IE1hdGNoLk9wdGlvbmFsKEJvb2xlYW4pLFxuICAgICAgICAgIGZpbGVJZDogU3RyaW5nLFxuICAgICAgICAgIGJpbkRhdGE6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG4gICAgICAgICAgY2h1bmtJZDogTWF0Y2guT3B0aW9uYWwoTnVtYmVyKVxuICAgICAgICB9KTtcblxuICAgICAgICBvcHRzLmZpbGVJZCA9IHNlbGYuc2FuaXRpemUob3B0cy5maWxlSWQsIDIwLCAnYScpO1xuXG4gICAgICAgIGlmIChvcHRzLmJpbkRhdGEpIHtcbiAgICAgICAgICBvcHRzLmJpbkRhdGEgPSBCdWZmZXIuZnJvbShvcHRzLmJpbkRhdGEsICdiYXNlNjQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IF9jb250aW51ZVVwbG9hZCA9IHNlbGYuX2NvbnRpbnVlVXBsb2FkKG9wdHMuZmlsZUlkKTtcbiAgICAgICAgaWYgKCFfY29udGludWVVcGxvYWQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwOCwgJ0NhblxcJ3QgY29udGludWUgdXBsb2FkLCBzZXNzaW9uIGV4cGlyZWQuIFN0YXJ0IHVwbG9hZCBhZ2Fpbi4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudW5ibG9jaygpO1xuICAgICAgICAoe3Jlc3VsdCwgb3B0c30gPSBzZWxmLl9wcmVwYXJlVXBsb2FkKE9iamVjdC5hc3NpZ24ob3B0cywgX2NvbnRpbnVlVXBsb2FkKSwgdGhpcy51c2VySWQsICdERFAnKSk7XG5cbiAgICAgICAgaWYgKG9wdHMuZW9mKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBzZWxmLl9oYW5kbGVVcGxvYWRTeW5jKHJlc3VsdCwgb3B0cyk7XG4gICAgICAgICAgfSBjYXRjaCAoaGFuZGxlVXBsb2FkRXJyKSB7XG4gICAgICAgICAgICBzZWxmLl9kZWJ1ZygnW0ZpbGVzQ29sbGVjdGlvbl0gW1dyaXRlIE1ldGhvZF0gW0REUF0gRXhjZXB0aW9uOicsIGhhbmRsZVVwbG9hZEVycik7XG4gICAgICAgICAgICB0aHJvdyBoYW5kbGVVcGxvYWRFcnI7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlbGYuZW1pdCgnX2hhbmRsZVVwbG9hZCcsIHJlc3VsdCwgb3B0cywgbm9vcCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9O1xuXG4gICAgICAvLyBNZXRob2QgdXNlZCB0byBBYm9ydCB1cGxvYWRcbiAgICAgIC8vIC0gRnJlZWluZyBtZW1vcnkgYnkgZW5kaW5nIHdyaXRhYmxlU3RyZWFtc1xuICAgICAgLy8gLSBSZW1vdmluZyB0ZW1wb3JhcnkgcmVjb3JkIGZyb20gQF9wcmVDb2xsZWN0aW9uXG4gICAgICAvLyAtIFJlbW92aW5nIHJlY29yZCBmcm9tIEBjb2xsZWN0aW9uXG4gICAgICAvLyAtIC51bmxpbmsoKWluZyBjaHVua3MgZnJvbSBGU1xuICAgICAgX21ldGhvZHNbdGhpcy5fbWV0aG9kTmFtZXMuX0Fib3J0XSA9IGZ1bmN0aW9uIChfaWQpIHtcbiAgICAgICAgY2hlY2soX2lkLCBTdHJpbmcpO1xuXG4gICAgICAgIGNvbnN0IF9jb250aW51ZVVwbG9hZCA9IHNlbGYuX2NvbnRpbnVlVXBsb2FkKF9pZCk7XG4gICAgICAgIHNlbGYuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbQWJvcnQgTWV0aG9kXTogJHtfaWR9IC0gJHsoaGVscGVycy5pc09iamVjdChfY29udGludWVVcGxvYWQuZmlsZSkgPyBfY29udGludWVVcGxvYWQuZmlsZS5wYXRoIDogJycpfWApO1xuXG4gICAgICAgIGlmIChzZWxmLl9jdXJyZW50VXBsb2FkcyAmJiBzZWxmLl9jdXJyZW50VXBsb2Fkc1tfaWRdKSB7XG4gICAgICAgICAgc2VsZi5fY3VycmVudFVwbG9hZHNbX2lkXS5zdG9wKCk7XG4gICAgICAgICAgc2VsZi5fY3VycmVudFVwbG9hZHNbX2lkXS5hYm9ydCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKF9jb250aW51ZVVwbG9hZCkge1xuICAgICAgICAgIHNlbGYuX3ByZUNvbGxlY3Rpb24ucmVtb3ZlKHtfaWR9KTtcbiAgICAgICAgICBzZWxmLnJlbW92ZSh7X2lkfSk7XG4gICAgICAgICAgaWYgKGhlbHBlcnMuaXNPYmplY3QoX2NvbnRpbnVlVXBsb2FkLmZpbGUpICYmIF9jb250aW51ZVVwbG9hZC5maWxlLnBhdGgpIHtcbiAgICAgICAgICAgIHNlbGYudW5saW5rKHtfaWQsIHBhdGg6IF9jb250aW51ZVVwbG9hZC5maWxlLnBhdGh9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9O1xuXG4gICAgICBNZXRlb3IubWV0aG9kcyhfbWV0aG9kcyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBsb2N1cyBTZXJ2ZXJcbiAgICogQG1lbWJlck9mIEZpbGVzQ29sbGVjdGlvblxuICAgKiBAbmFtZSBfcHJlcGFyZVVwbG9hZFxuICAgKiBAc3VtbWFyeSBJbnRlcm5hbCBtZXRob2QuIFVzZWQgdG8gb3B0aW1pemUgcmVjZWl2ZWQgZGF0YSBhbmQgY2hlY2sgdXBsb2FkIHBlcm1pc3Npb25cbiAgICogQHJldHVybnMge09iamVjdH1cbiAgICovXG4gIF9wcmVwYXJlVXBsb2FkKG9wdHMgPSB7fSwgdXNlcklkLCB0cmFuc3BvcnQpIHtcbiAgICBsZXQgY3R4O1xuICAgIGlmICghaGVscGVycy5pc0Jvb2xlYW4ob3B0cy5lb2YpKSB7XG4gICAgICBvcHRzLmVvZiA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmICghb3B0cy5iaW5EYXRhKSB7XG4gICAgICBvcHRzLmJpbkRhdGEgPSAnRU9GJztcbiAgICB9XG5cbiAgICBpZiAoIWhlbHBlcnMuaXNOdW1iZXIob3B0cy5jaHVua0lkKSkge1xuICAgICAgb3B0cy5jaHVua0lkID0gLTE7XG4gICAgfVxuXG4gICAgaWYgKCFoZWxwZXJzLmlzU3RyaW5nKG9wdHMuRlNOYW1lKSkge1xuICAgICAgb3B0cy5GU05hbWUgPSBvcHRzLmZpbGVJZDtcbiAgICB9XG5cbiAgICB0aGlzLl9kZWJ1ZyhgW0ZpbGVzQ29sbGVjdGlvbl0gW1VwbG9hZF0gWyR7dHJhbnNwb3J0fV0gR290ICMke29wdHMuY2h1bmtJZH0vJHtvcHRzLmZpbGVMZW5ndGh9IGNodW5rcywgZHN0OiAke29wdHMuZmlsZS5uYW1lIHx8IG9wdHMuZmlsZS5maWxlTmFtZX1gKTtcblxuICAgIGNvbnN0IGZpbGVOYW1lID0gdGhpcy5fZ2V0RmlsZU5hbWUob3B0cy5maWxlKTtcbiAgICBjb25zdCB7ZXh0ZW5zaW9uLCBleHRlbnNpb25XaXRoRG90fSA9IHRoaXMuX2dldEV4dChmaWxlTmFtZSk7XG5cbiAgICBpZiAoIWhlbHBlcnMuaXNPYmplY3Qob3B0cy5maWxlLm1ldGEpKSB7XG4gICAgICBvcHRzLmZpbGUubWV0YSA9IHt9O1xuICAgIH1cblxuICAgIGxldCByZXN1bHQgPSBvcHRzLmZpbGU7XG4gICAgcmVzdWx0Lm5hbWUgPSBmaWxlTmFtZTtcbiAgICByZXN1bHQubWV0YSA9IG9wdHMuZmlsZS5tZXRhO1xuICAgIHJlc3VsdC5leHRlbnNpb24gPSBleHRlbnNpb247XG4gICAgcmVzdWx0LmV4dCA9IGV4dGVuc2lvbjtcbiAgICByZXN1bHQuX2lkID0gb3B0cy5maWxlSWQ7XG4gICAgcmVzdWx0LnVzZXJJZCA9IHVzZXJJZCB8fCBudWxsO1xuICAgIG9wdHMuRlNOYW1lID0gdGhpcy5zYW5pdGl6ZShvcHRzLkZTTmFtZSk7XG5cbiAgICBpZiAodGhpcy5uYW1pbmdGdW5jdGlvbikge1xuICAgICAgb3B0cy5GU05hbWUgPSB0aGlzLm5hbWluZ0Z1bmN0aW9uKG9wdHMpO1xuICAgIH1cblxuICAgIHJlc3VsdC5wYXRoID0gYCR7dGhpcy5zdG9yYWdlUGF0aChyZXN1bHQpfSR7bm9kZVBhdGguc2VwfSR7b3B0cy5GU05hbWV9JHtleHRlbnNpb25XaXRoRG90fWA7XG4gICAgcmVzdWx0ID0gT2JqZWN0LmFzc2lnbihyZXN1bHQsIHRoaXMuX2RhdGFUb1NjaGVtYShyZXN1bHQpKTtcblxuICAgIGlmICh0aGlzLm9uQmVmb3JlVXBsb2FkICYmIGhlbHBlcnMuaXNGdW5jdGlvbih0aGlzLm9uQmVmb3JlVXBsb2FkKSkge1xuICAgICAgY3R4ID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICAgIGZpbGU6IG9wdHMuZmlsZVxuICAgICAgfSwge1xuICAgICAgICBjaHVua0lkOiBvcHRzLmNodW5rSWQsXG4gICAgICAgIHVzZXJJZDogcmVzdWx0LnVzZXJJZCxcbiAgICAgICAgdXNlcigpIHtcbiAgICAgICAgICBpZiAoTWV0ZW9yLnVzZXJzICYmIHJlc3VsdC51c2VySWQpIHtcbiAgICAgICAgICAgIHJldHVybiBNZXRlb3IudXNlcnMuZmluZE9uZShyZXN1bHQudXNlcklkKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH0sXG4gICAgICAgIGVvZjogb3B0cy5lb2ZcbiAgICAgIH0pO1xuICAgICAgY29uc3QgaXNVcGxvYWRBbGxvd2VkID0gdGhpcy5vbkJlZm9yZVVwbG9hZC5jYWxsKGN0eCwgcmVzdWx0KTtcblxuICAgICAgaWYgKGlzVXBsb2FkQWxsb3dlZCAhPT0gdHJ1ZSkge1xuICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMywgaGVscGVycy5pc1N0cmluZyhpc1VwbG9hZEFsbG93ZWQpID8gaXNVcGxvYWRBbGxvd2VkIDogJ0BvbkJlZm9yZVVwbG9hZCgpIHJldHVybmVkIGZhbHNlJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoKG9wdHMuX19fcyA9PT0gdHJ1ZSkgJiYgdGhpcy5vbkluaXRpYXRlVXBsb2FkICYmIGhlbHBlcnMuaXNGdW5jdGlvbih0aGlzLm9uSW5pdGlhdGVVcGxvYWQpKSB7XG4gICAgICAgICAgdGhpcy5vbkluaXRpYXRlVXBsb2FkLmNhbGwoY3R4LCByZXN1bHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICgob3B0cy5fX19zID09PSB0cnVlKSAmJiB0aGlzLm9uSW5pdGlhdGVVcGxvYWQgJiYgaGVscGVycy5pc0Z1bmN0aW9uKHRoaXMub25Jbml0aWF0ZVVwbG9hZCkpIHtcbiAgICAgIGN0eCA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgICBmaWxlOiBvcHRzLmZpbGVcbiAgICAgIH0sIHtcbiAgICAgICAgY2h1bmtJZDogb3B0cy5jaHVua0lkLFxuICAgICAgICB1c2VySWQ6IHJlc3VsdC51c2VySWQsXG4gICAgICAgIHVzZXIoKSB7XG4gICAgICAgICAgaWYgKE1ldGVvci51c2VycyAmJiByZXN1bHQudXNlcklkKSB7XG4gICAgICAgICAgICByZXR1cm4gTWV0ZW9yLnVzZXJzLmZpbmRPbmUocmVzdWx0LnVzZXJJZCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9LFxuICAgICAgICBlb2Y6IG9wdHMuZW9mXG4gICAgICB9KTtcbiAgICAgIHRoaXMub25Jbml0aWF0ZVVwbG9hZC5jYWxsKGN0eCwgcmVzdWx0KTtcbiAgICB9XG5cbiAgICByZXR1cm4ge3Jlc3VsdCwgb3B0c307XG4gIH1cblxuICAvKipcbiAgICogQGxvY3VzIFNlcnZlclxuICAgKiBAbWVtYmVyT2YgRmlsZXNDb2xsZWN0aW9uXG4gICAqIEBuYW1lIF9maW5pc2hVcGxvYWRcbiAgICogQHN1bW1hcnkgSW50ZXJuYWwgbWV0aG9kLiBGaW5pc2ggdXBsb2FkLCBjbG9zZSBXcml0YWJsZSBzdHJlYW0sIGFkZCByZWNvcmQgdG8gTW9uZ29EQiBhbmQgZmx1c2ggdXNlZCBtZW1vcnlcbiAgICogQHJldHVybnMge3VuZGVmaW5lZH1cbiAgICovXG4gIF9maW5pc2hVcGxvYWQocmVzdWx0LCBvcHRzLCBjYikge1xuICAgIHRoaXMuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbVXBsb2FkXSBbZmluaXNoKGluZylVcGxvYWRdIC0+ICR7cmVzdWx0LnBhdGh9YCk7XG4gICAgZnMuY2htb2QocmVzdWx0LnBhdGgsIHRoaXMucGVybWlzc2lvbnMsIG5vb3ApO1xuICAgIHJlc3VsdC50eXBlID0gdGhpcy5fZ2V0TWltZVR5cGUob3B0cy5maWxlKTtcbiAgICByZXN1bHQucHVibGljID0gdGhpcy5wdWJsaWM7XG4gICAgdGhpcy5fdXBkYXRlRmlsZVR5cGVzKHJlc3VsdCk7XG5cbiAgICB0aGlzLmNvbGxlY3Rpb24uaW5zZXJ0KGhlbHBlcnMuY2xvbmUocmVzdWx0KSwgKGNvbEluc2VydCwgX2lkKSA9PiB7XG4gICAgICBpZiAoY29sSW5zZXJ0KSB7XG4gICAgICAgIGNiICYmIGNiKGNvbEluc2VydCk7XG4gICAgICAgIHRoaXMuX2RlYnVnKCdbRmlsZXNDb2xsZWN0aW9uXSBbVXBsb2FkXSBbX2ZpbmlzaFVwbG9hZF0gW2luc2VydF0gRXJyb3I6JywgY29sSW5zZXJ0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3ByZUNvbGxlY3Rpb24udXBkYXRlKHtfaWQ6IG9wdHMuZmlsZUlkfSwgeyRzZXQ6IHtpc0ZpbmlzaGVkOiB0cnVlfX0sIChwcmVVcGRhdGVFcnJvcikgPT4ge1xuICAgICAgICAgIGlmIChwcmVVcGRhdGVFcnJvcikge1xuICAgICAgICAgICAgY2IgJiYgY2IocHJlVXBkYXRlRXJyb3IpO1xuICAgICAgICAgICAgdGhpcy5fZGVidWcoJ1tGaWxlc0NvbGxlY3Rpb25dIFtVcGxvYWRdIFtfZmluaXNoVXBsb2FkXSBbdXBkYXRlXSBFcnJvcjonLCBwcmVVcGRhdGVFcnJvcik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdC5faWQgPSBfaWQ7XG4gICAgICAgICAgICB0aGlzLl9kZWJ1ZyhgW0ZpbGVzQ29sbGVjdGlvbl0gW1VwbG9hZF0gW2ZpbmlzaChlZClVcGxvYWRdIC0+ICR7cmVzdWx0LnBhdGh9YCk7XG4gICAgICAgICAgICB0aGlzLm9uQWZ0ZXJVcGxvYWQgJiYgdGhpcy5vbkFmdGVyVXBsb2FkLmNhbGwodGhpcywgcmVzdWx0KTtcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnYWZ0ZXJVcGxvYWQnLCByZXN1bHQpO1xuICAgICAgICAgICAgY2IgJiYgY2IobnVsbCwgcmVzdWx0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEBsb2N1cyBTZXJ2ZXJcbiAgICogQG1lbWJlck9mIEZpbGVzQ29sbGVjdGlvblxuICAgKiBAbmFtZSBfaGFuZGxlVXBsb2FkXG4gICAqIEBzdW1tYXJ5IEludGVybmFsIG1ldGhvZCB0byBoYW5kbGUgdXBsb2FkIHByb2Nlc3MsIHBpcGUgaW5jb21pbmcgZGF0YSB0byBXcml0YWJsZSBzdHJlYW1cbiAgICogQHJldHVybnMge3VuZGVmaW5lZH1cbiAgICovXG4gIF9oYW5kbGVVcGxvYWQocmVzdWx0LCBvcHRzLCBjYikge1xuICAgIHRyeSB7XG4gICAgICBpZiAob3B0cy5lb2YpIHtcbiAgICAgICAgdGhpcy5fY3VycmVudFVwbG9hZHNbcmVzdWx0Ll9pZF0uZW5kKCgpID0+IHtcbiAgICAgICAgICB0aGlzLmVtaXQoJ19maW5pc2hVcGxvYWQnLCByZXN1bHQsIG9wdHMsIGNiKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9jdXJyZW50VXBsb2Fkc1tyZXN1bHQuX2lkXS53cml0ZShvcHRzLmNodW5rSWQsIG9wdHMuYmluRGF0YSwgY2IpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHRoaXMuX2RlYnVnKCdbX2hhbmRsZVVwbG9hZF0gW0VYQ0VQVElPTjpdJywgZSk7XG4gICAgICBjYiAmJiBjYihlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlc0NvbGxlY3Rpb25cbiAgICogQG5hbWUgX2dldE1pbWVUeXBlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBmaWxlRGF0YSAtIEZpbGUgT2JqZWN0XG4gICAqIEBzdW1tYXJ5IFJldHVybnMgZmlsZSdzIG1pbWUtdHlwZVxuICAgKiBAcmV0dXJucyB7U3RyaW5nfVxuICAgKi9cbiAgX2dldE1pbWVUeXBlKGZpbGVEYXRhKSB7XG4gICAgbGV0IG1pbWU7XG4gICAgY2hlY2soZmlsZURhdGEsIE9iamVjdCk7XG4gICAgaWYgKGhlbHBlcnMuaXNPYmplY3QoZmlsZURhdGEpICYmIGZpbGVEYXRhLnR5cGUpIHtcbiAgICAgIG1pbWUgPSBmaWxlRGF0YS50eXBlO1xuICAgIH1cblxuICAgIGlmICghbWltZSB8fCAhaGVscGVycy5pc1N0cmluZyhtaW1lKSkge1xuICAgICAgbWltZSA9ICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nO1xuICAgIH1cbiAgICByZXR1cm4gbWltZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIEZpbGVzQ29sbGVjdGlvblxuICAgKiBAbmFtZSBfZ2V0VXNlcklkXG4gICAqIEBzdW1tYXJ5IFJldHVybnMgYHVzZXJJZGAgbWF0Y2hpbmcgdGhlIHhtdG9rIHRva2VuIGRlcml2ZWQgZnJvbSBNZXRlb3Iuc2VydmVyLnNlc3Npb25zXG4gICAqIEByZXR1cm5zIHtTdHJpbmd9XG4gICAqL1xuICBfZ2V0VXNlcklkKHhtdG9rKSB7XG4gICAgaWYgKCF4bXRvaykgcmV0dXJuIG51bGw7XG5cbiAgICAvLyB0aHJvdyBhbiBlcnJvciB1cG9uIGFuIHVuZXhwZWN0ZWQgdHlwZSBvZiBNZXRlb3Iuc2VydmVyLnNlc3Npb25zIGluIG9yZGVyIHRvIGlkZW50aWZ5IGJyZWFraW5nIGNoYW5nZXNcbiAgICBpZiAoIU1ldGVvci5zZXJ2ZXIuc2Vzc2lvbnMgaW5zdGFuY2VvZiBNYXAgfHwgIWhlbHBlcnMuaXNPYmplY3QoTWV0ZW9yLnNlcnZlci5zZXNzaW9ucykpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUmVjZWl2ZWQgaW5jb21wYXRpYmxlIHR5cGUgb2YgTWV0ZW9yLnNlcnZlci5zZXNzaW9ucycpO1xuICAgIH1cblxuICAgIGlmIChNZXRlb3Iuc2VydmVyLnNlc3Npb25zIGluc3RhbmNlb2YgTWFwICYmIE1ldGVvci5zZXJ2ZXIuc2Vzc2lvbnMuaGFzKHhtdG9rKSAmJiBoZWxwZXJzLmlzT2JqZWN0KE1ldGVvci5zZXJ2ZXIuc2Vzc2lvbnMuZ2V0KHhtdG9rKSkpIHtcbiAgICAgIC8vIHRvIGJlIHVzZWQgd2l0aCA+PSBNZXRlb3IgMS44LjEgd2hlcmUgTWV0ZW9yLnNlcnZlci5zZXNzaW9ucyBpcyBhIE1hcFxuICAgICAgcmV0dXJuIE1ldGVvci5zZXJ2ZXIuc2Vzc2lvbnMuZ2V0KHhtdG9rKS51c2VySWQ7XG4gICAgfSBlbHNlIGlmIChoZWxwZXJzLmlzT2JqZWN0KE1ldGVvci5zZXJ2ZXIuc2Vzc2lvbnMpICYmIHhtdG9rIGluIE1ldGVvci5zZXJ2ZXIuc2Vzc2lvbnMgJiYgaGVscGVycy5pc09iamVjdChNZXRlb3Iuc2VydmVyLnNlc3Npb25zW3htdG9rXSkpIHtcbiAgICAgIC8vIHRvIGJlIHVzZWQgd2l0aCA8IE1ldGVvciAxLjguMSB3aGVyZSBNZXRlb3Iuc2VydmVyLnNlc3Npb25zIGlzIGFuIE9iamVjdFxuICAgICAgcmV0dXJuIE1ldGVvci5zZXJ2ZXIuc2Vzc2lvbnNbeG10b2tdLnVzZXJJZDtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIEZpbGVzQ29sbGVjdGlvblxuICAgKiBAbmFtZSBfZ2V0VXNlclxuICAgKiBAc3VtbWFyeSBSZXR1cm5zIG9iamVjdCB3aXRoIGB1c2VySWRgIGFuZCBgdXNlcigpYCBtZXRob2Qgd2hpY2ggcmV0dXJuIHVzZXIncyBvYmplY3RcbiAgICogQHJldHVybnMge09iamVjdH1cbiAgICovXG4gIF9nZXRVc2VyKCkge1xuICAgIHJldHVybiB0aGlzLmdldFVzZXIgP1xuICAgICAgdGhpcy5nZXRVc2VyKC4uLmFyZ3VtZW50cykgOiB0aGlzLl9nZXRVc2VyRGVmYXVsdCguLi5hcmd1bWVudHMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyT2YgRmlsZXNDb2xsZWN0aW9uXG4gICAqIEBuYW1lIF9nZXRVc2VyRGVmYXVsdFxuICAgKiBAc3VtbWFyeSBEZWZhdWx0IHdheSBvZiByZWNvZ25pc2luZyB1c2VyIGJhc2VkIG9uICd4X210b2snIGNvb2tpZSwgY2FuIGJlIHJlcGxhY2VkIGJ5ICdjb25maWcuZ2V0VXNlcicgaWYgZGVmbmllZC4gUmV0dXJucyBvYmplY3Qgd2l0aCBgdXNlcklkYCBhbmQgYHVzZXIoKWAgbWV0aG9kIHdoaWNoIHJldHVybiB1c2VyJ3Mgb2JqZWN0XG4gICAqIEByZXR1cm5zIHtPYmplY3R9XG4gICAqL1xuICBfZ2V0VXNlckRlZmF1bHQoaHR0cCkge1xuICAgIGNvbnN0IHJlc3VsdCA9IHtcbiAgICAgIHVzZXIoKSB7IHJldHVybiBudWxsOyB9LFxuICAgICAgdXNlcklkOiBudWxsXG4gICAgfTtcblxuICAgIGlmIChodHRwKSB7XG4gICAgICBsZXQgbXRvayA9IG51bGw7XG4gICAgICBpZiAoaHR0cC5yZXF1ZXN0LmhlYWRlcnNbJ3gtbXRvayddKSB7XG4gICAgICAgIG10b2sgPSBodHRwLnJlcXVlc3QuaGVhZGVyc1sneC1tdG9rJ107XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBjb29raWUgPSBodHRwLnJlcXVlc3QuQ29va2llcztcbiAgICAgICAgaWYgKGNvb2tpZS5oYXMoJ3hfbXRvaycpKSB7XG4gICAgICAgICAgbXRvayA9IGNvb2tpZS5nZXQoJ3hfbXRvaycpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChtdG9rKSB7XG4gICAgICAgIGNvbnN0IHVzZXJJZCA9IHRoaXMuX2dldFVzZXJJZChtdG9rKTtcblxuICAgICAgICBpZiAodXNlcklkKSB7XG4gICAgICAgICAgcmVzdWx0LnVzZXIgPSAoKSA9PiBNZXRlb3IudXNlcnMuZmluZE9uZSh1c2VySWQpO1xuICAgICAgICAgIHJlc3VsdC51c2VySWQgPSB1c2VySWQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIEBsb2N1cyBTZXJ2ZXJcbiAgICogQG1lbWJlck9mIEZpbGVzQ29sbGVjdGlvblxuICAgKiBAbmFtZSB3cml0ZVxuICAgKiBAcGFyYW0ge0J1ZmZlcn0gYnVmZmVyIC0gQmluYXJ5IEZpbGUncyBCdWZmZXJcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMgLSBPYmplY3Qgd2l0aCBmaWxlLWRhdGFcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMubmFtZSAtIEZpbGUgbmFtZSwgYWxpYXM6IGBmaWxlTmFtZWBcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMudHlwZSAtIEZpbGUgbWltZS10eXBlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzLm1ldGEgLSBGaWxlIGFkZGl0aW9uYWwgbWV0YS1kYXRhXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBvcHRzLnVzZXJJZCAtIFVzZXJJZCwgZGVmYXVsdCAqbnVsbCpcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMuZmlsZUlkIC0gX2lkLCBzYW5pdGl6ZWQsIG1heC1sZW5ndGg6IDIwOyBkZWZhdWx0ICpudWxsKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIGZ1bmN0aW9uKGVycm9yLCBmaWxlT2JqKXsuLi59XG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gcHJvY2VlZEFmdGVyVXBsb2FkIC0gUHJvY2VlZCBvbkFmdGVyVXBsb2FkIGhvb2tcbiAgICogQHN1bW1hcnkgV3JpdGUgYnVmZmVyIHRvIEZTIGFuZCBhZGQgdG8gRmlsZXNDb2xsZWN0aW9uIENvbGxlY3Rpb25cbiAgICogQHJldHVybnMge0ZpbGVzQ29sbGVjdGlvbn0gSW5zdGFuY2VcbiAgICovXG4gIHdyaXRlKGJ1ZmZlciwgX29wdHMgPSB7fSwgX2NhbGxiYWNrLCBfcHJvY2VlZEFmdGVyVXBsb2FkKSB7XG4gICAgdGhpcy5fZGVidWcoJ1tGaWxlc0NvbGxlY3Rpb25dIFt3cml0ZSgpXScpO1xuICAgIGxldCBvcHRzID0gX29wdHM7XG4gICAgbGV0IGNhbGxiYWNrID0gX2NhbGxiYWNrO1xuICAgIGxldCBwcm9jZWVkQWZ0ZXJVcGxvYWQgPSBfcHJvY2VlZEFmdGVyVXBsb2FkO1xuXG4gICAgaWYgKGhlbHBlcnMuaXNGdW5jdGlvbihvcHRzKSkge1xuICAgICAgcHJvY2VlZEFmdGVyVXBsb2FkID0gY2FsbGJhY2s7XG4gICAgICBjYWxsYmFjayA9IG9wdHM7XG4gICAgICBvcHRzID0ge307XG4gICAgfSBlbHNlIGlmIChoZWxwZXJzLmlzQm9vbGVhbihjYWxsYmFjaykpIHtcbiAgICAgIHByb2NlZWRBZnRlclVwbG9hZCA9IGNhbGxiYWNrO1xuICAgIH0gZWxzZSBpZiAoaGVscGVycy5pc0Jvb2xlYW4ob3B0cykpIHtcbiAgICAgIHByb2NlZWRBZnRlclVwbG9hZCA9IG9wdHM7XG4gICAgfVxuXG4gICAgY2hlY2sob3B0cywgTWF0Y2guT3B0aW9uYWwoT2JqZWN0KSk7XG4gICAgY2hlY2soY2FsbGJhY2ssIE1hdGNoLk9wdGlvbmFsKEZ1bmN0aW9uKSk7XG4gICAgY2hlY2socHJvY2VlZEFmdGVyVXBsb2FkLCBNYXRjaC5PcHRpb25hbChCb29sZWFuKSk7XG5cbiAgICBvcHRzLmZpbGVJZCA9IG9wdHMuZmlsZUlkICYmIHRoaXMuc2FuaXRpemUob3B0cy5maWxlSWQsIDIwLCAnYScpO1xuICAgIGNvbnN0IGZpbGVJZCA9IG9wdHMuZmlsZUlkIHx8IFJhbmRvbS5pZCgpO1xuICAgIGNvbnN0IGZzTmFtZSA9IHRoaXMubmFtaW5nRnVuY3Rpb24gPyB0aGlzLm5hbWluZ0Z1bmN0aW9uKG9wdHMpIDogZmlsZUlkO1xuICAgIGNvbnN0IGZpbGVOYW1lID0gKG9wdHMubmFtZSB8fCBvcHRzLmZpbGVOYW1lKSA/IChvcHRzLm5hbWUgfHwgb3B0cy5maWxlTmFtZSkgOiBmc05hbWU7XG5cbiAgICBjb25zdCB7ZXh0ZW5zaW9uLCBleHRlbnNpb25XaXRoRG90fSA9IHRoaXMuX2dldEV4dChmaWxlTmFtZSk7XG5cbiAgICBvcHRzLnBhdGggPSBgJHt0aGlzLnN0b3JhZ2VQYXRoKG9wdHMpfSR7bm9kZVBhdGguc2VwfSR7ZnNOYW1lfSR7ZXh0ZW5zaW9uV2l0aERvdH1gO1xuICAgIG9wdHMudHlwZSA9IHRoaXMuX2dldE1pbWVUeXBlKG9wdHMpO1xuICAgIGlmICghaGVscGVycy5pc09iamVjdChvcHRzLm1ldGEpKSB7XG4gICAgICBvcHRzLm1ldGEgPSB7fTtcbiAgICB9XG5cbiAgICBpZiAoIWhlbHBlcnMuaXNOdW1iZXIob3B0cy5zaXplKSkge1xuICAgICAgb3B0cy5zaXplID0gYnVmZmVyLmxlbmd0aDtcbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHQgPSB0aGlzLl9kYXRhVG9TY2hlbWEoe1xuICAgICAgbmFtZTogZmlsZU5hbWUsXG4gICAgICBwYXRoOiBvcHRzLnBhdGgsXG4gICAgICBtZXRhOiBvcHRzLm1ldGEsXG4gICAgICB0eXBlOiBvcHRzLnR5cGUsXG4gICAgICBzaXplOiBvcHRzLnNpemUsXG4gICAgICB1c2VySWQ6IG9wdHMudXNlcklkLFxuICAgICAgZXh0ZW5zaW9uXG4gICAgfSk7XG5cbiAgICByZXN1bHQuX2lkID0gZmlsZUlkO1xuXG4gICAgZnMuc3RhdChvcHRzLnBhdGgsIChzdGF0RXJyb3IsIHN0YXRzKSA9PiB7XG4gICAgICBib3VuZCgoKSA9PiB7XG4gICAgICAgIGlmIChzdGF0RXJyb3IgfHwgIXN0YXRzLmlzRmlsZSgpKSB7XG4gICAgICAgICAgY29uc3QgcGF0aHMgPSBvcHRzLnBhdGguc3BsaXQoJy8nKTtcbiAgICAgICAgICBwYXRocy5wb3AoKTtcbiAgICAgICAgICBmcy5ta2RpclN5bmMocGF0aHMuam9pbignLycpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jKG9wdHMucGF0aCwgJycpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc3RyZWFtID0gZnMuY3JlYXRlV3JpdGVTdHJlYW0ob3B0cy5wYXRoLCB7ZmxhZ3M6ICd3JywgbW9kZTogdGhpcy5wZXJtaXNzaW9uc30pO1xuICAgICAgICBzdHJlYW0uZW5kKGJ1ZmZlciwgKHN0cmVhbUVycikgPT4ge1xuICAgICAgICAgIGJvdW5kKCgpID0+IHtcbiAgICAgICAgICAgIGlmIChzdHJlYW1FcnIpIHtcbiAgICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soc3RyZWFtRXJyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMuY29sbGVjdGlvbi5pbnNlcnQocmVzdWx0LCAoaW5zZXJ0RXJyLCBfaWQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoaW5zZXJ0RXJyKSB7XG4gICAgICAgICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayhpbnNlcnRFcnIpO1xuICAgICAgICAgICAgICAgICAgdGhpcy5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFt3cml0ZV0gW2luc2VydF0gRXJyb3I6ICR7ZmlsZU5hbWV9IC0+ICR7dGhpcy5jb2xsZWN0aW9uTmFtZX1gLCBpbnNlcnRFcnIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBmaWxlUmVmID0gdGhpcy5jb2xsZWN0aW9uLmZpbmRPbmUoX2lkKTtcbiAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKG51bGwsIGZpbGVSZWYpO1xuICAgICAgICAgICAgICAgICAgaWYgKHByb2NlZWRBZnRlclVwbG9hZCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uQWZ0ZXJVcGxvYWQgJiYgdGhpcy5vbkFmdGVyVXBsb2FkLmNhbGwodGhpcywgZmlsZVJlZik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnYWZ0ZXJVcGxvYWQnLCBmaWxlUmVmKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIHRoaXMuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbd3JpdGVdOiAke2ZpbGVOYW1lfSAtPiAke3RoaXMuY29sbGVjdGlvbk5hbWV9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBAbG9jdXMgU2VydmVyXG4gICAqIEBtZW1iZXJPZiBGaWxlc0NvbGxlY3Rpb25cbiAgICogQG5hbWUgbG9hZFxuICAgKiBAcGFyYW0ge1N0cmluZ30gdXJsIC0gVVJMIHRvIGZpbGVcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRzXSAtIE9iamVjdCB3aXRoIGZpbGUtZGF0YVxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cy5oZWFkZXJzIC0gSFRUUCBoZWFkZXJzIHRvIHVzZSB3aGVuIHJlcXVlc3RpbmcgdGhlIGZpbGVcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMubmFtZSAtIEZpbGUgbmFtZSwgYWxpYXM6IGBmaWxlTmFtZWBcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMudHlwZSAtIEZpbGUgbWltZS10eXBlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzLm1ldGEgLSBGaWxlIGFkZGl0aW9uYWwgbWV0YS1kYXRhXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBvcHRzLnVzZXJJZCAtIFVzZXJJZCwgZGVmYXVsdCAqbnVsbCpcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMuZmlsZUlkIC0gX2lkLCBzYW5pdGl6ZWQsIG1heC1sZW5ndGg6IDIwOyBkZWZhdWx0ICpudWxsKlxuICAgKiBAcGFyYW0ge051bWJlcn0gb3B0cy50aW1lb3V0IC0gVGltZW91dCBpbiBtaWxsaXNlY29uZHMsIGRlZmF1bHQ6IDM2MDAwMCAoNiBtaW5zKVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIGZ1bmN0aW9uKGVycm9yLCBmaWxlT2JqKXsuLi59XG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gW3Byb2NlZWRBZnRlclVwbG9hZF0gLSBQcm9jZWVkIG9uQWZ0ZXJVcGxvYWQgaG9va1xuICAgKiBAc3VtbWFyeSBEb3dubG9hZCBmaWxlIG92ZXIgSFRUUCwgd3JpdGUgc3RyZWFtIHRvIEZTLCBhbmQgYWRkIHRvIEZpbGVzQ29sbGVjdGlvbiBDb2xsZWN0aW9uXG4gICAqIEByZXR1cm5zIHtGaWxlc0NvbGxlY3Rpb259IEluc3RhbmNlXG4gICAqL1xuICBsb2FkKHVybCwgX29wdHMgPSB7fSwgX2NhbGxiYWNrLCBfcHJvY2VlZEFmdGVyVXBsb2FkID0gZmFsc2UpIHtcbiAgICB0aGlzLl9kZWJ1ZyhgW0ZpbGVzQ29sbGVjdGlvbl0gW2xvYWQoJHt1cmx9LCAke0pTT04uc3RyaW5naWZ5KF9vcHRzKX0sIGNhbGxiYWNrKV1gKTtcbiAgICBsZXQgb3B0cyA9IF9vcHRzO1xuICAgIGxldCBjYWxsYmFjayA9IF9jYWxsYmFjaztcbiAgICBsZXQgcHJvY2VlZEFmdGVyVXBsb2FkID0gX3Byb2NlZWRBZnRlclVwbG9hZDtcblxuICAgIGlmIChoZWxwZXJzLmlzRnVuY3Rpb24ob3B0cykpIHtcbiAgICAgIHByb2NlZWRBZnRlclVwbG9hZCA9IGNhbGxiYWNrO1xuICAgICAgY2FsbGJhY2sgPSBvcHRzO1xuICAgICAgb3B0cyA9IHt9O1xuICAgIH0gZWxzZSBpZiAoaGVscGVycy5pc0Jvb2xlYW4oY2FsbGJhY2spKSB7XG4gICAgICBwcm9jZWVkQWZ0ZXJVcGxvYWQgPSBjYWxsYmFjaztcbiAgICB9IGVsc2UgaWYgKGhlbHBlcnMuaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgICBwcm9jZWVkQWZ0ZXJVcGxvYWQgPSBvcHRzO1xuICAgIH1cblxuICAgIGNoZWNrKHVybCwgU3RyaW5nKTtcbiAgICBjaGVjayhvcHRzLCBNYXRjaC5PcHRpb25hbChPYmplY3QpKTtcbiAgICBjaGVjayhjYWxsYmFjaywgTWF0Y2guT3B0aW9uYWwoRnVuY3Rpb24pKTtcbiAgICBjaGVjayhwcm9jZWVkQWZ0ZXJVcGxvYWQsIE1hdGNoLk9wdGlvbmFsKEJvb2xlYW4pKTtcblxuICAgIGlmICghaGVscGVycy5pc09iamVjdChvcHRzKSkge1xuICAgICAgb3B0cyA9IHtcbiAgICAgICAgdGltZW91dDogMzYwMDAwXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmICghb3B0cy50aW1lb3V0KSB7XG4gICAgICBvcHRzLnRpbWVvdXQgPSAzNjAwMDA7XG4gICAgfVxuXG4gICAgY29uc3QgZmlsZUlkID0gKG9wdHMuZmlsZUlkICYmIHRoaXMuc2FuaXRpemUob3B0cy5maWxlSWQsIDIwLCAnYScpKSB8fCBSYW5kb20uaWQoKTtcbiAgICBjb25zdCBmc05hbWUgPSB0aGlzLm5hbWluZ0Z1bmN0aW9uID8gdGhpcy5uYW1pbmdGdW5jdGlvbihvcHRzKSA6IGZpbGVJZDtcbiAgICBjb25zdCBwYXRoUGFydHMgPSB1cmwuc3BsaXQoJy8nKTtcbiAgICBjb25zdCBmaWxlTmFtZSA9IChvcHRzLm5hbWUgfHwgb3B0cy5maWxlTmFtZSkgPyAob3B0cy5uYW1lIHx8IG9wdHMuZmlsZU5hbWUpIDogcGF0aFBhcnRzW3BhdGhQYXJ0cy5sZW5ndGggLSAxXS5zcGxpdCgnPycpWzBdIHx8IGZzTmFtZTtcblxuICAgIGNvbnN0IHtleHRlbnNpb24sIGV4dGVuc2lvbldpdGhEb3R9ID0gdGhpcy5fZ2V0RXh0KGZpbGVOYW1lKTtcbiAgICBvcHRzLnBhdGggPSBgJHt0aGlzLnN0b3JhZ2VQYXRoKG9wdHMpfSR7bm9kZVBhdGguc2VwfSR7ZnNOYW1lfSR7ZXh0ZW5zaW9uV2l0aERvdH1gO1xuXG4gICAgY29uc3Qgc3RvcmVSZXN1bHQgPSAocmVzdWx0LCBjYikgPT4ge1xuICAgICAgcmVzdWx0Ll9pZCA9IGZpbGVJZDtcblxuICAgICAgdGhpcy5jb2xsZWN0aW9uLmluc2VydChyZXN1bHQsIChlcnJvciwgX2lkKSA9PiB7XG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgIGNiICYmIGNiKGVycm9yKTtcbiAgICAgICAgICB0aGlzLl9kZWJ1ZyhgW0ZpbGVzQ29sbGVjdGlvbl0gW2xvYWRdIFtpbnNlcnRdIEVycm9yOiAke2ZpbGVOYW1lfSAtPiAke3RoaXMuY29sbGVjdGlvbk5hbWV9YCwgZXJyb3IpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IGZpbGVSZWYgPSB0aGlzLmNvbGxlY3Rpb24uZmluZE9uZShfaWQpO1xuICAgICAgICAgIGNiICYmIGNiKG51bGwsIGZpbGVSZWYpO1xuICAgICAgICAgIGlmIChwcm9jZWVkQWZ0ZXJVcGxvYWQgPT09IHRydWUpIHtcbiAgICAgICAgICAgIHRoaXMub25BZnRlclVwbG9hZCAmJiB0aGlzLm9uQWZ0ZXJVcGxvYWQuY2FsbCh0aGlzLCBmaWxlUmVmKTtcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnYWZ0ZXJVcGxvYWQnLCBmaWxlUmVmKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFtsb2FkXSBbaW5zZXJ0XSAke2ZpbGVOYW1lfSAtPiAke3RoaXMuY29sbGVjdGlvbk5hbWV9YCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBmcy5zdGF0KG9wdHMucGF0aCwgKHN0YXRFcnJvciwgc3RhdHMpID0+IHtcbiAgICAgIGJvdW5kKCgpID0+IHtcbiAgICAgICAgaWYgKHN0YXRFcnJvciB8fCAhc3RhdHMuaXNGaWxlKCkpIHtcbiAgICAgICAgICBjb25zdCBwYXRocyA9IG9wdHMucGF0aC5zcGxpdCgnLycpO1xuICAgICAgICAgIHBhdGhzLnBvcCgpO1xuICAgICAgICAgIGZzLm1rZGlyU3luYyhwYXRocy5qb2luKCcvJyksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmMob3B0cy5wYXRoLCAnJyk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgaXNFbmRlZCA9IGZhbHNlO1xuICAgICAgICBsZXQgdGltZXIgPSBudWxsO1xuICAgICAgICBjb25zdCB3U3RyZWFtID0gZnMuY3JlYXRlV3JpdGVTdHJlYW0ob3B0cy5wYXRoLCB7ZmxhZ3M6ICd3JywgbW9kZTogdGhpcy5wZXJtaXNzaW9ucywgYXV0b0Nsb3NlOiB0cnVlLCBlbWl0Q2xvc2U6IGZhbHNlIH0pO1xuICAgICAgICBjb25zdCBvbkVuZCA9IChfZXJyb3IsIHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgaWYgKCFpc0VuZGVkKSB7XG4gICAgICAgICAgICBpZiAodGltZXIpIHtcbiAgICAgICAgICAgICAgTWV0ZW9yLmNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICAgICAgICAgIHRpbWVyID0gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaXNFbmRlZCA9IHRydWU7XG4gICAgICAgICAgICBpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2Uuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgICAgdGhpcy5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFtsb2FkXSBSZWNlaXZlZDogJHt1cmx9YCk7XG4gICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuX2RhdGFUb1NjaGVtYSh7XG4gICAgICAgICAgICAgICAgbmFtZTogZmlsZU5hbWUsXG4gICAgICAgICAgICAgICAgcGF0aDogb3B0cy5wYXRoLFxuICAgICAgICAgICAgICAgIG1ldGE6IG9wdHMubWV0YSxcbiAgICAgICAgICAgICAgICB0eXBlOiBvcHRzLnR5cGUgfHwgcmVzcG9uc2UuaGVhZGVycy5nZXQoJ2NvbnRlbnQtdHlwZScpIHx8IHRoaXMuX2dldE1pbWVUeXBlKHtwYXRoOiBvcHRzLnBhdGh9KSxcbiAgICAgICAgICAgICAgICBzaXplOiBvcHRzLnNpemUgfHwgcGFyc2VJbnQocmVzcG9uc2UuaGVhZGVycy5nZXQoJ2NvbnRlbnQtbGVuZ3RoJykgfHwgMCksXG4gICAgICAgICAgICAgICAgdXNlcklkOiBvcHRzLnVzZXJJZCxcbiAgICAgICAgICAgICAgICBleHRlbnNpb25cbiAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgaWYgKCFyZXN1bHQuc2l6ZSkge1xuICAgICAgICAgICAgICAgIGZzLnN0YXQob3B0cy5wYXRoLCAoc3RhdEVycm9yT25FbmQsIG5ld1N0YXRzKSA9PiB7XG4gICAgICAgICAgICAgICAgICBib3VuZCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdGF0RXJyb3JPbkVuZCkge1xuICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKHN0YXRFcnJvck9uRW5kKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICByZXN1bHQudmVyc2lvbnMub3JpZ2luYWwuc2l6ZSA9IChyZXN1bHQuc2l6ZSA9IG5ld1N0YXRzLnNpemUpO1xuICAgICAgICAgICAgICAgICAgICAgIHN0b3JlUmVzdWx0KHJlc3VsdCwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzdG9yZVJlc3VsdChyZXN1bHQsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgY29uc3QgZXJyb3IgPSBfZXJyb3IgfHwgbmV3IE1ldGVvci5FcnJvcihyZXNwb25zZT8uc3RhdHVzIHx8IDQwOCwgcmVzcG9uc2U/LnN0YXR1c1RleHQgfHwgJ0JhZCByZXNwb25zZSB3aXRoIGVtcHR5IGRldGFpbHMnKTtcbiAgICAgICAgICAgICAgdGhpcy5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFtsb2FkXSBbZmV0Y2goJHt1cmx9KV0gRXJyb3I6YCwgZXJyb3IpO1xuXG4gICAgICAgICAgICAgIGlmICghd1N0cmVhbS5kZXN0cm95ZWQpIHtcbiAgICAgICAgICAgICAgICB3U3RyZWFtLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGZzLnVubGluayhvcHRzLnBhdGgsICh1bmxpbmtFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIGJvdW5kKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKGVycm9yKTtcbiAgICAgICAgICAgICAgICAgIGlmICh1bmxpbmtFcnJvcikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9kZWJ1ZyhgW0ZpbGVzQ29sbGVjdGlvbl0gW2xvYWRdIFtmZXRjaCgke3VybH0pXSBbZnMudW5saW5rKCR7b3B0cy5wYXRofSldIHVubGlua0Vycm9yOmAsIHVubGlua0Vycm9yKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGxldCByZXNwID0gdm9pZCAwO1xuICAgICAgICB3U3RyZWFtLm9uKCdlcnJvcicsIChlcnJvcikgPT4ge1xuICAgICAgICAgIGJvdW5kKCgpID0+IHtcbiAgICAgICAgICAgIG9uRW5kKGVycm9yKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHdTdHJlYW0ub24oJ2Nsb3NlJywgKCkgPT4ge1xuICAgICAgICAgIGJvdW5kKCgpID0+IHtcbiAgICAgICAgICAgIG9uRW5kKHZvaWQgMCwgcmVzcCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICB3U3RyZWFtLm9uKCdmaW5pc2gnLCAoKSA9PiB7XG4gICAgICAgICAgYm91bmQoKCkgPT4ge1xuICAgICAgICAgICAgb25FbmQodm9pZCAwLCByZXNwKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgY29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgICAgICAgZmV0Y2godXJsLCB7XG4gICAgICAgICAgaGVhZGVyczogb3B0cy5oZWFkZXJzIHx8IHt9LFxuICAgICAgICAgIHNpZ25hbDogY29udHJvbGxlci5zaWduYWxcbiAgICAgICAgfSkudGhlbigocmVzKSA9PiB7XG4gICAgICAgICAgcmVzcCA9IHJlcztcbiAgICAgICAgICByZXMuYm9keS5vbignZXJyb3InLCAoZXJyb3IpID0+IHtcbiAgICAgICAgICAgIGJvdW5kKCgpID0+IHtcbiAgICAgICAgICAgICAgb25FbmQoZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmVzLmJvZHkucGlwZSh3U3RyZWFtKTtcbiAgICAgICAgfSkuY2F0Y2goKGZldGNoRXJyb3IpID0+IHtcbiAgICAgICAgICBvbkVuZChmZXRjaEVycm9yKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKG9wdHMudGltZW91dCA+IDApIHtcbiAgICAgICAgICB0aW1lciA9IE1ldGVvci5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIG9uRW5kKG5ldyBNZXRlb3IuRXJyb3IoNDA4LCBgUmVxdWVzdCB0aW1lb3V0IGFmdGVyICR7b3B0cy50aW1lb3V0fW1zYCkpO1xuICAgICAgICAgICAgY29udHJvbGxlci5hYm9ydCgpO1xuICAgICAgICAgIH0sIG9wdHMudGltZW91dCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQGxvY3VzIFNlcnZlclxuICAgKiBAbWVtYmVyT2YgRmlsZXNDb2xsZWN0aW9uXG4gICAqIEBuYW1lIGFkZEZpbGVcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGggICAgICAgICAgLSBQYXRoIHRvIGZpbGVcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMgICAgICAgICAgLSBbT3B0aW9uYWxdIE9iamVjdCB3aXRoIGZpbGUtZGF0YVxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0cy50eXBlICAgICAtIFtPcHRpb25hbF0gRmlsZSBtaW1lLXR5cGVcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMubWV0YSAgICAgLSBbT3B0aW9uYWxdIEZpbGUgYWRkaXRpb25hbCBtZXRhLWRhdGFcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMuZmlsZUlkICAgLSBfaWQsIHNhbml0aXplZCwgbWF4LWxlbmd0aDogMjAgc3ltYm9scyBkZWZhdWx0ICpudWxsKlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cy5maWxlTmFtZSAtIFtPcHRpb25hbF0gRmlsZSBuYW1lLCBpZiBub3Qgc3BlY2lmaWVkIGZpbGUgbmFtZSBhbmQgZXh0ZW5zaW9uIHdpbGwgYmUgdGFrZW4gZnJvbSBwYXRoXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBvcHRzLnVzZXJJZCAgIC0gW09wdGlvbmFsXSBVc2VySWQsIGRlZmF1bHQgKm51bGwqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrICAgIC0gW09wdGlvbmFsXSBmdW5jdGlvbihlcnJvciwgZmlsZU9iail7Li4ufVxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IHByb2NlZWRBZnRlclVwbG9hZCAtIFByb2NlZWQgb25BZnRlclVwbG9hZCBob29rXG4gICAqIEBzdW1tYXJ5IEFkZCBmaWxlIGZyb20gRlMgdG8gRmlsZXNDb2xsZWN0aW9uXG4gICAqIEByZXR1cm5zIHtGaWxlc0NvbGxlY3Rpb259IEluc3RhbmNlXG4gICAqL1xuICBhZGRGaWxlKHBhdGgsIF9vcHRzID0ge30sIF9jYWxsYmFjaywgX3Byb2NlZWRBZnRlclVwbG9hZCkge1xuICAgIHRoaXMuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbYWRkRmlsZSgke3BhdGh9KV1gKTtcbiAgICBsZXQgb3B0cyA9IF9vcHRzO1xuICAgIGxldCBjYWxsYmFjayA9IF9jYWxsYmFjaztcbiAgICBsZXQgcHJvY2VlZEFmdGVyVXBsb2FkID0gX3Byb2NlZWRBZnRlclVwbG9hZDtcblxuICAgIGlmIChoZWxwZXJzLmlzRnVuY3Rpb24ob3B0cykpIHtcbiAgICAgIHByb2NlZWRBZnRlclVwbG9hZCA9IGNhbGxiYWNrO1xuICAgICAgY2FsbGJhY2sgPSBvcHRzO1xuICAgICAgb3B0cyA9IHt9O1xuICAgIH0gZWxzZSBpZiAoaGVscGVycy5pc0Jvb2xlYW4oY2FsbGJhY2spKSB7XG4gICAgICBwcm9jZWVkQWZ0ZXJVcGxvYWQgPSBjYWxsYmFjaztcbiAgICB9IGVsc2UgaWYgKGhlbHBlcnMuaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgICBwcm9jZWVkQWZ0ZXJVcGxvYWQgPSBvcHRzO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnB1YmxpYykge1xuICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsICdDYW4gbm90IHJ1biBbYWRkRmlsZV0gb24gcHVibGljIGNvbGxlY3Rpb24hIEp1c3QgTW92ZSBmaWxlIHRvIHJvb3Qgb2YgeW91ciBzZXJ2ZXIsIHRoZW4gYWRkIHJlY29yZCB0byBDb2xsZWN0aW9uJyk7XG4gICAgfVxuXG4gICAgY2hlY2socGF0aCwgU3RyaW5nKTtcbiAgICBjaGVjayhvcHRzLCBNYXRjaC5PcHRpb25hbChPYmplY3QpKTtcbiAgICBjaGVjayhjYWxsYmFjaywgTWF0Y2guT3B0aW9uYWwoRnVuY3Rpb24pKTtcbiAgICBjaGVjayhwcm9jZWVkQWZ0ZXJVcGxvYWQsIE1hdGNoLk9wdGlvbmFsKEJvb2xlYW4pKTtcblxuICAgIGZzLnN0YXQocGF0aCwgKHN0YXRFcnIsIHN0YXRzKSA9PiBib3VuZCgoKSA9PiB7XG4gICAgICBpZiAoc3RhdEVycikge1xuICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayhzdGF0RXJyKTtcbiAgICAgIH0gZWxzZSBpZiAoc3RhdHMuaXNGaWxlKCkpIHtcbiAgICAgICAgaWYgKCFoZWxwZXJzLmlzT2JqZWN0KG9wdHMpKSB7XG4gICAgICAgICAgb3B0cyA9IHt9O1xuICAgICAgICB9XG4gICAgICAgIG9wdHMucGF0aCA9IHBhdGg7XG5cbiAgICAgICAgaWYgKCFvcHRzLmZpbGVOYW1lKSB7XG4gICAgICAgICAgY29uc3QgcGF0aFBhcnRzID0gcGF0aC5zcGxpdChub2RlUGF0aC5zZXApO1xuICAgICAgICAgIG9wdHMuZmlsZU5hbWUgPSBwYXRoLnNwbGl0KG5vZGVQYXRoLnNlcClbcGF0aFBhcnRzLmxlbmd0aCAtIDFdO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qge2V4dGVuc2lvbn0gPSB0aGlzLl9nZXRFeHQob3B0cy5maWxlTmFtZSk7XG5cbiAgICAgICAgaWYgKCFoZWxwZXJzLmlzU3RyaW5nKG9wdHMudHlwZSkpIHtcbiAgICAgICAgICBvcHRzLnR5cGUgPSB0aGlzLl9nZXRNaW1lVHlwZShvcHRzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghaGVscGVycy5pc09iamVjdChvcHRzLm1ldGEpKSB7XG4gICAgICAgICAgb3B0cy5tZXRhID0ge307XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWhlbHBlcnMuaXNOdW1iZXIob3B0cy5zaXplKSkge1xuICAgICAgICAgIG9wdHMuc2l6ZSA9IHN0YXRzLnNpemU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLl9kYXRhVG9TY2hlbWEoe1xuICAgICAgICAgIG5hbWU6IG9wdHMuZmlsZU5hbWUsXG4gICAgICAgICAgcGF0aCxcbiAgICAgICAgICBtZXRhOiBvcHRzLm1ldGEsXG4gICAgICAgICAgdHlwZTogb3B0cy50eXBlLFxuICAgICAgICAgIHNpemU6IG9wdHMuc2l6ZSxcbiAgICAgICAgICB1c2VySWQ6IG9wdHMudXNlcklkLFxuICAgICAgICAgIGV4dGVuc2lvbixcbiAgICAgICAgICBfc3RvcmFnZVBhdGg6IHBhdGgucmVwbGFjZShgJHtub2RlUGF0aC5zZXB9JHtvcHRzLmZpbGVOYW1lfWAsICcnKSxcbiAgICAgICAgICBmaWxlSWQ6IChvcHRzLmZpbGVJZCAmJiB0aGlzLnNhbml0aXplKG9wdHMuZmlsZUlkLCAyMCwgJ2EnKSkgfHwgbnVsbFxuICAgICAgICB9KTtcblxuXG4gICAgICAgIHRoaXMuY29sbGVjdGlvbi5pbnNlcnQocmVzdWx0LCAoaW5zZXJ0RXJyLCBfaWQpID0+IHtcbiAgICAgICAgICBpZiAoaW5zZXJ0RXJyKSB7XG4gICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayhpbnNlcnRFcnIpO1xuICAgICAgICAgICAgdGhpcy5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFthZGRGaWxlXSBbaW5zZXJ0XSBFcnJvcjogJHtyZXN1bHQubmFtZX0gLT4gJHt0aGlzLmNvbGxlY3Rpb25OYW1lfWAsIGluc2VydEVycik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGZpbGVSZWYgPSB0aGlzLmNvbGxlY3Rpb24uZmluZE9uZShfaWQpO1xuICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2sobnVsbCwgZmlsZVJlZik7XG4gICAgICAgICAgICBpZiAocHJvY2VlZEFmdGVyVXBsb2FkID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgIHRoaXMub25BZnRlclVwbG9hZCAmJiB0aGlzLm9uQWZ0ZXJVcGxvYWQuY2FsbCh0aGlzLCBmaWxlUmVmKTtcbiAgICAgICAgICAgICAgdGhpcy5lbWl0KCdhZnRlclVwbG9hZCcsIGZpbGVSZWYpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFthZGRGaWxlXTogJHtyZXN1bHQubmFtZX0gLT4gJHt0aGlzLmNvbGxlY3Rpb25OYW1lfWApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayhuZXcgTWV0ZW9yLkVycm9yKDQwMCwgYFtGaWxlc0NvbGxlY3Rpb25dIFthZGRGaWxlKCR7cGF0aH0pXTogRmlsZSBkb2VzIG5vdCBleGlzdGApKTtcbiAgICAgIH1cbiAgICB9KSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlc0NvbGxlY3Rpb25cbiAgICogQG5hbWUgcmVtb3ZlXG4gICAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdH0gc2VsZWN0b3IgLSBNb25nby1TdHlsZSBzZWxlY3RvciAoaHR0cDovL2RvY3MubWV0ZW9yLmNvbS9hcGkvY29sbGVjdGlvbnMuaHRtbCNzZWxlY3RvcnMpXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0gQ2FsbGJhY2sgd2l0aCBvbmUgYGVycm9yYCBhcmd1bWVudFxuICAgKiBAc3VtbWFyeSBSZW1vdmUgZG9jdW1lbnRzIGZyb20gdGhlIGNvbGxlY3Rpb25cbiAgICogQHJldHVybnMge0ZpbGVzQ29sbGVjdGlvbn0gSW5zdGFuY2VcbiAgICovXG4gIHJlbW92ZShzZWxlY3RvciwgY2FsbGJhY2spIHtcbiAgICB0aGlzLl9kZWJ1ZyhgW0ZpbGVzQ29sbGVjdGlvbl0gW3JlbW92ZSgke0pTT04uc3RyaW5naWZ5KHNlbGVjdG9yKX0pXWApO1xuICAgIGlmIChzZWxlY3RvciA9PT0gdm9pZCAwKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgY2hlY2soY2FsbGJhY2ssIE1hdGNoLk9wdGlvbmFsKEZ1bmN0aW9uKSk7XG5cbiAgICBjb25zdCBmaWxlcyA9IHRoaXMuY29sbGVjdGlvbi5maW5kKHNlbGVjdG9yKTtcbiAgICBpZiAoZmlsZXMuY291bnQoKSA+IDApIHtcbiAgICAgIGZpbGVzLmZvckVhY2goKGZpbGUpID0+IHtcbiAgICAgICAgdGhpcy51bmxpbmsoZmlsZSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2sobmV3IE1ldGVvci5FcnJvcig0MDQsICdDdXJzb3IgaXMgZW1wdHksIG5vIGZpbGVzIGlzIHJlbW92ZWQnKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vbkFmdGVyUmVtb3ZlKSB7XG4gICAgICBjb25zdCBkb2NzID0gZmlsZXMuZmV0Y2goKTtcbiAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgICAgdGhpcy5jb2xsZWN0aW9uLnJlbW92ZShzZWxlY3RvciwgZnVuY3Rpb24gKCkge1xuICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjay5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICBzZWxmLm9uQWZ0ZXJSZW1vdmUoZG9jcyk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jb2xsZWN0aW9uLnJlbW92ZShzZWxlY3RvciwgKGNhbGxiYWNrIHx8IG5vb3ApKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQGxvY3VzIFNlcnZlclxuICAgKiBAbWVtYmVyT2YgRmlsZXNDb2xsZWN0aW9uXG4gICAqIEBuYW1lIGRlbnlcbiAgICogQHBhcmFtIHtPYmplY3R9IHJ1bGVzXG4gICAqIEBzZWUgIGh0dHBzOi8vZG9jcy5tZXRlb3IuY29tL2FwaS9jb2xsZWN0aW9ucy5odG1sI01vbmdvLUNvbGxlY3Rpb24tZGVueVxuICAgKiBAc3VtbWFyeSBsaW5rIE1vbmdvLkNvbGxlY3Rpb24gZGVueSBtZXRob2RzXG4gICAqIEByZXR1cm5zIHtNb25nby5Db2xsZWN0aW9ufSBJbnN0YW5jZVxuICAgKi9cbiAgZGVueShydWxlcykge1xuICAgIHRoaXMuY29sbGVjdGlvbi5kZW55KHJ1bGVzKTtcbiAgICByZXR1cm4gdGhpcy5jb2xsZWN0aW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIEBsb2N1cyBTZXJ2ZXJcbiAgICogQG1lbWJlck9mIEZpbGVzQ29sbGVjdGlvblxuICAgKiBAbmFtZSBhbGxvd1xuICAgKiBAcGFyYW0ge09iamVjdH0gcnVsZXNcbiAgICogQHNlZSBodHRwczovL2RvY3MubWV0ZW9yLmNvbS9hcGkvY29sbGVjdGlvbnMuaHRtbCNNb25nby1Db2xsZWN0aW9uLWFsbG93XG4gICAqIEBzdW1tYXJ5IGxpbmsgTW9uZ28uQ29sbGVjdGlvbiBhbGxvdyBtZXRob2RzXG4gICAqIEByZXR1cm5zIHtNb25nby5Db2xsZWN0aW9ufSBJbnN0YW5jZVxuICAgKi9cbiAgYWxsb3cocnVsZXMpIHtcbiAgICB0aGlzLmNvbGxlY3Rpb24uYWxsb3cocnVsZXMpO1xuICAgIHJldHVybiB0aGlzLmNvbGxlY3Rpb247XG4gIH1cblxuICAvKipcbiAgICogQGxvY3VzIFNlcnZlclxuICAgKiBAbWVtYmVyT2YgRmlsZXNDb2xsZWN0aW9uXG4gICAqIEBuYW1lIGRlbnlDbGllbnRcbiAgICogQHNlZSBodHRwczovL2RvY3MubWV0ZW9yLmNvbS9hcGkvY29sbGVjdGlvbnMuaHRtbCNNb25nby1Db2xsZWN0aW9uLWRlbnlcbiAgICogQHN1bW1hcnkgU2hvcnRoYW5kcyBmb3IgTW9uZ28uQ29sbGVjdGlvbiBkZW55IG1ldGhvZFxuICAgKiBAcmV0dXJucyB7TW9uZ28uQ29sbGVjdGlvbn0gSW5zdGFuY2VcbiAgICovXG4gIGRlbnlDbGllbnQoKSB7XG4gICAgdGhpcy5jb2xsZWN0aW9uLmRlbnkoe1xuICAgICAgaW5zZXJ0KCkgeyByZXR1cm4gdHJ1ZTsgfSxcbiAgICAgIHVwZGF0ZSgpIHsgcmV0dXJuIHRydWU7IH0sXG4gICAgICByZW1vdmUoKSB7IHJldHVybiB0cnVlOyB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXMuY29sbGVjdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBAbG9jdXMgU2VydmVyXG4gICAqIEBtZW1iZXJPZiBGaWxlc0NvbGxlY3Rpb25cbiAgICogQG5hbWUgYWxsb3dDbGllbnRcbiAgICogQHNlZSBodHRwczovL2RvY3MubWV0ZW9yLmNvbS9hcGkvY29sbGVjdGlvbnMuaHRtbCNNb25nby1Db2xsZWN0aW9uLWFsbG93XG4gICAqIEBzdW1tYXJ5IFNob3J0aGFuZHMgZm9yIE1vbmdvLkNvbGxlY3Rpb24gYWxsb3cgbWV0aG9kXG4gICAqIEByZXR1cm5zIHtNb25nby5Db2xsZWN0aW9ufSBJbnN0YW5jZVxuICAgKi9cbiAgYWxsb3dDbGllbnQoKSB7XG4gICAgdGhpcy5jb2xsZWN0aW9uLmFsbG93KHtcbiAgICAgIGluc2VydCgpIHsgcmV0dXJuIHRydWU7IH0sXG4gICAgICB1cGRhdGUoKSB7IHJldHVybiB0cnVlOyB9LFxuICAgICAgcmVtb3ZlKCkgeyByZXR1cm4gdHJ1ZTsgfVxuICAgIH0pO1xuICAgIHJldHVybiB0aGlzLmNvbGxlY3Rpb247XG4gIH1cblxuXG4gIC8qKlxuICAgKiBAbG9jdXMgU2VydmVyXG4gICAqIEBtZW1iZXJPZiBGaWxlc0NvbGxlY3Rpb25cbiAgICogQG5hbWUgdW5saW5rXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBmaWxlUmVmIC0gZmlsZU9ialxuICAgKiBAcGFyYW0ge1N0cmluZ30gdmVyc2lvbiAtIFtPcHRpb25hbF0gZmlsZSdzIHZlcnNpb25cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBbT3B0aW9uYWxdIGNhbGxiYWNrIGZ1bmN0aW9uXG4gICAqIEBzdW1tYXJ5IFVubGluayBmaWxlcyBhbmQgaXQncyB2ZXJzaW9ucyBmcm9tIEZTXG4gICAqIEByZXR1cm5zIHtGaWxlc0NvbGxlY3Rpb259IEluc3RhbmNlXG4gICAqL1xuICB1bmxpbmsoZmlsZVJlZiwgdmVyc2lvbiwgY2FsbGJhY2spIHtcbiAgICB0aGlzLl9kZWJ1ZyhgW0ZpbGVzQ29sbGVjdGlvbl0gW3VubGluaygke2ZpbGVSZWYuX2lkfSwgJHt2ZXJzaW9ufSldYCk7XG4gICAgaWYgKHZlcnNpb24pIHtcbiAgICAgIGlmIChoZWxwZXJzLmlzT2JqZWN0KGZpbGVSZWYudmVyc2lvbnMpICYmIGhlbHBlcnMuaXNPYmplY3QoZmlsZVJlZi52ZXJzaW9uc1t2ZXJzaW9uXSkgJiYgZmlsZVJlZi52ZXJzaW9uc1t2ZXJzaW9uXS5wYXRoKSB7XG4gICAgICAgIGZzLnVubGluayhmaWxlUmVmLnZlcnNpb25zW3ZlcnNpb25dLnBhdGgsIChjYWxsYmFjayB8fCBub29wKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChoZWxwZXJzLmlzT2JqZWN0KGZpbGVSZWYudmVyc2lvbnMpKSB7XG4gICAgICAgIGZvcihsZXQgdktleSBpbiBmaWxlUmVmLnZlcnNpb25zKSB7XG4gICAgICAgICAgaWYgKGZpbGVSZWYudmVyc2lvbnNbdktleV0gJiYgZmlsZVJlZi52ZXJzaW9uc1t2S2V5XS5wYXRoKSB7XG4gICAgICAgICAgICBmcy51bmxpbmsoZmlsZVJlZi52ZXJzaW9uc1t2S2V5XS5wYXRoLCAoY2FsbGJhY2sgfHwgbm9vcCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZnMudW5saW5rKGZpbGVSZWYucGF0aCwgKGNhbGxiYWNrIHx8IG5vb3ApKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQGxvY3VzIFNlcnZlclxuICAgKiBAbWVtYmVyT2YgRmlsZXNDb2xsZWN0aW9uXG4gICAqIEBuYW1lIF80MDRcbiAgICogQHN1bW1hcnkgSW50ZXJuYWwgbWV0aG9kLCB1c2VkIHRvIHJldHVybiA0MDQgZXJyb3JcbiAgICogQHJldHVybnMge3VuZGVmaW5lZH1cbiAgICovXG4gIF80MDQoaHR0cCkge1xuICAgIHRoaXMuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbZG93bmxvYWQoJHtodHRwLnJlcXVlc3Qub3JpZ2luYWxVcmx9KV0gW180MDRdIEZpbGUgbm90IGZvdW5kYCk7XG4gICAgY29uc3QgdGV4dCA9ICdGaWxlIE5vdCBGb3VuZCA6KCc7XG5cbiAgICBpZiAoIWh0dHAucmVzcG9uc2UuaGVhZGVyc1NlbnQpIHtcbiAgICAgIGh0dHAucmVzcG9uc2Uud3JpdGVIZWFkKDQwNCwge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ3RleHQvcGxhaW4nLFxuICAgICAgICAnQ29udGVudC1MZW5ndGgnOiB0ZXh0Lmxlbmd0aFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKCFodHRwLnJlc3BvbnNlLmZpbmlzaGVkKSB7XG4gICAgICBodHRwLnJlc3BvbnNlLmVuZCh0ZXh0KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQGxvY3VzIFNlcnZlclxuICAgKiBAbWVtYmVyT2YgRmlsZXNDb2xsZWN0aW9uXG4gICAqIEBuYW1lIGRvd25sb2FkXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBodHRwICAgIC0gU2VydmVyIEhUVFAgb2JqZWN0XG4gICAqIEBwYXJhbSB7U3RyaW5nfSB2ZXJzaW9uIC0gUmVxdWVzdGVkIGZpbGUgdmVyc2lvblxuICAgKiBAcGFyYW0ge09iamVjdH0gZmlsZVJlZiAtIFJlcXVlc3RlZCBmaWxlIE9iamVjdFxuICAgKiBAc3VtbWFyeSBJbml0aWF0ZXMgdGhlIEhUVFAgcmVzcG9uc2VcbiAgICogQHJldHVybnMge3VuZGVmaW5lZH1cbiAgICovXG4gIGRvd25sb2FkKGh0dHAsIHZlcnNpb24gPSAnb3JpZ2luYWwnLCBmaWxlUmVmKSB7XG4gICAgbGV0IHZSZWY7XG4gICAgdGhpcy5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFtkb3dubG9hZCgke2h0dHAucmVxdWVzdC5vcmlnaW5hbFVybH0sICR7dmVyc2lvbn0pXWApO1xuXG4gICAgaWYgKGZpbGVSZWYpIHtcbiAgICAgIGlmIChoZWxwZXJzLmhhcyhmaWxlUmVmLCAndmVyc2lvbnMnKSAmJiBoZWxwZXJzLmhhcyhmaWxlUmVmLnZlcnNpb25zLCB2ZXJzaW9uKSkge1xuICAgICAgICB2UmVmID0gZmlsZVJlZi52ZXJzaW9uc1t2ZXJzaW9uXTtcbiAgICAgICAgdlJlZi5faWQgPSBmaWxlUmVmLl9pZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZSZWYgPSBmaWxlUmVmO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB2UmVmID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKCF2UmVmIHx8ICFoZWxwZXJzLmlzT2JqZWN0KHZSZWYpKSB7XG4gICAgICByZXR1cm4gdGhpcy5fNDA0KGh0dHApO1xuICAgIH0gZWxzZSBpZiAoZmlsZVJlZikge1xuICAgICAgaWYgKGhlbHBlcnMuaXNGdW5jdGlvbih0aGlzLmRvd25sb2FkQ2FsbGJhY2spICYmICF0aGlzLmRvd25sb2FkQ2FsbGJhY2suY2FsbChPYmplY3QuYXNzaWduKGh0dHAsIHRoaXMuX2dldFVzZXIoaHR0cCkpLCBmaWxlUmVmKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fNDA0KGh0dHApO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5pbnRlcmNlcHREb3dubG9hZCAmJiBoZWxwZXJzLmlzRnVuY3Rpb24odGhpcy5pbnRlcmNlcHREb3dubG9hZCkgJiYgdGhpcy5pbnRlcmNlcHREb3dubG9hZChodHRwLCBmaWxlUmVmLCB2ZXJzaW9uKSA9PT0gdHJ1ZSkge1xuICAgICAgICByZXR1cm4gdm9pZCAwO1xuICAgICAgfVxuXG4gICAgICBmcy5zdGF0KHZSZWYucGF0aCwgKHN0YXRFcnIsIHN0YXRzKSA9PiBib3VuZCgoKSA9PiB7XG4gICAgICAgIGxldCByZXNwb25zZVR5cGU7XG4gICAgICAgIGlmIChzdGF0RXJyIHx8ICFzdGF0cy5pc0ZpbGUoKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLl80MDQoaHR0cCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKHN0YXRzLnNpemUgIT09IHZSZWYuc2l6ZSkgJiYgIXRoaXMuaW50ZWdyaXR5Q2hlY2spIHtcbiAgICAgICAgICB2UmVmLnNpemUgPSBzdGF0cy5zaXplO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKChzdGF0cy5zaXplICE9PSB2UmVmLnNpemUpICYmIHRoaXMuaW50ZWdyaXR5Q2hlY2spIHtcbiAgICAgICAgICByZXNwb25zZVR5cGUgPSAnNDAwJztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLnNlcnZlKGh0dHAsIGZpbGVSZWYsIHZSZWYsIHZlcnNpb24sIG51bGwsIChyZXNwb25zZVR5cGUgfHwgJzIwMCcpKTtcbiAgICAgIH0pKTtcbiAgICAgIHJldHVybiB2b2lkIDA7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl80MDQoaHR0cCk7XG4gIH1cblxuICAvKipcbiAgICogQGxvY3VzIFNlcnZlclxuICAgKiBAbWVtYmVyT2YgRmlsZXNDb2xsZWN0aW9uXG4gICAqIEBuYW1lIHNlcnZlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBodHRwICAgIC0gU2VydmVyIEhUVFAgb2JqZWN0XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBmaWxlUmVmIC0gUmVxdWVzdGVkIGZpbGUgT2JqZWN0XG4gICAqIEBwYXJhbSB7T2JqZWN0fSB2UmVmICAgIC0gUmVxdWVzdGVkIGZpbGUgdmVyc2lvbiBPYmplY3RcbiAgICogQHBhcmFtIHtTdHJpbmd9IHZlcnNpb24gLSBSZXF1ZXN0ZWQgZmlsZSB2ZXJzaW9uXG4gICAqIEBwYXJhbSB7c3RyZWFtLlJlYWRhYmxlfG51bGx9IHJlYWRhYmxlU3RyZWFtIC0gUmVhZGFibGUgc3RyZWFtLCB3aGljaCBzZXJ2ZXMgYmluYXJ5IGZpbGUgZGF0YVxuICAgKiBAcGFyYW0ge1N0cmluZ30gcmVzcG9uc2VUeXBlIC0gUmVzcG9uc2UgY29kZVxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IGZvcmNlMjAwIC0gRm9yY2UgMjAwIHJlc3BvbnNlIGNvZGUgb3ZlciAyMDZcbiAgICogQHN1bW1hcnkgSGFuZGxlIGFuZCByZXBseSB0byBpbmNvbWluZyByZXF1ZXN0XG4gICAqIEByZXR1cm5zIHt1bmRlZmluZWR9XG4gICAqL1xuICBzZXJ2ZShodHRwLCBmaWxlUmVmLCB2UmVmLCB2ZXJzaW9uID0gJ29yaWdpbmFsJywgcmVhZGFibGVTdHJlYW0gPSBudWxsLCBfcmVzcG9uc2VUeXBlID0gJzIwMCcsIGZvcmNlMjAwID0gZmFsc2UpIHtcbiAgICBsZXQgcGFydGlyYWwgPSBmYWxzZTtcbiAgICBsZXQgcmVxUmFuZ2UgPSBmYWxzZTtcbiAgICBsZXQgZGlzcG9zaXRpb25UeXBlID0gJyc7XG4gICAgbGV0IHN0YXJ0O1xuICAgIGxldCBlbmQ7XG4gICAgbGV0IHRha2U7XG4gICAgbGV0IHJlc3BvbnNlVHlwZSA9IF9yZXNwb25zZVR5cGU7XG5cbiAgICBpZiAoaHR0cC5wYXJhbXMucXVlcnkuZG93bmxvYWQgJiYgKGh0dHAucGFyYW1zLnF1ZXJ5LmRvd25sb2FkID09PSAndHJ1ZScpKSB7XG4gICAgICBkaXNwb3NpdGlvblR5cGUgPSAnYXR0YWNobWVudDsgJztcbiAgICB9IGVsc2Uge1xuICAgICAgZGlzcG9zaXRpb25UeXBlID0gJ2lubGluZTsgJztcbiAgICB9XG5cbiAgICBjb25zdCBkaXNwb3NpdGlvbk5hbWUgPSBgZmlsZW5hbWU9XFxcIiR7ZW5jb2RlVVJJKHZSZWYubmFtZSB8fCBmaWxlUmVmLm5hbWUpLnJlcGxhY2UoL1xcLC9nLCAnJTJDJyl9XFxcIjsgZmlsZW5hbWUqPVVURi04Jycke2VuY29kZVVSSUNvbXBvbmVudCh2UmVmLm5hbWUgfHwgZmlsZVJlZi5uYW1lKX07IGA7XG4gICAgY29uc3QgZGlzcG9zaXRpb25FbmNvZGluZyA9ICdjaGFyc2V0PVVURi04JztcblxuICAgIGlmICghaHR0cC5yZXNwb25zZS5oZWFkZXJzU2VudCkge1xuICAgICAgaHR0cC5yZXNwb25zZS5zZXRIZWFkZXIoJ0NvbnRlbnQtRGlzcG9zaXRpb24nLCBkaXNwb3NpdGlvblR5cGUgKyBkaXNwb3NpdGlvbk5hbWUgKyBkaXNwb3NpdGlvbkVuY29kaW5nKTtcbiAgICB9XG5cbiAgICBpZiAoaHR0cC5yZXF1ZXN0LmhlYWRlcnMucmFuZ2UgJiYgIWZvcmNlMjAwKSB7XG4gICAgICBwYXJ0aXJhbCA9IHRydWU7XG4gICAgICBjb25zdCBhcnJheSA9IGh0dHAucmVxdWVzdC5oZWFkZXJzLnJhbmdlLnNwbGl0KC9ieXRlcz0oWzAtOV0qKS0oWzAtOV0qKS8pO1xuICAgICAgc3RhcnQgPSBwYXJzZUludChhcnJheVsxXSk7XG4gICAgICBlbmQgPSBwYXJzZUludChhcnJheVsyXSk7XG4gICAgICBpZiAoaXNOYU4oZW5kKSkge1xuICAgICAgICBlbmQgPSB2UmVmLnNpemUgLSAxO1xuICAgICAgfVxuICAgICAgdGFrZSA9IGVuZCAtIHN0YXJ0O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdGFydCA9IDA7XG4gICAgICBlbmQgPSB2UmVmLnNpemUgLSAxO1xuICAgICAgdGFrZSA9IHZSZWYuc2l6ZTtcbiAgICB9XG5cbiAgICBpZiAocGFydGlyYWwgfHwgKGh0dHAucGFyYW1zLnF1ZXJ5LnBsYXkgJiYgKGh0dHAucGFyYW1zLnF1ZXJ5LnBsYXkgPT09ICd0cnVlJykpKSB7XG4gICAgICByZXFSYW5nZSA9IHtzdGFydCwgZW5kfTtcbiAgICAgIGlmIChpc05hTihzdGFydCkgJiYgIWlzTmFOKGVuZCkpIHtcbiAgICAgICAgcmVxUmFuZ2Uuc3RhcnQgPSBlbmQgLSB0YWtlO1xuICAgICAgICByZXFSYW5nZS5lbmQgPSBlbmQ7XG4gICAgICB9XG4gICAgICBpZiAoIWlzTmFOKHN0YXJ0KSAmJiBpc05hTihlbmQpKSB7XG4gICAgICAgIHJlcVJhbmdlLnN0YXJ0ID0gc3RhcnQ7XG4gICAgICAgIHJlcVJhbmdlLmVuZCA9IHN0YXJ0ICsgdGFrZTtcbiAgICAgIH1cblxuICAgICAgaWYgKChzdGFydCArIHRha2UpID49IHZSZWYuc2l6ZSkge1xuICAgICAgICByZXFSYW5nZS5lbmQgPSB2UmVmLnNpemUgLSAxO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5zdHJpY3QgJiYgKChyZXFSYW5nZS5zdGFydCA+PSAodlJlZi5zaXplIC0gMSkpIHx8IChyZXFSYW5nZS5lbmQgPiAodlJlZi5zaXplIC0gMSkpKSkge1xuICAgICAgICByZXNwb25zZVR5cGUgPSAnNDE2JztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3BvbnNlVHlwZSA9ICcyMDYnO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXNwb25zZVR5cGUgPSAnMjAwJztcbiAgICB9XG5cbiAgICBjb25zdCBzdHJlYW1FcnJvckhhbmRsZXIgPSAoZXJyb3IpID0+IHtcbiAgICAgIHRoaXMuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbc2VydmUoJHt2UmVmLnBhdGh9LCAke3ZlcnNpb259KV0gWzUwMF1gLCBlcnJvcik7XG4gICAgICBpZiAoIWh0dHAucmVzcG9uc2UuZmluaXNoZWQpIHtcbiAgICAgICAgaHR0cC5yZXNwb25zZS5lbmQoZXJyb3IudG9TdHJpbmcoKSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGNvbnN0IGhlYWRlcnMgPSBoZWxwZXJzLmlzRnVuY3Rpb24odGhpcy5yZXNwb25zZUhlYWRlcnMpID8gdGhpcy5yZXNwb25zZUhlYWRlcnMocmVzcG9uc2VUeXBlLCBmaWxlUmVmLCB2UmVmLCB2ZXJzaW9uLCBodHRwKSA6IHRoaXMucmVzcG9uc2VIZWFkZXJzO1xuXG4gICAgaWYgKCFoZWFkZXJzWydDYWNoZS1Db250cm9sJ10pIHtcbiAgICAgIGlmICghaHR0cC5yZXNwb25zZS5oZWFkZXJzU2VudCkge1xuICAgICAgICBodHRwLnJlc3BvbnNlLnNldEhlYWRlcignQ2FjaGUtQ29udHJvbCcsIHRoaXMuY2FjaGVDb250cm9sKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGxldCBrZXkgaW4gaGVhZGVycykge1xuICAgICAgaWYgKCFodHRwLnJlc3BvbnNlLmhlYWRlcnNTZW50KSB7XG4gICAgICAgIGh0dHAucmVzcG9uc2Uuc2V0SGVhZGVyKGtleSwgaGVhZGVyc1trZXldKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCByZXNwb25kID0gKHN0cmVhbSwgY29kZSkgPT4ge1xuICAgICAgc3RyZWFtLl9pc0VuZGVkID0gZmFsc2U7XG4gICAgICBjb25zdCBjbG9zZVN0cmVhbUNiID0gKGNsb3NlRXJyb3IpID0+IHtcbiAgICAgICAgaWYgKCFjbG9zZUVycm9yKSB7XG4gICAgICAgICAgc3RyZWFtLl9pc0VuZGVkID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLl9kZWJ1ZyhgW0ZpbGVzQ29sbGVjdGlvbl0gW3NlcnZlKCR7dlJlZi5wYXRofSwgJHt2ZXJzaW9ufSldIFtyZXNwb25kXSBbY2xvc2VTdHJlYW1DYl0gKHRoaXMgaXMgZXJyb3Igb24gdGhlIHN0cmVhbSB3ZSB3aXNoIHRvIGZvcmNlZnVsbHkgY2xvc2UgYWZ0ZXIgaXQgaXNuJ3QgbmVlZGVkIGFueW1vcmUuIEl0J3Mgb2theSB0aGF0IGl0IHRocm93cyBlcnJvcnMuIENvbnNpZGVyIHRoaXMgYXMgcHVyZWx5IGluZm9ybWF0aW9uYWwgbWVzc2FnZSlgLCBjbG9zZUVycm9yKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgY29uc3QgY2xvc2VTdHJlYW0gPSAoKSA9PiB7XG4gICAgICAgIGlmICghc3RyZWFtLl9pc0VuZGVkICYmICFzdHJlYW0uZGVzdHJveWVkKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3RyZWFtLmNsb3NlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgIHN0cmVhbS5jbG9zZShjbG9zZVN0cmVhbUNiKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHN0cmVhbS5lbmQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgc3RyZWFtLmVuZChjbG9zZVN0cmVhbUNiKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHN0cmVhbS5kZXN0cm95ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgIHN0cmVhbS5kZXN0cm95KCdHb3QgdG8gY2xvc2UgdGhpcyBzdHJlYW0nLCBjbG9zZVN0cmVhbUNiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoIChjbG9zZVN0cmVhbUVycm9yKSB7XG4gICAgICAgICAgICAvLyBQZXJoYXBzIG9uZSBvZiB0aGUgbWV0aG9kIGhhcyB0aHJvd24gYW4gZXJyb3JcbiAgICAgICAgICAgIC8vIG9yIHN0cmVhbSBoYXMgYmVlbiBhbHJlYWR5IGVuZGVkL2Nsb3NlZC9leGhhdXN0ZWRcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGlmICghaHR0cC5yZXNwb25zZS5oZWFkZXJzU2VudCAmJiByZWFkYWJsZVN0cmVhbSkge1xuICAgICAgICBodHRwLnJlc3BvbnNlLndyaXRlSGVhZChjb2RlKTtcbiAgICAgIH1cblxuICAgICAgaHR0cC5yZXF1ZXN0Lm9uKCdhYm9ydGVkJywgKCkgPT4ge1xuICAgICAgICBodHRwLnJlcXVlc3QuYWJvcnRlZCA9IHRydWU7XG4gICAgICB9KTtcblxuICAgICAgc3RyZWFtLm9uKCdvcGVuJywgKCkgPT4ge1xuICAgICAgICBpZiAoIWh0dHAucmVzcG9uc2UuaGVhZGVyc1NlbnQpIHtcbiAgICAgICAgICBodHRwLnJlc3BvbnNlLndyaXRlSGVhZChjb2RlKTtcbiAgICAgICAgfVxuICAgICAgfSkub24oJ2Fib3J0JywgKCkgPT4ge1xuICAgICAgICBjbG9zZVN0cmVhbSgpO1xuICAgICAgICBpZiAoIWh0dHAucmVzcG9uc2UuZmluaXNoZWQpIHtcbiAgICAgICAgICBodHRwLnJlc3BvbnNlLmVuZCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaHR0cC5yZXF1ZXN0LmFib3J0ZWQpIHtcbiAgICAgICAgICBodHRwLnJlcXVlc3QuZGVzdHJveSgpO1xuICAgICAgICB9XG4gICAgICB9KS5vbignZXJyb3InLCAoZXJyKSA9PiB7XG4gICAgICAgIGNsb3NlU3RyZWFtKCk7XG4gICAgICAgIHN0cmVhbUVycm9ySGFuZGxlcihlcnIpO1xuICAgICAgfSkub24oJ2VuZCcsICgpID0+IHtcbiAgICAgICAgaWYgKCFodHRwLnJlc3BvbnNlLmZpbmlzaGVkKSB7XG4gICAgICAgICAgaHR0cC5yZXNwb25zZS5lbmQoKTtcbiAgICAgICAgfVxuICAgICAgfSkucGlwZShodHRwLnJlc3BvbnNlKTtcbiAgICB9O1xuXG4gICAgc3dpdGNoIChyZXNwb25zZVR5cGUpIHtcbiAgICBjYXNlICc0MDAnOlxuICAgICAgdGhpcy5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFtzZXJ2ZSgke3ZSZWYucGF0aH0sICR7dmVyc2lvbn0pXSBbNDAwXSBDb250ZW50LUxlbmd0aCBtaXNtYXRjaCFgKTtcbiAgICAgIHZhciB0ZXh0ID0gJ0NvbnRlbnQtTGVuZ3RoIG1pc21hdGNoISc7XG5cbiAgICAgIGlmICghaHR0cC5yZXNwb25zZS5oZWFkZXJzU2VudCkge1xuICAgICAgICBodHRwLnJlc3BvbnNlLndyaXRlSGVhZCg0MDAsIHtcbiAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ3RleHQvcGxhaW4nLFxuICAgICAgICAgICdDb250ZW50LUxlbmd0aCc6IHRleHQubGVuZ3RoXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWh0dHAucmVzcG9uc2UuZmluaXNoZWQpIHtcbiAgICAgICAgaHR0cC5yZXNwb25zZS5lbmQodGV4dCk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICc0MDQnOlxuICAgICAgdGhpcy5fNDA0KGh0dHApO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnNDE2JzpcbiAgICAgIHRoaXMuX2RlYnVnKGBbRmlsZXNDb2xsZWN0aW9uXSBbc2VydmUoJHt2UmVmLnBhdGh9LCAke3ZlcnNpb259KV0gWzQxNl0gQ29udGVudC1SYW5nZSBpcyBub3Qgc3BlY2lmaWVkIWApO1xuICAgICAgaWYgKCFodHRwLnJlc3BvbnNlLmhlYWRlcnNTZW50KSB7XG4gICAgICAgIGh0dHAucmVzcG9uc2Uud3JpdGVIZWFkKDQxNik7XG4gICAgICB9XG4gICAgICBpZiAoIWh0dHAucmVzcG9uc2UuZmluaXNoZWQpIHtcbiAgICAgICAgaHR0cC5yZXNwb25zZS5lbmQoKTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJzIwNic6XG4gICAgICB0aGlzLl9kZWJ1ZyhgW0ZpbGVzQ29sbGVjdGlvbl0gW3NlcnZlKCR7dlJlZi5wYXRofSwgJHt2ZXJzaW9ufSldIFsyMDZdYCk7XG4gICAgICBpZiAoIWh0dHAucmVzcG9uc2UuaGVhZGVyc1NlbnQpIHtcbiAgICAgICAgaHR0cC5yZXNwb25zZS5zZXRIZWFkZXIoJ0NvbnRlbnQtUmFuZ2UnLCBgYnl0ZXMgJHtyZXFSYW5nZS5zdGFydH0tJHtyZXFSYW5nZS5lbmR9LyR7dlJlZi5zaXplfWApO1xuICAgICAgfVxuICAgICAgcmVzcG9uZChyZWFkYWJsZVN0cmVhbSB8fCBmcy5jcmVhdGVSZWFkU3RyZWFtKHZSZWYucGF0aCwge3N0YXJ0OiByZXFSYW5nZS5zdGFydCwgZW5kOiByZXFSYW5nZS5lbmR9KSwgMjA2KTtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBpZiAoIWh0dHAucmVzcG9uc2UuaGVhZGVyc1NlbnQpIHtcbiAgICAgICAgaHR0cC5yZXNwb25zZS5zZXRIZWFkZXIoJ0NvbnRlbnQtTGVuZ3RoJywgYCR7dlJlZi5zaXplfWApO1xuICAgICAgfVxuICAgICAgdGhpcy5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFtzZXJ2ZSgke3ZSZWYucGF0aH0sICR7dmVyc2lvbn0pXSBbMjAwXWApO1xuICAgICAgcmVzcG9uZChyZWFkYWJsZVN0cmVhbSB8fCBmcy5jcmVhdGVSZWFkU3RyZWFtKHZSZWYucGF0aCksIDIwMCk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IHsgRmlsZXNDb2xsZWN0aW9uLCBoZWxwZXJzIH07XG4iLCJpbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSBmcm9tICdldmVudGVtaXR0ZXIzJztcbmltcG9ydCB7IGNoZWNrLCBNYXRjaCB9IGZyb20gJ21ldGVvci9jaGVjayc7XG5pbXBvcnQgeyBmb3JtYXRGbGVVUkwsIGhlbHBlcnMgfSBmcm9tICcuL2xpYi5qcyc7XG5pbXBvcnQgeyBGaWxlc0N1cnNvciwgRmlsZUN1cnNvciB9IGZyb20gJy4vY3Vyc29yLmpzJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRmlsZXNDb2xsZWN0aW9uQ29yZSBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICBzdGF0aWMgX19oZWxwZXJzID0gaGVscGVycztcblxuICBzdGF0aWMgc2NoZW1hID0ge1xuICAgIF9pZDoge1xuICAgICAgdHlwZTogU3RyaW5nXG4gICAgfSxcbiAgICBzaXplOiB7XG4gICAgICB0eXBlOiBOdW1iZXJcbiAgICB9LFxuICAgIG5hbWU6IHtcbiAgICAgIHR5cGU6IFN0cmluZ1xuICAgIH0sXG4gICAgdHlwZToge1xuICAgICAgdHlwZTogU3RyaW5nXG4gICAgfSxcbiAgICBwYXRoOiB7XG4gICAgICB0eXBlOiBTdHJpbmdcbiAgICB9LFxuICAgIGlzVmlkZW86IHtcbiAgICAgIHR5cGU6IEJvb2xlYW5cbiAgICB9LFxuICAgIGlzQXVkaW86IHtcbiAgICAgIHR5cGU6IEJvb2xlYW5cbiAgICB9LFxuICAgIGlzSW1hZ2U6IHtcbiAgICAgIHR5cGU6IEJvb2xlYW5cbiAgICB9LFxuICAgIGlzVGV4dDoge1xuICAgICAgdHlwZTogQm9vbGVhblxuICAgIH0sXG4gICAgaXNKU09OOiB7XG4gICAgICB0eXBlOiBCb29sZWFuXG4gICAgfSxcbiAgICBpc1BERjoge1xuICAgICAgdHlwZTogQm9vbGVhblxuICAgIH0sXG4gICAgZXh0ZW5zaW9uOiB7XG4gICAgICB0eXBlOiBTdHJpbmcsXG4gICAgICBvcHRpb25hbDogdHJ1ZVxuICAgIH0sXG4gICAgZXh0OiB7XG4gICAgICB0eXBlOiBTdHJpbmcsXG4gICAgICBvcHRpb25hbDogdHJ1ZVxuICAgIH0sXG4gICAgZXh0ZW5zaW9uV2l0aERvdDoge1xuICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgb3B0aW9uYWw6IHRydWVcbiAgICB9LFxuICAgIG1pbWU6IHtcbiAgICAgIHR5cGU6IFN0cmluZyxcbiAgICAgIG9wdGlvbmFsOiB0cnVlXG4gICAgfSxcbiAgICAnbWltZS10eXBlJzoge1xuICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgb3B0aW9uYWw6IHRydWVcbiAgICB9LFxuICAgIF9zdG9yYWdlUGF0aDoge1xuICAgICAgdHlwZTogU3RyaW5nXG4gICAgfSxcbiAgICBfZG93bmxvYWRSb3V0ZToge1xuICAgICAgdHlwZTogU3RyaW5nXG4gICAgfSxcbiAgICBfY29sbGVjdGlvbk5hbWU6IHtcbiAgICAgIHR5cGU6IFN0cmluZ1xuICAgIH0sXG4gICAgcHVibGljOiB7XG4gICAgICB0eXBlOiBCb29sZWFuLFxuICAgICAgb3B0aW9uYWw6IHRydWVcbiAgICB9LFxuICAgIG1ldGE6IHtcbiAgICAgIHR5cGU6IE9iamVjdCxcbiAgICAgIGJsYWNrYm94OiB0cnVlLFxuICAgICAgb3B0aW9uYWw6IHRydWVcbiAgICB9LFxuICAgIHVzZXJJZDoge1xuICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgb3B0aW9uYWw6IHRydWVcbiAgICB9LFxuICAgIHVwZGF0ZWRBdDoge1xuICAgICAgdHlwZTogRGF0ZSxcbiAgICAgIG9wdGlvbmFsOiB0cnVlXG4gICAgfSxcbiAgICB2ZXJzaW9uczoge1xuICAgICAgdHlwZTogT2JqZWN0LFxuICAgICAgYmxhY2tib3g6IHRydWVcbiAgICB9XG4gIH07XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlc0NvbGxlY3Rpb25Db3JlXG4gICAqIEBuYW1lIF9kZWJ1Z1xuICAgKiBAc3VtbWFyeSBQcmludCBsb2dzIGluIGRlYnVnIG1vZGVcbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICBfZGVidWcoKSB7XG4gICAgaWYgKHRoaXMuZGVidWcpIHtcbiAgICAgIChjb25zb2xlLmluZm8gfHwgY29uc29sZS5sb2cgfHwgZnVuY3Rpb24gKCkgeyB9KS5hcHBseSh2b2lkIDAsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlc0NvbGxlY3Rpb25Db3JlXG4gICAqIEBuYW1lIF9nZXRGaWxlTmFtZVxuICAgKiBAcGFyYW0ge09iamVjdH0gZmlsZURhdGEgLSBGaWxlIE9iamVjdFxuICAgKiBAc3VtbWFyeSBSZXR1cm5zIGZpbGUncyBuYW1lXG4gICAqIEByZXR1cm5zIHtTdHJpbmd9XG4gICAqL1xuICBfZ2V0RmlsZU5hbWUoZmlsZURhdGEpIHtcbiAgICBjb25zdCBmaWxlTmFtZSA9IGZpbGVEYXRhLm5hbWUgfHwgZmlsZURhdGEuZmlsZU5hbWU7XG4gICAgaWYgKGhlbHBlcnMuaXNTdHJpbmcoZmlsZU5hbWUpICYmIChmaWxlTmFtZS5sZW5ndGggPiAwKSkge1xuICAgICAgcmV0dXJuIChmaWxlRGF0YS5uYW1lIHx8IGZpbGVEYXRhLmZpbGVOYW1lKS5yZXBsYWNlKC9eXFwuXFwuKy8sICcnKS5yZXBsYWNlKC9cXC57Mix9L2csICcuJykucmVwbGFjZSgvXFwvL2csICcnKTtcbiAgICB9XG4gICAgcmV0dXJuICcnO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlc0NvbGxlY3Rpb25Db3JlXG4gICAqIEBuYW1lIF9nZXRFeHRcbiAgICogQHBhcmFtIHtTdHJpbmd9IEZpbGVOYW1lIC0gRmlsZSBuYW1lXG4gICAqIEBzdW1tYXJ5IEdldCBleHRlbnNpb24gZnJvbSBGaWxlTmFtZVxuICAgKiBAcmV0dXJucyB7T2JqZWN0fVxuICAgKi9cbiAgX2dldEV4dChmaWxlTmFtZSkge1xuICAgIGlmIChmaWxlTmFtZS5pbmNsdWRlcygnLicpKSB7XG4gICAgICBjb25zdCBleHRlbnNpb24gPSAoZmlsZU5hbWUuc3BsaXQoJy4nKS5wb3AoKS5zcGxpdCgnPycpWzBdIHx8ICcnKS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoLyhbXmEtejAtOVxcLVxcX1xcLl0rKS9naSwgJycpLnN1YnN0cmluZygwLCAyMCk7XG4gICAgICByZXR1cm4geyBleHQ6IGV4dGVuc2lvbiwgZXh0ZW5zaW9uLCBleHRlbnNpb25XaXRoRG90OiBgLiR7ZXh0ZW5zaW9ufWAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHsgZXh0OiAnJywgZXh0ZW5zaW9uOiAnJywgZXh0ZW5zaW9uV2l0aERvdDogJycgfTtcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyT2YgRmlsZXNDb2xsZWN0aW9uQ29yZVxuICAgKiBAbmFtZSBfdXBkYXRlRmlsZVR5cGVzXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gRmlsZSBkYXRhXG4gICAqIEBzdW1tYXJ5IEludGVybmFsIG1ldGhvZC4gQ2xhc3NpZnkgZmlsZSBiYXNlZCBvbiAndHlwZScgZmllbGRcbiAgICovXG4gIF91cGRhdGVGaWxlVHlwZXMoZGF0YSkge1xuICAgIGRhdGEuaXNWaWRlbyA9IC9edmlkZW9cXC8vaS50ZXN0KGRhdGEudHlwZSk7XG4gICAgZGF0YS5pc0F1ZGlvID0gL15hdWRpb1xcLy9pLnRlc3QoZGF0YS50eXBlKTtcbiAgICBkYXRhLmlzSW1hZ2UgPSAvXmltYWdlXFwvL2kudGVzdChkYXRhLnR5cGUpO1xuICAgIGRhdGEuaXNUZXh0ID0gL150ZXh0XFwvL2kudGVzdChkYXRhLnR5cGUpO1xuICAgIGRhdGEuaXNKU09OID0gL15hcHBsaWNhdGlvblxcL2pzb24kL2kudGVzdChkYXRhLnR5cGUpO1xuICAgIGRhdGEuaXNQREYgPSAvXmFwcGxpY2F0aW9uXFwvKHgtKT9wZGYkL2kudGVzdChkYXRhLnR5cGUpO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlc0NvbGxlY3Rpb25Db3JlXG4gICAqIEBuYW1lIF9kYXRhVG9TY2hlbWFcbiAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBGaWxlIGRhdGFcbiAgICogQHN1bW1hcnkgSW50ZXJuYWwgbWV0aG9kLiBCdWlsZCBvYmplY3QgaW4gYWNjb3JkYW5jZSB3aXRoIGRlZmF1bHQgc2NoZW1hIGZyb20gRmlsZSBkYXRhXG4gICAqIEByZXR1cm5zIHtPYmplY3R9XG4gICAqL1xuICBfZGF0YVRvU2NoZW1hKGRhdGEpIHtcbiAgICBjb25zdCBkcyA9IHtcbiAgICAgIG5hbWU6IGRhdGEubmFtZSxcbiAgICAgIGV4dGVuc2lvbjogZGF0YS5leHRlbnNpb24sXG4gICAgICBleHQ6IGRhdGEuZXh0ZW5zaW9uLFxuICAgICAgZXh0ZW5zaW9uV2l0aERvdDogYC4ke2RhdGEuZXh0ZW5zaW9ufWAsXG4gICAgICBwYXRoOiBkYXRhLnBhdGgsXG4gICAgICBtZXRhOiBkYXRhLm1ldGEsXG4gICAgICB0eXBlOiBkYXRhLnR5cGUsXG4gICAgICBtaW1lOiBkYXRhLnR5cGUsXG4gICAgICAnbWltZS10eXBlJzogZGF0YS50eXBlLFxuICAgICAgc2l6ZTogZGF0YS5zaXplLFxuICAgICAgdXNlcklkOiBkYXRhLnVzZXJJZCB8fCBudWxsLFxuICAgICAgdmVyc2lvbnM6IHtcbiAgICAgICAgb3JpZ2luYWw6IHtcbiAgICAgICAgICBwYXRoOiBkYXRhLnBhdGgsXG4gICAgICAgICAgc2l6ZTogZGF0YS5zaXplLFxuICAgICAgICAgIHR5cGU6IGRhdGEudHlwZSxcbiAgICAgICAgICBleHRlbnNpb246IGRhdGEuZXh0ZW5zaW9uXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBfZG93bmxvYWRSb3V0ZTogZGF0YS5fZG93bmxvYWRSb3V0ZSB8fCB0aGlzLmRvd25sb2FkUm91dGUsXG4gICAgICBfY29sbGVjdGlvbk5hbWU6IGRhdGEuX2NvbGxlY3Rpb25OYW1lIHx8IHRoaXMuY29sbGVjdGlvbk5hbWVcbiAgICB9O1xuXG4gICAgLy9PcHRpb25hbCBmaWxlSWRcbiAgICBpZiAoZGF0YS5maWxlSWQpIHtcbiAgICAgIGRzLl9pZCA9IGRhdGEuZmlsZUlkO1xuICAgIH1cblxuICAgIHRoaXMuX3VwZGF0ZUZpbGVUeXBlcyhkcyk7XG4gICAgZHMuX3N0b3JhZ2VQYXRoID0gZGF0YS5fc3RvcmFnZVBhdGggfHwgdGhpcy5zdG9yYWdlUGF0aChPYmplY3QuYXNzaWduKHt9LCBkYXRhLCBkcykpO1xuICAgIHJldHVybiBkcztcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyT2YgRmlsZXNDb2xsZWN0aW9uQ29yZVxuICAgKiBAbmFtZSBmaW5kT25lXG4gICAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdH0gc2VsZWN0b3IgLSBNb25nby1TdHlsZSBzZWxlY3RvciAoaHR0cDovL2RvY3MubWV0ZW9yLmNvbS9hcGkvY29sbGVjdGlvbnMuaHRtbCNzZWxlY3RvcnMpXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gTW9uZ28tU3R5bGUgc2VsZWN0b3IgT3B0aW9ucyAoaHR0cDovL2RvY3MubWV0ZW9yLmNvbS9hcGkvY29sbGVjdGlvbnMuaHRtbCNzb3J0c3BlY2lmaWVycylcbiAgICogQHN1bW1hcnkgRmluZCBhbmQgcmV0dXJuIEN1cnNvciBmb3IgbWF0Y2hpbmcgZG9jdW1lbnQgT2JqZWN0XG4gICAqIEByZXR1cm5zIHtGaWxlQ3Vyc29yfSBJbnN0YW5jZVxuICAgKi9cbiAgZmluZE9uZShzZWxlY3RvciA9IHt9LCBvcHRpb25zKSB7XG4gICAgdGhpcy5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFtmaW5kT25lKCR7SlNPTi5zdHJpbmdpZnkoc2VsZWN0b3IpfSwgJHtKU09OLnN0cmluZ2lmeShvcHRpb25zKX0pXWApO1xuICAgIGNoZWNrKHNlbGVjdG9yLCBNYXRjaC5PcHRpb25hbChNYXRjaC5PbmVPZihPYmplY3QsIFN0cmluZywgQm9vbGVhbiwgTnVtYmVyLCBudWxsKSkpO1xuICAgIGNoZWNrKG9wdGlvbnMsIE1hdGNoLk9wdGlvbmFsKE9iamVjdCkpO1xuXG4gICAgY29uc3QgZG9jID0gdGhpcy5jb2xsZWN0aW9uLmZpbmRPbmUoc2VsZWN0b3IsIG9wdGlvbnMpO1xuICAgIGlmIChkb2MpIHtcbiAgICAgIHJldHVybiBuZXcgRmlsZUN1cnNvcihkb2MsIHRoaXMpO1xuICAgIH1cbiAgICByZXR1cm4gZG9jO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlc0NvbGxlY3Rpb25Db3JlXG4gICAqIEBuYW1lIGZpbmRcbiAgICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fSBzZWxlY3RvciAtIE1vbmdvLVN0eWxlIHNlbGVjdG9yIChodHRwOi8vZG9jcy5tZXRlb3IuY29tL2FwaS9jb2xsZWN0aW9ucy5odG1sI3NlbGVjdG9ycylcbiAgICogQHBhcmFtIHtPYmplY3R9ICAgICAgICBvcHRpb25zICAtIE1vbmdvLVN0eWxlIHNlbGVjdG9yIE9wdGlvbnMgKGh0dHA6Ly9kb2NzLm1ldGVvci5jb20vYXBpL2NvbGxlY3Rpb25zLmh0bWwjc29ydHNwZWNpZmllcnMpXG4gICAqIEBzdW1tYXJ5IEZpbmQgYW5kIHJldHVybiBDdXJzb3IgZm9yIG1hdGNoaW5nIGRvY3VtZW50c1xuICAgKiBAcmV0dXJucyB7RmlsZXNDdXJzb3J9IEluc3RhbmNlXG4gICAqL1xuICBmaW5kKHNlbGVjdG9yID0ge30sIG9wdGlvbnMpIHtcbiAgICB0aGlzLl9kZWJ1ZyhgW0ZpbGVzQ29sbGVjdGlvbl0gW2ZpbmQoJHtKU09OLnN0cmluZ2lmeShzZWxlY3Rvcil9LCAke0pTT04uc3RyaW5naWZ5KG9wdGlvbnMpfSldYCk7XG4gICAgY2hlY2soc2VsZWN0b3IsIE1hdGNoLk9wdGlvbmFsKE1hdGNoLk9uZU9mKE9iamVjdCwgU3RyaW5nLCBCb29sZWFuLCBOdW1iZXIsIG51bGwpKSk7XG4gICAgY2hlY2sob3B0aW9ucywgTWF0Y2guT3B0aW9uYWwoT2JqZWN0KSk7XG5cbiAgICByZXR1cm4gbmV3IEZpbGVzQ3Vyc29yKHNlbGVjdG9yLCBvcHRpb25zLCB0aGlzKTtcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyT2YgRmlsZXNDb2xsZWN0aW9uQ29yZVxuICAgKiBAbmFtZSB1cGRhdGVcbiAgICogQHNlZSBodHRwOi8vZG9jcy5tZXRlb3IuY29tLyMvZnVsbC91cGRhdGVcbiAgICogQHN1bW1hcnkgbGluayBNb25nby5Db2xsZWN0aW9uIHVwZGF0ZSBtZXRob2RcbiAgICogQHJldHVybnMge01vbmdvLkNvbGxlY3Rpb259IEluc3RhbmNlXG4gICAqL1xuICB1cGRhdGUoKSB7XG4gICAgdGhpcy5jb2xsZWN0aW9uLnVwZGF0ZS5hcHBseSh0aGlzLmNvbGxlY3Rpb24sIGFyZ3VtZW50cyk7XG4gICAgcmV0dXJuIHRoaXMuY29sbGVjdGlvbjtcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyT2YgRmlsZXNDb2xsZWN0aW9uQ29yZVxuICAgKiBAbmFtZSBsaW5rXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBmaWxlUmVmIC0gRmlsZSByZWZlcmVuY2Ugb2JqZWN0XG4gICAqIEBwYXJhbSB7U3RyaW5nfSB2ZXJzaW9uIC0gVmVyc2lvbiBvZiBmaWxlIHlvdSB3b3VsZCBsaWtlIHRvIHJlcXVlc3RcbiAgICogQHBhcmFtIHtTdHJpbmd9IHVyaUJhc2UgLSBbT3B0aW9uYWxdIFVSSSBiYXNlLCBzZWUgLSBodHRwczovL2dpdGh1Yi5jb20vdmVsaW92Z3JvdXAvTWV0ZW9yLUZpbGVzL2lzc3Vlcy82MjZcbiAgICogQHN1bW1hcnkgUmV0dXJucyBkb3dubG9hZGFibGUgVVJMXG4gICAqIEByZXR1cm5zIHtTdHJpbmd9IEVtcHR5IHN0cmluZyByZXR1cm5lZCBpbiBjYXNlIGlmIGZpbGUgbm90IGZvdW5kIGluIERCXG4gICAqL1xuICBsaW5rKGZpbGVSZWYsIHZlcnNpb24gPSAnb3JpZ2luYWwnLCB1cmlCYXNlKSB7XG4gICAgdGhpcy5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFtsaW5rKCR7KGhlbHBlcnMuaXNPYmplY3QoZmlsZVJlZikgPyBmaWxlUmVmLl9pZCA6IHZvaWQgMCl9LCAke3ZlcnNpb259KV1gKTtcbiAgICBjaGVjayhmaWxlUmVmLCBPYmplY3QpO1xuXG4gICAgaWYgKCFmaWxlUmVmKSB7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuICAgIHJldHVybiBmb3JtYXRGbGVVUkwoZmlsZVJlZiwgdmVyc2lvbiwgdXJpQmFzZSk7XG4gIH1cbn1cbiIsImltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuXG4vKlxuICogQHByaXZhdGVcbiAqIEBsb2N1cyBBbnl3aGVyZVxuICogQGNsYXNzIEZpbGVDdXJzb3JcbiAqIEBwYXJhbSBfZmlsZVJlZiAgICB7T2JqZWN0fSAtIE1vbmdvLVN0eWxlIHNlbGVjdG9yIChodHRwOi8vZG9jcy5tZXRlb3IuY29tL2FwaS9jb2xsZWN0aW9ucy5odG1sI3NlbGVjdG9ycylcbiAqIEBwYXJhbSBfY29sbGVjdGlvbiB7RmlsZXNDb2xsZWN0aW9ufSAtIEZpbGVzQ29sbGVjdGlvbiBJbnN0YW5jZVxuICogQHN1bW1hcnkgSW50ZXJuYWwgY2xhc3MsIHJlcHJlc2VudHMgZWFjaCByZWNvcmQgaW4gYEZpbGVzQ3Vyc29yLmVhY2goKWAgb3IgZG9jdW1lbnQgcmV0dXJuZWQgZnJvbSBgLmZpbmRPbmUoKWAgbWV0aG9kXG4gKi9cbmV4cG9ydCBjbGFzcyBGaWxlQ3Vyc29yIHtcbiAgY29uc3RydWN0b3IoX2ZpbGVSZWYsIF9jb2xsZWN0aW9uKSB7XG4gICAgdGhpcy5fZmlsZVJlZiA9IF9maWxlUmVmO1xuICAgIHRoaXMuX2NvbGxlY3Rpb24gPSBfY29sbGVjdGlvbjtcbiAgICBPYmplY3QuYXNzaWduKHRoaXMsIF9maWxlUmVmKTtcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyT2YgRmlsZUN1cnNvclxuICAgKiBAbmFtZSByZW1vdmVcbiAgICogQHBhcmFtIGNhbGxiYWNrIHtGdW5jdGlvbn0gLSBUcmlnZ2VyZWQgYXN5bmNocm9ub3VzbHkgYWZ0ZXIgaXRlbSBpcyByZW1vdmVkIG9yIGZhaWxlZCB0byBiZSByZW1vdmVkXG4gICAqIEBzdW1tYXJ5IFJlbW92ZSBkb2N1bWVudFxuICAgKiBAcmV0dXJucyB7RmlsZUN1cnNvcn1cbiAgICovXG4gIHJlbW92ZShjYWxsYmFjaykge1xuICAgIHRoaXMuX2NvbGxlY3Rpb24uX2RlYnVnKCdbRmlsZXNDb2xsZWN0aW9uXSBbRmlsZUN1cnNvcl0gW3JlbW92ZSgpXScpO1xuICAgIGlmICh0aGlzLl9maWxlUmVmKSB7XG4gICAgICB0aGlzLl9jb2xsZWN0aW9uLnJlbW92ZSh0aGlzLl9maWxlUmVmLl9pZCwgY2FsbGJhY2spO1xuICAgIH0gZWxzZSB7XG4gICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayhuZXcgTWV0ZW9yLkVycm9yKDQwNCwgJ05vIHN1Y2ggZmlsZScpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIEZpbGVDdXJzb3JcbiAgICogQG5hbWUgbGlua1xuICAgKiBAcGFyYW0gdmVyc2lvbiB7U3RyaW5nfSAtIE5hbWUgb2YgZmlsZSdzIHN1YnZlcnNpb25cbiAgICogQHBhcmFtIHVyaUJhc2Uge1N0cmluZ30gLSBbT3B0aW9uYWxdIFVSSSBiYXNlLCBzZWUgLSBodHRwczovL2dpdGh1Yi5jb20vdmVsaW92Z3JvdXAvTWV0ZW9yLUZpbGVzL2lzc3Vlcy82MjZcbiAgICogQHN1bW1hcnkgUmV0dXJucyBkb3dubG9hZGFibGUgVVJMIHRvIEZpbGVcbiAgICogQHJldHVybnMge1N0cmluZ31cbiAgICovXG4gIGxpbmsodmVyc2lvbiA9ICdvcmlnaW5hbCcsIHVyaUJhc2UpIHtcbiAgICB0aGlzLl9jb2xsZWN0aW9uLl9kZWJ1ZyhgW0ZpbGVzQ29sbGVjdGlvbl0gW0ZpbGVDdXJzb3JdIFtsaW5rKCR7dmVyc2lvbn0pXWApO1xuICAgIGlmICh0aGlzLl9maWxlUmVmKSB7XG4gICAgICByZXR1cm4gdGhpcy5fY29sbGVjdGlvbi5saW5rKHRoaXMuX2ZpbGVSZWYsIHZlcnNpb24sIHVyaUJhc2UpO1xuICAgIH1cbiAgICByZXR1cm4gJyc7XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIEZpbGVDdXJzb3JcbiAgICogQG5hbWUgZ2V0XG4gICAqIEBwYXJhbSBwcm9wZXJ0eSB7U3RyaW5nfSAtIE5hbWUgb2Ygc3ViLW9iamVjdCBwcm9wZXJ0eVxuICAgKiBAc3VtbWFyeSBSZXR1cm5zIGN1cnJlbnQgZG9jdW1lbnQgYXMgYSBwbGFpbiBPYmplY3QsIGlmIGBwcm9wZXJ0eWAgaXMgc3BlY2lmaWVkIC0gcmV0dXJucyB2YWx1ZSBvZiBzdWItb2JqZWN0IHByb3BlcnR5XG4gICAqIEByZXR1cm5zIHtPYmplY3R8bWl4fVxuICAgKi9cbiAgZ2V0KHByb3BlcnR5KSB7XG4gICAgdGhpcy5fY29sbGVjdGlvbi5fZGVidWcoYFtGaWxlc0NvbGxlY3Rpb25dIFtGaWxlQ3Vyc29yXSBbZ2V0KCR7cHJvcGVydHl9KV1gKTtcbiAgICBpZiAocHJvcGVydHkpIHtcbiAgICAgIHJldHVybiB0aGlzLl9maWxlUmVmW3Byb3BlcnR5XTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2ZpbGVSZWY7XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIEZpbGVDdXJzb3JcbiAgICogQG5hbWUgZmV0Y2hcbiAgICogQHN1bW1hcnkgUmV0dXJucyBkb2N1bWVudCBhcyBwbGFpbiBPYmplY3QgaW4gQXJyYXlcbiAgICogQHJldHVybnMge1tPYmplY3RdfVxuICAgKi9cbiAgZmV0Y2goKSB7XG4gICAgdGhpcy5fY29sbGVjdGlvbi5fZGVidWcoJ1tGaWxlc0NvbGxlY3Rpb25dIFtGaWxlQ3Vyc29yXSBbZmV0Y2goKV0nKTtcbiAgICByZXR1cm4gW3RoaXMuX2ZpbGVSZWZdO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlQ3Vyc29yXG4gICAqIEBuYW1lIHdpdGhcbiAgICogQHN1bW1hcnkgUmV0dXJucyByZWFjdGl2ZSB2ZXJzaW9uIG9mIGN1cnJlbnQgRmlsZUN1cnNvciwgdXNlZnVsIHRvIHVzZSB3aXRoIGB7eyN3aXRofX0uLi57ey93aXRofX1gIGJsb2NrIHRlbXBsYXRlIGhlbHBlclxuICAgKiBAcmV0dXJucyB7W09iamVjdF19XG4gICAqL1xuICB3aXRoKCkge1xuICAgIHRoaXMuX2NvbGxlY3Rpb24uX2RlYnVnKCdbRmlsZXNDb2xsZWN0aW9uXSBbRmlsZUN1cnNvcl0gW3dpdGgoKV0nKTtcbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih0aGlzLCB0aGlzLl9jb2xsZWN0aW9uLmNvbGxlY3Rpb24uZmluZE9uZSh0aGlzLl9maWxlUmVmLl9pZCkpO1xuICB9XG59XG5cbi8qXG4gKiBAcHJpdmF0ZVxuICogQGxvY3VzIEFueXdoZXJlXG4gKiBAY2xhc3MgRmlsZXNDdXJzb3JcbiAqIEBwYXJhbSBfc2VsZWN0b3IgICB7U3RyaW5nfE9iamVjdH0gICAtIE1vbmdvLVN0eWxlIHNlbGVjdG9yIChodHRwOi8vZG9jcy5tZXRlb3IuY29tL2FwaS9jb2xsZWN0aW9ucy5odG1sI3NlbGVjdG9ycylcbiAqIEBwYXJhbSBvcHRpb25zICAgICB7T2JqZWN0fSAgICAgICAgICAtIE1vbmdvLVN0eWxlIHNlbGVjdG9yIE9wdGlvbnMgKGh0dHA6Ly9kb2NzLm1ldGVvci5jb20vYXBpL2NvbGxlY3Rpb25zLmh0bWwjc2VsZWN0b3JzKVxuICogQHBhcmFtIF9jb2xsZWN0aW9uIHtGaWxlc0NvbGxlY3Rpb259IC0gRmlsZXNDb2xsZWN0aW9uIEluc3RhbmNlXG4gKiBAc3VtbWFyeSBJbXBsZW1lbnRhdGlvbiBvZiBDdXJzb3IgZm9yIEZpbGVzQ29sbGVjdGlvblxuICovXG5leHBvcnQgY2xhc3MgRmlsZXNDdXJzb3Ige1xuICBjb25zdHJ1Y3Rvcihfc2VsZWN0b3IgPSB7fSwgb3B0aW9ucywgX2NvbGxlY3Rpb24pIHtcbiAgICB0aGlzLl9jb2xsZWN0aW9uID0gX2NvbGxlY3Rpb247XG4gICAgdGhpcy5fc2VsZWN0b3IgPSBfc2VsZWN0b3I7XG4gICAgdGhpcy5fY3VycmVudCA9IC0xO1xuICAgIHRoaXMuY3Vyc29yID0gdGhpcy5fY29sbGVjdGlvbi5jb2xsZWN0aW9uLmZpbmQodGhpcy5fc2VsZWN0b3IsIG9wdGlvbnMpO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlc0N1cnNvclxuICAgKiBAbmFtZSBnZXRcbiAgICogQHN1bW1hcnkgUmV0dXJucyBhbGwgbWF0Y2hpbmcgZG9jdW1lbnQocykgYXMgYW4gQXJyYXkuIEFsaWFzIG9mIGAuZmV0Y2goKWBcbiAgICogQHJldHVybnMge1tPYmplY3RdfVxuICAgKi9cbiAgZ2V0KCkge1xuICAgIHRoaXMuX2NvbGxlY3Rpb24uX2RlYnVnKCdbRmlsZXNDb2xsZWN0aW9uXSBbRmlsZXNDdXJzb3JdIFtnZXQoKV0nKTtcbiAgICByZXR1cm4gdGhpcy5jdXJzb3IuZmV0Y2goKTtcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyT2YgRmlsZXNDdXJzb3JcbiAgICogQG5hbWUgaGFzTmV4dFxuICAgKiBAc3VtbWFyeSBSZXR1cm5zIGB0cnVlYCBpZiB0aGVyZSBpcyBuZXh0IGl0ZW0gYXZhaWxhYmxlIG9uIEN1cnNvclxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAgICovXG4gIGhhc05leHQoKSB7XG4gICAgdGhpcy5fY29sbGVjdGlvbi5fZGVidWcoJ1tGaWxlc0NvbGxlY3Rpb25dIFtGaWxlc0N1cnNvcl0gW2hhc05leHQoKV0nKTtcbiAgICByZXR1cm4gdGhpcy5fY3VycmVudCA8ICh0aGlzLmN1cnNvci5jb3VudCgpIC0gMSk7XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIEZpbGVzQ3Vyc29yXG4gICAqIEBuYW1lIG5leHRcbiAgICogQHN1bW1hcnkgUmV0dXJucyBuZXh0IGl0ZW0gb24gQ3Vyc29yLCBpZiBhdmFpbGFibGVcbiAgICogQHJldHVybnMge09iamVjdHx1bmRlZmluZWR9XG4gICAqL1xuICBuZXh0KCkge1xuICAgIHRoaXMuX2NvbGxlY3Rpb24uX2RlYnVnKCdbRmlsZXNDb2xsZWN0aW9uXSBbRmlsZXNDdXJzb3JdIFtuZXh0KCldJyk7XG4gICAgdGhpcy5jdXJzb3IuZmV0Y2goKVsrK3RoaXMuX2N1cnJlbnRdO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlc0N1cnNvclxuICAgKiBAbmFtZSBoYXNQcmV2aW91c1xuICAgKiBAc3VtbWFyeSBSZXR1cm5zIGB0cnVlYCBpZiB0aGVyZSBpcyBwcmV2aW91cyBpdGVtIGF2YWlsYWJsZSBvbiBDdXJzb3JcbiAgICogQHJldHVybnMge0Jvb2xlYW59XG4gICAqL1xuICBoYXNQcmV2aW91cygpIHtcbiAgICB0aGlzLl9jb2xsZWN0aW9uLl9kZWJ1ZygnW0ZpbGVzQ29sbGVjdGlvbl0gW0ZpbGVzQ3Vyc29yXSBbaGFzUHJldmlvdXMoKV0nKTtcbiAgICByZXR1cm4gdGhpcy5fY3VycmVudCAhPT0gLTE7XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIEZpbGVzQ3Vyc29yXG4gICAqIEBuYW1lIHByZXZpb3VzXG4gICAqIEBzdW1tYXJ5IFJldHVybnMgcHJldmlvdXMgaXRlbSBvbiBDdXJzb3IsIGlmIGF2YWlsYWJsZVxuICAgKiBAcmV0dXJucyB7T2JqZWN0fHVuZGVmaW5lZH1cbiAgICovXG4gIHByZXZpb3VzKCkge1xuICAgIHRoaXMuX2NvbGxlY3Rpb24uX2RlYnVnKCdbRmlsZXNDb2xsZWN0aW9uXSBbRmlsZXNDdXJzb3JdIFtwcmV2aW91cygpXScpO1xuICAgIHRoaXMuY3Vyc29yLmZldGNoKClbLS10aGlzLl9jdXJyZW50XTtcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyT2YgRmlsZXNDdXJzb3JcbiAgICogQG5hbWUgZmV0Y2hcbiAgICogQHN1bW1hcnkgUmV0dXJucyBhbGwgbWF0Y2hpbmcgZG9jdW1lbnQocykgYXMgYW4gQXJyYXkuXG4gICAqIEByZXR1cm5zIHtbT2JqZWN0XX1cbiAgICovXG4gIGZldGNoKCkge1xuICAgIHRoaXMuX2NvbGxlY3Rpb24uX2RlYnVnKCdbRmlsZXNDb2xsZWN0aW9uXSBbRmlsZXNDdXJzb3JdIFtmZXRjaCgpXScpO1xuICAgIHJldHVybiB0aGlzLmN1cnNvci5mZXRjaCgpIHx8IFtdO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlc0N1cnNvclxuICAgKiBAbmFtZSBmaXJzdFxuICAgKiBAc3VtbWFyeSBSZXR1cm5zIGZpcnN0IGl0ZW0gb24gQ3Vyc29yLCBpZiBhdmFpbGFibGVcbiAgICogQHJldHVybnMge09iamVjdHx1bmRlZmluZWR9XG4gICAqL1xuICBmaXJzdCgpIHtcbiAgICB0aGlzLl9jb2xsZWN0aW9uLl9kZWJ1ZygnW0ZpbGVzQ29sbGVjdGlvbl0gW0ZpbGVzQ3Vyc29yXSBbZmlyc3QoKV0nKTtcbiAgICB0aGlzLl9jdXJyZW50ID0gMDtcbiAgICByZXR1cm4gdGhpcy5mZXRjaCgpW3RoaXMuX2N1cnJlbnRdO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlc0N1cnNvclxuICAgKiBAbmFtZSBsYXN0XG4gICAqIEBzdW1tYXJ5IFJldHVybnMgbGFzdCBpdGVtIG9uIEN1cnNvciwgaWYgYXZhaWxhYmxlXG4gICAqIEByZXR1cm5zIHtPYmplY3R8dW5kZWZpbmVkfVxuICAgKi9cbiAgbGFzdCgpIHtcbiAgICB0aGlzLl9jb2xsZWN0aW9uLl9kZWJ1ZygnW0ZpbGVzQ29sbGVjdGlvbl0gW0ZpbGVzQ3Vyc29yXSBbbGFzdCgpXScpO1xuICAgIHRoaXMuX2N1cnJlbnQgPSB0aGlzLmNvdW50KCkgLSAxO1xuICAgIHJldHVybiB0aGlzLmZldGNoKClbdGhpcy5fY3VycmVudF07XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIEZpbGVzQ3Vyc29yXG4gICAqIEBuYW1lIGNvdW50XG4gICAqIEBzdW1tYXJ5IFJldHVybnMgdGhlIG51bWJlciBvZiBkb2N1bWVudHMgdGhhdCBtYXRjaCBhIHF1ZXJ5XG4gICAqIEByZXR1cm5zIHtOdW1iZXJ9XG4gICAqL1xuICBjb3VudCgpIHtcbiAgICB0aGlzLl9jb2xsZWN0aW9uLl9kZWJ1ZygnW0ZpbGVzQ29sbGVjdGlvbl0gW0ZpbGVzQ3Vyc29yXSBbY291bnQoKV0nKTtcbiAgICByZXR1cm4gdGhpcy5jdXJzb3IuY291bnQoKTtcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyT2YgRmlsZXNDdXJzb3JcbiAgICogQG5hbWUgcmVtb3ZlXG4gICAqIEBwYXJhbSBjYWxsYmFjayB7RnVuY3Rpb259IC0gVHJpZ2dlcmVkIGFzeW5jaHJvbm91c2x5IGFmdGVyIGl0ZW0gaXMgcmVtb3ZlZCBvciBmYWlsZWQgdG8gYmUgcmVtb3ZlZFxuICAgKiBAc3VtbWFyeSBSZW1vdmVzIGFsbCBkb2N1bWVudHMgdGhhdCBtYXRjaCBhIHF1ZXJ5XG4gICAqIEByZXR1cm5zIHtGaWxlc0N1cnNvcn1cbiAgICovXG4gIHJlbW92ZShjYWxsYmFjaykge1xuICAgIHRoaXMuX2NvbGxlY3Rpb24uX2RlYnVnKCdbRmlsZXNDb2xsZWN0aW9uXSBbRmlsZXNDdXJzb3JdIFtyZW1vdmUoKV0nKTtcbiAgICB0aGlzLl9jb2xsZWN0aW9uLnJlbW92ZSh0aGlzLl9zZWxlY3RvciwgY2FsbGJhY2spO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlc0N1cnNvclxuICAgKiBAbmFtZSBmb3JFYWNoXG4gICAqIEBwYXJhbSBjYWxsYmFjayB7RnVuY3Rpb259IC0gRnVuY3Rpb24gdG8gY2FsbC4gSXQgd2lsbCBiZSBjYWxsZWQgd2l0aCB0aHJlZSBhcmd1bWVudHM6IHRoZSBgZmlsZWAsIGEgMC1iYXNlZCBpbmRleCwgYW5kIGN1cnNvciBpdHNlbGZcbiAgICogQHBhcmFtIGNvbnRleHQge09iamVjdH0gLSBBbiBvYmplY3Qgd2hpY2ggd2lsbCBiZSB0aGUgdmFsdWUgb2YgYHRoaXNgIGluc2lkZSBgY2FsbGJhY2tgXG4gICAqIEBzdW1tYXJ5IENhbGwgYGNhbGxiYWNrYCBvbmNlIGZvciBlYWNoIG1hdGNoaW5nIGRvY3VtZW50LCBzZXF1ZW50aWFsbHkgYW5kIHN5bmNocm9ub3VzbHkuXG4gICAqIEByZXR1cm5zIHt1bmRlZmluZWR9XG4gICAqL1xuICBmb3JFYWNoKGNhbGxiYWNrLCBjb250ZXh0ID0ge30pIHtcbiAgICB0aGlzLl9jb2xsZWN0aW9uLl9kZWJ1ZygnW0ZpbGVzQ29sbGVjdGlvbl0gW0ZpbGVzQ3Vyc29yXSBbZm9yRWFjaCgpXScpO1xuICAgIHRoaXMuY3Vyc29yLmZvckVhY2goY2FsbGJhY2ssIGNvbnRleHQpO1xuICB9XG5cbiAgLypcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBGaWxlc0N1cnNvclxuICAgKiBAbmFtZSBlYWNoXG4gICAqIEBzdW1tYXJ5IFJldHVybnMgYW4gQXJyYXkgb2YgRmlsZUN1cnNvciBtYWRlIGZvciBlYWNoIGRvY3VtZW50IG9uIGN1cnJlbnQgY3Vyc29yXG4gICAqICAgICAgICAgIFVzZWZ1bCB3aGVuIHVzaW5nIGluIHt7I2VhY2ggRmlsZXNDdXJzb3IjZWFjaH19Li4ue3svZWFjaH19IGJsb2NrIHRlbXBsYXRlIGhlbHBlclxuICAgKiBAcmV0dXJucyB7W0ZpbGVDdXJzb3JdfVxuICAgKi9cbiAgZWFjaCgpIHtcbiAgICByZXR1cm4gdGhpcy5tYXAoKGZpbGUpID0+IHtcbiAgICAgIHJldHVybiBuZXcgRmlsZUN1cnNvcihmaWxlLCB0aGlzLl9jb2xsZWN0aW9uKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyT2YgRmlsZXNDdXJzb3JcbiAgICogQG5hbWUgbWFwXG4gICAqIEBwYXJhbSBjYWxsYmFjayB7RnVuY3Rpb259IC0gRnVuY3Rpb24gdG8gY2FsbC4gSXQgd2lsbCBiZSBjYWxsZWQgd2l0aCB0aHJlZSBhcmd1bWVudHM6IHRoZSBgZmlsZWAsIGEgMC1iYXNlZCBpbmRleCwgYW5kIGN1cnNvciBpdHNlbGZcbiAgICogQHBhcmFtIGNvbnRleHQge09iamVjdH0gLSBBbiBvYmplY3Qgd2hpY2ggd2lsbCBiZSB0aGUgdmFsdWUgb2YgYHRoaXNgIGluc2lkZSBgY2FsbGJhY2tgXG4gICAqIEBzdW1tYXJ5IE1hcCBgY2FsbGJhY2tgIG92ZXIgYWxsIG1hdGNoaW5nIGRvY3VtZW50cy4gUmV0dXJucyBhbiBBcnJheS5cbiAgICogQHJldHVybnMge0FycmF5fVxuICAgKi9cbiAgbWFwKGNhbGxiYWNrLCBjb250ZXh0ID0ge30pIHtcbiAgICB0aGlzLl9jb2xsZWN0aW9uLl9kZWJ1ZygnW0ZpbGVzQ29sbGVjdGlvbl0gW0ZpbGVzQ3Vyc29yXSBbbWFwKCldJyk7XG4gICAgcmV0dXJuIHRoaXMuY3Vyc29yLm1hcChjYWxsYmFjaywgY29udGV4dCk7XG4gIH1cblxuICAvKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIEZpbGVzQ3Vyc29yXG4gICAqIEBuYW1lIGN1cnJlbnRcbiAgICogQHN1bW1hcnkgUmV0dXJucyBjdXJyZW50IGl0ZW0gb24gQ3Vyc29yLCBpZiBhdmFpbGFibGVcbiAgICogQHJldHVybnMge09iamVjdHx1bmRlZmluZWR9XG4gICAqL1xuICBjdXJyZW50KCkge1xuICAgIHRoaXMuX2NvbGxlY3Rpb24uX2RlYnVnKCdbRmlsZXNDb2xsZWN0aW9uXSBbRmlsZXNDdXJzb3JdIFtjdXJyZW50KCldJyk7XG4gICAgaWYgKHRoaXMuX2N1cnJlbnQgPCAwKSB7XG4gICAgICB0aGlzLl9jdXJyZW50ID0gMDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZmV0Y2goKVt0aGlzLl9jdXJyZW50XTtcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyT2YgRmlsZXNDdXJzb3JcbiAgICogQG5hbWUgb2JzZXJ2ZVxuICAgKiBAcGFyYW0gY2FsbGJhY2tzIHtPYmplY3R9IC0gRnVuY3Rpb25zIHRvIGNhbGwgdG8gZGVsaXZlciB0aGUgcmVzdWx0IHNldCBhcyBpdCBjaGFuZ2VzXG4gICAqIEBzdW1tYXJ5IFdhdGNoIGEgcXVlcnkuIFJlY2VpdmUgY2FsbGJhY2tzIGFzIHRoZSByZXN1bHQgc2V0IGNoYW5nZXMuXG4gICAqIEB1cmwgaHR0cDovL2RvY3MubWV0ZW9yLmNvbS9hcGkvY29sbGVjdGlvbnMuaHRtbCNNb25nby1DdXJzb3Itb2JzZXJ2ZVxuICAgKiBAcmV0dXJucyB7T2JqZWN0fSAtIGxpdmUgcXVlcnkgaGFuZGxlXG4gICAqL1xuICBvYnNlcnZlKGNhbGxiYWNrcykge1xuICAgIHRoaXMuX2NvbGxlY3Rpb24uX2RlYnVnKCdbRmlsZXNDb2xsZWN0aW9uXSBbRmlsZXNDdXJzb3JdIFtvYnNlcnZlKCldJyk7XG4gICAgcmV0dXJuIHRoaXMuY3Vyc29yLm9ic2VydmUoY2FsbGJhY2tzKTtcbiAgfVxuXG4gIC8qXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyT2YgRmlsZXNDdXJzb3JcbiAgICogQG5hbWUgb2JzZXJ2ZUNoYW5nZXNcbiAgICogQHBhcmFtIGNhbGxiYWNrcyB7T2JqZWN0fSAtIEZ1bmN0aW9ucyB0byBjYWxsIHRvIGRlbGl2ZXIgdGhlIHJlc3VsdCBzZXQgYXMgaXQgY2hhbmdlc1xuICAgKiBAc3VtbWFyeSBXYXRjaCBhIHF1ZXJ5LiBSZWNlaXZlIGNhbGxiYWNrcyBhcyB0aGUgcmVzdWx0IHNldCBjaGFuZ2VzLiBPbmx5IHRoZSBkaWZmZXJlbmNlcyBiZXR3ZWVuIHRoZSBvbGQgYW5kIG5ldyBkb2N1bWVudHMgYXJlIHBhc3NlZCB0byB0aGUgY2FsbGJhY2tzLlxuICAgKiBAdXJsIGh0dHA6Ly9kb2NzLm1ldGVvci5jb20vYXBpL2NvbGxlY3Rpb25zLmh0bWwjTW9uZ28tQ3Vyc29yLW9ic2VydmVDaGFuZ2VzXG4gICAqIEByZXR1cm5zIHtPYmplY3R9IC0gbGl2ZSBxdWVyeSBoYW5kbGVcbiAgICovXG4gIG9ic2VydmVDaGFuZ2VzKGNhbGxiYWNrcykge1xuICAgIHRoaXMuX2NvbGxlY3Rpb24uX2RlYnVnKCdbRmlsZXNDb2xsZWN0aW9uXSBbRmlsZXNDdXJzb3JdIFtvYnNlcnZlQ2hhbmdlcygpXScpO1xuICAgIHJldHVybiB0aGlzLmN1cnNvci5vYnNlcnZlQ2hhbmdlcyhjYWxsYmFja3MpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBjaGVjayB9IGZyb20gJ21ldGVvci9jaGVjayc7XG5cbmNvbnN0IGhlbHBlcnMgPSB7XG4gIHNhbml0aXplKHN0ciA9ICcnLCBtYXggPSAyOCwgcmVwbGFjZW1lbnQgPSAnLScpIHtcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoLyhbXmEtejAtOVxcLVxcX10rKS9naSwgcmVwbGFjZW1lbnQpLnN1YnN0cmluZygwLCBtYXgpO1xuICB9LFxuICBpc1VuZGVmaW5lZChvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSB2b2lkIDA7XG4gIH0sXG4gIGlzT2JqZWN0KG9iaikge1xuICAgIGlmICh0aGlzLmlzQXJyYXkob2JqKSB8fCB0aGlzLmlzRnVuY3Rpb24ob2JqKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gb2JqID09PSBPYmplY3Qob2JqKTtcbiAgfSxcbiAgaXNBcnJheShvYmopIHtcbiAgICByZXR1cm4gQXJyYXkuaXNBcnJheShvYmopO1xuICB9LFxuICBpc0Jvb2xlYW4ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gdHJ1ZSB8fCBvYmogPT09IGZhbHNlIHx8IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBCb29sZWFuXSc7XG4gIH0sXG4gIGlzRnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBvYmogPT09ICdmdW5jdGlvbicgfHwgZmFsc2U7XG4gIH0sXG4gIGlzRGF0ZShkYXRlKSB7XG4gICAgcmV0dXJuICFOdW1iZXIuaXNOYU4obmV3IERhdGUoZGF0ZSkuZ2V0RGF0ZSgpKTtcbiAgfSxcbiAgaXNFbXB0eShvYmopIHtcbiAgICBpZiAodGhpcy5pc0RhdGUob2JqKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAodGhpcy5pc09iamVjdChvYmopKSB7XG4gICAgICByZXR1cm4gIU9iamVjdC5rZXlzKG9iaikubGVuZ3RoO1xuICAgIH1cbiAgICBpZiAodGhpcy5pc0FycmF5KG9iaikgfHwgdGhpcy5pc1N0cmluZyhvYmopKSB7XG4gICAgICByZXR1cm4gIW9iai5sZW5ndGg7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfSxcbiAgY2xvbmUob2JqKSB7XG4gICAgaWYgKCF0aGlzLmlzT2JqZWN0KG9iaikpIHJldHVybiBvYmo7XG4gICAgcmV0dXJuIHRoaXMuaXNBcnJheShvYmopID8gb2JqLnNsaWNlKCkgOiBPYmplY3QuYXNzaWduKHt9LCBvYmopO1xuICB9LFxuICBoYXMoX29iaiwgcGF0aCkge1xuICAgIGxldCBvYmogPSBfb2JqO1xuICAgIGlmICghdGhpcy5pc09iamVjdChvYmopKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICghdGhpcy5pc0FycmF5KHBhdGgpKSB7XG4gICAgICByZXR1cm4gdGhpcy5pc09iamVjdChvYmopICYmIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHBhdGgpO1xuICAgIH1cblxuICAgIGNvbnN0IGxlbmd0aCA9IHBhdGgubGVuZ3RoO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcGF0aFtpXSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgb2JqID0gb2JqW3BhdGhbaV1dO1xuICAgIH1cbiAgICByZXR1cm4gISFsZW5ndGg7XG4gIH0sXG4gIG9taXQob2JqLCAuLi5rZXlzKSB7XG4gICAgY29uc3QgY2xlYXIgPSBPYmplY3QuYXNzaWduKHt9LCBvYmopO1xuICAgIGZvciAobGV0IGkgPSBrZXlzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBkZWxldGUgY2xlYXJba2V5c1tpXV07XG4gICAgfVxuXG4gICAgcmV0dXJuIGNsZWFyO1xuICB9LFxuICBub3c6IERhdGUubm93LFxuICB0aHJvdHRsZShmdW5jLCB3YWl0LCBvcHRpb25zID0ge30pIHtcbiAgICBsZXQgcHJldmlvdXMgPSAwO1xuICAgIGxldCB0aW1lb3V0ID0gbnVsbDtcbiAgICBsZXQgcmVzdWx0O1xuICAgIGNvbnN0IHRoYXQgPSB0aGlzO1xuICAgIGxldCBzZWxmO1xuICAgIGxldCBhcmdzO1xuXG4gICAgY29uc3QgbGF0ZXIgPSAoKSA9PiB7XG4gICAgICBwcmV2aW91cyA9IG9wdGlvbnMubGVhZGluZyA9PT0gZmFsc2UgPyAwIDogdGhhdC5ub3coKTtcbiAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShzZWxmLCBhcmdzKTtcbiAgICAgIGlmICghdGltZW91dCkge1xuICAgICAgICBzZWxmID0gYXJncyA9IG51bGw7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGNvbnN0IHRocm90dGxlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnN0IG5vdyA9IHRoYXQubm93KCk7XG4gICAgICBpZiAoIXByZXZpb3VzICYmIG9wdGlvbnMubGVhZGluZyA9PT0gZmFsc2UpIHByZXZpb3VzID0gbm93O1xuICAgICAgY29uc3QgcmVtYWluaW5nID0gd2FpdCAtIChub3cgLSBwcmV2aW91cyk7XG4gICAgICBzZWxmID0gdGhpcztcbiAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICBpZiAocmVtYWluaW5nIDw9IDAgfHwgcmVtYWluaW5nID4gd2FpdCkge1xuICAgICAgICBpZiAodGltZW91dCkge1xuICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBwcmV2aW91cyA9IG5vdztcbiAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShzZWxmLCBhcmdzKTtcbiAgICAgICAgaWYgKCF0aW1lb3V0KSB7XG4gICAgICAgICAgc2VsZiA9IGFyZ3MgPSBudWxsO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKCF0aW1lb3V0ICYmIG9wdGlvbnMudHJhaWxpbmcgIT09IGZhbHNlKSB7XG4gICAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCByZW1haW5pbmcpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuXG4gICAgdGhyb3R0bGVkLmNhbmNlbCA9ICgpID0+IHtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgIHByZXZpb3VzID0gMDtcbiAgICAgIHRpbWVvdXQgPSBzZWxmID0gYXJncyA9IG51bGw7XG4gICAgfTtcblxuICAgIHJldHVybiB0aHJvdHRsZWQ7XG4gIH1cbn07XG5cbmNvbnN0IF9oZWxwZXJzID0gWydTdHJpbmcnLCAnTnVtYmVyJywgJ0RhdGUnXTtcbmZvciAobGV0IGkgPSAwOyBpIDwgX2hlbHBlcnMubGVuZ3RoOyBpKyspIHtcbiAgaGVscGVyc1snaXMnICsgX2hlbHBlcnNbaV1dID0gZnVuY3Rpb24gKG9iaikge1xuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gYFtvYmplY3QgJHtfaGVscGVyc1tpXX1dYDtcbiAgfTtcbn1cblxuLypcbiAqIEBjb25zdCB7RnVuY3Rpb259IGZpeEpTT05QYXJzZSAtIEZpeCBpc3N1ZSB3aXRoIERhdGUgcGFyc2VcbiAqL1xuY29uc3QgZml4SlNPTlBhcnNlID0gZnVuY3Rpb24ob2JqKSB7XG4gIGZvciAobGV0IGtleSBpbiBvYmopIHtcbiAgICBpZiAoaGVscGVycy5pc1N0cmluZyhvYmpba2V5XSkgJiYgb2JqW2tleV0uaW5jbHVkZXMoJz0tLUpTT04tREFURS0tPScpKSB7XG4gICAgICBvYmpba2V5XSA9IG9ialtrZXldLnJlcGxhY2UoJz0tLUpTT04tREFURS0tPScsICcnKTtcbiAgICAgIG9ialtrZXldID0gbmV3IERhdGUocGFyc2VJbnQob2JqW2tleV0pKTtcbiAgICB9IGVsc2UgaWYgKGhlbHBlcnMuaXNPYmplY3Qob2JqW2tleV0pKSB7XG4gICAgICBvYmpba2V5XSA9IGZpeEpTT05QYXJzZShvYmpba2V5XSk7XG4gICAgfSBlbHNlIGlmIChoZWxwZXJzLmlzQXJyYXkob2JqW2tleV0pKSB7XG4gICAgICBsZXQgdjtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb2JqW2tleV0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdiA9IG9ialtrZXldW2ldO1xuICAgICAgICBpZiAoaGVscGVycy5pc09iamVjdCh2KSkge1xuICAgICAgICAgIG9ialtrZXldW2ldID0gZml4SlNPTlBhcnNlKHYpO1xuICAgICAgICB9IGVsc2UgaWYgKGhlbHBlcnMuaXNTdHJpbmcodikgJiYgdi5pbmNsdWRlcygnPS0tSlNPTi1EQVRFLS09JykpIHtcbiAgICAgICAgICB2ID0gdi5yZXBsYWNlKCc9LS1KU09OLURBVEUtLT0nLCAnJyk7XG4gICAgICAgICAgb2JqW2tleV1baV0gPSBuZXcgRGF0ZShwYXJzZUludCh2KSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG9iajtcbn07XG5cbi8qXG4gKiBAY29uc3Qge0Z1bmN0aW9ufSBmaXhKU09OU3RyaW5naWZ5IC0gRml4IGlzc3VlIHdpdGggRGF0ZSBzdHJpbmdpZnlcbiAqL1xuY29uc3QgZml4SlNPTlN0cmluZ2lmeSA9IGZ1bmN0aW9uKG9iaikge1xuICBmb3IgKGxldCBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKGhlbHBlcnMuaXNEYXRlKG9ialtrZXldKSkge1xuICAgICAgb2JqW2tleV0gPSBgPS0tSlNPTi1EQVRFLS09JHsrb2JqW2tleV19YDtcbiAgICB9IGVsc2UgaWYgKGhlbHBlcnMuaXNPYmplY3Qob2JqW2tleV0pKSB7XG4gICAgICBvYmpba2V5XSA9IGZpeEpTT05TdHJpbmdpZnkob2JqW2tleV0pO1xuICAgIH0gZWxzZSBpZiAoaGVscGVycy5pc0FycmF5KG9ialtrZXldKSkge1xuICAgICAgbGV0IHY7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9ialtrZXldLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHYgPSBvYmpba2V5XVtpXTtcbiAgICAgICAgaWYgKGhlbHBlcnMuaXNPYmplY3QodikpIHtcbiAgICAgICAgICBvYmpba2V5XVtpXSA9IGZpeEpTT05TdHJpbmdpZnkodik7XG4gICAgICAgIH0gZWxzZSBpZiAoaGVscGVycy5pc0RhdGUodikpIHtcbiAgICAgICAgICBvYmpba2V5XVtpXSA9IGA9LS1KU09OLURBVEUtLT0keyt2fWA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG9iajtcbn07XG5cbi8qXG4gKiBAbG9jdXMgQW55d2hlcmVcbiAqIEBwcml2YXRlXG4gKiBAbmFtZSBmb3JtYXRGbGVVUkxcbiAqIEBwYXJhbSB7T2JqZWN0fSBmaWxlUmVmIC0gRmlsZSByZWZlcmVuY2Ugb2JqZWN0XG4gKiBAcGFyYW0ge1N0cmluZ30gdmVyc2lvbiAtIFtPcHRpb25hbF0gVmVyc2lvbiBvZiBmaWxlIHlvdSB3b3VsZCBsaWtlIGJ1aWxkIFVSTCBmb3JcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmlCYXNlIC0gW09wdGlvbmFsXSBVUkkgYmFzZSwgc2VlIC0gaHR0cHM6Ly9naXRodWIuY29tL3ZlbGlvdmdyb3VwL01ldGVvci1GaWxlcy9pc3N1ZXMvNjI2XG4gKiBAc3VtbWFyeSBSZXR1cm5zIGZvcm1hdHRlZCBVUkwgZm9yIGZpbGVcbiAqIEByZXR1cm5zIHtTdHJpbmd9IERvd25sb2FkYWJsZSBsaW5rXG4gKi9cbmNvbnN0IGZvcm1hdEZsZVVSTCA9IChmaWxlUmVmLCB2ZXJzaW9uID0gJ29yaWdpbmFsJywgX3VyaUJhc2UgPSAoX19tZXRlb3JfcnVudGltZV9jb25maWdfXyB8fCB7fSkuUk9PVF9VUkwpID0+IHtcbiAgY2hlY2soZmlsZVJlZiwgT2JqZWN0KTtcbiAgY2hlY2sodmVyc2lvbiwgU3RyaW5nKTtcbiAgbGV0IHVyaUJhc2UgPSBfdXJpQmFzZTtcblxuICBpZiAoIWhlbHBlcnMuaXNTdHJpbmcodXJpQmFzZSkpIHtcbiAgICB1cmlCYXNlID0gKF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18gfHwge30pLlJPT1RfVVJMIHx8ICcvJztcbiAgfVxuXG4gIGNvbnN0IF9yb290ID0gdXJpQmFzZS5yZXBsYWNlKC9cXC8rJC8sICcnKTtcbiAgY29uc3QgdlJlZiA9IChmaWxlUmVmLnZlcnNpb25zICYmIGZpbGVSZWYudmVyc2lvbnNbdmVyc2lvbl0pIHx8IGZpbGVSZWYgfHwge307XG5cbiAgbGV0IGV4dDtcbiAgaWYgKGhlbHBlcnMuaXNTdHJpbmcodlJlZi5leHRlbnNpb24pKSB7XG4gICAgZXh0ID0gYC4ke3ZSZWYuZXh0ZW5zaW9uLnJlcGxhY2UoL15cXC4vLCAnJyl9YDtcbiAgfSBlbHNlIHtcbiAgICBleHQgPSAnJztcbiAgfVxuXG4gIGlmIChmaWxlUmVmLnB1YmxpYyA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBfcm9vdCArICh2ZXJzaW9uID09PSAnb3JpZ2luYWwnID8gYCR7ZmlsZVJlZi5fZG93bmxvYWRSb3V0ZX0vJHtmaWxlUmVmLl9pZH0ke2V4dH1gIDogYCR7ZmlsZVJlZi5fZG93bmxvYWRSb3V0ZX0vJHt2ZXJzaW9ufS0ke2ZpbGVSZWYuX2lkfSR7ZXh0fWApO1xuICB9XG4gIHJldHVybiBgJHtfcm9vdH0ke2ZpbGVSZWYuX2Rvd25sb2FkUm91dGV9LyR7ZmlsZVJlZi5fY29sbGVjdGlvbk5hbWV9LyR7ZmlsZVJlZi5faWR9LyR7dmVyc2lvbn0vJHtmaWxlUmVmLl9pZH0ke2V4dH1gO1xufTtcblxuZXhwb3J0IHsgZml4SlNPTlBhcnNlLCBmaXhKU09OU3RyaW5naWZ5LCBmb3JtYXRGbGVVUkwsIGhlbHBlcnMgfTtcbiIsImltcG9ydCBmcyBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgbm9kZVBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IGhlbHBlcnMgfSBmcm9tICcuL2xpYi5qcyc7XG5jb25zdCBub29wID0gKCkgPT4ge307XG5cbi8qKlxuICogQGNvbnN0IHtPYmplY3R9IGJvdW5kICAgLSBNZXRlb3IuYmluZEVudmlyb25tZW50IChGaWJlciB3cmFwcGVyKVxuICogQGNvbnN0IHtPYmplY3R9IGZkQ2FjaGUgLSBGaWxlIERlc2NyaXB0b3JzIENhY2hlXG4gKi9cbmNvbnN0IGJvdW5kID0gTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChjYWxsYmFjayA9PiBjYWxsYmFjaygpKTtcbmNvbnN0IGZkQ2FjaGUgPSB7fTtcblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogQGxvY3VzIFNlcnZlclxuICogQGNsYXNzIFdyaXRlU3RyZWFtXG4gKiBAcGFyYW0gcGF0aCAgICAgICAge1N0cmluZ30gLSBQYXRoIHRvIGZpbGUgb24gRlNcbiAqIEBwYXJhbSBtYXhMZW5ndGggICB7TnVtYmVyfSAtIE1heCBhbW91bnQgb2YgY2h1bmtzIGluIHN0cmVhbVxuICogQHBhcmFtIGZpbGUgICAgICAgIHtPYmplY3R9IC0gZmlsZVJlZiBPYmplY3RcbiAqIEBwYXJhbSBwZXJtaXNzaW9ucyB7U3RyaW5nfSAtIFBlcm1pc3Npb25zIHdoaWNoIHdpbGwgYmUgc2V0IHRvIG9wZW4gZGVzY3JpcHRvciAob2N0YWwpLCBsaWtlOiBgNjExYCBvciBgMG83NzdgLiBEZWZhdWx0OiAwNzU1XG4gKiBAc3VtbWFyeSB3cml0YWJsZVN0cmVhbSB3cmFwcGVyIGNsYXNzLCBtYWtlcyBzdXJlIGNodW5rcyBpcyB3cml0dGVuIGluIGdpdmVuIG9yZGVyLiBJbXBsZW1lbnRhdGlvbiBvZiBxdWV1ZSBzdHJlYW0uXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFdyaXRlU3RyZWFtIHtcbiAgY29uc3RydWN0b3IocGF0aCwgbWF4TGVuZ3RoLCBmaWxlLCBwZXJtaXNzaW9ucykge1xuICAgIHRoaXMucGF0aCA9IHBhdGgudHJpbSgpO1xuICAgIHRoaXMubWF4TGVuZ3RoID0gbWF4TGVuZ3RoO1xuICAgIHRoaXMuZmlsZSA9IGZpbGU7XG4gICAgdGhpcy5wZXJtaXNzaW9ucyA9IHBlcm1pc3Npb25zO1xuICAgIGlmICghdGhpcy5wYXRoIHx8ICFoZWxwZXJzLmlzU3RyaW5nKHRoaXMucGF0aCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmZkID0gbnVsbDtcbiAgICB0aGlzLmVuZGVkID0gZmFsc2U7XG4gICAgdGhpcy5hYm9ydGVkID0gZmFsc2U7XG4gICAgdGhpcy53cml0dGVuQ2h1bmtzID0gMDtcblxuICAgIGlmIChmZENhY2hlW3RoaXMucGF0aF0gJiYgIWZkQ2FjaGVbdGhpcy5wYXRoXS5lbmRlZCAmJiAhZmRDYWNoZVt0aGlzLnBhdGhdLmFib3J0ZWQpIHtcbiAgICAgIHRoaXMuZmQgPSBmZENhY2hlW3RoaXMucGF0aF0uZmQ7XG4gICAgICB0aGlzLndyaXR0ZW5DaHVua3MgPSBmZENhY2hlW3RoaXMucGF0aF0ud3JpdHRlbkNodW5rcztcbiAgICB9IGVsc2Uge1xuICAgICAgZnMuc3RhdCh0aGlzLnBhdGgsIChzdGF0RXJyb3IsIHN0YXRzKSA9PiB7XG4gICAgICAgIGJvdW5kKCgpID0+IHtcbiAgICAgICAgICBpZiAoc3RhdEVycm9yIHx8ICFzdGF0cy5pc0ZpbGUoKSkge1xuICAgICAgICAgICAgY29uc3QgcGF0aHMgPSB0aGlzLnBhdGguc3BsaXQobm9kZVBhdGguc2VwKTtcbiAgICAgICAgICAgIHBhdGhzLnBvcCgpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgZnMubWtkaXJTeW5jKHBhdGhzLmpvaW4obm9kZVBhdGguc2VwKSwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgICAgICB9IGNhdGNoIChta2RpckVycm9yKSB7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNTAwLCBgW0ZpbGVzQ29sbGVjdGlvbl0gW3dyaXRlU3RyZWFtXSBbY29uc3RydWN0b3JdIFtta2RpclN5bmNdIEVSUk9SOiBjYW4gbm90IG1ha2UvZW5zdXJlIGRpcmVjdG9yeSBcIiR7cGF0aHMuam9pbihub2RlUGF0aC5zZXApfVwiYCwgbWtkaXJFcnJvcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGZzLndyaXRlRmlsZVN5bmModGhpcy5wYXRoLCAnJyk7XG4gICAgICAgICAgICB9IGNhdGNoICh3cml0ZUZpbGVFcnJvcikge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgYFtGaWxlc0NvbGxlY3Rpb25dIFt3cml0ZVN0cmVhbV0gW2NvbnN0cnVjdG9yXSBbd3JpdGVGaWxlU3luY10gRVJST1I6IGNhbiBub3Qgd3JpdGUgZmlsZSBcIiR7dGhpcy5wYXRofVwiYCwgd3JpdGVGaWxlRXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGZzLm9wZW4odGhpcy5wYXRoLCAncisnLCB0aGlzLnBlcm1pc3Npb25zLCAob0Vycm9yLCBmZCkgPT4ge1xuICAgICAgICAgICAgYm91bmQoKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAob0Vycm9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hYm9ydCgpO1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNTAwLCAnW0ZpbGVzQ29sbGVjdGlvbl0gW3dyaXRlU3RyZWFtXSBbY29uc3RydWN0b3JdIFtvcGVuXSBbRXJyb3I6XScsIG9FcnJvcik7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5mZCA9IGZkO1xuICAgICAgICAgICAgICAgIGZkQ2FjaGVbdGhpcy5wYXRoXSA9IHRoaXM7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAbWVtYmVyT2Ygd3JpdGVTdHJlYW1cbiAgICogQG5hbWUgd3JpdGVcbiAgICogQHBhcmFtIHtOdW1iZXJ9IG51bSAtIENodW5rIHBvc2l0aW9uIGluIGEgc3RyZWFtXG4gICAqIEBwYXJhbSB7QnVmZmVyfSBjaHVuayAtIEJ1ZmZlciAoY2h1bmsgYmluYXJ5IGRhdGEpXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0gQ2FsbGJhY2tcbiAgICogQHN1bW1hcnkgV3JpdGUgY2h1bmsgaW4gZ2l2ZW4gb3JkZXJcbiAgICogQHJldHVybnMge0Jvb2xlYW59IC0gVHJ1ZSBpZiBjaHVuayBpcyBzZW50IHRvIHN0cmVhbSwgZmFsc2UgaWYgY2h1bmsgaXMgc2V0IGludG8gcXVldWVcbiAgICovXG4gIHdyaXRlKG51bSwgY2h1bmssIGNhbGxiYWNrKSB7XG4gICAgaWYgKCF0aGlzLmFib3J0ZWQgJiYgIXRoaXMuZW5kZWQpIHtcbiAgICAgIGlmICh0aGlzLmZkKSB7XG4gICAgICAgIGZzLndyaXRlKHRoaXMuZmQsIGNodW5rLCAwLCBjaHVuay5sZW5ndGgsIChudW0gLSAxKSAqIHRoaXMuZmlsZS5jaHVua1NpemUsIChlcnJvciwgd3JpdHRlbiwgYnVmZmVyKSA9PiB7XG4gICAgICAgICAgYm91bmQoKCkgPT4ge1xuICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soZXJyb3IsIHdyaXR0ZW4sIGJ1ZmZlcik7XG4gICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgTWV0ZW9yLl9kZWJ1ZygnW0ZpbGVzQ29sbGVjdGlvbl0gW3dyaXRlU3RyZWFtXSBbd3JpdGVdIFtFcnJvcjpdJywgZXJyb3IpO1xuICAgICAgICAgICAgICB0aGlzLmFib3J0KCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICArK3RoaXMud3JpdHRlbkNodW5rcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBNZXRlb3Iuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgdGhpcy53cml0ZShudW0sIGNodW5rLCBjYWxsYmFjayk7XG4gICAgICAgIH0sIDI1KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEBtZW1iZXJPZiB3cml0ZVN0cmVhbVxuICAgKiBAbmFtZSBlbmRcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBDYWxsYmFja1xuICAgKiBAc3VtbWFyeSBGaW5pc2hlcyB3cml0aW5nIHRvIHdyaXRhYmxlU3RyZWFtLCBvbmx5IGFmdGVyIGFsbCBjaHVua3MgaW4gcXVldWUgaXMgd3JpdHRlblxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gLSBUcnVlIGlmIHN0cmVhbSBpcyBmdWxmaWxsZWQsIGZhbHNlIGlmIHF1ZXVlIGlzIGluIHByb2dyZXNzXG4gICAqL1xuICBlbmQoY2FsbGJhY2spIHtcbiAgICBpZiAoIXRoaXMuYWJvcnRlZCAmJiAhdGhpcy5lbmRlZCkge1xuICAgICAgaWYgKHRoaXMud3JpdHRlbkNodW5rcyA9PT0gdGhpcy5tYXhMZW5ndGgpIHtcbiAgICAgICAgZnMuY2xvc2UodGhpcy5mZCwgKCkgPT4ge1xuICAgICAgICAgIGJvdW5kKCgpID0+IHtcbiAgICAgICAgICAgIGRlbGV0ZSBmZENhY2hlW3RoaXMucGF0aF07XG4gICAgICAgICAgICB0aGlzLmVuZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKHZvaWQgMCwgdHJ1ZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgZnMuc3RhdCh0aGlzLnBhdGgsIChlcnJvciwgc3RhdCkgPT4ge1xuICAgICAgICBib3VuZCgoKSA9PiB7XG4gICAgICAgICAgaWYgKCFlcnJvciAmJiBzdGF0KSB7XG4gICAgICAgICAgICB0aGlzLndyaXR0ZW5DaHVua3MgPSBNYXRoLmNlaWwoc3RhdC5zaXplIC8gdGhpcy5maWxlLmNodW5rU2l6ZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIE1ldGVvci5zZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZW5kKGNhbGxiYWNrKTtcbiAgICAgICAgICB9LCAyNSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKHZvaWQgMCwgdGhpcy5lbmRlZCk7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAbWVtYmVyT2Ygd3JpdGVTdHJlYW1cbiAgICogQG5hbWUgYWJvcnRcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBDYWxsYmFja1xuICAgKiBAc3VtbWFyeSBBYm9ydHMgd3JpdGluZyB0byB3cml0YWJsZVN0cmVhbSwgcmVtb3ZlcyBjcmVhdGVkIGZpbGVcbiAgICogQHJldHVybnMge0Jvb2xlYW59IC0gVHJ1ZVxuICAgKi9cbiAgYWJvcnQoY2FsbGJhY2spIHtcbiAgICB0aGlzLmFib3J0ZWQgPSB0cnVlO1xuICAgIGRlbGV0ZSBmZENhY2hlW3RoaXMucGF0aF07XG4gICAgZnMudW5saW5rKHRoaXMucGF0aCwgKGNhbGxiYWNrIHx8IG5vb3ApKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAbWVtYmVyT2Ygd3JpdGVTdHJlYW1cbiAgICogQG5hbWUgc3RvcFxuICAgKiBAc3VtbWFyeSBTdG9wIHdyaXRpbmcgdG8gd3JpdGFibGVTdHJlYW1cbiAgICogQHJldHVybnMge0Jvb2xlYW59IC0gVHJ1ZVxuICAgKi9cbiAgc3RvcCgpIHtcbiAgICB0aGlzLmFib3J0ZWQgPSB0cnVlO1xuICAgIGRlbGV0ZSBmZENhY2hlW3RoaXMucGF0aF07XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn1cbiJdfQ==
