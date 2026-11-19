/**
 * F60 (UAT-197) - the save button is drawn from the state: while a save is on its way it is
 * drawn disabled, so a redraw of the screen in the middle of the save does not hand the person
 * a fresh button to click again.
 */
import { describe, it, expect } from 'vitest'
import { PlaylistsGridRenderer } from '../../../public/js/components/playlists/PlaylistsGridRenderer.js'

const button = (html) => {
    const host = document.createElement('div')
    host.innerHTML = html
    return host.querySelector('#saveToHistoryBtn')
}
const playlists = [{ name: 'Mix 1', tracks: [] }]

describe('PlaylistsGridRenderer.renderExportSection', () => {
    it('draws the save button ready to click when nothing is being saved', () => {
        const btn = button(PlaylistsGridRenderer.renderExportSection(playlists, { isSaving: false }))

        expect(btn.disabled).toBe(false)
        expect(btn.textContent).toContain('Save to Series History')
    })

    it('draws the save button disabled, saying so, while a save is on its way', () => {
        const btn = button(PlaylistsGridRenderer.renderExportSection(playlists, { isSaving: true }))

        expect(btn.disabled).toBe(true)
        expect(btn.getAttribute('aria-busy')).toBe('true')
        expect(btn.textContent).toContain('Saving')
    })

    it('still draws the button when the state is not given', () => {
        expect(button(PlaylistsGridRenderer.renderExportSection(playlists)).disabled).toBe(false)
    })
})
