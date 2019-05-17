const Crawler = require("crawler");
const URL = require("url").URL;
// const puppeteer = require('puppeteer');

let alreadySeen = [];

const c = new Crawler();

// Adapted from https://stackoverflow.com/a/50164565

const crawlAll = function(parentUrl) {
  console.log("Crawling " + parentUrl);

  c.queue({
    url: parentUrl,
    callback: function (err, res, done) {
      if (err) throw err;

      const $ = res.$;

      try {
        const childLinks = $("a");
        Object.keys(childLinks).forEach((index) => {
          if (childLinks[index].type === 'tag') {
            const href = childLinks[index].attribs.href.trim();
            if (href) {
              const nextUrl = new URL(href, parentUrl);
              if (firstUrl.host == nextUrl.host) {
                if (!alreadySeen.includes(nextUrl.href)) {
                  alreadySeen.push(nextUrl.href);
                  crawlAll(nextUrl);
                }
              }
            }
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

const firstUrl = new URL('https://www.tsmithcreative.com');
alreadySeen.push(firstUrl.href);
crawlAll(firstUrl);
