#!/usr/bin/env node
// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
/**
 * The admin kit's own check (F332, REQ-01 and REQ-02; TASK-07): what the kit promises every project, measured by a tool
 * that answers 0 or 1, in the harness before a version leaves and in a project that has the kit.
 *
 *   1. The boundary. `ui/` imports only the allowed packages, the core by its alias and its own files; `core/` imports no
 *      package and touches no engine global, only its own `.js` files; a project enters the kit only by its entrances
 *      (`ui/index.ts`, `ui/react.ts`, `core/index.js`).
 *   2. The skin is only tokens. The kit writes no colour, font or radius of its own and no `var()` outside the contract
 *      (`ui/skin-contract.ts`); every declared skin declares every token (brought from the MJRPpersonal's
 *      `scripts/skin_tokens_check.mjs`).
 *   3. Complexity 10, measured by ESLint's own `complexity` rule (the V0's measure). The functions above it today are in
 *      `complexity-allowlist.json`, a list that only shrinks: a new one, a worse one, and one brought down but still
 *      listed all fail. `--no-complexity-exceptions` (a project whose rules say so, the V0) fails on any of them.
 *   4. The register of the releases (`releases.json`, the commit of every `admin-kit-v*` tag) only grows: compared with the
 *      one on `main`, no version left it and no commit changed (in the harness, where git has `main`).
 *   5. The surface. `api-surface.json` holds what the entrances exported at the version it names, the members of `KitPorts`,
 *      `KitSchema` and `KitTexts` and the type of every exported value (a member removed, made required or retyped, or a
 *      signature changed, is major; a member added optional is minor); a version that removes
 *      an export must be a major one, one that adds must be at least a minor one, and a fix (patch) changes nothing.
 *      `--write-surface` records the surface of today's `VERSION`, after the bump.
 *
 *   node kits/admin-kit/check.mjs [--ui DIR] [--core DIR] [--root DIR] [--skin CSS]... [--project DIR [--alias PREFIX=DIR]...]
 *                                 [--no-complexity-exceptions] [--no-surface] [--write-surface]
 *
 * In a child (the sensor it inherits, F332 TASK-11) the check lives in the contract's `tools_path` with its lists and VERSION:
 * `--root` names that folder (by default the folder above `ui/`, as in the harness). The core may sit inside the screens'
 * folder (the MJRPpersonal's `src/admin-kit/core/`): its files are measured once, as `core/…`.
 *
 * Exit 0 green · 1 a finding · 2 not evaluable (a folder, the contract or a measuring tool missing).
 */
import { existsSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KIT = path.dirname(fileURLToPath(import.meta.url));

/** The packages `ui/` may import (ADR-0011 of the MJRPpersonal, CC-ADR-0068). */
export const UI_PACKAGES = ['react', 'react/jsx-runtime', 'react-dom', '@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities', 'clsx'];
export const CORE_ALIAS = '@mjrp/admin-kit-core';
/** What the core may not touch: what exists only in one engine (a browser, Node), so the core runs the same in all. */
export const ENGINE_GLOBALS = ['window', 'document', 'navigator', 'location', 'history', 'globalThis', 'self', 'global', 'process', 'require', 'module', 'Buffer', 'crypto', 'Intl', 'localStorage', 'sessionStorage', 'fetch', 'XMLHttpRequest', '__dirname', '__filename'];
export const ENTRANCES = { ui: ['index.ts', 'react.ts'], core: ['index.js'] };
export const COMPLEXITY_LIMIT = 10;

// ---------------------------------------------------------------- files

const SOURCE = /\.(js|mjs|ts|tsx)$/;
/** Every file under a folder matching a pattern, absolute (`node_modules` left out). */
export function filesUnder(root, pattern = SOURCE) {
    if (!existsSync(root)) return [];
    return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(root, entry.name);
        if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : filesUnder(full, pattern);
        return pattern.test(entry.name) && !entry.name.endsWith('.d.ts') ? [full] : [];
    });
}

const inside = (dir, file) => {
    const rel = path.relative(dir, file);
    return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
};

/** The kit-relative name of a file (`ui/…`, `core/…`), the same in the harness and in a project. */
const kitName = (dirs, file) => (inside(dirs.core, file) ? `core/${path.relative(dirs.core, file)}` : inside(dirs.ui, file) ? `ui/${path.relative(dirs.ui, file)}` : file).split(path.sep).join('/');

/** The screens' files: those under `ui/` that are not the core's (the core may sit inside the screens' folder in a child). */
const uiFiles = (dirs, pattern) => filesUnder(dirs.ui, pattern).filter((file) => !inside(dirs.core, file) && file !== dirs.core);

// ---------------------------------------------------------------- 1. the boundary

/** The module addresses a file imports or re-exports, with their line (static and dynamic imports, `require`). */
export function importsOf(ts, file) {
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : file.endsWith('.ts') ? ts.ScriptKind.TS : ts.ScriptKind.JS);
    const out = [];
    const line = (node) => source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
    const visit = (node) => {
        if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
            out.push({ spec: node.moduleSpecifier.text, line: line(node) });
        } else if (ts.isCallExpression(node) && node.arguments.length && ts.isStringLiteralLike(node.arguments[0])
            && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === 'require'))) {
            out.push({ spec: node.arguments[0].text, line: line(node) });
        }
        ts.forEachChild(node, visit);
    };
    visit(source);
    return out;
}

/** The engine globals a file touches: a free name of the list, never a property or a declaration of its own. */
/** The escapes the boundary cannot follow: code made from a string, and an import whose address is computed. */
export const CORE_ESCAPES = ['eval', 'Function'];

/** The engine globals a core file touches, and its escapes (`eval`, `Function`, `import(variable)`). A name is a global only
 * when no scope around the use declares it (recheck P2-1: a same-name local in another function used to hide the global
 * in the whole file). */
export function globalsOf(ts, file) {
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    const scopes = new Map(); // scope node → names declared in it
    const isFunction = (node) => ts.isFunctionLike(node) || ts.isSourceFile(node);
    const isBlock = (node) => isFunction(node) || ts.isBlock(node) || ts.isForStatement(node) || ts.isForInStatement(node) || ts.isForOfStatement(node) || ts.isCaseBlock(node) || ts.isCatchClause(node);
    const up = (node, test) => { let at = node.parent; while (at && !test(at)) at = at.parent; return at ?? source; };
    const declare = (scope, name) => { if (!scopes.has(scope)) scopes.set(scope, new Set()); scopes.get(scope).add(name); };
    const bind = (scope, name) => {
        if (!name) return;
        if (ts.isIdentifier(name)) declare(scope, name.text);
        else if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) for (const element of name.elements) if (!ts.isOmittedExpression(element)) bind(scope, element.name);
    };
    const collect = (node) => {
        if (ts.isVariableDeclaration(node)) {
            const list = node.parent;
            const blockScoped = ts.isVariableDeclarationList(list) && (list.flags & (ts.NodeFlags.Let | ts.NodeFlags.Const));
            bind(ts.isCatchClause(list) ? list : up(node, blockScoped ? isBlock : isFunction), node.name);
        } else if (ts.isParameter(node)) bind(node.parent, node.name);
        else if ((ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) && node.name) declare(up(node, isBlock), node.name.text);
        else if ((ts.isFunctionExpression(node) || ts.isClassExpression(node)) && node.name) declare(node, node.name.text);
        else if (ts.isImportClause(node) && node.name) declare(source, node.name.text);
        else if ((ts.isImportSpecifier(node) || ts.isNamespaceImport(node)) && node.name) declare(source, node.name.text);
        ts.forEachChild(node, collect);
    };
    collect(source);
    const declaredAround = (node, name) => { for (let at = node.parent; at; at = at.parent) if (scopes.get(at)?.has(name)) return true; return false; };
    const seen = [];
    const lineOf = (node) => source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
    const visit = (node) => {
        if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && !(node.arguments[0] && ts.isStringLiteralLike(node.arguments[0]))) {
            seen.push({ name: 'import(…)', line: lineOf(node) });
        }
        if (ts.isIdentifier(node) && (ENGINE_GLOBALS.includes(node.text) || CORE_ESCAPES.includes(node.text))) {
            const parent = node.parent;
            const isName = (ts.isPropertyAccessExpression(parent) && parent.name === node) || (ts.isPropertyAssignment(parent) && parent.name === node)
                || (ts.isMethodDeclaration(parent) && parent.name === node) || ts.isImportSpecifier(parent) || ts.isExportSpecifier(parent) || (ts.isPropertySignature?.(parent) && parent.name === node)
                || ((ts.isVariableDeclaration(parent) || ts.isParameter(parent) || ts.isBindingElement(parent) || ts.isFunctionDeclaration(parent) || ts.isClassDeclaration(parent)) && parent.name === node);
            if (!isName && !declaredAround(node, node.text)) seen.push({ name: node.text, line: lineOf(node) });
        }
        ts.forEachChild(node, visit);
    };
    visit(source);
    return seen;
}

const resolvesTo = (from, spec) => path.resolve(path.dirname(from), spec);

export function checkBoundary(ts, dirs) {
    const findings = [];
    for (const file of uiFiles(dirs)) {
        for (const { spec, line } of importsOf(ts, file)) {
            const at = `${kitName(dirs, file)}:${line}`;
            if (spec.startsWith('.')) {
                if (!inside(dirs.ui, resolvesTo(file, spec))) findings.push(`boundary · ${at} imports «${spec}», outside ui/`);
            } else if (spec !== CORE_ALIAS && !UI_PACKAGES.includes(spec)) findings.push(`boundary · ${at} imports «${spec}», not in the list of ui/ (${UI_PACKAGES.join(', ')}, ${CORE_ALIAS})`);
        }
    }
    for (const file of filesUnder(dirs.core)) {
        const at = (line) => `${kitName(dirs, file)}:${line}`;
        if (!file.endsWith('.js')) findings.push(`boundary · ${kitName(dirs, file)} is not JavaScript: the core is plain .js`);
        for (const { spec, line } of importsOf(ts, file)) {
            if (!spec.startsWith('.')) findings.push(`boundary · ${at(line)} imports the package «${spec}»: the core imports none`);
            else if (!spec.endsWith('.js')) findings.push(`boundary · ${at(line)} imports «${spec}» without «.js»: the core runs with no loader`);
            else if (!inside(dirs.core, resolvesTo(file, spec))) findings.push(`boundary · ${at(line)} imports «${spec}», outside core/`);
        }
        for (const { name, line } of globalsOf(ts, file)) findings.push(CORE_ESCAPES.includes(name) || name === 'import(…)' ? `boundary · ${at(line)} uses «${name}», code the boundary cannot follow` : `boundary · ${at(line)} touches «${name}», a global of one engine`);
    }
    for (const [part, names] of Object.entries(ENTRANCES)) {
        for (const name of names) if (!existsSync(path.join(dirs[part], name))) findings.push(`boundary · the entrance ${part}/${name} is missing`);
    }
    return findings;
}

/** A project enters the kit only by its entrances: an import that resolves to another file of `ui/` or `core/` is refused. */
export function checkEntrances(ts, dirs, project, aliases) {
    const findings = [];
    const entrances = [...ENTRANCES.ui.map((name) => path.join(dirs.ui, name)), ...ENTRANCES.core.map((name) => path.join(dirs.core, name))];
    const candidates = (target) => [target, ...['.ts', '.tsx', '.js', '/index.ts', '/index.js'].map((ext) => `${target}${ext}`)];
    for (const file of filesUnder(project)) {
        if (inside(dirs.ui, file) || inside(dirs.core, file) || file === dirs.ui || file === dirs.core) continue;
        for (const { spec, line } of importsOf(ts, file)) {
            let target = null;
            if (spec.startsWith('.')) target = resolvesTo(file, spec);
            else if (spec === CORE_ALIAS) continue;
            else {
                const alias = aliases.find(([prefix]) => spec.startsWith(prefix));
                if (alias) target = path.join(alias[1], spec.slice(alias[0].length));
            }
            if (!target || !(inside(dirs.ui, target) || inside(dirs.core, target) || target === dirs.ui || target === dirs.core)) continue;
            const real = candidates(target).find((name) => existsSync(name) && statSync(name).isFile());
            if (!real || !entrances.includes(real)) findings.push(`boundary · ${path.relative(project, file)}:${line} imports «${spec}», inside the kit: a project enters only by ${[...ENTRANCES.ui.map((n) => `ui/${n}`), ...ENTRANCES.core.map((n) => `core/${n}`)].join(', ')}`);
        }
    }
    return findings;
}

// ---------------------------------------------------------------- 2. the skin

const SKIN_CONTRACT = 'skin-contract.ts';
export function contractTokens(dirs) {
    const file = path.join(dirs.ui, SKIN_CONTRACT);
    if (!existsSync(file)) return null;
    const list = readFileSync(file, 'utf8').match(/SKIN_TOKENS\s*=\s*\[([\s\S]*?)\]/);
    return list ? [...list[1].matchAll(/'(--ak-[a-z0-9-]+)'/g)].map((match) => match[1]) : null;
}

const GENERIC_FONT = /\b(serif|sans-serif|monospace|system-ui|cursive|fantasy|ui-monospace|ui-serif|ui-sans-serif)\b|['"]/;
const RADIUS_OK = /^(0|50%|999px)$/;

/** What the kit writes on its own, line by line: a colour, a font, a radius, a `var()` outside the contract. */
export function scanKitStyle(dirs, tokens) {
    const findings = [];
    for (const file of uiFiles(dirs, /\.(css|tsx?)$/).filter((name) => path.basename(name) !== SKIN_CONTRACT)) {
        readFileSync(file, 'utf8').split('\n').forEach((raw, index) => {
            const line = raw.replace(/\/\*.*?\*\//g, '').replace(/^\s*(\/\/|\*).*$/, '');
            const at = `${kitName(dirs, file)}:${index + 1}`;
            if (/#[0-9a-fA-F]{3,8}\b/.test(line) && !/(href|id)=|#blk-|`#/.test(line)) findings.push(`skin · ${at} writes a colour`);
            if (/\b(rgba?|hsla?)\(/.test(line)) findings.push(`skin · ${at} writes a colour`);
            for (const [, name, value] of line.matchAll(/\b(font|font-family|border-radius)\s*:\s*([^;}]+)/g)) {
                const own = value.replace(/var\(--ak-[a-z0-9-]+\)/g, '').trim();
                if (name !== 'border-radius' && GENERIC_FONT.test(own)) findings.push(`skin · ${at} writes a font`);
                if (name === 'border-radius' && !value.includes('var(--ak-radius)') && !RADIUS_OK.test(value.trim())) findings.push(`skin · ${at} writes a radius`);
            }
            for (const [, token] of line.matchAll(/var\((--[a-zA-Z0-9-]+)/g)) if (!tokens.includes(token)) findings.push(`skin · ${at} uses ${token}, outside the contract`);
        });
    }
    return findings;
}

/** Every skin (a `[data-admin-skin="<name>"]` block) declares every token of the contract in its base block. */
export function scanSkins(files, tokens) {
    const declared = new Map();
    for (const file of files) {
        const css = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
        for (const [, selectors, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
            for (const selector of selectors.split(',').map((part) => part.trim())) {
                const base = selector.match(/^\[data-admin-skin="([^"]+)"\]$/);
                if (!base) continue;
                const key = `${path.basename(file)} · ${base[1]}`;
                const set = declared.get(key) ?? new Set();
                for (const [, token] of body.matchAll(/(--ak-[a-z0-9-]+)\s*:/g)) set.add(token);
                declared.set(key, set);
            }
        }
    }
    const findings = [];
    for (const [skin, set] of declared) {
        const missing = tokens.filter((token) => !set.has(token));
        if (missing.length) findings.push(`skin · ${skin} misses ${missing.join(', ')}`);
    }
    return { findings, skins: [...declared.keys()] };
}

// ---------------------------------------------------------------- 3. complexity

/** «Async method '_one'» → «_one»; «Arrow function» → «arrow function» (the V0's names). */
const functionName = (description) => description.match(/'([^']+)'/)?.[1] ?? description.toLowerCase();

/** The deepest folder holding both parts: ESLint ignores, without a word, a file outside its `cwd` (in the V0 the core is in
 * `shared/`, far from the screens in `public/js/ui/`, and the core's functions went unmeasured). */
const commonFolder = (a, b) => {
    const left = path.resolve(a).split(path.sep);
    const right = path.resolve(b).split(path.sep);
    let i = 0;
    while (i < left.length && i < right.length && left[i] === right[i]) i++;
    return left.slice(0, i).join(path.sep) || path.sep;
};

/** Every function of the kit above the limit, by ESLint's `complexity` rule: `{ key, complexity, line }`. */
export async function measureComplexity(dirs) {
    const [{ ESLint }, tseslint] = await Promise.all([import('eslint'), import('typescript-eslint').then((m) => m.default ?? m)]);
    const rule = { complexity: ['error', COMPLEXITY_LIMIT] };
    const options = { noInlineConfig: true, reportUnusedDisableDirectives: 'off' };
    const eslint = new ESLint({
        cwd: commonFolder(dirs.ui, dirs.core), overrideConfigFile: true, ignorePatterns: ['**/node_modules/**'], errorOnUnmatchedPattern: false,
        overrideConfig: [
            { files: ['**/*.js', '**/*.mjs'], languageOptions: { ecmaVersion: 'latest', sourceType: 'module' }, linterOptions: options, rules: rule },
            { files: ['**/*.ts', '**/*.tsx'], languageOptions: { parser: tseslint.parser, ecmaVersion: 'latest', sourceType: 'module' }, linterOptions: options, rules: rule },
        ],
    });
    const results = await eslint.lintFiles([...uiFiles(dirs), ...filesUnder(dirs.core)]);
    const rows = [];
    for (const result of results.sort((a, b) => a.filePath.localeCompare(b.filePath))) {
        const counted = new Map();
        for (const message of result.messages) {
            if (message.fatal) throw new Error(`${kitName(dirs, result.filePath)}:${message.line} does not parse: ${message.message}`);
            if (message.ruleId !== 'complexity') continue;
            const found = message.message.match(/^(.*?) has a complexity of (\d+)/);
            const base = `${kitName(dirs, result.filePath)}:${functionName(found[1])}`;
            const n = (counted.get(base) ?? 0) + 1;
            counted.set(base, n);
            rows.push({ key: n > 1 ? `${base}#${n}` : base, complexity: Number(found[2]), line: message.line });
        }
    }
    return rows;
}

export function judgeComplexity(rows, allowed, { exceptions = true } = {}) {
    if (!exceptions) return rows.map((row) => `complexity · ${row.key} (line ${row.line}) has ${row.complexity}, above ${COMPLEXITY_LIMIT}, and this project allows no exception`);
    const findings = [];
    const measured = new Map(rows.map((row) => [row.key, row]));
    for (const row of rows) {
        const listed = allowed[row.key];
        if (listed === undefined) findings.push(`complexity · ${row.key} (line ${row.line}) has ${row.complexity}, above ${COMPLEXITY_LIMIT}, and is not in the list: the list only shrinks`);
        else if (row.complexity > listed) findings.push(`complexity · ${row.key} got worse: ${listed} → ${row.complexity}`);
        else if (row.complexity < listed) findings.push(`complexity · ${row.key} came down to ${row.complexity}: lower its number in complexity-allowlist.json`);
    }
    for (const key of Object.keys(allowed)) if (!measured.has(key)) findings.push(`complexity · ${key} is at ${COMPLEXITY_LIMIT} or below now: take it out of complexity-allowlist.json`);
    return findings;
}

// ---------------------------------------------------------------- 4. the register of the releases

/** The register only grows: every version of `before` is in `after`, with the same commit. */
export function judgeReleases(before, after) {
    const findings = [];
    for (const [version, commit] of Object.entries(before ?? {})) {
        if (!(version in (after ?? {}))) findings.push(`releases · ${version} left releases.json: the register only grows`);
        else if (after[version] !== commit) findings.push(`releases · the commit of ${version} changed in releases.json (${String(commit).slice(0, 12)} → ${String(after[version]).slice(0, 12)})`);
    }
    return findings;
}

/** The register on `main`, read by git from the kit's own repository; null when there is no git, no `main` or no file there. */
async function releasesOnMain(root) {
    const { spawnSync } = await import('node:child_process');
    const top = spawnSync('git', ['-C', root, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' });
    if (top.status !== 0) return null;
    const rel = path.relative(top.stdout.trim(), path.join(root, 'releases.json')).split(path.sep).join('/');
    const shown = spawnSync('git', ['-C', root, 'show', `main:${rel}`], { encoding: 'utf8' });
    return shown.status === 0 ? JSON.parse(shown.stdout).releases ?? {} : null;
}

// ---------------------------------------------------------------- 5. the surface

/** The types whose members are a contract with the project (proposal § 4.7): a member made required, removed or retyped is major. */
export const SHAPED_TYPES = ['KitPorts', 'KitSchema', 'KitTexts'];

/** What the entrances export, each name with `type ` when it is only a type; and the shapes (recheck P1-1): the members of
 * `SHAPED_TYPES` (`name` or `name?`, with its type) and the type of every exported value (a function's signature). */
export function surfaceOf(ts, dirs, { withShapes = false } = {}) {
    const entries = [...ENTRANCES.ui.map((name) => ['ui/' + name, path.join(dirs.ui, name)]), ...ENTRANCES.core.map((name) => ['core/' + name, path.join(dirs.core, name)])];
    const program = ts.createProgram(entries.map(([, file]) => file), {
        allowJs: true, checkJs: false, noEmit: true, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
        target: ts.ScriptTarget.ES2022, skipLibCheck: true, strict: true, baseUrl: path.dirname(dirs.ui), paths: { [CORE_ALIAS]: [path.join(dirs.core, 'index.js')] },
    });
    const checker = program.getTypeChecker();
    const text = (type) => checker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation);
    const surface = {};
    const shapes = {};
    for (const [name, file] of entries) {
        const source = program.getSourceFile(file);
        const symbol = source && checker.getSymbolAtLocation(source);
        const exported = symbol ? checker.getExportsOfModule(symbol) : [];
        surface[name] = exported.map((item) => {
            const target = item.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(item) : item;
            if (target.flags & ts.SymbolFlags.Value) {
                const decl = target.valueDeclaration ?? target.declarations?.[0];
                if (decl) shapes[`${name} ${item.name}`] = text(checker.getTypeOfSymbolAtLocation(target, decl));
                return item.name;
            }
            if (SHAPED_TYPES.includes(item.name) && !shapes[item.name]) {
                const members = {};
                for (const member of checker.getPropertiesOfType(checker.getDeclaredTypeOfSymbol(target))) {
                    const decl = member.valueDeclaration ?? member.declarations?.[0];
                    members[member.name + (member.flags & ts.SymbolFlags.Optional ? '?' : '')] = decl ? text(checker.getTypeOfSymbolAtLocation(member, decl)) : '?';
                }
                shapes[item.name] = Object.fromEntries(Object.entries(members).sort(([x], [y]) => x.localeCompare(y)));
            }
            return `type ${item.name}`;
        }).sort();
    }
    return withShapes ? { surface, shapes: Object.fromEntries(Object.entries(shapes).sort(([x], [y]) => x.localeCompare(y))) } : surface;
}

/** The changes of the shapes, as `{ major: [...], minor: [...] }`: a member removed, made required, added required or retyped,
 * and a value's type changed, are major; a member added optional or made optional is minor. */
export function shapeChanges(before = {}, after = {}) {
    const major = [];
    const minor = [];
    for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
        const old = before[key];
        const now = after[key];
        if (old === undefined || now === undefined) continue; // an export that came or went is the names' rule
        if (typeof old === 'string' || typeof now === 'string') {
            if (old !== now) major.push(`${key} changed its type`);
            continue;
        }
        const strip = (members) => new Map(Object.entries(members).map(([m, t]) => [m.replace(/\?$/, ''), { optional: m.endsWith('?'), type: t }]));
        const was = strip(old);
        const is = strip(now);
        for (const [member, prior] of was) {
            const next = is.get(member);
            if (!next) major.push(`${key}.${member} left`);
            else if (prior.optional && !next.optional) major.push(`${key}.${member} became required`);
            else if (prior.type !== next.type) major.push(`${key}.${member} changed its type`);
            else if (!prior.optional && next.optional) minor.push(`${key}.${member} became optional`);
        }
        for (const [member, next] of is) {
            if (was.has(member)) continue;
            if (next.optional) minor.push(`${key}.${member}? joined`);
            else major.push(`${key}.${member} joined as required`);
        }
    }
    return { major, minor };
}

const parseVersion = (text) => {
    const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(text).trim());
    return match ? match.slice(1).map(Number) : null;
};

/** The rule of the version: the bump from the recorded surface's version to today's VERSION allows the change. */
export function judgeSurface(recorded, version, surface, shapes = null) {
    const before = parseVersion(recorded.version);
    const now = parseVersion(version);
    if (!before || !now) return [`surface · the version is not X.Y.Z (recorded ${recorded.version}, VERSION ${version})`];
    const removed = [];
    const added = [];
    for (const entry of new Set([...Object.keys(recorded.surface), ...Object.keys(surface)])) {
        const old = new Set(recorded.surface[entry] ?? []);
        const fresh = new Set(surface[entry] ?? []);
        for (const name of old) if (!fresh.has(name)) removed.push(`${entry} ${name}`);
        for (const name of fresh) if (!old.has(name)) added.push(`${entry} ${name}`);
    }
    const { major, minor } = shapes && recorded.shapes ? shapeChanges(recorded.shapes, shapes) : { major: [], minor: [] };
    if (shapes && !recorded.shapes) return ['surface · api-surface.json has no shapes (the members of the ports, the schema and the texts, the signatures): record it with --write-surface'];
    if (!removed.length && !added.length && !major.length && !minor.length) return [];
    const kind = now[0] > before[0] ? 'major' : now[0] === before[0] && now[1] > before[1] ? 'minor' : now[0] === before[0] && now[1] === before[1] && now[2] > before[2] ? 'patch' : 'none';
    const findings = [];
    if (removed.length && kind !== 'major') findings.push(`surface · ${removed.join(', ')} left the surface: that is a major version, and ${recorded.version} → ${version} is not`);
    if (kind !== 'major') for (const change of major) findings.push(`surface · ${change}: that is a major version, and ${recorded.version} → ${version} is not`);
    if (added.length && (kind === 'patch' || kind === 'none')) findings.push(`surface · ${added.join(', ')} joined the surface: that is at least a minor version, and ${recorded.version} → ${version} is not`);
    if (kind === 'patch' || kind === 'none') for (const change of minor) findings.push(`surface · ${change}: that is at least a minor version, and ${recorded.version} → ${version} is not`);
    return findings.length ? findings : [`surface · the surface changed with a ${kind} version (${recorded.version} → ${version}): record it with --write-surface`];
}

// ---------------------------------------------------------------- the run

function parseArgs(argv) {
    const options = { ui: path.join(KIT, 'ui'), core: path.join(KIT, 'core'), root: null, skins: [], aliases: [], project: null, exceptions: true, surface: true, writeSurface: false };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        const value = () => argv[++i];
        if (arg === '--ui') options.ui = path.resolve(value());
        else if (arg === '--core') options.core = path.resolve(value());
        else if (arg === '--root') options.root = path.resolve(value());
        else if (arg === '--skin') options.skins.push(path.resolve(value()));
        else if (arg === '--project') options.project = path.resolve(value());
        else if (arg === '--alias') { const [prefix, dir] = value().split('='); options.aliases.push([prefix, path.resolve(dir)]); }
        else if (arg === '--no-complexity-exceptions') options.exceptions = false;
        else if (arg === '--no-surface') options.surface = false;
        else if (arg === '--write-surface') options.writeSurface = true;
        else throw new Error(`unknown option ${arg}`);
    }
    // No skin named: the example's, which lives with the tests (`tests/example/`, beside the lists; in a project, under `tools_path`).
    if (!options.skins.length) options.skins = filesUnder(path.join(options.root ?? path.dirname(options.ui), 'tests', 'example'), /\.css$/);
    return options;
}

/** The whole check: `{ findings, notEvaluated }`. The kit's root (`VERSION`, the lists) is the folder above `ui/`. */
export async function checkKit(options) {
    const findings = [];
    const notEvaluated = [];
    const dirs = { ui: options.ui, core: options.core };
    for (const [part, dir] of Object.entries(dirs)) if (!existsSync(dir)) notEvaluated.push(`the folder ${part}/ is missing: ${dir}`);
    if (notEvaluated.length) return { findings, notEvaluated };
    let ts;
    try { ts = (await import('typescript')).default; } catch { return { findings, notEvaluated: ['typescript is not installed: nothing was measured'] }; }

    findings.push(...checkBoundary(ts, dirs));
    if (options.project) findings.push(...checkEntrances(ts, dirs, options.project, options.aliases));

    const tokens = contractTokens(dirs);
    if (!tokens?.length) notEvaluated.push('skin: the contract (ui/skin-contract.ts) is missing or empty');
    else {
        findings.push(...scanKitStyle(dirs, tokens));
        const { findings: skins, skins: seen } = scanSkins(options.skins, tokens);
        findings.push(...skins);
        if (!seen.length) notEvaluated.push('skin: no skin declared to check');
    }

    const root = options.root ?? path.dirname(dirs.ui);
    try {
        const rows = await measureComplexity(dirs);
        const listFile = path.join(root, 'complexity-allowlist.json');
        const allowed = existsSync(listFile) ? JSON.parse(readFileSync(listFile, 'utf8')).functions ?? {} : {};
        findings.push(...judgeComplexity(rows, allowed, { exceptions: options.exceptions }));
    } catch (error) {
        notEvaluated.push(`complexity: not measured (${String(error?.message ?? error).split('\n')[0]})`);
    }

    const releasesFile = path.join(root, 'releases.json');
    if (existsSync(releasesFile)) {
        const before = await releasesOnMain(root);
        if (before) findings.push(...judgeReleases(before, JSON.parse(readFileSync(releasesFile, 'utf8')).releases ?? {}));
    }

    if (options.surface) {
        const surfaceFile = path.join(root, 'api-surface.json');
        const versionFile = path.join(root, 'VERSION');
        if (!existsSync(versionFile)) notEvaluated.push('surface: VERSION is missing');
        else {
            const version = readFileSync(versionFile, 'utf8').trim();
            const { surface, shapes } = surfaceOf(ts, dirs, { withShapes: true });
            if (options.writeSurface) writeFileSync(surfaceFile, `${JSON.stringify({ version, typescript: ts.version, surface, shapes }, null, 2)}\n`);
            else if (!existsSync(surfaceFile)) notEvaluated.push('surface: api-surface.json is missing (record it with --write-surface)');
            else {
                // The shapes are TypeScript's own words for the types, and another TypeScript may word them otherwise: they are
                // compared under the TypeScript that recorded them (the harness's, where a version is made); in a project with
                // another TypeScript only the names are compared, and the copy itself cannot change there (the doctor's I5).
                const recorded = JSON.parse(readFileSync(surfaceFile, 'utf8'));
                findings.push(...judgeSurface(recorded, version, surface, recorded.typescript === ts.version ? shapes : null));
            }
        }
    }
    return { findings, notEvaluated };
}

// run as a script: compared by the real path (a child's temporary folder under /var is /private/var on macOS, and a check
// that did not notice it was the script exited 0 having measured nothing)
if (process.argv[1] && realpathSync(path.resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))) {
    const { findings, notEvaluated } = await checkKit(parseArgs(process.argv.slice(2)));
    for (const finding of findings) console.log(`  ${finding}`);
    for (const missing of notEvaluated) console.log(`  not evaluated · ${missing}`);
    const code = findings.length ? 1 : notEvaluated.length ? 2 : 0;
    console.log(`admin-kit check: ${code === 0 ? 'green' : code === 1 ? `${findings.length} finding(s)` : 'not evaluable'}`);
    process.exit(code);
}
