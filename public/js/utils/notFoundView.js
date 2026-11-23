/**
 * notFoundView - what an address with nothing to show answers: «Page not found», and the way back (F82, REQ-01).
 *
 * The Painel's address (/admin) is one of them for everybody but the administrator: the route says «not found» and never
 * asks for the Painel's file. A hand-made view on purpose (a string the router writes): it must not pull a screen's file.
 */
import { escapeHtml } from './stringUtils.js'
import { t } from '../i18n/t.js'

/** @returns {{ render: () => string }} a view the router can draw */
export function notFoundView() {
    return {
        render: () => `
            <div class="p-8 text-center" role="alert" data-screen="not-found">
                <div class="text-white text-xl font-bold mb-2">${escapeHtml(t('notices.router.notFoundTitle'))}</div>
                <p class="text-white/60 mb-4">${escapeHtml(t('notices.router.notFoundBody'))}</p>
                <a class="btn btn-primary" href="/start" data-link>${escapeHtml(t('notices.router.notFoundBack'))}</a>
            </div>
        `
    }
}
