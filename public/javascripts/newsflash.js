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
          now = new Date();
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
  try {
    now.setDate(0);
    document.cookie = name + "=''" + "; expires=" + now.toGMTString() + "; path=/";
  } catch (ex) {
    catchError(ex);
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

app.factory('news', ['$http', function ($http) {
  var init = function () {
    return $http({
      'method':'get',
      'url': '/api/v1/users/53ff462596ad76169e000002/stories'
    });
  },
  loadMore = function (index) {
    return $http({
      'method':'get',
      'url': '/api/v1/users/53ff462596ad76169e000002/stories?callback=JSON_CALLBACK'
    });
  };
  return {
    'init': function () {
      return init();
    },
    'loadMore': function (index) {
      return loadMore(index);
    }
  };
}]);
app.service('Auth', ['$http', function ($http) {
    var signIn = function (email, password) {
      return $http({
        'method': 'put',
        'url': '/api/v1/users',
        'data': {
          'email': email,
          'password': password
        }
      })
    };
    return {
      'signIn': function (email, pass) {
        return signIn(email, pass);
      }
    }
  }]);

app.run(function ($rootScope, $state, $window, news) {
  createCookie('nf_auth', 'YnJhZGxleS5vcmVnbytuZjJAZ21haWwuY29tOlRlc3RXb3Jk', 30);
  $rootScope.accepted = [];
  $rootScope.rejected = 0;
  $rootScope.previousCard = {};
  $rootScope.signOut = function() {
    $rootScope.user = '';
    deleteCookie('nf_auth');
    $state.go('login');
  }
  news.init().success(function (data, status, headers) {
    $rootScope.storyList = data;
    $rootScope.activeCard = $rootScope.storyList[0];
  });
  $rootScope.goBack = function () {
    $window.history.back();
  }
});

app.controller('CardsCtrl', function($scope, $ionicSwipeCardDelegate, $state, news) {
  if (!$scope.user) {
    $state.go('login');
    return false;
  }

  $scope.cards = Array.prototype.slice.call($scope.storyList, 0, 1);

  $scope.cardSwiped = function(index) {
    $scope.previousCard = $scope.activeCard;
    $scope.addCard();
  };

  $scope.cardDestroyed = function(index) {
    if (this.swipeCard.positive === true) { /// trigger positive result
      $scope.$root.accepted.push($scope.previousCard);
    } else { /// trigger negative
      $scope.$root.rejected++;
    }
    $scope.cards.splice(index, 1);
  };

  $scope.addCard = function() {
    var newCard = $scope.storyList.pop();
    if ($scope.storyList.length === 0) {
      news.loadMore().success(function (data, status, headers) {
        $scope.$root.storyList = $scope.$root.storyList.concat(data);
        $scope.$root.activeCard = $scope.storyList[0];
      });
    }
    $scope.cards.push(angular.extend({}, newCard));
    $scope.activeCard = newCard;
  }
})

.controller('CardCtrl', function($scope, $ionicSwipeCardDelegate, $rootScope) {
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
  /////TODO - implement/use getAllSites info ////
}]);

app.controller('LoginCtrl', ['$scope', '$state', 'Auth', 'news', function ($scope, $state, Auth, news) {
  $scope.$on('internalerror', function(event, data) {
    $scope.error = data.message;
  });

  $scope.signIn = function (user) {
    Auth.signIn(user.email, user.pass).success(function (data, status, headers) {
      /////// TODO TODO TODO TODO
      //// UPDATE CLIENT-SIDE AUTH STUFF TO USE ACTUAL AUTH AND NOT HARD-CODED DATA
      //// UPDATE CLIENT TO PULL PREVIOUSLY LIKED ITEMS (BACKEND?)
      //// CREATE EMAIL LINK WITH LIST OF ARTICLES
      /////// TODO TODO TODO TODO
      $scope.$root.user = data;
      $state.go('app.home');
    })
    .error(function (data, status, headers) {
      console.log(data, status, headers);
    });
  }
  $scope.override = function () {
    $scope.$root.user = {
      'name': 'lololol',
      'isVolunteer': true
    };
    $state.go('app.home');
  }
}]);


app.controller('SettingsCtrl', ['$scope', '$state', function ($scope, $state) {
  if (!$scope.user) {
    $state.go('login');
    return;
  }
  $scope.feeds = [];
  $scope.addFeed = function (url) {
    $scope.feeds.push(url);
    $scope.newFeed = '';
  }
  $scope.removeFeed = function (feed) {
    for (var i = 0 ; i < $scope.feeds.length; i++) {
      if ($scope.feeds[i] === feed) {
        $scope.feeds.splice(i,1);
        return true;
      }
    }
  }
}]);

