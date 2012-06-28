var services = angular.module('wReader.services', []);

function Item(entry, pub_name, feed_link) {
  this.read = false;
  this.starred = false;
  this.selected = false;
}


services.factory('items', ['$http', 'feedStore', function($http, feedStore) {
  var items = {
    all: [],
    filtered: [],
    selected: null,
    selectedIdx: null,
    readCount: 0,
    starredCount: 0,


    getItemsFromDataStore: function() {
      feedStore.getAll().then(function(feeds) {
        var i = 0;

        items.all = [];

        angular.forEach(feeds, function(feed) {
          angular.forEach(feed.entries, function(entry) {
            var item = new Item();

            angular.extend(item, {
              read: entry.read,
              starred: entry.starred,
              title: entry.title,
              item_id: entry.id,
              pub_name: feed.title,
              pub_author: entry.author,
              pub_date: entry.date,
              item_link: entry.url,
              feed_link: feed.url,
              content: entry.content,
              $$hashKey: function() {
                return this.id;
              }
            });

            items.all.push(item);
            i++;
          });
          console.log("Entries loaded from local data store:", i);

          items.all.sort(function(entryA, entryB) {
            return new Date(entryB.pub_date).getTime() - new Date(entryA.pub_date).getTime();
          });

          items.filtered = items.all;
          items.readCount = items.all.reduce(function(count, item) { return item.read ? ++count : count; }, 0);
          items.starredCount = items.all.reduce(function(count, item) { return item.starred ? ++count : count; }, 0);
          items.selected = items.selected
              ? items.all.filter(function(item) { return item.item_id == items.selected.item_id; })[0]
              : null;
          items.reindexSelectedItem();
        });
      });
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

      if (!items.selected.read) items.toggleRead();
    },


    toggleRead: function() {
      var item = items.selected,
          read = !item.read;

      item.read = read;
      feedStore.updateEntryProp(item.feed_link, item.item_id, 'read', read);
      items.readCount += read ? 1 : -1;
    },


    toggleStarred: function() {
      var item = items.selected,
          starred = !item.starred;

      item.starred = starred;
      feedStore.updateEntryProp(item.feed_link, item.item_id, 'starred', starred);
      items.starredCount += starred ? 1 : -1;
    },


    markAllRead: function() {
      items.filtered.forEach(function(item) {
        item.read = true;
        feedStore.updateEntryProp(item.feed_link, item.item_id, 'read', true);
      });
      items.readCount -= items.filtered.length;
    },


    filterBy: function(key, value) {
      items.filtered = items.all.filter(function(item) {
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
          if (items.selected) items.selected.selected = false;

          items.selected = null;
          items.selectedIdx = null;
        } else {
          items.selectedIdx = idx;
          items.selected.selected = true;
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
      $('.entries article.active')[0].scrollIntoView();
    }, 0);
  }
});


services.factory('bgPage', function() {
  return {
    refreshFeeds: function() {
      chrome.extension.sendMessage('refreshFeeds');
    }
  };
});
