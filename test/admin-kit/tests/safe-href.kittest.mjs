// cópia carimbada do kit do admin do MJRP Harness · admin-kit v0.9.0 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
// The internal link that leaves the site (F332, REQ-07; TASK-06, the core's side of the MJRPpersonal's TASK-01): a browser
// reads a backslash as a slash, so `/\evil.com` and its escape `%5C` (in any case) would leave the site disguised as a link
// of the site itself; a space or a control character in any position is no address either. The good ones stay.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const CORE = path.resolve(import.meta.dirname, '..', process.env.ADMIN_KIT_CORE ?? 'core');
const { safeHref, parseRich, toMarkdown } = await import(pathToFileURL(path.join(CORE, 'index.js')).href);

/** The five samples of TASK-01, and their kin. */
const BAD = [
    '/\\evil.com', '/%5Cevil.com', '/%5cevil.com', '/\t/evil.com', '//evil.com',
    '\\\\evil.com', '/a\\b', '/x%5C', 'https://a.b/%5c', '/a b', ' /a\u0000b', '/a\u007Fb', '/a\nb', 'javascript:alert(1)', 'data:text/html,x', 'vbscript:x', 'ftp://a.b',
];
const GOOD = ['/', '/livro/atomic-habits', '/a/b?c=d#e', '#topo', 'https://example.com/x', 'http://example.com', 'mailto:a@b.c', 'HTTPS://EXAMPLE.COM', '  /trimmed  '];

test('as amostras ruins não viram endereço', () => {
    for (const href of BAD) assert.equal(safeHref(href), null, JSON.stringify(href));
});

test('as boas continuam endereço, sem os espaços da borda', () => {
    for (const href of GOOD) assert.equal(safeHref(href), href.trim(), JSON.stringify(href));
});

test('no texto, o link ruim perde o link e o texto fica; o bom fica link', () => {
    for (const href of ['/\\evil.com', '/%5Cevil.com', '/%5cevil.com', '//evil.com']) {
        assert.deepEqual(parseRich(`[aqui](${href})`), [{ t: 'p', c: [{ t: 'text', v: 'aqui' }] }], href);
    }
    assert.deepEqual(parseRich('[aqui](/livro/x)'), [{ t: 'p', c: [{ t: 'link', href: '/livro/x', c: [{ t: 'text', v: 'aqui' }] }] }]);
    // The writer never writes a link the reader would refuse.
    assert.equal(toMarkdown([{ t: 'p', c: [{ t: 'link', href: '/\\evil.com', c: [{ t: 'text', v: 'x' }] }] }]), 'x');
});
