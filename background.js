var numWS = 5;
var numWSReceived = 0;
var numWSSent = 0;

chrome.storage.sync.set({'numWS': numWS});
chrome.storage.sync.set({'numWSSent': numWSSent});
chrome.storage.sync.set({'numWSReceived': numWSReceived});



chrome.runtime.onMessage.addListener(
  function(message, sender, sendResponse){
      //console.log("background.js has received a message:");
      if(message.type === "NEW_WS"){
        if(numWS === 0){
          // Alter UI Badge
        }
        numWS++;
        console.log("New WS opened.");
        chrome.storage.sync.set({'numWS': numWS});
      }
      else if (message.type === "WS_FRAME_SENT") {
        numWSSent++;
        console.log("WS frame sent. #" + numWSSent);
        chrome.storage.sync.set({'numWSSent': numWSSent});
      }
      else if (message.type === "WS_FRAME_RECIEVED") {
        numWSReceived++;
        console.log("WS frame received. #" + numWSReceived);
        chrome.storage.sync.set({'numWSReceived': numWSReceived});
      }
      else if (message.type === "WS_CLOSED") {
        if(numWS === 1){
          // Alter UI Badge
        }
        numWS--;
        console.log("WS Closed.");
        chrome.storage.sync.set({'numWS': numWS});
      }
      else{
        //console.log("Other message");
      }
  }
);
