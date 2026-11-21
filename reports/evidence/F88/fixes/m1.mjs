import { connect, helpers, state, sleep, MUSICKIT_STUB, save } from './lib.mjs'
const c = await connect(); const h = helpers(c)
await c.send('Page.addScriptToEvaluateOnNewDocument', { source: MUSICKIT_STUB(false) })
const M = `(() => { const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.left*10)/10, Math.round(b.top*10)/10, Math.round(b.width*10)/10, Math.round(b.height*10)/10] }; const vis = (e) => e && e.getBoundingClientRect().width > 0 && getComputedStyle(e).display !== 'none'; const q = (s) => [...document.querySelectorAll(s)].find(vis);
 return { iw: innerWidth, logo: r(q('.top-menu__logo, .logo')), bar: r(q('nav.ms')), acct: r(q('.top-menu__acct, header.top .acct')), kids: [...(q('.top-menu__acct, header.top .acct')?.children||[])].filter(vis).map(e=>[e.className.slice(0,30),...r(e)]) , stops: [...document.querySelectorAll('nav.ms .stop')].filter(vis).map(e => [e.textContent.trim().slice(0,10), ...r(e)]), flip: r(q('.flipmark')) } })()`
const out = {}
for (const W of (process.argv[2]||'900,1000,1100,1280,1600').split(',').map(Number)) for (const signedIn of [false, true]) {
  state.signedIn = signedIn
  await h.size(W, 900, false); await h.clear()
  if (signedIn) { await h.go('/start', 'document.querySelector("#userMenuBtn")'); await h.writeAccount() }
  await h.go('/albums', 'document.querySelector(".top-menu")', 1500)
  out[`app-${signedIn?'in':'out'}-${W}`] = await c.run(M)
  await h.go('/home?x=1', 'document.querySelector("header.top")', 1500)
  if (signedIn) await c.run(`document.documentElement.classList.add('in')`)
  out[`home-${signedIn?'in':'out'}-${W}`] = await c.run(M)
}
for (const k in out) console.log(k, 'logo', out[k].logo?.join(','), 'bar', out[k].bar?.join(','), 'acct', out[k].acct?.join(','), 'flip', out[k].flip?.join(','))
save('m1.json', out); c.ws.close()
