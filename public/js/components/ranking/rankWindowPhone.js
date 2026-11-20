/**
 * The ranking window («my ranking») on the phone (F76, REQ-07; audit finding 14).
 *
 * What the computer has, laid out for a finger: a bar with Back and Reset; the album, the hint and
 * the tracks in one body that scrolls; Save always in view at the foot. Each track has its title on
 * a line of its own (it wraps), the BEA and Spotify references and the duration below it, and a
 * handle to drag it. A track also moves WITHOUT dragging (WCAG 2.2, SC 2.5.7): tap it, and the foot
 * offers Up, Down and «Move to…» (a sheet with the numbers). Reset can be undone for 5 seconds.
 *
 * Drawn by UserRankModal only when isPhone(); the window draws itself again when the screen stops
 * (or starts) being a phone. The state (the order, the track picked) is the modal's.
 * Styles: public/css/mobile/ranking.css.
 */
import { SafeDOM } from '../../utils/SafeDOM.js'
import { getIcon } from '../Icons.js'
import { formatDuration } from '../../utils/duration.js'
import { openSheet } from '../ui/Sheet.js'

/** The text of the window, in one place. */
export const RANK_PHONE_TEXT = Object.freeze({
    title: 'My ranking',
    hint: 'Tap a track to move it with the buttons below, or drag it by its handle.',
    note: 'BEA and Spotify ranks are shown for reference. Your ranking is used by the "Top Tracks by My Own Ranking" recipe.',
    reset: 'Back to the order of the album.',
    undo: 'Undo',
    discardTitle: 'Discard changes?',
    discardNote: 'Your new order has not been saved.',
    keepEditing: 'Keep editing',
    discard: 'Discard'
})

const icon = (name, className = 'rank-icon') => SafeDOM.fromHTML(getIcon(name, className))
const idOf = (track) => track.id || track.title
const hasRank = (value) => Boolean(value) && value < 999
const button = (className, label, onClick, children) =>
    SafeDOM.button({ className, 'aria-label': label, onClick }, children)

/** Where the track picked is in the order, or -1. */
export const pickedIndex = (modal) => modal.rankedOrder.findIndex(track => idOf(track) === modal.pickedId)

/** What is said of a track below its title: its BEA rank, its Spotify rank, its duration. */
export function referencesOf(track) {
    return [
        hasRank(track.rank) ? `BEA #${track.rank}` : null,
        hasRank(track.spotifyRank) ? `Spotify #${track.spotifyRank}` : null,
        formatDuration(track.duration)
    ].filter(Boolean).join(' · ')
}

/** One track: the button that picks it (number, title, references) and the handle to drag it. */
export function renderPhoneRow(modal, track, index) {
    const picked = modal.pickedId === idOf(track)
    const pick = SafeDOM.button({
        className: 'rank-row__pick',
        'aria-pressed': String(picked),
        onClick: () => pickTrack(modal, idOf(track))
    }, [
        SafeDOM.span({ className: 'rank-row__number', dataset: { role: 'rank-number' } }, String(index + 1)),
        SafeDOM.span({ className: 'rank-row__text' }, [
            SafeDOM.span({ className: 'rank-row__title' }, track.title),
            SafeDOM.span({ className: 'rank-row__refs' }, referencesOf(track))
        ])
    ])
    const handle = SafeDOM.span({ className: 'rank-row__handle', 'aria-hidden': 'true' }, icon('GripVertical'))
    return SafeDOM.li({ className: `rank-row${picked ? ' is-picked' : ''}`, 'data-track-id': idOf(track) }, [pick, handle])
}

function renderBar(modal) {
    return SafeDOM.div({ className: 'rank-phone__bar' }, [
        SafeDOM.button({ className: 'rank-phone__back', onClick: () => modal.requestClose() }, [icon('ChevronRight', 'rank-icon rank-icon--back'), 'Back']),
        SafeDOM.create('h2', { id: 'rankPhoneTitle', className: 'rank-phone__title' }, RANK_PHONE_TEXT.title),
        SafeDOM.button({ className: 'rank-phone__reset', onClick: () => resetWithUndo(modal) }, [icon('Undo'), 'Reset'])
    ])
}

function renderBody(modal) {
    const list = SafeDOM.create('ol', { id: 'rank-track-list', className: 'rank-phone__list' },
        modal.rankedOrder.map((track, index) => renderPhoneRow(modal, track, index)))
    return SafeDOM.div({ className: 'rank-phone__body' }, [
        SafeDOM.div({ className: 'rank-phone__intro' }, [
            SafeDOM.p({ className: 'rank-phone__album' }, modal.album.title),
            SafeDOM.p({ className: 'rank-phone__artist' }, modal.album.artist),
            SafeDOM.p({ className: 'rank-phone__hint' }, RANK_PHONE_TEXT.hint)
        ]),
        list,
        SafeDOM.p({ className: 'rank-phone__note' }, RANK_PHONE_TEXT.note)
    ])
}

function renderFoot(modal) {
    const mover = SafeDOM.div({ className: 'rank-phone__mover', role: 'group', 'aria-label': 'Move the track', hidden: true }, [
        button('rank-phone__move', 'Move up', () => moveBy(modal, -1), [icon('ArrowUp'), 'Up']),
        button('rank-phone__move', 'Move down', () => moveBy(modal, 1), [icon('ArrowUp', 'rank-icon rank-icon--down'), 'Down']),
        SafeDOM.button({ className: 'rank-phone__move', onClick: () => openMoveTo(modal) }, 'Move to…'),
        SafeDOM.button({ className: 'rank-phone__move rank-phone__done', onClick: () => pickTrack(modal, null) }, 'Done')
    ])
    const save = SafeDOM.button({ className: 'btn btn-primary rank-phone__save', onClick: () => modal.save() }, [icon('Save'), 'Save ranking'])
    return SafeDOM.div({ className: 'rank-phone__foot' }, [mover, save])
}

/** The whole window on the phone. */
export function renderPhoneWindow(modal) {
    const panel = SafeDOM.div({
        className: 'glass-panel flex flex-col fullscreen-modal rank-phone',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': 'rankPhoneTitle'
    }, [
        renderBar(modal),
        renderBody(modal),
        renderFoot(modal),
        SafeDOM.div({ className: 'sr-only', 'aria-live': 'polite', dataset: { role: 'rank-live' } })
    ])
    return SafeDOM.div({ className: 'rank-window rank-window--phone fixed inset-0 z-50 flex' }, panel)
}

/** Says, to a screen reader, what just happened. */
function announce(modal, text) {
    const live = modal.modalElement?.querySelector('[data-role="rank-live"]')
    if (live) live.textContent = text
}

/** The list drawn again, the foot told of the track picked, and that track kept in view and in focus. */
export function refreshPhone(modal) {
    modal._updateTrackList()
    const at = pickedIndex(modal)
    const foot = modal.modalElement?.querySelector('.rank-phone__mover')
    if (foot) {
        foot.hidden = at < 0
        const [up, down] = foot.querySelectorAll('.rank-phone__move')
        up.disabled = at <= 0
        down.disabled = at < 0 || at >= modal.rankedOrder.length - 1
    }
    if (at < 0) return
    const row = modal.modalElement?.querySelectorAll('.rank-row__pick')[at]
    row?.focus({ preventScroll: true })
    row?.scrollIntoView?.({ block: 'nearest' })
}

/** Picks a track (or lets it go: the same track again, or null). */
export function pickTrack(modal, id) {
    modal.pickedId = id && modal.pickedId !== id ? id : null
    refreshPhone(modal)
}

function moveTo(modal, from, to) {
    if (!modal.moveTrack(from, to)) return
    const track = modal.rankedOrder[to]
    refreshPhone(modal)
    announce(modal, `${track.title} is now number ${to + 1}`)
}

/** The track picked one place up (-1) or down (+1). */
export function moveBy(modal, step) {
    const from = pickedIndex(modal)
    if (from >= 0) moveTo(modal, from, from + step)
}

/** «Move to…»: the numbers in a sheet from the bottom; one tap and the track goes there. */
export function openMoveTo(modal) {
    const from = pickedIndex(modal)
    if (from < 0) return null
    const numbers = modal.rankedOrder.map((_, index) => SafeDOM.button({
        className: `rank-moveto__number${index === from ? ' is-here' : ''}`,
        'aria-label': index === from ? `Number ${index + 1}, where it is` : `Number ${index + 1}`,
        disabled: index === from,
        onClick: () => {
            sheet.close()
            moveTo(modal, from, index)
        }
    }, String(index + 1)))
    const sheet = openSheet({
        variant: 'bottom',
        title: `Move "${modal.rankedOrder[from].title}" to`,
        content: SafeDOM.div({ className: 'rank-moveto' }, numbers),
        onClose: () => { modal._sheet = null }
    })
    modal._sheet = sheet
    return sheet
}

/** Reset, with a way back for 5 seconds: the order of the album, and «Undo» in the notice. */
export function resetWithUndo(modal) {
    const before = [...modal.rankedOrder]
    modal.pickedId = null
    modal.reset()
    refreshPhone(modal)
    modal._showToast(RANK_PHONE_TEXT.reset, 'success', {
        label: RANK_PHONE_TEXT.undo,
        run: () => {
            modal.rankedOrder = before
            refreshPhone(modal)
        }
    })
}

/**
 * Back (or Escape) with an order changed and not saved: a sheet from the bottom asks before the
 * order is thrown away (F76, recheck N6). «Keep editing» is first and takes the focus; «Discard»
 * closes the window without saving.
 */
export function confirmDiscard(modal) {
    if (modal._sheet) return modal._sheet
    const keep = SafeDOM.button({ className: 'rank-discard__keep', onClick: () => sheet.close() }, RANK_PHONE_TEXT.keepEditing)
    const discard = SafeDOM.button({
        className: 'rank-discard__discard',
        onClick: () => {
            sheet.close()
            modal.close()
        }
    }, RANK_PHONE_TEXT.discard)
    const sheet = openSheet({
        variant: 'bottom',
        title: RANK_PHONE_TEXT.discardTitle,
        content: [SafeDOM.p({ className: 'rank-discard__note' }, RANK_PHONE_TEXT.discardNote), SafeDOM.div({ className: 'rank-discard' }, [keep, discard])],
        onClose: () => { modal._sheet = null },
        id: 'rankDiscardSheet'
    })
    modal._sheet = sheet
    return sheet
}
