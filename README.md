# Brandy Shots

A tool to automatically crawl capture screenshots of an entire website. Written
for a friend, for a thing we used to have to do a lot. Maybe you will find it
useful, too.

## Installation

- I recommend nvm for Node version management
- `nvm use` (or `nvm install && nvm use`) to get/activate the correct Node version.
- `npm install`

## Usage

`node craw.js [options] [home page]`

- Example: `node crawl.js -r -l https://www.biocomppharma.com`

### Options

- `-r` Generate a **report** of all URLs captured in a text file.
- `-l` Generate a **list of links** encountered during the crawl.
- `-h` Show a list of options and exit.
- `home page` should include a protocol and be the starting point of a crawl, usually a site root.

### Output

Script will dump the reports (if requested) and PNGs into a directory called
`output` in the current working directory. The user should manually consolidate
these images into a PDF at max image quality for archiving.

## Future enhancements:

This is quick-n-dirty in a lot of ways. Things I'd like to do:

- Automatically combine images and reports into a PDF in `output` instead of
  that being a manual step.
- A lot of sites will need some kind of filter to remove things like text-size
  adjustment links, lightbox links, social media share/profile or outbound
  redirector links. There's a place in `crawl.js` noting where to put these
  filters, but they should be spec'able on the CLI.
- Should offload the `console.log` debug messages to a debugger or better output
  control.
