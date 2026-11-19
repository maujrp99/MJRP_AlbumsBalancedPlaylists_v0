/**
 * F62 (UAT-200, UAT-09) - the window of the export to Spotify says what the export did: what was
 * created (each with its link), what was not, why it stopped and what the person can do next.
 * The export service is a double here; its own rules are in test/services/spotify/SpotifyExport.test.js.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../../public/js/services/SpotifyExportService.js', () => ({ SpotifyExportService: { exportPlaylists: vi.fn() } }))
vi.mock('../../public/js/services/SpotifyAuthService.js', () => ({ SpotifyAuthService: { login: vi.fn() } }))
vi.mock('../../public/js/components/Toast.js', () => {
    const toast = { info: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn() }
    return { default: toast, toast }
})

import { SpotifyExportModal } from '../../public/js/components/SpotifyExportModal.js'
import { SpotifyExportService } from '../../public/js/services/SpotifyExportService.js'
import { SpotifyAuthService } from '../../public/js/services/SpotifyAuthService.js'
import { playlistsStore } from '../../public/js/stores/playlists.js'
import { albumSeriesStore } from '../../public/js/stores/albumSeries.js'

const report = (over = {}) => ({
    mode: 'merge', totalTracks: 4, matchCount: 4, created: [], incomplete: [], empty: [], notCreated: [], failure: null, createdUrl: null, ...over
})
const made = (name, id, over = {}) => ({ name, url: `https://open.spotify.com/playlist/${id}`, tracks: 2, total: 2, alreadyThere: false, ...over })

describe('SpotifyExportModal (F62)', () => {
    let modal

    const text = () => modal.container.textContent.replace(/\s+/g, ' ')
    const choose = (mode) => {
        const radio = modal.container.querySelector(`input[name="exportMode"][value="${mode}"]`)
        radio.checked = true
        radio.dispatchEvent(new Event('change', { bubbles: true }))
    }
    const startExport = async () => {
        modal.container.querySelector('#startExportBtn').click()
        await vi.waitFor(() => expect(modal.container.querySelector('#startExportBtn')).toBeNull())
        await new Promise(resolve => setTimeout(resolve, 0))
    }

    beforeEach(() => {
        vi.clearAllMocks()
        document.body.innerHTML = ''
        playlistsStore.reset()
        playlistsStore.setPlaylists([
            { name: 'Greatest Hits', tracks: [{ title: 'One' }, { title: 'Two' }] },
            { name: 'Deep Cuts', tracks: [{ title: 'Three' }, { title: 'Four' }] }
        ], 'sA')
        albumSeriesStore.setSeries([{ id: 'sA', name: 'Road trip' }])
        albumSeriesStore.setActiveSeries('sA')
        modal = new SpotifyExportModal()
        modal.show()
    })

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
            const button = modal.container.querySelector('#startExportBtn')

            button.click()
            button.click()
            finish(report({ created: [made('Road trip', 'pl-1')] }))
            await new Promise(resolve => setTimeout(resolve, 0))

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
            const links = [...modal.container.querySelectorAll('a.created-playlist-link')]
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

            expect(modal.container.querySelector('a.created-playlist-link')).toBeNull()
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
                failure: { kind: 'reconnect', message: 'Spotify needs you to connect again.' }
            }))

            await startExport()

            expect(text()).toContain('Spotify needs you to connect again.')
            expect(text()).toContain('Created (1)')
            expect(text()).toContain('Not created (1)')
            expect(text()).toContain('Road trip - Deep Cuts')
            expect(text()).not.toContain('Export Complete')

            modal.container.querySelector('#reconnectSpotifyBtn').click()
            expect(SpotifyAuthService.login).toHaveBeenCalledTimes(1)
        })

        it('reports a rate limit with the time asked and offers to try again; trying again exports the same way', async () => {
            SpotifyExportService.exportPlaylists
                .mockResolvedValueOnce(report({
                    notCreated: ['Road trip'],
                    failure: { kind: 'rate-limit', retryAfterSeconds: 600, message: 'Spotify asked to wait 600 seconds before the next request (Rate Limited).' }
                }))
                .mockResolvedValueOnce(report({ created: [made('Road trip', 'pl-1')] }))

            await startExport()
            expect(text()).toContain('Spotify asked to wait 600 seconds')
            expect(text()).toContain('Export Failed')
            expect(modal.container.querySelector('#reconnectSpotifyBtn')).toBeNull()

            modal.container.querySelector('#retryExportBtn').click()
            await vi.waitFor(() => expect(text()).toContain('Export Complete'))

            expect(SpotifyExportService.exportPlaylists).toHaveBeenCalledTimes(2)
            expect(SpotifyExportService.exportPlaylists.mock.calls[1][1]).toEqual({ mode: 'merge', name: 'Road trip' })
        })

        it('says which playlists got only part of their tracks and which had no track found', async () => {
            SpotifyExportService.exportPlaylists.mockResolvedValue(report({
                mode: 'separate',
                incomplete: [{ name: 'Road trip - Greatest Hits', url: 'https://open.spotify.com/playlist/pl-1', tracks: 100, total: 150 }],
                empty: ['Road trip - Ghosts'],
                failure: { kind: 'error', message: 'Server error' }
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
})
