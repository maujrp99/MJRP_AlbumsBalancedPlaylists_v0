// Helpers to normalize provider responses into the canonical album object
function cleanFencedMarkdown (s) {
  if (!s || typeof s !== 'string') return s
  let cleaned = s
  cleaned = cleaned.replace(/```\w*\n?/g, '')
  cleaned = cleaned.replace(/```$/g, '')
  return cleaned.trim()
}

function tryParseJson (s) {
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

function extractFromCandidate (response) {
  const candidateText = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (candidateText && typeof candidateText === 'string') {
    const cleaned = cleanFencedMarkdown(candidateText)
    const parsed = tryParseJson(cleaned)
    if (parsed && typeof parsed === 'object') return parsed
  }
  return null
}

function extractFromData (response) {
  if (response?.data?.data && typeof response.data.data === 'object') return response.data.data
  if (response?.data && typeof response.data === 'object') return response.data
  return null
}

// Main normalization function: returns { album } or null
function extractAlbum (response) {
  if (!response || typeof response !== 'object') return null
  const fromCandidate = extractFromCandidate(response)
  if (fromCandidate && Array.isArray(fromCandidate.tracks)) return fromCandidate
  const fromData = extractFromData(response)
  if (fromData && Array.isArray(fromData.tracks)) return fromData
  return null
}

function normalizeRankingEntry (entry, fallbackPosition) {
  if (!entry || typeof entry !== 'object') return null
  const provider = entry.provider || entry.name || entry.source
  if (!provider) return null
  const positionVal = entry.position || entry.rank || fallbackPosition || 0
  const position = Number(positionVal) || fallbackPosition || null
  return {
    provider: String(provider),
    summary: entry.summary || entry.description || '',
    position,
    referenceUrl: entry.referenceUrl || entry.url || entry.sourceUrl || '',
    type: entry.type || 'external'
  }
}

function extractRankingPayload (response) {
  const candidateText = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (candidateText && typeof candidateText === 'string') {
    const cleaned = cleanFencedMarkdown(candidateText)
    const parsed = tryParseJson(cleaned)
    if (parsed && typeof parsed === 'object') return parsed
  }
  if (response?.data && typeof response.data === 'object') return response.data
  return null
}

function extractRankingEntries (response) {
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

function rankingEntriesToSources (entries) {
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
  rankingEntriesToSources
}
