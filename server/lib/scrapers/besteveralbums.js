const axios = require('axios')
const { cleanTitle, toCore, toFuzzyCore, normalizeArtist } = require('../normalize')
const { upstreamErrorFrom } = require('../outcome')

/**
 * Scraper for BestEverAlbums.
 *
 * The rule of failure (F52): a request to the source that fails (no answer, a deadline, any HTTP
 * status that is not a success) is THROWN as an UpstreamError, from every search path. Nothing here
 * turns a failure into "not found": `null` means the source answered every question and nothing matched.
 *
 * `createBestEverScraper({ http, loadHtml })` receives the HTTP client and the HTML reader, so the
 * tests run with no network; the module also exports one scraper wired to axios and cheerio.
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

// Helper to get axios config with headers
const getAxiosConfig = (timeout = 30000) => ({
  timeout,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9'
  }
})

function createBestEverScraper ({ http = axios, loadHtml = cheerioLoad, logger = console } = {}) {
// One request to the source. A failure leaves here as an UpstreamError and is caught nowhere below.
async function getPage (url) {
  try {
    return await http.get(url, getAxiosConfig(30000))
  } catch (err) {
    const failure = upstreamErrorFrom(err, SOURCE)
    logger.warn(`[BEA] request failed: ${failure.message}`)
    throw failure
  }
}

async function fetchAlbumPage(albumTitle, albumArtist) {
  // BestEverAlbums search works better with cleaner titles
  const cleanT = cleanTitle(albumTitle)
  const q = encodeURIComponent(`${albumArtist} ${cleanT}`)
  const searchUrl = `https://www.besteveralbums.com/search.php?search=${q}`
  const searchRes = await getPage(searchUrl)
  const $search = loadHtml(searchRes.data)

  let albumPath = null
  const qTitle = (albumTitle || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
  const qArtist = (albumArtist || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
  $search('a').each((i, el) => {
    const href = $search(el).attr('href')
    const text = ($search(el).text() || '').toLowerCase()
    if (!href) return
    if (href.match(/thechart\.php\?a=\d+/i) || href.match(/album\.php\?id=\d+/i)) {
      if ((qTitle && text.includes(qTitle)) || (qArtist && text.includes(qArtist))) {
        albumPath = href
        return false
      }
      if (!albumPath) albumPath = href
    }
    if (!albumPath && qTitle) {
      const tokens = qTitle.split(' ')
      for (const t of tokens) {
        if (t && text.includes(t)) {
          albumPath = href
          return false
        }
      }
    }
  })

  if (!albumPath) return null

  const albumUrl = albumPath.startsWith('http') ? albumPath : `https://www.besteveralbums.com${albumPath}`
  // A page that could not be read is a failure (it used to be accepted unseen)
  const res = await getPage(albumUrl)
  const $ = loadHtml(res.data)
  const pageText = ($('title').text() + ' ' + $('h1').text() + ' ' + $('h2').text() + ' ' + $('body').text()).toLowerCase()

  const targetTitleRaw = toCore(albumTitle)
  const targetTitleClean = toCore(cleanTitle(albumTitle))
  const targetArtist = normalizeArtist(albumArtist)

  const hasTitle = (targetTitleRaw && pageText.includes(targetTitleRaw)) ||
    (targetTitleClean && pageText.includes(targetTitleClean))

  const hasArtist = targetArtist && pageText.includes(targetArtist)

  if (hasArtist || hasTitle) return albumUrl
  return null
}

async function pageContainsArtistOrTitle(url, albumTitle, albumArtist) {
  const candidateUrl = url.startsWith('http') ? url : `https://www.besteveralbums.com${url}`
  const res = await getPage(candidateUrl)
  const $ = loadHtml(res.data)
  const titleText = ($('title').text() || '').toLowerCase()
  const headerText = (($('h1').text() || '') + ' ' + ($('h2').text() || '')).toLowerCase()
  const bodyText = ($('body').text() || '').toLowerCase()
  const targetTitleRaw = toCore(albumTitle)
  const targetArtist = normalizeArtist(albumArtist)

  const h1 = $('h1').first()
  if (h1 && h1.length) {
    const artistLink = h1.find('a').first()
    if (artistLink && artistLink.length) {
      const artistText = normalizeArtist(artistLink.text())
      if (artistText && targetArtist && artistText === targetArtist) return true
    }
    const h1Text = (h1.text() || '').toLowerCase()
    if (targetArtist && h1Text.includes(`by ${targetArtist}`)) return true
  }

  if (targetArtist && bodyText.includes(targetArtist) && bodyText.includes(targetTitleRaw)) return true

  return titleText.includes(targetTitleRaw) || headerText.includes(targetTitleRaw)
}

/**
 * Stage 1: Standard Search logic.
 */
async function _standardFindAlbumId(albumTitle, albumArtist) {
  const cleanT = cleanTitle(albumTitle)
  const q = encodeURIComponent(`${albumArtist || ''} ${cleanT || ''}`)
  const suggestUrl = `https://www.besteveralbums.com/suggest.php?q=${q}`

  const res = await getPage(suggestUrl)
  const { titles, urls } = parseSuggest(res.data)

  const targetArtist = normalizeArtist(albumArtist)

  for (let i = 0; i < titles.length; i++) {
    const t = String(titles[i] || '').toLowerCase()
    const normalizedT = toCore(t)

    // FAST-ACCEPT Logic (Standard Flow)
    // Robustness: Use toFuzzyCore to handle common suffixes/labels in suggest results
    const fuzzyT = toFuzzyCore(t)
    const fuzzyTitle = toFuzzyCore(albumTitle)

    if (targetArtist && (normalizedT.includes(targetArtist) || targetArtist.includes(normalizedT)) && (fuzzyT.includes(fuzzyTitle) || fuzzyTitle.includes(fuzzyT))) {
      const u = urls[i]
      logger.log(`[BEA Search] ✅ MATCH found in Standard Search: "${t}" (Fuzzy: ${fuzzyT}) -> ${u}`)
      const mChart = String(u).match(/thechart\.php\?a=(\d+)/i)
      if (mChart) return mChart[1]
      const mAlbum = String(u).match(/album\.php\?id=(\d+)/i)
      if (mAlbum) return mAlbum[1]
    }
  }

  // Try verifying candidates (Standard Flow)
  for (const u of urls) {
    if (await pageContainsArtistOrTitle(String(u), albumTitle, albumArtist)) {
      const mChart = String(u).match(/thechart\.php\?a=(\d+)/i)
      if (mChart) return mChart[1]
      const mAlbum = String(u).match(/album\.php\?id=(\d+)/i)
      if (mAlbum) return mAlbum[1]
    }
  }

  // Fallback to HTML Search (Standard Flow)
  const alt = await fetchAlbumPage(albumTitle, albumArtist)
  if (alt) {
    const mChart = String(alt).match(/thechart\.php\?a=(\d+)/i)
    if (mChart) return mChart[1]
    const mAlbum = String(alt).match(/album\.php\?id=(\d+)/i)
    if (mAlbum) return mAlbum[1]
  }

  return null
}

/**
 * Stage 2: Fuzzy/Robust Search fallbacks (Edge Case logic).
 */
async function _fuzzyFindAlbumId(albumTitle, albumArtist) {
  const prunedTitle = (albumTitle || '').split(':')[0].split(' - ')[0].trim()
  const variations = [
    albumArtist || '',                                     // Artist only
    albumTitle || '',                                      // Original Title only
    `${albumArtist || ''} ${albumTitle || ''}`,            // Full original string
    prunedTitle,                                           // Pruned title (no subtitles)
    `${albumArtist || ''} ${prunedTitle}`                  // Artist + Pruned title
  ].filter(v => v.trim().length > 0)

  for (const qText of variations) {
    const q = encodeURIComponent(qText)
    const suggestUrl = `https://www.besteveralbums.com/suggest.php?q=${q}`
    logger.log(`[BEA Fuzzy Fallback] Trying suggest for: "${qText}"`)
    const res = await getPage(suggestUrl)
    const { titles, urls } = parseSuggest(res.data)

    const targetTitle = toFuzzyCore(albumTitle)
    const targetArtist = normalizeArtist(albumArtist)

    for (let i = 0; i < titles.length; i++) {
      const t = String(titles[i] || '').toLowerCase()
      const normalizedCandidate = toFuzzyCore(t)
      const candidateArtist = normalizeArtist(t)

      const artistMatch = !targetArtist || candidateArtist.includes(targetArtist) || targetArtist.includes(candidateArtist) || normalizedCandidate.includes(targetArtist)
      const titleMatch = normalizedCandidate.includes(targetTitle) || targetTitle.includes(normalizedCandidate)

      if (artistMatch && titleMatch) {
        const u = urls[i]
        logger.log(`[BEA Search] ✅ MATCH found in Fuzzy Fallback: "${t}" (Fuzzy: ${normalizedCandidate}) -> ${u}`)
        const mChart = String(u).match(/thechart\.php\?a=(\d+)/i)
        if (mChart) return mChart[1]
        const mAlbum = String(u).match(/album\.php\?id=(\d+)/i)
        if (mAlbum) return mAlbum[1]
      }
    }
  }
  return null
}

async function findAlbumId(albumTitle, albumArtist) {
  // 1. Standard Pass (Original logic)
  let id = await _standardFindAlbumId(albumTitle, albumArtist)
  if (id) return id

  // 2. Fuzzy Fallback (Robust/Edge case logic)
  logger.log(`[BEA Search] Standard search failed for "${albumTitle}". Trying fuzzy fallback.`)
  return await _fuzzyFindAlbumId(albumTitle, albumArtist)
}

async function findArtistPage(artistName) {
  const q = encodeURIComponent(artistName)
  const suggestUrl = `https://www.besteveralbums.com/suggest.php?q=${q}`
  const res = await getPage(suggestUrl)
  const { urls } = parseSuggest(res.data)
  const candidates = []
  for (const u of urls) {
    if (!u) continue
    const m = String(u).match(/thechart\.php\?b=(\d+)/i)
    if (m) candidates.push({ id: m[1], url: String(u) })
  }
  const target = normalizeArtist(artistName)
  for (const c of candidates) {
    const artistUrl = c.url.startsWith('http') ? c.url : `https://www.besteveralbums.com${c.url}`
    const r = await getPage(artistUrl)
    const $ = loadHtml(r.data)
    const header = (($('h1').text() || '') + ' ' + ($('title').text() || '')).toLowerCase()
    const normalizedHeader = normalizeArtist(header)
    if (normalizedHeader.includes(target)) return c.id
  }
  return null
}

async function parseArtistDiscography(artistId) {
  const url = `https://www.besteveralbums.com/thechart.php?b=${artistId}`
  const res = await getPage(url)
  const $ = loadHtml(res.data)

  const albums = []
  $('a').each((i, el) => {
    const href = $(el).attr('href')
    const text = ($(el).text() || '').trim()
    if (!href || !text) return
    const mChart = href.match(/thechart\.php\?a=(\d+)/i)
    const mAlbum = href.match(/album\.php\?id=(\d+)/i)
    if (mChart) albums.push({ id: mChart[1], title: text, url: href.startsWith('http') ? href : `https://www.besteveralbums.com${href}` })
    else if (mAlbum) albums.push({ id: mAlbum[1], title: text, url: href.startsWith('http') ? href : `https://www.besteveralbums.com${href}` })
  })

  const seen = new Set()
  const unique = []
  for (const a of albums) {
    if (!seen.has(a.id)) {
      seen.add(a.id)
      unique.push(a)
    }
  }
  return { artistUrl: url, albums: unique }
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
async function getRankingForAlbum(albumTitle, albumArtist) {
  if (albumArtist) {
    const artistId = await findArtistPage(albumArtist)
    if (artistId) {
      const disc = await parseArtistDiscography(artistId)
      const normalize = s => (s || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, '').trim()
      const target = normalize(albumTitle)
      for (const a of disc.albums) {
        if (normalize(a.title) === target) {
          const chartMatch = a.url.match(/thechart\.php\?a=(\d+)/i)
          if (chartMatch) {
            const parsed = await parseChartRankingById(chartMatch[1])
            return { provider: 'BestEverAlbums', providerType: 'community', referenceUrl: parsed.albumUrl, albumId: parsed.albumId, evidence: parsed.evidence }
          }
          const albumMatch = a.url.match(/album\.php\?id=(\d+)/i)
          if (albumMatch) {
            const parsed = await parseAlbumRanking(a.url)
            return { provider: 'BestEverAlbums', providerType: 'community', referenceUrl: parsed.albumUrl, evidence: parsed.evidence }
          }
        }
      }
    }
  }
  const id = await findAlbumId(albumTitle, albumArtist)
  if (id) {
    const parsed = await parseChartRankingById(id)
    return { provider: 'BestEverAlbums', providerType: 'community', referenceUrl: parsed.albumUrl, albumId: parsed.albumId, evidence: parsed.evidence }
  }
  const albumUrl = await fetchAlbumPage(albumTitle, albumArtist)
  if (!albumUrl) return null
  const parsed = await parseAlbumRanking(albumUrl)
  return { provider: 'BestEverAlbums', providerType: 'community', referenceUrl: parsed.albumUrl, albumId: parsed.albumId || null, evidence: parsed.evidence }
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

module.exports = { ...createBestEverScraper(), createBestEverScraper }
