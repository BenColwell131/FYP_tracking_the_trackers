// Imports
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Settings:
const COUNTRY = process.argv[2];
const COLLECT_SCREENSHOTS = true;
const TIME_ON_PAGE = 60000; //milliseconds

// Globals:
let domainList = [];
let errorLog = [];
// A few sites can't handle www subdomain:
const noWwwSites = { "Detail.tmall.com": 1, "Himado.in": 1,"Login.tmall.com": 1, "B9good.com": 1, "Abema.tv": 1, "Animevost.org": 1, "Redd.it": 1}

// Functions
function loadDomainList() {
  domainList = [];
  domainList = fs.readFileSync(path.join(__dirname, '../../', "assets", "top-sites", COUNTRY + ".txt"))
                 .toString()
                 .split('\r\n');
  console.log(domainList);
}

function writeJsonToFile(data) {
  fs.writeFileSync(path.join(__dirname, '../../', "data", COUNTRY + "-results.json"), data);
}

function logError(domain, err){
  errorLog.push({
    "domain": domain,
    "error": err.toString()
  });

  fs.writeFileSync(path.join(__dirname, '../../', "data", "errors", COUNTRY + "-errorlog.json"), JSON.stringify(errorLog));
}

// Simple helper function to add delays
const delay = ms => new Promise(res => setTimeout(res, ms));

(async() => {
  await loadDomainList();
  const pathToExtension = path.join(__dirname, '../../', 'build');
  const pathToUserDir = path.join(__dirname, '../../', 'assets', 'puppeteer-profile');
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: pathToUserDir,
    args: [
     `--disable-extensions-except=${pathToExtension}`,
     `--load-extension=${pathToExtension}`,
     `--window-size=1920,1080`,
     `--ignore-certificate-errors`
   ]
  });
  const page = await browser.newPage();
  await page.setViewport({
       width  : 1920,
       height : 1080
   });

  // Access Extension background page.
  const targets = await browser.targets();
  const backgroundPageTarget = targets.find(target => target.type() === 'background_page' && target.url().endsWith('background.html'));
  const backgroundPage = await backgroundPageTarget.page();

  // Expose function to background page
  await backgroundPage.exposeFunction("sendToPuppeteer", (data) => {
    console.log("Data receieved!");
    writeJsonToFile(data);
  });

  // Visit all domains in list.
  const pageLoad = page.waitForFunction('document.readyState === "complete"');
  for(let i = 0; i < 100; i++){
      await page.goto((noWwwSites[domainList[i]] ? 'http://' + domainList[i] : 'http://www.' + domainList[i]), {waitUntil: ['networkidle2', 'load', 'domcontentloaded']})
                     .catch(err => {
                       // console.log(err);
                       logError(domainList[i], err)
                     });
      await pageLoad;
      if(COLLECT_SCREENSHOTS){
        const screenshotPath = path.join(__dirname, '../../', "data", "screenshots", COUNTRY, (i+1) + "_" + domainList[i] + ".png");
        console.log(screenshotPath);
        page.screenshot({path: screenshotPath})
      }
      await delay(TIME_ON_PAGE); //Waiting on each page
      console.log("Visited: " + domainList[i]);
  }

  console.log("Finished gathering data for: ", COUNTRY);
  await browser.close();
})();
