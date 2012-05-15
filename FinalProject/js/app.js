var wReader = angular.module('wReader', ['wReader.filters', 'wReader.services', 'wReader.directives']);


function AppController($scope, items, scroll) {

  $scope.items = items;

  $scope.itemCount = function() {
    return items.all.length;
  };

  $scope.readCount = function() {
    return items.all.filter(function(val, i) { return val.read }).length;
  };

  $scope.unreadCount = function() {
    return items.all.length - $scope.readCount();
  };

  $scope.starredCount = function() {
    return items.all.filter(function(val, i) { return val.starred }).length;
  };

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
