// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
// F134, S-160 REQ-05: o desenho da peça «propor, escolher, aplicar» com o React de verdade (no servidor): as linhas de cada
// opção, nenhuma marcada, «Aplicar» apagado, o aviso com o papel certo. O comportamento (escolher, aplicar) está em suggest.test.mjs.
// Trazido do MJRPpersonal (tests/admin-kit/suggest-render.test.mjs, c33a33a4) para o kit no harness (F332, TASK-08): a pasta do kit por parâmetro.
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
const { Suggest, SuggestAsk, SuggestWas } = await import(pathToFileURL(path.join(UI, 'components/Suggest.tsx')).href);

const T = { discard: 'Descartar', close: 'Fechar', hintNone: 'Escolha uma para aplicar.', hintChosen: 'Troca o que está no campo.' };
const draw = (state) => renderToStaticMarkup(h(Suggest, { state, t: T }));
const OPTIONS = [{ main: 'Comunicação', sub: 'Estrutura & Clareza de Mensagem', why: 'Ensina a organizar a fala.' }, { main: 'Uma proposta em texto' }];

test('as propostas: a categoria, a subcategoria e o porquê numa linha; sem subcategoria, um texto só; nenhuma marcada', () => {
    const html = draw({ step: 'pick', badge: 'IA', source: '3 sugestões dos mapas', title: 'Escolha uma e aplique', options: OPTIONS, apply: 'Aplicar', onApply() {}, onDiscard() {} });
    assert.match(html, /class="ak-sg-main">Comunicação</);
    assert.match(html, /class="ak-sg-sub">Estrutura &amp; Clareza de Mensagem</);
    assert.match(html, /class="ak-sg-why">Ensina a organizar a fala\.</);
    assert.match(html, /class="ak-sg-opt txt"/);
    assert.match(html, /<i>IA<\/i>3 sugestões dos mapas/);
    assert.match(html, /role="radiogroup"/);
    assert.doesNotMatch(html, /checked/, 'nenhuma opção marcada');
    assert.match(html, /<button type="button" class="ak-sg-btn pri" disabled="">Aplicar<\/button>/);
    assert.match(html, /Escolha uma para aplicar\./);
});

test('o que está hoje no campo aparece na linha «Agora», com o valor marcado', () => {
    const html = draw({ step: 'pick', title: 'Escolha', now: h('span', null, 'Agora: ', h('s', null, 'Business Essentials'), ' · sem subcategoria'), options: OPTIONS, apply: 'Aplicar', onApply() {}, onDiscard() {} });
    assert.match(html, /<span class="ak-sg-now"><span>Agora: <s>Business Essentials<\/s> · sem subcategoria<\/span><\/span>/);
});

test('a espera é `status` educado, com o giro e a linha fantasma escondidos do leitor de tela', () => {
    const html = draw({ step: 'busy', text: 'A IA está lendo o título…' });
    assert.match(html, /role="status" aria-live="polite"/);
    assert.match(html, /class="ak-sg-spin" aria-hidden="true"/);
    assert.match(html, /class="ak-sg-ghost" aria-hidden="true"/);
    assert.match(html, /A IA está lendo o título…/);
});

test('o aviso vermelho é `alert`, o amarelo `status`', () => {
    assert.match(draw({ step: 'note', tone: 'err', message: 'x', retry: 'Tentar de novo', onClose() {} }), /class="ak-sg is-err" role="alert"/);
    assert.match(draw({ step: 'note', tone: 'warn', message: 'x', onClose() {} }), /class="ak-sg is-warn" role="status"/);
});

test('o botão e a marca do campo', () => {
    const ask = renderToStaticMarkup(h(SuggestAsk, { label: 'Sugerir categoria', busyLabel: 'Pensando…', icon: '✦', busy: true, hint: 'Nada muda até você aplicar.', onAsk() {} }));
    assert.match(ask, /data-ico="✦" disabled="" aria-busy="true">Pensando…</);
    assert.match(ask, /<span class="ak-hint">Nada muda até você aplicar\.<\/span>/);
    const was = renderToStaticMarkup(h(SuggestWas, { undo: 'Desfazer', onUndo() {} }, 'Do Google Books. Antes: vazia.'));
    assert.match(was, /<span class="ak-sg-was"><span>Do Google Books\. Antes: vazia\.<\/span><button type="button">Desfazer<\/button><\/span>/);
});
