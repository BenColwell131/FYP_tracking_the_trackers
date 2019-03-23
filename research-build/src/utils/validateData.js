//Imports
const fs = require('fs');
const path = require('path');

//Settings
const COUNTRIES = ["hong-kong", "ireland", "japan", "russia", "spain", "usa"];
const ROUND = 5;

//Globals
let results = {};

//**********************************************
// Currently checking:
//    - Total sites visited
//    - Total WS connections
//    - Site WS counts vs number of urls
//**********************************************

function checkForDuplicates(){
  let currentDomain = "";

  console.log("Duplicate Checking:");
  for(site in results.details){

    // Convert to URL object and pull out hostname
    // This removes all scheme, paths, & parameters/queries
    // e.g: https://www.google.com/search?q=google => www.google.com
    // N.B: This retains any subdomains
    const siteURL = new URL(site);

    // Check vs next site
    if(currentDomain === siteURL.hostname){
      // Duplicate found
      console.log("\tDuplicate found:\t" + siteURL.hostname);
    }
    currentDomain = siteURL.hostname;
  }
}

function validateData(country){
  results = JSON.parse(ROUND === 0
            ? fs.readFileSync(path.join(__dirname, '../../', 'data', country + "-results.json"))
            : fs.readFileSync(path.join(__dirname, '../../', 'data', 'round' + ROUND, country + "-results.json")));

  // Check number of sites visited
  if(results.totalNumSitesVisited === Object.keys(results.details).length){
    console.log("Number of sites visited matched.");
  }else{
    console.error("ERROR: Number of sites visited did not match.");
  }

  let wsCount = 0;
  for(var site in results.details){
    wsCount += results.details[site].numberWS;
    // console.log(wsCount);
    if(results.details[site].numberWS === Object.keys(results.details[site].WSConnections).length){
      // console.log(country + ": " + site + ": number of websockets matched.");
    }else{
      console.error("ERROR: " + site + ": Number of websockets did not match WS urls.");
    }
  }
  if(results.totalWSConnections === wsCount){
    console.log("Total number of websockets matched site totals.");
  }else{
    console.error("ERROR: Total number of websockets did not match site totals.");
  }

  checkForDuplicates();
};

function validateAllData(){
  for(let i = 0; i < COUNTRIES.length; i++){
    console.log("\n*** " + COUNTRIES[i].toUpperCase() + " ***");
    validateData(COUNTRIES[i]);
  }
}

validateAllData();
