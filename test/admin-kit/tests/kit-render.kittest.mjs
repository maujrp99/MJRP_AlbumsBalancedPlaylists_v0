// cópia carimbada do kit do admin do MJRP Harness · admin-kit v0.9.0 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
// O kit monta as telas de um projeto que não é este (F75, TASK-01 e TASK-03; S-112, `^admin-kit-screen`): o esquema e
// as portas de um livro de receitas, em inglês e espanhol, desenhados pelo React no servidor, sem nada do MJRP.
// Trazido do MJRPpersonal (tests/admin-kit/kit-render.test.mjs, c33a33a4) para o kit no harness (F332, TASK-08): a pasta do kit por parâmetro.
import { test } from 'node:test';
import assert from 'node:assert/strict';
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
const { SiteMap } = await load('components/SiteMap.tsx');
const { EXAMPLE_SCHEMA: schema } = await load('example/example-schema.ts');

const texts = new Proxy({ problems: {}, onPage: 'On the page · {title}', sectionCount: '{fields} fields · {states}' }, { get: (target, key) => key === 'rich' ? undefined : target[key] ?? `«${String(key)}»` });
const ports = { texts, imageRule: (slot) => `rule of ${slot}`, hrefOf: (p, item) => `/kit/${p}${item ? `/${item}` : ''}`, signInHref: '/in' };

function draw(element, { language = 'en', problems = [] } = {}) {
    return renderToStaticMarkup(h(KitContext.Provider, { value: { schema, ports, language, extensions: {}, problems, go: () => {} } }, element));
}

const content = {
    headline: { en: 'Good food', es: '', state: 'ok' },
    recipes: [
        { id: 'a', live: true, name: { en: 'Soup' }, time: '20 min' },
        { id: 'b', live: false, name: { en: 'Bread' } },
        { id: 'c', live: true, name: { en: 'Cake' }, style: 'quick', steps: [{ id: 's', text: { en: 'Mix' } }] },
    ],
};

test('uma seção: o bloco numerado, o campo com o rótulo, a chave e o selo do estado, e «Onde aparece»', () => {
    const html = draw(h(SectionView, { section: schema.sections[0], values: content, onChange: () => {} }));
    assert.match(html, /class="ak-num">1</);
    // O obrigatório leva * preso à última palavra do rótulo (F125, o kit v1; UAT-262), e o campo diz que é obrigatório ao leitor de tela.
    assert.match(html, /<span class="rq-name"><span class="rq-last">Headline<span class="ak-req" aria-hidden="true">\*<\/span><\/span><\/span><span class="ak-badge accent">checked<\/span><span class="ak-key">headline<\/span>/);
    assert.match(html, /<div class="ak-f" id="akf-headline">/, 'a âncora a que o aviso leva');
    assert.match(html, /aria-required="true"[^>]*value="Good food"/);
    assert.match(html, /Intro<span class="ak-key">intro<\/span>/, 'o opcional, sem *');
    assert.match(html, /value="Good food"/);
    assert.match(html, /Hero: <strong>Good food<\/strong>/);
    assert.match(html, /rule of cover/);
});

test('em espanhol, o campo sem tradução diz isso', () => {
    const html = draw(h(SectionView, { section: schema.sections[0], values: content, onChange: () => {} }), { language: 'es' });
    assert.match(html, /«untranslated»/);
});

test('a lista: a posição só conta quem está no ar, o interruptor é um switch, e «Na página» só tem os do ar, na ordem', () => {
    const html = draw(h(SectionView, { section: schema.sections[1], values: content, onChange: () => {} }));
    assert.deepEqual([...html.matchAll(/data-position="[^"]*">([^<]*)</g)].map((m) => m[1]), ['01', '—', '02']);
    assert.equal((html.match(/role="switch"/g) ?? []).length, 3);
    assert.match(html, /On the page · Recipes/);
    const preview = html.slice(html.indexOf('ak-preview'));
    assert.ok(preview.indexOf('Soup') < preview.indexOf('Cake') && !preview.includes('Bread'));
    assert.doesNotMatch(html, /\+ New recipe/, 'a lista está no máximo (3)');
});

test('a página de um item mostra a barra de passos do modelo escolhido e os seus blocos', () => {
    const html = draw(h(SectionView, { section: schema.sections[2], values: content, onChange: () => {}, itemId: 'c' }));
    assert.match(html, /class="ak-steps"/);
    assert.deepEqual([...html.matchAll(/href="#blk-([a-z]+)"/g)].map((m) => m[1]), ['style', 'steps']);
    assert.match(html, /\+ New step/);
});

test('o mapa: uma linha por seção visível, com a contagem e os estados', () => {
    const html = draw(h(SiteMap, { values: content }));
    assert.equal((html.match(/class="ak-map-row"/g) ?? []).length, 2);
    assert.match(html, /2 fields · 1 checked/);
});

test('a gravação do kit (F87): uma peça do projeto grava pela porta, com a versão lida, e o botão «Salvar» faz o mesmo', async () => {
    const { saveValues } = await load('save.ts');
    const calls = [];
    const savingPorts = { ...ports, save: async (values, version) => { calls.push({ values, version }); return { ok: true, value: { version: 'v2' } }; } };
    const next = { headline: { en: 'Good food', es: 'Buena comida', state: 'ok' }, recipes: [{ id: 'a', fresh: true, live: true, name: { en: 'Soup' } }] };
    const outcome = await saveValues(schema, savingPorts, next, 'v1');
    assert.equal(outcome.ok, true);
    assert.equal(outcome.version, 'v2');
    assert.deepEqual(calls.map((call) => call.version), ['v1']);
    assert.equal(JSON.stringify(calls[0].values).includes('fresh'), false, 'a marca «novo» não vai para o conteúdo');
    assert.equal(JSON.stringify(outcome.clean), JSON.stringify(calls[0].values));
});

test('a gravação do kit: a falha da porta volta com o nome dela, e uma regra quebrada não chama a porta', async () => {
    const { saveValues } = await load('save.ts');
    let called = 0;
    const failing = { ...ports, save: async () => { called++; return { ok: false, failure: 'conflict', message: 'outra versão' }; } };
    const refused = await saveValues(schema, failing, { headline: { en: 'Good food', state: 'ok' }, recipes: [] }, 'v1');
    assert.deepEqual([refused.ok, refused.reason, refused.failure, refused.message], [false, 'failed', 'conflict', 'outra versão']);
    assert.equal(called, 1);
    const invalid = await saveValues(schema, failing, { headline: { en: '' }, recipes: [{ id: 'z', live: true, name: { en: '' } }] }, 'v1');
    if (!invalid.ok && invalid.reason === 'invalid') assert.ok(invalid.problems.length > 0);
    else assert.equal(called, 2, 'o esquema de exemplo não tem campo obrigatório vazio aqui: a porta foi chamada');
});

test('uma peça do projeto recebe o conteúdo gravado, o aviso de alterações e a gravação (F87), e a peça antiga segue igual', async () => {
    const { ElementView } = await load('components/ElementView.tsx');
    const seen = [];
    const extensions = { piece: (props) => { seen.push(props); return h('i', null, 'peça'); }, old: ({ values }) => h('b', null, String(Object.keys(values).length)) };
    const saved = { headline: { en: 'Saved' } };
    const save = async () => true;
    const view = (id, value) => renderToStaticMarkup(h(KitContext.Provider, { value }, h(ElementView, { element: { kind: 'custom', id }, values: { a: 1, b: 2 }, onChange: () => {}, at: [] })));
    const full = { schema, ports, language: 'en', extensions, problems: [], go: () => {}, saved, dirty: true, save };
    assert.equal(view('piece', full), '<i>peça</i>');
    assert.equal(seen[0].saved, saved);
    assert.equal(seen[0].dirty, true);
    assert.equal(seen[0].save, save);
    assert.equal(view('old', full), '<b>2</b>');
    // Um painel que não dá as três coisas (o contexto antigo) segue funcionando: o gravado é o conteúdo, sem alteração, e gravar diz não.
    view('piece', { schema, ports, language: 'en', extensions, problems: [], go: () => {} });
    assert.deepEqual(seen[1].saved, { a: 1, b: 2 });
    assert.equal(seen[1].dirty, false);
    assert.equal(await seen[1].save({}), false);
});

test('o espaço de imagem com as palavras do projeto diz «Logo atual» até um envio e «Em uso no topo do site.» depois, e sem elas fica com as do ícone (F122, REQ-01)', async () => {
    const { ElementView } = await load('components/ElementView.tsx');
    const standard = { src: '/icons/atual.png', text: 'O de hoje.' };
    const words = { title: 'Logo atual', upload: 'Enviar outro logo', replace: 'Trocar imagem', inUse: 'Em uso no topo do site.', pending: 'Falta salvar.', newMark: 'novo', stays: 'O logo atual continua.', sentNote: 'Imagem enviada.' };
    const element = { kind: 'image', id: 'header-logo', label: 'Logo no topo', key: 'header-logo', slot: 'header-logo', wide: true, buildNote: true, standard, words };
    const html = (el, values) => draw(h(ElementView, { element: el, values, onChange: () => {}, at: [] }));

    const before = html(element, {});
    assert.match(before, /Logo no topo/);
    assert.match(before, /<span class="ak-key">header-logo<\/span>/);
    assert.match(before, /class="ak-img-thumb wide"/);
    assert.match(before, /src="\/icons\/atual\.png"/);
    assert.match(before, /<b>Logo atual<\/b>/);
    assert.match(before, /O de hoje\./);
    assert.match(before, />Enviar outro logo</);
    assert.match(before, /rule of header-logo/);
    assert.doesNotMatch(before, /Voltar ao padrão|«backToStandard»/);

    const sent = html(element, { 'header-logo': { src: '/media/pro/header/1-logo-mauctus.png', width: 316, height: 98, bytes: 6107 } });
    assert.match(sent, /<b>logo-mauctus\.png<\/b>/);
    assert.match(sent, /Em uso no topo do site\./);
    assert.match(sent, />Trocar imagem</);
    assert.match(sent, /«backToStandard»/, 'o botão de voltar ao padrão é o texto da porta');
    assert.match(sent, /«measure»/, 'a medida do arquivo aparece');

    const plain = html({ ...element, words: undefined, wide: undefined }, {});
    assert.match(plain, /«standardTitle»/);
    assert.match(plain, /«uploadIcon»/);
    assert.doesNotMatch(plain, /ak-key|ak-img-thumb wide/);
});
