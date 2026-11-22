// Where two pages that draw the same card differ in their boxes and styles: node reports/evidence/F83/wave-5b/locate-box.mjs <old base> <new base>
// Opens the window to edit a series on both, scans, turns the singles on, and compares every element of the cards of the picker: its box
// (to 0.001 px) and the styles that decide how its letters are drawn (font, size, spacing, transform, opacity, filter, backdrop filter, position).
import { chromium } from '@playwright/test'
import fs from 'node:fs'

const [oldBase, newBase] = process.argv.slice(2)
const proof = fs.readFileSync(new URL('./browser-proof.mjs', import.meta.url), 'utf8')
const grab = (name) => proof.match(new RegExp('const ' + name + ' = `([\\s\\S]*?)`\n'))[1]
const WORLD = grab('WORLD')
const STUBS = grab('STUBS')
const browser = await chromium.launch()

async function measure(base) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const page = await context.newPage()
    await page.route(/identitytoolkit|securetoken|firestore\.googleapis|firebaseinstallations/, (r) => r.abort())
    await page.route(/mzstatic\.com/, (route) => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="#556"/></svg>' }))
    await page.addInitScript(() => { try { localStorage.setItem('albumsPageSize', '10') } catch { /* none */ } })
    await page.goto(base + '/albums', { waitUntil: 'load' })
    await page.waitForFunction(() => window.albumLoadService && document.querySelector('#series-grid-mount'), null, { timeout: 40000 })
    await page.waitForTimeout(1200)
    await page.evaluate(`(${WORLD.trim().startsWith('(') ? WORLD : '(' + WORLD + ')'})`)
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
    await page.waitForTimeout(500)
    const rows = await page.evaluate(() => {
        const keys = ['fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'lineHeight', 'transform', 'opacity', 'filter', 'backdropFilter', 'position', 'color', 'backgroundColor', 'willChange', 'zIndex', 'overflow']
        const out = []
        const walk = (el, path) => {
            const r = el.getBoundingClientRect()
            const cs = getComputedStyle(el)
            out.push([path + '>' + el.tagName.toLowerCase() + '.' + String(el.className).slice(0, 24), [r.x, r.y, r.width, r.height].map(n => n.toFixed(3)).join(','), keys.map(k => cs[k]).join('|')])
            ;[...el.children].forEach((child, i) => walk(child, path + '/' + i))
        }
        document.querySelectorAll('[data-picker-grid] > [data-action="pick-album"]').forEach((card, i) => walk(card, 'card' + i))
        return out
    })
    const raw = await page.evaluate(() => document.querySelectorAll('[data-picker-grid] > [data-action="pick-album"]')[3].outerHTML)
    await context.close()
    return { rows, raw }
}

const [first, second] = [await measure(oldBase), await measure(newBase)]
console.log('RAW old', first.raw.slice(0, 900))
console.log('RAW new', second.raw.slice(0, 900))
const [a, b] = [first.rows, second.rows]
await browser.close()
let different = 0
a.forEach((row, i) => {
    const other = b[i]
    if (!other || row[0] !== other[0] || row[1] !== other[1] || row[2] !== other[2]) { different++; console.log('DIFF', row[0], '\n  old', row[1], row[2], '\n  new', other?.[1], other?.[2]) }
})
console.log(`${a.length} elements old, ${b.length} new, ${different} differ`)
