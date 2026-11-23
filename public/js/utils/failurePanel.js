/**
 * failurePanel - the panel a screen shows when it could not be drawn (F83, TASK-04).
 *
 * It was a string of HTML inside the router. The router still writes it for the hand-made screens, and the error barrier
 * of the React bridge draws the same panel for a React screen: both start from this one model, so the person sees the
 * same text and the same button whichever way the screen is made (REQ-01). The model has no HTML; `errorPanelHtml` is the
 * only place that turns it into a string, and it escapes what comes from the error.
 *
 * Pure: no DOM, no store, no screen.
 */
import { escapeHtml } from './stringUtils.js'
import { t } from '../i18n/t.js'

/**
 * What the panel says.
 * @param {*} error
 * @returns {{ title: string, detail: string, backLabel: string }}
 */
export function errorPanelModel(error) {
    return {
        title: t('notices.router.errorTitle'),
        detail: `${error?.message}\n${error?.stack}`,
        backLabel: t('notices.router.errorBack')
    }
}

/**
 * The panel as the router has always written it, for a hand-made screen.
 * @param {{ title: string, detail: string, backLabel: string }} model
 * @returns {string} HTML
 */
export function errorPanelHtml(model) {
    return `
                <div class="p-8 text-center">
                    <div class="text-red-500 text-xl font-bold mb-2">${escapeHtml(model.title)}</div>
                    <pre class="bg-black/30 p-4 rounded text-left text-sm overflow-auto text-red-300 max-w-2xl mx-auto">${escapeHtml(model.detail)}</pre>
                    <button class="btn btn-secondary mt-4" onclick="window.history.back()">${escapeHtml(model.backLabel)}</button>
                </div>
            `
}
