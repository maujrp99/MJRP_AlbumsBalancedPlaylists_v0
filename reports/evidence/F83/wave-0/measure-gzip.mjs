// usage: node f83_measure.mjs <dist dir>  -> prints every file of dist/assets with raw and gzip bytes (level 6), biggest first
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
const dist = process.argv[2]
const rows = fs.readdirSync(path.join(dist, 'assets')).filter(f => f.endsWith('.js') || f.endsWith('.css')).map(file => {
    const buffer = fs.readFileSync(path.join(dist, 'assets', file))
    return { file, raw: buffer.length, gzip: zlib.gzipSync(buffer, { level: 6 }).length }
}).sort((a, b) => b.gzip - a.gzip)
for (const row of rows.slice(0, Number(process.argv[3] || 40))) console.log(String(row.raw).padStart(9), String(row.gzip).padStart(8), row.file)
console.log('files', rows.length)
