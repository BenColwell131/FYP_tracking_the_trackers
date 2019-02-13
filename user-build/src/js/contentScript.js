// Injects webSocketPatch into actual page inside a script tag.
// This lets it access the page's window object.
var script = document.createElement('script');
script.src = chrome.runtime.getURL('webSocketPatch.bundle.js');
(document.head || document.documentElement).appendChild(script);
script.onload = function() {
  this.remove;
};

// Pass on any messages from page to background.js
window.addEventListener("message", function(event) {
    // console.log("Content script has recieved a message: " + JSON.stringify(event.data));
    // console.log("Message type: " + event.data.type);
    chrome.runtime.sendMessage(event.data);
});
