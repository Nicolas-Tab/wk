(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var DocHead;

var require = meteorInstall({"node_modules":{"meteor":{"kadira:dochead":{"lib":{"both.js":function module(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/kadira_dochead/lib/both.js                                                                              //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
var FlowRouter = null;
if (Package['kadira:flow-router-ssr']) {
  FlowRouter = Package['kadira:flow-router-ssr'].FlowRouter;
}
if (Meteor.isClient) {
  var titleDependency = new Tracker.Dependency();
}
DocHead = {
  currentTitle: null,
  setTitle(title) {
    if (Meteor.isClient) {
      titleDependency.changed();
      document.title = title;
    } else {
      this.currentTitle = title;
      const titleHtml = "<title>".concat(title, "</title>");
      this._addToHead(titleHtml);
    }
  },
  addMeta(info) {
    this._addTag(info, 'meta');
  },
  addLink(info) {
    this._addTag(info, 'link');
  },
  getTitle() {
    if (Meteor.isClient) {
      titleDependency.depend();
      return document.title;
    }
    return this.currentTitle;
  },
  addLdJsonScript(jsonObj) {
    const strObj = JSON.stringify(jsonObj);
    this._addLdJsonScript(strObj);
  },
  loadScript(url, options, callback) {
    if (Meteor.isClient) {
      npmLoadScript(url, options, callback);
    }
  },
  _addTag(info, tag) {
    const meta = this._buildTag(info, tag);
    if (Meteor.isClient) {
      document.getElementsByTagName('head')[0].insertAdjacentHTML('beforeend', meta);
    } else {
      this._addToHead(meta);
    }
  },
  _addToHead(html) {
    // only work there is kadira:flow-router-ssr
    if (!FlowRouter) {
      return;
    }
    let ssrContext = FlowRouter.ssrContext.get();
    if (ssrContext) {
      ssrContext.addToHead(html);
    }
  },
  _buildTag(metaInfo, type) {
    let props = "";
    for (let key in metaInfo) {
      props += "".concat(key, "=\"").concat(metaInfo[key], "\" ");
    }
    props += 'dochead="1"';
    var meta = "<".concat(type, " ").concat(props, "/>");
    return meta;
  },
  _addLdJsonScript(stringifiedObject) {
    const scriptTag = "<script type=\"application/ld+json\" dochead=\"1\">".concat(stringifiedObject, "</script>");
    if (Meteor.isClient) {
      document.getElementsByTagName('head')[0].insertAdjacentHTML('beforeend', scriptTag);
    } else {
      this._addToHead(scriptTag);
    }
  },
  removeDocHeadAddedTags() {
    if (Meteor.isClient) {
      const elements = document.querySelectorAll('[dochead="1"]');
      // We use for-of here to loop only over iterable objects
      for (let element of elements) {
        element.parentNode.removeChild(element);
      }
    }
  }
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/kadira:dochead/lib/both.js");

/* Exports */
Package._define("kadira:dochead", {
  DocHead: DocHead
});

})();

//# sourceURL=meteor://💻app/packages/kadira_dochead.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMva2FkaXJhOmRvY2hlYWQvbGliL2JvdGguanMiXSwibmFtZXMiOlsiRmxvd1JvdXRlciIsIlBhY2thZ2UiLCJNZXRlb3IiLCJpc0NsaWVudCIsInRpdGxlRGVwZW5kZW5jeSIsIlRyYWNrZXIiLCJEZXBlbmRlbmN5IiwiRG9jSGVhZCIsImN1cnJlbnRUaXRsZSIsInNldFRpdGxlIiwidGl0bGUiLCJjaGFuZ2VkIiwiZG9jdW1lbnQiLCJ0aXRsZUh0bWwiLCJjb25jYXQiLCJfYWRkVG9IZWFkIiwiYWRkTWV0YSIsImluZm8iLCJfYWRkVGFnIiwiYWRkTGluayIsImdldFRpdGxlIiwiZGVwZW5kIiwiYWRkTGRKc29uU2NyaXB0IiwianNvbk9iaiIsInN0ck9iaiIsIkpTT04iLCJzdHJpbmdpZnkiLCJfYWRkTGRKc29uU2NyaXB0IiwibG9hZFNjcmlwdCIsInVybCIsIm9wdGlvbnMiLCJjYWxsYmFjayIsIm5wbUxvYWRTY3JpcHQiLCJ0YWciLCJtZXRhIiwiX2J1aWxkVGFnIiwiZ2V0RWxlbWVudHNCeVRhZ05hbWUiLCJpbnNlcnRBZGphY2VudEhUTUwiLCJodG1sIiwic3NyQ29udGV4dCIsImdldCIsImFkZFRvSGVhZCIsIm1ldGFJbmZvIiwidHlwZSIsInByb3BzIiwia2V5Iiwic3RyaW5naWZpZWRPYmplY3QiLCJzY3JpcHRUYWciLCJyZW1vdmVEb2NIZWFkQWRkZWRUYWdzIiwiZWxlbWVudHMiLCJxdWVyeVNlbGVjdG9yQWxsIiwiZWxlbWVudCIsInBhcmVudE5vZGUiLCJyZW1vdmVDaGlsZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxVQUFVLEdBQUcsSUFBSTtBQUNyQixJQUFJQyxPQUFPLENBQUMsd0JBQXdCLENBQUMsRUFBRTtFQUNyQ0QsVUFBVSxHQUFHQyxPQUFPLENBQUMsd0JBQXdCLENBQUMsQ0FBQ0QsVUFBVTtBQUMzRDtBQUVBLElBQUlFLE1BQU0sQ0FB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QUNoQyxPQUFPVixJQUFJO0VBQ2IsQ0FBQztFQUNEUCxnQkFBZ0JBLENBQUNtQixpQkFBaUIsRUFBRTtJQUNsQyxNQUFNQyxTQUFTLHlEQUFBakMsTUFBQSxDQUFxRGdDLGlCQUFpQixjQUFXO0lBQ2hHLElBQUk1QyxNQUFNLENBQUNDLFFBQVEsRUFBRTtNQUNuQlMsUUFBUSxDQUFDd0Isb0JBQW9CLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUNDLGtCQUFrQixDQUFDLFdBQVcsRUFBRVUsU0FBUyxDQUFDO0lBQ3JGLENBQUMsTUFBTTtNQUNMLElBQUksQ0FBQ2hDLFVBQVUsQ0FBQ2dDLFNBQVMsQ0FBQztJQUM1QjtFQUNGLENBQUM7RUFDREMsc0JBQXNCQSxDQUFBLEVBQUc7SUFDdkIsSUFBSTlDLE1BQU0sQ0FBQ0MsUUFBUSxFQUFFO01BQ25CLE1BQU04QyxRQUFRLEdBQUdyQyxRQUFRLENBQUNzQyxnQkFBZ0IsQ0FBQyxlQUFlLENBQUM7TUFDM0Q7TUFDQSxLQUFLLElBQUlDLE9BQU8sSUFBSUYsUUFBUSxFQUFFO1FBQzVCRSxPQUFPLENBQUNDLFVBQVUsQ0FBQ0MsV0FBVyxDQUFDRixPQUFPLENBQUM7TUFDekM7SUFDRjtFQUNGO0FBQ0YsQ0FBQyxDIiwiZmlsZSI6Ii9wYWNrYWdlcy9rYWRpcmFfZG9jaGVhZC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBGbG93Um91dGVyID0gbnVsbDtcbmlmIChQYWNrYWdlWydrYWRpcmE6Zmxvdy1yb3V0ZXItc3NyJ10pIHtcbiAgRmxvd1JvdXRlciA9IFBhY2thZ2VbJ2thZGlyYTpmbG93LXJvdXRlci1zc3InXS5GbG93Um91dGVyO1xufVxuXG5pZiAoTWV0ZW9yLmlzQ2xpZW50KSB7XG4gIHZhciB0aXRsZURlcGVuZGVuY3kgPSBuZXcgVHJhY2tlci5EZXBlbmRlbmN5KCk7XG59XG5cbkRvY0hlYWQgPSB7XG4gIGN1cnJlbnRUaXRsZTogbnVsbCxcbiAgc2V0VGl0bGUodGl0bGUpIHtcbiAgICBpZiAoTWV0ZW9yLmlzQ2xpZW50KSB7XG4gICAgICB0aXRsZURlcGVuZGVuY3kuY2hhbmdlZCgpO1xuICAgICAgZG9jdW1lbnQudGl0bGUgPSB0aXRsZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jdXJyZW50VGl0bGUgPSB0aXRsZTtcbiAgICAgIGNvbnN0IHRpdGxlSHRtbCA9IGA8dGl0bGU+JHt0aXRsZX08L3RpdGxlPmA7XG4gICAgICB0aGlzLl9hZGRUb0hlYWQodGl0bGVIdG1sKTtcbiAgICB9XG4gIH0sXG4gIGFkZE1ldGEoaW5mbykge1xuICAgIHRoaXMuX2FkZFRhZyhpbmZvLCAnbWV0YScpO1xuICB9LFxuICBhZGRMaW5rKGluZm8pIHtcbiAgICB0aGlzLl9hZGRUYWcoaW5mbywgJ2xpbmsnKTtcbiAgfSxcbiAgZ2V0VGl0bGUoKSB7XG4gICAgaWYgKE1ldGVvci5pc0NsaWVudCkge1xuICAgICAgdGl0bGVEZXBlbmRlbmN5LmRlcGVuZCgpO1xuICAgICAgcmV0dXJuIGRvY3VtZW50LnRpdGxlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5jdXJyZW50VGl0bGU7XG4gIH0sXG4gIGFkZExkSnNvblNjcmlwdChqc29uT2JqKSB7XG4gICAgY29uc3Qgc3RyT2JqID0gSlNPTi5zdHJpbmdpZnkoanNvbk9iaik7XG4gICAgdGhpcy5fYWRkTGRKc29uU2NyaXB0KHN0ck9iaik7XG4gIH0sXG4gIGxvYWRTY3JpcHQodXJsLCBvcHRpb25zLCBjYWxsYmFjaykge1xuICAgIGlmIChNZXRlb3IuaXNDbGllbnQpIHtcbiAgICAgIG5wbUxvYWRTY3JpcHQodXJsLCBvcHRpb25zLCBjYWxsYmFjayk7XG4gICAgfVxuICB9LFxuICBfYWRkVGFnKGluZm8sIHRhZykge1xuICAgIGNvbnN0IG1ldGEgPSB0aGlzLl9idWlsZFRhZyhpbmZvLCB0YWcpO1xuICAgIGlmIChNZXRlb3IuaXNDbGllbnQpIHtcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0uaW5zZXJ0QWRqYWNlbnRIVE1MKCdiZWZvcmVlbmQnLCBtZXRhKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fYWRkVG9IZWFkKG1ldGEpO1xuICAgIH1cbiAgfSxcbiAgX2FkZFRvSGVhZChodG1sKSB7XG4gICAgLy8gb25seSB3b3JrIHRoZXJlIGlzIGthZGlyYTpmbG93LXJvdXRlci1zc3JcbiAgICBpZiAoIUZsb3dSb3V0ZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGV0IHNzckNvbnRleHQgPSBGbG93Um91dGVyLnNzckNvbnRleHQuZ2V0KCk7XG4gICAgaWYgKHNzckNvbnRleHQpIHtcbiAgICAgIHNzckNvbnRleHQuYWRkVG9IZWFkKGh0bWwpO1xuICAgIH1cbiAgfSxcbiAgX2J1aWxkVGFnKG1ldGFJbmZvLCB0eXBlKSB7XG4gICAgbGV0IHByb3BzID0gXCJcIjtcbiAgICBmb3IgKGxldCBrZXkgaW4gbWV0YUluZm8pIHtcbiAgICAgIHByb3BzICs9IGAke2tleX09XCIke21ldGFJbmZvW2tleV19XCIgYDtcbiAgICB9XG4gICAgcHJvcHMgKz0gJ2RvY2hlYWQ9XCIxXCInO1xuICAgIHZhciBtZXRhID0gYDwke3R5cGV9ICR7cHJvcHN9Lz5gO1xuICAgIHJldHVybiBtZXRhO1xuICB9LFxuICBfYWRkTGRKc29uU2NyaXB0KHN0cmluZ2lmaWVkT2JqZWN0KSB7XG4gICAgY29uc3Qgc2NyaXB0VGFnID0gYDxzY3JpcHQgdHlwZT1cImFwcGxpY2F0aW9uL2xkK2pzb25cIiBkb2NoZWFkPVwiMVwiPiR7c3RyaW5naWZpZWRPYmplY3R9PC9zY3JpcHQ+YDtcbiAgICBpZiAoTWV0ZW9yLmlzQ2xpZW50KSB7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLmluc2VydEFkamFjZW50SFRNTCgnYmVmb3JlZW5kJywgc2NyaXB0VGFnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fYWRkVG9IZWFkKHNjcmlwdFRhZyk7XG4gICAgfVxuICB9LFxuICByZW1vdmVEb2NIZWFkQWRkZWRUYWdzKCkge1xuICAgIGlmIChNZXRlb3IuaXNDbGllbnQpIHtcbiAgICAgIGNvbnN0IGVsZW1lbnRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RvY2hlYWQ9XCIxXCJdJyk7XG4gICAgICAvLyBXZSB1c2UgZm9yLW9mIGhlcmUgdG8gbG9vcCBvbmx5IG92ZXIgaXRlcmFibGUgb2JqZWN0c1xuICAgICAgZm9yIChsZXQgZWxlbWVudCBvZiBlbGVtZW50cykge1xuICAgICAgICBlbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZWxlbWVudCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuIl19
