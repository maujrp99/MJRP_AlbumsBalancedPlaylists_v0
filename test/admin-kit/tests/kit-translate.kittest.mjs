// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
// A tradução nas duas vias no kit do admin (F96, S-128): a regra de origem e destino e a peça, sem nada deste projeto.
// Trazido do MJRPpersonal (tests/admin-kit/kit-translate.test.mjs, c33a33a4) para o kit no harness (F332, TASK-08): a pasta do kit por parâmetro.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { installTsHooks } from './support/ts-hooks.mjs';

installTsHooks();
const ROOT = path.resolve(import.meta.dirname, '..');
const UI = path.resolve(ROOT, process.env.ADMIN_KIT_UI ?? 'ui');
const kit = await import(pathToFileURL(path.join(UI, 'index.ts')).href);

test('a rota: o destino é o idioma aberto, e a origem é o outro que tem texto (S-128 R3)', () => {
    const languages = ['pt', 'en'];
    assert.deepEqual(kit.translationRoute({ pt: 'Olá', en: '' }, languages, 'en'), { from: 'pt', to: 'en' });
    assert.deepEqual(kit.translationRoute({ pt: '', en: 'Hello' }, languages, 'pt'), { from: 'en', to: 'pt' });
    // os dois com texto: traduz para o idioma aberto, que o autor escolhe ao trocar de idioma
    assert.deepEqual(kit.translationRoute({ pt: 'Olá', en: 'Hi' }, languages, 'en'), { from: 'pt', to: 'en' });
    assert.deepEqual(kit.translationRoute({ pt: 'Olá', en: 'Hi' }, languages, 'pt'), { from: 'en', to: 'pt' });
});

test('a rota: sem texto em outro idioma, não há o que traduzir', () => {
    assert.equal(kit.translationRoute({ pt: '', en: '' }, ['pt', 'en'], 'en'), null);
    assert.equal(kit.translationRoute({ pt: '   ', en: '' }, ['pt', 'en'], 'en'), null);
    assert.equal(kit.translationRoute({ pt: 'só o aberto', en: '' }, ['pt', 'en'], 'pt'), null);
});

test('a rota: com mais de dois idiomas, a origem é o primeiro do esquema que tem texto', () => {
    assert.deepEqual(kit.translationRoute({ en: '', es: 'Hola', fr: 'Salut' }, ['en', 'es', 'fr'], 'en'), { from: 'es', to: 'en' });
});

// ─── a peça no campo (R1): a ação aparece onde há texto por idioma e a porta, e em mais lugar nenhum ───
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const load = (file) => import(pathToFileURL(path.join(UI, file)).href);
const { KitContext } = await load('components/context.ts');
const { FieldInput } = await load('components/inputs.tsx');
const { TranslateField } = await load('components/TranslateField.tsx');
const { EXAMPLE_SCHEMA: schema } = await import('./example/example-schema.mjs');

const translateTexts = {
    languages: { en: 'English', es: 'Spanish' }, from: 'Translate from {language}', busy: 'Translating…', nothing: 'No text in {language} to translate',
    original: 'Original in {language}', suggestion: 'Suggestion in {language}', replaces: 'Accepting replaces the text.', overLimit: 'Over by {count}.',
    failed: 'Could not translate: {reason}.', reasons: { service: 'service down', session: 'session over', credit: 'credit over' },
    accept: 'Accept', discard: 'Discard', again: 'Again', retry: 'Retry', review: 'Review',
};
const base = new Proxy({ problems: {} }, { get: (target, key) => key === 'rich' ? undefined : target[key] ?? `«${String(key)}»` });
const translate = async () => ({ ok: true, value: 'x' });
const withPort = { texts: { ...base, translate: translateTexts }, imageRule: () => '', hrefOf: () => '', signInHref: '/in', translate };
const withoutPort = { ...withPort, translate: undefined };
const withoutTexts = { ...withPort, texts: { problems: {} } };
const draw = (element, ports, values, language = 'es') => renderToStaticMarkup(h(KitContext.Provider, { value: { schema, ports, language, extensions: {}, problems: [], go: () => {} } },
    h(FieldInput, { element, values, onChange: () => {}, at: [] })));
const field = (id) => schema.sections[0].blocks.flatMap((b) => b.elements).find((e) => e.id === id);
const recipe = schema.sections[1].blocks[0].elements[0].fields;

test('o campo curto e o longo, com texto no outro idioma, oferecem «Traduzir do …» no idioma aberto (R1)', () => {
    const html = draw(field('headline'), withPort, { headline: { en: 'Good food', es: '' } });
    assert.match(html, /Translate from English/);
    assert.match(draw(field('intro'), withPort, { intro: { en: 'Hello', es: '' } }), /Translate from English/);
    assert.match(draw(field('headline'), withPort, { headline: { en: '', es: 'Buena comida' } }, 'en'), /Translate from Spanish/);
});

test('os dois com texto: a ação segue oferecida, para o idioma aberto (R3)', () => {
    assert.match(draw(field('headline'), withPort, { headline: { en: 'Good food', es: 'Buena comida' } }), /Translate from English/);
});

test('sem texto em outro idioma, o campo diz que não há o que traduzir, e não oferece o botão', () => {
    const html = draw(field('headline'), withPort, { headline: { en: '', es: '' } });
    assert.doesNotMatch(html, /Translate from/);
    assert.match(html, /No text in English to translate/);
});

test('valor único, sem a porta ou sem as palavras: nenhuma ação (R1)', () => {
    const single = recipe.find((e) => e.id === 'time');
    assert.doesNotMatch(draw(single, withPort, { time: '20 min' }), /Translate from|No text in/);
    assert.doesNotMatch(draw(field('headline'), withoutPort, { headline: { en: 'Good', es: '' } }), /Translate from/);
    assert.doesNotMatch(draw(field('headline'), withoutTexts, { headline: { en: 'Good', es: '' } }), /Translate from/);
});

test('link e número não oferecem a ação (R1)', () => {
    for (const type of ['link', 'number']) {
        const html = draw({ kind: 'field', id: 'x', label: 'X', key: 'x', type }, withPort, { x: { en: 'https://a.b', es: '' } });
        assert.doesNotMatch(html, /Translate from|No text in/);
    }
});

test('a peça sozinha: sem origem, nada a oferecer; com origem, o botão com a direção', () => {
    const props = { languages: ['en', 'es'], onScreen: 'es', translate, t: translateTexts, onAccept: () => {} };
    assert.match(renderToStaticMarkup(h(TranslateField, { ...props, texts: { en: 'Hi', es: '' } })), /Translate from English/);
    assert.match(renderToStaticMarkup(h(TranslateField, { ...props, texts: { en: '', es: '' } })), /No text in English/);
    // F135: o campo com texto e sem origem também diz que não há o que traduzir, para nenhum campo bilíngue ficar mudo.
    assert.match(renderToStaticMarkup(h(TranslateField, { ...props, texts: { en: '', es: 'Hola' } })), /No text in English/);
});
