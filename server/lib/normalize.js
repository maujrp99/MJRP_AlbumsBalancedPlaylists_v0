// Helpers to normalize provider responses into the canonical album object
function cleanFencedMarkdown(s) {
  if (!s || typeof s !== 'string') return s
  let cleaned = s
  cleaned = cleaned.replace(/```\w*\n?/g, '')
  cleaned = cleaned.replace(/```$/g, '')
  return cleaned.trim()
}

function tryParseJson(s) {
  if (!s || typeof s !== 'string') return null
  try {
    return JSON.parse(s)
  } catch (e) {
    const m = s.match(/\{[\s\S]*\}/)
    if (m) {
      try {
        return JSON.parse(m[0])
      } catch (e2) {
        return null
      }
    }
    return null
  }
}

function tryRecoverRankingFromText(s) {
  if (!s || typeof s !== 'string') return null
  const rankKeyMatch = s.match(/"ranking"\s*:\s*\[/i)
  if (!rankKeyMatch) return null
  const startIdx = s.indexOf('[', rankKeyMatch.index)
  if (startIdx < 0) return null
  const objs = []
  let i = startIdx + 1
  const len = s.length
  while (i < len) {
    // skip whitespace and commas
    while (i < len && /[\s,]/.test(s[i])) i++
    if (i >= len || s[i] !== '{') break
    // find balanced object
    let depth = 0
    let j = i
    while (j < len) {
      if (s[j] === '{') depth++
      else if (s[j] === '}') {
        depth--
        if (depth === 0) {
          const candidate = s.slice(i, j + 1)
          try {
            const parsed = JSON.parse(candidate)
            objs.push(parsed)
          } catch (e) {
            // ignore malformed object
          }
          i = j + 1
          break
        }
      }
      j++
    }
    if (j >= len) break
  }
  if (objs.length) return { ranking: objs }
  return null
}

function parseNumberedList(s) {
  if (!s || typeof s !== 'string') return null
  const lines = s.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const results = []
  // matches lines like "1. Title", "1) Title", "1 - Title", "#1 Title"
  const re = /^\s*(?:#?\d+)(?:[\.)\-:]?)\s*(.*)$/
  for (const line of lines) {
    const m = line.match(re)
    if (m && m[1]) {
      let title = m[1].trim()
      // strip surrounding quotes
      title = title.replace(/^['"“”]+|['"“”]+$/g, '')
      if (title) results.push(title)
    }
  }
  return results.length ? results : null
}

function extractFromCandidate(response) {
  const candidateText = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (candidateText && typeof candidateText === 'string') {
    const cleaned = cleanFencedMarkdown(candidateText)
    const parsed = tryParseJson(cleaned)
    if (parsed && typeof parsed === 'object') return parsed
  }
  return null
}

function extractFromData(response) {
  if (response?.data?.data && typeof response.data.data === 'object') return response.data.data
  if (response?.data && typeof response.data === 'object') return response.data
  return null
}

// Main normalization function: returns { album } or null
// Main normalization function: returns { album } or null
function ensureArray(maybeArray) {
  if (Array.isArray(maybeArray)) return maybeArray
  if (maybeArray && typeof maybeArray === 'object') {
    // Handle "Query Object" case where array is returned as {0: val, 1: val}
    const values = Object.values(maybeArray)
    if (values.length > 0 && values.every(v => typeof v === 'object')) {
      return values
    }
  }
  return []
}

function normalizeAlbumFields(album) {
  if (!album) return null

  // FIX: Thriller Bug - Ensure tracks is an array
  album.tracks = ensureArray(album.tracks)

  // Ensure consistency
  album.artist = album.artist || 'Unknown Artist'
  album.title = album.title || 'Unknown Album'
  album.series = album.series || null
  album.spotifyId = album.spotifyId || null
  album.bestEverScore = album.bestEverScore || null

  return album
}

function extractAlbum(response) {
  if (!response || typeof response !== 'object') return null

  let candidate = null
  const fromCandidate = extractFromCandidate(response)
  if (fromCandidate) candidate = fromCandidate

  if (!candidate) {
    const fromData = extractFromData(response)
    if (fromData) candidate = fromData
  }

  if (candidate) {
    return normalizeAlbumFields(candidate)
  }

  return null
}

// URL verification uses the validateSource helper. Keep this logic centralized
let validateSourceHelpers = null
try {
  validateSourceHelpers = require('./validateSource')
} catch (e) {
  // in some test contexts validateSource may be unavailable; gracefully degrade
  validateSourceHelpers = null
}

const logger = (() => {
  try { return require('./logger') } catch (e) { return console }
})()

async function validateAndSanitizeEntries(entries) {
  if (!Array.isArray(entries)) return entries
  const { verifyUrl, isBestEverUrl } = validateSourceHelpers || {}
  await Promise.all(entries.map(async (ent) => {
    if (ent && ent.referenceUrl && typeof ent.referenceUrl === 'string') {
      try {
        // allow BestEverAlbums urls without network verification
        if (typeof isBestEverUrl === 'function' && isBestEverUrl(ent.referenceUrl)) return
        if (typeof verifyUrl === 'function') {
          const ok = await verifyUrl(ent.referenceUrl).catch(() => false)
          if (!ok) ent.referenceUrl = null
          else if (!ok) {
            // record the nullification event for observability
            try { logger.info('nullified_reference_url', { url: ent.referenceUrl, provider: ent.provider || null, trackTitle: ent.trackTitle || null }) } catch (e) { /* ignore */ }
            ent.referenceUrl = null
          }
        }
      } catch (e) {
        try { logger.warn('reference_url_validation_error', { url: ent.referenceUrl, err: (e && e.message) || String(e) }) } catch (er) { }
        ent.referenceUrl = null
      }
    }
  }))
  return entries
}

function normalizeRankingEntry(entry, fallbackPosition) {
  if (!entry || typeof entry !== 'object') return null
  // Accept multiple possible key names (English/Portuguese/variants)
  const providerField = entry.provider || entry.name || entry.source || entry.fontes || entry.providers
  let provider = null
  if (Array.isArray(providerField)) provider = providerField[0]
  else if (providerField) provider = providerField

  // allow entries even if provider is missing; use fallback string
  if (!provider) provider = 'external'

  const positionVal = entry.position || entry.posicao || entry.rank || fallbackPosition || 0
  const position = Number(positionVal) || fallbackPosition || null

  const trackTitle = entry.trackTitle || entry.track || entry.faixa || entry.title || ''
  const summary = entry.summary || entry.resumo || entry.description || ''
  const referenceUrl = entry.referenceUrl || entry.reference_url || entry.url_referencia || entry.url || ''

  return {
    provider: String(provider),
    summary: summary,
    position,
    trackTitle: String(trackTitle),
    referenceUrl: referenceUrl,
    type: entry.type || 'external'
  }
}

function extractRankingPayload(response) {
  // Try multiple locations where provider text may appear.
  const tryText = (s) => (s && typeof s === 'string') ? s : null

  const candidates = response?.data?.candidates || []
  // common paths to textual content
  const possibleTexts = []
  if (candidates.length) {
    const c = candidates[0].content || {}
    possibleTexts.push(tryText(c?.parts?.[0]?.text))
    possibleTexts.push(tryText(c?.output?.[0]?.content?.[0]?.text))
    possibleTexts.push(tryText(c?.text))
    possibleTexts.push(tryText(c?.outputText))
  }
  possibleTexts.push(tryText(response?.data?.outputText))
  possibleTexts.push(tryText(response?.data?.text))
  possibleTexts.push(tryText(response?.data && JSON.stringify(response.data)))

  for (const t of possibleTexts) {
    if (!t) continue
    const cleaned = cleanFencedMarkdown(t)
    const parsed = tryParseJson(cleaned)
    if (parsed && typeof parsed === 'object') return parsed
    const recovered = tryRecoverRankingFromText(cleaned)
    if (recovered && typeof recovered === 'object') return recovered
    // try a simple numbered list extraction (plain text lists)
    const numbered = parseNumberedList(cleaned)
    if (numbered && Array.isArray(numbered) && numbered.length) {
      const ranking = numbered.map((title, idx) => ({ provider: 'model', trackTitle: title, position: idx + 1, referenceUrl: '' }))
      return { ranking }
    }
  }

  if (response?.data && typeof response.data === 'object') return response.data
  return null
}

function extractRankingEntries(response) {
  const payload = extractRankingPayload(response)
  if (!payload) return []
  let entries = []
  if (Array.isArray(payload)) entries = payload
  else if (Array.isArray(payload.ranking)) entries = payload.ranking
  else if (Array.isArray(payload.entries)) entries = payload.entries
  else if (Array.isArray(payload.acclaim)) entries = payload.acclaim
  return entries
    .map((entry, idx) => normalizeRankingEntry(entry, idx + 1))
    .filter(Boolean)
    .sort((a, b) => (a.position || 0) - (b.position || 0))
}

// Async extractor that validates reference URLs using the centralized helper
async function extractAndValidateRankingEntries(response) {
  const entries = extractRankingEntries(response)
  await validateAndSanitizeEntries(entries)
  return entries
}

function rankingEntriesToSources(entries) {
  if (!Array.isArray(entries)) return []
  return entries.map(entry => ({
    name: entry.provider,
    type: entry.type || 'external',
    reference: entry.referenceUrl || '',
    secure: true,
    description: entry.summary || '',
    metadata: { position: entry.position }
  })).filter(src => Boolean(src.name))
}

module.exports = {
  extractAlbum,
  cleanFencedMarkdown,
  tryParseJson,
  extractRankingEntries,
  extractAndValidateRankingEntries,
  rankingEntriesToSources
}
