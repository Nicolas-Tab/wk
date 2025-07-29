(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var meteorInstall = Package['modules-runtime'].meteorInstall;
var verifyErrors = Package['modules-runtime'].verifyErrors;

var require = meteorInstall({"node_modules":{"meteor":{"modules":{"server.js":function module(require){

///////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                               //
// packages/modules/server.js                                                                    //
//                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                 //
require("./install-packages.js");
require("./process.js");
require("./reify.js");

///////////////////////////////////////////////////////////////////////////////////////////////////

},"install-packages.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                               //
// packages/modules/install-packages.js                                                          //
//                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                 //
function install(name, mainModule) {
  var meteorDir = {};

  // Given a package name <name>, install a stub module in the
  // /node_modules/meteor directory called <name>.js, so that
  // require.resolve("meteor/<name>") will always return
  // /node_modules/meteor/<name>.js instead of something like
  // /node_modules/meteor/<name>/index.js, in the rare but possible event
  // that the package contains a file called index.js (#6590).

  if (typeof mainModule === "string") {
    // Set up an alias from /node_modules/meteor/<package>.js to the main
    // module, e.g. meteor/<package>/index.js.
    meteorDir[name + ".js"] = mainModule;
  } else {
    // back compat with old Meteor packages
    meteorDir[name + ".js"] = function (r, e, module) {
      module.exports = Package[name];
    };
  }

  meteorInstall({
    node_modules: {
      meteor: meteorDir
    }
  });
}

// This file will be modified during computeJsOutputFilesMap to include
// install(<name>) calls for every Meteor package.

install("meteor");
install("meteor-base");
install("ecmascript-runtime");
install("modules-runtime");
install("modules", "meteor/modules/server.js");
install("modern-browsers", "meteor/modern-browsers/modern.js");
install("es5-shim");
install("promise", "meteor/promise/server.js");
install("ecmascript-runtime-client", "meteor/ecmascript-runtime-client/versions.js");
install("ecmascript-runtime-server", "meteor/ecmascript-runtime-server/runtime.js");
install("babel-compiler");
install("react-fast-refresh");
install("ecmascript");
install("standard-minifier-js");
install("jquery");
install("babel-runtime", "meteor/babel-runtime/babel-runtime.js");
install("fetch", "meteor/fetch/server.js");
install("inter-process-messaging", "meteor/inter-process-messaging/inter-process-messaging.js");
install("dynamic-import", "meteor/dynamic-import/server.js");
install("tracker");
install("base64", "meteor/base64/base64.js");
install("ejson", "meteor/ejson/ejson.js");
install("check", "meteor/check/match.js");
install("random", "meteor/random/main_server.js");
install("mongo-id", "meteor/mongo-id/id.js");
install("diff-sequence", "meteor/diff-sequence/diff.js");
install("observe-sequence");
install("reactive-var");
install("ordered-dict", "meteor/ordered-dict/ordered_dict.js");
install("htmljs", "meteor/htmljs/preamble.js");
install("blaze");
install("mquandalle:jade");
install("coffeescript");
install("underscore");
install("aldeed:simple-schema");
install("npm-mongo");
install("geojson-utils", "meteor/geojson-utils/main.js");
install("id-map", "meteor/id-map/id-map.js");
install("mongo-decimal", "meteor/mongo-decimal/decimal.js");
install("minimongo", "meteor/minimongo/minimongo_server.js");
install("retry", "meteor/retry/retry.js");
install("callback-hook", "meteor/callback-hook/hook.js");
install("ddp-common");
install("reload");
install("socket-stream-client", "meteor/socket-stream-client/node.js");
install("ddp-client", "meteor/ddp-client/server/server.js");
install("rate-limit", "meteor/rate-limit/rate-limit.js");
install("ddp-rate-limiter", "meteor/ddp-rate-limiter/ddp-rate-limiter.js");
install("typescript");
install("logging", "meteor/logging/logging.js");
install("routepolicy", "meteor/routepolicy/main.js");
install("boilerplate-generator", "meteor/boilerplate-generator/generator.js");
install("webapp-hashing");
install("webapp", "meteor/webapp/webapp_server.js");
install("audit-argument-checks");
install("ddp-server");
install("ddp");
install("allow-deny");
install("binary-heap", "meteor/binary-heap/binary-heap.js");
install("mongo");
install("raix:eventemitter");
install("aldeed:collection2-core");
install("aldeed:schema-index");
install("aldeed:schema-deny");
install("aldeed:collection2");
install("cottz:publish-relations", "meteor/cottz:publish-relations/lib/server/index.js");
install("dburles:collection-helpers");
install("idmontie:migrations");
install("easysearch:core", "meteor/easysearch:core/lib/main.js");
install("reactive-dict", "meteor/reactive-dict/migration.js");
install("spacebars");
install("templating-compiler");
install("templating-runtime");
install("templating");
install("peerlibrary:assert");
install("peerlibrary:reactive-field", "meteor/peerlibrary:reactive-field/lib.js");
install("peerlibrary:computed-field", "meteor/peerlibrary:computed-field/lib.js");
install("peerlibrary:base-component");
install("peerlibrary:data-lookup", "meteor/peerlibrary:data-lookup/lib.coffee");
install("peerlibrary:blaze-components");
install("easysearch:components", "meteor/easysearch:components/lib/main.js");
install("easy:search", "meteor/easy:search/main.js");
install("mquandalle:collection-mutations");
install("url", "meteor/url/server.js");
install("accounts-base", "meteor/accounts-base/server_main.js");
install("sha");
install("email", "meteor/email/email.js");
install("accounts-password");
install("http", "meteor/http/httpcall_server.js");
install("useraccounts:core");
install("kadira:flow-router");
install("kadira:blaze-layout");
install("useraccounts:flow-routing");
install("useraccounts:unstyled");
install("simple:json-routes");
install("simple:authenticate-user-by-token");
install("simple:rest-bearer-token-parser");
install("simple:rest-json-error-handler");
install("simple:rest-accounts-password");
install("yasaricli:slugify");
install("percolate:synced-cron");
install("wekan-ldap", "meteor/wekan-ldap/server/index.js");
install("wekan-accounts-cas");
install("wekan-accounts-sandstorm");
install("wekan-accounts-lockout", "meteor/wekan-accounts-lockout/accounts-lockout.js");
install("localstorage");
install("service-configuration");
install("oauth");
install("oauth2");
install("wekan-oidc");
install("accounts-oauth");
install("wekan-accounts-oidc");
install("session");
install("zimme:active-route");
install("arillo:flow-router-helpers");
install("kadira:dochead");
install("mquandalle:autofocus");
install("ongoworks:speakingurl");
install("raix:handlebar-helpers");
install("wekan-bootstrap-datepicker");
install("ostrio:cstorage", "meteor/ostrio:cstorage/client-storage.js");
install("ostrio:i18n", "meteor/ostrio:i18n/i18n.js");
install("mousetrap:mousetrap");
install("mquandalle:jquery-textcomplete");
install("mquandalle:mousetrap-bindglobal");
install("templates:tabs");
install("meteor-autosize");
install("shell-server", "meteor/shell-server/main.js");
install("msavin:usercache");
install("deps");
install("meteorhacks:subs-manager");
install("mongo-livedata");
install("meteorhacks:collection-utils");
install("meteorhacks:aggregate");
install("wekan-markdown");
install("konecty:mongo-counter");
install("ostrio:cookies", "meteor/ostrio:cookies/cookies.js");
install("ostrio:files", "meteor/ostrio:files/server.js");
install("pascoual:pdfkit");
install("zodern:types");
install("matb33:collection-hooks", "meteor/matb33:collection-hooks/server.js");
install("communitypackages:picker", "meteor/communitypackages:picker/lib/instance.js");
install("minifier-css", "meteor/minifier-css/minifier.js");
install("wekan-fullcalendar");
install("momentjs:moment");
install("wekan-fontawesome");
install("hot-code-push");
install("autoupdate", "meteor/autoupdate/autoupdate_server.js");
install("mdg:validation-error");

///////////////////////////////////////////////////////////////////////////////////////////////////

},"process.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                               //
// packages/modules/process.js                                                                   //
//                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                 //
if (! global.process) {
  try {
    // The application can run `npm install process` to provide its own
    // process stub; otherwise this module will provide a partial stub.
    global.process = require("process");
  } catch (missing) {
    global.process = {};
  }
}

var proc = global.process;

if (Meteor.isServer) {
  // Make require("process") work on the server in all versions of Node.
  meteorInstall({
    node_modules: {
      "process.js": function (r, e, module) {
        module.exports = proc;
      }
    }
  });
} else {
  proc.platform = "browser";
  proc.nextTick = proc.nextTick || Meteor._setImmediate;
}

if (typeof proc.env !== "object") {
  proc.env = {};
}

var hasOwn = Object.prototype.hasOwnProperty;
for (var key in meteorEnv) {
  if (hasOwn.call(meteorEnv, key)) {
    proc.env[key] = meteorEnv[key];
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////////

},"reify.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                               //
// packages/modules/reify.js                                                                     //
//                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                 //
require("@meteorjs/reify/lib/runtime").enable(
  module.constructor.prototype
);

///////////////////////////////////////////////////////////////////////////////////////////////////

},"node_modules":{"@meteorjs":{"reify":{"lib":{"runtime":{"index.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                               //
// node_modules/meteor/modules/node_modules/@meteorjs/reify/lib/runtime/index.js                 //
//                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                 //
module.useNode();
///////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/modules/server.js");

/* Exports */
Package._define("modules", exports, {
  meteorInstall: meteorInstall
});

})();
