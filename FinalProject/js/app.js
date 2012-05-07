var wReader = angular.module('wReader', ['wReader.filters']).
  config(['$locationProvider', function($locationProvider) {
    $locationProvider.html5Mode(true).hashPrefix('!');
  }]);
  // config(['$routeProvider', function($routeProvider) {
  //   //$routeProvider.when('/view1', {template: 'partials/partial1.html', controller: MyCtrl1});
  //   //$routeProvider.when('/view2', {template: 'partials/partial2.html', controller: MyCtrl2});
  //   $routeProvider.otherwise({redirectTo: '/'});
  // }]);

// Create or open the data store where objects are stored for offline use
var store = new Lawnchair({
  name: 'entries',
  record: 'entry',
  adapter: 'indexed-db'
}, function() {
  //TODO: this should probably go in the item store
  this.toggleRead = function(key, value) {
    this.get(key, function(entry) {
      entry.read = value;
      this.save(entry);
    });
  };

  //TODO: this should probably go in the item store
  this.toggleStar = function(key, value) {
    this.get(key, function(entry) {
      entry.starred = value;
      this.save(entry);
    });
  };
});

function Item() {
  this.read = false;
  this.starred = false;
  this.selected = false;
  this.item_id = null;
  this.title = null;
  this.pub_name = null;
  this.pub_author = null;
  this.pub_date = new Date(0);
  this.short_desc = null;
  this.content = null;
  this.feed_link = null;
  this.item_link = null;
}

function DataController($scope, $http, $filter) {
  $scope.items = [];
  $scope.allItems = [];

  $scope.getItemsFromDataStore = function() {
    // Get all items from the local data store.
    //  We're using store.all because store.each returns async, and the
    //  method will return before we've pulled all the items out.  Then
    //  there is a strong likelihood of getItemsFromServer stomping on
    //  local items.
    var items = store.all(function(arr) {
      arr.forEach(function(entry) {
        var item = new Item();
        angular.extend(item, entry);
        $scope.addItem(item);
      });

      console.log("Entries loaded from local data store:", arr.length);

      $scope.allItems = $scope.items;

      // Load items from the server after we've loaded everything from the local
      // data store. Duplicate item starred/read states are preserved.
      $scope.getItemsFromServer();
      
      $scope.clearFilter();
    });
  };

  $scope.getItemsFromServer = function() {
    var feedURL = 'http://blog.chromium.org/feeds/posts/default?alt=json';

    var getLink = function(links, rel) {
      for (var i = 0, link; link = links[i]; ++i) {
        if (link.rel === rel) {
          return link.href;
        }
      }
      return null;
    };

    var successCallback = function(data, status, headers, config) {
      var entries = data.feed.entry;

      // Use map to iterate through the items and create a new JSON object for
      // each item
      entries.forEach(function(entry) {
        var item = {};
        item.title = entry.title.$t;
        item.item_id = entry.id.$t;
        item.key = item.item_id; // For LawnChair.
        item.pub_name = data.feed.title.$t; // Set the pub name to the feed's title.
        item.pub_author = entry.author[0].name.$t;
        item.pub_date = new Date(entry.published.$t);

        // Set the link to the entry to it's original source if it exists
        //  or set it to the entry link
        item.item_link = getLink(entry.link, 'alternate');
        item.feed_link = getLink(data.feed.link, 'alternate');
        item.content = entry.content.$t;
        item.short_desc = item.content.substr(0, 128) + '...';

        var tempItem = new Item();
        angular.extend(tempItem, item);

        // Try to add the item to the data controller, if it's successfully
        //  added, we get TRUE and add the item to the local data store,
        //  otherwise it's likely already in the local data store.
        if ($scope.addItem(tempItem)) {
          store.save(item);
        }
      });

      $scope.allItems = $scope.items;

      console.log('Entries loaded from server:', $scope.items.length);
    };

    $scope.items = [];
    $http.jsonp(feedURL + '&callback=JSON_CALLBACK').success(successCallback);
  };

  // Adds an item to the controller if it's not already in the controller
  $scope.addItem = function(item) {

    var exists = $scope.items.filter(function(val, i) {
      return val.item_id == item.item_id;
    }).length;

    if (exists === 0) {
      // If no results are returned, we insert the new item into the data
      // controller in order of publication date
      var idx = $scope.binarySearch(Date.parse(item.pub_date), 0, $scope.items.length);
      $scope.items.splice(idx, 0, item);
      return true;
    } else {
      // It's already in the data controller, so we won't re-add it.
      return false;
    }
  };

  // Binary search implementation that finds the index where a entry
  // should be inserted when sorting by date.
  $scope.binarySearch = function(value, low, high) {
    var mid, midValue;
    if (low === high) {
      return low;
    }
    mid = low + Math.floor((high - low) / 2);
    midValue = Date.parse($scope.items[mid].pub_date);

    if (value < midValue) {
      return this.binarySearch(value, mid + 1, high);
    } else if (value > midValue) {
      return this.binarySearch(value, low, mid);
    }
    return mid;
  };

  $scope.itemCount = function() {
    return $scope.allItems.length;
  };

  $scope.readCount = function() {
    return $scope.allItems.filter(function(val, i) { return val.read }).length;
  };

  $scope.unreadCount = function() {
    return $scope.allItems.length - $scope.readCount();
  };

  // A 'property' that returns the count of starred items
  $scope.starredCount = function() {
    return $scope.allItems.filter(function(val, i) { return val.starred }).length;
  };

  $scope.markAllRead = function() {
    // Iterate through all items, and set read=true in the data controller
    // then set read=true in the data store.
    $scope.items.forEach(function(item, i) {
      item.read = true;
      store.toggleRead(item.item_id, true);
    });
  };

  $scope.clearFilter = function() {
    $scope.items = $scope.allItems;
  };

  $scope.filterBy = function(key, value) {
    $scope.items = $filter('filter')($scope.allItems, function(item, i) {
      return item[key] == value;
    });
  };

  // Fetch items when the constructor is called.
  $scope.getItemsFromDataStore();
}

DataController.$inject = ['$scope', '$http', '$filter']; // For JS compilers.


function ItemsController($scope, $location) {
  // A special observer that will watch for when the 'selectedItem' is updated
  // and ensure that we scroll into a view so that the selected item is visible
  // in the summary list view.
  $scope.$watch('selectedItem().index', function(newVal, oldVal, scope) {
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

  $scope.selectedItem = function() {
    for (var i = 0, item; item = $scope.$parent.items[i]; ++i) {
      if (item.selected == true) {
        return {item: item, index: i};
      }
    }
    return {item: null, index: null};
  };

  $scope.hasNext = function() {
    var selectedItem = $scope.selectedItem();
    if (selectedItem.index == null) {
      return true;
    }
    return selectedItem.index < $scope.$parent.items.length - 1;
  };
  
  $scope.hasPrev = function() {
    var selectedItem = $scope.selectedItem();
    if (selectedItem.index == null) {
      return true;
    }
    return selectedItem.index > 0;
  };

  // Called to select an item
  $scope.selectItem = function(opt_idx) {

    // Unselect previous selection.
    var selectedItem = $scope.selectedItem().item;
    if (selectedItem) {
      selectedItem.selected = false;
    }

    if (opt_idx != undefined) {
      selectedItem = $scope.$parent.items[opt_idx];
      selectedItem.selected = true;
    } else {
      this.item.selected = true;
      selectedItem = this.item;
    }

    $scope.toggleRead(true);

    //TODO: Update the address bar
    //$location.hash(selectedItem.item_id)

    //var url = location.origin + location.pathname + '';
    //var item_url = "" + item.get('item_id');
    //history.pushState(item.get('item_id'), 'title', url + item_url);
  };

  // Advances to the next item.
  $scope.next = function(opt_delta) {
    var delta = opt_delta || 1;

    var selectedItem = $scope.selectedItem();
    $scope.selectItem(selectedItem.item != null ? selectedItem.index + delta : 0);
  };

  // Goes back to the previous item.
  $scope.prev = function() {
    $scope.next(-1);
  };

  // Toggles or sets the read state with an optional boolean
  $scope.toggleRead = function(opt_read) {
    var selectedItem = $scope.selectedItem().item;
    var read = opt_read || !selectedItem.read;
    selectedItem.read = read;
    var key = selectedItem.item_id;
    store.toggleRead(key, read);
  };

  // Toggles or sets the starred status with an optional boolean
  $scope.toggleStar = function(opt_star) {
    var selectedItem = $scope.selectedItem().item;
    var star = opt_star || !selectedItem.starred;
    selectedItem.starred = star;
    var key = selectedItem.item_id;
    store.toggleStar(key, star);
  };
}

ItemsController.$inject = ['$scope', '$location'];  // For JS compilers.
//ItemsController.prototype = Object.create(DataController.prototype);

// Top Menu/Nav Bar
function NavBarController($scope) {//, $injector) {
  //$injector.invoke(ItemsController, this, {$scope: $scope}); 

  // Click handler for menu bar
  $scope.showAll = function() {
    $scope.clearFilter();
  };

  // Click handler for menu bar
  $scope.showUnread = function() {
    $scope.filterBy('read', false);
  };

  // Click handler for menu bar
  $scope.showStarred = function() {
    $scope.filterBy('starred', true);
  };

  // Click handler for menu bar
  $scope.showRead = function() {
    $scope.$parent.filterBy('read', true);
  };

  // Click handler for menu bar
  $scope.refresh = function() {
    $scope.getItemsFromServer();
  };

  //$scope.showAll(); // Show all when page loads.
}

NavBarController.$inject = ['$scope'];  // For JS compilers.
// NavBarController.prototype = Object.create(ItemsController.prototype);

function NavControlsView($scope) {

  // Click handler for up/previous button
  $scope.navUp = function() {
    $scope.$parent.prev();
  };

  // Click handler for down/next button
  $scope.navDown = function() {
    $scope.$parent.next();
  };

  // Click handler to toggle the selected items star status
  $scope.toggleStar = function() {
    $scope.$parent.toggleStar();
  };

  // Click handler to toggle the selected items read status
  $scope.toggleRead = function() {
    $scope.$parent.toggleRead();
  };

  // Click handler to mark all as read
  $scope.markAllRead = function() {
    $scope.$parent.markAllRead();
  };

  // Click handler for refresh
  $scope.refresh = function() {
    $scope.getItemsFromServer();
  };
}


function handleSpace() {
  var itemHeight = $('.entry.active').height() + 60;
  var winHeight = $(window).height();
  var curScroll = $('.entries').scrollTop();
  var scroll = curScroll + winHeight;
  if (scroll < itemHeight) {
    $('.entries').scrollTop(scroll);
  } else {
    $('.controls button[ng-click="navDown()"]').click();
  }
};

function handleBodyKeyDown(e) {
  switch (e.keyCode) {
    case 34: // PgDn
    case 39: // right arrow
    case 40: // down arrow
    case 74: // j
      $('.controls button[ng-click="navDown()"]').click(); // TODO: figure out angular way
      break;

    case 32: // Space
      handleSpace();
      e.preventDefault();
      break;

    case 33: // PgUp
    case 37: // left arrow
    case 38: // up arrow
    case 75: // k
      $('.controls button[ng-click="navUp()"]').click();
      break;

    case 85: // U
      $('.controls button[ng-click="toggleRead()"]').click();
      break;

    case 72: // H
      $('.controls button[ng-click="toggleStar()"]').click();
      break;
  }
}

function handlePopState(e) {
  //console.log("Pop State", e);
}

document.body.addEventListener('keydown', handleBodyKeyDown, false);
window.addEventListener('popstate', handlePopState, false);

document.addEventListener('DOMContentLoaded', function(e) {
  //On mobile devices, hide the address bar
  window.scrollTo(0);
}, false);
