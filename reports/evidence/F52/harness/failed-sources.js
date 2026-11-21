/**
 * UAT-244 (F52) and UAT-245 (F69), browser proof: the real album window (ViewAlbumModal, real
 * TracksRankingComparison, real CSS) with the fixture of the visual recheck, and a stand-in for the
 * album load that says one source failed. ?fail=ratings | popularity | both | none
 * «Try again» asks the stand-in, which moves the source to loading and then to done, as the load does.
 */
import '../../../../public/js/services/platform/platformWiring.js'
import '../../../../public/css/index.css'
import '../../../../public/css/tailwind.css'
import '../../../../public/css/modals.css'
import '../../../../public/css/mobile.css'
import '../../../../public/css/mobile/screens.css'
import '../../../../public/css/safe-area.css'
import { showViewAlbumModal } from '../../../../public/js/components/ViewAlbumModal.js'
import { Album } from '../../../../public/js/models/Album.js'

const ORIGINAL = [
    ['21st Century Schizoid Man (including Mirrors)', 442], ['I Talk to the Wind', 365],
    ['Epitaph (including March for No Reason and Tomorrow and Tomorrow)', 536], ['Moonchild (including The Dream and The Illusion)', 725]
].map(([title, duration], i) => ({ title, duration, position: i + 1 }))

// No spotifyId: the popularity line only shows for an album that has none on it
const album = new Album({
    id: 'kc_expanded', title: 'In the Court of the Crimson King', artist: 'King Crimson', year: 1969,
    tracksOriginalOrder: ORIGINAL, tracksByAcclaim: []
})

const fail = new URLSearchParams(location.search).get('fail') || 'both'
let state = {
    ratings: fail === 'ratings' || fail === 'both' ? 'failed' : 'done',
    popularity: fail === 'popularity' || fail === 'both' ? 'failed' : 'done'
}
const listeners = new Set()
const set = (next) => { state = { ...state, ...next }; listeners.forEach(listener => listener()) }

const sources = {
    read: () => state,
    ask: (albumId, source) => {
        const key = source === 'acclaim' ? 'ratings' : 'popularity'
        set({ [key]: 'loading' })
        setTimeout(() => set({ [key]: 'done' }), 400)
    },
    watch: (listener) => { listeners.add(listener); return () => listeners.delete(listener) }
}

showViewAlbumModal(album, { sources }).then(() => { window.harnessReady = true })
