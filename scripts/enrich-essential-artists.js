/**
 * Enrichment script focused on ESSENTIAL ARTISTS only
 * Much faster than full enrichment - only processes albums from priority artists
 * 
 * Usage: node scripts/enrich-essential-artists.js
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

// Load environment variables from server/.env
dotenv.config({ path: path.join(projectRoot, 'server/.env') });

const TEAM_ID = process.env.APPLE_TEAM_ID;
const KEY_ID = process.env.APPLE_KEY_ID;
const PRIVATE_KEY = process.env.APPLE_MUSIC_PRIVATE_KEY;

if (!TEAM_ID || !KEY_ID || !PRIVATE_KEY) {
    console.error('❌ Missing Apple Music credentials in server/.env');
    process.exit(1);
}

// Essential artists list (FULL from generate-dataset.js - 396 artists)
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
    "Testament", "Slipknot", "Avenged Sevenfold", "Mastodon", "Ozzy Osbourne",

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

const normalize = name => name?.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ') || '';
const essentialSet = new Set(ESSENTIAL_ARTISTS.map(normalize));

// Generate Apple Music token
function generateToken() {
    const token = jwt.sign({}, PRIVATE_KEY, {
        algorithm: 'ES256',
        expiresIn: '1h',
        issuer: TEAM_ID,
        header: { alg: 'ES256', kid: KEY_ID }
    });
    return token;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function searchAppleMusic(artist, album, token) {
    const query = encodeURIComponent(`${album} ${artist}`);
    const url = `https://api.music.apple.com/v1/catalog/us/search?term=${query}&types=albums&limit=5`;

    const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
        if (res.status === 429) {
            console.log('   ⏳ Rate limited, waiting 60s...');
            await sleep(60000);
            return searchAppleMusic(artist, album, token);
        }
        return null;
    }

    const data = await res.json();
    const results = data.results?.albums?.data || [];

    // Find best match
    for (const result of results) {
        const attrs = result.attributes;
        if (normalize(attrs.artistName).includes(normalize(artist).split(' ')[0])) {
            return {
                appleMusicId: result.id,
                artworkTemplate: attrs.artwork?.url?.replace('{w}x{h}', '{w}x{h}') || null
            };
        }
    }

    return results[0] ? {
        appleMusicId: results[0].id,
        artworkTemplate: results[0].attributes?.artwork?.url?.replace('{w}x{h}', '{w}x{h}') || null
    } : null;
}

async function main() {
    console.log('🎵 Priority Albums Enrichment');
    console.log('================================\n');

    const dataPath = path.join(projectRoot, 'public/assets/data/albums-expanded.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    // Separate into categories
    const essentialArtistAlbums = data.filter(a => essentialSet.has(normalize(a.artist)));
    const acclaimedAlbums = data.filter(a =>
        a.place !== null && a.place !== undefined &&
        !essentialSet.has(normalize(a.artist)) // Exclude essential artists (already covered)
    );

    console.log(`📊 Total albums in dataset: ${data.length}`);
    console.log(`🎸 Essential artists albums: ${essentialArtistAlbums.length}`);
    console.log(`⭐ Acclaimed albums (non-essential): ${acclaimedAlbums.length}`);

    // Combine: Essential first, then acclaimed
    const priorityAlbums = [...essentialArtistAlbums, ...acclaimedAlbums];
    console.log(`🎯 Total priority albums: ${priorityAlbums.length}`);

    // Filter to albums without artworkTemplate
    const toEnrich = priorityAlbums.filter(a => !a.artworkTemplate);
    console.log(`🔄 Need enrichment: ${toEnrich.length}\n`);

    // Show sample of first 5 albums to verify
    console.log('📋 First 5 albums to process:');
    toEnrich.slice(0, 5).forEach((a, i) => console.log(`   ${i + 1}. ${a.artist} - ${a.album}`));
    console.log('');

    if (toEnrich.length === 0) {
        console.log('✅ All priority albums already enriched!');
        return;
    }

    const token = generateToken();
    let enriched = 0;
    let failed = 0;

    for (let i = 0; i < toEnrich.length; i++) {
        const album = toEnrich[i];
        process.stdout.write(`[${i + 1}/${toEnrich.length}] ${album.artist} - ${album.album}... `);

        try {
            const result = await searchAppleMusic(album.artist, album.album, token);

            if (result?.artworkTemplate) {
                // Update in original data array
                const idx = data.findIndex(a => a.id === album.id);
                if (idx >= 0) {
                    data[idx].appleMusicId = result.appleMusicId;
                    data[idx].artworkTemplate = result.artworkTemplate;
                    data[idx].enrichedAt = new Date().toISOString();
                }
                console.log('✅');
                enriched++;
            } else {
                console.log('❌ Not found');
                failed++;
            }

            // Save every 20 albums
            if ((i + 1) % 20 === 0) {
                fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
                console.log(`   💾 Progress saved (${enriched} enriched)`);
            }

            await sleep(200); // Rate limiting

        } catch (err) {
            console.log(`⚠️ Error: ${err.message}`);
            failed++;
        }
    }

    // Final save
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

    console.log('\n================================');
    console.log(`✅ Enriched: ${enriched}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('💾 Data saved!');
}

main().catch(console.error);
