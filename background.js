var numWS = 0;


chrome.runtime.onMessage.addListener(
  function(message, sender, sendResponse){
      console.log("background.js has received a message:");
      if(message.type === "NEW_WS"){
        numWS++;
        console.log("New WS opened.");
      }
  }
);
