/**
 * Temporary debug script to analyze track row structure
 */
const puppeteer = require('puppeteer')

async function debug() {
    console.log('=== Track Row Debug ===\n')

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
    await page.setViewport({ width: 1920, height: 1080 })

    // Use correct URL pattern
    const url = 'https://musicboard.app/album/metallica/metallica/'
    console.log('Navigating to:', url)

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })

    // Wait for React to render
    await new Promise(r => setTimeout(r, 5000))

    // Extract all p tags from first track row
    const analysis = await page.evaluate(() => {
        const rows = document.querySelectorAll('div[class*="trackitem_container"]')
        console.log('Found rows:', rows.length)

        if (rows.length === 0) {
            return { error: 'No track rows found', html: document.body.innerHTML.substring(0, 2000) }
        }

        const results = []

        // Analyze first 3 rows
        for (let i = 0; i < Math.min(3, rows.length); i++) {
            const row = rows[i]

            // Get all p tags
            const pTags = Array.from(row.querySelectorAll('p')).map(p => ({
                text: p.innerText.trim(),
                class: p.className
            }))

            // Get title
            const titleEl = row.querySelector('.link-overlay-title') || row.querySelector('a.link-overlay')
            const title = titleEl ? titleEl.innerText.trim() : 'NO TITLE'

            // Look for rating specifically - find p with decimal number
            let rating = null
            for (const p of row.querySelectorAll('p')) {
                const text = p.innerText.trim()
                if (/^\d+\.\d+$/.test(text)) {
                    rating = { value: text, class: p.className }
                    break
                }
            }

            results.push({
                index: i + 1,
                title,
                rating,
                allPTags: pTags,
                rowHTML: row.outerHTML.substring(0, 1500) // First 1500 chars
            })
        }

        return { success: true, results }
    })

    console.log('\n=== Analysis Result ===\n')
    console.log(JSON.stringify(analysis, null, 2))

    await browser.close()
}

debug().catch(console.error)
