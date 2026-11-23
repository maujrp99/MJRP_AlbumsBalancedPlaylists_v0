// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
/**
 * The Markdown of the rich text (F128, ADR-0015; the kit's core since F332): the reader and the writer of the kit's dialect,
 * the same for the editor and for the site, so what the field saves is what the page draws.
 *
 * The dialect is common Markdown plus what Obsidian and Pandoc already read: `++underline++`, `==highlight==`,
 * `^superscript^`, `~subscript~`, the `> [!NOTE]` callout, the size of a stretch `[text]{.small}` (`.large`, `.xlarge`; the
 * Pandoc span with one class of that closed set, F332 REQ-08), and three media written alone in a paragraph — an image
 * `![description](/file.jpg "caption")` (`#largo` at the end of the address for the wider one), a YouTube or Vimeo
 * address as `![caption](https://…)`, and a book card `[Title](/livro/slug "livro")`. There is no HTML: a tag is text.
 *
 * The reader is the contract (CC-ADR-0068): a text already published reads the same in every new version, which the corpus
 * of the harness (`tests/corpus/`) holds.
 *
 * Pure JavaScript with JSDoc types: no package, no engine global.
 */
import { BOOK_SLUG, bookPath, bookSlugOf, safeHref, safeImage, videoOf } from './doc.js';

/** @typedef {import('./doc.js').RichBlock} RichBlock */
/** @typedef {import('./doc.js').RichDoc} RichDoc */
/** @typedef {import('./doc.js').RichInline} RichInline */
/** @typedef {import('./doc.js').RichMarkKind} RichMarkKind */
/** @typedef {import('./doc.js').RichSize} RichSize */
/** A span that holds other spans: a mark, a size or a link. @typedef {Extract<RichInline, { c: RichInline[] }>} RichContainer */
/** A mark or a size. @typedef {Exclude<RichContainer, { t: 'link' }>} RichStyled */

// ---------------------------------------------------------------- reading

const HEADING = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?[ \t]*$/;
const RULE = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;
const QUOTE = /^ {0,3}>/;
const ITEM = /^([ \t]*)([-*+]|(\d{1,9})[.)])(?:[ \t]+(.*))?$/;
const IMAGE_LINE = /^!\[((?:\\.|[^\]\\])*)\]\(\s*([^\s()]+)(?:\s+"((?:\\.|[^"\\])*)")?\s*\)$/;
const BOOK_LINE = /^\[((?:\\.|[^\]\\])*)\]\(\s*([^\s()]+)\s+"livro"\s*\)$/;
const CALLOUT = /^\[!([A-Za-z]+)\][+-]?[ \t]*(.*)$/;
const SIZE_ATTR = /^\{\.(small|large|xlarge)\}/;
const WIDE = '#largo';

/**
 * Undo the backslash escapes of a label, a caption or a title.
 * @param {string} text
 */
const unescape = (text) => text.replace(/\\([!-/:-@[-`{-~])/g, '$1');

/** @param {string} line */
const isItem = (line) => ITEM.test(line) && !RULE.test(line);
/**
 * The parts of a list item line: indentation, number (undefined for a bullet) and text; null when it is not one.
 * @param {string} line
 * @returns {{ indent: number; number: string | undefined; text: string | undefined } | null}
 */
function itemOf(line) {
    const item = isItem(line) ? ITEM.exec(line) : null;
    return item ? { indent: item[1].length, number: item[3], text: item[4] } : null;
}

/**
 * A line that starts a block of its own, even right under a paragraph line (an ordered list only from «1.», as in CommonMark).
 * @param {string} line
 */
function startsBlock(line) {
    if (HEADING.test(line) || RULE.test(line) || QUOTE.test(line)) return true;
    const item = ITEM.exec(line);
    if (!item || item[1].length > 3 || !item[4]?.trim()) return false;
    return item[3] === undefined || item[3] === '1';
}

/**
 * The lines of a paragraph: the indentation and the hard-break marks out, joined by a line break.
 * @param {string[]} lines
 */
function joinLines(lines) {
    return lines.map((line) => line.replace(/^[ \t]+/, '').replace(/(?:[ \t]{2,}|\\)$/, '').replace(/[ \t]+$/, '')).join('\n');
}

/**
 * @param {{ provider: 'youtube' | 'vimeo'; id: string }} video
 * @returns {string}
 */
const canonicalVideo = (video) =>
    video.provider === 'youtube' ? `https://www.youtube.com/watch?v=${video.id}` : `https://vimeo.com/${video.id}`;

/**
 * A media line alone in its paragraph, or null.
 * @param {string} line
 * @returns {RichBlock | null}
 */
function mediaOf(line) {
    const text = line.trim();
    const image = IMAGE_LINE.exec(text);
    if (image) {
        const [, rawAlt, rawSrc, rawTitle] = image;
        const alt = unescape(rawAlt).trim();
        const title = rawTitle === undefined ? '' : unescape(rawTitle).trim();
        const video = videoOf(rawSrc);
        if (video) return { t: 'video', provider: video.provider, id: video.id, url: canonicalVideo(video), caption: alt || title };
        const wide = rawSrc.endsWith(WIDE);
        const src = safeImage(wide ? rawSrc.slice(0, -WIDE.length) : rawSrc);
        // An image of an address the site does not take keeps its description as text, so nothing written is lost.
        if (!src) return { t: 'p', c: alt ? [{ t: 'text', v: alt }] : [] };
        return { t: 'image', src, alt, caption: title, wide };
    }
    const book = BOOK_LINE.exec(text);
    if (book) {
        const slug = bookSlugOf(book[2]);
        if (slug) return { t: 'book', slug, title: unescape(book[1]).trim() };
    }
    return null;
}

/**
 * The paragraphs inside a quote, split by blank lines.
 * @param {string[]} lines
 * @returns {RichInline[][]}
 */
function paragraphsOf(lines) {
    /** @type {RichInline[][]} */
    const out = [];
    /** @type {string[]} */
    let current = [];
    const flush = () => {
        if (current.length) out.push(parseInline(joinLines(current)));
        current = [];
    };
    for (const line of lines) {
        if (!line.trim()) flush();
        else current.push(line);
    }
    flush();
    return out.filter((spans) => spans.length > 0);
}

/**
 * The quote or callout that starts at `at`: the block and the line after it.
 * @param {string[]} lines
 * @param {number} at
 * @returns {{ block: RichBlock | null; next: number }}
 */
function quoteAt(lines, at) {
    /** @type {string[]} */
    const inner = [];
    let i = at;
    while (i < lines.length && QUOTE.test(lines[i])) inner.push(lines[i++].replace(/^ {0,3}> ?/, ''));
    const first = inner.findIndex((text) => text.trim());
    const callout = first >= 0 ? CALLOUT.exec(inner[first].trim()) : null;
    if (callout) {
        const rest = [...(callout[2] ? [callout[2]] : []), ...inner.slice(first + 1)];
        return { block: { t: 'callout', c: paragraphsOf(rest) }, next: i };
    }
    const c = paragraphsOf(inner);
    return { block: c.length ? { t: 'quote', c } : null, next: i };
}

/**
 * Whether the line after a blank one goes on with the list: an item of the same kind, or a nested one of either.
 * @param {string} line
 * @param {boolean} ordered
 */
function continuesList(line, ordered) {
    const item = itemOf(line);
    return !!item && ((item.number !== undefined) === ordered || item.indent >= 2);
}

/**
 * Where the list goes on after the blank lines that start at `i`, or -1 when it ends there.
 * @param {string[]} lines
 * @param {number} i
 * @param {boolean} ordered
 */
function afterBlank(lines, i, ordered) {
    let next = i + 1;
    while (next < lines.length && !lines[next].trim()) next++;
    return next < lines.length && continuesList(lines[next], ordered) ? next : -1;
}

/**
 * Take line `i` into the list: the line to read next, or -1 when the list ends before it.
 * @param {string[]} lines
 * @param {number} i
 * @param {boolean} ordered
 * @param {string[][]} items the lines of each item so far, changed in place
 */
function listStep(lines, i, ordered, items) {
    const current = lines[i];
    const item = itemOf(current);
    if (item) {
        // A list of the other kind starts a list of its own, unless it is nested (then it comes up to this one).
        if (item.indent < 2 && (item.number !== undefined) !== ordered) return -1;
        // A nested item of either kind comes up to this list: the dialect has one level.
        items.push([item.text ?? '']);
        return i + 1;
    }
    if (!current.trim()) return afterBlank(lines, i, ordered);
    if (/^[ \t]{2,}/.test(current) || !startsBlock(current)) {
        items[items.length - 1].push(current);
        return i + 1;
    }
    return -1;
}

/**
 * The list that starts at `at`: the block and the line after it.
 * @param {string[]} lines
 * @param {number} at
 * @returns {{ block: RichBlock; next: number }}
 */
function listAt(lines, at) {
    const head = /** @type {NonNullable<ReturnType<typeof itemOf>>} */ (itemOf(lines[at]));
    const ordered = head.number !== undefined;
    const start = ordered ? Number(head.number) : undefined;
    /** @type {string[][]} */
    const items = [];
    let i = at;
    while (i < lines.length) {
        const next = listStep(lines, i, ordered, items);
        if (next < 0) break;
        i = next;
    }
    const c = items.map((item) => parseInline(joinLines(item)));
    /** @type {RichBlock} */
    const block = ordered ? { t: 'ol', c, ...(start !== undefined && start !== 1 ? { start } : {}) } : { t: 'ul', c };
    return { block, next: i };
}

/**
 * The heading read from its line: «####» is the large text, any other level the subtitle; none when it has no text.
 * @param {RegExpExecArray} heading
 * @param {number} next
 * @returns {{ block: RichBlock | null; next: number }}
 */
function headingBlock(heading, next) {
    const spans = parseInline((heading[2] ?? '').replace(/(?:^|[ \t]+)#+$/, ''));
    return { block: spans.length ? { t: heading[1].length === 4 ? 'lead' : 'h3', c: spans } : null, next };
}

/**
 * The media of line `i`, when the line is alone in its paragraph (the next one is blank, or there is none); else null.
 * @param {string[]} lines
 * @param {number} i
 * @returns {{ block: RichBlock | null; next: number } | null}
 */
function mediaAlone(lines, i) {
    const alone = i + 1 >= lines.length || !lines[i + 1].trim();
    const media = alone ? mediaOf(lines[i]) : null;
    if (!media) return null;
    return { block: media.t !== 'p' || media.c.length ? media : null, next: i + 1 };
}

/**
 * The block that starts at line `i`, when the line starts one (a heading, a rule, a quote, a list, a media line alone);
 * null when the line is text of a paragraph.
 * @param {string[]} lines
 * @param {number} i
 * @param {boolean} startsHere
 * @returns {{ block: RichBlock | null; next: number } | null}
 */
function blockAt(lines, i, startsHere) {
    const line = lines[i];
    const heading = HEADING.exec(line);
    if (heading) return headingBlock(heading, i + 1);
    if (RULE.test(line)) return { block: { t: 'hr' }, next: i + 1 };
    if (QUOTE.test(line)) return quoteAt(lines, i);
    if (isItem(line)) return listAt(lines, i);
    return startsHere ? mediaAlone(lines, i) : null;
}

/**
 * Read the dialect into a document. Anything it does not know is text.
 * @param {string} markdown
 * @returns {RichDoc}
 */
export function parseRich(markdown) {
    const lines = String(markdown ?? '').replace(/\r\n?/g, '\n').split('\u0000').join('').split('\n');
    /** @type {RichDoc} */
    const doc = [];
    /** @type {string[]} */
    let paragraph = [];
    const flush = () => {
        if (paragraph.length) {
            const spans = parseInline(joinLines(paragraph));
            if (spans.length) doc.push({ t: 'p', c: spans });
        }
        paragraph = [];
    };
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        if (!line.trim()) {
            flush();
            i++;
            continue;
        }
        const startsHere = paragraph.length === 0;
        const found = startsHere || startsBlock(line) ? blockAt(lines, i, startsHere) : null;
        if (found) {
            flush();
            if (found.block) doc.push(found.block);
            i = found.next;
            continue;
        }
        paragraph.push(line);
        i++;
    }
    flush();
    return doc;
}

const PUNCT = /[!-/:-@[-`{-~]/;
const SPACE = /\s/;
const WORD = /[\p{L}\p{N}]/u;
/** The delimiters of the marks, longest first. @type {Array<[string, RichMarkKind]>} */
const DELIMITERS = [['**', 'strong'], ['__', 'strong'], ['~~', 's'], ['==', 'mark'], ['++', 'u'], ['*', 'em'], ['_', 'em'], ['^', 'sup'], ['~', 'sub']];
const MAX_DEPTH = 24;

/**
 * The end of a code span starting at `at` (a run of backticks), or null.
 * @param {string} src
 * @param {number} at
 * @returns {{ end: number; ticks: number } | null}
 */
function codeEnd(src, at) {
    let ticks = 0;
    while (src[at + ticks] === '`') ticks++;
    const fence = '`'.repeat(ticks);
    let from = at + ticks;
    while (from < src.length) {
        const found = src.indexOf(fence, from);
        if (found < 0) return null;
        let run = 0;
        while (src[found + run] === '`') run++;
        if (run === ticks) return { end: found, ticks };
        from = found + run;
    }
    return null;
}

/**
 * The `]` that closes the `[` at `at`, skipping escapes and code spans; -1 when none does.
 * @param {string} src
 * @param {number} at
 */
function bracketClose(src, at) {
    let depth = 0;
    for (let k = at; k < src.length; k++) {
        const char = src[k];
        if (char === '\\') { k++; continue; }
        if (char === '`') { const code = codeEnd(src, k); if (code) { k = code.end + code.ticks - 1; continue; } }
        if (char === '[') depth++;
        else if (char === ']') { depth--; if (depth === 0) return k; }
    }
    return -1;
}

/**
 * A link `[label](destination "title")` starting at `at` (the `[`): its parts and where it ends, or null.
 * @param {string} src
 * @param {number} at
 * @returns {{ label: string; href: string; title?: string; end: number } | null}
 */
function linkAt(src, at) {
    const close = bracketClose(src, at);
    if (close < 0 || src[close + 1] !== '(') return null;
    const rest = /^\(\s*(<[^<>\n]*>|[^\s()<>]*(?:\([^\s()<>]*\)[^\s()<>]*)*)(?:\s+"((?:\\.|[^"\\])*)")?\s*\)/.exec(src.slice(close + 1));
    if (!rest) return null;
    const href = rest[1].startsWith('<') ? rest[1].slice(1, -1) : rest[1];
    return { label: src.slice(at + 1, close), href: unescape(href), title: rest[2] === undefined ? undefined : unescape(rest[2]), end: close + 1 + rest[0].length };
}

/**
 * A size `[text]{.large}` starting at `at` (the `[`): the text, the size and where it ends, or null (F332, REQ-08). Only one
 * class, of the closed set: any other attribute is text.
 * @param {string} src
 * @param {number} at
 * @returns {{ label: string; size: RichSize; end: number } | null}
 */
function sizeAt(src, at) {
    const close = bracketClose(src, at);
    if (close < 0 || src[close + 1] !== '{') return null;
    const attr = SIZE_ATTR.exec(src.slice(close + 1));
    if (!attr) return null;
    return { label: src.slice(at + 1, close), size: /** @type {RichSize} */ (attr[1]), end: close + 1 + attr[0].length };
}

/**
 * @param {string} src
 * @param {number} at
 * @param {string} delim
 */
const canOpen = (src, at, delim) => {
    const after = src[at + delim.length];
    if (after === undefined || SPACE.test(after)) return false;
    if (delim[0] === '_' && at > 0 && WORD.test(src[at - 1])) return false;
    return true;
};
/**
 * @param {string} src
 * @param {number} at
 * @param {string} delim
 */
const canClose = (src, at, delim) => {
    const before = src[at - 1];
    if (before === undefined || SPACE.test(before)) return false;
    if (delim[0] === '_' && WORD.test(src[at + delim.length] ?? '')) return false;
    return true;
};

/**
 * Where a span that the closer skips whole ends (an escape, a code span, a link or a size), or -1 when none starts at `k`.
 * @param {string} src
 * @param {number} k
 */
function skipAt(src, k) {
    const char = src[k];
    if (char === '\\') return k + 2;
    if (char === '`') { const code = codeEnd(src, k); return code ? code.end + code.ticks : -1; }
    if (char === '[') { const span = linkAt(src, k) ?? sizeAt(src, k); return span ? span.end : -1; }
    return -1;
}

/**
 * Where a run of `run` delimiter characters at `k` closes the mark: at the end of a run longer than the delimiter, so the
 * inner mark keeps its own («**a *b***»); -1 for the run of two that a single delimiter skips, which is a pair of its own.
 * @param {number} k
 * @param {number} run
 * @param {string} delim
 */
function closeOfRun(k, run, delim) {
    if (run <= delim.length) return k;
    return delim.length === 1 && run === 2 ? -1 : k + run - delim.length;
}

/**
 * How many times the character at `k` repeats from there.
 * @param {string} src
 * @param {number} k
 */
function runAt(src, k) {
    let run = 0;
    while (src[k + run] === src[k]) run++;
    return run;
}

/**
 * Where the mark opened at `at` closes, skipping escapes, code spans, links, sizes and the runs of a longer delimiter; -1
 * when it does not.
 * @param {string} src
 * @param {number} at
 * @param {string} delim
 */
function closerOf(src, at, delim) {
    // Sub and superscript live inside one line.
    const inOneLine = delim === '^' || delim === '~';
    for (let k = at + delim.length; k < src.length; k++) {
        if (inOneLine && src[k] === '\n') return -1;
        const skip = skipAt(src, k);
        if (skip >= 0) { k = skip - 1; continue; }
        if (!src.startsWith(delim, k)) continue;
        const run = runAt(src, k);
        const close = closeOfRun(k, run, delim);
        if (close > at + delim.length && canClose(src, close, delim)) return close;
        k += run - 1;
    }
    return -1;
}

/**
 * The spans of a link's or a size's text, read one level deeper (as text past the deepest level).
 * @param {string} label
 * @param {number} depth
 * @returns {RichInline[]}
 */
const labelSpans = (label, depth) => (depth < MAX_DEPTH ? parseInline(label, depth + 1) : [{ t: 'text', v: label }]);

/**
 * The mark that opens at `i`, read whole: the span and where it ends; null when no delimiter opens and closes there.
 * @param {string} src
 * @param {number} i
 * @param {number} depth
 * @param {Map<string, number>} exhausted
 * @returns {{ span: RichInline | null; end: number } | null}
 */
function markAt(src, i, depth, exhausted) {
    if (depth >= MAX_DEPTH) return null;
    for (const [delim, kind] of DELIMITERS) {
        if (!src.startsWith(delim, i) || !canOpen(src, i, delim)) continue;
        if ((exhausted.get(delim) ?? Infinity) <= i) continue;
        const close = closerOf(src, i, delim);
        if (close < 0) { exhausted.set(delim, i); continue; }
        const inner = parseInline(src.slice(i + delim.length, close), depth + 1);
        return { span: inner.length ? { t: kind, c: inner } : null, end: close + delim.length };
    }
    return null;
}

/**
 * The link, the image or the size that opens at `i` (a `[` or a `![`): its spans and where it ends; null when none does.
 * An image inside a paragraph keeps only its text; a link to an address the site does not take keeps its text.
 * @param {string} src
 * @param {number} i
 * @param {number} depth
 * @returns {{ spans: RichInline[]; end: number } | null}
 */
function bracketAt(src, i, depth) {
    const image = src[i] === '!';
    const link = linkAt(src, image ? i + 1 : i);
    if (link) {
        const label = labelSpans(link.label, depth);
        const href = image ? null : safeHref(link.href);
        return { spans: href && label.length ? [{ t: 'link', href, c: label }] : label, end: link.end };
    }
    const size = image ? null : sizeAt(src, i);
    if (size) {
        const label = labelSpans(size.label, depth);
        return { spans: label.length ? [{ t: 'size', size: size.size, c: label }] : [], end: size.end };
    }
    return null;
}

/**
 * The code span or the run of backticks at `i`: its span (null for a run left as text) and where it ends.
 * @param {string} src
 * @param {number} i
 * @returns {{ span: RichInline | null; text: string; end: number }}
 */
function codeAt(src, i) {
    const code = codeEnd(src, i);
    if (code) {
        let v = src.slice(i + code.ticks, code.end).replace(/\n/g, ' ');
        if (v.length > 2 && v.startsWith(' ') && v.endsWith(' ')) v = v.slice(1, -1);
        return { span: { t: 'code', v }, text: '', end: code.end + code.ticks };
    }
    let run = 0;
    while (src[i + run] === '`') run++;
    return { span: null, text: src.slice(i, i + run), end: i + run };
}

/** The spans read so far and the text that is not a span yet. @typedef {{ out: RichInline[]; text: string }} Reading */

/**
 * Spans into the reading, after the text that came before them.
 * @param {Reading} reading
 * @param {RichInline[]} nodes
 */
function pushSpans(reading, nodes) {
    if (!nodes.length) return;
    if (reading.text) reading.out.push({ t: 'text', v: reading.text });
    reading.text = '';
    reading.out.push(...nodes);
}

/**
 * The escape at `i` (a backslash before a sign, or before the end of a line, which is a line break): where it ends, or -1
 * when there is none.
 * @param {string} src
 * @param {number} i
 * @param {Reading} reading
 */
function readEscape(src, i, reading) {
    if (src[i] !== '\\' || i + 1 >= src.length) return -1;
    const next = src[i + 1];
    if (next === '\n') pushSpans(reading, [{ t: 'br' }]);
    else if (PUNCT.test(next)) reading.text += next;
    else return -1;
    return i + 2;
}

/**
 * The code span or the run of backticks at `i` into the reading: where it ends.
 * @param {string} src
 * @param {number} i
 * @param {Reading} reading
 */
function readCode(src, i, reading) {
    const code = codeAt(src, i);
    if (code.span) pushSpans(reading, [code.span]);
    else reading.text += code.text;
    return code.end;
}

/**
 * @param {string} src
 * @param {number} i
 */
const opensBracket = (src, i) => src[i] === '[' || (src[i] === '!' && src[i + 1] === '[');

/**
 * Read what starts at `i` into the reading: where the next thing starts.
 * @param {string} src
 * @param {number} i
 * @param {number} depth
 * @param {Map<string, number>} exhausted
 * @param {Reading} reading
 */
function readAt(src, i, depth, exhausted, reading) {
    const escaped = readEscape(src, i, reading);
    if (escaped >= 0) return escaped;
    const char = src[i];
    if (char === '\n') { pushSpans(reading, [{ t: 'br' }]); return i + 1; }
    if (char === '`') return readCode(src, i, reading);
    const bracket = opensBracket(src, i) ? bracketAt(src, i, depth) : null;
    // A link with no text leaves nothing: the text on each side joins, as it always did.
    if (bracket) { pushSpans(reading, bracket.spans); return bracket.end; }
    const mark = markAt(src, i, depth, exhausted);
    if (mark) { pushSpans(reading, mark.span ? [mark.span] : []); return mark.end; }
    reading.text += char;
    return i + 1;
}

/**
 * Read the spans of a paragraph: the marks, the sizes, the links, the code, the line breaks; everything else is text.
 * @param {string} src
 * @param {number} [depth]
 * @returns {RichInline[]}
 */
export function parseInline(src, depth = 0) {
    /** @type {Reading} */
    const reading = { out: [], text: '' };
    // A delimiter that found no closer from a position finds none from any later one: it is not searched again.
    /** @type {Map<string, number>} */
    const exhausted = new Map();
    let i = 0;
    while (i < src.length) i = readAt(src, i, depth, exhausted, reading);
    if (reading.text) reading.out.push({ t: 'text', v: reading.text });
    return mergeText(reading.out);
}

/**
 * @param {RichInline[]} spans
 * @returns {RichInline[]}
 */
function mergeText(spans) {
    /** @type {RichInline[]} */
    const out = [];
    for (const span of spans) {
        const last = out[out.length - 1];
        if (span.t === 'text' && last?.t === 'text') out[out.length - 1] = { t: 'text', v: last.v + span.v };
        else out.push(span);
    }
    return out;
}

// ---------------------------------------------------------------- the shape that writes back the same

/** @type {string[]} */
const MARKS = ['strong', 'em', 'u', 's', 'mark', 'sup', 'sub'];
/**
 * @param {RichInline | undefined} span
 * @returns {span is Extract<RichInline, { t: RichMarkKind }>}
 */
const isMark = (span) => !!span && MARKS.includes(span.t);
/**
 * A mark or a size: what moves its edge spaces out and joins a neighbour of the same kind.
 * @param {RichInline | undefined} span
 * @returns {span is RichStyled}
 */
const isStyled = (span) => isMark(span) || span?.t === 'size';
/**
 * A mark's kind, or a size's with its size: two spans of one key are one span.
 * @param {RichStyled} span
 */
const keyOf = (span) => (span.t === 'size' ? `size.${span.size}` : span.t);
/**
 * @param {RichInline | undefined} span
 * @returns {span is RichContainer}
 */
const hasChildren = (span) => isStyled(span) || span?.t === 'link';

/**
 * A styled span with new children.
 * @param {RichStyled} span
 * @param {RichInline[]} c
 * @returns {RichInline}
 */
const withChildren = (span, c) => (span.t === 'size' ? { t: 'size', size: span.size, c } : { t: span.t, c });

/**
 * The spaces and breaks at the start of a styled span's children, taken out of them.
 * @param {RichInline[]} c the children, changed in place
 * @returns {RichInline[]}
 */
function leadOut(c) {
    /** @type {RichInline[]} */
    const lead = [];
    while (c.length && (c[0].t === 'br' || (c[0].t === 'text' && /^\s/.test(c[0].v)))) {
        const first = c[0];
        if (first.t === 'text') {
            const trimmed = first.v.replace(/^\s+/, '');
            lead.push({ t: 'text', v: first.v.slice(0, first.v.length - trimmed.length) });
            if (trimmed) c[0] = { t: 'text', v: trimmed }; else c.shift();
        } else lead.push(/** @type {RichInline} */ (c.shift()));
    }
    return lead;
}

/**
 * The spaces and breaks at the end of a styled span's children, taken out of them.
 * @param {RichInline[]} c the children, changed in place
 * @returns {RichInline[]}
 */
function tailOut(c) {
    /** @type {RichInline[]} */
    const tail = [];
    while (c.length) {
        const last = c[c.length - 1];
        if (!(last.t === 'br' || (last.t === 'text' && /\s$/.test(last.v)))) break;
        if (last.t === 'text') {
            const trimmed = last.v.replace(/\s+$/, '');
            tail.unshift({ t: 'text', v: last.v.slice(trimmed.length) });
            if (trimmed) c[c.length - 1] = { t: 'text', v: trimmed }; else c.pop();
        } else tail.unshift(/** @type {RichInline} */ (c.pop()));
    }
    return tail;
}

/**
 * The spaces and breaks at the edges of a styled span's children, moved out of it.
 * @param {RichInline[]} c the children, changed in place
 * @returns {{ lead: RichInline[]; tail: RichInline[] }}
 */
function edgesOut(c) {
    const lead = leadOut(c);
    return { lead, tail: tailOut(c) };
}

/**
 * A text in the normal shape: a line break is a span of its own, a no-break space is a space.
 * @param {string} v
 * @returns {RichInline[]}
 */
function textSpans(v) {
    /** @type {RichInline[]} */
    const out = [];
    v.replace(/\u00A0/g, ' ').replace(/\r/g, '').split('\n').forEach((part, index) => {
        if (index > 0) out.push({ t: 'br' });
        if (part) out.push({ t: 'text', v: part });
    });
    return out;
}

/**
 * A link in the normal shape: none without text, only its text when the address is one the site does not take.
 * @param {Extract<RichInline, { t: 'link' }>} span
 * @param {string[]} inside
 * @returns {RichInline[]}
 */
function linkSpans(span, inside) {
    const href = safeHref(span.href);
    const c = normalizeInline(span.c, inside);
    if (!c.length) return [];
    return href ? [{ t: 'link', href, c }] : c;
}

/**
 * A mark or a size in the normal shape: undone inside one of its own kind, its edge spaces moved out, none when empty.
 * @param {RichStyled} span
 * @param {string[]} inside
 * @returns {RichInline[]}
 */
function styledSpans(span, inside) {
    const key = keyOf(span);
    if (inside.includes(key)) return normalizeInline(span.c, inside);
    const c = normalizeInline(span.c, [...inside, key]);
    // Sub and superscript live inside one line.
    if ((span.t === 'sup' || span.t === 'sub') && c.some((node) => node.t === 'br')) return c;
    const { lead, tail } = edgesOut(c);
    return [...lead, ...(c.length ? [withChildren(span, c)] : []), ...tail];
}

/**
 * One span in the normal shape, as the spans it becomes.
 * @param {RichInline} span
 * @param {string[]} inside the keys of the styled spans around it
 * @returns {RichInline[]}
 */
function normalizeSpan(span, inside) {
    switch (span.t) {
        case 'text': return textSpans(span.v);
        case 'code': return span.v ? [{ t: 'code', v: span.v.replace(/\n/g, ' ') }] : [];
        case 'br': return [span];
        case 'link': return linkSpans(span, inside);
        default: return styledSpans(span, inside);
    }
}

/**
 * The spans in the one shape the writer and the reader agree on: texts joined, empty marks out, a mark inside the same
 * mark undone, the spaces at the edge of a mark moved out of it, line breaks as their own span, no break at the edges.
 * A size behaves as a mark of its own kind (F332).
 * @param {RichInline[]} spans
 * @param {string[]} [inside]
 * @returns {RichInline[]}
 */
export function normalizeInline(spans, inside = []) {
    const flat = spans.flatMap((span) => normalizeSpan(span, inside));
    // Neighbouring marks of one kind are one mark.
    /** @type {RichInline[]} */
    const joined = [];
    for (const span of mergeText(flat)) {
        const last = joined[joined.length - 1];
        if (isStyled(last) && isStyled(span) && keyOf(last) === keyOf(span)) {
            joined[joined.length - 1] = withChildren(span, normalizeInline([...last.c, ...span.c], [...inside, keyOf(span)]));
        } else joined.push(span);
    }
    return separateTildes(mergeText(joined));
}

/**
 * The subscript (`~`) and the strikethrough (`~~`) cannot touch: «~~~a~~~» reads either way. Where they would, the
 * subscript gives way and its text stays — a case the toolbar makes only by stacking both on the same letters.
 * @param {RichInline[]} spans
 * @returns {RichInline[]}
 */
function separateTildes(spans) {
    /**
     * @param {RichInline} span
     * @param {RichMarkKind} kind
     */
    const edgeIs = (span, kind) => isMark(span) && (span.c[0]?.t === kind || span.c[span.c.length - 1]?.t === kind);
    /** @param {number} index */
    const besideStrike = (index) => spans[index - 1]?.t === 's' || spans[index + 1]?.t === 's';
    /** @type {RichInline[]} */
    const out = [];
    spans.forEach((span, index) => {
        if (span.t === 'sub' && (besideStrike(index) || edgeIs(span, 's') || out[out.length - 1]?.t === 's')) { out.push(...span.c); return; }
        if (span.t === 's' && edgeIs(span, 'sub')) { out.push({ t: 's', c: span.c.flatMap((child, at) => (child.t === 'sub' && (at === 0 || at === span.c.length - 1) ? child.c : [child])) }); return; }
        out.push(span);
    });
    return mergeText(out);
}

/**
 * The spans of a list without the spaces and breaks at one edge, going into the marks and links at that edge.
 * @param {RichInline[]} list changed in place
 * @param {boolean} end
 * @returns {RichInline[]}
 */
function trimEdge(list, end) {
    while (list.length) {
        const at = end ? list.length - 1 : 0;
        const node = list[at];
        if (node.t === 'br') { list.splice(at, 1); continue; }
        if (node.t === 'text') {
            const v = end ? node.v.replace(/\s+$/, '') : node.v.replace(/^\s+/, '');
            if (!v) { list.splice(at, 1); continue; }
            list[at] = { t: 'text', v };
            return list;
        }
        if (hasChildren(node)) {
            const inner = trimEdge([...node.c], end);
            if (!inner.length) { list.splice(at, 1); continue; }
            list[at] = { ...node, c: inner };
        }
        return list;
    }
    return list;
}

/**
 * Spaces around a line break are what the reader takes off a line.
 * @param {RichInline[]} list
 * @returns {RichInline[]}
 */
function aroundBreaks(list) {
    return list.map((node, index) => {
        if (node.t === 'text') {
            let v = node.v;
            if (list[index + 1]?.t === 'br') v = v.replace(/[ \t]+$/, '');
            if (list[index - 1]?.t === 'br') v = v.replace(/^[ \t]+/, '');
            return /** @type {RichInline} */ ({ t: 'text', v });
        }
        if (hasChildren(node)) return /** @type {RichInline} */ ({ ...node, c: aroundBreaks(node.c) });
        return node;
    }).filter((node) => node.t !== 'text' || node.v);
}

/**
 * A block's spans without the spaces and breaks at its edges, and with a space run of the text as the reader leaves it.
 * @param {RichInline[]} spans
 * @returns {RichInline[]}
 */
function blockSpans(spans) {
    const c = normalizeInline(spans);
    return normalizeInline(aroundBreaks(trimEdge(trimEdge(c, false), true)));
}

/**
 * Split the spans at two line breaks in a row: an empty line is a new paragraph.
 * @param {RichInline[]} spans
 * @returns {RichInline[][]}
 */
function splitAtBlankLine(spans) {
    /** @type {RichInline[][]} */
    const out = [[]];
    spans.forEach((span, index) => {
        if (span.t === 'br' && spans[index + 1]?.t === 'br') { out.push([]); return; }
        if (span.t === 'br' && spans[index - 1]?.t === 'br') return;
        out[out.length - 1].push(span);
    });
    return out.map(blockSpans).filter((part) => part.length > 0);
}

/**
 * @param {string} text
 * @returns {string}
 */
const oneLine = (text) => String(text ?? '').replace(/\s+/g, ' ').trim();

/**
 * The items of a list in the normal shape: inside an item, an empty line is a break, not a new paragraph.
 * @param {RichInline[][]} items
 * @returns {RichInline[][]}
 */
function listItems(items) {
    return items.map((item) => blockSpans(item)).map((item) => {
        /** @type {RichInline[]} */
        const kept = [];
        item.forEach((span, index) => { if (!(span.t === 'br' && item[index - 1]?.t === 'br')) kept.push(span); });
        return kept;
    }).filter((item) => item.length > 0);
}

/**
 * @param {Extract<RichBlock, { t: 'image' }>} block
 * @returns {RichBlock[]}
 */
function normalizeImage(block) {
    const src = safeImage(block.src);
    return src && block.alt.trim() ? [{ t: 'image', src, alt: oneLine(block.alt), caption: oneLine(block.caption), wide: !!block.wide }] : [];
}

/**
 * @param {Extract<RichBlock, { t: 'video' }>} block
 * @returns {RichBlock[]}
 */
function normalizeVideo(block) {
    const video = videoOf(block.url) ?? (block.id ? { provider: block.provider, id: block.id } : null);
    const checked = video && videoOf(canonicalVideo(video));
    return checked ? [{ t: 'video', provider: checked.provider, id: checked.id, url: canonicalVideo(checked), caption: oneLine(block.caption) }] : [];
}

/**
 * A media block in the normal shape, or none when it does not hold.
 * @param {Extract<RichBlock, { t: 'image' | 'video' | 'book' }>} block
 * @returns {RichBlock[]}
 */
function normalizeMedia(block) {
    if (block.t === 'image') return normalizeImage(block);
    if (block.t === 'video') return normalizeVideo(block);
    return BOOK_SLUG.test(block.slug) ? [{ t: 'book', slug: block.slug, title: oneLine(block.title) || block.slug }] : [];
}

/**
 * A heading in the normal shape: one line, its breaks become spaces; none when empty.
 * @param {Extract<RichBlock, { t: 'lead' | 'h3' }>} block
 * @returns {RichBlock[]}
 */
function normalizeHeading(block) {
    const c = blockSpans(block.c.map((span) => (span.t === 'br' ? { t: 'text', v: ' ' } : span)));
    return c.length ? [{ t: block.t, c }] : [];
}

/**
 * A quote or a callout in the normal shape: an empty quote is none, an empty callout stays.
 * @param {Extract<RichBlock, { t: 'quote' | 'callout' }>} block
 * @returns {RichBlock[]}
 */
function normalizeQuote(block) {
    const c = block.c.flatMap(splitAtBlankLine);
    return c.length || block.t === 'callout' ? [{ t: block.t, c }] : [];
}

/**
 * A list in the normal shape: none without items; a numbered one keeps a start other than 1.
 * @param {Extract<RichBlock, { t: 'ul' | 'ol' }>} block
 * @returns {RichBlock[]}
 */
function normalizeList(block) {
    const c = listItems(block.c);
    if (!c.length) return [];
    return [block.t === 'ol' ? { t: 'ol', c, ...(block.start && block.start !== 1 ? { start: block.start } : {}) } : { t: 'ul', c }];
}

/**
 * One block in the normal shape, as the blocks it becomes.
 * @param {RichBlock} block
 * @returns {RichBlock[]}
 */
function normalizeBlock(block) {
    switch (block.t) {
        case 'p': return splitAtBlankLine(block.c).map((c) => /** @type {RichBlock} */ ({ t: 'p', c }));
        case 'lead': case 'h3': return normalizeHeading(block);
        case 'quote': case 'callout': return normalizeQuote(block);
        case 'ul': case 'ol': return normalizeList(block);
        case 'hr': return [{ t: 'hr' }];
        default: return normalizeMedia(block);
    }
}

/**
 * The document in the shape the writer writes and the reader reads back the same.
 * @param {RichDoc} doc
 * @returns {RichDoc}
 */
export function normalizeDoc(doc) {
    return doc.flatMap(normalizeBlock);
}

// ---------------------------------------------------------------- writing

/** @type {Record<RichMarkKind, string>} */
const WRAP = { strong: '**', em: '_', u: '++', s: '~~', mark: '==', sup: '^', sub: '~' };

/**
 * An equals or a plus sign beside another of its own: the pair would read as a highlight or an underline.
 * @param {string} char
 * @param {string} prev
 * @param {string} next
 */
const isDoubled = (char, prev, next) => (char === '=' || char === '+') && (prev === char || next === char);

/**
 * The escape a character of a text needs so the reader takes it as text, or the character itself.
 * @param {string} char
 * @param {string} prev
 * @param {string} next
 */
function escapeChar(char, prev, next) {
    if ('\\*`[]~^'.includes(char)) return `\\${char}`;
    if (char === '_' && !(WORD.test(prev) && WORD.test(next))) return '\\_';
    if (isDoubled(char, prev, next)) return `\\${char}`;
    if (char === '!' && next === '[') return '\\!';
    return char;
}

/**
 * Escape a text so the reader takes it as text.
 * @param {string} text
 * @param {string} before
 * @param {string} after
 */
function escapeText(text, before, after) {
    let out = '';
    for (let k = 0; k < text.length; k++) out += escapeChar(text[k], k > 0 ? text[k - 1] : before, k + 1 < text.length ? text[k + 1] : after);
    return out;
}

/**
 * The first character a span writes, for the choice of a neighbour's delimiter.
 * @param {RichInline | undefined} span
 * @returns {string}
 */
function firstChar(span) {
    if (!span) return '';
    if (span.t === 'text' || span.t === 'code') return span.v[0] ?? '';
    if (span.t === 'br') return '\n';
    return span.t === 'link' || span.t === 'size' ? '[' : WRAP[span.t][0];
}

/**
 * @param {string} v
 */
function writeCode(v) {
    let ticks = '`';
    while (v.includes(ticks)) ticks += '`';
    const pad = v.startsWith('`') || v.endsWith('`') || (v.startsWith(' ') && v.endsWith(' ') && v.trim()) ? ' ' : '';
    return `${ticks}${pad}${v}${pad}${ticks}`;
}

/**
 * One span in the dialect.
 * @param {RichInline} span
 * @param {string} prev the character written before it
 * @param {string} next the first character written after it
 * @returns {string}
 */
function writeSpan(span, prev, next) {
    switch (span.t) {
        case 'text': return escapeText(span.v, prev, next);
        case 'br': return '\n';
        case 'code': return writeCode(span.v);
        case 'link': return `[${writeInline(span.c, '[', ']')}](${encodeDestination(span.href)})`;
        case 'size': return `[${writeInline(span.c, '[', ']')}]{.${span.size}}`;
        default: {
            // The underscore of the italic cannot sit inside a word: there the asterisk goes.
            const delim = span.t === 'em' && (WORD.test(prev) || WORD.test(next)) ? '*' : WRAP[span.t];
            return `${delim}${writeInline(span.c, delim[0], delim[0])}${delim}`;
        }
    }
}

/**
 * @param {RichInline[]} spans
 * @param {string} [before]
 * @param {string} [after]
 * @returns {string}
 */
function writeInline(spans, before = '', after = '') {
    let out = '';
    spans.forEach((span, index) => {
        const prev = out ? out[out.length - 1] : before;
        const next = index + 1 < spans.length ? firstChar(spans[index + 1]) : after;
        out += writeSpan(span, prev, next);
    });
    return out;
}

/** @param {string} href */
const encodeDestination = (href) => href.replace(/[\s()<>]/g, (char) => encodeURIComponent(char));
/** @param {string} text */
const escapeAttr = (text) => text.replace(/[\\"]/g, '\\$&');
/** @param {string} text */
const escapeLabel = (text) => text.replace(/[\\[\]]/g, '\\$&');

/**
 * A line that the reader would take for the start of a block gets its first sign escaped.
 * @param {string} line
 */
function escapeLineStart(line) {
    if (/^#{1,6}(\s|$)/.test(line) || /^>/.test(line)) return `\\${line}`;
    if (/^[-+](\s|$)/.test(line) || RULE.test(line)) return `\\${line}`;
    const ordered = /^(\d{1,9})([.)])(\s|$)/.exec(line);
    if (ordered) return `${ordered[1]}\\${line.slice(ordered[1].length)}`;
    return line;
}

/** @param {RichInline[]} spans */
const writeLines = (spans) => writeInline(spans).split('\n').map(escapeLineStart);
/** @param {RichInline[]} part */
const quoted = (part) => writeLines(part).map((line) => `> ${line}`).join('\n');

/**
 * @param {Extract<RichBlock, { t: 'ul' | 'ol' }>} block
 * @returns {string}
 */
function writeList(block) {
    return block.c.map((item, index) => {
        const marker = block.t === 'ul' ? '-' : `${(block.start ?? 1) + index}.`;
        const [first, ...rest] = writeLines(item);
        const pad = ' '.repeat(marker.length + 1);
        return [`${marker} ${first}`, ...rest.map((line) => `${pad}${line}`)].join('\n');
    }).join('\n');
}

/**
 * A media block in the dialect, alone in its paragraph.
 * @param {Extract<RichBlock, { t: 'image' | 'video' | 'book' }>} block
 * @returns {string}
 */
function writeMedia(block) {
    switch (block.t) {
        case 'image': return `![${escapeLabel(block.alt)}](${encodeDestination(block.src)}${block.wide ? WIDE : ''}${block.caption ? ` "${escapeAttr(block.caption)}"` : ''})`;
        case 'video': return `![${escapeLabel(block.caption)}](${block.url})`;
        case 'book': return `[${escapeLabel(block.title)}](${bookPath(block.slug)} "livro")`;
    }
}

/**
 * One block in the dialect.
 * @param {RichBlock} block
 * @returns {string}
 */
function writeBlock(block) {
    switch (block.t) {
        case 'p': return writeLines(block.c).join('\n');
        case 'lead': return `#### ${writeInline(block.c).replace(/#$/, '\\#')}`;
        case 'h3': return `### ${writeInline(block.c).replace(/#$/, '\\#')}`;
        case 'quote': return block.c.map(quoted).join('\n>\n');
        case 'callout': return ['> [!NOTE]', ...block.c.map(quoted)].join('\n>\n').replace('> [!NOTE]\n>\n', '> [!NOTE]\n');
        case 'ul': case 'ol': return writeList(block);
        case 'hr': return '---';
        default: return writeMedia(block);
    }
}

/**
 * Write the document in the dialect. What `parseRich` reads back is the same document, normalized.
 * @param {RichDoc} input
 * @returns {string}
 */
export function toMarkdown(input) {
    return normalizeDoc(input).map(writeBlock).join('\n\n');
}
