/**
 * ConfirmationModal Component
 * Reusable confirmation dialog for delete/destructive actions
 * Standardized warning messages across the app
 */

import { getIcon } from './Icons.js'
import { escapeHtml } from '../utils/stringUtils.js'

let modalContainer = null

function ensureContainer() {
    if (modalContainer && document.body.contains(modalContainer)) return modalContainer

    modalContainer = document.createElement('div')
    modalContainer.id = 'confirmation-modal-container'
    document.body.appendChild(modalContainer)

    return modalContainer
}

/**
 * Show a confirmation modal
 * @param {Object} options - Modal configuration
 * @param {string} options.title - Modal title
 * @param {string} options.message - Confirmation message
 * @param {string} options.confirmText - Confirm button text (default: "Confirm")
 * @param {string} options.cancelText - Cancel button text (default: "Cancel")
 * @param {string} options.type - 'danger' | 'warning' | 'info' (default: 'danger')
 * @param {string} options.clarification - Optional clarification text (e.g., "Albums will remain in inventory")
 * @param {Function} options.onConfirm - Callback when confirmed
 * @param {Function} options.onCancel - Optional callback when cancelled
 * @returns {HTMLElement} The modal element
 */
export function showConfirmationModal(options = {}) {
    const {
        title = 'Confirm Action',
        message = 'Are you sure you want to proceed?',
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        type = 'danger',
        clarification = null,
        onConfirm = () => { },
        onCancel = () => { }
    } = options

    const container = ensureContainer()

    // Remove any existing modal
    container.innerHTML = ''

    const typeConfig = getTypeConfig(type)

    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center'
    modal.innerHTML = `
        <!-- Backdrop -->
        <div class="modal-backdrop absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 transition-opacity duration-300"></div>
        
        <!-- Modal Content -->
        <div class="modal-content relative glass-panel p-6 max-w-md w-full mx-4 transform scale-95 opacity-0 transition-all duration-300">
            <div class="text-center">
                <!-- Icon -->
                <div class="w-16 h-16 mx-auto mb-4 rounded-full ${typeConfig.iconBg} flex items-center justify-center">
                    ${getIcon(typeConfig.icon, `w-8 h-8 ${typeConfig.iconColor}`)}
                </div>
                
                <!-- Title -->
                <h3 class="text-xl font-bold mb-2">${escapeHtml(title)}</h3>
                
                <!-- Message -->
                <p class="text-muted mb-4">${escapeHtml(message)}</p>
                
                <!-- Clarification (optional) -->
                ${clarification ? `
                    <div class="text-sm text-gray-400 mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                        <span class="text-accent-primary">ℹ️</span> ${escapeHtml(clarification)}
                    </div>
                ` : ''}
                
                <!-- Actions -->
                <div class="flex gap-3 justify-center">
                    <button class="btn btn-secondary modal-cancel-btn">
                        ${escapeHtml(cancelText)}
                    </button>
                    <button class="btn ${typeConfig.confirmBtnClass} modal-confirm-btn">
                        ${escapeHtml(confirmText)}
                    </button>
                </div>
            </div>
        </div>
    `

    container.appendChild(modal)

    const backdrop = modal.querySelector('.modal-backdrop')
    const content = modal.querySelector('.modal-content')
    const confirmBtn = modal.querySelector('.modal-confirm-btn')
    const cancelBtn = modal.querySelector('.modal-cancel-btn')

    // Animate in
    requestAnimationFrame(() => {
        backdrop.classList.remove('opacity-0')
        backdrop.classList.add('opacity-100')
        content.classList.remove('scale-95', 'opacity-0')
        content.classList.add('scale-100', 'opacity-100')
    })

    // Close function
    const closeModal = () => {
        backdrop.classList.remove('opacity-100')
        backdrop.classList.add('opacity-0')
        content.classList.remove('scale-100', 'opacity-100')
        content.classList.add('scale-95', 'opacity-0')

        setTimeout(() => {
            if (modal.parentNode) modal.parentNode.removeChild(modal)
        }, 300)
    }

    // Event handlers
    confirmBtn.addEventListener('click', async () => {
        confirmBtn.disabled = true
        confirmBtn.innerHTML = '<span class="animate-pulse">Processing...</span>'

        try {
            await onConfirm()
            closeModal()
        } catch (error) {
            confirmBtn.disabled = false
            confirmBtn.textContent = confirmText
            // Let the caller handle the error display via Toast
            throw error
        }
    })

    cancelBtn.addEventListener('click', () => {
        onCancel()
        closeModal()
    })

    // Close on backdrop click
    backdrop.addEventListener('click', () => {
        onCancel()
        closeModal()
    })

    // Close on Escape
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            onCancel()
            closeModal()
            document.removeEventListener('keydown', handleEscape)
        }
    }
    document.addEventListener('keydown', handleEscape)

    return modal
}

function getTypeConfig(type) {
    switch (type) {
        case 'danger':
            return {
                icon: 'AlertTriangle',
                iconBg: 'bg-red-500/20',
                iconColor: 'text-red-500',
                confirmBtnClass: 'btn-danger bg-red-600 hover:bg-red-700'
            }
        case 'warning':
            return {
                icon: 'AlertTriangle',
                iconBg: 'bg-amber-500/20',
                iconColor: 'text-amber-500',
                confirmBtnClass: 'btn-warning bg-amber-600 hover:bg-amber-700'
            }
        case 'info':
        default:
            return {
                icon: 'Info',
                iconBg: 'bg-blue-500/20',
                iconColor: 'text-blue-500',
                confirmBtnClass: 'btn-primary'
            }
    }
}


// Convenience methods for common actions
export const confirm = {
    delete: (itemName, onConfirm, clarification = null) => showConfirmationModal({
        title: 'Delete ' + itemName + '?',
        message: `This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'danger',
        clarification,
        onConfirm
    }),

    action: (title, message, onConfirm) => showConfirmationModal({
        title,
        message,
        type: 'warning',
        onConfirm
    })
}

export default { showConfirmationModal, confirm }
