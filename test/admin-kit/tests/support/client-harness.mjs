// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
// Runs a client component (.tsx) of the kit in Node's test runner, with no DOM and no new dependency (F332, TASK-08; brought
// from the MJRPpersonal's tests/support/client-harness.mjs at c33a33a4): the kit's `typescript` transpiles, and `react` becomes a
// useState/useEffect/useSyncExternalStore of a few lines. No reconciler: the component is called as a function and gives back
// its tree of elements, and the test calls its handlers, as a click would. The kit's folder is a parameter (`ADMIN_KIT_UI`,
// `ADMIN_KIT_CORE`); no project alias (`@/`): the kit imports nothing of a project, and the core by `@mjrp/admin-kit-core`.
import { createRequire, registerHooks } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

let ts = null;
try {
    ts = createRequire(import.meta.url)('typescript');
} catch {
    // sem `typescript` instalado: ver SKIP
}

export const ROOT = path.resolve(import.meta.dirname, '..', '..');
export const UI = path.resolve(ROOT, process.env.ADMIN_KIT_UI ?? 'ui');
export const CORE = path.resolve(ROOT, process.env.ADMIN_KIT_CORE ?? 'core');
export const SKIP = ts ? false : 'typescript is not installed (npm install): the .tsx cannot run';

export const stub = (src) => 'data:text/javascript,' + encodeURIComponent(src);

const BASE_STUBS = {
    react: stub(`
        export const useState = (initial) => globalThis.__hooks.useState(initial);
        export const useEffect = (effect) => globalThis.__hooks.useEffect(effect);
        export const useSyncExternalStore = (subscribe, snapshot, serverSnapshot) => globalThis.__hooks.useSyncExternalStore(snapshot, serverSnapshot);
        export const useRef = (current) => ({ current });
        export const useId = () => ':r0:';
        export const Fragment = 'fragment';
        export const useCallback = (callback) => callback;
        export const useMemo = (compute) => compute();
        export default { createElement: (type, props) => ({ type, props }) };`),
    'react/jsx-runtime': stub(`
        const element = (type, props) => ({ type, props });
        export const jsx = element;
        export const jsxs = element;
        export const Fragment = 'fragment';`),
};

/** The file of a relative import without extension, as the bundler resolves it, or the core's entrance; `null` for the rest. */
function sourceFile(specifier, parentURL) {
    if (specifier === '@mjrp/admin-kit-core') return path.join(CORE, 'index.js');
    if (!specifier.startsWith('.') || !parentURL?.startsWith('file:') || !/\.tsx?$/.test(parentURL)) return null;
    const base = path.resolve(path.dirname(fileURLToPath(parentURL)), specifier);
    return ['', '.ts', '.tsx', '/index.ts'].map((extension) => base + extension).find((file) => existsSync(file) && !file.endsWith(path.sep) && /\.[jt]sx?$/.test(file)) ?? null;
}

/** Liga os hooks de resolução e de transpilação. `stubs` é { especificador: url do módulo de mentira }. */
export function installClientHarness(stubs = {}) {
    const specifiers = { ...BASE_STUBS, ...stubs };

    registerHooks({
        resolve(specifier, context, next) {
            if (specifiers[specifier]) return { url: specifiers[specifier], shortCircuit: true };
            const source = sourceFile(specifier, context.parentURL);
            if (source) return { url: pathToFileURL(source).href, shortCircuit: true };
            return next(specifier, context);
        },
        load(url, context, next) {
            if (!url.endsWith('.tsx')) return next(url, context);
            const { outputText } = ts.transpileModule(readFileSync(fileURLToPath(url), 'utf-8'), {
                compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext },
            });
            return { format: 'module', source: outputText, shortCircuit: true };
        },
    });
}

/** Imports a component by its path under the kit's `ui/`. */
export function importComponent(relative) {
    return import(pathToFileURL(path.join(UI, relative)).href);
}

/** Monta o componente: `render()` chama de novo com o estado guardado e devolve a árvore; os efeitos rodam na primeira vez. */
export function mount(Component, props = {}) {
    const slots = [];
    const effects = [];
    let cursor = 0;
    let mounted = false;

    // Cada vista guarda os próprios ganchos e os põe no lugar a cada `render()`: duas vistas montadas ao mesmo tempo (a lista e o
    // aviso flutuante da F115, que leem a mesma fila) não pisam no estado uma da outra.
    const hooks = {
        useState(initial) {
            const index = cursor++;
            if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
            return [slots[index], (value) => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
        },
        useEffect(effect) {
            if (!mounted) effects.push(effect);
        },
        // A primeira passada responde como o servidor; dali em diante, como o navegador. Igual à hidratação.
        useSyncExternalStore(snapshot, serverSnapshot) {
            return mounted ? snapshot() : serverSnapshot();
        },
    };
    globalThis.__hooks = hooks;

    return {
        /** O que o `router.refresh()` faz: o mesmo componente, ainda montado, recebe props novas do servidor. */
        setProps(next) { props = { ...props, ...next }; },
        render() {
            globalThis.__hooks = hooks;
            cursor = 0;
            const tree = Component(props);
            if (!mounted) {
                mounted = true;
                effects.forEach((effect) => effect());
            }
            return tree;
        },
    };
}

const childrenOf = (node) => [node?.props?.children].flat(Infinity).filter((child) => child && typeof child === 'object');

/** O primeiro elemento da árvore que atende ao predicado, em profundidade. */
export function find(node, predicate) {
    if (!node || typeof node !== 'object') return null;
    if (predicate(node)) return node;
    for (const child of childrenOf(node)) {
        const hit = find(child, predicate);
        if (hit) return hit;
    }
    return null;
}

/** O texto de um elemento e dos filhos dele. */
export function textOf(node) {
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (!node || typeof node !== 'object') return '';
    return [node.props?.children].flat(Infinity).map(textOf).join('');
}
