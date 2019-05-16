var page = require('webpage').create();
page.viewportSize = {width: 1920, height: 1080};
page.open('http://github.com/', function() {
  window.setTimeout(function(){
    page.render('github.png');
    phantom.exit();
  }, 500);
});
