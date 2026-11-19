/**
 * albumIdentity - the ONE rule that says "this is the album that was asked for" (F55, reviewed in F68).
 *
 * Pure: no network, no DOM, no project import. The app imports it (`@shared/albumIdentity.js`) and
 * the server loads it (`server/lib/albumIdentity.js`), so both decide with the same code. Every
 * place that receives candidates from a source (Apple Music, Spotify, BestEverAlbums, the local
 * dataset, the AI answer) turns its data into { artist, title, year? } and asks here.
 *
 * HOW TO READ THIS FILE: top to bottom, in the order a comparison runs.
 *   1. NORMALIZATION   how a name becomes the text that is compared (one place)
 *   2. THE ARTIST      the named ways two artist names are the same artist (ARTIST_EQUIVALENCES)
 *   3. THE TITLE       edition notes, then two tiers:
 *                      FIRST TIER  "it is the album"                          -> verdict `same`
 *                      SECOND TIER "it is the album if the source has nothing
 *                                   better" (SECOND_TIER_RULES, a list)        -> verdict `same-if-alone`
 *   4. ONE COMPARISON  compareAlbumIdentity: the title, then the artist. The year never rejects.
 *   5. THE CHOICE      pickAlbum sees every candidate of a source and is the only one that turns
 *                      `same-if-alone` into `same`. compareKeptAlbum believes what pickAlbum wrote.
 *   6. SOURCE LABELS   how a text of a source ("Title by Artist (US)") is read
 *   7. SEARCH TEXTS    the titles a source is ASKED for, made by the same reductions
 *
 * EVERY REASON, WITH A REAL EXAMPLE (asked for -> what the source has). REASONS_EXPLAINED, at the
 * end of section 4, is this table as data, and the tests run every row of it.
 *
 *   first tier (same)
 *   exact-title                   Stone Temple Pilots «Core»              -> «Core»
 *   edition-of-title              Genesis «Foxtrot (2007 Stereo Mix)»     -> «Foxtrot»
 *   artist-and-title-in-one-text  (no artist) «The Beatles Abbey Road»    -> The Beatles «Abbey Road»
 *   second tier (same-if-alone; the loaded album keeps the reason and the card says it)
 *   title-before-subtitle         «No Quarter»                            -> «No Quarter: Jimmy Page & Robert Plant Unledded»
 *   title-without-parentheses     «In the Court of the Crimson King»      -> «In The Court Of The Crimson King (An Observation By King Crimson)»
 *   title-in-parentheses          «Led Zeppelin IV»                       -> «Untitled (Led Zeppelin IV)»
 *   title-with-artist-name        James Brown «Live at the Apollo»        -> «James Brown Live At The Apollo»
 *   title-written-otherwise       Frank Ocean «Blonde»                    -> «Blond» (KNOWN_WRITINGS)
 *   refused (different)
 *   title-mismatch                «Core»                                  -> «Core Memories»
 *   artist-mismatch               Stone Temple Pilots «Core»              -> Persefone «Core»
 *   title-missing                 «»                                      -> anything
 *
 * WHAT IS NEVER DONE HERE: one text containing the other, a score, a threshold, "the closest album
 * of the artist". A candidate is accepted because ONE named rule says so, or it is refused.
 *
 * HOW TO ADD A RULE
 *   Where: an equivalence of ARTISTS is one more entry of ARTIST_EQUIVALENCES; a way two TITLES are
 *   the same album is one more entry of SECOND_TIER_RULES (the first tier is closed: exact and
 *   edition); a title a source writes in a way no rule can derive is one more entry of
 *   KNOWN_WRITINGS; a word that marks an edition is one more word of EDITION_WORDS.
 *   What it must come with: a `reason` (or `name`) of its own, in Reason; one sentence in `says`;
 *   a REAL `example` (an album somebody asked for and what a source answered - save the source's
 *   answer under test/fixtures/); a test of the example AND of the nearest album it must still
 *   refuse; the tier (anything that is not exact or an edition is second tier: accepted only when
 *   alone, and flagged on the album); its line in the table above; its sentence in `identityNotice`
 *   (public/js/models/askedAlbum.js), which the card shows.
 *   Then bump IDENTITY_RULE_VERSION: the browsers keep "the source has none" for a day, and the
 *   version is what makes them ask again (test/architecture/albumIdentityRule.test.js fails until
 *   the list of rules and the version are updated together).
 *   What a rule may not do: compare by containment, give a score, read anything but the two albums
 *   it receives, or answer `same` (only the first tier and pickAlbum do).
 *
 * A RULE FOR ONE GENRE (not built; this is where it plugs in). In classical music the "artist" of
 * a catalog is sometimes the composer and sometimes the performer, and the title carries the work,
 * its number and its key ("Symphony No. 5 in C minor, Op. 67"). Such a rule would be: (1) the
 * album asked for gains a field, `genre`, filled by the adapter that builds it (askedAlbum.js);
 * (2) the entry of ARTIST_EQUIVALENCES or SECOND_TIER_RULES gains `onlyFor: ['classical']`, and the
 * two loops that run the lists (sameArtist, secondTier) skip an entry whose `onlyFor` does not
 * include the genre asked for; (3) nothing else changes: the verdicts, pickAlbum, the flag on the
 * album and the notice are the same. A genre rule never replaces the general ones.
 */

/**
 * Bumped whenever a change of this file can turn a "not found" into a found album. A "the source
 * has no such album" that was decided with another version is not believed (the app's server
 * stamps its answer with it; AlbumCacheAdapter compares it on read).
 * 1: F55 (exact title, edition, title before a subtitle). 2: F68 (this review).
 */
export const IDENTITY_RULE_VERSION = 2

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
    /** Second tier: the title asked for is the candidate's title without what it has in parentheses. */
    TITLE_WITHOUT_PARENTHESES: 'title-without-parentheses',
    /** Second tier: the title asked for is what the candidate's title has in parentheses. */
    TITLE_IN_PARENTHESES: 'title-in-parentheses',
    /** Second tier: the candidate's title is the artist's name and then the title asked for. */
    TITLE_WITH_ARTIST_NAME: 'title-with-artist-name',
    /** Second tier: the two titles are two writings of one album, listed in KNOWN_WRITINGS. */
    TITLE_WRITTEN_OTHERWISE: 'title-written-otherwise',
    TITLE_MISSING: 'title-missing',
    TITLE_MISMATCH: 'title-mismatch',
    ARTIST_MISMATCH: 'artist-mismatch'
})

const same = (reason) => Object.freeze({ verdict: Verdict.SAME, same: true, reason })
const sameIfAlone = (reason) => Object.freeze({ verdict: Verdict.SAME_IF_ALONE, same: false, reason })
const different = (reason) => Object.freeze({ verdict: Verdict.DIFFERENT, same: false, reason })

// ================================================================================================
// 1. NORMALIZATION - how a name (a title, an artist) becomes the text that is compared
// ================================================================================================
// Accents out, lower case, apostrophes out, "&" read as "and", every other punctuation is a word
// break, "Volume" is "Vol" and "Part" is "Pt", a leading "The" is dropped; the words are then
// joined, so "AC/DC" is "ACDC" and "R.E.M." is "REM".
// What is NOT made equal: letters are not swapped ("Ágætis" is not "Agaetis", "Blonde" is not
// "Blond"), roman and arabic numbers are not the same ("IV" is not "4").

const SAME_WORD = Object.freeze({ volume: 'vol', part: 'pt' })
const DIACRITICS = /[̀-ͯ]/g
const APOSTROPHES = /['’‘`´]/g
const NOT_A_WORD = /[^\p{L}\p{N}]+/gu

/** The words of a text. In an artist's name "+" is "and" too ("Florence + the Machine"). */
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

/** A text made only of symbols ("÷") has no words: it is compared as it is. */
const symbolsOf = (text) => String(text ?? '').toLowerCase().replace(/\s+/g, '')

/** The text a name is compared by: «The Wall» -> "wall", «AC/DC» -> "acdc", «÷» -> "÷". */
function nameKey(name) {
    return withoutLeadingThe(wordsOf(name)).join('') || symbolsOf(name)
}

// ================================================================================================
// 2. THE ARTIST - the named ways two artist names are the same artist
// ================================================================================================

/** What joins two names in one artist text: "A & B", "A and B", "A + B", "A, B". */
const BETWEEN_NAMES = /\s*[&+,;]\s*|\s+and\s+/i

/** The artist as one text: the names in the order written, without what joins them. */
function artistKey(artist) {
    const words = withoutLeadingThe(wordsOf(artist, { plusIsAnd: true }))
    const names = words.filter(word => word !== 'and')
    return (names.length > 0 ? names : words).join('') || symbolsOf(artist)
}

/** The names of an artist text, each as its key, in alphabetical order. */
function artistNames(artist) {
    return String(artist ?? '').split(BETWEEN_NAMES).map(nameKey).filter(Boolean).sort()
}

/**
 * Each entry is one way two names are the same artist; `same(a, b)` decides, `example` is real.
 * NOT the same artist, by decision: a longer name ("Page" / "Page & Plant", "James Brown" /
 * "James Brown And His Famous Flames") and a short form no rule can derive ("Page & Plant" /
 * "Jimmy Page & Robert Plant"): the album has to be asked for with the artist as a source writes it.
 */
export const ARTIST_EQUIVALENCES = Object.freeze([
    Object.freeze({
        name: 'same-words',
        says: 'The same words once normalized; what joins the names ("&", "and", "+", ",") and a leading "The" do not count.',
        example: Object.freeze(['Robert Plant & The Strange Sensation', 'Robert Plant And The Strange Sensation']),
        same: (asked, candidate) => artistKey(asked) === artistKey(candidate)
    }),
    Object.freeze({
        name: 'same-names-in-another-order',
        says: 'The same names, joined in another order (a "The" in front of a name does not count).',
        example: Object.freeze(['Robert Plant & Jimmy Page', 'Jimmy Page & Robert Plant']),
        same: (asked, candidate) => {
            const names = artistNames(asked)
            return names.length > 1 && names.join('|') === artistNames(candidate).join('|')
        }
    })
])

/**
 * Are the two names the same artist? Also for a source that lists artists (the artist's page of
 * BestEverAlbums). An empty name is never the same as anything.
 * @param {string} asked
 * @param {string} candidate
 * @returns {boolean}
 */
export function sameArtist(asked, candidate) {
    if (!artistKey(asked) || !artistKey(candidate)) return false
    return ARTIST_EQUIVALENCES.some(equivalence => equivalence.same(asked, candidate))
}

// ================================================================================================
// 3. THE TITLE
// ================================================================================================

// ---- 3a. Edition notes: dropped from a title before anything is compared -------------------------
// - a group in (), [] or {} that is one year alone ("(2017)"), one platform tag alone ("(Live)",
//   "(Explicit)"), or that has an edition word ("(Deluxe Edition)", "(2007 Stereo Mix)",
//   "[Expanded]", "(Bonus Tracks)", "(Nicene Creedence Ed.)");
// - a subtitle after ":" or " - " under the same test ("- Remastered", "- EP", ": 50th Anniversary").
// Whatever is not an edition note stays in the title, for the tiers to judge.

const EDITION_WORDS = new Set([
    'deluxe', 'edition', 'editions', 'remaster', 'remastered', 'remasters', 'remastering', 'expanded',
    'anniversary', 'version', 'reissue', 'reissued', 'bonus', 'mono', 'stereo', 'mix', 'collector',
    'collectors', 'legacy'
])
/** Edition words only as the last word of the note: "Nicene Creedence Ed." */
const EDITION_ABBREVIATIONS = new Set(['ed', 'edn'])
/** A tag the catalogs append; an edition note only when it is the whole note. */
const PLATFORM_TAGS = new Set(['live', 'ep', 'single', 'explicit', 'clean'])

const INNERMOST_GROUP = /[([{]([^()[\]{}]*)[)\]}]/g
const SUBTITLE_SEPARATOR = /:\s+|\s+[-–—]\s+/g
const YEAR = /^(19|20)\d{2}$/

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
 * The title as written, without its edition notes: «Foxtrot (2007 Stereo Mix)» -> «Foxtrot»,
 * «Core - 2011 Remaster» -> «Core». A title that is nothing but an edition word («Deluxe») is kept.
 * It is also the text a source is searched with (section 7): there is no second cleaner.
 * @param {string} title
 * @returns {string}
 */
export function titleWithoutEditionNotes(title) {
    const text = String(title ?? '').replace(/\s+/g, ' ').trim()
    const plain = withoutEditionSubtitles(withoutEditionGroups(text)).replace(/\s+/g, ' ').trim()
    return nameKey(plain) ? plain : text
}

/**
 * A title, read once for every rule below.
 * @returns {{ plain: string, whole: string, core: string }} `plain` is the text without edition
 *          notes; `whole` is the key of the title as written and `core` the key of `plain`
 */
function readTitle(title) {
    const plain = titleWithoutEditionNotes(title)
    return { plain, whole: nameKey(title), core: nameKey(plain) }
}

/** An album as the tiers read it. */
const readAlbum = (album) => ({ artist: album?.artist, title: readTitle(album?.title) })

// ---- 3b. FIRST TIER: "it is the album" ------------------------------------------------------------
// The titles are compared WHOLE: equal as written (exact-title) or equal once the edition notes are
// out (edition-of-title). One title containing the other is not a match: «Core» is not «Core Memories».

/** A query typed as one text ("The Beatles Abbey Road") against the candidate's artist and title. */
function isArtistAndTitleInOneText(asked, candidate) {
    const artist = artistKey(candidate.artist)
    if (!artist) return false
    return asked.title.whole === artist + candidate.title.core || asked.title.whole === candidate.title.core + artist
}

/** @returns {Object|null} the verdict `same` with its reason, or null when the first tier does not accept */
function firstTier(asked, candidate) {
    if (asked.title.core === candidate.title.core) {
        return same(asked.title.whole === candidate.title.whole ? Reason.EXACT_TITLE : Reason.EDITION_OF_TITLE)
    }
    // A query with no artist has nothing to compare the artist with: its text may be "artist title"
    if (!artistKey(asked.artist) && isArtistAndTitleInOneText(asked, candidate)) {
        return same(Reason.ARTIST_AND_TITLE_IN_ONE_TEXT)
    }
    return null
}

// ---- 3c. SECOND TIER: "it is the album only if the source has nothing better" ---------------------
// Each rule below is ONE named way a source writes the album asked for with another title. A rule
// answers for two albums only; whether the candidate is ALONE is pickAlbum's (section 5). A query
// with no artist has no second tier.

/** The title a text has before each of its subtitle separators: "A: B - C" has "A" and "A: B". */
function titlesBeforeSubtitle(plain) {
    return [...plain.matchAll(SUBTITLE_SEPARATOR)]
        .filter(separator => separator.index > 0)
        .map(separator => nameKey(plain.slice(0, separator.index)))
}

/** What a title has in (), [] or {} once the edition notes are out: «Untitled (Led Zeppelin IV)» -> ["Led Zeppelin IV"]. */
const groupsOf = (plain) => [...plain.matchAll(INNERMOST_GROUP)].map(group => group[1])
const withoutGroups = (plain) => plain.replace(INNERMOST_GROUP, ' ')

const NUMBER_WORDS = new Set(['vol', 'pt', 'disc', 'no'])
const A_NUMBER = /^(\d+|[ivx]+)$/
/** "(Vol. 2)", "(II)", "(1970-2002)": a number names another album, it is never just "more in parentheses". */
function numbersTheAlbum(note) {
    const words = wordsOf(note)
    return words.some(word => NUMBER_WORDS.has(word)) || words.every(word => A_NUMBER.test(word))
}

/**
 * Titles that are two writings of ONE album and that no rule can derive: a letter changes, or the
 * difference is one a rule would get wrong elsewhere (the years in «Substance 1977-1980»: Elton
 * John's «Greatest Hits 1970-2002» is NOT his «Greatest Hits»). Each entry is a fact read from the
 * sources, with where it was seen. It is data, not a rule of spelling: «Blonde» is «Blond» only
 * for this artist.
 */
export const KNOWN_WRITINGS = Object.freeze([
    Object.freeze({
        artist: 'Frank Ocean',
        titles: Object.freeze(['Blonde', 'Blond']),
        seen: 'Apple Music writes «Blonde»; BestEverAlbums writes «Blond», as the cover does (suggest.php, 2026-11-19).'
    }),
    Object.freeze({
        artist: 'Joy Division',
        titles: Object.freeze(['Substance 1977-1980', 'Substance']),
        seen: 'Apple Music writes «Substance 1977-1980»; BestEverAlbums writes «Substance» (suggest.php, 2026-11-19).'
    }),
    Object.freeze({
        artist: 'AC/DC',
        titles: Object.freeze(['POWER UP', 'PWR/UP']),
        seen: 'Apple Music writes «POWER UP»; BestEverAlbums writes «PWR/UP», as the cover does (suggest.php, 2026-11-19).'
    })
])

/** The writings KNOWN_WRITINGS has for this artist and title, or none. */
function knownWritingsOf(artist, titleCore) {
    return KNOWN_WRITINGS
        .filter(known => sameArtist(known.artist, artist) && known.titles.some(title => nameKey(title) === titleCore))
        .flatMap(known => known.titles)
}

/**
 * The second tier, in the order it is tried. `applies(asked, candidate)` receives the two albums
 * as readAlbum gives them and answers for the TITLES; the artist is checked after, for every rule.
 * `example` is a real case: the tests run it and expect `same-if-alone` with this reason.
 */
export const SECOND_TIER_RULES = Object.freeze([
    Object.freeze({
        reason: Reason.TITLE_BEFORE_SUBTITLE,
        says: 'The title asked for is the candidate\'s title before a subtitle (":" or " - "). One direction only: the long title asked for is never the short album.',
        example: Object.freeze({
            asked: { artist: 'Jimmy Page & Robert Plant', title: 'No Quarter' },
            candidate: { artist: 'Jimmy Page & Robert Plant', title: 'No Quarter: Jimmy Page And Robert Plant Unledded' }
        }),
        applies: (asked, candidate) => titlesBeforeSubtitle(candidate.title.plain).includes(asked.title.core)
    }),
    Object.freeze({
        reason: Reason.TITLE_WITHOUT_PARENTHESES,
        says: 'The title asked for is the candidate\'s title without what it has in parentheses, when that is not an edition note and not a number ("(Vol. 2)").',
        example: Object.freeze({
            asked: { artist: 'King Crimson', title: 'In the Court of the Crimson King (Expanded Edition)' },
            candidate: { artist: 'King Crimson', title: 'In The Court Of The Crimson King (An Observation By King Crimson)' }
        }),
        applies: (asked, candidate) => {
            const groups = groupsOf(candidate.title.plain)
            return groups.length > 0 && !groups.some(numbersTheAlbum) &&
                nameKey(withoutGroups(candidate.title.plain)) === asked.title.core
        }
    }),
    Object.freeze({
        reason: Reason.TITLE_IN_PARENTHESES,
        says: 'The title asked for is the other name the candidate\'s title carries in parentheses or brackets.',
        example: Object.freeze({
            asked: { artist: 'Led Zeppelin', title: 'Led Zeppelin IV (Remastered)' },
            candidate: { artist: 'Led Zeppelin', title: 'Untitled (Led Zeppelin IV)' }
        }),
        applies: (asked, candidate) => groupsOf(candidate.title.plain).some(group => nameKey(group) === asked.title.core)
    }),
    Object.freeze({
        reason: Reason.TITLE_WITH_ARTIST_NAME,
        says: 'The candidate\'s title is the artist\'s name followed by the title asked for.',
        example: Object.freeze({
            asked: { artist: 'James Brown', title: 'Live At The Apollo (1962)' },
            candidate: { artist: 'James Brown', title: 'James Brown Live At The Apollo' }
        }),
        applies: (asked, candidate) => nameKey(asked.artist) + asked.title.core === candidate.title.core
    }),
    Object.freeze({
        reason: Reason.TITLE_WRITTEN_OTHERWISE,
        says: 'The two titles are two writings of one album of this artist, listed in KNOWN_WRITINGS.',
        example: Object.freeze({
            asked: { artist: 'Frank Ocean', title: 'Blonde' },
            candidate: { artist: 'Frank Ocean', title: 'Blond' }
        }),
        applies: (asked, candidate) =>
            knownWritingsOf(asked.artist, asked.title.core).some(title => nameKey(title) === candidate.title.core)
    })
])

/** @returns {Object|null} the verdict `same-if-alone` of the first rule that applies, or null */
function secondTier(asked, candidate) {
    const rule = SECOND_TIER_RULES.find(one => one.applies(asked, candidate))
    return rule ? sameIfAlone(rule.reason) : null
}

/** The verdict of the titles alone; the artist is checked after it, in compareAlbumIdentity. */
function compareTitles(asked, candidate) {
    if (!asked.title.core || !candidate.title.core) return different(Reason.TITLE_MISSING)
    const hasArtist = Boolean(artistKey(asked.artist))
    return firstTier(asked, candidate) ||
        (hasArtist ? secondTier(asked, candidate) : null) ||
        different(Reason.TITLE_MISMATCH)
}

// ================================================================================================
// 4. ONE COMPARISON - the title, then the artist. The year never rejects (a reissue carries another).
// ================================================================================================

/**
 * Is the candidate the album that was asked for? One comparison, with nothing else in sight.
 * A query with no artist has nothing to compare the artist with, so only the title decides; a
 * candidate with no artist never passes a query that has one.
 * @param {{ artist?: string, title: string, year?: number|string }} asked
 * @param {{ artist?: string, title: string, year?: number|string }} candidate
 * @returns {{ verdict: 'same'|'same-if-alone'|'different', same: boolean, reason: string }}
 *          reason is one of Reason; `same` is true only for the verdict 'same'
 */
export function compareAlbumIdentity(asked, candidate) {
    const wanted = readAlbum(asked)
    const offered = readAlbum(candidate)
    const title = compareTitles(wanted, offered)
    if (title.verdict === Verdict.DIFFERENT) return title

    if (artistKey(wanted.artist) && !sameArtist(wanted.artist, offered.artist)) return different(Reason.ARTIST_MISMATCH)
    return title
}

/**
 * The table of the header, as data: every reason with what it says and one real example. The tests
 * run each example through compareAlbumIdentity and expect this verdict and this reason.
 */
export const REASONS_EXPLAINED = Object.freeze([
    {
        reason: Reason.EXACT_TITLE,
        verdict: Verdict.SAME,
        says: 'The whole titles are equal after normalization, and the artist is the same.',
        example: { asked: { artist: 'Stone Temple Pilots', title: 'Core' }, candidate: { artist: 'Stone Temple Pilots', title: 'Core' } }
    },
    {
        reason: Reason.EDITION_OF_TITLE,
        verdict: Verdict.SAME,
        says: 'The titles are equal once the edition notes are dropped.',
        example: { asked: { artist: 'Genesis', title: 'Foxtrot (2007 Stereo Mix)' }, candidate: { artist: 'Genesis', title: 'Foxtrot' } }
    },
    {
        reason: Reason.ARTIST_AND_TITLE_IN_ONE_TEXT,
        verdict: Verdict.SAME,
        says: 'The query has no artist and its text is the artist and the title of the candidate.',
        example: { asked: { artist: '', title: 'The Beatles Abbey Road' }, candidate: { artist: 'The Beatles', title: 'Abbey Road' } }
    },
    ...SECOND_TIER_RULES.map(({ reason, says, example }) => ({ reason, verdict: Verdict.SAME_IF_ALONE, says, example })),
    {
        reason: Reason.TITLE_MISMATCH,
        verdict: Verdict.DIFFERENT,
        says: 'No rule says the two titles are one album.',
        example: { asked: { artist: 'Stone Temple Pilots', title: 'Core' }, candidate: { artist: 'Stone Temple Pilots', title: 'Core Memories' } }
    },
    {
        reason: Reason.ARTIST_MISMATCH,
        verdict: Verdict.DIFFERENT,
        says: 'The titles pass and the artist is another one.',
        example: { asked: { artist: 'Stone Temple Pilots', title: 'Core' }, candidate: { artist: 'Persefone', title: 'Core' } }
    },
    {
        reason: Reason.TITLE_MISSING,
        verdict: Verdict.DIFFERENT,
        says: 'One of the two has no title.',
        example: { asked: { artist: 'Stone Temple Pilots', title: '' }, candidate: { artist: 'Stone Temple Pilots', title: 'Core' } }
    }
].map(Object.freeze))

// ================================================================================================
// 5. THE CHOICE among the candidates of a source, and the album that is kept
// ================================================================================================
// - If any candidate passes the first tier, the pick is among those; the second tier is not looked at.
// - Otherwise, if the candidates of the second tier are all ONE album (the same title once the
//   edition notes are dropped), that album is picked and the verdict carries the reason of its rule.
//   Two different albums («Greatest Hits: 1970-2002», «Greatest Hits: Vol 2») is "not found":
//   choosing between them is the person's.
// - No candidate passes: "not found". There is no "closest album of the artist".
// Order among the candidates that pass: the first tier before the second; the exact title before
// an edition; the year nearest to the year asked for (when the query has one); the order the source gave.

/**
 * The ONLY door from `same-if-alone` to `same`. It is called in two places: pickAlbum, which saw
 * that the candidate is alone, and compareKeptAlbum, which reads the reason pickAlbum left.
 */
const acceptedAlone = (verdict) => same(verdict.reason)

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

    const title = readTitle(reading?.title)
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
 *
 * @param {{ artist?: string, title: string, year?: number|string }} asked
 * @param {Array} candidates - as the source gave them
 * @param {Function} [read] - (candidate) => { artist, title, year? }, or a list of them when the
 *        source's text can be read in more than one way (see albumFromLabel)
 * @returns {{ found: boolean, candidate: *, index: number, verdict: Object|null }} the verdict of a
 *          found album is always `same`; its reason says how (a reason of SECOND_TIER_RULES: it was alone)
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
    return { found: true, candidate: best.candidate, index: best.index, verdict: acceptedAlone(best.verdict) }
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
    const pickedAlone = verdict.verdict === Verdict.SAME_IF_ALONE && kept?.identityReason === verdict.reason
    return pickedAlone ? acceptedAlone(verdict) : verdict
}

/**
 * Is the ONE album a source answered the album asked for? For a source that is asked for this
 * album and answers with one album, not with a list (the AI search of the app's server). Its
 * answer is, by construction, the only candidate, so the second tier applies, and the verdict's
 * reason says so («No Quarter» answered as «No Quarter: Jimmy Page & Robert Plant Unledded»).
 * Never use it for one item taken out of a list: a list is judged whole, by pickAlbum.
 * @param {{ artist?: string, title: string, year?: number|string }} asked
 * @param {{ artist?: string, title: string, year?: number|string }} answered
 * @returns {{ verdict: string, same: boolean, reason: string }} as compareAlbumIdentity
 */
export function compareOnlyAnswer(asked, answered) {
    const picked = pickAlbum(asked, answered ? [answered] : [])
    return picked.found ? picked.verdict : compareAlbumIdentity(asked, answered)
}

// ================================================================================================
// 6. SOURCE LABELS - how a text of a source is read into { title, artist }
// ================================================================================================

/**
 * The names an artist's label of a source can stand for. BestEverAlbums tells artists of the same
 * name apart with a note at the end, in parentheses: "Nirvana (US)", "Genesis (UK)". The note is
 * the source's, not part of the name, so the label is read both ways: as it is, and without the
 * note. (An artist whose own name ends in parentheses still matches by the first reading.)
 * @param {string} label
 * @returns {string[]}
 */
export function artistNamesFromLabel(label) {
    const text = String(label ?? '').trim()
    if (!text) return []
    const withoutNote = text.replace(/\s*\([^()]*\)$/, '').trim()
    return withoutNote && withoutNote !== text ? [text, withoutNote] : [text]
}

/**
 * Every way a label "Title by Artist" can be read (BestEverAlbums writes its results so). A title
 * can have " by " inside ("Stand by Me by Ben E. King"), so each " by " is tried as the separator;
 * the artist can carry the source's note ("Nevermind by Nirvana (US)"), so it is read with and
 * without it; a label with none (an artist's page, a forum post) has no reading.
 * @param {string} label
 * @returns {Array<{ title: string, artist: string }>}
 */
export function albumFromLabel(label) {
    const text = String(label ?? '').trim()
    return [...text.matchAll(/\s+by\s+/gi)].flatMap(separator => {
        const title = text.slice(0, separator.index).trim()
        const artists = artistNamesFromLabel(text.slice(separator.index + separator[0].length))
        return title ? artists.map(artist => ({ title, artist })) : []
    })
}

// ================================================================================================
// 7. SEARCH TEXTS - the titles a source is asked for
// ================================================================================================

/**
 * The titles to ask a source for, the most likely first. A search only LISTS candidates (what is
 * accepted is decided above), but a source that matches word by word lists nothing when the text
 * has a word its own title does not have, so the title is asked for the way the rules know a
 * source may write it:
 *   1. without edition notes     «Foxtrot (2007 Stereo Mix)» -> «Foxtrot»
 *   2. the other known writings  AC/DC «POWER UP»            -> «PWR/UP»
 * @param {{ artist?: string, title: string }} asked
 * @returns {string[]} distinct titles, as texts to send
 */
export function titlesToSearch(asked) {
    const plain = titleWithoutEditionNotes(asked?.title)
    const titles = [plain, ...knownWritingsOf(asked?.artist, nameKey(plain))]
    const seen = new Set()
    return titles.filter(title => {
        const key = nameKey(title)
        if (!key || seen.has(key)) return false
        seen.add(key)
        return true
    })
}
