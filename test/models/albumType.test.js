/**
 * F57 - one classifier says the type of an album, for every screen that lists an artist's albums.
 *
 * The albums below have the shape the catalog gives (`MusicKitCatalog.getArtistAlbums`): the title,
 * the track count and `raw.attributes` with `genreNames`, `isSingle`, `isCompilation`. The genre
 * names of the Kendrick Lamar albums are the ones the catalog has for them (copied from
 * `public/assets/data/albums-curated.json`, which was read from the catalog).
 */
import { describe, it, expect } from 'vitest'
import {
    AlbumType, ALBUM_TYPES, TypeReason, classifyAlbum, isElectronic, wantsAiList
} from '../../public/js/models/albumType.js'

const catalogAlbum = (title, genreNames, trackCount, attributes = {}) => ({
    appleMusicId: title,
    title,
    artist: 'Someone',
    trackCount,
    raw: { attributes: { name: title, genreNames, trackCount, isSingle: false, isCompilation: false, ...attributes } }
})

const HIP_HOP = ['Hip-Hop/Rap', 'Music']
const HARDCORE_RAP = ['Hip-Hop/Rap', 'Music', 'Hardcore Rap', 'West Coast Rap', 'Gangsta Rap', 'Rap']
const ROCK = ['Rock', 'Music']
const TRANCE = ['Dance', 'Music', 'Trance', 'Electronic']

const typeOf = (album, context) => classifyAlbum(album, context).type
const answer = (type, reason) => ({ type, reason })

describe('albumType: the closed lists', () => {
    it('six types, the unknown one included', () => {
        expect(ALBUM_TYPES).toEqual(['Album', 'EP', 'Single', 'Live', 'Compilation', 'Uncategorized'])
    })

    it('every answer has a type and a reason of the lists', () => {
        const albums = [
            catalogAlbum('DAMN.', HIP_HOP, 14),
            catalogAlbum('Out There - Single', TRANCE, 2, { isSingle: true }),
            catalogAlbum('Blueprint', TRANCE, 12)
        ]
        const contexts = [undefined, {}, { aiList: null }, { aiList: [] }, { aiList: ['Blueprint'] }, { aiList: ['Other'] }]

        albums.forEach(album => contexts.forEach(context => {
            const { type, reason } = classifyAlbum(album, context)
            expect(ALBUM_TYPES).toContain(type)
            expect(Object.values(TypeReason)).toContain(reason)
        }))
    })
})

describe('albumType: UAT-185, the two Kendrick Lamar albums', () => {
    const TPAB = catalogAlbum('To Pimp a Butterfly', HARDCORE_RAP, 16)
    const GKMC_DELUXE = catalogAlbum('good kid, m.A.A.d city (Deluxe Version)', ['Hip-Hop/Rap', 'Music', 'Gangsta Rap', 'Rap', 'Hardcore Rap', 'West Coast Rap'], 18)

    it('"Hardcore Rap" is not an electronic genre: only a whole genre name counts', () => {
        expect(isElectronic(HARDCORE_RAP)).toBe(false)
        expect(isElectronic(['Reggae', 'Music', 'Modern Dancehall'])).toBe(false)
        expect(isElectronic(['Hardcore'])).toBe(true)
        expect(isElectronic(['Dance', 'Music'])).toBe(true)
        expect(isElectronic(["Jungle/Drum'n'bass"])).toBe(true)
        expect(isElectronic(['IDM/Experimental'])).toBe(true)
        expect(isElectronic(['Afro House'])).toBe(true)
        expect(isElectronic(undefined)).toBe(false)
    })

    it('«To Pimp a Butterfly» is a studio album, with or without an AI list', () => {
        expect(classifyAlbum(TPAB)).toEqual(answer(AlbumType.ALBUM, TypeReason.DEFAULT_STUDIO))
        expect(typeOf(TPAB, { aiList: ['DAMN.'] })).toBe(AlbumType.ALBUM)
        expect(wantsAiList(TPAB)).toBe(false)
    })

    it('«good kid, m.A.A.d city (Deluxe Version)» is a studio album: an edition note changes nothing', () => {
        expect(classifyAlbum(GKMC_DELUXE)).toEqual(answer(AlbumType.ALBUM, TypeReason.DEFAULT_STUDIO))
    })

    it('the other albums of the same artist stay what they were', () => {
        expect(typeOf(catalogAlbum('DAMN.', ['Hip-Hop/Rap', 'Music', 'Rap', 'West Coast Rap'], 14))).toBe(AlbumType.ALBUM)
        expect(typeOf(catalogAlbum('untitled unmastered.', ['Hip-Hop/Rap', 'Music', 'Rap', 'Rock', 'West Coast Rap'], 8))).toBe(AlbumType.ALBUM)
    })
})

describe('albumType: no album ends unknown because of its genre', () => {
    it.each([
        ['hip-hop with "Hardcore Rap"', HARDCORE_RAP],
        ['dancehall', ['Reggae', 'Music', 'Modern Dancehall']],
        ['rock', ROCK],
        ['no genre at all', []],
        ['a genre nobody listed', ['Zydeco']]
    ])('%s: a full-length album with no other mark is a studio album', (_, genres) => {
        expect(typeOf(catalogAlbum('Plain Title', genres, 12))).toBe(AlbumType.ALBUM)
        expect(typeOf(catalogAlbum('Plain Title', genres, 12), { aiList: ['Something Else'] })).toBe(AlbumType.ALBUM)
    })

    it('an album with no attributes at all is still answered', () => {
        expect(classifyAlbum({ title: 'Bare' })).toEqual(answer(AlbumType.ALBUM, TypeReason.DEFAULT_STUDIO))
        expect(classifyAlbum({})).toEqual(answer(AlbumType.ALBUM, TypeReason.DEFAULT_STUDIO))
    })
})

describe('albumType: what the catalog says comes first', () => {
    it('a single', () => {
        const single = catalogAlbum('The Heart Part 5 - Single', HIP_HOP, 1, { isSingle: true })
        expect(classifyAlbum(single)).toEqual(answer(AlbumType.SINGLE, TypeReason.CATALOG_SINGLE))
    })

    it('a compilation', () => {
        const compilation = catalogAlbum('Black Panther: The Album', HIP_HOP, 14, { isCompilation: true })
        expect(classifyAlbum(compilation)).toEqual(answer(AlbumType.COMPILATION, TypeReason.CATALOG_COMPILATION))
    })

    it('the type field and the live trait, when the catalog sends them', () => {
        expect(classifyAlbum(catalogAlbum('Four Songs', ROCK, 4, { albumType: 'EP' }))).toEqual(answer(AlbumType.EP, TypeReason.CATALOG_TYPE))
        expect(classifyAlbum(catalogAlbum('One Night', ROCK, 14, { contentTraits: ['live'] }))).toEqual(answer(AlbumType.LIVE, TypeReason.CATALOG_LIVE))
    })
})

describe('albumType: what the title says', () => {
    it.each([
        ['an EP', 'Sweet Sixteen - EP', AlbumType.EP, TypeReason.TITLE_EP],
        ['a single the catalog did not flag', 'Not Like Us - Single', AlbumType.SINGLE, TypeReason.TITLE_SINGLE],
        ['a live album', 'MTV Unplugged in New York', AlbumType.LIVE, TypeReason.TITLE_LIVE],
        ['a live album, in a note', 'Gold (Live At The Troubadour/1970)', AlbumType.LIVE, TypeReason.TITLE_LIVE],
        ['a live album, "Live in"', 'Live in Europe', AlbumType.LIVE, TypeReason.TITLE_LIVE],
        ['a live album, "Live In" after a colon', 'Look to the Rainbow: Live In Europe', AlbumType.LIVE, TypeReason.TITLE_LIVE],
        ['soundtracks, plural', 'Apollo: Atmospheres and Soundtracks', AlbumType.COMPILATION, TypeReason.TITLE_SOUNDTRACK],
        ['a compilation', 'Greatest Hits', AlbumType.COMPILATION, TypeReason.TITLE_COMPILATION],
        ['a compilation, "The Essential"', 'The Essential Billie Holiday', AlbumType.COMPILATION, TypeReason.TITLE_COMPILATION],
        ['a soundtrack', 'Purple Rain (Original Motion Picture Soundtrack)', AlbumType.COMPILATION, TypeReason.TITLE_SOUNDTRACK],
        ['a remix album', 'Reanimation (Remixes)', AlbumType.COMPILATION, TypeReason.TITLE_REMIX],
        ['a DJ mix', 'Fabric 15 (DJ Mix)', AlbumType.COMPILATION, TypeReason.TITLE_DJ_MIX],
        ['a loose "EP" in the title', 'The Fall EP (Remastered)', AlbumType.EP, TypeReason.TITLE_EP]
    ])('%s: «%s»', (_, title, type, reason) => {
        expect(classifyAlbum(catalogAlbum(title, ROCK, 10))).toEqual(answer(type, reason))
    })

    it.each([
        ['Everybody Scream', '"cream" inside a word'],
        ['Love Over Gold', '"gold" is a word of many studio albums'],
        ['Low-Life (Definitive)', 'an edition note'],
        ['Band on the Run (Archive Collection) [2010 Remaster]', '"collection" in an edition note'],
        ['Justice (The Complete Edition)', '"complete" in an edition note'],
        ['Beethoven: Violin Concerto', '"in concert" inside "Violin Concerto"'],
        ['Completely Well', '"complete" inside a word'],
        ['New Sensations', '"sensation" inside a word'],
        ['Deep Sleep', '"ep" inside words'],
        ['Singles Going Steady Forever', '"single" inside a word'],
        ['We Live In A Society', '"live in" as a verb'],
        ['Alive at Twenty-Five', '"live at" inside "Alive at"']
    ])('«%s» stays a studio album (%s)', (title) => {
        expect(typeOf(catalogAlbum(title, ROCK, 10))).toBe(AlbumType.ALBUM)
    })

    it('a DJ-mix brand name counts only for an electronic album', () => {
        expect(typeOf(catalogAlbum('Disraeli Gears - Cream Sessions', ROCK, 11))).toBe(AlbumType.ALBUM)
        expect(classifyAlbum(catalogAlbum('Cream Ibiza 2010', TRANCE, 30))).toEqual(answer(AlbumType.COMPILATION, TypeReason.TITLE_DJ_MIX))
        expect(typeOf(catalogAlbum('A State of Trance 550', TRANCE, 40))).toBe(AlbumType.COMPILATION)
    })

    it('a short non-electronic album stays an album: the track count alone says nothing there', () => {
        expect(typeOf(catalogAlbum('Close to the Edge', ['Rock', 'Music', 'Prog-Rock/Art Rock'], 3))).toBe(AlbumType.ALBUM)
    })
})

describe('albumType: an electronic artist', () => {
    const BLUEPRINT = catalogAlbum('Blueprint', TRANCE, 12)

    it('asks for the AI list', () => {
        expect(wantsAiList(BLUEPRINT)).toBe(true)
        expect(wantsAiList(catalogAlbum('DAMN.', HIP_HOP, 14))).toBe(false)
    })

    it('without the AI list (not asked yet, failed, or the AI has none): the same fallback as every genre', () => {
        expect(classifyAlbum(BLUEPRINT)).toEqual(answer(AlbumType.ALBUM, TypeReason.NO_AI_LIST))
        expect(classifyAlbum(BLUEPRINT, { aiList: null })).toEqual(answer(AlbumType.ALBUM, TypeReason.NO_AI_LIST))
        expect(classifyAlbum(BLUEPRINT, { aiList: [] })).toEqual(answer(AlbumType.ALBUM, TypeReason.NO_AI_LIST))
    })

    it('with the AI list: an album in it is a studio album', () => {
        expect(classifyAlbum(BLUEPRINT, { aiList: ['Right of Way', 'Blueprint'] })).toEqual(answer(AlbumType.ALBUM, TypeReason.AI_LIST))
        expect(typeOf(catalogAlbum('Blueprint (Deluxe Edition)', TRANCE, 20), { aiList: ['Blueprint'] })).toBe(AlbumType.ALBUM)
        expect(typeOf(catalogAlbum('L.E.F. (Loud, Electronic & Ferocious)', TRANCE, 15), { aiList: ['L.E.F.'] })).toBe(AlbumType.ALBUM)
    })

    it('with the AI list: a full-length album that is not in it is the one unknown there is', () => {
        expect(classifyAlbum(BLUEPRINT, { aiList: ['Right of Way'] })).toEqual(answer(AlbumType.UNKNOWN, TypeReason.NOT_IN_AI_LIST))
    })

    it('the track count decides the short ones, and the AI list does not undo it', () => {
        const three = catalogAlbum('Punk', TRANCE, 3)
        const five = catalogAlbum('Twice in a Blue Moon', TRANCE, 5)

        expect(classifyAlbum(three)).toEqual(answer(AlbumType.SINGLE, TypeReason.TRACK_COUNT))
        expect(classifyAlbum(five)).toEqual(answer(AlbumType.EP, TypeReason.TRACK_COUNT))
        expect(typeOf(five, { aiList: ['Twice in a Blue Moon'] })).toBe(AlbumType.EP)
    })

    it('the AI list rescues an album the catalog flagged as a compilation or a single', () => {
        const flagged = catalogAlbum('Right of Way', TRANCE, 13, { isCompilation: true })

        expect(typeOf(flagged)).toBe(AlbumType.COMPILATION)
        expect(classifyAlbum(flagged, { aiList: ['Right of Way'] })).toEqual(answer(AlbumType.ALBUM, TypeReason.AI_LIST))
    })

    it('the AI list never rescues another product with the same name', () => {
        const list = ['Blueprint', 'Hello World']

        expect(typeOf(catalogAlbum('Blueprint (Remixes)', TRANCE, 12), { aiList: list })).toBe(AlbumType.COMPILATION)
        expect(typeOf(catalogAlbum('Blueprint - Single', TRANCE, 2, { isSingle: true }), { aiList: list })).toBe(AlbumType.SINGLE)
        expect(typeOf(catalogAlbum('Blueprint (Live)', TRANCE, 12), { aiList: list })).toBe(AlbumType.LIVE)
        expect(typeOf(catalogAlbum('Club Blueprint', TRANCE, 12), { aiList: list })).toBe(AlbumType.UNKNOWN)
        // a numbered part is not the album of the same name
        expect(typeOf(catalogAlbum('Hello World 1', TRANCE, 8), { aiList: list })).toBe(AlbumType.UNKNOWN)
    })

    it('a word of the AI title inside another word is not a match', () => {
        expect(typeOf(catalogAlbum('Is There Anyone Out There', TRANCE, 12), { aiList: ['One'] })).toBe(AlbumType.UNKNOWN)
        expect(typeOf(catalogAlbum('Fireisland', TRANCE, 12), { aiList: ['Island', '.-.-.'] })).toBe(AlbumType.UNKNOWN)
    })
})
