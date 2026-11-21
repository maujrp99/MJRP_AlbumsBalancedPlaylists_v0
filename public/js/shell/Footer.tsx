/**
 * Footer - the foot of every screen of the computer (F83 wave 3; was components/Footer.js): the links, «Clear Cache», who made the site, when it
 * was loaded and, while the Discogs values are on, what the app has to say about the Discogs API (F75, REQ-06; Discogs API Terms of Use).
 *
 * «Clear Cache» forgets only the album caches (the logins and the choices of the screens stay), says so, and loads the page again a moment
 * later so the albums in memory go too. The sentence about Discogs is hidden until the server says the values are on: an inventory screen,
 * hand-made until wave 6, turns it on and off through stores/discogsNotice.js.
 */
import { useState } from 'react'
import { useLocale } from '../react-bridge/useLocale'
import { useStore } from '../react-bridge/useStore'
import { discogsNoticeStore } from '../stores/discogsNotice.js'
import { t } from '../i18n/t.js'
import { useShell } from './context'

/** How long the «cleared» notice stays before the page loads again. */
const RELOAD_DELAY_MS = 1000
const LOGO = '/assets/images/logo.png'

type Message = null | 'cleared' | 'failed'

function useClearCache() {
    const { clearCaches, reload } = useShell()
    const [busy, setBusy] = useState(false)
    const [message, setMessage] = useState<Message>(null)
    const clear = async () => {
        setBusy(true)
        try {
            // Only the album caches: localStorage as a whole stays (Spotify login, screen choices)
            await clearCaches()
        } catch (error) {
            console.error('[Footer] Clear Cache failed:', error)
            setMessage('failed')
            setBusy(false)
            return
        }
        setMessage('cleared')
        setTimeout(reload, RELOAD_DELAY_MS)
    }
    return { busy, message, clear }
}

export function Footer() {
    useLocale()
    const discogsOn = useStore(discogsNoticeStore, store => store.isOn())
    const [lastUpdate] = useState(() => new Date().toLocaleString())
    const { busy, message, clear } = useClearCache()
    return (
        <footer className="site-footer container mx-auto px-6 py-12 mt-auto border-t border-white/5">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="footer-links flex gap-6 text-sm text-muted items-center">
                    <a href="/start" className="hover:text-white transition-colors" data-link="">{t('shell.footer.start')}</a>
                    <a href="/albums" className="hover:text-white transition-colors" data-link="">{t('shell.footer.albums')}</a>
                    <a href="/playlists" className="hover:text-white transition-colors" data-link="">{t('shell.footer.playlists')}</a>
                    <div className="flex items-center gap-3">
                        <button id="footerClearCache" className="hover:text-red-400 transition-colors text-left" disabled={busy} onClick={clear}>{t('shell.footer.clearCache')}</button>
                        <span id="cacheClearedMsg" className={`text-red-500 font-bold animate-pulse${message ? '' : ' hidden'}`} role="status">
                            {message === 'failed' ? t('shell.footer.cacheFailed') : t('shell.footer.cacheCleared')}
                        </span>
                    </div>
                </div>
                <div className="footer-brand flex flex-col items-center md:items-end gap-2">
                    <div className="powered-by flex items-center gap-2 text-sm text-muted">
                        <span>{t('shell.footer.poweredBy')}</span>
                        <div className="w-8 h-8 flex items-center justify-center">
                            <img src={LOGO} alt={t('shell.logo.markShort')} className="w-full h-full object-contain" />
                        </div>
                        <span className="font-bold text-white">{t('shell.footer.company')}</span>
                    </div>
                    <div className="last-update text-xs text-white/30">{` ${t('shell.footer.lastUpdated', { time: lastUpdate })} `}</div>
                </div>
            </div>
            <p id="discogsApiNotice" className="text-xs text-muted text-center mt-6" hidden={!discogsOn}>{t('shell.footer.discogsNotice')}</p>
        </footer>
    )
}
