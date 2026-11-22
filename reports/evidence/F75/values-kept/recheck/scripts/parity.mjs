// Parity: base vs base (noise control) and base vs branch, seed «plain» (no Discogs field) and «fresh browser reading» is not
// reachable in base without its cache, so «plain» plus a written value is the like-for-like screen. Full page, threshold 16.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '/Users/maujrp/mjrp/projects/MJRPpersonal/node_modules/playwright/index.mjs'
import { PNG } from '/Users/maujrp/mjrp/projects/MJRP_AlbumsBalancedPlaylists_v0/node_modules/pngjs/lib/png.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const shots = path.join(here, 'shots'); fs.mkdirSync(shots, { recursive: true })
const URL = (port) => `http://127.0.0.1:${port}/@fs${here}/harness/inventory.html`
const browser = await chromium.launch()
async function shot(port, seed, width, file, source) {
    const phone = width < 768
    const ctx = await browser.newContext({ viewport: { width, height: phone ? 852 : 900 }, ...(phone && { deviceScaleFactor: 2, hasTouch: true, isMobile: true }) })
    const page = await ctx.newPage()
    await page.clock.install({ time: new Date('2026-11-21T15:00:00.000Z') })
    await page.route('**/*', r => { const u = r.request().url(); return u.startsWith('http://127.0.0.1') || u.startsWith('data:') ? r.continue() : r.abort() })
    await page.addInitScript(([s, src]) => { window.__SEED = s; window.__SOURCE = src }, [seed, source])
    await page.goto(URL(port))
    await page.waitForFunction(() => document.body.dataset.ready)
    await page.waitForTimeout(600)
    await page.screenshot({ path: path.join(shots, file), fullPage: true, animations: 'disabled', caret: 'hide' })
    await ctx.close()
    return PNG.sync.read(fs.readFileSync(path.join(shots, file)))
}
function diff(a, b, out) {
    if (a.width !== b.width || a.height !== b.height) return { size: [a.width, a.height, b.width, b.height] }
    const o = new PNG({ width: a.width, height: a.height }); let n = 0; let box = [1e9, 1e9, -1, -1]
    for (let i = 0; i < a.data.length; i += 4) {
        const d = Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2]))
        const p = i / 4, x = p % a.width, y = Math.floor(p / a.width)
        if (d > 16) { n++; o.data.set([255, 0, 0, 255], i); box = [Math.min(box[0], x), Math.min(box[1], y), Math.max(box[2], x), Math.max(box[3], y)] } else o.data.set([a.data[i] / 4, a.data[i + 1] / 4, a.data[i + 2] / 4, 255], i)
    }
    if (out) fs.writeFileSync(path.join(shots, out), PNG.sync.write(o))
    return { px: n, size: [a.width, a.height], box: n ? box : null }
}
const res = {}
for (const width of [1280, 393]) {
    for (const seed of ['plain', 'kept']) {
        const b1 = await shot(5711, seed, width, `par-${seed}-${width}-base1.png`)
        const b2 = await shot(5711, seed, width, `par-${seed}-${width}-base2.png`)
        const af = await shot(5712, seed, width, `par-${seed}-${width}-after.png`)
        res[`${seed}-${width}`] = { baseVsBase: diff(b1, b2), baseVsAfter: diff(b1, af, `par-${seed}-${width}-diff.png`) }
    }
}
fs.writeFileSync(path.join(here, 'parity.json'), JSON.stringify(res, null, 2))
await browser.close()
console.log(JSON.stringify(res))
