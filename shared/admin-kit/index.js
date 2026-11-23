// cópia carimbada do kit do admin do MJRP Harness · admin-kit v0.9.0 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
/**
 * The admin kit's core (F332, CC-ADR-0068): the one entrance to the part of the kit that knows neither React nor the
 * browser — the rich text document, the reader and the writer of its dialect, the safe addresses and the plain text. A
 * project and the kit's `ui/` import it only from here, by the alias `@mjrp/admin-kit-core`.
 *
 * Pure JavaScript with JSDoc types: no package, no engine global.
 */
/** @typedef {import('./rich/doc.js').RichBlock} RichBlock */
/** @typedef {import('./rich/doc.js').RichDoc} RichDoc */
/** @typedef {import('./rich/doc.js').RichInline} RichInline */
/** @typedef {import('./rich/doc.js').RichMarkKind} RichMarkKind */
/** @typedef {import('./rich/doc.js').RichSize} RichSize */
export { BOOK_SLUG, RICH_SIZES, bookPath, bookSlugOf, countOf, inlineText, plainText, safeHref, safeImage, videoEmbed, videoOf } from './rich/doc.js';
export { normalizeDoc, normalizeInline, parseInline, parseRich, toMarkdown } from './rich/markdown.js';
