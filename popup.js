let numWS = document.getElementById('numWS');
let wSFramesSent = document.getElementById('wSFramesSent');
let wSFramesRec = document.getElementById('wSFramesRec');

chrome.storage.sync.get(['numWS'], function(result) {
  numWS.innerHTML = result.numWS;
});
chrome.storage.sync.get(['numWSSent'], function(result) {
  wSFramesSent.innerHTML = result.numWSSent;
});
chrome.storage.sync.get(['numWSReceived'], function(result) {
  wSFramesRec.innerHTML = result.numWSReceived;
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
  console.log("got here 2");
  for (key in changes) {
    var storageChange = changes[key];
    switch (key){
      case "numWS":
        numWS.innerHTML = storageChange.newValue;
        break;
      case "numWSSent":
        wSFramesSent.innerHTML = storageChange.newValue;
        break;
      case "numWSReceived":
        wSFramesRec.innerHTML = storageChange.newValue;
        break;
      default:
        break;
    }
  }
});
