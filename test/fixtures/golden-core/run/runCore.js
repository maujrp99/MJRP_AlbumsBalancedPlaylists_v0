// The golden run (F78, TASK-04; promoted from spike S1): every recipe of the registry (with each
// option that changes the output), every ranking strategy, the Album and Track models, the
// transformer, the two identity rules — over the golden corpus. Returns the canonical result.
//
// Engine-neutral: no import of Node, no global of the browser. The host hands in the inputs it read
// (`extractedFiles`, the two measured fixtures) and wires the id port before calling it:
//   Node and Vitest  test/fixtures/golden-core/run/golden.js
//   Hermes           scripts/golden-core.mjs --hermes (a bundle with the JSON inside)
//
// The modules are imported from the SITE's files as they are (public/js, shared). Nothing of the
// site is copied or changed.
import { getAllAlgorithms, getRecommendedAlgorithm, createAlgorithm } from '../../../../public/js/algorithms/index.js'
import { TopNAlgorithm } from '../../../../public/js/algorithms/TopNAlgorithm.js'
import { BaseAlgorithm } from '../../../../public/js/algorithms/BaseAlgorithm.js'
import { applyMixins, PlaylistBalancingMixin, DurationTrimmingMixin } from '../../../../public/js/algorithms/mixins/index.js'
import { createRankingStrategy, BalancedRankingStrategy, SpotifyRankingStrategy, BEARankingStrategy, UserRankingStrategy } from '../../../../public/js/ranking/index.js'
import { TrackTransformer } from '../../../../public/js/transformers/TrackTransformer.js'
import { Album } from '../../../../public/js/models/Album.js'
import { Track } from '../../../../public/js/models/Track.js'
import * as albumIdentity from '../../../../shared/albumIdentity.js'
import * as trackIdentity from '../../../../shared/trackIdentity.js'
import { handmadeAlbums, handmadeSets, albumVariants, trackVariantGroups } from '../inputs/handmade.js'
import { measuredAsAlbums } from '../inputs/measured.js'
import { seedRandom, takeLogs } from './harness.js'
import { canon, rememberInputIds, idReport, resetCanon } from './canon.js'

const clone = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)))

const STRATEGY_IDS = ['balanced', 'spotify', 'bea', 'user']
const STRATEGY_BY_CLASS = {
    BalancedRankingStrategy, SpotifyRankingStrategy, BEARankingStrategy, UserRankingStrategy
}
const RECIPE_BY_CLASS = {
    MJRPBalancedCascadeAlgorithm: 'mjrp-balanced-cascade', TopNPopularAlgorithm: 'top-n-popular',
    TopNAcclaimedAlgorithm: 'top-n-acclaimed', TopNUserAlgorithm: 'top-n-user'
}
const GROUPINGS = ['by_album', 'flat_ranked', 'artist_rank', 'shuffle', 'ranked_interleave']
const TOP_N_OUTPUTS = [
    { outputMode: 'auto' },
    { outputMode: 'single' },
    { outputMode: 'multiple', targetDuration: 10 * 60 }
]

function describeError(error) {
    // The kind of error always; its text only when the rules threw it themselves (an engine words
    // its own TypeErrors in its own way, and that wording is not a rule).
    const name = error && error.name ? error.name : typeof error
    return name === 'Error' ? { name, message: String(error.message) } : { name }
}

/**
 * @param {{ extractedFiles: Array<{source: string, records: Array}>, measured1: Object, measured2: Object }} inputs
 *   the inputs the repository's own tests passed to the rules (inputs/extracted/*.json) and the two
 *   catalog fixtures of test/fixtures/trackIdentity/
 */
export function runCore({ extractedFiles, measured1, measured2 }) {
    resetCanon()
    const cases = []
    let seed = 0
    const run = (id, kind, fn) => {
        seedRandom(++seed)
        takeLogs()
        let entry
        try {
            entry = { id, kind, output: canon(fn()) }
        } catch (error) {
            entry = { id, kind, error: describeError(error) }
        }
        const logs = takeLogs()
        if (logs.length) entry.logs = logs
        cases.push(entry)
    }

    // ---- the inputs -----------------------------------------------------------------------------
    const extracted = extractedFiles.flatMap(file => file.records.map(record => ({ ...record, source: file.source })))
    const measuredAlbums = measuredAsAlbums(measured1, measured2)
    const rankAlbums = [
        ...handmadeAlbums.map(album => ({ id: `handmade:${album.id}`, album })),
        ...measuredAlbums.map(album => ({ id: `measured:${album.id}`, album })),
        ...dedupe(extracted.filter(r => r.kind === 'rank' && r.replayable), r => JSON.stringify(r.album))
            .map((r, i) => ({ id: `extracted:${r.source}#${i}:${r.name}`, album: r.album }))
    ]
    const albumSets = [
        ...Object.entries(handmadeSets).map(([name, albums]) => ({ id: `handmade:${name}`, albums })),
        { id: 'measured:first-twelve', albums: measuredAlbums.slice(0, 12) },
        { id: 'measured:second-sixteen', albums: measuredAlbums.slice(12) },
        { id: 'measured+handmade:mixed', albums: [measuredAlbums[0], handmadeAlbums[1], measuredAlbums[15], handmadeAlbums[3], measuredAlbums[20]] }
    ]
    const extractedGenerates = dedupe(extracted.filter(r => r.kind === 'generate' && r.replayable), r => JSON.stringify([r.name, r.albums, r.opts, r.rankingStrategy]))
    rememberInputIds([rankAlbums, albumSets, extracted])

    // ---- the registry ---------------------------------------------------------------------------
    run('registry:all', 'registry', () => ({
        algorithms: getAllAlgorithms(),
        recommended: getRecommendedAlgorithm()?.id ?? null,
        strategies: STRATEGY_IDS.map(id => ({ id, cls: createRankingStrategy(id).constructor.name, meta: createRankingStrategy(id).constructor.getMetadata() }))
    }))

    // ---- the models -----------------------------------------------------------------------------
    for (const { id, album } of rankAlbums) {
        run(`model:Album:${id}`, 'model', () => {
            const model = new Album(clone(album))
            if (album.userRanking) model.setUserRankings(clone(album.userRanking))
            const changed = model.ensureRankingIntegrity()
            return { model, changed, acclaim: model.getTracks('acclaim').length, original: model.getTracks().length }
        })
    }
    run('model:Track:bare', 'model', () => [new Track({}), new Track({ title: '  Só  ', duration: '201', rating: '88', position: '3' }, { artist: 'Pitty', title: 'Admirável Chip Novo', albumId: 'x' })])

    // ---- the transformer ------------------------------------------------------------------------
    for (const { id, album } of rankAlbums) {
        run(`transformer:${id}`, 'transformer', () => {
            const tracks = (album.tracks || []).map(track => TrackTransformer.toCanonical(clone(track), { artist: album.artist, album: album.title, albumId: album.id }))
            TrackTransformer.calculateSpotifyRanks(tracks)
            return { tracks, valid: tracks.map(TrackTransformer.isValid) }
        })
    }

    // ---- every ranking strategy, on plain data and on the Album model ----------------------------
    for (const { id, album } of rankAlbums) {
        for (const strategyId of STRATEGY_IDS) {
            run(`rank:${strategyId}:plain:${id}`, 'rank', () => createRankingStrategy(strategyId).rank(clone(album)))
            run(`rank:${strategyId}:model:${id}`, 'rank', () => {
                const model = new Album(clone(album))
                if (album.userRanking) model.setUserRankings(clone(album.userRanking))
                return createRankingStrategy(strategyId).rank(model)
            })
        }
    }

    // ---- every recipe of the registry, with each option that changes the output ------------------
    const recipeIds = getAllAlgorithms().map(a => a.id)
    for (const { id: setId, albums } of albumSets) {
        for (const recipe of recipeIds) {
            if (recipe === 'mjrp-balanced-cascade') {
                for (const strategyId of [null, ...STRATEGY_IDS]) {
                    for (const targetDuration of [undefined, 30 * 60]) {
                        const opts = { targetDuration }
                        if (strategyId) opts.rankingStrategy = createRankingStrategy(strategyId)
                        run(`recipe:${recipe}:${strategyId ?? 'default'}:${targetDuration ?? 'default'}:${setId}`, 'recipe',
                            () => createAlgorithm(recipe, {}).generate(clone(albums), opts))
                    }
                }
                continue
            }
            for (const trackCount of [1, 3, 5]) {
                for (const groupingStrategy of GROUPINGS) {
                    for (const output of TOP_N_OUTPUTS) {
                        const opts = { trackCount, groupingStrategy, ...output }
                        run(`recipe:${recipe}:n${trackCount}:${groupingStrategy}:${output.outputMode}:${setId}`, 'recipe',
                            () => createAlgorithm(recipe, { trackCount }).generate(clone(albums), opts))
                    }
                }
            }
            // The ranking source chosen in the menu overrides the recipe's own
            for (const strategyId of STRATEGY_IDS) {
                run(`recipe:${recipe}:n3:by_album:auto:strategy-${strategyId}:${setId}`, 'recipe',
                    () => createAlgorithm(recipe, { trackCount: 3 }).generate(clone(albums), { rankingStrategy: createRankingStrategy(strategyId) }))
            }
        }
    }
    extractedGenerates.forEach((record, i) => {
        run(`recipe:extracted:${record.source}#${i}:${record.name}`, 'recipe', () => {
            const opts = { ...clone(record.opts) }
            if (record.rankingStrategy) opts.rankingStrategy = new STRATEGY_BY_CLASS[record.rankingStrategy]()
            const recipe = RECIPE_BY_CLASS[record.name] ? createAlgorithm(RECIPE_BY_CLASS[record.name], {}) : new TopNAlgorithm({})
            return recipe.generate(clone(record.albums), opts)
        })
    })

    // ---- the mixins: trimming (Zé's Balanced applies it) and swap balancing (in the same folder) --
    // The TrackEnrichmentMixin of the spike left on 2026-11-20 (dead, and its sort was engine-dependent):
    // the tracks are now made canonical by the transformer, in the album's order.
    const Mixed = applyMixins(BaseAlgorithm, PlaylistBalancingMixin, DurationTrimmingMixin)
    const canonicalTracks = (album) => (album.tracks || [])
        .map(track => TrackTransformer.toCanonical(clone(track), { artist: album.artist, album: album.title, albumId: album.id }))
    for (const { id: setId, albums } of albumSets) {
        run(`mixin:swap+trim:${setId}`, 'mixin', () => {
            const algo = new Mixed({ targetSeconds: 20 * 60 })
            algo.deepCutsMax = 20 * 60
            const playlists = [{ id: 'p1', title: 'One', tracks: [] }, { id: 'p2', title: 'Two', tracks: [] }, { id: 'p3', title: 'Three', tracks: [] }]
            albums.forEach((album, i) => canonicalTracks(album).forEach((track, j) => {
                track.originAlbumId = album.id
                playlists[(i + j) % 3].tracks.push(track)
            }))
            algo.runSwapBalancing(playlists, { targetSeconds: 20 * 60, flexibilitySeconds: 60 })
            algo.trimOverDurationPlaylists(playlists, 0, { maxDuration: 20 * 60 })
            return playlists
        })
    }

    // ---- the album identity rule ----------------------------------------------------------------
    albumVariants.forEach((asked, i) => albumVariants.forEach((candidate, j) => {
        run(`albumIdentity:compare:${i}x${j}`, 'albumIdentity', () => albumIdentity.compareAlbumIdentity(asked, candidate))
    }))
    albumVariants.forEach((asked, i) => {
        run(`albumIdentity:pick:${i}`, 'albumIdentity', () => albumIdentity.pickAlbum(asked, albumVariants))
        run(`albumIdentity:sameName:${i}`, 'albumIdentity', () => albumIdentity.candidatesOfTheSameName(asked, albumVariants))
        run(`albumIdentity:texts:${i}`, 'albumIdentity', () => ({
            plain: albumIdentity.titleWithoutEditionNotes(asked.title),
            search: albumIdentity.titlesToSearch(asked),
            label: albumIdentity.albumFromLabel(`${asked.title} by ${asked.artist}`),
            names: albumIdentity.artistNamesFromLabel(asked.artist),
            kept: albumIdentity.compareKeptAlbum(asked, albumVariants[(i + 1) % albumVariants.length]),
            only: albumIdentity.compareOnlyAnswer(asked, albumVariants[(i + 3) % albumVariants.length]),
            sameArtist: albumVariants.map(other => albumIdentity.sameArtist(asked.artist, other.artist))
        }))
    })
    for (const album of measuredAlbums) {
        run(`albumIdentity:measured:${album.id}`, 'albumIdentity', () => ({
            plain: albumIdentity.titleWithoutEditionNotes(album.title),
            search: albumIdentity.titlesToSearch(album),
            self: albumIdentity.compareAlbumIdentity(album, { artist: album.artist, title: albumIdentity.titleWithoutEditionNotes(album.title) })
        }))
    }

    // ---- the track identity rule ----------------------------------------------------------------
    trackVariantGroups.forEach((group, g) => group.forEach((a, i) => group.forEach((b, j) => {
        run(`trackIdentity:compare:${g}:${i}x${j}`, 'trackIdentity', () => trackIdentity.compareTrackTitles(a, b, { albumPlace: i + 1, sourcePlace: j + 1 }))
    })))
    trackVariantGroups.forEach((group, g) => {
        run(`trackIdentity:match:${g}`, 'trackIdentity', () => trackIdentity.matchTracks(group.map(title => ({ title })), group.slice().reverse().map(title => ({ trackTitle: title }))))
        run(`trackIdentity:text:${g}`, 'trackIdentity', () => group.map(trackIdentity.trackTextOf))
    })
    for (const album of [...measured1.albums, ...measured2.albums]) {
        const tracks = album.tracks.map(title => ({ title }))
        run(`trackIdentity:measured:${album.artist}:${album.album}`, 'trackIdentity', () => ({
            page: trackIdentity.matchTracks(tracks, album.page || []),
            edition: album.pageOfTheEdition ? trackIdentity.matchTracks(tracks, album.pageOfTheEdition.page) : null
        }))
    }

    // ---- the identity calls the repository's own tests make, replayed as recorded ----------------
    const modules = { albumIdentity, trackIdentity }
    dedupe(extracted.filter(r => r.kind === 'call' && r.replayable), r => JSON.stringify([r.name, r.args]))
        .forEach((record, i) => {
            const [moduleName, fn] = record.name.split('.')
            run(`extractedCall:${record.source}#${i}:${record.name}`, record.name.split('.')[0], () => modules[moduleName][fn](...clone(record.args)))
        })

    const counts = {}
    for (const c of cases) counts[c.kind] = (counts[c.kind] || 0) + 1
    return {
        corpus: {
            handmadeAlbums: handmadeAlbums.length, measuredAlbums: measuredAlbums.length,
            rankAlbums: rankAlbums.length, albumSets: albumSets.length,
            extractedRecords: extracted.length, extractedReplayable: extracted.filter(r => r.replayable).length
        },
        counts,
        cases,
        ids: { ...idReport }
    }
}

function dedupe(items, keyOf) {
    const seen = new Set()
    return items.filter(item => {
        const key = keyOf(item)
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })
}

/**
 * The text that is compared, made by the engine under test with its own JSON.stringify: one line
 * per case (so a changed case is one changed line), then one line with the corpus, the counts and
 * the id report.
 */
export function goldenText(result) {
    const head = { corpus: result.corpus, counts: result.counts, ids: result.ids }
    return `${result.cases.map(c => JSON.stringify(c)).join('\n')}\n${JSON.stringify(head)}\n`
}
