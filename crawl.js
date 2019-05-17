const Crawler = require("crawler");
const URL = require("url").URL;
// const puppeteer = require('puppeteer');

// So that we don't crawl anything twice.
let alreadySeen = [];

const c = new Crawler();
c.on('drain', () => { console.log(alreadySeen); });

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
          // We're only processing <a/> tags
          if (childLinks[index].type !== 'tag') { return; }

          // Capture and clean the href attribute
          let href = childLinks[index].attribs.href;
          href = href.trim().replace(/#.*$/, '');
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

const firstUrl = new URL('https://www.tsmithcreative.com');
alreadySeen.push(firstUrl.href);
crawlAll(firstUrl);
