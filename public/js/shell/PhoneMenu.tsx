/**
 * PhoneMenu - the one menu of the phone (F76, REQ-03; F83 wave 3, was components/navigation/PhoneMenu.js): the account, and what the drawer
 * held that the tab bar does not (the playlists just generated, the other kinds of series, the Spotify connection, sign out), plus «Clear
 * album cache», which lived in the footer and now asks before it clears. A bottom sheet (the motor of the phone's Sheet, ui/SheetWindow),
 * opened from the top bar.
 *
 * What the menu shows is the person as they were when it was opened: it does not change under the finger.
 */
import { useState } from 'react'
import { Icon } from '../ui/Icon'
import { useSheetWindow } from '../ui/SheetWindow'
import toast from '../components/Toast.js'
import { isSignedIn } from '../utils/isSignedIn.js'
import { openLoginWindow } from '../stores/loginWindow.js'
import { t } from '../i18n/t.js'
import { SpotifyConnect } from './SpotifyConnect'
import { signOut } from './signOut'
import { useShell, type ShellUser } from './context'

interface Place {
    labelKey: string
    hintKey?: string
    route: string
    icon: string
    soon?: boolean
}

/** Places the tab bar does not reach, each by its route (the link is `/` + route). `soon` marks a screen that only says it is coming. */
const PLACES: readonly Place[] = [
    { labelKey: 'shell.menu.newPlaylists', hintKey: 'shell.menu.newPlaylistsHint', route: 'playlists', icon: 'ListMusic' },
    { labelKey: 'shell.menu.seriesByArtist', route: 'artists', icon: 'User', soon: true },
    { labelKey: 'shell.menu.seriesByGenre', route: 'genres', icon: 'Music', soon: true },
    { labelKey: 'shell.menu.seriesByTrack', route: 'tracks', icon: 'List', soon: true }
]

const accountName = (user: ShellUser | null): string => user?.displayName || user?.email || t('shell.account.user')
/** The first letter of the person's name: what the account button of the top bar shows. */
export const accountInitial = (user: ShellUser | null): string => accountName(user).trim().charAt(0).toUpperCase() || 'U'

function RowText({ label, hint }: { label: string; hint?: string }) {
    return (
        <span className="phone-menu__text">
            <span className="phone-menu__label">{label}</span>
            {hint ? <span className="phone-menu__hint">{hint}</span> : null}
        </span>
    )
}

function PlaceRow({ place }: { place: Place }) {
    return (
        <a href={`/${place.route}`} className="phone-menu__row" data-link="">
            <Icon name={place.icon} className="phone-menu__icon" />
            <RowText label={t(place.labelKey)} hint={place.hintKey ? t(place.hintKey) : undefined} />
            {place.soon ? <span className="phone-menu__soon">{t('shell.menu.soon')}</span> : null}
        </a>
    )
}

function ActionRow({ label, icon, danger = false, onClick }: { label: string; icon: string; danger?: boolean; onClick: () => void }) {
    return (
        <button type="button" className={`phone-menu__row${danger ? ' phone-menu__row--danger' : ''}`} onClick={onClick}>
            <Icon name={icon} className="phone-menu__icon" />
            <RowText label={label} />
        </button>
    )
}

function AccountBlock({ user, close }: { user: ShellUser | null; close: () => void }) {
    if (!isSignedIn(user)) {
        return (
            <div className="phone-menu__account">
                <button type="button" className="btn btn-primary phone-menu__sign-in" onClick={() => { close(); openLoginWindow() }}>{t('shell.menu.signIn')}</button>
            </div>
        )
    }
    return (
        <div className="phone-menu__account">
            <span className="phone-avatar" aria-hidden="true">{accountInitial(user)}</span>
            <span className="phone-menu__text">
                <span className="phone-menu__hint">{t('shell.menu.signedInAs')}</span>
                <span className="phone-menu__label phone-menu__label--name">{accountName(user)}</span>
            </span>
        </div>
    )
}

/** What is inside the menu sheet: four boxes, side by side in the body of the sheet. */
export function PhoneMenuBody({ user, close, onClearCache }: { user: ShellUser | null; close: () => void; onClearCache: () => void }) {
    return (
        <>
            <AccountBlock user={user} close={close} />
            {/* a tap on a place goes there (the router hears the link) and the menu leaves the screen */}
            <div className="phone-menu__list" onClick={(event) => { if ((event.target as Element).closest('a[data-link]')) close() }}>
                {PLACES.map(place => <PlaceRow key={place.route} place={place} />)}
            </div>
            <div id="phone-menu-spotify" className="phone-menu__spotify"><SpotifyConnect /></div>
            <div className="phone-menu__list">
                <ActionRow label={t('shell.menu.clearCache')} icon="Trash" onClick={() => { close(); onClearCache() }} />
                {isSignedIn(user) ? <ActionRow label={t('shell.menu.signOut')} icon="SignOut" danger onClick={() => { close(); signOut() }} /> : null}
            </div>
        </>
    )
}

export function ClearCacheMessage() {
    return <p className="phone-menu__message">{t('shell.menu.clearMessage')}</p>
}

/** The two buttons of the question: «Cancel», and «Clear cache», which clears, says so and loads the app again. */
export function ClearCacheActions({ close }: { close: () => void }) {
    const { clearCaches, reload } = useShell()
    const [busy, setBusy] = useState(false)
    const clear = async () => {
        setBusy(true)
        try {
            // Only the album caches: the logins and the choices of the screens stay
            await clearCaches()
        } catch (error) {
            console.error('[PhoneMenu] Clear cache failed:', error)
            toast.error(t('shell.menu.clearFailed'))
            setBusy(false)
            return
        }
        close()
        toast.success(t('shell.menu.cleared'))
        setTimeout(reload, 1000)
    }
    return (
        <>
            <button type="button" className="btn btn-secondary" onClick={close}>{t('shell.menu.cancel')}</button>
            <button type="button" className="btn btn-danger" data-action="clear-cache" disabled={busy} onClick={clear}>{t('shell.menu.clear')}</button>
        </>
    )
}

/** The two sheets of the menu: the menu itself, and the question before the album cache is cleared. */
export function usePhoneMenus(user: ShellUser | null) {
    const menu = useSheetWindow()
    const question = useSheetWindow()
    const askToClear = () => question.show({
        id: 'phone-clear-cache',
        title: t('shell.menu.clearTitle'),
        closeLabel: t('shell.sheet.close'),
        render: () => <ClearCacheMessage />,
        footer: (close) => <ClearCacheActions close={close} />
    })
    const open = () => {
        if (menu.isOpen()) return
        menu.show({
            id: 'phone-menu',
            title: t('shell.menu.title'),
            closeLabel: t('shell.sheet.close'),
            render: (close) => <PhoneMenuBody user={user} close={close} onClearCache={askToClear} />
        })
    }
    return { open, closeMenu: menu.close, layer: <>{menu.layer}{question.layer}</> }
}
