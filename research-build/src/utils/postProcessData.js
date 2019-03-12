//Imports
const fs = require('fs');
const path = require('path');
const psl = require('psl');
const ABPFilterParser = require('abp-filter-parser');

//Settings
const COUNTRIES = ["hong-kong", "ireland", "japan", "russia", "spain", "usa"];
const ROUND = 0;

//Globals
let results = {};

function checkFirstParty(country){
  results = JSON.parse(ROUND === 0
            ? fs.readFileSync(path.join(__dirname, '../../', 'data', country + "-results.json"))
            : fs.readFileSync(path.join(__dirname, '../../', 'data', 'round' + ROUND, country + "-results.json")));

  for(var site in results.details){
    if(results.details[site].numberWS != 0){
      for(wsURL in results.details[site].WSConnections){

        // Convert to URL object and pull out hostname
        // This removes all scheme, paths, & parameters/queries
        // e.g: https://www.google.com/search?q=google => www.google.com
        // N.B: This retains any subdomains
        siteURL = new URL(site);
        wsURL = new URL(wsURL);

        // Using psl to remove any subdomains
        // e.g: www.google.com   => google.com
        //      a.b.c.google.com => google.com
        parsedSiteURL = psl.parse(siteURL.hostname);
        parsedWSURL = psl.parse(wsURL.hostname);

        // This is without subdomains:
        console.log("parsedSiteURL.domain: " + parsedSiteURL.domain);
        console.log("parsedWSURL.domain: " + parsedWSURL.domain);
        if(parsedWSURL.domain != parsedSiteURL.domain){
          console.log("Third Party WS Connection. Caution!");
        }
        else if (parsedWSURL.domain === parsedSiteURL.domain){
          console.log("First Party WS Connection. Safe to proceed.");
        }
      }
    }
  }
}

checkFirstParty("ireland");
