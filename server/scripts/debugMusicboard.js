/**
 * Debug script to capture Musicboard page HTML
 */

const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')

async function debugMusicboard() {
    console.log('=== Musicboard Debug ===\n')

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')

    // Capture console logs
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));

    await page.setViewport({ width: 1920, height: 1080 })

    // Navigate to album page
    const albumCli = process.argv[2] || 'metallica'
    const artistCli = process.argv[3] || 'metallica'

    // Normalize logic similar to actual scraper
    const formatSlug = (str) => str.toLowerCase()
        .replace(/ \((remastered|remaster|deluxe|edition|expanded).*\)/g, '')
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

    const albumSlug = formatSlug(albumCli)
    const artistSlug = formatSlug(artistCli)

    // Pattern: /album/{album-slug}/{artist-slug}/
    const url = `https://musicboard.app/album/${albumSlug}/${artistSlug}/`
    console.log('Navigating to:', url)

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })

    // Wait for React to render
    await new Promise(r => setTimeout(r, 5000))

    // Take screenshot
    const screenshotPath = path.join(__dirname, 'musicboard-debug.png')
    await page.screenshot({ path: screenshotPath, fullPage: true })
    console.log('Screenshot saved to:', screenshotPath)

    // Get page HTML
    const html = await page.content()
    const htmlPath = path.join(__dirname, 'musicboard-debug.html')
    fs.writeFileSync(htmlPath, html)
    console.log('HTML saved to:', htmlPath)

    // Log all elements that might contain track info
    const elements = await page.evaluate(() => {
        const results = {
            h1: [],
            h2: [],
            trackLike: [],
            listItems: [],
            tables: [],
            divWithNumbers: []
        }

        // Get all h1 and h2
        document.querySelectorAll('h1').forEach(el => {
            results.h1.push(el.textContent.trim().substring(0, 100))
        })
        document.querySelectorAll('h2').forEach(el => {
            results.h2.push(el.textContent.trim().substring(0, 100))
        })

        // Find elements with "track" in class
        document.querySelectorAll('[class*="track"], [class*="Track"]').forEach(el => {
            results.trackLike.push({
                tag: el.tagName,
                class: el.className.substring(0, 100),
                text: el.textContent.trim().substring(0, 100)
            })
        })

        // Find list items
        document.querySelectorAll('li').forEach(el => {
            const text = el.textContent.trim()
            if (text.length > 5 && text.length < 100) {
                results.listItems.push(text.substring(0, 80))
            }
        })

        // Find tables
        document.querySelectorAll('table').forEach(el => {
            results.tables.push(el.textContent.trim().substring(0, 200))
        })

        // Find divs with numbers (ratings)
        document.querySelectorAll('div').forEach(el => {
            const text = el.textContent.trim()
            if (/^\d+(\.\d+)?$/.test(text) && parseFloat(text) <= 10) {
                results.divWithNumbers.push({
                    class: el.className.substring(0, 50),
                    text: text
                })
            }
        })

        return results
    })

    console.log('\n=== Page Elements Found ===')
    console.log('H1:', elements.h1)
    console.log('H2:', elements.h2)
    console.log('Track-like elements:', elements.trackLike.length)
    elements.trackLike.slice(0, 5).forEach(e => console.log('  -', e))
    console.log('List items (first 10):', elements.listItems.slice(0, 10))
    console.log('Tables:', elements.tables.length)
    console.log('Divs with numbers:', elements.divWithNumbers.slice(0, 10))

    await browser.close()
    console.log('\n=== Debug Complete ===')
}

debugMusicboard().catch(console.error)
