// cópia carimbada do kit do admin do MJRP Harness · admin-kit v0.9.0 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
// O campo de texto do kit (F128, REQ-02 a REQ-04): o texto simples longo aceita Enter e diz que a linha em branco vira
// parágrafo; o curto segue numa linha; o rico traz a barra inteira do `rich-text-v2` aprovado, cada botão com nome,
// atalho e o que faz, e o texto gravado desenhado no campo. Desenhado pelo React no servidor, num esquema que não é do MJRP.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { installTsHooks } from './support/ts-hooks.mjs';

// Trazido do MJRPpersonal (tests/admin-kit/rich-text-field.test.mjs, c33a33a4); a pasta do kit por parâmetro (`ADMIN_KIT_UI`).
installTsHooks();
const UI = path.resolve(import.meta.dirname, '..', process.env.ADMIN_KIT_UI ?? 'ui');
const load = (file) => import(pathToFileURL(path.join(UI, file)).href);
const { KitContext } = await load('components/context.ts');
const { SectionView } = await load('components/SectionView.tsx');
const { RichTextField } = await load('components/RichTextField.tsx');
const { RICH_TOOLS, RICH_TEXTS_EN } = await load('rich/tools.ts');

const schema = {
    name: 'Cookbook', languages: ['en', 'es'], states: {},
    sections: [{ id: 's', path: 's', title: 'Story', blocks: [{ id: 'b', title: 'Story', elements: [
        { kind: 'field', id: 'title', label: 'Title', key: 'title', type: 'short' },
        { kind: 'field', id: 'intro', label: 'Intro', key: 'intro', type: 'long' },
        { kind: 'field', id: 'story', label: 'The story', key: 'story', type: 'rich' },
    ] }] }],
};
const texts = new Proxy({ problems: {}, paragraphsHint: 'A blank line is a paragraph.' }, { get: (target, key) => (key === 'rich' ? undefined : target[key] ?? `«${String(key)}»`) });
const ports = { texts, imageRule: (slot) => `rule of ${slot}`, hrefOf: () => '/', signInHref: '/in', richText: { imageSlot: 'text' }, checkImage: async () => ({ ok: true }), uploadImage: async () => ({ ok: true, value: { src: '/a.jpg' } }) };
const draw = (values) => renderToStaticMarkup(h(KitContext.Provider, { value: { schema, ports, language: 'en', extensions: {}, problems: [], go: () => {} } },
    h(SectionView, { section: schema.sections[0], values, onChange: () => {} })));

test('o curto segue numa linha; o longo é o campo rico com a dica do parágrafo (REQ-02; F135: o longo sem limite é rico)', () => {
    const html = draw({ title: { en: 'Soup' }, intro: { en: 'One\n\nTwo' }, story: { en: '' } });
    assert.match(html, /<input[^>]*type="text"[^>]*value="Soup"/);
    assert.match(html, /class="ak-rt-body"[^>]*>/);
    assert.match(html, /A blank line is a paragraph\./);
    assert.doesNotMatch(html, /<textarea/, 'sem limite, o longo não é caixa simples');
});

test('o rico traz a barra inteira, na ordem do protótipo, cada botão com nome e atalho (REQ-03, REQ-04)', () => {
    const html = renderToStaticMarkup(h(RichTextField, { label: 'A história', value: '', onChange: () => {} }));
    const buttons = [...html.matchAll(/<button type="button"[^>]*data-cmd="([a-z]+)"[^>]*aria-label="([^"]+)"/g)].map((m) => [m[1], m[2]]);
    assert.deepEqual(buttons.map(([id]) => id), RICH_TOOLS.map((tool) => tool.id));
    assert.equal(buttons.length, 22);
    const label = Object.fromEntries(buttons);
    // The kit's own words are English since F332 (TASK-04); a project hands its own through `texts`.
    assert.equal(label.bold, 'Bold (⌘B)');
    assert.equal(label.link, 'Link (⌘K)');
    assert.equal(label.quote, 'Quote (⇧⌘9)');
    assert.equal(label.plus, 'Insert (/)');
    assert.equal(label.img, 'Image');
    for (const tool of RICH_TOOLS) assert.ok(RICH_TEXTS_EN.tools[tool.id].name, `nome de ${tool.id}`);
    for (const tool of RICH_TOOLS.filter((t) => !['undo', 'redo'].includes(t.id))) assert.ok(RICH_TEXTS_EN.tools[tool.id].does, `o que ${tool.id} faz`);
    // A barra é inteira em qualquer largura (F135, v32): nenhum botão é só da coluna larga e não há «…».
    assert.doesNotMatch(html, /data-essential|data-cmd="more"/);
    assert.match(html, /role="toolbar" aria-label="Formatting of A história"/);
    assert.match(html, /aria-pressed="false"/);
    assert.match(html, /class="ak-rt-body" contentEditable="true" role="textbox" aria-multiline="true" aria-label="A história"/);
    assert.match(html, /«\/» inserts · Enter opens a paragraph · Shift\+Enter breaks the line/);
});

test('o rico desenha o Markdown gravado, com a mídia fechada e «Remover», e conta palavras e mídias (REQ-05, REQ-06)', () => {
    const value = 'Um **dois** três.\n\n> Uma citação\n\n![Foto do Jardim](/media/text/a.jpg "Legenda")\n\n![](https://youtu.be/dQw4w9WgXcQ)\n\n[Atomic Habits](/livro/atomic-habits "livro")\n\n<script>x</script>';
    const html = renderToStaticMarkup(h(RichTextField, { label: 'A história', value, onChange: () => {} }));
    assert.match(html, /<p>Um <strong>dois<\/strong> três\.<\/p><blockquote><p>Uma citação<\/p><\/blockquote>/);
    assert.match(html, /<figure class="ak-rt-media" contenteditable="false" data-rt="image" data-src="\/media\/text\/a\.jpg" data-alt="Foto do Jardim" data-caption="Legenda" data-wide=""><img src="\/media\/text\/a\.jpg" alt="Foto do Jardim"><figcaption>Legenda<\/figcaption><button type="button" class="ak-rt-x" contenteditable="false" tabindex="-1">Remove<\/button><\/figure>/);
    assert.match(html, /data-rt="video" data-url="https:\/\/www\.youtube\.com\/watch\?v=dQw4w9WgXcQ"/);
    assert.match(html, /data-rt="book" data-slug="atomic-habits" data-title="Atomic Habits"/);
    assert.match(html, /<p>&lt;script&gt;x&lt;\/script&gt;<\/p>/);
    assert.match(html, /6 words · 1 min read · 3 media items/);
});

test('o rico no kit: o mesmo campo dentro da seção, com o valor do idioma aberto', () => {
    const html = draw({ title: { en: '' }, intro: { en: '' }, story: { en: 'Hello **world**' } });
    assert.match(html, /class="ak-rt-body"[^>]*><p>Hello <strong>world<\/strong><\/p><\/div>/);
    assert.doesNotMatch(html, /<textarea[^>]*>Hello/);
});

test('o editor mostra o tamanho que encontra (F332): ninguém perde um tamanho editando na 1.0.x', async () => {
    const { toEditorHtml } = await load('rich/editor-html.ts');
    const { parseRich } = await load('index.ts');
    const html = toEditorHtml(parseRich('um [grande]{.large} e [pequeno]{.small}'), { remove: 'x', inGarden: 'g', video: 'v' });
    assert.match(html, /<span data-size="large">grande<\/span>/);
    assert.match(html, /<span data-size="small">pequeno<\/span>/);
});

test('e a volta do editor guarda o tamanho (recheck P2-3): documento → editor → DOM → documento', async () => {
    const { toEditorHtml, fromEditor } = await load('rich/editor-html.ts');
    const { parseRich, toMarkdown } = await load('index.ts');
    const { parseHtml } = await import('./support/mini-dom.mjs');
    for (const text of ['um [grande]{.large} e [pequeno]{.small}', '**[forte e enorme]{.xlarge}** e o resto', '- um [item]{.small}\n- outro']) {
        const html = toEditorHtml(parseRich(text), { remove: 'x', inGarden: 'g', video: 'v' });
        assert.equal(toMarkdown(fromEditor(parseHtml(html))), toMarkdown(parseRich(text)), text);
    }
    // a span with an unknown size or no size reads as its text, never as a size
    assert.equal(toMarkdown(fromEditor(parseHtml('<p><span data-size="huge">a</span> <span>b</span></p>'))), 'a b');
});
