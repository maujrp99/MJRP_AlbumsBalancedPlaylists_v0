/**
 * Toast Component
 * Global notification system for success/error/info messages
 * Replaces all alert() calls throughout the app
 * 
 * Refactored to SafeDOM in Sprint 16
 */

import { SafeDOM } from '../utils/SafeDOM.js'
import { getIcon } from './Icons.js' // Assuming getIcon is exported or we can replicate SVGs

const TOAST_DURATION = 4000
const TOAST_ANIMATION_DURATION = 300

// Toast container (created once, reused)
let toastContainer = null

function ensureContainer() {
    if (toastContainer && document.body.contains(toastContainer)) return toastContainer

    toastContainer = SafeDOM.div({
        id: 'toast-container',
        className: 'fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none'
    })
    document.body.appendChild(toastContainer)

    return toastContainer
}

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - 'success' | 'error' | 'warning' | 'info'
 * @param {number} duration - Duration in ms (default 4000)
 */
export function showToast(message, type = 'info', duration = TOAST_DURATION) {
    const container = ensureContainer()

    // Get styles
    const styles = getToastStyles(type)

    // Close button
    const closeBtn = SafeDOM.button({
        className: 'toast-close opacity-60 hover:opacity-100 transition-opacity',
        ariaLabel: 'Close',
        onClick: () => dismissToast(toast)
    })
    // SVG built manually or via getIcon if available. 
    // Icons.js getIcon returns HTML string usually, so we might need SafeDOM wrapper or inline SVG.
    // Let's use inline SVG with SafeDOM for internal consistency if getIcon isn't SafeDOM-ready yet.
    // Step 1850 showed BaseModal using getIcon + innerHTML. 
    // We want to avoid innerHTML.
    // Let's construct the close icon SVG manually for 100% safety.
    closeBtn.appendChild(
        SafeDOM.svg({ className: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
            SafeDOM.path({ strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2', d: 'M6 18L18 6M6 6l12 12' })
        ])
    )

    // Icon container
    const iconContainer = SafeDOM.span({ className: 'toast-icon' })
    // We can use innerHTML here IF we trust getIcon return value, BUT aiming for 0 sinks.
    // Let's use a helper to render the specific icon type as SVG node.
    iconContainer.appendChild(renderToastIconSvg(type))

    // Message
    const msgSpan = SafeDOM.span({ className: 'flex-1' }, message)

    // Main Toast Element
    const toast = SafeDOM.div({
        className: `toast pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transform translate-x-full opacity-0 transition-all duration-300 ${styles}`
    }, [
        iconContainer,
        msgSpan,
        closeBtn
    ])

    container.appendChild(toast)

    // Animate in
    requestAnimationFrame(() => {
        toast.classList.remove('translate-x-full', 'opacity-0')
        toast.classList.add('translate-x-0', 'opacity-100')
    })

    // Auto dismiss
    const timeoutId = setTimeout(() => dismissToast(toast), duration)
    toast._timeoutId = timeoutId

    return toast
}

function dismissToast(toast) {
    if (toast._timeoutId) clearTimeout(toast._timeoutId)

    toast.classList.remove('translate-x-0', 'opacity-100')
    toast.classList.add('translate-x-full', 'opacity-0')

    setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast)
    }, TOAST_ANIMATION_DURATION)
}

function getToastStyles(type) {
    switch (type) {
        case 'success':
            return 'bg-green-600/95 text-white border border-green-500/50'
        case 'error':
            return 'bg-red-600/95 text-white border border-red-500/50'
        case 'warning':
            return 'bg-amber-600/95 text-white border border-amber-500/50'
        case 'info':
        default:
            return 'bg-surface-dark/95 text-white border border-white/10'
    }
}

function renderToastIconSvg(type) {
    const props = { className: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }
    let d = ''
    switch (type) {
        case 'success':
            d = 'M5 13l4 4L19 7'
            break
        case 'error':
            d = 'M6 18L18 6M6 6l12 12'
            break
        case 'warning':
            // Warning path is complex, usually two paths in original
            // d="M12 9v2m0 4h.01m-6.938 4h13.856..." 
            // Let's simplify or use the complex string
            d = 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
            break
        case 'info':
        default:
            d = 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            break
    }

    return SafeDOM.svg(props, [
        SafeDOM.path({ strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2', d })
    ])
}


// Convenience methods
export const toast = {
    success: (msg, duration) => showToast(msg, 'success', duration),
    error: (msg, duration) => showToast(msg, 'error', duration),
    warning: (msg, duration) => showToast(msg, 'warning', duration),
    info: (msg, duration) => showToast(msg, 'info', duration)
}

export default toast

