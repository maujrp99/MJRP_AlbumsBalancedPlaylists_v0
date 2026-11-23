// Where two captures of the same step differ: node reports/evidence/F83/wave-5b/locate-pixels.mjs <name of the step in captures/> [captures folder]
// Prints the rows and columns that differ and writes <name>.diff.png (the differing pixels in red over the old capture, dimmed).
import { PNG } from 'pngjs'
import fs from 'node:fs'
import path from 'node:path'

const OUT = path.dirname(new URL(import.meta.url).pathname)
const [name, folder = 'captures'] = process.argv.slice(2)
const a = PNG.sync.read(fs.readFileSync(path.join(OUT, folder, `${name}.old.png`)))
const b = PNG.sync.read(fs.readFileSync(path.join(OUT, folder, `${name}.new.png`)))
const diff = new PNG({ width: a.width, height: a.height })
const rows = new Map()
const cols = new Map()
let apart = 0
for (let y = 0; y < a.height; y++) {
    for (let x = 0; x < a.width; x++) {
        const i = (y * a.width + x) * 4
        const differs = a.data[i] !== b.data[i] || a.data[i + 1] !== b.data[i + 1] || a.data[i + 2] !== b.data[i + 2]
        const dim = (v) => Math.round(v * 0.35)
        diff.data[i] = differs ? 255 : dim(a.data[i]); diff.data[i + 1] = differs ? 0 : dim(a.data[i + 1]); diff.data[i + 2] = differs ? 0 : dim(a.data[i + 2]); diff.data[i + 3] = 255
        if (differs) { apart++; rows.set(y, (rows.get(y) || 0) + 1); cols.set(x, (cols.get(x) || 0) + 1) }
    }
}
fs.writeFileSync(path.join(OUT, folder, `${name}.diff.png`), PNG.sync.write(diff))
const span = (map) => { const keys = [...map.keys()].sort((p, q) => p - q); return keys.length ? `${keys[0]}-${keys[keys.length - 1]} (${keys.length} distinct)` : 'none' }
console.log(`${apart} px apart; rows ${span(rows)}; columns ${span(cols)}`)
