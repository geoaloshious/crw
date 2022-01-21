let puppeteer = require("puppeteer-extra");
let StealthPlugin = require("puppeteer-extra-plugin-stealth");
let express = require('express');

let app = express();

puppeteer.use(StealthPlugin());
process.setMaxListeners(10000);

let wsurl = '';

(async () => {
    let browser = await puppeteer.launch({
        headless: false,
        ignoreHTTPSErrors: true,
        args: [
            "--disable-dev-shm-usage",
            "--no-sandbox",
            "--disable-setuid-sandbox",
        ]
    });
    wsurl = browser.wsEndpoint();
})();

app.get('/getwsurl', function (req, res) {
    res.send(wsurl);
})

app.listen(3001);
