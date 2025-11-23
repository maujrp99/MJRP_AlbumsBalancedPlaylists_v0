import assert from 'assert'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const mod = await import(path.join(__dirname, '../../public/js/curation.js'))
const { curateAlbums } = mod

// Basic curation smoke test
const albums = [
  {
    id: 'alb1',
    title: 'Test Album',
    artist: 'Tester',
    tracks: [
      { id: 't1', rank: 1, title: 'Hit1', duration: 60 },
      { id: 't2', rank: 2, title: 'Hit2', duration: 60 },
      { id: 't3', rank: 3, title: 'Mid', duration: 60 },
      { id: 't4', rank: 10, title: 'Worst1', duration: 60 },
      { id: 't5', rank: 9, title: 'Worst2', duration: 60 }
    ]
  }
]

const { playlists, rankingSummary, rankingSources } = curateAlbums(albums, { targetSeconds: 3 * 60 })

const p1 = playlists.find(p => p.id === 'p1')
const p2 = playlists.find(p => p.id === 'p2')

assert.ok(p1 && p1.tracks.some(t => t.rank === 1), 'P1 must include rank 1 track')
assert.ok(p2 && p2.tracks.some(t => t.rank === 2), 'P2 must include rank 2 track')

const fillTracks = [...(p1.tracks || []).slice(1), ...(p2.tracks || []).slice(1)]
assert.ok(fillTracks.length > 0, 'Expected fill tracks')
const ranks = fillTracks.map(f => f.rank).filter(r => typeof r === 'number')
assert.ok(ranks.includes(10) || ranks.includes(9), 'Fill should prefer worst-ranked tracks')

assert.ok(rankingSummary && rankingSummary.alb1, 'Album summary must exist')
assert.ok(rankingSummary.alb1.tracks.some(track => Array.isArray(track.rankingInfo)), 'Tracks must expose rankingInfo')
assert.ok(rankingSources && rankingSources.some(source => source.name === 'MJRP Hybrid Algorithm'), 'Default ranking source recorded')

console.log('curation.test.mjs passed')
