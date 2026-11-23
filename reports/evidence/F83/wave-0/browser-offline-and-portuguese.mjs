// F83 wave 0: «no network» on the way to a React screen not downloaded yet, and the Portuguese preview. Dev server up:
//   node reports/evidence/F83/wave-0/browser-offline-and-portuguese.mjs http://127.0.0.1:5733
import { chromium } from '@playwright/test'
import path from 'node:path'

const base = process.argv[2]
const CAPTURES = path.join(path.dirname(new URL(import.meta.url).pathname), 'captures')
const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await context.newPage()
const say = (what, ok, detail = '') => console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}${detail ? '  ' + detail : ''}`)

await page.goto(base + '/start', { waitUntil: 'load' })
await page.waitForFunction(() => document.getElementById('app')?.children.length > 0, null, { timeout: 30000 })
await page.waitForTimeout(1000)

// Offline: the canary file is not downloaded yet (nothing prefetches React): the router says «No connection», does not reload
await context.setOffline(true)
const marker = await page.evaluate(() => { window.__same_page = 'yes'; return window.__same_page })
await page.evaluate(() => window.router.navigate('/artists'))
await page.waitForFunction(() => document.querySelector('[data-action="retry-screen"]'), null, { timeout: 25000 })
say('offline: the router shows «No connection» with «Try again»', true, await page.evaluate(() => document.getElementById('app').innerText.replace(/\s+/g, ' ').slice(0, 140)))
say('offline: the app was not loaded again (state in memory kept)', (await page.evaluate(() => window.__same_page)) === marker)
await page.screenshot({ path: path.join(CAPTURES, '1280-offline-no-connection.png') })

// Back online: «Try again» brings the screen, with React
await context.setOffline(false)
await page.click('[data-action="retry-screen"]')
await page.waitForFunction(() => document.querySelector('#app h1')?.textContent === 'Artist Series', null, { timeout: 25000 })
say('back online: «Try again» draws the screen, no reload', (await page.evaluate(() => window.__same_page)) === marker)

// Portuguese, as the owner reads it (mark in his own browser): the screen draws again in Portuguese, then English again
await page.evaluate(() => localStorage.setItem('mjrp.lang.preview', 'pt'))
const asked = await page.evaluate(async () => { const t = await import('/js/i18n/t.js'); return t.setLocale('pt') })
await page.waitForTimeout(500)
const pt = await page.evaluate(() => document.querySelector('#app h1').textContent)
say('Portuguese preview: the screen speaks Portuguese', asked === true && pt === 'Séries de artistas', pt)
await page.screenshot({ path: path.join(CAPTURES, '1280-artists-portuguese-preview.png') })
await page.evaluate(async () => { const t = await import('/js/i18n/t.js'); await t.setLocale('en'); localStorage.removeItem('mjrp.lang.preview') })
await page.waitForTimeout(300)
say('and English again', (await page.evaluate(() => document.querySelector('#app h1').textContent)) === 'Artist Series')
await browser.close()
