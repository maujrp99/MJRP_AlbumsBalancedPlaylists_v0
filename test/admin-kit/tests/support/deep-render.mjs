// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
// Draws a screen of the kit down to its elements, with state, in Node's test runner, with no DOM and no new dependency (F332,
// TASK-27): the net under the split of the screens. The `client-harness` calls ONE component as a function and stops at the
// components it uses; a test written over it would break when a screen is cut into smaller components. Here every component
// of the tree is called, each with its own hooks kept between draws (state, refs, memo, effects with their cleanup, context),
// and what comes back is only elements (`div`, `button`, …): the same tree whatever the components behind it. A test finds
// an element, calls its handler as a click would, asks for the next draw and reads it; `html()` writes the draw as text, the
// portrait a split may not change.
//
// Not React: no batching, no keys reordering, no refs to elements (a `ref` stays empty, as on the server). `@dnd-kit` is a
// stand-in that keeps the tree and exposes `onDragEnd` on a `dnd-context` element.
import { installClientHarness, stub } from './client-harness.mjs';

const REACT = stub(`
    const mini = () => globalThis.__mini;
    export const useState = (initial) => mini().useState(initial);
    export const useEffect = (effect, deps) => mini().useEffect(effect, deps);
    export const useLayoutEffect = useEffect;
    export const useRef = (current) => mini().useMemo(() => ({ current }), []);
    export const useMemo = (compute, deps) => mini().useMemo(compute, deps);
    export const useCallback = (callback, deps) => mini().useMemo(() => callback, deps);
    export const useId = () => mini().useId();
    export const useContext = (context) => mini().useContext(context);
    export const useSyncExternalStore = (subscribe, snapshot) => snapshot();
    export const createContext = (initial) => { const context = { initial }; context.Provider = { context }; return context; };
    export const Fragment = 'fragment';
    export default { createElement: (type, props, ...children) => ({ type, props: { ...props, ...(children.length ? { children } : {}) } }) };`);
const JSX = stub(`
    const element = (type, props, key) => ({ type, props, key });
    export const jsx = element;
    export const jsxs = element;
    export const Fragment = 'fragment';`);
const DND_CORE = stub(`
    export const DndContext = ({ children, onDragEnd }) => ({ type: 'dnd-context', props: { onDragEnd, children } });
    export const KeyboardSensor = 'keyboard', MouseSensor = 'mouse', TouchSensor = 'touch', PointerSensor = 'pointer';
    export const closestCenter = () => null;
    export const useDroppable = () => ({ setNodeRef() {}, isOver: false });
    export const useSensor = (sensor, options) => ({ sensor, options });
    export const useSensors = (...sensors) => sensors;`);
const DND_SORTABLE = stub(`
    export const SortableContext = ({ children }) => children;
    export const sortableKeyboardCoordinates = () => undefined;
    export const verticalListSortingStrategy = 'vertical';
    export const arrayMove = (list, from, to) => { const next = [...list]; next.splice(to, 0, ...next.splice(from, 1)); return next; };
    export const useSortable = () => ({ attributes: { 'data-sortable': '' }, listeners: {}, setNodeRef() {}, transform: null, transition: undefined, isDragging: false });`);
const DND_UTILITIES = stub(`export const CSS = { Transform: { toString: () => undefined } };`);
// The rich editor works on a real `contenteditable` (its own tests cover it): on a screen drawn here it is one element that
// shows what it was handed, and `onChange` is the author writing in it.
const RICH = stub(`export const RichTextField = ({ ports, texts, ...props }) => ({ type: 'rich-text-field', props: { ...props, ports: ports ? Object.keys(ports).join(' ') : undefined } });`);

/** Turns the harness on with the stand-ins of React and `@dnd-kit`; `stubs` adds or replaces modules, as in `client-harness`. */
export function installDeepRender(stubs = {}) {
    installClientHarness({ react: REACT, 'react/jsx-runtime': JSX, '@dnd-kit/core': DND_CORE, '@dnd-kit/sortable': DND_SORTABLE, '@dnd-kit/utilities': DND_UTILITIES, './RichTextField': RICH, ...stubs });
}

const changed = (before, after) => !before || !after || before.length !== after.length || before.some((value, index) => !Object.is(value, after[index]));

/** The screen: `draw()` gives the tree of elements of now; `settle()` waits the promises and the effects, then draws. */
export function createRoot(element) {
    const instances = new Map();
    const provided = [];
    let current = null;
    let pending = [];
    let ids = 0;

    const slot = (make) => {
        const index = current.cursor++;
        if (!(index in current.slots)) current.slots[index] = make();
        return current.slots[index];
    };
    const mini = {
        useState(initial) {
            const cell = slot(() => {
                const state = { value: typeof initial === 'function' ? initial() : initial };
                const owner = current;
                // A state set while its own component draws makes it draw again at once, as React does (a prop followed in the draw).
                state.set = (next) => { state.value = typeof next === 'function' ? next(state.value) : next; if (current === owner) owner.again = true; };
                return state;
            });
            return [cell.value, cell.set];
        },
        useMemo(compute, deps) {
            const cell = slot(() => ({}));
            if (changed(cell.deps, deps)) Object.assign(cell, { deps, value: compute() });
            return cell.value;
        },
        useEffect(effect, deps) {
            const cell = slot(() => ({}));
            if (!changed(cell.deps, deps)) return;
            cell.deps = deps;
            pending.push(() => { cell.cleanup?.(); cell.cleanup = effect() ?? undefined; });
        },
        useId: () => slot(() => `:id-${ids++}:`),
        useContext(context) {
            const hit = provided.findLast((entry) => entry.context === context);
            return hit ? hit.value : context.initial;
        },
    };

    const expand = (node, path, seen) => {
        if (node === null || node === undefined || typeof node === 'boolean') return [];
        if (typeof node === 'string' || typeof node === 'number') return [String(node)];
        if (Array.isArray(node)) return node.flatMap((child, index) => expand(child, `${path}/${child?.key ?? index}`, seen));
        const { type, props = {} } = node;
        if (type === 'fragment') return expand(props.children, path, seen);
        if (type?.context) {
            provided.push({ context: type.context, value: props.value });
            try { return expand(props.children, path, seen); } finally { provided.pop(); }
        }
        if (typeof type === 'function') {
            const key = `${path}/<${type.name}>`;
            if (!instances.has(key)) instances.set(key, { slots: [] });
            const instance = instances.get(key);
            seen.add(key);
            const outer = current;
            current = instance;
            let drawn;
            try {
                for (let turn = 0; turn < 10; turn += 1) {
                    instance.cursor = 0;
                    instance.again = false;
                    drawn = type(props);
                    if (!instance.again) break;
                }
            } finally { current = outer; }
            return expand(drawn, key, seen);
        }
        return [{ type, props: { ...props, children: expand(props.children, `${path}/${type}`, seen) } }];
    };

    const draw = () => {
        globalThis.__mini = mini;
        const seen = new Set();
        const tree = expand(element, '', seen);
        // A component that left the screen runs its cleanups and loses its state, as an unmount does.
        for (const [key, instance] of instances) {
            if (seen.has(key)) continue;
            for (const cell of instance.slots) if (typeof cell?.cleanup === 'function') cell.cleanup();
            instances.delete(key);
        }
        const effects = pending;
        pending = [];
        for (const effect of effects) effect();
        return { type: 'root', props: { children: tree } };
    };

    return {
        draw,
        /** Leaves the screen: every effect cleans up (a timer, a listener). */
        unmount() {
            for (const instance of instances.values()) for (const cell of instance.slots) if (typeof cell?.cleanup === 'function') cell.cleanup();
            instances.clear();
        },
        async settle() {
            for (let round = 0; round < 4; round += 1) {
                draw();
                await new Promise((resolve) => setImmediate(resolve));
            }
            return draw();
        },
    };
}

const childrenOf = (node) => (node && typeof node === 'object' ? [node.props?.children].flat(Infinity) : []);

/** Every element of the tree that answers the question, in the order of the page. */
export function all(node, predicate, hits = []) {
    if (!node || typeof node !== 'object') return hits;
    if (predicate(node)) hits.push(node);
    for (const child of childrenOf(node)) all(child, predicate, hits);
    return hits;
}

/** The text of an element and of what is inside it. */
export function textOf(node) {
    if (typeof node === 'string') return node;
    return childrenOf(node).map(textOf).join('');
}

/** The elements of a tag (`button`, `a`), optionally those whose text is exactly this. */
export const tags = (node, tag, text) => all(node, (candidate) => candidate.type === tag && (text === undefined || textOf(candidate) === text));

const escape = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/** The draw as text: every element, its attributes and which handlers it has; the ids of `useId` numbered as they appear. */
export function html(node) {
    const write = (child) => {
        if (typeof child === 'string') return escape(child);
        if (child.type === 'root') return childrenOf(child).map(write).join('');
        const attributes = Object.entries(child.props).flatMap(([name, value]) => {
            if (name === 'children' || name === 'ref' || value === undefined || value === null || value === false) return [];
            if (typeof value === 'function') return [` ${name}`];
            if (value === true) return [` ${name}="true"`];
            return [` ${name}="${escape(typeof value === 'object' ? JSON.stringify(value) : value)}"`];
        });
        return `<${child.type}${attributes.join('')}>${childrenOf(child).map(write).join('')}</${child.type}>`;
    };
    const names = new Map();
    return write(node).replace(/:id-\d+:/g, (id) => names.get(id) ?? names.set(id, `:id${names.size}:`).get(id));
}

/**
 * The portrait of a screen's states, kept in a file beside the tests: `same(name, tree)` compares the draw with the one
 * recorded BEFORE a rewrite; `ADMIN_KIT_PORTRAIT=write` records it (only when a change of the screen is meant).
 */
export async function portraits(file) {
    const { existsSync, readFileSync, writeFileSync } = await import('node:fs');
    const assert = (await import('node:assert/strict')).default;
    const writing = process.env.ADMIN_KIT_PORTRAIT === 'write';
    const known = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
    return {
        same(name, tree) {
            const now = html(tree);
            if (writing) {
                known[name] = now;
                writeFileSync(file, `${JSON.stringify(known, null, 1)}\n`);
                return;
            }
            assert.ok(name in known, `no portrait recorded for «${name}» (ADMIN_KIT_PORTRAIT=write records it)`);
            assert.equal(now, known[name], `the screen «${name}» is not the one of the portrait`);
        },
    };
}
