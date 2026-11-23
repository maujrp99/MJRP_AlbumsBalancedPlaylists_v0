// F83 wave 6c: one pass in PORTUGUESE on the dev server (the unbuilt site: its modules are importable, so the inventory store takes the items and the language
// is changed by the module of the dictionary, as the owner does with the preview mark). It does not compare with anything: for each state of the inventory screen
// and of the album window it reads every visible text (text nodes, titles, aria-labels, placeholders) and says (1) which English text of the dictionary is still
// there (a fragment of an English dictionary text that the Portuguese one does not have), (2) which element runs over its box or over the page, at 1280 and 393.
// The Discogs of the server is replaced by stand-ins (/api/value-sources, /api/exchange-rates, /api/album-value answer by `page.route`); Firebase Auth and Firestore
// are BLOCKED (identitytoolkit, securetoken, firestore.googleapis, firebaseinstallations). Nothing in a key.
//
//   BASE=http://127.0.0.1:5191 node browser-proof-pt.mjs
import { chromium, devices } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { en } from '../../../../public/js/i18n/en/index.js'
import { pt } from '../../../../public/js/i18n/pt/index.js'

const BASE = process.env.BASE || 'http://127.0.0.1:5191'
const HERE = path.dirname(new URL(import.meta.url).pathname)
const OUT = path.join(HERE, 'raw', 'pt')
fs.mkdirSync(OUT, { recursive: true })
const BLOCKED = /identitytoolkit|securetoken|firestore\.googleapis|firebaseinstallations/

// the English fragments: the literal pieces (between the {placeholders}) of every English text of the dictionary that its Portuguese text does not hold
const FRAGMENTS = new Set()
for (const [key, text] of Object.entries(en)) {
    const other = pt[key] ?? ''
    for (const piece of text.split(/\{\w+\}/)) {
        const clean = piece.trim()
        if (clean.length >= 5 && /[A-Za-z]{4}/.test(clean) && !other.includes(clean) && !/^(Discogs|Spotify|BestEverAlbums|Apple Music|Data provided by Discogs\.)$/.test(clean)) FRAGMENTS.add(clean)
    }
}
// words of English that the screens of the inventory never say in Portuguese (the names of the products are not here)
const WORDS = /\b(Owned|Wishlist|Newest|Oldest|Avg|Value|waiting|Reading|Update|Stop|albums?|Sort|Show|Filters|Format|Status|Close|Cancel|Save|Edit|Delete)\b/

const cover = (hue) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="hsl(${hue},45%,35%)"/></svg>`)}`
const ARTISTS = ['ABBA', 'Blur', 'Cream', 'Genesis', 'Queen', 'Rush']
const ITEMS = Array.from({ length: 14 }, (_, i) => ({
    id: `inv-${String(i).padStart(3, '0')}`,
    title: `Opus ${i}`,
    artist: ARTISTS[i % ARTISTS.length],
    format: ['cd', 'vinyl', 'digital', null][i % 4],
    owned: i % 3 === 0 ? true : (i % 3 === 1 ? null : false),
    albumData: { id: `al-${i}`, title: `Opus ${i}`, artist: ARTISTS[i % ARTISTS.length], coverUrl: cover(i * 29 % 360), tracks: Array.from({ length: 6 }, (_, j) => ({ title: `Faixa ${j}`, position: j + 1, duration: 100 + 20 * j, rank: j + 1, rating: 70 + j, spotifyPopularity: 30 + j })) },
    averages: i % 2 === 0 ? { rating: 70 + i, popularity: 30 + i, ratedTracks: 6, popTracks: 6, tracks: 6 } : undefined,
    addedToInventory: `2026-10-${String(1 + i).padStart(2, '0')}T10:00:00.000Z`
}))

const json = (body) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
const PROFILES = {
    '1280': { reducedMotion: 'reduce', viewport: { width: 1280, height: 900 } },
    '393': { ...devices['iPhone 14'], viewport: { width: 393, height: 852 }, reducedMotion: 'reduce' }
}
const results = []

async function openScreen(browser, profile) {
    const context = await browser.newContext(PROFILES[profile])
    await context.route(BLOCKED, route => route.abort())
    await context.route(/\/api\/value-sources/, route => route.fulfill(json({ data: { discogs: 'on' }, outcome: 'found' })))
    await context.route(/\/api\/exchange-rates/, route => route.fulfill(json({ data: { rates: { USD: 1, EUR: 0.91, GBP: 0.76, BRL: 5.89 }, date: '2026-11-19' }, outcome: 'found' })))
    await context.route(/\/api\/album-value/, route => route.fulfill(json({ data: { release: { id: 249504, title: 'Harvest 1984, Europe', url: 'https://www.discogs.com/release/249504' }, conditions: { mint: 14.5, nearMint: 11.2, veryGoodPlus: 7.9 }, currency: 'USD', readAt: '2026-11-18T10:00:00.000Z' }, outcome: 'found' })))
    await context.addInitScript(() => localStorage.setItem('mjrp.lang.preview', 'pt'))
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(String(error.message || error)))
    await page.goto(`${BASE}/inventory`, { waitUntil: 'load' })
    await page.waitForFunction(() => document.getElementById('app'), null, { timeout: 30000 })
    await page.waitForTimeout(1500)
    const spoke = await page.evaluate(async () => { const t = await import('/js/i18n/t.js'); return t.setLocale('pt') })
    if (!spoke) throw new Error('the site did not change to Portuguese')
    await page.evaluate(async (items) => { const { inventoryStore } = await import('/js/stores/inventory.js'); inventoryStore.setAlbums(items) }, ITEMS)
    await page.waitForSelector(profile === '1280' ? '.inventory-card-wrapper, .inventory-row-wrapper' : '.inv-row, .inv-tile', { timeout: 15000 })
    await page.waitForTimeout(1200)
    return { context, page, errors }
}

const read = (page, fragments, words) => page.evaluate(({ fragments, words }) => {
    const re = new RegExp(words)
    const shown = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
    const texts = []
    const roots = [document.getElementById('app'), ...document.querySelectorAll('.sheet, .modal-overlay, #inventory-edit-modal, #inventory-add-modal')].filter(Boolean)
    for (const root of roots) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
        while (walker.nextNode()) {
            const node = walker.currentNode
            const text = node.textContent.replace(/\s+/g, ' ').trim()
            if (text && node.parentElement && shown(node.parentElement) && !['SCRIPT', 'STYLE'].includes(node.parentElement.tagName)) texts.push(text)
        }
        root.querySelectorAll('[title], [aria-label], [placeholder]').forEach(el => ['title', 'aria-label', 'placeholder'].forEach(a => { const v = el.getAttribute(a); if (v) texts.push(v.trim()) }))
        root.querySelectorAll('option').forEach(o => texts.push(o.textContent.trim()))
    }
    const unique = [...new Set(texts)]
    const english = unique.filter(text => fragments.some(f => new RegExp('(?<![A-Za-z])' + f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![A-Za-z])').test(text)) || (re.test(text) && !/^(Opus \d+|Faixa \d+)$/.test(text)))
    const over = []
    const view = window.innerWidth
    for (const root of roots) {
        root.querySelectorAll('*').forEach(el => {
            if (!shown(el)) return
            const s = getComputedStyle(el)
            const clipped = !el.classList.contains('sr-only') && el.scrollWidth > el.clientWidth + 1 && !['auto', 'scroll'].includes(s.overflowX) && s.textOverflow !== 'ellipsis' && el.clientWidth > 0 && !/^(svg|path|option|select)$/i.test(el.tagName) && el.children.length === 0
            const r = el.getBoundingClientRect()
            const out = r.right > view + 1 && r.width < view * 2 && !el.closest('.overflow-x-auto, [style*="overflow-x"]')
            if (clipped || out) over.push(`${clipped ? 'clipped' : 'beyond the page'}: ${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 3).join('.')} "${(el.textContent || '').trim().slice(0, 50)}" ${Math.round(r.width)}px`)
        })
    }
    return { count: unique.length, english, over: [...new Set(over)].slice(0, 12), pageWide: document.documentElement.scrollWidth > window.innerWidth + 1, sample: unique.slice(0, 400) }
}, { fragments: [...fragments], words })

async function run(profile, name, steps) {
    const browser = await chromium.launch()
    const { context, page, errors } = await openScreen(browser, profile)
    try { await steps(page) } catch (error) { errors.push(`STEP: ${String(error.message).slice(0, 200)}`) }
    await page.waitForTimeout(600)
    const facts = await read(page, FRAGMENTS, WORDS.source)
    const slug = `${profile}-${name.replace(/\W+/g, '_')}`
    await page.screenshot({ path: path.join(OUT, `${slug}.png`) })
    const ok = facts.english.length === 0 && facts.over.length === 0 && !facts.pageWide && errors.length === 0
    results.push({ profile, name, ok, texts: facts.count, english: facts.english, over: facts.over, pageWide: facts.pageWide, errors, sample: facts.sample })
    console.log(`${ok ? 'PASS' : 'FAIL'}  [${profile}] ${name}: ${facts.count} texts, English left ${facts.english.length}${facts.english.length ? ' ' + JSON.stringify(facts.english.slice(0, 4)) : ''}, over ${facts.over.length}${facts.over.length ? ' ' + facts.over.slice(0, 2).join(' / ') : ''}${facts.pageWide ? ', PAGE WIDER THAN THE SCREEN' : ''}${errors.length ? ', errors: ' + errors[0] : ''}`)
    await browser.close()
}

const tap = (profile, page, selector, index = 0) => (profile === '1280' ? page.locator(selector).nth(index).click() : page.locator(selector).nth(index).tap())

for (const profile of ['1280', '393']) {
    await run(profile, 'the screen', async () => { })
    if (profile === '1280') {
        await run(profile, 'the gallery with the order by value', async (p) => { await p.selectOption('#inventorySort', 'value_asc') })
        await run(profile, 'every order read from the select', async (p) => { for (const v of ['averageRating', 'averagePopularity_asc', 'addedToInventory']) await p.selectOption('#inventorySort', v) })
        await run(profile, 'the header: a status pressed', async (p) => { await tap(profile, p, '[data-status-count="wishlist"]') })
        await run(profile, 'the notice of the albums that wait, then Ler todos agora', async (p) => { await p.locator('[data-notice-action="read-values"]').first().click(); await p.waitForTimeout(700) })
        await run(profile, 'the euro chosen: the notes of the totals', async (p) => { await p.locator('[data-currency="EUR"]').first().click() })
        await run(profile, 'the album window of a card, the value and where to buy', async (p) => { await p.locator('.inventory-card-wrapper [data-action="view-modal"]').first().click(); await p.waitForSelector('.modal-overlay.album-window'); await p.waitForTimeout(700) })
        await run(profile, 'the window to edit an item', async (p) => { await p.locator('.edit-album-btn').first().click(); await p.waitForSelector('#inventory-edit-modal') })
    } else {
        await run(profile, 'the sheet of filters and order', async (p) => { await tap(profile, p, '[data-phone-action="filters"]'); await p.waitForTimeout(500) })
        await run(profile, 'the sheet of the status of an album', async (p) => { await tap(profile, p, '.inv-row__status'); await p.waitForTimeout(500) })
        await run(profile, 'the sheet of an album: the value and where to buy', async (p) => { await tap(profile, p, '.inv-row__more'); await p.waitForTimeout(500) })
        await run(profile, 'the sheet of the actions', async (p) => { await tap(profile, p, '[data-phone-action="actions"]'); await p.waitForTimeout(500) })
        await run(profile, 'the album window', async (p) => { await tap(profile, p, '.inv-row__open'); await p.waitForSelector('.modal-overlay.album-window'); await p.waitForTimeout(700) })
    }
}
const failed = results.filter(r => !r.ok)
fs.writeFileSync(path.join(OUT, 'results-pt.json'), JSON.stringify({ total: results.length, failed: failed.length, results }, null, 1))
console.log(`\nPortuguese pass: ${results.length - failed.length} of ${results.length} states clean`)
process.exit(0)
