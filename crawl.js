const Crawler = require("crawler");
const URL = require("url").URL;
const puppeteer = require('puppeteer');
const fs = require('fs');
const argv = require('yargs')
  .usage('Usage: [placeholder] [options] -- [url]')
  .boolean('r')
  .alias('r', 'report')
  .describe('r', 'Generate a report of all URLs captured')
  .boolean('l')
  .alias('l', 'list')
  .describe('l', 'Generate a list of all links encountered')
  .help('h')
  .alias('h', 'help')
  .argv;

// So that we don't crawl anything twice.
let alreadySeen = [];

// To queue up URLs to actually render and image.
let shotList = [];

// Make sure the output directory exists.
if (!fs.existsSync('output')){
  fs.mkdirSync('output');
}

const captureReport = (argv.r) ? fs.createWriteStream("output/report.txt", {flags:'w', encoding: 'utf8', autoClose: true}) : false;

const linksList = (argv.l) ? fs.createWriteStream("output/list.txt", {flags:'w', encoding: 'utf8', autoClose: true}) : false;

const c = new Crawler();

const crawlAll = function(parentUrl) {
  console.log("Crawling " + parentUrl);

  // FILTER ON URLs AND PATH NAMES HERE.
  //
  // For example:
  // if (parentUrl.pathname.indexOf('something-to-exclude') !== -1) {
  //   return;
  // }
  //
  // THEY WILL BE SKIPPED AND NOT CRAWLED/FETCHED.


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

          if (linksList !== false) {
            // @TODO: This would be better in [{from: , to: }, {}...] format for
            // analysis later and output to a file.
            console.log(parentUrl + " --> " + href);
            linksList.write(parentUrl + " --> " + href + "\n");
          }

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

    console.log("Received list of " + shotList.length + " to capture");

    if (captureReport !== false) {
      // @TODO: Output this to a file
      console.log(shotList.join("\n"));
      captureReport.write("Received list of " + shotList.length + " to capture.\n\n");
      captureReport.write(shotList.join("\n"));
    }

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

const firstUrl = new URL(argv._[0]);
alreadySeen.push(firstUrl.href);
crawlAll(firstUrl);
