const { loadPrompts, renderPrompt } = require('../lib/prompts')
const { callProvider } = require('../lib/aiClient')
const { extractRankingEntries, cleanFencedMarkdown, tryParseJson } = require('../lib/normalize')

async function attempt() {
  const prompts = loadPrompts()
  const rankingProviders = Array.isArray(prompts.defaultRankingProviders) ? prompts.defaultRankingProviders.join(', ') : ''
  const context = { albumTitle: 'Led Zeppelin IV', albumArtist: 'Led Zeppelin', albumYear: '1971', albumQuery: 'Led Zeppelin Led Zeppelin IV', rankingProviders }
  const template = prompts.rankingPrompt
  const prompt = renderPrompt(template, context)
  for (let i = 0; i < 6; i++) {
    console.log(`\n--- Attempt ${i + 1}`)
    try {
      const resp = await callProvider({ prompt, maxTokens: 4096, aiEndpoint: process.env.AI_ENDPOINT, aiApiKey: process.env.AI_API_KEY, aiModelEnv: process.env.AI_MODEL })
      const cand = resp?.data?.candidates?.[0]
      if (cand && cand.content && cand.content.parts && cand.content.parts[0] && cand.content.parts[0].text) {
        const raw = cand.content.parts[0].text
        console.log('Found candidate text (length):', raw.length)
        const cleaned = cleanFencedMarkdown(raw)
        console.log('Cleaned preview:', cleaned.slice(0, 400))
        const parsed = tryParseJson(cleaned)
        if (parsed) console.log('Parsed top-level keys:', Object.keys(parsed))
        const entries = extractRankingEntries(resp)
        console.log('Extracted entries count:', entries.length)
        console.log(JSON.stringify(entries.slice(0,5), null, 2))
        // Consolidate using Borda
        try {
          const { consolidateRanking } = require('../lib/ranking')
          const tracks = new Array(8).fill(0).map((_,i)=>({ id: 't'+(i+1), rank: i+1 }))
          const consolidated = consolidateRanking(tracks, entries)
          console.log('=== Consolidated ranking (top 10) ===')
          console.log(JSON.stringify(consolidated.slice(0,10), null, 2))
        } catch (e) {
          console.error('Consolidation error:', e && e.message)
        }
        return
      } else {
        console.log('No candidate text in response, finishReason=', cand && cand.finishReason)
      }
    } catch (e) {
      console.error('call error:', e && e.message)
    }
    await new Promise(r => setTimeout(r, 1200))
  }
  console.log('No valid candidate text found after attempts.')
}

attempt()
