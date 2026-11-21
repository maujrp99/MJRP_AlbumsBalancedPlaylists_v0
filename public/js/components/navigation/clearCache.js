/**
 * clearCache - «Clear album cache» asks first (finding 20 of the UX audit), clears, says so and loads
 * the app again. One place for the two menus that offer it: the phone's sheet and the computer's panel.
 */
import { SafeDOM } from '../../utils/SafeDOM.js'
import { openSheet } from '../ui/Sheet.js'
import toast from '../Toast.js'

const el = (tag, props, children) => SafeDOM.create(tag, props, children)

/**
 * Asks before the album cache is cleared, clears it, says so and loads the app again.
 * @param {Object} deps
 * @param {Function} deps.clearCaches - () => Promise: forgets what the browser keeps about albums
 * @param {Function} [deps.reload]
 * @param {number} [deps.reloadDelayMs]
 */
export function askToClearCache({ clearCaches, reload = () => window.location.reload(), reloadDelayMs = 1000 }) {
    const clear = async () => {
        clearButton.disabled = true
        try {
            // Only the album caches: the logins and the choices of the screens stay
            await clearCaches()
        } catch (error) {
            console.error('[PhoneMenu] Clear cache failed:', error)
            toast.error('Could not clear the cache')
            clearButton.disabled = false
            return
        }
        sheet.close()
        toast.success('Cache cleared')
        setTimeout(reload, reloadDelayMs)
    }
    const cancelButton = el('button', { type: 'button', className: 'btn btn-secondary', onClick: () => sheet.close() }, 'Cancel')
    const clearButton = el('button', { type: 'button', className: 'btn btn-danger', dataset: { action: 'clear-cache' }, onClick: clear }, 'Clear cache')
    const sheet = openSheet({
        variant: 'bottom',
        id: 'phone-clear-cache',
        title: 'Clear the album cache?',
        content: el('p', { className: 'phone-menu__message' }, 'The albums are loaded again from their sources the next time you open them. Your series, rankings, playlists and inventory are kept.'),
        footer: [cancelButton, clearButton]
    })
    return sheet
}
