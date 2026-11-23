// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
// A stage for the rich field's clicks and keys, with no browser and no package (F332 slice 1b, TASK-28). The client harness
// calls a component once, as a function; the rich field needs more — refs that last, effects that run again when what they
// read changes, the components inside it (the toolbar, the menus, the boxes) drawn too. So this is a renderer of a few
// lines: every function component is called with its own kept hooks, down to the host elements; the test calls a handler,
// as a click would, and draws again. The browser is a recorder: `document.execCommand`, the selection and the field's DOM
// (the mini DOM of `mini-dom.mjs`) write down what the field asked of them.
import { stub } from './client-harness.mjs';
import { parseHtml } from './mini-dom.mjs';

export const STAGE_STUBS = {
    react: stub(`
        const hooks = () => globalThis.__hooks;
        export const useState = (initial) => hooks().useState(initial);
        export const useEffect = (effect, deps) => hooks().useEffect(effect, deps);
        export const useLayoutEffect = useEffect; // the first drawing of the body: on this stage it runs with the other effects, after the render
        export const useRef = (current) => hooks().useRef(current);
        export const useId = () => hooks().useId();
        export const useCallback = (callback) => callback;
        export const useMemo = (compute) => compute();
        export const Fragment = 'fragment';
        export default { createElement: (type, props) => ({ type, props }) };`),
    'react/jsx-runtime': stub(`
        const element = (type, props, key) => ({ type, props, key });
        export const jsx = element;
        export const jsxs = element;
        export const Fragment = 'fragment';`),
};

const ATTRIBUTE = { className: 'class', htmlFor: 'for', tabIndex: 'tabindex', contentEditable: 'contenteditable', spellCheck: 'spellcheck' };
const escapeText = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttribute = (text) => escapeText(text).replace(/"/g, '&quot;');
const styleText = (style) => Object.entries(style).map(([name, value]) => `${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}:${value}`).join(';');

/** A host tree as HTML: what the browser would hold, whether the markup came as elements or as a string. */
export function htmlOf(node) {
    if (Array.isArray(node)) return node.map(htmlOf).join('');
    if (node.text !== undefined) return escapeText(node.text);
    const attributes = Object.entries(node.props).flatMap(([name, value]) => {
        if (['children', 'ref', 'key', 'dangerouslySetInnerHTML', 'suppressContentEditableWarning'].includes(name) || typeof value === 'function') return [];
        if (value === undefined || value === null || (value === false && !name.startsWith('aria-') && name !== 'contentEditable' && name !== 'spellCheck')) return [];
        if (name === 'style') return [` style="${escapeAttribute(styleText(value))}"`];
        return [` ${ATTRIBUTE[name] ?? name}="${value === true && !name.startsWith('aria-') && name !== 'contentEditable' && name !== 'spellCheck' ? '' : escapeAttribute(value)}"`];
    }).join('');
    const raw = node.props.dangerouslySetInnerHTML?.__html;
    // An empty element written `<path …/>` in a string is the element `<path …></path>`.
    const inner = raw !== undefined ? String(raw).replace(/<(path|circle|rect)([^>]*?)\/>/g, '<$1$2></$1>') : htmlOf(node.children);
    return `<${node.type}${attributes}>${inner}</${node.type}>`;
}

/** Every host element of a tree that the predicate takes, in the order of the page. */
export function all(node, predicate, hits = []) {
    if (Array.isArray(node)) { node.forEach((child) => all(child, predicate, hits)); return hits; }
    if (node.text !== undefined) return hits;
    if (predicate(node)) hits.push(node);
    return all(node.children, predicate, hits);
}
export const one = (node, predicate) => all(node, predicate)[0] ?? null;
export const hasClass = (name) => (node) => String(node.props.className ?? '').split(/\s+/).includes(name);

/**
 * Mounts a component. `dom(host)` gives the node a `ref` of that host element gets (the recorder's field, an input).
 * `render()` draws again and gives the host tree; the effects run after each drawing, as in the browser.
 */
export function stage(Component, props, { dom = () => null } = {}) {
    const stores = new Map();
    let live = new Set();
    let pending = [];

    const call = (type, typeProps, path) => {
        if (!stores.has(path)) stores.set(path, { slots: [] });
        const store = stores.get(path);
        live.add(path);
        let cursor = 0;
        const slot = (make) => {
            const index = cursor++;
            if (!(index in store.slots)) store.slots[index] = make();
            return store.slots[index];
        };
        globalThis.__hooks = {
            useState(initial) {
                const state = slot(() => ({ value: typeof initial === 'function' ? initial() : initial }));
                return [state.value, (next) => { state.value = typeof next === 'function' ? next(state.value) : next; }];
            },
            useRef: (current) => slot(() => ({ current })),
            useId: () => `:${path.length}:`,
            useEffect(effect, deps) {
                const state = slot(() => ({ ran: false, deps: undefined, cleanup: undefined }));
                const changed = !state.ran || !deps || deps.some((dep, index) => dep !== state.deps[index]);
                state.ran = true;
                state.deps = deps;
                if (changed) pending.push(() => { state.cleanup?.(); state.cleanup = effect(); });
                store.cleanups = store.slots.filter((entry) => entry && 'cleanup' in entry);
            },
        };
        return type(typeProps);
    };

    const expand = (node, path) => {
        if (node === null || node === undefined || typeof node === 'boolean') return [];
        if (typeof node === 'string' || typeof node === 'number') return [{ text: String(node) }];
        if (Array.isArray(node)) return node.flatMap((child, index) => expand(child, `${path}/${child?.key ?? index}`));
        if (node.type === 'fragment') return expand(node.props.children, path);
        if (typeof node.type === 'function') {
            const here = `${path}/${node.type.name}:${node.key ?? ''}`;
            return expand(call(node.type, node.props, here), here);
        }
        const host = { type: node.type, props: node.props, children: expand(node.props.children, `${path}/${node.type}`) };
        if (node.props.ref && node.props.ref.current === null) node.props.ref.current = dom(host);
        return [host];
    };

    return {
        setProps(next) { props = { ...props, ...next }; },
        render() {
            const before = live;
            live = new Set();
            pending = [];
            const tree = expand({ type: Component, props }, '');
            // A component that left the page: its effects clean up and its state is gone, as when React unmounts it.
            for (const path of before) {
                if (live.has(path)) continue;
                (stores.get(path).cleanups ?? []).forEach((entry) => entry.cleanup?.());
                stores.delete(path);
            }
            const effects = pending;
            pending = [];
            effects.forEach((run) => run());
            return tree;
        },
    };
}

// ---------------------------------------------------------------- the browser, as a recorder

const matches = (element, selector) => selector.split(',').map((part) => part.trim()).some((part) => {
    const data = /^\[data-rt(?:="([a-z]+)")?\]$/.exec(part);
    if (data) return element.hasAttribute('data-rt') && (data[1] === undefined || element.getAttribute('data-rt') === data[1]);
    if (part.startsWith('.')) return element.classList.contains(part.slice(1));
    return element.tagName === part.toUpperCase();
});

/** Gives the mini DOM's elements the few members the field calls on its own content, each call written to the log. */
function alive(element, parent, log) {
    element.parentElement = parent;
    element.closest = (selector) => {
        for (let at = element; at; at = at.parentElement) if (at.tagName && matches(at, selector)) return at;
        return null;
    };
    element.remove = () => { log.push(['remove', element.tagName, element.getAttribute?.('data-rt') ?? '']); parent.childNodes.splice(parent.childNodes.indexOf(element), 1); };
    element.replaceWith = (...nodes) => { log.push(['replaceWith', element.tagName, nodes.length]); parent.childNodes.splice(parent.childNodes.indexOf(element), 1, ...nodes); };
    Object.defineProperty(element, 'outerHTML', { configurable: true, set(html) { log.push(['outerHTML', html]); } });
    element.childNodes.forEach((child) => alive(child, element, log));
    return element;
}

/**
 * The page the field runs in: `document`, `window` and the field's own nodes, all recording. `caret` says where the cursor
 * is (the block, the marks around it, the text before it in the line, whether there is a selection).
 */
export function browser(caret = {}) {
    const log = [];
    const listeners = {};
    const page = { log, listeners, caret: { tag: 'P', lead: false, li: false, quote: false, inside: [], before: '', collapsed: true, inField: true, mark: false, states: {}, ...caret }, body: null };
    const rect = (left, top) => ({ left, top, bottom: top + 20, width: 30, height: 20 });

    const block = () => ({
        tagName: page.caret.tag,
        classList: { contains: (name) => name === 'lead' && page.caret.lead, toggle: (name, on) => log.push(['classList.toggle', name, on]) },
        closest: (selector) => ((selector === 'li' && page.caret.li) || (selector === 'blockquote' && page.caret.quote) ? { tagName: selector.toUpperCase() } : null),
        getBoundingClientRect: () => rect(40, 200),
    });
    const caretElement = () => ({
        nodeType: 1,
        closest(selector) {
            if (selector.includes(',')) return page.caret.tag ? block() : null;
            return page.caret.inside.includes(selector) ? { tagName: selector.toUpperCase() } : null;
        },
    });
    const markElement = { tagName: 'MARK', childNodes: ['inside the mark'], replaceWith: (...nodes) => log.push(['mark.replaceWith', nodes.length]) };
    const range = () => ({
        cloneRange: () => 'the saved range',
        getBoundingClientRect: () => (page.caret.noRect ? { left: 0, top: 0, bottom: 0, width: 0, height: 0 } : rect(60, 300)),
        commonAncestorContainer: { nodeType: 3, parentElement: { closest: (selector) => (selector === 'mark' && page.caret.mark ? markElement : null) } },
        extractContents: () => 'the selected content',
        insertNode: (node) => log.push(['range.insertNode', node.tagName]),
        intersectsNode: () => true,
        selectNodeContents: (node) => log.push(['range.selectNodeContents', node.tagName ?? 'block']),
        setEnd: () => {},
        toString: () => page.caret.before,
    });
    const selection = () => (page.caret.none ? null : {
        rangeCount: page.caret.noRange ? 0 : 1,
        isCollapsed: page.caret.collapsed,
        anchorNode: page.caret.inField ? { nodeType: 3, parentElement: caretElement(), inField: true } : { nodeType: 3, parentElement: null },
        anchorOffset: 0,
        getRangeAt: range,
        removeAllRanges: () => log.push(['selection.removeAllRanges']),
        addRange: (added) => log.push(['selection.addRange', typeof added === 'string' ? added : 'a new range']),
    });

    page.document = {
        execCommand(command, ui, argument) {
            if (page.caret.throws?.includes(command)) throw new Error('no such command');
            log.push(argument === undefined ? ['exec', command] : ['exec', command, argument]);
            if (command === 'insertHTML' && page.body) parseHtml(argument).childNodes.forEach((node) => page.body.childNodes.push(alive(node, page.body, log)));
            return true;
        },
        queryCommandState(command) {
            if (page.caret.throws?.includes(command)) throw new Error('no such command');
            return !!page.caret.states[command];
        },
        createRange: range,
        createElement: (tag) => ({ tagName: tag.toUpperCase(), append: (content) => log.push(['append', tag, content]) }),
        addEventListener: (type, listener) => { listeners[type] = listener; },
        removeEventListener: (type, listener) => { if (listeners[type] === listener) delete listeners[type]; },
    };
    page.window = { getSelection: selection };

    /** The node behind a `ref`: the field's root, its editable body (the mini DOM of what it drew) or an input. */
    page.dom = (host) => {
        const classes = String(host.props.className ?? '').split(/\s+/);
        if (classes.includes('ak-rt')) {
            return {
                contains: (node) => node !== page.outside,
                querySelector: (selector) => (page.caret.noBox ? null : { getBoundingClientRect: () => (selector === '.ak-rt-box' ? { ...rect(10, 100), width: 800 } : rect(selector.includes('style') ? 14 : 700, 104)) }),
            };
        }
        if (classes.includes('ak-rt-body')) {
            const body = alive(parseHtml(host.props.dangerouslySetInnerHTML?.__html ?? htmlOf(host.children)), null, log);
            body.contains = (node) => !!node?.inField || node === body;
            body.focus = () => log.push(['body.focus']);
            body.querySelectorAll = (selector) => {
                const hits = [];
                const walk = (node) => node.childNodes.forEach((child) => { if (child.tagName && matches(child, selector)) hits.push(child); walk(child); });
                walk(body);
                return hits;
            };
            Object.defineProperty(body, 'innerHTML', { set(html) { log.push(['body.innerHTML', html]); body.childNodes = parseHtml(html).childNodes.map((node) => alive(node, body, log)); } });
            page.body = body;
            return body;
        }
        return { focus: () => log.push(['focus', host.type, host.props.type ?? '']), click: () => log.push(['click', host.type, host.props.type ?? '']) };
    };
    page.outside = { outside: true };

    /** Puts the page in place of the globals while `run` goes; they come back after it. */
    page.during = async (run) => {
        const kept = { document: globalThis.document, window: globalThis.window };
        globalThis.document = page.document;
        globalThis.window = page.window;
        try { return await run(); } finally {
            for (const [name, value] of Object.entries(kept)) { if (value === undefined) delete globalThis[name]; else globalThis[name] = value; }
        }
    };
    return page;
}
