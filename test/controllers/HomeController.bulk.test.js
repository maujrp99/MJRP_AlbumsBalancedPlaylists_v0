/**
 * F63 (UAT-201, UAT-26) and F79 - the pasted list on the Home, through the real view and controller.
 * F79: the list lives in the one field; each line says «ready» or what to fix before the click
 * (^home-paste-list); after «Add», what went in is said, and each line that did not go in stays as
 * a field with its reason, to fix in place (^home-paste-report).
 * F63 still holds: a name with a hyphen is searched whole; a line that cannot go in is skipped and the
 * other lines go on. No alert().
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const catalog = vi.hoisted(() => ({ search: vi.fn() }))

vi.mock('../../public/js/services/album-search/AlbumSearchService.js', () => ({
    albumSearchService: { search: (...args) => catalog.search(...args), scanArtist: vi.fn() }
}))
vi.mock('../../public/js/components/Toast.js', () => ({
    default: { warning: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() }
}))
vi.mock('../../public/js/services/SeriesService.js', () => ({ getSeriesService: vi.fn() }))

import { HomeView } from '../../public/js/views/HomeView.js'

const found = (artist, title) => ({ id: `${artist}|${title}`, artist, title, year: 2001, coverUrl: 'https://img/{w}x{h}.jpg' })
const findAll = async (artist, title) => [found(artist, title)]

describe('Home: the pasted list (F63, F79)', () => {
    let app, view
    const $ = (selector) => app.querySelector(selector)
    const lines = () => [...app.querySelectorAll('#homePaste .home-line')]
    const paste = (text) => view.controller.setMode('paste', text)
    const add = async () => {
        $('#btnProcessBulk').click()
        await vi.waitFor(() => expect($('#btnProcessBulk').hasAttribute('aria-busy')).toBe(false))
    }
    const selected = () => view.controller.stagingController.getSelectedAlbums().map(album => `${album.artist} / ${album.title}`)
    const summary = () => $('#homePasteSummary').textContent

    beforeEach(async () => {
        app = document.createElement('div')
        app.id = 'app'
        document.body.appendChild(app)
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})
        window.alert = vi.fn()
        catalog.search.mockReset()
        catalog.search.mockImplementation(findAll)

        view = new HomeView()
        app.appendChild(await view.render({}))
        await view.mount({})
    })

    afterEach(() => {
        view.destroy()
        document.body.removeChild(app)
        vi.restoreAllMocks()
    })

    it('each line says «ready» or what to fix, before the click; the foot counts and names the button (^home-paste-list)', () => {
        paste('Joni Mitchell - Hejira\nYes - Close to the Edge\nRadiohead OK Computer\nCaravan - In the Land of Grey and Pinkk')

        expect(lines().map(line => line.querySelector('.home-line__tag').textContent.trim()))
            .toEqual(['ready', 'ready', 'add « - » between artist and album', 'ready'])
        expect(lines()[2].classList.contains('is-bad')).toBe(true)
        expect(lines().map(line => line.querySelector('.home-line__n').textContent)).toEqual(['1', '2', '3', '4'])
        expect(summary()).toBe('4 lines: 3 ready, 1 to fix. Lines to fix are skipped; the rest go in.')
        expect($('#btnProcessBulk').textContent).toBe('Add 3 albums')
        expect($('#btnProcessBulk').classList.contains('is-flame')).toBe(true)
    })

    it('typing a line checks it again', () => {
        paste('Radiohead OK Computer')
        const input = $('#homePaste .home-line__text')
        input.value = 'Radiohead - OK Computer'
        input.dispatchEvent(new Event('input', { bubbles: true }))

        expect(lines()[0].classList.contains('is-ok')).toBe(true)
        expect($('#btnProcessBulk').textContent).toBe('Add 1 album')
    })

    it('searches a name with a hyphen whole: "Jay-Z - The Blueprint" is Jay-Z, not "Jay"', async () => {
        paste('Jay-Z - The Blueprint\nAlt-J - An Awesome Wave\nBlink-182 - Enema of the State\nAC/DC - Back in Black\nArtist - Album - Deluxe')

        await add()

        expect(catalog.search.mock.calls.map(([artist, title]) => [artist, title])).toEqual([
            ['Jay-Z', 'The Blueprint'],
            ['Alt-J', 'An Awesome Wave'],
            ['Blink-182', 'Enema of the State'],
            ['AC/DC', 'Back in Black'],
            ['Artist', 'Album - Deluxe']
        ])
        expect(selected()).toHaveLength(5)
        expect(summary()).toBe('Added 5 albums.')
        expect(lines()).toHaveLength(1)
        expect($('#homePaste .home-line__text').value).toBe('')
    })

    it('a line not found stays as a field with its reason; «Add this line» sends what is in it (^home-paste-report)', async () => {
        catalog.search.mockImplementation(async (artist, title) => (title.endsWith('Pinkk') ? [] : [found(artist, title)]))
        paste('Joni Mitchell - Hejira\nYes - Close to the Edge\nCaravan - In the Land of Grey and Pinkk')

        await add()

        expect(selected()).toEqual(['Joni Mitchell / Hejira', 'Yes / Close to the Edge'])
        expect(summary()).toBe('Added 2 albums. 1 line was skipped and is still here to fix.')
        expect($('#homePasteSummary strong').textContent).toBe('Added 2 albums.')
        expect(lines()).toHaveLength(1)
        expect(lines()[0].classList.contains('is-skip')).toBe(true)
        expect(lines()[0].querySelector('.home-line__tag').textContent).toBe('not found in the catalog: fix the spelling here')
        expect($('#homePaste .home-line__text').value).toBe('Caravan - In the Land of Grey and Pinkk')
        expect($('#btnProcessBulk').textContent).toBe('Add this line')
        expect($('.home-dock .home-name').value).toBe('Joni Mitchell and Yes')
        expect($('.home-dock').textContent).toContain('2 albums from 2 artists · the order counts')

        const input = $('#homePaste .home-line__text')
        input.value = 'Caravan - In the Land of Grey and Pink'
        input.dispatchEvent(new Event('input', { bubbles: true }))
        await add()

        expect(selected()).toEqual(['Joni Mitchell / Hejira', 'Yes / Close to the Edge', 'Caravan / In the Land of Grey and Pink'])
        expect(window.alert).not.toHaveBeenCalled()
    })

    it('a line the catalog does not have, and a search that breaks, both stay; the rest goes on', async () => {
        catalog.search.mockImplementation(async (artist, title) => {
            if (artist === 'Nobody') return []
            if (artist === 'Broken') throw new Error('network down')
            return [found(artist, title)]
        })
        paste('Nobody - Nothing\nBroken - Line\nNeu! - Neu! 75')

        await add()

        expect(selected()).toEqual(['Neu! / Neu! 75'])
        expect(lines().map(line => [line.querySelector('input').value, line.querySelector('.home-line__tag').textContent])).toEqual([
            ['Nobody - Nothing', 'not found in the catalog: fix the spelling here'],
            ['Broken - Line', 'the catalog did not answer: try this line again']
        ])
        expect($('#btnProcessBulk').textContent).toBe('Add these 2 lines')
    })

    it('an album already in the series is said, and does not stay', async () => {
        paste('Can - Tago Mago')
        await add()

        paste('Can - Tago Mago\nNeu! - Neu! 75')
        await add()

        expect(selected()).toEqual(['Can / Tago Mago', 'Neu! / Neu! 75'])
        expect(summary()).toBe('Added 1 album. 1 line was already in your series.')
    })

    it('an empty list cannot be sent: the button is off and nothing is searched (UAT-26)', () => {
        paste('   \n ')

        expect($('#btnProcessBulk').disabled).toBe(true)
        $('#btnProcessBulk').click()
        expect(catalog.search).not.toHaveBeenCalled()
    })

    it('while it searches, the button is busy and cannot be clicked twice', async () => {
        let release
        catalog.search.mockImplementation(() => new Promise(resolve => { release = () => resolve([found('Can', 'Tago Mago')]) }))
        paste('Can - Tago Mago')

        $('#btnProcessBulk').click()
        await vi.waitFor(() => expect(catalog.search).toHaveBeenCalledTimes(1))

        expect($('#btnProcessBulk').disabled).toBe(true)
        expect($('#btnProcessBulk').getAttribute('aria-busy')).toBe('true')
        expect($('#btnProcessBulk').textContent).toBe('Adding…')

        release()
        await vi.waitFor(() => expect($('#btnProcessBulk').hasAttribute('aria-busy')).toBe(false))
        expect(summary()).toBe('Added 1 album.')
    })

    it('Enter opens a new line; Backspace on an empty line closes it', () => {
        paste('Can - Tago Mago')
        const first = $('#homePaste .home-line__text')
        first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
        expect(lines()).toHaveLength(2)

        lines()[1].querySelector('input').dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }))
        expect(lines()).toHaveLength(1)
    })
})
