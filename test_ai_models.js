
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, 'server/.env') });

const apiKey = process.env.AI_API_KEY;

const configs = [
    { name: 'Gemini 3 Flash (No Tools)', model: 'models/gemini-3-flash-preview', tools: [] },
    { name: 'Gemini 3 Flash (Search)', model: 'models/gemini-3-flash-preview', tools: [{ googleSearch: {} }] },
    { name: 'Gemini 2.5 Flash (No Tools)', model: 'models/gemini-2.5-flash', tools: [] },
    { name: 'Gemini 2.5 Flash (Search)', model: 'models/gemini-2.5-flash', tools: [{ googleSearch: {} }] }
];

async function testConfig(config) {
    console.log(`\n--- Testing ${config.name} ---`);
    const url = `https://generativelanguage.googleapis.com/v1beta/${config.model}:generateContent?key=${apiKey}`;

    // Prompt matching server/routes/ai.js
    const prompt = `List ALL original studio albums from the complete discography of ferry corsten. Exclude compilations, EPs, singles, DJ mixes, live albums, and remix albums. Reply ONLY with a valid JSON array of album title strings in chronological order. Do not include any other text. Example format: ["Album 1", "Album 2"]`

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1 }
    };

    if (config.tools.length > 0) {
        payload.tools = config.tools;
    }

    try {
        const response = await axios.post(url, payload);

        let text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Clean markdown
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        console.log(`Status: ${response.status}`);
        const hasConnect = text.includes('Connect');
        console.log(`Has 'Connect'? ${hasConnect ? 'YES' : 'NO'}`);
        if (hasConnect) console.log("Success!");

    } catch (err) {
        console.error(`Error: ${err.message}`);
        if (err.response) {
            console.error(`API Status: ${err.response.status}`);
            if (err.response.data.error) {
                console.error(`Reason: ${err.response.data.error.message}`);
            }
        }
    }
}

async function run() {
    for (const config of configs) {
        await testConfig(config);
    }
}

run();
