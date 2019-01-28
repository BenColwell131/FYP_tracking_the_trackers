// Injects webSocketPatch into actual page inside a script tag.
// This gets around content script acting as an "isolated world"
var script = document.createElement('script');
script.src = chrome.extension.getURL('webSocketPatch.js');
script.onload = function() {
  this.remove;
};
(document.head || document.documentElement).appendChild(script);

// Pass on any messages from page to background.js
window.addEventListener("message", function(event) {
  if(event.type)
  console.log("Content script has recieved a message: " + event.data.text);

  chrome.runtime.sendMessage(event.data);
});
