// Injects webSocketPatch into actual page inside a script tag.
// This lets it access the page's window object.

var script = document.createElement('script');
script.src = chrome.extension.getURL('webSocketPatch.js');
script.onload = function() {
  this.remove;
};
(document.head || document.documentElement).appendChild(script);

// Pass on any messages from page to background.js
window.addEventListener("message", function(event) {
    // console.log("Content script has recieved a message: " + JSON.stringify(event.data));
    console.log("Message type: " + event.data.type);


    // As contentScript does not have access to the chrome.tabs API checks must be done in background.js.

    chrome.runtime.sendMessage(event.data);
});
