const Crawler = require("crawler");
const URL = require("url").URL;
const puppeteer = require('puppeteer');
const fs = require('fs');
const argv = require('yargs')
  .usage('Usage: [placeholder] [options]')
  .describe('u', 'URL to start crawling')
  .alias('u', 'url')
  .help('h')
  .alias('h', 'help')
  .argv;

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

      // Only inspect HTML responses (for now)
      if (res.headers['content-type'].indexOf("text/html") === -1) {
        done();
        return;
      }

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

    console.log("Received list of " + shotList.length + " to capture");

    for (let i = 0; i < shotList.length; i++) {
      let filename = shotList[i]
        .replace(/^.+:\/\//, '') // Remove the protocol
        .replace(/\/$/, '') // Remove a trailing slash
        .replace(/(\/|\\)/g, '_') // Replace slashes with underscores
        .replace(/\W/g, '-') // Replace any non-word [^A-Za-z0-9_] with a hyphen
        + ".png";

      console.log("Navigating to " + shotList[i]);
      await page.goto(shotList[i],  {waitUntil: 'networkidle2'}).catch(e => {
        console.log("Error navigating to " + shotList[i]);
        console.log(e);
      })
      await page.screenshot({path: "output/" + filename, fullPage: true}).catch(e => {
        console.log("Error capturing " + shotList[i]);
        console.log(e);
      });
    }

    await browser.close();
  })();
});

const firstUrl = new URL(argv.url);
alreadySeen.push(firstUrl.href);
crawlAll(firstUrl);
