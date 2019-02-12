// Imports
let ABPFilterParser = require('abp-filter-parser');

// Global variables
let numWS = 0;
let numWSSent = 0;
let numWSReceived = 0;
let numBlockableWS = 0;

let parsedFilterList = {};

function updatePopup(){
  chrome.runtime.sendMessage({
    type: "POPUP_UPDATE",
    numWS: numWS,
    numWSSent: numWSSent,
    numWSReceived: numWSReceived,
    numBlockableWS: numBlockableWS
  });
}

function fetchFilterLists(){
  console.time("Fetching lists & parsing");
  let easyprivacyURL = chrome.runtime.getURL('assets/filters/easyprivacy.txt');
  const fetch1 = fetch(easyprivacyURL).then(response => response.text());

  let easylistURL = chrome.runtime.getURL('assets/filters/easylist.txt');
  const fetch2 = fetch(easylistURL).then(response => response.text());

  Promise.all([fetch1, fetch2])
    .then(filterLists => {
      //Add each list to the parsed list
      filterLists.forEach(filterList => {
        ABPFilterParser.parse(filterList, parsedFilterList);
      });
      console.timeEnd("Fetching lists & parsing");
    })
    .catch(err => console.log(err));
}
//TODO: not sure when this should be called.
fetchFilterLists();

function filterURL(wsURL){
      // Check Websocket URL against our lists.
      let wsURLString = wsURL.toString();
      console.time("Filter matching");
      if (ABPFilterParser.matches(parsedFilterList, wsURLString, {
        // domain: //TODO
        elementTypeMask: ABPFilterParser.elementTypes.SCRIPT
      })) {
        console.log("Matched URL to list. You should block this URL!");
      }
      else {
        console.log("Didn't match URL to list. Safe to proceed.");
      }
      console.timeEnd("Filter matching");
}

function checkFirstPartyURL(wsURL){
    return new Promise((resolve, reject) => {
      console.log("Checking WS url: " + wsURL);

      //Fetch tab url
      let tabURL;
      chrome.tabs.query({'active': true, 'currentWindow': true}, function(tabs){
        tabURL = tabs[0].url;
        // Convert to URL object for easy parsing.
        tabURL = new URL(tabURL);

        console.log("wsURL.hostname: " + wsURL.hostname);
        console.log("tabURL.hostname: " + tabURL.hostname);
        if(wsURL.hostname != tabURL.hostname){
          console.log("Third Party WS Connection. Caution!");
        }
        else if (wsURL.hostname === tabURL.hostname){
          console.log("First Party WS Connection. Safe to proceed.");
        }

        resolve('End of tabs.query');
      });
    });
}

chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {
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

          // Convert to URL object for easy parsing.
          let wsURL = new URL(message.url);
          checkFirstPartyURL(wsURL)
            .then(filterURL(wsURL));

          break;

        case "WS_FRAME_SENT":
          numWSSent++;
          // console.log("WS frame sent. #" + numWSSent);
          break;

        case "WS_FRAME_RECIEVED":
          numWSReceived++;
          // console.log("WS frame received. #" + numWSReceived);
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
