///newsflash.controllers.js
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

var app = angular.module('newsflash');

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
      $scope.$root.activeCard = Array.prototype.slice.call(data, 0, 1)[0];
      $scope.cards = Array.prototype.slice.call(data, 0, 1);
      $scope.loading = false;
    });
  }

  $scope.cardSwiped = function(index) {
    $scope.previousCard = $scope.activeCard;
    $scope.addCard();
  };

  $scope.cardDestroyed = function(index) {
    if (this.swipeCard.positive === true) { /// trigger positive result
      if (ga) {
        ga('send', 'event', 'story', 'saved');
      }
      $scope.$root.accepted.push($scope.previousCard);
      User.cardSaved($scope.user, $scope.previousCard).then();
    } else { /// trigger negative
      if (ga) {
        ga('send', 'event', 'story', 'passed');
      }
      User.cardPassed($scope.user, $scope.previousCard).then();
    }
    $scope.cards.splice(index, 1);
  };

  $scope.addCard = function() {
    var newCard = News.pop();
    if (!newCard) {
      return $scope.empty = true;
    }
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

app.controller('AppCtrl', [
  '$scope',
  '$state',
  '$ionicPopup',
  'User',
  function ($scope, $state, $ionicPopup, User) {
    if (!$scope.user) {
      $state.go('login');
      return false;
    }
    var countAlert = function (signIns) {
        if (signIns === 10) {
          $ionicPopup.alert({title: "10th Sign In!", template: "You've signed in 10 times! Keep up the good work!"});
        }
        if (signIns === 25) {
          $ionicPopup.alert({title: "25th Sign In!", template: "And that makes 25 sign ins! You're on a roll!"});
        }
        if (signIns === 50) {
          $ionicPopup.alert({title: "50th Sign In!", template: "That's a, uh, silver anniversary? Golden? You're quite the 'flasher ;)"});
        }
        if (signIns === 100) {
          $ionicPopup.alert({title: "100th Sign In!", template: "You're officially a NewsFlash Centurian! Keep it up!"});
        }
        if (signIns === 250) {
          $ionicPopup.alert({title: "250th Sign In!", template: "248....249....250! Wow, it's gotta be a habit at this point!"});
        }
        if (signIns === 500) {
          $ionicPopup.alert({title: "500th Sign In!", template: "You just hit 500 sign ins! Legendary!"});
        }
        if (signIns === 1000) {
          $ionicPopup.alert({title: "1000th Sign In!", template: "Seriously I don't think I even use the app this much. Crazy!"});
        }
        if (signIns === 2000) {
          $ionicPopup.alert({title: "2000th Sign In!", template: "Now, the question is, how long do these things go on...?"});
        }
      },
      tenureAlert = function (created) {
        var now = +new Date();
        
      };
    countAlert($scope.user.signInCount);
    tenureAlert($scope.user.created);
  }]);

app.controller('HomeCtrl', ['$scope', function ($scope) {
  if (ga) {
    ga('send','screenview', {
      'screenName': 'Home'
    });
  }
  ///// TODO ??????
}]);

app.controller('LoginCtrl', ['$scope', '$state', 'User', 'News', function ($scope, $state, User, News) {
  $scope.signOut();
  // $scope.user = {
  //   'email':"bradley.orego+nf5@gmail.com",
  //   'pass':"TestWord"
  // };
  if (ga) {
    ga('send','screenview', {
      'screenName': 'Login'
    });
  }
  $scope.signIn = function (user) {
    User.signIn(user.email, user.pass).success(function (data, status, headers) {
      if (data.email) {
        $scope.error = '';
        createCookie($scope.cookieName, btoa(user.email + ":" + user.pass), 30);
        $scope.$root.user = data;
        if (ga) {
          ga('send', 'event', 'user', 'signedIn', '', data._id);
        }
        $state.go('app.home');
      } else {
        $scope.error = "Log in failed"
      }
    })
    .error(function (data, status, headers) {
      $scope.error = data.message;
      console.log(data, status, headers());
    });
  };
}]);

app.controller('SignUpCtrl', ['$scope', '$state', 'User', 'News', function ($scope, $state, User, News) {
  if (ga) {
    ga('send','screenview', {
      'screenName': 'SignUp'
    });
  }
  $scope.signUp = function (user) {
    User.signUp(user.email, user.pass).success(function (data, status, headers) {
      if (data.status === 401) {
        $scope.error = data.message;
        return
      }
      if (data.email) {
        $scope.error = '';
        createCookie($scope.cookieName, btoa(user.email + ":" + user.pass), 30);
        $scope.$root.user = data;
        if (ga) {
          ga('send', 'event', 'user', 'signedUp', '', data._id);
        }
        $state.go('app.home');
        return;
      }
      $scope.error = 'Unknown error occurred';
      return;
    })
    .error(function (data, status, headers) {
      $scope.error = data;
      console.log(data, status, headers);
    });
  };
}]);

app.controller('SettingsCtrl', ['$scope', '$state', 'User', 'News', function ($scope, $state, User, News) {
  if (!$scope.user) {
    $state.go('login');
    return;
  }
  if (ga) {
    ga('send','screenview', {
      'screenName': 'Settings'
    });
  }
  $scope.feeds = $scope.user.feeds;
  $scope.addFeed = function (url) {
    User.addFeed($scope.user, url).success(function (data, status, headers) {
      News.init($scope.user).success(function (data, status, headers) {
        $scope.$root.storyList = data;
        $scope.$root.activeCard = Array.prototype.slice.call(News.data(), 0, 1)[0];
        $scope.cards = Array.prototype.slice.call(News.data(), 0, 1);
      });
      $scope.feeds.push(url);
      $scope.newFeed = '';
      if (ga) {
        ga('send', 'event', 'feed', 'added', '', url);
      }
    });
  };
  $scope.removeFeed = function (feed) {
    User.removeFeed($scope.user, feed).success(function (data, status, headers) {
      News.init($scope.user).success(function (data, status, headers) {
        $scope.$root.storyList = data;
        $scope.$root.activeCard = Array.prototype.slice.call(News.data(), 0, 1)[0];
        $scope.cards = Array.prototype.slice.call(News.data(), 0, 1);
      });
      if (ga) {
        ga('send', 'event', 'feed', 'removed', '', feed);
      }
      for (var i = 0 ; i < $scope.feeds.length; i++) {
        if ($scope.feeds[i] === feed) {
          $scope.feeds.splice(i,1);
          return true;
        }
      }
    });
  };
}]);
