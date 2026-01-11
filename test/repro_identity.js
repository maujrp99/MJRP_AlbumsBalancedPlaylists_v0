
import { AlbumIdentity } from '../public/js/models/AlbumIdentity.js';

// Mock simple similarity (since we can't easily import the util without full setup)
// Or better, let's just rely on the getter logic we want to test: expectedArtist/expectedAlbum
const mockQuery = {
    title: 'Robert Plant - Manic Nirvana (Remastered)',
    _sourceSeriesId: 'test-series-123'
};

const resolvedAlbum = {
    title: 'Manic Nirvana',
    artist: 'Robert Plant'
};

const identity = new AlbumIdentity(mockQuery, resolvedAlbum);

console.log('--- Debugging AlbumIdentity ---');
console.log('Query:', mockQuery);
console.log('Resolved:', resolvedAlbum);
console.log('Expected Artist:', identity.expectedArtist);
console.log('Expected Album:', identity.expectedAlbum);

const expectedArtist = identity.expectedArtist;
const expectedAlbum = identity.expectedAlbum;

const artistMatch = expectedArtist === 'Robert Plant';
const albumMatch = expectedAlbum === 'Manic Nirvana (Remastered)';

console.log('Artist Logic Correct:', artistMatch);
console.log('Album Logic Correct:', albumMatch);

if (artistMatch && albumMatch) {
    console.log('✅ REPRO PASSED: Logic handles object-wrapped composite strings.');
} else {
    console.error('❌ REPRO FAILED: Logic did not extract correct expectations.');
}
