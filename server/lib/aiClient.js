
const axios = require('axios')

const DEFAULT_PROMPT = 'Sua tarefa é retornar os metadados de um álbum de música. Input: "{{albumQuery}}". Retorne apenas JSON válido com campos: id, artist, title, year, cover, tracks (cada track com id, rank, title, duration em segundos).'

async function callProvider({ prompt, albumQuery, model, maxTokens, aiEndpoint, aiApiKey, aiModelEnv }) {
  const aiUrl = aiEndpoint || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

  let requestUrl = aiUrl
  const axiosConfig = { timeout: 60_000 }
  let payload

  if (aiUrl.includes('generativelanguage.googleapis.com')) {
    // Default to Gemini 2.5 Flash if not specified
    const modelName = aiModelEnv || 'models/gemini-2.5-flash'

    // Check if we already have the full URL with model, otherwise construct it
    if (!aiUrl.includes(modelName) && !aiUrl.includes(':generateContent')) {
      requestUrl = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${encodeURIComponent(aiApiKey)}`
    } else {
      // Existing logic or fallback
      requestUrl = `${aiUrl}?key=${encodeURIComponent(aiApiKey)}`
    }

    const promptText = (prompt && typeof prompt === 'string')
      ? prompt
      : DEFAULT_PROMPT.replace('{{albumQuery}}', albumQuery || '')

    payload = {
      contents: [{ parts: [{ text: promptText }] }],
      // Use Google Search Grounding to ensure fresh data (Connect 2024, etc.)
      tools: [{ google_search: {} }],
      generationConfig: { maxOutputTokens: maxTokens || 16384, temperature: 0.1 }
    }

    axiosConfig.headers = { 'Content-Type': 'application/json' }
  } else {
    // Legacy / Proxy path
    requestUrl = aiUrl
    payload = {
      prompt: prompt || `Extract album data for: ${albumQuery}`,
      model: model || aiModelEnv || 'default-model',
      max_tokens: maxTokens || 2000
    }
    axiosConfig.headers = {
      Authorization: `Bearer ${aiApiKey}`,
      'Content-Type': 'application/json'
    }
  }

  // perform request
  const response = await axios.post(requestUrl, payload, axiosConfig)
  return response
}

module.exports = { callProvider }
