/**
 * Account - the account on the right of the top menu (F88; F83 sync of main: was components/navigation/AuthNav.js): one button that opens ONE
 * panel with who is in (or the way to sign in), the connections (Apple Music, then Spotify), the cache and sign out; «Sign In» beside it for who is
 * not in. The dots on the closed button, and its label, say only what is known of each service: Apple Music is `null` while it is still being asked.
 *
 * The panel opens with a tap, a click or the keyboard, never by hover alone (F63, UAT-13): a click on the button toggles it, a click anywhere
 * outside closes it (the question the panel itself opens is not «outside»), Escape closes it and gives the focus back to the button, and the arrow
 * down on the button opens it on the first control. Its listeners on the page live as long as the account does. Opening it asks Apple Music.
 */
import { useEffect, useRef, useState, type RefObject } from 'react'
import { flushSync } from 'react-dom'
import { Icon } from '../ui/Icon'
import { isSignedIn } from '../utils/isSignedIn.js'
import { openLoginWindow } from '../stores/loginWindow.js'
import { t } from '../i18n/t.js'
import { NAME_IN_THE_BAR } from './barName'
import { signOut } from './signOut'
import { accountInitial } from './accountNames'
import { ConnectionRows, useConnections } from './ConnectionRows'
import { useClearCacheQuestion } from './ClearCache'
import { MENU_TEXT } from './menuText'
import type { ConnectionsModel, Summary } from './connections'
import type { ShellUser, UserState } from './context'

function summaryLabel({ spotify, apple }: Summary, signedIn: boolean): string {
    const names = [spotify && 'Spotify', apple === true && 'Apple Music'].filter((name): name is string => Boolean(name))
    const base = signedIn ? MENU_TEXT.account : MENU_TEXT.connectionsOnly
    const nothing = !spotify && apple === false
    return names.length || nothing ? `${base}: ${MENU_TEXT.connectedSummary(names)}` : base
}

/** Opens and closes the panel, and listens to the page while the account is there. */
function usePanel(model: ConnectionsModel) {
    const [open, setOpen] = useState(false)
    const trigger = useRef<HTMLButtonElement>(null)
    const panel = useRef<HTMLDivElement>(null)
    const isOpen = useRef(false)
    isOpen.current = open

    useEffect(() => {
        const click = (event: MouseEvent) => {
            const target = event.target instanceof Element ? event.target : null
            if (target?.closest('#userMenuBtn')) return
            // A window the panel opened (the question before a disconnect) is not «outside»: the panel stays and shows the new state
            if (isOpen.current && !target?.closest('#userMenu, .app-modal')) setOpen(false)
        }
        const key = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen.current) {
                setOpen(false)
                trigger.current?.focus()
            } else if (event.key === 'ArrowDown' && document.activeElement === trigger.current) {
                event.preventDefault()
                // The panel is shown, Apple Music is asked and its row drawn («Checking…» has no button), and then the first control that is left takes the focus
                flushSync(() => setOpen(true))
                model.check()
                flushSync(() => {})
                panel.current?.querySelector<HTMLElement>('button, a')?.focus()
            }
        }
        document.addEventListener('click', click)
        document.addEventListener('keydown', key)
        return () => {
            document.removeEventListener('click', click)
            document.removeEventListener('keydown', key)
        }
    }, [model])

    // Opening asks Apple Music
    useEffect(() => { if (open) model.check() }, [open, model])
    return { open, setOpen, toggle: () => setOpen(was => !was), trigger, panel }
}

interface PanelProps {
    open: boolean
    user: ShellUser | null
    signedIn: boolean
    model: ConnectionsModel
    close: () => void
    panel: RefObject<HTMLDivElement | null>
}

function Panel({ open, user, signedIn, model, close, panel }: PanelProps) {
    const question = useClearCacheQuestion()
    return (
        <div id="userMenu" role="dialog" aria-label={MENU_TEXT.account} className={`top-panel${open ? '' : ' opacity-0 invisible'}`} ref={panel}>
            <div className="top-panel__who">
                {signedIn
                    ? <><p className="text-xs text-white/70">{t('shell.account.signedInAs')}</p><p className="text-sm font-bold truncate">{user?.displayName || user?.email}</p></>
                    : <p className="text-sm text-white/70">{t('shell.m.signInHint')}</p>}
            </div>
            <div className="top-panel__section">{MENU_TEXT.connectionsTitle}</div>
            <ConnectionRows model={model} id="accountConnections" />
            <div className="top-panel__rule" />
            <button id="panelClearCache" type="button" className="top-panel__row" onClick={() => { close(); question.ask() }}>
                <Icon name="Trash" className="w-4 h-4" />{` ${t('shell.menu.clearCache')}`}
            </button>
            {signedIn ? (
                <button id="logoutBtn" type="button" className="top-panel__row top-panel__row--danger" onClick={signOut}>
                    <Icon name="Logout" className="w-4 h-4" />{` ${t('shell.account.signOut')}`}
                </button>
            ) : null}
            {question.layer}
        </div>
    )
}

/** The button and the panel. */
function AccountButton({ user }: { user: ShellUser | null }) {
    const signedIn = isSignedIn(user)
    const model = useConnections()
    const { open, setOpen, toggle, trigger, panel } = usePanel(model)
    const summary = model.summary()
    const name = user?.displayName || t('shell.account.user')
    return (
        <div className="top-acct relative min-w-0" id="userMenuDropdownTrigger">
            <button ref={trigger} id="userMenuBtn" type="button" aria-haspopup="dialog" aria-expanded={open} aria-controls="userMenu" aria-label={summaryLabel(summary, signedIn)} data-apple={summary.apple === null ? 'pending' : summary.apple ? 'on' : 'off'} className="top-acct__btn min-w-0 max-w-full" onClick={toggle}>
                {signedIn ? <span className="top-acct__initial shrink-0" aria-hidden="true">{accountInitial(user)}</span> : <Icon name="Music" className="w-5 h-5" />}
                {signedIn ? <span className={`hidden xl:block text-xs font-medium text-white/80 ${NAME_IN_THE_BAR}`} data-account-name="" title={name}>{name}</span> : null}
                <span className="top-acct__dots" data-connection-dots="" aria-hidden="true">
                    {summary.spotify ? <b className="top-acct__dot top-acct__dot--spotify" /> : null}
                    {summary.apple === true ? <b className="top-acct__dot top-acct__dot--apple" /> : null}
                </span>
            </button>
            <Panel open={open} user={user} signedIn={signedIn} model={model} close={() => setOpen(false)} panel={panel} />
        </div>
    )
}

/** The account in the bar of the computer: the pulse while the login has not answered, otherwise «Sign In» (for who is not in) and the button with its panel. */
export function AccountDesktop({ state }: { state: UserState }) {
    if (state.loading) return <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
    const signedIn = isSignedIn(state.currentUser)
    return (
        <>
            {signedIn ? null : <button id="loginBtn" type="button" className="top-menu__signin" onClick={() => openLoginWindow()}>{t('shell.account.signIn')}</button>}
            <AccountButton user={state.currentUser} />
        </>
    )
}
