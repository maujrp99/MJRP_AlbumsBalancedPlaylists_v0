// cópia carimbada do kit do admin do MJRP Harness · admin-kit v0.9.0 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
"use client";

/**
 * The kit's rich text field (F128; `^cms-rich-*`, the approved component `rich-text-v2`): the same in the Jardim's CMS
 * and in the professional one. The author writes in `contenteditable` (campo-proprio: this is the rich field); every change is read back from the DOM into the
 * document and saved as the dialect's Markdown (ADR-0015), so whatever markup the browser makes, the value is the
 * dialect. The toolbar has a tooltip on every button (name, shortcut, what it does); the narrow column keeps the
 * whole toolbar wrapped in rows (never the essentials and «…»); «Maior» opens the same field over the screen.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { countOf, parseRich, safeHref, toMarkdown, videoOf } from '@mjrp/admin-kit-core';
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
const svg = (inner: string) => `<svg viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;
const ICONS: Partial<Record<RichCommand | RichInsert, string>> = {
    mark: svg('<path d="M4 20h7"/><path d="m14.5 4.5 5 5L11 18l-5 1 1-5z"/>'),
    link: svg('<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/>'),
    quote: svg('<path d="M7 7h4v4c0 3-2 5-4 5"/><path d="M14 7h4v4c0 3-2 5-4 5"/>'),
    ul: svg('<circle cx="5" cy="7" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="5" cy="17" r="1"/><path d="M9 7h11M9 12h11M9 17h11"/>'),
    ol: svg('<path d="M4 6h2v4M4 10h3M4 14h3l-3 4h3"/><path d="M10 7h10M10 12h10M10 17h10"/>'),
    hr: svg('<path d="M3 12h18"/><path d="M8 7h8M8 17h8" opacity=".35"/>'),
    box: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14"/>'),
    img: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m21 16-5-5-8 8"/>'),
    video: svg('<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3z"/>'),
    book: svg('<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h10"/>'),
    clear: svg('<path d="M6 6h12M12 6l-3 13"/><path d="m4 20 16-16" opacity=".8"/>'),
    undo: svg('<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>'),
    redo: svg('<path d="m15 14 5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>'),
    big: svg('<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
};
const TEXT_LABEL: Partial<Record<RichCommand, string>> = { bold: '<b>B</b>', italic: '<i>I</i>', underline: '<u>U</u>', strike: '<s>S</s>', sup: 'x²', sub: 'x₂' };
const INSERT_ICON: Record<RichInsert, string> = { p: 'T', lead: 'T+', h3: 'H', quote: ICONS.quote!, ul: ICONS.ul!, ol: ICONS.ol!, hr: ICONS.hr!, box: ICONS.box!, img: ICONS.img!, video: ICONS.video!, book: ICONS.book! };

/** Shortcuts beyond the browser's own ⌘B, ⌘I, ⌘U, ⌘Z. */
function shortcutOf(event: ReactKeyboardEvent): RichCommand | null {
    if (!(event.metaKey || event.ctrlKey) || event.altKey) return null;
    const key = event.key.toLowerCase();
    if (event.shiftKey) {
        if (key === 'x') return 'strike';
        if (key === 'h') return 'mark';
        if (key === '9' || key === '(') return 'quote';
        if (key === '8' || key === '*') return 'ul';
        if (key === '7' || key === '&') return 'ol';
        return null;
    }
    if (key === 'k') return 'link';
    if (key === '.') return 'sup';
    if (key === ',') return 'sub';
    if (key === '\\') return 'clear';
    return null;
}

const normal = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

type Menu = { kind: 'style' | 'slash'; left: number; top: number; active: number };
type Pop = 'link' | 'img' | 'video' | 'book';
type Tip = { id: RichCommand; left: number; top: number };

export function RichTextField({ id, label, value, onChange, ports = {}, texts = RICH_TEXTS_EN, invalid, required, placeholder }: RichTextFieldProps) {
    const own = useId();
    const labelId = `${own}-label`;
    const root = useRef<HTMLDivElement>(null);
    const body = useRef<HTMLDivElement>(null);
    const saved = useRef<Range | null>(null);
    const emitted = useRef(value);
    // The values this field sent: the screen hands them back a render or two later, while the author already typed on.
    // Only a value that is not one of them came from outside (the other language, a translation, a reload).
    const sent = useRef<string[]>([value]);
    const shelf = useRef<Record<string, EditorBook>>({});
    const words = texts.media;
    // The same object on every render: React 19 rewrites the inner HTML when the object changes, even with the same text,
    // and the field would lose what the author typed. After the first drawing the DOM is the field's own.
    const [initial] = useState(() => ({ __html: toEditorHtml(parseRich(value), words) }));
    const [count, setCount] = useState(() => countOf(parseRich(value)));
    const [pressed, setPressed] = useState<Partial<Record<RichCommand, boolean>>>({});
    const [styleNow, setStyleNow] = useState<'p' | 'lead' | 'h3'>('p');
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
        const node = window.getSelection()?.anchorNode;
        if (!node || !body.current?.contains(node)) return null;
        const element = node.nodeType === 1 ? (node as HTMLElement) : node.parentElement;
        return element?.closest<HTMLElement>('p, h1, h2, h3, h4, h5, h6, li, blockquote, div.callout') ?? null;
    }, []);

    const refresh = useCallback(() => {
        const node = window.getSelection()?.anchorNode;
        if (!node || !body.current?.contains(node)) return;
        const element = node.nodeType === 1 ? (node as HTMLElement) : node.parentElement;
        if (!element) return;
        const state = (command: string) => { try { return document.queryCommandState(command); } catch { return false; } };
        setPressed({
            bold: state('bold'), italic: state('italic'), underline: state('underline'), strike: state('strikeThrough'),
            sup: !!element.closest('sup'), sub: !!element.closest('sub'), mark: !!element.closest('mark'), link: !!element.closest('a'),
            quote: !!element.closest('blockquote'), ul: !!element.closest('ul'), ol: !!element.closest('ol'),
        });
        const block = element.closest('h1, h2, h3, h4, p, li, blockquote');
        setStyleNow(block && /^H[1-6]$/.test(block.tagName) ? (block.tagName === 'H4' ? 'lead' : 'h3') : block?.classList.contains('lead') ? 'lead' : 'p');
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

    const run = (command: RichCommand) => {
        setTip(null);
        switch (command) {
            case 'style': return openMenu('style');
            case 'plus': return openMenu('slash');
            case 'big': setMenu(null); setPop(null); return setBig((open) => !open);
            case 'link': case 'img': case 'video': case 'book': keep(); setMenu(null); return setPop(command);
            case 'mark': return toggleMark();
            case 'clear': return clearFormat();
            case 'quote': return setBlock('quote');
            case 'hr': return insertHtml('<hr><p><br></p>');
            case 'box': return insertHtml(`<div class="callout" data-rt="callout"><p>${texts.calloutPlaceholder}</p></div><p><br></p>`);
            default: {
                const native: Partial<Record<RichCommand, string>> = { bold: 'bold', italic: 'italic', underline: 'underline', strike: 'strikeThrough', sup: 'superscript', sub: 'subscript', undo: 'undo', redo: 'redo', ul: 'insertUnorderedList', ol: 'insertOrderedList' };
                const name = native[command];
                if (name) exec(name);
                emit();
                refresh();
            }
        }
    };

    const showTip = (target: HTMLElement, tool: RichCommand) => {
        const box = root.current?.querySelector('.ak-rt-box')?.getBoundingClientRect();
        const at = target.getBoundingClientRect();
        if (!box) return;
        setTip({ id: tool, left: Math.max(4, Math.min(at.left - box.left + at.width / 2 - 120, box.width - 244)), top: at.bottom - box.top + 6 });
    };

    const menuItems: RichInsert[] = menu?.kind === 'style' ? SLASH_GROUPS[0].items : SLASH_GROUPS.flatMap((group) => group.items);

    const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
        if (menu) {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                const step = event.key === 'ArrowDown' ? 1 : -1;
                setMenu({ ...menu, active: (menu.active + step + menuItems.length) % menuItems.length });
                return;
            }
            if (event.key === 'Enter') { event.preventDefault(); insert(menuItems[menu.active]); return; }
            if (event.key === 'Escape') { event.preventDefault(); setMenu(null); return; }
            setMenu(null);
        }
        const shortcut = shortcutOf(event);
        if (shortcut) { event.preventDefault(); run(shortcut); return; }
        const selection = window.getSelection();
        const block = blockAtCaret();
        const before = (() => {
            if (!selection?.rangeCount || !block) return '';
            const range = document.createRange();
            range.selectNodeContents(block);
            range.setEnd(selection.anchorNode!, selection.anchorOffset);
            return range.toString();
        })();
        // «/» at the start of a line opens the insert menu (`^cms-rich-slash`).
        if (event.key === '/' && !before.trim() && selection?.isCollapsed) {
            event.preventDefault();
            const rect = selection.getRangeAt(0).getBoundingClientRect();
            openMenu('slash', rect.width || rect.height ? rect : block?.getBoundingClientRect());
            return;
        }
        // «- » and «1. » at the start of a line open a list.
        if (event.key === ' ' && selection?.isCollapsed && block && !block.closest('li')) {
            const marker = before.replace(/ /g, ' ');
            if (marker === '-' || marker === '*' || /^1[.)]$/.test(marker)) {
                event.preventDefault();
                for (let k = 0; k < marker.length; k++) document.execCommand('delete');
                document.execCommand(marker === '-' || marker === '*' ? 'insertUnorderedList' : 'insertOrderedList');
                emit();
            }
        }
    };

    const visibleText = useMemo(() => texts.toolbar.replace('{label}', label), [texts.toolbar, label]);
    const toolButton = (tool: RichTool) => {
        const t = texts.tools[tool.id];
        const inner = tool.id === 'style' ? `${texts.styles[styleNow]} ▾` : TEXT_LABEL[tool.id] ?? ICONS[tool.id] ?? '';
        return [
            <button key={tool.id} type="button" data-cmd={tool.id}
                className={tool.id === 'style' ? 'ak-rt-style' : undefined}
                aria-label={`${t.name}${tool.keys ? ` (${tool.keys})` : ''}`}
                aria-pressed={PRESSABLE.includes(tool.id) ? !!pressed[tool.id] : undefined}
                aria-haspopup={tool.id === 'style' || tool.id === 'plus' ? 'menu' : ['link', 'img', 'video', 'book'].includes(tool.id) ? 'dialog' : undefined}
                onMouseEnter={(event) => showTip(event.currentTarget, tool.id)} onMouseLeave={() => setTip(null)}
                onFocus={(event) => showTip(event.currentTarget, tool.id)} onBlur={() => setTip(null)}
                onClick={() => run(tool.id)} dangerouslySetInnerHTML={{ __html: inner }} />,
            tool.end ? <span key={`${tool.id}-sep`} className="ak-rt-sep" aria-hidden="true" /> : null,
        ];
    };
    const tipTool = tip ? ({ ...texts.tools[tip.id], keys: RICH_TOOLS.find((tool) => tool.id === tip.id)?.keys ?? '' }) : null;

    return (
        <div ref={root} className={big ? 'ak-rt big' : 'ak-rt'} role={big ? 'dialog' : undefined} aria-modal={big || undefined} aria-labelledby={big ? labelId : undefined}>
            <div className="ak-rt-in">
                {big && (
                    <header className="ak-rt-head">
                        <span><small>{texts.expanded.kicker}</small><b id={labelId}>{label}</b></span>
                        <button type="button" className="ak-btn pri" onClick={() => setBig(false)}>{texts.expanded.close}</button>
                    </header>
                )}
                <div className={invalid ? 'ak-rt-box invalid' : 'ak-rt-box'}>
                    <div className="ak-rt-bar" role="toolbar" aria-label={visibleText}
                        onMouseDown={(event) => { if ((event.target as HTMLElement).closest('button')) event.preventDefault(); }}>
                        {RICH_TOOLS.filter((tool) => !TAIL.includes(tool.id)).map(toolButton)}
                        {/* O «+» e a tela cheia ficam juntos no fim da barra: quebram juntos, nunca um sozinho (F135, UAT-272). */}
                        <span className="ak-rt-tail">{RICH_TOOLS.filter((tool) => TAIL.includes(tool.id)).map(toolButton)}</span>
                    </div>
                    {/* campo-proprio: o corpo editável do próprio campo rico */}
                    <div ref={body} id={id} className="ak-rt-body" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true"
                        aria-label={big ? undefined : label} aria-labelledby={big ? labelId : undefined} aria-invalid={invalid || undefined} aria-required={required || undefined}
                        data-placeholder={placeholder} spellCheck
                        dangerouslySetInnerHTML={initial}
                        onFocus={() => { try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch { /* old browser */ } }}
                        onInput={() => { keep(); emit(); }}
                        onKeyDown={onKeyDown}
                        onKeyUp={keep} onMouseUp={keep}
                        onClick={(event) => {
                            const remove = (event.target as HTMLElement).closest('.ak-rt-x');
                            if (!remove) return;
                            event.preventDefault();
                            remove.closest('[data-rt]')?.remove();
                            emit();
                        }}
                        onDrop={(event) => event.preventDefault()}
                        onPaste={(event) => {
                            // From outside, only the paragraphs come in (`rich-text-v2`): the rest of the formatting is left behind.
                            event.preventDefault();
                            const text = event.clipboardData.getData('text/plain');
                            if (!text) return;
                            const escape = (part: string) => part.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]!));
                            const parts = text.replace(/\r\n?/g, '\n').split(/\n\s*\n/).map((part) => escape(part.trim()).replace(/\n/g, '<br>')).filter(Boolean);
                            document.execCommand('insertHTML', false, parts.length > 1 ? parts.map((part) => `<p>${part}</p>`).join('') : parts[0] ?? '');
                            setPasted(true);
                            emit();
                        }} />
                    <div className="ak-rt-foot"><span>{texts.count(count.words, count.minutes, count.media)}</span><span>{texts.footHint}</span></div>
                    {tip && tipTool && (
                        <div className="ak-rt-tip" role="tooltip" style={{ left: tip.left, top: tip.top }}>
                            <b>{tipTool.name}{tipTool.keys && <kbd>{tipTool.keys}</kbd>}</b>
                            {tipTool.does && <span>{tipTool.does}</span>}
                        </div>
                    )}
                    {menu && (
                        <div className="ak-rt-menu" role="menu" style={{ left: menu.left, top: menu.top }} onMouseDown={(event) => event.preventDefault()}>
                            {(menu.kind === 'style' ? [SLASH_GROUPS[0]] : SLASH_GROUPS).map((group) => [
                                <span key={group.group} className="ak-rt-grp">{texts.groups[group.group]}</span>,
                                ...group.items.map((item) => (
                                    <button key={item} type="button" role="menuitem" data-ins={item} className={menuItems[menu.active] === item ? 'on' : undefined} onClick={() => insert(item)}>
                                        <span className="ak-rt-ic" dangerouslySetInnerHTML={{ __html: INSERT_ICON[item] }} />{texts.inserts[item].name}<small>{texts.inserts[item].does}</small>
                                    </button>
                                )),
                            ])}
                        </div>
                    )}
                    {pop && <MediaBox kind={pop} texts={texts} ports={ports} restore={restore} emit={emit} insertHtml={insertHtml} close={() => setPop(null)}
                        rememberBook={(book) => { shelf.current[book.slug] = book; }} />}
                </div>
                {pasted && <p className="ak-rt-note" role="status">{texts.pasted}</p>}
                {big && <span className="ak-rt-shade" aria-hidden="true" onClick={() => setBig(false)} />}
            </div>
        </div>
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
    const esc = (text: string) => text.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]!));

    const ok = () => {
        if (kind === 'link') {
            const href = safeHref(address);
            if (!href) { setError(t.link.invalid); return; }
            close();
            restore();
            const selection = window.getSelection();
            if (selection?.isCollapsed) document.execCommand('insertHTML', false, `<a href="${esc(href)}">${esc(address)}</a>`);
            else document.execCommand('createLink', false, href);
            emit();
            return;
        }
        if (kind === 'img') {
            if (!image) { setError(t.image.fileMissing); return; }
            if (!alt.trim()) { setError(t.image.altMissing); return; }
            close();
            insertHtml(`${mediaHtml({ t: 'image', src: image.src, alt: alt.trim(), caption: caption.trim(), wide }, t.media)}<p><br></p>`);
            return;
        }
        if (kind === 'video') {
            if (!video) { setError(t.video.invalid); return; }
            close();
            const url = video.provider === 'youtube' ? `https://www.youtube.com/watch?v=${video.id}` : `https://vimeo.com/${video.id}`;
            insertHtml(`${mediaHtml({ t: 'video', provider: video.provider, id: video.id, url, caption: '' }, t.media)}<p><br></p>`);
            return;
        }
        const book = found[pick];
        if (!book) return;
        rememberBook(book);
        close();
        insertHtml(`${mediaHtml({ t: 'book', slug: book.slug, title: book.title }, t.media, { [book.slug]: book })}<p><br></p>`);
    };

    const send = async (chosen: File) => {
        if (!ports.uploadImage) return;
        setBusy(true);
        setError('');
        const sent = await ports.uploadImage(chosen);
        setBusy(false);
        if (!sent.ok) { setError(sent.message); return; }
        setImage({ src: sent.src, name: chosen.name });
    };

    const title = kind === 'link' ? t.link.title : kind === 'img' ? t.image.title : kind === 'video' ? t.video.title : t.book.title;
    return (
        <div className="ak-rt-pop" role="dialog" aria-label={title} onKeyDown={(event) => { if (event.key === 'Enter' && (event.target as HTMLElement).tagName === 'INPUT') { event.preventDefault(); ok(); } }}>
            <h4>{title}</h4>
            {kind === 'link' && (
                <>
                    <label>{t.link.address}<input ref={first} type="url" value={address} placeholder={t.link.placeholder} aria-invalid={!!error || undefined} onChange={(event) => { setAddress(event.target.value); setError(''); }} /></label>
                    {ports.pages?.length ? <div className="ak-rt-chips">{ports.pages.map((page) => <button key={page.href} type="button" onClick={() => { setAddress(page.href); setError(''); }}>{page.label}</button>)}</div> : null}
                    <p className="ak-rt-hint">{t.link.outside}</p>
                </>
            )}
            {kind === 'img' && (
                <>
                    <div className="ak-rt-drop">
                        {/* eslint-disable-next-line @next/next/no-img-element -- o kit não importa o Next (ADR-0011): a miniatura do envio é uma imagem simples */}
                        {image ? <img src={image.src} alt="" /> : <span className="ak-rt-cover" aria-hidden="true" />}
                        <span>
                            {image && <b>{image.name}<br /></b>}
                            <button type="button" className="ak-btn sm" disabled={busy || !ports.uploadImage} onClick={() => file.current?.click()}>{busy ? t.image.uploading : image ? t.image.replace : t.image.choose}</button>
                            <span className="ak-rt-hint">{ports.imageRule ?? t.image.rule}</span>
                        </span>
                        <input ref={file} type="file" hidden accept="image/png, image/jpeg, image/webp" onChange={(event) => { const chosen = event.target.files?.[0]; event.target.value = ''; if (chosen) void send(chosen); }} />
                    </div>
                    {/* campo-proprio: a legenda da imagem, dentro do campo rico */}
                    <label>{t.image.caption}<input ref={first} type="text" value={caption} onChange={(event) => setCaption(event.target.value)} /></label>
                    {/* campo-proprio: o texto alternativo da imagem, dentro do campo rico */}
                    <label>{t.image.alt}<input type="text" className="ak-rt-alt" value={alt} placeholder={t.image.altPlaceholder} aria-invalid={error === t.image.altMissing || undefined} aria-required="true" onChange={(event) => { setAlt(event.target.value); setError(''); }} /></label>
                    <span className="ak-rt-lbl">{t.image.width}</span>
                    <div className="ak-rt-seg">
                        <button type="button" aria-pressed={!wide} onClick={() => setWide(false)}>{t.image.column}</button>
                        <button type="button" aria-pressed={wide} onClick={() => setWide(true)}>{t.image.wide}</button>
                    </div>
                </>
            )}
            {kind === 'video' && (
                <>
                    <label>{t.video.address}<input ref={first} type="url" value={address} placeholder={t.video.placeholder} aria-invalid={!!error || undefined} onChange={(event) => { setAddress(event.target.value); setError(''); }} /></label>
                    {video && (
                        <div className="ak-rt-vprev">
                            <span style={video.provider === 'youtube' ? { backgroundImage: `url('https://i.ytimg.com/vi/${video.id}/hqdefault.jpg')` } : undefined} />
                            <span className="ak-rt-hint">{t.video.previewOf(video.provider === 'youtube' ? 'YouTube' : 'Vimeo')}</span>
                        </div>
                    )}
                    <p className="ak-rt-hint">{t.video.note}</p>
                </>
            )}
            {kind === 'book' && (
                <>
                    <label>{t.book.search}<input ref={first} type="search" value={query} placeholder={t.book.placeholder} onChange={(event) => { setQuery(event.target.value); setPick(0); }} /></label>
                    <div className="ak-rt-books" role="listbox" aria-label={t.book.search}>
                        {books === null ? <p className="ak-rt-hint">{t.book.loading}</p> : !found.length ? <p className="ak-rt-hint">{t.book.empty}</p> : found.map((book, index) => (
                            <button key={book.slug} type="button" role="option" aria-selected={index === pick} className={index === pick ? 'on' : undefined} onClick={() => setPick(index)} onDoubleClick={() => { setPick(index); ok(); }}>
                                {/* eslint-disable-next-line @next/next/no-img-element -- a capa, do mesmo endereço das capas da estante */}
                                {book.cover ? <img src={book.cover} alt="" /> : <span className="ak-rt-cover" aria-hidden="true" />}
                                <span><b>{book.title}</b>{[book.author, book.stage].filter(Boolean).join(' · ')}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}
            {error && <p className="ak-rt-err" role="alert">{error}</p>}
            <div className="ak-rt-row">
                {kind === 'link'
                    ? <button type="button" className="ak-btn sm" onClick={() => { close(); restore(); document.execCommand('unlink'); emit(); }}>{t.link.remove}</button>
                    : <button type="button" className="ak-btn sm" onClick={close}>{kind === 'img' ? t.image.cancel : kind === 'video' ? t.video.cancel : t.book.cancel}</button>}
                <button type="button" className="ak-btn sm pri" disabled={busy} onClick={ok}>{kind === 'link' ? t.link.apply : kind === 'img' ? t.image.insert : kind === 'video' ? t.video.insert : t.book.insert}</button>
            </div>
        </div>
    );
}
