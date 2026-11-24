/**
 * F62 (UAT-200, UAT-09) - the window of the export to Spotify says what the export did: what was created (each with its link), what was not, why it stopped
 * and what the person can do next. The export service is a double here; its own rules are in test/services/spotify/SpotifyExport.test.js.
 *
 * F83 wave 8a: the nine cases of the hand-made window (test/components/SpotifyExportModal.test.js), carried with the same assertions; what changed is the
 * scaffold (the window is React now: it is opened the way a screen opens it, and a press is told to React: test/support/spotifyWindowHost.js).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('../../public/js/services/SpotifyExportService.js', () => ({ SpotifyExportService: { exportPlaylists: vi.fn() } }))
vi.mock('../../public/js/services/SpotifyAuthService.js', () => ({ SpotifyAuthService: { login: vi.fn() } }))
vi.mock('../../public/js/stores/toasts.js', () => {
    const toast = { info: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn() }
    return { default: toast, toast }
})

import { SpotifyExportService } from '../../public/js/services/SpotifyExportService.js'
import { SpotifyAuthService } from '../../public/js/services/SpotifyAuthService.js'
import { playlistsStore } from '../../public/js/stores/playlists.js'
import { albumSeriesStore } from '../../public/js/stores/albumSeries.js'
import { openSpotifyWindow, closeWindows, windowBox, press, choose, settle } from '../support/spotifyWindowHost.js'
import { setLocale, PREVIEW_KEY } from '../../public/js/i18n/t.js'

const report = (over = {}) => ({
    mode: 'merge', totalTracks: 4, matchCount: 4, created: [], incomplete: [], empty: [], notCreated: [], failure: null, createdUrl: null, ...over
})
const made = (name, id, over = {}) => ({ name, url: `https://open.spotify.com/playlist/${id}`, tracks: 2, total: 2, alreadyThere: false, ...over })

describe('SpotifyExportWindow (F62)', () => {
    const text = () => windowBox().textContent.replace(/\s+/g, ' ')
    const startExport = async () => {
        press(windowBox().querySelector('#startExportBtn'))
        await vi.waitFor(() => expect(windowBox().querySelector('#startExportBtn')).toBeNull())
        await settle(0)
    }

    beforeEach(async () => {
        vi.clearAllMocks()
        await closeWindows()
        document.body.innerHTML = ''
        playlistsStore.reset()
        playlistsStore.setPlaylists([
            { name: 'Greatest Hits', tracks: [{ title: 'One' }, { title: 'Two' }] },
            { name: 'Deep Cuts', tracks: [{ title: 'Three' }, { title: 'Four' }] }
        ], 'sA')
        albumSeriesStore.setSeries([{ id: 'sA', name: 'Road trip' }])
        albumSeriesStore.setActiveSeries('sA')
        await openSpotifyWindow()
    })

    afterEach(async () => { await closeWindows(); document.body.innerHTML = '' })

    describe('before the export (UAT-09)', () => {
        it('says what each mode will create, and the text follows the mode chosen', () => {
            expect(text()).toContain('All playlists will be merged into a single Spotify playlist')

            choose('separate')

            expect(text()).toContain('Each playlist becomes its own Spotify playlist')
            expect(text()).not.toContain('All playlists will be merged')

            choose('merge')
            expect(text()).toContain('All playlists will be merged into a single Spotify playlist')
        })

        it('starts one export, however many times the button is pressed', async () => {
            let finish
            SpotifyExportService.exportPlaylists.mockReturnValue(new Promise(resolve => { finish = resolve }))
            const button = windowBox().querySelector('#startExportBtn')

            press(button)
            press(button)
            finish(report({ created: [made('Road trip', 'pl-1')] }))
            await settle(0)

            expect(SpotifyExportService.exportPlaylists).toHaveBeenCalledTimes(1)
        })
    })

    describe('after the export', () => {
        it('in separate mode shows every playlist created with a link that opens it in Spotify (UAT-09)', async () => {
            SpotifyExportService.exportPlaylists.mockResolvedValue(report({
                mode: 'separate',
                created: [made('Road trip - Greatest Hits', 'pl-1'), made('Road trip - Deep Cuts', 'pl-2')]
            }))
            choose('separate')

            await startExport()

            expect(SpotifyExportService.exportPlaylists.mock.calls[0][1]).toEqual({ mode: 'separate', name: 'Road trip' })
            const links = [...windowBox().querySelectorAll('a.created-playlist-link')]
            expect(links.map(a => a.getAttribute('href'))).toEqual([
                'https://open.spotify.com/playlist/pl-1', 'https://open.spotify.com/playlist/pl-2'
            ])
            links.forEach(a => { expect(a.target).toBe('_blank'); expect(a.rel).toContain('noopener') })
            expect(text()).toContain('Export Complete')
            expect(text()).toContain('Road trip - Greatest Hits')
            expect(text()).toContain('Road trip - Deep Cuts')
        })

        it('does not make a link of an address that is not a web address', async () => {
            SpotifyExportService.exportPlaylists.mockResolvedValue(report({ created: [{ ...made('Road trip', 'x'), url: 'javascript:alert(1)' }] }))

            await startExport()

            expect(windowBox().querySelector('a.created-playlist-link')).toBeNull()
            expect(text()).toContain('Road trip')
        })

        it('says when a playlist was already there and was not created again', async () => {
            SpotifyExportService.exportPlaylists.mockResolvedValue(report({ created: [made('Road trip', 'pl-1', { alreadyThere: true })] }))

            await startExport()

            expect(text()).toContain('already exported in this session, not created again')
        })

        it('asks to connect again, with the button, and says what was created and what was not', async () => {
            SpotifyExportService.exportPlaylists.mockResolvedValue(report({
                mode: 'separate',
                created: [made('Road trip - Greatest Hits', 'pl-1')],
                notCreated: ['Road trip - Deep Cuts'],
                failure: { kind: 'reconnect' }
            }))

            await startExport()

            expect(text()).toContain('Spotify needs you to connect again.')
            expect(text()).toContain('Created (1)')
            expect(text()).toContain('Not created (1)')
            expect(text()).toContain('Road trip - Deep Cuts')
            expect(text()).not.toContain('Export Complete')

            press(windowBox().querySelector('#reconnectSpotifyBtn'))
            expect(SpotifyAuthService.login).toHaveBeenCalledTimes(1)
        })

        it('reports a rate limit with the time asked and offers to try again; trying again exports the same way', async () => {
            SpotifyExportService.exportPlaylists
                .mockResolvedValueOnce(report({
                    notCreated: ['Road trip'],
                    failure: { kind: 'rate-limit', retryAfterSeconds: 600 }
                }))
                .mockResolvedValueOnce(report({ created: [made('Road trip', 'pl-1')] }))

            await startExport()
            expect(text()).toContain('Spotify asked to wait 600 seconds')
            expect(text()).toContain('Export Failed')
            expect(windowBox().querySelector('#reconnectSpotifyBtn')).toBeNull()

            press(windowBox().querySelector('#retryExportBtn'))
            await vi.waitFor(() => expect(text()).toContain('Export Complete'))

            expect(SpotifyExportService.exportPlaylists).toHaveBeenCalledTimes(2)
            expect(SpotifyExportService.exportPlaylists.mock.calls[1][1]).toEqual({ mode: 'merge', name: 'Road trip' })
        })

        it('says which playlists got only part of their tracks and which had no track found', async () => {
            SpotifyExportService.exportPlaylists.mockResolvedValue(report({
                mode: 'separate',
                incomplete: [{ name: 'Road trip - Greatest Hits', url: 'https://open.spotify.com/playlist/pl-1', tracks: 100, total: 150 }],
                empty: ['Road trip - Ghosts'],
                failure: { kind: 'error', detail: 'Server error' }
            }))

            await startExport()

            expect(text()).toContain('Created without all their tracks (1)')
            expect(text()).toContain('100 of 150 tracks')
            expect(text()).toContain('No track found (1)')
            expect(text()).toContain('Road trip - Ghosts')
            expect(text()).toContain('Server error')
        })

        it('shows a failure the service did not foresee as a failed export, never as nothing', async () => {
            SpotifyExportService.exportPlaylists.mockRejectedValue(new Error('boom'))
            vi.spyOn(console, 'error').mockImplementation(() => { })

            await startExport()

            expect(text()).toContain('Export Failed')
            expect(text()).toContain('boom')
        })
    })

    describe('when the export could not check the tracks (F97, UAT-302)', () => {
        const refused = () => report({ matchCount: 0, notCreated: ['Road trip'], failure: { kind: 'refused' } })
        const unchecked = () => report({ matchCount: 0, unchecked: 4, notCreated: ['Road trip'], failure: { kind: 'unchecked' } })

        afterEach(async () => { await setLocale('en'); localStorage.removeItem(PREVIEW_KEY) })

        it('a refusal of Spotify is said as a refusal, with the next step, and never as tracks not found (REQ-01)', async () => {
            SpotifyExportService.exportPlaylists.mockResolvedValue(refused())

            await startExport()

            expect(text()).toContain('Spotify did not allow this for your account')
            expect(text()).toContain('limited test phase')
            expect(text()).toContain('Ask the owner')
            expect(text()).toContain('Export to Apple Music is available')
            expect(text()).not.toMatch(/you will be added/i)
            expect(text()).not.toMatch(/not found|No track found|Tracks matched/i)
            expect(windowBox().querySelector('#retryExportBtn')).toBeNull()
            expect(windowBox().querySelector('#reconnectSpotifyBtn')).toBeNull()
        })

        it('the refusal is said in Portuguese too (REQ-04)', async () => {
            localStorage.setItem(PREVIEW_KEY, 'pt')
            expect(await setLocale('pt')).toBe(true)
            SpotifyExportService.exportPlaylists.mockResolvedValue(refused())

            await startExport()

            expect(text()).toContain('O Spotify não permitiu isto para a sua conta')
            expect(text()).toContain('Peça a quem cuida de The Album Blender')
            expect(text()).not.toMatch(/\b(o|do|no|ao|pelo) The Album Blender/i)
            expect(text()).toContain('A exportação para o Apple Music está disponível')
            expect(text()).not.toContain('Spotify did not allow')
        })

        it('tracks that could not be checked are counted apart from the ones not found (REQ-02)', async () => {
            SpotifyExportService.exportPlaylists.mockImplementation(async (playlists, options, handlers) => {
                handlers.onNotFound({ artist: 'Artist', title: 'Nowhere' })
                handlers.onUnchecked({ artist: 'Artist', title: 'Two' })
                handlers.onUnchecked({ artist: 'Artist', title: 'Three' })
                return report({ matchCount: 1, unchecked: 2, created: [made('Road trip', 'pl-1', { tracks: 1, total: 1 })] })
            })

            await startExport()

            expect(text()).toContain('1 track not found')
            expect(text()).toContain('2 tracks could not be checked')
            expect(text()).not.toContain('Export Complete')
            const lists = [...windowBox().querySelectorAll('details')].map(box => box.textContent.replace(/\s+/g, ' '))
            expect(lists.find(list => list.includes('could not be checked'))).toContain('Artist - Two')
            expect(lists.find(list => list.includes('not found'))).not.toContain('Artist - Two')
        })

        it('when nothing could be checked it says so and offers to try again (REQ-03)', async () => {
            SpotifyExportService.exportPlaylists
                .mockResolvedValueOnce(unchecked())
                .mockResolvedValueOnce(report({ created: [made('Road trip', 'pl-1')] }))

            await startExport()

            expect(text()).toContain('your tracks could not be checked')
            expect(text()).not.toMatch(/not found|No track found/i)

            press(windowBox().querySelector('#retryExportBtn'))
            await vi.waitFor(() => expect(text()).toContain('Export Complete'))
            expect(SpotifyExportService.exportPlaylists).toHaveBeenCalledTimes(2)
        })

        it('nothing checked, in Portuguese (REQ-04)', async () => {
            localStorage.setItem(PREVIEW_KEY, 'pt')
            expect(await setLocale('pt')).toBe(true)
            SpotifyExportService.exportPlaylists.mockResolvedValue(unchecked())

            await startExport()

            expect(text()).toContain('as suas faixas não puderam ser conferidas')
            expect(text()).toContain('Tentar de novo')
        })
    })

    describe('a result with something left out is not a clean success (F98, REQ-04)', () => {
        const mixed = () => SpotifyExportService.exportPlaylists.mockImplementation(async (playlists, options, handlers) => {
            handlers.onUnchecked({ artist: 'Artist', title: 'Two' })
            return report({ matchCount: 3, unchecked: 1, created: [made('Road trip', 'pl-1', { tracks: 3, total: 3 })] })
        })

        afterEach(async () => { await setLocale('en'); localStorage.removeItem(PREVIEW_KEY) })

        it('tracks that could not be checked: the heading says something was left out, never «Export Complete»', async () => {
            mixed()

            await startExport()

            expect(windowBox().querySelector('[data-export-heading]').textContent).toBe('Exported, with something left out')
            expect(text()).not.toContain('Export Complete')
            expect(text()).toContain('1 track could not be checked')
            expect(text()).toContain('Created (1)')
        })

        it('offers to try again for what was left out, and says what trying again does', async () => {
            mixed()

            await startExport()

            expect(windowBox().querySelector('#retryExportBtn')).not.toBeNull()
            expect(text()).toContain('A playlist that gets more tracks this time is created as a new one')
        })

        it('tracks not found alone are still a complete export: Spotify answered', async () => {
            SpotifyExportService.exportPlaylists.mockImplementation(async (playlists, options, handlers) => {
                handlers.onNotFound({ artist: 'Artist', title: 'Nowhere' })
                return report({ matchCount: 3, unchecked: 0, created: [made('Road trip', 'pl-1', { tracks: 3, total: 3 })] })
            })

            await startExport()

            expect(text()).toContain('Export Complete')
            expect(windowBox().querySelector('#retryExportBtn')).toBeNull()
        })

        it('a playlist with no track found, beside one created: something was left out, and there is nothing to try again', async () => {
            SpotifyExportService.exportPlaylists.mockResolvedValue(report({ mode: 'separate', created: [made('Road trip - A', 'pl-1')], empty: ['Road trip - Ghosts'] }))

            await startExport()

            expect(windowBox().querySelector('[data-export-heading]').textContent).toBe('Exported, with something left out')
            expect(windowBox().querySelector('#retryExportBtn')).toBeNull()
        })

        it('in Portuguese', async () => {
            localStorage.setItem(PREVIEW_KEY, 'pt')
            expect(await setLocale('pt')).toBe(true)
            mixed()

            await startExport()

            expect(windowBox().querySelector('[data-export-heading]').textContent).toBe('Exportado, mas algo ficou de fora')
            expect(text()).toContain('1 faixa não pôde ser conferida')
        })
    })

    describe('every sentence comes from the dictionary of the language (F98, UAT-308, REQ-06)', () => {
        const inPortuguese = async () => { localStorage.setItem(PREVIEW_KEY, 'pt'); expect(await setLocale('pt')).toBe(true) }
        afterEach(async () => { await setLocale('en'); localStorage.removeItem(PREVIEW_KEY) })

        it('the window says each failure by its kind: the words are not the service\'s', async () => {
            SpotifyExportService.exportPlaylists.mockResolvedValue(report({ notCreated: ['Road trip'], failure: { kind: 'reconnect', message: 'IGNORED WORDS' } }))

            await startExport()

            expect(text()).toContain('Spotify needs you to connect again.')
            expect(text()).not.toContain('IGNORED WORDS')
        })

        it('connect again, in Portuguese', async () => {
            await inPortuguese()
            SpotifyExportService.exportPlaylists.mockResolvedValue(report({ notCreated: ['Road trip'], failure: { kind: 'reconnect' } }))

            await startExport()

            expect(text()).toContain('O Spotify precisa que você conecte de novo.')
            expect(text()).not.toContain('Spotify needs you')
        })

        it('the rate limit, in Portuguese, with the time Spotify asked for, and without it', async () => {
            await inPortuguese()
            SpotifyExportService.exportPlaylists
                .mockResolvedValueOnce(report({ notCreated: ['Road trip'], failure: { kind: 'rate-limit', retryAfterSeconds: 600 } }))
                .mockResolvedValueOnce(report({ notCreated: ['Road trip'], failure: { kind: 'rate-limit', retryAfterSeconds: null } }))

            await startExport()
            expect(text()).toContain('O Spotify pediu para esperar 600 segundos antes do próximo pedido.')

            press(windowBox().querySelector('#retryExportBtn'))
            await vi.waitFor(() => expect(text()).toContain('O Spotify pediu para esperar antes do próximo pedido.'))
        })

        it('no track found, in Portuguese', async () => {
            await inPortuguese()
            SpotifyExportService.exportPlaylists.mockResolvedValue(report({ matchCount: 0, empty: ['Road trip'], failure: { kind: 'not-found' } }))

            await startExport()

            expect(text()).toContain('Nenhuma faixa encontrada no Spotify')
            expect(text()).not.toContain('No tracks found')
        })

        it('what Spotify itself said is shown inside a sentence of the app; with nothing said, the app says so', async () => {
            await inPortuguese()
            SpotifyExportService.exportPlaylists
                .mockResolvedValueOnce(report({ notCreated: ['Road trip'], failure: { kind: 'error', detail: 'Server error' } }))
                .mockResolvedValueOnce(report({ notCreated: ['Road trip'], failure: { kind: 'error', detail: null } }))

            await startExport()
            expect(text()).toContain('A exportação parou: Server error')

            press(windowBox().querySelector('#retryExportBtn'))
            await vi.waitFor(() => expect(text()).toContain('O Spotify não respondeu.'))
        })

        it('the progress is said by the window, from the stage and the names the service gives', async () => {
            await inPortuguese()
            let finish
            SpotifyExportService.exportPlaylists.mockImplementation(async (playlists, options, handlers) => {
                handlers.onProgress('MATCHING', 1, 4, { title: 'One' })
                await new Promise(resolve => { finish = resolve })
                handlers.onProgress('CREATING', 1, 1, { name: 'Road trip' })
                await new Promise(resolve => { finish = resolve })
                handlers.onProgress('ADDING', 0, 4, { name: 'Road trip', count: 4 })
                await new Promise(resolve => { finish = resolve })
                return report({ created: [made('Road trip', 'pl-1')] })
            })

            press(windowBox().querySelector('#startExportBtn'))
            await vi.waitFor(() => expect(text()).toContain('Buscando: One'))
            finish()
            await vi.waitFor(() => expect(text()).toContain('Criando "Road trip"...'))
            finish()
            await vi.waitFor(() => expect(text()).toContain('Adicionando 4 faixas a "Road trip"...'))
            finish()
            await vi.waitFor(() => expect(text()).toContain('Exportação concluída'))
        })
    })

    describe('the result is announced and takes the focus (F98, REQ-08)', () => {
        it('the result is a status region, and its heading has the focus when the report appears', async () => {
            SpotifyExportService.exportPlaylists.mockResolvedValue(report({ created: [made('Road trip', 'pl-1')] }))

            await startExport()

            const heading = windowBox().querySelector('[data-export-heading]')
            expect(heading.closest('[role="status"]')).not.toBeNull()
            expect(heading.closest('[role="status"]').getAttribute('aria-live')).toBe('polite')
            expect(heading.textContent).toContain('Export Complete')
            expect(document.activeElement).toBe(heading)
        })

        it('a failure too: the heading of the failure has the focus', async () => {
            SpotifyExportService.exportPlaylists.mockResolvedValue(report({ notCreated: ['Road trip'], failure: { kind: 'unchecked' } }))

            await startExport()

            const heading = windowBox().querySelector('[data-export-heading]')
            expect(heading.textContent).toBe('Export Failed')
            expect(document.activeElement).toBe(heading)
            expect(heading.closest('[role="status"]').textContent).toContain('your tracks could not be checked')
        })
    })
})
