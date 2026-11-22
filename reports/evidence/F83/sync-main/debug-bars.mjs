// How many bars the row has, and how wide it is, on each build (used while looking at the first load in WebKit).
import { webkit, chromium } from '@playwright/test'
const [oldBase, newBase] = process.argv.slice(2)
const engine = process.env.ENGINE === 'webkit' ? webkit : chromium
const browser = await engine.launch()
for (const [name, base] of [['old', oldBase], ['new', newBase]]) {
    const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })).newPage()
    await page.route(/identitytoolkit|securetoken|firestore\.googleapis|firebaseinstallations/, (r) => r.abort())
    await page.goto(base + (process.env.ROUTE || '/start'), { waitUntil: 'load' })
    for (const ms of [200, 1500]) {
        await page.waitForTimeout(ms)
        console.log(name, ms, JSON.stringify(await page.evaluate(() => { const row = document.querySelector('#top-menu-bar .eqbar'); const i = row.querySelector('i'); return { bars: row.children.length, width: row.getBoundingClientRect().width, barW: i.getBoundingClientRect().width, barH: i.getBoundingClientRect().height, state: document.readyState, html: document.documentElement.className, reduce: matchMedia('(prefers-reduced-motion: reduce)').matches, anim: getComputedStyle(i).animationName, tf: getComputedStyle(i).transform, h: getComputedStyle(i).height } })))
    }
}
await browser.close()
