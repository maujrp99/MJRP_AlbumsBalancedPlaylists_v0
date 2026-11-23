// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
// A lista de ordem fixa do kit (F158, TASK-04; S-173 R4, `^cms-kit-fixed-order`; o CMS profissional v33): as linhas da lista com criar,
// editar e remover, sem «+ Novo» e sem «Remover»; cada linha com a alça, ↑, ↓ (ícones de linha), o número da posição e o nome; uma frase
// diz o novo lugar de quem se moveu. O kit não sabe de seção nem de site profissional: o teste a usa num projeto que não é este
// (um cardápio) e confere a regra pura que a move.
// Trazido do MJRPpersonal (tests/admin-kit/order-list.test.mjs, c33a33a4) para o kit no harness (F332, TASK-08): a pasta do kit por parâmetro.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { installTsHooks } from './support/ts-hooks.mjs';

installTsHooks();
const ROOT = path.resolve(import.meta.dirname, '..');
const UI = path.resolve(ROOT, process.env.ADMIN_KIT_UI ?? 'ui');
const load = (file) => import(pathToFileURL(path.join(UI, file)).href);
const { KitContext } = await load('components/context.ts');
const { SectionView } = await load('components/SectionView.tsx');
const { elementsOf } = await load('schema.ts');
const { orderOf, withMovedId, changedKeys } = await load('values.ts');

const COURSES = ['starter', 'main', 'dessert'];
const NAMES = { starter: 'Entrada', main: 'Prato', dessert: 'Sobremesa' };
const order = {
    kind: 'order', id: 'courses', label: 'A ordem do cardápio', key: 'courses', initial: COURSES,
    row: (id, { order: now }) => ({ name: NAMES[id], number: String(now.indexOf(id) + 1).padStart(2, '0'), swatch: 'tomato', detail: `Serve em ${now.indexOf(id) + 1}º` }),
    moved: (id, { order: now }) => `${NAMES[id]} agora é a ${now.indexOf(id) + 1}ª.`,
};
const section = { id: 'menu', path: 'menu', title: 'Cardápio', blocks: [{ id: 'order', number: '1', title: 'Ordem', elements: [order] }] };
const schema = { name: 'Cardápio', languages: ['pt'], states: {}, sections: [section] };
const texts = new Proxy({ problems: {} }, { get: (target, key) => key === 'rich' ? undefined : { drag: 'Arrastar', moveUp: 'Subir', moveDown: 'Descer', remove: 'Remover' }[key] ?? target[key] ?? `«${String(key)}»` });
const ports = { texts, imageRule: () => '', hrefOf: (p) => `/kit/${p}`, signInHref: '/in' };
const draw = (values, saved = values) => renderToStaticMarkup(h(KitContext.Provider, { value: { schema, ports, language: 'pt', extensions: {}, problems: [], go: () => {}, saved } }, h(SectionView, { section, values, onChange: () => {} })));

test('a lista traz as linhas na ordem gravada, com a posição, o nome e o que a posição dá', () => {
    const html = draw({ courses: ['dessert', 'starter', 'main'] });
    assert.match(html, /<ol class="ak-ord-list" aria-label="A ordem do cardápio">/);
    assert.deepEqual([...html.matchAll(/data-order-id="([a-z]+)"/g)].map((m) => m[1]), ['dessert', 'starter', 'main']);
    assert.deepEqual([...html.matchAll(/data-position="[^"]*">([^<]*)</g)].map((m) => m[1]), ['01', '02', '03']);
    assert.deepEqual([...html.matchAll(/<b>([^<]+)<\/b>/g)].map((m) => m[1]), ['Sobremesa', 'Entrada', 'Prato']);
    assert.match(html, /<span class="ak-ord-sw" style="background:tomato"/);
    assert.match(html, /Serve em 1º/);
});

test('sem ordem gravada, a lista abre na ordem inicial do projeto', () => {
    const html = draw({});
    assert.deepEqual([...html.matchAll(/data-order-id="([a-z]+)"/g)].map((m) => m[1]), COURSES);
});

test('é uma lista de ordem fixa: sem «+ Novo», sem «Remover» e sem «Editar»', () => {
    const html = draw({});
    assert.doesNotMatch(html, /ak-add|\+ |Remover|«remove»|«edit»|ak-row-acts/);
    assert.doesNotMatch(html, /role="switch"/);
});

test('cada linha tem a alça, ↑ e ↓ com o nome da linha para o leitor de tela; a primeira não sobe e a última não desce', () => {
    const html = draw({});
    for (const name of Object.values(NAMES)) {
        assert.match(html, new RegExp(`aria-label="Arrastar: ${name}"`));
        assert.match(html, new RegExp(`aria-label="Subir: ${name}"`));
        assert.match(html, new RegExp(`aria-label="Descer: ${name}"`));
    }
    const rows = html.split('<li ').slice(1);
    assert.match(rows[0], /data-order="up"[^>]*disabled/);
    assert.doesNotMatch(rows[0], /data-order="down"[^>]*disabled/);
    assert.match(rows.at(-1), /data-order="down"[^>]*disabled/);
    assert.doesNotMatch(rows.at(-1), /data-order="up"[^>]*disabled/);
});

test('a alça e as setas são ícones de linha (SVG), não caracteres', () => {
    const html = draw({});
    assert.equal((html.match(/<svg /g) ?? []).length, 9, 'três por linha');
    const buttons = [...html.matchAll(/<button [^>]*data-order[^>]*>([\s\S]*?)<\/button>/g)].map((m) => m[1]);
    assert.equal(buttons.length, 9);
    for (const content of buttons) assert.match(content, /^<svg /);
    assert.doesNotMatch(html, /[↑↓⋮]/);
});

test('uma frase sob a lista diz o novo lugar, lida pelo leitor de tela', () => {
    assert.match(draw({}), /<p class="ak-ord-said" role="status" aria-live="polite">/);
});

test('as linhas que saíram do lugar gravado ficam marcadas, e sem mudança nenhuma fica marcada', () => {
    const html = draw({ courses: ['main', 'starter', 'dessert'] }, { courses: COURSES });
    const rows = html.split('<li ').slice(1);
    assert.match(rows[0], /class="[^"]*\bmoved\b/);
    assert.match(rows[1], /class="[^"]*\bmoved\b/);
    assert.doesNotMatch(rows[2], /\bmoved\b/);
    assert.doesNotMatch(draw({ courses: COURSES }), /\bmoved\b/);
});

test('a linha que o projeto diz que está fora leva a etiqueta, fica esmaecida e continua com os controles', () => {
    const outOf = { ...order, row: (id) => (id === 'dessert' ? { name: 'Sobremesa', number: null, detail: '', tag: 'Fora do cardápio' } : { name: NAMES[id], number: '01', detail: 'x' }) };
    const out = { ...section, blocks: [{ ...section.blocks[0], elements: [outOf] }] };
    const html = renderToStaticMarkup(h(KitContext.Provider, { value: { schema: { ...schema, sections: [out] }, ports, language: 'pt', extensions: {}, problems: [], go: () => {} } }, h(SectionView, { section: out, values: {}, onChange: () => {} })));
    const row = html.split('<li ').slice(1).at(-1);
    assert.match(row, /class="[^"]*\boff\b/);
    assert.match(row, /<span class="ak-ord-tag">[\s\S]*Fora do cardápio/);
    assert.match(row, />—</);
    assert.match(row, /data-order="up"/);
});

test('a ordem lida do conteúdo é limpa: repetida e estranha saem, faltando vai ao fim na ordem inicial', () => {
    assert.deepEqual(orderOf({ courses: ['main', 'main', 'x', 'dessert'] }, 'courses', COURSES), ['main', 'dessert', 'starter']);
    assert.deepEqual(orderOf({}, 'courses', COURSES), COURSES);
    assert.deepEqual(orderOf({ courses: 'main' }, 'courses', COURSES), COURSES);
});

test('mover uma linha grava a ordem inteira, sem mexer no resto, e os limites seguram', () => {
    const values = { title: { pt: 'A' }, courses: COURSES };
    assert.deepEqual(withMovedId(values, 'courses', COURSES, 2, 0), { title: { pt: 'A' }, courses: ['dessert', 'starter', 'main'] });
    assert.deepEqual(withMovedId(values, 'courses', COURSES, 0, 1).courses, ['main', 'starter', 'dessert']);
    assert.deepEqual(withMovedId(values, 'courses', COURSES, 0, 9).courses, ['main', 'dessert', 'starter'], 'clampa no fim');
    assert.equal(withMovedId(values, 'courses', COURSES, 7, 0), values, 'uma posição que não existe não muda nada');
    // Sem ordem gravada, o primeiro movimento grava a lista inteira (a de partida, já movida).
    assert.deepEqual(withMovedId({}, 'courses', COURSES, 1, 0).courses, ['main', 'starter', 'dessert']);
});

test('mover conta como uma alteração sem salvar', () => {
    const before = { courses: COURSES };
    assert.deepEqual(changedKeys(before, withMovedId(before, 'courses', COURSES, 0, 1)), ['courses']);
    assert.deepEqual(changedKeys(before, withMovedId(withMovedId(before, 'courses', COURSES, 0, 1), 'courses', COURSES, 1, 0)), []);
});

test('o kit não conhece seção nem o site profissional, e a lista não entra nos campos da validação', () => {
    const source = readFileSync(path.join(UI, 'components', 'OrderList.tsx'), 'utf8'); // the kit's folder by parameter: in a project too
    assert.doesNotMatch(source, /about|portfolio|testimonials|professional|Mauctus|névoa|vinho/i);
    assert.deepEqual(elementsOf(section.blocks), [], 'elementsOf deixa a lista de ordem de fora, como as notas');
});
