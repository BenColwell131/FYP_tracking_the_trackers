// Imports
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Settings:
const COUNTRY = 'ireland';

// Globals:
let domainList = [];

// Functions
function loadDomainList() {
  domainList = fs.readFileSync(path.join(__dirname, '../../', "assets", "top-sites", COUNTRY + ".txt"))
                 .toString()
                 .split('\r\n');
  console.log(domainList);
}

function writeJsonToFile(data) {
  fs.writeFileSync(path.join(__dirname, '../../', "data", COUNTRY + "-results.json"), data)
}

// Simple helper function to add delays
const delay = ms => new Promise(res => setTimeout(res, ms));

(async() => {
  await loadDomainList();
  const pathToExtension = path.join(__dirname, '../../', 'build');
  const browser = await puppeteer.launch({
    headless: false,
    args: [
     `--disable-extensions-except=${pathToExtension}`,
     `--load-extension=${pathToExtension}`
   ]
  });
  const page = await browser.newPage();

  // Access Extension background page.
  const targets = await browser.targets();
  const backgroundPageTarget = targets.find(target => target.type() === 'background_page' && target.url().endsWith('background.html'));
  const backgroundPage = await backgroundPageTarget.page();

  // Expose function to background page
  await backgroundPage.exposeFunction("sendToPuppeteer", (data) => {
    console.log("Data receieved!", data);
    writeJsonToFile(data);
  });

  // Visit all domains in list.
  const pageLoad = page.waitForFunction('document.readyState === "complete"');
  for(let i = 0; i < 100; i++){
      await page.goto('http://' + domainList[i], {waitUntil: ['networkidle2', 'load', 'domcontentloaded']})
                     .catch(err => console.log(err));
      await pageLoad;
      await delay(60000); //Waiting 30s on each page
      console.log("Visited: https://" + domainList[i]);
  }

  // TODO: Post process data
  // TODO: Close browser
})();
