/**
 * Account - the person in the top bar (F83 wave 3; was components/navigation/AuthNav.js): on the computer the avatar with its menu (the
 * name, «Sign Out»), in the drawer of the middle screen the name and the sign-out button, or the «Sign In» buttons for who is not signed in.
 *
 * The account menu opens with a tap, a click or the keyboard, never by hover alone (F63, UAT-13): a click on the avatar toggles it, a click
 * anywhere outside closes it, Escape closes it and gives the focus back to the avatar, and the arrow down on the avatar opens it on the
 * first item. Its listeners on the page live as long as the menu does.
 */
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Icon } from '../ui/Icon'
import { t } from '../i18n/t.js'
import { isSignedIn } from '../utils/isSignedIn.js'
import { openLoginWindow } from '../stores/loginWindow.js'
import { NAME_IN_THE_BAR } from './barName'
import { signOut } from './signOut'
import type { ShellUser, UserState } from './context'

const LOGO = '/assets/images/logo.png'

function Avatar({ user }: { user: ShellUser }) {
    if (user.providerData?.some(provider => provider.providerId === 'apple.com')) {
        return (
            <div className="w-8 h-8 shrink-0 rounded-full bg-gray-800 border border-white/20 flex items-center justify-center">
                <Icon name="Apple" className="w-5 h-5 text-white" />
            </div>
        )
    }
    return <img src={user.photoURL || LOGO} className="w-8 h-8 shrink-0 rounded-full border border-white/20" alt={t('shell.account.user')} />
}

/** Opens and closes the menu of the account, and listens to the page while it is there. */
function useAccountMenu() {
    const [open, setOpen] = useState(false)
    const [focusFirst, setFocusFirst] = useState(false)
    const trigger = useRef<HTMLButtonElement>(null)
    const menu = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const click = (event: MouseEvent) => {
            const target = event.target instanceof Element ? event.target : null
            if (!target?.closest('#userMenuBtn') && !target?.closest('#userMenu')) setOpen(false)
        }
        const key = (event: globalThis.KeyboardEvent) => {
            if (event.key !== 'Escape' || trigger.current?.getAttribute('aria-expanded') !== 'true') return
            setOpen(false)
            trigger.current.focus()
        }
        document.addEventListener('click', click)
        document.addEventListener('keydown', key)
        return () => {
            document.removeEventListener('click', click)
            document.removeEventListener('keydown', key)
        }
    }, [])

    // The first item can take the focus only once the menu is shown
    useLayoutEffect(() => {
        if (!focusFirst) return
        menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
        setFocusFirst(false)
    }, [focusFirst])

    const onArrow = (event: KeyboardEvent) => {
        if (event.key !== 'ArrowDown' || document.activeElement !== trigger.current) return
        event.preventDefault()
        setOpen(true)
        setFocusFirst(true)
    }
    return { open, toggle: () => setOpen(was => !was), trigger, menu, onArrow }
}

function AccountMenu({ user }: { user: ShellUser }) {
    const { open, toggle, trigger, menu, onArrow } = useAccountMenu()
    const name = user.displayName || t('shell.account.user')
    return (
        <div className="relative min-w-0" id="userMenuDropdownTrigger">
            <button ref={trigger} id="userMenuBtn" type="button" aria-haspopup="menu" aria-expanded={open} aria-controls="userMenu" aria-label={t('shell.account.menu')} className="flex items-center gap-2 p-1 max-w-full rounded-full hover:bg-white/5 transition-colors" onClick={toggle} onKeyDown={onArrow}>
                <Avatar user={user} />
                <span className={`hidden xl:block text-xs font-medium text-white/80 ${NAME_IN_THE_BAR}`} data-account-name="" title={name}>{name}</span>
            </button>

            <div ref={menu} id="userMenu" role="menu" aria-labelledby="userMenuBtn" className={`absolute right-0 mt-2 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-xl transition-all duration-200 z-50 ${open ? '' : 'opacity-0 invisible'}`}>
                <div className="p-3 border-b border-white/10">
                    <p className="text-xs text-white/50">{t('shell.account.signedInAs')}</p>
                    <p className="text-sm font-bold truncate">{user.displayName || user.email}</p>
                </div>
                <button id="logoutBtn" role="menuitem" className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 text-red-400 flex items-center gap-2" onClick={signOut}>
                    <Icon name="Logout" className="w-4 h-4" />
                    {` ${t('shell.account.signOut')} `}
                </button>
            </div>
        </div>
    )
}

/** The account in the bar of the computer. */
export function AccountDesktop({ state }: { state: UserState }) {
    if (state.loading) return <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
    if (state.currentUser && isSignedIn(state.currentUser)) return <AccountMenu user={state.currentUser} />
    return <button id="loginBtn" className="btn btn-sm btn-primary" onClick={() => openLoginWindow()}>{` ${t('shell.account.signIn')} `}</button>
}

/** The account at the foot of the drawer of the middle screen. */
export function AccountDrawer({ user }: { user: ShellUser | null }) {
    if (user && isSignedIn(user)) {
        return (
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 justify-center mb-2">
                    <img src={user.photoURL || LOGO} className="w-8 h-8 rounded-full" />
                    <span className="text-sm font-bold">{user.displayName || t('shell.account.user')}</span>
                </div>
                <button id="mobileLogoutBtn" className="btn btn-sm btn-secondary w-full" onClick={signOut}>{t('shell.account.signOut')}</button>
            </div>
        )
    }
    return <button id="mobileLoginBtn" className="btn btn-sm btn-primary w-full" onClick={() => openLoginWindow()}>{t('shell.account.signInToSync')}</button>
}
