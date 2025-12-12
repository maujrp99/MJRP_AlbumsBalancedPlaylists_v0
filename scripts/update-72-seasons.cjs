// Script to update 72 Seasons with complete data
const fs = require('fs');

const path = 'public/assets/data/albums-expanded.json';
console.log('Reading file...');
const content = fs.readFileSync(path, 'utf8');
const data = JSON.parse(content);
console.log(`Loaded ${data.length} albums`);

// Find and update 72 Seasons
const idx = data.findIndex(a => a.album === '72 Seasons' && a.artist === 'Metallica');
if (idx >= 0) {
    console.log(`Found 72 Seasons at index ${idx}`);
    data[idx] = {
        id: 'metallica-72-seasons',
        place: 1,
        artist: 'Metallica',
        album: '72 Seasons',
        year: '2023',
        coverUrl: 'https://i.scdn.co/image/ab67616d0000b273eb5a6a9bba36fe36d5e5c7e4',
        artworkTemplate: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/74/a1/cc/74a1cc69-909b-03df-3ac2-0c6461fb8c3e/23UMGIM24878.rgb.jpg/{w}x{h}bb.jpg',
        appleMusicId: '1667462194',
        tracks: [
            { title: '72 Seasons', duration: 437, position: 1 },
            { title: 'Shadows Follow', duration: 348, position: 2 },
            { title: 'Screaming Suicide', duration: 386, position: 3 },
            { title: 'Sleepwalk My Life Away', duration: 389, position: 4 },
            { title: 'You Must Burn!', duration: 418, position: 5 },
            { title: 'Lux Æterna', duration: 206, position: 6 },
            { title: 'Crown of Barbed Wire', duration: 332, position: 7 },
            { title: 'Chasing Light', duration: 387, position: 8 },
            { title: 'If Darkness Had a Son', duration: 379, position: 9 },
            { title: 'Too Far Gone?', duration: 381, position: 10 },
            { title: 'Room of Mirrors', duration: 333, position: 11 },
            { title: 'Inamorata', duration: 668, position: 12 }
        ],
        tracksCount: 12,
        addedBy: 'manual',
        enrichedAt: new Date().toISOString()
    };

    console.log('Writing file...');
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
    console.log('✅ 72 Seasons updated with complete data');
} else {
    console.log('❌ 72 Seasons not found');
}
