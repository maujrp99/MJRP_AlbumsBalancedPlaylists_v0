/**
 * Independent visual recheck of UAT-244 (F52) and UAT-245 (F69): the real album window
 * (ViewAlbumModal, TracksRankingComparison, real CSS), with a stand-in for the album load.
 * ?fail=ratings|popularity|both  &retry=done|failed (what the second ask answers)  &spotify=1 (album has a spotifyId)
 */
import '../../../../../public/js/services/platform/platformWiring.js'
import '../../../../../public/css/index.css'
import '../../../../../public/css/tailwind.css'
import '../../../../../public/css/modals.css'
import '../../../../../public/css/mobile.css'
import '../../../../../public/css/mobile/screens.css'
import '../../../../../public/css/safe-area.css'
import { showViewAlbumModal } from '../../../../../public/js/components/ViewAlbumModal.js'
import { Album } from '../../../../../public/js/models/Album.js'

const q = new URLSearchParams(location.search)
const ORIGINAL = [
    ['21st Century Schizoid Man (including Mirrors)', 442], ['I Talk to the Wind', 365],
    ['Epitaph (including March for No Reason and Tomorrow and Tomorrow)', 536], ['Moonchild (including The Dream and The Illusion)', 725],
    ['The Court of the Crimson King (including The Return of the Fire Witch and The Dance of the Puppets)', 566]
].map(([title, duration], i) => ({ title, duration, position: i + 1 }))
const album = new Album({
    id: 'kc', title: 'In the Court of the Crimson King', artist: 'King Crimson', year: 1969,
    spotifyId: q.get('spotify') ? 'sp123' : undefined, tracksOriginalOrder: ORIGINAL, tracksByAcclaim: []
})
const fail = q.get('fail') || 'both'
const retry = q.get('retry') || 'done'
let state = {
    ratings: fail === 'ratings' || fail === 'both' ? 'failed' : 'done',
    popularity: fail === 'popularity' || fail === 'both' ? 'failed' : 'done'
}
const listeners = new Set()
const set = (next) => { state = { ...state, ...next }; window.harnessState = state; listeners.forEach(l => l()) }
window.harnessState = state
const sources = {
    read: () => state,
    ask: (albumId, source) => {
        const key = source === 'acclaim' ? 'ratings' : 'popularity'
        set({ [key]: 'pending' })
        setTimeout(() => set({ [key]: 'loading' }), 300)
        setTimeout(() => set({ [key]: retry }), 1500)
    },
    watch: (l) => { listeners.add(l); return () => listeners.delete(l) }
}
showViewAlbumModal(album, { sources }).then(() => { window.harnessReady = true })
