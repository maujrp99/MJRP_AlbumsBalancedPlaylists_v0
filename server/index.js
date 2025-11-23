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
const { extractAlbum, extractRankingEntries, extractAndValidateRankingEntries, rankingEntriesToSources } = require('./lib/normalize')
const { consolidateRanking } = require('./lib/ranking')
const { validateAlbum, ajvAvailable } = require('./lib/schema')
const { getRankingForAlbum: getBestEverRanking } = require('./lib/scrapers/besteveralbums')
const { verifyUrl, isBestEverUrl } = require('./lib/validateSource')
const logger = (() => { try { return require('./lib/logger') } catch (e) { return console } })()

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
  // If caller requested a raw provider response (debugging), still call the model
  if (options && options.raw) {
    const rankingResponse = await callProvider({
      prompt: rankingPrompt,
      maxTokens: 2048,
      aiEndpoint: process.env.AI_ENDPOINT,
      aiApiKey: AI_API_KEY,
      aiModelEnv: process.env.AI_MODEL
    })
    return { raw: rankingResponse }
  }

  // PRIMARY: attempt deterministic BestEverAlbums scraper first for provenance
  try {
    const best = await getBestEverRanking(album?.title || albumQuery, album?.artist || '')
    if (best && Array.isArray(best.evidence) && best.evidence.length > 0) {
      // Convert scraper evidence to normalized ranking entries
      const scraperEntries = best.evidence.map((e, idx) => ({
        provider: 'BestEverAlbums',
        trackTitle: e.trackTitle,
        position: idx + 1,
        rating: typeof e.rating === 'number' ? e.rating : (e.rating ? Number(e.rating) : null),
        referenceUrl: best.referenceUrl || best.albumUrl || null
      }))

      // If the scraper covers all tracks (or we don't know track count), return scraper evidence directly.
      const albumTrackCount = Array.isArray(album && album.tracks) ? album.tracks.length : null
      if (!albumTrackCount || scraperEntries.length >= albumTrackCount) {
        const sources = [{ provider: 'BestEverAlbums', providerType: 'community', referenceUrl: best.referenceUrl || best.albumUrl || null }]
        return { entries: scraperEntries, sources, bestEver: { albumUrl: best.referenceUrl || best.albumUrl || null, albumId: best.albumId || null, evidence: best.evidence } }
      }

      // Scraper is partial: call the model as an enricher and merge results deterministically.
      try {
        const rankingResponse = await callProvider({
          prompt: renderPrompt(loadPrompts().rankingPrompt, {
            albumTitle: album.title || albumQuery,
            albumArtist: album.artist || '',
            albumYear: album.year || '',
            albumQuery,
            rankingProviders: ''
          }),
          maxTokens: 2048,
          aiEndpoint: process.env.AI_ENDPOINT,
          aiApiKey: AI_API_KEY,
          aiModelEnv: process.env.AI_MODEL
        })
        let modelEntries = await extractAndValidateRankingEntries(rankingResponse)

        // Merge: prefer scraperEntries (by trackTitle), otherwise use modelEntries; preserve BestEver provider tag
        const mergedByTitle = new Map()
        // index model entries by lowercased title for quick matching
        const modelIndex = new Map()
        modelEntries.forEach(me => {
          if (me && me.trackTitle) modelIndex.set(String(me.trackTitle).toLowerCase(), me)
        })

        // Start with scraper positions
        scraperEntries.forEach(se => {
          if (se && se.trackTitle) mergedByTitle.set(String(se.trackTitle).toLowerCase(), se)
        })

        // Fill gaps from model
        if (Array.isArray(album && album.tracks)) {
          album.tracks.forEach((t, idx) => {
            const key = String((t && (t.title || t.trackTitle || t.name)) || '').toLowerCase()
            if (!key) return
            if (!mergedByTitle.has(key)) {
              const candidate = modelIndex.get(key)
              if (candidate) mergedByTitle.set(key, candidate)
            }
          })
        }

        // As a fallback, include any remaining model entries up to albumTrackCount
        if (mergedByTitle.size < (albumTrackCount || 0)) {
          for (const me of modelEntries) {
            const k = me && me.trackTitle ? String(me.trackTitle).toLowerCase() : null
            if (!k) continue
            if (!mergedByTitle.has(k)) mergedByTitle.set(k, me)
            if (mergedByTitle.size >= (albumTrackCount || Infinity)) break
          }
        }

        // Build ordered entries: try to preserve album track order when available
        const finalEntries = []
        if (Array.isArray(album && album.tracks)) {
          album.tracks.forEach((t, idx) => {
            const k = String((t && (t.title || t.trackTitle || t.name)) || '').toLowerCase()
            const found = k ? mergedByTitle.get(k) : null
            if (found) {
              // if scraper provided position prefer it, otherwise assign next available position
              const pos = found.position || (idx + 1)
              finalEntries.push({ provider: found.provider || 'Model', trackTitle: found.trackTitle || t.title || t.trackTitle, position: pos, referenceUrl: found.referenceUrl || null })
            }
          })
        }

        // If still empty, fall back to mergedByTitle enumeration
        if (finalEntries.length === 0) {
          let i = 1
          for (const v of mergedByTitle.values()) {
            finalEntries.push({ provider: v.provider || 'Model', trackTitle: v.trackTitle, position: v.position || i, referenceUrl: v.referenceUrl || null })
            i++
          }
        }

        // Compose sources: BestEver first, then model sources (limit to 3)
        const modelSources = rankingEntriesToSources(modelEntries || [])
        const sources = [{ provider: 'BestEverAlbums', providerType: 'community', referenceUrl: best.referenceUrl || best.albumUrl || null }]
        for (const s of (modelSources || [])) {
          if (sources.length >= 4) break
          // avoid duplicate provider entries
          if (!sources.some(existing => String(existing.provider).toLowerCase() === String(s.provider || '').toLowerCase())) sources.push(s)
        }

        return { entries: finalEntries, sources, bestEver: { albumUrl: best.referenceUrl || best.albumUrl || null, albumId: best.albumId || null, evidence: best.evidence } }
      } catch (e) {
        // If model enrichment failed, fall back to returning scraper-only evidence
        logger.warn('model_enrichment_failed', { albumQuery, err: (e && e.message) || String(e) })
        const sources = [{ provider: 'BestEverAlbums', providerType: 'community', referenceUrl: best.referenceUrl || best.albumUrl || null }]
        return { entries: scraperEntries, sources, bestEver: { albumUrl: best.referenceUrl || best.albumUrl || null, albumId: best.albumId || null, evidence: best.evidence } }
      }
    }
  } catch (err) {
    logger.warn('bestever_scraper_failed', { albumQuery, err: (err && err.message) || String(err) })
  }

  // FALLBACK: call the model prompt and normalize its results
  const rankingResponse = await callProvider({
    prompt: rankingPrompt,
    maxTokens: 2048,
    aiEndpoint: process.env.AI_ENDPOINT,
    aiApiKey: AI_API_KEY,
    aiModelEnv: process.env.AI_MODEL
  })

  // Detect common truncation/finish signals in provider response and log them
  try {
    const respData = rankingResponse && rankingResponse.data
    const finishReason = (respData?.candidates && respData.candidates[0] && respData.candidates[0].metadata && respData.candidates[0].metadata.finishReason) || respData?.finish_reason || (respData?.choices && respData.choices[0] && respData.choices[0].finish_reason)
    if (finishReason && String(finishReason).toUpperCase().includes('MAX_TOKENS')) {
      logger.info('model_truncation_detected', { albumQuery, finishReason })
    }
  } catch (e) { /* ignore logging errors */ }

  // Use centralized extractor that also validates reference URLs
  let entries = await extractAndValidateRankingEntries(rankingResponse)
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
          // attach BestEver evidence/url to album payload when available
          const bestEver = rankingResult.bestEver
          if (bestEver) {
            // ensure callers can access BestEver evidence and canonical url
            album.bestEverEvidence = Array.isArray(bestEver.evidence) ? bestEver.evidence : []
            album.bestEverUrl = bestEver.albumUrl || null
            // prefer explicit albumId if available
            if (bestEver.albumId) album.bestEverAlbumId = String(bestEver.albumId)
          }
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

// Export fetchRankingForAlbum for test harnesses and scripts
module.exports = { fetchRankingForAlbum }

// Only start the HTTP server when this file is run directly (not when required by tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`AI proxy server listening on http://localhost:${PORT}`)
  })
}
