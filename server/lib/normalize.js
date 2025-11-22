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
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.tracks)) return parsed
  }
  return null
}

function extractFromData (response) {
  if (response?.data?.data && typeof response.data.data === 'object') return response.data.data
  if (response?.data && typeof response.data === 'object' && Array.isArray(response.data.tracks)) return response.data
  return null
}

// Main normalization function: returns { album } or null
function extractAlbum (response) {
  if (!response || typeof response !== 'object') return null
  const fromCandidate = extractFromCandidate(response)
  if (fromCandidate) return fromCandidate
  const fromData = extractFromData(response)
  if (fromData) return fromData
  return null
}

module.exports = {
  extractAlbum,
  cleanFencedMarkdown,
  tryParseJson
}
