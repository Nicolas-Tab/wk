(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var slugify = Package['yasaricli:slugify'].slugify;
var ECMAScript = Package.ecmascript.ECMAScript;
var _ = Package.underscore._;
var SHA256 = Package.sha.SHA256;
var Accounts = Package['accounts-base'].Accounts;
var SyncedCron = Package['percolate:synced-cron'].SyncedCron;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"wekan-ldap":{"server":{"index.js":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/wekan-ldap/server/index.js                                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.link("./loginHandler");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ldap.js":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/wekan-ldap/server/ldap.js                                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  default: () => LDAP
});
let ldapjs;
module.link("ldapjs", {
  default(v) {
    ldapjs = v;
  }
}, 0);
let Log;
module.link("meteor/logging", {
  Log(v) {
    Log = v;
  }
}, 1);
// copied from https://github.com/ldapjs/node-ldapjs/blob/a113953e0d91211eb945d2a3952c84b7af6de41c/lib/filters/index.js#L167
function escapedToHex(str) {
  if (str !== undefined) {
    return str.replace(/\\([0-9a-f][^0-9a-f]|[0-9a-f]$|[^0-9a-f]|$)/gi, function (match, p1) {
      if (!p1) {
        return '\\5c';
      }
      const hexCode = p1.charCodeAt(0).toString(16);
      const rest = p1.substring(1);
      return '\\' + hexCode + rest;
    });
  } else {
    return undefined;
  }
}
class LDAP {
  constructor() {
    this.ldapjs = ldapjs;
    this.connected = false;
    this.options = {
      host: this.constructor.settings_get('LDAP_HOST'),
      port: this.constructor.settings_get('LDAP_PORT'),
      Reconnect: this.constructor.settings_get('LDAP_RECONNECT'),
      timeout: this.constructor.settings_get('LDAP_TIMEOUT'),
      connect_timeout: this.constructor.settings_get('LDAP_CONNECT_TIMEOUT'),
      idle_timeout: this.constructor.settings_get('LDAP_IDLE_TIMEOUT'),
      encryption: this.constructor.settings_get('LDAP_ENCRYPTION'),
      ca_cert: this.constructor.settings_get('LDAP_CA_CERT'),
      reject_unauthorized: this.constructor.settings_get('LDAP_REJECT_UNAUTHORIZED') !== undefined ? this.constructor.settings_get('LDAP_REJECT_UNAUTHORIZED') : true,
      Authentication: this.constructor.settings_get('LDAP_AUTHENTIFICATION'),
      Authentication_UserDN: this.constructor.settings_get('LDAP_AUTHENTIFICATION_USERDN'),
      Authentication_Password: this.constructor.settings_get('LDAP_AUTHENTIFICATION_PASSWORD'),
      Authentication_Fallback: this.constructor.settings_get('LDAP_LOGIN_FALLBACK'),
      BaseDN: this.constructor.settings_get('LDAP_BASEDN'),
      Internal_Log_Level: this.constructor.settings_get('INTERNAL_LOG_LEVEL'),
      //this setting does not have any effect any more and should be deprecated
      User_Authentication: this.constructor.settings_get('LDAP_USER_AUTHENTICATION'),
      User_Authentication_Field: this.constructor.settings_get('LDAP_USER_AUTHENTICATION_FIELD'),
      User_Attributes: this.constructor.settings_get('LDAP_USER_ATTRIBUTES'),
      User_Search_Filter: escapedToHex(this.constructor.settings_get('LDAP_USER_SEARCH_FILTER')),
      User_Search_Scope: this.constructor.settings_get('LDAP_USER_SEARCH_SCOPE'),
      User_Search_Field: this.constructor.settings_get('LDAP_USER_SEARCH_FIELD'),
      Search_Page_Size: this.constructor.settings_get('LDAP_SEARCH_PAGE_SIZE'),
      Search_Size_Limit: this.constructor.settings_get('LDAP_SEARCH_SIZE_LIMIT'),
      group_filter_enabled: this.constructor.settings_get('LDAP_GROUP_FILTER_ENABLE'),
      group_filter_object_class: this.constructor.settings_get('LDAP_GROUP_FILTER_OBJECTCLASS'),
      group_filter_group_id_attribute: this.constructor.settings_get('LDAP_GROUP_FILTER_GROUP_ID_ATTRIBUTE'),
      group_filter_group_member_attribute: this.constructor.settings_get('LDAP_GROUP_FILTER_GROUP_MEMBER_ATTRIBUTE'),
      group_filter_group_member_format: this.constructor.settings_get('LDAP_GROUP_FILTER_GROUP_MEMBER_FORMAT'),
      group_filter_group_name: this.constructor.settings_get('LDAP_GROUP_FILTER_GROUP_NAME'),
      AD_Simple_Auth: this.constructor.settings_get('LDAP_AD_SIMPLE_AUTH'),
      Default_Domain: this.constructor.settings_get('LDAP_DEFAULT_DOMAIN')
    };
  }
  static settings_get(name) {
    let value = process.env[name];
    if (value !== undefined) {
      if (value === 'true' || value === 'false') {
        value = JSON.parse(value);
      } else if (value !== '' && !isNaN(value)) {
        value = Number(value);
      }
      return value;
    } else {
      //Log.warn(`Lookup for unset variable: ${name}`);
    }
  }
  connectSync() {
    if (!this._connectSync) {
      this._connectSync = Meteor.wrapAsync(this.connectAsync, this);
    }
    return this._connectSync(...arguments);
  }
  searchAllSync() {
    if (!this._searchAllSync) {
      this._searchAllSync = Meteor.wrapAsync(this.searchAllAsync, this);
    }
    return this._searchAllSync(...arguments);
  }
  connectAsync(callback) {
    Log.info('Init setup');
    let replied = false;
    const connectionOptions = {
      url: "".concat(this.options.host, ":").concat(this.options.port),
      timeout: this.options.timeout,
      connectTimeout: this.options.connect_timeout,
      idleTimeout: this.options.idle_timeout,
      reconnect: this.options.Reconnect
    };
    const tlsOptions = {
      rejectUnauthorized: this.options.reject_unauthorized
    };
    if (this.options.ca_cert && this.options.ca_cert !== '') {
      // Split CA cert into array of strings
      const chainLines = this.constructor.settings_get('LDAP_CA_CERT').replace(/\\n/g, '\n').split('\n');
      let cert = [];
      const ca = [];
      chainLines.forEach(line => {
        cert.push(line);
        if (line.match(/-END CERTIFICATE-/)) {
          ca.push(cert.join('\n'));
          cert = [];
        }
      });
      tlsOptions.ca = ca;
    }
    if (this.options.encryption === 'ssl') {
      connectionOptions.url = "ldaps://".concat(connectionOptions.url);
      connectionOptions.tlsOptions = tlsOptions;
    } else {
      connectionOptions.url = "ldap://".concat(connectionOptions.url);
    }
    Log.info("Connecting ".concat(connectionOptions.url));
    Log.debug("connectionOptions ".concat(JSON.stringify(connectionOptions)));
    this.client = ldapjs.createClient(connectionOptions);
    this.bindSync = Meteor.wrapAsync(this.client.bind, this.client);
    this.client.on('error', error => {
      Log.error("connection ".concat(error));
      if (replied === false) {
        replied = true;
        callback(error, null);
      }
    });
    this.client.on('idle', () => {
      Log.info('Idle');
      this.disconnect();
    });
    this.client.on('close', () => {
      Log.info('Closed');
    });
    if (this.options.encryption === 'tls') {
      // Set host parameter for tls.connect which is used by ldapjs starttls. This shouldn't be needed in newer nodejs versions (e.g v5.6.0).
      // https://github.com/RocketChat/Rocket.Chat/issues/2035
      // https://github.com/mcavage/node-ldapjs/issues/349
      tlsOptions.host = this.options.host;
      Log.info('Starting TLS');
      Log.debug("tlsOptions ".concat(JSON.stringify(tlsOptions)));
      this.client.starttls(tlsOptions, null, (error, response) => {
        if (error) {
          Log.error("TLS connection ".concat(JSON.stringify(error)));
          if (replied === false) {
            replied = true;
            callback(error, null);
          }
          return;
        }
        Log.info('TLS connected');
        this.connected = true;
        if (replied === false) {
          replied = true;
          callback(null, response);
        }
      });
    } else {
      this.client.on('connect', response => {
        Log.info('LDAP connected');
        this.connected = true;
        if (replied === false) {
          replied = true;
          callback(null, response);
        }
      });
    }
    setTimeout(() => {
      if (replied === false) {
        Log.error("connection time out ".concat(connectionOptions.connectTimeout));
        replied = true;
        callback(new Error('Timeout'));
      }
    }, connectionOptions.connectTimeout);
  }
  getUserFilter(username) {
    const filter = [];
    if (this.options.User_Search_Filter !== '') {
      if (this.options.User_Search_Filter[0] === '(') {
        filter.push("".concat(this.options.User_Search_Filter));
      } else {
        filter.push("(".concat(this.options.User_Search_Filter, ")"));
      }
    }
    const usernameFilter = this.options.User_Search_Field.split(',').map(item => "(".concat(item, "=").concat(username, ")"));
    if (usernameFilter.length === 0) {
      Log.error('LDAP_LDAP_User_Search_Field not defined');
    } else if (usernameFilter.length === 1) {
      filter.push("".concat(usernameFilter[0]));
    } else {
      filter.push("(|".concat(usernameFilter.join(''), ")"));
    }
    return "(&".concat(filter.join(''), ")");
  }
  bindUserIfNecessary(username, password) {
    if (this.domainBinded === true) {
      return;
    }
    if (!this.options.User_Authentication) {
      return;
    }

    /* if SimpleAuth is configured, the BaseDN is not needed */
    if (!this.options.BaseDN && !this.options.AD_Simple_Auth) throw new Error('BaseDN is not provided');
    var userDn = "";
    if (this.options.AD_Simple_Auth === true || this.options.AD_Simple_Auth === 'true') {
      userDn = "".concat(username, "@").concat(this.options.Default_Domain);
    } else {
      userDn = "".concat(this.options.User_Authentication_Field, "=").concat(username, ",").concat(this.options.BaseDN);
    }
    Log.info("Binding with User ".concat(userDn));
    this.bindSync(userDn, password);
    this.domainBinded = true;
  }
  bindIfNecessary() {
    if (this.domainBinded === true) {
      return;
    }
    if (this.options.Authentication !== true) {
      return;
    }
    Log.info("Binding UserDN ".concat(this.options.Authentication_UserDN));
    this.bindSync(this.options.Authentication_UserDN, this.options.Authentication_Password);
    this.domainBinded = true;
  }
  searchUsersSync(username, page) {
    this.bindIfNecessary();
    const searchOptions = {
      filter: this.getUserFilter(username),
      scope: this.options.User_Search_Scope || 'sub',
      sizeLimit: this.options.Search_Size_Limit
    };
    if (!!this.options.User_Attributes) searchOptions.attributes = this.options.User_Attributes.split(',');
    if (this.options.Search_Page_Size > 0) {
      searchOptions.paged = {
        pageSize: this.options.Search_Page_Size,
        pagePause: !!page
      };
    }
    Log.info("Searching user ".concat(username));
    Log.debug("searchOptions ".concat(searchOptions));
    Log.debug("BaseDN ".concat(this.options.BaseDN));
    if (page) {
      return this.searchAllPaged(this.options.BaseDN, searchOptions, page);
    }
    return this.searchAllSync(this.options.BaseDN, searchOptions);
  }
  getUserByIdSync(id, attribute) {
    this.bindIfNecessary();
    const Unique_Identifier_Field = this.constructor.settings_get('LDAP_UNIQUE_IDENTIFIER_FIELD').split(',');
    let filter;
    if (attribute) {
      filter = new this.ldapjs.filters.EqualityFilter({
        attribute,
        value: Buffer.from(id, 'hex')
      });
    } else {
      const filters = [];
      Unique_Identifier_Field.forEach(item => {
        filters.push(new this.ldapjs.filters.EqualityFilter({
          attribute: item,
          value: Buffer.from(id, 'hex')
        }));
      });
      filter = new this.ldapjs.filters.OrFilter({
        filters
      });
    }
    const searchOptions = {
      filter,
      scope: 'sub'
    };
    Log.info("Searching by id ".concat(id));
    Log.debug("search filter ".concat(searchOptions.filter.toString()));
    Log.debug("BaseDN ".concat(this.options.BaseDN));
    const result = this.searchAllSync(this.options.BaseDN, searchOptions);
    if (!Array.isArray(result) || result.length === 0) {
      return;
    }
    if (result.length > 1) {
      Log.error("Search by id ".concat(id, " returned ").concat(result.length, " records"));
    }
    return result[0];
  }
  getUserByUsernameSync(username) {
    this.bindIfNecessary();
    const searchOptions = {
      filter: this.getUserFilter(username),
      scope: this.options.User_Search_Scope || 'sub'
    };
    Log.info("Searching user ".concat(username));
    Log.debug("searchOptions ".concat(searchOptions));
    Log.debug("BaseDN ".concat(this.options.BaseDN));
    const result = this.searchAllSync(this.options.BaseDN, searchOptions);
    if (!Array.isArray(result) || result.length === 0) {
      return;
    }
    if (result.length > 1) {
      Log.error("Search by username ".concat(username, " returned ").concat(result.length, " records"));
    }
    return result[0];
  }
  getUserGroups(username, ldapUser) {
    if (!this.options.group_filter_enabled) {
      return true;
    }
    const filter = ['(&'];
    if (this.options.group_filter_object_class !== '') {
      filter.push("(objectclass=".concat(this.options.group_filter_object_class, ")"));
    }
    if (this.options.group_filter_group_member_attribute !== '') {
      const format_value = ldapUser[this.options.group_filter_group_member_format];
      if (format_value) {
        filter.push("(".concat(this.options.group_filter_group_member_attribute, "=").concat(format_value, ")"));
      }
    }
    filter.push(')');
    const searchOptions = {
      filter: filter.join('').replace(/#{username}/g, username).replace("\\", "\\\\"),
      scope: 'sub'
    };
    Log.debug("Group list filter LDAP: ".concat(searchOptions.filter));
    const result = this.searchAllSync(this.options.BaseDN, searchOptions);
    if (!Array.isArray(result) || result.length === 0) {
      return [];
    }
    const grp_identifier = this.options.group_filter_group_id_attribute || 'cn';
    const groups = [];
    result.map(item => {
      groups.push(item[grp_identifier]);
    });
    Log.debug("Groups: ".concat(groups.join(', ')));
    return groups;
  }
  isUserInGroup(username, ldapUser) {
    if (!this.options.group_filter_enabled) {
      return true;
    }
    const grps = this.getUserGroups(username, ldapUser);
    const filter = ['(&'];
    if (this.options.group_filter_object_class !== '') {
      filter.push("(objectclass=".concat(this.options.group_filter_object_class, ")"));
    }
    if (this.options.group_filter_group_member_attribute !== '') {
      const format_value = ldapUser[this.options.group_filter_group_member_format];
      if (format_value) {
        filter.push("(".concat(this.options.group_filter_group_member_attribute, "=").concat(format_value, ")"));
      }
    }
    if (this.options.group_filter_group_id_attribute !== '') {
      filter.push("(".concat(this.options.group_filter_group_id_attribute, "=").concat(this.options.group_filter_group_name, ")"));
    }
    filter.push(')');
    const searchOptions = {
      filter: filter.join('').replace(/#{username}/g, username).replace("\\", "\\\\"),
      scope: 'sub'
    };
    Log.debug("Group filter LDAP: ".concat(searchOptions.filter));
    const result = this.searchAllSync(this.options.BaseDN, searchOptions);
    if (!Array.isArray(result) || result.length === 0) {
      return false;
    }
    return true;
  }
  extractLdapEntryData(entry) {
    const values = {
      _raw: entry.raw
    };
    Object.keys(values._raw).forEach(key => {
      const value = values._raw[key];
      if (!['thumbnailPhoto', 'jpegPhoto'].includes(key)) {
        if (value instanceof Buffer) {
          values[key] = value.toString();
        } else {
          values[key] = value;
        }
      }
    });
    return values;
  }
  searchAllPaged(BaseDN, options, page) {
    this.bindIfNecessary();
    const processPage = _ref => {
      let {
        entries,
        title,
        end,
        next
      } = _ref;
      Log.info(title);
      // Force LDAP idle to wait the record processing
      this.client._updateIdle(true);
      page(null, entries, {
        end,
        next: () => {
          // Reset idle timer
          this.client._updateIdle();
          next && next();
        }
      });
    };
    this.client.search(BaseDN, options, (error, res) => {
      if (error) {
        Log.error(error);
        page(error);
        return;
      }
      res.on('error', error => {
        Log.error(error);
        page(error);
        return;
      });
      let entries = [];
      const internalPageSize = options.paged && options.paged.pageSize > 0 ? options.paged.pageSize * 2 : 500;
      res.on('searchEntry', entry => {
        entries.push(this.extractLdapEntryData(entry));
        if (entries.length >= internalPageSize) {
          processPage({
            entries,
            title: 'Internal Page',
            end: false
          });
          entries = [];
        }
      });
      res.on('page', (result, next) => {
        if (!next) {
          this.client._updateIdle(true);
          processPage({
            entries,
            title: 'Final Page',
            end: true
          });
        } else if (entries.length) {
          Log.info('Page');
          processPage({
            entries,
            title: 'Page',
            end: false,
            next
          });
          entries = [];
        }
      });
      res.on('end', () => {
        if (entries.length) {
          processPage({
            entries,
            title: 'Final Page',
            end: true
          });
          entries = [];
        }
      });
    });
  }
  searchAllAsync(BaseDN, options, callback) {
    this.bindIfNecessary();
    this.client.search(BaseDN, options, (error, res) => {
      if (error) {
        Log.error(error);
        callback(error);
        return;
      }
      res.on('error', error => {
        Log.error(error);
        callback(error);
        return;
      });
      const entries = [];
      res.on('searchEntry', entry => {
        entries.push(this.extractLdapEntryData(entry));
      });
      res.on('end', () => {
        Log.info("Search result count ".concat(entries.length));
        callback(null, entries);
      });
    });
  }
  authSync(dn, password) {
    Log.info("Authenticating ".concat(dn));
    try {
      if (password === '') {
        throw new Error('Password is not provided');
      }
      this.bindSync(dn, password);
      Log.info("Authenticated ".concat(dn));
      return true;
    } catch (error) {
      Log.info("Not authenticated ".concat(dn));
      Log.debug('error', error);
      return false;
    }
  }
  disconnect() {
    this.connected = false;
    this.domainBinded = false;
    Log.info('Disconecting');
    this.client.unbind();
  }
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"logger.js":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/wekan-ldap/server/logger.js                                                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  log: () => log,
  log_debug: () => log_debug,
  log_info: () => log_info,
  log_warn: () => log_warn,
  log_error: () => log_error
});
const isLogEnabled = process.env.LDAP_LOG_ENABLED === 'true';
function log(level, message, data) {
  if (isLogEnabled) {
    console.log("[".concat(level, "] ").concat(message, " ").concat(data ? JSON.stringify(data, null, 2) : ''));
  }
}
function log_debug() {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }
  log('DEBUG', ...args);
}
function log_info() {
  for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    args[_key2] = arguments[_key2];
  }
  log('INFO', ...args);
}
function log_warn() {
  for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
    args[_key3] = arguments[_key3];
  }
  log('WARN', ...args);
}
function log_error() {
  for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
    args[_key4] = arguments[_key4];
  }
  log('ERROR', ...args);
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"loginHandler.js":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/wekan-ldap/server/loginHandler.js                                                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let slug, getLdapUsername, getLdapEmail, getLdapUserUniqueID, syncUserData, addLdapUser;
module.link("./sync", {
  slug(v) {
    slug = v;
  },
  getLdapUsername(v) {
    getLdapUsername = v;
  },
  getLdapEmail(v) {
    getLdapEmail = v;
  },
  getLdapUserUniqueID(v) {
    getLdapUserUniqueID = v;
  },
  syncUserData(v) {
    syncUserData = v;
  },
  addLdapUser(v) {
    addLdapUser = v;
  }
}, 0);
let LDAP;
module.link("./ldap", {
  default(v) {
    LDAP = v;
  }
}, 1);
let log_debug, log_info, log_warn, log_error;
module.link("./logger", {
  log_debug(v) {
    log_debug = v;
  },
  log_info(v) {
    log_info = v;
  },
  log_warn(v) {
    log_warn = v;
  },
  log_error(v) {
    log_error = v;
  }
}, 2);
function fallbackDefaultAccountSystem(bind, username, password) {
  if (typeof username === 'string') {
    if (username.indexOf('@') === -1) {
      username = {
        username
      };
    } else {
      username = {
        email: username
      };
    }
  }
  log_info('Fallback to default account system: ', username);
  const loginRequest = {
    user: username,
    password: {
      digest: SHA256(password),
      algorithm: 'sha-256'
    }
  };
  log_debug('Fallback options: ', loginRequest);
  return Accounts._runLoginHandlers(bind, loginRequest);
}
Accounts.registerLoginHandler('ldap', function (loginRequest) {
  if (!loginRequest.ldap || !loginRequest.ldapOptions) {
    return undefined;
  }
  log_info('Init LDAP login', loginRequest.username);
  if (LDAP.settings_get('LDAP_ENABLE') !== true) {
    return fallbackDefaultAccountSystem(this, loginRequest.username, loginRequest.ldapPass);
  }
  const self = this;
  const ldap = new LDAP();
  let ldapUser;
  try {
    ldap.connectSync();
    if (!!LDAP.settings_get('LDAP_USER_AUTHENTICATION')) {
      ldap.bindUserIfNecessary(loginRequest.username, loginRequest.ldapPass);
      ldapUser = ldap.searchUsersSync(loginRequest.username)[0];
    } else {
      const users = ldap.searchUsersSync(loginRequest.username);
      if (users.length !== 1) {
        log_info('Search returned', users.length, 'record(s) for', loginRequest.username);
        throw new Error('User not Found');
      }
      if (ldap.isUserInGroup(loginRequest.username, users[0])) {
        ldapUser = users[0];
      } else {
        throw new Error('User not in a valid group');
      }
      if (ldap.authSync(users[0].dn, loginRequest.ldapPass) !== true) {
        ldapUser = null;
        log_info('Wrong password for', loginRequest.username);
      }
    }
  } catch (error) {
    log_error(error);
  }
  if (!ldapUser) {
    if (LDAP.settings_get('LDAP_LOGIN_FALLBACK') === true) {
      return fallbackDefaultAccountSystem(self, loginRequest.username, loginRequest.ldapPass);
    }
    throw new Meteor.Error('LDAP-login-error', "LDAP Authentication failed with provided username [".concat(loginRequest.username, "]"));
  }

  // Look to see if user already exists

  let userQuery;
  const Unique_Identifier_Field = getLdapUserUniqueID(ldapUser);
  let user;
  // Attempt to find user by unique identifier

  if (Unique_Identifier_Field) {
    userQuery = {
      'services.ldap.id': Unique_Identifier_Field.value
    };
    log_info('Querying user');
    log_debug('userQuery', userQuery);
    user = Meteor.users.findOne(userQuery);
  }

  // Attempt to find user by username

  let username;
  let email;
  if (LDAP.settings_get('LDAP_USERNAME_FIELD') !== '') {
    username = slug(getLdapUsername(ldapUser));
  } else {
    username = slug(loginRequest.username);
  }
  if (LDAP.settings_get('LDAP_EMAIL_FIELD') !== '') {
    email = getLdapEmail(ldapUser);
  }
  if (!user) {
    if (email && LDAP.settings_get('LDAP_EMAIL_MATCH_REQUIRE') === true) {
      if (LDAP.settings_get('LDAP_EMAIL_MATCH_VERIFIED') === true) {
        userQuery = {
          '_id': username,
          'emails.0.address': email,
          'emails.0.verified': true
        };
      } else {
        userQuery = {
          '_id': username,
          'emails.0.address': email
        };
      }
    } else {
      userQuery = {
        username
      };
    }
    log_debug('userQuery', userQuery);
    user = Meteor.users.findOne(userQuery);
  }

  // Attempt to find user by e-mail address only

  if (!user && email && LDAP.settings_get('LDAP_EMAIL_MATCH_ENABLE') === true) {
    log_info('No user exists with username', username, '- attempting to find by e-mail address instead');
    if (LDAP.settings_get('LDAP_EMAIL_MATCH_VERIFIED') === true) {
      userQuery = {
        'emails.0.address': email,
        'emails.0.verified': true
      };
    } else {
      userQuery = {
        'emails.0.address': email
      };
    }
    log_debug('userQuery', userQuery);
    user = Meteor.users.findOne(userQuery);
  }

  // Login user if they exist
  if (user) {
    if (user.authenticationMethod !== 'ldap' && LDAP.settings_get('LDAP_MERGE_EXISTING_USERS') !== true) {
      log_info('User exists without "authenticationMethod : ldap"');
      throw new Meteor.Error('LDAP-login-error', "LDAP Authentication succeded, but there's already a matching Wekan account in MongoDB");
    }
    log_info('Logging user');
    const stampedToken = Accounts._generateStampedLoginToken();
    const update_data = {
      $push: {
        'services.resume.loginTokens': Accounts._hashStampedToken(stampedToken)
      }
    };
    if (LDAP.settings_get('LDAP_SYNC_ADMIN_STATUS') === true) {
      log_debug('Updating admin status');
      const targetGroups = LDAP.settings_get('LDAP_SYNC_ADMIN_GROUPS').split(',');
      const groups = ldap.getUserGroups(username, ldapUser).filter(value => targetGroups.includes(value));
      user.isAdmin = groups.length > 0;
      Meteor.users.update({
        _id: user._id
      }, {
        $set: {
          isAdmin: user.isAdmin
        }
      });
    }
    if (LDAP.settings_get('LDAP_SYNC_GROUP_ROLES') === true) {
      log_debug('Updating Groups/Roles');
      const groups = ldap.getUserGroups(username, ldapUser);
      if (groups.length > 0) {
        Roles.setUserRoles(user._id, groups);
        log_info("Updated roles to:".concat(groups.join(',')));
      }
    }
    Meteor.users.update(user._id, update_data);
    syncUserData(user, ldapUser);
    if (LDAP.settings_get('LDAP_LOGIN_FALLBACK') === true) {
      Accounts.setPassword(user._id, loginRequest.ldapPass, {
        logout: false
      });
    }
    return {
      userId: user._id,
      token: stampedToken.token
    };
  }

  // Create new user

  log_info('User does not exist, creating', username);
  if (LDAP.settings_get('LDAP_USERNAME_FIELD') === '') {
    username = undefined;
  }
  if (LDAP.settings_get('LDAP_LOGIN_FALLBACK') !== true) {
    loginRequest.ldapPass = undefined;
  }
  const result = addLdapUser(ldapUser, username, loginRequest.ldapPass);
  if (LDAP.settings_get('LDAP_SYNC_ADMIN_STATUS') === true) {
    log_debug('Updating admin status');
    const targetGroups = LDAP.settings_get('LDAP_SYNC_ADMIN_GROUPS').split(',');
    const groups = ldap.getUserGroups(username, ldapUser).filter(value => targetGroups.includes(value));
    result.isAdmin = groups.length > 0;
    Meteor.users.update({
      _id: result.userId
    }, {
      $set: {
        isAdmin: result.isAdmin
      }
    });
  }
  if (LDAP.settings_get('LDAP_SYNC_GROUP_ROLES') === true) {
    const groups = ldap.getUserGroups(username, ldapUser);
    if (groups.length > 0) {
      Roles.setUserRoles(result.userId, groups);
      log_info("Set roles to:".concat(groups.join(',')));
    }
  }
  if (result instanceof Error) {
    throw result;
  }
  return result;
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sync.js":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/wekan-ldap/server/sync.js                                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  slug: () => slug,
  getPropertyValue: () => getPropertyValue,
  getLdapUsername: () => getLdapUsername,
  getLdapEmail: () => getLdapEmail,
  getLdapFullname: () => getLdapFullname,
  getLdapUserUniqueID: () => getLdapUserUniqueID,
  getDataToSyncUserData: () => getDataToSyncUserData,
  syncUserData: () => syncUserData,
  addLdapUser: () => addLdapUser,
  importNewUsers: () => importNewUsers
});
let _;
module.link("underscore", {
  default(v) {
    _ = v;
  }
}, 0);
let SyncedCron;
module.link("meteor/percolate:synced-cron", {
  default(v) {
    SyncedCron = v;
  }
}, 1);
let LDAP;
module.link("./ldap", {
  default(v) {
    LDAP = v;
  }
}, 2);
let log_debug, log_info, log_warn, log_error;
module.link("./logger", {
  log_debug(v) {
    log_debug = v;
  },
  log_info(v) {
    log_info = v;
  },
  log_warn(v) {
    log_warn = v;
  },
  log_error(v) {
    log_error = v;
  }
}, 3);
Object.defineProperty(Object.prototype, "getLDAPValue", {
  value: function (prop) {
    const self = this;
    for (let key in self) {
      if (key.toLowerCase() == prop.toLowerCase()) {
        return self[key];
      }
    }
  },
  enumerable: false
});
function slug(text) {
  if (LDAP.settings_get('LDAP_UTF8_NAMES_SLUGIFY') !== true) {
    return text;
  }
  text = slugify(text, '.');
  return text.replace(/[^0-9a-z-_.]/g, '');
}
function templateVarHandler(variable, object) {
  const templateRegex = /#{([\w\-]+)}/gi;
  let match = templateRegex.exec(variable);
  let tmpVariable = variable;
  if (match == null) {
    if (!object.hasOwnProperty(variable)) {
      return;
    }
    return object[variable];
  } else {
    while (match != null) {
      const tmplVar = match[0];
      const tmplAttrName = match[1];
      if (!object.hasOwnProperty(tmplAttrName)) {
        return;
      }
      const attrVal = object[tmplAttrName];
      tmpVariable = tmpVariable.replace(tmplVar, attrVal);
      match = templateRegex.exec(variable);
    }
    return tmpVariable;
  }
}
function getPropertyValue(obj, key) {
  try {
    return _.reduce(key.split('.'), (acc, el) => acc[el], obj);
  } catch (err) {
    return undefined;
  }
}
function getLdapUsername(ldapUser) {
  const usernameField = LDAP.settings_get('LDAP_USERNAME_FIELD');
  if (usernameField.indexOf('#{') > -1) {
    return usernameField.replace(/#{(.+?)}/g, function (match, field) {
      return ldapUser.getLDAPValue(field);
    });
  }
  return ldapUser.getLDAPValue(usernameField);
}
function getLdapEmail(ldapUser) {
  const emailField = LDAP.settings_get('LDAP_EMAIL_FIELD');
  if (emailField.indexOf('#{') > -1) {
    return emailField.replace(/#{(.+?)}/g, function (match, field) {
      return ldapUser.getLDAPValue(field);
    });
  }
  const ldapMail = ldapUser.getLDAPValue(emailField);
  if (typeof ldapMail === 'string') {
    return ldapMail;
  } else {
    return ldapMail[0].toString();
  }
}
function getLdapFullname(ldapUser) {
  const fullnameField = LDAP.settings_get('LDAP_FULLNAME_FIELD');
  if (fullnameField.indexOf('#{') > -1) {
    return fullnameField.replace(/#{(.+?)}/g, function (match, field) {
      return ldapUser.getLDAPValue(field);
    });
  }
  return ldapUser.getLDAPValue(fullnameField);
}
function getLdapUserUniqueID(ldapUser) {
  let Unique_Identifier_Field = LDAP.settings_get('LDAP_UNIQUE_IDENTIFIER_FIELD');
  if (Unique_Identifier_Field !== '') {
    Unique_Identifier_Field = Unique_Identifier_Field.replace(/\s/g, '').split(',');
  } else {
    Unique_Identifier_Field = [];
  }
  let User_Search_Field = LDAP.settings_get('LDAP_USER_SEARCH_FIELD');
  if (User_Search_Field !== '') {
    User_Search_Field = User_Search_Field.replace(/\s/g, '').split(',');
  } else {
    User_Search_Field = [];
  }
  Unique_Identifier_Field = Unique_Identifier_Field.concat(User_Search_Field);
  if (Unique_Identifier_Field.length > 0) {
    Unique_Identifier_Field = Unique_Identifier_Field.find(field => {
      return !_.isEmpty(ldapUser._raw.getLDAPValue(field));
    });
    if (Unique_Identifier_Field) {
      log_debug("Identifying user with: ".concat(Unique_Identifier_Field));
      Unique_Identifier_Field = {
        attribute: Unique_Identifier_Field,
        value: ldapUser._raw.getLDAPValue(Unique_Identifier_Field).toString('hex')
      };
    }
    return Unique_Identifier_Field;
  }
}
function getDataToSyncUserData(ldapUser, user) {
  const syncUserData = LDAP.settings_get('LDAP_SYNC_USER_DATA');
  const syncUserDataFieldMap = LDAP.settings_get('LDAP_SYNC_USER_DATA_FIELDMAP').trim();
  const userData = {};
  if (syncUserData && syncUserDataFieldMap) {
    const whitelistedUserFields = ['email', 'name', 'customFields'];
    const fieldMap = JSON.parse(syncUserDataFieldMap);
    const emailList = [];
    _.map(fieldMap, function (userField, ldapField) {
      log_debug("Mapping field ".concat(ldapField, " -> ").concat(userField));
      switch (userField) {
        case 'email':
          if (!ldapUser.hasOwnProperty(ldapField)) {
            log_debug("user does not have attribute: ".concat(ldapField));
            return;
          }
          if (_.isObject(ldapUser[ldapField])) {
            _.map(ldapUser[ldapField], function (item) {
              emailList.push({
                address: item,
                verified: true
              });
            });
          } else {
            emailList.push({
              address: ldapUser[ldapField],
              verified: true
            });
          }
          break;
        default:
          const [outerKey, innerKeys] = userField.split(/\.(.+)/);
          if (!_.find(whitelistedUserFields, el => el === outerKey)) {
            log_debug("user attribute not whitelisted: ".concat(userField));
            return;
          }
          if (outerKey === 'customFields') {
            let customFieldsMeta;
            try {
              customFieldsMeta = JSON.parse(LDAP.settings_get('Accounts_CustomFields'));
            } catch (e) {
              log_debug('Invalid JSON for Custom Fields');
              return;
            }
            if (!getPropertyValue(customFieldsMeta, innerKeys)) {
              log_debug("user attribute does not exist: ".concat(userField));
              return;
            }
          }
          const tmpUserField = getPropertyValue(user, userField);
          const tmpLdapField = templateVarHandler(ldapField, ldapUser);
          if (tmpLdapField && tmpUserField !== tmpLdapField) {
            // creates the object structure instead of just assigning 'tmpLdapField' to
            // 'userData[userField]' in order to avoid the "cannot use the part (...)
            // to traverse the element" (MongoDB) error that can happen. Do not handle
            // arrays.
            // TODO: Find a better solution.
            const dKeys = userField.split('.');
            const lastKey = _.last(dKeys);
            _.reduce(dKeys, (obj, currKey) => currKey === lastKey ? obj[currKey] = tmpLdapField : obj[currKey] = obj[currKey] || {}, userData);
            log_debug("user.".concat(userField, " changed to: ").concat(tmpLdapField));
          }
      }
    });
    if (emailList.length > 0) {
      if (JSON.stringify(user.emails) !== JSON.stringify(emailList)) {
        userData.emails = emailList;
      }
    }
  }
  const uniqueId = getLdapUserUniqueID(ldapUser);
  if (uniqueId && (!user.services || !user.services.ldap || user.services.ldap.id !== uniqueId.value || user.services.ldap.idAttribute !== uniqueId.attribute)) {
    userData['services.ldap.id'] = uniqueId.value;
    userData['services.ldap.idAttribute'] = uniqueId.attribute;
  }
  if (user.authenticationMethod !== 'ldap') {
    userData.ldap = true;
  }
  if (_.size(userData)) {
    return userData;
  }
}
function syncUserData(user, ldapUser) {
  log_info('Syncing user data');
  log_debug('user', {
    'email': user.email,
    '_id': user._id
  });
  // log_debug('ldapUser', ldapUser.object);

  if (LDAP.settings_get('LDAP_USERNAME_FIELD') !== '') {
    const username = slug(getLdapUsername(ldapUser));
    if (user && user._id && username !== user.username) {
      log_info('Syncing user username', user.username, '->', username);
      Meteor.users.findOne({
        _id: user._id
      }, {
        $set: {
          username
        }
      });
    }
  }
  if (LDAP.settings_get('LDAP_FULLNAME_FIELD') !== '') {
    const fullname = getLdapFullname(ldapUser);
    log_debug('fullname=', fullname);
    if (user && user._id && fullname !== '') {
      log_info('Syncing user fullname:', fullname);
      Meteor.users.update({
        _id: user._id
      }, {
        $set: {
          'profile.fullname': fullname
        }
      });
    }
  }
  if (LDAP.settings_get('LDAP_EMAIL_FIELD') !== '') {
    const email = getLdapEmail(ldapUser);
    log_debug('email=', email);
    if (user && user._id && email !== '') {
      log_info('Syncing user email:', email);
      Meteor.users.update({
        _id: user._id
      }, {
        $set: {
          'emails.0.address': email
        }
      });
    }
  }
}
function addLdapUser(ldapUser, username, password) {
  const uniqueId = getLdapUserUniqueID(ldapUser);
  const userObject = {};
  if (username) {
    userObject.username = username;
  }
  const userData = getDataToSyncUserData(ldapUser, {});
  if (userData && userData.emails && userData.emails[0] && userData.emails[0].address) {
    if (Array.isArray(userData.emails[0].address)) {
      userObject.email = userData.emails[0].address[0];
    } else {
      userObject.email = userData.emails[0].address;
    }
  } else if (ldapUser.mail && ldapUser.mail.indexOf('@') > -1) {
    userObject.email = ldapUser.mail;
  } else if (LDAP.settings_get('LDAP_DEFAULT_DOMAIN') !== '') {
    userObject.email = "".concat(username || uniqueId.value, "@").concat(LDAP.settings_get('LDAP_DEFAULT_DOMAIN'));
  } else {
    const error = new Meteor.Error('LDAP-login-error', 'LDAP Authentication succeded, there is no email to create an account. Have you tried setting your Default Domain in LDAP Settings?');
    log_error(error);
    throw error;
  }
  log_debug('New user data', userObject);
  if (password) {
    userObject.password = password;
  }
  try {
    // This creates the account with password service
    userObject.ldap = true;
    userObject._id = Accounts.createUser(userObject);

    // Add the services.ldap identifiers
    Meteor.users.update({
      _id: userObject._id
    }, {
      $set: {
        'services.ldap': {
          id: uniqueId.value
        },
        'emails.0.verified': true,
        'authenticationMethod': 'ldap'
      }
    });
  } catch (error) {
    log_error('Error creating user', error);
    return error;
  }
  syncUserData(userObject, ldapUser);
  return {
    userId: userObject._id
  };
}
function importNewUsers(ldap) {
  if (LDAP.settings_get('LDAP_ENABLE') !== true) {
    log_error('Can\'t run LDAP Import, LDAP is disabled');
    return;
  }
  if (!ldap) {
    ldap = new LDAP();
    ldap.connectSync();
  }
  let count = 0;
  ldap.searchUsersSync('*', Meteor.bindEnvironment(function (error, ldapUsers) {
    let {
      next,
      end
    } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    if (error) {
      throw error;
    }
    ldapUsers.forEach(ldapUser => {
      count++;
      const uniqueId = getLdapUserUniqueID(ldapUser);
      // Look to see if user already exists
      const userQuery = {
        'services.ldap.id': uniqueId.value
      };
      log_debug('userQuery', userQuery);
      let username;
      if (LDAP.settings_get('LDAP_USERNAME_FIELD') !== '') {
        username = slug(getLdapUsername(ldapUser));
      }

      // Add user if it was not added before
      let user = Meteor.users.findOne(userQuery);
      if (!user && username && LDAP.settings_get('LDAP_MERGE_EXISTING_USERS') === true) {
        const userQuery = {
          username
        };
        log_debug('userQuery merge', userQuery);
        user = Meteor.users.findOne(userQuery);
        if (user) {
          syncUserData(user, ldapUser);
        }
      }
      if (!user) {
        addLdapUser(ldapUser, username);
      }
      if (count % 100 === 0) {
        log_info('Import running. Users imported until now:', count);
      }
    });
    if (end) {
      log_info('Import finished. Users imported:', count);
    }
    next(count);
  }));
}
function sync() {
  if (LDAP.settings_get('LDAP_ENABLE') !== true) {
    return;
  }
  const ldap = new LDAP();
  try {
    ldap.connectSync();
    let users;
    if (LDAP.settings_get('LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED') === true) {
      users = Meteor.users.find({
        'services.ldap': {
          $exists: true
        }
      });
    }
    if (LDAP.settings_get('LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS') === true) {
      importNewUsers(ldap);
    }
    if (LDAP.settings_get('LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED') === true) {
      users.forEach(function (user) {
        let ldapUser;
        if (user.services && user.services.ldap && user.services.ldap.id) {
          ldapUser = ldap.getUserByIdSync(user.services.ldap.id, user.services.ldap.idAttribute);
        } else {
          ldapUser = ldap.getUserByUsernameSync(user.username);
        }
        if (ldapUser) {
          syncUserData(user, ldapUser);
        } else {
          log_info('Can\'t sync user', user.username);
        }
      });
    }
  } catch (error) {
    log_error(error);
    return error;
  }
  return true;
}
const jobName = 'LDAP_Sync';
const addCronJob = _.debounce(Meteor.bindEnvironment(function addCronJobDebounced() {
  let sc = SyncedCron.SyncedCron; //Why ?? something must be wrong in the import
  if (LDAP.settings_get('LDAP_BACKGROUND_SYNC') !== true) {
    log_info('Disabling LDAP Background Sync');
    if (sc.nextScheduledAtDate(jobName)) {
      sc.remove(jobName);
    }
    return;
  }
  log_info('Enabling LDAP Background Sync');
  sc.add({
    name: jobName,
    schedule: function (parser) {
      if (LDAP.settings_get('LDAP_BACKGROUND_SYNC_INTERVAL')) {
        return parser.text(LDAP.settings_get('LDAP_BACKGROUND_SYNC_INTERVAL'));
      } else {
        return parser.recur().on(0).minute();
      }
    },
    job: function () {
      sync();
    }
  });
  sc.start();
}), 500);
Meteor.startup(() => {
  Meteor.defer(() => {
    if (LDAP.settings_get('LDAP_BACKGROUND_SYNC')) {
      addCronJob();
    }
  });
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/wekan-ldap/server/index.js");

/* Exports */
Package._define("wekan-ldap", exports);

})();

//# sourceURL=meteor://💻app/packages/wekan-ldap.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvd2VrYW4tbGRhcC9zZXJ2ZXIvaW5kZXguanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3dla2FuLWxkYXAvc2VydmVyL2xkYXAuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3dla2FuLWxkYXAvc2VydmVyL2xvZ2dlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvd2VrYW4tbGRhcC9zZXJ2ZXIvbG9naW5IYW5kbGVyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy93ZWthbi1sZGFwL3NlcnZlci9zeW5jLmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsImxpbmsiLCJleHBvcnQiLCJkZWZhdWx0IiwiTERBUCIsImxkYXBqcyIsInYiLCJMb2ciLCJlc2NhcGVkVG9IZXgiLCJzdHIiLCJ1bmRlZmluZWQiLCJyZXBsYWNlIiwibWF0Y2giLCJwMSIsImhleENvZGUiLCJjaGFyQ29kZUF0IiwidG9TdHJpbmciLCJyZXN0Iiwic3Vic3RyaW5nIiwiY29uc3RydWN0b3IiLCJjb25uZWN0ZWQiLCJvcHRpb25zIiwiaG9zdCIsInNldHRpbmdzX2dldCIsInBvcnQiLCJSZWNvbm5lY3QiLCJ0aW1lb3V0IiwiY29ubmVjdF90aW1lb3V0IiwiaWRsZV90aW1lb3V0IiwiZW5jcnlwdGlvbiIsImNhX2NlcnQiLCJyZWplY3RfdW5hdXRob3JpemVkIiwiQXV0aGVudGljYXRpb24iLCJBdXRoZW50aWNhdGlvbl9Vc2VyRE4iLCJBdXRoZW50aWNhdGlvbl9QYXNzd29yZCIsIkF1dGhlbnRpY2F0aW9uX0ZhbGxiYWNrIiwiQmFzZUROIiwiSW50ZXJuYWxfTG9nX0xldmVsIiwiVXNlcl9BdXRoZW50aWNhdGlvbiIsIlVzZXJfQXV0aGVudGljYXRpb25fRmllbGQiLCJVc2VyX0F0dHJpYnV0ZXMiLCJVc2VyX1NlYXJjaF9GaWx0ZXIiLCJVc2VyX1NlYXJjaF9TY29wZSIsIlVzZXJfU2VhcmNoX0ZpZWxkIiwiU2VhcmNoX1BhZ2VfU2l6ZSIsIlNlYXJjaF9TaXplX0xpbWl0IiwiZ3JvdXBfZmlsdGVyX2VuYWJsZWQiLCJncm91cF9maWx0ZXJfb2JqZWN0X2NsYXNzIiwiZ3JvdXBfZmlsdGVyX2dyb3VwX2lkX2F0dHJpYnV0ZSIsImdyb3VwX2ZpbHRlcl9ncm91cF9tZW1iZXJfYXR0cmlidXRlIiwiZ3JvdXBfZmlsdGVyX2dyb3VwX21lbWJlcl9mb3JtYXQiLCJncm91cF9maWx0ZXJfZ3JvdXBfbmFtZSIsIkFEX1NpbXBsZV9BdXRoIiwiRGVmYXVsdF9Eb21haW4iLCJuYW1lIiwidmFsdWUiLCJwcm9jZXNzIiwiZW52IiwiSlNPTiIsInBhcnNlIiwiaXNOYU4iLCJOdW1iZXIiLCJjb25uZWN0U3luYyIsIl9jb25uZWN0U3luYyIsIk1ldGVvciIsIndyYXBBc3luYyIsImNvbm5lY3RBc3luYyIsImFyZ3VtZW50cyIsInNlYXJjaEFsbFN5bmMiLCJfc2VhcmNoQWxsU3luYyIsInNlYXJjaEFsbEFzeW5jIiwiY2FsbGJhY2siLCJpbmZvIiwicmVwbGllZCIsImNvbm5lY3Rpb25PcHRpb25zIiwidXJsIiwiY29uY2F0IiwiY29ubmVjdFRpbWVvdXQiLCJpZGxlVGltZW91dCIsInJlY29ubmVjdCIsInRsc09wdGlvbnMiLCJyZWplY3RVbmF1dGhvcml6ZWQiLCJjaGFpbkxpbmVzIiwic3BsaXQiLCJjZXJ0IiwiY2EiLCJmb3JFYWNoIiwibGluZSIsInB1c2giLCJqb2luIiwiZGVidWciLCJzdHJpbmdpZnkiLCJjbGllbnQiLCJjcmVhdGVDbGllbnQiLCJiaW5kU3luYyIsImJpbmQiLCJvbiIsImVycm9yIiwiZGlzY29ubmVjdCIsInN0YXJ0dGxzIiwicmVzcG9uc2UiLCJzZXRUaW1lb3V0IiwiRXJyb3IiLCJnZXRVc2VyRmlsdGVyIiwidXNlcm5hbWUiLCJmaWx0ZXIiLCJ1c2VybmFtZUZpbHRlciIsIm1hcCIsIml0ZW0iLCJsZW5ndGgiLCJiaW5kVXNlcklmTmVjZXNzYXJ5IiwicGFzc3dvcmQiLCJkb21haW5CaW5kZWQiLCJ1c2VyRG4iLCJiaW5kSWZOZWNlc3NhcnkiLCJzZWFyY2hVc2Vyc1N5bmMiLCJwYWdlIiwic2VhcmNoT3B0aW9ucyIsInNjb3BlIiwic2l6ZUxpbWl0IiwiYXR0cmlidXRlcyIsInBhZ2VkIiwicGFnZVNpemUiLCJwYWdlUGF1c2UiLCJzZWFyY2hBbGxQYWdlZCIsImdldFVzZXJCeUlkU3luYyIsImlkIiwiYXR0cmlidXRlIiwiVW5pcXVlX0lkZW50aWZpZXJfRmllbGQiLCJmaWx0ZXJzIiwiRXF1YWxpdHlGaWx0ZXIiLCJCdWZmZXIiLCJmcm9tIiwiT3JGaWx0ZXIiLCJyZXN1bHQiLCJBcnJheSIsImlzQXJyYXkiLCJnZXRVc2VyQnlVc2VybmFtZVN5bmMiLCJnZXRVc2VyR3JvdXBzIiwibGRhcFVzZXIiLCJmb3JtYXRfdmFsdWUiLCJncnBfaWRlbnRpZmllciIsImdyb3VwcyIsImlzVXNlckluR3JvdXAiLCJncnBzIiwiZXh0cmFjdExkYXBFbnRyeURhdGEiLCJlbnRyeSIsInZhbHVlcyIsIl9yYXciLCJyYXciLCJPYmplY3QiLCJrZXlzIiwia2V5IiwiaW5jbHVkZXMiLCJwcm9jZXNzUGFnZSIsIl9yZWYiLCJlbnRyaWVzIiwidGl0bGUiLCJlbmQiLCJuZXh0IiwiX3VwZGF0ZUlkbGUiLCJzZWFyY2giLCJyZXMiLCJpbnRlcm5hbFBhZ2VTaXplIiwiYXV0aFN5bmMiLCJkbiIsInVuYmluZCIsImxvZyIsImxvZ19kZWJ1ZyIsImxvZ19pbmZvIiwibG9nX3dhcm4iLCJsb2dfZXJyb3IiLCJpc0xvZ0VuYWJsZWQiLCJMREFQX0xPR19FTkFCTEVEIiwibGV2ZWwiLCJtZXNzYWdlIiwiZGF0YSIsImNvbnNvbGUiLCJfbGVuIiwiYXJncyIsIl9rZXkiLCJfbGVuMiIsIl9rZXkyIiwiX2xlbjMiLCJfa2V5MyIsIl9sZW40IiwiX2tleTQiLCJzbHVnIiwiZ2V0TGRhcFVzZXJuYW1lIiwiZ2V0TGRhcEVtYWlsIiwiZ2V0TGRhcFVzZXJVbmlxdWVJRCIsInN5bmNVc2VyRGF0YSIsImFkZExkYXBVc2VyIiwiZmFsbGJhY2tEZWZhdWx0QWNjb3VudFN5c3RlbSIsImluZGV4T2YiLCJlbWFpbCIsImxvZ2luUmVxdWVzdCIsInVzZXIiLCJkaWdlc3QiLCJTSEEyNTYiLCJhbGdvcml0aG0iLCJBY2NvdW50cyIsIl9ydW5Mb2dpbkhhbmRsZXJzIiwicmVnaXN0ZXJMb2dpbkhhbmRsZXIiLCJsZGFwIiwibGRhcE9wdGlvbnMiLCJsZGFwUGFzcyIsInNlbGYiLCJ1c2VycyIsInVzZXJRdWVyeSIsImZpbmRPbmUiLCJhdXRoZW50aWNhdGlvbk1ldGhvZCIsInN0YW1wZWRUb2tlbiIsIl9nZW5lcmF0ZVN0YW1wZWRMb2dpblRva2VuIiwidXBkYXRlX2RhdGEiLCIkcHVzaCIsIl9oYXNoU3RhbXBlZFRva2VuIiwidGFyZ2V0R3JvdXBzIiwiaXNBZG1pbiIsInVwZGF0ZSIsIl9pZCIsIiRzZXQiLCJSb2xlcyIsInNldFVzZXJSb2xlcyIsInNldFBhc3N3b3JkIiwibG9nb3V0IiwidXNlcklkIiwidG9rZW4iLCJnZXRQcm9wZXJ0eVZhbHVlIiwiZ2V0TGRhcEZ1bGxuYW1lIiwiZ2V0RGF0YVRvU3luY1VzZXJEYXRhIiwiaW1wb3J0TmV3VXNlcnMiLCJfIiwiU3luY2VkQ3JvbiIsImRlZmluZVByb3BlcnR5IiwicHJvdG90eXBlIiwicHJvcCIsInRvTG93ZXJDYXNlIiwiZW51bWVyYWJsZSIsInRleHQiLCJzbHVnaWZ5IiwidGVtcGxhdGVWYXJIYW5kbGVyIiwidmFyaWFibGUiLCJvYmplY3QiLCJ0ZW1wbGF0ZVJlZ2V4IiwiZXhlYyIsInRtcFZhcmlhYmxlIiwiaGFzT3duUHJvcGVydHkiLCJ0bXBsVmFyIiwidG1wbEF0dHJOYW1lIiwiYXR0clZhbCIsIm9iaiIsInJlZHVjZSIsImFjYyIsImVsIiwiZXJyIiwidXNlcm5hbWVGaWVsZCIsImZpZWxkIiwiZ2V0TERBUFZhbHVlIiwiZW1haWxGaWVsZCIsImxkYXBNYWlsIiwiZnVsbG5hbWVGaWVsZCIsImZpbmQiLCJpc0VtcHR5Iiwic3luY1VzZXJEYXRhRmllbGRNYXAiLCJ0cmltIiwidXNlckRhdGEiLCJ3aGl0ZWxpc3RlZFVzZXJGaWVsZHMiLCJmaWVsZE1hcCIsImVtYWlsTGlzdCIsInVzZXJGaWVsZCIsImxkYXBGaWVsZCIsImlzT2JqZWN0IiwiYWRkcmVzcyIsInZlcmlmaWVkIiwib3V0ZXJLZXkiLCJpbm5lcktleXMiLCJjdXN0b21GaWVsZHNNZXRhIiwiZSIsInRtcFVzZXJGaWVsZCIsInRtcExkYXBGaWVsZCIsImRLZXlzIiwibGFzdEtleSIsImxhc3QiLCJjdXJyS2V5IiwiZW1haWxzIiwidW5pcXVlSWQiLCJzZXJ2aWNlcyIsImlkQXR0cmlidXRlIiwic2l6ZSIsImZ1bGxuYW1lIiwidXNlck9iamVjdCIsIm1haWwiLCJjcmVhdGVVc2VyIiwiY291bnQiLCJiaW5kRW52aXJvbm1lbnQiLCJsZGFwVXNlcnMiLCJzeW5jIiwiJGV4aXN0cyIsImpvYk5hbWUiLCJhZGRDcm9uSm9iIiwiZGVib3VuY2UiLCJhZGRDcm9uSm9iRGVib3VuY2VkIiwic2MiLCJuZXh0U2NoZWR1bGVkQXREYXRlIiwicmVtb3ZlIiwiYWRkIiwic2NoZWR1bGUiLCJwYXJzZXIiLCJyZWN1ciIsIm1pbnV0ZSIsImpvYiIsInN0YXJ0Iiwic3RhcnR1cCIsImRlZmVyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxNQUFNLENBQUNDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDOzs7Ozs7Ozs7OztBQ0E3QkQsTUFBTSxDQUFDRSxNQUFNLENBQUM7RUFBQ0MsT0FBTyxFQUFDQSxDQUFBLEtBQUlDO0FBQUksQ0FBQyxDQUFDO0FBQUMsSUFBSUMsTUFBTTtBQUFDTCxNQUFNLENBQUNDLElBQUksQ0FBQyxRQUFRLEVBQUM7RUFBQ0UsT0FBT0EsQ0FBQ0csQ0FBQyxFQUFDO0lBQUNELE1BQU0sR0FBQ0MsQ0FBQztFQUFBO0FBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztBQUFDLElBQUlDLEdBQUc7QUFBQ1AsTUFBTSxDQUFDQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUM7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QWxJLFFBQVEsQ0FBQywrQkFBK0IsQ0FBQztFQUN6Q3NJLEVBQUUsQ0FBQ0csR0FBRyxDQUFDO0lBQ0w1UCxJQUFJLEVBQUVxUCxPQUFPO0lBQ2JRLFFBQVEsRUFBRSxTQUFBQSxDQUFTQyxNQUFNLEVBQUU7TUFDM0IsSUFBSWhULElBQUksQ0FBQ21CLFlBQVksQ0FBQywrQkFBK0IsQ0FBQyxFQUFFO1FBQ3JELE9BQU82UixNQUFNLENBQUNyRSxJQUFJLENBQUMzTyxJQUFJLENBQUNtQixZQUFZLENBQUMsK0JBQStCLENBQUMsQ0FBQztNQUN6RSxDQUFDLE1BQ0k7UUFDRixPQUFPNlIsTUFBTSxDQUFDQyxLQUFLLENBQUMsQ0FBQyxDQUFDck4sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDc04sTUFBTSxDQUFDLENBQUM7TUFDdkM7SUFBQyxDQUFDO0lBQ0ZDLEdBQUcsRUFBRSxTQUFBQSxDQUFBLEVBQVc7TUFDZGQsSUFBSSxDQUFDLENBQUM7SUFDUjtFQUNGLENBQUMsQ0FBQztFQUNGTSxFQUFFLENBQUNTLEtBQUssQ0FBQyxDQUFDO0FBRVosQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDO0FBRVJ4UCxNQUFNLENBQUN5UCxPQUFPLENBQUMsTUFBTTtFQUNuQnpQLE1BQU0sQ0FBQzBQLEtBQUssQ0FBQyxNQUFNO0lBQ2pCLElBQUd0VCxJQUFJLENBQUNtQixZQUFZLENBQUMsc0JBQXNCLENBQUMsRUFBQztNQUFDcVIsVUFBVSxDQUFDLENBQUM7SUFBQztFQUM3RCxDQUFDLENBQUM7QUFDSixDQUFDLENBQUMsQyIsImZpbGUiOiIvcGFja2FnZXMvd2VrYW4tbGRhcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAnLi9sb2dpbkhhbmRsZXInO1xuIiwiaW1wb3J0IGxkYXBqcyBmcm9tICdsZGFwanMnO1xuaW1wb3J0IHsgTG9nIH0gZnJvbSAnbWV0ZW9yL2xvZ2dpbmcnO1xuXG4vLyBjb3BpZWQgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vbGRhcGpzL25vZGUtbGRhcGpzL2Jsb2IvYTExMzk1M2UwZDkxMjExZWI5NDVkMmEzOTUyYzg0YjdhZjZkZTQxYy9saWIvZmlsdGVycy9pbmRleC5qcyNMMTY3XG5mdW5jdGlvbiBlc2NhcGVkVG9IZXggKHN0cikge1xuICBpZiAoc3RyICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoL1xcXFwoWzAtOWEtZl1bXjAtOWEtZl18WzAtOWEtZl0kfFteMC05YS1mXXwkKS9naSwgZnVuY3Rpb24gKG1hdGNoLCBwMSkge1xuICAgICAgaWYgKCFwMSkge1xuICAgICAgICByZXR1cm4gJ1xcXFw1Yyc7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGhleENvZGUgPSBwMS5jaGFyQ29kZUF0KDApLnRvU3RyaW5nKDE2KTtcbiAgICAgIGNvbnN0IHJlc3QgPSBwMS5zdWJzdHJpbmcoMSk7XG4gICAgICByZXR1cm4gJ1xcXFwnICsgaGV4Q29kZSArIHJlc3Q7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBMREFQIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5sZGFwanMgPSBsZGFwanM7XG5cbiAgICB0aGlzLmNvbm5lY3RlZCA9IGZhbHNlO1xuXG4gICAgdGhpcy5vcHRpb25zID0ge1xuICAgICAgaG9zdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHRoaXMuY29uc3RydWN0b3Iuc2V0dGluZ3NfZ2V0KCdMREFQX0hPU1QnKSxcbiAgICAgIHBvcnQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiB0aGlzLmNvbnN0cnVjdG9yLnNldHRpbmdzX2dldCgnTERBUF9QT1JUJyksXG4gICAgICBSZWNvbm5lY3QgICAgICAgICAgICAgICAgICAgICAgICAgIDogdGhpcy5jb25zdHJ1Y3Rvci5zZXR0aW5nc19nZXQoJ0xEQVBfUkVDT05ORUNUJyksXG4gICAgICB0aW1lb3V0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogdGhpcy5jb25zdHJ1Y3Rvci5zZXR0aW5nc19nZXQoJ0xEQVBfVElNRU9VVCcpLFxuICAgICAgY29ubmVjdF90aW1lb3V0ICAgICAgICAgICAgICAgICAgICA6IHRoaXMuY29uc3RydWN0b3Iuc2V0dGluZ3NfZ2V0KCdMREFQX0NPTk5FQ1RfVElNRU9VVCcpLFxuICAgICAgaWRsZV90aW1lb3V0ICAgICAgICAgICAgICAgICAgICAgICA6IHRoaXMuY29uc3RydWN0b3Iuc2V0dGluZ3NfZ2V0KCdMREFQX0lETEVfVElNRU9VVCcpLFxuICAgICAgZW5jcnlwdGlvbiAgICAgICAgICAgICAgICAgICAgICAgICA6IHRoaXMuY29uc3RydWN0b3Iuc2V0dGluZ3NfZ2V0KCdMREFQX0VOQ1JZUFRJT04nKSxcbiAgICAgIGNhX2NlcnQgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiB0aGlzLmNvbnN0cnVjdG9yLnNldHRpbmdzX2dldCgnTERBUF9DQV9DRVJUJyksXG4gICAgICByZWplY3RfdW5hdXRob3JpemVkICAgICAgICAgICAgICAgIDogdGhpcy5jb25zdHJ1Y3Rvci5zZXR0aW5nc19nZXQoJ0xEQVBfUkVKRUNUX1VOQVVUSE9SSVpFRCcpICE9PSB1bmRlZmluZWQgPyB0aGlzLmNvbnN0cnVjdG9yLnNldHRpbmdzX2dldCgnTERBUF9SRUpFQ1RfVU5BVVRIT1JJWkVEJykgOiB0cnVlLFxuICAgICAgQXV0aGVudGljYXRpb24gICAgICAgICAgICAgICAgICAgICA6IHRoaXMuY29uc3RydWN0b3Iuc2V0dGluZ3NfZ2V0KCdMREFQX0FVVEhFTlRJRklDQVRJT04nKSxcbiAgICAgIEF1dGhlbnRpY2F0aW9uX1VzZXJETiAgICAgICAgICAgICAgOiB0aGlzLmNvbnN0cnVjdG9yLnNldHRpbmdzX2dldCgnTERBUF9BVVRIRU5USUZJQ0FUSU9OX1VTRVJETicpLFxuICAgICAgQXV0aGVudGljYXRpb25fUGFzc3dvcmQgICAgICAgICAgICA6IHRoaXMuY29uc3RydWN0b3Iuc2V0dGluZ3NfZ2V0KCdMREFQX0FVVEhFTlRJRklDQVRJT05fUEFTU1dPUkQnKSxcbiAgICAgIEF1dGhlbnRpY2F0aW9uX0ZhbGxiYWNrICAgICAgICAgICAgOiB0aGlzLmNvbnN0cnVjdG9yLnNldHRpbmdzX2dldCgnTERBUF9MT0dJTl9GQUxMQkFDSycpLFxuICAgICAgQmFzZUROICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHRoaXMuY29uc3RydWN0b3Iuc2V0dGluZ3NfZ2V0KCdMREFQX0JBU0VETicpLFxuICAgICAgSW50ZXJuYWxfTG9nX0xldmVsICAgICAgICAgICAgICAgICA6IHRoaXMuY29uc3RydWN0b3Iuc2V0dGluZ3NfZ2V0KCdJTlRFUk5BTF9MT0dfTEVWRUwnKSwgLy90aGlzIHNldHRpbmcgZG9lcyBub3QgaGF2ZSBhbnkgZWZmZWN0IGFueSBtb3JlIGFuZCBzaG91bGQgYmUgZGVwcmVjYXRlZFxuICAgICAgVXNlcl9BdXRoZW50aWNhdGlvbiAgICAgICAgICAgICAgICA6IHRoaXMuY29uc3RydWN0b3Iuc2V0dGluZ3NfZ2V0KCdMREFQX1VTRVJfQVVUSEVOVElDQVRJT04nKSxcbiAgICAgIFVzZXJfQXV0aGVudGljYXRpb25fRmllbGQgICAgICAgICAgOiB0aGlzLmNvbnN0cnVjdG9yLnNldHRpbmdzX2dldCgnTERBUF9VU0VSX0FVVEhFTlRJQ0FUSU9OX0ZJRUxEJyksXG4gICAgICBVc2VyX0F0dHJpYnV0ZXMgICAgICAgICAgICAgICAgICAgIDogdGhpcy5jb25zdHJ1Y3Rvci5zZXR0aW5nc19nZXQoJ0xEQVBfVVNFUl9BVFRSSUJVVEVTJyksXG4gICAgICBVc2VyX1NlYXJjaF9GaWx0ZXIgICAgICAgICAgICAgICAgIDogZXNjYXBlZFRvSGV4KHRoaXMuY29uc3RydWN0b3Iuc2V0dGluZ3NfZ2V0KCdMREFQX1VTRVJfU0VBUkNIX0ZJTFRFUicpKSxcbiAgICAgIFVzZXJfU2VhcmNoX1Njb3BlICAgICAgICAgICAgICAgICAgOiB0aGlzLmNvbnN0cnVjdG9yLnNldHRpbmdzX2dldCgnTERBUF9VU0VSX1NFQVJDSF9TQ09QRScpLFxuICAgICAgVXNlcl9TZWFyY2hfRmllbGQgICAgICAgICAgICAgICAgICA6IHRoaXMuY29uc3RydWN0b3Iuc2V0dGluZ3NfZ2V0KCdMREFQX1VTRVJfU0VBUkNIX0ZJRUxEJyksXG4gICAgICBTZWFyY2hfUGFnZV9TaXplICAgICAgICAgICAgICAgICAgIDogdGhpcy5jb25zdHJ1Y3Rvci5zZXR0aW5nc19nZXQoJ0xEQVBfU0VBUkNIX1BBR0VfU0laRScpLFxuICAgICAgU2VhcmNoX1NpemVfTGltaXQgICAgICAgICAgICAgICAgICA6IHRoaXMuY29uc3RydWN0b3Iuc2V0dGluZ3NfZ2V0KCdMREFQX1NFQVJDSF9TSVpFX0xJTUlUJyksXG4gICAgICBncm91cF9maWx0ZXJfZW5hYmxlZCAgICAgICAgICAgICAgIDogdGhpcy5jb25zdHJ1Y3Rvci5zZXR0aW5nc19nZXQoJ0xEQVBfR1JPVVBfRklMVEVSX0VOQUJMRScpLFxuICAgICAgZ3JvdXBfZmlsdGVyX29iamVjdF9jbGFzcyAgICAgICAgICA6IHRoaXMuY29uc3RydWN0b3Iuc2V0dGluZ3NfZ2V0KCdMREFQX0dST1VQX0ZJTFRFUl9PQkpFQ1RDTEFTUycpLFxuICAgICAgZ3JvdXBfZmlsdGVyX2dyb3VwX2lkX2F0dHJpYnV0ZSAgICA6IHRoaXMuY29uc3RydWN0b3Iuc2V0dGluZ3NfZ2V0KCdMREFQX0dST1VQX0ZJTFRFUl9HUk9VUF9JRF9BVFRSSUJVVEUnKSxcbiAgICAgIGdyb3VwX2ZpbHRlcl9ncm91cF9tZW1iZXJfYXR0cmlidXRlOiB0aGlzLmNvbnN0cnVjdG9yLnNldHRpbmdzX2dldCgnTERBUF9HUk9VUF9GSUxURVJfR1JPVVBfTUVNQkVSX0FUVFJJQlVURScpLFxuICAgICAgZ3JvdXBfZmlsdGVyX2dyb3VwX21lbWJlcl9mb3JtYXQgICA6IHRoaXMuY29uc3RydWN0b3Iuc2V0dGluZ3NfZ2V0KCdMREFQX0dST1VQX0ZJTFRFUl9HUk9VUF9NRU1CRVJfRk9STUFUJyksXG4gICAgICBncm91cF9maWx0ZXJfZ3JvdXBfbmFtZSAgICAgICAgICAgIDogdGhpcy5jb25zdHJ1Y3Rvci5zZXR0aW5nc19nZXQoJ0xEQVBfR1JPVVBfRklMVEVSX0dST1VQX05BTUUnKSxcbiAgICAgIEFEX1NpbXBsZV9BdXRoICAgICAgICAgICAgICAgICAgICAgOiB0aGlzLmNvbnN0cnVjdG9yLnNldHRpbmdzX2dldCgnTERBUF9BRF9TSU1QTEVfQVVUSCcpLFxuICAgICAgRGVmYXVsdF9Eb21haW4gICAgICAgICAgICAgICAgICAgICA6IHRoaXMuY29uc3RydWN0b3Iuc2V0dGluZ3NfZ2V0KCdMREFQX0RFRkFVTFRfRE9NQUlOJyksXG4gICAgfTtcbiAgfVxuXG4gIHN0YXRpYyBzZXR0aW5nc19nZXQobmFtZSwgLi4uYXJncykge1xuICAgIGxldCB2YWx1ZSA9IHByb2Nlc3MuZW52W25hbWVdO1xuICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodmFsdWUgPT09ICd0cnVlJyB8fCB2YWx1ZSA9PT0gJ2ZhbHNlJykge1xuICAgICAgICB2YWx1ZSA9IEpTT04ucGFyc2UodmFsdWUpO1xuICAgICAgfSBlbHNlIGlmICh2YWx1ZSAhPT0gJycgJiYgIWlzTmFOKHZhbHVlKSkge1xuICAgICAgICB2YWx1ZSA9IE51bWJlcih2YWx1ZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vTG9nLndhcm4oYExvb2t1cCBmb3IgdW5zZXQgdmFyaWFibGU6ICR7bmFtZX1gKTtcbiAgICB9XG4gIH1cblxuICBjb25uZWN0U3luYyguLi5hcmdzKSB7XG4gICAgIGlmICghdGhpcy5fY29ubmVjdFN5bmMpIHtcbiAgICAgIHRoaXMuX2Nvbm5lY3RTeW5jID0gTWV0ZW9yLndyYXBBc3luYyh0aGlzLmNvbm5lY3RBc3luYywgdGhpcyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9jb25uZWN0U3luYyguLi5hcmdzKTtcbiAgfVxuXG4gIHNlYXJjaEFsbFN5bmMoLi4uYXJncykge1xuXG4gICAgaWYgKCF0aGlzLl9zZWFyY2hBbGxTeW5jKSB7XG4gICAgICB0aGlzLl9zZWFyY2hBbGxTeW5jID0gTWV0ZW9yLndyYXBBc3luYyh0aGlzLnNlYXJjaEFsbEFzeW5jLCB0aGlzKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX3NlYXJjaEFsbFN5bmMoLi4uYXJncyk7XG4gIH1cblxuICBjb25uZWN0QXN5bmMoY2FsbGJhY2spIHtcbiAgICBMb2cuaW5mbygnSW5pdCBzZXR1cCcpO1xuXG4gICAgbGV0IHJlcGxpZWQgPSBmYWxzZTtcblxuICAgIGNvbnN0IGNvbm5lY3Rpb25PcHRpb25zID0ge1xuICAgICAgdXJsICAgICAgICAgICA6IGAke3RoaXMub3B0aW9ucy5ob3N0fToke3RoaXMub3B0aW9ucy5wb3J0fWAsXG4gICAgICB0aW1lb3V0ICAgICAgIDogdGhpcy5vcHRpb25zLnRpbWVvdXQsXG4gICAgICBjb25uZWN0VGltZW91dDogdGhpcy5vcHRpb25zLmNvbm5lY3RfdGltZW91dCxcbiAgICAgIGlkbGVUaW1lb3V0ICAgOiB0aGlzLm9wdGlvbnMuaWRsZV90aW1lb3V0LFxuICAgICAgcmVjb25uZWN0ICAgICA6IHRoaXMub3B0aW9ucy5SZWNvbm5lY3QsXG4gICAgfTtcblxuICAgIGNvbnN0IHRsc09wdGlvbnMgPSB7XG4gICAgICByZWplY3RVbmF1dGhvcml6ZWQ6IHRoaXMub3B0aW9ucy5yZWplY3RfdW5hdXRob3JpemVkLFxuICAgIH07XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNhX2NlcnQgJiYgdGhpcy5vcHRpb25zLmNhX2NlcnQgIT09ICcnKSB7XG4gICAgICAvLyBTcGxpdCBDQSBjZXJ0IGludG8gYXJyYXkgb2Ygc3RyaW5nc1xuICAgICAgY29uc3QgY2hhaW5MaW5lcyA9IHRoaXMuY29uc3RydWN0b3Iuc2V0dGluZ3NfZ2V0KCdMREFQX0NBX0NFUlQnKS5yZXBsYWNlKC9cXFxcbi9nLCdcXG4nKS5zcGxpdCgnXFxuJyk7XG4gICAgICBsZXQgY2VydCAgICAgICAgID0gW107XG4gICAgICBjb25zdCBjYSAgICAgICAgID0gW107XG4gICAgICBjaGFpbkxpbmVzLmZvckVhY2goKGxpbmUpID0+IHtcbiAgICAgICAgY2VydC5wdXNoKGxpbmUpO1xuICAgICAgICBpZiAobGluZS5tYXRjaCgvLUVORCBDRVJUSUZJQ0FURS0vKSkge1xuICAgICAgICAgIGNhLnB1c2goY2VydC5qb2luKCdcXG4nKSk7XG4gICAgICAgICAgY2VydCA9IFtdO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHRsc09wdGlvbnMuY2EgPSBjYTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmVuY3J5cHRpb24gPT09ICdzc2wnKSB7XG4gICAgICBjb25uZWN0aW9uT3B0aW9ucy51cmwgICAgICAgID0gYGxkYXBzOi8vJHtjb25uZWN0aW9uT3B0aW9ucy51cmx9YDtcbiAgICAgIGNvbm5lY3Rpb25PcHRpb25zLnRsc09wdGlvbnMgPSB0bHNPcHRpb25zO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25uZWN0aW9uT3B0aW9ucy51cmwgPSBgbGRhcDovLyR7Y29ubmVjdGlvbk9wdGlvbnMudXJsfWA7XG4gICAgfVxuXG4gICAgTG9nLmluZm8oYENvbm5lY3RpbmcgJHtjb25uZWN0aW9uT3B0aW9ucy51cmx9YCk7XG4gICAgTG9nLmRlYnVnKGBjb25uZWN0aW9uT3B0aW9ucyAke0pTT04uc3RyaW5naWZ5KGNvbm5lY3Rpb25PcHRpb25zKX1gKTtcblxuICAgIHRoaXMuY2xpZW50ID0gbGRhcGpzLmNyZWF0ZUNsaWVudChjb25uZWN0aW9uT3B0aW9ucyk7XG5cbiAgICB0aGlzLmJpbmRTeW5jID0gTWV0ZW9yLndyYXBBc3luYyh0aGlzLmNsaWVudC5iaW5kLCB0aGlzLmNsaWVudCk7XG5cbiAgICB0aGlzLmNsaWVudC5vbignZXJyb3InLCAoZXJyb3IpID0+IHtcbiAgICAgIExvZy5lcnJvcihgY29ubmVjdGlvbiAke2Vycm9yfWApO1xuICAgICAgaWYgKHJlcGxpZWQgPT09IGZhbHNlKSB7XG4gICAgICAgIHJlcGxpZWQgPSB0cnVlO1xuICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLmNsaWVudC5vbignaWRsZScsICgpID0+IHtcbiAgICAgIExvZy5pbmZvKCdJZGxlJyk7XG4gICAgICB0aGlzLmRpc2Nvbm5lY3QoKTtcbiAgICB9KTtcblxuICAgIHRoaXMuY2xpZW50Lm9uKCdjbG9zZScsICgpID0+IHtcbiAgICAgIExvZy5pbmZvKCdDbG9zZWQnKTtcbiAgICB9KTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuZW5jcnlwdGlvbiA9PT0gJ3RscycpIHtcbiAgICAgIC8vIFNldCBob3N0IHBhcmFtZXRlciBmb3IgdGxzLmNvbm5lY3Qgd2hpY2ggaXMgdXNlZCBieSBsZGFwanMgc3RhcnR0bHMuIFRoaXMgc2hvdWxkbid0IGJlIG5lZWRlZCBpbiBuZXdlciBub2RlanMgdmVyc2lvbnMgKGUuZyB2NS42LjApLlxuICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL1JvY2tldENoYXQvUm9ja2V0LkNoYXQvaXNzdWVzLzIwMzVcbiAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tY2F2YWdlL25vZGUtbGRhcGpzL2lzc3Vlcy8zNDlcbiAgICAgIHRsc09wdGlvbnMuaG9zdCA9IHRoaXMub3B0aW9ucy5ob3N0O1xuXG4gICAgICBMb2cuaW5mbygnU3RhcnRpbmcgVExTJyk7XG4gICAgICBMb2cuZGVidWcoYHRsc09wdGlvbnMgJHtKU09OLnN0cmluZ2lmeSh0bHNPcHRpb25zKX1gKTtcblxuICAgICAgdGhpcy5jbGllbnQuc3RhcnR0bHModGxzT3B0aW9ucywgbnVsbCwgKGVycm9yLCByZXNwb25zZSkgPT4ge1xuICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICBMb2cuZXJyb3IoYFRMUyBjb25uZWN0aW9uICR7SlNPTi5zdHJpbmdpZnkoZXJyb3IpfWApO1xuICAgICAgICAgIGlmIChyZXBsaWVkID09PSBmYWxzZSkge1xuICAgICAgICAgICAgcmVwbGllZCA9IHRydWU7XG4gICAgICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIExvZy5pbmZvKCdUTFMgY29ubmVjdGVkJyk7XG4gICAgICAgIHRoaXMuY29ubmVjdGVkID0gdHJ1ZTtcbiAgICAgICAgaWYgKHJlcGxpZWQgPT09IGZhbHNlKSB7XG4gICAgICAgICAgcmVwbGllZCA9IHRydWU7XG4gICAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzcG9uc2UpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jbGllbnQub24oJ2Nvbm5lY3QnLCAocmVzcG9uc2UpID0+IHtcbiAgICAgICAgTG9nLmluZm8oJ0xEQVAgY29ubmVjdGVkJyk7XG4gICAgICAgIHRoaXMuY29ubmVjdGVkID0gdHJ1ZTtcbiAgICAgICAgaWYgKHJlcGxpZWQgPT09IGZhbHNlKSB7XG4gICAgICAgICAgcmVwbGllZCA9IHRydWU7XG4gICAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzcG9uc2UpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGlmIChyZXBsaWVkID09PSBmYWxzZSkge1xuICAgICAgICBMb2cuZXJyb3IoYGNvbm5lY3Rpb24gdGltZSBvdXQgJHtjb25uZWN0aW9uT3B0aW9ucy5jb25uZWN0VGltZW91dH1gKTtcbiAgICAgICAgcmVwbGllZCA9IHRydWU7XG4gICAgICAgIGNhbGxiYWNrKG5ldyBFcnJvcignVGltZW91dCcpKTtcbiAgICAgIH1cbiAgICB9LCBjb25uZWN0aW9uT3B0aW9ucy5jb25uZWN0VGltZW91dCk7XG4gIH1cblxuICBnZXRVc2VyRmlsdGVyKHVzZXJuYW1lKSB7XG4gICAgY29uc3QgZmlsdGVyID0gW107XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLlVzZXJfU2VhcmNoX0ZpbHRlciAhPT0gJycpIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuVXNlcl9TZWFyY2hfRmlsdGVyWzBdID09PSAnKCcpIHtcbiAgICAgICAgZmlsdGVyLnB1c2goYCR7dGhpcy5vcHRpb25zLlVzZXJfU2VhcmNoX0ZpbHRlcn1gKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZpbHRlci5wdXNoKGAoJHt0aGlzLm9wdGlvbnMuVXNlcl9TZWFyY2hfRmlsdGVyfSlgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCB1c2VybmFtZUZpbHRlciA9IHRoaXMub3B0aW9ucy5Vc2VyX1NlYXJjaF9GaWVsZC5zcGxpdCgnLCcpLm1hcCgoaXRlbSkgPT4gYCgke2l0ZW19PSR7dXNlcm5hbWV9KWApO1xuXG4gICAgaWYgKHVzZXJuYW1lRmlsdGVyLmxlbmd0aCA9PT0gMCkge1xuICAgICAgTG9nLmVycm9yKCdMREFQX0xEQVBfVXNlcl9TZWFyY2hfRmllbGQgbm90IGRlZmluZWQnKTtcbiAgICB9IGVsc2UgaWYgKHVzZXJuYW1lRmlsdGVyLmxlbmd0aCA9PT0gMSkge1xuICAgICAgZmlsdGVyLnB1c2goYCR7dXNlcm5hbWVGaWx0ZXJbMF19YCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZpbHRlci5wdXNoKGAofCR7dXNlcm5hbWVGaWx0ZXIuam9pbignJyl9KWApO1xuICAgIH1cblxuICAgIHJldHVybiBgKCYke2ZpbHRlci5qb2luKCcnKX0pYDtcbiAgfVxuXG4gIGJpbmRVc2VySWZOZWNlc3NhcnkodXNlcm5hbWUsIHBhc3N3b3JkKSB7XG5cbiAgICBpZiAodGhpcy5kb21haW5CaW5kZWQgPT09IHRydWUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMub3B0aW9ucy5Vc2VyX0F1dGhlbnRpY2F0aW9uKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLyogaWYgU2ltcGxlQXV0aCBpcyBjb25maWd1cmVkLCB0aGUgQmFzZUROIGlzIG5vdCBuZWVkZWQgKi9cbiAgICBpZiAoIXRoaXMub3B0aW9ucy5CYXNlRE4gJiYgIXRoaXMub3B0aW9ucy5BRF9TaW1wbGVfQXV0aCkgdGhyb3cgbmV3IEVycm9yKCdCYXNlRE4gaXMgbm90IHByb3ZpZGVkJyk7XG5cbiAgICB2YXIgdXNlckRuID0gXCJcIjtcbiAgICBpZiAodGhpcy5vcHRpb25zLkFEX1NpbXBsZV9BdXRoID09PSB0cnVlIHx8IHRoaXMub3B0aW9ucy5BRF9TaW1wbGVfQXV0aCA9PT0gJ3RydWUnKSB7XG4gICAgICB1c2VyRG4gPSBgJHt1c2VybmFtZX1AJHt0aGlzLm9wdGlvbnMuRGVmYXVsdF9Eb21haW59YDtcbiAgICB9IGVsc2Uge1xuICAgICAgdXNlckRuID0gYCR7dGhpcy5vcHRpb25zLlVzZXJfQXV0aGVudGljYXRpb25fRmllbGR9PSR7dXNlcm5hbWV9LCR7dGhpcy5vcHRpb25zLkJhc2VETn1gO1xuICAgIH1cblxuICAgIExvZy5pbmZvKGBCaW5kaW5nIHdpdGggVXNlciAke3VzZXJEbn1gKTtcblxuICAgIHRoaXMuYmluZFN5bmModXNlckRuLCBwYXNzd29yZCk7XG4gICAgdGhpcy5kb21haW5CaW5kZWQgPSB0cnVlO1xuICB9XG5cbiAgYmluZElmTmVjZXNzYXJ5KCkge1xuICAgIGlmICh0aGlzLmRvbWFpbkJpbmRlZCA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMuQXV0aGVudGljYXRpb24gIT09IHRydWUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBMb2cuaW5mbyhgQmluZGluZyBVc2VyRE4gJHt0aGlzLm9wdGlvbnMuQXV0aGVudGljYXRpb25fVXNlckROfWApO1xuXG4gICAgdGhpcy5iaW5kU3luYyh0aGlzLm9wdGlvbnMuQXV0aGVudGljYXRpb25fVXNlckROLCB0aGlzLm9wdGlvbnMuQXV0aGVudGljYXRpb25fUGFzc3dvcmQpO1xuICAgIHRoaXMuZG9tYWluQmluZGVkID0gdHJ1ZTtcbiAgfVxuXG4gIHNlYXJjaFVzZXJzU3luYyh1c2VybmFtZSwgcGFnZSkge1xuICAgIHRoaXMuYmluZElmTmVjZXNzYXJ5KCk7XG4gICAgY29uc3Qgc2VhcmNoT3B0aW9ucyA9IHtcbiAgICAgIGZpbHRlciAgIDogdGhpcy5nZXRVc2VyRmlsdGVyKHVzZXJuYW1lKSxcbiAgICAgIHNjb3BlICAgIDogdGhpcy5vcHRpb25zLlVzZXJfU2VhcmNoX1Njb3BlIHx8ICdzdWInLFxuICAgICAgc2l6ZUxpbWl0OiB0aGlzLm9wdGlvbnMuU2VhcmNoX1NpemVfTGltaXQsXG4gICAgfTtcblxuICAgIGlmICghIXRoaXMub3B0aW9ucy5Vc2VyX0F0dHJpYnV0ZXMpIHNlYXJjaE9wdGlvbnMuYXR0cmlidXRlcyA9IHRoaXMub3B0aW9ucy5Vc2VyX0F0dHJpYnV0ZXMuc3BsaXQoJywnKTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuU2VhcmNoX1BhZ2VfU2l6ZSA+IDApIHtcbiAgICAgIHNlYXJjaE9wdGlvbnMucGFnZWQgPSB7XG4gICAgICAgIHBhZ2VTaXplIDogdGhpcy5vcHRpb25zLlNlYXJjaF9QYWdlX1NpemUsXG4gICAgICAgIHBhZ2VQYXVzZTogISFwYWdlLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBMb2cuaW5mbyhgU2VhcmNoaW5nIHVzZXIgJHt1c2VybmFtZX1gKTtcbiAgICBMb2cuZGVidWcoYHNlYXJjaE9wdGlvbnMgJHtzZWFyY2hPcHRpb25zfWApO1xuICAgIExvZy5kZWJ1ZyhgQmFzZUROICR7dGhpcy5vcHRpb25zLkJhc2VETn1gKTtcblxuICAgIGlmIChwYWdlKSB7XG4gICAgICByZXR1cm4gdGhpcy5zZWFyY2hBbGxQYWdlZCh0aGlzLm9wdGlvbnMuQmFzZUROLCBzZWFyY2hPcHRpb25zLCBwYWdlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5zZWFyY2hBbGxTeW5jKHRoaXMub3B0aW9ucy5CYXNlRE4sIHNlYXJjaE9wdGlvbnMpO1xuICB9XG5cbiAgZ2V0VXNlckJ5SWRTeW5jKGlkLCBhdHRyaWJ1dGUpIHtcbiAgICB0aGlzLmJpbmRJZk5lY2Vzc2FyeSgpO1xuXG4gICAgY29uc3QgVW5pcXVlX0lkZW50aWZpZXJfRmllbGQgPSB0aGlzLmNvbnN0cnVjdG9yLnNldHRpbmdzX2dldCgnTERBUF9VTklRVUVfSURFTlRJRklFUl9GSUVMRCcpLnNwbGl0KCcsJyk7XG5cbiAgICBsZXQgZmlsdGVyO1xuXG4gICAgaWYgKGF0dHJpYnV0ZSkge1xuICAgICAgZmlsdGVyID0gbmV3IHRoaXMubGRhcGpzLmZpbHRlcnMuRXF1YWxpdHlGaWx0ZXIoe1xuICAgICAgICBhdHRyaWJ1dGUsXG4gICAgICAgIHZhbHVlOiBCdWZmZXIuZnJvbShpZCwgJ2hleCcpLFxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGZpbHRlcnMgPSBbXTtcbiAgICAgIFVuaXF1ZV9JZGVudGlmaWVyX0ZpZWxkLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgICAgZmlsdGVycy5wdXNoKG5ldyB0aGlzLmxkYXBqcy5maWx0ZXJzLkVxdWFsaXR5RmlsdGVyKHtcbiAgICAgICAgICBhdHRyaWJ1dGU6IGl0ZW0sXG4gICAgICAgICAgdmFsdWUgICAgOiBCdWZmZXIuZnJvbShpZCwgJ2hleCcpLFxuICAgICAgICB9KSk7XG4gICAgICB9KTtcblxuICAgICAgZmlsdGVyID0gbmV3IHRoaXMubGRhcGpzLmZpbHRlcnMuT3JGaWx0ZXIoeyBmaWx0ZXJzIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHNlYXJjaE9wdGlvbnMgPSB7XG4gICAgICBmaWx0ZXIsXG4gICAgICBzY29wZTogJ3N1YicsXG4gICAgfTtcblxuICAgIExvZy5pbmZvKGBTZWFyY2hpbmcgYnkgaWQgJHtpZH1gKTtcbiAgICBMb2cuZGVidWcoYHNlYXJjaCBmaWx0ZXIgJHtzZWFyY2hPcHRpb25zLmZpbHRlci50b1N0cmluZygpfWApO1xuICAgIExvZy5kZWJ1ZyhgQmFzZUROICR7dGhpcy5vcHRpb25zLkJhc2VETn1gKTtcblxuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuc2VhcmNoQWxsU3luYyh0aGlzLm9wdGlvbnMuQmFzZUROLCBzZWFyY2hPcHRpb25zKTtcblxuICAgIGlmICghQXJyYXkuaXNBcnJheShyZXN1bHQpIHx8IHJlc3VsdC5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAocmVzdWx0Lmxlbmd0aCA+IDEpIHtcbiAgICAgIExvZy5lcnJvcihgU2VhcmNoIGJ5IGlkICR7aWR9IHJldHVybmVkICR7cmVzdWx0Lmxlbmd0aH0gcmVjb3Jkc2ApO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHRbMF07XG4gIH1cblxuICBnZXRVc2VyQnlVc2VybmFtZVN5bmModXNlcm5hbWUpIHtcbiAgICB0aGlzLmJpbmRJZk5lY2Vzc2FyeSgpO1xuXG4gICAgY29uc3Qgc2VhcmNoT3B0aW9ucyA9IHtcbiAgICAgIGZpbHRlcjogdGhpcy5nZXRVc2VyRmlsdGVyKHVzZXJuYW1lKSxcbiAgICAgIHNjb3BlIDogdGhpcy5vcHRpb25zLlVzZXJfU2VhcmNoX1Njb3BlIHx8ICdzdWInLFxuICAgIH07XG5cbiAgICBMb2cuaW5mbyhgU2VhcmNoaW5nIHVzZXIgJHt1c2VybmFtZX1gKTtcbiAgICBMb2cuZGVidWcoYHNlYXJjaE9wdGlvbnMgJHtzZWFyY2hPcHRpb25zfWApO1xuICAgIExvZy5kZWJ1ZyhgQmFzZUROICR7dGhpcy5vcHRpb25zLkJhc2VETn1gKTtcblxuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuc2VhcmNoQWxsU3luYyh0aGlzLm9wdGlvbnMuQmFzZUROLCBzZWFyY2hPcHRpb25zKTtcblxuICAgIGlmICghQXJyYXkuaXNBcnJheShyZXN1bHQpIHx8IHJlc3VsdC5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAocmVzdWx0Lmxlbmd0aCA+IDEpIHtcbiAgICAgIExvZy5lcnJvcihgU2VhcmNoIGJ5IHVzZXJuYW1lICR7dXNlcm5hbWV9IHJldHVybmVkICR7cmVzdWx0Lmxlbmd0aH0gcmVjb3Jkc2ApO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHRbMF07XG4gIH1cblxuICBnZXRVc2VyR3JvdXBzKHVzZXJuYW1lLCBsZGFwVXNlcikge1xuICAgIGlmICghdGhpcy5vcHRpb25zLmdyb3VwX2ZpbHRlcl9lbmFibGVkKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBjb25zdCBmaWx0ZXIgPSBbJygmJ107XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmdyb3VwX2ZpbHRlcl9vYmplY3RfY2xhc3MgIT09ICcnKSB7XG4gICAgICBmaWx0ZXIucHVzaChgKG9iamVjdGNsYXNzPSR7dGhpcy5vcHRpb25zLmdyb3VwX2ZpbHRlcl9vYmplY3RfY2xhc3N9KWApO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMuZ3JvdXBfZmlsdGVyX2dyb3VwX21lbWJlcl9hdHRyaWJ1dGUgIT09ICcnKSB7XG4gICAgICBjb25zdCBmb3JtYXRfdmFsdWUgPSBsZGFwVXNlclt0aGlzLm9wdGlvbnMuZ3JvdXBfZmlsdGVyX2dyb3VwX21lbWJlcl9mb3JtYXRdO1xuICAgICAgaWYgKGZvcm1hdF92YWx1ZSkge1xuICAgICAgICBmaWx0ZXIucHVzaChgKCR7dGhpcy5vcHRpb25zLmdyb3VwX2ZpbHRlcl9ncm91cF9tZW1iZXJfYXR0cmlidXRlfT0ke2Zvcm1hdF92YWx1ZX0pYCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZmlsdGVyLnB1c2goJyknKTtcblxuICAgIGNvbnN0IHNlYXJjaE9wdGlvbnMgPSB7XG4gICAgICBmaWx0ZXI6IGZpbHRlci5qb2luKCcnKS5yZXBsYWNlKC8je3VzZXJuYW1lfS9nLCB1c2VybmFtZSkucmVwbGFjZShcIlxcXFxcIiwgXCJcXFxcXFxcXFwiKSxcbiAgICAgIHNjb3BlIDogJ3N1YicsXG4gICAgfTtcblxuICAgIExvZy5kZWJ1ZyhgR3JvdXAgbGlzdCBmaWx0ZXIgTERBUDogJHtzZWFyY2hPcHRpb25zLmZpbHRlcn1gKTtcblxuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuc2VhcmNoQWxsU3luYyh0aGlzLm9wdGlvbnMuQmFzZUROLCBzZWFyY2hPcHRpb25zKTtcblxuICAgIGlmICghQXJyYXkuaXNBcnJheShyZXN1bHQpIHx8IHJlc3VsdC5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBjb25zdCBncnBfaWRlbnRpZmllciA9IHRoaXMub3B0aW9ucy5ncm91cF9maWx0ZXJfZ3JvdXBfaWRfYXR0cmlidXRlIHx8ICdjbic7XG4gICAgY29uc3QgZ3JvdXBzICAgICAgICAgPSBbXTtcbiAgICByZXN1bHQubWFwKChpdGVtKSA9PiB7XG4gICAgICBncm91cHMucHVzaChpdGVtW2dycF9pZGVudGlmaWVyXSk7XG4gICAgfSk7XG4gICAgTG9nLmRlYnVnKGBHcm91cHM6ICR7Z3JvdXBzLmpvaW4oJywgJyl9YCk7XG4gICAgcmV0dXJuIGdyb3VwcztcblxuICB9XG5cbiAgaXNVc2VySW5Hcm91cCh1c2VybmFtZSwgbGRhcFVzZXIpIHtcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5ncm91cF9maWx0ZXJfZW5hYmxlZCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgY29uc3QgZ3JwcyA9IHRoaXMuZ2V0VXNlckdyb3Vwcyh1c2VybmFtZSwgbGRhcFVzZXIpO1xuXG4gICAgY29uc3QgZmlsdGVyID0gWycoJiddO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5ncm91cF9maWx0ZXJfb2JqZWN0X2NsYXNzICE9PSAnJykge1xuICAgICAgZmlsdGVyLnB1c2goYChvYmplY3RjbGFzcz0ke3RoaXMub3B0aW9ucy5ncm91cF9maWx0ZXJfb2JqZWN0X2NsYXNzfSlgKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmdyb3VwX2ZpbHRlcl9ncm91cF9tZW1iZXJfYXR0cmlidXRlICE9PSAnJykge1xuICAgICAgY29uc3QgZm9ybWF0X3ZhbHVlID0gbGRhcFVzZXJbdGhpcy5vcHRpb25zLmdyb3VwX2ZpbHRlcl9ncm91cF9tZW1iZXJfZm9ybWF0XTtcbiAgICAgIGlmIChmb3JtYXRfdmFsdWUpIHtcbiAgICAgICAgZmlsdGVyLnB1c2goYCgke3RoaXMub3B0aW9ucy5ncm91cF9maWx0ZXJfZ3JvdXBfbWVtYmVyX2F0dHJpYnV0ZX09JHtmb3JtYXRfdmFsdWV9KWApO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMuZ3JvdXBfZmlsdGVyX2dyb3VwX2lkX2F0dHJpYnV0ZSAhPT0gJycpIHtcbiAgICAgIGZpbHRlci5wdXNoKGAoJHt0aGlzLm9wdGlvbnMuZ3JvdXBfZmlsdGVyX2dyb3VwX2lkX2F0dHJpYnV0ZX09JHt0aGlzLm9wdGlvbnMuZ3JvdXBfZmlsdGVyX2dyb3VwX25hbWV9KWApO1xuICAgIH1cbiAgICBmaWx0ZXIucHVzaCgnKScpO1xuXG4gICAgY29uc3Qgc2VhcmNoT3B0aW9ucyA9IHtcbiAgICAgIGZpbHRlcjogZmlsdGVyLmpvaW4oJycpLnJlcGxhY2UoLyN7dXNlcm5hbWV9L2csIHVzZXJuYW1lKS5yZXBsYWNlKFwiXFxcXFwiLCBcIlxcXFxcXFxcXCIpLFxuICAgICAgc2NvcGUgOiAnc3ViJyxcbiAgICB9O1xuXG4gICAgTG9nLmRlYnVnKGBHcm91cCBmaWx0ZXIgTERBUDogJHtzZWFyY2hPcHRpb25zLmZpbHRlcn1gKTtcblxuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuc2VhcmNoQWxsU3luYyh0aGlzLm9wdGlvbnMuQmFzZUROLCBzZWFyY2hPcHRpb25zKTtcblxuICAgIGlmICghQXJyYXkuaXNBcnJheShyZXN1bHQpIHx8IHJlc3VsdC5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBleHRyYWN0TGRhcEVudHJ5RGF0YShlbnRyeSkge1xuICAgIGNvbnN0IHZhbHVlcyA9IHtcbiAgICAgIF9yYXc6IGVudHJ5LnJhdyxcbiAgICB9O1xuXG4gICAgT2JqZWN0LmtleXModmFsdWVzLl9yYXcpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgY29uc3QgdmFsdWUgPSB2YWx1ZXMuX3Jhd1trZXldO1xuXG4gICAgICBpZiAoIVsndGh1bWJuYWlsUGhvdG8nLCAnanBlZ1Bob3RvJ10uaW5jbHVkZXMoa2V5KSkge1xuICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBCdWZmZXIpIHtcbiAgICAgICAgICB2YWx1ZXNba2V5XSA9IHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFsdWVzW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHZhbHVlcztcbiAgfVxuXG4gIHNlYXJjaEFsbFBhZ2VkKEJhc2VETiwgb3B0aW9ucywgcGFnZSkge1xuICAgIHRoaXMuYmluZElmTmVjZXNzYXJ5KCk7XG5cbiAgICBjb25zdCBwcm9jZXNzUGFnZSA9ICh7IGVudHJpZXMsIHRpdGxlLCBlbmQsIG5leHQgfSkgPT4ge1xuICAgICAgTG9nLmluZm8odGl0bGUpO1xuICAgICAgLy8gRm9yY2UgTERBUCBpZGxlIHRvIHdhaXQgdGhlIHJlY29yZCBwcm9jZXNzaW5nXG4gICAgICB0aGlzLmNsaWVudC5fdXBkYXRlSWRsZSh0cnVlKTtcbiAgICAgIHBhZ2UobnVsbCwgZW50cmllcywge1xuICAgICAgICBlbmQsIG5leHQ6ICgpID0+IHtcbiAgICAgICAgICAvLyBSZXNldCBpZGxlIHRpbWVyXG4gICAgICAgICAgdGhpcy5jbGllbnQuX3VwZGF0ZUlkbGUoKTtcbiAgICAgICAgICBuZXh0ICYmIG5leHQoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHRoaXMuY2xpZW50LnNlYXJjaChCYXNlRE4sIG9wdGlvbnMsIChlcnJvciwgcmVzKSA9PiB7XG4gICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgTG9nLmVycm9yKGVycm9yKTtcbiAgICAgICAgcGFnZShlcnJvcik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcmVzLm9uKCdlcnJvcicsIChlcnJvcikgPT4ge1xuICAgICAgICBMb2cuZXJyb3IoZXJyb3IpO1xuICAgICAgICBwYWdlKGVycm9yKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSk7XG5cbiAgICAgIGxldCBlbnRyaWVzID0gW107XG5cbiAgICAgIGNvbnN0IGludGVybmFsUGFnZVNpemUgPSBvcHRpb25zLnBhZ2VkICYmIG9wdGlvbnMucGFnZWQucGFnZVNpemUgPiAwID8gb3B0aW9ucy5wYWdlZC5wYWdlU2l6ZSAqIDIgOiA1MDA7XG5cbiAgICAgIHJlcy5vbignc2VhcmNoRW50cnknLCAoZW50cnkpID0+IHtcbiAgICAgICAgZW50cmllcy5wdXNoKHRoaXMuZXh0cmFjdExkYXBFbnRyeURhdGEoZW50cnkpKTtcblxuICAgICAgICBpZiAoZW50cmllcy5sZW5ndGggPj0gaW50ZXJuYWxQYWdlU2l6ZSkge1xuICAgICAgICAgIHByb2Nlc3NQYWdlKHtcbiAgICAgICAgICAgIGVudHJpZXMsXG4gICAgICAgICAgICB0aXRsZTogJ0ludGVybmFsIFBhZ2UnLFxuICAgICAgICAgICAgZW5kICA6IGZhbHNlLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGVudHJpZXMgPSBbXTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHJlcy5vbigncGFnZScsIChyZXN1bHQsIG5leHQpID0+IHtcbiAgICAgICAgaWYgKCFuZXh0KSB7XG4gICAgICAgICAgdGhpcy5jbGllbnQuX3VwZGF0ZUlkbGUodHJ1ZSk7XG4gICAgICAgICAgcHJvY2Vzc1BhZ2Uoe1xuICAgICAgICAgICAgZW50cmllcyxcbiAgICAgICAgICAgIHRpdGxlOiAnRmluYWwgUGFnZScsXG4gICAgICAgICAgICBlbmQgIDogdHJ1ZSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChlbnRyaWVzLmxlbmd0aCkge1xuICAgICAgICAgIExvZy5pbmZvKCdQYWdlJyk7XG4gICAgICAgICAgcHJvY2Vzc1BhZ2Uoe1xuICAgICAgICAgICAgZW50cmllcyxcbiAgICAgICAgICAgIHRpdGxlOiAnUGFnZScsXG4gICAgICAgICAgICBlbmQgIDogZmFsc2UsXG4gICAgICAgICAgICBuZXh0LFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGVudHJpZXMgPSBbXTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHJlcy5vbignZW5kJywgKCkgPT4ge1xuICAgICAgICBpZiAoZW50cmllcy5sZW5ndGgpIHtcbiAgICAgICAgICBwcm9jZXNzUGFnZSh7XG4gICAgICAgICAgICBlbnRyaWVzLFxuICAgICAgICAgICAgdGl0bGU6ICdGaW5hbCBQYWdlJyxcbiAgICAgICAgICAgIGVuZCAgOiB0cnVlLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGVudHJpZXMgPSBbXTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBzZWFyY2hBbGxBc3luYyhCYXNlRE4sIG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gICAgdGhpcy5iaW5kSWZOZWNlc3NhcnkoKTtcblxuICAgIHRoaXMuY2xpZW50LnNlYXJjaChCYXNlRE4sIG9wdGlvbnMsIChlcnJvciwgcmVzKSA9PiB7XG4gICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgTG9nLmVycm9yKGVycm9yKTtcbiAgICAgICAgY2FsbGJhY2soZXJyb3IpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHJlcy5vbignZXJyb3InLCAoZXJyb3IpID0+IHtcbiAgICAgICAgTG9nLmVycm9yKGVycm9yKTtcbiAgICAgICAgY2FsbGJhY2soZXJyb3IpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9KTtcblxuICAgICAgY29uc3QgZW50cmllcyA9IFtdO1xuXG4gICAgICByZXMub24oJ3NlYXJjaEVudHJ5JywgKGVudHJ5KSA9PiB7XG4gICAgICAgIGVudHJpZXMucHVzaCh0aGlzLmV4dHJhY3RMZGFwRW50cnlEYXRhKGVudHJ5KSk7XG4gICAgICB9KTtcblxuICAgICAgcmVzLm9uKCdlbmQnLCAoKSA9PiB7XG4gICAgICAgIExvZy5pbmZvKGBTZWFyY2ggcmVzdWx0IGNvdW50ICR7ZW50cmllcy5sZW5ndGh9YCk7XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIGVudHJpZXMpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBhdXRoU3luYyhkbiwgcGFzc3dvcmQpIHtcbiAgICBMb2cuaW5mbyhgQXV0aGVudGljYXRpbmcgJHtkbn1gKTtcblxuICAgIHRyeSB7XG4gICAgICBpZiAocGFzc3dvcmQgPT09ICcnKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignUGFzc3dvcmQgaXMgbm90IHByb3ZpZGVkJyk7XG4gICAgICB9XG4gICAgICB0aGlzLmJpbmRTeW5jKGRuLCBwYXNzd29yZCk7XG4gICAgICBMb2cuaW5mbyhgQXV0aGVudGljYXRlZCAke2RufWApO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIExvZy5pbmZvKGBOb3QgYXV0aGVudGljYXRlZCAke2RufWApO1xuICAgICAgTG9nLmRlYnVnKCdlcnJvcicsIGVycm9yKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBkaXNjb25uZWN0KCkge1xuICAgIHRoaXMuY29ubmVjdGVkICAgID0gZmFsc2U7XG4gICAgdGhpcy5kb21haW5CaW5kZWQgPSBmYWxzZTtcbiAgICBMb2cuaW5mbygnRGlzY29uZWN0aW5nJyk7XG4gICAgdGhpcy5jbGllbnQudW5iaW5kKCk7XG4gIH1cbn1cbiIsImNvbnN0IGlzTG9nRW5hYmxlZCA9IChwcm9jZXNzLmVudi5MREFQX0xPR19FTkFCTEVEID09PSAndHJ1ZScpO1xuXG5cbmZ1bmN0aW9uIGxvZyAobGV2ZWwsIG1lc3NhZ2UsIGRhdGEpIHsgXG4gICAgaWYgKGlzTG9nRW5hYmxlZCkge1xuICAgICAgICBjb25zb2xlLmxvZyhgWyR7bGV2ZWx9XSAke21lc3NhZ2V9ICR7IGRhdGEgPyBKU09OLnN0cmluZ2lmeShkYXRhLCBudWxsLCAyKSA6ICcnIH1gKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGxvZ19kZWJ1ZyAoLi4uYXJncykgeyBsb2coJ0RFQlVHJywgLi4uYXJncyk7IH1cbmZ1bmN0aW9uIGxvZ19pbmZvICguLi5hcmdzKSB7IGxvZygnSU5GTycsIC4uLmFyZ3MpOyB9XG5mdW5jdGlvbiBsb2dfd2FybiAoLi4uYXJncykgeyBsb2coJ1dBUk4nLCAuLi5hcmdzKTsgfVxuZnVuY3Rpb24gbG9nX2Vycm9yICguLi5hcmdzKSB7IGxvZygnRVJST1InLCAuLi5hcmdzKTsgfVxuXG5leHBvcnQgeyBsb2csIGxvZ19kZWJ1ZywgbG9nX2luZm8sIGxvZ193YXJuLCBsb2dfZXJyb3IgfTtcbiIsImltcG9ydCB7c2x1ZywgZ2V0TGRhcFVzZXJuYW1lLCBnZXRMZGFwRW1haWwsIGdldExkYXBVc2VyVW5pcXVlSUQsIHN5bmNVc2VyRGF0YSwgYWRkTGRhcFVzZXJ9IGZyb20gJy4vc3luYyc7XG5pbXBvcnQgTERBUCBmcm9tICcuL2xkYXAnO1xuaW1wb3J0IHsgbG9nX2RlYnVnLCBsb2dfaW5mbywgbG9nX3dhcm4sIGxvZ19lcnJvciB9IGZyb20gJy4vbG9nZ2VyJztcblxuZnVuY3Rpb24gZmFsbGJhY2tEZWZhdWx0QWNjb3VudFN5c3RlbShiaW5kLCB1c2VybmFtZSwgcGFzc3dvcmQpIHtcbiAgaWYgKHR5cGVvZiB1c2VybmFtZSA9PT0gJ3N0cmluZycpIHtcbiAgICBpZiAodXNlcm5hbWUuaW5kZXhPZignQCcpID09PSAtMSkge1xuICAgICAgdXNlcm5hbWUgPSB7dXNlcm5hbWV9O1xuICAgIH0gZWxzZSB7XG4gICAgICB1c2VybmFtZSA9IHtlbWFpbDogdXNlcm5hbWV9O1xuICAgIH1cbiAgfVxuXG4gIGxvZ19pbmZvKCdGYWxsYmFjayB0byBkZWZhdWx0IGFjY291bnQgc3lzdGVtOiAnLCB1c2VybmFtZSApO1xuXG4gIGNvbnN0IGxvZ2luUmVxdWVzdCA9IHtcbiAgICB1c2VyOiB1c2VybmFtZSxcbiAgICBwYXNzd29yZDoge1xuICAgICAgZGlnZXN0OiBTSEEyNTYocGFzc3dvcmQpLFxuICAgICAgYWxnb3JpdGhtOiAnc2hhLTI1NicsXG4gICAgfSxcbiAgfTtcbiAgbG9nX2RlYnVnKCdGYWxsYmFjayBvcHRpb25zOiAnLCBsb2dpblJlcXVlc3QpO1xuXG4gIHJldHVybiBBY2NvdW50cy5fcnVuTG9naW5IYW5kbGVycyhiaW5kLCBsb2dpblJlcXVlc3QpO1xufVxuXG5BY2NvdW50cy5yZWdpc3RlckxvZ2luSGFuZGxlcignbGRhcCcsIGZ1bmN0aW9uKGxvZ2luUmVxdWVzdCkge1xuICBpZiAoIWxvZ2luUmVxdWVzdC5sZGFwIHx8ICFsb2dpblJlcXVlc3QubGRhcE9wdGlvbnMpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgbG9nX2luZm8oJ0luaXQgTERBUCBsb2dpbicsIGxvZ2luUmVxdWVzdC51c2VybmFtZSk7XG5cbiAgaWYgKExEQVAuc2V0dGluZ3NfZ2V0KCdMREFQX0VOQUJMRScpICE9PSB0cnVlKSB7XG4gICAgcmV0dXJuIGZhbGxiYWNrRGVmYXVsdEFjY291bnRTeXN0ZW0odGhpcywgbG9naW5SZXF1ZXN0LnVzZXJuYW1lLCBsb2dpblJlcXVlc3QubGRhcFBhc3MpO1xuICB9XG5cbiAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gIGNvbnN0IGxkYXAgPSBuZXcgTERBUCgpO1xuICBsZXQgbGRhcFVzZXI7XG5cbiAgdHJ5IHtcblxuICAgICAgbGRhcC5jb25uZWN0U3luYygpO1xuXG4gICAgIGlmICghIUxEQVAuc2V0dGluZ3NfZ2V0KCdMREFQX1VTRVJfQVVUSEVOVElDQVRJT04nKSkge1xuICAgICAgICBsZGFwLmJpbmRVc2VySWZOZWNlc3NhcnkobG9naW5SZXF1ZXN0LnVzZXJuYW1lLCBsb2dpblJlcXVlc3QubGRhcFBhc3MpO1xuICAgICAgIGxkYXBVc2VyID0gbGRhcC5zZWFyY2hVc2Vyc1N5bmMobG9naW5SZXF1ZXN0LnVzZXJuYW1lKVswXTtcbiAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgY29uc3QgdXNlcnMgPSBsZGFwLnNlYXJjaFVzZXJzU3luYyhsb2dpblJlcXVlc3QudXNlcm5hbWUpO1xuXG4gICAgICAgaWYgKHVzZXJzLmxlbmd0aCAhPT0gMSkge1xuICAgICAgICAgbG9nX2luZm8oJ1NlYXJjaCByZXR1cm5lZCcsIHVzZXJzLmxlbmd0aCwgJ3JlY29yZChzKSBmb3InLCBsb2dpblJlcXVlc3QudXNlcm5hbWUpO1xuICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVc2VyIG5vdCBGb3VuZCcpO1xuICAgICAgIH1cblxuICAgICAgaWYgKGxkYXAuaXNVc2VySW5Hcm91cChsb2dpblJlcXVlc3QudXNlcm5hbWUsIHVzZXJzWzBdKSkge1xuICAgICAgICBsZGFwVXNlciA9IHVzZXJzWzBdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVc2VyIG5vdCBpbiBhIHZhbGlkIGdyb3VwJyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChsZGFwLmF1dGhTeW5jKHVzZXJzWzBdLmRuLCBsb2dpblJlcXVlc3QubGRhcFBhc3MpICE9PSB0cnVlKSB7XG4gICAgICAgIGxkYXBVc2VyID0gbnVsbDtcbiAgICAgICAgbG9nX2luZm8oJ1dyb25nIHBhc3N3b3JkIGZvcicsIGxvZ2luUmVxdWVzdC51c2VybmFtZSlcbiAgICAgIH1cbiAgICAgfVxuXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgIGxvZ19lcnJvcihlcnJvcik7XG4gIH1cblxuICBpZiAoIWxkYXBVc2VyKSB7XG4gICAgaWYgKExEQVAuc2V0dGluZ3NfZ2V0KCdMREFQX0xPR0lOX0ZBTExCQUNLJykgPT09IHRydWUpIHtcbiAgICAgIHJldHVybiBmYWxsYmFja0RlZmF1bHRBY2NvdW50U3lzdGVtKHNlbGYsIGxvZ2luUmVxdWVzdC51c2VybmFtZSwgbG9naW5SZXF1ZXN0LmxkYXBQYXNzKTtcbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdMREFQLWxvZ2luLWVycm9yJywgYExEQVAgQXV0aGVudGljYXRpb24gZmFpbGVkIHdpdGggcHJvdmlkZWQgdXNlcm5hbWUgWyR7IGxvZ2luUmVxdWVzdC51c2VybmFtZSB9XWApO1xuICB9XG5cbiAgLy8gTG9vayB0byBzZWUgaWYgdXNlciBhbHJlYWR5IGV4aXN0c1xuXG4gIGxldCB1c2VyUXVlcnk7XG5cbiAgY29uc3QgVW5pcXVlX0lkZW50aWZpZXJfRmllbGQgPSBnZXRMZGFwVXNlclVuaXF1ZUlEKGxkYXBVc2VyKTtcbiAgbGV0IHVzZXI7XG4gICAvLyBBdHRlbXB0IHRvIGZpbmQgdXNlciBieSB1bmlxdWUgaWRlbnRpZmllclxuXG4gIGlmIChVbmlxdWVfSWRlbnRpZmllcl9GaWVsZCkge1xuICAgIHVzZXJRdWVyeSA9IHtcbiAgICAgICdzZXJ2aWNlcy5sZGFwLmlkJzogVW5pcXVlX0lkZW50aWZpZXJfRmllbGQudmFsdWUsXG4gICAgfTtcblxuICAgIGxvZ19pbmZvKCdRdWVyeWluZyB1c2VyJyk7XG4gICAgbG9nX2RlYnVnKCd1c2VyUXVlcnknLCB1c2VyUXVlcnkpO1xuXG4gICAgdXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKHVzZXJRdWVyeSk7XG4gICB9XG5cbiAgLy8gQXR0ZW1wdCB0byBmaW5kIHVzZXIgYnkgdXNlcm5hbWVcblxuICBsZXQgdXNlcm5hbWU7XG4gIGxldCBlbWFpbDtcblxuICAgaWYgKExEQVAuc2V0dGluZ3NfZ2V0KCdMREFQX1VTRVJOQU1FX0ZJRUxEJykgIT09ICcnKSB7XG4gICAgdXNlcm5hbWUgPSBzbHVnKGdldExkYXBVc2VybmFtZShsZGFwVXNlcikpO1xuICB9IGVsc2Uge1xuICAgIHVzZXJuYW1lID0gc2x1Zyhsb2dpblJlcXVlc3QudXNlcm5hbWUpO1xuICB9XG5cbiAgaWYoTERBUC5zZXR0aW5nc19nZXQoJ0xEQVBfRU1BSUxfRklFTEQnKSAhPT0gJycpIHtcbiAgICBlbWFpbCA9IGdldExkYXBFbWFpbChsZGFwVXNlcik7XG4gIH1cblxuXG4gIGlmICghdXNlcikge1xuICAgIGlmKGVtYWlsICYmIExEQVAuc2V0dGluZ3NfZ2V0KCdMREFQX0VNQUlMX01BVENIX1JFUVVJUkUnKSA9PT0gdHJ1ZSkge1xuICAgICAgaWYoTERBUC5zZXR0aW5nc19nZXQoJ0xEQVBfRU1BSUxfTUFUQ0hfVkVSSUZJRUQnKSA9PT0gdHJ1ZSkge1xuICAgICAgICB1c2VyUXVlcnkgPSB7XG4gICAgICAgICAgJ19pZCcgOiB1c2VybmFtZSxcbiAgICAgICAgICAnZW1haWxzLjAuYWRkcmVzcycgOiBlbWFpbCxcbiAgICAgICAgICAnZW1haWxzLjAudmVyaWZpZWQnIDogdHJ1ZVxuICAgICAgICB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdXNlclF1ZXJ5ID0ge1xuICAgICAgICAgICdfaWQnIDogdXNlcm5hbWUsXG4gICAgICAgICAgJ2VtYWlscy4wLmFkZHJlc3MnIDogZW1haWxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdXNlclF1ZXJ5ID0ge1xuICAgICAgICB1c2VybmFtZVxuICAgICAgfTtcbiAgICB9XG5cbiAgICBsb2dfZGVidWcoJ3VzZXJRdWVyeScsIHVzZXJRdWVyeSk7XG5cbiAgICB1c2VyID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmUodXNlclF1ZXJ5KTtcbiAgfVxuXG4gIC8vIEF0dGVtcHQgdG8gZmluZCB1c2VyIGJ5IGUtbWFpbCBhZGRyZXNzIG9ubHlcblxuICBpZiAoIXVzZXIgJiYgZW1haWwgJiYgTERBUC5zZXR0aW5nc19nZXQoJ0xEQVBfRU1BSUxfTUFUQ0hfRU5BQkxFJykgPT09IHRydWUpIHtcblxuICAgIGxvZ19pbmZvKCdObyB1c2VyIGV4aXN0cyB3aXRoIHVzZXJuYW1lJywgdXNlcm5hbWUsICctIGF0dGVtcHRpbmcgdG8gZmluZCBieSBlLW1haWwgYWRkcmVzcyBpbnN0ZWFkJyk7XG5cbiAgICBpZihMREFQLnNldHRpbmdzX2dldCgnTERBUF9FTUFJTF9NQVRDSF9WRVJJRklFRCcpID09PSB0cnVlKSB7XG4gICAgICB1c2VyUXVlcnkgPSB7XG4gICAgICAgICdlbWFpbHMuMC5hZGRyZXNzJzogZW1haWwsXG4gICAgICAgICdlbWFpbHMuMC52ZXJpZmllZCcgOiB0cnVlXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICB1c2VyUXVlcnkgPSB7XG4gICAgICAgICdlbWFpbHMuMC5hZGRyZXNzJyA6IGVtYWlsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGxvZ19kZWJ1ZygndXNlclF1ZXJ5JywgdXNlclF1ZXJ5KTtcblxuICAgIHVzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZSh1c2VyUXVlcnkpO1xuXG4gIH1cblxuICAvLyBMb2dpbiB1c2VyIGlmIHRoZXkgZXhpc3RcbiAgaWYgKHVzZXIpIHtcbiAgICBpZiAodXNlci5hdXRoZW50aWNhdGlvbk1ldGhvZCAhPT0gJ2xkYXAnICYmIExEQVAuc2V0dGluZ3NfZ2V0KCdMREFQX01FUkdFX0VYSVNUSU5HX1VTRVJTJykgIT09IHRydWUpIHtcbiAgICAgIGxvZ19pbmZvKCdVc2VyIGV4aXN0cyB3aXRob3V0IFwiYXV0aGVudGljYXRpb25NZXRob2QgOiBsZGFwXCInKTtcbiAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ0xEQVAtbG9naW4tZXJyb3InLCBgTERBUCBBdXRoZW50aWNhdGlvbiBzdWNjZWRlZCwgYnV0IHRoZXJlJ3MgYWxyZWFkeSBhIG1hdGNoaW5nIFdla2FuIGFjY291bnQgaW4gTW9uZ29EQmApO1xuICAgIH1cblxuICAgIGxvZ19pbmZvKCdMb2dnaW5nIHVzZXInKTtcblxuICAgIGNvbnN0IHN0YW1wZWRUb2tlbiA9IEFjY291bnRzLl9nZW5lcmF0ZVN0YW1wZWRMb2dpblRva2VuKCk7XG4gICAgY29uc3QgdXBkYXRlX2RhdGEgPSB7XG4gICAgICAkcHVzaDoge1xuICAgICAgICAnc2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zJzogQWNjb3VudHMuX2hhc2hTdGFtcGVkVG9rZW4oc3RhbXBlZFRva2VuKSxcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIGlmIChMREFQLnNldHRpbmdzX2dldCgnTERBUF9TWU5DX0FETUlOX1NUQVRVUycpID09PSB0cnVlKSB7XG4gICAgICBsb2dfZGVidWcoJ1VwZGF0aW5nIGFkbWluIHN0YXR1cycpO1xuICAgICAgY29uc3QgdGFyZ2V0R3JvdXBzID0gTERBUC5zZXR0aW5nc19nZXQoJ0xEQVBfU1lOQ19BRE1JTl9HUk9VUFMnKS5zcGxpdCgnLCcpO1xuICAgICAgY29uc3QgZ3JvdXBzID0gbGRhcC5nZXRVc2VyR3JvdXBzKHVzZXJuYW1lLCBsZGFwVXNlcikuZmlsdGVyKCh2YWx1ZSkgPT4gdGFyZ2V0R3JvdXBzLmluY2x1ZGVzKHZhbHVlKSk7XG5cbiAgICAgIHVzZXIuaXNBZG1pbiA9IGdyb3Vwcy5sZW5ndGggPiAwO1xuICAgICAgTWV0ZW9yLnVzZXJzLnVwZGF0ZSh7X2lkOiB1c2VyLl9pZH0sIHskc2V0OiB7aXNBZG1pbjogdXNlci5pc0FkbWlufX0pO1xuICAgIH1cblxuICAgIGlmKCBMREFQLnNldHRpbmdzX2dldCgnTERBUF9TWU5DX0dST1VQX1JPTEVTJykgPT09IHRydWUgKSB7XG4gICAgICBsb2dfZGVidWcoJ1VwZGF0aW5nIEdyb3Vwcy9Sb2xlcycpO1xuICAgICAgY29uc3QgZ3JvdXBzID0gbGRhcC5nZXRVc2VyR3JvdXBzKHVzZXJuYW1lLCBsZGFwVXNlcik7XG5cbiAgICAgIGlmKCBncm91cHMubGVuZ3RoID4gMCApIHtcbiAgICAgICAgUm9sZXMuc2V0VXNlclJvbGVzKHVzZXIuX2lkLCBncm91cHMgKTtcbiAgICAgICAgbG9nX2luZm8oYFVwZGF0ZWQgcm9sZXMgdG86JHsgIGdyb3Vwcy5qb2luKCcsJyl9YCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgTWV0ZW9yLnVzZXJzLnVwZGF0ZSh1c2VyLl9pZCwgdXBkYXRlX2RhdGEgKTtcblxuICAgIHN5bmNVc2VyRGF0YSh1c2VyLCBsZGFwVXNlcik7XG5cbiAgICBpZiAoTERBUC5zZXR0aW5nc19nZXQoJ0xEQVBfTE9HSU5fRkFMTEJBQ0snKSA9PT0gdHJ1ZSkge1xuICAgICAgQWNjb3VudHMuc2V0UGFzc3dvcmQodXNlci5faWQsIGxvZ2luUmVxdWVzdC5sZGFwUGFzcywge2xvZ291dDogZmFsc2V9KTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgdXNlcklkOiB1c2VyLl9pZCxcbiAgICAgIHRva2VuOiBzdGFtcGVkVG9rZW4udG9rZW4sXG4gICAgfTtcbiAgfVxuXG4gIC8vIENyZWF0ZSBuZXcgdXNlclxuXG4gIGxvZ19pbmZvKCdVc2VyIGRvZXMgbm90IGV4aXN0LCBjcmVhdGluZycsIHVzZXJuYW1lKTtcblxuICBpZiAoTERBUC5zZXR0aW5nc19nZXQoJ0xEQVBfVVNFUk5BTUVfRklFTEQnKSA9PT0gJycpIHtcbiAgICB1c2VybmFtZSA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIGlmIChMREFQLnNldHRpbmdzX2dldCgnTERBUF9MT0dJTl9GQUxMQkFDSycpICE9PSB0cnVlKSB7XG4gICAgbG9naW5SZXF1ZXN0LmxkYXBQYXNzID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgY29uc3QgcmVzdWx0ID0gYWRkTGRhcFVzZXIobGRhcFVzZXIsIHVzZXJuYW1lLCBsb2dpblJlcXVlc3QubGRhcFBhc3MpO1xuXG4gIGlmIChMREFQLnNldHRpbmdzX2dldCgnTERBUF9TWU5DX0FETUlOX1NUQVRVUycpID09PSB0cnVlKSB7XG4gICAgbG9nX2RlYnVnKCdVcGRhdGluZyBhZG1pbiBzdGF0dXMnKTtcbiAgICBjb25zdCB0YXJnZXRHcm91cHMgPSBMREFQLnNldHRpbmdzX2dldCgnTERBUF9TWU5DX0FETUlOX0dST1VQUycpLnNwbGl0KCcsJyk7XG4gICAgY29uc3QgZ3JvdXBzID0gbGRhcC5nZXRVc2VyR3JvdXBzKHVzZXJuYW1lLCBsZGFwVXNlcikuZmlsdGVyKCh2YWx1ZSkgPT4gdGFyZ2V0R3JvdXBzLmluY2x1ZGVzKHZhbHVlKSk7XG5cbiAgICByZXN1bHQuaXNBZG1pbiA9IGdyb3Vwcy5sZW5ndGggPiAwO1xuICAgIE1ldGVvci51c2Vycy51cGRhdGUoe19pZDogcmVzdWx0LnVzZXJJZH0sIHskc2V0OiB7aXNBZG1pbjogcmVzdWx0LmlzQWRtaW59fSk7XG4gIH1cblxuICBpZiggTERBUC5zZXR0aW5nc19nZXQoJ0xEQVBfU1lOQ19HUk9VUF9ST0xFUycpID09PSB0cnVlICkge1xuICAgIGNvbnN0IGdyb3VwcyA9IGxkYXAuZ2V0VXNlckdyb3Vwcyh1c2VybmFtZSwgbGRhcFVzZXIpO1xuICAgIGlmKCBncm91cHMubGVuZ3RoID4gMCApIHtcbiAgICAgIFJvbGVzLnNldFVzZXJSb2xlcyhyZXN1bHQudXNlcklkLCBncm91cHMgKTtcbiAgICAgIGxvZ19pbmZvKGBTZXQgcm9sZXMgdG86JHsgIGdyb3Vwcy5qb2luKCcsJyl9YCk7XG4gICAgfVxuICB9XG5cblxuICBpZiAocmVzdWx0IGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICB0aHJvdyByZXN1bHQ7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufSk7XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCBTeW5jZWRDcm9uIGZyb20gJ21ldGVvci9wZXJjb2xhdGU6c3luY2VkLWNyb24nO1xuaW1wb3J0IExEQVAgZnJvbSAnLi9sZGFwJztcbmltcG9ydCB7IGxvZ19kZWJ1ZywgbG9nX2luZm8sIGxvZ193YXJuLCBsb2dfZXJyb3IgfSBmcm9tICcuL2xvZ2dlcic7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QucHJvdG90eXBlLCBcImdldExEQVBWYWx1ZVwiLCB7XG4gIHZhbHVlOiBmdW5jdGlvbiAocHJvcCkge1xuICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICBmb3IgKGxldCBrZXkgaW4gc2VsZikge1xuICAgICAgICAgIGlmIChrZXkudG9Mb3dlckNhc2UoKSA9PSBwcm9wLnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlbGZba2V5XTtcbiAgICAgICAgICB9XG4gICAgICB9XG4gIH0sXG5cbiAgZW51bWVyYWJsZTogZmFsc2Vcbn0pO1xuXG5leHBvcnQgZnVuY3Rpb24gc2x1Zyh0ZXh0KSB7XG4gIGlmIChMREFQLnNldHRpbmdzX2dldCgnTERBUF9VVEY4X05BTUVTX1NMVUdJRlknKSAhPT0gdHJ1ZSkge1xuICAgIHJldHVybiB0ZXh0O1xuICB9XG4gIHRleHQgPSBzbHVnaWZ5KHRleHQsICcuJyk7XG4gIHJldHVybiB0ZXh0LnJlcGxhY2UoL1teMC05YS16LV8uXS9nLCAnJyk7XG59XG5cbmZ1bmN0aW9uIHRlbXBsYXRlVmFySGFuZGxlciAodmFyaWFibGUsIG9iamVjdCkge1xuXG4gIGNvbnN0IHRlbXBsYXRlUmVnZXggPSAvI3soW1xcd1xcLV0rKX0vZ2k7XG4gIGxldCBtYXRjaCA9IHRlbXBsYXRlUmVnZXguZXhlYyh2YXJpYWJsZSk7XG4gIGxldCB0bXBWYXJpYWJsZSA9IHZhcmlhYmxlO1xuXG4gIGlmIChtYXRjaCA9PSBudWxsKSB7XG4gICAgaWYgKCFvYmplY3QuaGFzT3duUHJvcGVydHkodmFyaWFibGUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RbdmFyaWFibGVdO1xuICB9IGVsc2Uge1xuICAgIHdoaWxlIChtYXRjaCAhPSBudWxsKSB7XG4gICAgICBjb25zdCB0bXBsVmFyID0gbWF0Y2hbMF07XG4gICAgICBjb25zdCB0bXBsQXR0ck5hbWUgPSBtYXRjaFsxXTtcblxuICAgICAgaWYgKCFvYmplY3QuaGFzT3duUHJvcGVydHkodG1wbEF0dHJOYW1lKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGF0dHJWYWwgPSBvYmplY3RbdG1wbEF0dHJOYW1lXTtcbiAgICAgIHRtcFZhcmlhYmxlID0gdG1wVmFyaWFibGUucmVwbGFjZSh0bXBsVmFyLCBhdHRyVmFsKTtcbiAgICAgIG1hdGNoID0gdGVtcGxhdGVSZWdleC5leGVjKHZhcmlhYmxlKTtcbiAgICB9XG4gICAgcmV0dXJuIHRtcFZhcmlhYmxlO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm9wZXJ0eVZhbHVlKG9iaiwga2V5KSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIF8ucmVkdWNlKGtleS5zcGxpdCgnLicpLCAoYWNjLCBlbCkgPT4gYWNjW2VsXSwgb2JqKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TGRhcFVzZXJuYW1lKGxkYXBVc2VyKSB7XG4gIGNvbnN0IHVzZXJuYW1lRmllbGQgPSBMREFQLnNldHRpbmdzX2dldCgnTERBUF9VU0VSTkFNRV9GSUVMRCcpO1xuXG4gIGlmICh1c2VybmFtZUZpZWxkLmluZGV4T2YoJyN7JykgPiAtMSkge1xuICAgIHJldHVybiB1c2VybmFtZUZpZWxkLnJlcGxhY2UoLyN7KC4rPyl9L2csIGZ1bmN0aW9uKG1hdGNoLCBmaWVsZCkge1xuICAgICAgcmV0dXJuIGxkYXBVc2VyLmdldExEQVBWYWx1ZShmaWVsZCk7XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gbGRhcFVzZXIuZ2V0TERBUFZhbHVlKHVzZXJuYW1lRmllbGQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TGRhcEVtYWlsKGxkYXBVc2VyKSB7XG4gIGNvbnN0IGVtYWlsRmllbGQgPSBMREFQLnNldHRpbmdzX2dldCgnTERBUF9FTUFJTF9GSUVMRCcpO1xuXG4gIGlmIChlbWFpbEZpZWxkLmluZGV4T2YoJyN7JykgPiAtMSkge1xuICAgIHJldHVybiBlbWFpbEZpZWxkLnJlcGxhY2UoLyN7KC4rPyl9L2csIGZ1bmN0aW9uKG1hdGNoLCBmaWVsZCkge1xuICAgICAgcmV0dXJuIGxkYXBVc2VyLmdldExEQVBWYWx1ZShmaWVsZCk7XG4gICAgfSk7XG4gIH1cblxuICBjb25zdCBsZGFwTWFpbCA9IGxkYXBVc2VyLmdldExEQVBWYWx1ZShlbWFpbEZpZWxkKTtcbiAgaWYgKHR5cGVvZiBsZGFwTWFpbCA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gbGRhcE1haWw7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGxkYXBNYWlsWzBdLnRvU3RyaW5nKCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldExkYXBGdWxsbmFtZShsZGFwVXNlcikge1xuICBjb25zdCBmdWxsbmFtZUZpZWxkID0gTERBUC5zZXR0aW5nc19nZXQoJ0xEQVBfRlVMTE5BTUVfRklFTEQnKTtcbiAgaWYgKGZ1bGxuYW1lRmllbGQuaW5kZXhPZignI3snKSA+IC0xKSB7XG4gICAgcmV0dXJuIGZ1bGxuYW1lRmllbGQucmVwbGFjZSgvI3soLis/KX0vZywgZnVuY3Rpb24obWF0Y2gsIGZpZWxkKSB7XG4gICAgICByZXR1cm4gbGRhcFVzZXIuZ2V0TERBUFZhbHVlKGZpZWxkKTtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gbGRhcFVzZXIuZ2V0TERBUFZhbHVlKGZ1bGxuYW1lRmllbGQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TGRhcFVzZXJVbmlxdWVJRChsZGFwVXNlcikge1xuICBsZXQgVW5pcXVlX0lkZW50aWZpZXJfRmllbGQgPSBMREFQLnNldHRpbmdzX2dldCgnTERBUF9VTklRVUVfSURFTlRJRklFUl9GSUVMRCcpO1xuXG4gIGlmIChVbmlxdWVfSWRlbnRpZmllcl9GaWVsZCAhPT0gJycpIHtcbiAgICBVbmlxdWVfSWRlbnRpZmllcl9GaWVsZCA9IFVuaXF1ZV9JZGVudGlmaWVyX0ZpZWxkLnJlcGxhY2UoL1xccy9nLCAnJykuc3BsaXQoJywnKTtcbiAgfSBlbHNlIHtcbiAgICBVbmlxdWVfSWRlbnRpZmllcl9GaWVsZCA9IFtdO1xuICB9XG5cbiAgbGV0IFVzZXJfU2VhcmNoX0ZpZWxkID0gTERBUC5zZXR0aW5nc19nZXQoJ0xEQVBfVVNFUl9TRUFSQ0hfRklFTEQnKTtcblxuICBpZiAoVXNlcl9TZWFyY2hfRmllbGQgIT09ICcnKSB7XG4gICAgVXNlcl9TZWFyY2hfRmllbGQgPSBVc2VyX1NlYXJjaF9GaWVsZC5yZXBsYWNlKC9cXHMvZywgJycpLnNwbGl0KCcsJyk7XG4gIH0gZWxzZSB7XG4gICAgVXNlcl9TZWFyY2hfRmllbGQgPSBbXTtcbiAgfVxuXG4gIFVuaXF1ZV9JZGVudGlmaWVyX0ZpZWxkID0gVW5pcXVlX0lkZW50aWZpZXJfRmllbGQuY29uY2F0KFVzZXJfU2VhcmNoX0ZpZWxkKTtcblxuICBpZiAoVW5pcXVlX0lkZW50aWZpZXJfRmllbGQubGVuZ3RoID4gMCkge1xuICAgIFVuaXF1ZV9JZGVudGlmaWVyX0ZpZWxkID0gVW5pcXVlX0lkZW50aWZpZXJfRmllbGQuZmluZCgoZmllbGQpID0+IHtcbiAgICAgIHJldHVybiAhXy5pc0VtcHR5KGxkYXBVc2VyLl9yYXcuZ2V0TERBUFZhbHVlKGZpZWxkKSk7XG4gICAgfSk7XG4gICAgaWYgKFVuaXF1ZV9JZGVudGlmaWVyX0ZpZWxkKSB7XG5cdFx0ICAgIGxvZ19kZWJ1ZyhgSWRlbnRpZnlpbmcgdXNlciB3aXRoOiAkeyAgVW5pcXVlX0lkZW50aWZpZXJfRmllbGR9YCk7XG4gICAgICBVbmlxdWVfSWRlbnRpZmllcl9GaWVsZCA9IHtcbiAgICAgICAgYXR0cmlidXRlOiBVbmlxdWVfSWRlbnRpZmllcl9GaWVsZCxcbiAgICAgICAgdmFsdWU6IGxkYXBVc2VyLl9yYXcuZ2V0TERBUFZhbHVlKFVuaXF1ZV9JZGVudGlmaWVyX0ZpZWxkKS50b1N0cmluZygnaGV4JyksXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gVW5pcXVlX0lkZW50aWZpZXJfRmllbGQ7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldERhdGFUb1N5bmNVc2VyRGF0YShsZGFwVXNlciwgdXNlcikge1xuICBjb25zdCBzeW5jVXNlckRhdGEgPSBMREFQLnNldHRpbmdzX2dldCgnTERBUF9TWU5DX1VTRVJfREFUQScpO1xuICBjb25zdCBzeW5jVXNlckRhdGFGaWVsZE1hcCA9IExEQVAuc2V0dGluZ3NfZ2V0KCdMREFQX1NZTkNfVVNFUl9EQVRBX0ZJRUxETUFQJykudHJpbSgpO1xuXG4gIGNvbnN0IHVzZXJEYXRhID0ge307XG5cbiAgaWYgKHN5bmNVc2VyRGF0YSAmJiBzeW5jVXNlckRhdGFGaWVsZE1hcCkge1xuICAgIGNvbnN0IHdoaXRlbGlzdGVkVXNlckZpZWxkcyA9IFsnZW1haWwnLCAnbmFtZScsICdjdXN0b21GaWVsZHMnXTtcbiAgICBjb25zdCBmaWVsZE1hcCA9IEpTT04ucGFyc2Uoc3luY1VzZXJEYXRhRmllbGRNYXApO1xuICAgIGNvbnN0IGVtYWlsTGlzdCA9IFtdO1xuICAgIF8ubWFwKGZpZWxkTWFwLCBmdW5jdGlvbih1c2VyRmllbGQsIGxkYXBGaWVsZCkge1xuXHRcdCAgICBsb2dfZGVidWcoYE1hcHBpbmcgZmllbGQgJHtsZGFwRmllbGR9IC0+ICR7dXNlckZpZWxkfWApO1xuICAgICAgc3dpdGNoICh1c2VyRmllbGQpIHtcbiAgICAgIGNhc2UgJ2VtYWlsJzpcbiAgICAgICAgaWYgKCFsZGFwVXNlci5oYXNPd25Qcm9wZXJ0eShsZGFwRmllbGQpKSB7XG4gICAgICAgICAgbG9nX2RlYnVnKGB1c2VyIGRvZXMgbm90IGhhdmUgYXR0cmlidXRlOiAkeyBsZGFwRmllbGQgfWApO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChfLmlzT2JqZWN0KGxkYXBVc2VyW2xkYXBGaWVsZF0pKSB7XG4gICAgICAgICAgXy5tYXAobGRhcFVzZXJbbGRhcEZpZWxkXSwgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgZW1haWxMaXN0LnB1c2goeyBhZGRyZXNzOiBpdGVtLCB2ZXJpZmllZDogdHJ1ZSB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbWFpbExpc3QucHVzaCh7IGFkZHJlc3M6IGxkYXBVc2VyW2xkYXBGaWVsZF0sIHZlcmlmaWVkOiB0cnVlIH0pO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBjb25zdCBbb3V0ZXJLZXksIGlubmVyS2V5c10gPSB1c2VyRmllbGQuc3BsaXQoL1xcLiguKykvKTtcblxuICAgICAgICBpZiAoIV8uZmluZCh3aGl0ZWxpc3RlZFVzZXJGaWVsZHMsIChlbCkgPT4gZWwgPT09IG91dGVyS2V5KSkge1xuICAgICAgICAgIGxvZ19kZWJ1ZyhgdXNlciBhdHRyaWJ1dGUgbm90IHdoaXRlbGlzdGVkOiAkeyB1c2VyRmllbGQgfWApO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvdXRlcktleSA9PT0gJ2N1c3RvbUZpZWxkcycpIHtcbiAgICAgICAgICBsZXQgY3VzdG9tRmllbGRzTWV0YTtcblxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjdXN0b21GaWVsZHNNZXRhID0gSlNPTi5wYXJzZShMREFQLnNldHRpbmdzX2dldCgnQWNjb3VudHNfQ3VzdG9tRmllbGRzJykpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGxvZ19kZWJ1ZygnSW52YWxpZCBKU09OIGZvciBDdXN0b20gRmllbGRzJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFnZXRQcm9wZXJ0eVZhbHVlKGN1c3RvbUZpZWxkc01ldGEsIGlubmVyS2V5cykpIHtcbiAgICAgICAgICAgIGxvZ19kZWJ1ZyhgdXNlciBhdHRyaWJ1dGUgZG9lcyBub3QgZXhpc3Q6ICR7IHVzZXJGaWVsZCB9YCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdG1wVXNlckZpZWxkID0gZ2V0UHJvcGVydHlWYWx1ZSh1c2VyLCB1c2VyRmllbGQpO1xuICAgICAgICBjb25zdCB0bXBMZGFwRmllbGQgPSB0ZW1wbGF0ZVZhckhhbmRsZXIobGRhcEZpZWxkLCBsZGFwVXNlcik7XG5cbiAgICAgICAgaWYgKHRtcExkYXBGaWVsZCAmJiB0bXBVc2VyRmllbGQgIT09IHRtcExkYXBGaWVsZCkge1xuICAgICAgICAgIC8vIGNyZWF0ZXMgdGhlIG9iamVjdCBzdHJ1Y3R1cmUgaW5zdGVhZCBvZiBqdXN0IGFzc2lnbmluZyAndG1wTGRhcEZpZWxkJyB0b1xuICAgICAgICAgIC8vICd1c2VyRGF0YVt1c2VyRmllbGRdJyBpbiBvcmRlciB0byBhdm9pZCB0aGUgXCJjYW5ub3QgdXNlIHRoZSBwYXJ0ICguLi4pXG4gICAgICAgICAgLy8gdG8gdHJhdmVyc2UgdGhlIGVsZW1lbnRcIiAoTW9uZ29EQikgZXJyb3IgdGhhdCBjYW4gaGFwcGVuLiBEbyBub3QgaGFuZGxlXG4gICAgICAgICAgLy8gYXJyYXlzLlxuICAgICAgICAgIC8vIFRPRE86IEZpbmQgYSBiZXR0ZXIgc29sdXRpb24uXG4gICAgICAgICAgY29uc3QgZEtleXMgPSB1c2VyRmllbGQuc3BsaXQoJy4nKTtcbiAgICAgICAgICBjb25zdCBsYXN0S2V5ID0gXy5sYXN0KGRLZXlzKTtcbiAgICAgICAgICBfLnJlZHVjZShkS2V5cywgKG9iaiwgY3VycktleSkgPT5cbiAgICAgICAgICAgIChjdXJyS2V5ID09PSBsYXN0S2V5KVxuICAgICAgICAgICAgICA/IG9ialtjdXJyS2V5XSA9IHRtcExkYXBGaWVsZFxuICAgICAgICAgICAgICA6IG9ialtjdXJyS2V5XSA9IG9ialtjdXJyS2V5XSB8fCB7fVxuICAgICAgICAgICAgLCB1c2VyRGF0YSk7XG4gICAgICAgICAgbG9nX2RlYnVnKGB1c2VyLiR7IHVzZXJGaWVsZCB9IGNoYW5nZWQgdG86ICR7IHRtcExkYXBGaWVsZCB9YCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmIChlbWFpbExpc3QubGVuZ3RoID4gMCkge1xuICAgICAgaWYgKEpTT04uc3RyaW5naWZ5KHVzZXIuZW1haWxzKSAhPT0gSlNPTi5zdHJpbmdpZnkoZW1haWxMaXN0KSkge1xuICAgICAgICB1c2VyRGF0YS5lbWFpbHMgPSBlbWFpbExpc3Q7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY29uc3QgdW5pcXVlSWQgPSBnZXRMZGFwVXNlclVuaXF1ZUlEKGxkYXBVc2VyKTtcblxuICBpZiAodW5pcXVlSWQgJiYgKCF1c2VyLnNlcnZpY2VzIHx8ICF1c2VyLnNlcnZpY2VzLmxkYXAgfHwgdXNlci5zZXJ2aWNlcy5sZGFwLmlkICE9PSB1bmlxdWVJZC52YWx1ZSB8fCB1c2VyLnNlcnZpY2VzLmxkYXAuaWRBdHRyaWJ1dGUgIT09IHVuaXF1ZUlkLmF0dHJpYnV0ZSkpIHtcbiAgICB1c2VyRGF0YVsnc2VydmljZXMubGRhcC5pZCddID0gdW5pcXVlSWQudmFsdWU7XG4gICAgdXNlckRhdGFbJ3NlcnZpY2VzLmxkYXAuaWRBdHRyaWJ1dGUnXSA9IHVuaXF1ZUlkLmF0dHJpYnV0ZTtcbiAgfVxuXG4gIGlmICh1c2VyLmF1dGhlbnRpY2F0aW9uTWV0aG9kICE9PSAnbGRhcCcpIHtcbiAgICB1c2VyRGF0YS5sZGFwID0gdHJ1ZTtcbiAgfVxuXG4gIGlmIChfLnNpemUodXNlckRhdGEpKSB7XG4gICAgcmV0dXJuIHVzZXJEYXRhO1xuICB9XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIHN5bmNVc2VyRGF0YSh1c2VyLCBsZGFwVXNlcikge1xuICBsb2dfaW5mbygnU3luY2luZyB1c2VyIGRhdGEnKTtcbiAgbG9nX2RlYnVnKCd1c2VyJywgeydlbWFpbCc6IHVzZXIuZW1haWwsICdfaWQnOiB1c2VyLl9pZH0pO1xuICAvLyBsb2dfZGVidWcoJ2xkYXBVc2VyJywgbGRhcFVzZXIub2JqZWN0KTtcblxuICBpZiAoTERBUC5zZXR0aW5nc19nZXQoJ0xEQVBfVVNFUk5BTUVfRklFTEQnKSAhPT0gJycpIHtcbiAgICBjb25zdCB1c2VybmFtZSA9IHNsdWcoZ2V0TGRhcFVzZXJuYW1lKGxkYXBVc2VyKSk7XG4gICAgaWYgKHVzZXIgJiYgdXNlci5faWQgJiYgdXNlcm5hbWUgIT09IHVzZXIudXNlcm5hbWUpIHtcbiAgICAgIGxvZ19pbmZvKCdTeW5jaW5nIHVzZXIgdXNlcm5hbWUnLCB1c2VyLnVzZXJuYW1lLCAnLT4nLCB1c2VybmFtZSk7XG4gICAgICBNZXRlb3IudXNlcnMuZmluZE9uZSh7IF9pZDogdXNlci5faWQgfSwgeyAkc2V0OiB7IHVzZXJuYW1lIH19KTtcbiAgICB9XG4gIH1cblxuICBpZiAoTERBUC5zZXR0aW5nc19nZXQoJ0xEQVBfRlVMTE5BTUVfRklFTEQnKSAhPT0gJycpIHtcbiAgICBjb25zdCBmdWxsbmFtZT0gZ2V0TGRhcEZ1bGxuYW1lKGxkYXBVc2VyKTtcbiAgICBsb2dfZGVidWcoJ2Z1bGxuYW1lPScsZnVsbG5hbWUpO1xuICAgIGlmICh1c2VyICYmIHVzZXIuX2lkICYmIGZ1bGxuYW1lICE9PSAnJykge1xuICAgICAgbG9nX2luZm8oJ1N5bmNpbmcgdXNlciBmdWxsbmFtZTonLCBmdWxsbmFtZSk7XG4gICAgICBNZXRlb3IudXNlcnMudXBkYXRlKHsgX2lkOiAgdXNlci5faWQgfSwgeyAkc2V0OiB7ICdwcm9maWxlLmZ1bGxuYW1lJyA6IGZ1bGxuYW1lLCB9fSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKExEQVAuc2V0dGluZ3NfZ2V0KCdMREFQX0VNQUlMX0ZJRUxEJykgIT09ICcnKSB7XG4gICAgY29uc3QgZW1haWwgPSBnZXRMZGFwRW1haWwobGRhcFVzZXIpO1xuICAgIGxvZ19kZWJ1ZygnZW1haWw9JywgZW1haWwpO1xuXG4gICAgaWYgKHVzZXIgJiYgdXNlci5faWQgJiYgZW1haWwgIT09ICcnKSB7XG4gICAgICBsb2dfaW5mbygnU3luY2luZyB1c2VyIGVtYWlsOicsIGVtYWlsKTtcbiAgICAgIE1ldGVvci51c2Vycy51cGRhdGUoe1xuICAgICAgICBfaWQ6IHVzZXIuX2lkXG4gICAgICB9LCB7XG4gICAgICAgICRzZXQ6IHtcbiAgICAgICAgICAnZW1haWxzLjAuYWRkcmVzcyc6IGVtYWlsLFxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxufVxuXG5leHBvcnQgZnVuY3Rpb24gYWRkTGRhcFVzZXIobGRhcFVzZXIsIHVzZXJuYW1lLCBwYXNzd29yZCkge1xuICBjb25zdCB1bmlxdWVJZCA9IGdldExkYXBVc2VyVW5pcXVlSUQobGRhcFVzZXIpO1xuXG4gIGNvbnN0IHVzZXJPYmplY3QgPSB7XG4gIH07XG5cbiAgaWYgKHVzZXJuYW1lKSB7XG4gICAgdXNlck9iamVjdC51c2VybmFtZSA9IHVzZXJuYW1lO1xuICB9XG5cbiAgY29uc3QgdXNlckRhdGEgPSBnZXREYXRhVG9TeW5jVXNlckRhdGEobGRhcFVzZXIsIHt9KTtcblxuICBpZiAodXNlckRhdGEgJiYgdXNlckRhdGEuZW1haWxzICYmIHVzZXJEYXRhLmVtYWlsc1swXSAmJiB1c2VyRGF0YS5lbWFpbHNbMF0uYWRkcmVzcykge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHVzZXJEYXRhLmVtYWlsc1swXS5hZGRyZXNzKSkge1xuICAgICAgdXNlck9iamVjdC5lbWFpbCA9IHVzZXJEYXRhLmVtYWlsc1swXS5hZGRyZXNzWzBdO1xuICAgIH0gZWxzZSB7XG4gICAgICB1c2VyT2JqZWN0LmVtYWlsID0gdXNlckRhdGEuZW1haWxzWzBdLmFkZHJlc3M7XG4gICAgfVxuICB9IGVsc2UgaWYgKGxkYXBVc2VyLm1haWwgJiYgbGRhcFVzZXIubWFpbC5pbmRleE9mKCdAJykgPiAtMSkge1xuICAgIHVzZXJPYmplY3QuZW1haWwgPSBsZGFwVXNlci5tYWlsO1xuICB9IGVsc2UgaWYgKExEQVAuc2V0dGluZ3NfZ2V0KCdMREFQX0RFRkFVTFRfRE9NQUlOJykgIT09ICcnKSB7XG4gICAgdXNlck9iamVjdC5lbWFpbCA9IGAkeyB1c2VybmFtZSB8fCB1bmlxdWVJZC52YWx1ZSB9QCR7IExEQVAuc2V0dGluZ3NfZ2V0KCdMREFQX0RFRkFVTFRfRE9NQUlOJykgfWA7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgZXJyb3IgPSBuZXcgTWV0ZW9yLkVycm9yKCdMREFQLWxvZ2luLWVycm9yJywgJ0xEQVAgQXV0aGVudGljYXRpb24gc3VjY2VkZWQsIHRoZXJlIGlzIG5vIGVtYWlsIHRvIGNyZWF0ZSBhbiBhY2NvdW50LiBIYXZlIHlvdSB0cmllZCBzZXR0aW5nIHlvdXIgRGVmYXVsdCBEb21haW4gaW4gTERBUCBTZXR0aW5ncz8nKTtcbiAgICBsb2dfZXJyb3IoZXJyb3IpO1xuICAgIHRocm93IGVycm9yO1xuICB9XG5cbiAgbG9nX2RlYnVnKCdOZXcgdXNlciBkYXRhJywgdXNlck9iamVjdCk7XG5cbiAgaWYgKHBhc3N3b3JkKSB7XG4gICAgdXNlck9iamVjdC5wYXNzd29yZCA9IHBhc3N3b3JkO1xuICB9XG5cbiAgdHJ5IHtcbiAgICAvLyBUaGlzIGNyZWF0ZXMgdGhlIGFjY291bnQgd2l0aCBwYXNzd29yZCBzZXJ2aWNlXG4gICAgdXNlck9iamVjdC5sZGFwID0gdHJ1ZTtcbiAgICB1c2VyT2JqZWN0Ll9pZCA9IEFjY291bnRzLmNyZWF0ZVVzZXIodXNlck9iamVjdCk7XG5cbiAgICAvLyBBZGQgdGhlIHNlcnZpY2VzLmxkYXAgaWRlbnRpZmllcnNcbiAgICBNZXRlb3IudXNlcnMudXBkYXRlKHsgX2lkOiAgdXNlck9iamVjdC5faWQgfSwge1xuXHRcdCAgICAkc2V0OiB7XG5cdFx0ICAgICAgICAnc2VydmljZXMubGRhcCc6IHsgaWQ6IHVuaXF1ZUlkLnZhbHVlIH0sXG5cdFx0ICAgICAgICAnZW1haWxzLjAudmVyaWZpZWQnOiB0cnVlLFxuXHRcdCAgICAgICAgJ2F1dGhlbnRpY2F0aW9uTWV0aG9kJzogJ2xkYXAnLFxuXHRcdCAgICB9fSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgbG9nX2Vycm9yKCdFcnJvciBjcmVhdGluZyB1c2VyJywgZXJyb3IpO1xuICAgIHJldHVybiBlcnJvcjtcbiAgfVxuXG4gIHN5bmNVc2VyRGF0YSh1c2VyT2JqZWN0LCBsZGFwVXNlcik7XG5cbiAgcmV0dXJuIHtcbiAgICB1c2VySWQ6IHVzZXJPYmplY3QuX2lkLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW1wb3J0TmV3VXNlcnMobGRhcCkge1xuICBpZiAoTERBUC5zZXR0aW5nc19nZXQoJ0xEQVBfRU5BQkxFJykgIT09IHRydWUpIHtcbiAgICBsb2dfZXJyb3IoJ0NhblxcJ3QgcnVuIExEQVAgSW1wb3J0LCBMREFQIGlzIGRpc2FibGVkJyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKCFsZGFwKSB7XG4gICAgbGRhcCA9IG5ldyBMREFQKCk7XG4gICAgbGRhcC5jb25uZWN0U3luYygpO1xuICB9XG5cbiAgbGV0IGNvdW50ID0gMDtcbiAgbGRhcC5zZWFyY2hVc2Vyc1N5bmMoJyonLCBNZXRlb3IuYmluZEVudmlyb25tZW50KChlcnJvciwgbGRhcFVzZXJzLCB7bmV4dCwgZW5kfSA9IHt9KSA9PiB7XG4gICAgaWYgKGVycm9yKSB7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG5cbiAgICBsZGFwVXNlcnMuZm9yRWFjaCgobGRhcFVzZXIpID0+IHtcbiAgICAgIGNvdW50Kys7XG5cbiAgICAgIGNvbnN0IHVuaXF1ZUlkID0gZ2V0TGRhcFVzZXJVbmlxdWVJRChsZGFwVXNlcik7XG4gICAgICAvLyBMb29rIHRvIHNlZSBpZiB1c2VyIGFscmVhZHkgZXhpc3RzXG4gICAgICBjb25zdCB1c2VyUXVlcnkgPSB7XG4gICAgICAgICdzZXJ2aWNlcy5sZGFwLmlkJzogdW5pcXVlSWQudmFsdWUsXG4gICAgICB9O1xuXG4gICAgICBsb2dfZGVidWcoJ3VzZXJRdWVyeScsIHVzZXJRdWVyeSk7XG5cbiAgICAgIGxldCB1c2VybmFtZTtcbiAgICAgIGlmIChMREFQLnNldHRpbmdzX2dldCgnTERBUF9VU0VSTkFNRV9GSUVMRCcpICE9PSAnJykge1xuICAgICAgICB1c2VybmFtZSA9IHNsdWcoZ2V0TGRhcFVzZXJuYW1lKGxkYXBVc2VyKSk7XG4gICAgICB9XG5cbiAgICAgIC8vIEFkZCB1c2VyIGlmIGl0IHdhcyBub3QgYWRkZWQgYmVmb3JlXG4gICAgICBsZXQgdXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKHVzZXJRdWVyeSk7XG5cbiAgICAgIGlmICghdXNlciAmJiB1c2VybmFtZSAmJiBMREFQLnNldHRpbmdzX2dldCgnTERBUF9NRVJHRV9FWElTVElOR19VU0VSUycpID09PSB0cnVlKSB7XG4gICAgICAgIGNvbnN0IHVzZXJRdWVyeSA9IHtcbiAgICAgICAgICB1c2VybmFtZSxcbiAgICAgICAgfTtcblxuICAgICAgICBsb2dfZGVidWcoJ3VzZXJRdWVyeSBtZXJnZScsIHVzZXJRdWVyeSk7XG5cbiAgICAgICAgdXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKHVzZXJRdWVyeSk7XG4gICAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgICAgc3luY1VzZXJEYXRhKHVzZXIsIGxkYXBVc2VyKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIXVzZXIpIHtcbiAgICAgICAgYWRkTGRhcFVzZXIobGRhcFVzZXIsIHVzZXJuYW1lKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGNvdW50ICUgMTAwID09PSAwKSB7XG4gICAgICAgIGxvZ19pbmZvKCdJbXBvcnQgcnVubmluZy4gVXNlcnMgaW1wb3J0ZWQgdW50aWwgbm93OicsIGNvdW50KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmIChlbmQpIHtcbiAgICAgIGxvZ19pbmZvKCdJbXBvcnQgZmluaXNoZWQuIFVzZXJzIGltcG9ydGVkOicsIGNvdW50KTtcbiAgICB9XG5cbiAgICBuZXh0KGNvdW50KTtcbiAgfSkpO1xufVxuXG5mdW5jdGlvbiBzeW5jKCkge1xuICBpZiAoTERBUC5zZXR0aW5nc19nZXQoJ0xEQVBfRU5BQkxFJykgIT09IHRydWUpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBsZGFwID0gbmV3IExEQVAoKTtcblxuICB0cnkge1xuICAgIGxkYXAuY29ubmVjdFN5bmMoKTtcblxuICAgIGxldCB1c2VycztcbiAgICBpZiAoTERBUC5zZXR0aW5nc19nZXQoJ0xEQVBfQkFDS0dST1VORF9TWU5DX0tFRVBfRVhJU1RBTlRfVVNFUlNfVVBEQVRFRCcpID09PSB0cnVlKSB7XG4gICAgICB1c2VycyA9IE1ldGVvci51c2Vycy5maW5kKHsgJ3NlcnZpY2VzLmxkYXAnOiB7ICRleGlzdHM6IHRydWUgfX0pO1xuICAgIH1cblxuICAgIGlmIChMREFQLnNldHRpbmdzX2dldCgnTERBUF9CQUNLR1JPVU5EX1NZTkNfSU1QT1JUX05FV19VU0VSUycpID09PSB0cnVlKSB7XG4gICAgICBpbXBvcnROZXdVc2VycyhsZGFwKTtcbiAgICB9XG5cbiAgICBpZiAoTERBUC5zZXR0aW5nc19nZXQoJ0xEQVBfQkFDS0dST1VORF9TWU5DX0tFRVBfRVhJU1RBTlRfVVNFUlNfVVBEQVRFRCcpID09PSB0cnVlKSB7XG4gICAgICB1c2Vycy5mb3JFYWNoKGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgICAgbGV0IGxkYXBVc2VyO1xuXG4gICAgICAgIGlmICh1c2VyLnNlcnZpY2VzICYmIHVzZXIuc2VydmljZXMubGRhcCAmJiB1c2VyLnNlcnZpY2VzLmxkYXAuaWQpIHtcbiAgICAgICAgICBsZGFwVXNlciA9IGxkYXAuZ2V0VXNlckJ5SWRTeW5jKHVzZXIuc2VydmljZXMubGRhcC5pZCwgdXNlci5zZXJ2aWNlcy5sZGFwLmlkQXR0cmlidXRlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsZGFwVXNlciA9IGxkYXAuZ2V0VXNlckJ5VXNlcm5hbWVTeW5jKHVzZXIudXNlcm5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGxkYXBVc2VyKSB7XG4gICAgICAgICAgc3luY1VzZXJEYXRhKHVzZXIsIGxkYXBVc2VyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsb2dfaW5mbygnQ2FuXFwndCBzeW5jIHVzZXInLCB1c2VyLnVzZXJuYW1lKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGxvZ19lcnJvcihlcnJvcik7XG4gICAgcmV0dXJuIGVycm9yO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG5jb25zdCBqb2JOYW1lID0gJ0xEQVBfU3luYyc7XG5cbmNvbnN0IGFkZENyb25Kb2IgPSBfLmRlYm91bmNlKE1ldGVvci5iaW5kRW52aXJvbm1lbnQoZnVuY3Rpb24gYWRkQ3JvbkpvYkRlYm91bmNlZCgpIHtcbiAgbGV0IHNjPVN5bmNlZENyb24uU3luY2VkQ3JvbjsgLy9XaHkgPz8gc29tZXRoaW5nIG11c3QgYmUgd3JvbmcgaW4gdGhlIGltcG9ydFxuICBpZiAoTERBUC5zZXR0aW5nc19nZXQoJ0xEQVBfQkFDS0dST1VORF9TWU5DJykgIT09IHRydWUpIHtcbiAgICBsb2dfaW5mbygnRGlzYWJsaW5nIExEQVAgQmFja2dyb3VuZCBTeW5jJyk7XG4gICAgaWYgKHNjLm5leHRTY2hlZHVsZWRBdERhdGUoam9iTmFtZSkpIHtcbiAgICAgIHNjLnJlbW92ZShqb2JOYW1lKTtcbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgbG9nX2luZm8oJ0VuYWJsaW5nIExEQVAgQmFja2dyb3VuZCBTeW5jJyk7XG4gIHNjLmFkZCh7XG4gICAgbmFtZTogam9iTmFtZSxcbiAgICBzY2hlZHVsZTogZnVuY3Rpb24ocGFyc2VyKSB7XG4gICAgaWYgKExEQVAuc2V0dGluZ3NfZ2V0KCdMREFQX0JBQ0tHUk9VTkRfU1lOQ19JTlRFUlZBTCcpKSB7XG4gICAgICAgcmV0dXJuIHBhcnNlci50ZXh0KExEQVAuc2V0dGluZ3NfZ2V0KCdMREFQX0JBQ0tHUk9VTkRfU1lOQ19JTlRFUlZBTCcpKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgcmV0dXJuIHBhcnNlci5yZWN1cigpLm9uKDApLm1pbnV0ZSgpO1xuICAgIH19LFxuICAgIGpvYjogZnVuY3Rpb24oKSB7XG4gICAgICBzeW5jKCk7XG4gICAgfSxcbiAgfSk7XG4gIHNjLnN0YXJ0KCk7XG5cbn0pLCA1MDApO1xuXG5NZXRlb3Iuc3RhcnR1cCgoKSA9PiB7XG4gIE1ldGVvci5kZWZlcigoKSA9PiB7XG4gICAgaWYoTERBUC5zZXR0aW5nc19nZXQoJ0xEQVBfQkFDS0dST1VORF9TWU5DJykpe2FkZENyb25Kb2IoKTt9XG4gIH0pO1xufSk7XG4iXX0=
