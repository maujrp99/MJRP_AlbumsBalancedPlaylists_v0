// Ensure Web File/Blob globals exist for libraries (undici) that reference Web APIs during import.
// Prefer a proper polyfill if available, otherwise provide a tiny, safe stub so imports don't throw.
try {
  if (typeof File === 'undefined' || typeof Blob === 'undefined') {
    try {
      // try optional dependency if present
      const fb = require('fetch-blob')
      if (fb) {
        global.File = global.File || fb.File
        global.Blob = global.Blob || fb.Blob
      }
    } catch (e) {
      // Minimal stub implementations: enough to satisfy typeof checks and construction during import.
      // These stubs intentionally do not implement full behavior (they avoid increasing bundle size or adding deps).
      if (typeof Blob === 'undefined') {
        class _Blob {
          constructor(parts = [], options = {}) {
            this.size = Array.isArray(parts) ? parts.reduce((s, p) => s + (typeof p === 'string' ? Buffer.byteLength(p) : (p && p.length) || 0), 0) : 0
            this.type = options.type || ''
          }
          text() { return Promise.resolve('') }
          arrayBuffer() { return Promise.resolve(Buffer.alloc(0)) }
        }
        global.Blob = _Blob
      }
      if (typeof File === 'undefined') {
        class _File extends global.Blob {
          constructor(parts = [], filename = 'file', options = {}) {
            super(parts, options)
            this.name = filename
            this.lastModified = options && options.lastModified ? options.lastModified : Date.now()
          }
        }
        global.File = _File
      }
    }
  }
} catch (err) {
  // If something unexpected happens, let application start and fail later with clearer errors.
}

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

// CORS configuration
// Use `ALLOWED_ORIGIN` (comma-separated) in production to restrict allowed browser origins.
// Default to the known hosted origin when not provided to avoid breaking the hosted site.
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://mjrp-playlist-generator.web.app'
let corsOptions
if (process.env.NODE_ENV === 'production') {
  const allowed = Array.isArray(ALLOWED_ORIGIN) ? ALLOWED_ORIGIN : String(ALLOWED_ORIGIN).split(',').map(s => s.trim()).filter(Boolean)
  if (!allowed.length) console.warn('Warning: ALLOWED_ORIGIN is empty in production; CORS will be restrictive')
  corsOptions = {
    origin: (origin, callback) => {
      // Allow non-browser requests (curl, server-to-server) which have no origin header
      if (!origin) return callback(null, true)
      if (allowed.includes(origin)) return callback(null, true)
      return callback(new Error('CORS origin not allowed'))
    }
  }
} else {
  // In development be permissive for convenience
  corsOptions = { origin: true }
}
app.use(cors(corsOptions))
app.use(express.json())

// (timestamp middleware already attached above)

// Health
app.get('/_health', (req, res) => res.send({ ok: true }))

// Schema and validation are provided by `server/lib/schema.js` (AJV optional)

const { loadPrompts, renderPrompt } = require('./lib/prompts')
const { callProvider } = require('./lib/aiClient')
const { extractAlbum, extractRankingEntries, extractAndValidateRankingEntries, rankingEntriesToSources } = require('./lib/normalize')
const { consolidateRanking, normalizeKey: normalizeRankingKey } = require('./lib/ranking')
const { validateAlbum, ajvAvailable } = require('./lib/schema')
const { getRankingForAlbum: getBestEverRanking } = require('./lib/scrapers/besteveralbums')
const { verifyUrl, isBestEverUrl } = require('./lib/validateSource')
const { fetchRankingForAlbum } = require('./lib/fetchRanking')
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
// fetchRankingForAlbum is now imported from server/lib/fetchRanking.js

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
        let fetchDebug = null

        try {
          // If client requested raw ranking response, return raw provider response here.
          if (req.body && req.body.rawStage === 'ranking') {
            const rankingResult = await fetchRankingForAlbum(album, albumQuery, { raw: true })
            return res.status(200).json({ rawRankingResponse: rankingResult.raw })
          }
          const rankingResult = await fetchRankingForAlbum(album, albumQuery)
          fetchDebug = rankingResult.debugTrace
          rankingEntries = rankingResult.entries
          rankingSources = rankingResult.sources
          // attach BestEver evidence/url to album payload when available
          let bestEver = rankingResult.bestEver
          // Fallback: if fetchRankingForAlbum didn't return BestEver, attempt a standalone scrape
          if (!bestEver) {
            try {
              const be = await getBestEverRanking(album?.title || albumQuery, album?.artist || '')
              if (be && Array.isArray(be.evidence) && be.evidence.length > 0) {
                bestEver = be
                // ensure rankingSources includes BestEver as primary provenance
                rankingSources = Array.isArray(rankingSources) ? rankingSources : []
                // avoid duplicate provider entries
                if (!rankingSources.some(s => String(s.provider || '').toLowerCase() === 'besteveralbums')) {
                  rankingSources.unshift({ provider: 'BestEverAlbums', providerType: 'community', referenceUrl: be.referenceUrl || be.albumUrl || null })
                }
              }
            } catch (e) {
              logger && logger.warn && logger.warn('bestever_scraper_fallback_failed', { albumQuery, err: (e && e.message) || String(e) })
            }
          }
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
          const consolidated = await consolidateRanking(albumPayload.tracks || [], albumPayload.rankingAcclaim || [])
          if (consolidated && consolidated.results) {
            albumPayload.rankingConsolidated = consolidated.results
            albumPayload.rankingConsolidatedMeta = {
              ...consolidated.divergence,
              debugInfo: consolidated.debugInfo,
              rankingEntriesCount: rankingEntries ? rankingEntries.length : -1,
              // rankingResult is block-scoped, so we can't access it here directly without refactoring.
              // But we have rankingEntries which is what matters.
              rankingEntriesSample: rankingEntries && rankingEntries.length ? rankingEntries[0] : null,
              fetchRankingDebug: fetchDebug
            }
          } else {
            // backward-compatible: if consolidateRanking returned an array for any reason
            albumPayload.rankingConsolidated = Array.isArray(consolidated) ? consolidated : []
            albumPayload.rankingConsolidatedMeta = {}
          }
        } catch (e) {
          console.warn('Ranking consolidation failed:', e && e.message)
          albumPayload.rankingConsolidated = []
          albumPayload.rankingConsolidatedMeta = { error: e.message, stack: e.stack }
        }
        // Map consolidated final positions back onto album tracks as `rank` so clients
        // (curation UI/algorithms) can rely on `track.rank` for playlist generation.
        try {
          // Lazy load normalizeKey if needed, or use the one from ranking lib if exported?
          // Actually consolidateRanking uses it internally.
          // But here we need it for mapping.
          // We can use normalizeRankingKey which is imported from ranking lib (which is now async getter? No, I need to check ranking.js export)

          // Wait, ranking.js exports { consolidateRanking, normalizeKey: getNormalizeKey }
          // So normalizeRankingKey is an async function now!
          const normalizeKey = await normalizeRankingKey()

          if (Array.isArray(albumPayload.rankingConsolidated) && Array.isArray(albumPayload.tracks)) {
            const rankMap = new Map()
            albumPayload.rankingConsolidated.forEach(r => {
              if (r && r.trackTitle && (r.finalPosition !== undefined && r.finalPosition !== null)) {
                rankMap.set(normalizeKey(r.trackTitle), Number(r.finalPosition))
              }
            })

            albumPayload.tracks.forEach(t => {
              const key = normalizeKey((t && (t.title || t.trackTitle || t.name)) || '')
              if (key && rankMap.has(key)) t.rank = rankMap.get(key)
            })
          }
        } catch (e) {
          logger && logger.warn && logger.warn('rank_mapping_failed', { err: (e && e.message) || String(e) })
        }
        // Additionally expose a track list ordered by acclaim rank for UI consumers that
        // render the "Ranking de Aclamação" view directly from album payload.
        try {
          if (Array.isArray(albumPayload.tracks)) {
            // ensure every track has a `rank` (fallback to original order if missing)
            albumPayload.tracks.forEach((t, idx) => {
              if (t && (t.rank === undefined || t.rank === null)) t.rank = idx + 1
            })
            // create a sorted copy by rank (1..N) to be used by the UI when showing acclaim order
            albumPayload.tracksByAcclaim = Array.from(albumPayload.tracks).slice().sort((a, b) => {
              const ra = (a && a.rank) || Number.POSITIVE_INFINITY
              const rb = (b && b.rank) || Number.POSITIVE_INFINITY
              return ra - rb
            })
          }
        } catch (e) {
          logger && logger.warn && logger.warn('tracks_by_acclaim_failed', { err: (e && e.message) || String(e) })
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
    const rankingResult = await fetchRankingForAlbum(album || { title: albumQuery, artist: '', year: '' }, albumQuery, { raw: true })
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
    return res.status(200).json({ albumResponse: safeAlbumResp, rawRankingResponse: safeRankingResp, bestEverEvidence: bestEver })
  } catch (err) {
    console.error('Error fetching raw ranking:', err?.message || err)
    const status = err.response?.status || 500
    const data = err.response?.data || { error: 'Could not fetch raw ranking', details: err.message, stack: err.stack }
    return res.status(status).json(data)
  }
})

// Debug endpoint: list files to verify container structure
app.get('/api/debug/files', (req, res) => {
  if (!AI_API_KEY) return res.status(503).json({ error: 'AI API key not configured' })
  const fs = require('fs')
  const path = require('path')
  try {
    const targetPath = req.query.path ? path.resolve(req.query.path) : path.resolve(__dirname)

    const listDir = (dir) => {
      try {
        return fs.readdirSync(dir).map(f => {
          const stat = fs.statSync(path.join(dir, f))
          return { name: f, isDir: stat.isDirectory(), size: stat.size }
        })
      } catch (e) { return e.message }
    }

    res.json({
      cwd: process.cwd(),
      dirname: __dirname,
      targetPath,
      contents: listDir(targetPath)
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Debug endpoint: test import and normalization
app.get('/api/debug/import', async (req, res) => {
  if (!AI_API_KEY) return res.status(503).json({ error: 'AI API key not configured' })
  try {
    const mod = await import('../shared/normalize.js')
    const input = req.query.input
    const normalized = input ? mod.normalizeKey(input) : null
    res.json({ ok: true, exports: Object.keys(mod), input, normalized })
  } catch (e) {
    res.status(500).json({ error: e.message, stack: e.stack })
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
