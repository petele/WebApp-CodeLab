chrome.app.runtime.onLaunched.addListener(function(launchData) {
  chrome.app.window.create('../index.html', {
    width: 900,
    height: 700,
    left: 100,
    top: 100
  }, function(win) {
    // win is DOMWindow.
  });
});
