(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Blaze = Package.blaze.Blaze;
var UI = Package.blaze.UI;
var Handlebars = Package.blaze.Handlebars;
var _ = Package.underscore._;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var ReactiveVar = Package['reactive-var'].ReactiveVar;
var EJSON = Package.ejson.EJSON;
var Spacebars = Package.spacebars.Spacebars;
var BaseComponent = Package['peerlibrary:base-component'].BaseComponent;
var BaseComponentDebug = Package['peerlibrary:base-component'].BaseComponentDebug;
var assert = Package['peerlibrary:assert'].assert;
var ReactiveField = Package['peerlibrary:reactive-field'].ReactiveField;
var ComputedField = Package['peerlibrary:computed-field'].ComputedField;
var DataLookup = Package['peerlibrary:data-lookup'].DataLookup;
var HTML = Package.htmljs.HTML;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var __coffeescriptShare, Template, AttributeHandler, ElementAttributesUpdater, BlazeComponent, propertyOrMatcherOrFunction, parentView, before, path, BlazeComponentDebug, rootComponentOrElement;

(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/peerlibrary_blaze-components/template.coffee                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Template = Blaze.Template;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/peerlibrary_blaze-components/compatibility/templating.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* This file is needed to backport this pull request: https://github.com/meteor/meteor/pull/5903
   If it is a copy of templating.js file wrapped into a condition.

   TODO: Remove this file eventually.
 */

if (!Blaze.Template.__checkName) {
  // Packages and apps add templates on to this object.

  /**
   * @summary The class for defining templates
   * @class
   * @instanceName Template.myTemplate
   */
  Template = Blaze.Template;

  var RESERVED_TEMPLATE_NAMES = "__proto__ name".split(" ");

  // Check for duplicate template names and illegal names that won't work.
  Template.__checkName = function (name) {
    // Some names can't be used for Templates. These include:
    //  - Properties Blaze sets on the Template object.
    //  - Properties that some browsers don't let the code to set.
    //    These are specified in RESERVED_TEMPLATE_NAMES.
    if (name in Template || _.contains(RESERVED_TEMPLATE_NAMES, name)) {
      if ((Template[name] instanceof Template) && name !== "body")
        throw new Error("There are multiple templates named '" + name + "'. Each template needs a unique name.");
      throw new Error("This template name is reserved: " + name);
    }
  };

  // XXX COMPAT WITH 0.8.3
  Template.__define__ = function (name, renderFunc) {
    Template.__checkName(name);
    Template[name] = new Template("Template." + name, renderFunc);
    // Exempt packages built pre-0.9.0 from warnings about using old
    // helper syntax, because we can.  It's not very useful to get a
    // warning about someone else's code (like a package on Atmosphere),
    // and this should at least put a bit of a dent in number of warnings
    // that come from packages that haven't been updated lately.
    Template[name]._NOWARN_OLDSTYLE_HELPERS = true;
  };

  // Define a template `Template.body` that renders its
  // `contentRenderFuncs`.  `<body>` tags (of which there may be
  // multiple) will have their contents added to it.

  /**
   * @summary The [template object](#templates_api) representing your `<body>`
   * tag.
   * @locus Client
   */
  Template.body = new Template('body', function () {
    var view = this;
    return _.map(Template.body.contentRenderFuncs, function (func) {
      return func.apply(view);
    });
  });
  Template.body.contentRenderFuncs = []; // array of Blaze.Views
  Template.body.view = null;

  Template.body.addContent = function (renderFunc) {
    Template.body.contentRenderFuncs.push(renderFunc);
  };

  // This function does not use `this` and so it may be called
  // as `Meteor.startup(Template.body.renderIntoDocument)`.
  Template.body.renderToDocument = function () {
    // Only do it once.
    if (Template.body.view)
      return;

    var view = Blaze.render(Template.body, document.body);
    Template.body.view = view;
  };

  // XXX COMPAT WITH 0.9.0
  UI.body = Template.body;

  // XXX COMPAT WITH 0.9.0
  // (<body> tags in packages built with 0.9.0)
  Template.__body__ = Template.body;
  Template.__body__.__contentParts = Template.body.contentViews;
  Template.__body__.__instantiate = Template.body.renderToDocument;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/peerlibrary_blaze-components/compatibility/template.dynamic.js                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //

Template.__checkName("__dynamicBackport");
Template["__dynamicBackport"] = new Template("Template.__dynamicBackport", (function() {
  var view = this;
  return [ Blaze.View("lookup:checkContext", function() {
    return Spacebars.mustache(view.lookup("checkContext"));
  }), "\n  ", Blaze.If(function() {
    return Spacebars.call(view.lookup("dataContextPresent"));
  }, function() {
    return [ "\n    ", Spacebars.include(view.lookupTemplate("__dynamicWithDataContext"), function() {
      return Blaze._InOuterTemplateScope(view, function() {
        return Spacebars.include(function() {
          return Spacebars.call(view.templateContentBlock);
        });
      });
    }), "\n  " ];
  }, function() {
    return [ "\n    \n    ", Blaze._TemplateWith(function() {
      return {
        template: Spacebars.call(view.lookup("template")),
        data: Spacebars.call(view.lookup(".."))
      };
    }, function() {
      return Spacebars.include(view.lookupTemplate("__dynamicWithDataContext"), function() {
        return Blaze._InOuterTemplateScope(view, function() {
          return Spacebars.include(function() {
            return Spacebars.call(view.templateContentBlock);
          });
        });
      });
    }), "\n  " ];
  }) ];
}));

Template.__checkName("__dynamicWithDataContextBackport");
Template["__dynamicWithDataContextBackport"] = new Template("Template.__dynamicWithDataContextBackport", (function() {
  var view = this;
  return Spacebars.With(function() {
    return Spacebars.dataMustache(view.lookup("chooseTemplate"), view.lookup("template"));
  }, function() {
    return [ "\n    \n    ", Blaze._TemplateWith(function() {
      return Spacebars.call(Spacebars.dot(view.lookup(".."), "data"));
    }, function() {
      return Spacebars.include(view.lookupTemplate(".."), function() {
        return Blaze._InOuterTemplateScope(view, function() {
          return Spacebars.include(function() {
            return Spacebars.call(view.templateContentBlock);
          });
        });
      });
    }), "\n  " ];
  });
}));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/peerlibrary_blaze-components/compatibility/dynamic.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* This file is needed to backport this pull request: https://github.com/meteor/meteor/pull/5903
   If it is a copy of dynamic.js file wrapped into a condition with renaming of backported templates.

   TODO: Remove this file eventually.
 */

if (!Blaze.Template.__dynamicWithDataContext) {
  Blaze.Template.__dynamicWithDataContext = Blaze.Template.__dynamicWithDataContextBackport;
  Blaze.Template.__dynamicWithDataContext.viewName = 'Template.__dynamicWithDataContext';
  Blaze.Template.__dynamic = Blaze.Template.__dynamicBackport;
  Blaze.Template.__dynamic.viewName = 'Template.__dynamic';

  var Template = Blaze.Template;

  /**
   * @isTemplate true
   * @memberOf Template
   * @function dynamic
   * @summary Choose a template to include dynamically, by name.
   * @locus Templates
   * @param {String} template The name of the template to include.
   * @param {Object} [data] Optional. The data context in which to include the
   * template.
   */

  Template.__dynamicWithDataContext.helpers({
    chooseTemplate: function (name) {
      return Blaze._getTemplate(name, function () {
        return Template.instance();
      });
    }
  });

  Template.__dynamic.helpers({
    dataContextPresent: function () {
      return _.has(this, "data");
    },
    checkContext: function () {
      if (!_.has(this, "template")) {
        throw new Error("Must specify name in the 'template' argument " +
          "to {{> Template.dynamic}}.");
      }

      _.each(this, function (v, k) {
        if (k !== "template" && k !== "data") {
          throw new Error("Invalid argument to {{> Template.dynamic}}: " +
            k);
        }
      });
    }
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/peerlibrary_blaze-components/compatibility/lookup.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* This file backports Blaze lookup.js from Meteor 1.2 so that required Blaze features to support Blaze
   Components are available also in older Meteor versions.
   It is a copy of lookup.js file from Meteor 1.2 with lexical scope lookup commented out.

   TODO: Remove this file eventually.
 */

// Check if we are not running Meteor 1.2+.
if (! Blaze._getTemplate) {
  // If `x` is a function, binds the value of `this` for that function
  // to the current data context.
  var bindDataContext = function (x) {
    if (typeof x === 'function') {
      return function () {
        var data = Blaze.getData();
        if (data == null)
          data = {};
        return x.apply(data, arguments);
      };
    }
    return x;
  };

  Blaze._getTemplateHelper = function (template, name, tmplInstanceFunc) {
    // XXX COMPAT WITH 0.9.3
    var isKnownOldStyleHelper = false;

    if (template.__helpers.has(name)) {
      var helper = template.__helpers.get(name);
      if (helper === Blaze._OLDSTYLE_HELPER) {
        isKnownOldStyleHelper = true;
      } else if (helper != null) {
        return wrapHelper(bindDataContext(helper), tmplInstanceFunc);
      } else {
        return null;
      }
    }

    // old-style helper
    if (name in template) {
      // Only warn once per helper
      if (!isKnownOldStyleHelper) {
        template.__helpers.set(name, Blaze._OLDSTYLE_HELPER);
        if (!template._NOWARN_OLDSTYLE_HELPERS) {
          Blaze._warn('Assigning helper with `' + template.viewName + '.' +
            name + ' = ...` is deprecated.  Use `' + template.viewName +
            '.helpers(...)` instead.');
        }
      }
      if (template[name] != null) {
        return wrapHelper(bindDataContext(template[name]), tmplInstanceFunc);
      }
    }

    return null;
  };

  var wrapHelper = function (f, templateFunc) {
    // XXX COMPAT WITH METEOR 1.0.3.2
    if (!Blaze.Template._withTemplateInstanceFunc) {
      return Blaze._wrapCatchingExceptions(f, 'template helper');
    }

    if (typeof f !== "function") {
      return f;
    }

    return function () {
      var self = this;
      var args = arguments;

      return Blaze.Template._withTemplateInstanceFunc(templateFunc, function () {
        return Blaze._wrapCatchingExceptions(f, 'template helper').apply(self, args);
      });
    };
  };

  // templateInstance argument is provided to be available for possible
  // alternative implementations of this function by 3rd party packages.
  Blaze._getTemplate = function (name, templateInstance) {
    if ((name in Blaze.Template) && (Blaze.Template[name] instanceof Blaze.Template)) {
      return Blaze.Template[name];
    }
    return null;
  };

  Blaze._getGlobalHelper = function (name, templateInstance) {
    if (Blaze._globalHelpers[name] != null) {
      return wrapHelper(bindDataContext(Blaze._globalHelpers[name]), templateInstance);
    }
    return null;
  };

  Blaze.View.prototype.lookup = function (name, _options) {
    var template = this.template;
    var lookupTemplate = _options && _options.template;
    var helper;
    var binding;
    var boundTmplInstance;
    var foundTemplate;

    if (this.templateInstance) {
      boundTmplInstance = _.bind(this.templateInstance, this);
    }

    // 0. looking up the parent data context with the special "../" syntax
    if (/^\./.test(name)) {
      // starts with a dot. must be a series of dots which maps to an
      // ancestor of the appropriate height.
      if (!/^(\.)+$/.test(name))
        throw new Error("id starting with dot must be a series of dots");

      return Blaze._parentData(name.length - 1, true /*_functionWrapped*/);

    }

    // 1. look up a helper on the current template
    if (template && ((helper = Blaze._getTemplateHelper(template, name, boundTmplInstance)) != null)) {
      return helper;
    }

    // 2. look up a binding by traversing the lexical view hierarchy inside the
    // current template
    /*if (template && (binding = Blaze._lexicalBindingLookup(Blaze.currentView, name)) != null) {
      return binding;
    }*/

    // 3. look up a template by name
    if (lookupTemplate && ((foundTemplate = Blaze._getTemplate(name, boundTmplInstance)) != null)) {
      return foundTemplate;
    }

    // 4. look up a global helper
    if ((helper = Blaze._getGlobalHelper(name, boundTmplInstance)) != null) {
      return helper;
    }

    // 5. look up in a data context
    return function () {
      var isCalledAsFunction = (arguments.length > 0);
      var data = Blaze.getData();
      var x = data && data[name];
      if (!x) {
        if (lookupTemplate) {
          throw new Error("No such template: " + name);
        } else if (isCalledAsFunction) {
          throw new Error("No such function: " + name);
        } /*else if (name.charAt(0) === '@' && ((x === null) ||
          (x === undefined))) {
          // Throw an error if the user tries to use a `@directive`
          // that doesn't exist.  We don't implement all directives
          // from Handlebars, so there's a potential for confusion
          // if we fail silently.  On the other hand, we want to
          // throw late in case some app or package wants to provide
          // a missing directive.
          throw new Error("Unsupported directive: " + name);
        }*/
      }
      if (!data) {
        return null;
      }
      if (typeof x !== 'function') {
        if (isCalledAsFunction) {
          throw new Error("Can't call non-function: " + x);
        }
        return x;
      }
      return x.apply(data, arguments);
    };
  };
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/peerlibrary_blaze-components/compatibility/attrs.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* This file is needed to backport this pull request: https://github.com/meteor/meteor/pull/5893
   It is a copy of attrs.js file with the changes from the above pull request merged in.

   TODO: Remove this file eventually.
 */

var jsUrlsAllowed = false;
Blaze._allowJavascriptUrls = function () {
  jsUrlsAllowed = true;
};
Blaze._javascriptUrlsAllowed = function () {
  return jsUrlsAllowed;
};

// An AttributeHandler object is responsible for updating a particular attribute
// of a particular element.  AttributeHandler subclasses implement
// browser-specific logic for dealing with particular attributes across
// different browsers.
//
// To define a new type of AttributeHandler, use
// `var FooHandler = AttributeHandler.extend({ update: function ... })`
// where the `update` function takes arguments `(element, oldValue, value)`.
// The `element` argument is always the same between calls to `update` on
// the same instance.  `oldValue` and `value` are each either `null` or
// a Unicode string of the type that might be passed to the value argument
// of `setAttribute` (i.e. not an HTML string with character references).
// When an AttributeHandler is installed, an initial call to `update` is
// always made with `oldValue = null`.  The `update` method can access
// `this.name` if the AttributeHandler class is a generic one that applies
// to multiple attribute names.
//
// AttributeHandlers can store custom properties on `this`, as long as they
// don't use the names `element`, `name`, `value`, and `oldValue`.
//
// AttributeHandlers can't influence how attributes appear in rendered HTML,
// only how they are updated after materialization as DOM.

AttributeHandler = function (name, value) {
  this.name = name;
  this.value = value;
};
Blaze._AttributeHandler = AttributeHandler;

AttributeHandler.prototype.update = function (element, oldValue, value) {
  if (value === null) {
    if (oldValue !== null)
      element.removeAttribute(this.name);
  } else {
    element.setAttribute(this.name, value);
  }
};

AttributeHandler.extend = function (options) {
  var curType = this;
  var subType = function AttributeHandlerSubtype(/*arguments*/) {
    AttributeHandler.apply(this, arguments);
  };
  subType.prototype = new curType;
  subType.extend = curType.extend;
  if (options)
    _.extend(subType.prototype, options);
  return subType;
};

/// Apply the diff between the attributes of "oldValue" and "value" to "element."
//
// Each subclass must implement a parseValue method which takes a string
// as an input and returns a dict of attributes. The keys of the dict
// are unique identifiers (ie. css properties in the case of styles), and the
// values are the entire attribute which will be injected into the element.
//
// Extended below to support classes, SVG elements and styles.

Blaze._DiffingAttributeHandler = AttributeHandler.extend({
  update: function (element, oldValue, value) {
    if (!this.getCurrentValue || !this.setValue || !this.parseValue)
      throw new Error("Missing methods in subclass of 'DiffingAttributeHandler'");

    var oldAttrsMap = oldValue ? this.parseValue(oldValue) : {};
    var newAttrsMap = value ? this.parseValue(value) : {};

    // the current attributes on the element, which we will mutate.

    var attrString = this.getCurrentValue(element);
    var attrsMap = attrString ? this.parseValue(attrString) : {};

    _.each(_.keys(oldAttrsMap), function (t) {
      if (! (t in newAttrsMap))
        delete attrsMap[t];
    });

    _.each(_.keys(newAttrsMap), function (t) {
      attrsMap[t] = newAttrsMap[t];
    });

    this.setValue(element, _.values(attrsMap).join(' '));
  }
});

var ClassHandler = Blaze._DiffingAttributeHandler.extend({
  // @param rawValue {String}
  getCurrentValue: function (element) {
    return element.className;
  },
  setValue: function (element, className) {
    element.className = className;
  },
  parseValue: function (attrString) {
    var tokens = {};

    _.each(attrString.split(' '), function(token) {
      if (token)
        tokens[token] = token;
    });
    return tokens;
  }
});

var SVGClassHandler = ClassHandler.extend({
  getCurrentValue: function (element) {
    return element.className.baseVal;
  },
  setValue: function (element, className) {
    element.setAttribute('class', className);
  }
});

var StyleHandler = Blaze._DiffingAttributeHandler.extend({
  getCurrentValue: function (element) {
    return element.getAttribute('style');
  },
  setValue: function (element, style) {
    if (style === '') {
      element.removeAttribute('style');
    } else {
      element.setAttribute('style', style);
    }
  },

  // Parse a string to produce a map from property to attribute string.
  //
  // Example:
  // "color:red; foo:12px" produces a token {color: "color:red", foo:"foo:12px"}
  parseValue: function (attrString) {
    var tokens = {};

    // Regex for parsing a css attribute declaration, taken from css-parse:
    // https://github.com/reworkcss/css-parse/blob/7cef3658d0bba872cde05a85339034b187cb3397/index.js#L219
    var regex = /(\*?[-#\/\*\\\w]+(?:\[[0-9a-z_-]+\])?)\s*:\s*(?:\'(?:\\\'|.)*?\'|"(?:\\"|.)*?"|\([^\)]*?\)|[^};])+[;\s]*/g;
    var match = regex.exec(attrString);
    while (match) {
      // match[0] = entire matching string
      // match[1] = css property
      // Prefix the token to prevent conflicts with existing properties.

      // XXX No `String.trim` on Safari 4. Swap out $.trim if we want to
      // remove strong dep on jquery.
      tokens[' ' + match[1]] = match[0].trim ?
        match[0].trim() : $.trim(match[0]);

      match = regex.exec(attrString);
    }

    return tokens;
  }
});

var BooleanHandler = AttributeHandler.extend({
  update: function (element, oldValue, value) {
    var name = this.name;
    if (value == null) {
      if (oldValue != null)
        element[name] = false;
    } else {
      element[name] = true;
    }
  }
});

var DOMPropertyHandler = AttributeHandler.extend({
  update: function (element, oldValue, value) {
    var name = this.name;
    if (value !== element[name])
      element[name] = value;
  }
});

// attributes of the type 'xlink:something' should be set using
// the correct namespace in order to work
var XlinkHandler = AttributeHandler.extend({
  update: function(element, oldValue, value) {
    var NS = 'http://www.w3.org/1999/xlink';
    if (value === null) {
      if (oldValue !== null)
        element.removeAttributeNS(NS, this.name);
    } else {
      element.setAttributeNS(NS, this.name, this.value);
    }
  }
});

// cross-browser version of `instanceof SVGElement`
var isSVGElement = function (elem) {
  return 'ownerSVGElement' in elem;
};

var isUrlAttribute = function (tagName, attrName) {
  // Compiled from http://www.w3.org/TR/REC-html40/index/attributes.html
  // and
  // http://www.w3.org/html/wg/drafts/html/master/index.html#attributes-1
  var urlAttrs = {
    FORM: ['action'],
    BODY: ['background'],
    BLOCKQUOTE: ['cite'],
    Q: ['cite'],
    DEL: ['cite'],
    INS: ['cite'],
    OBJECT: ['classid', 'codebase', 'data', 'usemap'],
    APPLET: ['codebase'],
    A: ['href'],
    AREA: ['href'],
    LINK: ['href'],
    BASE: ['href'],
    IMG: ['longdesc', 'src', 'usemap'],
    FRAME: ['longdesc', 'src'],
    IFRAME: ['longdesc', 'src'],
    HEAD: ['profile'],
    SCRIPT: ['src'],
    INPUT: ['src', 'usemap', 'formaction'],
    BUTTON: ['formaction'],
    BASE: ['href'],
    MENUITEM: ['icon'],
    HTML: ['manifest'],
    VIDEO: ['poster']
  };

  if (attrName === 'itemid') {
    return true;
  }

  var urlAttrNames = urlAttrs[tagName] || [];
  return _.contains(urlAttrNames, attrName);
};

// To get the protocol for a URL, we let the browser normalize it for
// us, by setting it as the href for an anchor tag and then reading out
// the 'protocol' property.
if (Meteor.isClient) {
  var anchorForNormalization = document.createElement('A');
}

var getUrlProtocol = function (url) {
  if (Meteor.isClient) {
    anchorForNormalization.href = url;
    return (anchorForNormalization.protocol || "").toLowerCase();
  } else {
    throw new Error('getUrlProtocol not implemented on the server');
  }
};

// UrlHandler is an attribute handler for all HTML attributes that take
// URL values. It disallows javascript: URLs, unless
// Blaze._allowJavascriptUrls() has been called. To detect javascript:
// urls, we set the attribute on a dummy anchor element and then read
// out the 'protocol' property of the attribute.
var origUpdate = AttributeHandler.prototype.update;
var UrlHandler = AttributeHandler.extend({
  update: function (element, oldValue, value) {
    var self = this;
    var args = arguments;

    if (Blaze._javascriptUrlsAllowed()) {
      origUpdate.apply(self, args);
    } else {
      var isJavascriptProtocol = (getUrlProtocol(value) === "javascript:");
      if (isJavascriptProtocol) {
        Blaze._warn("URLs that use the 'javascript:' protocol are not " +
                    "allowed in URL attribute values. " +
                    "Call Blaze._allowJavascriptUrls() " +
                    "to enable them.");
        origUpdate.apply(self, [element, oldValue, null]);
      } else {
        origUpdate.apply(self, args);
      }
    }
  }
});

// XXX make it possible for users to register attribute handlers!
Blaze._makeAttributeHandler = function (elem, name, value) {
  // generally, use setAttribute but certain attributes need to be set
  // by directly setting a JavaScript property on the DOM element.
  if (name === 'class') {
    if (isSVGElement(elem)) {
      return new SVGClassHandler(name, value);
    } else {
      return new ClassHandler(name, value);
    }
  } else if (name === 'style') {
    return new StyleHandler(name, value);
  } else if ((elem.tagName === 'OPTION' && name === 'selected') ||
             (elem.tagName === 'INPUT' && name === 'checked')) {
    return new BooleanHandler(name, value);
  } else if ((elem.tagName === 'TEXTAREA' || elem.tagName === 'INPUT')
             && name === 'value') {
    // internally, TEXTAREAs tracks their value in the 'value'
    // attribute just like INPUTs.
    return new DOMPropertyHandler(name, value);
  } else if (name.substring(0,6) === 'xlink:') {
    return new XlinkHandler(name.substring(6), value);
  } else if (isUrlAttribute(elem.tagName, name)) {
    return new UrlHandler(name, value);
  } else {
    return new AttributeHandler(name, value);
  }

  // XXX will need one for 'style' on IE, though modern browsers
  // seem to handle setAttribute ok.
};


ElementAttributesUpdater = function (elem) {
  this.elem = elem;
  this.handlers = {};
};

// Update attributes on `elem` to the dictionary `attrs`, whose
// values are strings.
ElementAttributesUpdater.prototype.update = function(newAttrs) {
  var elem = this.elem;
  var handlers = this.handlers;

  for (var k in handlers) {
    if (! _.has(newAttrs, k)) {
      // remove attributes (and handlers) for attribute names
      // that don't exist as keys of `newAttrs` and so won't
      // be visited when traversing it.  (Attributes that
      // exist in the `newAttrs` object but are `null`
      // are handled later.)
      var handler = handlers[k];
      var oldValue = handler.value;
      handler.value = null;
      handler.update(elem, oldValue, null);
      delete handlers[k];
    }
  }

  for (var k in newAttrs) {
    var handler = null;
    var oldValue;
    var value = newAttrs[k];
    if (! _.has(handlers, k)) {
      if (value !== null) {
        // make new handler
        handler = Blaze._makeAttributeHandler(elem, k, value);
        handlers[k] = handler;
        oldValue = null;
      }
    } else {
      handler = handlers[k];
      oldValue = handler.value;
    }
    if (oldValue !== value) {
      handler.value = value;
      handler.update(elem, oldValue, value);
      if (value === null)
        delete handlers[k];
    }
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/peerlibrary_blaze-components/compatibility/materializer.js                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* This file is needed to backport this pull request: https://github.com/meteor/meteor/pull/5893
   It is a copy of the materializer.js file and is needed because it references symbols from attrs.js.

   TODO: Remove this file eventually.
 */

// Turns HTMLjs into DOM nodes and DOMRanges.
//
// - `htmljs`: the value to materialize, which may be any of the htmljs
//   types (Tag, CharRef, Comment, Raw, array, string, boolean, number,
//   null, or undefined) or a View or Template (which will be used to
//   construct a View).
// - `intoArray`: the array of DOM nodes and DOMRanges to push the output
//   into (required)
// - `parentView`: the View we are materializing content for (optional)
// - `_existingWorkStack`: optional argument, only used for recursive
//   calls when there is some other _materializeDOM on the call stack.
//   If _materializeDOM called your function and passed in a workStack,
//   pass it back when you call _materializeDOM (such as from a workStack
//   task).
//
// Returns `intoArray`, which is especially useful if you pass in `[]`.
Blaze._materializeDOM = function (htmljs, intoArray, parentView,
                                  _existingWorkStack) {
  // In order to use fewer stack frames, materializeDOMInner can push
  // tasks onto `workStack`, and they will be popped off
  // and run, last first, after materializeDOMInner returns.  The
  // reason we use a stack instead of a queue is so that we recurse
  // depth-first, doing newer tasks first.
  var workStack = (_existingWorkStack || []);
  materializeDOMInner(htmljs, intoArray, parentView, workStack);

  if (! _existingWorkStack) {
    // We created the work stack, so we are responsible for finishing
    // the work.  Call each "task" function, starting with the top
    // of the stack.
    while (workStack.length) {
      // Note that running task() may push new items onto workStack.
      var task = workStack.pop();
      task();
    }
  }

  return intoArray;
};

var materializeDOMInner = function (htmljs, intoArray, parentView, workStack) {
  if (htmljs == null) {
    // null or undefined
    return;
  }

  switch (typeof htmljs) {
  case 'string': case 'boolean': case 'number':
    intoArray.push(document.createTextNode(String(htmljs)));
    return;
  case 'object':
    if (htmljs.htmljsType) {
      switch (htmljs.htmljsType) {
      case HTML.Tag.htmljsType:
        intoArray.push(materializeTag(htmljs, parentView, workStack));
        return;
      case HTML.CharRef.htmljsType:
        intoArray.push(document.createTextNode(htmljs.str));
        return;
      case HTML.Comment.htmljsType:
        intoArray.push(document.createComment(htmljs.sanitizedValue));
        return;
      case HTML.Raw.htmljsType:
        // Get an array of DOM nodes by using the browser's HTML parser
        // (like innerHTML).
        var nodes = Blaze._DOMBackend.parseHTML(htmljs.value);
        for (var i = 0; i < nodes.length; i++)
          intoArray.push(nodes[i]);
        return;
      }
    } else if (HTML.isArray(htmljs)) {
      for (var i = htmljs.length-1; i >= 0; i--) {
        workStack.push(_.bind(Blaze._materializeDOM, null,
                              htmljs[i], intoArray, parentView, workStack));
      }
      return;
    } else {
      if (htmljs instanceof Blaze.Template) {
        htmljs = htmljs.constructView();
        // fall through to Blaze.View case below
      }
      if (htmljs instanceof Blaze.View) {
        Blaze._materializeView(htmljs, parentView, workStack, intoArray);
        return;
      }
    }
  }

  throw new Error("Unexpected object in htmljs: " + htmljs);
};

var materializeTag = function (tag, parentView, workStack) {
  var tagName = tag.tagName;
  var elem;
  if ((HTML.isKnownSVGElement(tagName) || isSVGAnchor(tag))
      && document.createElementNS) {
    // inline SVG
    elem = document.createElementNS('http://www.w3.org/2000/svg', tagName);
  } else {
    // normal elements
    elem = document.createElement(tagName);
  }

  var rawAttrs = tag.attrs;
  var children = tag.children;
  if (tagName === 'textarea' && tag.children.length &&
      ! (rawAttrs && ('value' in rawAttrs))) {
    // Provide very limited support for TEXTAREA tags with children
    // rather than a "value" attribute.
    // Reactivity in the form of Views nested in the tag's children
    // won't work.  Compilers should compile textarea contents into
    // the "value" attribute of the tag, wrapped in a function if there
    // is reactivity.
    if (typeof rawAttrs === 'function' ||
        HTML.isArray(rawAttrs)) {
      throw new Error("Can't have reactive children of TEXTAREA node; " +
                      "use the 'value' attribute instead.");
    }
    rawAttrs = _.extend({}, rawAttrs || null);
    rawAttrs.value = Blaze._expand(children, parentView);
    children = [];
  }

  if (rawAttrs) {
    var attrUpdater = new ElementAttributesUpdater(elem);
    var updateAttributes = function () {
      var expandedAttrs = Blaze._expandAttributes(rawAttrs, parentView);
      var flattenedAttrs = HTML.flattenAttributes(expandedAttrs);
      var stringAttrs = {};
      for (var attrName in flattenedAttrs) {
        stringAttrs[attrName] = Blaze._toText(flattenedAttrs[attrName],
                                              parentView,
                                              HTML.TEXTMODE.STRING);
      }
      attrUpdater.update(stringAttrs);
    };
    var updaterComputation;
    if (parentView) {
      updaterComputation =
        parentView.autorun(updateAttributes, undefined, 'updater');
    } else {
      updaterComputation = Tracker.nonreactive(function () {
        return Tracker.autorun(function () {
          Tracker._withCurrentView(parentView, updateAttributes);
        });
      });
    }
    Blaze._DOMBackend.Teardown.onElementTeardown(elem, function attrTeardown() {
      updaterComputation.stop();
    });
  }

  if (children.length) {
    var childNodesAndRanges = [];
    // push this function first so that it's done last
    workStack.push(function () {
      for (var i = 0; i < childNodesAndRanges.length; i++) {
        var x = childNodesAndRanges[i];
        if (x instanceof Blaze._DOMRange)
          x.attach(elem);
        else
          elem.appendChild(x);
      }
    });
    // now push the task that calculates childNodesAndRanges
    workStack.push(_.bind(Blaze._materializeDOM, null,
                          children, childNodesAndRanges, parentView,
                          workStack));
  }

  return elem;
};


var isSVGAnchor = function (node) {
  // We generally aren't able to detect SVG <a> elements because
  // if "A" were in our list of known svg element names, then all
  // <a> nodes would be created using
  // `document.createElementNS`. But in the special case of <a
  // xlink:href="...">, we can at least detect that attribute and
  // create an SVG <a> tag in that case.
  //
  // However, we still have a general problem of knowing when to
  // use document.createElementNS and when to use
  // document.createElement; for example, font tags will always
  // be created as SVG elements which can cause other
  // problems. #1977
  return (node.tagName === "a" &&
          node.attrs &&
          node.attrs["xlink:href"] !== undefined);
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/peerlibrary_blaze-components/lib.coffee                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
// TODO: Deduplicate between blaze component and common component packages.
var ComponentsNamespaceReference,
  HTMLJSExpander,
  REQUIRE_RENDERED_INSTANCE,
  SUPPORTS_REACTIVE_INSTANCE,
  addEvents,
  argumentsConstructor,
  bindComponent,
  bindDataContext,
  callTemplateBaseHooks,
  contentAsFunc,
  contentAsView,
  createMatcher,
  currentViewIfRendering,
  expand,
  expandView,
  getTemplateBase,
  getTemplateInstance,
  getTemplateInstanceFunction,
  method,
  methodName,
  originalDot,
  originalFlattenAttributes,
  originalGetTemplate,
  originalInclude,
  originalVisitTag,
  ref,
  registerFirstCreatedHook,
  registerHooks,
  templateInstanceToComponent,
  withTemplateInstanceFunc,
  wrapHelper,
  wrapViewAndTemplate,
  indexOf = [].indexOf;
createMatcher = function (propertyOrMatcherOrFunction, checkMixins) {
  var matcher, property;
  if (_.isString(propertyOrMatcherOrFunction)) {
    property = propertyOrMatcherOrFunction;
    propertyOrMatcherOrFunction = (child, parent) => {
      // If child is parent, we might get into an infinite loop if this is
      // called from getFirstWith, so in that case we do not use getFirstWith.
      if (checkMixins && child !== parent && child.getFirstWith) {
        return !!child.getFirstWith(null, property);
      } else {
        return property in child;
      }
    };
  } else if (!_.isFunction(propertyOrMatcherOrFunction)) {
    assert(_.isObject(propertyOrMatcherOrFunction));
    matcher = propertyOrMatcherOrFunction;
    propertyOrMatcherOrFunction = (child, parent) => {
      var childWithProperty, value;
      for (property in matcher) {
        value = matcher[property];
        // If child is parent, we might get into an infinite loop if this is
        // called from getFirstWith, so in that case we do not use getFirstWith.
        if (checkMixins && child !== parent && child.getFirstWith) {
          childWithProperty = child.getFirstWith(null, property);
        } else {
          if (property in child) {
            childWithProperty = child;
          }
        }
        if (!childWithProperty) {
          return false;
        }
        if (_.isFunction(childWithProperty[property])) {
          if (childWithProperty[property]() !== value) {
            return false;
          }
        } else {
          if (childWithProperty[property] !== value) {
            return false;
          }
        }
      }
      return true;
    };
  }
  return propertyOrMatcherOrFunction;
};
getTemplateInstance = function (view, skipBlockHelpers) {
  while (view && !view._templateInstance) {
    if (skipBlockHelpers) {
      view = view.parentView;
    } else {
      view = view.originalParentView || view.parentView;
    }
  }
  return view != null ? view._templateInstance : void 0;
};

// More or less the same as aldeed:template-extension's template.get('component') just specialized.
// It allows us to not have a dependency on template-extension package and that we can work with Iron
// Router which has its own DynamicTemplate class which is not patched by template-extension and thus
// does not have .get() method.
templateInstanceToComponent = function (templateInstanceFunc, skipBlockHelpers) {
  var templateInstance;
  templateInstance = typeof templateInstanceFunc === "function" ? templateInstanceFunc() : void 0;
  // Iron Router uses its own DynamicTemplate which is not a proper template instance, but it is
  // passed in as such, so we want to find the real one before we start searching for the component.
  templateInstance = getTemplateInstance(templateInstance != null ? templateInstance.view : void 0, skipBlockHelpers);
  while (templateInstance) {
    if ('component' in templateInstance) {
      return templateInstance.component;
    }
    if (skipBlockHelpers) {
      templateInstance = getTemplateInstance(templateInstance.view.parentView, skipBlockHelpers);
    } else {
      templateInstance = getTemplateInstance(templateInstance.view.originalParentView || templateInstance.view.parentView, skipBlockHelpers);
    }
  }
  return null;
};
getTemplateInstanceFunction = function (view, skipBlockHelpers) {
  var templateInstance;
  templateInstance = getTemplateInstance(view, skipBlockHelpers);
  return function () {
    return templateInstance;
  };
};
ComponentsNamespaceReference = class ComponentsNamespaceReference {
  constructor(namespace, templateInstance1) {
    this.namespace = namespace;
    this.templateInstance = templateInstance1;
  }
};

// We extend the original dot operator to support {{> Foo.Bar}}. This goes through a getTemplateHelper path, but
// we want to redirect it to the getTemplate path. So we mark it in getTemplateHelper and then here call getTemplate.
originalDot = Spacebars.dot;
Spacebars.dot = function (value) {
  for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }
  if (value instanceof ComponentsNamespaceReference) {
    return Blaze._getTemplate("".concat(value.namespace, ".").concat(args.join('.')), value.templateInstance);
  }
  return originalDot(value, ...args);
};
originalInclude = Spacebars.include;
Spacebars.include = function (templateOrFunction) {
  // If ComponentsNamespaceReference gets all the way to the Spacebars.include it means that we are in the situation
  // where there is both namespace and component with the same name, and user is including a component. But namespace
  // reference is created instead (because we do not know in advance that there is no Spacebars.dot call around lookup
  // call). So we dereference the reference and try to resolve a template. Of course, a component might not really exist.
  if (templateOrFunction instanceof ComponentsNamespaceReference) {
    templateOrFunction = Blaze._getTemplate(templateOrFunction.namespace, templateOrFunction.templateInstance);
  }
  for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    args[_key2 - 1] = arguments[_key2];
  }
  return originalInclude(templateOrFunction, ...args);
};

// We override the original lookup method with a similar one, which supports components as well.

// Now the order of the lookup will be, in order:
//   a helper of the current template
//   a property of the current component (not the BlazeComponent.currentComponent() though, but @component())
//   a helper of the current component's base template (not the BlazeComponent.currentComponent() though, but @component())
//   the name of a component
//   the name of a template
//   global helper
//   a property of the data context

// Returns a function, a non-function value, or null. If a function is found, it is bound appropriately.

// NOTE: This function must not establish any reactive dependencies itself.  If there is any reactivity
// in the value, lookup should return a function.

// TODO: Should we also lookup for a property of the component-level data context (and template-level data context)?
Blaze._getTemplateHelper = function (template, name, templateInstance) {
  var component, helper, isKnownOldStyleHelper, mixinOrComponent, ref, ref1, ref2;
  isKnownOldStyleHelper = false;
  if (template.__helpers.has(name)) {
    helper = template.__helpers.get(name);
    if (helper === Blaze._OLDSTYLE_HELPER) {
      isKnownOldStyleHelper = true;
    } else if (helper != null) {
      return wrapHelper(bindDataContext(helper), templateInstance);
    } else {
      return null;
    }
  }
  // Old-style helper.
  if (name in template) {
    // Only warn once per helper.
    if (!isKnownOldStyleHelper) {
      template.__helpers.set(name, Blaze._OLDSTYLE_HELPER);
      if (!template._NOWARN_OLDSTYLE_HELPERS) {
        Blaze._warn("Assigning helper with `" + template.viewName + "." + name + " = ...` is deprecated.  Use `" + template.viewName + ".helpers(...)` instead.");
      }
    }
    if (template[name] != null) {
      return wrapHelper(bindDataContext(template[name]), templateInstance);
    } else {
      return null;
    }
  }
  if (!templateInstance) {
    return null;
  }
  if ((ref = template.viewName) === 'Template.__dynamicWithDataContext' || ref === 'Template.__dynamic') {
    // Do not resolve component helpers if inside Template.dynamic. The reason is that Template.dynamic uses a data context
    // value with name "template" internally. But when used inside a component the data context lookup is then resolved
    // into a current component's template method and not the data context "template". To force the data context resolving
    // Template.dynamic should use "this.template" in its templates, but it does not, so we have a special case here for it.
    return null;
  }
  // Blaze.View::lookup should not introduce any reactive dependencies, but we can simply ignore reactivity here because
  // template instance probably cannot change without reconstructing the component as well.
  component = Tracker.nonreactive(function () {
    // We want to skip any block helper. {{method}} should resolve to
    // {{component.method}} and not to {{currentComponent.method}}.
    return templateInstanceToComponent(templateInstance, true);
  });
  // Component.
  if (component) {
    // This will first search on the component and then continue with mixins.
    if (mixinOrComponent = component.getFirstWith(null, name)) {
      return wrapHelper(bindComponent(mixinOrComponent, mixinOrComponent[name]), templateInstance);
    }
  }
  // A special case to support {{> Foo.Bar}}. This goes through a getTemplateHelper path, but we want to redirect
  // it to the getTemplate path. So we mark it and leave to Spacebars.dot to call getTemplate.
  // TODO: We should provide a BaseComponent.getComponentsNamespace method instead of accessing components directly.
  if (name && name in BlazeComponent.components) {
    return new ComponentsNamespaceReference(name, templateInstance);
  }
  // Maybe a preexisting template helper on the component's base template.
  if (component) {
    // We know that component is really a component.
    if ((helper = (ref1 = component._componentInternals) != null ? (ref2 = ref1.templateBase) != null ? ref2.__helpers.get(name) : void 0 : void 0) != null) {
      return wrapHelper(bindDataContext(helper), templateInstance);
    }
  }
  return null;
};
share.inExpandAttributes = false;
bindComponent = function (component, helper) {
  if (_.isFunction(helper)) {
    return function () {
      var name, result, value;
      for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }
      result = helper.apply(component, args);
      // If we are expanding attributes and this is an object with dynamic attributes,
      // then we want to bind all possible event handlers to the component as well.
      if (share.inExpandAttributes && _.isObject(result)) {
        for (name in result) {
          value = result[name];
          if (share.EVENT_HANDLER_REGEX.test(name)) {
            if (_.isFunction(value)) {
              result[name] = _.bind(value, component);
            } else if (_.isArray(value)) {
              result[name] = _.map(value, function (fun) {
                if (_.isFunction(fun)) {
                  return _.bind(fun, component);
                } else {
                  return fun;
                }
              });
            }
          }
        }
      }
      return result;
    };
  } else {
    return helper;
  }
};
bindDataContext = function (helper) {
  if (_.isFunction(helper)) {
    return function () {
      var data;
      data = Blaze.getData();
      if (data == null) {
        data = {};
      }
      return helper.apply(data, arguments);
    };
  } else {
    return helper;
  }
};
wrapHelper = function (f, templateFunc) {
  if (!Blaze.Template._withTemplateInstanceFunc) {
    // XXX COMPAT WITH METEOR 1.0.3.2
    return Blaze._wrapCatchingExceptions(f, 'template helper');
  }
  if (!_.isFunction(f)) {
    return f;
  }
  return function () {
    var args, self;
    self = this;
    args = arguments;
    return Blaze.Template._withTemplateInstanceFunc(templateFunc, function () {
      return Blaze._wrapCatchingExceptions(f, 'template helper').apply(self, args);
    });
  };
};
if (Blaze.Template._withTemplateInstanceFunc) {
  withTemplateInstanceFunc = Blaze.Template._withTemplateInstanceFunc;
} else {
  // XXX COMPAT WITH METEOR 1.0.3.2.
  withTemplateInstanceFunc = function (templateInstance, f) {
    return f();
  };
}
getTemplateBase = function (component) {
  // We do not allow template to be a reactive method.
  return Tracker.nonreactive(function () {
    var componentTemplate, templateBase;
    componentTemplate = component.template();
    if (_.isString(componentTemplate)) {
      templateBase = Template[componentTemplate];
      if (!templateBase) {
        throw new Error("Template '".concat(componentTemplate, "' cannot be found."));
      }
    } else if (componentTemplate) {
      templateBase = componentTemplate;
    } else {
      throw new Error("Template for the component '".concat(component.componentName() || 'unnamed', "' not provided."));
    }
    return templateBase;
  });
};
callTemplateBaseHooks = function (component, hookName) {
  var callbacks, templateInstance;
  // We want to call template base hooks only when we are calling this function on a component itself.
  if (component !== component.component()) {
    return;
  }
  templateInstance = Tracker.nonreactive(function () {
    return component._componentInternals.templateInstance();
  });
  callbacks = component._componentInternals.templateBase._getCallbacks(hookName);
  Template._withTemplateInstanceFunc(function () {
    return templateInstance;
  }, function () {
    var callback, i, len, results;
    results = [];
    for (i = 0, len = callbacks.length; i < len; i++) {
      callback = callbacks[i];
      results.push(callback.call(templateInstance));
    }
    return results;
  });
};
wrapViewAndTemplate = function (currentView, f) {
  var templateInstance;
  // For template content wrapped inside the block helper, we want to skip the block
  // helper when searching for corresponding template. This means that Template.instance()
  // will return the component's template, while BlazeComponent.currentComponent() will
  // return the component inside.
  templateInstance = getTemplateInstanceFunction(currentView, true);
  // We set template instance to match the current view (mostly, only not when inside
  // the block helper). The latter we use for BlazeComponent.currentComponent(), but
  // it is good that both template instance and current view correspond to each other
  // as much as possible.
  return withTemplateInstanceFunc(templateInstance, function () {
    // We set view based on the current view so that inside event handlers
    // BlazeComponent.currentData() (and Blaze.getData() and Template.currentData())
    // returns data context of event target and not component/template. Moreover,
    // inside event handlers BlazeComponent.currentComponent() returns the component
    // of event target.
    return Blaze._withCurrentView(currentView, function () {
      return f();
    });
  });
};
addEvents = function (view, component) {
  var eventMap, events, eventsList, handler, i, len, spec;
  eventsList = component.events();
  if (!_.isArray(eventsList)) {
    throw new Error("'events' method from the component '".concat(component.componentName() || 'unnamed', "' did not return a list of event maps."));
  }
  for (i = 0, len = eventsList.length; i < len; i++) {
    events = eventsList[i];
    eventMap = {};
    for (spec in events) {
      handler = events[spec];
      (function (spec, handler) {
        return eventMap[spec] = function () {
          for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
            args[_key4] = arguments[_key4];
          }
          var currentView, event;
          event = args[0];
          currentView = Blaze.getView(event.currentTarget);
          wrapViewAndTemplate(currentView, function () {
            return handler.apply(component, args);
          });
        };
      })(spec, handler);
    }
    // Make sure CoffeeScript does not return anything.
    // Returning from event handlers is deprecated.
    Blaze._addEventMap(view, eventMap, view);
  }
};
originalGetTemplate = Blaze._getTemplate;
Blaze._getTemplate = function (name, templateInstance) {
  var template;
  // Blaze.View::lookup should not introduce any reactive dependencies, so we are making sure it is so.
  template = Tracker.nonreactive(function () {
    var parentComponent, ref;
    if (Blaze.currentView) {
      parentComponent = BlazeComponent.currentComponent();
    } else {
      // We do not skip block helpers to assure that when block helpers are used,
      // component tree integrates them nicely into a tree.
      parentComponent = templateInstanceToComponent(templateInstance, false);
    }
    return (ref = BlazeComponent.getComponent(name)) != null ? ref.renderComponent(parentComponent) : void 0;
  });
  if (template && (template instanceof Blaze.Template || _.isFunction(template))) {
    return template;
  }
  return originalGetTemplate(name);
};
registerHooks = function (template, hooks) {
  if (template.onCreated) {
    template.onCreated(hooks.onCreated);
    template.onRendered(hooks.onRendered);
    return template.onDestroyed(hooks.onDestroyed);
  } else {
    // XXX COMPAT WITH METEOR 1.0.3.2.
    template.created = hooks.onCreated;
    template.rendered = hooks.onRendered;
    return template.destroyed = hooks.onDestroyed;
  }
};
registerFirstCreatedHook = function (template, onCreated) {
  var oldCreated;
  if (template._callbacks) {
    return template._callbacks.created.unshift(onCreated);
  } else {
    // XXX COMPAT WITH METEOR 1.0.3.2.
    oldCreated = template.created;
    return template.created = function () {
      onCreated.call(this);
      return oldCreated != null ? oldCreated.call(this) : void 0;
    };
  }
};

// We make Template.dynamic resolve to the component if component name is specified as a template name, and not
// to the non-component template which is probably used only for the content. We simply reuse Blaze._getTemplate.
// TODO: How to pass args?
//       Maybe simply by using Spacebars nested expressions (https://github.com/meteor/meteor/pull/4101)?
//       Template.dynamic template="..." data=(args ...)? But this exposes the fact that args are passed as data context.
//       Maybe we should simply override Template.dynamic and add "args" argument?
// TODO: This can be removed once https://github.com/meteor/meteor/pull/4036 is merged in.
Template.__dynamicWithDataContext.__helpers.set('chooseTemplate', function (name) {
  return Blaze._getTemplate(name, () => {
    return Template.instance();
  });
});
argumentsConstructor = function () {
  // This class should never really be created.
  return assert(false);
};

// TODO: Find a way to pass arguments to the component without having to introduce one intermediary data context into the data context hierarchy.
//       (In fact two data contexts, because we add one more when restoring the original one.)
Template.registerHelper('args', function () {
  var obj;
  obj = {};
  // We use custom constructor to know that it is not a real data context.
  obj.constructor = argumentsConstructor;
  obj._arguments = arguments;
  return obj;
});
share.EVENT_HANDLER_REGEX = /^on[A-Z]/;
share.isEventHandler = function (fun) {
  return _.isFunction(fun) && fun.eventHandler;
};

// When event handlers are provided directly as args they are not passed through
// Spacebars.event by the template compiler, so we have to do it ourselves.
originalFlattenAttributes = HTML.flattenAttributes;
HTML.flattenAttributes = function (attrs) {
  var name, value;
  if (attrs = originalFlattenAttributes(attrs)) {
    for (name in attrs) {
      value = attrs[name];
      if (!share.EVENT_HANDLER_REGEX.test(name)) {
        continue;
      }
      if (share.isEventHandler(value)) {
        // Already processed by Spacebars.event.
        continue;
      }
      if (_.isArray(value) && _.some(value, share.isEventHandler)) {
        continue;
      }
      // When event handlers are provided directly as args,
      // we require them to be just event handlers.
      if (_.isArray(value)) {
        attrs[name] = _.map(value, Spacebars.event);
      } else {
        attrs[name] = Spacebars.event(value);
      }
    }
  }
  return attrs;
};
Spacebars.event = function (eventHandler) {
  for (var _len5 = arguments.length, args = new Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
    args[_key5 - 1] = arguments[_key5];
  }
  var fun;
  if (!_.isFunction(eventHandler)) {
    throw new Error("Event handler not a function: ".concat(eventHandler));
  }
  // Execute all arguments.
  args = Spacebars.mustacheImpl(function () {
    for (var _len6 = arguments.length, xs = new Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
      xs[_key6] = arguments[_key6];
    }
    return xs;
  }, ...args);
  fun = function (event) {
    for (var _len7 = arguments.length, eventArgs = new Array(_len7 > 1 ? _len7 - 1 : 0), _key7 = 1; _key7 < _len7; _key7++) {
      eventArgs[_key7 - 1] = arguments[_key7];
    }
    var currentView;
    currentView = Blaze.getView(event.currentTarget);
    return wrapViewAndTemplate(currentView, function () {
      // We do not have to bind "this" because event handlers are resolved
      // as template helpers and are already bound. We bind event handlers
      // in dynamic attributes already as well.
      return eventHandler.apply(null, [event].concat(args, eventArgs));
    });
  };
  fun.eventHandler = true;
  return fun;
};

// When converting the component to the static HTML, remove all event handlers.
originalVisitTag = HTML.ToHTMLVisitor.prototype.visitTag;
HTML.ToHTMLVisitor.prototype.visitTag = function (tag) {
  var attrs, name;
  if (attrs = tag.attrs) {
    attrs = HTML.flattenAttributes(attrs);
    for (name in attrs) {
      if (share.EVENT_HANDLER_REGEX.test(name)) {
        delete attrs[name];
      }
    }
    tag.attrs = attrs;
  }
  return originalVisitTag.call(this, tag);
};
currentViewIfRendering = function () {
  var view;
  view = Blaze.currentView;
  if (view != null ? view._isInRender : void 0) {
    return view;
  } else {
    return null;
  }
};
contentAsFunc = function (content) {
  if (!_.isFunction(content)) {
    return function () {
      return content;
    };
  }
  return content;
};
contentAsView = function (content) {
  // We do not check content for validity.
  if (content instanceof Blaze.Template) {
    return content.constructView();
  } else if (content instanceof Blaze.View) {
    return content;
  } else {
    return Blaze.View('render', contentAsFunc(content));
  }
};
HTMLJSExpander = Blaze._HTMLJSExpander.extend();
HTMLJSExpander.def({
  // Based on Blaze._HTMLJSExpander, but calls our expandView.
  visitObject: function (x) {
    if (x instanceof Blaze.Template) {
      x = x.constructView();
    }
    if (x instanceof Blaze.View) {
      return expandView(x, this.parentView);
    }
    return HTML.TransformingVisitor.prototype.visitObject.call(this, x);
  }
});

// Based on Blaze._expand, but uses our HTMLJSExpander.
expand = function (htmljs, parentView) {
  parentView = parentView || currentViewIfRendering();
  return new HTMLJSExpander({
    parentView: parentView
  }).visit(htmljs);
};

// Based on Blaze._expandView, but with flushing.
expandView = function (view, parentView) {
  var htmljs, result;
  Blaze._createView(view, parentView, true);
  view._isInRender = true;
  htmljs = Blaze._withCurrentView(view, function () {
    return view._render();
  });
  view._isInRender = false;
  Tracker.flush();
  result = expand(htmljs, view);
  Tracker.flush();
  if (Tracker.active) {
    Tracker.onInvalidate(function () {
      return Blaze._destroyView(view);
    });
  } else {
    Blaze._destroyView(view);
  }
  Tracker.flush();
  return result;
};
BlazeComponent = class BlazeComponent extends BaseComponent {
  // TODO: Figure out how to do at the BaseComponent level?
  static getComponentForElement(domElement) {
    var templateInstance;
    if (!domElement) {
      return null;
    }
    if (domElement.nodeType !== Node.ELEMENT_NODE) {
      // This uses the same check if the argument is a DOM element that Blaze._DOMRange.forElement does.
      throw new Error("Expected DOM element.");
    }
    // For DOM elements we want to return the component which matches the template
    // with that DOM element and not the component closest in the component tree.
    // So we skip the block helpers. (If DOM element is rendered by the block helper
    // this will find that block helper template/component.)
    templateInstance = getTemplateInstanceFunction(Blaze.getView(domElement), true);
    return templateInstanceToComponent(templateInstance, true);
  }
  childComponents(nameOrComponent) {
    var component;
    if ((component = this.component()) !== this) {
      return component.childComponents(nameOrComponent);
    } else {
      return super.childComponents(...arguments);
    }
  }

  // A version of childComponentsWith which knows about mixins.
  // When checking for properties it checks mixins as well.
  childComponentsWith(propertyOrMatcherOrFunction) {
    var component;
    if ((component = this.component()) !== this) {
      return component.childComponentsWith(propertyOrMatcherOrFunction);
    } else {
      assert(propertyOrMatcherOrFunction);
      propertyOrMatcherOrFunction = createMatcher(propertyOrMatcherOrFunction, true);
      return super.childComponentsWith(propertyOrMatcherOrFunction);
    }
  }
  parentComponent(parentComponent) {
    var component;
    if ((component = this.component()) !== this) {
      return component.parentComponent(parentComponent);
    } else {
      return super.parentComponent(...arguments);
    }
  }
  addChildComponent(childComponent) {
    var component;
    if ((component = this.component()) !== this) {
      return component.addChildComponent(childComponent);
    } else {
      return super.addChildComponent(...arguments);
    }
  }
  removeChildComponent(childComponent) {
    var component;
    if ((component = this.component()) !== this) {
      return component.removeChildComponent(childComponent);
    } else {
      return super.removeChildComponent(...arguments);
    }
  }
  mixins() {
    return [];
  }

  // When a component is used as a mixin, createMixins will call this method to set the parent
  // component using this mixin. Extend this method if you want to do any action when parent is
  // set, for example, add dependency mixins to the parent. Make sure you call super as well.
  mixinParent(mixinParent) {
    if (this._componentInternals == null) {
      this._componentInternals = {};
    }
    // Setter.
    if (mixinParent) {
      this._componentInternals.mixinParent = mixinParent;
      // To allow chaining.
      return this;
    }
    // Getter.
    return this._componentInternals.mixinParent || null;
  }
  requireMixin(nameOrMixin) {
    var ref;
    assert((ref = this._componentInternals) != null ? ref.mixins : void 0);
    Tracker.nonreactive(() => {
      var base, component, mixinInstance, mixinInstanceComponent, ref1, ref2, ref3;
      // Do not do anything if mixin is already required. This allows multiple mixins to call requireMixin
      // in mixinParent method to add dependencies, but if dependencies are already there, nothing happens.
      if (this.getMixin(nameOrMixin)) {
        return;
      }
      if (_.isString(nameOrMixin)) {
        // It could be that the component is not a real instance of the BlazeComponent class,
        // so it might not have a constructor pointing back to a BlazeComponent subclass.
        if (this.constructor.getComponent) {
          mixinInstanceComponent = this.constructor.getComponent(nameOrMixin);
        } else {
          mixinInstanceComponent = BlazeComponent.getComponent(nameOrMixin);
        }
        if (!mixinInstanceComponent) {
          throw new Error("Unknown mixin '".concat(nameOrMixin, "'."));
        }
        mixinInstance = new mixinInstanceComponent();
      } else if (_.isFunction(nameOrMixin)) {
        mixinInstance = new nameOrMixin();
      } else {
        mixinInstance = nameOrMixin;
      }
      // We add mixin before we call mixinParent so that dependencies come after this mixin,
      // and that we prevent possible infinite loops because of circular dependencies.
      // TODO: For now we do not provide an official API to add dependencies before the mixin itself.
      this._componentInternals.mixins.push(mixinInstance);
      // We allow mixins to not be components, so methods are not necessary available.

      // Set mixin parent.
      if (mixinInstance.mixinParent) {
        mixinInstance.mixinParent(this);
      }
      if (typeof mixinInstance.createMixins === "function") {
        mixinInstance.createMixins();
      }
      if (component = this.component()) {
        if (component._componentInternals == null) {
          component._componentInternals = {};
        }
        if ((base = component._componentInternals).templateInstance == null) {
          base.templateInstance = new ReactiveField(null, function (a, b) {
            return a === b;
          });
        }
        // If a mixin is adding a dependency using requireMixin after its mixinParent class (for example, in onCreate)
        // and this is this dependency mixin, the view might already be created or rendered and callbacks were
        // already called, so we should call them manually here as well. But only if he view has not been destroyed
        // already. For those mixins we do not call anything, there is little use for them now.
        if (!((ref1 = component._componentInternals.templateInstance()) != null ? ref1.view.isDestroyed : void 0)) {
          if (!component._componentInternals.inOnCreated && ((ref2 = component._componentInternals.templateInstance()) != null ? ref2.view.isCreated : void 0)) {
            if (typeof mixinInstance.onCreated === "function") {
              mixinInstance.onCreated();
            }
          }
          if (!component._componentInternals.inOnRendered && ((ref3 = component._componentInternals.templateInstance()) != null ? ref3.view.isRendered : void 0)) {
            return typeof mixinInstance.onRendered === "function" ? mixinInstance.onRendered() : void 0;
          }
        }
      }
    });
    return this;
  }

  // Method to instantiate all mixins.
  createMixins() {
    var i, len, mixin, ref;
    if (this._componentInternals == null) {
      this._componentInternals = {};
    }
    // To allow calling it multiple times, but non-first calls are simply ignored.
    if (this._componentInternals.mixins) {
      return;
    }
    this._componentInternals.mixins = [];
    ref = this.mixins();
    for (i = 0, len = ref.length; i < len; i++) {
      mixin = ref[i];
      this.requireMixin(mixin);
    }
    return this;
  }
  getMixin(nameOrMixin) {
    if (_.isString(nameOrMixin)) {
      // By passing @ as the first argument, we traverse only mixins.
      return this.getFirstWith(this, (child, parent) => {
        var mixinComponentName;
        // We do not require mixins to be components, but if they are, they can
        // be referenced based on their component name.
        mixinComponentName = (typeof child.componentName === "function" ? child.componentName() : void 0) || null;
        return mixinComponentName && mixinComponentName === nameOrMixin;
      });
    } else {
      // By passing @ as the first argument, we traverse only mixins.
      return this.getFirstWith(this, (child, parent) => {
        if (child.constructor === nameOrMixin) {
          // nameOrMixin is a class.
          return true;
        }
        if (child === nameOrMixin) {
          // nameOrMixin is an instance, or something else.
          return true;
        }
        return false;
      });
    }
  }

  // Calls the component (if afterComponentOrMixin is null) or the first next mixin
  // after afterComponentOrMixin it finds, and returns the result.
  callFirstWith(afterComponentOrMixin, propertyName) {
    var componentOrMixin;
    assert(_.isString(propertyName));
    componentOrMixin = this.getFirstWith(afterComponentOrMixin, propertyName);
    // TODO: Should we throw an error here? Something like calling a function which does not exist?
    if (!componentOrMixin) {
      return;
    }
    // We are not calling callFirstWith on the componentOrMixin because here we
    // are already traversing mixins so we do not recurse once more.
    if (_.isFunction(componentOrMixin[propertyName])) {
      for (var _len8 = arguments.length, args = new Array(_len8 > 2 ? _len8 - 2 : 0), _key8 = 2; _key8 < _len8; _key8++) {
        args[_key8 - 2] = arguments[_key8];
      }
      return componentOrMixin[propertyName](...args);
    } else {
      return componentOrMixin[propertyName];
    }
  }
  getFirstWith(afterComponentOrMixin, propertyOrMatcherOrFunction) {
    var found, i, len, mixin, ref, ref1;
    assert((ref = this._componentInternals) != null ? ref.mixins : void 0);
    assert(propertyOrMatcherOrFunction);
    // Here we are already traversing mixins so we do not recurse once more.
    propertyOrMatcherOrFunction = createMatcher(propertyOrMatcherOrFunction, false);
    // If afterComponentOrMixin is not provided, we start with the component.
    if (!afterComponentOrMixin) {
      if (propertyOrMatcherOrFunction.call(this, this, this)) {
        return this;
      }
      // And continue with mixins.
      found = true;
      // If afterComponentOrMixin is the component, we start with mixins.
    } else if (afterComponentOrMixin && afterComponentOrMixin === this) {
      found = true;
    } else {
      found = false;
    }
    ref1 = this._componentInternals.mixins;
    // TODO: Implement with a map between mixin -> position, so that we do not have to seek to find a mixin.
    for (i = 0, len = ref1.length; i < len; i++) {
      mixin = ref1[i];
      if (found && propertyOrMatcherOrFunction.call(this, mixin, this)) {
        return mixin;
      }
      if (mixin === afterComponentOrMixin) {
        found = true;
      }
    }
    return null;
  }

  // This class method more or less just creates an instance of a component and calls its renderComponent
  // method. But because we want to allow passing arguments to the component in templates, we have some
  // complicated code around to extract and pass those arguments. It is similar to how data context is
  // passed to block helpers. In a data context visible only to the block helper template.
  // TODO: This could be made less hacky. See https://github.com/meteor/meteor/issues/3913
  static renderComponent(parentComponent) {
    return Tracker.nonreactive(() => {
      var componentClass, data;
      componentClass = this;
      if (Blaze.currentView) {
        // We check data context in a non-reactive way, because we want just to peek into it
        // and determine if data context contains component arguments or not. And while
        // component arguments might change through time, the fact that they are there at
        // all or not ("args" template helper was used or not) does not change through time.
        // So we can check that non-reactively.
        data = Template.currentData();
      } else {
        // There is no current view when there is no data context yet, thus also no arguments
        // were provided through "args" template helper, so we just continue normally.
        data = null;
      }
      if ((data != null ? data.constructor : void 0) !== argumentsConstructor) {
        // So that currentComponent in the constructor can return the component
        // inside which this component has been constructed.
        return wrapViewAndTemplate(Blaze.currentView, () => {
          var component;
          component = new componentClass();
          return component.renderComponent(parentComponent);
        });
      }
      return function () {
        // Arguments were provided through "args" template helper.

        // We want to reactively depend on the data context for arguments, so we return a function
        // instead of a template. Function will be run inside an autorun, a reactive context.
        var currentWith, nonreactiveArguments, reactiveArguments;
        assert(Tracker.active);
        // We cannot use Template.getData() inside a normal autorun because current view is not defined inside
        // a normal autorun. But we do not really have to depend reactively on the current view, only on the
        // data context of a known (the closest Blaze.With) view. So we get this view by ourselves.
        currentWith = Blaze.getView('with');
        // By default dataVar in the Blaze.With view uses ReactiveVar with default equality function which
        // sees all objects as different. So invalidations are triggered for every data context assignments
        // even if data has not really changed. This is why wrap it into a ComputedField with EJSON.equals.
        // Because it uses EJSON.equals it will invalidate our function only if really changes.
        // See https://github.com/meteor/meteor/issues/4073
        reactiveArguments = new ComputedField(function () {
          data = currentWith.dataVar.get();
          assert.equal(data != null ? data.constructor : void 0, argumentsConstructor);
          return data._arguments;
        }, EJSON.equals);
        // Here we register a reactive dependency on the ComputedField.
        nonreactiveArguments = reactiveArguments();
        return Tracker.nonreactive(function () {
          var template;
          // Arguments were passed in as a data context. We want currentData in the constructor to return the
          // original (parent) data context. Like we were not passing in arguments as a data context.
          template = Blaze._withCurrentView(Blaze.currentView.parentView.parentView, () => {
            // So that currentComponent in the constructor can return the component
            // inside which this component has been constructed.
            return wrapViewAndTemplate(Blaze.currentView, () => {
              var component;
              // Use arguments for the constructor.
              component = new componentClass(...nonreactiveArguments);
              return component.renderComponent(parentComponent);
            });
          });
          // It has to be the first callback so that other have a correct data context.
          registerFirstCreatedHook(template, function () {
            // Arguments were passed in as a data context. Restore original (parent) data
            // context. Same logic as in Blaze._InOuterTemplateScope.
            this.view.originalParentView = this.view.parentView;
            return this.view.parentView = this.view.parentView.parentView.parentView;
          });
          return template;
        });
      };
    });
  }
  renderComponent(parentComponent) {
    // To make sure we do not introduce any reactive dependency. This is a conscious design decision.
    // Reactivity should be changing data context, but components should be more stable, only changing
    // when structure change in rendered DOM. You can change the component you are including (or pass
    // different arguments) reactively though.
    return Tracker.nonreactive(() => {
      var component, template, templateBase;
      component = this.component();
      // If mixins have not yet been created.
      component.createMixins();
      templateBase = getTemplateBase(component);
      // Create a new component template based on the Blaze template. We want our own template
      // because the same Blaze template could be reused between multiple components.
      // TODO: Should we cache these templates based on (componentName, templateBase) pair? We could use two levels of ES2015 Maps, componentName -> templateBase -> template. What about component arguments changing?
      template = new Blaze.Template("BlazeComponent.".concat(component.componentName() || 'unnamed'), templateBase.renderFunction);
      // We lookup preexisting template helpers in Blaze._getTemplateHelper, if the component does not have
      // a property with the same name. Preexisting event handlers and life-cycle hooks are taken care of
      // in the related methods in the base class.
      if (component._componentInternals == null) {
        component._componentInternals = {};
      }
      component._componentInternals.templateBase = templateBase;
      registerHooks(template, {
        onCreated: function () {
          var base, base1, base2, base3, componentOrMixin, results;
          // @ is a template instance.
          if (parentComponent) {
            // component.parentComponent is reactive, so we use Tracker.nonreactive just to make sure we do not leak any reactivity here.
            Tracker.nonreactive(() => {
              var ref;
              // TODO: Should we support that the same component can be rendered multiple times in parallel? How could we do that? For different component parents or only the same one?
              assert(!component.parentComponent(), "Component '".concat(component.componentName() || 'unnamed', "' parent component '").concat(((ref = component.parentComponent()) != null ? ref.componentName() : void 0) || 'unnamed', "' already set."));
              // We set the parent only when the component is created, not just constructed.
              component.parentComponent(parentComponent);
              return parentComponent.addChildComponent(component);
            });
          }
          this.view._onViewRendered(() => {
            var componentOrMixin, results;
            // Attach events the first time template instance renders.
            if (this.view.renderCount !== 1) {
              return;
            }
            // We first add event handlers from the component, then mixins.
            componentOrMixin = null;
            results = [];
            while (componentOrMixin = this.component.getFirstWith(componentOrMixin, 'events')) {
              results.push(addEvents(this.view, componentOrMixin));
            }
            return results;
          });
          this.component = component;
          // TODO: Should we support that the same component can be rendered multiple times in parallel? How could we do that? For different component parents or only the same one?
          assert(!Tracker.nonreactive(() => {
            var base;
            return typeof (base = this.component._componentInternals).templateInstance === "function" ? base.templateInstance() : void 0;
          }));
          if ((base = this.component._componentInternals).templateInstance == null) {
            base.templateInstance = new ReactiveField(this, function (a, b) {
              return a === b;
            });
          }
          this.component._componentInternals.templateInstance(this);
          if ((base1 = this.component._componentInternals).isCreated == null) {
            base1.isCreated = new ReactiveField(true);
          }
          this.component._componentInternals.isCreated(true);
          // Maybe we are re-rendering the component. So let's initialize variables just to be sure.
          if ((base2 = this.component._componentInternals).isRendered == null) {
            base2.isRendered = new ReactiveField(false);
          }
          this.component._componentInternals.isRendered(false);
          if ((base3 = this.component._componentInternals).isDestroyed == null) {
            base3.isDestroyed = new ReactiveField(false);
          }
          this.component._componentInternals.isDestroyed(false);
          try {
            // We have to know if we should call onCreated on the mixin inside the requireMixin or not. We want to call
            // it only once. If it requireMixin is called from onCreated of another mixin, then it will be added at the
            // end and we will get it here at the end. So we should not call onCreated inside requireMixin because then
            // onCreated would be called twice.
            this.component._componentInternals.inOnCreated = true;
            componentOrMixin = null;
            results = [];
            while (componentOrMixin = this.component.getFirstWith(componentOrMixin, 'onCreated')) {
              results.push(componentOrMixin.onCreated());
            }
            return results;
          } finally {
            delete this.component._componentInternals.inOnCreated;
          }
        },
        onRendered: function () {
          var base, componentOrMixin, results;
          // @ is a template instance.
          if ((base = this.component._componentInternals).isRendered == null) {
            base.isRendered = new ReactiveField(true);
          }
          this.component._componentInternals.isRendered(true);
          Tracker.nonreactive(() => {
            return assert.equal(this.component._componentInternals.isCreated(), true);
          });
          try {
            // Same as for onCreated above.
            this.component._componentInternals.inOnRendered = true;
            componentOrMixin = null;
            results = [];
            while (componentOrMixin = this.component.getFirstWith(componentOrMixin, 'onRendered')) {
              results.push(componentOrMixin.onRendered());
            }
            return results;
          } finally {
            delete this.component._componentInternals.inOnRendered;
          }
        },
        onDestroyed: function () {
          return this.autorun(computation => {
            // @ is a template instance.

            // We wait for all children components to be destroyed first.
            // See https://github.com/meteor/meteor/issues/4166
            if (this.component.childComponents().length) {
              return;
            }
            computation.stop();
            return Tracker.nonreactive(() => {
              var base, base1, componentOrMixin;
              assert.equal(this.component._componentInternals.isCreated(), true);
              this.component._componentInternals.isCreated(false);
              if ((base = this.component._componentInternals).isRendered == null) {
                base.isRendered = new ReactiveField(false);
              }
              this.component._componentInternals.isRendered(false);
              if ((base1 = this.component._componentInternals).isDestroyed == null) {
                base1.isDestroyed = new ReactiveField(true);
              }
              this.component._componentInternals.isDestroyed(true);
              componentOrMixin = null;
              while (componentOrMixin = this.component.getFirstWith(componentOrMixin, 'onDestroyed')) {
                componentOrMixin.onDestroyed();
              }
              if (parentComponent) {
                // The component has been destroyed, clear up the parent.
                component.parentComponent(null);
                parentComponent.removeChildComponent(component);
              }
              // Remove the reference so that it is clear that template instance is not available anymore.
              return this.component._componentInternals.templateInstance(null);
            });
          });
        }
      });
      return template;
    });
  }
  removeComponent() {
    if (this.isRendered()) {
      return Blaze.remove(this.component()._componentInternals.templateInstance().view);
    }
  }
  static _renderComponentTo(visitor, parentComponent, parentView, data) {
    var component;
    component = Tracker.nonreactive(() => {
      var componentClass;
      componentClass = this;
      parentView = parentView || currentViewIfRendering() || (parentComponent != null ? parentComponent.isRendered() : void 0) && parentComponent._componentInternals.templateInstance().view || null;
      return wrapViewAndTemplate(parentView, () => {
        return new componentClass();
      });
    });
    if (arguments.length > 2) {
      return component._renderComponentTo(visitor, parentComponent, parentView, data);
    } else {
      return component._renderComponentTo(visitor, parentComponent, parentView);
    }
  }
  static renderComponentToHTML(parentComponent, parentView, data) {
    if (arguments.length > 2) {
      return this._renderComponentTo(new HTML.ToHTMLVisitor(), parentComponent, parentView, data);
    } else {
      return this._renderComponentTo(new HTML.ToHTMLVisitor(), parentComponent, parentView);
    }
  }
  _renderComponentTo(visitor, parentComponent, parentView, data) {
    var expandedView, template;
    template = Tracker.nonreactive(() => {
      parentView = parentView || currentViewIfRendering() || (parentComponent != null ? parentComponent.isRendered() : void 0) && parentComponent._componentInternals.templateInstance().view || null;
      return wrapViewAndTemplate(parentView, () => {
        return this.component().renderComponent(parentComponent);
      });
    });
    if (arguments.length > 2) {
      expandedView = expandView(Blaze._TemplateWith(data, contentAsFunc(template)), parentView);
    } else {
      expandedView = expandView(contentAsView(template), parentView);
    }
    return visitor.visit(expandedView);
  }
  renderComponentToHTML(parentComponent, parentView, data) {
    if (arguments.length > 2) {
      return this._renderComponentTo(new HTML.ToHTMLVisitor(), parentComponent, parentView, data);
    } else {
      return this._renderComponentTo(new HTML.ToHTMLVisitor(), parentComponent, parentView);
    }
  }
  template() {
    return this.callFirstWith(this, 'template') || this.constructor.componentName();
  }
  onCreated() {
    return callTemplateBaseHooks(this, 'created');
  }
  onRendered() {
    return callTemplateBaseHooks(this, 'rendered');
  }
  onDestroyed() {
    return callTemplateBaseHooks(this, 'destroyed');
  }
  isCreated() {
    var base, component;
    component = this.component();
    if (component._componentInternals == null) {
      component._componentInternals = {};
    }
    if ((base = component._componentInternals).isCreated == null) {
      base.isCreated = new ReactiveField(false);
    }
    return component._componentInternals.isCreated();
  }
  isRendered() {
    var base, component;
    component = this.component();
    if (component._componentInternals == null) {
      component._componentInternals = {};
    }
    if ((base = component._componentInternals).isRendered == null) {
      base.isRendered = new ReactiveField(false);
    }
    return component._componentInternals.isRendered();
  }
  isDestroyed() {
    var base, component;
    component = this.component();
    if (component._componentInternals == null) {
      component._componentInternals = {};
    }
    if ((base = component._componentInternals).isDestroyed == null) {
      base.isDestroyed = new ReactiveField(false);
    }
    return component._componentInternals.isDestroyed();
  }
  insertDOMElement(parent, node, before) {
    if (before == null) {
      before = null;
    }
    if (parent && node && (node.parentNode !== parent || node.nextSibling !== before)) {
      parent.insertBefore(node, before);
    }
  }
  moveDOMElement(parent, node, before) {
    if (before == null) {
      before = null;
    }
    if (parent && node && (node.parentNode !== parent || node.nextSibling !== before)) {
      parent.insertBefore(node, before);
    }
  }
  removeDOMElement(parent, node) {
    if (parent && node && node.parentNode === parent) {
      parent.removeChild(node);
    }
  }
  events() {
    var eventMap, events, handler, i, len, ref, results, spec, templateInstance, view;
    // In mixins there is no reason for a template instance to extend a Blaze template.
    if (this !== this.component()) {
      return [];
    }
    if (this._componentInternals == null) {
      this._componentInternals = {};
    }
    view = Tracker.nonreactive(() => {
      return this._componentInternals.templateInstance().view;
    });
    // We skip block helpers to match Blaze behavior.
    templateInstance = getTemplateInstanceFunction(view, true);
    ref = this._componentInternals.templateBase.__eventMaps;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      events = ref[i];
      eventMap = {};
      for (spec in events) {
        handler = events[spec];
        (function (spec, handler) {
          return eventMap[spec] = function () {
            for (var _len9 = arguments.length, args = new Array(_len9), _key9 = 0; _key9 < _len9; _key9++) {
              args[_key9] = arguments[_key9];
            }
            // In template event handlers view and template instance are not based on the current target
            // (like Blaze Components event handlers are) but it is based on the template-level view.
            // In a way we are reverting here what addEvents does.
            return withTemplateInstanceFunc(templateInstance, function () {
              return Blaze._withCurrentView(view, function () {
                return handler.apply(view, args);
              });
            });
          };
        })(spec, handler);
      }
      results.push(eventMap);
    }
    return results;
  }

  // Component-level data context. Reactive. Use this to always get the
  // top-level data context used to render the component. If path is
  // provided, it returns only the value under that path, with reactivity
  // limited to changes of that value only.
  data(path, equalsFunc) {
    var base, component, ref, view;
    component = this.component();
    if (component._componentInternals == null) {
      component._componentInternals = {};
    }
    if ((base = component._componentInternals).templateInstance == null) {
      base.templateInstance = new ReactiveField(null, function (a, b) {
        return a === b;
      });
    }
    if (view = (ref = component._componentInternals.templateInstance()) != null ? ref.view : void 0) {
      if (path != null) {
        // DataLookup uses internally computed field, which uses view's autorun, but
        // data might be used inside render() method, where it is forbidden to use
        // view's autorun. So we temporary hide the fact that we are inside a view
        // to make computed field use normal autorun.
        return Blaze._withCurrentView(null, () => {
          return DataLookup.get(() => {
            return Blaze.getData(view);
          }, path, equalsFunc);
        });
      } else {
        return Blaze.getData(view);
      }
    }
    return void 0;
  }

  // Caller-level data context. Reactive. Use this to get in event handlers the data
  // context at the place where event originated (target context). In template helpers
  // the data context where template helpers were called. In onCreated, onRendered,
  // and onDestroyed, the same as @data(). Inside a template this is the same as this.
  // If path is provided, it returns only the value under that path, with reactivity
  // limited to changes of that value only. Moreover, if path is provided is also
  // looks into the current lexical scope data.
  static currentData(path, equalsFunc) {
    var currentView;
    if (!Blaze.currentView) {
      return void 0;
    }
    currentView = Blaze.currentView;
    if (_.isString(path)) {
      path = path.split('.');
    } else if (!_.isArray(path)) {
      return Blaze.getData(currentView);
    }
    // DataLookup uses internally computed field, which uses view's autorun, but
    // currentData might be used inside render() method, where it is forbidden to use
    // view's autorun. So we temporary hide the fact that we are inside a view
    // to make computed field use normal autorun.
    return Blaze._withCurrentView(null, () => {
      return DataLookup.get(() => {
        var lexicalData, result;
        if (Blaze._lexicalBindingLookup && (lexicalData = Blaze._lexicalBindingLookup(currentView, path[0]))) {
          // We return custom data object so that we can reuse the same
          // lookup logic for both lexical and the normal data context case.
          result = {};
          result[path[0]] = lexicalData;
          return result;
        }
        return Blaze.getData(currentView);
      }, path, equalsFunc);
    });
  }

  // Method should never be overridden. The implementation should always be exactly the same as class method implementation.
  currentData(path, equalsFunc) {
    return this.constructor.currentData(path, equalsFunc);
  }

  // Useful in templates or mixins to get a reference to the component.
  component() {
    var component, mixinParent;
    component = this;
    while (true) {
      if (!component.mixinParent) {
        // If we are on a mixin without mixinParent, we cannot really get to the component, return null.
        return null;
      }
      if (!(mixinParent = component.mixinParent())) {
        // Return current component unless there is a mixin parent.
        return component;
      }
      component = mixinParent;
    }
  }

  // Caller-level component. In most cases the same as @, but in event handlers
  // it returns the component at the place where event originated (target component).
  // Inside template content wrapped with a block helper component, it is the closest
  // block helper component.
  static currentComponent() {
    var templateInstance;
    // We are not skipping block helpers because one of main reasons for @currentComponent()
    // is that we can get hold of the block helper component instance.
    templateInstance = getTemplateInstanceFunction(Blaze.currentView, false);
    return templateInstanceToComponent(templateInstance, false);
  }

  // Method should never be overridden. The implementation should always be exactly the same as class method implementation.
  currentComponent() {
    return this.constructor.currentComponent();
  }
  firstNode() {
    if (this.isRendered()) {
      return this.component()._componentInternals.templateInstance().view._domrange.firstNode();
    }
    return void 0;
  }
  lastNode() {
    if (this.isRendered()) {
      return this.component()._componentInternals.templateInstance().view._domrange.lastNode();
    }
    return void 0;
  }

  // The same as it would be generated automatically, only that the runFunc gets bound to the component.
  autorun(runFunc) {
    var templateInstance;
    templateInstance = Tracker.nonreactive(() => {
      var ref;
      return (ref = this.component()._componentInternals) != null ? typeof ref.templateInstance === "function" ? ref.templateInstance() : void 0 : void 0;
    });
    if (!templateInstance) {
      throw new Error("The component has to be created before calling 'autorun'.");
    }
    return templateInstance.autorun(_.bind(runFunc, this));
  }
};
SUPPORTS_REACTIVE_INSTANCE = ['subscriptionsReady'];
REQUIRE_RENDERED_INSTANCE = ['$', 'find', 'findAll'];
ref = Blaze.TemplateInstance.prototype;
// We copy utility methods ($, findAll, subscribe, etc.) from the template instance prototype,
// if a method with the same name does not exist already.
for (methodName in ref) {
  method = ref[methodName];
  if (!(methodName in BlazeComponent.prototype)) {
    (function (methodName, method) {
      if (indexOf.call(SUPPORTS_REACTIVE_INSTANCE, methodName) >= 0) {
        return BlazeComponent.prototype[methodName] = function () {
          var base, component, templateInstance;
          component = this.component();
          if (component._componentInternals == null) {
            component._componentInternals = {};
          }
          if ((base = component._componentInternals).templateInstance == null) {
            base.templateInstance = new ReactiveField(null, function (a, b) {
              return a === b;
            });
          }
          if (templateInstance = component._componentInternals.templateInstance()) {
            return templateInstance[methodName](...arguments);
          }
          return void 0;
        };
      } else if (indexOf.call(REQUIRE_RENDERED_INSTANCE, methodName) >= 0) {
        return BlazeComponent.prototype[methodName] = function () {
          if (this.isRendered()) {
            return this.component()._componentInternals.templateInstance()[methodName](...arguments);
          }
          return void 0;
        };
      } else {
        return BlazeComponent.prototype[methodName] = function () {
          var templateInstance;
          templateInstance = Tracker.nonreactive(() => {
            var ref1;
            return (ref1 = this.component()._componentInternals) != null ? typeof ref1.templateInstance === "function" ? ref1.templateInstance() : void 0 : void 0;
          });
          if (!templateInstance) {
            throw new Error("The component has to be created before calling '".concat(methodName, "'."));
          }
          return templateInstance[methodName](...arguments);
        };
      }
    })(methodName, method);
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/peerlibrary_blaze-components/debug.coffee                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var indexOf = [].indexOf;
BlazeComponentDebug = class BlazeComponentDebug extends BaseComponentDebug {
  static startComponent(component) {
    super.startComponent(...arguments);
    return console.log(component.data());
  }
  static startMarkedComponent(component) {
    super.startMarkedComponent(...arguments);
    return console.log(component.data());
  }
  static dumpComponentSubtree(rootComponentOrElement) {
    if ('nodeType' in rootComponentOrElement && rootComponentOrElement.nodeType === Node.ELEMENT_NODE) {
      rootComponentOrElement = BlazeComponent.getComponentForElement(rootComponentOrElement);
    }
    return super.dumpComponentSubtree(...arguments);
  }
  static dumpComponentTree(rootComponentOrElement) {
    if ('nodeType' in rootComponentOrElement && rootComponentOrElement.nodeType === Node.ELEMENT_NODE) {
      rootComponentOrElement = BlazeComponent.getComponentForElement(rootComponentOrElement);
    }
    return super.dumpComponentTree(...arguments);
  }
  static dumpAllComponents() {
    var allRootComponents, j, len, rootComponent;
    allRootComponents = [];
    $('*').each((i, element) => {
      var component, rootComponent;
      component = BlazeComponent.getComponentForElement(element);
      if (!component) {
        return;
      }
      rootComponent = this.componentRoot(component);
      if (indexOf.call(allRootComponents, rootComponent) < 0) {
        return allRootComponents.push(rootComponent);
      }
    });
    for (j = 0, len = allRootComponents.length; j < len; j++) {
      rootComponent = allRootComponents[j];
      this.dumpComponentSubtree(rootComponent);
    }
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/peerlibrary_blaze-components/server.coffee                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
// No-op on the server.
Template.body.renderToDocument = function () {};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("peerlibrary:blaze-components", {
  Template: Template,
  BlazeComponent: BlazeComponent,
  BlazeComponentDebug: BlazeComponentDebug
});

})();

//# sourceURL=meteor://💻app/packages/peerlibrary_blaze-components.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcGVlcmxpYnJhcnlfYmxhemUtY29tcG9uZW50cy90ZW1wbGF0ZS5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3BlZXJsaWJyYXJ5X2JsYXplLWNvbXBvbmVudHMvbGliLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvbGliLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcGVlcmxpYnJhcnlfYmxhemUtY29tcG9uZW50cy9kZWJ1Zy5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL2RlYnVnLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcGVlcmxpYnJhcnlfYmxhemUtY29tcG9uZW50cy9zZXJ2ZXIuY29mZmVlIl0sIm5hbWVzIjpbIlRlbXBsYXRlIiwiQmxhemUiLCJDb21wb25lbnRzTmFtZXNwYWNlUmVmZXJlbmNlIiwiSFRNTEpTRXhwYW5kZXIiLCJSRVFVSVJFX1JFTkRFUkVEX0lOU1RBTkNFIiwiU1VQUE9SVFNfUkVBQ1RJVkVfSU5TVEFOQ0UiLCJhZGRFdmVudHMiLCJhcmd1bWVudHNDb25zdHJ1Y3RvciIsImJpbmRDb21wb25lbnQiLCJiaW5kRGF0YUNvbnRleHQiLCJjYWxsVGVtcGxhdGVCYXNlSG9va3MiLCJjb250ZW50QXNGdW5jIiwiY29udGVudEFzVmlldyIsImNyZWF0ZU1hdGNoZXIiLCJjdXJyZW50Vmlld0lmUmVuZGVyaW5nIiwiZXhwYW5kIiwiZXhwYW5kVmlldyIsImdldFRlbXBsYXRlQmFzZSIsImdldFRlbXBsYXRlSW5zdGFuY2UiLCJnZXRUZW1wbGF0ZUluc3RhbmNlRnVuY3Rpb24iLCJtZXRob2QiLCJtZXRob2ROYW1lIiwib3JpZ2luYWxEb3QiLCJvcmlnaW5hbEZsYXR0ZW5BdHRyaWJ1dGVzIiwib3JpZ2luYWxHZXRUZW1wbGF0ZSIsIm9yaWdpbmFsSW5jbHVkZSIsIm9yaWdpbmFsVmlzaXRUYWciLCJyZWYiLCJyZWdpc3RlckZpcnN0Q3JlYXRlZEhvb2siLCJyZWdpc3Rlckhvb2tzIiwidGVtcGxhdGVJbnN0YW5jZVRvQ29tcG9uZW50Iiwid2l0aFRlbXBsYXRlSW5zdGFuY2VGdW5jIiwid3JhcEhlbHBlciIsIndyYXBWaWV3QW5kVGVtcGxhdGUiLCJpbmRleE9mIiwicHJvcGVydHlPck1hdGNoZXJPckZ1bmN0aW9uIiwiY2hlY2tNaXhpbnMiLCJtYXRjaGVyIiwicHJvcGVydHkiLCJfIiwiaXNTdHJpbmciLCJjaGlsZCIsInBhcmVudCIsImdldEZpcnN0V2l0aCIsImlzRnVuY3Rpb24iLCJhc3NlcnQiLCJpc09iamVjdCIsImNoaWxkV2l0aFByb3BlcnR5IiwidmFsdWUiLCJ2aWV3Iiwic2tpcEJsb2NrSGVscGVycyIsIl90ZW1wbGF0ZUluc3RhbmNlIiwicGFyZW50VmlldyIsIm9yaWdpbmFsUGFyZW50VmlldyIsInRlbXBsYXRlSW5zdGFuY2VGdW5jIiwidGVtcGxhdGVJbnN0YW5jZSIsImNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwibmFtZXNwYWNlIiwidGVtcGxhdGVJbnN0YW5jZTEiLCJTcGFjZWJhcnMiLCJkb3QiLCJhcmdzIiwiX2dldFRlbXBsYXRlIiwiam9pbiIsImluY2x1ZGUiLCJ0ZW1wbGF0ZU9yRnVuY3Rpb24iLCJfZ2V0VGVtcGxhdGVIZWxwZXIiLCJ0ZW1wbGF0ZSIsIm5hbWUiLCJoZWxwZXIiLCJpc0tub3duT2xkU3R5bGVIZWxwZXIiLCJtaXhpbk9yQ29tcG9uZW50IiwicmVmMSIsInJlZjIiLCJfX2hlbHBlcnMiLCJoYXMiLCJnZXQiLCJfT0xEU1RZTEVfSEVMUEVSIiwic2V0IiwiX05PV0FSTl9PTERTVFlMRV9IRUxQRVJTIiwiX3dhcm4iLCJ2aWV3TmFtZSIsIlRyYWNrZXIiLCJub25yZWFjdGl2ZSIsIkJsYXplQ29tcG9uZW50IiwiY29tcG9uZW50cyIsIl9jb21wb25lbnRJbnRlcm5hbHMiLCJ0ZW1wbGF0ZUJhc2UiLCJzaGFyZSIsImluRXhwYW5kQXR0cmlidXRlcyIsInJlc3VsdCIsImFwcGx5IiwiRVZFTlRfSEFORExFUl9SRUdFWCIsInRlc3QiLCJiaW5kIiwiaXNBcnJheSIsIm1hcCIsImZ1biIsImRhdGEiLCJnZXREYXRhIiwiYXJndW1lbnRzIiwiZiIsInRlbXBsYXRlRnVuYyIsIl93aXRoVGVtcGxhdGVJbnN0YW5jZUZ1bmMiLCJfd3JhcENhdGNoaW5nRXhjZXB0aW9ucyIsInNlbGYiLCJjb21wb25lbnRUZW1wbGF0ZSIsIkVycm9yIiwiY29tcG9uZW50TmFtZSIsImhvb2tOYW1lIiwiY2FsbGJhY2tzIiwiX2dldENhbGxiYWNrcyIsImNhbGxiYWNrIiwiaSIsImxlbiIsInJlc3VsdHMiLCJsZW5ndGgiLCJwdXNoIiwiY2FsbCIsImN1cnJlbnRWaWV3IiwiX3dpdGhDdXJyZW50VmlldyIsImV2ZW50TWFwIiwiZXZlbnRzIiwiZXZlbnRzTGlzdCIsImhhbmRsZXIiLCJzcGVjIiwiZXZlbnQiLCJnZXRWaWV3IiwiY3VycmVudFRhcmdldCIsIl9hZGRFdmVudE1hcCIsInBhcmVudENvbXBvbmVudCIsImN1cnJlbnRDb21wb25lbnQiLCJnZXRDb21wb25lbnQiLCJyZW5kZXJDb21wb25lbnQiLCJob29rcyIsIm9uQ3JlYXRlZCIsIm9uUmVuZGVyZWQiLCJvbkRlc3Ryb3llZCIsImNyZWF0ZWQiLCJyZW5kZXJlZCIsImRlc3Ryb3llZCIsIm9sZENyZWF0ZWQiLCJfY2FsbGJhY2tzIiwidW5zaGlmdCIsIl9fZHluYW1pY1dpdGhEYXRhQ29udGV4dCIsImluc3RhbmNlIiwicmVnaXN0ZXJIZWxwZXIiLCJvYmoiLCJfYXJndW1lbnRzIiwiaXNFdmVudEhhbmRsZXIiLCJldmVudEhhbmRsZXIiLCJIVE1MIiwiZmxhdHRlbkF0dHJpYnV0ZXMiLCJhdHRycyIsInNvbWUiLCJtdXN0YWNoZUltcGwiLCJ4cyIsImV2ZW50QXJncyIsImNvbmNhdCIsIlRvSFRNTFZpc2l0b3IiLCJwcm90b3R5cGUiLCJ2aXNpdFRhZyIsInRhZyIsIl9pc0luUmVuZGVyIiwiY29udGVudCIsImNvbnN0cnVjdFZpZXciLCJWaWV3IiwiX0hUTUxKU0V4cGFuZGVyIiwiZXh0ZW5kIiwiZGVmIiwidmlzaXRPYmplY3QiLCJ4IiwiVHJhbnNmb3JtaW5nVmlzaXRvciIsImh0bWxqcyIsInZpc2l0IiwiX2NyZWF0ZVZpZXciLCJfcmVuZGVyIiwiZmx1c2giLCJhY3RpdmUiLCJvbkludmFsaWRhdGUiLCJfZGVzdHJveVZpZXciLCJCYXNlQ29tcG9uZW50IiwiZ2V0Q29tcG9uZW50Rm9yRWxlbWVudCIsImRvbUVsZW1lbnQiLCJub2RlVHlwZSIsIk5vZGUiLCJFTEVNRU5UX05PREUiLCJjaGlsZENvbXBvbmVudHMiLCJuYW1lT3JDb21wb25lbnQiLCJjaGlsZENvbXBvbmVudHNXaXRoIiwiYWRkQ2hpbGRDb21wb25lbnQiLCJjaGlsZENvbXBvbmVudCIsInJlbW92ZUNoaWxkQ29tcG9uZW50IiwibWl4aW5zIiwibWl4aW5QYXJlbnQiLCJyZXF1aXJlTWl4aW4iLCJuYW1lT3JNaXhpbiIsImJhc2UiLCJtaXhpbkluc3RhbmNlIiwibWl4aW5JbnN0YW5jZUNvbXBvbmVudCIsInJlZjMiLCJnZXRNaXhpbiIsImNyZWF0ZU1peGlucyIsIlJlYWN0aXZlRmllbGQiLCJhIiwiYiIsImlzRGVzdHJveWVkIiwiaW5PbkNyZWF0ZWQiLCJpc0NyZWF0ZWQiLCJpbk9uUmVuZGVyZWQiLCJpc1JlbmRlcmVkIiwibWl4aW4iLCJtaXhpbkNvbXBvbmVudE5hbWUiLCJjYWxsRmlyc3RXaXRoIiwiYWZ0ZXJDb21wb25lbnRPck1peGluIiwicHJvcGVydHlOYW1lIiwiY29tcG9uZW50T3JNaXhpbiIsImZvdW5kIiwiY29tcG9uZW50Q2xhc3MiLCJjdXJyZW50RGF0YSIsImN1cnJlbnRXaXRoIiwibm9ucmVhY3RpdmVBcmd1bWVudHMiLCJyZWFjdGl2ZUFyZ3VtZW50cyIsIkNvbXB1dGVkRmllbGQiLCJkYXRhVmFyIiwiZXF1YWwiLCJFSlNPTiIsImVxdWFscyIsInJlbmRlckZ1bmN0aW9uIiwiYmFzZTEiLCJiYXNlMiIsImJhc2UzIiwiX29uVmlld1JlbmRlcmVkIiwicmVuZGVyQ291bnQiLCJhdXRvcnVuIiwiY29tcHV0YXRpb24iLCJzdG9wIiwicmVtb3ZlQ29tcG9uZW50IiwicmVtb3ZlIiwiX3JlbmRlckNvbXBvbmVudFRvIiwidmlzaXRvciIsInJlbmRlckNvbXBvbmVudFRvSFRNTCIsImV4cGFuZGVkVmlldyIsIl9UZW1wbGF0ZVdpdGgiLCJpbnNlcnRET01FbGVtZW50Iiwibm9kZSIsImJlZm9yZSIsInBhcmVudE5vZGUiLCJuZXh0U2libGluZyIsImluc2VydEJlZm9yZSIsIm1vdmVET01FbGVtZW50IiwicmVtb3ZlRE9NRWxlbWVudCIsInJlbW92ZUNoaWxkIiwiX19ldmVudE1hcHMiLCJwYXRoIiwiZXF1YWxzRnVuYyIsIkRhdGFMb29rdXAiLCJzcGxpdCIsImxleGljYWxEYXRhIiwiX2xleGljYWxCaW5kaW5nTG9va3VwIiwiZmlyc3ROb2RlIiwiX2RvbXJhbmdlIiwibGFzdE5vZGUiLCJydW5GdW5jIiwiVGVtcGxhdGVJbnN0YW5jZSIsIkJsYXplQ29tcG9uZW50RGVidWciLCJCYXNlQ29tcG9uZW50RGVidWciLCJzdGFydENvbXBvbmVudCIsImNvbnNvbGUiLCJsb2ciLCJzdGFydE1hcmtlZENvbXBvbmVudCIsImR1bXBDb21wb25lbnRTdWJ0cmVlIiwicm9vdENvbXBvbmVudE9yRWxlbWVudCIsImR1bXBDb21wb25lbnRUcmVlIiwiZHVtcEFsbENvbXBvbmVudHMiLCJhbGxSb290Q29tcG9uZW50cyIsImoiLCJyb290Q29tcG9uZW50IiwiJCIsImVhY2giLCJlbGVtZW50IiwiY29tcG9uZW50Um9vdCIsImJvZHkiLCJyZW5kZXJUb0RvY3VtZW50Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsUUFBQSxHQUFXQyxLQUFLLENBQUNELFFBQUEsQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7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QUprQjtFQU1BLE9BQW5COEssaUJBQW1CO0lBQ2xCLElBQUFDLGlCQUFBLEVBQUFDLENBQUEsRUFBQWxLLEdBQUEsRUFBQW1LLGFBQUE7SUFBQUYsaUJBQUEsR0FBb0I7SUFFcEJHLENBQUEsQ0FBRSxHQUFGLENBQU0sQ0FBQ0MsSUFBUCxDQUFZLENBQUN0SyxDQUFELEVBQUl1SyxPQUFKO01BQ1YsSUFBQWpPLFNBQUEsRUFBQThOLGFBQUE7TUFBQTlOLFNBQUEsR0FBWTZCLGNBQWMsQ0FBQ2tHLHNCQUFmLENBQXNDa0csT0FBdEM7TUFDWixLQUFjak8sU0FBZDtRQUFBO01DUUE7TURQQThOLGFBQUEsR0FBZ0IsSUFBQyxDQUFBSSxhQUFELENBQWVsTyxTQUFmO01BQ2hCLElBQTRDdEIsT0FBQSxDQUFBcUYsSUFBQSxDQUFpQjZKLGlCQUFqQixFQUFBRSxhQUFBLEtBQTVDO1FDU0UsT0RURkYsaUJBQWlCLENBQUM5SixJQUFsQixDQUF1QmdLLGFBQXZCO01DVUE7SURkVSxDQUFaO0lBTUEsS0FBQUQsQ0FBQSxNQUFBbEssR0FBQSxHQUFBaUssaUJBQUEsQ0FBQS9KLE1BQUEsRUFBQWdLLENBQUEsR0FBQWxLLEdBQUEsRUFBQWtLLENBQUE7TUNXRUMsYUFBYSxHQUFHRixpQkFBaUIsQ0FBQ0MsQ0FBQyxDQUFDO01EVnBDLElBQUMsQ0FBQUwsb0JBQUQsQ0FBc0JNLGFBQXRCO0lBREY7RUFUa0I7QUF2QnRCLEU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUVBQTtBQUNBdFIsUUFBUSxDQUFDMlIsSUFBSSxDQUFDQyxnQkFBZCxHQUFpQyxlIiwiZmlsZSI6Ii9wYWNrYWdlcy9wZWVybGlicmFyeV9ibGF6ZS1jb21wb25lbnRzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiVGVtcGxhdGUgPSBCbGF6ZS5UZW1wbGF0ZVxuIiwiIyBUT0RPOiBEZWR1cGxpY2F0ZSBiZXR3ZWVuIGJsYXplIGNvbXBvbmVudCBhbmQgY29tbW9uIGNvbXBvbmVudCBwYWNrYWdlcy5cbmNyZWF0ZU1hdGNoZXIgPSAocHJvcGVydHlPck1hdGNoZXJPckZ1bmN0aW9uLCBjaGVja01peGlucykgLT5cbiAgaWYgXy5pc1N0cmluZyBwcm9wZXJ0eU9yTWF0Y2hlck9yRnVuY3Rpb25cbiAgICBwcm9wZXJ0eSA9IHByb3BlcnR5T3JNYXRjaGVyT3JGdW5jdGlvblxuICAgIHByb3BlcnR5T3JNYXRjaGVyT3JGdW5jdGlvbiA9IChjaGlsZCwgcGFyZW50KSA9PlxuICAgICAgIyBJZiBjaGlsZCBpcyBwYXJlbnQsIHdlIG1pZ2h0IGdldCBpbnRvIGFuIGluZmluaXRlIGxvb3AgaWYgdGhpcyBpc1xuICAgICAgIyBjYWxsZWQgZnJvbSBnZXRGaXJzdFdpdGgsIHNvIGluIHRoYXQgY2FzZSB3ZSBkbyBub3QgdXNlIGdldEZpcnN0V2l0aC5cbiAgICAgIGlmIGNoZWNrTWl4aW5zIGFuZCBjaGlsZCBpc250IHBhcmVudCBhbmQgY2hpbGQuZ2V0Rmlyc3RXaXRoXG4gICAgICAgICEhY2hpbGQuZ2V0Rmlyc3RXaXRoIG51bGwsIHByb3BlcnR5XG4gICAgICBlbHNlXG4gICAgICAgIHByb3BlcnR5IG9mIGNoaWxkXG5cbiAgZWxzZSBpZiBub3QgXy5pc0Z1bmN0aW9uIHByb3BlcnR5T3JNYXRjaGVyT3JGdW5jdGlvblxuICAgIGFzc2VydCBfLmlzT2JqZWN0IHByb3BlcnR5T3JNYXRjaGVyT3JGdW5jdGlvblxuICAgIG1hdGNoZXIgPSBwcm9wZXJ0eU9yTWF0Y2hlck9yRnVuY3Rpb25cbiAgICBwcm9wZXJ0eU9yTWF0Y2hlck9yRnVuY3Rpb24gPSAoY2hpbGQsIHBhcmVudCkgPT5cbiAgICAgIGZvciBwcm9wZXJ0eSwgdmFsdWUgb2YgbWF0Y2hlclxuICAgICAgICAjIElmIGNoaWxkIGlzIHBhcmVudCwgd2UgbWlnaHQgZ2V0IGludG8gYW4gaW5maW5pdGUgbG9vcCBpZiB0aGlzIGlzXG4gICAgICAgICMgY2FsbGVkIGZyb20gZ2V0Rmlyc3RXaXRoLCBzbyBpbiB0aGF0IGNhc2Ugd2UgZG8gbm90IHVzZSBnZXRGaXJzdFdpdGguXG4gICAgICAgIGlmIGNoZWNrTWl4aW5zIGFuZCBjaGlsZCBpc250IHBhcmVudCBhbmQgY2hpbGQuZ2V0Rmlyc3RXaXRoXG4gICAgICAgICAgY2hpbGRXaXRoUHJvcGVydHkgPSBjaGlsZC5nZXRGaXJzdFdpdGggbnVsbCwgcHJvcGVydHlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGNoaWxkV2l0aFByb3BlcnR5ID0gY2hpbGQgaWYgcHJvcGVydHkgb2YgY2hpbGRcbiAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyBjaGlsZFdpdGhQcm9wZXJ0eVxuXG4gICAgICAgIGlmIF8uaXNGdW5jdGlvbiBjaGlsZFdpdGhQcm9wZXJ0eVtwcm9wZXJ0eV1cbiAgICAgICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIGNoaWxkV2l0aFByb3BlcnR5W3Byb3BlcnR5XSgpIGlzIHZhbHVlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIGNoaWxkV2l0aFByb3BlcnR5W3Byb3BlcnR5XSBpcyB2YWx1ZVxuXG4gICAgICB0cnVlXG5cbiAgcHJvcGVydHlPck1hdGNoZXJPckZ1bmN0aW9uXG5cbmdldFRlbXBsYXRlSW5zdGFuY2UgPSAodmlldywgc2tpcEJsb2NrSGVscGVycykgLT5cbiAgd2hpbGUgdmlldyBhbmQgbm90IHZpZXcuX3RlbXBsYXRlSW5zdGFuY2VcbiAgICBpZiBza2lwQmxvY2tIZWxwZXJzXG4gICAgICB2aWV3ID0gdmlldy5wYXJlbnRWaWV3XG4gICAgZWxzZVxuICAgICAgdmlldyA9IHZpZXcub3JpZ2luYWxQYXJlbnRWaWV3IG9yIHZpZXcucGFyZW50Vmlld1xuXG4gIHZpZXc/Ll90ZW1wbGF0ZUluc3RhbmNlXG5cbiMgTW9yZSBvciBsZXNzIHRoZSBzYW1lIGFzIGFsZGVlZDp0ZW1wbGF0ZS1leHRlbnNpb24ncyB0ZW1wbGF0ZS5nZXQoJ2NvbXBvbmVudCcpIGp1c3Qgc3BlY2lhbGl6ZWQuXG4jIEl0IGFsbG93cyB1cyB0byBub3QgaGF2ZSBhIGRlcGVuZGVuY3kgb24gdGVtcGxhdGUtZXh0ZW5zaW9uIHBhY2thZ2UgYW5kIHRoYXQgd2UgY2FuIHdvcmsgd2l0aCBJcm9uXG4jIFJvdXRlciB3aGljaCBoYXMgaXRzIG93biBEeW5hbWljVGVtcGxhdGUgY2xhc3Mgd2hpY2ggaXMgbm90IHBhdGNoZWQgYnkgdGVtcGxhdGUtZXh0ZW5zaW9uIGFuZCB0aHVzXG4jIGRvZXMgbm90IGhhdmUgLmdldCgpIG1ldGhvZC5cbnRlbXBsYXRlSW5zdGFuY2VUb0NvbXBvbmVudCA9ICh0ZW1wbGF0ZUluc3RhbmNlRnVuYywgc2tpcEJsb2NrSGVscGVycykgLT5cbiAgdGVtcGxhdGVJbnN0YW5jZSA9IHRlbXBsYXRlSW5zdGFuY2VGdW5jPygpXG5cbiAgIyBJcm9uIFJvdXRlciB1c2VzIGl0cyBvd24gRHluYW1pY1RlbXBsYXRlIHdoaWNoIGlzIG5vdCBhIHByb3BlciB0ZW1wbGF0ZSBpbnN0YW5jZSwgYnV0IGl0IGlzXG4gICMgcGFzc2VkIGluIGFzIHN1Y2gsIHNvIHdlIHdhbnQgdG8gZmluZCB0aGUgcmVhbCBvbmUgYmVmb3JlIHdlIHN0YXJ0IHNlYXJjaGluZyBmb3IgdGhlIGNvbXBvbmVudC5cbiAgdGVtcGxhdGVJbnN0YW5jZSA9IGdldFRlbXBsYXRlSW5zdGFuY2UgdGVtcGxhdGVJbnN0YW5jZT8udmlldywgc2tpcEJsb2NrSGVscGVyc1xuXG4gIHdoaWxlIHRlbXBsYXRlSW5zdGFuY2VcbiAgICByZXR1cm4gdGVtcGxhdGVJbnN0YW5jZS5jb21wb25lbnQgaWYgJ2NvbXBvbmVudCcgb2YgdGVtcGxhdGVJbnN0YW5jZVxuXG4gICAgaWYgc2tpcEJsb2NrSGVscGVyc1xuICAgICAgdGVtcGxhdGVJbnN0YW5jZSA9IGdldFRlbXBsYXRlSW5zdGFuY2UgdGVtcGxhdGVJbnN0YW5jZS52aWV3LnBhcmVudFZpZXcsIHNraXBCbG9ja0hlbHBlcnNcbiAgICBlbHNlXG4gICAgICB0ZW1wbGF0ZUluc3RhbmNlID0gZ2V0VGVtcGxhdGVJbnN0YW5jZSAodGVtcGxhdGVJbnN0YW5jZS52aWV3Lm9yaWdpbmFsUGFyZW50VmlldyBvciB0ZW1wbGF0ZUluc3RhbmNlLnZpZXcucGFyZW50VmlldyksIHNraXBCbG9ja0hlbHBlcnNcblxuICBudWxsXG5cbmdldFRlbXBsYXRlSW5zdGFuY2VGdW5jdGlvbiA9ICh2aWV3LCBza2lwQmxvY2tIZWxwZXJzKSAtPlxuICB0ZW1wbGF0ZUluc3RhbmNlID0gZ2V0VGVtcGxhdGVJbnN0YW5jZSB2aWV3LCBza2lwQmxvY2tIZWxwZXJzXG4gIC0+XG4gICAgdGVtcGxhdGVJbnN0YW5jZVxuXG5jbGFzcyBDb21wb25lbnRzTmFtZXNwYWNlUmVmZXJlbmNlXG4gIGNvbnN0cnVjdG9yOiAoQG5hbWVzcGFjZSwgQHRlbXBsYXRlSW5zdGFuY2UpIC0+XG5cbiMgV2UgZXh0ZW5kIHRoZSBvcmlnaW5hbCBkb3Qgb3BlcmF0b3IgdG8gc3VwcG9ydCB7ez4gRm9vLkJhcn19LiBUaGlzIGdvZXMgdGhyb3VnaCBhIGdldFRlbXBsYXRlSGVscGVyIHBhdGgsIGJ1dFxuIyB3ZSB3YW50IHRvIHJlZGlyZWN0IGl0IHRvIHRoZSBnZXRUZW1wbGF0ZSBwYXRoLiBTbyB3ZSBtYXJrIGl0IGluIGdldFRlbXBsYXRlSGVscGVyIGFuZCB0aGVuIGhlcmUgY2FsbCBnZXRUZW1wbGF0ZS5cbm9yaWdpbmFsRG90ID0gU3BhY2ViYXJzLmRvdFxuU3BhY2ViYXJzLmRvdCA9ICh2YWx1ZSwgYXJncy4uLikgLT5cbiAgaWYgdmFsdWUgaW5zdGFuY2VvZiBDb21wb25lbnRzTmFtZXNwYWNlUmVmZXJlbmNlXG4gICAgcmV0dXJuIEJsYXplLl9nZXRUZW1wbGF0ZSBcIiN7dmFsdWUubmFtZXNwYWNlfS4je2FyZ3Muam9pbiAnLid9XCIsIHZhbHVlLnRlbXBsYXRlSW5zdGFuY2VcblxuICBvcmlnaW5hbERvdCB2YWx1ZSwgYXJncy4uLlxuXG5vcmlnaW5hbEluY2x1ZGUgPSBTcGFjZWJhcnMuaW5jbHVkZVxuU3BhY2ViYXJzLmluY2x1ZGUgPSAodGVtcGxhdGVPckZ1bmN0aW9uLCBhcmdzLi4uKSAtPlxuICAjIElmIENvbXBvbmVudHNOYW1lc3BhY2VSZWZlcmVuY2UgZ2V0cyBhbGwgdGhlIHdheSB0byB0aGUgU3BhY2ViYXJzLmluY2x1ZGUgaXQgbWVhbnMgdGhhdCB3ZSBhcmUgaW4gdGhlIHNpdHVhdGlvblxuICAjIHdoZXJlIHRoZXJlIGlzIGJvdGggbmFtZXNwYWNlIGFuZCBjb21wb25lbnQgd2l0aCB0aGUgc2FtZSBuYW1lLCBhbmQgdXNlciBpcyBpbmNsdWRpbmcgYSBjb21wb25lbnQuIEJ1dCBuYW1lc3BhY2VcbiAgIyByZWZlcmVuY2UgaXMgY3JlYXRlZCBpbnN0ZWFkIChiZWNhdXNlIHdlIGRvIG5vdCBrbm93IGluIGFkdmFuY2UgdGhhdCB0aGVyZSBpcyBubyBTcGFjZWJhcnMuZG90IGNhbGwgYXJvdW5kIGxvb2t1cFxuICAjIGNhbGwpLiBTbyB3ZSBkZXJlZmVyZW5jZSB0aGUgcmVmZXJlbmNlIGFuZCB0cnkgdG8gcmVzb2x2ZSBhIHRlbXBsYXRlLiBPZiBjb3Vyc2UsIGEgY29tcG9uZW50IG1pZ2h0IG5vdCByZWFsbHkgZXhpc3QuXG4gIGlmIHRlbXBsYXRlT3JGdW5jdGlvbiBpbnN0YW5jZW9mIENvbXBvbmVudHNOYW1lc3BhY2VSZWZlcmVuY2VcbiAgICB0ZW1wbGF0ZU9yRnVuY3Rpb24gPSBCbGF6ZS5fZ2V0VGVtcGxhdGUgdGVtcGxhdGVPckZ1bmN0aW9uLm5hbWVzcGFjZSwgdGVtcGxhdGVPckZ1bmN0aW9uLnRlbXBsYXRlSW5zdGFuY2VcblxuICBvcmlnaW5hbEluY2x1ZGUgdGVtcGxhdGVPckZ1bmN0aW9uLCBhcmdzLi4uXG5cbiMgV2Ugb3ZlcnJpZGUgdGhlIG9yaWdpbmFsIGxvb2t1cCBtZXRob2Qgd2l0aCBhIHNpbWlsYXIgb25lLCB3aGljaCBzdXBwb3J0cyBjb21wb25lbnRzIGFzIHdlbGwuXG4jXG4jIE5vdyB0aGUgb3JkZXIgb2YgdGhlIGxvb2t1cCB3aWxsIGJlLCBpbiBvcmRlcjpcbiMgICBhIGhlbHBlciBvZiB0aGUgY3VycmVudCB0ZW1wbGF0ZVxuIyAgIGEgcHJvcGVydHkgb2YgdGhlIGN1cnJlbnQgY29tcG9uZW50IChub3QgdGhlIEJsYXplQ29tcG9uZW50LmN1cnJlbnRDb21wb25lbnQoKSB0aG91Z2gsIGJ1dCBAY29tcG9uZW50KCkpXG4jICAgYSBoZWxwZXIgb2YgdGhlIGN1cnJlbnQgY29tcG9uZW50J3MgYmFzZSB0ZW1wbGF0ZSAobm90IHRoZSBCbGF6ZUNvbXBvbmVudC5jdXJyZW50Q29tcG9uZW50KCkgdGhvdWdoLCBidXQgQGNvbXBvbmVudCgpKVxuIyAgIHRoZSBuYW1lIG9mIGEgY29tcG9uZW50XG4jICAgdGhlIG5hbWUgb2YgYSB0ZW1wbGF0ZVxuIyAgIGdsb2JhbCBoZWxwZXJcbiMgICBhIHByb3BlcnR5IG9mIHRoZSBkYXRhIGNvbnRleHRcbiNcbiMgUmV0dXJucyBhIGZ1bmN0aW9uLCBhIG5vbi1mdW5jdGlvbiB2YWx1ZSwgb3IgbnVsbC4gSWYgYSBmdW5jdGlvbiBpcyBmb3VuZCwgaXQgaXMgYm91bmQgYXBwcm9wcmlhdGVseS5cbiNcbiMgTk9URTogVGhpcyBmdW5jdGlvbiBtdXN0IG5vdCBlc3RhYmxpc2ggYW55IHJlYWN0aXZlIGRlcGVuZGVuY2llcyBpdHNlbGYuICBJZiB0aGVyZSBpcyBhbnkgcmVhY3Rpdml0eVxuIyBpbiB0aGUgdmFsdWUsIGxvb2t1cCBzaG91bGQgcmV0dXJuIGEgZnVuY3Rpb24uXG4jXG4jIFRPRE86IFNob3VsZCB3ZSBhbHNvIGxvb2t1cCBmb3IgYSBwcm9wZXJ0eSBvZiB0aGUgY29tcG9uZW50LWxldmVsIGRhdGEgY29udGV4dCAoYW5kIHRlbXBsYXRlLWxldmVsIGRhdGEgY29udGV4dCk/XG5cbkJsYXplLl9nZXRUZW1wbGF0ZUhlbHBlciA9ICh0ZW1wbGF0ZSwgbmFtZSwgdGVtcGxhdGVJbnN0YW5jZSkgLT5cbiAgaXNLbm93bk9sZFN0eWxlSGVscGVyID0gZmFsc2VcbiAgaWYgdGVtcGxhdGUuX19oZWxwZXJzLmhhcyBuYW1lXG4gICAgaGVscGVyID0gdGVtcGxhdGUuX19oZWxwZXJzLmdldCBuYW1lXG4gICAgaWYgaGVscGVyIGlzIEJsYXplLl9PTERTVFlMRV9IRUxQRVJcbiAgICAgIGlzS25vd25PbGRTdHlsZUhlbHBlciA9IHRydWVcbiAgICBlbHNlIGlmIGhlbHBlcj9cbiAgICAgIHJldHVybiB3cmFwSGVscGVyIGJpbmREYXRhQ29udGV4dChoZWxwZXIpLCB0ZW1wbGF0ZUluc3RhbmNlXG4gICAgZWxzZVxuICAgICAgcmV0dXJuIG51bGxcblxuICAjIE9sZC1zdHlsZSBoZWxwZXIuXG4gIGlmIG5hbWUgb2YgdGVtcGxhdGVcbiAgICAjIE9ubHkgd2FybiBvbmNlIHBlciBoZWxwZXIuXG4gICAgdW5sZXNzIGlzS25vd25PbGRTdHlsZUhlbHBlclxuICAgICAgdGVtcGxhdGUuX19oZWxwZXJzLnNldCBuYW1lLCBCbGF6ZS5fT0xEU1RZTEVfSEVMUEVSXG4gICAgICB1bmxlc3MgdGVtcGxhdGUuX05PV0FSTl9PTERTVFlMRV9IRUxQRVJTXG4gICAgICAgIEJsYXplLl93YXJuIFwiQXNzaWduaW5nIGhlbHBlciB3aXRoIGBcIiArIHRlbXBsYXRlLnZpZXdOYW1lICsgXCIuXCIgKyBuYW1lICsgXCIgPSAuLi5gIGlzIGRlcHJlY2F0ZWQuICBVc2UgYFwiICsgdGVtcGxhdGUudmlld05hbWUgKyBcIi5oZWxwZXJzKC4uLilgIGluc3RlYWQuXCJcbiAgICBpZiB0ZW1wbGF0ZVtuYW1lXT9cbiAgICAgIHJldHVybiB3cmFwSGVscGVyIGJpbmREYXRhQ29udGV4dCh0ZW1wbGF0ZVtuYW1lXSksIHRlbXBsYXRlSW5zdGFuY2VcbiAgICBlbHNlXG4gICAgICByZXR1cm4gbnVsbFxuXG4gIHJldHVybiBudWxsIHVubGVzcyB0ZW1wbGF0ZUluc3RhbmNlXG5cbiAgIyBEbyBub3QgcmVzb2x2ZSBjb21wb25lbnQgaGVscGVycyBpZiBpbnNpZGUgVGVtcGxhdGUuZHluYW1pYy4gVGhlIHJlYXNvbiBpcyB0aGF0IFRlbXBsYXRlLmR5bmFtaWMgdXNlcyBhIGRhdGEgY29udGV4dFxuICAjIHZhbHVlIHdpdGggbmFtZSBcInRlbXBsYXRlXCIgaW50ZXJuYWxseS4gQnV0IHdoZW4gdXNlZCBpbnNpZGUgYSBjb21wb25lbnQgdGhlIGRhdGEgY29udGV4dCBsb29rdXAgaXMgdGhlbiByZXNvbHZlZFxuICAjIGludG8gYSBjdXJyZW50IGNvbXBvbmVudCdzIHRlbXBsYXRlIG1ldGhvZCBhbmQgbm90IHRoZSBkYXRhIGNvbnRleHQgXCJ0ZW1wbGF0ZVwiLiBUbyBmb3JjZSB0aGUgZGF0YSBjb250ZXh0IHJlc29sdmluZ1xuICAjIFRlbXBsYXRlLmR5bmFtaWMgc2hvdWxkIHVzZSBcInRoaXMudGVtcGxhdGVcIiBpbiBpdHMgdGVtcGxhdGVzLCBidXQgaXQgZG9lcyBub3QsIHNvIHdlIGhhdmUgYSBzcGVjaWFsIGNhc2UgaGVyZSBmb3IgaXQuXG4gIHJldHVybiBudWxsIGlmIHRlbXBsYXRlLnZpZXdOYW1lIGluIFsnVGVtcGxhdGUuX19keW5hbWljV2l0aERhdGFDb250ZXh0JywgJ1RlbXBsYXRlLl9fZHluYW1pYyddXG5cbiAgIyBCbGF6ZS5WaWV3Ojpsb29rdXAgc2hvdWxkIG5vdCBpbnRyb2R1Y2UgYW55IHJlYWN0aXZlIGRlcGVuZGVuY2llcywgYnV0IHdlIGNhbiBzaW1wbHkgaWdub3JlIHJlYWN0aXZpdHkgaGVyZSBiZWNhdXNlXG4gICMgdGVtcGxhdGUgaW5zdGFuY2UgcHJvYmFibHkgY2Fubm90IGNoYW5nZSB3aXRob3V0IHJlY29uc3RydWN0aW5nIHRoZSBjb21wb25lbnQgYXMgd2VsbC5cbiAgY29tcG9uZW50ID0gVHJhY2tlci5ub25yZWFjdGl2ZSAtPlxuICAgICMgV2Ugd2FudCB0byBza2lwIGFueSBibG9jayBoZWxwZXIuIHt7bWV0aG9kfX0gc2hvdWxkIHJlc29sdmUgdG9cbiAgICAjIHt7Y29tcG9uZW50Lm1ldGhvZH19IGFuZCBub3QgdG8ge3tjdXJyZW50Q29tcG9uZW50Lm1ldGhvZH19LlxuICAgIHRlbXBsYXRlSW5zdGFuY2VUb0NvbXBvbmVudCB0ZW1wbGF0ZUluc3RhbmNlLCB0cnVlXG5cbiAgIyBDb21wb25lbnQuXG4gIGlmIGNvbXBvbmVudFxuICAgICMgVGhpcyB3aWxsIGZpcnN0IHNlYXJjaCBvbiB0aGUgY29tcG9uZW50IGFuZCB0aGVuIGNvbnRpbnVlIHdpdGggbWl4aW5zLlxuICAgIGlmIG1peGluT3JDb21wb25lbnQgPSBjb21wb25lbnQuZ2V0Rmlyc3RXaXRoIG51bGwsIG5hbWVcbiAgICAgIHJldHVybiB3cmFwSGVscGVyIGJpbmRDb21wb25lbnQobWl4aW5PckNvbXBvbmVudCwgbWl4aW5PckNvbXBvbmVudFtuYW1lXSksIHRlbXBsYXRlSW5zdGFuY2VcblxuICAjIEEgc3BlY2lhbCBjYXNlIHRvIHN1cHBvcnQge3s+IEZvby5CYXJ9fS4gVGhpcyBnb2VzIHRocm91Z2ggYSBnZXRUZW1wbGF0ZUhlbHBlciBwYXRoLCBidXQgd2Ugd2FudCB0byByZWRpcmVjdFxuICAjIGl0IHRvIHRoZSBnZXRUZW1wbGF0ZSBwYXRoLiBTbyB3ZSBtYXJrIGl0IGFuZCBsZWF2ZSB0byBTcGFjZWJhcnMuZG90IHRvIGNhbGwgZ2V0VGVtcGxhdGUuXG4gICMgVE9ETzogV2Ugc2hvdWxkIHByb3ZpZGUgYSBCYXNlQ29tcG9uZW50LmdldENvbXBvbmVudHNOYW1lc3BhY2UgbWV0aG9kIGluc3RlYWQgb2YgYWNjZXNzaW5nIGNvbXBvbmVudHMgZGlyZWN0bHkuXG4gIGlmIG5hbWUgYW5kIG5hbWUgb2YgQmxhemVDb21wb25lbnQuY29tcG9uZW50c1xuICAgIHJldHVybiBuZXcgQ29tcG9uZW50c05hbWVzcGFjZVJlZmVyZW5jZSBuYW1lLCB0ZW1wbGF0ZUluc3RhbmNlXG5cbiAgIyBNYXliZSBhIHByZWV4aXN0aW5nIHRlbXBsYXRlIGhlbHBlciBvbiB0aGUgY29tcG9uZW50J3MgYmFzZSB0ZW1wbGF0ZS5cbiAgaWYgY29tcG9uZW50XG4gICAgIyBXZSBrbm93IHRoYXQgY29tcG9uZW50IGlzIHJlYWxseSBhIGNvbXBvbmVudC5cbiAgICBpZiAoaGVscGVyID0gY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHM/LnRlbXBsYXRlQmFzZT8uX19oZWxwZXJzLmdldCBuYW1lKT9cbiAgICAgIHJldHVybiB3cmFwSGVscGVyIGJpbmREYXRhQ29udGV4dChoZWxwZXIpLCB0ZW1wbGF0ZUluc3RhbmNlXG5cbiAgbnVsbFxuXG5zaGFyZS5pbkV4cGFuZEF0dHJpYnV0ZXMgPSBmYWxzZVxuXG5iaW5kQ29tcG9uZW50ID0gKGNvbXBvbmVudCwgaGVscGVyKSAtPlxuICBpZiBfLmlzRnVuY3Rpb24gaGVscGVyXG4gICAgKGFyZ3MuLi4pIC0+XG4gICAgICByZXN1bHQgPSBoZWxwZXIuYXBwbHkgY29tcG9uZW50LCBhcmdzXG5cbiAgICAgICMgSWYgd2UgYXJlIGV4cGFuZGluZyBhdHRyaWJ1dGVzIGFuZCB0aGlzIGlzIGFuIG9iamVjdCB3aXRoIGR5bmFtaWMgYXR0cmlidXRlcyxcbiAgICAgICMgdGhlbiB3ZSB3YW50IHRvIGJpbmQgYWxsIHBvc3NpYmxlIGV2ZW50IGhhbmRsZXJzIHRvIHRoZSBjb21wb25lbnQgYXMgd2VsbC5cbiAgICAgIGlmIHNoYXJlLmluRXhwYW5kQXR0cmlidXRlcyBhbmQgXy5pc09iamVjdCByZXN1bHRcbiAgICAgICAgZm9yIG5hbWUsIHZhbHVlIG9mIHJlc3VsdCB3aGVuIHNoYXJlLkVWRU5UX0hBTkRMRVJfUkVHRVgudGVzdCBuYW1lXG4gICAgICAgICAgaWYgXy5pc0Z1bmN0aW9uIHZhbHVlXG4gICAgICAgICAgICByZXN1bHRbbmFtZV0gPSBfLmJpbmQgdmFsdWUsIGNvbXBvbmVudFxuICAgICAgICAgIGVsc2UgaWYgXy5pc0FycmF5IHZhbHVlXG4gICAgICAgICAgICByZXN1bHRbbmFtZV0gPSBfLm1hcCB2YWx1ZSwgKGZ1bikgLT5cbiAgICAgICAgICAgICAgaWYgXy5pc0Z1bmN0aW9uIGZ1blxuICAgICAgICAgICAgICAgIF8uYmluZCBmdW4sIGNvbXBvbmVudFxuICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgZnVuXG5cbiAgICAgIHJlc3VsdFxuICBlbHNlXG4gICAgaGVscGVyXG5cbmJpbmREYXRhQ29udGV4dCA9IChoZWxwZXIpIC0+XG4gIGlmIF8uaXNGdW5jdGlvbiBoZWxwZXJcbiAgICAtPlxuICAgICAgZGF0YSA9IEJsYXplLmdldERhdGEoKVxuICAgICAgZGF0YSA/PSB7fVxuICAgICAgaGVscGVyLmFwcGx5IGRhdGEsIGFyZ3VtZW50c1xuICBlbHNlXG4gICAgaGVscGVyXG5cbndyYXBIZWxwZXIgPSAoZiwgdGVtcGxhdGVGdW5jKSAtPlxuICAjIFhYWCBDT01QQVQgV0lUSCBNRVRFT1IgMS4wLjMuMlxuICByZXR1cm4gQmxhemUuX3dyYXBDYXRjaGluZ0V4Y2VwdGlvbnMgZiwgJ3RlbXBsYXRlIGhlbHBlcicgdW5sZXNzIEJsYXplLlRlbXBsYXRlLl93aXRoVGVtcGxhdGVJbnN0YW5jZUZ1bmNcblxuICByZXR1cm4gZiB1bmxlc3MgXy5pc0Z1bmN0aW9uIGZcblxuICAtPlxuICAgIHNlbGYgPSBAXG4gICAgYXJncyA9IGFyZ3VtZW50c1xuXG4gICAgQmxhemUuVGVtcGxhdGUuX3dpdGhUZW1wbGF0ZUluc3RhbmNlRnVuYyB0ZW1wbGF0ZUZ1bmMsIC0+XG4gICAgICBCbGF6ZS5fd3JhcENhdGNoaW5nRXhjZXB0aW9ucyhmLCAndGVtcGxhdGUgaGVscGVyJykuYXBwbHkgc2VsZiwgYXJnc1xuXG5pZiBCbGF6ZS5UZW1wbGF0ZS5fd2l0aFRlbXBsYXRlSW5zdGFuY2VGdW5jXG4gIHdpdGhUZW1wbGF0ZUluc3RhbmNlRnVuYyA9IEJsYXplLlRlbXBsYXRlLl93aXRoVGVtcGxhdGVJbnN0YW5jZUZ1bmNcbmVsc2VcbiAgIyBYWFggQ09NUEFUIFdJVEggTUVURU9SIDEuMC4zLjIuXG4gIHdpdGhUZW1wbGF0ZUluc3RhbmNlRnVuYyA9ICh0ZW1wbGF0ZUluc3RhbmNlLCBmKSAtPlxuICAgIGYoKVxuXG5nZXRUZW1wbGF0ZUJhc2UgPSAoY29tcG9uZW50KSAtPlxuICAjIFdlIGRvIG5vdCBhbGxvdyB0ZW1wbGF0ZSB0byBiZSBhIHJlYWN0aXZlIG1ldGhvZC5cbiAgVHJhY2tlci5ub25yZWFjdGl2ZSAtPlxuICAgIGNvbXBvbmVudFRlbXBsYXRlID0gY29tcG9uZW50LnRlbXBsYXRlKClcbiAgICBpZiBfLmlzU3RyaW5nIGNvbXBvbmVudFRlbXBsYXRlXG4gICAgICB0ZW1wbGF0ZUJhc2UgPSBUZW1wbGF0ZVtjb21wb25lbnRUZW1wbGF0ZV1cbiAgICAgIHRocm93IG5ldyBFcnJvciBcIlRlbXBsYXRlICcje2NvbXBvbmVudFRlbXBsYXRlfScgY2Fubm90IGJlIGZvdW5kLlwiIHVubGVzcyB0ZW1wbGF0ZUJhc2VcbiAgICBlbHNlIGlmIGNvbXBvbmVudFRlbXBsYXRlXG4gICAgICB0ZW1wbGF0ZUJhc2UgPSBjb21wb25lbnRUZW1wbGF0ZVxuICAgIGVsc2VcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIlRlbXBsYXRlIGZvciB0aGUgY29tcG9uZW50ICcje2NvbXBvbmVudC5jb21wb25lbnROYW1lKCkgb3IgJ3VubmFtZWQnfScgbm90IHByb3ZpZGVkLlwiXG5cbiAgICB0ZW1wbGF0ZUJhc2VcblxuY2FsbFRlbXBsYXRlQmFzZUhvb2tzID0gKGNvbXBvbmVudCwgaG9va05hbWUpIC0+XG4gICMgV2Ugd2FudCB0byBjYWxsIHRlbXBsYXRlIGJhc2UgaG9va3Mgb25seSB3aGVuIHdlIGFyZSBjYWxsaW5nIHRoaXMgZnVuY3Rpb24gb24gYSBjb21wb25lbnQgaXRzZWxmLlxuICByZXR1cm4gdW5sZXNzIGNvbXBvbmVudCBpcyBjb21wb25lbnQuY29tcG9uZW50KClcblxuICB0ZW1wbGF0ZUluc3RhbmNlID0gVHJhY2tlci5ub25yZWFjdGl2ZSAtPlxuICAgIGNvbXBvbmVudC5fY29tcG9uZW50SW50ZXJuYWxzLnRlbXBsYXRlSW5zdGFuY2UoKVxuICBjYWxsYmFja3MgPSBjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscy50ZW1wbGF0ZUJhc2UuX2dldENhbGxiYWNrcyBob29rTmFtZVxuICBUZW1wbGF0ZS5fd2l0aFRlbXBsYXRlSW5zdGFuY2VGdW5jKFxuICAgIC0+XG4gICAgICB0ZW1wbGF0ZUluc3RhbmNlXG4gICxcbiAgICAtPlxuICAgICAgZm9yIGNhbGxiYWNrIGluIGNhbGxiYWNrc1xuICAgICAgICBjYWxsYmFjay5jYWxsIHRlbXBsYXRlSW5zdGFuY2VcbiAgKVxuXG4gIHJldHVyblxuXG53cmFwVmlld0FuZFRlbXBsYXRlID0gKGN1cnJlbnRWaWV3LCBmKSAtPlxuICAjIEZvciB0ZW1wbGF0ZSBjb250ZW50IHdyYXBwZWQgaW5zaWRlIHRoZSBibG9jayBoZWxwZXIsIHdlIHdhbnQgdG8gc2tpcCB0aGUgYmxvY2tcbiAgIyBoZWxwZXIgd2hlbiBzZWFyY2hpbmcgZm9yIGNvcnJlc3BvbmRpbmcgdGVtcGxhdGUuIFRoaXMgbWVhbnMgdGhhdCBUZW1wbGF0ZS5pbnN0YW5jZSgpXG4gICMgd2lsbCByZXR1cm4gdGhlIGNvbXBvbmVudCdzIHRlbXBsYXRlLCB3aGlsZSBCbGF6ZUNvbXBvbmVudC5jdXJyZW50Q29tcG9uZW50KCkgd2lsbFxuICAjIHJldHVybiB0aGUgY29tcG9uZW50IGluc2lkZS5cbiAgdGVtcGxhdGVJbnN0YW5jZSA9IGdldFRlbXBsYXRlSW5zdGFuY2VGdW5jdGlvbiBjdXJyZW50VmlldywgdHJ1ZVxuXG4gICMgV2Ugc2V0IHRlbXBsYXRlIGluc3RhbmNlIHRvIG1hdGNoIHRoZSBjdXJyZW50IHZpZXcgKG1vc3RseSwgb25seSBub3Qgd2hlbiBpbnNpZGVcbiAgIyB0aGUgYmxvY2sgaGVscGVyKS4gVGhlIGxhdHRlciB3ZSB1c2UgZm9yIEJsYXplQ29tcG9uZW50LmN1cnJlbnRDb21wb25lbnQoKSwgYnV0XG4gICMgaXQgaXMgZ29vZCB0aGF0IGJvdGggdGVtcGxhdGUgaW5zdGFuY2UgYW5kIGN1cnJlbnQgdmlldyBjb3JyZXNwb25kIHRvIGVhY2ggb3RoZXJcbiAgIyBhcyBtdWNoIGFzIHBvc3NpYmxlLlxuICB3aXRoVGVtcGxhdGVJbnN0YW5jZUZ1bmMgdGVtcGxhdGVJbnN0YW5jZSwgLT5cbiAgICAjIFdlIHNldCB2aWV3IGJhc2VkIG9uIHRoZSBjdXJyZW50IHZpZXcgc28gdGhhdCBpbnNpZGUgZXZlbnQgaGFuZGxlcnNcbiAgICAjIEJsYXplQ29tcG9uZW50LmN1cnJlbnREYXRhKCkgKGFuZCBCbGF6ZS5nZXREYXRhKCkgYW5kIFRlbXBsYXRlLmN1cnJlbnREYXRhKCkpXG4gICAgIyByZXR1cm5zIGRhdGEgY29udGV4dCBvZiBldmVudCB0YXJnZXQgYW5kIG5vdCBjb21wb25lbnQvdGVtcGxhdGUuIE1vcmVvdmVyLFxuICAgICMgaW5zaWRlIGV2ZW50IGhhbmRsZXJzIEJsYXplQ29tcG9uZW50LmN1cnJlbnRDb21wb25lbnQoKSByZXR1cm5zIHRoZSBjb21wb25lbnRcbiAgICAjIG9mIGV2ZW50IHRhcmdldC5cbiAgICBCbGF6ZS5fd2l0aEN1cnJlbnRWaWV3IGN1cnJlbnRWaWV3LCAtPlxuICAgICAgZigpXG5cbmFkZEV2ZW50cyA9ICh2aWV3LCBjb21wb25lbnQpIC0+XG4gIGV2ZW50c0xpc3QgPSBjb21wb25lbnQuZXZlbnRzKClcblxuICB0aHJvdyBuZXcgRXJyb3IgXCInZXZlbnRzJyBtZXRob2QgZnJvbSB0aGUgY29tcG9uZW50ICcje2NvbXBvbmVudC5jb21wb25lbnROYW1lKCkgb3IgJ3VubmFtZWQnfScgZGlkIG5vdCByZXR1cm4gYSBsaXN0IG9mIGV2ZW50IG1hcHMuXCIgdW5sZXNzIF8uaXNBcnJheSBldmVudHNMaXN0XG5cbiAgZm9yIGV2ZW50cyBpbiBldmVudHNMaXN0XG4gICAgZXZlbnRNYXAgPSB7fVxuXG4gICAgZm9yIHNwZWMsIGhhbmRsZXIgb2YgZXZlbnRzXG4gICAgICBkbyAoc3BlYywgaGFuZGxlcikgLT5cbiAgICAgICAgZXZlbnRNYXBbc3BlY10gPSAoYXJncy4uLikgLT5cbiAgICAgICAgICBldmVudCA9IGFyZ3NbMF1cblxuICAgICAgICAgIGN1cnJlbnRWaWV3ID0gQmxhemUuZ2V0VmlldyBldmVudC5jdXJyZW50VGFyZ2V0XG4gICAgICAgICAgd3JhcFZpZXdBbmRUZW1wbGF0ZSBjdXJyZW50VmlldywgLT5cbiAgICAgICAgICAgIGhhbmRsZXIuYXBwbHkgY29tcG9uZW50LCBhcmdzXG5cbiAgICAgICAgICAjIE1ha2Ugc3VyZSBDb2ZmZWVTY3JpcHQgZG9lcyBub3QgcmV0dXJuIGFueXRoaW5nLlxuICAgICAgICAgICMgUmV0dXJuaW5nIGZyb20gZXZlbnQgaGFuZGxlcnMgaXMgZGVwcmVjYXRlZC5cbiAgICAgICAgICByZXR1cm5cblxuICAgIEJsYXplLl9hZGRFdmVudE1hcCB2aWV3LCBldmVudE1hcCwgdmlld1xuXG4gIHJldHVyblxuXG5vcmlnaW5hbEdldFRlbXBsYXRlID0gQmxhemUuX2dldFRlbXBsYXRlXG5CbGF6ZS5fZ2V0VGVtcGxhdGUgPSAobmFtZSwgdGVtcGxhdGVJbnN0YW5jZSkgLT5cbiAgIyBCbGF6ZS5WaWV3Ojpsb29rdXAgc2hvdWxkIG5vdCBpbnRyb2R1Y2UgYW55IHJlYWN0aXZlIGRlcGVuZGVuY2llcywgc28gd2UgYXJlIG1ha2luZyBzdXJlIGl0IGlzIHNvLlxuICB0ZW1wbGF0ZSA9IFRyYWNrZXIubm9ucmVhY3RpdmUgLT5cbiAgICBpZiBCbGF6ZS5jdXJyZW50Vmlld1xuICAgICAgcGFyZW50Q29tcG9uZW50ID0gQmxhemVDb21wb25lbnQuY3VycmVudENvbXBvbmVudCgpXG4gICAgZWxzZVxuICAgICAgIyBXZSBkbyBub3Qgc2tpcCBibG9jayBoZWxwZXJzIHRvIGFzc3VyZSB0aGF0IHdoZW4gYmxvY2sgaGVscGVycyBhcmUgdXNlZCxcbiAgICAgICMgY29tcG9uZW50IHRyZWUgaW50ZWdyYXRlcyB0aGVtIG5pY2VseSBpbnRvIGEgdHJlZS5cbiAgICAgIHBhcmVudENvbXBvbmVudCA9IHRlbXBsYXRlSW5zdGFuY2VUb0NvbXBvbmVudCB0ZW1wbGF0ZUluc3RhbmNlLCBmYWxzZVxuXG4gICAgQmxhemVDb21wb25lbnQuZ2V0Q29tcG9uZW50KG5hbWUpPy5yZW5kZXJDb21wb25lbnQgcGFyZW50Q29tcG9uZW50XG4gIHJldHVybiB0ZW1wbGF0ZSBpZiB0ZW1wbGF0ZSBhbmQgKHRlbXBsYXRlIGluc3RhbmNlb2YgQmxhemUuVGVtcGxhdGUgb3IgXy5pc0Z1bmN0aW9uIHRlbXBsYXRlKVxuXG4gIG9yaWdpbmFsR2V0VGVtcGxhdGUgbmFtZVxuXG5yZWdpc3Rlckhvb2tzID0gKHRlbXBsYXRlLCBob29rcykgLT5cbiAgaWYgdGVtcGxhdGUub25DcmVhdGVkXG4gICAgdGVtcGxhdGUub25DcmVhdGVkIGhvb2tzLm9uQ3JlYXRlZFxuICAgIHRlbXBsYXRlLm9uUmVuZGVyZWQgaG9va3Mub25SZW5kZXJlZFxuICAgIHRlbXBsYXRlLm9uRGVzdHJveWVkIGhvb2tzLm9uRGVzdHJveWVkXG4gIGVsc2VcbiAgICAjIFhYWCBDT01QQVQgV0lUSCBNRVRFT1IgMS4wLjMuMi5cbiAgICB0ZW1wbGF0ZS5jcmVhdGVkID0gaG9va3Mub25DcmVhdGVkXG4gICAgdGVtcGxhdGUucmVuZGVyZWQgPSBob29rcy5vblJlbmRlcmVkXG4gICAgdGVtcGxhdGUuZGVzdHJveWVkID0gaG9va3Mub25EZXN0cm95ZWRcblxucmVnaXN0ZXJGaXJzdENyZWF0ZWRIb29rID0gKHRlbXBsYXRlLCBvbkNyZWF0ZWQpIC0+XG4gIGlmIHRlbXBsYXRlLl9jYWxsYmFja3NcbiAgICB0ZW1wbGF0ZS5fY2FsbGJhY2tzLmNyZWF0ZWQudW5zaGlmdCBvbkNyZWF0ZWRcbiAgZWxzZVxuICAgICMgWFhYIENPTVBBVCBXSVRIIE1FVEVPUiAxLjAuMy4yLlxuICAgIG9sZENyZWF0ZWQgPSB0ZW1wbGF0ZS5jcmVhdGVkXG4gICAgdGVtcGxhdGUuY3JlYXRlZCA9IC0+XG4gICAgICBvbkNyZWF0ZWQuY2FsbCBAXG4gICAgICBvbGRDcmVhdGVkPy5jYWxsIEBcblxuIyBXZSBtYWtlIFRlbXBsYXRlLmR5bmFtaWMgcmVzb2x2ZSB0byB0aGUgY29tcG9uZW50IGlmIGNvbXBvbmVudCBuYW1lIGlzIHNwZWNpZmllZCBhcyBhIHRlbXBsYXRlIG5hbWUsIGFuZCBub3RcbiMgdG8gdGhlIG5vbi1jb21wb25lbnQgdGVtcGxhdGUgd2hpY2ggaXMgcHJvYmFibHkgdXNlZCBvbmx5IGZvciB0aGUgY29udGVudC4gV2Ugc2ltcGx5IHJldXNlIEJsYXplLl9nZXRUZW1wbGF0ZS5cbiMgVE9ETzogSG93IHRvIHBhc3MgYXJncz9cbiMgICAgICAgTWF5YmUgc2ltcGx5IGJ5IHVzaW5nIFNwYWNlYmFycyBuZXN0ZWQgZXhwcmVzc2lvbnMgKGh0dHBzOi8vZ2l0aHViLmNvbS9tZXRlb3IvbWV0ZW9yL3B1bGwvNDEwMSk/XG4jICAgICAgIFRlbXBsYXRlLmR5bmFtaWMgdGVtcGxhdGU9XCIuLi5cIiBkYXRhPShhcmdzIC4uLik/IEJ1dCB0aGlzIGV4cG9zZXMgdGhlIGZhY3QgdGhhdCBhcmdzIGFyZSBwYXNzZWQgYXMgZGF0YSBjb250ZXh0LlxuIyAgICAgICBNYXliZSB3ZSBzaG91bGQgc2ltcGx5IG92ZXJyaWRlIFRlbXBsYXRlLmR5bmFtaWMgYW5kIGFkZCBcImFyZ3NcIiBhcmd1bWVudD9cbiMgVE9ETzogVGhpcyBjYW4gYmUgcmVtb3ZlZCBvbmNlIGh0dHBzOi8vZ2l0aHViLmNvbS9tZXRlb3IvbWV0ZW9yL3B1bGwvNDAzNiBpcyBtZXJnZWQgaW4uXG5UZW1wbGF0ZS5fX2R5bmFtaWNXaXRoRGF0YUNvbnRleHQuX19oZWxwZXJzLnNldCAnY2hvb3NlVGVtcGxhdGUnLCAobmFtZSkgLT5cbiAgQmxhemUuX2dldFRlbXBsYXRlIG5hbWUsID0+XG4gICAgVGVtcGxhdGUuaW5zdGFuY2UoKVxuXG5hcmd1bWVudHNDb25zdHJ1Y3RvciA9IC0+XG4gICMgVGhpcyBjbGFzcyBzaG91bGQgbmV2ZXIgcmVhbGx5IGJlIGNyZWF0ZWQuXG4gIGFzc2VydCBmYWxzZVxuXG4jIFRPRE86IEZpbmQgYSB3YXkgdG8gcGFzcyBhcmd1bWVudHMgdG8gdGhlIGNvbXBvbmVudCB3aXRob3V0IGhhdmluZyB0byBpbnRyb2R1Y2Ugb25lIGludGVybWVkaWFyeSBkYXRhIGNvbnRleHQgaW50byB0aGUgZGF0YSBjb250ZXh0IGhpZXJhcmNoeS5cbiMgICAgICAgKEluIGZhY3QgdHdvIGRhdGEgY29udGV4dHMsIGJlY2F1c2Ugd2UgYWRkIG9uZSBtb3JlIHdoZW4gcmVzdG9yaW5nIHRoZSBvcmlnaW5hbCBvbmUuKVxuVGVtcGxhdGUucmVnaXN0ZXJIZWxwZXIgJ2FyZ3MnLCAtPlxuICBvYmogPSB7fVxuICAjIFdlIHVzZSBjdXN0b20gY29uc3RydWN0b3IgdG8ga25vdyB0aGF0IGl0IGlzIG5vdCBhIHJlYWwgZGF0YSBjb250ZXh0LlxuICBvYmouY29uc3RydWN0b3IgPSBhcmd1bWVudHNDb25zdHJ1Y3RvclxuICBvYmouX2FyZ3VtZW50cyA9IGFyZ3VtZW50c1xuICBvYmpcblxuc2hhcmUuRVZFTlRfSEFORExFUl9SRUdFWCA9IC9eb25bQS1aXS9cblxuc2hhcmUuaXNFdmVudEhhbmRsZXIgPSAoZnVuKSAtPlxuICBfLmlzRnVuY3Rpb24oZnVuKSBhbmQgZnVuLmV2ZW50SGFuZGxlclxuXG4jIFdoZW4gZXZlbnQgaGFuZGxlcnMgYXJlIHByb3ZpZGVkIGRpcmVjdGx5IGFzIGFyZ3MgdGhleSBhcmUgbm90IHBhc3NlZCB0aHJvdWdoXG4jIFNwYWNlYmFycy5ldmVudCBieSB0aGUgdGVtcGxhdGUgY29tcGlsZXIsIHNvIHdlIGhhdmUgdG8gZG8gaXQgb3Vyc2VsdmVzLlxub3JpZ2luYWxGbGF0dGVuQXR0cmlidXRlcyA9IEhUTUwuZmxhdHRlbkF0dHJpYnV0ZXNcbkhUTUwuZmxhdHRlbkF0dHJpYnV0ZXMgPSAoYXR0cnMpIC0+XG4gIGlmIGF0dHJzID0gb3JpZ2luYWxGbGF0dGVuQXR0cmlidXRlcyBhdHRyc1xuICAgIGZvciBuYW1lLCB2YWx1ZSBvZiBhdHRycyB3aGVuIHNoYXJlLkVWRU5UX0hBTkRMRVJfUkVHRVgudGVzdCBuYW1lXG4gICAgICAjIEFscmVhZHkgcHJvY2Vzc2VkIGJ5IFNwYWNlYmFycy5ldmVudC5cbiAgICAgIGNvbnRpbnVlIGlmIHNoYXJlLmlzRXZlbnRIYW5kbGVyIHZhbHVlXG4gICAgICBjb250aW51ZSBpZiBfLmlzQXJyYXkodmFsdWUpIGFuZCBfLnNvbWUgdmFsdWUsIHNoYXJlLmlzRXZlbnRIYW5kbGVyXG5cbiAgICAgICMgV2hlbiBldmVudCBoYW5kbGVycyBhcmUgcHJvdmlkZWQgZGlyZWN0bHkgYXMgYXJncyxcbiAgICAgICMgd2UgcmVxdWlyZSB0aGVtIHRvIGJlIGp1c3QgZXZlbnQgaGFuZGxlcnMuXG4gICAgICBpZiBfLmlzQXJyYXkgdmFsdWVcbiAgICAgICAgYXR0cnNbbmFtZV0gPSBfLm1hcCB2YWx1ZSwgU3BhY2ViYXJzLmV2ZW50XG4gICAgICBlbHNlXG4gICAgICAgIGF0dHJzW25hbWVdID0gU3BhY2ViYXJzLmV2ZW50IHZhbHVlXG5cbiAgYXR0cnNcblxuU3BhY2ViYXJzLmV2ZW50ID0gKGV2ZW50SGFuZGxlciwgYXJncy4uLikgLT5cbiAgdGhyb3cgbmV3IEVycm9yIFwiRXZlbnQgaGFuZGxlciBub3QgYSBmdW5jdGlvbjogI3tldmVudEhhbmRsZXJ9XCIgdW5sZXNzIF8uaXNGdW5jdGlvbiBldmVudEhhbmRsZXJcblxuICAjIEV4ZWN1dGUgYWxsIGFyZ3VtZW50cy5cbiAgYXJncyA9IFNwYWNlYmFycy5tdXN0YWNoZUltcGwgKCh4cy4uLikgLT4geHMpLCBhcmdzLi4uXG5cbiAgZnVuID0gKGV2ZW50LCBldmVudEFyZ3MuLi4pIC0+XG4gICAgY3VycmVudFZpZXcgPSBCbGF6ZS5nZXRWaWV3IGV2ZW50LmN1cnJlbnRUYXJnZXRcbiAgICB3cmFwVmlld0FuZFRlbXBsYXRlIGN1cnJlbnRWaWV3LCAtPlxuICAgICAgIyBXZSBkbyBub3QgaGF2ZSB0byBiaW5kIFwidGhpc1wiIGJlY2F1c2UgZXZlbnQgaGFuZGxlcnMgYXJlIHJlc29sdmVkXG4gICAgICAjIGFzIHRlbXBsYXRlIGhlbHBlcnMgYW5kIGFyZSBhbHJlYWR5IGJvdW5kLiBXZSBiaW5kIGV2ZW50IGhhbmRsZXJzXG4gICAgICAjIGluIGR5bmFtaWMgYXR0cmlidXRlcyBhbHJlYWR5IGFzIHdlbGwuXG4gICAgICBldmVudEhhbmRsZXIuYXBwbHkgbnVsbCwgW2V2ZW50XS5jb25jYXQgYXJncywgZXZlbnRBcmdzXG5cbiAgZnVuLmV2ZW50SGFuZGxlciA9IHRydWVcblxuICBmdW5cblxuIyBXaGVuIGNvbnZlcnRpbmcgdGhlIGNvbXBvbmVudCB0byB0aGUgc3RhdGljIEhUTUwsIHJlbW92ZSBhbGwgZXZlbnQgaGFuZGxlcnMuXG5vcmlnaW5hbFZpc2l0VGFnID0gSFRNTC5Ub0hUTUxWaXNpdG9yOjp2aXNpdFRhZ1xuSFRNTC5Ub0hUTUxWaXNpdG9yOjp2aXNpdFRhZyA9ICh0YWcpIC0+XG4gIGlmIGF0dHJzID0gdGFnLmF0dHJzXG4gICAgYXR0cnMgPSBIVE1MLmZsYXR0ZW5BdHRyaWJ1dGVzIGF0dHJzXG4gICAgZm9yIG5hbWUgb2YgYXR0cnMgd2hlbiBzaGFyZS5FVkVOVF9IQU5ETEVSX1JFR0VYLnRlc3QgbmFtZVxuICAgICAgZGVsZXRlIGF0dHJzW25hbWVdXG4gICAgdGFnLmF0dHJzID0gYXR0cnNcblxuICBvcmlnaW5hbFZpc2l0VGFnLmNhbGwgQCwgdGFnXG5cbmN1cnJlbnRWaWV3SWZSZW5kZXJpbmcgPSAtPlxuICB2aWV3ID0gQmxhemUuY3VycmVudFZpZXdcbiAgaWYgdmlldz8uX2lzSW5SZW5kZXJcbiAgICB2aWV3XG4gIGVsc2VcbiAgICBudWxsXG5cbmNvbnRlbnRBc0Z1bmMgPSAoY29udGVudCkgLT5cbiAgIyBXZSBkbyBub3QgY2hlY2sgY29udGVudCBmb3IgdmFsaWRpdHkuXG5cbiAgaWYgIV8uaXNGdW5jdGlvbiBjb250ZW50XG4gICAgcmV0dXJuIC0+XG4gICAgICBjb250ZW50XG5cbiAgY29udGVudFxuXG5jb250ZW50QXNWaWV3ID0gKGNvbnRlbnQpIC0+XG4gICMgV2UgZG8gbm90IGNoZWNrIGNvbnRlbnQgZm9yIHZhbGlkaXR5LlxuXG4gIGlmIGNvbnRlbnQgaW5zdGFuY2VvZiBCbGF6ZS5UZW1wbGF0ZVxuICAgIGNvbnRlbnQuY29uc3RydWN0VmlldygpXG4gIGVsc2UgaWYgY29udGVudCBpbnN0YW5jZW9mIEJsYXplLlZpZXdcbiAgICBjb250ZW50XG4gIGVsc2VcbiAgICBCbGF6ZS5WaWV3ICdyZW5kZXInLCBjb250ZW50QXNGdW5jIGNvbnRlbnRcblxuSFRNTEpTRXhwYW5kZXIgPSBCbGF6ZS5fSFRNTEpTRXhwYW5kZXIuZXh0ZW5kKClcbkhUTUxKU0V4cGFuZGVyLmRlZlxuICAjIEJhc2VkIG9uIEJsYXplLl9IVE1MSlNFeHBhbmRlciwgYnV0IGNhbGxzIG91ciBleHBhbmRWaWV3LlxuICB2aXNpdE9iamVjdDogKHgpIC0+XG4gICAgaWYgeCBpbnN0YW5jZW9mIEJsYXplLlRlbXBsYXRlXG4gICAgICB4ID0geC5jb25zdHJ1Y3RWaWV3KClcbiAgICBpZiB4IGluc3RhbmNlb2YgQmxhemUuVmlld1xuICAgICAgcmV0dXJuIGV4cGFuZFZpZXcgeCwgQHBhcmVudFZpZXdcblxuICAgIEhUTUwuVHJhbnNmb3JtaW5nVmlzaXRvci5wcm90b3R5cGUudmlzaXRPYmplY3QuY2FsbCBALCB4XG5cbiMgQmFzZWQgb24gQmxhemUuX2V4cGFuZCwgYnV0IHVzZXMgb3VyIEhUTUxKU0V4cGFuZGVyLlxuZXhwYW5kID0gKGh0bWxqcywgcGFyZW50VmlldykgLT5cbiAgcGFyZW50VmlldyA9IHBhcmVudFZpZXcgb3IgY3VycmVudFZpZXdJZlJlbmRlcmluZygpXG5cbiAgKG5ldyBIVE1MSlNFeHBhbmRlciBwYXJlbnRWaWV3OiBwYXJlbnRWaWV3KS52aXNpdCBodG1sanNcblxuIyBCYXNlZCBvbiBCbGF6ZS5fZXhwYW5kVmlldywgYnV0IHdpdGggZmx1c2hpbmcuXG5leHBhbmRWaWV3ID0gKHZpZXcsIHBhcmVudFZpZXcpIC0+XG4gIEJsYXplLl9jcmVhdGVWaWV3IHZpZXcsIHBhcmVudFZpZXcsIHRydWVcblxuICB2aWV3Ll9pc0luUmVuZGVyID0gdHJ1ZVxuICBodG1sanMgPSBCbGF6ZS5fd2l0aEN1cnJlbnRWaWV3IHZpZXcsIC0+XG4gICAgdmlldy5fcmVuZGVyKClcbiAgdmlldy5faXNJblJlbmRlciA9IGZhbHNlXG5cbiAgVHJhY2tlci5mbHVzaCgpXG5cbiAgcmVzdWx0ID0gZXhwYW5kIGh0bWxqcywgdmlld1xuXG4gIFRyYWNrZXIuZmx1c2goKVxuXG4gIGlmIFRyYWNrZXIuYWN0aXZlXG4gICAgVHJhY2tlci5vbkludmFsaWRhdGUgLT5cbiAgICAgIEJsYXplLl9kZXN0cm95VmlldyB2aWV3XG4gIGVsc2VcbiAgICBCbGF6ZS5fZGVzdHJveVZpZXcgdmlld1xuXG4gIFRyYWNrZXIuZmx1c2goKVxuXG4gIHJlc3VsdFxuXG5jbGFzcyBCbGF6ZUNvbXBvbmVudCBleHRlbmRzIEJhc2VDb21wb25lbnRcbiAgIyBUT0RPOiBGaWd1cmUgb3V0IGhvdyB0byBkbyBhdCB0aGUgQmFzZUNvbXBvbmVudCBsZXZlbD9cbiAgQGdldENvbXBvbmVudEZvckVsZW1lbnQ6IChkb21FbGVtZW50KSAtPlxuICAgIHJldHVybiBudWxsIHVubGVzcyBkb21FbGVtZW50XG5cbiAgICAjIFRoaXMgdXNlcyB0aGUgc2FtZSBjaGVjayBpZiB0aGUgYXJndW1lbnQgaXMgYSBET00gZWxlbWVudCB0aGF0IEJsYXplLl9ET01SYW5nZS5mb3JFbGVtZW50IGRvZXMuXG4gICAgdGhyb3cgbmV3IEVycm9yIFwiRXhwZWN0ZWQgRE9NIGVsZW1lbnQuXCIgdW5sZXNzIGRvbUVsZW1lbnQubm9kZVR5cGUgaXMgTm9kZS5FTEVNRU5UX05PREVcblxuICAgICMgRm9yIERPTSBlbGVtZW50cyB3ZSB3YW50IHRvIHJldHVybiB0aGUgY29tcG9uZW50IHdoaWNoIG1hdGNoZXMgdGhlIHRlbXBsYXRlXG4gICAgIyB3aXRoIHRoYXQgRE9NIGVsZW1lbnQgYW5kIG5vdCB0aGUgY29tcG9uZW50IGNsb3Nlc3QgaW4gdGhlIGNvbXBvbmVudCB0cmVlLlxuICAgICMgU28gd2Ugc2tpcCB0aGUgYmxvY2sgaGVscGVycy4gKElmIERPTSBlbGVtZW50IGlzIHJlbmRlcmVkIGJ5IHRoZSBibG9jayBoZWxwZXJcbiAgICAjIHRoaXMgd2lsbCBmaW5kIHRoYXQgYmxvY2sgaGVscGVyIHRlbXBsYXRlL2NvbXBvbmVudC4pXG4gICAgdGVtcGxhdGVJbnN0YW5jZSA9IGdldFRlbXBsYXRlSW5zdGFuY2VGdW5jdGlvbiBCbGF6ZS5nZXRWaWV3KGRvbUVsZW1lbnQpLCB0cnVlXG4gICAgdGVtcGxhdGVJbnN0YW5jZVRvQ29tcG9uZW50IHRlbXBsYXRlSW5zdGFuY2UsIHRydWVcblxuICBjaGlsZENvbXBvbmVudHM6IChuYW1lT3JDb21wb25lbnQpIC0+XG4gICAgaWYgKGNvbXBvbmVudCA9IEBjb21wb25lbnQoKSkgaXNudCBAXG4gICAgICBjb21wb25lbnQuY2hpbGRDb21wb25lbnRzIG5hbWVPckNvbXBvbmVudFxuICAgIGVsc2VcbiAgICAgIHN1cGVyIGFyZ3VtZW50cy4uLlxuXG4gICMgQSB2ZXJzaW9uIG9mIGNoaWxkQ29tcG9uZW50c1dpdGggd2hpY2gga25vd3MgYWJvdXQgbWl4aW5zLlxuICAjIFdoZW4gY2hlY2tpbmcgZm9yIHByb3BlcnRpZXMgaXQgY2hlY2tzIG1peGlucyBhcyB3ZWxsLlxuICBjaGlsZENvbXBvbmVudHNXaXRoOiAocHJvcGVydHlPck1hdGNoZXJPckZ1bmN0aW9uKSAtPlxuICAgIGlmIChjb21wb25lbnQgPSBAY29tcG9uZW50KCkpIGlzbnQgQFxuICAgICAgY29tcG9uZW50LmNoaWxkQ29tcG9uZW50c1dpdGggcHJvcGVydHlPck1hdGNoZXJPckZ1bmN0aW9uXG4gICAgZWxzZVxuICAgICAgYXNzZXJ0IHByb3BlcnR5T3JNYXRjaGVyT3JGdW5jdGlvblxuXG4gICAgICBwcm9wZXJ0eU9yTWF0Y2hlck9yRnVuY3Rpb24gPSBjcmVhdGVNYXRjaGVyIHByb3BlcnR5T3JNYXRjaGVyT3JGdW5jdGlvbiwgdHJ1ZVxuXG4gICAgICBzdXBlciBwcm9wZXJ0eU9yTWF0Y2hlck9yRnVuY3Rpb25cblxuICBwYXJlbnRDb21wb25lbnQ6IChwYXJlbnRDb21wb25lbnQpIC0+XG4gICAgaWYgKGNvbXBvbmVudCA9IEBjb21wb25lbnQoKSkgaXNudCBAXG4gICAgICBjb21wb25lbnQucGFyZW50Q29tcG9uZW50IHBhcmVudENvbXBvbmVudFxuICAgIGVsc2VcbiAgICAgIHN1cGVyIGFyZ3VtZW50cy4uLlxuXG4gIGFkZENoaWxkQ29tcG9uZW50OiAoY2hpbGRDb21wb25lbnQpIC0+XG4gICAgaWYgKGNvbXBvbmVudCA9IEBjb21wb25lbnQoKSkgaXNudCBAXG4gICAgICBjb21wb25lbnQuYWRkQ2hpbGRDb21wb25lbnQgY2hpbGRDb21wb25lbnRcbiAgICBlbHNlXG4gICAgICBzdXBlciBhcmd1bWVudHMuLi5cblxuICByZW1vdmVDaGlsZENvbXBvbmVudDogKGNoaWxkQ29tcG9uZW50KSAtPlxuICAgIGlmIChjb21wb25lbnQgPSBAY29tcG9uZW50KCkpIGlzbnQgQFxuICAgICAgY29tcG9uZW50LnJlbW92ZUNoaWxkQ29tcG9uZW50IGNoaWxkQ29tcG9uZW50XG4gICAgZWxzZVxuICAgICAgc3VwZXIgYXJndW1lbnRzLi4uXG5cbiAgbWl4aW5zOiAtPlxuICAgIFtdXG5cbiAgIyBXaGVuIGEgY29tcG9uZW50IGlzIHVzZWQgYXMgYSBtaXhpbiwgY3JlYXRlTWl4aW5zIHdpbGwgY2FsbCB0aGlzIG1ldGhvZCB0byBzZXQgdGhlIHBhcmVudFxuICAjIGNvbXBvbmVudCB1c2luZyB0aGlzIG1peGluLiBFeHRlbmQgdGhpcyBtZXRob2QgaWYgeW91IHdhbnQgdG8gZG8gYW55IGFjdGlvbiB3aGVuIHBhcmVudCBpc1xuICAjIHNldCwgZm9yIGV4YW1wbGUsIGFkZCBkZXBlbmRlbmN5IG1peGlucyB0byB0aGUgcGFyZW50LiBNYWtlIHN1cmUgeW91IGNhbGwgc3VwZXIgYXMgd2VsbC5cbiAgbWl4aW5QYXJlbnQ6IChtaXhpblBhcmVudCkgLT5cbiAgICBAX2NvbXBvbmVudEludGVybmFscyA/PSB7fVxuXG4gICAgIyBTZXR0ZXIuXG4gICAgaWYgbWl4aW5QYXJlbnRcbiAgICAgIEBfY29tcG9uZW50SW50ZXJuYWxzLm1peGluUGFyZW50ID0gbWl4aW5QYXJlbnRcbiAgICAgICMgVG8gYWxsb3cgY2hhaW5pbmcuXG4gICAgICByZXR1cm4gQFxuXG4gICAgIyBHZXR0ZXIuXG4gICAgQF9jb21wb25lbnRJbnRlcm5hbHMubWl4aW5QYXJlbnQgb3IgbnVsbFxuXG4gIHJlcXVpcmVNaXhpbjogKG5hbWVPck1peGluKSAtPlxuICAgIGFzc2VydCBAX2NvbXBvbmVudEludGVybmFscz8ubWl4aW5zXG5cbiAgICBUcmFja2VyLm5vbnJlYWN0aXZlID0+XG4gICAgICAjIERvIG5vdCBkbyBhbnl0aGluZyBpZiBtaXhpbiBpcyBhbHJlYWR5IHJlcXVpcmVkLiBUaGlzIGFsbG93cyBtdWx0aXBsZSBtaXhpbnMgdG8gY2FsbCByZXF1aXJlTWl4aW5cbiAgICAgICMgaW4gbWl4aW5QYXJlbnQgbWV0aG9kIHRvIGFkZCBkZXBlbmRlbmNpZXMsIGJ1dCBpZiBkZXBlbmRlbmNpZXMgYXJlIGFscmVhZHkgdGhlcmUsIG5vdGhpbmcgaGFwcGVucy5cbiAgICAgIHJldHVybiBpZiBAZ2V0TWl4aW4gbmFtZU9yTWl4aW5cblxuICAgICAgaWYgXy5pc1N0cmluZyBuYW1lT3JNaXhpblxuICAgICAgICAjIEl0IGNvdWxkIGJlIHRoYXQgdGhlIGNvbXBvbmVudCBpcyBub3QgYSByZWFsIGluc3RhbmNlIG9mIHRoZSBCbGF6ZUNvbXBvbmVudCBjbGFzcyxcbiAgICAgICAgIyBzbyBpdCBtaWdodCBub3QgaGF2ZSBhIGNvbnN0cnVjdG9yIHBvaW50aW5nIGJhY2sgdG8gYSBCbGF6ZUNvbXBvbmVudCBzdWJjbGFzcy5cbiAgICAgICAgaWYgQGNvbnN0cnVjdG9yLmdldENvbXBvbmVudFxuICAgICAgICAgIG1peGluSW5zdGFuY2VDb21wb25lbnQgPSBAY29uc3RydWN0b3IuZ2V0Q29tcG9uZW50IG5hbWVPck1peGluXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBtaXhpbkluc3RhbmNlQ29tcG9uZW50ID0gQmxhemVDb21wb25lbnQuZ2V0Q29tcG9uZW50IG5hbWVPck1peGluXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIlVua25vd24gbWl4aW4gJyN7bmFtZU9yTWl4aW59Jy5cIiB1bmxlc3MgbWl4aW5JbnN0YW5jZUNvbXBvbmVudFxuICAgICAgICBtaXhpbkluc3RhbmNlID0gbmV3IG1peGluSW5zdGFuY2VDb21wb25lbnQoKVxuICAgICAgZWxzZSBpZiBfLmlzRnVuY3Rpb24gbmFtZU9yTWl4aW5cbiAgICAgICAgbWl4aW5JbnN0YW5jZSA9IG5ldyBuYW1lT3JNaXhpbigpXG4gICAgICBlbHNlXG4gICAgICAgIG1peGluSW5zdGFuY2UgPSBuYW1lT3JNaXhpblxuXG4gICAgICAjIFdlIGFkZCBtaXhpbiBiZWZvcmUgd2UgY2FsbCBtaXhpblBhcmVudCBzbyB0aGF0IGRlcGVuZGVuY2llcyBjb21lIGFmdGVyIHRoaXMgbWl4aW4sXG4gICAgICAjIGFuZCB0aGF0IHdlIHByZXZlbnQgcG9zc2libGUgaW5maW5pdGUgbG9vcHMgYmVjYXVzZSBvZiBjaXJjdWxhciBkZXBlbmRlbmNpZXMuXG4gICAgICAjIFRPRE86IEZvciBub3cgd2UgZG8gbm90IHByb3ZpZGUgYW4gb2ZmaWNpYWwgQVBJIHRvIGFkZCBkZXBlbmRlbmNpZXMgYmVmb3JlIHRoZSBtaXhpbiBpdHNlbGYuXG4gICAgICBAX2NvbXBvbmVudEludGVybmFscy5taXhpbnMucHVzaCBtaXhpbkluc3RhbmNlXG5cbiAgICAgICMgV2UgYWxsb3cgbWl4aW5zIHRvIG5vdCBiZSBjb21wb25lbnRzLCBzbyBtZXRob2RzIGFyZSBub3QgbmVjZXNzYXJ5IGF2YWlsYWJsZS5cblxuICAgICAgIyBTZXQgbWl4aW4gcGFyZW50LlxuICAgICAgaWYgbWl4aW5JbnN0YW5jZS5taXhpblBhcmVudFxuICAgICAgICBtaXhpbkluc3RhbmNlLm1peGluUGFyZW50IEBcblxuICAgICAgIyBNYXliZSBtaXhpbiBoYXMgaXRzIG93biBtaXhpbnMgYXMgd2VsbC5cbiAgICAgIG1peGluSW5zdGFuY2UuY3JlYXRlTWl4aW5zPygpXG5cbiAgICAgIGlmIGNvbXBvbmVudCA9IEBjb21wb25lbnQoKVxuICAgICAgICBjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscyA/PSB7fVxuICAgICAgICBjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscy50ZW1wbGF0ZUluc3RhbmNlID89IG5ldyBSZWFjdGl2ZUZpZWxkIG51bGwsIChhLCBiKSAtPiBhIGlzIGJcblxuICAgICAgICAjIElmIGEgbWl4aW4gaXMgYWRkaW5nIGEgZGVwZW5kZW5jeSB1c2luZyByZXF1aXJlTWl4aW4gYWZ0ZXIgaXRzIG1peGluUGFyZW50IGNsYXNzIChmb3IgZXhhbXBsZSwgaW4gb25DcmVhdGUpXG4gICAgICAgICMgYW5kIHRoaXMgaXMgdGhpcyBkZXBlbmRlbmN5IG1peGluLCB0aGUgdmlldyBtaWdodCBhbHJlYWR5IGJlIGNyZWF0ZWQgb3IgcmVuZGVyZWQgYW5kIGNhbGxiYWNrcyB3ZXJlXG4gICAgICAgICMgYWxyZWFkeSBjYWxsZWQsIHNvIHdlIHNob3VsZCBjYWxsIHRoZW0gbWFudWFsbHkgaGVyZSBhcyB3ZWxsLiBCdXQgb25seSBpZiBoZSB2aWV3IGhhcyBub3QgYmVlbiBkZXN0cm95ZWRcbiAgICAgICAgIyBhbHJlYWR5LiBGb3IgdGhvc2UgbWl4aW5zIHdlIGRvIG5vdCBjYWxsIGFueXRoaW5nLCB0aGVyZSBpcyBsaXR0bGUgdXNlIGZvciB0aGVtIG5vdy5cbiAgICAgICAgdW5sZXNzIGNvbXBvbmVudC5fY29tcG9uZW50SW50ZXJuYWxzLnRlbXBsYXRlSW5zdGFuY2UoKT8udmlldy5pc0Rlc3Ryb3llZFxuICAgICAgICAgIG1peGluSW5zdGFuY2Uub25DcmVhdGVkPygpIGlmIG5vdCBjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscy5pbk9uQ3JlYXRlZCBhbmQgY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMudGVtcGxhdGVJbnN0YW5jZSgpPy52aWV3LmlzQ3JlYXRlZFxuICAgICAgICAgIG1peGluSW5zdGFuY2Uub25SZW5kZXJlZD8oKSBpZiBub3QgY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMuaW5PblJlbmRlcmVkIGFuZCBjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscy50ZW1wbGF0ZUluc3RhbmNlKCk/LnZpZXcuaXNSZW5kZXJlZFxuXG4gICAgIyBUbyBhbGxvdyBjaGFpbmluZy5cbiAgICBAXG5cbiAgIyBNZXRob2QgdG8gaW5zdGFudGlhdGUgYWxsIG1peGlucy5cbiAgY3JlYXRlTWl4aW5zOiAtPlxuICAgIEBfY29tcG9uZW50SW50ZXJuYWxzID89IHt9XG5cbiAgICAjIFRvIGFsbG93IGNhbGxpbmcgaXQgbXVsdGlwbGUgdGltZXMsIGJ1dCBub24tZmlyc3QgY2FsbHMgYXJlIHNpbXBseSBpZ25vcmVkLlxuICAgIHJldHVybiBpZiBAX2NvbXBvbmVudEludGVybmFscy5taXhpbnNcbiAgICBAX2NvbXBvbmVudEludGVybmFscy5taXhpbnMgPSBbXVxuXG4gICAgZm9yIG1peGluIGluIEBtaXhpbnMoKVxuICAgICAgQHJlcXVpcmVNaXhpbiBtaXhpblxuXG4gICAgIyBUbyBhbGxvdyBjaGFpbmluZy5cbiAgICBAXG5cbiAgZ2V0TWl4aW46IChuYW1lT3JNaXhpbikgLT5cbiAgICBpZiBfLmlzU3RyaW5nIG5hbWVPck1peGluXG4gICAgICAjIEJ5IHBhc3NpbmcgQCBhcyB0aGUgZmlyc3QgYXJndW1lbnQsIHdlIHRyYXZlcnNlIG9ubHkgbWl4aW5zLlxuICAgICAgQGdldEZpcnN0V2l0aCBALCAoY2hpbGQsIHBhcmVudCkgPT5cbiAgICAgICAgIyBXZSBkbyBub3QgcmVxdWlyZSBtaXhpbnMgdG8gYmUgY29tcG9uZW50cywgYnV0IGlmIHRoZXkgYXJlLCB0aGV5IGNhblxuICAgICAgICAjIGJlIHJlZmVyZW5jZWQgYmFzZWQgb24gdGhlaXIgY29tcG9uZW50IG5hbWUuXG4gICAgICAgIG1peGluQ29tcG9uZW50TmFtZSA9IGNoaWxkLmNvbXBvbmVudE5hbWU/KCkgb3IgbnVsbFxuICAgICAgICByZXR1cm4gbWl4aW5Db21wb25lbnROYW1lIGFuZCBtaXhpbkNvbXBvbmVudE5hbWUgaXMgbmFtZU9yTWl4aW5cbiAgICBlbHNlXG4gICAgICAjIEJ5IHBhc3NpbmcgQCBhcyB0aGUgZmlyc3QgYXJndW1lbnQsIHdlIHRyYXZlcnNlIG9ubHkgbWl4aW5zLlxuICAgICAgQGdldEZpcnN0V2l0aCBALCAoY2hpbGQsIHBhcmVudCkgPT5cbiAgICAgICAgIyBuYW1lT3JNaXhpbiBpcyBhIGNsYXNzLlxuICAgICAgICByZXR1cm4gdHJ1ZSBpZiBjaGlsZC5jb25zdHJ1Y3RvciBpcyBuYW1lT3JNaXhpblxuXG4gICAgICAgICMgbmFtZU9yTWl4aW4gaXMgYW4gaW5zdGFuY2UsIG9yIHNvbWV0aGluZyBlbHNlLlxuICAgICAgICByZXR1cm4gdHJ1ZSBpZiBjaGlsZCBpcyBuYW1lT3JNaXhpblxuXG4gICAgICAgIGZhbHNlXG5cbiAgIyBDYWxscyB0aGUgY29tcG9uZW50IChpZiBhZnRlckNvbXBvbmVudE9yTWl4aW4gaXMgbnVsbCkgb3IgdGhlIGZpcnN0IG5leHQgbWl4aW5cbiAgIyBhZnRlciBhZnRlckNvbXBvbmVudE9yTWl4aW4gaXQgZmluZHMsIGFuZCByZXR1cm5zIHRoZSByZXN1bHQuXG4gIGNhbGxGaXJzdFdpdGg6IChhZnRlckNvbXBvbmVudE9yTWl4aW4sIHByb3BlcnR5TmFtZSwgYXJncy4uLikgLT5cbiAgICBhc3NlcnQgXy5pc1N0cmluZyBwcm9wZXJ0eU5hbWVcblxuICAgIGNvbXBvbmVudE9yTWl4aW4gPSBAZ2V0Rmlyc3RXaXRoIGFmdGVyQ29tcG9uZW50T3JNaXhpbiwgcHJvcGVydHlOYW1lXG5cbiAgICAjIFRPRE86IFNob3VsZCB3ZSB0aHJvdyBhbiBlcnJvciBoZXJlPyBTb21ldGhpbmcgbGlrZSBjYWxsaW5nIGEgZnVuY3Rpb24gd2hpY2ggZG9lcyBub3QgZXhpc3Q/XG4gICAgcmV0dXJuIHVubGVzcyBjb21wb25lbnRPck1peGluXG5cbiAgICAjIFdlIGFyZSBub3QgY2FsbGluZyBjYWxsRmlyc3RXaXRoIG9uIHRoZSBjb21wb25lbnRPck1peGluIGJlY2F1c2UgaGVyZSB3ZVxuICAgICMgYXJlIGFscmVhZHkgdHJhdmVyc2luZyBtaXhpbnMgc28gd2UgZG8gbm90IHJlY3Vyc2Ugb25jZSBtb3JlLlxuICAgIGlmIF8uaXNGdW5jdGlvbiBjb21wb25lbnRPck1peGluW3Byb3BlcnR5TmFtZV1cbiAgICAgIHJldHVybiBjb21wb25lbnRPck1peGluW3Byb3BlcnR5TmFtZV0gYXJncy4uLlxuICAgIGVsc2VcbiAgICAgIHJldHVybiBjb21wb25lbnRPck1peGluW3Byb3BlcnR5TmFtZV1cblxuICBnZXRGaXJzdFdpdGg6IChhZnRlckNvbXBvbmVudE9yTWl4aW4sIHByb3BlcnR5T3JNYXRjaGVyT3JGdW5jdGlvbikgLT5cbiAgICBhc3NlcnQgQF9jb21wb25lbnRJbnRlcm5hbHM/Lm1peGluc1xuICAgIGFzc2VydCBwcm9wZXJ0eU9yTWF0Y2hlck9yRnVuY3Rpb25cblxuICAgICMgSGVyZSB3ZSBhcmUgYWxyZWFkeSB0cmF2ZXJzaW5nIG1peGlucyBzbyB3ZSBkbyBub3QgcmVjdXJzZSBvbmNlIG1vcmUuXG4gICAgcHJvcGVydHlPck1hdGNoZXJPckZ1bmN0aW9uID0gY3JlYXRlTWF0Y2hlciBwcm9wZXJ0eU9yTWF0Y2hlck9yRnVuY3Rpb24sIGZhbHNlXG5cbiAgICAjIElmIGFmdGVyQ29tcG9uZW50T3JNaXhpbiBpcyBub3QgcHJvdmlkZWQsIHdlIHN0YXJ0IHdpdGggdGhlIGNvbXBvbmVudC5cbiAgICBpZiBub3QgYWZ0ZXJDb21wb25lbnRPck1peGluXG4gICAgICByZXR1cm4gQCBpZiBwcm9wZXJ0eU9yTWF0Y2hlck9yRnVuY3Rpb24uY2FsbCBALCBALCBAXG4gICAgICAjIEFuZCBjb250aW51ZSB3aXRoIG1peGlucy5cbiAgICAgIGZvdW5kID0gdHJ1ZVxuICAgICMgSWYgYWZ0ZXJDb21wb25lbnRPck1peGluIGlzIHRoZSBjb21wb25lbnQsIHdlIHN0YXJ0IHdpdGggbWl4aW5zLlxuICAgIGVsc2UgaWYgYWZ0ZXJDb21wb25lbnRPck1peGluIGFuZCBhZnRlckNvbXBvbmVudE9yTWl4aW4gaXMgQFxuICAgICAgZm91bmQgPSB0cnVlXG4gICAgZWxzZVxuICAgICAgZm91bmQgPSBmYWxzZVxuXG4gICAgIyBUT0RPOiBJbXBsZW1lbnQgd2l0aCBhIG1hcCBiZXR3ZWVuIG1peGluIC0+IHBvc2l0aW9uLCBzbyB0aGF0IHdlIGRvIG5vdCBoYXZlIHRvIHNlZWsgdG8gZmluZCBhIG1peGluLlxuICAgIGZvciBtaXhpbiBpbiBAX2NvbXBvbmVudEludGVybmFscy5taXhpbnNcbiAgICAgIHJldHVybiBtaXhpbiBpZiBmb3VuZCBhbmQgcHJvcGVydHlPck1hdGNoZXJPckZ1bmN0aW9uLmNhbGwgQCwgbWl4aW4sIEBcblxuICAgICAgZm91bmQgPSB0cnVlIGlmIG1peGluIGlzIGFmdGVyQ29tcG9uZW50T3JNaXhpblxuXG4gICAgbnVsbFxuXG4gICMgVGhpcyBjbGFzcyBtZXRob2QgbW9yZSBvciBsZXNzIGp1c3QgY3JlYXRlcyBhbiBpbnN0YW5jZSBvZiBhIGNvbXBvbmVudCBhbmQgY2FsbHMgaXRzIHJlbmRlckNvbXBvbmVudFxuICAjIG1ldGhvZC4gQnV0IGJlY2F1c2Ugd2Ugd2FudCB0byBhbGxvdyBwYXNzaW5nIGFyZ3VtZW50cyB0byB0aGUgY29tcG9uZW50IGluIHRlbXBsYXRlcywgd2UgaGF2ZSBzb21lXG4gICMgY29tcGxpY2F0ZWQgY29kZSBhcm91bmQgdG8gZXh0cmFjdCBhbmQgcGFzcyB0aG9zZSBhcmd1bWVudHMuIEl0IGlzIHNpbWlsYXIgdG8gaG93IGRhdGEgY29udGV4dCBpc1xuICAjIHBhc3NlZCB0byBibG9jayBoZWxwZXJzLiBJbiBhIGRhdGEgY29udGV4dCB2aXNpYmxlIG9ubHkgdG8gdGhlIGJsb2NrIGhlbHBlciB0ZW1wbGF0ZS5cbiAgIyBUT0RPOiBUaGlzIGNvdWxkIGJlIG1hZGUgbGVzcyBoYWNreS4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9tZXRlb3IvbWV0ZW9yL2lzc3Vlcy8zOTEzXG4gIEByZW5kZXJDb21wb25lbnQ6IChwYXJlbnRDb21wb25lbnQpIC0+XG4gICAgVHJhY2tlci5ub25yZWFjdGl2ZSA9PlxuICAgICAgY29tcG9uZW50Q2xhc3MgPSBAXG5cbiAgICAgIGlmIEJsYXplLmN1cnJlbnRWaWV3XG4gICAgICAgICMgV2UgY2hlY2sgZGF0YSBjb250ZXh0IGluIGEgbm9uLXJlYWN0aXZlIHdheSwgYmVjYXVzZSB3ZSB3YW50IGp1c3QgdG8gcGVlayBpbnRvIGl0XG4gICAgICAgICMgYW5kIGRldGVybWluZSBpZiBkYXRhIGNvbnRleHQgY29udGFpbnMgY29tcG9uZW50IGFyZ3VtZW50cyBvciBub3QuIEFuZCB3aGlsZVxuICAgICAgICAjIGNvbXBvbmVudCBhcmd1bWVudHMgbWlnaHQgY2hhbmdlIHRocm91Z2ggdGltZSwgdGhlIGZhY3QgdGhhdCB0aGV5IGFyZSB0aGVyZSBhdFxuICAgICAgICAjIGFsbCBvciBub3QgKFwiYXJnc1wiIHRlbXBsYXRlIGhlbHBlciB3YXMgdXNlZCBvciBub3QpIGRvZXMgbm90IGNoYW5nZSB0aHJvdWdoIHRpbWUuXG4gICAgICAgICMgU28gd2UgY2FuIGNoZWNrIHRoYXQgbm9uLXJlYWN0aXZlbHkuXG4gICAgICAgIGRhdGEgPSBUZW1wbGF0ZS5jdXJyZW50RGF0YSgpXG4gICAgICBlbHNlXG4gICAgICAgICMgVGhlcmUgaXMgbm8gY3VycmVudCB2aWV3IHdoZW4gdGhlcmUgaXMgbm8gZGF0YSBjb250ZXh0IHlldCwgdGh1cyBhbHNvIG5vIGFyZ3VtZW50c1xuICAgICAgICAjIHdlcmUgcHJvdmlkZWQgdGhyb3VnaCBcImFyZ3NcIiB0ZW1wbGF0ZSBoZWxwZXIsIHNvIHdlIGp1c3QgY29udGludWUgbm9ybWFsbHkuXG4gICAgICAgIGRhdGEgPSBudWxsXG5cbiAgICAgIGlmIGRhdGE/LmNvbnN0cnVjdG9yIGlzbnQgYXJndW1lbnRzQ29uc3RydWN0b3JcbiAgICAgICAgIyBTbyB0aGF0IGN1cnJlbnRDb21wb25lbnQgaW4gdGhlIGNvbnN0cnVjdG9yIGNhbiByZXR1cm4gdGhlIGNvbXBvbmVudFxuICAgICAgICAjIGluc2lkZSB3aGljaCB0aGlzIGNvbXBvbmVudCBoYXMgYmVlbiBjb25zdHJ1Y3RlZC5cbiAgICAgICAgcmV0dXJuIHdyYXBWaWV3QW5kVGVtcGxhdGUgQmxhemUuY3VycmVudFZpZXcsID0+XG4gICAgICAgICAgY29tcG9uZW50ID0gbmV3IGNvbXBvbmVudENsYXNzKClcblxuICAgICAgICAgIHJldHVybiBjb21wb25lbnQucmVuZGVyQ29tcG9uZW50IHBhcmVudENvbXBvbmVudFxuXG4gICAgICAjIEFyZ3VtZW50cyB3ZXJlIHByb3ZpZGVkIHRocm91Z2ggXCJhcmdzXCIgdGVtcGxhdGUgaGVscGVyLlxuXG4gICAgICAjIFdlIHdhbnQgdG8gcmVhY3RpdmVseSBkZXBlbmQgb24gdGhlIGRhdGEgY29udGV4dCBmb3IgYXJndW1lbnRzLCBzbyB3ZSByZXR1cm4gYSBmdW5jdGlvblxuICAgICAgIyBpbnN0ZWFkIG9mIGEgdGVtcGxhdGUuIEZ1bmN0aW9uIHdpbGwgYmUgcnVuIGluc2lkZSBhbiBhdXRvcnVuLCBhIHJlYWN0aXZlIGNvbnRleHQuXG4gICAgICAtPlxuICAgICAgICBhc3NlcnQgVHJhY2tlci5hY3RpdmVcblxuICAgICAgICAjIFdlIGNhbm5vdCB1c2UgVGVtcGxhdGUuZ2V0RGF0YSgpIGluc2lkZSBhIG5vcm1hbCBhdXRvcnVuIGJlY2F1c2UgY3VycmVudCB2aWV3IGlzIG5vdCBkZWZpbmVkIGluc2lkZVxuICAgICAgICAjIGEgbm9ybWFsIGF1dG9ydW4uIEJ1dCB3ZSBkbyBub3QgcmVhbGx5IGhhdmUgdG8gZGVwZW5kIHJlYWN0aXZlbHkgb24gdGhlIGN1cnJlbnQgdmlldywgb25seSBvbiB0aGVcbiAgICAgICAgIyBkYXRhIGNvbnRleHQgb2YgYSBrbm93biAodGhlIGNsb3Nlc3QgQmxhemUuV2l0aCkgdmlldy4gU28gd2UgZ2V0IHRoaXMgdmlldyBieSBvdXJzZWx2ZXMuXG4gICAgICAgIGN1cnJlbnRXaXRoID0gQmxhemUuZ2V0VmlldyAnd2l0aCdcblxuICAgICAgICAjIEJ5IGRlZmF1bHQgZGF0YVZhciBpbiB0aGUgQmxhemUuV2l0aCB2aWV3IHVzZXMgUmVhY3RpdmVWYXIgd2l0aCBkZWZhdWx0IGVxdWFsaXR5IGZ1bmN0aW9uIHdoaWNoXG4gICAgICAgICMgc2VlcyBhbGwgb2JqZWN0cyBhcyBkaWZmZXJlbnQuIFNvIGludmFsaWRhdGlvbnMgYXJlIHRyaWdnZXJlZCBmb3IgZXZlcnkgZGF0YSBjb250ZXh0IGFzc2lnbm1lbnRzXG4gICAgICAgICMgZXZlbiBpZiBkYXRhIGhhcyBub3QgcmVhbGx5IGNoYW5nZWQuIFRoaXMgaXMgd2h5IHdyYXAgaXQgaW50byBhIENvbXB1dGVkRmllbGQgd2l0aCBFSlNPTi5lcXVhbHMuXG4gICAgICAgICMgQmVjYXVzZSBpdCB1c2VzIEVKU09OLmVxdWFscyBpdCB3aWxsIGludmFsaWRhdGUgb3VyIGZ1bmN0aW9uIG9ubHkgaWYgcmVhbGx5IGNoYW5nZXMuXG4gICAgICAgICMgU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9tZXRlb3IvbWV0ZW9yL2lzc3Vlcy80MDczXG4gICAgICAgIHJlYWN0aXZlQXJndW1lbnRzID0gbmV3IENvbXB1dGVkRmllbGQgLT5cbiAgICAgICAgICBkYXRhID0gY3VycmVudFdpdGguZGF0YVZhci5nZXQoKVxuICAgICAgICAgIGFzc2VydC5lcXVhbCBkYXRhPy5jb25zdHJ1Y3RvciwgYXJndW1lbnRzQ29uc3RydWN0b3JcbiAgICAgICAgICBkYXRhLl9hcmd1bWVudHNcbiAgICAgICAgLFxuICAgICAgICAgIEVKU09OLmVxdWFsc1xuXG4gICAgICAgICMgSGVyZSB3ZSByZWdpc3RlciBhIHJlYWN0aXZlIGRlcGVuZGVuY3kgb24gdGhlIENvbXB1dGVkRmllbGQuXG4gICAgICAgIG5vbnJlYWN0aXZlQXJndW1lbnRzID0gcmVhY3RpdmVBcmd1bWVudHMoKVxuXG4gICAgICAgIFRyYWNrZXIubm9ucmVhY3RpdmUgLT5cbiAgICAgICAgICAjIEFyZ3VtZW50cyB3ZXJlIHBhc3NlZCBpbiBhcyBhIGRhdGEgY29udGV4dC4gV2Ugd2FudCBjdXJyZW50RGF0YSBpbiB0aGUgY29uc3RydWN0b3IgdG8gcmV0dXJuIHRoZVxuICAgICAgICAgICMgb3JpZ2luYWwgKHBhcmVudCkgZGF0YSBjb250ZXh0LiBMaWtlIHdlIHdlcmUgbm90IHBhc3NpbmcgaW4gYXJndW1lbnRzIGFzIGEgZGF0YSBjb250ZXh0LlxuICAgICAgICAgIHRlbXBsYXRlID0gQmxhemUuX3dpdGhDdXJyZW50VmlldyBCbGF6ZS5jdXJyZW50Vmlldy5wYXJlbnRWaWV3LnBhcmVudFZpZXcsID0+XG4gICAgICAgICAgICAjIFNvIHRoYXQgY3VycmVudENvbXBvbmVudCBpbiB0aGUgY29uc3RydWN0b3IgY2FuIHJldHVybiB0aGUgY29tcG9uZW50XG4gICAgICAgICAgICAjIGluc2lkZSB3aGljaCB0aGlzIGNvbXBvbmVudCBoYXMgYmVlbiBjb25zdHJ1Y3RlZC5cbiAgICAgICAgICAgIHJldHVybiB3cmFwVmlld0FuZFRlbXBsYXRlIEJsYXplLmN1cnJlbnRWaWV3LCA9PlxuICAgICAgICAgICAgICAjIFVzZSBhcmd1bWVudHMgZm9yIHRoZSBjb25zdHJ1Y3Rvci5cbiAgICAgICAgICAgICAgY29tcG9uZW50ID0gbmV3IGNvbXBvbmVudENsYXNzIG5vbnJlYWN0aXZlQXJndW1lbnRzLi4uXG5cbiAgICAgICAgICAgICAgcmV0dXJuIGNvbXBvbmVudC5yZW5kZXJDb21wb25lbnQgcGFyZW50Q29tcG9uZW50XG5cbiAgICAgICAgICAjIEl0IGhhcyB0byBiZSB0aGUgZmlyc3QgY2FsbGJhY2sgc28gdGhhdCBvdGhlciBoYXZlIGEgY29ycmVjdCBkYXRhIGNvbnRleHQuXG4gICAgICAgICAgcmVnaXN0ZXJGaXJzdENyZWF0ZWRIb29rIHRlbXBsYXRlLCAtPlxuICAgICAgICAgICAgIyBBcmd1bWVudHMgd2VyZSBwYXNzZWQgaW4gYXMgYSBkYXRhIGNvbnRleHQuIFJlc3RvcmUgb3JpZ2luYWwgKHBhcmVudCkgZGF0YVxuICAgICAgICAgICAgIyBjb250ZXh0LiBTYW1lIGxvZ2ljIGFzIGluIEJsYXplLl9Jbk91dGVyVGVtcGxhdGVTY29wZS5cbiAgICAgICAgICAgIEB2aWV3Lm9yaWdpbmFsUGFyZW50VmlldyA9IEB2aWV3LnBhcmVudFZpZXdcbiAgICAgICAgICAgIEB2aWV3LnBhcmVudFZpZXcgPSBAdmlldy5wYXJlbnRWaWV3LnBhcmVudFZpZXcucGFyZW50Vmlld1xuXG4gICAgICAgICAgdGVtcGxhdGVcblxuICByZW5kZXJDb21wb25lbnQ6IChwYXJlbnRDb21wb25lbnQpIC0+XG4gICAgIyBUbyBtYWtlIHN1cmUgd2UgZG8gbm90IGludHJvZHVjZSBhbnkgcmVhY3RpdmUgZGVwZW5kZW5jeS4gVGhpcyBpcyBhIGNvbnNjaW91cyBkZXNpZ24gZGVjaXNpb24uXG4gICAgIyBSZWFjdGl2aXR5IHNob3VsZCBiZSBjaGFuZ2luZyBkYXRhIGNvbnRleHQsIGJ1dCBjb21wb25lbnRzIHNob3VsZCBiZSBtb3JlIHN0YWJsZSwgb25seSBjaGFuZ2luZ1xuICAgICMgd2hlbiBzdHJ1Y3R1cmUgY2hhbmdlIGluIHJlbmRlcmVkIERPTS4gWW91IGNhbiBjaGFuZ2UgdGhlIGNvbXBvbmVudCB5b3UgYXJlIGluY2x1ZGluZyAob3IgcGFzc1xuICAgICMgZGlmZmVyZW50IGFyZ3VtZW50cykgcmVhY3RpdmVseSB0aG91Z2guXG4gICAgVHJhY2tlci5ub25yZWFjdGl2ZSA9PlxuICAgICAgY29tcG9uZW50ID0gQGNvbXBvbmVudCgpXG5cbiAgICAgICMgSWYgbWl4aW5zIGhhdmUgbm90IHlldCBiZWVuIGNyZWF0ZWQuXG4gICAgICBjb21wb25lbnQuY3JlYXRlTWl4aW5zKClcblxuICAgICAgdGVtcGxhdGVCYXNlID0gZ2V0VGVtcGxhdGVCYXNlIGNvbXBvbmVudFxuXG4gICAgICAjIENyZWF0ZSBhIG5ldyBjb21wb25lbnQgdGVtcGxhdGUgYmFzZWQgb24gdGhlIEJsYXplIHRlbXBsYXRlLiBXZSB3YW50IG91ciBvd24gdGVtcGxhdGVcbiAgICAgICMgYmVjYXVzZSB0aGUgc2FtZSBCbGF6ZSB0ZW1wbGF0ZSBjb3VsZCBiZSByZXVzZWQgYmV0d2VlbiBtdWx0aXBsZSBjb21wb25lbnRzLlxuICAgICAgIyBUT0RPOiBTaG91bGQgd2UgY2FjaGUgdGhlc2UgdGVtcGxhdGVzIGJhc2VkIG9uIChjb21wb25lbnROYW1lLCB0ZW1wbGF0ZUJhc2UpIHBhaXI/IFdlIGNvdWxkIHVzZSB0d28gbGV2ZWxzIG9mIEVTMjAxNSBNYXBzLCBjb21wb25lbnROYW1lIC0+IHRlbXBsYXRlQmFzZSAtPiB0ZW1wbGF0ZS4gV2hhdCBhYm91dCBjb21wb25lbnQgYXJndW1lbnRzIGNoYW5naW5nP1xuICAgICAgdGVtcGxhdGUgPSBuZXcgQmxhemUuVGVtcGxhdGUgXCJCbGF6ZUNvbXBvbmVudC4je2NvbXBvbmVudC5jb21wb25lbnROYW1lKCkgb3IgJ3VubmFtZWQnfVwiLCB0ZW1wbGF0ZUJhc2UucmVuZGVyRnVuY3Rpb25cblxuICAgICAgIyBXZSBsb29rdXAgcHJlZXhpc3RpbmcgdGVtcGxhdGUgaGVscGVycyBpbiBCbGF6ZS5fZ2V0VGVtcGxhdGVIZWxwZXIsIGlmIHRoZSBjb21wb25lbnQgZG9lcyBub3QgaGF2ZVxuICAgICAgIyBhIHByb3BlcnR5IHdpdGggdGhlIHNhbWUgbmFtZS4gUHJlZXhpc3RpbmcgZXZlbnQgaGFuZGxlcnMgYW5kIGxpZmUtY3ljbGUgaG9va3MgYXJlIHRha2VuIGNhcmUgb2ZcbiAgICAgICMgaW4gdGhlIHJlbGF0ZWQgbWV0aG9kcyBpbiB0aGUgYmFzZSBjbGFzcy5cblxuICAgICAgY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMgPz0ge31cbiAgICAgIGNvbXBvbmVudC5fY29tcG9uZW50SW50ZXJuYWxzLnRlbXBsYXRlQmFzZSA9IHRlbXBsYXRlQmFzZVxuXG4gICAgICByZWdpc3Rlckhvb2tzIHRlbXBsYXRlLFxuICAgICAgICBvbkNyZWF0ZWQ6IC0+XG4gICAgICAgICAgIyBAIGlzIGEgdGVtcGxhdGUgaW5zdGFuY2UuXG5cbiAgICAgICAgICBpZiBwYXJlbnRDb21wb25lbnRcbiAgICAgICAgICAgICMgY29tcG9uZW50LnBhcmVudENvbXBvbmVudCBpcyByZWFjdGl2ZSwgc28gd2UgdXNlIFRyYWNrZXIubm9ucmVhY3RpdmUganVzdCB0byBtYWtlIHN1cmUgd2UgZG8gbm90IGxlYWsgYW55IHJlYWN0aXZpdHkgaGVyZS5cbiAgICAgICAgICAgIFRyYWNrZXIubm9ucmVhY3RpdmUgPT5cbiAgICAgICAgICAgICAgIyBUT0RPOiBTaG91bGQgd2Ugc3VwcG9ydCB0aGF0IHRoZSBzYW1lIGNvbXBvbmVudCBjYW4gYmUgcmVuZGVyZWQgbXVsdGlwbGUgdGltZXMgaW4gcGFyYWxsZWw/IEhvdyBjb3VsZCB3ZSBkbyB0aGF0PyBGb3IgZGlmZmVyZW50IGNvbXBvbmVudCBwYXJlbnRzIG9yIG9ubHkgdGhlIHNhbWUgb25lP1xuICAgICAgICAgICAgICBhc3NlcnQgbm90IGNvbXBvbmVudC5wYXJlbnRDb21wb25lbnQoKSwgXCJDb21wb25lbnQgJyN7Y29tcG9uZW50LmNvbXBvbmVudE5hbWUoKSBvciAndW5uYW1lZCd9JyBwYXJlbnQgY29tcG9uZW50ICcje2NvbXBvbmVudC5wYXJlbnRDb21wb25lbnQoKT8uY29tcG9uZW50TmFtZSgpIG9yICd1bm5hbWVkJ30nIGFscmVhZHkgc2V0LlwiXG5cbiAgICAgICAgICAgICAgIyBXZSBzZXQgdGhlIHBhcmVudCBvbmx5IHdoZW4gdGhlIGNvbXBvbmVudCBpcyBjcmVhdGVkLCBub3QganVzdCBjb25zdHJ1Y3RlZC5cbiAgICAgICAgICAgICAgY29tcG9uZW50LnBhcmVudENvbXBvbmVudCBwYXJlbnRDb21wb25lbnRcbiAgICAgICAgICAgICAgcGFyZW50Q29tcG9uZW50LmFkZENoaWxkQ29tcG9uZW50IGNvbXBvbmVudFxuXG4gICAgICAgICAgQHZpZXcuX29uVmlld1JlbmRlcmVkID0+XG4gICAgICAgICAgICAjIEF0dGFjaCBldmVudHMgdGhlIGZpcnN0IHRpbWUgdGVtcGxhdGUgaW5zdGFuY2UgcmVuZGVycy5cbiAgICAgICAgICAgIHJldHVybiB1bmxlc3MgQHZpZXcucmVuZGVyQ291bnQgaXMgMVxuXG4gICAgICAgICAgICAjIFdlIGZpcnN0IGFkZCBldmVudCBoYW5kbGVycyBmcm9tIHRoZSBjb21wb25lbnQsIHRoZW4gbWl4aW5zLlxuICAgICAgICAgICAgY29tcG9uZW50T3JNaXhpbiA9IG51bGxcbiAgICAgICAgICAgIHdoaWxlIGNvbXBvbmVudE9yTWl4aW4gPSBAY29tcG9uZW50LmdldEZpcnN0V2l0aCBjb21wb25lbnRPck1peGluLCAnZXZlbnRzJ1xuICAgICAgICAgICAgICBhZGRFdmVudHMgQHZpZXcsIGNvbXBvbmVudE9yTWl4aW5cblxuICAgICAgICAgIEBjb21wb25lbnQgPSBjb21wb25lbnRcblxuICAgICAgICAgICMgVE9ETzogU2hvdWxkIHdlIHN1cHBvcnQgdGhhdCB0aGUgc2FtZSBjb21wb25lbnQgY2FuIGJlIHJlbmRlcmVkIG11bHRpcGxlIHRpbWVzIGluIHBhcmFsbGVsPyBIb3cgY291bGQgd2UgZG8gdGhhdD8gRm9yIGRpZmZlcmVudCBjb21wb25lbnQgcGFyZW50cyBvciBvbmx5IHRoZSBzYW1lIG9uZT9cbiAgICAgICAgICBhc3NlcnQgbm90IFRyYWNrZXIubm9ucmVhY3RpdmUgPT4gQGNvbXBvbmVudC5fY29tcG9uZW50SW50ZXJuYWxzLnRlbXBsYXRlSW5zdGFuY2U/KClcblxuICAgICAgICAgIEBjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscy50ZW1wbGF0ZUluc3RhbmNlID89IG5ldyBSZWFjdGl2ZUZpZWxkIEAsIChhLCBiKSAtPiBhIGlzIGJcbiAgICAgICAgICBAY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMudGVtcGxhdGVJbnN0YW5jZSBAXG5cbiAgICAgICAgICBAY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMuaXNDcmVhdGVkID89IG5ldyBSZWFjdGl2ZUZpZWxkIHRydWVcbiAgICAgICAgICBAY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMuaXNDcmVhdGVkIHRydWVcblxuICAgICAgICAgICMgTWF5YmUgd2UgYXJlIHJlLXJlbmRlcmluZyB0aGUgY29tcG9uZW50LiBTbyBsZXQncyBpbml0aWFsaXplIHZhcmlhYmxlcyBqdXN0IHRvIGJlIHN1cmUuXG5cbiAgICAgICAgICBAY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMuaXNSZW5kZXJlZCA/PSBuZXcgUmVhY3RpdmVGaWVsZCBmYWxzZVxuICAgICAgICAgIEBjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscy5pc1JlbmRlcmVkIGZhbHNlXG5cbiAgICAgICAgICBAY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMuaXNEZXN0cm95ZWQgPz0gbmV3IFJlYWN0aXZlRmllbGQgZmFsc2VcbiAgICAgICAgICBAY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMuaXNEZXN0cm95ZWQgZmFsc2VcblxuICAgICAgICAgIHRyeVxuICAgICAgICAgICAgIyBXZSBoYXZlIHRvIGtub3cgaWYgd2Ugc2hvdWxkIGNhbGwgb25DcmVhdGVkIG9uIHRoZSBtaXhpbiBpbnNpZGUgdGhlIHJlcXVpcmVNaXhpbiBvciBub3QuIFdlIHdhbnQgdG8gY2FsbFxuICAgICAgICAgICAgIyBpdCBvbmx5IG9uY2UuIElmIGl0IHJlcXVpcmVNaXhpbiBpcyBjYWxsZWQgZnJvbSBvbkNyZWF0ZWQgb2YgYW5vdGhlciBtaXhpbiwgdGhlbiBpdCB3aWxsIGJlIGFkZGVkIGF0IHRoZVxuICAgICAgICAgICAgIyBlbmQgYW5kIHdlIHdpbGwgZ2V0IGl0IGhlcmUgYXQgdGhlIGVuZC4gU28gd2Ugc2hvdWxkIG5vdCBjYWxsIG9uQ3JlYXRlZCBpbnNpZGUgcmVxdWlyZU1peGluIGJlY2F1c2UgdGhlblxuICAgICAgICAgICAgIyBvbkNyZWF0ZWQgd291bGQgYmUgY2FsbGVkIHR3aWNlLlxuICAgICAgICAgICAgQGNvbXBvbmVudC5fY29tcG9uZW50SW50ZXJuYWxzLmluT25DcmVhdGVkID0gdHJ1ZVxuICAgICAgICAgICAgY29tcG9uZW50T3JNaXhpbiA9IG51bGxcbiAgICAgICAgICAgIHdoaWxlIGNvbXBvbmVudE9yTWl4aW4gPSBAY29tcG9uZW50LmdldEZpcnN0V2l0aCBjb21wb25lbnRPck1peGluLCAnb25DcmVhdGVkJ1xuICAgICAgICAgICAgICBjb21wb25lbnRPck1peGluLm9uQ3JlYXRlZCgpXG4gICAgICAgICAgZmluYWxseVxuICAgICAgICAgICAgZGVsZXRlIEBjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscy5pbk9uQ3JlYXRlZFxuXG4gICAgICAgIG9uUmVuZGVyZWQ6IC0+XG4gICAgICAgICAgIyBAIGlzIGEgdGVtcGxhdGUgaW5zdGFuY2UuXG5cbiAgICAgICAgICBAY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMuaXNSZW5kZXJlZCA/PSBuZXcgUmVhY3RpdmVGaWVsZCB0cnVlXG4gICAgICAgICAgQGNvbXBvbmVudC5fY29tcG9uZW50SW50ZXJuYWxzLmlzUmVuZGVyZWQgdHJ1ZVxuXG4gICAgICAgICAgVHJhY2tlci5ub25yZWFjdGl2ZSA9PlxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsIEBjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscy5pc0NyZWF0ZWQoKSwgdHJ1ZVxuXG4gICAgICAgICAgdHJ5XG4gICAgICAgICAgICAjIFNhbWUgYXMgZm9yIG9uQ3JlYXRlZCBhYm92ZS5cbiAgICAgICAgICAgIEBjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscy5pbk9uUmVuZGVyZWQgPSB0cnVlXG4gICAgICAgICAgICBjb21wb25lbnRPck1peGluID0gbnVsbFxuICAgICAgICAgICAgd2hpbGUgY29tcG9uZW50T3JNaXhpbiA9IEBjb21wb25lbnQuZ2V0Rmlyc3RXaXRoIGNvbXBvbmVudE9yTWl4aW4sICdvblJlbmRlcmVkJ1xuICAgICAgICAgICAgICBjb21wb25lbnRPck1peGluLm9uUmVuZGVyZWQoKVxuICAgICAgICAgIGZpbmFsbHlcbiAgICAgICAgICAgIGRlbGV0ZSBAY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMuaW5PblJlbmRlcmVkXG5cbiAgICAgICAgb25EZXN0cm95ZWQ6IC0+XG4gICAgICAgICAgQGF1dG9ydW4gKGNvbXB1dGF0aW9uKSA9PlxuICAgICAgICAgICAgIyBAIGlzIGEgdGVtcGxhdGUgaW5zdGFuY2UuXG5cbiAgICAgICAgICAgICMgV2Ugd2FpdCBmb3IgYWxsIGNoaWxkcmVuIGNvbXBvbmVudHMgdG8gYmUgZGVzdHJveWVkIGZpcnN0LlxuICAgICAgICAgICAgIyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL21ldGVvci9tZXRlb3IvaXNzdWVzLzQxNjZcbiAgICAgICAgICAgIHJldHVybiBpZiBAY29tcG9uZW50LmNoaWxkQ29tcG9uZW50cygpLmxlbmd0aFxuICAgICAgICAgICAgY29tcHV0YXRpb24uc3RvcCgpXG5cbiAgICAgICAgICAgIFRyYWNrZXIubm9ucmVhY3RpdmUgPT5cbiAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsIEBjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscy5pc0NyZWF0ZWQoKSwgdHJ1ZVxuXG4gICAgICAgICAgICAgIEBjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscy5pc0NyZWF0ZWQgZmFsc2VcblxuICAgICAgICAgICAgICBAY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMuaXNSZW5kZXJlZCA/PSBuZXcgUmVhY3RpdmVGaWVsZCBmYWxzZVxuICAgICAgICAgICAgICBAY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMuaXNSZW5kZXJlZCBmYWxzZVxuXG4gICAgICAgICAgICAgIEBjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscy5pc0Rlc3Ryb3llZCA/PSBuZXcgUmVhY3RpdmVGaWVsZCB0cnVlXG4gICAgICAgICAgICAgIEBjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscy5pc0Rlc3Ryb3llZCB0cnVlXG5cbiAgICAgICAgICAgICAgY29tcG9uZW50T3JNaXhpbiA9IG51bGxcbiAgICAgICAgICAgICAgd2hpbGUgY29tcG9uZW50T3JNaXhpbiA9IEBjb21wb25lbnQuZ2V0Rmlyc3RXaXRoIGNvbXBvbmVudE9yTWl4aW4sICdvbkRlc3Ryb3llZCdcbiAgICAgICAgICAgICAgICBjb21wb25lbnRPck1peGluLm9uRGVzdHJveWVkKClcblxuICAgICAgICAgICAgICBpZiBwYXJlbnRDb21wb25lbnRcbiAgICAgICAgICAgICAgICAjIFRoZSBjb21wb25lbnQgaGFzIGJlZW4gZGVzdHJveWVkLCBjbGVhciB1cCB0aGUgcGFyZW50LlxuICAgICAgICAgICAgICAgIGNvbXBvbmVudC5wYXJlbnRDb21wb25lbnQgbnVsbFxuICAgICAgICAgICAgICAgIHBhcmVudENvbXBvbmVudC5yZW1vdmVDaGlsZENvbXBvbmVudCBjb21wb25lbnRcblxuICAgICAgICAgICAgICAjIFJlbW92ZSB0aGUgcmVmZXJlbmNlIHNvIHRoYXQgaXQgaXMgY2xlYXIgdGhhdCB0ZW1wbGF0ZSBpbnN0YW5jZSBpcyBub3QgYXZhaWxhYmxlIGFueW1vcmUuXG4gICAgICAgICAgICAgIEBjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscy50ZW1wbGF0ZUluc3RhbmNlIG51bGxcblxuICAgICAgdGVtcGxhdGVcblxuICByZW1vdmVDb21wb25lbnQ6IC0+XG4gICAgQmxhemUucmVtb3ZlIEBjb21wb25lbnQoKS5fY29tcG9uZW50SW50ZXJuYWxzLnRlbXBsYXRlSW5zdGFuY2UoKS52aWV3IGlmIEBpc1JlbmRlcmVkKClcblxuICBAX3JlbmRlckNvbXBvbmVudFRvOiAodmlzaXRvciwgcGFyZW50Q29tcG9uZW50LCBwYXJlbnRWaWV3LCBkYXRhKSAtPlxuICAgIGNvbXBvbmVudCA9IFRyYWNrZXIubm9ucmVhY3RpdmUgPT5cbiAgICAgIGNvbXBvbmVudENsYXNzID0gQFxuXG4gICAgICBwYXJlbnRWaWV3ID0gcGFyZW50VmlldyBvciBjdXJyZW50Vmlld0lmUmVuZGVyaW5nKCkgb3IgKHBhcmVudENvbXBvbmVudD8uaXNSZW5kZXJlZCgpIGFuZCBwYXJlbnRDb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscy50ZW1wbGF0ZUluc3RhbmNlKCkudmlldykgb3IgbnVsbFxuXG4gICAgICB3cmFwVmlld0FuZFRlbXBsYXRlIHBhcmVudFZpZXcsID0+XG4gICAgICAgIG5ldyBjb21wb25lbnRDbGFzcygpXG5cbiAgICBpZiBhcmd1bWVudHMubGVuZ3RoID4gMlxuICAgICAgY29tcG9uZW50Ll9yZW5kZXJDb21wb25lbnRUbyB2aXNpdG9yLCBwYXJlbnRDb21wb25lbnQsIHBhcmVudFZpZXcsIGRhdGFcbiAgICBlbHNlXG4gICAgICBjb21wb25lbnQuX3JlbmRlckNvbXBvbmVudFRvIHZpc2l0b3IsIHBhcmVudENvbXBvbmVudCwgcGFyZW50Vmlld1xuXG4gIEByZW5kZXJDb21wb25lbnRUb0hUTUw6IChwYXJlbnRDb21wb25lbnQsIHBhcmVudFZpZXcsIGRhdGEpIC0+XG4gICAgaWYgYXJndW1lbnRzLmxlbmd0aCA+IDJcbiAgICAgIEBfcmVuZGVyQ29tcG9uZW50VG8gbmV3IEhUTUwuVG9IVE1MVmlzaXRvcigpLCBwYXJlbnRDb21wb25lbnQsIHBhcmVudFZpZXcsIGRhdGFcbiAgICBlbHNlXG4gICAgICBAX3JlbmRlckNvbXBvbmVudFRvIG5ldyBIVE1MLlRvSFRNTFZpc2l0b3IoKSwgcGFyZW50Q29tcG9uZW50LCBwYXJlbnRWaWV3XG5cbiAgX3JlbmRlckNvbXBvbmVudFRvOiAodmlzaXRvciwgcGFyZW50Q29tcG9uZW50LCBwYXJlbnRWaWV3LCBkYXRhKSAtPlxuICAgIHRlbXBsYXRlID0gVHJhY2tlci5ub25yZWFjdGl2ZSA9PlxuICAgICAgcGFyZW50VmlldyA9IHBhcmVudFZpZXcgb3IgY3VycmVudFZpZXdJZlJlbmRlcmluZygpIG9yIChwYXJlbnRDb21wb25lbnQ/LmlzUmVuZGVyZWQoKSBhbmQgcGFyZW50Q29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMudGVtcGxhdGVJbnN0YW5jZSgpLnZpZXcpIG9yIG51bGxcblxuICAgICAgd3JhcFZpZXdBbmRUZW1wbGF0ZSBwYXJlbnRWaWV3LCA9PlxuICAgICAgICBAY29tcG9uZW50KCkucmVuZGVyQ29tcG9uZW50IHBhcmVudENvbXBvbmVudFxuXG4gICAgaWYgYXJndW1lbnRzLmxlbmd0aCA+IDJcbiAgICAgIGV4cGFuZGVkVmlldyA9IGV4cGFuZFZpZXcgQmxhemUuX1RlbXBsYXRlV2l0aChkYXRhLCBjb250ZW50QXNGdW5jIHRlbXBsYXRlKSwgcGFyZW50Vmlld1xuICAgIGVsc2VcbiAgICAgIGV4cGFuZGVkVmlldyA9IGV4cGFuZFZpZXcgY29udGVudEFzVmlldyh0ZW1wbGF0ZSksIHBhcmVudFZpZXdcblxuICAgIHZpc2l0b3IudmlzaXQgZXhwYW5kZWRWaWV3XG5cbiAgcmVuZGVyQ29tcG9uZW50VG9IVE1MOiAocGFyZW50Q29tcG9uZW50LCBwYXJlbnRWaWV3LCBkYXRhKSAtPlxuICAgIGlmIGFyZ3VtZW50cy5sZW5ndGggPiAyXG4gICAgICBAX3JlbmRlckNvbXBvbmVudFRvIG5ldyBIVE1MLlRvSFRNTFZpc2l0b3IoKSwgcGFyZW50Q29tcG9uZW50LCBwYXJlbnRWaWV3LCBkYXRhXG4gICAgZWxzZVxuICAgICAgQF9yZW5kZXJDb21wb25lbnRUbyBuZXcgSFRNTC5Ub0hUTUxWaXNpdG9yKCksIHBhcmVudENvbXBvbmVudCwgcGFyZW50Vmlld1xuXG4gIHRlbXBsYXRlOiAtPlxuICAgIEBjYWxsRmlyc3RXaXRoKEAsICd0ZW1wbGF0ZScpIG9yIEBjb25zdHJ1Y3Rvci5jb21wb25lbnROYW1lKClcblxuICBvbkNyZWF0ZWQ6IC0+XG4gICAgY2FsbFRlbXBsYXRlQmFzZUhvb2tzIEAsICdjcmVhdGVkJ1xuXG4gIG9uUmVuZGVyZWQ6IC0+XG4gICAgY2FsbFRlbXBsYXRlQmFzZUhvb2tzIEAsICdyZW5kZXJlZCdcblxuICBvbkRlc3Ryb3llZDogLT5cbiAgICBjYWxsVGVtcGxhdGVCYXNlSG9va3MgQCwgJ2Rlc3Ryb3llZCdcblxuICBpc0NyZWF0ZWQ6IC0+XG4gICAgY29tcG9uZW50ID0gQGNvbXBvbmVudCgpXG5cbiAgICBjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscyA/PSB7fVxuICAgIGNvbXBvbmVudC5fY29tcG9uZW50SW50ZXJuYWxzLmlzQ3JlYXRlZCA/PSBuZXcgUmVhY3RpdmVGaWVsZCBmYWxzZVxuXG4gICAgY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMuaXNDcmVhdGVkKClcblxuICBpc1JlbmRlcmVkOiAtPlxuICAgIGNvbXBvbmVudCA9IEBjb21wb25lbnQoKVxuXG4gICAgY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMgPz0ge31cbiAgICBjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscy5pc1JlbmRlcmVkID89IG5ldyBSZWFjdGl2ZUZpZWxkIGZhbHNlXG5cbiAgICBjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscy5pc1JlbmRlcmVkKClcblxuICBpc0Rlc3Ryb3llZDogLT5cbiAgICBjb21wb25lbnQgPSBAY29tcG9uZW50KClcblxuICAgIGNvbXBvbmVudC5fY29tcG9uZW50SW50ZXJuYWxzID89IHt9XG4gICAgY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMuaXNEZXN0cm95ZWQgPz0gbmV3IFJlYWN0aXZlRmllbGQgZmFsc2VcblxuICAgIGNvbXBvbmVudC5fY29tcG9uZW50SW50ZXJuYWxzLmlzRGVzdHJveWVkKClcblxuICBpbnNlcnRET01FbGVtZW50OiAocGFyZW50LCBub2RlLCBiZWZvcmUpIC0+XG4gICAgYmVmb3JlID89IG51bGxcbiAgICBpZiBwYXJlbnQgYW5kIG5vZGUgYW5kIChub2RlLnBhcmVudE5vZGUgaXNudCBwYXJlbnQgb3Igbm9kZS5uZXh0U2libGluZyBpc250IGJlZm9yZSlcbiAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUgbm9kZSwgYmVmb3JlXG5cbiAgICByZXR1cm5cblxuICBtb3ZlRE9NRWxlbWVudDogKHBhcmVudCwgbm9kZSwgYmVmb3JlKSAtPlxuICAgIGJlZm9yZSA/PSBudWxsXG4gICAgaWYgcGFyZW50IGFuZCBub2RlIGFuZCAobm9kZS5wYXJlbnROb2RlIGlzbnQgcGFyZW50IG9yIG5vZGUubmV4dFNpYmxpbmcgaXNudCBiZWZvcmUpXG4gICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlIG5vZGUsIGJlZm9yZVxuXG4gICAgcmV0dXJuXG5cbiAgcmVtb3ZlRE9NRWxlbWVudDogKHBhcmVudCwgbm9kZSkgLT5cbiAgICBpZiBwYXJlbnQgYW5kIG5vZGUgYW5kIG5vZGUucGFyZW50Tm9kZSBpcyBwYXJlbnRcbiAgICAgIHBhcmVudC5yZW1vdmVDaGlsZCBub2RlXG5cbiAgICByZXR1cm5cblxuICBldmVudHM6IC0+XG4gICAgIyBJbiBtaXhpbnMgdGhlcmUgaXMgbm8gcmVhc29uIGZvciBhIHRlbXBsYXRlIGluc3RhbmNlIHRvIGV4dGVuZCBhIEJsYXplIHRlbXBsYXRlLlxuICAgIHJldHVybiBbXSB1bmxlc3MgQCBpcyBAY29tcG9uZW50KClcblxuICAgIEBfY29tcG9uZW50SW50ZXJuYWxzID89IHt9XG5cbiAgICB2aWV3ID0gVHJhY2tlci5ub25yZWFjdGl2ZSA9PlxuICAgICAgQF9jb21wb25lbnRJbnRlcm5hbHMudGVtcGxhdGVJbnN0YW5jZSgpLnZpZXdcbiAgICAjIFdlIHNraXAgYmxvY2sgaGVscGVycyB0byBtYXRjaCBCbGF6ZSBiZWhhdmlvci5cbiAgICB0ZW1wbGF0ZUluc3RhbmNlID0gZ2V0VGVtcGxhdGVJbnN0YW5jZUZ1bmN0aW9uIHZpZXcsIHRydWVcblxuICAgIGZvciBldmVudHMgaW4gQF9jb21wb25lbnRJbnRlcm5hbHMudGVtcGxhdGVCYXNlLl9fZXZlbnRNYXBzXG4gICAgICBldmVudE1hcCA9IHt9XG5cbiAgICAgIGZvciBzcGVjLCBoYW5kbGVyIG9mIGV2ZW50c1xuICAgICAgICBkbyAoc3BlYywgaGFuZGxlcikgLT5cbiAgICAgICAgICBldmVudE1hcFtzcGVjXSA9IChhcmdzLi4uKSAtPlxuICAgICAgICAgICAgIyBJbiB0ZW1wbGF0ZSBldmVudCBoYW5kbGVycyB2aWV3IGFuZCB0ZW1wbGF0ZSBpbnN0YW5jZSBhcmUgbm90IGJhc2VkIG9uIHRoZSBjdXJyZW50IHRhcmdldFxuICAgICAgICAgICAgIyAobGlrZSBCbGF6ZSBDb21wb25lbnRzIGV2ZW50IGhhbmRsZXJzIGFyZSkgYnV0IGl0IGlzIGJhc2VkIG9uIHRoZSB0ZW1wbGF0ZS1sZXZlbCB2aWV3LlxuICAgICAgICAgICAgIyBJbiBhIHdheSB3ZSBhcmUgcmV2ZXJ0aW5nIGhlcmUgd2hhdCBhZGRFdmVudHMgZG9lcy5cbiAgICAgICAgICAgIHdpdGhUZW1wbGF0ZUluc3RhbmNlRnVuYyB0ZW1wbGF0ZUluc3RhbmNlLCAtPlxuICAgICAgICAgICAgICBCbGF6ZS5fd2l0aEN1cnJlbnRWaWV3IHZpZXcsIC0+XG4gICAgICAgICAgICAgICAgaGFuZGxlci5hcHBseSB2aWV3LCBhcmdzXG5cbiAgICAgIGV2ZW50TWFwXG5cbiAgIyBDb21wb25lbnQtbGV2ZWwgZGF0YSBjb250ZXh0LiBSZWFjdGl2ZS4gVXNlIHRoaXMgdG8gYWx3YXlzIGdldCB0aGVcbiAgIyB0b3AtbGV2ZWwgZGF0YSBjb250ZXh0IHVzZWQgdG8gcmVuZGVyIHRoZSBjb21wb25lbnQuIElmIHBhdGggaXNcbiAgIyBwcm92aWRlZCwgaXQgcmV0dXJucyBvbmx5IHRoZSB2YWx1ZSB1bmRlciB0aGF0IHBhdGgsIHdpdGggcmVhY3Rpdml0eVxuICAjIGxpbWl0ZWQgdG8gY2hhbmdlcyBvZiB0aGF0IHZhbHVlIG9ubHkuXG4gIGRhdGE6IChwYXRoLCBlcXVhbHNGdW5jKSAtPlxuICAgIGNvbXBvbmVudCA9IEBjb21wb25lbnQoKVxuXG4gICAgY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMgPz0ge31cbiAgICBjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscy50ZW1wbGF0ZUluc3RhbmNlID89IG5ldyBSZWFjdGl2ZUZpZWxkIG51bGwsIChhLCBiKSAtPiBhIGlzIGJcblxuICAgIGlmIHZpZXcgPSBjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscy50ZW1wbGF0ZUluc3RhbmNlKCk/LnZpZXdcbiAgICAgIGlmIHBhdGg/XG4gICAgICAgICMgRGF0YUxvb2t1cCB1c2VzIGludGVybmFsbHkgY29tcHV0ZWQgZmllbGQsIHdoaWNoIHVzZXMgdmlldydzIGF1dG9ydW4sIGJ1dFxuICAgICAgICAjIGRhdGEgbWlnaHQgYmUgdXNlZCBpbnNpZGUgcmVuZGVyKCkgbWV0aG9kLCB3aGVyZSBpdCBpcyBmb3JiaWRkZW4gdG8gdXNlXG4gICAgICAgICMgdmlldydzIGF1dG9ydW4uIFNvIHdlIHRlbXBvcmFyeSBoaWRlIHRoZSBmYWN0IHRoYXQgd2UgYXJlIGluc2lkZSBhIHZpZXdcbiAgICAgICAgIyB0byBtYWtlIGNvbXB1dGVkIGZpZWxkIHVzZSBub3JtYWwgYXV0b3J1bi5cbiAgICAgICAgcmV0dXJuIEJsYXplLl93aXRoQ3VycmVudFZpZXcgbnVsbCwgPT5cbiAgICAgICAgICBEYXRhTG9va3VwLmdldCA9PlxuICAgICAgICAgICAgQmxhemUuZ2V0RGF0YSB2aWV3XG4gICAgICAgICAgLFxuICAgICAgICAgICAgcGF0aCwgZXF1YWxzRnVuY1xuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gQmxhemUuZ2V0RGF0YSB2aWV3XG5cbiAgICB1bmRlZmluZWRcblxuICAjIENhbGxlci1sZXZlbCBkYXRhIGNvbnRleHQuIFJlYWN0aXZlLiBVc2UgdGhpcyB0byBnZXQgaW4gZXZlbnQgaGFuZGxlcnMgdGhlIGRhdGFcbiAgIyBjb250ZXh0IGF0IHRoZSBwbGFjZSB3aGVyZSBldmVudCBvcmlnaW5hdGVkICh0YXJnZXQgY29udGV4dCkuIEluIHRlbXBsYXRlIGhlbHBlcnNcbiAgIyB0aGUgZGF0YSBjb250ZXh0IHdoZXJlIHRlbXBsYXRlIGhlbHBlcnMgd2VyZSBjYWxsZWQuIEluIG9uQ3JlYXRlZCwgb25SZW5kZXJlZCxcbiAgIyBhbmQgb25EZXN0cm95ZWQsIHRoZSBzYW1lIGFzIEBkYXRhKCkuIEluc2lkZSBhIHRlbXBsYXRlIHRoaXMgaXMgdGhlIHNhbWUgYXMgdGhpcy5cbiAgIyBJZiBwYXRoIGlzIHByb3ZpZGVkLCBpdCByZXR1cm5zIG9ubHkgdGhlIHZhbHVlIHVuZGVyIHRoYXQgcGF0aCwgd2l0aCByZWFjdGl2aXR5XG4gICMgbGltaXRlZCB0byBjaGFuZ2VzIG9mIHRoYXQgdmFsdWUgb25seS4gTW9yZW92ZXIsIGlmIHBhdGggaXMgcHJvdmlkZWQgaXMgYWxzb1xuICAjIGxvb2tzIGludG8gdGhlIGN1cnJlbnQgbGV4aWNhbCBzY29wZSBkYXRhLlxuICBAY3VycmVudERhdGE6IChwYXRoLCBlcXVhbHNGdW5jKSAtPlxuICAgIHJldHVybiB1bmRlZmluZWQgdW5sZXNzIEJsYXplLmN1cnJlbnRWaWV3XG5cbiAgICBjdXJyZW50VmlldyA9IEJsYXplLmN1cnJlbnRWaWV3XG5cbiAgICBpZiBfLmlzU3RyaW5nIHBhdGhcbiAgICAgIHBhdGggPSBwYXRoLnNwbGl0ICcuJ1xuICAgIGVsc2UgaWYgbm90IF8uaXNBcnJheSBwYXRoXG4gICAgICByZXR1cm4gQmxhemUuZ2V0RGF0YSBjdXJyZW50Vmlld1xuXG4gICAgIyBEYXRhTG9va3VwIHVzZXMgaW50ZXJuYWxseSBjb21wdXRlZCBmaWVsZCwgd2hpY2ggdXNlcyB2aWV3J3MgYXV0b3J1biwgYnV0XG4gICAgIyBjdXJyZW50RGF0YSBtaWdodCBiZSB1c2VkIGluc2lkZSByZW5kZXIoKSBtZXRob2QsIHdoZXJlIGl0IGlzIGZvcmJpZGRlbiB0byB1c2VcbiAgICAjIHZpZXcncyBhdXRvcnVuLiBTbyB3ZSB0ZW1wb3JhcnkgaGlkZSB0aGUgZmFjdCB0aGF0IHdlIGFyZSBpbnNpZGUgYSB2aWV3XG4gICAgIyB0byBtYWtlIGNvbXB1dGVkIGZpZWxkIHVzZSBub3JtYWwgYXV0b3J1bi5cbiAgICBCbGF6ZS5fd2l0aEN1cnJlbnRWaWV3IG51bGwsID0+XG4gICAgICBEYXRhTG9va3VwLmdldCA9PlxuICAgICAgICBpZiBCbGF6ZS5fbGV4aWNhbEJpbmRpbmdMb29rdXAgYW5kIGxleGljYWxEYXRhID0gQmxhemUuX2xleGljYWxCaW5kaW5nTG9va3VwIGN1cnJlbnRWaWV3LCBwYXRoWzBdXG4gICAgICAgICAgIyBXZSByZXR1cm4gY3VzdG9tIGRhdGEgb2JqZWN0IHNvIHRoYXQgd2UgY2FuIHJldXNlIHRoZSBzYW1lXG4gICAgICAgICAgIyBsb29rdXAgbG9naWMgZm9yIGJvdGggbGV4aWNhbCBhbmQgdGhlIG5vcm1hbCBkYXRhIGNvbnRleHQgY2FzZS5cbiAgICAgICAgICByZXN1bHQgPSB7fVxuICAgICAgICAgIHJlc3VsdFtwYXRoWzBdXSA9IGxleGljYWxEYXRhXG4gICAgICAgICAgcmV0dXJuIHJlc3VsdFxuXG4gICAgICAgIEJsYXplLmdldERhdGEgY3VycmVudFZpZXdcbiAgICAgICxcbiAgICAgICAgcGF0aCwgZXF1YWxzRnVuY1xuXG4gICMgTWV0aG9kIHNob3VsZCBuZXZlciBiZSBvdmVycmlkZGVuLiBUaGUgaW1wbGVtZW50YXRpb24gc2hvdWxkIGFsd2F5cyBiZSBleGFjdGx5IHRoZSBzYW1lIGFzIGNsYXNzIG1ldGhvZCBpbXBsZW1lbnRhdGlvbi5cbiAgY3VycmVudERhdGE6IChwYXRoLCBlcXVhbHNGdW5jKSAtPlxuICAgIEBjb25zdHJ1Y3Rvci5jdXJyZW50RGF0YSBwYXRoLCBlcXVhbHNGdW5jXG5cbiAgIyBVc2VmdWwgaW4gdGVtcGxhdGVzIG9yIG1peGlucyB0byBnZXQgYSByZWZlcmVuY2UgdG8gdGhlIGNvbXBvbmVudC5cbiAgY29tcG9uZW50OiAtPlxuICAgIGNvbXBvbmVudCA9IEBcblxuICAgIGxvb3BcbiAgICAgICMgSWYgd2UgYXJlIG9uIGEgbWl4aW4gd2l0aG91dCBtaXhpblBhcmVudCwgd2UgY2Fubm90IHJlYWxseSBnZXQgdG8gdGhlIGNvbXBvbmVudCwgcmV0dXJuIG51bGwuXG4gICAgICByZXR1cm4gbnVsbCB1bmxlc3MgY29tcG9uZW50Lm1peGluUGFyZW50XG5cbiAgICAgICMgUmV0dXJuIGN1cnJlbnQgY29tcG9uZW50IHVubGVzcyB0aGVyZSBpcyBhIG1peGluIHBhcmVudC5cbiAgICAgIHJldHVybiBjb21wb25lbnQgdW5sZXNzIG1peGluUGFyZW50ID0gY29tcG9uZW50Lm1peGluUGFyZW50KClcbiAgICAgIGNvbXBvbmVudCA9IG1peGluUGFyZW50XG5cbiAgIyBDYWxsZXItbGV2ZWwgY29tcG9uZW50LiBJbiBtb3N0IGNhc2VzIHRoZSBzYW1lIGFzIEAsIGJ1dCBpbiBldmVudCBoYW5kbGVyc1xuICAjIGl0IHJldHVybnMgdGhlIGNvbXBvbmVudCBhdCB0aGUgcGxhY2Ugd2hlcmUgZXZlbnQgb3JpZ2luYXRlZCAodGFyZ2V0IGNvbXBvbmVudCkuXG4gICMgSW5zaWRlIHRlbXBsYXRlIGNvbnRlbnQgd3JhcHBlZCB3aXRoIGEgYmxvY2sgaGVscGVyIGNvbXBvbmVudCwgaXQgaXMgdGhlIGNsb3Nlc3RcbiAgIyBibG9jayBoZWxwZXIgY29tcG9uZW50LlxuICBAY3VycmVudENvbXBvbmVudDogLT5cbiAgICAjIFdlIGFyZSBub3Qgc2tpcHBpbmcgYmxvY2sgaGVscGVycyBiZWNhdXNlIG9uZSBvZiBtYWluIHJlYXNvbnMgZm9yIEBjdXJyZW50Q29tcG9uZW50KClcbiAgICAjIGlzIHRoYXQgd2UgY2FuIGdldCBob2xkIG9mIHRoZSBibG9jayBoZWxwZXIgY29tcG9uZW50IGluc3RhbmNlLlxuICAgIHRlbXBsYXRlSW5zdGFuY2UgPSBnZXRUZW1wbGF0ZUluc3RhbmNlRnVuY3Rpb24gQmxhemUuY3VycmVudFZpZXcsIGZhbHNlXG4gICAgdGVtcGxhdGVJbnN0YW5jZVRvQ29tcG9uZW50IHRlbXBsYXRlSW5zdGFuY2UsIGZhbHNlXG5cbiAgIyBNZXRob2Qgc2hvdWxkIG5ldmVyIGJlIG92ZXJyaWRkZW4uIFRoZSBpbXBsZW1lbnRhdGlvbiBzaG91bGQgYWx3YXlzIGJlIGV4YWN0bHkgdGhlIHNhbWUgYXMgY2xhc3MgbWV0aG9kIGltcGxlbWVudGF0aW9uLlxuICBjdXJyZW50Q29tcG9uZW50OiAtPlxuICAgIEBjb25zdHJ1Y3Rvci5jdXJyZW50Q29tcG9uZW50KClcblxuICBmaXJzdE5vZGU6IC0+XG4gICAgcmV0dXJuIEBjb21wb25lbnQoKS5fY29tcG9uZW50SW50ZXJuYWxzLnRlbXBsYXRlSW5zdGFuY2UoKS52aWV3Ll9kb21yYW5nZS5maXJzdE5vZGUoKSBpZiBAaXNSZW5kZXJlZCgpXG5cbiAgICB1bmRlZmluZWRcblxuICBsYXN0Tm9kZTogLT5cbiAgICByZXR1cm4gQGNvbXBvbmVudCgpLl9jb21wb25lbnRJbnRlcm5hbHMudGVtcGxhdGVJbnN0YW5jZSgpLnZpZXcuX2RvbXJhbmdlLmxhc3ROb2RlKCkgaWYgQGlzUmVuZGVyZWQoKVxuXG4gICAgdW5kZWZpbmVkXG5cbiAgIyBUaGUgc2FtZSBhcyBpdCB3b3VsZCBiZSBnZW5lcmF0ZWQgYXV0b21hdGljYWxseSwgb25seSB0aGF0IHRoZSBydW5GdW5jIGdldHMgYm91bmQgdG8gdGhlIGNvbXBvbmVudC5cbiAgYXV0b3J1bjogKHJ1bkZ1bmMpIC0+XG4gICAgdGVtcGxhdGVJbnN0YW5jZSA9IFRyYWNrZXIubm9ucmVhY3RpdmUgPT5cbiAgICAgIEBjb21wb25lbnQoKS5fY29tcG9uZW50SW50ZXJuYWxzPy50ZW1wbGF0ZUluc3RhbmNlPygpXG5cbiAgICB0aHJvdyBuZXcgRXJyb3IgXCJUaGUgY29tcG9uZW50IGhhcyB0byBiZSBjcmVhdGVkIGJlZm9yZSBjYWxsaW5nICdhdXRvcnVuJy5cIiB1bmxlc3MgdGVtcGxhdGVJbnN0YW5jZVxuXG4gICAgdGVtcGxhdGVJbnN0YW5jZS5hdXRvcnVuIF8uYmluZCBydW5GdW5jLCBAXG5cblNVUFBPUlRTX1JFQUNUSVZFX0lOU1RBTkNFID0gW1xuICAnc3Vic2NyaXB0aW9uc1JlYWR5J1xuXVxuXG5SRVFVSVJFX1JFTkRFUkVEX0lOU1RBTkNFID0gW1xuICAnJCcsXG4gICdmaW5kJyxcbiAgJ2ZpbmRBbGwnXG5dXG5cbiMgV2UgY29weSB1dGlsaXR5IG1ldGhvZHMgKCQsIGZpbmRBbGwsIHN1YnNjcmliZSwgZXRjLikgZnJvbSB0aGUgdGVtcGxhdGUgaW5zdGFuY2UgcHJvdG90eXBlLFxuIyBpZiBhIG1ldGhvZCB3aXRoIHRoZSBzYW1lIG5hbWUgZG9lcyBub3QgZXhpc3QgYWxyZWFkeS5cbmZvciBtZXRob2ROYW1lLCBtZXRob2Qgb2YgKEJsYXplLlRlbXBsYXRlSW5zdGFuY2U6Oikgd2hlbiBtZXRob2ROYW1lIG5vdCBvZiAoQmxhemVDb21wb25lbnQ6OilcbiAgZG8gKG1ldGhvZE5hbWUsIG1ldGhvZCkgLT5cbiAgICBpZiBtZXRob2ROYW1lIGluIFNVUFBPUlRTX1JFQUNUSVZFX0lOU1RBTkNFXG4gICAgICBCbGF6ZUNvbXBvbmVudDo6W21ldGhvZE5hbWVdID0gKGFyZ3MuLi4pIC0+XG4gICAgICAgIGNvbXBvbmVudCA9IEBjb21wb25lbnQoKVxuXG4gICAgICAgIGNvbXBvbmVudC5fY29tcG9uZW50SW50ZXJuYWxzID89IHt9XG4gICAgICAgIGNvbXBvbmVudC5fY29tcG9uZW50SW50ZXJuYWxzLnRlbXBsYXRlSW5zdGFuY2UgPz0gbmV3IFJlYWN0aXZlRmllbGQgbnVsbCwgKGEsIGIpIC0+IGEgaXMgYlxuXG4gICAgICAgIGlmIHRlbXBsYXRlSW5zdGFuY2UgPSBjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscy50ZW1wbGF0ZUluc3RhbmNlKClcbiAgICAgICAgICByZXR1cm4gdGVtcGxhdGVJbnN0YW5jZVttZXRob2ROYW1lXSBhcmdzLi4uXG5cbiAgICAgICAgdW5kZWZpbmVkXG5cbiAgICBlbHNlIGlmIG1ldGhvZE5hbWUgaW4gUkVRVUlSRV9SRU5ERVJFRF9JTlNUQU5DRVxuICAgICAgQmxhemVDb21wb25lbnQ6OlttZXRob2ROYW1lXSA9IChhcmdzLi4uKSAtPlxuICAgICAgICByZXR1cm4gQGNvbXBvbmVudCgpLl9jb21wb25lbnRJbnRlcm5hbHMudGVtcGxhdGVJbnN0YW5jZSgpW21ldGhvZE5hbWVdIGFyZ3MuLi4gaWYgQGlzUmVuZGVyZWQoKVxuXG4gICAgICAgIHVuZGVmaW5lZFxuXG4gICAgZWxzZVxuICAgICAgQmxhemVDb21wb25lbnQ6OlttZXRob2ROYW1lXSA9IChhcmdzLi4uKSAtPlxuICAgICAgICB0ZW1wbGF0ZUluc3RhbmNlID0gVHJhY2tlci5ub25yZWFjdGl2ZSA9PlxuICAgICAgICAgIEBjb21wb25lbnQoKS5fY29tcG9uZW50SW50ZXJuYWxzPy50ZW1wbGF0ZUluc3RhbmNlPygpXG5cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwiVGhlIGNvbXBvbmVudCBoYXMgdG8gYmUgY3JlYXRlZCBiZWZvcmUgY2FsbGluZyAnI3ttZXRob2ROYW1lfScuXCIgdW5sZXNzIHRlbXBsYXRlSW5zdGFuY2VcblxuICAgICAgICB0ZW1wbGF0ZUluc3RhbmNlW21ldGhvZE5hbWVdIGFyZ3MuLi5cbiIsIiAgLy8gVE9ETzogRGVkdXBsaWNhdGUgYmV0d2VlbiBibGF6ZSBjb21wb25lbnQgYW5kIGNvbW1vbiBjb21wb25lbnQgcGFja2FnZXMuXG52YXIgQ29tcG9uZW50c05hbWVzcGFjZVJlZmVyZW5jZSwgSFRNTEpTRXhwYW5kZXIsIFJFUVVJUkVfUkVOREVSRURfSU5TVEFOQ0UsIFNVUFBPUlRTX1JFQUNUSVZFX0lOU1RBTkNFLCBhZGRFdmVudHMsIGFyZ3VtZW50c0NvbnN0cnVjdG9yLCBiaW5kQ29tcG9uZW50LCBiaW5kRGF0YUNvbnRleHQsIGNhbGxUZW1wbGF0ZUJhc2VIb29rcywgY29udGVudEFzRnVuYywgY29udGVudEFzVmlldywgY3JlYXRlTWF0Y2hlciwgY3VycmVudFZpZXdJZlJlbmRlcmluZywgZXhwYW5kLCBleHBhbmRWaWV3LCBnZXRUZW1wbGF0ZUJhc2UsIGdldFRlbXBsYXRlSW5zdGFuY2UsIGdldFRlbXBsYXRlSW5zdGFuY2VGdW5jdGlvbiwgbWV0aG9kLCBtZXRob2ROYW1lLCBvcmlnaW5hbERvdCwgb3JpZ2luYWxGbGF0dGVuQXR0cmlidXRlcywgb3JpZ2luYWxHZXRUZW1wbGF0ZSwgb3JpZ2luYWxJbmNsdWRlLCBvcmlnaW5hbFZpc2l0VGFnLCByZWYsIHJlZ2lzdGVyRmlyc3RDcmVhdGVkSG9vaywgcmVnaXN0ZXJIb29rcywgdGVtcGxhdGVJbnN0YW5jZVRvQ29tcG9uZW50LCB3aXRoVGVtcGxhdGVJbnN0YW5jZUZ1bmMsIHdyYXBIZWxwZXIsIHdyYXBWaWV3QW5kVGVtcGxhdGUsICAgICAgICAgICAgICAgIFxuICBpbmRleE9mID0gW10uaW5kZXhPZjtcblxuY3JlYXRlTWF0Y2hlciA9IGZ1bmN0aW9uKHByb3BlcnR5T3JNYXRjaGVyT3JGdW5jdGlvbiwgY2hlY2tNaXhpbnMpIHtcbiAgdmFyIG1hdGNoZXIsIHByb3BlcnR5O1xuICBpZiAoXy5pc1N0cmluZyhwcm9wZXJ0eU9yTWF0Y2hlck9yRnVuY3Rpb24pKSB7XG4gICAgcHJvcGVydHkgPSBwcm9wZXJ0eU9yTWF0Y2hlck9yRnVuY3Rpb247XG4gICAgcHJvcGVydHlPck1hdGNoZXJPckZ1bmN0aW9uID0gKGNoaWxkLCBwYXJlbnQpID0+IHtcbiAgICAgIC8vIElmIGNoaWxkIGlzIHBhcmVudCwgd2UgbWlnaHQgZ2V0IGludG8gYW4gaW5maW5pdGUgbG9vcCBpZiB0aGlzIGlzXG4gICAgICAvLyBjYWxsZWQgZnJvbSBnZXRGaXJzdFdpdGgsIHNvIGluIHRoYXQgY2FzZSB3ZSBkbyBub3QgdXNlIGdldEZpcnN0V2l0aC5cbiAgICAgIGlmIChjaGVja01peGlucyAmJiBjaGlsZCAhPT0gcGFyZW50ICYmIGNoaWxkLmdldEZpcnN0V2l0aCkge1xuICAgICAgICByZXR1cm4gISFjaGlsZC5nZXRGaXJzdFdpdGgobnVsbCwgcHJvcGVydHkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHByb3BlcnR5IGluIGNoaWxkO1xuICAgICAgfVxuICAgIH07XG4gIH0gZWxzZSBpZiAoIV8uaXNGdW5jdGlvbihwcm9wZXJ0eU9yTWF0Y2hlck9yRnVuY3Rpb24pKSB7XG4gICAgYXNzZXJ0KF8uaXNPYmplY3QocHJvcGVydHlPck1hdGNoZXJPckZ1bmN0aW9uKSk7XG4gICAgbWF0Y2hlciA9IHByb3BlcnR5T3JNYXRjaGVyT3JGdW5jdGlvbjtcbiAgICBwcm9wZXJ0eU9yTWF0Y2hlck9yRnVuY3Rpb24gPSAoY2hpbGQsIHBhcmVudCkgPT4ge1xuICAgICAgdmFyIGNoaWxkV2l0aFByb3BlcnR5LCB2YWx1ZTtcbiAgICAgIGZvciAocHJvcGVydHkgaW4gbWF0Y2hlcikge1xuICAgICAgICB2YWx1ZSA9IG1hdGNoZXJbcHJvcGVydHldO1xuICAgICAgICAvLyBJZiBjaGlsZCBpcyBwYXJlbnQsIHdlIG1pZ2h0IGdldCBpbnRvIGFuIGluZmluaXRlIGxvb3AgaWYgdGhpcyBpc1xuICAgICAgICAvLyBjYWxsZWQgZnJvbSBnZXRGaXJzdFdpdGgsIHNvIGluIHRoYXQgY2FzZSB3ZSBkbyBub3QgdXNlIGdldEZpcnN0V2l0aC5cbiAgICAgICAgaWYgKGNoZWNrTWl4aW5zICYmIGNoaWxkICE9PSBwYXJlbnQgJiYgY2hpbGQuZ2V0Rmlyc3RXaXRoKSB7XG4gICAgICAgICAgY2hpbGRXaXRoUHJvcGVydHkgPSBjaGlsZC5nZXRGaXJzdFdpdGgobnVsbCwgcHJvcGVydHkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChwcm9wZXJ0eSBpbiBjaGlsZCkge1xuICAgICAgICAgICAgY2hpbGRXaXRoUHJvcGVydHkgPSBjaGlsZDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFjaGlsZFdpdGhQcm9wZXJ0eSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKGNoaWxkV2l0aFByb3BlcnR5W3Byb3BlcnR5XSkpIHtcbiAgICAgICAgICBpZiAoY2hpbGRXaXRoUHJvcGVydHlbcHJvcGVydHldKCkgIT09IHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChjaGlsZFdpdGhQcm9wZXJ0eVtwcm9wZXJ0eV0gIT09IHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuICB9XG4gIHJldHVybiBwcm9wZXJ0eU9yTWF0Y2hlck9yRnVuY3Rpb247XG59O1xuXG5nZXRUZW1wbGF0ZUluc3RhbmNlID0gZnVuY3Rpb24odmlldywgc2tpcEJsb2NrSGVscGVycykge1xuICB3aGlsZSAodmlldyAmJiAhdmlldy5fdGVtcGxhdGVJbnN0YW5jZSkge1xuICAgIGlmIChza2lwQmxvY2tIZWxwZXJzKSB7XG4gICAgICB2aWV3ID0gdmlldy5wYXJlbnRWaWV3O1xuICAgIH0gZWxzZSB7XG4gICAgICB2aWV3ID0gdmlldy5vcmlnaW5hbFBhcmVudFZpZXcgfHwgdmlldy5wYXJlbnRWaWV3O1xuICAgIH1cbiAgfVxuICByZXR1cm4gdmlldyAhPSBudWxsID8gdmlldy5fdGVtcGxhdGVJbnN0YW5jZSA6IHZvaWQgMDtcbn07XG5cbi8vIE1vcmUgb3IgbGVzcyB0aGUgc2FtZSBhcyBhbGRlZWQ6dGVtcGxhdGUtZXh0ZW5zaW9uJ3MgdGVtcGxhdGUuZ2V0KCdjb21wb25lbnQnKSBqdXN0IHNwZWNpYWxpemVkLlxuLy8gSXQgYWxsb3dzIHVzIHRvIG5vdCBoYXZlIGEgZGVwZW5kZW5jeSBvbiB0ZW1wbGF0ZS1leHRlbnNpb24gcGFja2FnZSBhbmQgdGhhdCB3ZSBjYW4gd29yayB3aXRoIElyb25cbi8vIFJvdXRlciB3aGljaCBoYXMgaXRzIG93biBEeW5hbWljVGVtcGxhdGUgY2xhc3Mgd2hpY2ggaXMgbm90IHBhdGNoZWQgYnkgdGVtcGxhdGUtZXh0ZW5zaW9uIGFuZCB0aHVzXG4vLyBkb2VzIG5vdCBoYXZlIC5nZXQoKSBtZXRob2QuXG50ZW1wbGF0ZUluc3RhbmNlVG9Db21wb25lbnQgPSBmdW5jdGlvbih0ZW1wbGF0ZUluc3RhbmNlRnVuYywgc2tpcEJsb2NrSGVscGVycykge1xuICB2YXIgdGVtcGxhdGVJbnN0YW5jZTtcbiAgdGVtcGxhdGVJbnN0YW5jZSA9IHR5cGVvZiB0ZW1wbGF0ZUluc3RhbmNlRnVuYyA9PT0gXCJmdW5jdGlvblwiID8gdGVtcGxhdGVJbnN0YW5jZUZ1bmMoKSA6IHZvaWQgMDtcbiAgLy8gSXJvbiBSb3V0ZXIgdXNlcyBpdHMgb3duIER5bmFtaWNUZW1wbGF0ZSB3aGljaCBpcyBub3QgYSBwcm9wZXIgdGVtcGxhdGUgaW5zdGFuY2UsIGJ1dCBpdCBpc1xuICAvLyBwYXNzZWQgaW4gYXMgc3VjaCwgc28gd2Ugd2FudCB0byBmaW5kIHRoZSByZWFsIG9uZSBiZWZvcmUgd2Ugc3RhcnQgc2VhcmNoaW5nIGZvciB0aGUgY29tcG9uZW50LlxuICB0ZW1wbGF0ZUluc3RhbmNlID0gZ2V0VGVtcGxhdGVJbnN0YW5jZSh0ZW1wbGF0ZUluc3RhbmNlICE9IG51bGwgPyB0ZW1wbGF0ZUluc3RhbmNlLnZpZXcgOiB2b2lkIDAsIHNraXBCbG9ja0hlbHBlcnMpO1xuICB3aGlsZSAodGVtcGxhdGVJbnN0YW5jZSkge1xuICAgIGlmICgnY29tcG9uZW50JyBpbiB0ZW1wbGF0ZUluc3RhbmNlKSB7XG4gICAgICByZXR1cm4gdGVtcGxhdGVJbnN0YW5jZS5jb21wb25lbnQ7XG4gICAgfVxuICAgIGlmIChza2lwQmxvY2tIZWxwZXJzKSB7XG4gICAgICB0ZW1wbGF0ZUluc3RhbmNlID0gZ2V0VGVtcGxhdGVJbnN0YW5jZSh0ZW1wbGF0ZUluc3RhbmNlLnZpZXcucGFyZW50Vmlldywgc2tpcEJsb2NrSGVscGVycyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRlbXBsYXRlSW5zdGFuY2UgPSBnZXRUZW1wbGF0ZUluc3RhbmNlKHRlbXBsYXRlSW5zdGFuY2Uudmlldy5vcmlnaW5hbFBhcmVudFZpZXcgfHwgdGVtcGxhdGVJbnN0YW5jZS52aWV3LnBhcmVudFZpZXcsIHNraXBCbG9ja0hlbHBlcnMpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn07XG5cbmdldFRlbXBsYXRlSW5zdGFuY2VGdW5jdGlvbiA9IGZ1bmN0aW9uKHZpZXcsIHNraXBCbG9ja0hlbHBlcnMpIHtcbiAgdmFyIHRlbXBsYXRlSW5zdGFuY2U7XG4gIHRlbXBsYXRlSW5zdGFuY2UgPSBnZXRUZW1wbGF0ZUluc3RhbmNlKHZpZXcsIHNraXBCbG9ja0hlbHBlcnMpO1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRlbXBsYXRlSW5zdGFuY2U7XG4gIH07XG59O1xuXG5Db21wb25lbnRzTmFtZXNwYWNlUmVmZXJlbmNlID0gY2xhc3MgQ29tcG9uZW50c05hbWVzcGFjZVJlZmVyZW5jZSB7XG4gIGNvbnN0cnVjdG9yKG5hbWVzcGFjZSwgdGVtcGxhdGVJbnN0YW5jZTEpIHtcbiAgICB0aGlzLm5hbWVzcGFjZSA9IG5hbWVzcGFjZTtcbiAgICB0aGlzLnRlbXBsYXRlSW5zdGFuY2UgPSB0ZW1wbGF0ZUluc3RhbmNlMTtcbiAgfVxuXG59O1xuXG4vLyBXZSBleHRlbmQgdGhlIG9yaWdpbmFsIGRvdCBvcGVyYXRvciB0byBzdXBwb3J0IHt7PiBGb28uQmFyfX0uIFRoaXMgZ29lcyB0aHJvdWdoIGEgZ2V0VGVtcGxhdGVIZWxwZXIgcGF0aCwgYnV0XG4vLyB3ZSB3YW50IHRvIHJlZGlyZWN0IGl0IHRvIHRoZSBnZXRUZW1wbGF0ZSBwYXRoLiBTbyB3ZSBtYXJrIGl0IGluIGdldFRlbXBsYXRlSGVscGVyIGFuZCB0aGVuIGhlcmUgY2FsbCBnZXRUZW1wbGF0ZS5cbm9yaWdpbmFsRG90ID0gU3BhY2ViYXJzLmRvdDtcblxuU3BhY2ViYXJzLmRvdCA9IGZ1bmN0aW9uKHZhbHVlLCAuLi5hcmdzKSB7XG4gIGlmICh2YWx1ZSBpbnN0YW5jZW9mIENvbXBvbmVudHNOYW1lc3BhY2VSZWZlcmVuY2UpIHtcbiAgICByZXR1cm4gQmxhemUuX2dldFRlbXBsYXRlKGAke3ZhbHVlLm5hbWVzcGFjZX0uJHthcmdzLmpvaW4oJy4nKX1gLCB2YWx1ZS50ZW1wbGF0ZUluc3RhbmNlKTtcbiAgfVxuICByZXR1cm4gb3JpZ2luYWxEb3QodmFsdWUsIC4uLmFyZ3MpO1xufTtcblxub3JpZ2luYWxJbmNsdWRlID0gU3BhY2ViYXJzLmluY2x1ZGU7XG5cblNwYWNlYmFycy5pbmNsdWRlID0gZnVuY3Rpb24odGVtcGxhdGVPckZ1bmN0aW9uLCAuLi5hcmdzKSB7XG4gIC8vIElmIENvbXBvbmVudHNOYW1lc3BhY2VSZWZlcmVuY2UgZ2V0cyBhbGwgdGhlIHdheSB0byB0aGUgU3BhY2ViYXJzLmluY2x1ZGUgaXQgbWVhbnMgdGhhdCB3ZSBhcmUgaW4gdGhlIHNpdHVhdGlvblxuICAvLyB3aGVyZSB0aGVyZSBpcyBib3RoIG5hbWVzcGFjZSBhbmQgY29tcG9uZW50IHdpdGggdGhlIHNhbWUgbmFtZSwgYW5kIHVzZXIgaXMgaW5jbHVkaW5nIGEgY29tcG9uZW50LiBCdXQgbmFtZXNwYWNlXG4gIC8vIHJlZmVyZW5jZSBpcyBjcmVhdGVkIGluc3RlYWQgKGJlY2F1c2Ugd2UgZG8gbm90IGtub3cgaW4gYWR2YW5jZSB0aGF0IHRoZXJlIGlzIG5vIFNwYWNlYmFycy5kb3QgY2FsbCBhcm91bmQgbG9va3VwXG4gIC8vIGNhbGwpLiBTbyB3ZSBkZXJlZmVyZW5jZSB0aGUgcmVmZXJlbmNlIGFuZCB0cnkgdG8gcmVzb2x2ZSBhIHRlbXBsYXRlLiBPZiBjb3Vyc2UsIGEgY29tcG9uZW50IG1pZ2h0IG5vdCByZWFsbHkgZXhpc3QuXG4gIGlmICh0ZW1wbGF0ZU9yRnVuY3Rpb24gaW5zdGFuY2VvZiBDb21wb25lbnRzTmFtZXNwYWNlUmVmZXJlbmNlKSB7XG4gICAgdGVtcGxhdGVPckZ1bmN0aW9uID0gQmxhemUuX2dldFRlbXBsYXRlKHRlbXBsYXRlT3JGdW5jdGlvbi5uYW1lc3BhY2UsIHRlbXBsYXRlT3JGdW5jdGlvbi50ZW1wbGF0ZUluc3RhbmNlKTtcbiAgfVxuICByZXR1cm4gb3JpZ2luYWxJbmNsdWRlKHRlbXBsYXRlT3JGdW5jdGlvbiwgLi4uYXJncyk7XG59O1xuXG4vLyBXZSBvdmVycmlkZSB0aGUgb3JpZ2luYWwgbG9va3VwIG1ldGhvZCB3aXRoIGEgc2ltaWxhciBvbmUsIHdoaWNoIHN1cHBvcnRzIGNvbXBvbmVudHMgYXMgd2VsbC5cblxuLy8gTm93IHRoZSBvcmRlciBvZiB0aGUgbG9va3VwIHdpbGwgYmUsIGluIG9yZGVyOlxuLy8gICBhIGhlbHBlciBvZiB0aGUgY3VycmVudCB0ZW1wbGF0ZVxuLy8gICBhIHByb3BlcnR5IG9mIHRoZSBjdXJyZW50IGNvbXBvbmVudCAobm90IHRoZSBCbGF6ZUNvbXBvbmVudC5jdXJyZW50Q29tcG9uZW50KCkgdGhvdWdoLCBidXQgQGNvbXBvbmVudCgpKVxuLy8gICBhIGhlbHBlciBvZiB0aGUgY3VycmVudCBjb21wb25lbnQncyBiYXNlIHRlbXBsYXRlIChub3QgdGhlIEJsYXplQ29tcG9uZW50LmN1cnJlbnRDb21wb25lbnQoKSB0aG91Z2gsIGJ1dCBAY29tcG9uZW50KCkpXG4vLyAgIHRoZSBuYW1lIG9mIGEgY29tcG9uZW50XG4vLyAgIHRoZSBuYW1lIG9mIGEgdGVtcGxhdGVcbi8vICAgZ2xvYmFsIGhlbHBlclxuLy8gICBhIHByb3BlcnR5IG9mIHRoZSBkYXRhIGNvbnRleHRcblxuLy8gUmV0dXJucyBhIGZ1bmN0aW9uLCBhIG5vbi1mdW5jdGlvbiB2YWx1ZSwgb3IgbnVsbC4gSWYgYSBmdW5jdGlvbiBpcyBmb3VuZCwgaXQgaXMgYm91bmQgYXBwcm9wcmlhdGVseS5cblxuLy8gTk9URTogVGhpcyBmdW5jdGlvbiBtdXN0IG5vdCBlc3RhYmxpc2ggYW55IHJlYWN0aXZlIGRlcGVuZGVuY2llcyBpdHNlbGYuICBJZiB0aGVyZSBpcyBhbnkgcmVhY3Rpdml0eVxuLy8gaW4gdGhlIHZhbHVlLCBsb29rdXAgc2hvdWxkIHJldHVybiBhIGZ1bmN0aW9uLlxuXG4vLyBUT0RPOiBTaG91bGQgd2UgYWxzbyBsb29rdXAgZm9yIGEgcHJvcGVydHkgb2YgdGhlIGNvbXBvbmVudC1sZXZlbCBkYXRhIGNvbnRleHQgKGFuZCB0ZW1wbGF0ZS1sZXZlbCBkYXRhIGNvbnRleHQpP1xuQmxhemUuX2dldFRlbXBsYXRlSGVscGVyID0gZnVuY3Rpb24odGVtcGxhdGUsIG5hbWUsIHRlbXBsYXRlSW5zdGFuY2UpIHtcbiAgdmFyIGNvbXBvbmVudCwgaGVscGVyLCBpc0tub3duT2xkU3R5bGVIZWxwZXIsIG1peGluT3JDb21wb25lbnQsIHJlZiwgcmVmMSwgcmVmMjtcbiAgaXNLbm93bk9sZFN0eWxlSGVscGVyID0gZmFsc2U7XG4gIGlmICh0ZW1wbGF0ZS5fX2hlbHBlcnMuaGFzKG5hbWUpKSB7XG4gICAgaGVscGVyID0gdGVtcGxhdGUuX19oZWxwZXJzLmdldChuYW1lKTtcbiAgICBpZiAoaGVscGVyID09PSBCbGF6ZS5fT0xEU1RZTEVfSEVMUEVSKSB7XG4gICAgICBpc0tub3duT2xkU3R5bGVIZWxwZXIgPSB0cnVlO1xuICAgIH0gZWxzZSBpZiAoaGVscGVyICE9IG51bGwpIHtcbiAgICAgIHJldHVybiB3cmFwSGVscGVyKGJpbmREYXRhQ29udGV4dChoZWxwZXIpLCB0ZW1wbGF0ZUluc3RhbmNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG4gIC8vIE9sZC1zdHlsZSBoZWxwZXIuXG4gIGlmIChuYW1lIGluIHRlbXBsYXRlKSB7XG4gICAgLy8gT25seSB3YXJuIG9uY2UgcGVyIGhlbHBlci5cbiAgICBpZiAoIWlzS25vd25PbGRTdHlsZUhlbHBlcikge1xuICAgICAgdGVtcGxhdGUuX19oZWxwZXJzLnNldChuYW1lLCBCbGF6ZS5fT0xEU1RZTEVfSEVMUEVSKTtcbiAgICAgIGlmICghdGVtcGxhdGUuX05PV0FSTl9PTERTVFlMRV9IRUxQRVJTKSB7XG4gICAgICAgIEJsYXplLl93YXJuKFwiQXNzaWduaW5nIGhlbHBlciB3aXRoIGBcIiArIHRlbXBsYXRlLnZpZXdOYW1lICsgXCIuXCIgKyBuYW1lICsgXCIgPSAuLi5gIGlzIGRlcHJlY2F0ZWQuICBVc2UgYFwiICsgdGVtcGxhdGUudmlld05hbWUgKyBcIi5oZWxwZXJzKC4uLilgIGluc3RlYWQuXCIpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGVtcGxhdGVbbmFtZV0gIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHdyYXBIZWxwZXIoYmluZERhdGFDb250ZXh0KHRlbXBsYXRlW25hbWVdKSwgdGVtcGxhdGVJbnN0YW5jZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuICBpZiAoIXRlbXBsYXRlSW5zdGFuY2UpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBpZiAoKHJlZiA9IHRlbXBsYXRlLnZpZXdOYW1lKSA9PT0gJ1RlbXBsYXRlLl9fZHluYW1pY1dpdGhEYXRhQ29udGV4dCcgfHwgcmVmID09PSAnVGVtcGxhdGUuX19keW5hbWljJykge1xuICAgIC8vIERvIG5vdCByZXNvbHZlIGNvbXBvbmVudCBoZWxwZXJzIGlmIGluc2lkZSBUZW1wbGF0ZS5keW5hbWljLiBUaGUgcmVhc29uIGlzIHRoYXQgVGVtcGxhdGUuZHluYW1pYyB1c2VzIGEgZGF0YSBjb250ZXh0XG4gICAgLy8gdmFsdWUgd2l0aCBuYW1lIFwidGVtcGxhdGVcIiBpbnRlcm5hbGx5LiBCdXQgd2hlbiB1c2VkIGluc2lkZSBhIGNvbXBvbmVudCB0aGUgZGF0YSBjb250ZXh0IGxvb2t1cCBpcyB0aGVuIHJlc29sdmVkXG4gICAgLy8gaW50byBhIGN1cnJlbnQgY29tcG9uZW50J3MgdGVtcGxhdGUgbWV0aG9kIGFuZCBub3QgdGhlIGRhdGEgY29udGV4dCBcInRlbXBsYXRlXCIuIFRvIGZvcmNlIHRoZSBkYXRhIGNvbnRleHQgcmVzb2x2aW5nXG4gICAgLy8gVGVtcGxhdGUuZHluYW1pYyBzaG91bGQgdXNlIFwidGhpcy50ZW1wbGF0ZVwiIGluIGl0cyB0ZW1wbGF0ZXMsIGJ1dCBpdCBkb2VzIG5vdCwgc28gd2UgaGF2ZSBhIHNwZWNpYWwgY2FzZSBoZXJlIGZvciBpdC5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICAvLyBCbGF6ZS5WaWV3Ojpsb29rdXAgc2hvdWxkIG5vdCBpbnRyb2R1Y2UgYW55IHJlYWN0aXZlIGRlcGVuZGVuY2llcywgYnV0IHdlIGNhbiBzaW1wbHkgaWdub3JlIHJlYWN0aXZpdHkgaGVyZSBiZWNhdXNlXG4gIC8vIHRlbXBsYXRlIGluc3RhbmNlIHByb2JhYmx5IGNhbm5vdCBjaGFuZ2Ugd2l0aG91dCByZWNvbnN0cnVjdGluZyB0aGUgY29tcG9uZW50IGFzIHdlbGwuXG4gIGNvbXBvbmVudCA9IFRyYWNrZXIubm9ucmVhY3RpdmUoZnVuY3Rpb24oKSB7XG4gICAgLy8gV2Ugd2FudCB0byBza2lwIGFueSBibG9jayBoZWxwZXIuIHt7bWV0aG9kfX0gc2hvdWxkIHJlc29sdmUgdG9cbiAgICAvLyB7e2NvbXBvbmVudC5tZXRob2R9fSBhbmQgbm90IHRvIHt7Y3VycmVudENvbXBvbmVudC5tZXRob2R9fS5cbiAgICByZXR1cm4gdGVtcGxhdGVJbnN0YW5jZVRvQ29tcG9uZW50KHRlbXBsYXRlSW5zdGFuY2UsIHRydWUpO1xuICB9KTtcbiAgLy8gQ29tcG9uZW50LlxuICBpZiAoY29tcG9uZW50KSB7XG4gICAgLy8gVGhpcyB3aWxsIGZpcnN0IHNlYXJjaCBvbiB0aGUgY29tcG9uZW50IGFuZCB0aGVuIGNvbnRpbnVlIHdpdGggbWl4aW5zLlxuICAgIGlmIChtaXhpbk9yQ29tcG9uZW50ID0gY29tcG9uZW50LmdldEZpcnN0V2l0aChudWxsLCBuYW1lKSkge1xuICAgICAgcmV0dXJuIHdyYXBIZWxwZXIoYmluZENvbXBvbmVudChtaXhpbk9yQ29tcG9uZW50LCBtaXhpbk9yQ29tcG9uZW50W25hbWVdKSwgdGVtcGxhdGVJbnN0YW5jZSk7XG4gICAgfVxuICB9XG4gIC8vIEEgc3BlY2lhbCBjYXNlIHRvIHN1cHBvcnQge3s+IEZvby5CYXJ9fS4gVGhpcyBnb2VzIHRocm91Z2ggYSBnZXRUZW1wbGF0ZUhlbHBlciBwYXRoLCBidXQgd2Ugd2FudCB0byByZWRpcmVjdFxuICAvLyBpdCB0byB0aGUgZ2V0VGVtcGxhdGUgcGF0aC4gU28gd2UgbWFyayBpdCBhbmQgbGVhdmUgdG8gU3BhY2ViYXJzLmRvdCB0byBjYWxsIGdldFRlbXBsYXRlLlxuICAvLyBUT0RPOiBXZSBzaG91bGQgcHJvdmlkZSBhIEJhc2VDb21wb25lbnQuZ2V0Q29tcG9uZW50c05hbWVzcGFjZSBtZXRob2QgaW5zdGVhZCBvZiBhY2Nlc3NpbmcgY29tcG9uZW50cyBkaXJlY3RseS5cbiAgaWYgKG5hbWUgJiYgbmFtZSBpbiBCbGF6ZUNvbXBvbmVudC5jb21wb25lbnRzKSB7XG4gICAgcmV0dXJuIG5ldyBDb21wb25lbnRzTmFtZXNwYWNlUmVmZXJlbmNlKG5hbWUsIHRlbXBsYXRlSW5zdGFuY2UpO1xuICB9XG4gIC8vIE1heWJlIGEgcHJlZXhpc3RpbmcgdGVtcGxhdGUgaGVscGVyIG9uIHRoZSBjb21wb25lbnQncyBiYXNlIHRlbXBsYXRlLlxuICBpZiAoY29tcG9uZW50KSB7XG4gICAgLy8gV2Uga25vdyB0aGF0IGNvbXBvbmVudCBpcyByZWFsbHkgYSBjb21wb25lbnQuXG4gICAgaWYgKChoZWxwZXIgPSAocmVmMSA9IGNvbXBvbmVudC5fY29tcG9uZW50SW50ZXJuYWxzKSAhPSBudWxsID8gKHJlZjIgPSByZWYxLnRlbXBsYXRlQmFzZSkgIT0gbnVsbCA/IHJlZjIuX19oZWxwZXJzLmdldChuYW1lKSA6IHZvaWQgMCA6IHZvaWQgMCkgIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHdyYXBIZWxwZXIoYmluZERhdGFDb250ZXh0KGhlbHBlciksIHRlbXBsYXRlSW5zdGFuY2UpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn07XG5cbnNoYXJlLmluRXhwYW5kQXR0cmlidXRlcyA9IGZhbHNlO1xuXG5iaW5kQ29tcG9uZW50ID0gZnVuY3Rpb24oY29tcG9uZW50LCBoZWxwZXIpIHtcbiAgaWYgKF8uaXNGdW5jdGlvbihoZWxwZXIpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKC4uLmFyZ3MpIHtcbiAgICAgIHZhciBuYW1lLCByZXN1bHQsIHZhbHVlO1xuICAgICAgcmVzdWx0ID0gaGVscGVyLmFwcGx5KGNvbXBvbmVudCwgYXJncyk7XG4gICAgICAvLyBJZiB3ZSBhcmUgZXhwYW5kaW5nIGF0dHJpYnV0ZXMgYW5kIHRoaXMgaXMgYW4gb2JqZWN0IHdpdGggZHluYW1pYyBhdHRyaWJ1dGVzLFxuICAgICAgLy8gdGhlbiB3ZSB3YW50IHRvIGJpbmQgYWxsIHBvc3NpYmxlIGV2ZW50IGhhbmRsZXJzIHRvIHRoZSBjb21wb25lbnQgYXMgd2VsbC5cbiAgICAgIGlmIChzaGFyZS5pbkV4cGFuZEF0dHJpYnV0ZXMgJiYgXy5pc09iamVjdChyZXN1bHQpKSB7XG4gICAgICAgIGZvciAobmFtZSBpbiByZXN1bHQpIHtcbiAgICAgICAgICB2YWx1ZSA9IHJlc3VsdFtuYW1lXTtcbiAgICAgICAgICBpZiAoc2hhcmUuRVZFTlRfSEFORExFUl9SRUdFWC50ZXN0KG5hbWUpKSB7XG4gICAgICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgICAgICAgICByZXN1bHRbbmFtZV0gPSBfLmJpbmQodmFsdWUsIGNvbXBvbmVudCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKF8uaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgcmVzdWx0W25hbWVdID0gXy5tYXAodmFsdWUsIGZ1bmN0aW9uKGZ1bikge1xuICAgICAgICAgICAgICAgIGlmIChfLmlzRnVuY3Rpb24oZnVuKSkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIF8uYmluZChmdW4sIGNvbXBvbmVudCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBmdW47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gaGVscGVyO1xuICB9XG59O1xuXG5iaW5kRGF0YUNvbnRleHQgPSBmdW5jdGlvbihoZWxwZXIpIHtcbiAgaWYgKF8uaXNGdW5jdGlvbihoZWxwZXIpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGRhdGE7XG4gICAgICBkYXRhID0gQmxhemUuZ2V0RGF0YSgpO1xuICAgICAgaWYgKGRhdGEgPT0gbnVsbCkge1xuICAgICAgICBkYXRhID0ge307XG4gICAgICB9XG4gICAgICByZXR1cm4gaGVscGVyLmFwcGx5KGRhdGEsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gaGVscGVyO1xuICB9XG59O1xuXG53cmFwSGVscGVyID0gZnVuY3Rpb24oZiwgdGVtcGxhdGVGdW5jKSB7XG4gIGlmICghQmxhemUuVGVtcGxhdGUuX3dpdGhUZW1wbGF0ZUluc3RhbmNlRnVuYykge1xuICAgIC8vIFhYWCBDT01QQVQgV0lUSCBNRVRFT1IgMS4wLjMuMlxuICAgIHJldHVybiBCbGF6ZS5fd3JhcENhdGNoaW5nRXhjZXB0aW9ucyhmLCAndGVtcGxhdGUgaGVscGVyJyk7XG4gIH1cbiAgaWYgKCFfLmlzRnVuY3Rpb24oZikpIHtcbiAgICByZXR1cm4gZjtcbiAgfVxuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGFyZ3MsIHNlbGY7XG4gICAgc2VsZiA9IHRoaXM7XG4gICAgYXJncyA9IGFyZ3VtZW50cztcbiAgICByZXR1cm4gQmxhemUuVGVtcGxhdGUuX3dpdGhUZW1wbGF0ZUluc3RhbmNlRnVuYyh0ZW1wbGF0ZUZ1bmMsIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIEJsYXplLl93cmFwQ2F0Y2hpbmdFeGNlcHRpb25zKGYsICd0ZW1wbGF0ZSBoZWxwZXInKS5hcHBseShzZWxmLCBhcmdzKTtcbiAgICB9KTtcbiAgfTtcbn07XG5cbmlmIChCbGF6ZS5UZW1wbGF0ZS5fd2l0aFRlbXBsYXRlSW5zdGFuY2VGdW5jKSB7XG4gIHdpdGhUZW1wbGF0ZUluc3RhbmNlRnVuYyA9IEJsYXplLlRlbXBsYXRlLl93aXRoVGVtcGxhdGVJbnN0YW5jZUZ1bmM7XG59IGVsc2Uge1xuICAvLyBYWFggQ09NUEFUIFdJVEggTUVURU9SIDEuMC4zLjIuXG4gIHdpdGhUZW1wbGF0ZUluc3RhbmNlRnVuYyA9IGZ1bmN0aW9uKHRlbXBsYXRlSW5zdGFuY2UsIGYpIHtcbiAgICByZXR1cm4gZigpO1xuICB9O1xufVxuXG5nZXRUZW1wbGF0ZUJhc2UgPSBmdW5jdGlvbihjb21wb25lbnQpIHtcbiAgLy8gV2UgZG8gbm90IGFsbG93IHRlbXBsYXRlIHRvIGJlIGEgcmVhY3RpdmUgbWV0aG9kLlxuICByZXR1cm4gVHJhY2tlci5ub25yZWFjdGl2ZShmdW5jdGlvbigpIHtcbiAgICB2YXIgY29tcG9uZW50VGVtcGxhdGUsIHRlbXBsYXRlQmFzZTtcbiAgICBjb21wb25lbnRUZW1wbGF0ZSA9IGNvbXBvbmVudC50ZW1wbGF0ZSgpO1xuICAgIGlmIChfLmlzU3RyaW5nKGNvbXBvbmVudFRlbXBsYXRlKSkge1xuICAgICAgdGVtcGxhdGVCYXNlID0gVGVtcGxhdGVbY29tcG9uZW50VGVtcGxhdGVdO1xuICAgICAgaWYgKCF0ZW1wbGF0ZUJhc2UpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBUZW1wbGF0ZSAnJHtjb21wb25lbnRUZW1wbGF0ZX0nIGNhbm5vdCBiZSBmb3VuZC5gKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGNvbXBvbmVudFRlbXBsYXRlKSB7XG4gICAgICB0ZW1wbGF0ZUJhc2UgPSBjb21wb25lbnRUZW1wbGF0ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBUZW1wbGF0ZSBmb3IgdGhlIGNvbXBvbmVudCAnJHtjb21wb25lbnQuY29tcG9uZW50TmFtZSgpIHx8ICd1bm5hbWVkJ30nIG5vdCBwcm92aWRlZC5gKTtcbiAgICB9XG4gICAgcmV0dXJuIHRlbXBsYXRlQmFzZTtcbiAgfSk7XG59O1xuXG5jYWxsVGVtcGxhdGVCYXNlSG9va3MgPSBmdW5jdGlvbihjb21wb25lbnQsIGhvb2tOYW1lKSB7XG4gIHZhciBjYWxsYmFja3MsIHRlbXBsYXRlSW5zdGFuY2U7XG4gIC8vIFdlIHdhbnQgdG8gY2FsbCB0ZW1wbGF0ZSBiYXNlIGhvb2tzIG9ubHkgd2hlbiB3ZSBhcmUgY2FsbGluZyB0aGlzIGZ1bmN0aW9uIG9uIGEgY29tcG9uZW50IGl0c2VsZi5cbiAgaWYgKGNvbXBvbmVudCAhPT0gY29tcG9uZW50LmNvbXBvbmVudCgpKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRlbXBsYXRlSW5zdGFuY2UgPSBUcmFja2VyLm5vbnJlYWN0aXZlKGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscy50ZW1wbGF0ZUluc3RhbmNlKCk7XG4gIH0pO1xuICBjYWxsYmFja3MgPSBjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscy50ZW1wbGF0ZUJhc2UuX2dldENhbGxiYWNrcyhob29rTmFtZSk7XG4gIFRlbXBsYXRlLl93aXRoVGVtcGxhdGVJbnN0YW5jZUZ1bmMoZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRlbXBsYXRlSW5zdGFuY2U7XG4gIH0sIGZ1bmN0aW9uKCkge1xuICAgIHZhciBjYWxsYmFjaywgaSwgbGVuLCByZXN1bHRzO1xuICAgIHJlc3VsdHMgPSBbXTtcbiAgICBmb3IgKGkgPSAwLCBsZW4gPSBjYWxsYmFja3MubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGNhbGxiYWNrID0gY2FsbGJhY2tzW2ldO1xuICAgICAgcmVzdWx0cy5wdXNoKGNhbGxiYWNrLmNhbGwodGVtcGxhdGVJbnN0YW5jZSkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfSk7XG59O1xuXG53cmFwVmlld0FuZFRlbXBsYXRlID0gZnVuY3Rpb24oY3VycmVudFZpZXcsIGYpIHtcbiAgdmFyIHRlbXBsYXRlSW5zdGFuY2U7XG4gIC8vIEZvciB0ZW1wbGF0ZSBjb250ZW50IHdyYXBwZWQgaW5zaWRlIHRoZSBibG9jayBoZWxwZXIsIHdlIHdhbnQgdG8gc2tpcCB0aGUgYmxvY2tcbiAgLy8gaGVscGVyIHdoZW4gc2VhcmNoaW5nIGZvciBjb3JyZXNwb25kaW5nIHRlbXBsYXRlLiBUaGlzIG1lYW5zIHRoYXQgVGVtcGxhdGUuaW5zdGFuY2UoKVxuICAvLyB3aWxsIHJldHVybiB0aGUgY29tcG9uZW50J3MgdGVtcGxhdGUsIHdoaWxlIEJsYXplQ29tcG9uZW50LmN1cnJlbnRDb21wb25lbnQoKSB3aWxsXG4gIC8vIHJldHVybiB0aGUgY29tcG9uZW50IGluc2lkZS5cbiAgdGVtcGxhdGVJbnN0YW5jZSA9IGdldFRlbXBsYXRlSW5zdGFuY2VGdW5jdGlvbihjdXJyZW50VmlldywgdHJ1ZSk7XG4gIC8vIFdlIHNldCB0ZW1wbGF0ZSBpbnN0YW5jZSB0byBtYXRjaCB0aGUgY3VycmVudCB2aWV3IChtb3N0bHksIG9ubHkgbm90IHdoZW4gaW5zaWRlXG4gIC8vIHRoZSBibG9jayBoZWxwZXIpLiBUaGUgbGF0dGVyIHdlIHVzZSBmb3IgQmxhemVDb21wb25lbnQuY3VycmVudENvbXBvbmVudCgpLCBidXRcbiAgLy8gaXQgaXMgZ29vZCB0aGF0IGJvdGggdGVtcGxhdGUgaW5zdGFuY2UgYW5kIGN1cnJlbnQgdmlldyBjb3JyZXNwb25kIHRvIGVhY2ggb3RoZXJcbiAgLy8gYXMgbXVjaCBhcyBwb3NzaWJsZS5cbiAgcmV0dXJuIHdpdGhUZW1wbGF0ZUluc3RhbmNlRnVuYyh0ZW1wbGF0ZUluc3RhbmNlLCBmdW5jdGlvbigpIHtcbiAgICAvLyBXZSBzZXQgdmlldyBiYXNlZCBvbiB0aGUgY3VycmVudCB2aWV3IHNvIHRoYXQgaW5zaWRlIGV2ZW50IGhhbmRsZXJzXG4gICAgLy8gQmxhemVDb21wb25lbnQuY3VycmVudERhdGEoKSAoYW5kIEJsYXplLmdldERhdGEoKSBhbmQgVGVtcGxhdGUuY3VycmVudERhdGEoKSlcbiAgICAvLyByZXR1cm5zIGRhdGEgY29udGV4dCBvZiBldmVudCB0YXJnZXQgYW5kIG5vdCBjb21wb25lbnQvdGVtcGxhdGUuIE1vcmVvdmVyLFxuICAgIC8vIGluc2lkZSBldmVudCBoYW5kbGVycyBCbGF6ZUNvbXBvbmVudC5jdXJyZW50Q29tcG9uZW50KCkgcmV0dXJucyB0aGUgY29tcG9uZW50XG4gICAgLy8gb2YgZXZlbnQgdGFyZ2V0LlxuICAgIHJldHVybiBCbGF6ZS5fd2l0aEN1cnJlbnRWaWV3KGN1cnJlbnRWaWV3LCBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBmKCk7XG4gICAgfSk7XG4gIH0pO1xufTtcblxuYWRkRXZlbnRzID0gZnVuY3Rpb24odmlldywgY29tcG9uZW50KSB7XG4gIHZhciBldmVudE1hcCwgZXZlbnRzLCBldmVudHNMaXN0LCBoYW5kbGVyLCBpLCBsZW4sIHNwZWM7XG4gIGV2ZW50c0xpc3QgPSBjb21wb25lbnQuZXZlbnRzKCk7XG4gIGlmICghXy5pc0FycmF5KGV2ZW50c0xpc3QpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGAnZXZlbnRzJyBtZXRob2QgZnJvbSB0aGUgY29tcG9uZW50ICcke2NvbXBvbmVudC5jb21wb25lbnROYW1lKCkgfHwgJ3VubmFtZWQnfScgZGlkIG5vdCByZXR1cm4gYSBsaXN0IG9mIGV2ZW50IG1hcHMuYCk7XG4gIH1cbiAgZm9yIChpID0gMCwgbGVuID0gZXZlbnRzTGlzdC5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIGV2ZW50cyA9IGV2ZW50c0xpc3RbaV07XG4gICAgZXZlbnRNYXAgPSB7fTtcbiAgICBmb3IgKHNwZWMgaW4gZXZlbnRzKSB7XG4gICAgICBoYW5kbGVyID0gZXZlbnRzW3NwZWNdO1xuICAgICAgKGZ1bmN0aW9uKHNwZWMsIGhhbmRsZXIpIHtcbiAgICAgICAgcmV0dXJuIGV2ZW50TWFwW3NwZWNdID0gZnVuY3Rpb24oLi4uYXJncykge1xuICAgICAgICAgIHZhciBjdXJyZW50VmlldywgZXZlbnQ7XG4gICAgICAgICAgZXZlbnQgPSBhcmdzWzBdO1xuICAgICAgICAgIGN1cnJlbnRWaWV3ID0gQmxhemUuZ2V0VmlldyhldmVudC5jdXJyZW50VGFyZ2V0KTtcbiAgICAgICAgICB3cmFwVmlld0FuZFRlbXBsYXRlKGN1cnJlbnRWaWV3LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBoYW5kbGVyLmFwcGx5KGNvbXBvbmVudCwgYXJncyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICB9KShzcGVjLCBoYW5kbGVyKTtcbiAgICB9XG4gICAgLy8gTWFrZSBzdXJlIENvZmZlZVNjcmlwdCBkb2VzIG5vdCByZXR1cm4gYW55dGhpbmcuXG4gICAgLy8gUmV0dXJuaW5nIGZyb20gZXZlbnQgaGFuZGxlcnMgaXMgZGVwcmVjYXRlZC5cbiAgICBCbGF6ZS5fYWRkRXZlbnRNYXAodmlldywgZXZlbnRNYXAsIHZpZXcpO1xuICB9XG59O1xuXG5vcmlnaW5hbEdldFRlbXBsYXRlID0gQmxhemUuX2dldFRlbXBsYXRlO1xuXG5CbGF6ZS5fZ2V0VGVtcGxhdGUgPSBmdW5jdGlvbihuYW1lLCB0ZW1wbGF0ZUluc3RhbmNlKSB7XG4gIHZhciB0ZW1wbGF0ZTtcbiAgLy8gQmxhemUuVmlldzo6bG9va3VwIHNob3VsZCBub3QgaW50cm9kdWNlIGFueSByZWFjdGl2ZSBkZXBlbmRlbmNpZXMsIHNvIHdlIGFyZSBtYWtpbmcgc3VyZSBpdCBpcyBzby5cbiAgdGVtcGxhdGUgPSBUcmFja2VyLm5vbnJlYWN0aXZlKGZ1bmN0aW9uKCkge1xuICAgIHZhciBwYXJlbnRDb21wb25lbnQsIHJlZjtcbiAgICBpZiAoQmxhemUuY3VycmVudFZpZXcpIHtcbiAgICAgIHBhcmVudENvbXBvbmVudCA9IEJsYXplQ29tcG9uZW50LmN1cnJlbnRDb21wb25lbnQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gV2UgZG8gbm90IHNraXAgYmxvY2sgaGVscGVycyB0byBhc3N1cmUgdGhhdCB3aGVuIGJsb2NrIGhlbHBlcnMgYXJlIHVzZWQsXG4gICAgICAvLyBjb21wb25lbnQgdHJlZSBpbnRlZ3JhdGVzIHRoZW0gbmljZWx5IGludG8gYSB0cmVlLlxuICAgICAgcGFyZW50Q29tcG9uZW50ID0gdGVtcGxhdGVJbnN0YW5jZVRvQ29tcG9uZW50KHRlbXBsYXRlSW5zdGFuY2UsIGZhbHNlKTtcbiAgICB9XG4gICAgcmV0dXJuIChyZWYgPSBCbGF6ZUNvbXBvbmVudC5nZXRDb21wb25lbnQobmFtZSkpICE9IG51bGwgPyByZWYucmVuZGVyQ29tcG9uZW50KHBhcmVudENvbXBvbmVudCkgOiB2b2lkIDA7XG4gIH0pO1xuICBpZiAodGVtcGxhdGUgJiYgKHRlbXBsYXRlIGluc3RhbmNlb2YgQmxhemUuVGVtcGxhdGUgfHwgXy5pc0Z1bmN0aW9uKHRlbXBsYXRlKSkpIHtcbiAgICByZXR1cm4gdGVtcGxhdGU7XG4gIH1cbiAgcmV0dXJuIG9yaWdpbmFsR2V0VGVtcGxhdGUobmFtZSk7XG59O1xuXG5yZWdpc3Rlckhvb2tzID0gZnVuY3Rpb24odGVtcGxhdGUsIGhvb2tzKSB7XG4gIGlmICh0ZW1wbGF0ZS5vbkNyZWF0ZWQpIHtcbiAgICB0ZW1wbGF0ZS5vbkNyZWF0ZWQoaG9va3Mub25DcmVhdGVkKTtcbiAgICB0ZW1wbGF0ZS5vblJlbmRlcmVkKGhvb2tzLm9uUmVuZGVyZWQpO1xuICAgIHJldHVybiB0ZW1wbGF0ZS5vbkRlc3Ryb3llZChob29rcy5vbkRlc3Ryb3llZCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gWFhYIENPTVBBVCBXSVRIIE1FVEVPUiAxLjAuMy4yLlxuICAgIHRlbXBsYXRlLmNyZWF0ZWQgPSBob29rcy5vbkNyZWF0ZWQ7XG4gICAgdGVtcGxhdGUucmVuZGVyZWQgPSBob29rcy5vblJlbmRlcmVkO1xuICAgIHJldHVybiB0ZW1wbGF0ZS5kZXN0cm95ZWQgPSBob29rcy5vbkRlc3Ryb3llZDtcbiAgfVxufTtcblxucmVnaXN0ZXJGaXJzdENyZWF0ZWRIb29rID0gZnVuY3Rpb24odGVtcGxhdGUsIG9uQ3JlYXRlZCkge1xuICB2YXIgb2xkQ3JlYXRlZDtcbiAgaWYgKHRlbXBsYXRlLl9jYWxsYmFja3MpIHtcbiAgICByZXR1cm4gdGVtcGxhdGUuX2NhbGxiYWNrcy5jcmVhdGVkLnVuc2hpZnQob25DcmVhdGVkKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBYWFggQ09NUEFUIFdJVEggTUVURU9SIDEuMC4zLjIuXG4gICAgb2xkQ3JlYXRlZCA9IHRlbXBsYXRlLmNyZWF0ZWQ7XG4gICAgcmV0dXJuIHRlbXBsYXRlLmNyZWF0ZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIG9uQ3JlYXRlZC5jYWxsKHRoaXMpO1xuICAgICAgcmV0dXJuIG9sZENyZWF0ZWQgIT0gbnVsbCA/IG9sZENyZWF0ZWQuY2FsbCh0aGlzKSA6IHZvaWQgMDtcbiAgICB9O1xuICB9XG59O1xuXG4vLyBXZSBtYWtlIFRlbXBsYXRlLmR5bmFtaWMgcmVzb2x2ZSB0byB0aGUgY29tcG9uZW50IGlmIGNvbXBvbmVudCBuYW1lIGlzIHNwZWNpZmllZCBhcyBhIHRlbXBsYXRlIG5hbWUsIGFuZCBub3Rcbi8vIHRvIHRoZSBub24tY29tcG9uZW50IHRlbXBsYXRlIHdoaWNoIGlzIHByb2JhYmx5IHVzZWQgb25seSBmb3IgdGhlIGNvbnRlbnQuIFdlIHNpbXBseSByZXVzZSBCbGF6ZS5fZ2V0VGVtcGxhdGUuXG4vLyBUT0RPOiBIb3cgdG8gcGFzcyBhcmdzP1xuLy8gICAgICAgTWF5YmUgc2ltcGx5IGJ5IHVzaW5nIFNwYWNlYmFycyBuZXN0ZWQgZXhwcmVzc2lvbnMgKGh0dHBzOi8vZ2l0aHViLmNvbS9tZXRlb3IvbWV0ZW9yL3B1bGwvNDEwMSk/XG4vLyAgICAgICBUZW1wbGF0ZS5keW5hbWljIHRlbXBsYXRlPVwiLi4uXCIgZGF0YT0oYXJncyAuLi4pPyBCdXQgdGhpcyBleHBvc2VzIHRoZSBmYWN0IHRoYXQgYXJncyBhcmUgcGFzc2VkIGFzIGRhdGEgY29udGV4dC5cbi8vICAgICAgIE1heWJlIHdlIHNob3VsZCBzaW1wbHkgb3ZlcnJpZGUgVGVtcGxhdGUuZHluYW1pYyBhbmQgYWRkIFwiYXJnc1wiIGFyZ3VtZW50P1xuLy8gVE9ETzogVGhpcyBjYW4gYmUgcmVtb3ZlZCBvbmNlIGh0dHBzOi8vZ2l0aHViLmNvbS9tZXRlb3IvbWV0ZW9yL3B1bGwvNDAzNiBpcyBtZXJnZWQgaW4uXG5UZW1wbGF0ZS5fX2R5bmFtaWNXaXRoRGF0YUNvbnRleHQuX19oZWxwZXJzLnNldCgnY2hvb3NlVGVtcGxhdGUnLCBmdW5jdGlvbihuYW1lKSB7XG4gIHJldHVybiBCbGF6ZS5fZ2V0VGVtcGxhdGUobmFtZSwgKCkgPT4ge1xuICAgIHJldHVybiBUZW1wbGF0ZS5pbnN0YW5jZSgpO1xuICB9KTtcbn0pO1xuXG5hcmd1bWVudHNDb25zdHJ1Y3RvciA9IGZ1bmN0aW9uKCkge1xuICAvLyBUaGlzIGNsYXNzIHNob3VsZCBuZXZlciByZWFsbHkgYmUgY3JlYXRlZC5cbiAgcmV0dXJuIGFzc2VydChmYWxzZSk7XG59O1xuXG4vLyBUT0RPOiBGaW5kIGEgd2F5IHRvIHBhc3MgYXJndW1lbnRzIHRvIHRoZSBjb21wb25lbnQgd2l0aG91dCBoYXZpbmcgdG8gaW50cm9kdWNlIG9uZSBpbnRlcm1lZGlhcnkgZGF0YSBjb250ZXh0IGludG8gdGhlIGRhdGEgY29udGV4dCBoaWVyYXJjaHkuXG4vLyAgICAgICAoSW4gZmFjdCB0d28gZGF0YSBjb250ZXh0cywgYmVjYXVzZSB3ZSBhZGQgb25lIG1vcmUgd2hlbiByZXN0b3JpbmcgdGhlIG9yaWdpbmFsIG9uZS4pXG5UZW1wbGF0ZS5yZWdpc3RlckhlbHBlcignYXJncycsIGZ1bmN0aW9uKCkge1xuICB2YXIgb2JqO1xuICBvYmogPSB7fTtcbiAgLy8gV2UgdXNlIGN1c3RvbSBjb25zdHJ1Y3RvciB0byBrbm93IHRoYXQgaXQgaXMgbm90IGEgcmVhbCBkYXRhIGNvbnRleHQuXG4gIG9iai5jb25zdHJ1Y3RvciA9IGFyZ3VtZW50c0NvbnN0cnVjdG9yO1xuICBvYmouX2FyZ3VtZW50cyA9IGFyZ3VtZW50cztcbiAgcmV0dXJuIG9iajtcbn0pO1xuXG5zaGFyZS5FVkVOVF9IQU5ETEVSX1JFR0VYID0gL15vbltBLVpdLztcblxuc2hhcmUuaXNFdmVudEhhbmRsZXIgPSBmdW5jdGlvbihmdW4pIHtcbiAgcmV0dXJuIF8uaXNGdW5jdGlvbihmdW4pICYmIGZ1bi5ldmVudEhhbmRsZXI7XG59O1xuXG4vLyBXaGVuIGV2ZW50IGhhbmRsZXJzIGFyZSBwcm92aWRlZCBkaXJlY3RseSBhcyBhcmdzIHRoZXkgYXJlIG5vdCBwYXNzZWQgdGhyb3VnaFxuLy8gU3BhY2ViYXJzLmV2ZW50IGJ5IHRoZSB0ZW1wbGF0ZSBjb21waWxlciwgc28gd2UgaGF2ZSB0byBkbyBpdCBvdXJzZWx2ZXMuXG5vcmlnaW5hbEZsYXR0ZW5BdHRyaWJ1dGVzID0gSFRNTC5mbGF0dGVuQXR0cmlidXRlcztcblxuSFRNTC5mbGF0dGVuQXR0cmlidXRlcyA9IGZ1bmN0aW9uKGF0dHJzKSB7XG4gIHZhciBuYW1lLCB2YWx1ZTtcbiAgaWYgKGF0dHJzID0gb3JpZ2luYWxGbGF0dGVuQXR0cmlidXRlcyhhdHRycykpIHtcbiAgICBmb3IgKG5hbWUgaW4gYXR0cnMpIHtcbiAgICAgIHZhbHVlID0gYXR0cnNbbmFtZV07XG4gICAgICBpZiAoIShzaGFyZS5FVkVOVF9IQU5ETEVSX1JFR0VYLnRlc3QobmFtZSkpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKHNoYXJlLmlzRXZlbnRIYW5kbGVyKHZhbHVlKSkge1xuICAgICAgICAvLyBBbHJlYWR5IHByb2Nlc3NlZCBieSBTcGFjZWJhcnMuZXZlbnQuXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKF8uaXNBcnJheSh2YWx1ZSkgJiYgXy5zb21lKHZhbHVlLCBzaGFyZS5pc0V2ZW50SGFuZGxlcikpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICAvLyBXaGVuIGV2ZW50IGhhbmRsZXJzIGFyZSBwcm92aWRlZCBkaXJlY3RseSBhcyBhcmdzLFxuICAgICAgLy8gd2UgcmVxdWlyZSB0aGVtIHRvIGJlIGp1c3QgZXZlbnQgaGFuZGxlcnMuXG4gICAgICBpZiAoXy5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICBhdHRyc1tuYW1lXSA9IF8ubWFwKHZhbHVlLCBTcGFjZWJhcnMuZXZlbnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXR0cnNbbmFtZV0gPSBTcGFjZWJhcnMuZXZlbnQodmFsdWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gYXR0cnM7XG59O1xuXG5TcGFjZWJhcnMuZXZlbnQgPSBmdW5jdGlvbihldmVudEhhbmRsZXIsIC4uLmFyZ3MpIHtcbiAgdmFyIGZ1bjtcbiAgaWYgKCFfLmlzRnVuY3Rpb24oZXZlbnRIYW5kbGVyKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgRXZlbnQgaGFuZGxlciBub3QgYSBmdW5jdGlvbjogJHtldmVudEhhbmRsZXJ9YCk7XG4gIH1cbiAgLy8gRXhlY3V0ZSBhbGwgYXJndW1lbnRzLlxuICBhcmdzID0gU3BhY2ViYXJzLm11c3RhY2hlSW1wbCgoZnVuY3Rpb24oLi4ueHMpIHtcbiAgICByZXR1cm4geHM7XG4gIH0pLCAuLi5hcmdzKTtcbiAgZnVuID0gZnVuY3Rpb24oZXZlbnQsIC4uLmV2ZW50QXJncykge1xuICAgIHZhciBjdXJyZW50VmlldztcbiAgICBjdXJyZW50VmlldyA9IEJsYXplLmdldFZpZXcoZXZlbnQuY3VycmVudFRhcmdldCk7XG4gICAgcmV0dXJuIHdyYXBWaWV3QW5kVGVtcGxhdGUoY3VycmVudFZpZXcsIGZ1bmN0aW9uKCkge1xuICAgICAgLy8gV2UgZG8gbm90IGhhdmUgdG8gYmluZCBcInRoaXNcIiBiZWNhdXNlIGV2ZW50IGhhbmRsZXJzIGFyZSByZXNvbHZlZFxuICAgICAgLy8gYXMgdGVtcGxhdGUgaGVscGVycyBhbmQgYXJlIGFscmVhZHkgYm91bmQuIFdlIGJpbmQgZXZlbnQgaGFuZGxlcnNcbiAgICAgIC8vIGluIGR5bmFtaWMgYXR0cmlidXRlcyBhbHJlYWR5IGFzIHdlbGwuXG4gICAgICByZXR1cm4gZXZlbnRIYW5kbGVyLmFwcGx5KG51bGwsIFtldmVudF0uY29uY2F0KGFyZ3MsIGV2ZW50QXJncykpO1xuICAgIH0pO1xuICB9O1xuICBmdW4uZXZlbnRIYW5kbGVyID0gdHJ1ZTtcbiAgcmV0dXJuIGZ1bjtcbn07XG5cbi8vIFdoZW4gY29udmVydGluZyB0aGUgY29tcG9uZW50IHRvIHRoZSBzdGF0aWMgSFRNTCwgcmVtb3ZlIGFsbCBldmVudCBoYW5kbGVycy5cbm9yaWdpbmFsVmlzaXRUYWcgPSBIVE1MLlRvSFRNTFZpc2l0b3IucHJvdG90eXBlLnZpc2l0VGFnO1xuXG5IVE1MLlRvSFRNTFZpc2l0b3IucHJvdG90eXBlLnZpc2l0VGFnID0gZnVuY3Rpb24odGFnKSB7XG4gIHZhciBhdHRycywgbmFtZTtcbiAgaWYgKGF0dHJzID0gdGFnLmF0dHJzKSB7XG4gICAgYXR0cnMgPSBIVE1MLmZsYXR0ZW5BdHRyaWJ1dGVzKGF0dHJzKTtcbiAgICBmb3IgKG5hbWUgaW4gYXR0cnMpIHtcbiAgICAgIGlmIChzaGFyZS5FVkVOVF9IQU5ETEVSX1JFR0VYLnRlc3QobmFtZSkpIHtcbiAgICAgICAgZGVsZXRlIGF0dHJzW25hbWVdO1xuICAgICAgfVxuICAgIH1cbiAgICB0YWcuYXR0cnMgPSBhdHRycztcbiAgfVxuICByZXR1cm4gb3JpZ2luYWxWaXNpdFRhZy5jYWxsKHRoaXMsIHRhZyk7XG59O1xuXG5jdXJyZW50Vmlld0lmUmVuZGVyaW5nID0gZnVuY3Rpb24oKSB7XG4gIHZhciB2aWV3O1xuICB2aWV3ID0gQmxhemUuY3VycmVudFZpZXc7XG4gIGlmICh2aWV3ICE9IG51bGwgPyB2aWV3Ll9pc0luUmVuZGVyIDogdm9pZCAwKSB7XG4gICAgcmV0dXJuIHZpZXc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn07XG5cbmNvbnRlbnRBc0Z1bmMgPSBmdW5jdGlvbihjb250ZW50KSB7XG4gIGlmICghXy5pc0Z1bmN0aW9uKGNvbnRlbnQpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgfTtcbiAgfVxuICByZXR1cm4gY29udGVudDtcbn07XG5cbmNvbnRlbnRBc1ZpZXcgPSBmdW5jdGlvbihjb250ZW50KSB7XG4gIC8vIFdlIGRvIG5vdCBjaGVjayBjb250ZW50IGZvciB2YWxpZGl0eS5cbiAgaWYgKGNvbnRlbnQgaW5zdGFuY2VvZiBCbGF6ZS5UZW1wbGF0ZSkge1xuICAgIHJldHVybiBjb250ZW50LmNvbnN0cnVjdFZpZXcoKTtcbiAgfSBlbHNlIGlmIChjb250ZW50IGluc3RhbmNlb2YgQmxhemUuVmlldykge1xuICAgIHJldHVybiBjb250ZW50O1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBCbGF6ZS5WaWV3KCdyZW5kZXInLCBjb250ZW50QXNGdW5jKGNvbnRlbnQpKTtcbiAgfVxufTtcblxuSFRNTEpTRXhwYW5kZXIgPSBCbGF6ZS5fSFRNTEpTRXhwYW5kZXIuZXh0ZW5kKCk7XG5cbkhUTUxKU0V4cGFuZGVyLmRlZih7XG4gIC8vIEJhc2VkIG9uIEJsYXplLl9IVE1MSlNFeHBhbmRlciwgYnV0IGNhbGxzIG91ciBleHBhbmRWaWV3LlxuICB2aXNpdE9iamVjdDogZnVuY3Rpb24oeCkge1xuICAgIGlmICh4IGluc3RhbmNlb2YgQmxhemUuVGVtcGxhdGUpIHtcbiAgICAgIHggPSB4LmNvbnN0cnVjdFZpZXcoKTtcbiAgICB9XG4gICAgaWYgKHggaW5zdGFuY2VvZiBCbGF6ZS5WaWV3KSB7XG4gICAgICByZXR1cm4gZXhwYW5kVmlldyh4LCB0aGlzLnBhcmVudFZpZXcpO1xuICAgIH1cbiAgICByZXR1cm4gSFRNTC5UcmFuc2Zvcm1pbmdWaXNpdG9yLnByb3RvdHlwZS52aXNpdE9iamVjdC5jYWxsKHRoaXMsIHgpO1xuICB9XG59KTtcblxuLy8gQmFzZWQgb24gQmxhemUuX2V4cGFuZCwgYnV0IHVzZXMgb3VyIEhUTUxKU0V4cGFuZGVyLlxuZXhwYW5kID0gZnVuY3Rpb24oaHRtbGpzLCBwYXJlbnRWaWV3KSB7XG4gIHBhcmVudFZpZXcgPSBwYXJlbnRWaWV3IHx8IGN1cnJlbnRWaWV3SWZSZW5kZXJpbmcoKTtcbiAgcmV0dXJuIChuZXcgSFRNTEpTRXhwYW5kZXIoe1xuICAgIHBhcmVudFZpZXc6IHBhcmVudFZpZXdcbiAgfSkpLnZpc2l0KGh0bWxqcyk7XG59O1xuXG4vLyBCYXNlZCBvbiBCbGF6ZS5fZXhwYW5kVmlldywgYnV0IHdpdGggZmx1c2hpbmcuXG5leHBhbmRWaWV3ID0gZnVuY3Rpb24odmlldywgcGFyZW50Vmlldykge1xuICB2YXIgaHRtbGpzLCByZXN1bHQ7XG4gIEJsYXplLl9jcmVhdGVWaWV3KHZpZXcsIHBhcmVudFZpZXcsIHRydWUpO1xuICB2aWV3Ll9pc0luUmVuZGVyID0gdHJ1ZTtcbiAgaHRtbGpzID0gQmxhemUuX3dpdGhDdXJyZW50Vmlldyh2aWV3LCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdmlldy5fcmVuZGVyKCk7XG4gIH0pO1xuICB2aWV3Ll9pc0luUmVuZGVyID0gZmFsc2U7XG4gIFRyYWNrZXIuZmx1c2goKTtcbiAgcmVzdWx0ID0gZXhwYW5kKGh0bWxqcywgdmlldyk7XG4gIFRyYWNrZXIuZmx1c2goKTtcbiAgaWYgKFRyYWNrZXIuYWN0aXZlKSB7XG4gICAgVHJhY2tlci5vbkludmFsaWRhdGUoZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gQmxhemUuX2Rlc3Ryb3lWaWV3KHZpZXcpO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIEJsYXplLl9kZXN0cm95Vmlldyh2aWV3KTtcbiAgfVxuICBUcmFja2VyLmZsdXNoKCk7XG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG5CbGF6ZUNvbXBvbmVudCA9IGNsYXNzIEJsYXplQ29tcG9uZW50IGV4dGVuZHMgQmFzZUNvbXBvbmVudCB7XG4gIC8vIFRPRE86IEZpZ3VyZSBvdXQgaG93IHRvIGRvIGF0IHRoZSBCYXNlQ29tcG9uZW50IGxldmVsP1xuICBzdGF0aWMgZ2V0Q29tcG9uZW50Rm9yRWxlbWVudChkb21FbGVtZW50KSB7XG4gICAgdmFyIHRlbXBsYXRlSW5zdGFuY2U7XG4gICAgaWYgKCFkb21FbGVtZW50KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgaWYgKGRvbUVsZW1lbnQubm9kZVR5cGUgIT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAvLyBUaGlzIHVzZXMgdGhlIHNhbWUgY2hlY2sgaWYgdGhlIGFyZ3VtZW50IGlzIGEgRE9NIGVsZW1lbnQgdGhhdCBCbGF6ZS5fRE9NUmFuZ2UuZm9yRWxlbWVudCBkb2VzLlxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXhwZWN0ZWQgRE9NIGVsZW1lbnQuXCIpO1xuICAgIH1cbiAgICAvLyBGb3IgRE9NIGVsZW1lbnRzIHdlIHdhbnQgdG8gcmV0dXJuIHRoZSBjb21wb25lbnQgd2hpY2ggbWF0Y2hlcyB0aGUgdGVtcGxhdGVcbiAgICAvLyB3aXRoIHRoYXQgRE9NIGVsZW1lbnQgYW5kIG5vdCB0aGUgY29tcG9uZW50IGNsb3Nlc3QgaW4gdGhlIGNvbXBvbmVudCB0cmVlLlxuICAgIC8vIFNvIHdlIHNraXAgdGhlIGJsb2NrIGhlbHBlcnMuIChJZiBET00gZWxlbWVudCBpcyByZW5kZXJlZCBieSB0aGUgYmxvY2sgaGVscGVyXG4gICAgLy8gdGhpcyB3aWxsIGZpbmQgdGhhdCBibG9jayBoZWxwZXIgdGVtcGxhdGUvY29tcG9uZW50LilcbiAgICB0ZW1wbGF0ZUluc3RhbmNlID0gZ2V0VGVtcGxhdGVJbnN0YW5jZUZ1bmN0aW9uKEJsYXplLmdldFZpZXcoZG9tRWxlbWVudCksIHRydWUpO1xuICAgIHJldHVybiB0ZW1wbGF0ZUluc3RhbmNlVG9Db21wb25lbnQodGVtcGxhdGVJbnN0YW5jZSwgdHJ1ZSk7XG4gIH1cblxuICBjaGlsZENvbXBvbmVudHMobmFtZU9yQ29tcG9uZW50KSB7XG4gICAgdmFyIGNvbXBvbmVudDtcbiAgICBpZiAoKGNvbXBvbmVudCA9IHRoaXMuY29tcG9uZW50KCkpICE9PSB0aGlzKSB7XG4gICAgICByZXR1cm4gY29tcG9uZW50LmNoaWxkQ29tcG9uZW50cyhuYW1lT3JDb21wb25lbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc3VwZXIuY2hpbGRDb21wb25lbnRzKC4uLmFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgLy8gQSB2ZXJzaW9uIG9mIGNoaWxkQ29tcG9uZW50c1dpdGggd2hpY2gga25vd3MgYWJvdXQgbWl4aW5zLlxuICAvLyBXaGVuIGNoZWNraW5nIGZvciBwcm9wZXJ0aWVzIGl0IGNoZWNrcyBtaXhpbnMgYXMgd2VsbC5cbiAgY2hpbGRDb21wb25lbnRzV2l0aChwcm9wZXJ0eU9yTWF0Y2hlck9yRnVuY3Rpb24pIHtcbiAgICB2YXIgY29tcG9uZW50O1xuICAgIGlmICgoY29tcG9uZW50ID0gdGhpcy5jb21wb25lbnQoKSkgIT09IHRoaXMpIHtcbiAgICAgIHJldHVybiBjb21wb25lbnQuY2hpbGRDb21wb25lbnRzV2l0aChwcm9wZXJ0eU9yTWF0Y2hlck9yRnVuY3Rpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICBhc3NlcnQocHJvcGVydHlPck1hdGNoZXJPckZ1bmN0aW9uKTtcbiAgICAgIHByb3BlcnR5T3JNYXRjaGVyT3JGdW5jdGlvbiA9IGNyZWF0ZU1hdGNoZXIocHJvcGVydHlPck1hdGNoZXJPckZ1bmN0aW9uLCB0cnVlKTtcbiAgICAgIHJldHVybiBzdXBlci5jaGlsZENvbXBvbmVudHNXaXRoKHByb3BlcnR5T3JNYXRjaGVyT3JGdW5jdGlvbik7XG4gICAgfVxuICB9XG5cbiAgcGFyZW50Q29tcG9uZW50KHBhcmVudENvbXBvbmVudCkge1xuICAgIHZhciBjb21wb25lbnQ7XG4gICAgaWYgKChjb21wb25lbnQgPSB0aGlzLmNvbXBvbmVudCgpKSAhPT0gdGhpcykge1xuICAgICAgcmV0dXJuIGNvbXBvbmVudC5wYXJlbnRDb21wb25lbnQocGFyZW50Q29tcG9uZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHN1cGVyLnBhcmVudENvbXBvbmVudCguLi5hcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIGFkZENoaWxkQ29tcG9uZW50KGNoaWxkQ29tcG9uZW50KSB7XG4gICAgdmFyIGNvbXBvbmVudDtcbiAgICBpZiAoKGNvbXBvbmVudCA9IHRoaXMuY29tcG9uZW50KCkpICE9PSB0aGlzKSB7XG4gICAgICByZXR1cm4gY29tcG9uZW50LmFkZENoaWxkQ29tcG9uZW50KGNoaWxkQ29tcG9uZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHN1cGVyLmFkZENoaWxkQ29tcG9uZW50KC4uLmFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgcmVtb3ZlQ2hpbGRDb21wb25lbnQoY2hpbGRDb21wb25lbnQpIHtcbiAgICB2YXIgY29tcG9uZW50O1xuICAgIGlmICgoY29tcG9uZW50ID0gdGhpcy5jb21wb25lbnQoKSkgIT09IHRoaXMpIHtcbiAgICAgIHJldHVybiBjb21wb25lbnQucmVtb3ZlQ2hpbGRDb21wb25lbnQoY2hpbGRDb21wb25lbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc3VwZXIucmVtb3ZlQ2hpbGRDb21wb25lbnQoLi4uYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBtaXhpbnMoKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgLy8gV2hlbiBhIGNvbXBvbmVudCBpcyB1c2VkIGFzIGEgbWl4aW4sIGNyZWF0ZU1peGlucyB3aWxsIGNhbGwgdGhpcyBtZXRob2QgdG8gc2V0IHRoZSBwYXJlbnRcbiAgLy8gY29tcG9uZW50IHVzaW5nIHRoaXMgbWl4aW4uIEV4dGVuZCB0aGlzIG1ldGhvZCBpZiB5b3Ugd2FudCB0byBkbyBhbnkgYWN0aW9uIHdoZW4gcGFyZW50IGlzXG4gIC8vIHNldCwgZm9yIGV4YW1wbGUsIGFkZCBkZXBlbmRlbmN5IG1peGlucyB0byB0aGUgcGFyZW50LiBNYWtlIHN1cmUgeW91IGNhbGwgc3VwZXIgYXMgd2VsbC5cbiAgbWl4aW5QYXJlbnQobWl4aW5QYXJlbnQpIHtcbiAgICBpZiAodGhpcy5fY29tcG9uZW50SW50ZXJuYWxzID09IG51bGwpIHtcbiAgICAgIHRoaXMuX2NvbXBvbmVudEludGVybmFscyA9IHt9O1xuICAgIH1cbiAgICAvLyBTZXR0ZXIuXG4gICAgaWYgKG1peGluUGFyZW50KSB7XG4gICAgICB0aGlzLl9jb21wb25lbnRJbnRlcm5hbHMubWl4aW5QYXJlbnQgPSBtaXhpblBhcmVudDtcbiAgICAgIC8vIFRvIGFsbG93IGNoYWluaW5nLlxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8vIEdldHRlci5cbiAgICByZXR1cm4gdGhpcy5fY29tcG9uZW50SW50ZXJuYWxzLm1peGluUGFyZW50IHx8IG51bGw7XG4gIH1cblxuICByZXF1aXJlTWl4aW4obmFtZU9yTWl4aW4pIHtcbiAgICB2YXIgcmVmO1xuICAgIGFzc2VydCgocmVmID0gdGhpcy5fY29tcG9uZW50SW50ZXJuYWxzKSAhPSBudWxsID8gcmVmLm1peGlucyA6IHZvaWQgMCk7XG4gICAgVHJhY2tlci5ub25yZWFjdGl2ZSgoKSA9PiB7XG4gICAgICB2YXIgYmFzZSwgY29tcG9uZW50LCBtaXhpbkluc3RhbmNlLCBtaXhpbkluc3RhbmNlQ29tcG9uZW50LCByZWYxLCByZWYyLCByZWYzO1xuICAgICAgLy8gRG8gbm90IGRvIGFueXRoaW5nIGlmIG1peGluIGlzIGFscmVhZHkgcmVxdWlyZWQuIFRoaXMgYWxsb3dzIG11bHRpcGxlIG1peGlucyB0byBjYWxsIHJlcXVpcmVNaXhpblxuICAgICAgLy8gaW4gbWl4aW5QYXJlbnQgbWV0aG9kIHRvIGFkZCBkZXBlbmRlbmNpZXMsIGJ1dCBpZiBkZXBlbmRlbmNpZXMgYXJlIGFscmVhZHkgdGhlcmUsIG5vdGhpbmcgaGFwcGVucy5cbiAgICAgIGlmICh0aGlzLmdldE1peGluKG5hbWVPck1peGluKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoXy5pc1N0cmluZyhuYW1lT3JNaXhpbikpIHtcbiAgICAgICAgLy8gSXQgY291bGQgYmUgdGhhdCB0aGUgY29tcG9uZW50IGlzIG5vdCBhIHJlYWwgaW5zdGFuY2Ugb2YgdGhlIEJsYXplQ29tcG9uZW50IGNsYXNzLFxuICAgICAgICAvLyBzbyBpdCBtaWdodCBub3QgaGF2ZSBhIGNvbnN0cnVjdG9yIHBvaW50aW5nIGJhY2sgdG8gYSBCbGF6ZUNvbXBvbmVudCBzdWJjbGFzcy5cbiAgICAgICAgaWYgKHRoaXMuY29uc3RydWN0b3IuZ2V0Q29tcG9uZW50KSB7XG4gICAgICAgICAgbWl4aW5JbnN0YW5jZUNvbXBvbmVudCA9IHRoaXMuY29uc3RydWN0b3IuZ2V0Q29tcG9uZW50KG5hbWVPck1peGluKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBtaXhpbkluc3RhbmNlQ29tcG9uZW50ID0gQmxhemVDb21wb25lbnQuZ2V0Q29tcG9uZW50KG5hbWVPck1peGluKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIW1peGluSW5zdGFuY2VDb21wb25lbnQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gbWl4aW4gJyR7bmFtZU9yTWl4aW59Jy5gKTtcbiAgICAgICAgfVxuICAgICAgICBtaXhpbkluc3RhbmNlID0gbmV3IG1peGluSW5zdGFuY2VDb21wb25lbnQoKTtcbiAgICAgIH0gZWxzZSBpZiAoXy5pc0Z1bmN0aW9uKG5hbWVPck1peGluKSkge1xuICAgICAgICBtaXhpbkluc3RhbmNlID0gbmV3IG5hbWVPck1peGluKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtaXhpbkluc3RhbmNlID0gbmFtZU9yTWl4aW47XG4gICAgICB9XG4gICAgICAvLyBXZSBhZGQgbWl4aW4gYmVmb3JlIHdlIGNhbGwgbWl4aW5QYXJlbnQgc28gdGhhdCBkZXBlbmRlbmNpZXMgY29tZSBhZnRlciB0aGlzIG1peGluLFxuICAgICAgLy8gYW5kIHRoYXQgd2UgcHJldmVudCBwb3NzaWJsZSBpbmZpbml0ZSBsb29wcyBiZWNhdXNlIG9mIGNpcmN1bGFyIGRlcGVuZGVuY2llcy5cbiAgICAgIC8vIFRPRE86IEZvciBub3cgd2UgZG8gbm90IHByb3ZpZGUgYW4gb2ZmaWNpYWwgQVBJIHRvIGFkZCBkZXBlbmRlbmNpZXMgYmVmb3JlIHRoZSBtaXhpbiBpdHNlbGYuXG4gICAgICB0aGlzLl9jb21wb25lbnRJbnRlcm5hbHMubWl4aW5zLnB1c2gobWl4aW5JbnN0YW5jZSk7XG4gICAgICAvLyBXZSBhbGxvdyBtaXhpbnMgdG8gbm90IGJlIGNvbXBvbmVudHMsIHNvIG1ldGhvZHMgYXJlIG5vdCBuZWNlc3NhcnkgYXZhaWxhYmxlLlxuXG4gICAgICAvLyBTZXQgbWl4aW4gcGFyZW50LlxuICAgICAgaWYgKG1peGluSW5zdGFuY2UubWl4aW5QYXJlbnQpIHtcbiAgICAgICAgbWl4aW5JbnN0YW5jZS5taXhpblBhcmVudCh0aGlzKTtcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlb2YgbWl4aW5JbnN0YW5jZS5jcmVhdGVNaXhpbnMgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBtaXhpbkluc3RhbmNlLmNyZWF0ZU1peGlucygpO1xuICAgICAgfVxuICAgICAgaWYgKGNvbXBvbmVudCA9IHRoaXMuY29tcG9uZW50KCkpIHtcbiAgICAgICAgaWYgKGNvbXBvbmVudC5fY29tcG9uZW50SW50ZXJuYWxzID09IG51bGwpIHtcbiAgICAgICAgICBjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscyA9IHt9O1xuICAgICAgICB9XG4gICAgICAgIGlmICgoYmFzZSA9IGNvbXBvbmVudC5fY29tcG9uZW50SW50ZXJuYWxzKS50ZW1wbGF0ZUluc3RhbmNlID09IG51bGwpIHtcbiAgICAgICAgICBiYXNlLnRlbXBsYXRlSW5zdGFuY2UgPSBuZXcgUmVhY3RpdmVGaWVsZChudWxsLCBmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gYSA9PT0gYjtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAvLyBJZiBhIG1peGluIGlzIGFkZGluZyBhIGRlcGVuZGVuY3kgdXNpbmcgcmVxdWlyZU1peGluIGFmdGVyIGl0cyBtaXhpblBhcmVudCBjbGFzcyAoZm9yIGV4YW1wbGUsIGluIG9uQ3JlYXRlKVxuICAgICAgICAvLyBhbmQgdGhpcyBpcyB0aGlzIGRlcGVuZGVuY3kgbWl4aW4sIHRoZSB2aWV3IG1pZ2h0IGFscmVhZHkgYmUgY3JlYXRlZCBvciByZW5kZXJlZCBhbmQgY2FsbGJhY2tzIHdlcmVcbiAgICAgICAgLy8gYWxyZWFkeSBjYWxsZWQsIHNvIHdlIHNob3VsZCBjYWxsIHRoZW0gbWFudWFsbHkgaGVyZSBhcyB3ZWxsLiBCdXQgb25seSBpZiBoZSB2aWV3IGhhcyBub3QgYmVlbiBkZXN0cm95ZWRcbiAgICAgICAgLy8gYWxyZWFkeS4gRm9yIHRob3NlIG1peGlucyB3ZSBkbyBub3QgY2FsbCBhbnl0aGluZywgdGhlcmUgaXMgbGl0dGxlIHVzZSBmb3IgdGhlbSBub3cuXG4gICAgICAgIGlmICghKChyZWYxID0gY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMudGVtcGxhdGVJbnN0YW5jZSgpKSAhPSBudWxsID8gcmVmMS52aWV3LmlzRGVzdHJveWVkIDogdm9pZCAwKSkge1xuICAgICAgICAgIGlmICghY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMuaW5PbkNyZWF0ZWQgJiYgKChyZWYyID0gY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMudGVtcGxhdGVJbnN0YW5jZSgpKSAhPSBudWxsID8gcmVmMi52aWV3LmlzQ3JlYXRlZCA6IHZvaWQgMCkpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgbWl4aW5JbnN0YW5jZS5vbkNyZWF0ZWQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICBtaXhpbkluc3RhbmNlLm9uQ3JlYXRlZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIWNvbXBvbmVudC5fY29tcG9uZW50SW50ZXJuYWxzLmluT25SZW5kZXJlZCAmJiAoKHJlZjMgPSBjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscy50ZW1wbGF0ZUluc3RhbmNlKCkpICE9IG51bGwgPyByZWYzLnZpZXcuaXNSZW5kZXJlZCA6IHZvaWQgMCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgbWl4aW5JbnN0YW5jZS5vblJlbmRlcmVkID09PSBcImZ1bmN0aW9uXCIgPyBtaXhpbkluc3RhbmNlLm9uUmVuZGVyZWQoKSA6IHZvaWQgMDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIE1ldGhvZCB0byBpbnN0YW50aWF0ZSBhbGwgbWl4aW5zLlxuICBjcmVhdGVNaXhpbnMoKSB7XG4gICAgdmFyIGksIGxlbiwgbWl4aW4sIHJlZjtcbiAgICBpZiAodGhpcy5fY29tcG9uZW50SW50ZXJuYWxzID09IG51bGwpIHtcbiAgICAgIHRoaXMuX2NvbXBvbmVudEludGVybmFscyA9IHt9O1xuICAgIH1cbiAgICAvLyBUbyBhbGxvdyBjYWxsaW5nIGl0IG11bHRpcGxlIHRpbWVzLCBidXQgbm9uLWZpcnN0IGNhbGxzIGFyZSBzaW1wbHkgaWdub3JlZC5cbiAgICBpZiAodGhpcy5fY29tcG9uZW50SW50ZXJuYWxzLm1peGlucykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9jb21wb25lbnRJbnRlcm5hbHMubWl4aW5zID0gW107XG4gICAgcmVmID0gdGhpcy5taXhpbnMoKTtcbiAgICBmb3IgKGkgPSAwLCBsZW4gPSByZWYubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIG1peGluID0gcmVmW2ldO1xuICAgICAgdGhpcy5yZXF1aXJlTWl4aW4obWl4aW4pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldE1peGluKG5hbWVPck1peGluKSB7XG4gICAgaWYgKF8uaXNTdHJpbmcobmFtZU9yTWl4aW4pKSB7XG4gICAgICAvLyBCeSBwYXNzaW5nIEAgYXMgdGhlIGZpcnN0IGFyZ3VtZW50LCB3ZSB0cmF2ZXJzZSBvbmx5IG1peGlucy5cbiAgICAgIHJldHVybiB0aGlzLmdldEZpcnN0V2l0aCh0aGlzLCAoY2hpbGQsIHBhcmVudCkgPT4ge1xuICAgICAgICB2YXIgbWl4aW5Db21wb25lbnROYW1lO1xuICAgICAgICAvLyBXZSBkbyBub3QgcmVxdWlyZSBtaXhpbnMgdG8gYmUgY29tcG9uZW50cywgYnV0IGlmIHRoZXkgYXJlLCB0aGV5IGNhblxuICAgICAgICAvLyBiZSByZWZlcmVuY2VkIGJhc2VkIG9uIHRoZWlyIGNvbXBvbmVudCBuYW1lLlxuICAgICAgICBtaXhpbkNvbXBvbmVudE5hbWUgPSAodHlwZW9mIGNoaWxkLmNvbXBvbmVudE5hbWUgPT09IFwiZnVuY3Rpb25cIiA/IGNoaWxkLmNvbXBvbmVudE5hbWUoKSA6IHZvaWQgMCkgfHwgbnVsbDtcbiAgICAgICAgcmV0dXJuIG1peGluQ29tcG9uZW50TmFtZSAmJiBtaXhpbkNvbXBvbmVudE5hbWUgPT09IG5hbWVPck1peGluO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEJ5IHBhc3NpbmcgQCBhcyB0aGUgZmlyc3QgYXJndW1lbnQsIHdlIHRyYXZlcnNlIG9ubHkgbWl4aW5zLlxuICAgICAgcmV0dXJuIHRoaXMuZ2V0Rmlyc3RXaXRoKHRoaXMsIChjaGlsZCwgcGFyZW50KSA9PiB7XG4gICAgICAgIGlmIChjaGlsZC5jb25zdHJ1Y3RvciA9PT0gbmFtZU9yTWl4aW4pIHtcbiAgICAgICAgICAvLyBuYW1lT3JNaXhpbiBpcyBhIGNsYXNzLlxuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjaGlsZCA9PT0gbmFtZU9yTWl4aW4pIHtcbiAgICAgICAgICAvLyBuYW1lT3JNaXhpbiBpcyBhbiBpbnN0YW5jZSwgb3Igc29tZXRoaW5nIGVsc2UuXG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLy8gQ2FsbHMgdGhlIGNvbXBvbmVudCAoaWYgYWZ0ZXJDb21wb25lbnRPck1peGluIGlzIG51bGwpIG9yIHRoZSBmaXJzdCBuZXh0IG1peGluXG4gIC8vIGFmdGVyIGFmdGVyQ29tcG9uZW50T3JNaXhpbiBpdCBmaW5kcywgYW5kIHJldHVybnMgdGhlIHJlc3VsdC5cbiAgY2FsbEZpcnN0V2l0aChhZnRlckNvbXBvbmVudE9yTWl4aW4sIHByb3BlcnR5TmFtZSwgLi4uYXJncykge1xuICAgIHZhciBjb21wb25lbnRPck1peGluO1xuICAgIGFzc2VydChfLmlzU3RyaW5nKHByb3BlcnR5TmFtZSkpO1xuICAgIGNvbXBvbmVudE9yTWl4aW4gPSB0aGlzLmdldEZpcnN0V2l0aChhZnRlckNvbXBvbmVudE9yTWl4aW4sIHByb3BlcnR5TmFtZSk7XG4gICAgLy8gVE9ETzogU2hvdWxkIHdlIHRocm93IGFuIGVycm9yIGhlcmU/IFNvbWV0aGluZyBsaWtlIGNhbGxpbmcgYSBmdW5jdGlvbiB3aGljaCBkb2VzIG5vdCBleGlzdD9cbiAgICBpZiAoIWNvbXBvbmVudE9yTWl4aW4pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gV2UgYXJlIG5vdCBjYWxsaW5nIGNhbGxGaXJzdFdpdGggb24gdGhlIGNvbXBvbmVudE9yTWl4aW4gYmVjYXVzZSBoZXJlIHdlXG4gICAgLy8gYXJlIGFscmVhZHkgdHJhdmVyc2luZyBtaXhpbnMgc28gd2UgZG8gbm90IHJlY3Vyc2Ugb25jZSBtb3JlLlxuICAgIGlmIChfLmlzRnVuY3Rpb24oY29tcG9uZW50T3JNaXhpbltwcm9wZXJ0eU5hbWVdKSkge1xuICAgICAgcmV0dXJuIGNvbXBvbmVudE9yTWl4aW5bcHJvcGVydHlOYW1lXSguLi5hcmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGNvbXBvbmVudE9yTWl4aW5bcHJvcGVydHlOYW1lXTtcbiAgICB9XG4gIH1cblxuICBnZXRGaXJzdFdpdGgoYWZ0ZXJDb21wb25lbnRPck1peGluLCBwcm9wZXJ0eU9yTWF0Y2hlck9yRnVuY3Rpb24pIHtcbiAgICB2YXIgZm91bmQsIGksIGxlbiwgbWl4aW4sIHJlZiwgcmVmMTtcbiAgICBhc3NlcnQoKHJlZiA9IHRoaXMuX2NvbXBvbmVudEludGVybmFscykgIT0gbnVsbCA/IHJlZi5taXhpbnMgOiB2b2lkIDApO1xuICAgIGFzc2VydChwcm9wZXJ0eU9yTWF0Y2hlck9yRnVuY3Rpb24pO1xuICAgIC8vIEhlcmUgd2UgYXJlIGFscmVhZHkgdHJhdmVyc2luZyBtaXhpbnMgc28gd2UgZG8gbm90IHJlY3Vyc2Ugb25jZSBtb3JlLlxuICAgIHByb3BlcnR5T3JNYXRjaGVyT3JGdW5jdGlvbiA9IGNyZWF0ZU1hdGNoZXIocHJvcGVydHlPck1hdGNoZXJPckZ1bmN0aW9uLCBmYWxzZSk7XG4gICAgLy8gSWYgYWZ0ZXJDb21wb25lbnRPck1peGluIGlzIG5vdCBwcm92aWRlZCwgd2Ugc3RhcnQgd2l0aCB0aGUgY29tcG9uZW50LlxuICAgIGlmICghYWZ0ZXJDb21wb25lbnRPck1peGluKSB7XG4gICAgICBpZiAocHJvcGVydHlPck1hdGNoZXJPckZ1bmN0aW9uLmNhbGwodGhpcywgdGhpcywgdGhpcykpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICAvLyBBbmQgY29udGludWUgd2l0aCBtaXhpbnMuXG4gICAgICBmb3VuZCA9IHRydWU7XG4gICAgLy8gSWYgYWZ0ZXJDb21wb25lbnRPck1peGluIGlzIHRoZSBjb21wb25lbnQsIHdlIHN0YXJ0IHdpdGggbWl4aW5zLlxuICAgIH0gZWxzZSBpZiAoYWZ0ZXJDb21wb25lbnRPck1peGluICYmIGFmdGVyQ29tcG9uZW50T3JNaXhpbiA9PT0gdGhpcykge1xuICAgICAgZm91bmQgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBmb3VuZCA9IGZhbHNlO1xuICAgIH1cbiAgICByZWYxID0gdGhpcy5fY29tcG9uZW50SW50ZXJuYWxzLm1peGlucztcbiAgICAvLyBUT0RPOiBJbXBsZW1lbnQgd2l0aCBhIG1hcCBiZXR3ZWVuIG1peGluIC0+IHBvc2l0aW9uLCBzbyB0aGF0IHdlIGRvIG5vdCBoYXZlIHRvIHNlZWsgdG8gZmluZCBhIG1peGluLlxuICAgIGZvciAoaSA9IDAsIGxlbiA9IHJlZjEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIG1peGluID0gcmVmMVtpXTtcbiAgICAgIGlmIChmb3VuZCAmJiBwcm9wZXJ0eU9yTWF0Y2hlck9yRnVuY3Rpb24uY2FsbCh0aGlzLCBtaXhpbiwgdGhpcykpIHtcbiAgICAgICAgcmV0dXJuIG1peGluO1xuICAgICAgfVxuICAgICAgaWYgKG1peGluID09PSBhZnRlckNvbXBvbmVudE9yTWl4aW4pIHtcbiAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIFRoaXMgY2xhc3MgbWV0aG9kIG1vcmUgb3IgbGVzcyBqdXN0IGNyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgYSBjb21wb25lbnQgYW5kIGNhbGxzIGl0cyByZW5kZXJDb21wb25lbnRcbiAgLy8gbWV0aG9kLiBCdXQgYmVjYXVzZSB3ZSB3YW50IHRvIGFsbG93IHBhc3NpbmcgYXJndW1lbnRzIHRvIHRoZSBjb21wb25lbnQgaW4gdGVtcGxhdGVzLCB3ZSBoYXZlIHNvbWVcbiAgLy8gY29tcGxpY2F0ZWQgY29kZSBhcm91bmQgdG8gZXh0cmFjdCBhbmQgcGFzcyB0aG9zZSBhcmd1bWVudHMuIEl0IGlzIHNpbWlsYXIgdG8gaG93IGRhdGEgY29udGV4dCBpc1xuICAvLyBwYXNzZWQgdG8gYmxvY2sgaGVscGVycy4gSW4gYSBkYXRhIGNvbnRleHQgdmlzaWJsZSBvbmx5IHRvIHRoZSBibG9jayBoZWxwZXIgdGVtcGxhdGUuXG4gIC8vIFRPRE86IFRoaXMgY291bGQgYmUgbWFkZSBsZXNzIGhhY2t5LiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL21ldGVvci9tZXRlb3IvaXNzdWVzLzM5MTNcbiAgc3RhdGljIHJlbmRlckNvbXBvbmVudChwYXJlbnRDb21wb25lbnQpIHtcbiAgICByZXR1cm4gVHJhY2tlci5ub25yZWFjdGl2ZSgoKSA9PiB7XG4gICAgICB2YXIgY29tcG9uZW50Q2xhc3MsIGRhdGE7XG4gICAgICBjb21wb25lbnRDbGFzcyA9IHRoaXM7XG4gICAgICBpZiAoQmxhemUuY3VycmVudFZpZXcpIHtcbiAgICAgICAgLy8gV2UgY2hlY2sgZGF0YSBjb250ZXh0IGluIGEgbm9uLXJlYWN0aXZlIHdheSwgYmVjYXVzZSB3ZSB3YW50IGp1c3QgdG8gcGVlayBpbnRvIGl0XG4gICAgICAgIC8vIGFuZCBkZXRlcm1pbmUgaWYgZGF0YSBjb250ZXh0IGNvbnRhaW5zIGNvbXBvbmVudCBhcmd1bWVudHMgb3Igbm90LiBBbmQgd2hpbGVcbiAgICAgICAgLy8gY29tcG9uZW50IGFyZ3VtZW50cyBtaWdodCBjaGFuZ2UgdGhyb3VnaCB0aW1lLCB0aGUgZmFjdCB0aGF0IHRoZXkgYXJlIHRoZXJlIGF0XG4gICAgICAgIC8vIGFsbCBvciBub3QgKFwiYXJnc1wiIHRlbXBsYXRlIGhlbHBlciB3YXMgdXNlZCBvciBub3QpIGRvZXMgbm90IGNoYW5nZSB0aHJvdWdoIHRpbWUuXG4gICAgICAgIC8vIFNvIHdlIGNhbiBjaGVjayB0aGF0IG5vbi1yZWFjdGl2ZWx5LlxuICAgICAgICBkYXRhID0gVGVtcGxhdGUuY3VycmVudERhdGEoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRoZXJlIGlzIG5vIGN1cnJlbnQgdmlldyB3aGVuIHRoZXJlIGlzIG5vIGRhdGEgY29udGV4dCB5ZXQsIHRodXMgYWxzbyBubyBhcmd1bWVudHNcbiAgICAgICAgLy8gd2VyZSBwcm92aWRlZCB0aHJvdWdoIFwiYXJnc1wiIHRlbXBsYXRlIGhlbHBlciwgc28gd2UganVzdCBjb250aW51ZSBub3JtYWxseS5cbiAgICAgICAgZGF0YSA9IG51bGw7XG4gICAgICB9XG4gICAgICBpZiAoKGRhdGEgIT0gbnVsbCA/IGRhdGEuY29uc3RydWN0b3IgOiB2b2lkIDApICE9PSBhcmd1bWVudHNDb25zdHJ1Y3Rvcikge1xuICAgICAgICAvLyBTbyB0aGF0IGN1cnJlbnRDb21wb25lbnQgaW4gdGhlIGNvbnN0cnVjdG9yIGNhbiByZXR1cm4gdGhlIGNvbXBvbmVudFxuICAgICAgICAvLyBpbnNpZGUgd2hpY2ggdGhpcyBjb21wb25lbnQgaGFzIGJlZW4gY29uc3RydWN0ZWQuXG4gICAgICAgIHJldHVybiB3cmFwVmlld0FuZFRlbXBsYXRlKEJsYXplLmN1cnJlbnRWaWV3LCAoKSA9PiB7XG4gICAgICAgICAgdmFyIGNvbXBvbmVudDtcbiAgICAgICAgICBjb21wb25lbnQgPSBuZXcgY29tcG9uZW50Q2xhc3MoKTtcbiAgICAgICAgICByZXR1cm4gY29tcG9uZW50LnJlbmRlckNvbXBvbmVudChwYXJlbnRDb21wb25lbnQpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHsgICAgICAgIC8vIEFyZ3VtZW50cyB3ZXJlIHByb3ZpZGVkIHRocm91Z2ggXCJhcmdzXCIgdGVtcGxhdGUgaGVscGVyLlxuXG4gICAgICAgIC8vIFdlIHdhbnQgdG8gcmVhY3RpdmVseSBkZXBlbmQgb24gdGhlIGRhdGEgY29udGV4dCBmb3IgYXJndW1lbnRzLCBzbyB3ZSByZXR1cm4gYSBmdW5jdGlvblxuICAgICAgICAvLyBpbnN0ZWFkIG9mIGEgdGVtcGxhdGUuIEZ1bmN0aW9uIHdpbGwgYmUgcnVuIGluc2lkZSBhbiBhdXRvcnVuLCBhIHJlYWN0aXZlIGNvbnRleHQuXG4gICAgICAgIHZhciBjdXJyZW50V2l0aCwgbm9ucmVhY3RpdmVBcmd1bWVudHMsIHJlYWN0aXZlQXJndW1lbnRzO1xuICAgICAgICBhc3NlcnQoVHJhY2tlci5hY3RpdmUpO1xuICAgICAgICAvLyBXZSBjYW5ub3QgdXNlIFRlbXBsYXRlLmdldERhdGEoKSBpbnNpZGUgYSBub3JtYWwgYXV0b3J1biBiZWNhdXNlIGN1cnJlbnQgdmlldyBpcyBub3QgZGVmaW5lZCBpbnNpZGVcbiAgICAgICAgLy8gYSBub3JtYWwgYXV0b3J1bi4gQnV0IHdlIGRvIG5vdCByZWFsbHkgaGF2ZSB0byBkZXBlbmQgcmVhY3RpdmVseSBvbiB0aGUgY3VycmVudCB2aWV3LCBvbmx5IG9uIHRoZVxuICAgICAgICAvLyBkYXRhIGNvbnRleHQgb2YgYSBrbm93biAodGhlIGNsb3Nlc3QgQmxhemUuV2l0aCkgdmlldy4gU28gd2UgZ2V0IHRoaXMgdmlldyBieSBvdXJzZWx2ZXMuXG4gICAgICAgIGN1cnJlbnRXaXRoID0gQmxhemUuZ2V0Vmlldygnd2l0aCcpO1xuICAgICAgICAvLyBCeSBkZWZhdWx0IGRhdGFWYXIgaW4gdGhlIEJsYXplLldpdGggdmlldyB1c2VzIFJlYWN0aXZlVmFyIHdpdGggZGVmYXVsdCBlcXVhbGl0eSBmdW5jdGlvbiB3aGljaFxuICAgICAgICAvLyBzZWVzIGFsbCBvYmplY3RzIGFzIGRpZmZlcmVudC4gU28gaW52YWxpZGF0aW9ucyBhcmUgdHJpZ2dlcmVkIGZvciBldmVyeSBkYXRhIGNvbnRleHQgYXNzaWdubWVudHNcbiAgICAgICAgLy8gZXZlbiBpZiBkYXRhIGhhcyBub3QgcmVhbGx5IGNoYW5nZWQuIFRoaXMgaXMgd2h5IHdyYXAgaXQgaW50byBhIENvbXB1dGVkRmllbGQgd2l0aCBFSlNPTi5lcXVhbHMuXG4gICAgICAgIC8vIEJlY2F1c2UgaXQgdXNlcyBFSlNPTi5lcXVhbHMgaXQgd2lsbCBpbnZhbGlkYXRlIG91ciBmdW5jdGlvbiBvbmx5IGlmIHJlYWxseSBjaGFuZ2VzLlxuICAgICAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL21ldGVvci9tZXRlb3IvaXNzdWVzLzQwNzNcbiAgICAgICAgcmVhY3RpdmVBcmd1bWVudHMgPSBuZXcgQ29tcHV0ZWRGaWVsZChmdW5jdGlvbigpIHtcbiAgICAgICAgICBkYXRhID0gY3VycmVudFdpdGguZGF0YVZhci5nZXQoKTtcbiAgICAgICAgICBhc3NlcnQuZXF1YWwoZGF0YSAhPSBudWxsID8gZGF0YS5jb25zdHJ1Y3RvciA6IHZvaWQgMCwgYXJndW1lbnRzQ29uc3RydWN0b3IpO1xuICAgICAgICAgIHJldHVybiBkYXRhLl9hcmd1bWVudHM7XG4gICAgICAgIH0sIEVKU09OLmVxdWFscyk7XG4gICAgICAgIC8vIEhlcmUgd2UgcmVnaXN0ZXIgYSByZWFjdGl2ZSBkZXBlbmRlbmN5IG9uIHRoZSBDb21wdXRlZEZpZWxkLlxuICAgICAgICBub25yZWFjdGl2ZUFyZ3VtZW50cyA9IHJlYWN0aXZlQXJndW1lbnRzKCk7XG4gICAgICAgIHJldHVybiBUcmFja2VyLm5vbnJlYWN0aXZlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciB0ZW1wbGF0ZTtcbiAgICAgICAgICAvLyBBcmd1bWVudHMgd2VyZSBwYXNzZWQgaW4gYXMgYSBkYXRhIGNvbnRleHQuIFdlIHdhbnQgY3VycmVudERhdGEgaW4gdGhlIGNvbnN0cnVjdG9yIHRvIHJldHVybiB0aGVcbiAgICAgICAgICAvLyBvcmlnaW5hbCAocGFyZW50KSBkYXRhIGNvbnRleHQuIExpa2Ugd2Ugd2VyZSBub3QgcGFzc2luZyBpbiBhcmd1bWVudHMgYXMgYSBkYXRhIGNvbnRleHQuXG4gICAgICAgICAgdGVtcGxhdGUgPSBCbGF6ZS5fd2l0aEN1cnJlbnRWaWV3KEJsYXplLmN1cnJlbnRWaWV3LnBhcmVudFZpZXcucGFyZW50VmlldywgKCkgPT4ge1xuICAgICAgICAgICAgLy8gU28gdGhhdCBjdXJyZW50Q29tcG9uZW50IGluIHRoZSBjb25zdHJ1Y3RvciBjYW4gcmV0dXJuIHRoZSBjb21wb25lbnRcbiAgICAgICAgICAgIC8vIGluc2lkZSB3aGljaCB0aGlzIGNvbXBvbmVudCBoYXMgYmVlbiBjb25zdHJ1Y3RlZC5cbiAgICAgICAgICAgIHJldHVybiB3cmFwVmlld0FuZFRlbXBsYXRlKEJsYXplLmN1cnJlbnRWaWV3LCAoKSA9PiB7XG4gICAgICAgICAgICAgIHZhciBjb21wb25lbnQ7XG4gICAgICAgICAgICAgIC8vIFVzZSBhcmd1bWVudHMgZm9yIHRoZSBjb25zdHJ1Y3Rvci5cbiAgICAgICAgICAgICAgY29tcG9uZW50ID0gbmV3IGNvbXBvbmVudENsYXNzKC4uLm5vbnJlYWN0aXZlQXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgcmV0dXJuIGNvbXBvbmVudC5yZW5kZXJDb21wb25lbnQocGFyZW50Q29tcG9uZW50KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIC8vIEl0IGhhcyB0byBiZSB0aGUgZmlyc3QgY2FsbGJhY2sgc28gdGhhdCBvdGhlciBoYXZlIGEgY29ycmVjdCBkYXRhIGNvbnRleHQuXG4gICAgICAgICAgcmVnaXN0ZXJGaXJzdENyZWF0ZWRIb29rKHRlbXBsYXRlLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIEFyZ3VtZW50cyB3ZXJlIHBhc3NlZCBpbiBhcyBhIGRhdGEgY29udGV4dC4gUmVzdG9yZSBvcmlnaW5hbCAocGFyZW50KSBkYXRhXG4gICAgICAgICAgICAvLyBjb250ZXh0LiBTYW1lIGxvZ2ljIGFzIGluIEJsYXplLl9Jbk91dGVyVGVtcGxhdGVTY29wZS5cbiAgICAgICAgICAgIHRoaXMudmlldy5vcmlnaW5hbFBhcmVudFZpZXcgPSB0aGlzLnZpZXcucGFyZW50VmlldztcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZpZXcucGFyZW50VmlldyA9IHRoaXMudmlldy5wYXJlbnRWaWV3LnBhcmVudFZpZXcucGFyZW50VmlldztcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm4gdGVtcGxhdGU7XG4gICAgICAgIH0pO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlbmRlckNvbXBvbmVudChwYXJlbnRDb21wb25lbnQpIHtcbiAgICAvLyBUbyBtYWtlIHN1cmUgd2UgZG8gbm90IGludHJvZHVjZSBhbnkgcmVhY3RpdmUgZGVwZW5kZW5jeS4gVGhpcyBpcyBhIGNvbnNjaW91cyBkZXNpZ24gZGVjaXNpb24uXG4gICAgLy8gUmVhY3Rpdml0eSBzaG91bGQgYmUgY2hhbmdpbmcgZGF0YSBjb250ZXh0LCBidXQgY29tcG9uZW50cyBzaG91bGQgYmUgbW9yZSBzdGFibGUsIG9ubHkgY2hhbmdpbmdcbiAgICAvLyB3aGVuIHN0cnVjdHVyZSBjaGFuZ2UgaW4gcmVuZGVyZWQgRE9NLiBZb3UgY2FuIGNoYW5nZSB0aGUgY29tcG9uZW50IHlvdSBhcmUgaW5jbHVkaW5nIChvciBwYXNzXG4gICAgLy8gZGlmZmVyZW50IGFyZ3VtZW50cykgcmVhY3RpdmVseSB0aG91Z2guXG4gICAgcmV0dXJuIFRyYWNrZXIubm9ucmVhY3RpdmUoKCkgPT4ge1xuICAgICAgdmFyIGNvbXBvbmVudCwgdGVtcGxhdGUsIHRlbXBsYXRlQmFzZTtcbiAgICAgIGNvbXBvbmVudCA9IHRoaXMuY29tcG9uZW50KCk7XG4gICAgICAvLyBJZiBtaXhpbnMgaGF2ZSBub3QgeWV0IGJlZW4gY3JlYXRlZC5cbiAgICAgIGNvbXBvbmVudC5jcmVhdGVNaXhpbnMoKTtcbiAgICAgIHRlbXBsYXRlQmFzZSA9IGdldFRlbXBsYXRlQmFzZShjb21wb25lbnQpO1xuICAgICAgLy8gQ3JlYXRlIGEgbmV3IGNvbXBvbmVudCB0ZW1wbGF0ZSBiYXNlZCBvbiB0aGUgQmxhemUgdGVtcGxhdGUuIFdlIHdhbnQgb3VyIG93biB0ZW1wbGF0ZVxuICAgICAgLy8gYmVjYXVzZSB0aGUgc2FtZSBCbGF6ZSB0ZW1wbGF0ZSBjb3VsZCBiZSByZXVzZWQgYmV0d2VlbiBtdWx0aXBsZSBjb21wb25lbnRzLlxuICAgICAgLy8gVE9ETzogU2hvdWxkIHdlIGNhY2hlIHRoZXNlIHRlbXBsYXRlcyBiYXNlZCBvbiAoY29tcG9uZW50TmFtZSwgdGVtcGxhdGVCYXNlKSBwYWlyPyBXZSBjb3VsZCB1c2UgdHdvIGxldmVscyBvZiBFUzIwMTUgTWFwcywgY29tcG9uZW50TmFtZSAtPiB0ZW1wbGF0ZUJhc2UgLT4gdGVtcGxhdGUuIFdoYXQgYWJvdXQgY29tcG9uZW50IGFyZ3VtZW50cyBjaGFuZ2luZz9cbiAgICAgIHRlbXBsYXRlID0gbmV3IEJsYXplLlRlbXBsYXRlKGBCbGF6ZUNvbXBvbmVudC4ke2NvbXBvbmVudC5jb21wb25lbnROYW1lKCkgfHwgJ3VubmFtZWQnfWAsIHRlbXBsYXRlQmFzZS5yZW5kZXJGdW5jdGlvbik7XG4gICAgICAvLyBXZSBsb29rdXAgcHJlZXhpc3RpbmcgdGVtcGxhdGUgaGVscGVycyBpbiBCbGF6ZS5fZ2V0VGVtcGxhdGVIZWxwZXIsIGlmIHRoZSBjb21wb25lbnQgZG9lcyBub3QgaGF2ZVxuICAgICAgLy8gYSBwcm9wZXJ0eSB3aXRoIHRoZSBzYW1lIG5hbWUuIFByZWV4aXN0aW5nIGV2ZW50IGhhbmRsZXJzIGFuZCBsaWZlLWN5Y2xlIGhvb2tzIGFyZSB0YWtlbiBjYXJlIG9mXG4gICAgICAvLyBpbiB0aGUgcmVsYXRlZCBtZXRob2RzIGluIHRoZSBiYXNlIGNsYXNzLlxuICAgICAgaWYgKGNvbXBvbmVudC5fY29tcG9uZW50SW50ZXJuYWxzID09IG51bGwpIHtcbiAgICAgICAgY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMgPSB7fTtcbiAgICAgIH1cbiAgICAgIGNvbXBvbmVudC5fY29tcG9uZW50SW50ZXJuYWxzLnRlbXBsYXRlQmFzZSA9IHRlbXBsYXRlQmFzZTtcbiAgICAgIHJlZ2lzdGVySG9va3ModGVtcGxhdGUsIHtcbiAgICAgICAgb25DcmVhdGVkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgYmFzZSwgYmFzZTEsIGJhc2UyLCBiYXNlMywgY29tcG9uZW50T3JNaXhpbiwgcmVzdWx0cztcbiAgICAgICAgICAvLyBAIGlzIGEgdGVtcGxhdGUgaW5zdGFuY2UuXG4gICAgICAgICAgaWYgKHBhcmVudENvbXBvbmVudCkge1xuICAgICAgICAgICAgLy8gY29tcG9uZW50LnBhcmVudENvbXBvbmVudCBpcyByZWFjdGl2ZSwgc28gd2UgdXNlIFRyYWNrZXIubm9ucmVhY3RpdmUganVzdCB0byBtYWtlIHN1cmUgd2UgZG8gbm90IGxlYWsgYW55IHJlYWN0aXZpdHkgaGVyZS5cbiAgICAgICAgICAgIFRyYWNrZXIubm9ucmVhY3RpdmUoKCkgPT4ge1xuICAgICAgICAgICAgICB2YXIgcmVmO1xuICAgICAgICAgICAgICAvLyBUT0RPOiBTaG91bGQgd2Ugc3VwcG9ydCB0aGF0IHRoZSBzYW1lIGNvbXBvbmVudCBjYW4gYmUgcmVuZGVyZWQgbXVsdGlwbGUgdGltZXMgaW4gcGFyYWxsZWw/IEhvdyBjb3VsZCB3ZSBkbyB0aGF0PyBGb3IgZGlmZmVyZW50IGNvbXBvbmVudCBwYXJlbnRzIG9yIG9ubHkgdGhlIHNhbWUgb25lP1xuICAgICAgICAgICAgICBhc3NlcnQoIWNvbXBvbmVudC5wYXJlbnRDb21wb25lbnQoKSwgYENvbXBvbmVudCAnJHtjb21wb25lbnQuY29tcG9uZW50TmFtZSgpIHx8ICd1bm5hbWVkJ30nIHBhcmVudCBjb21wb25lbnQgJyR7KChyZWYgPSBjb21wb25lbnQucGFyZW50Q29tcG9uZW50KCkpICE9IG51bGwgPyByZWYuY29tcG9uZW50TmFtZSgpIDogdm9pZCAwKSB8fCAndW5uYW1lZCd9JyBhbHJlYWR5IHNldC5gKTtcbiAgICAgICAgICAgICAgLy8gV2Ugc2V0IHRoZSBwYXJlbnQgb25seSB3aGVuIHRoZSBjb21wb25lbnQgaXMgY3JlYXRlZCwgbm90IGp1c3QgY29uc3RydWN0ZWQuXG4gICAgICAgICAgICAgIGNvbXBvbmVudC5wYXJlbnRDb21wb25lbnQocGFyZW50Q29tcG9uZW50KTtcbiAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudENvbXBvbmVudC5hZGRDaGlsZENvbXBvbmVudChjb21wb25lbnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMudmlldy5fb25WaWV3UmVuZGVyZWQoKCkgPT4ge1xuICAgICAgICAgICAgdmFyIGNvbXBvbmVudE9yTWl4aW4sIHJlc3VsdHM7XG4gICAgICAgICAgICAvLyBBdHRhY2ggZXZlbnRzIHRoZSBmaXJzdCB0aW1lIHRlbXBsYXRlIGluc3RhbmNlIHJlbmRlcnMuXG4gICAgICAgICAgICBpZiAodGhpcy52aWV3LnJlbmRlckNvdW50ICE9PSAxKSB7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFdlIGZpcnN0IGFkZCBldmVudCBoYW5kbGVycyBmcm9tIHRoZSBjb21wb25lbnQsIHRoZW4gbWl4aW5zLlxuICAgICAgICAgICAgY29tcG9uZW50T3JNaXhpbiA9IG51bGw7XG4gICAgICAgICAgICByZXN1bHRzID0gW107XG4gICAgICAgICAgICB3aGlsZSAoY29tcG9uZW50T3JNaXhpbiA9IHRoaXMuY29tcG9uZW50LmdldEZpcnN0V2l0aChjb21wb25lbnRPck1peGluLCAnZXZlbnRzJykpIHtcbiAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGFkZEV2ZW50cyh0aGlzLnZpZXcsIGNvbXBvbmVudE9yTWl4aW4pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHRoaXMuY29tcG9uZW50ID0gY29tcG9uZW50O1xuICAgICAgICAgIC8vIFRPRE86IFNob3VsZCB3ZSBzdXBwb3J0IHRoYXQgdGhlIHNhbWUgY29tcG9uZW50IGNhbiBiZSByZW5kZXJlZCBtdWx0aXBsZSB0aW1lcyBpbiBwYXJhbGxlbD8gSG93IGNvdWxkIHdlIGRvIHRoYXQ/IEZvciBkaWZmZXJlbnQgY29tcG9uZW50IHBhcmVudHMgb3Igb25seSB0aGUgc2FtZSBvbmU/XG4gICAgICAgICAgYXNzZXJ0KCFUcmFja2VyLm5vbnJlYWN0aXZlKCgpID0+IHtcbiAgICAgICAgICAgIHZhciBiYXNlO1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiAoYmFzZSA9IHRoaXMuY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMpLnRlbXBsYXRlSW5zdGFuY2UgPT09IFwiZnVuY3Rpb25cIiA/IGJhc2UudGVtcGxhdGVJbnN0YW5jZSgpIDogdm9pZCAwO1xuICAgICAgICAgIH0pKTtcbiAgICAgICAgICBpZiAoKGJhc2UgPSB0aGlzLmNvbXBvbmVudC5fY29tcG9uZW50SW50ZXJuYWxzKS50ZW1wbGF0ZUluc3RhbmNlID09IG51bGwpIHtcbiAgICAgICAgICAgIGJhc2UudGVtcGxhdGVJbnN0YW5jZSA9IG5ldyBSZWFjdGl2ZUZpZWxkKHRoaXMsIGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGEgPT09IGI7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5jb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscy50ZW1wbGF0ZUluc3RhbmNlKHRoaXMpO1xuICAgICAgICAgIGlmICgoYmFzZTEgPSB0aGlzLmNvbXBvbmVudC5fY29tcG9uZW50SW50ZXJuYWxzKS5pc0NyZWF0ZWQgPT0gbnVsbCkge1xuICAgICAgICAgICAgYmFzZTEuaXNDcmVhdGVkID0gbmV3IFJlYWN0aXZlRmllbGQodHJ1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMuaXNDcmVhdGVkKHRydWUpO1xuICAgICAgICAgIC8vIE1heWJlIHdlIGFyZSByZS1yZW5kZXJpbmcgdGhlIGNvbXBvbmVudC4gU28gbGV0J3MgaW5pdGlhbGl6ZSB2YXJpYWJsZXMganVzdCB0byBiZSBzdXJlLlxuICAgICAgICAgIGlmICgoYmFzZTIgPSB0aGlzLmNvbXBvbmVudC5fY29tcG9uZW50SW50ZXJuYWxzKS5pc1JlbmRlcmVkID09IG51bGwpIHtcbiAgICAgICAgICAgIGJhc2UyLmlzUmVuZGVyZWQgPSBuZXcgUmVhY3RpdmVGaWVsZChmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMuaXNSZW5kZXJlZChmYWxzZSk7XG4gICAgICAgICAgaWYgKChiYXNlMyA9IHRoaXMuY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMpLmlzRGVzdHJveWVkID09IG51bGwpIHtcbiAgICAgICAgICAgIGJhc2UzLmlzRGVzdHJveWVkID0gbmV3IFJlYWN0aXZlRmllbGQoZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLmNvbXBvbmVudC5fY29tcG9uZW50SW50ZXJuYWxzLmlzRGVzdHJveWVkKGZhbHNlKTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2UgaGF2ZSB0byBrbm93IGlmIHdlIHNob3VsZCBjYWxsIG9uQ3JlYXRlZCBvbiB0aGUgbWl4aW4gaW5zaWRlIHRoZSByZXF1aXJlTWl4aW4gb3Igbm90LiBXZSB3YW50IHRvIGNhbGxcbiAgICAgICAgICAgIC8vIGl0IG9ubHkgb25jZS4gSWYgaXQgcmVxdWlyZU1peGluIGlzIGNhbGxlZCBmcm9tIG9uQ3JlYXRlZCBvZiBhbm90aGVyIG1peGluLCB0aGVuIGl0IHdpbGwgYmUgYWRkZWQgYXQgdGhlXG4gICAgICAgICAgICAvLyBlbmQgYW5kIHdlIHdpbGwgZ2V0IGl0IGhlcmUgYXQgdGhlIGVuZC4gU28gd2Ugc2hvdWxkIG5vdCBjYWxsIG9uQ3JlYXRlZCBpbnNpZGUgcmVxdWlyZU1peGluIGJlY2F1c2UgdGhlblxuICAgICAgICAgICAgLy8gb25DcmVhdGVkIHdvdWxkIGJlIGNhbGxlZCB0d2ljZS5cbiAgICAgICAgICAgIHRoaXMuY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMuaW5PbkNyZWF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgY29tcG9uZW50T3JNaXhpbiA9IG51bGw7XG4gICAgICAgICAgICByZXN1bHRzID0gW107XG4gICAgICAgICAgICB3aGlsZSAoY29tcG9uZW50T3JNaXhpbiA9IHRoaXMuY29tcG9uZW50LmdldEZpcnN0V2l0aChjb21wb25lbnRPck1peGluLCAnb25DcmVhdGVkJykpIHtcbiAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGNvbXBvbmVudE9yTWl4aW4ub25DcmVhdGVkKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmNvbXBvbmVudC5fY29tcG9uZW50SW50ZXJuYWxzLmluT25DcmVhdGVkO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgb25SZW5kZXJlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIGJhc2UsIGNvbXBvbmVudE9yTWl4aW4sIHJlc3VsdHM7XG4gICAgICAgICAgLy8gQCBpcyBhIHRlbXBsYXRlIGluc3RhbmNlLlxuICAgICAgICAgIGlmICgoYmFzZSA9IHRoaXMuY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMpLmlzUmVuZGVyZWQgPT0gbnVsbCkge1xuICAgICAgICAgICAgYmFzZS5pc1JlbmRlcmVkID0gbmV3IFJlYWN0aXZlRmllbGQodHJ1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMuaXNSZW5kZXJlZCh0cnVlKTtcbiAgICAgICAgICBUcmFja2VyLm5vbnJlYWN0aXZlKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBhc3NlcnQuZXF1YWwodGhpcy5jb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscy5pc0NyZWF0ZWQoKSwgdHJ1ZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFNhbWUgYXMgZm9yIG9uQ3JlYXRlZCBhYm92ZS5cbiAgICAgICAgICAgIHRoaXMuY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMuaW5PblJlbmRlcmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbXBvbmVudE9yTWl4aW4gPSBudWxsO1xuICAgICAgICAgICAgcmVzdWx0cyA9IFtdO1xuICAgICAgICAgICAgd2hpbGUgKGNvbXBvbmVudE9yTWl4aW4gPSB0aGlzLmNvbXBvbmVudC5nZXRGaXJzdFdpdGgoY29tcG9uZW50T3JNaXhpbiwgJ29uUmVuZGVyZWQnKSkge1xuICAgICAgICAgICAgICByZXN1bHRzLnB1c2goY29tcG9uZW50T3JNaXhpbi5vblJlbmRlcmVkKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmNvbXBvbmVudC5fY29tcG9uZW50SW50ZXJuYWxzLmluT25SZW5kZXJlZDtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIG9uRGVzdHJveWVkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5hdXRvcnVuKChjb21wdXRhdGlvbikgPT4ge1xuICAgICAgICAgICAgLy8gQCBpcyBhIHRlbXBsYXRlIGluc3RhbmNlLlxuXG4gICAgICAgICAgICAvLyBXZSB3YWl0IGZvciBhbGwgY2hpbGRyZW4gY29tcG9uZW50cyB0byBiZSBkZXN0cm95ZWQgZmlyc3QuXG4gICAgICAgICAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL21ldGVvci9tZXRlb3IvaXNzdWVzLzQxNjZcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbXBvbmVudC5jaGlsZENvbXBvbmVudHMoKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29tcHV0YXRpb24uc3RvcCgpO1xuICAgICAgICAgICAgcmV0dXJuIFRyYWNrZXIubm9ucmVhY3RpdmUoKCkgPT4ge1xuICAgICAgICAgICAgICB2YXIgYmFzZSwgYmFzZTEsIGNvbXBvbmVudE9yTWl4aW47XG4gICAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0aGlzLmNvbXBvbmVudC5fY29tcG9uZW50SW50ZXJuYWxzLmlzQ3JlYXRlZCgpLCB0cnVlKTtcbiAgICAgICAgICAgICAgdGhpcy5jb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscy5pc0NyZWF0ZWQoZmFsc2UpO1xuICAgICAgICAgICAgICBpZiAoKGJhc2UgPSB0aGlzLmNvbXBvbmVudC5fY29tcG9uZW50SW50ZXJuYWxzKS5pc1JlbmRlcmVkID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBiYXNlLmlzUmVuZGVyZWQgPSBuZXcgUmVhY3RpdmVGaWVsZChmYWxzZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdGhpcy5jb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscy5pc1JlbmRlcmVkKGZhbHNlKTtcbiAgICAgICAgICAgICAgaWYgKChiYXNlMSA9IHRoaXMuY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMpLmlzRGVzdHJveWVkID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBiYXNlMS5pc0Rlc3Ryb3llZCA9IG5ldyBSZWFjdGl2ZUZpZWxkKHRydWUpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHRoaXMuY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMuaXNEZXN0cm95ZWQodHJ1ZSk7XG4gICAgICAgICAgICAgIGNvbXBvbmVudE9yTWl4aW4gPSBudWxsO1xuICAgICAgICAgICAgICB3aGlsZSAoY29tcG9uZW50T3JNaXhpbiA9IHRoaXMuY29tcG9uZW50LmdldEZpcnN0V2l0aChjb21wb25lbnRPck1peGluLCAnb25EZXN0cm95ZWQnKSkge1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudE9yTWl4aW4ub25EZXN0cm95ZWQoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAocGFyZW50Q29tcG9uZW50KSB7XG4gICAgICAgICAgICAgICAgLy8gVGhlIGNvbXBvbmVudCBoYXMgYmVlbiBkZXN0cm95ZWQsIGNsZWFyIHVwIHRoZSBwYXJlbnQuXG4gICAgICAgICAgICAgICAgY29tcG9uZW50LnBhcmVudENvbXBvbmVudChudWxsKTtcbiAgICAgICAgICAgICAgICBwYXJlbnRDb21wb25lbnQucmVtb3ZlQ2hpbGRDb21wb25lbnQoY29tcG9uZW50KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAvLyBSZW1vdmUgdGhlIHJlZmVyZW5jZSBzbyB0aGF0IGl0IGlzIGNsZWFyIHRoYXQgdGVtcGxhdGUgaW5zdGFuY2UgaXMgbm90IGF2YWlsYWJsZSBhbnltb3JlLlxuICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscy50ZW1wbGF0ZUluc3RhbmNlKG51bGwpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHRlbXBsYXRlO1xuICAgIH0pO1xuICB9XG5cbiAgcmVtb3ZlQ29tcG9uZW50KCkge1xuICAgIGlmICh0aGlzLmlzUmVuZGVyZWQoKSkge1xuICAgICAgcmV0dXJuIEJsYXplLnJlbW92ZSh0aGlzLmNvbXBvbmVudCgpLl9jb21wb25lbnRJbnRlcm5hbHMudGVtcGxhdGVJbnN0YW5jZSgpLnZpZXcpO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBfcmVuZGVyQ29tcG9uZW50VG8odmlzaXRvciwgcGFyZW50Q29tcG9uZW50LCBwYXJlbnRWaWV3LCBkYXRhKSB7XG4gICAgdmFyIGNvbXBvbmVudDtcbiAgICBjb21wb25lbnQgPSBUcmFja2VyLm5vbnJlYWN0aXZlKCgpID0+IHtcbiAgICAgIHZhciBjb21wb25lbnRDbGFzcztcbiAgICAgIGNvbXBvbmVudENsYXNzID0gdGhpcztcbiAgICAgIHBhcmVudFZpZXcgPSBwYXJlbnRWaWV3IHx8IGN1cnJlbnRWaWV3SWZSZW5kZXJpbmcoKSB8fCAoKHBhcmVudENvbXBvbmVudCAhPSBudWxsID8gcGFyZW50Q29tcG9uZW50LmlzUmVuZGVyZWQoKSA6IHZvaWQgMCkgJiYgcGFyZW50Q29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMudGVtcGxhdGVJbnN0YW5jZSgpLnZpZXcpIHx8IG51bGw7XG4gICAgICByZXR1cm4gd3JhcFZpZXdBbmRUZW1wbGF0ZShwYXJlbnRWaWV3LCAoKSA9PiB7XG4gICAgICAgIHJldHVybiBuZXcgY29tcG9uZW50Q2xhc3MoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMikge1xuICAgICAgcmV0dXJuIGNvbXBvbmVudC5fcmVuZGVyQ29tcG9uZW50VG8odmlzaXRvciwgcGFyZW50Q29tcG9uZW50LCBwYXJlbnRWaWV3LCBkYXRhKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGNvbXBvbmVudC5fcmVuZGVyQ29tcG9uZW50VG8odmlzaXRvciwgcGFyZW50Q29tcG9uZW50LCBwYXJlbnRWaWV3KTtcbiAgICB9XG4gIH1cblxuICBzdGF0aWMgcmVuZGVyQ29tcG9uZW50VG9IVE1MKHBhcmVudENvbXBvbmVudCwgcGFyZW50VmlldywgZGF0YSkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMikge1xuICAgICAgcmV0dXJuIHRoaXMuX3JlbmRlckNvbXBvbmVudFRvKG5ldyBIVE1MLlRvSFRNTFZpc2l0b3IoKSwgcGFyZW50Q29tcG9uZW50LCBwYXJlbnRWaWV3LCBkYXRhKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuX3JlbmRlckNvbXBvbmVudFRvKG5ldyBIVE1MLlRvSFRNTFZpc2l0b3IoKSwgcGFyZW50Q29tcG9uZW50LCBwYXJlbnRWaWV3KTtcbiAgICB9XG4gIH1cblxuICBfcmVuZGVyQ29tcG9uZW50VG8odmlzaXRvciwgcGFyZW50Q29tcG9uZW50LCBwYXJlbnRWaWV3LCBkYXRhKSB7XG4gICAgdmFyIGV4cGFuZGVkVmlldywgdGVtcGxhdGU7XG4gICAgdGVtcGxhdGUgPSBUcmFja2VyLm5vbnJlYWN0aXZlKCgpID0+IHtcbiAgICAgIHBhcmVudFZpZXcgPSBwYXJlbnRWaWV3IHx8IGN1cnJlbnRWaWV3SWZSZW5kZXJpbmcoKSB8fCAoKHBhcmVudENvbXBvbmVudCAhPSBudWxsID8gcGFyZW50Q29tcG9uZW50LmlzUmVuZGVyZWQoKSA6IHZvaWQgMCkgJiYgcGFyZW50Q29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMudGVtcGxhdGVJbnN0YW5jZSgpLnZpZXcpIHx8IG51bGw7XG4gICAgICByZXR1cm4gd3JhcFZpZXdBbmRUZW1wbGF0ZShwYXJlbnRWaWV3LCAoKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbXBvbmVudCgpLnJlbmRlckNvbXBvbmVudChwYXJlbnRDb21wb25lbnQpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAyKSB7XG4gICAgICBleHBhbmRlZFZpZXcgPSBleHBhbmRWaWV3KEJsYXplLl9UZW1wbGF0ZVdpdGgoZGF0YSwgY29udGVudEFzRnVuYyh0ZW1wbGF0ZSkpLCBwYXJlbnRWaWV3KTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXhwYW5kZWRWaWV3ID0gZXhwYW5kVmlldyhjb250ZW50QXNWaWV3KHRlbXBsYXRlKSwgcGFyZW50Vmlldyk7XG4gICAgfVxuICAgIHJldHVybiB2aXNpdG9yLnZpc2l0KGV4cGFuZGVkVmlldyk7XG4gIH1cblxuICByZW5kZXJDb21wb25lbnRUb0hUTUwocGFyZW50Q29tcG9uZW50LCBwYXJlbnRWaWV3LCBkYXRhKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAyKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcmVuZGVyQ29tcG9uZW50VG8obmV3IEhUTUwuVG9IVE1MVmlzaXRvcigpLCBwYXJlbnRDb21wb25lbnQsIHBhcmVudFZpZXcsIGRhdGEpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5fcmVuZGVyQ29tcG9uZW50VG8obmV3IEhUTUwuVG9IVE1MVmlzaXRvcigpLCBwYXJlbnRDb21wb25lbnQsIHBhcmVudFZpZXcpO1xuICAgIH1cbiAgfVxuXG4gIHRlbXBsYXRlKCkge1xuICAgIHJldHVybiB0aGlzLmNhbGxGaXJzdFdpdGgodGhpcywgJ3RlbXBsYXRlJykgfHwgdGhpcy5jb25zdHJ1Y3Rvci5jb21wb25lbnROYW1lKCk7XG4gIH1cblxuICBvbkNyZWF0ZWQoKSB7XG4gICAgcmV0dXJuIGNhbGxUZW1wbGF0ZUJhc2VIb29rcyh0aGlzLCAnY3JlYXRlZCcpO1xuICB9XG5cbiAgb25SZW5kZXJlZCgpIHtcbiAgICByZXR1cm4gY2FsbFRlbXBsYXRlQmFzZUhvb2tzKHRoaXMsICdyZW5kZXJlZCcpO1xuICB9XG5cbiAgb25EZXN0cm95ZWQoKSB7XG4gICAgcmV0dXJuIGNhbGxUZW1wbGF0ZUJhc2VIb29rcyh0aGlzLCAnZGVzdHJveWVkJyk7XG4gIH1cblxuICBpc0NyZWF0ZWQoKSB7XG4gICAgdmFyIGJhc2UsIGNvbXBvbmVudDtcbiAgICBjb21wb25lbnQgPSB0aGlzLmNvbXBvbmVudCgpO1xuICAgIGlmIChjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscyA9PSBudWxsKSB7XG4gICAgICBjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscyA9IHt9O1xuICAgIH1cbiAgICBpZiAoKGJhc2UgPSBjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscykuaXNDcmVhdGVkID09IG51bGwpIHtcbiAgICAgIGJhc2UuaXNDcmVhdGVkID0gbmV3IFJlYWN0aXZlRmllbGQoZmFsc2UpO1xuICAgIH1cbiAgICByZXR1cm4gY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMuaXNDcmVhdGVkKCk7XG4gIH1cblxuICBpc1JlbmRlcmVkKCkge1xuICAgIHZhciBiYXNlLCBjb21wb25lbnQ7XG4gICAgY29tcG9uZW50ID0gdGhpcy5jb21wb25lbnQoKTtcbiAgICBpZiAoY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMgPT0gbnVsbCkge1xuICAgICAgY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMgPSB7fTtcbiAgICB9XG4gICAgaWYgKChiYXNlID0gY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMpLmlzUmVuZGVyZWQgPT0gbnVsbCkge1xuICAgICAgYmFzZS5pc1JlbmRlcmVkID0gbmV3IFJlYWN0aXZlRmllbGQoZmFsc2UpO1xuICAgIH1cbiAgICByZXR1cm4gY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMuaXNSZW5kZXJlZCgpO1xuICB9XG5cbiAgaXNEZXN0cm95ZWQoKSB7XG4gICAgdmFyIGJhc2UsIGNvbXBvbmVudDtcbiAgICBjb21wb25lbnQgPSB0aGlzLmNvbXBvbmVudCgpO1xuICAgIGlmIChjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscyA9PSBudWxsKSB7XG4gICAgICBjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscyA9IHt9O1xuICAgIH1cbiAgICBpZiAoKGJhc2UgPSBjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscykuaXNEZXN0cm95ZWQgPT0gbnVsbCkge1xuICAgICAgYmFzZS5pc0Rlc3Ryb3llZCA9IG5ldyBSZWFjdGl2ZUZpZWxkKGZhbHNlKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXBvbmVudC5fY29tcG9uZW50SW50ZXJuYWxzLmlzRGVzdHJveWVkKCk7XG4gIH1cblxuICBpbnNlcnRET01FbGVtZW50KHBhcmVudCwgbm9kZSwgYmVmb3JlKSB7XG4gICAgaWYgKGJlZm9yZSA9PSBudWxsKSB7XG4gICAgICBiZWZvcmUgPSBudWxsO1xuICAgIH1cbiAgICBpZiAocGFyZW50ICYmIG5vZGUgJiYgKG5vZGUucGFyZW50Tm9kZSAhPT0gcGFyZW50IHx8IG5vZGUubmV4dFNpYmxpbmcgIT09IGJlZm9yZSkpIHtcbiAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUobm9kZSwgYmVmb3JlKTtcbiAgICB9XG4gIH1cblxuICBtb3ZlRE9NRWxlbWVudChwYXJlbnQsIG5vZGUsIGJlZm9yZSkge1xuICAgIGlmIChiZWZvcmUgPT0gbnVsbCkge1xuICAgICAgYmVmb3JlID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKHBhcmVudCAmJiBub2RlICYmIChub2RlLnBhcmVudE5vZGUgIT09IHBhcmVudCB8fCBub2RlLm5leHRTaWJsaW5nICE9PSBiZWZvcmUpKSB7XG4gICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKG5vZGUsIGJlZm9yZSk7XG4gICAgfVxuICB9XG5cbiAgcmVtb3ZlRE9NRWxlbWVudChwYXJlbnQsIG5vZGUpIHtcbiAgICBpZiAocGFyZW50ICYmIG5vZGUgJiYgbm9kZS5wYXJlbnROb2RlID09PSBwYXJlbnQpIHtcbiAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChub2RlKTtcbiAgICB9XG4gIH1cblxuICBldmVudHMoKSB7XG4gICAgdmFyIGV2ZW50TWFwLCBldmVudHMsIGhhbmRsZXIsIGksIGxlbiwgcmVmLCByZXN1bHRzLCBzcGVjLCB0ZW1wbGF0ZUluc3RhbmNlLCB2aWV3O1xuICAgIC8vIEluIG1peGlucyB0aGVyZSBpcyBubyByZWFzb24gZm9yIGEgdGVtcGxhdGUgaW5zdGFuY2UgdG8gZXh0ZW5kIGEgQmxhemUgdGVtcGxhdGUuXG4gICAgaWYgKHRoaXMgIT09IHRoaXMuY29tcG9uZW50KCkpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgaWYgKHRoaXMuX2NvbXBvbmVudEludGVybmFscyA9PSBudWxsKSB7XG4gICAgICB0aGlzLl9jb21wb25lbnRJbnRlcm5hbHMgPSB7fTtcbiAgICB9XG4gICAgdmlldyA9IFRyYWNrZXIubm9ucmVhY3RpdmUoKCkgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMuX2NvbXBvbmVudEludGVybmFscy50ZW1wbGF0ZUluc3RhbmNlKCkudmlldztcbiAgICB9KTtcbiAgICAvLyBXZSBza2lwIGJsb2NrIGhlbHBlcnMgdG8gbWF0Y2ggQmxhemUgYmVoYXZpb3IuXG4gICAgdGVtcGxhdGVJbnN0YW5jZSA9IGdldFRlbXBsYXRlSW5zdGFuY2VGdW5jdGlvbih2aWV3LCB0cnVlKTtcbiAgICByZWYgPSB0aGlzLl9jb21wb25lbnRJbnRlcm5hbHMudGVtcGxhdGVCYXNlLl9fZXZlbnRNYXBzO1xuICAgIHJlc3VsdHMgPSBbXTtcbiAgICBmb3IgKGkgPSAwLCBsZW4gPSByZWYubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGV2ZW50cyA9IHJlZltpXTtcbiAgICAgIGV2ZW50TWFwID0ge307XG4gICAgICBmb3IgKHNwZWMgaW4gZXZlbnRzKSB7XG4gICAgICAgIGhhbmRsZXIgPSBldmVudHNbc3BlY107XG4gICAgICAgIChmdW5jdGlvbihzcGVjLCBoYW5kbGVyKSB7XG4gICAgICAgICAgcmV0dXJuIGV2ZW50TWFwW3NwZWNdID0gZnVuY3Rpb24oLi4uYXJncykge1xuICAgICAgICAgICAgLy8gSW4gdGVtcGxhdGUgZXZlbnQgaGFuZGxlcnMgdmlldyBhbmQgdGVtcGxhdGUgaW5zdGFuY2UgYXJlIG5vdCBiYXNlZCBvbiB0aGUgY3VycmVudCB0YXJnZXRcbiAgICAgICAgICAgIC8vIChsaWtlIEJsYXplIENvbXBvbmVudHMgZXZlbnQgaGFuZGxlcnMgYXJlKSBidXQgaXQgaXMgYmFzZWQgb24gdGhlIHRlbXBsYXRlLWxldmVsIHZpZXcuXG4gICAgICAgICAgICAvLyBJbiBhIHdheSB3ZSBhcmUgcmV2ZXJ0aW5nIGhlcmUgd2hhdCBhZGRFdmVudHMgZG9lcy5cbiAgICAgICAgICAgIHJldHVybiB3aXRoVGVtcGxhdGVJbnN0YW5jZUZ1bmModGVtcGxhdGVJbnN0YW5jZSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJldHVybiBCbGF6ZS5fd2l0aEN1cnJlbnRWaWV3KHZpZXcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBoYW5kbGVyLmFwcGx5KHZpZXcsIGFyZ3MpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH07XG4gICAgICAgIH0pKHNwZWMsIGhhbmRsZXIpO1xuICAgICAgfVxuICAgICAgcmVzdWx0cy5wdXNoKGV2ZW50TWFwKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH1cblxuICAvLyBDb21wb25lbnQtbGV2ZWwgZGF0YSBjb250ZXh0LiBSZWFjdGl2ZS4gVXNlIHRoaXMgdG8gYWx3YXlzIGdldCB0aGVcbiAgLy8gdG9wLWxldmVsIGRhdGEgY29udGV4dCB1c2VkIHRvIHJlbmRlciB0aGUgY29tcG9uZW50LiBJZiBwYXRoIGlzXG4gIC8vIHByb3ZpZGVkLCBpdCByZXR1cm5zIG9ubHkgdGhlIHZhbHVlIHVuZGVyIHRoYXQgcGF0aCwgd2l0aCByZWFjdGl2aXR5XG4gIC8vIGxpbWl0ZWQgdG8gY2hhbmdlcyBvZiB0aGF0IHZhbHVlIG9ubHkuXG4gIGRhdGEocGF0aCwgZXF1YWxzRnVuYykge1xuICAgIHZhciBiYXNlLCBjb21wb25lbnQsIHJlZiwgdmlldztcbiAgICBjb21wb25lbnQgPSB0aGlzLmNvbXBvbmVudCgpO1xuICAgIGlmIChjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscyA9PSBudWxsKSB7XG4gICAgICBjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscyA9IHt9O1xuICAgIH1cbiAgICBpZiAoKGJhc2UgPSBjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscykudGVtcGxhdGVJbnN0YW5jZSA9PSBudWxsKSB7XG4gICAgICBiYXNlLnRlbXBsYXRlSW5zdGFuY2UgPSBuZXcgUmVhY3RpdmVGaWVsZChudWxsLCBmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgIHJldHVybiBhID09PSBiO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGlmICh2aWV3ID0gKHJlZiA9IGNvbXBvbmVudC5fY29tcG9uZW50SW50ZXJuYWxzLnRlbXBsYXRlSW5zdGFuY2UoKSkgIT0gbnVsbCA/IHJlZi52aWV3IDogdm9pZCAwKSB7XG4gICAgICBpZiAocGF0aCAhPSBudWxsKSB7XG4gICAgICAgIC8vIERhdGFMb29rdXAgdXNlcyBpbnRlcm5hbGx5IGNvbXB1dGVkIGZpZWxkLCB3aGljaCB1c2VzIHZpZXcncyBhdXRvcnVuLCBidXRcbiAgICAgICAgLy8gZGF0YSBtaWdodCBiZSB1c2VkIGluc2lkZSByZW5kZXIoKSBtZXRob2QsIHdoZXJlIGl0IGlzIGZvcmJpZGRlbiB0byB1c2VcbiAgICAgICAgLy8gdmlldydzIGF1dG9ydW4uIFNvIHdlIHRlbXBvcmFyeSBoaWRlIHRoZSBmYWN0IHRoYXQgd2UgYXJlIGluc2lkZSBhIHZpZXdcbiAgICAgICAgLy8gdG8gbWFrZSBjb21wdXRlZCBmaWVsZCB1c2Ugbm9ybWFsIGF1dG9ydW4uXG4gICAgICAgIHJldHVybiBCbGF6ZS5fd2l0aEN1cnJlbnRWaWV3KG51bGwsICgpID0+IHtcbiAgICAgICAgICByZXR1cm4gRGF0YUxvb2t1cC5nZXQoKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIEJsYXplLmdldERhdGEodmlldyk7XG4gICAgICAgICAgfSwgcGF0aCwgZXF1YWxzRnVuYyk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJsYXplLmdldERhdGEodmlldyk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2b2lkIDA7XG4gIH1cblxuICAvLyBDYWxsZXItbGV2ZWwgZGF0YSBjb250ZXh0LiBSZWFjdGl2ZS4gVXNlIHRoaXMgdG8gZ2V0IGluIGV2ZW50IGhhbmRsZXJzIHRoZSBkYXRhXG4gIC8vIGNvbnRleHQgYXQgdGhlIHBsYWNlIHdoZXJlIGV2ZW50IG9yaWdpbmF0ZWQgKHRhcmdldCBjb250ZXh0KS4gSW4gdGVtcGxhdGUgaGVscGVyc1xuICAvLyB0aGUgZGF0YSBjb250ZXh0IHdoZXJlIHRlbXBsYXRlIGhlbHBlcnMgd2VyZSBjYWxsZWQuIEluIG9uQ3JlYXRlZCwgb25SZW5kZXJlZCxcbiAgLy8gYW5kIG9uRGVzdHJveWVkLCB0aGUgc2FtZSBhcyBAZGF0YSgpLiBJbnNpZGUgYSB0ZW1wbGF0ZSB0aGlzIGlzIHRoZSBzYW1lIGFzIHRoaXMuXG4gIC8vIElmIHBhdGggaXMgcHJvdmlkZWQsIGl0IHJldHVybnMgb25seSB0aGUgdmFsdWUgdW5kZXIgdGhhdCBwYXRoLCB3aXRoIHJlYWN0aXZpdHlcbiAgLy8gbGltaXRlZCB0byBjaGFuZ2VzIG9mIHRoYXQgdmFsdWUgb25seS4gTW9yZW92ZXIsIGlmIHBhdGggaXMgcHJvdmlkZWQgaXMgYWxzb1xuICAvLyBsb29rcyBpbnRvIHRoZSBjdXJyZW50IGxleGljYWwgc2NvcGUgZGF0YS5cbiAgc3RhdGljIGN1cnJlbnREYXRhKHBhdGgsIGVxdWFsc0Z1bmMpIHtcbiAgICB2YXIgY3VycmVudFZpZXc7XG4gICAgaWYgKCFCbGF6ZS5jdXJyZW50Vmlldykge1xuICAgICAgcmV0dXJuIHZvaWQgMDtcbiAgICB9XG4gICAgY3VycmVudFZpZXcgPSBCbGF6ZS5jdXJyZW50VmlldztcbiAgICBpZiAoXy5pc1N0cmluZyhwYXRoKSkge1xuICAgICAgcGF0aCA9IHBhdGguc3BsaXQoJy4nKTtcbiAgICB9IGVsc2UgaWYgKCFfLmlzQXJyYXkocGF0aCkpIHtcbiAgICAgIHJldHVybiBCbGF6ZS5nZXREYXRhKGN1cnJlbnRWaWV3KTtcbiAgICB9XG4gICAgLy8gRGF0YUxvb2t1cCB1c2VzIGludGVybmFsbHkgY29tcHV0ZWQgZmllbGQsIHdoaWNoIHVzZXMgdmlldydzIGF1dG9ydW4sIGJ1dFxuICAgIC8vIGN1cnJlbnREYXRhIG1pZ2h0IGJlIHVzZWQgaW5zaWRlIHJlbmRlcigpIG1ldGhvZCwgd2hlcmUgaXQgaXMgZm9yYmlkZGVuIHRvIHVzZVxuICAgIC8vIHZpZXcncyBhdXRvcnVuLiBTbyB3ZSB0ZW1wb3JhcnkgaGlkZSB0aGUgZmFjdCB0aGF0IHdlIGFyZSBpbnNpZGUgYSB2aWV3XG4gICAgLy8gdG8gbWFrZSBjb21wdXRlZCBmaWVsZCB1c2Ugbm9ybWFsIGF1dG9ydW4uXG4gICAgcmV0dXJuIEJsYXplLl93aXRoQ3VycmVudFZpZXcobnVsbCwgKCkgPT4ge1xuICAgICAgcmV0dXJuIERhdGFMb29rdXAuZ2V0KCgpID0+IHtcbiAgICAgICAgdmFyIGxleGljYWxEYXRhLCByZXN1bHQ7XG4gICAgICAgIGlmIChCbGF6ZS5fbGV4aWNhbEJpbmRpbmdMb29rdXAgJiYgKGxleGljYWxEYXRhID0gQmxhemUuX2xleGljYWxCaW5kaW5nTG9va3VwKGN1cnJlbnRWaWV3LCBwYXRoWzBdKSkpIHtcbiAgICAgICAgICAvLyBXZSByZXR1cm4gY3VzdG9tIGRhdGEgb2JqZWN0IHNvIHRoYXQgd2UgY2FuIHJldXNlIHRoZSBzYW1lXG4gICAgICAgICAgLy8gbG9va3VwIGxvZ2ljIGZvciBib3RoIGxleGljYWwgYW5kIHRoZSBub3JtYWwgZGF0YSBjb250ZXh0IGNhc2UuXG4gICAgICAgICAgcmVzdWx0ID0ge307XG4gICAgICAgICAgcmVzdWx0W3BhdGhbMF1dID0gbGV4aWNhbERhdGE7XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gQmxhemUuZ2V0RGF0YShjdXJyZW50Vmlldyk7XG4gICAgICB9LCBwYXRoLCBlcXVhbHNGdW5jKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIE1ldGhvZCBzaG91bGQgbmV2ZXIgYmUgb3ZlcnJpZGRlbi4gVGhlIGltcGxlbWVudGF0aW9uIHNob3VsZCBhbHdheXMgYmUgZXhhY3RseSB0aGUgc2FtZSBhcyBjbGFzcyBtZXRob2QgaW1wbGVtZW50YXRpb24uXG4gIGN1cnJlbnREYXRhKHBhdGgsIGVxdWFsc0Z1bmMpIHtcbiAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5jdXJyZW50RGF0YShwYXRoLCBlcXVhbHNGdW5jKTtcbiAgfVxuXG4gIC8vIFVzZWZ1bCBpbiB0ZW1wbGF0ZXMgb3IgbWl4aW5zIHRvIGdldCBhIHJlZmVyZW5jZSB0byB0aGUgY29tcG9uZW50LlxuICBjb21wb25lbnQoKSB7XG4gICAgdmFyIGNvbXBvbmVudCwgbWl4aW5QYXJlbnQ7XG4gICAgY29tcG9uZW50ID0gdGhpcztcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgaWYgKCFjb21wb25lbnQubWl4aW5QYXJlbnQpIHtcbiAgICAgICAgLy8gSWYgd2UgYXJlIG9uIGEgbWl4aW4gd2l0aG91dCBtaXhpblBhcmVudCwgd2UgY2Fubm90IHJlYWxseSBnZXQgdG8gdGhlIGNvbXBvbmVudCwgcmV0dXJuIG51bGwuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgaWYgKCEobWl4aW5QYXJlbnQgPSBjb21wb25lbnQubWl4aW5QYXJlbnQoKSkpIHtcbiAgICAgICAgLy8gUmV0dXJuIGN1cnJlbnQgY29tcG9uZW50IHVubGVzcyB0aGVyZSBpcyBhIG1peGluIHBhcmVudC5cbiAgICAgICAgcmV0dXJuIGNvbXBvbmVudDtcbiAgICAgIH1cbiAgICAgIGNvbXBvbmVudCA9IG1peGluUGFyZW50O1xuICAgIH1cbiAgfVxuXG4gIC8vIENhbGxlci1sZXZlbCBjb21wb25lbnQuIEluIG1vc3QgY2FzZXMgdGhlIHNhbWUgYXMgQCwgYnV0IGluIGV2ZW50IGhhbmRsZXJzXG4gIC8vIGl0IHJldHVybnMgdGhlIGNvbXBvbmVudCBhdCB0aGUgcGxhY2Ugd2hlcmUgZXZlbnQgb3JpZ2luYXRlZCAodGFyZ2V0IGNvbXBvbmVudCkuXG4gIC8vIEluc2lkZSB0ZW1wbGF0ZSBjb250ZW50IHdyYXBwZWQgd2l0aCBhIGJsb2NrIGhlbHBlciBjb21wb25lbnQsIGl0IGlzIHRoZSBjbG9zZXN0XG4gIC8vIGJsb2NrIGhlbHBlciBjb21wb25lbnQuXG4gIHN0YXRpYyBjdXJyZW50Q29tcG9uZW50KCkge1xuICAgIHZhciB0ZW1wbGF0ZUluc3RhbmNlO1xuICAgIC8vIFdlIGFyZSBub3Qgc2tpcHBpbmcgYmxvY2sgaGVscGVycyBiZWNhdXNlIG9uZSBvZiBtYWluIHJlYXNvbnMgZm9yIEBjdXJyZW50Q29tcG9uZW50KClcbiAgICAvLyBpcyB0aGF0IHdlIGNhbiBnZXQgaG9sZCBvZiB0aGUgYmxvY2sgaGVscGVyIGNvbXBvbmVudCBpbnN0YW5jZS5cbiAgICB0ZW1wbGF0ZUluc3RhbmNlID0gZ2V0VGVtcGxhdGVJbnN0YW5jZUZ1bmN0aW9uKEJsYXplLmN1cnJlbnRWaWV3LCBmYWxzZSk7XG4gICAgcmV0dXJuIHRlbXBsYXRlSW5zdGFuY2VUb0NvbXBvbmVudCh0ZW1wbGF0ZUluc3RhbmNlLCBmYWxzZSk7XG4gIH1cblxuICAvLyBNZXRob2Qgc2hvdWxkIG5ldmVyIGJlIG92ZXJyaWRkZW4uIFRoZSBpbXBsZW1lbnRhdGlvbiBzaG91bGQgYWx3YXlzIGJlIGV4YWN0bHkgdGhlIHNhbWUgYXMgY2xhc3MgbWV0aG9kIGltcGxlbWVudGF0aW9uLlxuICBjdXJyZW50Q29tcG9uZW50KCkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLmN1cnJlbnRDb21wb25lbnQoKTtcbiAgfVxuXG4gIGZpcnN0Tm9kZSgpIHtcbiAgICBpZiAodGhpcy5pc1JlbmRlcmVkKCkpIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbXBvbmVudCgpLl9jb21wb25lbnRJbnRlcm5hbHMudGVtcGxhdGVJbnN0YW5jZSgpLnZpZXcuX2RvbXJhbmdlLmZpcnN0Tm9kZSgpO1xuICAgIH1cbiAgICByZXR1cm4gdm9pZCAwO1xuICB9XG5cbiAgbGFzdE5vZGUoKSB7XG4gICAgaWYgKHRoaXMuaXNSZW5kZXJlZCgpKSB7XG4gICAgICByZXR1cm4gdGhpcy5jb21wb25lbnQoKS5fY29tcG9uZW50SW50ZXJuYWxzLnRlbXBsYXRlSW5zdGFuY2UoKS52aWV3Ll9kb21yYW5nZS5sYXN0Tm9kZSgpO1xuICAgIH1cbiAgICByZXR1cm4gdm9pZCAwO1xuICB9XG5cbiAgLy8gVGhlIHNhbWUgYXMgaXQgd291bGQgYmUgZ2VuZXJhdGVkIGF1dG9tYXRpY2FsbHksIG9ubHkgdGhhdCB0aGUgcnVuRnVuYyBnZXRzIGJvdW5kIHRvIHRoZSBjb21wb25lbnQuXG4gIGF1dG9ydW4ocnVuRnVuYykge1xuICAgIHZhciB0ZW1wbGF0ZUluc3RhbmNlO1xuICAgIHRlbXBsYXRlSW5zdGFuY2UgPSBUcmFja2VyLm5vbnJlYWN0aXZlKCgpID0+IHtcbiAgICAgIHZhciByZWY7XG4gICAgICByZXR1cm4gKHJlZiA9IHRoaXMuY29tcG9uZW50KCkuX2NvbXBvbmVudEludGVybmFscykgIT0gbnVsbCA/IHR5cGVvZiByZWYudGVtcGxhdGVJbnN0YW5jZSA9PT0gXCJmdW5jdGlvblwiID8gcmVmLnRlbXBsYXRlSW5zdGFuY2UoKSA6IHZvaWQgMCA6IHZvaWQgMDtcbiAgICB9KTtcbiAgICBpZiAoIXRlbXBsYXRlSW5zdGFuY2UpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBjb21wb25lbnQgaGFzIHRvIGJlIGNyZWF0ZWQgYmVmb3JlIGNhbGxpbmcgJ2F1dG9ydW4nLlwiKTtcbiAgICB9XG4gICAgcmV0dXJuIHRlbXBsYXRlSW5zdGFuY2UuYXV0b3J1bihfLmJpbmQocnVuRnVuYywgdGhpcykpO1xuICB9XG5cbn07XG5cblNVUFBPUlRTX1JFQUNUSVZFX0lOU1RBTkNFID0gWydzdWJzY3JpcHRpb25zUmVhZHknXTtcblxuUkVRVUlSRV9SRU5ERVJFRF9JTlNUQU5DRSA9IFsnJCcsICdmaW5kJywgJ2ZpbmRBbGwnXTtcblxucmVmID0gQmxhemUuVGVtcGxhdGVJbnN0YW5jZS5wcm90b3R5cGU7XG4vLyBXZSBjb3B5IHV0aWxpdHkgbWV0aG9kcyAoJCwgZmluZEFsbCwgc3Vic2NyaWJlLCBldGMuKSBmcm9tIHRoZSB0ZW1wbGF0ZSBpbnN0YW5jZSBwcm90b3R5cGUsXG4vLyBpZiBhIG1ldGhvZCB3aXRoIHRoZSBzYW1lIG5hbWUgZG9lcyBub3QgZXhpc3QgYWxyZWFkeS5cbmZvciAobWV0aG9kTmFtZSBpbiByZWYpIHtcbiAgbWV0aG9kID0gcmVmW21ldGhvZE5hbWVdO1xuICBpZiAoIShtZXRob2ROYW1lIGluIEJsYXplQ29tcG9uZW50LnByb3RvdHlwZSkpIHtcbiAgICAoZnVuY3Rpb24obWV0aG9kTmFtZSwgbWV0aG9kKSB7XG4gICAgICBpZiAoaW5kZXhPZi5jYWxsKFNVUFBPUlRTX1JFQUNUSVZFX0lOU1RBTkNFLCBtZXRob2ROYW1lKSA+PSAwKSB7XG4gICAgICAgIHJldHVybiBCbGF6ZUNvbXBvbmVudC5wcm90b3R5cGVbbWV0aG9kTmFtZV0gPSBmdW5jdGlvbiguLi5hcmdzKSB7XG4gICAgICAgICAgdmFyIGJhc2UsIGNvbXBvbmVudCwgdGVtcGxhdGVJbnN0YW5jZTtcbiAgICAgICAgICBjb21wb25lbnQgPSB0aGlzLmNvbXBvbmVudCgpO1xuICAgICAgICAgIGlmIChjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscyA9PSBudWxsKSB7XG4gICAgICAgICAgICBjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscyA9IHt9O1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoKGJhc2UgPSBjb21wb25lbnQuX2NvbXBvbmVudEludGVybmFscykudGVtcGxhdGVJbnN0YW5jZSA9PSBudWxsKSB7XG4gICAgICAgICAgICBiYXNlLnRlbXBsYXRlSW5zdGFuY2UgPSBuZXcgUmVhY3RpdmVGaWVsZChudWxsLCBmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICAgIHJldHVybiBhID09PSBiO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0ZW1wbGF0ZUluc3RhbmNlID0gY29tcG9uZW50Ll9jb21wb25lbnRJbnRlcm5hbHMudGVtcGxhdGVJbnN0YW5jZSgpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVtcGxhdGVJbnN0YW5jZVttZXRob2ROYW1lXSguLi5hcmdzKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHZvaWQgMDtcbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSBpZiAoaW5kZXhPZi5jYWxsKFJFUVVJUkVfUkVOREVSRURfSU5TVEFOQ0UsIG1ldGhvZE5hbWUpID49IDApIHtcbiAgICAgICAgcmV0dXJuIEJsYXplQ29tcG9uZW50LnByb3RvdHlwZVttZXRob2ROYW1lXSA9IGZ1bmN0aW9uKC4uLmFyZ3MpIHtcbiAgICAgICAgICBpZiAodGhpcy5pc1JlbmRlcmVkKCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbXBvbmVudCgpLl9jb21wb25lbnRJbnRlcm5hbHMudGVtcGxhdGVJbnN0YW5jZSgpW21ldGhvZE5hbWVdKC4uLmFyZ3MpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdm9pZCAwO1xuICAgICAgICB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIEJsYXplQ29tcG9uZW50LnByb3RvdHlwZVttZXRob2ROYW1lXSA9IGZ1bmN0aW9uKC4uLmFyZ3MpIHtcbiAgICAgICAgICB2YXIgdGVtcGxhdGVJbnN0YW5jZTtcbiAgICAgICAgICB0ZW1wbGF0ZUluc3RhbmNlID0gVHJhY2tlci5ub25yZWFjdGl2ZSgoKSA9PiB7XG4gICAgICAgICAgICB2YXIgcmVmMTtcbiAgICAgICAgICAgIHJldHVybiAocmVmMSA9IHRoaXMuY29tcG9uZW50KCkuX2NvbXBvbmVudEludGVybmFscykgIT0gbnVsbCA/IHR5cGVvZiByZWYxLnRlbXBsYXRlSW5zdGFuY2UgPT09IFwiZnVuY3Rpb25cIiA/IHJlZjEudGVtcGxhdGVJbnN0YW5jZSgpIDogdm9pZCAwIDogdm9pZCAwO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGlmICghdGVtcGxhdGVJbnN0YW5jZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBUaGUgY29tcG9uZW50IGhhcyB0byBiZSBjcmVhdGVkIGJlZm9yZSBjYWxsaW5nICcke21ldGhvZE5hbWV9Jy5gKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRlbXBsYXRlSW5zdGFuY2VbbWV0aG9kTmFtZV0oLi4uYXJncyk7XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSkobWV0aG9kTmFtZSwgbWV0aG9kKTtcbiAgfVxufVxuIiwiY2xhc3MgQmxhemVDb21wb25lbnREZWJ1ZyBleHRlbmRzIEJhc2VDb21wb25lbnREZWJ1Z1xuICBAc3RhcnRDb21wb25lbnQ6IChjb21wb25lbnQpIC0+XG4gICAgc3VwZXIgYXJndW1lbnRzLi4uXG5cbiAgICBjb25zb2xlLmxvZyBjb21wb25lbnQuZGF0YSgpXG5cbiAgQHN0YXJ0TWFya2VkQ29tcG9uZW50OiAoY29tcG9uZW50KSAtPlxuICAgIHN1cGVyIGFyZ3VtZW50cy4uLlxuXG4gICAgY29uc29sZS5sb2cgY29tcG9uZW50LmRhdGEoKVxuXG4gIEBkdW1wQ29tcG9uZW50U3VidHJlZTogKHJvb3RDb21wb25lbnRPckVsZW1lbnQpIC0+XG4gICAgaWYgJ25vZGVUeXBlJyBvZiByb290Q29tcG9uZW50T3JFbGVtZW50IGFuZCByb290Q29tcG9uZW50T3JFbGVtZW50Lm5vZGVUeXBlIGlzIE5vZGUuRUxFTUVOVF9OT0RFXG4gICAgICByb290Q29tcG9uZW50T3JFbGVtZW50ID0gQmxhemVDb21wb25lbnQuZ2V0Q29tcG9uZW50Rm9yRWxlbWVudCByb290Q29tcG9uZW50T3JFbGVtZW50XG5cbiAgICBzdXBlciBhcmd1bWVudHMuLi5cblxuICBAZHVtcENvbXBvbmVudFRyZWU6IChyb290Q29tcG9uZW50T3JFbGVtZW50KSAtPlxuICAgIGlmICdub2RlVHlwZScgb2Ygcm9vdENvbXBvbmVudE9yRWxlbWVudCBhbmQgcm9vdENvbXBvbmVudE9yRWxlbWVudC5ub2RlVHlwZSBpcyBOb2RlLkVMRU1FTlRfTk9ERVxuICAgICAgcm9vdENvbXBvbmVudE9yRWxlbWVudCA9IEJsYXplQ29tcG9uZW50LmdldENvbXBvbmVudEZvckVsZW1lbnQgcm9vdENvbXBvbmVudE9yRWxlbWVudFxuXG4gICAgc3VwZXIgYXJndW1lbnRzLi4uXG5cbiAgQGR1bXBBbGxDb21wb25lbnRzOiAtPlxuICAgIGFsbFJvb3RDb21wb25lbnRzID0gW11cblxuICAgICQoJyonKS5lYWNoIChpLCBlbGVtZW50KSA9PlxuICAgICAgY29tcG9uZW50ID0gQmxhemVDb21wb25lbnQuZ2V0Q29tcG9uZW50Rm9yRWxlbWVudCBlbGVtZW50XG4gICAgICByZXR1cm4gdW5sZXNzIGNvbXBvbmVudFxuICAgICAgcm9vdENvbXBvbmVudCA9IEBjb21wb25lbnRSb290IGNvbXBvbmVudFxuICAgICAgYWxsUm9vdENvbXBvbmVudHMucHVzaCByb290Q29tcG9uZW50IHVubGVzcyByb290Q29tcG9uZW50IGluIGFsbFJvb3RDb21wb25lbnRzXG5cbiAgICBmb3Igcm9vdENvbXBvbmVudCBpbiBhbGxSb290Q29tcG9uZW50c1xuICAgICAgQGR1bXBDb21wb25lbnRTdWJ0cmVlIHJvb3RDb21wb25lbnRcblxuICAgIHJldHVyblxuIiwidmFyICAgICAgICAgICAgICAgICAgICAgXG4gIGluZGV4T2YgPSBbXS5pbmRleE9mO1xuXG5CbGF6ZUNvbXBvbmVudERlYnVnID0gY2xhc3MgQmxhemVDb21wb25lbnREZWJ1ZyBleHRlbmRzIEJhc2VDb21wb25lbnREZWJ1ZyB7XG4gIHN0YXRpYyBzdGFydENvbXBvbmVudChjb21wb25lbnQpIHtcbiAgICBzdXBlci5zdGFydENvbXBvbmVudCguLi5hcmd1bWVudHMpO1xuICAgIHJldHVybiBjb25zb2xlLmxvZyhjb21wb25lbnQuZGF0YSgpKTtcbiAgfVxuXG4gIHN0YXRpYyBzdGFydE1hcmtlZENvbXBvbmVudChjb21wb25lbnQpIHtcbiAgICBzdXBlci5zdGFydE1hcmtlZENvbXBvbmVudCguLi5hcmd1bWVudHMpO1xuICAgIHJldHVybiBjb25zb2xlLmxvZyhjb21wb25lbnQuZGF0YSgpKTtcbiAgfVxuXG4gIHN0YXRpYyBkdW1wQ29tcG9uZW50U3VidHJlZShyb290Q29tcG9uZW50T3JFbGVtZW50KSB7XG4gICAgaWYgKCdub2RlVHlwZScgaW4gcm9vdENvbXBvbmVudE9yRWxlbWVudCAmJiByb290Q29tcG9uZW50T3JFbGVtZW50Lm5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgcm9vdENvbXBvbmVudE9yRWxlbWVudCA9IEJsYXplQ29tcG9uZW50LmdldENvbXBvbmVudEZvckVsZW1lbnQocm9vdENvbXBvbmVudE9yRWxlbWVudCk7XG4gICAgfVxuICAgIHJldHVybiBzdXBlci5kdW1wQ29tcG9uZW50U3VidHJlZSguLi5hcmd1bWVudHMpO1xuICB9XG5cbiAgc3RhdGljIGR1bXBDb21wb25lbnRUcmVlKHJvb3RDb21wb25lbnRPckVsZW1lbnQpIHtcbiAgICBpZiAoJ25vZGVUeXBlJyBpbiByb290Q29tcG9uZW50T3JFbGVtZW50ICYmIHJvb3RDb21wb25lbnRPckVsZW1lbnQubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICByb290Q29tcG9uZW50T3JFbGVtZW50ID0gQmxhemVDb21wb25lbnQuZ2V0Q29tcG9uZW50Rm9yRWxlbWVudChyb290Q29tcG9uZW50T3JFbGVtZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIHN1cGVyLmR1bXBDb21wb25lbnRUcmVlKC4uLmFyZ3VtZW50cyk7XG4gIH1cblxuICBzdGF0aWMgZHVtcEFsbENvbXBvbmVudHMoKSB7XG4gICAgdmFyIGFsbFJvb3RDb21wb25lbnRzLCBqLCBsZW4sIHJvb3RDb21wb25lbnQ7XG4gICAgYWxsUm9vdENvbXBvbmVudHMgPSBbXTtcbiAgICAkKCcqJykuZWFjaCgoaSwgZWxlbWVudCkgPT4ge1xuICAgICAgdmFyIGNvbXBvbmVudCwgcm9vdENvbXBvbmVudDtcbiAgICAgIGNvbXBvbmVudCA9IEJsYXplQ29tcG9uZW50LmdldENvbXBvbmVudEZvckVsZW1lbnQoZWxlbWVudCk7XG4gICAgICBpZiAoIWNvbXBvbmVudCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICByb290Q29tcG9uZW50ID0gdGhpcy5jb21wb25lbnRSb290KGNvbXBvbmVudCk7XG4gICAgICBpZiAoaW5kZXhPZi5jYWxsKGFsbFJvb3RDb21wb25lbnRzLCByb290Q29tcG9uZW50KSA8IDApIHtcbiAgICAgICAgcmV0dXJuIGFsbFJvb3RDb21wb25lbnRzLnB1c2gocm9vdENvbXBvbmVudCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgZm9yIChqID0gMCwgbGVuID0gYWxsUm9vdENvbXBvbmVudHMubGVuZ3RoOyBqIDwgbGVuOyBqKyspIHtcbiAgICAgIHJvb3RDb21wb25lbnQgPSBhbGxSb290Q29tcG9uZW50c1tqXTtcbiAgICAgIHRoaXMuZHVtcENvbXBvbmVudFN1YnRyZWUocm9vdENvbXBvbmVudCk7XG4gICAgfVxuICB9XG5cbn07XG4iLCIjIE5vLW9wIG9uIHRoZSBzZXJ2ZXIuXG5UZW1wbGF0ZS5ib2R5LnJlbmRlclRvRG9jdW1lbnQgPSAtPlxuIl19
