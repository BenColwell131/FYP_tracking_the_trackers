// Imports
const ABPFilterParser = require('abp-filter-parser');
const psl = require('psl');

// *** Global variables *** //
  //Popup variables
  let numWS = 0;
  let numWSOpened = 0;
  let numFPWS = 0;
  let numTPWS = 0;
  let numWSSent = 0;
  let numWSReceived = 0;
  let numBlockedWS = 0;
  let popupOpen = false;

  //Filtering variables
  let parsedFilterList = {};

  // Settings
  let IGNORE_SUBDOMAINS = true;
  let FILTER_FIRST_PARTY = false;
  let ALLOW_WS_BY_DEFAULT = true;
  let CLOSE_SOCKETS = true;
  let CLOSE_SOCKETS_POLITELY = true;
  let BLOCK_SOCKETS_POLITELY = true;


// ********************** Handling popup **************************************
function updatePopup(){
  chrome.runtime.sendMessage({
    type: "POPUP_UPDATE",
    numWS: numWS,
    numWSOpened: numWSOpened,
    numFPWS: numFPWS,
    numTPWS: numTPWS,
    numWSSent: numWSSent,
    numWSReceived: numWSReceived,
    numBlockedWS: numBlockedWS
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

// ********************** Handling options ************************************
//Initialise storage on extension reload.
chrome.storage.sync.set({ignoreSubdomains: IGNORE_SUBDOMAINS,
                         filterFirstParty: FILTER_FIRST_PARTY,
                         closeSockets: CLOSE_SOCKETS,
                         closeSocketsPolitely: CLOSE_SOCKETS_POLITELY}, () => {
                           console.log("Updated settings in storage.");
                         });

//Listen for option changes.
chrome.storage.onChanged.addListener((changes, area) => {
  if(area === "sync"){
    console.log("Detected storage change.");
    let changedItems = Object.keys(changes);
    for (let item of changedItems){
      console.log("Detected change: " + item + " : " + changes[item].newValue);
      switch(item){
        case "ignoreSubdomains":
          IGNORE_SUBDOMAINS = changes[item].newValue;
          break;
        case "filterFirstParty":
          FILTER_FIRST_PARTY = changes[item].newValue;
          break;
        case "closeSockets":
          CLOSE_SOCKETS = changes[item].newValue;
          break;
        case "closeSocketsPolitely":
          CLOSE_SOCKETS_POLITELY = changes[item].newValue;
          break;
        default:
          // Do nothing
      }
      console.log("IGNORE_SUBDOMAINS: " + IGNORE_SUBDOMAINS);
      console.log("FILTER_FIRST_PARTY: " + FILTER_FIRST_PARTY);
      console.log("CLOSE_SOCKETS: " + CLOSE_SOCKETS);
      console.log("CLOSE_SOCKETS_POLITELY: " + CLOSE_SOCKETS_POLITELY);

    }
  }
});
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
      filterLists.forEach(filterList => {
        ABPFilterParser.parse(filterList, parsedFilterList);
      });
      console.timeEnd("Fetching lists & parsing");
    })
    .catch(err => console.log(err));

  // let customListURL = chrome.runtime.getURL('assets/filters/customList.txt');
  // const fetch3 = fetch(customListURL).then(response => response.text()).then(res => ABPFilterParser.parse(res, parsedFilterList));
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
        console.log("Third party WS connection. Caution.");
        return false;
      }
      else{
        // WS is first party
        console.log("First party WS connection. Safe to proceed.");
        return true;
      }
}

// Returns true if the WS hit our filter lists.
function filterWSURL(wsURL){
      // Check Websocket URL against our lists.
      if (ABPFilterParser.matches(parsedFilterList, wsURL, {
        // domain: //TODO
        elementTypeMask: ABPFilterParser.elementTypes.SCRIPT}
      )) {
        console.log("Matched URL to list. You should block this URL!\n", wsURL);
        return true;
      }
      else {
        console.log("Didn't match URL to list. Safe to proceed.\n", wsURL);
        return false;
      }
}

// Allow the WS to open.
// Only used if ALLOW_WS_BY_DEFAULT is false.
function allowWS(wsURLString){
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {type: "ALLOW_WS", wsURL: wsURLString});
  });
}

// Block the WS from opening.
// Only used if ALLOW_WS_BY_DEFAULT is false.
function blockWS(wsURLString){
  console.log("Blocking WS: ", wsURLString);
  let method;
  if(BLOCK_SOCKETS_POLITELY){
    method = "polite";
  }else{
    method = "standard";
  }

  chrome.tabs.query({url: siteURLString}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {type: "BLOCK_WS", wsURL: wsURLString, method: method});
  });
}

// Close an open/opening WS.
function closeWS(wsURLString, siteURLString){
  console.log("Closing WS: ", wsURLString);
  let method;
  if(CLOSE_SOCKETS_POLITELY){
    method = "polite";
  }else{
    method = "standard";
  }

  // chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  chrome.tabs.query({url: siteURLString}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {type: "CLOSE_WS", wsURL: wsURLString, method: method});
  });
}

function postProcessWS(wsURLString, siteURLString){
  const firstParty = checkFirstParty(wsURLString, siteURLString);
  firstParty ? numFPWS++ : numTPWS++;
  if(!firstParty || FILTER_FIRST_PARTY){
    console.log("Should be filtered");
    const hitFilterLists = filterWSURL(wsURLString);
    if(hitFilterLists){
      chrome.browserAction.setBadgeBackgroundColor({color: '#F60000'});
      if(!ALLOW_WS_BY_DEFAULT){
        // WS is waiting for either allow or block response before connection.
        blockWS(wsURLString);
        numWS--;  //Num WS counts the connection attempts - so need to decrement even if hasnt actually opened.
      }
      else if(CLOSE_SOCKETS){
        // WS will have been allowed to connect (or start to) so we must close.
        closeWS(wsURLString, siteURLString);
        // TODO: Technically its still 'open'. Not sure if I should decrement
        // if(!CLOSE_SOCKETS_POLITELY) {
        //   numWS--; //Won't detect closure via normal means as close event not fired.
        // }
      }

      numBlockedWS++;
      updatePopup(); // This updates all values that post-processing changes.
      return;
    }
  }
  // Connection is safe from here.
  if (!ALLOW_WS_BY_DEFAULT){
    // WS is waiting for either allow or block response before connection.
    console.log("Sending allow");
    allowWS(wsURLString);
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
            // Only set label to blue if its not already red (ie: WS blocked).
            if(numBlockedWS === 0) chrome.browserAction.setBadgeBackgroundColor({color: '#2aa4ff'});
          }
          numWS++;
          numWSOpened++;
          console.log("New WS opened.");
          postProcessWS(message.url, message.tabURL);
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
            // Alter UI Badge if no WS blocked
            if(numBlockedWS === 0) chrome.browserAction.setBadgeText({text: ''});
          }
          if(message.readyState != 3){
            numWS--;
            console.log("WS Closed: " + message.wsURL);
          }
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
