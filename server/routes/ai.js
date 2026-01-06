const express = require('express')
const router = express.Router()
const { callProvider } = require('../lib/aiClient')

// POST /api/ai/studio-albums
// Body: { artistName: string }
router.post('/studio-albums', async (req, res) => {
    try {
        const { artistName } = req.body

        if (!artistName) {
            return res.status(400).json({ error: 'Artist name is required' })
        }

        // Prompt engineered for strict JSON output of Studio Albums only
        // Be explicit about wanting the COMPLETE discography including aliases (e.g., System F for Ferry Corsten)
        const prompt = `List ALL original studio albums from the complete discography of ${artistName}, including any work under aliases or side projects. Exclude compilations, EPs, singles, DJ mixes, live albums, and remix albums. Reply ONLY with a valid JSON array of album title strings in chronological order. Do not include any other text. Example format: ["Album 1", "Album 2"]`

        console.log(`[AI] Fetching studio albums for: ${artistName}`)
        console.log(`[AI] Prompt: ${prompt}`)

        const response = await callProvider({
            prompt,
            maxTokens: 2000, // Increased for longer lists
            aiApiKey: process.env.AI_API_KEY
        })

        // Parse the response
        // Gemini often wraps JSON in markdown code blocks like ```json ... ```
        let text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]'

        console.log(`[AI] Raw Gemini response: ${text}`)

        // Clean up code blocks if present
        text = text.replace(/```json/g, '').replace(/```/g, '').trim()

        let albums = []
        try {
            albums = JSON.parse(text)
        } catch (parseErr) {
            console.error('[AI] Failed to parse JSON response:', text)
            // Fallback: try to split by newlines if JSON fails
            albums = text.split('\n').filter(line => line.length > 2).map(l => l.replace(/^- /, '').replace(/^\d+\.\s*/, '').trim())
        }

        if (!Array.isArray(albums)) {
            albums = []
        }

        console.log(`[AI] Found ${albums.length} albums for ${artistName}:`, albums)
        res.json({ albums })

    } catch (error) {
        console.error('[AI] Studio Albums Route Error:', error.message)
        if (error.response) {
            console.error('[AI] Response Status:', error.response.status)
            console.error('[AI] Response Data:', JSON.stringify(error.response.data, null, 2))
        }
        // Return empty array on error so frontend can fallback gracefully
        res.json({ albums: [], error: error.message })
    }
})

module.exports = router
