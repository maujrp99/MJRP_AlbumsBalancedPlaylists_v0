const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const AI_API_KEY = process.env.AI_API_KEY;

if (!AI_API_KEY) {
  console.warn('Warning: AI_API_KEY not set. Proxy will return 503 for generate requests.');
}

app.use(cors({ origin: 'http://localhost:8000' }));
app.use(express.json());

// (timestamp middleware already attached above)

// Health
app.get('/_health', (req, res) => res.send({ ok: true }));

// Schema and validation are provided by `server/lib/schema.js` (AJV optional)

const { callProvider } = require('./lib/aiClient');
const { extractAlbum } = require('./lib/normalize');
const { validateAlbum, ajvAvailable } = require('./lib/schema');

// Optional helper: list available models from Google Generative Language
app.get('/api/list-models', async (req, res) => {
  if (!AI_API_KEY) return res.status(503).json({ error: 'AI API key not configured on server' });
  try {
    const listUrl = 'https://generativelanguage.googleapis.com/v1/models?key=' + encodeURIComponent(AI_API_KEY);
    const resp = await axios.get(listUrl, { timeout: 10_000 });
    return res.status(resp.status).json(resp.data);
  } catch (err) {
    console.error('Error listing models:', err?.response?.status, err?.response?.data || err.message || err);
    const status = err.response?.status || 500;
    const data = err.response?.data || { error: 'Could not list models' };
    return res.status(status).json(data);
  }
});

// Proxy endpoint: accepts { albumQuery }
app.post('/api/generate', async (req, res) => {
  if (!AI_API_KEY) return res.status(503).json({ error: 'AI API key not configured on server' });

  const { albumQuery, model, maxTokens } = req.body;
  if (!albumQuery) return res.status(400).json({ error: 'Missing albumQuery in request body' });

  try {
    const response = await callProvider({
      albumQuery,
      model,
      maxTokens,
      aiEndpoint: process.env.AI_ENDPOINT,
      aiApiKey: AI_API_KEY,
      aiModelEnv: process.env.AI_MODEL
    });

    const latencyMs = Date.now() - (req._startTime || Date.now());
    const usedModel = (process.env.AI_MODEL || 'models/gemini-2.5-flash');
    console.log(`AI proxy: model=${usedModel} status=${response.status} latencyMs=${latencyMs}`);

    if (response.data?.usageMetadata) {
      try {
        const u = response.data.usageMetadata;
        console.log(`AI usage: promptTokens=${u.promptTokenCount || '-'} totalTokens=${u.totalTokenCount || '-'} thoughtsTokens=${u.thoughtsTokenCount || '-'} `);
      } catch (e) { /* ignore */ }
    }

    // Normalize
    try {
      const album = extractAlbum(response);
      if (album) {
        if (ajvAvailable && validateAlbum) {
          const ok = validateAlbum(album);
          if (!ok) {
            console.warn('Album validation failed:', validateAlbum.errors);
            return res.status(422).json({ error: 'Validation failed', validationErrors: validateAlbum.errors });
          }
        }
        return res.status(200).json({ data: album });
      }
    } catch (err) {
      console.warn('Normalization attempt failed, forwarding raw provider response', err?.message || err);
    }

    return res.status(response.status).json(response.data);
  } catch (err) {
    console.error('Error proxying to AI provider:', err?.response?.status, err?.response?.data || err.message || err);
    const status = err.response?.status || 500;
    const data = err.response?.data || { error: 'AI provider error' };
    return res.status(status).json(data);
  }
});

// attach a tiny middleware to timestamp requests for latency metrics
app.use((req, res, next) => {
  req._startTime = Date.now();
  next();
});

app.listen(PORT, () => {
  console.log(`AI proxy server listening on http://localhost:${PORT}`);
});
