// cópia carimbada do kit do admin do MJRP Harness · admin-kit v0.9.0 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
// F134, S-160 REQ-05: a peça do kit «propor, escolher, aplicar» serve aos dois CMS. Nada muda no campo sem o clique em «Aplicar»
// (ou em «Usar»); com várias propostas, nenhuma vem marcada e «Aplicar» só acende com uma escolhida; o aviso vermelho é `alert`.
// A peça não conhece nenhum CMS: o teste a monta com textos de um livro e com textos de um site de empresa, e ela serve aos dois.
// O componente roda sem DOM (client-harness); o desenho em HTML sai do React de verdade.
// Trazido do MJRPpersonal (tests/admin-kit/suggest.test.mjs, c33a33a4) para o kit no harness (F332, TASK-08): a pasta do kit por parâmetro.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { SKIP, UI, find, importComponent, installClientHarness, mount, textOf } from './support/client-harness.mjs';

installClientHarness();

let Suggest, SuggestPick, SuggestOne, SuggestNote, SuggestAsk, SuggestWas;
before(async () => {
    if (SKIP) return;
    ({ Suggest, SuggestPick, SuggestOne, SuggestNote, SuggestAsk, SuggestWas } = await importComponent('components/Suggest.tsx'));
});

const T = { discard: 'Descartar', close: 'Fechar', hintNone: 'Escolha uma para aplicar.', hintChosen: 'Troca o que está no campo.' };
const OPTIONS = [
    { main: 'Comunicação', sub: 'Estrutura & Clareza de Mensagem', why: 'Ensina a organizar a fala.' },
    { main: 'Comunicação', sub: 'Persuasão & Influência (Psicologia)', why: 'Fala em convencer.' },
    { main: 'Psicologia', sub: 'Vieses', why: 'Trata de como a mente erra.' },
];
const pickState = (extra = {}) => ({ step: 'pick', badge: 'IA', source: '3 sugestões dos mapas', title: 'Escolha uma e aplique', now: 'Agora: sem categoria', options: OPTIONS, apply: 'Aplicar', onApply() {}, onDiscard() {}, ...extra });
const all = (node, predicate, hits = []) => {
    if (!node || typeof node !== 'object') return hits;
    if (predicate(node)) hits.push(node);
    for (const child of [node.props?.children].flat(Infinity)) all(child, predicate, hits);
    return hits;
};
const radios = (tree) => all(tree, (n) => n.type === 'input' && n.props.type === 'radio');
const button = (tree, label) => find(tree, (n) => n.type === 'button' && textOf(n) === label);

test('várias propostas: nenhuma vem marcada, e «Aplicar» está apagado, com a dica de escolher uma', { skip: SKIP }, () => {
    const view = mount(SuggestPick, { state: pickState(), t: T });
    const tree = view.render();
    assert.equal(radios(tree).length, 3);
    assert.deepEqual(radios(tree).map((r) => r.props.checked), [false, false, false]);
    assert.equal(button(tree, 'Aplicar').props.disabled, true);
    assert.equal(textOf(find(tree, (n) => n.type === 'small' && /ak-sg-hint/.test(n.props.className))), 'Escolha uma para aplicar.');
});

test('escolher acende «Aplicar» e muda a dica; o clique entrega a escolhida e o índice, e escolher sozinho não aplica', { skip: SKIP }, () => {
    const applied = [];
    const view = mount(SuggestPick, { state: pickState({ onApply: (option, index) => applied.push([option, index]) }), t: T });
    view.render();
    radios(view.render())[1].props.onChange();
    const tree = view.render();
    assert.deepEqual(radios(tree).map((r) => r.props.checked), [false, true, false]);
    assert.equal(button(tree, 'Aplicar').props.disabled, false);
    assert.equal(textOf(find(tree, (n) => n.type === 'small' && /ak-sg-hint/.test(n.props.className))), 'Troca o que está no campo.');
    assert.deepEqual(applied, [], 'escolher não aplica');
    button(tree, 'Aplicar').props.onClick();
    assert.deepEqual(applied, [[OPTIONS[1], 1]]);
});

test('descartar avisa quem usa, e não aplica nada', { skip: SKIP }, () => {
    const log = [];
    const view = mount(SuggestPick, { state: pickState({ onApply: () => log.push('aplicou'), onDiscard: () => log.push('descartou') }), t: T });
    const tree = view.render();
    radios(tree)[0].props.onChange();
    button(view.render(), 'Descartar').props.onClick();
    assert.deepEqual(log, ['descartou']);
});

test('uma proposta só: o texto para conferir, e «Usar» entrega o texto; sem o clique, nada sai', { skip: SKIP }, () => {
    const used = [];
    const state = { step: 'one', badge: 'Google Books', source: 'em inglês', title: 'A sinopse achada, para conferir', text: 'O texto achado.', meta: 'A edição', apply: 'Usar em «Sinopse em inglês»', hint: 'O campo está vazio.', onApply: (text) => used.push(text), onDiscard() {} };
    const tree = mount(SuggestOne, { state, t: T }).render();
    assert.equal(textOf(find(tree, (n) => n.type === 'blockquote')), 'O texto achado.');
    assert.deepEqual(used, []);
    button(tree, 'Usar em «Sinopse em inglês»').props.onClick();
    assert.deepEqual(used, ['O texto achado.']);
    assert.ok(button(tree, 'Descartar'));
});

test('o aviso vermelho é `alert` e leva «Tentar de novo» e «Fechar»; o amarelo é `status`, sem botões quando não há o que tentar', { skip: SKIP }, () => {
    const log = [];
    const err = mount(SuggestNote, { state: { step: 'note', tone: 'err', message: 'A IA não veio.', retry: 'Tentar de novo', onRetry: () => log.push('retry'), onClose: () => log.push('close') }, t: T }).render();
    assert.equal(err.props.role, 'alert');
    assert.match(err.props.className, /is-err/);
    button(err, 'Tentar de novo').props.onClick();
    button(err, 'Fechar').props.onClick();
    assert.deepEqual(log, ['retry', 'close']);
    const warn = mount(SuggestNote, { state: { step: 'note', tone: 'warn', message: 'Não achou.', onClose() {} }, t: T }).render();
    assert.equal(warn.props.role, 'status');
    assert.equal(all(warn, (n) => n.type === 'button').length, 0);
});

test('o botão que pede a proposta diz o que faz, espera parado e depois oferece «de novo»', { skip: SKIP }, () => {
    const base = { label: 'Buscar sinopse', busyLabel: 'Buscando…', againLabel: 'Buscar de novo', icon: '⌕', hint: 'No Google Books.', onAsk() {} };
    const idle = mount(SuggestAsk, { ...base, busy: false }).render();
    assert.equal(textOf(find(idle, (n) => n.type === 'button')), 'Buscar sinopse');
    const busy = mount(SuggestAsk, { ...base, busy: true }).render();
    const busyButton = find(busy, (n) => n.type === 'button');
    assert.equal(textOf(busyButton), 'Buscando…');
    assert.equal(busyButton.props.disabled, true);
    assert.equal(busyButton.props['aria-busy'], true);
    assert.equal(textOf(find(mount(SuggestAsk, { ...base, busy: false, asked: true }).render(), (n) => n.type === 'button')), 'Buscar de novo');
    assert.equal(textOf(find(idle, (n) => n.type === 'span' && n.props.className === 'ak-hint')), 'No Google Books.');
});

test('a marca do campo: o que tinha antes e «Desfazer», que só avisa quem usa', { skip: SKIP }, () => {
    let undone = 0;
    const tree = mount(SuggestWas, { children: 'Do Google Books. Antes: vazia.', undo: 'Desfazer', onUndo: () => undone++ }).render();
    assert.match(textOf(tree), /Do Google Books\. Antes: vazia\.Desfazer/);
    button(tree, 'Desfazer').props.onClick();
    assert.equal(undone, 1);
});

test('o quadro escolhe a forma pelo passo: espera, escolha, uma proposta, aviso; parado não desenha nada', { skip: SKIP }, () => {
    assert.equal(Suggest({ state: { step: 'idle' }, t: T }), null);
    assert.equal(Suggest({ state: { step: 'busy', text: 'Buscando…' }, t: T }).type.name, 'SuggestBusy');
    assert.equal(Suggest({ state: pickState(), t: T }).type.name, 'SuggestPick');
    assert.equal(Suggest({ state: { step: 'one', title: 't', text: 'x', apply: 'Usar', onApply() {}, onDiscard() {} }, t: T }).type.name, 'SuggestOne');
    assert.equal(Suggest({ state: { step: 'note', tone: 'warn', message: 'm', onClose() {} }, t: T }).type.name, 'SuggestNote');
});

test('serve ao site profissional: a mesma peça com textos de outro CMS, sem nada do Jardim dentro dela', { skip: SKIP }, () => {
    const applied = [];
    const tree = mount(SuggestPick, {
        state: pickState({ badge: 'IA', source: '3 títulos', title: 'Escolha um título', now: undefined, apply: 'Usar este', options: [{ main: 'Fundador de produto' }, { main: 'Líder de plataforma' }], onApply: (option) => applied.push(option.main) }),
        t: { discard: 'Dismiss', close: 'Close', hintNone: 'Pick one.', hintChosen: 'Replaces the field.' },
    });
    radios(tree.render())[0].props.onChange();
    button(tree.render(), 'Usar este').props.onClick();
    assert.deepEqual(applied, ['Fundador de produto']);
    const source = readFileSync(path.join(UI, 'components/Suggest.tsx'), 'utf8');
    for (const word of ['sinopse', 'Google', 'categoria', 'Jardim', 'livro']) assert.doesNotMatch(source.replace(/\/\*\*[\s\S]*?\*\//g, ''), new RegExp(word, 'i'), `a peça não conhece «${word}»`);
});

test('a pele: a peça só lê tokens do contrato, e o kit.css a desenha com eles', () => {
    const css = readFileSync(path.join(UI, 'kit.css'), 'utf8');
    for (const selector of ['.ak-sg-ask', '.ak-sg ', '.ak-sg-opt', '.ak-sg-one', '.ak-sg-got', '.ak-sg-was']) assert.ok(css.includes(selector), selector);
    assert.doesNotMatch(css.slice(css.indexOf('«Propor, escolher, aplicar»')), /#[0-9a-f]{3,8}\b|rgba?\(/i, 'nenhuma cor escrita');
});
