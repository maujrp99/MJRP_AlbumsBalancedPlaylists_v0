/**
 * albumIdentity - the ONE rule that says "this is the album that was asked for" (F55, UAT-184).
 *
 * Pure: no network, no DOM, no project import. The app imports it (`@shared/albumIdentity.js`) and
 * the server loads it (`server/lib/albumIdentity.js`), so both decide with the same code. Every
 * place that receives candidates from a source (Apple Music, Spotify, BestEverAlbums, the local
 * dataset, the AI answer) turns its data into { artist, title, year? } and asks here.
 *
 * THE RULE
 * 1. The TITLE has to match on its own. Both titles are normalized (below) and compared whole:
 *    one title containing the other is not a match ("Core" is not "Core Memories").
 * 2. The ARTIST has to match, normalized the same way. A query with no artist has nothing to
 *    compare, so only the title decides; a candidate with no artist never passes a query that has one.
 * 3. The YEAR never rejects (a reissue carries another year). It only orders the candidates that
 *    already passed, in pickAlbum.
 * 4. No candidate passes: the answer is "not found". There is no "closest album of the artist".
 *
 * NORMALIZATION (titles and artists): accents out, lower case, apostrophes out, "&" read as "and",
 * every other punctuation is a word break, a leading "The" is dropped, "Volume" is "Vol" and "Part"
 * is "Pt"; the words are then joined, so "AC/DC" is "ACDC". In an artist, "+" is "and" too and the
 * "and" between names is dropped ("Robert Plant & Alison Krauss" is "Robert Plant, Alison Krauss").
 * Roman and arabic numbers are NOT made equal: "IV" is not "4".
 *
 * EDITION NOTES are dropped from a title before comparing; whatever is not an edition note stays:
 * - a group in (), [] or {} that is one year alone ("(2017)"), one platform tag alone ("(Live)",
 *   "(Explicit)"), or that has an edition word ("(Deluxe Edition)", "(Remastered 2011)",
 *   "[Expanded]", "(Super Deluxe)", "(Nicene Creedence Ed.)");
 * - a subtitle after ":" or " - " under the same test ("- Remastered", "- EP", ": Deluxe Edition").
 * THE SUBTITLE DECISION: a subtitle that is not an edition note is part of the title, in both
 * directions. "Brighten the Corners: Nicene Creedence Ed." is "Brighten the Corners"; "The Wall:
 * Live in Berlin" is not "The Wall", and "Unreal Unearth: Unheard" is not "Unreal Unearth".
 * Known cost: an album whose catalog title carries a non-edition qualifier ("Weezer (Blue Album)",
 * "(Original Motion Picture Soundtrack)") is not found from the bare title; it has to be asked for
 * as the catalog writes it, which is what a picked album stores.
 */

export const Verdict = Object.freeze({ SAME: 'same', DIFFERENT: 'different' })

export const Reason = Object.freeze({
    /** The whole titles are equal after normalization. */
    EXACT_TITLE: 'exact-title',
    /** The titles are equal once the edition notes are dropped. */
    EDITION_OF_TITLE: 'edition-of-title',
    /** The query has no artist and its text is "artist title" of the candidate. */
    ARTIST_AND_TITLE_IN_ONE_TEXT: 'artist-and-title-in-one-text',
    TITLE_MISSING: 'title-missing',
    TITLE_MISMATCH: 'title-mismatch',
    ARTIST_MISMATCH: 'artist-mismatch'
})

const EDITION_WORDS = new Set([
    'deluxe', 'edition', 'editions', 'remaster', 'remastered', 'remasters', 'remastering', 'expanded',
    'anniversary', 'version', 'reissue', 'reissued', 'bonus', 'mono', 'stereo', 'mix', 'collector',
    'collectors', 'legacy'
])
/** Edition words only as the last word of the note: "Nicene Creedence Ed." */
const EDITION_ABBREVIATIONS = new Set(['ed', 'edn'])
/** A tag the catalogs append; an edition note only when it is the whole note. */
const PLATFORM_TAGS = new Set(['live', 'ep', 'single', 'explicit', 'clean'])
const SAME_WORD = Object.freeze({ volume: 'vol', part: 'pt' })

const DIACRITICS = /[̀-ͯ]/g
const APOSTROPHES = /['’‘`´]/g
const NOT_A_WORD = /[^\p{L}\p{N}]+/gu
const INNERMOST_GROUP = /[([{]([^()[\]{}]*)[)\]}]/g
const SUBTITLE_SEPARATOR = /:\s+|\s+[-–—]\s+/g
const YEAR = /^(19|20)\d{2}$/

const SAME = (reason) => Object.freeze({ verdict: Verdict.SAME, same: true, reason })
const DIFFERENT = (reason) => Object.freeze({ verdict: Verdict.DIFFERENT, same: false, reason })

/** The words of a text: accents out, lower case, "&" as "and", punctuation as a break. */
function wordsOf(text, { plusIsAnd = false } = {}) {
    return String(text ?? '')
        .normalize('NFD').replace(DIACRITICS, '')
        .toLowerCase()
        .replace(APOSTROPHES, '')
        .replace(plusIsAnd ? /[&+]/g : /&/g, ' and ')
        .replace(NOT_A_WORD, ' ')
        .trim()
        .split(' ')
        .filter(Boolean)
        .map(word => SAME_WORD[word] || word)
}

const withoutLeadingThe = (words) => (words.length > 1 && words[0] === 'the' ? words.slice(1) : words)

/** The text made only of symbols ("÷") has no words: it is compared as it is. */
const symbolsOf = (text) => String(text ?? '').toLowerCase().replace(/\s+/g, '')

function titleKey(title) {
    return withoutLeadingThe(wordsOf(title)).join('') || symbolsOf(title)
}

function artistKey(artist) {
    const words = withoutLeadingThe(wordsOf(artist, { plusIsAnd: true }))
    const names = words.filter(word => word !== 'and')
    return (names.length > 0 ? names : words).join('') || symbolsOf(artist)
}

function isEditionNote(note, { aloneYearCounts }) {
    const words = wordsOf(note)
    if (words.length === 0) return true
    if (words.length === 1) {
        if (PLATFORM_TAGS.has(words[0])) return true
        if (aloneYearCounts && YEAR.test(words[0])) return true
    }
    return words.some(word => EDITION_WORDS.has(word)) || EDITION_ABBREVIATIONS.has(words[words.length - 1])
}

/** Drops the groups in (), [] and {} that are edition notes, the innermost first. */
function withoutEditionGroups(title) {
    let text = title
    for (let pass = 0; pass < 3; pass++) {
        const next = text.replace(INNERMOST_GROUP, (group, inside) =>
            (isEditionNote(inside, { aloneYearCounts: true }) ? ' ' : group))
        if (next === text) break
        text = next
    }
    return text
}

/** Drops, from the end, each subtitle after ":" or " - " that is an edition note. */
function withoutEditionSubtitles(title) {
    let text = title
    for (;;) {
        const last = [...text.matchAll(SUBTITLE_SEPARATOR)].pop()
        if (!last || last.index === 0) return text
        const subtitle = text.slice(last.index + last[0].length)
        if (!isEditionNote(subtitle, { aloneYearCounts: false })) return text
        text = text.slice(0, last.index)
    }
}

/**
 * The two forms a title is compared in.
 * @returns {{ whole: string, core: string }} `whole` keeps the edition notes, `core` drops them
 */
function titleForms(title) {
    const text = String(title ?? '')
    const whole = titleKey(text)
    const core = titleKey(withoutEditionSubtitles(withoutEditionGroups(text)))
    return { whole, core: core || whole }
}

/** A query typed as one text ("The Beatles Abbey Road") against the candidate's artist and title. */
function isArtistAndTitleInOneText(askedTitle, candidate, candidateTitle) {
    const artist = artistKey(candidate.artist)
    if (!artist) return false
    const asked = withoutLeadingThe(wordsOf(askedTitle)).join('')
    return asked === artist + candidateTitle.core || asked === candidateTitle.core + artist
}

function compareTitles(asked, candidate) {
    const askedTitle = titleForms(asked.title)
    const candidateTitle = titleForms(candidate.title)
    if (!askedTitle.core || !candidateTitle.core) return DIFFERENT(Reason.TITLE_MISSING)
    if (askedTitle.core === candidateTitle.core) {
        return SAME(askedTitle.whole === candidateTitle.whole ? Reason.EXACT_TITLE : Reason.EDITION_OF_TITLE)
    }
    if (!artistKey(asked.artist) && isArtistAndTitleInOneText(asked.title, candidate, candidateTitle)) {
        return SAME(Reason.ARTIST_AND_TITLE_IN_ONE_TEXT)
    }
    return DIFFERENT(Reason.TITLE_MISMATCH)
}

/**
 * Is the candidate the album that was asked for?
 * @param {{ artist?: string, title: string, year?: number|string }} asked
 * @param {{ artist?: string, title: string, year?: number|string }} candidate
 * @returns {{ verdict: 'same'|'different', same: boolean, reason: string }} reason is one of Reason
 */
export function compareAlbumIdentity(asked, candidate) {
    const wanted = asked || {}
    const offered = candidate || {}
    const title = compareTitles(wanted, offered)
    if (!title.same) return title

    const wantedArtist = artistKey(wanted.artist)
    if (wantedArtist && wantedArtist !== artistKey(offered.artist)) return DIFFERENT(Reason.ARTIST_MISMATCH)
    return title
}

/**
 * Are the two names the same artist, by the artist part of the rule? For a source that lists
 * artists (the artist's page of BestEverAlbums). An empty name is never the same as anything.
 * @param {string} asked
 * @param {string} candidate
 * @returns {boolean}
 */
export function sameArtist(asked, candidate) {
    const wanted = artistKey(asked)
    return wanted !== '' && wanted === artistKey(candidate)
}

/** @returns {number|null} the first four-digit year in a number, "1992" or "1992-09-29" */
function yearOf(value) {
    const found = String(value ?? '').match(/\d{4}/)
    return found ? Number(found[0]) : null
}

function yearGap(askedYear, candidateYear) {
    if (askedYear === null) return 0
    return candidateYear === null ? Infinity : Math.abs(askedYear - candidateYear)
}

const NOT_FOUND = Object.freeze({ found: false, candidate: null, index: -1, verdict: null })

/** The best reading of one candidate: [verdict, year], or null when no reading passes. */
function bestReading(asked, readings) {
    let best = null
    for (const reading of readings) {
        const verdict = compareAlbumIdentity(asked, reading)
        if (!verdict.same) continue
        if (verdict.reason !== Reason.EDITION_OF_TITLE) return { verdict, year: yearOf(reading?.year) }
        best = best || { verdict, year: yearOf(reading?.year) }
    }
    return best
}

/** Compares two ranks, position by position: the smaller one comes first. */
function comesBefore(rank, other) {
    const at = rank.findIndex((value, i) => value !== other[i])
    return at !== -1 && rank[at] < other[at]
}

/**
 * The candidate that is the album asked for, or none.
 * Among the candidates that pass: the exact title before an edition, then the year nearest to
 * the year asked for (when the query has one), then the order the source gave.
 *
 * @param {{ artist?: string, title: string, year?: number|string }} asked
 * @param {Array} candidates - as the source gave them
 * @param {Function} [read] - (candidate) => { artist, title, year? }, or a list of them when the
 *        source's text can be read in more than one way (see albumFromLabel)
 * @returns {{ found: boolean, candidate: *, index: number, verdict: Object|null }}
 */
export function pickAlbum(asked, candidates, read = (candidate) => candidate) {
    const askedYear = yearOf(asked?.year)
    let best = null
    ;(candidates || []).forEach((candidate, index) => {
        const passed = bestReading(asked, [].concat(read(candidate) ?? []))
        if (!passed) return
        const rank = [passed.verdict.reason === Reason.EDITION_OF_TITLE ? 1 : 0, yearGap(askedYear, passed.year), index]
        if (!best || comesBefore(rank, best.rank)) best = { candidate, index, verdict: passed.verdict, rank }
    })
    return best ? { found: true, candidate: best.candidate, index: best.index, verdict: best.verdict } : NOT_FOUND
}

/**
 * Every way a label "Title by Artist" can be read (BestEverAlbums writes its results so). A title
 * can have " by " inside ("Stand by Me by Ben E. King"), so each " by " is tried as the separator;
 * a label with none (an artist's page, a forum post) has no reading.
 * @param {string} label
 * @returns {Array<{ title: string, artist: string }>}
 */
export function albumFromLabel(label) {
    const text = String(label ?? '').trim()
    return [...text.matchAll(/\s+by\s+/gi)].map(separator => ({
        title: text.slice(0, separator.index).trim(),
        artist: text.slice(separator.index + separator[0].length).trim()
    })).filter(reading => reading.title && reading.artist)
}
