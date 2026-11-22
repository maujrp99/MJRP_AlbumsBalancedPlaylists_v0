// F83 wave 5a: where the 20 pixels (of 1 level in 255) of «the list view» at 1280 are. Boxes and computed styles of every element of the bar on both
// pages after the press on the list button, and what differs. Run with the two servers of browser-proof.mjs.
import { chromium } from '@playwright/test'
const [oldBase, newBase] = process.argv.slice(2)
const BLOCKED = /identitytoolkit|securetoken|firestore\.googleapis|firebaseinstallations/
const browser = await chromium.launch()
const take = async (base) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const page = await context.newPage()
    await page.route(BLOCKED, (r) => r.abort())
    await page.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}'; document.head.appendChild(s) }) })
    await page.goto(base + '/albums', { waitUntil: 'load' })
    await page.waitForSelector('#viewModeList', { timeout: 30000 })
    await page.waitForTimeout(1500)
    await page.click('#viewModeList')
    await page.waitForTimeout(600)
    const out = await page.evaluate(() => [...document.querySelectorAll('#series-toolbar-mount *')].map((el, i) => {
        const r = el.getBoundingClientRect(); const c = getComputedStyle(el)
        return [i, el.tagName + (el.id ? '#' + el.id : ''), `${r.x.toFixed(2)},${r.y.toFixed(2)},${r.width.toFixed(2)},${r.height.toFixed(2)}`, c.transform, c.boxShadow, c.backgroundColor, c.borderColor, c.opacity].join(' | ')
    }))
    await context.close()
    return out
}
const [a, b] = [await take(oldBase), await take(newBase)]
console.log('elements', a.length, b.length)
a.forEach((line, i) => { if (line !== b[i]) console.log('OLD', line, '\nNEW', b[i]) })
await browser.close()
