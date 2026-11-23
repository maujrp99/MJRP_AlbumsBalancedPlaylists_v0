/**
 * The lines the database rules need for the crate of the entry page (F82 TASK-04, REQ-03), as a PROPOSAL: `firestore.rules`
 * is the owner's file and only he changes and publishes it. Until he does, the rules refuse `published/crate` (it is not on
 * their closed list of documents) and the Painel's save of the crate says so («the rules do not accept this save yet»).
 *
 * Two additions, nothing else changes:
 *   1. a function for the document, beside validRecipes(): the closed list of fields, the two sides as lists inside the
 *      limits of shared/content/crate.js (CRATE_LIMITS: side A 6 to 10, side B 4 to 10), `previous` with at most the two sides;
 *   2. one more line in validPublished(docId), for the document `crate`.
 * The rules cannot walk a list, so an album is not checked there: the Painel checks it before saving and the entry page
 * checks it again on reading (the validator of shared/content/crate.js), as for the texts.
 *
 * The rules test (test/security/firestoreRules.emulator.js) runs the rules WITH these lines in the emulator, so what is
 * proposed is proven: the administrator is accepted, everybody else and every other shape are refused.
 */

/** 1. Goes right before `function validPublished(docId) {`. */
export const VALID_CRATE = `    function validCrate() {
      return request.resource.data.keys().hasOnly(['_schemaVersion', 'rev', 'previous', 'sideA', 'sideB'])
        && request.resource.data.keys().hasAll(['_schemaVersion', 'rev', 'sideA', 'sideB'])
        && hasVersionAndRev()
        && request.resource.data.sideA is list && request.resource.data.sideA.size() >= 6 && request.resource.data.sideA.size() <= 10
        && request.resource.data.sideB is list && request.resource.data.sideB.size() >= 4 && request.resource.data.sideB.size() <= 10
        && previousIsMapIfPresent() && previousIsSmall(2);
    }
`

/** 2. The last line of validPublished(docId), as it is today, and as it becomes. */
export const LIST_TODAY = `        || (docId == 'recipes' && validRecipes());`
export const LIST_PROPOSED = `        || (docId == 'recipes' && validRecipes())
        || (docId == 'crate' && validCrate());`

const ANCHOR = '    function validPublished(docId) {'

/** The rules already know the crate (the owner added the lines). */
export const knowsCrate = (rules) => rules.includes("docId == 'crate'")

/**
 * The rules with the two additions. Rules that already have them come back as they are; rules where the places to add
 * them are not found are an error (the proposal no longer matches the file: write it again).
 * @param {string} rules - the text of firestore.rules
 * @returns {string}
 */
export function withCrateRules(rules) {
    if (knowsCrate(rules)) return rules
    if (!rules.includes(ANCHOR) || !rules.includes(LIST_TODAY)) throw new Error('crateRulesProposal: firestore.rules changed where the crate lines go; the proposal must be written again')
    return rules.replace(ANCHOR, `${VALID_CRATE}${ANCHOR}`).replace(LIST_TODAY, LIST_PROPOSED)
}
