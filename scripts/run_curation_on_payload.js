#!/usr/bin/env node
/*
  Usage:
    node scripts/run_curation_on_payload.js /path/to/payload.json
    node scripts/run_curation_on_payload.js https://my-backend.example.com/api/generate '{"albumQuery":"Exile on Main St."}'

  If a local JSON file is supplied, it should be the full API payload as returned by `/api/generate`.
  The script will import the client curation function and run it against `data` from the payload,
  printing a concise summary of P1/P2 and first tracks from each generated playlist so you can
  compare with production behavior.
*/

const fs = require('fs')
const path = require('path')
const axios = require('axios')

async function loadPayload(arg1, arg2) {
  // If first arg is a URL and second arg is a JSON body, call the endpoint
  if (/^https?:\/\//i.test(arg1)) {
    const url = arg1
    const body = arg2 ? JSON.parse(arg2) : { albumQuery: 'Pink Floyd - The Wall' }
    const resp = await axios.post(url, body, { headers: { 'Content-Type': 'application/json' } })
    return resp.data
  }

  const p = path.resolve(process.cwd(), arg1 || '')
  if (!fs.existsSync(p)) throw new Error('File not found: ' + p)
  const raw = fs.readFileSync(p, 'utf8')
  return JSON.parse(raw)
}

async function main() {
  try {
    const args = process.argv.slice(2)
    if (args.length === 0) {
      console.error('Usage: node scripts/run_curation_on_payload.js <payload.json | <backendUrl> [jsonBody]>')
      process.exit(2)
    }
    const payload = await loadPayload(args[0], args[1])
    const data = payload && payload.data ? payload.data : payload
    if (!data) {
      console.error('No payload `data` found in file/response')
      process.exit(3)
    }

    // Import the curation module (ES module default export function)
    const curateModule = await import(pathToFileURL(path.resolve(__dirname, '..', 'public', 'js', 'curation.js')).href)
    const curate = curateModule.curateAlbums || curateModule.default || null
    if (!curate) {
      console.error('Could not import curateAlbums from public/js/curation.js')
      process.exit(4)
    }

    const res = curate(data, { targetSeconds: 45 * 60 })
    console.log('\n== Playlists summary ==')
    for (const p of res.playlists) {
      console.log(`\nPlaylist: ${p.id} — ${p.title} (${p.tracks.length} tracks)`) 
      p.tracks.slice(0, 8).forEach((t, i) => {
        console.log(`${i + 1}. [rank=${t.rank}] ${t.title} (${t.originAlbumId || 'no-album'})`)
      })
    }

    console.log('\n== Ranking summary ==')
    console.log(JSON.stringify(res.rankingSummary, null, 2).slice(0, 2000))
    process.exit(0)
  } catch (err) {
    console.error('Error:', err && err.message)
    process.exit(10)
  }
}

function pathToFileURL (p) {
  let resolved = path.resolve(p)
  if (process.platform === 'win32') resolved = resolved.replace(/\\/g, '/')
  return new URL('file://' + resolved)
}

main()
