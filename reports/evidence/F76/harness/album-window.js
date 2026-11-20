/**
 * F76 harness: the album window and «my ranking» drawn by the REAL components with fixture data
 * (long titles, 16 tracks), the app's own stylesheets in the app's order. Nothing is saved.
 */
import '/css/index.css'
import '/css/tailwind.css'
import '/css/mobile.css'
import '/css/mobile/screens.css'
import '/css/safe-area.css'
import { showViewAlbumModal } from '/js/components/ViewAlbumModal.js'
import { UserRankModal } from '/js/components/ranking/UserRankModal.js'
// the phone's ranking module only exists after F76: asked for only by the screens that need it
const phoneRanking = () => import('/js/components/ranking/rankWindowPhone.js')

const COVER = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1e3a8a"/><stop offset=".55" stop-color="#0ea5e9"/><stop offset="1" stop-color="#f8fafc"/></linearGradient></defs>
<rect width="400" height="400" fill="url(#g)"/><circle cx="270" cy="140" r="70" fill="#f8fafc" opacity=".85"/><rect x="40" y="300" width="320" height="10" fill="#0f172a" opacity=".6"/></svg>`)

const TITLES = [
    'Speak to Me', 'Breathe (In the Air)', 'On the Run', 'Time / Breathe (Reprise)', 'The Great Gig in the Sky',
    'Money', 'Us and Them', 'Any Colour You Like', 'Brain Damage', 'Eclipse',
    'Shine On You Crazy Diamond (Parts I–V)', 'Welcome to the Machine', 'Have a Cigar', 'Wish You Were Here',
    'Shine On You Crazy Diamond (Parts VI–IX)', 'Echoes (Live at Pompeii, Remastered 2016 Edition)'
]
const tracks = TITLES.map((title, i) => ({
    title, position: i + 1, duration: 120 + (i * 37) % 420,
    rank: i % 5 === 4 ? null : ((i * 7) % 16) + 1,
    spotifyPopularity: i % 6 === 5 ? null : 30 + (i * 13) % 65,
    spotifyRank: i % 6 === 5 ? null : ((i * 5) % 16) + 1,
    rating: 80 + (i % 10)
}))
const album = {
    id: 'pf_long', title: 'The Dark Side of the Moon (50th Anniversary Remastered Deluxe Edition)', artist: 'Pink Floyd',
    year: 1973, coverUrl: COVER, tracks, tracksOriginalOrder: tracks, tracksByAcclaim: tracks
}
const item = {
    id: 'inv-1', title: album.title, artist: album.artist, format: 'cd', owned: true, purchasePrice: 89.9, currency: 'BRL',
    condition: 'Near Mint', notes: 'Bought at a fair in São Paulo; the booklet has a small tear.', albumData: album
}
const value = {
    view: () => ({
        value: {
            origin: 'discogs', currency: 'USD', readAt: '2026-11-19T12:00:00Z',
            conditions: { mint: 42.5, nearMint: 31, veryGoodPlus: 18.75 },
            release: { title: 'The Dark Side Of The Moon', url: 'https://www.discogs.com/release/1' }
        },
        money: { currency: 'USD' }, source: 'on', busy: false
    }),
    onWrite: async () => true, onForget: () => { }, onRead: async () => { }
}

const screen = new URLSearchParams(location.search).get('screen') || 'album'
const rank = () => {
    const modal = new UserRankModal({ album: { ...album, tracks }, onSubmit: async () => true })
    modal.show()
    window.rankModal = modal
    return modal
}
const SCREENS = {
    album: () => showViewAlbumModal(album),
    inventory: () => showViewAlbumModal(item, { value }),
    rank,
    'rank-picked': async () => { const p = await phoneRanking(); const m = rank(); p.pickTrack(m, tracks[11].title); p.moveBy(m, -1) },
    'rank-moveto': async () => { const p = await phoneRanking(); const m = rank(); p.pickTrack(m, tracks[13].title); p.openMoveTo(m) },
    'rank-reset': async () => { const p = await phoneRanking(); const m = rank(); m.moveTrack(5, 0); p.resetWithUndo(m) }
}
Promise.resolve(SCREENS[screen]()).then(() => { window.harnessReady = true })
