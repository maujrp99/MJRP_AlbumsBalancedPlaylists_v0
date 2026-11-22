/**
 * F55, slice 2 - an album accepted by the second tier of the identity rule (the catalog only has the title asked for with a subtitle)
 * says so on its card, in one line; every other album says nothing. Carried over to React in F83 wave 5a: the sentences moved from
 * `identityNotice` to the dictionaries (`albums.identity.<reason>`), and the cards are the React ones (compact, list, phone tile, phone row).
 */
import { describe, it, expect, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { CompactCard, ExpandedCard, PhoneRow, PhoneTile } from '../../../public/js/screens/albums/AlbumCard'
import { Album } from '../../../public/js/models/Album.js'
import { identityReasonOf, Reason } from '../../../public/js/models/askedAlbum.js'
import { SECOND_TIER_RULES } from '../../../shared/albumIdentity.js'
import { albums as en } from '../../../public/js/i18n/en/albums.js'
import { albums as pt } from '../../../public/js/i18n/pt/albums.js'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const NOTICE = 'Asked for by its short title: the catalog only has this one, with a subtitle.'
const album = (identityReason?: string) => new Album({
    id: 'a1',
    title: 'No Quarter: Jimmy Page & Robert Plant Unledded',
    artist: 'Jimmy Page & Robert Plant',
    year: 1994,
    coverUrl: 'https://cover/600',
    tracks: [{ id: 't1', title: 'Nobody\'s Fault but Mine', rank: 1, duration: 200 }],
    metadata: { source: 'Apple Music', sourceId: 'apple-unledded', ...(identityReason ? { identityReason } : {}) }
} as never)

const camel = (reason: string) => reason.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase())
const keyOf = (reason: string) => `albums.identity.${camel(reason)}`
const dictionary = (words: Record<string, string>, reason: string) => words[keyOf(reason)]

const noop = () => {}
const cards: Record<string, (a: Album) => React.ReactElement> = {
    'the grid card': (a) => <CompactCard album={a as never} act={noop} />,
    'the list card': (a) => <ExpandedCard album={a as never} index={0} act={noop} />,
    'the phone tile': (a) => <PhoneTile album={a as never} act={noop} />,
    'the phone row': (a) => <PhoneRow album={a as never} act={noop} />
}

async function drawn(make: (a: Album) => React.ReactElement, a: Album): Promise<HTMLElement> {
    const host = document.body.appendChild(document.createElement('div'))
    await act(async () => { createRoot(host).render(make(a)) })
    return host
}

describe('the sentence of an identity reason', () => {
    it('is one line for an album accepted by the second tier, and nothing for any other', () => {
        expect(identityReasonOf(album(Reason.TITLE_BEFORE_SUBTITLE))).toBe(Reason.TITLE_BEFORE_SUBTITLE)
        expect(dictionary(en, Reason.TITLE_BEFORE_SUBTITLE)).toBe(NOTICE)
        expect(identityReasonOf(album(Reason.EXACT_TITLE))).toBeNull()
        expect(identityReasonOf(album(Reason.EDITION_OF_TITLE))).toBeNull()
        expect(identityReasonOf(album())).toBeNull()
        expect(identityReasonOf(null as never)).toBeNull()
    })

    // F68: the second tier is a list of rules, and the line says which one accepted the album
    it('has a true line for EVERY rule of the second tier, each its own, in both languages', () => {
        const lines = SECOND_TIER_RULES.map((rule: { reason: string }) => dictionary(en, rule.reason))

        lines.forEach((line: string | undefined, i: number) => expect(line, SECOND_TIER_RULES[i].reason).toMatch(/^Asked for .+\.$/))
        expect(new Set(lines).size).toBe(SECOND_TIER_RULES.length)
        expect(dictionary(en, Reason.TITLE_WITHOUT_PARENTHESES)).toBe('Asked for by its short title: the catalog only has this one, with more in parentheses.')
        expect(dictionary(en, Reason.TITLE_IN_PARENTHESES)).toBe('Asked for by the name the catalog writes in parentheses.')
        expect(dictionary(en, Reason.TITLE_WITH_ARTIST_NAME)).toBe('Asked for by its title: the catalog writes the artist\'s name in front of it.')
        expect(dictionary(en, Reason.TITLE_WRITTEN_OTHERWISE)).toBe('Asked for in another spelling: the catalog writes the title this way.')

        SECOND_TIER_RULES.forEach((rule: { reason: string }) => {
            expect(dictionary(pt, rule.reason), `pt ${rule.reason}`).toBeTruthy()
            expect(dictionary(pt, rule.reason), `pt ${rule.reason}`).not.toBe(dictionary(en, rule.reason))
        })
    })

    it('a reason it does not know says nothing', () => {
        expect(identityReasonOf(album('a-reason-of-tomorrow'))).toBeNull()
        expect(identityReasonOf(album(Reason.TITLE_MISMATCH))).toBeNull()
    })
})

describe('the album card', () => {
    afterEach(() => { document.body.innerHTML = '' })

    for (const [name, make] of Object.entries(cards)) {
        it(`${name} shows the line for an album accepted by the second tier`, async () => {
            const host = await drawn(make, album(Reason.TITLE_BEFORE_SUBTITLE))
            expect(host.querySelector('[data-identity-note]')!.textContent).toBe(NOTICE)
        })

        it(`${name} shows nothing for an album accepted by its own title, or with no reason`, async () => {
            expect((await drawn(make, album(Reason.EXACT_TITLE))).querySelector('[data-identity-note]')).toBeNull()
            expect((await drawn(make, album())).querySelector('[data-identity-note]')).toBeNull()
        })
    }

    it('every rule of the second tier is the sentence its card shows', async () => {
        for (const rule of SECOND_TIER_RULES as unknown as Array<{ reason: string }>) {
            const host = await drawn(cards['the grid card'], album(rule.reason))
            expect(host.querySelector('[data-identity-note]')!.textContent, rule.reason).toBe(dictionary(en, rule.reason))
        }
    })
})
