// F83 wave 8a: the golden of the MusicKit calls (test/fixtures/exportMusicKitRecording.json, recorded ONCE on the code before the move) played on the BUILT site.
//
//   ENGINE=chromium|webkit node recording-built.mjs <dist of the build>
//
// The built site is served (fallback to app.html). MusicKit is the SAME recorder function the golden used in jsdom (test/support/musicKitRecorder.js), installed at
// `window.MusicKit` before the page loads: the same seam on both sides. For every scenario of test/support/exportRecordingScenarios.js a fresh page asks the built
// export entries (the lazy file of the build that holds them, found by what its functions do: their code names `handleExportToAppleMusic`, `handleExportJson`
// and `listFolders`) for the same steps, and what the recorder wrote (token request, configure, getInstance, authorize, every api.music with its path, params and
// body, in order), the progress texts and the notices the person got are compared with the golden. The pauses between two creations are real here (500 ms): they are
// not an SDK call, so they are not compared; the type and duration of a notice are not visible in the page, so its text is. Nothing touches Apple.
import { chromium, webkit } from '/Users/maujrp/mjrp/projects/MJRPpersonal/node_modules/playwright/index.mjs'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { installMusicKitRecorder } from '../../../../test/support/musicKitRecorder.js'
import { exportRecordingScenarios, playlistsOf } from '../../../../test/support/exportRecordingScenarios.js'

const [dist] = process.argv.slice(2)
const HERE = path.dirname(new URL(import.meta.url).pathname)
const ENGINE_NAME = process.env.ENGINE === 'webkit' ? 'webkit' : 'chromium'
const ENGINE = ENGINE_NAME === 'webkit' ? webkit : chromium
const GOLDEN = JSON.parse(fs.readFileSync(path.join(HERE, '../../../../test/fixtures/exportMusicKitRecording.json'), 'utf8'))
const BLOCKED = /identitytoolkit|securetoken|firestore\.googleapis|firebaseinstallations/
const SDK = new Set(['fetch', 'MusicKit.configure', 'MusicKit.getInstance', 'authorize', 'api.music'])
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.json': 'application/json' }

const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x')
    if (url.pathname.startsWith('/api/')) { res.writeHead(404); res.end('{}'); return }
    let file = path.join(dist, decodeURIComponent(url.pathname))
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, url.pathname.startsWith('/assets') ? 'missing' : 'app.html')
    if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' })
    fs.createReadStream(file).pipe(res)
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const base = `http://127.0.0.1:${server.address().port}`
const entriesFile = fs.readdirSync(path.join(dist, 'assets')).find(name => /^playlistExportEntries-.*\.js$/.test(name))
const exportsFile = fs.readdirSync(path.join(dist, 'assets')).find(name => /^playlistExports-.*\.js$/.test(name))
if (!entriesFile) throw new Error('the build has no playlistExportEntries file')

const browser = await ENGINE.launch()
const results = []
const note = (what, ok, detail = '') => { results.push({ what, ok, detail: String(detail).slice(0, 600) }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}${detail ? '  ' + String(detail).slice(0, 300) : ''}`) }
let totalCalls = 0

for (const scenario of exportRecordingScenarios) {
    const context = await browser.newContext({ locale: 'en-US', timezoneId: 'America/Sao_Paulo', serviceWorkers: 'block' })
    await context.route(url => new URL(url).hostname !== '127.0.0.1', route => route.abort())
    await context.route(BLOCKED, route => route.abort())
    await context.addInitScript(({ recorder, behavior }) => {
        window.__mk = []
        // eslint-disable-next-line no-eval
        eval(recorder)(window, window.__mk, behavior)
    }, { recorder: `(${installMusicKitRecorder.toString()})`, behavior: scenario.behavior })
    const page = await context.newPage()
    await page.goto(base + '/start', { waitUntil: 'load' })
    await page.waitForFunction(() => document.getElementById('app')?.children.length > 0 && window.router, null, { timeout: 40000 })
    await page.waitForTimeout(500)
    const resolve = (given) => (given && given.playlists ? { ...given, playlists: playlistsOf(given.playlists) } : given)
    const steps = scenario.steps.map(step => Object.fromEntries(Object.entries(step).map(([name, value]) => [name, typeof value === 'object' ? resolve(value) : value])))
    const outcome = await page.evaluate(async ({ entriesFile, steps, fromScreen }) => {
        const namespace = await import(`/assets/${entriesFile}`)
        const fns = Object.values(namespace).flatMap(value => (typeof value === 'function' ? [value] : (value && typeof value === 'object' ? Object.values(value) : []))).filter(value => typeof value === 'function')
        const find = (needle) => fns.find(fn => fn.toString().includes(needle))
        const exportToAppleMusic = find('handleExportToAppleMusic')
        const exportJson = find('handleExportJson')
        const listAppleFolders = find('listFolders')
        const progress = []
        const onStatus = (text) => progress.push(text)
        const events = []
        const optionsOf = (given) => {
            if (!given.fromScreen) return given
            window.playlistsStore.setPlaylists(fromScreen, 'sA')
            window.playlistsStore.setBatchName('Mix')
            if (window.albumSeriesStore) { window.albumSeriesStore.setSeries([{ id: 'sA', name: 'Road trip' }]); window.albumSeriesStore.setActiveSeries('sA') }
            return {}
        }
        let last = null
        for (const [index, step] of steps.entries()) {
            events.push(['step', index + 1])
            if (step.apple) { last = step.apple; await exportToAppleMusic(onStatus, optionsOf(step.apple)) }
            else if (step.again) await exportToAppleMusic(onStatus, optionsOf(last))
            else if (step.twice) { const o = optionsOf(step.twice); await Promise.all([exportToAppleMusic(onStatus, o), exportToAppleMusic(onStatus, o)]) }
            else if (step.folders) { try { events.push(['folders', await listAppleFolders()]) } catch (error) { events.push(['folders failed', error.message]) } }
            else if (step.json) { /* the file is proven through the screens (browser-proof.mjs) */ }
        }
        return { mk: window.__mk, progress, events, toasts: [...document.querySelectorAll('#toast-container .toast')].map(e => e.textContent.trim().replace(/\s+/g, ' ')).filter(text => !/^Authentication issue/.test(text)) }
    }, { entriesFile, steps, fromScreen: playlistsOf([{ title: 'Greatest Hits', tracks: ['One', 'Two'] }, { title: 'Deep Cuts', tracks: ['Three', 'Four'] }]) }).catch(error => ({ error: error.message }))
    await context.close()
    if (outcome.error) { note(`${ENGINE_NAME} · ${scenario.name}`, false, outcome.error); continue }
    if (scenario.steps.some(step => step.json)) { note(`${ENGINE_NAME} · ${scenario.name} (the file: by the screens, not here)`, true); continue }
    const golden = GOLDEN[scenario.name]
    const wantSdk = JSON.stringify(golden.filter(event => SDK.has(event[0])))
    const gotSdk = JSON.stringify(outcome.mk)
    const wantProgress = JSON.stringify(golden.filter(event => event[0] === 'progress').map(event => event[1]))
    const wantToasts = golden.filter(event => event[0] === 'toast').map(event => event[2].replace(/\s+/g, ' '))
    const wantFolders = JSON.stringify(golden.filter(event => event[0].startsWith('folders')))
    const gotFolders = JSON.stringify(outcome.events.filter(event => event[0].startsWith('folders')))
    const calls = outcome.mk.filter(event => event[0] === 'api.music').length
    totalCalls += calls
    const sameToasts = JSON.stringify([...outcome.toasts].sort()) === JSON.stringify([...wantToasts].sort())
    note(`${ENGINE_NAME} · ${scenario.name} · the SDK calls, in order`, wantSdk === gotSdk, wantSdk === gotSdk ? `${outcome.mk.length} events, ${calls} api.music` : `\n want: ${wantSdk.slice(0, 300)}\n got:  ${gotSdk.slice(0, 300)}`)
    note(`${ENGINE_NAME} · ${scenario.name} · the progress texts`, wantProgress === JSON.stringify(outcome.progress), wantProgress === JSON.stringify(outcome.progress) ? '' : `${wantProgress.slice(0, 200)} vs ${JSON.stringify(outcome.progress).slice(0, 200)}`)
    note(`${ENGINE_NAME} · ${scenario.name} · the notices (text)`, sameToasts, sameToasts ? `${wantToasts.length}` : `\n want: ${JSON.stringify(wantToasts).slice(0, 300)}\n got:  ${JSON.stringify(outcome.toasts).slice(0, 300)}`)
    note(`${ENGINE_NAME} · ${scenario.name} · the folders read`, wantFolders === gotFolders, '')
}
await browser.close()
server.close()
const failed = results.filter(r => !r.ok)
fs.mkdirSync(path.join(HERE, 'raw'), { recursive: true })
fs.writeFileSync(path.join(HERE, 'raw', `recording-built-${ENGINE_NAME}.json`), JSON.stringify({ engine: ENGINE_NAME, entriesFile, exportsFile, totalCalls, passed: results.length - failed.length, failed: failed.length, results }, null, 1))
console.log(`\n${ENGINE_NAME}: ${results.length - failed.length} passed, ${failed.length} failed; ${totalCalls} api.music calls compared`)
process.exit(failed.length ? 1 : 0)
