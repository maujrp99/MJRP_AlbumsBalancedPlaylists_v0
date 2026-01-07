
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, 'server/.env') });

const apiKey = process.env.AI_API_KEY;
const model = 'models/gemini-1.5-flash'; // Testing with prefix

async function test() {
    console.log(`Testing ${model}...`);
    const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`;

    try {
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: "Hi" }] }]
        });
        console.log("Success! Status:", response.status);
    } catch (err) {
        console.error("Error:", err.message);
        if (err.response) console.error(JSON.stringify(err.response.data, null, 2));
    }
}

test();
