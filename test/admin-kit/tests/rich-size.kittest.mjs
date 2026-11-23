// cópia carimbada do kit do admin do MJRP Harness · admin-kit v0.9.0 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
// O tamanho da letra no núcleo (F332, REQ-08; TASK-03): o leitor reconhece `[trecho]{.small|.large|.xlarge}` já na 1.0.0,
// para nenhuma versão a partir dela mostrar os sinais crus; qualquer outra classe, ou mais de uma, fica texto. A barra o
// oferece na 1.1.0 (TASK-20b); até lá, o escritor o preserva, para uma edição não descartar um tamanho em silêncio.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const CORE = path.resolve(import.meta.dirname, '..', process.env.ADMIN_KIT_CORE ?? 'core');
const { parseRich, toMarkdown, normalizeDoc, plainText, RICH_SIZES } = await import(pathToFileURL(path.join(CORE, 'index.js')).href);

const t = (v) => ({ t: 'text', v });
const p = (...c) => ({ t: 'p', c });
const size = (s, ...c) => ({ t: 'size', size: s, c });

test('os três tamanhos do conjunto são lidos como marca de trecho', () => {
    assert.deepEqual(RICH_SIZES, ['small', 'large', 'xlarge']);
    for (const s of RICH_SIZES) assert.deepEqual(parseRich(`um [trecho]{.${s}} aqui`), [p(t('um '), size(s, t('trecho')), t(' aqui'))]);
});

test('fora do conjunto, ou com mais de uma classe, é texto', () => {
    for (const raw of ['[a]{.huge}', '[a]{.large .x}', '[a]{ .large }', '[a]{#id}', '[a]{.LARGE}', '[a] {.large}']) {
        assert.deepEqual(parseRich(raw), [p(t(raw))], raw);
    }
});

test('o tamanho guarda as marcas de dentro e fica dentro de um link', () => {
    assert.deepEqual(parseRich('[**forte** e _leve_]{.large}'), [p(size('large', { t: 'strong', c: [t('forte')] }, t(' e '), { t: 'em', c: [t('leve')] }))]);
    assert.deepEqual(parseRich('[[grande]{.xlarge}](https://a.b)'), [p({ t: 'link', href: 'https://a.b', c: [size('xlarge', t('grande'))] })]);
    assert.deepEqual(parseRich('**a [b**]{.small}'), [p(t('**a '), size('small', t('b**')))]);
});

test('vazio não deixa nada; escapado é texto', () => {
    assert.deepEqual(parseRich('a[]{.large}b'), [p(t('ab'))]);
    assert.deepEqual(parseRich('\\[a\\]{.large}'), [p(t('[a]{.large}'))]);
});

test('ida e volta: o escritor preserva o tamanho, e um texto com colchetes não vira tamanho', () => {
    for (const doc of [
        [p(t('um '), size('large', t('trecho')), t(' fim'))],
        [p(size('small', { t: 'strong', c: [t('b')] }))],
        [p({ t: 'link', href: '/x', c: [size('xlarge', t('l'))] })],
        [p(t('[a]{.large}'))],
    ]) {
        const md = toMarkdown(doc);
        assert.deepEqual(parseRich(md), normalizeDoc(doc), md);
        assert.equal(toMarkdown(parseRich(md)), md);
    }
    assert.equal(toMarkdown([p(t('a '), size('large', t('b')))]), 'a [b]{.large}');
});

test('a forma normal: dois tamanhos iguais vizinhos são um só; o espaço da borda sai do tamanho', () => {
    assert.deepEqual(normalizeDoc([p(size('large', t('a')), size('large', t('b ')), t('c'))]), [p(size('large', t('ab')), t(' c'))]);
    assert.deepEqual(normalizeDoc([p(size('small', size('small', t('x'))))]), [p(size('small', t('x')))]);
});

test('o texto plano não leva o tamanho', () => {
    assert.equal(plainText(parseRich('um [dois]{.large} três')), 'um dois três');
});
