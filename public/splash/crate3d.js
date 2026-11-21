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
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60)
    camera.position.set(0, 4.9, 10.6); camera.lookAt(0, 1.75, 0)
    scene.add(new THREE.AmbientLight(0x3a2414, 1.1))
    const key = new THREE.DirectionalLight(0xfff4e8, 0.85); key.position.set(-2, 6, 5); scene.add(key)
    const fireA = new THREE.PointLight(0xf97316, 10, 0, 1.1); fireA.position.set(-1.4, 0.15, 3.6); scene.add(fireA)
    const fireB = new THREE.PointLight(0xdc2626, 8, 0, 1.1); fireB.position.set(1.6, 0, 3.3); scene.add(fireB)
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
    const W = 2.62, DEP = 4.3, HT = 1.05, T = 0.08
    const plank = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wood); m.position.set(x, y, z); crate.add(m) }
    plank(W, T, DEP, 0, 0, 0); plank(W, HT, T, 0, HT / 2, DEP / 2); plank(W, HT, T, 0, HT / 2, -DEP / 2); plank(T, HT, DEP, W / 2, HT / 2, 0); plank(T, HT, DEP, -W / 2, HT / 2, 0)

    // the sleeves: the page's covers on both faces, standing on the crate floor, pivoting from their bottom edge
    const SZ = 2.3
    const edge = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.8 })
    const geo = new THREE.BoxGeometry(SZ, SZ, 0.035); geo.translate(0, SZ / 2, 0)
    const imgs = [...D.querySelectorAll('#box .sl')]
    await Promise.all(imgs.map(im => (im.decode ? im.decode().catch(() => {}) : 0)))
    const maxAniso = renderer.capabilities.getMaxAnisotropy ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 4
    const sleeves = imgs.map((im, i) => {
        const tex = new THREE.Texture(im); tex.needsUpdate = true; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = maxAniso
        const face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 })
        const m = new THREE.Mesh(geo, [edge, edge, edge, edge, face, face])
        m.userData = { z: 1.82 - i * 0.28, lift: 0, tilt: -0.16 }
        m.position.set(0, T / 2, m.userData.z); crate.add(m)
        return m
    })

    let dirty = true
    const resize = () => {
        const r = canvas.getBoundingClientRect()
        if (!r.width) return
        renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); dirty = true
    }
    new win.ResizeObserver(resize).observe(canvas)

    // where each sleeve should be, from the scroll state
    const targets = () => {
        const st = page.state, tr = page.TRACKS[st.track], f = st.flip, s = f < 0.5 ? 1 : -1
        const lean = -0.16 * s
        return sleeves.map((m, i) => {
            let lift = 0, tilt = lean
            if (tr.pull >= 0 && f % 1 === 0) {
                if (i === tr.pull) { lift = 1; tilt = 0.04 * s } else if ((s > 0 && i < tr.pull) || (s < 0 && i > tr.pull)) tilt = 0.62 * s
            }
            return { lift, tilt }
        })
    }
    const fireOf = () => Number(win.getComputedStyle(scene3).getPropertyValue('--fire')) || 1
    let rot = 0, fireLv = fireOf(), tt = 0, raf = 0, visible = true, last = 0
    const step = (dt) => {
        const tg = targets(), st = page.state
        let moving = dirty
        dirty = false
        const k = Math.min(1, dt * 4.2)
        const rT = Math.PI * (st.flip < 0.5 ? 2 * st.flip * st.flip : 1 - 2 * (1 - st.flip) * (1 - st.flip))
        const dr = rT - rot
        rot += Math.abs(dr) > 0.0005 ? dr * Math.min(1, dt * 6) : dr
        if (Math.abs(dr) > 0.0005) moving = true
        crate.rotation.y = rot
        sleeves.forEach((m, i) => {
            const u = m.userData, t = tg[i]
            const dl = t.lift - u.lift, dti = t.tilt - u.tilt
            if (Math.abs(dl) > 0.001 || Math.abs(dti) > 0.001) moving = true
            u.lift += dl * k; u.tilt += dti * k
            m.position.y = T / 2 + u.lift * 1.55
            m.position.z = u.z + u.lift * 0.55 * (rot < Math.PI / 2 ? 1 : -1)
            m.rotation.x = u.tilt
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
