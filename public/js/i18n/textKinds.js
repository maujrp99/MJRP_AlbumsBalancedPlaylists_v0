/**
 * textKinds - the mark of the dictionary that says which keys are not plain text (F82, REQ-12, REQ-14).
 *
 * A key not listed here is PLAIN: one line of text, no markup. A key listed is
 *   'rich'   a running text, edited in the kit's rich editor and stored as the kit's Markdown (read with `tRich`)
 *   'short'  a visible label with the short bar (bold, italic, link; no line break)
 * The validator checks a text by this kind (shared/content/texts.js), in the Painel and on every reader. The list is empty
 * until the keys are converted (F82 TASK-15, TASK-17): a new mark is a new line here.
 */
export const TEXT_KINDS = Object.freeze({})

/**
 * @param {string} key - `area.piece.name`
 * @returns {'plain'|'short'|'rich'}
 */
export const kindOf = (key) => (Object.hasOwn(TEXT_KINDS, key) ? TEXT_KINDS[key] : 'plain')
