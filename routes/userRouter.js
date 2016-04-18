/*jslint white*/
/*global req, res, data*/
var express = require('express');
var userRouter = express.Router();
var UserModel = require('../models/user');
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
    var user = new UserModel.model({
      email: req.body.email,
      password: req.body.password
    });
    UserModel.create(user)
      .then(function (data) {
        res.json(data);
      }, function (err) {
        res.send(err);
      });
  })
  .put(function (req, res) {
    UserModel.login({email: req.body.email, password: req.body.password, increase: true})
      .then(function (data) {
        res.json(data);
      }, function (err) {
        res.status(err.status);
        res.send(err);
      });
    // UserModel.findOne({'email': req.body.email}, function (err, user) {
    //   if (err) {
    //     res.status(500);
    //     res.end(err);
    //   } else {
    //     if (!user) {
    //       res.status(401);
    //       res.send({'status':401,'message':'Email not found'});
    //     } else if (user.password !== crypto.createHash('sha1').update(req.body.password).digest('hex')) {
    //       res.status(401);
    //       res.send({'status':401,'message':'Incorrect password'});
    //     } else {
    //       UserModel.update({'_id':req.body._id}, {'lastSignIn': ts, '$inc': {'signInCount': 1}}, function (err, numAffected, raw) {
    //         if (err) {
    //           res.status(500);
    //           res.send(err);
    //         } else {
    //           user.lastSignIn = ts;
    //           user.signInCount = user.signInCount + 1;
    //           res.json(user);
    //         }
    //       });
    //     }
    //   }
    // });
  })
  .delete(function (req, res) {
    UserModel.delete({email: req.body.email})
      .then(function (data) {
        res.json('baleeted');
      }, function (err) {
        res.send(err);
      });
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
    UserModel.get({email: req.body.email})
      .then(function (user) {
        if (user.feeds.indexOf(req.body.url) !== -1) {
          return res.json({status: 400, message: 'Feed already in list'});
        }
        user.feeds.push(req.body.url);
        UserModel.update(user)
          .then(function (data) {
            res.json(data);
          }, function (err) {
            res.send(err);
          });
      }, function (err) {
        res.send(err);
      });
  }) /// end post
  .delete(function (req, res) {
    UserModel.get({email: req.body.email})
      .then(function (user) {
        user.feeds.splice(user.feeds.indexOf(req.body.url));
        UserModel.update(user).then(function (data) {
          res.json(data);
        }, function (err) {
          res.send(err);
        });
      }, function (err) {
        res.send(err);
      });
  });

userRouter.route('/:id/stories')
  .get(function (req, res) {
    // UserModel.findById(req.body._id, function (err, user) {
    UserModel.get({email: req.body.email})
      .then(function(user) {
        var i = 0,
          j = 0,
          count = 0,
          currentStory = {},
          currentSource = "",
          currentImage = "",
          stories = [],
          alreadySeen = false;
        if (user.feeds.length) {
          for (i = 0; i < user.feeds.length; i++) {
            request({
              url: 'http://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=20&q=' + user.feeds[i],
              method: 'GET',
              json: true,
              gzip: true
            }, function (error, response, body) {
              count++;
              if (body.responseStatus === 200) {
                currentSource = body.responseData.feed.title;
                // console.log(1);
                for (j = 0; j < body.responseData.feed.entries.length; j++) {
                  // console.log(2);
                  currentStory = body.responseData.feed.entries[j];
                  currentImage = '';
                  if (currentStory.mediaGroups && currentStory.mediaGroups[0].contents && currentStory.mediaGroups[0].contents[0].thumbnails) {
                    currentImage = currentStory.mediaGroups[0].contents[0].thumbnails[0].url;
                  }
                  alreadySeen = !!user.seen.some(function (el) {
                    // console.log(3);
                    if ((el.title === currentStory.title) && (el.source === currentSource)) {
                      return true;
                    }
                  });
                  // console.log(4);
                  if (!alreadySeen) {
                    stories.push({
                      title: currentStory.title,
                      link: currentStory.link,
                      image: currentImage,
                      summary: currentStory.contentSnippet,
                      date: new Date(currentStory.publishedDate).toDateString(),
                      source: currentSource
                    });
                  }
                }
              }
              // console.log(5);
              if (count === user.feeds.length) { // done!
                stories = stories.sort(function (a,b) {return 0.5 - Math.random();}); // randomize!
                res.json(stories);
              }
            });
          }
        } else {
          res.json();
        }
      }, function (err) {
        res.send(err);
      });
  });

userRouter.route('/:id/liked')
  .get(function (req, res) {
    // UserModel.findById(req.body._id, function (err, user) {
    UserModel.get({email: req.body.email})
      .then(function (user) {
        if (err) {
          res.send(err);
        } else {
          res.json(user.liked);
        }
      }, function (err) {
        res.send(err);
      });
  }) /// end get
  .post(function (req, res) {
    var story = {
      title: req.body.title,
      link: req.body.link,
      source: req.body.source,
      image: req.body.image,
      date: req.body.date
    };
    // UserModel.findById(req.body._id, function (err, user) {
    UserModel.get({email: req.body.email})
      .then(function (user) {
        if (user.liked.indexOf(story) !== -1) {
          return res.json({status: 400, message: "Story already liked"});
        }
        user.liked.push(story);
        user.seen.push(story);
        UserModel.update(user, true) /// don't send data back
          .then(function (data) {
            res.json(user);
          }, function (err) {
            res.send(err);
          });
      }, function (err) {
        res.send(err);
      });
  }); /// end post

userRouter.route('/:id/disliked')
  .post(function (req, res) {
    var story = {
      title: req.body.title,
      link: req.body.link,
      source: req.body.source,
      image: req.body.image,
      date: req.body.date
    };
    UserModel.get({email: req.body.email})
      .then(function (user) {
        if (user.seen.indexOf(story) !== -1) {
          return res.json({status: 400, message: "Story already seen"});
        }
        user.seen.push(story);
        UserModel.update(user, true) /// don't send data back
          .then(function (data) {
            res.json(user);
          }, function (err) {
            res.send(err);
          });
      }, function (err) {
        res.send(err);
      });
    });

module.exports = userRouter;
