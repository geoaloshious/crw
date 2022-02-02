let puppeteer = require("puppeteer");

process.setMaxListeners(10000);

let runtime_menu_selector = '#runtime-menu-button';
let restart_selector = '[command="restart"]';
let factResSelector = '[command="powerwash-current-vm"]';
let confirmSelector = '/html/body/colab-dialog/paper-dialog/div[2]/paper-button[2]';
let first_cell_selector = '/html/body/div[7]/div[2]/div[1]/colab-tab-layout-container/colab-tab/div/colab-shaded-scroller/div/div[1]/div/div[2]/div[1]/div[2]/div[2]/div[1]/div[1]/div/colab-run-button';
let secondCellSelector = '/html/body/div[7]/div[2]/div[1]/colab-tab-layout-container/colab-tab/div/colab-shaded-scroller/div/div[1]/div/div[2]/div[2]/div[2]/div[2]/div[1]/div[1]/div/colab-run-button';
let disk_alert_ignore = '/html/body/colab-dialog/paper-dialog/div[2]/paper-button[1]';
let clear_op_sel = '/html/body/div[7]/div[2]/div[1]/colab-tab-layout-container/colab-tab/div/colab-shaded-scroller/div/div[1]/div/div[2]/div[2]/div[2]/div[2]/div[2]/div[2]/div[1]/div';

function wait(milliSec) {
    return new Promise((resolve) => {
        setTimeout(resolve, milliSec);
    });
}

async function pageReload(page) {
    await page.reload({ waitUntil: 'networkidle2' });
}

(async () => {
    let browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
    let ppages = await browser.pages();

    await Promise.allSettled(ppages.map((p) => {
        p.on('dialog', async (dialog) => { await dialog.accept() });
    }))

    let operatn = process.argv[2];

    if (operatn === '1') {//Factory reset and run
        for (let i = 0; i < ppages.length; i++) {
            let page = ppages[i];
            await page.bringToFront();
            await wait(1000);

            //Close runtime disconnected alert
            try {
                let closeBtn = await page.$x(disk_alert_ignore);
                if (closeBtn.length > 0) {
                    await closeBtn[0].click();
                }
            } catch (error) { console.log('closeBtn : ', error) }

            await page.waitForSelector(runtime_menu_selector);
            let runtime_menu = await page.$(runtime_menu_selector);
            await runtime_menu.click();

            try {
                await page.waitForSelector(factResSelector);
                let factRes = await page.$(factResSelector);
                await factRes.click();

                await page.waitForXPath(confirmSelector, { timeout: 3000 });
                let confirmm = (await page.$x(confirmSelector))[0];
                await confirmm.click();
                await wait(1000);
            } catch (error) { }

            await page.waitForXPath(first_cell_selector, { timeout: 3000 });
            let firstCell = (await page.$x(first_cell_selector))[0];
            await firstCell.click();

            console.log('id: ', i);
        }
    }
    else if (operatn === '2') {//Run second cell
        await Promise.allSettled(ppages.map(pageReload));

        for (let i = 0; i < ppages.length; i++) {
            try {
                let page = ppages[i];
                await page.bringToFront();

                await page.waitForXPath(secondCellSelector);
                let secondCell = (await page.$x(secondCellSelector))[0];
                await secondCell.click();
            } catch (error) { console.log('Run 2nd cell: ', error) }
            console.log('id: ', i);
        }
    }
    else if (operatn === '3') {//Persist
        let persiTimes = Number(process.argv[3]);

        for (let i = 0; i < persiTimes; i++) {
            await wait(30 * 60000);

            // console.time('clrop');
            for (let p = 0; p < ppages.length; p++) {
                let page = ppages[p];
                await page.bringToFront();
                await wait(1000);

                //Ignore disk storage alert
                try {
                    let ignoreBtn = await page.$x(disk_alert_ignore);
                    if (ignoreBtn.length > 0) {
                        await ignoreBtn[0].click();
                    }
                } catch (error) { console.log('Ignbtn : ', error) }


                //Clear output
                try {
                    let clear_op = await page.$x(clear_op_sel);
                    await clear_op[0].click();
                } catch (error) { console.log('clrop_err : ', error) }
            }
            // console.timeEnd('clrop');

            await wait(5000);

            // console.time('restartIfHang');
            for (let p = 0; p < ppages.length; p++) {
                let page = ppages[p];
                await page.bringToFront();
                await wait(1000);

                let clear_op = await page.$x(clear_op_sel);
                if (clear_op.length === 0) {
                    try {
                        await page.waitForSelector(runtime_menu_selector);
                        let runtime_menu = await page.$(runtime_menu_selector);
                        await runtime_menu.click();

                        await page.waitForSelector(restart_selector);
                        let restar = await page.$(restart_selector);
                        await restar.click();

                        await page.waitForXPath(confirmSelector);
                        let confirmm = (await page.$x(confirmSelector))[0];
                        await confirmm.click();
                    } catch (error) { }

                    await pageReload(page);

                    try {
                        await page.waitForXPath(secondCellSelector);
                        let secondCell = (await page.$x(secondCellSelector))[0];
                        await secondCell.click();
                    } catch (error) { console.log('Run 2nd cell - RIH :', error) }
                }
            }
            // console.timeEnd('restartIfHang');
        }
    }
    else if (operatn === '4') {//Bring all pages to front
        for (let i = 0; i < ppages.length; i++) {
            await ppages[i].bringToFront();
            await wait(500);
        }
    }
})();
