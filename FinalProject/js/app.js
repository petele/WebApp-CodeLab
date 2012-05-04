var wReader = angular.module('wReader', ['wReader.filters']);
  // config(['$routeProvider', function($routeProvider) {
  //   //$routeProvider.when('/view1', {template: 'partials/partial1.html', controller: MyCtrl1});
  //   //$routeProvider.when('/view2', {template: 'partials/partial2.html', controller: MyCtrl2});
  //   $routeProvider.otherwise({redirectTo: '/'});
  // }]);

// wReader.factory('myService', function() {
//   return {
//     selectItem: function(scope) {
//       scope.items = [1];
//     }
//   };
// });

// Create or open the data store where objects are stored for offline use
var store = new Lawnchair({name: 'entries', record: 'entry'}, function() {
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

// Create the all up Ember application
var WReader = Em.Application.create({
  ready: function() {
    // Call the superclass's `ready` method.
    this._super();

    //On mobile devices, hide the address bar
    window.scrollTo(0);

    // Load items from the local data store first
    //WReader.GetItemsFromDataStore();
    //DataController.prototype.getItemsFromDataStore();
  }
});

function DataController($scope, $http) {
  $scope.items = [];

  // this.$scope = $scope;
  // this.$http = $http;

  // $scope.getItemsFromDataStore = function() {
  //   return this.getItemsFromDataStore();
  // }.bind(this);

  // $scope.getItemsFromServer = function() {
  //   return this.getItemsFromServer();
  // }.bind(this);

  $scope.getItemsFromDataStore = function() {
    // Get all items from the local data store.
    //  We're using store.all because store.each returns async, and the
    //  method will return before we've pulled all the items out.  Then
    //  there is a strong likelyhood of GetItemsFromServer stomping on
    //  local items.
    var items = store.all(function(arr) {
      arr.forEach(function(entry) {
        var item = new Item();
        angular.extend(item, entry);
        $scope.addItem(item);

        //var dataController = new DataController({});
        //dataController.addItem(item);
      });

      console.log("Entries loaded from local data store:", arr.length);

      // Set the default view to any unread items
      // WReader.itemsController.showDefault();


      // Load items from the server after we've loaded everything from
      //  the local data store
      $scope.getItemsFromServer();
    });
  };

  $scope.getItemsFromServer = function() {
    // URL to data feed that I plan to consume
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

        var emItem = new Item();
        angular.extend(emItem, item);

        // Try to add the item to the data controller, if it's successfully
        //  added, we get TRUE and add the item to the local data store,
        //  otherwise it's likely already in the local data store.
        if ($scope.addItem(emItem)) {
          store.save(item);
        }
      });

      // Refresh the visible items
      //ItemsController.showDefault();
      //var itemsController = new ItemsController({});
      //itemsController.showDefault();
    };

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

  // A 'property' that returns the count of items
  $scope.itemCount = function() {
    return $scope.items.length;
  };

  // A 'property' that returns the count of read items
  $scope.readCount = function() {
    return $scope.items.filter(function(val, i) { return val.read }).length;
  };

  // A 'property' that returns the count of unread items
  $scope.unreadCount = function() {
    return $scope.items.filter(function(val, i) { return !val.read }).length;
    // TODO use $scope.items.length - $scope.readCount() instead.
  };

  // A 'property' that returns the count of starred items
  $scope.starredCount = function() {
    return $scope.items.filter(function(val, i) { return val.starred }).length;
  };

  $scope.markAllRead = function() {
    // Iterate through all items, and set read=true in the data controller
    // then set read=true in the data store.
    $scope.items.forEach(function(item, i) {
      item.read = true;
      store.toggleRead(item.item_id, true);
    });
  };

  // Fetch items when the constructor is called.
  $scope.getItemsFromServer();
}

function ItemsController($scope) { //{, $injector) {//, myService) {
  //$injector.invoke(DataController, this, {$scope: $scope}); 

  $scope.selectedItemIdx = null;
  
  $scope.hasNext = function() {
    if ($scope.selectedItemIdx == null) {
      return true;
    }
    return $scope.selectedItemIdx < $scope.$parent.items.length - 1;
  };
  
  $scope.hasPrev = function() {
    if ($scope.selectedItemIdx == null) {
      return false;
    }
    return $scope.selectedItemIdx > 0;
  };

  // Sets content[] to the filtered results of the data controller
  $scope.filterBy = function(key, value) {
    //this.set('content', WReader.dataController.filterProperty(key, value));
    return $scope.items.filter(function(val, i) {
      return val[key] == value;
    });
  };

  // Sets content[] to all items in the data controller
  $scope.clearFilter = function() {
    //this.set('content', WReader.dataController.get('content'));
  };

  // Shortcut for filterBy
  $scope.showDefault = function() {
    //$scope.filterBy('read', false);
  };

  // Mark all visible items read
  $scope.markAllRead = function() {
    $scope.$parent.markAllRead();
  };

  $scope.selectedItem = function() {
    if ($scope.selectedItemIdx == null) {
      return null;
    }
    return $scope.$parent.items[$scope.selectedItemIdx];
  };

  // Called to select an item
  $scope.selectItem = function(opt_idx) {

    // Unselect previous selection.
    var selectedItem = $scope.selectedItem();
    if (selectedItem) {
      selectedItem.selected = false;
    }


    if (opt_idx != undefined) {
      $scope.selectedItemIdx = opt_idx;
      $scope.$parent.items[$scope.selectedItemIdx].selected = true;
    } else {
      $scope.selectedItemIdx = this.$index;
      this.item.selected = true;
    }

    $scope.toggleRead(true);
    //$scope.hasNext = !!this.$$nextSibling;
    //$scope.hasPrev = !!this.$$prevSibling;

    //TODO: Update the address bar
    //var url = location.origin + location.pathname + '';
    //var item_url = "" + item.get('item_id');
    //history.pushState(item.get('item_id'), 'title', url + item_url);
  };

  // Advances to the next item.
  $scope.next = function(opt_delta) {
    var delta = opt_delta || 1;
    $scope.selectItem(
        $scope.selectedItemIdx != null ? $scope.selectedItemIdx + delta : 0);
  };

  // Goes back to the previous item.
  $scope.prev = function() {
    $scope.next(-1);
  };

  // Toggles or sets the read state with an optional boolean
  $scope.toggleRead = function(opt_read) {
    var selectedItem = $scope.selectedItem();
    var read = opt_read || !selectedItem.read;
    selectedItem.read = read;
    var key = selectedItem.item_id;
    store.toggleRead(key, read);
  };

  // Toggles or sets the starred status with an optional boolean
  $scope.toggleStar = function(opt_star) {
    var selectedItem = $scope.selectedItem();
    var star = opt_star || !selectedItem.starred;
    selectedItem.starred = star;
    var key = selectedItem.item_id;
    store.toggleStar(key, star);
  };
}
//ItemsController.$inject = ['$scope', '$injector', '$filter'];
//ItemsController.prototype = Object.create(DataController.prototype);

// // Selected Item Controller - and provides functionality to hook into
// // all details for a specific item.
// WReader.selectedItemController = Em.Object.create({
//   // Pointer to the seclected item
//   selectedItem: null,

//   hasPrev: false,

//   hasNext: false,

//   // Called to select an item
//   select: function(item) {
//     this.set('selectedItem', item);
//     if (item) {
//       this.toggleRead(true);

//       // Determine if we have a previous/next item in the array
//       var currentIndex = WReader.itemsController.content.indexOf(this.get('selectedItem'));
//       if (currentIndex + 1 >= WReader.itemsController.get('itemCount')) {
//         this.set('hasNext', false);
//       } else {
//         this.set('hasNext', true);
//       }
//       if (currentIndex === 0) {
//         this.set('hasPrev', false);
//       } else {
//         this.set('hasPrev', true);
//       }

//       //TODO: Update the address bar
//       //var url = location.origin + location.pathname + '';
//       //var item_url = "" + item.get('item_id');
//       //history.pushState(item.get('item_id'), 'title', url + item_url);

//     } else {
//       this.set('hasPrev', false);
//       this.set('hasNext', false);
//     }
//   },

//   // Toggles or sets the read state with an optional boolean
//   toggleRead: function(read) {
//     if (read === undefined) {
//       read = !this.selectedItem.get('read');
//     }
//     this.selectedItem.set('read', read);
//     var key = this.selectedItem.get('item_id');
//     store.toggleRead(key, read);
//   },

//   // Toggles or sets the starred status with an optional boolean
//   toggleStar: function(star) {
//     if (star === undefined) {
//       star = !this.selectedItem.get('starred');
//     }
//     this.selectedItem.set('starred', star);
//     var key = this.selectedItem.get('item_id');
//     store.toggleStar(key, star);
//   },

//   // Selects the next item in the item controller
//   next: function() {
//     // Get's the current index in case we've changed the list of items, if the
//     // item is no longer visible, it will return -1.
//     var currentIndex = WReader.itemsController.content.indexOf(this.get('selectedItem'));
//     // Figure out the next item by adding 1, which will put it at the start
//     // of the newly selected items if they've changed.
//     var nextItem = WReader.itemsController.content[currentIndex + 1];
//     if (nextItem) {
//       this.select(nextItem);
//     }
//   },

//   // Selects the previous item in the item controller
//   prev: function() {
//     // Get's the current index in case we've changed the list of items, if the
//     // item is no longer visible, it will return -1.
//     var currentIndex = WReader.itemsController.content.indexOf(this.get('selectedItem'));
//     // Figure out the previous item by subtracting 1, which will result in an
//     // item not found if we're already at 0
//     var prevItem = WReader.itemsController.content[currentIndex - 1];
//     if (prevItem) {
//       this.select(prevItem);
//     }
//   }
// });


// A special observer that will watch for when the 'selectedItem' is updated
// and ensure that we scroll into a view so that the selected item is visible
// in the summary list view.
WReader.selectedItemController.addObserver('selectedItem', function() {
  var curScrollPos = $('.summaries').scrollTop();
  var itemTop = $('.summary.active').offset().top - 60;
  $(".summaries").animate({"scrollTop": curScrollPos + itemTop}, 200);
});

// View for the ItemsList
WReader.SummaryListView = Em.View.extend({
  tagName: 'article',

  classNames: ['well', 'summary'],

  classNameBindings: ['active', 'read', 'prev', 'next'],

  // Handle clicks on item summaries with the same code path that
  // handles the touch events.
  click: function(evt) {
    this.touchEnd(evt);
  },

  // Handle clicks/touch/taps on an item summary
  touchEnd: function(evt) {
    // Figure out what the user just clicked on, then set selectedItemController
    var content = this.get('content');
    WReader.selectedItemController.select(content);
  },

  // Enables/Disables the active CSS class
  active: function() {
    var selectedItem = WReader.selectedItemController.get('selectedItem');
    var content = this.get('content');
    if (content === selectedItem) {
      return true;
    }
  }.property('WReader.selectedItemController.selectedItem'),

  // Enables/Disables the read CSS class
  read: function() {
    var read = this.get('content').get('read');
    return read;
  }.property('WReader.itemsController.@each.read'),

  // Returns the date in a human readable format
  formattedDate: function() {
    var d = this.get('content').get('pub_date');
    return moment(d).fromNow();
  }.property('WReader.selectedItemController.selectedItem')
});


// // View for the Selected Item
// WReader.EntryItemView = Em.View.extend({
//   tagName: 'article',

//   contentBinding: 'WReader.selectedItemController.selectedItem',

//   classNames: ['well', 'entry'],

//   classNameBindings: ['active', 'read', 'prev', 'next'],

//   // Enables/Disables the active CSS class
//   active: function() {
//     return true;
//   }.property('WReader.selectedItemController.selectedItem'),

//   // Enables/Disables the read CSS class
//   read: function() {
//     var read = this.get('content').get('read');
//     return read;
//   }.property('WReader.itemsController.@each.read'),

//   // Returns a human readable date
//   formattedDate: function() {
//     var d = this.get('content').get('pub_date');
//     return moment(d).format("MMMM Do YYYY, h:mm a");
//   }.property('WReader.selectedItemController.selectedItem')
// });

// Top Menu/Nav Bar view
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
    $scope.filterBy('read', true);
  };

  // Click handler for menu bar
  $scope.refresh = function() {
    $scope.getItemsFromServer();
  };
}
// //NavBarController.$inject = ['$scope', '$injector'];
// NavBarController.prototype = Object.create(ItemsController.prototype);

// Left hand controls view
// WReader.NavControlsView = Em.View.extend({
//   tagName: 'section',

//   classNames: ['controls'],

//   classNameBindings: ['hide'],

//   hide: function() {
//     return false;
//   }.property('WReader.settingsController.tabletControls'),

//   // Click handler for up/previous button
//   navUp: function(e) {
//     WReader.selectedItemController.prev();
//   },

//   // Click handler for down/next button
//   navDown: function(e) {
//     WReader.selectedItemController.next();
//   },

//   // Click handler to toggle the selected items star status
//   toggleStar: function(e) {
//     WReader.selectedItemController.toggleStar();
//   },

//   // Click handler to toggle the selected items read status
//   toggleRead: function(e) {
//     WReader.selectedItemController.toggleRead();
//   },

//   // Click handler to mark all as read
//   markAllRead: function(e) {
//     WReader.itemsController.markAllRead();
//   },

//   // Click handler for refresh
//   refresh: function(e) {
//     WReader.GetItemsFromServer();
//   },


//   starClass: function() {
//     var selectedItem = WReader.selectedItemController.get('selectedItem');
//     if (selectedItem) {
//       if (selectedItem.get('starred')) {
//         return 'icon-star';
//       }
//     }
//     return 'icon-star-empty';
//   }.property('WReader.selectedItemController.selectedItem.starred'),
//   readClass: function() {
//     var selectedItem = WReader.selectedItemController.get('selectedItem');
//     if (selectedItem) {
//       if (selectedItem.get('read')) {
//         return 'icon-ok-sign';
//       }
//     }
//     return 'icon-ok-circle';
//   }.property('WReader.selectedItemController.selectedItem.read'),
//   nextDisabled: function() {
//     return !WReader.selectedItemController.get('hasNext');
//   }.property('WReader.selectedItemController.selectedItem.next'),
//   prevDisabled: function() {
//     return !WReader.selectedItemController.get('hasPrev');
//   }.property('WReader.selectedItemController.selectedItem.prev'),
//   buttonDisabled: function() {
//     var selectedItem = WReader.selectedItemController.get('selectedItem');
//     if (selectedItem) {
//       return false;
//     }
//     return true;
//   }.property('WReader.selectedItemController.selectedItem')
// });

function NavControlsView($scope) {
  $scope.tabletControls = false;

  $scope.hide = function() {
    return false;
  };

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
  $scope.refresh = function(e) {
    //WReader.GetItemsFromServer();
    console.log('NavControlsView')
  };

  $scope.starClass = function() {
    var selectedItem = WReader.selectedItemController.get('selectedItem');
    if (selectedItem) {
      if (selectedItem.get('starred')) {
        return 'icon-star';
      }
    }
    return 'icon-star-empty';
  };//.property('WReader.selectedItemController.selectedItem.starred'),
  
  $scope.readClass = function() {
    var selectedItem = WReader.selectedItemController.get('selectedItem');
    if (selectedItem) {
      if (selectedItem.get('read')) {
        return 'icon-ok-sign';
      }
    }
    return 'icon-ok-circle';
  };//.property('WReader.selectedItemController.selectedItem.read'),
  
  $scope.nextDisabled = function() {
    return !WReader.selectedItemController.get('hasNext');
  };//.property('WReader.selectedItemController.selectedItem.next'),
  
  $scope.prevDisabled = function() {
    return !WReader.selectedItemController.get('hasPrev');
  };//.property('WReader.selectedItemController.selectedItem.prev'),
  
  $scope.buttonDisabled = function() {
    var selectedItem = WReader.selectedItemController.get('selectedItem');
    if (selectedItem) {
      return false;
    }
    return true;
  };//.property('WReader.selectedItemController.selectedItem')
}



WReader.HandleSpaceKey = function() {
  var itemHeight = $('.entry.active').height() + 60;
  var winHeight = $(window).height();
  var curScroll = $('.entries').scrollTop();
  var scroll = curScroll + winHeight;
  if (scroll < itemHeight) {
    $('.entries').scrollTop(scroll);
  } else {
    WReader.selectedItemController.next();
  }
};

function handleBodyKeyDown(e) {
  switch (e.keyCode) {
    case 34: // PgDn
    case 39: // right arrow
    case 40: // down arrow
    case 74: // j
      WReader.selectedItemController.next();
      break;

    case 32: // Space
      WReader.HandleSpaceKey();
      e.preventDefault();
      break;

    case 33: // PgUp
    case 37: // left arrow
    case 38: // up arrow
    case 75: // k
      WReader.selectedItemController.prev();
      break;

    case 85: // U
      WReader.selectedItemController.toggleRead();
      break;

    case 72: // H
      WReader.selectedItemController.toggleStar();
      break;
  }
}

function handlePopState(e) {
  console.log("Pop State", e);
}

document.body.addEventListener('keydown', handleBodyKeyDown, false);
window.addEventListener('popstate', handlePopState, false);
