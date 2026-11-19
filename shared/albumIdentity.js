/**
 * albumIdentity - the ONE rule that says "this is the album that was asked for" (F55, UAT-184).
 *
 * Pure: no network, no DOM, no project import. The app imports it (`@shared/albumIdentity.js`) and
 * the server loads it (`server/lib/albumIdentity.js`), so both decide with the same code. Every
 * place that receives candidates from a source (Apple Music, Spotify, BestEverAlbums, the local
 * dataset, the AI answer) turns its data into { artist, title, year? } and asks here.
 *
 * THE RULE, IN TWO TIERS. The second tier never competes with the first.
 *
 * FIRST TIER - "it is the album": compareAlbumIdentity answers `same`.
 * 1. The TITLE has to match on its own. Both titles are normalized (below) and compared whole:
 *    one title containing the other is not a match ("Core" is not "Core Memories").
 * 2. The ARTIST has to match, normalized the same way. A query with no artist has nothing to
 *    compare, so only the title decides; a candidate with no artist never passes a query that has one.
 * 3. The YEAR never rejects (a reissue carries another year). It only orders the candidates that
 *    already passed, in pickAlbum.
 *
 * SECOND TIER - "it is the album only if the source has nothing better": compareAlbumIdentity
 * answers `same-if-alone` (and `same: false`: one comparison cannot know what else the source has).
 * 4. The title ASKED FOR is the candidate's title before a subtitle separator (":" or " - "), and
 *    the artist matches. "No Quarter" asked for, and the catalog only has "No Quarter: Jimmy Page &
 *    Robert Plant Unledded" (the owner's case and decision, 2026-11-19).
 *    One direction only: the title asked for is the short one. "The Wall: Live in Berlin" asked
 *    for is never "The Wall". A query with no artist has no second tier.
 *
 * WHO TURNS THE SECOND TIER INTO "SAME": only pickAlbum, which sees every candidate.
 * 5. If any candidate passes the first tier, the pick is among those; the second tier is not looked at.
 * 6. Otherwise, if the candidates of the second tier are all ONE album (the same title once the
 *    edition notes are dropped), that album is picked, with the reason `title-before-subtitle`.
 *    Two different albums ("Greatest Hits: 1970-2002", "Greatest Hits: Vol 2") is "not found":
 *    choosing between them is the person's.
 * 7. No candidate passes: the answer is "not found". There is no "closest album of the artist".
 * An album that is KEPT (a cache record, the album on screen) has no candidates beside it:
 * compareKeptAlbum believes the second tier only when the album carries the reason pickAlbum gave.
 *
 * EXAMPLES (asked for -> candidates -> answer)
 *   "The Wall" -> ["The Wall", "The Wall: Live in Berlin"]   -> "The Wall" (exact-title)
 *   "The Wall" -> ["The Wall: Live in Berlin"]               -> it, flagged (title-before-subtitle)
 *   "The Wall: Live in Berlin" -> ["The Wall"]               -> not found
 *   "Greatest Hits" -> ["Greatest Hits: 1970-2002", "Greatest Hits: Vol 2"] -> not found
 *   "Core" -> ["Core Memories", "Shangri-La Dee Da"]         -> not found
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
 * A subtitle that is not an edition note is part of the title: "Brighten the Corners: Nicene
 * Creedence Ed." is "Brighten the Corners" in the first tier; "The Wall: Live in Berlin" reaches
 * "The Wall" only through the second tier.
 * Known cost: a qualifier in parentheses that is not an edition ("Weezer (Blue Album)",
 * "(Original Motion Picture Soundtrack)") is part of the title in both tiers: the album is not
 * found from the bare title; it has to be asked for as the catalog writes it, which is what a
 * picked album stores.
 */

export const Verdict = Object.freeze({
    SAME: 'same',
    /** Second tier: the same album only if pickAlbum finds no first-tier candidate and no other album like it. */
    SAME_IF_ALONE: 'same-if-alone',
    DIFFERENT: 'different'
})

export const Reason = Object.freeze({
    /** The whole titles are equal after normalization. */
    EXACT_TITLE: 'exact-title',
    /** The titles are equal once the edition notes are dropped. */
    EDITION_OF_TITLE: 'edition-of-title',
    /** The query has no artist and its text is "artist title" of the candidate. */
    ARTIST_AND_TITLE_IN_ONE_TEXT: 'artist-and-title-in-one-text',
    /** Second tier: the title asked for is the candidate's title before a subtitle. */
    TITLE_BEFORE_SUBTITLE: 'title-before-subtitle',
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
const SAME_IF_ALONE = (reason) => Object.freeze({ verdict: Verdict.SAME_IF_ALONE, same: false, reason })
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

/** The title a text has before each of its subtitle separators: "A: B - C" has "A" and "A: B". */
function titlesBeforeSubtitle(title) {
    const text = withoutEditionSubtitles(withoutEditionGroups(String(title ?? '')))
    return [...text.matchAll(SUBTITLE_SEPARATOR)]
        .filter(separator => separator.index > 0)
        .map(separator => titleKey(text.slice(0, separator.index)))
}

/** The verdict of the titles alone; the artist is checked after it, in compareAlbumIdentity. */
function compareTitles(asked, candidate) {
    const askedTitle = titleForms(asked.title)
    const candidateTitle = titleForms(candidate.title)
    if (!askedTitle.core || !candidateTitle.core) return DIFFERENT(Reason.TITLE_MISSING)
    if (askedTitle.core === candidateTitle.core) {
        return SAME(askedTitle.whole === candidateTitle.whole ? Reason.EXACT_TITLE : Reason.EDITION_OF_TITLE)
    }
    return artistKey(asked.artist)
        ? compareTitlesSecondTier(askedTitle, candidate)
        : compareOneTextQuery(asked, candidate, candidateTitle)
}

/** The query has an artist and the titles differ: only the second tier is left. */
function compareTitlesSecondTier(askedTitle, candidate) {
    return titlesBeforeSubtitle(candidate.title).includes(askedTitle.core)
        ? SAME_IF_ALONE(Reason.TITLE_BEFORE_SUBTITLE)
        : DIFFERENT(Reason.TITLE_MISMATCH)
}

/** The query has no artist and the titles differ: its text may be "artist title" of the candidate. */
function compareOneTextQuery(asked, candidate, candidateTitle) {
    return isArtistAndTitleInOneText(asked.title, candidate, candidateTitle)
        ? SAME(Reason.ARTIST_AND_TITLE_IN_ONE_TEXT)
        : DIFFERENT(Reason.TITLE_MISMATCH)
}

/**
 * Is the candidate the album that was asked for? One comparison, with nothing else in sight.
 * @param {{ artist?: string, title: string, year?: number|string }} asked
 * @param {{ artist?: string, title: string, year?: number|string }} candidate
 * @returns {{ verdict: 'same'|'same-if-alone'|'different', same: boolean, reason: string }}
 *          reason is one of Reason; `same` is true only for the verdict 'same'
 */
export function compareAlbumIdentity(asked, candidate) {
    const wanted = asked || {}
    const offered = candidate || {}
    const title = compareTitles(wanted, offered)
    if (title.verdict === Verdict.DIFFERENT) return title

    const wantedArtist = artistKey(wanted.artist)
    if (wantedArtist && wantedArtist !== artistKey(offered.artist)) return DIFFERENT(Reason.ARTIST_MISMATCH)
    return title
}

/**
 * Is the album that is KEPT for a query (a cache record, the album on screen) still the album
 * asked for? A kept album has no candidates beside it, so the second tier cannot be decided again
 * here: it is believed only when the album carries the reason pickAlbum accepted it by.
 * @param {{ artist?: string, title: string }} asked
 * @param {{ artist?: string, title: string, identityReason?: string }} kept
 * @returns {{ verdict: string, same: boolean, reason: string }} as compareAlbumIdentity
 */
export function compareKeptAlbum(asked, kept) {
    const verdict = compareAlbumIdentity(asked, kept)
    const acceptedAlone = verdict.verdict === Verdict.SAME_IF_ALONE && kept?.identityReason === verdict.reason
    return acceptedAlone ? SAME(verdict.reason) : verdict
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
const FIRST_TIER = 1
const SECOND_TIER = 2

/**
 * How one reading of a candidate answers the query, or null when it is another album.
 * `rank` orders the readings that pass, the smaller first: the tier, the plain album before an
 * edition of it, the year nearest to the year asked for. `album` is the title without edition
 * notes: two readings with the same `album` are listings of one album.
 */
function readingOf(asked, askedYear, reading) {
    const verdict = compareAlbumIdentity(asked, reading)
    if (verdict.verdict === Verdict.DIFFERENT) return null

    const title = titleForms(reading?.title)
    const anEdition = verdict.same ? verdict.reason === Reason.EDITION_OF_TITLE : title.whole !== title.core
    const rank = [verdict.same ? FIRST_TIER : SECOND_TIER, anEdition ? 1 : 0, yearGap(askedYear, yearOf(reading?.year))]
    return { verdict, album: title.core, rank }
}

/** Compares two ranks, position by position: the smaller one comes first. */
function comesBefore(rank, other) {
    const at = rank.findIndex((value, i) => value !== other[i])
    return at !== -1 && rank[at] < other[at]
}

/** @returns the item whose rank comes first, or null for an empty list */
const firstInRank = (items) => items.reduce((best, item) => (best && !comesBefore(item.rank, best.rank) ? best : item), null)

/**
 * The candidate that is the album asked for, or none.
 * Order among the candidates that pass: the first tier before the second; the exact title before
 * an edition; the year nearest to the year asked for (when the query has one); the order the
 * source gave. A pick of the second tier needs every second-tier candidate to be the one album.
 *
 * @param {{ artist?: string, title: string, year?: number|string }} asked
 * @param {Array} candidates - as the source gave them
 * @param {Function} [read] - (candidate) => { artist, title, year? }, or a list of them when the
 *        source's text can be read in more than one way (see albumFromLabel)
 * @returns {{ found: boolean, candidate: *, index: number, verdict: Object|null }} the verdict of a
 *          found album is always `same`; its reason says how (`title-before-subtitle`: second tier)
 */
export function pickAlbum(asked, candidates, read = (candidate) => candidate) {
    const askedYear = yearOf(asked?.year)
    const passed = []
    ;(candidates || []).forEach((candidate, index) => {
        const readings = [].concat(read(candidate) ?? []).map(reading => readingOf(asked, askedYear, reading))
        const best = firstInRank(readings.filter(Boolean))
        if (best) passed.push({ ...best, candidate, index, rank: [...best.rank, index] })
    })

    const best = firstInRank(passed)
    if (!best) return NOT_FOUND
    if (best.verdict.same) return { found: true, candidate: best.candidate, index: best.index, verdict: best.verdict }

    // Nothing passed the first tier, so everything that passed is of the second tier.
    const albums = new Set(passed.map(one => one.album))
    if (albums.size > 1) return NOT_FOUND
    return { found: true, candidate: best.candidate, index: best.index, verdict: SAME(best.verdict.reason) }
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
