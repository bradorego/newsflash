var express = require('express');
var apiRouter = express.Router();
var userRouter = require('./userRouter');
var router = function (app) {

  /* GET home page. */
  app.get('/', function(req, res) {
    res.render('index', { title: 'Express' });
  });

  apiRouter.get('/', function (req, res) {
    res.json({'message':'hello world'});
  });

  apiRouter.use('/users', userRouter);
  app.use('/api/v1', apiRouter);
}

module.exports = router;
