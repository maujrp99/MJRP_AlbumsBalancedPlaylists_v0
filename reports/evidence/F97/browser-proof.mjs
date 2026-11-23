// F97 (UAT-302): the browser proof of the export to Spotify on the BUILT site, with Spotify's Web API answered by this script.
//
//   ENGINE=chromium|webkit WIDTH=1280|390 node reports/evidence/F97/browser-proof.mjs <dist>
//
// What the page is given:
//  * the built site, by a small static server on 127.0.0.1 (fallback to app.html, as the hosting answers a deep route);
//  * api.spotify.com answered HERE, never by Spotify: 403 on everything (the account is not on the app's list), then 500 on the searches,
//    then real-shaped empty results, then a mix; every request it gets is written down;
//  * every other host ABORTED: music.apple.com, itunes.apple.com, geo.music.apple.com, open.spotify.com, accounts.spotify.com, the production
//    Firebase (identitytoolkit, securetoken, firestore, installations, hosting) and anything else; and any address that is not http(s) to
//    127.0.0.1 (music://, itms://, spotify:). No link that leaves the site is pressed. No key or password is read or typed: the token seeded
//    in localStorage is the word «proof-token».
// What it does not prove: the Portuguese texts in the browser (nothing on `main` switches the language yet: they are proved in jsdom,
// test/ui/SpotifyExportWindow.test.js), the usage event leaving the page (the collector is blocked: proved in test/services/usage), and
// Spotify's real answer to a real refused account.
import { chromium, webkit } from '@playwright/test'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const [dist] = process.argv.slice(2)
if (!dist || !fs.existsSync(path.join(dist, 'app.html'))) throw new Error('give the folder of the built site')
const HERE = path.dirname(new URL(import.meta.url).pathname)
const ENGINE_NAME = process.env.ENGINE === 'webkit' ? 'webkit' : 'chromium'
const ENGINE = ENGINE_NAME === 'webkit' ? webkit : chromium
const WIDTH = process.env.WIDTH === '390' ? 390 : 1280
const PHONE = WIDTH === 390
const TAG = `${ENGINE_NAME}-${WIDTH}`
const SHOTS = path.join(HERE, 'figures')
const RAW = path.join(HERE, 'raw')
fs.mkdirSync(SHOTS, { recursive: true })
fs.mkdirSync(RAW, { recursive: true })

const NEVER = /music\.apple\.com|itunes\.apple\.com|geo\.music\.apple\.com|open\.spotify\.com|accounts\.spotify\.com|identitytoolkit|securetoken|firestore\.googleapis|firebaseinstallations|firebaseapp\.com|web\.app|firebaseio\.com/
const SCHEMES = /^(music|musics|itms|itms-apps|spotify):/i

const results = []
const note = (what, ok, detail = '') => {
    results.push({ what, ok, detail: String(detail).slice(0, 600) })
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${TAG} · ${what}${detail ? '  ' + String(detail).slice(0, 240) : ''}`)
}

const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2' }
function serve() {
    const server = http.createServer((req, res) => {
        const url = new URL(req.url, 'http://x')
        if (url.pathname.startsWith('/api/')) { res.writeHead(404, { 'content-type': 'application/json' }); res.end('{}'); return }
        let file = path.join(dist, decodeURIComponent(url.pathname))
        if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, url.pathname.startsWith('/assets') ? 'missing' : 'app.html')
        if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return }
        res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' })
        res.end(fs.readFileSync(file))
    })
    return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` })))
}

const PLAYLISTS = () => {
    const track = (title, album) => ({ id: `t-${title}`, title, artist: 'Artist', album, duration: 200 })
    return [
        { id: 'g1', name: 'Greatest Hits', title: 'Greatest Hits', batchName: 'Mix', tracks: [track('One', 'A'), track('Two', 'A'), track('Three', 'B')] },
        { id: 'g2', name: 'Deep Cuts', title: 'Deep Cuts', batchName: 'Mix', tracks: [track('Four', 'C'), track('Nowhere Man', 'D')] }
    ]
}

/** Spotify, answered by the script. `spot.mode`: refused | down | empty | mixed | ok. Every request is written down. */
function spotifyStandIn(spot) {
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }
    return async (route) => {
        const request = route.request()
        if (request.method() === 'OPTIONS') { await route.fulfill({ status: 204, headers: cors }); return }
        const url = new URL(request.url())
        const api = url.pathname.replace(/^\/v1/, '')
        const json = (body, status = 200) => {
            spot.calls.push(`${request.method()} ${api} -> ${status}`)
            return route.fulfill({ status, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(body) })
        }
        // What Spotify answers an account that is not on the user list of an app in «Development mode» (its documented body)
        if (spot.mode === 'refused') return json({ error: { status: 403, message: 'Check settings on developer.spotify.com/dashboard, the user may not be registered.' } }, 403)
        if (api === '/me') return json({ id: 'u1', display_name: 'Proof' })
        if (api === '/search') {
            const title = (url.searchParams.get('q') || '').match(/track:(.*?) artist:/)?.[1] || 'x'
            if (spot.mode === 'down' || (spot.mode === 'mixed' && title === 'Two')) return json({ error: { status: 500, message: 'Server error' } }, 500)
            const none = spot.mode === 'empty' || /Nowhere/.test(title)
            const id = title.replace(/\W/g, '')
            // the shape Spotify answers a search with: a page of tracks, empty when it has none
            return json({ tracks: { href: request.url(), items: none ? [] : [{ uri: `spotify:track:${id}`, id, name: title, artists: [{ name: 'Artist' }] }], limit: 5, next: null, offset: 0, previous: null, total: none ? 0 : 1 } })
        }
        if (/^\/users\/u1\/playlists$/.test(api)) { spot.made += 1; return json({ id: `pl-${spot.made}`, external_urls: { spotify: `https://open.spotify.com/playlist/pl-${spot.made}` } }, 201) }
        if (/\/playlists\/[^/]+\/tracks$/.test(api)) return json({ snapshot_id: 's1' }, 201)
        return json({}, 404)
    }
}

const browser = await ENGINE.launch()
const { server, base } = await serve()

async function open(mode) {
    const context = await browser.newContext({
        viewport: PHONE ? { width: 390, height: 844 } : { width: 1280, height: 900 },
        ...(PHONE ? { hasTouch: true, deviceScaleFactor: 2 } : {}),
        locale: 'en-US', timezoneId: 'America/Sao_Paulo', serviceWorkers: 'block', reducedMotion: 'reduce'
    })
    const spot = { calls: [], made: 0, mode }
    const aborted = []
    // order: the last route registered is asked first, so the stand-in of Spotify answers before the wall
    await context.route(() => true, (route) => {
        const url = route.request().url()
        let host = ''
        try { host = new URL(url).hostname } catch { /* not an address */ }
        if (/^https?:/.test(url) && host === '127.0.0.1' && !SCHEMES.test(url)) return route.continue()
        aborted.push(url.slice(0, 80))
        return route.abort()
    })
    await context.route(NEVER, route => { aborted.push(route.request().url().slice(0, 80)); return route.abort() })
    await context.route(/^https:\/\/api\.spotify\.com\//, spotifyStandIn(spot))
    await context.addInitScript(() => {
        try {
            localStorage.setItem('spotify_access_token', 'proof-token')
            localStorage.setItem('spotify_expires_at', String(Date.now() + 3600000))
        } catch { /* none */ }
    })
    const page = await context.newPage()
    const errors = []
    const left = []
    page.on('framenavigated', (frame) => { if (frame === page.mainFrame() && !frame.url().startsWith(base) && frame.url() !== 'about:blank') left.push(frame.url()) })
    page.on('pageerror', (e) => { if (!/^Worker Error/.test(e.message)) errors.push(e.message.slice(0, 200)) })
    page.on('console', (m) => {
        if (m.type() !== 'error') return
        if (/favicon|net::ERR|Failed to load resource|posthog|firestore|permission|identitytoolkit|auth\/|^Worker Error|Authentication issue|\[AppleMusic|\[MusicKit|\[SpotifyService\]|\[SpotifyExport|access control checks|due to access control|Could not connect|was blocked|Load failed/i.test(m.text())) return
        errors.push(m.text().slice(0, 200))
    })
    await page.goto(base + '/start', { waitUntil: 'load' })
    await page.waitForFunction(() => document.getElementById('app')?.children.length > 0 && window.router, null, { timeout: 40000 })
    await page.addStyleTag({ content: '#toast-container { visibility: hidden !important }' })
    await page.waitForTimeout(2500)
    await page.addScriptTag({ content: `window.__generated = ${PLAYLISTS.toString()}` })
    await page.waitForFunction(() => window.playlistsStore, null, { timeout: 20000 })
    await page.evaluate(() => { window.playlistsStore.setPlaylists(window.__generated(), 'sA'); window.playlistsStore.setBatchName('Mix'); window.router.navigate('/playlists') })
    await page.waitForSelector('#playlistsGrid .playlist-card, #playlistsGrid [data-phone-playlists]', { timeout: 20000 })
    await page.waitForTimeout(1000)
    return { context, page, spot, errors, left, aborted }
}

async function openWindow(page) {
    if (PHONE) {
        await page.locator('[data-phone-action="export"]').first().click()
        await page.waitForTimeout(600)
        await page.locator('[data-export="spotify"]').first().click()
    } else {
        await page.locator('#exportSpotifyBtn').first().click()
    }
    await page.waitForSelector('#spotify-export-modal #startExportBtn', { timeout: 15000 })
}

const windowText = (page) => page.evaluate(() => document.getElementById('spotify-export-modal')?.textContent.replace(/\s+/g, ' ') ?? '')
const has = (page, selector) => page.evaluate((s) => !!document.querySelector(`#spotify-export-modal ${s}`), selector)
/** The panel of the window is inside the screen, and the page does not scroll sideways. */
const fits = (page) => page.evaluate(() => {
    const panel = document.querySelector('#spotify-export-modal .glass-panel')?.getBoundingClientRect()
    return !!panel && panel.left >= 0 && panel.right <= window.innerWidth + 0.5 && document.documentElement.scrollWidth <= window.innerWidth + 0.5
})
const shoot = async (page, name) => { await page.screenshot({ path: path.join(SHOTS, `${TAG}-${name}.png`), animations: 'disabled', caret: 'hide' }) }

async function scenario(mode, label, check) {
    const side = await open(mode)
    const { page, spot } = side
    try {
        await openWindow(page)
        await page.locator('#startExportBtn').click()
        await page.waitForSelector('#spotify-export-modal .close-modal-btn.w-full', { timeout: 30000 }) // the report: its Close button
        await page.waitForTimeout(400)
        await check({ page, spot, text: await windowText(page) })
        note(`${label} · the window fits the screen, no sideways scroll`, await fits(page))
    } catch (error) {
        note(`${label} · the run itself`, false, error.message.split('\n')[0])
        await shoot(page, `${mode}-broken`).catch(() => {})
    }
    note(`${label} · no page error`, side.errors.length === 0, side.errors.join(' | '))
    note(`${label} · the page never left the site`, side.left.length === 0, side.left.join(' | '))
    fs.writeFileSync(path.join(RAW, `${TAG}-${mode}.json`), JSON.stringify({ mode, spotify: spot.calls, aborted: [...new Set(side.aborted)] }, null, 1))
    await side.context.close()
}

const NOT_FOUND = /not found|No track found/i

// 1. Spotify refuses the account: 403 on every call (REQ-01)
await scenario('refused', '403', async ({ page, spot, text }) => {
    note('403 · says «Spotify did not allow this account»', text.includes('Spotify did not allow this account'), text.slice(0, 200))
    note('403 · gives the next step: limited test phase, ask the owner, Apple Music', /limited test phase/.test(text) && /Ask the owner/.test(text) && /Export to Apple Music is available/.test(text))
    note('403 · promises nothing', !/will be added/i.test(text))
    note('403 · never says tracks not found, nor «matched 0»', !NOT_FOUND.test(text) && !/Tracks matched/.test(text), text.slice(0, 300))
    note('403 · no «Try again» and no «Connect again»: trying again is refused again', !(await has(page, '#retryExportBtn')) && !(await has(page, '#reconnectSpotifyBtn')))
    // `/me` is the site reading the connection when it loads, not the export; the export asks for one track and stops
    note('403 · the export stopped at the first refused search (1 of 5), and every answer was 403', spot.calls.filter(c => c.startsWith('GET /search')).length === 1 && spot.calls.every(c => / -> 403$/.test(c)), spot.calls.join(' ; '))
    note('403 · says the playlist was not created', /Not created \(1\)/.test(text))
    await shoot(page, '1-refused-403')
})

// 2. Spotify is down: 500 on every search (REQ-02, REQ-03), then it comes back and «Try again» works
await scenario('down', '500', async ({ page, spot, text }) => {
    note('500 · says the tracks could not be checked', text.includes('your tracks could not be checked'), text.slice(0, 200))
    note('500 · counts them: 5 tracks could not be checked', text.includes('5 tracks could not be checked'), text.slice(0, 400))
    note('500 · never says tracks not found', !NOT_FOUND.test(text), text.slice(0, 300))
    note('500 · offers «Try again»', await has(page, '#retryExportBtn'))
    note('500 · every track was asked for (5 searches), nothing created', spot.calls.filter(c => c.startsWith('GET /search')).length === 5 && spot.made === 0, spot.calls.join(' ; '))
    await shoot(page, '2-down-500')
    await page.locator('#spotify-export-modal details').first().locator('summary').click()
    await shoot(page, '2-down-500-names')
    spot.mode = 'ok'
    await page.locator('#retryExportBtn').click()
    await page.waitForFunction(() => /Export Complete/.test(document.getElementById('spotify-export-modal')?.textContent || ''), null, { timeout: 30000 })
    const after = await windowText(page)
    note('500 · «Try again», with Spotify back, completes the export', /Export Complete/.test(after) && spot.made === 1, after.slice(0, 200))
    await shoot(page, '2-down-then-retry-complete')
})

// 3. Spotify answers and has none of the tracks: real-shaped empty results. This, and only this, is «not found»
await scenario('empty', 'empty results', async ({ page, spot, text }) => {
    note('empty · says no tracks were found', text.includes('No tracks found on Spotify'), text.slice(0, 200))
    note('empty · counts them as not found: 5', text.includes('5 tracks not found'), text.slice(0, 400))
    note('empty · does not say «could not be checked» nor «did not allow»', !/could not be checked/.test(text) && !/did not allow/.test(text))
    note('empty · every search was answered 200', spot.calls.filter(c => c === 'GET /search -> 200').length === 5, spot.calls.join(' ; '))
    await shoot(page, '3-empty-not-found')
})

// 4. A mix: one search fails, one track does not exist, the rest is exported (REQ-02)
await scenario('mixed', 'mixed', async ({ page, spot, text }) => {
    note('mixed · the export completes with what was found', /Export Complete/.test(text) && spot.made === 1, text.slice(0, 200))
    note('mixed · «3 / 5» matched', text.includes('3 / 5'), text.slice(0, 400))
    note('mixed · one not found and one not checked, counted apart', text.includes('1 tracks not found') && text.includes('1 track could not be checked'), text.slice(0, 500))
    const lists = await page.evaluate(() => [...document.querySelectorAll('#spotify-export-modal details')].map(box => box.textContent.replace(/\s+/g, ' ')))
    const unchecked = lists.find(list => /could not be checked/.test(list)) || ''
    const missing = lists.find(list => /not found/.test(list)) || ''
    note('mixed · the track whose search failed is in the «could not be checked» list only', unchecked.includes('Artist - Two') && !missing.includes('Artist - Two') && missing.includes('Nowhere Man'), lists.join(' || '))
    for (const box of await page.locator('#spotify-export-modal details summary').all()) await box.click()
    await shoot(page, '4-mixed')
})

await browser.close()
server.close()
const failed = results.filter(r => !r.ok)
fs.writeFileSync(path.join(RAW, `browser-proof-${TAG}.json`), JSON.stringify({ tag: TAG, passed: results.length - failed.length, failed: failed.length, results }, null, 1))
console.log(`\n${TAG}: ${results.length - failed.length} passed, ${failed.length} failed`)
process.exit(failed.length ? 1 : 0)
