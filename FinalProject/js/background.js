var exp = chrome.experimental;

exp.app.onLaunched.addListener(function() {
  chrome.appWindow.create('../index.html', {
    width: 900,
    height: 700,
    left: 100,
    top: 100,
    type: 'shell'
  }, function(win) {
    // win is DOMWindow.
  });
});
