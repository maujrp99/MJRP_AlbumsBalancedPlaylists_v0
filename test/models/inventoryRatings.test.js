/**
 * F71 (S-56) - "Update ratings", as pure rules: the ask made from the items, what the answer
 * becomes (the `averages` of each item), what is kept when a source gave nothing, and what the
 * person is told.
 */
import { describe, it, expect } from 'vitest'
import {
    RATING_SOURCES, RATINGS_SERIES_ID, CONFIRM_FROM, ratingsAskOf, queryOfItem, mergeAverages, planAverages,
    ratingsQuestion, ratingsProgressText, ratingsOutcome
} from '../../public/js/models/inventoryRatings.js'
import { SourceGap } from '../../public/js/models/albumAsk.js'

const AT = '2026-11-20T12:00:00.000Z'

const item = (id, artist, title, extra = {}) => ({ id, artist, title, owned: null, albumData: { id: `${artist}_${title}`.toLowerCase(), artist, title }, ...extra })
const album = (artist, title, tracks) => ({
    id: `${artist}_${title}`.toLowerCase(), artist, title,
    getTracks: (order) => (order === 'acclaim' ? tracks : tracks.map(({ title: name }) => ({ title: name })))
})
const askResult = (albums, missingSources = [], failed = []) => ({ albums, missingSources, failed, total: albums.length + failed.length, aborted: false })

describe('the ask made from the inventory', () => {
    it('one series with one query for each item: artist, title and the Apple Music id the item holds', () => {
        const items = [
            item('a', 'Pearl Jam', 'Ten', { year: 1991, albumData: { id: 'pearl-jam_ten', appleMusicId: '1053135953' } }),
            item('b', 'Yes', 'Fragile')
        ]

        expect(ratingsAskOf(items)).toEqual({
            id: RATINGS_SERIES_ID,
            albumQueries: [
                { artist: 'Pearl Jam', title: 'Ten', appleMusicId: '1053135953', year: 1991, coverUrl: null },
                { artist: 'Yes', title: 'Fragile', appleMusicId: null, year: null, coverUrl: null }
            ]
        })
        expect(RATINGS_SERIES_ID).toBe('inventory-ratings')
    })

    it('an item loaded from the catalog gives the id it was loaded by', () => {
        const loaded = item('a', 'A', 'B', { albumData: { id: 'a_b', metadata: { source: 'Apple Music', sourceId: 777 } } })

        expect(queryOfItem(loaded).appleMusicId).toBe('777')
    })

    it('reads the names of the item, and the names of the held album when the item has none', () => {
        expect(queryOfItem({ id: 'x', albumData: { artist: 'Held', title: 'Album' } })).toMatchObject({ artist: 'Held', title: 'Album' })
    })

    it('asks for the ratings and for the popularity, and for nothing else', () => {
        expect(RATING_SOURCES).toEqual(['acclaim', 'popularity'])
    })
})

describe('mergeAverages: a number is never overwritten by "nothing"', () => {
    const fresh = (rating, popularity) => ({ rating, popularity, ratedTracks: rating === null ? 0 : 9, popTracks: popularity === null ? 0 : 8 })
    const before = { rating: 70, popularity: 40, ratedTracks: 5, popTracks: 6, at: '2026-01-01T00:00:00.000Z' }

    it('both new: both written, with the time', () => {
        expect(mergeAverages(before, fresh(80, 50), AT)).toEqual({ rating: 80, popularity: 50, ratedTracks: 9, popTracks: 8, at: AT })
    })

    it('a source gave nothing this time: the previous number stays, with the count it had', () => {
        expect(mergeAverages(before, fresh(80, null), AT)).toEqual({ rating: 80, popularity: 40, ratedTracks: 9, popTracks: 6, at: AT })
        expect(mergeAverages(before, fresh(null, 50), AT)).toEqual({ rating: 70, popularity: 50, ratedTracks: 5, popTracks: 8, at: AT })
    })

    it('nothing new and nothing before: nothing is written', () => {
        expect(mergeAverages(undefined, fresh(null, null), AT)).toBe(null)
    })

    it('nothing new but something before: nothing is written, the item stays as it is', () => {
        expect(mergeAverages(before, fresh(null, null), AT)).toBe(null)
    })

    it('no previous value: what came is written, and the other average is null', () => {
        expect(mergeAverages(undefined, fresh(80, null), AT)).toEqual({ rating: 80, popularity: null, ratedTracks: 9, popTracks: 0, at: AT })
    })
})

describe('planAverages: the answer of the ask becomes the averages of the items', () => {
    const items = [item('inv-1', 'Pink Floyd', 'The Wall'), item('inv-2', 'Yes', 'Fragile'), item('inv-3', 'Nobody', 'Lost Album')]

    it('matches each ready album back to its item with the identity rule, and averages its tracks', () => {
        const wall = album('Pink Floyd', 'The Wall (Remastered)', [{ title: 'Hey You', rating: 90, spotifyPopularity: 60 }, { title: 'Comfortably Numb', rating: 80, spotifyPopularity: 70 }])
        const fragile = album('Yes', 'Fragile', [{ title: 'Roundabout', rating: 70, spotifyPopularity: 50 }])

        const plan = planAverages(items, askResult([fragile, wall]), AT)

        expect([...plan.updates].sort((a, b) => a.id.localeCompare(b.id))).toEqual([
            { id: 'inv-1', averages: { rating: 85, popularity: 65, ratedTracks: 2, popTracks: 2, at: AT } },
            { id: 'inv-2', averages: { rating: 70, popularity: 50, ratedTracks: 1, popTracks: 1, at: AT } }
        ])
    })

    it('counts the items no album came back for, as not found', () => {
        const plan = planAverages(items, askResult([album('Yes', 'Fragile', [{ title: 'Roundabout', rating: 70, spotifyPopularity: 50 }])], [], [{ label: 'Nobody - Lost Album', reason: 'not found' }]), AT)

        expect(plan.notFound).toBe(2)
        expect(plan.updates).toHaveLength(1)
    })

    it('an album found but with no rating and no popularity changes nothing and is counted apart', () => {
        const bare = album('Yes', 'Fragile', [{ title: 'Roundabout' }])

        const plan = planAverages(items, askResult([bare]), AT)

        expect(plan.updates).toEqual([])
        expect(plan.withoutRatings).toBe(1)
        expect(plan.notFound).toBe(2)
    })

    it('an album whose source gave nothing keeps the number the item had', () => {
        const kept = [{ ...items[1], averages: { rating: 66, popularity: 33, ratedTracks: 4, popTracks: 4, at: '2026-01-01T00:00:00.000Z' } }]
        const noPopularity = album('Yes', 'Fragile', [{ title: 'Roundabout', rating: 70 }])

        const plan = planAverages(kept, askResult([noPopularity]), AT)

        expect(plan.updates).toEqual([{ id: 'inv-2', averages: { rating: 70, popularity: 33, ratedTracks: 1, popTracks: 4, at: AT } }])
    })

    it('counts the albums Spotify was not asked for, and the ones a source did not answer for', () => {
        const fragile = album('Yes', 'Fragile', [{ title: 'Roundabout', rating: 70 }])
        const missing = [
            { source: 'popularity', key: 'k1', label: 'Yes - Fragile', gap: SourceGap.NOT_CONNECTED },
            { source: 'popularity', key: 'k2', label: 'Pink Floyd - The Wall', gap: SourceGap.NOT_CONNECTED },
            { source: 'acclaim', key: 'k3', label: 'x', gap: SourceGap.FAILED },
            { source: 'acclaim', key: 'k4', label: 'y', gap: SourceGap.EMPTY }
        ]

        const plan = planAverages(items, askResult([fragile], missing), AT)

        expect(plan.popularityNotConnected).toBe(2)
        expect(plan.unanswered).toBe(1)
    })

    it('two albums that are one item write that item once', () => {
        const one = album('Yes', 'Fragile', [{ title: 'Roundabout', rating: 70 }])
        const edition = album('Yes', 'Fragile (Remastered)', [{ title: 'Roundabout', rating: 99 }])

        const plan = planAverages(items, askResult([one, edition]), AT)

        expect(plan.updates.map(update => update.id)).toEqual(['inv-2'])
    })

    it('an empty ask changes nothing', () => {
        expect(planAverages([], askResult([]), AT)).toMatchObject({ updates: [], notFound: 0, withoutRatings: 0 })
    })
})

describe('what the person is told', () => {
    it('the question is asked only above 30 albums, and says how many and that it takes a while', () => {
        expect(CONFIRM_FROM).toBe(30)
        expect(ratingsQuestion(211)).toEqual({
            title: 'Update ratings?',
            message: 'Read the ratings of 211 albums? This can take a few minutes.',
            confirmText: 'Read ratings'
        })
    })

    it('the button says what is being done', () => {
        expect(ratingsProgressText({ phase: 'reading', done: 40, total: 211 })).toBe('Reading ratings… 40 of 211')
        expect(ratingsProgressText({ phase: 'reading', done: 0, total: 211 })).toBe('Reading ratings… 0 of 211')
        expect(ratingsProgressText({ phase: 'saving' })).toBe('Saving ratings…')
    })

    const done = { total: 211, planned: 180, saved: 180, notFound: 20, withoutRatings: 11, popularityNotConnected: 0, unanswered: 0, error: null }

    it('the end says how many got ratings, how many were not found and how many had none', () => {
        expect(ratingsOutcome(done)).toEqual({
            ok: true,
            text: 'Ratings updated for 180 of 211 albums. 20 albums were not found. 11 albums had no ratings at their sources.'
        })
    })

    it('says nothing about what did not happen', () => {
        expect(ratingsOutcome({ ...done, total: 5, saved: 5, planned: 5, notFound: 0, withoutRatings: 0 })).toEqual({ ok: true, text: 'Ratings updated for 5 of 5 albums.' })
        expect(ratingsOutcome({ ...done, total: 1, saved: 1, planned: 1, notFound: 0, withoutRatings: 0 }).text).toBe('Ratings updated for 1 of 1 album.')
    })

    it('says in one plain sentence that Spotify is not connected, and how many albums it touched', () => {
        const text = ratingsOutcome({ ...done, notFound: 0, withoutRatings: 0, popularityNotConnected: 150 }).text

        expect(text).toBe('Ratings updated for 180 of 211 albums. Spotify is not connected: popularity was not read for 150 albums.')
    })

    it('says a source did not answer and that what the albums had before was kept', () => {
        const text = ratingsOutcome({ ...done, notFound: 0, withoutRatings: 0, unanswered: 1 }).text

        expect(text).toContain('A source did not answer for 1 album: the numbers it had before were kept.')
    })

    it('a write that stopped half way is said as it was', () => {
        expect(ratingsOutcome({ ...done, saved: 100, error: 'offline' })).toEqual({
            ok: false,
            text: 'Saved ratings for 100 of 180 albums, then a write failed. Run Update ratings again to save the rest.'
        })
        expect(ratingsOutcome({ ...done, saved: 0, error: 'offline' })).toEqual({
            ok: false,
            text: 'No ratings were saved: the write failed and your inventory is as it was. Try again.'
        })
    })
})
