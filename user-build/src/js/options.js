import "../css/options.css";

// Load title image
var imgURL = chrome.extension.getURL("assets/images/title.png");
document.getElementById("title").src = imgURL;

// Select input objects
const ignoreSubdomains     = document.querySelector("input[name=ignoreSubdomains]");
const filterFirstParty     = document.querySelector("input[name=filterFirstParty]");
const closeSockets         = document.querySelector("input[name=closeSockets]");
const closeSocketsPolitely = document.querySelectorAll("input[name=closeSocketsPolitely]");

// Initialise input settings from storage
chrome.storage.sync.get(['ignoreSubdomains',
                         'filterFirstParty',
                         'closeSockets',
                         'closeSocketsPolitely'], function(data) {
    ignoreSubdomains.checked = data.ignoreSubdomains || true;  // Or defaults (if no value in storage yets)
    filterFirstParty.checked = data.filterFirstParty || false;
    closeSockets.checked = data.closeSockets || true;
    if(data.closeSocketsPolitely){
      closeSocketsPolitely[0].checked = true;
    }
    else{
      closeSocketsPolitely[1].checked = true; //Will default to this
    }
});

// Update storage values.
ignoreSubdomains.addEventListener( 'change', function() {
    console.log("Update");
    if(this.checked) {
        // Checkbox is checked..
        chrome.storage.sync.set({ignoreSubdomains: true});
    } else {
        // Checkbox is not checked..
        chrome.storage.sync.set({ignoreSubdomains: false});
    }
});

filterFirstParty.addEventListener( 'change', function() {
  console.log("Update");

    if(this.checked) {
        // Checkbox is checked..
        chrome.storage.sync.set({filterFirstParty: true});
    } else {
        // Checkbox is not checked..
        chrome.storage.sync.set({filterFirstParty: false});
    }
});

closeSockets.addEventListener( 'change', function() {
  console.log("Update");

    if(this.checked) {
        // Checkbox is checked..
        chrome.storage.sync.set({closeSockets: true});
    } else {
        // Checkbox is not checked..
        chrome.storage.sync.set({closeSockets: false});
    }
});

closeSocketsPolitely[0].addEventListener( 'change', function() {
    chrome.storage.sync.set({closeSocketsPolitely: true});
});

closeSocketsPolitely[1].addEventListener( 'change', function() {
    chrome.storage.sync.set({closeSocketsPolitely: false});
});
