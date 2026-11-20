/**
 * The EMPTY `catch` blocks of server/ that are there on purpose, each with its reason (F52, slice 5;
 * read 2026-11-19). An empty catch throws a failure away: nothing is said, and the code goes on as
 * if the thing had worked. test/architecture/noSwallowedFailure.test.js fails on any other.
 *
 * One reason per empty catch of the file, in the order they appear. The list can only shrink:
 *   - a new empty catch fails the test: say what failed (a typed result, a thrown error), or give
 *     the block something to do. Do not add a line here without a reason that a reader accepts;
 *   - when one is removed, remove its reason.
 */
export const EMPTY_CATCH_ALLOWED = Object.freeze({
    'server/index.js': [
        'the File/Blob stand-ins for old Node versions, set up before anything is loaded: if that breaks, the server still starts and the library that needed them says so by itself'
    ],
    'server/lib/normalize.js': [
        'scanning the text of the AI for JSON objects, piece by piece: a piece that does not parse is not one of them; when none parses the caller gets null and answers "unusable"'
    ],
    'server/routes/debug.js': [
        'a debug route (off in production, F59) that shows the raw answer of the AI: when no album can be read from it, the raw answer is still shown'
    ]
})
