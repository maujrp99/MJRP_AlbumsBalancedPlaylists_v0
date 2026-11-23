/**
 * AddWindow - the window to add an album of the albums screen to the inventory (F83 wave 6b; the port of components/InventoryAddModal.js, in the
 * shell of the app's windows, ui/ModalShell): the format (CD to start), the currency (BRL to start), the price paid and the notes. Only the albums
 * screen opens it, by `import()` when «Add to inventory» is pressed, and gives it what writes the album (`add`: the inventory service): a piece of
 * ui/ holds no service. The hand-made one had no tests; test/ui/albumWindow/AlbumWindow.sameAsBefore.test.tsx keeps this one equal to it, state by
 * state. Its existing defects are kept (an issue candidate each): the button can be pressed twice during the write (and adds twice), no Escape and
 * no backdrop, no focus, BRL to start.
 */
import { useState } from 'react'
import { t } from '../../i18n/t.js'
import { ModalShell } from '../ModalShell'
import type { Notify } from '../notify'
import { showWindow } from '../windowLayer'
import { ItemForm, type ItemDraft } from './ItemForm'
import type { ItemLike } from './types'

type Album = ItemLike

/** What writes the album into the inventory: it refuses (throws) an album that is already there. */
export type AddAlbum = (album: Album, format: string, options: { currency: string; purchasePrice: number | null; notes: string }) => Promise<unknown>

export interface AddWindowProps {
    album: Album
    add: AddAlbum
    /** The site's notices: a piece of ui/ holds no store. */
    notify: Notify
    onSuccess?: () => void
    close: () => void
}

export function AddWindow({ album, add, notify, onSuccess, close }: AddWindowProps) {
    const [draft] = useState<ItemDraft>(() => ({ format: 'cd', currency: 'BRL', price: null, notes: '' }))

    const addIt = async (): Promise<void> => {
        const options = { currency: draft.currency, purchasePrice: draft.price, notes: draft.notes ? draft.notes.trim() : '' }
        try {
            await add(album, draft.format, options)
            notify.success(t('albums.add.added'))
            if (onSuccess) onSuccess()
            close()
        } catch (error) {
            const message = (error as Error | null)?.message
            if (message && message.includes('already in inventory')) {
                notify.warning(t('albums.add.already'))
            } else {
                console.error('Add failed', error)
                notify.error(t('albums.add.failed', { reason: message || t('albums.add.unknown') }))
            }
        }
    }

    const footer = (
        <>
            <button type="button" className="btn btn-ghost" data-action="close-modal" onClick={close}>{t('albums.add.cancel')}</button>
            <button type="button" className="btn btn-primary" onClick={() => { void addIt() }}>{t('albums.add.confirm')}</button>
        </>
    )

    return (
        <ModalShell id="inventory-add-modal" title={t('albums.add.title')} size="md" onClose={close} footer={footer}>
            <ItemForm
                mode="add"
                draft={draft}
                title={album.title || t('inventory.form.unknownTitle')}
                subtitle={`${album.artist || t('inventory.form.unknownArtist')} ${album.year ? `• ${album.year}` : ''}`}
            />
        </ModalShell>
    )
}

/**
 * @param album - the album to add (the albums screen's own shape: the service reads what it needs of it)
 * @param what - `add` writes it; `notify` is the site's notices; `onSuccess` is called when it was added
 */
export function openAddWindow(album: Album, { add, notify, onSuccess }: { add: AddAlbum; notify: Notify; onSuccess?: () => void }): void {
    showWindow(close => <AddWindow album={album} add={add} notify={notify} onSuccess={onSuccess} close={close} />)
}
