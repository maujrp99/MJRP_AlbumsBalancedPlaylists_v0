// Wraps, on their prototypes, every ranking strategy's rank() and every recipe's generate(), so
// the albums the repository's tests hand them are recorded. Writes one JSON per test file.
import fs from 'node:fs'
import path from 'node:path'
import { afterAll, expect } from 'vitest'
import { recordAlbum, recordGenerate, takeRecords } from './recorder.js'
import { BalancedRankingStrategy } from '../../../public/js/ranking/BalancedRankingStrategy.js'
import { SpotifyRankingStrategy } from '../../../public/js/ranking/SpotifyRankingStrategy.js'
import { BEARankingStrategy } from '../../../public/js/ranking/BEARankingStrategy.js'
import { UserRankingStrategy } from '../../../public/js/ranking/UserRankingStrategy.js'
import { TopNAlgorithm } from '../../../public/js/algorithms/TopNAlgorithm.js'
import { MJRPBalancedCascadeAlgorithm } from '../../../public/js/algorithms/MJRPBalancedCascadeAlgorithm.js'

const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), '../corpus/extracted')

for (const Strategy of [BalancedRankingStrategy, SpotifyRankingStrategy, BEARankingStrategy, UserRankingStrategy]) {
    const own = Object.getOwnPropertyDescriptor(Strategy.prototype, 'rank').value
    let depth = 0
    Strategy.prototype.rank = function (album) {
        // Only the outer call (a subclass's rank calls super.rank): the class asked for is what counts
        if (depth === 0 && this.constructor === Strategy) recordAlbum('rank', Strategy.name, album)
        depth++
        try { return own.call(this, album) } finally { depth-- }
    }
}

for (const Recipe of [TopNAlgorithm, MJRPBalancedCascadeAlgorithm]) {
    const own = Recipe.prototype.generate
    Recipe.prototype.generate = function (albums, opts) {
        recordGenerate(this.constructor.name, albums, opts)
        return own.call(this, albums, opts)
    }
}

afterAll(() => {
    const testPath = expect.getState().testPath || 'unknown'
    const records = takeRecords()
    if (records.length === 0) return
    fs.mkdirSync(OUT, { recursive: true })
    const name = path.relative(path.join(OUT, '../../../..'), testPath).replace(/[\\/]/g, '__')
    fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify({ source: path.relative(path.join(OUT, '../../../..'), testPath), records }, null, 1) + '\n')
})
