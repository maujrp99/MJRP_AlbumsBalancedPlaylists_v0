/**
 * F68 - the classes the ratings source showed on 2026-11-19, checked on the other three sources
 * with the shapes they give (no network; the shapes are the ones askedAlbum.js adapts). What the
 * reviewed rule gives each of them for free. Their own ground truth (what Apple Music and Spotify
 * really list for the 16 albums) was not asked for: that needs their own sweep.
 */
import { describe, it, expect, vi } from 'vitest'
import { createRequire } from 'node:module'
import { appleCandidate, spotifyCandidate, localCandidate, pickAlbum, Reason } from '../../public/js/models/askedAlbum.js'

const require = createRequire(import.meta.url)
const { findSpotifyAlbum } = require('../../server/lib/services/spotifyPopularity.js')

const apple = (name, artistName, releaseDate = '1998-04-21') => ({ id: name, attributes: { name, artistName, releaseDate } })
const spotify = (name, artists, release_date = '1998-04-21') => ({ id: name, name, release_date, artists: artists.map(artist => ({ name: artist })) })
const clarksdale = { artist: 'Robert Plant & Jimmy Page', title: 'Walking Into Clarksdale' }

describe('the artist written with the names in another order', () => {
    it('Apple Music: one text, «Jimmy Page & Robert Plant»', () => {
        const picked = pickAlbum(clarksdale, [apple('No Quarter', 'Jimmy Page & Robert Plant'), apple('Walking Into Clarksdale', 'Jimmy Page & Robert Plant')], appleCandidate)

        expect(picked).toMatchObject({ found: true, index: 1, verdict: { reason: Reason.EXACT_TITLE } })
    })

    it('Spotify: a list of artists, in the order Spotify gives them', () => {
        const picked = pickAlbum(clarksdale, [spotify('Walking Into Clarksdale', ['Jimmy Page', 'Robert Plant'])], spotifyCandidate)

        expect(picked).toMatchObject({ found: true, verdict: { reason: Reason.EXACT_TITLE } })
    })

    it('the local dataset: one text, with "and"', () => {
        const picked = pickAlbum(clarksdale, [{ artist: 'Jimmy Page and Robert Plant', album: 'Walking Into Clarksdale', year: 1998 }], localCandidate)

        expect(picked.found).toBe(true)
    })

    it('one of the two names alone is still another artist, on every source', () => {
        expect(pickAlbum(clarksdale, [apple('Walking Into Clarksdale', 'Robert Plant')], appleCandidate).found).toBe(false)
        expect(pickAlbum(clarksdale, [spotify('Walking Into Clarksdale', ['Jimmy Page'])], spotifyCandidate).found).toBe(false)
    })
})

describe('the rules of the second tier are the same on every source', () => {
    it('Apple Music lists only the title with more in parentheses: it is picked, flagged', () => {
        const crimson = { artist: 'King Crimson', title: 'In the Court of the Crimson King' }
        const picked = pickAlbum(crimson, [apple('In the Court of the Crimson King (An Observation by King Crimson)', 'King Crimson')], appleCandidate)

        expect(picked).toMatchObject({ found: true, verdict: { same: true, reason: Reason.TITLE_WITHOUT_PARENTHESES } })
    })

    it('Spotify lists the album as asked for and a version with more in parentheses: the album as asked for', () => {
        const eagles = { artist: 'Eagles', title: 'Hotel California' }
        const listed = [spotify('Hotel California (Live at the Forum \'76)', ['Eagles']), spotify('Hotel California (2013 Remaster)', ['Eagles'])]

        expect(pickAlbum(eagles, listed, spotifyCandidate)).toMatchObject({ index: 1, verdict: { reason: Reason.EDITION_OF_TITLE } })
    })
})

describe('the text sent to the Spotify search is the rule\'s title without edition notes (server)', () => {
    it('«Foxtrot (2007 Stereo Mix)» is also asked for as «Foxtrot» (the cleaner of before did not know "Mix" in parentheses)', async () => {
        const http = { get: vi.fn(async (url, { params }) => ({ data: { albums: { items: params.q === 'album:Foxtrot artist:Genesis' ? [spotify('Foxtrot', ['Genesis'])] : [] } } })) }

        const found = await findSpotifyAlbum({ title: 'Foxtrot (2007 Stereo Mix)', artist: 'Genesis' }, 'token', http)

        expect(found.id).toBe('Foxtrot')
        expect(http.get.mock.calls.map(call => call[1].params.q)).toEqual(['album:Foxtrot (2007 Stereo Mix) artist:Genesis', 'album:Foxtrot artist:Genesis'])
    })
})
