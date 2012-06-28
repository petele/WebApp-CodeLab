var storeModule = angular.module('wReader.store', []);

storeModule.factory('feedStore', function($q, $rootScope) {
  var stateStorage = chrome.storage.sync,
      contentStorage = chrome.storage.local,
      keepInSyncOn = false,
      syncInProgress = false;


  function getFeedsFrom(storage) {
    var deferred = $q.defer();

    storage.get('feeds', function(obj) {
      deferred.resolve(obj.feeds || {});
      if (!$rootScope.$$phase) $rootScope.$apply(); //flush evalAsyncQueue
    });

    return deferred.promise;
  }


  function syncStorages(feedContents, feedStates) {
    var deferred = $q.defer(),
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

    contentStorage.set({feeds: feedContents}, function() {
      console.log('synced content(local) and states (sync) storages');
      deferred.resolve();
      if (!$rootScope.$$phase) $rootScope.$apply();
    });

    return deferred.promise;
  }


  return {
    updateFeed: function(updatedFeed) {
      var deferred = $q.defer();

      getFeedsFrom(contentStorage).then(function(feeds) {
        var feed = feeds[updatedFeed.url] || (feeds[updatedFeed.url] = {url: updatedFeed.url, entries: {}});

        feed.title = updatedFeed.title;
        angular.forEach(updatedFeed.entries, function(entry, entryId) {
          if (feed.entries[entryId]) {
            entry.read = feed.entries[entryId].read;
            entry.starred = feed.entries[entryId].starred;
          }
          feed.entries[entryId] = entry;
        });


        getFeedsFrom(stateStorage).then(function(feedStates) {
          syncStorages(feeds, feedStates).then(function(feeds) {
            deferred.resolve(feeds);
            if (!$rootScope.$$phase) $rootScope.$apply();
          });
        });
      });

      return deferred.promise;
    },


    updateEntryProp: function(feedUrl, entryId, propName, propValue) {
      getFeedsFrom(contentStorage).then(function(feeds) {
        feeds[feedUrl].entries[entryId][propName] = propValue;
        contentStorage.set({feeds: feeds});
      });
      getFeedsFrom(stateStorage).then(function(feeds) {
        if (!feeds[feedUrl]) feeds[feedUrl] = {entries:{}};
        if (!feeds[feedUrl].entries[entryId]) feeds[feedUrl].entries[entryId] = {};
        feeds[feedUrl].entries[entryId][propName] = propValue;
        stateStorage.set({feeds: feeds}, function() {
          console.log('updated sync storage with', feeds);
        });
      });
    },


    getAll: function() {
      return getFeedsFrom(contentStorage);
    },


    sync: function() {
      if (!syncInProgress) {
        syncInProgress = true;

        return $q.all([getFeedsFrom(contentStorage), getFeedsFrom(stateStorage)]).then(function(results) {

          syncStorages(results[0], results[1]).then(function() {
            syncInProgress = false;
          });

        }, function() {
          syncInProgress = false;
        });
      }
    },


    keepInSync: function() {
      if (keepInSyncOn) return;

      keepInSyncOn = false;

      chrome.storage.onChanged.addListener(function(diff, namespace) {
        if (namespace != 'sync') return;

        console.log('sync storage changed, syncing changes', diff);

        getFeedsFrom(contentStorage).then(function(feedContents) {
          angular.forEach(diff.feeds.newValue, function(feed, feedUrl) {
            angular.forEach(feed.entries, function(entryDiff, entryId) {
              var entry;

              if (feedContents[feedUrl] && (entry = feedContents[feedUrl].entries[entryId])) {
                angular.forEach(entryDiff, function(propVal, propName) {
                  entry[propName] = propVal;
                });
              }
            });
          });
          contentStorage.set({feeds: feedContents});
        });
      });
    }
  }
});
