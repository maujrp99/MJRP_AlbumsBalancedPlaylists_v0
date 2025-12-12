/**
 * INCREMENTAL FETCH: Only fetch discographies for artists NOT already in the dataset
 * This is a faster alternative to running the full generate-dataset.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

// --- CONFIG ---
const DISCOGS_TOKEN = 'jVSQubYMicSFMVsgPsLzQnnSZFCZWuzYsMyyBzGd';
const RATE_LIMIT_DELAY = 1200;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const outputPath = path.join(projectRoot, 'public/assets/data/albums-expanded.json');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Load existing data
console.log('📂 Loading existing dataset...');
const existingData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
console.log(`📊 Existing albums: ${existingData.length}`);

// Create a normalized set of existing artists
const normalize = (name) => name.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
const existingArtists = new Set(existingData.map(a => normalize(a.artist)));
console.log(`📊 Unique artists in dataset: ${existingArtists.size}`);

// Artists to fetch (from the analysis report)
const ARTISTS_TO_FETCH = [
    // From essential missing list (152 artists)
    "ATB", "Above & Beyond", "Adam Beyer", "Adoniran Barbosa", "Alceu Valença",
    "Anthony Pappa", "Apollo 440", "Armin van Buuren", "Ary Barroso", "Astrud Gilberto",
    "Audioslave", "Avenged Sevenfold", "B-52s", "BT", "Baiana System",
    "Barão Vermelho", "Beth Carvalho", "Blank & Jones", "CPM 22", "Candeia",
    "Capital Inicial", "Carl Cox", "Carlos Lyra", "Carmem Miranda", "Cartola",
    "Cazuza", "Charlie Brown Jr", "Chicane", "Chico Science & Nação Zumbi",
    "Chitãozinho & Xororó", "Chris Liebing", "Christopher Cross", "Cidade Negra",
    "Cirez D", "Ciro Monteiro", "Clara Nunes", "Cosmic Gate", "Creed", "Criolo",
    "Custódio Mesquita", "D-Nox & Beckers", "Daniela Mercury", "Danny Howells",
    "Darren Emerson", "Dave Seaman", "Deadmau5", "Deep Dish", "Detonautas",
    "Djavan", "Doobie Brothers", "Dorival Caymmi", "Ed Motta", "Elis Regina",
    "Emicida", "Engenheiros do Hawaii", "Erasmo Carlos", "Eric Prydz",
    "Fafá de Belém", "Faithless", "Ferry Corsten", "Fishbone", "Francisco Alves",
    "Geraldo Azevedo", "Gonzaguinha", "Gouryella", "Green Velvet", "Groove Armada",
    "Hernan Cattaneo", "Hybrid", "Ivan Lins", "Ivete Sangalo", "Jackson do Pandeiro",
    "James Holden", "John Digweed", "Jorge Ben Jor", "Juan Atkins", "Kenny Loggins",
    "Laurent Garnier", "Leandro & Leonardo", "Legião Urbana", "Luiz Gonzaga",
    "Lulu Santos", "MV Bill", "Marcelo D2", "Maria Bethânia", "Maroon 5",
    "Martha and the Vandellas", "Martinho da Vila", "Mauro Picotto",
    "Michael McDonald", "Milton Nascimento", "Nara Leão", "Natiruts",
    "Nelson Cavaquinho", "Nenhum de Nós", "Nick Warren", "Noel Rosa", "O Rappa",
    "Ohio Players", "Orlando Silva", "Os Paralamas do Sucesso", "Parliament-Funkadelic",
    "Paul Oakenfold", "Paul van Dyk", "Paulinho da Viola", "Pete Seeger",
    "Pixinguinha", "Planet Hemp", "Plebe Rude", "Poco", "Poison", "Pryda",
    "RPM", "Racionais MC's", "Raimundos", "Rank 1", "Raul Seixas", "Richie Hawtin",
    "Rita Lee", "Robert Miles", "Roberto Carlos", "Roberto Menescal", "Sasha",
    "Simon & Garfunkel", "Simone", "Skank", "Sly & The Family Stone",
    "Smokey Robinson & The Miracles", "Son Kite", "Status Quo", "Sven Väth",
    "System F", "Ted Nugent", "Testament", "The Advent", "The Commodores",
    "The Crystal Method", "The Lumineers", "Thievery Corporation", "Tim Maia",
    "Titãs", "Tiësto", "Tom Jobim", "Traveling Wilburys", "Ultraje a Rigor",
    "Uriah Heep", "Vinicius de Moraes", "Wanderléa", "Warrant", "Zac Brown Band",
    "Zeca Pagodinho", "Zezé Di Camargo & Luciano",

    // NEW notable artists added (Jazz, Singer-Songwriters, etc.)
    "Leonard Cohen", "Boards of Canada"
];

// Filter to only artists not in dataset
const artistsToFetch = ARTISTS_TO_FETCH.filter(a => !existingArtists.has(normalize(a)));
console.log(`\n🎯 Artists to fetch: ${artistsToFetch.length} (${ARTISTS_TO_FETCH.length - artistsToFetch.length} already in dataset)`);

if (artistsToFetch.length === 0) {
    console.log('✅ All artists already in dataset! Nothing to fetch.');
    process.exit(0);
}

// Discogs API functions
async function searchArtistId(name) {
    return new Promise((resolve) => {
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
                    } catch { resolve(null); }
                } else resolve(null);
            });
        }).on('error', () => resolve(null));
    });
}

async function getArtistReleases(artistId) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'api.discogs.com',
            path: `/artists/${artistId}/releases?sort=year&sort_order=desc&per_page=25`,
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
                        const valid = (json.releases || []).filter(r =>
                            (r.role === 'Main') &&
                            (r.type === 'master' || r.format?.includes('Album'))
                        );
                        resolve(valid);
                    } catch { resolve([]); }
                } else resolve([]);
            });
        }).on('error', () => resolve([]));
    });
}

// Main fetch loop
async function main() {
    const processedMap = new Map(existingData.map(a => [a.id, a]));
    let addedTotal = 0;
    let processed = 0;

    console.log('\n🚀 Starting incremental fetch...\n');

    for (const artistName of artistsToFetch) {
        processed++;
        process.stdout.write(`[${processed}/${artistsToFetch.length}] 🔎 ${artistName}... `);

        try {
            const artistId = await searchArtistId(artistName);
            if (!artistId) {
                console.log('❌ Not Found');
                continue;
            }

            const releases = await getArtistReleases(artistId);
            let added = 0;

            for (const rel of releases) {
                const isDuplicate = Array.from(processedMap.values()).some(
                    a => normalize(a.artist) === normalize(artistName) &&
                        normalize(a.album) === normalize(rel.title)
                );

                if (!isDuplicate) {
                    const newId = `exp-${rel.id}`;
                    processedMap.set(newId, {
                        id: newId,
                        place: null,
                        artist: artistName,
                        album: rel.title,
                        year: rel.year || 'Unknown',
                        coverUrl: rel.thumb || '',
                        discogsId: rel.id,
                        addedBy: 'expansion'
                    });
                    added++;
                    addedTotal++;
                }
            }

            console.log(`✅ +${added} albums`);

            // Save every 10 artists
            if (processed % 10 === 0) {
                const sorted = Array.from(processedMap.values()).sort((a, b) =>
                    String(a.id).localeCompare(String(b.id), undefined, { numeric: true })
                );
                fs.writeFileSync(outputPath, JSON.stringify(sorted, null, 2));
                console.log(`   💾 Saved (${sorted.length} total albums)`);
            }

            await sleep(RATE_LIMIT_DELAY);

        } catch (err) {
            console.log(`⚠️ Error: ${err.message}`);
            if (err.message?.includes('Rate Limit')) {
                console.log('⏳ Rate limited, waiting 60s...');
                await sleep(60000);
            }
        }
    }

    // Final save
    const sorted = Array.from(processedMap.values()).sort((a, b) =>
        String(a.id).localeCompare(String(b.id), undefined, { numeric: true })
    );
    fs.writeFileSync(outputPath, JSON.stringify(sorted, null, 2));

    console.log(`\n✨ Done! Added ${addedTotal} albums from ${processed} artists.`);
    console.log(`📊 Total albums in dataset: ${sorted.length}`);
}

main();
