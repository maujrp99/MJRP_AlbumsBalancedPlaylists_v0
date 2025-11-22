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

// Health
app.get('/_health', (req, res) => res.send({ ok: true }));

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
    // Use the configured endpoint (the user indicated this is the Gemini API)
    const aiUrl = process.env.AI_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5:generateContent';

    // If the endpoint looks like Google's Generative Language, construct the
    // payload similar to the client previously used (generateContent style).
    let requestUrl = aiUrl;
    let axiosConfig = { timeout: 30_000 };
    let payload;

    if (aiUrl.includes('generativelanguage.googleapis.com')) {
      // Prefer the explicit flash model unless overridden
      const modelName = process.env.AI_MODEL || 'models/gemini-2.5-flash';
      requestUrl = `https://generativelanguage.googleapis.com/v1/${modelName}:generateContent?key=${encodeURIComponent(AI_API_KEY)}`;

      const prompt = `Sua tarefa é retornar os metadados de um álbum de música.\nInput: "${albumQuery}"\nRetorne apenas JSON válido com campos: id, artist, title, year, cover, tracks (cada track com id, rank, title, duration em segundos).`;

      payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: maxTokens || 8192
        }
      };

      axiosConfig.headers = { 'Content-Type': 'application/json' };
    } else {
      // Generic provider: send a simple prompt-based payload and use Bearer token
      requestUrl = aiUrl;
      payload = {
        prompt: `Extract album data for: ${albumQuery}`,
        model: model || process.env.AI_MODEL || 'default-model',
        max_tokens: maxTokens || 800
      };
      axiosConfig.headers = {
        'Authorization': `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json'
      };
    }

    const response = await axios.post(requestUrl, payload, axiosConfig);

    // Metrics: latency and token usage
    const latencyMs = Date.now() - req._startTime;
    const usedModel = (process.env.AI_MODEL || 'models/gemini-2.5-flash');
    console.log(`AI proxy: model=${usedModel} status=${response.status} latencyMs=${latencyMs}`);
    if (response.data?.usageMetadata) {
      try {
        const u = response.data.usageMetadata;
        console.log(`AI usage: promptTokens=${u.promptTokenCount || '-'} totalTokens=${u.totalTokenCount || '-'} thoughtsTokens=${u.thoughtsTokenCount || '-'} `);
      } catch (e) { /* ignore */ }
    }

    // Try to normalize the provider response to return a single album object
    try {
      // Case A: Google Gemini shape: candidates[0].content.parts[0].text (stringified JSON)
      const candidateText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (candidateText && typeof candidateText === 'string') {
        // Sometimes providers wrap JSON in markdown fences (```json ... ```)
        // or include extra commentary. Try several strategies to recover a JSON blob.
        let cleaned = candidateText;
        // Remove common triple-backtick fences and language hints
        cleaned = cleaned.replace(/```\w*\n?/g, '');
        cleaned = cleaned.replace(/```$/g, '');

        // Try direct parse first
        try {
          const parsed = JSON.parse(cleaned);
          if (parsed && typeof parsed === 'object' && Array.isArray(parsed.tracks)) {
            return res.status(200).json({ data: parsed });
          }
        } catch (e) {
          // Not directly valid JSON — attempt to extract first JSON object substring
          const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const parsed2 = JSON.parse(jsonMatch[0]);
              if (parsed2 && typeof parsed2 === 'object' && Array.isArray(parsed2.tracks)) {
                return res.status(200).json({ data: parsed2 });
              }
            } catch (e2) {
              console.warn('Could not parse extracted JSON from candidate text:', e2.message);
            }
          } else {
            console.warn('No JSON object found inside candidate text.');
          }
        }
      }

      // Case B: provider returned parsed object directly in response.data or response.data.data
      if (response.data?.data && typeof response.data.data === 'object') {
        return res.status(200).json({ data: response.data.data });
      }

      if (response.data && typeof response.data === 'object' && response.data.tracks) {
        return res.status(200).json({ data: response.data });
      }

    } catch (err) {
      console.warn('Normalization attempt failed, forwarding raw provider response', err?.message || err);
    }

    // Fallback: pass through AI provider response
    return res.status(response.status).json(response.data);
  } catch (err) {
    // Log full error for debugging
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
