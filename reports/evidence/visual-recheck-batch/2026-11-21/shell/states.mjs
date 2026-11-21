// the states of the dev pass: the Start screen (B), the Edit series window (C), the shell (D, E)
import { sleep, capture } from './lib.mjs'
import { STUB, J, CLASSIFIED, CHIPS, RETRY, load } from './stub.mjs'

const DRIVE = []
DRIVE.push(['empty', null])
DRIVE.push(['scanning', `(() => { window.__mode = 'never'; window.__search('Kendrick Lamar') })()`])
DRIVE.push(['results', `(async () => { await window.__search('Kendrick Lamar') })()`])
DRIVE.push(['notfound', `(async () => { window.__mode = 'none'; await window.__search('Kendrik Lamarr Qxz') })()`])
DRIVE.push(['error', `(async () => { window.__mode = 'fail'; await window.__search('Kendrick Lamar') })()`])
export async function startStates(page, size) {
  const items = DRIVE
  for (const item of items) {
    const state = item[0]
    const js = item[1]
    await load(page, 'start')
    const stubbed = await page.run(STUB)
    if (js) await page.run(js)
    await sleep(1500)
    await page.run('window.scrollTo(0,0)')
    const extra = { state: state, stubbed: stubbed }
    extra.seam = 'musicKitService.getArtistAlbums stubbed, real AlbumSearchService and albumType classifier'
    if (state === 'results') {
      extra.classified = await page.run(CLASSIFIED)
      extra.chips = await page.run(CHIPS)
    }
    if (state === 'error') extra.retryButton = await page.run(RETRY)
    await capture(page, size, 'start-' + state, extra)
  }
}
const OPEN_MODAL = `(async () => {
  ${J}
  const store = (await import(J('stores/albumSeries.js'))).albumSeriesStore
  const q1 = { artist: 'Kendrick Lamar', title: 'DAMN.', appleMusicId: null, year: '2017', coverUrl: null }
  const q2 = { artist: 'Kendrick Lamar', title: 'Section.80', appleMusicId: null, year: '2011', coverUrl: null }
  store.setSeries([{ id: 'stand-in-series', name: 'Kendrick, the studio years', albumQueries: [q1, q2] }])
  const mod = await import(J('components/series/SeriesEditModal.js'))
  const modal = mod.SeriesEditModal.open('stand-in-series', () => {})
  return !!modal && !!document.getElementById('edit-series-modal')
})()`
const SEARCH_IN_MODAL = `(() => {
  const m = document.getElementById('edit-series-modal')
  const i = m.querySelector('[aria-label="Artist name"]')
  i.value = 'Kendrick Lamar'
  m.querySelector('[data-action="scan-artist"]').click()
})()`
const MODAL_GRID = `(() => {
  const g = document.querySelector('#edit-series-modal [data-picker-grid]')
  const f = [...document.querySelectorAll('#edit-series-modal [data-filter]')].map((b) => b.textContent.trim().replace(/\\s+/g, ' '))
  return { cards: g.querySelectorAll('[data-action="pick-album"]').length, filters: f }
})()`
// marker
export async function windowStates(page, size) {
  const items = DRIVE
  await load(page, 'start')
  await page.run(STUB)
  const opened = await page.run(OPEN_MODAL)
  await sleep(800)
  const note1 = 'albumSeriesStore.setSeries(stand-in) then SeriesEditModal.open(), the catalog call stubbed, Save never clicked'
  await capture(page, size, 'editseries-opened', { opened: opened, seam: note1 })
  await page.run(SEARCH_IN_MODAL)
  await sleep(1800)
  const grid = await page.run(MODAL_GRID)
  const note2 = 'the same stubbed scan through the real picker panel'
  await capture(page, size, 'editseries-aftersearch', { grid: grid, seam: note2 })
}
const SPOTIFY = `(() => {
  const out = {}
  const ids = ['spotify-connect-desktop', 'spotify-connect-mobile', 'phone-menu-spotify']
  for (const id of ids) {
    const el = document.getElementById(id)
    if (!el) { out[id] = 'absent'; continue }
    const r = el.getBoundingClientRect()
    const shown = r.width > 0 && r.height > 0 && getComputedStyle(el).display !== 'none'
    out[id] = { visible: shown, text: el.textContent.trim().replace(/\\s+/g, ' ').slice(0, 60), size: Math.round(r.width) + 'x' + Math.round(r.height) }
  }
  return out
})()`
const FOOTER = `(() => {
  const b = document.getElementById('footerClearCache')
  if (!b) return null
  const r = b.getBoundingClientRect()
  return { text: b.textContent.trim(), rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] }
})()`
const WHO = `(() => {
  const btn = document.getElementById('phoneMenuBtn')
  const nav = document.querySelector('nav')
  return { phoneMenuBtnHtml: btn ? btn.innerHTML.replace(/\\s+/g, ' ').slice(0, 200) : null, navText: nav ? nav.innerText.replace(/\\s+/g, ' ').slice(0, 200) : null }
})()`
export async function barStates(page, size, label) {
  const items = DRIVE
  await load(page, 'start')
  await page.run('window.scrollTo(0,0)')
  const sp = await page.run(SPOTIFY)
  const who = await page.run(WHO)
  await capture(page, size, 'shell-' + label + '-top', { spotify: sp, who: who })
  if (size.mobile === false) return await footerShot(page, size, label)
  await menuShot(page, size, label)
}
export async function footerShot(page, size, label) {
  const items = DRIVE
  const js = 'window.scrollTo(0,document.body.scrollHeight)'
  await page.run(js)
  await sleep(500)
  const footer = await page.run(FOOTER)
  await capture(page, size, 'shell-' + label + '-footer', { footer: footer })
}
export async function menuShot(page, size, label) {
  const items = DRIVE
  const js = `document.getElementById('phoneMenuBtn').click()`
  await page.run(js)
  await sleep(1500)
  const inMenu = await page.run(SPOTIFY)
  await capture(page, size, 'shell-' + label + '-menu', { spotifyInMenu: inMenu })
}
