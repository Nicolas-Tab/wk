(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ReactiveVar = Package['reactive-var'].ReactiveVar;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var _ = Package.underscore._;
var assert = Package['peerlibrary:assert'].assert;
var ReactiveField = Package['peerlibrary:reactive-field'].ReactiveField;
var ComputedField = Package['peerlibrary:computed-field'].ComputedField;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var __coffeescriptShare, BaseComponent, componentClass, componentName, componentsNamespace, propertyOrMatcherOrFunction, methods, constructor, BaseComponentDebug, component;

(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/peerlibrary_base-component/lib.coffee                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
// Comparing arrays of components by reference. This might not be really necessary
// to do, because all operations we officially support modify length of the array
// (add a new component or remove an old one). But if somebody is modifying the
// reactive variable directly we want a sane behavior. The default ReactiveVar
// equality always returns false when comparing any non-primitive values. Because
// the order of components in the children array is arbitrary we could further
// improve this comparison to compare arrays as sets, ignoring the order. Or we
// could have some canonical order of components in the array.
var ComponentsNamespace,
  addComponentChildDeprecationWarning,
  arrayReferenceEquals,
  childrenComponentsDeprecationWarning,
  childrenComponentsWithDeprecationWarning,
  componentChildrenDeprecationWarning,
  componentChildrenWithDeprecationWarning,
  componentParentDeprecationWarning,
  createMatcher,
  createNamespace,
  getComponent,
  getNamespace,
  getPathAndName,
  removeComponentChildDeprecationWarning,
  setComponent,
  hasProp = {}.hasOwnProperty;
arrayReferenceEquals = function (a, b) {
  var i, j, ref;
  if (a.length !== b.length) {
    return false;
  }
  for (i = j = 0, ref = a.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
};
createMatcher = function (propertyOrMatcherOrFunction) {
  var matcher, property;
  if (_.isString(propertyOrMatcherOrFunction)) {
    property = propertyOrMatcherOrFunction;
    propertyOrMatcherOrFunction = (child, parent) => {
      return property in child;
    };
  } else if (!_.isFunction(propertyOrMatcherOrFunction)) {
    assert(_.isObject(propertyOrMatcherOrFunction));
    matcher = propertyOrMatcherOrFunction;
    propertyOrMatcherOrFunction = (child, parent) => {
      var value;
      for (property in matcher) {
        value = matcher[property];
        if (!(property in child)) {
          return false;
        }
        if (_.isFunction(child[property])) {
          if (child[property]() !== value) {
            return false;
          }
        } else {
          if (child[property] !== value) {
            return false;
          }
        }
      }
      return true;
    };
  }
  return propertyOrMatcherOrFunction;
};
ComponentsNamespace = function () {
  class ComponentsNamespace {}
  ;

  // We have a special field for components. This allows us to have the namespace with the same name
  // as a component, without overriding anything in the component (we do not want to use component
  // object as a namespace object).
  ComponentsNamespace.COMPONENTS_FIELD = '';
  return ComponentsNamespace;
}.call(this);
getPathAndName = function (name) {
  var path;
  assert(name);
  path = name.split('.');
  name = path.pop();
  assert(name);
  return {
    path,
    name
  };
};
getNamespace = function (components, path) {
  var match, segment;
  assert(_.isObject(components));
  assert(_.isArray(path));
  match = components;
  while ((segment = path.shift()) != null) {
    match = match[segment];
    if (!_.isObject(match)) {
      return null;
    }
  }
  if (!_.isObject(match)) {
    return null;
  }
  return match || null;
};
createNamespace = function (components, path) {
  var match, segment;
  assert(_.isObject(components));
  assert(_.isArray(path));
  match = components;
  while ((segment = path.shift()) != null) {
    if (!(segment in match)) {
      match[segment] = new components.constructor();
    }
    match = match[segment];
    assert(_.isObject(match));
  }
  assert(_.isObject(match));
  return match;
};
getComponent = function (components, name) {
  var namespace, path, ref;
  assert(_.isObject(components));
  if (!name) {
    return null;
  }
  ({
    path,
    name
  } = getPathAndName(name));
  namespace = getNamespace(components, path);
  if (!namespace) {
    return null;
  }
  return ((ref = namespace[components.constructor.COMPONENTS_FIELD]) != null ? ref[name] : void 0) || null;
};
setComponent = function (components, name, component) {
  var name1, namespace, path;
  assert(_.isObject(components));
  assert(name);
  assert(component);
  ({
    path,
    name
  } = getPathAndName(name));
  namespace = createNamespace(components, path);
  if (namespace[name1 = components.constructor.COMPONENTS_FIELD] == null) {
    namespace[name1] = new components.constructor();
  }
  assert(!(name in namespace[components.constructor.COMPONENTS_FIELD]));
  return namespace[components.constructor.COMPONENTS_FIELD][name] = component;
};
componentChildrenDeprecationWarning = false;
componentChildrenWithDeprecationWarning = false;
addComponentChildDeprecationWarning = false;
removeComponentChildDeprecationWarning = false;
componentParentDeprecationWarning = false;
childrenComponentsDeprecationWarning = false;
childrenComponentsWithDeprecationWarning = false;
BaseComponent = function () {
  class BaseComponent {
    static register(componentName, componentClass) {
      if (!componentName) {
        throw new Error("Component name is required for registration.");
      }
      // To allow calling @register 'name' from inside a class body.
      if (componentClass == null) {
        componentClass = this;
      }
      if (getComponent(this.components, componentName)) {
        throw new Error("Component '".concat(componentName, "' already registered."));
      }
      // The last condition is to make sure we do not throw the exception when registering a subclass.
      // Subclassed components have at this stage the same component as the parent component, so we have
      // to check if they are the same class. If not, this is not an error, it is a subclass.
      if (componentClass.componentName() && componentClass.componentName() !== componentName && getComponent(this.components, componentClass.componentName()) === componentClass) {
        throw new Error("Component '".concat(componentName, "' already registered under the name '").concat(componentClass.componentName(), "'."));
      }
      componentClass.componentName(componentName);
      assert.equal(componentClass.componentName(), componentName);
      setComponent(this.components, componentName, componentClass);
      return this;
    }
    static getComponent(componentsNamespace, componentName) {
      if (!componentName) {
        componentName = componentsNamespace;
        componentsNamespace = this.components;
      }
      if (!componentName) {
        // If component is missing, just return a null.
        return null;
      }
      if (!_.isString(componentName)) {
        // But otherwise throw an exception.
        throw new Error("Component name '".concat(componentName, "' is not a string."));
      }
      return getComponent(componentsNamespace, componentName);
    }

    // Component name is set in the register class method. If not using a registered component and a component name is
    // wanted, component name has to be set manually or this class method should be overridden with a custom implementation.
    // Care should be taken that unregistered components have their own name and not the name of their parent class, which
    // they would have by default. Probably component name should be set in the constructor for such classes, or by calling
    // componentName class method manually on the new class of this new component.
    static componentName(componentName) {
      // Setter.
      if (componentName) {
        this._componentName = componentName;
        // To allow chaining.
        return this;
      }
      // Getter.
      return this._componentName || null;
    }

    // We allow access to the component name through a method so that it can be accessed in templates in an easy way.
    // It should never be overridden. The implementation should always be exactly the same as class method implementation.
    componentName() {
      // Instance method is just a getter, not a setter as well.
      return this.constructor.componentName();
    }

    // The order of components is arbitrary and does not necessary match siblings relations in DOM.
    // nameOrComponent is optional and it limits the returned children only to those.
    childComponents(nameOrComponent) {
      var base, child;
      if (this._componentInternals == null) {
        this._componentInternals = {};
      }
      if ((base = this._componentInternals).childComponents == null) {
        base.childComponents = new ReactiveField([], arrayReferenceEquals);
      }
      if (!nameOrComponent) {
        return function () {
          var j, len, ref, results1;
          ref = this._componentInternals.childComponents();
          results1 = [];
          for (j = 0, len = ref.length; j < len; j++) {
            child = ref[j];
            // Quick path. Returns a shallow copy.
            results1.push(child);
          }
          return results1;
        }.call(this);
      }
      if (_.isString(nameOrComponent)) {
        return this.childComponentsWith((child, parent) => {
          return child.componentName() === nameOrComponent;
        });
      } else {
        return this.childComponentsWith((child, parent) => {
          if (child.constructor === nameOrComponent) {
            // nameOrComponent is a class.
            return true;
          }
          if (child === nameOrComponent) {
            // nameOrComponent is an instance, or something else.
            return true;
          }
          return false;
        });
      }
    }

    // The order of components is arbitrary and does not necessary match siblings relations in DOM.
    // Returns children which pass a predicate function.
    childComponentsWith(propertyOrMatcherOrFunction) {
      var results;
      assert(propertyOrMatcherOrFunction);
      propertyOrMatcherOrFunction = createMatcher(propertyOrMatcherOrFunction);
      results = new ComputedField(() => {
        var child, j, len, ref, results1;
        ref = this.childComponents();
        results1 = [];
        for (j = 0, len = ref.length; j < len; j++) {
          child = ref[j];
          if (propertyOrMatcherOrFunction.call(this, child, this)) {
            results1.push(child);
          }
        }
        return results1;
      }, arrayReferenceEquals);
      return results();
    }
    addChildComponent(childComponent) {
      var base;
      if (this._componentInternals == null) {
        this._componentInternals = {};
      }
      if ((base = this._componentInternals).childComponents == null) {
        base.childComponents = new ReactiveField([], arrayReferenceEquals);
      }
      this._componentInternals.childComponents(Tracker.nonreactive(() => {
        return this._componentInternals.childComponents().concat([childComponent]);
      }));
      return this;
    }
    removeChildComponent(childComponent) {
      var base;
      if (this._componentInternals == null) {
        this._componentInternals = {};
      }
      if ((base = this._componentInternals).childComponents == null) {
        base.childComponents = new ReactiveField([], arrayReferenceEquals);
      }
      this._componentInternals.childComponents(Tracker.nonreactive(() => {
        return _.without(this._componentInternals.childComponents(), childComponent);
      }));
      return this;
    }
    parentComponent(parentComponent) {
      var base;
      if (this._componentInternals == null) {
        this._componentInternals = {};
      }
      // We use reference equality here. This makes reactivity not invalidate the
      // computation if the same component instance (by reference) is set as a parent.
      if ((base = this._componentInternals).parentComponent == null) {
        base.parentComponent = new ReactiveField(null, function (a, b) {
          return a === b;
        });
      }
      // Setter.
      if (!_.isUndefined(parentComponent)) {
        this._componentInternals.parentComponent(parentComponent);
        // To allow chaining.
        return this;
      }
      // Getter.
      return this._componentInternals.parentComponent();
    }
    static renderComponent(parentComponent) {
      throw new Error("Not implemented");
    }
    renderComponent(parentComponent) {
      throw new Error("Not implemented");
    }
    static extendComponent(constructor, methods) {
      var currentClass, property, ref, value;
      currentClass = this;
      if (_.isFunction(constructor)) {
        constructor.prototype = Object.create(currentClass.prototype, {
          constructor: {
            value: constructor,
            writable: true,
            configurable: true
          }
        });
        Object.setPrototypeOf(constructor, currentClass);
      } else {
        methods = constructor;
        constructor = class extends currentClass {};
      }
      ref = methods || {};
      for (property in ref) {
        if (!hasProp.call(ref, property)) continue;
        value = ref[property];
        constructor.prototype[property] = value;
      }
      return constructor;
    }

    // Deprecated method names.
    // TODO: Remove them in the future.

    // @deprecated Use childComponents instead.
    componentChildren() {
      if (!componentChildrenDeprecationWarning) {
        componentChildrenDeprecationWarning = true;
        if (typeof console !== "undefined" && console !== null) {
          console.warn("componentChildren has been deprecated. Use childComponents instead.");
        }
      }
      return this.childComponents(...arguments);
    }

    // @deprecated Use childComponentsWith instead.
    componentChildrenWith() {
      if (!componentChildrenWithDeprecationWarning) {
        componentChildrenWithDeprecationWarning = true;
        if (typeof console !== "undefined" && console !== null) {
          console.warn("componentChildrenWith has been deprecated. Use childComponentsWith instead.");
        }
      }
      return this.childComponentsWith(...arguments);
    }

    // @deprecated Use addChildComponent instead.
    addComponentChild() {
      if (!addComponentChildDeprecationWarning) {
        addComponentChildDeprecationWarning = true;
        if (typeof console !== "undefined" && console !== null) {
          console.warn("addComponentChild has been deprecated. Use addChildComponent instead.");
        }
      }
      return this.addChildComponent(...arguments);
    }

    // @deprecated Use removeChildComponent instead.
    removeComponentChild() {
      if (!removeComponentChildDeprecationWarning) {
        removeComponentChildDeprecationWarning = true;
        if (typeof console !== "undefined" && console !== null) {
          console.warn("removeComponentChild has been deprecated. Use removeChildComponent instead.");
        }
      }
      return this.removeChildComponent(...arguments);
    }

    // @deprecated Use parentComponent instead.
    componentParent() {
      if (!componentParentDeprecationWarning) {
        componentParentDeprecationWarning = true;
        if (typeof console !== "undefined" && console !== null) {
          console.warn("componentParent has been deprecated. Use parentComponent instead.");
        }
      }
      return this.parentComponent(...arguments);
    }

    // @deprecated Use childComponents instead.
    childrenComponents() {
      if (!componentChildrenDeprecationWarning) {
        componentChildrenDeprecationWarning = true;
        if (typeof console !== "undefined" && console !== null) {
          console.warn("childrenComponents has been deprecated. Use childComponents instead.");
        }
      }
      return this.childComponents(...arguments);
    }

    // @deprecated Use childComponentsWith instead.
    childrenComponentsWith() {
      if (!componentChildrenWithDeprecationWarning) {
        componentChildrenWithDeprecationWarning = true;
        if (typeof console !== "undefined" && console !== null) {
          console.warn("childrenComponentsWith has been deprecated. Use childComponentsWith instead.");
        }
      }
      return this.childComponentsWith(...arguments);
    }
  }
  ;
  BaseComponent.components = new ComponentsNamespace();
  return BaseComponent;
}.call(this);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/peerlibrary_base-component/debug.coffee                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
BaseComponentDebug = class BaseComponentDebug {
  static startComponent(component) {
    var name;
    name = component.componentName() || 'unnamed';
    console.group(name);
    return console.log('%o', component);
  }
  static endComponent(component) {
    return console.groupEnd();
  }
  static startMarkedComponent(component) {
    var name;
    name = component.componentName() || 'unnamed';
    console.group('%c%s', 'text-decoration: underline', name);
    return console.log('%o', component);
  }
  static endMarkedComponent(component) {
    return this.endComponent(component);
  }
  static dumpComponentSubtree(rootComponent) {
    let _markComponent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {};
    var child, i, len, marked, ref;
    if (!rootComponent) {
      return;
    }
    marked = _markComponent(rootComponent);
    if (marked) {
      this.startMarkedComponent(rootComponent);
    } else {
      this.startComponent(rootComponent);
    }
    ref = rootComponent.childComponents();
    for (i = 0, len = ref.length; i < len; i++) {
      child = ref[i];
      this.dumpComponentSubtree(child, _markComponent);
    }
    if (marked) {
      this.endMarkedComponent(rootComponent);
    } else {
      this.endComponent(rootComponent);
    }
  }
  static componentRoot(component) {
    var parentComponent;
    while (parentComponent = component.parentComponent()) {
      component = parentComponent;
    }
    return component;
  }
  static dumpComponentTree(component) {
    if (!component) {
      return;
    }
    return this.dumpComponentSubtree(this.componentRoot(component), function (c) {
      return c === component;
    });
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("peerlibrary:base-component", {
  BaseComponent: BaseComponent,
  BaseComponentDebug: BaseComponentDebug
});

})();

//# sourceURL=meteor://💻app/packages/peerlibrary_base-component.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcGVlcmxpYnJhcnlfYmFzZS1jb21wb25lbnQvbGliLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvbGliLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcGVlcmxpYnJhcnlfYmFzZS1jb21wb25lbnQvZGVidWcuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9kZWJ1Zy5jb2ZmZWUiXSwibmFtZXMiOlsiQ29tcG9uZW50c05hbWVzcGFjZSIsImFkZENvbXBvbmVudENoaWxkRGVwcmVjYXRpb25XYXJuaW5nIiwiYXJyYXlSZWZlcmVuY2VFcXVhbHMiLCJjaGlsZHJlbkNvbXBvbmVudHNEZXByZWNhdGlvbldhcm5pbmciLCJjaGlsZHJlbkNvbXBvbmVudHNXaXRoRGVwcmVjYXRpb25XYXJuaW5nIiwiY29tcG9uZW50Q2hpbGRyZW5EZXByZWNhdGlvbldhcm5pbmciLCJjb21wb25lbnRDaGlsZHJlbldpdGhEZXByZWNhdGlvbldhcm5pbmciLCJjb21wb25lbnRQYXJlbnREZXByZWNhdGlvbldhcm5pbmciLCJjcmVhdGVNYXRjaGVyIiwiY3JlYXRlTmFtZXNwYWNlIiwiZ2V0Q29tcG9uZW50IiwiZ2V0TmFtZXNwYWNlIiwiZ2V0UGF0aEFuZE5hbWUiLCJyZW1vdmVDb21wb25lbnRDaGlsZERlcHJlY2F0aW9uV2FybmluZyIsInNldENvbXBvbmVudCIsImhhc1Byb3AiLCJoYXNPd25Qcm9wZXJ0eSIsImEiLCJiIiwiaSIsImoiLCJyZWYiLCJsZW5ndGgiLCJwcm9wZXJ0eU9yTWF0Y2hlck9yRnVuY3Rpb24iLCJtYXRjaGVyIiwicHJvcGVydHkiLCJfIiwiaXNTdHJpbmciLCJjaGlsZCIsInBhcmVudCIsImlzRnVuY3Rpb24iLCJhc3NlcnQiLCJpc09iamVjdCIsInZhbHVlIiwiQ09NUE9ORU5UU19GSUVMRCIsImNhbGwiLCJuYW1lIiwicGF0aCIsInNwbGl0IiwicG9wIiwiY29tcG9uZW50cyIsIm1hdGNoIiwic2VnbWVudCIsImlzQXJyYXkiLCJzaGlmdCIsImNvbnN0cnVjdG9yIiwibmFtZXNwYWNlIiwiY29tcG9uZW50IiwibmFtZTEiLCJCYXNlQ29tcG9uZW50IiwicmVnaXN0ZXIiLCJjb21wb25lbnROYW1lIiwiY29tcG9uZW50Q2xhc3MiLCJFcnJvciIsImVxdWFsIiwiY29tcG9uZW50c05hbWVzcGFjZSIsIl9jb21wb25lbnROYW1lIiwiY2hpbGRDb21wb25lbnRzIiwibmFtZU9yQ29tcG9uZW50IiwiYmFzZSIsIl9jb21wb25lbnRJbnRlcm5hbHMiLCJSZWFjdGl2ZUZpZWxkIiwibGVuIiwicmVzdWx0czEiLCJwdXNoIiwiY2hpbGRDb21wb25lbnRzV2l0aCIsInJlc3VsdHMiLCJDb21wdXRlZEZpZWxkIiwiYWRkQ2hpbGRDb21wb25lbnQiLCJjaGlsZENvbXBvbmVudCIsIlRyYWNrZXIiLCJub25yZWFjdGl2ZSIsImNvbmNhdCIsInJlbW92ZUNoaWxkQ29tcG9uZW50Iiwid2l0aG91dCIsInBhcmVudENvbXBvbmVudCIsImlzVW5kZWZpbmVkIiwicmVuZGVyQ29tcG9uZW50IiwiZXh0ZW5kQ29tcG9uZW50IiwibWV0aG9kcyIsImN1cnJlbnRDbGFzcyIsInByb3RvdHlwZSIsIk9iamVjdCIsImNyZWF0ZSIsIndyaXRhYmxlIiwiY29uZmlndXJhYmxlIiwic2V0UHJvdG90eXBlT2YiLCJjb21wb25lbnRDaGlsZHJlbiIsImNvbnNvbGUiLCJ3YXJuIiwiY29tcG9uZW50Q2hpbGRyZW5XaXRoIiwiYWRkQ29tcG9uZW50Q2hpbGQiLCJyZW1vdmVDb21wb25lbnRDaGlsZCIsImNvbXBvbmVudFBhcmVudCIsImNoaWxkcmVuQ29tcG9uZW50cyIsImNoaWxkcmVuQ29tcG9uZW50c1dpdGgiLCJCYXNlQ29tcG9uZW50RGVidWciLCJzdGFydENvbXBvbmVudCIsImdyb3VwIiwibG9nIiwiZW5kQ29tcG9uZW50IiwiZ3JvdXBFbmQiLCJzdGFydE1hcmtlZENvbXBvbmVudCIsImVuZE1hcmtlZENvbXBvbmVudCIsImR1bXBDb21wb25lbnRTdWJ0cmVlIiwicm9vdENvbXBvbmVudCIsIl9tYXJrQ29tcG9uZW50IiwibWFya2VkIiwiY29tcG9uZW50Um9vdCIsImR1bXBDb21wb25lbnRUcmVlIiwiYyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUNDRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBRFBGLElBQUFBLG1CQUFBO0VBQUFDLG1DQUFBO0VBQUFDLG9CQUFBO0VBQUFDLG9DQUFBO0VBQUFDLHdDQUFBO0VBQUFDLG1DQUFBO0VBQUFDLHVDQUFBO0VBQUFDLGlDQUFBO0VBQUFDLGFBQUE7RUFBQUMsZUFBQTtFQUFBQyxZQUFBO0VBQUFDLFlBQUE7RUFBQUMsY0FBQTtFQUFBQyxzQ0FBQTtFQUFBQyxZQUFBO0VBQUFDLE9BQUEsTUFBQUMsY0FBQTtBQVFBZCxvQkFBQSxHQUF1QixVQUFDZSxDQUFELEVBQUlDLENBQUo7RUFDckIsSUFBQUMsQ0FBQSxFQUFBQyxDQUFBLEVBQUFDLEdBQUE7RUFBQSxJQUFnQkosQ0FBQyxDQUFDSyxNQUFGLEtBQWNKLENBQUMsQ0FBQ0ksTUFBaEM7SUFBQSxPQUFPO0VDTVA7RURKQSxLQUFTSCxDQUFBLEdBQUFDLENBQUEsTUFBQUMsR0FBQSxHQUFBSixDQUFBLENBQUFLLE1BQUEsT0FBQUQsR0FBQSxHQUFBRCxDQUFBLEdBQUFDLEdBQUEsR0FBQUQsQ0FBQSxHQUFBQyxHQUFBLEVBQUFGLENBQUEsUUFBQUUsR0FBQSxLQUFBRCxDQUFBLEtBQUFBLENBQVQ7SUFDRSxJQUFnQkgsQ0FBRSxDQUFBRSxDQUFBLENBQUYsS0FBVUQsQ0FBRSxDQUFBQyxDQUFBLENBQTVCO01BQUEsT0FBTztJQ09QO0VEUkY7RUNVQSxPRFBBO0FBTnFCO0FBUXZCWCxhQUFBLEdBQWdCLFVBQUNlLDJCQUFEO0VBQ2QsSUFBQUMsT0FBQSxFQUFBQyxRQUFBO0VBQUEsSUFBR0MsQ0FBQyxDQUFDQyxRQUFGLENBQVdKLDJCQUFYLENBQUg7SUFDRUUs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RyxDQUFDRixDQUFDLENBQUM7TURWZCxJQUFDLENBQUFxRixvQkFBRCxDQUFzQjVFLEtBQXRCLEVBQTZCOEUsY0FBN0I7SUFERjtJQUdBLElBQUdDLE1BQUg7TUFDRSxJQUFDLENBQUFKLGtCQUFELENBQW9CRSxhQUFwQjtJQ1lGLENEYkE7TUFHRSxJQUFDLENBQUFMLFlBQUQsQ0FBY0ssYUFBZDtJQ1lGO0VENUJxQjtFQW9CUCxPQUFmRyxhQUFlLENBQUM3RCxTQUFEO0lBQ2QsSUFBQTRCLGVBQUE7SUFBQSxPQUFNQSxlQUFBLEdBQWtCNUIsU0FBUyxDQUFDNEIsZUFBVixFQUF4QjtNQUNFNUIsU0FBQSxHQUFZNEIsZUFBQTtJQURkO0lDZUEsT0RaQTVCLFNBQUE7RUFKYztFQU1JLE9BQW5COEQsaUJBQW1CLENBQUM5RCxTQUFEO0lBQ2xCLEtBQWNBLFNBQWQ7TUFBQTtJQ2VBO0lBQ0EsT0RkQSxJQUFDLENBQUF5RCxvQkFBRCxDQUFzQixJQUFDLENBQUFJLGFBQUQsQ0FBZTdELFNBQWYsQ0FBdEIsRUFBaUQsVUFBQytELENBQUQ7TUNlL0MsT0Rmc0RBLENBQUEsS0FBSy9ELFNBQUE7SUFBWixDQUFqRDtFQUhrQjtBQTNDdEIsRSIsImZpbGUiOiIvcGFja2FnZXMvcGVlcmxpYnJhcnlfYmFzZS1jb21wb25lbnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIjIENvbXBhcmluZyBhcnJheXMgb2YgY29tcG9uZW50cyBieSByZWZlcmVuY2UuIFRoaXMgbWlnaHQgbm90IGJlIHJlYWxseSBuZWNlc3NhcnlcbiMgdG8gZG8sIGJlY2F1c2UgYWxsIG9wZXJhdGlvbnMgd2Ugb2ZmaWNpYWxseSBzdXBwb3J0IG1vZGlmeSBsZW5ndGggb2YgdGhlIGFycmF5XG4jIChhZGQgYSBuZXcgY29tcG9uZW50IG9yIHJlbW92ZSBhbiBvbGQgb25lKS4gQnV0IGlmIHNvbWVib2R5IGlzIG1vZGlmeWluZyB0aGVcbiMgcmVhY3RpdmUgdmFyaWFibGUgZGlyZWN0bHkgd2Ugd2FudCBhIHNhbmUgYmVoYXZpb3IuIFRoZSBkZWZhdWx0IFJlYWN0aXZlVmFyXG4jIGVxdWFsaXR5IGFsd2F5cyByZXR1cm5zIGZhbHNlIHdoZW4gY29tcGFyaW5nIGFueSBub24tcHJpbWl0aXZlIHZhbHVlcy4gQmVjYXVzZVxuIyB0aGUgb3JkZXIgb2YgY29tcG9uZW50cyBpbiB0aGUgY2hpbGRyZW4gYXJyYXkgaXMgYXJiaXRyYXJ5IHdlIGNvdWxkIGZ1cnRoZXJcbiMgaW1wcm92ZSB0aGlzIGNvbXBhcmlzb24gdG8gY29tcGFyZSBhcnJheXMgYXMgc2V0cywgaWdub3JpbmcgdGhlIG9yZGVyLiBPciB3ZVxuIyBjb3VsZCBoYXZlIHNvbWUgY2Fub25pY2FsIG9yZGVyIG9mIGNvbXBvbmVudHMgaW4gdGhlIGFycmF5LlxuYXJyYXlSZWZlcmVuY2VFcXVhbHMgPSAoYSwgYikgLT5cbiAgcmV0dXJuIGZhbHNlIGlmIGEubGVuZ3RoIGlzbnQgYi5sZW5ndGhcblxuICBmb3IgaSBpbiBbMC4uLmEubGVuZ3RoXVxuICAgIHJldHVybiBmYWxzZSBpZiBhW2ldIGlzbnQgYltpXVxuXG4gIHRydWVcblxuY3JlYXRlTWF0Y2hlciA9IChwcm9wZXJ0eU9yTWF0Y2hlck9yRnVuY3Rpb24pIC0+XG4gIGlmIF8uaXNTdHJpbmcgcHJvcGVydHlPck1hdGNoZXJPckZ1bmN0aW9uXG4gICAgcHJvcGVydHkgPSBwcm9wZXJ0eU9yTWF0Y2hlck9yRnVuY3Rpb25cbiAgICBwcm9wZXJ0eU9yTWF0Y2hlck9yRnVuY3Rpb24gPSAoY2hpbGQsIHBhcmVudCkgPT5cbiAgICAgIHByb3BlcnR5IG9mIGNoaWxkXG5cbiAgZWxzZSBpZiBub3QgXy5pc0Z1bmN0aW9uIHByb3BlcnR5T3JNYXRjaGVyT3JGdW5jdGlvblxuICAgIGFzc2VydCBfLmlzT2JqZWN0IHByb3BlcnR5T3JNYXRjaGVyT3JGdW5jdGlvblxuICAgIG1hdGNoZXIgPSBwcm9wZXJ0eU9yTWF0Y2hlck9yRnVuY3Rpb25cbiAgICBwcm9wZXJ0eU9yTWF0Y2hlck9yRnVuY3Rpb24gPSAoY2hpbGQsIHBhcmVudCkgPT5cbiAgICAgIGZvciBwcm9wZXJ0eSwgdmFsdWUgb2YgbWF0Y2hlclxuICAgICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHByb3BlcnR5IG9mIGNoaWxkXG5cbiAgICAgICAgaWYgXy5pc0Z1bmN0aW9uIGNoaWxkW3Byb3BlcnR5XVxuICAgICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgY2hpbGRbcHJvcGVydHldKCkgaXMgdmFsdWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgY2hpbGRbcHJvcGVydHldIGlzIHZhbHVlXG5cbiAgICAgIHRydWVcblxuICBwcm9wZXJ0eU9yTWF0Y2hlck9yRnVuY3Rpb25cblxuY2xhc3MgQ29tcG9uZW50c05hbWVzcGFjZVxuICAjIFdlIGhhdmUgYSBzcGVjaWFsIGZpZWxkIGZvciBjb21wb25lbnRzLiBUaGlzIGFsbG93cyB1cyB0byBoYXZlIHRoZSBuYW1lc3BhY2Ugd2l0aCB0aGUgc2FtZSBuYW1lXG4gICMgYXMgYSBjb21wb25lbnQsIHdpdGhvdXQgb3ZlcnJpZGluZyBhbnl0aGluZyBpbiB0aGUgY29tcG9uZW50ICh3ZSBkbyBub3Qgd2FudCB0byB1c2UgY29tcG9uZW50XG4gICMgb2JqZWN0IGFzIGEgbmFtZXNwYWNlIG9iamVjdCkuXG4gIEBDT01QT05FTlRTX0ZJRUxEOiAnJ1xuXG5nZXRQYXRoQW5kTmFtZSA9IChuYW1lKSAtPlxuICBhc3NlcnQgbmFtZVxuXG4gIHBhdGggPSBuYW1lLnNwbGl0ICcuJ1xuXG4gIG5hbWUgPSBwYXRoLnBvcCgpXG5cbiAgYXNzZXJ0IG5hbWVcblxuICB7cGF0aCwgbmFtZX1cblxuZ2V0TmFtZXNwYWNlID0gKGNvbXBvbmVudHMsIHBhdGgpIC0+XG4gIGFzc2VydCBfLmlzT2JqZWN0IGNvbXBvbmVudHNcbiAgYXNzZXJ0IF8uaXNBcnJheSBwYXRoXG5cbiAgbWF0Y2ggPSBjb21wb25lbnRzXG5cbiAgd2hpbGUgKHNlZ21lbnQgPSBwYXRoLnNoaWZ0KCkpP1xuICAgIG1hdGNoID0gbWF0Y2hbc2VnbWVudF1cbiAgICByZXR1cm4gbnVsbCB1bmxlc3MgXy5pc09iamVjdCBtYXRjaFxuXG4gIHJldHVybiBudWxsIHVubGVzcyBfLmlzT2JqZWN0IG1hdGNoXG5cbiAgbWF0Y2ggb3IgbnVsbFxuXG5jcmVhdGVOYW1lc3BhY2UgPSAoY29tcG9uZW50cywgcGF0aCkgLT5cbiAgYXNzZXJ0IF8uaXNPYmplY3QgY29tcG9uZW50c1xuICBhc3NlcnQgXy5pc0FycmF5IHBhdGhcblxuICBtYXRjaCA9IGNvbXBvbmVudHNcblxuICB3aGlsZSAoc2VnbWVudCA9IHBhdGguc2hpZnQoKSk/XG4gICAgbWF0Y2hbc2VnbWVudF0gPSBuZXcgY29tcG9uZW50cy5jb25zdHJ1Y3RvcigpIHVubGVzcyBzZWdtZW50IG9mIG1hdGNoXG4gICAgbWF0Y2ggPSBtYXRjaFtzZWdtZW50XVxuICAgIGFzc2VydCBfLmlzT2JqZWN0IG1hdGNoXG5cbiAgYXNzZXJ0IF8uaXNPYmplY3QgbWF0Y2hcblxuICBtYXRjaFxuXG5nZXRDb21wb25lbnQgPSAoY29tcG9uZW50cywgbmFtZSkgLT5cbiAgYXNzZXJ0IF8uaXNPYmplY3QgY29tcG9uZW50c1xuXG4gIHJldHVybiBudWxsIHVubGVzcyBuYW1lXG5cbiAge3BhdGgsIG5hbWV9ID0gZ2V0UGF0aEFuZE5hbWUgbmFtZVxuXG4gIG5hbWVzcGFjZSA9IGdldE5hbWVzcGFjZSBjb21wb25lbnRzLCBwYXRoXG4gIHJldHVybiBudWxsIHVubGVzcyBuYW1lc3BhY2VcblxuICBuYW1lc3BhY2VbY29tcG9uZW50cy5jb25zdHJ1Y3Rvci5DT01QT05FTlRTX0ZJRUxEXT9bbmFtZV0gb3IgbnVsbFxuXG5zZXRDb21wb25lbnQgPSAoY29tcG9uZW50cywgbmFtZSwgY29tcG9uZW50KSAtPlxuICBhc3NlcnQgXy5pc09iamVjdCBjb21wb25lbnRzXG4gIGFzc2VydCBuYW1lXG4gIGFzc2VydCBjb21wb25lbnRcblxuICB7cGF0aCwgbmFtZX0gPSBnZXRQYXRoQW5kTmFtZSBuYW1lXG5cbiAgbmFtZXNwYWNlID0gY3JlYXRlTmFtZXNwYWNlIGNvbXBvbmVudHMsIHBhdGhcblxuICBuYW1lc3BhY2VbY29tcG9uZW50cy5jb25zdHJ1Y3Rvci5DT01QT05FTlRTX0ZJRUxEXSA/PSBuZXcgY29tcG9uZW50cy5jb25zdHJ1Y3RvcigpXG4gIGFzc2VydCBuYW1lIG5vdCBvZiBuYW1lc3BhY2VbY29tcG9uZW50cy5jb25zdHJ1Y3Rvci5DT01QT05FTlRTX0ZJRUxEXVxuICBuYW1lc3BhY2VbY29tcG9uZW50cy5jb25zdHJ1Y3Rvci5DT01QT05FTlRTX0ZJRUxEXVtuYW1lXSA9IGNvbXBvbmVudFxuXG5jb21wb25lbnRDaGlsZHJlbkRlcHJlY2F0aW9uV2FybmluZyA9IGZhbHNlXG5jb21wb25lbnRDaGlsZHJlbldpdGhEZXByZWNhdGlvbldhcm5pbmcgPSBmYWxzZVxuYWRkQ29tcG9uZW50Q2hpbGREZXByZWNhdGlvbldhcm5pbmcgPSBmYWxzZVxucmVtb3ZlQ29tcG9uZW50Q2hpbGREZXByZWNhdGlvbldhcm5pbmcgPSBmYWxzZVxuXG5jb21wb25lbnRQYXJlbnREZXByZWNhdGlvbldhcm5pbmcgPSBmYWxzZVxuXG5jaGlsZHJlbkNvbXBvbmVudHNEZXByZWNhdGlvbldhcm5pbmcgPSBmYWxzZVxuY2hpbGRyZW5Db21wb25lbnRzV2l0aERlcHJlY2F0aW9uV2FybmluZyA9IGZhbHNlXG5cbmNsYXNzIEJhc2VDb21wb25lbnRcbiAgQGNvbXBvbmVudHM6IG5ldyBDb21wb25lbnRzTmFtZXNwYWNlKClcblxuICBAcmVnaXN0ZXI6IChjb21wb25lbnROYW1lLCBjb21wb25lbnRDbGFzcykgLT5cbiAgICB0aHJvdyBuZXcgRXJyb3IgXCJDb21wb25lbnQgbmFtZSBpcyByZXF1aXJlZCBmb3IgcmVnaXN0cmF0aW9uLlwiIHVubGVzcyBjb21wb25lbnROYW1lXG5cbiAgICAjIFRvIGFsbG93IGNhbGxpbmcgQHJlZ2lzdGVyICduYW1lJyBmcm9tIGluc2lkZSBhIGNsYXNzIGJvZHkuXG4gICAgY29tcG9uZW50Q2xhc3MgPz0gQFxuXG4gICAgdGhyb3cgbmV3IEVycm9yIFwiQ29tcG9uZW50ICcjeyBjb21wb25lbnROYW1lIH0nIGFscmVhZHkgcmVnaXN0ZXJlZC5cIiBpZiBnZXRDb21wb25lbnQgQGNvbXBvbmVudHMsIGNvbXBvbmVudE5hbWVcblxuICAgICMgVGhlIGxhc3QgY29uZGl0aW9uIGlzIHRvIG1ha2Ugc3VyZSB3ZSBkbyBub3QgdGhyb3cgdGhlIGV4Y2VwdGlvbiB3aGVuIHJlZ2lzdGVyaW5nIGEgc3ViY2xhc3MuXG4gICAgIyBTdWJjbGFzc2VkIGNvbXBvbmVudHMgaGF2ZSBhdCB0aGlzIHN0YWdlIHRoZSBzYW1lIGNvbXBvbmVudCBhcyB0aGUgcGFyZW50IGNvbXBvbmVudCwgc28gd2UgaGF2ZVxuICAgICMgdG8gY2hlY2sgaWYgdGhleSBhcmUgdGhlIHNhbWUgY2xhc3MuIElmIG5vdCwgdGhpcyBpcyBub3QgYW4gZXJyb3IsIGl0IGlzIGEgc3ViY2xhc3MuXG4gICAgaWYgY29tcG9uZW50Q2xhc3MuY29tcG9uZW50TmFtZSgpIGFuZCBjb21wb25lbnRDbGFzcy5jb21wb25lbnROYW1lKCkgaXNudCBjb21wb25lbnROYW1lIGFuZCBnZXRDb21wb25lbnQoQGNvbXBvbmVudHMsIGNvbXBvbmVudENsYXNzLmNvbXBvbmVudE5hbWUoKSkgaXMgY29tcG9uZW50Q2xhc3NcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIkNvbXBvbmVudCAnI3sgY29tcG9uZW50TmFtZSB9JyBhbHJlYWR5IHJlZ2lzdGVyZWQgdW5kZXIgdGhlIG5hbWUgJyN7IGNvbXBvbmVudENsYXNzLmNvbXBvbmVudE5hbWUoKSB9Jy5cIlxuXG4gICAgY29tcG9uZW50Q2xhc3MuY29tcG9uZW50TmFtZSBjb21wb25lbnROYW1lXG4gICAgYXNzZXJ0LmVxdWFsIGNvbXBvbmVudENsYXNzLmNvbXBvbmVudE5hbWUoKSwgY29tcG9uZW50TmFtZVxuXG4gICAgc2V0Q29tcG9uZW50IEBjb21wb25lbnRzLCBjb21wb25lbnROYW1lLCBjb21wb25lbnRDbGFzc1xuXG4gICAgIyBUbyBhbGxvdyBjaGFpbmluZy5cbiAgICBAXG5cbiAgQGdldENvbXBvbmVudDogKGNvbXBvbmVudHNOYW1lc3BhY2UsIGNvbXBvbmVudE5hbWUpIC0+XG4gICAgdW5sZXNzIGNvbXBvbmVudE5hbWVcbiAgICAgIGNvbXBvbmVudE5hbWUgPSBjb21wb25lbnRzTmFtZXNwYWNlXG4gICAgICBjb21wb25lbnRzTmFtZXNwYWNlID0gQGNvbXBvbmVudHNcblxuICAgICMgSWYgY29tcG9uZW50IGlzIG1pc3NpbmcsIGp1c3QgcmV0dXJuIGEgbnVsbC5cbiAgICByZXR1cm4gbnVsbCB1bmxlc3MgY29tcG9uZW50TmFtZVxuXG4gICAgIyBCdXQgb3RoZXJ3aXNlIHRocm93IGFuIGV4Y2VwdGlvbi5cbiAgICB0aHJvdyBuZXcgRXJyb3IgXCJDb21wb25lbnQgbmFtZSAnI3sgY29tcG9uZW50TmFtZSB9JyBpcyBub3QgYSBzdHJpbmcuXCIgdW5sZXNzIF8uaXNTdHJpbmcgY29tcG9uZW50TmFtZVxuXG4gICAgZ2V0Q29tcG9uZW50IGNvbXBvbmVudHNOYW1lc3BhY2UsIGNvbXBvbmVudE5hbWVcblxuICAjIENvbXBvbmVudCBuYW1lIGlzIHNldCBpbiB0aGUgcmVnaXN0ZXIgY2xhc3MgbWV0aG9kLiBJZiBub3QgdXNpbmcgYSByZWdpc3RlcmVkIGNvbXBvbmVudCBhbmQgYSBjb21wb25lbnQgbmFtZSBpc1xuICAjIHdhbnRlZCwgY29tcG9uZW50IG5hbWUgaGFzIHRvIGJlIHNldCBtYW51YWxseSBvciB0aGlzIGNsYXNzIG1ldGhvZCBzaG91bGQgYmUgb3ZlcnJpZGRlbiB3aXRoIGEgY3VzdG9tIGltcGxlbWVudGF0aW9uLlxuICAjIENhcmUgc2hvdWxkIGJlIHRha2VuIHRoYXQgdW5yZWdpc3RlcmVkIGNvbXBvbmVudHMgaGF2ZSB0aGVpciBvd24gbmFtZSBhbmQgbm90IHRoZSBuYW1lIG9mIHRoZWlyIHBhcmVudCBjbGFzcywgd2hpY2hcbiAgIyB0aGV5IHdvdWxkIGhhdmUgYnkgZGVmYXVsdC4gUHJvYmFibHkgY29tcG9uZW50IG5hbWUgc2hvdWxkIGJlIHNldCBpbiB0aGUgY29uc3RydWN0b3IgZm9yIHN1Y2ggY2xhc3Nlcywgb3IgYnkgY2FsbGluZ1xuICAjIGNvbXBvbmVudE5hbWUgY2xhc3MgbWV0aG9kIG1hbnVhbGx5IG9uIHRoZSBuZXcgY2xhc3Mgb2YgdGhpcyBuZXcgY29tcG9uZW50LlxuICBAY29tcG9uZW50TmFtZTogKGNvbXBvbmVudE5hbWUpIC0+XG4gICAgIyBTZXR0ZXIuXG4gICAgaWYgY29tcG9uZW50TmFtZVxuICAgICAgQF9jb21wb25lbnROYW1lID0gY29tcG9uZW50TmFtZVxuICAgICAgIyBUbyBhbGxvdyBjaGFpbmluZy5cbiAgICAgIHJldHVybiBAXG5cbiAgICAjIEdldHRlci5cbiAgICBAX2NvbXBvbmVudE5hbWUgb3IgbnVsbFxuXG4gICMgV2UgYWxsb3cgYWNjZXNzIHRvIHRoZSBjb21wb25lbnQgbmFtZSB0aHJvdWdoIGEgbWV0aG9kIHNvIHRoYXQgaXQgY2FuIGJlIGFjY2Vzc2VkIGluIHRlbXBsYXRlcyBpbiBhbiBlYXN5IHdheS5cbiAgIyBJdCBzaG91bGQgbmV2ZXIgYmUgb3ZlcnJpZGRlbi4gVGhlIGltcGxlbWVudGF0aW9uIHNob3VsZCBhbHdheXMgYmUgZXhhY3RseSB0aGUgc2FtZSBhcyBjbGFzcyBtZXRob2QgaW1wbGVtZW50YXRpb24uXG4gIGNvbXBvbmVudE5hbWU6IC0+XG4gICAgIyBJbnN0YW5jZSBtZXRob2QgaXMganVzdCBhIGdldHRlciwgbm90IGEgc2V0dGVyIGFzIHdlbGwuXG4gICAgQGNvbnN0cnVjdG9yLmNvbXBvbmVudE5hbWUoKVxuXG4gICMgVGhlIG9yZGVyIG9mIGNvbXBvbmVudHMgaXMgYXJiaXRyYXJ5IGFuZCBkb2VzIG5vdCBuZWNlc3NhcnkgbWF0Y2ggc2libGluZ3MgcmVsYXRpb25zIGluIERPTS5cbiAgIyBuYW1lT3JDb21wb25lbnQgaXMgb3B0aW9uYWwgYW5kIGl0IGxpbWl0cyB0aGUgcmV0dXJuZWQgY2hpbGRyZW4gb25seSB0byB0aG9zZS5cbiAgY2hpbGRDb21wb25lbnRzOiAobmFtZU9yQ29tcG9uZW50KSAtPlxuICAgIEBfY29tcG9uZW50SW50ZXJuYWxzID89IHt9XG4gICAgQF9jb21wb25lbnRJbnRlcm5hbHMuY2hpbGRDb21wb25lbnRzID89IG5ldyBSZWFjdGl2ZUZpZWxkIFtdLCBhcnJheVJlZmVyZW5jZUVxdWFsc1xuXG4gICAgIyBRdWljayBwYXRoLiBSZXR1cm5zIGEgc2hhbGxvdyBjb3B5LlxuICAgIHJldHVybiAoY2hpbGQgZm9yIGNoaWxkIGluIEBfY29tcG9uZW50SW50ZXJuYWxzLmNoaWxkQ29tcG9uZW50cygpKSB1bmxlc3MgbmFtZU9yQ29tcG9uZW50XG5cbiAgICBpZiBfLmlzU3RyaW5nIG5hbWVPckNvbXBvbmVudFxuICAgICAgQGNoaWxkQ29tcG9uZW50c1dpdGggKGNoaWxkLCBwYXJlbnQpID0+XG4gICAgICAgIGNoaWxkLmNvbXBvbmVudE5hbWUoKSBpcyBuYW1lT3JDb21wb25lbnRcbiAgICBlbHNlXG4gICAgICBAY2hpbGRDb21wb25lbnRzV2l0aCAoY2hpbGQsIHBhcmVudCkgPT5cbiAgICAgICAgIyBuYW1lT3JDb21wb25lbnQgaXMgYSBjbGFzcy5cbiAgICAgICAgcmV0dXJuIHRydWUgaWYgY2hpbGQuY29uc3RydWN0b3IgaXMgbmFtZU9yQ29tcG9uZW50XG5cbiAgICAgICAgIyBuYW1lT3JDb21wb25lbnQgaXMgYW4gaW5zdGFuY2UsIG9yIHNvbWV0aGluZyBlbHNlLlxuICAgICAgICByZXR1cm4gdHJ1ZSBpZiBjaGlsZCBpcyBuYW1lT3JDb21wb25lbnRcblxuICAgICAgICBmYWxzZVxuXG4gICMgVGhlIG9yZGVyIG9mIGNvbXBvbmVudHMgaXMgYXJiaXRyYXJ5IGFuZCBkb2VzIG5vdCBuZWNlc3NhcnkgbWF0Y2ggc2libGluZ3MgcmVsYXRpb25zIGluIERPTS5cbiAgIyBSZXR1cm5zIGNoaWxkcmVuIHdoaWNoIHBhc3MgYSBwcmVkaWNhdGUgZnVuY3Rpb24uXG4gIGNoaWxkQ29tcG9uZW50c1dpdGg6IChwcm9wZXJ0eU9yTWF0Y2hlck9yRnVuY3Rpb24pIC0+XG4gICAgYXNzZXJ0IHByb3BlcnR5T3JNYXRjaGVyT3JGdW5jdGlvblxuXG4gICAgcHJvcGVydHlPck1hdGNoZXJPckZ1bmN0aW9uID0gY3JlYXRlTWF0Y2hlciBwcm9wZXJ0eU9yTWF0Y2hlck9yRnVuY3Rpb25cblxuICAgIHJlc3VsdHMgPSBuZXcgQ29tcHV0ZWRGaWVsZCA9PlxuICAgICAgY2hpbGQgZm9yIGNoaWxkIGluIEBjaGlsZENvbXBvbmVudHMoKSB3aGVuIHByb3BlcnR5T3JNYXRjaGVyT3JGdW5jdGlvbi5jYWxsIEAsIGNoaWxkLCBAXG4gICAgLFxuICAgICAgYXJyYXlSZWZlcmVuY2VFcXVhbHNcblxuICAgIHJlc3VsdHMoKVxuXG4gIGFkZENoaWxkQ29tcG9uZW50OiAoY2hpbGRDb21wb25lbnQpIC0+XG4gICAgQF9jb21wb25lbnRJbnRlcm5hbHMgPz0ge31cbiAgICBAX2NvbXBvbmVudEludGVybmFscy5jaGlsZENvbXBvbmVudHMgPz0gbmV3IFJlYWN0aXZlRmllbGQgW10sIGFycmF5UmVmZXJlbmNlRXF1YWxzXG4gICAgQF9jb21wb25lbnRJbnRlcm5hbHMuY2hpbGRDb21wb25lbnRzIFRyYWNrZXIubm9ucmVhY3RpdmUgPT5cbiAgICAgIEBfY29tcG9uZW50SW50ZXJuYWxzLmNoaWxkQ29tcG9uZW50cygpLmNvbmNhdCBbY2hpbGRDb21wb25lbnRdXG5cbiAgICAjIFRvIGFsbG93IGNoYWluaW5nLlxuICAgIEBcblxuICByZW1vdmVDaGlsZENvbXBvbmVudDogKGNoaWxkQ29tcG9uZW50KSAtPlxuICAgIEBfY29tcG9uZW50SW50ZXJuYWxzID89IHt9XG4gICAgQF9jb21wb25lbnRJbnRlcm5hbHMuY2hpbGRDb21wb25lbnRzID89IG5ldyBSZWFjdGl2ZUZpZWxkIFtdLCBhcnJheVJlZmVyZW5jZUVxdWFsc1xuICAgIEBfY29tcG9uZW50SW50ZXJuYWxzLmNoaWxkQ29tcG9uZW50cyBUcmFja2VyLm5vbnJlYWN0aXZlID0+XG4gICAgICBfLndpdGhvdXQgQF9jb21wb25lbnRJbnRlcm5hbHMuY2hpbGRDb21wb25lbnRzKCksIGNoaWxkQ29tcG9uZW50XG5cbiAgICAjIFRvIGFsbG93IGNoYWluaW5nLlxuICAgIEBcblxuICBwYXJlbnRDb21wb25lbnQ6IChwYXJlbnRDb21wb25lbnQpIC0+XG4gICAgQF9jb21wb25lbnRJbnRlcm5hbHMgPz0ge31cbiAgICAjIFdlIHVzZSByZWZlcmVuY2UgZXF1YWxpdHkgaGVyZS4gVGhpcyBtYWtlcyByZWFjdGl2aXR5IG5vdCBpbnZhbGlkYXRlIHRoZVxuICAgICMgY29tcHV0YXRpb24gaWYgdGhlIHNhbWUgY29tcG9uZW50IGluc3RhbmNlIChieSByZWZlcmVuY2UpIGlzIHNldCBhcyBhIHBhcmVudC5cbiAgICBAX2NvbXBvbmVudEludGVybmFscy5wYXJlbnRDb21wb25lbnQgPz0gbmV3IFJlYWN0aXZlRmllbGQgbnVsbCwgKGEsIGIpIC0+IGEgaXMgYlxuXG4gICAgIyBTZXR0ZXIuXG4gICAgdW5sZXNzIF8uaXNVbmRlZmluZWQgcGFyZW50Q29tcG9uZW50XG4gICAgICBAX2NvbXBvbmVudEludGVybmFscy5wYXJlbnRDb21wb25lbnQgcGFyZW50Q29tcG9uZW50XG4gICAgICAjIFRvIGFsbG93IGNoYWluaW5nLlxuICAgICAgcmV0dXJuIEBcblxuICAgICMgR2V0dGVyLlxuICAgIEBfY29tcG9uZW50SW50ZXJuYWxzLnBhcmVudENvbXBvbmVudCgpXG5cbiAgQHJlbmRlckNvbXBvbmVudDogKHBhcmVudENvbXBvbmVudCkgLT5cbiAgICB0aHJvdyBuZXcgRXJyb3IgXCJOb3QgaW1wbGVtZW50ZWRcIlxuXG4gIHJlbmRlckNvbXBvbmVudDogKHBhcmVudENvbXBvbmVudCkgLT5cbiAgICB0aHJvdyBuZXcgRXJyb3IgXCJOb3QgaW1wbGVtZW50ZWRcIlxuXG4gIEBleHRlbmRDb21wb25lbnQ6IChjb25zdHJ1Y3RvciwgbWV0aG9kcykgLT5cbiAgICBjdXJyZW50Q2xhc3MgPSBAXG5cbiAgICBpZiBfLmlzRnVuY3Rpb24gY29uc3RydWN0b3JcbiAgICAgIGNvbnN0cnVjdG9yOjogPSBPYmplY3QuY3JlYXRlIGN1cnJlbnRDbGFzczo6LFxuICAgICAgICBjb25zdHJ1Y3RvcjpcbiAgICAgICAgICB2YWx1ZTogY29uc3RydWN0b3JcbiAgICAgICAgICB3cml0YWJsZTogdHJ1ZVxuICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuXG4gICAgICBPYmplY3Quc2V0UHJvdG90eXBlT2YgY29uc3RydWN0b3IsIGN1cnJlbnRDbGFzc1xuXG4gICAgZWxzZVxuICAgICAgbWV0aG9kcyA9IGNvbnN0cnVjdG9yXG4gICAgICBjb25zdHJ1Y3RvciA9IGNsYXNzIGV4dGVuZHMgY3VycmVudENsYXNzXG5cbiAgICAjIFdlIGV4cGVjdCB0aGUgcGxhaW4gb2JqZWN0IG9mIG1ldGhvZHMgaGVyZSwgYnV0IGlmIHNvbWV0aGluZ1xuICAgICMgZWxzZSBpcyBwYXNzZWQsIHdlIHVzZSBvbmx5IFwib3duXCIgcHJvcGVydGllcy5cbiAgICBmb3Igb3duIHByb3BlcnR5LCB2YWx1ZSBvZiBtZXRob2RzIG9yIHt9XG4gICAgICBjb25zdHJ1Y3Rvcjo6W3Byb3BlcnR5XSA9IHZhbHVlXG5cbiAgICBjb25zdHJ1Y3RvclxuXG4gICMgRGVwcmVjYXRlZCBtZXRob2QgbmFtZXMuXG4gICMgVE9ETzogUmVtb3ZlIHRoZW0gaW4gdGhlIGZ1dHVyZS5cblxuICAjIEBkZXByZWNhdGVkIFVzZSBjaGlsZENvbXBvbmVudHMgaW5zdGVhZC5cbiAgY29tcG9uZW50Q2hpbGRyZW46IChhcmdzLi4uKSAtPlxuICAgIHVubGVzcyBjb21wb25lbnRDaGlsZHJlbkRlcHJlY2F0aW9uV2FybmluZ1xuICAgICAgY29tcG9uZW50Q2hpbGRyZW5EZXByZWNhdGlvbldhcm5pbmcgPSB0cnVlXG4gICAgICBjb25zb2xlPy53YXJuIFwiY29tcG9uZW50Q2hpbGRyZW4gaGFzIGJlZW4gZGVwcmVjYXRlZC4gVXNlIGNoaWxkQ29tcG9uZW50cyBpbnN0ZWFkLlwiXG5cbiAgICBAY2hpbGRDb21wb25lbnRzIGFyZ3MuLi5cblxuICAjIEBkZXByZWNhdGVkIFVzZSBjaGlsZENvbXBvbmVudHNXaXRoIGluc3RlYWQuXG4gIGNvbXBvbmVudENoaWxkcmVuV2l0aDogKGFyZ3MuLi4pIC0+XG4gICAgdW5sZXNzIGNvbXBvbmVudENoaWxkcmVuV2l0aERlcHJlY2F0aW9uV2FybmluZ1xuICAgICAgY29tcG9uZW50Q2hpbGRyZW5XaXRoRGVwcmVjYXRpb25XYXJuaW5nID0gdHJ1ZVxuICAgICAgY29uc29sZT8ud2FybiBcImNvbXBvbmVudENoaWxkcmVuV2l0aCBoYXMgYmVlbiBkZXByZWNhdGVkLiBVc2UgY2hpbGRDb21wb25lbnRzV2l0aCBpbnN0ZWFkLlwiXG5cbiAgICBAY2hpbGRDb21wb25lbnRzV2l0aCBhcmdzLi4uXG5cbiAgIyBAZGVwcmVjYXRlZCBVc2UgYWRkQ2hpbGRDb21wb25lbnQgaW5zdGVhZC5cbiAgYWRkQ29tcG9uZW50Q2hpbGQ6IChhcmdzLi4uKSAtPlxuICAgIHVubGVzcyBhZGRDb21wb25lbnRDaGlsZERlcHJlY2F0aW9uV2FybmluZ1xuICAgICAgYWRkQ29tcG9uZW50Q2hpbGREZXByZWNhdGlvbldhcm5pbmcgPSB0cnVlXG4gICAgICBjb25zb2xlPy53YXJuIFwiYWRkQ29tcG9uZW50Q2hpbGQgaGFzIGJlZW4gZGVwcmVjYXRlZC4gVXNlIGFkZENoaWxkQ29tcG9uZW50IGluc3RlYWQuXCJcblxuICAgIEBhZGRDaGlsZENvbXBvbmVudCBhcmdzLi4uXG5cbiAgIyBAZGVwcmVjYXRlZCBVc2UgcmVtb3ZlQ2hpbGRDb21wb25lbnQgaW5zdGVhZC5cbiAgcmVtb3ZlQ29tcG9uZW50Q2hpbGQ6IChhcmdzLi4uKSAtPlxuICAgIHVubGVzcyByZW1vdmVDb21wb25lbnRDaGlsZERlcHJlY2F0aW9uV2FybmluZ1xuICAgICAgcmVtb3ZlQ29tcG9uZW50Q2hpbGREZXByZWNhdGlvbldhcm5pbmcgPSB0cnVlXG4gICAgICBjb25zb2xlPy53YXJuIFwicmVtb3ZlQ29tcG9uZW50Q2hpbGQgaGFzIGJlZW4gZGVwcmVjYXRlZC4gVXNlIHJlbW92ZUNoaWxkQ29tcG9uZW50IGluc3RlYWQuXCJcblxuICAgIEByZW1vdmVDaGlsZENvbXBvbmVudCBhcmdzLi4uXG5cbiAgIyBAZGVwcmVjYXRlZCBVc2UgcGFyZW50Q29tcG9uZW50IGluc3RlYWQuXG4gIGNvbXBvbmVudFBhcmVudDogKGFyZ3MuLi4pIC0+XG4gICAgdW5sZXNzIGNvbXBvbmVudFBhcmVudERlcHJlY2F0aW9uV2FybmluZ1xuICAgICAgY29tcG9uZW50UGFyZW50RGVwcmVjYXRpb25XYXJuaW5nID0gdHJ1ZVxuICAgICAgY29uc29sZT8ud2FybiBcImNvbXBvbmVudFBhcmVudCBoYXMgYmVlbiBkZXByZWNhdGVkLiBVc2UgcGFyZW50Q29tcG9uZW50IGluc3RlYWQuXCJcblxuICAgIEBwYXJlbnRDb21wb25lbnQgYXJncy4uLlxuXG4gICMgQGRlcHJlY2F0ZWQgVXNlIGNoaWxkQ29tcG9uZW50cyBpbnN0ZWFkLlxuICBjaGlsZHJlbkNvbXBvbmVudHM6IChhcmdzLi4uKSAtPlxuICAgIHVubGVzcyBjb21wb25lbnRDaGlsZHJlbkRlcHJlY2F0aW9uV2FybmluZ1xuICAgICAgY29tcG9uZW50Q2hpbGRyZW5EZXByZWNhdGlvbldhcm5pbmcgPSB0cnVlXG4gICAgICBjb25zb2xlPy53YXJuIFwiY2hpbGRyZW5Db21wb25lbnRzIGhhcyBiZWVuIGRlcHJlY2F0ZWQuIFVzZSBjaGlsZENvbXBvbmVudHMgaW5zdGVhZC5cIlxuXG4gICAgQGNoaWxkQ29tcG9uZW50cyBhcmdzLi4uXG5cbiAgIyBAZGVwcmVjYXRlZCBVc2UgY2hpbGRDb21wb25lbnRzV2l0aCBpbnN0ZWFkLlxuICBjaGlsZHJlbkNvbXBvbmVudHNXaXRoOiAoYXJncy4uLikgLT5cbiAgICB1bmxlc3MgY29tcG9uZW50Q2hpbGRyZW5XaXRoRGVwcmVjYXRpb25XYXJuaW5nXG4gICAgICBjb21wb25lbnRDaGlsZHJlbldpdGhEZXByZWNhdGlvbldhcm5pbmcgPSB0cnVlXG4gICAgICBjb25zb2xlPy53YXJuIFwiY2hpbGRyZW5Db21wb25lbnRzV2l0aCBoYXMgYmVlbiBkZXByZWNhdGVkLiBVc2UgY2hpbGRDb21wb25lbnRzV2l0aCBpbnN0ZWFkLlwiXG5cbiAgICBAY2hpbGRDb21wb25lbnRzV2l0aCBhcmdzLi4uXG4iLCIgIC8vIENvbXBhcmluZyBhcnJheXMgb2YgY29tcG9uZW50cyBieSByZWZlcmVuY2UuIFRoaXMgbWlnaHQgbm90IGJlIHJlYWxseSBuZWNlc3NhcnlcbiAgLy8gdG8gZG8sIGJlY2F1c2UgYWxsIG9wZXJhdGlvbnMgd2Ugb2ZmaWNpYWxseSBzdXBwb3J0IG1vZGlmeSBsZW5ndGggb2YgdGhlIGFycmF5XG4gIC8vIChhZGQgYSBuZXcgY29tcG9uZW50IG9yIHJlbW92ZSBhbiBvbGQgb25lKS4gQnV0IGlmIHNvbWVib2R5IGlzIG1vZGlmeWluZyB0aGVcbiAgLy8gcmVhY3RpdmUgdmFyaWFibGUgZGlyZWN0bHkgd2Ugd2FudCBhIHNhbmUgYmVoYXZpb3IuIFRoZSBkZWZhdWx0IFJlYWN0aXZlVmFyXG4gIC8vIGVxdWFsaXR5IGFsd2F5cyByZXR1cm5zIGZhbHNlIHdoZW4gY29tcGFyaW5nIGFueSBub24tcHJpbWl0aXZlIHZhbHVlcy4gQmVjYXVzZVxuICAvLyB0aGUgb3JkZXIgb2YgY29tcG9uZW50cyBpbiB0aGUgY2hpbGRyZW4gYXJyYXkgaXMgYXJiaXRyYXJ5IHdlIGNvdWxkIGZ1cnRoZXJcbiAgLy8gaW1wcm92ZSB0aGlzIGNvbXBhcmlzb24gdG8gY29tcGFyZSBhcnJheXMgYXMgc2V0cywgaWdub3JpbmcgdGhlIG9yZGVyLiBPciB3ZVxuICAvLyBjb3VsZCBoYXZlIHNvbWUgY2Fub25pY2FsIG9yZGVyIG9mIGNvbXBvbmVudHMgaW4gdGhlIGFycmF5LlxudmFyIENvbXBvbmVudHNOYW1lc3BhY2UsIGFkZENvbXBvbmVudENoaWxkRGVwcmVjYXRpb25XYXJuaW5nLCBhcnJheVJlZmVyZW5jZUVxdWFscywgY2hpbGRyZW5Db21wb25lbnRzRGVwcmVjYXRpb25XYXJuaW5nLCBjaGlsZHJlbkNvbXBvbmVudHNXaXRoRGVwcmVjYXRpb25XYXJuaW5nLCBjb21wb25lbnRDaGlsZHJlbkRlcHJlY2F0aW9uV2FybmluZywgY29tcG9uZW50Q2hpbGRyZW5XaXRoRGVwcmVjYXRpb25XYXJuaW5nLCBjb21wb25lbnRQYXJlbnREZXByZWNhdGlvbldhcm5pbmcsIGNyZWF0ZU1hdGNoZXIsIGNyZWF0ZU5hbWVzcGFjZSwgZ2V0Q29tcG9uZW50LCBnZXROYW1lc3BhY2UsIGdldFBhdGhBbmROYW1lLCByZW1vdmVDb21wb25lbnRDaGlsZERlcHJlY2F0aW9uV2FybmluZywgc2V0Q29tcG9uZW50LCAgICAgICAgICAgICAgIFxuICBoYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHk7XG5cbmFycmF5UmVmZXJlbmNlRXF1YWxzID0gZnVuY3Rpb24oYSwgYikge1xuICB2YXIgaSwgaiwgcmVmO1xuICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGZvciAoaSA9IGogPSAwLCByZWYgPSBhLmxlbmd0aDsgKDAgPD0gcmVmID8gaiA8IHJlZiA6IGogPiByZWYpOyBpID0gMCA8PSByZWYgPyArK2ogOiAtLWopIHtcbiAgICBpZiAoYVtpXSAhPT0gYltpXSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbmNyZWF0ZU1hdGNoZXIgPSBmdW5jdGlvbihwcm9wZXJ0eU9yTWF0Y2hlck9yRnVuY3Rpb24pIHtcbiAgdmFyIG1hdGNoZXIsIHByb3BlcnR5O1xuICBpZiAoXy5pc1N0cmluZyhwcm9wZXJ0eU9yTWF0Y2hlck9yRnVuY3Rpb24pKSB7XG4gICAgcHJvcGVydHkgPSBwcm9wZXJ0eU9yTWF0Y2hlck9yRnVuY3Rpb247XG4gICAgcHJvcGVydHlPck1hdGNoZXJPckZ1bmN0aW9uID0gKGNoaWxkLCBwYXJlbnQpID0+IHtcbiAgICAgIHJldHVybiBwcm9wZXJ0eSBpbiBjaGlsZDtcbiAgICB9O1xuICB9IGVsc2UgaWYgKCFfLmlzRnVuY3Rpb24ocHJvcGVydHlPck1hdGNoZXJPckZ1bmN0aW9uKSkge1xuICAgIGFzc2VydChfLmlzT2JqZWN0KHByb3BlcnR5T3JNYXRjaGVyT3JGdW5jdGlvbikpO1xuICAgIG1hdGNoZXIgPSBwcm9wZXJ0eU9yTWF0Y2hlck9yRnVuY3Rpb247XG4gICAgcHJvcGVydHlPck1hdGNoZXJPckZ1bmN0aW9uID0gKGNoaWxkLCBwYXJlbnQpID0+IHtcbiAgICAgIHZhciB2YWx1ZTtcbiAgICAgIGZvciAocHJvcGVydHkgaW4gbWF0Y2hlcikge1xuICAgICAgICB2YWx1ZSA9IG1hdGNoZXJbcHJvcGVydHldO1xuICAgICAgICBpZiAoIShwcm9wZXJ0eSBpbiBjaGlsZCkpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKF8uaXNGdW5jdGlvbihjaGlsZFtwcm9wZXJ0eV0pKSB7XG4gICAgICAgICAgaWYgKGNoaWxkW3Byb3BlcnR5XSgpICE9PSB2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoY2hpbGRbcHJvcGVydHldICE9PSB2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcbiAgfVxuICByZXR1cm4gcHJvcGVydHlPck1hdGNoZXJPckZ1bmN0aW9uO1xufTtcblxuQ29tcG9uZW50c05hbWVzcGFjZSA9IChmdW5jdGlvbigpIHtcbiAgY2xhc3MgQ29tcG9uZW50c05hbWVzcGFjZSB7fTtcblxuICAvLyBXZSBoYXZlIGEgc3BlY2lhbCBmaWVsZCBmb3IgY29tcG9uZW50cy4gVGhpcyBhbGxvd3MgdXMgdG8gaGF2ZSB0aGUgbmFtZXNwYWNlIHdpdGggdGhlIHNhbWUgbmFtZVxuICAvLyBhcyBhIGNvbXBvbmVudCwgd2l0aG91dCBvdmVycmlkaW5nIGFueXRoaW5nIGluIHRoZSBjb21wb25lbnQgKHdlIGRvIG5vdCB3YW50IHRvIHVzZSBjb21wb25lbnRcbiAgLy8gb2JqZWN0IGFzIGEgbmFtZXNwYWNlIG9iamVjdCkuXG4gIENvbXBvbmVudHNOYW1lc3BhY2UuQ09NUE9ORU5UU19GSUVMRCA9ICcnO1xuXG4gIHJldHVybiBDb21wb25lbnRzTmFtZXNwYWNlO1xuXG59KS5jYWxsKHRoaXMpO1xuXG5nZXRQYXRoQW5kTmFtZSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgdmFyIHBhdGg7XG4gIGFzc2VydChuYW1lKTtcbiAgcGF0aCA9IG5hbWUuc3BsaXQoJy4nKTtcbiAgbmFtZSA9IHBhdGgucG9wKCk7XG4gIGFzc2VydChuYW1lKTtcbiAgcmV0dXJuIHtwYXRoLCBuYW1lfTtcbn07XG5cbmdldE5hbWVzcGFjZSA9IGZ1bmN0aW9uKGNvbXBvbmVudHMsIHBhdGgpIHtcbiAgdmFyIG1hdGNoLCBzZWdtZW50O1xuICBhc3NlcnQoXy5pc09iamVjdChjb21wb25lbnRzKSk7XG4gIGFzc2VydChfLmlzQXJyYXkocGF0aCkpO1xuICBtYXRjaCA9IGNvbXBvbmVudHM7XG4gIHdoaWxlICgoc2VnbWVudCA9IHBhdGguc2hpZnQoKSkgIT0gbnVsbCkge1xuICAgIG1hdGNoID0gbWF0Y2hbc2VnbWVudF07XG4gICAgaWYgKCFfLmlzT2JqZWN0KG1hdGNoKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG4gIGlmICghXy5pc09iamVjdChtYXRjaCkpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gbWF0Y2ggfHwgbnVsbDtcbn07XG5cbmNyZWF0ZU5hbWVzcGFjZSA9IGZ1bmN0aW9uKGNvbXBvbmVudHMsIHBhdGgpIHtcbiAgdmFyIG1hdGNoLCBzZWdtZW50O1xuICBhc3NlcnQoXy5pc09iamVjdChjb21wb25lbnRzKSk7XG4gIGFzc2VydChfLmlzQXJyYXkocGF0aCkpO1xuICBtYXRjaCA9IGNvbXBvbmVudHM7XG4gIHdoaWxlICgoc2VnbWVudCA9IHBhdGguc2hpZnQoKSkgIT0gbnVsbCkge1xuICAgIGlmICghKHNlZ21lbnQgaW4gbWF0Y2gpKSB7XG4gICAgICBtYXRjaFtzZWdtZW50XSA9IG5ldyBjb21wb25lbnRzLmNvbnN0cnVjdG9yKCk7XG4gICAgfVxuICAgIG1hdGNoID0gbWF0Y2hbc2VnbWVudF07XG4gICAgYXNzZXJ0KF8uaXNPYmplY3QobWF0Y2gpKTtcbiAgfVxuICBhc3NlcnQoXy5pc09iamVjdChtYXRjaCkpO1xuICByZXR1cm4gbWF0Y2g7XG59O1xuXG5nZXRDb21wb25lbnQgPSBmdW5jdGlvbihjb21wb25lbnRzLCBuYW1lKSB7XG4gIHZhciBuYW1lc3BhY2UsIHBhdGgsIHJlZjtcbiAgYXNzZXJ0KF8uaXNPYmplY3QoY29tcG9uZW50cykpO1xuICBpZiAoIW5hbWUpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICAoe3BhdGgsIG5hbWV9ID0gZ2V0UGF0aEFuZE5hbWUobmFtZSkpO1xuICBuYW1lc3BhY2UgPSBnZXROYW1lc3BhY2UoY29tcG9uZW50cywgcGF0aCk7XG4gIGlmICghbmFtZXNwYWNlKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmV0dXJuICgocmVmID0gbmFtZXNwYWNlW2NvbXBvbmVudHMuY29uc3RydWN0b3IuQ09NUE9ORU5UU19GSUVMRF0pICE9IG51bGwgPyByZWZbbmFtZV0gOiB2b2lkIDApIHx8IG51bGw7XG59O1xuXG5zZXRDb21wb25lbnQgPSBmdW5jdGlvbihjb21wb25lbnRzLCBuYW1lLCBjb21wb25lbnQpIHtcbiAgdmFyIG5hbWUxLCBuYW1lc3BhY2UsIHBhdGg7XG4gIGFzc2VydChfLmlzT2JqZWN0KGNvbXBvbmVudHMpKTtcbiAgYXNzZXJ0KG5hbWUpO1xuICBhc3NlcnQoY29tcG9uZW50KTtcbiAgKHtwYXRoLCBuYW1lfSA9IGdldFBhdGhBbmROYW1lKG5hbWUpKTtcbiAgbmFtZXNwYWNlID0gY3JlYXRlTmFtZXNwYWNlKGNvbXBvbmVudHMsIHBhdGgpO1xuICBpZiAobmFtZXNwYWNlW25hbWUxID0gY29tcG9uZW50cy5jb25zdHJ1Y3Rvci5DT01QT05FTlRTX0ZJRUxEXSA9PSBudWxsKSB7XG4gICAgbmFtZXNwYWNlW25hbWUxXSA9IG5ldyBjb21wb25lbnRzLmNvbnN0cnVjdG9yKCk7XG4gIH1cbiAgYXNzZXJ0KCEobmFtZSBpbiBuYW1lc3BhY2VbY29tcG9uZW50cy5jb25zdHJ1Y3Rvci5DT01QT05FTlRTX0ZJRUxEXSkpO1xuICByZXR1cm4gbmFtZXNwYWNlW2NvbXBvbmVudHMuY29uc3RydWN0b3IuQ09NUE9ORU5UU19GSUVMRF1bbmFtZV0gPSBjb21wb25lbnQ7XG59O1xuXG5jb21wb25lbnRDaGlsZHJlbkRlcHJlY2F0aW9uV2FybmluZyA9IGZhbHNlO1xuXG5jb21wb25lbnRDaGlsZHJlbldpdGhEZXByZWNhdGlvbldhcm5pbmcgPSBmYWxzZTtcblxuYWRkQ29tcG9uZW50Q2hpbGREZXByZWNhdGlvbldhcm5pbmcgPSBmYWxzZTtcblxucmVtb3ZlQ29tcG9uZW50Q2hpbGREZXByZWNhdGlvbldhcm5pbmcgPSBmYWxzZTtcblxuY29tcG9uZW50UGFyZW50RGVwcmVjYXRpb25XYXJuaW5nID0gZmFsc2U7XG5cbmNoaWxkcmVuQ29tcG9uZW50c0RlcHJlY2F0aW9uV2FybmluZyA9IGZhbHNlO1xuXG5jaGlsZHJlbkNvbXBvbmVudHNXaXRoRGVwcmVjYXRpb25XYXJuaW5nID0gZmFsc2U7XG5cbkJhc2VDb21wb25lbnQgPSAoZnVuY3Rpb24oKSB7XG4gIGNsYXNzIEJhc2VDb21wb25lbnQge1xuICAgIHN0YXRpYyByZWdpc3Rlcihjb21wb25lbnROYW1lLCBjb21wb25lbnRDbGFzcykge1xuICAgICAgaWYgKCFjb21wb25lbnROYW1lKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvbXBvbmVudCBuYW1lIGlzIHJlcXVpcmVkIGZvciByZWdpc3RyYXRpb24uXCIpO1xuICAgICAgfVxuICAgICAgLy8gVG8gYWxsb3cgY2FsbGluZyBAcmVnaXN0ZXIgJ25hbWUnIGZyb20gaW5zaWRlIGEgY2xhc3MgYm9keS5cbiAgICAgIGlmIChjb21wb25lbnRDbGFzcyA9PSBudWxsKSB7XG4gICAgICAgIGNvbXBvbmVudENsYXNzID0gdGhpcztcbiAgICAgIH1cbiAgICAgIGlmIChnZXRDb21wb25lbnQodGhpcy5jb21wb25lbnRzLCBjb21wb25lbnROYW1lKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENvbXBvbmVudCAnJHtjb21wb25lbnROYW1lfScgYWxyZWFkeSByZWdpc3RlcmVkLmApO1xuICAgICAgfVxuICAgICAgLy8gVGhlIGxhc3QgY29uZGl0aW9uIGlzIHRvIG1ha2Ugc3VyZSB3ZSBkbyBub3QgdGhyb3cgdGhlIGV4Y2VwdGlvbiB3aGVuIHJlZ2lzdGVyaW5nIGEgc3ViY2xhc3MuXG4gICAgICAvLyBTdWJjbGFzc2VkIGNvbXBvbmVudHMgaGF2ZSBhdCB0aGlzIHN0YWdlIHRoZSBzYW1lIGNvbXBvbmVudCBhcyB0aGUgcGFyZW50IGNvbXBvbmVudCwgc28gd2UgaGF2ZVxuICAgICAgLy8gdG8gY2hlY2sgaWYgdGhleSBhcmUgdGhlIHNhbWUgY2xhc3MuIElmIG5vdCwgdGhpcyBpcyBub3QgYW4gZXJyb3IsIGl0IGlzIGEgc3ViY2xhc3MuXG4gICAgICBpZiAoY29tcG9uZW50Q2xhc3MuY29tcG9uZW50TmFtZSgpICYmIGNvbXBvbmVudENsYXNzLmNvbXBvbmVudE5hbWUoKSAhPT0gY29tcG9uZW50TmFtZSAmJiBnZXRDb21wb25lbnQodGhpcy5jb21wb25lbnRzLCBjb21wb25lbnRDbGFzcy5jb21wb25lbnROYW1lKCkpID09PSBjb21wb25lbnRDbGFzcykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENvbXBvbmVudCAnJHtjb21wb25lbnROYW1lfScgYWxyZWFkeSByZWdpc3RlcmVkIHVuZGVyIHRoZSBuYW1lICcke2NvbXBvbmVudENsYXNzLmNvbXBvbmVudE5hbWUoKX0nLmApO1xuICAgICAgfVxuICAgICAgY29tcG9uZW50Q2xhc3MuY29tcG9uZW50TmFtZShjb21wb25lbnROYW1lKTtcbiAgICAgIGFzc2VydC5lcXVhbChjb21wb25lbnRDbGFzcy5jb21wb25lbnROYW1lKCksIGNvbXBvbmVudE5hbWUpO1xuICAgICAgc2V0Q29tcG9uZW50KHRoaXMuY29tcG9uZW50cywgY29tcG9uZW50TmFtZSwgY29tcG9uZW50Q2xhc3MpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldENvbXBvbmVudChjb21wb25lbnRzTmFtZXNwYWNlLCBjb21wb25lbnROYW1lKSB7XG4gICAgICBpZiAoIWNvbXBvbmVudE5hbWUpIHtcbiAgICAgICAgY29tcG9uZW50TmFtZSA9IGNvbXBvbmVudHNOYW1lc3BhY2U7XG4gICAgICAgIGNvbXBvbmVudHNOYW1lc3BhY2UgPSB0aGlzLmNvbXBvbmVudHM7XG4gICAgICB9XG4gICAgICBpZiAoIWNvbXBvbmVudE5hbWUpIHtcbiAgICAgICAgLy8gSWYgY29tcG9uZW50IGlzIG1pc3NpbmcsIGp1c3QgcmV0dXJuIGEgbnVsbC5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICBpZiAoIV8uaXNTdHJpbmcoY29tcG9uZW50TmFtZSkpIHtcbiAgICAgICAgLy8gQnV0IG90aGVyd2lzZSB0aHJvdyBhbiBleGNlcHRpb24uXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQ29tcG9uZW50IG5hbWUgJyR7Y29tcG9uZW50TmFtZX0nIGlzIG5vdCBhIHN0cmluZy5gKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBnZXRDb21wb25lbnQoY29tcG9uZW50c05hbWVzcGFjZSwgY29tcG9uZW50TmFtZSk7XG4gICAgfVxuXG4gICAgLy8gQ29tcG9uZW50IG5hbWUgaXMgc2V0IGluIHRoZSByZWdpc3RlciBjbGFzcyBtZXRob2QuIElmIG5vdCB1c2luZyBhIHJlZ2lzdGVyZWQgY29tcG9uZW50IGFuZCBhIGNvbXBvbmVudCBuYW1lIGlzXG4gICAgLy8gd2FudGVkLCBjb21wb25lbnQgbmFtZSBoYXMgdG8gYmUgc2V0IG1hbnVhbGx5IG9yIHRoaXMgY2xhc3MgbWV0aG9kIHNob3VsZCBiZSBvdmVycmlkZGVuIHdpdGggYSBjdXN0b20gaW1wbGVtZW50YXRpb24uXG4gICAgLy8gQ2FyZSBzaG91bGQgYmUgdGFrZW4gdGhhdCB1bnJlZ2lzdGVyZWQgY29tcG9uZW50cyBoYXZlIHRoZWlyIG93biBuYW1lIGFuZCBub3QgdGhlIG5hbWUgb2YgdGhlaXIgcGFyZW50IGNsYXNzLCB3aGljaFxuICAgIC8vIHRoZXkgd291bGQgaGF2ZSBieSBkZWZhdWx0LiBQcm9iYWJseSBjb21wb25lbnQgbmFtZSBzaG91bGQgYmUgc2V0IGluIHRoZSBjb25zdHJ1Y3RvciBmb3Igc3VjaCBjbGFzc2VzLCBvciBieSBjYWxsaW5nXG4gICAgLy8gY29tcG9uZW50TmFtZSBjbGFzcyBtZXRob2QgbWFudWFsbHkgb24gdGhlIG5ldyBjbGFzcyBvZiB0aGlzIG5ldyBjb21wb25lbnQuXG4gICAgc3RhdGljIGNvbXBvbmVudE5hbWUoY29tcG9uZW50TmFtZSkge1xuICAgICAgLy8gU2V0dGVyLlxuICAgICAgaWYgKGNvbXBvbmVudE5hbWUpIHtcbiAgICAgICAgdGhpcy5fY29tcG9uZW50TmFtZSA9IGNvbXBvbmVudE5hbWU7XG4gICAgICAgIC8vIFRvIGFsbG93IGNoYWluaW5nLlxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIC8vIEdldHRlci5cbiAgICAgIHJldHVybiB0aGlzLl9jb21wb25lbnROYW1lIHx8IG51bGw7XG4gICAgfVxuXG4gICAgLy8gV2UgYWxsb3cgYWNjZXNzIHRvIHRoZSBjb21wb25lbnQgbmFtZSB0aHJvdWdoIGEgbWV0aG9kIHNvIHRoYXQgaXQgY2FuIGJlIGFjY2Vzc2VkIGluIHRlbXBsYXRlcyBpbiBhbiBlYXN5IHdheS5cbiAgICAvLyBJdCBzaG91bGQgbmV2ZXIgYmUgb3ZlcnJpZGRlbi4gVGhlIGltcGxlbWVudGF0aW9uIHNob3VsZCBhbHdheXMgYmUgZXhhY3RseSB0aGUgc2FtZSBhcyBjbGFzcyBtZXRob2QgaW1wbGVtZW50YXRpb24uXG4gICAgY29tcG9uZW50TmFtZSgpIHtcbiAgICAgIC8vIEluc3RhbmNlIG1ldGhvZCBpcyBqdXN0IGEgZ2V0dGVyLCBub3QgYSBzZXR0ZXIgYXMgd2VsbC5cbiAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLmNvbXBvbmVudE5hbWUoKTtcbiAgICB9XG5cbiAgICAvLyBUaGUgb3JkZXIgb2YgY29tcG9uZW50cyBpcyBhcmJpdHJhcnkgYW5kIGRvZXMgbm90IG5lY2Vzc2FyeSBtYXRjaCBzaWJsaW5ncyByZWxhdGlvbnMgaW4gRE9NLlxuICAgIC8vIG5hbWVPckNvbXBvbmVudCBpcyBvcHRpb25hbCBhbmQgaXQgbGltaXRzIHRoZSByZXR1cm5lZCBjaGlsZHJlbiBvbmx5IHRvIHRob3NlLlxuICAgIGNoaWxkQ29tcG9uZW50cyhuYW1lT3JDb21wb25lbnQpIHtcbiAgICAgIHZhciBiYXNlLCBjaGlsZDtcbiAgICAgIGlmICh0aGlzLl9jb21wb25lbnRJbnRlcm5hbHMgPT0gbnVsbCkge1xuICAgICAgICB0aGlzLl9jb21wb25lbnRJbnRlcm5hbHMgPSB7fTtcbiAgICAgIH1cbiAgICAgIGlmICgoYmFzZSA9IHRoaXMuX2NvbXBvbmVudEludGVybmFscykuY2hpbGRDb21wb25lbnRzID09IG51bGwpIHtcbiAgICAgICAgYmFzZS5jaGlsZENvbXBvbmVudHMgPSBuZXcgUmVhY3RpdmVGaWVsZChbXSwgYXJyYXlSZWZlcmVuY2VFcXVhbHMpO1xuICAgICAgfVxuICAgICAgaWYgKCFuYW1lT3JDb21wb25lbnQpIHtcbiAgICAgICAgcmV0dXJuIChmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgaiwgbGVuLCByZWYsIHJlc3VsdHMxO1xuICAgICAgICAgIHJlZiA9IHRoaXMuX2NvbXBvbmVudEludGVybmFscy5jaGlsZENvbXBvbmVudHMoKTtcbiAgICAgICAgICByZXN1bHRzMSA9IFtdO1xuICAgICAgICAgIGZvciAoaiA9IDAsIGxlbiA9IHJlZi5sZW5ndGg7IGogPCBsZW47IGorKykge1xuICAgICAgICAgICAgY2hpbGQgPSByZWZbal07XG4gICAgICAgICAgICAvLyBRdWljayBwYXRoLiBSZXR1cm5zIGEgc2hhbGxvdyBjb3B5LlxuICAgICAgICAgICAgcmVzdWx0czEucHVzaChjaGlsZCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZXN1bHRzMTtcbiAgICAgICAgfSkuY2FsbCh0aGlzKTtcbiAgICAgIH1cbiAgICAgIGlmIChfLmlzU3RyaW5nKG5hbWVPckNvbXBvbmVudCkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2hpbGRDb21wb25lbnRzV2l0aCgoY2hpbGQsIHBhcmVudCkgPT4ge1xuICAgICAgICAgIHJldHVybiBjaGlsZC5jb21wb25lbnROYW1lKCkgPT09IG5hbWVPckNvbXBvbmVudDtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5jaGlsZENvbXBvbmVudHNXaXRoKChjaGlsZCwgcGFyZW50KSA9PiB7XG4gICAgICAgICAgaWYgKGNoaWxkLmNvbnN0cnVjdG9yID09PSBuYW1lT3JDb21wb25lbnQpIHtcbiAgICAgICAgICAgIC8vIG5hbWVPckNvbXBvbmVudCBpcyBhIGNsYXNzLlxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChjaGlsZCA9PT0gbmFtZU9yQ29tcG9uZW50KSB7XG4gICAgICAgICAgICAvLyBuYW1lT3JDb21wb25lbnQgaXMgYW4gaW5zdGFuY2UsIG9yIHNvbWV0aGluZyBlbHNlLlxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVGhlIG9yZGVyIG9mIGNvbXBvbmVudHMgaXMgYXJiaXRyYXJ5IGFuZCBkb2VzIG5vdCBuZWNlc3NhcnkgbWF0Y2ggc2libGluZ3MgcmVsYXRpb25zIGluIERPTS5cbiAgICAvLyBSZXR1cm5zIGNoaWxkcmVuIHdoaWNoIHBhc3MgYSBwcmVkaWNhdGUgZnVuY3Rpb24uXG4gICAgY2hpbGRDb21wb25lbnRzV2l0aChwcm9wZXJ0eU9yTWF0Y2hlck9yRnVuY3Rpb24pIHtcbiAgICAgIHZhciByZXN1bHRzO1xuICAgICAgYXNzZXJ0KHByb3BlcnR5T3JNYXRjaGVyT3JGdW5jdGlvbik7XG4gICAgICBwcm9wZXJ0eU9yTWF0Y2hlck9yRnVuY3Rpb24gPSBjcmVhdGVNYXRjaGVyKHByb3BlcnR5T3JNYXRjaGVyT3JGdW5jdGlvbik7XG4gICAgICByZXN1bHRzID0gbmV3IENvbXB1dGVkRmllbGQoKCkgPT4ge1xuICAgICAgICB2YXIgY2hpbGQsIGosIGxlbiwgcmVmLCByZXN1bHRzMTtcbiAgICAgICAgcmVmID0gdGhpcy5jaGlsZENvbXBvbmVudHMoKTtcbiAgICAgICAgcmVzdWx0czEgPSBbXTtcbiAgICAgICAgZm9yIChqID0gMCwgbGVuID0gcmVmLmxlbmd0aDsgaiA8IGxlbjsgaisrKSB7XG4gICAgICAgICAgY2hpbGQgPSByZWZbal07XG4gICAgICAgICAgaWYgKHByb3BlcnR5T3JNYXRjaGVyT3JGdW5jdGlvbi5jYWxsKHRoaXMsIGNoaWxkLCB0aGlzKSkge1xuICAgICAgICAgICAgcmVzdWx0czEucHVzaChjaGlsZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHRzMTtcbiAgICAgIH0sIGFycmF5UmVmZXJlbmNlRXF1YWxzKTtcbiAgICAgIHJldHVybiByZXN1bHRzKCk7XG4gICAgfVxuXG4gICAgYWRkQ2hpbGRDb21wb25lbnQoY2hpbGRDb21wb25lbnQpIHtcbiAgICAgIHZhciBiYXNlO1xuICAgICAgaWYgKHRoaXMuX2NvbXBvbmVudEludGVybmFscyA9PSBudWxsKSB7XG4gICAgICAgIHRoaXMuX2NvbXBvbmVudEludGVybmFscyA9IHt9O1xuICAgICAgfVxuICAgICAgaWYgKChiYXNlID0gdGhpcy5fY29tcG9uZW50SW50ZXJuYWxzKS5jaGlsZENvbXBvbmVudHMgPT0gbnVsbCkge1xuICAgICAgICBiYXNlLmNoaWxkQ29tcG9uZW50cyA9IG5ldyBSZWFjdGl2ZUZpZWxkKFtdLCBhcnJheVJlZmVyZW5jZUVxdWFscyk7XG4gICAgICB9XG4gICAgICB0aGlzLl9jb21wb25lbnRJbnRlcm5hbHMuY2hpbGRDb21wb25lbnRzKFRyYWNrZXIubm9ucmVhY3RpdmUoKCkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fY29tcG9uZW50SW50ZXJuYWxzLmNoaWxkQ29tcG9uZW50cygpLmNvbmNhdChbY2hpbGRDb21wb25lbnRdKTtcbiAgICAgIH0pKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHJlbW92ZUNoaWxkQ29tcG9uZW50KGNoaWxkQ29tcG9uZW50KSB7XG4gICAgICB2YXIgYmFzZTtcbiAgICAgIGlmICh0aGlzLl9jb21wb25lbnRJbnRlcm5hbHMgPT0gbnVsbCkge1xuICAgICAgICB0aGlzLl9jb21wb25lbnRJbnRlcm5hbHMgPSB7fTtcbiAgICAgIH1cbiAgICAgIGlmICgoYmFzZSA9IHRoaXMuX2NvbXBvbmVudEludGVybmFscykuY2hpbGRDb21wb25lbnRzID09IG51bGwpIHtcbiAgICAgICAgYmFzZS5jaGlsZENvbXBvbmVudHMgPSBuZXcgUmVhY3RpdmVGaWVsZChbXSwgYXJyYXlSZWZlcmVuY2VFcXVhbHMpO1xuICAgICAgfVxuICAgICAgdGhpcy5fY29tcG9uZW50SW50ZXJuYWxzLmNoaWxkQ29tcG9uZW50cyhUcmFja2VyLm5vbnJlYWN0aXZlKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIF8ud2l0aG91dCh0aGlzLl9jb21wb25lbnRJbnRlcm5hbHMuY2hpbGRDb21wb25lbnRzKCksIGNoaWxkQ29tcG9uZW50KTtcbiAgICAgIH0pKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHBhcmVudENvbXBvbmVudChwYXJlbnRDb21wb25lbnQpIHtcbiAgICAgIHZhciBiYXNlO1xuICAgICAgaWYgKHRoaXMuX2NvbXBvbmVudEludGVybmFscyA9PSBudWxsKSB7XG4gICAgICAgIHRoaXMuX2NvbXBvbmVudEludGVybmFscyA9IHt9O1xuICAgICAgfVxuICAgICAgLy8gV2UgdXNlIHJlZmVyZW5jZSBlcXVhbGl0eSBoZXJlLiBUaGlzIG1ha2VzIHJlYWN0aXZpdHkgbm90IGludmFsaWRhdGUgdGhlXG4gICAgICAvLyBjb21wdXRhdGlvbiBpZiB0aGUgc2FtZSBjb21wb25lbnQgaW5zdGFuY2UgKGJ5IHJlZmVyZW5jZSkgaXMgc2V0IGFzIGEgcGFyZW50LlxuICAgICAgaWYgKChiYXNlID0gdGhpcy5fY29tcG9uZW50SW50ZXJuYWxzKS5wYXJlbnRDb21wb25lbnQgPT0gbnVsbCkge1xuICAgICAgICBiYXNlLnBhcmVudENvbXBvbmVudCA9IG5ldyBSZWFjdGl2ZUZpZWxkKG51bGwsIGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICByZXR1cm4gYSA9PT0gYjtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICAvLyBTZXR0ZXIuXG4gICAgICBpZiAoIV8uaXNVbmRlZmluZWQocGFyZW50Q29tcG9uZW50KSkge1xuICAgICAgICB0aGlzLl9jb21wb25lbnRJbnRlcm5hbHMucGFyZW50Q29tcG9uZW50KHBhcmVudENvbXBvbmVudCk7XG4gICAgICAgIC8vIFRvIGFsbG93IGNoYWluaW5nLlxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIC8vIEdldHRlci5cbiAgICAgIHJldHVybiB0aGlzLl9jb21wb25lbnRJbnRlcm5hbHMucGFyZW50Q29tcG9uZW50KCk7XG4gICAgfVxuXG4gICAgc3RhdGljIHJlbmRlckNvbXBvbmVudChwYXJlbnRDb21wb25lbnQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgICB9XG5cbiAgICByZW5kZXJDb21wb25lbnQocGFyZW50Q29tcG9uZW50KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gICAgfVxuXG4gICAgc3RhdGljIGV4dGVuZENvbXBvbmVudChjb25zdHJ1Y3RvciwgbWV0aG9kcykge1xuICAgICAgdmFyIGN1cnJlbnRDbGFzcywgcHJvcGVydHksIHJlZiwgdmFsdWU7XG4gICAgICBjdXJyZW50Q2xhc3MgPSB0aGlzO1xuICAgICAgaWYgKF8uaXNGdW5jdGlvbihjb25zdHJ1Y3RvcikpIHtcbiAgICAgICAgY29uc3RydWN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShjdXJyZW50Q2xhc3MucHJvdG90eXBlLCB7XG4gICAgICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgICAgIHZhbHVlOiBjb25zdHJ1Y3RvcixcbiAgICAgICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgT2JqZWN0LnNldFByb3RvdHlwZU9mKGNvbnN0cnVjdG9yLCBjdXJyZW50Q2xhc3MpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWV0aG9kcyA9IGNvbnN0cnVjdG9yO1xuICAgICAgICBjb25zdHJ1Y3RvciA9IGNsYXNzIGV4dGVuZHMgY3VycmVudENsYXNzIHt9O1xuICAgICAgfVxuICAgICAgcmVmID0gbWV0aG9kcyB8fCB7fTtcbiAgICAgIGZvciAocHJvcGVydHkgaW4gcmVmKSB7XG4gICAgICAgIGlmICghaGFzUHJvcC5jYWxsKHJlZiwgcHJvcGVydHkpKSBjb250aW51ZTtcbiAgICAgICAgdmFsdWUgPSByZWZbcHJvcGVydHldO1xuICAgICAgICBjb25zdHJ1Y3Rvci5wcm90b3R5cGVbcHJvcGVydHldID0gdmFsdWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gY29uc3RydWN0b3I7XG4gICAgfVxuXG4gICAgLy8gRGVwcmVjYXRlZCBtZXRob2QgbmFtZXMuXG4gICAgLy8gVE9ETzogUmVtb3ZlIHRoZW0gaW4gdGhlIGZ1dHVyZS5cblxuICAgIC8vIEBkZXByZWNhdGVkIFVzZSBjaGlsZENvbXBvbmVudHMgaW5zdGVhZC5cbiAgICBjb21wb25lbnRDaGlsZHJlbiguLi5hcmdzKSB7XG4gICAgICBpZiAoIWNvbXBvbmVudENoaWxkcmVuRGVwcmVjYXRpb25XYXJuaW5nKSB7XG4gICAgICAgIGNvbXBvbmVudENoaWxkcmVuRGVwcmVjYXRpb25XYXJuaW5nID0gdHJ1ZTtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSBcInVuZGVmaW5lZFwiICYmIGNvbnNvbGUgIT09IG51bGwpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oXCJjb21wb25lbnRDaGlsZHJlbiBoYXMgYmVlbiBkZXByZWNhdGVkLiBVc2UgY2hpbGRDb21wb25lbnRzIGluc3RlYWQuXCIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5jaGlsZENvbXBvbmVudHMoLi4uYXJncyk7XG4gICAgfVxuXG4gICAgLy8gQGRlcHJlY2F0ZWQgVXNlIGNoaWxkQ29tcG9uZW50c1dpdGggaW5zdGVhZC5cbiAgICBjb21wb25lbnRDaGlsZHJlbldpdGgoLi4uYXJncykge1xuICAgICAgaWYgKCFjb21wb25lbnRDaGlsZHJlbldpdGhEZXByZWNhdGlvbldhcm5pbmcpIHtcbiAgICAgICAgY29tcG9uZW50Q2hpbGRyZW5XaXRoRGVwcmVjYXRpb25XYXJuaW5nID0gdHJ1ZTtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSBcInVuZGVmaW5lZFwiICYmIGNvbnNvbGUgIT09IG51bGwpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oXCJjb21wb25lbnRDaGlsZHJlbldpdGggaGFzIGJlZW4gZGVwcmVjYXRlZC4gVXNlIGNoaWxkQ29tcG9uZW50c1dpdGggaW5zdGVhZC5cIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmNoaWxkQ29tcG9uZW50c1dpdGgoLi4uYXJncyk7XG4gICAgfVxuXG4gICAgLy8gQGRlcHJlY2F0ZWQgVXNlIGFkZENoaWxkQ29tcG9uZW50IGluc3RlYWQuXG4gICAgYWRkQ29tcG9uZW50Q2hpbGQoLi4uYXJncykge1xuICAgICAgaWYgKCFhZGRDb21wb25lbnRDaGlsZERlcHJlY2F0aW9uV2FybmluZykge1xuICAgICAgICBhZGRDb21wb25lbnRDaGlsZERlcHJlY2F0aW9uV2FybmluZyA9IHRydWU7XG4gICAgICAgIGlmICh0eXBlb2YgY29uc29sZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBjb25zb2xlICE9PSBudWxsKSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKFwiYWRkQ29tcG9uZW50Q2hpbGQgaGFzIGJlZW4gZGVwcmVjYXRlZC4gVXNlIGFkZENoaWxkQ29tcG9uZW50IGluc3RlYWQuXCIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5hZGRDaGlsZENvbXBvbmVudCguLi5hcmdzKTtcbiAgICB9XG5cbiAgICAvLyBAZGVwcmVjYXRlZCBVc2UgcmVtb3ZlQ2hpbGRDb21wb25lbnQgaW5zdGVhZC5cbiAgICByZW1vdmVDb21wb25lbnRDaGlsZCguLi5hcmdzKSB7XG4gICAgICBpZiAoIXJlbW92ZUNvbXBvbmVudENoaWxkRGVwcmVjYXRpb25XYXJuaW5nKSB7XG4gICAgICAgIHJlbW92ZUNvbXBvbmVudENoaWxkRGVwcmVjYXRpb25XYXJuaW5nID0gdHJ1ZTtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSBcInVuZGVmaW5lZFwiICYmIGNvbnNvbGUgIT09IG51bGwpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oXCJyZW1vdmVDb21wb25lbnRDaGlsZCBoYXMgYmVlbiBkZXByZWNhdGVkLiBVc2UgcmVtb3ZlQ2hpbGRDb21wb25lbnQgaW5zdGVhZC5cIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLnJlbW92ZUNoaWxkQ29tcG9uZW50KC4uLmFyZ3MpO1xuICAgIH1cblxuICAgIC8vIEBkZXByZWNhdGVkIFVzZSBwYXJlbnRDb21wb25lbnQgaW5zdGVhZC5cbiAgICBjb21wb25lbnRQYXJlbnQoLi4uYXJncykge1xuICAgICAgaWYgKCFjb21wb25lbnRQYXJlbnREZXByZWNhdGlvbldhcm5pbmcpIHtcbiAgICAgICAgY29tcG9uZW50UGFyZW50RGVwcmVjYXRpb25XYXJuaW5nID0gdHJ1ZTtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSBcInVuZGVmaW5lZFwiICYmIGNvbnNvbGUgIT09IG51bGwpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oXCJjb21wb25lbnRQYXJlbnQgaGFzIGJlZW4gZGVwcmVjYXRlZC4gVXNlIHBhcmVudENvbXBvbmVudCBpbnN0ZWFkLlwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMucGFyZW50Q29tcG9uZW50KC4uLmFyZ3MpO1xuICAgIH1cblxuICAgIC8vIEBkZXByZWNhdGVkIFVzZSBjaGlsZENvbXBvbmVudHMgaW5zdGVhZC5cbiAgICBjaGlsZHJlbkNvbXBvbmVudHMoLi4uYXJncykge1xuICAgICAgaWYgKCFjb21wb25lbnRDaGlsZHJlbkRlcHJlY2F0aW9uV2FybmluZykge1xuICAgICAgICBjb21wb25lbnRDaGlsZHJlbkRlcHJlY2F0aW9uV2FybmluZyA9IHRydWU7XG4gICAgICAgIGlmICh0eXBlb2YgY29uc29sZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBjb25zb2xlICE9PSBudWxsKSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKFwiY2hpbGRyZW5Db21wb25lbnRzIGhhcyBiZWVuIGRlcHJlY2F0ZWQuIFVzZSBjaGlsZENvbXBvbmVudHMgaW5zdGVhZC5cIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmNoaWxkQ29tcG9uZW50cyguLi5hcmdzKTtcbiAgICB9XG5cbiAgICAvLyBAZGVwcmVjYXRlZCBVc2UgY2hpbGRDb21wb25lbnRzV2l0aCBpbnN0ZWFkLlxuICAgIGNoaWxkcmVuQ29tcG9uZW50c1dpdGgoLi4uYXJncykge1xuICAgICAgaWYgKCFjb21wb25lbnRDaGlsZHJlbldpdGhEZXByZWNhdGlvbldhcm5pbmcpIHtcbiAgICAgICAgY29tcG9uZW50Q2hpbGRyZW5XaXRoRGVwcmVjYXRpb25XYXJuaW5nID0gdHJ1ZTtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSBcInVuZGVmaW5lZFwiICYmIGNvbnNvbGUgIT09IG51bGwpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oXCJjaGlsZHJlbkNvbXBvbmVudHNXaXRoIGhhcyBiZWVuIGRlcHJlY2F0ZWQuIFVzZSBjaGlsZENvbXBvbmVudHNXaXRoIGluc3RlYWQuXCIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5jaGlsZENvbXBvbmVudHNXaXRoKC4uLmFyZ3MpO1xuICAgIH1cblxuICB9O1xuXG4gIEJhc2VDb21wb25lbnQuY29tcG9uZW50cyA9IG5ldyBDb21wb25lbnRzTmFtZXNwYWNlKCk7XG5cbiAgcmV0dXJuIEJhc2VDb21wb25lbnQ7XG5cbn0pLmNhbGwodGhpcyk7XG4iLCJjbGFzcyBCYXNlQ29tcG9uZW50RGVidWdcbiAgQHN0YXJ0Q29tcG9uZW50OiAoY29tcG9uZW50KSAtPlxuICAgIG5hbWUgPSBjb21wb25lbnQuY29tcG9uZW50TmFtZSgpIG9yICd1bm5hbWVkJ1xuICAgIGNvbnNvbGUuZ3JvdXAgbmFtZVxuICAgIGNvbnNvbGUubG9nICclbycsIGNvbXBvbmVudFxuXG4gIEBlbmRDb21wb25lbnQ6IChjb21wb25lbnQpIC0+XG4gICAgY29uc29sZS5ncm91cEVuZCgpXG5cbiAgQHN0YXJ0TWFya2VkQ29tcG9uZW50OiAoY29tcG9uZW50KSAtPlxuICAgIG5hbWUgPSBjb21wb25lbnQuY29tcG9uZW50TmFtZSgpIG9yICd1bm5hbWVkJ1xuICAgIGNvbnNvbGUuZ3JvdXAgJyVjJXMnLCAndGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmUnLCBuYW1lXG4gICAgY29uc29sZS5sb2cgJyVvJywgY29tcG9uZW50XG5cbiAgQGVuZE1hcmtlZENvbXBvbmVudDogKGNvbXBvbmVudCkgLT5cbiAgICBAZW5kQ29tcG9uZW50IGNvbXBvbmVudFxuXG4gIEBkdW1wQ29tcG9uZW50U3VidHJlZTogKHJvb3RDb21wb25lbnQsIF9tYXJrQ29tcG9uZW50PSgtPikpIC0+XG4gICAgcmV0dXJuIHVubGVzcyByb290Q29tcG9uZW50XG5cbiAgICBtYXJrZWQgPSBfbWFya0NvbXBvbmVudCByb290Q29tcG9uZW50XG5cbiAgICBpZiBtYXJrZWRcbiAgICAgIEBzdGFydE1hcmtlZENvbXBvbmVudCByb290Q29tcG9uZW50XG4gICAgZWxzZVxuICAgICAgQHN0YXJ0Q29tcG9uZW50IHJvb3RDb21wb25lbnRcblxuICAgIGZvciBjaGlsZCBpbiByb290Q29tcG9uZW50LmNoaWxkQ29tcG9uZW50cygpXG4gICAgICBAZHVtcENvbXBvbmVudFN1YnRyZWUgY2hpbGQsIF9tYXJrQ29tcG9uZW50XG5cbiAgICBpZiBtYXJrZWRcbiAgICAgIEBlbmRNYXJrZWRDb21wb25lbnQgcm9vdENvbXBvbmVudFxuICAgIGVsc2VcbiAgICAgIEBlbmRDb21wb25lbnQgcm9vdENvbXBvbmVudFxuXG4gICAgcmV0dXJuXG5cbiAgQGNvbXBvbmVudFJvb3Q6IChjb21wb25lbnQpIC0+XG4gICAgd2hpbGUgcGFyZW50Q29tcG9uZW50ID0gY29tcG9uZW50LnBhcmVudENvbXBvbmVudCgpXG4gICAgICBjb21wb25lbnQgPSBwYXJlbnRDb21wb25lbnRcblxuICAgIGNvbXBvbmVudFxuXG4gIEBkdW1wQ29tcG9uZW50VHJlZTogKGNvbXBvbmVudCkgLT5cbiAgICByZXR1cm4gdW5sZXNzIGNvbXBvbmVudFxuXG4gICAgQGR1bXBDb21wb25lbnRTdWJ0cmVlIEBjb21wb25lbnRSb290KGNvbXBvbmVudCksIChjKSAtPiBjIGlzIGNvbXBvbmVudFxuIiwiICAgICAgICAgICAgICAgICAgICAgICBcblxuQmFzZUNvbXBvbmVudERlYnVnID0gY2xhc3MgQmFzZUNvbXBvbmVudERlYnVnIHtcbiAgc3RhdGljIHN0YXJ0Q29tcG9uZW50KGNvbXBvbmVudCkge1xuICAgIHZhciBuYW1lO1xuICAgIG5hbWUgPSBjb21wb25lbnQuY29tcG9uZW50TmFtZSgpIHx8ICd1bm5hbWVkJztcbiAgICBjb25zb2xlLmdyb3VwKG5hbWUpO1xuICAgIHJldHVybiBjb25zb2xlLmxvZygnJW8nLCBjb21wb25lbnQpO1xuICB9XG5cbiAgc3RhdGljIGVuZENvbXBvbmVudChjb21wb25lbnQpIHtcbiAgICByZXR1cm4gY29uc29sZS5ncm91cEVuZCgpO1xuICB9XG5cbiAgc3RhdGljIHN0YXJ0TWFya2VkQ29tcG9uZW50KGNvbXBvbmVudCkge1xuICAgIHZhciBuYW1lO1xuICAgIG5hbWUgPSBjb21wb25lbnQuY29tcG9uZW50TmFtZSgpIHx8ICd1bm5hbWVkJztcbiAgICBjb25zb2xlLmdyb3VwKCclYyVzJywgJ3RleHQtZGVjb3JhdGlvbjogdW5kZXJsaW5lJywgbmFtZSk7XG4gICAgcmV0dXJuIGNvbnNvbGUubG9nKCclbycsIGNvbXBvbmVudCk7XG4gIH1cblxuICBzdGF0aWMgZW5kTWFya2VkQ29tcG9uZW50KGNvbXBvbmVudCkge1xuICAgIHJldHVybiB0aGlzLmVuZENvbXBvbmVudChjb21wb25lbnQpO1xuICB9XG5cbiAgc3RhdGljIGR1bXBDb21wb25lbnRTdWJ0cmVlKHJvb3RDb21wb25lbnQsIF9tYXJrQ29tcG9uZW50ID0gKGZ1bmN0aW9uKCkge30pKSB7XG4gICAgdmFyIGNoaWxkLCBpLCBsZW4sIG1hcmtlZCwgcmVmO1xuICAgIGlmICghcm9vdENvbXBvbmVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBtYXJrZWQgPSBfbWFya0NvbXBvbmVudChyb290Q29tcG9uZW50KTtcbiAgICBpZiAobWFya2VkKSB7XG4gICAgICB0aGlzLnN0YXJ0TWFya2VkQ29tcG9uZW50KHJvb3RDb21wb25lbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnN0YXJ0Q29tcG9uZW50KHJvb3RDb21wb25lbnQpO1xuICAgIH1cbiAgICByZWYgPSByb290Q29tcG9uZW50LmNoaWxkQ29tcG9uZW50cygpO1xuICAgIGZvciAoaSA9IDAsIGxlbiA9IHJlZi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgY2hpbGQgPSByZWZbaV07XG4gICAgICB0aGlzLmR1bXBDb21wb25lbnRTdWJ0cmVlKGNoaWxkLCBfbWFya0NvbXBvbmVudCk7XG4gICAgfVxuICAgIGlmIChtYXJrZWQpIHtcbiAgICAgIHRoaXMuZW5kTWFya2VkQ29tcG9uZW50KHJvb3RDb21wb25lbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVuZENvbXBvbmVudChyb290Q29tcG9uZW50KTtcbiAgICB9XG4gIH1cblxuICBzdGF0aWMgY29tcG9uZW50Um9vdChjb21wb25lbnQpIHtcbiAgICB2YXIgcGFyZW50Q29tcG9uZW50O1xuICAgIHdoaWxlIChwYXJlbnRDb21wb25lbnQgPSBjb21wb25lbnQucGFyZW50Q29tcG9uZW50KCkpIHtcbiAgICAgIGNvbXBvbmVudCA9IHBhcmVudENvbXBvbmVudDtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXBvbmVudDtcbiAgfVxuXG4gIHN0YXRpYyBkdW1wQ29tcG9uZW50VHJlZShjb21wb25lbnQpIHtcbiAgICBpZiAoIWNvbXBvbmVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5kdW1wQ29tcG9uZW50U3VidHJlZSh0aGlzLmNvbXBvbmVudFJvb3QoY29tcG9uZW50KSwgZnVuY3Rpb24oYykge1xuICAgICAgcmV0dXJuIGMgPT09IGNvbXBvbmVudDtcbiAgICB9KTtcbiAgfVxuXG59O1xuIl19
