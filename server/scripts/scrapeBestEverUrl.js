const { getRankingFromUrl } = require('../lib/scrapers/besteveralbums')

async function main() {
  const url = process.argv[2]
  if (!url) {
    console.error('Usage: node scrapeBestEverUrl.js <besteveralbums-url>')
    process.exit(2)
  }
  try {
    const res = await getRankingFromUrl(url)
    console.log(JSON.stringify(res, null, 2))
  } catch (err) {
    console.error('Error:', err && err.message)
    process.exit(1)
  }
}

main()
