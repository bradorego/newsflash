/// user has many feeds

/// email password RSS_feeds liked seen recently_liked

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema ({
  email: {'type':String, 'unique': true},
  password: String,
  RSS_feeds: Array,
  liked: Array,
  seen: Array,
  recent: Array,
  lastSignIn: Number,
  signInCount: Number
});

module.exports = mongoose.model('User', userSchema);
