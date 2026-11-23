// cópia carimbada do kit do admin do MJRP Harness · admin-kit v0.9.0 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
// F125, S-151: a peça do obrigatório do kit (o kit v1, aprovado pelo MJRP em 2026-11-17 no CMS profissional v30 e no do Jardim v30),
// desenhada pelo React no servidor: o * preso à última palavra (UAT-262), a legenda, o campo que falta com a borda e a frase, e o
// aviso «Falta preencher: …. Nada foi gravado.» com um botão por campo.
// Trazido do MJRPpersonal (tests/admin-kit/required-piece.test.mjs, c33a33a4) para o kit no harness (F332, TASK-08): a pasta do kit por parâmetro.
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
const { MissingNotice, RequiredLegend, RequiredName } = await load('components/Required.tsx');
const { EXAMPLE_SCHEMA: schema } = await load('example/example-schema.ts');

const required = {
    legend: 'obrigatório: não salva vazio', rest: 'Os outros, vazios, somem do site com o que depende deles',
    missing: 'Falta preencher:', nothingSaved: 'Nada foi gravado.',
    field: 'Obrigatório: sem este texto, o site não mostra esta parte.', fieldEn: 'Obrigatório em inglês: sem este texto, o site em inglês não mostra esta parte.',
    notSaved: 'Não salvou',
};
const texts = new Proxy({ problems: {}, required }, { get: (target, key) => key === 'rich' ? undefined : target[key] ?? `«${String(key)}»` });
const ports = { texts, imageRule: (slot) => `rule of ${slot}`, hrefOf: (p) => `/kit/${p}`, signInHref: '/in' };
const draw = (element, { language = 'en', problems = [] } = {}) =>
    renderToStaticMarkup(h(KitContext.Provider, { value: { schema, ports, language, extensions: {}, problems, go: () => {} } }, element));

test('o * fica preso à última palavra do nome: nunca cai sozinho na linha (UAT-262)', () => {
    const html = renderToStaticMarkup(h(RequiredName, { text: 'Nome da empresa', required: true }));
    assert.equal(html, '<span class="rq-name">Nome da <span class="rq-last">empresa<span class="ak-req" aria-hidden="true">*</span></span></span>');
    assert.equal(renderToStaticMarkup(h(RequiredName, { text: 'Etiqueta' })), 'Etiqueta', 'o opcional, sem *');
});

test('a legenda diz o que o * quer dizer e o que acontece com o resto', () => {
    const html = renderToStaticMarkup(h(RequiredLegend, { t: required }));
    assert.equal(html, '<p class="rq-legend"><span><b>*</b> obrigatório: não salva vazio</span><span>Os outros, vazios, somem do site com o que depende deles</span></p>');
});

test('o aviso: os nomes, «Nada foi gravado.», e um botão por campo, com o idioma', () => {
    const items = [{ id: 'akf-company', label: 'Nome da empresa', lang: 'pt' }, { id: 'akf-nav_about', label: 'Sobre, no menu', lang: 'en' }];
    const html = renderToStaticMarkup(h(MissingNotice, { items, t: required, onGo: () => {} }));
    assert.match(html, /^<div class="rq-miss" role="alert">/);
    assert.match(html, /<p><b>Falta preencher:<\/b> Nome da empresa, Sobre, no menu \(EN\)\. <b>Nada foi gravado\.<\/b><\/p>/);
    assert.match(html, /<a href="#akf-company">Nome da empresa<i>PT<\/i><\/a>/);
    assert.match(html, /<a href="#akf-nav_about">Sobre, no menu<i>EN<\/i><\/a>/);
    assert.equal(renderToStaticMarkup(h(MissingNotice, { items: [], t: required, onGo: () => {} })), '', 'sem falta, sem aviso');
});

test('o campo que falta, no idioma da tela: a borda, a frase do idioma e a âncora; no outro idioma, nada', () => {
    const content = { headline: { en: '', es: 'Buena comida' }, recipes: [] };
    const problems = [{ path: ['headline'], code: 'required', language: 'en' }];
    const html = draw(h(SectionView, { section: schema.sections[0], values: content, onChange: () => {} }), { language: 'en', problems });
    assert.match(html, /<div class="ak-f rq-bad" id="akf-headline">/);
    assert.match(html, /<span class="rq-msg" id="[^"]+-missing">Obrigatório em inglês: sem este texto, o site em inglês não mostra esta parte\.<\/span>/);
    assert.match(html, /aria-describedby="[^"]+-missing"/);
    const other = draw(h(SectionView, { section: schema.sections[0], values: content, onChange: () => {} }), { language: 'es', problems });
    assert.doesNotMatch(other, /rq-bad|rq-msg/);
});
