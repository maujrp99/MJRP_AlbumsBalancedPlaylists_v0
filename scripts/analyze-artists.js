/**
 * Analyze albums-expanded.json to compare with ESSENTIAL_ARTISTS
 * Outputs:
 * 1. Essential artists NOT in dataset (missing)
 * 2. Dataset artists NOT in essentials (candidates for cleanup)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Read the current dataset
const datasetPath = path.join(projectRoot, 'public/assets/data/albums-expanded.json');
const data = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

// ESSENTIAL_ARTISTS (copy from generate-dataset.js)
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

    // === ELECTRONIC / DANCE ===
    "Anthony Pappa", "BT", "Deep Dish", "Dave Seaman", "Danny Howells",
    "Eric Prydz", "Pryda", "Cirez D", "Hernan Cattaneo", "Hybrid",
    "Deadmau5", "James Holden", "John Digweed", "Nick Warren", "Sasha",
    "Son Kite", "D-Nox & Beckers",
    "Above & Beyond", "Armin van Buuren", "ATB", "Blank & Jones", "Chicane",
    "Cosmic Gate", "Darren Emerson", "Ferry Corsten", "System F", "Gouryella",
    "Mauro Picotto", "Paul Oakenfold", "Paul van Dyk", "Rank 1",
    "Robert Miles", "Tiësto",
    "Adam Beyer", "Aphex Twin", "Carl Cox", "Chris Liebing", "Derrick May",
    "Green Velvet", "Jeff Mills", "Juan Atkins", "Laurent Garnier",
    "Luke Slater", "Richie Hawtin", "Plastikman", "The Advent", "Sven Väth",
    "Apollo 440", "Basement Jaxx", "Bentley Rhythm Ace", "Fatboy Slim",
    "Groove Armada", "Leftfield", "The Chemical Brothers", "The Crystal Method",
    "The Prodigy", "Propellerheads",
    "Air", "Massive Attack", "Portishead", "Thievery Corporation", "Tricky",
    "Morcheeba", "The Orb", "The Future Sound of London",
    "Daft Punk", "Faithless", "Orbital", "The KLF", "Underworld",

    // === MÚSICA BRASILEIRA ===
    "Pixinguinha", "Carmem Miranda", "Ary Barroso", "Dorival Caymmi",
    "Orlando Silva", "Francisco Alves", "Noel Rosa", "Custódio Mesquita",
    "Ciro Monteiro", "João Gilberto", "Tom Jobim", "Vinicius de Moraes",
    "Carlos Lyra", "Roberto Menescal", "Nara Leão", "Astrud Gilberto",
    "Elis Regina", "Chico Buarque", "Milton Nascimento", "Clara Nunes",
    "Maria Bethânia", "Gal Costa", "Caetano Veloso", "Gilberto Gil",
    "Djavan", "Fafá de Belém", "Simone", "Ivan Lins", "Gonzaguinha",
    "Os Mutantes", "Tom Zé", "Jorge Ben Jor",
    "Cartola", "Nelson Cavaquinho", "Adoniran Barbosa", "Candeia",
    "Paulinho da Viola", "Beth Carvalho", "Martinho da Vila", "Zeca Pagodinho",
    "Luiz Gonzaga", "Jackson do Pandeiro", "Alceu Valença", "Geraldo Azevedo",
    "Raul Seixas", "Roberto Carlos", "Erasmo Carlos", "Wanderléa", "Tim Maia", "Rita Lee",
    "Chitãozinho & Xororó", "Leandro & Leonardo", "Zezé Di Camargo & Luciano",
    "Ivete Sangalo", "Daniela Mercury",
    "Legião Urbana", "Titãs", "Os Paralamas do Sucesso", "Barão Vermelho",
    "Lulu Santos", "RPM", "Ultraje a Rigor", "Cazuza", "Cidade Negra",
    "Engenheiros do Hawaii", "Skank", "Chico Science & Nação Zumbi",
    "Natiruts", "O Rappa", "Charlie Brown Jr", "Raimundos", "Marcelo D2",
    "Planet Hemp", "Nenhum de Nós", "Plebe Rude", "Ed Motta",
    "Capital Inicial", "Baiana System", "Detonautas", "CPM 22",
    "Racionais MC's", "Criolo", "MV Bill", "Emicida"
];

// Normalize artist name for comparison
const normalize = (name) => name.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');

// Create maps for comparison
const essentialsNormalized = new Map(ESSENTIAL_ARTISTS.map(a => [normalize(a), a]));
const datasetArtists = new Map();

// Get unique artists from dataset
data.forEach(album => {
    const artist = album.artist;
    if (artist) {
        const norm = normalize(artist);
        if (!datasetArtists.has(norm)) {
            datasetArtists.set(norm, { name: artist, count: 0, source: album.addedBy || 'csv' });
        }
        datasetArtists.get(norm).count++;
    }
});

// Analysis
console.log('\n=== DATASET ANALYSIS ===\n');
console.log(`Total albums in dataset: ${data.length}`);
console.log(`Unique artists in dataset: ${datasetArtists.size}`);
console.log(`Essential artists defined: ${ESSENTIAL_ARTISTS.length}`);

// 1. Essential artists IN dataset
const essentialsInDataset = [];
const essentialsMissing = [];

for (const [norm, original] of essentialsNormalized) {
    if (datasetArtists.has(norm)) {
        essentialsInDataset.push({ name: original, count: datasetArtists.get(norm).count });
    } else {
        essentialsMissing.push(original);
    }
}

console.log(`\nEssential artists found in dataset: ${essentialsInDataset.length}`);
console.log(`Essential artists MISSING from dataset: ${essentialsMissing.length}`);

// 2. Dataset artists NOT in essentials (candidates for cleanup)
const nonEssentials = [];
for (const [norm, info] of datasetArtists) {
    if (!essentialsNormalized.has(norm)) {
        nonEssentials.push({ name: info.name, count: info.count, source: info.source });
    }
}

// Sort by count (highest first)
nonEssentials.sort((a, b) => b.count - a.count);

console.log(`\nArtists in dataset NOT in essentials list: ${nonEssentials.length}`);

// Write report
const report = {
    summary: {
        totalAlbums: data.length,
        uniqueArtistsInDataset: datasetArtists.size,
        essentialArtistsDefined: ESSENTIAL_ARTISTS.length,
        essentialsFound: essentialsInDataset.length,
        essentialsMissing: essentialsMissing.length,
        nonEssentialArtists: nonEssentials.length
    },
    essentialsMissing: essentialsMissing.sort(),
    nonEssentialArtists: nonEssentials
};

const reportPath = path.join(projectRoot, 'scripts/artist-analysis-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\nReport saved to: scripts/artist-analysis-report.json`);

// Print some highlights
console.log('\n--- TOP 20 NON-ESSENTIAL ARTISTS (by album count) ---');
nonEssentials.slice(0, 20).forEach(a => {
    console.log(`  ${a.count} albums: ${a.name} (${a.source})`);
});

console.log('\n--- ESSENTIAL ARTISTS MISSING ---');
essentialsMissing.slice(0, 20).forEach(a => console.log(`  - ${a}`));
if (essentialsMissing.length > 20) {
    console.log(`  ... and ${essentialsMissing.length - 20} more`);
}
