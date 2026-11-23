// cópia carimbada do kit do admin do MJRP Harness · admin-kit v0.9.0 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
/**
 * The rich field's HTML (F128): the document drawn for `contenteditable`, and the DOM read back into the document. The
 * browser writes its own markup while the author types (`b` or `strong`, `div` or `p`, a `span` with a style); the
 * reader takes only what it knows and turns the rest into text, so whatever the browser does, what is saved is the
 * dialect (ADR-0015).
 */
import { RICH_SIZES, normalizeDoc, safeHref, safeImage, videoOf, type RichBlock, type RichDoc, type RichInline, type RichMarkKind, type RichSize } from '@mjrp/admin-kit-core';

const esc = (text: string) => text.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));

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
            case 'text': return esc(span.v);
            case 'br': return '<br>';
            case 'code': return `<code>${esc(span.v)}</code>`;
            case 'link': {
                const href = safeHref(span.href);
                return href ? `<a href="${esc(href)}">${inlineHtml(span.c)}</a>` : inlineHtml(span.c);
            }
            // The size of a stretch (F332): read since 1.0.0 and kept through an edit; the toolbar offers it from 1.1.0.
            case 'size': return `<span data-size="${span.size}">${inlineHtml(span.c)}</span>`;
            default: return `<${TAG[span.t]}>${inlineHtml(span.c)}</${TAG[span.t]}>`;
        }
    }).join('');
}

const removeButton = (words: EditorWords) => `<button type="button" class="ak-rt-x" contenteditable="false" tabindex="-1">${esc(words.remove)}</button>`;

/** The media blocks: closed to typing, carrying their data, with «Remover». */
export function mediaHtml(block: RichBlock, words: EditorWords, books: Record<string, EditorBook> = {}): string {
    if (block.t === 'image') {
        const src = safeImage(block.src) ?? '';
        return `<figure class="ak-rt-media${block.wide ? ' wide' : ''}" contenteditable="false" data-rt="image" data-src="${esc(src)}" data-alt="${esc(block.alt)}" data-caption="${esc(block.caption)}" data-wide="${block.wide ? '1' : ''}">`
            + `<img src="${esc(src)}" alt="${esc(block.alt)}">${block.caption ? `<figcaption>${esc(block.caption)}</figcaption>` : ''}${removeButton(words)}</figure>`;
    }
    if (block.t === 'video') {
        const thumb = block.provider === 'youtube' ? ` style="background-image:url('https://i.ytimg.com/vi/${esc(block.id)}/hqdefault.jpg')"` : '';
        const name = block.provider === 'youtube' ? 'YouTube' : 'Vimeo';
        return `<figure class="ak-rt-media" contenteditable="false" data-rt="video" data-url="${esc(block.url)}" data-caption="${esc(block.caption)}">`
            + `<span class="ak-rt-video"${thumb}><i aria-hidden="true">▶</i></span><figcaption>${esc(block.caption || `${name} · ${words.video}`)}</figcaption>${removeButton(words)}</figure>`;
    }
    if (block.t === 'book') {
        const book = books[block.slug];
        const cover = book?.cover ? safeImage(book.cover) : null;
        return `<div class="ak-rt-book" contenteditable="false" data-rt="book" data-slug="${esc(block.slug)}" data-title="${esc(block.title)}">`
            + `${cover ? `<img src="${esc(cover)}" alt="">` : '<span class="ak-rt-cover" aria-hidden="true"></span>'}`
            + `<span><b>${esc(book?.title || block.title)}</b>${esc(book?.author ?? '')}<small>${esc(words.inGarden)}${book?.stage ? ` · ${esc(book.stage)}` : ''}</small></span>${removeButton(words)}</div>`;
    }
    return '';
}

/** The document as the field's HTML. Every text is escaped and every address checked. */
export function toEditorHtml(doc: RichDoc, words: EditorWords, books: Record<string, EditorBook> = {}): string {
    const html = normalizeDoc(doc).map((block) => {
        switch (block.t) {
            case 'p': return `<p>${inlineHtml(block.c)}</p>`;
            case 'lead': return `<p class="lead">${inlineHtml(block.c)}</p>`;
            case 'h3': return `<h3>${inlineHtml(block.c)}</h3>`;
            case 'quote': return `<blockquote>${block.c.map((part) => `<p>${inlineHtml(part)}</p>`).join('')}</blockquote>`;
            case 'callout': return `<div class="callout" data-rt="callout">${(block.c.length ? block.c : [[]]).map((part) => `<p>${inlineHtml(part) || '<br>'}</p>`).join('')}</div>`;
            case 'ul': return `<ul>${block.c.map((item) => `<li>${inlineHtml(item)}</li>`).join('')}</ul>`;
            case 'ol': return `<ol${block.start ? ` start="${block.start}"` : ''}>${block.c.map((item) => `<li>${inlineHtml(item)}</li>`).join('')}</ol>`;
            case 'hr': return '<hr>';
            default: return mediaHtml(block, words, books);
        }
    }).join('');
    return html || '<p><br></p>';
}

// ---------------------------------------------------------------- reading the DOM back

const ELEMENT = 1;
const TEXT = 3;
const BLOCK_TAGS = new Set(['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'UL', 'OL', 'LI', 'HR', 'FIGURE', 'ASIDE', 'SECTION', 'ARTICLE', 'PRE', 'TABLE']);
const MARK_OF: Record<string, RichMarkKind> = { STRONG: 'strong', B: 'strong', EM: 'em', I: 'em', U: 'u', INS: 'u', S: 's', STRIKE: 's', DEL: 's', MARK: 'mark', SUP: 'sup', SUB: 'sub' };

function styleMarks(element: Element): RichMarkKind[] {
    const style = (element.getAttribute('style') ?? '').toLowerCase();
    if (!style) return [];
    const marks: RichMarkKind[] = [];
    const weight = /font-weight\s*:\s*(\w+)/.exec(style)?.[1];
    if (weight === 'bold' || weight === 'bolder' || Number(weight) >= 600) marks.push('strong');
    if (/font-style\s*:\s*italic/.test(style)) marks.push('em');
    if (/text-decoration[^;]*underline/.test(style)) marks.push('u');
    if (/text-decoration[^;]*line-through/.test(style)) marks.push('s');
    if (/vertical-align\s*:\s*super/.test(style)) marks.push('sup');
    if (/vertical-align\s*:\s*sub/.test(style)) marks.push('sub');
    return marks;
}

function readInline(node: Node): RichInline[] {
    if (node.nodeType === TEXT) return [{ t: 'text', v: (node.nodeValue ?? '').replace(/[\n\t\r]+/g, ' ') }];
    if (node.nodeType !== ELEMENT) return [];
    const element = node as Element;
    const tag = element.tagName;
    if (tag === 'BR') return [{ t: 'br' }];
    if (element.classList.contains('ak-rt-x') || tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEMPLATE') return [];
    const children = Array.from(element.childNodes).flatMap(readInline);
    if (tag === 'CODE') return [{ t: 'code', v: element.textContent ?? '' }];
    if (tag === 'A') {
        const href = safeHref(element.getAttribute('href') ?? '');
        return href ? [{ t: 'link', href, c: children }] : children;
    }
    let spans = children;
    for (const mark of styleMarks(element).reverse()) spans = [{ t: mark, c: spans }];
    const size = element.getAttribute('data-size') as RichSize | null;
    if (tag === 'SPAN' && size && RICH_SIZES.includes(size)) spans = [{ t: 'size', size, c: spans }];
    const mark = MARK_OF[tag];
    return mark ? [{ t: mark, c: spans }] : spans;
}

function mediaOf(element: Element): RichBlock | null {
    const kind = element.getAttribute('data-rt');
    if (kind === 'image') {
        return { t: 'image', src: element.getAttribute('data-src') ?? '', alt: element.getAttribute('data-alt') ?? '', caption: element.getAttribute('data-caption') ?? '', wide: element.getAttribute('data-wide') === '1' };
    }
    if (kind === 'video') {
        const url = element.getAttribute('data-url') ?? '';
        const video = videoOf(url);
        return video ? { t: 'video', provider: video.provider, id: video.id, url, caption: element.getAttribute('data-caption') ?? '' } : null;
    }
    if (kind === 'book') return { t: 'book', slug: element.getAttribute('data-slug') ?? '', title: element.getAttribute('data-title') ?? '' };
    return null;
}

/** The DOM of the field (or of a paste) read back into the document, in its one shape. */
export function fromEditor(root: Element): RichDoc {
    const doc: RichDoc = [];
    let loose: RichInline[] = [];
    const flush = () => {
        if (loose.length) doc.push({ t: 'p', c: loose });
        loose = [];
    };
    /** The inline content of a block, and the lists or blocks nested in it read on their own. */
    const items = (list: Element): RichInline[][] => {
        const out: RichInline[][] = [];
        for (const child of Array.from(list.childNodes)) {
            if (child.nodeType === ELEMENT && (child as Element).tagName === 'LI') {
                const li = child as Element;
                const own: RichInline[] = [];
                for (const part of Array.from(li.childNodes)) {
                    if (part.nodeType === ELEMENT && ['UL', 'OL'].includes((part as Element).tagName)) {
                        // A nested list comes up to this one: the dialect has one level.
                        if (own.length) out.push([...own]);
                        own.length = 0;
                        out.push(...items(part as Element));
                    } else if (part.nodeType === ELEMENT && BLOCK_TAGS.has((part as Element).tagName)) {
                        if (own.length) own.push({ t: 'br' });
                        own.push(...readInline(part));
                    } else own.push(...readInline(part));
                }
                if (own.length) out.push(own);
            } else if (child.nodeType === ELEMENT && ['UL', 'OL'].includes((child as Element).tagName)) out.push(...items(child as Element));
            else {
                const spans = readInline(child);
                if (spans.some((span) => span.t !== 'text' || span.v.trim())) out.push(spans);
            }
        }
        return out;
    };
    const paragraphs = (element: Element): RichInline[][] => {
        const out: RichInline[][] = [];
        let current: RichInline[] = [];
        for (const child of Array.from(element.childNodes)) {
            if (child.nodeType === ELEMENT && BLOCK_TAGS.has((child as Element).tagName)) {
                if (current.length) out.push(current);
                current = [];
                const tag = (child as Element).tagName;
                if (tag === 'UL' || tag === 'OL') out.push(...items(child as Element));
                else out.push(...paragraphs(child as Element));
            } else current.push(...readInline(child));
        }
        if (current.length) out.push(current);
        return out;
    };
    const visit = (element: Element) => {
        for (const child of Array.from(element.childNodes)) {
            if (child.nodeType !== ELEMENT) {
                loose.push(...readInline(child));
                continue;
            }
            const node = child as Element;
            const tag = node.tagName;
            const media = node.hasAttribute('data-rt') && node.getAttribute('data-rt') !== 'callout' ? mediaOf(node) : null;
            if (media) { flush(); doc.push(media); continue; }
            if (node.hasAttribute('data-rt') && node.getAttribute('data-rt') !== 'callout') { flush(); continue; }
            if (!BLOCK_TAGS.has(tag)) {
                loose.push(...readInline(node));
                continue;
            }
            flush();
            // The browser nests a list or a quote inside a paragraph («<p><ul>…</ul></p>»): such a paragraph is a box of blocks.
            if ((tag === 'P' || tag === 'PRE' || /^H[1-6]$/.test(tag)) && Array.from(node.children).some((child) => BLOCK_TAGS.has(child.tagName) || child.hasAttribute('data-rt'))) { visit(node); continue; }
            if (tag === 'P' || tag === 'PRE') doc.push({ t: node.classList.contains('lead') ? 'lead' : 'p', c: Array.from(node.childNodes).flatMap(readInline) });
            else if (/^H[1-6]$/.test(tag)) doc.push({ t: tag === 'H4' ? 'lead' : 'h3', c: Array.from(node.childNodes).flatMap(readInline) });
            else if (tag === 'BLOCKQUOTE') doc.push({ t: 'quote', c: paragraphs(node) });
            else if (node.getAttribute('data-rt') === 'callout' || node.classList.contains('callout') || tag === 'ASIDE') doc.push({ t: 'callout', c: paragraphs(node) });
            else if (tag === 'UL') doc.push({ t: 'ul', c: items(node) });
            else if (tag === 'OL') {
                const start = Number(node.getAttribute('start'));
                doc.push({ t: 'ol', c: items(node), ...(Number.isInteger(start) && start > 1 ? { start } : {}) });
            } else if (tag === 'HR') doc.push({ t: 'hr' });
            else if (tag === 'LI') doc.push({ t: 'ul', c: items({ childNodes: [node] } as unknown as Element) });
            else visit(node);
        }
        flush();
    };
    visit(root);
    return normalizeDoc(doc);
}
