/**
 * The states of the saved playlists screen that F83 wave 1 checks, written once so the screen as it was (hand-made) and the screen
 * as it is (React) are asked the same thing: the same data in the store, the same clicks, the same search, and what stands in
 * `#app` (and in the sheet or the window the screen opens over the page) after each step. `normalize` writes a piece of the page
 * the way the proof compares it: the elements, the attributes in alphabetical order, the style as the browser canonicalises it, and
 * the text with runs of white space collapsed (the browser draws them as one space; only the space BETWEEN tags that
 * no browser draws is dropped, as in wave 0).
 *
 * Used by: reports/evidence/F83/wave-1/capture-before.test.js (run once, on the hand-made screen, before it was deleted; it wrote
 * test/fixtures/savedPlaylistsFromMain.json, wave 1 as savedPlaylistsBeforeF83.json) and test/screens/saved-playlists/SavedPlaylists.sameAsBefore.test.tsx (the
 * React screen, against that file).
 */
import { vi } from 'vitest'
import { SeriesPlaylistsStatus as Status, groupIntoBatches } from '../../public/js/models/savedPlaylists.js'
import { router } from '../../public/js/router.js'

/** The value of an attribute as the proof compares it: the style as the browser writes it, the classes as a set (their order is not drawn). */
const valueOf = (element, name, value) => {
    if (name === 'style') return element.style.cssText
    if (name === 'class') return value.split(/\s+/).filter(Boolean).sort().join(' ')
    return value
}

const attributesOf = (element) => [...element.attributes]
    .map(({ name, value }) => [name, valueOf(element, name, value)])
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => ` ${name}="${value}"`)
    .join('')

/** A short fingerprint of a drawing (FNV-1a): an icon is kept as its class and the fingerprint of every shape inside it. */
const fingerprint = (text) => {
    let hash = 2166136261
    for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619)
    return (hash >>> 0).toString(36)
}

/** One node as text: elements with sorted attributes, text with white space collapsed, empty text dropped. */
function describe(node) {
    if (node.nodeType === 3) return node.textContent.replace(/\s+/g, ' ')
    if (node.nodeType !== 1) return ''
    const tag = node.tagName.toLowerCase()
    const inner = [...node.childNodes].map(describe).join('')
    const whole = `<${tag}${attributesOf(node)}>${inner}</${tag}>`
    return tag === 'svg' ? `<svg class="${node.getAttribute('class')}" shape="${fingerprint(whole)}"/>` : whole
}

/** What a piece of the page says, ready to compare: no white space that a browser does not draw between tags. */
export function normalize(element) {
    if (!element) return null
    element.normalize()
    // a sheet is named by a counter of the motor (sheetTitle1, sheetTitle2...): which number it got is not what the page says
    return describe(element).replace(/>\s+</g, '><').replace(/sheetTitle\d+/g, 'sheetTitle#').trim()
}

const track = (title, album, duration = 180) => ({ title, artist: 'Artist', album, duration })
const playlist = (id, batchName, tracks = [track('Song', 'Album')], savedAt = '2026-11-01T10:00:00Z') => ({ id, name: `Playlist ${id}`, batchName, savedAt, tracks })

/** @param {Array<Object>|null} [playlists] */
export const entry = (id, name, status, playlists = null, extra = {}) => ({
    seriesId: id,
    series: { id, name, updatedAt: '2026-11-01T00:00:00Z' },
    status,
    playlists,
    batches: groupIntoBatches(playlists || []),
    thumbnails: [],
    error: null,
    refreshing: false,
    ...extra
})

const plant = () => entry('s1abcdefghij', 'Plant', Status.READY, [
    playlist('p1', 'Sunday mix', [track('Kashmir', 'Physical Graffiti', 510), track('Ramble On', 'Led Zeppelin II', 275)]),
    playlist('p2', 'Sunday mix', [track('Gone Gone Gone', 'Raising Sand', 200)]),
    playlist('p3', 'TheAlbumBlender Playlist 2026-11-20 23:21', [track('Song', 'Album')], '2026-11-20T23:21:00Z')
], { thumbnails: ['https://covers/a.jpg', 'https://covers/b.jpg', 'https://covers/c.jpg'] })
const floyd = () => entry('s2klmnopqrst', 'Floyd', Status.READY, [playlist('p4', 'Batch B', [track('Time', 'The Dark Side of the Moon', 413)]), playlist('p5', 'Batch B', [])])

const twoSeries = (store) => {
    store.begin(1, 'u1')
    store.setSeries([plant(), floyd()])
    store.flush()
}

/**
 * Each scenario: a name, whether it is the phone, and what it does with the screen once it is mounted. `h.snap(label)` writes
 * down `#app` (or, with a selector, the first element of the page that matches it, for what opens over the page).
 */
export const SCENARIOS = [
    {
        name: 'first load', run: async (h) => { h.snap('waiting for the list') }
    },
    {
        name: 'the list could not be read', run: async (h) => {
            await h.publish(() => { h.store.begin(1, 'u1'); h.store.setListFailed('unavailable') })
            h.snap('list failed, nothing to show')
            await h.click('.list-failed button')
        }
    },
    {
        name: 'series arriving', run: async (h) => {
            await h.publish(() => {
                h.store.begin(1, 'u1')
                h.store.setSeries([entry('s1', 'Plant', Status.LOADING), plant(), entry('s3', 'Purple', Status.LOADING)])
            })
            h.snap('one of three read')
            await h.publish(() => h.store.patchEntry('s1', { status: Status.READY, playlists: [playlist('p9', 'Late')], batches: groupIntoBatches([playlist('p9', 'Late')]) }))
            h.snap('two of three read')
        }
    },
    {
        name: 'the list on the computer', run: async (h) => {
            await h.publish(() => twoSeries(h.store))
            h.snap('closed')
            await h.click('.batch-header')
            h.snap('a batch open')
            await h.click('.playlist-row')
            h.snap('a playlist open')
            await h.click('.playlist-row')
            h.snap('the playlist shut again')
            await h.click('.batch-header')
            h.snap('the batch shut again')
        }
    },
    {
        name: 'a batch with nothing in it, a playlist with no tracks', run: async (h) => {
            await h.publish(() => {
                h.store.begin(1, 'u1')
                h.store.setSeries([entry('s1', 'Plant', Status.READY, [playlist('p1', 'Quiet', [])], { batches: [{ name: 'Empty batch', savedAt: '2026-11-01T10:00:00Z', playlists: [] }, { name: 'Quiet', savedAt: '2026-10-01T10:00:00Z', playlists: [playlist('p1', 'Quiet', [])] }] })])
            })
            await h.click('.batch-header')
            await h.click('.batch-group-card:nth-child(2) .batch-header')
            await h.click('.playlist-row')
            h.snap('empty things')
        }
    },
    {
        name: 'failures', run: async (h) => {
            await h.publish(() => {
                h.store.begin(1, 'u1')
                h.store.setSeries([
                    entry('s1', 'Plant', Status.FAILED, null, { error: 'offline' }),
                    entry('s2', 'Floyd', Status.FAILED, [playlist('p2', 'B')], { error: 'offline', batches: groupIntoBatches([playlist('p2', 'B')]) })
                ])
            })
            h.snap('two series failed')
            await h.publish(() => h.store.setListFailed('unavailable'))
            h.snap('the list failed with series on it')
            await h.click('.series-failed button')
        }
    },
    {
        name: 'nothing to show', run: async (h) => {
            await h.publish(() => {
                h.store.begin(1, 'u1')
                h.store.setSeries([entry('s1', 'Plant', Status.EMPTY, [])])
            })
            h.snap('empty state')
            await h.publish(() => h.store.patchEntry('s1', { refreshing: true }))
            h.snap('empty state while updating')
        }
    },
    {
        name: 'updating', run: async (h) => {
            await h.publish(() => twoSeries(h.store))
            await h.publish(() => h.store.patchEntry('s2klmnopqrst', { refreshing: true }))
            h.snap('updating')
            await h.publish(() => h.store.patchEntry('s1abcdefghij', { thumbnails: [] }))
            h.snap('no covers')
        }
    },
    {
        name: 'search and filters', run: async (h) => {
            await h.publish(() => twoSeries(h.store))
            await h.type('#genericSearch', 'floyd')
            h.snap('search floyd')
            await h.type('#genericSearch', 'zeppelin')
            h.snap('no match')
            await h.type('#genericSearch', '')
            await h.change('#filter-series', 's2klmnopqrst')
            h.snap('one series')
            await h.change('#filter-series', 'all')
            await h.change('#genericSort', 'name_asc')
            h.snap('sorted by name')
            await h.change('#genericSort', 'name_desc')
            h.snap('sorted by name, backwards')
            await h.change('#filter-batch', 'Batch B')
            h.snap('one batch')
        }
    },
    {
        name: 'the window of a playlist', run: async (h) => {
            await h.publish(() => twoSeries(h.store))
            await h.click('.batch-header')
            await h.click('.playlist-row [aria-label^="View the tracks"]')
            h.snap('the window', '#playlist-modal')
            await h.click('#playlist-modal .btn-secondary')
            h.snap('the window closed', '#playlist-modal')
        }
    },
    {
        name: 'the buttons', run: async (h) => {
            await h.publish(() => twoSeries(h.store))
            await h.click('.series-group .btn-primary')
            await h.click('.series-group .btn-secondary')
            await h.click('.batch-card-buttons .btn-secondary')
            h.snap('after the clicks')
        }
    },
    {
        name: 'exporting from the list (F90)', run: async (h) => {
            await h.publish(() => twoSeries(h.store))
            await h.click('[aria-label="Export batch Sunday mix"]')
            h.snap('the window of the batch', '#playlist-export-window')
            h.note('the batch stays shut', document.querySelector('.batch-group-card').dataset.collapsed)
            await h.key('Escape')
            h.snap('after Escape', '#playlist-export-window')
            await h.click('.batch-header')
            h.snap('an open batch with its export buttons')
            await h.click('.playlist-row [aria-label="Export Playlist p3"]')
            h.snap('the window of a playlist', '#playlist-export-window')
            h.note('the playlist stays shut', document.querySelectorAll('.playlist-tracks-list:not(.hidden)').length)
        }
    },
    {
        name: 'exporting from the list (F90)', phone: true, run: async (h) => {
            await h.publish(() => twoSeries(h.store))
            await h.click('.saved-series-toggle')
            await h.click('.saved-phone-batch__main')
            h.snap('an open batch with the export beside each playlist', '.saved-phone-batch')
            await h.click('.saved-phone-playlist-head .phone-more')
            h.snap('the sheet of a playlist', '#playlist-export-window')
        }
    },
    {
        name: 'the sheet of a batch has Export (F90)', phone: true, run: async (h) => {
            await h.publish(() => twoSeries(h.store))
            await h.click('.saved-series-toggle')
            await h.click('.saved-phone-batch .phone-more')
            h.snap('the sheet of a batch', '.saved-phone-sheet')
            await h.click('.saved-phone-sheet .albums-sheet__row:nth-child(2)')
            h.snap('the sheet of the export', '#playlist-export-window')
        }
    },
    {
        name: 'the list on the phone', phone: true, run: async (h) => {
            await h.publish(() => twoSeries(h.store))
            h.snap('closed')
            await h.click('.saved-series-toggle')
            h.snap('a series open')
            await h.click('.saved-phone-batch__main')
            h.snap('a batch open')
            await h.click('.saved-series-toggle')
            h.snap('the series shut')
            await h.click('.saved-series-toggle')
            h.snap('and open again')
            await h.click('.saved-phone-playlist')
        }
    },
    {
        name: 'the sheets of the phone', phone: true, run: async (h) => {
            await h.publish(() => twoSeries(h.store))
            await h.click('.saved-phone-series__head .phone-more')
            h.snap('the sheet of a series', '.saved-phone-sheet')
            await h.click('.saved-phone-sheet .albums-sheet__row')
            await h.click('.saved-series-toggle')
            await h.click('.saved-phone-batch .phone-more')
            h.snap('the sheet of a batch', '.saved-phone-sheet')
            await h.click('.saved-phone-sheet .albums-sheet__row--danger')
        }
    },
    {
        name: 'the filters on the phone', phone: true, run: async (h) => {
            await h.publish(() => twoSeries(h.store))
            await h.change('#filter-series', 's2klmnopqrst')
            h.snap('one filter on')
            await h.change('#filter-batch', 'Batch B')
            h.snap('two filters on')
            await h.click('.filters-phone-button')
            h.snap('the sheet of the filters', '.filter-sheet-window')
        }
    },
    {
        name: 'a failure on the phone', phone: true, run: async (h) => {
            await h.publish(() => {
                h.store.begin(1, 'u1')
                h.store.setSeries([entry('s1', 'Plant', Status.FAILED, null, { error: 'offline' }), entry('s2', 'Floyd', Status.READY, [playlist('p2', 'B')])])
            })
            h.snap('failed and fine')
        }
    }
]

/** The router does not go anywhere in these tests: a click that would navigate is only recorded. */
export function quietTheRouter() {
    return vi.spyOn(router, 'navigate').mockImplementation(() => {})
}

/** The window of the phone as the tests set it: `matches` for the line of 899 px. */
export function asPhone(phone) {
    window.scrollTo = vi.fn()
    window.matchMedia = vi.fn(() => ({ matches: phone, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
}
