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

  console.log('All tests passed')
}

run()
