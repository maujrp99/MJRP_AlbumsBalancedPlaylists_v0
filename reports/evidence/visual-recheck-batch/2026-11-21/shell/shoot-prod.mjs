// State A: production, signed out, fresh profile. Nothing is typed or clicked, no account.
import fs from 'node:fs'
import path from 'node:path'
import { openPage, SIZES, sleep, capture, saveMeasures, outDir } from './lib.mjs'
const SITE = 'https://mjrp-playlist-generator.web.app'
const ROUTES = [['root', '/'], ['home', '/home'], ['start', '/start'], ['albums', '/albums'], ['inventory', '/inventory'], ['playlists', '/playlists'], ['savedplaylists', '/saved-playlists'], ['blend', '/blend']]
const page = await openPage()
const facts = {}
for (const size of SIZES) {
  await page.setSize(size)
  for (const [key, route] of ROUTES) {
    page.errors.length = 0
    await page.send('Page.navigate', { url: SITE + route })
    await sleep(4500)
    await page.run('window.scrollTo(0,0)')
    const icons = await page.run(`[...document.querySelectorAll('link[rel~=icon], link[rel=apple-touch-icon]')].map((l) => ({ rel: l.rel, href: l.href, type: l.type, sizes: l.sizes.value }))`)
    facts[`${key}-${size.tag}`] = { requested: route, finalUrl: await page.run('location.href'), title: await page.run('document.title'), titleElements: await page.run("document.querySelectorAll('title').length"), icons }
    await capture(page, size, `prod-${key}`, { requested: route })
  }
}
// favicon files: fetched from the page and saved
const seen = new Set()
for (const f of Object.values(facts)) for (const i of f.icons) {
  if (seen.has(i.href)) { i.savedAs = 'same as an earlier one'; continue }
  seen.add(i.href)
  const r = await page.run(`(async () => { try { const x = await fetch(${JSON.stringify(i.href)}); const b = new Uint8Array(await x.arrayBuffer()); let s = ''; b.forEach((v) => { s += String.fromCharCode(v) }); return { status: x.status, type: x.headers.get('content-type'), bytes: b.length, b64: btoa(s) } } catch (e) { return { error: String(e) } } })()`)
  i.fetched = { status: r.status, type: r.type, bytes: r.bytes, error: r.error }
  if (r.b64) {
    const ext = /svg/.test(r.type || '') ? 'svg' : /png/.test(r.type || '') ? 'png' : /icon|ico/.test(r.type || '') ? 'ico' : 'bin'
    const file = `prod-favicon-${seen.size}.${ext}`
    fs.writeFileSync(path.join(outDir, file), Buffer.from(r.b64, 'base64')); i.savedAs = file
  }
}
fs.writeFileSync(path.join(outDir, 'prod-title-favicon.json'), JSON.stringify(facts, null, 1))
saveMeasures('measures-prod.json')
page.close()
