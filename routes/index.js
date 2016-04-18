var express = require('express');
var apiRouter = express.Router();
var userRouter = require('./userRouter');
var user = require('../models/user');
var crypto = require('crypto');
var promise = require('node-promise');
var router = function (app) {

  /* GET home page. */
  app.get('/', function(req, res) {
    res.render('index', { title: 'Express' });
  });

  apiRouter.get('/', function (req, res) {
    res.json({'message':'hello world'});
  });

  // app.get('/test', function (req, res) {
  //   var newUser = new user.model({
  //     email: "me2@bradorego.com",
  //     password: "TestWord"
  //   });
  //   user.create(newUser);
  //   res.render();
  // });

  // app.get('/test2', function (req, res) {
  //   user.get({email: "me@bradorego.com"}).then(function (data) {
  //     console.log(data);
  //     res.render('index', {title: data.email});
  //   }, function (err) {
  //     console.log(err);
  //     res.status(404);
  //     res.send('404: Not Found');
  //   });
  // });

  // app.get('/test3', function (req, res) {
  //   user.update({email: "me@bradorego.com", RSS_feeds: ['http://feeds.feedburner.com/TechCrunch/']})
  //   res.render();
  // });

  apiRouter.use('/users', userRouter);
  app.use('/api/v1', apiRouter);
}

module.exports = router;
