const fs = require('fs');
const data = JSON.parse(fs.readFileSync('public/assets/data/albums-curated.json', 'utf8'));

console.log('=== ALBUM CURATED STATS ===');
console.log('Total albums:', data.length);

const live = data.filter(a => a.isLive === true);
const studio = data.filter(a => a.isLive === false || !a.isLive);
console.log('Live albums:', live.length);
console.log('Studio albums:', studio.length);

const artists = new Set(data.map(a => a.artist));
console.log('Unique artists:', artists.size);

// Check some live albums
console.log('\nSample live albums:');
live.slice(0, 10).forEach(a => console.log(' -', a.artist, '-', a.album));

// Sort by artist and album
data.sort((a, b) => {
    const artistComp = a.artist.localeCompare(b.artist);
    if (artistComp !== 0) return artistComp;
    return a.album.localeCompare(b.album);
});

// Generate report
let md = '# Curated Album Collection Report\n\n';
md += 'Generated: ' + new Date().toISOString() + '\n\n';
md += '## Summary\n';
md += '- **Total Albums**: ' + data.length + '\n';
md += '- **Studio Albums**: ' + studio.length + '\n';
md += '- **Live Albums**: ' + live.length + '\n';
md += '- **Unique Artists**: ' + artists.size + '\n\n';
md += '---\n\n';
md += '## All Albums (sorted by Artist → Album)\n\n';

data.forEach(a => {
    const tag = a.isLive ? ' 🎤' : '';
    md += '- ' + a.artist + ' - ' + a.album + ' (' + a.year + ')' + tag + '\n';
});

fs.writeFileSync('docs/ALBUM_COLLECTION_REPORT.md', md);
console.log('\n✅ Report saved to docs/ALBUM_COLLECTION_REPORT.md');
