// The one seam of the dev pass, set in the page and nowhere else: `musicKitService.getArtistAlbums` (the raw
// Apple Music catalog call) is replaced by a function that answers a fixture of RAW catalog items, or never answers
// (scanning), or answers nothing (not found), or throws (error). Everything after it is the REAL code:
// AlbumSearchService.scanArtist -> _classifyAll -> models/albumType.js classifyAlbum -> groupVariants ->
// AlbumPickerController -> the Home / the Edit-series modal. The classifier is NOT bypassed.
import { sleep } from './lib.mjs'
export const SITE = 'http://127.0.0.1:5404'

// the page imports the app's own modules by their dev-server address
export const J = `const J = (p) => location.origin + '/' + 'js/' + p;`

// RAW catalog items, in the shape MusicKitCatalog.getArtistAlbums returns (appleMusicId, title, artist, year,
// artworkTemplate, trackCount, isSingle, isCompilation, releaseDate, raw.attributes with genreNames).
const RAW = `(() => {
  const tile = (label, hue) => 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="hsl(' + hue + ',35%,22%)"/><text x="150" y="150" fill="#ddd" font-family="sans-serif" font-size="22" text-anchor="middle">' + label + '</text></svg>')
  let n = 0
  const mk = (title, date, tracks, o = {}) => { n++; const attributes = { name: title, artistName: 'Kendrick Lamar', genreNames: ['Hip-Hop/Rap', 'Music'], releaseDate: date, trackCount: tracks, isSingle: !!o.single, isCompilation: !!o.comp, contentTraits: o.live ? ['live'] : [] }
    return { appleMusicId: 'fx-' + n, title, artist: 'Kendrick Lamar', year: date.slice(0, 4), artworkTemplate: tile(title.slice(0, 22), (n * 47) % 360), trackCount: tracks, isSingle: !!o.single, isCompilation: !!o.comp, resultUrl: '', releaseDate: date, raw: { id: 'fx-' + n, attributes } } }
  return [
    mk('To Pimp a Butterfly', '2015-03-15', 16),
    mk('good kid, m.A.A.d city', '2012-10-22', 12),
    mk('good kid, m.A.A.d city (Deluxe Version)', '2012-10-22', 17),
    mk('DAMN.', '2017-04-14', 14),
    mk('Mr. Morale & The Big Steppers', '2022-05-13', 18),
    mk('Section.80', '2011-07-02', 16),
    mk('untitled unmastered.', '2016-03-04', 8),
    mk('Black Panther The Album (Music From and Inspired By)', '2018-02-09', 14),
    mk('Overly Dedicated - EP', '2010-09-14', 6),
    mk('Alright - Single', '2015-06-30', 1, { single: true }),
    mk('HUMBLE. - Single', '2017-03-30', 1, { single: true }),
    mk('Live at Glastonbury 2022', '2022-06-25', 20, { live: true }),
    mk('The Best of Kendrick Lamar', '2020-01-10', 18, { comp: true })
  ]
})()`

export const STUB = `(async () => {
  ${J}
  const m = await import(J('services/MusicKitService.js'))
  const raw = ${RAW}
  window.__asked = []
  window.__mode = 'results'
  m.musicKitService.getArtistAlbums = async (name) => {
    window.__asked.push(name)
    if (window.__mode === 'never') return new Promise(() => {})
    if (window.__mode === 'none') return []
    if (window.__mode === 'fail') throw new Error('catalog unavailable (fixture)')
    return raw
  }
  window.__search = (q) => { document.querySelector('#artistScanInput').value = q; return window.controller.search(q) }
  return 'stubbed'
})()`

export const CLASSIFIED = `(() => window.controller.picker.results.map((a) => a.title + ' => ' + a.type + ' (' + a.typeReason + ')'))()`
export const CHIPS = `(() => [...document.querySelectorAll('#home-toolbar [data-filter]')].map((b) => b.textContent.trim().replace(/\\s+/g, ' ')))()`
export const RETRY = `(() => { const b = document.querySelector('#btnScanRetry'); return b ? b.textContent.trim() : null })()`

export async function load(page, name) {
  page.errors.length = 0
  await page.send('Page.navigate', { url: SITE + '/' + name })
  await sleep(4500)
}
