(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var ReactiveVar = Package['reactive-var'].ReactiveVar;
var _ = Package.underscore._;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var dontStop, equalsFunc, ComputedField;

var require = meteorInstall({"node_modules":{"meteor":{"peerlibrary:computed-field":{"lib.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/peerlibrary_computed-field/lib.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  ComputedField: () => ComputedField
});
class ComputedField {
  constructor(func, equalsFunc, dontStop) {
    // To support passing boolean as the second argument.
    if (_.isBoolean(equalsFunc)) {
      dontStop = equalsFunc;
      equalsFunc = null;
    }
    let handle = null;
    let lastValue = null;

    // TODO: Provide an option to prevent using view's autorun.
    //       One can wrap code with Blaze._withCurrentView(null, code) to prevent using view's autorun for now.
    let autorun;
    const currentView = Package.blaze && Package.blaze.Blaze && Package.blaze.Blaze.currentView;
    if (currentView) {
      if (currentView._isInRender) {
        // Inside render we cannot use currentView.autorun directly, so we use our own version of it.
        // This allows computed fields to be created inside Blaze template helpers, which are called
        // the first time inside render. While currentView.autorun is disallowed inside render because
        // autorun would be recreated for reach re-render, this is exactly what computed field does
        // anyway so it is OK for use to use autorun in this way.
        autorun = function (f) {
          const templateInstanceFunc = Package.blaze.Blaze.Template._currentTemplateInstanceFunc;
          const comp = Tracker.autorun(c => {
            Package.blaze.Blaze._withCurrentView(currentView, () => {
              Package.blaze.Blaze.Template._withTemplateInstanceFunc(templateInstanceFunc, () => {
                f.call(currentView, c);
              });
            });
          });
          const stopComputation = () => {
            comp.stop();
          };
          currentView.onViewDestroyed(stopComputation);
          comp.onStop(() => {
            currentView.removeViewDestroyedListener(stopComputation);
          });
          return comp;
        };
      } else {
        autorun = f => {
          return currentView.autorun(f);
        };
      }
    } else {
      autorun = Tracker.autorun;
    }
    const startAutorun = function () {
      handle = autorun(function (computation) {
        const value = func();
        if (!lastValue) {
          lastValue = new ReactiveVar(value, equalsFunc);
        } else {
          lastValue.set(value);
        }
        if (!dontStop) {
          Tracker.afterFlush(function () {
            // If there are no dependents anymore, stop the autorun. We will run
            // it again in the getter's flush call if needed.
            if (!lastValue.dep.hasDependents()) {
              getter.stop();
            }
          });
        }
      });

      // If something stops our autorun from the outside, we want to know that and update internal state accordingly.
      // This means that if computed field was created inside an autorun, and that autorun is invalided our autorun is
      // stopped. But then computed field might be still around and it might be asked again for the value. We want to
      // restart our autorun in that case. Instead of trying to recompute the stopped autorun.
      if (handle.onStop) {
        handle.onStop(() => {
          handle = null;
        });
      } else {
        // XXX COMPAT WITH METEOR 1.1.0
        const originalStop = handle.stop;
        handle.stop = function () {
          if (handle) {
            originalStop.call(handle);
          }
          handle = null;
        };
      }
    };
    startAutorun();
    const getter = function () {
      // We always flush so that you get the most recent value. This is a noop if autorun was not invalidated.
      getter.flush();
      return lastValue.get();
    };

    // We mingle the prototype so that getter instanceof ComputedField is true.
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(getter, this.constructor.prototype);
    } else {
      getter.__proto__ = this.constructor.prototype;
    }
    getter.toString = function () {
      return "ComputedField{".concat(this(), "}");
    };
    getter.apply = () => {
      return getter();
    };
    getter.call = () => {
      return getter();
    };

    // If this autorun is nested in the outside autorun it gets stopped automatically when the outside autorun gets
    // invalidated, so no need to call destroy. But otherwise you should call destroy when the field is not needed anymore.
    getter.stop = function () {
      if (handle != null) {
        handle.stop();
      }
      return handle = null;
    };

    // For tests.
    getter._isRunning = () => {
      return !!handle;
    };

    // Sometimes you want to force recomputation of the new value before the global Tracker flush is done.
    // This is a noop if autorun was not invalidated.
    getter.flush = () => {
      Tracker.nonreactive(function () {
        if (handle) {
          handle.flush();
        } else {
          // If there is no autorun, create it now. This will do initial recomputation as well. If there
          // will be no dependents after the global flush, autorun will stop (again).
          startAutorun();
        }
      });
    };
    return getter;
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/peerlibrary:computed-field/lib.js");

/* Exports */
Package._define("peerlibrary:computed-field", exports, {
  ComputedField: ComputedField
});

})();

//# sourceURL=meteor://💻app/packages/peerlibrary_computed-field.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcGVlcmxpYnJhcnk6Y29tcHV0ZWQtZmllbGQvbGliLmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydCIsIkNvbXB1dGVkRmllbGQiLCJjb25zdHJ1Y3RvciIsImZ1bmMiLCJlcXVhbHNGdW5jIiwiZG9udFN0b3AiLCJfIiwiaXNCb29sZWFuIiwiaGFuZGxlIiwibGFzdFZhbHVlIiwiYXV0b3J1biIsImN1cnJlbnRWaWV3IiwiUGFja2FnZSIsImJsYXplIiwiQmxhemUiLCJfaXNJblJlbmRlciIsImYiLCJ0ZW1wbGF0ZUluc3RhbmNlRnVuYyIsIlRlbXBsYXRlIiwiX2N1cnJlbnRUZW1wbGF0ZUluc3RhbmNlRnVuYyIsImNvbXAiLCJUcmFja2VyIiwiYyIsIl93aXRoQ3VycmVudFZpZXciLCJfd2l0aFRlbXBsYXRlSW5zdGFuY2VGdW5jIiwiY2FsbCIsInN0b3BDb21wdXRhdGlvbiIsInN0b3AiLCJvblZpZXdEZXN0cm95ZWQiLCJvblN0b3AiLCJyZW1vdmVWaWV3RGVzdHJveWVkTGlzdGVuZXIiLCJzdGFydEF1dG9ydW4iLCJjb21wdXRhdGlvbiIsInZhbHVlIiwiUmVhY3RpdmVWYXIiLCJzZXQiLCJhZnRlckZsdXNoIiwiZGVwIiwiaGFzRGVwZW5kZW50cyIsImdldHRlciIsIm9yaWdpbmFsU3RvcCIsImZsdXNoIiwiZ2V0IiwiT2JqZWN0Iiwic2V0UHJvdG90eXBlT2YiLCJwcm90b3R5cGUiLCJfX3Byb3RvX18iLCJ0b1N0cmluZyIsImNvbmNhdCIsImFwcGx5IiwiX2lzUnVubmluZyIsIm5vbnJlYWN0aXZlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLE1BQU0sQ0FBQ0MsTUFBTSxDQUFDO0VBQUNDLGFBQWEsRUFBQ0EsQ0FBQSxLQUFJQTtBQUFhLENBQUMsQ0FBQztBQUF6QyxNQUFNQSxhQUFhLENBQUM7RUFDekJDLFdBQVdBLENBQUNDLElBQUksRUFBRUMsVUFBVSxFQUFFQyxRQUFRLEVBQUU7SUFDdEM7SUFDQSxJQUFJQyxDQUFDLENBQUNDLFNBQVMsQ0FBQ0gsVUFBVSxDQUFDLEVBQUU7TUFDM0JDLFFBQVEsR0FBR0QsVUFBVTtNQUNyQkEsVUFBVSxHQUFHLElBQUk7SUFDbkI7SUFFQSxJQUFJSSxNQUFNLEdBQUcsSUFBSTtJQUNqQixJQUFJQyxTQUFTLEdBQUcsSUFBSTs7SUFFcEI7SUFDQTtJQUNBLElBQUlDLE9BQU87SUFDWCxNQUFNQyxXQUFXLEdBQUdDLE9BQU8sQ0FBQ0MsS0FBSyxJQUFJRCxPQUFPLENBQUNDLEtBQUssQ0FBQ0MsS0FBSyxJQUFJRixPQUFPLENBQUNDLEtBQUssQ0FBQ0MsS0FBSyxDQUFDSCxXQUFXO0lBQzNGLElBQUlBLFdBQVcsRUFBRTtNQUNmLElBQUlBLFdBQVcsQ0FBQ0ksV0FBVyxFQUFFO1FBQzNCO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQUwsT0FBTyxHQUFHLFNBQUFBLENBQVVNLENBQUMsRUFBRTtVQUNyQixNQUFNQyxvQkFBb0IsR0FBR0wsT0FBTyxDQUFDQyxLQUFLLENBQUNDLEtBQUssQ0FBQ0ksUUFBUSxDQUFDQyw0QkFBNEI7VUFFdEYsTUFBTUMsSUFBSSxHQUFHQyxPQUFPLENBQUNYLE9BQU8sQ0FBRVksQ0FBQyxJQUFLO1lBQ2xDVixPQUFPLENBQUNDLEtBQUssQ0FBQ0MsS0FBSyxDQUFDUyxnQkFBZ0IsQ0FBQ1osV0FBVyxFQUFFLE1BQU07Y0FDdERDLE9BQU8sQ0FBQ0MsS0FBSyxDQUFDQyxLQUFLLENBQUNJLFFBQVEsQ0FBQ00seUJBQXlCLENBQUNQLG9CQUFvQixFQUFFLE1BQU07Z0JBQ2pGRCxDQUFDLENBQUNTLElBQUksQ0FBQ2QsV0FBVyxFQUFFVyxDQUFDLENBQUM7Y0FDeEIsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDO1VBQ0osQ0FBQyxDQUFDO1VBRUYsTUFBTUksZUFBZSxHQUFHQSxDQUFBLEtBQU07WUFDNUJOLElBQUksQ0FBQ08sSUFBSSxDQUFDLENBQUM7VUFDYixDQUFDO1VBQ0RoQixXQUFXLENBQUNpQixlQUFlLENBQUNGLGVBQWUsQ0FBQztVQUM1Q04sSUFBSSxDQUFDUyxNQUFNLENBQUMsTUFBTTtZQUNoQmxCLFdBQVcsQ0FBQ21CLDJCQUEyQixDQUFDSixlQUFlLENBQUM7VUFDMUQsQ0FBQyxDQUFDO1VBRUYsT0FBT04sSUFBSTtRQUNiLENBQUM7TUFFSCxDQUFDLE1BQ0k7UUFDSFYsT0FBTyxHQUFJTSxDQUFDLElBQUs7VUFDZixPQUFPTCxXQUFXLENBQUNELE9BQU8sQ0FBQ00sQ0FBQyxDQUFDO1FBQy9CLENBQUM7TUFDSDtJQUNGLENBQUMsTUFDSTtNQUNITixPQUFPLEdBQUdXLE9BQU8sQ0FBQ1gsT0FBTztJQUMzQjtJQUVBLE1BQU1xQixZQUFZLEdBQUcsU0FBQUEsQ0FBQSxFQUFZO01BQy9CdkIsTUFBTSxHQUFHRSxPQUFPLENBQUMsVUFBVXNCLFdBQVcsRUFBRTtRQUN0QyxNQUFNQyxLQUFLLEdBQUc5QixJQUFJLENBQUMsQ0FBQztRQUVwQixJQUFJLENBQUNNLFNBQVMsRUFBRTtVQUNkQSxTQUFTLEdBQUcsSUFBSXlCLFdBQVcsQ0FBQ0QsS0FBSyxFQUFFN0IsVUFBVSxDQUFDO1FBQ2hELENBQUMsTUFDSTtVQUNISyxTQUFTLENBQUMwQixHQUFHLENBQUNGLEtBQUssQ0FBQztRQUN0QjtRQUVBLElBQUksQ0FBQzVCLFFBQVEsRUFBRTtVQUNiZ0IsT0FBTyxDQUFDZSxVQUFVLENBQUMsWUFBWTtZQUM3QjtZQUNBO1lBQ0EsSUFBSSxDQUFDM0IsU0FBUyxDQUFDNEIsR0FBRyxDQUFDQyxhQUFhLENBQUMsQ0FBQyxFQUFFO2NBQ2xDQyxNQUFNLENBQUNaLElBQUksQ0FBQyxDQUFDO1lBQ2Y7VUFDRixDQUFDLENBQUM7UUFDSjtNQUNGLENBQUMsQ0FBQzs7TUFFRjtNQUNBO01BQ0E7TUFDQTtNQUNBLElBQUluQixNQUFNLENBQUNxQixNQUFNLEVBQUU7UUFDakJyQixNQUFNLENBQUNxQixNQUFNLENBQUMsTUFBTTtVQUNsQnJCLE1BQU0sR0FBRyxJQUFJO1FBQ2YsQ0FBQyxDQUFDO01BQ0osQ0FBQyxNQUNJO1FBQ0g7UUFDQSxNQUFNZ0MsWUFBWSxHQUFHaEMsTUFBTSxDQUFDbUIsSUFBSTtRQUNoQ25CLE1BQU0sQ0FBQ21CLElBQUksR0FBRyxZQUFZO1VBQ3hCLElBQUluQixNQUFNLEVBQUU7WUFDVmdDLFlBQVksQ0FBQ2YsSUFBSSxDQUFDakIsTUFBTSxDQUFDO1VBQzNCO1VBQ0FBLE1BQU0sR0FBRyxJQUFJO1FBQ2YsQ0FBQztNQUNIO0lBQ0YsQ0FBQztJQUVEdUIsWUFBWSxDQUFDLENBQUM7SUFFZCxNQUFNUSxNQUFNLEdBQUcsU0FBQUEsQ0FBQSxFQUFZO01BQ3pCO01BQ0FBLE1BQU0sQ0FBQ0UsS0FBSyxDQUFDLENBQUM7TUFDZCxPQUFPaEMsU0FBUyxDQUFDaUMsR0FBRyxDQUFDLENBQUM7SUFDeEIsQ0FBQzs7SUFFRDtJQUNBLElBQUlDLE1BQU0sQ0FBQ0MsY0FBYyxFQUFFO01BQ3pCRCxNQUFNLENBQUNDLGNBQWMsQ0FBQ0wsTUFBTSxFQUFFLElBQUksQ0FBQ3JDLFdBQVcsQ0FBQzJDLFNBQVMsQ0FBQztJQUMzRCxDQUFDLE1BQ0k7TUFDSE4sTUFBTSxDQUFDTyxTQUFTLEdBQUcsSUFBSSxDQUFDNUMsV0FBVyxDQUFDMkMsU0FBUztJQUMvQztJQUVBTixNQUFNLENBQUNRLFFBQVEsR0FBRyxZQUFXO01BQzNCLHdCQUFBQyxNQUFBLENBQXdCLElBQUksQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFFRFQsTUFBTSxDQUFDVSxLQUFLLEdBQUcsTUFBTTtNQUNuQixPQUFPVixNQUFNLENBQUMsQ0FBQztJQUNqQixDQUFDO0lBRURBLE1BQU0sQ0FBQ2QsSUFBSSxHQUFHLE1BQU07TUFDbEIsT0FBT2MsTUFBTSxDQUFDLENBQUM7SUFDakIsQ0FBQzs7SUFFRDtJQUNBO0lBQ0FBLE1BQU0sQ0FBQ1osSUFBSSxHQUFHLFlBQVk7TUFDeEIsSUFBSW5CLE1BQU0sSUFBSSxJQUFJLEVBQUU7UUFDbEJBLE1BQU0sQ0FBQ21CLElBQUksQ0FBQyxDQUFDO01BQ2Y7TUFDQSxPQUFPbkIsTUFBTSxHQUFHLElBQUk7SUFDdEIsQ0FBQzs7SUFFRDtJQUNBK0IsTUFBTSxDQUFDVyxVQUFVLEdBQUcsTUFBTTtNQUN4QixPQUFPLENBQUMsQ0FBQzFDLE1BQU07SUFDakIsQ0FBQzs7SUFFRDtJQUNBO0lBQ0ErQixNQUFNLENBQUNFLEtBQUssR0FBRyxNQUFNO01BQ25CcEIsT0FBTyxDQUFDOEIsV0FBVyxDQUFDLFlBQVk7UUFDOUIsSUFBSTNDLE1BQU0sRUFBRTtVQUNWQSxNQUFNLENBQUNpQyxLQUFLLENBQUMsQ0FBQztRQUNoQixDQUFDLE1BQ0k7VUFDSDtVQUNBO1VBQ0FWLFlBQVksQ0FBQyxDQUFDO1FBQ2hCO01BQ0YsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUVELE9BQU9RLE1BQU07RUFDZjtBQUNGLEMiLCJmaWxlIjoiL3BhY2thZ2VzL3BlZXJsaWJyYXJ5X2NvbXB1dGVkLWZpZWxkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNsYXNzIENvbXB1dGVkRmllbGQge1xuICBjb25zdHJ1Y3RvcihmdW5jLCBlcXVhbHNGdW5jLCBkb250U3RvcCkge1xuICAgIC8vIFRvIHN1cHBvcnQgcGFzc2luZyBib29sZWFuIGFzIHRoZSBzZWNvbmQgYXJndW1lbnQuXG4gICAgaWYgKF8uaXNCb29sZWFuKGVxdWFsc0Z1bmMpKSB7XG4gICAgICBkb250U3RvcCA9IGVxdWFsc0Z1bmM7XG4gICAgICBlcXVhbHNGdW5jID0gbnVsbDtcbiAgICB9XG5cbiAgICBsZXQgaGFuZGxlID0gbnVsbDtcbiAgICBsZXQgbGFzdFZhbHVlID0gbnVsbDtcblxuICAgIC8vIFRPRE86IFByb3ZpZGUgYW4gb3B0aW9uIHRvIHByZXZlbnQgdXNpbmcgdmlldydzIGF1dG9ydW4uXG4gICAgLy8gICAgICAgT25lIGNhbiB3cmFwIGNvZGUgd2l0aCBCbGF6ZS5fd2l0aEN1cnJlbnRWaWV3KG51bGwsIGNvZGUpIHRvIHByZXZlbnQgdXNpbmcgdmlldydzIGF1dG9ydW4gZm9yIG5vdy5cbiAgICBsZXQgYXV0b3J1bjtcbiAgICBjb25zdCBjdXJyZW50VmlldyA9IFBhY2thZ2UuYmxhemUgJiYgUGFja2FnZS5ibGF6ZS5CbGF6ZSAmJiBQYWNrYWdlLmJsYXplLkJsYXplLmN1cnJlbnRWaWV3XG4gICAgaWYgKGN1cnJlbnRWaWV3KSB7XG4gICAgICBpZiAoY3VycmVudFZpZXcuX2lzSW5SZW5kZXIpIHtcbiAgICAgICAgLy8gSW5zaWRlIHJlbmRlciB3ZSBjYW5ub3QgdXNlIGN1cnJlbnRWaWV3LmF1dG9ydW4gZGlyZWN0bHksIHNvIHdlIHVzZSBvdXIgb3duIHZlcnNpb24gb2YgaXQuXG4gICAgICAgIC8vIFRoaXMgYWxsb3dzIGNvbXB1dGVkIGZpZWxkcyB0byBiZSBjcmVhdGVkIGluc2lkZSBCbGF6ZSB0ZW1wbGF0ZSBoZWxwZXJzLCB3aGljaCBhcmUgY2FsbGVkXG4gICAgICAgIC8vIHRoZSBmaXJzdCB0aW1lIGluc2lkZSByZW5kZXIuIFdoaWxlIGN1cnJlbnRWaWV3LmF1dG9ydW4gaXMgZGlzYWxsb3dlZCBpbnNpZGUgcmVuZGVyIGJlY2F1c2VcbiAgICAgICAgLy8gYXV0b3J1biB3b3VsZCBiZSByZWNyZWF0ZWQgZm9yIHJlYWNoIHJlLXJlbmRlciwgdGhpcyBpcyBleGFjdGx5IHdoYXQgY29tcHV0ZWQgZmllbGQgZG9lc1xuICAgICAgICAvLyBhbnl3YXkgc28gaXQgaXMgT0sgZm9yIHVzZSB0byB1c2UgYXV0b3J1biBpbiB0aGlzIHdheS5cbiAgICAgICAgYXV0b3J1biA9IGZ1bmN0aW9uIChmKSB7XG4gICAgICAgICAgY29uc3QgdGVtcGxhdGVJbnN0YW5jZUZ1bmMgPSBQYWNrYWdlLmJsYXplLkJsYXplLlRlbXBsYXRlLl9jdXJyZW50VGVtcGxhdGVJbnN0YW5jZUZ1bmM7XG5cbiAgICAgICAgICBjb25zdCBjb21wID0gVHJhY2tlci5hdXRvcnVuKChjKSA9PiB7XG4gICAgICAgICAgICBQYWNrYWdlLmJsYXplLkJsYXplLl93aXRoQ3VycmVudFZpZXcoY3VycmVudFZpZXcsICgpID0+IHtcbiAgICAgICAgICAgICAgUGFja2FnZS5ibGF6ZS5CbGF6ZS5UZW1wbGF0ZS5fd2l0aFRlbXBsYXRlSW5zdGFuY2VGdW5jKHRlbXBsYXRlSW5zdGFuY2VGdW5jLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgZi5jYWxsKGN1cnJlbnRWaWV3LCBjKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgY29uc3Qgc3RvcENvbXB1dGF0aW9uID0gKCkgPT4ge1xuICAgICAgICAgICAgY29tcC5zdG9wKCk7XG4gICAgICAgICAgfTtcbiAgICAgICAgICBjdXJyZW50Vmlldy5vblZpZXdEZXN0cm95ZWQoc3RvcENvbXB1dGF0aW9uKTtcbiAgICAgICAgICBjb21wLm9uU3RvcCgoKSA9PiB7XG4gICAgICAgICAgICBjdXJyZW50Vmlldy5yZW1vdmVWaWV3RGVzdHJveWVkTGlzdGVuZXIoc3RvcENvbXB1dGF0aW9uKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHJldHVybiBjb21wO1xuICAgICAgICB9O1xuXG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgYXV0b3J1biA9IChmKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGN1cnJlbnRWaWV3LmF1dG9ydW4oZik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBhdXRvcnVuID0gVHJhY2tlci5hdXRvcnVuO1xuICAgIH1cblxuICAgIGNvbnN0IHN0YXJ0QXV0b3J1biA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGhhbmRsZSA9IGF1dG9ydW4oZnVuY3Rpb24gKGNvbXB1dGF0aW9uKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZnVuYygpO1xuXG4gICAgICAgIGlmICghbGFzdFZhbHVlKSB7XG4gICAgICAgICAgbGFzdFZhbHVlID0gbmV3IFJlYWN0aXZlVmFyKHZhbHVlLCBlcXVhbHNGdW5jKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBsYXN0VmFsdWUuc2V0KHZhbHVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghZG9udFN0b3ApIHtcbiAgICAgICAgICBUcmFja2VyLmFmdGVyRmx1c2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gSWYgdGhlcmUgYXJlIG5vIGRlcGVuZGVudHMgYW55bW9yZSwgc3RvcCB0aGUgYXV0b3J1bi4gV2Ugd2lsbCBydW5cbiAgICAgICAgICAgIC8vIGl0IGFnYWluIGluIHRoZSBnZXR0ZXIncyBmbHVzaCBjYWxsIGlmIG5lZWRlZC5cbiAgICAgICAgICAgIGlmICghbGFzdFZhbHVlLmRlcC5oYXNEZXBlbmRlbnRzKCkpIHtcbiAgICAgICAgICAgICAgZ2V0dGVyLnN0b3AoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIElmIHNvbWV0aGluZyBzdG9wcyBvdXIgYXV0b3J1biBmcm9tIHRoZSBvdXRzaWRlLCB3ZSB3YW50IHRvIGtub3cgdGhhdCBhbmQgdXBkYXRlIGludGVybmFsIHN0YXRlIGFjY29yZGluZ2x5LlxuICAgICAgLy8gVGhpcyBtZWFucyB0aGF0IGlmIGNvbXB1dGVkIGZpZWxkIHdhcyBjcmVhdGVkIGluc2lkZSBhbiBhdXRvcnVuLCBhbmQgdGhhdCBhdXRvcnVuIGlzIGludmFsaWRlZCBvdXIgYXV0b3J1biBpc1xuICAgICAgLy8gc3RvcHBlZC4gQnV0IHRoZW4gY29tcHV0ZWQgZmllbGQgbWlnaHQgYmUgc3RpbGwgYXJvdW5kIGFuZCBpdCBtaWdodCBiZSBhc2tlZCBhZ2FpbiBmb3IgdGhlIHZhbHVlLiBXZSB3YW50IHRvXG4gICAgICAvLyByZXN0YXJ0IG91ciBhdXRvcnVuIGluIHRoYXQgY2FzZS4gSW5zdGVhZCBvZiB0cnlpbmcgdG8gcmVjb21wdXRlIHRoZSBzdG9wcGVkIGF1dG9ydW4uXG4gICAgICBpZiAoaGFuZGxlLm9uU3RvcCkge1xuICAgICAgICBoYW5kbGUub25TdG9wKCgpID0+IHtcbiAgICAgICAgICBoYW5kbGUgPSBudWxsO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICAvLyBYWFggQ09NUEFUIFdJVEggTUVURU9SIDEuMS4wXG4gICAgICAgIGNvbnN0IG9yaWdpbmFsU3RvcCA9IGhhbmRsZS5zdG9wO1xuICAgICAgICBoYW5kbGUuc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBpZiAoaGFuZGxlKSB7XG4gICAgICAgICAgICBvcmlnaW5hbFN0b3AuY2FsbChoYW5kbGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBoYW5kbGUgPSBudWxsO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIH07XG5cbiAgICBzdGFydEF1dG9ydW4oKTtcblxuICAgIGNvbnN0IGdldHRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIFdlIGFsd2F5cyBmbHVzaCBzbyB0aGF0IHlvdSBnZXQgdGhlIG1vc3QgcmVjZW50IHZhbHVlLiBUaGlzIGlzIGEgbm9vcCBpZiBhdXRvcnVuIHdhcyBub3QgaW52YWxpZGF0ZWQuXG4gICAgICBnZXR0ZXIuZmx1c2goKTtcbiAgICAgIHJldHVybiBsYXN0VmFsdWUuZ2V0KCk7XG4gICAgfTtcblxuICAgIC8vIFdlIG1pbmdsZSB0aGUgcHJvdG90eXBlIHNvIHRoYXQgZ2V0dGVyIGluc3RhbmNlb2YgQ29tcHV0ZWRGaWVsZCBpcyB0cnVlLlxuICAgIGlmIChPYmplY3Quc2V0UHJvdG90eXBlT2YpIHtcbiAgICAgIE9iamVjdC5zZXRQcm90b3R5cGVPZihnZXR0ZXIsIHRoaXMuY29uc3RydWN0b3IucHJvdG90eXBlKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBnZXR0ZXIuX19wcm90b19fID0gdGhpcy5jb25zdHJ1Y3Rvci5wcm90b3R5cGU7XG4gICAgfVxuXG4gICAgZ2V0dGVyLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gYENvbXB1dGVkRmllbGR7JHt0aGlzKCl9fWA7XG4gICAgfTtcblxuICAgIGdldHRlci5hcHBseSA9ICgpID0+IHtcbiAgICAgIHJldHVybiBnZXR0ZXIoKTtcbiAgICB9O1xuXG4gICAgZ2V0dGVyLmNhbGwgPSAoKSA9PiB7XG4gICAgICByZXR1cm4gZ2V0dGVyKCk7XG4gICAgfTtcblxuICAgIC8vIElmIHRoaXMgYXV0b3J1biBpcyBuZXN0ZWQgaW4gdGhlIG91dHNpZGUgYXV0b3J1biBpdCBnZXRzIHN0b3BwZWQgYXV0b21hdGljYWxseSB3aGVuIHRoZSBvdXRzaWRlIGF1dG9ydW4gZ2V0c1xuICAgIC8vIGludmFsaWRhdGVkLCBzbyBubyBuZWVkIHRvIGNhbGwgZGVzdHJveS4gQnV0IG90aGVyd2lzZSB5b3Ugc2hvdWxkIGNhbGwgZGVzdHJveSB3aGVuIHRoZSBmaWVsZCBpcyBub3QgbmVlZGVkIGFueW1vcmUuXG4gICAgZ2V0dGVyLnN0b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAoaGFuZGxlICE9IG51bGwpIHtcbiAgICAgICAgaGFuZGxlLnN0b3AoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBoYW5kbGUgPSBudWxsO1xuICAgIH07XG5cbiAgICAvLyBGb3IgdGVzdHMuXG4gICAgZ2V0dGVyLl9pc1J1bm5pbmcgPSAoKSA9PiB7XG4gICAgICByZXR1cm4gISFoYW5kbGU7XG4gICAgfTtcblxuICAgIC8vIFNvbWV0aW1lcyB5b3Ugd2FudCB0byBmb3JjZSByZWNvbXB1dGF0aW9uIG9mIHRoZSBuZXcgdmFsdWUgYmVmb3JlIHRoZSBnbG9iYWwgVHJhY2tlciBmbHVzaCBpcyBkb25lLlxuICAgIC8vIFRoaXMgaXMgYSBub29wIGlmIGF1dG9ydW4gd2FzIG5vdCBpbnZhbGlkYXRlZC5cbiAgICBnZXR0ZXIuZmx1c2ggPSAoKSA9PiB7XG4gICAgICBUcmFja2VyLm5vbnJlYWN0aXZlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKGhhbmRsZSkge1xuICAgICAgICAgIGhhbmRsZS5mbHVzaCgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIC8vIElmIHRoZXJlIGlzIG5vIGF1dG9ydW4sIGNyZWF0ZSBpdCBub3cuIFRoaXMgd2lsbCBkbyBpbml0aWFsIHJlY29tcHV0YXRpb24gYXMgd2VsbC4gSWYgdGhlcmVcbiAgICAgICAgICAvLyB3aWxsIGJlIG5vIGRlcGVuZGVudHMgYWZ0ZXIgdGhlIGdsb2JhbCBmbHVzaCwgYXV0b3J1biB3aWxsIHN0b3AgKGFnYWluKS5cbiAgICAgICAgICBzdGFydEF1dG9ydW4oKTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9O1xuXG4gICAgcmV0dXJuIGdldHRlcjtcbiAgfVxufVxuIl19
