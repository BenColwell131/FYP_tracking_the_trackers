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
    chrome.runtime.sendMessage(event.data);
});

// Listen for messages from background.js
chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {
    if(message.type === "CLOSE_WS" || message.type === "ALLOW_WS" || message.type === "BLOCK_WS"){
      window.postMessage(message, "*");
    }
  }
);
