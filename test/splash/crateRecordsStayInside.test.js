/**
 * F80 · UAT-289 - no record of the 3D crate goes through the wood. The owner saw it on the computer
 * (2026-11-23): the record in front of the row lay fallen forward through the crate's front wall while
 * a later one was lifted in focus. It was the resting pose itself: every record in front of the pulled
 * one flipped forward to the same browsing angle, and at that angle the two nearest the wall pass
 * through it (the straight-on camera of the prototype hid it; the diagonal one of UAT-235 shows it).
 *
 * The rule, on every resting pose of the page (each track on its side, crates of 14 and of 15): a record
 * is standing in the row, flipped forward inside the crate, or the one lifted in focus; none is inside
 * a plank; none passes through its neighbour. And while the crate turns, a lifted record never jumps.
 */
import { describe, it, expect } from 'vitest'
import { TRACKS, ORDER } from '../../public/splash/splash.js'
import { GEOM, VIEWS, PAGE_VIEW, sleeveTargets, sleevePlace, recordAt } from '../../public/splash/framing.js'

const { W, DEP, HT, T, SZ } = GEOM
const THICK = 0.035
// the planks crate3d.js builds: [width, height, depth, x, y, z]
const PLANKS = {
    floor: [W, T, DEP, 0, 0, 0], 'front wall': [W, HT, T, 0, HT / 2, DEP / 2], 'back wall': [W, HT, T, 0, HT / 2, -DEP / 2],
    'right wall': [T, HT, DEP, W / 2, HT / 2, 0], 'left wall': [T, HT, DEP, -W / 2, HT / 2, 0]
}
const view = VIEWS[PAGE_VIEW]
const RESTING = ORDER.filter(t => t !== 'flip').map(t => [t, TRACKS[t].side === 'A' ? 0 : 1])

/** Points all over a record's two faces, in the crate's own space (the record pivots on its bottom edge). */
function facePoints(place) {
    const pts = []
    for (let a = 0; a <= 40; a++) {
        for (const x of [-SZ / 2, 0, SZ / 2]) {
            for (const d of [-THICK / 2, THICK / 2]) {
                const up = (SZ * a) / 40
                pts.push([x, place.y + up * Math.cos(place.tilt) - d * Math.sin(place.tilt), place.z + up * Math.sin(place.tilt) + d * Math.cos(place.tilt)])
            }
        }
    }
    return pts
}

/** How deep a point is inside a plank (0 = outside). */
const depthIn = ([x, y, z], [w, h, d, px, py, pz]) => Math.max(0, Math.min(x - (px - w / 2), px + w / 2 - x, y - (py - h / 2), py + h / 2 - y, z - (pz - d / 2), pz + d / 2 - z))

/** The records inside the wood on a resting pose: ['record 0 in the front wall', ...]. */
function inTheWood(track, flip, count) {
    const rot = flip < 0.5 ? 0 : Math.PI
    const out = []
    sleeveTargets(track, flip, TRACKS, count).forEach((s, i) => {
        const pts = facePoints(sleevePlace(i, s.lift, s.tilt, rot, view, count))
        for (const [name, plank] of Object.entries(PLANKS)) {
            // the foot of a leaning record presses its corner into the floor by a fraction of its cardboard (at most 0.011): that is standing, not crossing
            if (Math.max(...pts.map(p => depthIn(p, plank))) > 0.012) out.push(`record ${i} in the ${name}`)
        }
    })
    return out
}

describe('UAT-289 · the records of the 3D crate stay out of the wood', () => {
    for (const count of [14, 15]) {
        for (const [track, flip] of RESTING) {
            it(`no record is inside a plank on «${track}» (a crate of ${count})`, () => {
                expect(inTheWood(track, flip, count)).toEqual([])
            })
        }
    }

    it('the sequence the owner saw: «blend» pulls a later record, the one in front of the row leans on the front wall, not through it', () => {
        const targets = sleeveTargets('blend', 0, TRACKS, 15)
        expect(targets[5].lift).toBe(1)
        // the front wall's inner top edge, seen from the foot of the first record: it can lean no further than this
        const limit = Math.atan2(DEP / 2 - T / 2 - GEOM.Z0, HT - T / 2)
        expect(targets[0].tilt).toBeGreaterThan(0.16)
        expect(targets[0].tilt).toBeLessThan(limit)
    })

    it('side B is the same at the other wall: «playlists» leaves the last record leaning on the back wall, not through it', () => {
        const targets = sleeveTargets('playlists', 1, TRACKS, 15)
        const limit = Math.atan2(DEP / 2 - T / 2 - GEOM.Z0, HT - T / 2)
        expect(targets[14].tilt).toBeLessThan(-0.16)
        expect(targets[14].tilt).toBeGreaterThan(-limit)
    })

    it('every record in front of the pulled one is flipped forward, each a little more than the one it rests on, none past the browsing angle', () => {
        for (const count of [14, 15]) {
            for (const [track, flip] of RESTING) {
                const pull = TRACKS[track].pull >= 0 ? recordAt(TRACKS[track].pull, count) : -1
                const side = flip ? -1 : 1
                const targets = sleeveTargets(track, flip, TRACKS, count)
                // nearest the wall first
                const front = targets.map((s, i) => ({ ...s, i })).filter(s => pull >= 0 && (side > 0 ? s.i < pull : s.i > pull))
                if (side < 0) front.reverse()
                front.forEach((s, k) => {
                    expect(s.lift).toBe(0)
                    expect(s.tilt * side).toBeGreaterThan(0.16)
                    expect(s.tilt * side).toBeLessThanOrEqual(0.62)
                    if (k) expect(s.tilt * side).toBeGreaterThanOrEqual(front[k - 1].tilt * side)
                })
                // the others stand in the row, leaning back a little, and the pulled one is lifted
                targets.forEach((s, i) => {
                    if (i === pull) expect(s.lift).toBe(1)
                    else if (!front.some(f => f.i === i)) expect(s).toEqual({ lift: 0, tilt: -0.16 * side })
                })
            }
        }
    })

    it('no record passes through its neighbour: the row keeps its order at every height', () => {
        for (const count of [14, 15]) {
            for (const [track, flip] of RESTING) {
                const rot = flip ? Math.PI : 0
                const targets = sleeveTargets(track, flip, TRACKS, count)
                for (let i = 1; i < count; i++) {
                    if (targets[i].lift || targets[i - 1].lift) continue
                    const front = sleevePlace(i - 1, 0, targets[i - 1].tilt, rot, view, count), back = sleevePlace(i, 0, targets[i].tilt, rot, view, count)
                    for (let a = 0; a <= 40; a++) {
                        const y = (SZ * a) / 40
                        const reach = (p) => y / Math.cos(p.tilt)
                        if (reach(front) > SZ || reach(back) > SZ) continue
                        // at this height the record behind stays behind, by at least the cardboard of the two
                        expect(front.z + y * Math.tan(front.tilt) - (back.z + y * Math.tan(back.tilt)), `${track}, records ${i - 1} and ${i}, height ${y.toFixed(2)}`).toBeGreaterThanOrEqual(THICK)
                    }
                }
            }
        }
    })

    it('where there is room the browsing angle is the design\'s: far from the wall a flipped record reaches 0.62', () => {
        const tracks = { deep: { side: 'A', pull: 9 } }
        expect(sleeveTargets('deep', 0, tracks, 14)[8].tilt).toBeCloseTo(0.62)
    })

    it('on its way up and down the record nearest the wall clears the wall first, then comes forward (it used to cross the wall\'s top plank)', () => {
        for (const count of [14, 15]) {
            for (const [i, rot, side] of [[0, 0, 1], [count - 1, Math.PI, -1]]) {
                const flipped = sleeveTargets(side > 0 ? 'start' : 'inventory', side > 0 ? 0 : 1, TRACKS, count)[i].tilt
                for (const tilt of [flipped, 0.04 * side, -0.16 * side]) {
                    for (let lift = 0; lift <= 1.0001; lift += 0.01) {
                        const deep = Math.max(...facePoints(sleevePlace(i, lift, tilt, rot, view, count)).map(p => Math.max(depthIn(p, PLANKS['front wall']), depthIn(p, PLANKS['back wall']))))
                        expect(deep, `record ${i}, lift ${lift.toFixed(2)}, tilt ${tilt.toFixed(2)}`).toBeLessThanOrEqual(0.001)
                    }
                }
            }
        }
    })

    it('a lifted record does not jump while the crate turns (it used to leap from one side to the other at the quarter turn)', () => {
        for (let rot = 0; rot < Math.PI; rot += 0.01) {
            const a = sleevePlace(5, 1, 0.04, rot, view, 15), b = sleevePlace(5, 1, 0.04, rot + 0.01, view, 15)
            expect(Math.abs(a.z - b.z), `at a turn of ${rot.toFixed(2)}`).toBeLessThan(0.02)
        }
        for (let lift = 0; lift < 1; lift += 0.01) {
            expect(Math.abs(sleevePlace(5, lift + 0.01, 0.04, 0, view, 15).z - sleevePlace(5, lift, 0.04, 0, view, 15).z), `at a lift of ${lift.toFixed(2)}`).toBeLessThan(0.04)
        }
        expect(sleevePlace(5, 1, 0.04, 0, view, 15).z - sleevePlace(5, 0, 0.04, 0, view, 15).z).toBeCloseTo(GEOM.FWD)
        expect(sleevePlace(5, 1, 0.04, Math.PI, view, 15).z - sleevePlace(5, 0, 0.04, Math.PI, view, 15).z).toBeCloseTo(-GEOM.FWD)
    })
})
