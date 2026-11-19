/**
 * F62 - each recipe of the blend menu does what its name says. Every case goes through
 * PlaylistGenerationService, the path the blend screen and "generate again" use.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { playlistGenerationService } from '../../public/js/services/PlaylistGenerationService.js'
import { getAllAlgorithms } from '../../public/js/algorithms/index.js'
import { createRankingStrategy } from '../../public/js/ranking/index.js'

const MIN = 60

/** rows: [title, minutes, popularity, rating] in the order the album object keeps them */
function album(id, artist, rows, extra = {}) {
    const tracks = rows.map(([title, minutes, popularity, rating], index) => ({
        id: `${id}-${index + 1}`,
        title,
        duration: minutes * MIN,
        spotifyPopularity: popularity ?? null,
        rating: rating ?? null,
        position: index + 1
    }))
    return { id, title: `Album ${id}`, artist, tracks, ...extra }
}

const titles = (playlist) => playlist.tracks.map(track => track.title)
const generate = (albums, config) => playlistGenerationService.generate(albums, config).playlists

const ROCK = album('rock', 'Zed', [['R-one', 4, 10, 90], ['R-two', 4, 80, 70], ['R-three', 4, 50, 80], ['R-four', 4, 30, 60]])
const JAZZ = album('jazz', 'Abba', [['J-one', 5, 20, 50], ['J-two', 5, 90, 95], ['J-three', 5, 60, 40]])

afterEach(() => vi.restoreAllMocks())

describe('the recipes of the blend menu', () => {
    it('are four, and each has a name and a description', () => {
        const recipes = getAllAlgorithms()
        expect(recipes.map(r => r.id)).toEqual(['mjrp-balanced-cascade', 'top-n-popular', 'top-n-acclaimed', 'top-n-user'])
        recipes.forEach(r => { expect(r.name).toBeTruthy(); expect(r.description).toBeTruthy() })
    })
})

describe('«Top Tracks by Spotify Popularity»', () => {
    const config = { algorithmId: 'top-n-popular', trackCount: 2, outputMode: 'single', groupingStrategy: 'by_album' }

    it('takes the N most popular tracks of each album, most popular first', () => {
        const [playlist] = generate([ROCK, JAZZ], config)
        expect(titles(playlist)).toEqual(['R-two', 'R-three', 'J-two', 'J-three'])
    })

    it('is not moved by a ranking source chosen for another recipe', () => {
        const [playlist] = generate([ROCK, JAZZ], { ...config, rankingId: 'bea' })
        expect(titles(playlist)).toEqual(['R-two', 'R-three', 'J-two', 'J-three'])
    })

    it('takes the whole album when it has fewer than N tracks', () => {
        const [playlist] = generate([JAZZ], { ...config, trackCount: 5 })
        expect(titles(playlist)).toEqual(['J-two', 'J-three', 'J-one'])
    })
})

describe('«Top Acclaimed Tracks on BestEverAlbums»', () => {
    const config = { algorithmId: 'top-n-acclaimed', trackCount: 2, outputMode: 'single', groupingStrategy: 'by_album' }

    it('takes the N best rated tracks of each album, best first', () => {
        const [playlist] = generate([ROCK, JAZZ], config)
        expect(titles(playlist)).toEqual(['R-one', 'R-three', 'J-two', 'J-one'])
    })

    it('never puts a track with no rating above a rated one, however popular it is', () => {
        const mixed = album('mix', 'Zed', [['Rated low', 4, 5, 30], ['Unrated hit', 4, 99, null], ['Rated high', 4, 1, 60]])
        const [playlist] = generate([mixed], { ...config, trackCount: 3 })
        expect(titles(playlist)).toEqual(['Rated high', 'Rated low', 'Unrated hit'])
    })
})

describe('«Top Tracks by My Own Ranking»', () => {
    const config = { algorithmId: 'top-n-user', trackCount: 2, outputMode: 'single', groupingStrategy: 'by_album' }
    const ranked = { ...ROCK, userRanking: [{ trackTitle: 'R-four', userRank: 1 }, { trackTitle: 'R-one', userRank: 2 }, { trackTitle: 'R-two', userRank: 3 }] }

    it('takes the N first tracks of the ranking the person saved', () => {
        const [playlist] = generate([ranked], config)
        expect(titles(playlist)).toEqual(['R-four', 'R-one'])
    })

    it('takes an album with no saved ranking in the order of the album, not in the acclaim order', () => {
        // the album keeps its tracks by acclaim (Album.tracks) and its own order apart (tracksOriginalOrder)
        const byAcclaim = [...JAZZ.tracks].sort((a, b) => b.rating - a.rating)
        const unranked = { ...JAZZ, tracks: byAcclaim, tracksOriginalOrder: JAZZ.tracks }
        const [playlist] = generate([unranked], config)
        expect(titles(playlist)).toEqual(['J-one', 'J-two'])
    })
})

describe('the grouping of a Top N recipe', () => {
    const more = album('more', 'Zed', [['M-one', 3, 70, 10], ['M-two', 3, 60, 20]])
    const config = { algorithmId: 'top-n-popular', trackCount: 2, outputMode: 'single' }

    it('«By Artist then By Rank» puts the tracks of one artist together, by rank', () => {
        const [playlist] = generate([ROCK, JAZZ, more], { ...config, groupingStrategy: 'artist_rank' })
        expect(playlist.tracks.map(t => t.artist)).toEqual(['Abba', 'Abba', 'Zed', 'Zed', 'Zed', 'Zed'])
        expect(titles(playlist)).toEqual(['J-two', 'J-three', 'R-two', 'M-one', 'R-three', 'M-two'])
    })

    it('«By Ranking» puts every first place before every second place', () => {
        const [playlist] = generate([ROCK, JAZZ], { ...config, groupingStrategy: 'flat_ranked' })
        expect(titles(playlist)).toEqual(['R-two', 'J-two', 'R-three', 'J-three'])
    })

    it('«Shuffle» keeps the same tracks and moves them with an even shuffle', () => {
        // an even shuffle fed with 0 swaps each place, from the last, with the first: a rotation
        vi.spyOn(Math, 'random').mockReturnValue(0)
        const [playlist] = generate([ROCK, JAZZ], { ...config, groupingStrategy: 'shuffle' })
        expect(titles(playlist)).toEqual(['R-three', 'J-two', 'J-three', 'R-two'])
    })
})

describe('the output mode of a Top N recipe', () => {
    const config = { algorithmId: 'top-n-popular', trackCount: 3, groupingStrategy: 'by_album', targetDuration: 10 * MIN }

    it('«Single» gives one playlist, whatever the duration', () => {
        expect(generate([ROCK, JAZZ], { ...config, outputMode: 'single' })).toHaveLength(1)
    })

    it('«Multiple» splits by the target duration and loses no track', () => {
        const playlists = generate([ROCK, JAZZ], { ...config, outputMode: 'multiple' })
        expect(playlists.length).toBeGreaterThan(1)
        expect(playlists.flatMap(titles).sort()).toEqual(['J-one', 'J-three', 'J-two', 'R-four', 'R-three', 'R-two'])
    })

    it('«Auto» is one playlist when everything fits the target and several when it does not', () => {
        expect(generate([ROCK, JAZZ], { ...config, outputMode: 'auto', targetDuration: 60 * MIN })).toHaveLength(1)
        expect(generate([ROCK, JAZZ], { ...config, outputMode: 'auto' }).length).toBeGreaterThan(1)
    })
})

describe('«Zé\'s Balanced Playlists»', () => {
    // six albums of eight tracks of 5 minutes: 12 greatest hits (60 min) and 36 deep cuts (180 min)
    const albums = Array.from({ length: 6 }, (_, a) => album(`a${a}`, `Artist ${a}`,
        Array.from({ length: 8 }, (_, t) => [`a${a}-t${t + 1}`, 5, 10 + t, 90 - t * 10])))
    const config = { algorithmId: 'mjrp-balanced-cascade', rankingId: 'bea', targetDuration: 40 * MIN }
    const minutes = (playlist) => playlist.tracks.reduce((sum, t) => sum + t.duration, 0) / MIN

    it('opens with the first and second place of every album', () => {
        const [hits] = generate(albums, config)
        expect(hits.name).toBe('Greatest Hits')
        expect(titles(hits)).toEqual([...albums.map(a => `${a.id}-t1`), ...albums.map(a => `${a.id}-t2`)])
    })

    it('keeps every Deep Cuts playlist within the duration chosen in the menu', () => {
        const deepCuts = generate(albums, config).filter(p => p.name.startsWith('Deep Cuts'))
        expect(deepCuts.length).toBeGreaterThan(1)
        deepCuts.forEach(playlist => expect(minutes(playlist)).toBeLessThanOrEqual(40))
    })

    it('uses every track once: what does not fit goes to «Orphan Tracks», nothing is dropped', () => {
        const all = generate(albums, config).flatMap(titles)
        expect(all).toHaveLength(48)
        expect(new Set(all).size).toBe(48)
    })

    it('follows the ranking source chosen in the menu', () => {
        const byPopularity = generate(albums, { ...config, rankingId: 'spotify' })[0]
        expect(titles(byPopularity).slice(0, 2)).toEqual(['a0-t8', 'a1-t8']) // t8 is the most popular
    })
})

describe('what a ranking does when its data is missing for an album (the fallback the notice names)', () => {
    const order = (rankingId, source) => createRankingStrategy(rankingId).rank(source).map(t => t.title)

    it('Spotify popularity missing: by acclaim', () => {
        const bare = album('x', 'Zed', [['low', 3, null, 10], ['high', 3, null, 90], ['mid', 3, null, 50]])
        expect(order('spotify', bare)).toEqual(['high', 'mid', 'low'])
    })

    it('acclaim missing: by Spotify popularity', () => {
        const bare = album('x', 'Zed', [['low', 3, 10, null], ['high', 3, 90, null], ['mid', 3, 50, null]])
        expect(order('bea', bare)).toEqual(['high', 'mid', 'low'])
        expect(order('balanced', bare)).toEqual(['high', 'mid', 'low'])
    })

    it('neither: the order of the album', () => {
        const bare = album('x', 'Zed', [['first', 3, null, null], ['second', 3, null, null]])
        expect(order('spotify', bare)).toEqual(['first', 'second'])
        expect(order('bea', bare)).toEqual(['first', 'second'])
    })
})

describe('what the generated playlists remember', () => {
    it('is the whole recipe they were generated with, so the screen can show it again', () => {
        const [playlist] = generate([ROCK], {
            algorithmId: 'top-n-acclaimed', trackCount: 4, outputMode: 'single', groupingStrategy: 'flat_ranked', targetDuration: 45 * MIN
        })
        expect(playlist._meta).toEqual({
            algorithmId: 'top-n-acclaimed', rankingId: 'bea', trackCount: 4, outputMode: 'single', groupingStrategy: 'flat_ranked', targetDuration: 45 * MIN
        })
    })
})
