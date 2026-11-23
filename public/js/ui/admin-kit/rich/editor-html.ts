// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
/**
 * The rich field's HTML (F128): the document drawn for `contenteditable`, and the DOM read back into the document. The
 * browser writes its own markup while the author types (`b` or `strong`, `div` or `p`, a `span` with a style); the
 * reader takes only what it knows and turns the rest into text, so whatever the browser does, what is saved is the
 * dialect (ADR-0015).
 */
import { RICH_SIZES, normalizeDoc, safeHref as safeUrl, safeImage, videoOf, type RichBlock, type RichDoc, type RichInline, type RichMarkKind, type RichSize } from '@mjrp/admin-kit-core';

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));

/** What a book card shows in the field, when the shelf told it. */
export interface EditorBook {
    slug: string;
    title: string;
    author?: string;
    cover?: string | null;
    stage?: string;
}

export interface EditorWords {
    remove: string;
    inGarden: string;
    video: string;
}

const TAG: Record<RichMarkKind, string> = { strong: 'strong', em: 'em', u: 'u', s: 's', mark: 'mark', sup: 'sup', sub: 'sub' };

function inlineHtml(spans: RichInline[]): string {
    return spans.map((span) => {
        switch (span.t) {
            case 'text': return escapeHtml(span.v);
            case 'br': return '<br>';
            case 'code': return `<code>${escapeHtml(span.v)}</code>`;
            case 'link': {
                const href = safeUrl(span.href);
                return href ? `<a href="${escapeHtml(href)}">${inlineHtml(span.c)}</a>` : inlineHtml(span.c);
            }
            // The size of a stretch (F332): read since 1.0.0 and kept through an edit; the toolbar offers it from 1.1.0.
            case 'size': return `<span data-size="${span.size}">${inlineHtml(span.c)}</span>`;
            default: return `<${TAG[span.t]}>${inlineHtml(span.c)}</${TAG[span.t]}>`;
        }
    }).join('');
}

const removeButton = (words: EditorWords) => `<button type="button" class="ak-rt-x" contenteditable="false" tabindex="-1">${escapeHtml(words.remove)}</button>`;

type ImageBlock = Extract<RichBlock, { t: 'image' }>;
type VideoBlock = Extract<RichBlock, { t: 'video' }>;
type BookBlock = Extract<RichBlock, { t: 'book' }>;

function imageHtml(block: ImageBlock, words: EditorWords): string {
    const src = safeImage(block.src) ?? '';
    return `<figure class="ak-rt-media${block.wide ? ' wide' : ''}" contenteditable="false" data-rt="image" data-src="${escapeHtml(src)}" data-alt="${escapeHtml(block.alt)}" data-caption="${escapeHtml(block.caption)}" data-wide="${block.wide ? '1' : ''}">`
        + `<img src="${escapeHtml(src)}" alt="${escapeHtml(block.alt)}">${block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ''}${removeButton(words)}</figure>`;
}

function videoHtml(block: VideoBlock, words: EditorWords): string {
    const youtube = block.provider === 'youtube';
    const thumb = youtube ? ` style="background-image:url('https://i.ytimg.com/vi/${escapeHtml(block.id)}/hqdefault.jpg')"` : '';
    const name = youtube ? 'YouTube' : 'Vimeo';
    return `<figure class="ak-rt-media" contenteditable="false" data-rt="video" data-url="${escapeHtml(block.url)}" data-caption="${escapeHtml(block.caption)}">`
        + `<span class="ak-rt-video"${thumb}><i aria-hidden="true">▶</i></span><figcaption>${escapeHtml(block.caption || `${name} · ${words.video}`)}</figcaption>${removeButton(words)}</figure>`;
}

/** The cover of a book card: the shelf's image when its address is one the site takes, else the empty frame. */
function coverHtml(book: EditorBook | undefined): string {
    const cover = book?.cover ? safeImage(book.cover) : null;
    return cover ? `<img src="${escapeHtml(cover)}" alt="">` : '<span class="ak-rt-cover" aria-hidden="true"></span>';
}

function bookHtml(block: BookBlock, words: EditorWords, book: EditorBook | undefined): string {
    const stage = book?.stage ? ` · ${escapeHtml(book.stage)}` : '';
    return `<div class="ak-rt-book" contenteditable="false" data-rt="book" data-slug="${escapeHtml(block.slug)}" data-title="${escapeHtml(block.title)}">`
        + coverHtml(book)
        + `<span><b>${escapeHtml(book?.title || block.title)}</b>${escapeHtml(book?.author ?? '')}<small>${escapeHtml(words.inGarden)}${stage}</small></span>${removeButton(words)}</div>`;
}

/** The media blocks: closed to typing, carrying their data, with «Remover». */
export function mediaHtml(block: RichBlock, words: EditorWords, books: Record<string, EditorBook> = {}): string {
    switch (block.t) {
        case 'image': return imageHtml(block, words);
        case 'video': return videoHtml(block, words);
        case 'book': return bookHtml(block, words, books[block.slug]);
        default: return '';
    }
}

const itemsHtml = (items: RichInline[][]) => items.map((item) => `<li>${inlineHtml(item)}</li>`).join('');
/** A callout always holds a paragraph, so the cursor has where to go. */
const calloutHtml = (parts: RichInline[][]) => (parts.length ? parts : [[]]).map((part) => `<p>${inlineHtml(part) || '<br>'}</p>`).join('');

function blockHtml(block: RichBlock, words: EditorWords, books: Record<string, EditorBook>): string {
    switch (block.t) {
        case 'p': return `<p>${inlineHtml(block.c)}</p>`;
        case 'lead': return `<p class="lead">${inlineHtml(block.c)}</p>`;
        case 'h3': return `<h3>${inlineHtml(block.c)}</h3>`;
        case 'quote': return `<blockquote>${block.c.map((part) => `<p>${inlineHtml(part)}</p>`).join('')}</blockquote>`;
        case 'callout': return `<div class="callout" data-rt="callout">${calloutHtml(block.c)}</div>`;
        case 'ul': return `<ul>${itemsHtml(block.c)}</ul>`;
        case 'ol': return `<ol${block.start ? ` start="${block.start}"` : ''}>${itemsHtml(block.c)}</ol>`;
        case 'hr': return '<hr>';
        default: return mediaHtml(block, words, books);
    }
}

/** The document as the field's HTML. Every text is escaped and every address checked. */
export function toEditorHtml(doc: RichDoc, words: EditorWords, books: Record<string, EditorBook> = {}): string {
    const html = normalizeDoc(doc).map((block) => blockHtml(block, words, books)).join('');
    return html || '<p><br></p>';
}

// ---------------------------------------------------------------- reading the DOM back

const ELEMENT = 1;
const TEXT = 3;
const BLOCK_TAGS = new Set(['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'UL', 'OL', 'LI', 'HR', 'FIGURE', 'ASIDE', 'SECTION', 'ARTICLE', 'PRE', 'TABLE']);
const MARK_OF: Record<string, RichMarkKind> = { STRONG: 'strong', B: 'strong', EM: 'em', I: 'em', U: 'u', INS: 'u', S: 's', STRIKE: 's', DEL: 's', MARK: 'mark', SUP: 'sup', SUB: 'sub' };
/** What an element's style says besides the weight, in the order the marks are read. */
const STYLE_MARKS: Array<[RegExp, RichMarkKind]> = [
    [/font-style\s*:\s*italic/, 'em'],
    [/text-decoration[^;]*underline/, 'u'],
    [/text-decoration[^;]*line-through/, 's'],
    [/vertical-align\s*:\s*super/, 'sup'],
    [/vertical-align\s*:\s*sub/, 'sub'],
];
/** Elements whose content is never text of the document. */
const NOT_TEXT = new Set(['SCRIPT', 'STYLE', 'TEMPLATE']);
const HEADING_TAG = /^H[1-6]$/;

const isElement = (node: Node): node is Element => node.nodeType === ELEMENT;
const isList = (node: Node): node is Element => isElement(node) && (node.tagName === 'UL' || node.tagName === 'OL');
const isBlock = (node: Node): node is Element => isElement(node) && BLOCK_TAGS.has(node.tagName);
const attr = (element: Element, name: string) => element.getAttribute(name) ?? '';

function isBold(style: string): boolean {
    const weight = /font-weight\s*:\s*(\w+)/.exec(style)?.[1];
    return weight === 'bold' || weight === 'bolder' || Number(weight) >= 600;
}

function styleMarks(element: Element): RichMarkKind[] {
    const style = attr(element, 'style').toLowerCase();
    if (!style) return [];
    const marks: RichMarkKind[] = isBold(style) ? ['strong'] : [];
    for (const [pattern, mark] of STYLE_MARKS) if (pattern.test(style)) marks.push(mark);
    return marks;
}

/** A link's spans: the link when its address is one the site takes, else only its text. */
function linkOf(element: Element, children: RichInline[]): RichInline[] {
    const href = safeUrl(attr(element, 'href'));
    return href ? [{ t: 'link', href, c: children }] : children;
}

/** An element's spans inside the marks its style, its size and its own tag say. */
function styledOf(element: Element, children: RichInline[]): RichInline[] {
    let spans = children;
    for (const mark of styleMarks(element).reverse()) spans = [{ t: mark, c: spans }];
    const size = element.getAttribute('data-size') as RichSize | null;
    if (element.tagName === 'SPAN' && size && RICH_SIZES.includes(size)) spans = [{ t: 'size', size, c: spans }];
    const mark = MARK_OF[element.tagName];
    return mark ? [{ t: mark, c: spans }] : spans;
}

function readElement(element: Element): RichInline[] {
    const tag = element.tagName;
    if (tag === 'BR') return [{ t: 'br' }];
    if (element.classList.contains('ak-rt-x') || NOT_TEXT.has(tag)) return [];
    if (tag === 'CODE') return [{ t: 'code', v: element.textContent ?? '' }];
    const children = inlineOf(element);
    return tag === 'A' ? linkOf(element, children) : styledOf(element, children);
}

function readInline(node: Node): RichInline[] {
    if (node.nodeType === TEXT) return [{ t: 'text', v: (node.nodeValue ?? '').replace(/[\n\t\r]+/g, ' ') }];
    return isElement(node) ? readElement(node) : [];
}

/** The spans of everything inside an element. */
function inlineOf(element: Element): RichInline[] {
    return Array.from(element.childNodes).flatMap(readInline);
}

function videoBlock(element: Element): RichBlock | null {
    const url = attr(element, 'data-url');
    const video = videoOf(url);
    return video ? { t: 'video', provider: video.provider, id: video.id, url, caption: attr(element, 'data-caption') } : null;
}

function mediaOf(element: Element): RichBlock | null {
    switch (element.getAttribute('data-rt')) {
        case 'image': return { t: 'image', src: attr(element, 'data-src'), alt: attr(element, 'data-alt'), caption: attr(element, 'data-caption'), wide: element.getAttribute('data-wide') === '1' };
        case 'video': return videoBlock(element);
        case 'book': return { t: 'book', slug: attr(element, 'data-slug'), title: attr(element, 'data-title') };
        default: return null;
    }
}

/** One `li` as the items it becomes: its own content, and the items of a list nested in it. */
function itemOf(li: Element): RichInline[][] {
    const out: RichInline[][] = [];
    let own: RichInline[] = [];
    for (const part of Array.from(li.childNodes)) {
        if (isList(part)) {
            // A nested list comes up to this one: the dialect has one level.
            if (own.length) out.push(own);
            own = [];
            out.push(...itemsOf(Array.from(part.childNodes)));
        } else {
            if (isBlock(part) && own.length) own.push({ t: 'br' });
            own.push(...readInline(part));
        }
    }
    if (own.length) out.push(own);
    return out;
}

/** The items of a list, from the nodes inside it: each `li`, a list nested straight in it, and loose content that says something. */
function itemsOf(nodes: Node[]): RichInline[][] {
    const out: RichInline[][] = [];
    for (const child of nodes) {
        if (isElement(child) && child.tagName === 'LI') out.push(...itemOf(child));
        else if (isList(child)) out.push(...itemsOf(Array.from(child.childNodes)));
        else {
            const spans = readInline(child);
            if (spans.some((span) => span.t !== 'text' || span.v.trim())) out.push(spans);
        }
    }
    return out;
}

/** The paragraphs of a quote or a callout: the inline content between its blocks, and the lists or blocks nested in it read on their own. */
function paragraphsOf(element: Element): RichInline[][] {
    const out: RichInline[][] = [];
    let current: RichInline[] = [];
    for (const child of Array.from(element.childNodes)) {
        if (isBlock(child)) {
            if (current.length) out.push(current);
            current = [];
            out.push(...(isList(child) ? itemsOf(Array.from(child.childNodes)) : paragraphsOf(child)));
        } else current.push(...readInline(child));
    }
    if (current.length) out.push(current);
    return out;
}

function orderedOf(node: Element): RichBlock {
    const start = Number(node.getAttribute('start'));
    return { t: 'ol', c: itemsOf(Array.from(node.childNodes)), ...(Number.isInteger(start) && start > 1 ? { start } : {}) };
}

/** A list, a rule or a loose `li` as its block; null for any other element. */
function listOf(node: Element): RichBlock | null {
    switch (node.tagName) {
        case 'UL': return { t: 'ul', c: itemsOf(Array.from(node.childNodes)) };
        case 'OL': return orderedOf(node);
        case 'HR': return { t: 'hr' };
        case 'LI': return { t: 'ul', c: itemsOf([node]) };
        default: return null;
    }
}

const isCallout = (node: Element) => node.getAttribute('data-rt') === 'callout' || node.classList.contains('callout') || node.tagName === 'ASIDE';

/** The block an element is; null for a box of other blocks (a `div`, a `section`, a `figure` of no media). */
function blockOf(node: Element): RichBlock | null {
    const tag = node.tagName;
    if (tag === 'P' || tag === 'PRE') return { t: node.classList.contains('lead') ? 'lead' : 'p', c: inlineOf(node) };
    if (HEADING_TAG.test(tag)) return { t: tag === 'H4' ? 'lead' : 'h3', c: inlineOf(node) };
    if (tag === 'BLOCKQUOTE') return { t: 'quote', c: paragraphsOf(node) };
    if (isCallout(node)) return { t: 'callout', c: paragraphsOf(node) };
    return listOf(node);
}

/** The document being read, and the inline content not yet inside a block. */
interface Reading {
    doc: RichDoc;
    loose: RichInline[];
}

/** The loose content so far becomes a paragraph. */
function flush(reading: Reading): void {
    if (reading.loose.length) reading.doc.push({ t: 'p', c: reading.loose });
    reading.loose = [];
}

const isMedia = (node: Node): node is Element => isElement(node) && node.hasAttribute('data-rt') && node.getAttribute('data-rt') !== 'callout';
const isTextBlock = (tag: string) => tag === 'P' || tag === 'PRE' || HEADING_TAG.test(tag);
const holdsBlocks = (node: Element) => Array.from(node.children).some((child) => BLOCK_TAGS.has(child.tagName) || child.hasAttribute('data-rt'));

function visitNode(child: Node, reading: Reading): void {
    if (isMedia(child)) {
        // A media that does not hold (a video of another address) leaves nothing.
        flush(reading);
        const media = mediaOf(child);
        if (media) reading.doc.push(media);
        return;
    }
    if (!isBlock(child)) {
        reading.loose.push(...readInline(child));
        return;
    }
    flush(reading);
    // The browser nests a list or a quote inside a paragraph («<p><ul>…</ul></p>»): such a paragraph is a box of blocks.
    const block = isTextBlock(child.tagName) && holdsBlocks(child) ? null : blockOf(child);
    if (block) reading.doc.push(block);
    else visit(child, reading);
}

function visit(element: Element, reading: Reading): void {
    for (const child of Array.from(element.childNodes)) visitNode(child, reading);
    flush(reading);
}

/** The DOM of the field (or of a paste) read back into the document, in its one shape. */
export function fromEditor(root: Element): RichDoc {
    const reading: Reading = { doc: [], loose: [] };
    visit(root, reading);
    return normalizeDoc(reading.doc);
}
