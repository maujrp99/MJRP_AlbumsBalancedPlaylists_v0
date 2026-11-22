// Why do two pages with the same boxes and styles draw a badge differently? node reports/evidence/F83/wave-5b/locate-raster.mjs <old base> <new base>
// Opens the window to edit a series on both, scans, turns the singles on, and compares the picture of the first card of the picker as it is, with the
// image hidden, with the backdrop blur of the badge taken off, with both, and after the card is moved by a pixel and back (a new raster).
import { chromium } from '@playwright/test'
import { PNG } from 'pngjs'
import fs from 'node:fs'

const [oldBase, newBase] = process.argv.slice(2)
const proof = fs.readFileSync(new URL('./browser-proof.mjs', import.meta.url), 'utf8')
const grab = (name) => proof.match(new RegExp('const ' + name + ' = `([\\s\\S]*?)`\n'))[1]
const WORLD = grab('WORLD')
const STUBS = grab('STUBS')
const browser = await chromium.launch()

async function open(base) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const page = await context.newPage()
    await page.route(/identitytoolkit|securetoken|firestore\.googleapis|firebaseinstallations/, (r) => r.abort())
    await page.route(/mzstatic\.com/, (route) => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="#556"/></svg>' }))
    await page.addInitScript(() => { try { localStorage.setItem('albumsPageSize', '10') } catch { /* none */ } })
    await page.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}'; document.head.appendChild(s) }) })
    await page.goto(base + '/albums', { waitUntil: 'load' })
    await page.waitForFunction(() => window.albumLoadService && document.querySelector('#series-grid-mount'), null, { timeout: 40000 })
    await page.waitForTimeout(1200)
    await page.evaluate(`(${WORLD})`)
    await page.waitForTimeout(700)
    await page.evaluate(`(${STUBS})`)
    await page.waitForTimeout(1800)
    await page.click('[data-action="edit-series"][data-series-id="s0"]')
    await page.waitForTimeout(400)
    await page.click('[data-album-picker] input')
    await page.keyboard.type('kendrick lamar')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(700)
    await page.click('[data-album-picker] [data-filter="singles"]')
    await page.mouse.move(5, 5)
    await page.waitForTimeout(800)
    return { context, page }
}

const apart = (a, b) => { const one = PNG.sync.read(a), two = PNG.sync.read(b); if (one.width !== two.width || one.height !== two.height) return Infinity; let n = 0; for (let i = 0; i < one.data.length; i += 4) if (one.data[i] !== two.data[i] || one.data[i + 1] !== two.data[i + 1] || one.data[i + 2] !== two.data[i + 2]) n++; return n }
const sides = [await open(oldBase), await open(newBase)]
const shot = (page) => page.locator('[data-picker-grid] > [data-action="pick-album"]').nth(3).screenshot()
const variants = {
    'as it is': async () => {},
    'the card moved by a pixel and back (a new raster)': (page) => page.evaluate(async () => { const g = document.querySelector('[data-picker-grid]'); g.style.paddingTop = '1px'; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); g.style.paddingTop = '' }),
    'the window scrolled by a pixel and back': (page) => page.evaluate(async () => { const b = document.querySelector('.app-modal__body'); b.scrollTop += 1; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); b.scrollTop -= 1 }),
    'the badges replaced by clones of themselves (a node made now)': (page) => page.evaluate(() => document.querySelectorAll('[data-picker-grid] .backdrop-blur-md').forEach(i => i.replaceWith(i.cloneNode(true)))),
    'the cover hidden': (page) => page.evaluate(() => document.querySelectorAll('[data-picker-grid] img').forEach(i => { i.style.visibility = 'hidden' })),
    'the blur of the badge off': (page) => page.evaluate(() => document.querySelectorAll('[data-picker-grid] .backdrop-blur-md').forEach(i => i.classList.remove('backdrop-blur-md')))
}
for (const [name, apply] of Object.entries(variants)) {
    for (const side of sides) await apply(side.page)
    await sides[0].page.waitForTimeout(500)
    const [a, b] = [await shot(sides[0].page), await shot(sides[1].page)]
    console.log(`${name}: ${apart(a, b)} px apart`)
}
await browser.close()
