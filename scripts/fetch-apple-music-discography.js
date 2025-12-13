/**
 * Fetch discographies from Apple Music API
 * - Only studio albums and live albums (no singles, no compilations)
 * - Reads from docs/ARTIST_LIST.txt
 * - Outputs to public/assets/data/albums-curated.json
 * 
 * Usage: node scripts/fetch-apple-music-discography.js [--start 0] [--count 500]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import dotenv from 'dotenv';

const require = createRequire(import.meta.url);
const jwt = require('jsonwebtoken');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Load environment variables
dotenv.config({ path: path.join(projectRoot, 'server/.env') });

const TEAM_ID = process.env.APPLE_TEAM_ID;
const KEY_ID = process.env.APPLE_KEY_ID;
const PRIVATE_KEY = process.env.APPLE_MUSIC_PRIVATE_KEY;

if (!TEAM_ID || !KEY_ID || !PRIVATE_KEY) {
    console.error('❌ Missing Apple Music credentials in server/.env');
    process.exit(1);
}

// Parse args
const args = process.argv.slice(2);
const startIndex = parseInt(args.find((_, i) => args[i - 1] === '--start') || '0');
const count = parseInt(args.find((_, i) => args[i - 1] === '--count') || '500');

// Generate token
function generateToken() {
    return jwt.sign({}, PRIVATE_KEY, {
        algorithm: 'ES256',
        expiresIn: '1h',
        issuer: TEAM_ID,
        header: { alg: 'ES256', kid: KEY_ID }
    });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Search for artist by name
async function searchArtist(name, token) {
    const query = encodeURIComponent(name);
    const url = `https://api.music.apple.com/v1/catalog/us/search?term=${query}&types=artists&limit=5`;

    const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
        if (res.status === 429) {
            console.log('   ⏳ Rate limited, waiting 60s...');
            await sleep(60000);
            return searchArtist(name, token);
        }
        return null;
    }

    const data = await res.json();
    const artists = data.results?.artists?.data || [];

    // Find best match
    const normalize = str => str?.toLowerCase().trim().replace(/[^\w\s]/g, '') || '';
    const targetName = normalize(name);

    for (const artist of artists) {
        if (normalize(artist.attributes?.name) === targetName) {
            return { id: artist.id, name: artist.attributes.name };
        }
    }

    // Return first result if no exact match
    return artists[0] ? { id: artists[0].id, name: artists[0].attributes?.name } : null;
}

// Get albums for an artist
async function getArtistAlbums(artistId, token) {
    const albums = [];
    let url = `https://api.music.apple.com/v1/catalog/us/artists/${artistId}/albums?limit=100`;

    while (url) {
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            if (res.status === 429) {
                console.log('   ⏳ Rate limited, waiting 60s...');
                await sleep(60000);
                continue;
            }
            break;
        }

        const data = await res.json();
        const items = data.data || [];

        for (const album of items) {
            const attrs = album.attributes;

            // Skip singles and compilations (keep studio and live)
            if (attrs.isSingle) continue;
            if (attrs.isCompilation) continue;

            albums.push({
                appleMusicId: album.id,
                artist: attrs.artistName,
                album: attrs.name,
                year: attrs.releaseDate?.split('-')[0] || 'Unknown',
                isLive: attrs.isLive || false,
                trackCount: attrs.trackCount,
                artworkTemplate: attrs.artwork?.url?.replace('{w}x{h}', '{w}x{h}') || null,
                genres: attrs.genreNames || [],
                releaseDate: attrs.releaseDate
            });
        }

        url = data.next ? `https://api.music.apple.com${data.next}` : null;
        if (url) await sleep(200);
    }

    return albums;
}

async function main() {
    console.log('🎵 Apple Music Discography Fetcher');
    console.log('===================================\n');

    // Read artist list - use batch file if it exists
    const batchFile = path.join(projectRoot, 'docs/ARTIST_LIST - 3rd290batch.txt');
    const mainFile = path.join(projectRoot, 'docs/ARTIST_LIST.txt');
    const artistListPath = fs.existsSync(batchFile) ? batchFile : mainFile;
    const allArtists = fs.readFileSync(artistListPath, 'utf8')
        .split('\n')
        .map(a => a.trim())
        .filter(a => a.length > 0);

    // Get batch
    const artists = allArtists.slice(startIndex, startIndex + count);

    console.log(`📋 Total artists in list: ${allArtists.length}`);
    console.log(`🎯 Processing: ${startIndex} to ${startIndex + artists.length - 1}`);
    console.log(`📊 Batch size: ${artists.length} artists\n`);

    // Load existing data or start fresh
    const outputPath = path.join(projectRoot, 'public/assets/data/albums-curated.json');
    let existingData = [];
    try {
        existingData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
        console.log(`📂 Loaded ${existingData.length} existing albums\n`);
    } catch {
        console.log('📂 Starting fresh (no existing data)\n');
    }

    // Track processed artists to avoid duplicates
    const processedArtists = new Set(existingData.map(a => a.artist.toLowerCase()));

    const token = generateToken();
    let totalAlbums = existingData.length;
    let artistsProcessed = 0;
    let artistsSkipped = 0;
    let artistsNotFound = 0;

    for (let i = 0; i < artists.length; i++) {
        const artistName = artists[i];

        // Skip if already processed
        if (processedArtists.has(artistName.toLowerCase())) {
            console.log(`[${startIndex + i + 1}/${startIndex + artists.length}] ${artistName}... ⏭️ Already processed`);
            artistsSkipped++;
            continue;
        }

        process.stdout.write(`[${startIndex + i + 1}/${startIndex + artists.length}] ${artistName}... `);

        try {
            // Search for artist
            const artist = await searchArtist(artistName, token);

            if (!artist) {
                console.log('❌ Not found');
                artistsNotFound++;
                continue;
            }

            // Get albums
            const albums = await getArtistAlbums(artist.id, token);

            if (albums.length === 0) {
                console.log('⚠️ No albums');
                continue;
            }

            // Add to data
            existingData.push(...albums);
            processedArtists.add(artistName.toLowerCase());
            totalAlbums += albums.length;
            artistsProcessed++;

            const studioCount = albums.filter(a => !a.isLive).length;
            const liveCount = albums.filter(a => a.isLive).length;
            console.log(`✅ +${albums.length} (${studioCount} studio, ${liveCount} live)`);

            // Save every 10 artists
            if ((i + 1) % 10 === 0) {
                fs.writeFileSync(outputPath, JSON.stringify(existingData, null, 2));
                console.log(`   💾 Saved (${totalAlbums} total albums)`);
            }

            await sleep(300); // Rate limiting

        } catch (err) {
            console.log(`⚠️ Error: ${err.message}`);
        }
    }

    // Final save
    fs.writeFileSync(outputPath, JSON.stringify(existingData, null, 2));

    console.log('\n===================================');
    console.log(`✅ Artists processed: ${artistsProcessed}`);
    console.log(`⏭️ Artists skipped: ${artistsSkipped}`);
    console.log(`❌ Artists not found: ${artistsNotFound}`);
    console.log(`📊 Total albums: ${totalAlbums}`);
    console.log(`💾 Saved to: ${outputPath}`);
    console.log('\nNext batch: node scripts/fetch-apple-music-discography.js --start ' + (startIndex + count) + ' --count 500');
}

main().catch(console.error);
