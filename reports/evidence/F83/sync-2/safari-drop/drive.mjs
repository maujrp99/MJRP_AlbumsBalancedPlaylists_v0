// Drives the box of main.tsx with a mouse drag in WebKit (Safari's engine) and in Chromium, and writes down which rows carry what after the drop.
// Run: ENGINE=webkit node drive.mjs   (a `vite` server of vite.config.mjs on :5199 must be up)
import { chromium, webkit } from '@playwright/test'

const engine = process.env.ENGINE === 'webkit' ? webkit : chromium
const browser = await engine.launch()
const page = await browser.newPage({ viewport: { width: 500, height: 500 } })
await page.goto(`http://localhost:5199/${process.env.FRESH ? '?fresh=1' : ''}`)
await page.waitForSelector('.rank-row')

const state = () => page.evaluate(() => [...document.querySelectorAll('.rank-row')].map(row => ({ text: row.textContent, cls: row.className, hover: row.matches(':hover') })))
const rows = await page.$$('.rank-row')
const from = await rows[0].boundingBox()
const to = await rows[3].boundingBox()
await page.mouse.move(from.x + 20, from.y + from.height / 2)
await page.mouse.down()
await page.mouse.move(from.x + 22, from.y + from.height / 2 + 6, { steps: 4 })
await page.mouse.move(to.x + 20, to.y + to.height / 2 + 4, { steps: 12 })
const during = await state()
await page.mouse.up()
await page.waitForTimeout(600)
const after = await state()
await page.mouse.move(to.x + 40, to.y + to.height / 2 + 6, { steps: 3 })
await page.waitForTimeout(300)
const afterMove = await state()
await page.screenshot({ path: `after-drop-${process.env.ENGINE || 'chromium'}${process.env.TAG ? '-' + process.env.TAG : ''}.png` })
const brief = (list) => list.map(row => `${row.text}${row.hover ? ' (hover)' : ''}${row.cls.includes('ring') || row.cls.includes('opacity') ? ' [lit by class]' : ''}`).join(' | ')
console.log(`${process.env.ENGINE || 'chromium'}\n during : ${brief(during)}\n after  : ${brief(after)}\n moved  : ${brief(afterMove)}`)
await browser.close()
