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
});

app.run(function ($rootScope, $state, $window, News, User) {
  $rootScope.accepted = [];
  $rootScope.previousCard = {};
  $rootScope.cookieName = 'nf_auth';
  var cookie = readCookie($rootScope.cookieName)
  if (cookie) {
    cookie = atob(cookie).split(':');
    User.signIn(cookie[0], cookie[1]).success(function (data, status, headers) {
    if (data.email) {
        createCookie($rootScope.cookieName, btoa(cookie[0] + ":" + cookie[1]), 30);
        $rootScope.user = data;
        if (ga) {
          ga('send', 'event', 'user', 'signedIn', '', data._id);
        }
        $state.go('app.home');
      }
    });
  }
  $rootScope.signOut = function() {
    if (ga && $rootScope.user) {
      ga('send', 'event', 'user', 'signedOut', '', $rootScope.user.email);
    }
    $rootScope.user = null;
    News.clear();
    $rootScope.accepted = [];
    deleteCookie($rootScope.cookieName);
    $state.go('login');
  }
  $rootScope.exportStories = function() {
    var URL = "mailto:?subject=Stories from NewsFlash&body=",
      body = '',
      i = 0;
    for (i = 0; i < $rootScope.accepted.length; i++) {
      body += $rootScope.accepted[i].title + ' - ' + $rootScope.accepted[i].link + '\n';
    }
    if (ga) {
      ga('send', 'event', 'story', 'exported');
    }
    $window.location = URL + body;
  }
});



