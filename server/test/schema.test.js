const { validateAlbum, ajvAvailable } = require('../lib/schema')

describe('schema validation', () => {
  test('validate good album', () => {
    if (!ajvAvailable) return
    const good = { title: 'T', artist: 'A', tracks: [{ id: 't1', rank: 1, title: 'trk' }] }
    const ok = validateAlbum(good)
    expect(ok).toBe(true)
  })

  test('reject missing required', () => {
    if (!ajvAvailable) return
    const bad = { title: 'T' }
    const ok = validateAlbum(bad)
    expect(ok).toBe(false)
  })
})
