// Imports
let ABPFilterParser = require('abp-filter-parser');

// *** Global variables *** //
  //Popup variables
  let numWS = 0;
  let numWSSent = 0;
  let numWSReceived = 0;
  let numBlockableWS = 0;
  let popupOpen = false;

  //Filtering variables
  let parsedFilterList = {};

  //Log variables
  let log = {
    "country" : "Russia",
    "totalNumSitesVisited": 0,
    "totalWSConnections" : 0,
    "totalFramesSent" : 0,
    "totalFramesReceieved" : 0,
    "details" : {}
  };
  let logStoreURL = "https://api.jsonbin.io/b/5c76af4dc1a6cc3f8968ccd2";
  let jsonbinSecret = "$2a$10$dRvEOWuD9KwUlBLj28nQQuIgbJAc9hwF.m7YbxXrjdgIFJ0apQdLW";

/* Testing functions
function updatePopup(){
  chrome.runtime.sendMessage({
    type: "POPUP_UPDATE",
    numWS: numWS,
    numWSSent: numWSSent,
    numWSReceived: numWSReceived,
    numBlockableWS: numBlockableWS
  });
}

// Detecting popup open/close
chrome.runtime.onConnect.addListener( (port) => {
  port.onDisconnect.addListener( () => {
    console.log("Popup closed.");
    popupOpen = false;
  });
  console.log("Popup opened and connected.");
  popupOpen = true;
})

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
*/

function updateLog(type, data){
  switch(type){
    case "NEW_SITE":
      console.log("New site: ", data.url);
      log.totalNumSitesVisited++;
      log.details[data.url] = {
        "title" : data.title,
        "numberWS" : 0,
        "WSConnections" : {}
      };
      break;

    case "NEW_WS":
      log.totalWSConnections++;
      log.details[data.tabURL].numberWS++;
      log.details[data.tabURL].WSConnections[data.url] = {
          "numFramesSent" : 0,
          "numFramesReceived" : 0,
          "framesSent" : [],
          "framesReceived" : []
      };
      break;

    case "WS_FRAME_SENT":
      log.totalFramesSent++;
      let id = log.details[data.tabURL].WSConnections[data.webSocketURL].numFramesSent++;
      log.details[data.tabURL].WSConnections[data.webSocketURL].framesSent[id] = {
        "payload" : data.payload
      };
      break;

    case "WS_FRAME_RECIEVED":
      log.totalFramesReceieved++;
      let id2 = log.details[data.tabURL].WSConnections[data.webSocketURL].numFramesReceived++;
      log.details[data.tabURL].WSConnections[data.webSocketURL].framesReceived[id2] = {
        "payload" : data.payload,
        "origin" : data.origin
      };
      break;

  }

  if(log.totalNumSitesVisited >= 90){ //Only send towards the end of list  (@90 in case of a few failed visits)
    // console.log(log);
    window.sendToPuppeteer(JSON.stringify(log));
  }
}

//Detect page changes
chrome.tabs.onUpdated.addListener(
  (tabId, changeInfo, tab) => {
    //No use for tabId or changeInfo
    // if(tab.status === "complete"){
      if(!log.details[tab.url]){
        updateLog("NEW_SITE", {url: tab.url, title: tab.title});
      }
    // }
  }
);


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

          // console.log("New WS opened.");
          // console.log("tabURL: ", message.tabURL);
          updateLog("NEW_WS", {url: message.url,
                               tabURL: message.tabURL});
          break;

        case "WS_FRAME_SENT":
          numWSSent++;
          // console.log("Frame sent");
          // console.log("tabURL: ", message.tabURL);
          // console.log(message.data);
          updateLog("WS_FRAME_SENT", {payload: message.payload,
                                      webSocketURL: message.webSocketURL,
                                      tabURL: message.tabURL});
          break;

        case "WS_FRAME_RECIEVED":
          numWSReceived++;
          // console.log("Frame Recieved");
          // console.log("tabURL: ", message.tabURL);
          // console.log(message.data);
          updateLog("WS_FRAME_RECIEVED", {payload: message.payload,
                                          webSocketURL: message.webSocketURL,
                                          origin: message.origin,
                                          tabURL: message.tabURL});
          break;

        case "WS_CLOSED":
          if(numWS === 1){
            // Alter UI Badge
            chrome.browserAction.setBadgeText({text: ''});
          }
          numWS--;
          // console.log("WS Closed.");
          break;

        case "UPDATE_POPUP":
          // No need in logging version
          break;

        default:
          // console.log("Uncaught message type in background: " + message);
      }
      // if(popupOpen){
      //   updatePopup();
      // }
    }
  }
);
