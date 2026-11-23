/**
 * openAlbumWindow - the one door to the album window (F83 wave 6b): the albums screen and the inventory ask for it by `import()` when a card is
 * pressed, as they asked for the hand-made one, so the window (and the table of tracks it holds) is not in the first download of either screen.
 */
import { isPhone } from '../../utils/isPhone.js'
import { showWindow, type WindowHandle } from '../windowLayer'
import { AlbumWindow, type AlbumInput } from './AlbumWindow'
import type { AlbumSources } from './sources'
import type { ReactNode } from 'react'

export interface AlbumWindowOptions {
    loadAlbum?: ((signal: AbortSignal) => Promise<unknown>) | null
    sources?: AlbumSources
    above?: ReactNode
}

/** @param album - a loaded album, or an inventory item (it holds its album in `albumData`) */
export async function openAlbumWindow(album: AlbumInput, options: AlbumWindowOptions = {}): Promise<WindowHandle> {
    const phone = isPhone() // asked once, as the hand-made window did
    return showWindow(close => <AlbumWindow album={album} phone={phone} close={close} {...options} />)
}
