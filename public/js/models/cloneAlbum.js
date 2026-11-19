/**
 * cloneAlbum
 *
 * A copy of an Album that is safe to change: the album and each of its tracks are new objects of the
 * same class, so nothing published before is mutated (arch.md, "Carga da tela de álbuns", seção 15.5).
 */

const copyOf = (object) => Object.assign(Object.create(Object.getPrototypeOf(object)), object)

/**
 * @param {Album} album
 * @returns {Album} a new Album with new Track objects
 */
export function cloneAlbum(album) {
    const copy = copyOf(album)
    const byOriginal = new Map()
    const cloneTrack = (track) => {
        if (!byOriginal.has(track)) {
            byOriginal.set(track, Object.assign(copyOf(track), { metadata: { ...track.metadata } }))
        }
        return byOriginal.get(track)
    }
    copy.tracks = (album.tracks || []).map(cloneTrack)
    copy.tracksOriginalOrder = (album.tracksOriginalOrder || []).map(cloneTrack)
    if (album.seriesIds) copy.seriesIds = [...album.seriesIds]
    if (album.acclaim) copy.acclaim = { ...album.acclaim }
    if (album.metadata) copy.metadata = { ...album.metadata }
    return copy
}
