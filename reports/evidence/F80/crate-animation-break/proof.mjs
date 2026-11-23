// UAT-289 (F80): a record of the 3D crate falls through the crate's front wall. The browser proof, on a BUILT site.
//
//   DIST=<built site> SIDE=<main|branch> OUT=<this folder> [ONLY=chromium-1280] node proof.mjs
//
// The build is publication-shaped (`node scripts/publication-budget.mjs --out <dist>`, stand-in keys from the environment, the real covers). It is
// served by this script's own static server on 127.0.0.1, closed at the end. Hosts allowed besides 127.0.0.1: the four static hosts the page itself
// names (the covers on Apple's CDN, Google Fonts, the 3D library). The music hosts are aborted first, by name; anything else is blocked too. Nothing
// is typed; the only clicks are on the page's own menu (in-page anchors) and its pause icon, never on an album link.
//
// How the scene is read: the 3D library is fetched as the page asks for it and handed back with three lines added that remember the scene a mesh is
// added to; the page's own file (crate3d.js) runs as built. The covers' places and turns are read from the scene's objects, in the crate's own space.
//
// The rule checked (what the design implies): once motion has settled every record is standing in the row, or flipped forward inside the crate
// (leaning the way the row is browsed, no further than the browsing angle), or it is the one lifted in focus; no record is inside the wood of any
// plank; no record passes through its neighbour. While things move (read on every frame of the wheel, the jumps and the menu) no record goes into
// the wood either, and the largest jump of a record between two frames is written down.
// In the results, the letters after a PASS are the fifteen records front to back: s standing, f flipped forward or (the one after the flipped ones) lifted in focus.
import { chromium, webkit } from '/Users/maujrp/mjrp/projects/MJRPpersonal/node_modules/playwright/index.mjs'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const OUT = process.env.OUT
const DIST = process.env.DIST
const SIDE = process.env.SIDE || 'branch'
const ONLY = process.env.ONLY || ''
fs.mkdirSync(OUT, { recursive: true })
const MUSIC = new Set(['music.apple.com', 'itunes.apple.com', 'geo.music.apple.com', 'open.spotify.com'])
const ALLOWED = new Set(['127.0.0.1', 'is1-ssl.mzstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net'])
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2', '.webp': 'image/webp', '.jpg': 'image/jpeg' }

function serve(dist) {
    const server = http.createServer((req, res) => {
        const url = new URL(req.url, 'http://x')
        let file = path.join(dist, decodeURIComponent(url.pathname))
        if (url.pathname === '/') file = path.join(dist, 'index.html')
        if (!file.startsWith(dist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return }
        res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' })
        fs.createReadStream(file).pipe(res)
    })
    return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` })))
}

const results = []
const note = (what, ok, detail = '') => { results.push({ what, ok, detail: String(detail) }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}${detail ? '  ' + String(detail).slice(0, 400) : ''}`) }
const info = (what, detail = '') => { results.push({ what, ok: null, detail: String(detail) }); console.log(`INFO  ${what}  ${String(detail).slice(0, 400)}`) }
const measures = {}

const SPY = `
;(() => { const add = T.Object3D.prototype.add
T.Object3D.prototype.add = function (...a) { if (this.isScene) globalThis.__crateScene = this; return add.apply(this, a) } })()
`

/** The scene as it stands: every record's lift and tilt, the planks it is inside of, the neighbours it crosses. Runs in the page. */
const readScene = () => {
    const scene = globalThis.__crateScene
    if (!scene) return null
    const crate = scene.children.find(c => c.isGroup)
    if (!crate) return null
    const sleeves = crate.children.filter(m => Array.isArray(m.material))
    if (!sleeves.length) return null
    const planks = crate.children.filter(m => !Array.isArray(m.material)).map((m) => {
        const p = m.geometry.parameters
        return { x0: m.position.x - p.width / 2, x1: m.position.x + p.width / 2, y0: m.position.y - p.height / 2, y1: m.position.y + p.height / 2, z0: m.position.z - p.depth / 2, z1: m.position.z + p.depth / 2 }
    })
    const names = ['floor', 'front (+z)', 'back (-z)', 'side (+x)', 'side (-x)']
    const SZ = sleeves[0].geometry.parameters.height
    const N = 24
    const out = sleeves.map((m, i) => {
        m.updateMatrix()
        const e = m.matrix.elements
        const at = (x, y) => [e[0] * x + e[4] * y + e[12], e[1] * x + e[5] * y + e[13], e[2] * x + e[6] * y + e[14]]
        let deep = 0, inside = ''
        const mid = []
        for (let a = 0; a <= N; a++) {
            mid.push(at(0, (SZ * a) / N))
            for (let b = 0; b <= 8; b++) {
                const [x, y, z] = at(-SZ / 2 + (SZ * b) / 8, (SZ * a) / N)
                planks.forEach((p, k) => {
                    const d = Math.min(x - p.x0, p.x1 - x, y - p.y0, p.y1 - y, z - p.z0, p.z1 - z)
                    if (d > deep) { deep = d; inside = names[k] }
                })
            }
        }
        return { i, lift: m.userData.lift, tilt: m.rotation.x, turn: m.rotation.y, x: m.position.x, y: m.position.y, z: m.position.z, deep, inside, mid }
    })
    // neighbours: two records still in the row must keep their order front to back at every height they share
    const crossings = []
    for (let i = 1; i < out.length; i++) {
        const a = out[i - 1], b = out[i]
        if (a.lift > 0.02 || b.lift > 0.02) continue
        let worst = 0
        const f = b.mid[0], t = b.mid[b.mid.length - 1]
        for (const [, ya, za] of a.mid) {
            // the point of b at the same height (b.mid is a straight line from its foot)
            const u = (ya - f[1]) / (t[1] - f[1])
            if (u < 0 || u > 1) continue
            worst = Math.max(worst, f[2] + (t[2] - f[2]) * u - za)
        }
        if (worst > 0.02) crossings.push({ pair: [i - 1, i], by: worst })
    }
    const s = globalThis.__splash.state
    return { track: s.track, flip: s.flip, rot: crate.rotation.y, live: document.getElementById('stage').classList.contains('live'), sleeves: out.map(({ mid, ...rest }) => rest), crossings }
}

const round = (n) => Math.round(n * 1000) / 1000
const key = (sc) => JSON.stringify([round(sc.rot), sc.sleeves.map(s => [round(s.lift), round(s.tilt), round(s.z)])])

/** Wait until nothing in the scene has changed for half a second; returns the scene, or null on time-out. */
async function settled(page, limit = 9000) {
    let last = '', same = 0
    const t0 = Date.now()
    while (Date.now() - t0 < limit) {
        const sc = await page.evaluate(readScene)
        const k = sc ? key(sc) : ''
        same = k && k === last ? same + 1 : 0
        last = k
        if (same >= 5) return sc
        await page.waitForTimeout(100)
    }
    return null
}

const LEAN = 0.16, BROWSE = 0.62, EPS = 0.012, WOOD = 0.01
/** The failures of a settled scene against the rule. */
function judge(sc, pulls) {
    const fails = []
    const side = sc.flip < 0.5 ? 1 : -1
    const pull = sc.flip % 1 === 0 ? pulls[sc.track] : -1
    const kinds = []
    for (const s of sc.sleeves) {
        let kind = 'between'
        if (Math.abs(s.lift - 1) < EPS) kind = 'focus'
        else if (Math.abs(s.lift) < EPS && Math.abs(s.tilt + LEAN * side) < EPS) kind = 'standing'
        else if (Math.abs(s.lift) < EPS && s.tilt * side > 0 && s.tilt * side <= BROWSE + EPS) kind = 'flipped'
        kinds.push(kind)
        if (kind === 'between') fails.push(`record ${s.i} rests between poses (lift ${round(s.lift)}, tilt ${round(s.tilt)})`)
        if (kind === 'focus' && s.i !== pull) fails.push(`record ${s.i} is lifted but the track pulls ${pull}`)
        if (kind === 'flipped' && !(pull >= 0 && (side > 0 ? s.i < pull : s.i > pull))) fails.push(`record ${s.i} is flipped forward but is not in front of the pulled one (${pull})`)
        if (s.deep > WOOD) fails.push(`record ${s.i} (${kind}, tilt ${round(s.tilt)} rad) is ${round(s.deep)} inside the ${s.inside} plank`)
    }
    if (pull >= 0 && kinds[pull] !== 'focus') fails.push(`the pulled record ${pull} is not lifted (${kinds[pull]})`)
    for (const c of sc.crossings) fails.push(`records ${c.pair[0]} and ${c.pair[1]} pass through each other by ${round(c.by)}`)
    return { fails, kinds }
}

/** Sample the scene on every frame for a while: the deepest any record went into the wood and the largest jump of a record between two frames. */
const watchMotion = (ms, readSrc) => new Promise((resolve) => {
    const read = (0, eval)(`(${readSrc})`)
    const t0 = performance.now()
    let deep = 0, where = '', jump = 0, jumpOf = -1, frames = 0, prev = null
    const tick = () => {
        const sc = read()
        frames++
        if (sc) {
            for (const s of sc.sleeves) if (s.deep > deep) { deep = s.deep; where = `record ${s.i} in the ${s.inside} plank (lift ${s.lift.toFixed(2)}, tilt ${s.tilt.toFixed(2)}, track ${sc.track})` }
            if (prev) sc.sleeves.forEach((s, i) => { const d = Math.hypot(s.z - prev.sleeves[i].z, s.y - prev.sleeves[i].y); if (d > jump) { jump = d; jumpOf = i } })
            prev = sc
        }
        if (performance.now() - t0 < ms) requestAnimationFrame(tick); else resolve({ deep, where, jump, jumpOf, frames })
    }
    requestAnimationFrame(tick)
})

const PROFILES = [
    { name: 'chromium-1280', engine: chromium, width: 1280, height: 900, full: true },
    { name: 'chromium-1440', engine: chromium, width: 1440, height: 900 },
    { name: 'webkit-1280', engine: webkit, width: 1280, height: 900 }
].filter(p => !ONLY || ONLY.split(',').includes(p.name))
const ORDER = ['a1', 'start', 'albums', 'blend', 'flip', 'playlists', 'inventory', 'end']

async function open(browser, profile, base, blocked, options = {}) {
    const context = await browser.newContext({ viewport: { width: profile.width, height: profile.height }, deviceScaleFactor: 1, ...options })
    await context.route('**/*', async (route) => {
        const url = new URL(route.request().url())
        if (MUSIC.has(url.hostname)) { blocked.push(`MUSIC ${url.hostname}`); return route.abort() }
        if (!ALLOWED.has(url.hostname)) { blocked.push(url.hostname); return route.abort() }
        if (url.hostname === 'cdn.jsdelivr.net' && url.pathname.endsWith('three.module.min.js') && !url.searchParams.has('orig')) {
            const real = `${url.origin}${url.pathname}?orig`
            return route.fulfill({ contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' }, body: `import * as T from '${real}'\nexport * from '${real}'\n${SPY}` })
        }
        return route.continue()
    })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', e => errors.push(String(e)))
    await page.goto(base + '/', { waitUntil: 'load' })
    return { context, page, errors }
}

/** Put a track under the reading mark: its section's top at 30% of the window, the short flip band at 50% so the crate rests half turned (the browser's own scroll, no smoothing). */
const goTo = (page, id) => page.evaluate((id) => {
    const top = document.getElementById(id).getBoundingClientRect().top + scrollY
    scrollTo({ top: Math.max(0, top - innerHeight * (id === 'flip' ? 0.5 : 0.3)), behavior: 'instant' })
}, id)

async function check(page, label, pulls, bag, shot) {
    const sc = await settled(page, bag.limit || 9000)
    if (!sc) { note(`${label}: the scene settles`, false, 'still moving at the time limit'); return null }
    const { fails, kinds } = judge(sc, pulls)
    bag.states++
    note(`${label} (track ${sc.track}, flip ${round(sc.flip)})`, fails.length === 0, fails.length ? fails.join('; ') : kinds.map(k => k[0]).join(''))
    if (fails.length && shot && !bag.shot) {
        bag.shot = true
        await page.locator('#stage').screenshot({ path: path.join(OUT, shot) })
    }
    return sc
}

async function run() {
    const { server, base } = await serve(path.resolve(DIST))
    try {
        for (const profile of PROFILES) {
            const args = profile.engine === chromium ? ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'] : []
            const browser = await profile.engine.launch({ args })
            const blocked = []
            const tag = `${profile.name} ${SIDE}`
            try {
                const { context, page, errors } = await open(browser, profile, base, blocked)
                const has3d = await page.waitForFunction(() => globalThis.__crateScene && document.getElementById('stage').classList.contains('live'), null, { timeout: 20000 }).then(() => true, () => false)
                note(`${tag}: the 3D crate is drawn`, has3d)
                if (!has3d) { await context.close(); continue }
                const pulls = await page.evaluate(() => { const p = globalThis.__splash, n = p.albums.length; return Object.fromEntries(Object.entries(p.TRACKS).map(([k, t]) => [k, t.pull >= 0 ? (t.pull >= 7 ? t.pull + n - 14 : t.pull) : -1])) })
                const bag = { states: 0, shot: false }
                const src = readScene.toString()

                // 1. each track in turn, down then up, one at a time
                for (const id of [...ORDER, ...[...ORDER].reverse()]) {
                    await goTo(page, id)
                    await check(page, `${tag} · in turn · ${id}`, pulls, bag, `${SIDE}-${profile.name}-break.png`)
                    if (bag.states <= ORDER.length) await page.locator('#stage').screenshot({ path: path.join(OUT, `${SIDE}-${profile.name}-${String(ORDER.indexOf(id)).padStart(2, '0')}-${id}.png`) })
                }
                // 2. slow scroll with the wheel, down the whole page and back, the rule read at every stop of the wheel
                const height = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
                await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
                await page.mouse.move(profile.width / 2, profile.height / 2)
                const worst = { deep: 0, where: '', jump: 0, jumpOf: -1 }
                const fold = (m) => { if (m.deep > worst.deep) { worst.deep = m.deep; worst.where = m.where } if (m.jump > worst.jump) { worst.jump = m.jump; worst.jumpOf = m.jumpOf } }
                if (profile.full) {
                    for (const dir of [1, -1]) {
                        for (let y = 0; y < height; y += 240) {
                            const watching = page.evaluate(`(${watchMotion.toString()})(350, ${JSON.stringify(src)})`)
                            await page.mouse.wheel(0, 240 * dir)
                            fold(await watching)
                        }
                        await check(page, `${tag} · slow wheel ${dir > 0 ? 'down' : 'up'} · at the end`, pulls, bag)
                    }
                }
                // 3. fast: every jump from one track to another, both ways, no waiting in between, then the rule at rest
                const jumps = profile.full ? ORDER.flatMap(a => ORDER.filter(b => b !== a).map(b => [a, b])) : [['a1', 'blend'], ['blend', 'playlists'], ['playlists', 'start'], ['start', 'end'], ['end', 'albums'], ['albums', 'inventory'], ['inventory', 'a1']]
                for (const [a, b] of jumps) {
                    await goTo(page, a)
                    await page.waitForTimeout(120)
                    const watching = page.evaluate(`(${watchMotion.toString()})(1500, ${JSON.stringify(src)})`)
                    await goTo(page, b)
                    fold(await watching)
                    await check(page, `${tag} · jump ${a} → ${b}`, pulls, bag)
                }
                // 3b. a burst: ten tracks in half a second
                for (const id of ['end', 'a1', 'blend', 'playlists', 'start', 'inventory', 'albums', 'flip', 'end', 'start']) { await goTo(page, id); await page.waitForTimeout(50) }
                await check(page, `${tag} · a burst of ten jumps, ends on start`, pulls, bag)
                // 4. the page's own controls: the menu bar, the flip mark, the home mark (smooth scroll, the page's own)
                for (const sel of ['a.stop[data-for="blend"]', 'a.stop[data-for="inventory"]', 'a.stop[data-for="start"]', 'a.flipmark', 'a.stop[data-for="playlists"]', 'a.stop[data-for="albums"]', 'a.home']) {
                    const link = page.locator(sel).first()
                    const href = await link.getAttribute('href')
                    if (!href || !href.startsWith('#')) { note(`${tag} · control ${sel} is an in-page anchor`, false, href); continue }
                    const watching = page.evaluate(`(${watchMotion.toString()})(2500, ${JSON.stringify(src)})`)
                    await link.click()
                    fold(await watching)
                    await check(page, `${tag} · the menu · ${sel}`, pulls, bag)
                }
                // 5. the window changes size while records move
                for (const [id, w, h] of [['blend', profile.width === 1280 ? 1440 : 1280, 900], ['playlists', 1100, 760], ['start', profile.width, profile.height]]) {
                    await goTo(page, id)
                    await page.waitForTimeout(150)
                    await page.setViewportSize({ width: w, height: h })
                    await check(page, `${tag} · resized to ${w}×${h} mid-move`, pulls, bag)
                }
                // 6. the tab is hidden while records move, the scroll goes on behind it, then the tab is shown again
                const setHidden = (hidden) => page.evaluate((hidden) => {
                    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
                    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (hidden ? 'hidden' : 'visible') })
                    document.dispatchEvent(new Event('visibilitychange'))
                }, hidden)
                await goTo(page, 'albums'); await page.waitForTimeout(150)
                await setHidden(true)
                await goTo(page, 'inventory'); await page.waitForTimeout(600)
                await goTo(page, 'blend'); await page.waitForTimeout(600)
                await setHidden(false)
                await check(page, `${tag} · tab hidden mid-move, scrolled behind it, shown again`, pulls, bag)
                // 7. the pause icon while records move
                await goTo(page, 'start'); await page.waitForTimeout(150)
                await page.locator('#motion').click()
                await goTo(page, 'inventory')
                await check(page, `${tag} · paused mid-move`, pulls, bag)
                await page.locator('#motion').click()
                // 8. a slow machine (Chromium only: the processor held back six times), the jumps again
                if (profile.engine === chromium) {
                    const cdp = await context.newCDPSession(page)
                    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 })
                    bag.limit = 25000
                    for (const id of ['start', 'blend', 'playlists', 'albums', 'end', 'a1', 'inventory', 'start']) {
                        await goTo(page, id); await page.waitForTimeout(80)
                    }
                    await check(page, `${tag} · processor 6× slower · a burst, ends on start`, pulls, bag)
                    for (const id of ['blend', 'inventory', 'albums']) { await goTo(page, id); await check(page, `${tag} · processor 6× slower · ${id}`, pulls, bag) }
                    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
                    bag.limit = 9000
                }
                note(`${tag} · while moving: no record goes into the wood`, worst.deep <= WOOD, `${round(worst.deep)} — ${worst.where || 'none'}`)
                info(`${tag} · while moving: the largest jump of a record between two frames`, `${round(worst.jump)} (record ${worst.jumpOf})`)
                measures[tag] = { states: bag.states, moving: worst }
                note(`${tag}: no page error`, errors.length === 0, errors.join(' | '))
                await context.close()

                // 9. less motion asked: the 3D is not fetched at all (the CSS crate stays; its own leaning records are UAT-237)
                const calm = await open(browser, profile, base, blocked, { reducedMotion: 'reduce' })
                await calm.page.waitForTimeout(2500)
                const calmState = await calm.page.evaluate(() => ({ scene: Boolean(globalThis.__crateScene), canvas: Boolean(document.querySelector('canvas.gl')), live: document.getElementById('stage').classList.contains('live') }))
                note(`${tag} · less motion asked: no 3D scene, no 3D canvas`, !calmState.scene && !calmState.canvas && !calmState.live, JSON.stringify(calmState))
                await calm.context.close()
                const music = blocked.filter(b => b.startsWith('MUSIC'))
                note(`${tag}: no request to a music host`, music.length === 0, music.join(','))
                const other = [...new Set(blocked.filter(b => !b.startsWith('MUSIC')))]
                if (other.length) info(`${tag}: other hosts blocked`, other.join(','))
            } finally {
                await browser.close()
            }
        }
    } finally {
        await new Promise(resolve => server.close(resolve))
    }
    const failed = results.filter(r => r.ok === false)
    const lines = results.map(r => `${r.ok === null ? 'INFO' : r.ok ? 'PASS' : 'FAIL'}  ${r.what}${r.detail ? '  ' + r.detail : ''}`)
    lines.push('', `${SIDE}: ${results.filter(r => r.ok).length} passed, ${failed.length} failed`)
    fs.writeFileSync(path.join(OUT, `results-${SIDE}.txt`), lines.join('\n') + '\n')
    fs.writeFileSync(path.join(OUT, `measures-${SIDE}.json`), JSON.stringify(measures, null, 1) + '\n')
    console.log(lines[lines.length - 1])
    process.exit(failed.length ? 1 : 0)
}

run().catch((e) => { console.error(e); process.exit(2) })
