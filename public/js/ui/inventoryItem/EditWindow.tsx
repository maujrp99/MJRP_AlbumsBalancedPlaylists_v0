/**
 * EditWindow - the window to edit an item of the inventory (F83 wave 6b; the port of components/InventoryEditModal.js, in the shell of the app's
 * windows, ui/ModalShell): the format, the currency, the price paid and the notes. The hand-made one had no tests; test/ui/albumWindow/
 * AlbumWindow.sameAsBefore.test.tsx keeps this one equal to it, state by state. Its existing defects are kept (an issue candidate each): the
 * save tells the person twice (the controller's notice and this window's), an item with no currency is saved in BRL, a price of 0 is read as
 * none, no Escape and no backdrop, no focus.
 */
import { useState } from 'react'
import { t } from '../../i18n/t.js'
import { ModalShell } from '../ModalShell'
import type { Notify } from '../notify'
import { ItemForm, type ItemDraft } from './ItemForm'
import type { ItemLike } from './types'

type Item = ItemLike

export interface EditWindowProps {
    item: Item
    /** Called with the id of the item and what changed when the person saves; it may refuse (throw). */
    onSave: (id: string, updates: object) => Promise<void> | void
    /** The site's notices: a piece of ui/ holds no store. */
    notify: Notify
    close: () => void
}

export function EditWindow({ item, onSave, notify, close }: EditWindowProps) {
    // an item as an album («album» inside), or an item with its album's fields in it
    const album: Item = item.album || item
    const inventoryId = (item.id || album.id) as string
    const [draft] = useState<ItemDraft>(() => ({
        format: item.format || album.format || '',
        currency: item.currency || album.currency || 'BRL',
        price: item.purchasePrice || album.purchasePrice || null,
        notes: item.notes || album.notes || ''
    }))
    const [initial] = useState(draft)

    const save = async (): Promise<void> => {
        const updates = {
            format: draft.format || null,
            currency: draft.currency,
            purchasePrice: draft.price,
            notes: draft.notes ? draft.notes.trim() : ''
        }
        try {
            await onSave(inventoryId, updates)
            close()
            notify.success(t('inventory.edit.updated'))
        } catch (err) {
            console.error('Update failed', err)
            notify.error(t('inventory.edit.failed', { reason: (err as Error).message || t('inventory.edit.unknown') }))
        }
    }

    const footer = (
        <>
            <button type="button" className="btn btn-ghost" data-action="close-modal" onClick={close}>{t('inventory.edit.cancel')}</button>
            <button type="button" className="btn btn-primary" onClick={() => { void save() }}>{t('inventory.edit.save')}</button>
        </>
    )

    return (
        <ModalShell id="inventory-edit-modal" title={t('inventory.edit.title')} size="md" onClose={close} footer={footer}>
            <ItemForm
                mode="edit"
                draft={draft}
                title={album.title || t('inventory.form.unknownTitle')}
                subtitle={album.artist || t('inventory.form.unknownArtist')}
                allowNotSet={!initial.format}
                initialPrice={initial.price}
            />
        </ModalShell>
    )
}
