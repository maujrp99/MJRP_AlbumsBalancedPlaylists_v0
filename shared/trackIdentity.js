/**
 * trackIdentity - the ONE rule that says "this track of the album and this track of a source are
 * the same track" (F74, UAT-221), in the mould of the album rule (shared/albumIdentity.js).
 *
 * Pure: no network, no DOM, no import outside shared/ (the engine's Unicode tables come through shared/platform/text.js). The app imports it (`@shared/trackIdentity.js`,
 * through public/js/models/sameTrack.js) and the server loads it (server/lib/trackIdentity.js), so
 * both decide with the same code. Every place that puts what a source says of a track (a rating
 * of BestEverAlbums, the popularity of Spotify, a position the AI gave) on the tracks of an album
 * hands the two lists to `matchTracks` and writes what it answers. Nothing else compares titles.
 *
 * WHY IT EXISTS. The comparison used to delete everything in brackets on both sides. In «In the
 * Court of the Crimson King (Expanded Edition)» that left four of the five original tracks with no
 * rating (the source writes «21st Century Schizoid Man Including Mirrors», with no brackets) and
 * gave the rating of «I Talk to the Wind» to the extra «I Talk to the Wind (Duo Version)».
 *
 * HOW TO READ THIS FILE: top to bottom, in the order a comparison runs.
 *   1. THE TEXT        how a title becomes the texts that are compared
 *   2. THE NOTES       what a title carries in brackets or after " - ": a note that only DESCRIBES
 *                      the same recording (DESCRIBING_NOTES) and a note that does not
 *   3. THE TIERS       the named ways two titles are the same track, strongest first (TIERS)
 *   4. THE ASSIGNMENT  matchTracks: one entry of the source goes to one track of the album
 *
 * EVERY REASON, WITH A REAL EXAMPLE (the album's track -> what the source writes). REASONS_EXPLAINED,
 * at the end of section 3, is this table as data, and the tests run every row of it.
 *
 *   same-text                  «21st Century Schizoid Man (Including "Mirrors")» -> «21st Century Schizoid Man Including Mirrors»
 *   same-song-described        «Larks' Tongues In Aspic, Pt. 1»                  -> «Larks' Tongues In Aspic, Part One»
 *   letters-starred-out        «A N***a Witta Gun»                               -> «A Nigga Witta Gun»
 *   same-place-one-word-apart  track 5 «My Sarah»                                -> track 5 «Sarah»
 *   medley-listed-shorter      «Medley: Please Please Please/You've Got The Power/I Found Someone (Live 1962)»
 *                                                                                -> the same medley with every song listed
 *   title-with-its-parts       «Supper's Ready (2007 Stereo Mix)»                -> «Supper's Ready: I. Lover's Leap / II. ...»
 *   first-of-titles-listed-together  «The Cinema Show (2007 Stereo Mix)»         -> «The Cinema Show / Aisle Of Plenty»
 *   title-without-its-note     «I'll Go Crazy (Live 1962)»                       -> «I'll Go Crazy»
 *   title-in-its-brackets      «Bang a Gong (Get It On)»                         -> «Get It On»
 *   refused
 *   another-recording          «Lost Someone (Live 1962)»                        -> «Lost Someone (Part 1)»
 *   title-mismatch             «Epitaph»                                         -> «Moonchild»
 *   title-missing              «»                                                -> anything
 *
 * THE EXTRA TRACK NEVER TAKES THE RATING OF THE ORIGINAL. The tiers that drop a note
 * (`title-without-its-note`, `title-in-its-brackets`) are the weakest and the assignment is one to one: when the album has «I Talk to the Wind» and «I Talk to the
 * Wind (Duo Version)» and the source rates «I Talk To The Wind», the plain track takes the entry by
 * the first tier and nothing is left for the other. Only an album that has the song in no plain
 * form (a live album: every track of «Live At The Apollo (1962)» says «(Live 1962)») gives the
 * entry to the track with the note.
 *
 * WHAT IS NEVER DONE HERE: one text containing the other, a share of words in common, a score, a
 * threshold. Two titles are the same track because ONE named tier says so, or they are not.
 *
 * HOW TO ADD A RULE
 *   Where: a way a note only describes the same recording is one more entry of DESCRIBING_NOTES; a
 *   title a source writes in a way no rule can derive is one more entry of KNOWN_WRITINGS; a way
 *   two titles are the same track is one more entry of TIERS, placed by its strength.
 *   What it must come with: a `reason` of its own, in TrackReason; one sentence in `says`; a REAL
 *   `example` (a track of an album somebody has and what a source writes); a test of the example
 *   AND of the nearest title it must still refuse; its line in the table above.
 *   Then bump TRACK_IDENTITY_RULE_VERSION: the browsers keep the ratings of an album for 7 days,
 *   and the version is what makes them ask again (test/architecture/trackIdentityRule.test.js
 *   fails until the list of rules and the version are updated together).
 */
import { normalizeText } from './platform/text.js' // the engine's Unicode tables, in one place (F78)

/**
 * Bumped whenever a change of this file can change which track a rating goes to. The ratings of an
 * album that were decided with another version are not believed (the app's server stamps its
 * answer with it; AlbumCacheAdapter compares it on read).
 * 1: F74 (the first rule; before it, the brackets were deleted on both sides).
 * 2: F74, second slice (the parts of a title after a colon, two tracks the source lists together,
 *    letters starred out, the title in the brackets; numbers written as words, "A" at the start,
 *    "-in'" for "-ing", "a.k.a."; the track number the album's track carries).
 */
export const TRACK_IDENTITY_RULE_VERSION = 2

export const TrackReason = Object.freeze({
    /** The two titles are the same text: case, accents, punctuation, brackets and "&" apart. */
    SAME_TEXT: 'same-text',
    /** The same song, described or written differently (a remaster note, "Pt. 1" and "Part One"). */
    SAME_SONG_DESCRIBED: 'same-song-described',
    /** A store writes some letters of a word as asterisks; the other writes the word. */
    LETTERS_STARRED_OUT: 'letters-starred-out',
    /** The same place on the album, and one title is the other with one word more. */
    SAME_PLACE_ONE_WORD_APART: 'same-place-one-word-apart',
    /** Two medleys, one listing fewer of the songs. */
    MEDLEY_LISTED_SHORTER: 'medley-listed-shorter',
    /** The same title before a colon; the parts listed after it are the same, or only one side lists them. */
    TITLE_WITH_ITS_PARTS: 'title-with-its-parts',
    /** One side lists two tracks in one title ("A / B"); the other is the first of them. */
    FIRST_OF_TITLES_LISTED_TOGETHER: 'first-of-titles-listed-together',
    /** One title is the other without its note, and the album has the song in no plain form. */
    TITLE_WITHOUT_ITS_NOTE: 'title-without-its-note',
    /** One title is what the other carries in brackets, and the album has the song in no plain form. */
    TITLE_IN_ITS_BRACKETS: 'title-in-its-brackets',
    /** The two titles carry different notes: two recordings of one song. */
    ANOTHER_RECORDING: 'another-recording',
    TITLE_MISMATCH: 'title-mismatch',
    TITLE_MISSING: 'title-missing'
})

// ================================================================================================
// 1. THE TEXT - how a title becomes the text that is compared
// ================================================================================================
// Accents out, lower case, apostrophes out, "&" read as "and", every other punctuation (brackets
// included) is a word break; the words are then joined, so "T.N.T." is "TNT", "Sub-culture" is
// "Subculture" and "S&M" is "S & M".

const DIACRITICS = /[̀-ͯ]/g
const APOSTROPHES = /['’‘`´]/g
const NOT_A_WORD = /[^\p{L}\p{N}]+/gu

/** The words of a text. */
function wordsOf(text) {
    return normalizeText(text ?? '', 'NFD').replace(DIACRITICS, '')
        .toLowerCase()
        .replace(APOSTROPHES, '')
        .replace(/&/g, ' and ')
        .replace(NOT_A_WORD, ' ')
        .trim()
        .split(' ')
        .filter(Boolean)
}

/** Words two sources write in two ways. */
const SAME_WORD = Object.freeze({
    part: 'pt', parts: 'pt', pts: 'pt', volume: 'vol',
    // a number written as a word: «Fourth Time Around» is «4th Time Around», «Obviously Five Believers» is «Obviously 5 Believers»
    one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10',
    first: '1st', second: '2nd', third: '3rd', fourth: '4th', fifth: '5th', sixth: '6th', seventh: '7th', eighth: '8th', ninth: '9th', tenth: '10th'
})
/** After "Pt" or "Vol", a number is also written in roman: «Parabol, Pt. II». The run goes on over "and": «Pts. II & III». */
const NUMBERED = new Set(['pt', 'vol'])
const ROMAN = Object.freeze({ i: '1', ii: '2', iii: '3', iv: '4', v: '5', vi: '6', vii: '7', viii: '8', ix: '9', x: '10' })
const inANumbering = (word) => word === 'and' || /^\d+$/.test(word) || Object.hasOwn(ROMAN, word)

/** The roman numbers of a run that starts after "Pt" or "Vol", read as digits. */
function romanAfterNumbered(words) {
    let numbering = false
    return words.map(word => {
        const read = numbering && ROMAN[word] ? ROMAN[word] : word
        numbering = NUMBERED.has(word) || (numbering && inANumbering(word))
        return read
    })
}

/** «Hangin' Tree» is «Hanging Tree»: the "g" a singer drops is not a letter of difference. */
const LONG_ENOUGH_TO_DROP_A_G = 6
const withTheGDropped = (word) => (word.length >= LONG_ENOUGH_TO_DROP_A_G && word.endsWith('ing') ? word.slice(0, -1) : word)

/** "a.k.a." joins two names of one track: «Operation Lifesaver a.K.A. Mint Test» is «Operation Lifesaver/Mint Test». */
const withoutAka = (words) => words.filter((word, at) => !(word === 'aka' || isAkaAt(words, at)))
const isAkaAt = (words, at) => [0, 1, 2].some(back => at - back >= 0 && words.slice(at - back, at - back + 3).join(' ') === 'a k a')

const ARTICLES = new Set(['the', 'a', 'an'])
/** «A Song For The Dead» is «Song for the Dead», «The Perfect Kiss» is «Perfect Kiss». */
const withoutLeadingArticle = (words) => (words.length > 1 && ARTICLES.has(words[0]) ? words.slice(1) : words)

/** The words with what is only a way of WRITING made equal. */
function writtenAlike(words) {
    const sameWords = withoutAka(words).map(word => SAME_WORD[word] || withTheGDropped(word))
    return withoutLeadingArticle(romanAfterNumbered(sameWords))
}

/**
 * Titles a source writes in a way no rule can derive: a spelling. Each entry is one track.
 * `example` is where it was seen.
 */
export const KNOWN_WRITINGS = Object.freeze([
    Object.freeze({
        writings: Object.freeze(['Foxey Lady', 'Foxy Lady']),
        example: 'The Jimi Hendrix Experience, «Are You Experienced»: Apple Music writes «Foxey Lady», BestEverAlbums «Foxy Lady»'
    }),
    Object.freeze({
        writings: Object.freeze(['Midnite Cruiser', 'Midnight Cruiser']),
        example: 'Steely Dan, «Can\'t Buy A Thrill»: Apple Music writes «Midnite Cruiser», BestEverAlbums «Midnight Cruiser»'
    }),
    Object.freeze({
        writings: Object.freeze(['Greatdayndamornin\' / Booty', 'Greatdayindamornin\' / Booty']),
        example: 'D\'Angelo, «Voodoo»: Apple Music writes «Greatdayndamornin\' / Booty», BestEverAlbums «Greatdayindamornin\' / Booty»'
    })
])

const joined = (words) => writtenAlike(words).join('')
const KNOWN_KEYS = new Map(KNOWN_WRITINGS.flatMap(({ writings }) => writings.map(writing => [joined(wordsOf(writing)), joined(wordsOf(writings[0]))])))

/** The text that is compared, for a list of words: written alike, joined, a known writing read as its first. */
function keyOf(words) {
    const key = joined(words)
    return KNOWN_KEYS.get(key) || key
}

// ================================================================================================
// 2. THE NOTES - what a title carries in brackets, or after " - "
// ================================================================================================
// «Shellshock (John Robie Remix) [Substance Edit]» is the title «Shellshock» and two notes.
// «Heroes - 2017 Remaster» is the title «Heroes» and one note. A note either only DESCRIBES the
// same recording (DESCRIBING_NOTES: it is dropped before the second tier compares) or it does not
// (a live take, a demo, a remix, a subtitle): then it is part of what the track is.

const year = (word) => /^(19|20)\d\d$/.test(word)
/** Words a note is made of when it says how the same recording was mastered, mixed or placed. */
const MASTERING_WORDS = new Set(['remaster', 'remastered', 'digital', 'digitally', 'mono', 'stereo', 'mix', 'album', 'version', 'bonus', 'track', 'original'])
const CREDIT_WORDS = new Set(['feat', 'featuring', 'ft', 'vs', 'versus'])
const MEDLEY_WORDS = new Set(['including', 'incl'])

/**
 * The named ways a note only describes the same recording. `test` receives the words of the note.
 */
export const DESCRIBING_NOTES = Object.freeze([
    Object.freeze({
        name: 'mastering-or-placement',
        says: 'every word of the note is about the master, the mix or the place of the track (and a year)',
        example: '«Heroes (2017 Remaster)», «Taxman (Mono)», «Come Together (2019 Mix)», «Hey Joe (Album Version)», «Recording Session Extract, Pt. 1 (Bonus Track)»',
        test: (words) => words.some(word => MASTERING_WORDS.has(word)) && words.every(word => MASTERING_WORDS.has(word) || year(word))
    }),
    Object.freeze({
        name: 'credit',
        says: 'the note names who else plays: it starts with "feat." or "vs", or has "vs" between two names',
        example: 'Armin van Buuren, «Mirage»: «Desiderium 207 (feat. Susana)», «Minack (Armin Van Buuren vs. Ferry Corsten)» -> «Minack (Vs Ferry Corsten)»',
        test: (words) => CREDIT_WORDS.has(words[0]) || words.includes('vs')
    }),
    Object.freeze({
        name: 'parts-of-the-song',
        says: 'the note lists the parts the song includes',
        example: 'King Crimson: «Moonchild (Including "The Dream" and "The Illusion")»',
        test: (words) => MEDLEY_WORDS.has(words[0])
    })
])

/** An empty note says nothing; else one of DESCRIBING_NOTES says it only describes. */
const describes = (words) => words.length === 0 || DESCRIBING_NOTES.some(note => note.test(words))

/** After " - ", a text is a note (and not a part of the title) when it describes, or has one of these words. */
const DASH_NOTE_WORDS = new Set([
    'live', 'demo', 'remix', 'mix', 'edit', 'version', 'acoustic', 'instrumental', 'session', 'sessions', 'take',
    'single', 'radio', 'extended', 'rehearsal', 'outtake'
])
function isDashNote(text) {
    const words = wordsOf(text)
    return words.length > 0 && (describes(words) || words.some(word => DASH_NOTE_WORDS.has(word)))
}

const BRACKETED = /\(([^()]*)\)|\[([^[\]]*)\]|\{([^{}]*)\}/g
const DASH = ' - '

/** The title outside its notes, and the notes (each a text), in the order they are written. */
function splitNotes(title) {
    const notes = []
    let outside = String(title ?? '').replace(BRACKETED, (whole, round, square, curly) => {
        notes.push(round ?? square ?? curly ?? '')
        return ' '
    })
    for (let at = outside.lastIndexOf(DASH); at > 0 && isDashNote(outside.slice(at + DASH.length)); at = outside.lastIndexOf(DASH)) {
        notes.push(outside.slice(at + DASH.length))
        outside = outside.slice(0, at)
    }
    // A title that is only a note («(Untitled)») is its own title
    return wordsOf(outside).length > 0 ? { outside, notes } : { outside: String(title ?? ''), notes: [] }
}

// «Close to the Edge: I. The Solid Time of Change, II. Total Mass Retain» is the title «Close to
// the Edge» and the list of its PARTS. A store numbers the parts ("I.", "II.", "A.", "B."); another
// source does not: the marks are not part of what is compared.
const COLON = ': '
const PART_MARK = /(^|[/,]\s*)(?:[IVX]{1,4}|[A-Ha-h])\.\s+/g

/** The title before ": " and the list of parts after it, or the whole text with no parts. */
function splitParts(outside) {
    const at = outside.indexOf(COLON)
    if (at <= 0 || wordsOf(outside.slice(at)).length === 0) return { head: outside, parts: '' }
    return { head: outside.slice(0, at), parts: outside.slice(at + COLON.length).replace(PART_MARK, '$1') }
}

/** The words of a text with the asterisks a store puts in the place of letters kept: "n***a". */
const NOT_A_WORD_NOR_A_STAR = /[^\p{L}\p{N}*]+/gu
function starredWordsOf(text) {
    const words = normalizeText(text ?? '', 'NFD').replace(DIACRITICS, '').toLowerCase().replace(APOSTROPHES, '').replace(/&/g, ' and ')
        .replace(NOT_A_WORD_NOR_A_STAR, ' ').trim().split(' ').filter(Boolean)
    return writtenAlike(words)
}

/** The first of the titles a text lists together ("A / B"), or '' when it lists one. */
function firstListed(outside) {
    const listed = outside.split('/')
    return listed.length > 1 && !outside.includes(COLON) ? keyOf(wordsOf(listed[0])) : ''
}

/**
 * A title as the tiers read it.
 * @param {string} title
 * @param {number|null} place - the track number on the album, when known
 * @returns {Object}
 *   text       every word of the title, brackets read as plain words (first tier)
 *   written    the same, with what is only a way of writing made equal
 *   described  the title and its notes that do not merely describe
 *   starred    the words of `described`, with the asterisks of a starred-out word kept
 *   base       the title outside every note; `baseWords`, its words
 *   head       the title before ": "; `parts`, the list of parts after it ('' for none)
 *   first      the first of the titles listed together with "/" ('' when it is one title)
 *   notes      the notes that do not merely describe, as one text ('' for none); `noteKeys`, each one
 */
function readTitle(title, place = null) {
    const { outside, notes } = splitNotes(title)
    const said = notes.filter(note => !describes(wordsOf(note)))
    const saidWords = said.map(wordsOf)
    const { head, parts } = splitParts(outside)
    return {
        text: wordsOf(title).join(''),
        written: keyOf(wordsOf(title)),
        described: keyOf([...wordsOf(outside), ...saidWords.flat()]),
        starred: starredWordsOf([outside, ...said].join(' ')),
        base: keyOf(wordsOf(outside)),
        baseWords: writtenAlike(wordsOf(outside)),
        head: keyOf(wordsOf(head)),
        parts: keyOf(wordsOf(parts)),
        first: firstListed(outside),
        notes: saidWords.map(words => words.join('')).join('|'),
        noteKeys: saidWords.filter(words => words.length > 1).map(keyOf),
        place
    }
}

// ================================================================================================
// 3. THE TIERS - the named ways two titles are the same track, strongest first
// ================================================================================================

/** Two titles that both carry a note, and not the same one, are two recordings: no tier below the second joins them. */
const notesAgree = (a, b) => !a.notes || !b.notes || a.notes === b.notes

/** Is `longer` the list `shorter` with exactly one word more, anywhere? */
function oneWordMore(shorter, longer) {
    if (shorter.length === 0 || longer.length !== shorter.length + 1) return false
    const at = longer.findIndex((word, index) => word !== shorter[index])
    return longer.slice(at + 1).join(' ') === shorter.slice(at).join(' ')
}
const oneWordApart = (a, b) => oneWordMore(a, b) || oneWordMore(b, a)

const MEDLEY = 'medley'
/** A medley names at least this many words after "Medley" before one listing can be read as the start of the other. */
const MEDLEY_WORDS_NAMED = 3
function startsWith(longer, shorter) {
    return shorter.length > MEDLEY_WORDS_NAMED && shorter.length <= longer.length && shorter.every((word, index) => longer[index] === word)
}
const bothMedleys = (a, b) => a.baseWords[0] === MEDLEY && b.baseWords[0] === MEDLEY

/** A word with asterisks is the other word when each asterisk stands for one letter of it. */
const starredIs = (starred, word) => starred.length === word.length && [...starred].every((letter, at) => letter === '*' || letter === word[at])
const isStarred = (word) => word.includes('*')
const sameWordOrStarred = (one, other) => one === other || (isStarred(one) !== isStarred(other) && (isStarred(one) ? starredIs(one, other) : starredIs(other, one)))
function starredOut(a, b) {
    if (a.length !== b.length || ![...a, ...b].some(isStarred)) return false
    return a.every((word, at) => sameWordOrStarred(word, b[at]))
}

/** The same title before the colon (a medley has a tier of its own); the parts are the same, or one side lists none. */
const isTheHeadOf = (whole, withParts) => withParts.parts !== '' && whole.parts === '' && whole.base === withParts.head
function sameTitleWithParts(a, b) {
    if (a.head === '' || a.head === MEDLEY || a.head !== b.head) return false
    return (a.parts !== '' && a.parts === b.parts) || isTheHeadOf(a, b) || isTheHeadOf(b, a)
}

const firstOfTheListed = (one, listing) => listing.first !== '' && one.first === '' && one.base === listing.first

/** One title is the note the other carries in brackets (two words at least), and has no note of its own. */
const isTheNoteOf = (plain, noted) => plain.notes === '' && noted.noteKeys.includes(plain.base)

/**
 * The tiers, in the order they are tried. `test` receives the two readings (readTitle).
 * A stronger tier wins an entry of the source over a weaker one (matchTracks).
 */
export const TIERS = Object.freeze([
    Object.freeze({
        reason: TrackReason.SAME_TEXT,
        test: (a, b) => a.text === b.text
    }),
    Object.freeze({
        reason: TrackReason.SAME_SONG_DESCRIBED,
        test: (a, b) => a.written === b.written || a.described === b.described
    }),
    Object.freeze({
        reason: TrackReason.LETTERS_STARRED_OUT,
        test: (a, b) => starredOut(a.starred, b.starred)
    }),
    Object.freeze({
        reason: TrackReason.SAME_PLACE_ONE_WORD_APART,
        test: (a, b) => a.place !== null && a.place === b.place && notesAgree(a, b) && oneWordApart(a.baseWords, b.baseWords)
    }),
    Object.freeze({
        reason: TrackReason.MEDLEY_LISTED_SHORTER,
        test: (a, b) => bothMedleys(a, b) && notesAgree(a, b) && (startsWith(a.baseWords, b.baseWords) || startsWith(b.baseWords, a.baseWords))
    }),
    Object.freeze({
        reason: TrackReason.TITLE_WITH_ITS_PARTS,
        test: (a, b) => notesAgree(a, b) && sameTitleWithParts(a, b)
    }),
    Object.freeze({
        reason: TrackReason.FIRST_OF_TITLES_LISTED_TOGETHER,
        test: (a, b) => notesAgree(a, b) && (firstOfTheListed(a, b) || firstOfTheListed(b, a))
    }),
    Object.freeze({
        reason: TrackReason.TITLE_WITHOUT_ITS_NOTE,
        test: (a, b) => a.base === b.base && a.notes !== b.notes && notesAgree(a, b)
    }),
    Object.freeze({
        reason: TrackReason.TITLE_IN_ITS_BRACKETS,
        test: (a, b) => isTheNoteOf(a, b) || isTheNoteOf(b, a)
    })
])

const titled = (reading) => reading.text !== '' && reading.base !== ''

/** The first tier that says the two readings are the same track, or null. */
const tierOf = (a, b) => (titled(a) && titled(b) ? TIERS.find(tier => tier.test(a, b)) || null : null)

function refusal(a, b) {
    if (a.text === '' || b.text === '') return TrackReason.TITLE_MISSING
    return a.base === b.base ? TrackReason.ANOTHER_RECORDING : TrackReason.TITLE_MISMATCH
}

/**
 * One title of the album against one title of a source, with no other track in sight. It says by
 * which tier the two CAN be the same track; which track really gets an entry is matchTracks' to say.
 * @param {string} albumTitle
 * @param {string} sourceTitle
 * @param {{ albumPlace?: number|null, sourcePlace?: number|null }} [places] - the track numbers, when known
 * @returns {{ same: boolean, reason: string }}
 */
export function compareTrackTitles(albumTitle, sourceTitle, { albumPlace = null, sourcePlace = null } = {}) {
    const a = readTitle(albumTitle, albumPlace)
    const b = readTitle(sourceTitle, sourcePlace)
    const tier = tierOf(a, b)
    return tier ? { same: true, reason: tier.reason } : { same: false, reason: refusal(a, b) }
}

/**
 * Every reason, in one sentence, with a real example: `album` is the album's track, `source` what a
 * source writes; `places` the track numbers when the tier needs them; `refuses` the nearest title
 * that must still be refused (by that tier: the reason it gets instead is `refusedAs`).
 */
export const REASONS_EXPLAINED = Object.freeze([
    Object.freeze({
        reason: TrackReason.SAME_TEXT,
        same: true,
        says: 'the two titles are the same text: case, accents, punctuation, brackets and "&" apart',
        example: { album: '21st Century Schizoid Man (Including "Mirrors")', source: '21st Century Schizoid Man Including Mirrors' },
        refuses: { album: '21st Century Schizoid Man (Radio Version)', source: '21st Century Schizoid Man Including Mirrors', refusedAs: TrackReason.TITLE_MISMATCH }
    }),
    Object.freeze({
        reason: TrackReason.SAME_SONG_DESCRIBED,
        same: true,
        says: 'the same song, described or written differently: a note that only describes is dropped, "Pt. 1" is "Part One", a leading "The" is dropped, a known writing is read as the other',
        example: { album: 'Larks\' Tongues In Aspic, Pt. 1', source: 'Larks\' Tongues In Aspic, Part One' },
        refuses: { album: 'Larks\' Tongues In Aspic, Pt. 1', source: 'Larks\' Tongues In Aspic, Part Two', refusedAs: TrackReason.TITLE_MISMATCH }
    }),
    Object.freeze({
        reason: TrackReason.LETTERS_STARRED_OUT,
        same: true,
        says: 'one side writes some letters of a word as asterisks, one asterisk for each letter; every other word is the same',
        example: { album: 'A N***a Witta Gun', source: 'A Nigga Witta Gun' },
        refuses: { album: 'Lyrical G******g', source: 'Lyrical Gangsta', refusedAs: TrackReason.TITLE_MISMATCH }
    }),
    Object.freeze({
        reason: TrackReason.SAME_PLACE_ONE_WORD_APART,
        same: true,
        says: 'the two are at the same track number, and one title is the other with one word more',
        example: { album: 'My Sarah', source: 'Sarah', places: { albumPlace: 5, sourcePlace: 5 } },
        refuses: { album: 'My Sarah', source: 'Sarah', places: { albumPlace: 5, sourcePlace: 6 }, refusedAs: TrackReason.TITLE_MISMATCH }
    }),
    Object.freeze({
        reason: TrackReason.MEDLEY_LISTED_SHORTER,
        same: true,
        says: 'two medleys, one listing only the first songs of the other',
        example: {
            album: 'Medley: Please Please Please/You\'ve Got The Power/I Found Someone (Live 1962)',
            source: 'Medley: Please, Please, Please/You\'ve Got The Power/I Found Someone/Why Do You Do Me/I Want You So Bad/I Love You So Bad/I Love You, Yes I Do/Strange Things Happen/Bewildered/Please, Please, Please'
        },
        refuses: { album: 'Medley: Please Please Please/You\'ve Got The Power', source: 'Medley: Try Me/You\'ve Got The Power/I Found Someone', refusedAs: TrackReason.TITLE_MISMATCH }
    }),
    Object.freeze({
        reason: TrackReason.TITLE_WITH_ITS_PARTS,
        same: true,
        says: 'the same title before a colon; the parts listed after it are the same once their numbering is dropped, or only one side lists them',
        example: {
            album: 'Close to the Edge: I. The Solid Time of Change, II. Total Mass Retain, III. I Get Up I Get Down, IV. Seasons of Man',
            source: 'Close To The Edge: The Solid Time Of Change / Total Mass Retain / I Get Up, I Get Down / Seasons Of Man'
        },
        refuses: { album: 'Close to the Edge of the World', source: 'Close To The Edge: The Solid Time Of Change / Total Mass Retain', refusedAs: TrackReason.TITLE_MISMATCH }
    }),
    Object.freeze({
        reason: TrackReason.FIRST_OF_TITLES_LISTED_TOGETHER,
        same: true,
        says: 'one side lists two tracks in one title, joined by "/"; the other is the first of them (the second gets nothing: one entry, one track)',
        example: { album: 'The Cinema Show (2007 Stereo Mix)', source: 'The Cinema Show / Aisle Of Plenty' },
        refuses: { album: 'Aisle of Plenty (2007 Stereo Mix)', source: 'The Cinema Show / Aisle Of Plenty', refusedAs: TrackReason.TITLE_MISMATCH }
    }),
    Object.freeze({
        reason: TrackReason.TITLE_WITHOUT_ITS_NOTE,
        same: true,
        says: 'one title is the other without its note (a live take, a version, a subtitle); the weakest tier: the plain title of the album always takes the entry first',
        example: { album: 'I\'ll Go Crazy (Live 1962)', source: 'I\'ll Go Crazy' },
        refuses: { album: 'Lost Someone (Live 1962)', source: 'Lost Someone (Part 1)', refusedAs: TrackReason.ANOTHER_RECORDING }
    }),
    Object.freeze({
        reason: TrackReason.TITLE_IN_ITS_BRACKETS,
        same: true,
        says: 'one title is what the other carries in brackets, two words at least (the other name of the song); the weakest tier',
        example: { album: 'Bang a Gong (Get It On)', source: 'Get It On' },
        refuses: { album: 'Bang a Gong (Get It On)', source: 'Get It', refusedAs: TrackReason.TITLE_MISMATCH }
    }),
    Object.freeze({
        reason: TrackReason.ANOTHER_RECORDING,
        same: false,
        says: 'the same title with two different notes: two recordings of one song',
        example: { album: 'Get Where I Belong (Alternative Take)', source: 'Get Where I Belong (Live)' }
    }),
    Object.freeze({
        reason: TrackReason.TITLE_MISMATCH,
        same: false,
        says: 'no tier says the two titles are the same track',
        example: { album: 'A Man a City (Live at the Fillmore West)', source: 'Moonchild Including The Dream & The Illusion' }
    }),
    Object.freeze({
        reason: TrackReason.TITLE_MISSING,
        same: false,
        says: 'one of the two has no title',
        example: { album: '', source: 'Epitaph' }
    })
])

// ================================================================================================
// 4. THE ASSIGNMENT - one entry of the source goes to one track of the album
// ================================================================================================

/** The title of a track or of an entry of a source, in whichever field it comes. */
function titleOf(item) {
    if (typeof item === 'string') return item
    return (item && (item.title || item.trackTitle || item.name)) || ''
}

const aNumber = (value) => Number.isInteger(value) && value > 0
/** The track number an entry of a source says it has (`trackNumber`), or null. */
const placeOf = (entry) => (aNumber(entry?.trackNumber) ? entry.trackNumber : null)
/**
 * The track number of a track of the album: the one it carries (`position`), else its place in the
 * list. The list is not always in album order: the app keeps the tracks of an album by acclaim too,
 * and asks for the ratings with that list (the second slice of F74: «My Sarah», track 5, was sent
 * in another place and the tier that reads the number never saw it at 5).
 */
const placeOfTrack = (track, index) => (aNumber(track?.position) ? track.position : index + 1)

/**
 * For each track of the album, the entry of the source that is the same track, or null.
 *
 * One to one: an entry goes to one track only. The tiers are tried strongest first over the whole
 * album, so when two tracks claim one entry the stronger tier wins, then the earlier track; the
 * loser stays with nothing. A source that lists a title twice gives one entry to each track of it.
 *
 * @param {Array<string|Object>} albumTracks - a text, or { title | trackTitle | name, position? }; in album
 *        order when they carry no `position`
 * @param {Array<string|Object>} sourceEntries - a text, or { trackTitle | title | name, trackNumber? }
 * @returns {Array<{ entry: *, index: number, reason: string }|null>} one item per track of the album:
 *          the entry as the source gave it, its index in `sourceEntries`, and the reason of the tier
 */
export function matchTracks(albumTracks, sourceEntries) {
    const entries = Array.isArray(sourceEntries) ? sourceEntries : []
    const tracks = (Array.isArray(albumTracks) ? albumTracks : []).map((track, index) => readTitle(titleOf(track), placeOfTrack(track, index)))
    const read = entries.map(entry => readTitle(titleOf(entry), placeOf(entry)))
    const matches = tracks.map(() => null)
    const taken = new Set()

    TIERS.forEach(tier => tracks.forEach((track, index) => {
        if (matches[index] || !titled(track)) return
        const at = read.findIndex((entry, i) => !taken.has(i) && titled(entry) && tier.test(track, entry))
        if (at === -1) return
        taken.add(at)
        matches[index] = { entry: entries[at], index: at, reason: tier.reason }
    }))
    return matches
}

/**
 * The text of a title as the first tier compares it. For the places that have no album to match
 * against and only need to say "these two mentions name the same title" (the ranking of an album
 * whose tracks are not known).
 */
export const trackTextOf = (title) => readTitle(titleOf(title)).text
