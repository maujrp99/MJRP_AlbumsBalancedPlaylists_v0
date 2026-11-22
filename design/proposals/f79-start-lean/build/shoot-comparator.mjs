// Screenshots of the comparator itself (phone 393 and computer 1280), and a walk through the states by its control.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { open, sleep } from './cdp.mjs'
const here = path.dirname(fileURLToPath(import.meta.url))
const CAPS = path.join(here, '..', 'caps')
const url = 'file://' + path.join(here, '..', 'comparator.html')
const p = await open()
for (const [w, h, tag] of [[393, 852, 'phone'], [1280, 900, 'computer']]) {
  await p.size(w, h, false)
  await p.go(url, 2500)
  await p.shot(path.join(CAPS, `comparator-${tag}.png`))
  const info = await p.run(`({ hscroll: document.documentElement.scrollWidth > innerWidth, frameW: document.getElementById('devLean').getBoundingClientRect().width })`)
  console.log(tag, info)
}
// walk: next x3 (searching -> results by itself), tap a cover inside the Enxuta frame, then the sheet
await p.run(`document.getElementById('next').click()`); await p.run(`document.getElementById('next').click()`); await sleep(5000)
console.log('after next x2 + wait:', await p.run(`document.getElementById('state').value`))
await p.run(`document.getElementById('fLean').contentDocument.querySelector('[data-action="pick-album"]').click()`); await sleep(800)
console.log('after tapping a cover:', await p.run(`document.getElementById('state').value`))
await p.run(`(() => { const s = document.getElementById('state'); s.value = 'empty'; s.dispatchEvent(new Event('change')) })()`); await sleep(800)
await p.run(`document.getElementById('fLean').contentDocument.querySelector('[data-what]').click()`); await sleep(800)
console.log('after «What is a series?»:', await p.run(`document.getElementById('state').value`))
await p.shot(path.join(CAPS, 'comparator-computer-sheet.png'))
await p.run(`document.getElementById('dWords').open = true; document.getElementById('dWords').scrollIntoView()`); await sleep(300)
await p.shot(path.join(CAPS, 'comparator-computer-words.png'))
console.log('errors', p.errors)
p.close()
