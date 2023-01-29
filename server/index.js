const express = require('express')
const puppeteer = require('puppeteer')
require('dotenv').config()
const cheerio = require('cheerio')

////////////////////////////////////

const app = express()
app.use(express.json())

app.listen(process.env.PORT, () => {
    console.log(`Server started on ${process.env.PORT} port`)
})

app.get('/getupdates', async (req, res) => {
    if (req.query.processor) {
        const result = await lib.getItemsProc(req.query.processor, elements)
        res.json({status: "ok", data: result})
    }
    res.status(403).json({status: "error", message: "endpoint forbidden"})
})

/////////////////

class PuppeteerHandler {
    constructor() {
        this.browser = null;
    }
    async initBrowser() {
        // this.browser = await puppeteer.launch(LAUNCH_PUPPETEER_OPTS);
        this.browser = await puppeteer.launch({
            headless: false,
            slowMo: 100,
            // devtools: true
        });
    }
    closeBrowser() {
        this.browser.close();
    }
    async getPageContent(url, selector) {
        if (!this.browser) {
            await this.initBrowser();
        }

        try {
            const page = await this.browser.newPage();
            console.log('stage1')
            await page.goto(url, PAGE_PUPPETEER_OPTS);
            console.log('stage2')
            await page.waitForSelector(selector)
            console.log('stage3')
            const content = await page.content()
            page.close()
            return cheerio.load(content)
        } catch (err) {
            throw err;
        }
    }

    async getItemsProc(processor, elements) {
        const processors = []
        for(let el of elements) {
            try {
                const $ = await lib.getPageContent(el.url(processor), el.selector)
                // const sep = `${el.selector.split('.')[0]}[class=${el.selector.split('.')[1]}]`
                const arr = el.getItems($, el.selector)
                processors.push(...arr)
                // $(el.selector).each(function (i, element) {
                //     const title = $(element).find("a.catalog-product__name>span").text()
                //     const link = "https://dns-shop.ru" + $(element).find("a.catalog-product__name").attr("href")
                //     const price = Number($(element).find("div.product-buy__price").text().match(/\d/gm).join(''))
                //
                //     processors.push({
                //         title, link, price
                //     })
                // })

                // const all = $
                // all.each((i, elem) => {
                //     const div = $(this).text()
                //     processors.push(div)
                // })
            } catch (e) {
                console.log('oshibka', e)
            }
        }
        return processors
    }
}

const PAGE_PUPPETEER_OPTS = {
    networkIdle2Timeout: 5000,
    waitUntil: 'networkidle2',
    timeout: 3000000
};

const LAUNCH_PUPPETEER_OPTS = {
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080'
    ]
};

const lib = new PuppeteerHandler

const elements = [
    {
        url: (processor) => `https://www.dns-shop.ru/catalog/17a899cd16404e77/processory/?order=6&q=${processor}`,
        selector: "div.catalog-product",
        getItems: function ($, selector) {
            const processors = []
            $(selector).each(function (i, element) {
                const title = $(element).find("a.catalog-product__name>span").text()
                const link = "https://dns-shop.ru" + $(element).find("a.catalog-product__name").attr("href")
                const price = Number($(element).find("div.product-buy__price").text().match(/\d/gm).join(''))

                processors.push({
                    title, link, price
                })
            })
            return processors
        },
    },
    {
        url: (processor) => `https://www.wildberries.ru/catalog/0/search.aspx?page=1&sort=popular&search=${processor}&fbrand=21223`,
        selector: "div.product-card__wrapper",
        getItems: function ($, selector) {
            const processors = []
            $(selector).each(function (i, element) {
                const title = $(element).find("span.goods-name").text()
                const link = $(element).find("a.product-card__main").attr("href")
                const price = Number($(element).find("ins.price__lower-price").text().match(/\d/gm).join(''))

                processors.push({
                    title, link, price
                })
            })
            return processors
        }
    },
    {
        url: (processor) => `https://www.citilink.ru/search/?text=${processor}&menu_id=26&pf=&f=intel`,
        selector: "div.product_data__gtm-js",
        getItems: function ($, selector) {
            const processors = []
            $(selector).each(function (i, element) {
              const title = $(element).find("a.ProductCardVertical__name").text()
              const link = "https://www.citilink.ru" + $(element).find("a.ProductCardVertical__name").attr("href")
              const price = Number($(element).find("div.ProductCardVerticalLayout__wrapper-price").find("span.ProductCardVerticalPrice__price-current_current-price").text().match(/\d/gm).join(''))
              processors.push({
                  title, link, price
              })
            })
            return processors
        }
    }
];