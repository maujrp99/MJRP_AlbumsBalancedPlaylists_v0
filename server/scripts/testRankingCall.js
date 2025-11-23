const { loadPrompts, renderPrompt } = require('../lib/prompts')
const { callProvider } = require('../lib/aiClient')
const { extractRankingEntries } = require('../lib/normalize')

async function run() {
  const prompts = loadPrompts()
  const rankingProviders = Array.isArray(prompts.defaultRankingProviders)
    ? prompts.defaultRankingProviders.join(', ')
    : ''
  const context = {
    albumTitle: 'Led Zeppelin IV',
    albumArtist: 'Led Zeppelin',
    albumYear: '1971',
    albumQuery: 'Led Zeppelin Led Zeppelin IV',
    rankingProviders
  }
  const template = prompts.rankingPrompt
  const prompt = renderPrompt(template, context)
  console.log('=== Rendered Prompt ===')
  console.log(prompt)
  console.log('=== Calling AI provider ===')
  try {
    const resp = await callProvider({
      prompt,
      maxTokens: 4096,
      aiEndpoint: process.env.AI_ENDPOINT,
      aiApiKey: process.env.AI_API_KEY,
      aiModelEnv: process.env.AI_MODEL
    })
    console.log('=== Raw provider response object ===')
    console.log(JSON.stringify(resp.data || resp, null, 2))
      const { extractRankingEntries, tryParseJson: _tryParseJson, cleanFencedMarkdown: _clean } = require('../lib/normalize')
      const candidateText = resp?.data?.candidates?.[0]?.content?.parts?.[0]?.text
      console.log('=== Candidate raw text (first 1000 chars) ===')
      console.log(candidateText ? candidateText.slice(0, 1000) : '(none)')
      const cleaned = candidateText ? _clean(candidateText) : null
      console.log('=== Cleaned candidate text (first 1000 chars) ===')
      console.log(cleaned ? cleaned.slice(0, 1000) : '(none)')
      if (cleaned) {
        console.log('=== tryParseJson result ===')
        try {
          console.log(JSON.stringify(_tryParseJson(cleaned)))
        } catch (e) {
          console.log('parse threw', e && e.message)
        }
      }
      const entries = extractRankingEntries(resp)
      console.log('=== Extracted ranking entries ===')
      console.log(JSON.stringify(entries, null, 2))
  } catch (err) {
    console.error('Error calling provider:', err && err.message)
    if (err && err.response && err.response.data) console.error('Provider body:', JSON.stringify(err.response.data, null, 2))
  }
}

run()
