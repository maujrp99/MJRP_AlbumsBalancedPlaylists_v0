/**
 * Generate lightweight autocomplete index
 * Input: public/assets/data/albums-curated.json
 * Output: public/assets/data/albums-autocomplete.json
 * 
 * Data format: Minimal array for bandwidth optimization
 * [
 *   "Artist",
 *   "Album",
 *   "Year",
 *   "ArtworkTemplate" (optimized/shortened?) -> No, fetch full on selection?
 * ]
 * 
 * Let's stick to object for readability/extensibility unless size is critical.
 * Given 40k items, array of arrays is much smaller.
 * 
 * Mapped Format:
 * [a, b, c, d]
 * a = Artist
 * b = Album
 * c = Year
 * d = Index in original file (to fetch full details later? or just ID?)
 * 
 * Actually, let's keep it simple:
 * {
 *   a: "Artist",
 *   b: "Album",
 *   c: "Year",
 *   d: "ArtworkTemplate" (optional, maybe just boolean or short hash?)
 * }
 * 
 * Re-evaluating: The user wants speed.
 * Let's store:
 * [Artist, Album, Year, AppleMusicId]
 * 
 * Total size est: 40,000 * (20+20+4+10) = ~2.2MB raw. Great.
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const inputFile = path.join(projectRoot, 'public/assets/data/albums-curated.json');
const outputFile = path.join(projectRoot, 'public/assets/data/albums-autocomplete.json');

console.log('🏗️  Generating autocomplete index...');

try {
    const rawData = fs.readFileSync(inputFile, 'utf8');
    const albums = JSON.parse(rawData);

    console.log(`📊 Input: ${albums.length} albums`);

    // Map to lightweight format
    // [Artist, Album, Year, AppleMusicId, ArtworkUrl]
    const optimized = albums.map(album => {
        return {
            a: album.artist,
            b: album.album,
            c: album.year,
            d: album.appleMusicId,
            e: album.artworkTemplate // Needed for UI thumbnails immediately
        };
    });

    // Write output
    fs.writeFileSync(outputFile, JSON.stringify(optimized));

    // Stats
    const inSize = fs.statSync(inputFile).size / 1024 / 1024;
    const outSize = fs.statSync(outputFile).size / 1024 / 1024;

    console.log(`✅ Success!`);
    console.log(`📉 Size reduced: ${inSize.toFixed(2)}MB -> ${outSize.toFixed(2)}MB`);
    console.log(`💾 Saved to: ${outputFile}`);

} catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
}
