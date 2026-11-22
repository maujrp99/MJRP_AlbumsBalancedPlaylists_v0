/**
 * InventoryPhoneSheets - the sheets of the inventory on the phone (F76, TASK-07, REQ-11).
 * Styles: public/css/mobile/inventory.css. Opened only on the phone (the view asks isPhone()).
 *
 *   status      the three statuses, the current one checked: two taps change it
 *   item        the named actions of one album: open, edit, its value (with «Data provided by
 *               Discogs.» beside a Discogs value), where to buy, Sell and Trade (not yet), remove
 *   filters     the format and the order, applied as they are chosen
 *   actions     the actions of the whole collection, each with what it does in words
 *   jump        a letter of the artists, or a stretch of positions
 *   values      the totals in words, the rate, and why the values are the lowest asking prices
 *
 * Every choice closes its sheet first and then calls what the view gave it: a window that opens
 * after (the edit window, a confirmation) is never under the sheet.
 */
import { openSheet } from '../components/ui/Sheet.js'
import { getIcon } from '../components/Icons.js'
import { SafeDOM } from '../utils/SafeDOM.js'
import { safeUrl } from '../utils/safeUrl.js'
import { BUY_LINKS_NOTE, BuyLinkPlace, SELL_TRADE_SOON, buyLinkMarks, buyLinksOf } from '../models/buyLinks.js'
import { InventoryStatus, statusLabel, statusOf } from '../models/inventoryStatus.js'
import { DISCOGS_CREDIT, discogsKindNote, ValueOrigin, momentText, moneyOf, noValueText, valueLabel } from '../models/inventoryValue.js'
import { SORT_OPTIONS } from '../models/inventorySort.js'
import { ViewMode } from '../models/inventoryViewMode.js'
import { statusText } from './renderers/InventoryPhoneRow.js'
import { SELLER_SETTINGS_TEXT } from './renderers/InventoryValueHeader.js'

const STATUS_ORDER = Object.freeze([InventoryStatus.OWNED, InventoryStatus.NOT_OWNED, InventoryStatus.WISHLIST])
const FORMATS = Object.freeze([['all', 'All'], ['cd', 'CD'], ['vinyl', 'Vinyl'], ['digital', 'Digital']])
/** The two views of the list, each with the icon the computer's switch uses (F89). */
const VIEWS = Object.freeze([[ViewMode.GRID, 'Gallery', 'Grid'], [ViewMode.LIST, 'List', 'List']])

/** A choice of a list: a row of 48 px, the chosen one with a check and `aria-pressed`. */
function choiceRow(label, chosen, onPick) {
    const row = SafeDOM.button({ className: 'inv-choice', 'aria-pressed': String(chosen), onClick: onPick }, [SafeDOM.span({}, label)])
    if (chosen) row.appendChild(SafeDOM.fromHTML(getIcon('Check', 'inv-choice__check')))
    return row
}

/** A named action of a sheet: a row of 48 px, with its icon. */
function actionRow({ icon, label, onPick, danger = false }) {
    const row = SafeDOM.button({ className: `inv-action${danger ? ' inv-action--danger' : ''}`, onClick: onPick })
    row.appendChild(SafeDOM.fromHTML(getIcon(icon, 'inv-action__icon')))
    row.appendChild(SafeDOM.span({}, label))
    return row
}

const heading = (text) => SafeDOM.p({ className: 'inv-sheet__heading' }, text)
const note = (text) => SafeDOM.p({ className: 'inv-sheet__note' }, text)
const group = (children, extra = '') => SafeDOM.div({ className: `inv-sheet__group ${extra}`.trim() }, children)

/** Runs `then` after the sheet is closed (the page is given back first). */
const closing = (sheet, then) => () => {
    sheet.close()
    then()
}

/**
 * The status of an album, in two taps: the status button, then one of these.
 * @param {Object} item
 * @param {(status: string) => void} onChoose - called only when the status changes
 */
export function openStatusSheet(item, onChoose) {
    const now = statusOf(item)
    const list = SafeDOM.div({ className: 'inv-choices', role: 'group', 'aria-label': 'Status' })
    const sheet = openSheet({ variant: 'bottom', title: 'Status', content: [note(`${item.title || 'Unknown Title'} · ${item.artist || 'Unknown Artist'}`), list], id: 'inventoryStatusSheet' })
    STATUS_ORDER.forEach(status => list.appendChild(choiceRow(statusLabel(status), status === now, closing(sheet, () => {
        if (status !== now) onChoose(status)
    }))))
    return sheet
}

/** «Data provided by Discogs.», with its link: beside every value of Discogs (F75, REQ-06). */
const discogsCredit = () => SafeDOM.a({ className: 'inv-sheet__credit', href: 'https://www.discogs.com/', target: '_blank', rel: 'noopener' }, DISCOGS_CREDIT)

/** The value of the album: the amount, where it comes from and, from Discogs, the edition and the credit. */
function valueGroup(item, value, money) {
    const amount = value.origin ? `≈ ${moneyOf(value, money)}` : '—'
    const children = [heading(valueLabel(item)), SafeDOM.p({ className: 'inv-sheet__amount' }, amount)]
    if (value.origin === ValueOrigin.YOURS) children.push(note('Written by you.'))
    if (!value.origin) children.push(note(noValueText(value)))
    if (value.origin === ValueOrigin.DISCOGS) {
        children.push(note(`${discogsKindNote(value)}.`))
        if (momentText(value.readAt)) children.push(note(`Read on ${momentText(value.readAt)}.`))
        const url = safeUrl(value.release?.url)
        if (url) children.push(SafeDOM.a({ className: 'inv-link', href: url, target: '_blank', rel: 'noopener' }, 'This edition on Discogs ↗'))
        children.push(discogsCredit())
    }
    return group(children)
}

function whereToBuy(item) {
    const links = buyLinksOf(item).map(({ id, name, url }) =>
        SafeDOM.a({ className: 'inv-link', href: safeUrl(url), target: '_blank', rel: 'noopener', dataset: { store: name, ...buyLinkMarks(id, BuyLinkPlace.PHONE_SHEET) } }, `${name} ↗`))
    return group([heading('Where to buy'), ...links, note(BUY_LINKS_NOTE)])
}

function sellOrTrade() {
    const off = (label) => SafeDOM.button({ className: 'inv-action', disabled: true, 'aria-disabled': 'true' }, label)
    return group([heading('Sell or trade'), SafeDOM.div({ className: 'inv-sheet__pair' }, [off('Sell'), off('Trade')]), note(SELL_TRADE_SOON)])
}

/**
 * The named actions of one album.
 * @param {Object} item
 * @param {{ value: Object, money: Object }} known - its value, and how money is written
 * @param {{ view: Function, edit: Function, remove: Function }} actions
 */
export function openItemSheet(item, { value, money }, actions) {
    const content = SafeDOM.div({ className: 'inv-sheet' })
    const sheet = openSheet({ variant: 'bottom', title: item.title || 'Unknown Title', content, id: 'inventoryItemSheet' })
    content.append(
        note(`${item.artist || 'Unknown Artist'} · ${statusText(statusOf(item))}`),
        group([
            actionRow({ icon: 'Disc', label: 'Open album', onPick: closing(sheet, actions.view) }),
            actionRow({ icon: 'Edit', label: 'Edit', onPick: closing(sheet, actions.edit) })
        ]),
        valueGroup(item, value, money),
        whereToBuy(item),
        sellOrTrade(),
        group([actionRow({ icon: 'Trash2', label: 'Remove from inventory', danger: true, onPick: closing(sheet, actions.remove) })])
    )
    return sheet
}

/** The four formats, as one row of buttons. */
function formatChoices(format, onFormat) {
    const row = SafeDOM.div({ className: 'inv-segments', role: 'group', 'aria-label': 'Format' })
    FORMATS.forEach(([code, label]) => row.appendChild(SafeDOM.button({
        className: 'inv-segment', 'aria-pressed': String(format === code), dataset: { format: code },
        onClick: () => onFormat(code)
    }, label)))
    return row
}

/** Gallery or list: the same two icons as the computer's switch and the albums screen's, each with its name. */
function viewChoices(view, onView) {
    const row = SafeDOM.div({ className: 'inv-segments inv-segments--views', role: 'group', 'aria-label': 'View' })
    VIEWS.forEach(([mode, label, icon]) => {
        const button = SafeDOM.button({ className: 'inv-segment inv-segment--view', 'aria-pressed': String(view === mode), dataset: { view: mode }, onClick: () => onView(mode) })
        button.appendChild(SafeDOM.fromHTML(getIcon(icon, 'inv-segment__icon')))
        button.appendChild(SafeDOM.span({}, label))
        row.appendChild(button)
    })
    return row
}

function sortChoices(sort, onSort) {
    const list = SafeDOM.div({ className: 'inv-choices', role: 'group', 'aria-label': 'Sort by' })
    SORT_OPTIONS.forEach(({ value, label }) => {
        const row = choiceRow(label, sort === value, () => onSort(value))
        row.dataset.sort = value
        list.appendChild(row)
    })
    return list
}

/**
 * The view, the format and the order. Each choice applies at once; the sheet shows it and the footer
 * says how many albums the list has now.
 * @param {{ format: string, sort: string, view: string, count: () => number, onFormat: Function, onSort: Function, onView: Function, onClose?: Function }} options
 */
export function openFiltersSheet({ format, sort, view, count, onFormat, onSort, onView, onClose }) {
    const shown = () => `Show ${count()} ${count() === 1 ? 'album' : 'albums'}`
    const done = SafeDOM.button({ className: 'btn btn-primary', dataset: { role: 'filters-done' } }, shown())
    const content = SafeDOM.div({ className: 'inv-sheet' })
    const sheet = openSheet({ variant: 'bottom', title: 'Filters and order', content, footer: done, onClose, id: 'inventoryFiltersSheet' })
    const draw = (now) => {
        SafeDOM.clear(content)
        content.append(
            group([heading('View'), viewChoices(now.view, (mode) => { onView(mode); draw({ ...now, view: mode }) })]),
            group([heading('Format'), formatChoices(now.format, (code) => { onFormat(code); draw({ ...now, format: code }) })]),
            group([heading('Sort by'), sortChoices(now.sort, (value) => { onSort(value); draw({ ...now, sort: value }) })])
        )
        done.textContent = shown()
    }
    draw({ format, sort, view })
    done.addEventListener('click', () => sheet.close())
    return sheet
}

/**
 * The actions of the whole collection: the buttons the view made (with their ids, so that their
 * progress is drawn on them), each with what it does in words (a title is not read on a phone).
 * @param {Array<{ button: HTMLElement, text: string }>} entries
 */
export function openActionsSheet(entries) {
    const content = SafeDOM.div({ className: 'inv-sheet' })
    entries.forEach(({ button, text }) => {
        button.classList.add('inv-collection-action')
        content.appendChild(group([button, note(text)]))
    })
    const sheet = openSheet({ variant: 'bottom', title: 'Collection actions', content, id: 'inventoryActionsSheet' })
    // the sheet goes first: what the action opens (a confirmation) is not under it
    content.addEventListener('click', (event) => {
        if (event.target.closest('button:not([disabled])')) sheet.close()
    }, true)
    return sheet
}

/**
 * Jump in the list: to a letter of the artists, or to a stretch of positions.
 * @param {{ targets: Array<{ label: string, index: number, count: number }>, byLetter: boolean, onJump: (index: number) => void }} options
 */
export function openJumpSheet({ targets, byLetter, onJump }) {
    const grid = SafeDOM.div({ className: `inv-jump ${byLetter ? 'inv-jump--letters' : 'inv-jump--stretches'}` })
    const sheet = openSheet({ variant: 'bottom', title: byLetter ? 'Jump to an artist' : 'Jump to a position', content: grid, id: 'inventoryJumpSheet' })
    targets.forEach(({ label, index, count }) => grid.appendChild(SafeDOM.button({
        className: 'inv-jump__target',
        'aria-label': `${label}: ${count} ${count === 1 ? 'album' : 'albums'}`,
        dataset: { index: String(index) },
        onClick: closing(sheet, () => onJump(index))
    }, label)))
    return sheet
}

/**
 * «Lowest asking prices · Why?» / «About the values» (F76, recheck N2): what the computer shows
 * around its totals, in a sheet: each total with how many albums have a value, the rate, where
 * the values come from and, while the account has no seller settings, the sentence and its link.
 * @param {ReturnType<import('./renderers/InventoryValueHeader.js').phoneValuesDetails>} details
 */
export function openValuesSheet(details) {
    const totals = details.totals.map(({ label, sum, note: count }) => SafeDOM.div({ className: 'inv-values-sheet__total' }, [
        SafeDOM.span({ className: 'inv-values-sheet__label' }, label),
        SafeDOM.span({ className: 'inv-values-sheet__sum' }, sum),
        SafeDOM.span({ className: 'inv-values-sheet__count' }, count)
    ]))
    const content = [group(totals)]
    if (details.rate) content.push(note(details.rate))
    if (details.sellerSettingsMissing) {
        content.push(SafeDOM.p({ className: 'inv-values-sheet__seller', id: 'valuesSellerSettingsSheetText' }, [
            SafeDOM.create('strong', {}, SELLER_SETTINGS_TEXT.strong),
            ` ${SELLER_SETTINGS_TEXT.rest} `,
            SafeDOM.a({ className: 'inv-values-sheet__link', href: 'https://www.discogs.com/settings/seller', target: '_blank', rel: 'noopener' }, SELLER_SETTINGS_TEXT.link),
            SELLER_SETTINGS_TEXT.after
        ]))
    }
    if (details.discogs) content.push(note(details.discogs))
    if (details.discogsShown) content.push(discogsCredit())
    const title = details.sellerSettingsMissing ? 'Why lowest asking prices?' : 'About the values'
    return openSheet({ variant: 'bottom', title, content, id: 'inventoryValuesSheet' })
}
