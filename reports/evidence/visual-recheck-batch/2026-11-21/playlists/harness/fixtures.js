/** Fixture data for the harness: long titles, 6 playlists of 10 to 30 tracks, 12 series of batches. */
const ARTISTS = [
    ['King Crimson', 'In the Court of the Crimson King (An Observation by King Crimson)'],
    ['Pink Floyd', 'Wish You Were Here'],
    ['Yes', 'Close to the Edge'],
    ['Genesis', 'Selling England by the Pound'],
    ['Emerson, Lake & Palmer', 'Brain Salad Surgery'],
    ['Jethro Tull', 'Thick as a Brick'],
    ['Rush', 'Moving Pictures'],
    ['Camel', 'The Snow Goose']
]
const TITLES = ['21st Century Schizoid Man (Including "Mirrors")', 'Shine On You Crazy Diamond (Parts I-V)', 'And You and I', 'Firth of Fifth',
    'Karn Evil 9: 1st Impression, Part 2', 'Thick as a Brick, Part I', 'Tom Sawyer', 'Rhayader Goes to Town', 'Epitaph', 'Have a Cigar',
    'Siberian Khatru', 'The Cinema Show', 'Still... You Turn Me On', 'Red Barchetta', 'Moonchild', 'Welcome to the Machine',
    'Dancing with the Moonlit Knight', 'YYZ', 'I Talk to the Wind', 'Limelight']
const NAMES = ['Greatest Hits Vol. 1', 'Deep Cuts and Hidden Gems', 'The Long Ones', 'Sunday Morning', 'Night Drive Through the Mountains', 'Closers']
const SIZES = [14, 22, 10, 30, 17, 12]

const trackAt = (i, p) => {
    const [artist, album] = ARTISTS[(i + p) % ARTISTS.length]
    return {
        id: `t${p}-${i}`, title: TITLES[(i * 3 + p) % TITLES.length], artist, album,
        duration: 150 + ((i * 37 + p * 53) % 600), rank: (i % 9) + 1, rating: 70 + (i % 30), spotifyPopularity: 40 + (i % 60)
    }
}

export function generatedPlaylists() {
    return NAMES.map((name, p) => ({ id: `pl${p}`, name, title: name, tracks: Array.from({ length: SIZES[p] }, (_, i) => trackAt(i, p)) }))
}

const SERIES = ['Prog Rock Classics', 'Alternative R&B / Psychedelic / Avant-Garde Soul of the Seventies', 'Brazilian Jazz', 'The Beatles',
    'Krautrock Essentials', 'Classic Rock', 'Jazz Fusion', 'Shoegaze & Dream Pop', 'Post-Punk', 'MPB Anos 70', 'Electronic Pioneers', 'Singer-Songwriters']
const BATCHES = ['Sunday Morning Prog Rock Deep Cuts - Extended Remastered Collection Vol. 3', 'Road trip', 'Balanced Cascade 120 min',
    'Night drive', 'Greatest Hits by the Critics (BestEverAlbums)', 'Party']

export function savedSeries() {
    return SERIES.map((name, s) => {
        const playlists = []
        const batchCount = 2 + (s % 5)
        for (let b = 0; b < batchCount; b++) {
            const batchName = BATCHES[(s + b) % BATCHES.length] + (b > 3 ? ` ${b}` : '')
            for (let p = 0; p < 3 + ((s + b) % 4); p++) {
                playlists.push({
                    id: `s${s}b${b}p${p}`, name: NAMES[p % NAMES.length], batchName, savedAt: `2026-1${b % 2}-0${1 + b}T10:00:00Z`,
                    tracks: Array.from({ length: 10 + (p * 3) % 12 }, (_, i) => trackAt(i, p + s))
                })
            }
        }
        return { id: `Jp93LzaU${s}x`, name, playlists }
    })
}
