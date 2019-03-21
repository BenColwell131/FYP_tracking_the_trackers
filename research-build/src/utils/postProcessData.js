//Imports
const fs = require('fs');
const path = require('path');
const psl = require('psl');
const ABPFilterParser = require('abp-filter-parser');

//Settings
const COUNTRY = process.argv[2];
const ROUND = 4;

//Globals
let results = {};
let sitesWithWS   = 0;
let numFirstParty = 0;
let numThirdParty = 0;
let parsedFilterLists = {};
let numWSHitFilter    = 0;
let numWSPassedFilter = 0;
let numSitesHitFilter = 0;


// ********************************************************************
// Currently does:
//  -- Counts number of sites that open 1+ WS
//  -- Checks first vs third party (ignores subdomains)
//  -- Checks WS urls against filter lists (easyList & easyPrivacy)
//  -- Saves results to a new file
// ********************************************************************

// Tallys up all sites that open 1+ websockets.
function tallySitesWithWS(){
  for(var site in results.details){
    if(results.details[site].numberWS != 0){
      sitesWithWS++;
    }
  }
  results.sitesWithWS = sitesWithWS;
}

// Checks whether each WS connection in passed results is first or third party.
// First party is determined by mathcing domain alone and ignores subdomains.
function checkFirstParty(){
  for(var site in results.details){
    if(results.details[site].numberWS != 0){

      //Format site url (same as ws url explained below)
      const siteURL = new URL(site);
      const parsedSiteURL = psl.parse(siteURL.hostname);
      console.log("\nSite domain: " + parsedSiteURL.domain);
      console.log("Websocket domains:");

      let siteNumFirstParty = 0;
      let siteNumThirdParty = 0;

      for(wsURLString in results.details[site].WSConnections){

        // Convert to URL object and pull out hostname
        // This removes all scheme, paths, & parameters/queries
        // e.g: https://www.google.com/search?q=google => www.google.com
        // N.B: This retains any subdomains
        const wsURL = new URL(wsURLString);

        // Using psl to remove any subdomains
        // e.g: www.google.com   => google.com
        //      a.b.c.google.com => google.com
        const parsedWSURL = psl.parse(wsURL.hostname);

        if(parsedWSURL.domain != parsedSiteURL.domain){
          console.log("\t" + parsedWSURL.domain + ": Third Party WS Connection. Caution!");
          results.details[site].WSConnections[wsURLString].partyType = "Third";
          siteNumThirdParty++;
          numThirdParty++;
        }
        else {
          console.log("\t" + parsedWSURL.domain + ": First Party WS Connection. Safe to proceed.");
          results.details[site].WSConnections[wsURLString].partyType = "First";
          siteNumFirstParty++;
          numFirstParty++;
        }
      }
      // Site specific tallys
      results.details[site].siteNumFirstParty = siteNumFirstParty;
      results.details[site].siteNumThirdParty = siteNumThirdParty;
    }
  }
  // Total tally
  results.numFirstPartyWS = numFirstParty;
  results.numThirdPartyWS = numThirdParty;
}

// Fetches filter lists and parses them using ABPFilterParser.
function fetchFilterLists(){
  let easyPrivacyURL = path.join(__dirname, '../../', 'assets', 'filters', 'easyprivacy.txt');
  let easyPrivacy = fs.readFileSync(easyPrivacyURL, "utf8");

  let easyListURL = path.join(__dirname, '../../', 'assets', 'filters', 'easylist.txt');
  let easyList = fs.readFileSync(easyListURL, "utf8");

  // Add each list to the parsed list
  // Currently combining lists, but may come back to split privacy vs ads.
  ABPFilterParser.parse(easyPrivacy, parsedFilterLists);
  ABPFilterParser.parse(easyList, parsedFilterLists);
}

// Checks all WS urls against filter lists.
function checkAgainstFilters(){
  fetchFilterLists();

  console.log("\n***** FILTER CHECKING *****");
  // For every WS url
  for(var site in results.details){
    let siteHitFilter = false;
    if(results.details[site].numberWS != 0){
      console.log("\nSite: " + site);
      console.log("Websocket domains:");

      for(wsURL in results.details[site].WSConnections){
        wsHostname = new URL(wsURL);
        wsHostname = wsHostname.hostname;

        if(ABPFilterParser.matches(parsedFilterLists, wsURL, {
          // domain: //TODO
          elementTypeMask: ABPFilterParser.elementTypes.SCRIPT
        })){
          console.log("\t" + wsHostname + ":\t Matched URL to list. You should block this URL!");
          numWSHitFilter++;
          results.details[site].WSConnections[wsURL].WSHitFilter = true;
          siteHitFilter = true;
        }
        else {
          console.log("\t" + wsHostname + ":\t Didn't match URL to list. Safe to proceed.");
          numWSPassedFilter++;
          results.details[site].WSConnections[wsURL].WSHitFilter = false;
        }
      }
      if(siteHitFilter){
        numSitesHitFilter++;
        results.details[site].siteHitFilter = true;
      }
      else {
        results.details[site].siteHitFilter = false;
      }
    }
  }
  results.numSitesHitFilter = numSitesHitFilter;
  results.numWSHitFilter = numWSHitFilter;
  results.numWSPassedFilter = numWSPassedFilter;
}

// Writes results to a json file
function writeResultsToFile(country){
  let dest  = ROUND === 0
            ? path.join(__dirname, '../../', 'data', country + "-processed-results.json")
            : path.join(__dirname, '../../', 'data', 'round' + ROUND, country + "-processed-results.json");

  fs.writeFileSync(dest, JSON.stringify(results));
}

// Post processes data of specified country.
function postProcessData(country){
  //Fetch results
  results = JSON.parse(ROUND === 0
            ? fs.readFileSync(path.join(__dirname, '../../', 'data', country + "-results.json"))
            : fs.readFileSync(path.join(__dirname, '../../', 'data', 'round' + ROUND, country + "-results.json")));

  // TODO: Could maybe do this during data collection
  tallySitesWithWS();
  checkFirstParty();
  checkAgainstFilters();
  writeResultsToFile(country);
  console.log(results);
}
postProcessData(COUNTRY);
