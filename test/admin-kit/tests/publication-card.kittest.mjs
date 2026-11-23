// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
// O cartão da publicação do kit depois de salvar (F158; UAT-347 e UAT-349): a regra pura que lê cada resposta do porto da publicação
// e diz o que o cartão mostra. O cartão sai assim que se sabe que não há build; uma consulta que falhou depois de salvar diz que não
// foi possível confirmar; uma resposta pedida antes de salvar só ensina qual era o deploy de antes. Os textos são do teste.
//
//   node --test tests/admin-kit/publication-card.test.mjs
// Trazido do MJRPpersonal (tests/admin-kit/publication-card.test.mjs, c33a33a4) para o kit no harness (F332, TASK-08): a pasta do kit por parâmetro.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { installTsHooks } from './support/ts-hooks.mjs';

installTsHooks();
const ROOT = path.resolve(import.meta.dirname, '..');
const UI = path.resolve(ROOT, process.env.ADMIN_KIT_UI ?? 'ui');
const { BUILD_START, readAnswer, markAfterSave } = await import(pathToFileURL(path.join(UI, 'publication.ts')).href);

const SAVED_AT = 1_000_000;
const PUBLISHING = { state: 'publishing', message: 'texto do build' };
const UNKNOWN = { state: 'unknown', message: 'texto da consulta que falhou' };
const after = (ms = 1) => SAVED_AT + ms;

test('salvou com o deploy de antes conhecido: a marca guarda o número dele', () => {
    assert.deepEqual(markAfterSave({ state: 'idle', build: '1' }, SAVED_AT), { at: SAVED_AT, seen: false, known: true, before: '1' });
    assert.deepEqual(markAfterSave(null, SAVED_AT), { at: SAVED_AT, seen: false, known: false, before: undefined });
});

test('um deploy novo já terminado tira o cartão na hora; o de antes o mantém até o prazo', () => {
    const mark = markAfterSave({ state: 'idle', build: '1' }, SAVED_AT);
    assert.deepEqual(readAnswer({ state: 'idle', build: '2' }, after(), mark, 'publishing', after(5)), { card: { state: 'idle', build: '2' }, mark: null });
    assert.deepEqual(readAnswer({ state: 'idle', build: '1' }, after(), mark, 'publishing', after(5)), { mark });
    assert.deepEqual(readAnswer({ state: 'idle', build: '1' }, after(), mark, 'publishing', after(BUILD_START)), { card: { state: 'idle', build: '1' }, mark: null });
});

test('sem build a acompanhar, o cartão sai, mesmo numa resposta pedida antes de salvar', () => {
    const mark = markAfterSave(null, SAVED_AT);
    assert.deepEqual(readAnswer({ state: 'idle', none: true }, after(), mark, 'publishing', after(5)), { card: { state: 'idle', none: true }, mark: null });
    assert.deepEqual(readAnswer({ state: 'idle', none: true }, SAVED_AT - 50, mark, 'publishing', after(5)), { card: { state: 'idle', none: true }, mark: null });
});

test('UAT-349: a consulta falhou depois de salvar: o cartão diz que não foi possível confirmar, sem esperar o prazo', () => {
    const mark = markAfterSave({ state: 'idle', build: '1' }, SAVED_AT);
    assert.deepEqual(readAnswer(UNKNOWN, after(), mark, 'publishing', after(5)), { card: UNKNOWN, mark });
    // Seguindo um build que rodava (sem ter salvado aqui), a falha também é dita; o aviso fica enquanto a consulta falhar.
    assert.deepEqual(readAnswer(UNKNOWN, after(), null, 'publishing', after(5)), { card: UNKNOWN, mark: null });
    assert.deepEqual(readAnswer(UNKNOWN, after(), null, 'unknown', after(5)), { card: UNKNOWN, mark: null });
    // Sem nada no ar, uma consulta que falha não põe cartão nenhum.
    assert.deepEqual(readAnswer(UNKNOWN, after(), null, 'idle', after(5)), { card: { state: 'idle' }, mark: null });
    // Uma resposta boa depois da falha tira o aviso.
    assert.deepEqual(readAnswer({ state: 'idle', build: '2' }, after(), null, 'unknown', after(5)), { card: { state: 'idle', build: '2' }, mark: null });
});

test('UAT-349: salvou antes da primeira resposta: a resposta pedida antes ensina o deploy de antes e pede outra consulta', () => {
    const mark = markAfterSave(null, SAVED_AT);
    // A resposta pedida depois de salvar chega primeiro: sem saber o de antes, espera.
    assert.deepEqual(readAnswer({ state: 'idle', build: '2' }, after(), mark, 'publishing', after(5)), { mark });
    // A pedida antes chega: é o deploy de antes; o cartão não muda e o kit pergunta de novo.
    const learned = readAnswer({ state: 'idle', build: '1' }, SAVED_AT - 50, mark, 'publishing', after(10));
    assert.deepEqual(learned, { mark: { ...mark, known: true, before: '1' }, askAgain: true });
    // A nova resposta, com o deploy novo terminado, tira o cartão na hora.
    assert.deepEqual(readAnswer({ state: 'idle', build: '2' }, after(20), learned.mark, 'publishing', after(30)), { card: { state: 'idle', build: '2' }, mark: null });
});

test('uma resposta pedida antes de salvar não marca o build da gravação como visto nem põe o aviso de falha', () => {
    const mark = markAfterSave({ state: 'idle', build: '1' }, SAVED_AT);
    assert.deepEqual(readAnswer({ ...PUBLISHING, build: '1' }, SAVED_AT - 50, mark, 'publishing', after(5)), { mark });
    assert.deepEqual(readAnswer(UNKNOWN, SAVED_AT - 50, mark, 'publishing', after(5)), { mark });
});

test('o build da gravação rodando mantém o cartão; ao terminar, ele sai', () => {
    const mark = markAfterSave({ state: 'idle', build: '1' }, SAVED_AT);
    const running = readAnswer({ ...PUBLISHING, build: '2' }, after(), mark, 'publishing', after(5));
    assert.deepEqual(running, { card: { ...PUBLISHING, build: '2' }, mark: { ...mark, seen: true } });
    assert.deepEqual(readAnswer({ state: 'idle', build: '2' }, after(30), running.mark, 'publishing', after(40)), { card: { state: 'idle', build: '2' }, mark: null });
});

test('UAT-349: com o cartão de falha da publicação no ar, uma consulta que falha não muda nada', () => {
    assert.deepEqual(readAnswer(UNKNOWN, after(), null, 'failed', after(5)), { mark: null });
    const mark = markAfterSave({ state: 'failed', message: 'x', build: '1' }, SAVED_AT);
    assert.deepEqual(readAnswer(UNKNOWN, after(), mark, 'failed', after(5)), { mark });
});

test('UAT-349: a marca da gravação atravessa a consulta que falhou: só um deploy novo terminado, ou o build da gravação, tira o aviso', () => {
    const mark = markAfterSave({ state: 'idle', build: '1' }, SAVED_AT);
    const failed = readAnswer(UNKNOWN, after(), mark, 'publishing', after(5));
    assert.deepEqual(failed, { card: UNKNOWN, mark });
    // O deploy de antes, parado: nada foi confirmado, o aviso fica, mesmo depois do prazo.
    assert.deepEqual(readAnswer({ state: 'idle', build: '1' }, after(20), failed.mark, 'unknown', after(30)), { mark });
    assert.deepEqual(readAnswer({ state: 'idle', build: '1' }, after(BUILD_START), failed.mark, 'unknown', after(BUILD_START + 10)), { mark });
    // Um deploy novo terminado confirma: o aviso sai.
    assert.deepEqual(readAnswer({ state: 'idle', build: '2' }, after(40), failed.mark, 'unknown', after(50)), { card: { state: 'idle', build: '2' }, mark: null });
    // Ou o build da gravação, visto rodando, termina.
    const running = readAnswer({ ...PUBLISHING, build: '2' }, after(40), failed.mark, 'unknown', after(50));
    assert.deepEqual(running, { card: { ...PUBLISHING, build: '2' }, mark: { ...mark, seen: true } });
    assert.deepEqual(readAnswer({ state: 'idle', build: '2' }, after(60), running.mark, 'publishing', after(70)), { card: { state: 'idle', build: '2' }, mark: null });
});
