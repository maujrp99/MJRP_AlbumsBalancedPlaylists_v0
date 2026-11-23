// F98 (UAT-307, UAT-308): the browser proof of the two exports on the BUILT site, with MusicKit and Spotify's Web API answered by this script.
//
//   ENGINE=chromium|webkit WIDTH=1280|390 LANGUAGE=en|pt node reports/evidence/F98/browser-proof.mjs <dist>
//
// What the page is given:
//  * the built site, by a small static server on 127.0.0.1 (fallback to app.html, as the hosting answers a deep route);
//  * MusicKit is the stand-in of test/support/musicKitRecorder.js, put at `window.MusicKit` BEFORE the page loads: the real MusicKit script is
//    never asked for (the app loads it only when `window.MusicKit` is missing) and its address is aborted anyway. The stand-in answers the
//    developer token, the authorization, the folders, the catalogue searches and the creation of playlists, and writes every call down;
//  * api.spotify.com answered HERE, never by Spotify;
//  * every other host ABORTED: music.apple.com, itunes.apple.com, geo.music.apple.com, js-cdn.music.apple.com, api.music.apple.com,
//    open.spotify.com, accounts.spotify.com, the production Firebase (identitytoolkit, securetoken, firestore, installations, hosting) and
//    anything else; and any address that is not http(s) to 127.0.0.1 (music://, itms://, spotify:). No link that leaves the site is pressed.
//    No app of this machine is opened or controlled. No key or password is read or typed: the Spotify token is the word «proof-token».
//  * the language is the person's stored choice (`albumblender:lang`), set before the page loads.
// The sentences the page must say are read from the dictionaries of the site (public/js/i18n/<language>/), so the proof is the same in both
// languages; in Portuguese it also checks that no sentence of the English dictionary of the reports is on the screen.
// What it does not prove: what the real MusicKit throws for a real refused account (the stand-in rejects with an Error that carries a
// `status`), the usage event leaving the page (the collector is blocked: proved in test/services/usage), and Spotify's real answers.
import { chromium, webkit } from '@playwright/test'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { installMusicKitRecorder } from '../../../test/support/musicKitRecorder.js'
import { exportWindow as EN } from '../../../public/js/i18n/en/exportWindow.js'
import { exportWindow as PT } from '../../../public/js/i18n/pt/exportWindow.js'

const [dist] = process.argv.slice(2)
if (!dist || !fs.existsSync(path.join(dist, 'app.html'))) throw new Error('give the folder of the built site')
const HERE = path.dirname(new URL(import.meta.url).pathname)
const ENGINE_NAME = process.env.ENGINE === 'webkit' ? 'webkit' : 'chromium'
const ENGINE = ENGINE_NAME === 'webkit' ? webkit : chromium
const WIDTH = process.env.WIDTH === '390' ? 390 : 1280
const LANGUAGE = process.env.LANGUAGE === 'pt' ? 'pt' : 'en'
const PHONE = WIDTH === 390
const TAG = `${ENGINE_NAME}-${WIDTH}-${LANGUAGE}`
const SHOTS = path.join(HERE, 'figures')
const RAW = path.join(HERE, 'raw')
fs.mkdirSync(SHOTS, { recursive: true })
fs.mkdirSync(RAW, { recursive: true })

const NEVER = /music\.apple\.com|itunes\.apple\.com|geo\.music\.apple\.com|js-cdn\.music\.apple\.com|api\.music\.apple\.com|open\.spotify\.com|accounts\.spotify\.com|identitytoolkit|securetoken|firestore\.googleapis|firebaseinstallations|firebaseapp\.com|web\.app|firebaseio\.com/
const SCHEMES = /^(music|musics|itms|itms-apps|spotify):/i

/** The text of a key in the language of this run, with its {placeholders} filled; a key with a plural is picked by the count. */
const D = LANGUAGE === 'pt' ? PT : EN
const say = (key, values = {}) => {
    const text = D[key] ?? D[`${key}.${values.count === 1 ? 'one' : 'other'}`]
    if (text === undefined) throw new Error(`no text for ${key}`)
    return text.replace(/\{(\w+)\}/g, (whole, name) => (name in values ? String(values[name]) : whole))
}
/** The sentences of the two reports in English that have no {placeholder} and differ in Portuguese: none may be on a Portuguese screen. */
const ENGLISH_ONLY = Object.keys(EN)
    .filter(key => /^(appleReport|exportReport|spotifyWindow\.(failure|end|refused|unchecked|retry|notCreated|empty|matched|incomplete$))/.test(key))
    .filter(key => !/\{/.test(EN[key]) && PT[key] !== EN[key] && EN[key].length > 8)
    .map(key => EN[key])

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
/** What the catalogue of the stand-in has: every track but «Nowhere Man». */
const CATALOG = { One: '101', Two: '102', Three: '103', Four: '104' }
/** The playlists as the export names them: the position, the batch of the edit screen, the title. */
const NAMES = ['1. Unsaved Batch - Greatest Hits', '2. Unsaved Batch - Deep Cuts']

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
        if (spot.mode === 'refused') return json({ error: { status: 403, message: 'Check settings on developer.spotify.com/dashboard, the user may not be registered.' } }, 403)
        if (api === '/me') return json({ id: 'u1', display_name: 'Proof' })
        if (api === '/search') {
            const title = (url.searchParams.get('q') || '').match(/track:(.*?) artist:/)?.[1] || 'x'
            if (spot.mode === 'down' || (spot.mode === 'mixed' && title === 'Two')) return json({ error: { status: 500, message: 'Server error' } }, 500)
            const none = spot.mode === 'empty' || /Nowhere/.test(title)
            const id = title.replace(/\W/g, '')
            return json({ tracks: { href: request.url(), items: none ? [] : [{ uri: `spotify:track:${id}`, id, name: title, artists: [{ name: 'Artist' }] }], limit: 5, next: null, offset: 0, previous: null, total: none ? 0 : 1 } })
        }
        if (/^\/users\/u1\/playlists$/.test(api)) { spot.made += 1; return json({ id: `pl-${spot.made}`, external_urls: { spotify: `https://open.spotify.com/playlist/pl-${spot.made}` } }, 201) }
        if (/\/playlists\/[^/]+\/tracks$/.test(api)) return json({ snapshot_id: 's1' }, 201)
        return json({}, 404)
    }
}

const browser = await ENGINE.launch()
const { server, base } = await serve()

/** A fresh visit: its own context (nothing kept from another scenario), the walls, the stand-ins, the language, the playlists on the edit screen. */
async function open({ behavior = {}, spotifyMode = 'ok' } = {}) {
    const context = await browser.newContext({
        viewport: PHONE ? { width: 390, height: 844 } : { width: 1280, height: 900 },
        ...(PHONE ? { hasTouch: true, deviceScaleFactor: 2 } : {}),
        locale: 'en-US', timezoneId: 'America/Sao_Paulo', serviceWorkers: 'block', reducedMotion: 'reduce'
    })
    const spot = { calls: [], made: 0, mode: spotifyMode }
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
    await context.addInitScript(({ recorder, behavior, language }) => {
        window.__mk = []
        window.__mkBehavior = behavior
        // eslint-disable-next-line no-eval
        eval(recorder)(window, window.__mk, window.__mkBehavior)
        try {
            localStorage.setItem('albumblender:lang', language)
            localStorage.setItem('spotify_access_token', 'proof-token')
            localStorage.setItem('spotify_expires_at', String(Date.now() + 3600000))
        } catch { /* none */ }
    }, { recorder: `(${installMusicKitRecorder.toString()})`, behavior: { catalog: CATALOG, folders: [], ...behavior }, language: LANGUAGE })
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

const shoot = async (page, name) => { await page.screenshot({ path: path.join(SHOTS, `${TAG}-${name}.png`), animations: 'disabled', caret: 'hide' }) }
const htmlLang = (page) => page.evaluate(() => document.documentElement.lang)

// ------------------------------------------------------------------------------------------------------------------------------
// Apple Music
// ------------------------------------------------------------------------------------------------------------------------------

/** The Apple Music export from the edit screen: the folder step, then «Export», to the report. */
async function exportToApple(page) {
    if (PHONE) {
        await page.locator('[data-phone-action="export"]').first().click()
        await page.waitForTimeout(600)
        await page.locator('[data-export="apple"]').first().click()
    } else {
        await page.locator('#exportAppleMusicBtn').first().click()
    }
    await page.waitForSelector('[data-apple-folder-step] [data-apple-export]', { timeout: 15000 })
    await page.waitForTimeout(500) // the folders are read
    await page.locator('[data-apple-export]').click()
    await page.waitForSelector('[data-apple-report]', { timeout: 30000 })
    await page.waitForTimeout(400)
}

const apple = {
    text: (page) => page.evaluate(() => document.querySelector('[data-apple-report]')?.textContent.replace(/\s+/g, ' ') ?? ''),
    heading: (page) => page.evaluate(() => document.querySelector('[data-apple-report] [data-export-heading]')?.textContent ?? ''),
    has: (page, selector) => page.evaluate((s) => !!document.querySelector(`[data-apple-report] ${s}`), selector),
    /** The result is a status region and its heading has the focus. */
    announced: (page) => page.evaluate(() => {
        const heading = document.querySelector('[data-apple-report] [data-export-heading]')
        const region = heading?.closest('[role="status"]')
        return !!region && region.getAttribute('aria-live') === 'polite' && document.activeElement === heading
    }),
    lists: (page) => page.evaluate(() => [...document.querySelectorAll('[data-apple-report] details')].map(box => box.textContent.replace(/\s+/g, ' '))),
    calls: (page) => page.evaluate(() => window.__mk.map(call => (call[0] === 'api.music' ? `${call[1]} ${call[2].replace(/\/v1\/catalog\/\w+/, '/catalog')}` : call[0]))),
    /** The window (the panel on the computer, the sheet on the phone) is inside the screen, and the page does not scroll sideways. */
    fits: (page) => page.evaluate(() => {
        const report = document.querySelector('[data-apple-report]')
        const panel = (report?.closest('.app-modal__panel') || report?.closest('.sheet') || report)?.getBoundingClientRect()
        const inner = report?.getBoundingClientRect()
        return !!panel && panel.left >= -0.5 && panel.right <= window.innerWidth + 0.5 && inner.left >= panel.left - 0.5 && inner.right <= panel.right + 0.5 &&
            document.documentElement.scrollWidth <= window.innerWidth + 0.5
    })
}

const NOT_FOUND = [say('appleReport.notFound', { count: 5 }).replace(/^5 /, ''), say('appleReport.empty'), say('appleReport.failure.notFound')]
const saysNotFound = (text) => NOT_FOUND.some(words => text.includes(words)) || /not found|não encontrad/i.test(text)

async function appleScenario(name, label, behavior, check) {
    const side = await open({ behavior })
    const { page } = side
    try {
        await exportToApple(page)
        const text = await apple.text(page)
        // before anything is pressed: the focus is where the report put it
        note(`${label} · the result is a status region and its heading has the focus`, await apple.announced(page))
        await check({ page, text, heading: await apple.heading(page), calls: await apple.calls(page) })
        note(`${label} · the window fits the screen, no sideways scroll`, await apple.fits(page))
        note(`${label} · the page speaks ${LANGUAGE}`, (await htmlLang(page)) === (LANGUAGE === 'pt' ? 'pt-BR' : 'en'), await htmlLang(page))
        if (LANGUAGE === 'pt') {
            const english = ENGLISH_ONLY.filter(words => text.includes(words))
            note(`${label} · no English sentence of the report on a Portuguese screen`, english.length === 0, english.join(' | '))
        }
    } catch (error) {
        note(`${label} · the run itself`, false, error.message.split('\n')[0])
        await shoot(page, `apple-${name}-broken`).catch(() => {})
    }
    note(`${label} · no page error`, side.errors.length === 0, side.errors.join(' | '))
    note(`${label} · the page never left the site`, side.left.length === 0, side.left.join(' | '))
    const calls = await apple.calls(page).catch(() => [])
    fs.writeFileSync(path.join(RAW, `${TAG}-apple-${name}.json`), JSON.stringify({ scenario: name, musicKit: calls, aborted: [...new Set(side.aborted)] }, null, 1))
    note(`${label} · the real MusicKit and Apple were never reached`, !side.aborted.some(url => /apple\.com/.test(url)), side.aborted.filter(url => /apple\.com/.test(url)).join(' | '))
    await side.context.close()
}

const searches = (calls) => calls.filter(call => /^GET \/catalog\/search/.test(call)).length
const creations = (calls) => calls.filter(call => call === 'POST /v1/me/library/playlists').length

// A1. success: everything found, everything created (here the catalogue has «Nowhere Man» too)
await appleScenario('1-success', 'apple success', { catalog: { ...CATALOG, 'Nowhere Man': '105' } }, async ({ page, text, heading, calls }) => {
    note('apple success · the heading is «complete»', heading === say('appleReport.end.complete'), heading)
    note('apple success · both playlists are listed as created, with their tracks, in the folder', text.includes(say('appleReport.created', { count: 2 })) && NAMES.every(name => text.includes(name)) &&
        text.includes(say('appleReport.createdTracks', { count: 3 })) && text.includes(say('appleReport.createdTracks', { count: 2 })) && (await apple.has(page, '[data-apple-folder-line]')), text.slice(0, 300))
    note('apple success · nothing is said to be missing: no list of tracks, no «not created»', !(await apple.has(page, 'details')) && !text.includes(say('appleReport.notCreated')) && !saysNotFound(text), text.slice(0, 400))
    note('apple success · no «Try again»: nothing another try could bring', !(await apple.has(page, '[data-apple-retry]')))
    note('apple success · two playlists were created in the library of the stand-in', creations(calls) === 2, calls.join(' ; ').slice(0, 300))
    await shoot(page, 'apple-1-success')
})

// A2. every search failing (500): nothing could be checked; then Apple Music comes back and «Try again» completes it
await appleScenario('2-down', 'apple 500', { searchFails: true }, async ({ page, text, heading, calls }) => {
    note('apple 500 · the heading is «failed»', heading === say('appleReport.end.failed'), heading)
    note('apple 500 · says the tracks could not be checked', text.includes(say('appleReport.failure.unchecked')), text.slice(0, 240))
    note('apple 500 · counts them: 5 tracks could not be checked', text.includes(say('appleReport.uncheckedCount', { count: 5 })), text.slice(0, 500))
    note('apple 500 · never says «not found»', !saysNotFound(text), text.slice(0, 400))
    note('apple 500 · both playlists are «not created»', text.includes(`${say('appleReport.notCreated')} (2)`), text.slice(0, 400))
    note('apple 500 · offers «Try again»', await apple.has(page, '[data-apple-retry]'))
    note('apple 500 · every track was asked for (5 searches) and nothing was created', searches(calls) === 5 && creations(calls) === 0, calls.join(' ; ').slice(0, 400))
    await shoot(page, 'apple-2-down-500')
    await page.locator('[data-apple-report] details').first().locator('summary').click()
    await shoot(page, 'apple-2-down-500-names')
    await page.evaluate(() => { window.__mkBehavior.searchFails = false })
    await page.locator('[data-apple-retry]').click()
    const done = say('appleReport.end.complete')
    await page.waitForFunction((words) => document.querySelector('[data-apple-report] [data-export-heading]')?.textContent === words, done, { timeout: 30000 })
    await page.waitForTimeout(300)
    const after = await apple.calls(page)
    note('apple 500 · «Try again», with Apple Music back, completes the export: two playlists created', creations(after) === 2 && (await apple.heading(page)) === done, (await apple.text(page)).slice(0, 200))
    note('apple 500 · after the second report the heading has the focus again', await apple.announced(page))
    await shoot(page, 'apple-2-down-then-retry-complete')
})

// A3. a mix: one search fails, one track does not exist, the rest is exported
await appleScenario('3-mixed', 'apple mixed', { searchFailsFor: { Two: 500 } }, async ({ page, text, heading, calls }) => {
    note('apple mixed · NOT headed as a clean success: «Exported, with something left out»', heading === say('exportReport.leftOut') && !text.includes(say('appleReport.end.complete')), heading)
    note('apple mixed · both playlists created with what was found', text.includes(say('appleReport.created', { count: 2 })) && creations(calls) === 2, text.slice(0, 300))
    note('apple mixed · one not found and one not checked, counted apart', text.includes(say('appleReport.notFound', { count: 1 })) && text.includes(say('appleReport.uncheckedCount', { count: 1 })), text.slice(0, 500))
    const lists = await apple.lists(page)
    const unchecked = lists.find(list => list.includes(say('appleReport.uncheckedCount', { count: 1 }))) || ''
    const missing = lists.find(list => list.includes(say('appleReport.notFound', { count: 1 }))) || ''
    note('apple mixed · the track whose search failed is in the «could not be checked» list only', unchecked.includes('Artist - Two') && !missing.includes('Artist - Two') && missing.includes('Nowhere Man'), lists.join(' || '))
    note('apple mixed · offers «Try again» for what was left out, and says what trying again does', (await apple.has(page, '[data-apple-retry]')) && text.includes(say('exportReport.retryPartialNote', { service: 'Apple Music' })), text.slice(-300))
    for (const box of await page.locator('[data-apple-report] details summary').all()) await box.click()
    await shoot(page, 'apple-3-mixed')
})

// A4. the person does not authorize
await appleScenario('4-not-authorized', 'apple not authorized', { authorize: 'denied' }, async ({ page, text, heading, calls }) => {
    note('apple not authorized · the heading is «failed»', heading === say('appleReport.end.failed'), heading)
    note('apple not authorized · says so plainly, with the next step', text.includes(say('appleReport.failure.authorization')) && text.includes(say('appleReport.failure.authorizationNote')), text.slice(0, 300))
    note('apple not authorized · never says «not found» nor «could not be checked»', !saysNotFound(text) && !text.includes(say('appleReport.failure.unchecked')), text.slice(0, 300))
    note('apple not authorized · nothing was searched or created', searches(calls) === 0 && creations(calls) === 0, calls.join(' ; ').slice(0, 300))
    note('apple not authorized · offers «Try again»', await apple.has(page, '[data-apple-retry]'))
    await shoot(page, 'apple-4-not-authorized')
})

// A5. Apple Music refuses the person: 403 on the searches
await appleScenario('5-refused', 'apple 403', { searchFails: true, searchStatus: 403 }, async ({ page, text, heading, calls }) => {
    note('apple 403 · the heading is «failed»', heading === say('appleReport.end.failed'), heading)
    note('apple 403 · says «Apple Music did not allow this for your account», with the next step', text.includes(say('appleReport.failure.refused')) && text.includes(say('appleReport.failure.refusedNote')), text.slice(0, 400))
    note('apple 403 · never says «not found» nor «could not be checked»', !saysNotFound(text) && !text.includes(say('appleReport.uncheckedCount', { count: 1 })), text.slice(0, 400))
    note('apple 403 · the export stopped at the first refused search (1 of 5), nothing created', searches(calls) === 1 && creations(calls) === 0, calls.join(' ; ').slice(0, 300))
    note('apple 403 · both playlists are «not created»', text.includes(`${say('appleReport.notCreated')} (2)`), text.slice(0, 400))
    await shoot(page, 'apple-5-refused-403')
})

// A6. the catalogue answers and has none of the tracks: this, and only this, is «not found»
await appleScenario('6-empty', 'apple nothing in the catalogue', { catalog: {} }, async ({ page, text, heading, calls }) => {
    note('apple empty · the heading is «failed»', heading === say('appleReport.end.failed'), heading)
    note('apple empty · says none of the tracks was found', text.includes(say('appleReport.failure.notFound')), text.slice(0, 300))
    note('apple empty · counts them as not found: 5', text.includes(say('appleReport.notFound', { count: 5 })), text.slice(0, 500))
    note('apple empty · does not say «could not be checked» nor «did not allow»', !text.includes(say('appleReport.failure.unchecked')) && !text.includes(say('appleReport.failure.refused')) && !text.includes(say('appleReport.uncheckedCount', { count: 5 })))
    note('apple empty · no «Try again»: Apple Music answered, and would answer the same', !(await apple.has(page, '[data-apple-retry]')))
    note('apple empty · every search was answered (two per track: with the album, then without)', searches(calls) === 10 && creations(calls) === 0, calls.join(' ; ').slice(0, 300))
    await shoot(page, 'apple-6-empty-not-found')
})

// ------------------------------------------------------------------------------------------------------------------------------
// Spotify: its window again, for the partial result, the softened refusal and the sentences in the language of the app
// ------------------------------------------------------------------------------------------------------------------------------

async function openSpotifyWindow(page) {
    if (PHONE) {
        await page.locator('[data-phone-action="export"]').first().click()
        await page.waitForTimeout(600)
        await page.locator('[data-export="spotify"]').first().click()
    } else {
        await page.locator('#exportSpotifyBtn').first().click()
    }
    await page.waitForSelector('#spotify-export-modal #startExportBtn', { timeout: 15000 })
}
const spotify = {
    text: (page) => page.evaluate(() => document.getElementById('spotify-export-modal')?.textContent.replace(/\s+/g, ' ') ?? ''),
    heading: (page) => page.evaluate(() => document.querySelector('#spotify-export-modal [data-export-heading]')?.textContent ?? ''),
    has: (page, selector) => page.evaluate((s) => !!document.querySelector(`#spotify-export-modal ${s}`), selector),
    announced: (page) => page.evaluate(() => {
        const heading = document.querySelector('#spotify-export-modal [data-export-heading]')
        const region = heading?.closest('[role="status"]')
        return !!region && region.getAttribute('aria-live') === 'polite' && document.activeElement === heading
    }),
    fits: (page) => page.evaluate(() => {
        const panel = document.querySelector('#spotify-export-modal .glass-panel')?.getBoundingClientRect()
        return !!panel && panel.left >= 0 && panel.right <= window.innerWidth + 0.5 && document.documentElement.scrollWidth <= window.innerWidth + 0.5
    })
}

async function spotifyScenario(mode, label, check) {
    const side = await open({ spotifyMode: mode })
    const { page, spot } = side
    try {
        await openSpotifyWindow(page)
        await page.locator('#startExportBtn').click()
        await page.waitForSelector('#spotify-export-modal [data-export-heading]', { timeout: 30000 })
        await page.waitForTimeout(400)
        const text = await spotify.text(page)
        note(`${label} · the result is a status region and its heading has the focus`, await spotify.announced(page))
        await check({ page, spot, text, heading: await spotify.heading(page) })
        note(`${label} · the window fits the screen, no sideways scroll`, await spotify.fits(page))
        if (LANGUAGE === 'pt') {
            const english = ENGLISH_ONLY.filter(words => text.includes(words))
            note(`${label} · no English sentence of the report on a Portuguese screen`, english.length === 0, english.join(' | '))
        }
    } catch (error) {
        note(`${label} · the run itself`, false, error.message.split('\n')[0])
        await shoot(page, `spotify-${mode}-broken`).catch(() => {})
    }
    note(`${label} · no page error`, side.errors.length === 0, side.errors.join(' | '))
    note(`${label} · the page never left the site`, side.left.length === 0, side.left.join(' | '))
    fs.writeFileSync(path.join(RAW, `${TAG}-spotify-${mode}.json`), JSON.stringify({ mode, spotify: spot.calls, aborted: [...new Set(side.aborted)] }, null, 1))
    await side.context.close()
}

// S1. a mix: one search fails, one track does not exist, the rest is exported. NOT a clean success any more (F98)
await spotifyScenario('mixed', 'spotify mixed', async ({ page, spot, text, heading }) => {
    note('spotify mixed · NOT headed as a clean success: «Exported, with something left out»', heading === say('exportReport.leftOut') && !text.includes(say('spotifyWindow.end.complete')), heading)
    note('spotify mixed · the playlist was created with what was found (3 / 5)', text.includes('3 / 5') && spot.made === 1, text.slice(0, 300))
    note('spotify mixed · one not found and one not checked, counted apart', text.includes(say('spotifyWindow.notFound', { count: 1 })) && text.includes(say('spotifyWindow.uncheckedCount', { count: 1 })), text.slice(0, 500))
    note('spotify mixed · offers «Try again» for what was left out, and says what trying again does', (await spotify.has(page, '#retryExportBtn')) && text.includes(say('exportReport.retryPartialNote', { service: 'Spotify' })), text.slice(-300))
    for (const box of await page.locator('#spotify-export-modal details summary').all()) await box.click()
    await shoot(page, 'spotify-1-mixed')
})

// S2. Spotify refuses the account: the text is true for any 403, and keeps the step «ask the owner»
await spotifyScenario('refused', 'spotify 403', async ({ page, spot, text }) => {
    note('spotify 403 · says «Spotify did not allow this for your account»', text.includes(say('spotifyWindow.refused')), text.slice(0, 200))
    note('spotify 403 · names the test list as the most likely reason, and keeps the next step', text.includes(say('spotifyWindow.refusedNote')), text.slice(0, 500))
    if (LANGUAGE === 'en') note('spotify 403 · «the list has only a few places»', text.includes('the list has only a few places') && !text.includes('the list has few places'))
    note('spotify 403 · never says tracks not found, no «Try again»', !/not found|não encontrad/i.test(text) && !(await spotify.has(page, '#retryExportBtn')))
    note('spotify 403 · the export stopped at the first refused search', spot.calls.filter(c => c.startsWith('GET /search')).length === 1, spot.calls.join(' ; '))
    await shoot(page, 'spotify-2-refused-403')
})

// S3. Spotify is down: nothing could be checked, in the language of the app
await spotifyScenario('down', 'spotify 500', async ({ page, text, heading }) => {
    note('spotify 500 · the heading is «failed»', heading === say('spotifyWindow.end.failed'), heading)
    note('spotify 500 · says the tracks could not be checked, and counts them', text.includes(say('spotifyWindow.unchecked')) && text.includes(say('spotifyWindow.uncheckedCount', { count: 5 })), text.slice(0, 400))
    note('spotify 500 · offers «Try again»', (await spotify.has(page, '#retryExportBtn')) && text.includes(say('spotifyWindow.retry')))
    await shoot(page, 'spotify-3-down-500')
})

// S4. Spotify answers and has none: «not found», said by the window in the language of the app
await spotifyScenario('empty', 'spotify empty', async ({ page, text }) => {
    note('spotify empty · says no tracks were found, in the language of the app', text.includes(say('spotifyWindow.failure.notFound')), text.slice(0, 300))
    note('spotify empty · counts them as not found: 5', text.includes(say('spotifyWindow.notFound', { count: 5 })), text.slice(0, 400))
    note('spotify empty · no «Try again»: Spotify answered, and would answer the same', !(await spotify.has(page, '#retryExportBtn')))
    await shoot(page, 'spotify-4-empty-not-found')
})

// S5. everything found but the one track Spotify lacks: still a complete export
await spotifyScenario('ok', 'spotify success', async ({ page, spot, text, heading }) => {
    note('spotify success · the heading is «complete»: a track not found is not a failure', heading === say('spotifyWindow.end.complete'), heading)
    note('spotify success · the playlist was created (4 / 5), no «Try again»', text.includes('4 / 5') && spot.made === 1 && !(await spotify.has(page, '#retryExportBtn')), text.slice(0, 300))
    await shoot(page, 'spotify-5-success')
})

await browser.close()
server.close()
const failed = results.filter(r => !r.ok)
fs.writeFileSync(path.join(RAW, `browser-proof-${TAG}.json`), JSON.stringify({ tag: TAG, passed: results.length - failed.length, failed: failed.length, results }, null, 1))
console.log(`\n${TAG}: ${results.length - failed.length} passed, ${failed.length} failed`)
process.exit(failed.length ? 1 : 0)
