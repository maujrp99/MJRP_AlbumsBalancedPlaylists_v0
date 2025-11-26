import assert from 'assert'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Import CurationEngine from the public/js/curation.js file
const mod = await import(path.join(__dirname, '../../public/js/curation.js'))
const { CurationEngine } = mod

console.log('Testing CurationEngine enrichment logic...')

const engine = new CurationEngine()

// Test 1: Enrichment from rankingConsolidated
{
    const album = {
        id: 'a1',
        title: 'Album 1',
        tracks: [
            { title: 'Track A', duration: 100 },
            { title: 'Track B', duration: 100 }
        ],
        rankingConsolidated: [
            { trackTitle: 'Track B', finalPosition: 1, rating: 90 },
            { trackTitle: 'Track A', finalPosition: 2, rating: 80 }
        ]
    }

    const enriched = engine.enrichTracks(album)

    const tB = enriched.find(t => t.title === 'Track B')
    const tA = enriched.find(t => t.title === 'Track A')

    assert.strictEqual(tB.acclaimRank, 1, 'Track B should be rank 1')
    assert.strictEqual(tA.acclaimRank, 2, 'Track A should be rank 2')
    assert.strictEqual(tB.rating, 90, 'Track B should have rating 90')
    assert.strictEqual(tA.rating, 80, 'Track A should have rating 80')
    console.log('Test 1 Passed: rankingConsolidated enrichment')
}

// Test 2: Enrichment from bestEverEvidence
{
    const album = {
        id: 'a2',
        title: 'Album 2',
        tracks: [
            { title: 'Song X' },
            { title: 'Song Y' }
        ],
        bestEverEvidence: [
            { trackTitle: 'Song X', rating: 95 }
        ]
    }

    const enriched = engine.enrichTracks(album)
    const tX = enriched.find(t => t.title === 'Song X')

    assert.strictEqual(tX.rating, 95, 'Song X should have rating 95 from BestEver')
    console.log('Test 2 Passed: bestEverEvidence enrichment')
}

// Test 3: tracksByAcclaim precedence
{
    const album = {
        id: 'a3',
        title: 'Album 3',
        tracks: [
            { title: 'T1' },
            { title: 'T2' }
        ],
        tracksByAcclaim: [
            { title: 'T2', rank: 1 },
            { title: 'T1', rank: 2 }
        ]
    }

    const enriched = engine.enrichTracks(album)

    assert.strictEqual(enriched[0].title, 'T2', 'First track should be T2 (rank 1)')
    assert.strictEqual(enriched[1].title, 'T1', 'Second track should be T1 (rank 2)')
    assert.strictEqual(enriched[0].acclaimRank, 1)
    console.log('Test 3 Passed: tracksByAcclaim precedence')
}

console.log('All enrichment tests passed!')
