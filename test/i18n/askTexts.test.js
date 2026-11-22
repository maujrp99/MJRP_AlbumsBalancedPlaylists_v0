/**
 * F56 (UAT-189), carried in F83 wave 8d from test/models/albumAsk.test.js: what the person is told about an ask for albums. The model gives data
 * now (askNoticeParts, noAlbumsPart, askProgressPart) and i18n/askTexts.js says it; the sentences below are the ones the model wrote, with the
 * same assertions, word for word: the English did not change. One case more proves the Portuguese proposal is said and has the same numbers.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { askNotices, noAlbumsMessage, askProgressText } from '../../public/js/i18n/askTexts.js'
import { readAsk } from '../../public/js/models/albumAsk.js'
import { createEntry, AlbumStatus, EnrichmentStatus, FailureReason } from '../../public/js/models/albumLoadState.js'
import { registerTexts, setLocale, DEFAULT_LOCALE, PREVIEW_KEY } from '../../public/js/i18n/t.js'
import { pt } from '../../public/js/i18n/pt/index.js'

const found = (title, enrichment = {}) => ({
    ...createEntry('s1', `Artist - ${title}`),
    status: AlbumStatus.FOUND,
    album: { id: title, artist: 'Artist', title },
    enrichment: { acclaim: 'done', popularity: 'done', userRanking: 'empty', ...enrichment }
})
const failed = (title, reason = FailureReason.NOT_FOUND) => ({
    ...createEntry('s1', `Artist - ${title}`),
    status: AlbumStatus.FAILED,
    error: { reason, message: `no ${title}` }
})
const ask = (entries, sources = [], flags = {}) => readAsk([{ seriesId: 's1', entries }], sources, flags)

describe('what the person is told, in words', () => {
    it('says nothing when every album is ready with its sources', () => {
        expect(askNotices(ask([found('One')], ['acclaim']).result)).toEqual([])
    })

    it('says how many albums failed, which and why', () => {
        const result = ask([found('One'), failed('Two'), failed('Three', FailureReason.TIMEOUT)]).result

        expect(askNotices(result)).toEqual([
            '2 of 3 albums could not be loaded and were left out: Artist - Two (not found), Artist - Three (took too long).'
        ])
    })

    it('names at most three albums and counts the rest', () => {
        const result = ask([failed('A'), failed('B'), failed('C'), failed('D'), failed('E')]).result

        expect(askNotices(result)[0]).toContain('Artist - C (not found) and 2 more.')
    })

    it('says which source is missing, for how many albums, and whether it failed or has nothing', () => {
        const result = ask([
            found('One', { acclaim: EnrichmentStatus.FAILED, popularity: EnrichmentStatus.EMPTY }),
            found('Two', { acclaim: EnrichmentStatus.EMPTY }),
            found('Three')
        ], ['acclaim', 'popularity']).result

        expect(askNotices(result)).toEqual([
            'Acclaim ratings are missing for 2 of 3 albums (1 did not answer, 1 has none at the source): Artist - One, Artist - Two.',
            'Spotify popularity is missing for 1 of 3 albums (1 has none at the source): Artist - One.'
        ])
    })

    it('the message for "nothing could be loaded" carries the reasons', () => {
        const result = ask([failed('One'), failed('Two', FailureReason.NETWORK)]).result

        expect(noAlbumsMessage(result)).toBe('None of the 2 albums could be loaded: Artist - One (not found), Artist - Two (network error).')
        expect(noAlbumsMessage(ask([]).result)).toBe('This series has no albums.')
    })

    it('the progress line counts what is ready and what it still waits for', () => {
        expect(askProgressText({ total: 4, found: 1, failed: 1, waitingSources: 0 })).toBe('Loading albums: 2 of 4...')
        expect(askProgressText({ total: 4, found: 4, failed: 0, waitingSources: 3 })).toBe('Waiting for the ratings of 3 of 4 albums...')
    })

    it('in Portuguese (a proposal, to be read by the owner) the same numbers and names are said', async () => {
        registerTexts('pt', pt)
        window.localStorage.setItem(PREVIEW_KEY, 'pt')
        expect(await setLocale('pt')).toBe(true)
        const result = ask([found('One'), failed('Two'), failed('Three', FailureReason.TIMEOUT)]).result

        expect(askNotices(result)).toEqual(['2 de 3 álbuns não puderam ser carregados e ficaram de fora: Artist - Two (não encontrado), Artist - Three (demorou demais).'])
        expect(noAlbumsMessage(ask([]).result)).toBe('Esta série não tem álbuns.')
    })

    afterEach(async () => { window.localStorage.removeItem(PREVIEW_KEY); await setLocale(DEFAULT_LOCALE) })
})
