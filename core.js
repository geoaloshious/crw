var request = require("request");
var cheerio = require("cheerio");
process.setMaxListeners(10000);
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

(async () => {
    function crequest(url, ret_arr) {
        return new Promise((resolve) => {
            request(url, (error, response, html) => {
                if (!error && response.statusCode == 200) {
                    if (ret_arr) {
                        let arr = html.split("\n");
                        arr.pop();
                        resolve(arr);
                    }
                    else resolve(html);
                } else {
                    if (ret_arr) resolve([]);
                    else resolve('');
                }
            });
        });
    }

    let site = Number(process.argv[2]);
    let slNo = Number(process.argv[3]);

    let proxyArraySize = 50;
    let urlLimit = 2;
    let sIndex = slNo * urlLimit;
    let eIndex = sIndex + urlLimit;

    var userAgents = await crequest('https://geoaloshious.github.io/crw/useragents.txt', true);
    var URLS = (await crequest(`https://geoaloshious.github.io/crw/urls/${site === 1 ? 'xvd' : 'xnxx'}.txt`, true)).slice(sIndex, eIndex);

    function proxyGenerator() {
        return new Promise((resolve) => {
            let ip_addresses = [];
            let port_numbers = [];

            request(
                'https://sslproxies.org',
                function (error, response, html) {
                    if (!error && response.statusCode == 200) {
                        let $ = cheerio.load(html);
                        $("td:nth-child(1)").each((_, el) => ip_addresses.push($(el).text()));
                        $("td:nth-child(2)").each((_, el) => port_numbers.push($(el).text()));;
                    } else {
                        console.log("Error loading proxy, please try again");
                    }

                    let newArr = [[]];

                    ip_addresses.forEach((ip, i) => {
                        let obj = {
                            proxy: `https://${ip}:${port_numbers[i]}`,
                            ua: userAgents[Math.floor(Math.random() * userAgents.length)]
                        }

                        let lastElement = newArr[newArr.length - 1];

                        if (lastElement.length < proxyArraySize) {
                            lastElement.push(obj);
                        } else {
                            newArr.push([obj]);
                        }
                    });

                    resolve(newArr);
                }
            );
        });
    }

    async function openPage(url, agent, proxy) {
        try {
            request({
                url,
                // url: 'https://checkip.amazonaws.com',
                'method': 'GET',
                proxy,
                headers: {
                    'User-Agent': agent
                }
            }, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log(body);
                }
                else {
                    console.log(error)
                }
            })
        } catch (error) { console.log(error) }
    }

    async function openBrowser(arr) {
        for (let i = 0; i < arr.length; i++) {
            let { proxy, ua } = arr[i]
            await Promise.allSettled(URLS.map((u) => openPage(u, ua, proxy)));
        }
    }

    for (let i = 0; i < 1; i++) {
        console.time(i);
        let proxies = await proxyGenerator();
        await Promise.allSettled(proxies.map(openBrowser));
        console.timeEnd(i);
    }
})();