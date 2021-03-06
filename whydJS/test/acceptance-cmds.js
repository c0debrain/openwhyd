var assert = require('assert');
var { URL_PREFIX, ADMIN_USER, TEST_USER } = require('./fixtures.js');

const EXPECTED_DB_NAME = 'openwhyd_test';
const WAIT_DURATION = 10000;

// custom wdio / webdriver.io commands

browser.addCommand('injectJS', function async (scriptUrl) {
  return browser.execute(function(scriptUrl) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = scriptUrl;
    document.body.appendChild(script);
  }, scriptUrl);
});

browser.addCommand('waitForContent', function async (regex, context) {
  return browser.waitUntil(function async() {
    return this.getHTML(context || 'body').then((content) => {
      //console.log(content.length, content.substr(0, 10), regex.toString(), regex.test(content))
      return regex.test(content);
    })},
    WAIT_DURATION, `${regex.toString()} should be in the page within 5 seconds`
  );
});

browser.addCommand('clickOnContent', function (text) {
  return browser.element(`//*[contains(text(), '${text.replace(/'/g, '\\\'')}')]`).click();
});

// make sure that openwhyd/whydjs server is tested against the test database
browser.addCommand('checkTestDb', function async (user, dbName) {
  browser.url(URL_PREFIX + `/login?action=login&email=${encodeURIComponent(user.email)}&md5=${user.md5}&redirect=/admin/config/config.json`);
  return browser.getText('pre').then(function(content) {
    var config = JSON.parse(content).json;
    assert.equal(config.mongoDbDatabase, dbName);
    return browser.url(URL_PREFIX + '/login?action=logout');
  });
});

// before running tests: make sure that openwhyd/whydjs server is tested against the test database

before(function() {
  /*
  browser.url(URL_PREFIX + `/login?action=login&email=${encodeURIComponent(ADMIN_USER.email)}&md5=${ADMIN_USER.md5}&redirect=/admin/config/config.json`);
  var config = JSON.parse(browser.getText('pre')).json;
  assert.equal(config.mongoDbDatabase, 'openwhyd_test');
  return new Promise(function (resolve, reject) {
    browser.url(URL_PREFIX + '/login?action=logout').then(resolve, reject);
  });
  */
  browser.checkTestDb(ADMIN_USER, EXPECTED_DB_NAME);
});

// other helpers

exports.takeSnapshot = function takeSnapshot() {
  var results = browser.checkDocument(); // http://webdriver.io/guide/services/visual-regression.html
  results.forEach((result) => {
    assert(result.isWithinMisMatchTolerance, 'a difference was find on a snapshot');
  });
};
