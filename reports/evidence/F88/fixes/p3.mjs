import { connect, helpers, state, sleep, MUSICKIT_STUB, save } from './lib.mjs'
const c = await connect(); const h = helpers(c)
await c.send('Page.addScriptToEvaluateOnNewDocument', { source: MUSICKIT_STUB(false) })
const M = `(() => { const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.left*10)/10, Math.round(b.top*10)/10, Math.round(b.width*10)/10, Math.round(b.height*10)/10] }; const vis = (e) => e && e.getBoundingClientRect().width > 0 && getComputedStyle(e).display !== 'none'; const q = (s) => [...document.querySelectorAll(s)].find(vis);
 return { iw: innerWidth, sw: document.documentElement.scrollWidth, phone: !!document.querySelector('#phone-topbar'), topmenu: vis(document.querySelector('.top-menu')), header: r(q('.top-menu__row, #phone-topbar, header.top')), logo: r(q('.top-menu__logo, .phone-topbar__logo, .logo')), bar: r(q('nav.ms')), tabbar: r(document.querySelector('#phone-tabbar')), stops: [...document.querySelectorAll('nav.ms .stop')].filter(vis).map(e => [e.textContent.trim(), ...r(e)]) } })()`
const out = {}
for (const signedIn of [false, true]) {
  state.signedIn = signedIn
  await h.size(800, 900, false); await h.clear()
  if (signedIn) { await h.go('/start', 'document.querySelector("#userMenuBtn")'); await h.writeAccount() }
  for (const [name, path] of [['start', '/start'], ['albums', '/albums'], ['playlists', '/playlists'], ['inventory', '/inventory'], ['blend', '/blend']]) {
    await h.go(path, 'document.querySelector("#phone-topbar, .top-menu")', 1500); await h.hideToasts()
    out[`${signedIn ? 'in' : 'out'}-${name}-800`] = await c.run(M)
    await h.shot(`p3-app-${signedIn ? 'in' : 'out'}-${name}-800`)
  }
  await h.go('/home', 'document.querySelector("header.top")', 1500)
  out[`${signedIn ? 'in' : 'out'}-home-800`] = await c.run(M)
  await h.shot(`p3-home-${signedIn ? 'in' : 'out'}-800`)
}
for (const w of [768, 899, 900]) {
  await h.size(w, 900, false); await h.go('/albums', 'document.querySelector("#phone-topbar, .top-menu")', 1200)
  out[`app-${w}`] = await c.run(M)
  await h.go('/home', 'document.querySelector("header.top")', 1200)
  out[`home-${w}`] = await c.run(M)
}
save('p3.json', out); console.log(JSON.stringify(out, null, 0).slice(0, 6000)); console.log(state.errors.slice(0, 8)); c.ws.close()
