// cópia carimbada do kit do admin do MJRP Harness · admin-kit v0.9.0 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
// Loads the kit's TypeScript in the tests (F332): Node strips the types of a `.ts` by itself, but does not resolve an import
// without its extension, does not read JSX and does not know the core's alias. An import without extension from a
// `.ts`/`.tsx` becomes the file; a `.tsx` is transpiled with the React JSX by the kit's own TypeScript; the alias
// `@mjrp/admin-kit-core` is the core's `index.js` (`ADMIN_KIT_CORE`). No project alias: the kit imports nothing of a project.
import { registerHooks } from 'node:module';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const asFile = (candidate) => [candidate, `${candidate}.ts`, `${candidate}.tsx`, path.join(candidate, 'index.ts')]
    .find((file) => existsSync(file) && statSync(file).isFile());

/** The core's folder, which the kit's `ui/` imports by the alias `@mjrp/admin-kit-core` (a project binds it the same way). */
const CORE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', process.env.ADMIN_KIT_CORE ?? 'core');

let installed = false;
export function installTsHooks() {
    if (installed) return;
    installed = true;
    registerHooks({
        resolve(specifier, context, next) {
            if (specifier === '@mjrp/admin-kit-core') return { url: pathToFileURL(path.join(CORE, 'index.js')).href, shortCircuit: true };
            if (specifier.startsWith('.') && context.parentURL?.startsWith('file:') && /\.tsx?$/.test(context.parentURL)) {
                const file = asFile(path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier));
                if (file) return { url: pathToFileURL(file).href, shortCircuit: true };
            }
            return next(specifier, context);
        },
        load(url, context, next) {
            if (!url.startsWith('file:') || !url.endsWith('.tsx')) return next(url, context);
            const source = readFileSync(fileURLToPath(url), 'utf8');
            const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } });
            return { format: 'module', source: outputText, shortCircuit: true };
        },
    });
}
