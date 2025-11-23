const axios = require('axios')
const cheerio = require('cheerio')

// Simple scraper for BestEverAlbums album pages.
// Given an album title and artist, attempt to find album page by search,
// then extract track ranking if present ordered by rating.

async function fetchAlbumPage(albumTitle, albumArtist) {
  // BestEverAlbums has search endpoint like: https://www.besteveralbums.com/search.php?search=led+zeppelin+physical+graffiti
  const q = encodeURIComponent(`${albumArtist} ${albumTitle}`)
  const searchUrl = `https://www.besteveralbums.com/search.php?search=${q}`
  const searchRes = await axios.get(searchUrl, { timeout: 15000 })
  const $search = cheerio.load(searchRes.data)

  // Attempt to find a reliable album/chart link in search results.
  // Prefer explicit album/chart paths like 'thechart.php?a=ID' or 'album.php?id=ID'.
  let albumPath = null
  const qTitle = (albumTitle || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  const qArtist = (albumArtist || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  $search('a').each((i, el) => {
    const href = $search(el).attr('href')
    const text = ($search(el).text() || '').toLowerCase()
    if (!href) return
    // strong match: explicit album/chart path
    if (href.match(/thechart\.php\?a=\d+/i) || href.match(/album\.php\?id=\d+/i)) {
      // if anchor text is related to the album or artist, pick it
      if ((qTitle && text.includes(qTitle)) || (qArtist && text.includes(qArtist))) {
        albumPath = href
        return false
      }
      // else tentatively pick first explicit album link
      if (!albumPath) albumPath = href
    }
    // minor match: anchor text contains album title token
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

  // Normalize URL
  const albumUrl = albumPath.startsWith('http') ? albumPath : `https://www.besteveralbums.com${albumPath}`
  return albumUrl
}

async function findAlbumId(albumTitle, albumArtist) {
  // Prefer the suggest endpoint which can return album/chart URLs for combined queries
  const q = encodeURIComponent(`${albumArtist || ''} ${albumTitle || ''}`)
  const suggestUrl = `https://www.besteveralbums.com/suggest.php?q=${q}`
  try {
    const res = await axios.get(suggestUrl, { timeout: 10000 })
    const parsed = res.data
    const urls = Array.isArray(parsed) && parsed.length > 2 ? parsed[3] || parsed[2] || [] : []
    for (const u of urls) {
      if (!u) continue
      const mChart = u.match(/thechart\.php\?a=(\d+)/i)
      if (mChart) return mChart[1]
      const mAlbum = u.match(/album\.php\?id=(\d+)/i)
      if (mAlbum) return mAlbum[1]
    }
  } catch (err) {
    // fallback to older HTML search
    const q2 = encodeURIComponent(`${albumArtist} ${albumTitle}`)
    const searchUrl = `https://www.besteveralbums.com/search.php?search=${q2}`
    const searchRes = await axios.get(searchUrl, { timeout: 15000 })
    const $ = cheerio.load(searchRes.data)
    let found = null
    $('a').each((i, el) => {
      const href = $(el).attr('href')
      if (!href) return
      const mChart = href.match(/thechart\.php\?a=(\d+)/i)
      if (mChart) {
        found = mChart[1]
        return false
      }
      const mAlbum = href.match(/album\.php\?id=(\d+)/i)
      if (mAlbum) {
        found = mAlbum[1]
        return false
      }
    })
    return found // may be null
  }
  return null
}

async function findArtistPage(artistName) {
  // Use the suggest endpoint which returns JSON suggestions including artist/chart urls
  const q = encodeURIComponent(artistName)
  const suggestUrl = `https://www.besteveralbums.com/suggest.php?q=${q}`
  const res = await axios.get(suggestUrl, { timeout: 10000 })
  // suggest.php returns a JSON array where one of the arrays is a list of URLs
  try {
    const parsed = res.data
    // parsed[2] is array of urls (based on observed structure)
    const urls = Array.isArray(parsed) && parsed.length > 2 ? parsed[3] || parsed[2] || [] : []
    for (const u of urls) {
      if (!u) continue
      const m = u.match(/thechart\.php\?b=(\d+)/i)
      if (m) return m[1]
    }
  } catch (err) {
    // fall back to search.php heuristics already present earlier
  }
  return null
}

async function parseArtistDiscography(artistId) {
  const url = `https://www.besteveralbums.com/thechart.php?b=${artistId}`
  const res = await axios.get(url, { timeout: 15000 })
  const $ = cheerio.load(res.data)

  const albums = []
  // look for album links on artist page
  $('a').each((i, el) => {
    const href = $(el).attr('href')
    const text = ($(el).text() || '').trim()
    if (!href || !text) return
    const mChart = href.match(/thechart\.php\?a=(\d+)/i)
    const mAlbum = href.match(/album\.php\?id=(\d+)/i)
    if (mChart) albums.push({ id: mChart[1], title: text, url: href.startsWith('http') ? href : `https://www.besteveralbums.com${href}` })
    else if (mAlbum) albums.push({ id: mAlbum[1], title: text, url: href.startsWith('http') ? href : `https://www.besteveralbums.com${href}` })
  })

  // dedupe by id keeping first seen
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
  const res = await axios.get(chartUrl, { timeout: 15000 })
  const $ = cheerio.load(res.data)

  // find the table header that includes Track and Rating
  const rows = []
  $('table').each((i, table) => {
    const $table = $(table)
    const headerText = $table.find('th').text().toLowerCase()
    if (headerText.includes('track') && headerText.includes('rating')) {
      $table.find('tr').each((j, tr) => {
        const $tr = $(tr)
        const tds = $tr.find('td')
        if (tds.length >= 2) {
          // find the track title in the second column (usually)
          const trackTd = $tr.find('td').filter((k, el) => {
            const txt = $(el).text().toLowerCase()
            return txt && /[a-z0-9]/i.test(txt) && !txt.match(/rating|comments|votes/i)
          }).first()
          let title = trackTd.text().trim()
          // prefer anchor text if present
          const a = trackTd.find('a').first()
          if (a && a.text()) title = a.text().trim()

          // rating cell likely contains 'Rating: 90 (584 votes)'
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
              const m2 = rtxt.match(/(\d{1,3})/) // fallback
              if (m2) rating = parseInt(m2[1], 10)
            }
          }

          if (title) rows.push({ trackTitle: title, rating })
        }
      })
    }
  })

  // fallback: try parsing rows under '#tracks' anchor lists
  if (rows.length === 0) {
    // look for the modern div-based tracks listing
    $('.tracks .item-row').each((i, el) => {
      const $el = $(el)
      const title = $el.find('.track-list-track a').first().text().trim() || $el.find('.track-list-track').text().trim()
      // rating inside .track-list-ave, e.g. 'Rating: 84 (398 votes)'
      let rating = null
      const ave = $el.find('.track-list-ave').first().text()
      if (ave) {
        const m = ave.match(/(\d{1,3})(?=\s*\()/) || ave.match(/(\d{1,3})/)
        if (m) rating = parseInt(m[1], 10)
      }
      if (title) rows.push({ trackTitle: title, rating })
    })
  }

  // Normalize title cleanup
  const normalized = rows.map(r => ({
    trackTitle: r.trackTitle.replace(/^\s*\d+\.\s*/, '').trim(),
    rating: typeof r.rating === 'number' ? r.rating : null
  }))

  // order by rating descending (nulls at end), keep original track order as tiebreaker
  normalized.sort((a, b) => {
    if (a.rating === null && b.rating === null) return 0
    if (a.rating === null) return 1
    if (b.rating === null) return -1
    return b.rating - a.rating
  })

  return { albumUrl: chartUrl, albumId: String(id), evidence: normalized }
}

// Helper: parse chart HTML string (useful for fixture-based tests)
function parseChartHtml (html, chartUrl = 'https://example/') {
  const $ = cheerio.load(html)
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

  // fallback handling similar to parseChartRankingById
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
  const res = await axios.get(albumUrl, { timeout: 15000 })
  const $ = cheerio.load(res.data)

  // BestEverAlbums album pages often have a track listing table; also they show user ratings per track in a table with class 'track' or similar.
  // We'll attempt a few heuristics to collect track titles and ratings, falling back gracefully.

  const evidence = []

  // Heuristic: find table rows that contain track names and rating columns
  $('table').each((i, table) => {
    const $table = $(table)
    // look for header that suggests tracks/ratings
    const headerText = $table.find('th').first().text().toLowerCase()
    if (headerText.includes('track') || headerText.includes('song') || headerText.includes('rating')) {
      $table.find('tr').each((j, tr) => {
        const $tr = $(tr)
        const tds = $tr.find('td')
        if (tds.length >= 2) {
          const title = $tr.find('td').first().text().trim()
          const ratingText = $tr.find('td').last().text().trim()
          if (title) {
            evidence.push({ trackTitle: title, rating: ratingText })
          }
        }
      })
    }
  })

  // Fallback: look for lists of tracks
  if (evidence.length === 0) {
    $('li').each((i, li) => {
      const t = $(li).text().trim()
      if (t && t.length < 200) {
        evidence.push({ trackTitle: t })
      }
    })
  }

  // Normalize: try to extract title-only strings
  const normalized = evidence
    .map(e => {
      let title = e.trackTitle || ''
      // remove leading numbering like '1.'
      title = title.replace(/^\s*\d+\.\s*/, '')
      // remove rating fragment in parentheses
      title = title.replace(/\s*\(.*?\)\s*$/, '').trim()
      return { trackTitle: title, rating: e.rating || null }
    })
    .filter(e => e.trackTitle && e.trackTitle.length > 1)

  return { albumUrl, evidence: normalized }
}

async function getRankingForAlbum(albumTitle, albumArtist) {
  try {
    // 1) Try artist→discography lookup (more reliable)
    if (albumArtist) {
      const artistId = await findArtistPage(albumArtist)
      if (artistId) {
        const disc = await parseArtistDiscography(artistId)
        // normalize titles and try to match
        const normalize = s => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '').trim()
        const target = normalize(albumTitle)
        for (const a of disc.albums) {
          if (normalize(a.title) === target) {
            // found album id
            // a.id may be either chart id or album id depending on link
            // prefer chart parsing if possible
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

    // 2) Try to find chart id by searching album+artist text
    const id = await findAlbumId(albumTitle, albumArtist)
    if (id) {
      const parsed = await parseChartRankingById(id)
      return { provider: 'BestEverAlbums', providerType: 'community', referenceUrl: parsed.albumUrl, albumId: parsed.albumId, evidence: parsed.evidence }
    }

    // 3) fallback: try generic album page parsing using search heuristics
    const albumUrl = await fetchAlbumPage(albumTitle, albumArtist)
    if (!albumUrl) return null
    const parsed = await parseAlbumRanking(albumUrl)
    // parseAlbumRanking may not know the chart id; return albumUrl and evidence
    return { provider: 'BestEverAlbums', providerType: 'community', referenceUrl: parsed.albumUrl, albumId: parsed.albumId || null, evidence: parsed.evidence }
  } catch (err) {
    return { error: err.message }
  }
}

async function getRankingFromUrl(albumUrl) {
  try {
    // If the URL is a thechart.php?a=ID link, use the chart parser which extracts ratings
    const m = albumUrl.match(/thechart\.php\?a=(\d+)/i)
    if (m) {
      const parsed = await parseChartRankingById(m[1])
      return { provider: 'BestEverAlbums', providerType: 'community', referenceUrl: parsed.albumUrl, evidence: parsed.evidence }
    }

    const parsed = await parseAlbumRanking(albumUrl)
    return { provider: 'BestEverAlbums', providerType: 'community', referenceUrl: parsed.albumUrl, evidence: parsed.evidence }
  } catch (err) {
    return { error: err.message }
  }
}

module.exports = { getRankingForAlbum, getRankingFromUrl, findArtistPage, parseArtistDiscography, findAlbumId, fetchAlbumPage, parseChartHtml }
