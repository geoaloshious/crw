let puppeteer = require("puppeteer-extra");
let StealthPlugin = require("puppeteer-extra-plugin-stealth");
let numToword = require('number-to-words');
let request = require("request");
let fs = require('fs');

puppeteer.use(StealthPlugin());
process.setMaxListeners(10000);

function wait(milliSec) {
    return new Promise((resolve) => {
        setTimeout(resolve, milliSec);
    });
}

function fetchURL(url) {
    return new Promise((resolve) => {
        request(url, (error, response, html) => {
            if (!error && response.statusCode == 200) {
                resolve(html);
            } else resolve('')
        });
    })
}

let getRandomNum = (min = 3, max = 7) => Math.floor(Math.random() * (max - min + 1) + min);
let getRandomEl = (items) => items[Math.floor(Math.random() * items.length)];

let title1 = ['video', 'vid', 'vi', 'v', ''], title2 = ['-', ' '];
let keywords = ['horny', 'boy', 'sexy', 'man', 'hairy', 'dude', 'twinky', 'bae', 'babe', 'extra', 'short', 'want', 'my', 'dick',
    'suck', 'me', 'lick', 'body', 'please', 'fuck', 'bangla', 'bly', 'show', 'masturbation', 'masturbate', 'hot', 'bubbly',
    'romanian', 'yindien', 'twink', 'wide', 'open', 'ass', 'ameteur'];

let nw_keywords = ['like', 'insert', 'inside', 'butt', 'nipples', 'press',
    'boobs', 'sissy', 'solo', 'alone', 'thigh', 'navel', 'sack', 'young', 'homemade', 'indoor', 'cam', 'porn', 'penis', 'bottom'];

let tag_keywords = ['horny', 'boy', 'sexy', 'man', 'hairy', 'dude', 'twinky', 'bae', 'babe', 'extra', 'short', 'dick',
    'suck', 'lick', 'body', 'fuck', 'bangla', 'show', 'masturbation', 'masturbate', 'hot', 'bubbly',
    'romanian', 'twink', 'ass', 'ameteur', 'insert', 'inside', 'butt', 'nipples', 'press',
    'boobs', 'sissy', 'solo', 'alone', 'thigh', 'navel', 'sack', 'young', 'homemade', 'indoor', 'cam', 'porn', 'penis', 'bottom'];

(async () => {
    let slno = process.argv[2];
    let file_count = fs.readdirSync('upload_queue').length;

    let browserWSEndpoint = await fetchURL('http://localhost:3001/getwsurl');
    let browser = await puppeteer.connect({ browserWSEndpoint });
    let page = (await browser.pages())[0];

    for (let fc = 0; fc < file_count; fc++) {
        await page.goto('https://www.xvideos.com/account/uploads/new', { waitUntil: 'networkidle2' });

        let accessId = '#upload_form_video_premium_video_premium_centered_zone_all_site';
        await page.waitForSelector(accessId);
        let accessBtn = await page.$(accessId);
        await accessBtn.click();
        await wait(1000);

        let cat_1 = await page.$('#upload_form_category_category_centered_category_straight');
        await cat_1.click();
        await wait(1000);

        let cat_2 = await page.$('#upload_form_category_category_centered_category_solo_boys');
        await cat_2.click();
        await wait(1000);

        let num_word_arr = [numToword.toOrdinal(slno), slno];

        let mainTitle = '';
        let mwc = getRandomNum();
        for (let i = 0; i < mwc; i++) mainTitle += getRandomEl(keywords) + ' ';
        await page.type('#upload_form_titledesc_title', getRandomEl(title1) + getRandomEl(title2) + getRandomEl(num_word_arr) + getRandomEl(title2) + mainTitle.trim());

        let networkTitle = '';
        let nwc = getRandomNum();
        for (let i = 0; i < nwc; i++) networkTitle += getRandomEl(nw_keywords) + ' ';
        await page.type('#upload_form_titledesc_title_network', getRandomEl(title1) + getRandomEl(title2) + getRandomEl(num_word_arr) + getRandomEl(title2) + networkTitle.trim());

        let tagXpath = '/html/body/div/div[4]/div/div/div[2]/div/div[2]/form/fieldset[8]/div/div/div/div[1]/input[1]';
        await page.waitForXPath(tagXpath);
        let tagInput = (await page.$x(tagXpath))[0];

        let tag_count = getRandomNum(2, 3);
        for (let i = 0; i < tag_count; i++) {
            await tagInput.type(getRandomEl(tag_keywords));
            await page.keyboard.press('Enter');
        }

        let termsBtn = await page.$('#upload_form_file_terms');
        await termsBtn.click();
        await wait(1000);

        let filePath = `upload_queue/${slno}.mp4`;
        let fileInput = await page.$('#upload_form_file_file_options_file_1_file');
        await fileInput.uploadFile(filePath);
        await wait(1000);

        let submitXpath = '/html/body/div/div[4]/div/div/div[2]/div/div[2]/form/fieldset[11]/fieldset/div/div/span[2]/button';
        await page.waitForXPath(submitXpath);
        let submitBtn = (await page.$x(submitXpath))[0];
        await submitBtn.click();

        await wait(5000);
        await page.waitForSelector('[class="status text-success"]', { timeout: 0 });
        await page.waitForSelector('[class="progress-bar progress-bar-success"]', { timeout: 0 });
        await wait(5000);

        // fs.unlinkSync(filePath);

        slno++;
    }
})();
