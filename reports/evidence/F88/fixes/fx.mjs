import { connect, helpers, state, sleep, MUSICKIT_STUB, save } from './lib.mjs'
const c = await connect(); const h = helpers(c)
const out = {}
const Q = `(() => { const b = document.querySelector('#userMenuBtn'); return { label: b?.getAttribute('aria-label'), apple: b?.dataset.apple, dots: document.querySelector('[data-connection-dots]')?.innerHTML || '', sw: document.documentElement.scrollWidth, iw: innerWidth } })()`
let stubId
const setStub = async (authorized) => { if (stubId) await c.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: stubId }); stubId = (await c.send('Page.addScriptToEvaluateOnNewDocument', { source: MUSICKIT_STUB(authorized) })).result.identifier }
const login = async (w, mobile) => { await h.size(w, mobile ? 852 : 900, mobile); await h.clear(); state.signedIn = true; await h.go('/start', 'document.querySelector("#userMenuBtn, #phoneMenuBtn")'); await h.writeAccount() }
const logout = async (w, mobile) => { await h.size(w, mobile ? 852 : 900, mobile); await h.clear(); state.signedIn = false }
// P1: the dots, at load and once idle
for (const [name, authorized, apple] of [['authorized', true, 'ok'], ['not-authorized', false, 'ok'], ['failed', true, 'failed']]) {
  await setStub(authorized); state.apple = apple; state.appleDelay = 2500
  await login(1280, false)
  await h.go('/albums', 'document.querySelector("#userMenuBtn")', 200); await h.hideToasts()
  out[`p1-${name}-pending`] = await c.run(Q)
  await h.shot(`p1-${name}-1-pending-1280`, { x: 900, y: 0, width: 380, height: 80 })
  await sleep(7000)
  out[`p1-${name}-settled`] = await c.run(Q)
  await h.shot(`p1-${name}-2-settled-1280`, { x: 900, y: 0, width: 380, height: 80 })
  // the panel reuses the answer
  await c.run(`document.querySelector('#userMenuBtn').click()`); await sleep(400)
  out[`p1-${name}-panel`] = await c.run(`document.querySelector('#userMenu [data-connection=apple] [data-status]').textContent`)
  await h.shot(`p1-${name}-3-panel-1280`, { x: 880, y: 0, width: 400, height: 420 })
}
state.apple = 'ok'; state.appleDelay = 0
// signed out label
await setStub(false); await logout(1280, false); await h.go('/albums', 'document.querySelector("#userMenuBtn")', 200); out['p1-out-pending'] = await c.run(Q); await sleep(6000); out['p1-out-settled'] = await c.run(Q)
// P5 + P6 at 1280 signed in, authorized
await setStub(true); await login(1280, false); await h.go('/albums', 'document.querySelector("[data-account-name]")', 3500); await h.hideToasts()
await h.shot('p5-signed-in-1280', { x: 900, y: 0, width: 380, height: 80 })
await c.run(`document.querySelector('#userMenuBtn').click()`); await sleep(500)
await c.run(`document.querySelector('#userMenu [data-connection=apple] button').click()`); await sleep(600)
await h.shot('p6-ask-1280')
await c.run(`[...document.querySelectorAll('.app-modal button')].find(b => /Disconnect/.test(b.textContent)).click()`); await sleep(900)
out.p6 = await c.run(`({ open: document.querySelector('#userMenuBtn').getAttribute('aria-expanded'), apple: document.querySelector('#userMenu [data-connection=apple] [data-status]').textContent, focus: document.activeElement?.getAttribute('aria-label') || document.activeElement?.tagName })`)
await h.shot('p6-after-disconnect-1280', { x: 880, y: 0, width: 400, height: 420 })
await logout(1280, false); await h.go('/albums', 'document.querySelector("#loginBtn")', 800)
await h.shot('p5-sign-in-1280', { x: 900, y: 0, width: 380, height: 80 })
// P7
for (const [w, mobile] of [[1280, false], [393, true], [800, false]]) for (const r of ['/artists', '/genres', '/tracks']) {
  await logout(w, mobile); await h.go(r, 'document.querySelector("#phone-topbar, .top-menu")', 1000)
  out[`p7-${r}-${w}`] = await c.run(`[...document.querySelectorAll('[aria-current]')].filter(e => e.getBoundingClientRect().width > 0).map(e => e.textContent.trim().replace(/\\s+/g,' '))`)
  if (r === '/artists') await h.shot(`p7-artists-${w}`)
}
// every size, both states, key screens: no sideways scroll
for (const [w, mobile] of [[393, true], [800, false], [1280, false]]) for (const signedIn of [false, true]) {
  if (signedIn) await login(w, mobile); else await logout(w, mobile)
  for (const r of ['/start', '/albums', '/playlists', '/inventory']) {
    await h.go(r, 'document.querySelector("#phone-topbar, .top-menu")', 1200); await h.hideToasts()
    const q = await c.run(Q); out[`scroll-${signedIn ? 'in' : 'out'}-${r}-${w}`] = q.sw <= q.iw
    if (r === '/albums') await h.shot(`all-${signedIn ? 'in' : 'out'}-albums-${w}`)
  }
}
out.errors = state.errors.filter(e => !/ERR_BLOCKED_BY_CLIENT|Anonymous sign-in|Firestore|firestore|musickit|api\/|500|Failed to load resource|exchange|value-sources/i.test(e))
save('fixes.json', out); console.log(JSON.stringify(out, null, 1)); c.ws.close()
