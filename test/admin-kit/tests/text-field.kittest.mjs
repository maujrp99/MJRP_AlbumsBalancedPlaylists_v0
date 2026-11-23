// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
// O campo de texto padrão do kit (F135, REQ-01): o par de chaves soltas (`synopsis`/`synopsis_en`) lido e escrito pelo
// `FieldInput` e pelo `TextField`, com as abas dos idiomas e o «Traduzir» nos dois sentidos. Nenhuma chamada paga: a porta é simulada.
// Trazido do MJRPpersonal (tests/admin-kit/text-field.test.mjs, c33a33a4) para o kit no harness (F332, TASK-08): a pasta do kit por parâmetro.
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
const kit = await load('index.ts');
const { TextField } = await load('components/TextField.tsx');

const t = {
    languages: { pt: 'português', en: 'inglês' }, from: 'Traduzir do {language}', busy: 'Traduzindo…', nothing: 'Sem texto em {language} para traduzir',
    original: 'Original em {language}', suggestion: 'Sugestão em {language}', replaces: 'Troca o texto.', overLimit: 'Passa {count}.',
    failed: 'Não deu: {reason}.', reasons: { service: 's', session: 'x', credit: 'c' }, accept: 'Aceitar', discard: 'Descartar', again: 'De novo', retry: 'Tentar', review: 'Revisar',
};
const run = async () => ({ ok: true, value: 'x' });

test('o par de chaves soltas: lê e grava cada idioma na sua chave, sem tocar na outra', () => {
    const pair = { pt: 'synopsis', en: 'synopsis_en' };
    const values = { synopsis: 'Um.', synopsis_en: 'One.', title: 'T' };
    assert.equal(kit.pairText(values, pair, 'pt'), 'Um.');
    assert.equal(kit.pairText(values, pair, 'en'), 'One.');
    assert.equal(kit.pairText({}, pair, 'en'), '');
    assert.deepEqual(kit.withPairText(values, pair, 'en', 'Two.'), { synopsis: 'Um.', synopsis_en: 'Two.', title: 'T' });
});

test('bilíngue: as abas dos idiomas, a aba vazia marcada e «Traduzir do português» na aba em inglês', () => {
    const html = renderToStaticMarkup(h(TextField, { label: 'Sinopse', kind: 'long', languages: ['pt', 'en'], initial: 'en', values: { pt: 'Um texto.', en: '' }, onChange() {}, translate: { run, t } }));
    assert.match(html, /role="tablist"/);
    // The kit's own words are English since F332 (TASK-04): «empty» and the paragraph hint; the language names come from `t`.
    assert.match(html, /aria-label="inglês, empty"/);
    assert.match(html, /Traduzir do português/);
    assert.match(html, /a single break stays/, 'a dica de parágrafo (^cms-text-paragraphs)');
});

test('os dois sentidos: na aba em português, com texto só em inglês, oferece «Traduzir do inglês»', () => {
    const html = renderToStaticMarkup(h(TextField, { label: 'Sinopse', kind: 'rich', languages: ['pt', 'en'], initial: 'pt', values: { pt: '', en: 'One.' }, onChange() {}, translate: { run, t } }));
    assert.match(html, /Traduzir do inglês/);
});

test('um idioma só: sem abas e sem «Traduzir»; curto é um campo de texto simples', () => {
    const html = renderToStaticMarkup(h(TextField, { label: 'Autor', kind: 'short', languages: ['pt'], values: { pt: 'Alguém' }, onChange() {}, translate: { run, t } }));
    assert.doesNotMatch(html, /tablist|Traduzir/);
    assert.match(html, /<input[^>]*value="Alguém"/);
});
