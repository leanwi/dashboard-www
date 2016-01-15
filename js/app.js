var myApp = angular.module('ngclient', ['chart.js', 'ngRoute', 'daterangepicker']);
 
myApp.config(function($routeProvider, $httpProvider) {
 
  $httpProvider.interceptors.push('TokenInterceptor');
 
  $routeProvider
    .when('/login', {
      templateUrl: 'partials/login.html',
      controller: 'LoginCtrl',
      access: {
        requiredLogin: false
      }
    }).when('/', {
      templateUrl: 'partials/home.html',
      controller: 'HomeCtrl',
      access: {
        requiredLogin: false
      },
      reloadOnSearch: false
    }).when('/admin', {
      templateUrl: 'partials/admin.html',
      controller: 'AdminCtrl',
      access: {
        requiredLogin: true
      }
    }).when('/page2', {
      templateUrl: 'partials/page2.html',
      controller: 'Page2Ctrl',
      access: {
        requiredLogin: true
      }
    }).otherwise({
      redirectTo: '/login'
    });
});

myApp.constant('apiUrl', 'http://localhost:3000/api/v1/');
 
myApp.run(function($rootScope, $window, $location, AuthenticationFactory) {
  // when the page refreshes, check if the user is already logged in
  AuthenticationFactory.check();
 
  $rootScope.$on("$routeChangeStart", function(event, nextRoute, currentRoute) {
    if ((nextRoute.access && nextRoute.access.requiredLogin) && !AuthenticationFactory.isLogged) {
      $location.path("/login");
    } else {
      // check if user object exists else fetch it. This is incase of a page refresh
      if (!AuthenticationFactory.user) AuthenticationFactory.user = $window.sessionStorage.user;
      if (!AuthenticationFactory.userRole) AuthenticationFactory.userRole = $window.sessionStorage.userRole;
    }
  });
 
  $rootScope.$on('$routeChangeSuccess', function(event, nextRoute, currentRoute) {
    $rootScope.showMenu = AuthenticationFactory.isLogged;
    $rootScope.role = AuthenticationFactory.userRole;
    // if the user is already logged in, take him to the home page
    if (AuthenticationFactory.isLogged == true && $location.path() == '/login') {
      $location.path('/');
    }
  });



});
