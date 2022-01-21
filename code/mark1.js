let puppeteer = require("puppeteer");

process.setMaxListeners(10000);

let edit_menu_selector = '#edit-menu-button';
let clear_output_selector = '[command="clear-outputs"]';
let runtime_menu_selector = '#runtime-menu-button';
let restart_selector = '[command="restart"]';
let factResSelector = '[command="powerwash-current-vm"]';
let confirmSelector = '/html/body/colab-dialog/paper-dialog/div[2]/paper-button[2]';
let first_cell_selector = '/html/body/div[7]/div[2]/div[1]/colab-tab-layout-container/colab-tab/div/colab-shaded-scroller/div/div[1]/div/div[2]/div[1]/div[2]/div[4]/colab-run-button';
let secondCellSelector = '/html/body/div[7]/div[2]/div[1]/colab-tab-layout-container/colab-tab/div/colab-shaded-scroller/div/div[1]/div/div[2]/div[3]/div[2]/div[4]/colab-run-button';
let thirdCellSelector = '/html/body/div[7]/div[2]/div[1]/colab-tab-layout-container/colab-tab/div/colab-shaded-scroller/div/div[1]/div/div[2]/div[6]/div[2]/div[2]/div[1]/div[1]/div/colab-run-button';

function wait(milliSec) {
    return new Promise((resolve) => {
        setTimeout(resolve, milliSec);
    });
}

async function factoryReset(page) {
    await page.waitForSelector(runtime_menu_selector);
    let runtime_menu = await page.$(runtime_menu_selector);
    await runtime_menu.click();
    await wait(1000);

    await page.waitForSelector(factResSelector);
    let factRes = await page.$(factResSelector);
    await factRes.click();
    await wait(1000);

    await page.waitForXPath(confirmSelector);
    let confirmm = (await page.$x(confirmSelector))[0];
    await confirmm.click();
    await wait(1000);

    await page.reload();
}

async function runCells(page) {
    await page.waitForXPath(secondCellSelector);
    let secondCell = (await page.$x(secondCellSelector))[0];
    await secondCell.click();
    await wait(5000);

    await page.waitForXPath(thirdCellSelector);
    let thirdCell = (await page.$x(thirdCellSelector))[0];
    await thirdCell.click();
}

async function runNpersist(page) {
    for (let i = 0; i < 10; i++) {
        await page.reload();
        await runCells(page);

        for (let j = 0; j < 4; j++) {
            await wait(15 * 60000);

            //#region clear output
            await page.waitForSelector(edit_menu_selector);
            let edit_menu = await page.$(edit_menu_selector);
            await edit_menu.click();
            await wait(1000);

            await page.waitForSelector(clear_output_selector);
            let clear_op = await page.$(clear_output_selector);
            await clear_op.click();
            //#endregion
        }

        //#region Restart
        await page.waitForSelector(runtime_menu_selector);
        let runtime_menu = await page.$(runtime_menu_selector);
        await runtime_menu.click();
        await wait(1000);

        await page.waitForSelector(restart_selector);
        let restar = await page.$(restart_selector);
        await restar.click();
        await wait(1000);

        await page.waitForXPath(confirmSelector);
        let confirmm = (await page.$x(confirmSelector))[0];
        await confirmm.click();
        await wait(1000);
        //#endregion
    }
}

(async () => {
    let browser = await puppeteer.connect({ browserWSEndpoint: 'ws://127.0.0.1:9222/devtools/browser/003c3791-a39b-4e4d-a13b-d4a102a71826' });
    let pages = await browser.pages();

    let operatn = process.argv[2];
    if (operatn === '1') {//Factory reset and run
        await Promise.allSettled(pages.map(factoryReset));

        for (let i = 0; i < pages.length; i++) {//Run first cells with 15s interval
            let page = pages[i];
            await page.waitForXPath(first_cell_selector);
            let firstCell = (await page.$x(first_cell_selector))[0];
            await firstCell.click();
            await wait(15000);
        }
    }
    else if (operatn === '2') {//Run and persist
        await Promise.allSettled(pages.map(runNpersist));
    }
})();
