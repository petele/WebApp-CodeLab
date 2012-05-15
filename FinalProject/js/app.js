var wReader = angular.module('wReader', ['wReader.filters', 'wReader.services']);

  // config(['$locationProvider', function($locationProvider) {
  //   $locationProvider.html5Mode(true).hashPrefix('!');
  // }]);
  // config(['$routeProvider', function($routeProvider) {
  //   //$routeProvider.when('/view1', {template: 'partials/partial1.html', controller: MyCtrl1});
  //   //$routeProvider.when('/view2', {template: 'partials/partial2.html', controller: MyCtrl2});
  //   $routeProvider.otherwise({redirectTo: '/'});
  // }]);

// wReader.factory('itemsService', function() {
//   var items = [];

//   return {
//     addItem: function(item) {
//       items.push(item);
//     }
//   };
// });



function DataController($scope, items, $filter) {

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
    var itemHeight = $('.entry.active').height() + 60;
    var winHeight = $(window).height();
    var curScroll = $('.entries').scrollTop();
    var scroll = curScroll + winHeight;
    if (scroll < itemHeight) {
      $('.entries').scrollTop(scroll);
    } else {
      items.next();
    }
  };
}

DataController.$inject = ['$scope', 'items', '$filter']; // For JS compilers.


function ItemsController($scope) { //{, $location) {
  // A special observer that will watch for when the 'selectedItem' is updated
  // and ensure that we scroll into a view so that the selected item is visible
  // in the summary list view.
  $scope.$watch('items.selectedIdx', function(newVal, oldVal, scope) {
    // TODO: Performing scrolling like this doesn't seem very Angular-ly.
    // Need the setTimeout to prevent race condition with item being selected.
    if (newVal != null) {
      window.setTimeout(function() {
        var curScrollPos = $('.summaries').scrollTop();
        var itemTop = $('.summary.active').offset().top - 60;
        $('.summaries').animate({'scrollTop': curScrollPos + itemTop}, 200);
      }, 0);
    }
  });
}

ItemsController.$inject = ['$scope'];//, '$location'];  // For JS compilers.


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



wReader.directive('wUp', function() {
  return function(scope, elm, attr) {
    elm.bind('keydown', function(e) {
      switch (e.keyCode) {
        case 34: // PgDn
        case 39: // right arrow
        case 40: // down arrow
        case 74: // j
          return scope.$apply(attr.wDown);

        case 32: // Space
          e.preventDefault();
          return scope.$apply(attr.wSpace);

        case 33: // PgUp
        case 37: // left arrow
        case 38: // up arrow
        case 75: // k
          return scope.$apply(attr.wUp);

        case 85: // U
          return scope.$apply(attr.wRead);

        case 72: // H
          return scope.$apply(attr.wStar);
      }
    });
  };
});


function handlePopState(e) {
  //console.log("Pop State", e);
}

window.addEventListener('popstate', handlePopState, false);

document.addEventListener('DOMContentLoaded', function(e) {
  //On mobile devices, hide the address bar
  window.scrollTo(0);
}, false);
