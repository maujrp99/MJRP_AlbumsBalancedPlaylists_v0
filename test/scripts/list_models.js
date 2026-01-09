
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, 'server/.env') });

const apiKey = process.env.AI_API_KEY;

async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    try {
        const response = await axios.get(url);
        const models = response.data.models;
        // Print ONLY the names to avoid truncation
        console.log("Available Gemini Models:");
        models.filter(m => m.name.includes('gemini')).forEach(m => console.log(m.name));
    } catch (err) {
        console.error(err.message);
    }
}
listModels();
