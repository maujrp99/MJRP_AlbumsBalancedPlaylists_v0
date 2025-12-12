/**
 * Fetch high-quality album covers from MusicBrainz Cover Art Archive
 * 
 * MusicBrainz API: https://musicbrainz.org/doc/MusicBrainz_API
 * Cover Art Archive: https://coverartarchive.org/
 * 
 * Strategy:
 * 1. Search MusicBrainz for release by artist + album
 * 2. Get the release MBID
 * 3. Fetch cover from Cover Art Archive (500px or larger)
 * 4. Update albums-expanded.json with new coverUrl
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

// --- CONFIG ---
const RATE_LIMIT_DELAY = 1100; // MusicBrainz requires 1 request/second
const USER_AGENT = 'MJRP_Playlist_Generator/2.0 (contact@example.com)'; // Required by MB
const COVER_SIZE = '500'; // Options: 250, 500, 1200
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const dataPath = path.join(projectRoot, 'public/assets/data/albums-expanded.json');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// HTTP request helper
function httpGet(url) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            // Handle redirects (Cover Art Archive uses 307)
            if (res.statusCode === 307 || res.statusCode === 302) {
                resolve({ redirect: res.headers.location });
                return;
            }

            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        resolve({ data: JSON.parse(data) });
                    } catch {
                        resolve({ data: data }); // Non-JSON response
                    }
                } else if (res.statusCode === 404) {
                    resolve({ notFound: true });
                } else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

/**
 * Search MusicBrainz for a release
 */
async function searchMusicBrainz(artist, album) {
    const query = encodeURIComponent(`release:"${album}" AND artist:"${artist}"`);
    const url = `https://musicbrainz.org/ws/2/release/?query=${query}&fmt=json&limit=1`;

    try {
        const result = await httpGet(url);
        if (result.data?.releases?.length > 0) {
            return result.data.releases[0];
        }
    } catch (err) {
        console.error(`MB search error: ${err.message}`);
    }
    return null;
}

/**
 * Get cover art URL from Cover Art Archive
 */
async function getCoverArtUrl(mbid) {
    const url = `https://coverartarchive.org/release/${mbid}`;

    try {
        const result = await httpGet(url);

        if (result.notFound) {
            return null;
        }

        if (result.data?.images?.length > 0) {
            // Find front cover
            const frontCover = result.data.images.find(img => img.front) || result.data.images[0];

            // Return the sized image URL
            if (frontCover.thumbnails) {
                // Prefer 500px, fallback to large
                return frontCover.thumbnails[COVER_SIZE] ||
                    frontCover.thumbnails['large'] ||
                    frontCover.image;
            }
            return frontCover.image;
        }
    } catch (err) {
        if (!err.message.includes('404')) {
            console.error(`CAA error: ${err.message}`);
        }
    }
    return null;
}

/**
 * Main function
 */
async function main() {
    console.log('🎨 MusicBrainz Cover Art Fetcher\n');

    // Load existing data
    const albums = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`📊 Total albums: ${albums.length}`);

    // Filter albums that need covers (no coverUrl or low quality Discogs thumb)
    const needsCovers = albums.filter(a => {
        if (!a.coverUrl) return true;
        // Discogs thumbs are typically small, upgrade them
        if (a.coverUrl.includes('discogs.com') && a.coverUrl.includes('rs:fit')) return true;
        return false;
    });

    console.log(`🎯 Albums needing covers: ${needsCovers.length}`);

    if (needsCovers.length === 0) {
        console.log('✅ All albums have covers!');
        return;
    }

    // Process with batching
    let updated = 0;
    let notFound = 0;
    let processed = 0;

    // Create a map for quick updates
    const albumMap = new Map(albums.map(a => [a.id, a]));

    for (const album of needsCovers) {
        processed++;
        process.stdout.write(`[${processed}/${needsCovers.length}] ${album.artist} - ${album.album}... `);

        try {
            // 1. Search MusicBrainz
            const release = await searchMusicBrainz(album.artist, album.album);
            await sleep(RATE_LIMIT_DELAY); // Respect rate limit

            if (!release) {
                console.log('❌ Not found in MB');
                notFound++;
                continue;
            }

            // 2. Get cover art
            const coverUrl = await getCoverArtUrl(release.id);
            await sleep(500); // CAA is more lenient

            if (coverUrl) {
                // Update the album
                const albumToUpdate = albumMap.get(album.id);
                albumToUpdate.coverUrl = coverUrl;
                albumToUpdate.mbid = release.id;
                albumToUpdate.coverSource = 'musicbrainz';
                updated++;
                console.log('✅ Cover found!');
            } else {
                console.log('⚠️ No cover in CAA');
                notFound++;
            }

            // Save periodically
            if (processed % 20 === 0) {
                const sorted = Array.from(albumMap.values()).sort((a, b) =>
                    String(a.id).localeCompare(String(b.id), undefined, { numeric: true })
                );
                fs.writeFileSync(dataPath, JSON.stringify(sorted, null, 2));
                console.log(`   💾 Saved (${updated} covers updated)`);
            }

        } catch (err) {
            console.log(`⚠️ Error: ${err.message}`);
            if (err.message.includes('503') || err.message.includes('rate')) {
                console.log('⏳ Rate limited, waiting 60s...');
                await sleep(60000);
            }
        }
    }

    // Final save
    const sorted = Array.from(albumMap.values()).sort((a, b) =>
        String(a.id).localeCompare(String(b.id), undefined, { numeric: true })
    );
    fs.writeFileSync(dataPath, JSON.stringify(sorted, null, 2));

    console.log(`\n✨ Complete!`);
    console.log(`   📊 Processed: ${processed}`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ❌ Not Found: ${notFound}`);
}

main().catch(console.error);
