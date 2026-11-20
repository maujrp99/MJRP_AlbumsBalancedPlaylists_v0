/**
 * F76 polish, recheck N5: the saved playlists on the phone show a machine-made batch name in a
 * readable form and keep the real one; a name a person typed is shown as typed.
 */
import { describe, it, expect } from 'vitest'
import { readableBatchName, shortDate } from '../../../public/js/components/playlists/batchNames.js'

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
})
