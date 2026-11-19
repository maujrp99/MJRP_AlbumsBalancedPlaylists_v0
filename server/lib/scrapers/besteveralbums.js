const axios = require('axios')
const { cleanTitle } = require('../normalize')
const { loadAlbumIdentity } = require('../albumIdentity')
const { UpstreamError, upstreamErrorFrom } = require('../outcome')
const { createPoliteQueue, PaceError, noPace } = require('../politeQueue')

/**
 * Scraper for BestEverAlbums.
 *
 * The rule of failure (F52): a request to the source that fails (no answer, a deadline, any HTTP
 * status that is not a success) is THROWN as an UpstreamError, from every search path. Nothing here
 * turns a failure into "not found": `null` means the source answered every question and nothing matched.
 *
 * The rule of pace and time (F52, slice 3): every request to the source goes through ONE function
 * (`getPage`), which hands it to the polite queue (lib/politeQueue.js: how many at once, how far
 * apart, what to do when the source says "busy") and gives it a deadline of its own
 * (REQUEST_TIMEOUT_MS). `getRankingForAlbum(title, artist, { deadlineAt })` also stops asking when
 * the time of the album request is over (`upstream_timeout`), and never asks the same address
 * twice within one album request.
 *
 * `createBestEverScraper({ http, loadHtml, pace })` receives the HTTP client, the HTML reader and
 * the queue, so the tests run with no network and no waiting; the module also exports one scraper
 * wired to axios, cheerio and the real queue (BEA_PACE). That queue is PER INSTANCE of the server.
 */

const SOURCE = 'BestEverAlbums'

// cheerio is asked for only when a page is read: the module loads without it (the root test suite has no cheerio)
const cheerioLoad = (html) => require('cheerio').load(html)

/** What suggest.php answered, as two lists; an answer in another shape is "nothing". */
function parseSuggest (data) {
  const list = (value) => (Array.isArray(value) ? value : [])
  if (!Array.isArray(data)) return { titles: [], urls: [] }
  return { titles: list(data[1]), urls: list(data.length > 2 ? (data[3] || data[2]) : []) }
}

/** How many album links of the HTML search are opened to be checked. */
const HTML_SEARCH_PAGES_CHECKED = 5

const ALBUM_ADDRESSES = [/thechart\.php\?a=(\d+)/i, /album\.php\?id=(\d+)/i]
/** The id in the address of an album page, or null when the address is not one. */
function albumIdOf (url) {
  for (const pattern of ALBUM_ADDRESSES) {
    const found = String(url || '').match(pattern)
    if (found) return found[1]
  }
  return null
}
const absoluteUrl = (url) => (String(url).startsWith('http') ? String(url) : `https://www.besteveralbums.com${url}`)

/** How long one request to the source may take. The whole album request has 15 s (EnrichmentService). */
const REQUEST_TIMEOUT_MS = 8000

/**
 * The pace with BestEverAlbums, per instance of the server. Decided by the agent on 2026-11-19,
 * with no measurement of how the source answers a burst; to be revised with the numbers of the log.
 */
const BEA_PACE = Object.freeze({
  concurrency: 2, // requests to the source at once
  minIntervalMs: 250, // between two starts: at most 4 requests per second
  backoff: Object.freeze({ baseMs: 1000, factor: 2, maxMs: 30000 }), // the wait after 429/503 with no Retry-After
  maxAttempts: 3, // one request is asked at most 3 times while the source says "busy"
  maxRetryAfterMs: 5 * 60 * 1000 // a Retry-After longer than this is cut to this
})

/** Retry-After as the source may send it: seconds, or a date. null when absent or unreadable. */
function retryAfterMsOf (headers, now) {
  const value = headers && (headers['retry-after'] ?? headers['Retry-After'])
  if (value === undefined || value === null || value === '') return null
  const seconds = Number(value)
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000)
  const date = Date.parse(value)
  return Number.isNaN(date) ? null : Math.max(0, date - now())
}

/** What the polite queue asks: is this failure the source saying "busy" (429, 503), and for how long? */
const busyOfSource = (now = () => Date.now()) => (err) => {
  const response = err && err.response
  if (!response || (response.status !== 429 && response.status !== 503)) return null
  return { retryAfterMs: retryAfterMsOf(response.headers, now) }
}

/** The queue said the turn would come too late: that is a failure of the source, with its code. */
function upstreamErrorOfPace (err) {
  if (err.reason === 'busy') {
    return new UpstreamError('upstream_busy', `${SOURCE}: asked to wait`, { cause: err.cause, retryAfterMs: err.retryAfterMs })
  }
  return new UpstreamError('upstream_timeout', `${SOURCE}: no turn in the queue within the time of the request`)
}

// Helper to get axios config with headers
const getAxiosConfig = (timeout = REQUEST_TIMEOUT_MS) => ({
  timeout,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9'
  }
})

function createBestEverScraper ({ http = axios, loadHtml = cheerioLoad, logger = console, pace = noPace, now = () => Date.now() } = {}) {
/**
 * The one door to the source, for one piece of work (one album request, or one direct call).
 * @param {Object} [options]
 * @param {number} [options.deadlineAt] - the time (ms) when the album request is over
 * @param {{ requests: number }} [options.stats] - counts the requests that really went to the source
 * @returns {Function} getPage(url) -> Promise<response>; a failure leaves it as an UpstreamError
 *          and is caught nowhere below
 */
function pageGetter ({ deadlineAt = Infinity, stats = { requests: 0 } } = {}) {
  const asked = new Map() // Map<url, Promise>: an address is asked once per piece of work

  async function request (url) {
    const left = deadlineAt - now()
    if (left <= 0) throw new UpstreamError('upstream_timeout', `${SOURCE}: the time of the request is over`)
    try {
      return await pace.run(() => {
        stats.requests++
        return http.get(url, getAxiosConfig(Math.min(REQUEST_TIMEOUT_MS, Math.max(1, deadlineAt - now()))))
      }, { deadlineAt })
    } catch (err) {
      const failure = err instanceof PaceError ? upstreamErrorOfPace(err) : upstreamErrorFrom(err, SOURCE)
      logger.warn(`[BEA] request failed: ${failure.message}`)
      throw failure
    }
  }

  return function getPage (url) {
    if (!asked.has(url)) asked.set(url, request(url))
    return asked.get(url)
  }
}

/** Every search of the source, asking through the door given. */
function searchesWith (getPage) {
// ---- "Is this the album asked for?" is decided by ONE rule, shared/albumIdentity.js (F55) ----
// Every search path below turns what the source gave (a label "Title by Artist", a page, a link
// on the artist's page) into { title, artist } and asks the rule. Nothing here compares texts.

/** The album links of a suggest answer, each with the label the source gave it. */
function albumSuggestions ({ titles, urls }) {
  return urls
    .map((url, i) => ({ url: String(url || ''), label: String(titles[i] || ''), id: albumIdOf(url) }))
    .filter(suggestion => suggestion.id)
}

/** The suggestion whose label says it is the album asked for, or null. */
async function pickSuggested (asked, suggestions) {
  const { pickAlbum, albumFromLabel } = await loadAlbumIdentity()
  const picked = pickAlbum(asked, suggestions, suggestion => albumFromLabel(suggestion.label))
  return picked.found ? picked.candidate : null
}

/**
 * What an album page says it is: its <title> ("Core by Stone Temple Pilots | Album Rankings ...")
 * and its header (the album title, then "by" and a link to the artist).
 * @returns {Promise<Array<{ title: string, artist: string }>>} every reading; none when the page says neither
 */
async function albumsNamedByPage ($) {
  const { albumFromLabel } = await loadAlbumIdentity()
  const readings = albumFromLabel(($('title').first().text() || '').split('|')[0])

  const h1 = $('h1').first()
  const artist = (h1.find('a').first().text() || '').trim()
  const header = (h1.text() || '').trim()
  if (artist && header.endsWith(artist)) {
    const title = header.slice(0, header.length - artist.length).replace(/\s*by\s*$/i, '').trim()
    if (title) readings.push({ title, artist })
  }
  return readings
}

/**
 * Reads the page and says whether it is the page of the album asked for.
 * One page, with no other candidate in sight: only the first tier of the rule is accepted here
 * (`same`). The second tier (the title asked for before a subtitle) needs the whole list of a
 * search, and pickAlbum gives it where the scraper has one: pickSuggested, rankingFromArtistPage.
 */
async function pageIsTheAlbum (url, asked) {
  const res = await getPage(absoluteUrl(url))
  const { compareAlbumIdentity } = await loadAlbumIdentity()
  const readings = await albumsNamedByPage(loadHtml(res.data))
  return readings.some(reading => compareAlbumIdentity(asked, reading).same)
}

/**
 * The HTML search of the source. Each album link it lists is opened and accepted only when the
 * page is the album asked for: the first link, or a link that shares a word, is not enough.
 * @returns {Promise<string|null>} the address of the album page
 */
async function fetchAlbumPage (albumTitle, albumArtist) {
  // BestEverAlbums search works better with cleaner titles
  const q = encodeURIComponent(`${albumArtist} ${cleanTitle(albumTitle)}`)
  const searchRes = await getPage(`https://www.besteveralbums.com/search.php?search=${q}`)
  const $search = loadHtml(searchRes.data)

  const links = new Set()
  $search('a').each((i, el) => {
    const href = $search(el).attr('href')
    if (href && albumIdOf(href)) links.add(href)
  })

  const asked = { title: albumTitle, artist: albumArtist }
  for (const href of [...links].slice(0, HTML_SEARCH_PAGES_CHECKED)) {
    // A page that could not be read is a failure (it used to be accepted unseen)
    if (await pageIsTheAlbum(href, asked)) return absoluteUrl(href)
  }
  return null
}

const suggestUrl = (text) => `https://www.besteveralbums.com/suggest.php?q=${encodeURIComponent(text)}`

/**
 * Stage 1: the album search of the source, asked for "artist title".
 */
async function _standardFindAlbumId (albumTitle, albumArtist) {
  const asked = { title: albumTitle, artist: albumArtist }
  const res = await getPage(suggestUrl(`${albumArtist || ''} ${cleanTitle(albumTitle) || ''}`))
  const suggestions = albumSuggestions(parseSuggest(res.data))

  const byLabel = await pickSuggested(asked, suggestions)
  if (byLabel) {
    logger.log(`[BEA Search] match in the album search: "${byLabel.label}" -> ${byLabel.url}`)
    return byLabel.id
  }

  // A label that cannot be read as "Title by Artist" says nothing: the page itself is asked.
  // A label that can be read and is another album is not opened.
  const { albumFromLabel } = await loadAlbumIdentity()
  for (const suggestion of suggestions) {
    if (albumFromLabel(suggestion.label).length > 0) continue
    if (await pageIsTheAlbum(suggestion.url, asked)) return suggestion.id
  }

  const alt = await fetchAlbumPage(albumTitle, albumArtist)
  return alt ? albumIdOf(alt) : null
}

/**
 * Stage 2: the same search asked in other words (the artist alone, the title alone, the title
 * without its subtitle). Other words widen what the source lists; what is accepted is still only
 * the album asked for, whole title and artist.
 */
async function _fuzzyFindAlbumId (albumTitle, albumArtist) {
  const asked = { title: albumTitle, artist: albumArtist }
  const prunedTitle = (albumTitle || '').split(':')[0].split(' - ')[0].trim()
  const variations = [...new Set([
    albumArtist || '',
    albumTitle || '',
    `${albumArtist || ''} ${albumTitle || ''}`,
    prunedTitle,
    `${albumArtist || ''} ${prunedTitle}`
  ].map(text => text.trim()).filter(Boolean))]

  for (const qText of variations) {
    logger.log(`[BEA Search] asking again as: "${qText}"`)
    const res = await getPage(suggestUrl(qText))
    const picked = await pickSuggested(asked, albumSuggestions(parseSuggest(res.data)))
    if (picked) {
      logger.log(`[BEA Search] match asking again: "${picked.label}" -> ${picked.url}`)
      return picked.id
    }
  }
  return null
}

async function findAlbumId (albumTitle, albumArtist) {
  const id = await _standardFindAlbumId(albumTitle, albumArtist)
  if (id) return id

  logger.log(`[BEA Search] the album search has no "${albumTitle}". Asking again in other words.`)
  return await _fuzzyFindAlbumId(albumTitle, albumArtist)
}

/**
 * The id of the artist's page: the result the source labels with the artist's own name. A longer
 * name that contains it ("Page & Plant" for "Page") is another artist.
 */
async function findArtistPage (artistName) {
  const res = await getPage(suggestUrl(artistName))
  const { titles, urls } = parseSuggest(res.data)
  const { sameArtist, artistNamesFromLabel } = await loadAlbumIdentity()
  // The source writes "Nirvana (US)": the note at the end is its own, so the label is read both ways
  const isTheArtist = (label) => artistNamesFromLabel(label).some(name => sameArtist(artistName, name))

  for (let i = 0; i < urls.length; i++) {
    const m = String(urls[i] || '').match(/thechart\.php\?b=(\d+)/i)
    if (m && isTheArtist(titles[i])) return m[1]
  }
  return null
}

async function parseArtistDiscography(artistId) {
  const url = `https://www.besteveralbums.com/thechart.php?b=${artistId}`
  const res = await getPage(url)
  const $ = loadHtml(res.data)

  const seen = new Set()
  const albums = []
  $('a').each((i, el) => {
    const href = $(el).attr('href')
    const text = ($(el).text() || '').trim()
    // A link to a section of the album page ("#ratings": "76 (498 votes)") does not carry the title
    if (!href || !text || href.includes('#')) return
    const id = albumIdOf(href)
    if (!id || seen.has(id)) return
    seen.add(id)
    albums.push({ id, title: text, url: absoluteUrl(href) })
  })
  return { artistUrl: url, albums }
}

async function parseChartRankingById(id) {
  const chartUrl = `https://www.besteveralbums.com/thechart.php?a=${id}#tracks`
  const res = await getPage(chartUrl)
  const $ = loadHtml(res.data)

  const rows = []
  $('table').each((i, table) => {
    const $table = $(table)
    const headerThs = $table.find('th')
    if (headerThs.length === 0) return

    const headers = headerThs.map((j, th) => $(th).text().toLowerCase()).get()
    const trackIdx = headers.findIndex(h => h.includes('track') || h.includes('song'))
    const ratingIdx = headers.findIndex(h => h.includes('rating') || h.includes('score') || h.includes('points'))

    if (trackIdx !== -1) {
      $table.find('tr').each((j, tr) => {
        const $tr = $(tr)
        const tds = $tr.find('td')
        if (tds.length > trackIdx) {
          const trackTd = $(tds[trackIdx])
          let title = trackTd.text().trim()
          const a = trackTd.find('a').first()
          if (a && a.text()) title = a.text().trim()

          if (!title || /^\d+$/.test(title) || title.toLowerCase().match(/track|rating|comments|votes/)) return

          let rating = null
          if (ratingIdx !== -1 && tds.length > ratingIdx) {
            const ratingCell = $(tds[ratingIdx])
            const rtxt = ratingCell.text().trim()
            if (rtxt) {
              // Prioritize numbers followed by % or purely the first number if it seems like a rating
              // BEA ratings often look like "88 (341 votes)" or "Average Rating: 88"
              // We want to avoid matching the "0" in "(0 votes)" if there's no rating.
              // If it says "Not enough data (0 votes)", we don't want the 0.
              const m = rtxt.match(/(\d{1,3})(?=\s*\()/) // Best: Number before parens
              if (m) {
                rating = parseInt(m[1], 10)
              } else if (!rtxt.toLowerCase().includes('data')) {
                const m2 = rtxt.match(/(\d{1,3})/)
                if (m2) rating = parseInt(m2[1], 10)
              }
            }
          }
          rows.push({ trackTitle: title, rating })
        }
      })
    }
  })

  // Fallback for newer grid-based track list (Sprint 22 Refinement)
  if (rows.length === 0) {
    // BEA sometimes uses .track-list-track inside a grid or .item-row
    const items = $('.track-list-track')
    if (items.length > 0) {
      logger.log(`[BEA Scraper] Grid fallback: Found ${items.length} track items.`)
      items.each((i, el) => {
        const $el = $(el)
        // Title: Use specific nav2emph or fallback to first link
        const title = $el.find('.nav2emph').first().text().trim() || $el.find('a').first().text().trim() || $el.text().trim().split('\n')[0].trim()

        let rating = null

        // Rating is often in a SIBLING div (.track-list-rating) in grid layout
        // Try sibling first (most robust for grid)
        let ratingContainer = $el.siblings('.track-list-rating').first()
        if (ratingContainer.length === 0) {
          // Fallback: check closest .track-list-rating if they are not direct siblings but close in DOM
          // or check within self (if layout varies)
          ratingContainer = $el.find('.track-list-rating').first()
        }

        let aveText = ''
        if (ratingContainer.length > 0) {
          aveText = ratingContainer.text().trim()
        } else {
          // Old fallback: look for .nav2 in siblings or self
          aveText = $el.siblings().find('.nav2').filter((idx, e) => {
            const txt = $(e).text();
            return txt.includes('votes') || /\d{1,3}\s*\(/.test(txt);
          }).first().text().trim()
        }

        if (aveText && !aveText.toLowerCase().includes('data')) {
          const m = aveText.match(/(\d{1,3})(?=\s*\()/) || aveText.match(/(\d{1,3})/)
          if (m) rating = parseInt(m[1], 10)
        }
        logger.log(`[BEA Scraper]   Track ${i + 1}: "${title}" (Rating: ${rating}, Raw: "${aveText.substring(0, 30)}...")`)
        if (title && title.length > 1) rows.push({ trackTitle: title, rating })
      })
    } else {
      logger.log('[BEA Scraper] Grid fallback: No track items found.')
    }
  }

  const normalized = rows.map(r => ({
    trackTitle: r.trackTitle
      // FIX: Only strip numbers if followed by separator (dot, paren, -) to preserve "72 Seasons"
      .replace(/^\s*\d+(?:[\.\):]|\s-\s)\s*/, '')
      .replace(/^Track \d+[\s\.\)-]*/i, '')
      .trim(),
    rating: typeof r.rating === 'number' ? r.rating : null
  }))

  normalized.sort((a, b) => {
    if (a.rating === null && b.rating === null) return 0
    if (a.rating === null) return 1
    if (b.rating === null) return -1
    return b.rating - a.rating
  })

  return { albumUrl: chartUrl, albumId: String(id), evidence: normalized }
}

function parseChartHtml(html, chartUrl = 'https://example/') {
  const $ = loadHtml(html)
  const rows = []
  $('table').each((i, table) => {
    const $table = $(table)
    const headerText = $table.find('th').text().toLowerCase()
    if (headerText.includes('track') && headerText.includes('rating')) {
      $table.find('tr').each((j, tr) => {
        const $tr = $(tr)
        const tds = $tr.find('td')
        if (tds.length >= 2) {
          const trackTd = $tr.find('td').filter((k, el) => {
            const txt = $(el).text().toLowerCase()
            return txt && /[a-z0-9]/i.test(txt) && !txt.match(/rating|comments|votes/i)
          }).first()
          let title = trackTd.text().trim()
          const a = trackTd.find('a').first()
          if (a && a.text()) title = a.text().trim()

          let rating = null
          const ratingCell = $tr.find('td').filter((k, el) => {
            const txt = $(el).text().toLowerCase()
            return txt && txt.includes('rating')
          }).first()
          if (ratingCell && ratingCell.text()) {
            const rtxt = ratingCell.text()
            const m = rtxt.match(/(\d{1,3})(?=\s*\()/)
            if (m) rating = parseInt(m[1], 10)
            else {
              const m2 = rtxt.match(/(\d{1,3})/)
              if (m2) rating = parseInt(m2[1], 10)
            }
          }
          if (title) rows.push({ trackTitle: title, rating })
        }
      })
    }
  })
  const normalized = rows.map(r => ({ trackTitle: r.trackTitle.replace(/^\s*\d+\.\s*/, '').trim(), rating: typeof r.rating === 'number' ? r.rating : null }))
  normalized.sort((a, b) => {
    if (a.rating === null && b.rating === null) return 0
    if (a.rating === null) return 1
    if (b.rating === null) return -1
    return b.rating - a.rating
  })
  return { albumUrl: chartUrl, evidence: normalized }
}

async function parseAlbumRanking(albumUrl) {
  const res = await getPage(albumUrl)
  const $ = loadHtml(res.data)
  const evidence = []
  $('table').each((i, table) => {
    const $table = $(table)
    const headerText = $table.find('th').first().text().toLowerCase()
    if (headerText.includes('track') || headerText.includes('song') || headerText.includes('rating')) {
      $table.find('tr').each((j, tr) => {
        const $tr = $(tr)
        const tds = $tr.find('td')
        if (tds.length >= 2) {
          const title = $tr.find('td').first().text().trim()
          const ratingText = $tr.find('td').last().text().trim()
          if (title) evidence.push({ trackTitle: title, rating: ratingText })
        }
      })
    }
  })
  if (evidence.length === 0) {
    $('li').each((i, li) => {
      const t = $(li).text().trim()
      if (t && t.length < 200) evidence.push({ trackTitle: t })
    })
  }
  const normalized = evidence.map(e => {
    let title = e.trackTitle || ''
    title = title.replace(/^\s*\d+\.\s*/, '')
    title = title.replace(/\s*\(.*?\)\s*$/, '').trim()
    return { trackTitle: title, rating: e.rating || null }
  }).filter(e => e.trackTitle && e.trackTitle.length > 1)
  return { albumUrl, evidence: normalized }
}

/**
 * @returns {Promise<Object|null>} the page and its track ratings, or null when the source answered
 *          every search and has no such album
 * @throws {UpstreamError} when any request to the source failed: it could not be known
 */
const rankingOf = (parsed, albumId) => ({ provider: 'BestEverAlbums', providerType: 'community', referenceUrl: parsed.albumUrl, albumId, evidence: parsed.evidence })

/** The album asked for among the albums the artist's own page lists, or null. */
async function rankingFromArtistPage (albumTitle, albumArtist) {
  const artistId = albumArtist ? await findArtistPage(albumArtist) : null
  if (!artistId) return null

  const { albums } = await parseArtistDiscography(artistId)
  const { pickAlbum } = await loadAlbumIdentity()
  // The page is the artist's own, so each link is an album of that artist: its text is the title
  const picked = pickAlbum({ title: albumTitle, artist: albumArtist }, albums, a => ({ title: a.title, artist: albumArtist }))
  if (!picked.found) return null

  const chartMatch = picked.candidate.url.match(/thechart\.php\?a=(\d+)/i)
  if (!chartMatch) return rankingOf(await parseAlbumRanking(picked.candidate.url), undefined)
  const parsed = await parseChartRankingById(chartMatch[1])
  return rankingOf(parsed, parsed.albumId)
}

/**
 * The track ratings of the album asked for.
 * @returns {Promise<Object|null>} null when the source answered every search and has no page that
 *          is the album asked for; another album of the artist is never returned in its place (F55)
 * @throws {UpstreamError} when a request to the source failed
 */
async function getRankingForAlbum (albumTitle, albumArtist) {
  const fromArtistPage = await rankingFromArtistPage(albumTitle, albumArtist)
  if (fromArtistPage) return fromArtistPage

  const id = await findAlbumId(albumTitle, albumArtist)
  if (!id) return null
  const parsed = await parseChartRankingById(id)
  return rankingOf(parsed, parsed.albumId)
}

/** @throws {UpstreamError} when the page could not be read */
async function getRankingFromUrl(albumUrl) {
  const m = albumUrl.match(/thechart\.php\?a=(\d+)/i)
  if (m) {
    const parsed = await parseChartRankingById(m[1])
    return { provider: 'BestEverAlbums', providerType: 'community', referenceUrl: parsed.albumUrl, evidence: parsed.evidence }
  }
  const parsed = await parseAlbumRanking(albumUrl)
  return { provider: 'BestEverAlbums', providerType: 'community', referenceUrl: parsed.albumUrl, evidence: parsed.evidence }
}

return { getRankingForAlbum, getRankingFromUrl, findArtistPage, parseArtistDiscography, findAlbumId, fetchAlbumPage, parseChartHtml }
}

/** A direct call (a script, a debug route) is a piece of work of its own: its own door. */
const direct = (name) => (...args) => searchesWith(pageGetter())[name](...args)

return {
  /**
   * @param {string} albumTitle
   * @param {string} albumArtist
   * @param {Object} [options] - { deadlineAt, stats }: see pageGetter
   */
  getRankingForAlbum: (albumTitle, albumArtist, options) => searchesWith(pageGetter(options)).getRankingForAlbum(albumTitle, albumArtist),
  getRankingFromUrl: direct('getRankingFromUrl'),
  findArtistPage: direct('findArtistPage'),
  parseArtistDiscography: direct('parseArtistDiscography'),
  findAlbumId: direct('findAlbumId'),
  fetchAlbumPage: direct('fetchAlbumPage'),
  parseChartHtml: (html, chartUrl) => searchesWith(pageGetter()).parseChartHtml(html, chartUrl)
}
}

const bestEverPace = createPoliteQueue({ ...BEA_PACE, busyOf: busyOfSource() })

module.exports = {
  ...createBestEverScraper({ pace: bestEverPace }),
  createBestEverScraper,
  busyOfSource,
  BEA_PACE,
  REQUEST_TIMEOUT_MS
}
