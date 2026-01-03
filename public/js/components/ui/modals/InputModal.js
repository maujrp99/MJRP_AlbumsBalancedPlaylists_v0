import { BaseModal } from '../BaseModal.js'
import { SafeDOM } from '../../../utils/SafeDOM.js'

/**
 * Standard Input Modal (Prompt)
 * @module components/ui/modals/InputModal
 */
export class InputModal {
    /**
     * @typedef {Object} InputModalProps
     * @property {string} title - Modal title
     * @property {string} [message] - Helper text above input
     * @property {string} [label] - Input label
     * @property {string} [initialValue=''] - Initial input value
     * @property {string} [placeholder=''] - Input placeholder
     * @property {string} [confirmText='Save'] - Confirm button label
     * @property {string} [cancelText='Cancel'] - Cancel button label
     * @property {Function} [validate] - Validation function (value) => boolean
     * @property {Function} onConfirm - Called with final value
     * @property {Function} onCancel - Called when cancelled
     */

    /**
     * Render the Input Modal
     * @param {InputModalProps} props 
     * @returns {HTMLElement}
     */
    static render(props) {
        const {
            title,
            message,
            label,
            initialValue = '',
            placeholder = '',
            confirmText = 'Save',
            cancelText = 'Cancel',
            validate = (val) => val && val.trim().length > 0, // Default: non-empty
            onConfirm,
            onCancel
        } = props

        let currentValue = initialValue

        // Input element
        const input = SafeDOM.input({
            type: 'text',
            className: 'w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-green-500 focus:outline-none transition-colors',
            value: initialValue,
            placeholder,
            autoFocus: true // Helper prop for SafeDOM or simple attribute
        })

        // Standard Footer
        // We'll capture the confirm button reference to toggle disabled state
        const footerFragment = BaseModal.createFooterButtons({
            cancelText,
            confirmText,
            onCancel,
            onConfirm: () => onConfirm(currentValue),
            confirmAction: 'confirm'
        })

        // Find confirm button in fragment (assumes BaseModal structure: [cancel, confirm])
        // Since fragment doesn't support querySelector, we iterate children if mounted, otherwise we assume order
        // Actually BaseModal returns a DocumentFragment.
        // Let's rely on event bubbling/updating or custom logic.
        // Better: create buttons manually here to have direct reference.

        const cancelBtn = SafeDOM.button({
            className: 'btn btn-ghost',
            onClick: onCancel
        }, cancelText)

        const confirmBtn = SafeDOM.button({
            className: 'btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed',
            onClick: () => onConfirm(currentValue),
            disabled: !validate(initialValue)
        }, confirmText)

        const footer = SafeDOM.div({ className: 'flex justify-end gap-3 w-full' }, [cancelBtn, confirmBtn])

        // Validation Handler
        input.addEventListener('input', (e) => {
            currentValue = e.target.value
            const isValid = validate(currentValue)
            confirmBtn.disabled = !isValid
        })

        // Enter key handler
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !confirmBtn.disabled) {
                onConfirm(currentValue)
            }
        })

        const contentNodes = []
        if (message) {
            contentNodes.push(SafeDOM.p({ className: 'text-gray-400 mb-4 text-sm' }, message))
        }

        const inputGroup = SafeDOM.div({ className: 'flex flex-col gap-2' }, [
            label ? SafeDOM.label({ className: 'text-sm font-medium text-gray-300' }, label) : null,
            input
        ])
        contentNodes.push(inputGroup)

        const modal = BaseModal.render({
            title,
            content: SafeDOM.div({}, contentNodes),
            footer,
            size: 'sm',
            id: 'input-modal',
            onClose: onCancel
        })

        // Auto-focus hack (since autoFocus attr might trigger before mount)
        // We attach a trivial observer or just rely on CSS-based focus if possible, 
        // but JS focus after mount is best.
        // We can expose the input via a property on the modal if needed, or just let the caller mount it.
        // DialogService will handle mounting.

        // Store input ref on modal for service to focus
        modal._autofocusElement = input

        return modal
    }
}
