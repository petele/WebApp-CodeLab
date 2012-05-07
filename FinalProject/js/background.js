var exp = chrome.experimental;

exp.app.onLaunched.addListener(function() {
  var opts = {
    url: '../index.html',
    width: 900,
    height: 700,
    left: 100,
    top: 100,
    type: 'shell'
  };
  chrome.windows.create(opts, function(tab) {
    //var targetId = tab.id;
  });
});

exp.runtime.onInstalled.addListener(function() {
  console.log('installed');
});


// Not firing yet.
exp.runtime.onBackgroundPageUnloadingSoon.addListener(function() {
  console.log('onBackgroundPageUnloadingSoon');
});
