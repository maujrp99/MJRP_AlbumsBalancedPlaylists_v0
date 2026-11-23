/**
 * The entry page alive (F80, REQ-01, REQ-04, REQ-07) — the classic script of the approved prototype
 * (design/inception/splash-crate-v2.html), soft fire, as a module.
 *
 * The record playing: the browser's own scroll decides the track (nothing is hijacked); each track
 * pulls one record from the crate, the caption names it, the menu bar of equalizer bars fills up to
 * it (menu.js: the bar is the menu, one story per item); «Vire o disco» turns the crate to side B.
 * The fire is the light from below: strong on the first screen and on the invitation, soft in
 * between. The automatic motion (fire, breathing bars) rests 10 s after load or after the last
 * scroll; the pause icon stops everything. With reduced motion nothing moves, the icon is hidden
 * and the 3D is not even fetched. The text never waits for any of this. The page's language and
 * the account (signed in: the menu and one «Inicie» button) are decided here too (UAT-240, UAT-241).
 * On the phone (F96) the crate stays on its first track, turned by the style; the albums are one row
 * at the end of the page (shelf.js), no longer a record inside each story.
 *
 * Pure parts are exported for the tests; `startSplash(window)` wires them to the page.
 */

import { VIEWS, PAGE_VIEW, recordAt } from './framing.js'
import { t } from './copy.js'
import { chooseLanguage, readStoredLanguage, storeLanguage, pageStorage, applyLanguage } from './lang.js'
import { startMenuBar, applyAccount, threadBarStyle } from './menu.js'
import { hasAccount } from './gate.js'
import { startAmbient } from './ambient.js'
import { startShelf } from './shelf.js'

export { threadBarStyle }

/** The soft fire, the owner's choice (2026-11-20 «fogo brando na verdade»): peak on A1 and B2, low in between. */
export const FIRE = Object.freeze({ peak: 0.72, low: 0.28 })

export const ORDER = Object.freeze(['a1', 'start', 'albums', 'blend', 'flip', 'playlists', 'inventory', 'end'])

/** Where each part stands: which side faces you, which record is pulled, how strong the fire is. The flip is a band: it pulls nothing, the crate turns while it passes. */
export const TRACKS = Object.freeze({
    a1: { side: 'A', pull: -1, face: 0, fire: FIRE.peak },
    start: { side: 'A', pull: 2, fire: FIRE.low },
    albums: { side: 'A', pull: 0, fire: FIRE.low },
    blend: { side: 'A', pull: 5, fire: FIRE.low },
    flip: { side: 'A', pull: -1, face: 0, fire: (FIRE.low + FIRE.peak) / 2 },
    playlists: { side: 'B', pull: 10, fire: FIRE.low },
    inventory: { side: 'B', pull: 12, fire: FIRE.low },
    end: { side: 'B', pull: -1, face: 13, fire: FIRE.peak }
})

/** The automatic motion rests this long after load or after the last scroll. */
export const MOTION_WINDOW_MS = 10000

/** The track being read: the last section whose top has passed 55% of the viewport. */
export function trackAt(tops, viewportHeight) {
    const mark = viewportHeight * 0.55
    let track = ORDER[0]
    tops.forEach((top, i) => { if (top < mark) track = ORDER[i] })
    return track
}

/** How far the crate has turned (0 = side A, 1 = side B), from where «Flip the record» is. */
export function flipProgress(flipTop, flipHeight, viewportHeight, track) {
    if (ORDER.indexOf(track) > ORDER.indexOf('flip')) return 1
    return Math.max(0, Math.min(1, (viewportHeight * 0.75 - flipTop) / (flipHeight + viewportHeight * 0.25)))
}

/** The record the caption names on a track: the pulled one, or the one in front. */
export const captionIndex = (track, count = 14) => recordAt(TRACKS[track].pull >= 0 ? TRACKS[track].pull : TRACKS[track].face, count)

/**
 * The CSS crate on a track: for each of the 14 sleeves, whether it shows, its transform and its
 * stacking. The side facing you stands in a row going back; the pulled record is lifted; the ones in
 * front of it lean forward.
 */
export function cssCrateLayout(track, count = 14) {
    const s = TRACKS[track]
    // side A is every record before the last seven (7 or 8 of them); side B the last seven, the last in front
    const sideA = Array.from({ length: count - 7 }, (_, i) => i)
    const order = s.side === 'A' ? sideA : Array.from({ length: 7 }, (_, i) => count - 1 - i)
    const pull = s.pull >= 0 ? recordAt(s.pull, count) : -1
    const pulledPos = order.indexOf(pull)
    const out = Array.from({ length: count }, () => ({ visible: false, transform: '', zIndex: '' }))
    order.forEach((idx, pos) => {
        const z = -pos * 34
        const y = -pos * 6.5
        let transform
        let zIndex = 20 - pos
        if (idx === pull) {
            transform = `translate3d(0,-46%,${z + 18}px) rotateX(3deg)`
            zIndex = 30
        } else if (pulledPos > 0 && pos < pulledPos) {
            transform = `translate3d(0,${10 - pos * 2}%,${z + 30}px) rotateX(-38deg)`
        } else {
            transform = `translate3d(0,${y}%,${z}px) rotateX(-6deg)`
        }
        out[idx] = { visible: true, transform, zIndex: String(zIndex) }
    })
    return out
}

/** The 3D crate comes only to a computer, with WebGL, without a request for less motion. */
export const shouldLoad3d = ({ reduce, phone, webgl, nogl }) => !reduce && !phone && !nogl && webgl

/** The record as the page knows it, from the data the build wrote on each sleeve. */
export const albumOf = (img) => ({
    t: img.dataset.t || '', a: img.dataset.a || '', y: img.dataset.y || '', href: img.dataset.href || ''
})

/** The line under the title in the caption: the year, or "fictional album" (in the page's language). */
export const captionLine = (album, lang = 'pt') => (album.y ? `${album.y}` : t('c.fictional', lang)) // UAT-290: the album's name and the year, no artist (the button's name still says the artist)

function hasWebGL(D) {
    try {
        return Boolean(D.createElement('canvas').getContext('webgl2', { failIfMajorPerformanceCaveat: true }))
    } catch {
        return false
    }
}

/** The ember bed: a quiet Brasa, low in the scene, never behind text. */
function embers(win, cv, getLevel, page) {
    const D = win.document
    const x = cv.getContext && cv.getContext('2d')
    if (!x) return
    const P = []
    const N = page.phone ? 26 : 46
    let w = 0, h = 0, raf = 0, vis = true, last = 0
    const size = () => {
        const r = cv.getBoundingClientRect(), d = Math.min(win.devicePixelRatio || 1, 2)
        w = r.width; h = r.height; cv.width = Math.round(w * d); cv.height = Math.round(h * d); x.setTransform(d, 0, 0, d, 0, 0)
    }
    const spawn = (p, init) => {
        p.x = w * (0.15 + 0.7 * Math.random()); p.y = init ? h * Math.random() : h + 4; p.r = 1 + Math.random() * 2.4
        p.v = 12 + Math.random() * 30; p.l = 0; p.L = 1.6 + Math.random() * 2.2
        p.c = Math.random() < 0.5 ? '249,115,22' : (Math.random() < 0.5 ? '220,38,38' : '251,191,36'); p.s = Math.random() * 6
    }
    const frame = (dt) => {
        const lv = getLevel()
        x.clearRect(0, 0, w, h)
        const g = x.createLinearGradient(0, h, 0, h * 0.2)
        g.addColorStop(0, `rgba(249,115,22,${0.30 * lv})`); g.addColorStop(0.5, `rgba(220,38,38,${0.10 * lv})`); g.addColorStop(1, 'rgba(220,38,38,0)')
        x.fillStyle = g; x.fillRect(0, 0, w, h)
        x.globalCompositeOperation = 'lighter'
        for (let i = 0; i < P.length; i++) {
            const p = P[i]
            if (dt) { p.l += dt; p.y -= p.v * dt; p.x += Math.sin(p.l * 2 + p.s) * 8 * dt }
            if (p.l > p.L || p.y < -4) spawn(p, false)
            const a = (1 - p.l / p.L) * 0.85 * lv * (i < P.length * lv + 4 ? 1 : 0)
            if (a <= 0) continue
            x.fillStyle = `rgba(${p.c},${a.toFixed(3)})`; x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fill()
        }
        x.globalCompositeOperation = 'source-over'
    }
    const loop = (ts) => {
        raf = 0
        if (!vis || D.hidden) return
        const dt = last ? Math.min((ts - last) / 1000, 0.05) : 0
        last = ts; frame(dt)
        if (page.moving()) raf = win.requestAnimationFrame(loop); else last = 0
    }
    const kick = () => { if (!raf && !page.reduce && vis) raf = win.requestAnimationFrame(loop) }
    size()
    for (let i = 0; i < N; i++) { const p = {}; spawn(p, true); P.push(p) }
    frame(0)
    if ('ResizeObserver' in win) new win.ResizeObserver(() => { size(); frame(0) }).observe(cv)
    if ('IntersectionObserver' in win) new win.IntersectionObserver((e) => { vis = e[0].isIntersecting; if (vis) kick() }).observe(cv)
    D.addEventListener('motionchange', () => { if (page.moving()) kick(); else frame(0) })
    D.addEventListener('trackchange', () => { frame(0); kick() })
    kick()
}

/** The stage on a diagonal (UAT-235): the camera's view and the CSS crate turned the same way, half as far (it has no side walls: at the full turn the leaning records stick out past its front); on a computer the stage reaches the window's right edge, past its column («Palco largo»). */
function setupStage(win, page, scene) {
    const D = win.document
    page.view = VIEWS[PAGE_VIEW]
    if (page.phone) return
    const crateCss = D.getElementById('crate-css')
    if (crateCss && page.view.azimuth) crateCss.style.setProperty('--yaw', `${-page.view.azimuth / 2}deg`)
    if (!page.view.bleed) return
    const bleed = () => {
        scene.style.marginRight = '0px'
        const st = D.getElementById('stage').getBoundingClientRect()
        scene.style.marginRight = `${-Math.max(0, D.documentElement.clientWidth - st.right)}px`
    }
    bleed(); win.addEventListener('resize', bleed)
}

/** The motion window: the automatic motion runs 10 s after load or after the last scroll, then rests. Returns `wake`. */
function motionWindow(win, reduce) {
    const D = win.document
    let restTimer = 0
    return () => {
        if (reduce) return
        D.documentElement.classList.add('moving')
        win.clearTimeout(restTimer)
        restTimer = win.setTimeout(() => { D.documentElement.classList.remove('moving'); D.dispatchEvent(new win.Event('motionchange')) }, MOTION_WINDOW_MS)
        D.dispatchEvent(new win.Event('motionchange'))
    }
}

/** The pause icon: shown unless the system already asks for less motion; its label is the dictionary's. */
function pauseIcon(win, reduce, wake) {
    const D = win.document
    const H = D.documentElement
    const mb = D.getElementById('motion')
    if (!mb) return
    mb.hidden = reduce
    mb.onclick = () => {
        const paused = H.classList.toggle('paused')
        const key = paused ? 'play' : 'pause'
        const label = t(key, H.lang === 'en' ? 'en' : 'pt')
        mb.setAttribute('aria-pressed', paused ? 'true' : 'false')
        mb.setAttribute('data-i18n-aria', key)
        mb.setAttribute('data-i18n-title', key)
        mb.setAttribute('aria-label', label)
        mb.title = label
        if (!paused) wake()
        D.dispatchEvent(new win.Event('motionchange'))
    }
}

/** The accessible name of an album's button: what it does, the album and the artist, and that it opens a new tab. */
const listenLabel = (album, lang) => `${t('c.listen', lang)}: ${album.t}, ${album.a}${t('c.newtab', lang)}`

/** The CSS crate and the caption of the front record; `caption` is drawn again when the language changes. */
function crateView(win, imgs, albums, langOf) {
    const D = win.document
    return {
        layoutCss(track) {
            cssCrateLayout(track, imgs.length).forEach((place, i) => {
                const im = imgs[i]
                im.classList.toggle('vis', place.visible)
                if (place.visible) { im.style.transform = place.transform; im.style.zIndex = place.zIndex }
            })
        },
        caption(track) {
            const album = albums[captionIndex(track, albums.length)]
            if (!album) return
            const lang = langOf()
            const b = D.createElement('b')
            b.textContent = album.t
            D.getElementById('who').replaceChildren(b, D.createTextNode(captionLine(album, lang)))
            const am = D.getElementById('am')
            if (am && album.href) {
                am.href = album.href
                am.setAttribute('aria-label', listenLabel(album, lang))
            }
        }
    }
}

/** The record playing: the browser's scroll decides the track. Returns the scroll handler. */
function watchTracks(win, page, scene, view) {
    const D = win.document
    const sections = ORDER.map(id => D.getElementById(id))
    let current = ''
    return () => {
        const vh = win.innerHeight
        const track = trackAt(sections.map(s => s.getBoundingClientRect().top), vh)
        const fr = D.getElementById('flip').getBoundingClientRect()
        page.state.flip = flipProgress(fr.top, fr.height, vh, track)
        page.state.track = track
        if (track !== current) {
            current = track
            scene.style.setProperty('--fire', TRACKS[track].fire)
            if (!page.phone) { view.layoutCss(track); view.caption(track) }
            D.dispatchEvent(new win.CustomEvent('trackchange', { detail: track }))
        }
        D.dispatchEvent(new win.Event('scrollstate'))
    }
}

/** The language: the remembered choice, else Portuguese; the switch (PT · EN) changes and remembers it. */
function languageControl(win, onChange) {
    const D = win.document
    const storage = pageStorage(win)
    let lang = chooseLanguage({ stored: readStoredLanguage(storage) })
    const set = (next, remember) => {
        lang = next
        applyLanguage(D, lang)
        if (remember) storeLanguage(storage, lang)
        onChange(lang)
    }
    D.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => set(b.getAttribute('data-lang'), true)))
    return { current: () => lang, start: () => { if (lang !== 'pt') set(lang, false) } }
}

/** The real 3D crate: after the page has loaded, when it fits. */
function load3d(win, page) {
    const D = win.document
    const nogl = new URLSearchParams(win.location.search).has('nogl')
    const { reduce, phone } = page
    if (!shouldLoad3d({ reduce, phone, nogl, webgl: !reduce && !phone && !nogl && hasWebGL(D) })) return
    const go = () => {
        const run = () => import('./crate3d.js').then(m => m.startCrate3d(win, page)).catch(() => { /* the CSS crate stays */ })
        if ('requestIdleCallback' in win) win.requestIdleCallback(run, { timeout: 1500 }); else win.setTimeout(run, 200)
    }
    if (D.readyState === 'complete') go(); else win.addEventListener('load', go, { once: true })
}

/**
 * Wire the page. Returns the page's state (for the 3D crate and for checks in the browser).
 * @param {Window} win
 */
export function startSplash(win) {
    const D = win.document
    const H = D.documentElement
    H.classList.add('js')
    const reduce = win.matchMedia('(prefers-reduced-motion: reduce)').matches
    const phone = win.matchMedia('(max-width:899px)').matches
    const imgs = [...D.querySelectorAll('#box .sl')]
    const albums = imgs.map(albumOf)
    const scene = D.getElementById('scene')
    const page = {
        TRACKS, ORDER, albums, reduce, phone,
        state: { track: 'a1', flip: 0 },
        moving: () => H.classList.contains('moving') && !H.classList.contains('paused')
    }
    win.__splash = page
    setupStage(win, page, scene)
    const wake = motionWindow(win, reduce)
    pauseIcon(win, reduce, wake)

    let lang = 'pt'
    const view = crateView(win, imgs, albums, () => lang)
    const language = languageControl(win, (next) => { lang = next; view.caption(phone ? 'a1' : page.state.track) })
    lang = language.current()
    const onScroll = watchTracks(win, page, scene, view)
    win.addEventListener('scroll', () => { onScroll(); wake() }, { passive: true })
    win.addEventListener('resize', onScroll)
    view.layoutCss('a1'); view.caption('a1'); onScroll(); wake()
    language.start()

    startMenuBar(win)
    startAmbient(win)
    startShelf(win)
    // the account: a visitor until the browser says otherwise; on the phone the visitor's «Criar» opens the app from the first moment (F96)
    const narrow = win.matchMedia('(max-width:899px)')
    let signedIn = false
    const account = () => applyAccount(D, signedIn, narrow.matches)
    account()
    if (narrow.addEventListener) narrow.addEventListener('change', account)
    hasAccount(win).then((answer) => { signedIn = answer; account() })

    const fireLevel = () => Number(win.getComputedStyle(scene).getPropertyValue('--fire')) || FIRE.peak
    embers(win, D.getElementById('embers'), fireLevel, page)
    if (phone) embers(win, D.getElementById('embers-b2'), () => FIRE.peak, page)
    load3d(win, page)
    return page
}
