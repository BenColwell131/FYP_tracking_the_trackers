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

// TODO: comment
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

  // Visit all domains in list.
  const pageLoad = page.waitForFunction('document.readyState === "complete"');

  // TODO: Limited to first 4 sites atm
  for(let i = 0; i < 4; i++){
      await page.goto('https://' + domainList[i], {waitUntil: ['networkidle0', 'load', 'domcontentloaded']});
      await pageLoad;
      await delay(3000);
      console.log("Visited: https://" + domainList[i]);
  }

  console.log("Test");
  // TODO: Fetch gathered data from jsonbin
  // TODO: Post process data
  // TODO: Close browser
})();
