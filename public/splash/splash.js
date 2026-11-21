/**
 * The entry page alive (F80, REQ-01, REQ-04, REQ-07) — the classic script of the approved prototype
 * (design/inception/splash-crate-v2.html), soft fire, as a module.
 *
 * The record playing: the browser's own scroll decides the track (nothing is hijacked); each track
 * pulls one record from the crate, the caption names it, the thread of equalizer bars lights up to
 * it; «Flip the record» turns the crate to side B. The fire is the light from below: strong on the
 * first screen and on the invitation, soft in between. The automatic motion (fire, breathing bars)
 * rests 10 s after load or after the last scroll; «Pause motion» stops everything. With reduced
 * motion nothing moves and the 3D is not even fetched. The text never waits for any of this.
 *
 * Pure parts are exported for the tests; `startSplash(window)` wires them to the page.
 */

/** The soft fire, the owner's choice (2026-11-20 «fogo brando na verdade»): peak on A1 and B2, low in between. */
export const FIRE = Object.freeze({ peak: 0.72, low: 0.28 })

export const ORDER = Object.freeze(['a1', 'a2', 'a3', 'a4', 'a5', 'flip', 'b1', 'b2'])

/** Where each track stands: which side faces you, which record is pulled, how strong the fire is. */
export const TRACKS = Object.freeze({
    a1: { side: 'A', pull: -1, face: 0, fire: FIRE.peak, label: 'Side A · 1 — The Blender' },
    a2: { side: 'A', pull: 2, fire: FIRE.low, label: 'Side A · 2 — Series' },
    a3: { side: 'A', pull: 3, fire: FIRE.low, label: 'Side A · 3 — Ranking' },
    a4: { side: 'A', pull: 5, fire: FIRE.low, label: 'Side A · 4 — Blend' },
    a5: { side: 'A', pull: 6, fire: FIRE.low, label: 'Side A · 5 — Your shelf' },
    flip: { side: 'A', pull: -1, face: 0, fire: (FIRE.low + FIRE.peak) / 2, label: 'Flip the record' },
    b1: { side: 'B', pull: 10, fire: FIRE.low, label: 'Side B · 1 — Why whole albums' },
    b2: { side: 'B', pull: -1, face: 13, fire: FIRE.peak, label: 'Side B · 2 — Start' }
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
export const captionIndex = (track) => (TRACKS[track].pull >= 0 ? TRACKS[track].pull : TRACKS[track].face)

/**
 * The CSS crate on a track: for each of the 14 sleeves, whether it shows, its transform and its
 * stacking. The side facing you stands in a row going back; the pulled record is lifted; the ones in
 * front of it lean forward.
 */
export function cssCrateLayout(track, count = 14) {
    const s = TRACKS[track]
    const order = s.side === 'A' ? [0, 1, 2, 3, 4, 5, 6] : [13, 12, 11, 10, 9, 8, 7]
    const pulledPos = order.indexOf(s.pull)
    const out = Array.from({ length: count }, () => ({ visible: false, transform: '', zIndex: '' }))
    order.forEach((idx, pos) => {
        const z = -pos * 34
        const y = -pos * 6.5
        let transform
        let zIndex = 20 - pos
        if (idx === s.pull) {
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

/** The bars of the thread: each its own height, duration and offset, never in unison. */
export function threadBarStyle(k) {
    const h = 38 + Math.round(58 * Math.abs(Math.sin(k * 1.93 + 0.4)))
    const d = (0.55 + ((k * 37) % 9) / 10).toFixed(2)
    const o = (((k * 53) % 7) / 10).toFixed(1)
    return `--h:${h}%;--d:${d}s;--o:-${o}s`
}

/** The record as the page knows it, from the data the build wrote on each sleeve. */
export const albumOf = (img) => ({
    t: img.dataset.t || '', a: img.dataset.a || '', y: img.dataset.y || '', href: img.dataset.href || ''
})

/** "Artist · Year", or "Artist · fictional album". */
export const captionLine = (album) => (album.y ? `${album.a} · ${album.y}` : `${album.a} · fictional album`)

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
    const sections = ORDER.map(id => D.getElementById(id))
    const imgs = [...D.querySelectorAll('#box .sl')]
    const albums = imgs.map(albumOf)
    const scene = D.getElementById('scene')

    // the bars of the thread
    let gi = 0
    D.querySelectorAll('#groups .g').forEach((g) => {
        let bars = ''
        for (let i = 0; i < 5; i++) bars += `<i style="${threadBarStyle(gi * 5 + i)}"></i>`
        g.innerHTML = bars
        gi++
    })

    const page = {
        TRACKS, ORDER, albums, reduce, phone,
        state: { track: 'a1', flip: 0 },
        moving: () => H.classList.contains('moving') && !H.classList.contains('paused')
    }
    win.__splash = page

    // the motion window: the automatic motion runs 10 s after load or after the last scroll, then rests
    let restTimer = 0
    const wake = () => {
        if (reduce) return
        H.classList.add('moving')
        win.clearTimeout(restTimer)
        restTimer = win.setTimeout(() => { H.classList.remove('moving'); D.dispatchEvent(new win.Event('motionchange')) }, MOTION_WINDOW_MS)
        D.dispatchEvent(new win.Event('motionchange'))
    }

    // on the phone the thread is progress only, out of the tab order
    if (phone) D.querySelectorAll('#groups a').forEach(a => { a.tabIndex = -1; a.setAttribute('aria-hidden', 'true') })
    // «Pause motion»: shown unless the system already asks for less motion
    const mb = D.getElementById('motion')
    if (mb && !reduce) {
        mb.hidden = false
        if (phone) { D.getElementById('hero-ctas').appendChild(mb); mb.classList.add('inline') }
    }
    if (mb) {
        mb.onclick = () => {
            const paused = H.classList.toggle('paused')
            mb.setAttribute('aria-pressed', paused ? 'true' : 'false')
            mb.textContent = paused ? 'Play motion' : 'Pause motion'
            if (!paused) wake()
            D.dispatchEvent(new win.Event('motionchange'))
        }
    }

    // the CSS crate and the caption
    const layoutCss = (track) => {
        cssCrateLayout(track, imgs.length).forEach((place, i) => {
            const im = imgs[i]
            im.classList.toggle('vis', place.visible)
            if (place.visible) { im.style.transform = place.transform; im.style.zIndex = place.zIndex }
        })
    }
    const caption = (track) => {
        const album = albums[captionIndex(track)]
        if (!album) return
        const who = D.getElementById('who')
        const b = D.createElement('b')
        b.textContent = album.t
        who.replaceChildren(b, D.createTextNode(captionLine(album)))
        const am = D.getElementById('am')
        if (am && album.href) {
            am.href = album.href
            am.setAttribute('aria-label', `Listen to ${album.t} by ${album.a} on Apple Music (opens in a new tab)`)
        }
    }

    // phone: each track brings its own record (a copy of the crate's image, no extra bytes on the wire)
    D.querySelectorAll('.slot').forEach((slot) => {
        const i = Number(slot.dataset.pull)
        if (!imgs[i]) return
        const im = imgs[i].cloneNode()
        im.removeAttribute('class'); im.removeAttribute('style'); im.alt = ''
        slot.appendChild(im)
        const album = albums[i]
        const credit = D.createElement(album.href ? 'a' : 'span')
        credit.className = 'slot-am'
        if (album.href) {
            credit.href = album.href; credit.target = '_blank'; credit.rel = 'noopener'
            credit.textContent = `${album.t} · ${album.a} — Listen on Apple Music`
        } else {
            credit.textContent = `${album.t} · ${album.a} — fictional album`
        }
        slot.appendChild(credit)
        slot.removeAttribute('aria-hidden')
    })
    const pending = D.querySelectorAll('.slot.pre')
    if ('IntersectionObserver' in win) {
        const io = new win.IntersectionObserver((entries) => {
            entries.forEach(e => { if (e.isIntersecting) { e.target.classList.remove('pre'); io.unobserve(e.target) } })
        }, { rootMargin: '0px 0px -25% 0px' })
        pending.forEach(s => io.observe(s))
    } else {
        pending.forEach(s => s.classList.remove('pre'))
    }

    // the record playing: the browser's scroll decides the track
    let current = ''
    const onScroll = () => {
        const vh = win.innerHeight
        const track = trackAt(sections.map(s => s.getBoundingClientRect().top), vh)
        const fr = D.getElementById('flip').getBoundingClientRect()
        page.state.flip = flipProgress(fr.top, fr.height, vh, track)
        page.state.track = track
        if (track !== current) {
            current = track
            const s = TRACKS[track]
            D.getElementById('now-track').textContent = s.label
            const ti = ORDER.indexOf(track)
            D.querySelectorAll('#groups [data-for]').forEach((g) => {
                const i = ORDER.indexOf(g.dataset.for)
                g.classList.toggle('on', i <= ti)
                g.classList.toggle('cur', i === ti)
                if (i === ti) g.setAttribute('aria-current', 'step'); else g.removeAttribute('aria-current')
            })
            scene.style.setProperty('--fire', s.fire)
            if (!phone) { layoutCss(track); caption(track) }
            D.dispatchEvent(new win.CustomEvent('trackchange', { detail: track }))
        }
        D.dispatchEvent(new win.Event('scrollstate'))
    }
    win.addEventListener('scroll', () => { onScroll(); wake() }, { passive: true })
    win.addEventListener('resize', onScroll)
    layoutCss('a1'); caption('a1'); onScroll(); wake()

    const fireLevel = () => Number(win.getComputedStyle(scene).getPropertyValue('--fire')) || FIRE.peak
    embers(win, D.getElementById('embers'), fireLevel, page)
    if (phone) embers(win, D.getElementById('embers-b2'), () => FIRE.peak, page)

    // the real 3D crate: after the page has loaded, when it fits
    const nogl = new URLSearchParams(win.location.search).has('nogl')
    if (shouldLoad3d({ reduce, phone, nogl, webgl: !reduce && !phone && !nogl && hasWebGL(D) })) {
        const go = () => {
            const run = () => import('./crate3d.js').then(m => m.startCrate3d(win, page)).catch(() => { /* the CSS crate stays */ })
            if ('requestIdleCallback' in win) win.requestIdleCallback(run, { timeout: 1500 }); else win.setTimeout(run, 200)
        }
        if (D.readyState === 'complete') go(); else win.addEventListener('load', go, { once: true })
    }
    return page
}
