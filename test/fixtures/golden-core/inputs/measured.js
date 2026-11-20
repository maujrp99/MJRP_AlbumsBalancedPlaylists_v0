// Real catalog albums as the rules see them: the 28 albums of the repository's identity fixtures
// (test/fixtures/trackIdentity/measuredAlbums*.json — the track titles Apple Music gives and the
// BestEverAlbums page of each, read on 2026-11-19/20). They are public catalog data, not the
// owner's. What the fixtures do not carry is filled in by a fixed formula, and said here:
// - duration: 150 + (place * 37) % 240 seconds (the fixtures have titles only);
// - Spotify popularity: on every second album only, (title length * 7) % 100, so both the albums
//   with and without popularity are exercised.
// The tracks have NO id, as the albums the app loads before they are saved: the id generator runs.
export function measuredAsAlbums(...fixtures) {
    const albums = []
    for (const fixture of fixtures) {
        for (const entry of fixture.albums) {
            const i = albums.length
            const withPopularity = i % 2 === 0
            const page = entry.pageOfTheEdition?.page?.length ? entry.pageOfTheEdition.page : (entry.page || [])
            albums.push({
                id: `measured-${i + 1}`,
                title: entry.album,
                artist: entry.artist,
                tracks: entry.tracks.map((title, place) => {
                    const track = { title, position: place + 1, duration: 150 + ((place * 37) % 240) }
                    if (withPopularity) track.spotifyPopularity = (title.length * 7) % 100
                    return track
                }),
                bestEverEvidence: page.map(row => ({ trackTitle: row.trackTitle, rating: row.rating ?? null }))
            })
        }
    }
    return albums
}
