//Imports
const fs = require('fs');
const path = require('path');

//Settings
const COUNTRIES = ["hong-kong", "ireland", "japan", "russia", "spain", "usa"];
const ROUND = 0;

//Globals
let results = {};

//**********************************************
// Currently checking:
//    - Total sites visited
//    - Total WS connections
//    - Site WS counts vs number of urls
//**********************************************


function validateData(country){
  results = JSON.parse(ROUND === 0
            ? fs.readFileSync(path.join(__dirname, '../../', 'data', country + "-results.json"))
            : fs.readFileSync(path.join(__dirname, '../../', 'data', 'round' + ROUND, country + "-results.json")));

  // Check number of sites visited
  if(results.totalNumSitesVisited === Object.keys(results.details).length){
    console.log(country + ": Number of sites visited matched.");
  }else{
    console.error(country + ": ERROR: Number of sites visited did not match.");
  }

  let wsCount = 0;
  for(var site in results.details){
    wsCount += results.details[site].numberWS;
    // console.log(wsCount);
    if(results.details[site].numberWS === Object.keys(results.details[site].WSConnections).length){
      // console.log(country + ": " + site + ": number of websockets matched.");
    }else{
      console.error(country + ": ERROR: " + site + ": Number of websockets did not match WS urls.");
    }
  }
  if(results.totalWSConnections === wsCount){
    console.log(country + ": Total number of websockets matched.");
  }else{
    console.error(country + ": ERROR: Total number of websockets did not match.");
  }
};

function validateAllData(){
  for(let i = 0; i < COUNTRIES.length; i++){
    console.log("\n*** " + COUNTRIES[i].toUpperCase() + " ***");
    validateData(COUNTRIES[i]);
  }
}

validateAllData();
