/**
 * Universal BaseModal Component
 * 
 * Standardizes the "Glass Panel" modal shell across the application.
 * Replaces: Manual HTML modals in Views and legacy Modals.js (eventually).
 * 
 * @module components/ui/BaseModal
 * @since Sprint 15 (ARCH-12)
 */

import { getIcon } from '../Icons.js'
import { escapeHtml } from '../../utils/stringUtils.js'

/**
 * @typedef {Object} BaseModalProps
 * @property {string} title - Modal title
 * @property {string} content - HTML content body
 * @property {string} [footer] - HTML footer (buttons)
 * @property {'sm' | 'md' | 'lg' | 'xl'} [size='md'] - Width preset
 * @property {string} [id] - Modal ID for DOM lookup
 * @property {string} [closeAction='close-modal'] - Action string for close button
 */

export class BaseModal {
    /**
     * Render the Modal HTML
     * @param {BaseModalProps} props 
     * @returns {string} HTML string
     */
    static render(props) {
        const {
            title,
            content,
            footer,
            size = 'md',
            id = 'base-modal',
            closeAction = 'close-modal'
        } = props

        const widthClasses = {
            'sm': 'max-w-md',
            'md': 'max-w-lg',
            'lg': 'max-w-2xl',
            'xl': 'max-w-4xl'
        }

        const widthClass = widthClasses[size] || widthClasses['md']

        return `
        <div id="${id}" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div class="glass-panel w-full ${widthClass} rounded-2xl shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border border-white/10 dark-glow relative overflow-hidden flex flex-col max-h-[90vh]">
                
                <!-- Header -->
                <div class="px-6 py-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/5">
                    <h3 class="text-xl font-bold flex items-center gap-2 text-white">
                        ${escapeHtml(title)}
                    </h3>
                    <button class="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg" 
                        data-action="${closeAction}">
                        ${getIcon('X', 'w-5 h-5')}
                    </button>
                </div>

                <!-- Body (Scrollable) -->
                <div class="px-6 py-4 overflow-y-auto flex-1 custom-scrollbar">
                    ${content}
                </div>

                <!-- Footer (Optional) -->
                ${footer ? `
                <div class="px-6 py-4 border-t border-white/5 bg-white/5 flex justify-end gap-3 shrink-0">
                    ${footer}
                </div>
                ` : ''}

            </div>
        </div>
        `
    }
}
