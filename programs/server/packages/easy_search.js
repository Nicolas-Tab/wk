(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var EasySearch = Package['easysearch:components'].EasySearch;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"easy:search":{"main.js":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                        //
// packages/easy_search/main.js                                                           //
//                                                                                        //
////////////////////////////////////////////////////////////////////////////////////////////
                                                                                          //
module.export({
  Index: () => Index,
  Engine: () => Engine,
  ReactiveEngine: () => ReactiveEngine,
  Cursor: () => Cursor,
  MongoDBEngine: () => MongoDBEngine,
  MinimongoEngine: () => MinimongoEngine,
  MongoTextIndexEngine: () => MongoTextIndexEngine,
  SingleIndexComponent: () => SingleIndexComponent,
  BaseComponent: () => BaseComponent,
  FieldInputComponent: () => FieldInputComponent,
  EachComponent: () => EachComponent,
  IfInputEmptyComponent: () => IfInputEmptyComponent,
  IfNoResultsComponent: () => IfNoResultsComponent,
  IfSearchingComponent: () => IfSearchingComponent,
  InputComponent: () => InputComponent,
  LoadMoreComponent: () => LoadMoreComponent,
  PaginationComponent: () => PaginationComponent
});
let Engine, ReactiveEngine, Cursor, MongoDBEngine, MinimongoEngine, MongoTextIndexEngine;
module.link("meteor/easysearch:core", {
  Engine(v) {
    Engine = v;
  },
  ReactiveEngine(v) {
    ReactiveEngine = v;
  },
  Cursor(v) {
    Cursor = v;
  },
  MongoDBEngine(v) {
    MongoDBEngine = v;
  },
  MinimongoEngine(v) {
    MinimongoEngine = v;
  },
  MongoTextIndexEngine(v) {
    MongoTextIndexEngine = v;
  }
}, 0);
let Index, SingleIndexComponent, BaseComponent, FieldInputComponent, EachComponent, IfInputEmptyComponent, IfNoResultsComponent, IfSearchingComponent, InputComponent, LoadMoreComponent, PaginationComponent;
module.link("meteor/easysearch:components", {
  Index(v) {
    Index = v;
  },
  SingleIndexComponent(v) {
    SingleIndexComponent = v;
  },
  BaseComponent(v) {
    BaseComponent = v;
  },
  FieldInputComponent(v) {
    FieldInputComponent = v;
  },
  EachComponent(v) {
    EachComponent = v;
  },
  IfInputEmptyComponent(v) {
    IfInputEmptyComponent = v;
  },
  IfNoResultsComponent(v) {
    IfNoResultsComponent = v;
  },
  IfSearchingComponent(v) {
    IfSearchingComponent = v;
  },
  InputComponent(v) {
    InputComponent = v;
  },
  LoadMoreComponent(v) {
    LoadMoreComponent = v;
  },
  PaginationComponent(v) {
    PaginationComponent = v;
  }
}, 1);
////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/easy:search/main.js");

/* Exports */
Package._define("easy:search", exports, {
  EasySearch: EasySearch
});

})();

//# sourceURL=meteor://💻app/packages/easy_search.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvZWFzeTpzZWFyY2gvbWFpbi5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJJbmRleCIsIkVuZ2luZSIsIlJlYWN0aXZlRW5naW5lIiwiQ3Vyc29yIiwiTW9uZ29EQkVuZ2luZSIsIk1pbmltb25nb0VuZ2luZSIsIk1vbmdvVGV4dEluZGV4RW5naW5lIiwiU2luZ2xlSW5kZXhDb21wb25lbnQiLCJCYXNlQ29tcG9uZW50IiwiRmllbGRJbnB1dENvbXBvbmVudCIsIkVhY2hDb21wb25lbnQiLCJJZklucHV0RW1wdHlDb21wb25lbnQiLCJJZk5vUmVzdWx0c0NvbXBvbmVudCIsIklmU2VhcmNoaW5nQ29tcG9uZW50IiwiSW5wdXRDb21wb25lbnQiLCJMb2FkTW9yZUNvbXBvbmVudCIsIlBhZ2luYXRpb25Db21wb25lbnQiLCJsaW5rIiwidiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxNQUFNLENBQUNDLE1BQU0sQ0FBQztFQUFDQyxLQUFLLEVBQUNBLENBQUEsS0FBSUEsS0FBSztFQUFDQyxNQUFNLEVBQUNBLENBQUEsS0FBSUEsTUFBTTtFQUFDQyxjQUFjLEVBQUNBLENBQUEsS0FBSUEsY0FBYztFQUFDQyxNQUFNLEVBQUNBLENBQUEsS0FBSUEsTUFBTTtFQUFDQyxhQUFhLEVBQUNBLENBQUEsS0FBSUEsYUFBYTtFQUFDQyxlQUFlLEVBQUNBLENBQUEsS0FBSUEsZUFBZTtFQUFDQyxvQkFBb0IsRUFBQ0EsQ0FBQSxLQUFJQSxvQkFBb0I7RUFBQ0Msb0JBQW9CLEVBQUNBLENBQUEsS0FBSUEsb0JBQW9CO0VBQUNDLGFBQWEsRUFBQ0EsQ0FBQSxLQUFJQSxhQUFhO0VBQUNDLG1CQUFtQixFQUFDQSxDQUFBLEtBQUlBLG1CQUFtQjtFQUFDQyxhQUFhLEVBQUNBLENBQUEsS0FBSUEsYUFBYTtFQUFDQyxxQkFBcUIsRUFBQ0EsQ0FBQSxLQUFJQSxxQkFBcUI7RUFBQ0Msb0JBQW9CLEVBQUNBLENBQUEsS0FBSUEsb0JBQW9CO0VBQUNDLG9CQUFvQixFQUFDQSxDQUFBLEtBQUlBLG9CQUFvQjtFQUFDQyxjQUFjLEVBQUNBLENBQUEsS0FBSUEsY0FBYztFQUFDQyxpQkFBaUIsRUFBQ0EsQ0FBQSxLQUFJQSxpQkFBaUI7RUFBQ0MsbUJBQW1CLEVBQUNBLENBQUEsS0FBSUE7QUFBbUIsQ0FBQyxDQUFDO0FBQUMsSUFBSWYsTUFBTSxFQUFDQyxjQUFjLEVBQUNDLE1BQU0sRUFBQ0MsYUFBYSxFQUFDQyxlQUFlLEVBQUNDLG9CQUFvQjtBQUFDUixNQUFNLENBQUNtQixJQUFJLENBQUMsd0JBQXdCLEVBQUM7RUFBQ2hCLE1BQU1BLENBQUNpQixDQUFDLEVBQUM7SUFBQ2pCLE1BQU0sR0FBQ2lCLENBQUM7RUFBQSxDQUFDO0VBQUNoQixjQUFjQSxDQUFDZ0IsQ0FBQyxFQUFDO0lBQUNoQixjQUFjLEdBQUNnQixDQUFDO0VBQUEsQ0FBQztFQUFDZixNQUFNQSxDQUFDZSxDQUFDLEVBQUM7SUFBQ2YsTUFBTSxHQUFDZSxDQUFDO0VBQUEsQ0FBQztFQUFDZCxhQUFhQSxDQUFDYyxDQUFDLEVBQUM7SUFBQ2QsYUFBYSxHQUFDYyxDQUFDO0VBQUEsQ0FBQztFQUFDYixlQUFlQSxDQUFDYSxDQUFDLEVBQUM7SUFBQ2IsZUFBZSxHQUFDYSxDQUFDO0VBQUEsQ0FBQztFQUFDWixvQkFBb0JBLENBQUNZLENBQUMsRUFBQztJQUFDWixvQkFBb0IsR0FBQ1ksQ0FBQztFQUFBO0FBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztBQUFDLElBQUlsQixLQUFLLEVBQUNPLG9CQUFvQixFQUFDQyxhQUFhLEVBQUNDLG1CQUFtQixFQUFDQyxhQUFhLEVBQUNDLHFCQUFxQixFQUFDQyxvQkFBb0IsRUFBQ0Msb0JBQW9CLEVBQUNDLGNBQWMsRUFBQ0MsaUJBQWlCLEVBQUNDLG1CQUFtQjtBQUFDbEIsTUFBTSxDQUFDbUIsSUFBSSxDQUFDLDhCQUE4QixFQUFDO0VBQUNqQixLQUFLQSxDQUFDa0IsQ0FBQyxFQUFDO0lBQUNsQixLQUFLLEdBQUNrQixDQUFDO0VBQUEsQ0FBQztFQUFDWCxvQkFBb0JBLENBQUNXLENBQUMsRUFBQztJQUFDWCxvQkFBb0IsR0FBQ1csQ0FBQztFQUFBLENBQUM7RUFBQ1YsYUFBYUEsQ0FBQ1UsQ0FBQyxFQUFDO0lBQUNWLGFBQWEsR0FBQ1UsQ0FBQztFQUFBLENBQUM7RUFBQ1QsbUJBQW1CQSxDQUFDUyxDQUFDLEVBQUM7SUFBQ1QsbUJBQW1CLEdBQUNTLENBQUM7RUFBQSxDQUFDO0VBQUNSLGFBQWFBLENBQUNRLENBQUMsRUFBQztJQUFDUixhQUFhLEdBQUNRLENBQUM7RUFBQSxDQUFDO0VBQUNQLHFCQUFxQkEsQ0FBQ08sQ0FBQyxFQUFDO0lBQUNQLHFCQUFxQixHQUFDTyxDQUFDO0VBQUEsQ0FBQztFQUFDTixvQkFBb0JBLENBQUNNLENBQUMsRUFBQztJQUFDTixvQkFBb0IsR0FBQ00sQ0FBQztFQUFBLENBQUM7RUFBQ0wsb0JBQW9CQSxDQUFDSyxDQUFDLEVBQUM7SUFBQ0wsb0JBQW9CLEdBQUNLLENBQUM7RUFBQSxDQUFDO0VBQUNKLGNBQWNBLENBQUNJLENBQUMsRUFBQztJQUFDSixjQUFjLEdBQUNJLENBQUM7RUFBQSxDQUFDO0VBQUNILGlCQUFpQkEsQ0FBQ0csQ0FBQyxFQUFDO0lBQUNILGlCQUFpQixHQUFDRyxDQUFDO0VBQUEsQ0FBQztFQUFDRixtQkFBbUJBLENBQUNFLENBQUMsRUFBQztJQUFDRixtQkFBbUIsR0FBQ0UsQ0FBQztFQUFBO0FBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDIiwiZmlsZSI6Ii9wYWNrYWdlcy9lYXN5X3NlYXJjaC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gICAgRW5naW5lLFxuICAgIFJlYWN0aXZlRW5naW5lLFxuICAgIEN1cnNvcixcbiAgICBNb25nb0RCRW5naW5lLFxuICAgIE1pbmltb25nb0VuZ2luZSxcbiAgICBNb25nb1RleHRJbmRleEVuZ2luZSxcbn0gZnJvbSAnbWV0ZW9yL2Vhc3lzZWFyY2g6Y29yZSdcblxuaW1wb3J0IHtcbiAgSW5kZXgsIC8vIGluZGV4IGVuaGFuY2VkIHdpdGggY29tcG9uZW50IGxvZ2ljXG4gIFNpbmdsZUluZGV4Q29tcG9uZW50LFxuICBCYXNlQ29tcG9uZW50LFxuICBGaWVsZElucHV0Q29tcG9uZW50LFxuICBFYWNoQ29tcG9uZW50LFxuICBJZklucHV0RW1wdHlDb21wb25lbnQsXG4gIElmTm9SZXN1bHRzQ29tcG9uZW50LFxuICBJZlNlYXJjaGluZ0NvbXBvbmVudCxcbiAgSW5wdXRDb21wb25lbnQsXG4gIExvYWRNb3JlQ29tcG9uZW50LFxuICBQYWdpbmF0aW9uQ29tcG9uZW50LFxufSBmcm9tICdtZXRlb3IvZWFzeXNlYXJjaDpjb21wb25lbnRzJ1xuXG5leHBvcnQge1xuICBJbmRleCxcbiAgRW5naW5lLFxuICBSZWFjdGl2ZUVuZ2luZSxcbiAgQ3Vyc29yLFxuXG4gIE1vbmdvREJFbmdpbmUsXG4gIE1pbmltb25nb0VuZ2luZSxcbiAgTW9uZ29UZXh0SW5kZXhFbmdpbmUsXG5cbiAgU2luZ2xlSW5kZXhDb21wb25lbnQsXG4gIEJhc2VDb21wb25lbnQsXG4gIEZpZWxkSW5wdXRDb21wb25lbnQsXG4gIEVhY2hDb21wb25lbnQsXG4gIElmSW5wdXRFbXB0eUNvbXBvbmVudCxcbiAgSWZOb1Jlc3VsdHNDb21wb25lbnQsXG4gIElmU2VhcmNoaW5nQ29tcG9uZW50LFxuICBJbnB1dENvbXBvbmVudCxcbiAgTG9hZE1vcmVDb21wb25lbnQsXG4gIFBhZ2luYXRpb25Db21wb25lbnQsXG59XG4iXX0=
