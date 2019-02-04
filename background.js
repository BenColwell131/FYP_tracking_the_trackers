var numWS = 0;
var numWSSent = 0;
var numWSReceived = 0;

function updatePopup(){
  chrome.runtime.sendMessage({
    type: "POPUP_UPDATE",
    numWS: numWS,
    numWSSent: numWSSent,
    numWSReceived: numWSReceived
  });
}

function checkFirstPartyURL(url){
    console.log("Checking WS url: " + url);
    // Convert to URL object for easy parsing.
    var wsURL = new URL(url);

    //Fetch tab url
    var tabURL;
    chrome.tabs.query({'active': true, 'currentWindow': true}, function(tabs){
      tabURL = tabs[0].url;
      console.log("Tab url: " + tabURL);
      // Convert to URL object for easy parsing.
      var pageURL = new URL(tabURL);

      console.log("wsURL.hostname: " + wsURL.hostname);
      console.log("pageURL.hostname: " + pageURL.hostname);
      if(wsURL.hostname != pageURL.hostname){
        console.log("Third Party WS Connection. Caution!");
      }
      else if (wsURL.hostname === pageURL.hostname){
        console.log("First Party WS Connection. Safe to proceed.");
      }
    });
}

chrome.runtime.onMessage.addListener(
  function(message, sender, sendResponse){
      switch(message.type){
        case "NEW_WS":
          if(numWS === 0){
            // Alter UI Badge
            chrome.browserAction.setBadgeText({text: '!'});
            chrome.browserAction.setBadgeBackgroundColor({color: '#2aa4ff'});
          }
          numWS++;
          console.log("New WS opened.");
          checkFirstPartyURL(message.url);
          break;

        case "WS_FRAME_SENT":
          numWSSent++;
          console.log("WS frame sent. #" + numWSSent);
          break;

        case "WS_FRAME_RECIEVED":
          numWSReceived++;
          console.log("WS frame received. #" + numWSReceived);
          break;

        case "WS_CLOSED":
          if(numWS === 1){
            // Alter UI Badge
            chrome.browserAction.setBadgeText({text: ''});
          }
          numWS--;
          console.log("WS Closed.");
          break;

        case "UPDATE_POPUP":
          // Done by default in all cases so nothing to do here.
          break;

        default:
          console.log("Uncaught message type in background: " + message);
      }
      updatePopup();
  }
);
