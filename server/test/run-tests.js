const assert = require('assert')
const { getRankingFromUrl, getRankingForAlbum } = require('../lib/scrapers/besteveralbums')
const { getRankingForAlbum: fetchRankingForAlbum } = require('../index')

async function testScraperDirectChart () {
  console.log('Test: scraper direct chart URL')
  const url = 'https://www.besteveralbums.com/thechart.php?a=145#tracks'
  const res = await getRankingFromUrl(url)
  assert(res && res.evidence && Array.isArray(res.evidence), 'scraper should return evidence array')
  assert(res.evidence.length > 0, 'scraper evidence should not be empty')
  console.log('  ✔ scraper direct chart returned', res.evidence.length, 'items')
}

async function testScraperByAlbum() {
  console.log('Test: scraper by album title/artist (Physical Graffiti)')
  const res = await getRankingForAlbum('Physical Graffiti', 'Led Zeppelin')
  assert(res && res.evidence && Array.isArray(res.evidence), 'getRankingForAlbum should return evidence array')
  assert(res.evidence.length > 0, 'evidence should not be empty')
  console.log('  ✔ getRankingForAlbum found', res.evidence.length, 'tracks')
}

async function testFetchRankingForAlbumIntegration() {
  console.log('Test: server fetchRankingForAlbum integration (uses scraper path)')
  // require the server index module and call the exported function
  // Note: fetchRankingForAlbum expects (album, albumQuery, options)
  const server = require('../index')
  if (!server || !server.fetchRankingForAlbum) {
    console.log('  ! server.fetchRankingForAlbum not exported; skipping integration test')
    return
  }
  const album = { title: 'Physical Graffiti', artist: 'Led Zeppelin', year: '1975' }
  const result = await server.fetchRankingForAlbum(album, 'Led Zeppelin - Physical Graffiti')
  assert(result && Array.isArray(result.entries), 'result.entries should be an array')
  assert(result.entries.length > 0, 'entries should be populated from scraper')
  console.log('  ✔ fetchRankingForAlbum returned', result.entries.length, 'entries (scraper primary)')
}

async function run() {
  try {
    await testScraperDirectChart()
    await testScraperByAlbum()
    await testFetchRankingForAlbumIntegration()
    console.log('\nAll tests passed')
    process.exit(0)
  } catch (err) {
    console.error('Test failed:', err && err.message)
    console.error(err)
    process.exit(1)
  }
}

run()
