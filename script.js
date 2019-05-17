const puppeteer = require('puppeteer');

let shotList = ['https://www.github.com', 'http://www.example.com', 'https://fourkitchens.com'];

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({width: 1920, height: 1080})

  for (let i = 0; i < shotList.length; i++) {
    let filename = shotList[i].replace(/^.+:\/\//, '').replace(/(\/|\\)/, '-') + ".png";
    await page.goto(shotList[i],  {waitUntil: 'networkidle2'});
    await page.screenshot({path: filename, fullPage: true});
  }

  await browser.close();
})();
