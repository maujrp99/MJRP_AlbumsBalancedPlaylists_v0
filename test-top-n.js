
import { TopNAlgorithm } from './public/js/algorithms/TopNAlgorithm.js';

// Mock Ranking Strategy
class MockRankingStrategy {
    rank(album) {
        // Return tracks 1..10
        return Array.from({ length: 10 }, (_, i) => ({
            id: `t${i + 1}`,
            title: `Track ${i + 1}`,
            duration: 180,
            rankingInfo: []
        }));
    }
}

async function testVariableTopN() {
    console.log('--- Testing Variable Top N ---');

    // 1. Setup Algorithm
    const algo = new TopNAlgorithm({
        trackCount: 3, // Default
        rankingStrategy: new MockRankingStrategy()
    });

    const mockAlbums = [{ id: 'a1', title: 'Album 1' }];

    // 2. Test Default (N=3)
    console.log('Test 1: Default N=3');
    const res1 = algo.generate(mockAlbums);
    const count1 = res1.playlists[0].tracks.length;
    console.log(`Expected 3, Got: ${count1}`);
    if (count1 !== 3) throw new Error('Default N failed');

    // 3. Test Override (N=5)
    console.log('Test 2: Override N=5');
    const res2 = algo.generate(mockAlbums, { trackCount: 5 });
    const count2 = res2.playlists[0].tracks.length;
    console.log(`Expected 5, Got: ${count2}`);
    if (count2 !== 5) throw new Error('Override N=5 failed');

    // 4. Test Override (N=1)
    console.log('Test 3: Override N=1');
    const res3 = algo.generate(mockAlbums, { trackCount: 1 });
    const count3 = res3.playlists[0].tracks.length;
    console.log(`Expected 1, Got: ${count3}`);
    if (count3 !== 1) throw new Error('Override N=1 failed');

    console.log('--- ALL TESTS PASSED ---');
}

testVariableTopN().catch(err => {
    console.error('TEST FAILED:', err);
    process.exit(1);
});
