/**
 * PhoneMenu - the one menu of the phone (F76, REQ-03; F83 wave 3, was components/navigation/PhoneMenu.js): the account, and what the tab bar does
 * not reach (the playlists just generated, the other kinds of series), the connections (Apple Music first, then Spotify, F88), sign out, plus
 * «Clear album cache», which asks before it clears. A bottom sheet (the motor of the phone's Sheet, ui/SheetWindow), opened from the top bar.
 *
 * What the menu shows is the person as they were when it was opened: it does not change under the finger.
 */
import { useEffect } from 'react'
import { Icon } from '../ui/Icon'
import { useSheetWindow } from '../ui/SheetWindow'
import { isSignedIn } from '../utils/isSignedIn.js'
import { openLoginWindow } from '../stores/loginWindow.js'
import { t } from '../i18n/t.js'
import { ConnectionRows, useConnections } from './ConnectionRows'
import { useClearCacheQuestion } from './ClearCache'
import { MENU_TEXT } from './menuText'
import { accountInitial, accountName } from './accountNames'
import { signOut } from './signOut'
import type { ShellUser } from './context'

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

/** Spotify and Apple Music in the sheet: they listen to the services while the sheet is open, and Apple Music keeps its authorization across visits, so it is asked now («Checking…» meanwhile). */
function MenuConnections() {
    const model = useConnections()
    useEffect(() => { model.check() }, [model])
    return <ConnectionRows model={model} id="phone-menu-connections" className="phone-menu__connections" />
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
            <div className="phone-menu__section">{MENU_TEXT.connectionsTitle}</div>
            <MenuConnections />
            <div className="phone-menu__list">
                <ActionRow label={t('shell.menu.clearCache')} icon="Trash" onClick={() => { close(); onClearCache() }} />
                {isSignedIn(user) ? <ActionRow label={t('shell.menu.signOut')} icon="SignOut" danger onClick={() => { close(); signOut() }} /> : null}
            </div>
        </>
    )
}

/** The two sheets of the menu: the menu itself, and the question before the album cache is cleared. */
export function usePhoneMenus(user: ShellUser | null) {
    const menu = useSheetWindow()
    const question = useClearCacheQuestion()
    const open = () => {
        if (menu.isOpen()) return
        menu.show({
            id: 'phone-menu',
            title: t('shell.menu.title'),
            closeLabel: t('shell.sheet.close'),
            render: (close) => <PhoneMenuBody user={user} close={close} onClearCache={question.ask} />
        })
    }
    return { open, closeMenu: menu.close, layer: <>{menu.layer}{question.layer}</> }
}
