/**
 * F70, UAT-63 - a cover that has no address, or whose address fails to load, shows a stand-in.
 * One helper draws every album cover (components/ui/coverImage.js): the albums screen, the album
 * picker, the series being built, the inventory, the saved playlists and the album window.
 *
 * Most cards are written into the page as text (`outerHTML`), so a listener on the image itself
 * would be lost: the helper listens once, on the document, for the `error` of any cover.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../../../public/js/services/AlbumLoader.js', () => ({
    albumLoader: { getArtworkUrl: (album) => album.coverUrl || null }
}))

import { coverImage, watchCovers, COVER_STAND_IN } from '../../../public/js/components/ui/coverImage.js'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { CompactCard } from '../../../public/js/screens/albums/AlbumCard'
import { ItemCard } from '../../../public/js/screens/inventory/ItemCard'
import { ItemRow } from '../../../public/js/screens/inventory/ItemRow'
import { AlbumCascade } from '../../../public/js/ui/AlbumCascade.tsx'
import { PickerCard } from '../../../public/js/ui/albumPicker/PickerParts'
import { appFiles, importsOf, read } from '../../architecture/support/sourceImports.js'

const GOOD = 'https://covers.example/album/300x300.jpg'
const fail = (img) => img.dispatchEvent(new Event('error'))
const isStandIn = (img) => img.getAttribute('src') === COVER_STAND_IN && img.dataset.coverStandIn === 'true'
globalThis.IS_REACT_ACT_ENVIRONMENT = true

/** The album card of the albums screen (React, F83 wave 5a: it was AlbumCardRenderer), drawn in the page. */
const drawCard = async (album) => {
    const host = document.body.appendChild(document.createElement('div'))
    await act(async () => { createRoot(host).render(createElement(CompactCard, { album, act: () => { } })) })
    return host
}
const coversIn = (root) => [...root.querySelectorAll('img[data-cover]')]
/** The card of the album picker (React, F83 wave 5b: it was DiscographyRenderer), drawn in a box that is not in the page yet. */
const pickerCard = async (album) => {
    const host = document.createElement('div')
    await act(async () => { createRoot(host).render(createElement(PickerCard, { album, onPick: () => { } })) })
    return host.firstElementChild
}

describe('coverImage: the one way an album cover is drawn', () => {
    beforeEach(() => { document.body.innerHTML = '' })

    it('with an address: the image of that address, marked as a cover, with what the caller asked', () => {
        const img = coverImage({ src: GOOD, alt: 'Animals', className: 'w-full', loading: 'lazy' })

        expect(img.tagName).toBe('IMG')
        expect(img.getAttribute('src')).toBe(GOOD)
        expect(img.getAttribute('alt')).toBe('Animals')
        expect(img.className).toBe('w-full')
        expect(img.getAttribute('loading')).toBe('lazy')
        expect(img.dataset.cover).toBe('true')
        expect(img.dataset.coverStandIn).toBeUndefined()
    })

    it.each([[null], [undefined], [''], ['   ']])('with no address (%j): the stand-in', (src) => {
        const img = coverImage({ src, alt: 'Animals' })

        expect(isStandIn(img)).toBe(true)
        expect(img.getAttribute('alt')).toBe('Animals')
    })

    it('the stand-in is an image the page may load without asking anyone (the policy allows data:)', () => {
        expect(COVER_STAND_IN.startsWith('data:image/svg+xml,')).toBe(true)
        expect(decodeURIComponent(COVER_STAND_IN)).toContain('<svg')
    })

    it('the address fails to load: the stand-in takes its place', () => {
        const img = coverImage({ src: GOOD, alt: 'Animals' })
        document.body.appendChild(img)

        fail(img)

        expect(isStandIn(img)).toBe(true)
    })

    it('a cover written into the page as text is watched too', () => {
        const wrapper = document.createElement('div')
        wrapper.appendChild(coverImage({ src: GOOD, alt: 'Animals' }))
        document.body.innerHTML = wrapper.outerHTML
        const img = document.body.querySelector('img')

        fail(img)

        expect(isStandIn(img)).toBe(true)
    })

    it('once: when the stand-in itself fails, nothing is set again (no loop)', () => {
        const img = coverImage({ src: GOOD, alt: 'Animals' })
        document.body.appendChild(img)
        fail(img)
        const set = vi.spyOn(img, 'setAttribute')

        fail(img)
        fail(img)

        expect(set).not.toHaveBeenCalled()
        expect(isStandIn(img)).toBe(true)
    })

    it('a cover drawn with no address that fails is left alone too', () => {
        const img = coverImage({ src: null })
        document.body.appendChild(img)
        const set = vi.spyOn(img, 'setAttribute')

        fail(img)

        expect(set).not.toHaveBeenCalled()
    })

    it('an image that is not a cover is not touched', () => {
        const logo = document.createElement('img')
        logo.setAttribute('src', '/assets/images/logo.png')
        document.body.appendChild(logo)

        fail(logo)

        expect(logo.getAttribute('src')).toBe('/assets/images/logo.png')
    })

    it('watching twice listens once', () => {
        const add = vi.spyOn(document, 'addEventListener')

        watchCovers()
        watchCovers()

        expect(add).not.toHaveBeenCalled()
        add.mockRestore()
    })
})

describe('every place that draws an album cover uses it', () => {
    beforeEach(() => { document.body.innerHTML = '' })

    const album = (extra = {}) => ({ id: 'a1', title: 'Animals', artist: 'Pink Floyd', year: 1977, tracks: [], ...extra })

    it('the album card: no address, then an address that fails', async () => {
        const without = await drawCard(album())
        expect(coversIn(without)).toHaveLength(1)
        expect(isStandIn(coversIn(without)[0])).toBe(true)

        const withAddress = await drawCard(album({ coverUrl: GOOD }))
        const img = coversIn(withAddress)[0]
        expect(img.getAttribute('src')).toBe(GOOD)
        fail(img)
        expect(isStandIn(img)).toBe(true)
    })

    it('the picker card: an album the catalog gave no cover for shows the stand-in, not a file that does not exist', async () => {
        const card = await pickerCard(album())

        expect(isStandIn(coversIn(card)[0])).toBe(true)
        expect(card.outerHTML).not.toContain('cover_placeholder')
    })

    it('the picker card: the size is put in the address, and a failure shows the stand-in', async () => {
        document.body.appendChild(await pickerCard(album({ coverUrl: 'https://covers.example/{w}x{h}.jpg' })))
        const img = coversIn(document.body)[0]

        expect(img.getAttribute('src')).toBe('https://covers.example/300x300.jpg')
        fail(img)
        expect(isStandIn(img)).toBe(true)
    })

    it.each([['grid', ItemCard], ['list', ItemRow]])('the inventory card (%s), drawn by React', async (_variant, Piece) => {
        const host = document.createElement('div')
        document.body.appendChild(host)
        const none = () => { }
        const actions = { onView: none, onEdit: none, onDelete: none, onStatus: none }
        const money = { currency: 'USD', rates: null }
        await act(async () => {
            createRoot(host).render(createElement('div', null,
                createElement(Piece, { item: { ...album(), title: 'Animals', artist: 'Pink Floyd', albumData: { coverUrl: GOOD } }, value: undefined, money, actions }),
                createElement(Piece, { item: { ...album({ id: 'a2' }), title: 'Wish', artist: 'Pink Floyd', albumData: {} }, value: undefined, money, actions })))
        })
        const [withAddress, without] = coversIn(document.body)

        expect(isStandIn(without)).toBe(true)
        expect(withAddress.getAttribute('src')).toBe(GOOD)
        fail(withAddress)
        expect(isStandIn(withAddress)).toBe(true)
    })

    /** The cascade of covers (ui/AlbumCascade.tsx), drawn into the page. */
    const drawCascade = async (thumbnails) => {
        globalThis.IS_REACT_ACT_ENVIRONMENT = true
        const host = document.createElement('div')
        document.body.appendChild(host)
        await act(async () => { createRoot(host).render(createElement(AlbumCascade, { thumbnails })) })
        return host
    }

    it('the saved playlists and the blend (the cascade of covers): no inline handler, the same stand-in', async () => {
        document.body.innerHTML = ''
        await drawCascade([GOOD, null])
        const [withAddress, without] = coversIn(document.body)

        expect(document.body.innerHTML).not.toContain('onerror')
        expect(isStandIn(without)).toBe(true)
        fail(withAddress)
        expect(isStandIn(withAddress)).toBe(true)
    })

    it('the cascade with no album at all keeps its own empty tile', async () => {
        document.body.innerHTML = ''
        expect(coversIn(await drawCascade([]))).toHaveLength(0)
    })

    it('the files that draw an album cover import the helper, and no file writes an inline error handler', () => {
        const drawers = [
            'screens/albums/AlbumCard.tsx', 'screens/inventory/ItemCard.tsx', 'screens/inventory/ItemRow.tsx', 'screens/inventory/phone/PhoneRow.tsx', 'ui/AlbumCascade.tsx',
            'ui/albumWindow/AlbumWindow.tsx', 'ui/albumPicker/PickerParts.tsx'
        ]
        const withoutTheHelper = drawers.filter(file => !importsOf(file).some(specifier => /(^|\/)(coverImage\.js|CoverImage)$/.test(specifier)))
        const inlineHandlers = appFiles().filter(file => /onerror\s*[:=]\s*["'`]/i.test(read(file)))

        expect(withoutTheHelper).toEqual([])
        expect(inlineHandlers).toEqual([])
    })
})
