// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
/**
 * The rich text document (F128, ADR-0015; the kit's core since F332): what the kit's rich field edits and what a site draws.
 * Blocks and spans of a closed list, so nothing outside it (HTML, a script, an address of another kind) can come in through
 * the text. The Markdown that holds it is in `markdown.js`; the editor's HTML stays in the kit's `ui/`.
 *
 * Pure JavaScript with JSDoc types: no package, no engine global, so it runs the same in a browser, in Node and in Hermes.
 */

/** @typedef {'strong' | 'em' | 'u' | 's' | 'mark' | 'sup' | 'sub'} RichMarkKind */
/** The size of a stretch of text (F332, REQ-08): a closed set; the normal size has no mark. @typedef {'small' | 'large' | 'xlarge'} RichSize */

/**
 * @typedef {{ t: 'text'; v: string }
 *   | { t: 'br' }
 *   | { t: RichMarkKind; c: RichInline[] }
 *   | { t: 'size'; size: RichSize; c: RichInline[] }
 *   | { t: 'link'; href: string; c: RichInline[] }
 *   | { t: 'code'; v: string }} RichInline
 */

/**
 * «lead» is «Texto grande», a paragraph in a larger size, never a heading; «h3» is «Subtítulo»; «callout» is «Caixa de
 * destaque»; «book» is the card of a book of the shelf, by its slug (the site fills the cover, the author and the stage).
 * @typedef {{ t: 'p'; c: RichInline[] }
 *   | { t: 'lead'; c: RichInline[] }
 *   | { t: 'h3'; c: RichInline[] }
 *   | { t: 'quote'; c: RichInline[][] }
 *   | { t: 'callout'; c: RichInline[][] }
 *   | { t: 'ul'; c: RichInline[][] }
 *   | { t: 'ol'; c: RichInline[][]; start?: number }
 *   | { t: 'hr' }
 *   | { t: 'image'; src: string; alt: string; caption: string; wide: boolean }
 *   | { t: 'video'; provider: 'youtube' | 'vimeo'; id: string; url: string; caption: string }
 *   | { t: 'book'; slug: string; title: string }} RichBlock
 */

/** @typedef {RichBlock[]} RichDoc */

/** The sizes the dialect knows, smallest first. @type {readonly RichSize[]} */
export const RICH_SIZES = ['small', 'large', 'xlarge'];

/**
 * Whether a text holds a control character (0 to 31, or 127) or a space of any kind: no address takes one. The control
 * characters are read by their code, so no pattern holds one.
 * @param {string} text
 */
function hasControlOrSpace(text) {
    for (let k = 0; k < text.length; k++) {
        const code = text.charCodeAt(k);
        if (code < 32 || code === 127) return true;
    }
    return /\s/.test(text);
}

/**
 * The address a link may take: the web, mail, or a place of the site itself. Anything else is no link.
 * @param {string} raw
 * @returns {string | null}
 */
export function safeHref(raw) {
    const href = String(raw ?? '').trim();
    if (!href || hasControlOrSpace(href)) return null;
    // A backslash (or its %5C escape, in any case) reads as a slash to the browser: `/\evil.com` would leave the site.
    if (href.startsWith('//') || /\\|%5c/i.test(href)) return null;
    if (href.startsWith('/') || href.startsWith('#')) return href;
    const scheme = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(href);
    if (!scheme) return null;
    return ['http', 'https', 'mailto'].includes(scheme[1].toLowerCase()) ? href : null;
}

/**
 * The address an image may take: the site's own files or `https`.
 * @param {string} raw
 * @returns {string | null}
 */
export function safeImage(raw) {
    const src = String(raw ?? '').trim();
    if (!src || hasControlOrSpace(src) || /["'<>\\]/.test(src) || src.startsWith('//')) return null;
    if (src.startsWith('/')) return src;
    return /^https:\/\/[^/]/i.test(src) ? src : null;
}

const YOUTUBE_ID = /^[A-Za-z0-9_-]{6,20}$/;
const VIMEO_ID = /^\d{4,12}$/;

/** @typedef {{ provider: 'youtube' | 'vimeo'; id: string }} RichVideo */

/**
 * The address read as a URL, or null when it is not one.
 * @param {string} raw
 * @returns {URL | null}
 */
function urlOf(raw) {
    try {
        return new URL(String(raw ?? '').trim());
    } catch {
        return null;
    }
}

/**
 * @param {string | null | undefined} id
 * @returns {RichVideo | null}
 */
const youtube = (id) => (id && YOUTUBE_ID.test(id) ? { provider: 'youtube', id } : null);
/**
 * @param {string | null | undefined} id
 * @returns {RichVideo | null}
 */
const vimeo = (id) => (id && VIMEO_ID.test(id) ? { provider: 'vimeo', id } : null);

/**
 * Where a YouTube address carries the video's id: `/watch?v=`, or after `embed`, `shorts`, `live` or `v`.
 * @param {URL} url
 * @param {string[]} parts
 */
function youtubeId(url, parts) {
    if (url.pathname === '/watch') return url.searchParams.get('v');
    return ['embed', 'shorts', 'live', 'v'].includes(parts[0]) ? parts[1] : null;
}

/**
 * Where a Vimeo address carries the video's id: any part of the site's address, or after `video` in the player's.
 * @param {string} host
 * @param {string[]} parts
 */
function vimeoId(host, parts) {
    if (host === 'vimeo.com') return parts.find((part) => VIMEO_ID.test(part));
    return parts[0] === 'video' ? parts[1] : null;
}

/**
 * A YouTube or Vimeo address, with the video's id checked; null for any other address.
 * @param {string} raw
 * @returns {RichVideo | null}
 */
export function videoOf(raw) {
    const url = urlOf(raw);
    if (!url || (url.protocol !== 'https:' && url.protocol !== 'http:')) return null;
    const host = url.hostname.toLowerCase().replace(/^www\.|^m\./, '');
    const parts = url.pathname.split('/').filter(Boolean);
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') return youtube(youtubeId(url, parts));
    if (host === 'youtu.be') return youtube(parts[0]);
    if (host === 'vimeo.com' || host === 'player.vimeo.com') return vimeo(vimeoId(host, parts));
    return null;
}

/**
 * The address of the player that goes in the page: YouTube without cookies, Vimeo without tracking.
 * @param {RichVideo} video
 * @returns {string}
 */
export function videoEmbed(video) {
    return video.provider === 'youtube'
        ? `https://www.youtube-nocookie.com/embed/${video.id}`
        : `https://player.vimeo.com/video/${video.id}?dnt=1`;
}

/** A book's slug, as the shelf writes it. */
export const BOOK_SLUG = /^[a-z0-9][a-z0-9-]{0,159}$/;
/**
 * The address of a book card in the Markdown: `/livro/<slug>`.
 * @param {string} slug
 * @returns {string}
 */
export const bookPath = (slug) => `/livro/${slug}`;
/**
 * @param {string} href
 * @returns {string | null}
 */
export function bookSlugOf(href) {
    const match = /^\/livro\/([^/?#]+)$/.exec(String(href ?? '').trim());
    return match && BOOK_SLUG.test(match[1]) ? match[1] : null;
}

/**
 * The text of spans, without the marks: for counting words, for a description, for a search.
 * @param {RichInline[]} spans
 * @returns {string}
 */
export function inlineText(spans) {
    return spans.map((span) => (span.t === 'text' || span.t === 'code' ? span.v : span.t === 'br' ? '\n' : inlineText(span.c))).join('');
}

/**
 * The text of a block that holds no spans: the caption of an image or a video, the title of a book; a rule has none.
 * @param {Extract<RichBlock, { t: 'hr' | 'image' | 'video' | 'book' }>} block
 * @returns {string}
 */
function mediaText(block) {
    switch (block.t) {
        case 'image': case 'video': return block.caption;
        case 'book': return block.title;
        default: return '';
    }
}

/**
 * The text of one block, its items or paragraphs one a line.
 * @param {RichBlock} block
 * @returns {string}
 */
function blockText(block) {
    switch (block.t) {
        case 'p': case 'lead': case 'h3': return inlineText(block.c);
        case 'quote': case 'callout': case 'ul': case 'ol': return block.c.map(inlineText).join('\n');
        default: return mediaText(block);
    }
}

/**
 * The document as plain text, one block a paragraph.
 * @param {RichDoc} doc
 * @returns {string}
 */
export function plainText(doc) {
    return doc.map(blockText).filter(Boolean).join('\n\n');
}

/**
 * The footer of the field (`^cms-rich-media`): words, minutes at 220 a minute, media.
 * @param {RichDoc} doc
 * @returns {{ words: number; minutes: number; media: number }}
 */
export function countOf(doc) {
    const words = plainText(doc.filter((block) => block.t !== 'image' && block.t !== 'video' && block.t !== 'book')).split(/\s+/).filter(Boolean).length;
    const media = doc.filter((block) => block.t === 'image' || block.t === 'video' || block.t === 'book').length;
    return { words, minutes: Math.max(1, Math.round(words / 220)), media };
}
