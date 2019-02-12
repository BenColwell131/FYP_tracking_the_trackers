import "../css/popup.css";

let numWS = document.getElementById('numWS');
let numWSSent = document.getElementById('numWSSent');
let numWSReceived = document.getElementById('numWSReceived');
let numBlockableWS = document.getElementById('numBlockableWS');

chrome.runtime.sendMessage({
    type: "UPDATE_POPUP"
});

// Connect to background.js so that popup close can be detected.
let port = chrome.runtime.connect();

chrome.runtime.onMessage.addListener(
  function(message, sender, sendResponse){
    if(message.type === "POPUP_UPDATE"){
      numWS.innerHTML = message.numWS;
      numWSSent.innerHTML = message.numWSSent;
      numWSReceived.innerHTML = message.numWSReceived;
      numBlockableWS.innerHTML = message.numBlockableWS;
    }
  }
);
