var express = require('express');
var userRouter = express.Router();
var UserModel = require('../models/user');
var crypto = require('crypto');
var request = require('request');

userRouter.route('/')
  .get(function (req, res) {
    UserModel.find(function (err, data) {
      if (err) {
        res.send(err);
      } else {
        res.json(data);
      }
    });
  })
  .post(function (req, res) {
    var user = new UserModel({
      'email': req.body.email,
      'password': crypto.createHash('sha1').update(req.body.password).digest('hex'),
      'lastSignIn': +new Date(),
      'signInCount': 0
    });

    user.save(function (err, data) {
      if (err) {
        res.send(err);
      } else {
        res.json(data);
      }
    });
  })
  .put(function (req, res) {
    var ts = +new Date();
    UserModel.findOne({'email': req.body.email}, function (err, user) {
      if (err) {
        res.end(err);
      } else if (user && (user.password === crypto.createHash('sha1').update(req.body.password).digest('hex'))) {
        UserModel.update({'_id':req.body._id}, {'lastSignIn': ts, '$inc': {'signInCount': 1}}, function (err, numAffected, raw) {
          if (err) {
            res.send(err);
          } else {
            user.lastSignIn = ts;
            user.signInCount = user.signInCount + 1;
            res.json(user);
          }
        });
      } else {
        var err = new Error('Invalid auth');
        err.status = 401;
        err.message = 'Invalid auth';
        res.send(err);
      }
    });
  })
  .delete(function (req, res) {
    UserModel.find().remove().exec();
    res.json('baleeted')
  });
userRouter.route('/:id')
  .get(function (req, res) {
    UserModel.findById(req.params.id, function (err, user) {
      if (err) {
        res.send(err);
      } else {
        res.json(user);
      }
    });
  })
  .put(function (req, res) {})
  .delete(function (req, res) {});

userRouter.route('/:id/feeds')
  .post(function (req, res) {
    UserModel.findById(req.body._id, function (err, user) {
      UserModel.update({'_id':req.params.id}, {'$addToSet': {'RSS_feeds': req.body.url}}, function (err, numAffected, raw) {
        if (err) {
          res.send(err);
        } else {
          if (user.RSS_feeds.indexOf(req.body.url) === -1) {
            user.RSS_feeds.push(req.body.url);
          }
          res.json(user);
        }
      });
    });
  })
  .put(function (req, res) {
    UserModel.findById(req.body._id, function (err, user) {
      UserModel.update({'_id':req.params.id}, {'$pull': {'RSS_feeds': req.body.url}}, function (err, numAffected, raw) {
        if (err) {
          res.send(err);
        } else {
          user.RSS_feeds.splice(user.RSS_feeds.indexOf(req.body.url),1);
          res.json(user);
        }
      });
    });
  });

userRouter.route('/:id/stories')
  .get(function (req, res) {
    UserModel.findById(req.body._id, function (err, user) {
      var i = 0,
        j = 0,
        k = 0,
        count = 0,
        currentStory = {},
        currentSource = "",
        currentImage = "",
        stories = [];
      for (i = 0; i < user.RSS_feeds.length; i++) {
        request({
          'url': 'http://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=20&q=' + user.RSS_feeds[i],
          'method': 'GET',
          'json': true,
          'gzip': true
        }, function (error, response, body) {
          count++;
          currentSource = body.responseData.feed.title;
          for (j = 0; j < body.responseData.feed.entries.length; j++) {
            currentStory = body.responseData.feed.entries[j];
            currentImage = '';
            if (currentStory.mediaGroups && currentStory.mediaGroups[0].contents && currentStory.mediaGroups[0].contents[0].thumbnails) {
              currentImage = currentStory.mediaGroups[0].contents[0].thumbnails[0].url;
            }
            stories.push({
              'title': currentStory.title,
              'link': currentStory.link,
              'image': currentImage,
              'summary': currentStory.contentSnippet,
              'date': new Date(currentStory.publishedDate).toDateString(),
              'source': currentSource
            });
          }
          if (count === user.RSS_feeds.length) { // done!
            /// TODO filter out stories they've seen?
            // for (k = 0; k < stories.length; k++) {
            ////// compare stories to seen, if title and source the same, remove it from stories
            // }
            stories = stories.sort(function (a,b) {return 0.5 - Math.random();}); // randomize!
            res.json(stories);
          }
        });
      }
    });
  });

userRouter.route('/:id/liked')
  .get(function (req, res) {
    UserModel.findById(req.body._id, function (err, user) {
      if (err) {
        res.send(err);
      } else {
        res.json(user.liked);
      }
    });
  })
  .post(function (req, res) {
    console.log(req.body);
    var story = {
      'title': req.body.title,
      'link': req.body.link,
      'source': req.body.source,
      'image': req.body.image,
      'date': req.body.date
    }
    UserModel.findById(req.body._id, function (err, user) {
      UserModel.update({'_id':req.params.id}, {'$addToSet': {'liked': story, 'seen': story}}, function (err, numAffected, raw) {
        if (err) {
          res.send(err);
        } else {
          if (user.liked.indexOf(story) === -1) {
            user.liked.push(story);
          }
          res.json(user);
        }
      });
    });
  });

userRouter.route('/:id/disliked')
  .post(function (req, res) {
    var story = {
      'title': req.body.title,
      'link': req.body.link,
      'source': req.body.source,
      'image': req.body.image,
      'date': req.body.date
    }
    UserModel.findById(req.body._id, function (err, user) {
      UserModel.update({'_id':req.params.id}, {'$addToSet': {'seen': story}}, function (err, numAffected, raw) {
        if (err) {
          res.send(err);
        } else {
          res.json(user);
        }
      });
    });
  });


module.exports = userRouter;
