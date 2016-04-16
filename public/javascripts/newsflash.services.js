/// newsflash.services.js

////// cookie code borrowed lovingly from PPK - http://www.quirksmode.org/js/cookies.html
function readCookie(name) {
  try {
    var nameEQ = name + "=",
      ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
      var c = ca[i];
      while (c.charAt(0)==' ') {
        c = c.substring(1,c.length);
      }
      if (c.indexOf(nameEQ) == 0) {
        return c.substring(nameEQ.length,c.length);
      }
    }
    return null;
  } catch (ex) {
    catchError(ex);
  }
};
function createCookie(name, value, days) {
  try {
      var expires = "";
      if (days !== 0) {
          var exdate = new Date();
          exdate.setDate(exdate.getDate() + days);
          expires = "; expires=" + exdate.toUTCString();
      }
      document.cookie = name + '=' + value + expires + "; path=/";
  } catch (ex) {
    catchError(ex);
  }
};
function deleteCookie(name) {
  var now = new Date();
  try {
    now.setDate(0);
    document.cookie = name + "=''" + "; expires=" + now.toGMTString() + "; path=/";
  } catch (ex) {
    console.log(ex);
  }
};

var app = angular.module('newsflash');

app.factory('News', ['$http', function ($http) {
  var stories = [],
    init = function (user) {
      $http({
        'method':'get',
        'url': '/api/v1/users/' + user.email + '/stories'
      }).success(function (data, status, headers) {
        stories = data;
      });
      return $http({
        'method':'get',
        'url': '/api/v1/users/' + user.email + '/stories'
      });
    },
    pop = function () {
      return stories.pop();
    };
  return {
    'init': function (user) {
      return init(user);
    },
    'data': function() {
      return stories;
    },
    'clear': function() {
      stories = [];
      return true;
    },
    'pop': function () {
      return pop();
    }
  };
}]);
app.service('User', ['$http', function ($http) {
  var signIn = function (email, password) {
      return $http({
        'method': 'put',
        'url': '/api/v1/users',
        'data': {
          'email': email.toLowerCase(),
          'password': password
        }
      });
    },
    cardSaved = function (user, card) {
      return $http({
        'method': 'post',
        'url': '/api/v1/users/' + user.email + '/liked',
        'data': card
      });
    },
    cardPassed = function (user, card) {
      return $http({
        'method': 'post',
        'url': '/api/v1/users/' + user.email + '/disliked',
        'data': card
      });
    },
    addFeed = function (user, feed) {
      return $http({
        'method':'post',
        'url': '/api/v1/users/' + user.email + '/feeds',
        'data': {
          'url': feed
        }
      });
    },
    removeFeed = function(user, feed) {
      return $http({
        'method':'put',
        'url': '/api/v1/users/' + user.email + '/feeds',
        'data': {
          'url': feed
        }
      });
    },
    signUp = function (email, password) {
      return $http({
        'method': 'post',
        'url': '/api/v1/users',
        'data': {
          'email': email.toLowerCase(),
          'password': password
        }
      });
    };
  return {
    'signIn': function (email, pass) {
      return signIn(email, pass);
    },
    'cardSaved': function (user, card) {
      return cardSaved(user, card);
    },
    'cardPassed': function (user, card) {
      return cardPassed(user, card);
    },
    'addFeed': function (user, feed) {
      return addFeed(user, feed);
    },
    'removeFeed': function (user, feed) {
      return removeFeed(user, feed);
    },
    'signUp': function (email, pass) {
      return signUp(email, pass);
    }
  }
}]);
