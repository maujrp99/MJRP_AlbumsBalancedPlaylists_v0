// F83 wave 1, a control for the one pixel difference of browser-proof.mjs (A, 393: 19 pixels apart in the search field, with #app equal).
// It takes the same signed-out /saved-playlists at 393 from production, from the dev server of the screen AS IT WAS, and from the dev
// server of this branch, several times each, and counts the pixels apart for every pair: if the old screen on the dev server is
// apart from production in the same place, the difference is the dev server's (its CSS), not the screen's.
//   node reports/evidence/F83/wave-1/browser-control-393.mjs <old dev> <new dev> <production>
import { chromium } from '@playwright/test'
import { PNG } from 'pngjs'

const [oldBase, newBase, production] = process.argv.slice(2)
const browser = await chromium.launch()
async function shot(base) {
    const context = await browser.newContext({ viewport: { width: 393, height: 852 } })
    const page = await context.newPage()
    await page.goto(base + '/saved-playlists', { waitUntil: 'load' })
    await page.waitForSelector('.empty-state, .list-failed', { timeout: 40000 }).catch(() => {})
    await page.waitForTimeout(2500)
    const buffer = await page.screenshot({ animations: 'disabled', caret: 'hide' })
    await context.close()
    return PNG.sync.read(buffer)
}
function apart(a, b) {
    let n = 0, minx = 1e9, miny = 1e9, maxx = -1, maxy = -1
    for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) {
        const i = (y * a.width + x) * 4
        if (a.data[i] !== b.data[i] || a.data[i + 1] !== b.data[i + 1] || a.data[i + 2] !== b.data[i + 2]) { n++; minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y) }
    }
    return n === 0 ? '0' : `${n} (box ${minx},${miny} to ${maxx},${maxy})`
}
const prod = [await shot(production), await shot(production)]
const was = [await shot(oldBase), await shot(oldBase)]
const is = [await shot(newBase), await shot(newBase)]
console.log('production vs production      ', apart(prod[0], prod[1]))
console.log('screen as it was (dev) vs production', apart(was[0], prod[0]), '|', apart(was[1], prod[1]))
console.log('screen as it is  (dev) vs production', apart(is[0], prod[0]), '|', apart(is[1], prod[1]))
console.log('screen as it was vs as it is (dev)  ', apart(was[0], is[0]), '|', apart(was[1], is[1]))
await browser.close()
