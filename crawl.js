const Crawler = require("crawler");
const URL = require("url").URL;
const puppeteer = require('puppeteer');
const fs = require('fs');

// So that we don't crawl anything twice.
let alreadySeen = [];

// To queue up URLs to actually render and image.
let shotList = [];

const c = new Crawler();

const crawlAll = function(parentUrl) {
  console.log("Crawling " + parentUrl);
  shotList.push(parentUrl.href);

  c.queue({
    url: parentUrl,
    callback: function (err, res, done) {
      if (err) throw err;

      const $ = res.$;

      try {
        const childLinks = $("a");
        Object.keys(childLinks).forEach((index) => {
          // We're only processing <a/> tags
          if (childLinks[index].type !== 'tag') { return; }

          // Require, capture, and clean the href attribute
          if (!childLinks[index].attribs.hasOwnProperty('href')) { return; }
          let href = childLinks[index].attribs.href;
          href = href.trim().replace(/#.*$/, ''); // Skip fragments
          if (!href) { return; }

          // Construct a URL parser on the new href so we can do some checks
          const nextUrl = new URL(href, parentUrl);

          // Stay within the original hostname
          if (firstUrl.host !== nextUrl.host) { return; }

          // If the link in quesiton has already been noted, skip it
          if (alreadySeen.includes(nextUrl.href)) { return; }

          // Have we already seen this path on a different protocol? If so, skip
          // @TODO: This could probably be cleaner.
          if (nextUrl.protocol === 'http:' && alreadySeen.includes(nextUrl.href.replace(/^http:/, 'https:'))) { return; }
          if (nextUrl.protocol === 'https:' && alreadySeen.includes(nextUrl.href.replace(/^https:/, 'http:'))) { return; }

          // Mark the link as noted, then if it isn't a media asset, crawl it.
          alreadySeen.push(nextUrl.href);
          if (nextUrl.pathname.match(/\.(mp.|jpg|png|gif|xml|rss|pdf)$/i) === null) {
            crawlAll(nextUrl);
          }
        });
      } catch (e) {
        console.error("Encountered error crawling " + parentUrl + "\n" + e);
        done();
      }
      done();
    }
  })
}

c.on('drain', () => { (async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({width: 1920, height: 1080});

    if (!fs.existsSync('output')){
      fs.mkdirSync('output');
    }

    for (let i = 0; i < shotList.length; i++) {
      let filename = shotList[i].replace(/^.+:\/\//, '').replace(/\/$/, '').replace(/(\/|\\)/g, '-') + ".png";

      try {
        await page.goto(shotList[i],  {waitUntil: 'networkidle2'});
        await page.screenshot({path: "output/" + filename, fullPage: true});
      } catch (e) {
        throw e;
      }
    }

    await browser.close();
  })();
});

const firstUrl = new URL('https://www.tsmithcreative.com');
alreadySeen.push(firstUrl.href);
crawlAll(firstUrl);
