/**
 * LoginWindow - the window to sign in (F83 wave 3; was components/LoginModal.js): Google, Apple, or go on as a guest. It is put straight in the
 * body (a portal) when something asks for it (stores/loginWindow.js), and leaves when the person signs in, goes on as a guest or taps the
 * background. On the phone it is a sheet from the bottom (the class `login-window`, css/mobile.css).
 *
 * The person's account is the Firebase login's: this window asks the login service for the provider's own window; it holds no password.
 */
import { useState, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../ui/Icon'
import { useLocale } from '../react-bridge/useLocale'
import { useStore } from '../react-bridge/useStore'
import { authService } from '../services/auth/signIn.js'
import { track } from '../services/usage/track.js'
import toast from '../components/Toast.js'
import { loginWindowStore } from '../stores/loginWindow.js'
import { t } from '../i18n/t.js'

type Provider = 'google' | 'apple'

interface SignInError {
    code?: string
    message?: string
}

const GOOGLE_LOGO = 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg'

/** What the person is told when signing in did not work. */
function failureText(error: SignInError): string {
    if (error.code === 'auth/operation-not-allowed') return t('shell.login.notEnabled')
    if (error.code === 'auth/popup-closed-by-user') return t('shell.login.cancelled')
    return t('shell.login.failed', { message: error.message ?? '' })
}

/**
 * One button of a provider. While it asks, the clicked one shows «Signing in...» and both are off. After a failure the hand-made window put
 * the content of the button that was clicked back without the shade over it (the empty `absolute inset-0` box), and this does the same.
 */
function ProviderButton({ provider, asking, afterFailure, onClick }: { provider: Provider; asking: Provider | null; afterFailure: boolean; onClick: () => void }) {
    const isGoogle = provider === 'google'
    const classes = isGoogle
        ? 'w-full btn bg-white text-black hover:bg-gray-100 flex items-center justify-center gap-3 relative overflow-hidden group'
        : 'w-full btn bg-black text-white border border-white/20 hover:bg-black/80 flex items-center justify-center gap-3 relative overflow-hidden group'
    const shade = isGoogle ? 'absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors' : 'absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors'
    const label = t(isGoogle ? 'shell.login.google' : 'shell.login.apple')
    return (
        <button id={isGoogle ? 'googleLoginBtn' : 'appleLoginBtn'} className={classes} disabled={asking !== null} onClick={onClick}>
            {asking === provider ? (
                <>
                    <span className="animate-spin mr-2">⟳</span>
                    {` ${t('shell.login.signingIn')}`}
                </>
            ) : (
                <>
                    {afterFailure ? null : <div className={shade} />}
                    {isGoogle ? <img src={GOOGLE_LOGO} className="w-6 h-6" alt={t('shell.login.googleAlt')} /> : <Icon name="Apple" className="w-6 h-6 fill-current" />}
                    <span className="font-bold">{label}</span>
                </>
            )}
        </button>
    )
}

function useSignIn(close: () => void) {
    const [asking, setAsking] = useState<Provider | null>(null)
    const [failed, setFailed] = useState<Provider[]>([])
    const signIn = async (provider: Provider) => {
        setAsking(provider)
        try {
            await (provider === 'google' ? authService.signInWithGoogle() : authService.signInWithApple())
            toast.success(t('shell.login.success'))
            // F77: which provider, never who; the service is never told the person
            track('sign_in', { provider })
            close()
        } catch (error) {
            console.error('Login failed:', error)
            toast.error(failureText(error as SignInError))
            setAsking(null)
            setFailed(was => (was.includes(provider) ? was : [...was, provider]))
        }
    }
    return { asking, failed, signIn }
}

function Window({ close }: { close: () => void }) {
    const { asking, failed, signIn } = useSignIn(close)
    const onBackground = (event: MouseEvent) => { if (event.target === event.currentTarget) close() }
    return (
        <div className="modal-overlay login-window" onClick={onBackground}>
            <div className="modal-container glass-panel max-w-md w-full">
                <div className="modal-header p-6 border-b border-surface-light text-center">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-flame-gradient mb-2">{t('shell.login.title')}</h2>
                    <p className="text-white/60">{t('shell.login.subtitle')}</p>
                </div>
                <div className="modal-content p-8 space-y-4">
                    <ProviderButton provider="google" asking={asking} afterFailure={failed.includes('google')} onClick={() => signIn('google')} />
                    <ProviderButton provider="apple" asking={asking} afterFailure={failed.includes('apple')} onClick={() => signIn('apple')} />
                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-black px-4 text-sm text-white/40">{t('shell.login.orGuest')}</span>
                        </div>
                    </div>
                    <button className="w-full btn btn-secondary" data-action="cancel" onClick={close}>{` ${t('shell.login.guest')} `}</button>
                </div>
                <div className="px-6 pb-2 text-center text-xs text-white/50" data-guest-notice="">{` ${t('shell.login.guestNotice')} `}</div>
                <div className="p-4 text-center text-xs text-white/30">{` ${t('shell.login.terms')} `}</div>
            </div>
        </div>
    )
}

export function LoginWindow() {
    useLocale()
    const isOpen = useStore(loginWindowStore, store => store.isOpen as boolean)
    // a window made again each time it opens: nothing of the last attempt stays in it
    return isOpen ? createPortal(<Window close={() => loginWindowStore.close()} />, document.body) : null
}
