const puppeteer = require('puppeteer'),
    config = require('../config'),
    cloudinary = require('cloudinary'),
    fs = require('fs');
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

exports.getWSEndpoint = function (req, res) {
    puppeteer.launch().then(async browser => {
        const wsEndpoint = await browser.wsEndpoint();
        res.json({
            wsEndpoint: wsEndpoint
        });
    });
}