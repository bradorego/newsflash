/// user has many feeds

// User Schema
// {
//   email: {'type':String, 'unique': true},
//   password: String,
//   RSS_feeds: Array,
//   liked: Array,
//   seen: Array,
//   recent: Array,
//   lastSignIn: Number,
//   signInCount: Number
// }

var firebase = require('firebase'),
  crypto = require('crypto'),
  $q = require('node-promise'),
  firebaseRef = new Firebase("https://newsflashnewsapp.firebaseio.com/"),
  usersRef = firebaseRef.child('users'),
  userModel = {
    email: "",
    password: "",
    feeds: [],
    likes: [],
    seen: [],
    recent: [],
    created: 0,
    lastSignIn: 0,
    signInCount: 0
  };

function extend(target, source) {
  for (var key in source) {
    // skip loop if the property is from prototype
    if (!source.hasOwnProperty(key)) continue;
    if (!target[key]) {
      target[key] = source[key];
    }
  }
};

var formatEmail = function (email) { /// from http://stackoverflow.com/a/14965065/1148769
  if (!email) return false;
  email = email.toLowerCase();
  email = email.replace(/\./g, ',');
  return email;
};

var getUserRef = function (userObj) {
  return usersRef.child(formatEmail(userObj.email));
};

var encryptPassword = function (password) {
  return crypto.createHash('sha1').update(password).digest('hex');
};

var User = function (obj) {
  extend(this, userModel);

  this.email = obj.email;
  this.password = encryptPassword(obj.password);
  // this.feeds = [];
  // this.liked = [];
  // this.seen = [];
  // this.recent = [];
  this.created = +new Date();
  this.lastSignIn = +new Date();
  this.signInCount = 0;
};

var update = function (userObj) {
  var d = $q.defer(),
    user = getUserRef(userObj);
  user.update(userObj, function (error) {
    if (error) {
      return d.reject(error);
    }
    return d.resolve(userObj);
  });
  return d.promise;
};

var create = function (userObj) {
  var d = $q.defer(),
    user = getUserRef(userObj);
  get(userObj)
    .then(function (data) {
      return d.reject({status: 401, message: "Account with that email already exists"});
    }, function (err) {
      user.set(userObj, function (err) {
        if (err) {
          return d.reject(err);
        }
        get(userObj)
          .then(function (data) {
            return d.resolve(data);
          }, function (err) {
            return d.reject(err);
          });
      });
    });
  return d.promise;
};

var remove = function (userObj) {
  var d = $q.defer(),
    user = getUserRef(userObj);

  user.remove(function (err) {
    if (err) {
      return d.reject(err);
    }
    return d.resolve({status: 200, message: "Delete Successful"});
  })

  return d.promise;
};

var get = function (userObj) {
  var d = $q.defer(),
    user = getUserRef(userObj),
    output = {};
  usersRef.once('value', function (snapshot) {
    if (snapshot.child(formatEmail(userObj.email)).exists()) {
      snapshot.child(formatEmail(userObj.email)).forEach(function (obj) {
        output[obj.key()] = obj.val();
      });
      extend(output, userModel);
      return d.resolve(output);
    }
    return d.reject({'status': 404, 'message': 'Email Not Found'});
  });
  return d.promise;
};

var login = function (userObj) {
  var d = $q.defer(),
    user = getUserRef(userObj),
    output = {};
  user.once('value', function (snapshot) {
    snapshot.forEach(function (obj) {
      output[obj.key()] = obj.val();
    });
    if (!output.email) {
      return d.reject({'status': 404, 'message': 'Email Not Found'});
    }
    if (output.password !== encryptPassword(userObj.password)) {
      return d.reject({'status': 401, 'message': 'Incorrect password'});
    }
    output.signInCount += 1;
    output.lastSignIn = +new Date();
    update(output);
    return d.resolve(output);
  });
  return d.promise;
};

module.exports = {
  model: User,
  update: update,
  create: create,
  delete: remove,
  login: login,
  get: get
};
