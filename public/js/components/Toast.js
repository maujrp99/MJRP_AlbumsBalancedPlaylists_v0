/**
 * Toast Component
 * Global notification system for success/error/info messages
 * Replaces all alert() calls throughout the app
 */

const TOAST_DURATION = 4000
const TOAST_ANIMATION_DURATION = 300

// Toast container (created once, reused)
let toastContainer = null

function ensureContainer() {
    if (toastContainer && document.body.contains(toastContainer)) return toastContainer

    toastContainer = document.createElement('div')
    toastContainer.id = 'toast-container'
    toastContainer.className = 'fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none'
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

    const toast = document.createElement('div')
    toast.className = `
        toast pointer-events-auto
        flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg
        transform translate-x-full opacity-0 transition-all duration-300
        ${getToastStyles(type)}
    `.replace(/\s+/g, ' ').trim()

    toast.innerHTML = `
        <span class="toast-icon">${getToastIcon(type)}</span>
        <span class="toast-message flex-1">${escapeHtml(message)}</span>
        <button class="toast-close opacity-60 hover:opacity-100 transition-opacity" aria-label="Close">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
        </button>
    `

    // Close button handler
    toast.querySelector('.toast-close').addEventListener('click', () => dismissToast(toast))

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

function getToastIcon(type) {
    switch (type) {
        case 'success':
            return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>`
        case 'error':
            return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>`
        case 'warning':
            return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>`
        case 'info':
        default:
            return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>`
    }
}

function escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
}

// Convenience methods
export const toast = {
    success: (msg, duration) => showToast(msg, 'success', duration),
    error: (msg, duration) => showToast(msg, 'error', duration),
    warning: (msg, duration) => showToast(msg, 'warning', duration),
    info: (msg, duration) => showToast(msg, 'info', duration)
}

export default toast
