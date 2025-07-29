(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var check = Package.check.check;
var Match = Package.check.Match;
var ReactiveVar = Package['reactive-var'].ReactiveVar;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"ostrio:i18n":{"i18n.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ostrio_i18n/i18n.js                                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => I18N
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 0);
let ReactiveVar;
module.link("meteor/reactive-var", {
  ReactiveVar(v) {
    ReactiveVar = v;
  }
}, 1);
let check, Match;
module.link("meteor/check", {
  check(v) {
    check = v;
  },
  Match(v) {
    Match = v;
  }
}, 2);
let ClientStorage;
module.link("meteor/ostrio:cstorage", {
  ClientStorage(v) {
    ClientStorage = v;
  }
}, 3);
const clientStorage = new ClientStorage();
const isObject = obj => {
  if (!obj) {
    return false;
  }
  return Object.prototype.toString.call(obj) === '[object Object]';
};

/**
 * @private
 * @locus Anywhere
 * @name toDottedString
 * @summary Convert object nested keys into dotted string
 */
const toDottedString = function (obj) {
  let prepend = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  let final = {};
  let newKey = '';
  for (let key in obj) {
    if (prepend) {
      newKey = "".concat(prepend, ".").concat(key);
    } else {
      newKey = key;
    }
    if (typeof obj[key] === 'function' || typeof obj[key] === 'string') {
      final[newKey] = obj[key];
    } else {
      final = Object.assign({}, final, toDottedString.call(this, obj[key], newKey));
    }
  }
  return final;
};
const _allowedDataTypes = ['string', 'number'];
/**
 * @private
 * @locus Anywhere
 * @name proceedPlaceholders
 * @summary Replace placeholders with replacements in l10n strings
 */
const proceedPlaceholders = function (_string, replacements) {
  let string = _string;
  if (string) {
    let key;
    for (let replacement of replacements) {
      if (replacement && replacement.hash && isObject(replacement.hash)) {
        for (key in replacement.hash) {
          if (_allowedDataTypes.includes(typeof replacement.hash[key])) {
            string = string.replace(new RegExp("{{(s)*(".concat(key, ")+(s)*}}"), 'ig'), replacement.hash[key]);
          }
        }
      } else if (isObject(replacement)) {
        for (key in replacement) {
          if (_allowedDataTypes.includes(typeof replacement[key])) {
            string = string.replace(new RegExp("{{(s)*(".concat(key, ")+(s)*}}"), 'ig'), replacement[key]);
          }
        }
      } else if (_allowedDataTypes.includes(typeof replacement)) {
        string = string.replace(/\{\{(\s)*([A-z])+(\s)*\}\}/i, replacement);
      }
    }
  }
  return string;
};
class I18N {
  /**
   * @locus Anywhere
   * @name I18N
   * @constructor
   * @summary Initialize I18N object with `config`
   * @param config                    {Object}
   * @param config.i18n               {Object}  - Internalization object
   * @param config.returnKey          {Boolean} - Return key if l10n value not found
   * @param config.helperName         {String}  - Template main i18n helper name
   * @param config.helperSettingsName {String}  - Template i18nSettings helper name
   */
  constructor() {
    let config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    check(config, Object);
    let key;
    const self = this;
    this.returnKey = config.returnKey || true;
    this.helperName = config.helperName === null ? null : config.helperName || 'i18n';
    this.currentLocale = new ReactiveVar(void 0);
    this.helperSettingsName = config.helperSettingsName === null ? null : config.helperSettingsName || 'i18nSettings';
    check(this.returnKey, Boolean);
    check(this.helperName, Match.OneOf(String, null));
    check(this.helperSettingsName, Match.OneOf(String, null));
    check(config.i18n, Object);
    this.locales = [];
    this.strings = {};
    this.addl10n(config.i18n);
    if (isObject(config.i18n)) {
      check(config.i18n.settings, Object);
      this.settings = config.i18n.settings;
      this.defaultLocale = this.settings.defaultLocale;
      check(this.defaultLocale, String);
      this.strings['__settings.__langSet__'] = [];
      this.strings['__settings.__langConfig__'] = [];
      const dotted = toDottedString.call(this, this.settings, '__settings');
      for (key in dotted) {
        if (typeof dotted[key] === 'string') {
          this.strings[key] = dotted[key];
        }
      }
      for (key in this.settings) {
        var _this$settings$key;
        if ((_this$settings$key = this.settings[key]) !== null && _this$settings$key !== void 0 && _this$settings$key.code) {
          this.locales.push(key);
          this.strings['__settings.__langSet__'].push(this.settings[key].code);
          this.strings['__settings.__langConfig__'].push(this.settings[key]);
        }
      }
    }
    this.userLocale = Meteor.isClient ? window.navigator.userLanguage || window.navigator.language || navigator.userLanguage : this.settings.defaultLocale;
    if (Meteor.isClient) {
      if (typeof Template !== 'undefined' && Template !== null) {
        if (this.helperName !== null) {
          /**
           * @summary Main `i18n` template helper
           */
          Template.registerHelper(this.helperName, function () {
            return self.get.apply(self, arguments);
          });
        }
        if (this.helperSettingsName !== null) {
          /**
           * @summary Settings `i18n` template helper, might be used to build language switcher (see demo folder).
           */
          Template.registerHelper(this.helperSettingsName, function () {
            return self.getSetting.apply(self, arguments);
          });
        }
      }
      const savedLocale = clientStorage.get('___i18n.locale___');
      if (!this.currentLocale.get()) {
        if (!savedLocale) {
          for (let lang of this.strings['__settings.__langConfig__']) {
            if (lang.code === this.userLocale || lang.isoCode === this.userLocale) {
              this.currentLocale.set(lang.code);
              clientStorage.set('___i18n.locale___', lang.code);
              break;
            }
          }
        } else {
          if (this.strings['__settings.__langSet__'].includes(savedLocale)) {
            this.currentLocale.set(savedLocale);
          } else {
            this.currentLocale.set(this.defaultLocale);
            clientStorage.set('___i18n.locale___', this.defaultLocale);
          }
        }
      }
    } else {
      this.defaultLocale = this.settings.defaultLocale;
      this.currentLocale.set(this.defaultLocale);
    }
    if (!this.currentLocale.get()) {
      this.currentLocale.set(this.defaultLocale);
      clientStorage.set('___i18n.locale___', this.defaultLocale);
    }
  }

  /**
   * @locus Anywhere
   * @memberOf I18N
   * @name get
   * @summary Get l10n value by key
   * @param locale       {String} - [Optional] Two-letter locale string
   * @param key          {String} - l10n key like: `folder.file.object.key`
   * @param replacements... {String|[String]|Object} - [Optional] Replacements for placeholders in l10n string
   */
  get() {
    let key;
    let lang;
    let replacements;
    for (var _len = arguments.length, args = new Array(_len), _key2 = 0; _key2 < _len; _key2++) {
      args[_key2] = arguments[_key2];
    }
    if (!args.length || !args[0] || typeof args[0] !== 'string') {
      return '';
    }
    if (!!~this.locales.indexOf(args[0])) {
      lang = args[0];
      key = args[1];
      replacements = args.slice(2);
    } else {
      lang = this.currentLocale.get() || this.defaultLocale || 'en';
      key = args[0];
      replacements = args.slice(1);
    }
    if (lang) {
      var _replacements, _replacements$;
      const _key = "".concat(lang, ".").concat(key);
      let result = (this.strings && this.strings[_key] ? this.strings[_key] : undefined) || (this.returnKey ? _key : '');
      if (typeof result === 'function') {
        result = result.call(this);
      }
      if (result !== _key && result && result.length && Object.keys(((_replacements = replacements) === null || _replacements === void 0 ? void 0 : (_replacements$ = _replacements[0]) === null || _replacements$ === void 0 ? void 0 : _replacements$.hash) || replacements).length) {
        result = proceedPlaceholders(result, replacements);
      }
      return result;
    }
    return this.returnKey ? key : '';
  }

  /**
   * @locus Anywhere
   * @memberOf I18N
   * @name has
   * @summary Check if key exists in current locale
   * @param locale       {String} - [Optional] Two-letter locale string
   * @param key          {String} - l10n key like: `folder.file.object.key`
   */
  has() {
    let key;
    let lang;
    if (!arguments.length || !(arguments.length <= 0 ? undefined : arguments[0])) {
      return '';
    }
    if (this.locales.includes(arguments.length <= 0 ? undefined : arguments[0])) {
      lang = arguments.length <= 0 ? undefined : arguments[0];
      key = arguments.length <= 1 ? undefined : arguments[1];
    } else {
      lang = this.currentLocale.get() || this.defaultLocale || 'en';
      key = arguments.length <= 0 ? undefined : arguments[0];
    }
    if (lang) {
      var _this$strings;
      key = "".concat(lang, ".").concat(key);
      return !!((_this$strings = this.strings) !== null && _this$strings !== void 0 && _this$strings[key] ? this.strings[key] : undefined);
    }
    return false;
  }

  /**
   * @locus Anywhere
   * @memberOf I18N
   * @name setLocale
   * @summary Set another locale
   * @param locale {String} - Two-letter locale string
   */
  setLocale(locale) {
    check(locale, String);
    if (this.settings && this.settings[locale]) {
      this.currentLocale.set(locale);
      if (Meteor.isClient) {
        clientStorage.set('___i18n.locale___', locale);
      }
    } else {
      throw new Meteor.Error(404, "No such locale: \"".concat(locale, "\""));
    }
    return this;
  }

  /**
   * @locus Anywhere
   * @memberOf I18N
   * @name getSetting
   * @summary Get parsed data by key from i18n.json file
   * @param key {String} - One of the keys: 'current', 'all', 'other', 'locales'
   */
  getSetting(key) {
    check(key, Match.Optional(Match.OneOf('current', 'all', 'other', 'locales', 'currentISO', 'currentName')));
    if (key) {
      return this.langugeSet()[key] || undefined;
    }
    return this.langugeSet();
  }

  /**
   * @locus Anywhere
   * @memberOf I18N
   * @name langugeSet
   * @summary Get data from i18n config
   */
  langugeSet() {
    let key;
    const locale = this.currentLocale.get();
    return {
      current: locale,
      currentISO: this.settings[locale].isoCode,
      currentName: this.settings[locale].name,
      all: (() => {
        const result = [];
        for (key in this.settings) {
          if (isObject(this.settings[key])) {
            result.push(this.settings[key]);
          }
        }
        return result;
      })(),
      other: (() => {
        const result = [];
        for (key in this.settings) {
          if (isObject(this.settings[key]) && key !== locale) {
            result.push(this.settings[key]);
          }
        }
        return result;
      })(),
      locales: (() => {
        const result = [];
        for (key in this.settings) {
          if (isObject(this.settings[key])) {
            result.push(this.settings[key].code);
          }
        }
        return result;
      })()
    };
  }

  /**
   * @locus Anywhere
   * @memberOf I18N
   * @name addl10n
   * @summary add l10n data
   * @example { en: { newKey: "new data" } }
   */
  addl10n(l10n) {
    check(l10n, Object);
    let k;
    let key;
    let object;
    for (key in l10n) {
      if (key !== 'settings') {
        object = toDottedString.call(this, l10n[key], key);
        for (k in object) {
          if (typeof object[k] === 'string') {
            this.strings[k] = object[k];
          }
        }
      }
    }
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/ostrio:i18n/i18n.js");

/* Exports */
Package._define("ostrio:i18n", exports);

})();

//# sourceURL=meteor://💻app/packages/ostrio_i18n.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvb3N0cmlvOmkxOG4vaTE4bi5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJkZWZhdWx0IiwiSTE4TiIsIk1ldGVvciIsImxpbmsiLCJ2IiwiUmVhY3RpdmVWYXIiLCJjaGVjayIsIk1hdGNoIiwiQ2xpZW50U3RvcmFnZSIsImNsaWVudFN0b3JhZ2UiLCJpc09iamVjdCIsIm9iaiIsIk9iamVjdCIsInByb3RvdHlwZSIsInRvU3RyaW5nIiwiY2FsbCIsInRvRG90dGVkU3RyaW5nIiwicHJlcGVuZCIsImFyZ3VtZW50cyIsImxlbmd0aCIsInVuZGVmaW5lZCIsImZpbmFsIiwibmV3S2V5Iiwia2V5IiwiY29uY2F0IiwiYXNzaWduIiwiX2FsbG93ZWREYXRhVHlwZXMiLCJwcm9jZWVkUGxhY2Vob2xkZXJzIiwiX3N0cmluZyIsInJlcGxhY2VtZW50cyIsInN0cmluZyIsInJlcGxhY2VtZW50IiwiaGFzaCIsImluY2x1ZGVzIiwicmVwbGFjZSIsIlJlZ0V4cCIsImNvbnN0cnVjdG9yIiwiY29uZmlnIiwic2VsZiIsInJldHVybktleSIsImhlbHBlck5hbWUiLCJjdXJyZW50TG9jYWxlIiwiaGVscGVyU2V0dGluZ3NOYW1lIiwiQm9vbGVhbiIsIk9uZU9mIiwiU3RyaW5nIiwiaTE4biIsImxvY2FsZXMiLCJzdHJpbmdzIiwiYWRkbDEwbiIsInNldHRpbmdzIiwiZGVmYXVsdExvY2FsZSIsImRvdHRlZCIsIl90aGlzJHNldHRpbmdzJGtleSIsImNvZGUiLCJwdXNoIiwidXNlckxvY2FsZSIsImlzQ2xpZW50Iiwid2luZG93IiwibmF2aWdhdG9yIiwidXNlckxhbmd1YWdlIiwibGFuZ3VhZ2UiLCJUZW1wbGF0ZSIsInJlZ2lzdGVySGVscGVyIiwiZ2V0IiwiYXBwbHkiLCJnZXRTZXR0aW5nIiwic2F2ZWRMb2NhbGUiLCJsYW5nIiwiaXNvQ29kZSIsInNldCIsIl9sZW4iLCJhcmdzIiwiQXJyYXkiLCJfa2V5MiIsImluZGV4T2YiLCJzbGljZSIsIl9yZXBsYWNlbWVudHMiLCJfcmVwbGFjZW1lbnRzJCIsIl9rZXkiLCJyZXN1bHQiLCJrZXlzIiwiaGFzIiwiX3RoaXMkc3RyaW5ncyIsInNldExvY2FsZSIsImxvY2FsZSIsIkVycm9yIiwiT3B0aW9uYWwiLCJsYW5ndWdlU2V0IiwiY3VycmVudCIsImN1cnJlbnRJU08iLCJjdXJyZW50TmFtZSIsIm5hbWUiLCJhbGwiLCJvdGhlciIsImwxMG4iLCJrIiwib2JqZWN0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsTUFBTSxDQUFDQyxNQUFNLENBQUM7RUFBQ0MsT0FBTyxFQUFDQSxDQUFBLEtBQUlDO0FBQUksQ0FBQyxDQUFDO0FBQUMsSUFBSUMsTUFBTTtBQUFDSixNQUFNLENBQUNLLElBQUksQ0FBQyxlQUFlLEVBQUM7RUFBQ0QsTUFBTUEsQ0FBQ0UsQ0FBQyxFQUFDO0lBQUNGLE1BQU0sR0FBQ0UsQ0FBQztFQUFBO0FBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztBQUFDLElBQUlDLFdBQVc7QUFBQ1AsTUFBTSxDQUFDSyxJQUFJLENBQUMscUJBQXFCLEVBQUM7RUFBQ0UsV0FBV0EsQ0FBQ0QsQ0FBQyxFQUFDO0lBQUNDLFdBQVcsR0FBQ0QsQ0FBQztFQUFBO0FBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztBQUFDLElBQUlFLEtBQUssRUFBQ0MsS0FBSztBQUFDVCxNQUFNLENBQUNLLElBQUksQ0FBQyxjQUFjLEVBQUM7RUFBQ0csS0FBS0EsQ0FBQ0YsQ0FBQyxFQUFDO0lBQUNFLEtBQUssR0FBQ0YsQ0FBQztFQUFBLENBQUM7RUFBQ0csS0FBS0EsQ0FBQ0gsQ0FBQyxFQUFDO0lBQUNHLEtBQUssR0FBQ0gsQ0FBQztFQUFBO0FBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztBQUFDLElBQUlJLGFBQWE7QUFBQ1YsTUFBTSxDQUFDSyxJQUFJLENBQUMsd0JBQXdCLEVBQUM7RUFBQ0ssYUFBYUEsQ0FBQ0osQ0FBQyxFQUFDO0lBQUNJLGFBQWEs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bnRlbnQiOlsiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBSZWFjdGl2ZVZhciB9IGZyb20gJ21ldGVvci9yZWFjdGl2ZS12YXInO1xuaW1wb3J0IHsgY2hlY2ssIE1hdGNoIH0gZnJvbSAnbWV0ZW9yL2NoZWNrJztcbmltcG9ydCB7IENsaWVudFN0b3JhZ2UgfSBmcm9tICdtZXRlb3Ivb3N0cmlvOmNzdG9yYWdlJztcblxuY29uc3QgY2xpZW50U3RvcmFnZSA9IG5ldyBDbGllbnRTdG9yYWdlKCk7XG5jb25zdCBpc09iamVjdCA9IChvYmopID0+IHtcbiAgaWYgKCFvYmopIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IE9iamVjdF0nO1xufTtcblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogQGxvY3VzIEFueXdoZXJlXG4gKiBAbmFtZSB0b0RvdHRlZFN0cmluZ1xuICogQHN1bW1hcnkgQ29udmVydCBvYmplY3QgbmVzdGVkIGtleXMgaW50byBkb3R0ZWQgc3RyaW5nXG4gKi9cbmNvbnN0IHRvRG90dGVkU3RyaW5nID0gZnVuY3Rpb24gKG9iaiwgcHJlcGVuZCA9IGZhbHNlKSB7XG4gIGxldCBmaW5hbCA9IHt9O1xuICBsZXQgbmV3S2V5ID0gJyc7XG4gIGZvciAobGV0IGtleSBpbiBvYmopIHtcbiAgICBpZiAocHJlcGVuZCkge1xuICAgICAgbmV3S2V5ID0gYCR7cHJlcGVuZH0uJHtrZXl9YDtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV3S2V5ID0ga2V5O1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb2JqW2tleV0gPT09ICdmdW5jdGlvbicgfHwgdHlwZW9mIG9ialtrZXldID09PSAnc3RyaW5nJykge1xuICAgICAgZmluYWxbbmV3S2V5XSA9IG9ialtrZXldO1xuICAgIH0gZWxzZSB7XG4gICAgICBmaW5hbCA9IE9iamVjdC5hc3NpZ24oe30sIGZpbmFsLCB0b0RvdHRlZFN0cmluZy5jYWxsKHRoaXMsIG9ialtrZXldLCBuZXdLZXkpKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZpbmFsO1xufTtcblxuY29uc3QgX2FsbG93ZWREYXRhVHlwZXMgPSBbJ3N0cmluZycsICdudW1iZXInXTtcbi8qKlxuICogQHByaXZhdGVcbiAqIEBsb2N1cyBBbnl3aGVyZVxuICogQG5hbWUgcHJvY2VlZFBsYWNlaG9sZGVyc1xuICogQHN1bW1hcnkgUmVwbGFjZSBwbGFjZWhvbGRlcnMgd2l0aCByZXBsYWNlbWVudHMgaW4gbDEwbiBzdHJpbmdzXG4gKi9cbmNvbnN0IHByb2NlZWRQbGFjZWhvbGRlcnMgPSBmdW5jdGlvbiAoX3N0cmluZywgcmVwbGFjZW1lbnRzKSB7XG4gIGxldCBzdHJpbmcgPSBfc3RyaW5nO1xuICBpZiAoc3RyaW5nKSB7XG4gICAgbGV0IGtleTtcbiAgICBmb3IgKGxldCByZXBsYWNlbWVudCBvZiByZXBsYWNlbWVudHMpIHtcbiAgICAgIGlmIChyZXBsYWNlbWVudCAmJiByZXBsYWNlbWVudC5oYXNoICYmIGlzT2JqZWN0KHJlcGxhY2VtZW50Lmhhc2gpKSB7XG4gICAgICAgIGZvciAoa2V5IGluIHJlcGxhY2VtZW50Lmhhc2gpIHtcbiAgICAgICAgICBpZiAoX2FsbG93ZWREYXRhVHlwZXMuaW5jbHVkZXModHlwZW9mIHJlcGxhY2VtZW50Lmhhc2hba2V5XSkpIHtcbiAgICAgICAgICAgIHN0cmluZyA9IHN0cmluZy5yZXBsYWNlKG5ldyBSZWdFeHAoYFxce1xceyhcXHMpKigke2tleX0pKyhcXHMpKlxcfVxcfWAsICdpZycpLCByZXBsYWNlbWVudC5oYXNoW2tleV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChpc09iamVjdChyZXBsYWNlbWVudCkpIHtcbiAgICAgICAgZm9yIChrZXkgaW4gcmVwbGFjZW1lbnQpIHtcbiAgICAgICAgICBpZiAoX2FsbG93ZWREYXRhVHlwZXMuaW5jbHVkZXModHlwZW9mIHJlcGxhY2VtZW50W2tleV0pKSB7XG4gICAgICAgICAgICBzdHJpbmcgPSBzdHJpbmcucmVwbGFjZShuZXcgUmVnRXhwKGBcXHtcXHsoXFxzKSooJHtrZXl9KSsoXFxzKSpcXH1cXH1gLCAnaWcnKSwgcmVwbGFjZW1lbnRba2V5XSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKF9hbGxvd2VkRGF0YVR5cGVzLmluY2x1ZGVzKHR5cGVvZiByZXBsYWNlbWVudCkpIHtcbiAgICAgICAgc3RyaW5nID0gc3RyaW5nLnJlcGxhY2UoL1xce1xceyhcXHMpKihbQS16XSkrKFxccykqXFx9XFx9L2ksIHJlcGxhY2VtZW50KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gc3RyaW5nO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSTE4TiB7XG4gIC8qKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG5hbWUgSTE4TlxuICAgKiBAY29uc3RydWN0b3JcbiAgICogQHN1bW1hcnkgSW5pdGlhbGl6ZSBJMThOIG9iamVjdCB3aXRoIGBjb25maWdgXG4gICAqIEBwYXJhbSBjb25maWcgICAgICAgICAgICAgICAgICAgIHtPYmplY3R9XG4gICAqIEBwYXJhbSBjb25maWcuaTE4biAgICAgICAgICAgICAgIHtPYmplY3R9ICAtIEludGVybmFsaXphdGlvbiBvYmplY3RcbiAgICogQHBhcmFtIGNvbmZpZy5yZXR1cm5LZXkgICAgICAgICAge0Jvb2xlYW59IC0gUmV0dXJuIGtleSBpZiBsMTBuIHZhbHVlIG5vdCBmb3VuZFxuICAgKiBAcGFyYW0gY29uZmlnLmhlbHBlck5hbWUgICAgICAgICB7U3RyaW5nfSAgLSBUZW1wbGF0ZSBtYWluIGkxOG4gaGVscGVyIG5hbWVcbiAgICogQHBhcmFtIGNvbmZpZy5oZWxwZXJTZXR0aW5nc05hbWUge1N0cmluZ30gIC0gVGVtcGxhdGUgaTE4blNldHRpbmdzIGhlbHBlciBuYW1lXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihjb25maWcgPSB7fSkge1xuICAgIGNoZWNrKGNvbmZpZywgT2JqZWN0KTtcblxuICAgIGxldCBrZXk7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5yZXR1cm5LZXkgPSBjb25maWcucmV0dXJuS2V5IHx8IHRydWU7XG4gICAgdGhpcy5oZWxwZXJOYW1lID0gY29uZmlnLmhlbHBlck5hbWUgPT09IG51bGxcbiAgICAgICAgPyBudWxsXG4gICAgICAgIDogY29uZmlnLmhlbHBlck5hbWUgfHwgJ2kxOG4nO1xuICAgIHRoaXMuY3VycmVudExvY2FsZSA9IG5ldyBSZWFjdGl2ZVZhcih2b2lkIDApO1xuICAgIHRoaXMuaGVscGVyU2V0dGluZ3NOYW1lID0gY29uZmlnLmhlbHBlclNldHRpbmdzTmFtZSA9PT0gbnVsbFxuICAgICAgPyBudWxsXG4gICAgICA6IGNvbmZpZy5oZWxwZXJTZXR0aW5nc05hbWUgfHwgJ2kxOG5TZXR0aW5ncyc7XG5cbiAgICBjaGVjayh0aGlzLnJldHVybktleSwgQm9vbGVhbik7XG4gICAgY2hlY2sodGhpcy5oZWxwZXJOYW1lLCBNYXRjaC5PbmVPZihTdHJpbmcsIG51bGwpKTtcbiAgICBjaGVjayh0aGlzLmhlbHBlclNldHRpbmdzTmFtZSwgTWF0Y2guT25lT2YoU3RyaW5nLCBudWxsKSk7XG4gICAgY2hlY2soY29uZmlnLmkxOG4sIE9iamVjdCk7XG5cbiAgICB0aGlzLmxvY2FsZXMgPSBbXTtcbiAgICB0aGlzLnN0cmluZ3MgPSB7fTtcblxuICAgIHRoaXMuYWRkbDEwbihjb25maWcuaTE4bik7XG5cbiAgICBpZiAoaXNPYmplY3QoY29uZmlnLmkxOG4pKSB7XG4gICAgICBjaGVjayhjb25maWcuaTE4bi5zZXR0aW5ncywgT2JqZWN0KTtcbiAgICAgIHRoaXMuc2V0dGluZ3MgPSBjb25maWcuaTE4bi5zZXR0aW5ncztcbiAgICAgIHRoaXMuZGVmYXVsdExvY2FsZSA9IHRoaXMuc2V0dGluZ3MuZGVmYXVsdExvY2FsZTtcbiAgICAgIGNoZWNrKHRoaXMuZGVmYXVsdExvY2FsZSwgU3RyaW5nKTtcbiAgICAgIHRoaXMuc3RyaW5nc1snX19zZXR0aW5ncy5fX2xhbmdTZXRfXyddID0gW107XG4gICAgICB0aGlzLnN0cmluZ3NbJ19fc2V0dGluZ3MuX19sYW5nQ29uZmlnX18nXSA9IFtdO1xuICAgICAgY29uc3QgZG90dGVkID0gdG9Eb3R0ZWRTdHJpbmcuY2FsbCh0aGlzLCB0aGlzLnNldHRpbmdzLCAnX19zZXR0aW5ncycpO1xuXG4gICAgICBmb3IgKGtleSBpbiBkb3R0ZWQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBkb3R0ZWRba2V5XSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICB0aGlzLnN0cmluZ3Nba2V5XSA9IGRvdHRlZFtrZXldO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZvciAoa2V5IGluIHRoaXMuc2V0dGluZ3MpIHtcbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3Nba2V5XT8uY29kZSkge1xuICAgICAgICAgIHRoaXMubG9jYWxlcy5wdXNoKGtleSk7XG4gICAgICAgICAgdGhpcy5zdHJpbmdzWydfX3NldHRpbmdzLl9fbGFuZ1NldF9fJ10ucHVzaCh0aGlzLnNldHRpbmdzW2tleV0uY29kZSk7XG4gICAgICAgICAgdGhpcy5zdHJpbmdzWydfX3NldHRpbmdzLl9fbGFuZ0NvbmZpZ19fJ10ucHVzaCh0aGlzLnNldHRpbmdzW2tleV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy51c2VyTG9jYWxlID0gKChNZXRlb3IuaXNDbGllbnQpID8gd2luZG93Lm5hdmlnYXRvci51c2VyTGFuZ3VhZ2UgfHwgd2luZG93Lm5hdmlnYXRvci5sYW5ndWFnZSB8fCBuYXZpZ2F0b3IudXNlckxhbmd1YWdlIDogdGhpcy5zZXR0aW5ncy5kZWZhdWx0TG9jYWxlKTtcblxuICAgIGlmIChNZXRlb3IuaXNDbGllbnQpIHtcbiAgICAgIGlmICh0eXBlb2YgVGVtcGxhdGUgIT09ICd1bmRlZmluZWQnICYmIFRlbXBsYXRlICE9PSBudWxsKSB7XG4gICAgICAgIGlmICh0aGlzLmhlbHBlck5hbWUgIT09IG51bGwpIHtcbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBAc3VtbWFyeSBNYWluIGBpMThuYCB0ZW1wbGF0ZSBoZWxwZXJcbiAgICAgICAgICAgKi9cbiAgICAgICAgICBUZW1wbGF0ZS5yZWdpc3RlckhlbHBlcih0aGlzLmhlbHBlck5hbWUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBzZWxmLmdldC5hcHBseShzZWxmLCBhcmd1bWVudHMpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuaGVscGVyU2V0dGluZ3NOYW1lICE9PSBudWxsKSB7XG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogQHN1bW1hcnkgU2V0dGluZ3MgYGkxOG5gIHRlbXBsYXRlIGhlbHBlciwgbWlnaHQgYmUgdXNlZCB0byBidWlsZCBsYW5ndWFnZSBzd2l0Y2hlciAoc2VlIGRlbW8gZm9sZGVyKS5cbiAgICAgICAgICAgKi9cbiAgICAgICAgICBUZW1wbGF0ZS5yZWdpc3RlckhlbHBlcih0aGlzLmhlbHBlclNldHRpbmdzTmFtZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHNlbGYuZ2V0U2V0dGluZy5hcHBseShzZWxmLCBhcmd1bWVudHMpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNhdmVkTG9jYWxlID0gY2xpZW50U3RvcmFnZS5nZXQoJ19fX2kxOG4ubG9jYWxlX19fJyk7XG4gICAgICBpZiAoIXRoaXMuY3VycmVudExvY2FsZS5nZXQoKSkge1xuICAgICAgICBpZiAoIXNhdmVkTG9jYWxlKSB7XG4gICAgICAgICAgZm9yIChsZXQgbGFuZyBvZiB0aGlzLnN0cmluZ3NbJ19fc2V0dGluZ3MuX19sYW5nQ29uZmlnX18nXSkge1xuICAgICAgICAgICAgaWYgKGxhbmcuY29kZSA9PT0gdGhpcy51c2VyTG9jYWxlIHx8IGxhbmcuaXNvQ29kZSA9PT0gdGhpcy51c2VyTG9jYWxlKSB7XG4gICAgICAgICAgICAgIHRoaXMuY3VycmVudExvY2FsZS5zZXQobGFuZy5jb2RlKTtcbiAgICAgICAgICAgICAgY2xpZW50U3RvcmFnZS5zZXQoJ19fX2kxOG4ubG9jYWxlX19fJywgbGFuZy5jb2RlKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh0aGlzLnN0cmluZ3NbJ19fc2V0dGluZ3MuX19sYW5nU2V0X18nXS5pbmNsdWRlcyhzYXZlZExvY2FsZSkpIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudExvY2FsZS5zZXQoc2F2ZWRMb2NhbGUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRMb2NhbGUuc2V0KHRoaXMuZGVmYXVsdExvY2FsZSk7XG4gICAgICAgICAgICBjbGllbnRTdG9yYWdlLnNldCgnX19faTE4bi5sb2NhbGVfX18nLCB0aGlzLmRlZmF1bHRMb2NhbGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRlZmF1bHRMb2NhbGUgPSB0aGlzLnNldHRpbmdzLmRlZmF1bHRMb2NhbGU7XG4gICAgICB0aGlzLmN1cnJlbnRMb2NhbGUuc2V0KHRoaXMuZGVmYXVsdExvY2FsZSk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmN1cnJlbnRMb2NhbGUuZ2V0KCkpIHtcbiAgICAgIHRoaXMuY3VycmVudExvY2FsZS5zZXQodGhpcy5kZWZhdWx0TG9jYWxlKTtcbiAgICAgIGNsaWVudFN0b3JhZ2Uuc2V0KCdfX19pMThuLmxvY2FsZV9fXycsIHRoaXMuZGVmYXVsdExvY2FsZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyT2YgSTE4TlxuICAgKiBAbmFtZSBnZXRcbiAgICogQHN1bW1hcnkgR2V0IGwxMG4gdmFsdWUgYnkga2V5XG4gICAqIEBwYXJhbSBsb2NhbGUgICAgICAge1N0cmluZ30gLSBbT3B0aW9uYWxdIFR3by1sZXR0ZXIgbG9jYWxlIHN0cmluZ1xuICAgKiBAcGFyYW0ga2V5ICAgICAgICAgIHtTdHJpbmd9IC0gbDEwbiBrZXkgbGlrZTogYGZvbGRlci5maWxlLm9iamVjdC5rZXlgXG4gICAqIEBwYXJhbSByZXBsYWNlbWVudHMuLi4ge1N0cmluZ3xbU3RyaW5nXXxPYmplY3R9IC0gW09wdGlvbmFsXSBSZXBsYWNlbWVudHMgZm9yIHBsYWNlaG9sZGVycyBpbiBsMTBuIHN0cmluZ1xuICAgKi9cbiAgZ2V0KC4uLmFyZ3MpIHtcbiAgICBsZXQga2V5O1xuICAgIGxldCBsYW5nO1xuICAgIGxldCByZXBsYWNlbWVudHM7XG5cbiAgICBpZiAoIWFyZ3MubGVuZ3RoIHx8ICFhcmdzWzBdIHx8IHR5cGVvZiBhcmdzWzBdICE9PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cblxuICAgIGlmICghIX50aGlzLmxvY2FsZXMuaW5kZXhPZihhcmdzWzBdKSkge1xuICAgICAgbGFuZyA9IGFyZ3NbMF07XG4gICAgICBrZXkgPSBhcmdzWzFdO1xuICAgICAgcmVwbGFjZW1lbnRzID0gYXJncy5zbGljZSgyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGFuZyA9IHRoaXMuY3VycmVudExvY2FsZS5nZXQoKSB8fCB0aGlzLmRlZmF1bHRMb2NhbGUgfHwgJ2VuJztcbiAgICAgIGtleSA9IGFyZ3NbMF07XG4gICAgICByZXBsYWNlbWVudHMgPSBhcmdzLnNsaWNlKDEpO1xuICAgIH1cblxuICAgIGlmIChsYW5nKSB7XG4gICAgICBjb25zdCBfa2V5ID0gYCR7bGFuZ30uJHtrZXl9YDtcbiAgICAgIGxldCByZXN1bHQgPSAodGhpcy5zdHJpbmdzICYmIHRoaXMuc3RyaW5nc1tfa2V5XSA/IHRoaXMuc3RyaW5nc1tfa2V5XSA6IHVuZGVmaW5lZCkgfHwgKHRoaXMucmV0dXJuS2V5ID8gX2tleSA6ICcnKTtcblxuICAgICAgaWYgKHR5cGVvZiByZXN1bHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNhbGwodGhpcyk7XG4gICAgICB9XG5cbiAgICAgIGlmICgocmVzdWx0ICE9PSBfa2V5KSAmJiByZXN1bHQgJiYgcmVzdWx0Lmxlbmd0aCAmJiBPYmplY3Qua2V5cyhyZXBsYWNlbWVudHM/LlswXT8uaGFzaCB8fCByZXBsYWNlbWVudHMpLmxlbmd0aCkge1xuICAgICAgICByZXN1bHQgPSBwcm9jZWVkUGxhY2Vob2xkZXJzKHJlc3VsdCwgcmVwbGFjZW1lbnRzKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5yZXR1cm5LZXkgPyBrZXkgOiAnJztcbiAgfVxuXG4gIC8qKlxuICAgKiBAbG9jdXMgQW55d2hlcmVcbiAgICogQG1lbWJlck9mIEkxOE5cbiAgICogQG5hbWUgaGFzXG4gICAqIEBzdW1tYXJ5IENoZWNrIGlmIGtleSBleGlzdHMgaW4gY3VycmVudCBsb2NhbGVcbiAgICogQHBhcmFtIGxvY2FsZSAgICAgICB7U3RyaW5nfSAtIFtPcHRpb25hbF0gVHdvLWxldHRlciBsb2NhbGUgc3RyaW5nXG4gICAqIEBwYXJhbSBrZXkgICAgICAgICAge1N0cmluZ30gLSBsMTBuIGtleSBsaWtlOiBgZm9sZGVyLmZpbGUub2JqZWN0LmtleWBcbiAgICovXG4gIGhhcyguLi5hcmdzKSB7XG4gICAgbGV0IGtleTtcbiAgICBsZXQgbGFuZztcblxuICAgIGlmICghYXJncy5sZW5ndGggfHwgIWFyZ3NbMF0pIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG5cbiAgICBpZiAodGhpcy5sb2NhbGVzLmluY2x1ZGVzKGFyZ3NbMF0pKSB7XG4gICAgICBsYW5nID0gYXJnc1swXTtcbiAgICAgIGtleSA9IGFyZ3NbMV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxhbmcgPSB0aGlzLmN1cnJlbnRMb2NhbGUuZ2V0KCkgfHwgdGhpcy5kZWZhdWx0TG9jYWxlIHx8ICdlbic7XG4gICAgICBrZXkgPSBhcmdzWzBdO1xuICAgIH1cblxuICAgIGlmIChsYW5nKSB7XG4gICAgICBrZXkgPSBgJHtsYW5nfS4ke2tleX1gO1xuICAgICAgcmV0dXJuICEhKHRoaXMuc3RyaW5ncz8uW2tleV0gPyB0aGlzLnN0cmluZ3Nba2V5XSA6IHVuZGVmaW5lZCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyT2YgSTE4TlxuICAgKiBAbmFtZSBzZXRMb2NhbGVcbiAgICogQHN1bW1hcnkgU2V0IGFub3RoZXIgbG9jYWxlXG4gICAqIEBwYXJhbSBsb2NhbGUge1N0cmluZ30gLSBUd28tbGV0dGVyIGxvY2FsZSBzdHJpbmdcbiAgICovXG4gIHNldExvY2FsZShsb2NhbGUpIHtcbiAgICBjaGVjayhsb2NhbGUsIFN0cmluZyk7XG5cbiAgICBpZiAodGhpcy5zZXR0aW5ncyAmJiB0aGlzLnNldHRpbmdzW2xvY2FsZV0pIHtcbiAgICAgIHRoaXMuY3VycmVudExvY2FsZS5zZXQobG9jYWxlKTtcbiAgICAgIGlmIChNZXRlb3IuaXNDbGllbnQpIHtcbiAgICAgICAgY2xpZW50U3RvcmFnZS5zZXQoJ19fX2kxOG4ubG9jYWxlX19fJywgbG9jYWxlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDQsIGBObyBzdWNoIGxvY2FsZTogXFxcIiR7bG9jYWxlfVxcXCJgKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBJMThOXG4gICAqIEBuYW1lIGdldFNldHRpbmdcbiAgICogQHN1bW1hcnkgR2V0IHBhcnNlZCBkYXRhIGJ5IGtleSBmcm9tIGkxOG4uanNvbiBmaWxlXG4gICAqIEBwYXJhbSBrZXkge1N0cmluZ30gLSBPbmUgb2YgdGhlIGtleXM6ICdjdXJyZW50JywgJ2FsbCcsICdvdGhlcicsICdsb2NhbGVzJ1xuICAgKi9cbiAgZ2V0U2V0dGluZyhrZXkpIHtcbiAgICBjaGVjayhrZXksIE1hdGNoLk9wdGlvbmFsKE1hdGNoLk9uZU9mKCdjdXJyZW50JywgJ2FsbCcsICdvdGhlcicsICdsb2NhbGVzJywgJ2N1cnJlbnRJU08nLCAnY3VycmVudE5hbWUnKSkpO1xuICAgIGlmIChrZXkpIHtcbiAgICAgIHJldHVybiB0aGlzLmxhbmd1Z2VTZXQoKVtrZXldIHx8IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMubGFuZ3VnZVNldCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAbWVtYmVyT2YgSTE4TlxuICAgKiBAbmFtZSBsYW5ndWdlU2V0XG4gICAqIEBzdW1tYXJ5IEdldCBkYXRhIGZyb20gaTE4biBjb25maWdcbiAgICovXG4gIGxhbmd1Z2VTZXQoKSB7XG4gICAgbGV0IGtleTtcbiAgICBjb25zdCBsb2NhbGUgPSB0aGlzLmN1cnJlbnRMb2NhbGUuZ2V0KCk7XG4gICAgcmV0dXJuIHtcbiAgICAgIGN1cnJlbnQ6IGxvY2FsZSxcbiAgICAgIGN1cnJlbnRJU086IHRoaXMuc2V0dGluZ3NbbG9jYWxlXS5pc29Db2RlLFxuICAgICAgY3VycmVudE5hbWU6IHRoaXMuc2V0dGluZ3NbbG9jYWxlXS5uYW1lLFxuICAgICAgYWxsOiAoKCkgPT4ge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBbXTtcbiAgICAgICAgZm9yIChrZXkgaW4gdGhpcy5zZXR0aW5ncykge1xuICAgICAgICAgIGlmIChpc09iamVjdCh0aGlzLnNldHRpbmdzW2tleV0pKSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaCh0aGlzLnNldHRpbmdzW2tleV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSkoKSxcbiAgICAgIG90aGVyOiAoKCkgPT4ge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBbXTtcbiAgICAgICAgZm9yIChrZXkgaW4gdGhpcy5zZXR0aW5ncykge1xuICAgICAgICAgIGlmIChpc09iamVjdCh0aGlzLnNldHRpbmdzW2tleV0pICYmIChrZXkgIT09IGxvY2FsZSkpIHtcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKHRoaXMuc2V0dGluZ3Nba2V5XSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9KSgpLFxuICAgICAgbG9jYWxlczogKCgpID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gW107XG4gICAgICAgIGZvciAoa2V5IGluIHRoaXMuc2V0dGluZ3MpIHtcbiAgICAgICAgICBpZiAoaXNPYmplY3QodGhpcy5zZXR0aW5nc1trZXldKSkge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2godGhpcy5zZXR0aW5nc1trZXldLmNvZGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSkoKVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBtZW1iZXJPZiBJMThOXG4gICAqIEBuYW1lIGFkZGwxMG5cbiAgICogQHN1bW1hcnkgYWRkIGwxMG4gZGF0YVxuICAgKiBAZXhhbXBsZSB7IGVuOiB7IG5ld0tleTogXCJuZXcgZGF0YVwiIH0gfVxuICAgKi9cbiAgYWRkbDEwbihsMTBuKSB7XG4gICAgY2hlY2sobDEwbiwgT2JqZWN0KTtcblxuICAgIGxldCBrO1xuICAgIGxldCBrZXk7XG4gICAgbGV0IG9iamVjdDtcbiAgICBmb3IgKGtleSBpbiBsMTBuKSB7XG4gICAgICBpZiAoa2V5ICE9PSAnc2V0dGluZ3MnKSB7XG4gICAgICAgIG9iamVjdCA9IHRvRG90dGVkU3RyaW5nLmNhbGwodGhpcywgbDEwbltrZXldLCBrZXkpO1xuICAgICAgICBmb3IgKGsgaW4gb2JqZWN0KSB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBvYmplY3Rba10gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLnN0cmluZ3Nba10gPSBvYmplY3Rba107XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXX0=
