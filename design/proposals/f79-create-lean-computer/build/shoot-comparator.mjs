// Checks the comparator itself, at 1440 x 900 and at 393 x 852: every state, both accounts, both sizes and the
// variant draw with no exception and no sideways scroll; screenshots go to $F79C_RAW/shots (outside git).
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { open, sleep } from './cdp.mjs'
const here = path.dirname(fileURLToPath(import.meta.url))
const RAW = process.env.F79C_RAW || path.join(here, '..', 'raw')
const url = 'file://' + path.join(here, '..', 'comparator.html')
const p = await open()
const setState = (st) => p.run(`(() => { const s = document.getElementById('state'); s.value = '${st}'; s.dispatchEvent(new Event('change')) })()`)
const variantOn = () => p.run(`document.getElementById('variantBtn').getAttribute('aria-pressed') === 'true'`)
for (const [w, h, tag] of [[1440, 900, 'computer'], [393, 852, 'phone']]) {
  await p.size(w, h, tag === 'phone')
  await p.go(url, 2500)
  await p.shot(path.join(RAW, 'shots', `comparator-${tag}.png`))
  const states = await p.run(`[...document.getElementById('state').options].map((o) => o.value)`)
  const bad = []
  for (const who of ['whoOut', 'whoIn']) for (const size of ['s1280', 's1440']) for (const variant of [false, true]) {
    await p.run(`document.getElementById('${who}').click(); document.getElementById('${size}').click()`)
    if (variant !== (await variantOn())) await p.run(`document.getElementById('variantBtn').click()`)
    for (const st of states) {
      await setState(st)
      await sleep(350)
      const r = await p.run(`(() => { const f = ['fToday', 'fLean'].map((id) => document.getElementById(id).contentDocument); return { ok: f.every((d) => d && d.querySelector('#homeStage')), hscroll: document.documentElement.scrollWidth > innerWidth } })()`)
      if (!r.ok || r.hscroll) bad.push({ who, size, variant, st, r })
    }
  }
  if (await variantOn()) await p.run(`document.getElementById('variantBtn').click()`)
  await setState('empty'); await sleep(500)
  await p.run(`document.getElementById('fLean').contentDocument.querySelector('[data-what]').click()`); await sleep(600)
  const afterWhat = await p.run(`document.getElementById('state').value`)
  await p.run(`window.scrollTo(0, 0)`)
  await p.shot(path.join(RAW, 'shots', `comparator-${tag}-what.png`))
  await p.run(`document.getElementById('dWords').open = true; document.getElementById('dWords').scrollIntoView()`); await sleep(300)
  await p.shot(path.join(RAW, 'shots', `comparator-${tag}-words.png`))
  console.log(tag, JSON.stringify({ states: states.length, bad, afterWhat }))
}
console.log('exceptions', JSON.stringify(p.errors))
p.close()
