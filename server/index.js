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
    } catch {
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
} catch {
  // If something unexpected happens, let application start and fail later with clearer errors.
}

const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '.env') })

const app = express()
const PORT = process.env.PORT || 3000
const AI_API_KEY = process.env.AI_API_KEY

if (!AI_API_KEY) {
  console.warn('Warning: AI_API_KEY not set. Proxy will return 503 for generate requests.')
}

// ============================================================================
// CORS Configuration
// ============================================================================
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

// Timestamp middleware for latency metrics
app.use((req, res, next) => {
  req._startTime = Date.now()
  next()
})

// ============================================================================
// Health Check
// ============================================================================
app.get('/_health', (req, res) => res.send({ ok: true }))

// ============================================================================
// Load Dependencies for Routes
// ============================================================================
const { loadPrompts, renderPrompt } = require('./lib/prompts')
loadPrompts() // without its prompts the server does not start: a missing or unusable file is thrown here (F52)
const { callProvider } = require('./lib/aiClient')
const { extractAlbum } = require('./lib/normalize')
const { validateAlbum, ajvAvailable } = require('./lib/schema')
const { getRankingForAlbum: getBestEverRanking } = require('./lib/scrapers/besteveralbums')
const { fetchRankingForAlbum } = require('./lib/fetchRanking')
const { consolidateRanking } = require('./lib/ranking')
const logger = (() => { try { return require('./lib/logger') } catch { return console } })()

// Dependencies object for route initialization
const routeDeps = {
  loadPrompts,
  renderPrompt,
  callProvider,
  extractAlbum,
  validateAlbum,
  ajvAvailable,
  getBestEverRanking,
  fetchRankingForAlbum,
  consolidateRanking,
  logger
}

// ============================================================================
// Mount Routes
// ============================================================================

// Who may call what (F59): the paid routes answer only to a signed-in person with an account,
// the costly ones to any signed-in person, each with a limit per person. Closed by default.
const { buildGuards } = require('./lib/auth/guards')
const guards = buildGuards(process.env)
app.use('/api/generate', guards.paid)
app.use('/api/ai', guards.paid)
app.use('/api/enrich-album', guards.costly)

// MusicKit routes (Apple Music integration)
const musickitRoutes = require('./routes/musickit')
app.use('/api', musickitRoutes)

// Album routes (generate, enrich-album)
const { router: albumRoutes, initAlbumRoutes } = require('./routes/albums')
initAlbumRoutes(routeDeps)
app.use('/api', albumRoutes)

// Debug routes (list-models, raw-ranking, files, import): off unless turned on by name (F59)
const { debugRoutesEnabled } = require('./lib/debugGate')
if (debugRoutesEnabled(process.env)) {
  const { router: debugRoutes, initDebugRoutes } = require('./routes/debug')
  initDebugRoutes(routeDeps)
  app.use('/api', debugRoutes)
  console.warn('Debug routes are ON (ENABLE_DEBUG_ROUTES=true). Never in production.')
}

// AI Assistant Routes
const aiRoutes = require('./routes/ai')
app.use('/api/ai', aiRoutes)

// Last of all: a route that broke answers 500, with no detail, and the server stays up (F59)
const { errorResponder } = require('./lib/asyncRoute')
app.use(errorResponder(console))

// ============================================================================
// Export for tests
// ============================================================================
module.exports = { fetchRankingForAlbum }

// ============================================================================
// Start Server (only when run directly)
// ============================================================================
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`AI proxy server listening on http://localhost:${PORT}`)
  })
}
