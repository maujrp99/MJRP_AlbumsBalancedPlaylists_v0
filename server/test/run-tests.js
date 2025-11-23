const assert = require('assert')
const { cleanFencedMarkdown, tryParseJson, extractAlbum } = require('../lib/normalize')
const { validateAlbum, ajvAvailable } = require('../lib/schema')

function run () {
  console.log('Running simple node tests...')
  // normalize tests
  try {
    const input = '```json\n{"title":"T"}\n```'
    const out = cleanFencedMarkdown(input)
    assert.strictEqual(out, '{"title":"T"}')

    const s1 = '{"a":1}'
    assert.deepStrictEqual(tryParseJson(s1), { a: 1 })

    const s2 = 'some text ```json\n{"b":2}\n``` more'
    assert.deepStrictEqual(tryParseJson(s2), { b: 2 })

    assert.strictEqual(tryParseJson('no json here'), null)

    const resp = { data: { candidates: [{ content: { parts: [{ text: '```json\n{\"tracks\":[{\"id\":\"t1\",\"rank\":1,\"title\":\"A\"}] }\n```' }] } }] } }
    const album = extractAlbum(resp)
    assert.ok(album)
    assert.strictEqual(album.tracks[0].title, 'A')

    const resp2 = { data: { data: { title: 'X', artist: 'Y', tracks: [] } } }
    const album2 = extractAlbum(resp2)
    assert.deepStrictEqual(album2, { title: 'X', artist: 'Y', tracks: [] })

    console.log('normalize tests passed')
  } catch (err) {
    console.error('normalize tests failed')
    console.error(err)
    process.exit(2)
  }

  // schema tests
  try {
    if (!ajvAvailable) {
      console.warn('AJV not available; skipping schema tests')
    } else {
      const good = { title: 'T', artist: 'A', tracks: [{ id: 't1', rank: 1, title: 'trk' }] }
      const ok = validateAlbum(good)
      assert.strictEqual(ok, true, 'good album should validate')

      const bad = { title: 'T' }
      const ok2 = validateAlbum(bad)
      assert.strictEqual(ok2, false, 'bad album should not validate')
      console.log('schema tests passed')
    }
  } catch (err) {
    console.error('schema tests failed')
    console.error(err)
    process.exit(3)
  }

  // --- curation tests (async import of ES module) ---
  try {
    (async () => {
      const mod = await import('../../public/js/curation.js');
      const { curateAlbums } = mod;

      // Sample albums: one album with ranks 1..5, durations small so fill is required
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
      ];

      const { playlists, rankingSummary, rankingSources } = curateAlbums(albums, { targetSeconds: 3 * 60 }); // small target to force fills

      // P1 must include rank===1
      const p1 = playlists.find(p => p.id === 'p1');
      assert.ok(p1 && p1.tracks.some(t => t.rank === 1), 'P1 must include rank 1 track');

      // P2 must include rank===2
      const p2 = playlists.find(p => p.id === 'p2');
      assert.ok(p2 && p2.tracks.some(t => t.rank === 2), 'P2 must include rank 2 track');

      // Because target is 3min and each track is 1min, P1 and P2 should be filled.
      // Fill strategy is worst-ranked-first, so the first appended to P1 or P2 should be rank 10 or 9.
      const fillTracks = [...(p1.tracks || []).slice(1), ...(p2.tracks || []).slice(1)];
      // At least one fill track should exist
      assert.ok(fillTracks.length > 0, 'Expected fill tracks');
      // The filled tracks should include the worst ranks (10,9)
      const ranks = fillTracks.map(f => f.rank).filter(r => typeof r === 'number');
      assert.ok(ranks.includes(10) || ranks.includes(9), 'Fill should prefer worst-ranked tracks');

      assert.ok(rankingSummary && rankingSummary.alb1, 'Album summary must exist');
      assert.ok(rankingSummary.alb1.tracks.some(track => Array.isArray(track.rankingInfo)), 'Tracks must expose rankingInfo');
      assert.ok(rankingSources && rankingSources.some(source => source.name === 'MJRP Hybrid Algorithm'), 'Default ranking source recorded');

      console.log('curation tests passed');
      console.log('All tests passed');
    })().catch(err => {
      console.error('curation tests failed');
      console.error(err);
      process.exit(4);
    });
  } catch (err) {
    console.error('curation tests failed (sync)');
    console.error(err);
    process.exit(4);
  }
}

run()
