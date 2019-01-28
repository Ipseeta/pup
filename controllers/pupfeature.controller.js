const puppeteer = require('puppeteer'),
    config = require('../config'),
    cloudinary = require('cloudinary'),
    fs = require('fs'),
    {
        extractDataFromPerformanceTiming
    } = require('../helpers/helper'),
    {
        URL
    } = require('url');
cloudinary.config(config.cloudinary);

exports.getScreenshot = function (req, res) {
    const url = req.body.url;
    if (!url) {
        return res.status(400).end();
    }
    const options = req.body.options;
    const type = options && options.type ? options.type : 'png';
    const fileName = new Date().getTime() + '.' + type;

    puppeteer.launch().then(async browser => {
        const page = await browser.newPage();
        await page.goto(url);
        var screenshot = await page.screenshot({
            path: options && options.path ? options.path : `${config.uploadDir}/${fileName}`,
            type: type,
            quality: options && Number(options.quality),
            fullPage: options && options.fullPage ? options.fullPage : false,
            clip: options && options.clip,
            omitBackground: options && options.omitBackground,
            encoding: options && options.encoding
        });
        await browser.close();
        if (options && options.encoding) {
            console.log("With encoding");
            fs.writeFile(`${config.uploadDir}/${fileName}`, screenshot, 'base64', function (err) {
                if (!err) {
                    cloudinary.v2.uploader.upload(`${config.uploadDir}/${fileName}`, function (err, result) {
                        if (err) {
                            return res.status(400).end();
                        }
                        res.json({
                            screenshot: result.secure_url
                        });
                    })
                }
            });
        } else {
            cloudinary.v2.uploader.upload(`${config.uploadDir}/${fileName}`, function (err, result) {
                if (err) {
                    return res.status(400).end();
                }
                res.json({
                    screenshot: result.secure_url
                });
            })
        }
    });
}

exports.getContent = function (req, res) {
    const url = req.body.url;
    if (!url) {
        return res.status(400).end();
    }
    puppeteer.launch().then(async browser => {
        const page = await browser.newPage();
        await page.goto(url);
        const result = await page.content();
        await browser.close();
        res.json({
            content: result
        });
    });
    // puppeteer.launch().then(async browserInstance => {
    //     const wsEndpoint = await browserInstance.wsEndpoint();
    //     (async () => {
    //         const browser = await puppeteer.connect({
    //             browserWSEndpoint: wsEndpoint,
    //         });
    //         const page = await browser.newPage();
    //         await page.goto(url);
    //         const result = await page.content();
    //         await browser.close();
    //         res.json({
    //             content: result
    //         });
    //     })();
    // });
}

exports.makePdf = function (req, res) {
    const url = req.body.url;
    if (!url) {
        return res.status(400).end();
    }
    const fileName = new Date().getTime() + '.pdf';
    const options = req.body.options;
    puppeteer.launch().then(async browser => {
        const page = await browser.newPage();
        await page.goto(url);
        const path = options && options.path ? options.path : `${config.uploadDir}/${fileName}`;
        await page.pdf({
            path: path
        });
        await browser.close();
        cloudinary.v2.uploader.upload(path, {
            resource_type: 'raw'
        }, function (err, result) {
            if (err) {
                return res.status(400).end();
            }
            res.json({
                pdf: result.secure_url
            });
        })

    });
}

exports.getStats = function (req, res) {
    const url = req.body.url;
    if (!url) {
        return res.status(400).end();
    }
    puppeteer.launch().then(async browser => {
        const page = await browser.newPage();
        await page.goto(url);
        const performanceTiming = JSON.parse(
            await page.evaluate(() => JSON.stringify(window.performance.timing))
        );
        await browser.close();
        const result = extractDataFromPerformanceTiming(
            performanceTiming,
            'responseEnd',
            'domInteractive',
            'domContentLoadedEventEnd',
            'loadEventEnd'
        );
        res.json({
            stats: result
        });
    });
}

exports.getWSEndpoint = function (req, res) {
    puppeteer.launch().then(async browser => {
        const wsEndpoint = await browser.wsEndpoint();
        res.json({
            wsEndpoint: wsEndpoint
        });
    });
}

exports.getScreencast = function (req, res) {

}

exports.extractPage = function (req, res) {
    let url = req.body.url;
    if (!url) {
        return res.status(400).end();
    }

    let data = {};
    puppeteer.launch().then(async browser => {
        const page = await browser.newPage();

        if(url.indexOf('linkedin.com')!== -1){
            await page.goto('https://linkedin.com');
            await page.focus('input.login-email');
            await page.type('#login-email',config.linkedin.email);
            await page.focus('input.login-password');
            await page.type('#login-password',config.linkedin.password);
            page.click('.submit-button');
            await page.waitForNavigation();
        }
        
        const response = await page.goto(url);
        data.title = await page.title();
        data.url = await page.url();
        data.description = await page.evaluate(getDescription);
        data.image = await page.evaluate(getImage);
        data.content = await page.evaluate(getContent);
        data.favicon_url = await page.evaluate(getFavicon);
        data.type = response.headers()['content-type'];
        data.provider_display = (new URL(data.url)).hostname;
        data.provider_url = data.url;
        await browser.close();
        res.json({
            result: data
        });
    });
};


function getContent() {

    if (document.querySelector('.article-content')) {
        return document.querySelector('.article-content').innerHTML;
    }

    return null;
}

function getFavicon() {
    if (document.querySelector('link[rel="shortcut icon"]')) {
        return document.querySelector('link[rel="shortcut icon"]').href;
    }

    if (document.querySelector('link[rel="icon"]')) {
        return document.querySelector('link[rel="icon"]').href;
    }

    return null;
}

function getDescription() {

    if (document.querySelector('meta[property="og:description"]')) {
        return document.querySelector('meta[property="og:description"]').content;
    }

    if (document.querySelector('[itemprop="description"]')) {
        return document.querySelector('[itemprop="description"]').text;
    }

    if (document.querySelector('meta[name="description"]')) {
        return document.querySelector('meta[name="description"]').content;
    }

    return document.body.innerText.substring(0, 180) + '...';
}

function getImage() {
    if (document.querySelector('meta[property="og:image"]')) {
        return document.querySelector('meta[property="og:image"]').content;
    }

    if (document.querySelector('[itemprop="image"]')) {
        return document.querySelector('[itemprop="image"]').text;
    }

    return null;
}
