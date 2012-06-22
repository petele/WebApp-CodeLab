window.addEventListener('message', function(event) {
  document.body.innerHTML = event.data;
}, false);