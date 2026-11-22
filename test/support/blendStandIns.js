/**
 * The world outside the Blend screen, as stand-ins (F83 wave 7b): the stores and services the screen reads, the controller that generates, the
 * toast and the router. The tests that play test/support/blendScenarios.js mock the real modules with these (`vi.mock` is hoisted per file, so each
 * test file says it; this file gives the factories). The same stand-ins serve the hand-made screen (to capture the old pages) and the React one
 * (to compare), so what differs between the two is never the world.
 *
 * `world` is what a scenario sets (the series, whether the person is signed in, how the covers come, how the generation answers) and `world.calls`
 * is what the screen asked of the world, in order (the read of the series, the generation with its whole configuration, the toasts, the move to the
 * playlists). No import from the app: the doubles are loaded by `vi.mock`.
 */

/** @type {{ series: any[], db: object|null, load: string, cover: string, generate: string, progress: string[], notices: string[], count: number, calls: string[], pending: Array<() => void>, waiting: (() => void)|null, release: (() => void)|null, loaded: () => void, arrive: () => void }} */
export const world = {
    series: [],
    /** `null` is a visitor (no database): the screen reads what the store already has. */
    db: { name: 'db' },
    /** How the read of the series answers: `now`, `wait` (a promise `world.loaded()` settles), or `fails`. */
    load: 'now',
    /** How a cover comes: `now`, `wait` (settled by `world.arrive()`), or `none` (the album is not in the local set). */
    cover: 'now',
    /** How the generation answers: `ok`, `hold` (waits for `world.release()`), `none` (no album ready), `fails`, or `cancel` (waits for the abort). */
    generate: 'ok',
    progress: [],
    notices: [],
    count: 4,
    calls: [],
    pending: [],
    waiting: null,
    release: null,
    loaded: () => {},
    arrive: () => {}
}

export function reset(overrides = {}) {
    Object.assign(world, { series: [], db: { name: 'db' }, load: 'now', cover: 'now', generate: 'ok', progress: [], notices: [], count: 4, calls: [], pending: [], waiting: null, release: null }, overrides)
}

const sorted = (config) => JSON.stringify(Object.fromEntries(Object.entries(config).sort(([a], [b]) => a.localeCompare(b))))

/** The read of the series settles (a scenario that waited). */
world.loaded = () => { world.waiting?.(); world.waiting = null }
/** Every cover that waited arrives. */
world.arrive = () => { world.pending.splice(0).forEach(settle => settle()) }

export const seriesStore = () => ({
    albumSeriesStore: { getDb: () => world.db, getUserId: () => 'u1', getSeries: () => world.series }
})

export const seriesService = () => ({
    getSeriesService: () => ({
        loadFromFirestore: () => {
            world.calls.push('loadFromFirestore')
            if (world.load === 'fails') return Promise.reject(new Error('offline'))
            if (world.load === 'wait') return new Promise(resolve => { world.waiting = resolve })
            return Promise.resolve()
        }
    })
})

export const albumLoader = () => ({
    optimizedAlbumLoader: {
        findAlbum: (artist, album) => {
            world.calls.push(`findAlbum ${artist} / ${album}`)
            if (world.cover === 'none') return Promise.resolve(null)
            const found = { artist, album }
            if (world.cover === 'wait') return new Promise(resolve => world.pending.push(() => resolve(found)))
            return Promise.resolve(found)
        },
        getArtworkUrl: (found, size) => `https://covers.test/${found.artist}/${found.album}/${size}.jpg`
    }
})

export const controller = () => ({
    BlendCancelledError: class extends Error { constructor() { super('The blend was cancelled'); this.name = 'BlendCancelledError' } },
    blendingController: {
        generateFromSeries: async (seriesId, config, { onProgress = () => {}, signal = null } = {}) => {
            world.calls.push(`generate ${seriesId} ${sorted(config)}`)
            signal?.addEventListener('abort', () => world.calls.push('aborted'))
            for (const message of world.progress) { onProgress(message); await Promise.resolve() }
            if (world.generate === 'hold') await new Promise(resolve => { world.release = resolve })
            if (world.generate === 'cancel') await new Promise((_, reject) => signal.addEventListener('abort', () => reject(Object.assign(new Error('The blend was cancelled'), { name: 'BlendCancelledError' }))))
            if (world.generate === 'none') throw new Error('None of the 4 albums could be loaded.')
            if (world.generate === 'fails') throw new Error('Something <b>broke</b> & failed')
            return { playlists: new Array(world.count).fill({}), notices: world.notices }
        }
    }
})

export const toastStandIn = () => ({
    default: {
        success: (message) => world.calls.push(`toast.success ${message}`),
        warning: (message, ms) => world.calls.push(`toast.warning ${message} ${ms}`),
        error: (message) => world.calls.push(`toast.error ${message}`),
        info: (message) => world.calls.push(`toast.info ${message}`)
    }
})
