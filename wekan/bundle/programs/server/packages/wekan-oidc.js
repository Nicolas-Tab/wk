(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var OAuth = Package.oauth.OAuth;
var HTTP = Package.http.HTTP;
var HTTPInternals = Package.http.HTTPInternals;
var ECMAScript = Package.ecmascript.ECMAScript;
var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var Oidc, httpCa, user, users, functionName, creationString, id, teamArray, orgArray, isAdmin, teams, orgs, group, initAttributes, isOrg, forceCreate, org, orgHash, team, teamHash, username, user_email, position;

var require = meteorInstall({"node_modules":{"meteor":{"wekan-oidc":{"oidc_server.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/wekan-oidc/oidc_server.js                                                                                //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
let addGroupsWithAttributes, addEmail, changeFullname, changeUsername;
module.link("./loginHandler", {
  addGroupsWithAttributes(v) {
    addGroupsWithAttributes = v;
  },
  addEmail(v) {
    addEmail = v;
  },
  changeFullname(v) {
    changeFullname = v;
  },
  changeUsername(v) {
    changeUsername = v;
  }
}, 0);
Oidc = {};
httpCa = false;
if (process.env.OAUTH2_CA_CERT !== undefined) {
  try {
    const fs = Npm.require('fs');
    if (fs.existsSync(process.env.OAUTH2_CA_CERT)) {
      httpCa = fs.readFileSync(process.env.OAUTH2_CA_CERT);
    }
  } catch (e) {
    console.log('WARNING: failed loading: ' + process.env.OAUTH2_CA_CERT);
    console.log(e);
  }
}
var profile = {};
var serviceData = {};
var userinfo = {};
OAuth.registerService('oidc', 2, null, function (query) {
  var debug = process.env.DEBUG === 'true';
  var token = getToken(query);
  if (debug) console.log('XXX: register token:', token);
  var accessToken = token.access_token || token.id_token;
  var expiresAt = +new Date() + 1000 * parseInt(token.expires_in, 10);
  var claimsInAccessToken = process.env.OAUTH2_ADFS_ENABLED === 'true' || process.env.OAUTH2_ADFS_ENABLED === true || process.env.OAUTH2_B2C_ENABLED === 'true' || process.env.OAUTH2_B2C_ENABLED === true || false;
  if (claimsInAccessToken) {
    // hack when using custom claims in the accessToken. On premise ADFS. And Azure AD B2C.
    userinfo = getTokenContent(accessToken);
  } else {
    // normal behaviour, getting the claims from UserInfo endpoint.
    userinfo = getUserInfo(accessToken);
  }
  if (userinfo.ocs) userinfo = userinfo.ocs.data; // Nextcloud hack
  if (userinfo.metadata) userinfo = userinfo.metadata; // Openshift hack
  if (debug) console.log('XXX: userinfo:', userinfo);
  serviceData.id = userinfo[process.env.OAUTH2_ID_MAP]; // || userinfo["id"];
  serviceData.username = userinfo[process.env.OAUTH2_USERNAME_MAP]; // || userinfo["uid"];
  serviceData.fullname = userinfo[process.env.OAUTH2_FULLNAME_MAP]; // || userinfo["displayName"];
  serviceData.accessToken = accessToken;
  serviceData.expiresAt = expiresAt;

  // If on Oracle OIM email is empty or null, get info from username
  if (process.env.ORACLE_OIM_ENABLED === 'true' || process.env.ORACLE_OIM_ENABLED === true) {
    if (userinfo[process.env.OAUTH2_EMAIL_MAP]) {
      serviceData.email = userinfo[process.env.OAUTH2_EMAIL_MAP];
    } else {
      serviceData.email = userinfo[process.env.OAUTH2_USERNAME_MAP];
    }
  }
  if (process.env.ORACLE_OIM_ENABLED !== 'true' && process.env.ORACLE_OIM_ENABLED !== true) {
    serviceData.email = userinfo[process.env.OAUTH2_EMAIL_MAP]; // || userinfo["email"];
  }
  if (process.env.OAUTH2_B2C_ENABLED === 'true' || process.env.OAUTH2_B2C_ENABLED === true) {
    serviceData.email = userinfo["emails"][0];
  }
  if (accessToken) {
    var tokenContent = getTokenContent(accessToken);
    var fields = _.pick(tokenContent, getConfiguration().idTokenWhitelistFields);
    _.extend(serviceData, fields);
  }
  if (token.refresh_token) serviceData.refreshToken = token.refresh_token;
  if (debug) console.log('XXX: serviceData:', serviceData);
  profile.name = userinfo[process.env.OAUTH2_FULLNAME_MAP]; // || userinfo["displayName"];
  profile.email = userinfo[process.env.OAUTH2_EMAIL_MAP]; // || userinfo["email"];

  if (process.env.OAUTH2_B2C_ENABLED === 'true' || process.env.OAUTH2_B2C_ENABLED === true) {
    profile.email = userinfo["emails"][0];
  }
  if (debug) console.log('XXX: profile:', profile);

  //temporarily store data from oidc in user.services.oidc.groups to update groups
  serviceData.groups = userinfo["groups"] && userinfo["wekanGroups"] ? userinfo["wekanGroups"] : userinfo["groups"];
  // groups arriving as array of strings indicate there is no scope set in oidc privider
  // to assign teams and keep admin privileges
  // data needs to be treated  differently.
  // use case: in oidc provider no scope is set, hence no group attributes.
  //    therefore: keep admin privileges for wekan as before
  if (Array.isArray(serviceData.groups) && serviceData.groups.length && typeof serviceData.groups[0] === "string") {
    user = Meteor.users.findOne({
      '_id': serviceData.id
    });
    serviceData.groups.forEach(function (groupName, i) {
      var _user;
      if ((_user = user) !== null && _user !== void 0 && _user.isAdmin && i == 0) {
        // keep information of user.isAdmin since in loginHandler the user will // be updated regarding group admin privileges provided via oidc
        serviceData.groups[i] = {
          "isAdmin": true
        };
        serviceData.groups[i]["displayName"] = groupName;
      } else {
        serviceData.groups[i] = {
          "displayName": groupName
        };
      }
    });
  }

  // Fix OIDC login loop for integer user ID. Thanks to danielkaiser.
  // https://github.com/wekan/wekan/issues/4795
  Meteor.call('groupRoutineOnLogin', serviceData, "" + serviceData.id);
  Meteor.call('boardRoutineOnLogin', serviceData, "" + serviceData.id);
  return {
    serviceData: serviceData,
    options: {
      profile: profile
    }
  };
});
var userAgent = "Meteor";
if (Meteor.release) {
  userAgent += "/" + Meteor.release;
}
if (process.env.ORACLE_OIM_ENABLED !== 'true' && process.env.ORACLE_OIM_ENABLED !== true) {
  var getToken = function (query) {
    var debug = process.env.DEBUG === 'true';
    var config = getConfiguration();
    if (config.tokenEndpoint.includes('https://')) {
      var serverTokenEndpoint = config.tokenEndpoint;
    } else {
      var serverTokenEndpoint = config.serverUrl + config.tokenEndpoint;
    }
    var requestPermissions = config.requestPermissions;
    var response;
    try {
      var postOptions = {
        headers: {
          Accept: 'application/json',
          "User-Agent": userAgent
        },
        params: {
          code: query.code,
          client_id: config.clientId,
          client_secret: OAuth.openSecret(config.secret),
          redirect_uri: OAuth._redirectUri('oidc', config),
          grant_type: 'authorization_code',
          state: query.state
        }
      };
      if (httpCa) {
        postOptions['npmRequestOptions'] = {
          ca: httpCa
        };
      }
      response = HTTP.post(serverTokenEndpoint, postOptions);
    } catch (err) {
      throw _.extend(new Error("Failed to get token from OIDC " + serverTokenEndpoint + ": " + err.message), {
        response: err.response
      });
    }
    if (response.data.error) {
      // if the http response was a json object with an error attribute
      throw new Error("Failed to complete handshake with OIDC " + serverTokenEndpoint + ": " + response.data.error);
    } else {
      if (debug) console.log('XXX: getToken response: ', response.data);
      return response.data;
    }
  };
}
if (process.env.ORACLE_OIM_ENABLED === 'true' || process.env.ORACLE_OIM_ENABLED === true) {
  var getToken = function (query) {
    var debug = process.env.DEBUG === 'true';
    var config = getConfiguration();
    if (config.tokenEndpoint.includes('https://')) {
      var serverTokenEndpoint = config.tokenEndpoint;
    } else {
      var serverTokenEndpoint = config.serverUrl + config.tokenEndpoint;
    }
    var requestPermissions = config.requestPermissions;
    var response;

    // OIM needs basic Authentication token in the header - ClientID + SECRET in base64
    var dataToken = null;
    var strBasicToken = null;
    var strBasicToken64 = null;
    dataToken = process.env.OAUTH2_CLIENT_ID + ':' + process.env.OAUTH2_SECRET;
    strBasicToken = new Buffer(dataToken);
    strBasicToken64 = strBasicToken.toString('base64');

    // eslint-disable-next-line no-console
    if (debug) console.log('Basic Token: ', strBasicToken64);
    try {
      var postOptions = {
        headers: {
          Accept: 'application/json',
          "User-Agent": userAgent,
          "Authorization": "Basic " + strBasicToken64
        },
        params: {
          code: query.code,
          client_id: config.clientId,
          client_secret: OAuth.openSecret(config.secret),
          redirect_uri: OAuth._redirectUri('oidc', config),
          grant_type: 'authorization_code',
          state: query.state
        }
      };
      if (httpCa) {
        postOptions['npmRequestOptions'] = {
          ca: httpCa
        };
      }
      response = HTTP.post(serverTokenEndpoint, postOptions);
    } catch (err) {
      throw _.extend(new Error("Failed to get token from OIDC " + serverTokenEndpoint + ": " + err.message), {
        response: err.response
      });
    }
    if (response.data.error) {
      // if the http response was a json object with an error attribute
      throw new Error("Failed to complete handshake with OIDC " + serverTokenEndpoint + ": " + response.data.error);
    } else {
      // eslint-disable-next-line no-console
      if (debug) console.log('XXX: getToken response: ', response.data);
      return response.data;
    }
  };
}
var getUserInfo = function (accessToken) {
  var debug = process.env.DEBUG === 'true';
  var config = getConfiguration();
  // Some userinfo endpoints use a different base URL than the authorization or token endpoints.
  // This logic allows the end user to override the setting by providing the full URL to userinfo in their config.
  if (config.userinfoEndpoint.includes("https://")) {
    var serverUserinfoEndpoint = config.userinfoEndpoint;
  } else {
    var serverUserinfoEndpoint = config.serverUrl + config.userinfoEndpoint;
  }
  var response;
  try {
    var getOptions = {
      headers: {
        "User-Agent": userAgent,
        "Authorization": "Bearer " + accessToken
      }
    };
    if (httpCa) {
      getOptions['npmRequestOptions'] = {
        ca: httpCa
      };
    }
    response = HTTP.get(serverUserinfoEndpoint, getOptions);
  } catch (err) {
    throw _.extend(new Error("Failed to fetch userinfo from OIDC " + serverUserinfoEndpoint + ": " + err.message), {
      response: err.response
    });
  }
  if (debug) console.log('XXX: getUserInfo response: ', response.data);
  return response.data;
};
var getConfiguration = function () {
  var config = ServiceConfiguration.configurations.findOne({
    service: 'oidc'
  });
  if (!config) {
    throw new ServiceConfiguration.ConfigError('Service oidc not configured.');
  }
  return config;
};
var getTokenContent = function (token) {
  var content = null;
  if (token) {
    try {
      var parts = token.split('.');
      var header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
      content = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      var signature = Buffer.from(parts[2], 'base64');
      var signed = parts[0] + '.' + parts[1];
    } catch (err) {
      this.content = {
        exp: 0
      };
    }
  }
  return content;
};
Meteor.methods({
  'groupRoutineOnLogin': function (info, userId) {
    check(info, Object);
    check(userId, String);
    var propagateOidcData = process.env.PROPAGATE_OIDC_DATA || false;
    if (propagateOidcData) {
      users = Meteor.users;
      user = users.findOne({
        'services.oidc.id': userId
      });
      if (user) {
        //updates/creates Groups and user admin privileges accordingly if not undefined
        if (info.groups) {
          addGroupsWithAttributes(user, info.groups);
        }
        if (info.email) addEmail(user, info.email);
        if (info.fullname) changeFullname(user, info.fullname);
        if (info.username) changeUsername(user, info.username);
      }
    }
  }
});
Meteor.methods({
  'boardRoutineOnLogin': function (info, oidcUserId) {
    var _Users$findOne;
    check(info, Object);
    check(oidcUserId, String);
    const defaultBoardParams = (process.env.DEFAULT_BOARD_ID || '').split(':');
    const defaultBoardId = defaultBoardParams.shift();
    if (!defaultBoardId) return;
    const board = Boards.findOne(defaultBoardId);
    const userId = (_Users$findOne = Users.findOne({
      'services.oidc.id': oidcUserId
    })) === null || _Users$findOne === void 0 ? void 0 : _Users$findOne._id;
    const memberIndex = _.pluck(board === null || board === void 0 ? void 0 : board.members, 'userId').indexOf(userId);
    if (!board || !userId || memberIndex > -1) return;
    board.addMember(userId);
    board.setMemberPermission(userId, defaultBoardParams.contains("isAdmin"), defaultBoardParams.contains("isNoComments"), defaultBoardParams.contains("isCommentsOnly"), defaultBoardParams.contains("isWorker"));
  }
});
Oidc.retrieveCredential = function (credentialToken, credentialSecret) {
  return OAuth.retrieveCredential(credentialToken, credentialSecret);
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"loginHandler.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/wekan-oidc/loginHandler.js                                                                               //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
!function (module1) {
  // creates Object if not present in collection
  // initArr = [displayName, shortName, website, isActive]
  // objString = ["Org","Team"] for method mapping
  function createObject(initArr, objString) {
    functionName = objString === "Org" ? 'setCreateOrgFromOidc' : 'setCreateTeamFromOidc';
    creationString = 'setCreate' + objString + 'FromOidc';
    return Meteor.call(functionName, initArr[0],
    //displayName
    initArr[1],
    //desc
    initArr[2],
    //shortName
    initArr[3],
    //website
    initArr[4] //xxxisActive
    );
  }
  function updateObject(initArr, objString) {
    functionName = objString === "Org" ? 'setOrgAllFieldsFromOidc' : 'setTeamAllFieldsFromOidc';
    return Meteor.call(functionName, initArr[0],
    //team || org Object
    initArr[1],
    //displayName
    initArr[2],
    //desc
    initArr[3],
    //shortName
    initArr[4],
    //website
    initArr[5] //xxxisActive
    );
  }
  //checks whether obj is in collection of userObjs
  //params
  //e.g. userObjs = user.teams
  //e.g. obj = Team.findOne...
  //e.g. collection = "team"
  function contains(userObjs, obj, collection) {
    id = collection + 'Id';
    if (typeof userObjs == "undefined" || !userObjs.length) {
      return false;
    }
    for (const [count, hash] of Object.entries(userObjs)) {
      if (hash[id] === obj._id) {
        return true;
      }
    }
    return false;
  }
  module.exports = {
    // This function adds groups as organizations or teams to users and
    // creates them if not already existing
    // DEFAULT after creation orgIsActive & teamIsActive: true
    // PODC provider needs to send group data within "wekanGroup" scope
    // PARAMS to be set for groups within your Oidc provider:
    //  isAdmin: [true, false] -> admin group becomes admin in wekan
    //  isOrganization: [true, false] -> creates org and adds to user
    //  displayName: "string"
    addGroupsWithAttributes: function (user, groups) {
      teamArray = [];
      orgArray = [];
      isAdmin = [];
      teams = user.teams;
      orgs = user.orgs;
      for (group of groups) {
        initAttributes = [group.displayName, group.desc || group.displayName, group.shortName || group.displayName, group.website || group.displayName, group.isActive || false];
        isOrg = group.isOrganisation || false;
        forceCreate = group.forceCreate || false;
        isAdmin.push(group.isAdmin || false);
        if (isOrg) {
          org = Org.findOne({
            "orgDisplayName": group.displayName
          });
          if (org) {
            if (contains(orgs, org, "org")) {
              initAttributes.unshift(org);
              updateObject(initAttributes, "Org");
              continue;
            }
          } else if (forceCreate) {
            createObject(initAttributes, "Org");
            org = Org.findOne({
              'orgDisplayName': group.displayName
            });
          } else {
            continue;
          }
          orgHash = {
            'orgId': org._id,
            'orgDisplayName': group.displayName
          };
          orgArray.push(orgHash);
        } else {
          //start team routine
          team = Team.findOne({
            "teamDisplayName": group.displayName
          });
          if (team) {
            if (contains(teams, team, "team")) {
              initAttributes.unshift(team);
              updateObject(initAttributes, "Team");
              continue;
            }
          } else if (forceCreate) {
            createObject(initAttributes, "Team");
            team = Team.findOne({
              'teamDisplayName': group.displayName
            });
          } else {
            continue;
          }
          teamHash = {
            'teamId': team._id,
            'teamDisplayName': group.displayName
          };
          teamArray.push(teamHash);
        }
      }
      // user is assigned to team/org which has set isAdmin: true in oidc data
      // hence user will get admin privileges in wekan
      // E.g. Admin rights will be withdrawn if no group in oidc provider has isAdmin set to true

      users.update({
        _id: user._id
      }, {
        $set: {
          isAdmin: isAdmin.some(i => i === true)
        }
      });
      teams = {
        'teams': {
          '$each': teamArray
        }
      };
      orgs = {
        'orgs': {
          '$each': orgArray
        }
      };
      users.update({
        _id: user._id
      }, {
        $push: teams
      });
      users.update({
        _id: user._id
      }, {
        $push: orgs
      });
      // remove temporary oidc data from user collection
      users.update({
        _id: user._id
      }, {
        $unset: {
          "services.oidc.groups": []
        }
      });
      return;
    },
    changeUsername: function (user, name) {
      username = {
        'username': name
      };
      if (user.username != username) users.update({
        _id: user._id
      }, {
        $set: username
      });
    },
    changeFullname: function (user, name) {
      username = {
        'profile.fullname': name
      };
      if (user.username != username) users.update({
        _id: user._id
      }, {
        $set: username
      });
    },
    addEmail: function (user, email) {
      user_email = user.emails || [];
      var contained = false;
      position = 0;
      for (const [count, mail_hash] of Object.entries(user_email)) {
        if (mail_hash['address'] === email) {
          contained = true;
          position = count;
          break;
        }
      }
      if (contained && position != 0) {
        user_email.splice(position, 1);
        contained = false;
      }
      if (!contained) {
        user_email.unshift({
          'address': email,
          'verified': true
        });
        user_email = {
          'emails': user_email
        };
        users.update({
          _id: user._id
        }, {
          $set: user_email
        });
      }
    }
  };
}.call(this, module);
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/wekan-oidc/oidc_server.js");

/* Exports */
Package._define("wekan-oidc", {
  Oidc: Oidc
});

})();

//# sourceURL=meteor://💻app/packages/wekan-oidc.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvd2VrYW4tb2lkYy9vaWRjX3NlcnZlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvd2VrYW4tb2lkYy9sb2dpbkhhbmRsZXIuanMiXSwibmFtZXMiOlsiYWRkR3JvdXBzV2l0aEF0dHJpYnV0ZXMiLCJhZGRFbWFpbCIsImNoYW5nZUZ1bGxuYW1lIiwiY2hhbmdlVXNlcm5hbWUiLCJtb2R1bGUiLCJsaW5rIiwidiIsIk9pZGMiLCJodHRwQ2EiLCJwcm9jZXNzIiwiZW52IiwiT0FVVEgyX0NBX0NFUlQiLCJ1bmRlZmluZWQiLCJmcyIsIk5wbSIsInJlcXVpcmUiLCJleGlzdHNTeW5jIiwicmVhZEZpbGVTeW5jIiwiZSIsImNvbnNvbGUiLCJsb2ciLCJwcm9maWxlIiwic2VydmljZURhdGEiLCJ1c2VyaW5mbyIsIk9BdXRoIiwicmVnaXN0ZXJTZXJ2aWNlIiwicXVlcnkiLCJkZWJ1ZyIsIkRFQlVHIiwidG9rZW4iLCJnZXRUb2tlbiIsImFjY2Vzc1Rva2VuIiwiYWNjZXNzX3Rva2VuIiwiaWRfdG9rZW4iLCJleHBpcmVzQXQiLCJEYXRlIiwicGFyc2VJbnQiLCJleHBpcmVzX2luIiwiY2xhaW1zSW5BY2Nlc3NUb2tlbiIsIk9BVVRIMl9BREZTX0VOQUJMRUQiLCJPQVVUSDJfQjJDX0VOQUJMRUQiLCJnZXRUb2tlbkNvbnRlbnQiLCJnZXRVc2VySW5mbyIsIm9jcyIsImRhdGEiLCJtZXRhZGF0YSIsImlkIiwiT0FVVEgyX0lEX01BUCIsInVzZXJuYW1lIiwiT0FVVEgyX1VTRVJOQU1FX01BUCIsImZ1bGxuYW1lIiwiT0FVVEgyX0ZVTExOQU1FX01BUCIsIk9SQUNMRV9PSU1fRU5BQkxFRCIsIk9BVVRIMl9FTUFJTF9NQVAiLCJlbWFpbCIsInRva2VuQ29udGVudCIsImZpZWxkcyIsIl8iLCJwaWNrIiwiZ2V0Q29uZmlndXJhdGlvbiIsImlkVG9rZW5XaGl0ZWxpc3RGaWVsZHMiLCJleHRlbmQiLCJyZWZyZXNoX3Rva2VuIiwicmVmcmVzaFRva2VuIiwibmFtZSIsImdyb3VwcyIsIkFycmF5IiwiaXNBcnJheSIsImxlbmd0aCIsInVzZXIiLCJNZXRlb3IiLCJ1c2VycyIsImZpbmRPbmUiLCJmb3JFYWNoIiwiZ3JvdXBOYW1lIiwiaSIsIl91c2VyIiwiaXNBZG1pbiIsImNhbGwiLCJvcHRpb25zIiwidXNlckFnZW50IiwicmVsZWFzZSIsImNvbmZpZyIsInRva2VuRW5kcG9pbnQiLCJpbmNsdWRlcyIsInNlcnZlclRva2VuRW5kcG9pbnQiLCJzZXJ2ZXJVcmwiLCJyZXF1ZXN0UGVybWlzc2lvbnMiLCJyZXNwb25zZSIsInBvc3RPcHRpb25zIiwiaGVhZGVycyIsIkFjY2VwdCIsInBhcmFtcyIsImNvZGUiLCJjbGllbnRfaWQiLCJjbGllbnRJZCIsImNsaWVudF9zZWNyZXQiLCJvcGVuU2VjcmV0Iiwic2VjcmV0IiwicmVkaXJlY3RfdXJpIiwiX3JlZGlyZWN0VXJpIiwiZ3JhbnRfdHlwZSIsInN0YXRlIiwiY2EiLCJIVFRQIiwicG9zdCIsImVyciIsIkVycm9yIiwibWVzc2FnZSIsImVycm9yIiwiZGF0YVRva2VuIiwic3RyQmFzaWNUb2tlbiIsInN0ckJhc2ljVG9rZW42NCIsIk9BVVRIMl9DTElFTlRfSUQiLCJPQVVUSDJfU0VDUkVUIiwiQnVmZmVyIiwidG9TdHJpbmciLCJ1c2VyaW5mb0VuZHBvaW50Iiwic2VydmVyVXNlcmluZm9FbmRwb2ludCIsImdldE9wdGlvbnMiLCJnZXQiLCJTZXJ2aWNlQ29uZmlndXJhdGlvbiIsImNvbmZpZ3VyYXRpb25zIiwic2VydmljZSIsIkNvbmZpZ0Vycm9yIiwiY29udGVudCIsInBhcnRzIiwic3BsaXQiLCJoZWFkZXIiLCJKU09OIiwicGFyc2UiLCJmcm9tIiwic2lnbmF0dXJlIiwic2lnbmVkIiwiZXhwIiwibWV0aG9kcyIsImdyb3VwUm91dGluZU9uTG9naW4iLCJpbmZvIiwidXNlcklkIiwiY2hlY2siLCJPYmplY3QiLCJTdHJpbmciLCJwcm9wYWdhdGVPaWRjRGF0YSIsIlBST1BBR0FURV9PSURDX0RBVEEiLCJib2FyZFJvdXRpbmVPbkxvZ2luIiwib2lkY1VzZXJJZCIsIl9Vc2VycyRmaW5kT25lIiwiZGVmYXVsdEJvYXJkUGFyYW1zIiwiREVGQVVMVF9CT0FSRF9JRCIsImRlZmF1bHRCb2FyZElkIiwic2hpZnQiLCJib2FyZCIsIkJvYXJkcyIsIlVzZXJzIiwiX2lkIiwibWVtYmVySW5kZXgiLCJwbHVjayIsIm1lbWJlcnMiLCJpbmRleE9mIiwiYWRkTWVtYmVyIiwic2V0TWVtYmVyUGVybWlzc2lvbiIsImNvbnRhaW5zIiwicmV0cmlldmVDcmVkZW50aWFsIiwiY3JlZGVudGlhbFRva2VuIiwiY3JlZGVudGlhbFNlY3JldCIsImNyZWF0ZU9iamVjdCIsImluaXRBcnIiLCJvYmpTdHJpbmciLCJmdW5jdGlvbk5hbWUiLCJjcmVhdGlvblN0cmluZyIsInVwZGF0ZU9iamVjdCIsInVzZXJPYmpzIiwib2JqIiwiY29sbGVjdGlvbiIsImNvdW50IiwiaGFzaCIsImVudHJpZXMiLCJleHBvcnRzIiwidGVhbUFycmF5Iiwib3JnQXJyYXkiLCJ0ZWFtcyIsIm9yZ3MiLCJncm91cCIsImluaXRBdHRyaWJ1dGVzIiwiZGlzcGxheU5hbWUiLCJkZXNjIiwic2hvcnROYW1lIiwid2Vic2l0ZSIsImlzQWN0aXZlIiwiaXNPcmciLCJpc09yZ2FuaXNhdGlvbiIsImZvcmNlQ3JlYXRlIiwicHVzaCIsIm9yZyIsIk9yZyIsInVuc2hpZnQiLCJvcmdIYXNoIiwidGVhbSIsIlRlYW0iLCJ0ZWFtSGFzaCIsInVwZGF0ZSIsIiRzZXQiLCJzb21lIiwiJHB1c2giLCIkdW5zZXQiLCJ1c2VyX2VtYWlsIiwiZW1haWxzIiwiY29udGFpbmVkIiwicG9zaXRpb24iLCJtYWlsX2hhc2giLCJzcGxpY2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSx1QkFBdUIsRUFBQ0MsUUFBUSxFQUFDQyxjQUFjLEVBQUNDLGNBQWM7QUFBQ0MsTUFBTSxDQUFD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ZSI6Ii9wYWNrYWdlcy93ZWthbi1vaWRjLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHthZGRHcm91cHNXaXRoQXR0cmlidXRlcywgYWRkRW1haWwsIGNoYW5nZUZ1bGxuYW1lLCBjaGFuZ2VVc2VybmFtZX0gZnJvbSAnLi9sb2dpbkhhbmRsZXInO1xuXG5PaWRjID0ge307XG5odHRwQ2EgPSBmYWxzZTtcblxuaWYgKHByb2Nlc3MuZW52Lk9BVVRIMl9DQV9DRVJUICE9PSB1bmRlZmluZWQpIHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCBmcyA9IE5wbS5yZXF1aXJlKCdmcycpO1xuICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhwcm9jZXNzLmVudi5PQVVUSDJfQ0FfQ0VSVCkpIHtcbiAgICAgICAgICBodHRwQ2EgPSBmcy5yZWFkRmlsZVN5bmMocHJvY2Vzcy5lbnYuT0FVVEgyX0NBX0NFUlQpO1xuICAgICAgICB9XG4gICAgfSBjYXRjaChlKSB7XG5cdGNvbnNvbGUubG9nKCdXQVJOSU5HOiBmYWlsZWQgbG9hZGluZzogJyArIHByb2Nlc3MuZW52Lk9BVVRIMl9DQV9DRVJUKTtcblx0Y29uc29sZS5sb2coZSk7XG4gICAgfVxufVxudmFyIHByb2ZpbGUgPSB7fTtcbnZhciBzZXJ2aWNlRGF0YSA9IHt9O1xudmFyIHVzZXJpbmZvID0ge307XG5cbk9BdXRoLnJlZ2lzdGVyU2VydmljZSgnb2lkYycsIDIsIG51bGwsIGZ1bmN0aW9uIChxdWVyeSkge1xuICB2YXIgZGVidWcgPSBwcm9jZXNzLmVudi5ERUJVRyA9PT0gJ3RydWUnO1xuXG4gIHZhciB0b2tlbiA9IGdldFRva2VuKHF1ZXJ5KTtcbiAgaWYgKGRlYnVnKSBjb25zb2xlLmxvZygnWFhYOiByZWdpc3RlciB0b2tlbjonLCB0b2tlbik7XG5cbiAgdmFyIGFjY2Vzc1Rva2VuID0gdG9rZW4uYWNjZXNzX3Rva2VuIHx8IHRva2VuLmlkX3Rva2VuO1xuICB2YXIgZXhwaXJlc0F0ID0gKCtuZXcgRGF0ZSkgKyAoMTAwMCAqIHBhcnNlSW50KHRva2VuLmV4cGlyZXNfaW4sIDEwKSk7XG5cbiAgdmFyIGNsYWltc0luQWNjZXNzVG9rZW4gPSAocHJvY2Vzcy5lbnYuT0FVVEgyX0FERlNfRU5BQkxFRCA9PT0gJ3RydWUnICB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmVudi5PQVVUSDJfQURGU19FTkFCTEVEID09PSB0cnVlICAgIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZW52Lk9BVVRIMl9CMkNfRU5BQkxFRCAgPT09ICd0cnVlJyAgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5lbnYuT0FVVEgyX0IyQ19FTkFCTEVEICA9PT0gdHJ1ZSkgICB8fCBmYWxzZTtcblxuICBpZihjbGFpbXNJbkFjY2Vzc1Rva2VuKVxuICB7XG4gICAgLy8gaGFjayB3aGVuIHVzaW5nIGN1c3RvbSBjbGFpbXMgaW4gdGhlIGFjY2Vzc1Rva2VuLiBPbiBwcmVtaXNlIEFERlMuIEFuZCBBenVyZSBBRCBCMkMuXG4gICAgdXNlcmluZm8gPSBnZXRUb2tlbkNvbnRlbnQoYWNjZXNzVG9rZW4pO1xuICB9XG4gIGVsc2VcbiAge1xuICAgIC8vIG5vcm1hbCBiZWhhdmlvdXIsIGdldHRpbmcgdGhlIGNsYWltcyBmcm9tIFVzZXJJbmZvIGVuZHBvaW50LlxuICAgIHVzZXJpbmZvID0gZ2V0VXNlckluZm8oYWNjZXNzVG9rZW4pO1xuICB9XG5cbiAgaWYgKHVzZXJpbmZvLm9jcykgdXNlcmluZm8gPSB1c2VyaW5mby5vY3MuZGF0YTsgLy8gTmV4dGNsb3VkIGhhY2tcbiAgaWYgKHVzZXJpbmZvLm1ldGFkYXRhKSB1c2VyaW5mbyA9IHVzZXJpbmZvLm1ldGFkYXRhIC8vIE9wZW5zaGlmdCBoYWNrXG4gIGlmIChkZWJ1ZykgY29uc29sZS5sb2coJ1hYWDogdXNlcmluZm86JywgdXNlcmluZm8pO1xuXG4gIHNlcnZpY2VEYXRhLmlkID0gdXNlcmluZm9bcHJvY2Vzcy5lbnYuT0FVVEgyX0lEX01BUF07IC8vIHx8IHVzZXJpbmZvW1wiaWRcIl07XG4gIHNlcnZpY2VEYXRhLnVzZXJuYW1lID0gdXNlcmluZm9bcHJvY2Vzcy5lbnYuT0FVVEgyX1VTRVJOQU1FX01BUF07IC8vIHx8IHVzZXJpbmZvW1widWlkXCJdO1xuICBzZXJ2aWNlRGF0YS5mdWxsbmFtZSA9IHVzZXJpbmZvW3Byb2Nlc3MuZW52Lk9BVVRIMl9GVUxMTkFNRV9NQVBdOyAvLyB8fCB1c2VyaW5mb1tcImRpc3BsYXlOYW1lXCJdO1xuICBzZXJ2aWNlRGF0YS5hY2Nlc3NUb2tlbiA9IGFjY2Vzc1Rva2VuO1xuICBzZXJ2aWNlRGF0YS5leHBpcmVzQXQgPSBleHBpcmVzQXQ7XG5cblxuICAvLyBJZiBvbiBPcmFjbGUgT0lNIGVtYWlsIGlzIGVtcHR5IG9yIG51bGwsIGdldCBpbmZvIGZyb20gdXNlcm5hbWVcbiAgaWYgKHByb2Nlc3MuZW52Lk9SQUNMRV9PSU1fRU5BQkxFRCA9PT0gJ3RydWUnIHx8IHByb2Nlc3MuZW52Lk9SQUNMRV9PSU1fRU5BQkxFRCA9PT0gdHJ1ZSkge1xuICAgIGlmICh1c2VyaW5mb1twcm9jZXNzLmVudi5PQVVUSDJfRU1BSUxfTUFQXSkge1xuICAgICAgc2VydmljZURhdGEuZW1haWwgPSB1c2VyaW5mb1twcm9jZXNzLmVudi5PQVVUSDJfRU1BSUxfTUFQXTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2VydmljZURhdGEuZW1haWwgPSB1c2VyaW5mb1twcm9jZXNzLmVudi5PQVVUSDJfVVNFUk5BTUVfTUFQXTtcbiAgICB9XG4gIH1cblxuICBpZiAocHJvY2Vzcy5lbnYuT1JBQ0xFX09JTV9FTkFCTEVEICE9PSAndHJ1ZScgJiYgcHJvY2Vzcy5lbnYuT1JBQ0xFX09JTV9FTkFCTEVEICE9PSB0cnVlKSB7XG4gICAgc2VydmljZURhdGEuZW1haWwgPSB1c2VyaW5mb1twcm9jZXNzLmVudi5PQVVUSDJfRU1BSUxfTUFQXTsgLy8gfHwgdXNlcmluZm9bXCJlbWFpbFwiXTtcbiAgfVxuXG4gIGlmIChwcm9jZXNzLmVudi5PQVVUSDJfQjJDX0VOQUJMRUQgID09PSAndHJ1ZScgIHx8IHByb2Nlc3MuZW52Lk9BVVRIMl9CMkNfRU5BQkxFRCAgPT09IHRydWUpIHtcbiAgICBzZXJ2aWNlRGF0YS5lbWFpbCA9IHVzZXJpbmZvW1wiZW1haWxzXCJdWzBdO1xuICB9XG5cbiAgaWYgKGFjY2Vzc1Rva2VuKSB7XG4gICAgdmFyIHRva2VuQ29udGVudCA9IGdldFRva2VuQ29udGVudChhY2Nlc3NUb2tlbik7XG4gICAgdmFyIGZpZWxkcyA9IF8ucGljayh0b2tlbkNvbnRlbnQsIGdldENvbmZpZ3VyYXRpb24oKS5pZFRva2VuV2hpdGVsaXN0RmllbGRzKTtcbiAgICBfLmV4dGVuZChzZXJ2aWNlRGF0YSwgZmllbGRzKTtcbiAgfVxuXG4gIGlmICh0b2tlbi5yZWZyZXNoX3Rva2VuKVxuICAgIHNlcnZpY2VEYXRhLnJlZnJlc2hUb2tlbiA9IHRva2VuLnJlZnJlc2hfdG9rZW47XG4gIGlmIChkZWJ1ZykgY29uc29sZS5sb2coJ1hYWDogc2VydmljZURhdGE6Jywgc2VydmljZURhdGEpO1xuXG4gIHByb2ZpbGUubmFtZSA9IHVzZXJpbmZvW3Byb2Nlc3MuZW52Lk9BVVRIMl9GVUxMTkFNRV9NQVBdOyAvLyB8fCB1c2VyaW5mb1tcImRpc3BsYXlOYW1lXCJdO1xuICBwcm9maWxlLmVtYWlsID0gdXNlcmluZm9bcHJvY2Vzcy5lbnYuT0FVVEgyX0VNQUlMX01BUF07IC8vIHx8IHVzZXJpbmZvW1wiZW1haWxcIl07XG5cbiAgaWYgKHByb2Nlc3MuZW52Lk9BVVRIMl9CMkNfRU5BQkxFRCAgPT09ICd0cnVlJyAgfHwgcHJvY2Vzcy5lbnYuT0FVVEgyX0IyQ19FTkFCTEVEICA9PT0gdHJ1ZSkge1xuICAgIHByb2ZpbGUuZW1haWwgPSB1c2VyaW5mb1tcImVtYWlsc1wiXVswXTtcbiAgfVxuXG4gIGlmIChkZWJ1ZykgY29uc29sZS5sb2coJ1hYWDogcHJvZmlsZTonLCBwcm9maWxlKTtcblxuXG4gIC8vdGVtcG9yYXJpbHkgc3RvcmUgZGF0YSBmcm9tIG9pZGMgaW4gdXNlci5zZXJ2aWNlcy5vaWRjLmdyb3VwcyB0byB1cGRhdGUgZ3JvdXBzXG4gIHNlcnZpY2VEYXRhLmdyb3VwcyA9ICh1c2VyaW5mb1tcImdyb3Vwc1wiXSAmJiB1c2VyaW5mb1tcIndla2FuR3JvdXBzXCJdKSA/IHVzZXJpbmZvW1wid2VrYW5Hcm91cHNcIl0gOiB1c2VyaW5mb1tcImdyb3Vwc1wiXTtcbiAgLy8gZ3JvdXBzIGFycml2aW5nIGFzIGFycmF5IG9mIHN0cmluZ3MgaW5kaWNhdGUgdGhlcmUgaXMgbm8gc2NvcGUgc2V0IGluIG9pZGMgcHJpdmlkZXJcbiAgLy8gdG8gYXNzaWduIHRlYW1zIGFuZCBrZWVwIGFkbWluIHByaXZpbGVnZXNcbiAgLy8gZGF0YSBuZWVkcyB0byBiZSB0cmVhdGVkICBkaWZmZXJlbnRseS5cbiAgLy8gdXNlIGNhc2U6IGluIG9pZGMgcHJvdmlkZXIgbm8gc2NvcGUgaXMgc2V0LCBoZW5jZSBubyBncm91cCBhdHRyaWJ1dGVzLlxuICAvLyAgICB0aGVyZWZvcmU6IGtlZXAgYWRtaW4gcHJpdmlsZWdlcyBmb3Igd2VrYW4gYXMgYmVmb3JlXG4gIGlmKEFycmF5LmlzQXJyYXkoc2VydmljZURhdGEuZ3JvdXBzKSAmJiBzZXJ2aWNlRGF0YS5ncm91cHMubGVuZ3RoICYmIHR5cGVvZiBzZXJ2aWNlRGF0YS5ncm91cHNbMF0gPT09IFwic3RyaW5nXCIgKVxuICB7XG4gICAgdXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKHsnX2lkJzogIHNlcnZpY2VEYXRhLmlkfSk7XG5cbiAgICBzZXJ2aWNlRGF0YS5ncm91cHMuZm9yRWFjaChmdW5jdGlvbihncm91cE5hbWUsIGkpXG4gICAge1xuICAgICAgaWYodXNlcj8uaXNBZG1pbiAmJiBpID09IDApXG4gICAgICB7XG4gICAgICAgIC8vIGtlZXAgaW5mb3JtYXRpb24gb2YgdXNlci5pc0FkbWluIHNpbmNlIGluIGxvZ2luSGFuZGxlciB0aGUgdXNlciB3aWxsIC8vIGJlIHVwZGF0ZWQgcmVnYXJkaW5nIGdyb3VwIGFkbWluIHByaXZpbGVnZXMgcHJvdmlkZWQgdmlhIG9pZGNcbiAgICAgICAgc2VydmljZURhdGEuZ3JvdXBzW2ldID0ge1wiaXNBZG1pblwiOiB0cnVlfTtcbiAgICAgICAgc2VydmljZURhdGEuZ3JvdXBzW2ldW1wiZGlzcGxheU5hbWVcIl09IGdyb3VwTmFtZTtcbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgIHtcbiAgICAgICAgc2VydmljZURhdGEuZ3JvdXBzW2ldID0ge1wiZGlzcGxheU5hbWVcIjogZ3JvdXBOYW1lfTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8vIEZpeCBPSURDIGxvZ2luIGxvb3AgZm9yIGludGVnZXIgdXNlciBJRC4gVGhhbmtzIHRvIGRhbmllbGthaXNlci5cbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3dla2FuL3dla2FuL2lzc3Vlcy80Nzk1XG4gIE1ldGVvci5jYWxsKCdncm91cFJvdXRpbmVPbkxvZ2luJyxzZXJ2aWNlRGF0YSwgXCJcIitzZXJ2aWNlRGF0YS5pZCk7XG4gIE1ldGVvci5jYWxsKCdib2FyZFJvdXRpbmVPbkxvZ2luJyxzZXJ2aWNlRGF0YSwgXCJcIitzZXJ2aWNlRGF0YS5pZCk7XG5cbiAgcmV0dXJuIHtcbiAgICBzZXJ2aWNlRGF0YTogc2VydmljZURhdGEsXG4gICAgb3B0aW9uczogeyBwcm9maWxlOiBwcm9maWxlIH1cbiAgfTtcbn0pO1xuXG52YXIgdXNlckFnZW50ID0gXCJNZXRlb3JcIjtcbmlmIChNZXRlb3IucmVsZWFzZSkge1xuICB1c2VyQWdlbnQgKz0gXCIvXCIgKyBNZXRlb3IucmVsZWFzZTtcbn1cblxuaWYgKHByb2Nlc3MuZW52Lk9SQUNMRV9PSU1fRU5BQkxFRCAhPT0gJ3RydWUnICYmIHByb2Nlc3MuZW52Lk9SQUNMRV9PSU1fRU5BQkxFRCAhPT0gdHJ1ZSkge1xuICB2YXIgZ2V0VG9rZW4gPSBmdW5jdGlvbiAocXVlcnkpIHtcbiAgICB2YXIgZGVidWcgPSBwcm9jZXNzLmVudi5ERUJVRyA9PT0gJ3RydWUnO1xuICAgIHZhciBjb25maWcgPSBnZXRDb25maWd1cmF0aW9uKCk7XG4gICAgaWYoY29uZmlnLnRva2VuRW5kcG9pbnQuaW5jbHVkZXMoJ2h0dHBzOi8vJykpe1xuICAgICAgdmFyIHNlcnZlclRva2VuRW5kcG9pbnQgPSBjb25maWcudG9rZW5FbmRwb2ludDtcbiAgICB9ZWxzZXtcbiAgICAgIHZhciBzZXJ2ZXJUb2tlbkVuZHBvaW50ID0gY29uZmlnLnNlcnZlclVybCArIGNvbmZpZy50b2tlbkVuZHBvaW50O1xuICAgIH1cbiAgICB2YXIgcmVxdWVzdFBlcm1pc3Npb25zID0gY29uZmlnLnJlcXVlc3RQZXJtaXNzaW9ucztcbiAgICB2YXIgcmVzcG9uc2U7XG5cbiAgICB0cnkge1xuICAgICAgdmFyIHBvc3RPcHRpb25zID0ge1xuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgIEFjY2VwdDogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgXCJVc2VyLUFnZW50XCI6IHVzZXJBZ2VudFxuICAgICAgICAgIH0sXG4gICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICBjb2RlOiBxdWVyeS5jb2RlLFxuICAgICAgICAgICAgY2xpZW50X2lkOiBjb25maWcuY2xpZW50SWQsXG4gICAgICAgICAgICBjbGllbnRfc2VjcmV0OiBPQXV0aC5vcGVuU2VjcmV0KGNvbmZpZy5zZWNyZXQpLFxuICAgICAgICAgICAgcmVkaXJlY3RfdXJpOiBPQXV0aC5fcmVkaXJlY3RVcmkoJ29pZGMnLCBjb25maWcpLFxuICAgICAgICAgICAgZ3JhbnRfdHlwZTogJ2F1dGhvcml6YXRpb25fY29kZScsXG4gICAgICAgICAgICBzdGF0ZTogcXVlcnkuc3RhdGVcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICBpZiAoaHR0cENhKSB7XG5cdHBvc3RPcHRpb25zWyducG1SZXF1ZXN0T3B0aW9ucyddID0geyBjYTogaHR0cENhIH07XG4gICAgICB9XG4gICAgICByZXNwb25zZSA9IEhUVFAucG9zdChzZXJ2ZXJUb2tlbkVuZHBvaW50LCBwb3N0T3B0aW9ucyk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICB0aHJvdyBfLmV4dGVuZChuZXcgRXJyb3IoXCJGYWlsZWQgdG8gZ2V0IHRva2VuIGZyb20gT0lEQyBcIiArIHNlcnZlclRva2VuRW5kcG9pbnQgKyBcIjogXCIgKyBlcnIubWVzc2FnZSksXG4gICAgICAgIHsgcmVzcG9uc2U6IGVyci5yZXNwb25zZSB9KTtcbiAgICB9XG4gICAgaWYgKHJlc3BvbnNlLmRhdGEuZXJyb3IpIHtcbiAgICAgIC8vIGlmIHRoZSBodHRwIHJlc3BvbnNlIHdhcyBhIGpzb24gb2JqZWN0IHdpdGggYW4gZXJyb3IgYXR0cmlidXRlXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJGYWlsZWQgdG8gY29tcGxldGUgaGFuZHNoYWtlIHdpdGggT0lEQyBcIiArIHNlcnZlclRva2VuRW5kcG9pbnQgKyBcIjogXCIgKyByZXNwb25zZS5kYXRhLmVycm9yKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGRlYnVnKSBjb25zb2xlLmxvZygnWFhYOiBnZXRUb2tlbiByZXNwb25zZTogJywgcmVzcG9uc2UuZGF0YSk7XG4gICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICB9XG4gIH07XG59XG5cbmlmIChwcm9jZXNzLmVudi5PUkFDTEVfT0lNX0VOQUJMRUQgPT09ICd0cnVlJyB8fCBwcm9jZXNzLmVudi5PUkFDTEVfT0lNX0VOQUJMRUQgPT09IHRydWUpIHtcblxuICB2YXIgZ2V0VG9rZW4gPSBmdW5jdGlvbiAocXVlcnkpIHtcbiAgICB2YXIgZGVidWcgPSBwcm9jZXNzLmVudi5ERUJVRyA9PT0gJ3RydWUnO1xuICAgIHZhciBjb25maWcgPSBnZXRDb25maWd1cmF0aW9uKCk7XG4gICAgaWYoY29uZmlnLnRva2VuRW5kcG9pbnQuaW5jbHVkZXMoJ2h0dHBzOi8vJykpe1xuICAgICAgdmFyIHNlcnZlclRva2VuRW5kcG9pbnQgPSBjb25maWcudG9rZW5FbmRwb2ludDtcbiAgICB9ZWxzZXtcbiAgICAgIHZhciBzZXJ2ZXJUb2tlbkVuZHBvaW50ID0gY29uZmlnLnNlcnZlclVybCArIGNvbmZpZy50b2tlbkVuZHBvaW50O1xuICAgIH1cbiAgICB2YXIgcmVxdWVzdFBlcm1pc3Npb25zID0gY29uZmlnLnJlcXVlc3RQZXJtaXNzaW9ucztcbiAgICB2YXIgcmVzcG9uc2U7XG5cbiAgICAvLyBPSU0gbmVlZHMgYmFzaWMgQXV0aGVudGljYXRpb24gdG9rZW4gaW4gdGhlIGhlYWRlciAtIENsaWVudElEICsgU0VDUkVUIGluIGJhc2U2NFxuICAgIHZhciBkYXRhVG9rZW49bnVsbDtcbiAgICB2YXIgc3RyQmFzaWNUb2tlbj1udWxsO1xuICAgIHZhciBzdHJCYXNpY1Rva2VuNjQ9bnVsbDtcblxuICAgIGRhdGFUb2tlbiA9IHByb2Nlc3MuZW52Lk9BVVRIMl9DTElFTlRfSUQgKyAnOicgKyBwcm9jZXNzLmVudi5PQVVUSDJfU0VDUkVUO1xuICAgIHN0ckJhc2ljVG9rZW4gPSBuZXcgQnVmZmVyKGRhdGFUb2tlbik7XG4gICAgc3RyQmFzaWNUb2tlbjY0ID0gc3RyQmFzaWNUb2tlbi50b1N0cmluZygnYmFzZTY0Jyk7XG5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgIGlmIChkZWJ1ZykgY29uc29sZS5sb2coJ0Jhc2ljIFRva2VuOiAnLCBzdHJCYXNpY1Rva2VuNjQpO1xuXG4gICAgdHJ5IHtcbiAgICAgIHZhciBwb3N0T3B0aW9ucyA9IHtcbiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICBBY2NlcHQ6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgIFwiVXNlci1BZ2VudFwiOiB1c2VyQWdlbnQsXG4gICAgICAgICAgICBcIkF1dGhvcml6YXRpb25cIjogXCJCYXNpYyBcIiArIHN0ckJhc2ljVG9rZW42NFxuICAgICAgICAgIH0sXG4gICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICBjb2RlOiBxdWVyeS5jb2RlLFxuICAgICAgICAgICAgY2xpZW50X2lkOiBjb25maWcuY2xpZW50SWQsXG4gICAgICAgICAgICBjbGllbnRfc2VjcmV0OiBPQXV0aC5vcGVuU2VjcmV0KGNvbmZpZy5zZWNyZXQpLFxuICAgICAgICAgICAgcmVkaXJlY3RfdXJpOiBPQXV0aC5fcmVkaXJlY3RVcmkoJ29pZGMnLCBjb25maWcpLFxuICAgICAgICAgICAgZ3JhbnRfdHlwZTogJ2F1dGhvcml6YXRpb25fY29kZScsXG4gICAgICAgICAgICBzdGF0ZTogcXVlcnkuc3RhdGVcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICBpZiAoaHR0cENhKSB7XG5cdHBvc3RPcHRpb25zWyducG1SZXF1ZXN0T3B0aW9ucyddID0geyBjYTogaHR0cENhIH07XG4gICAgICB9XG4gICAgICByZXNwb25zZSA9IEhUVFAucG9zdChzZXJ2ZXJUb2tlbkVuZHBvaW50LCBwb3N0T3B0aW9ucyk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICB0aHJvdyBfLmV4dGVuZChuZXcgRXJyb3IoXCJGYWlsZWQgdG8gZ2V0IHRva2VuIGZyb20gT0lEQyBcIiArIHNlcnZlclRva2VuRW5kcG9pbnQgKyBcIjogXCIgKyBlcnIubWVzc2FnZSksXG4gICAgICAgIHsgcmVzcG9uc2U6IGVyci5yZXNwb25zZSB9KTtcbiAgICB9XG4gICAgaWYgKHJlc3BvbnNlLmRhdGEuZXJyb3IpIHtcbiAgICAgIC8vIGlmIHRoZSBodHRwIHJlc3BvbnNlIHdhcyBhIGpzb24gb2JqZWN0IHdpdGggYW4gZXJyb3IgYXR0cmlidXRlXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJGYWlsZWQgdG8gY29tcGxldGUgaGFuZHNoYWtlIHdpdGggT0lEQyBcIiArIHNlcnZlclRva2VuRW5kcG9pbnQgKyBcIjogXCIgKyByZXNwb25zZS5kYXRhLmVycm9yKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICAgIGlmIChkZWJ1ZykgY29uc29sZS5sb2coJ1hYWDogZ2V0VG9rZW4gcmVzcG9uc2U6ICcsIHJlc3BvbnNlLmRhdGEpO1xuICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgfVxuICB9O1xufVxuXG5cbnZhciBnZXRVc2VySW5mbyA9IGZ1bmN0aW9uIChhY2Nlc3NUb2tlbikge1xuICB2YXIgZGVidWcgPSBwcm9jZXNzLmVudi5ERUJVRyA9PT0gJ3RydWUnO1xuICB2YXIgY29uZmlnID0gZ2V0Q29uZmlndXJhdGlvbigpO1xuICAvLyBTb21lIHVzZXJpbmZvIGVuZHBvaW50cyB1c2UgYSBkaWZmZXJlbnQgYmFzZSBVUkwgdGhhbiB0aGUgYXV0aG9yaXphdGlvbiBvciB0b2tlbiBlbmRwb2ludHMuXG4gIC8vIFRoaXMgbG9naWMgYWxsb3dzIHRoZSBlbmQgdXNlciB0byBvdmVycmlkZSB0aGUgc2V0dGluZyBieSBwcm92aWRpbmcgdGhlIGZ1bGwgVVJMIHRvIHVzZXJpbmZvIGluIHRoZWlyIGNvbmZpZy5cbiAgaWYgKGNvbmZpZy51c2VyaW5mb0VuZHBvaW50LmluY2x1ZGVzKFwiaHR0cHM6Ly9cIikpIHtcbiAgICB2YXIgc2VydmVyVXNlcmluZm9FbmRwb2ludCA9IGNvbmZpZy51c2VyaW5mb0VuZHBvaW50O1xuICB9IGVsc2Uge1xuICAgIHZhciBzZXJ2ZXJVc2VyaW5mb0VuZHBvaW50ID0gY29uZmlnLnNlcnZlclVybCArIGNvbmZpZy51c2VyaW5mb0VuZHBvaW50O1xuICB9XG4gIHZhciByZXNwb25zZTtcbiAgdHJ5IHtcbiAgICB2YXIgZ2V0T3B0aW9ucyA9IHtcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgIFwiVXNlci1BZ2VudFwiOiB1c2VyQWdlbnQsXG4gICAgICAgICAgXCJBdXRob3JpemF0aW9uXCI6IFwiQmVhcmVyIFwiICsgYWNjZXNzVG9rZW5cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICBpZiAoaHR0cENhKSB7XG4gICAgICBnZXRPcHRpb25zWyducG1SZXF1ZXN0T3B0aW9ucyddID0geyBjYTogaHR0cENhIH07XG4gICAgfVxuICAgIHJlc3BvbnNlID0gSFRUUC5nZXQoc2VydmVyVXNlcmluZm9FbmRwb2ludCwgZ2V0T3B0aW9ucyk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRocm93IF8uZXh0ZW5kKG5ldyBFcnJvcihcIkZhaWxlZCB0byBmZXRjaCB1c2VyaW5mbyBmcm9tIE9JREMgXCIgKyBzZXJ2ZXJVc2VyaW5mb0VuZHBvaW50ICsgXCI6IFwiICsgZXJyLm1lc3NhZ2UpLFxuICAgICAgICAgICAgICAgICAgIHtyZXNwb25zZTogZXJyLnJlc3BvbnNlfSk7XG4gIH1cbiAgaWYgKGRlYnVnKSBjb25zb2xlLmxvZygnWFhYOiBnZXRVc2VySW5mbyByZXNwb25zZTogJywgcmVzcG9uc2UuZGF0YSk7XG4gIHJldHVybiByZXNwb25zZS5kYXRhO1xufTtcblxudmFyIGdldENvbmZpZ3VyYXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBjb25maWcgPSBTZXJ2aWNlQ29uZmlndXJhdGlvbi5jb25maWd1cmF0aW9ucy5maW5kT25lKHsgc2VydmljZTogJ29pZGMnIH0pO1xuICBpZiAoIWNvbmZpZykge1xuICAgIHRocm93IG5ldyBTZXJ2aWNlQ29uZmlndXJhdGlvbi5Db25maWdFcnJvcignU2VydmljZSBvaWRjIG5vdCBjb25maWd1cmVkLicpO1xuICB9XG4gIHJldHVybiBjb25maWc7XG59O1xuXG52YXIgZ2V0VG9rZW5Db250ZW50ID0gZnVuY3Rpb24gKHRva2VuKSB7XG4gIHZhciBjb250ZW50ID0gbnVsbDtcbiAgaWYgKHRva2VuKSB7XG4gICAgdHJ5IHtcbiAgICAgIHZhciBwYXJ0cyA9IHRva2VuLnNwbGl0KCcuJyk7XG4gICAgICB2YXIgaGVhZGVyID0gSlNPTi5wYXJzZShCdWZmZXIuZnJvbShwYXJ0c1swXSwgJ2Jhc2U2NCcpLnRvU3RyaW5nKCkpO1xuICAgICAgY29udGVudCA9IEpTT04ucGFyc2UoQnVmZmVyLmZyb20ocGFydHNbMV0sICdiYXNlNjQnKS50b1N0cmluZygpKTtcbiAgICAgIHZhciBzaWduYXR1cmUgPSBCdWZmZXIuZnJvbShwYXJ0c1syXSwgJ2Jhc2U2NCcpO1xuICAgICAgdmFyIHNpZ25lZCA9IHBhcnRzWzBdICsgJy4nICsgcGFydHNbMV07XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICB0aGlzLmNvbnRlbnQgPSB7XG4gICAgICAgIGV4cDogMFxuICAgICAgfTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNvbnRlbnQ7XG59XG5NZXRlb3IubWV0aG9kcyh7XG4gICdncm91cFJvdXRpbmVPbkxvZ2luJzogZnVuY3Rpb24oaW5mbywgdXNlcklkKVxuICB7XG4gICAgY2hlY2soaW5mbywgT2JqZWN0KTtcbiAgICBjaGVjayh1c2VySWQsIFN0cmluZyk7XG4gICAgdmFyIHByb3BhZ2F0ZU9pZGNEYXRhID0gcHJvY2Vzcy5lbnYuUFJPUEFHQVRFX09JRENfREFUQSB8fCBmYWxzZTtcbiAgICBpZiAocHJvcGFnYXRlT2lkY0RhdGEpIHtcbiAgICAgIHVzZXJzPSBNZXRlb3IudXNlcnM7XG4gICAgICB1c2VyID0gdXNlcnMuZmluZE9uZSh7J3NlcnZpY2VzLm9pZGMuaWQnOiAgdXNlcklkfSk7XG5cbiAgICAgIGlmKHVzZXIpIHtcbiAgICAgICAgLy91cGRhdGVzL2NyZWF0ZXMgR3JvdXBzIGFuZCB1c2VyIGFkbWluIHByaXZpbGVnZXMgYWNjb3JkaW5nbHkgaWYgbm90IHVuZGVmaW5lZFxuICAgICAgICBpZiAoaW5mby5ncm91cHMpIHtcbiAgICAgICAgICBhZGRHcm91cHNXaXRoQXR0cmlidXRlcyh1c2VyLCBpbmZvLmdyb3Vwcyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZihpbmZvLmVtYWlsKSBhZGRFbWFpbCh1c2VyLCBpbmZvLmVtYWlsKTtcbiAgICAgICAgaWYoaW5mby5mdWxsbmFtZSkgY2hhbmdlRnVsbG5hbWUodXNlciwgaW5mby5mdWxsbmFtZSk7XG4gICAgICAgIGlmKGluZm8udXNlcm5hbWUpIGNoYW5nZVVzZXJuYW1lKHVzZXIsIGluZm8udXNlcm5hbWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufSk7XG5cbk1ldGVvci5tZXRob2RzKHtcbiAgJ2JvYXJkUm91dGluZU9uTG9naW4nOiBmdW5jdGlvbihpbmZvLCBvaWRjVXNlcklkKVxuICB7XG4gICAgY2hlY2soaW5mbywgT2JqZWN0KTtcbiAgICBjaGVjayhvaWRjVXNlcklkLCBTdHJpbmcpO1xuXG4gICAgY29uc3QgZGVmYXVsdEJvYXJkUGFyYW1zID0gKHByb2Nlc3MuZW52LkRFRkFVTFRfQk9BUkRfSUQgfHwgJycpLnNwbGl0KCc6Jyk7XG4gICAgY29uc3QgZGVmYXVsdEJvYXJkSWQgPSBkZWZhdWx0Qm9hcmRQYXJhbXMuc2hpZnQoKVxuICAgIGlmICghZGVmYXVsdEJvYXJkSWQpIHJldHVyblxuXG4gICAgY29uc3QgYm9hcmQgPSBCb2FyZHMuZmluZE9uZShkZWZhdWx0Qm9hcmRJZClcbiAgICBjb25zdCB1c2VySWQgPSBVc2Vycy5maW5kT25lKHsgJ3NlcnZpY2VzLm9pZGMuaWQnOiBvaWRjVXNlcklkIH0pPy5faWRcbiAgICBjb25zdCBtZW1iZXJJbmRleCA9IF8ucGx1Y2soYm9hcmQ/Lm1lbWJlcnMsICd1c2VySWQnKS5pbmRleE9mKHVzZXJJZCk7XG4gICAgaWYoIWJvYXJkIHx8ICF1c2VySWQgfHwgbWVtYmVySW5kZXggPiAtMSkgcmV0dXJuXG5cbiAgICBib2FyZC5hZGRNZW1iZXIodXNlcklkKVxuICAgIGJvYXJkLnNldE1lbWJlclBlcm1pc3Npb24oXG4gICAgICB1c2VySWQsXG4gICAgICBkZWZhdWx0Qm9hcmRQYXJhbXMuY29udGFpbnMoXCJpc0FkbWluXCIpLFxuICAgICAgZGVmYXVsdEJvYXJkUGFyYW1zLmNvbnRhaW5zKFwiaXNOb0NvbW1lbnRzXCIpLFxuICAgICAgZGVmYXVsdEJvYXJkUGFyYW1zLmNvbnRhaW5zKFwiaXNDb21tZW50c09ubHlcIiksXG4gICAgICBkZWZhdWx0Qm9hcmRQYXJhbXMuY29udGFpbnMoXCJpc1dvcmtlclwiKVxuICAgIClcbiAgfVxufSk7XG5cbk9pZGMucmV0cmlldmVDcmVkZW50aWFsID0gZnVuY3Rpb24gKGNyZWRlbnRpYWxUb2tlbiwgY3JlZGVudGlhbFNlY3JldCkge1xuICByZXR1cm4gT0F1dGgucmV0cmlldmVDcmVkZW50aWFsKGNyZWRlbnRpYWxUb2tlbiwgY3JlZGVudGlhbFNlY3JldCk7XG59O1xuIiwiLy8gY3JlYXRlcyBPYmplY3QgaWYgbm90IHByZXNlbnQgaW4gY29sbGVjdGlvblxuLy8gaW5pdEFyciA9IFtkaXNwbGF5TmFtZSwgc2hvcnROYW1lLCB3ZWJzaXRlLCBpc0FjdGl2ZV1cbi8vIG9ialN0cmluZyA9IFtcIk9yZ1wiLFwiVGVhbVwiXSBmb3IgbWV0aG9kIG1hcHBpbmdcbmZ1bmN0aW9uIGNyZWF0ZU9iamVjdChpbml0QXJyLCBvYmpTdHJpbmcpXG57XG4gIGZ1bmN0aW9uTmFtZSA9IG9ialN0cmluZyA9PT0gXCJPcmdcIiA/ICdzZXRDcmVhdGVPcmdGcm9tT2lkYycgOiAnc2V0Q3JlYXRlVGVhbUZyb21PaWRjJztcbiAgY3JlYXRpb25TdHJpbmcgPSAnc2V0Q3JlYXRlJysgb2JqU3RyaW5nICsgJ0Zyb21PaWRjJztcbiAgcmV0dXJuIE1ldGVvci5jYWxsKGZ1bmN0aW9uTmFtZSxcbiAgICBpbml0QXJyWzBdLC8vZGlzcGxheU5hbWVcbiAgICBpbml0QXJyWzFdLC8vZGVzY1xuICAgIGluaXRBcnJbMl0sLy9zaG9ydE5hbWVcbiAgICBpbml0QXJyWzNdLC8vd2Vic2l0ZVxuICAgIGluaXRBcnJbNF0vL3h4eGlzQWN0aXZlXG4gICAgKTtcbn1cbmZ1bmN0aW9uIHVwZGF0ZU9iamVjdChpbml0QXJyLCBvYmpTdHJpbmcpXG57XG4gIGZ1bmN0aW9uTmFtZSA9IG9ialN0cmluZyA9PT0gXCJPcmdcIiA/ICdzZXRPcmdBbGxGaWVsZHNGcm9tT2lkYycgOiAnc2V0VGVhbUFsbEZpZWxkc0Zyb21PaWRjJztcbiAgcmV0dXJuIE1ldGVvci5jYWxsKGZ1bmN0aW9uTmFtZSxcbiAgICBpbml0QXJyWzBdLC8vdGVhbSB8fCBvcmcgT2JqZWN0XG4gICAgaW5pdEFyclsxXSwvL2Rpc3BsYXlOYW1lXG4gICAgaW5pdEFyclsyXSwvL2Rlc2NcbiAgICBpbml0QXJyWzNdLC8vc2hvcnROYW1lXG4gICAgaW5pdEFycls0XSwvL3dlYnNpdGVcbiAgICBpbml0QXJyWzVdLy94eHhpc0FjdGl2ZVxuICAgICk7XG59XG4vL2NoZWNrcyB3aGV0aGVyIG9iaiBpcyBpbiBjb2xsZWN0aW9uIG9mIHVzZXJPYmpzXG4vL3BhcmFtc1xuLy9lLmcuIHVzZXJPYmpzID0gdXNlci50ZWFtc1xuLy9lLmcuIG9iaiA9IFRlYW0uZmluZE9uZS4uLlxuLy9lLmcuIGNvbGxlY3Rpb24gPSBcInRlYW1cIlxuZnVuY3Rpb24gY29udGFpbnModXNlck9ianMsIG9iaiwgY29sbGVjdGlvbilcbntcbiAgaWQgPSBjb2xsZWN0aW9uKydJZCc7XG5cbiAgaWYodHlwZW9mIHVzZXJPYmpzID09IFwidW5kZWZpbmVkXCIgfHwgIXVzZXJPYmpzLmxlbmd0aClcbiAge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBmb3IgKGNvbnN0IFtjb3VudCwgaGFzaF0gb2YgT2JqZWN0LmVudHJpZXModXNlck9ianMpKVxuICB7XG4gICAgaWYgKGhhc2hbaWRdID09PSBvYmouX2lkKVxuICAgIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuLy8gVGhpcyBmdW5jdGlvbiBhZGRzIGdyb3VwcyBhcyBvcmdhbml6YXRpb25zIG9yIHRlYW1zIHRvIHVzZXJzIGFuZFxuLy8gY3JlYXRlcyB0aGVtIGlmIG5vdCBhbHJlYWR5IGV4aXN0aW5nXG4vLyBERUZBVUxUIGFmdGVyIGNyZWF0aW9uIG9yZ0lzQWN0aXZlICYgdGVhbUlzQWN0aXZlOiB0cnVlXG4vLyBQT0RDIHByb3ZpZGVyIG5lZWRzIHRvIHNlbmQgZ3JvdXAgZGF0YSB3aXRoaW4gXCJ3ZWthbkdyb3VwXCIgc2NvcGVcbi8vIFBBUkFNUyB0byBiZSBzZXQgZm9yIGdyb3VwcyB3aXRoaW4geW91ciBPaWRjIHByb3ZpZGVyOlxuLy8gIGlzQWRtaW46IFt0cnVlLCBmYWxzZV0gLT4gYWRtaW4gZ3JvdXAgYmVjb21lcyBhZG1pbiBpbiB3ZWthblxuLy8gIGlzT3JnYW5pemF0aW9uOiBbdHJ1ZSwgZmFsc2VdIC0+IGNyZWF0ZXMgb3JnIGFuZCBhZGRzIHRvIHVzZXJcbi8vICBkaXNwbGF5TmFtZTogXCJzdHJpbmdcIlxuYWRkR3JvdXBzV2l0aEF0dHJpYnV0ZXM6IGZ1bmN0aW9uICh1c2VyLCBncm91cHMpe1xuICB0ZWFtQXJyYXk9W107XG4gIG9yZ0FycmF5PVtdO1xuICBpc0FkbWluID0gW107XG4gIHRlYW1zID0gdXNlci50ZWFtcztcbiAgb3JncyA9IHVzZXIub3JncztcbiAgZm9yIChncm91cCBvZiBncm91cHMpXG4gIHtcbiAgICBpbml0QXR0cmlidXRlcyA9IFtcbiAgICAgIGdyb3VwLmRpc3BsYXlOYW1lLFxuICAgICAgZ3JvdXAuZGVzYyB8fCBncm91cC5kaXNwbGF5TmFtZSxcbiAgICAgIGdyb3VwLnNob3J0TmFtZSB8fGdyb3VwLmRpc3BsYXlOYW1lLFxuICAgICAgZ3JvdXAud2Vic2l0ZSB8fCBncm91cC5kaXNwbGF5TmFtZSwgZ3JvdXAuaXNBY3RpdmUgfHwgZmFsc2VdO1xuXG4gICAgaXNPcmcgPSBncm91cC5pc09yZ2FuaXNhdGlvbiB8fCBmYWxzZTtcbiAgICBmb3JjZUNyZWF0ZSA9IGdyb3VwLmZvcmNlQ3JlYXRlfHwgZmFsc2U7XG4gICAgaXNBZG1pbi5wdXNoKGdyb3VwLmlzQWRtaW4gfHwgZmFsc2UpO1xuICAgIGlmIChpc09yZylcbiAgICB7XG4gICAgICBvcmcgPSBPcmcuZmluZE9uZSh7XCJvcmdEaXNwbGF5TmFtZVwiOiBncm91cC5kaXNwbGF5TmFtZX0pO1xuICAgICAgaWYob3JnKVxuICAgICAge1xuICAgICAgICBpZihjb250YWlucyhvcmdzLCBvcmcsIFwib3JnXCIpKVxuICAgICAgICB7XG4gICAgICAgICAgaW5pdEF0dHJpYnV0ZXMudW5zaGlmdChvcmcpO1xuICAgICAgICAgIHVwZGF0ZU9iamVjdChpbml0QXR0cmlidXRlcywgXCJPcmdcIik7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYoZm9yY2VDcmVhdGUpXG4gICAgICB7XG4gICAgICAgIGNyZWF0ZU9iamVjdChpbml0QXR0cmlidXRlcywgXCJPcmdcIik7XG4gICAgICAgIG9yZyA9IE9yZy5maW5kT25lKHsnb3JnRGlzcGxheU5hbWUnOiBncm91cC5kaXNwbGF5TmFtZX0pO1xuICAgICAgfVxuICAgICAgZWxzZVxuICAgICAge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIG9yZ0hhc2ggPSB7J29yZ0lkJzogb3JnLl9pZCwgJ29yZ0Rpc3BsYXlOYW1lJzogZ3JvdXAuZGlzcGxheU5hbWV9O1xuICAgICAgb3JnQXJyYXkucHVzaChvcmdIYXNoKTtcbiAgICB9XG5cbiAgICBlbHNlXG4gICAge1xuICAgICAgLy9zdGFydCB0ZWFtIHJvdXRpbmVcbiAgICAgIHRlYW0gPSBUZWFtLmZpbmRPbmUoe1widGVhbURpc3BsYXlOYW1lXCI6IGdyb3VwLmRpc3BsYXlOYW1lfSk7XG4gICAgICBpZiAodGVhbSlcbiAgICAgIHtcbiAgICAgICAgaWYoY29udGFpbnModGVhbXMsIHRlYW0sIFwidGVhbVwiKSlcbiAgICAgICAge1xuICAgICAgICAgIGluaXRBdHRyaWJ1dGVzLnVuc2hpZnQodGVhbSk7XG4gICAgICAgICAgdXBkYXRlT2JqZWN0KGluaXRBdHRyaWJ1dGVzLCBcIlRlYW1cIik7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYoZm9yY2VDcmVhdGUpXG4gICAgICB7XG4gICAgICAgIGNyZWF0ZU9iamVjdChpbml0QXR0cmlidXRlcywgXCJUZWFtXCIpO1xuICAgICAgICB0ZWFtID0gVGVhbS5maW5kT25lKHsndGVhbURpc3BsYXlOYW1lJzogZ3JvdXAuZGlzcGxheU5hbWV9KTtcbiAgICAgIH1cbiAgICAgIGVsc2VcbiAgICAgIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICB0ZWFtSGFzaCA9IHsndGVhbUlkJzogdGVhbS5faWQsICd0ZWFtRGlzcGxheU5hbWUnOiBncm91cC5kaXNwbGF5TmFtZX07XG4gICAgICB0ZWFtQXJyYXkucHVzaCh0ZWFtSGFzaCk7XG4gICAgfVxuICB9XG4gIC8vIHVzZXIgaXMgYXNzaWduZWQgdG8gdGVhbS9vcmcgd2hpY2ggaGFzIHNldCBpc0FkbWluOiB0cnVlIGluIG9pZGMgZGF0YVxuICAvLyBoZW5jZSB1c2VyIHdpbGwgZ2V0IGFkbWluIHByaXZpbGVnZXMgaW4gd2VrYW5cbiAgLy8gRS5nLiBBZG1pbiByaWdodHMgd2lsbCBiZSB3aXRoZHJhd24gaWYgbm8gZ3JvdXAgaW4gb2lkYyBwcm92aWRlciBoYXMgaXNBZG1pbiBzZXQgdG8gdHJ1ZVxuXG4gIHVzZXJzLnVwZGF0ZSh7IF9pZDogdXNlci5faWQgfSwgeyAkc2V0OiAge2lzQWRtaW46IGlzQWRtaW4uc29tZShpID0+IChpID09PSB0cnVlKSl9fSk7XG4gIHRlYW1zID0geyd0ZWFtcyc6IHsnJGVhY2gnOiB0ZWFtQXJyYXl9fTtcbiAgb3JncyA9IHsnb3Jncyc6IHsnJGVhY2gnOiBvcmdBcnJheX19O1xuICB1c2Vycy51cGRhdGUoeyBfaWQ6IHVzZXIuX2lkIH0sIHsgJHB1c2g6ICB0ZWFtc30pO1xuICB1c2Vycy51cGRhdGUoeyBfaWQ6IHVzZXIuX2lkIH0sIHsgJHB1c2g6ICBvcmdzfSk7XG4gIC8vIHJlbW92ZSB0ZW1wb3Jhcnkgb2lkYyBkYXRhIGZyb20gdXNlciBjb2xsZWN0aW9uXG4gIHVzZXJzLnVwZGF0ZSh7IF9pZDogdXNlci5faWQgfSwgeyAkdW5zZXQ6ICB7XCJzZXJ2aWNlcy5vaWRjLmdyb3Vwc1wiOiBbXX19KTtcblxuICByZXR1cm47XG59LFxuXG5jaGFuZ2VVc2VybmFtZTogZnVuY3Rpb24odXNlciwgbmFtZSlcbntcbiAgdXNlcm5hbWUgPSB7J3VzZXJuYW1lJzogbmFtZX07XG4gIGlmICh1c2VyLnVzZXJuYW1lICE9IHVzZXJuYW1lKSB1c2Vycy51cGRhdGUoeyBfaWQ6IHVzZXIuX2lkIH0sIHsgJHNldDogIHVzZXJuYW1lfSk7XG59LFxuY2hhbmdlRnVsbG5hbWU6IGZ1bmN0aW9uKHVzZXIsIG5hbWUpXG57XG4gIHVzZXJuYW1lID0geydwcm9maWxlLmZ1bGxuYW1lJzogbmFtZX07XG4gIGlmICh1c2VyLnVzZXJuYW1lICE9IHVzZXJuYW1lKSB1c2Vycy51cGRhdGUoeyBfaWQ6IHVzZXIuX2lkIH0sIHsgJHNldDogIHVzZXJuYW1lfSk7XG59LFxuYWRkRW1haWw6IGZ1bmN0aW9uKHVzZXIsIGVtYWlsKVxue1xuICB1c2VyX2VtYWlsID0gdXNlci5lbWFpbHMgfHwgW107XG4gIHZhciBjb250YWluZWQgPSBmYWxzZTtcbiAgcG9zaXRpb24gPSAwO1xuICBmb3IgKGNvbnN0IFtjb3VudCwgbWFpbF9oYXNoXSBvZiBPYmplY3QuZW50cmllcyh1c2VyX2VtYWlsKSlcbiAge1xuICAgIGlmIChtYWlsX2hhc2hbJ2FkZHJlc3MnXSA9PT0gZW1haWwpXG4gICAge1xuICAgICAgY29udGFpbmVkID0gdHJ1ZTtcbiAgICAgIHBvc2l0aW9uID0gY291bnQ7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgaWYoY29udGFpbmVkICYmIHBvc2l0aW9uICE9IDApXG4gIHtcbiAgICB1c2VyX2VtYWlsLnNwbGljZShwb3NpdGlvbiwxKTtcbiAgICBjb250YWluZWQgPSBmYWxzZTtcbiAgfVxuICBpZighY29udGFpbmVkKVxuICB7XG4gICAgdXNlcl9lbWFpbC51bnNoaWZ0KHsnYWRkcmVzcyc6IGVtYWlsLCAndmVyaWZpZWQnOiB0cnVlfSk7XG4gICAgdXNlcl9lbWFpbCA9IHsnZW1haWxzJzogdXNlcl9lbWFpbH07XG4gICAgdXNlcnMudXBkYXRlKHsgX2lkOiB1c2VyLl9pZCB9LCB7ICRzZXQ6ICB1c2VyX2VtYWlsfSk7XG4gIH1cbn1cbn1cbiJdfQ==
