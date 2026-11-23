// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
"use client";

/**
 * The kit's rich text field (F128; `^cms-rich-*`, the approved component `rich-text-v2`): the same in the Jardim's CMS
 * and in the professional one. The author writes in `contenteditable` (campo-proprio: this is the rich field); every change is read back from the DOM into the
 * document and saved as the dialect's Markdown (ADR-0015), so whatever markup the browser makes, the value is the
 * dialect. The toolbar has a tooltip on every button (name, shortcut, what it does); the narrow column keeps the
 * whole toolbar wrapped in rows (never the essentials and «…»); «Maior» opens the same field over the screen.
 */
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ClipboardEvent as ReactClipboardEvent, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type ReactNode, type RefObject } from 'react';
import { countOf, parseRich, safeHref as safeUrl, toMarkdown, videoOf } from '@mjrp/admin-kit-core';
import { nameOf } from '../values';
import { fromEditor, mediaHtml, toEditorHtml, type EditorBook } from '../rich/editor-html';
import { PRESSABLE, RICH_TEXTS_EN, RICH_TOOLS, type RichTool, SLASH_GROUPS, type RichCommand, type RichInsert, type RichTexts } from '../rich/tools';

/** What the field asks of the project: the image upload of its CMS, the shelf, the pages for a link. */
export interface RichFieldPorts {
    uploadImage?: (file: File) => Promise<{ ok: true; src: string } | { ok: false; message: string }>;
    /** The image rule, in one line, before choosing. */
    imageRule?: string;
    /** The books of the Jardim's shelf, for the card (`^cms-rich-book`). */
    books?: () => Promise<EditorBook[]>;
    /** Short ways to a page of the site, in the link box. */
    pages?: Array<{ label: string; href: string }>;
}

export interface RichTextFieldProps {
    id?: string;
    label: string;
    value: string;
    onChange: (markdown: string) => void;
    ports?: RichFieldPorts;
    texts?: RichTexts;
    invalid?: boolean;
    required?: boolean;
    placeholder?: string;
}

const TAIL: RichCommand[] = ['plus', 'big'];
/** An icon of the toolbar, drawn as elements: no HTML goes into the page as a string. */
const icon = (shapes: ReactNode) => <svg viewBox="0 0 24 24" aria-hidden="true">{shapes}</svg>;
const ICONS: Partial<Record<RichCommand | RichInsert, ReactNode>> = {
    mark: icon(<><path d="M4 20h7" /><path d="m14.5 4.5 5 5L11 18l-5 1 1-5z" /></>),
    link: icon(<><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" /><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" /></>),
    quote: icon(<><path d="M7 7h4v4c0 3-2 5-4 5" /><path d="M14 7h4v4c0 3-2 5-4 5" /></>),
    ul: icon(<><circle cx="5" cy="7" r="1" /><circle cx="5" cy="12" r="1" /><circle cx="5" cy="17" r="1" /><path d="M9 7h11M9 12h11M9 17h11" /></>),
    ol: icon(<><path d="M4 6h2v4M4 10h3M4 14h3l-3 4h3" /><path d="M10 7h10M10 12h10M10 17h10" /></>),
    hr: icon(<><path d="M3 12h18" /><path d="M8 7h8M8 17h8" opacity=".35" /></>),
    box: icon(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 5v14" /></>),
    img: icon(<><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m21 16-5-5-8 8" /></>),
    video: icon(<><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3z" /></>),
    book: icon(<><path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" /><path d="M5 17a3 3 0 0 1 3-3h10" /></>),
    clear: icon(<><path d="M6 6h12M12 6l-3 13" /><path d="m4 20 16-16" opacity=".8" /></>),
    undo: icon(<><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></>),
    redo: icon(<><path d="m15 14 5-5-5-5" /><path d="M20 9H10a6 6 0 0 0 0 12h3" /></>),
    big: icon(<><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></>),
    plus: icon(<><path d="M12 5v14M5 12h14" /></>),
};
const TEXT_LABEL: Partial<Record<RichCommand, ReactNode>> = { bold: <b>B</b>, italic: <i>I</i>, underline: <u>U</u>, strike: <s>S</s>, sup: 'x²', sub: 'x₂' };
const INSERT_ICON: Record<RichInsert, ReactNode> = { p: 'T', lead: 'T+', h3: 'H', quote: ICONS.quote, ul: ICONS.ul, ol: ICONS.ol, hr: ICONS.hr, box: ICONS.box, img: ICONS.img, video: ICONS.video, book: ICONS.book };

const SHIFT_KEYS = new Map<string, RichCommand>([['x', 'strike'], ['h', 'mark'], ['9', 'quote'], ['(', 'quote'], ['8', 'ul'], ['*', 'ul'], ['7', 'ol'], ['&', 'ol']]);
const PLAIN_KEYS = new Map<string, RichCommand>([['k', 'link'], ['.', 'sup'], [',', 'sub'], ['\\', 'clear']]);

/** Shortcuts beyond the browser's own ⌘B, ⌘I, ⌘U, ⌘Z. */
function shortcutOf(event: ReactKeyboardEvent): RichCommand | null {
    if (!(event.metaKey || event.ctrlKey) || event.altKey) return null;
    const key = event.key.toLowerCase();
    return (event.shiftKey ? SHIFT_KEYS : PLAIN_KEYS).get(key) ?? null;
}

const normal = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const escapeHtml = (text: string) => text.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]!));

type Menu = { kind: 'style' | 'slash'; left: number; top: number; active: number };
type Pop = 'link' | 'img' | 'video' | 'book';
type Tip = { id: RichCommand; left: number; top: number };
type Style = 'p' | 'lead' | 'h3';
type Pressed = Partial<Record<RichCommand, boolean>>;

/** The browser's own command of a tool, where it has one. */
const NATIVE: Partial<Record<RichCommand, string>> = { bold: 'bold', italic: 'italic', underline: 'underline', strike: 'strikeThrough', sup: 'superscript', sub: 'subscript', undo: 'undo', redo: 'redo', ul: 'insertUnorderedList', ol: 'insertOrderedList' };
const POPS: RichCommand[] = ['link', 'img', 'video', 'book'];
const isPop = (command: RichCommand): command is Pop => POPS.includes(command);
/** What a tool opens, for those who do not see it: a menu, a box, or nothing. */
function popupOf(id: RichCommand): 'menu' | 'dialog' | undefined {
    if (id === 'style' || id === 'plus') return 'menu';
    return isPop(id) ? 'dialog' : undefined;
}

/** The entries of the open menu, in the order the arrows walk them. */
const menuItemsOf = (menu: Menu | null): RichInsert[] => (menu?.kind === 'style' ? SLASH_GROUPS[0].items : SLASH_GROUPS.flatMap((group) => group.items));

/** The element a node of the text is, or is in. */
const elementOf = (node: Node): HTMLElement | null => (node.nodeType === 1 ? (node as HTMLElement) : node.parentElement);

/** The element the caret is in, when the caret is inside the field. */
function caretElement(field: HTMLElement | null): HTMLElement | null {
    const node = window.getSelection()?.anchorNode;
    if (!node || !field?.contains(node)) return null;
    return elementOf(node);
}

function commandState(command: string): boolean {
    try { return document.queryCommandState(command); } catch { return false; }
}

/** The tools the selection already has, for the pressed buttons. */
function pressedAt(element: HTMLElement): Pressed {
    return {
        bold: commandState('bold'), italic: commandState('italic'), underline: commandState('underline'), strike: commandState('strikeThrough'),
        sup: !!element.closest('sup'), sub: !!element.closest('sub'), mark: !!element.closest('mark'), link: !!element.closest('a'),
        quote: !!element.closest('blockquote'), ul: !!element.closest('ul'), ol: !!element.closest('ol'),
    };
}

/** The style of the paragraph the caret is in. */
function styleAt(element: HTMLElement): Style {
    const block = element.closest('h1, h2, h3, h4, p, li, blockquote');
    if (block && /^H[1-6]$/.test(block.tagName)) return block.tagName === 'H4' ? 'lead' : 'h3';
    return block?.classList.contains('lead') ? 'lead' : 'p';
}

/** The text of the caret's line before the caret. */
function textBefore(selection: Selection | null, block: HTMLElement | null): string {
    if (!selection?.rangeCount || !block) return '';
    const range = document.createRange();
    range.selectNodeContents(block);
    range.setEnd(selection.anchorNode!, selection.anchorOffset);
    return range.toString();
}

/** A plain text as the HTML that goes into the field: from outside, only the paragraphs come in (`rich-text-v2`); the rest of the formatting is left behind. */
function pastedHtml(text: string): string {
    const parts = text.replace(/\r\n?/g, '\n').split(/\n\s*\n/).map((part) => escapeHtml(part.trim()).replace(/\n/g, '<br>')).filter(Boolean);
    return parts.length > 1 ? parts.map((part) => `<p>${part}</p>`).join('') : parts[0] ?? '';
}

/** How the field's frame is named: a dialog while it is open larger. */
const frameNaming = (big: boolean, labelId: string) => (big ? { className: 'ak-rt big', role: 'dialog', 'aria-modal': true, 'aria-labelledby': labelId } : { className: 'ak-rt' });

/** How the editable body is named and what it says of itself: by the visible title while open larger, else by its label. */
function bodyNaming({ big, label, labelId, invalid, required }: { big: boolean; label: string; labelId: string; invalid?: boolean; required?: boolean }) {
    return { 'aria-label': big ? undefined : label, 'aria-labelledby': big ? labelId : undefined, 'aria-invalid': invalid || undefined, 'aria-required': required || undefined };
}

interface ToolHandlers {
    run: (command: RichCommand) => void;
    showTip: (target: HTMLElement, tool: RichCommand) => void;
    hideTip: () => void;
}

/** One button of the toolbar, and the separator after it when its group ends there. */
function ToolButton({ tool, texts, styleNow, pressed, run, showTip, hideTip }: { tool: RichTool; texts: RichTexts; styleNow: Style; pressed: Pressed } & ToolHandlers) {
    const t = texts.tools[tool.id];
    const inner = tool.id === 'style' ? `${texts.styles[styleNow]} ▾` : TEXT_LABEL[tool.id] ?? ICONS[tool.id] ?? '';
    return (
        <>
            <button type="button" data-cmd={tool.id}
                className={tool.id === 'style' ? 'ak-rt-style' : undefined}
                aria-label={`${t.name}${tool.keys ? ` (${tool.keys})` : ''}`}
                aria-pressed={PRESSABLE.includes(tool.id) ? !!pressed[tool.id] : undefined}
                aria-haspopup={popupOf(tool.id)}
                onMouseEnter={(event) => showTip(event.currentTarget, tool.id)} onMouseLeave={hideTip}
                onFocus={(event) => showTip(event.currentTarget, tool.id)} onBlur={hideTip}
                onClick={() => run(tool.id)}>{inner}</button>
            {tool.end ? <span className="ak-rt-sep" aria-hidden="true" /> : null}
        </>
    );
}

/** The toolbar, whole in any width. */
function Toolbar({ label, ...rest }: { label: string; texts: RichTexts; styleNow: Style; pressed: Pressed } & ToolHandlers) {
    const { texts } = rest;
    const visibleText = useMemo(() => texts.toolbar.replace('{label}', label), [texts.toolbar, label]);
    const button = (tool: RichTool) => <ToolButton key={tool.id} tool={tool} {...rest} />;
    return (
        <div className="ak-rt-bar" role="toolbar" aria-label={visibleText}
            onMouseDown={(event) => { if ((event.target as HTMLElement).closest('button')) event.preventDefault(); }}>
            {RICH_TOOLS.filter((tool) => !TAIL.includes(tool.id)).map(button)}
            {/* O «+» e a tela cheia ficam juntos no fim da barra: quebram juntos, nunca um sozinho (F135, UAT-272). */}
            <span className="ak-rt-tail">{RICH_TOOLS.filter((tool) => TAIL.includes(tool.id)).map(button)}</span>
        </div>
    );
}

/** The tooltip of a tool: its name, its shortcut and what it does. */
function Tooltip({ tip, texts }: { tip: Tip; texts: RichTexts }) {
    const tool = texts.tools[tip.id];
    const keys = RICH_TOOLS.find((entry) => entry.id === tip.id)?.keys ?? '';
    return (
        <div className="ak-rt-tip" role="tooltip" style={{ left: tip.left, top: tip.top }}>
            <b>{tool.name}{keys && <kbd>{keys}</kbd>}</b>
            {tool.does && <span>{tool.does}</span>}
        </div>
    );
}

/** The style menu and the insert menu (`^cms-rich-style`, `^cms-rich-slash`). */
function InsertMenu({ menu, texts, insert }: { menu: Menu; texts: RichTexts; insert: (what: RichInsert) => void }) {
    const active = menuItemsOf(menu)[menu.active];
    return (
        <div className="ak-rt-menu" role="menu" style={{ left: menu.left, top: menu.top }} onMouseDown={(event) => event.preventDefault()}>
            {(menu.kind === 'style' ? [SLASH_GROUPS[0]] : SLASH_GROUPS).map((group) => [
                <span key={group.group} className="ak-rt-grp">{texts.groups[group.group]}</span>,
                ...group.items.map((item) => (
                    <button key={item} type="button" role="menuitem" data-ins={item} className={active === item ? 'on' : undefined} onClick={() => insert(item)}>
                        <span className="ak-rt-ic">{INSERT_ICON[item]}</span>{texts.inserts[item].name}<small>{texts.inserts[item].does}</small>
                    </button>
                )),
            ])}
        </div>
    );
}

/** The title over the field while it is open larger, with the way back. */
function LargerHead({ open, labelId, label, texts, close }: { open: boolean; labelId: string; label: string; texts: RichTexts; close: () => void }) {
    if (!open) return null;
    return (
        <header className="ak-rt-head">
            <span><small>{texts.expanded.kicker}</small><b id={labelId}>{label}</b></span>
            <button type="button" className="ak-btn pri" onClick={close}>{texts.expanded.close}</button>
        </header>
    );
}

export function RichTextField({ id, label, value, onChange, ports = {}, texts = RICH_TEXTS_EN, invalid, required, placeholder }: RichTextFieldProps) {
    const own = useId();
    const labelId = nameOf(own, 'label');
    const root = useRef<HTMLDivElement>(null);
    const body = useRef<HTMLDivElement>(null);
    const saved = useRef<Range | null>(null);
    const emitted = useRef(value);
    // The values this field sent: the screen hands them back a render or two later, while the author already typed on.
    // Only a value that is not one of them came from outside (the other language, a translation, a reload).
    const sent = useRef<string[]>([value]);
    const shelf = useRef<Record<string, EditorBook>>({});
    const words = texts.media;
    // The first drawing of the saved text is the field's own, made in the browser before the first paint, the same way a value
    // from outside is drawn again below: React draws the editable body empty (on the server too) and never touches what is
    // inside it, so nothing the author typed is rewritten. The text is kept from the first render: it never changes.
    const [initial] = useState(() => toEditorHtml(parseRich(value), words));
    useLayoutEffect(() => { if (body.current) body.current.innerHTML = initial; }, [initial]);
    const [count, setCount] = useState(() => countOf(parseRich(value)));
    const [pressed, setPressed] = useState<Pressed>({});
    const [styleNow, setStyleNow] = useState<Style>('p');
    const [tip, setTip] = useState<Tip | null>(null);
    const [menu, setMenu] = useState<Menu | null>(null);
    const [pop, setPop] = useState<Pop | null>(null);
    const [big, setBig] = useState(false);
    const [pasted, setPasted] = useState(false);

    /** Read the field back and hand the Markdown on, when it changed. */
    const emit = useCallback(() => {
        const element = body.current;
        if (!element) return;
        const doc = fromEditor(element);
        setCount(countOf(doc));
        const markdown = toMarkdown(doc);
        if (markdown !== emitted.current) {
            emitted.current = markdown;
            sent.current = [...sent.current.slice(-49), markdown];
            onChange(markdown);
        }
    }, [onChange]);

    // A value that changes from outside (the other language, a translation accepted, undo of the screen) is drawn again.
    useEffect(() => {
        if (value === emitted.current || sent.current.includes(value) || !body.current) return;
        emitted.current = value;
        sent.current = [value];
        const doc = parseRich(value);
        body.current.innerHTML = toEditorHtml(doc, words, shelf.current);
        setCount(countOf(doc));
    }, [value, words]);

    // The covers of the cards already in the text, once the shelf answers.
    useEffect(() => {
        if (!ports.books || !parseRich(value).some((block) => block.t === 'book')) return;
        let live = true;
        ports.books().then((books) => {
            if (!live || !body.current) return;
            shelf.current = Object.fromEntries(books.map((book) => [book.slug, book]));
            body.current.querySelectorAll<HTMLElement>('[data-rt="book"]').forEach((card) => {
                const slug = card.getAttribute('data-slug') ?? '';
                if (!shelf.current[slug]) return;
                const html = mediaHtml({ t: 'book', slug, title: card.getAttribute('data-title') ?? '' }, words, shelf.current);
                card.outerHTML = html;
            });
        }).catch(() => {});
        return () => { live = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- só no primeiro desenho: um cartão inserido depois já vem com a capa
    }, []);

    const keep = useCallback(() => {
        const selection = window.getSelection();
        if (selection?.rangeCount && body.current?.contains(selection.anchorNode)) saved.current = selection.getRangeAt(0).cloneRange();
    }, []);
    const restore = useCallback(() => {
        const element = body.current;
        if (!element) return;
        element.focus();
        const selection = window.getSelection();
        if (saved.current && selection) {
            selection.removeAllRanges();
            selection.addRange(saved.current);
        }
    }, []);

    /** The block the caret is in, inside the field. */
    const blockAtCaret = useCallback((): HTMLElement | null => {
        return caretElement(body.current)?.closest<HTMLElement>('p, h1, h2, h3, h4, h5, h6, li, blockquote, div.callout') ?? null;
    }, []);

    const refresh = useCallback(() => {
        const element = caretElement(body.current);
        if (!element) return;
        setPressed(pressedAt(element));
        setStyleNow(styleAt(element));
    }, []);

    useEffect(() => {
        const onSelection = () => { keep(); refresh(); };
        document.addEventListener('selectionchange', onSelection);
        return () => document.removeEventListener('selectionchange', onSelection);
    }, [keep, refresh]);

    // Esc closes what is open, and «Maior» last; a click outside closes the menu and the box.
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            if (menu || pop) { setMenu(null); setPop(null); return; }
            if (big) setBig(false);
        };
        const onDown = (event: MouseEvent) => { if (root.current && !root.current.contains(event.target as Node)) { setMenu(null); setPop(null); } };
        document.addEventListener('keydown', onKey);
        document.addEventListener('mousedown', onDown);
        return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown); };
    }, [menu, pop, big]);

    const exec = (command: string, argument?: string) => {
        restore();
        try { document.execCommand(command, false, argument); } catch { /* the browser has no such command */ }
    };

    const insertHtml = (html: string) => {
        restore();
        document.execCommand('insertHTML', false, html);
        emit();
    };

    const setBlock = (kind: 'p' | 'lead' | 'h3' | 'quote') => {
        restore();
        document.execCommand('defaultParagraphSeparator', false, 'p');
        if (kind === 'quote') {
            const inQuote = !!blockAtCaret()?.closest('blockquote');
            document.execCommand('formatBlock', false, inQuote ? 'p' : 'blockquote');
        } else {
            document.execCommand('formatBlock', false, kind === 'h3' ? 'h3' : 'p');
            const block = blockAtCaret();
            if (block?.tagName === 'P') block.classList.toggle('lead', kind === 'lead');
        }
        emit();
        refresh();
    };

    const toggleMark = () => {
        restore();
        const selection = window.getSelection();
        if (!selection?.rangeCount || selection.isCollapsed) return;
        const range = selection.getRangeAt(0);
        const start = range.commonAncestorContainer;
        const inMark = (start.nodeType === 1 ? (start as Element) : start.parentElement)?.closest('mark');
        if (inMark) inMark.replaceWith(...Array.from(inMark.childNodes));
        else {
            const mark = document.createElement('mark');
            mark.append(range.extractContents());
            range.insertNode(mark);
            selection.removeAllRanges();
            const next = document.createRange();
            next.selectNodeContents(mark);
            selection.addRange(next);
        }
        emit();
        refresh();
    };

    const clearFormat = () => {
        exec('removeFormat');
        exec('unlink');
        const selection = window.getSelection();
        if (selection?.rangeCount) {
            const range = selection.getRangeAt(0);
            body.current?.querySelectorAll('mark').forEach((mark) => { if (range.intersectsNode(mark)) mark.replaceWith(...Array.from(mark.childNodes)); });
        }
        emit();
        refresh();
    };

    const openMenu = (kind: Menu['kind'], at?: DOMRect) => {
        keep();
        setTip(null);
        setPop(null);
        const box = root.current?.querySelector('.ak-rt-box')?.getBoundingClientRect();
        const anchor = at ?? root.current?.querySelector(kind === 'style' ? '[data-cmd="style"]' : '[data-cmd="plus"]')?.getBoundingClientRect();
        if (!box || !anchor) return;
        setMenu({ kind, left: Math.max(6, Math.min(anchor.left - box.left, box.width - 266)), top: anchor.bottom - box.top + 6, active: 0 });
    };

    const insert = (what: RichInsert) => {
        setMenu(null);
        if (what === 'p' || what === 'lead' || what === 'h3') return setBlock(what);
        run(what);
    };

    /** What each tool does that is not a command of the browser nor a box. */
    const actions: Partial<Record<RichCommand, () => void>> = {
        style: () => openMenu('style'),
        plus: () => openMenu('slash'),
        big: () => { setMenu(null); setPop(null); setBig((open) => !open); },
        mark: toggleMark,
        clear: clearFormat,
        quote: () => setBlock('quote'),
        hr: () => insertHtml('<hr><p><br></p>'),
        box: () => insertHtml(`<div class="callout" data-rt="callout"><p>${texts.calloutPlaceholder}</p></div><p><br></p>`),
    };

    const run = (command: RichCommand) => {
        setTip(null);
        if (isPop(command)) { keep(); setMenu(null); setPop(command); return; }
        const action = actions[command];
        if (action) { action(); return; }
        const name = NATIVE[command];
        if (name) exec(name);
        emit();
        refresh();
    };

    const showTip = (target: HTMLElement, tool: RichCommand) => {
        const box = root.current?.querySelector('.ak-rt-box')?.getBoundingClientRect();
        const at = target.getBoundingClientRect();
        if (!box) return;
        setTip({ id: tool, left: Math.max(4, Math.min(at.left - box.left + at.width / 2 - 120, box.width - 244)), top: at.bottom - box.top + 6 });
    };

    const menuItems = menuItemsOf(menu);

    /** A key while a menu is open: whether the key was the menu's (the arrows, Enter, Esc); any other closes it and goes on. */
    const menuKey = (event: ReactKeyboardEvent<HTMLDivElement>, open: Menu): boolean => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            const step = event.key === 'ArrowDown' ? 1 : -1;
            setMenu({ ...open, active: (open.active + step + menuItems.length) % menuItems.length });
            return true;
        }
        if (event.key === 'Enter') { event.preventDefault(); insert(menuItems[open.active]); return true; }
        if (event.key === 'Escape') { event.preventDefault(); setMenu(null); return true; }
        setMenu(null);
        return false;
    };

    /** «/» at the start of a line opens the insert menu (`^cms-rich-slash`). */
    const slashKey = (event: ReactKeyboardEvent<HTMLDivElement>, selection: Selection | null, block: HTMLElement | null, before: string) => {
        if (before.trim() || !selection?.isCollapsed) return;
        event.preventDefault();
        const rect = selection.getRangeAt(0).getBoundingClientRect();
        openMenu('slash', rect.width || rect.height ? rect : block?.getBoundingClientRect());
    };

    /** «- » and «1. » at the start of a line open a list. */
    const listKey = (event: ReactKeyboardEvent<HTMLDivElement>, selection: Selection | null, block: HTMLElement | null, before: string) => {
        if (!selection?.isCollapsed || !block || block.closest('li')) return;
        const marker = before.replace(/\u00A0/g, ' ');
        const bullet = marker === '-' || marker === '*';
        if (!bullet && !/^1[.)]$/.test(marker)) return;
        event.preventDefault();
        for (let k = 0; k < marker.length; k++) document.execCommand('delete');
        document.execCommand(bullet ? 'insertUnorderedList' : 'insertOrderedList');
        emit();
    };

    const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
        if (menu && menuKey(event, menu)) return;
        const shortcut = shortcutOf(event);
        if (shortcut) { event.preventDefault(); run(shortcut); return; }
        const selection = window.getSelection();
        const block = blockAtCaret();
        const before = textBefore(selection, block);
        if (event.key === '/') slashKey(event, selection, block, before);
        else if (event.key === ' ') listKey(event, selection, block, before);
    };

    /** «Remove» on a media takes it out of the text. */
    const onBodyClick = (event: ReactMouseEvent<HTMLDivElement>) => {
        const remove = (event.target as HTMLElement).closest('.ak-rt-x');
        if (!remove) return;
        event.preventDefault();
        remove.closest('[data-rt]')?.remove();
        emit();
    };

    const onPaste = (event: ReactClipboardEvent<HTMLDivElement>) => {
        event.preventDefault();
        const text = event.clipboardData.getData('text/plain');
        if (!text) return;
        document.execCommand('insertHTML', false, pastedHtml(text));
        setPasted(true);
        emit();
    };

    return (
        <div ref={root} {...frameNaming(big, labelId)}>
            <div className="ak-rt-in">
                <LargerHead open={big} labelId={labelId} label={label} texts={texts} close={() => setBig(false)} />
                <div className={invalid ? 'ak-rt-box invalid' : 'ak-rt-box'}>
                    <Toolbar label={label} texts={texts} styleNow={styleNow} pressed={pressed} run={run} showTip={showTip} hideTip={() => setTip(null)} />
                    {/* campo-proprio: o corpo editável do próprio campo rico */}
                    <div ref={body} id={id} className="ak-rt-body" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true"
                        {...bodyNaming({ big, label, labelId, invalid, required })}
                        data-placeholder={placeholder} spellCheck
                        onFocus={() => { try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch { /* old browser */ } }}
                        onInput={() => { keep(); emit(); }}
                        onKeyDown={onKeyDown}
                        onKeyUp={keep} onMouseUp={keep}
                        onClick={onBodyClick}
                        onDrop={(event) => event.preventDefault()}
                        onPaste={onPaste} />
                    <div className="ak-rt-foot"><span>{texts.count(count.words, count.minutes, count.media)}</span><span>{texts.footHint}</span></div>
                    {tip && <Tooltip tip={tip} texts={texts} />}
                    {menu && <InsertMenu menu={menu} texts={texts} insert={insert} />}
                    {pop && <MediaBox kind={pop} texts={texts} ports={ports} restore={restore} emit={emit} insertHtml={insertHtml} close={() => setPop(null)}
                        rememberBook={(book) => { shelf.current[book.slug] = book; }} />}
                </div>
                {pasted && <p className="ak-rt-note" role="status">{texts.pasted}</p>}
                {big && <span className="ak-rt-shade" aria-hidden="true" onClick={() => setBig(false)} />}
            </div>
        </div>
    );
}

/** The words of a box: its title, the button that leaves it and the one that applies it. */
function boxWords(kind: Pop, t: RichTexts): { title: string; back: string; go: string } {
    switch (kind) {
        case 'link': return { title: t.link.title, back: t.link.remove, go: t.link.apply };
        case 'img': return { title: t.image.title, back: t.image.cancel, go: t.image.insert };
        case 'video': return { title: t.video.title, back: t.video.cancel, go: t.video.insert };
        default: return { title: t.book.title, back: t.book.cancel, go: t.book.insert };
    }
}

type FirstInput = RefObject<HTMLInputElement | null>;

/** The link box's fields (`^cms-rich-link`): the address and the short ways to a page of the site. */
function LinkFields({ t, pages, first, address, invalid, write }: { t: RichTexts; pages: RichFieldPorts['pages']; first: FirstInput; address: string; invalid: boolean; write: (address: string) => void }) {
    return (
        <>
            <label>{t.link.address}<input ref={first} type="url" value={address} placeholder={t.link.placeholder} aria-invalid={invalid || undefined} onChange={(event) => write(event.target.value)} /></label>
            {pages?.length ? <div className="ak-rt-chips">{pages.map((page) => <button key={page.href} type="button" onClick={() => write(page.href)}>{page.label}</button>)}</div> : null}
            <p className="ak-rt-hint">{t.link.outside}</p>
        </>
    );
}

interface ImageFieldsProps {
    t: RichTexts;
    ports: RichFieldPorts;
    first: FirstInput;
    file: FirstInput;
    image: { src: string; name: string } | null;
    busy: boolean;
    caption: string;
    setCaption: (caption: string) => void;
    alt: string;
    writeAlt: (alt: string) => void;
    altMissing: boolean;
    wide: boolean;
    setWide: (wide: boolean) => void;
    send: (chosen: File) => Promise<void>;
}

/** What the button of the file says: sending, replacing or choosing. */
function chooseWord(t: RichTexts, busy: boolean, chosen: boolean): string {
    if (busy) return t.image.uploading;
    return chosen ? t.image.replace : t.image.choose;
}

/** The image box's fields (`^cms-rich-image`): the file, the caption, the description and the width. */
function ImageFields({ t, ports, first, file, image, busy, caption, setCaption, alt, writeAlt, altMissing, wide, setWide, send }: ImageFieldsProps) {
    return (
        <>
            <div className="ak-rt-drop">
                {image ? <img src={image.src} alt="" /> : <span className="ak-rt-cover" aria-hidden="true" />}
                <span>
                    {image && <b>{image.name}<br /></b>}
                    <button type="button" className="ak-btn sm" disabled={busy || !ports.uploadImage} onClick={() => file.current?.click()}>{chooseWord(t, busy, !!image)}</button>
                    <span className="ak-rt-hint">{ports.imageRule ?? t.image.rule}</span>
                </span>
                <input ref={file} type="file" hidden accept="image/png, image/jpeg, image/webp" onChange={(event) => { const chosen = event.target.files?.[0]; event.target.value = ''; if (chosen) void send(chosen); }} />
            </div>
            {/* campo-proprio: a legenda da imagem, dentro do campo rico */}
            <label>{t.image.caption}<input ref={first} type="text" value={caption} onChange={(event) => setCaption(event.target.value)} /></label>
            {/* campo-proprio: o texto alternativo da imagem, dentro do campo rico */}
            <label>{t.image.alt}<input type="text" className="ak-rt-alt" value={alt} placeholder={t.image.altPlaceholder} aria-invalid={altMissing || undefined} aria-required="true" onChange={(event) => writeAlt(event.target.value)} /></label>
            <span className="ak-rt-lbl">{t.image.width}</span>
            <div className="ak-rt-seg">
                <button type="button" aria-pressed={!wide} onClick={() => setWide(false)}>{t.image.column}</button>
                <button type="button" aria-pressed={wide} onClick={() => setWide(true)}>{t.image.wide}</button>
            </div>
        </>
    );
}

type Video = NonNullable<ReturnType<typeof videoOf>>;

/** The video box's fields (`^cms-rich-video`): the address and, when it is a video, its preview. */
function VideoFields({ t, first, address, invalid, write, video }: { t: RichTexts; first: FirstInput; address: string; invalid: boolean; write: (address: string) => void; video: Video | null }) {
    const youtube = video?.provider === 'youtube';
    return (
        <>
            <label>{t.video.address}<input ref={first} type="url" value={address} placeholder={t.video.placeholder} aria-invalid={invalid || undefined} onChange={(event) => write(event.target.value)} /></label>
            {video && (
                <div className="ak-rt-vprev">
                    <span style={youtube ? { backgroundImage: `url('https://i.ytimg.com/vi/${video.id}/hqdefault.jpg')` } : undefined} />
                    <span className="ak-rt-hint">{t.video.previewOf(youtube ? 'YouTube' : 'Vimeo')}</span>
                </div>
            )}
            <p className="ak-rt-hint">{t.video.note}</p>
        </>
    );
}

interface BookFieldsProps {
    t: RichTexts;
    first: FirstInput;
    query: string;
    search: (query: string) => void;
    loading: boolean;
    found: EditorBook[];
    pick: number;
    setPick: (index: number) => void;
    insertAt: (index: number) => void;
}

/** The books found on the shelf, the chosen one marked. */
function BookOptions({ found, pick, setPick, insertAt }: Pick<BookFieldsProps, 'found' | 'pick' | 'setPick' | 'insertAt'>): ReactNode {
    return found.map((book, index) => (
        <button key={book.slug} type="button" role="option" aria-selected={index === pick} className={index === pick ? 'on' : undefined} onClick={() => setPick(index)} onDoubleClick={() => insertAt(index)}>
            {book.cover ? <img src={book.cover} alt="" /> : <span className="ak-rt-cover" aria-hidden="true" />}
            <span><b>{book.title}</b>{[book.author, book.stage].filter(Boolean).join(' · ')}</span>
        </button>
    ));
}

/** The book box's fields (`^cms-rich-book`): the search of the shelf and what it found. */
function BookFields({ t, first, query, search, loading, found, pick, setPick, insertAt }: BookFieldsProps) {
    return (
        <>
            <label>{t.book.search}<input ref={first} type="search" value={query} placeholder={t.book.placeholder} onChange={(event) => search(event.target.value)} /></label>
            <div className="ak-rt-books" role="listbox" aria-label={t.book.search}>
                {loading || !found.length
                    ? <p className="ak-rt-hint">{loading ? t.book.loading : t.book.empty}</p>
                    : <BookOptions found={found} pick={pick} setPick={setPick} insertAt={insertAt} />}
            </div>
        </>
    );
}

/** The boxes of link, image, video and book (`^cms-rich-link`, `^cms-rich-image`, `^cms-rich-video`, `^cms-rich-book`). */
function MediaBox({ kind, texts, ports, restore, emit, insertHtml, close, rememberBook }: {
    kind: Pop;
    texts: RichTexts;
    ports: RichFieldPorts;
    restore: () => void;
    emit: () => void;
    insertHtml: (html: string) => void;
    close: () => void;
    rememberBook: (book: EditorBook) => void;
}) {
    const [address, setAddress] = useState('');
    const [error, setError] = useState('');
    const [caption, setCaption] = useState('');
    const [alt, setAlt] = useState('');
    const [wide, setWide] = useState(false);
    const [image, setImage] = useState<{ src: string; name: string } | null>(null);
    const [busy, setBusy] = useState(false);
    const [query, setQuery] = useState('');
    const [books, setBooks] = useState<EditorBook[] | null>(() => (kind === 'book' && !ports.books ? [] : null));
    const [pick, setPick] = useState(0);
    const file = useRef<HTMLInputElement>(null);
    const first = useRef<HTMLInputElement>(null);
    const t = texts;

    useEffect(() => { first.current?.focus(); }, []);
    useEffect(() => {
        if (kind !== 'book' || !ports.books) return;
        let live = true;
        ports.books().then((list) => { if (live) setBooks(list); }).catch(() => { if (live) { setBooks([]); setError(t.book.failed); } });
        return () => { live = false; };
    }, [kind, ports, t.book.failed]);

    const found = useMemo(() => {
        if (!books) return [];
        const words = normal(query).split(/\s+/).filter(Boolean);
        return books.filter((book) => words.every((word) => normal(`${book.title} ${book.author ?? ''}`).includes(word))).slice(0, 8);
    }, [books, query]);
    const video = videoOf(address);

    const applyLink = () => {
        const href = safeUrl(address);
        if (!href) { setError(t.link.invalid); return; }
        close();
        restore();
        const selection = window.getSelection();
        if (selection?.isCollapsed) document.execCommand('insertHTML', false, `<a href="${escapeHtml(href)}">${escapeHtml(address)}</a>`);
        else document.execCommand('createLink', false, href);
        emit();
    };

    const insertImage = () => {
        if (!image) { setError(t.image.fileMissing); return; }
        if (!alt.trim()) { setError(t.image.altMissing); return; }
        close();
        insertHtml(`${mediaHtml({ t: 'image', src: image.src, alt: alt.trim(), caption: caption.trim(), wide }, t.media)}<p><br></p>`);
    };

    const insertVideo = () => {
        if (!video) { setError(t.video.invalid); return; }
        close();
        const url = video.provider === 'youtube' ? `https://www.youtube.com/watch?v=${video.id}` : `https://vimeo.com/${video.id}`;
        insertHtml(`${mediaHtml({ t: 'video', provider: video.provider, id: video.id, url, caption: '' }, t.media)}<p><br></p>`);
    };

    const insertBook = () => {
        const book = found[pick];
        if (!book) return;
        rememberBook(book);
        close();
        insertHtml(`${mediaHtml({ t: 'book', slug: book.slug, title: book.title }, t.media, { [book.slug]: book })}<p><br></p>`);
    };

    const ok = { link: applyLink, img: insertImage, video: insertVideo, book: insertBook }[kind];

    const send = async (chosen: File) => {
        if (!ports.uploadImage) return;
        setBusy(true);
        setError('');
        const sent = await ports.uploadImage(chosen);
        setBusy(false);
        if (!sent.ok) { setError(sent.message); return; }
        setImage({ src: sent.src, name: chosen.name });
    };

    const write = (next: string) => { setAddress(next); setError(''); };
    const unlink = () => { close(); restore(); document.execCommand('unlink'); emit(); };
    const words = boxWords(kind, t);
    return (
        <div className="ak-rt-pop" role="dialog" aria-label={words.title} onKeyDown={(event) => { if (event.key === 'Enter' && (event.target as HTMLElement).tagName === 'INPUT') { event.preventDefault(); ok(); } }}>
            <h4>{words.title}</h4>
            {kind === 'link' && <LinkFields t={t} pages={ports.pages} first={first} address={address} invalid={!!error} write={write} />}
            {kind === 'img' && <ImageFields t={t} ports={ports} first={first} file={file} image={image} busy={busy} caption={caption} setCaption={setCaption} alt={alt}
                writeAlt={(next) => { setAlt(next); setError(''); }} altMissing={error === t.image.altMissing} wide={wide} setWide={setWide} send={send} />}
            {kind === 'video' && <VideoFields t={t} first={first} address={address} invalid={!!error} write={write} video={video} />}
            {kind === 'book' && <BookFields t={t} first={first} query={query} search={(next) => { setQuery(next); setPick(0); }} loading={books === null} found={found} pick={pick} setPick={setPick}
                insertAt={(index) => { setPick(index); ok(); }} />}
            {error && <p className="ak-rt-err" role="alert">{error}</p>}
            <div className="ak-rt-row">
                <button type="button" className="ak-btn sm" onClick={kind === 'link' ? unlink : close}>{words.back}</button>
                <button type="button" className="ak-btn sm pri" disabled={busy} onClick={ok}>{words.go}</button>
            </div>
        </div>
    );
}
