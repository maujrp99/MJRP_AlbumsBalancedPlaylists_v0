/**
 * F76 polish, recheck N5, and F83 wave 1: what the saved playlists screen says in words. The first block is taken over from
 * test/components/playlists/batchNames.test.js (the same assertions, the helper now writes through the dictionary); the rest
 * is new: the minutes, the date and the plural forms in Portuguese.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readableBatchName, shortDate, minutes, batchFacts, seriesSummary } from '../../../public/js/screens/saved-playlists/listText'
import { setLocale, PREVIEW_KEY } from '../../../public/js/i18n/t.js'

describe('the name of a saved batch on the phone', () => {
    it('a typed name is shown as typed', () => {
        expect(readableBatchName('Sunday mix')).toEqual({ text: 'Sunday mix', machine: false })
    })

    it('the app\'s own default name becomes the date it was saved', () => {
        expect(readableBatchName('TheAlbumBlender Playlist 2026-11-20 23:21')).toEqual({ text: 'Saved 20 Nov 2026, 23:21', machine: true })
    })

    it('a name with codes and a stamp loses the stamp (the row says the date) and spells the codes', () => {
        expect(readableBatchName('1. Bob Dylan… SPFY Top 3 Bal.Intv.2026-11-20 23:21')).toEqual({ text: '1. Bob Dylan… Spotify Top 3 balanced', machine: true })
    })

    it('one date format: 20 Nov 2026', () => {
        expect(shortDate(Date.UTC(2026, 10, 20, 12))).toBe('20 Nov 2026')
        expect(shortDate(0)).toBe('')
    })

    it('a name that is only a stamp or only the prefix is still readable', () => {
        expect(readableBatchName('2026-11-20 23:21')).toEqual({ text: 'Saved 20 Nov 2026, 23:21', machine: true })
        expect(readableBatchName('TheAlbumBlender Playlist')).toEqual({ text: 'Untitled batch', machine: true })
    })
})

describe('lengths and facts', () => {
    it('minutes: 58 min, 1 h, 1 h 12 min', () => {
        expect(minutes(58 * 60)).toBe('58 min')
        expect(minutes(60 * 60)).toBe('1 h')
        expect(minutes(72 * 60)).toBe('1 h 12 min')
        expect(minutes(0)).toBe('0 min')
    })

    it('the facts of a batch and the summary of a series say the singular for one and the plural for the rest', () => {
        const batch = { name: 'Solo', savedAt: '2026-11-01T10:00:00Z', playlists: [{ id: 'a', name: 'A', tracks: [{ title: 'T', duration: 120 }] }] }
        expect(batchFacts(batch)).toBe('1 playlist · 1 track · 2 min · 1\u00a0Nov\u00a02026')
        expect(seriesSummary([batch, batch])).toBe('2 batches · 2 playlists')
    })
})

describe('in Portuguese', () => {
    beforeEach(async () => {
        window.localStorage.setItem(PREVIEW_KEY, 'pt')
        await setLocale('pt')
    })
    afterEach(async () => {
        window.localStorage.removeItem(PREVIEW_KEY)
        await setLocale('en')
    })

    it('the words and the plural forms follow the language, and so do the month names', () => {
        const batch = { name: 'Solo', savedAt: '2026-11-01T10:00:00Z', playlists: [{ id: 'a', name: 'A', tracks: [{ title: 'T', duration: 120 }, { title: 'U', duration: 60 }] }] }
        expect(batchFacts(batch)).toBe('1 playlist · 2 faixas · 3 min · 1\u00a0de\u00a0nov.\u00a0de\u00a02026')
        expect(seriesSummary([batch])).toBe('1 lote · 1 playlist')
        expect(readableBatchName('TheAlbumBlender Playlist 2026-11-20 23:21').text).toBe('Guardado em 20 nov. 2026, 23:21')
    })
})
