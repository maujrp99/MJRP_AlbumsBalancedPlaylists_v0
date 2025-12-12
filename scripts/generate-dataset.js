
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

// --- CONFIG ---
const DISCOGS_TOKEN = 'jVSQubYMicSFMVsgPsLzQnnSZFCZWuzYsMyyBzGd';
const RATE_LIMIT_DELAY = 1200; // 1.2s delay => ~50 req/min (Safe side of 60)
const INPUT_CSV = 'public/assets/data/albums.csv';
const OUTPUT_JSON = 'public/assets/data/albums-expanded.json';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve paths relative to project root
const projectRoot = path.join(__dirname, '..');
const inputPath = path.join(projectRoot, INPUT_CSV);
const outputPath = path.join(projectRoot, OUTPUT_JSON);

// --- UTILS ---

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Simple CSV Parser (reused logic)
function parseCSV(text) {
    const lines = text.split('\n');
    const result = [];
    // Skip header
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple regex split for quotes
        const parts = splitCSVLine(line);
        if (parts.length >= 5) {
            result.push({
                id: parts[0], // Keep original ID/Rank (i)
                place: parts[1],
                artist: parts[2].replace(/^"|"$/g, '').trim(),
                album: parts[3].replace(/^"|"$/g, '').trim(),
                year: parts[4].replace(/^"|"$/g, '').trim()
            });
        }
    }
    return result;
}

function splitCSVLine(str) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

// Discogs API Fetcher
function searchDiscogs(artist, album) {
    return new Promise((resolve, reject) => {
        const query = `release_title=${encodeURIComponent(album)}&artist=${encodeURIComponent(artist)}&type=master`; // Search for Master release first
        const options = {
            hostname: 'api.discogs.com',
            path: `/database/search?${query}&per_page=1`,
            method: 'GET',
            headers: {
                'User-Agent': 'MJRP_Playlist_Generator/2.0',
                'Authorization': `Discogs token=${DISCOGS_TOKEN}`
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const json = JSON.parse(data);
                        if (json.results && json.results.length > 0) {
                            resolve(json.results[0]);
                        } else {
                            resolve(null); // Not found
                        }
                    } catch (e) {
                        reject(e);
                    }
                } else if (res.statusCode === 429) {
                    reject(new Error('Rate Limit Exceeded'));
                } else {
                    resolve(null); // Error or not found
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// --- MAIN ---
async function main() {
    console.log('🚀 Starting Data Enrichment (Discogs)...');

    // 1. Read Existing Data or Start Fresh
    let existingData = [];
    if (fs.existsSync(outputPath)) {
        console.log('♻️  Resuming from existing JSON...');
        existingData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    }

    // 2. Read CSV
    const csvContent = fs.readFileSync(inputPath, 'utf8');
    const allAlbums = parseCSV(csvContent);
    console.log(`📊 Total Albums in CSV: ${allAlbums.length}`);
    console.log(`📊 Already Processed: ${existingData.length}`);

    // 3. Process
    // Map existing by ID to avoid duplicates/re-work
    const processedMap = new Map(existingData.map(a => [a.id, a]));
    let updates = 0;

    for (const album of allAlbums) {
        // Skip if already has a cover (and we are in resume mode)
        if (processedMap.has(album.id)) {
            const existing = processedMap.get(album.id);
            if (existing.coverUrl) continue; // Already done
        }

        process.stdout.write(`🔎 Processing [${album.id}] ${album.artist} - ${album.album}... `);

        try {
            const result = await searchDiscogs(album.artist, album.album);

            let coverUrl = null;
            let discogsId = null;

            if (result) {
                coverUrl = result.cover_image; // Or thumb? thumb is smaller, cover_image might be restricted?
                // Discogs cover_image often 150x150 in search results, fetch detail for full?
                // For list view, thumb is okay. detailed results might need another call.
                // results.cover_image is often the best we get from search.
                discogsId = result.id;
                process.stdout.write('✅ Found\n');
            } else {
                process.stdout.write('❌ Not Found\n');
            }

            // Merge
            const enriched = {
                ...album,
                coverUrl: coverUrl || null,
                discogsId: discogsId,
                lastUpdated: new Date().toISOString()
            };

            processedMap.set(album.id, enriched);
            updates++;

            // Save periodically (every 10 items)
            if (updates % 10 === 0) {
                save(processedMap);
            }

            // Rate Limit Wait
            await sleep(RATE_LIMIT_DELAY);

        } catch (err) {
            console.log(`\n⚠️ Error processing ${album.title}: ${err.message}`);
            // Rate limit hit? Wait longer
            if (err.message.includes('Rate Limit')) {
                console.log('⏳ Hitting Rate Limits, pausing for 60s...');
                await sleep(60000);
            }
        }
    }

    // --- PHASE 2: DISCOGRAPHY EXPANSION ---
    console.log('\n🚀 Starting Phase 2: Discography Expansion...');

    // Explicit list of Electronic/Dance artists requested by user
    const EXTRA_ARTISTS = [
        // Progressive House / Trance Melódico
        "Anthony Pappa", "BT", "Deep Dish", "Dave Seaman", "Danny Howells",
        "Eric Prydz", "Pryda", "Cirez D", "Hernan Cattaneo", "Hybrid", "Deadmau5",
        "James Holden", "John Digweed", "Nick Warren", "Sasha", "Son Kite", "D-Nox & Beckers",

        // Trance / Uplifting
        "Above & Beyond", "Armin van Buuren", "ATB", "Blank & Jones", "Chicane",
        "Cosmic Gate", "Darren Emerson", "Ferry Corsten", "System F", "Gouryella",
        "Mauro Picotto", "Paul Oakenfold", "Paul van Dyk", "Rank 1", "Robert Miles", "Tiësto",

        // Techno / Minimal / Acid
        "Adam Beyer", "Aphex Twin", "Carl Cox", "Chris Liebing", "Derrick May",
        "Green Velvet", "Jeff Mills", "Juan Atkins", "Laurent Garnier", "Luke Slater",
        "Richie Hawtin", "Plastikman", "The Advent", "Sven Väth",

        // Big Beat / Breakbeat
        "Apollo 440", "Basement Jaxx", "Bentley Rhythm Ace", "Fatboy Slim",
        "Groove Armada", "Leftfield", "The Chemical Brothers", "The Crystal Method",
        "The Prodigy", "Propellerheads",

        // Trip-Hop / Downtempo / Ambient
        "Air", "Massive Attack", "Portishead", "Thievery Corporation", "Tricky",
        "Morcheeba", "The Orb", "The Future Sound of London",

        // Mainstream / Impact
        "Daft Punk", "Faithless", "Orbital", "The KLF", "Underworld"
    ];

    // Get unique artists from CSV + Extra List
    const csvArtists = allAlbums.map(a => a.artist);
    const uniqueArtists = [...new Set([...csvArtists, ...EXTRA_ARTISTS])];

    console.log(`📊 Found ${uniqueArtists.length} unique artists (including ${EXTRA_ARTISTS.length} custom additions).`);

    for (const artistName of uniqueArtists) {
        // Skip if we already have "enough" albums for this artist? 
        // Or checking if we already ran expansion for this artist? 
        // For simplicity, let's just do a check on a "processed_artists" set if we saved it, 
        // but currently we don't. We'll rely on checking if albums exist.

        process.stdout.write(`🔎 Expanding discography for: ${artistName}... `);

        try {
            // 1. Find Artist ID
            const artistId = await searchArtistId(artistName);
            if (!artistId) {
                console.log('❌ Artist Not Found');
                continue;
            }

            // 2. Get Releases (Top 20 most recent? Or generic?)
            // Discogs "Artist Releases" endpoint lists everything.
            // We want "Main" releases (Albums).
            const releases = await getArtistReleases(artistId);

            if (releases && releases.length > 0) {
                let addedCount = 0;
                for (const rel of releases) {
                    // Filter: Must be "Main" release (not type="single" if possible to distinguish), 
                    // matches Album type. Discogs returns "role" usually.
                    // Also check duplicates against processedMap

                    // Simple logic: If title not in our DB for this artist, add it.
                    // Using a composite key check would be better, but title check is ok for now.

                    const isDuplicate = Array.from(processedMap.values()).some(
                        a => a.artist === artistName && a.album.toLowerCase() === rel.title.toLowerCase()
                    );

                    if (!isDuplicate) {
                        const newId = `exp-${rel.id}`; // Prefix to avoid collision with csv IDs
                        const newAlbum = {
                            id: newId,
                            place: null, // Not ranked
                            artist: artistName,
                            album: rel.title,
                            year: rel.year || 'Unknown',
                            coverUrl: rel.thumb || '', // Use thumb for expansion items
                            discogsId: rel.id,
                            addedBy: 'expansion'
                        };
                        processedMap.set(newId, newAlbum);
                        addedCount++;
                    }
                }
                console.log(`✅ Added ${addedCount} new albums`);
            } else {
                console.log('⚠️ No releases found');
            }

            if (updates++ % 5 === 0) save(processedMap);
            await sleep(RATE_LIMIT_DELAY);

        } catch (err) {
            console.log(`⚠️ Error expanding ${artistName}: ${err.message}`);
            if (err.message.includes('Rate Limit')) {
                console.log('⏳ Hitting Rate Limits, pausing for 60s...');
                await sleep(60000);
            }
        }
    }

    // Final Save
    save(processedMap);
    console.log('\n✨ All Processing Complete!');
}

async function searchArtistId(name) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.discogs.com',
            path: `/database/search?q=${encodeURIComponent(name)}&type=artist&per_page=1`,
            method: 'GET',
            headers: {
                'User-Agent': 'MJRP_Playlist_Generator/2.0',
                'Authorization': `Discogs token=${DISCOGS_TOKEN}`
            }
        };
        https.get(options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const json = JSON.parse(data);
                        resolve(json.results?.[0]?.id);
                    } catch (e) { resolve(null); }
                } else resolve(null);
            });
        }).on('error', reject);
    });
}

async function getArtistReleases(artistId) {
    return new Promise((resolve, reject) => {
        // Sort by year, desc? 
        const options = {
            hostname: 'api.discogs.com',
            path: `/artists/${artistId}/releases?sort=year&sort_order=desc&per_page=25`, // Fetch top 25 recent? Or "most_collected"? "year" is safe functionality.
            method: 'GET',
            headers: {
                'User-Agent': 'MJRP_Playlist_Generator/2.0',
                'Authorization': `Discogs token=${DISCOGS_TOKEN}`
            }
        };
        https.get(options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const json = JSON.parse(data);
                        // Filter for only "Main" releases (no appearances) and format="Album" if possible?
                        // json.releases objects have "role" (Main/Appearance), "type" (master/release)
                        // effective filtering needs to check these.
                        const valid = (json.releases || []).filter(r =>
                            (r.role === 'Main') &&
                            (r.type === 'master' || r.format?.includes('Album')) // Approximate filter
                        );
                        resolve(valid);
                    } catch (e) { resolve([]); }
                } else resolve([]);
            });
        }).on('error', reject);
    });
}

function save(map) {
    // Sort by original ID (which is numeric-ish)
    const sorted = Array.from(map.values()).sort((a, b) => Number(a.id) - Number(b.id));
    fs.writeFileSync(outputPath, JSON.stringify(sorted, null, 2));
}

main();
