// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
/**
 * The rich field's toolbar (F128, `^cms-rich-toolbar`, `^cms-rich-tooltip`), in the order of the approved component
 * `rich-text-v2`: each button with its name, its shortcut and what it does, and whether it stays in the narrow column.
 * The words are the kit's English (`RICH_TEXTS_EN`); a project hands its own through `KitTexts.rich`.
 */

export type RichCommand =
    | 'style' | 'bold' | 'italic' | 'underline' | 'strike' | 'sup' | 'sub' | 'mark' | 'link'
    | 'quote' | 'ul' | 'ol' | 'hr' | 'box' | 'img' | 'video' | 'book' | 'clear' | 'undo' | 'redo' | 'plus' | 'big';

export interface RichTool {
    id: RichCommand;
    /** The shortcut as the tooltip writes it (Mac signs; Ctrl stands for ⌘ elsewhere). */
    keys: string;
    /** A group ends after this button (a separator). */
    end?: boolean;
}

export const RICH_TOOLS: RichTool[] = [
    { id: 'style', keys: '', end: true },
    { id: 'bold', keys: '⌘B' },
    { id: 'italic', keys: '⌘I' },
    { id: 'underline', keys: '⌘U' },
    { id: 'strike', keys: '⇧⌘X' },
    { id: 'sup', keys: '⌘.' },
    { id: 'sub', keys: '⌘,' },
    { id: 'mark', keys: '⇧⌘H' },
    { id: 'link', keys: '⌘K', end: true },
    { id: 'quote', keys: '⇧⌘9' },
    { id: 'ul', keys: '⇧⌘8' },
    { id: 'ol', keys: '⇧⌘7' },
    { id: 'hr', keys: '' },
    { id: 'box', keys: '', end: true },
    { id: 'img', keys: '' },
    { id: 'video', keys: '' },
    { id: 'book', keys: '', end: true },
    { id: 'clear', keys: '⌘\\' },
    { id: 'undo', keys: '⌘Z' },
    { id: 'redo', keys: '⇧⌘Z' },
    { id: 'plus', keys: '/' },
    { id: 'big', keys: '' },
];

/** The buttons that show whether the selection already has them. */
export const PRESSABLE: RichCommand[] = ['bold', 'italic', 'underline', 'strike', 'sup', 'sub', 'mark', 'link', 'quote', 'ul', 'ol'];

/** The entries of the style menu and of «/» (`^cms-rich-style`, `^cms-rich-slash`). */
export type RichInsert = 'p' | 'lead' | 'h3' | 'quote' | 'ul' | 'ol' | 'hr' | 'box' | 'img' | 'video' | 'book';
export const SLASH_GROUPS: Array<{ group: 'text' | 'blocks' | 'media'; items: RichInsert[] }> = [
    { group: 'text', items: ['p', 'lead', 'h3'] },
    { group: 'blocks', items: ['quote', 'ul', 'ol', 'hr', 'box'] },
    { group: 'media', items: ['img', 'video', 'book'] },
];

export interface RichTexts {
    /** Each button: its name and what it does. */
    tools: Record<RichCommand, { name: string; does: string }>;
    /** The visible label of the style button, by the style of the paragraph. */
    styles: Record<'p' | 'lead' | 'h3', string>;
    groups: Record<'text' | 'blocks' | 'media', string>;
    inserts: Record<RichInsert, { name: string; does: string }>;
    toolbar: string;
    /** «{words} palavras · {minutes} min de leitura», and the media when there are some. */
    count: (words: number, minutes: number, media: number) => string;
    footHint: string;
    pasted: string;
    calloutPlaceholder: string;
    expanded: { kicker: string; close: string };
    link: { title: string; address: string; placeholder: string; outside: string; remove: string; apply: string; invalid: string };
    image: { title: string; choose: string; replace: string; uploading: string; rule: string; caption: string; alt: string; altPlaceholder: string; altMissing: string; fileMissing: string; width: string; column: string; wide: string; cancel: string; insert: string };
    video: { title: string; address: string; placeholder: string; note: string; invalid: string; cancel: string; insert: string; previewOf: (provider: string) => string };
    book: { title: string; search: string; placeholder: string; empty: string; loading: string; failed: string; cancel: string; insert: string };
    media: { remove: string; inGarden: string; video: string };
    /** The hint under a long plain text (`^cms-text-paragraphs`). */
    plainHint: string;
}

/**
 * The kit's own words for the rich field, in English (F332: the kit's code speaks English, as the V0's `interfaceInEnglish`
 * asks). A project in another language hands its own through `KitTexts.rich` (the MJRPpersonal its Portuguese).
 */
export const RICH_TEXTS_EN: RichTexts = {
    tools: {
        style: { name: 'Paragraph style', does: 'Text, Large text or Subheading. The sizes are the site\'s.' },
        bold: { name: 'Bold', does: 'Stresses the stretch; on the site, in the accent colour.' },
        italic: { name: 'Italic', does: 'For book titles, terms and light emphasis.' },
        underline: { name: 'Underline', does: 'A discreet grey line, so it does not look like a link.' },
        strike: { name: 'Strikethrough', does: 'Strikes the stretch out: an idea that changed.' },
        sup: { name: 'Superscript', does: 'Small text up high: notes and «1st».' },
        sub: { name: 'Subscript', does: 'Small text down low: formulas.' },
        mark: { name: 'Highlight', does: 'A soft background behind the stretch.' },
        link: { name: 'Link', does: 'To a page of the site or an outside address.' },
        quote: { name: 'Quote', does: 'A sentence set apart, large and in italics.' },
        ul: { name: 'List', does: 'Items with a bullet. Also: «- » at the start of the line.' },
        ol: { name: 'Numbered list', does: 'Items in order. Also: «1. » at the start of the line.' },
        hr: { name: 'Divider', does: 'A line between two stretches.' },
        box: { name: 'Callout box', does: 'A framed paragraph: a note or a warning.' },
        img: { name: 'Image', does: 'Upload an image, with a caption and a description.' },
        video: { name: 'Video', does: 'A YouTube or Vimeo link, played on the page.' },
        book: { name: 'Book card', does: 'A card with the cover that leads to the book\'s page.' },
        clear: { name: 'Clear formatting', does: 'Takes bold, italics and the rest off the stretch.' },
        undo: { name: 'Undo', does: '' },
        redo: { name: 'Redo', does: '' },
        plus: { name: 'Insert', does: 'Opens the insert menu. Also: type «/» at the start of the line.' },
        big: { name: 'Open larger', does: 'The same field on a wide screen, with the whole toolbar.' },
    },
    styles: { p: 'Text', lead: 'Large text', h3: 'Subheading' },
    groups: { text: 'Text', blocks: 'Blocks', media: 'Media' },
    inserts: {
        p: { name: 'Text', does: 'The normal size' },
        lead: { name: 'Large text', does: 'To open a stretch' },
        h3: { name: 'Subheading', does: 'Splits a long text' },
        quote: { name: 'Quote', does: 'A sentence set apart' },
        ul: { name: 'List', does: 'With bullets' },
        ol: { name: 'Numbered list', does: 'In order' },
        hr: { name: 'Divider', does: 'A line between stretches' },
        box: { name: 'Callout box', does: 'A note or a warning' },
        img: { name: 'Image', does: 'Upload, with a caption' },
        video: { name: 'Video', does: 'YouTube or Vimeo' },
        book: { name: 'Book card', does: 'A card with the cover' },
    },
    toolbar: 'Formatting of {label}',
    count: (words, minutes, media) => `${words} ${words === 1 ? 'word' : 'words'} · ${minutes} min read${media ? ` · ${media} ${media === 1 ? 'media item' : 'media items'}` : ''}`,
    footHint: '«/» inserts · Enter opens a paragraph · Shift+Enter breaks the line',
    pasted: 'Pasted without the outside formatting. The paragraphs stayed.',
    calloutPlaceholder: 'Write the note here.',
    expanded: { kicker: 'Editing', close: 'Back to the preview' },
    link: { title: 'Link', address: 'Address', placeholder: 'https://… or pick a page', outside: 'A link out of the site opens in another tab.', remove: 'Remove link', apply: 'Apply', invalid: 'That address does not work: use https://…, an e-mail (mailto:) or a page of the site.' },
    image: { title: 'Image', choose: 'Choose image', replace: 'Replace', uploading: 'Uploading…', rule: 'JPG, PNG or WebP, up to 4 MB.', caption: 'Caption, optional', alt: 'Description, for those who cannot see the image', altPlaceholder: 'What the image shows', altMissing: 'Write the description: without it the image does not go in.', fileMissing: 'Choose the image before inserting it.', width: 'Width', column: 'The text column\'s', wide: 'Wider', cancel: 'Cancel', insert: 'Insert image' },
    video: { title: 'Video', address: 'YouTube or Vimeo link', placeholder: 'https://www.youtube.com/watch?v=…', note: 'The video file is not uploaded: the site only shows the player, and stays light.', invalid: 'That link is not a YouTube or Vimeo video.', cancel: 'Cancel', insert: 'Insert video', previewOf: (provider) => `${provider} · plays inside the page` },
    book: { title: 'Book card', search: 'Search the shelf', placeholder: 'Title or author', empty: 'No book of the shelf by that name.', loading: 'Searching the shelf…', failed: 'The shelf did not answer. Try again.', cancel: 'Cancel', insert: 'Insert card' },
    media: { remove: 'Remove', inGarden: 'On the shelf', video: 'video' },
    plainHint: 'Plain text: a blank line becomes a paragraph on the site.',
};
