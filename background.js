var numWS = 0;
var numWSSent = 0;
var numWSReceived = 0;
var numBlockableWS = 0;

function updatePopup(){
  chrome.runtime.sendMessage({
    type: "POPUP_UPDATE",
    numWS: numWS,
    numWSSent: numWSSent,
    numWSReceived: numWSReceived,
    numBlockableWS: numBlockableWS
  });
}

function filterURL(wsURL){
    var filterList = chrome.runtime.getURL('assets/filters/yoyo.txt');
    console.log("filterList: " + filterList);

    // Need to synchronosly load filter list nto a string
    const fetchFilterString = async() => {
      filterListString = await fetch(filterList)
                            .then(response => response.text());

      console.log(filterListString);

      // Using indexOf to see if hostname present
      // TODO: implement more efficient method
      if(filterListString.indexOf(wsURL.hostname) > -1){
        console.log("Found url in filter list");
        numBlockableWS++;
      }
      else if(filterListString.indexOf(wsURL.hostname) === -1){
        console.log("Url not present in filter list");
      }
    }
    fetchFilterString();
}

function checkFirstPartyURL(url, callback){
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

      callback(wsURL);
    });
}

chrome.runtime.onMessage.addListener(
  function(message, sender, sendResponse){
    // Checks if one of our messages.
    if(message.type){
      switch(message.type){
        case "NEW_WS":
          if(numWS === 0){
            // Alter UI Badge
            chrome.browserAction.setBadgeText({text: '!'});
            chrome.browserAction.setBadgeBackgroundColor({color: '#2aa4ff'});
          }
          numWS++;
          console.log("New WS opened.");
          checkFirstPartyURL(message.url, filterURL);
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
  }
);
