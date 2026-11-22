/**
 * F80 (UAT-240, UAT-241), v4 «o ritmo da página»: each story has a vignette (fire and music) that fades in
 * as the story enters and out as it leaves, tied to the scroll; transform and opacity only; the loops run
 * only while the vignette is on screen and the page is «moving»; the pause icon and the rest timer show the
 * still; with reduced motion nothing moves. Hand-over table: design/proposals/f80-splash/proposal.md § v4.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { centerOffset, fadeOpacity, motifState, cardState, startAmbient } from '../../public/splash/ambient.js'

const page = readFileSync(resolve(process.cwd(), 'public/splash.html'), 'utf8')

describe('where a vignette is on the screen', () => {
    it('the offset is 0 at the middle of the screen and 1 at an edge; an element with no height is far away', () => {
        expect(centerOffset(300, 200, 800)).toBe(0)
        expect(centerOffset(-100, 200, 800)).toBe(-1)
        expect(centerOffset(700, 200, 800)).toBe(1)
        expect(centerOffset(0, 0, 800)).toBe(9)
    })

    it('fully there across the middle (under 62% of the half-height), gone by 95%', () => {
        expect(fadeOpacity(0)).toBe(1)
        expect(fadeOpacity(0.62)).toBe(1)
        expect(fadeOpacity(0.785)).toBeCloseTo(0.5)
        expect(fadeOpacity(0.95)).toBeCloseTo(0)
        expect(fadeOpacity(3)).toBe(0)
    })
})

describe('what a vignette does', () => {
    it('on screen and moving: faded by the scroll, drifting centre × 10 px, looping', () => {
        expect(motifState({ offset: 0.5, paused: false, moving: true })).toEqual({ opacity: '1.000', shift: '5.0', live: true, reset: false })
        expect(motifState({ offset: 0.785, paused: false, moving: true }).opacity).toBe('0.500')
    })

    it('when the page rests the loops stop and the still shows, still faded by the scroll', () => {
        expect(motifState({ offset: 0, paused: false, moving: false })).toMatchObject({ opacity: '1.000', live: false, reset: false })
    })

    it('off screen it does not loop even while moving', () => {
        expect(motifState({ offset: 2, paused: false, moving: true })).toMatchObject({ opacity: '0.000', live: false })
    })

    it('the pause icon gives back the composed still: the inline fade and drift are dropped', () => {
        expect(motifState({ offset: 0.9, paused: true, moving: true })).toEqual({ opacity: '', shift: '', live: false, reset: true })
    })
})

describe('the ranking card', () => {
    it('the track rises when the card passes 55% of the centre, and goes back only after it left the screen', () => {
        expect(cardState({ offset: 0.4, still: false, go: false })).toEqual({ go: true, live: true })
        expect(cardState({ offset: 0.8, still: false, go: true })).toEqual({ go: true, live: true })
        expect(cardState({ offset: 1.2, still: false, go: true })).toEqual({ go: false, live: false })
    })

    it('at rest or paused the card is its still: the track is up', () => {
        expect(cardState({ offset: 1.5, still: true, go: false })).toEqual({ go: true, live: false })
    })
})

describe('the vignettes on the page', () => {
    it('five, one per story, decorative, each in the story\'s lead beside the phone\'s cover', () => {
        const motifs = [...page.matchAll(/<div class="v4-motif m-(\w+)"[^>]*>/g)]
        expect(motifs.map(m => m[1])).toEqual(['start', 'albums', 'blend', 'pl', 'inv'])
        motifs.forEach(m => expect(m[0]).toContain('aria-hidden="true"'))
        expect(page.match(/<div class="v4-lead">/g)).toHaveLength(5)
    })

    it('the story heights and the phone\'s opening live in the style block', () => {
        expect(page).toContain('clamp(540px,70dvh,680px)')
        expect(page).toContain('clamp(440px,56dvh,560px)')
        expect(page).toMatch(/@media \(max-width:899px\)\{[^}]*\n?[\s\S]*\.hero \.what\{display:none\}/)
    })

    it('the opening: the title, then the orange line, then the paragraph (hidden on the phone)', () => {
        expect(page).toMatch(/<h1 id="h1" data-i18n="h\.title"><\/h1>\s*<p class="h-sub" data-i18n="h\.what"><\/p>\s*<p class="what" data-i18n="h\.para"><\/p>/)
    })

    it('«Entrar» of the opening is hidden on the phone: the header keeps the only one', () => {
        expect(page).toMatch(/\.hero \.ctas \.btn-ghost\{display:none\}/)
    })

    it('on the phone: the language buttons are 44 px wide, and the line under the title keeps a gap above the button, with or without an account', () => {
        expect(page).toContain('.lang button{min-width:44px;padding:0 6px}')
        expect(page).toContain('.hero .h-sub{margin-bottom:18px}')
        expect(page).not.toContain('.hero .only-in h1{margin-bottom:18px}')
    })

    it('with an account the opening says the same approved lines as without one (the owner, 2026-11-22: «1. sim»)', () => {
        const signedIn = page.slice(page.indexOf('<div class="only-in">', page.indexOf('id="a1"')))
        const opening = signedIn.slice(0, signedIn.indexOf('</div>\n  </section>'))
        for (const key of ['h.kick', 'h.title', 'h.what', 'h.para']) expect(opening).toContain(`data-i18n="${key}"`)
        expect(page).not.toMatch(/data-i18n="hi\./)
    })

    it('the crate\'s diagonal is in the style on a computer, so the covers do not move when the script arrives', () => {
        expect(page).toContain('@media (min-width:900px){.crate-css{--yaw:-15deg}}')
    })

    it('loops only run on a live vignette, and reduced motion removes them', () => {
        expect(page).toContain('html:not(.moving) .v4-motif *')
        expect(page).toMatch(/prefers-reduced-motion:reduce\)\{\.v4-motif,/)
    })
})

describe('wired', () => {
    beforeEach(() => {
        document.documentElement.className = 'moving'
        document.body.innerHTML = '<div class="v4-motif m-start"></div><div class="rank-real" data-v4-card></div>'
    })
    const win = (reduce) => ({ document, matchMedia: () => ({ matches: reduce }), innerHeight: 800, requestAnimationFrame: (fn) => { fn(); return 1 }, addEventListener: () => {} })

    it('arms the page and lays each vignette out; the lone element has no height, so it is off screen', () => {
        startAmbient(win(false))
        expect(document.documentElement.classList.contains('v4-armed')).toBe(true)
        expect(document.querySelector('.v4-motif').style.opacity).toBe('0')
        expect(document.querySelector('.rank-real').classList.contains('go')).toBe(false)
    })

    it('with reduced motion it does not even arm', () => {
        startAmbient(win(true))
        expect(document.documentElement.classList.contains('v4-armed')).toBe(false)
        expect(document.querySelector('.v4-motif').style.opacity).toBe('')
    })

    it('the pause icon (html.paused) shows the stills', () => {
        document.documentElement.classList.add('paused')
        startAmbient(win(false))
        expect(document.querySelector('.v4-motif').classList.contains('live')).toBe(false)
        expect(document.querySelector('.rank-real').classList.contains('go')).toBe(true)
        vi.restoreAllMocks()
    })
})
