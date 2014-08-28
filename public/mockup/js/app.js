var app = angular.module('cla', ['ionic', 'claServices', 'leaflet-directive', 'matchmedia-ng']);

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
				'templateUrl': 'home.html'
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
		'controller': 'SubmitCtrl'
	})
	.state('settings', {
		'url': '/settings',
		'templateUrl':'settings.html',
		'controller': 'SettingsCtrl'
	})
	.state('detail', {
		'url': '/detail/:collectionId',
		'templateUrl': 'detail.html',
		'controller': 'DetailCtrl'
	})
	.state('map', {
		'url' : '/map',
		'templateUrl': 'map.html',
		'controller': 'FullMapCtrl'
	})
	;
	$urlRouterProvider.otherwise('login');
});

app.run(function ($rootScope, CLAServices, $state) {
	$rootScope.cla = new CLAServices();
	$rootScope.signOut = function() {
		$rootScope.user = '';
		$state.go('login');
	}
});

app.service('cachedSubmissions', [function(){
	var submissions = undefined;
	this.store = function(newSubmissions) {
		submissions = newSubmissions;
	}
	this.getAll = function() {
		return submissions;
	}
	this.get = function(i) {
		if (submissions != undefined) {
			return submissions[i];
		}
		else {
			return undefined;
		}
	}
}]);

app.controller('AppCtrl', ['$scope', '$state', '$timeout', 'cachedSubmissions', function ($scope, $state, $timeout, cachedSubmissions) {
	if (!$scope.user) {
		$state.go('login');
		return false;
	}
	var username = '',
		timeout = 0,
		i = 0,
		len = $scope.user.names.length;
	if (!$scope.username) {
		for (i = 0; i < len; i++) {
			username += $scope.user.names[i].first + " " + $scope.user.names[i].last;
			if (i !== len - 1) username += ", ";
		}
		$scope.username = username;
	}
	if (timeout) $timeout.cancel(timeout);
	timeout = $timeout(function () {
		var promise = $scope.cla.getMySubmissions();
		promise.then(function (payload) {
			$scope.entries = payload;
			if (!payload) {
				timeout = $timeout(function() {
					var promise = $scope.cla.getMySubmissions();
					promise.then(function (payload) {
						$scope.entries = payload;
						for (var i = $scope.entries.submissions.length - 1; i >= 0; i--) {
							$scope.entries.submissions[i].collectionId = i;
						};
						cachedSubmissions.store($scope.entries.submissions);
					});
				}, 250);
			}
			else {
				for (var i = $scope.entries.submissions.length - 1; i >= 0; i--) {
					$scope.entries.submissions[i].collectionId = i;
				};
				cachedSubmissions.store($scope.entries.submissions);
			}
		});
	}, 250);
}]);

app.controller('LoginCtrl', ['$rootScope', '$scope', '$state', function ($rootScope, $scope, $state) {
	$scope.error = undefined;

	$scope.$on('internalerror', function(event, data) {
		$scope.error = data.message;
	});

	$scope.signIn = function (user) {
		$scope.cla.signIn(user.email, user.pass).then(function (greeting) {
			$scope.cla.getMyProfile().then(function (resp) {
				$rootScope.user = resp.profile;
				$scope.error = undefined;
				$state.go('app.home');
			});
		});
	}
}]);

app.controller('SubmitCtrl', ['$scope', '$state', '$filter', '$window', 'matchmedia', function ($scope, $state, $filter, $window, matchmedia) {
	if (!$scope.user) {
		$state.go('login');
	}
	$scope.sites = {};
	$scope.cla.getSites().then(function (resp) {
		$scope.sites.sites = resp.sites;//resp.userFavoriteSites;
		$scope.sites.sites.unshift(resp.userDefaultSite);
		$scope.sites.userDefaultSite = resp.userDefaultSite;
	});
	$scope.entry = {
		'algalBloom': 0,
		'algalBloomLabel': 'Some',
		'batherLoad': 0,
		'batherLoadLabel': '1-10 bathers',
		'plantDebris': 0,
		'plantDebrisLabel': 'Some',
		'waterAppearance' : 0,
		'waterAppearanceLabel' : 'Some', 
		'waterfowl': 0,
		'waterfowlLabel': 'Some',
		'waveIntensity': 0,
		'waveIntensityLabel': 'Choppy',
		'phosphorusSample': false,
		'oilySheen': 0,
		'date' : $filter("date")(Date.now(),'yyyy-MM-dd'),
		'time': $filter("date")(Date.now(),'HH:mm')
	};
	$scope.description = {
		'batherLoad': 'The estimated number of people that are in the water at a sampling site',
		'plantDebris': 'The estimated amount of floating plant debris covering a sample site',
		'algalBloom': 'The estimated amount of algal growth observed on the surface of a sampling site',
		'waterAppearance': 'A visual observation that takes note of the level of murkiness and the color of the water',
		'waterfowl': 'The estimated number of waterfowl, such as ducks and geese, in a given sampling site',
		'waveIntensity': 'The estimated measurement on the size and frequency of waves on a large body of water.'
	}
	$scope.createEntry = function (entry) {
		$scope.loading = true;
		$scope.cla.currentSite = $scope.sites.userDefaultSite;
		var ts = new Date(entry.date.replace(/-/g,'/') + " " + entry.time),
			promise;
		promise = $scope.cla.submitNewCollection(
				"" + ts.toISOString(), "" + entry.comment, "" + entry.airTemp, "" + entry.waterTemp,
				"" + entry.turbidity, "" + entry.algalBloom, "" + entry.oilySheen, "" + entry.batherLoad, "" + entry.phosphorusSample,
				"" + entry.plantDebris, "" + entry.waterAppearance, "" + entry.waterfowl, "" + entry.waveIntensity);
		promise.then(function (payload) {
			$scope.loading = false;
			$state.go('app.home');
		});
	}
	$scope.helpAlert = function (message) {
		if (matchmedia.is('(max-width: 500px)')) {
			$window.alert(message)
		}
	}
	$scope.goHome = function () {
		$state.go('app.home');
	}
}]);

app.controller('SettingsCtrl', ['$scope', '$state', function ($scope, $state) {
	if (!$scope.user) {
		$state.go('login');
	}
	$scope.goHome = function () {
		$state.go('app.home');
	}
}]);

app.controller('DetailCtrl', ['$scope', '$state', '$stateParams', '$window', 'cachedSubmissions', function($scope, $state, $stateParams, $window, cachedSubmissions){
	if (!$scope.user) {
		$state.go('login');
	}
	$scope.site = undefined;
	$scope.submission = cachedSubmissions.get($stateParams.collectionId);
	$scope.cla.getSites().then(function (resp) {
		for (var i = 0; i < resp.sites.length; i++) {
			if (resp.sites[i].siteId == $scope.submission.collectionSiteId) {
				$scope.site =  resp.sites[i];
				$scope.$broadcast('addMarker', $scope.site);
			}
		}
	});

	$scope.goHome = function () {
		// $state.go('app.home');
		console.log('back');
		$window.history.back();
	}
}]);

app.controller('FullMapCtrl', ['$scope', '$state', '$stateParams', 'cachedSubmissions', function($scope, $state, $stateParams, cachedSubmissions){
	$scope.markers = new Array();

	if (!$scope.user) {
		$state.go('login');
	}

	$scope.submissions = cachedSubmissions.getAll();
	if ($scope.submissions != undefined) {
		$scope.foundSiteIds = new Array();
		for (var i =0; i < $scope.submissions.length; i++) {
			$scope.foundSiteIds.push($scope.submissions[i].collectionSiteId);
		}
		$scope.cla.getSites().then(function (resp) {
			for (var j = 0; j < $scope.foundSiteIds.length; j++) {
				var site = $scope.findSiteWithId($scope.foundSiteIds[j],resp.sites);
				if (site !== -1) {
					$scope.addMarker(site, j);
				}
			}
		});
	}

	angular.extend($scope, {
		madison: {
			lat: 43.043222,
			lng: -89.342194,
			zoom: 12
		},
		tiles : {
			url: 'https://{s}.tiles.mapbox.com/v3/craigbarabas.ihdp2b9c/{z}/{x}/{y}.png',
    	},
    	defaults: {
    		zoomControl: false
    	}
	});

	$scope.addMarker = function (site, j) {
		var message = "<b>" + site.siteId + "</b><br>" + site.description + "<br><a href=\"#/detail/" + j + "\">Details</a>"  ;
		if (site.lat != undefined && site.lon != undefined) {
			if (!$scope.findMarker(site.lat, site.lon)) {
				$scope.markers.push({
					lat: parseFloat(site.lat),
					lng: parseFloat(site.lon),
					message: message
				});
			}
			else {
				$scope.markers.push({
					lat: parseFloat(site.lat) + (Math.random() * 2 - 1)/1000,
					lng: parseFloat(site.lon) + (Math.random() * 2 - 1)/1000,
					message: message
				});
			}
		}
	}

	$scope.findSiteWithId = function (id,sites) {
		for (var i = 0; i < sites.length; i++) {
			if (sites[i].siteId == id) {
				return sites[i]
			}
		}
		return -1;
	}

	$scope.findMarker = function(lat, lng) {
		for (var i =0; i < $scope.markers.length; i++) {
			if ($scope.markers[i].lat == lat && $scope.markers[i].lng == lng) {
				return true;
			}
		}
		return false;
	}

	$scope.goHome = function () {
		$state.go('app.home');
	}
}]);

app.controller('MapCtrl', ['$scope', function($scope) {
	angular.extend($scope, {
		madison: {
			lat: 43.043222,
			lng: -89.342194,
			zoom: 10
		},
		tiles : {
			url: 'https://{s}.tiles.mapbox.com/v3/craigbarabas.ihdp2b9c/{z}/{x}/{y}.png',
    	},
    	defaults: {
    		zoomControl: false
    	}
	});

	$scope.markers = new Array();

	$scope.$on('addMarker', function(event, site) {
		var message = "<b>" + site.siteId + "</b><br>" + site.description
		$scope.markers.push({
			lat: parseFloat(site.lat),
			lng: parseFloat(site.lon),
			message: message,
			focus: true
		});
	});
}]);

var DECIMAL_REGEXP = /^\-?\d+(\.\d*)?$/;
app.directive('decimal', function() {
	return {
		require: 'ngModel',
		link: function(scope, elm, attrs, ctrl) {
			ctrl.$parsers.unshift(function(viewValue) {
				if (DECIMAL_REGEXP.test(viewValue)) {
					//Valid
					ctrl.$setValidity('decimal', true);
					return viewValue;
				} else {
					//Invalid
					ctrl.$setValidity('decimal', false);
					return undefined;
				}
			});
		}
	};
});

