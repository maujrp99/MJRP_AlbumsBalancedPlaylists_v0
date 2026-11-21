/**
 * Visual recheck batch (2026-11-21): the album window and «my ranking», real components, fixture data.
 * In the Court of the Crimson King (Expanded Edition): 5 original tracks with BestEverAlbums rating
 * and rank, 3 extra tracks without; durations in SECONDS (models/Track.js).
 */
// app.js imports this first: the id port gets its browser source (F78); without it a Track cannot be made
import '../../../../../../public/js/services/platform/platformWiring.js'
import '../../../../../../public/css/index.css'
import '../../../../../../public/css/tailwind.css'
import '../../../../../../public/css/modals.css'
import '../../../../../../public/css/mobile.css'
import '../../../../../../public/css/mobile/screens.css'
import '../../../../../../public/css/safe-area.css'
import { showViewAlbumModal } from '../../../../../../public/js/components/ViewAlbumModal.js'
import { UserRankModal } from '../../../../../../public/js/components/ranking/UserRankModal.js'
import { Album } from '../../../../../../public/js/models/Album.js'

const COVER = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7f1d1d"/><stop offset=".55" stop-color="#ea580c"/><stop offset="1" stop-color="#fde68a"/></linearGradient></defs>
<rect width="400" height="400" fill="url(#g)"/><circle cx="200" cy="170" r="90" fill="#0f172a" opacity=".55"/></svg>`)

const ORIGINAL = [
    ['21st Century Schizoid Man (including Mirrors)', 442], ['I Talk to the Wind', 365],
    ['Epitaph (including March for No Reason and Tomorrow and Tomorrow)', 536], ['Moonchild (including The Dream and The Illusion)', 725],
    ['The Court of the Crimson King (including The Return of the Fire Witch and The Dance of the Puppets)', 561],
    ['I Talk to the Wind (Duo Version)', 280], ['Epitaph (Backing Track)', 497], ['21st Century Schizoid Man (Alternate Mix)', 412]
].map(([title, duration], i) => ({ title, duration, position: i + 1, spotifyPopularity: i < 5 ? [61, 55, 58, 40, 50][i] : null }))
const ACCLAIM = [
    ['Epitaph (including March for No Reason and Tomorrow and Tomorrow)', 90, 1], ['21st Century Schizoid Man (including Mirrors)', 86, 2],
    ['The Court of the Crimson King (including The Return of the Fire Witch and The Dance of the Puppets)', 80, 3],
    ['I Talk to the Wind', 78, 4], ['Moonchild (including The Dream and The Illusion)', 62, 5]
].map(([title, rating, rank]) => ({ title, rating, rank }))

const album = new Album({
    id: 'kc_expanded', title: 'In the Court of the Crimson King (Expanded Edition)', artist: 'King Crimson', year: 1969, coverUrl: COVER,
    bestEverAlbumId: '1', spotifyId: 'sp1', tracksOriginalOrder: ORIGINAL, tracksByAcclaim: ACCLAIM
})

const screen = new URLSearchParams(location.search).get('screen') || 'album'
const SCREENS = {
    album: () => showViewAlbumModal(album),
    rank: () => { const modal = new UserRankModal({ album, onSubmit: async () => true }); modal.show(); window.rankModal = modal }
}
Promise.resolve(SCREENS[screen]()).then(() => { window.harnessReady = true })
