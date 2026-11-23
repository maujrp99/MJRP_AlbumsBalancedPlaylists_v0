/**
 * broken - a text as the hand-made template wrote it: broken in lines, with the indentation of the template (F83 wave 7a).
 *
 * The browser draws none of that white space, but it SHAPES the characters it is given: WebKit kerns «Y» with a space after it and not with a line break, so
 * a badge «SPOTIFY» written « SPOTIFY » is 0.19 px wider than the one the hand-made card wrote («\n   SPOTIFY\n  »). The proof in the browser found it (the boxes of two
 * badges); the test of the page cannot (it collapses the white space). The text keeps the line break and the indentation of the template it came from, as ONE text node.
 */

/**
 * @param text - the words
 * @param before - the spaces after the line break that opened the text in the template (0: the text began right after a tag)
 * @param after - the spaces after the line break that closed it
 */
export const broken = (text: string, before: number, after: number): string => `${before ? `\n${' '.repeat(before)}` : ''}${text}\n${' '.repeat(after)}`
