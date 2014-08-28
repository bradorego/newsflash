var app = angular.module('cla', ['ionic','ionic.contrib.ui.cards']);

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
	.state('submit', {
		'url': '/submit',
		'templateUrl': 'submit.html',
		'controller':'SubmitCtrl'
	})
	.state('app.about', {
		'url': '/about',
		'views': {
			'centerContent': {
				'templateUrl': 'about.html',
				'controller': 'AboutCtrl'
			}
		}
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
      'url': '/rss.json?callback=JSON_CALLBACK'
    });
  },
  loadMore = function (index) {
  	return $http({
      'method':'get',
      'url': '/rss.json?index=' + index + '&callback=JSON_CALLBACK'
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

app.run(function ($rootScope, $state, $window, news) {
	$rootScope.accepted = [];
  $rootScope.rejected = 0;
  $rootScope.previousCard = {};
	$rootScope.signOut = function() {
		$rootScope.user = '';
		$state.go('login');
	}
	news.init().success(function (data, status, headers) {
		$rootScope.storyList = data.responseData.feed.entries;
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
    if (this.swipeCard.positive === true) {
      $scope.$root.accepted.push($scope.previousCard);
    } else {
      $scope.$root.rejected++;
    }
    $scope.cards.splice(index, 1);
  };

  $scope.addCard = function() {
    var newCard = $scope.storyList.pop();
    if ($scope.storyList.length === 0) {
    	news.loadMore().success(function (data, status, headers) {
				$scope.$root.storyList = $scope.$root.storyList.concat(data.responseData.feed.entries);
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

app.controller('LoginCtrl', ['$rootScope', '$scope', '$state', function ($rootScope, $scope, $state) {
	$scope.$on('internalerror', function(event, data) {
		$scope.error = data.message;
	});

	$scope.signIn = function (user) {

	}

	$scope.override = function () {
		$rootScope.user = {
			'name': 'lololol',
			'isVolunteer': true
		};
		$state.go('app.home');
	}
}]);


app.controller('AboutCtrl', ['$scope', '$state', function ($scope, $state) {
	if (!$scope.user) {
		$state.go('login');
		return;
	}
}]);
app.controller('DonateCtrl', ['$scope', '$state', function ($scope, $state) {
	if (!$scope.user) {
		$state.go('login');
		return;
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

