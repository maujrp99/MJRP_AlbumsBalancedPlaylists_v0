const axios = require('axios')

const DEFAULT_PROMPT = 'Sua tarefa é retornar os metadados de um álbum de música. Input: "{{albumQuery}}". Retorne apenas JSON válido com campos: id, artist, title, year, cover, tracks (cada track com id, rank, title, duration em segundos).'

async function callProvider({ prompt, albumQuery, model, maxTokens, aiEndpoint, aiApiKey, aiModelEnv }) {
  const aiUrl = aiEndpoint || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5:generateContent'

  let requestUrl = aiUrl
  const axiosConfig = { timeout: 60_000 }
  let payload

  if (aiUrl.includes('generativelanguage.googleapis.com')) {
    const modelName = aiModelEnv || 'models/gemini-3-flash-preview'
    requestUrl = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${encodeURIComponent(aiApiKey)}`

    const promptText = (prompt && typeof prompt === 'string')
      ? prompt
      : DEFAULT_PROMPT.replace('{{albumQuery}}', albumQuery || '')

    payload = {
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: { maxOutputTokens: maxTokens || 16384, temperature: 0.0 }
    }

    axiosConfig.headers = { 'Content-Type': 'application/json' }
  } else {
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
