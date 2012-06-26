var storeModule = angular.module('wReader.store', []);

storeModule.factory('feedStore', function($q, $rootScope) {
  var stateStorage = chrome.storage.sync,
      contentStorage = chrome.storage.local,
      syncing = false;

  function getFeedsFrom(storage) {
    var deferred = $q.defer();

    storage.get('feeds', function(obj) {
      deferred.resolve(obj.feeds || {});
      if (!$rootScope.$$phase) $rootScope.$apply(); //flush evalAsyncQueue
    });

    return deferred.promise;
  }

  function updateEntryProp(feedUrl, entryId, prop, val) {
    getFeedsFrom(contentStorage).then(function(feeds) {
      feeds[feedUrl].entries[entryId][prop] = val;
      contentStorage.set({feeds: feeds});
    });
    getFeedsFrom(stateStorage).then(function(feeds) {
      if (!feeds[feedUrl]) feeds[feedUrl] = {entries:{}};
      if (!feeds[feedUrl].entries[entryId]) feeds[feedUrl].entries[entryId] = {};
      feeds[feedUrl].entries[entryId][prop] = val;
      stateStorage.set({feeds: feeds});
    });
  }

  return {
    updateFeed: function(updatedFeed) {
      var deferred = $q.defer();

      getFeedsFrom(contentStorage).then(function(feeds) {
        var feed = feeds[updatedFeed.url] || (feeds[updatedFeed.url] = {url: updatedFeed.url, entries: {}});

        feed.title = updatedFeed.title;
        angular.forEach(updatedFeed.entries, function(entry, entryId) {
          if (feed.entries[entryId]) {
            entry.read = feed.entries[entryId];
            entry.starred = feed.entries[entryId];
          }
          feed.entries[entryId] = entry;
        });
        console.log('updating feeds', feeds);
        contentStorage.set({feeds: feeds}, function() {
          deferred.resolve(feeds);
          $rootScope.$apply();
        });
      });

      return deferred.promise;
    },


    toggleRead: function(feedUrl, entryId, read) {
      updateEntryProp(feedUrl, entryId, 'read', read);
    },


    toggleStarred: function(feedUrl, entryId, starred) {
      updateEntryProp(feedUrl, entryId, 'starred', starred);
    },


    getAll: function() {
      return getFeedsFrom(contentStorage);
    },


    sync: function() {
      syncing = !syncing;

      if (syncing) {
        $q.all([getFeedsFrom(contentStorage), getFeedsFrom(stateStorage)]).then(function(results) {
          var feedContents = results[0],
              feedStates = results[1],
              feedContent, feedState, feedUrl, entryState;

          for (feedUrl in feedStates) {
            feedContent = feedContents[feedUrl];
            feedState = feedStates[feedUrl];

            if (feedContent) {
              angular.forEach(feedContent.entries, function(entry, entryId) {
                entryState = feedState.entries[entryId];
                if (entryState) {
                  entry.read =  entryState.read || false;
                  entry.starred = entryState.starred || false;
                }
              });
            }
          }

          console.log('feeds state synced');
          contentStorage.set({feeds: feedContents});

          chrome.storage.onChanged.addListener(function(diff, namespace) {
            if (namespace != 'sync') return;

            angular.forEach(diff.feeds.newValue, function(feed) {
              angular.forEach(feed.entries, function(entry, entryId) {
                angular.forEach(entry, function(propDiff, propName) {
                  entry[propName] = propDiff.newValue;
                });
              });
            });

            contentStorage.set(feed);
          });

        });
      }
    }
  }
});