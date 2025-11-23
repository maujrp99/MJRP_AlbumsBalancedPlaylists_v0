const express = require('express')
const axios = require('axios')
const cors = require('cors')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3000
const AI_API_KEY = process.env.AI_API_KEY

if (!AI_API_KEY) {
  console.warn('Warning: AI_API_KEY not set. Proxy will return 503 for generate requests.')
}

// Allow CORS for the dev origin or be permissive in non-production for local testing.
const corsOptions = (process.env.NODE_ENV === 'production')
  ? { origin: 'http://localhost:8000' }
  : { origin: true } // allow any origin in development for convenience
app.use(cors(corsOptions))
app.use(express.json())

// (timestamp middleware already attached above)

// Health
app.get('/_health', (req, res) => res.send({ ok: true }))

// Schema and validation are provided by `server/lib/schema.js` (AJV optional)

const { loadPrompts, renderPrompt } = require('./lib/prompts')
const { callProvider } = require('./lib/aiClient')
const { extractAlbum, extractRankingEntries, rankingEntriesToSources } = require('./lib/normalize')
const { consolidateRanking } = require('./lib/ranking')
const { validateAlbum, ajvAvailable } = require('./lib/schema')
const { getRankingForAlbum: getBestEverRanking } = require('./lib/scrapers/besteveralbums')

// Optional helper: list available models from Google Generative Language
app.get('/api/list-models', async (req, res) => {
  if (!AI_API_KEY) return res.status(503).json({ error: 'AI API key not configured on server' })
  try {
    const listUrl = 'https://generativelanguage.googleapis.com/v1/models?key=' + encodeURIComponent(AI_API_KEY)
    const resp = await axios.get(listUrl, { timeout: 10_000 })
    return res.status(resp.status).json(resp.data)
  } catch (err) {
    console.error('Error listing models:', err?.response?.status, err?.response?.data || err.message || err)
    const status = err.response?.status || 500
    const data = err.response?.data || { error: 'Could not list models' }
    return res.status(status).json(data)
  }
})

// Proxy endpoint: accepts { albumQuery }
// fetchRankingForAlbum now accepts an `options` object. If `options.raw === true`,
// it returns the raw provider response (no normalization) to help debugging.
async function fetchRankingForAlbum (album, albumQuery, options = {}) {
  const prompts = loadPrompts()
  const template = prompts.rankingPrompt
  if (!template) return { entries: [], sources: [] }
  // Format providers into a compact, human-readable list for template injection.
  const rankingProviders = Array.isArray(prompts.defaultRankingProviders)
    ? prompts.defaultRankingProviders
      .slice(0, 10)
      .map((p, i) => `${i + 1}. ${String(p).trim()}`)
      .join('\n')
    : ''
  const rankingPrompt = renderPrompt(template, {
    albumTitle: album.title || albumQuery,
    albumArtist: album.artist || '',
    albumYear: album.year || '',
    albumQuery,
    rankingProviders
  })
  if (!rankingPrompt) return { entries: [], sources: [] }
  const rankingResponse = await callProvider({
    prompt: rankingPrompt,
    maxTokens: 2048,
    aiEndpoint: process.env.AI_ENDPOINT,
    aiApiKey: AI_API_KEY,
    aiModelEnv: process.env.AI_MODEL
  })
  if (options && options.raw) {
    return { raw: rankingResponse }
  }
  const entries = extractRankingEntries(rankingResponse)
  const sources = rankingEntriesToSources(entries)
  return { entries, sources }
}

app.post('/api/generate', async (req, res) => {
  if (!AI_API_KEY) return res.status(503).json({ error: 'AI API key not configured on server' })

  const { albumQuery, model, maxTokens } = req.body
  if (!albumQuery) return res.status(400).json({ error: 'Missing albumQuery in request body' })

  try {
    const prompts = loadPrompts()
    const albumPrompt = renderPrompt(prompts.albumSearchPrompt, { albumQuery })
    const response = await callProvider({
      prompt: albumPrompt || undefined,
      albumQuery,
      model,
      maxTokens,
      aiEndpoint: process.env.AI_ENDPOINT,
      aiApiKey: AI_API_KEY,
      aiModelEnv: process.env.AI_MODEL
    })

    const latencyMs = Date.now() - (req._startTime || Date.now())
    const usedModel = (process.env.AI_MODEL || 'models/gemini-2.5-flash')
    console.log(`AI proxy: model=${usedModel} status=${response.status} latencyMs=${latencyMs}`)

    if (response.data?.usageMetadata) {
      try {
        const u = response.data.usageMetadata
        console.log(`AI usage: promptTokens=${u.promptTokenCount || '-'} totalTokens=${u.totalTokenCount || '-'} thoughtsTokens=${u.thoughtsTokenCount || '-'} `)
      } catch (e) { /* ignore */ }
    }

    // Normalize
    try {
      const album = extractAlbum(response)
      if (album) {
        if (ajvAvailable && validateAlbum) {
          const ok = validateAlbum(album)
          if (!ok) {
            console.warn('Album validation failed:', validateAlbum.errors)
            return res.status(422).json({ error: 'Validation failed', validationErrors: validateAlbum.errors })
          }
        }
        let rankingEntries = []
        let rankingSources = []
        try {
          // If client requested raw ranking response, return raw provider response here.
          if (req.body && req.body.rawStage === 'ranking') {
            const rankingResult = await fetchRankingForAlbum(album, albumQuery, { raw: true })
            return res.status(200).json({ rawRankingResponse: rankingResult.raw })
          }
          const rankingResult = await fetchRankingForAlbum(album, albumQuery)
          rankingEntries = rankingResult.entries
          rankingSources = rankingResult.sources
        } catch (err) {
          console.warn('Ranking fetch skipped:', err?.message || err)
        }
        const combinedSources = Array.isArray(album.rankingSources)
          ? [...album.rankingSources, ...rankingSources]
          : [...rankingSources]
        const albumPayload = {
          ...album,
          rankingSources: combinedSources
        }
        if (rankingEntries.length) albumPayload.rankingAcclaim = rankingEntries
        // Consolidate acclaim into a single ranking using Borda count
        try {
          albumPayload.rankingConsolidated = consolidateRanking(albumPayload.tracks || [], albumPayload.rankingAcclaim || [])
        } catch (e) {
          console.warn('Ranking consolidation failed:', e && e.message)
          albumPayload.rankingConsolidated = []
        }
        return res.status(200).json({ data: albumPayload })
      }
    } catch (err) {
      console.warn('Normalization attempt failed, forwarding raw provider response', err?.message || err)
    }

    return res.status(response.status).json(response.data)
  } catch (err) {
    console.error('Error proxying to AI provider:', err?.response?.status, err?.response?.data || err.message || err)
    const status = err.response?.status || 500
    const data = err.response?.data || { error: 'AI provider error' }
    return res.status(status).json(data)
  }
})

// Debug endpoint: return raw provider response for ranking prompt (no normalization)
app.post('/api/debug/raw-ranking', async (req, res) => {
  if (!AI_API_KEY) return res.status(503).json({ error: 'AI API key not configured on server' })
  const { albumQuery, model, maxTokens } = req.body
  if (!albumQuery) return res.status(400).json({ error: 'Missing albumQuery in request body' })
  try {
    const prompts = loadPrompts()
    const albumPrompt = renderPrompt(prompts.albumSearchPrompt, { albumQuery })
    const albumResp = await callProvider({ prompt: albumPrompt || undefined, albumQuery, model, maxTokens, aiEndpoint: process.env.AI_ENDPOINT, aiApiKey: AI_API_KEY, aiModelEnv: process.env.AI_MODEL })
    // attempt to extract album to get title/artist/year for ranking prompt; fall back to albumQuery
    let album = null
    try { album = extractAlbum(albumResp) } catch (e) { /* ignore */ }
    const rankingResult = await fetchRankingForAlbum(album || { title: albumQuery, artist: '' , year: '' }, albumQuery, { raw: true })
    // also attempt to fetch evidence from BestEverAlbums
    let bestEver = null
    try {
      bestEver = await getBestEverRanking(album?.title || albumQuery, album?.artist || '')
    } catch (e) {
      console.warn('BestEverAlbums scraper failed:', e && e.message)
    }
    // provider response objects may contain circular references; return only the `.data` payload
    const safeAlbumResp = albumResp && albumResp.data ? albumResp.data : null
    const safeRankingResp = rankingResult && rankingResult.raw && rankingResult.raw.data ? rankingResult.raw.data : null
    return res.status(200).json({ albumResponse: safeAlbumResp, rawRankingResponse: safeRankingResp, bestEverEvidence: bestEver })
  } catch (err) {
    console.error('Error fetching raw ranking:', err?.message || err)
    const status = err.response?.status || 500
    const data = err.response?.data || { error: 'Could not fetch raw ranking' }
    return res.status(status).json(data)
  }
})

// attach a tiny middleware to timestamp requests for latency metrics
app.use((req, res, next) => {
  req._startTime = Date.now()
  next()
})

app.listen(PORT, () => {
  console.log(`AI proxy server listening on http://localhost:${PORT}`)
})
