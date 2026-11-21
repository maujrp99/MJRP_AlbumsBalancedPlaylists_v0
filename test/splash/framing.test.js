/**
 * F80 · UAT-235 - the 3D crate seen on a diagonal and whole inside its frame: at every pose of the
 * scroll (the hero, each record pulled, the flip, side B) every corner of every plank and sleeve
 * lands inside the frame, at every computer width (the stage's frame goes from about 0.5 to 1.2,
 * width over height, between 900 and 1920 px of window).
 */
import { describe, it, expect } from 'vitest'
import { TRACKS, ORDER } from '../../public/splash/splash.js'
import { VIEWS, PAGE_VIEW, scenePoints, sleeveTargets, turnOf, cameraFor, project, faceTurn, recordAt } from '../../public/splash/framing.js'

// the frames the stage gets, measured in the browser (width / height of #scene): 900x800, 1024x768, 1280x800, 1440x900, 1920x1080
const FRAMES = { 900: 332 / 604, 1024: 451 / 572, 1280: 697 / 604, 1440: 690 / 704, 1920: 684 / 884, 'stage to the edge at 1440': 786 / 704, 'stage to the edge at 1920': 1020 / 884, tall: 0.5, wide: 1.3 }
const POSES = [
    ...ORDER.filter(t => t !== 'flip').map(t => [t, TRACKS[t].side === 'A' ? 0 : 1]),
    ...[0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9].map(f => ['flip', f])
]

const worstReach = (view, aspect, count = 14) => Math.max(...POSES.map(([track, flip]) => {
    const rot = turnOf(flip)
    const pts = scenePoints({ rot, sleeves: sleeveTargets(track, flip, TRACKS, count) }, view)
    return Math.max(...project(pts, cameraFor(view, rot, aspect, TRACKS, count)).flat().map(Math.abs))
}))

describe('UAT-235 · the crate on a diagonal, whole in its frame', () => {
    it('the page sees the crate on a diagonal, not straight on (the owner chose «Palco largo», preview 2)', () => {
        expect(PAGE_VIEW).toBe('b')
        expect(VIEWS[PAGE_VIEW].azimuth).toBeGreaterThanOrEqual(20)
    })

    it('the stage is wider than its column: it reaches the window\'s right edge', () => {
        expect(VIEWS[PAGE_VIEW].bleed).toBe(true)
    })

    for (const [name, aspect] of Object.entries(FRAMES)) {
        it(`nothing of the crate leaves the frame at ${name} (every pose, the flip included)`, () => {
            expect(worstReach(VIEWS[PAGE_VIEW], aspect)).toBeLessThanOrEqual(1)
            expect(worstReach(VIEWS[PAGE_VIEW], aspect, 15)).toBeLessThanOrEqual(1)
        })
    }

    it('today\'s straight camera is the one that cut the crate (the bug, kept as the reference)', () => {
        expect(worstReach(VIEWS.today, FRAMES[900])).toBeGreaterThan(1)
        expect(worstReach(VIEWS.today, FRAMES[1920])).toBeGreaterThan(1)
    })

    it('a crate of 15 keeps side B\'s records: the tracks count side B from the back', () => {
        expect(recordAt(3, 15)).toBe(3)
        expect(recordAt(10, 15)).toBe(11)
        expect(recordAt(13, 15)).toBe(14)
        expect(sleeveTargets('playlists', 1, TRACKS, 15)[11].lift).toBe(1)
        expect(sleeveTargets('blend', 0, TRACKS, 15)[5].lift).toBe(1)
    })

    it('a record turning to you picks the cover nearest the camera, never more than a quarter turn', () => {
        const az = (42 * Math.PI) / 180
        expect(faceTurn(az, 0)).toBeCloseTo(az)
        expect(Math.abs(faceTurn(az, Math.PI))).toBeLessThanOrEqual(Math.PI / 2)
        expect(faceTurn(az, Math.PI)).toBeCloseTo(az)
    })
})
