var storeModule = angular.module('wReader.store', []);


storeModule.factory('stateStore', function($q) {
  var syncStorage = chrome.storage.sync;

  function setEntryProp(entryUrl, propName, propValue) {
    syncStorage.get(entryUrl, function(storageObj) {
      if (!storageObj[entryUrl]) storageObj[entryUrl] = {};
      storageObj[entryUrl][propName] = propValue;
      syncStorage.set(storageObj);
    });
  }

  return {
    addFeed: function(feedUrl) {
      var deferred = $q.defer();

      syncStorage.get('feeds', function(storageObj) {
        storageObj.feeds.push(feedUrl);
        syncStorage.set(storageObj);
        deferred.resolve();
      });

      return deferred.promise;
    },

    setRead: function(entryUrl, read) {
      setEntryProp(entryUrl, 'read', read);
    },

    setStarred: function(entryUrl, read) {
      setEntryProp(entryUrl, 'starred', read);
    }
  }
});


storeModule.factory('contentStore', function() {


});


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
      console.log('updating sync storage with', feeds);
      stateStorage.set({feeds: feeds});
    });
  }


  chrome.storage.onChanged.addListener(function(diff, namespace) {
    if (namespace != 'sync') return;

    console.log('sync storage changed', diff);

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
      if (!syncing) {
        syncing = true;

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
          contentStorage.set({feeds: feedContents}, function() {
            syncing = false;
          });
        });
      }
    }
  }
});
