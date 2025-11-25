const { getRankingForAlbum, findAlbumId, fetchAlbumPage } = require('../lib/scrapers/besteveralbums')

async function run() {
  const title = 'The Wall'
  const artist = 'Pink Floyd'
  console.log('\n--- getRankingForAlbum ---')
  const r = await getRankingForAlbum(title, artist)
  console.log(r)
  console.log('\n--- findAlbumId ---')
  const id = await findAlbumId(title, artist)
  console.log('findAlbumId =>', id)
  console.log('\n--- fetchAlbumPage ---')
  const page = await fetchAlbumPage(title, artist)
  console.log('fetchAlbumPage =>', page)
}

run().catch(e => { console.error('ERR:', e); process.exit(1) })
