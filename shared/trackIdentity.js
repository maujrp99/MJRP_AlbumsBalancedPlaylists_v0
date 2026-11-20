/**
 * trackIdentity - the ONE rule that says "this track of the album and this track of a source are
 * the same track" (F74, UAT-221), in the mould of the album rule (shared/albumIdentity.js).
 *
 * Pure: no network, no DOM, no project import. The app imports it (`@shared/trackIdentity.js`,
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
 *   same-place-one-word-apart  track 5 «My Sarah»                                -> track 5 «Sarah»
 *   medley-listed-shorter      «Medley: Please Please Please/You've Got The Power/I Found Someone (Live 1962)»
 *                                                                                -> the same medley with every song listed
 *   title-without-its-note     «I'll Go Crazy (Live 1962)»                       -> «I'll Go Crazy»
 *   refused
 *   another-recording          «Lost Someone (Live 1962)»                        -> «Lost Someone (Part 1)»
 *   title-mismatch             «Epitaph»                                         -> «Moonchild»
 *   title-missing              «»                                                -> anything
 *
 * THE EXTRA TRACK NEVER TAKES THE RATING OF THE ORIGINAL. `title-without-its-note` is the weakest
 * tier and the assignment is one to one: when the album has «I Talk to the Wind» and «I Talk to the
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

/**
 * Bumped whenever a change of this file can change which track a rating goes to. The ratings of an
 * album that were decided with another version are not believed (the app's server stamps its
 * answer with it; AlbumCacheAdapter compares it on read).
 * 1: F74 (the first rule; before it, the brackets were deleted on both sides).
 */
export const TRACK_IDENTITY_RULE_VERSION = 1

export const TrackReason = Object.freeze({
    /** The two titles are the same text: case, accents, punctuation, brackets and "&" apart. */
    SAME_TEXT: 'same-text',
    /** The same song, described or written differently (a remaster note, "Pt. 1" and "Part One"). */
    SAME_SONG_DESCRIBED: 'same-song-described',
    /** The same place on the album, and one title is the other with one word more. */
    SAME_PLACE_ONE_WORD_APART: 'same-place-one-word-apart',
    /** Two medleys, one listing fewer of the songs. */
    MEDLEY_LISTED_SHORTER: 'medley-listed-shorter',
    /** One title is the other without its note, and the album has the song in no plain form. */
    TITLE_WITHOUT_ITS_NOTE: 'title-without-its-note',
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
    return String(text ?? '')
        .normalize('NFD').replace(DIACRITICS, '')
        .toLowerCase()
        .replace(APOSTROPHES, '')
        .replace(/&/g, ' and ')
        .replace(NOT_A_WORD, ' ')
        .trim()
        .split(' ')
        .filter(Boolean)
}

/** Words two sources write in two ways. */
const SAME_WORD = Object.freeze({ part: 'pt', parts: 'pts', volume: 'vol' })
/** After "Pt" or "Vol", a number is written as a word, in roman or in digits. */
const NUMBERED = new Set(['pt', 'pts', 'vol'])
const NUMBER_WRITTEN = Object.freeze({
    one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10',
    i: '1', ii: '2', iii: '3', iv: '4', v: '5', vi: '6', vii: '7', viii: '8', ix: '9', x: '10'
})

const withoutLeadingThe = (words) => (words.length > 1 && words[0] === 'the' ? words.slice(1) : words)

/** The words with what is only a way of WRITING made equal: "Part One" is "Pt 1", a leading "The" is dropped. */
function writtenAlike(words) {
    const sameWords = words.map(word => SAME_WORD[word] || word)
    const numbered = sameWords.map((word, at) => (NUMBERED.has(sameWords[at - 1]) && NUMBER_WRITTEN[word]) || word)
    return withoutLeadingThe(numbered)
}

/**
 * Titles a source writes in a way no rule can derive: a spelling. Each entry is one track.
 * `example` is where it was seen.
 */
export const KNOWN_WRITINGS = Object.freeze([
    Object.freeze({
        writings: Object.freeze(['Foxey Lady', 'Foxy Lady']),
        example: 'The Jimi Hendrix Experience, «Are You Experienced»: Apple Music writes «Foxey Lady», BestEverAlbums «Foxy Lady»'
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

/**
 * A title as the tiers read it.
 * @param {string} title
 * @param {number|null} place - the track number on the album, when known
 * @returns {{ text: string, written: string, described: string, base: string, baseWords: string[], notes: string, place: number|null }}
 *   text       every word of the title, brackets read as plain words (first tier)
 *   written    the same, with what is only a way of writing made equal
 *   described  the title and its notes that do not merely describe
 *   base       the title outside every note; `baseWords`, its words
 *   notes      the notes that do not merely describe, as one text ('' for none)
 */
function readTitle(title, place = null) {
    const { outside, notes } = splitNotes(title)
    const said = notes.map(wordsOf).filter(words => !describes(words))
    const baseWords = writtenAlike(wordsOf(outside))
    return {
        text: wordsOf(title).join(''),
        written: keyOf(wordsOf(title)),
        described: keyOf([...wordsOf(outside), ...said.flat()]),
        base: keyOf(wordsOf(outside)),
        baseWords,
        notes: said.map(words => words.join('')).join('|'),
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
        reason: TrackReason.SAME_PLACE_ONE_WORD_APART,
        test: (a, b) => a.place !== null && a.place === b.place && notesAgree(a, b) && oneWordApart(a.baseWords, b.baseWords)
    }),
    Object.freeze({
        reason: TrackReason.MEDLEY_LISTED_SHORTER,
        test: (a, b) => bothMedleys(a, b) && notesAgree(a, b) && (startsWith(a.baseWords, b.baseWords) || startsWith(b.baseWords, a.baseWords))
    }),
    Object.freeze({
        reason: TrackReason.TITLE_WITHOUT_ITS_NOTE,
        test: (a, b) => a.base === b.base && a.notes !== b.notes && notesAgree(a, b)
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
        reason: TrackReason.TITLE_WITHOUT_ITS_NOTE,
        same: true,
        says: 'one title is the other without its note (a live take, a version, a subtitle); the weakest tier: the plain title of the album always takes the entry first',
        example: { album: 'I\'ll Go Crazy (Live 1962)', source: 'I\'ll Go Crazy' },
        refuses: { album: 'Lost Someone (Live 1962)', source: 'Lost Someone (Part 1)', refusedAs: TrackReason.ANOTHER_RECORDING }
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

/** The track number an entry of a source says it has (`trackNumber`), or null. */
const placeOf = (entry) => (Number.isInteger(entry?.trackNumber) && entry.trackNumber > 0 ? entry.trackNumber : null)

/**
 * For each track of the album, the entry of the source that is the same track, or null.
 *
 * One to one: an entry goes to one track only. The tiers are tried strongest first over the whole
 * album, so when two tracks claim one entry the stronger tier wins, then the earlier track; the
 * loser stays with nothing. A source that lists a title twice gives one entry to each track of it.
 *
 * @param {Array<string|Object>} albumTracks - in album order; a text, or { title | trackTitle | name }
 * @param {Array<string|Object>} sourceEntries - a text, or { trackTitle | title | name, trackNumber? }
 * @returns {Array<{ entry: *, index: number, reason: string }|null>} one item per track of the album:
 *          the entry as the source gave it, its index in `sourceEntries`, and the reason of the tier
 */
export function matchTracks(albumTracks, sourceEntries) {
    const entries = Array.isArray(sourceEntries) ? sourceEntries : []
    const tracks = (Array.isArray(albumTracks) ? albumTracks : []).map((track, index) => readTitle(titleOf(track), index + 1))
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
