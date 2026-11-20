// The small rewrites the spike tries, applied ONLY when S1_PATCHES=1, to the site's file as it is
// read (by Node's load hook and by esbuild's onLoad): the site's files on disk are not changed.
// Each `find` must occur exactly once, or the run fails.
//
// P1 · TrackEnrichmentMixin's sort compares the rating only when BOTH tracks have one (and the
// score likewise), else falls to the album order. A track with no rating is then «before» some rated
// tracks and «after» others: the comparator is not a consistent order, and ECMAScript leaves the
// result of such a sort to the engine (V8 and Hermes do differ, measured). The rewrite puts a track
// with no rating after every rated track, which makes the order total. 2 lines.
export const PATCHES = [
    {
        id: 'P1',
        file: 'public/js/algorithms/mixins/TrackEnrichmentMixin.js',
        find: 'if (ratingB !== null && ratingA !== null && ratingB !== ratingA) return ratingB - ratingA',
        replace: 'if (ratingA !== ratingB) return ratingA === null ? 1 : ratingB === null ? -1 : ratingB - ratingA'
    },
    {
        id: 'P1',
        file: 'public/js/algorithms/mixins/TrackEnrichmentMixin.js',
        find: 'if (scoreB !== null && scoreA !== null && scoreB !== scoreA) return scoreB - scoreA',
        replace: 'if (scoreA !== scoreB) return scoreA === null ? 1 : scoreB === null ? -1 : scoreB - scoreA'
    }
]

export function applyPatches(relativeFile, source) {
    let out = source
    for (const patch of PATCHES.filter(p => p.file === relativeFile)) {
        const count = out.split(patch.find).length - 1
        if (count !== 1) throw new Error(`patch ${patch.id} on ${relativeFile}: found ${count} times`)
        out = out.replace(patch.find, patch.replace)
    }
    return out
}
