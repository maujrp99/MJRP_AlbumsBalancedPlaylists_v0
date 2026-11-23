// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
// The rich field in use, compared with what the 1.0.0 did (F332 slice 1b, TASK-28): a click on every tool, the tooltip, the
// shortcuts, typing, «/» and the menus, «- » and «1. », paste, the boxes of link, image, video and book, «Open larger», Esc
// and the click outside, a value from outside and the covers of the shelf. No browser: the stage (`support/editor-stage.mjs`)
// draws the field and its parts, the test calls a handler as a click would, and the browser is a recorder. Each scene writes
// what the field asked of the browser, what it handed to `onChange` and what it shows after; the whole is compared with the
// portrait taken on the 1.0.0 (`support/editor-clicks.expected.json`). `node tests/rich-editor-clicks.kittest.mjs --write`
// takes the portrait again — only when a change of behaviour is the intent.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

import { SKIP, importComponent, installClientHarness } from './support/client-harness.mjs';
import { STAGE_STUBS, all, browser, hasClass, htmlOf, one, stage } from './support/editor-stage.mjs';

installClientHarness(STAGE_STUBS);
const EXPECTED = path.join(import.meta.dirname, 'support', 'editor-clicks.expected.json');
const { RichTextField } = SKIP ? {} : await importComponent('components/RichTextField.tsx');
const { RICH_TOOLS, SLASH_GROUPS } = SKIP ? {} : await importComponent('rich/tools.ts');

const TEXT = 'um [grande]{.large} e **forte**\n\n- item\n\n[Atomic Habits](/livro/atomic-habits "livro")';
const SHELF = [
    { slug: 'atomic-habits', title: 'Atomic Habits', author: 'James Clear', cover: '/covers/atomic.jpg', stage: 'Read' },
    { slug: 'deep-work', title: 'Deep Work', author: 'Cal Newport', cover: null },
    { slug: 'essencialismo', title: 'Essencialismo', author: 'Greg McKeown', stage: 'Reading' },
];
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

const digestOf = (text) => createHash('sha1').update(text).digest('hex').slice(0, 12);
/** The open menu, short: where it is, its entries, the one marked and the digest of its whole HTML (one whole menu of each kind is in its scene). */
function menuSeen(tree) {
    const menu = one(tree, hasClass('ak-rt-menu'));
    if (!menu) return '';
    const items = all(menu, (node) => node.props['data-ins']);
    return { style: menu.props.style, groups: all(menu, hasClass('ak-rt-grp')).map(htmlOf).join(''), items: items.map((node) => node.props['data-ins']).join(' '), on: items.filter(hasClass('on')).map((node) => node.props['data-ins']), digest: digestOf(htmlOf(menu)) };
}

/** One mounted field, its page and what it handed on. */
function scene({ value = TEXT, caret = {}, ports, props = {} } = {}) {
    const page = browser(caret);
    const changes = [];
    const field = stage(RichTextField, {
        label: 'A história', value, onChange: (markdown) => changes.push(markdown),
        ports: ports ?? { uploadImage: async (file) => (file.name === 'bad.jpg' ? { ok: false, message: 'Too large.' } : { ok: true, src: `/media/text/${file.name}` }), imageRule: 'The rule of the project.', books: async () => SHELF, pages: [{ label: 'Home', href: '/' }, { label: 'Books', href: '/livros' }] },
        ...props,
    }, { dom: page.dom });
    const self = {
        page, changes, field, tree: null,
        async draw() { self.tree = field.render(); await tick(); self.tree = field.render(); return self.tree; },
        get(predicate) { const hit = one(self.tree, predicate); assert.ok(hit, 'the element is on the page'); return hit; },
        tool: (id) => self.get((node) => node.props['data-cmd'] === id),
        body: () => self.get(hasClass('ak-rt-body')),
        /** What the scene left: what the field asked of the browser, what it saved, and the parts of the page that change. */
        seen() {
            const part = (name) => all(self.tree, hasClass(name)).map(htmlOf).join('');
            const root = self.get(hasClass('ak-rt'));
            return {
                log: page.log.splice(0), changes: changes.splice(0),
                root: htmlOf({ ...root, children: [] }),
                // The whole toolbar is in the first scene; after it, its digest and what changes in it: the pressed buttons and the style.
                bar: { digest: digestOf(part('ak-rt-bar')), pressed: all(self.tree, (node) => node.props['aria-pressed'] === true && node.props['data-cmd']).map((node) => node.props['data-cmd']), style: htmlOf(self.tool('style')).replace(/^<button[^>]*>|<\/button>$/g, '') },
                foot: part('ak-rt-foot'), head: part('ak-rt-head'), tip: part('ak-rt-tip'), menu: menuSeen(self.tree), pop: part('ak-rt-pop'), note: part('ak-rt-note'), shade: part('ak-rt-shade'),
            };
        },
    };
    return self;
}

const key = (name, more = {}) => {
    const event = { key: name, metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, prevented: 0, preventDefault() { event.prevented += 1; }, ...more };
    return event;
};
const click = (more = {}) => {
    const event = { prevented: 0, preventDefault() { event.prevented += 1; }, ...more };
    return event;
};
const typed = (value) => ({ target: { value } });

/** Every scene of the portrait, by name. Each returns what it saw, step by step. */
const SCENES = {
    async 'the field as it opens, and the page whole'() {
        const s = scene();
        return s.page.during(async () => { await s.draw(); return { html: htmlOf(s.tree), seen: s.seen() }; });
    },
    async 'a click on each tool'() {
        const out = {};
        for (const tool of RICH_TOOLS) {
            for (const [name, caret] of [['caret', {}], ['selection inside a quote and a mark', { collapsed: false, quote: true, mark: true }]]) {
                const s = scene({ caret });
                out[`${tool.id} · ${name}`] = await s.page.during(async () => { await s.draw(); s.page.log.splice(0); s.tool(tool.id).props.onClick(); await s.draw(); return s.seen(); });
            }
        }
        return out;
    },
    async 'a tool the browser does not know, and no selection at all'() {
        const s = scene({ caret: { throws: ['bold', 'removeFormat', 'defaultParagraphSeparator'], none: true } });
        return s.page.during(async () => {
            await s.draw();
            s.tool('bold').props.onClick(); s.tool('clear').props.onClick(); s.tool('mark').props.onClick();
            s.body().props.onFocus();
            await s.draw();
            return s.seen();
        });
    },
    async 'the tooltip comes and goes, with the mouse and with the focus'() {
        const s = scene();
        return s.page.during(async () => {
            await s.draw();
            const steps = [];
            const target = { getBoundingClientRect: () => ({ left: 200, top: 104, bottom: 124, width: 30, height: 20 }) };
            for (const [id, on, off] of [['bold', 'onMouseEnter', 'onMouseLeave'], ['link', 'onFocus', 'onBlur'], ['undo', 'onMouseEnter', 'onMouseLeave'], ['big', 'onFocus', 'onBlur']]) {
                s.tool(id).props[on]({ currentTarget: target }); await s.draw(); steps.push(s.seen().tip);
                s.tool(id).props[off](); await s.draw(); steps.push(s.seen().tip);
            }
            const bar = s.get(hasClass('ak-rt-bar'));
            const onButton = click({ target: { closest: () => ({}) } });
            const onBar = click({ target: { closest: () => null } });
            bar.props.onMouseDown(onButton); bar.props.onMouseDown(onBar);
            return { steps, keepsTheSelection: [onButton.prevented, onBar.prevented] };
        });
    },
    async 'the shortcuts'() {
        const out = {};
        const combos = ['x', 'h', '9', '(', '8', '*', '7', '&', 'z', 'k', '.', ',', '\\', 'q', 'K'];
        for (const name of combos) {
            for (const [label, more] of [['⌘', { metaKey: true }], ['⇧⌘', { metaKey: true, shiftKey: true }], ['ctrl', { ctrlKey: true }], ['⌥⌘', { metaKey: true, altKey: true }], ['alone', {}]]) {
                const s = scene({ caret: { before: 'some text' } });
                out[`${label} ${name}`] = await s.page.during(async () => {
                    await s.draw(); s.page.log.splice(0);
                    const event = key(name, more);
                    s.body().props.onKeyDown(event); await s.draw();
                    const seen = s.seen();
                    return { prevented: event.prevented, log: seen.log, changes: seen.changes, pop: seen.pop, menu: seen.menu };
                });
            }
        }
        return out;
    },
    async '«/» at the start of a line opens the insert menu; the arrows, Enter and Esc work it'() {
        const out = {};
        for (const [name, caret] of [['empty line', { before: '' }], ['spaces only', { before: '  ' }], ['after text', { before: 'abc' }], ['with a selection', { before: '', collapsed: false }], ['outside the field', { inField: false }], ['no rectangle', { before: '', noRect: true }], ['no box', { before: '', noBox: true }]]) {
            const s = scene({ caret });
            out[name] = await s.page.during(async () => { await s.draw(); s.page.log.splice(0); const event = key('/'); s.body().props.onKeyDown(event); await s.draw(); return { prevented: event.prevented, ...s.seen() }; });
        }
        const s = scene({ caret: { before: '' } });
        out.walk = await s.page.during(async () => {
            await s.draw(); s.page.log.splice(0);
            const steps = [];
            const press = async (name) => { const event = key(name); s.body().props.onKeyDown(event); await s.draw(); const seen = s.seen(); steps.push({ key: name, prevented: event.prevented, log: seen.log, changes: seen.changes, menu: seen.menu, pop: seen.pop }); };
            for (const name of ['/', 'ArrowDown', 'ArrowDown', 'ArrowUp', 'ArrowUp', 'ArrowUp', 'Enter', '/', 'Escape', '/', 'a', '/', 'ArrowDown', 'Enter']) await press(name);
            return steps;
        });
        return out;
    },
    async 'the style menu and every entry of the insert menu'() {
        const out = {};
        for (const [menu, items] of [['style', SLASH_GROUPS[0].items], ['plus', SLASH_GROUPS.flatMap((group) => group.items)]]) {
            for (const item of items) {
                for (const [name, caret] of [['', { tag: 'P' }], [' in a heading', { tag: 'H4', quote: true }]]) {
                    const s = scene({ caret });
                    out[`${menu} → ${item}${name}`] = await s.page.during(async () => {
                        await s.draw(); s.tool(menu).props.onClick(); await s.draw(); s.page.log.splice(0);
                        const opened = s.seen().menu;
                        s.get((node) => node.props['data-ins'] === item).props.onClick(); await s.draw();
                        return { opened, ...s.seen() };
                    });
                }
            }
        }
        const s = scene();
        out['the menus whole, and they keep the selection'] = await s.page.during(async () => {
            await s.draw(); s.tool('style').props.onClick(); await s.draw();
            const style = htmlOf(s.get(hasClass('ak-rt-menu')));
            s.tool('plus').props.onClick(); await s.draw();
            const event = click(); s.get(hasClass('ak-rt-menu')).props.onMouseDown(event);
            return { style, insert: htmlOf(s.get(hasClass('ak-rt-menu'))), prevented: event.prevented };
        });
        return out;
    },
    async '«- » and «1. » at the start of a line open a list'() {
        const out = {};
        for (const before of ['-', '*', '1.', '1)', '2.', 'x', '', '- ', '- ']) {
            for (const [name, caret] of [['', {}], [' · inside an item', { li: true }], [' · with a selection', { collapsed: false }]]) {
                const s = scene({ caret: { before, ...caret } });
                out[`«${before}»${name}`] = await s.page.during(async () => { await s.draw(); s.page.log.splice(0); const event = key(' '); s.body().props.onKeyDown(event); await s.draw(); const seen = s.seen(); return { prevented: event.prevented, log: seen.log, changes: seen.changes }; });
            }
        }
        return out;
    },
    async 'typing saves the dialect, and the size of the letter stays'() {
        const s = scene();
        return s.page.during(async () => {
            await s.draw(); s.page.log.splice(0);
            const steps = [];
            const body = s.body();
            // The author types at the end of the first paragraph: the browser changes the DOM, the field reads it back.
            s.page.body.childNodes[0].childNodes.push({ nodeType: 3, nodeValue: ' e mais', childNodes: [] });
            body.props.onInput(); await s.draw(); steps.push(s.seen());
            body.props.onInput(); await s.draw(); steps.push(s.seen());
            body.props.onKeyUp(); body.props.onMouseUp();
            const drop = click(); body.props.onDrop(drop);
            body.props.onFocus(); await s.draw(); steps.push({ dropPrevented: drop.prevented, ...s.seen() });
            return steps;
        });
    },
    async 'paste brings only the paragraphs'() {
        const out = {};
        for (const text of ['one line', 'a <b> & "c"\n\n second\nline \r\n\r\n\r\nthird', '', '\n\n']) {
            const s = scene({ value: 'antes' });
            out[JSON.stringify(text)] = await s.page.during(async () => {
                await s.draw(); s.page.log.splice(0);
                const event = click({ clipboardData: { getData: (kind) => (kind === 'text/plain' ? text : '<b>rich</b>') } });
                s.body().props.onPaste(event); await s.draw();
                return { prevented: event.prevented, ...s.seen() };
            });
        }
        return out;
    },
    async '«Remove» on a media takes it out of the text'() {
        const s = scene({ value: 'antes\n\n![Foto](/media/a.jpg "Legenda")\n\ndepois' });
        return s.page.during(async () => {
            await s.draw(); s.page.log.splice(0);
            const figure = s.page.body.childNodes[1];
            const button = figure.childNodes.find((node) => node.tagName === 'BUTTON');
            const onRemove = click({ target: button });
            const elsewhere = click({ target: s.page.body.childNodes[0] });
            s.body().props.onClick(elsewhere);
            const before = s.seen();
            s.body().props.onClick(onRemove); await s.draw();
            return { before, prevented: [elsewhere.prevented, onRemove.prevented], after: s.seen() };
        });
    },
    async 'the link box: a new link, a link over a selection, a bad address, a page of the site, removing'() {
        const out = {};
        const open = async (s) => { await s.draw(); s.tool('link').props.onClick(); await s.draw(); s.page.log.splice(0); };
        const input = (s) => s.get((node) => node.type === 'input' && node.props.type === 'url');
        const button = (s, at) => all(s.get(hasClass('ak-rt-row')), (node) => node.type === 'button')[at];
        for (const [name, caret, address] of [['new', {}, 'https://example.com/a?b=1&c="2"'], ['over a selection', { collapsed: false }, '/livros'], ['bad', {}, 'javascript:alert(1)'], ['empty', {}, ''], ['mail', {}, 'mailto:a@b.c']]) {
            const s = scene({ caret });
            out[name] = await s.page.during(async () => {
                await open(s);
                const opened = s.seen().pop;
                input(s).props.onChange(typed(address)); await s.draw();
                button(s, 1).props.onClick(); await s.draw();
                const applied = s.seen();
                return { opened, applied };
            });
        }
        const s = scene();
        out['a page, Enter, and remove'] = await s.page.during(async () => {
            await open(s);
            const steps = [];
            input(s).props.onChange(typed('nope')); await s.draw(); button(s, 1).props.onClick(); await s.draw(); steps.push(s.seen());
            all(s.get(hasClass('ak-rt-chips')), (node) => node.type === 'button')[1].props.onClick(); await s.draw(); steps.push(s.seen());
            const pop = s.get(hasClass('ak-rt-pop'));
            const onLabel = key('Enter', { target: { tagName: 'BUTTON' } }); pop.props.onKeyDown(onLabel);
            const other = key('a', { target: { tagName: 'INPUT' } }); pop.props.onKeyDown(other);
            const enter = key('Enter', { target: { tagName: 'INPUT' } }); pop.props.onKeyDown(enter); await s.draw();
            steps.push({ prevented: [onLabel.prevented, other.prevented, enter.prevented], ...s.seen() });
            s.tool('link').props.onClick(); await s.draw(); s.page.log.splice(0);
            button(s, 0).props.onClick(); await s.draw(); steps.push(s.seen());
            return steps;
        });
        const bare = scene({ ports: {} });
        out['no pages from the project'] = await bare.page.during(async () => { await open(bare); return bare.seen().pop; });
        return out;
    },
    async 'the image box: the file, the description that is asked, the width, inserting, cancelling'() {
        const s = scene();
        const out = {};
        out.walk = await s.page.during(async () => {
            await s.draw(); s.tool('img').props.onClick(); await s.draw(); s.page.log.splice(0);
            const steps = [];
            const row = (at) => all(s.get(hasClass('ak-rt-row')), (node) => node.type === 'button')[at];
            const field = (predicate) => s.get((node) => node.type === 'input' && predicate(node.props));
            const step = async (name, run) => { await run(); await s.draw(); steps.push({ step: name, ...s.seen() }); };
            await step('opened', async () => {});
            await step('insert with no file', async () => row(1).props.onClick());
            await step('choose opens the picker', async () => all(s.get(hasClass('ak-rt-drop')), (node) => node.type === 'button')[0].props.onClick());
            await step('no file chosen', async () => field((p) => p.type === 'file').props.onChange({ target: { files: [], value: 'x' } }));
            await step('a file the project refuses', async () => { field((p) => p.type === 'file').props.onChange({ target: { files: [{ name: 'bad.jpg' }], value: 'x' } }); await tick(); });
            await step('a file sent', async () => { const target = { files: [{ name: 'garden.jpg' }], value: 'x' }; field((p) => p.type === 'file').props.onChange({ target }); await tick(); assert.equal(target.value, ''); });
            await step('insert with no description', async () => row(1).props.onClick());
            await step('the caption', async () => field((p) => p.type === 'text' && !p.className).props.onChange(typed('  A caption  ')));
            await step('the description', async () => field((p) => p.className === 'ak-rt-alt').props.onChange(typed(' The garden <in> spring ')));
            await step('wide', async () => all(s.get(hasClass('ak-rt-seg')), (node) => node.type === 'button')[1].props.onClick());
            await step('column', async () => all(s.get(hasClass('ak-rt-seg')), (node) => node.type === 'button')[0].props.onClick());
            await step('wide again', async () => all(s.get(hasClass('ak-rt-seg')), (node) => node.type === 'button')[1].props.onClick());
            await step('insert', async () => row(1).props.onClick());
            return steps;
        });
        const c = scene({ ports: {} });
        out['cancel, with no upload from the project'] = await c.page.during(async () => {
            await c.draw(); c.tool('img').props.onClick(); await c.draw(); c.page.log.splice(0);
            const opened = c.seen().pop;
            c.get((node) => node.type === 'input' && node.props.type === 'file').props.onChange({ target: { files: [{ name: 'a.jpg' }], value: 'x' } }); await tick(); await c.draw();
            all(c.get(hasClass('ak-rt-row')), (node) => node.type === 'button')[0].props.onClick(); await c.draw();
            return { opened, after: c.seen() };
        });
        return out;
    },
    async 'the video box: a YouTube or Vimeo address shows its preview and goes in; another does not'() {
        const out = {};
        for (const address of ['https://youtu.be/dQw4w9WgXcQ', 'https://vimeo.com/76979871', 'https://example.com/video', '']) {
            const s = scene();
            out[address || 'empty'] = await s.page.during(async () => {
                await s.draw(); s.tool('video').props.onClick(); await s.draw(); s.page.log.splice(0);
                s.get((node) => node.type === 'input' && node.props.type === 'url').props.onChange(typed(address)); await s.draw();
                const typedIn = s.seen().pop;
                all(s.get(hasClass('ak-rt-row')), (node) => node.type === 'button')[1].props.onClick(); await s.draw();
                const inserted = s.seen();
                if (one(s.tree, hasClass('ak-rt-pop'))) { all(s.get(hasClass('ak-rt-row')), (node) => node.type === 'button')[0].props.onClick(); await s.draw(); }
                return { typedIn, inserted, cancelled: s.seen().pop };
            });
        }
        return out;
    },
    async 'the book box: the shelf, the search, the choice, the card with its cover'() {
        const out = {};
        const s = scene({ value: 'um texto' });
        out.walk = await s.page.during(async () => {
            const steps = [];
            s.tree = s.field.render(); s.tool('book').props.onClick(); s.tree = s.field.render(); steps.push({ step: 'before the shelf answers', pop: s.seen().pop });
            await s.draw(); s.page.log.splice(0); steps.push({ step: 'the shelf', pop: s.seen().pop });
            const search = () => s.get((node) => node.type === 'input' && node.props.type === 'search');
            const options = () => all(s.get(hasClass('ak-rt-books')), (node) => node.props.role === 'option');
            search().props.onChange(typed('zzz')); await s.draw(); steps.push({ step: 'nothing by that name', pop: s.seen().pop });
            all(s.get(hasClass('ak-rt-row')), (node) => node.type === 'button')[1].props.onClick(); await s.draw(); steps.push({ step: 'insert with nothing chosen', ...s.seen() });
            search().props.onChange(typed('NEWPORT deep')); await s.draw(); steps.push({ step: 'by author and title, any case', pop: s.seen().pop });
            search().props.onChange(typed('e')); await s.draw();
            options()[2].props.onClick(); await s.draw(); steps.push({ step: 'the third chosen', pop: s.seen().pop });
            all(s.get(hasClass('ak-rt-row')), (node) => node.type === 'button')[1].props.onClick(); await s.draw(); steps.push({ step: 'inserted', ...s.seen() });
            s.tool('book').props.onClick(); await s.draw(); s.page.log.splice(0);
            options()[0].props.onDoubleClick(); await s.draw(); steps.push({ step: 'a double click inserts the one clicked', ...s.seen() });
            s.tool('book').props.onClick(); await s.draw();
            all(s.get(hasClass('ak-rt-row')), (node) => node.type === 'button')[0].props.onClick(); await s.draw(); steps.push({ step: 'cancelled', ...s.seen() });
            return steps;
        });
        for (const [name, ports] of [['the shelf does not answer', { books: async () => { throw new Error('down'); } }], ['no shelf in the project', {}]]) {
            const b = scene({ value: 'um texto', ports });
            out[name] = await b.page.during(async () => { await b.draw(); b.tool('book').props.onClick(); await b.draw(); await b.draw(); return b.seen(); });
        }
        return out;
    },
    async 'from one box straight to another: what was typed stays, the error too'() {
        const s = scene();
        return s.page.during(async () => {
            await s.draw(); s.tool('link').props.onClick(); await s.draw(); s.page.log.splice(0);
            const steps = [];
            s.get((node) => node.type === 'input' && node.props.type === 'url').props.onChange(typed('https://youtu.be/dQw4w9WgXcQ')); await s.draw();
            for (const id of ['video', 'img', 'book', 'link', 'video']) { s.tool(id).props.onClick(); await s.draw(); steps.push({ to: id, ...s.seen() }); }
            all(s.get(hasClass('ak-rt-row')), (node) => node.type === 'button')[1].props.onClick(); await s.draw(); steps.push({ to: 'inserted', ...s.seen() });
            s.tool('img').props.onClick(); await s.draw();
            all(s.get(hasClass('ak-rt-row')), (node) => node.type === 'button')[1].props.onClick(); await s.draw();
            for (const id of ['link', 'book', 'video']) { s.tool(id).props.onClick(); await s.draw(); steps.push({ to: id, ...s.seen() }); }
            return steps;
        });
    },
    async '«Open larger», Esc and the click outside'() {
        const s = scene();
        return s.page.during(async () => {
            await s.draw(); s.page.log.splice(0);
            const steps = [];
            const step = async (name, run) => { await run(); await s.draw(); steps.push({ step: name, ...s.seen() }); };
            const escape = () => s.page.listeners.keydown({ key: 'Escape' });
            await step('larger', async () => s.tool('big').props.onClick());
            await step('the body is named by the title', async () => { steps.push({ body: htmlOf({ ...s.body(), children: [], props: { ...s.body().props, dangerouslySetInnerHTML: undefined } }) }); });
            await step('a menu over it', async () => s.tool('plus').props.onClick());
            await step('another key does nothing', async () => s.page.listeners.keydown({ key: 'a' }));
            await step('Esc closes the menu first', escape);
            await step('Esc closes the larger view', escape);
            await step('Esc with nothing open', escape);
            await step('larger again', async () => s.tool('big').props.onClick());
            await step('the button of the header closes it', async () => all(s.get(hasClass('ak-rt-head')), (node) => node.type === 'button')[0].props.onClick());
            await step('larger once more', async () => s.tool('big').props.onClick());
            await step('the shade closes it', async () => s.get(hasClass('ak-rt-shade')).props.onClick());
            await step('a box open', async () => s.tool('link').props.onClick());
            await step('a click inside keeps it', async () => s.page.listeners.mousedown({ target: {} }));
            await step('a click outside closes it', async () => s.page.listeners.mousedown({ target: s.page.outside }));
            await step('larger closes a box that was open', async () => { s.tool('video').props.onClick(); await s.draw(); s.tool('big').props.onClick(); });
            return steps;
        });
    },
    async 'the buttons show what the selection has, and the style of its paragraph'() {
        const out = {};
        const carets = {
            'plain paragraph': {}, 'bold and italic in a list': { states: { bold: true, italic: true }, inside: ['ul'], tag: 'LI' },
            'underline, strike, sup, sub, mark and link in a quote': { states: { underline: true, strikeThrough: true }, inside: ['sup', 'sub', 'mark', 'a', 'blockquote'], tag: 'BLOCKQUOTE' },
            'numbered list': { inside: ['ol'], tag: 'LI' }, 'large text (h4)': { tag: 'H4' }, 'large text (p.lead)': { lead: true }, subheading: { tag: 'H3' }, 'a heading of another level': { tag: 'H1' },
            'no block around': { tag: '' }, 'outside the field': { inField: false }, 'a browser with no command state': { throws: ['bold', 'italic', 'underline', 'strikeThrough'] }, 'no selection': { none: true },
        };
        for (const [name, caret] of Object.entries(carets)) {
            const s = scene({ caret });
            out[name] = await s.page.during(async () => { await s.draw(); s.page.log.splice(0); s.page.listeners.selectionchange(); await s.draw(); const seen = s.seen(); return { bar: seen.bar, log: seen.log }; });
        }
        return out;
    },
    async 'a value from outside is drawn again; the one the field sent is not; the shelf brings the covers'() {
        const s = scene();
        return s.page.during(async () => {
            const steps = [];
            s.tree = s.field.render(); steps.push({ step: 'first drawing', ...s.seen() });
            await s.draw(); steps.push({ step: 'the shelf answered: the card of the text gets its cover', ...s.seen() });
            s.page.body.childNodes[0].childNodes.push({ nodeType: 3, nodeValue: '!', childNodes: [] });
            s.body().props.onInput(); await s.draw();
            const sent = s.changes[0];
            steps.push({ step: 'typed', ...s.seen() });
            s.field.setProps({ value: sent }); await s.draw(); steps.push({ step: 'the screen hands back what the field sent', ...s.seen() });
            s.field.setProps({ value: TEXT }); await s.draw(); steps.push({ step: 'an older value of its own comes back late', ...s.seen() });
            s.field.setProps({ value: 'outro **texto**\n\n[Deep Work](/livro/deep-work "livro")' }); await s.draw(); steps.push({ step: 'another language', ...s.seen() });
            s.field.setProps({ invalid: true, required: true, placeholder: 'Write here', id: 'story' }); await s.draw();
            steps.push({ step: 'invalid, required, with a placeholder', box: all(s.tree, hasClass('ak-rt-box')).map((node) => htmlOf({ ...node, children: [] })).join(''), body: htmlOf({ ...s.body(), children: [], props: { ...s.body().props, dangerouslySetInnerHTML: undefined } }) });
            return steps;
        });
    },
};

/** The scenes one after the other: each has the page (`document`, `window`) to itself while it runs. */
async function portrait() {
    const out = {};
    for (const [name, run] of Object.entries(SCENES)) out[name] = JSON.parse(JSON.stringify(await run()));
    return out;
}

if (!SKIP) {
    const now = await portrait();
    if (process.argv.includes('--write')) writeFileSync(EXPECTED, `${JSON.stringify(now, null, 1)}\n`);
    const expected = JSON.parse(readFileSync(EXPECTED, 'utf8'));
    for (const name of Object.keys(SCENES)) {
        test(`o campo rico em uso, igual à 1.0.0: ${name}`, () => assert.deepEqual(now[name], expected[name]));
    }
    test('o retrato tem todas as cenas, e nenhuma a mais', () => assert.deepEqual(Object.keys(expected).filter((name) => name !== '_vendored'), Object.keys(SCENES)));

    test('o que as cenas provam, dito: cada ferramenta, o «/», o link, a colagem e o tamanho da letra', () => {
        const tools = now['a click on each tool'];
        assert.deepEqual(tools['bold · caret'].log.filter(([what]) => what === 'exec'), [['exec', 'bold']]);
        assert.deepEqual(tools['hr · caret'].log.filter(([what]) => what === 'exec'), [['exec', 'insertHTML', '<hr><p><br></p>']]);
        assert.match(tools['link · caret'].pop, /role="dialog" aria-label="Link"/);
        assert.match(tools['big · caret'].root, /class="ak-rt big" role="dialog" aria-modal="true"/);
        assert.equal(now['«/» at the start of a line opens the insert menu; the arrows, Enter and Esc work it']['empty line'].menu.items, 'p lead h3 quote ul ol hr box img video book');
        assert.match(now['the style menu and every entry of the insert menu']['the menus whole, and they keep the selection'].insert, /role="menu".*data-ins="book"/);
        assert.equal(now['«/» at the start of a line opens the insert menu; the arrows, Enter and Esc work it']['after text'].menu, '');
        const link = now['the link box: a new link, a link over a selection, a bad address, a page of the site, removing'];
        assert.deepEqual(link.new.applied.log.filter(([what]) => what === 'exec'), [['exec', 'insertHTML', '<a href="https://example.com/a?b=1&amp;c=&quot;2&quot;">https://example.com/a?b=1&amp;c=&quot;2&quot;</a>']]);
        assert.deepEqual(link['over a selection'].applied.log.filter(([what]) => what === 'exec'), [['exec', 'createLink', '/livros']]);
        assert.deepEqual(link.bad.applied.log.filter(([what]) => what === 'exec'), []);
        assert.match(link.bad.applied.pop, /role="alert"/);
        const paste = now['paste brings only the paragraphs'];
        assert.deepEqual(paste['"a <b> & \\"c\\"\\n\\n second\\nline \\r\\n\\r\\n\\r\\nthird"'].log.filter(([what]) => what === 'exec'), [['exec', 'insertHTML', '<p>a &lt;b&gt; &amp; &quot;c&quot;</p><p>second<br>line</p><p>third</p>']]);
        // Editing a text on the 1.0.x never drops a size of the letter (TASK-28's note): what is typed is saved beside it.
        const typing = now['typing saves the dialect, and the size of the letter stays'];
        assert.deepEqual(typing[0].changes, ['um [grande]{.large} e **forte** e mais\n\n- item\n\n[Atomic Habits](/livro/atomic-habits "livro")']);
        assert.deepEqual(typing[1].changes, [], 'o mesmo texto não é entregue duas vezes');
    });
}
