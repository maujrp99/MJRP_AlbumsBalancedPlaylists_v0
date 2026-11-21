/**
 * The vignettes of the stories (F80, UAT-240, UAT-241; prototype «A barra é o menu» v4, «o ritmo da página»).
 *
 * Each story of the home has a quiet, decorative panel (`.v4-motif`: fire and music) that fades in as the story
 * enters the screen and out as it leaves, tied to the scroll: transform and opacity only, a fixed size (nothing
 * jumps). Its loops run only while it is on screen (`.live`) and the page is «moving» (10 s after the last
 * scroll, never while paused); the pause icon and the rest timer show the composed still. The ranking card's
 * track («Venus In Furs») rises once when the card reaches the middle. With reduced motion the page is not
 * even armed: every vignette is its still. The loops themselves are CSS (public/splash.html).
 * Pure parts are exported for the tests; `startAmbient(window)` wires them to the page.
 */

/** How far an element's centre is from the viewport's centre: 0 in the middle, 1 at an edge; far when it has no height. */
export const centerOffset = (top, height, viewportHeight) => (height ? (top + height / 2 - viewportHeight / 2) / (viewportHeight / 2) : 9)

/** Fully there across the middle of the screen (under 62% of the half-height); fades over the outer fifth. */
export const fadeOpacity = (distance) => (distance < 0.62 ? 1 : Math.max(0, 1 - (distance - 0.62) / 0.33))

/** What a vignette does at a place on the screen: the inline fade and drift, and whether its loops run. */
export function motifState({ offset, paused, moving }) {
    if (paused) return { opacity: '', shift: '', live: false, reset: true }
    const opacity = fadeOpacity(Math.abs(offset))
    return { opacity: opacity.toFixed(3), shift: (offset * 10).toFixed(1), live: opacity > 0.02 && moving, reset: false }
}

/** The ranking card: the lifted track rises past 55% of the centre and goes back only after the card left the screen; a resting page shows the still (track up). */
export function cardState({ offset, still, go }) {
    if (still) return { go: true, live: false }
    const a = Math.abs(offset)
    return { go: a < 0.55 ? true : (a > 1.05 ? false : go), live: a < 1 }
}

const rectOffset = (win, el) => {
    const r = el.getBoundingClientRect()
    return centerOffset(r.top, r.height, win.innerHeight)
}

function paintMotif(win, m, H) {
    const s = motifState({ offset: rectOffset(win, m), paused: H.classList.contains('paused'), moving: H.classList.contains('moving') })
    m.style.opacity = s.opacity
    m.style.transform = s.reset ? '' : `translate3d(0,${s.shift}px,0)`
    m.classList.toggle('live', s.live)
}

function paintCard(win, card, H) {
    const still = H.classList.contains('paused') || !H.classList.contains('moving')
    const s = cardState({ offset: rectOffset(win, card), still, go: card.classList.contains('go') })
    card.classList.toggle('go', s.go)
    card.classList.toggle('live', s.live)
}

/**
 * Wire the vignettes. Does nothing with reduced motion.
 * @param {Window} win
 */
export function startAmbient(win) {
    const D = win.document
    const H = D.documentElement
    if (win.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const motifs = [...D.querySelectorAll('.v4-motif')]
    const card = D.querySelector('[data-v4-card]')
    H.classList.add('v4-armed')
    let raf = 0
    const tick = () => {
        raf = 0
        motifs.forEach(m => paintMotif(win, m, H))
        if (card) paintCard(win, card, H)
    }
    const kick = () => { if (!raf) raf = win.requestAnimationFrame(tick) }
    win.addEventListener('scroll', kick, { passive: true })
    win.addEventListener('resize', kick)
    D.addEventListener('motionchange', kick)
    tick()
}
