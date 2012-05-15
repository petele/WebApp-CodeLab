var services = angular.module('wReader.services', []);


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


// Create or open the data store where objects are stored for offline use
services.value('store', new Lawnchair({
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
}));


services.factory('items', ['$http', 'store', 'filterFilter', function($http, store, filter) {
	var items = {
		all: [],
		filtered: [],
		selected: null,
		selectedIdx: null,


		addItem: function(item) {

			var exists = items.all.filter(function(val, i) {
			  return val.item_id == item.item_id;
			}).length;

			if (exists === 0) {
			  // If no results are returned, we insert the new item into the data
			  // controller in order of publication date
			  items.all.push(item);
			  return true;
			} else {
			  // It's already in the data controller, so we won't re-add it.
			  return false;
			}
		},


		getItemsFromDataStore: function() {
	    // Get all items from the local data store.
	    //  We're using store.all because store.each returns async, and the
	    //  method will return before we've pulled all the items out.  Then
	    //  there is a strong likelihood of getItemsFromServer stomping on
	    //  local items.
	    store.all(function(arr) {
	      arr.forEach(function(entry) {
	        var item = new Item();
	        angular.extend(item, entry);
	        items.addItem(item);
	      });

	      console.log("Entries loaded from local data store:", arr.length);

	      //$scope.allItems = $scope.items;

	      // Load items from the server after we've loaded everything from the local
	      // data store.
	      items.getItemsFromServer();

	      //$scope.clearFilter(); // Show all items by default.
	    });
	  },


	  getItemsFromServer: function() {
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
	      items.all = [];

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
	        if (items.addItem(tempItem)) {
	          store.save(item);
	        }
	      });

	      items.filtered = items.all;

	      console.log('Entries loaded from server:', items.all.length);
	    };


	    $http.jsonp(feedURL + '&callback=JSON_CALLBACK').success(successCallback);
	    //$http.get(feedURL).success(successCallback).error(errorCallback);
	  },


	  prev: function() {
	  	if (items.hasPrev()) {
	  		items.selectItem(items.selected ? items.selectedIdx - 1 : 0);
	  	}
	  },


	  next: function() {
	  	if (items.hasNext()) {
	  		items.selectItem(items.selected ? items.selectedIdx + 1 : 0);
	  	}
	  },


	  hasPrev: function() {
	    if (!items.selected) {
	      return true;
	    }
	    return items.selectedIdx > 0;
	  },


	  hasNext: function() {
	    if (!items.selected) {
	      return true;
	    }
	    return items.selectedIdx < items.filtered.length - 1;
	  },


	  selectItem: function(idx) {
	    // Unselect previous selection.
	    if (items.selected) {
	      items.selected.selected = false;
	    }

    	items.selected = items.filtered[idx];
    	items.selectedIdx = idx;
    	items.selected.selected = true;

	    items.toggleRead(true);
	  },


	  toggleRead: function(opt_read) {
	    var read = opt_read || !items.selected.read;
	    var item = items.selected;

	    item.read = read;
	    store.toggleRead(item.item_id, read);
	  },


	  toggleStar: function(opt_star) {
	    var star = opt_star || !items.selected.starred;
	    var item = items.selected;

	    item.starred = star;
	    store.toggleStar(item.item_id, star);
	  },


	  markAllRead: function() {
	  	items.filtered.forEach(function(item) {
	      item.read = true;
	      store.toggleRead(item.item_id, true);
	    });
	  },


	  filterBy: function(key, value) {
	    items.filtered = filter(items.all, function(item) {
	      return item[key] === value;
	    });
	    items.reindexSelectedItem();
	  },


	  clearFilter: function() {
	  	items.filtered = items.all;
	  	items.reindexSelectedItem();
	  },


	  reindexSelectedItem: function() {
	  	if (items.selected) {
	  		var idx = items.filtered.indexOf(items.selected);

	  		if (idx === -1) {
	  			items.selected.selected = false;
	  			items.selected = null;
	  			items.selectedIdx = null;
	  		} else {
	  			items.selectedIdx = idx;
	  		}
	  	}
	  }
	};

	items.getItemsFromDataStore();
	return items;
}]);


services.value('scroll', {
	pageDown: function() {
		var itemHeight = $('.entry.active').height() + 60;
	  var winHeight = $(window).height();
	  var curScroll = $('.entries').scrollTop();
	  var scroll = curScroll + winHeight;

	  if (scroll < itemHeight) {
	  	$('.entries').scrollTop(scroll);
	  	return true;
	  }

	  // already at the bottom
	  return false;
	},

	toCurrent: function() {
		// Need the setTimeout to prevent race condition with item being selected.
		window.setTimeout(function() {
      var curScrollPos = $('.summaries').scrollTop();
      var itemTop = $('.summary.active').offset().top - 60;
      $('.summaries').animate({'scrollTop': curScrollPos + itemTop}, 200);
    }, 0);
	}
});
