// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
// The kit speaks English and imports no CSS (F332, REQ-01 and REQ-05; TASK-04): every text of the kit's code is English —
// a project hands its own words through the ports (`KitTexts`, `RichTexts`, `RequiredTexts`) — and the screens' entrance
// imports no stylesheet: the project imports `kit.css` and `required.css` itself, so a compiler that checks a side-effect
// import (the V0's TypeScript 6, TS2882) has nothing to refuse.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { portugueseIn, sourceFiles, textsOf } from './support/source-text.mjs';

// the compiler and the types from where this file is (the kit in the harness, the project's packages in a project)
const require = createRequire(import.meta.url);

const KIT = path.resolve(import.meta.dirname, '..');
const UI = path.resolve(KIT, process.env.ADMIN_KIT_UI ?? 'ui');
const CORE = path.resolve(KIT, process.env.ADMIN_KIT_CORE ?? 'core');

test('o detector acusa português e deixa o inglês', () => {
    assert.ok(portugueseIn('Não salvou'));
    assert.ok(portugueseIn('Remover link'));
    assert.ok(portugueseIn('Uma linha entre dois trechos'));
    assert.equal(portugueseIn('Nothing was saved.'), null);
    assert.equal(portugueseIn('https://www.youtube.com/watch?v='), null);
});

test('nenhum texto do código do kit em português (ui/ e core/)', () => {
    const found = [UI, CORE].flatMap(sourceFiles).flatMap((file) => textsOf(file)
        .map(({ line, text }) => ({ line, text, why: portugueseIn(text) }))
        .filter((item) => item.why)
        .map(({ line, text, why }) => `${path.relative(KIT, file)}:${line} ${why}: ${text.slice(0, 80)}`));
    assert.deepEqual(found, []);
});

test('nenhum texto do código do kit leva uma palavra de um projeto (o «Garden» do MJRPpersonal; reconferência P2-11)', () => {
    const PROJECT_WORDS = /\b(Garden|Jardim|MJRPpersonal)\b/i;
    const found = [UI, CORE].flatMap(sourceFiles).flatMap((file) => textsOf(file)
        .filter(({ text }) => PROJECT_WORDS.test(text))
        .map(({ line, text }) => `${path.relative(KIT, file)}:${line} ${text.slice(0, 80)}`));
    assert.deepEqual(found, []);
});

test('a entrada das telas não importa CSS: o projeto importa kit.css e required.css', () => {
    const imports = sourceFiles(UI).flatMap((file) => [...readFileSync(file, 'utf8').matchAll(/^\s*import\s+['"]([^'"]+\.css)['"]/gm)].map((m) => `${path.relative(KIT, file)}: ${m[1]}`));
    assert.deepEqual(imports, []);
});

test('o tsc com as opções do V0 (TypeScript que confere import de efeito) passa sem TS2882', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'cc-admin-kit-tsc-'));
    const config = {
        compilerOptions: {
            target: 'ES2022', lib: ['ES2022', 'DOM', 'DOM.Iterable'], module: 'ESNext', moduleResolution: 'bundler', jsx: 'react-jsx', strict: true,
            noEmit: true, allowJs: true, checkJs: false, skipLibCheck: true, isolatedModules: true, allowImportingTsExtensions: true, resolveJsonModule: true,
            // The V0's TypeScript 6 checks side-effect imports by default; the kit's TypeScript 5 is asked to.
            noUncheckedSideEffectImports: true,
            typeRoots: [path.dirname(path.dirname(require.resolve('@types/react/package.json')))],
            paths: { '@mjrp/admin-kit-core': [path.join(CORE, 'index.js')] },
        },
        include: [path.join(UI, '**/*.ts'), path.join(UI, '**/*.tsx')],
    };
    try {
        writeFileSync(path.join(dir, 'tsconfig.json'), JSON.stringify(config));
        const run = spawnSync(process.execPath, [path.join(path.dirname(require.resolve('typescript/package.json')), 'bin', 'tsc'), '-p', path.join(dir, 'tsconfig.json')], { encoding: 'utf8', cwd: KIT });
        assert.equal(run.status, 0, run.stdout + run.stderr);
    } finally {
        rmSync(dir, { recursive: true, force: true }); // the test made it, the test takes it away
    }
});
