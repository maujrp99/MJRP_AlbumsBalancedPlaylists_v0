// A piece of two captures of the same step side by side, magnified: node reports/evidence/F83/wave-5b/crop.mjs <step> <x> <y> <w> <h> [scale] [captures folder]
// Writes <step>.crop.png: the old on the left, the new on the right.
import { PNG } from 'pngjs'
import fs from 'node:fs'
import path from 'node:path'

const OUT = path.dirname(new URL(import.meta.url).pathname)
const [name, x0, y0, w, h, scale = '6', folder = 'captures'] = process.argv.slice(2)
const [X, Y, W, H, S] = [x0, y0, w, h, scale].map(Number)
const read = (side) => PNG.sync.read(fs.readFileSync(path.join(OUT, folder, `${name}.${side}.png`)))
const sides = [read('old'), read('new')]
const out = new PNG({ width: (W * S) * 2 + 10, height: H * S })
out.data.fill(255)
sides.forEach((png, k) => {
    for (let y = 0; y < H * S; y++) {
        for (let x = 0; x < W * S; x++) {
            const sx = X + Math.floor(x / S), sy = Y + Math.floor(y / S)
            const si = (sy * png.width + sx) * 4
            const di = (y * out.width + x + k * (W * S + 10)) * 4
            out.data[di] = png.data[si]; out.data[di + 1] = png.data[si + 1]; out.data[di + 2] = png.data[si + 2]; out.data[di + 3] = 255
        }
    }
})
fs.writeFileSync(path.join(OUT, folder, `${name}.crop.png`), PNG.sync.write(out))
console.log('written')
