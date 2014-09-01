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
}
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
}
function deleteCookie(name) {
  var now = new Date();
  try {
    now.setDate(0);
    document.cookie = name + "=''" + "; expires=" + now.toGMTString() + "; path=/";
  } catch (ex) {
    console.log(ex);
  }
}

var app = angular.module('newsflash', ['ionic','ionic.contrib.ui.cards']);

app.config(function ($stateProvider, $urlRouterProvider) {
  $stateProvider.state('app', {
    'url': '/app',
    'abstract': true,
    'controller':'AppCtrl',
    'templateUrl': 'layout.html'
  })
  .state('app.home', {
    'url':'/home',
    'views': {
      'centerContent': {
        'templateUrl': 'home.html',
        'controller': 'HomeCtrl'
      }
    }
  })
  .state('login', {
    'url':'/login',
    'templateUrl': 'login.html',
    'controller': 'LoginCtrl'
  })
  .state('signUp', {
    'url':'/signUp',
    'templateUrl': 'signUp.html',
    'controller': 'SignUpCtrl'
  })
  .state('app.settings', {
    'url': '/settings',
    'views': {
      'centerContent': {
        'templateUrl': 'settings.html',
        'controller': 'SettingsCtrl'
      }
    }
  });
  $urlRouterProvider.otherwise('login');
});
app.directive('noScroll', function($document) {
  return {
    restrict: 'A',
    link: function($scope, $element, $attr) {
      $document.on('touchmove', function(e) {
        e.preventDefault();
      });
    }
  }
})

app.factory('News', ['$http', function ($http) {
  var stories = [],
    init = function (user) {
      $http({
        'method':'get',
        'url': '/api/v1/users/' + user._id + '/stories'
      }).success(function (data, status, headers) {
        stories = data;
      });
      return $http({
        'method':'get',
        'url': '/api/v1/users/' + user._id + '/stories'
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
          'email': email,
          'password': password
        }
      });
    },
    cardSaved = function (user, card) {
      return $http({
        'method': 'post',
        'url': '/api/v1/users/' + user._id + '/liked',
        'data': card
      });
    },
    cardPassed = function (user, card) {
      return $http({
        'method': 'post',
        'url': '/api/v1/users/' + user._id + '/disliked',
        'data': card
      });
    },
    addFeed = function (user, feed) {
      return $http({
        'method':'post',
        'url': '/api/v1/users/' + user._id + '/feeds',
        'data': {
          'url': feed
        }
      });
    },
    removeFeed = function(user, feed) {
      return $http({
        'method':'put',
        'url': '/api/v1/users/' + user._id + '/feeds',
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
          'email': email,
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

app.run(function ($rootScope, $state, $window, News) {
  $rootScope.accepted = [];
  $rootScope.previousCard = {};
  $rootScope.signOut = function() {
    $rootScope.user = null;
    News.clear();
    $rootScope.accepted = [];
    deleteCookie('nf_auth');
    $state.go('login');
  }
  $rootScope.exportStories = function() {
    var URL = "mailto:?subject=Stories from NewsFlash&body=",
      body = '',
      i = 0;
    for (i = 0; i < $rootScope.accepted.length; i++) {
      body += $rootScope.accepted[i].title + ' - ' + $rootScope.accepted[i].link + '\n';
    }
    $window.location = URL + body;
  }
});

app.controller('CardsCtrl', function($scope, $ionicSwipeCardDelegate, $state, User, News, $timeout) {
  $scope.loading = true;
  if (!$scope.user) {
    $state.go('login');
    return false;
  }
  var data = News.data();
  if (data.length !== 0) {
    $timeout(function () {
      $scope.cards = Array.prototype.slice.call(News.data(), 0, 1);
      $scope.loading = false;
    }, 500);
  } else {
    News.init($scope.user).success(function (data, status, headers) {
      $scope.$root.storyList = data;
      $scope.$root.activeCard = Array.prototype.slice.call(News.data(), 0, 1)[0];
      $scope.cards = Array.prototype.slice.call(News.data(), 0, 1);
      $scope.loading = false;
    });
  }

  $scope.cardSwiped = function(index) {
    $scope.previousCard = $scope.activeCard;
    $scope.addCard();
  };

  $scope.cardDestroyed = function(index) {
    if (this.swipeCard.positive === true) { /// trigger positive result
      $scope.$root.accepted.push($scope.previousCard);
      User.cardSaved($scope.user, $scope.previousCard).then();
    } else { /// trigger negative
      User.cardPassed($scope.user, $scope.previousCard).then();
    }
    $scope.cards.splice(index, 1);
  };

  $scope.addCard = function() {
    var newCard = News.pop();
    if ($scope.storyList.length === 0) {
      $scope.empty = true;
    }
    $scope.cards.push(angular.extend({}, newCard));
    $scope.activeCard = newCard;
  }
})

.controller('CardCtrl', function($scope, $ionicSwipeCardDelegate) {
  $scope.accept = function () {
    var card = $ionicSwipeCardDelegate.getSwipebleCard($scope);
    card.swipe(true);
  }
  $scope.reject = function() {
    var card = $ionicSwipeCardDelegate.getSwipebleCard($scope);
    card.swipe();
  };
});

app.controller('AppCtrl', ['$scope', '$state', function ($scope, $state) {
  if (!$scope.user) {
    $state.go('login');
    return false;
  }
}]);

app.controller('HomeCtrl', ['$scope', function ($scope) {
  ///// TODO ??????
}]);

app.controller('LoginCtrl', ['$scope', '$state', 'User', 'News', function ($scope, $state, User, News) {
  $scope.signOut();
  // $scope.user = {
  //   'email':"bradley.orego+nf5@gmail.com",
  //   'pass':"TestWord"
  // };
  $scope.signIn = function (user) {
    User.signIn(user.email, user.pass).success(function (data, status, headers) {
      createCookie('nf_auth', btoa(user.email + ":" + user.pass), 30);
      $scope.$root.user = data;
      $state.go('app.home');
    })
    .error(function (data, status, headers) {
      console.log(data, status, headers);
    });
  };
}]);

app.controller('SignUpCtrl', ['$scope', '$state', 'User', 'News', function ($scope, $state, User, News) {
  $scope.signUp = function (user) {
    User.signUp(user.email, user.pass).success(function (data, status, headers) {
      createCookie('nf_auth', btoa(user.email + ":" + user.pass), 30);
      $scope.$root.user = data;
      $state.go('app.home');
    })
    .error(function (data, status, headers) {
      console.log(data, status, headers);
    });
  };
}]);

app.controller('SettingsCtrl', ['$scope', '$state', 'User', 'News', function ($scope, $state, User, News) {
  if (!$scope.user) {
    $state.go('login');
    return;
  }
  $scope.feeds = $scope.user.RSS_feeds;
  $scope.addFeed = function (url) {
    User.addFeed($scope.user, url).success(function (data, status, headers) {
      News.init($scope.user).success(function (data, status, headers) {
        $scope.$root.storyList = data;
        $scope.$root.activeCard = Array.prototype.slice.call(News.data(), 0, 1)[0];
        $scope.cards = Array.prototype.slice.call(News.data(), 0, 1);
      });
      $scope.feeds.push(url);
      $scope.newFeed = '';
    });
  };
  $scope.removeFeed = function (feed) {
    User.removeFeed($scope.user, feed).success(function (data, status, headers) {
      News.init($scope.user).success(function (data, status, headers) {
        $scope.$root.storyList = data;
        $scope.$root.activeCard = Array.prototype.slice.call(News.data(), 0, 1)[0];
        $scope.cards = Array.prototype.slice.call(News.data(), 0, 1);
      });
      for (var i = 0 ; i < $scope.feeds.length; i++) {
        if ($scope.feeds[i] === feed) {
          $scope.feeds.splice(i,1);
          return true;
        }
      }
    });
  };
}]);

