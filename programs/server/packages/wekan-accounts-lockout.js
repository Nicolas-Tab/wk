(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;
var Accounts = Package['accounts-base'].Accounts;

/* Package-scope variables */
var connection;

var require = meteorInstall({"node_modules":{"meteor":{"wekan-accounts-lockout":{"accounts-lockout.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages/wekan-accounts-lockout/accounts-lockout.js                                                   //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
module.export({
  Name: () => Name,
  AccountsLockout: () => AccountsLockout
});
let AccountsLockout;
module.link("./src/accountsLockout", {
  default(v) {
    AccountsLockout = v;
  }
}, 0);
const Name = 'wekan-accounts-lockout';
///////////////////////////////////////////////////////////////////////////////////////////////////////////

},"src":{"accountsLockout.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages/wekan-accounts-lockout/src/accountsLockout.js                                                //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
let KnownUser;
module.link("./knownUser", {
  default(v) {
    KnownUser = v;
  }
}, 0);
let UnknownUser;
module.link("./unknownUser", {
  default(v) {
    UnknownUser = v;
  }
}, 1);
class AccountsLockout {
  constructor(_ref) {
    let {
      knownUsers = {
        failuresBeforeLockout: 3,
        lockoutPeriod: 60,
        failureWindow: 15
      },
      unknownUsers = {
        failuresBeforeLockout: 3,
        lockoutPeriod: 60,
        failureWindow: 15
      }
    } = _ref;
    this.settings = {
      knownUsers,
      unknownUsers
    };
  }
  startup() {
    new KnownUser(this.settings.knownUsers).startup();
    new UnknownUser(this.settings.unknownUsers).startup();
  }
}
module.exportDefault(AccountsLockout);
///////////////////////////////////////////////////////////////////////////////////////////////////////////

},"accountsLockoutCollection.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages/wekan-accounts-lockout/src/accountsLockoutCollection.js                                      //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 0);
module.exportDefault(new Meteor.Collection('AccountsLockout.Connections'));
///////////////////////////////////////////////////////////////////////////////////////////////////////////

},"knownUser.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages/wekan-accounts-lockout/src/knownUser.js                                                      //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 0);
let Accounts;
module.link("meteor/accounts-base", {
  Accounts(v) {
    Accounts = v;
  }
}, 1);
class KnownUser {
  constructor(settings) {
    this.unchangedSettings = settings;
    this.settings = settings;
  }
  startup() {
    if (!(this.unchangedSettings instanceof Function)) {
      this.updateSettings();
    }
    this.scheduleUnlocksForLockedAccounts();
    KnownUser.unlockAccountsIfLockoutAlreadyExpired();
    this.hookIntoAccounts();
  }
  updateSettings() {
    const settings = KnownUser.knownUsers();
    if (settings) {
      settings.forEach(function updateSetting(_ref) {
        let {
          key,
          value
        } = _ref;
        this.settings[key] = value;
      });
    }
    this.validateSettings();
  }
  validateSettings() {
    if (!this.settings.failuresBeforeLockout || this.settings.failuresBeforeLockout < 0) {
      throw new Error('"failuresBeforeLockout" is not positive integer');
    }
    if (!this.settings.lockoutPeriod || this.settings.lockoutPeriod < 0) {
      throw new Error('"lockoutPeriod" is not positive integer');
    }
    if (!this.settings.failureWindow || this.settings.failureWindow < 0) {
      throw new Error('"failureWindow" is not positive integer');
    }
  }
  scheduleUnlocksForLockedAccounts() {
    const lockedAccountsCursor = Meteor.users.find({
      'services.accounts-lockout.unlockTime': {
        $gt: Number(new Date())
      }
    }, {
      fields: {
        'services.accounts-lockout.unlockTime': 1
      }
    });
    const currentTime = Number(new Date());
    lockedAccountsCursor.forEach(user => {
      let lockDuration = KnownUser.unlockTime(user) - currentTime;
      if (lockDuration >= this.settings.lockoutPeriod) {
        lockDuration = this.settings.lockoutPeriod * 1000;
      }
      if (lockDuration <= 1) {
        lockDuration = 1;
      }
      Meteor.setTimeout(KnownUser.unlockAccount.bind(null, user._id), lockDuration);
    });
  }
  static unlockAccountsIfLockoutAlreadyExpired() {
    const currentTime = Number(new Date());
    const query = {
      'services.accounts-lockout.unlockTime': {
        $lt: currentTime
      }
    };
    const data = {
      $unset: {
        'services.accounts-lockout.unlockTime': 0,
        'services.accounts-lockout.failedAttempts': 0
      }
    };
    Meteor.users.update(query, data);
  }
  hookIntoAccounts() {
    Accounts.validateLoginAttempt(this.validateLoginAttempt.bind(this));
    Accounts.onLogin(KnownUser.onLogin);
  }
  validateLoginAttempt(loginInfo) {
    if (
    // don't interrupt non-password logins
    loginInfo.type !== 'password' || loginInfo.user === undefined ||
    // Don't handle errors unless they are due to incorrect password
    loginInfo.error !== undefined && loginInfo.error.reason !== 'Incorrect password') {
      return loginInfo.allowed;
    }

    // If there was no login error and the account is NOT locked, don't interrupt
    const unlockTime = KnownUser.unlockTime(loginInfo.user);
    if (loginInfo.error === undefined && unlockTime === 0) {
      return loginInfo.allowed;
    }
    if (this.unchangedSettings instanceof Function) {
      this.settings = this.unchangedSettings(loginInfo.user);
      this.validateSettings();
    }
    const userId = loginInfo.user._id;
    let failedAttempts = 1 + KnownUser.failedAttempts(loginInfo.user);
    const firstFailedAttempt = KnownUser.firstFailedAttempt(loginInfo.user);
    const currentTime = Number(new Date());
    const canReset = currentTime - firstFailedAttempt > 1000 * this.settings.failureWindow;
    if (canReset) {
      failedAttempts = 1;
      KnownUser.resetAttempts(failedAttempts, userId);
    }
    const canIncrement = failedAttempts < this.settings.failuresBeforeLockout;
    if (canIncrement) {
      KnownUser.incrementAttempts(failedAttempts, userId);
    }
    const maxAttemptsAllowed = this.settings.failuresBeforeLockout;
    const attemptsRemaining = maxAttemptsAllowed - failedAttempts;
    if (unlockTime > currentTime) {
      let duration = unlockTime - currentTime;
      duration = Math.ceil(duration / 1000);
      duration = duration > 1 ? duration : 1;
      KnownUser.tooManyAttempts(duration);
    }
    if (failedAttempts === maxAttemptsAllowed) {
      this.setNewUnlockTime(failedAttempts, userId);
      let duration = this.settings.lockoutPeriod;
      duration = Math.ceil(duration);
      duration = duration > 1 ? duration : 1;
      return KnownUser.tooManyAttempts(duration);
    }
    return KnownUser.incorrectPassword(failedAttempts, maxAttemptsAllowed, attemptsRemaining);
  }
  static resetAttempts(failedAttempts, userId) {
    const currentTime = Number(new Date());
    const query = {
      _id: userId
    };
    const data = {
      $set: {
        'services.accounts-lockout.failedAttempts': failedAttempts,
        'services.accounts-lockout.lastFailedAttempt': currentTime,
        'services.accounts-lockout.firstFailedAttempt': currentTime
      }
    };
    Meteor.users.update(query, data);
  }
  static incrementAttempts(failedAttempts, userId) {
    const currentTime = Number(new Date());
    const query = {
      _id: userId
    };
    const data = {
      $set: {
        'services.accounts-lockout.failedAttempts': failedAttempts,
        'services.accounts-lockout.lastFailedAttempt': currentTime
      }
    };
    Meteor.users.update(query, data);
  }
  setNewUnlockTime(failedAttempts, userId) {
    const currentTime = Number(new Date());
    const newUnlockTime = 1000 * this.settings.lockoutPeriod + currentTime;
    const query = {
      _id: userId
    };
    const data = {
      $set: {
        'services.accounts-lockout.failedAttempts': failedAttempts,
        'services.accounts-lockout.lastFailedAttempt': currentTime,
        'services.accounts-lockout.unlockTime': newUnlockTime
      }
    };
    Meteor.users.update(query, data);
    Meteor.setTimeout(KnownUser.unlockAccount.bind(null, userId), this.settings.lockoutPeriod * 1000);
  }
  static onLogin(loginInfo) {
    if (loginInfo.type !== 'password') {
      return;
    }
    const userId = loginInfo.user._id;
    const query = {
      _id: userId
    };
    const data = {
      $unset: {
        'services.accounts-lockout.unlockTime': 0,
        'services.accounts-lockout.failedAttempts': 0
      }
    };
    Meteor.users.update(query, data);
  }
  static incorrectPassword(failedAttempts, maxAttemptsAllowed, attemptsRemaining) {
    throw new Meteor.Error(403, 'Incorrect password', JSON.stringify({
      message: 'Incorrect password',
      failedAttempts,
      maxAttemptsAllowed,
      attemptsRemaining
    }));
  }
  static tooManyAttempts(duration) {
    throw new Meteor.Error(403, 'Too many attempts', JSON.stringify({
      message: 'Wrong passwords were submitted too many times. Account is locked for a while.',
      duration
    }));
  }
  static knownUsers() {
    let knownUsers;
    try {
      knownUsers = Meteor.settings['accounts-lockout'].knownUsers;
    } catch (e) {
      knownUsers = false;
    }
    return knownUsers || false;
  }
  static unlockTime(user) {
    let unlockTime;
    try {
      unlockTime = user.services['accounts-lockout'].unlockTime;
    } catch (e) {
      unlockTime = 0;
    }
    return unlockTime || 0;
  }
  static failedAttempts(user) {
    let failedAttempts;
    try {
      failedAttempts = user.services['accounts-lockout'].failedAttempts;
    } catch (e) {
      failedAttempts = 0;
    }
    return failedAttempts || 0;
  }
  static lastFailedAttempt(user) {
    let lastFailedAttempt;
    try {
      lastFailedAttempt = user.services['accounts-lockout'].lastFailedAttempt;
    } catch (e) {
      lastFailedAttempt = 0;
    }
    return lastFailedAttempt || 0;
  }
  static firstFailedAttempt(user) {
    let firstFailedAttempt;
    try {
      firstFailedAttempt = user.services['accounts-lockout'].firstFailedAttempt;
    } catch (e) {
      firstFailedAttempt = 0;
    }
    return firstFailedAttempt || 0;
  }
  static unlockAccount(userId) {
    const query = {
      _id: userId
    };
    const data = {
      $unset: {
        'services.accounts-lockout.unlockTime': 0,
        'services.accounts-lockout.failedAttempts': 0
      }
    };
    Meteor.users.update(query, data);
  }
}
module.exportDefault(KnownUser);
///////////////////////////////////////////////////////////////////////////////////////////////////////////

},"unknownUser.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages/wekan-accounts-lockout/src/unknownUser.js                                                    //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 0);
let Accounts;
module.link("meteor/accounts-base", {
  Accounts(v) {
    Accounts = v;
  }
}, 1);
let _AccountsLockoutCollection;
module.link("./accountsLockoutCollection", {
  default(v) {
    _AccountsLockoutCollection = v;
  }
}, 2);
class UnknownUser {
  constructor(settings) {
    let {
      AccountsLockoutCollection = _AccountsLockoutCollection
    } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    this.AccountsLockoutCollection = AccountsLockoutCollection;
    this.settings = settings;
  }
  startup() {
    if (!(this.settings instanceof Function)) {
      this.updateSettings();
    }
    this.scheduleUnlocksForLockedAccounts();
    this.unlockAccountsIfLockoutAlreadyExpired();
    this.hookIntoAccounts();
  }
  updateSettings() {
    const settings = UnknownUser.unknownUsers();
    if (settings) {
      settings.forEach(function updateSetting(_ref) {
        let {
          key,
          value
        } = _ref;
        this.settings[key] = value;
      });
    }
    this.validateSettings();
  }
  validateSettings() {
    if (!this.settings.failuresBeforeLockout || this.settings.failuresBeforeLockout < 0) {
      throw new Error('"failuresBeforeLockout" is not positive integer');
    }
    if (!this.settings.lockoutPeriod || this.settings.lockoutPeriod < 0) {
      throw new Error('"lockoutPeriod" is not positive integer');
    }
    if (!this.settings.failureWindow || this.settings.failureWindow < 0) {
      throw new Error('"failureWindow" is not positive integer');
    }
  }
  scheduleUnlocksForLockedAccounts() {
    const lockedAccountsCursor = this.AccountsLockoutCollection.find({
      'services.accounts-lockout.unlockTime': {
        $gt: Number(new Date())
      }
    }, {
      fields: {
        'services.accounts-lockout.unlockTime': 1
      }
    });
    const currentTime = Number(new Date());
    lockedAccountsCursor.forEach(connection => {
      let lockDuration = this.unlockTime(connection) - currentTime;
      if (lockDuration >= this.settings.lockoutPeriod) {
        lockDuration = this.settings.lockoutPeriod * 1000;
      }
      if (lockDuration <= 1) {
        lockDuration = 1;
      }
      Meteor.setTimeout(this.unlockAccount.bind(this, connection.clientAddress), lockDuration);
    });
  }
  unlockAccountsIfLockoutAlreadyExpired() {
    const currentTime = Number(new Date());
    const query = {
      'services.accounts-lockout.unlockTime': {
        $lt: currentTime
      }
    };
    const data = {
      $unset: {
        'services.accounts-lockout.unlockTime': 0,
        'services.accounts-lockout.failedAttempts': 0
      }
    };
    this.AccountsLockoutCollection.update(query, data);
  }
  hookIntoAccounts() {
    Accounts.validateLoginAttempt(this.validateLoginAttempt.bind(this));
    Accounts.onLogin(this.onLogin.bind(this));
  }
  validateLoginAttempt(loginInfo) {
    // don't interrupt non-password logins
    if (loginInfo.type !== 'password' || loginInfo.user !== undefined || loginInfo.error === undefined || loginInfo.error.reason !== 'User not found') {
      return loginInfo.allowed;
    }
    if (this.settings instanceof Function) {
      this.settings = this.settings(loginInfo.connection);
      this.validateSettings();
    }
    const clientAddress = loginInfo.connection.clientAddress;
    const unlockTime = this.unlockTime(loginInfo.connection);
    let failedAttempts = 1 + this.failedAttempts(loginInfo.connection);
    const firstFailedAttempt = this.firstFailedAttempt(loginInfo.connection);
    const currentTime = Number(new Date());
    const canReset = currentTime - firstFailedAttempt > 1000 * this.settings.failureWindow;
    if (canReset) {
      failedAttempts = 1;
      this.resetAttempts(failedAttempts, clientAddress);
    }
    const canIncrement = failedAttempts < this.settings.failuresBeforeLockout;
    if (canIncrement) {
      this.incrementAttempts(failedAttempts, clientAddress);
    }
    const maxAttemptsAllowed = this.settings.failuresBeforeLockout;
    const attemptsRemaining = maxAttemptsAllowed - failedAttempts;
    if (unlockTime > currentTime) {
      let duration = unlockTime - currentTime;
      duration = Math.ceil(duration / 1000);
      duration = duration > 1 ? duration : 1;
      UnknownUser.tooManyAttempts(duration);
    }
    if (failedAttempts === maxAttemptsAllowed) {
      this.setNewUnlockTime(failedAttempts, clientAddress);
      let duration = this.settings.lockoutPeriod;
      duration = Math.ceil(duration);
      duration = duration > 1 ? duration : 1;
      return UnknownUser.tooManyAttempts(duration);
    }
    return UnknownUser.userNotFound(failedAttempts, maxAttemptsAllowed, attemptsRemaining);
  }
  resetAttempts(failedAttempts, clientAddress) {
    const currentTime = Number(new Date());
    const query = {
      clientAddress
    };
    const data = {
      $set: {
        'services.accounts-lockout.failedAttempts': failedAttempts,
        'services.accounts-lockout.lastFailedAttempt': currentTime,
        'services.accounts-lockout.firstFailedAttempt': currentTime
      }
    };
    this.AccountsLockoutCollection.upsert(query, data);
  }
  incrementAttempts(failedAttempts, clientAddress) {
    const currentTime = Number(new Date());
    const query = {
      clientAddress
    };
    const data = {
      $set: {
        'services.accounts-lockout.failedAttempts': failedAttempts,
        'services.accounts-lockout.lastFailedAttempt': currentTime
      }
    };
    this.AccountsLockoutCollection.upsert(query, data);
  }
  setNewUnlockTime(failedAttempts, clientAddress) {
    const currentTime = Number(new Date());
    const newUnlockTime = 1000 * this.settings.lockoutPeriod + currentTime;
    const query = {
      clientAddress
    };
    const data = {
      $set: {
        'services.accounts-lockout.failedAttempts': failedAttempts,
        'services.accounts-lockout.lastFailedAttempt': currentTime,
        'services.accounts-lockout.unlockTime': newUnlockTime
      }
    };
    this.AccountsLockoutCollection.upsert(query, data);
    Meteor.setTimeout(this.unlockAccount.bind(this, clientAddress), this.settings.lockoutPeriod * 1000);
  }
  onLogin(loginInfo) {
    if (loginInfo.type !== 'password') {
      return;
    }
    const clientAddress = loginInfo.connection.clientAddress;
    const query = {
      clientAddress
    };
    const data = {
      $unset: {
        'services.accounts-lockout.unlockTime': 0,
        'services.accounts-lockout.failedAttempts': 0
      }
    };
    this.AccountsLockoutCollection.update(query, data);
  }
  static userNotFound(failedAttempts, maxAttemptsAllowed, attemptsRemaining) {
    throw new Meteor.Error(403, 'User not found', JSON.stringify({
      message: 'User not found',
      failedAttempts,
      maxAttemptsAllowed,
      attemptsRemaining
    }));
  }
  static tooManyAttempts(duration) {
    throw new Meteor.Error(403, 'Too many attempts', JSON.stringify({
      message: 'Wrong emails were submitted too many times. Account is locked for a while.',
      duration
    }));
  }
  static unknownUsers() {
    let unknownUsers;
    try {
      unknownUsers = Meteor.settings['accounts-lockout'].unknownUsers;
    } catch (e) {
      unknownUsers = false;
    }
    return unknownUsers || false;
  }
  findOneByConnection(connection) {
    return this.AccountsLockoutCollection.findOne({
      clientAddress: connection.clientAddress
    });
  }
  unlockTime(connection) {
    connection = this.findOneByConnection(connection);
    let unlockTime;
    try {
      unlockTime = connection.services['accounts-lockout'].unlockTime;
    } catch (e) {
      unlockTime = 0;
    }
    return unlockTime || 0;
  }
  failedAttempts(connection) {
    connection = this.findOneByConnection(connection);
    let failedAttempts;
    try {
      failedAttempts = connection.services['accounts-lockout'].failedAttempts;
    } catch (e) {
      failedAttempts = 0;
    }
    return failedAttempts || 0;
  }
  lastFailedAttempt(connection) {
    connection = this.findOneByConnection(connection);
    let lastFailedAttempt;
    try {
      lastFailedAttempt = connection.services['accounts-lockout'].lastFailedAttempt;
    } catch (e) {
      lastFailedAttempt = 0;
    }
    return lastFailedAttempt || 0;
  }
  firstFailedAttempt(connection) {
    connection = this.findOneByConnection(connection);
    let firstFailedAttempt;
    try {
      firstFailedAttempt = connection.services['accounts-lockout'].firstFailedAttempt;
    } catch (e) {
      firstFailedAttempt = 0;
    }
    return firstFailedAttempt || 0;
  }
  unlockAccount(clientAddress) {
    const query = {
      clientAddress
    };
    const data = {
      $unset: {
        'services.accounts-lockout.unlockTime': 0,
        'services.accounts-lockout.failedAttempts': 0
      }
    };
    this.AccountsLockoutCollection.update(query, data);
  }
}
module.exportDefault(UnknownUser);
///////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/wekan-accounts-lockout/accounts-lockout.js");

/* Exports */
Package._define("wekan-accounts-lockout", exports);

})();

//# sourceURL=meteor://💻app/packages/wekan-accounts-lockout.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvd2VrYW4tYWNjb3VudHMtbG9ja291dC9hY2NvdW50cy1sb2Nrb3V0LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy93ZWthbi1hY2NvdW50cy1sb2Nrb3V0L3NyYy9hY2NvdW50c0xvY2tvdXQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3dla2FuLWFjY291bnRzLWxvY2tvdXQvc3JjL2FjY291bnRzTG9ja291dENvbGxlY3Rpb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3dla2FuLWFjY291bnRzLWxvY2tvdXQvc3JjL2tub3duVXNlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvd2VrYW4tYWNjb3VudHMtbG9ja291dC9zcmMvdW5rbm93blVzZXIuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0IiwiTmFtZSIsIkFjY291bnRzTG9ja291dCIsImxpbmsiLCJkZWZhdWx0IiwidiIsIktub3duVXNlciIsIlVua25vd25Vc2VyIiwiY29uc3RydWN0b3IiLCJfcmVmIiwia25vd25Vc2VycyIsImZhaWx1cmVzQmVmb3JlTG9ja291dCIsImxvY2tvdXRQZXJpb2QiLCJmYWlsdXJlV2luZG93IiwidW5rbm93blVzZXJzIiwic2V0dGluZ3MiLCJzdGFydHVwIiwiZXhwb3J0RGVmYXVsdCIsIk1ldGVvciIsIkNvbGxlY3Rpb24iLCJBY2NvdW50cyIsInVuY2hhbmdlZFNldHRpbmdzIiwiRnVuY3Rpb24iLCJ1cGRhdGVTZXR0aW5ncyIsInNjaGVkdWxlVW5sb2Nrc0ZvckxvY2tlZEFjY291bnRzIiwidW5sb2NrQWNjb3VudHNJZkxvY2tvdXRBbHJlYWR5RXhwaXJlZCIsImhvb2tJbnRvQWNjb3VudHMiLCJmb3JFYWNoIiwidXBkYXRlU2V0dGluZyIsImtleSIsInZhbHVlIiwidmFsaWRhdGVTZXR0aW5ncyIsIkVycm9yIiwibG9ja2VkQWNjb3VudHNDdXJzb3IiLCJ1c2VycyIsImZpbmQiLCIkZ3QiLCJOdW1iZXIiLCJEYXRlIiwiZmllbGRzIiwiY3VycmVudFRpbWUiLCJ1c2VyIiwibG9ja0R1cmF0aW9uIiwidW5sb2NrVGltZSIsInNldFRpbWVvdXQiLCJ1bmxvY2tBY2NvdW50IiwiYmluZCIsIl9pZCIsInF1ZXJ5IiwiJGx0IiwiZGF0YSIsIiR1bnNldCIsInVwZGF0ZSIsInZhbGlkYXRlTG9naW5BdHRlbXB0Iiwib25Mb2dpbiIsImxvZ2luSW5mbyIsInR5cGUiLCJ1bmRlZmluZWQiLCJlcnJvciIsInJlYXNvbiIsImFsbG93ZWQiLCJ1c2VySWQiLCJmYWlsZWRBdHRlbXB0cyIsImZpcnN0RmFpbGVkQXR0ZW1wdCIsImNhblJlc2V0IiwicmVzZXRBdHRlbXB0cyIsImNhbkluY3JlbWVudCIsImluY3JlbWVudEF0dGVtcHRzIiwibWF4QXR0ZW1wdHNBbGxvd2VkIiwiYXR0ZW1wdHNSZW1haW5pbmciLCJkdXJhdGlvbiIsIk1hdGgiLCJjZWlsIiwidG9vTWFueUF0dGVtcHRzIiwic2V0TmV3VW5sb2NrVGltZSIsImluY29ycmVjdFBhc3N3b3JkIiwiJHNldCIsIm5ld1VubG9ja1RpbWUiLCJKU09OIiwic3RyaW5naWZ5IiwibWVzc2FnZSIsImUiLCJzZXJ2aWNlcyIsImxhc3RGYWlsZWRBdHRlbXB0IiwiX0FjY291bnRzTG9ja291dENvbGxlY3Rpb24iLCJBY2NvdW50c0xvY2tvdXRDb2xsZWN0aW9uIiwiYXJndW1lbnRzIiwibGVuZ3RoIiwiY29ubmVjdGlvbiIsImNsaWVudEFkZHJlc3MiLCJ1c2VyTm90Rm91bmQiLCJ1cHNlcnQiLCJmaW5kT25lQnlDb25uZWN0aW9uIiwiZmluZE9uZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxNQUFNLENBQUNDLE1BQU0sQ0FBQztFQUFDQyxJQUFJLEVBQUNBLENBQUEsS0FBSUEsSUFBSTtFQUFDQyxlQUFlLEVBQUNBLENBQUEsS0FBSUE7QUFBZSxDQUFDLENBQUM7QUFBQyxJQUFJQSxlQUFl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SUFDRCxJQUFJLENBQUNrQyx5QkFBeUIsQ0FBQ2pDLE1BQU0sQ0FBQ0osS0FBSyxFQUFFRSxJQUFJLENBQUM7RUFDcEQ7QUFDRjtBQXRVQW5ELE1BQU0sQ0FBQ2tCLGFBQWEsQ0F3VUxWLFdBeFVTLENBQUMsQyIsImZpbGUiOiIvcGFja2FnZXMvd2VrYW4tYWNjb3VudHMtbG9ja291dC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBBY2NvdW50c0xvY2tvdXQgZnJvbSAnLi9zcmMvYWNjb3VudHNMb2Nrb3V0JztcblxuY29uc3QgTmFtZSA9ICd3ZWthbi1hY2NvdW50cy1sb2Nrb3V0JztcblxuZXhwb3J0IHsgTmFtZSwgQWNjb3VudHNMb2Nrb3V0IH07XG4iLCJpbXBvcnQgS25vd25Vc2VyIGZyb20gJy4va25vd25Vc2VyJztcbmltcG9ydCBVbmtub3duVXNlciBmcm9tICcuL3Vua25vd25Vc2VyJztcblxuY2xhc3MgQWNjb3VudHNMb2Nrb3V0IHtcbiAgY29uc3RydWN0b3Ioe1xuICAgIGtub3duVXNlcnMgPSB7XG4gICAgICBmYWlsdXJlc0JlZm9yZUxvY2tvdXQ6IDMsXG4gICAgICBsb2Nrb3V0UGVyaW9kOiA2MCxcbiAgICAgIGZhaWx1cmVXaW5kb3c6IDE1LFxuICAgIH0sXG4gICAgdW5rbm93blVzZXJzID0ge1xuICAgICAgZmFpbHVyZXNCZWZvcmVMb2Nrb3V0OiAzLFxuICAgICAgbG9ja291dFBlcmlvZDogNjAsXG4gICAgICBmYWlsdXJlV2luZG93OiAxNSxcbiAgICB9LFxuICB9KSB7XG4gICAgdGhpcy5zZXR0aW5ncyA9IHtcbiAgICAgIGtub3duVXNlcnMsXG4gICAgICB1bmtub3duVXNlcnMsXG4gICAgfTtcbiAgfVxuXG4gIHN0YXJ0dXAoKSB7XG4gICAgKG5ldyBLbm93blVzZXIodGhpcy5zZXR0aW5ncy5rbm93blVzZXJzKSkuc3RhcnR1cCgpO1xuICAgIChuZXcgVW5rbm93blVzZXIodGhpcy5zZXR0aW5ncy51bmtub3duVXNlcnMpKS5zdGFydHVwKCk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQWNjb3VudHNMb2Nrb3V0O1xuIiwiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5cbmV4cG9ydCBkZWZhdWx0IG5ldyBNZXRlb3IuQ29sbGVjdGlvbignQWNjb3VudHNMb2Nrb3V0LkNvbm5lY3Rpb25zJyk7XG4iLCIvKiBlc2xpbnQtZGlzYWJsZSBuby11bmRlcnNjb3JlLWRhbmdsZSAqL1xuXG5pbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IEFjY291bnRzIH0gZnJvbSAnbWV0ZW9yL2FjY291bnRzLWJhc2UnO1xuXG5jbGFzcyBLbm93blVzZXIge1xuICBjb25zdHJ1Y3RvcihzZXR0aW5ncykge1xuICAgIHRoaXMudW5jaGFuZ2VkU2V0dGluZ3MgPSBzZXR0aW5ncztcbiAgICB0aGlzLnNldHRpbmdzID0gc2V0dGluZ3M7XG4gIH1cblxuICBzdGFydHVwKCkge1xuICAgIGlmICghKHRoaXMudW5jaGFuZ2VkU2V0dGluZ3MgaW5zdGFuY2VvZiBGdW5jdGlvbikpIHtcbiAgICAgIHRoaXMudXBkYXRlU2V0dGluZ3MoKTtcbiAgICB9XG4gICAgdGhpcy5zY2hlZHVsZVVubG9ja3NGb3JMb2NrZWRBY2NvdW50cygpO1xuICAgIEtub3duVXNlci51bmxvY2tBY2NvdW50c0lmTG9ja291dEFscmVhZHlFeHBpcmVkKCk7XG4gICAgdGhpcy5ob29rSW50b0FjY291bnRzKCk7XG4gIH1cblxuICB1cGRhdGVTZXR0aW5ncygpIHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IEtub3duVXNlci5rbm93blVzZXJzKCk7XG4gICAgaWYgKHNldHRpbmdzKSB7XG4gICAgICBzZXR0aW5ncy5mb3JFYWNoKGZ1bmN0aW9uIHVwZGF0ZVNldHRpbmcoeyBrZXksIHZhbHVlIH0pIHtcbiAgICAgICAgdGhpcy5zZXR0aW5nc1trZXldID0gdmFsdWU7XG4gICAgICB9KTtcbiAgICB9XG4gICAgdGhpcy52YWxpZGF0ZVNldHRpbmdzKCk7XG4gIH1cblxuICB2YWxpZGF0ZVNldHRpbmdzKCkge1xuICAgIGlmIChcbiAgICAgICF0aGlzLnNldHRpbmdzLmZhaWx1cmVzQmVmb3JlTG9ja291dCB8fFxuICAgICAgdGhpcy5zZXR0aW5ncy5mYWlsdXJlc0JlZm9yZUxvY2tvdXQgPCAwXG4gICAgKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1wiZmFpbHVyZXNCZWZvcmVMb2Nrb3V0XCIgaXMgbm90IHBvc2l0aXZlIGludGVnZXInKTtcbiAgICB9XG4gICAgaWYgKFxuICAgICAgIXRoaXMuc2V0dGluZ3MubG9ja291dFBlcmlvZCB8fFxuICAgICAgdGhpcy5zZXR0aW5ncy5sb2Nrb3V0UGVyaW9kIDwgMFxuICAgICkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdcImxvY2tvdXRQZXJpb2RcIiBpcyBub3QgcG9zaXRpdmUgaW50ZWdlcicpO1xuICAgIH1cbiAgICBpZiAoXG4gICAgICAhdGhpcy5zZXR0aW5ncy5mYWlsdXJlV2luZG93IHx8XG4gICAgICB0aGlzLnNldHRpbmdzLmZhaWx1cmVXaW5kb3cgPCAwXG4gICAgKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1wiZmFpbHVyZVdpbmRvd1wiIGlzIG5vdCBwb3NpdGl2ZSBpbnRlZ2VyJyk7XG4gICAgfVxuICB9XG5cbiAgc2NoZWR1bGVVbmxvY2tzRm9yTG9ja2VkQWNjb3VudHMoKSB7XG4gICAgY29uc3QgbG9ja2VkQWNjb3VudHNDdXJzb3IgPSBNZXRlb3IudXNlcnMuZmluZChcbiAgICAgIHtcbiAgICAgICAgJ3NlcnZpY2VzLmFjY291bnRzLWxvY2tvdXQudW5sb2NrVGltZSc6IHtcbiAgICAgICAgICAkZ3Q6IE51bWJlcihuZXcgRGF0ZSgpKSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGZpZWxkczoge1xuICAgICAgICAgICdzZXJ2aWNlcy5hY2NvdW50cy1sb2Nrb3V0LnVubG9ja1RpbWUnOiAxLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICApO1xuICAgIGNvbnN0IGN1cnJlbnRUaW1lID0gTnVtYmVyKG5ldyBEYXRlKCkpO1xuICAgIGxvY2tlZEFjY291bnRzQ3Vyc29yLmZvckVhY2goKHVzZXIpID0+IHtcbiAgICAgIGxldCBsb2NrRHVyYXRpb24gPSBLbm93blVzZXIudW5sb2NrVGltZSh1c2VyKSAtIGN1cnJlbnRUaW1lO1xuICAgICAgaWYgKGxvY2tEdXJhdGlvbiA+PSB0aGlzLnNldHRpbmdzLmxvY2tvdXRQZXJpb2QpIHtcbiAgICAgICAgbG9ja0R1cmF0aW9uID0gdGhpcy5zZXR0aW5ncy5sb2Nrb3V0UGVyaW9kICogMTAwMDtcbiAgICAgIH1cbiAgICAgIGlmIChsb2NrRHVyYXRpb24gPD0gMSkge1xuICAgICAgICBsb2NrRHVyYXRpb24gPSAxO1xuICAgICAgfVxuICAgICAgTWV0ZW9yLnNldFRpbWVvdXQoXG4gICAgICAgIEtub3duVXNlci51bmxvY2tBY2NvdW50LmJpbmQobnVsbCwgdXNlci5faWQpLFxuICAgICAgICBsb2NrRHVyYXRpb24sXG4gICAgICApO1xuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIHVubG9ja0FjY291bnRzSWZMb2Nrb3V0QWxyZWFkeUV4cGlyZWQoKSB7XG4gICAgY29uc3QgY3VycmVudFRpbWUgPSBOdW1iZXIobmV3IERhdGUoKSk7XG4gICAgY29uc3QgcXVlcnkgPSB7XG4gICAgICAnc2VydmljZXMuYWNjb3VudHMtbG9ja291dC51bmxvY2tUaW1lJzoge1xuICAgICAgICAkbHQ6IGN1cnJlbnRUaW1lLFxuICAgICAgfSxcbiAgICB9O1xuICAgIGNvbnN0IGRhdGEgPSB7XG4gICAgICAkdW5zZXQ6IHtcbiAgICAgICAgJ3NlcnZpY2VzLmFjY291bnRzLWxvY2tvdXQudW5sb2NrVGltZSc6IDAsXG4gICAgICAgICdzZXJ2aWNlcy5hY2NvdW50cy1sb2Nrb3V0LmZhaWxlZEF0dGVtcHRzJzogMCxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBNZXRlb3IudXNlcnMudXBkYXRlKHF1ZXJ5LCBkYXRhKTtcbiAgfVxuXG4gIGhvb2tJbnRvQWNjb3VudHMoKSB7XG4gICAgQWNjb3VudHMudmFsaWRhdGVMb2dpbkF0dGVtcHQodGhpcy52YWxpZGF0ZUxvZ2luQXR0ZW1wdC5iaW5kKHRoaXMpKTtcbiAgICBBY2NvdW50cy5vbkxvZ2luKEtub3duVXNlci5vbkxvZ2luKTtcbiAgfVxuXG5cbiAgdmFsaWRhdGVMb2dpbkF0dGVtcHQobG9naW5JbmZvKSB7XG4gICAgaWYgKFxuICAgICAgLy8gZG9uJ3QgaW50ZXJydXB0IG5vbi1wYXNzd29yZCBsb2dpbnNcbiAgICAgIGxvZ2luSW5mby50eXBlICE9PSAncGFzc3dvcmQnIHx8XG4gICAgICBsb2dpbkluZm8udXNlciA9PT0gdW5kZWZpbmVkIHx8XG4gICAgICAvLyBEb24ndCBoYW5kbGUgZXJyb3JzIHVubGVzcyB0aGV5IGFyZSBkdWUgdG8gaW5jb3JyZWN0IHBhc3N3b3JkXG4gICAgICAobG9naW5JbmZvLmVycm9yICE9PSB1bmRlZmluZWQgJiYgbG9naW5JbmZvLmVycm9yLnJlYXNvbiAhPT0gJ0luY29ycmVjdCBwYXNzd29yZCcpXG4gICAgKSB7XG4gICAgICByZXR1cm4gbG9naW5JbmZvLmFsbG93ZWQ7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlcmUgd2FzIG5vIGxvZ2luIGVycm9yIGFuZCB0aGUgYWNjb3VudCBpcyBOT1QgbG9ja2VkLCBkb24ndCBpbnRlcnJ1cHRcbiAgICBjb25zdCB1bmxvY2tUaW1lID0gS25vd25Vc2VyLnVubG9ja1RpbWUobG9naW5JbmZvLnVzZXIpO1xuICAgIGlmIChsb2dpbkluZm8uZXJyb3IgPT09IHVuZGVmaW5lZCAmJiB1bmxvY2tUaW1lID09PSAwKSB7XG4gICAgICByZXR1cm4gbG9naW5JbmZvLmFsbG93ZWQ7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMudW5jaGFuZ2VkU2V0dGluZ3MgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgICAgdGhpcy5zZXR0aW5ncyA9IHRoaXMudW5jaGFuZ2VkU2V0dGluZ3MobG9naW5JbmZvLnVzZXIpO1xuICAgICAgdGhpcy52YWxpZGF0ZVNldHRpbmdzKCk7XG4gICAgfVxuXG4gICAgY29uc3QgdXNlcklkID0gbG9naW5JbmZvLnVzZXIuX2lkO1xuICAgIGxldCBmYWlsZWRBdHRlbXB0cyA9IDEgKyBLbm93blVzZXIuZmFpbGVkQXR0ZW1wdHMobG9naW5JbmZvLnVzZXIpO1xuICAgIGNvbnN0IGZpcnN0RmFpbGVkQXR0ZW1wdCA9IEtub3duVXNlci5maXJzdEZhaWxlZEF0dGVtcHQobG9naW5JbmZvLnVzZXIpO1xuICAgIGNvbnN0IGN1cnJlbnRUaW1lID0gTnVtYmVyKG5ldyBEYXRlKCkpO1xuXG4gICAgY29uc3QgY2FuUmVzZXQgPSAoY3VycmVudFRpbWUgLSBmaXJzdEZhaWxlZEF0dGVtcHQpID4gKDEwMDAgKiB0aGlzLnNldHRpbmdzLmZhaWx1cmVXaW5kb3cpO1xuICAgIGlmIChjYW5SZXNldCkge1xuICAgICAgZmFpbGVkQXR0ZW1wdHMgPSAxO1xuICAgICAgS25vd25Vc2VyLnJlc2V0QXR0ZW1wdHMoZmFpbGVkQXR0ZW1wdHMsIHVzZXJJZCk7XG4gICAgfVxuXG4gICAgY29uc3QgY2FuSW5jcmVtZW50ID0gZmFpbGVkQXR0ZW1wdHMgPCB0aGlzLnNldHRpbmdzLmZhaWx1cmVzQmVmb3JlTG9ja291dDtcbiAgICBpZiAoY2FuSW5jcmVtZW50KSB7XG4gICAgICBLbm93blVzZXIuaW5jcmVtZW50QXR0ZW1wdHMoZmFpbGVkQXR0ZW1wdHMsIHVzZXJJZCk7XG4gICAgfVxuXG4gICAgY29uc3QgbWF4QXR0ZW1wdHNBbGxvd2VkID0gdGhpcy5zZXR0aW5ncy5mYWlsdXJlc0JlZm9yZUxvY2tvdXQ7XG4gICAgY29uc3QgYXR0ZW1wdHNSZW1haW5pbmcgPSBtYXhBdHRlbXB0c0FsbG93ZWQgLSBmYWlsZWRBdHRlbXB0cztcbiAgICBpZiAodW5sb2NrVGltZSA+IGN1cnJlbnRUaW1lKSB7XG4gICAgICBsZXQgZHVyYXRpb24gPSB1bmxvY2tUaW1lIC0gY3VycmVudFRpbWU7XG4gICAgICBkdXJhdGlvbiA9IE1hdGguY2VpbChkdXJhdGlvbiAvIDEwMDApO1xuICAgICAgZHVyYXRpb24gPSBkdXJhdGlvbiA+IDEgPyBkdXJhdGlvbiA6IDE7XG4gICAgICBLbm93blVzZXIudG9vTWFueUF0dGVtcHRzKGR1cmF0aW9uKTtcbiAgICB9XG4gICAgaWYgKGZhaWxlZEF0dGVtcHRzID09PSBtYXhBdHRlbXB0c0FsbG93ZWQpIHtcbiAgICAgIHRoaXMuc2V0TmV3VW5sb2NrVGltZShmYWlsZWRBdHRlbXB0cywgdXNlcklkKTtcblxuICAgICAgbGV0IGR1cmF0aW9uID0gdGhpcy5zZXR0aW5ncy5sb2Nrb3V0UGVyaW9kO1xuICAgICAgZHVyYXRpb24gPSBNYXRoLmNlaWwoZHVyYXRpb24pO1xuICAgICAgZHVyYXRpb24gPSBkdXJhdGlvbiA+IDEgPyBkdXJhdGlvbiA6IDE7XG4gICAgICByZXR1cm4gS25vd25Vc2VyLnRvb01hbnlBdHRlbXB0cyhkdXJhdGlvbik7XG4gICAgfVxuICAgIHJldHVybiBLbm93blVzZXIuaW5jb3JyZWN0UGFzc3dvcmQoXG4gICAgICBmYWlsZWRBdHRlbXB0cyxcbiAgICAgIG1heEF0dGVtcHRzQWxsb3dlZCxcbiAgICAgIGF0dGVtcHRzUmVtYWluaW5nLFxuICAgICk7XG4gIH1cblxuICBzdGF0aWMgcmVzZXRBdHRlbXB0cyhcbiAgICBmYWlsZWRBdHRlbXB0cyxcbiAgICB1c2VySWQsXG4gICkge1xuICAgIGNvbnN0IGN1cnJlbnRUaW1lID0gTnVtYmVyKG5ldyBEYXRlKCkpO1xuICAgIGNvbnN0IHF1ZXJ5ID0geyBfaWQ6IHVzZXJJZCB9O1xuICAgIGNvbnN0IGRhdGEgPSB7XG4gICAgICAkc2V0OiB7XG4gICAgICAgICdzZXJ2aWNlcy5hY2NvdW50cy1sb2Nrb3V0LmZhaWxlZEF0dGVtcHRzJzogZmFpbGVkQXR0ZW1wdHMsXG4gICAgICAgICdzZXJ2aWNlcy5hY2NvdW50cy1sb2Nrb3V0Lmxhc3RGYWlsZWRBdHRlbXB0JzogY3VycmVudFRpbWUsXG4gICAgICAgICdzZXJ2aWNlcy5hY2NvdW50cy1sb2Nrb3V0LmZpcnN0RmFpbGVkQXR0ZW1wdCc6IGN1cnJlbnRUaW1lLFxuICAgICAgfSxcbiAgICB9O1xuICAgIE1ldGVvci51c2Vycy51cGRhdGUocXVlcnksIGRhdGEpO1xuICB9XG5cbiAgc3RhdGljIGluY3JlbWVudEF0dGVtcHRzKFxuICAgIGZhaWxlZEF0dGVtcHRzLFxuICAgIHVzZXJJZCxcbiAgKSB7XG4gICAgY29uc3QgY3VycmVudFRpbWUgPSBOdW1iZXIobmV3IERhdGUoKSk7XG4gICAgY29uc3QgcXVlcnkgPSB7IF9pZDogdXNlcklkIH07XG4gICAgY29uc3QgZGF0YSA9IHtcbiAgICAgICRzZXQ6IHtcbiAgICAgICAgJ3NlcnZpY2VzLmFjY291bnRzLWxvY2tvdXQuZmFpbGVkQXR0ZW1wdHMnOiBmYWlsZWRBdHRlbXB0cyxcbiAgICAgICAgJ3NlcnZpY2VzLmFjY291bnRzLWxvY2tvdXQubGFzdEZhaWxlZEF0dGVtcHQnOiBjdXJyZW50VGltZSxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBNZXRlb3IudXNlcnMudXBkYXRlKHF1ZXJ5LCBkYXRhKTtcbiAgfVxuXG4gIHNldE5ld1VubG9ja1RpbWUoXG4gICAgZmFpbGVkQXR0ZW1wdHMsXG4gICAgdXNlcklkLFxuICApIHtcbiAgICBjb25zdCBjdXJyZW50VGltZSA9IE51bWJlcihuZXcgRGF0ZSgpKTtcbiAgICBjb25zdCBuZXdVbmxvY2tUaW1lID0gKDEwMDAgKiB0aGlzLnNldHRpbmdzLmxvY2tvdXRQZXJpb2QpICsgY3VycmVudFRpbWU7XG4gICAgY29uc3QgcXVlcnkgPSB7IF9pZDogdXNlcklkIH07XG4gICAgY29uc3QgZGF0YSA9IHtcbiAgICAgICRzZXQ6IHtcbiAgICAgICAgJ3NlcnZpY2VzLmFjY291bnRzLWxvY2tvdXQuZmFpbGVkQXR0ZW1wdHMnOiBmYWlsZWRBdHRlbXB0cyxcbiAgICAgICAgJ3NlcnZpY2VzLmFjY291bnRzLWxvY2tvdXQubGFzdEZhaWxlZEF0dGVtcHQnOiBjdXJyZW50VGltZSxcbiAgICAgICAgJ3NlcnZpY2VzLmFjY291bnRzLWxvY2tvdXQudW5sb2NrVGltZSc6IG5ld1VubG9ja1RpbWUsXG4gICAgICB9LFxuICAgIH07XG4gICAgTWV0ZW9yLnVzZXJzLnVwZGF0ZShxdWVyeSwgZGF0YSk7XG4gICAgTWV0ZW9yLnNldFRpbWVvdXQoXG4gICAgICBLbm93blVzZXIudW5sb2NrQWNjb3VudC5iaW5kKG51bGwsIHVzZXJJZCksXG4gICAgICB0aGlzLnNldHRpbmdzLmxvY2tvdXRQZXJpb2QgKiAxMDAwLFxuICAgICk7XG4gIH1cblxuICBzdGF0aWMgb25Mb2dpbihsb2dpbkluZm8pIHtcbiAgICBpZiAobG9naW5JbmZvLnR5cGUgIT09ICdwYXNzd29yZCcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgdXNlcklkID0gbG9naW5JbmZvLnVzZXIuX2lkO1xuICAgIGNvbnN0IHF1ZXJ5ID0geyBfaWQ6IHVzZXJJZCB9O1xuICAgIGNvbnN0IGRhdGEgPSB7XG4gICAgICAkdW5zZXQ6IHtcbiAgICAgICAgJ3NlcnZpY2VzLmFjY291bnRzLWxvY2tvdXQudW5sb2NrVGltZSc6IDAsXG4gICAgICAgICdzZXJ2aWNlcy5hY2NvdW50cy1sb2Nrb3V0LmZhaWxlZEF0dGVtcHRzJzogMCxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBNZXRlb3IudXNlcnMudXBkYXRlKHF1ZXJ5LCBkYXRhKTtcbiAgfVxuXG4gIHN0YXRpYyBpbmNvcnJlY3RQYXNzd29yZChcbiAgICBmYWlsZWRBdHRlbXB0cyxcbiAgICBtYXhBdHRlbXB0c0FsbG93ZWQsXG4gICAgYXR0ZW1wdHNSZW1haW5pbmcsXG4gICkge1xuICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXG4gICAgICA0MDMsXG4gICAgICAnSW5jb3JyZWN0IHBhc3N3b3JkJyxcbiAgICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgbWVzc2FnZTogJ0luY29ycmVjdCBwYXNzd29yZCcsXG4gICAgICAgIGZhaWxlZEF0dGVtcHRzLFxuICAgICAgICBtYXhBdHRlbXB0c0FsbG93ZWQsXG4gICAgICAgIGF0dGVtcHRzUmVtYWluaW5nLFxuICAgICAgfSksXG4gICAgKTtcbiAgfVxuXG4gIHN0YXRpYyB0b29NYW55QXR0ZW1wdHMoZHVyYXRpb24pIHtcbiAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFxuICAgICAgNDAzLFxuICAgICAgJ1RvbyBtYW55IGF0dGVtcHRzJyxcbiAgICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgbWVzc2FnZTogJ1dyb25nIHBhc3N3b3JkcyB3ZXJlIHN1Ym1pdHRlZCB0b28gbWFueSB0aW1lcy4gQWNjb3VudCBpcyBsb2NrZWQgZm9yIGEgd2hpbGUuJyxcbiAgICAgICAgZHVyYXRpb24sXG4gICAgICB9KSxcbiAgICApO1xuICB9XG5cbiAgc3RhdGljIGtub3duVXNlcnMoKSB7XG4gICAgbGV0IGtub3duVXNlcnM7XG4gICAgdHJ5IHtcbiAgICAgIGtub3duVXNlcnMgPSBNZXRlb3Iuc2V0dGluZ3NbJ2FjY291bnRzLWxvY2tvdXQnXS5rbm93blVzZXJzO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGtub3duVXNlcnMgPSBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIGtub3duVXNlcnMgfHwgZmFsc2U7XG4gIH1cblxuICBzdGF0aWMgdW5sb2NrVGltZSh1c2VyKSB7XG4gICAgbGV0IHVubG9ja1RpbWU7XG4gICAgdHJ5IHtcbiAgICAgIHVubG9ja1RpbWUgPSB1c2VyLnNlcnZpY2VzWydhY2NvdW50cy1sb2Nrb3V0J10udW5sb2NrVGltZTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB1bmxvY2tUaW1lID0gMDtcbiAgICB9XG4gICAgcmV0dXJuIHVubG9ja1RpbWUgfHwgMDtcbiAgfVxuXG4gIHN0YXRpYyBmYWlsZWRBdHRlbXB0cyh1c2VyKSB7XG4gICAgbGV0IGZhaWxlZEF0dGVtcHRzO1xuICAgIHRyeSB7XG4gICAgICBmYWlsZWRBdHRlbXB0cyA9IHVzZXIuc2VydmljZXNbJ2FjY291bnRzLWxvY2tvdXQnXS5mYWlsZWRBdHRlbXB0cztcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBmYWlsZWRBdHRlbXB0cyA9IDA7XG4gICAgfVxuICAgIHJldHVybiBmYWlsZWRBdHRlbXB0cyB8fCAwO1xuICB9XG5cbiAgc3RhdGljIGxhc3RGYWlsZWRBdHRlbXB0KHVzZXIpIHtcbiAgICBsZXQgbGFzdEZhaWxlZEF0dGVtcHQ7XG4gICAgdHJ5IHtcbiAgICAgIGxhc3RGYWlsZWRBdHRlbXB0ID0gdXNlci5zZXJ2aWNlc1snYWNjb3VudHMtbG9ja291dCddLmxhc3RGYWlsZWRBdHRlbXB0O1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGxhc3RGYWlsZWRBdHRlbXB0ID0gMDtcbiAgICB9XG4gICAgcmV0dXJuIGxhc3RGYWlsZWRBdHRlbXB0IHx8IDA7XG4gIH1cblxuICBzdGF0aWMgZmlyc3RGYWlsZWRBdHRlbXB0KHVzZXIpIHtcbiAgICBsZXQgZmlyc3RGYWlsZWRBdHRlbXB0O1xuICAgIHRyeSB7XG4gICAgICBmaXJzdEZhaWxlZEF0dGVtcHQgPSB1c2VyLnNlcnZpY2VzWydhY2NvdW50cy1sb2Nrb3V0J10uZmlyc3RGYWlsZWRBdHRlbXB0O1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGZpcnN0RmFpbGVkQXR0ZW1wdCA9IDA7XG4gICAgfVxuICAgIHJldHVybiBmaXJzdEZhaWxlZEF0dGVtcHQgfHwgMDtcbiAgfVxuXG4gIHN0YXRpYyB1bmxvY2tBY2NvdW50KHVzZXJJZCkge1xuICAgIGNvbnN0IHF1ZXJ5ID0geyBfaWQ6IHVzZXJJZCB9O1xuICAgIGNvbnN0IGRhdGEgPSB7XG4gICAgICAkdW5zZXQ6IHtcbiAgICAgICAgJ3NlcnZpY2VzLmFjY291bnRzLWxvY2tvdXQudW5sb2NrVGltZSc6IDAsXG4gICAgICAgICdzZXJ2aWNlcy5hY2NvdW50cy1sb2Nrb3V0LmZhaWxlZEF0dGVtcHRzJzogMCxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBNZXRlb3IudXNlcnMudXBkYXRlKHF1ZXJ5LCBkYXRhKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBLbm93blVzZXI7XG4iLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IEFjY291bnRzIH0gZnJvbSAnbWV0ZW9yL2FjY291bnRzLWJhc2UnO1xuaW1wb3J0IF9BY2NvdW50c0xvY2tvdXRDb2xsZWN0aW9uIGZyb20gJy4vYWNjb3VudHNMb2Nrb3V0Q29sbGVjdGlvbic7XG5cbmNsYXNzIFVua25vd25Vc2VyIHtcbiAgY29uc3RydWN0b3IoXG4gICAgc2V0dGluZ3MsXG4gICAge1xuICAgICAgQWNjb3VudHNMb2Nrb3V0Q29sbGVjdGlvbiA9IF9BY2NvdW50c0xvY2tvdXRDb2xsZWN0aW9uLFxuICAgIH0gPSB7fSxcbiAgKSB7XG4gICAgdGhpcy5BY2NvdW50c0xvY2tvdXRDb2xsZWN0aW9uID0gQWNjb3VudHNMb2Nrb3V0Q29sbGVjdGlvbjtcbiAgICB0aGlzLnNldHRpbmdzID0gc2V0dGluZ3M7XG4gIH1cblxuICBzdGFydHVwKCkge1xuICAgIGlmICghKHRoaXMuc2V0dGluZ3MgaW5zdGFuY2VvZiBGdW5jdGlvbikpIHtcbiAgICAgIHRoaXMudXBkYXRlU2V0dGluZ3MoKTtcbiAgICB9XG4gICAgdGhpcy5zY2hlZHVsZVVubG9ja3NGb3JMb2NrZWRBY2NvdW50cygpO1xuICAgIHRoaXMudW5sb2NrQWNjb3VudHNJZkxvY2tvdXRBbHJlYWR5RXhwaXJlZCgpO1xuICAgIHRoaXMuaG9va0ludG9BY2NvdW50cygpO1xuICB9XG5cbiAgdXBkYXRlU2V0dGluZ3MoKSB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSBVbmtub3duVXNlci51bmtub3duVXNlcnMoKTtcbiAgICBpZiAoc2V0dGluZ3MpIHtcbiAgICAgIHNldHRpbmdzLmZvckVhY2goZnVuY3Rpb24gdXBkYXRlU2V0dGluZyh7IGtleSwgdmFsdWUgfSkge1xuICAgICAgICB0aGlzLnNldHRpbmdzW2tleV0gPSB2YWx1ZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICB0aGlzLnZhbGlkYXRlU2V0dGluZ3MoKTtcbiAgfVxuXG4gIHZhbGlkYXRlU2V0dGluZ3MoKSB7XG4gICAgaWYgKFxuICAgICAgIXRoaXMuc2V0dGluZ3MuZmFpbHVyZXNCZWZvcmVMb2Nrb3V0IHx8XG4gICAgICB0aGlzLnNldHRpbmdzLmZhaWx1cmVzQmVmb3JlTG9ja291dCA8IDBcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignXCJmYWlsdXJlc0JlZm9yZUxvY2tvdXRcIiBpcyBub3QgcG9zaXRpdmUgaW50ZWdlcicpO1xuICAgIH1cbiAgICBpZiAoXG4gICAgICAhdGhpcy5zZXR0aW5ncy5sb2Nrb3V0UGVyaW9kIHx8XG4gICAgICB0aGlzLnNldHRpbmdzLmxvY2tvdXRQZXJpb2QgPCAwXG4gICAgKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1wibG9ja291dFBlcmlvZFwiIGlzIG5vdCBwb3NpdGl2ZSBpbnRlZ2VyJyk7XG4gICAgfVxuICAgIGlmIChcbiAgICAgICF0aGlzLnNldHRpbmdzLmZhaWx1cmVXaW5kb3cgfHxcbiAgICAgIHRoaXMuc2V0dGluZ3MuZmFpbHVyZVdpbmRvdyA8IDBcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignXCJmYWlsdXJlV2luZG93XCIgaXMgbm90IHBvc2l0aXZlIGludGVnZXInKTtcbiAgICB9XG4gIH1cblxuICBzY2hlZHVsZVVubG9ja3NGb3JMb2NrZWRBY2NvdW50cygpIHtcbiAgICBjb25zdCBsb2NrZWRBY2NvdW50c0N1cnNvciA9IHRoaXMuQWNjb3VudHNMb2Nrb3V0Q29sbGVjdGlvbi5maW5kKFxuICAgICAge1xuICAgICAgICAnc2VydmljZXMuYWNjb3VudHMtbG9ja291dC51bmxvY2tUaW1lJzoge1xuICAgICAgICAgICRndDogTnVtYmVyKG5ldyBEYXRlKCkpLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgJ3NlcnZpY2VzLmFjY291bnRzLWxvY2tvdXQudW5sb2NrVGltZSc6IDEsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICk7XG4gICAgY29uc3QgY3VycmVudFRpbWUgPSBOdW1iZXIobmV3IERhdGUoKSk7XG4gICAgbG9ja2VkQWNjb3VudHNDdXJzb3IuZm9yRWFjaCgoY29ubmVjdGlvbikgPT4ge1xuICAgICAgbGV0IGxvY2tEdXJhdGlvbiA9IHRoaXMudW5sb2NrVGltZShjb25uZWN0aW9uKSAtIGN1cnJlbnRUaW1lO1xuICAgICAgaWYgKGxvY2tEdXJhdGlvbiA+PSB0aGlzLnNldHRpbmdzLmxvY2tvdXRQZXJpb2QpIHtcbiAgICAgICAgbG9ja0R1cmF0aW9uID0gdGhpcy5zZXR0aW5ncy5sb2Nrb3V0UGVyaW9kICogMTAwMDtcbiAgICAgIH1cbiAgICAgIGlmIChsb2NrRHVyYXRpb24gPD0gMSkge1xuICAgICAgICBsb2NrRHVyYXRpb24gPSAxO1xuICAgICAgfVxuICAgICAgTWV0ZW9yLnNldFRpbWVvdXQoXG4gICAgICAgIHRoaXMudW5sb2NrQWNjb3VudC5iaW5kKHRoaXMsIGNvbm5lY3Rpb24uY2xpZW50QWRkcmVzcyksXG4gICAgICAgIGxvY2tEdXJhdGlvbixcbiAgICAgICk7XG4gICAgfSk7XG4gIH1cblxuICB1bmxvY2tBY2NvdW50c0lmTG9ja291dEFscmVhZHlFeHBpcmVkKCkge1xuICAgIGNvbnN0IGN1cnJlbnRUaW1lID0gTnVtYmVyKG5ldyBEYXRlKCkpO1xuICAgIGNvbnN0IHF1ZXJ5ID0ge1xuICAgICAgJ3NlcnZpY2VzLmFjY291bnRzLWxvY2tvdXQudW5sb2NrVGltZSc6IHtcbiAgICAgICAgJGx0OiBjdXJyZW50VGltZSxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBjb25zdCBkYXRhID0ge1xuICAgICAgJHVuc2V0OiB7XG4gICAgICAgICdzZXJ2aWNlcy5hY2NvdW50cy1sb2Nrb3V0LnVubG9ja1RpbWUnOiAwLFxuICAgICAgICAnc2VydmljZXMuYWNjb3VudHMtbG9ja291dC5mYWlsZWRBdHRlbXB0cyc6IDAsXG4gICAgICB9LFxuICAgIH07XG4gICAgdGhpcy5BY2NvdW50c0xvY2tvdXRDb2xsZWN0aW9uLnVwZGF0ZShxdWVyeSwgZGF0YSk7XG4gIH1cblxuICBob29rSW50b0FjY291bnRzKCkge1xuICAgIEFjY291bnRzLnZhbGlkYXRlTG9naW5BdHRlbXB0KHRoaXMudmFsaWRhdGVMb2dpbkF0dGVtcHQuYmluZCh0aGlzKSk7XG4gICAgQWNjb3VudHMub25Mb2dpbih0aGlzLm9uTG9naW4uYmluZCh0aGlzKSk7XG4gIH1cblxuICB2YWxpZGF0ZUxvZ2luQXR0ZW1wdChsb2dpbkluZm8pIHtcbiAgICAvLyBkb24ndCBpbnRlcnJ1cHQgbm9uLXBhc3N3b3JkIGxvZ2luc1xuICAgIGlmIChcbiAgICAgIGxvZ2luSW5mby50eXBlICE9PSAncGFzc3dvcmQnIHx8XG4gICAgICBsb2dpbkluZm8udXNlciAhPT0gdW5kZWZpbmVkIHx8XG4gICAgICBsb2dpbkluZm8uZXJyb3IgPT09IHVuZGVmaW5lZCB8fFxuICAgICAgbG9naW5JbmZvLmVycm9yLnJlYXNvbiAhPT0gJ1VzZXIgbm90IGZvdW5kJ1xuICAgICkge1xuICAgICAgcmV0dXJuIGxvZ2luSW5mby5hbGxvd2VkO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnNldHRpbmdzIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICAgIHRoaXMuc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzKGxvZ2luSW5mby5jb25uZWN0aW9uKTtcbiAgICAgIHRoaXMudmFsaWRhdGVTZXR0aW5ncygpO1xuICAgIH1cblxuICAgIGNvbnN0IGNsaWVudEFkZHJlc3MgPSBsb2dpbkluZm8uY29ubmVjdGlvbi5jbGllbnRBZGRyZXNzO1xuICAgIGNvbnN0IHVubG9ja1RpbWUgPSB0aGlzLnVubG9ja1RpbWUobG9naW5JbmZvLmNvbm5lY3Rpb24pO1xuICAgIGxldCBmYWlsZWRBdHRlbXB0cyA9IDEgKyB0aGlzLmZhaWxlZEF0dGVtcHRzKGxvZ2luSW5mby5jb25uZWN0aW9uKTtcbiAgICBjb25zdCBmaXJzdEZhaWxlZEF0dGVtcHQgPSB0aGlzLmZpcnN0RmFpbGVkQXR0ZW1wdChsb2dpbkluZm8uY29ubmVjdGlvbik7XG4gICAgY29uc3QgY3VycmVudFRpbWUgPSBOdW1iZXIobmV3IERhdGUoKSk7XG5cbiAgICBjb25zdCBjYW5SZXNldCA9IChjdXJyZW50VGltZSAtIGZpcnN0RmFpbGVkQXR0ZW1wdCkgPiAoMTAwMCAqIHRoaXMuc2V0dGluZ3MuZmFpbHVyZVdpbmRvdyk7XG4gICAgaWYgKGNhblJlc2V0KSB7XG4gICAgICBmYWlsZWRBdHRlbXB0cyA9IDE7XG4gICAgICB0aGlzLnJlc2V0QXR0ZW1wdHMoZmFpbGVkQXR0ZW1wdHMsIGNsaWVudEFkZHJlc3MpO1xuICAgIH1cblxuICAgIGNvbnN0IGNhbkluY3JlbWVudCA9IGZhaWxlZEF0dGVtcHRzIDwgdGhpcy5zZXR0aW5ncy5mYWlsdXJlc0JlZm9yZUxvY2tvdXQ7XG4gICAgaWYgKGNhbkluY3JlbWVudCkge1xuICAgICAgdGhpcy5pbmNyZW1lbnRBdHRlbXB0cyhmYWlsZWRBdHRlbXB0cywgY2xpZW50QWRkcmVzcyk7XG4gICAgfVxuXG4gICAgY29uc3QgbWF4QXR0ZW1wdHNBbGxvd2VkID0gdGhpcy5zZXR0aW5ncy5mYWlsdXJlc0JlZm9yZUxvY2tvdXQ7XG4gICAgY29uc3QgYXR0ZW1wdHNSZW1haW5pbmcgPSBtYXhBdHRlbXB0c0FsbG93ZWQgLSBmYWlsZWRBdHRlbXB0cztcbiAgICBpZiAodW5sb2NrVGltZSA+IGN1cnJlbnRUaW1lKSB7XG4gICAgICBsZXQgZHVyYXRpb24gPSB1bmxvY2tUaW1lIC0gY3VycmVudFRpbWU7XG4gICAgICBkdXJhdGlvbiA9IE1hdGguY2VpbChkdXJhdGlvbiAvIDEwMDApO1xuICAgICAgZHVyYXRpb24gPSBkdXJhdGlvbiA+IDEgPyBkdXJhdGlvbiA6IDE7XG4gICAgICBVbmtub3duVXNlci50b29NYW55QXR0ZW1wdHMoZHVyYXRpb24pO1xuICAgIH1cbiAgICBpZiAoZmFpbGVkQXR0ZW1wdHMgPT09IG1heEF0dGVtcHRzQWxsb3dlZCkge1xuICAgICAgdGhpcy5zZXROZXdVbmxvY2tUaW1lKGZhaWxlZEF0dGVtcHRzLCBjbGllbnRBZGRyZXNzKTtcblxuICAgICAgbGV0IGR1cmF0aW9uID0gdGhpcy5zZXR0aW5ncy5sb2Nrb3V0UGVyaW9kO1xuICAgICAgZHVyYXRpb24gPSBNYXRoLmNlaWwoZHVyYXRpb24pO1xuICAgICAgZHVyYXRpb24gPSBkdXJhdGlvbiA+IDEgPyBkdXJhdGlvbiA6IDE7XG4gICAgICByZXR1cm4gVW5rbm93blVzZXIudG9vTWFueUF0dGVtcHRzKGR1cmF0aW9uKTtcbiAgICB9XG4gICAgcmV0dXJuIFVua25vd25Vc2VyLnVzZXJOb3RGb3VuZChcbiAgICAgIGZhaWxlZEF0dGVtcHRzLFxuICAgICAgbWF4QXR0ZW1wdHNBbGxvd2VkLFxuICAgICAgYXR0ZW1wdHNSZW1haW5pbmcsXG4gICAgKTtcbiAgfVxuXG4gIHJlc2V0QXR0ZW1wdHMoXG4gICAgZmFpbGVkQXR0ZW1wdHMsXG4gICAgY2xpZW50QWRkcmVzcyxcbiAgKSB7XG4gICAgY29uc3QgY3VycmVudFRpbWUgPSBOdW1iZXIobmV3IERhdGUoKSk7XG4gICAgY29uc3QgcXVlcnkgPSB7IGNsaWVudEFkZHJlc3MgfTtcbiAgICBjb25zdCBkYXRhID0ge1xuICAgICAgJHNldDoge1xuICAgICAgICAnc2VydmljZXMuYWNjb3VudHMtbG9ja291dC5mYWlsZWRBdHRlbXB0cyc6IGZhaWxlZEF0dGVtcHRzLFxuICAgICAgICAnc2VydmljZXMuYWNjb3VudHMtbG9ja291dC5sYXN0RmFpbGVkQXR0ZW1wdCc6IGN1cnJlbnRUaW1lLFxuICAgICAgICAnc2VydmljZXMuYWNjb3VudHMtbG9ja291dC5maXJzdEZhaWxlZEF0dGVtcHQnOiBjdXJyZW50VGltZSxcbiAgICAgIH0sXG4gICAgfTtcbiAgICB0aGlzLkFjY291bnRzTG9ja291dENvbGxlY3Rpb24udXBzZXJ0KHF1ZXJ5LCBkYXRhKTtcbiAgfVxuXG4gIGluY3JlbWVudEF0dGVtcHRzKFxuICAgIGZhaWxlZEF0dGVtcHRzLFxuICAgIGNsaWVudEFkZHJlc3MsXG4gICkge1xuICAgIGNvbnN0IGN1cnJlbnRUaW1lID0gTnVtYmVyKG5ldyBEYXRlKCkpO1xuICAgIGNvbnN0IHF1ZXJ5ID0geyBjbGllbnRBZGRyZXNzIH07XG4gICAgY29uc3QgZGF0YSA9IHtcbiAgICAgICRzZXQ6IHtcbiAgICAgICAgJ3NlcnZpY2VzLmFjY291bnRzLWxvY2tvdXQuZmFpbGVkQXR0ZW1wdHMnOiBmYWlsZWRBdHRlbXB0cyxcbiAgICAgICAgJ3NlcnZpY2VzLmFjY291bnRzLWxvY2tvdXQubGFzdEZhaWxlZEF0dGVtcHQnOiBjdXJyZW50VGltZSxcbiAgICAgIH0sXG4gICAgfTtcbiAgICB0aGlzLkFjY291bnRzTG9ja291dENvbGxlY3Rpb24udXBzZXJ0KHF1ZXJ5LCBkYXRhKTtcbiAgfVxuXG4gIHNldE5ld1VubG9ja1RpbWUoXG4gICAgZmFpbGVkQXR0ZW1wdHMsXG4gICAgY2xpZW50QWRkcmVzcyxcbiAgKSB7XG4gICAgY29uc3QgY3VycmVudFRpbWUgPSBOdW1iZXIobmV3IERhdGUoKSk7XG4gICAgY29uc3QgbmV3VW5sb2NrVGltZSA9ICgxMDAwICogdGhpcy5zZXR0aW5ncy5sb2Nrb3V0UGVyaW9kKSArIGN1cnJlbnRUaW1lO1xuICAgIGNvbnN0IHF1ZXJ5ID0geyBjbGllbnRBZGRyZXNzIH07XG4gICAgY29uc3QgZGF0YSA9IHtcbiAgICAgICRzZXQ6IHtcbiAgICAgICAgJ3NlcnZpY2VzLmFjY291bnRzLWxvY2tvdXQuZmFpbGVkQXR0ZW1wdHMnOiBmYWlsZWRBdHRlbXB0cyxcbiAgICAgICAgJ3NlcnZpY2VzLmFjY291bnRzLWxvY2tvdXQubGFzdEZhaWxlZEF0dGVtcHQnOiBjdXJyZW50VGltZSxcbiAgICAgICAgJ3NlcnZpY2VzLmFjY291bnRzLWxvY2tvdXQudW5sb2NrVGltZSc6IG5ld1VubG9ja1RpbWUsXG4gICAgICB9LFxuICAgIH07XG4gICAgdGhpcy5BY2NvdW50c0xvY2tvdXRDb2xsZWN0aW9uLnVwc2VydChxdWVyeSwgZGF0YSk7XG4gICAgTWV0ZW9yLnNldFRpbWVvdXQoXG4gICAgICB0aGlzLnVubG9ja0FjY291bnQuYmluZCh0aGlzLCBjbGllbnRBZGRyZXNzKSxcbiAgICAgIHRoaXMuc2V0dGluZ3MubG9ja291dFBlcmlvZCAqIDEwMDAsXG4gICAgKTtcbiAgfVxuXG4gIG9uTG9naW4obG9naW5JbmZvKSB7XG4gICAgaWYgKGxvZ2luSW5mby50eXBlICE9PSAncGFzc3dvcmQnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGNsaWVudEFkZHJlc3MgPSBsb2dpbkluZm8uY29ubmVjdGlvbi5jbGllbnRBZGRyZXNzO1xuICAgIGNvbnN0IHF1ZXJ5ID0geyBjbGllbnRBZGRyZXNzIH07XG4gICAgY29uc3QgZGF0YSA9IHtcbiAgICAgICR1bnNldDoge1xuICAgICAgICAnc2VydmljZXMuYWNjb3VudHMtbG9ja291dC51bmxvY2tUaW1lJzogMCxcbiAgICAgICAgJ3NlcnZpY2VzLmFjY291bnRzLWxvY2tvdXQuZmFpbGVkQXR0ZW1wdHMnOiAwLFxuICAgICAgfSxcbiAgICB9O1xuICAgIHRoaXMuQWNjb3VudHNMb2Nrb3V0Q29sbGVjdGlvbi51cGRhdGUocXVlcnksIGRhdGEpO1xuICB9XG5cbiAgc3RhdGljIHVzZXJOb3RGb3VuZChcbiAgICBmYWlsZWRBdHRlbXB0cyxcbiAgICBtYXhBdHRlbXB0c0FsbG93ZWQsXG4gICAgYXR0ZW1wdHNSZW1haW5pbmcsXG4gICkge1xuICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXG4gICAgICA0MDMsXG4gICAgICAnVXNlciBub3QgZm91bmQnLFxuICAgICAgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBtZXNzYWdlOiAnVXNlciBub3QgZm91bmQnLFxuICAgICAgICBmYWlsZWRBdHRlbXB0cyxcbiAgICAgICAgbWF4QXR0ZW1wdHNBbGxvd2VkLFxuICAgICAgICBhdHRlbXB0c1JlbWFpbmluZyxcbiAgICAgIH0pLFxuICAgICk7XG4gIH1cblxuICBzdGF0aWMgdG9vTWFueUF0dGVtcHRzKGR1cmF0aW9uKSB7XG4gICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihcbiAgICAgIDQwMyxcbiAgICAgICdUb28gbWFueSBhdHRlbXB0cycsXG4gICAgICBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIG1lc3NhZ2U6ICdXcm9uZyBlbWFpbHMgd2VyZSBzdWJtaXR0ZWQgdG9vIG1hbnkgdGltZXMuIEFjY291bnQgaXMgbG9ja2VkIGZvciBhIHdoaWxlLicsXG4gICAgICAgIGR1cmF0aW9uLFxuICAgICAgfSksXG4gICAgKTtcbiAgfVxuXG4gIHN0YXRpYyB1bmtub3duVXNlcnMoKSB7XG4gICAgbGV0IHVua25vd25Vc2VycztcbiAgICB0cnkge1xuICAgICAgdW5rbm93blVzZXJzID0gTWV0ZW9yLnNldHRpbmdzWydhY2NvdW50cy1sb2Nrb3V0J10udW5rbm93blVzZXJzO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHVua25vd25Vc2VycyA9IGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdW5rbm93blVzZXJzIHx8IGZhbHNlO1xuICB9XG5cbiAgZmluZE9uZUJ5Q29ubmVjdGlvbihjb25uZWN0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMuQWNjb3VudHNMb2Nrb3V0Q29sbGVjdGlvbi5maW5kT25lKHtcbiAgICAgIGNsaWVudEFkZHJlc3M6IGNvbm5lY3Rpb24uY2xpZW50QWRkcmVzcyxcbiAgICB9KTtcbiAgfVxuXG4gIHVubG9ja1RpbWUoY29ubmVjdGlvbikge1xuICAgIGNvbm5lY3Rpb24gPSB0aGlzLmZpbmRPbmVCeUNvbm5lY3Rpb24oY29ubmVjdGlvbik7XG4gICAgbGV0IHVubG9ja1RpbWU7XG4gICAgdHJ5IHtcbiAgICAgIHVubG9ja1RpbWUgPSBjb25uZWN0aW9uLnNlcnZpY2VzWydhY2NvdW50cy1sb2Nrb3V0J10udW5sb2NrVGltZTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB1bmxvY2tUaW1lID0gMDtcbiAgICB9XG4gICAgcmV0dXJuIHVubG9ja1RpbWUgfHwgMDtcbiAgfVxuXG4gIGZhaWxlZEF0dGVtcHRzKGNvbm5lY3Rpb24pIHtcbiAgICBjb25uZWN0aW9uID0gdGhpcy5maW5kT25lQnlDb25uZWN0aW9uKGNvbm5lY3Rpb24pO1xuICAgIGxldCBmYWlsZWRBdHRlbXB0cztcbiAgICB0cnkge1xuICAgICAgZmFpbGVkQXR0ZW1wdHMgPSBjb25uZWN0aW9uLnNlcnZpY2VzWydhY2NvdW50cy1sb2Nrb3V0J10uZmFpbGVkQXR0ZW1wdHM7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgZmFpbGVkQXR0ZW1wdHMgPSAwO1xuICAgIH1cbiAgICByZXR1cm4gZmFpbGVkQXR0ZW1wdHMgfHwgMDtcbiAgfVxuXG4gIGxhc3RGYWlsZWRBdHRlbXB0KGNvbm5lY3Rpb24pIHtcbiAgICBjb25uZWN0aW9uID0gdGhpcy5maW5kT25lQnlDb25uZWN0aW9uKGNvbm5lY3Rpb24pO1xuICAgIGxldCBsYXN0RmFpbGVkQXR0ZW1wdDtcbiAgICB0cnkge1xuICAgICAgbGFzdEZhaWxlZEF0dGVtcHQgPSBjb25uZWN0aW9uLnNlcnZpY2VzWydhY2NvdW50cy1sb2Nrb3V0J10ubGFzdEZhaWxlZEF0dGVtcHQ7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgbGFzdEZhaWxlZEF0dGVtcHQgPSAwO1xuICAgIH1cbiAgICByZXR1cm4gbGFzdEZhaWxlZEF0dGVtcHQgfHwgMDtcbiAgfVxuXG4gIGZpcnN0RmFpbGVkQXR0ZW1wdChjb25uZWN0aW9uKSB7XG4gICAgY29ubmVjdGlvbiA9IHRoaXMuZmluZE9uZUJ5Q29ubmVjdGlvbihjb25uZWN0aW9uKTtcbiAgICBsZXQgZmlyc3RGYWlsZWRBdHRlbXB0O1xuICAgIHRyeSB7XG4gICAgICBmaXJzdEZhaWxlZEF0dGVtcHQgPSBjb25uZWN0aW9uLnNlcnZpY2VzWydhY2NvdW50cy1sb2Nrb3V0J10uZmlyc3RGYWlsZWRBdHRlbXB0O1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGZpcnN0RmFpbGVkQXR0ZW1wdCA9IDA7XG4gICAgfVxuICAgIHJldHVybiBmaXJzdEZhaWxlZEF0dGVtcHQgfHwgMDtcbiAgfVxuXG4gIHVubG9ja0FjY291bnQoY2xpZW50QWRkcmVzcykge1xuICAgIGNvbnN0IHF1ZXJ5ID0geyBjbGllbnRBZGRyZXNzIH07XG4gICAgY29uc3QgZGF0YSA9IHtcbiAgICAgICR1bnNldDoge1xuICAgICAgICAnc2VydmljZXMuYWNjb3VudHMtbG9ja291dC51bmxvY2tUaW1lJzogMCxcbiAgICAgICAgJ3NlcnZpY2VzLmFjY291bnRzLWxvY2tvdXQuZmFpbGVkQXR0ZW1wdHMnOiAwLFxuICAgICAgfSxcbiAgICB9O1xuICAgIHRoaXMuQWNjb3VudHNMb2Nrb3V0Q29sbGVjdGlvbi51cGRhdGUocXVlcnksIGRhdGEpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFVua25vd25Vc2VyO1xuIl19
