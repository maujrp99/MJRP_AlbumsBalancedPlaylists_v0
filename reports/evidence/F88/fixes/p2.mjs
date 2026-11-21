import { connect, helpers, state, sleep, MUSICKIT_STUB, save } from './lib.mjs'
const c = await connect(); const h = helpers(c)
await c.send('Page.addScriptToEvaluateOnNewDocument', { source: MUSICKIT_STUB(false) })
const LBL = `(() => { const vis = (e) => e && e.getBoundingClientRect().width > 0; const nav = [...document.querySelectorAll('nav.ms')].find(vis); const out = []; for (const s of nav.querySelectorAll('.stop')) { const t = s.querySelector('.lb') || s; const r = document.createRange(); r.selectNodeContents(t); const b = r.getBoundingClientRect(); out.push([t.textContent.trim(), Math.round(b.left*10)/10, Math.round(b.right*10)/10]) } const f = nav.querySelector('.flipmark').getBoundingClientRect(); const gaps = []; for (let i=0;i<out.length-1;i++) gaps.push(Math.round((out[i+1][1]-out[i][2])*10)/10); return { labels: out, gaps, flip: [Math.round(f.left*10)/10, Math.round(f.right*10)/10], flipGapLeft: Math.round((f.left - out[2][2])*10)/10, flipGapRight: Math.round((out[3][1]-f.right)*10)/10 } })()`
const out = {}
for (const W of [900, 1280]) for (const signedIn of [false, true]) {
  state.signedIn = signedIn
  await h.size(W, 800, false); await h.clear()
  if (signedIn) { await h.go('/start', 'document.querySelector("#userMenuBtn")'); await h.writeAccount() }
  await h.go('/albums', 'document.querySelector(".top-menu")', 1500); await h.hideToasts()
  out[`app-${signedIn?'in':'out'}-${W}`] = await c.run(LBL)
  await h.shot(`p2-app-${signedIn?'in':'out'}-${W}`, { x: 0, y: 0, width: W, height: 130 })
  await h.go('/home', 'document.querySelector("header.top")', 1500)
  if (signedIn) await c.run(`document.documentElement.classList.add('in')`)
  out[`home-${signedIn?'in':'out'}-${W}`] = await c.run(LBL)
  await h.shot(`p2-home-${signedIn?'in':'out'}-${W}`, { x: 0, y: 0, width: W, height: 100 })
}
save('p2.json', out); for (const k in out) console.log(k, 'gaps', out[k].gaps.join(','), 'flipL', out[k].flipGapLeft, 'flipR', out[k].flipGapRight); console.log(state.errors.filter(e=>!/identitytoolkit|Anonymous/.test(e)).slice(0,5)); c.ws.close()
