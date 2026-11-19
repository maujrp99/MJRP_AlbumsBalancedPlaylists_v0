/**
 * albumType
 *
 * The one place that says what an album of a catalog is: a studio album, an EP, a single, a live
 * album, a compilation, or unknown (F57). Pure: it reads the album it is given and the AI list it
 * is given, asks nothing and remembers nothing.
 *
 * The rules, in order - the first that answers wins:
 *   1. what the catalog says (its type field, its live trait, `isSingle`, `isCompilation`);
 *   2. what the title says (live, DJ mix, "- Single", "- EP", remixes, compilation, soundtrack);
 *   3. for an electronic album only, the track count (up to 3 a single, up to 6 an EP);
 *   4. for an electronic album only, the AI list of the artist's studio albums, when there is one;
 *   5. otherwise it is a studio album.
 *
 * The genre never makes an album unknown. It only says whether the AI list is evidence: electronic
 * discographies are full of releases the catalog does not flag. The one unknown left is "electronic,
 * full length, the AI list came and does not have it".
 */

/** The type of an album. The values are the ones the screens already filter and count by. */
export const AlbumType = Object.freeze({
    ALBUM: 'Album',
    EP: 'EP',
    SINGLE: 'Single',
    LIVE: 'Live',
    COMPILATION: 'Compilation',
    UNKNOWN: 'Uncategorized'
})

export const ALBUM_TYPES = Object.freeze(Object.values(AlbumType))

/** Why an album has its type: the rule that answered. A closed list. */
export const TypeReason = Object.freeze({
    CATALOG_TYPE: 'catalog-type',
    CATALOG_LIVE: 'catalog-live',
    CATALOG_SINGLE: 'catalog-single',
    CATALOG_COMPILATION: 'catalog-compilation',
    TITLE_LIVE: 'title-live',
    TITLE_DJ_MIX: 'title-dj-mix',
    TITLE_SINGLE: 'title-single',
    TITLE_EP: 'title-ep',
    TITLE_REMIX: 'title-remix',
    TITLE_COMPILATION: 'title-compilation',
    TITLE_SOUNDTRACK: 'title-soundtrack',
    TRACK_COUNT: 'electronic-track-count',
    AI_LIST: 'ai-list',
    NOT_IN_AI_LIST: 'electronic-not-in-ai-list',
    NO_AI_LIST: 'electronic-no-ai-list',
    DEFAULT_STUDIO: 'default-studio'
})

// ---------------------------------------------------------------------------------------------
// Words
// ---------------------------------------------------------------------------------------------

const WORD_CHAR = '[\\p{L}\\p{N}]'
const escapeForPattern = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** A pattern that finds any of the phrases as whole words: "cream" is not found in "Scream". */
const wholeWords = (phrases) => new RegExp(`(?<!${WORD_CHAR})(?:${phrases.map(escapeForPattern).join('|')})(?!${WORD_CHAR})`, 'iu')

/** The title without its notes in brackets: "Low-Life (Definitive) [2019 Remaster]" -> "Low-Life". */
const withoutNotes = (title) => title.replace(/\(.*?\)|\[.*?\]/g, ' ').replace(/\s+/g, ' ').trim()

/** The words of a text, lower case, punctuation gone. */
const wordsOf = (text) => String(text || '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').split(/\s+/).filter(Boolean)

// ---------------------------------------------------------------------------------------------
// Genres
// ---------------------------------------------------------------------------------------------

/**
 * The genre names that make an album electronic. A genre counts only as a whole name, or as a
 * whole side of a "/" ("Jungle/Drum'n'bass"): "Hardcore Rap" is not "Hardcore".
 */
const ELECTRONIC_GENRES = new Set([
    'electronic', 'electronica', 'dance', 'edm', 'eletrônica', 'electrónica',
    'house', 'deep house', 'progressive house', 'tech house', 'electro house', 'acid house',
    'chicago house', 'disco house', 'funky house', 'latin house', 'tribal house', 'afro house',
    'techno', 'detroit techno', 'minimal techno', 'melodic techno', 'industrial techno',
    'trance', 'progressive trance', 'uplifting trance', 'vocal trance', 'psytrance', 'goa trance',
    'dubstep', 'brostep', 'drum and bass', 'drum n bass', "drum'n'bass", 'jungle', 'breakbeat', 'bass', 'bass music',
    'ambient', 'downtempo', 'chillout', 'lounge', 'chillwave',
    'uk garage', '2-step', 'garage',
    'synthwave', 'retrowave', 'synthpop', 'electropop',
    'idm', 'intelligent dance music', 'big room', 'future bass',
    'hardstyle', 'hardcore', 'gabber', 'happy hardcore',
    'eurodance', 'eurobeat', 'hi-nrg'
])

const isElectronicGenre = (name) => {
    const genre = String(name || '').toLowerCase().trim()
    return ELECTRONIC_GENRES.has(genre) || genre.split('/').some(side => ELECTRONIC_GENRES.has(side.trim()))
}

/**
 * @param {string[]} genreNames - as the catalog gives them
 * @returns {boolean} true when one of them is an electronic genre
 */
export function isElectronic(genreNames) {
    return Array.isArray(genreNames) && genreNames.some(isElectronicGenre)
}

// ---------------------------------------------------------------------------------------------
// What is read from the album
// ---------------------------------------------------------------------------------------------

/**
 * The facts the rules read, taken once from a catalog album.
 * @param {Object} album - { title, trackCount, raw: { attributes: { genreNames, isSingle, isCompilation, ... } } }
 */
function factsOf(album = {}) {
    const attributes = album.raw?.attributes || {}
    const title = String(album.title || attributes.name || '')
    const traits = Array.isArray(attributes.contentTraits) ? attributes.contentTraits : []
    return {
        title,
        baseTitle: withoutNotes(title),
        catalogType: String(attributes.albumType || '').toLowerCase(),
        liveTrait: traits.includes('live'),
        isSingle: attributes.isSingle === true,
        isCompilation: attributes.isCompilation === true,
        trackCount: Number(album.trackCount || attributes.trackCount) || 0,
        electronic: isElectronic(attributes.genreNames)
    }
}

const answer = (type, reason) => ({ type, reason })

// ---------------------------------------------------------------------------------------------
// Rule 1 - what the catalog says
// ---------------------------------------------------------------------------------------------

const TYPE_OF_CATALOG_TYPE = Object.freeze({ ep: AlbumType.EP, single: AlbumType.SINGLE, compilation: AlbumType.COMPILATION })

function catalogSays(facts) {
    const named = TYPE_OF_CATALOG_TYPE[facts.catalogType]
    if (named) return answer(named, TypeReason.CATALOG_TYPE)
    if (facts.liveTrait) return answer(AlbumType.LIVE, TypeReason.CATALOG_LIVE)
    if (facts.isSingle) return answer(AlbumType.SINGLE, TypeReason.CATALOG_SINGLE)
    if (facts.isCompilation) return answer(AlbumType.COMPILATION, TypeReason.CATALOG_COMPILATION)
    return null
}

// ---------------------------------------------------------------------------------------------
// Rule 2 - what the title says
// ---------------------------------------------------------------------------------------------

const LIVE = wholeWords(['live at', 'live from', 'unplugged', 'in concert', 'concert live', 'tour edition', 'tour live', 'live session', 'live sessions'])
// "(Live ...)" as a note
const LIVE_NOTE = /[([]\s*live(?![\p{L}\p{N}])/iu
// "Live in" opens the title or a part of it ("Rainbow: Live In Europe"); inside a sentence it is a verb ("We Live In A Society")
const LIVE_IN = /(?:^|[:!.,–—-]\s*)live in(?![\p{L}\p{N}])/iu
const isLiveTitle = (facts) => LIVE.test(facts.title) || LIVE_NOTE.test(facts.title) || LIVE_IN.test(facts.title)
const DJ_MIX = wholeWords(['dj mix', 'continuous mix', 'mixed by', 'nonstop mix', 'megamix', 'in the mix'])
// Names of DJ-mix series: they mean a mix only in an electronic discography ("Cream" is also a band)
const DJ_MIX_SERIES = wholeWords([
    'ministry of sound', 'trance nation', 'in search of sunrise', 'gatecrasher', 'cream', 'godskitchen',
    'sensation', 'anjunabeats worldwide', "corsten's countdown", 'ultra music festival',
    'electric daisy carnival', 'tomorrowland mix', 'dreamstate'
])
const DJ_MIX_EPISODE = /^(group therapy|asot|a state of trance|pure trance|corsten's countdown)\s*\d+/i
const SINGLE_MARK = /-\s*single(?![\p{L}\p{N}])|[([]single[)\]]|\ssingle$/iu
const EP_MARK = /-\s*ep(?![\p{L}\p{N}])|[([]ep[)\]]|\sep$/iu
const REMIX = wholeWords(['remix', 'remixes', 'remixed'])
// Said anywhere in the title, these mean a compilation
const COMPILATION = wholeWords(['best of', 'greatest hits', 'anthology', 'retrospective', 'sampler', 'listening to'])
// These mean it only outside an edition note: "(Archive Collection)" is an edition of a studio album
const COMPILATION_IN_BASE_TITLE = wholeWords(['collection', 'essential', 'essentials', 'the complete', 'classics'])
const SOUNDTRACK = wholeWords(['soundtrack', 'soundtracks', 'ost', 'motion picture', 'original score', 'film score', 'film scores'])
const SINGLE_WORD = wholeWords(['single'])
const EP_WORD = wholeWords(['ep'])

const isDjMix = (facts) => DJ_MIX.test(facts.title) || (facts.electronic && (DJ_MIX_SERIES.test(facts.title) || DJ_MIX_EPISODE.test(facts.title)))
const isCompilationTitle = (facts) => COMPILATION.test(facts.title) || COMPILATION_IN_BASE_TITLE.test(facts.baseTitle)

/** In order: the first title rule that holds answers. */
const TITLE_RULES = Object.freeze([
    [isLiveTitle, AlbumType.LIVE, TypeReason.TITLE_LIVE],
    [isDjMix, AlbumType.COMPILATION, TypeReason.TITLE_DJ_MIX],
    [(facts) => SINGLE_MARK.test(facts.title), AlbumType.SINGLE, TypeReason.TITLE_SINGLE],
    [(facts) => EP_MARK.test(facts.title), AlbumType.EP, TypeReason.TITLE_EP],
    [(facts) => REMIX.test(facts.title), AlbumType.COMPILATION, TypeReason.TITLE_REMIX],
    [isCompilationTitle, AlbumType.COMPILATION, TypeReason.TITLE_COMPILATION],
    [(facts) => SOUNDTRACK.test(facts.title), AlbumType.COMPILATION, TypeReason.TITLE_SOUNDTRACK],
    [(facts) => EP_WORD.test(facts.title), AlbumType.EP, TypeReason.TITLE_EP],
    [(facts) => SINGLE_WORD.test(facts.title), AlbumType.SINGLE, TypeReason.TITLE_SINGLE]
])

function titleSays(facts) {
    const rule = TITLE_RULES.find(([holds]) => holds(facts))
    return rule ? answer(rule[1], rule[2]) : null
}

// ---------------------------------------------------------------------------------------------
// Rule 3 - the track count, for an electronic album
// ---------------------------------------------------------------------------------------------

function trackCountSays(facts) {
    if (!facts.electronic || facts.trackCount < 1) return null
    if (facts.trackCount <= 3) return answer(AlbumType.SINGLE, TypeReason.TRACK_COUNT)
    if (facts.trackCount <= 6) return answer(AlbumType.EP, TypeReason.TRACK_COUNT)
    return null
}

// ---------------------------------------------------------------------------------------------
// Rule 4 - the AI list of studio albums, for an electronic album
// ---------------------------------------------------------------------------------------------

/** Words that make a release another product than the studio album of the same name. */
const OTHER_PRODUCT_WORDS = new Set([
    'single', 'ep', 'remix', 'remixes', 'remixed', 'mix', 'live', 'concert', 'presents', 'vol', 'volume',
    'compilation', 'collection', 'anthology', 'best', 'sampler', 'club'
])
const EDITION_WORDS = /deluxe|remaster(?:ed)?|edition|expanded|version|anniversary/gi
const isNumber = (word) => /^\d+$/.test(word)

/** The title as two releases of the same album share it: no notes, no edition words, no punctuation. */
const sameAlbumKey = (title) => withoutNotes(String(title || '')).toLowerCase().replace(EDITION_WORDS, '').replace(/[^\p{L}\p{N}]/gu, '')

/** True when the album title has a word that makes it another product, and the listed title does not. */
function isAnotherProduct(albumWords, listedWords) {
    return albumWords.some(word => OTHER_PRODUCT_WORDS.has(word) && !listedWords.includes(word))
}

/**
 * True when the listed title names this album: the same title, or every word of the listed title
 * in the album title with no number left over ("Hello World 1" is not "Hello World").
 */
function namesTheAlbum(facts, listedTitle) {
    const listedKey = sameAlbumKey(listedTitle)
    if (listedKey.length < 2) return false
    if (listedKey === sameAlbumKey(facts.title)) return true

    const albumWords = wordsOf(facts.baseTitle)
    const listedWords = wordsOf(withoutNotes(String(listedTitle)))
    const leftOver = albumWords.filter(word => !listedWords.includes(word))
    return listedWords.every(word => albumWords.includes(word)) && !leftOver.some(isNumber)
}

/** True when the AI list has this album as a studio album. */
function isInAiList(facts, aiList) {
    const albumWords = wordsOf(facts.title)
    return aiList.some(listedTitle => namesTheAlbum(facts, listedTitle) && !isAnotherProduct(albumWords, wordsOf(listedTitle)))
}

/**
 * @param {Object} facts
 * @param {string[]} aiList - known and not empty
 * @param {{ type: string, reason: string }|null} soFar - what the rules before answered
 */
function aiListSays(facts, aiList, soFar) {
    if (soFar?.reason === TypeReason.TRACK_COUNT) return soFar
    if (isInAiList(facts, aiList)) return answer(AlbumType.ALBUM, TypeReason.AI_LIST)
    return soFar || answer(AlbumType.UNKNOWN, TypeReason.NOT_IN_AI_LIST)
}

// ---------------------------------------------------------------------------------------------
// The classifier
// ---------------------------------------------------------------------------------------------

/**
 * True when the AI list of the artist's studio albums is evidence for this album: the caller asks
 * for the list (a paid ask) only when an album of the scan wants it.
 * @param {Object} album - a catalog album
 */
export function wantsAiList(album) {
    return factsOf(album).electronic
}

/**
 * The type of a catalog album, and the rule that said it.
 * @param {Object} album - { title, trackCount, raw: { attributes } } as the catalog adapter gives it
 * @param {{ aiList?: string[]|null }} [context] - the AI list of the artist's studio albums; null,
 *        missing or empty when it is not known (not asked yet, failed, or the AI has none)
 * @returns {{ type: string, reason: string }} a type of AlbumType and a reason of TypeReason
 */
export function classifyAlbum(album, { aiList = null } = {}) {
    const facts = factsOf(album)
    const soFar = catalogSays(facts) || titleSays(facts) || trackCountSays(facts)
    if (!facts.electronic) return soFar || answer(AlbumType.ALBUM, TypeReason.DEFAULT_STUDIO)

    const listKnown = Array.isArray(aiList) && aiList.length > 0
    if (listKnown) return aiListSays(facts, aiList, soFar)
    return soFar || answer(AlbumType.ALBUM, TypeReason.NO_AI_LIST)
}
