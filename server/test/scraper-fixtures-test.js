const fs = require('fs')
const path = require('path')
const assert = require('assert')
const { parseChartHtml } = require('../lib/scrapers/besteveralbums')

async function run() {
  const fixturePath = path.join(__dirname, 'fixtures', 'sample-chart.html')
  const html = fs.readFileSync(fixturePath, 'utf8')
  const parsed = parseChartHtml(html, 'https://www.besteveralbums.com/thechart.php?a=TEST#tracks')
  console.log('Parsed evidence:', parsed.evidence)
  try {
    assert(Array.isArray(parsed.evidence), 'evidence should be an array')
    assert(parsed.evidence.length === 3, 'expected 3 tracks from fixture')
    assert(parsed.evidence[0].trackTitle.toLowerCase().includes('kashmir'))
    assert(parsed.evidence[0].rating === 92)
    console.log('scraper-fixtures-test: PASS')
    process.exit(0)
  } catch (err) {
    console.error('scraper-fixtures-test: FAIL', err && err.message)
    process.exit(2)
  }
}

run()
