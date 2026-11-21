/**
 * SpotifyConnect - the button that connects and disconnects Spotify (F83 wave 3; was components/SpotifyConnectButton.js). It sits in three
 * places (the bar, the drawer of the middle screen and the menu of the phone), each its own copy with its own state, as before.
 *
 * Spotify keeps its session in the browser's storage and says «it changed» with one event on the window; there is no store. Each button
 * reads the session when it appears and at each event, and asks for the name of the account (one request at a time) while it is connected
 * and has no name. The listener on the window is let go of when the button leaves.
 */
import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { SpotifyAuthService } from '../services/SpotifyAuthService.js'
import { dialogService } from '../services/DialogService.js'
import toast from '../components/Toast.js'
import { Icon } from '../ui/Icon'
import { t } from '../i18n/t.js'
import { NAME_IN_THE_BAR } from './barName'

interface SpotifyProfile {
    display_name: string
}

/** Whether Spotify is connected and whose account it is; the name is null until the account answers. */
function useSpotifySession(): { connected: boolean; profile: SpotifyProfile | null } {
    const [connected, setConnected] = useState<boolean>(() => SpotifyAuthService.isAuthenticated())
    const [profile, setProfile] = useState<SpotifyProfile | null>(null)
    const [signals, setSignals] = useState(0)
    const asking = useRef(false)

    useEffect(() => {
        const heard = () => {
            const now = SpotifyAuthService.isAuthenticated() as boolean
            setConnected(now)
            if (!now) setProfile(null)
            setSignals(count => count + 1)
        }
        window.addEventListener('spotify-auth-change', heard)
        return () => window.removeEventListener('spotify-auth-change', heard)
    }, [])

    useEffect(() => {
        // One request at a time: a token refresh in the middle announces the session again
        if (!connected || profile || asking.current) return
        asking.current = true
        SpotifyAuthService.getUserProfile()
            .then((found: SpotifyProfile | null) => setProfile(found))
            .catch((error: unknown) => console.error('[SpotifyConnect] The account could not be asked for its name:', error))
            .finally(() => { asking.current = false })
    }, [connected, profile, signals])

    return { connected, profile }
}

async function askToDisconnect(event: MouseEvent): Promise<void> {
    event.preventDefault()
    // The app's own dialog: the browser's native confirm() can be silenced, and then the click did nothing (UAT-183).
    const confirmed = await dialogService.confirm({
        title: t('shell.spotify.disconnectTitle'),
        message: t('shell.spotify.disconnectMessage'),
        confirmText: t('shell.spotify.disconnectConfirm')
    })
    if (confirmed) {
        SpotifyAuthService.logout()
        toast.info(t('shell.spotify.disconnected'))
    }
}

function Connected({ name }: { name: string }) {
    return (
        <div className="flex items-center gap-2 min-w-0 overflow-hidden bg-[#1DB954]/10 border border-[#1DB954]/30 rounded-full pl-1 pr-3 py-1 transition-all group hover:bg-[#1DB954]/20" title={t('shell.spotify.connectedTitle', { name })}>
            <div className="w-6 h-6 shrink-0 rounded-full bg-[#1DB954] flex items-center justify-center text-black shadow-lg shadow-[#1DB954]/20">
                <Icon name="SpotifyConfig" className="w-4 h-4" />
            </div>
            <div className="hidden xl:flex flex-col leading-none min-w-0">
                <span className="text-[10px] uppercase tracking-wider text-[#1DB954]/70 font-bold">{t('shell.spotify.connected')}</span>
                <span className={`text-xs font-bold text-[#1DB954] ${NAME_IN_THE_BAR}`} data-spotify-name="" title={name}>{name}</span>
            </div>
            <button id="spotifyLogoutBtn" className="ml-1 shrink-0 text-xs text-[#1DB954]/50 hover:text-white transition-colors" title={t('shell.spotify.disconnect')} onClick={askToDisconnect}>
                <Icon name="X" className="w-3 h-3" />
            </button>
        </div>
    )
}

function Disconnected() {
    return (
        <button id="spotifyLoginBtn" className="flex items-center gap-2 bg-black hover:bg-[#1ed760] hover:text-black border border-[#1DB954] text-[#1DB954] px-3 py-1.5 rounded-full transition-all duration-300 transform hover:scale-105 group" onClick={() => SpotifyAuthService.login()}>
            <Icon name="SpotifyConfig" className="w-4 h-4 fill-current" />
            <span className="text-xs font-bold tracking-wide">{t('shell.spotify.connect')}</span>
        </button>
    )
}

export function SpotifyConnect() {
    const { connected, profile } = useSpotifySession()
    if (!connected) return <Disconnected />
    return <Connected name={profile ? profile.display_name : t('shell.spotify.name')} />
}
