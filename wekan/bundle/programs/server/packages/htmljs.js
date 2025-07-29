(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var HTML;

var require = meteorInstall({"node_modules":{"meteor":{"htmljs":{"preamble.js":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/htmljs/preamble.js                                                                                    //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
module.export({
  HTML: () => HTML
});
let HTMLTags, Tag, Attrs, getTag, ensureTag, isTagEnsured, getSymbolName, knownHTMLElementNames, knownSVGElementNames, knownElementNames, voidElementNames, isKnownElement, isKnownSVGElement, isVoidElement, CharRef, Comment, Raw, isArray, isConstructedObject, isNully, isValidAttributeName, flattenAttributes;
module.link("./html", {
  HTMLTags(v) {
    HTMLTags = v;
  },
  Tag(v) {
    Tag = v;
  },
  Attrs(v) {
    Attrs = v;
  },
  getTag(v) {
    getTag = v;
  },
  ensureTag(v) {
    ensureTag = v;
  },
  isTagEnsured(v) {
    isTagEnsured = v;
  },
  getSymbolName(v) {
    getSymbolName = v;
  },
  knownHTMLElementNames(v) {
    knownHTMLElementNames = v;
  },
  knownSVGElementNames(v) {
    knownSVGElementNames = v;
  },
  knownElementNames(v) {
    knownElementNames = v;
  },
  voidElementNames(v) {
    voidElementNames = v;
  },
  isKnownElement(v) {
    isKnownElement = v;
  },
  isKnownSVGElement(v) {
    isKnownSVGElement = v;
  },
  isVoidElement(v) {
    isVoidElement = v;
  },
  CharRef(v) {
    CharRef = v;
  },
  Comment(v) {
    Comment = v;
  },
  Raw(v) {
    Raw = v;
  },
  isArray(v) {
    isArray = v;
  },
  isConstructedObject(v) {
    isConstructedObject = v;
  },
  isNully(v) {
    isNully = v;
  },
  isValidAttributeName(v) {
    isValidAttributeName = v;
  },
  flattenAttributes(v) {
    flattenAttributes = v;
  }
}, 0);
let Visitor, TransformingVisitor, ToHTMLVisitor, ToTextVisitor, toHTML, TEXTMODE, toText;
module.link("./visitors", {
  Visitor(v) {
    Visitor = v;
  },
  TransformingVisitor(v) {
    TransformingVisitor = v;
  },
  ToHTMLVisitor(v) {
    ToHTMLVisitor = v;
  },
  ToTextVisitor(v) {
    ToTextVisitor = v;
  },
  toHTML(v) {
    toHTML = v;
  },
  TEXTMODE(v) {
    TEXTMODE = v;
  },
  toText(v) {
    toText = v;
  }
}, 1);
const HTML = Object.assign(HTMLTags, {
  Tag,
  Attrs,
  getTag,
  ensureTag,
  isTagEnsured,
  getSymbolName,
  knownHTMLElementNames,
  knownSVGElementNames,
  knownElementNames,
  voidElementNames,
  isKnownElement,
  isKnownSVGElement,
  isVoidElement,
  CharRef,
  Comment,
  Raw,
  isArray,
  isConstructedObject,
  isNully,
  isValidAttributeName,
  flattenAttributes,
  toHTML,
  TEXTMODE,
  toText,
  Visitor,
  TransformingVisitor,
  ToHTMLVisitor,
  ToTextVisitor
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"html.js":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/htmljs/html.js                                                                                        //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
module.export({
  Tag: () => Tag,
  Attrs: () => Attrs,
  HTMLTags: () => HTMLTags,
  getTag: () => getTag,
  ensureTag: () => ensureTag,
  isTagEnsured: () => isTagEnsured,
  getSymbolName: () => getSymbolName,
  knownHTMLElementNames: () => knownHTMLElementNames,
  knownSVGElementNames: () => knownSVGElementNames,
  knownElementNames: () => knownElementNames,
  voidElementNames: () => voidElementNames,
  isKnownElement: () => isKnownElement,
  isKnownSVGElement: () => isKnownSVGElement,
  isVoidElement: () => isVoidElement,
  CharRef: () => CharRef,
  Comment: () => Comment,
  Raw: () => Raw,
  isArray: () => isArray,
  isConstructedObject: () => isConstructedObject,
  isNully: () => isNully,
  isValidAttributeName: () => isValidAttributeName,
  flattenAttributes: () => flattenAttributes
});
const Tag = function () {};
Tag.prototype.tagName = ''; // this will be set per Tag subclass
Tag.prototype.attrs = null;
Tag.prototype.children = Object.freeze ? Object.freeze([]) : [];
Tag.prototype.htmljsType = Tag.htmljsType = ['Tag'];

// Given "p" create the function `HTML.P`.
var makeTagConstructor = function (tagName) {
  // Tag is the per-tagName constructor of a HTML.Tag subclass
  var HTMLTag = function () {
    // Work with or without `new`.  If not called with `new`,
    // perform instantiation by recursively calling this constructor.
    // We can't pass varargs, so pass no args.
    var instance = this instanceof Tag ? this : new HTMLTag();
    var i = 0;
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    var attrs = args.length && args[0];
    if (attrs && typeof attrs === 'object') {
      // Treat vanilla JS object as an attributes dictionary.
      if (!isConstructedObject(attrs)) {
        instance.attrs = attrs;
        i++;
      } else if (attrs instanceof Attrs) {
        var array = attrs.value;
        if (array.length === 1) {
          instance.attrs = array[0];
        } else if (array.length > 1) {
          instance.attrs = array;
        }
        i++;
      }
    }

    // If no children, don't create an array at all, use the prototype's
    // (frozen, empty) array.  This way we don't create an empty array
    // every time someone creates a tag without `new` and this constructor
    // calls itself with no arguments (above).
    if (i < args.length) instance.children = args.slice(i);
    return instance;
  };
  HTMLTag.prototype = new Tag();
  HTMLTag.prototype.constructor = HTMLTag;
  HTMLTag.prototype.tagName = tagName;
  return HTMLTag;
};

// Not an HTMLjs node, but a wrapper to pass multiple attrs dictionaries
// to a tag (for the purpose of implementing dynamic attributes).
function Attrs() {
  // Work with or without `new`.  If not called with `new`,
  // perform instantiation by recursively calling this constructor.
  // We can't pass varargs, so pass no args.
  var instance = this instanceof Attrs ? this : new Attrs();
  for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    args[_key2] = arguments[_key2];
  }
  instance.value = args;
  return instance;
}
const HTMLTags = {};
function getTag(tagName) {
  var symbolName = getSymbolName(tagName);
  if (symbolName === tagName)
    // all-caps tagName
    throw new Error("Use the lowercase or camelCase form of '" + tagName + "' here");
  if (!HTMLTags[symbolName]) HTMLTags[symbolName] = makeTagConstructor(tagName);
  return HTMLTags[symbolName];
}
function ensureTag(tagName) {
  getTag(tagName); // don't return it
}
function isTagEnsured(tagName) {
  return isKnownElement(tagName);
}
function getSymbolName(tagName) {
  // "foo-bar" -> "FOO_BAR"
  return tagName.toUpperCase().replace(/-/g, '_');
}
const knownHTMLElementNames = 'a abbr acronym address applet area article aside audio b base basefont bdi bdo big blockquote body br button canvas caption center cite code col colgroup command data datagrid datalist dd del details dfn dir div dl dt em embed eventsource fieldset figcaption figure font footer form frame frameset h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins isindex kbd keygen label legend li link main map mark menu meta meter nav noframes noscript object ol optgroup option output p param pre progress q rp rt ruby s samp script section select small source span strike strong style sub summary sup table tbody td textarea tfoot th thead time title tr track tt u ul var video wbr'.split(' ');
const knownSVGElementNames = 'altGlyph altGlyphDef altGlyphItem animate animateColor animateMotion animateTransform circle clipPath color-profile cursor defs desc ellipse feBlend feColorMatrix feComponentTransfer feComposite feConvolveMatrix feDiffuseLighting feDisplacementMap feDistantLight feFlood feFuncA feFuncB feFuncG feFuncR feGaussianBlur feImage feMerge feMergeNode feMorphology feOffset fePointLight feSpecularLighting feSpotLight feTile feTurbulence filter font font-face font-face-format font-face-name font-face-src font-face-uri foreignObject g glyph glyphRef hkern image line linearGradient marker mask metadata missing-glyph path pattern polygon polyline radialGradient rect set stop style svg switch symbol text textPath title tref tspan use view vkern'.split(' ');
const knownElementNames = knownHTMLElementNames.concat(knownSVGElementNames);
const voidElementNames = 'area base br col command embed hr img input keygen link meta param source track wbr'.split(' ');
var voidElementSet = new Set(voidElementNames);
var knownElementSet = new Set(knownElementNames);
var knownSVGElementSet = new Set(knownSVGElementNames);
function isKnownElement(tagName) {
  return knownElementSet.has(tagName);
}
function isKnownSVGElement(tagName) {
  return knownSVGElementSet.has(tagName);
}
function isVoidElement(tagName) {
  return voidElementSet.has(tagName);
}
// Ensure tags for all known elements
knownElementNames.forEach(ensureTag);
function CharRef(attrs) {
  if (!(this instanceof CharRef))
    // called without `new`
    return new CharRef(attrs);
  if (!(attrs && attrs.html && attrs.str)) throw new Error("HTML.CharRef must be constructed with ({html:..., str:...})");
  this.html = attrs.html;
  this.str = attrs.str;
}
CharRef.prototype.htmljsType = CharRef.htmljsType = ['CharRef'];
function Comment(value) {
  if (!(this instanceof Comment))
    // called without `new`
    return new Comment(value);
  if (typeof value !== 'string') throw new Error('HTML.Comment must be constructed with a string');
  this.value = value;
  // Kill illegal hyphens in comment value (no way to escape them in HTML)
  this.sanitizedValue = value.replace(/^-|--+|-$/g, '');
}
Comment.prototype.htmljsType = Comment.htmljsType = ['Comment'];
function Raw(value) {
  if (!(this instanceof Raw))
    // called without `new`
    return new Raw(value);
  if (typeof value !== 'string') throw new Error('HTML.Raw must be constructed with a string');
  this.value = value;
}
Raw.prototype.htmljsType = Raw.htmljsType = ['Raw'];
function isArray(x) {
  return x instanceof Array || Array.isArray(x);
}
function isConstructedObject(x) {
  // Figure out if `x` is "an instance of some class" or just a plain
  // object literal.  It correctly treats an object literal like
  // `{ constructor: ... }` as an object literal.  It won't detect
  // instances of classes that lack a `constructor` property (e.g.
  // if you assign to a prototype when setting up the class as in:
  // `Foo = function () { ... }; Foo.prototype = { ... }`, then
  // `(new Foo).constructor` is `Object`, not `Foo`).
  if (!x || typeof x !== 'object') return false;
  // Is this a plain object?
  let plain = false;
  if (Object.getPrototypeOf(x) === null) {
    plain = true;
  } else {
    let proto = x;
    while (Object.getPrototypeOf(proto) !== null) {
      proto = Object.getPrototypeOf(proto);
    }
    plain = Object.getPrototypeOf(x) === proto;
  }
  return !plain && typeof x.constructor === 'function' && x instanceof x.constructor;
}
function isNully(node) {
  if (node == null)
    // null or undefined
    return true;
  if (isArray(node)) {
    // is it an empty array or an array of all nully items?
    for (var i = 0; i < node.length; i++) if (!isNully(node[i])) return false;
    return true;
  }
  return false;
}
function isValidAttributeName(name) {
  return /^[:_A-Za-z][:_A-Za-z0-9.\-]*/.test(name);
}
function flattenAttributes(attrs) {
  if (!attrs) return attrs;
  var isList = isArray(attrs);
  if (isList && attrs.length === 0) return null;
  var result = {};
  for (var i = 0, N = isList ? attrs.length : 1; i < N; i++) {
    var oneAttrs = isList ? attrs[i] : attrs;
    if (typeof oneAttrs !== 'object' || isConstructedObject(oneAttrs)) throw new Error("Expected plain JS object as attrs, found: " + oneAttrs);
    for (var name in oneAttrs) {
      if (!isValidAttributeName(name)) throw new Error("Illegal HTML attribute name: " + name);
      var value = oneAttrs[name];
      if (!isNully(value)) result[name] = value;
    }
  }
  return result;
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"visitors.js":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                //
// packages/htmljs/visitors.js                                                                                    //
//                                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                  //
module.export({
  Visitor: () => Visitor,
  TransformingVisitor: () => TransformingVisitor,
  ToTextVisitor: () => ToTextVisitor,
  ToHTMLVisitor: () => ToHTMLVisitor,
  toHTML: () => toHTML,
  TEXTMODE: () => TEXTMODE,
  toText: () => toText
});
let Tag, CharRef, Comment, Raw, isArray, getTag, isConstructedObject, flattenAttributes, isVoidElement;
module.link("./html", {
  Tag(v) {
    Tag = v;
  },
  CharRef(v) {
    CharRef = v;
  },
  Comment(v) {
    Comment = v;
  },
  Raw(v) {
    Raw = v;
  },
  isArray(v) {
    isArray = v;
  },
  getTag(v) {
    getTag = v;
  },
  isConstructedObject(v) {
    isConstructedObject = v;
  },
  flattenAttributes(v) {
    flattenAttributes = v;
  },
  isVoidElement(v) {
    isVoidElement = v;
  }
}, 0);
var IDENTITY = function (x) {
  return x;
};

// _assign is like _.extend or the upcoming Object.assign.
// Copy src's own, enumerable properties onto tgt and return
// tgt.
var _hasOwnProperty = Object.prototype.hasOwnProperty;
var _assign = function (tgt, src) {
  for (var k in src) {
    if (_hasOwnProperty.call(src, k)) tgt[k] = src[k];
  }
  return tgt;
};
const Visitor = function (props) {
  _assign(this, props);
};
Visitor.def = function (options) {
  _assign(this.prototype, options);
};
Visitor.extend = function (options) {
  var curType = this;
  var subType = function HTMLVisitorSubtype( /*arguments*/
  ) {
    Visitor.apply(this, arguments);
  };
  subType.prototype = new curType();
  subType.extend = curType.extend;
  subType.def = curType.def;
  if (options) _assign(subType.prototype, options);
  return subType;
};
Visitor.def({
  visit: function (content /*, ...*/) {
    if (content == null)
      // null or undefined.
      return this.visitNull.apply(this, arguments);
    if (typeof content === 'object') {
      if (content.htmljsType) {
        switch (content.htmljsType) {
          case Tag.htmljsType:
            return this.visitTag.apply(this, arguments);
          case CharRef.htmljsType:
            return this.visitCharRef.apply(this, arguments);
          case Comment.htmljsType:
            return this.visitComment.apply(this, arguments);
          case Raw.htmljsType:
            return this.visitRaw.apply(this, arguments);
          default:
            throw new Error("Unknown htmljs type: " + content.htmljsType);
        }
      }
      if (isArray(content)) return this.visitArray.apply(this, arguments);
      return this.visitObject.apply(this, arguments);
    } else if (typeof content === 'string' || typeof content === 'boolean' || typeof content === 'number') {
      return this.visitPrimitive.apply(this, arguments);
    } else if (typeof content === 'function') {
      return this.visitFunction.apply(this, arguments);
    }
    throw new Error("Unexpected object in htmljs: " + content);
  },
  visitNull: function (nullOrUndefined /*, ...*/) {},
  visitPrimitive: function (stringBooleanOrNumber /*, ...*/) {},
  visitArray: function (array /*, ...*/) {},
  visitComment: function (comment /*, ...*/) {},
  visitCharRef: function (charRef /*, ...*/) {},
  visitRaw: function (raw /*, ...*/) {},
  visitTag: function (tag /*, ...*/) {},
  visitObject: function (obj /*, ...*/) {
    throw new Error("Unexpected object in htmljs: " + obj);
  },
  visitFunction: function (fn /*, ...*/) {
    throw new Error("Unexpected function in htmljs: " + fn);
  }
});
const TransformingVisitor = Visitor.extend();
TransformingVisitor.def({
  visitNull: IDENTITY,
  visitPrimitive: IDENTITY,
  visitArray: function (array) {
    var result = array;
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }
    for (var i = 0; i < array.length; i++) {
      var oldItem = array[i];
      var newItem = this.visit(oldItem, ...args);
      if (newItem !== oldItem) {
        // copy `array` on write
        if (result === array) result = array.slice();
        result[i] = newItem;
      }
    }
    return result;
  },
  visitComment: IDENTITY,
  visitCharRef: IDENTITY,
  visitRaw: IDENTITY,
  visitObject: function (obj) {
    // Don't parse Markdown & RCData as HTML
    if (obj.textMode != null) {
      return obj;
    }
    for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      args[_key2 - 1] = arguments[_key2];
    }
    if ('content' in obj) {
      obj.content = this.visit(obj.content, ...args);
    }
    if ('elseContent' in obj) {
      obj.elseContent = this.visit(obj.elseContent, ...args);
    }
    return obj;
  },
  visitFunction: IDENTITY,
  visitTag: function (tag) {
    var oldChildren = tag.children;
    for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      args[_key3 - 1] = arguments[_key3];
    }
    var newChildren = this.visitChildren(oldChildren, ...args);
    var oldAttrs = tag.attrs;
    var newAttrs = this.visitAttributes(oldAttrs, ...args);
    if (newAttrs === oldAttrs && newChildren === oldChildren) return tag;
    var newTag = getTag(tag.tagName).apply(null, newChildren);
    newTag.attrs = newAttrs;
    return newTag;
  },
  visitChildren: function (children) {
    for (var _len4 = arguments.length, args = new Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
      args[_key4 - 1] = arguments[_key4];
    }
    return this.visitArray(children, ...args);
  },
  // Transform the `.attrs` property of a tag, which may be a dictionary,
  // an array, or in some uses, a foreign object (such as
  // a template tag).
  visitAttributes: function (attrs) {
    for (var _len5 = arguments.length, args = new Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
      args[_key5 - 1] = arguments[_key5];
    }
    if (isArray(attrs)) {
      var result = attrs;
      for (var i = 0; i < attrs.length; i++) {
        var oldItem = attrs[i];
        var newItem = this.visitAttributes(oldItem, ...args);
        if (newItem !== oldItem) {
          // copy on write
          if (result === attrs) result = attrs.slice();
          result[i] = newItem;
        }
      }
      return result;
    }
    if (attrs && isConstructedObject(attrs)) {
      throw new Error("The basic TransformingVisitor does not support " + "foreign objects in attributes.  Define a custom " + "visitAttributes for this case.");
    }
    var oldAttrs = attrs;
    var newAttrs = oldAttrs;
    if (oldAttrs) {
      var attrArgs = [null, null];
      attrArgs.push.apply(attrArgs, arguments);
      for (var k in oldAttrs) {
        var oldValue = oldAttrs[k];
        attrArgs[0] = k;
        attrArgs[1] = oldValue;
        var newValue = this.visitAttribute.apply(this, attrArgs);
        if (newValue !== oldValue) {
          // copy on write
          if (newAttrs === oldAttrs) newAttrs = _assign({}, oldAttrs);
          newAttrs[k] = newValue;
        }
      }
    }
    return newAttrs;
  },
  // Transform the value of one attribute name/value in an
  // attributes dictionary.
  visitAttribute: function (name, value, tag) {
    for (var _len6 = arguments.length, args = new Array(_len6 > 3 ? _len6 - 3 : 0), _key6 = 3; _key6 < _len6; _key6++) {
      args[_key6 - 3] = arguments[_key6];
    }
    return this.visit(value, ...args);
  }
});
const ToTextVisitor = Visitor.extend();
ToTextVisitor.def({
  visitNull: function (nullOrUndefined) {
    return '';
  },
  visitPrimitive: function (stringBooleanOrNumber) {
    var str = String(stringBooleanOrNumber);
    if (this.textMode === TEXTMODE.RCDATA) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    } else if (this.textMode === TEXTMODE.ATTRIBUTE) {
      // escape `&` and `"` this time, not `&` and `<`
      return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    } else {
      return str;
    }
  },
  visitArray: function (array) {
    var parts = [];
    for (var i = 0; i < array.length; i++) parts.push(this.visit(array[i]));
    return parts.join('');
  },
  visitComment: function (comment) {
    throw new Error("Can't have a comment here");
  },
  visitCharRef: function (charRef) {
    if (this.textMode === TEXTMODE.RCDATA || this.textMode === TEXTMODE.ATTRIBUTE) {
      return charRef.html;
    } else {
      return charRef.str;
    }
  },
  visitRaw: function (raw) {
    return raw.value;
  },
  visitTag: function (tag) {
    // Really we should just disallow Tags here.  However, at the
    // moment it's useful to stringify any HTML we find.  In
    // particular, when you include a template within `{{#markdown}}`,
    // we render the template as text, and since there's currently
    // no way to make the template be *parsed* as text (e.g. `<template
    // type="text">`), we hackishly support HTML tags in markdown
    // in templates by parsing them and stringifying them.
    return this.visit(this.toHTML(tag));
  },
  visitObject: function (x) {
    throw new Error("Unexpected object in htmljs in toText: " + x);
  },
  toHTML: function (node) {
    return toHTML(node);
  }
});
const ToHTMLVisitor = Visitor.extend();
ToHTMLVisitor.def({
  visitNull: function (nullOrUndefined) {
    return '';
  },
  visitPrimitive: function (stringBooleanOrNumber) {
    var str = String(stringBooleanOrNumber);
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  },
  visitArray: function (array) {
    var parts = [];
    for (var i = 0; i < array.length; i++) parts.push(this.visit(array[i]));
    return parts.join('');
  },
  visitComment: function (comment) {
    return '<!--' + comment.sanitizedValue + '-->';
  },
  visitCharRef: function (charRef) {
    return charRef.html;
  },
  visitRaw: function (raw) {
    return raw.value;
  },
  visitTag: function (tag) {
    var attrStrs = [];
    var tagName = tag.tagName;
    var children = tag.children;
    var attrs = tag.attrs;
    if (attrs) {
      attrs = flattenAttributes(attrs);
      for (var k in attrs) {
        if (k === 'value' && tagName === 'textarea') {
          children = [attrs[k], children];
        } else {
          var v = this.toText(attrs[k], TEXTMODE.ATTRIBUTE);
          attrStrs.push(' ' + k + '="' + v + '"');
        }
      }
    }
    var startTag = '<' + tagName + attrStrs.join('') + '>';
    var childStrs = [];
    var content;
    if (tagName === 'textarea') {
      for (var i = 0; i < children.length; i++) childStrs.push(this.toText(children[i], TEXTMODE.RCDATA));
      content = childStrs.join('');
      if (content.slice(0, 1) === '\n')
        // TEXTAREA will absorb a newline, so if we see one, add
        // another one.
        content = '\n' + content;
    } else {
      for (var i = 0; i < children.length; i++) childStrs.push(this.visit(children[i]));
      content = childStrs.join('');
    }
    var result = startTag + content;
    if (children.length || !isVoidElement(tagName)) {
      // "Void" elements like BR are the only ones that don't get a close
      // tag in HTML5.  They shouldn't have contents, either, so we could
      // throw an error upon seeing contents here.
      result += '</' + tagName + '>';
    }
    return result;
  },
  visitObject: function (x) {
    throw new Error("Unexpected object in htmljs in toHTML: " + x);
  },
  toText: function (node, textMode) {
    return toText(node, textMode);
  }
});

////////////////////////////// TOHTML

function toHTML(content) {
  return new ToHTMLVisitor().visit(content);
}
const TEXTMODE = {
  STRING: 1,
  RCDATA: 2,
  ATTRIBUTE: 3
};
function toText(content, textMode) {
  if (!textMode) throw new Error("textMode required for HTML.toText");
  if (!(textMode === TEXTMODE.STRING || textMode === TEXTMODE.RCDATA || textMode === TEXTMODE.ATTRIBUTE)) throw new Error("Unknown textMode: " + textMode);
  var visitor = new ToTextVisitor({
    textMode: textMode
  });
  return visitor.visit(content);
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/htmljs/preamble.js");

/* Exports */
Package._define("htmljs", exports, {
  HTML: HTML
});

})();

//# sourceURL=meteor://💻app/packages/htmljs.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvaHRtbGpzL3ByZWFtYmxlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9odG1sanMvaHRtbC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvaHRtbGpzL3Zpc2l0b3JzLmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydCIsIkhUTUwiLCJIVE1MVGFncyIsIlRhZyIsIkF0dHJzIiwiZ2V0VGFnIiwiZW5zdXJlVGFnIiwiaXNUYWdFbnN1cmVkIiwiZ2V0U3ltYm9sTmFtZSIsImtub3duSFRNTEVsZW1lbnROYW1lcyIsImtub3duU1ZHRWxlbWVudE5hbWVzIiwia25vd25FbGVtZW50TmFtZXMiLCJ2b2lkRWxlbWVudE5hbWVzIiwiaXNLbm93bkVsZW1lbnQiLCJpc0tub3duU1ZHRWxlbWVudCIsImlzVm9pZEVsZW1lbnQiLCJDaGFyUmVmIiwiQ29tbWVudCIsIlJhdyIsImlzQXJyYXkiLCJpc0NvbnN0cnVjdGVkT2JqZWN0IiwiaXNOdWxseSIsImlzVmFsaWRBdHRyaWJ1dGVOYW1lIiwiZmxhdHRlbkF0dHJpYnV0ZXMiLCJsaW5rIiwidiIsIlZpc2l0b3IiLCJUcmFuc2Zvcm1pbmdWaXNpdG9yIiwiVG9IVE1MVmlzaXRvciIsIlRvVGV4dFZpc2l0b3IiLCJ0b0hUTUwiLCJURVhUTU9ERSIsInRvVGV4dCIsIk9iamVjdCIsImFzc2lnbiIsInByb3RvdHlwZSIsInRhZ05hbWUiLCJhdHRycyIsImNoaWxkcmVuIiwiZnJlZXplIiwiaHRtbGpzVHlwZSIsIm1ha2VUYWdDb25zdHJ1Y3RvciIsIkhUTUxUYWciLCJpbnN0YW5jZSIsImkiLCJfbGVuIiwiYXJndW1lbnRzIiwibGVuZ3RoIiwiYXJncyIsIkFycmF5IiwiX2tleSIsImFycmF5IiwidmFsdWUiLCJzbGljZSIsImNvbnN0cnVjdG9yIiwiX2xlbjIiLCJfa2V5MiIsInN5bWJvbE5hbWUiLCJFcnJvciIsInRvVXBwZXJDYXNlIiwicmVwbGFjZSIsInNwbGl0IiwiY29uY2F0Iiwidm9pZEVsZW1lbnRTZXQiLCJTZXQiLCJrbm93bkVsZW1lbnRTZXQiLCJrbm93blNWR0VsZW1lbnRTZXQiLCJoYXMiLCJmb3JFYWNoIiwiaHRtbCIsInN0ciIsInNhbml0aXplZFZhbHVlIiwieCIsInBsYWluIiwiZ2V0UHJvdG90eXBlT2YiLCJwcm90byIsIm5vZGUiLCJuYW1lIiwidGVzdCIsImlzTGlzdCIsInJlc3VsdCIsIk4iLCJvbmVBdHRycyIsIklERU5USVRZIiwiX2hhc093blByb3BlcnR5IiwiaGFzT3duUHJvcGVydHkiLCJfYXNzaWduIiwidGd0Iiwic3JjIiwiayIsImNhbGwiLCJwcm9wcyIsImRlZiIsIm9wdGlvbnMiLCJleHRlbmQiLCJjdXJUeXBlIiwic3ViVHlwZSIsIkhUTUxWaXNpdG9yU3VidHlwZSIsImFwcGx5IiwidmlzaXQiLCJjb250ZW50IiwidmlzaXROdWxsIiwidmlzaXRUYWciLCJ2aXNpdENoYXJSZWYiLCJ2aXNpdENvbW1lbnQiLCJ2aXNpdFJhdyIsInZpc2l0QXJyYXkiLCJ2aXNpdE9iamVjdCIsInZpc2l0UHJpbWl0aXZlIiwidmlzaXRGdW5jdGlvbiIsIm51bGxPclVuZGVmaW5lZCIsInN0cmluZ0Jvb2xlYW5Pck51bWJlciIsImNvbW1lbnQiLCJjaGFyUmVmIiwicmF3IiwidGFnIiwib2JqIiwiZm4iLCJvbGRJdGVtIiwibmV3SXRlbSIsInRleHRNb2RlIiwiZWxzZUNvbnRlbnQiLCJvbGRDaGlsZHJlbiIsIl9sZW4zIiwiX2tleTMiLCJuZXdDaGlsZHJlbiIsInZpc2l0Q2hpbGRyZW4iLCJvbGRBdHRycyIsIm5ld0F0dHJzIiwidmlzaXRBdHRyaWJ1dGVzIiwibmV3VGFnIiwiX2xlbjQiLCJfa2V5NCIsIl9sZW41IiwiX2tleTUiLCJhdHRyQXJncyIsInB1c2giLCJvbGRWYWx1ZSIsIm5ld1ZhbHVlIiwidmlzaXRBdHRyaWJ1dGUiLCJfbGVuNiIsIl9rZXk2IiwiU3RyaW5nIiwiUkNEQVRBIiwiQVRUUklCVVRFIiwicGFydHMiLCJqb2luIiwiYXR0clN0cnMiLCJzdGFydFRhZyIsImNoaWxkU3RycyIsIlNUUklORyIsInZpc2l0b3IiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxNQUFNLENBQUNDLE1BQU0sQ0FBQztFQUFDQyxJQUFJLEVBQUNBLENBQUEsS0FBSUE7QUFBSSxDQUFDLENBQUM7QUFBQyxJQUFJQyxRQUFRLEVBQUNDLEdBQUcsRUFBQ0MsS0FBSyxFQUFDQyxNQUFNLEVBQUNDLFNBQVMsRUFBQ0MsWUFBWSxFQUFDQyxhQUFhLEVBQUNDLHFCQUFxQixFQUFDQyxvQkFBb0IsRUFBQ0MsaUJBQWlCLEVBQUNDLGdCQUFnQixFQUFDQyxjQUFjLEVBQUNDLGlCQUFpQixFQUFDQyxhQUFhLEVBQUNDLE9BQU8sRUFBQ0MsT0FBTyxFQUFDQyxHQUFHLEVBQUNDLE9BQU8sRUFBQ0MsbUJBQW1CLEVBQUNDLE9BQU8sRUFBQ0Msb0JBQW9CLEVBQUNDLGlCQUFpQjtBQUFDeEIsTUFBTSxDQUFDeUIsSUFBSSxDQUFDLFFBQVEsRUFBQztFQUFDdEIsUUFBUUEsQ0FBQ3VCLENBQUMsRUFBQztJQUFDdkIsUUFBUSxHQUFDdUIsQ0FBQztFQUFBLENBQUM7RUFBQ3RCLEdBQUdBLENBQUNzQixDQUFDLEVBQUM7SUFBQ3RCLEdBQUcsR0FBQ3NCLENBQUM7RUFBQSxDQUFDO0VBQUNyQixLQUFLQSxDQUFDcUIsQ0FBQyxFQUFDO0lBQUNyQixLQUFLLEdBQUNxQixDQUFDO0VBQUEsQ0FBQztFQUFDcEIsTUFBTUEsQ0FBQ29CLENBQUMsRUFBQztJQUFDcEIsTUFBTSxHQUFDb0IsQ0FBQztFQUFBLENBQUM7RUFBQ25CLFNBQVNBLENBQUNtQixDQUFDLEVBQUM7SUFBQ25CLFNBQVMsR0FBQ21CLENBQUM7RUFBQSxDQUFDO0VBQUNsQixZQUFZQSxDQUFDa0IsQ0FBQyxFQUFDO0lBQUNsQixZQUFZLEdBQUNrQixDQUFDO0VBQUEsQ0FBQztFQUFDakIsYUFBYUEsQ0FBQ2lCLENBQUMsRUFBQztJQUFDakIsYUFBYSxHQUFDaUIsQ0FBQztFQUFBLENBQUM7RUFBQ2hCLHFCQUFxQkEsQ0FBQ2dCLENBQUMsRUFBQztJQUFDaEIscUJBQXFCLEdBQUNnQixDQUFDO0VBQUEsQ0FBQztFQUFDZixvQkFBb0JBLENBQUNlLENBQUMsRUFBQztJQUFDZixvQkFBb0IsR0FBQ2UsQ0FBQztFQUFBLENBQUM7RUFBQ2QsaUJBQWlCQSxDQUFDYyxDQUFDLEVBQUM7SUFBQ2QsaUJBQWlCLEdBQUNjLENBQUM7RUFBQSxDQUFDO0VBQUNiLGdCQUFnQkEsQ0FBQ2EsQ0FBQyxFQUFDO0lBQUNiLGdCQUFnQixHQUFDYSxDQUFDO0VBQUEsQ0FBQztFQUFDWixjQUFjQSxDQUFDWSxDQUFDLEVBQUM7SUFBQ1osY0FBYyxHQUFDWSxDQUFDO0VBQUEsQ0FBQztFQUFDWCxpQkFBaUJBLENBQUNXLENBQUMsRUFBQztJQUFDWCxpQkFBaUIsR0FBQ1csQ0FBQztFQUFBLENBQUM7RUFBQ1YsYUFBYUEsQ0FBQ1UsQ0FBQyxFQUFDO0lBQUNWLGFBQWEsR0FBQ1UsQ0FBQztFQUFBLENBQUM7RUFBQ1QsT0FBT0EsQ0FBQ1MsQ0FBQyxFQUFDO0lBQUNULE9BQU8sR0FBQ1MsQ0FBQztFQUFBLENBQUM7RUFBQ1IsT0FBT0EsQ0FBQ1EsQ0FBQyxFQUFDO0lBQUNSLE9BQU8sR0FBQ1EsQ0FBQztFQUFBLENBQUM7RUFBQ1AsR0FBR0EsQ0FBQ08sQ0FBQyxFQUFDO0lBQUNQLEdBQUcsR0FBQ08sQ0FBQztFQUFBLENBQUM7RUFBQ04sT0FBT0EsQ0FBQ00sQ0FBQyxFQUFDO0lBQUNOLE9BQU8sR0FBQ00sQ0FBQztFQUFBLENBQUM7RUFBQ0wsbUJBQW1CQSxDQUFDSyxDQUFDLEVBQUM7SUFBQ0wsbUJBQW1CLEdBQUNLLENBQUM7RUFBQSxDQUFDO0VBQUNKLE9BQU9BLENBQUNJLENBQUMsRUFBQztJQUFDSixPQUFPLEdBQUNJLENBQUM7RUFBQSxDQUFDO0VBQUNILG9CQUFvQkEsQ0FBQ0csQ0FBQyxFQUFDO0lBQUNILG9CQUFvQixHQUFDRyxDQUFDO0VBQUEsQ0FBQztFQUFDRixpQkFBaUJBLENBQUNFLENBQUMsRUFBQztJQUFDRixpQkFBaUIsR0FBQ0UsQ0FBQztFQUFBO0FBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztBQUFDLElBQUlDLE9BQU8sRUFBQ0MsbUJBQW1CLEVBQUNDLGFBQWEsRUFBQ0MsYUFBYSxFQUFDQyxNQUFNLEVBQUNDLFFBQVEsRUFBQ0MsTUFBTTtBQUFDakMsTUFBTSxDQUFDeUIsSUFBSSxDQUFDLFlBQVksRUFBQztFQUFDRSxPQUFPQSxDQUFDRCxDQUFDLEVBQUM7SUFBQ0MsT0FBTyxHQUFDRCxDQUFDO0VBQUEsQ0FBQztFQUFDRSxtQkFBbUJBLENBQUNGLENBQUMsRUFBQztJQUFDRSxtQkFBbUIsR0FBQ0YsQ0FBQztFQUFBLENBQUM7RUFBQ0csYUFBYUEsQ0FBQ0gsQ0FBQyxFQUFDO0lBQUNHLGFBQWEsR0FBQ0gsQ0FBQztFQUFBLENBQUM7RUFBQ0ksYUFBYUEsQ0FBQ0osQ0FBQyxFQUFDO0lBQUNJLGFBQWEsR0FBQ0osQ0FBQztFQUFBLENBQUM7RUFBQ0ssTUFBTUEsQ0FBQ0wsQ0FBQyxFQUFDO0lBQUNLLE1BQU0sR0FBQ0wsQ0FBQztFQUFBLENBQUM7RUFBQ00sUUFBUUEsQ0FBQ04sQ0FBQyxFQUFDO0lBQUNNLFFBQVEsR0FBQ04sQ0FBQztFQUFBLENBQUM7RUFBQ08sTUFBTUEsQ0FBQ1AsQ0FBQyxFQUFDO0lBQUNPLE1BQU0sR0FBQ1AsQ0FBQztFQUFBO0FBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztBQXNDbjBDLE1BQU14QixJQUFJLEdBQUdnQyxNQUFNLENBQUNDLE1BQU0sQ0FBQ2hDLFFBQVEsRUFBRTtFQUMxQ0MsR0FBRztFQUNIQyxLQUFLO0VBQ0xDLE1BQU07RUFDTkMsU0FBUztFQUNUQyxZQUFZO0VBQ1pDLGFBQWE7RUFDYkMscUJBQXFCO0VBQ3JCQyxvQkFBb0I7RUFDcEJDLGlCQUFpQjtFQUNqQkMsZ0JBQWdCO0VBQ2hCQyxjQUFjO0VBQ2RDLGlCQUFpQjtFQUNqQkMsYUFBYTtFQUNiQyxPQUFPO0VBQ1BDLE9BQU87RUFDUEMsR0FBRztFQUNIQyxPQUFPO0VBQ1BDLG1CQUFtQjtFQUNuQkMsT0FBTztFQUNQQyxvQkFBb0I7RUFDcEJDLGlCQUFpQjtFQUNqQk8sTUFBTTtFQUNOQyxRQUFRO0VBQ1JDLE1BQU07RUFDTk4sT0FBTztFQUNQQyxtQkFBbUI7RUFDbkJDLGFBQWE7RUFDYkM7QUFDRixDQUFDLENBQUMsQzs7Ozs7Ozs7Ozs7QUNuRUY5QixNQUFNLENBQUNDLE1BQU0sQ0FBQztFQUFDRyxHQUFHLEVBQUNBLENBQUEsS0FBSUEsR0FBRztFQUFDQyxLQUFLLEVBQUNBLENBQUEsS0FBSUEsS0FBSztFQUFDRixRQUFRLEVBQUNBLENBQUEsS0FBSUEsUUFBUTtFQUFDRyxNQUFNLEVBQUNBLENBQUEsS0FBSUEsTUFBTTtFQUFDQyxTQUFTLEVBQUNBLENBQUEsS0FBSUEsU0FBUztFQUFDQyxZQUFZLEVBQUNBLENBQUEsS0FBSUEsWUFBWTtFQUFDQyxhQUFhLEVBQUNBLENBQUEsS0FBSUEsYUFBYTtFQUFDQyxxQkFBcUIsRUFBQ0EsQ0FBQSxLQUFJQSxxQkFBcUI7RUFBQ0Msb0JBQW9CLEVBQUNBLENBQUEsS0FBSUEsb0JBQW9CO0VBQUNDLGlCQUFpQixFQUFDQSxDQUFBLEtBQUlBLGlCQUFpQjtFQUFDQyxnQkFBZ0IsRUFBQ0EsQ0FBQSxLQUFJQSxnQkFBZ0I7RUFBQ0MsY0FBYyxFQUFDQSxDQUFBLEtBQUlBLGNBQWM7RUFBQ0MsaUJBQWlCLEVBQUNBLENBQUEsS0FBSUEsaUJBQWlCO0VBQUNDLGFBQWEsRUFBQ0EsQ0FBQSxLQUFJQSxhQUFhO0VBQUNDLE9BQU8sRUFBQ0EsQ0FBQSxLQUFJQSxPQUFPO0VBQUNDLE9BQU8sRUFBQ0EsQ0FBQSxLQUFJQSxPQUFPO0VBQUNDLEdBQUcsRUFBQ0EsQ0FBQSxLQUFJQSxHQUFHO0VBQUNDLE9BQU8sRUFBQ0EsQ0FBQSxLQUFJQSxPQUFPO0VBQUNDLG1CQUFtQixFQUFDQSxDQUFBLEtBQUlBLG1CQUFtQjtFQUFDQyxPQUFPLEVBQUNBLENBQUEsS0FBSUEsT0FBTztFQUFDQyxvQkFBb0IsRUFBQ0EsQ0FBQSxLQUFJQSxvQkFBb0I7RUFBQ0MsaUJBQWlCLEVBQUNBLENBQUEsS0FBSUE7QUFBaUIsQ0FBQyxDQUFDO0FBQ3ZwQixNQUFNcEIsR0FBRyxHQUFHLFNBQUFBLENBQUEsRUFBWSxDQUFDLENBQUM7QUFDakNBLEdBQUcsQ0FBQ2dDLFNBQVMsQ0FBQ0MsT0FBTyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBQzVCakMsR0FBRyxDQUFDZ0MsU0FBUyxDQUFDRSxLQUFLLEdBQUcsSUFBSTtBQUMxQmxDLEdBQUcsQ0FBQ2dDLFNBQVMsQ0FBQ0csUUFBUSxHQUFHTCxNQUFNLENBQUNNLE1BQU0sR0FBR04sTUFBTSxDQUFDTSxNQUFNLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRTtBQUMvRHBDLEdBQUcsQ0FBQ2dDLFNBQVMsQ0FBQ0ssVUFBVSxHQUFHckMsR0FBRyxDQUFDcUMsVUFBVSxHQUFHLENBQUMsS0FBSyxDQUFDOztBQUVuRDtBQUNBLElBQUlDLGtCQUFrQixHQUFHLFNBQUFBLENBQVVMLE9BQU8sRUFBRTtFQUMxQztFQUNBLElBQUlNLE9BQU8sR0FBRyxTQUFBQSxDQUFBLEVBQW1CO0lBQy9CO0lBQ0E7SUFDQTtJQUNBLElBQUlDLFFBQVEsR0FBSSxJQUFJLFlBQVl4QyxHQUFHLEdBQUksSUFBSSxHQUFHLElBQUl1QyxPQUFPLENBQUQsQ0FBQztJQUV6RCxJQUFJRSxDQUFDLEdBQUcsQ0FBQztJQUFDLFNBQUFDLElBQUEsR0FBQUMsU0FBQSxDQUFBQyxNQUFBLEVBTmVDLElBQUksT0FBQUMsS0FBQSxDQUFBSixJQUFBLEdBQUFLLElBQUEsTUFBQUEsSUFBQSxHQUFBTCxJQUFBLEVBQUFLLElBQUE7TUFBSkYsSUFBSSxDQUFBRSxJQUFBLElBQUFKLFNBQUEsQ0FBQUksSUFBQTtJQUFBO0lBTzdCLElBQUliLEtBQUssR0FBR1csSUFBSSxDQUFDRCxNQUFNLElBQUlDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDbEMsSUFBSVgsS0FBSyxJQUFLLE9BQU9BLEtBQUssS0FBSyxRQUFTLEVBQUU7TUFDeEM7TUFDQSxJQUFJLENBQUVqQixtQkFBbUIsQ0FBQ2lCLEtBQUssQ0FBQyxFQUFFO1FBQ2hDTSxRQUFRLENBQUNOLEtBQUssR0FBR0EsS0FBSztRQUN0Qk8sQ0FBQyxFQUFFO01BQ0wsQ0FBQyxNQUFNLElBQUlQLEtBQUssWUFBWWpDLEtBQUssRUFBRTtRQUNqQyxJQUFJK0MsS0FBSyxHQUFHZCxLQUFLLENBQUNlLEtBQUs7UUFDdkIsSUFBSUQsS0FBSyxDQUFDSixNQUFNLEtBQUssQ0FBQyxFQUFFO1VBQ3RCSixRQUFRLENBQUNOLEtBQUssR0FBR2MsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUMzQixDQUFDLE1BQU0sSUFBSUEsS0FBSyxDQUFDSixNQUFNLEdBQUcsQ0FBQyxFQUFFO1VBQzNCSixRQUFRLENBQUNOLEtBQUssR0FBR2MsS0FBSztRQUN4QjtRQUNBUCxDQUFDLEVBQUU7TUFDTDtJQUNGOztJQUdBO0lBQ0E7SUFDQTtJQUNBO0lBQ0EsSUFBSUEsQ0FBQyxHQUFHSSxJQUFJLENBQUNELE1BQU0sRUFDakJKLFFBQVEsQ0FBQ0wsUUFBUSxHQUFHVSxJQUFJLENBQUNLLEtBQUssQ0FBQ1QsQ0FBQyxDQUFDO0lBRW5DLE9BQU9ELFFBQVE7RUFDakIsQ0FBQztFQUNERCxPQUFPLENBQUNQLFNBQVMsR0FBRyxJQUFJaEMsR0FBRyxDQUFELENBQUM7RUFDM0J1QyxPQUFPLENBQUNQLFNBQVMsQ0FBQ21CLFdBQVcsR0FBR1osT0FBTztFQUN2Q0EsT0FBTyxDQUFDUCxTQUFTLENBQUNDLE9BQU8sR0FBR0EsT0FBTztFQUVuQyxPQUFPTSxPQUFPO0FBQ2hCLENBQUM7O0FBRUQ7QUFDQTtBQUNPLFNBQVN0QyxLQUFLQSxDQUFBLEVBQVU7RUFDN0I7RUFDQTtFQUNBO0VBQ0EsSUFBSXVDLFFBQVEsR0FBSSxJQUFJLFlBQVl2QyxLQUFLLEdBQUksSUFBSSxHQUFHLElBQUlBLEtBQUssQ0FBRCxDQUFDO0VBQUMsU0FBQW1ELEtBQUEsR0FBQVQsU0FBQSxDQUFBQyxNQUFBLEVBSm5DQyxJQUFJLE9BQUFDLEtBQUEsQ0FBQU0sS0FBQSxHQUFBQyxLQUFBLE1BQUFBLEtBQUEsR0FBQUQsS0FBQSxFQUFBQyxLQUFBO0lBQUpSLElBQUksQ0FBQVEsS0FBQSxJQUFBVixTQUFBLENBQUFVLEtBQUE7RUFBQTtFQU0zQmIsUUFBUSxDQUFDUyxLQUFLLEdBQUdKLElBQUk7RUFFckIsT0FBT0wsUUFBUTtBQUNqQjtBQUdPLE1BQU16QyxRQUFRLEdBQUcsQ0FBQyxDQUFDO0FBRW5CLFNBQVNHLE1BQU1BLENBQUUrQixPQUFPLEVBQUU7RUFDL0IsSUFBSXFCLFVBQVUsR0FBR2pELGFBQWEsQ0FBQzRCLE9BQU8sQ0FBQztFQUN2QyxJQUFJcUIsVUFBVSxLQUFLckIsT0FBTztJQUFFO0lBQzFCLE1BQU0sSUFBSXNCLEtBQUssQ0FBQywwQ0FBMEMsR0FBR3RCLE9BQU8sR0FBRyxRQUFRLENBQUM7RUFFbEYsSUFBSSxDQUFFbEMsUUFBUSxDQUFDdUQsVUFBVSxDQUFDLEVBQ3hCdkQsUUFBUSxDQUFDdUQsVUFBVSxDQUFDLEdBQUdoQixrQkFBa0IsQ0FBQ0wsT0FBTyxDQUFDO0VBRXBELE9BQU9sQyxRQUFRLENBQUN1RCxVQUFVLENBQUM7QUFDN0I7QUFFTyxTQUFTbkQsU0FBU0EsQ0FBQzhCLE9BQU8sRUFBRTtFQUNqQy9CLE1BQU0sQ0FBQytCLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDbkI7QUFFTyxTQUFTN0IsWUFBWUEsQ0FBRTZCLE9BQU8sRUFBRTtFQUNyQyxPQUFPdkIsY0FBYyxDQUFDdUIsT0FBTyxDQUFDO0FBQ2hDO0FBRU8sU0FBUzVCLGFBQWFBLENBQUU0QixPQUFPLEVBQUU7RUFDdEM7RUFDQSxPQUFPQSxPQUFPLENBQUN1QixXQUFXLENBQUMsQ0FBQyxDQUFDQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQztBQUNqRDtBQUVPLE1BQU1uRCxxQkFBcUIsR0FBRyxrckJBQWtyQixDQUFDb0QsS0FBSyxDQUFDLEdBQUcsQ0FBQztBQUczdEIsTUFBTW5ELG9CQUFvQixHQUFHLHN1QkFBc3VCLENBQUNtRCxLQUFLLENBQUMsR0FBRyxDQUFDO0FBRTl3QixNQUFNbEQsaUJBQWlCLEdBQUdGLHFCQUFxQixDQUFDcUQsTUFBTSxDQUFDcEQsb0JBQW9CLENBQUM7QUFFNUUsTUFBTUUsZ0JBQWdCLEdBQUcscUZBQXFGLENBQUNpRCxLQUFLLENBQUMsR0FBRyxDQUFDO0FBR2hJLElBQUlFLGNBQWMsR0FBRyxJQUFJQyxHQUFHLENBQUNwRCxnQkFBZ0IsQ0FBQztBQUM5QyxJQUFJcUQsZUFBZSxHQUFHLElBQUlELEdBQUcsQ0FBQ3JELGlCQUFpQixDQUFDO0FBQ2hELElBQUl1RCxrQkFBa0IsR0FBRyxJQUFJRixHQUFHLENBQUN0RCxvQkFBb0IsQ0FBQztBQUUvQyxTQUFTRyxjQUFjQSxDQUFDdUIsT0FBTyxFQUFFO0VBQ3RDLE9BQU82QixlQUFlLENBQUNFLEdBQUcsQ0FBQy9CLE9BQU8sQ0FBQztBQUNyQztBQUVPLFNBQVN0QixpQkFBaUJBLENBQUNzQixPQUFPLEVBQUU7RUFDekMsT0FBTzhCLGtCQUFrQixDQUFDQyxHQUFHLENBQUMvQixPQUFPLENBQUM7QUFDeEM7QUFFTyxTQUFTckIsYUFBYUEsQ0FBQ3FCLE9BQU8sRUFBRTtFQUNyQyxPQUFPMkIsY0FBYyxDQUFDSSxHQUFHLENBQUMvQixPQUFPLENBQUM7QUFDcEM7QUFHQTtBQUNBekIsaUJBQWlCLENBQUN5RCxPQUFPLENBQUM5RCxTQUFTLENBQUM7QUFHN0IsU0FBU1UsT0FBT0EsQ0FBQ3FCLEtBQUssRUFBRTtFQUM3QixJQUFJLEVBQUcsSUFBSSxZQUFZckIsT0FBTyxDQUFDO0lBQzdCO0lBQ0EsT0FBTyxJQUFJQSxPQUFPLENBQUNxQixLQUFLLENBQUM7RUFFM0IsSUFBSSxFQUFHQSxLQUFLLElBQUlBLEtBQUssQ0FBQ2dDLElBQUksSUFBSWhDLEtBQUssQ0FBQ2lDLEdBQUcsQ0FBQyxFQUN0QyxNQUFNLElBQUlaLEtBQUssQ0FDYiw2REFBNkQsQ0FBQztFQUVsRSxJQUFJLENBQUNXLElBQUksR0FBR2hDLEtBQUssQ0FBQ2dDLElBQUk7RUFDdEIsSUFBSSxDQUFDQyxHQUFHLEdBQUdqQyxLQUFLLENBQUNpQyxHQUFHO0FBQ3RCO0FBQ0F0RCxPQUFPLENBQUNtQixTQUFTLENBQUNLLFVBQVUsR0FBR3hCLE9BQU8sQ0FBQ3dCLFVBQVUsR0FBRyxDQUFDLFNBQVMsQ0FBQztBQUV4RCxTQUFTdkIsT0FBT0EsQ0FBQ21DLEtBQUssRUFBRTtFQUM3QixJQUFJLEVBQUcsSUFBSSxZQUFZbkMsT0FBTyxDQUFDO0lBQzdCO0lBQ0EsT0FBTyxJQUFJQSxPQUFPLENBQUNtQyxLQUFLLENBQUM7RUFFM0IsSUFBSSxPQUFPQSxLQUFLLEtBQUssUUFBUSxFQUMzQixNQUFNLElBQUlNLEtBQUssQ0FBQyxnREFBZ0QsQ0FBQztFQUVuRSxJQUFJLENBQUNOLEtBQUssR0FBR0EsS0FBSztFQUNsQjtFQUNBLElBQUksQ0FBQ21CLGNBQWMsR0FBR25CLEtBQUssQ0FBQ1EsT0FBTyxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUM7QUFDdkQ7QUFDQTNDLE9BQU8sQ0FBQ2tCLFNBQVMsQ0FBQ0ssVUFBVSxHQUFHdkIsT0FBTyxDQUFDdUIsVUFBVSxHQUFHLENBQUMsU0FBUyxDQUFDO0FBRXhELFNBQVN0QixHQUFHQSxDQUFDa0MsS0FBSyxFQUFFO0VBQ3pCLElBQUksRUFBRyxJQUFJLFlBQVlsQyxHQUFHLENBQUM7SUFDekI7SUFDQSxPQUFPLElBQUlBLEdBQUcsQ0FBQ2tDLEtBQUssQ0FBQztFQUV2QixJQUFJLE9BQU9BLEtBQUssS0FBSyxRQUFRLEVBQzNCLE1BQU0sSUFBSU0sS0FBSyxDQUFDLDRDQUE0QyxDQUFDO0VBRS9ELElBQUksQ0FBQ04sS0FBSyxHQUFHQSxLQUFLO0FBQ3BCO0FBQ0FsQyxHQUFHLENBQUNpQixTQUFTLENBQUNLLFVBQVUsR0FBR3RCLEdBQUcsQ0FBQ3NCLFVBQVUsR0FBRyxDQUFDLEtBQUssQ0FBQztBQUc1QyxTQUFTckIsT0FBT0EsQ0FBRXFELENBQUMsRUFBRTtFQUMxQixPQUFPQSxDQUFDLFlBQVl2QixLQUFLLElBQUlBLEtBQUssQ0FBQzlCLE9BQU8sQ0FBQ3FELENBQUMsQ0FBQztBQUMvQztBQUVPLFNBQVNwRCxtQkFBbUJBLENBQUVvRCxDQUFDLEVBQUU7RUFDdEM7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQSxJQUFHLENBQUNBLENBQUMsSUFBSyxPQUFPQSxDQUFDLEtBQUssUUFBUyxFQUFFLE9BQU8sS0FBSztFQUM5QztFQUNBLElBQUlDLEtBQUssR0FBRyxLQUFLO0VBQ2pCLElBQUd4QyxNQUFNLENBQUN5QyxjQUFjLENBQUNGLENBQUMsQ0FBQyxLQUFLLElBQUksRUFBRTtJQUNwQ0MsS0FBSyxHQUFHLElBQUk7RUFDZCxDQUFDLE1BQU07SUFDTCxJQUFJRSxLQUFLLEdBQUdILENBQUM7SUFDYixPQUFNdkMsTUFBTSxDQUFDeUMsY0FBYyxDQUFDQyxLQUFLLENBQUMsS0FBSyxJQUFJLEVBQUU7TUFDM0NBLEtBQUssR0FBRzFDLE1BQU0sQ0FBQ3lDLGNBQWMsQ0FBQ0MsS0FBSyxDQUFDO0lBQ3RDO0lBQ0FGLEtBQUssR0FBR3hDLE1BQU0sQ0FBQ3lDLGNBQWMsQ0FBQ0YsQ0FBQyxDQUFDLEtBQUtHLEtBQUs7RUFDNUM7RUFFQSxPQUFPLENBQUNGLEtBQUssSUFDVixPQUFPRCxDQUFDLENBQUNsQixXQUFXLEtBQUssVUFBVyxJQUNwQ2tCLENBQUMsWUFBWUEsQ0FBQyxDQUFDbEIsV0FBWTtBQUNoQztBQUVPLFNBQVNqQyxPQUFPQSxDQUFFdUQsSUFBSSxFQUFFO0VBQzdCLElBQUlBLElBQUksSUFBSSxJQUFJO0lBQ2Q7SUFDQSxPQUFPLElBQUk7RUFFYixJQUFJekQsT0FBTyxDQUFDeUQsSUFBSSxDQUFDLEVBQUU7SUFDakI7SUFDQSxLQUFLLElBQUloQyxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUdnQyxJQUFJLENBQUM3QixNQUFNLEVBQUVILENBQUMsRUFBRSxFQUNsQyxJQUFJLENBQUV2QixPQUFPLENBQUN1RCxJQUFJLENBQUNoQyxDQUFDLENBQUMsQ0FBQyxFQUNwQixPQUFPLEtBQUs7SUFDaEIsT0FBTyxJQUFJO0VBQ2I7RUFFQSxPQUFPLEtBQUs7QUFDZDtBQUVPLFNBQVN0QixvQkFBb0JBLENBQUV1RCxJQUFJLEVBQUU7RUFDMUMsT0FBTyw4QkFBOEIsQ0FBQ0MsSUFBSSxDQUFDRCxJQUFJLENBQUM7QUFDbEQ7QUFJTyxTQUFTdEQsaUJBQWlCQSxDQUFFYyxLQUFLLEVBQUU7RUFDeEMsSUFBSSxDQUFFQSxLQUFLLEVBQ1QsT0FBT0EsS0FBSztFQUVkLElBQUkwQyxNQUFNLEdBQUc1RCxPQUFPLENBQUNrQixLQUFLLENBQUM7RUFDM0IsSUFBSTBDLE1BQU0sSUFBSTFDLEtBQUssQ0FBQ1UsTUFBTSxLQUFLLENBQUMsRUFDOUIsT0FBTyxJQUFJO0VBRWIsSUFBSWlDLE1BQU0sR0FBRyxDQUFDLENBQUM7RUFDZixLQUFLLElBQUlwQyxDQUFDLEdBQUcsQ0FBQyxFQUFFcUMsQ0FBQyxHQUFJRixNQUFNLEdBQUcxQyxLQUFLLENBQUNVLE1BQU0sR0FBRyxDQUFFLEVBQUVILENBQUMsR0FBR3FDLENBQUMsRUFBRXJDLENBQUMsRUFBRSxFQUFFO0lBQzNELElBQUlzQyxRQUFRLEdBQUlILE1BQU0sR0FBRzFDLEtBQUssQ0FBQ08sQ0FBQyxDQUFDLEdBQUdQLEtBQU07SUFDMUMsSUFBSyxPQUFPNkMsUUFBUSxLQUFLLFFBQVEsSUFDN0I5RCxtQkFBbUIsQ0FBQzhELFFBQVEsQ0FBQyxFQUMvQixNQUFNLElBQUl4QixLQUFLLENBQUMsNENBQTRDLEdBQUd3QixRQUFRLENBQUM7SUFDMUUsS0FBSyxJQUFJTCxJQUFJLElBQUlLLFFBQVEsRUFBRTtNQUN6QixJQUFJLENBQUU1RCxvQkFBb0IsQ0FBQ3VELElBQUksQ0FBQyxFQUM5QixNQUFNLElBQUluQixLQUFLLENBQUMsK0JBQStCLEdBQUdtQixJQUFJLENBQUM7TUFDekQsSUFBSXpCLEtBQUssR0FBRzhCLFFBQVEsQ0FBQ0wsSUFBSSxDQUFDO01BQzFCLElBQUksQ0FBRXhELE9BQU8sQ0FBQytCLEtBQUssQ0FBQyxFQUNsQjRCLE1BQU0sQ0FBQ0gsSUFBSSxDQUFDLEdBQUd6QixLQUFLO0lBQ3hCO0VBQ0Y7RUFFQSxPQUFPNEIsTUFBTTtBQUNmLEM7Ozs7Ozs7Ozs7O0FDL09BakYsTUFBTSxDQUFDQyxNQUFNLENBQUM7RUFBQzBCLE9BQU8sRUFBQ0EsQ0FBQSxLQUFJQSxPQUFPO0VBQUNDLG1CQUFtQixFQUFDQSxDQUFBLEtBQUlBLG1CQUFtQjtFQUFDRSxhQUFhLEVBQUNBLENBQUEsS0FBSUEsYUFBYTtFQUFDRCxhQUFhLEVBQUNBLENBQUEsS0FBSUEsYUFBYTtFQUFDRSxNQUFNLEVBQUNBLENBQUEsS0FBSUEsTUFBTTtFQUFDQyxRQUFRLEVBQUNBLENBQUEsS0FBSUEsUUFBUTtFQUFDQyxNQUFNLEVBQUNBLENBQUEsS0FBSUE7QUFBTSxDQUFDLENBQUM7QUFBQyxJQUFJN0IsR0FBRyxFQUFDYSxPQUFPLEVBQUNDLE9BQU8sRUFBQ0MsR0FBRyxFQUFDQyxPQUFPLEVBQUNkLE1BQU0sRUFBQ2UsbUJBQW1CLEVBQUNHLGlCQUFpQixFQUFDUixhQUFhO0FBQUNoQixNQUFNLENBQUN5QixJQUFJLENBQUMsUUFBUSxFQUFDO0VBQUNyQixHQUFHQSxDQUFDc0IsQ0FBQyxFQUFDO0lBQUN0QixHQUFHLEdBQUNzQixDQUFDO0VBQUEsQ0FBQztFQUFDVCxPQUFPQSxDQUFDUyxDQUFDLEVBQUM7SUFBQ1QsT0FBTyxHQUFDUyxDQUFDO0VBQUEsQ0FBQztFQUFDUixPQUFPQSxDQUFDUSxDQUFDLEVBQUM7SUFBQ1IsT0FBTyxHQUFDUSxDQUFDO0VBQUEsQ0FBQztFQUFDUCxHQUFHQSxDQUFDTyxDQUFDLEVBQUM7SUFBQ1AsR0FBRyxHQUFDTyxDQUFDO0VBQUEsQ0FBQztFQUFDTixPQUFPQSxDQUFDTSxDQUFDLEVBQUM7SUFBQ04sT0FBTyxHQUFDTSxDQUFDO0VBQUEsQ0FBQztFQUFDcEIsTUFBTUEsQ0FBQ29CLENBQUMsRUFBQztJQUFDcEIsTUFBTSxHQUFDb0IsQ0FBQztFQUFBLENBQUM7RUFBQ0wsbUJBQW1CQSxDQUFDSyxDQUFDLEVBQUM7SUFBQ0wsbUJBQW1CLEdBQUNLLENBQUM7RUFBQSxDQUFDO0VBQUNGLGlCQUFpQkEsQ0FBQ0UsQ0FBQyxFQUFDO0lBQUNGLGlCQUFpQixHQUFDRSxDQUFDO0VBQUEsQ0FBQztFQUFDVixhQUFhQSxDQUFDVSxDQUFDLEVBQUM7SUFBQ1YsYUFBYSxHQUFDVSxDQUFDO0VBQUE7QUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0FBYS9pQixJQUFJMEQsUUFBUSxHQUFHLFNBQUFBLENBQVVYLENBQUMsRUFBRTtFQUFFLE9BQU9BLENBQUM7QUFBRSxDQUFDOztBQUV6QztBQUNBO0FBQ0E7QUFDQSxJQUFJWSxlQUFlLEdBQUduRCxNQUFNLENBQUNFLFNBQVMsQ0FBQ2tELGNBQWM7QUFDckQsSUFBSUMsT0FBTyxHQUFHLFNBQUFBLENBQVVDLEdBQUcsRUFBRUMsR0FBRyxFQUFFO0VBQ2hDLEtBQUssSUFBSUMsQ0FBQyxJQUFJRCxHQUFHLEVBQUU7SUFDakIsSUFBSUosZUFBZSxDQUFDTSxJQUFJLENBQUNGLEdBQUcsRUFBRUMsQ0FBQyxDQUFDLEVBQzlCRixHQUFHLENBQUNFLENBQUMsQ0FBQyxHQUFHRCxHQUFHLENBQUNDLENBQUMsQ0FBQztFQUNuQjtFQUNBLE9BQU9GLEdBQUc7QUFDWixDQUFDO0FBRU0sTUFBTTdELE9BQU8sR0FBRyxTQUFBQSxDQUFVaUUsS0FBSyxFQUFFO0VBQ3RDTCxPQUFPLENBQUMsSUFBSSxFQUFFSyxLQUFLLENBQUM7QUFDdEIsQ0FBQztBQUVEakUsT0FBTyxDQUFDa0UsR0FBRyxHQUFHLFVBQVVDLE9BQU8sRUFBRTtFQUMvQlAsT0FBTyxDQUFDLElBQUksQ0FBQ25ELFNBQVMsRUFBRTBELE9BQU8sQ0FBQztBQUNsQyxDQUFDO0FBRURuRSxPQUFPLENBQUNvRSxNQUFNLEdBQUcsVUFBVUQsT0FBTyxFQUFFO0VBQ2xDLElBQUlFLE9BQU8sR0FBRyxJQUFJO0VBQ2xCLElBQUlDLE9BQU8sR0FBRyxTQUFTQyxrQkFBa0JBLENBQUEsQ0FBQztFQUFBLEVBQWU7SUFDdkR2RSxPQUFPLENBQUN3RSxLQUFLLENBQUMsSUFBSSxFQUFFcEQsU0FBUyxDQUFDO0VBQ2hDLENBQUM7RUFDRGtELE9BQU8sQ0FBQzdELFNBQVMsR0FBRyxJQUFJNEQsT0FBTyxDQUFELENBQUM7RUFDL0JDLE9BQU8sQ0FBQ0YsTUFBTSxHQUFHQyxPQUFPLENBQUNELE1BQU07RUFDL0JFLE9BQU8sQ0FBQ0osR0FBRyxHQUFHRyxPQUFPLENBQUNILEdBQUc7RUFDekIsSUFBSUMsT0FBTyxFQUNUUCxPQUFPLENBQUNVLE9BQU8sQ0FBQzdELFNBQVMsRUFBRTBELE9BQU8sQ0FBQztFQUNyQyxPQUFPRyxPQUFPO0FBQ2hCLENBQUM7QUFFRHRFLE9BQU8sQ0FBQ2tFLEdBQUcsQ0FBQztFQUNWTyxLQUFLLEVBQUUsU0FBQUEsQ0FBVUMsT0FBTyxZQUFXO0lBQ2pDLElBQUlBLE9BQU8sSUFBSSxJQUFJO01BQ2pCO01BQ0EsT0FBTyxJQUFJLENBQUNDLFNBQVMsQ0FBQ0gsS0FBSyxDQUFDLElBQUksRUFBRXBELFNBQVMsQ0FBQztJQUU5QyxJQUFJLE9BQU9zRCxPQUFPLEtBQUssUUFBUSxFQUFFO01BQy9CLElBQUlBLE9BQU8sQ0FBQzVELFVBQVUsRUFBRTtRQUN0QixRQUFRNEQsT0FBTyxDQUFDNUQsVUFBVTtVQUMxQixLQUFLckMsR0FBRyxDQUFDcUMsVUFBVTtZQUNqQixPQUFPLElBQUksQ0FBQzhELFFBQVEsQ0FBQ0osS0FBSyxDQUFDLElBQUksRUFBRXBELFNBQVMsQ0FBQztVQUM3QyxLQUFLOUIsT0FBTyxDQUFDd0IsVUFBVTtZQUNyQixPQUFPLElBQUksQ0FBQytELFlBQVksQ0FBQ0wsS0FBSyxDQUFDLElBQUksRUFBRXBELFNBQVMsQ0FBQztVQUNqRCxLQUFLN0IsT0FBTyxDQUFDdUIsVUFBVTtZQUNyQixPQUFPLElBQUksQ0FBQ2dFLFlBQVksQ0FBQ04sS0FBSyxDQUFDLElBQUksRUFBRXBELFNBQVMsQ0FBQztVQUNqRCxLQUFLNUIsR0FBRyxDQUFDc0IsVUFBVTtZQUNqQixPQUFPLElBQUksQ0FBQ2lFLFFBQVEsQ0FBQ1AsS0FBSyxDQUFDLElBQUksRUFBRXBELFNBQVMsQ0FBQztVQUM3QztZQUNFLE1BQU0sSUFBSVksS0FBSyxDQUFDLHVCQUF1QixHQUFHMEMsT0FBTyxDQUFDNUQsVUFBVSxDQUFDO1FBQy9EO01BQ0Y7TUFFQSxJQUFJckIsT0FBTyxDQUFDaUYsT0FBTyxDQUFDLEVBQ2xCLE9BQU8sSUFBSSxDQUFDTSxVQUFVLENBQUNSLEtBQUssQ0FBQyxJQUFJLEVBQUVwRCxTQUFTLENBQUM7TUFFL0MsT0FBTyxJQUFJLENBQUM2RCxXQUFXLENBQUNULEtBQUssQ0FBQyxJQUFJLEVBQUVwRCxTQUFTLENBQUM7SUFFaEQsQ0FBQyxNQUFNLElBQUssT0FBT3NELE9BQU8sS0FBSyxRQUFRLElBQzNCLE9BQU9BLE9BQU8sS0FBSyxTQUFVLElBQzdCLE9BQU9BLE9BQU8sS0FBSyxRQUFTLEVBQUU7TUFDeEMsT0FBTyxJQUFJLENBQUNRLGNBQWMsQ0FBQ1YsS0FBSyxDQUFDLElBQUksRUFBRXBELFNBQVMsQ0FBQztJQUVuRCxDQUFDLE1BQU0sSUFBSSxPQUFPc0QsT0FBTyxLQUFLLFVBQVUsRUFBRTtNQUN4QyxPQUFPLElBQUksQ0FBQ1MsYUFBYSxDQUFDWCxLQUFLLENBQUMsSUFBSSxFQUFFcEQsU0FBUyxDQUFDO0lBQ2xEO0lBRUEsTUFBTSxJQUFJWSxLQUFLLENBQUMsK0JBQStCLEdBQUcwQyxPQUFPLENBQUM7RUFFNUQsQ0FBQztFQUNEQyxTQUFTLEVBQUUsU0FBQUEsQ0FBVVMsZUFBZSxZQUFXLENBQUMsQ0FBQztFQUNqREYsY0FBYyxFQUFFLFNBQUFBLENBQVVHLHFCQUFxQixZQUFXLENBQUMsQ0FBQztFQUM1REwsVUFBVSxFQUFFLFNBQUFBLENBQVV2RCxLQUFLLFlBQVcsQ0FBQyxDQUFDO0VBQ3hDcUQsWUFBWSxFQUFFLFNBQUFBLENBQVVRLE9BQU8sWUFBVyxDQUFDLENBQUM7RUFDNUNULFlBQVksRUFBRSxTQUFBQSxDQUFVVSxPQUFPLFlBQVcsQ0FBQyxDQUFDO0VBQzVDUixRQUFRLEVBQUUsU0FBQUEsQ0FBVVMsR0FBRyxZQUFXLENBQUMsQ0FBQztFQUNwQ1osUUFBUSxFQUFFLFNBQUFBLENBQVVhLEdBQUcsWUFBVyxDQUFDLENBQUM7RUFDcENSLFdBQVcsRUFBRSxTQUFBQSxDQUFVUyxHQUFHLFlBQVc7SUFDbkMsTUFBTSxJQUFJMUQsS0FBSyxDQUFDLCtCQUErQixHQUFHMEQsR0FBRyxDQUFDO0VBQ3hELENBQUM7RUFDRFAsYUFBYSxFQUFFLFNBQUFBLENBQVVRLEVBQUUsWUFBVztJQUNwQyxNQUFNLElBQUkzRCxLQUFLLENBQUMsaUNBQWlDLEdBQUcyRCxFQUFFLENBQUM7RUFDekQ7QUFDRixDQUFDLENBQUM7QUFFSyxNQUFNMUYsbUJBQW1CLEdBQUdELE9BQU8sQ0FBQ29FLE1BQU0sQ0FBQyxDQUFDO0FBQ25EbkUsbUJBQW1CLENBQUNpRSxHQUFHLENBQUM7RUFDdEJTLFNBQVMsRUFBRWxCLFFBQVE7RUFDbkJ5QixjQUFjLEVBQUV6QixRQUFRO0VBQ3hCdUIsVUFBVSxFQUFFLFNBQUFBLENBQVV2RCxLQUFLLEVBQVc7SUFDcEMsSUFBSTZCLE1BQU0sR0FBRzdCLEtBQUs7SUFBQyxTQUFBTixJQUFBLEdBQUFDLFNBQUEsQ0FBQUMsTUFBQSxFQURXQyxJQUFJLE9BQUFDLEtBQUEsQ0FBQUosSUFBQSxPQUFBQSxJQUFBLFdBQUFLLElBQUEsTUFBQUEsSUFBQSxHQUFBTCxJQUFBLEVBQUFLLElBQUE7TUFBSkYsSUFBSSxDQUFBRSxJQUFBLFFBQUFKLFNBQUEsQ0FBQUksSUFBQTtJQUFBO0lBRWxDLEtBQUssSUFBSU4sQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHTyxLQUFLLENBQUNKLE1BQU0sRUFBRUgsQ0FBQyxFQUFFLEVBQUU7TUFDckMsSUFBSTBFLE9BQU8sR0FBR25FLEtBQUssQ0FBQ1AsQ0FBQyxDQUFDO01BQ3RCLElBQUkyRSxPQUFPLEdBQUcsSUFBSSxDQUFDcEIsS0FBSyxDQUFDbUIsT0FBTyxFQUFFLEdBQUd0RSxJQUFJLENBQUM7TUFDMUMsSUFBSXVFLE9BQU8sS0FBS0QsT0FBTyxFQUFFO1FBQ3ZCO1FBQ0EsSUFBSXRDLE1BQU0sS0FBSzdCLEtBQUssRUFDbEI2QixNQUFNLEdBQUc3QixLQUFLLENBQUNFLEtBQUssQ0FBQyxDQUFDO1FBQ3hCMkIsTUFBTSxDQUFDcEMsQ0FBQyxDQUFDLEdBQUcyRSxPQUFPO01BQ3JCO0lBQ0Y7SUFDQSxPQUFPdkMsTUFBTTtFQUNmLENBQUM7RUFDRHdCLFlBQVksRUFBRXJCLFFBQVE7RUFDdEJvQixZQUFZLEVBQUVwQixRQUFRO0VBQ3RCc0IsUUFBUSxFQUFFdEIsUUFBUTtFQUNsQndCLFdBQVcsRUFBRSxTQUFBQSxDQUFTUyxHQUFHLEVBQVU7SUFDakM7SUFDQSxJQUFJQSxHQUFHLENBQUNJLFFBQVEsSUFBSSxJQUFJLEVBQUM7TUFDdkIsT0FBT0osR0FBRztJQUNaO0lBQUMsU0FBQTdELEtBQUEsR0FBQVQsU0FBQSxDQUFBQyxNQUFBLEVBSjJCQyxJQUFJLE9BQUFDLEtBQUEsQ0FBQU0sS0FBQSxPQUFBQSxLQUFBLFdBQUFDLEtBQUEsTUFBQUEsS0FBQSxHQUFBRCxLQUFBLEVBQUFDLEtBQUE7TUFBSlIsSUFBSSxDQUFBUSxLQUFBLFFBQUFWLFNBQUEsQ0FBQVUsS0FBQTtJQUFBO0lBS2hDLElBQUksU0FBUyxJQUFJNEQsR0FBRyxFQUFFO01BQ3BCQSxHQUFHLENBQUNoQixPQUFPLEdBQUcsSUFBSSxDQUFDRCxLQUFLLENBQUNpQixHQUFHLENBQUNoQixPQUFPLEVBQUUsR0FBR3BELElBQUksQ0FBQztJQUNoRDtJQUNBLElBQUksYUFBYSxJQUFJb0UsR0FBRyxFQUFDO01BQ3ZCQSxHQUFHLENBQUNLLFdBQVcsR0FBRyxJQUFJLENBQUN0QixLQUFLLENBQUNpQixHQUFHLENBQUNLLFdBQVcsRUFBRSxHQUFHekUsSUFBSSxDQUFDO0lBQ3hEO0lBQ0EsT0FBT29FLEdBQUc7RUFDWixDQUFDO0VBQ0RQLGFBQWEsRUFBRTFCLFFBQVE7RUFDdkJtQixRQUFRLEVBQUUsU0FBQUEsQ0FBVWEsR0FBRyxFQUFXO0lBQ2hDLElBQUlPLFdBQVcsR0FBR1AsR0FBRyxDQUFDN0UsUUFBUTtJQUFDLFNBQUFxRixLQUFBLEdBQUE3RSxTQUFBLENBQUFDLE1BQUEsRUFETEMsSUFBSSxPQUFBQyxLQUFBLENBQUEwRSxLQUFBLE9BQUFBLEtBQUEsV0FBQUMsS0FBQSxNQUFBQSxLQUFBLEdBQUFELEtBQUEsRUFBQUMsS0FBQTtNQUFKNUUsSUFBSSxDQUFBNEUsS0FBQSxRQUFBOUUsU0FBQSxDQUFBOEUsS0FBQTtJQUFBO0lBRTlCLElBQUlDLFdBQVcsR0FBRyxJQUFJLENBQUNDLGFBQWEsQ0FBQ0osV0FBVyxFQUFFLEdBQUcxRSxJQUFJLENBQUM7SUFFMUQsSUFBSStFLFFBQVEsR0FBR1osR0FBRyxDQUFDOUUsS0FBSztJQUN4QixJQUFJMkYsUUFBUSxHQUFHLElBQUksQ0FBQ0MsZUFBZSxDQUFDRixRQUFRLEVBQUUsR0FBRy9FLElBQUksQ0FBQztJQUV0RCxJQUFJZ0YsUUFBUSxLQUFLRCxRQUFRLElBQUlGLFdBQVcsS0FBS0gsV0FBVyxFQUN0RCxPQUFPUCxHQUFHO0lBRVosSUFBSWUsTUFBTSxHQUFHN0gsTUFBTSxDQUFDOEcsR0FBRyxDQUFDL0UsT0FBTyxDQUFDLENBQUM4RCxLQUFLLENBQUMsSUFBSSxFQUFFMkIsV0FBVyxDQUFDO0lBQ3pESyxNQUFNLENBQUM3RixLQUFLLEdBQUcyRixRQUFRO0lBQ3ZCLE9BQU9FLE1BQU07RUFDZixDQUFDO0VBQ0RKLGFBQWEsRUFBRSxTQUFBQSxDQUFVeEYsUUFBUSxFQUFXO0lBQUEsU0FBQTZGLEtBQUEsR0FBQXJGLFNBQUEsQ0FBQUMsTUFBQSxFQUFOQyxJQUFJLE9BQUFDLEtBQUEsQ0FBQWtGLEtBQUEsT0FBQUEsS0FBQSxXQUFBQyxLQUFBLE1BQUFBLEtBQUEsR0FBQUQsS0FBQSxFQUFBQyxLQUFBO01BQUpwRixJQUFJLENBQUFvRixLQUFBLFFBQUF0RixTQUFBLENBQUFzRixLQUFBO0lBQUE7SUFDeEMsT0FBTyxJQUFJLENBQUMxQixVQUFVLENBQUNwRSxRQUFRLEVBQUUsR0FBR1UsSUFBSSxDQUFDO0VBQzNDLENBQUM7RUFDRDtFQUNBO0VBQ0E7RUFDQWlGLGVBQWUsRUFBRSxTQUFBQSxDQUFVNUYsS0FBSyxFQUFXO0lBQUEsU0FBQWdHLEtBQUEsR0FBQXZGLFNBQUEsQ0FBQUMsTUFBQSxFQUFOQyxJQUFJLE9BQUFDLEtBQUEsQ0FBQW9GLEtBQUEsT0FBQUEsS0FBQSxXQUFBQyxLQUFBLE1BQUFBLEtBQUEsR0FBQUQsS0FBQSxFQUFBQyxLQUFBO01BQUp0RixJQUFJLENBQUFzRixLQUFBLFFBQUF4RixTQUFBLENBQUF3RixLQUFBO0lBQUE7SUFDdkMsSUFBSW5ILE9BQU8sQ0FBQ2tCLEtBQUssQ0FBQyxFQUFFO01BQ2xCLElBQUkyQyxNQUFNLEdBQUczQyxLQUFLO01BQ2xCLEtBQUssSUFBSU8sQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHUCxLQUFLLENBQUNVLE1BQU0sRUFBRUgsQ0FBQyxFQUFFLEVBQUU7UUFDckMsSUFBSTBFLE9BQU8sR0FBR2pGLEtBQUssQ0FBQ08sQ0FBQyxDQUFDO1FBQ3RCLElBQUkyRSxPQUFPLEdBQUcsSUFBSSxDQUFDVSxlQUFlLENBQUNYLE9BQU8sRUFBRSxHQUFHdEUsSUFBSSxDQUFDO1FBQ3BELElBQUl1RSxPQUFPLEtBQUtELE9BQU8sRUFBRTtVQUN2QjtVQUNBLElBQUl0QyxNQUFNLEtBQUszQyxLQUFLLEVBQ2xCMkMsTUFBTSxHQUFHM0MsS0FBSyxDQUFDZ0IsS0FBSyxDQUFDLENBQUM7VUFDeEIyQixNQUFNLENBQUNwQyxDQUFDLENBQUMsR0FBRzJFLE9BQU87UUFDckI7TUFDRjtNQUNBLE9BQU92QyxNQUFNO0lBQ2Y7SUFFQSxJQUFJM0MsS0FBSyxJQUFJakIsbUJBQW1CLENBQUNpQixLQUFLLENBQUMsRUFBRTtNQUN2QyxNQUFNLElBQUlxQixLQUFLLENBQUMsaURBQWlELEdBQ2pELGtEQUFrRCxHQUNsRCxnQ0FBZ0MsQ0FBQztJQUNuRDtJQUVBLElBQUlxRSxRQUFRLEdBQUcxRixLQUFLO0lBQ3BCLElBQUkyRixRQUFRLEdBQUdELFFBQVE7SUFDdkIsSUFBSUEsUUFBUSxFQUFFO01BQ1osSUFBSVEsUUFBUSxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQztNQUMzQkEsUUFBUSxDQUFDQyxJQUFJLENBQUN0QyxLQUFLLENBQUNxQyxRQUFRLEVBQUV6RixTQUFTLENBQUM7TUFDeEMsS0FBSyxJQUFJMkMsQ0FBQyxJQUFJc0MsUUFBUSxFQUFFO1FBQ3RCLElBQUlVLFFBQVEsR0FBR1YsUUFBUSxDQUFDdEMsQ0FBQyxDQUFDO1FBQzFCOEMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHOUMsQ0FBQztRQUNmOEMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHRSxRQUFRO1FBQ3RCLElBQUlDLFFBQVEsR0FBRyxJQUFJLENBQUNDLGNBQWMsQ0FBQ3pDLEtBQUssQ0FBQyxJQUFJLEVBQUVxQyxRQUFRLENBQUM7UUFDeEQsSUFBSUcsUUFBUSxLQUFLRCxRQUFRLEVBQUU7VUFDekI7VUFDQSxJQUFJVCxRQUFRLEtBQUtELFFBQVEsRUFDdkJDLFFBQVEsR0FBRzFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRXlDLFFBQVEsQ0FBQztVQUNsQ0MsUUFBUSxDQUFDdkMsQ0FBQyxDQUFDLEdBQUdpRCxRQUFRO1FBQ3hCO01BQ0Y7SUFDRjtJQUVBLE9BQU9WLFFBQVE7RUFDakIsQ0FBQztFQUNEO0VBQ0E7RUFDQVcsY0FBYyxFQUFFLFNBQUFBLENBQVU5RCxJQUFJLEVBQUV6QixLQUFLLEVBQUUrRCxHQUFHLEVBQVc7SUFBQSxTQUFBeUIsS0FBQSxHQUFBOUYsU0FBQSxDQUFBQyxNQUFBLEVBQU5DLElBQUksT0FBQUMsS0FBQSxDQUFBMkYsS0FBQSxPQUFBQSxLQUFBLFdBQUFDLEtBQUEsTUFBQUEsS0FBQSxHQUFBRCxLQUFBLEVBQUFDLEtBQUE7TUFBSjdGLElBQUksQ0FBQTZGLEtBQUEsUUFBQS9GLFNBQUEsQ0FBQStGLEtBQUE7SUFBQTtJQUNqRCxPQUFPLElBQUksQ0FBQzFDLEtBQUssQ0FBQy9DLEtBQUssRUFBRSxHQUFHSixJQUFJLENBQUM7RUFDbkM7QUFDRixDQUFDLENBQUM7QUFHSyxNQUFNbkIsYUFBYSxHQUFHSCxPQUFPLENBQUNvRSxNQUFNLENBQUMsQ0FBQztBQUM3Q2pFLGFBQWEsQ0FBQytELEdBQUcsQ0FBQztFQUNoQlMsU0FBUyxFQUFFLFNBQUFBLENBQVVTLGVBQWUsRUFBRTtJQUNwQyxPQUFPLEVBQUU7RUFDWCxDQUFDO0VBQ0RGLGNBQWMsRUFBRSxTQUFBQSxDQUFVRyxxQkFBcUIsRUFBRTtJQUMvQyxJQUFJekMsR0FBRyxHQUFHd0UsTUFBTSxDQUFDL0IscUJBQXFCLENBQUM7SUFDdkMsSUFBSSxJQUFJLENBQUNTLFFBQVEsS0FBS3pGLFFBQVEsQ0FBQ2dILE1BQU0sRUFBRTtNQUNyQyxPQUFPekUsR0FBRyxDQUFDVixPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDQSxPQUFPLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQztJQUN6RCxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUM0RCxRQUFRLEtBQUt6RixRQUFRLENBQUNpSCxTQUFTLEVBQUU7TUFDL0M7TUFDQSxPQUFPMUUsR0FBRyxDQUFDVixPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDQSxPQUFPLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQztJQUMzRCxDQUFDLE1BQU07TUFDTCxPQUFPVSxHQUFHO0lBQ1o7RUFDRixDQUFDO0VBQ0RvQyxVQUFVLEVBQUUsU0FBQUEsQ0FBVXZELEtBQUssRUFBRTtJQUMzQixJQUFJOEYsS0FBSyxHQUFHLEVBQUU7SUFDZCxLQUFLLElBQUlyRyxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUdPLEtBQUssQ0FBQ0osTUFBTSxFQUFFSCxDQUFDLEVBQUUsRUFDbkNxRyxLQUFLLENBQUNULElBQUksQ0FBQyxJQUFJLENBQUNyQyxLQUFLLENBQUNoRCxLQUFLLENBQUNQLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEMsT0FBT3FHLEtBQUssQ0FBQ0MsSUFBSSxDQUFDLEVBQUUsQ0FBQztFQUN2QixDQUFDO0VBQ0QxQyxZQUFZLEVBQUUsU0FBQUEsQ0FBVVEsT0FBTyxFQUFFO0lBQy9CLE1BQU0sSUFBSXRELEtBQUssQ0FBQywyQkFBMkIsQ0FBQztFQUM5QyxDQUFDO0VBQ0Q2QyxZQUFZLEVBQUUsU0FBQUEsQ0FBVVUsT0FBTyxFQUFFO0lBQy9CLElBQUksSUFBSSxDQUFDTyxRQUFRLEtBQUt6RixRQUFRLENBQUNnSCxNQUFNLElBQ2pDLElBQUksQ0FBQ3ZCLFFBQVEsS0FBS3pGLFFBQVEsQ0FBQ2lILFNBQVMsRUFBRTtNQUN4QyxPQUFPL0IsT0FBTyxDQUFDNUMsSUFBSTtJQUNyQixDQUFDLE1BQU07TUFDTCxPQUFPNEMsT0FBTyxDQUFDM0MsR0FBRztJQUNwQjtFQUNGLENBQUM7RUFDRG1DLFFBQVEsRUFBRSxTQUFBQSxDQUFVUyxHQUFHLEVBQUU7SUFDdkIsT0FBT0EsR0FBRyxDQUFDOUQsS0FBSztFQUNsQixDQUFDO0VBQ0RrRCxRQUFRLEVBQUUsU0FBQUEsQ0FBVWEsR0FBRyxFQUFFO0lBQ3ZCO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0EsT0FBTyxJQUFJLENBQUNoQixLQUFLLENBQUMsSUFBSSxDQUFDckUsTUFBTSxDQUFDcUYsR0FBRyxDQUFDLENBQUM7RUFDckMsQ0FBQztFQUNEUixXQUFXLEVBQUUsU0FBQUEsQ0FBVW5DLENBQUMsRUFBRTtJQUN4QixNQUFNLElBQUlkLEtBQUssQ0FBQyx5Q0FBeUMsR0FBR2MsQ0FBQyxDQUFDO0VBQ2hFLENBQUM7RUFDRDFDLE1BQU0sRUFBRSxTQUFBQSxDQUFVOEMsSUFBSSxFQUFFO0lBQ3RCLE9BQU85QyxNQUFNLENBQUM4QyxJQUFJLENBQUM7RUFDckI7QUFDRixDQUFDLENBQUM7QUFJSyxNQUFNaEQsYUFBYSxHQUFHRixPQUFPLENBQUNvRSxNQUFNLENBQUMsQ0FBQztBQUM3Q2xFLGFBQWEsQ0FBQ2dFLEdBQUcsQ0FBQztFQUNoQlMsU0FBUyxFQUFFLFNBQUFBLENBQVVTLGVBQWUsRUFBRTtJQUNwQyxPQUFPLEVBQUU7RUFDWCxDQUFDO0VBQ0RGLGNBQWMsRUFBRSxTQUFBQSxDQUFVRyxxQkFBcUIsRUFBRTtJQUMvQyxJQUFJekMsR0FBRyxHQUFHd0UsTUFBTSxDQUFDL0IscUJBQXFCLENBQUM7SUFDdkMsT0FBT3pDLEdBQUcsQ0FBQ1YsT0FBTyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQ0EsT0FBTyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUM7RUFDekQsQ0FBQztFQUNEOEMsVUFBVSxFQUFFLFNBQUFBLENBQVV2RCxLQUFLLEVBQUU7SUFDM0IsSUFBSThGLEtBQUssR0FBRyxFQUFFO0lBQ2QsS0FBSyxJQUFJckcsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHTyxLQUFLLENBQUNKLE1BQU0sRUFBRUgsQ0FBQyxFQUFFLEVBQ25DcUcsS0FBSyxDQUFDVCxJQUFJLENBQUMsSUFBSSxDQUFDckMsS0FBSyxDQUFDaEQsS0FBSyxDQUFDUCxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xDLE9BQU9xRyxLQUFLLENBQUNDLElBQUksQ0FBQyxFQUFFLENBQUM7RUFDdkIsQ0FBQztFQUNEMUMsWUFBWSxFQUFFLFNBQUFBLENBQVVRLE9BQU8sRUFBRTtJQUMvQixPQUFPLE1BQU0sR0FBR0EsT0FBTyxDQUFDekMsY0FBYyxHQUFHLEtBQUs7RUFDaEQsQ0FBQztFQUNEZ0MsWUFBWSxFQUFFLFNBQUFBLENBQVVVLE9BQU8sRUFBRTtJQUMvQixPQUFPQSxPQUFPLENBQUM1QyxJQUFJO0VBQ3JCLENBQUM7RUFDRG9DLFFBQVEsRUFBRSxTQUFBQSxDQUFVUyxHQUFHLEVBQUU7SUFDdkIsT0FBT0EsR0FBRyxDQUFDOUQsS0FBSztFQUNsQixDQUFDO0VBQ0RrRCxRQUFRLEVBQUUsU0FBQUEsQ0FBVWEsR0FBRyxFQUFFO0lBQ3ZCLElBQUlnQyxRQUFRLEdBQUcsRUFBRTtJQUVqQixJQUFJL0csT0FBTyxHQUFHK0UsR0FBRyxDQUFDL0UsT0FBTztJQUN6QixJQUFJRSxRQUFRLEdBQUc2RSxHQUFHLENBQUM3RSxRQUFRO0lBRTNCLElBQUlELEtBQUssR0FBRzhFLEdBQUcsQ0FBQzlFLEtBQUs7SUFDckIsSUFBSUEsS0FBSyxFQUFFO01BQ1RBLEtBQUssR0FBR2QsaUJBQWlCLENBQUNjLEtBQUssQ0FBQztNQUNoQyxLQUFLLElBQUlvRCxDQUFDLElBQUlwRCxLQUFLLEVBQUU7UUFDbkIsSUFBSW9ELENBQUMsS0FBSyxPQUFPLElBQUlyRCxPQUFPLEtBQUssVUFBVSxFQUFFO1VBQzNDRSxRQUFRLEdBQUcsQ0FBQ0QsS0FBSyxDQUFDb0QsQ0FBQyxDQUFDLEVBQUVuRCxRQUFRLENBQUM7UUFDakMsQ0FBQyxNQUFNO1VBQ0wsSUFBSWIsQ0FBQyxHQUFHLElBQUksQ0FBQ08sTUFBTSxDQUFDSyxLQUFLLENBQUNvRCxDQUFDLENBQUMsRUFBRTFELFFBQVEsQ0FBQ2lILFNBQVMsQ0FBQztVQUNqREcsUUFBUSxDQUFDWCxJQUFJLENBQUMsR0FBRyxHQUFHL0MsQ0FBQyxHQUFHLElBQUksR0FBR2hFLENBQUMsR0FBRyxHQUFHLENBQUM7UUFDekM7TUFDRjtJQUNGO0lBRUEsSUFBSTJILFFBQVEsR0FBRyxHQUFHLEdBQUdoSCxPQUFPLEdBQUcrRyxRQUFRLENBQUNELElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHO0lBRXRELElBQUlHLFNBQVMsR0FBRyxFQUFFO0lBQ2xCLElBQUlqRCxPQUFPO0lBQ1gsSUFBSWhFLE9BQU8sS0FBSyxVQUFVLEVBQUU7TUFFMUIsS0FBSyxJQUFJUSxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUdOLFFBQVEsQ0FBQ1MsTUFBTSxFQUFFSCxDQUFDLEVBQUUsRUFDdEN5RyxTQUFTLENBQUNiLElBQUksQ0FBQyxJQUFJLENBQUN4RyxNQUFNLENBQUNNLFFBQVEsQ0FBQ00sQ0FBQyxDQUFDLEVBQUViLFFBQVEsQ0FBQ2dILE1BQU0sQ0FBQyxDQUFDO01BRTNEM0MsT0FBTyxHQUFHaUQsU0FBUyxDQUFDSCxJQUFJLENBQUMsRUFBRSxDQUFDO01BQzVCLElBQUk5QyxPQUFPLENBQUMvQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLElBQUk7UUFDOUI7UUFDQTtRQUNBK0MsT0FBTyxHQUFHLElBQUksR0FBR0EsT0FBTztJQUU1QixDQUFDLE1BQU07TUFDTCxLQUFLLElBQUl4RCxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUdOLFFBQVEsQ0FBQ1MsTUFBTSxFQUFFSCxDQUFDLEVBQUUsRUFDdEN5RyxTQUFTLENBQUNiLElBQUksQ0FBQyxJQUFJLENBQUNyQyxLQUFLLENBQUM3RCxRQUFRLENBQUNNLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFFekN3RCxPQUFPLEdBQUdpRCxTQUFTLENBQUNILElBQUksQ0FBQyxFQUFFLENBQUM7SUFDOUI7SUFFQSxJQUFJbEUsTUFBTSxHQUFHb0UsUUFBUSxHQUFHaEQsT0FBTztJQUUvQixJQUFJOUQsUUFBUSxDQUFDUyxNQUFNLElBQUksQ0FBRWhDLGFBQWEsQ0FBQ3FCLE9BQU8sQ0FBQyxFQUFFO01BQy9DO01BQ0E7TUFDQTtNQUNBNEMsTUFBTSxJQUFJLElBQUksR0FBRzVDLE9BQU8sR0FBRyxHQUFHO0lBQ2hDO0lBRUEsT0FBTzRDLE1BQU07RUFDZixDQUFDO0VBQ0QyQixXQUFXLEVBQUUsU0FBQUEsQ0FBVW5DLENBQUMsRUFBRTtJQUN4QixNQUFNLElBQUlkLEtBQUssQ0FBQyx5Q0FBeUMsR0FBR2MsQ0FBQyxDQUFDO0VBQ2hFLENBQUM7RUFDRHhDLE1BQU0sRUFBRSxTQUFBQSxDQUFVNEMsSUFBSSxFQUFFNEMsUUFBUSxFQUFFO0lBQ2hDLE9BQU94RixNQUFNLENBQUM0QyxJQUFJLEVBQUU0QyxRQUFRLENBQUM7RUFDL0I7QUFDRixDQUFDLENBQUM7O0FBSUY7O0FBRU8sU0FBUzFGLE1BQU1BLENBQUNzRSxPQUFPLEVBQUU7RUFDOUIsT0FBUSxJQUFJeEUsYUFBYSxDQUFELENBQUMsQ0FBRXVFLEtBQUssQ0FBQ0MsT0FBTyxDQUFDO0FBQzNDO0FBR08sTUFBTXJFLFFBQVEsR0FBRztFQUN0QnVILE1BQU0sRUFBRSxDQUFDO0VBQ1RQLE1BQU0sRUFBRSxDQUFDO0VBQ1RDLFNBQVMsRUFBRTtBQUNiLENBQUM7QUFHTSxTQUFTaEgsTUFBTUEsQ0FBQ29FLE9BQU8sRUFBRW9CLFFBQVEsRUFBRTtFQUN4QyxJQUFJLENBQUVBLFFBQVEsRUFDWixNQUFNLElBQUk5RCxLQUFLLENBQUMsbUNBQW1DLENBQUM7RUFDdEQsSUFBSSxFQUFHOEQsUUFBUSxLQUFLekYsUUFBUSxDQUFDdUgsTUFBTSxJQUM1QjlCLFFBQVEsS0FBS3pGLFFBQVEsQ0FBQ2dILE1BQU0sSUFDNUJ2QixRQUFRLEtBQUt6RixRQUFRLENBQUNpSCxTQUFTLENBQUMsRUFDckMsTUFBTSxJQUFJdEYsS0FBSyxDQUFDLG9CQUFvQixHQUFHOEQsUUFBUSxDQUFDO0VBRWxELElBQUkrQixPQUFPLEdBQUcsSUFBSTFILGFBQWEsQ0FBQztJQUFDMkYsUUFBUSxFQUFFQTtFQUFRLENBQUMsQ0FBQztFQUNyRCxPQUFPK0IsT0FBTyxDQUFDcEQsS0FBSyxDQUFDQyxPQUFPLENBQUM7QUFDL0IsQyIsImZpbGUiOiIvcGFja2FnZXMvaHRtbGpzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgSFRNTFRhZ3MsXG4gIFRhZyxcbiAgQXR0cnMsXG4gIGdldFRhZyxcbiAgZW5zdXJlVGFnLFxuICBpc1RhZ0Vuc3VyZWQsXG4gIGdldFN5bWJvbE5hbWUsXG4gIGtub3duSFRNTEVsZW1lbnROYW1lcyxcbiAga25vd25TVkdFbGVtZW50TmFtZXMsXG4gIGtub3duRWxlbWVudE5hbWVzLFxuICB2b2lkRWxlbWVudE5hbWVzLFxuICBpc0tub3duRWxlbWVudCxcbiAgaXNLbm93blNWR0VsZW1lbnQsXG4gIGlzVm9pZEVsZW1lbnQsXG4gIENoYXJSZWYsXG4gIENvbW1lbnQsXG4gIFJhdyxcbiAgaXNBcnJheSxcbiAgaXNDb25zdHJ1Y3RlZE9iamVjdCxcbiAgaXNOdWxseSxcbiAgaXNWYWxpZEF0dHJpYnV0ZU5hbWUsXG4gIGZsYXR0ZW5BdHRyaWJ1dGVzLFxufSBmcm9tICcuL2h0bWwnO1xuXG5pbXBvcnQge1xuICBWaXNpdG9yLFxuICBUcmFuc2Zvcm1pbmdWaXNpdG9yLFxuICBUb0hUTUxWaXNpdG9yLFxuICBUb1RleHRWaXNpdG9yLFxuICB0b0hUTUwsXG4gIFRFWFRNT0RFLFxuICB0b1RleHRcbn0gZnJvbSAnLi92aXNpdG9ycyc7XG5cblxuLy8gd2UncmUgYWN0dWFsbHkgZXhwb3J0aW5nIHRoZSBIVE1MVGFncyBvYmplY3QuXG4vLyAgYmVjYXVzZSBpdCBpcyBkeW5hbWljYWxseSBhbHRlcmVkIGJ5IGdldFRhZy9lbnN1cmVUYWdcbmV4cG9ydCBjb25zdCBIVE1MID0gT2JqZWN0LmFzc2lnbihIVE1MVGFncywge1xuICBUYWcsXG4gIEF0dHJzLFxuICBnZXRUYWcsXG4gIGVuc3VyZVRhZyxcbiAgaXNUYWdFbnN1cmVkLFxuICBnZXRTeW1ib2xOYW1lLFxuICBrbm93bkhUTUxFbGVtZW50TmFtZXMsXG4gIGtub3duU1ZHRWxlbWVudE5hbWVzLFxuICBrbm93bkVsZW1lbnROYW1lcyxcbiAgdm9pZEVsZW1lbnROYW1lcyxcbiAgaXNLbm93bkVsZW1lbnQsXG4gIGlzS25vd25TVkdFbGVtZW50LFxuICBpc1ZvaWRFbGVtZW50LFxuICBDaGFyUmVmLFxuICBDb21tZW50LFxuICBSYXcsXG4gIGlzQXJyYXksXG4gIGlzQ29uc3RydWN0ZWRPYmplY3QsXG4gIGlzTnVsbHksXG4gIGlzVmFsaWRBdHRyaWJ1dGVOYW1lLFxuICBmbGF0dGVuQXR0cmlidXRlcyxcbiAgdG9IVE1MLFxuICBURVhUTU9ERSxcbiAgdG9UZXh0LFxuICBWaXNpdG9yLFxuICBUcmFuc2Zvcm1pbmdWaXNpdG9yLFxuICBUb0hUTUxWaXNpdG9yLFxuICBUb1RleHRWaXNpdG9yLFxufSk7XG4iLCJcbmV4cG9ydCBjb25zdCBUYWcgPSBmdW5jdGlvbiAoKSB7fTtcblRhZy5wcm90b3R5cGUudGFnTmFtZSA9ICcnOyAvLyB0aGlzIHdpbGwgYmUgc2V0IHBlciBUYWcgc3ViY2xhc3NcblRhZy5wcm90b3R5cGUuYXR0cnMgPSBudWxsO1xuVGFnLnByb3RvdHlwZS5jaGlsZHJlbiA9IE9iamVjdC5mcmVlemUgPyBPYmplY3QuZnJlZXplKFtdKSA6IFtdO1xuVGFnLnByb3RvdHlwZS5odG1sanNUeXBlID0gVGFnLmh0bWxqc1R5cGUgPSBbJ1RhZyddO1xuXG4vLyBHaXZlbiBcInBcIiBjcmVhdGUgdGhlIGZ1bmN0aW9uIGBIVE1MLlBgLlxudmFyIG1ha2VUYWdDb25zdHJ1Y3RvciA9IGZ1bmN0aW9uICh0YWdOYW1lKSB7XG4gIC8vIFRhZyBpcyB0aGUgcGVyLXRhZ05hbWUgY29uc3RydWN0b3Igb2YgYSBIVE1MLlRhZyBzdWJjbGFzc1xuICB2YXIgSFRNTFRhZyA9IGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgLy8gV29yayB3aXRoIG9yIHdpdGhvdXQgYG5ld2AuICBJZiBub3QgY2FsbGVkIHdpdGggYG5ld2AsXG4gICAgLy8gcGVyZm9ybSBpbnN0YW50aWF0aW9uIGJ5IHJlY3Vyc2l2ZWx5IGNhbGxpbmcgdGhpcyBjb25zdHJ1Y3Rvci5cbiAgICAvLyBXZSBjYW4ndCBwYXNzIHZhcmFyZ3MsIHNvIHBhc3Mgbm8gYXJncy5cbiAgICB2YXIgaW5zdGFuY2UgPSAodGhpcyBpbnN0YW5jZW9mIFRhZykgPyB0aGlzIDogbmV3IEhUTUxUYWc7XG5cbiAgICB2YXIgaSA9IDA7XG4gICAgdmFyIGF0dHJzID0gYXJncy5sZW5ndGggJiYgYXJnc1swXTtcbiAgICBpZiAoYXR0cnMgJiYgKHR5cGVvZiBhdHRycyA9PT0gJ29iamVjdCcpKSB7XG4gICAgICAvLyBUcmVhdCB2YW5pbGxhIEpTIG9iamVjdCBhcyBhbiBhdHRyaWJ1dGVzIGRpY3Rpb25hcnkuXG4gICAgICBpZiAoISBpc0NvbnN0cnVjdGVkT2JqZWN0KGF0dHJzKSkge1xuICAgICAgICBpbnN0YW5jZS5hdHRycyA9IGF0dHJzO1xuICAgICAgICBpKys7XG4gICAgICB9IGVsc2UgaWYgKGF0dHJzIGluc3RhbmNlb2YgQXR0cnMpIHtcbiAgICAgICAgdmFyIGFycmF5ID0gYXR0cnMudmFsdWU7XG4gICAgICAgIGlmIChhcnJheS5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICBpbnN0YW5jZS5hdHRycyA9IGFycmF5WzBdO1xuICAgICAgICB9IGVsc2UgaWYgKGFycmF5Lmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICBpbnN0YW5jZS5hdHRycyA9IGFycmF5O1xuICAgICAgICB9XG4gICAgICAgIGkrKztcbiAgICAgIH1cbiAgICB9XG5cblxuICAgIC8vIElmIG5vIGNoaWxkcmVuLCBkb24ndCBjcmVhdGUgYW4gYXJyYXkgYXQgYWxsLCB1c2UgdGhlIHByb3RvdHlwZSdzXG4gICAgLy8gKGZyb3plbiwgZW1wdHkpIGFycmF5LiAgVGhpcyB3YXkgd2UgZG9uJ3QgY3JlYXRlIGFuIGVtcHR5IGFycmF5XG4gICAgLy8gZXZlcnkgdGltZSBzb21lb25lIGNyZWF0ZXMgYSB0YWcgd2l0aG91dCBgbmV3YCBhbmQgdGhpcyBjb25zdHJ1Y3RvclxuICAgIC8vIGNhbGxzIGl0c2VsZiB3aXRoIG5vIGFyZ3VtZW50cyAoYWJvdmUpLlxuICAgIGlmIChpIDwgYXJncy5sZW5ndGgpXG4gICAgICBpbnN0YW5jZS5jaGlsZHJlbiA9IGFyZ3Muc2xpY2UoaSk7XG5cbiAgICByZXR1cm4gaW5zdGFuY2U7XG4gIH07XG4gIEhUTUxUYWcucHJvdG90eXBlID0gbmV3IFRhZztcbiAgSFRNTFRhZy5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBIVE1MVGFnO1xuICBIVE1MVGFnLnByb3RvdHlwZS50YWdOYW1lID0gdGFnTmFtZTtcblxuICByZXR1cm4gSFRNTFRhZztcbn07XG5cbi8vIE5vdCBhbiBIVE1ManMgbm9kZSwgYnV0IGEgd3JhcHBlciB0byBwYXNzIG11bHRpcGxlIGF0dHJzIGRpY3Rpb25hcmllc1xuLy8gdG8gYSB0YWcgKGZvciB0aGUgcHVycG9zZSBvZiBpbXBsZW1lbnRpbmcgZHluYW1pYyBhdHRyaWJ1dGVzKS5cbmV4cG9ydCBmdW5jdGlvbiBBdHRycyguLi5hcmdzKSB7XG4gIC8vIFdvcmsgd2l0aCBvciB3aXRob3V0IGBuZXdgLiAgSWYgbm90IGNhbGxlZCB3aXRoIGBuZXdgLFxuICAvLyBwZXJmb3JtIGluc3RhbnRpYXRpb24gYnkgcmVjdXJzaXZlbHkgY2FsbGluZyB0aGlzIGNvbnN0cnVjdG9yLlxuICAvLyBXZSBjYW4ndCBwYXNzIHZhcmFyZ3MsIHNvIHBhc3Mgbm8gYXJncy5cbiAgdmFyIGluc3RhbmNlID0gKHRoaXMgaW5zdGFuY2VvZiBBdHRycykgPyB0aGlzIDogbmV3IEF0dHJzO1xuXG4gIGluc3RhbmNlLnZhbHVlID0gYXJncztcblxuICByZXR1cm4gaW5zdGFuY2U7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLyBLTk9XTiBFTEVNRU5UU1xuZXhwb3J0IGNvbnN0IEhUTUxUYWdzID0ge307XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRUYWcgKHRhZ05hbWUpIHtcbiAgdmFyIHN5bWJvbE5hbWUgPSBnZXRTeW1ib2xOYW1lKHRhZ05hbWUpO1xuICBpZiAoc3ltYm9sTmFtZSA9PT0gdGFnTmFtZSkgLy8gYWxsLWNhcHMgdGFnTmFtZVxuICAgIHRocm93IG5ldyBFcnJvcihcIlVzZSB0aGUgbG93ZXJjYXNlIG9yIGNhbWVsQ2FzZSBmb3JtIG9mICdcIiArIHRhZ05hbWUgKyBcIicgaGVyZVwiKTtcblxuICBpZiAoISBIVE1MVGFnc1tzeW1ib2xOYW1lXSlcbiAgICBIVE1MVGFnc1tzeW1ib2xOYW1lXSA9IG1ha2VUYWdDb25zdHJ1Y3Rvcih0YWdOYW1lKTtcblxuICByZXR1cm4gSFRNTFRhZ3Nbc3ltYm9sTmFtZV07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbnN1cmVUYWcodGFnTmFtZSkge1xuICBnZXRUYWcodGFnTmFtZSk7IC8vIGRvbid0IHJldHVybiBpdFxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNUYWdFbnN1cmVkICh0YWdOYW1lKSB7XG4gIHJldHVybiBpc0tub3duRWxlbWVudCh0YWdOYW1lKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFN5bWJvbE5hbWUgKHRhZ05hbWUpIHtcbiAgLy8gXCJmb28tYmFyXCIgLT4gXCJGT09fQkFSXCJcbiAgcmV0dXJuIHRhZ05hbWUudG9VcHBlckNhc2UoKS5yZXBsYWNlKC8tL2csICdfJyk7XG59XG5cbmV4cG9ydCBjb25zdCBrbm93bkhUTUxFbGVtZW50TmFtZXMgPSAnYSBhYmJyIGFjcm9ueW0gYWRkcmVzcyBhcHBsZXQgYXJlYSBhcnRpY2xlIGFzaWRlIGF1ZGlvIGIgYmFzZSBiYXNlZm9udCBiZGkgYmRvIGJpZyBibG9ja3F1b3RlIGJvZHkgYnIgYnV0dG9uIGNhbnZhcyBjYXB0aW9uIGNlbnRlciBjaXRlIGNvZGUgY29sIGNvbGdyb3VwIGNvbW1hbmQgZGF0YSBkYXRhZ3JpZCBkYXRhbGlzdCBkZCBkZWwgZGV0YWlscyBkZm4gZGlyIGRpdiBkbCBkdCBlbSBlbWJlZCBldmVudHNvdXJjZSBmaWVsZHNldCBmaWdjYXB0aW9uIGZpZ3VyZSBmb250IGZvb3RlciBmb3JtIGZyYW1lIGZyYW1lc2V0IGgxIGgyIGgzIGg0IGg1IGg2IGhlYWQgaGVhZGVyIGhncm91cCBociBodG1sIGkgaWZyYW1lIGltZyBpbnB1dCBpbnMgaXNpbmRleCBrYmQga2V5Z2VuIGxhYmVsIGxlZ2VuZCBsaSBsaW5rIG1haW4gbWFwIG1hcmsgbWVudSBtZXRhIG1ldGVyIG5hdiBub2ZyYW1lcyBub3NjcmlwdCBvYmplY3Qgb2wgb3B0Z3JvdXAgb3B0aW9uIG91dHB1dCBwIHBhcmFtIHByZSBwcm9ncmVzcyBxIHJwIHJ0IHJ1YnkgcyBzYW1wIHNjcmlwdCBzZWN0aW9uIHNlbGVjdCBzbWFsbCBzb3VyY2Ugc3BhbiBzdHJpa2Ugc3Ryb25nIHN0eWxlIHN1YiBzdW1tYXJ5IHN1cCB0YWJsZSB0Ym9keSB0ZCB0ZXh0YXJlYSB0Zm9vdCB0aCB0aGVhZCB0aW1lIHRpdGxlIHRyIHRyYWNrIHR0IHUgdWwgdmFyIHZpZGVvIHdicicuc3BsaXQoJyAnKTtcbi8vICh3ZSBhZGQgdGhlIFNWRyBvbmVzIGJlbG93KVxuXG5leHBvcnQgY29uc3Qga25vd25TVkdFbGVtZW50TmFtZXMgPSAnYWx0R2x5cGggYWx0R2x5cGhEZWYgYWx0R2x5cGhJdGVtIGFuaW1hdGUgYW5pbWF0ZUNvbG9yIGFuaW1hdGVNb3Rpb24gYW5pbWF0ZVRyYW5zZm9ybSBjaXJjbGUgY2xpcFBhdGggY29sb3ItcHJvZmlsZSBjdXJzb3IgZGVmcyBkZXNjIGVsbGlwc2UgZmVCbGVuZCBmZUNvbG9yTWF0cml4IGZlQ29tcG9uZW50VHJhbnNmZXIgZmVDb21wb3NpdGUgZmVDb252b2x2ZU1hdHJpeCBmZURpZmZ1c2VMaWdodGluZyBmZURpc3BsYWNlbWVudE1hcCBmZURpc3RhbnRMaWdodCBmZUZsb29kIGZlRnVuY0EgZmVGdW5jQiBmZUZ1bmNHIGZlRnVuY1IgZmVHYXVzc2lhbkJsdXIgZmVJbWFnZSBmZU1lcmdlIGZlTWVyZ2VOb2RlIGZlTW9ycGhvbG9neSBmZU9mZnNldCBmZVBvaW50TGlnaHQgZmVTcGVjdWxhckxpZ2h0aW5nIGZlU3BvdExpZ2h0IGZlVGlsZSBmZVR1cmJ1bGVuY2UgZmlsdGVyIGZvbnQgZm9udC1mYWNlIGZvbnQtZmFjZS1mb3JtYXQgZm9udC1mYWNlLW5hbWUgZm9udC1mYWNlLXNyYyBmb250LWZhY2UtdXJpIGZvcmVpZ25PYmplY3QgZyBnbHlwaCBnbHlwaFJlZiBoa2VybiBpbWFnZSBsaW5lIGxpbmVhckdyYWRpZW50IG1hcmtlciBtYXNrIG1ldGFkYXRhIG1pc3NpbmctZ2x5cGggcGF0aCBwYXR0ZXJuIHBvbHlnb24gcG9seWxpbmUgcmFkaWFsR3JhZGllbnQgcmVjdCBzZXQgc3RvcCBzdHlsZSBzdmcgc3dpdGNoIHN5bWJvbCB0ZXh0IHRleHRQYXRoIHRpdGxlIHRyZWYgdHNwYW4gdXNlIHZpZXcgdmtlcm4nLnNwbGl0KCcgJyk7XG4vLyBBcHBlbmQgU1ZHIGVsZW1lbnQgbmFtZXMgdG8gbGlzdCBvZiBrbm93biBlbGVtZW50IG5hbWVzXG5leHBvcnQgY29uc3Qga25vd25FbGVtZW50TmFtZXMgPSBrbm93bkhUTUxFbGVtZW50TmFtZXMuY29uY2F0KGtub3duU1ZHRWxlbWVudE5hbWVzKTtcblxuZXhwb3J0IGNvbnN0IHZvaWRFbGVtZW50TmFtZXMgPSAnYXJlYSBiYXNlIGJyIGNvbCBjb21tYW5kIGVtYmVkIGhyIGltZyBpbnB1dCBrZXlnZW4gbGluayBtZXRhIHBhcmFtIHNvdXJjZSB0cmFjayB3YnInLnNwbGl0KCcgJyk7XG5cblxudmFyIHZvaWRFbGVtZW50U2V0ID0gbmV3IFNldCh2b2lkRWxlbWVudE5hbWVzKTtcbnZhciBrbm93bkVsZW1lbnRTZXQgPSBuZXcgU2V0KGtub3duRWxlbWVudE5hbWVzKTtcbnZhciBrbm93blNWR0VsZW1lbnRTZXQgPSBuZXcgU2V0KGtub3duU1ZHRWxlbWVudE5hbWVzKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGlzS25vd25FbGVtZW50KHRhZ05hbWUpIHtcbiAgcmV0dXJuIGtub3duRWxlbWVudFNldC5oYXModGFnTmFtZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0tub3duU1ZHRWxlbWVudCh0YWdOYW1lKSB7XG4gIHJldHVybiBrbm93blNWR0VsZW1lbnRTZXQuaGFzKHRhZ05hbWUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNWb2lkRWxlbWVudCh0YWdOYW1lKSB7XG4gIHJldHVybiB2b2lkRWxlbWVudFNldC5oYXModGFnTmFtZSk7XG59XG5cblxuLy8gRW5zdXJlIHRhZ3MgZm9yIGFsbCBrbm93biBlbGVtZW50c1xua25vd25FbGVtZW50TmFtZXMuZm9yRWFjaChlbnN1cmVUYWcpO1xuXG5cbmV4cG9ydCBmdW5jdGlvbiBDaGFyUmVmKGF0dHJzKSB7XG4gIGlmICghICh0aGlzIGluc3RhbmNlb2YgQ2hhclJlZikpXG4gICAgLy8gY2FsbGVkIHdpdGhvdXQgYG5ld2BcbiAgICByZXR1cm4gbmV3IENoYXJSZWYoYXR0cnMpO1xuXG4gIGlmICghIChhdHRycyAmJiBhdHRycy5odG1sICYmIGF0dHJzLnN0cikpXG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgXCJIVE1MLkNoYXJSZWYgbXVzdCBiZSBjb25zdHJ1Y3RlZCB3aXRoICh7aHRtbDouLi4sIHN0cjouLi59KVwiKTtcblxuICB0aGlzLmh0bWwgPSBhdHRycy5odG1sO1xuICB0aGlzLnN0ciA9IGF0dHJzLnN0cjtcbn1cbkNoYXJSZWYucHJvdG90eXBlLmh0bWxqc1R5cGUgPSBDaGFyUmVmLmh0bWxqc1R5cGUgPSBbJ0NoYXJSZWYnXTtcblxuZXhwb3J0IGZ1bmN0aW9uIENvbW1lbnQodmFsdWUpIHtcbiAgaWYgKCEgKHRoaXMgaW5zdGFuY2VvZiBDb21tZW50KSlcbiAgICAvLyBjYWxsZWQgd2l0aG91dCBgbmV3YFxuICAgIHJldHVybiBuZXcgQ29tbWVudCh2YWx1ZSk7XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycpXG4gICAgdGhyb3cgbmV3IEVycm9yKCdIVE1MLkNvbW1lbnQgbXVzdCBiZSBjb25zdHJ1Y3RlZCB3aXRoIGEgc3RyaW5nJyk7XG5cbiAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAvLyBLaWxsIGlsbGVnYWwgaHlwaGVucyBpbiBjb21tZW50IHZhbHVlIChubyB3YXkgdG8gZXNjYXBlIHRoZW0gaW4gSFRNTClcbiAgdGhpcy5zYW5pdGl6ZWRWYWx1ZSA9IHZhbHVlLnJlcGxhY2UoL14tfC0tK3wtJC9nLCAnJyk7XG59XG5Db21tZW50LnByb3RvdHlwZS5odG1sanNUeXBlID0gQ29tbWVudC5odG1sanNUeXBlID0gWydDb21tZW50J107XG5cbmV4cG9ydCBmdW5jdGlvbiBSYXcodmFsdWUpIHtcbiAgaWYgKCEgKHRoaXMgaW5zdGFuY2VvZiBSYXcpKVxuICAgIC8vIGNhbGxlZCB3aXRob3V0IGBuZXdgXG4gICAgcmV0dXJuIG5ldyBSYXcodmFsdWUpO1xuXG4gIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKVxuICAgIHRocm93IG5ldyBFcnJvcignSFRNTC5SYXcgbXVzdCBiZSBjb25zdHJ1Y3RlZCB3aXRoIGEgc3RyaW5nJyk7XG5cbiAgdGhpcy52YWx1ZSA9IHZhbHVlO1xufVxuUmF3LnByb3RvdHlwZS5odG1sanNUeXBlID0gUmF3Lmh0bWxqc1R5cGUgPSBbJ1JhdyddO1xuXG5cbmV4cG9ydCBmdW5jdGlvbiBpc0FycmF5ICh4KSB7XG4gIHJldHVybiB4IGluc3RhbmNlb2YgQXJyYXkgfHwgQXJyYXkuaXNBcnJheSh4KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29uc3RydWN0ZWRPYmplY3QgKHgpIHtcbiAgLy8gRmlndXJlIG91dCBpZiBgeGAgaXMgXCJhbiBpbnN0YW5jZSBvZiBzb21lIGNsYXNzXCIgb3IganVzdCBhIHBsYWluXG4gIC8vIG9iamVjdCBsaXRlcmFsLiAgSXQgY29ycmVjdGx5IHRyZWF0cyBhbiBvYmplY3QgbGl0ZXJhbCBsaWtlXG4gIC8vIGB7IGNvbnN0cnVjdG9yOiAuLi4gfWAgYXMgYW4gb2JqZWN0IGxpdGVyYWwuICBJdCB3b24ndCBkZXRlY3RcbiAgLy8gaW5zdGFuY2VzIG9mIGNsYXNzZXMgdGhhdCBsYWNrIGEgYGNvbnN0cnVjdG9yYCBwcm9wZXJ0eSAoZS5nLlxuICAvLyBpZiB5b3UgYXNzaWduIHRvIGEgcHJvdG90eXBlIHdoZW4gc2V0dGluZyB1cCB0aGUgY2xhc3MgYXMgaW46XG4gIC8vIGBGb28gPSBmdW5jdGlvbiAoKSB7IC4uLiB9OyBGb28ucHJvdG90eXBlID0geyAuLi4gfWAsIHRoZW5cbiAgLy8gYChuZXcgRm9vKS5jb25zdHJ1Y3RvcmAgaXMgYE9iamVjdGAsIG5vdCBgRm9vYCkuXG4gIGlmKCF4IHx8ICh0eXBlb2YgeCAhPT0gJ29iamVjdCcpKSByZXR1cm4gZmFsc2U7XG4gIC8vIElzIHRoaXMgYSBwbGFpbiBvYmplY3Q/XG4gIGxldCBwbGFpbiA9IGZhbHNlO1xuICBpZihPYmplY3QuZ2V0UHJvdG90eXBlT2YoeCkgPT09IG51bGwpIHtcbiAgICBwbGFpbiA9IHRydWU7XG4gIH0gZWxzZSB7XG4gICAgbGV0IHByb3RvID0geDtcbiAgICB3aGlsZShPYmplY3QuZ2V0UHJvdG90eXBlT2YocHJvdG8pICE9PSBudWxsKSB7XG4gICAgICBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihwcm90byk7XG4gICAgfVxuICAgIHBsYWluID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHgpID09PSBwcm90bztcbiAgfVxuXG4gIHJldHVybiAhcGxhaW4gJiZcbiAgICAodHlwZW9mIHguY29uc3RydWN0b3IgPT09ICdmdW5jdGlvbicpICYmXG4gICAgKHggaW5zdGFuY2VvZiB4LmNvbnN0cnVjdG9yKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTnVsbHkgKG5vZGUpIHtcbiAgaWYgKG5vZGUgPT0gbnVsbClcbiAgICAvLyBudWxsIG9yIHVuZGVmaW5lZFxuICAgIHJldHVybiB0cnVlO1xuXG4gIGlmIChpc0FycmF5KG5vZGUpKSB7XG4gICAgLy8gaXMgaXQgYW4gZW1wdHkgYXJyYXkgb3IgYW4gYXJyYXkgb2YgYWxsIG51bGx5IGl0ZW1zP1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZS5sZW5ndGg7IGkrKylcbiAgICAgIGlmICghIGlzTnVsbHkobm9kZVtpXSkpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzVmFsaWRBdHRyaWJ1dGVOYW1lIChuYW1lKSB7XG4gIHJldHVybiAvXls6X0EtWmEtel1bOl9BLVphLXowLTkuXFwtXSovLnRlc3QobmFtZSk7XG59XG5cbi8vIElmIGBhdHRyc2AgaXMgYW4gYXJyYXkgb2YgYXR0cmlidXRlcyBkaWN0aW9uYXJpZXMsIGNvbWJpbmVzIHRoZW1cbi8vIGludG8gb25lLiAgUmVtb3ZlcyBhdHRyaWJ1dGVzIHRoYXQgYXJlIFwibnVsbHkuXCJcbmV4cG9ydCBmdW5jdGlvbiBmbGF0dGVuQXR0cmlidXRlcyAoYXR0cnMpIHtcbiAgaWYgKCEgYXR0cnMpXG4gICAgcmV0dXJuIGF0dHJzO1xuXG4gIHZhciBpc0xpc3QgPSBpc0FycmF5KGF0dHJzKTtcbiAgaWYgKGlzTGlzdCAmJiBhdHRycy5sZW5ndGggPT09IDApXG4gICAgcmV0dXJuIG51bGw7XG5cbiAgdmFyIHJlc3VsdCA9IHt9O1xuICBmb3IgKHZhciBpID0gMCwgTiA9IChpc0xpc3QgPyBhdHRycy5sZW5ndGggOiAxKTsgaSA8IE47IGkrKykge1xuICAgIHZhciBvbmVBdHRycyA9IChpc0xpc3QgPyBhdHRyc1tpXSA6IGF0dHJzKTtcbiAgICBpZiAoKHR5cGVvZiBvbmVBdHRycyAhPT0gJ29iamVjdCcpIHx8XG4gICAgICAgIGlzQ29uc3RydWN0ZWRPYmplY3Qob25lQXR0cnMpKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXhwZWN0ZWQgcGxhaW4gSlMgb2JqZWN0IGFzIGF0dHJzLCBmb3VuZDogXCIgKyBvbmVBdHRycyk7XG4gICAgZm9yICh2YXIgbmFtZSBpbiBvbmVBdHRycykge1xuICAgICAgaWYgKCEgaXNWYWxpZEF0dHJpYnV0ZU5hbWUobmFtZSkpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIklsbGVnYWwgSFRNTCBhdHRyaWJ1dGUgbmFtZTogXCIgKyBuYW1lKTtcbiAgICAgIHZhciB2YWx1ZSA9IG9uZUF0dHJzW25hbWVdO1xuICAgICAgaWYgKCEgaXNOdWxseSh2YWx1ZSkpXG4gICAgICAgIHJlc3VsdFtuYW1lXSA9IHZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG4iLCJpbXBvcnQge1xuICBUYWcsXG4gIENoYXJSZWYsXG4gIENvbW1lbnQsXG4gIFJhdyxcbiAgaXNBcnJheSxcbiAgZ2V0VGFnLFxuICBpc0NvbnN0cnVjdGVkT2JqZWN0LFxuICBmbGF0dGVuQXR0cmlidXRlcyxcbiAgaXNWb2lkRWxlbWVudCxcbn0gZnJvbSAnLi9odG1sJztcblxuXG52YXIgSURFTlRJVFkgPSBmdW5jdGlvbiAoeCkgeyByZXR1cm4geDsgfTtcblxuLy8gX2Fzc2lnbiBpcyBsaWtlIF8uZXh0ZW5kIG9yIHRoZSB1cGNvbWluZyBPYmplY3QuYXNzaWduLlxuLy8gQ29weSBzcmMncyBvd24sIGVudW1lcmFibGUgcHJvcGVydGllcyBvbnRvIHRndCBhbmQgcmV0dXJuXG4vLyB0Z3QuXG52YXIgX2hhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbnZhciBfYXNzaWduID0gZnVuY3Rpb24gKHRndCwgc3JjKSB7XG4gIGZvciAodmFyIGsgaW4gc3JjKSB7XG4gICAgaWYgKF9oYXNPd25Qcm9wZXJ0eS5jYWxsKHNyYywgaykpXG4gICAgICB0Z3Rba10gPSBzcmNba107XG4gIH1cbiAgcmV0dXJuIHRndDtcbn07XG5cbmV4cG9ydCBjb25zdCBWaXNpdG9yID0gZnVuY3Rpb24gKHByb3BzKSB7XG4gIF9hc3NpZ24odGhpcywgcHJvcHMpO1xufTtcblxuVmlzaXRvci5kZWYgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICBfYXNzaWduKHRoaXMucHJvdG90eXBlLCBvcHRpb25zKTtcbn07XG5cblZpc2l0b3IuZXh0ZW5kID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgdmFyIGN1clR5cGUgPSB0aGlzO1xuICB2YXIgc3ViVHlwZSA9IGZ1bmN0aW9uIEhUTUxWaXNpdG9yU3VidHlwZSgvKmFyZ3VtZW50cyovKSB7XG4gICAgVmlzaXRvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9O1xuICBzdWJUeXBlLnByb3RvdHlwZSA9IG5ldyBjdXJUeXBlO1xuICBzdWJUeXBlLmV4dGVuZCA9IGN1clR5cGUuZXh0ZW5kO1xuICBzdWJUeXBlLmRlZiA9IGN1clR5cGUuZGVmO1xuICBpZiAob3B0aW9ucylcbiAgICBfYXNzaWduKHN1YlR5cGUucHJvdG90eXBlLCBvcHRpb25zKTtcbiAgcmV0dXJuIHN1YlR5cGU7XG59O1xuXG5WaXNpdG9yLmRlZih7XG4gIHZpc2l0OiBmdW5jdGlvbiAoY29udGVudC8qLCAuLi4qLykge1xuICAgIGlmIChjb250ZW50ID09IG51bGwpXG4gICAgICAvLyBudWxsIG9yIHVuZGVmaW5lZC5cbiAgICAgIHJldHVybiB0aGlzLnZpc2l0TnVsbC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgaWYgKHR5cGVvZiBjb250ZW50ID09PSAnb2JqZWN0Jykge1xuICAgICAgaWYgKGNvbnRlbnQuaHRtbGpzVHlwZSkge1xuICAgICAgICBzd2l0Y2ggKGNvbnRlbnQuaHRtbGpzVHlwZSkge1xuICAgICAgICBjYXNlIFRhZy5odG1sanNUeXBlOlxuICAgICAgICAgIHJldHVybiB0aGlzLnZpc2l0VGFnLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIGNhc2UgQ2hhclJlZi5odG1sanNUeXBlOlxuICAgICAgICAgIHJldHVybiB0aGlzLnZpc2l0Q2hhclJlZi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICBjYXNlIENvbW1lbnQuaHRtbGpzVHlwZTpcbiAgICAgICAgICByZXR1cm4gdGhpcy52aXNpdENvbW1lbnQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgY2FzZSBSYXcuaHRtbGpzVHlwZTpcbiAgICAgICAgICByZXR1cm4gdGhpcy52aXNpdFJhdy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVua25vd24gaHRtbGpzIHR5cGU6IFwiICsgY29udGVudC5odG1sanNUeXBlKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoaXNBcnJheShjb250ZW50KSlcbiAgICAgICAgcmV0dXJuIHRoaXMudmlzaXRBcnJheS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgICByZXR1cm4gdGhpcy52aXNpdE9iamVjdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgfSBlbHNlIGlmICgodHlwZW9mIGNvbnRlbnQgPT09ICdzdHJpbmcnKSB8fFxuICAgICAgICAgICAgICAgKHR5cGVvZiBjb250ZW50ID09PSAnYm9vbGVhbicpIHx8XG4gICAgICAgICAgICAgICAodHlwZW9mIGNvbnRlbnQgPT09ICdudW1iZXInKSkge1xuICAgICAgcmV0dXJuIHRoaXMudmlzaXRQcmltaXRpdmUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGNvbnRlbnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiB0aGlzLnZpc2l0RnVuY3Rpb24uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmV4cGVjdGVkIG9iamVjdCBpbiBodG1sanM6IFwiICsgY29udGVudCk7XG5cbiAgfSxcbiAgdmlzaXROdWxsOiBmdW5jdGlvbiAobnVsbE9yVW5kZWZpbmVkLyosIC4uLiovKSB7fSxcbiAgdmlzaXRQcmltaXRpdmU6IGZ1bmN0aW9uIChzdHJpbmdCb29sZWFuT3JOdW1iZXIvKiwgLi4uKi8pIHt9LFxuICB2aXNpdEFycmF5OiBmdW5jdGlvbiAoYXJyYXkvKiwgLi4uKi8pIHt9LFxuICB2aXNpdENvbW1lbnQ6IGZ1bmN0aW9uIChjb21tZW50LyosIC4uLiovKSB7fSxcbiAgdmlzaXRDaGFyUmVmOiBmdW5jdGlvbiAoY2hhclJlZi8qLCAuLi4qLykge30sXG4gIHZpc2l0UmF3OiBmdW5jdGlvbiAocmF3LyosIC4uLiovKSB7fSxcbiAgdmlzaXRUYWc6IGZ1bmN0aW9uICh0YWcvKiwgLi4uKi8pIHt9LFxuICB2aXNpdE9iamVjdDogZnVuY3Rpb24gKG9iai8qLCAuLi4qLykge1xuICAgIHRocm93IG5ldyBFcnJvcihcIlVuZXhwZWN0ZWQgb2JqZWN0IGluIGh0bWxqczogXCIgKyBvYmopO1xuICB9LFxuICB2aXNpdEZ1bmN0aW9uOiBmdW5jdGlvbiAoZm4vKiwgLi4uKi8pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmV4cGVjdGVkIGZ1bmN0aW9uIGluIGh0bWxqczogXCIgKyBmbik7XG4gIH1cbn0pO1xuXG5leHBvcnQgY29uc3QgVHJhbnNmb3JtaW5nVmlzaXRvciA9IFZpc2l0b3IuZXh0ZW5kKCk7XG5UcmFuc2Zvcm1pbmdWaXNpdG9yLmRlZih7XG4gIHZpc2l0TnVsbDogSURFTlRJVFksXG4gIHZpc2l0UHJpbWl0aXZlOiBJREVOVElUWSxcbiAgdmlzaXRBcnJheTogZnVuY3Rpb24gKGFycmF5LCAuLi5hcmdzKSB7XG4gICAgdmFyIHJlc3VsdCA9IGFycmF5O1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBvbGRJdGVtID0gYXJyYXlbaV07XG4gICAgICB2YXIgbmV3SXRlbSA9IHRoaXMudmlzaXQob2xkSXRlbSwgLi4uYXJncyk7XG4gICAgICBpZiAobmV3SXRlbSAhPT0gb2xkSXRlbSkge1xuICAgICAgICAvLyBjb3B5IGBhcnJheWAgb24gd3JpdGVcbiAgICAgICAgaWYgKHJlc3VsdCA9PT0gYXJyYXkpXG4gICAgICAgICAgcmVzdWx0ID0gYXJyYXkuc2xpY2UoKTtcbiAgICAgICAgcmVzdWx0W2ldID0gbmV3SXRlbTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSxcbiAgdmlzaXRDb21tZW50OiBJREVOVElUWSxcbiAgdmlzaXRDaGFyUmVmOiBJREVOVElUWSxcbiAgdmlzaXRSYXc6IElERU5USVRZLFxuICB2aXNpdE9iamVjdDogZnVuY3Rpb24ob2JqLCAuLi5hcmdzKXtcbiAgICAvLyBEb24ndCBwYXJzZSBNYXJrZG93biAmIFJDRGF0YSBhcyBIVE1MXG4gICAgaWYgKG9iai50ZXh0TW9kZSAhPSBudWxsKXtcbiAgICAgIHJldHVybiBvYmo7XG4gICAgfVxuICAgIGlmICgnY29udGVudCcgaW4gb2JqKSB7XG4gICAgICBvYmouY29udGVudCA9IHRoaXMudmlzaXQob2JqLmNvbnRlbnQsIC4uLmFyZ3MpO1xuICAgIH1cbiAgICBpZiAoJ2Vsc2VDb250ZW50JyBpbiBvYmope1xuICAgICAgb2JqLmVsc2VDb250ZW50ID0gdGhpcy52aXNpdChvYmouZWxzZUNvbnRlbnQsIC4uLmFyZ3MpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqO1xuICB9LFxuICB2aXNpdEZ1bmN0aW9uOiBJREVOVElUWSxcbiAgdmlzaXRUYWc6IGZ1bmN0aW9uICh0YWcsIC4uLmFyZ3MpIHtcbiAgICB2YXIgb2xkQ2hpbGRyZW4gPSB0YWcuY2hpbGRyZW47XG4gICAgdmFyIG5ld0NoaWxkcmVuID0gdGhpcy52aXNpdENoaWxkcmVuKG9sZENoaWxkcmVuLCAuLi5hcmdzKTtcblxuICAgIHZhciBvbGRBdHRycyA9IHRhZy5hdHRycztcbiAgICB2YXIgbmV3QXR0cnMgPSB0aGlzLnZpc2l0QXR0cmlidXRlcyhvbGRBdHRycywgLi4uYXJncyk7XG5cbiAgICBpZiAobmV3QXR0cnMgPT09IG9sZEF0dHJzICYmIG5ld0NoaWxkcmVuID09PSBvbGRDaGlsZHJlbilcbiAgICAgIHJldHVybiB0YWc7XG5cbiAgICB2YXIgbmV3VGFnID0gZ2V0VGFnKHRhZy50YWdOYW1lKS5hcHBseShudWxsLCBuZXdDaGlsZHJlbik7XG4gICAgbmV3VGFnLmF0dHJzID0gbmV3QXR0cnM7XG4gICAgcmV0dXJuIG5ld1RhZztcbiAgfSxcbiAgdmlzaXRDaGlsZHJlbjogZnVuY3Rpb24gKGNoaWxkcmVuLCAuLi5hcmdzKSB7XG4gICAgcmV0dXJuIHRoaXMudmlzaXRBcnJheShjaGlsZHJlbiwgLi4uYXJncyk7XG4gIH0sXG4gIC8vIFRyYW5zZm9ybSB0aGUgYC5hdHRyc2AgcHJvcGVydHkgb2YgYSB0YWcsIHdoaWNoIG1heSBiZSBhIGRpY3Rpb25hcnksXG4gIC8vIGFuIGFycmF5LCBvciBpbiBzb21lIHVzZXMsIGEgZm9yZWlnbiBvYmplY3QgKHN1Y2ggYXNcbiAgLy8gYSB0ZW1wbGF0ZSB0YWcpLlxuICB2aXNpdEF0dHJpYnV0ZXM6IGZ1bmN0aW9uIChhdHRycywgLi4uYXJncykge1xuICAgIGlmIChpc0FycmF5KGF0dHJzKSkge1xuICAgICAgdmFyIHJlc3VsdCA9IGF0dHJzO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhdHRycy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgb2xkSXRlbSA9IGF0dHJzW2ldO1xuICAgICAgICB2YXIgbmV3SXRlbSA9IHRoaXMudmlzaXRBdHRyaWJ1dGVzKG9sZEl0ZW0sIC4uLmFyZ3MpO1xuICAgICAgICBpZiAobmV3SXRlbSAhPT0gb2xkSXRlbSkge1xuICAgICAgICAgIC8vIGNvcHkgb24gd3JpdGVcbiAgICAgICAgICBpZiAocmVzdWx0ID09PSBhdHRycylcbiAgICAgICAgICAgIHJlc3VsdCA9IGF0dHJzLnNsaWNlKCk7XG4gICAgICAgICAgcmVzdWx0W2ldID0gbmV3SXRlbTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBpZiAoYXR0cnMgJiYgaXNDb25zdHJ1Y3RlZE9iamVjdChhdHRycykpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBiYXNpYyBUcmFuc2Zvcm1pbmdWaXNpdG9yIGRvZXMgbm90IHN1cHBvcnQgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgIFwiZm9yZWlnbiBvYmplY3RzIGluIGF0dHJpYnV0ZXMuICBEZWZpbmUgYSBjdXN0b20gXCIgK1xuICAgICAgICAgICAgICAgICAgICAgIFwidmlzaXRBdHRyaWJ1dGVzIGZvciB0aGlzIGNhc2UuXCIpO1xuICAgIH1cblxuICAgIHZhciBvbGRBdHRycyA9IGF0dHJzO1xuICAgIHZhciBuZXdBdHRycyA9IG9sZEF0dHJzO1xuICAgIGlmIChvbGRBdHRycykge1xuICAgICAgdmFyIGF0dHJBcmdzID0gW251bGwsIG51bGxdO1xuICAgICAgYXR0ckFyZ3MucHVzaC5hcHBseShhdHRyQXJncywgYXJndW1lbnRzKTtcbiAgICAgIGZvciAodmFyIGsgaW4gb2xkQXR0cnMpIHtcbiAgICAgICAgdmFyIG9sZFZhbHVlID0gb2xkQXR0cnNba107XG4gICAgICAgIGF0dHJBcmdzWzBdID0gaztcbiAgICAgICAgYXR0ckFyZ3NbMV0gPSBvbGRWYWx1ZTtcbiAgICAgICAgdmFyIG5ld1ZhbHVlID0gdGhpcy52aXNpdEF0dHJpYnV0ZS5hcHBseSh0aGlzLCBhdHRyQXJncyk7XG4gICAgICAgIGlmIChuZXdWYWx1ZSAhPT0gb2xkVmFsdWUpIHtcbiAgICAgICAgICAvLyBjb3B5IG9uIHdyaXRlXG4gICAgICAgICAgaWYgKG5ld0F0dHJzID09PSBvbGRBdHRycylcbiAgICAgICAgICAgIG5ld0F0dHJzID0gX2Fzc2lnbih7fSwgb2xkQXR0cnMpO1xuICAgICAgICAgIG5ld0F0dHJzW2tdID0gbmV3VmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbmV3QXR0cnM7XG4gIH0sXG4gIC8vIFRyYW5zZm9ybSB0aGUgdmFsdWUgb2Ygb25lIGF0dHJpYnV0ZSBuYW1lL3ZhbHVlIGluIGFuXG4gIC8vIGF0dHJpYnV0ZXMgZGljdGlvbmFyeS5cbiAgdmlzaXRBdHRyaWJ1dGU6IGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSwgdGFnLCAuLi5hcmdzKSB7XG4gICAgcmV0dXJuIHRoaXMudmlzaXQodmFsdWUsIC4uLmFyZ3MpO1xuICB9XG59KTtcblxuXG5leHBvcnQgY29uc3QgVG9UZXh0VmlzaXRvciA9IFZpc2l0b3IuZXh0ZW5kKCk7XG5Ub1RleHRWaXNpdG9yLmRlZih7XG4gIHZpc2l0TnVsbDogZnVuY3Rpb24gKG51bGxPclVuZGVmaW5lZCkge1xuICAgIHJldHVybiAnJztcbiAgfSxcbiAgdmlzaXRQcmltaXRpdmU6IGZ1bmN0aW9uIChzdHJpbmdCb29sZWFuT3JOdW1iZXIpIHtcbiAgICB2YXIgc3RyID0gU3RyaW5nKHN0cmluZ0Jvb2xlYW5Pck51bWJlcik7XG4gICAgaWYgKHRoaXMudGV4dE1vZGUgPT09IFRFWFRNT0RFLlJDREFUQSkge1xuICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKC8mL2csICcmYW1wOycpLnJlcGxhY2UoLzwvZywgJyZsdDsnKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMudGV4dE1vZGUgPT09IFRFWFRNT0RFLkFUVFJJQlVURSkge1xuICAgICAgLy8gZXNjYXBlIGAmYCBhbmQgYFwiYCB0aGlzIHRpbWUsIG5vdCBgJmAgYW5kIGA8YFxuICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKC8mL2csICcmYW1wOycpLnJlcGxhY2UoL1wiL2csICcmcXVvdDsnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gIH0sXG4gIHZpc2l0QXJyYXk6IGZ1bmN0aW9uIChhcnJheSkge1xuICAgIHZhciBwYXJ0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspXG4gICAgICBwYXJ0cy5wdXNoKHRoaXMudmlzaXQoYXJyYXlbaV0pKTtcbiAgICByZXR1cm4gcGFydHMuam9pbignJyk7XG4gIH0sXG4gIHZpc2l0Q29tbWVudDogZnVuY3Rpb24gKGNvbW1lbnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW4ndCBoYXZlIGEgY29tbWVudCBoZXJlXCIpO1xuICB9LFxuICB2aXNpdENoYXJSZWY6IGZ1bmN0aW9uIChjaGFyUmVmKSB7XG4gICAgaWYgKHRoaXMudGV4dE1vZGUgPT09IFRFWFRNT0RFLlJDREFUQSB8fFxuICAgICAgICB0aGlzLnRleHRNb2RlID09PSBURVhUTU9ERS5BVFRSSUJVVEUpIHtcbiAgICAgIHJldHVybiBjaGFyUmVmLmh0bWw7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjaGFyUmVmLnN0cjtcbiAgICB9XG4gIH0sXG4gIHZpc2l0UmF3OiBmdW5jdGlvbiAocmF3KSB7XG4gICAgcmV0dXJuIHJhdy52YWx1ZTtcbiAgfSxcbiAgdmlzaXRUYWc6IGZ1bmN0aW9uICh0YWcpIHtcbiAgICAvLyBSZWFsbHkgd2Ugc2hvdWxkIGp1c3QgZGlzYWxsb3cgVGFncyBoZXJlLiAgSG93ZXZlciwgYXQgdGhlXG4gICAgLy8gbW9tZW50IGl0J3MgdXNlZnVsIHRvIHN0cmluZ2lmeSBhbnkgSFRNTCB3ZSBmaW5kLiAgSW5cbiAgICAvLyBwYXJ0aWN1bGFyLCB3aGVuIHlvdSBpbmNsdWRlIGEgdGVtcGxhdGUgd2l0aGluIGB7eyNtYXJrZG93bn19YCxcbiAgICAvLyB3ZSByZW5kZXIgdGhlIHRlbXBsYXRlIGFzIHRleHQsIGFuZCBzaW5jZSB0aGVyZSdzIGN1cnJlbnRseVxuICAgIC8vIG5vIHdheSB0byBtYWtlIHRoZSB0ZW1wbGF0ZSBiZSAqcGFyc2VkKiBhcyB0ZXh0IChlLmcuIGA8dGVtcGxhdGVcbiAgICAvLyB0eXBlPVwidGV4dFwiPmApLCB3ZSBoYWNraXNobHkgc3VwcG9ydCBIVE1MIHRhZ3MgaW4gbWFya2Rvd25cbiAgICAvLyBpbiB0ZW1wbGF0ZXMgYnkgcGFyc2luZyB0aGVtIGFuZCBzdHJpbmdpZnlpbmcgdGhlbS5cbiAgICByZXR1cm4gdGhpcy52aXNpdCh0aGlzLnRvSFRNTCh0YWcpKTtcbiAgfSxcbiAgdmlzaXRPYmplY3Q6IGZ1bmN0aW9uICh4KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiVW5leHBlY3RlZCBvYmplY3QgaW4gaHRtbGpzIGluIHRvVGV4dDogXCIgKyB4KTtcbiAgfSxcbiAgdG9IVE1MOiBmdW5jdGlvbiAobm9kZSkge1xuICAgIHJldHVybiB0b0hUTUwobm9kZSk7XG4gIH1cbn0pO1xuXG5cblxuZXhwb3J0IGNvbnN0IFRvSFRNTFZpc2l0b3IgPSBWaXNpdG9yLmV4dGVuZCgpO1xuVG9IVE1MVmlzaXRvci5kZWYoe1xuICB2aXNpdE51bGw6IGZ1bmN0aW9uIChudWxsT3JVbmRlZmluZWQpIHtcbiAgICByZXR1cm4gJyc7XG4gIH0sXG4gIHZpc2l0UHJpbWl0aXZlOiBmdW5jdGlvbiAoc3RyaW5nQm9vbGVhbk9yTnVtYmVyKSB7XG4gICAgdmFyIHN0ciA9IFN0cmluZyhzdHJpbmdCb29sZWFuT3JOdW1iZXIpO1xuICAgIHJldHVybiBzdHIucmVwbGFjZSgvJi9nLCAnJmFtcDsnKS5yZXBsYWNlKC88L2csICcmbHQ7Jyk7XG4gIH0sXG4gIHZpc2l0QXJyYXk6IGZ1bmN0aW9uIChhcnJheSkge1xuICAgIHZhciBwYXJ0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspXG4gICAgICBwYXJ0cy5wdXNoKHRoaXMudmlzaXQoYXJyYXlbaV0pKTtcbiAgICByZXR1cm4gcGFydHMuam9pbignJyk7XG4gIH0sXG4gIHZpc2l0Q29tbWVudDogZnVuY3Rpb24gKGNvbW1lbnQpIHtcbiAgICByZXR1cm4gJzwhLS0nICsgY29tbWVudC5zYW5pdGl6ZWRWYWx1ZSArICctLT4nO1xuICB9LFxuICB2aXNpdENoYXJSZWY6IGZ1bmN0aW9uIChjaGFyUmVmKSB7XG4gICAgcmV0dXJuIGNoYXJSZWYuaHRtbDtcbiAgfSxcbiAgdmlzaXRSYXc6IGZ1bmN0aW9uIChyYXcpIHtcbiAgICByZXR1cm4gcmF3LnZhbHVlO1xuICB9LFxuICB2aXNpdFRhZzogZnVuY3Rpb24gKHRhZykge1xuICAgIHZhciBhdHRyU3RycyA9IFtdO1xuXG4gICAgdmFyIHRhZ05hbWUgPSB0YWcudGFnTmFtZTtcbiAgICB2YXIgY2hpbGRyZW4gPSB0YWcuY2hpbGRyZW47XG5cbiAgICB2YXIgYXR0cnMgPSB0YWcuYXR0cnM7XG4gICAgaWYgKGF0dHJzKSB7XG4gICAgICBhdHRycyA9IGZsYXR0ZW5BdHRyaWJ1dGVzKGF0dHJzKTtcbiAgICAgIGZvciAodmFyIGsgaW4gYXR0cnMpIHtcbiAgICAgICAgaWYgKGsgPT09ICd2YWx1ZScgJiYgdGFnTmFtZSA9PT0gJ3RleHRhcmVhJykge1xuICAgICAgICAgIGNoaWxkcmVuID0gW2F0dHJzW2tdLCBjaGlsZHJlbl07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIHYgPSB0aGlzLnRvVGV4dChhdHRyc1trXSwgVEVYVE1PREUuQVRUUklCVVRFKTtcbiAgICAgICAgICBhdHRyU3Rycy5wdXNoKCcgJyArIGsgKyAnPVwiJyArIHYgKyAnXCInKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBzdGFydFRhZyA9ICc8JyArIHRhZ05hbWUgKyBhdHRyU3Rycy5qb2luKCcnKSArICc+JztcblxuICAgIHZhciBjaGlsZFN0cnMgPSBbXTtcbiAgICB2YXIgY29udGVudDtcbiAgICBpZiAodGFnTmFtZSA9PT0gJ3RleHRhcmVhJykge1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKVxuICAgICAgICBjaGlsZFN0cnMucHVzaCh0aGlzLnRvVGV4dChjaGlsZHJlbltpXSwgVEVYVE1PREUuUkNEQVRBKSk7XG5cbiAgICAgIGNvbnRlbnQgPSBjaGlsZFN0cnMuam9pbignJyk7XG4gICAgICBpZiAoY29udGVudC5zbGljZSgwLCAxKSA9PT0gJ1xcbicpXG4gICAgICAgIC8vIFRFWFRBUkVBIHdpbGwgYWJzb3JiIGEgbmV3bGluZSwgc28gaWYgd2Ugc2VlIG9uZSwgYWRkXG4gICAgICAgIC8vIGFub3RoZXIgb25lLlxuICAgICAgICBjb250ZW50ID0gJ1xcbicgKyBjb250ZW50O1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspXG4gICAgICAgIGNoaWxkU3Rycy5wdXNoKHRoaXMudmlzaXQoY2hpbGRyZW5baV0pKTtcblxuICAgICAgY29udGVudCA9IGNoaWxkU3Rycy5qb2luKCcnKTtcbiAgICB9XG5cbiAgICB2YXIgcmVzdWx0ID0gc3RhcnRUYWcgKyBjb250ZW50O1xuXG4gICAgaWYgKGNoaWxkcmVuLmxlbmd0aCB8fCAhIGlzVm9pZEVsZW1lbnQodGFnTmFtZSkpIHtcbiAgICAgIC8vIFwiVm9pZFwiIGVsZW1lbnRzIGxpa2UgQlIgYXJlIHRoZSBvbmx5IG9uZXMgdGhhdCBkb24ndCBnZXQgYSBjbG9zZVxuICAgICAgLy8gdGFnIGluIEhUTUw1LiAgVGhleSBzaG91bGRuJ3QgaGF2ZSBjb250ZW50cywgZWl0aGVyLCBzbyB3ZSBjb3VsZFxuICAgICAgLy8gdGhyb3cgYW4gZXJyb3IgdXBvbiBzZWVpbmcgY29udGVudHMgaGVyZS5cbiAgICAgIHJlc3VsdCArPSAnPC8nICsgdGFnTmFtZSArICc+JztcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9LFxuICB2aXNpdE9iamVjdDogZnVuY3Rpb24gKHgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmV4cGVjdGVkIG9iamVjdCBpbiBodG1sanMgaW4gdG9IVE1MOiBcIiArIHgpO1xuICB9LFxuICB0b1RleHQ6IGZ1bmN0aW9uIChub2RlLCB0ZXh0TW9kZSkge1xuICAgIHJldHVybiB0b1RleHQobm9kZSwgdGV4dE1vZGUpO1xuICB9XG59KTtcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLyBUT0hUTUxcblxuZXhwb3J0IGZ1bmN0aW9uIHRvSFRNTChjb250ZW50KSB7XG4gIHJldHVybiAobmV3IFRvSFRNTFZpc2l0b3IpLnZpc2l0KGNvbnRlbnQpO1xufVxuXG4vLyBFc2NhcGluZyBtb2RlcyBmb3Igb3V0cHV0dGluZyB0ZXh0IHdoZW4gZ2VuZXJhdGluZyBIVE1MLlxuZXhwb3J0IGNvbnN0IFRFWFRNT0RFID0ge1xuICBTVFJJTkc6IDEsXG4gIFJDREFUQTogMixcbiAgQVRUUklCVVRFOiAzXG59O1xuXG5cbmV4cG9ydCBmdW5jdGlvbiB0b1RleHQoY29udGVudCwgdGV4dE1vZGUpIHtcbiAgaWYgKCEgdGV4dE1vZGUpXG4gICAgdGhyb3cgbmV3IEVycm9yKFwidGV4dE1vZGUgcmVxdWlyZWQgZm9yIEhUTUwudG9UZXh0XCIpO1xuICBpZiAoISAodGV4dE1vZGUgPT09IFRFWFRNT0RFLlNUUklORyB8fFxuICAgICAgICAgdGV4dE1vZGUgPT09IFRFWFRNT0RFLlJDREFUQSB8fFxuICAgICAgICAgdGV4dE1vZGUgPT09IFRFWFRNT0RFLkFUVFJJQlVURSkpXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiVW5rbm93biB0ZXh0TW9kZTogXCIgKyB0ZXh0TW9kZSk7XG5cbiAgdmFyIHZpc2l0b3IgPSBuZXcgVG9UZXh0VmlzaXRvcih7dGV4dE1vZGU6IHRleHRNb2RlfSk7XG4gIHJldHVybiB2aXNpdG9yLnZpc2l0KGNvbnRlbnQpO1xufVxuIl19
