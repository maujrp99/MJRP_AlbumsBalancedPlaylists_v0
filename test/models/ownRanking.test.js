/**
 * F46 - the 'My Ranking' filter over every series: the stored rankings (kept under the id of the
 * album that was loaded) matched to the album queries (what the person asked for) without loading.
 */
import { describe, it, expect } from 'vitest'
import {
    nameIdentity, titleIdentity, stableAlbumId, buildRankedIndex, isQueryRanked, rankedQueryKeys
} from '../../public/js/models/ownRanking.js'
import { queryKey } from '../../public/js/models/albumLoadState.js'
import { filterSeries } from '../../public/js/models/seriesFilter.js'

const record = (artistName, albumTitle) => ({ albumId: stableAlbumId(artistName, albumTitle), artistName, albumTitle })

describe('ownRanking', () => {
    it('stableAlbumId is the rule the stored ranking ids were made with', () => {
        expect(stableAlbumId('Pink Floyd', 'The Dark Side of the Moon')).toBe('pink-floyd_the-dark-side-of-the-moon')
        expect(stableAlbumId('AC/DC', 'Back in Black')).toBe('acdc_back-in-black')
        expect(stableAlbumId('Jimmy Page & Robert Plant', 'No Quarter')).toBe('jimmy-page--robert-plant_no-quarter')
    })

    it('matches a query to its ranking when the names are the same', () => {
        const index = buildRankedIndex([record('Pink Floyd', 'Animals')])
        expect(isQueryRanked('Pink Floyd - Animals', index)).toBe(true)
        expect(isQueryRanked({ artist: 'Pink Floyd', title: 'Animals' }, index)).toBe(true)
    })

    describe('names that diverge between what was asked and what was loaded', () => {
        const cases = [
            ['case and spaces', 'pink floyd -  ANIMALS', record('Pink Floyd', 'Animals')],
            ['"&" and "and"', 'Simon and Garfunkel - Bookends', record('Simon & Garfunkel', 'Bookends')],
            ['a query stored with &amp;', 'Jimmy Page &amp; Robert Plant - No Quarter', record('Jimmy Page & Robert Plant', 'No Quarter')],
            ['accents', 'Motorhead - Ace of Spades', record('Motörhead', 'Ace Of Spades')],
            ['accents on both names', 'Sigur Ros - Takk', record('Sigur Rós', 'Takk…')],
            ['apostrophes and punctuation', "Guns N' Roses - Appetite for Destruction", record('Guns N’ Roses', 'Appetite For Destruction')],
            ['an edition note in the loaded title', 'Led Zeppelin - Led Zeppelin IV', record('Led Zeppelin', 'Led Zeppelin IV (Deluxe Edition)')],
            ['a remaster note in the query', 'The Beatles - Abbey Road (2019 Remaster)', record('The Beatles', 'Abbey Road')],
            ['an edition note in square brackets', 'Rush - Moving Pictures', record('Rush', 'Moving Pictures [40th Anniversary]')],
            ['an edition note after a dash', 'David Bowie - Low', record('David Bowie', 'Low - 2017 Remaster')]
        ]
        cases.forEach(([name, query, ranked]) => {
            it(name, () => expect(isQueryRanked(query, buildRankedIndex([ranked]))).toBe(true))
        })
    })

    describe('albums that are not the same are not matched', () => {
        const index = buildRankedIndex([record('Led Zeppelin', 'Led Zeppelin II'), record('Nirvana', 'MTV Unplugged in New York')])

        it('another album of the same artist', () => expect(isQueryRanked('Led Zeppelin - Led Zeppelin', index)).toBe(false))
        it('a title that only starts the same', () => expect(isQueryRanked('Led Zeppelin - Led Zeppelin III', index)).toBe(false))
        it('the same title by another artist', () => expect(isQueryRanked('Alice in Chains - MTV Unplugged in New York', index)).toBe(false))
        it('a note that is not an edition is part of the title', () => {
            const live = buildRankedIndex([record('Nirvana', 'Nevermind (Live)')])
            expect(isQueryRanked('Nirvana - Nevermind', live)).toBe(false)
        })
        it('a query with no title', () => expect(isQueryRanked('', index)).toBe(false))
    })

    it('a ranking stored without the names is still matched by its id', () => {
        const index = buildRankedIndex([{ id: 'pink-floyd_animals', artistName: '', albumTitle: '' }])
        expect(isQueryRanked('Pink Floyd - Animals', index)).toBe(true)
        expect(isQueryRanked('Pink Floyd - Wish You Were Here', index)).toBe(false)
    })

    it('with no ranking, or before the list is read, nothing is ranked', () => {
        expect(isQueryRanked('Pink Floyd - Animals', buildRankedIndex([]))).toBe(false)
        expect(isQueryRanked('Pink Floyd - Animals', null)).toBe(false)
        expect(rankedQueryKeys([{ albumQueries: ['Pink Floyd - Animals'] }], null).size).toBe(0)
    })

    it('rankedQueryKeys answers for every series, loaded or not, and adds the loaded albums that carry a ranking', () => {
        const seriesList = [
            { id: 's1', albumQueries: ['Pink Floyd - Animals', 'Pink Floyd - Meddle'] },
            { id: 's2', albumQueries: [{ artist: 'Rush', title: 'Moving Pictures' }, 'Jimmy Page & Robert Plant - No Quarter'] }
        ]
        const index = buildRankedIndex([record('Pink Floyd', 'Animals'), record('Rush', 'Moving Pictures (Remastered)')])
        // the catalog gave "No Quarter" another title, so its name does not match: the loaded album does
        const loaded = [queryKey('Jimmy Page & Robert Plant - No Quarter')]

        expect([...rankedQueryKeys(seriesList, index, loaded)].sort()).toEqual([
            'jimmy page & robert plant - no quarter', 'pink floyd - animals', 'rush - moving pictures'
        ])
    })

    it('feeds the pure filter: "My Ranking" keeps the ranked queries of every series', () => {
        const seriesList = [
            { id: 's1', name: 'Floyd', albumQueries: ['Pink Floyd - Animals', 'Pink Floyd - Meddle'] },
            { id: 's2', name: 'Other', albumQueries: ['Rush - Signals'] },
            { id: 's3', name: 'Zep', albumQueries: ['Led Zeppelin - Houses of the Holy'] }
        ]
        const index = buildRankedIndex([record('Pink Floyd', 'Animals'), record('Led Zeppelin', 'Houses Of The Holy (Remastered)')])
        const result = filterSeries(seriesList, { source: 'user' }, { ownRankedKeys: rankedQueryKeys(seriesList, index) })

        expect(result.map(group => [group.series.id, group.queries])).toEqual([
            ['s1', ['Pink Floyd - Animals']],
            ['s3', ['Led Zeppelin - Houses of the Holy']]
        ])
    })

    it('identities ignore what does not tell albums apart', () => {
        expect(nameIdentity('  Beyoncé &amp; JAY-Z ')).toBe('beyonce and jay z')
        expect(titleIdentity('OK Computer (OKNOTOK 1997 2017)')).toBe('ok computer oknotok 1997 2017')
        expect(titleIdentity('(Deluxe Edition)')).toBe('deluxe edition') // a title that is only the note stays
    })
})
