/**
 * PhonePlaylists - the generated playlists on the phone (F76, TASK-04, REQ-08).
 *
 * The computer shows every playlist side by side (PlaylistGrid). The phone shows ONE playlist at a
 * time: a strip of chips on top (each chip says the name, how many tracks and how long) switches
 * the playlist, and the tracks of the open one scroll with the page - no box with a scroll of its
 * own. Each track row has its position, title, artist and album, its duration, and a «⋯» of 44 px
 * that opens the named actions of the track (move up, move down, move to another playlist, remove).
 * The actions of the screen (save, export) live in the action bar at the foot.
 *
 * Pure rendering: HTML strings, every outside text escaped. What a tap does is
 * views/playlists/phonePlaylistActions.js. Drawn only when isPhone() (the view asks).
 */
import { escapeHtml } from '../../utils/stringUtils.js'
import { getIcon } from '../Icons.js'

/** The three dots of a «more» button (no such icon in Icons.js; drawn here, never as text). */
const DOTS = '<svg class="phone-dots" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>'

const secondsOf = (tracks = []) => tracks.reduce((sum, track) => sum + (track?.duration || 0), 0)

/** 3:45 */
export function clock(seconds) {
    if (!seconds || seconds <= 0) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${String(secs).padStart(2, '0')}`
}

/** 58 min, or 1 h 12 min */
export function minutes(seconds) {
    const total = Math.round((seconds || 0) / 60)
    if (total < 60) return `${total} min`
    const rest = total % 60
    return rest ? `${Math.floor(total / 60)} h ${rest} min` : `${Math.floor(total / 60)} h`
}

/** The name a playlist is shown by. */
export const playlistNameOf = (playlist, index) => playlist?.title || playlist?.name || `Playlist ${index + 1}`

/** «14 tracks · 58 min» */
export function playlistSummary(playlist) {
    const tracks = playlist?.tracks || []
    const count = `${tracks.length} track${tracks.length === 1 ? '' : 's'}`
    return `${count} · ${minutes(secondsOf(tracks))}`
}

/** The artist and the album of a track, as one line; empty when neither is known. */
const subLineOf = (track) => [track?.artist, track?.album].filter(Boolean).join(' · ')

/** The open playlist: the one asked for, kept inside the set. */
export const activeIndexOf = (playlists, asked) => Math.min(Math.max(Number(asked) || 0, 0), Math.max(playlists.length - 1, 0))

/**
 * The strip of chips scrolled to where it was, and moved only as far as needed for the open chip
 * to be in view (a playlist opened from elsewhere, a redraw).
 * @param {HTMLElement} root - holds the strip
 * @param {number} [left] - where the strip was scrolled to before it was drawn again
 */
export function revealCurrentChip(root, left = 0) {
    const row = root?.querySelector('.phone-pl-chips__row')
    if (!row) return
    row.scrollLeft = left
    const chip = row.querySelector('.phone-pl-chip.is-current')
    if (!chip) return
    const before = chip.offsetLeft < row.scrollLeft
    const after = chip.offsetLeft + chip.offsetWidth > row.scrollLeft + row.clientWidth
    if (before || after) row.scrollLeft = Math.max(chip.offsetLeft - 16, 0)
}

export class PhonePlaylists {
    /**
     * @param {Object} options
     * @param {Array} options.playlists
     * @param {number} [options.active] - the open playlist
     * @returns {string} HTML
     */
    static render({ playlists, active = 0 }) {
        if (!playlists || playlists.length === 0) return ''
        const open = activeIndexOf(playlists, active)
        return `
            <div class="phone-playlists md:hidden" data-phone-playlists>
                ${this.renderChips(playlists, open)}
                ${this.renderPlaylist(playlists[open], open)}
            </div>
        `
    }

    /** The strip of chips: one per playlist, the open one marked. */
    static renderChips(playlists, open) {
        const chips = playlists.map((playlist, index) => `
            <button type="button" class="phone-pl-chip${index === open ? ' is-current' : ''}"
                    data-phone-action="show-playlist" data-playlist-index="${index}"
                    aria-pressed="${index === open ? 'true' : 'false'}">
                <span class="phone-pl-chip__name">${index + 1} · ${escapeHtml(playlistNameOf(playlist, index))}</span>
                <span class="phone-pl-chip__meta">${escapeHtml(playlistSummary(playlist))}</span>
            </button>`).join('')
        return `<nav class="phone-pl-chips" aria-label="Playlists"><div class="phone-pl-chips__row">${chips}</div></nav>`
    }

    /** The open playlist: its title (typed over in place), its totals, its options and its tracks. */
    static renderPlaylist(playlist, index) {
        const name = playlistNameOf(playlist, index)
        const tracks = playlist?.tracks || []
        const rows = tracks.map((track, trackIndex) => this.renderTrack(track, index, trackIndex)).join('')
        return `
            <section class="phone-pl" data-playlist-index="${index}" aria-label="${escapeHtml(name)}">
                <header class="phone-pl__head">
                    <div class="phone-pl__heading">
                        <h2 class="phone-pl__title"><span class="playlist-name" contenteditable="true" role="textbox"
                            aria-label="Title of playlist ${index + 1}" data-playlist-index="${index}"
                            spellcheck="false">${escapeHtml(name)}</span></h2>
                        <p class="phone-pl__meta">Playlist ${index + 1} of the set · ${escapeHtml(playlistSummary(playlist))}</p>
                    </div>
                    <button type="button" class="phone-more" data-phone-action="playlist-options" data-playlist-index="${index}"
                            aria-label="Options for playlist ${escapeHtml(name)}">${DOTS}</button>
                </header>
                <ol class="playlist-tracks phone-tracks" data-playlist-index="${index}">
                    ${rows || '<li class="phone-tracks__empty">No tracks in this playlist</li>'}
                </ol>
            </section>
        `
    }

    /** One track: position (the handle to drag by), title, artist · album, duration, «⋯». */
    static renderTrack(track, playlistIndex, trackIndex) {
        const title = track?.title || 'Untitled'
        const sub = subLineOf(track)
        return `
            <li class="track-row phone-track" data-playlist-index="${playlistIndex}" data-track-index="${trackIndex}">
                <span class="phone-track__pos" aria-hidden="true">${trackIndex + 1}${getIcon('GripVertical', 'phone-track__grip')}</span>
                <span class="phone-track__text">
                    <span class="phone-track__title">${escapeHtml(title)}</span>
                    ${sub ? `<span class="phone-track__sub">${escapeHtml(sub)}</span>` : ''}
                </span>
                <span class="phone-track__time">${clock(track?.duration)}</span>
                <button type="button" class="phone-more" data-phone-action="track-options"
                        data-playlist-index="${playlistIndex}" data-track-index="${trackIndex}"
                        aria-label="Options for ${escapeHtml(title)}">${DOTS}</button>
            </li>
        `
    }

    /**
     * The action bar at the foot: Export (it opens a sheet with Spotify, Apple Music and JSON) and
     * Save, the main action of the screen.
     * @param {Object} state
     * @param {boolean} [state.isSaving]
     */
    static renderActionBar({ isSaving = false } = {}) {
        const save = isSaving
            ? `<button type="button" class="btn btn-primary" data-phone-action="save" disabled aria-busy="true">${getIcon('Loader', 'w-5 h-5 animate-spin')} Saving...</button>`
            : `<button type="button" class="btn btn-primary" data-phone-action="save">${getIcon('Cloud', 'w-5 h-5')} Save</button>`
        return `
            <div class="phone-action-bar phone-pl-bar md:hidden">
                <button type="button" class="btn btn-secondary" data-phone-action="export">${getIcon('Share', 'w-5 h-5')} Export</button>
                ${save}
            </div>
        `
    }

    /**
     * The top of the screen in one line (recheck N3): the batch name - the same field as the
     * computer's (#batchNameInput: saved from, kept while typing) - and undo and redo as two named
     * icons of 44 px. The reconfigure panel stays reachable from the «⋯» of the playlist.
     * @param {Object} state
     * @param {string} [state.name] - the name on screen
     * @param {string} [state.defaultName] - shown when nothing was typed, as the computer does
     */
    static renderNameRow({ name = '', defaultName = '', canUndo = false, canRedo = false } = {}) {
        const button = (action, icon, label, enabled) => `
            <button type="button" class="phone-history__btn" data-action="${action}" aria-label="${label}" ${enabled ? '' : 'disabled'}>
                ${getIcon(icon, 'w-5 h-5')}
            </button>`
        return `
            <div id="batchNameSection" class="phone-batch md:hidden">
                <label for="batchNameInput" class="phone-batch__label">Batch name</label>
                <div class="phone-batch__row">
                    <input type="text" id="batchNameInput" class="phone-batch__input" autocomplete="off"
                           value="${escapeHtml(name || defaultName || '')}" placeholder="Name this batch">
                    ${button('undo-edit', 'Undo', 'Undo the last change', canUndo)}
                    ${button('redo-edit', 'Redo', 'Redo the change that was undone', canRedo)}
                </div>
            </div>
        `
    }
}
