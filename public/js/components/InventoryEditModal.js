import { BaseModal } from './ui/BaseModal.js'
import { SafeDOM } from '../utils/SafeDOM.js'
import { toast } from './Toast.js'
import { getIcon } from './Icons.js'

export class InventoryEditModal {
    /**
     * Open Edit Modal
     * @param {Object} item - Inventory item
     * @param {Function} onSave - Callback(id, updates)
     */
    static open(item, onSave) {
        // Normalize
        const album = item.album || item
        const inventoryId = item.id || album.id

        // Form Logic
        let format = item.format || album.format || 'cd'
        let currency = item.currency || album.currency || 'BRL'
        let price = item.purchasePrice || album.purchasePrice || null
        let notes = item.notes || album.notes || ''

        // --- Content Construction ---

        // 1. Info Header
        const infoHeader = SafeDOM.div({ className: 'bg-surface-dark p-3 rounded-lg border border-surface-light mb-4' }, [
            SafeDOM.p({ className: 'font-semibold' }, album.title || 'Unknown Title'),
            SafeDOM.p({ className: 'text-sm text-gray-400' }, album.artist || 'Unknown Artist')
        ])

        // 2. Format Select
        const formatSelect = SafeDOM.select({
            className: 'form-control w-full',
            id: 'edit-format',
            onChange: (e) => format = e.target.value
        }, [
            SafeDOM.option({ value: 'cd', selected: format === 'cd' }, 'CD'),
            SafeDOM.option({ value: 'vinyl', selected: format === 'vinyl' }, 'Vinyl'),
            SafeDOM.option({ value: 'cassette', selected: format === 'cassette' }, 'Cassette'),
            SafeDOM.option({ value: 'dvd', selected: format === 'dvd' }, 'DVD'),
            SafeDOM.option({ value: 'bluray', selected: format === 'bluray' }, 'Blu-ray'),
            SafeDOM.option({ value: 'digital', selected: format === 'digital' }, 'Digital')
        ])

        const formatGroup = SafeDOM.div({ className: 'mb-4' }, [
            SafeDOM.label({ className: 'block mb-2 text-sm font-medium text-gray-300', htmlFor: 'edit-format' }, 'Format:'),
            formatSelect
        ])

        // 3. Currency Radios
        const createRadio = (val) => {
            return SafeDOM.label({ className: 'flex items-center gap-2 cursor-pointer' }, [
                SafeDOM.input({
                    type: 'radio',
                    name: 'edit-currency',
                    value: val,
                    checked: currency === val,
                    className: 'form-radio text-accent-primary focus:ring-accent-primary',
                    onChange: (e) => { if (e.target.checked) currency = val }
                }),
                SafeDOM.span({}, val)
            ])
        }

        const currencyGroup = SafeDOM.div({ className: 'mb-4' }, [
            SafeDOM.label({ className: 'block mb-2 text-sm font-medium text-gray-300' }, 'Currency:'),
            SafeDOM.div({ className: 'flex gap-4' }, [
                createRadio('BRL'),
                createRadio('USD')
            ])
        ])

        // 4. Price Input
        const priceInput = SafeDOM.input({
            type: 'number',
            className: 'form-control w-full',
            step: '0.01',
            min: '0',
            value: price !== null ? price : '',
            placeholder: '0.00',
            onInput: (e) => price = e.target.value ? parseFloat(e.target.value) : null
        })

        const priceGroup = SafeDOM.div({ className: 'mb-4' }, [
            SafeDOM.label({ className: 'block mb-2 text-sm font-medium text-gray-300' }, 'Purchase Price:'),
            priceInput
        ])

        // 5. Notes
        const notesInput = SafeDOM.textarea({
            className: 'form-control w-full resize-none',
            rows: 3,
            placeholder: 'Condition, edition, etc.',
            onInput: (e) => notes = e.target.value
        })
        notesInput.value = notes // Set value after creation to support newlines

        const notesGroup = SafeDOM.div({ className: 'mb-4' }, [
            SafeDOM.label({ className: 'block mb-2 text-sm font-medium text-gray-300' }, 'Notes:'),
            notesInput
        ])

        const content = SafeDOM.div({}, [
            infoHeader,
            formatGroup,
            currencyGroup,
            priceGroup,
            notesGroup
        ])

        // --- Actions ---

        const closeModal = () => BaseModal.unmount('inventory-edit-modal')

        const handleSave = async () => {
            // Basic validation? None really required besides defaults.
            const updates = {
                format,
                currency,
                purchasePrice: price,
                notes: notes ? notes.trim() : ''
            }

            try {
                // If onSave returns promise, await it
                await onSave(inventoryId, updates)
                closeModal()
                toast.success('Inventory item updated')
            } catch (err) {
                console.error('Update failed', err)
                toast.error('Failed to update item: ' + (err.message || 'Unknown error'))
            }
        }

        const footer = BaseModal.createFooterButtons({
            confirmText: 'Save Changes',
            onCancel: closeModal,
            onConfirm: handleSave
        })

        const modal = BaseModal.render({
            id: 'inventory-edit-modal',
            title: 'Edit Inventory Item',
            content,
            footer,
            size: 'md',
            onClose: closeModal
        })

        BaseModal.mount(modal)
    }
}
