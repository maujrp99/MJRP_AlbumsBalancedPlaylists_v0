/**
 * The real 3D crate of the entry page (F80, REQ-04) — the prototype's scene (design/inception/
 * splash-crate-v2.html): an open crate of dark planks, 14 sleeves standing in it with the page's own
 * cover images as textures, the fire as orange and red light from below. Computer only, with WebGL,
 * without a request for less motion, after the page has loaded (splash.js decides). It draws only
 * when something changes; when the context is lost the CSS crate comes back.
 *
 * three.js comes from the jsDelivr CDN at the version the proposal measured (0.185.0, ~155 KB
 * compressed); a full URL, so Vite leaves it out of the build. If it does not arrive, the CSS crate stays.
 */
import { VIEWS, cameraFor, sleevePlace, sleeveTargets, turnOf, stepOf, GEOM } from './framing.js'

export const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.185.0/build/three.module.min.js'

/**
 * @param {Window} win
 * @param {object} page - what splash.js returns: TRACKS, state, moving()
 */
export async function startCrate3d(win, page) {
    const D = win.document
    const THREE = await import(/* @vite-ignore */ THREE_URL)
    const stage = D.getElementById('stage'), scene3 = D.getElementById('scene')
    const canvas = D.createElement('canvas')
    canvas.className = 'gl'
    canvas.setAttribute('aria-hidden', 'true')
    scene3.insertBefore(canvas, D.getElementById('crate-css'))
    let renderer
    try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, failIfMajorPerformanceCaveat: true })
    } catch {
        canvas.remove()
        return
    }
    renderer.setPixelRatio(Math.min(win.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    const scene = new THREE.Scene()
    const view = page.view || VIEWS.today
    const camera = new THREE.PerspectiveCamera(view.fov, 1, 0.1, 80)
    // the lights walk around with the camera, so the fire still lights the crate from below, in front
    const az = (view.azimuth * Math.PI) / 180
    const around = (l, x, y, z) => l.position.set(x * Math.cos(az) + z * Math.sin(az), y, -x * Math.sin(az) + z * Math.cos(az))
    scene.add(new THREE.AmbientLight(0x3a2414, 1.1))
    const key = new THREE.DirectionalLight(0xfff4e8, 0.85); around(key, -2, 6, 5); scene.add(key)
    const fireA = new THREE.PointLight(0xf97316, 10, 0, 1.1); around(fireA, -1.4, 0.15, 3.6); scene.add(fireA)
    const fireB = new THREE.PointLight(0xdc2626, 8, 0, 1.1); around(fireB, 1.6, 0, 3.3); scene.add(fireB)
    let aspect = 1, camRot = NaN
    const aim = (rot) => {
        const c = cameraFor(view, rot, aspect, page.TRACKS, imgs.length)
        camera.position.set(...c.position); camera.lookAt(...c.target); camera.updateProjectionMatrix()
        camRot = rot
    }
    const crate = new THREE.Group(); scene.add(crate)

    // the crate: an open box of dark planks
    const pc = D.createElement('canvas'); pc.width = 256; pc.height = 128
    const px = pc.getContext('2d')
    px.fillStyle = '#2e1d10'; px.fillRect(0, 0, 256, 128)
    for (let i = 0; i < 3; i++) {
        px.fillStyle = i % 2 ? '#3a2616' : '#33200f'; px.fillRect(0, i * 43, 256, 40)
        px.fillStyle = 'rgba(0,0,0,.45)'; px.fillRect(0, i * 43 + 40, 256, 3)
    }
    const wt = new THREE.CanvasTexture(pc); wt.colorSpace = THREE.SRGBColorSpace
    const wood = new THREE.MeshStandardMaterial({ map: wt, roughness: 0.85 })
    const { W, DEP, HT, T } = GEOM
    const plank = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wood); m.position.set(x, y, z); crate.add(m) }
    plank(W, T, DEP, 0, 0, 0); plank(W, HT, T, 0, HT / 2, DEP / 2); plank(W, HT, T, 0, HT / 2, -DEP / 2); plank(T, HT, DEP, W / 2, HT / 2, 0); plank(T, HT, DEP, -W / 2, HT / 2, 0)

    // the sleeves: the page's covers on both faces, standing on the crate floor, pivoting from their bottom edge
    const SZ = GEOM.SZ
    const edge = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.8 })
    const geo = new THREE.BoxGeometry(SZ, SZ, GEOM.TH); geo.translate(0, SZ / 2, 0)
    const imgs = [...D.querySelectorAll('#box .sl')]
    await Promise.all(imgs.map(im => (im.decode ? im.decode().catch(() => {}) : 0)))
    const maxAniso = renderer.capabilities.getMaxAnisotropy ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 4
    const sleeves = imgs.map((im, i) => {
        const tex = new THREE.Texture(im); tex.needsUpdate = true; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = maxAniso
        const face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 })
        const m = new THREE.Mesh(geo, [edge, edge, edge, edge, face, face])
        m.userData = { lift: 0, tilt: -0.16 }
        m.rotation.order = 'YXZ'
        m.position.set(0, T / 2, GEOM.Z0 - i * stepOf(imgs.length)); crate.add(m)
        return m
    })

    let dirty = true
    const resize = () => {
        const r = canvas.getBoundingClientRect()
        if (!r.width) return
        renderer.setSize(r.width, r.height, false); aspect = camera.aspect = r.width / r.height; camRot = NaN; dirty = true
    }
    new win.ResizeObserver(resize).observe(canvas)

    // where each sleeve should be, from the scroll state
    const targets = () => sleeveTargets(page.state.track, page.state.flip, page.TRACKS, sleeves.length)
    const fireOf = () => Number(win.getComputedStyle(scene3).getPropertyValue('--fire')) || 1
    let rot = 0, fireLv = fireOf(), tt = 0, raf = 0, visible = true, last = 0
    const step = (dt) => {
        const tg = targets(), st = page.state
        let moving = dirty
        dirty = false
        const k = Math.min(1, dt * 4.2)
        const rT = turnOf(st.flip)
        const dr = rT - rot
        rot += Math.abs(dr) > 0.0005 ? dr * Math.min(1, dt * 6) : dr
        if (Math.abs(dr) > 0.0005) moving = true
        crate.rotation.y = rot
        if (!(Math.abs(rot - camRot) < 0.0005)) aim(rot)
        sleeves.forEach((m, i) => {
            const u = m.userData, t = tg[i]
            const dl = t.lift - u.lift, dti = t.tilt - u.tilt
            if (Math.abs(dl) > 0.001 || Math.abs(dti) > 0.001) moving = true
            u.lift += dl * k; u.tilt += dti * k
            const pl = sleevePlace(i, u.lift, u.tilt, rot, view, sleeves.length)
            m.position.set(pl.x, pl.y, pl.z)
            m.rotation.set(pl.tilt, pl.turn, 0, 'YXZ')
        })
        const fT = fireOf()
        fireLv += (fT - fireLv) * Math.min(1, dt * 3)
        if (Math.abs(fT - fireLv) > 0.005) moving = true
        const anim = page.moving()
        if (anim) tt += dt
        const fl = anim ? (1 + 0.18 * Math.sin(tt * 7.1) + 0.1 * Math.sin(tt * 13.7 + 1) + 0.07 * Math.sin(tt * 23.3)) : 1
        const fl2 = anim ? (1 + 0.16 * Math.sin(tt * 5.3 + 2) + 0.1 * Math.sin(tt * 17.9)) : 1
        fireA.intensity = 12 * fireLv * fl; fireB.intensity = 9 * fireLv * fl2
        renderer.render(scene, camera)
        if (!stage.classList.contains('live')) stage.classList.add('live')
        return moving || anim
    }
    const loop = (ts) => {
        raf = 0
        if (!visible || D.hidden) return
        const dt = last ? Math.min((ts - last) / 1000, 0.05) : 0.016
        last = ts
        if (step(dt)) raf = win.requestAnimationFrame(loop); else last = 0
    }
    const kick = () => { if (!raf && visible && !D.hidden) raf = win.requestAnimationFrame(loop) }
    new win.IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible) kick() }).observe(stage)
    for (const name of ['visibilitychange', 'scrollstate', 'motionchange', 'trackchange']) D.addEventListener(name, kick)
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stage.classList.remove('live') })
    resize(); kick()
}
