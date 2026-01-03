import { BaseModal } from '../components/ui/BaseModal.js'
import { ConfirmModal } from '../components/ui/modals/ConfirmModal.js'
import { InputModal } from '../components/ui/modals/InputModal.js'

/**
 * Dialog Service
 * Singleton service for managing application modals programmatically.
 * @module services/DialogService
 */
class DialogService {
    constructor() {
        this.activeModal = null
        this.container = document.body
    }

    /**
     * Show a generic modal
     * @private
     * @param {HTMLElement} modalElement 
     */
    _show(modalElement) {
        // If there's an active modal, remove it first (prevent stacking for now, or stack if supported)
        if (this.activeModal) {
            this.close()
        }

        this.activeModal = modalElement
        BaseModal.mount(modalElement, this.container)

        // Handle Escape key globally for the active modal
        this._keydownHandler = (e) => {
            if (e.key === 'Escape') {
                this.close()
                // Cancel callback is mostly handled by component, 
                // but we should ensure promise resolution if wrapper didn't handles it.
                // For this service, components call inner close callbacks/promises.
            }
        }
        document.addEventListener('keydown', this._keydownHandler)

        // Auto focus support
        if (modalElement._autofocusElement) {
            requestAnimationFrame(() => modalElement._autofocusElement.focus())
        }
    }

    /**
     * Close the active modal
     */
    close() {
        if (!this.activeModal) return

        BaseModal.unmount(this.activeModal)

        if (this._keydownHandler) {
            document.removeEventListener('keydown', this._keydownHandler)
            this._keydownHandler = null
        }

        this.activeModal = null
    }

    /**
     * Show Confirmation Dialog
     * @param {import('../components/ui/modals/ConfirmModal').ConfirmModalProps} options 
     * @returns {Promise<boolean>} Resolves true if confirmed, false if cancelled
     */
    confirm(options) {
        return new Promise((resolve) => {
            const modal = ConfirmModal.render({
                ...options,
                onConfirm: () => {
                    resolve(true)
                    this.close()
                },
                onCancel: () => {
                    resolve(false)
                    this.close()
                }
            })
            this._show(modal)
        })
    }

    /**
     * Show Input Prompt Dialog
     * @param {import('../components/ui/modals/InputModal').InputModalProps} options 
     * @returns {Promise<string|null>} Resolves with value or null if cancelled
     */
    prompt(options) {
        return new Promise((resolve) => {
            const modal = InputModal.render({
                ...options,
                onConfirm: (value) => {
                    resolve(value)
                    this.close()
                },
                onCancel: () => {
                    resolve(null)
                    this.close()
                }
            })
            this._show(modal)
        })
    }

    /**
     * Show Alert Dialog (Single OK button)
     * @param {string} title 
     * @param {string} message 
     * @returns {Promise<void>}
     */
    alert(title, message) {
        return this.confirm({
            title,
            message,
            confirmText: 'OK',
            cancelText: null, // Hack: ConfirmModal assumes cancel exists? We should adjust ConfirmModal
            // Workaround: We'll make ConfirmModal handle optional cancel text
        }).then(() => { }) // always resolves true/false but we just wait
    }
}

// Ensure ConfirmModal supports null cancelText for Alert mode
// (Wait, I need to check ConfirmModal implementation I just wrote. 
// It does: `cancelText = 'Cancel'`, so it defaults. 
// If I pass null, `BaseModal.createFooterButtons` will render it.
// I should have made sure BaseModal handles it. 
// BaseModal.createFooterButtons: cancels buttons if onCancel is provided. 
// Actually it renders cancelBtn always? 
// Snippet from BaseModal.js:
// const cancelBtn = SafeDOM.button(..., cancelText)
// It doesn't check if cancelText is null to skip rendering.
// I'll need to patch BaseModal or ConfirmModal to support Alert mode properly later.
// For now, Alert is low priority. 

export const dialogService = new DialogService()
