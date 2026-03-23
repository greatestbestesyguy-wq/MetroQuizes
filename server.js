const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/scrape', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).json({ error: "Missing Quizlet URL" });

    let browser;
    try {
        // Optimized for maximum speed and lowest memory usage
        browser = await puppeteer.launch({
            headless: "new",
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--single-process',
                '--no-zygote',
                '--disable-gpu'
            ]
        });
        
        const page = await browser.newPage();
        
        // SPEED BOOST: Block images, fonts, and CSS from loading
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        const cards = await page.evaluate(() => {
            const results = [];
            const terms = document.querySelectorAll('.SetPageTerm-wordText');
            const defs = document.querySelectorAll('.SetPageTerm-definitionText');
            for (let i = 0; i < terms.length; i++) {
                results.push({
                    term: terms[i].innerText.trim(),
                    definition: defs[i].innerText.trim()
                });
            }
            return results;
        });

        if (cards.length === 0) throw new Error("No cards found. Make sure the set is public!");
        res.json(cards);

    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (browser) await browser.close();
    }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Scraper active on port ${PORT}`));
