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
        // Be explicit about wanting the COMPLETE discography
        const prompt = `List ALL original studio albums from the complete discography of ${artistName} . Exclude compilations, EPs, singles, DJ mixes, live albums, and remix albums. Reply ONLY with a valid JSON array of album title strings in chronological order. Do not include any other text. Example format: ["Album 1", "Album 2"]`

        console.log(`[AI] Fetching studio albums for: ${artistName}`)
        console.log(`[AI] Prompt: ${prompt}`)

        const response = await callProvider({
            prompt,
            maxTokens: 10000, // Increased to prevent truncation for large discographies
            aiApiKey: process.env.AI_API_KEY
        })

        // Parse the response
        let text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]'

        console.log(`[AI] Raw Gemini response: ${text}`)

        // Clean up code blocks if present (handle ```json, ```, and potential whitespace)
        text = text.replace(/```json/g, '').replace(/```/g, '').trim()

        let albums = []
        try {
            albums = JSON.parse(text)
        } catch (parseErr) {
            console.error('[AI] Failed to parse JSON response:', parseErr.message)

            // Fallback: Robust Regex Extraction
            // Finds all strings inside double quotes that are likely array elements
            // This handles newlines, missing commas, or other JSON formatting errors
            const matches = text.match(/"([^"]+)"/g)
            if (matches) {
                albums = matches.map(m => m.replace(/^"|"$/g, '').trim())
            }
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
