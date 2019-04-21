import "../css/popup.css";

// Load title image
var imgURL = chrome.extension.getURL("assets/images/title-logo.svg");
document.getElementById("title").src = imgURL;

let numWSOpened = document.getElementById('numWSOpened');
// let numWS = document.getElementById('numWS');
let numFPWS = document.getElementById('numFPWS');
let numTPWS = document.getElementById('numTPWS');
let numWSSent = document.getElementById('numWSSent');
let numWSReceived = document.getElementById('numWSReceived');
let numBlockedWS = document.getElementById('numBlockedWS');

chrome.runtime.sendMessage({
    type: "UPDATE_POPUP"
});

// Connect to background.js so that popup close can be detected.
let port = chrome.runtime.connect();

chrome.runtime.onMessage.addListener(
  function(message, sender, sendResponse){
    if(message.type === "POPUP_UPDATE"){
      numWSOpened.innerHTML = message.numWSOpened;
      // numWS.innerHTML = message.numWS;
      numFPWS.innerHTML = message.numFPWS;
      numTPWS.innerHTML = message.numTPWS;
      numWSSent.innerHTML = message.numWSSent;
      numWSReceived.innerHTML = message.numWSReceived;
      numBlockedWS.innerHTML = message.numBlockedWS;
    }
  }
);
