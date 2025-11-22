const { cleanFencedMarkdown, tryParseJson, extractAlbum } = require('../lib/normalize')

describe('normalize helpers', () => {
  test('cleanFencedMarkdown removes fences', () => {
    const input = '```json\n{"title":"T"}\n```'
    const out = cleanFencedMarkdown(input)
    expect(out).toBe('{"title":"T"}')
  })

  test('tryParseJson parses JSON or extracts object', () => {
    const s1 = '{"a":1}'
    expect(tryParseJson(s1)).toEqual({ a: 1 })

    const s2 = 'some text ```json\n{"b":2}\n``` more'
    expect(tryParseJson(s2)).toEqual({ b: 2 })

    const s3 = 'no json here'
    expect(tryParseJson(s3)).toBeNull()
  })

  test('extractAlbum extracts from candidate text', () => {
    const resp = { data: { candidates: [{ content: { parts: [{ text: '```json\n{\"tracks\":[{\"id\":\"t1\",\"rank\":1,\"title\":\"A\"}] }\n```' }] } }] } }
    const album = extractAlbum(resp)
    expect(album).toBeTruthy()
    expect(album.tracks[0].title).toBe('A')
  })

  test('extractAlbum extracts from response.data.data', () => {
    const resp = { data: { data: { title: 'X', artist: 'Y', tracks: [] } } }
    const album = extractAlbum(resp)
    expect(album).toEqual({ title: 'X', artist: 'Y', tracks: [] })
  })
})
