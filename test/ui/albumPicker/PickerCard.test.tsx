/**
 * The album card of the series edit (F57: one card draws every album of the picker; carried over in F83 wave 5b from
 * test/views/DiscographyRenderer.card.test.js). The Start screen's own form of the card (the «stage» card, F79) is React since F83 wave 4: see
 * test/screens/start/Start.stage.test.js and Start.sameAsBefore.test.tsx.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { PickerCard } from '../../../public/js/ui/albumPicker/PickerParts'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const album = { id: 'a1', title: 'Animals', artist: 'Pink Floyd', year: 1977, type: 'Album', coverUrl: 'https://img/{w}x{h}.jpg' }

describe('the album card of the series edit', () => {
    afterEach(() => { document.body.innerHTML = '' })

    const draw = async (value: typeof album & { title?: string }, onPick = vi.fn()) => {
        const grid = document.body.appendChild(document.createElement('div'))
        await act(async () => { createRoot(grid).render(<PickerCard album={value} onPick={onPick} />) })
        return grid
    }

    it('is a block with the cover, the title and the year', async () => {
        const grid = await draw(album)

        const card = grid.querySelector<HTMLElement>('[data-action="pick-album"]')!
        expect(card.tagName).toBe('DIV')
        expect(card.dataset.id).toBe('a1')
        expect(card.querySelector('h3')!.textContent).toBe('Animals')
        expect(card.querySelector('img')!.getAttribute('src')).toBe('https://img/300x300.jpg')
        expect(card.textContent).toContain('1977')
    })

    it('asks for the album of the card when it is pressed', async () => {
        const onPick = vi.fn()
        const grid = await draw(album, onPick)

        await act(async () => { grid.querySelector<HTMLElement>('[data-action="pick-album"]')!.click() })

        expect(onPick).toHaveBeenCalledWith('a1')
    })

    it('says the edition and the type of the album in badges, in the words of the site', async () => {
        const grid = await draw({ ...album, title: 'Animals (Deluxe Remaster)', type: 'Live' })

        const badges = [...grid.querySelectorAll('.uppercase')].map(b => b.textContent)
        expect(badges).toEqual(['Deluxe', 'Remaster', 'Live'])
    })

    it('an album with no year says «Unknown»', async () => {
        const grid = await draw({ ...album, year: '' as unknown as number })
        expect(grid.querySelector('p')!.textContent).toBe('Unknown')
    })
})
