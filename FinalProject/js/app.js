<<<<<<< HEAD
var wReader = angular.module('wReader', ['wReader.filters']).
  config(['$locationProvider', function($locationProvider) {
    $locationProvider.html5Mode(true).hashPrefix('!');
  }]);
  // config(['$routeProvider', function($routeProvider) {
  //   //$routeProvider.when('/view1', {template: 'partials/partial1.html', controller: MyCtrl1});
  //   //$routeProvider.when('/view2', {template: 'partials/partial2.html', controller: MyCtrl2});
  //   $routeProvider.otherwise({redirectTo: '/'});
  // }]);
=======
var wReader = angular.module('wReader', ['wReader.filters', 'wReader.services', 'wReader.directives']);
>>>>>>> 9a9b84a515f8c7a7a39c6e3024ed0ed96e79f3c1


function AppController($scope, items, scroll) {

  $scope.items = items;

  $scope.refresh = function() {
    items.getItemsFromServer();
  };

  $scope.handleSpace = function() {
    if (!scroll.pageDown()) {
      items.next();
    }
  };

  $scope.$watch('items.selectedIdx', function(newVal, oldVal, scope) {
    if (newVal !== null) scroll.toCurrent();
  });
}

AppController.$inject = ['$scope', 'items', 'scroll']; // For JS compilers.


// Top Menu/Nav Bar
function NavBarController($scope, items) {

  $scope.showAll = function() {
    items.clearFilter();
  };

  $scope.showUnread = function() {
    items.filterBy('read', false);
  };

  $scope.showStarred = function() {
    items.filterBy('starred', true);
  };

  $scope.showRead = function() {
    items.filterBy('read', true);
  };
}

NavBarController.$inject = ['$scope', 'items'];  // For JS compilers.



document.addEventListener('DOMContentLoaded', function(e) {
  //On mobile devices, hide the address bar
  window.scrollTo(0);
}, false);
