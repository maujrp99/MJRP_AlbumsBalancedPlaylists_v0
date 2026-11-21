/**
 * Where the camera stands to see the 3D crate of the entry page (F80, UAT-235): the crate seen on a
 * diagonal, and the whole crate inside its frame at every pose of the scroll — the hero, each record
 * pulled, the flip, side B. Pure math, no three.js: crate3d.js draws with it, the tests check it.
 *
 * The crate's geometry lives here too (the sizes crate3d.js builds), so the rule is checked against
 * the real corners of every plank and every sleeve, not against a guess.
 */

/** The crate: width, depth, height, plank thickness; the sleeves: side, spacing, first position. */
export const GEOM = Object.freeze({ W: 2.62, DEP: 4.3, HT: 1.05, T: 0.08, SZ: 2.3, Z0: 1.82, STEP: 0.28, COUNT: 14, LIFT: 1.55, FWD: 0.55 })

const DEG = Math.PI / 180

/**
 * The views previewed for UAT-235 (one axis: how diagonal the crate is seen and how much room it
 * gets); `today` is the camera the page shipped with, kept as the reference the tests measure against.
 * azimuth: how far the camera walks around the crate (0 = straight on, as today);
 * elevation: how far above it looks down; margin: the air left inside the frame, each side;
 * bleed: the stage reaches past its column to the window's right edge; face: the pulled record turns to you.
 */
export const VIEWS = Object.freeze({
    today: { azimuth: 0, elevation: 16.5, fov: 30, margin: 0, bleed: false, face: false, fixed: true },
    a: { azimuth: 30, elevation: 18, fov: 30, margin: 0.06, bleed: false, face: false },
    b: { azimuth: 30, elevation: 18, fov: 30, margin: 0.06, bleed: true, face: false },
    c: { azimuth: 42, elevation: 20, fov: 30, margin: 0.06, bleed: false, face: true }
})

/** The view the page shows: «Palco largo», the owner's choice (2026-11-21 «escolha: 2- palco largo»). */
export const PAGE_VIEW = 'b'

/** How each sleeve stands for a scroll state: lifted (0..1) and leaning (radians), as the page always did. */
export function sleeveTargets(track, flip, tracks, count = GEOM.COUNT) {
    const tr = tracks[track], s = flip < 0.5 ? 1 : -1
    const lean = -0.16 * s
    return Array.from({ length: count }, (_, i) => {
        let lift = 0, tilt = lean
        if (tr.pull >= 0 && flip % 1 === 0) {
            if (i === tr.pull) { lift = 1; tilt = 0.04 * s } else if ((s > 0 && i < tr.pull) || (s < 0 && i > tr.pull)) tilt = 0.62 * s
        }
        return { lift, tilt }
    })
}

/** The crate's turn for a flip progress (0 = side A, π = side B), eased as the page always did. */
export const turnOf = (f) => Math.PI * (f < 0.5 ? 2 * f * f : 1 - 2 * (1 - f) * (1 - f))

/**
 * How far a lifted record turns toward the viewer (view c): the camera sits at `azimuth` around the
 * crate, the crate itself has turned `rot`; the sleeve has a cover on both faces, so the nearest one
 * faces you. Returns the sleeve's own turn, in radians, for a lift of 1.
 */
export function faceTurn(azimuthRad, rot) {
    let a = azimuthRad - rot
    a = Math.atan2(Math.sin(a), Math.cos(a))
    if (a > Math.PI / 2) a -= Math.PI
    if (a < -Math.PI / 2) a += Math.PI
    return a
}

/** Where a sleeve stands in the crate's own space: its position and its turns. */
export function sleevePlace(i, lift, tilt, rot, view) {
    const azimuth = (view.azimuth || 0) * DEG
    const z = GEOM.Z0 - i * GEOM.STEP
    return {
        x: 0,
        y: GEOM.T / 2 + lift * GEOM.LIFT,
        z: z + lift * GEOM.FWD * (rot < Math.PI / 2 ? 1 : -1),
        tilt,
        turn: view.face ? faceTurn(azimuth, rot) * lift : 0
    }
}

const box = (x0, x1, y0, y1, z0, z1) => {
    const out = []
    for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) out.push([x, y, z])
    return out
}
const rotY = ([x, y, z], a) => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)]
const rotX = ([x, y, z], a) => [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)]

/** Every corner of the crate's planks and sleeves in the world, for a pose: { rot, sleeves: [{lift, tilt}] }. */
export function scenePoints(pose, view) {
    const { W, DEP, HT, T, SZ } = GEOM
    const pts = []
    const planks = [
        [W, T, DEP, 0, 0, 0], [W, HT, T, 0, HT / 2, DEP / 2], [W, HT, T, 0, HT / 2, -DEP / 2],
        [T, HT, DEP, W / 2, HT / 2, 0], [T, HT, DEP, -W / 2, HT / 2, 0]
    ]
    for (const [w, h, d, x, y, z] of planks) {
        for (const p of box(x - w / 2, x + w / 2, y - h / 2, y + h / 2, z - d / 2, z + d / 2)) pts.push(rotY(p, pose.rot))
    }
    pose.sleeves.forEach((s, i) => {
        const pl = sleevePlace(i, s.lift, s.tilt, pose.rot, view)
        for (const c of box(-SZ / 2, SZ / 2, 0, SZ, -0.0175, 0.0175)) {
            // the sleeve's own turns (tilt about x first, then the turn about y), then its place, then the crate's turn
            const local = rotY(rotX(c, pl.tilt), pl.turn)
            pts.push(rotY([local[0] + pl.x, local[1] + pl.y, local[2] + pl.z], pose.rot))
        }
    })
    return pts
}

/**
 * The room the crate may take at a turn, whatever record is pulled: every corner of every settled
 * pose of the page (each track, on either side), at this turn. The camera is fitted to this, so it
 * stays still while records come and go, and only breathes back while the crate turns.
 */
export function envelopePoints(rot, view, tracks) {
    const pts = []
    for (const track of Object.keys(tracks)) {
        for (const flip of [0, 1]) pts.push(...scenePoints({ rot, sleeves: sleeveTargets(track, flip, tracks) }, view))
    }
    return pts
}

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l] }
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]

/** The camera's axes for a view: u from the target to the camera, r to the right, v up on the screen. */
export function cameraAxes(view) {
    const az = view.azimuth * DEG, el = view.elevation * DEG
    const u = [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)]
    const r = norm(cross([0, 1, 0], u))
    return { u, r, v: cross(u, r) }
}

/** Where points land on the screen (-1..1 each way) for a camera { position, target, fov, aspect }. */
export function project(points, cam) {
    const u = norm(sub(cam.position, cam.target)), r = norm(cross([0, 1, 0], u)), v = cross(u, r)
    const tv = Math.tan((cam.fov * DEG) / 2), th = tv * cam.aspect
    return points.map((p) => {
        const a = sub(p, cam.position)
        const depth = -dot(a, u)
        return [dot(a, r) / (depth * th), dot(a, v) / (depth * tv)]
    })
}

/**
 * The camera for a view and a frame's aspect (width / height) that holds every point inside the
 * frame with the view's margin, centred: returns { position, target, fov, aspect }.
 */
export function fitCamera(points, view, aspect) {
    const { u, r, v } = cameraAxes(view)
    const tv = Math.tan((view.fov * DEG) / 2) * (1 - view.margin), th = Math.tan((view.fov * DEG) / 2) * aspect * (1 - view.margin)
    let target = [0, 0, 0]
    for (const p of points) target = [target[0] + p[0] / points.length, target[1] + p[1] / points.length, target[2] + p[2] / points.length]
    let d = 0
    for (let pass = 0; pass < 6; pass++) {
        d = 0
        for (const p of points) {
            const a = sub(p, target), along = dot(a, u)
            d = Math.max(d, along + Math.abs(dot(a, r)) / th, along + Math.abs(dot(a, v)) / tv)
        }
        // centre what the camera sees: move the target by the middle of the points' spread on the screen
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
        for (const p of points) {
            const a = sub(p, target), depth = d - dot(a, u)
            const x = dot(a, r) / depth, y = dot(a, v) / depth
            x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y)
        }
        const cx = ((x0 + x1) / 2) * d, cy = ((y0 + y1) / 2) * d
        target = [target[0] + r[0] * cx + v[0] * cy, target[1] + r[1] * cx + v[1] * cy, target[2] + r[2] * cx + v[2] * cy]
    }
    return { position: [target[0] + u[0] * d, target[1] + u[1] * d, target[2] + u[2] * d], target, fov: view.fov, aspect }
}

/** Today's camera, as the page shipped it: fixed, straight on, whatever the frame. */
export const TODAY_CAMERA = Object.freeze({ position: [0, 4.9, 10.6], target: [0, 1.75, 0], fov: 30 })

/** The camera for a view at a turn of the crate and a frame's aspect. */
export function cameraFor(view, rot, aspect, tracks) {
    if (view.fixed) return { ...TODAY_CAMERA, aspect }
    return fitCamera(envelopePoints(rot, view, tracks), view, aspect)
}
