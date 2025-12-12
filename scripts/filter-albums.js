/**
 * Filter albums-expanded.json to keep only:
 * - Official studio albums
 * - Live albums
 * 
 * Remove:
 * - Compilations ("Best Of", "Greatest Hits", "Collection", etc.)
 * - Singles (short album names often indicate singles)
 * - Box sets
 * - Demos, Bootlegs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const dataPath = path.join(projectRoot, 'public/assets/data/albums-expanded.json');
const backupPath = path.join(projectRoot, 'public/assets/data/albums-expanded-backup.json');

// Patterns that indicate compilations/non-studio albums TO REMOVE
const EXCLUDE_PATTERNS = [
    // Compilations
    /\bbest of\b/i,
    /\bgreatest hits\b/i,
    /\bcollection\b/i,
    /\bcompilation\b/i,
    /\banthology\b/i,
    /\bessential\b/i,
    /\bdefinitive\b/i,
    /\bcomplete albums?\b/i,
    /\bcomplete.*collection\b/i,
    /\bthe very best\b/i,
    /\bhits\b.*\bhits\b/i,
    /\b20\s*(greatest|biggest)\b/i,
    /\b(16|18|20|25|30|40|50)\s*#?1('s)?\s*hits?\b/i,

    // Singles/EPs
    /\bsingle\b/i,
    /\b(7"|12")\b/i,
    /\bpromo\b/i,
    /\badvance\b/i,
    /\b(e\.?p\.?)$/i, // Ends with EP

    // Box Sets
    /\bbox\s*set\b/i,
    /\bcollectors?\s*edition\b/i,
    /\bdeluxe\s*box\b/i,

    // Remixes
    /\bremix(es|ed)?\s*(collection|album)\b/i,
    /\bremixed\s*&?\s*remastered\b/i,

    // Demos/Bootlegs
    /\bdemo(s)?\b/i,
    /\bbootleg\b/i,
    /\bunofficial\b/i,
    /\brare\s*tracks\b/i,
    /\bouttakes\b/i,

    // Picture discs
    /\bpicture\s*disc\b/i,

    // Tribute albums
    /\btribute\s*to\b/i,
    /\bcovers\b/i,

    // Discogs-specific patterns
    /\bextraits?\b/i,
    /\bfrom\s*fear\s*to\s*eternity\b/i,
    /\bbacktracks\b/i,
    /\biron\s*man\s*2\b/i,

    // === UNOFFICIAL LIVE RECORDINGS (bootlegs, tour recordings) ===

    // Specific dates in title (e.g., "November 10, 2023", "May 28, 2025")
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b/i,

    // Date patterns like "10.11.2023" or "2023-11-10"
    /\b\d{1,2}[\.\-\/]\d{1,2}[\.\-\/]\d{2,4}\b/,
    /\b\d{4}[\.\-\/]\d{1,2}[\.\-\/]\d{1,2}\b/,

    // Tour names with cities (M72 tours, etc.)
    /\bm72\s*(world\s*tour)?[\s\-]+[a-z]/i,
    /\b(tour|world\s*tour)\s*[-–]\s*[a-z]/i,

    // City/State/Country specific recordings
    /\b(live\s*)?(in|at|@)\s+[a-z]+,?\s+(usa|uk|germany|france|japan|brazil|mexico|texas|california|ohio|michigan|virginia|maryland)\b/i,

    // Year-specific tour recordings (e.g., "'83", "'94")
    /\b['´']\d{2}\b/,

    // Generic tour bootleg patterns
    /\bsummer\s*shit\b/i,
    /\bworld\s*tour\s*\d{4}\b/i,
];

// Official live albums - these patterns indicate KEEP
// (Only classic, official live releases)
const OFFICIAL_LIVE_PATTERNS = [
    /\blive\s*after\s*death\b/i,
    /\blive\s*at\s*the\s*apollo\b/i,
    /\bunplugged\b/i,
    /\blive\s*at\s*fillmore\b/i,
    /\blive\s*at\s*budokan\b/i,
    /\blive\s*at\s*wembley\b/i,
    /\ben\s*vivo!?\b/i,
    /\blive\s*at\s*leeds\b/i,
    /\blive\s*at\s*pompeii\b/i,
    /\blive\s*at\s*river\s*plate\b/i,
    /\bthe book of souls.*live\b/i,
    /\bnights of the dead\b/i,
    /\blive\s*chapter\b/i,
    /\bpulse\b/i, // Pink Floyd
    /\bdelicate\s*sound\s*of\s*thunder\b/i, // Pink Floyd
    /\bstop\s*making\s*sense\b/i, // Talking Heads
    /\bthe\s*last\s*waltz\b/i, // The Band
    /\bno\s*sleep\s*'?til\s*hammersmith\b/i, // Motörhead
    /\bif\s*you\s*want\s*blood\b/i, // AC/DC
    /\bs&m\b/i, // Metallica with symphony
    /\bbinge\s*&\s*purge\b/i, // Metallica
];

function shouldKeepAlbum(album) {
    const title = album.album || '';
    const artist = album.artist || '';

    // Skip if empty
    if (!title.trim()) return false;

    // Check if it's an OFFICIAL live album (whitelist - always keep)
    const isOfficialLive = OFFICIAL_LIVE_PATTERNS.some(pattern => pattern.test(title));
    if (isOfficialLive) return true;

    // Check exclusion patterns (compilations, bootlegs, singles, etc.)
    const shouldExclude = EXCLUDE_PATTERNS.some(pattern => pattern.test(title));
    if (shouldExclude) return false;

    // Keep everything else (studio albums, etc.)
    return true;
}

async function main() {
    console.log('🧹 Album Filter - Keeping Official & Live Albums Only\n');

    // Backup first
    const albums = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    fs.writeFileSync(backupPath, JSON.stringify(albums, null, 2));
    console.log(`💾 Backup saved: ${backupPath}`);
    console.log(`📊 Total albums before: ${albums.length}`);

    // Track what we remove
    const removed = [];
    const kept = [];

    for (const album of albums) {
        if (shouldKeepAlbum(album)) {
            kept.push(album);
        } else {
            removed.push({
                artist: album.artist,
                album: album.album,
                year: album.year
            });
        }
    }

    console.log(`\n✅ Albums kept: ${kept.length}`);
    console.log(`❌ Albums removed: ${removed.length}`);

    // Show some samples of what's being removed
    console.log('\n--- Sample of Removed Albums (first 30) ---');
    removed.slice(0, 30).forEach(a => {
        console.log(`  ${a.artist} - ${a.album} (${a.year})`);
    });

    // Ask for confirmation before saving
    console.log('\n⚠️ Run with --confirm to actually save changes');
    console.log('   Example: node scripts/filter-albums.js --confirm');

    if (process.argv.includes('--confirm')) {
        // Save filtered data
        fs.writeFileSync(dataPath, JSON.stringify(kept, null, 2));
        console.log('\n✨ Changes saved!');

        // Also save removed list for reference
        const removedPath = path.join(projectRoot, 'scripts/removed-albums.json');
        fs.writeFileSync(removedPath, JSON.stringify(removed, null, 2));
        console.log(`📝 Removed albums list saved: ${removedPath}`);
    }
}

main().catch(console.error);
