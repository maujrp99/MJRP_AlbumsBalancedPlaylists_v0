/**
 * NotFound - what an address with nothing to show answers: «Page not found», and the way back (F82, REQ-01).
 *
 * The Painel's address (/admin) is one of them for everybody but the administrator. Like every screen it follows the texts:
 * when the language or a published text changes it is drawn again (REQ-10).
 *
 * CouldNotCheck - what the same address says when the site could not find out in time who is asking (the database slow or
 * out): plain words and «Try again», never a long blank page and never a wrong «not found» to the administrator.
 */
import { t } from '../i18n/t.js'
import { redirect } from '../react-bridge/navigation'
import { useLocale } from '../react-bridge/useLocale'

export function NotFound() {
    useLocale() // draws again when the language or the published texts change
    return (
        <div className="p-8 text-center" role="alert" data-screen="not-found">
            <div className="text-white text-xl font-bold mb-2">{t('notices.router.notFoundTitle')}</div>
            <p className="text-white/60 mb-4">{t('notices.router.notFoundBody')}</p>
            <a className="btn btn-primary" href="/start" data-link="">{t('notices.router.notFoundBack')}</a>
        </div>
    )
}

export function CouldNotCheck() {
    useLocale()
    return (
        <div className="p-8 text-center" role="alert" data-screen="could-not-check">
            <div className="text-white text-xl font-bold mb-2">{t('notices.router.checkTitle')}</div>
            <p className="text-white/60 mb-4">{t('notices.router.checkBody')}</p>
            {/* the same address again: the router asks the gate once more */}
            <button type="button" className="btn btn-primary" onClick={() => redirect(window.location.pathname)}>{t('notices.router.retry')}</button>
        </div>
    )
}
