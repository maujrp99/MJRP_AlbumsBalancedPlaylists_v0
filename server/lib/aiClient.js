const axios = require('axios')

async function callProvider ({ albumQuery, model, maxTokens, aiEndpoint, aiApiKey, aiModelEnv }) {
  const aiUrl = aiEndpoint || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5:generateContent'

  let requestUrl = aiUrl
  const axiosConfig = { timeout: 30_000 }
  let payload

  if (aiUrl.includes('generativelanguage.googleapis.com')) {
    const modelName = aiModelEnv || 'models/gemini-2.5-flash'
    requestUrl = `https://generativelanguage.googleapis.com/v1/${modelName}:generateContent?key=${encodeURIComponent(aiApiKey)}`

    const prompt = `Sua tarefa é retornar os metadados de um álbum de música.\nInput: "${albumQuery}"\nRetorne apenas JSON válido com campos: id, artist, title, year, cover, tracks (cada track com id, rank, title, duration em segundos).`

    payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens || 8192 }
    }

    axiosConfig.headers = { 'Content-Type': 'application/json' }
  } else {
    requestUrl = aiUrl
    payload = {
      prompt: `Extract album data for: ${albumQuery}`,
      model: model || aiModelEnv || 'default-model',
      max_tokens: maxTokens || 800
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
