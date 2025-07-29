(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Accounts = Package['accounts-base'].Accounts;
var check = Package.check.check;
var Match = Package.check.Match;
var _ = Package.underscore._;
var ReactiveVar = Package['reactive-var'].ReactiveVar;
var ECMAScript = Package.ecmascript.ECMAScript;
var HTTP = Package.http.HTTP;
var HTTPInternals = Package.http.HTTPInternals;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var Field, STATE_PAT, ERRORS_PAT, INFO_PAT, INPUT_ICONS_PAT, ObjWithStringValues, TEXTS_PAT, CONFIG_PAT, FIELD_SUB_PAT, FIELD_PAT, AT, AccountsTemplates, T9n;

var require = meteorInstall({"node_modules":{"meteor":{"useraccounts:core":{"lib":{"field.js":function module(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/useraccounts_core/lib/field.js                                                                       //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
// ---------------------------------------------------------------------------------
// Field object
// ---------------------------------------------------------------------------------

Field = function (field) {
  check(field, FIELD_PAT);
  _.defaults(this, field);
  this.validating = new ReactiveVar(false);
  this.status = new ReactiveVar(null);
};
if (Meteor.isClient) {
  Field.prototype.clearStatus = function () {
    return this.status.set(null);
  };
}
if (Meteor.isServer) {
  Field.prototype.clearStatus = function () {
    // Nothing to do server-side
    return;
  };
}
Field.prototype.fixValue = function (value) {
  if (this.type === "checkbox") {
    return !!value;
  }
  if (this.type === "select") {
    // TODO: something working...
    return value;
  }
  if (this.type === "radio") {
    // TODO: something working...
    return value;
  }

  // Possibly applies required transformations to the input value
  if (this.trim) {
    value = value.trim();
  }
  if (this.lowercase) {
    value = value.toLowerCase();
  }
  if (this.uppercase) {
    value = value.toUpperCase();
  }
  if (!!this.transform) {
    value = this.transform(value);
  }
  return value;
};
if (Meteor.isClient) {
  Field.prototype.getDisplayName = function (state) {
    var displayName = this.displayName;
    if (_.isFunction(displayName)) {
      displayName = displayName();
    } else if (_.isObject(displayName)) {
      displayName = displayName[state] || displayName["default"];
    }
    if (!displayName) {
      displayName = capitalize(this._id);
    }
    return displayName;
  };
}
if (Meteor.isClient) {
  Field.prototype.getPlaceholder = function (state) {
    var placeholder = this.placeholder;
    if (_.isObject(placeholder)) {
      placeholder = placeholder[state] || placeholder["default"];
    }
    if (!placeholder) {
      placeholder = capitalize(this._id);
    }
    return placeholder;
  };
}
Field.prototype.getStatus = function () {
  return this.status.get();
};
if (Meteor.isClient) {
  Field.prototype.getValue = function (templateInstance) {
    if (this.type === "checkbox") {
      return !!templateInstance.$("#at-field-" + this._id + ":checked").val();
    }
    if (this.type === "radio") {
      return templateInstance.$("[name=at-field-" + this._id + "]:checked").val();
    }
    return templateInstance.$("#at-field-" + this._id).val();
  };
}
if (Meteor.isClient) {
  Field.prototype.hasError = function () {
    return this.negativeValidation && this.status.get();
  };
}
if (Meteor.isClient) {
  Field.prototype.hasIcon = function () {
    if (this.showValidating && this.isValidating()) {
      return true;
    }
    if (this.negativeFeedback && this.hasError()) {
      return true;
    }
    if (this.positiveFeedback && this.hasSuccess()) {
      return true;
    }
  };
}
if (Meteor.isClient) {
  Field.prototype.hasSuccess = function () {
    return this.positiveValidation && this.status.get() === false;
  };
}
if (Meteor.isClient) Field.prototype.iconClass = function () {
  if (this.isValidating()) {
    return AccountsTemplates.texts.inputIcons["isValidating"];
  }
  if (this.hasError()) {
    return AccountsTemplates.texts.inputIcons["hasError"];
  }
  if (this.hasSuccess()) {
    return AccountsTemplates.texts.inputIcons["hasSuccess"];
  }
};
if (Meteor.isClient) {
  Field.prototype.isValidating = function () {
    return this.validating.get();
  };
}
if (Meteor.isClient) {
  Field.prototype.setError = function (err) {
    check(err, Match.OneOf(String, undefined, Boolean));
    if (err === false) {
      return this.status.set(false);
    }
    return this.status.set(err || true);
  };
}
if (Meteor.isServer) {
  Field.prototype.setError = function (err) {
    // Nothing to do server-side
    return;
  };
}
if (Meteor.isClient) {
  Field.prototype.setSuccess = function () {
    return this.status.set(false);
  };
}
if (Meteor.isServer) {
  Field.prototype.setSuccess = function () {
    // Nothing to do server-side
    return;
  };
}
if (Meteor.isClient) {
  Field.prototype.setValidating = function (state) {
    check(state, Boolean);
    return this.validating.set(state);
  };
}
if (Meteor.isServer) {
  Field.prototype.setValidating = function (state) {
    // Nothing to do server-side
    return;
  };
}
if (Meteor.isClient) {
  Field.prototype.setValue = function (templateInstance, value) {
    if (this.type === "checkbox") {
      templateInstance.$("#at-field-" + this._id).prop('checked', true);
      return;
    }
    if (this.type === "radio") {
      templateInstance.$("[name=at-field-" + this._id + "]").prop('checked', true);
      return;
    }
    templateInstance.$("#at-field-" + this._id).val(value);
  };
}
Field.prototype.validate = function (value, strict) {
  check(value, Match.OneOf(undefined, String, Boolean));
  this.setValidating(true);
  this.clearStatus();
  if (_.isUndefined(value) || value === '') {
    if (!!strict) {
      if (this.required) {
        this.setError(AccountsTemplates.texts.requiredField);
        this.setValidating(false);
        return AccountsTemplates.texts.requiredField;
      } else {
        this.setSuccess();
        this.setValidating(false);
        return false;
      }
    } else {
      this.clearStatus();
      this.setValidating(false);
      return null;
    }
  }
  var valueLength = value.length;
  var minLength = this.minLength;
  if (minLength && valueLength < minLength) {
    this.setError(AccountsTemplates.texts.minRequiredLength + ": " + minLength);
    this.setValidating(false);
    return AccountsTemplates.texts.minRequiredLength + ": " + minLength;
  }
  var maxLength = this.maxLength;
  if (maxLength && valueLength > maxLength) {
    this.setError(AccountsTemplates.texts.maxAllowedLength + ": " + maxLength);
    this.setValidating(false);
    return AccountsTemplates.texts.maxAllowedLength + ": " + maxLength;
  }
  if (this.re && valueLength && !value.match(this.re)) {
    this.setError(this.errStr);
    this.setValidating(false);
    return this.errStr;
  }
  if (this.func) {
    var result = this.func(value);
    var err = result === true ? this.errStr || true : result;
    if (_.isUndefined(result)) {
      return err;
    }
    this.status.set(err);
    this.setValidating(false);
    return err;
  }
  this.setSuccess();
  this.setValidating(false);
  return false;
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"core.js":function module(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/useraccounts_core/lib/core.js                                                                        //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
// ---------------------------------------------------------------------------------
// Patterns for methods" parameters
// ---------------------------------------------------------------------------------

STATE_PAT = {
  changePwd: Match.Optional(String),
  enrollAccount: Match.Optional(String),
  forgotPwd: Match.Optional(String),
  resetPwd: Match.Optional(String),
  signIn: Match.Optional(String),
  signUp: Match.Optional(String),
  verifyEmail: Match.Optional(String),
  resendVerificationEmail: Match.Optional(String)
};
ERRORS_PAT = {
  accountsCreationDisabled: Match.Optional(String),
  cannotRemoveService: Match.Optional(String),
  captchaVerification: Match.Optional(String),
  loginForbidden: Match.Optional(String),
  mustBeLoggedIn: Match.Optional(String),
  pwdMismatch: Match.Optional(String),
  validationErrors: Match.Optional(String),
  verifyEmailFirst: Match.Optional(String)
};
INFO_PAT = {
  emailSent: Match.Optional(String),
  emailVerified: Match.Optional(String),
  pwdChanged: Match.Optional(String),
  pwdReset: Match.Optional(String),
  pwdSet: Match.Optional(String),
  signUpVerifyEmail: Match.Optional(String),
  verificationEmailSent: Match.Optional(String)
};
INPUT_ICONS_PAT = {
  hasError: Match.Optional(String),
  hasSuccess: Match.Optional(String),
  isValidating: Match.Optional(String)
};
ObjWithStringValues = Match.Where(function (x) {
  check(x, Object);
  _.each(_.values(x), function (value) {
    check(value, String);
  });
  return true;
});
TEXTS_PAT = {
  button: Match.Optional(STATE_PAT),
  errors: Match.Optional(ERRORS_PAT),
  info: Match.Optional(INFO_PAT),
  inputIcons: Match.Optional(INPUT_ICONS_PAT),
  maxAllowedLength: Match.Optional(String),
  minRequiredLength: Match.Optional(String),
  navSignIn: Match.Optional(String),
  navSignOut: Match.Optional(String),
  optionalField: Match.Optional(String),
  pwdLink_link: Match.Optional(String),
  pwdLink_pre: Match.Optional(String),
  pwdLink_suff: Match.Optional(String),
  requiredField: Match.Optional(String),
  resendVerificationEmailLink_pre: Match.Optional(String),
  resendVerificationEmailLink_link: Match.Optional(String),
  resendVerificationEmailLink_suff: Match.Optional(String),
  sep: Match.Optional(String),
  signInLink_link: Match.Optional(String),
  signInLink_pre: Match.Optional(String),
  signInLink_suff: Match.Optional(String),
  signUpLink_link: Match.Optional(String),
  signUpLink_pre: Match.Optional(String),
  signUpLink_suff: Match.Optional(String),
  socialAdd: Match.Optional(String),
  socialConfigure: Match.Optional(String),
  socialIcons: Match.Optional(ObjWithStringValues),
  socialRemove: Match.Optional(String),
  socialSignIn: Match.Optional(String),
  socialSignUp: Match.Optional(String),
  socialWith: Match.Optional(String),
  termsAnd: Match.Optional(String),
  termsPreamble: Match.Optional(String),
  termsPrivacy: Match.Optional(String),
  termsTerms: Match.Optional(String),
  title: Match.Optional(STATE_PAT)
};

// Configuration pattern to be checked with check
CONFIG_PAT = {
  // Behaviour
  confirmPassword: Match.Optional(Boolean),
  defaultState: Match.Optional(String),
  enablePasswordChange: Match.Optional(Boolean),
  enforceEmailVerification: Match.Optional(Boolean),
  focusFirstInput: Match.Optional(Boolean),
  forbidClientAccountCreation: Match.Optional(Boolean),
  lowercaseUsername: Match.Optional(Boolean),
  overrideLoginErrors: Match.Optional(Boolean),
  sendVerificationEmail: Match.Optional(Boolean),
  socialLoginStyle: Match.Optional(Match.OneOf("popup", "redirect")),
  // Appearance
  defaultLayout: Match.Optional(String),
  hideSignInLink: Match.Optional(Boolean),
  hideSignUpLink: Match.Optional(Boolean),
  showAddRemoveServices: Match.Optional(Boolean),
  showForgotPasswordLink: Match.Optional(Boolean),
  showResendVerificationEmailLink: Match.Optional(Boolean),
  showLabels: Match.Optional(Boolean),
  showPlaceholders: Match.Optional(Boolean),
  // Client-side Validation
  continuousValidation: Match.Optional(Boolean),
  negativeFeedback: Match.Optional(Boolean),
  negativeValidation: Match.Optional(Boolean),
  positiveFeedback: Match.Optional(Boolean),
  positiveValidation: Match.Optional(Boolean),
  showValidating: Match.Optional(Boolean),
  // Privacy Policy and Terms of Use
  privacyUrl: Match.Optional(String),
  termsUrl: Match.Optional(String),
  // Redirects
  homeRoutePath: Match.Optional(String),
  redirectTimeout: Match.Optional(Number),
  // Hooks
  onLogoutHook: Match.Optional(Function),
  onSubmitHook: Match.Optional(Function),
  preSignUpHook: Match.Optional(Function),
  postSignUpHook: Match.Optional(Function),
  texts: Match.Optional(TEXTS_PAT),
  //reCaptcha config
  reCaptcha: Match.Optional({
    data_type: Match.Optional(Match.OneOf("audio", "image")),
    secretKey: Match.Optional(String),
    siteKey: Match.Optional(String),
    theme: Match.Optional(Match.OneOf("dark", "light"))
  }),
  showReCaptcha: Match.Optional(Boolean)
};
FIELD_SUB_PAT = {
  "default": Match.Optional(String),
  changePwd: Match.Optional(String),
  enrollAccount: Match.Optional(String),
  forgotPwd: Match.Optional(String),
  resetPwd: Match.Optional(String),
  signIn: Match.Optional(String),
  signUp: Match.Optional(String)
};

// Field pattern
FIELD_PAT = {
  _id: String,
  type: String,
  required: Match.Optional(Boolean),
  displayName: Match.Optional(Match.OneOf(String, Match.Where(_.isFunction), FIELD_SUB_PAT)),
  placeholder: Match.Optional(Match.OneOf(String, FIELD_SUB_PAT)),
  select: Match.Optional([{
    text: String,
    value: Match.Any
  }]),
  minLength: Match.Optional(Match.Integer),
  maxLength: Match.Optional(Match.Integer),
  re: Match.Optional(RegExp),
  func: Match.Optional(Match.Where(_.isFunction)),
  errStr: Match.Optional(String),
  // Client-side Validation
  continuousValidation: Match.Optional(Boolean),
  negativeFeedback: Match.Optional(Boolean),
  negativeValidation: Match.Optional(Boolean),
  positiveValidation: Match.Optional(Boolean),
  positiveFeedback: Match.Optional(Boolean),
  // Transforms
  trim: Match.Optional(Boolean),
  lowercase: Match.Optional(Boolean),
  uppercase: Match.Optional(Boolean),
  transform: Match.Optional(Match.Where(_.isFunction)),
  // Custom options
  options: Match.Optional(Object),
  template: Match.Optional(String)
};

// -----------------------------------------------------------------------------
// AccountsTemplates object
// -----------------------------------------------------------------------------

// -------------------
// Client/Server stuff
// -------------------

// Constructor
AT = function () {};
AT.prototype.CONFIG_PAT = CONFIG_PAT;

/*
  Each field object is represented by the following properties:
    _id:         String   (required)  // A unique field"s id / name
    type:        String   (required)  // Displayed input type
    required:    Boolean  (optional)  // Specifies Whether to fail or not when field is left empty
    displayName: String   (optional)  // The field"s name to be displayed as a label above the input element
    placeholder: String   (optional)  // The placeholder text to be displayed inside the input element
    minLength:   Integer  (optional)  // Possibly specifies the minimum allowed length
    maxLength:   Integer  (optional)  // Possibly specifies the maximum allowed length
    re:          RegExp   (optional)  // Regular expression for validation
    func:        Function (optional)  // Custom function for validation
    errStr:      String   (optional)  // Error message to be displayed in case re validation fails
*/

// Allowed input types
AT.prototype.INPUT_TYPES = ["checkbox", "email", "hidden", "password", "radio", "select", "tel", "text", "url"];

// Current configuration values
AT.prototype.options = {
  // Appearance
  //defaultLayout: undefined,
  showAddRemoveServices: false,
  showForgotPasswordLink: false,
  showResendVerificationEmailLink: false,
  showLabels: true,
  showPlaceholders: true,
  // Behaviour
  confirmPassword: true,
  defaultState: "signIn",
  enablePasswordChange: false,
  focusFirstInput: !Meteor.isCordova,
  forbidClientAccountCreation: false,
  lowercaseUsername: false,
  overrideLoginErrors: true,
  sendVerificationEmail: false,
  socialLoginStyle: "popup",
  // Client-side Validation
  //continuousValidation: false,
  //negativeFeedback: false,
  //negativeValidation: false,
  //positiveValidation: false,
  //positiveFeedback: false,
  //showValidating: false,

  // Privacy Policy and Terms of Use
  privacyUrl: undefined,
  termsUrl: undefined,
  // Hooks
  onSubmitHook: undefined
};
AT.prototype.texts = {
  button: {
    changePwd: "updateYourPassword",
    //enrollAccount: "createAccount",
    enrollAccount: "signUp",
    forgotPwd: "emailResetLink",
    resetPwd: "setPassword",
    signIn: "signIn",
    signUp: "signUp",
    resendVerificationEmail: "Send email again"
  },
  errors: {
    accountsCreationDisabled: "Client side accounts creation is disabled!!!",
    cannotRemoveService: "Cannot remove the only active service!",
    captchaVerification: "Captcha verification failed!",
    loginForbidden: "error.accounts.Login forbidden",
    mustBeLoggedIn: "error.accounts.Must be logged in",
    pwdMismatch: "error.pwdsDontMatch",
    validationErrors: "Validation Errors",
    verifyEmailFirst: "Please verify your email first. Check the email and follow the link!"
  },
  navSignIn: 'signIn',
  navSignOut: 'signOut',
  info: {
    emailSent: "info.emailSent",
    emailVerified: "info.emailVerified",
    pwdChanged: "info.passwordChanged",
    pwdReset: "info.passwordReset",
    pwdSet: "Password Set",
    signUpVerifyEmail: "Successful Registration! Please check your email and follow the instructions.",
    verificationEmailSent: "A new email has been sent to you. If the email doesn't show up in your inbox, be sure to check your spam folder."
  },
  inputIcons: {
    isValidating: "fa fa-spinner fa-spin",
    hasSuccess: "fa fa-check",
    hasError: "fa fa-times"
  },
  maxAllowedLength: "Maximum allowed length",
  minRequiredLength: "Minimum required length",
  optionalField: "optional",
  pwdLink_pre: "",
  pwdLink_link: "forgotPassword",
  pwdLink_suff: "",
  requiredField: "Required Field",
  resendVerificationEmailLink_pre: "Verification email lost?",
  resendVerificationEmailLink_link: "Send again",
  resendVerificationEmailLink_suff: "",
  sep: "OR",
  signInLink_pre: "ifYouAlreadyHaveAnAccount",
  signInLink_link: "signin",
  signInLink_suff: "",
  signUpLink_pre: "dontHaveAnAccount",
  signUpLink_link: "signUp",
  signUpLink_suff: "",
  socialAdd: "add",
  socialConfigure: "configure",
  socialIcons: {
    "meteor-developer": "fa fa-rocket"
  },
  socialRemove: "remove",
  socialSignIn: "signIn",
  socialSignUp: "signUp",
  socialWith: "with",
  termsPreamble: "clickAgree",
  termsPrivacy: "privacyPolicy",
  termsAnd: "and",
  termsTerms: "terms",
  title: {
    changePwd: "changePassword",
    enrollAccount: "createAccount",
    forgotPwd: "resetYourPassword",
    resetPwd: "resetYourPassword",
    signIn: "signIn",
    signUp: "createAccount",
    verifyEmail: "",
    resendVerificationEmail: "Send the verification email again"
  }
};
AT.prototype.SPECIAL_FIELDS = ["password_again", "username_and_email"];

// SignIn / SignUp fields
AT.prototype._fields = [new Field({
  _id: "email",
  type: "email",
  required: true,
  lowercase: true,
  trim: true,
  func: function (email) {
    return !_.contains(email, '@');
  },
  errStr: 'Invalid email'
}), new Field({
  _id: "password",
  type: "password",
  required: true,
  minLength: 6,
  displayName: {
    "default": "password",
    changePwd: "newPassword",
    resetPwd: "newPassword"
  },
  placeholder: {
    "default": "password",
    changePwd: "newPassword",
    resetPwd: "newPassword"
  }
})];
AT.prototype._initialized = false;

// Input type validation
AT.prototype._isValidInputType = function (value) {
  return _.indexOf(this.INPUT_TYPES, value) !== -1;
};
AT.prototype.addField = function (field) {
  // Fields can be added only before initialization
  if (this._initialized) {
    throw new Error("AccountsTemplates.addField should strictly be called before AccountsTemplates.init!");
  }
  field = _.pick(field, _.keys(FIELD_PAT));
  check(field, FIELD_PAT);
  // Checks there"s currently no field called field._id
  if (_.indexOf(_.pluck(this._fields, "_id"), field._id) !== -1) {
    throw new Error("A field called " + field._id + " already exists!");
  }
  // Validates field.type
  if (!this._isValidInputType(field.type)) {
    throw new Error("field.type is not valid!");
  }
  // Checks field.minLength is strictly positive
  if (typeof field.minLength !== "undefined" && field.minLength <= 0) {
    throw new Error("field.minLength should be greater than zero!");
  }
  // Checks field.maxLength is strictly positive
  if (typeof field.maxLength !== "undefined" && field.maxLength <= 0) {
    throw new Error("field.maxLength should be greater than zero!");
  }
  // Checks field.maxLength is greater than field.minLength
  if (typeof field.minLength !== "undefined" && typeof field.minLength !== "undefined" && field.maxLength < field.minLength) {
    throw new Error("field.maxLength should be greater than field.maxLength!");
  }
  if (!(Meteor.isServer && _.contains(this.SPECIAL_FIELDS, field._id))) {
    this._fields.push(new Field(field));
  }
  return this._fields;
};
AT.prototype.addFields = function (fields) {
  var ok;
  try {
    // don"t bother with `typeof` - just access `length` and `catch`
    ok = fields.length > 0 && "0" in Object(fields);
  } catch (e) {
    throw new Error("field argument should be an array of valid field objects!");
  }
  if (ok) {
    _.map(fields, function (field) {
      this.addField(field);
    }, this);
  } else {
    throw new Error("field argument should be an array of valid field objects!");
  }
  return this._fields;
};
AT.prototype.configure = function (config) {
  // Configuration options can be set only before initialization
  if (this._initialized) {
    throw new Error("Configuration options must be set before AccountsTemplates.init!");
  }

  // Updates the current configuration
  check(config, CONFIG_PAT);
  var options = _.omit(config, "texts", "reCaptcha");
  this.options = _.defaults(options, this.options);

  // Possibly sets up reCaptcha options
  var reCaptcha = config.reCaptcha;
  if (reCaptcha) {
    // Updates the current button object
    this.options.reCaptcha = _.defaults(reCaptcha, this.options.reCaptcha || {});
  }

  // Possibly sets up texts...
  if (config.texts) {
    var texts = config.texts;
    var simpleTexts = _.omit(texts, "button", "errors", "info", "inputIcons", "socialIcons", "title");
    this.texts = _.defaults(simpleTexts, this.texts);
    if (texts.button) {
      // Updates the current button object
      this.texts.button = _.defaults(texts.button, this.texts.button);
    }
    if (texts.errors) {
      // Updates the current errors object
      this.texts.errors = _.defaults(texts.errors, this.texts.errors);
    }
    if (texts.info) {
      // Updates the current info object
      this.texts.info = _.defaults(texts.info, this.texts.info);
    }
    if (texts.inputIcons) {
      // Updates the current inputIcons object
      this.texts.inputIcons = _.defaults(texts.inputIcons, this.texts.inputIcons);
    }
    if (texts.socialIcons) {
      // Updates the current socialIcons object
      this.texts.socialIcons = _.defaults(texts.socialIcons, this.texts.socialIcons);
    }
    if (texts.title) {
      // Updates the current title object
      this.texts.title = _.defaults(texts.title, this.texts.title);
    }
  }
};
AT.prototype.configureRoute = function (route, options) {
  console.warn('You now need a routing package like useraccounts:iron-routing or useraccounts:flow-routing to be able to configure routes!');
};
AT.prototype.hasField = function (fieldId) {
  return !!this.getField(fieldId);
};
AT.prototype.getField = function (fieldId) {
  var field = _.filter(this._fields, function (field) {
    return field._id === fieldId;
  });
  return field.length === 1 ? field[0] : undefined;
};
AT.prototype.getFields = function () {
  return this._fields;
};
AT.prototype.getFieldIds = function () {
  return _.pluck(this._fields, "_id");
};
AT.prototype.getRoutePath = function (route) {
  return "#";
};
AT.prototype.oauthServices = function () {
  // Extracts names of available services
  var names;
  if (Meteor.isServer) {
    names = Accounts.oauth && Accounts.oauth.serviceNames() || [];
  } else {
    names = Accounts.oauth && Accounts.loginServicesConfigured() && Accounts.oauth.serviceNames() || [];
  }
  // Extracts names of configured services
  var configuredServices = [];
  if (Accounts.loginServiceConfiguration) {
    configuredServices = _.pluck(Accounts.loginServiceConfiguration.find().fetch(), "service");
  }

  // Builds a list of objects containing service name as _id and its configuration status
  var services = _.map(names, function (name) {
    return {
      _id: name,
      configured: _.contains(configuredServices, name)
    };
  });

  // Checks whether there is a UI to configure services...
  // XXX: this only works with the accounts-ui package
  var showUnconfigured = typeof Accounts._loginButtonsSession !== "undefined";

  // Filters out unconfigured services in case they"re not to be displayed
  if (!showUnconfigured) {
    services = _.filter(services, function (service) {
      return service.configured;
    });
  }

  // Sorts services by name
  services = _.sortBy(services, function (service) {
    return service._id;
  });
  return services;
};
AT.prototype.removeField = function (fieldId) {
  // Fields can be removed only before initialization
  if (this._initialized) {
    throw new Error("AccountsTemplates.removeField should strictly be called before AccountsTemplates.init!");
  }
  // Tries to look up the field with given _id
  var index = _.indexOf(_.pluck(this._fields, "_id"), fieldId);
  if (index !== -1) {
    return this._fields.splice(index, 1)[0];
  } else if (!(Meteor.isServer && _.contains(this.SPECIAL_FIELDS, fieldId))) {
    throw new Error("A field called " + fieldId + " does not exist!");
  }
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"server.js":function module(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/useraccounts_core/lib/server.js                                                                      //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
/* global
  AT: false,
  AccountsTemplates: false
*/
"use strict";

// Initialization
AT.prototype.init = function () {
  console.warn("[AccountsTemplates] There is no more need to call AccountsTemplates.init()! Simply remove the call ;-)");
};
AT.prototype._init = function () {
  if (this._initialized) {
    return;
  }

  // Checks there is at least one account service installed
  if (!Package["accounts-password"] && (!Accounts.oauth || Accounts.oauth.serviceNames().length === 0)) {
    throw Error("AccountsTemplates: You must add at least one account service!");
  }

  // A password field is strictly required
  var password = this.getField("password");
  if (!password) {
    throw Error("A password field is strictly required!");
  }
  if (password.type !== "password") {
    throw Error("The type of password field should be password!");
  }

  // Then we can have "username" or "email" or even both of them
  // but at least one of the two is strictly required
  var username = this.getField("username");
  var email = this.getField("email");
  if (!username && !email) {
    throw Error("At least one field out of username and email is strictly required!");
  }
  if (username && !username.required) {
    throw Error("The username field should be required!");
  }
  if (email) {
    if (email.type !== "email") {
      throw Error("The type of email field should be email!");
    }
    if (username) {
      // username and email
      if (username.type !== "text") {
        throw Error("The type of username field should be text when email field is present!");
      }
    } else {
      // email only
      if (!email.required) {
        throw Error("The email field should be required when username is not present!");
      }
    }
  } else {
    // username only
    if (username.type !== "text" && username.type !== "tel") {
      throw Error("The type of username field should be text or tel!");
    }
  }

  // Possibly publish more user data in order to be able to show add/remove
  // buttons for 3rd-party services
  if (this.options.showAddRemoveServices) {
    // Publish additional current user info to get the list of registered services
    // XXX TODO: use
    // Accounts.addAutopublishFields({
    //   forLoggedInUser: ['services.facebook'],
    //   forOtherUsers: [],
    // })
    // ...adds only user.services.*.id
    Meteor.publish("userRegisteredServices", function () {
      var userId = this.userId;
      return Meteor.users.find(userId, {
        fields: {
          services: 1
        }
      });
      /*
      if (userId) {
        var user = Meteor.users.findOne(userId);
        var services_id = _.chain(user.services)
          .keys()
          .reject(function(service) {return service === "resume";})
          .map(function(service) {return "services." + service + ".id";})
          .value();
        var projection = {};
        _.each(services_id, function(key) {projection[key] = 1;});
        return Meteor.users.find(userId, {fields: projection});
      }
      */
    });
  }

  // Security stuff
  if (this.options.overrideLoginErrors) {
    Accounts.validateLoginAttempt(function (attempt) {
      if (attempt.error) {
        var reason = attempt.error.reason;
        if (reason === "User not found" || reason === "Incorrect password") {
          throw new Meteor.Error(403, AccountsTemplates.texts.errors.loginForbidden);
        }
      }
      return attempt.allowed;
    });
  }
  if (this.options.sendVerificationEmail && this.options.enforceEmailVerification) {
    Accounts.validateLoginAttempt(function (attempt) {
      if (!attempt.allowed) {
        return false;
      }
      if (attempt.type !== "password" || attempt.methodName !== "login") {
        return attempt.allowed;
      }
      var user = attempt.user;
      if (!user) {
        return attempt.allowed;
      }
      var ok = true;
      var loginEmail = attempt.methodArguments[0].user.email;
      if (loginEmail) {
        var email = _.filter(user.emails, function (obj) {
          return obj.address.toLowerCase() === loginEmail.toLowerCase();
        });
        if (!email.length || !email[0].verified) {
          ok = false;
        }
      } else {
        // we got the username, lets check there's at lease one verified email
        var emailVerified = _.chain(user.emails).pluck('verified').any().value();
        if (!emailVerified) {
          ok = false;
        }
      }
      if (!ok) {
        throw new Meteor.Error(401, AccountsTemplates.texts.errors.verifyEmailFirst);
      }
      return attempt.allowed;
    });
  }

  //Check that reCaptcha secret keys are available
  if (this.options.showReCaptcha) {
    var atSecretKey = AccountsTemplates.options.reCaptcha && AccountsTemplates.options.reCaptcha.secretKey;
    var settingsSecretKey = Meteor.settings.reCaptcha && Meteor.settings.reCaptcha.secretKey;
    if (!atSecretKey && !settingsSecretKey) {
      throw new Meteor.Error(401, "User Accounts: reCaptcha secret key not found! Please provide it or set showReCaptcha to false.");
    }
  }

  // Marks AccountsTemplates as initialized
  this._initialized = true;
};
AccountsTemplates = new AT();

// Client side account creation is disabled by default:
// the methos ATCreateUserServer is used instead!
// to actually disable client side account creation use:
//
//    AccountsTemplates.config({
//        forbidClientAccountCreation: true
//    });

Accounts.config({
  forbidClientAccountCreation: true
});

// Initialization
Meteor.startup(function () {
  AccountsTemplates._init();
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods.js":function module(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/useraccounts_core/lib/methods.js                                                                     //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
/* global
  AccountsTemplates: false
*/
"use strict";

Meteor.methods({
  ATRemoveService: function (serviceName) {
    check(serviceName, String);
    var userId = this.userId;
    if (userId) {
      var user = Meteor.users.findOne(userId);
      var numServices = _.keys(user.services).length; // including "resume"
      var unset = {};
      if (numServices === 2) {
        throw new Meteor.Error(403, AccountsTemplates.texts.errors.cannotRemoveService, {});
      }
      unset["services." + serviceName] = "";
      Meteor.users.update(userId, {
        $unset: unset
      });
    }
  }
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"server_methods.js":function module(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/useraccounts_core/lib/server_methods.js                                                              //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
/* global
  AccountsTemplates
*/
"use strict";

Meteor.methods({
  ATCreateUserServer: function (options) {
    if (AccountsTemplates.options.forbidClientAccountCreation) {
      throw new Meteor.Error(403, AccountsTemplates.texts.errors.accountsCreationDisabled);
    }

    // createUser() does more checking.
    check(options, Object);
    var allFieldIds = AccountsTemplates.getFieldIds();

    // Picks-up whitelisted fields for profile
    var profile = options.profile;
    profile = _.pick(profile, allFieldIds);
    profile = _.omit(profile, "username", "email", "password");

    // Validates fields" value
    var signupInfo = _.clone(profile);
    if (options.username) {
      signupInfo.username = options.username;
      if (AccountsTemplates.options.lowercaseUsername) {
        signupInfo.username = signupInfo.username.trim().replace(/\s+/gm, ' ');
        options.profile.name = signupInfo.username;
        signupInfo.username = signupInfo.username.toLowerCase().replace(/\s+/gm, '');
        options.username = signupInfo.username;
      }
    }
    if (options.email) {
      signupInfo.email = options.email;
      if (AccountsTemplates.options.lowercaseUsername) {
        signupInfo.email = signupInfo.email.toLowerCase().replace(/\s+/gm, '');
        options.email = signupInfo.email;
      }
    }
    if (options.password) {
      signupInfo.password = options.password;
    }
    var validationErrors = {};
    var someError = false;

    // Validates fields values
    _.each(AccountsTemplates.getFields(), function (field) {
      var fieldId = field._id;
      var value = signupInfo[fieldId];
      if (fieldId === "password") {
        // Can"t Pick-up password here
        // NOTE: at this stage the password is already encripted,
        //       so there is no way to validate it!!!
        check(value, Object);
        return;
      }
      var validationErr = field.validate(value, "strict");
      if (validationErr) {
        validationErrors[fieldId] = validationErr;
        someError = true;
      }
    });
    if (AccountsTemplates.options.showReCaptcha) {
      var secretKey = null;
      if (AccountsTemplates.options.reCaptcha && AccountsTemplates.options.reCaptcha.secretKey) {
        secretKey = AccountsTemplates.options.reCaptcha.secretKey;
      } else {
        secretKey = Meteor.settings.reCaptcha.secretKey;
      }
      var apiResponse = HTTP.post("https://www.google.com/recaptcha/api/siteverify", {
        params: {
          secret: secretKey,
          response: options.profile.reCaptchaResponse,
          remoteip: this.connection.clientAddress
        }
      }).data;
      if (!apiResponse.success) {
        throw new Meteor.Error(403, AccountsTemplates.texts.errors.captchaVerification, apiResponse['error-codes'] ? apiResponse['error-codes'].join(", ") : "Unknown Error.");
      }
    }
    if (someError) {
      throw new Meteor.Error(403, AccountsTemplates.texts.errors.validationErrors, validationErrors);
    }

    // Possibly removes the profile field
    if (_.isEmpty(options.profile)) {
      delete options.profile;
    }

    // Create user. result contains id and token.
    var userId = Accounts.createUser(options);
    // safety belt. createUser is supposed to throw on error. send 500 error
    // instead of sending a verification email with empty userid.
    if (!userId) {
      throw new Error("createUser failed to insert new user");
    }

    // Call postSignUpHook, if any...
    var postSignUpHook = AccountsTemplates.options.postSignUpHook;
    if (postSignUpHook) {
      postSignUpHook(userId, options);
    }

    // Send a email address verification email in case the context permits it
    // and the specific configuration flag was set to true
    if (options.email && AccountsTemplates.options.sendVerificationEmail) {
      Accounts.sendVerificationEmail(userId, options.email);
    }
  },
  // Resend a user's verification e-mail
  ATResendVerificationEmail: function (email) {
    check(email, String);
    var user = Meteor.users.findOne({
      "emails.address": email
    });

    // Send the standard error back to the client if no user exist with this e-mail
    if (!user) {
      throw new Meteor.Error(403, "User not found");
    }
    try {
      Accounts.sendVerificationEmail(user._id);
    } catch (error) {
      // Handle error when email already verified
      // https://github.com/dwinston/send-verification-email-bug
      throw new Meteor.Error(403, "Already verified");
    }
  }
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"T9n.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/useraccounts_core/lib/T9n.js                                                                         //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
let en;
module.link("meteor-accounts-t9n/build/en", {
  default(v) {
    en = v;
  }
}, 0);
T9n = require('meteor-accounts-t9n').T9n;
T9n.map("en", en);
T9n.setLanguage('en');
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"node_modules":{"meteor-accounts-t9n":{"build":{"en.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// node_modules/meteor/useraccounts_core/node_modules/meteor-accounts-t9n/build/en.js                            //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
module.useNode();
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"t9n.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// node_modules/meteor/useraccounts_core/node_modules/meteor-accounts-t9n/build/t9n.js                           //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
module.useNode();
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"package.json":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// node_modules/meteor/useraccounts_core/node_modules/meteor-accounts-t9n/package.json                           //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
module.exports = {
  "name": "meteor-accounts-t9n",
  "version": "2.6.0",
  "main": "build/t9n.js"
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/useraccounts:core/lib/field.js");
require("/node_modules/meteor/useraccounts:core/lib/core.js");
require("/node_modules/meteor/useraccounts:core/lib/server.js");
require("/node_modules/meteor/useraccounts:core/lib/methods.js");
require("/node_modules/meteor/useraccounts:core/lib/server_methods.js");
require("/node_modules/meteor/useraccounts:core/lib/T9n.js");

/* Exports */
Package._define("useraccounts:core", {
  AccountsTemplates: AccountsTemplates,
  T9n: T9n
});

})();

//# sourceURL=meteor://💻app/packages/useraccounts_core.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvdXNlcmFjY291bnRzOmNvcmUvbGliL2ZpZWxkLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy91c2VyYWNjb3VudHM6Y29yZS9saWIvY29yZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvdXNlcmFjY291bnRzOmNvcmUvbGliL3NlcnZlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvdXNlcmFjY291bnRzOmNvcmUvbGliL21ldGhvZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3VzZXJhY2NvdW50czpjb3JlL2xpYi9zZXJ2ZXJfbWV0aG9kcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvdXNlcmFjY291bnRzOmNvcmUvbGliL1Q5bi5qcyJdLCJuYW1lcyI6WyJGaWVsZCIsImZpZWxkIiwiY2hlY2siLCJGSUVMRF9QQVQiLCJfIiwiZGVmYXVsdHMiLCJ2YWxpZGF0aW5nIiwiUmVhY3RpdmVWYXIiLCJzdGF0dXMiLCJNZXRlb3IiLCJpc0NsaWVudCIsInByb3RvdHlwZSIsImNsZWFyU3RhdHVzIiwic2V0IiwiaXNTZXJ2ZXIiLCJmaXhWYWx1ZSIsInZhbHVlIiwidHlwZSIsInRyaW0iLCJsb3dlcmNhc2UiLCJ0b0xvd2VyQ2FzZSIsInVwcGVyY2FzZSIsInRvVXBwZXJDYXNlIiwidHJhbnNmb3JtIiwiZ2V0RGlzcGxheU5hbWUiLCJzdGF0ZSIsImRpc3BsYXlOYW1lIiwiaXNGdW5jdGlvbiIsImlzT2JqZWN0IiwiY2FwaXRhbGl6ZSIsIl9pZCIsImdldFBsYWNlaG9sZGVyIiwicGxhY2Vob2xkZXIiLCJnZXRTdGF0dXMiLCJnZXQiLCJnZXRWYWx1ZSIsInRlbXBsYXRlSW5zdGFuY2UiLCIkIiwidmFsIiwiaGFzRXJyb3IiLCJuZWdhdGl2ZVZhbGlkYXRpb24iLCJoYXNJY29uIiwic2hvd1ZhbGlkYXRpbmciLCJpc1ZhbGlkYXRpbmciLCJuZWdhdGl2ZUZlZWRiYWNrIiwicG9zaXRpdmVGZWVkYmFjayIsImhhc1N1Y2Nlc3MiLCJwb3NpdGl2ZVZhbGlkYXRpb24iLCJpY29uQ2xhc3MiLCJBY2NvdW50c1RlbXBsYXRlcyIsInRleHRzIiwiaW5wdXRJY29ucyIsInNldEVycm9yIiwiZXJyIiwiTWF0Y2giLCJPbmVPZiIsIlN0cmluZyIsInVuZGVmaW5lZCIsIkJvb2xlYW4iLCJzZXRTdWNjZXNzIiwic2V0VmFsaWRhdGluZyIsInNldFZhbHVlIiwicHJvcCIsInZhbGlkYXRlIiwic3RyaWN0IiwiaXNVbmRlZmluZWQiLCJyZXF1aXJlZCIsInJlcXVpcmVkRmllbGQiLCJ2YWx1ZUxlbmd0aCIsImxlbmd0aCIsIm1pbkxlbmd0aCIsIm1pblJlcXVpcmVkTGVuZ3RoIiwibWF4TGVuZ3RoIiwibWF4QWxsb3dlZExlbmd0aCIsInJlIiwibWF0Y2giLCJlcnJTdHIiLCJmdW5jIiwicmVzdWx0IiwiU1RBVEVfUEFUIiwiY2hhbmdlUHdkIiwiT3B0aW9uYWwiLCJlbnJvbGxBY2NvdW50IiwiZm9yZ290UHdkIiwicmVzZXRQd2QiLCJzaWduSW4iLCJzaWduVXAiLCJ2ZXJpZnlFbWFpbCIsInJlc2VuZFZlcmlmaWNhdGlvbkVtYWlsIiwiRVJST1JTX1BBVCIsImFjY291bnRzQ3JlYXRpb25EaXNhYmxlZCIsImNhbm5vdFJlbW92ZVNlcnZpY2UiLCJjYXB0Y2hhVmVyaWZpY2F0aW9uIiwibG9naW5Gb3JiaWRkZW4iLCJtdXN0QmVMb2dnZWRJbiIsInB3ZE1pc21hdGNoIiwidmFsaWRhdGlvbkVycm9ycyIsInZlcmlmeUVtYWlsRmlyc3QiLCJJTkZPX1BBVCIsImVtYWlsU2VudCIsImVtYWlsVmVyaWZpZWQiLCJwd2RDaGFuZ2VkIiwicHdkUmVzZXQiLCJwd2RTZXQiLCJzaWduVXBWZXJpZnlFbWFpbCIsInZlcmlmaWNhdGlvbkVtYWlsU2VudCIsIklOUFVUX0lDT05TX1BBVCIsIk9ialdpdGhTdHJpbmdWYWx1ZXMiLCJXaGVyZSIsIngiLCJPYmplY3QiLCJlYWNoIiwidmFsdWVzIiwiVEVYVFNfUEFUIiwiYnV0dG9uIiwiZXJyb3JzIiwiaW5mbyIsIm5hdlNpZ25JbiIsIm5hdlNpZ25PdXQiLCJvcHRpb25hbEZpZWxkIiwicHdkTGlua19saW5rIiwicHdkTGlua19wcmUiLCJwd2RMaW5rX3N1ZmYiLCJyZXNlbmRWZXJpZmljYXRpb25FbWFpbExpbmtfcHJlIiwicmVzZW5kVmVyaWZpY2F0aW9uRW1haWxMaW5rX2xpbmsiLCJyZXNlbmRWZXJpZmljYXRpb25FbWFpbExpbmtfc3VmZiIsInNlcCIsInNpZ25JbkxpbmtfbGluayIsInNpZ25JbkxpbmtfcHJlIiwic2lnbkluTGlua19zdWZmIiwic2lnblVwTGlua19saW5rIiwic2lnblVwTGlua19wcmUiLCJzaWduVXBMaW5rX3N1ZmYiLCJzb2NpYWxBZGQiLCJzb2NpYWxDb25maWd1cmUiLCJzb2NpYWxJY29ucyIsInNvY2lhbFJlbW92ZSIsInNvY2lhbFNpZ25JbiIsInNvY2lhbFNpZ25VcCIsInNvY2lhbFdpdGgiLCJ0ZXJtc0FuZCIsInRlcm1zUHJlYW1ibGUiLCJ0ZXJtc1ByaXZhY3kiLCJ0ZXJtc1Rlcm1zIiwidGl0bGUiLCJDT05GSUdfUEFUIiwiY29uZmlybVBhc3N3b3JkIiwiZGVmYXVsdFN0YXRlIiwiZW5hYmxlUGFzc3dvcmRDaGFuZ2UiLCJlbmZvcmNlRW1haWxWZXJpZmljYXRpb24iLCJmb2N1c0ZpcnN0SW5wdXQiLCJmb3JiaWRDbGllbnRBY2NvdW50Q3JlYXRpb24iLCJsb3dlcmNhc2VVc2VybmFtZSIsIm92ZXJyaWRlTG9naW5FcnJvcnMiLCJzZW5kVmVyaWZpY2F0aW9uRW1haWwiLCJzb2NpYWxMb2dpblN0eWxlIiwiZGVmYXVsdExheW91dCIsImhpZGVTaWduSW5MaW5rIiwiaGlkZVNpZ25VcExpbmsiLCJzaG93QWRkUmVtb3ZlU2VydmljZXMiLCJzaG93Rm9yZ290UGFzc3dvcmRMaW5rIiwic2hvd1Jlc2VuZFZlcmlmaWNhdGlvbkVtYWlsTGluayIsInNob3dMYWJlbHMiLCJzaG93UGxhY2Vob2xkZXJzIiwiY29udGludW91c1ZhbGlkYXRpb24iLCJwcml2YWN5VXJsIiwidGVybXNVcmwiLCJob21lUm91dGVQYXRoIiwicmVkaXJlY3RUaW1lb3V0IiwiTnVtYmVyIiwib25Mb2dvdXRIb29rIiwiRnVuY3Rpb24iLCJvblN1Ym1pdEhvb2siLCJwcmVTaWduVXBIb29rIiwicG9zdFNpZ25VcEhvb2siLCJyZUNhcHRjaGEiLCJkYXRhX3R5cGUiLCJzZWNyZXRLZXkiLCJzaXRlS2V5IiwidGhlbWUiLCJzaG93UmVDYXB0Y2hhIiwiRklFTERfU1VCX1BBVCIsInNlbGVjdCIsInRleHQiLCJBbnkiLCJJbnRlZ2VyIiwiUmVnRXhwIiwib3B0aW9ucyIsInRlbXBsYXRlIiwiQVQiLCJJTlBVVF9UWVBFUyIsImlzQ29yZG92YSIsIlNQRUNJQUxfRklFTERTIiwiX2ZpZWxkcyIsImVtYWlsIiwiY29udGFpbnMiLCJfaW5pdGlhbGl6ZWQiLCJfaXNWYWxpZElucHV0VHlwZSIsImluZGV4T2YiLCJhZGRGaWVsZCIsIkVycm9yIiwicGljayIsImtleXMiLCJwbHVjayIsInB1c2giLCJhZGRGaWVsZHMiLCJmaWVsZHMiLCJvayIsImUiLCJtYXAiLCJjb25maWd1cmUiLCJjb25maWciLCJvbWl0Iiwic2ltcGxlVGV4dHMiLCJjb25maWd1cmVSb3V0ZSIsInJvdXRlIiwiY29uc29sZSIsIndhcm4iLCJoYXNGaWVsZCIsImZpZWxkSWQiLCJnZXRGaWVsZCIsImZpbHRlciIsImdldEZpZWxkcyIsImdldEZpZWxkSWRzIiwiZ2V0Um91dGVQYXRoIiwib2F1dGhTZXJ2aWNlcyIsIm5hbWVzIiwiQWNjb3VudHMiLCJvYXV0aCIsInNlcnZpY2VOYW1lcyIsImxvZ2luU2VydmljZXNDb25maWd1cmVkIiwiY29uZmlndXJlZFNlcnZpY2VzIiwibG9naW5TZXJ2aWNlQ29uZmlndXJhdGlvbiIsImZpbmQiLCJmZXRjaCIsInNlcnZpY2VzIiwibmFtZSIsImNvbmZpZ3VyZWQiLCJzaG93VW5jb25maWd1cmVkIiwiX2xvZ2luQnV0dG9uc1Nlc3Npb24iLCJzZXJ2aWNlIiwic29ydEJ5IiwicmVtb3ZlRmllbGQiLCJpbmRleCIsInNwbGljZSIsImluaXQiLCJfaW5pdCIsIlBhY2thZ2UiLCJwYXNzd29yZCIsInVzZXJuYW1lIiwicHVibGlzaCIsInVzZXJJZCIsInVzZXJzIiwidmFsaWRhdGVMb2dpbkF0dGVtcHQiLCJhdHRlbXB0IiwiZXJyb3IiLCJyZWFzb24iLCJhbGxvd2VkIiwibWV0aG9kTmFtZSIsInVzZXIiLCJsb2dpbkVtYWlsIiwibWV0aG9kQXJndW1lbnRzIiwiZW1haWxzIiwib2JqIiwiYWRkcmVzcyIsInZlcmlmaWVkIiwiY2hhaW4iLCJhbnkiLCJhdFNlY3JldEtleSIsInNldHRpbmdzU2VjcmV0S2V5Iiwic2V0dGluZ3MiLCJzdGFydHVwIiwibWV0aG9kcyIsIkFUUmVtb3ZlU2VydmljZSIsInNlcnZpY2VOYW1lIiwiZmluZE9uZSIsIm51bVNlcnZpY2VzIiwidW5zZXQiLCJ1cGRhdGUiLCIkdW5zZXQiLCJBVENyZWF0ZVVzZXJTZXJ2ZXIiLCJhbGxGaWVsZElkcyIsInByb2ZpbGUiLCJzaWdudXBJbmZvIiwiY2xvbmUiLCJyZXBsYWNlIiwic29tZUVycm9yIiwidmFsaWRhdGlvbkVyciIsImFwaVJlc3BvbnNlIiwiSFRUUCIsInBvc3QiLCJwYXJhbXMiLCJzZWNyZXQiLCJyZXNwb25zZSIsInJlQ2FwdGNoYVJlc3BvbnNlIiwicmVtb3RlaXAiLCJjb25uZWN0aW9uIiwiY2xpZW50QWRkcmVzcyIsImRhdGEiLCJzdWNjZXNzIiwiam9pbiIsImlzRW1wdHkiLCJjcmVhdGVVc2VyIiwiQVRSZXNlbmRWZXJpZmljYXRpb25FbWFpbCIsImVuIiwibW9kdWxlIiwibGluayIsImRlZmF1bHQiLCJ2IiwiVDluIiwicmVxdWlyZSIsInNldExhbmd1YWdlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBOztBQUVBQSxLQUFLLEdBQUcsU0FBQUEsQ0FBU0MsS0FBSyxFQUFFO0VBQ3RC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O01BQ0E7TUFDQSxNQUFNLElBQUl0UCxNQUFNLENBQUMrTCxLQUFLLENBQUMsR0FBRyxFQUFFLGtCQUFrQixDQUFDO0lBQ2pEO0VBQ0Y7QUFDRixDQUFDLENBQUMsQzs7Ozs7Ozs7Ozs7QUM3SUYsSUFBSXdHLEVBQUU7QUFBQ0MsTUFBTSxDQUFDQyxJQUFJLENBQUMsOEJBQThCLEVBQUM7RUFBQ0MsT0FBT0EsQ0FBQ0MsQ0FBQyxFQUFDO0lBQUNKLEVBQUUsR0FBQ0ksQ0FBQztFQUFBO0FBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztBQUF2RUMsR0FBRyxHQUFHQyxPQUFPLENBQUMscUJBQXFCLENBQUMsQ0FBQ0QsR0FBRztBQUd4Q0EsR0FBRyxDQUFDcEcsR0FBRyxDQUFDLElBQUksRUFBRStGLEVBQUUsQ0FBQztBQUNqQkssR0FBRyxDQUFDRSxXQUFXLENBQUMsSUFBSSxDQUFDLEMiLCJmaWxlIjoiL3BhY2thZ2VzL3VzZXJhY2NvdW50c19jb3JlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBGaWVsZCBvYmplY3Rcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5GaWVsZCA9IGZ1bmN0aW9uKGZpZWxkKSB7XG4gIGNoZWNrKGZpZWxkLCBGSUVMRF9QQVQpO1xuICBfLmRlZmF1bHRzKHRoaXMsIGZpZWxkKTtcblxuICB0aGlzLnZhbGlkYXRpbmcgPSBuZXcgUmVhY3RpdmVWYXIoZmFsc2UpO1xuICB0aGlzLnN0YXR1cyA9IG5ldyBSZWFjdGl2ZVZhcihudWxsKTtcbn07XG5cbmlmIChNZXRlb3IuaXNDbGllbnQpIHtcbiAgRmllbGQucHJvdG90eXBlLmNsZWFyU3RhdHVzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdHVzLnNldChudWxsKTtcbiAgfTtcbn1cblxuaWYgKE1ldGVvci5pc1NlcnZlcikge1xuICBGaWVsZC5wcm90b3R5cGUuY2xlYXJTdGF0dXMgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBOb3RoaW5nIHRvIGRvIHNlcnZlci1zaWRlXG4gICAgcmV0dXJuO1xuICB9O1xufVxuXG5GaWVsZC5wcm90b3R5cGUuZml4VmFsdWUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICBpZiAodGhpcy50eXBlID09PSBcImNoZWNrYm94XCIpIHtcbiAgICByZXR1cm4gISF2YWx1ZTtcbiAgfVxuXG4gIGlmICh0aGlzLnR5cGUgPT09IFwic2VsZWN0XCIpIHtcbiAgICAvLyBUT0RPOiBzb21ldGhpbmcgd29ya2luZy4uLlxuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIGlmICh0aGlzLnR5cGUgPT09IFwicmFkaW9cIikge1xuICAgIC8vIFRPRE86IHNvbWV0aGluZyB3b3JraW5nLi4uXG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgLy8gUG9zc2libHkgYXBwbGllcyByZXF1aXJlZCB0cmFuc2Zvcm1hdGlvbnMgdG8gdGhlIGlucHV0IHZhbHVlXG4gIGlmICh0aGlzLnRyaW0pIHtcbiAgICB2YWx1ZSA9IHZhbHVlLnRyaW0oKTtcbiAgfVxuXG4gIGlmICh0aGlzLmxvd2VyY2FzZSkge1xuICAgIHZhbHVlID0gdmFsdWUudG9Mb3dlckNhc2UoKTtcbiAgfVxuXG4gIGlmICh0aGlzLnVwcGVyY2FzZSkge1xuICAgIHZhbHVlID0gdmFsdWUudG9VcHBlckNhc2UoKTtcbiAgfVxuXG4gIGlmICghIXRoaXMudHJhbnNmb3JtKSB7XG4gICAgdmFsdWUgPSB0aGlzLnRyYW5zZm9ybSh2YWx1ZSk7XG4gIH1cblxuICByZXR1cm4gdmFsdWU7XG59O1xuXG5pZiAoTWV0ZW9yLmlzQ2xpZW50KSB7XG4gIEZpZWxkLnByb3RvdHlwZS5nZXREaXNwbGF5TmFtZSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gICAgdmFyIGRpc3BsYXlOYW1lID0gdGhpcy5kaXNwbGF5TmFtZTtcblxuICAgIGlmIChfLmlzRnVuY3Rpb24oZGlzcGxheU5hbWUpKSB7XG4gICAgICBkaXNwbGF5TmFtZSA9IGRpc3BsYXlOYW1lKCk7XG4gICAgfSBlbHNlIGlmIChfLmlzT2JqZWN0KGRpc3BsYXlOYW1lKSkge1xuICAgICAgZGlzcGxheU5hbWUgPSBkaXNwbGF5TmFtZVtzdGF0ZV0gfHwgZGlzcGxheU5hbWVbXCJkZWZhdWx0XCJdO1xuICAgIH1cblxuICAgIGlmICghZGlzcGxheU5hbWUpIHtcbiAgICAgIGRpc3BsYXlOYW1lID0gY2FwaXRhbGl6ZSh0aGlzLl9pZCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRpc3BsYXlOYW1lO1xuICB9O1xufVxuXG5pZiAoTWV0ZW9yLmlzQ2xpZW50KSB7XG4gIEZpZWxkLnByb3RvdHlwZS5nZXRQbGFjZWhvbGRlciA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gICAgdmFyIHBsYWNlaG9sZGVyID0gdGhpcy5wbGFjZWhvbGRlcjtcblxuICAgIGlmIChfLmlzT2JqZWN0KHBsYWNlaG9sZGVyKSkge1xuICAgICAgcGxhY2Vob2xkZXIgPSBwbGFjZWhvbGRlcltzdGF0ZV0gfHwgcGxhY2Vob2xkZXJbXCJkZWZhdWx0XCJdO1xuICAgIH1cblxuICAgIGlmICghcGxhY2Vob2xkZXIpIHtcbiAgICAgIHBsYWNlaG9sZGVyID0gY2FwaXRhbGl6ZSh0aGlzLl9pZCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBsYWNlaG9sZGVyO1xuICB9O1xufVxuXG5GaWVsZC5wcm90b3R5cGUuZ2V0U3RhdHVzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnN0YXR1cy5nZXQoKTtcbn07XG5cbmlmIChNZXRlb3IuaXNDbGllbnQpIHtcbiAgRmllbGQucHJvdG90eXBlLmdldFZhbHVlID0gZnVuY3Rpb24odGVtcGxhdGVJbnN0YW5jZSkge1xuICAgIGlmICh0aGlzLnR5cGUgPT09IFwiY2hlY2tib3hcIikge1xuICAgICAgcmV0dXJuICEhKHRlbXBsYXRlSW5zdGFuY2UuJChcIiNhdC1maWVsZC1cIiArIHRoaXMuX2lkICsgXCI6Y2hlY2tlZFwiKS52YWwoKSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMudHlwZSA9PT0gXCJyYWRpb1wiKSB7XG4gICAgICByZXR1cm4gdGVtcGxhdGVJbnN0YW5jZS4kKFwiW25hbWU9YXQtZmllbGQtXCIrIHRoaXMuX2lkICsgXCJdOmNoZWNrZWRcIikudmFsKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRlbXBsYXRlSW5zdGFuY2UuJChcIiNhdC1maWVsZC1cIiArIHRoaXMuX2lkKS52YWwoKTtcbiAgfTtcbn1cblxuaWYgKE1ldGVvci5pc0NsaWVudCkge1xuICBGaWVsZC5wcm90b3R5cGUuaGFzRXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5uZWdhdGl2ZVZhbGlkYXRpb24gJiYgdGhpcy5zdGF0dXMuZ2V0KCk7XG4gIH07XG59XG5cbmlmIChNZXRlb3IuaXNDbGllbnQpIHtcbiAgRmllbGQucHJvdG90eXBlLmhhc0ljb24gPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5zaG93VmFsaWRhdGluZyAmJiB0aGlzLmlzVmFsaWRhdGluZygpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5uZWdhdGl2ZUZlZWRiYWNrICYmIHRoaXMuaGFzRXJyb3IoKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMucG9zaXRpdmVGZWVkYmFjayAmJiB0aGlzLmhhc1N1Y2Nlc3MoKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9O1xufVxuXG5pZiAoTWV0ZW9yLmlzQ2xpZW50KSB7XG4gIEZpZWxkLnByb3RvdHlwZS5oYXNTdWNjZXNzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMucG9zaXRpdmVWYWxpZGF0aW9uICYmIHRoaXMuc3RhdHVzLmdldCgpID09PSBmYWxzZTtcbiAgfTtcbn1cblxuaWYgKE1ldGVvci5pc0NsaWVudClcbiAgRmllbGQucHJvdG90eXBlLmljb25DbGFzcyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLmlzVmFsaWRhdGluZygpKSB7XG4gICAgICByZXR1cm4gQWNjb3VudHNUZW1wbGF0ZXMudGV4dHMuaW5wdXRJY29uc1tcImlzVmFsaWRhdGluZ1wiXTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5oYXNFcnJvcigpKSB7XG4gICAgICByZXR1cm4gQWNjb3VudHNUZW1wbGF0ZXMudGV4dHMuaW5wdXRJY29uc1tcImhhc0Vycm9yXCJdO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhhc1N1Y2Nlc3MoKSkge1xuICAgICAgcmV0dXJuIEFjY291bnRzVGVtcGxhdGVzLnRleHRzLmlucHV0SWNvbnNbXCJoYXNTdWNjZXNzXCJdO1xuICAgIH1cbiAgfTtcblxuaWYgKE1ldGVvci5pc0NsaWVudCkge1xuICBGaWVsZC5wcm90b3R5cGUuaXNWYWxpZGF0aW5nID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsaWRhdGluZy5nZXQoKTtcbiAgfTtcbn1cblxuaWYgKE1ldGVvci5pc0NsaWVudCkge1xuICBGaWVsZC5wcm90b3R5cGUuc2V0RXJyb3IgPSBmdW5jdGlvbihlcnIpIHtcbiAgICBjaGVjayhlcnIsIE1hdGNoLk9uZU9mKFN0cmluZywgdW5kZWZpbmVkLCBCb29sZWFuKSk7XG5cbiAgICBpZiAoZXJyID09PSBmYWxzZSkge1xuICAgICAgcmV0dXJuIHRoaXMuc3RhdHVzLnNldChmYWxzZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuc3RhdHVzLnNldChlcnIgfHwgdHJ1ZSk7XG4gIH07XG59XG5cbmlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcbiAgRmllbGQucHJvdG90eXBlLnNldEVycm9yID0gZnVuY3Rpb24oZXJyKSB7XG4gICAgLy8gTm90aGluZyB0byBkbyBzZXJ2ZXItc2lkZVxuICAgIHJldHVybjtcbiAgfTtcbn1cblxuaWYgKE1ldGVvci5pc0NsaWVudCkge1xuICBGaWVsZC5wcm90b3R5cGUuc2V0U3VjY2VzcyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnN0YXR1cy5zZXQoZmFsc2UpO1xuICB9O1xufVxuXG5pZiAoTWV0ZW9yLmlzU2VydmVyKSB7XG4gIEZpZWxkLnByb3RvdHlwZS5zZXRTdWNjZXNzID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gTm90aGluZyB0byBkbyBzZXJ2ZXItc2lkZVxuICAgIHJldHVybjtcbiAgfTtcbn1cblxuaWYgKE1ldGVvci5pc0NsaWVudCkge1xuICBGaWVsZC5wcm90b3R5cGUuc2V0VmFsaWRhdGluZyA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gICAgY2hlY2soc3RhdGUsIEJvb2xlYW4pO1xuICAgIHJldHVybiB0aGlzLnZhbGlkYXRpbmcuc2V0KHN0YXRlKTtcbiAgfTtcbn1cblxuaWYgKE1ldGVvci5pc1NlcnZlcikge1xuICBGaWVsZC5wcm90b3R5cGUuc2V0VmFsaWRhdGluZyA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gICAgLy8gTm90aGluZyB0byBkbyBzZXJ2ZXItc2lkZVxuICAgIHJldHVybjtcbiAgfTtcbn1cblxuaWYgKE1ldGVvci5pc0NsaWVudCkge1xuICBGaWVsZC5wcm90b3R5cGUuc2V0VmFsdWUgPSBmdW5jdGlvbih0ZW1wbGF0ZUluc3RhbmNlLCB2YWx1ZSkge1xuICAgIGlmICh0aGlzLnR5cGUgPT09IFwiY2hlY2tib3hcIikge1xuICAgICAgdGVtcGxhdGVJbnN0YW5jZS4kKFwiI2F0LWZpZWxkLVwiICsgdGhpcy5faWQpLnByb3AoJ2NoZWNrZWQnLCB0cnVlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy50eXBlID09PSBcInJhZGlvXCIpIHtcbiAgICAgIHRlbXBsYXRlSW5zdGFuY2UuJChcIltuYW1lPWF0LWZpZWxkLVwiKyB0aGlzLl9pZCArIFwiXVwiKS5wcm9wKCdjaGVja2VkJywgdHJ1ZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGVtcGxhdGVJbnN0YW5jZS4kKFwiI2F0LWZpZWxkLVwiICsgdGhpcy5faWQpLnZhbCh2YWx1ZSk7XG4gIH07XG59XG5cbkZpZWxkLnByb3RvdHlwZS52YWxpZGF0ZSA9IGZ1bmN0aW9uKHZhbHVlLCBzdHJpY3QpIHtcbiAgY2hlY2sodmFsdWUsIE1hdGNoLk9uZU9mKHVuZGVmaW5lZCwgU3RyaW5nLCBCb29sZWFuKSk7XG4gIHRoaXMuc2V0VmFsaWRhdGluZyh0cnVlKTtcbiAgdGhpcy5jbGVhclN0YXR1cygpO1xuXG4gIGlmIChfLmlzVW5kZWZpbmVkKHZhbHVlKSB8fCB2YWx1ZSA9PT0gJycpIHtcbiAgICBpZiAoISFzdHJpY3QpIHtcbiAgICAgIGlmICh0aGlzLnJlcXVpcmVkKSB7XG4gICAgICAgIHRoaXMuc2V0RXJyb3IoQWNjb3VudHNUZW1wbGF0ZXMudGV4dHMucmVxdWlyZWRGaWVsZCk7XG4gICAgICAgIHRoaXMuc2V0VmFsaWRhdGluZyhmYWxzZSk7XG5cbiAgICAgICAgcmV0dXJuIEFjY291bnRzVGVtcGxhdGVzLnRleHRzLnJlcXVpcmVkRmllbGQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnNldFN1Y2Nlc3MoKTtcbiAgICAgICAgdGhpcy5zZXRWYWxpZGF0aW5nKGZhbHNlKTtcblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY2xlYXJTdGF0dXMoKTtcbiAgICAgIHRoaXMuc2V0VmFsaWRhdGluZyhmYWxzZSk7XG5cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIHZhciB2YWx1ZUxlbmd0aCA9IHZhbHVlLmxlbmd0aDtcbiAgdmFyIG1pbkxlbmd0aCA9IHRoaXMubWluTGVuZ3RoO1xuICBpZiAobWluTGVuZ3RoICYmIHZhbHVlTGVuZ3RoIDwgbWluTGVuZ3RoKSB7XG4gICAgdGhpcy5zZXRFcnJvcihBY2NvdW50c1RlbXBsYXRlcy50ZXh0cy5taW5SZXF1aXJlZExlbmd0aCArIFwiOiBcIiArIG1pbkxlbmd0aCk7XG4gICAgdGhpcy5zZXRWYWxpZGF0aW5nKGZhbHNlKTtcblxuICAgIHJldHVybiBBY2NvdW50c1RlbXBsYXRlcy50ZXh0cy5taW5SZXF1aXJlZExlbmd0aCArIFwiOiBcIiArIG1pbkxlbmd0aDtcbiAgfVxuXG4gIHZhciBtYXhMZW5ndGggPSB0aGlzLm1heExlbmd0aDtcbiAgaWYgKG1heExlbmd0aCAmJiB2YWx1ZUxlbmd0aCA+IG1heExlbmd0aCkge1xuICAgIHRoaXMuc2V0RXJyb3IoQWNjb3VudHNUZW1wbGF0ZXMudGV4dHMubWF4QWxsb3dlZExlbmd0aCArIFwiOiBcIiArIG1heExlbmd0aCk7XG4gICAgdGhpcy5zZXRWYWxpZGF0aW5nKGZhbHNlKTtcblxuICAgIHJldHVybiBBY2NvdW50c1RlbXBsYXRlcy50ZXh0cy5tYXhBbGxvd2VkTGVuZ3RoICsgXCI6IFwiICsgbWF4TGVuZ3RoO1xuICB9XG5cbiAgaWYgKHRoaXMucmUgJiYgdmFsdWVMZW5ndGggJiYgIXZhbHVlLm1hdGNoKHRoaXMucmUpKSB7XG4gICAgdGhpcy5zZXRFcnJvcih0aGlzLmVyclN0cik7XG4gICAgdGhpcy5zZXRWYWxpZGF0aW5nKGZhbHNlKTtcblxuICAgIHJldHVybiB0aGlzLmVyclN0cjtcbiAgfVxuXG4gIGlmICh0aGlzLmZ1bmMpIHtcbiAgICB2YXIgcmVzdWx0ID0gdGhpcy5mdW5jKHZhbHVlKTtcbiAgICB2YXIgZXJyID0gcmVzdWx0ID09PSB0cnVlID8gdGhpcy5lcnJTdHIgfHwgdHJ1ZSA6IHJlc3VsdDtcblxuICAgIGlmIChfLmlzVW5kZWZpbmVkKHJlc3VsdCkpIHtcbiAgICAgIHJldHVybiBlcnI7XG4gICAgfVxuXG4gICAgdGhpcy5zdGF0dXMuc2V0KGVycik7XG4gICAgdGhpcy5zZXRWYWxpZGF0aW5nKGZhbHNlKTtcblxuICAgIHJldHVybiBlcnI7XG4gIH1cblxuICB0aGlzLnNldFN1Y2Nlc3MoKTtcbiAgdGhpcy5zZXRWYWxpZGF0aW5nKGZhbHNlKTtcblxuICByZXR1cm4gZmFsc2U7XG59O1xuIiwiLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBQYXR0ZXJucyBmb3IgbWV0aG9kc1wiIHBhcmFtZXRlcnNcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5TVEFURV9QQVQgPSB7XG4gIGNoYW5nZVB3ZDogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcbiAgZW5yb2xsQWNjb3VudDogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcbiAgZm9yZ290UHdkOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICByZXNldFB3ZDogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcbiAgc2lnbkluOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICBzaWduVXA6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG4gIHZlcmlmeUVtYWlsOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICByZXNlbmRWZXJpZmljYXRpb25FbWFpbDogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcbn07XG5cbkVSUk9SU19QQVQgPSB7XG4gIGFjY291bnRzQ3JlYXRpb25EaXNhYmxlZDogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcbiAgY2Fubm90UmVtb3ZlU2VydmljZTogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcbiAgY2FwdGNoYVZlcmlmaWNhdGlvbjogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcbiAgbG9naW5Gb3JiaWRkZW46IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG4gIG11c3RCZUxvZ2dlZEluOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICBwd2RNaXNtYXRjaDogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcbiAgdmFsaWRhdGlvbkVycm9yczogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcbiAgdmVyaWZ5RW1haWxGaXJzdDogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcbn07XG5cbklORk9fUEFUID0ge1xuICBlbWFpbFNlbnQ6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG4gIGVtYWlsVmVyaWZpZWQ6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG4gIHB3ZENoYW5nZWQ6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG4gIHB3ZFJlc2V0OiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICBwd2RTZXQ6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG4gIHNpZ25VcFZlcmlmeUVtYWlsOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICB2ZXJpZmljYXRpb25FbWFpbFNlbnQ6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG59O1xuXG5JTlBVVF9JQ09OU19QQVQgPSB7XG4gIGhhc0Vycm9yOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICBoYXNTdWNjZXNzOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICBpc1ZhbGlkYXRpbmc6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG59O1xuXG5PYmpXaXRoU3RyaW5nVmFsdWVzID0gTWF0Y2guV2hlcmUoZnVuY3Rpb24gKHgpIHtcbiAgY2hlY2soeCwgT2JqZWN0KTtcbiAgXy5lYWNoKF8udmFsdWVzKHgpLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgY2hlY2sodmFsdWUsIFN0cmluZyk7XG4gIH0pO1xuICByZXR1cm4gdHJ1ZTtcbn0pO1xuXG5URVhUU19QQVQgPSB7XG4gIGJ1dHRvbjogTWF0Y2guT3B0aW9uYWwoU1RBVEVfUEFUKSxcbiAgZXJyb3JzOiBNYXRjaC5PcHRpb25hbChFUlJPUlNfUEFUKSxcbiAgaW5mbzogTWF0Y2guT3B0aW9uYWwoSU5GT19QQVQpLFxuICBpbnB1dEljb25zOiBNYXRjaC5PcHRpb25hbChJTlBVVF9JQ09OU19QQVQpLFxuICBtYXhBbGxvd2VkTGVuZ3RoOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICBtaW5SZXF1aXJlZExlbmd0aDogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcbiAgbmF2U2lnbkluOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICBuYXZTaWduT3V0OiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICBvcHRpb25hbEZpZWxkOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICBwd2RMaW5rX2xpbms6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG4gIHB3ZExpbmtfcHJlOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICBwd2RMaW5rX3N1ZmY6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG4gIHJlcXVpcmVkRmllbGQ6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG4gIHJlc2VuZFZlcmlmaWNhdGlvbkVtYWlsTGlua19wcmU6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG4gIHJlc2VuZFZlcmlmaWNhdGlvbkVtYWlsTGlua19saW5rOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICByZXNlbmRWZXJpZmljYXRpb25FbWFpbExpbmtfc3VmZjogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcbiAgc2VwOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICBzaWduSW5MaW5rX2xpbms6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG4gIHNpZ25JbkxpbmtfcHJlOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICBzaWduSW5MaW5rX3N1ZmY6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG4gIHNpZ25VcExpbmtfbGluazogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcbiAgc2lnblVwTGlua19wcmU6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG4gIHNpZ25VcExpbmtfc3VmZjogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcbiAgc29jaWFsQWRkOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICBzb2NpYWxDb25maWd1cmU6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG4gIHNvY2lhbEljb25zOiBNYXRjaC5PcHRpb25hbChPYmpXaXRoU3RyaW5nVmFsdWVzKSxcbiAgc29jaWFsUmVtb3ZlOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICBzb2NpYWxTaWduSW46IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG4gIHNvY2lhbFNpZ25VcDogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcbiAgc29jaWFsV2l0aDogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcbiAgdGVybXNBbmQ6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG4gIHRlcm1zUHJlYW1ibGU6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG4gIHRlcm1zUHJpdmFjeTogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcbiAgdGVybXNUZXJtczogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcbiAgdGl0bGU6IE1hdGNoLk9wdGlvbmFsKFNUQVRFX1BBVCksXG59O1xuXG4vLyBDb25maWd1cmF0aW9uIHBhdHRlcm4gdG8gYmUgY2hlY2tlZCB3aXRoIGNoZWNrXG5DT05GSUdfUEFUID0ge1xuICAvLyBCZWhhdmlvdXJcbiAgY29uZmlybVBhc3N3b3JkOiBNYXRjaC5PcHRpb25hbChCb29sZWFuKSxcbiAgZGVmYXVsdFN0YXRlOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICBlbmFibGVQYXNzd29yZENoYW5nZTogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbiksXG4gIGVuZm9yY2VFbWFpbFZlcmlmaWNhdGlvbjogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbiksXG4gIGZvY3VzRmlyc3RJbnB1dDogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbiksXG4gIGZvcmJpZENsaWVudEFjY291bnRDcmVhdGlvbjogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbiksXG4gIGxvd2VyY2FzZVVzZXJuYW1lOiBNYXRjaC5PcHRpb25hbChCb29sZWFuKSxcbiAgb3ZlcnJpZGVMb2dpbkVycm9yczogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbiksXG4gIHNlbmRWZXJpZmljYXRpb25FbWFpbDogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbiksXG4gIHNvY2lhbExvZ2luU3R5bGU6IE1hdGNoLk9wdGlvbmFsKE1hdGNoLk9uZU9mKFwicG9wdXBcIiwgXCJyZWRpcmVjdFwiKSksXG5cbiAgLy8gQXBwZWFyYW5jZVxuICBkZWZhdWx0TGF5b3V0OiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICBoaWRlU2lnbkluTGluazogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbiksXG4gIGhpZGVTaWduVXBMaW5rOiBNYXRjaC5PcHRpb25hbChCb29sZWFuKSxcbiAgc2hvd0FkZFJlbW92ZVNlcnZpY2VzOiBNYXRjaC5PcHRpb25hbChCb29sZWFuKSxcbiAgc2hvd0ZvcmdvdFBhc3N3b3JkTGluazogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbiksXG4gIHNob3dSZXNlbmRWZXJpZmljYXRpb25FbWFpbExpbms6IE1hdGNoLk9wdGlvbmFsKEJvb2xlYW4pLFxuICBzaG93TGFiZWxzOiBNYXRjaC5PcHRpb25hbChCb29sZWFuKSxcbiAgc2hvd1BsYWNlaG9sZGVyczogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbiksXG5cbiAgLy8gQ2xpZW50LXNpZGUgVmFsaWRhdGlvblxuICBjb250aW51b3VzVmFsaWRhdGlvbjogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbiksXG4gIG5lZ2F0aXZlRmVlZGJhY2s6IE1hdGNoLk9wdGlvbmFsKEJvb2xlYW4pLFxuICBuZWdhdGl2ZVZhbGlkYXRpb246IE1hdGNoLk9wdGlvbmFsKEJvb2xlYW4pLFxuICBwb3NpdGl2ZUZlZWRiYWNrOiBNYXRjaC5PcHRpb25hbChCb29sZWFuKSxcbiAgcG9zaXRpdmVWYWxpZGF0aW9uOiBNYXRjaC5PcHRpb25hbChCb29sZWFuKSxcbiAgc2hvd1ZhbGlkYXRpbmc6IE1hdGNoLk9wdGlvbmFsKEJvb2xlYW4pLFxuXG4gIC8vIFByaXZhY3kgUG9saWN5IGFuZCBUZXJtcyBvZiBVc2VcbiAgcHJpdmFjeVVybDogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcbiAgdGVybXNVcmw6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG5cbiAgLy8gUmVkaXJlY3RzXG4gIGhvbWVSb3V0ZVBhdGg6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG4gIHJlZGlyZWN0VGltZW91dDogTWF0Y2guT3B0aW9uYWwoTnVtYmVyKSxcblxuICAvLyBIb29rc1xuICBvbkxvZ291dEhvb2s6IE1hdGNoLk9wdGlvbmFsKEZ1bmN0aW9uKSxcbiAgb25TdWJtaXRIb29rOiBNYXRjaC5PcHRpb25hbChGdW5jdGlvbiksXG4gIHByZVNpZ25VcEhvb2s6IE1hdGNoLk9wdGlvbmFsKEZ1bmN0aW9uKSxcbiAgcG9zdFNpZ25VcEhvb2s6IE1hdGNoLk9wdGlvbmFsKEZ1bmN0aW9uKSxcblxuICB0ZXh0czogTWF0Y2guT3B0aW9uYWwoVEVYVFNfUEFUKSxcblxuICAvL3JlQ2FwdGNoYSBjb25maWdcbiAgcmVDYXB0Y2hhOiBNYXRjaC5PcHRpb25hbCh7XG4gICAgZGF0YV90eXBlOiBNYXRjaC5PcHRpb25hbChNYXRjaC5PbmVPZihcImF1ZGlvXCIsIFwiaW1hZ2VcIikpLFxuICAgIHNlY3JldEtleTogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcbiAgICBzaXRlS2V5OiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICAgIHRoZW1lOiBNYXRjaC5PcHRpb25hbChNYXRjaC5PbmVPZihcImRhcmtcIiwgXCJsaWdodFwiKSksXG4gIH0pLFxuXG4gIHNob3dSZUNhcHRjaGE6IE1hdGNoLk9wdGlvbmFsKEJvb2xlYW4pLFxufTtcblxuXG5GSUVMRF9TVUJfUEFUID0ge1xuICBcImRlZmF1bHRcIjogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcbiAgY2hhbmdlUHdkOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICBlbnJvbGxBY2NvdW50OiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICBmb3Jnb3RQd2Q6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG4gIHJlc2V0UHdkOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuICBzaWduSW46IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG4gIHNpZ25VcDogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcbn07XG5cblxuLy8gRmllbGQgcGF0dGVyblxuRklFTERfUEFUID0ge1xuICBfaWQ6IFN0cmluZyxcbiAgdHlwZTogU3RyaW5nLFxuICByZXF1aXJlZDogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbiksXG4gIGRpc3BsYXlOYW1lOiBNYXRjaC5PcHRpb25hbChNYXRjaC5PbmVPZihTdHJpbmcsIE1hdGNoLldoZXJlKF8uaXNGdW5jdGlvbiksIEZJRUxEX1NVQl9QQVQpKSxcbiAgcGxhY2Vob2xkZXI6IE1hdGNoLk9wdGlvbmFsKE1hdGNoLk9uZU9mKFN0cmluZywgRklFTERfU1VCX1BBVCkpLFxuICBzZWxlY3Q6IE1hdGNoLk9wdGlvbmFsKFt7dGV4dDogU3RyaW5nLCB2YWx1ZTogTWF0Y2guQW55fV0pLFxuICBtaW5MZW5ndGg6IE1hdGNoLk9wdGlvbmFsKE1hdGNoLkludGVnZXIpLFxuICBtYXhMZW5ndGg6IE1hdGNoLk9wdGlvbmFsKE1hdGNoLkludGVnZXIpLFxuICByZTogTWF0Y2guT3B0aW9uYWwoUmVnRXhwKSxcbiAgZnVuYzogTWF0Y2guT3B0aW9uYWwoTWF0Y2guV2hlcmUoXy5pc0Z1bmN0aW9uKSksXG4gIGVyclN0cjogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcblxuICAvLyBDbGllbnQtc2lkZSBWYWxpZGF0aW9uXG4gIGNvbnRpbnVvdXNWYWxpZGF0aW9uOiBNYXRjaC5PcHRpb25hbChCb29sZWFuKSxcbiAgbmVnYXRpdmVGZWVkYmFjazogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbiksXG4gIG5lZ2F0aXZlVmFsaWRhdGlvbjogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbiksXG4gIHBvc2l0aXZlVmFsaWRhdGlvbjogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbiksXG4gIHBvc2l0aXZlRmVlZGJhY2s6IE1hdGNoLk9wdGlvbmFsKEJvb2xlYW4pLFxuXG4gIC8vIFRyYW5zZm9ybXNcbiAgdHJpbTogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbiksXG4gIGxvd2VyY2FzZTogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbiksXG4gIHVwcGVyY2FzZTogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbiksXG4gIHRyYW5zZm9ybTogTWF0Y2guT3B0aW9uYWwoTWF0Y2guV2hlcmUoXy5pc0Z1bmN0aW9uKSksXG5cbiAgLy8gQ3VzdG9tIG9wdGlvbnNcbiAgb3B0aW9uczogTWF0Y2guT3B0aW9uYWwoT2JqZWN0KSxcbiAgdGVtcGxhdGU6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gQWNjb3VudHNUZW1wbGF0ZXMgb2JqZWN0XG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBDbGllbnQvU2VydmVyIHN0dWZmXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIENvbnN0cnVjdG9yXG5BVCA9IGZ1bmN0aW9uKCkge1xuXG59O1xuXG5BVC5wcm90b3R5cGUuQ09ORklHX1BBVCA9IENPTkZJR19QQVQ7XG5cbi8qXG4gIEVhY2ggZmllbGQgb2JqZWN0IGlzIHJlcHJlc2VudGVkIGJ5IHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAgICBfaWQ6ICAgICAgICAgU3RyaW5nICAgKHJlcXVpcmVkKSAgLy8gQSB1bmlxdWUgZmllbGRcInMgaWQgLyBuYW1lXG4gICAgdHlwZTogICAgICAgIFN0cmluZyAgIChyZXF1aXJlZCkgIC8vIERpc3BsYXllZCBpbnB1dCB0eXBlXG4gICAgcmVxdWlyZWQ6ICAgIEJvb2xlYW4gIChvcHRpb25hbCkgIC8vIFNwZWNpZmllcyBXaGV0aGVyIHRvIGZhaWwgb3Igbm90IHdoZW4gZmllbGQgaXMgbGVmdCBlbXB0eVxuICAgIGRpc3BsYXlOYW1lOiBTdHJpbmcgICAob3B0aW9uYWwpICAvLyBUaGUgZmllbGRcInMgbmFtZSB0byBiZSBkaXNwbGF5ZWQgYXMgYSBsYWJlbCBhYm92ZSB0aGUgaW5wdXQgZWxlbWVudFxuICAgIHBsYWNlaG9sZGVyOiBTdHJpbmcgICAob3B0aW9uYWwpICAvLyBUaGUgcGxhY2Vob2xkZXIgdGV4dCB0byBiZSBkaXNwbGF5ZWQgaW5zaWRlIHRoZSBpbnB1dCBlbGVtZW50XG4gICAgbWluTGVuZ3RoOiAgIEludGVnZXIgIChvcHRpb25hbCkgIC8vIFBvc3NpYmx5IHNwZWNpZmllcyB0aGUgbWluaW11bSBhbGxvd2VkIGxlbmd0aFxuICAgIG1heExlbmd0aDogICBJbnRlZ2VyICAob3B0aW9uYWwpICAvLyBQb3NzaWJseSBzcGVjaWZpZXMgdGhlIG1heGltdW0gYWxsb3dlZCBsZW5ndGhcbiAgICByZTogICAgICAgICAgUmVnRXhwICAgKG9wdGlvbmFsKSAgLy8gUmVndWxhciBleHByZXNzaW9uIGZvciB2YWxpZGF0aW9uXG4gICAgZnVuYzogICAgICAgIEZ1bmN0aW9uIChvcHRpb25hbCkgIC8vIEN1c3RvbSBmdW5jdGlvbiBmb3IgdmFsaWRhdGlvblxuICAgIGVyclN0cjogICAgICBTdHJpbmcgICAob3B0aW9uYWwpICAvLyBFcnJvciBtZXNzYWdlIHRvIGJlIGRpc3BsYXllZCBpbiBjYXNlIHJlIHZhbGlkYXRpb24gZmFpbHNcbiovXG5cblxuLy8gQWxsb3dlZCBpbnB1dCB0eXBlc1xuQVQucHJvdG90eXBlLklOUFVUX1RZUEVTID0gW1xuICBcImNoZWNrYm94XCIsXG4gIFwiZW1haWxcIixcbiAgXCJoaWRkZW5cIixcbiAgXCJwYXNzd29yZFwiLFxuICBcInJhZGlvXCIsXG4gIFwic2VsZWN0XCIsXG4gIFwidGVsXCIsXG4gIFwidGV4dFwiLFxuICBcInVybFwiLFxuXTtcblxuLy8gQ3VycmVudCBjb25maWd1cmF0aW9uIHZhbHVlc1xuQVQucHJvdG90eXBlLm9wdGlvbnMgPSB7XG4gIC8vIEFwcGVhcmFuY2VcbiAgLy9kZWZhdWx0TGF5b3V0OiB1bmRlZmluZWQsXG4gIHNob3dBZGRSZW1vdmVTZXJ2aWNlczogZmFsc2UsXG4gIHNob3dGb3Jnb3RQYXNzd29yZExpbms6IGZhbHNlLFxuICBzaG93UmVzZW5kVmVyaWZpY2F0aW9uRW1haWxMaW5rOiBmYWxzZSxcbiAgc2hvd0xhYmVsczogdHJ1ZSxcbiAgc2hvd1BsYWNlaG9sZGVyczogdHJ1ZSxcblxuICAvLyBCZWhhdmlvdXJcbiAgY29uZmlybVBhc3N3b3JkOiB0cnVlLFxuICBkZWZhdWx0U3RhdGU6IFwic2lnbkluXCIsXG4gIGVuYWJsZVBhc3N3b3JkQ2hhbmdlOiBmYWxzZSxcbiAgZm9jdXNGaXJzdElucHV0OiAhTWV0ZW9yLmlzQ29yZG92YSxcbiAgZm9yYmlkQ2xpZW50QWNjb3VudENyZWF0aW9uOiBmYWxzZSxcbiAgbG93ZXJjYXNlVXNlcm5hbWU6IGZhbHNlLFxuICBvdmVycmlkZUxvZ2luRXJyb3JzOiB0cnVlLFxuICBzZW5kVmVyaWZpY2F0aW9uRW1haWw6IGZhbHNlLFxuICBzb2NpYWxMb2dpblN0eWxlOiBcInBvcHVwXCIsXG5cbiAgLy8gQ2xpZW50LXNpZGUgVmFsaWRhdGlvblxuICAvL2NvbnRpbnVvdXNWYWxpZGF0aW9uOiBmYWxzZSxcbiAgLy9uZWdhdGl2ZUZlZWRiYWNrOiBmYWxzZSxcbiAgLy9uZWdhdGl2ZVZhbGlkYXRpb246IGZhbHNlLFxuICAvL3Bvc2l0aXZlVmFsaWRhdGlvbjogZmFsc2UsXG4gIC8vcG9zaXRpdmVGZWVkYmFjazogZmFsc2UsXG4gIC8vc2hvd1ZhbGlkYXRpbmc6IGZhbHNlLFxuXG4gIC8vIFByaXZhY3kgUG9saWN5IGFuZCBUZXJtcyBvZiBVc2VcbiAgcHJpdmFjeVVybDogdW5kZWZpbmVkLFxuICB0ZXJtc1VybDogdW5kZWZpbmVkLFxuXG4gIC8vIEhvb2tzXG4gIG9uU3VibWl0SG9vazogdW5kZWZpbmVkLFxufTtcblxuQVQucHJvdG90eXBlLnRleHRzID0ge1xuICBidXR0b246IHtcbiAgICBjaGFuZ2VQd2Q6IFwidXBkYXRlWW91clBhc3N3b3JkXCIsXG4gICAgLy9lbnJvbGxBY2NvdW50OiBcImNyZWF0ZUFjY291bnRcIixcbiAgICBlbnJvbGxBY2NvdW50OiBcInNpZ25VcFwiLFxuICAgIGZvcmdvdFB3ZDogXCJlbWFpbFJlc2V0TGlua1wiLFxuICAgIHJlc2V0UHdkOiBcInNldFBhc3N3b3JkXCIsXG4gICAgc2lnbkluOiBcInNpZ25JblwiLFxuICAgIHNpZ25VcDogXCJzaWduVXBcIixcbiAgICByZXNlbmRWZXJpZmljYXRpb25FbWFpbDogXCJTZW5kIGVtYWlsIGFnYWluXCIsXG4gIH0sXG4gIGVycm9yczoge1xuICAgIGFjY291bnRzQ3JlYXRpb25EaXNhYmxlZDogXCJDbGllbnQgc2lkZSBhY2NvdW50cyBjcmVhdGlvbiBpcyBkaXNhYmxlZCEhIVwiLFxuICAgIGNhbm5vdFJlbW92ZVNlcnZpY2U6IFwiQ2Fubm90IHJlbW92ZSB0aGUgb25seSBhY3RpdmUgc2VydmljZSFcIixcbiAgICBjYXB0Y2hhVmVyaWZpY2F0aW9uOiBcIkNhcHRjaGEgdmVyaWZpY2F0aW9uIGZhaWxlZCFcIixcbiAgICBsb2dpbkZvcmJpZGRlbjogXCJlcnJvci5hY2NvdW50cy5Mb2dpbiBmb3JiaWRkZW5cIixcbiAgICBtdXN0QmVMb2dnZWRJbjogXCJlcnJvci5hY2NvdW50cy5NdXN0IGJlIGxvZ2dlZCBpblwiLFxuICAgIHB3ZE1pc21hdGNoOiBcImVycm9yLnB3ZHNEb250TWF0Y2hcIixcbiAgICB2YWxpZGF0aW9uRXJyb3JzOiBcIlZhbGlkYXRpb24gRXJyb3JzXCIsXG4gICAgdmVyaWZ5RW1haWxGaXJzdDogXCJQbGVhc2UgdmVyaWZ5IHlvdXIgZW1haWwgZmlyc3QuIENoZWNrIHRoZSBlbWFpbCBhbmQgZm9sbG93IHRoZSBsaW5rIVwiLFxuICB9LFxuICBuYXZTaWduSW46ICdzaWduSW4nLFxuICBuYXZTaWduT3V0OiAnc2lnbk91dCcsXG4gIGluZm86IHtcbiAgICBlbWFpbFNlbnQ6IFwiaW5mby5lbWFpbFNlbnRcIixcbiAgICBlbWFpbFZlcmlmaWVkOiBcImluZm8uZW1haWxWZXJpZmllZFwiLFxuICAgIHB3ZENoYW5nZWQ6IFwiaW5mby5wYXNzd29yZENoYW5nZWRcIixcbiAgICBwd2RSZXNldDogXCJpbmZvLnBhc3N3b3JkUmVzZXRcIixcbiAgICBwd2RTZXQ6IFwiUGFzc3dvcmQgU2V0XCIsXG4gICAgc2lnblVwVmVyaWZ5RW1haWw6IFwiU3VjY2Vzc2Z1bCBSZWdpc3RyYXRpb24hIFBsZWFzZSBjaGVjayB5b3VyIGVtYWlsIGFuZCBmb2xsb3cgdGhlIGluc3RydWN0aW9ucy5cIixcbiAgICB2ZXJpZmljYXRpb25FbWFpbFNlbnQ6IFwiQSBuZXcgZW1haWwgaGFzIGJlZW4gc2VudCB0byB5b3UuIElmIHRoZSBlbWFpbCBkb2Vzbid0IHNob3cgdXAgaW4geW91ciBpbmJveCwgYmUgc3VyZSB0byBjaGVjayB5b3VyIHNwYW0gZm9sZGVyLlwiLFxuICB9LFxuICBpbnB1dEljb25zOiB7XG4gICAgaXNWYWxpZGF0aW5nOiBcImZhIGZhLXNwaW5uZXIgZmEtc3BpblwiLFxuICAgIGhhc1N1Y2Nlc3M6IFwiZmEgZmEtY2hlY2tcIixcbiAgICBoYXNFcnJvcjogXCJmYSBmYS10aW1lc1wiLFxuICB9LFxuICBtYXhBbGxvd2VkTGVuZ3RoOiBcIk1heGltdW0gYWxsb3dlZCBsZW5ndGhcIixcbiAgbWluUmVxdWlyZWRMZW5ndGg6IFwiTWluaW11bSByZXF1aXJlZCBsZW5ndGhcIixcbiAgb3B0aW9uYWxGaWVsZDogXCJvcHRpb25hbFwiLFxuICBwd2RMaW5rX3ByZTogXCJcIixcbiAgcHdkTGlua19saW5rOiBcImZvcmdvdFBhc3N3b3JkXCIsXG4gIHB3ZExpbmtfc3VmZjogXCJcIixcbiAgcmVxdWlyZWRGaWVsZDogXCJSZXF1aXJlZCBGaWVsZFwiLFxuICByZXNlbmRWZXJpZmljYXRpb25FbWFpbExpbmtfcHJlOiBcIlZlcmlmaWNhdGlvbiBlbWFpbCBsb3N0P1wiLFxuICByZXNlbmRWZXJpZmljYXRpb25FbWFpbExpbmtfbGluazogXCJTZW5kIGFnYWluXCIsXG4gIHJlc2VuZFZlcmlmaWNhdGlvbkVtYWlsTGlua19zdWZmOiBcIlwiLFxuICBzZXA6IFwiT1JcIixcbiAgc2lnbkluTGlua19wcmU6IFwiaWZZb3VBbHJlYWR5SGF2ZUFuQWNjb3VudFwiLFxuICBzaWduSW5MaW5rX2xpbms6IFwic2lnbmluXCIsXG4gIHNpZ25Jbkxpbmtfc3VmZjogXCJcIixcbiAgc2lnblVwTGlua19wcmU6IFwiZG9udEhhdmVBbkFjY291bnRcIixcbiAgc2lnblVwTGlua19saW5rOiBcInNpZ25VcFwiLFxuICBzaWduVXBMaW5rX3N1ZmY6IFwiXCIsXG4gIHNvY2lhbEFkZDogXCJhZGRcIixcbiAgc29jaWFsQ29uZmlndXJlOiBcImNvbmZpZ3VyZVwiLFxuICBzb2NpYWxJY29uczoge1xuICAgICAgXCJtZXRlb3ItZGV2ZWxvcGVyXCI6IFwiZmEgZmEtcm9ja2V0XCJcbiAgfSxcbiAgc29jaWFsUmVtb3ZlOiBcInJlbW92ZVwiLFxuICBzb2NpYWxTaWduSW46IFwic2lnbkluXCIsXG4gIHNvY2lhbFNpZ25VcDogXCJzaWduVXBcIixcbiAgc29jaWFsV2l0aDogXCJ3aXRoXCIsXG4gIHRlcm1zUHJlYW1ibGU6IFwiY2xpY2tBZ3JlZVwiLFxuICB0ZXJtc1ByaXZhY3k6IFwicHJpdmFjeVBvbGljeVwiLFxuICB0ZXJtc0FuZDogXCJhbmRcIixcbiAgdGVybXNUZXJtczogXCJ0ZXJtc1wiLFxuICB0aXRsZToge1xuICAgIGNoYW5nZVB3ZDogXCJjaGFuZ2VQYXNzd29yZFwiLFxuICAgIGVucm9sbEFjY291bnQ6IFwiY3JlYXRlQWNjb3VudFwiLFxuICAgIGZvcmdvdFB3ZDogXCJyZXNldFlvdXJQYXNzd29yZFwiLFxuICAgIHJlc2V0UHdkOiBcInJlc2V0WW91clBhc3N3b3JkXCIsXG4gICAgc2lnbkluOiBcInNpZ25JblwiLFxuICAgIHNpZ25VcDogXCJjcmVhdGVBY2NvdW50XCIsXG4gICAgdmVyaWZ5RW1haWw6IFwiXCIsXG4gICAgcmVzZW5kVmVyaWZpY2F0aW9uRW1haWw6IFwiU2VuZCB0aGUgdmVyaWZpY2F0aW9uIGVtYWlsIGFnYWluXCIsXG4gIH0sXG59O1xuXG5BVC5wcm90b3R5cGUuU1BFQ0lBTF9GSUVMRFMgPSBbXG4gIFwicGFzc3dvcmRfYWdhaW5cIixcbiAgXCJ1c2VybmFtZV9hbmRfZW1haWxcIixcbl07XG5cbi8vIFNpZ25JbiAvIFNpZ25VcCBmaWVsZHNcbkFULnByb3RvdHlwZS5fZmllbGRzID0gW1xuICBuZXcgRmllbGQoe1xuICAgIF9pZDogXCJlbWFpbFwiLFxuICAgIHR5cGU6IFwiZW1haWxcIixcbiAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICBsb3dlcmNhc2U6IHRydWUsXG4gICAgdHJpbTogdHJ1ZSxcbiAgICBmdW5jOiBmdW5jdGlvbihlbWFpbCkge1xuICAgICAgICByZXR1cm4gIV8uY29udGFpbnMoZW1haWwsICdAJyk7XG4gICAgfSxcbiAgICBlcnJTdHI6ICdJbnZhbGlkIGVtYWlsJyxcbiAgfSksXG4gIG5ldyBGaWVsZCh7XG4gICAgX2lkOiBcInBhc3N3b3JkXCIsXG4gICAgdHlwZTogXCJwYXNzd29yZFwiLFxuICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgIG1pbkxlbmd0aDogNixcbiAgICBkaXNwbGF5TmFtZToge1xuICAgICAgICBcImRlZmF1bHRcIjogXCJwYXNzd29yZFwiLFxuICAgICAgICBjaGFuZ2VQd2Q6IFwibmV3UGFzc3dvcmRcIixcbiAgICAgICAgcmVzZXRQd2Q6IFwibmV3UGFzc3dvcmRcIixcbiAgICB9LFxuICAgIHBsYWNlaG9sZGVyOiB7XG4gICAgICAgIFwiZGVmYXVsdFwiOiBcInBhc3N3b3JkXCIsXG4gICAgICAgIGNoYW5nZVB3ZDogXCJuZXdQYXNzd29yZFwiLFxuICAgICAgICByZXNldFB3ZDogXCJuZXdQYXNzd29yZFwiLFxuICAgIH0sXG4gIH0pLFxuXTtcblxuXG5BVC5wcm90b3R5cGUuX2luaXRpYWxpemVkID0gZmFsc2U7XG5cbi8vIElucHV0IHR5cGUgdmFsaWRhdGlvblxuQVQucHJvdG90eXBlLl9pc1ZhbGlkSW5wdXRUeXBlID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gXy5pbmRleE9mKHRoaXMuSU5QVVRfVFlQRVMsIHZhbHVlKSAhPT0gLTE7XG59O1xuXG5BVC5wcm90b3R5cGUuYWRkRmllbGQgPSBmdW5jdGlvbihmaWVsZCkge1xuICAgIC8vIEZpZWxkcyBjYW4gYmUgYWRkZWQgb25seSBiZWZvcmUgaW5pdGlhbGl6YXRpb25cbiAgICBpZiAodGhpcy5faW5pdGlhbGl6ZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkFjY291bnRzVGVtcGxhdGVzLmFkZEZpZWxkIHNob3VsZCBzdHJpY3RseSBiZSBjYWxsZWQgYmVmb3JlIEFjY291bnRzVGVtcGxhdGVzLmluaXQhXCIpO1xuICAgIH1cblxuICAgIGZpZWxkID0gXy5waWNrKGZpZWxkLCBfLmtleXMoRklFTERfUEFUKSk7XG4gICAgY2hlY2soZmllbGQsIEZJRUxEX1BBVCk7XG4gICAgLy8gQ2hlY2tzIHRoZXJlXCJzIGN1cnJlbnRseSBubyBmaWVsZCBjYWxsZWQgZmllbGQuX2lkXG4gICAgaWYgKF8uaW5kZXhPZihfLnBsdWNrKHRoaXMuX2ZpZWxkcywgXCJfaWRcIiksIGZpZWxkLl9pZCkgIT09IC0xKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBIGZpZWxkIGNhbGxlZCBcIiArIGZpZWxkLl9pZCArIFwiIGFscmVhZHkgZXhpc3RzIVwiKTtcbiAgICB9XG4gICAgLy8gVmFsaWRhdGVzIGZpZWxkLnR5cGVcbiAgICBpZiAoIXRoaXMuX2lzVmFsaWRJbnB1dFR5cGUoZmllbGQudHlwZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcImZpZWxkLnR5cGUgaXMgbm90IHZhbGlkIVwiKTtcbiAgICB9XG4gICAgLy8gQ2hlY2tzIGZpZWxkLm1pbkxlbmd0aCBpcyBzdHJpY3RseSBwb3NpdGl2ZVxuICAgIGlmICh0eXBlb2YgZmllbGQubWluTGVuZ3RoICE9PSBcInVuZGVmaW5lZFwiICYmIGZpZWxkLm1pbkxlbmd0aCA8PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJmaWVsZC5taW5MZW5ndGggc2hvdWxkIGJlIGdyZWF0ZXIgdGhhbiB6ZXJvIVwiKTtcbiAgICB9XG4gICAgLy8gQ2hlY2tzIGZpZWxkLm1heExlbmd0aCBpcyBzdHJpY3RseSBwb3NpdGl2ZVxuICAgIGlmICh0eXBlb2YgZmllbGQubWF4TGVuZ3RoICE9PSBcInVuZGVmaW5lZFwiICYmIGZpZWxkLm1heExlbmd0aCA8PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJmaWVsZC5tYXhMZW5ndGggc2hvdWxkIGJlIGdyZWF0ZXIgdGhhbiB6ZXJvIVwiKTtcbiAgICB9XG4gICAgLy8gQ2hlY2tzIGZpZWxkLm1heExlbmd0aCBpcyBncmVhdGVyIHRoYW4gZmllbGQubWluTGVuZ3RoXG4gICAgaWYgKHR5cGVvZiBmaWVsZC5taW5MZW5ndGggIT09IFwidW5kZWZpbmVkXCIgJiYgdHlwZW9mIGZpZWxkLm1pbkxlbmd0aCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBmaWVsZC5tYXhMZW5ndGggPCBmaWVsZC5taW5MZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcImZpZWxkLm1heExlbmd0aCBzaG91bGQgYmUgZ3JlYXRlciB0aGFuIGZpZWxkLm1heExlbmd0aCFcIik7XG4gICAgfVxuXG4gICAgaWYgKCEoTWV0ZW9yLmlzU2VydmVyICYmIF8uY29udGFpbnModGhpcy5TUEVDSUFMX0ZJRUxEUywgZmllbGQuX2lkKSkpIHtcbiAgICAgIHRoaXMuX2ZpZWxkcy5wdXNoKG5ldyBGaWVsZChmaWVsZCkpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9maWVsZHM7XG59O1xuXG5BVC5wcm90b3R5cGUuYWRkRmllbGRzID0gZnVuY3Rpb24oZmllbGRzKSB7XG4gIHZhciBvaztcblxuICB0cnkgeyAvLyBkb25cInQgYm90aGVyIHdpdGggYHR5cGVvZmAgLSBqdXN0IGFjY2VzcyBgbGVuZ3RoYCBhbmQgYGNhdGNoYFxuICAgIG9rID0gZmllbGRzLmxlbmd0aCA+IDAgJiYgXCIwXCIgaW4gT2JqZWN0KGZpZWxkcyk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJmaWVsZCBhcmd1bWVudCBzaG91bGQgYmUgYW4gYXJyYXkgb2YgdmFsaWQgZmllbGQgb2JqZWN0cyFcIik7XG4gIH1cbiAgaWYgKG9rKSB7XG4gICAgXy5tYXAoZmllbGRzLCBmdW5jdGlvbihmaWVsZCkge1xuICAgICAgdGhpcy5hZGRGaWVsZChmaWVsZCk7XG4gICAgfSwgdGhpcyk7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiZmllbGQgYXJndW1lbnQgc2hvdWxkIGJlIGFuIGFycmF5IG9mIHZhbGlkIGZpZWxkIG9iamVjdHMhXCIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXMuX2ZpZWxkcztcbn07XG5cbkFULnByb3RvdHlwZS5jb25maWd1cmUgPSBmdW5jdGlvbihjb25maWcpIHtcbiAgLy8gQ29uZmlndXJhdGlvbiBvcHRpb25zIGNhbiBiZSBzZXQgb25seSBiZWZvcmUgaW5pdGlhbGl6YXRpb25cbiAgaWYgKHRoaXMuX2luaXRpYWxpemVkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQ29uZmlndXJhdGlvbiBvcHRpb25zIG11c3QgYmUgc2V0IGJlZm9yZSBBY2NvdW50c1RlbXBsYXRlcy5pbml0IVwiKTtcbiAgfVxuXG4gIC8vIFVwZGF0ZXMgdGhlIGN1cnJlbnQgY29uZmlndXJhdGlvblxuICBjaGVjayhjb25maWcsIENPTkZJR19QQVQpO1xuICB2YXIgb3B0aW9ucyA9IF8ub21pdChjb25maWcsIFwidGV4dHNcIiwgXCJyZUNhcHRjaGFcIik7XG4gIHRoaXMub3B0aW9ucyA9IF8uZGVmYXVsdHMob3B0aW9ucywgdGhpcy5vcHRpb25zKTtcblxuICAvLyBQb3NzaWJseSBzZXRzIHVwIHJlQ2FwdGNoYSBvcHRpb25zXG4gIHZhciByZUNhcHRjaGEgPSBjb25maWcucmVDYXB0Y2hhO1xuICBpZiAocmVDYXB0Y2hhKSB7XG4gICAgLy8gVXBkYXRlcyB0aGUgY3VycmVudCBidXR0b24gb2JqZWN0XG4gICAgdGhpcy5vcHRpb25zLnJlQ2FwdGNoYSA9IF8uZGVmYXVsdHMocmVDYXB0Y2hhLCB0aGlzLm9wdGlvbnMucmVDYXB0Y2hhIHx8IHt9KTtcbiAgfVxuXG4gIC8vIFBvc3NpYmx5IHNldHMgdXAgdGV4dHMuLi5cbiAgaWYgKGNvbmZpZy50ZXh0cykge1xuICAgIHZhciB0ZXh0cyA9IGNvbmZpZy50ZXh0cztcbiAgICB2YXIgc2ltcGxlVGV4dHMgPSBfLm9taXQodGV4dHMsIFwiYnV0dG9uXCIsIFwiZXJyb3JzXCIsIFwiaW5mb1wiLCBcImlucHV0SWNvbnNcIiwgXCJzb2NpYWxJY29uc1wiLCBcInRpdGxlXCIpO1xuXG4gICAgdGhpcy50ZXh0cyA9IF8uZGVmYXVsdHMoc2ltcGxlVGV4dHMsIHRoaXMudGV4dHMpO1xuXG4gICAgaWYgKHRleHRzLmJ1dHRvbikge1xuICAgICAgLy8gVXBkYXRlcyB0aGUgY3VycmVudCBidXR0b24gb2JqZWN0XG4gICAgICB0aGlzLnRleHRzLmJ1dHRvbiA9IF8uZGVmYXVsdHModGV4dHMuYnV0dG9uLCB0aGlzLnRleHRzLmJ1dHRvbik7XG4gICAgfVxuXG4gICAgaWYgKHRleHRzLmVycm9ycykge1xuICAgICAgLy8gVXBkYXRlcyB0aGUgY3VycmVudCBlcnJvcnMgb2JqZWN0XG4gICAgICB0aGlzLnRleHRzLmVycm9ycyA9IF8uZGVmYXVsdHModGV4dHMuZXJyb3JzLCB0aGlzLnRleHRzLmVycm9ycyk7XG4gICAgfVxuXG4gICAgaWYgKHRleHRzLmluZm8pIHtcbiAgICAgIC8vIFVwZGF0ZXMgdGhlIGN1cnJlbnQgaW5mbyBvYmplY3RcbiAgICAgIHRoaXMudGV4dHMuaW5mbyA9IF8uZGVmYXVsdHModGV4dHMuaW5mbywgdGhpcy50ZXh0cy5pbmZvKTtcbiAgICB9XG5cbiAgICBpZiAodGV4dHMuaW5wdXRJY29ucykge1xuICAgICAgLy8gVXBkYXRlcyB0aGUgY3VycmVudCBpbnB1dEljb25zIG9iamVjdFxuICAgICAgdGhpcy50ZXh0cy5pbnB1dEljb25zID0gXy5kZWZhdWx0cyh0ZXh0cy5pbnB1dEljb25zLCB0aGlzLnRleHRzLmlucHV0SWNvbnMpO1xuICAgIH1cblxuICAgIGlmICh0ZXh0cy5zb2NpYWxJY29ucykge1xuICAgICAgLy8gVXBkYXRlcyB0aGUgY3VycmVudCBzb2NpYWxJY29ucyBvYmplY3RcbiAgICAgIHRoaXMudGV4dHMuc29jaWFsSWNvbnMgPSBfLmRlZmF1bHRzKHRleHRzLnNvY2lhbEljb25zLCB0aGlzLnRleHRzLnNvY2lhbEljb25zKTtcbiAgICB9XG5cbiAgICBpZiAodGV4dHMudGl0bGUpIHtcbiAgICAgIC8vIFVwZGF0ZXMgdGhlIGN1cnJlbnQgdGl0bGUgb2JqZWN0XG4gICAgICB0aGlzLnRleHRzLnRpdGxlID0gXy5kZWZhdWx0cyh0ZXh0cy50aXRsZSwgdGhpcy50ZXh0cy50aXRsZSk7XG4gICAgfVxuICB9XG59O1xuXG5cbkFULnByb3RvdHlwZS5jb25maWd1cmVSb3V0ZSA9IGZ1bmN0aW9uKHJvdXRlLCBvcHRpb25zKSB7XG4gIGNvbnNvbGUud2FybignWW91IG5vdyBuZWVkIGEgcm91dGluZyBwYWNrYWdlIGxpa2UgdXNlcmFjY291bnRzOmlyb24tcm91dGluZyBvciB1c2VyYWNjb3VudHM6Zmxvdy1yb3V0aW5nIHRvIGJlIGFibGUgdG8gY29uZmlndXJlIHJvdXRlcyEnKTtcbn07XG5cblxuQVQucHJvdG90eXBlLmhhc0ZpZWxkID0gZnVuY3Rpb24oZmllbGRJZCkge1xuICByZXR1cm4gISF0aGlzLmdldEZpZWxkKGZpZWxkSWQpO1xufTtcblxuQVQucHJvdG90eXBlLmdldEZpZWxkID0gZnVuY3Rpb24oZmllbGRJZCkge1xuICB2YXIgZmllbGQgPSBfLmZpbHRlcih0aGlzLl9maWVsZHMsIGZ1bmN0aW9uKGZpZWxkKSB7XG4gICAgcmV0dXJuIGZpZWxkLl9pZCA9PT0gZmllbGRJZDtcbiAgfSk7XG5cbiAgcmV0dXJuIChmaWVsZC5sZW5ndGggPT09IDEpID8gZmllbGRbMF0gOiB1bmRlZmluZWQ7XG59O1xuXG5BVC5wcm90b3R5cGUuZ2V0RmllbGRzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX2ZpZWxkcztcbn07XG5cbkFULnByb3RvdHlwZS5nZXRGaWVsZElkcyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBfLnBsdWNrKHRoaXMuX2ZpZWxkcywgXCJfaWRcIik7XG59O1xuXG5BVC5wcm90b3R5cGUuZ2V0Um91dGVQYXRoID0gZnVuY3Rpb24ocm91dGUpIHtcbiAgICByZXR1cm4gXCIjXCI7XG59O1xuXG5BVC5wcm90b3R5cGUub2F1dGhTZXJ2aWNlcyA9IGZ1bmN0aW9uKCkge1xuICAvLyBFeHRyYWN0cyBuYW1lcyBvZiBhdmFpbGFibGUgc2VydmljZXNcbiAgdmFyIG5hbWVzO1xuXG4gIGlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcbiAgICBuYW1lcyA9IChBY2NvdW50cy5vYXV0aCAmJiBBY2NvdW50cy5vYXV0aC5zZXJ2aWNlTmFtZXMoKSkgfHwgW107XG4gIH0gZWxzZSB7XG4gICAgbmFtZXMgPSAoQWNjb3VudHMub2F1dGggJiYgQWNjb3VudHMubG9naW5TZXJ2aWNlc0NvbmZpZ3VyZWQoKSAmJiBBY2NvdW50cy5vYXV0aC5zZXJ2aWNlTmFtZXMoKSkgfHwgW107XG4gIH1cbiAgLy8gRXh0cmFjdHMgbmFtZXMgb2YgY29uZmlndXJlZCBzZXJ2aWNlc1xuICB2YXIgY29uZmlndXJlZFNlcnZpY2VzID0gW107XG5cbiAgaWYgKEFjY291bnRzLmxvZ2luU2VydmljZUNvbmZpZ3VyYXRpb24pIHtcbiAgICBjb25maWd1cmVkU2VydmljZXMgPSBfLnBsdWNrKEFjY291bnRzLmxvZ2luU2VydmljZUNvbmZpZ3VyYXRpb24uZmluZCgpLmZldGNoKCksIFwic2VydmljZVwiKTtcbiAgfVxuXG4gIC8vIEJ1aWxkcyBhIGxpc3Qgb2Ygb2JqZWN0cyBjb250YWluaW5nIHNlcnZpY2UgbmFtZSBhcyBfaWQgYW5kIGl0cyBjb25maWd1cmF0aW9uIHN0YXR1c1xuICB2YXIgc2VydmljZXMgPSBfLm1hcChuYW1lcywgZnVuY3Rpb24obmFtZSkge1xuICAgIHJldHVybiB7XG4gICAgICBfaWQgOiBuYW1lLFxuICAgICAgY29uZmlndXJlZDogXy5jb250YWlucyhjb25maWd1cmVkU2VydmljZXMsIG5hbWUpLFxuICAgIH07XG4gIH0pO1xuXG4gIC8vIENoZWNrcyB3aGV0aGVyIHRoZXJlIGlzIGEgVUkgdG8gY29uZmlndXJlIHNlcnZpY2VzLi4uXG4gIC8vIFhYWDogdGhpcyBvbmx5IHdvcmtzIHdpdGggdGhlIGFjY291bnRzLXVpIHBhY2thZ2VcbiAgdmFyIHNob3dVbmNvbmZpZ3VyZWQgPSB0eXBlb2YgQWNjb3VudHMuX2xvZ2luQnV0dG9uc1Nlc3Npb24gIT09IFwidW5kZWZpbmVkXCI7XG5cbiAgLy8gRmlsdGVycyBvdXQgdW5jb25maWd1cmVkIHNlcnZpY2VzIGluIGNhc2UgdGhleVwicmUgbm90IHRvIGJlIGRpc3BsYXllZFxuICBpZiAoIXNob3dVbmNvbmZpZ3VyZWQpIHtcbiAgICBzZXJ2aWNlcyA9IF8uZmlsdGVyKHNlcnZpY2VzLCBmdW5jdGlvbihzZXJ2aWNlKSB7XG4gICAgICByZXR1cm4gc2VydmljZS5jb25maWd1cmVkO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gU29ydHMgc2VydmljZXMgYnkgbmFtZVxuICBzZXJ2aWNlcyA9IF8uc29ydEJ5KHNlcnZpY2VzLCBmdW5jdGlvbihzZXJ2aWNlKSB7XG4gICAgcmV0dXJuIHNlcnZpY2UuX2lkO1xuICB9KTtcblxuICByZXR1cm4gc2VydmljZXM7XG59O1xuXG5BVC5wcm90b3R5cGUucmVtb3ZlRmllbGQgPSBmdW5jdGlvbihmaWVsZElkKSB7XG4gIC8vIEZpZWxkcyBjYW4gYmUgcmVtb3ZlZCBvbmx5IGJlZm9yZSBpbml0aWFsaXphdGlvblxuICBpZiAodGhpcy5faW5pdGlhbGl6ZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJBY2NvdW50c1RlbXBsYXRlcy5yZW1vdmVGaWVsZCBzaG91bGQgc3RyaWN0bHkgYmUgY2FsbGVkIGJlZm9yZSBBY2NvdW50c1RlbXBsYXRlcy5pbml0IVwiKTtcbiAgfVxuICAvLyBUcmllcyB0byBsb29rIHVwIHRoZSBmaWVsZCB3aXRoIGdpdmVuIF9pZFxuICB2YXIgaW5kZXggPSBfLmluZGV4T2YoXy5wbHVjayh0aGlzLl9maWVsZHMsIFwiX2lkXCIpLCBmaWVsZElkKTtcblxuICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgcmV0dXJuIHRoaXMuX2ZpZWxkcy5zcGxpY2UoaW5kZXgsIDEpWzBdO1xuICB9IGVsc2UgaWYgKCEoTWV0ZW9yLmlzU2VydmVyICYmIF8uY29udGFpbnModGhpcy5TUEVDSUFMX0ZJRUxEUywgZmllbGRJZCkpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQSBmaWVsZCBjYWxsZWQgXCIgKyBmaWVsZElkICsgXCIgZG9lcyBub3QgZXhpc3QhXCIpO1xuICB9XG59O1xuIiwiLyogZ2xvYmFsXG4gIEFUOiBmYWxzZSxcbiAgQWNjb3VudHNUZW1wbGF0ZXM6IGZhbHNlXG4qL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbi8vIEluaXRpYWxpemF0aW9uXG5BVC5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLndhcm4oXCJbQWNjb3VudHNUZW1wbGF0ZXNdIFRoZXJlIGlzIG5vIG1vcmUgbmVlZCB0byBjYWxsIEFjY291bnRzVGVtcGxhdGVzLmluaXQoKSEgU2ltcGx5IHJlbW92ZSB0aGUgY2FsbCA7LSlcIik7XG59O1xuXG5BVC5wcm90b3R5cGUuX2luaXQgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuX2luaXRpYWxpemVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gQ2hlY2tzIHRoZXJlIGlzIGF0IGxlYXN0IG9uZSBhY2NvdW50IHNlcnZpY2UgaW5zdGFsbGVkXG4gIGlmICghUGFja2FnZVtcImFjY291bnRzLXBhc3N3b3JkXCJdICYmICghQWNjb3VudHMub2F1dGggfHwgQWNjb3VudHMub2F1dGguc2VydmljZU5hbWVzKCkubGVuZ3RoID09PSAwKSkge1xuICAgIHRocm93IEVycm9yKFwiQWNjb3VudHNUZW1wbGF0ZXM6IFlvdSBtdXN0IGFkZCBhdCBsZWFzdCBvbmUgYWNjb3VudCBzZXJ2aWNlIVwiKTtcbiAgfVxuXG4gIC8vIEEgcGFzc3dvcmQgZmllbGQgaXMgc3RyaWN0bHkgcmVxdWlyZWRcbiAgdmFyIHBhc3N3b3JkID0gdGhpcy5nZXRGaWVsZChcInBhc3N3b3JkXCIpO1xuICBpZiAoIXBhc3N3b3JkKSB7XG4gICAgdGhyb3cgRXJyb3IoXCJBIHBhc3N3b3JkIGZpZWxkIGlzIHN0cmljdGx5IHJlcXVpcmVkIVwiKTtcbiAgfVxuXG4gIGlmIChwYXNzd29yZC50eXBlICE9PSBcInBhc3N3b3JkXCIpIHtcbiAgICB0aHJvdyBFcnJvcihcIlRoZSB0eXBlIG9mIHBhc3N3b3JkIGZpZWxkIHNob3VsZCBiZSBwYXNzd29yZCFcIik7XG4gIH1cblxuICAvLyBUaGVuIHdlIGNhbiBoYXZlIFwidXNlcm5hbWVcIiBvciBcImVtYWlsXCIgb3IgZXZlbiBib3RoIG9mIHRoZW1cbiAgLy8gYnV0IGF0IGxlYXN0IG9uZSBvZiB0aGUgdHdvIGlzIHN0cmljdGx5IHJlcXVpcmVkXG4gIHZhciB1c2VybmFtZSA9IHRoaXMuZ2V0RmllbGQoXCJ1c2VybmFtZVwiKTtcbiAgdmFyIGVtYWlsID0gdGhpcy5nZXRGaWVsZChcImVtYWlsXCIpO1xuXG4gIGlmICghdXNlcm5hbWUgJiYgIWVtYWlsKSB7XG4gICAgdGhyb3cgRXJyb3IoXCJBdCBsZWFzdCBvbmUgZmllbGQgb3V0IG9mIHVzZXJuYW1lIGFuZCBlbWFpbCBpcyBzdHJpY3RseSByZXF1aXJlZCFcIik7XG4gIH1cblxuICBpZiAodXNlcm5hbWUgJiYgIXVzZXJuYW1lLnJlcXVpcmVkKSB7XG4gICAgdGhyb3cgRXJyb3IoXCJUaGUgdXNlcm5hbWUgZmllbGQgc2hvdWxkIGJlIHJlcXVpcmVkIVwiKTtcbiAgfVxuXG4gIGlmIChlbWFpbCkge1xuICAgIGlmIChlbWFpbC50eXBlICE9PSBcImVtYWlsXCIpIHtcbiAgICAgIHRocm93IEVycm9yKFwiVGhlIHR5cGUgb2YgZW1haWwgZmllbGQgc2hvdWxkIGJlIGVtYWlsIVwiKTtcbiAgICB9XG5cbiAgICBpZiAodXNlcm5hbWUpIHtcbiAgICAgIC8vIHVzZXJuYW1lIGFuZCBlbWFpbFxuICAgICAgaWYgKHVzZXJuYW1lLnR5cGUgIT09IFwidGV4dFwiKSB7XG4gICAgICAgIHRocm93IEVycm9yKFwiVGhlIHR5cGUgb2YgdXNlcm5hbWUgZmllbGQgc2hvdWxkIGJlIHRleHQgd2hlbiBlbWFpbCBmaWVsZCBpcyBwcmVzZW50IVwiKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gZW1haWwgb25seVxuICAgICAgaWYgKCFlbWFpbC5yZXF1aXJlZCkge1xuICAgICAgICB0aHJvdyBFcnJvcihcIlRoZSBlbWFpbCBmaWVsZCBzaG91bGQgYmUgcmVxdWlyZWQgd2hlbiB1c2VybmFtZSBpcyBub3QgcHJlc2VudCFcIik7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIHVzZXJuYW1lIG9ubHlcbiAgICBpZiAodXNlcm5hbWUudHlwZSAhPT0gXCJ0ZXh0XCIgJiYgdXNlcm5hbWUudHlwZSAhPT0gXCJ0ZWxcIikge1xuICAgICAgdGhyb3cgRXJyb3IoXCJUaGUgdHlwZSBvZiB1c2VybmFtZSBmaWVsZCBzaG91bGQgYmUgdGV4dCBvciB0ZWwhXCIpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFBvc3NpYmx5IHB1Ymxpc2ggbW9yZSB1c2VyIGRhdGEgaW4gb3JkZXIgdG8gYmUgYWJsZSB0byBzaG93IGFkZC9yZW1vdmVcbiAgLy8gYnV0dG9ucyBmb3IgM3JkLXBhcnR5IHNlcnZpY2VzXG4gIGlmICh0aGlzLm9wdGlvbnMuc2hvd0FkZFJlbW92ZVNlcnZpY2VzKSB7XG4gICAgLy8gUHVibGlzaCBhZGRpdGlvbmFsIGN1cnJlbnQgdXNlciBpbmZvIHRvIGdldCB0aGUgbGlzdCBvZiByZWdpc3RlcmVkIHNlcnZpY2VzXG4gICAgLy8gWFhYIFRPRE86IHVzZVxuICAgIC8vIEFjY291bnRzLmFkZEF1dG9wdWJsaXNoRmllbGRzKHtcbiAgICAvLyAgIGZvckxvZ2dlZEluVXNlcjogWydzZXJ2aWNlcy5mYWNlYm9vayddLFxuICAgIC8vICAgZm9yT3RoZXJVc2VyczogW10sXG4gICAgLy8gfSlcbiAgICAvLyAuLi5hZGRzIG9ubHkgdXNlci5zZXJ2aWNlcy4qLmlkXG4gICAgTWV0ZW9yLnB1Ymxpc2goXCJ1c2VyUmVnaXN0ZXJlZFNlcnZpY2VzXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHVzZXJJZCA9IHRoaXMudXNlcklkO1xuICAgICAgcmV0dXJuIE1ldGVvci51c2Vycy5maW5kKHVzZXJJZCwge2ZpZWxkczoge3NlcnZpY2VzOiAxfX0pO1xuICAgICAgLypcbiAgICAgIGlmICh1c2VySWQpIHtcbiAgICAgICAgdmFyIHVzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZSh1c2VySWQpO1xuICAgICAgICB2YXIgc2VydmljZXNfaWQgPSBfLmNoYWluKHVzZXIuc2VydmljZXMpXG4gICAgICAgICAgLmtleXMoKVxuICAgICAgICAgIC5yZWplY3QoZnVuY3Rpb24oc2VydmljZSkge3JldHVybiBzZXJ2aWNlID09PSBcInJlc3VtZVwiO30pXG4gICAgICAgICAgLm1hcChmdW5jdGlvbihzZXJ2aWNlKSB7cmV0dXJuIFwic2VydmljZXMuXCIgKyBzZXJ2aWNlICsgXCIuaWRcIjt9KVxuICAgICAgICAgIC52YWx1ZSgpO1xuICAgICAgICB2YXIgcHJvamVjdGlvbiA9IHt9O1xuICAgICAgICBfLmVhY2goc2VydmljZXNfaWQsIGZ1bmN0aW9uKGtleSkge3Byb2plY3Rpb25ba2V5XSA9IDE7fSk7XG4gICAgICAgIHJldHVybiBNZXRlb3IudXNlcnMuZmluZCh1c2VySWQsIHtmaWVsZHM6IHByb2plY3Rpb259KTtcbiAgICAgIH1cbiAgICAgICovXG4gICAgfSk7XG4gIH1cblxuICAvLyBTZWN1cml0eSBzdHVmZlxuICBpZiAodGhpcy5vcHRpb25zLm92ZXJyaWRlTG9naW5FcnJvcnMpIHtcbiAgICBBY2NvdW50cy52YWxpZGF0ZUxvZ2luQXR0ZW1wdChmdW5jdGlvbihhdHRlbXB0KSB7XG4gICAgICBpZiAoYXR0ZW1wdC5lcnJvcikge1xuICAgICAgICB2YXIgcmVhc29uID0gYXR0ZW1wdC5lcnJvci5yZWFzb247XG4gICAgICAgIGlmIChyZWFzb24gPT09IFwiVXNlciBub3QgZm91bmRcIiB8fCByZWFzb24gPT09IFwiSW5jb3JyZWN0IHBhc3N3b3JkXCIpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMywgQWNjb3VudHNUZW1wbGF0ZXMudGV4dHMuZXJyb3JzLmxvZ2luRm9yYmlkZGVuKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGF0dGVtcHQuYWxsb3dlZDtcbiAgICB9KTtcbiAgfVxuXG4gIGlmICh0aGlzLm9wdGlvbnMuc2VuZFZlcmlmaWNhdGlvbkVtYWlsICYmIHRoaXMub3B0aW9ucy5lbmZvcmNlRW1haWxWZXJpZmljYXRpb24pIHtcbiAgICBBY2NvdW50cy52YWxpZGF0ZUxvZ2luQXR0ZW1wdChmdW5jdGlvbihhdHRlbXB0KSB7XG4gICAgICBpZiAoIWF0dGVtcHQuYWxsb3dlZCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmIChhdHRlbXB0LnR5cGUgIT09IFwicGFzc3dvcmRcIiB8fCBhdHRlbXB0Lm1ldGhvZE5hbWUgIT09IFwibG9naW5cIikge1xuICAgICAgICByZXR1cm4gYXR0ZW1wdC5hbGxvd2VkO1xuICAgICAgfVxuXG4gICAgICB2YXIgdXNlciA9IGF0dGVtcHQudXNlcjtcbiAgICAgIGlmICghdXNlcikge1xuICAgICAgICByZXR1cm4gYXR0ZW1wdC5hbGxvd2VkO1xuICAgICAgfVxuXG4gICAgICB2YXIgb2sgPSB0cnVlO1xuICAgICAgdmFyIGxvZ2luRW1haWwgPSBhdHRlbXB0Lm1ldGhvZEFyZ3VtZW50c1swXS51c2VyLmVtYWlsO1xuICAgICAgaWYgKGxvZ2luRW1haWwpIHtcbiAgICAgICAgdmFyIGVtYWlsID0gXy5maWx0ZXIodXNlci5lbWFpbHMsIGZ1bmN0aW9uKG9iaikge1xuICAgICAgICAgIHJldHVybiBvYmouYWRkcmVzcy50b0xvd2VyQ2FzZSgpID09PSBsb2dpbkVtYWlsLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoIWVtYWlsLmxlbmd0aCB8fCAhZW1haWxbMF0udmVyaWZpZWQpIHtcbiAgICAgICAgICBvayA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyB3ZSBnb3QgdGhlIHVzZXJuYW1lLCBsZXRzIGNoZWNrIHRoZXJlJ3MgYXQgbGVhc2Ugb25lIHZlcmlmaWVkIGVtYWlsXG4gICAgICAgIHZhciBlbWFpbFZlcmlmaWVkID0gXy5jaGFpbih1c2VyLmVtYWlscylcbiAgICAgICAgLnBsdWNrKCd2ZXJpZmllZCcpXG4gICAgICAgIC5hbnkoKVxuICAgICAgICAudmFsdWUoKTtcblxuICAgICAgICBpZiAoIWVtYWlsVmVyaWZpZWQpIHtcbiAgICAgICAgICBvayA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoIW9rKSB7XG4gICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAxLCBBY2NvdW50c1RlbXBsYXRlcy50ZXh0cy5lcnJvcnMudmVyaWZ5RW1haWxGaXJzdCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhdHRlbXB0LmFsbG93ZWQ7XG4gICAgfSk7XG4gIH1cblxuICAvL0NoZWNrIHRoYXQgcmVDYXB0Y2hhIHNlY3JldCBrZXlzIGFyZSBhdmFpbGFibGVcbiAgaWYgKHRoaXMub3B0aW9ucy5zaG93UmVDYXB0Y2hhKSB7XG4gICAgdmFyIGF0U2VjcmV0S2V5ID0gQWNjb3VudHNUZW1wbGF0ZXMub3B0aW9ucy5yZUNhcHRjaGEgJiYgQWNjb3VudHNUZW1wbGF0ZXMub3B0aW9ucy5yZUNhcHRjaGEuc2VjcmV0S2V5O1xuICAgIHZhciBzZXR0aW5nc1NlY3JldEtleSA9IE1ldGVvci5zZXR0aW5ncy5yZUNhcHRjaGEgJiYgTWV0ZW9yLnNldHRpbmdzLnJlQ2FwdGNoYS5zZWNyZXRLZXk7XG5cbiAgICBpZiAoIWF0U2VjcmV0S2V5ICYmICFzZXR0aW5nc1NlY3JldEtleSkge1xuICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDEsIFwiVXNlciBBY2NvdW50czogcmVDYXB0Y2hhIHNlY3JldCBrZXkgbm90IGZvdW5kISBQbGVhc2UgcHJvdmlkZSBpdCBvciBzZXQgc2hvd1JlQ2FwdGNoYSB0byBmYWxzZS5cIiApO1xuICAgIH1cbiAgfVxuXG4gIC8vIE1hcmtzIEFjY291bnRzVGVtcGxhdGVzIGFzIGluaXRpYWxpemVkXG4gIHRoaXMuX2luaXRpYWxpemVkID0gdHJ1ZTtcbn07XG5cbkFjY291bnRzVGVtcGxhdGVzID0gbmV3IEFUKCk7XG5cbi8vIENsaWVudCBzaWRlIGFjY291bnQgY3JlYXRpb24gaXMgZGlzYWJsZWQgYnkgZGVmYXVsdDpcbi8vIHRoZSBtZXRob3MgQVRDcmVhdGVVc2VyU2VydmVyIGlzIHVzZWQgaW5zdGVhZCFcbi8vIHRvIGFjdHVhbGx5IGRpc2FibGUgY2xpZW50IHNpZGUgYWNjb3VudCBjcmVhdGlvbiB1c2U6XG4vL1xuLy8gICAgQWNjb3VudHNUZW1wbGF0ZXMuY29uZmlnKHtcbi8vICAgICAgICBmb3JiaWRDbGllbnRBY2NvdW50Q3JlYXRpb246IHRydWVcbi8vICAgIH0pO1xuXG5BY2NvdW50cy5jb25maWcoe1xuICBmb3JiaWRDbGllbnRBY2NvdW50Q3JlYXRpb246IHRydWVcbn0pO1xuXG4vLyBJbml0aWFsaXphdGlvblxuTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG4gIEFjY291bnRzVGVtcGxhdGVzLl9pbml0KCk7XG59KTtcbiIsIi8qIGdsb2JhbFxuICBBY2NvdW50c1RlbXBsYXRlczogZmFsc2VcbiovXG5cInVzZSBzdHJpY3RcIjtcblxuTWV0ZW9yLm1ldGhvZHMoe1xuICBBVFJlbW92ZVNlcnZpY2U6IGZ1bmN0aW9uKHNlcnZpY2VOYW1lKSB7XG4gICAgY2hlY2soc2VydmljZU5hbWUsIFN0cmluZyk7XG5cbiAgICB2YXIgdXNlcklkID0gdGhpcy51c2VySWQ7XG5cbiAgICBpZiAodXNlcklkKSB7XG4gICAgICB2YXIgdXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKHVzZXJJZCk7XG4gICAgICB2YXIgbnVtU2VydmljZXMgPSBfLmtleXModXNlci5zZXJ2aWNlcykubGVuZ3RoOyAvLyBpbmNsdWRpbmcgXCJyZXN1bWVcIlxuICAgICAgdmFyIHVuc2V0ID0ge307XG5cbiAgICAgIGlmIChudW1TZXJ2aWNlcyA9PT0gMikge1xuICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMywgQWNjb3VudHNUZW1wbGF0ZXMudGV4dHMuZXJyb3JzLmNhbm5vdFJlbW92ZVNlcnZpY2UsIHt9KTtcbiAgICAgIH1cblxuICAgICAgdW5zZXRbXCJzZXJ2aWNlcy5cIiArIHNlcnZpY2VOYW1lXSA9IFwiXCI7XG4gICAgICBNZXRlb3IudXNlcnMudXBkYXRlKHVzZXJJZCwgeyR1bnNldDogdW5zZXR9KTtcbiAgICB9XG4gIH0sXG59KTtcbiIsIi8qIGdsb2JhbFxuICBBY2NvdW50c1RlbXBsYXRlc1xuKi9cblwidXNlIHN0cmljdFwiO1xuXG5NZXRlb3IubWV0aG9kcyh7XG4gIEFUQ3JlYXRlVXNlclNlcnZlcjogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIGlmIChBY2NvdW50c1RlbXBsYXRlcy5vcHRpb25zLmZvcmJpZENsaWVudEFjY291bnRDcmVhdGlvbikge1xuICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIEFjY291bnRzVGVtcGxhdGVzLnRleHRzLmVycm9ycy5hY2NvdW50c0NyZWF0aW9uRGlzYWJsZWQpO1xuICAgIH1cblxuICAgIC8vIGNyZWF0ZVVzZXIoKSBkb2VzIG1vcmUgY2hlY2tpbmcuXG4gICAgY2hlY2sob3B0aW9ucywgT2JqZWN0KTtcbiAgICB2YXIgYWxsRmllbGRJZHMgPSBBY2NvdW50c1RlbXBsYXRlcy5nZXRGaWVsZElkcygpO1xuXG4gICAgLy8gUGlja3MtdXAgd2hpdGVsaXN0ZWQgZmllbGRzIGZvciBwcm9maWxlXG4gICAgdmFyIHByb2ZpbGUgPSBvcHRpb25zLnByb2ZpbGU7XG4gICAgcHJvZmlsZSA9IF8ucGljayhwcm9maWxlLCBhbGxGaWVsZElkcyk7XG4gICAgcHJvZmlsZSA9IF8ub21pdChwcm9maWxlLCBcInVzZXJuYW1lXCIsIFwiZW1haWxcIiwgXCJwYXNzd29yZFwiKTtcblxuICAgIC8vIFZhbGlkYXRlcyBmaWVsZHNcIiB2YWx1ZVxuICAgIHZhciBzaWdudXBJbmZvID0gXy5jbG9uZShwcm9maWxlKTtcbiAgICBpZiAob3B0aW9ucy51c2VybmFtZSkge1xuICAgICAgc2lnbnVwSW5mby51c2VybmFtZSA9IG9wdGlvbnMudXNlcm5hbWU7XG5cbiAgICAgIGlmIChBY2NvdW50c1RlbXBsYXRlcy5vcHRpb25zLmxvd2VyY2FzZVVzZXJuYW1lKSB7XG4gICAgICAgIHNpZ251cEluZm8udXNlcm5hbWUgPSBzaWdudXBJbmZvLnVzZXJuYW1lLnRyaW0oKS5yZXBsYWNlKC9cXHMrL2dtLCAnICcpO1xuICAgICAgICBvcHRpb25zLnByb2ZpbGUubmFtZSA9IHNpZ251cEluZm8udXNlcm5hbWU7XG4gICAgICAgIHNpZ251cEluZm8udXNlcm5hbWUgPSBzaWdudXBJbmZvLnVzZXJuYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nbSwgJycpO1xuICAgICAgICBvcHRpb25zLnVzZXJuYW1lID0gc2lnbnVwSW5mby51c2VybmFtZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5lbWFpbCkge1xuICAgICAgc2lnbnVwSW5mby5lbWFpbCA9IG9wdGlvbnMuZW1haWw7XG5cbiAgICAgIGlmIChBY2NvdW50c1RlbXBsYXRlcy5vcHRpb25zLmxvd2VyY2FzZVVzZXJuYW1lKSB7XG4gICAgICAgIHNpZ251cEluZm8uZW1haWwgPSBzaWdudXBJbmZvLmVtYWlsLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nbSwgJycpO1xuICAgICAgICBvcHRpb25zLmVtYWlsID0gc2lnbnVwSW5mby5lbWFpbDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5wYXNzd29yZCkge1xuICAgICAgc2lnbnVwSW5mby5wYXNzd29yZCA9IG9wdGlvbnMucGFzc3dvcmQ7XG4gICAgfVxuXG4gICAgdmFyIHZhbGlkYXRpb25FcnJvcnMgPSB7fTtcbiAgICB2YXIgc29tZUVycm9yID0gZmFsc2U7XG5cbiAgICAvLyBWYWxpZGF0ZXMgZmllbGRzIHZhbHVlc1xuICAgIF8uZWFjaChBY2NvdW50c1RlbXBsYXRlcy5nZXRGaWVsZHMoKSwgZnVuY3Rpb24oZmllbGQpIHtcbiAgICAgIHZhciBmaWVsZElkID0gZmllbGQuX2lkO1xuICAgICAgdmFyIHZhbHVlID0gc2lnbnVwSW5mb1tmaWVsZElkXTtcblxuICAgICAgaWYgKGZpZWxkSWQgPT09IFwicGFzc3dvcmRcIikge1xuICAgICAgICAvLyBDYW5cInQgUGljay11cCBwYXNzd29yZCBoZXJlXG4gICAgICAgIC8vIE5PVEU6IGF0IHRoaXMgc3RhZ2UgdGhlIHBhc3N3b3JkIGlzIGFscmVhZHkgZW5jcmlwdGVkLFxuICAgICAgICAvLyAgICAgICBzbyB0aGVyZSBpcyBubyB3YXkgdG8gdmFsaWRhdGUgaXQhISFcbiAgICAgICAgY2hlY2sodmFsdWUsIE9iamVjdCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdmFyIHZhbGlkYXRpb25FcnIgPSBmaWVsZC52YWxpZGF0ZSh2YWx1ZSwgXCJzdHJpY3RcIik7XG4gICAgICBpZiAodmFsaWRhdGlvbkVycikge1xuICAgICAgICB2YWxpZGF0aW9uRXJyb3JzW2ZpZWxkSWRdID0gdmFsaWRhdGlvbkVycjtcbiAgICAgICAgc29tZUVycm9yID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmIChBY2NvdW50c1RlbXBsYXRlcy5vcHRpb25zLnNob3dSZUNhcHRjaGEpIHtcbiAgICAgIHZhciBzZWNyZXRLZXkgPSBudWxsO1xuXG4gICAgICBpZiAoQWNjb3VudHNUZW1wbGF0ZXMub3B0aW9ucy5yZUNhcHRjaGEgJiYgQWNjb3VudHNUZW1wbGF0ZXMub3B0aW9ucy5yZUNhcHRjaGEuc2VjcmV0S2V5KSB7XG4gICAgICAgIHNlY3JldEtleSA9IEFjY291bnRzVGVtcGxhdGVzLm9wdGlvbnMucmVDYXB0Y2hhLnNlY3JldEtleTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNlY3JldEtleSA9IE1ldGVvci5zZXR0aW5ncy5yZUNhcHRjaGEuc2VjcmV0S2V5O1xuICAgICAgfVxuXG4gICAgICB2YXIgYXBpUmVzcG9uc2UgPSBIVFRQLnBvc3QoXCJodHRwczovL3d3dy5nb29nbGUuY29tL3JlY2FwdGNoYS9hcGkvc2l0ZXZlcmlmeVwiLCB7XG4gICAgICAgIHBhcmFtczoge1xuICAgICAgICAgIHNlY3JldDogc2VjcmV0S2V5LFxuICAgICAgICAgIHJlc3BvbnNlOiBvcHRpb25zLnByb2ZpbGUucmVDYXB0Y2hhUmVzcG9uc2UsXG4gICAgICAgICAgcmVtb3RlaXA6IHRoaXMuY29ubmVjdGlvbi5jbGllbnRBZGRyZXNzLFxuICAgICAgICB9XG4gICAgICB9KS5kYXRhO1xuXG4gICAgICBpZiAoIWFwaVJlc3BvbnNlLnN1Y2Nlc3MpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIEFjY291bnRzVGVtcGxhdGVzLnRleHRzLmVycm9ycy5jYXB0Y2hhVmVyaWZpY2F0aW9uLFxuICAgICAgICAgIGFwaVJlc3BvbnNlWydlcnJvci1jb2RlcyddID8gYXBpUmVzcG9uc2VbJ2Vycm9yLWNvZGVzJ10uam9pbihcIiwgXCIpIDogXCJVbmtub3duIEVycm9yLlwiKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoc29tZUVycm9yKSB7XG4gICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMywgQWNjb3VudHNUZW1wbGF0ZXMudGV4dHMuZXJyb3JzLnZhbGlkYXRpb25FcnJvcnMsIHZhbGlkYXRpb25FcnJvcnMpO1xuICAgIH1cblxuICAgIC8vIFBvc3NpYmx5IHJlbW92ZXMgdGhlIHByb2ZpbGUgZmllbGRcbiAgICBpZiAoXy5pc0VtcHR5KG9wdGlvbnMucHJvZmlsZSkpIHtcbiAgICAgIGRlbGV0ZSBvcHRpb25zLnByb2ZpbGU7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIHVzZXIuIHJlc3VsdCBjb250YWlucyBpZCBhbmQgdG9rZW4uXG4gICAgdmFyIHVzZXJJZCA9IEFjY291bnRzLmNyZWF0ZVVzZXIob3B0aW9ucyk7XG4gICAgLy8gc2FmZXR5IGJlbHQuIGNyZWF0ZVVzZXIgaXMgc3VwcG9zZWQgdG8gdGhyb3cgb24gZXJyb3IuIHNlbmQgNTAwIGVycm9yXG4gICAgLy8gaW5zdGVhZCBvZiBzZW5kaW5nIGEgdmVyaWZpY2F0aW9uIGVtYWlsIHdpdGggZW1wdHkgdXNlcmlkLlxuICAgIGlmICghIHVzZXJJZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY3JlYXRlVXNlciBmYWlsZWQgdG8gaW5zZXJ0IG5ldyB1c2VyXCIpO1xuICAgIH1cblxuICAgIC8vIENhbGwgcG9zdFNpZ25VcEhvb2ssIGlmIGFueS4uLlxuICAgIHZhciBwb3N0U2lnblVwSG9vayA9IEFjY291bnRzVGVtcGxhdGVzLm9wdGlvbnMucG9zdFNpZ25VcEhvb2s7XG4gICAgaWYgKHBvc3RTaWduVXBIb29rKSB7XG4gICAgICBwb3N0U2lnblVwSG9vayh1c2VySWQsIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIC8vIFNlbmQgYSBlbWFpbCBhZGRyZXNzIHZlcmlmaWNhdGlvbiBlbWFpbCBpbiBjYXNlIHRoZSBjb250ZXh0IHBlcm1pdHMgaXRcbiAgICAvLyBhbmQgdGhlIHNwZWNpZmljIGNvbmZpZ3VyYXRpb24gZmxhZyB3YXMgc2V0IHRvIHRydWVcbiAgICBpZiAob3B0aW9ucy5lbWFpbCAmJiBBY2NvdW50c1RlbXBsYXRlcy5vcHRpb25zLnNlbmRWZXJpZmljYXRpb25FbWFpbCkge1xuICAgICAgQWNjb3VudHMuc2VuZFZlcmlmaWNhdGlvbkVtYWlsKHVzZXJJZCwgb3B0aW9ucy5lbWFpbCk7XG4gICAgfVxuICB9LFxuXG4gIC8vIFJlc2VuZCBhIHVzZXIncyB2ZXJpZmljYXRpb24gZS1tYWlsXG4gIEFUUmVzZW5kVmVyaWZpY2F0aW9uRW1haWw6IGZ1bmN0aW9uIChlbWFpbCkge1xuICAgIGNoZWNrKGVtYWlsLCBTdHJpbmcpO1xuXG4gICAgdmFyIHVzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZSh7IFwiZW1haWxzLmFkZHJlc3NcIjogZW1haWwgfSk7XG5cbiAgICAvLyBTZW5kIHRoZSBzdGFuZGFyZCBlcnJvciBiYWNrIHRvIHRoZSBjbGllbnQgaWYgbm8gdXNlciBleGlzdCB3aXRoIHRoaXMgZS1tYWlsXG4gICAgaWYgKCF1c2VyKSB7XG4gICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMywgXCJVc2VyIG5vdCBmb3VuZFwiKTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgQWNjb3VudHMuc2VuZFZlcmlmaWNhdGlvbkVtYWlsKHVzZXIuX2lkKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgLy8gSGFuZGxlIGVycm9yIHdoZW4gZW1haWwgYWxyZWFkeSB2ZXJpZmllZFxuICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2R3aW5zdG9uL3NlbmQtdmVyaWZpY2F0aW9uLWVtYWlsLWJ1Z1xuICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIFwiQWxyZWFkeSB2ZXJpZmllZFwiKTtcbiAgICB9XG4gIH0sXG59KTtcbiIsIlQ5biA9IHJlcXVpcmUoJ21ldGVvci1hY2NvdW50cy10OW4nKS5UOW47XG5pbXBvcnQgZW4gZnJvbSAnbWV0ZW9yLWFjY291bnRzLXQ5bi9idWlsZC9lbic7XG5cblQ5bi5tYXAoXCJlblwiLCBlbik7XG5UOW4uc2V0TGFuZ3VhZ2UoJ2VuJyk7XG4iXX0=
