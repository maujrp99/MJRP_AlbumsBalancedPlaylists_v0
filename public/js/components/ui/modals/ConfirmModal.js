import { BaseModal } from '../BaseModal.js'
import { SafeDOM } from '../../../utils/SafeDOM.js'

/**
 * Standard Confirmation Modal
 * @module components/ui/modals/ConfirmModal
 */
export class ConfirmModal {
    /**
     * @typedef {Object} ConfirmModalProps
     * @property {string} title - Modal title
     * @property {string} message - Main confirmation message
     * @property {string} [confirmText='Confirm'] - Confirm button label
     * @property {string} [cancelText='Cancel'] - Cancel button label
     * @property {'primary'|'danger'|'warning'} [variant='primary'] - Visual style of confirm button
     * @property {Function} onConfirm - Called when confirmed
     * @property {Function} onCancel - Called when cancelled
     */

    /**
     * Render the Confirmation Modal
     * @param {ConfirmModalProps} props 
     * @returns {HTMLElement}
     */
    static render(props) {
        const {
            title,
            message,
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            variant = 'primary',
            onConfirm,
            onCancel
        } = props

        const variantMap = {
            'primary': 'btn-primary',
            'danger': 'btn-danger',
            'warning': 'btn-warning'
        }
        const confirmClass = variantMap[variant] || 'btn-primary'

        // Create footer with standard buttons
        const footer = BaseModal.createFooterButtons({
            cancelText,
            confirmText,
            confirmClass,
            onCancel,
            onConfirm,
            confirmAction: 'confirm',
            cancelAction: 'cancel'
        })

        // Simple text message
        const content = SafeDOM.p({ className: 'text-gray-300 leading-relaxed' }, message)

        return BaseModal.render({
            title,
            content,
            footer,
            size: 'sm',
            id: 'confirm-modal',
            onClose: onCancel
        })
    }
}
