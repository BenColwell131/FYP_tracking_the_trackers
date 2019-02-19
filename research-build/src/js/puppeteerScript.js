const puppeteer = require('puppeteer');

(async() => {
  const pathToExtension = require('path').join(__dirname, '../../', 'build');
  const browser = await puppeteer.launch({
    headless: false,
    args: [
     `--disable-extensions-except=${pathToExtension}`,
     `--load-extension=${pathToExtension}`
   ]
  });
  const page = await browser.newPage();
  await page.goto('https://www.marketwatch.com/investing/stock/live');

  const pageLoad = page.waitForFunction('document.readyState === "complete"');
  await pageLoad;

  await page.evaluate(() => {
    console.log(document.readyState);
  });

  setTimeout(() => {browser.close({waitUntil: 'networkidle0'})}, 3000);
  // browser.close({waitUntil: 'networkidle0'});


})();
