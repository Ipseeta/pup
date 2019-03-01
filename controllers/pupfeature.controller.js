const puppeteer = require('puppeteer'),
    config = require('../config'),
    fetch = require('isomorphic-fetch'),
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
    puppeteer.launch({
        headless: true,
        executablePath: '~/pup/node_modules/puppeteer/.local-chromium/linux-609904/chrome-linux/chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }).then(async browser => {
        const page = await browser.newPage();
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

exports.embed = function (req, res) {
    let url = req.query.url;
    let html;
    if(!url) {
        return res.status(400).end(); 
    }
    if(url.includes('twitter')){
        fetch('https://publish.twitter.com/oembed?url='+url, {
		headers: {
			'User-Agent': 'pup',
			accept: 'application/json',
			'Content-Type': 'application/json',
		},
		method: 'get',
	})
		.then(res => res.json())
		.then(data => {
            html = data.html;
		});
    } else if (url.includes('youtube') || url.includes("youtu.be")) {
        let extractedID;
        if(url.includes('youtube')) {
            extractedID = new URL(url).searchParams.get('v');
        } else {
            extractedID = url.substring(url.lastIndexOf('/')).split('/')[1];
        }
        html = `<iframe id="ytplayer" type="text/html" width="640" height="360" src="https://www.youtube.com/embed/${extractedID}" frameborder="0"></iframe>`;
    } else if (url.includes('gist')) {
        html = `<script src=${url}.js></script>`;
    } else if (url.includes('giphy')) {
        const href = url;
        let extractedID;
        extractedID = url.substring(url.lastIndexOf('-')).split('-')[1];
        html = `<iframe src="https://giphy.com/embed/${extractedID}" width="480" height="480" frameBorder="0" class="giphy-embed" allowFullScreen></iframe><p><a href="${href}">via GIPHY</a></p>`;
    }
    else {
        html = 'Not Found';
        res.status(404);
    }
    res.json({ html: html});
}


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
