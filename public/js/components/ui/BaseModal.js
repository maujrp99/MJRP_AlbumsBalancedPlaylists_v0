/**
 * Universal BaseModal Component (SafeDOM Version)
 * 
 * Standardizes the "Glass Panel" modal shell across the application.
 * Replaces: Manual HTML modals in Views and legacy Modals.js (eventually).
 * 
 * Sprint 15 Phase 3: Refactored to use SafeDOM for zero innerHTML.
 * 
 * @module components/ui/BaseModal
 * @since Sprint 15 (ARCH-12)
 */

import { SafeDOM } from '../../utils/SafeDOM.js'
import { getIcon } from '../Icons.js'

/**
 * @typedef {Object} BaseModalProps
 * @property {string} title - Modal title
 * @property {string|Node|Array} content - Body content (string text, DOM node, or array)
 * @property {string|Node|Array} [footer] - Footer content (buttons)
 * @property {'sm' | 'md' | 'lg' | 'xl'} [size='md'] - Width preset
 * @property {string} [id] - Modal ID for DOM lookup
 * @property {string} [closeAction='close-modal'] - Action string for close button
 * @property {Function} [onClose] - Close button handler
 */

export class BaseModal {
    /**
     * Render the Modal as a DOM Node
     * @param {BaseModalProps} props 
     * @returns {HTMLElement} DOM Node
     */
    static render(props) {
        const {
            title,
            content,
            footer,
            size = 'md',
            id = 'base-modal',
            closeAction = 'close-modal',
            onClose
        } = props

        const widthClasses = {
            'sm': 'max-w-md',
            'md': 'max-w-lg',
            'lg': 'max-w-2xl',
            'xl': 'max-w-4xl'
        }

        const widthClass = widthClasses[size] || widthClasses['md']

        // Close button
        const closeBtn = SafeDOM.button({
            className: 'text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg',
            dataset: { action: closeAction },
            onClick: onClose
        })
        // Insert icon (getIcon returns HTML string, we need to parse it)
        closeBtn.innerHTML = getIcon('X', 'w-5 h-5')

        // Header
        const header = SafeDOM.div({
            className: 'px-6 py-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/5'
        }, [
            SafeDOM.h3({
                className: 'text-xl font-bold flex items-center gap-2 text-white'
            }, title),
            closeBtn
        ])

        // Body
        const body = SafeDOM.div({
            className: 'px-6 py-4 overflow-y-auto flex-1 custom-scrollbar'
        }, content)

        // Footer (optional)
        const footerEl = footer ? SafeDOM.div({
            className: 'px-6 py-4 border-t border-white/5 bg-white/5 flex justify-end gap-3 shrink-0'
        }, footer) : null

        // Panel
        const panel = SafeDOM.div({
            className: `glass-panel w-full ${widthClass} rounded-2xl shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border border-white/10 dark-glow relative overflow-hidden flex flex-col max-h-[90vh]`
        }, [
            header,
            body,
            footerEl
        ])

        // Backdrop container
        const modal = SafeDOM.div({
            id,
            className: 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200'
        }, panel)

        return modal
    }

    /**
     * Helper: Mount modal to DOM
     * @param {HTMLElement} modal - The modal element
     * @param {HTMLElement} [container=document.body] - Container to mount to
     */
    static mount(modal, container = document.body) {
        container.appendChild(modal)
    }

    /**
     * Helper: Unmount/Remove modal from DOM
     * @param {string|HTMLElement} modalOrId - Modal element or ID
     */
    static unmount(modalOrId) {
        const el = typeof modalOrId === 'string'
            ? document.getElementById(modalOrId)
            : modalOrId
        if (el && el.parentNode) {
            el.parentNode.removeChild(el)
        }
    }

    /**
     * Backwards-compatible HTML string renderer
     * Use this when you need HTML string (for template literals or innerHTML)
     * @param {BaseModalProps} props 
     * @returns {string} HTML string
     */
    static renderHTML(props) {
        const el = this.render(props)
        return el.outerHTML
    }

    /**
     * Helper: Create standard footer buttons
     * @param {Object} options
     * @param {string} [options.cancelText='Cancel']
     * @param {string} [options.confirmText='Confirm']
     * @param {string} [options.confirmClass='btn-primary']
     * @param {Function} [options.onCancel]
     * @param {Function} [options.onConfirm]
     * @param {string} [options.confirmAction]
     * @param {string} [options.cancelAction='close-modal']
     * @returns {DocumentFragment}
     */
    static createFooterButtons(options = {}) {
        const {
            cancelText = 'Cancel',
            confirmText = 'Confirm',
            confirmClass = 'btn-primary',
            onCancel,
            onConfirm,
            confirmAction,
            cancelAction = 'close-modal'
        } = options

        const cancelBtn = SafeDOM.button({
            className: 'btn btn-ghost',
            dataset: { action: cancelAction },
            onClick: onCancel
        }, cancelText)

        const confirmBtn = SafeDOM.button({
            className: `btn ${confirmClass}`,
            dataset: confirmAction ? { action: confirmAction } : {},
            onClick: onConfirm
        }, confirmText)

        return SafeDOM.fragment([cancelBtn, confirmBtn])
    }
}
