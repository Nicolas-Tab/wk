(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var DDP = Package['ddp-client'].DDP;
var DDPServer = Package['ddp-server'].DDPServer;

(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                             //
// packages/msavin_usercache/server.js                                                         //
//                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                               //
var _original = Meteor.user;

var _getCache = function () {
	var result = undefined;
	var instance = DDP._CurrentMethodInvocation.get() || DDP._CurrentPublicationInvocation.get();
	var isMeteor1_8 = Meteor.release.match('1.8') !== null;

	if (!instance.userId) {
		return result;
	}

	var connectionId = instance.connection.id;
	var connectionData = isMeteor1_8 ? Meteor.default_server.sessions.get(connectionId) : Meteor.default_server.sessions[connectionId];
	var collectionViews = isMeteor1_8 ? connectionData.collectionViews.get('users').documents.get(instance.userId) : connectionData.collectionViews.users.documents[instance.userId];
	var data = collectionViews && collectionViews.dataByKey || [];
	var source = isMeteor1_8 ? Array.from(data.entries()) : Object.keys(data);

	source.forEach(function (item) {
		if (!result) {
			result = {};
		}
		var key = isMeteor1_8 ? item[0] : item;
        result[key] = isMeteor1_8 ? item[1][0].value : data[item][0].value;
	});

	return result;
}

var _getField = function (doc, field) {
	field = field.split('.');

	for (var i = 0; i < field.length; i++) {
		if (!doc[field[i]]) {
			return;
		}
		doc = doc[field[i]];
	}

	return !!doc;
}

Meteor.user = function (input) {
	if (typeof input === "undefined") {
		return _original();
	}

	if (input === true) {
		return _getCache()
	}


	if (typeof input === "string") {
		input = [input];
	}

	if (typeof input === "object") {
		var cache = _getCache()
		var innocent = true;

		input.forEach(function (item) {
			if (typeof _getField(cache, item) === "undefined") {
				innocent = false;
			}
		})

		if (innocent) {
			return cache;
		} else {
			return _original()
		}
	}
}

/////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("msavin:usercache");

})();
