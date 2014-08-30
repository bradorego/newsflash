var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

var crypto = require('crypto');

app.use(function (req, res, next) {
  if (req.cookies.nf_auth) {
    var auth = new Buffer(req.cookies.nf_auth, 'base64').toString('ascii').split(':');
    UserModel.findOne({'email': auth[0]}, function (err, user) {
      if (user.password === crypto.createHash('sha1').update(auth[1]).digest('hex')) {
        req.body._id = user._id;
        next();
      } else {
        var err = new Error('Invalid auth');
        err.status = 401;
        err.message = 'Invalid auth';
        next(err);
      }
    });
  } else {
    next();
  }
});

app.routes = require('./routes')(app);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

//////////////////////
app.mongoose = require('mongoose');
app.mongoose.connect('mongodb://node:node@ds053198.mongolab.com:53198/nf_main');

var UserModel = require('./models/user');

// console.log(UserModel);

app.set('port', process.env.PORT || 8010);

var server = app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + server.address().port);
});



module.exports = app;
