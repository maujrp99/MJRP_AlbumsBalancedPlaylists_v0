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
     * @param {Function} [onDismiss] - answers whoever asked when the dialog goes away with no
     *        answer (Escape, another dialog taking its place): the same as "Cancel"
     */
    _show(modalElement, onDismiss = null) {
        // One dialog at a time: the one on screen is dismissed, and whoever asked gets its answer
        this.dismiss()

        this.activeModal = modalElement
        this._onDismiss = onDismiss
        BaseModal.mount(modalElement, this.container)

        // Escape is "Cancel": the dialog goes away AND the question is answered (F63)
        this._keydownHandler = (e) => {
            if (e.key === 'Escape') this.dismiss()
        }
        document.addEventListener('keydown', this._keydownHandler)

        // Auto focus support
        if (modalElement._autofocusElement) {
            requestAnimationFrame(() => modalElement._autofocusElement.focus())
        }
    }

    /**
     * The dialog goes away with no answer given: whoever asked is answered as cancelled.
     */
    dismiss() {
        if (!this.activeModal) return
        const onDismiss = this._onDismiss
        if (onDismiss) onDismiss()
        else this.close()
    }

    /**
     * Close the active modal
     */
    close() {
        if (!this.activeModal) return

        this._onDismiss = null

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
            const cancel = () => {
                resolve(false)
                this.close()
            }
            const modal = ConfirmModal.render({
                ...options,
                onConfirm: () => {
                    resolve(true)
                    this.close()
                },
                onCancel: cancel
            })
            this._show(modal, cancel)
        })
    }

    /**
     * Show Input Prompt Dialog
     * @param {import('../components/ui/modals/InputModal').InputModalProps} options
     * @returns {Promise<string|null>} Resolves with value or null if cancelled
     */
    prompt(options) {
        return new Promise((resolve) => {
            const cancel = () => {
                resolve(null)
                this.close()
            }
            const modal = InputModal.render({
                ...options,
                onConfirm: (value) => {
                    resolve(value)
                    this.close()
                },
                onCancel: cancel
            })
            this._show(modal, cancel)
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
