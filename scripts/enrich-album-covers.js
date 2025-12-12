/**
 * Enrich Album Covers from Apple Music
 * 
 * This script searches Apple Music for each album in our dataset
 * and updates the artwork template URL for HD cover display.
 * 
 * Usage: node scripts/enrich-album-covers.js [--limit N] [--artist "Name"]
 * 
 * Options:
 *   --limit N        Process only first N albums
 *   --artist "Name"  Process only albums from specific artist
 *   --resume         Resume from last saved position
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import https from 'https';

// Create require for CommonJS modules (jsonwebtoken)
const require = createRequire(import.meta.url);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const dataPath = path.join(projectRoot, 'public/assets/data/albums-expanded.json');
const progressPath = path.join(projectRoot, 'scripts/enrichment-progress.json');

// Apple Music API config
const APPLE_MUSIC_STOREFRONT = 'us'; // or 'br' for Brazil
const RATE_LIMIT_DELAY = 300; // ms between requests (Apple is more lenient than Discogs)
const BATCH_SAVE_INTERVAL = 50; // Save progress every N albums

// Load environment from server/.env using dotenv (handles multiline values correctly)
const dotenv = require('dotenv');
const envPath = path.join(projectRoot, 'server/.env');
dotenv.config({ path: envPath });

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generate MusicKit developer token
 */
function generateToken() {
    // Dynamic import for ES module compatibility
    const jwt = require('jsonwebtoken');

    const teamId = process.env.APPLE_TEAM_ID;
    const keyId = process.env.APPLE_KEY_ID;
    let privateKey = process.env.APPLE_MUSIC_PRIVATE_KEY;

    if (!teamId || !keyId || !privateKey) {
        throw new Error('Missing Apple Music credentials in server/.env');
    }

    // Ensure PEM format
    if (!privateKey.includes('-----BEGIN')) {
        privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
    }

    // Handle escaped newlines
    privateKey = privateKey.replace(/\\n/g, '\n');

    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: teamId,
        iat: now,
        exp: now + (180 * 24 * 60 * 60) // 180 days
    };

    return jwt.sign(payload, privateKey, {
        algorithm: 'ES256',
        keyid: keyId
    });
}

/**
 * HTTP request to Apple Music API
 */
function appleRequest(path, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.music.apple.com',
            path: path,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error('Invalid JSON response'));
                    }
                } else if (res.statusCode === 429) {
                    reject(new Error('RATE_LIMIT'));
                } else if (res.statusCode === 404) {
                    resolve(null); // Not found
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        req.end();
    });
}

/**
 * Search Apple Music for an album
 */
async function searchAlbum(artist, album, token) {
    const query = encodeURIComponent(`${artist} ${album}`);
    const path = `/v1/catalog/${APPLE_MUSIC_STOREFRONT}/search?term=${query}&types=albums&limit=5`;

    const result = await appleRequest(path, token);
    if (!result?.results?.albums?.data?.length) {
        return null;
    }

    // Find best match (first result usually good enough)
    const albums = result.results.albums.data;

    // Try to find exact artist match
    const exactMatch = albums.find(a =>
        a.attributes.artistName.toLowerCase() === artist.toLowerCase()
    );

    return exactMatch || albums[0];
}

/**
 * Extract artwork template from Apple Music album
 */
function extractArtworkTemplate(album) {
    if (!album?.attributes?.artwork?.url) {
        return null;
    }

    // Apple artwork URL has {w} and {h} placeholders
    // Example: https://is1-ssl.mzstatic.com/image/thumb/.../540x540bb.jpg
    // We want to keep the template format for dynamic sizing
    let url = album.attributes.artwork.url;

    // Replace fixed size with placeholders if needed
    url = url.replace(/\d+x\d+bb\.jpg/, '{w}x{h}bb.jpg');

    return url;
}

/**
 * Main enrichment function
 */
async function main() {
    console.log('🎨 Apple Music Cover Enrichment\n');

    // Parse CLI args
    const args = process.argv.slice(2);
    let limit = Infinity;
    let artistFilter = null;
    let resume = false;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--limit' && args[i + 1]) {
            limit = parseInt(args[i + 1]);
        }
        if (args[i] === '--artist' && args[i + 1]) {
            artistFilter = args[i + 1];
        }
        if (args[i] === '--resume') {
            resume = true;
        }
    }

    // Generate token
    console.log('🔑 Generating MusicKit token...');
    let token;
    try {
        token = generateToken();
        console.log('✅ Token generated\n');
    } catch (err) {
        console.error('❌ Token generation failed:', err.message);
        process.exit(1);
    }

    // Load album data
    const albums = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`📊 Total albums in dataset: ${albums.length}`);

    // Filter albums that need enrichment
    let toProcess = albums.filter(a => {
        // Skip if already has Apple artwork
        if (a.artworkTemplate && a.artworkTemplate.includes('mzstatic.com')) {
            return false;
        }
        // Apply artist filter if specified
        if (artistFilter && a.artist?.toLowerCase() !== artistFilter.toLowerCase()) {
            return false;
        }
        return true;
    });

    // Apply limit
    if (limit < toProcess.length) {
        toProcess = toProcess.slice(0, limit);
    }

    console.log(`🎯 Albums to enrich: ${toProcess.length}`);

    if (toProcess.length === 0) {
        console.log('✅ All albums already have artwork!');
        return;
    }

    // Resume from progress if available
    let startIndex = 0;
    if (resume && fs.existsSync(progressPath)) {
        const progress = JSON.parse(fs.readFileSync(progressPath, 'utf8'));
        startIndex = progress.lastIndex || 0;
        console.log(`📍 Resuming from index ${startIndex}`);
    }

    // Create a map for quick lookups
    const albumMap = new Map(albums.map(a => [`${a.artist}|||${a.album}`, a]));

    // Stats
    let enriched = 0;
    let notFound = 0;
    let errors = 0;

    // Process albums
    for (let i = startIndex; i < toProcess.length; i++) {
        const album = toProcess[i];
        const key = `${album.artist}|||${album.album}`;

        process.stdout.write(`[${i + 1}/${toProcess.length}] ${album.artist} - ${album.album}... `);

        try {
            const result = await searchAlbum(album.artist, album.album, token);

            if (result) {
                const artworkTemplate = extractArtworkTemplate(result);

                if (artworkTemplate) {
                    const originalAlbum = albumMap.get(key);
                    if (originalAlbum) {
                        originalAlbum.artworkTemplate = artworkTemplate;
                        originalAlbum.appleMusicId = result.id;
                        originalAlbum.appleMusicArtist = result.attributes.artistName;
                        originalAlbum.appleMusicAlbum = result.attributes.name;
                    }
                    enriched++;
                    console.log('✅');
                } else {
                    notFound++;
                    console.log('⚠️ No artwork');
                }
            } else {
                notFound++;
                console.log('❌ Not found');
            }

            await sleep(RATE_LIMIT_DELAY);

        } catch (err) {
            if (err.message === 'RATE_LIMIT') {
                console.log('⏳ Rate limited, waiting 60s...');
                await sleep(60000);
                i--; // Retry this album
            } else {
                console.log(`⚠️ Error: ${err.message}`);
                errors++;
            }
        }

        // Save progress periodically
        if ((i + 1) % BATCH_SAVE_INTERVAL === 0) {
            const sorted = Array.from(albumMap.values());
            fs.writeFileSync(dataPath, JSON.stringify(sorted, null, 2));
            fs.writeFileSync(progressPath, JSON.stringify({ lastIndex: i + 1, timestamp: new Date().toISOString() }));
            console.log(`   💾 Saved progress (${enriched} enriched)`);
        }
    }

    // Final save
    const sorted = Array.from(albumMap.values());
    fs.writeFileSync(dataPath, JSON.stringify(sorted, null, 2));

    // Clean up progress file
    if (fs.existsSync(progressPath)) {
        fs.unlinkSync(progressPath);
    }

    console.log(`\n✨ Enrichment complete!`);
    console.log(`   📊 Processed: ${toProcess.length}`);
    console.log(`   ✅ Enriched: ${enriched}`);
    console.log(`   ❌ Not found: ${notFound}`);
    console.log(`   ⚠️ Errors: ${errors}`);
}

main().catch(console.error);
