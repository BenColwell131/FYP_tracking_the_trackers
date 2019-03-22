// Imports
const ABPFilterParser = require('abp-filter-parser');
const psl = require('psl');

// *** Global variables *** //
  //Popup variables
  let numWS = 0;
  let numWSSent = 0;
  let numWSReceived = 0;
  let numBlockableWS = 0;
  let popupOpen = false;

  //Filtering variables
  let parsedFilterList = {};

  // User setting
  //TODO: Temporarily just globals
  const IGNORE_SUBDOMAINS = true;
  const FILTER_FIRST_PARTY = true;
  const CLOSE_SOCKETS_POLITELY = true;

// ********************** Handling popup **************************************
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

// ****************************************************************************

// ********************** Post-processing urls ********************************
function fetchFilterLists(){
  console.time("Fetching lists & parsing");
  let easyprivacyURL = chrome.runtime.getURL('assets/filters/easyprivacy.txt');
  const fetch1 = fetch(easyprivacyURL).then(response => response.text());

  let easylistURL = chrome.runtime.getURL('assets/filters/easylist.txt');
  const fetch2 = fetch(easylistURL).then(response => response.text());

  let customListURL = chrome.runtime.getURL('assets/filters/customList.txt');
  const fetch3 = fetch(customListURL).then(response => response.text());

  Promise.all([fetch1, fetch2, fetch3])
    .then(filterLists => {
      //Add each list to the parsed list
      // console.log("Parsed: ");
      // console.log(parsedFilterList);
      filterLists.forEach(filterList => {
        ABPFilterParser.parse(filterList, parsedFilterList);
        debugger;
      });
      console.timeEnd("Fetching lists & parsing");
    })
    .catch(err => console.log(err));

  let customListURL = chrome.runtime.getURL('assets/filters/customList.txt');
  const fetch3 = fetch(customListURL).then(response => response.text()).then(res => ABPFilterParser.parse(res, parsedFilterList));
}
// Call this right away
fetchFilterLists();

// Returns true if the WS is a first party one.
// Ignores subdomains by default.
function checkFirstParty(wsURLString, siteURLString){
      console.log("Checking WS url: " + wsURLString);

      // Convert to URL object and pull out hostname
      // This removes all scheme, paths, & parameters/queries
      // e.g: https://www.google.com/search?q=google => www.google.com
      // N.B: This retains any subdomains
      let siteURL = new URL(siteURLString);
      let wsURL   = new URL(wsURLString);
      siteURL = siteURL.hostname;
      wsURL   = wsURL.hostname;

      if(IGNORE_SUBDOMAINS){
        // Using psl to remove any subdomains
        // e.g: www.google.com   => google.com
        //      a.b.c.google.com => google.com
        const parsedSiteURL = psl.parse(siteURL);
        const parsedWSURL   = psl.parse(wsURL);
        siteURL = parsedSiteURL.domain;
        wsURL   = parsedWSURL.domain;
      }

      if(siteURL != wsURL){
        // WS is third party:
        console.log(wsURL + ": Third party WS connection. Caution.");
        return false;
      }
      else{
        // WS is first party
        console.log(wsURL + ": First party WS connection. Safe to proceed.");
        return true;
      }
}

// Returns true if the WS hit our filter lists.
function filterWSURL(wsURL){
      // Check Websocket URL against our lists.
      debugger;
      if (ABPFilterParser.matches(parsedFilterList, wsURL
        // { domain: //TODO
        // elementTypeMask: ABPFilterParser.elementTypes.SCRIPT}
      )) {
        console.log("Matched URL to list. You should block this URL!");
        console.log(wsURL);
        return true;
      }
      else {
        console.log("Didn't match URL to list. Safe to proceed.");
        console.log(wsURL);
        return false;
      }
}

function closeWS(wsURLString){
    let method;
    if(CLOSE_SOCKETS_POLITELY){
      method = "polite";
    }else{
      method = "standard";
    }

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {type: "CLOSE_WS", wsURL: wsURLString, method: method});
    });
}

function postProcessWS(wsURLString, siteURLString){
  const firstParty = checkFirstParty(wsURLString, siteURLString);

  if(!firstParty || FILTER_FIRST_PARTY){
    console.log("Should be filtered");
    const hitFilterLists = filterWSURL(wsURLString);
    if(hitFilterLists){
      chrome.browserAction.setBadgeBackgroundColor({color: '#F60000'});
      closeWS(wsURLString);
      return;
    }
  }
}
// ****************************************************************************



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
          console.log("Tab url: " + message.tabURL);
          console.log("WS url: " + message.url);
          postProcessWS(message.url, message.tabURL);
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
          console.log("WS Closed: " + message.wsURL);
          break;

        case "UPDATE_POPUP":
          updatePopup();
          break;

        default:
          // console.log("Uncaught message type in background: " + message);
      }
      if(popupOpen){
        updatePopup();
      }
    }
  }
);
