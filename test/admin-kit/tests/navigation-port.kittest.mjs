// cópia carimbada do kit do admin do MJRP Harness · admin-kit v0.9.0 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
// The kit navigates only through the port the project hands it (F332, REQ-01 and REQ-05; TASK-05): `KitPorts.navigation`
// says where the panel is, takes it somewhere and tells it when the place changed outside it. The kit never writes the
// browser's history nor the hash, nor listens to `popstate`/`hashchange`: the project's router owns them (the V0's
// `historyOwnedByRouter`). A jump to a block scrolls the screen and writes nothing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { installTsHooks } from './support/ts-hooks.mjs';
import { sourceFiles } from './support/source-text.mjs';

installTsHooks();
const UI = path.resolve(import.meta.dirname, '..', process.env.ADMIN_KIT_UI ?? 'ui');
const load = (file) => import(pathToFileURL(path.join(UI, file)).href);
const { KitApp } = await load('components/KitApp.tsx');
const { useKit } = await load('components/context.ts');
const { EXAMPLE_SCHEMA } = await load('example/example-schema.ts');
// The front page with its block in the menu (`subnav`), so the menu shows which block the place points to.
const schema = { ...EXAMPLE_SCHEMA, sections: EXAMPLE_SCHEMA.sections.map((section) => (section.id === 'front' ? { ...section, subnav: ['hero'] } : section)) };
const { memoryNavigation } = await load('example/example-navigation.ts');

const texts = new Proxy({ problems: {} }, { get: (target, key) => (key === 'rich' || key === 'required' ? undefined : target[key] ?? `«${String(key)}»`) });
const portsWith = (navigation) => ({
    texts, navigation, imageRule: (slot) => `rule of ${slot}`, hrefOf: (p, item) => `/kit/${p}${item ? `/${item}` : ''}`, signInHref: '/in',
    load: () => new Promise(() => {}), save: async () => ({ ok: true, value: { version: '1' } }),
});
const draw = (navigation, foot) => renderToStaticMarkup(h(KitApp, {
    schema, ports: portsWith(navigation), brand: { name: 'Cookbook', small: 'admin' }, group: 'Sections', foot,
    overview: { title: 'Overview', subtitle: 'All of it' }, tone: 'day', onTone: () => {},
}));

test('o código do kit não escreve o histórico nem o hash, e não ouve popstate nem hashchange', () => {
    const found = sourceFiles(UI).flatMap((file) => {
        const code = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
        const hits = code.match(/\bhistory\s*\.|['"](?:popstate|hashchange)['"]|\blocation\s*\.\s*(?:hash|pathname|href|assign|replace)\b/g) ?? [];
        return hits.map((hit) => `${path.relative(UI, file)}: ${hit}`);
    });
    assert.deepEqual(found, []);
});

test('a porta diz onde o painel está: a seção e o bloco marcados no menu vêm dela', () => {
    const html = draw(memoryNavigation({ path: 'front', block: 'blk-hero' }));
    assert.match(html, /<a href="\/kit\/front" aria-current="page"/);
    assert.match(html, /<a href="\/kit\/front#blk-hero" aria-current="location"/);
    const other = draw(memoryNavigation({ path: 'recipes' }));
    assert.match(other, /<a href="\/kit\/recipes" aria-current="page"/);
    assert.doesNotMatch(other, /aria-current="location"/);
});

test('trocar de seção e pular para um bloco passam só pela porta, sem tocar o histórico do navegador', () => {
    const trap = () => { throw new Error('o kit tocou o histórico do navegador'); };
    const saved = { ...globalThis };
    Object.assign(globalThis, {
        history: { pushState: trap, replaceState: trap, back: trap },
        requestAnimationFrame: (callback) => { callback(0); return 1; },
        scrollTo: () => {},
        document: { getElementById: () => null, querySelector: () => null },
    });
    try {
        const navigation = memoryNavigation({ path: 'front' });
        let go;
        const Grab = () => { go = useKit().go; return null; };
        draw(navigation, h(Grab));
        go('recipes');
        go('recipes', undefined, 'blk-list');
        go('recipe', 'a');
        assert.deepEqual(navigation.moves, [
            { target: { path: 'recipes' }, replace: false },
            { target: { path: 'recipes', block: 'blk-list' }, replace: false },
            { target: { path: 'recipe', itemId: 'a' }, replace: false },
        ]);
        assert.deepEqual(navigation.where(), { path: 'recipe', itemId: 'a' });
    } finally {
        for (const key of ['history', 'requestAnimationFrame', 'scrollTo', 'document']) {
            if (key in saved) globalThis[key] = saved[key]; else delete globalThis[key];
        }
    }
});

test('a porta de teste do exemplo avisa quem ouve e para de avisar quem saiu', () => {
    const navigation = memoryNavigation({ path: '' });
    const heard = [];
    const stop = navigation.listen(() => heard.push(navigation.where().path));
    navigation.go({ path: 'front' });
    navigation.back();
    stop();
    navigation.go({ path: 'recipes' }, { replace: true });
    assert.deepEqual(heard, ['front', '']);
    assert.deepEqual(navigation.where(), { path: 'recipes' });
});
