/**
 * PhoneMenu - the one menu of the phone (F76, REQ-03): the account, and what the drawer held that
 * the tab bar does not (the playlists just generated, the other kinds of series, the Spotify
 * connection, sign out), plus «Clear album cache», which lived in the footer and now asks before
 * it clears. A bottom sheet, opened from the top bar.
 */
import { SafeDOM } from '../../utils/SafeDOM.js'
import { getIcon } from '../Icons.js'
import { openSheet } from '../ui/Sheet.js'
import { askToClearCache } from './clearCache.js'
import { mountConnections, realConnections } from './connections.js'
import { MENU_TEXT } from './menuText.js'
import { showLoginModal } from '../LoginModal.js'
import { signOut, isSignedIn } from './AuthNav.js'
import { accountName, accountInitial } from './account.js'

const el = (tag, props, children) => SafeDOM.create(tag, props, children)
const icon = (iconName) => SafeDOM.fromHTML(getIcon(iconName, 'phone-menu__icon'))

/** Places the tab bar does not reach, each by its route (the link is `/` + route). `soon` marks a screen that only says it is coming. */
const PLACES = [
    { label: 'New playlists', hint: 'The playlists of your last blend', route: 'playlists', icon: 'ListMusic' },
    { label: 'Series by artist', route: 'artists', icon: 'User', soon: true },
    { label: 'Series by genre', route: 'genres', icon: 'Music', soon: true },
    { label: 'Series by track', route: 'tracks', icon: 'List', soon: true }
]

export { askToClearCache }

export { accountName, accountInitial }

function rowText(place) {
    const text = [el('span', { className: 'phone-menu__label' }, place.label)]
    if (place.hint) text.push(el('span', { className: 'phone-menu__hint' }, place.hint))
    return el('span', { className: 'phone-menu__text' }, text)
}

function placeRow(place) {
    const row = el('a', { href: `/${place.route}`, className: 'phone-menu__row', dataset: { link: '' } }, [icon(place.icon), rowText(place)])
    if (place.soon) row.appendChild(el('span', { className: 'phone-menu__soon' }, 'Soon'))
    return row
}

function actionRow({ label, iconName, danger = false, onClick }) {
    const className = `phone-menu__row${danger ? ' phone-menu__row--danger' : ''}`
    return el('button', { type: 'button', className, onClick }, [icon(iconName), rowText({ label })])
}

function accountBlock(user, close) {
    if (!isSignedIn(user)) {
        const signIn = el('button', { type: 'button', className: 'btn btn-primary phone-menu__sign-in', onClick: () => { close(); showLoginModal() } }, 'Sign In')
        return el('div', { className: 'phone-menu__account' }, signIn)
    }
    return el('div', { className: 'phone-menu__account' }, [
        el('span', { className: 'phone-avatar', 'aria-hidden': 'true' }, accountInitial(user)),
        el('span', { className: 'phone-menu__text' }, [
            el('span', { className: 'phone-menu__hint' }, 'Signed in as'),
            el('span', { className: 'phone-menu__label phone-menu__label--name' }, accountName(user))
        ])
    ])
}

/**
 * Opens the menu sheet.
 * @param {Object} deps
 * @param {Object|null} deps.user - who is signed in (the user store's currentUser)
 * @param {Function} deps.clearCaches
 * @returns the sheet (see components/ui/Sheet.js)
 */
export function openPhoneMenu({ user, clearCaches }) {
    const close = () => sheet.close()
    const list = el('div', { className: 'phone-menu__list' }, PLACES.map(placeRow))
    // A tap on a place goes there (the router hears the link) and the menu leaves the screen
    list.addEventListener('click', (event) => { if (event.target.closest('a[data-link]')) close() })

    const actions = [actionRow({ label: 'Clear album cache', iconName: 'Trash', onClick: () => { close(); askToClearCache({ clearCaches }) } })]
    if (isSignedIn(user)) actions.push(actionRow({ label: 'Sign Out', iconName: 'SignOut', danger: true, onClick: () => { close(); signOut() } }))

    let connections = null
    const sheet = openSheet({
        variant: 'bottom',
        id: 'phone-menu',
        title: 'Menu',
        // The connections stop listening to the services when the menu leaves the screen, by any way it closes
        onClose: () => connections?.destroy(),
        content: [
            accountBlock(user, close),
            list,
            el('div', { className: 'phone-menu__section' }, MENU_TEXT.connectionsTitle),
            el('div', { id: 'phone-menu-connections', className: 'phone-menu__connections' }),
            el('div', { className: 'phone-menu__list' }, actions)
        ]
    })
    connections = mountConnections(document.getElementById('phone-menu-connections'), realConnections())
    connections.check() // Apple Music keeps its authorization across visits: ask now, the sheet says «Checking…» meanwhile
    return sheet
}
