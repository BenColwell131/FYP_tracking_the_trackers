let numWS = document.getElementById('numWS');
let numWSSent = document.getElementById('numWSSent');
let numWSReceived = document.getElementById('numWSReceived');

chrome.runtime.sendMessage({
    type: "UPDATE_POPUP"
});

chrome.runtime.onMessage.addListener(
  function(message, sender, sendResponse){
    if(message.type === "POPUP_UPDATE"){
      numWS.innerHTML = message.numWS;
      numWSSent.innerHTML = message.numWSSent;
      numWSReceived.innerHTML = message.numWSReceived;
    }
    else{
      console.log("Uncaught message type in popup: " + message.type);
    }
  }
);
