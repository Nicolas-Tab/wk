(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"ostrio:cstorage":{"client-storage.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ostrio_cstorage/client-storage.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
'use strict';

!function (module1) {
  var CookiesStorage = require('./cookies-storage.js');
  var JSStorage = require('./js-storage.js');
  var BrowserStorage = require('./browser-storage.js');
  var isServer = function () {
    var _process;
    return typeof process === 'object' && !((_process = process) !== null && _process !== void 0 && _process.browser);
  };
  var debug = function () {
    console.warn.apply(console, arguments);
  };

  /**
   * @locus Client
   * @class ClientStorage
   * @param driverName {Sting} - Preferable driver `localStorage` or `cookies`
   * @summary Implement boilerplate Client storage functions, localStorage with fall-back to CookiesStorage
   */
  function ClientStorage(driverName) {
    this.data = {};
    this.ttlData = {};
    var StorageDriver;
    this.driverName = driverName;
    if (isServer()) {
      StorageDriver = JSStorage;
      this.driverName = 'js';
    } else {
      switch (driverName) {
        case 'localStorage':
          if (BrowserStorage.isSupported()) {
            StorageDriver = BrowserStorage;
          } else {
            debug('ClientStorage is set to "localStorage", but it is not supported on this browser');
          }
          break;
        case 'cookies':
          if (CookiesStorage.isSupported()) {
            StorageDriver = CookiesStorage;
          } else {
            debug('ClientStorage is set to "cookies", but CookiesStorage is disabled on this browser');
          }
          break;
        case 'js':
          StorageDriver = JSStorage;
          this.driverName = 'js';
          break;
        default:
          break;
      }
    }
    if (!StorageDriver) {
      if (BrowserStorage.isSupported()) {
        this.driverName = 'localStorage';
        StorageDriver = BrowserStorage;
      } else if (CookiesStorage.isSupported()) {
        this.driverName = 'cookies';
        StorageDriver = CookiesStorage;
      } else {
        this.driverName = 'js';
        StorageDriver = JSStorage;
      }
    }
    if (this.driverName === 'cookies') {
      this.driver = new StorageDriver(this, document.cookie);
    } else {
      this.driver = new StorageDriver(this);
    }
    Object.assign(this, StorageDriver.prototype);
  }

  /**
   * @locus Client
   * @memberOf ClientStorage
   * @name get
   * @param {String} key - The key of the value to read
   * @summary Read a stored value by key. If the key doesn't exist a void 0 (undefined) value will be returned.
   * @returns {String|Mix|void 0}
   */
  ClientStorage.prototype.get = function (key) {
    if (typeof key !== 'string') {
      return void 0;
    }
    if (this.data.hasOwnProperty(key)) {
      if (this.ttlData[key] <= Date.now()) {
        this.remove(key);
        return void 0;
      }
      return this.data[key];
    }
    return void 0;
  };

  /**
   * @locus Client
   * @memberOf ClientStorage
   * @name has
   * @param {String} key - The name of the record to check
   * @summary Check whether a record key is exists
   * @returns {Boolean}
   */
  ClientStorage.prototype.has = function (key) {
    if (typeof key !== 'string') {
      return false;
    }
    if (this.data.hasOwnProperty(key)) {
      if (this.ttlData[key] <= Date.now()) {
        this.remove(key);
        return false;
      }
      return true;
    }
    return false;
  };

  /**
   * @locus Client
   * @memberOf ClientStorage
   * @name keys
   * @summary Returns an array of Strings with all readable keys.
   * @returns {[String]}
   */
  ClientStorage.prototype.keys = function () {
    return Object.keys(this.data);
  };

  /**
   * @function
   * @memberOf ClientStorage
   * @name empty
   * @summary Empty storage (remove all key/value pairs)
   * @returns {Boolean}
   */
  ClientStorage.prototype.empty = function () {
    return this.remove();
  };
  module.exports.JSStorage = JSStorage;
  module.exports.BrowserStorage = BrowserStorage;
  module.exports.CookiesStorage = CookiesStorage;
  module.exports.ClientStorage = ClientStorage;
}.call(this, module);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"browser-storage.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ostrio_cstorage/browser-storage.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
!function (module1) {
  var helpers = require('./helpers.js');
  var TTL_SUFFIX = '.___exp';
  var localStorageDriver;

  /**
   * @locus Client
   * @class BrowserStorage
   * @summary localStorage driven storage
   */
  function BrowserStorage(clientStorage) {
    if (clientStorage) {
      this.data = clientStorage.data;
      this.ttlData = clientStorage.ttlData;
    } else {
      this.data = {};
      this.ttlData = {};
    }
    this.init();
  }

  /**
   * @locus Client
   * @memberOf BrowserStorage
   * @name init
   * @summary parse document.cookie string
   * @returns {void 0}
   */
  BrowserStorage.prototype.init = function () {
    localStorageDriver = window.localStorage || localStorage;

    // CLEAN UP EXPIRED ITEMS
    var i = localStorageDriver.length;
    var key;
    while (i--) {
      key = localStorageDriver.key(i);
      if (typeof key === 'string' && !!~key.indexOf(TTL_SUFFIX)) {
        var expireAt = parseInt(localStorageDriver.getItem(key));
        if (expireAt <= Date.now()) {
          localStorageDriver.removeItem(key);
          localStorageDriver.removeItem(key.replace(TTL_SUFFIX, ''));
        } else {
          this.ttlData[key] = expireAt;
        }
      } else {
        this.data[key] = this.unescape(localStorageDriver.getItem(key));
      }
    }
  };

  /**
   * @locus Client
   * @memberOf BrowserStorage
   * @name set
   * @param {String} key   - The name of the cookie to create/overwrite
   * @param {String} value - The value of the cookie
   * @param {Number} ttl   - BrowserStorage TTL (e.g. max-age) in seconds
   * @summary Create/overwrite a cookie.
   * @returns {Boolean}
   */
  BrowserStorage.prototype.set = function (key, value, ttl) {
    if (typeof key === 'string') {
      this.data[key] = value;
      localStorageDriver.setItem(key, this.escape(value));
      if (typeof ttl === 'number') {
        var expireAt = Date.now() + ttl * 1000;
        this.ttlData[key] = expireAt;
        localStorageDriver.setItem(key + TTL_SUFFIX, expireAt);
      }
      return true;
    }
    return false;
  };

  /**
   * @locus Client
   * @memberOf BrowserStorage
   * @name remove
   * @param {String} key - The name of the record to remove
   * @summary Remove a record(s).
   * @returns {Boolean}
   */
  BrowserStorage.prototype.remove = function (key) {
    if (typeof key === 'string' && this.data.hasOwnProperty(key)) {
      localStorageDriver.removeItem(key);
      localStorageDriver.removeItem(key + TTL_SUFFIX);
      delete this.data[key];
      delete this.ttlData[key];
      return true;
    }
    if (key === void 0) {
      var keys = this.keys();
      if (keys.length > 0 && keys[0] !== '') {
        for (var i = 0; i < keys.length; i++) {
          this.remove(keys[i]);
        }
        return true;
      }
    }
    return false;
  };

  /**
   * @locus Client
   * @memberOf BrowserStorage
   * @name escape
   * @param {mix} val - The value to escape
   * @summary Escape and stringify the value
   * @returns {String}
   */
  BrowserStorage.prototype.escape = function (val) {
    return escape(helpers.escape(val));
  };

  /**
   * @locus Client
   * @memberOf BrowserStorage
   * @name unescape
   * @param {String} val - The string to unescape
   * @summary Escape and restore original data-type of the value
   * @returns {mix}
   */
  BrowserStorage.prototype.unescape = function (val) {
    return helpers.unescape(unescape(val));
  };

  /**
   * @locus Client
   * @memberOf BrowserStorage
   * @name isSupported
   * @summary Returns `true` is this storage driver is supported
   * @returns {Boolean}
   */
  BrowserStorage.isSupported = function () {
    try {
      if ('localStorage' in window && window.localStorage !== null) {
        // Safari will throw an exception in Private mode
        window.localStorage.setItem('___test___', 'test');
        window.localStorage.removeItem('___test___');
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };
  module.exports = BrowserStorage;
}.call(this, module);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"cookies-storage.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ostrio_cstorage/cookies-storage.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
!function (module1) {
  var helpers = require('./helpers.js');
  var DEFAULT_TTL = 3.154e+8; // 10 years
  var TTL_SUFFIX = '.___exp';

  /**
   * @locus Client
   * @class CookiesStorage
   * @param cookieString {String} - Current cookies as String
   * @summary Cookie-driven storage
   */
  function CookiesStorage(clientStorage, cookieString) {
    if (clientStorage) {
      this.data = clientStorage.data;
      this.ttlData = clientStorage.ttlData;
    } else {
      this.data = {};
      this.ttlData = {};
    }
    if (cookieString && typeof cookieString === 'string') {
      this.init(cookieString);
    }
  }

  /**
   * @locus Client
   * @memberOf CookiesStorage
   * @name init
   * @param cookieString {String} - Current cookies as String
   * @summary parse document.cookie string
   * @returns {void 0}
   */
  CookiesStorage.prototype.init = function (cookieString) {
    if (typeof cookieString === 'string' && cookieString.length) {
      var self = this;
      var i;
      var key;
      var val;
      cookieString.split(/; */).forEach(function (pair) {
        i = pair.indexOf('=');
        if (i < 0) {
          return;
        }
        key = this.unescape(pair.substr(0, i).trim());
        val = pair.substr(++i, pair.length).trim();
        if (val[0] === '"') {
          val = val.slice(1, -1);
        }
        if (self.data[key] === void 0) {
          if (typeof key === 'string' && !!~key.indexOf(TTL_SUFFIX)) {
            self.ttlData[key] = parseInt(val);
          } else {
            try {
              self.data[key] = this.unescape(val);
            } catch (e) {
              self.data[key] = val;
            }
          }
        }
      });
    }
  };

  /**
   * @locus Client
   * @memberOf CookiesStorage
   * @name set
   * @param {String} key   - The name of the cookie to create/overwrite
   * @param {String} value - The value of the cookie
   * @param {Number} ttl   - CookiesStorage TTL (e.g. max-age) in seconds
   * @summary Create/overwrite a cookie.
   * @returns {Boolean}
   */
  CookiesStorage.prototype.set = function (key, value, _ttl) {
    var ttl = _ttl;
    if (!ttl || typeof ttl !== 'number') {
      ttl = DEFAULT_TTL;
    }
    if (typeof key === 'string') {
      document.cookie = this.escape(key) + '=' + this.escape(value) + '; Max-Age=' + ttl + '; Path=/';
      this.data[key] = value;
      this.ttlData[key] = Date.now() + ttl * 1000;
      document.cookie = this.escape(key) + TTL_SUFFIX + '=' + this.ttlData[key] + '; Max-Age=' + ttl + '; Path=/';
      return true;
    }
    return false;
  };

  /**
   * @locus Client
   * @memberOf CookiesStorage
   * @name remove
   * @param {String} key - The name of the cookie to remove
   * @summary Remove a cookie(s).
   * @returns {Boolean}
   */
  CookiesStorage.prototype.remove = function (key) {
    if (typeof key === 'string' && this.data.hasOwnProperty(key)) {
      delete this.data[key];
      delete this.ttlData[key];
      document.cookie = this.escape(key) + '=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/';
      document.cookie = this.escape(key) + TTL_SUFFIX + '=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/';
      return true;
    }
    if (key === void 0) {
      var keys = Object.keys(this.data);
      if (keys.length > 0 && keys[0] !== '') {
        for (var i = 0; i < keys.length; i++) {
          this.remove(keys[i]);
        }
        return true;
      }
    }
    return false;
  };

  /**
   * @locus Client
   * @memberOf CookiesStorage
   * @name escape
   * @param {mix} val - The value to escape
   * @summary Escape and stringify the value
   * @returns {String}
   */
  CookiesStorage.prototype.escape = function (val) {
    return escape(helpers.escape(val));
  };

  /**
   * @locus Client
   * @memberOf CookiesStorage
   * @name unescape
   * @param {String} val - The string to unescape
   * @summary Escape and restore original data-type of the value
   * @returns {mix}
   */
  CookiesStorage.prototype.unescape = function (val) {
    return helpers.unescape(unescape(val));
  };

  /**
   * @locus Client
   * @memberOf CookiesStorage
   * @name isSupported
   * @summary Returns `true` is this storage driver is supported
   * @returns {Boolean}
   */
  CookiesStorage.isSupported = function () {
    var result;
    try {
      document.cookie = '___isSupported___=value; Max-Age=' + DEFAULT_TTL + '; Path=/';
      result = document.cookie.includes('___isSupported___');
      document.cookie = '___isSupported___=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/';
    } catch (e) {
      return false;
    }
    return result && navigator.cookieEnabled;
  };
  module.exports = CookiesStorage;
}.call(this, module);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"helpers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ostrio_cstorage/helpers.js                                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
!function (module1) {
  /*
   * @Object
   * @name helpers
   */
  var helpers = {
    escape: function (value) {
      try {
        return JSON.stringify(value);
      } catch (e) {
        try {
          return value.toString();
        } catch (err) {
          return value;
        }
      }
    },
    unescape: function (value) {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }
  };
  module.exports = helpers;
}.call(this, module);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"js-storage.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ostrio_cstorage/js-storage.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
!function (module1) {
  /**
   * @locus Client
   * @class JSStorage
   * @summary JavaScript Object-driven storage
   */
  function JSStorage(clientStorage) {
    if (clientStorage) {
      this.data = clientStorage.data;
      this.ttlData = clientStorage.ttlData;
    } else {
      this.data = {};
      this.ttlData = {};
    }
  }

  /**
   * @locus Client
   * @memberOf JSStorage
   * @name set
   * @param {String} key   - The key to create/overwrite
   * @param {String} value - The value
   * @param {Number} ttl   - TTL (e.g. max-age) in seconds
   * @summary Create/overwrite a record.
   * @returns {Boolean}
   */
  JSStorage.prototype.set = function (key, value, ttl) {
    if (typeof key === 'string') {
      this.data[key] = value;
      if (typeof ttl === 'number') {
        this.ttlData[key] = Date.now() + ttl * 1000;
      }
      return true;
    }
    return false;
  };

  /**
   * @locus Client
   * @memberOf JSStorage
   * @name remove
   * @param {String} key - The key of the record to remove
   * @summary Remove record(s).
   * @returns {Boolean}
   */
  JSStorage.prototype.remove = function (key) {
    if (typeof key === 'string' && this.data.hasOwnProperty(key)) {
      delete this.data[key];
      delete this.ttlData[key];
      return true;
    }
    if (key === void 0 && Object.keys(this.data).length) {
      this.data = {};
      this.ttlData = {};
      return true;
    }
    return false;
  };

  /**
   * @locus Client
   * @memberOf JSStorage
   * @name isSupported
   * @summary Returns `true` is this storage driver is supported
   * @returns {Boolean}
   */
  JSStorage.isSupported = function () {
    return true;
  };
  module.exports = JSStorage;
}.call(this, module);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/ostrio:cstorage/client-storage.js");

/* Exports */
Package._define("ostrio:cstorage", exports);

})();

//# sourceURL=meteor://💻app/packages/ostrio_cstorage.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb3N0cmlvOmNzdG9yYWdlL2NsaWVudC1zdG9yYWdlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9vc3RyaW86Y3N0b3JhZ2UvYnJvd3Nlci1zdG9yYWdlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9vc3RyaW86Y3N0b3JhZ2UvY29va2llcy1zdG9yYWdlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9vc3RyaW86Y3N0b3JhZ2UvaGVscGVycy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb3N0cmlvOmNzdG9yYWdlL2pzLXN0b3JhZ2UuanMiXSwibmFtZXMiOlsibW9kdWxlMSIsIkNvb2tpZXNTdG9yYWdlIiwicmVxdWlyZSIsIkpTU3RvcmFnZSIsIkJyb3dzZXJTdG9yYWdlIiwiaXNTZXJ2ZXIiLCJfcHJvY2VzcyIsInByb2Nlc3MiLCJicm93c2VyIiwiZGVidWciLCJjb25zb2xlIiwid2FybiIsImFwcGx5IiwiYXJndW1lbnRzIiwiQ2xpZW50U3RvcmFnZSIsImRyaXZlck5hbWUiLCJkYXRhIiwidHRsRGF0YSIsIlN0b3JhZ2VEcml2ZXIiLCJpc1N1cHBvcnRlZCIsImRyaXZlciIsImRvY3VtZW50IiwiY29va2llIiwiT2JqZWN0IiwiYXNzaWduIiwicHJvdG90eXBlIiwiZ2V0Iiwia2V5IiwiaGFzT3duUHJvcGVydHkiLCJEYXRlIiwibm93IiwicmVtb3ZlIiwiaGFzIiwia2V5cyIsImVtcHR5IiwibW9kdWxlIiwiZXhwb3J0cyIsImNhbGwiLCJoZWxwZXJzIiwiVFRMX1NVRkZJWCIsImxvY2FsU3RvcmFnZURyaXZlciIsImNsaWVudFN0b3JhZ2UiLCJpbml0Iiwid2luZG93IiwibG9jYWxTdG9yYWdlIiwiaSIsImxlbmd0aCIsImluZGV4T2YiLCJleHBpcmVBdCIsInBhcnNlSW50IiwiZ2V0SXRlbSIsInJlbW92ZUl0ZW0iLCJyZXBsYWNlIiwidW5lc2NhcGUiLCJzZXQiLCJ2YWx1ZSIsInR0bCIsInNldEl0ZW0iLCJlc2NhcGUiLCJ2YWwiLCJlIiwiREVGQVVMVF9UVEwiLCJjb29raWVTdHJpbmciLCJzZWxmIiwic3BsaXQiLCJmb3JFYWNoIiwicGFpciIsInN1YnN0ciIsInRyaW0iLCJzbGljZSIsIl90dGwiLCJyZXN1bHQiLCJpbmNsdWRlcyIsIm5hdmlnYXRvciIsImNvb2tpZUVuYWJsZWQiLCJKU09OIiwic3RyaW5naWZ5IiwidG9TdHJpbmciLCJlcnIiLCJwYXJzZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsWUFBWTs7QUFBQyxXQUFBQSxPQUFBO0VBRWIsSUFBSUMsY0FBYyxHQUFHQyxPQUFPLENBQUMsc0JBQXNCLENBQUM7RUFDcEQsSUFBSUMsU0FBUyxHQUFHRCxPQUFPLENBQUMsaUJBQWlCLENBQUM7RUFDMUMsSUFBSUUsY0FBYyxHQUFHRixPQUFPLENBQUMsc0JBQXNCLENBQUM7RUFFcEQsSUFBSUcsUUFBUSxHQUFHLFNBQUFBLENBQUEsRUFBWTtJQUFBLElBQUFDLFFBQUE7SUFDekIsT0FBTyxPQUFPQyxPQUFPLEtBQUssUUFBUSxJQUFJLEdBQUFELFFBQUEsR0FBQ0MsT0FBTyxjQUFBRCxRQUFBLGVBQVBBLFFBQUEsQ0FBU0UsT0FBTztFQUN6RCxDQUFDO0VBRUQsSUFBSUMsS0FBSyxHQUFHLFNBQUFBLENBQUEsRUFBWTtJQUN0QkMsT0FBTyxDQUFDQyxJQUFJLENBQUNDLEtBQUssQ0FBQ0YsT0FBTyxFQUFFRyxTQUFTLENBQUM7RUFDeEMsQ0FBQzs7RUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDQSxTQUFTQyxhQUFhQSxDQUFDQyxVQUFVLEVBQUU7SUFDakMsSUFBSSxDQUFDQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO0lBQ2QsSUFBSSxDQUFDQyxPQUFPLEdBQUcsQ0FBQyxDQUFDO0lBQ2pCLElBQUlDLGFBQWE7SUFDakIsSUFBSSxDQUFDSCxVQUFVLEdBQUdBLFVBQVU7SUFFNUIsSUFBSVYsUUFBUSxDQUFD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LElBQUksQ0FBQ3ZDLE9BQU8sQ0FBQ1UsR0FBRyxDQUFDLEdBQUdFLElBQUksQ0FBQ0MsR0FBRyxDQUFDLENBQUMsR0FBSTBCLEdBQUcsR0FBRyxJQUFLO01BQy9DO01BQ0EsT0FBTyxJQUFJO0lBQ2I7SUFDQSxPQUFPLEtBQUs7RUFDZCxDQUFDOztFQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDQXJELFNBQVMsQ0FBQ3NCLFNBQVMsQ0FBQ00sTUFBTSxHQUFHLFVBQVVKLEdBQUcsRUFBRTtJQUMxQyxJQUFJLE9BQU9BLEdBQUcsS0FBSyxRQUFRLElBQUksSUFBSSxDQUFDWCxJQUFJLENBQUNZLGNBQWMsQ0FBQ0QsR0FBRyxDQUFDLEVBQUU7TUFDNUQsT0FBTyxJQUFJLENBQUNYLElBQUksQ0FBQ1csR0FBRyxDQUFDO01BQ3JCLE9BQU8sSUFBSSxDQUFDVixPQUFPLENBQUNVLEdBQUcsQ0FBQztNQUN4QixPQUFPLElBQUk7SUFDYjtJQUVBLElBQUlBLEdBQUcsS0FBSyxLQUFLLENBQUMsSUFBSUosTUFBTSxDQUFDVSxJQUFJLENBQUMsSUFBSSxDQUFDakIsSUFBSSxDQUFDLENBQUM4QixNQUFNLEVBQUU7TUFDbkQsSUFBSSxDQUFDOUIsSUFBSSxHQUFHLENBQUMsQ0FBQztNQUNkLElBQUksQ0FBQ0MsT0FBTyxHQUFHLENBQUMsQ0FBQztNQUNqQixPQUFPLElBQUk7SUFDYjtJQUNBLE9BQU8sS0FBSztFQUNkLENBQUM7O0VBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDQWQsU0FBUyxDQUFDZ0IsV0FBVyxHQUFHLFlBQVk7SUFDbEMsT0FBTyxJQUFJO0VBQ2IsQ0FBQztFQUVEZ0IsTUFBTSxDQUFDQyxPQUFPLEdBQUdqQyxTQUFTO0FBQUMsRUFBQWtDLElBQUEsT0FBQUYsTUFBQSxFIiwiZmlsZSI6Ii9wYWNrYWdlcy9vc3RyaW9fY3N0b3JhZ2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbnZhciBDb29raWVzU3RvcmFnZSA9IHJlcXVpcmUoJy4vY29va2llcy1zdG9yYWdlLmpzJyk7XG52YXIgSlNTdG9yYWdlID0gcmVxdWlyZSgnLi9qcy1zdG9yYWdlLmpzJyk7XG52YXIgQnJvd3NlclN0b3JhZ2UgPSByZXF1aXJlKCcuL2Jyb3dzZXItc3RvcmFnZS5qcycpO1xuXG52YXIgaXNTZXJ2ZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0eXBlb2YgcHJvY2VzcyA9PT0gJ29iamVjdCcgJiYgIXByb2Nlc3M/LmJyb3dzZXI7XG59O1xuXG52YXIgZGVidWcgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUud2Fybi5hcHBseShjb25zb2xlLCBhcmd1bWVudHMpO1xufTtcblxuLyoqXG4gKiBAbG9jdXMgQ2xpZW50XG4gKiBAY2xhc3MgQ2xpZW50U3RvcmFnZVxuICogQHBhcmFtIGRyaXZlck5hbWUge1N0aW5nfSAtIFByZWZlcmFibGUgZHJpdmVyIGBsb2NhbFN0b3JhZ2VgIG9yIGBjb29raWVzYFxuICogQHN1bW1hcnkgSW1wbGVtZW50IGJvaWxlcnBsYXRlIENsaWVudCBzdG9yYWdlIGZ1bmN0aW9ucywgbG9jYWxTdG9yYWdlIHdpdGggZmFsbC1iYWNrIHRvIENvb2tpZXNTdG9yYWdlXG4gKi9cbmZ1bmN0aW9uIENsaWVudFN0b3JhZ2UoZHJpdmVyTmFtZSkge1xuICB0aGlzLmRhdGEgPSB7fTtcbiAgdGhpcy50dGxEYXRhID0ge307XG4gIHZhciBTdG9yYWdlRHJpdmVyO1xuICB0aGlzLmRyaXZlck5hbWUgPSBkcml2ZXJOYW1lO1xuXG4gIGlmIChpc1NlcnZlcigpKSB7XG4gICAgU3RvcmFnZURyaXZlciA9IEpTU3RvcmFnZTtcbiAgICB0aGlzLmRyaXZlck5hbWUgPSAnanMnO1xuICB9IGVsc2Uge1xuICAgIHN3aXRjaCAoZHJpdmVyTmFtZSkge1xuICAgIGNhc2UgJ2xvY2FsU3RvcmFnZSc6XG4gICAgICBpZiAoQnJvd3NlclN0b3JhZ2UuaXNTdXBwb3J0ZWQoKSkge1xuICAgICAgICBTdG9yYWdlRHJpdmVyID0gQnJvd3NlclN0b3JhZ2U7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZWJ1ZygnQ2xpZW50U3RvcmFnZSBpcyBzZXQgdG8gXCJsb2NhbFN0b3JhZ2VcIiwgYnV0IGl0IGlzIG5vdCBzdXBwb3J0ZWQgb24gdGhpcyBicm93c2VyJyk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdjb29raWVzJzpcbiAgICAgIGlmIChDb29raWVzU3RvcmFnZS5pc1N1cHBvcnRlZCgpKSB7XG4gICAgICAgIFN0b3JhZ2VEcml2ZXIgPSBDb29raWVzU3RvcmFnZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRlYnVnKCdDbGllbnRTdG9yYWdlIGlzIHNldCB0byBcImNvb2tpZXNcIiwgYnV0IENvb2tpZXNTdG9yYWdlIGlzIGRpc2FibGVkIG9uIHRoaXMgYnJvd3NlcicpO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnanMnOlxuICAgICAgU3RvcmFnZURyaXZlciA9IEpTU3RvcmFnZTtcbiAgICAgIHRoaXMuZHJpdmVyTmFtZSA9ICdqcyc7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFTdG9yYWdlRHJpdmVyKSB7XG4gICAgaWYgKEJyb3dzZXJTdG9yYWdlLmlzU3VwcG9ydGVkKCkpIHtcbiAgICAgIHRoaXMuZHJpdmVyTmFtZSA9ICdsb2NhbFN0b3JhZ2UnO1xuICAgICAgU3RvcmFnZURyaXZlciA9IEJyb3dzZXJTdG9yYWdlO1xuICAgIH0gZWxzZSBpZiAoQ29va2llc1N0b3JhZ2UuaXNTdXBwb3J0ZWQoKSkge1xuICAgICAgdGhpcy5kcml2ZXJOYW1lID0gJ2Nvb2tpZXMnO1xuICAgICAgU3RvcmFnZURyaXZlciA9IENvb2tpZXNTdG9yYWdlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRyaXZlck5hbWUgPSAnanMnO1xuICAgICAgU3RvcmFnZURyaXZlciA9IEpTU3RvcmFnZTtcbiAgICB9XG4gIH1cblxuICBpZiAodGhpcy5kcml2ZXJOYW1lID09PSAnY29va2llcycpIHtcbiAgICB0aGlzLmRyaXZlciA9IG5ldyBTdG9yYWdlRHJpdmVyKHRoaXMsIGRvY3VtZW50LmNvb2tpZSk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5kcml2ZXIgPSBuZXcgU3RvcmFnZURyaXZlcih0aGlzKTtcbiAgfVxuICBPYmplY3QuYXNzaWduKHRoaXMsIFN0b3JhZ2VEcml2ZXIucHJvdG90eXBlKTtcbn1cblxuLyoqXG4gKiBAbG9jdXMgQ2xpZW50XG4gKiBAbWVtYmVyT2YgQ2xpZW50U3RvcmFnZVxuICogQG5hbWUgZ2V0XG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5IC0gVGhlIGtleSBvZiB0aGUgdmFsdWUgdG8gcmVhZFxuICogQHN1bW1hcnkgUmVhZCBhIHN0b3JlZCB2YWx1ZSBieSBrZXkuIElmIHRoZSBrZXkgZG9lc24ndCBleGlzdCBhIHZvaWQgMCAodW5kZWZpbmVkKSB2YWx1ZSB3aWxsIGJlIHJldHVybmVkLlxuICogQHJldHVybnMge1N0cmluZ3xNaXh8dm9pZCAwfVxuICovXG5DbGllbnRTdG9yYWdlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoa2V5KSB7XG4gIGlmICh0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJykge1xuICAgIHJldHVybiB2b2lkIDA7XG4gIH1cblxuICBpZiAodGhpcy5kYXRhLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICBpZiAodGhpcy50dGxEYXRhW2tleV0gPD0gRGF0ZS5ub3coKSkge1xuICAgICAgdGhpcy5yZW1vdmUoa2V5KTtcbiAgICAgIHJldHVybiB2b2lkIDA7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmRhdGFba2V5XTtcbiAgfVxuXG4gIHJldHVybiB2b2lkIDA7XG59O1xuXG4vKipcbiAqIEBsb2N1cyBDbGllbnRcbiAqIEBtZW1iZXJPZiBDbGllbnRTdG9yYWdlXG4gKiBAbmFtZSBoYXNcbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXkgLSBUaGUgbmFtZSBvZiB0aGUgcmVjb3JkIHRvIGNoZWNrXG4gKiBAc3VtbWFyeSBDaGVjayB3aGV0aGVyIGEgcmVjb3JkIGtleSBpcyBleGlzdHNcbiAqIEByZXR1cm5zIHtCb29sZWFufVxuICovXG5DbGllbnRTdG9yYWdlLnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbiAoa2V5KSB7XG4gIGlmICh0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmICh0aGlzLmRhdGEuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgIGlmICh0aGlzLnR0bERhdGFba2V5XSA8PSBEYXRlLm5vdygpKSB7XG4gICAgICB0aGlzLnJlbW92ZShrZXkpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59O1xuXG4vKipcbiAqIEBsb2N1cyBDbGllbnRcbiAqIEBtZW1iZXJPZiBDbGllbnRTdG9yYWdlXG4gKiBAbmFtZSBrZXlzXG4gKiBAc3VtbWFyeSBSZXR1cm5zIGFuIGFycmF5IG9mIFN0cmluZ3Mgd2l0aCBhbGwgcmVhZGFibGUga2V5cy5cbiAqIEByZXR1cm5zIHtbU3RyaW5nXX1cbiAqL1xuQ2xpZW50U3RvcmFnZS5wcm90b3R5cGUua2V5cyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuZGF0YSk7XG59O1xuXG4vKipcbiAqIEBmdW5jdGlvblxuICogQG1lbWJlck9mIENsaWVudFN0b3JhZ2VcbiAqIEBuYW1lIGVtcHR5XG4gKiBAc3VtbWFyeSBFbXB0eSBzdG9yYWdlIChyZW1vdmUgYWxsIGtleS92YWx1ZSBwYWlycylcbiAqIEByZXR1cm5zIHtCb29sZWFufVxuICovXG5DbGllbnRTdG9yYWdlLnByb3RvdHlwZS5lbXB0eSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMucmVtb3ZlKCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cy5KU1N0b3JhZ2UgPSBKU1N0b3JhZ2U7XG5tb2R1bGUuZXhwb3J0cy5Ccm93c2VyU3RvcmFnZSA9IEJyb3dzZXJTdG9yYWdlO1xubW9kdWxlLmV4cG9ydHMuQ29va2llc1N0b3JhZ2UgPSBDb29raWVzU3RvcmFnZTtcblxubW9kdWxlLmV4cG9ydHMuQ2xpZW50U3RvcmFnZSA9IENsaWVudFN0b3JhZ2U7XG4iLCJ2YXIgaGVscGVycyA9IHJlcXVpcmUoJy4vaGVscGVycy5qcycpO1xudmFyIFRUTF9TVUZGSVggPSAnLl9fX2V4cCc7XG52YXIgbG9jYWxTdG9yYWdlRHJpdmVyO1xuXG4vKipcbiAqIEBsb2N1cyBDbGllbnRcbiAqIEBjbGFzcyBCcm93c2VyU3RvcmFnZVxuICogQHN1bW1hcnkgbG9jYWxTdG9yYWdlIGRyaXZlbiBzdG9yYWdlXG4gKi9cbmZ1bmN0aW9uIEJyb3dzZXJTdG9yYWdlKGNsaWVudFN0b3JhZ2UpIHtcbiAgaWYgKGNsaWVudFN0b3JhZ2UpIHtcbiAgICB0aGlzLmRhdGEgPSBjbGllbnRTdG9yYWdlLmRhdGE7XG4gICAgdGhpcy50dGxEYXRhID0gY2xpZW50U3RvcmFnZS50dGxEYXRhO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuZGF0YSA9IHt9O1xuICAgIHRoaXMudHRsRGF0YSA9IHt9O1xuICB9XG4gIHRoaXMuaW5pdCgpO1xufVxuXG4vKipcbiAqIEBsb2N1cyBDbGllbnRcbiAqIEBtZW1iZXJPZiBCcm93c2VyU3RvcmFnZVxuICogQG5hbWUgaW5pdFxuICogQHN1bW1hcnkgcGFyc2UgZG9jdW1lbnQuY29va2llIHN0cmluZ1xuICogQHJldHVybnMge3ZvaWQgMH1cbiAqL1xuQnJvd3NlclN0b3JhZ2UucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiAoKSB7XG4gIGxvY2FsU3RvcmFnZURyaXZlciA9IHdpbmRvdy5sb2NhbFN0b3JhZ2UgfHwgbG9jYWxTdG9yYWdlO1xuXG4gIC8vIENMRUFOIFVQIEVYUElSRUQgSVRFTVNcbiAgdmFyIGkgPSBsb2NhbFN0b3JhZ2VEcml2ZXIubGVuZ3RoO1xuICB2YXIga2V5O1xuICB3aGlsZSAoaS0tKSB7XG4gICAga2V5ID0gbG9jYWxTdG9yYWdlRHJpdmVyLmtleShpKTtcbiAgICBpZiAodHlwZW9mIGtleSA9PT0gJ3N0cmluZycgJiYgISF+a2V5LmluZGV4T2YoVFRMX1NVRkZJWCkpIHtcbiAgICAgIHZhciBleHBpcmVBdCA9IHBhcnNlSW50KGxvY2FsU3RvcmFnZURyaXZlci5nZXRJdGVtKGtleSkpO1xuICAgICAgaWYgKGV4cGlyZUF0IDw9IERhdGUubm93KCkpIHtcbiAgICAgICAgbG9jYWxTdG9yYWdlRHJpdmVyLnJlbW92ZUl0ZW0oa2V5KTtcbiAgICAgICAgbG9jYWxTdG9yYWdlRHJpdmVyLnJlbW92ZUl0ZW0oa2V5LnJlcGxhY2UoVFRMX1NVRkZJWCwgJycpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMudHRsRGF0YVtrZXldID0gZXhwaXJlQXQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGF0YVtrZXldID0gdGhpcy51bmVzY2FwZShsb2NhbFN0b3JhZ2VEcml2ZXIuZ2V0SXRlbShrZXkpKTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogQGxvY3VzIENsaWVudFxuICogQG1lbWJlck9mIEJyb3dzZXJTdG9yYWdlXG4gKiBAbmFtZSBzZXRcbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXkgICAtIFRoZSBuYW1lIG9mIHRoZSBjb29raWUgdG8gY3JlYXRlL292ZXJ3cml0ZVxuICogQHBhcmFtIHtTdHJpbmd9IHZhbHVlIC0gVGhlIHZhbHVlIG9mIHRoZSBjb29raWVcbiAqIEBwYXJhbSB7TnVtYmVyfSB0dGwgICAtIEJyb3dzZXJTdG9yYWdlIFRUTCAoZS5nLiBtYXgtYWdlKSBpbiBzZWNvbmRzXG4gKiBAc3VtbWFyeSBDcmVhdGUvb3ZlcndyaXRlIGEgY29va2llLlxuICogQHJldHVybnMge0Jvb2xlYW59XG4gKi9cbkJyb3dzZXJTdG9yYWdlLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSwgdHRsKSB7XG4gIGlmICh0eXBlb2Yga2V5ID09PSAnc3RyaW5nJykge1xuICAgIHRoaXMuZGF0YVtrZXldID0gdmFsdWU7XG4gICAgbG9jYWxTdG9yYWdlRHJpdmVyLnNldEl0ZW0oa2V5LCB0aGlzLmVzY2FwZSh2YWx1ZSkpO1xuXG4gICAgaWYgKHR5cGVvZiB0dGwgPT09ICdudW1iZXInKSB7XG4gICAgICB2YXIgZXhwaXJlQXQgPSBEYXRlLm5vdygpICsgKHR0bCAqIDEwMDApO1xuICAgICAgdGhpcy50dGxEYXRhW2tleV0gPSBleHBpcmVBdDtcbiAgICAgIGxvY2FsU3RvcmFnZURyaXZlci5zZXRJdGVtKGtleSArIFRUTF9TVUZGSVgsIGV4cGlyZUF0KTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuLyoqXG4gKiBAbG9jdXMgQ2xpZW50XG4gKiBAbWVtYmVyT2YgQnJvd3NlclN0b3JhZ2VcbiAqIEBuYW1lIHJlbW92ZVxuICogQHBhcmFtIHtTdHJpbmd9IGtleSAtIFRoZSBuYW1lIG9mIHRoZSByZWNvcmQgdG8gcmVtb3ZlXG4gKiBAc3VtbWFyeSBSZW1vdmUgYSByZWNvcmQocykuXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAqL1xuQnJvd3NlclN0b3JhZ2UucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgaWYgKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnICYmIHRoaXMuZGF0YS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgbG9jYWxTdG9yYWdlRHJpdmVyLnJlbW92ZUl0ZW0oa2V5KTtcbiAgICBsb2NhbFN0b3JhZ2VEcml2ZXIucmVtb3ZlSXRlbShrZXkgKyBUVExfU1VGRklYKTtcbiAgICBkZWxldGUgdGhpcy5kYXRhW2tleV07XG4gICAgZGVsZXRlIHRoaXMudHRsRGF0YVtrZXldO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgaWYgKGtleSA9PT0gdm9pZCAwKSB7XG4gICAgdmFyIGtleXMgPSB0aGlzLmtleXMoKTtcbiAgICBpZiAoa2V5cy5sZW5ndGggPiAwICYmIGtleXNbMF0gIT09ICcnKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGhpcy5yZW1vdmUoa2V5c1tpXSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59O1xuXG4vKipcbiAqIEBsb2N1cyBDbGllbnRcbiAqIEBtZW1iZXJPZiBCcm93c2VyU3RvcmFnZVxuICogQG5hbWUgZXNjYXBlXG4gKiBAcGFyYW0ge21peH0gdmFsIC0gVGhlIHZhbHVlIHRvIGVzY2FwZVxuICogQHN1bW1hcnkgRXNjYXBlIGFuZCBzdHJpbmdpZnkgdGhlIHZhbHVlXG4gKiBAcmV0dXJucyB7U3RyaW5nfVxuICovXG5Ccm93c2VyU3RvcmFnZS5wcm90b3R5cGUuZXNjYXBlID0gZnVuY3Rpb24gKHZhbCkge1xuICByZXR1cm4gZXNjYXBlKGhlbHBlcnMuZXNjYXBlKHZhbCkpO1xufTtcblxuLyoqXG4gKiBAbG9jdXMgQ2xpZW50XG4gKiBAbWVtYmVyT2YgQnJvd3NlclN0b3JhZ2VcbiAqIEBuYW1lIHVuZXNjYXBlXG4gKiBAcGFyYW0ge1N0cmluZ30gdmFsIC0gVGhlIHN0cmluZyB0byB1bmVzY2FwZVxuICogQHN1bW1hcnkgRXNjYXBlIGFuZCByZXN0b3JlIG9yaWdpbmFsIGRhdGEtdHlwZSBvZiB0aGUgdmFsdWVcbiAqIEByZXR1cm5zIHttaXh9XG4gKi9cbkJyb3dzZXJTdG9yYWdlLnByb3RvdHlwZS51bmVzY2FwZSA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgcmV0dXJuIGhlbHBlcnMudW5lc2NhcGUodW5lc2NhcGUodmFsKSk7XG59O1xuXG4vKipcbiAqIEBsb2N1cyBDbGllbnRcbiAqIEBtZW1iZXJPZiBCcm93c2VyU3RvcmFnZVxuICogQG5hbWUgaXNTdXBwb3J0ZWRcbiAqIEBzdW1tYXJ5IFJldHVybnMgYHRydWVgIGlzIHRoaXMgc3RvcmFnZSBkcml2ZXIgaXMgc3VwcG9ydGVkXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAqL1xuQnJvd3NlclN0b3JhZ2UuaXNTdXBwb3J0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gIHRyeSB7XG4gICAgaWYgKCdsb2NhbFN0b3JhZ2UnIGluIHdpbmRvdyAmJiB3aW5kb3cubG9jYWxTdG9yYWdlICE9PSBudWxsKSB7XG4gICAgICAvLyBTYWZhcmkgd2lsbCB0aHJvdyBhbiBleGNlcHRpb24gaW4gUHJpdmF0ZSBtb2RlXG4gICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oJ19fX3Rlc3RfX18nLCAndGVzdCcpO1xuICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdfX190ZXN0X19fJyk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJyb3dzZXJTdG9yYWdlO1xuIiwidmFyIGhlbHBlcnMgPSByZXF1aXJlKCcuL2hlbHBlcnMuanMnKTtcbnZhciBERUZBVUxUX1RUTCA9IDMuMTU0ZSs4OyAvLyAxMCB5ZWFyc1xudmFyIFRUTF9TVUZGSVggPSAnLl9fX2V4cCc7XG5cbi8qKlxuICogQGxvY3VzIENsaWVudFxuICogQGNsYXNzIENvb2tpZXNTdG9yYWdlXG4gKiBAcGFyYW0gY29va2llU3RyaW5nIHtTdHJpbmd9IC0gQ3VycmVudCBjb29raWVzIGFzIFN0cmluZ1xuICogQHN1bW1hcnkgQ29va2llLWRyaXZlbiBzdG9yYWdlXG4gKi9cbmZ1bmN0aW9uIENvb2tpZXNTdG9yYWdlKGNsaWVudFN0b3JhZ2UsIGNvb2tpZVN0cmluZykge1xuICBpZiAoY2xpZW50U3RvcmFnZSkge1xuICAgIHRoaXMuZGF0YSA9IGNsaWVudFN0b3JhZ2UuZGF0YTtcbiAgICB0aGlzLnR0bERhdGEgPSBjbGllbnRTdG9yYWdlLnR0bERhdGE7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5kYXRhID0ge307XG4gICAgdGhpcy50dGxEYXRhID0ge307XG4gIH1cblxuICBpZiAoY29va2llU3RyaW5nICYmIHR5cGVvZiBjb29raWVTdHJpbmcgPT09ICdzdHJpbmcnKSB7XG4gICAgdGhpcy5pbml0KGNvb2tpZVN0cmluZyk7XG4gIH1cbn1cblxuLyoqXG4gKiBAbG9jdXMgQ2xpZW50XG4gKiBAbWVtYmVyT2YgQ29va2llc1N0b3JhZ2VcbiAqIEBuYW1lIGluaXRcbiAqIEBwYXJhbSBjb29raWVTdHJpbmcge1N0cmluZ30gLSBDdXJyZW50IGNvb2tpZXMgYXMgU3RyaW5nXG4gKiBAc3VtbWFyeSBwYXJzZSBkb2N1bWVudC5jb29raWUgc3RyaW5nXG4gKiBAcmV0dXJucyB7dm9pZCAwfVxuICovXG5Db29raWVzU3RvcmFnZS5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uIChjb29raWVTdHJpbmcpIHtcbiAgaWYgKHR5cGVvZiBjb29raWVTdHJpbmcgPT09ICdzdHJpbmcnICYmIGNvb2tpZVN0cmluZy5sZW5ndGgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGk7XG4gICAgdmFyIGtleTtcbiAgICB2YXIgdmFsO1xuXG4gICAgY29va2llU3RyaW5nLnNwbGl0KC87ICovKS5mb3JFYWNoKGZ1bmN0aW9uIChwYWlyKSB7XG4gICAgICBpID0gcGFpci5pbmRleE9mKCc9Jyk7XG4gICAgICBpZiAoaSA8IDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBrZXkgPSB0aGlzLnVuZXNjYXBlKHBhaXIuc3Vic3RyKDAsIGkpLnRyaW0oKSk7XG4gICAgICB2YWwgPSBwYWlyLnN1YnN0cigrK2ksIHBhaXIubGVuZ3RoKS50cmltKCk7XG5cbiAgICAgIGlmICh2YWxbMF0gPT09ICdcIicpIHtcbiAgICAgICAgdmFsID0gdmFsLnNsaWNlKDEsIC0xKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHNlbGYuZGF0YVtrZXldID09PSB2b2lkIDApIHtcbiAgICAgICAgaWYgKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnICYmICEhfmtleS5pbmRleE9mKFRUTF9TVUZGSVgpKSB7XG4gICAgICAgICAgc2VsZi50dGxEYXRhW2tleV0gPSBwYXJzZUludCh2YWwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBzZWxmLmRhdGFba2V5XSA9IHRoaXMudW5lc2NhcGUodmFsKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBzZWxmLmRhdGFba2V5XSA9IHZhbDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufTtcblxuLyoqXG4gKiBAbG9jdXMgQ2xpZW50XG4gKiBAbWVtYmVyT2YgQ29va2llc1N0b3JhZ2VcbiAqIEBuYW1lIHNldFxuICogQHBhcmFtIHtTdHJpbmd9IGtleSAgIC0gVGhlIG5hbWUgb2YgdGhlIGNvb2tpZSB0byBjcmVhdGUvb3ZlcndyaXRlXG4gKiBAcGFyYW0ge1N0cmluZ30gdmFsdWUgLSBUaGUgdmFsdWUgb2YgdGhlIGNvb2tpZVxuICogQHBhcmFtIHtOdW1iZXJ9IHR0bCAgIC0gQ29va2llc1N0b3JhZ2UgVFRMIChlLmcuIG1heC1hZ2UpIGluIHNlY29uZHNcbiAqIEBzdW1tYXJ5IENyZWF0ZS9vdmVyd3JpdGUgYSBjb29raWUuXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAqL1xuQ29va2llc1N0b3JhZ2UucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChrZXksIHZhbHVlLCBfdHRsKSB7XG4gIHZhciB0dGwgPSBfdHRsO1xuICBpZiAoIXR0bCB8fCB0eXBlb2YgdHRsICE9PSAnbnVtYmVyJykge1xuICAgIHR0bCA9IERFRkFVTFRfVFRMO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnKSB7XG4gICAgZG9jdW1lbnQuY29va2llID0gdGhpcy5lc2NhcGUoa2V5KSArICc9JyArIHRoaXMuZXNjYXBlKHZhbHVlKSArICc7IE1heC1BZ2U9JyArIHR0bCArICc7IFBhdGg9Lyc7XG4gICAgdGhpcy5kYXRhW2tleV0gPSB2YWx1ZTtcbiAgICB0aGlzLnR0bERhdGFba2V5XSA9IERhdGUubm93KCkgKyAodHRsICogMTAwMCk7XG4gICAgZG9jdW1lbnQuY29va2llID0gdGhpcy5lc2NhcGUoa2V5KSArIFRUTF9TVUZGSVggKyAnPScgKyB0aGlzLnR0bERhdGFba2V5XSArICc7IE1heC1BZ2U9JyArIHR0bCArICc7IFBhdGg9Lyc7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuLyoqXG4gKiBAbG9jdXMgQ2xpZW50XG4gKiBAbWVtYmVyT2YgQ29va2llc1N0b3JhZ2VcbiAqIEBuYW1lIHJlbW92ZVxuICogQHBhcmFtIHtTdHJpbmd9IGtleSAtIFRoZSBuYW1lIG9mIHRoZSBjb29raWUgdG8gcmVtb3ZlXG4gKiBAc3VtbWFyeSBSZW1vdmUgYSBjb29raWUocykuXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAqL1xuQ29va2llc1N0b3JhZ2UucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgaWYgKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnICYmIHRoaXMuZGF0YS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgZGVsZXRlIHRoaXMuZGF0YVtrZXldO1xuICAgIGRlbGV0ZSB0aGlzLnR0bERhdGFba2V5XTtcbiAgICBkb2N1bWVudC5jb29raWUgPSB0aGlzLmVzY2FwZShrZXkpICsgJz07IEV4cGlyZXM9VGh1LCAwMSBKYW4gMTk3MCAwMDowMDowMCBHTVQ7IFBhdGg9Lyc7XG4gICAgZG9jdW1lbnQuY29va2llID0gdGhpcy5lc2NhcGUoa2V5KSArIFRUTF9TVUZGSVggKyAnPTsgRXhwaXJlcz1UaHUsIDAxIEphbiAxOTcwIDAwOjAwOjAwIEdNVDsgUGF0aD0vJztcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGlmIChrZXkgPT09IHZvaWQgMCkge1xuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXModGhpcy5kYXRhKTtcbiAgICBpZiAoa2V5cy5sZW5ndGggPiAwICYmIGtleXNbMF0gIT09ICcnKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGhpcy5yZW1vdmUoa2V5c1tpXSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuLyoqXG4gKiBAbG9jdXMgQ2xpZW50XG4gKiBAbWVtYmVyT2YgQ29va2llc1N0b3JhZ2VcbiAqIEBuYW1lIGVzY2FwZVxuICogQHBhcmFtIHttaXh9IHZhbCAtIFRoZSB2YWx1ZSB0byBlc2NhcGVcbiAqIEBzdW1tYXJ5IEVzY2FwZSBhbmQgc3RyaW5naWZ5IHRoZSB2YWx1ZVxuICogQHJldHVybnMge1N0cmluZ31cbiAqL1xuQ29va2llc1N0b3JhZ2UucHJvdG90eXBlLmVzY2FwZSA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgcmV0dXJuIGVzY2FwZShoZWxwZXJzLmVzY2FwZSh2YWwpKTtcbn07XG5cbi8qKlxuICogQGxvY3VzIENsaWVudFxuICogQG1lbWJlck9mIENvb2tpZXNTdG9yYWdlXG4gKiBAbmFtZSB1bmVzY2FwZVxuICogQHBhcmFtIHtTdHJpbmd9IHZhbCAtIFRoZSBzdHJpbmcgdG8gdW5lc2NhcGVcbiAqIEBzdW1tYXJ5IEVzY2FwZSBhbmQgcmVzdG9yZSBvcmlnaW5hbCBkYXRhLXR5cGUgb2YgdGhlIHZhbHVlXG4gKiBAcmV0dXJucyB7bWl4fVxuICovXG5Db29raWVzU3RvcmFnZS5wcm90b3R5cGUudW5lc2NhcGUgPSBmdW5jdGlvbiAodmFsKSB7XG4gIHJldHVybiBoZWxwZXJzLnVuZXNjYXBlKHVuZXNjYXBlKHZhbCkpO1xufTtcblxuLyoqXG4gKiBAbG9jdXMgQ2xpZW50XG4gKiBAbWVtYmVyT2YgQ29va2llc1N0b3JhZ2VcbiAqIEBuYW1lIGlzU3VwcG9ydGVkXG4gKiBAc3VtbWFyeSBSZXR1cm5zIGB0cnVlYCBpcyB0aGlzIHN0b3JhZ2UgZHJpdmVyIGlzIHN1cHBvcnRlZFxuICogQHJldHVybnMge0Jvb2xlYW59XG4gKi9cbkNvb2tpZXNTdG9yYWdlLmlzU3VwcG9ydGVkID0gZnVuY3Rpb24gKCkge1xuICB2YXIgcmVzdWx0O1xuICB0cnkge1xuICAgIGRvY3VtZW50LmNvb2tpZSA9ICdfX19pc1N1cHBvcnRlZF9fXz12YWx1ZTsgTWF4LUFnZT0nICsgREVGQVVMVF9UVEwgKyAnOyBQYXRoPS8nO1xuICAgIHJlc3VsdCA9IGRvY3VtZW50LmNvb2tpZS5pbmNsdWRlcygnX19faXNTdXBwb3J0ZWRfX18nKTtcbiAgICBkb2N1bWVudC5jb29raWUgPSAnX19faXNTdXBwb3J0ZWRfX189OyBFeHBpcmVzPVRodSwgMDEgSmFuIDE5NzAgMDA6MDA6MDAgR01UOyBQYXRoPS8nO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiByZXN1bHQgJiYgbmF2aWdhdG9yLmNvb2tpZUVuYWJsZWQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvb2tpZXNTdG9yYWdlO1xuIiwiLypcbiAqIEBPYmplY3RcbiAqIEBuYW1lIGhlbHBlcnNcbiAqL1xudmFyIGhlbHBlcnMgPSB7XG4gIGVzY2FwZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgdW5lc2NhcGU6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZSh2YWx1ZSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBoZWxwZXJzO1xuIiwiLyoqXG4gKiBAbG9jdXMgQ2xpZW50XG4gKiBAY2xhc3MgSlNTdG9yYWdlXG4gKiBAc3VtbWFyeSBKYXZhU2NyaXB0IE9iamVjdC1kcml2ZW4gc3RvcmFnZVxuICovXG5mdW5jdGlvbiBKU1N0b3JhZ2UoY2xpZW50U3RvcmFnZSkge1xuICBpZiAoY2xpZW50U3RvcmFnZSkge1xuICAgIHRoaXMuZGF0YSA9IGNsaWVudFN0b3JhZ2UuZGF0YTtcbiAgICB0aGlzLnR0bERhdGEgPSBjbGllbnRTdG9yYWdlLnR0bERhdGE7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5kYXRhID0ge307XG4gICAgdGhpcy50dGxEYXRhID0ge307XG4gIH1cbn1cblxuLyoqXG4gKiBAbG9jdXMgQ2xpZW50XG4gKiBAbWVtYmVyT2YgSlNTdG9yYWdlXG4gKiBAbmFtZSBzZXRcbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXkgICAtIFRoZSBrZXkgdG8gY3JlYXRlL292ZXJ3cml0ZVxuICogQHBhcmFtIHtTdHJpbmd9IHZhbHVlIC0gVGhlIHZhbHVlXG4gKiBAcGFyYW0ge051bWJlcn0gdHRsICAgLSBUVEwgKGUuZy4gbWF4LWFnZSkgaW4gc2Vjb25kc1xuICogQHN1bW1hcnkgQ3JlYXRlL292ZXJ3cml0ZSBhIHJlY29yZC5cbiAqIEByZXR1cm5zIHtCb29sZWFufVxuICovXG5KU1N0b3JhZ2UucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChrZXksIHZhbHVlLCB0dGwpIHtcbiAgaWYgKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnKSB7XG4gICAgdGhpcy5kYXRhW2tleV0gPSB2YWx1ZTtcbiAgICBpZiAodHlwZW9mIHR0bCA9PT0gJ251bWJlcicpIHtcbiAgICAgIHRoaXMudHRsRGF0YVtrZXldID0gRGF0ZS5ub3coKSArICh0dGwgKiAxMDAwKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuLyoqXG4gKiBAbG9jdXMgQ2xpZW50XG4gKiBAbWVtYmVyT2YgSlNTdG9yYWdlXG4gKiBAbmFtZSByZW1vdmVcbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXkgLSBUaGUga2V5IG9mIHRoZSByZWNvcmQgdG8gcmVtb3ZlXG4gKiBAc3VtbWFyeSBSZW1vdmUgcmVjb3JkKHMpLlxuICogQHJldHVybnMge0Jvb2xlYW59XG4gKi9cbkpTU3RvcmFnZS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKGtleSkge1xuICBpZiAodHlwZW9mIGtleSA9PT0gJ3N0cmluZycgJiYgdGhpcy5kYXRhLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICBkZWxldGUgdGhpcy5kYXRhW2tleV07XG4gICAgZGVsZXRlIHRoaXMudHRsRGF0YVtrZXldO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgaWYgKGtleSA9PT0gdm9pZCAwICYmIE9iamVjdC5rZXlzKHRoaXMuZGF0YSkubGVuZ3RoKSB7XG4gICAgdGhpcy5kYXRhID0ge307XG4gICAgdGhpcy50dGxEYXRhID0ge307XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuLyoqXG4gKiBAbG9jdXMgQ2xpZW50XG4gKiBAbWVtYmVyT2YgSlNTdG9yYWdlXG4gKiBAbmFtZSBpc1N1cHBvcnRlZFxuICogQHN1bW1hcnkgUmV0dXJucyBgdHJ1ZWAgaXMgdGhpcyBzdG9yYWdlIGRyaXZlciBpcyBzdXBwb3J0ZWRcbiAqIEByZXR1cm5zIHtCb29sZWFufVxuICovXG5KU1N0b3JhZ2UuaXNTdXBwb3J0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0cnVlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBKU1N0b3JhZ2U7XG4iXX0=
