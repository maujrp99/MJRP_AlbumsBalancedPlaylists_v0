import { BaseModal } from './ui/BaseModal.js'
import { SafeDOM } from '../utils/SafeDOM.js'
import { toast } from './Toast.js'
import { inventoryStore } from '../stores/inventory.js'
import { getIcon } from './Icons.js'

export class InventoryAddModal {
    /**
     * Open Add Modal
     * @param {Object} album - Album to add
     * @param {Function} [onSuccess] - Callback on success
     */
    static open(album, onSuccess) {
        // Defaults
        let format = 'cd'
        let currency = 'BRL'
        let price = null
        let notes = ''

        // --- Content Construction ---

        // 1. Info Header
        const infoHeader = SafeDOM.div({ className: 'bg-surface-dark p-3 rounded-lg border border-surface-light mb-4' }, [
            SafeDOM.p({ className: 'font-semibold' }, album.title || 'Unknown Title'),
            SafeDOM.p({ className: 'text-sm text-gray-400' },
                `${album.artist || 'Unknown Artist'} ${album.year ? `• ${album.year}` : ''}`
            )
        ])

        // 2. Format Select
        const formatSelect = SafeDOM.select({
            className: 'form-control w-full',
            id: 'add-format',
            onChange: (e) => format = e.target.value
        }, [
            SafeDOM.option({ value: 'cd' }, 'CD'),
            SafeDOM.option({ value: 'vinyl' }, 'Vinyl'),
            SafeDOM.option({ value: 'cassette' }, 'Cassette'),
            SafeDOM.option({ value: 'dvd' }, 'DVD'),
            SafeDOM.option({ value: 'bluray' }, 'Blu-ray'),
            SafeDOM.option({ value: 'digital' }, 'Digital')
        ])

        const formatGroup = SafeDOM.div({ className: 'mb-4' }, [
            SafeDOM.label({ className: 'block mb-2 text-sm font-medium text-gray-300', htmlFor: 'add-format' }, [
                'Format: ', SafeDOM.span({ className: 'text-accent-primary' }, '*')
            ]),
            formatSelect
        ])

        // 3. Currency Radios
        const createRadio = (val) => {
            return SafeDOM.label({ className: 'flex items-center gap-2 cursor-pointer' }, [
                SafeDOM.input({
                    type: 'radio',
                    name: 'add-currency',
                    value: val,
                    checked: currency === val,
                    className: 'form-radio text-accent-primary focus:ring-accent-primary',
                    onChange: (e) => {
                        if (e.target.checked) {
                            currency = val
                            updateCurrencyPrefix()
                        }
                    }
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
        const currencyPrefixSpan = SafeDOM.span({ className: 'absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' }, 'R$')

        const updateCurrencyPrefix = () => {
            currencyPrefixSpan.textContent = currency === 'USD' ? '$' : 'R$'
        }

        const priceInput = SafeDOM.input({
            type: 'number',
            className: 'form-control w-full pl-10',
            step: '0.01',
            min: '0',
            placeholder: '0.00',
            onInput: (e) => price = e.target.value ? parseFloat(e.target.value) : null
        })

        const priceGroup = SafeDOM.div({ className: 'mb-4' }, [
            SafeDOM.label({ className: 'block mb-2 text-sm font-medium text-gray-300' }, 'Purchase Price:'),
            SafeDOM.div({ className: 'relative' }, [
                currencyPrefixSpan,
                priceInput
            ])
        ])

        // 5. Notes
        const notesInput = SafeDOM.textarea({
            className: 'form-control w-full resize-none',
            rows: 3,
            placeholder: 'e.g. Mint condition, Japanese import...',
            onInput: (e) => notes = e.target.value
        })

        const notesGroup = SafeDOM.div({ className: 'mb-4' }, [
            SafeDOM.label({ className: 'block mb-2 text-sm font-medium text-gray-300' }, 'Condition / Notes:'),
            notesInput
        ])

        // Feedback Message Container
        const feedbackEl = SafeDOM.div({ className: 'hidden text-sm font-bold text-right px-6 pb-2 whitespace-nowrap' })

        const content = SafeDOM.div({}, [
            infoHeader,
            formatGroup,
            currencyGroup,
            priceGroup,
            notesGroup,
            feedbackEl
        ])

        // --- Actions ---

        const closeModal = () => BaseModal.unmount('inventory-add-modal')

        const handleAdd = async () => {
            const options = {
                currency,
                purchasePrice: price,
                notes: notes ? notes.trim() : ''
            }

            // Visual feedback handled below, disable implicit close
            try {
                // We need to access button to disable it? 
                // BaseModal footer buttons are not easily accessible unless we pass custom footer or handle it here.
                // We will rely on toast for main feedback, but legacy modal had detailed inline feedback.
                // Let's implement basics.

                await inventoryStore.addAlbum(album, format, options)

                toast.success('Album added to inventory!')
                if (onSuccess) onSuccess()
                closeModal()

            } catch (error) {
                const isDuplicate = error && error.message && error.message.includes('already in inventory')

                if (isDuplicate) {
                    toast.warning('Album is already in your inventory')
                } else {
                    console.error('Add failed', error)
                    toast.error('Failed to add: ' + (error.message || 'Unknown'))
                }
            }
        }

        const footer = BaseModal.createFooterButtons({
            confirmText: 'Add to Inventory',
            onCancel: closeModal,
            onConfirm: handleAdd
        })

        const modal = BaseModal.render({
            id: 'inventory-add-modal',
            title: 'Add to Inventory',
            content,
            footer,
            size: 'md',
            onClose: closeModal
        })

        BaseModal.mount(modal)
    }
}
