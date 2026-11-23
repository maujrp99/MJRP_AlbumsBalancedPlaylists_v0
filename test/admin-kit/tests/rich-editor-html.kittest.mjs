// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
// The editor's HTML, both ways, compared with what the 1.0.0 gave (F332 slice 1b, TASK-28): the document drawn for the field
// (`toEditorHtml`, `mediaHtml`) and the DOM read back into the document (`fromEditor`), so splitting those functions changes
// nothing an author sees or saves. `node tests/rich-editor-html.kittest.mjs --write` records the portrait again — only when a
// change of behaviour is the intent.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { installTsHooks } from './support/ts-hooks.mjs';
import { parseHtml } from './support/mini-dom.mjs';
import { BOOKS, HTML, MARKDOWN, MEDIA, WORDS } from './support/editor-html.samples.mjs';

installTsHooks();
const UI = path.resolve(import.meta.dirname, '..', process.env.ADMIN_KIT_UI ?? 'ui');
const load = (file) => import(pathToFileURL(path.join(UI, file)).href);
const { toEditorHtml, mediaHtml, fromEditor } = await load('rich/editor-html.ts');
const { parseRich, toMarkdown } = await load('index.ts');
const EXPECTED = path.join(import.meta.dirname, 'support', 'editor-html.expected.json');

const portrait = () => ({
    drawn: MARKDOWN.map((text) => toEditorHtml(parseRich(text), WORDS, BOOKS)),
    drawnWithoutShelf: MARKDOWN.map((text) => toEditorHtml(parseRich(text), WORDS)),
    media: MEDIA.map((block) => mediaHtml(block, WORDS, BOOKS)),
    read: HTML.map((html) => fromEditor(parseHtml(html))),
    // The whole way round: what the field shows of a text, read back, is the text.
    round: MARKDOWN.map((text) => toMarkdown(fromEditor(parseHtml(toEditorHtml(parseRich(text), WORDS, BOOKS))))),
});

if (process.argv.includes('--write')) writeFileSync(EXPECTED, `${JSON.stringify(portrait(), null, 1)}\n`);
const expected = JSON.parse(readFileSync(EXPECTED, 'utf8'));
const now = JSON.parse(JSON.stringify(portrait()));

test('o documento desenhado para o campo é o da 1.0.0, com e sem a estante', () => {
    MARKDOWN.forEach((text, index) => {
        assert.equal(now.drawn[index], expected.drawn[index], text);
        assert.equal(now.drawnWithoutShelf[index], expected.drawnWithoutShelf[index], text);
    });
    assert.equal(now.drawn[0], '<p><br></p>', 'o campo vazio tem um parágrafo para o cursor');
});

test('cada mídia desenhada é a da 1.0.0, e o que não é mídia não desenha nada', () => {
    MEDIA.forEach((block, index) => assert.equal(now.media[index], expected.media[index], JSON.stringify(block)));
    assert.equal(now.media[0], '');
    assert.equal(now.media[1], '');
});

test('o DOM lido de volta dá o documento da 1.0.0, no que o navegador, a colagem e o próprio editor deixam', () => {
    assert.equal(expected.read.length, HTML.length);
    HTML.forEach((html, index) => assert.deepEqual(now.read[index], expected.read[index], html));
});

test('a volta inteira: o que o campo mostra de um texto, lido de volta, é o texto (o tamanho da letra fica)', () => {
    MARKDOWN.forEach((text, index) => assert.equal(now.round[index], expected.round[index], text));
    assert.equal(now.round[3], 'um [grande]{.large}, **[forte e enorme]{.xlarge}** e [pequeno]{.small}');
    assert.equal(toMarkdown(fromEditor(parseHtml('<p>a <span data-size="large">b</span> c</p>'))), 'a [b]{.large} c');
});
