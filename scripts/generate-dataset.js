
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

    // Explicit list of ESSENTIAL ARTISTS for discography expansion
    // Curated by user - includes international legends + Brazilian artists
    const ESSENTIAL_ARTISTS = [
        // === ROCK CLÁSSICO / HARD ROCK ===
        "The Beatles", "The Rolling Stones", "The Who", "The Kinks", "Jimi Hendrix",
        "Cream", "The Doors", "Led Zeppelin", "Creedence Clearwater Revival",
        "Jefferson Airplane", "Grateful Dead", "Janis Joplin", "The Animals",
        "Chuck Berry", "Elvis Presley", "Queen", "AC/DC", "Deep Purple",
        "Black Sabbath", "Aerosmith", "Kiss", "Van Halen", "Lynyrd Skynyrd",
        "Bad Company", "Free", "Thin Lizzy", "Grand Funk Railroad",
        "Blue Öyster Cult", "Status Quo", "Uriah Heep", "Ted Nugent", "UFO",

        // === PROGRESSIVE ROCK / ART ROCK ===
        "Pink Floyd", "The Moody Blues", "Procol Harum", "King Crimson", "Yes",
        "Genesis", "Rush", "Jethro Tull", "Emerson Lake & Palmer", "Supertramp",

        // === HEAVY METAL / THRASH ===
        "Iron Maiden", "Judas Priest", "Motörhead", "Metallica", "Slayer",
        "Megadeth", "Anthrax", "Venom", "Dio", "Pantera", "Sepultura",
        "Testament", "Slipknot", "Avenged Sevenfold", "Mastodon",

        // === GLAM ROCK / HAIR METAL ===
        "David Bowie", "T. Rex", "Roxy Music", "Mott the Hoople", "Slade",
        "Guns N' Roses", "Bon Jovi", "Mötley Crüe", "Def Leppard", "Poison",
        "Warrant", "Whitesnake",

        // === PUNK ROCK ===
        "Ramones", "Sex Pistols", "The Clash", "The Damned", "Iggy Pop",

        // === FOLK / FOLK ROCK ===
        "Bob Dylan", "Joan Baez", "Pete Seeger", "Simon & Garfunkel", "The Byrds",
        "Buffalo Springfield", "Crosby, Stills & Nash", "Neil Young",
        "Tracy Chapman", "Suzanne Vega", "Ani DiFranco", "Fleet Foxes",
        "Mumford & Sons", "The Lumineers",

        // === SOFT ROCK / YACHT ROCK / POP ROCK ===
        "Eagles", "Fleetwood Mac", "Carole King", "James Taylor", "Elton John",
        "Billy Joel", "Steely Dan", "Doobie Brothers", "Toto", "Kenny Loggins",
        "Michael McDonald", "Christopher Cross", "Phil Collins", "Dire Straits",
        "Journey", "Foreigner", "Bryan Adams", "Maroon 5",

        // === FUNK / SOUL / R&B ===
        "James Brown", "Sly & The Family Stone", "Parliament-Funkadelic",
        "Earth, Wind & Fire", "Kool & the Gang", "The Commodores", "Ohio Players",
        "Aretha Franklin", "Otis Redding", "Sam Cooke", "Marvin Gaye",
        "Stevie Wonder", "The Supremes", "The Temptations",
        "Smokey Robinson & The Miracles", "Martha and the Vandellas",
        "Al Green", "Barry White", "Bill Withers", "Erykah Badu",
        "Lauryn Hill", "Mark Ronson",

        // === ALTERNATIVE / GRUNGE / INDIE ===
        "Nirvana", "Pearl Jam", "Soundgarden", "Alice in Chains",
        "Stone Temple Pilots", "Smashing Pumpkins", "R.E.M.", "Pavement",
        "Blur", "Oasis", "Suede", "Radiohead", "Foo Fighters", "Audioslave",
        "Creed", "Live", "The Strokes", "Arctic Monkeys", "Franz Ferdinand",
        "The Killers", "Yeah Yeah Yeahs", "Kings of Leon", "Vampire Weekend",
        "Tame Impala", "Muse", "Coldplay", "Linkin Park", "System of a Down",
        "Queens of the Stone Age",

        // === NEW WAVE / POST-PUNK ===
        "Depeche Mode", "Duran Duran", "Eurythmics", "The Police", "Blondie",
        "Talking Heads", "B-52s", "Soft Cell", "A-ha", "U2", "The Smiths",
        "The Cure", "Joy Division", "New Order", "Siouxsie and the Banshees",

        // === FUNK METAL / NU METAL ===
        "Red Hot Chili Peppers", "Faith No More", "Rage Against the Machine",
        "Primus", "Living Colour", "Fishbone",

        // === BLUES ROCK REVIVAL ===
        "The White Stripes", "The Black Keys", "Rival Sons", "Greta Van Fleet",

        // === COUNTRY ROCK ===
        "The Allman Brothers Band", "Poco", "Traveling Wilburys",
        "Dwight Yoakam", "Zac Brown Band",

        // === ELECTRONIC / DANCE - Progressive House / Trance ===
        "Anthony Pappa", "BT", "Deep Dish", "Dave Seaman", "Danny Howells",
        "Eric Prydz", "Pryda", "Cirez D", "Hernan Cattaneo", "Hybrid",
        "Deadmau5", "James Holden", "John Digweed", "Nick Warren", "Sasha",
        "Son Kite", "D-Nox & Beckers",

        // === ELECTRONIC / DANCE - Trance / Uplifting ===
        "Above & Beyond", "Armin van Buuren", "ATB", "Blank & Jones", "Chicane",
        "Cosmic Gate", "Darren Emerson", "Ferry Corsten", "System F", "Gouryella",
        "Mauro Picotto", "Paul Oakenfold", "Paul van Dyk", "Rank 1",
        "Robert Miles", "Tiësto",

        // === ELECTRONIC / DANCE - Techno / Minimal ===
        "Adam Beyer", "Aphex Twin", "Carl Cox", "Chris Liebing", "Derrick May",
        "Green Velvet", "Jeff Mills", "Juan Atkins", "Laurent Garnier",
        "Luke Slater", "Richie Hawtin", "Plastikman", "The Advent", "Sven Väth",

        // === ELECTRONIC / DANCE - Big Beat / Breakbeat ===
        "Apollo 440", "Basement Jaxx", "Bentley Rhythm Ace", "Fatboy Slim",
        "Groove Armada", "Leftfield", "The Chemical Brothers", "The Crystal Method",
        "The Prodigy", "Propellerheads",

        // === ELECTRONIC / DANCE - Trip-Hop / Downtempo ===
        "Air", "Massive Attack", "Portishead", "Thievery Corporation", "Tricky",
        "Morcheeba", "The Orb", "The Future Sound of London",

        // === ELECTRONIC / DANCE - Mainstream ===
        "Daft Punk", "Faithless", "Orbital", "The KLF", "Underworld",

        // === JAZZ LEGENDS ===
        "Miles Davis", "John Coltrane", "Duke Ellington", "Charles Mingus",
        "Bill Evans", "Ornette Coleman", "Sun Ra", "Cecil Taylor",
        "Art Ensemble of Chicago", "Jaco Pastorius", "Ella Fitzgerald",

        // === SINGER-SONGWRITERS / ALTERNATIVE ICONS ===
        "Joni Mitchell", "Tom Waits", "Van Morrison", "Frank Zappa",
        "Bruce Springsteen", "Patti Smith", "Kate Bush", "Björk",
        "Nick Cave & The Bad Seeds", "PJ Harvey", "Scott Walker",
        "Leonard Cohen", "Randy Newman", "Laura Nyro",

        // === ALTERNATIVE / EXPERIMENTAL ===
        "Sonic Youth", "The Fall", "Nine Inch Nails", "Primal Scream",
        "The Flaming Lips", "Beck", "Dinosaur Jr.", "Mercury Rev",
        "Guided by Voices", "Weezer", "OutKast", "Moby",

        // === POST-ROCK / AMBIENT ===
        "Mogwai", "Sigur Rós", "Tangerine Dream", "Klaus Schulze",
        "Steve Roach", "Autechre", "Boards of Canada",

        // === GOTH / INDUSTRIAL ===
        "Bauhaus", "Killing Joke", "Ministry", "Godflesh",

        // === CLASSIC ROCK ADDITIONS ===
        "ZZ Top", "The Soft Machine", "Hawkwind", "Captain Beefheart",
        "Cheap Trick", "Alice Cooper", "Fairport Convention",

        // === MÚSICA BRASILEIRA - Pioneiros e Bossa Nova ===
        "Pixinguinha", "Carmem Miranda", "Ary Barroso", "Dorival Caymmi",
        "Orlando Silva", "Francisco Alves", "Noel Rosa", "Custódio Mesquita",
        "Ciro Monteiro", "João Gilberto", "Tom Jobim", "Vinicius de Moraes",
        "Carlos Lyra", "Roberto Menescal", "Nara Leão", "Astrud Gilberto",

        // === MÚSICA BRASILEIRA - MPB ===
        "Elis Regina", "Chico Buarque", "Milton Nascimento", "Clara Nunes",
        "Maria Bethânia", "Gal Costa", "Caetano Veloso", "Gilberto Gil",
        "Djavan", "Fafá de Belém", "Simone", "Ivan Lins", "Gonzaguinha",

        // === MÚSICA BRASILEIRA - Tropicália ===
        "Os Mutantes", "Tom Zé", "Jorge Ben Jor",

        // === MÚSICA BRASILEIRA - Samba e Pagode ===
        "Cartola", "Nelson Cavaquinho", "Adoniran Barbosa", "Candeia",
        "Paulinho da Viola", "Beth Carvalho", "Martinho da Vila", "Zeca Pagodinho",

        // === MÚSICA BRASILEIRA - Regional ===
        "Luiz Gonzaga", "Jackson do Pandeiro", "Alceu Valença", "Geraldo Azevedo",
        "Raul Seixas",

        // === MÚSICA BRASILEIRA - Jovem Guarda e Pop ===
        "Roberto Carlos", "Erasmo Carlos", "Wanderléa", "Tim Maia", "Rita Lee",

        // === MÚSICA BRASILEIRA - Sertanejo ===
        "Chitãozinho & Xororó", "Leandro & Leonardo", "Zezé Di Camargo & Luciano",

        // === MÚSICA BRASILEIRA - Axé ===
        "Ivete Sangalo", "Daniela Mercury",

        // === MÚSICA BRASILEIRA - Rock Brasileiro ===
        "Legião Urbana", "Titãs", "Os Paralamas do Sucesso", "Barão Vermelho",
        "Lulu Santos", "RPM", "Ultraje a Rigor", "Cazuza", "Cidade Negra",
        "Engenheiros do Hawaii", "Skank", "Chico Science & Nação Zumbi",
        "Natiruts", "O Rappa", "Charlie Brown Jr", "Raimundos", "Marcelo D2",
        "Planet Hemp", "Nenhum de Nós", "Plebe Rude", "Ed Motta",
        "Capital Inicial", "Baiana System", "Detonautas", "CPM 22",

        // === MÚSICA BRASILEIRA - Hip Hop / Rap ===
        "Racionais MC's", "Criolo", "MV Bill", "Emicida"
    ];

    // Get unique artists from CSV + Essential List
    const csvArtists = allAlbums.map(a => a.artist);
    const uniqueArtists = [...new Set([...csvArtists, ...ESSENTIAL_ARTISTS])];

    console.log(`📊 Found ${uniqueArtists.length} unique artists (including ${ESSENTIAL_ARTISTS.length} essential artists).`);

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
