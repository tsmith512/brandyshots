const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://www.tsmithcreative.com');
  await page.setViewport({width: 1920, height: 1080})
  await page.screenshot({path: 'output.png'});

  await browser.close();
})();
