// cópia carimbada do kit do admin do MJRP Harness · admin-kit v0.9.0 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
// O dialeto do texto rico (F128, REQ-06 e REQ-07; ADR-0015; no núcleo do kit desde a F332): o que o campo grava o site lê
// igual, e nada fora da lista entra pelo texto — HTML é texto, endereço perigoso perde o link, vídeo só do YouTube e do Vimeo.
// Trazido do MJRPpersonal (tests/admin-kit/rich-markdown.test.mjs, c33a33a4); a pasta do núcleo por parâmetro (`ADMIN_KIT_CORE`).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const CORE = path.resolve(import.meta.dirname, '..', process.env.ADMIN_KIT_CORE ?? 'core');
const { parseRich, toMarkdown, normalizeDoc, safeHref, safeImage, videoOf, countOf, plainText } = await import(pathToFileURL(path.join(CORE, 'index.js')).href);

const t = (v) => ({ t: 'text', v });
const p = (...c) => ({ t: 'p', c });
const roundTrip = (doc) => {
    const md = toMarkdown(doc);
    assert.deepEqual(parseRich(md), normalizeDoc(doc), `ida e volta de:\n${md}`);
    assert.equal(toMarkdown(parseRich(md)), md, 'o Markdown escrito de novo é o mesmo');
    return md;
};

test('parágrafos e quebras: a linha em branco separa, a quebra simples fica', () => {
    assert.deepEqual(parseRich('Um\nainda um\n\nDois'), [p(t('Um'), { t: 'br' }, t('ainda um')), p(t('Dois'))]);
    assert.deepEqual(parseRich('\n\n  só um  \n\n\n'), [p(t('só um'))]);
    assert.deepEqual(parseRich(''), []);
});

test('todas as marcas da barra, e o que a barra escreve volta igual', () => {
    const doc = [
        p(t('Texto '), { t: 'strong', c: [t('negrito')] }, t(', '), { t: 'em', c: [t('itálico')] }, t(', '), { t: 'u', c: [t('sublinhado')] }, t(', '),
            { t: 's', c: [t('tachado')] }, t(', x'), { t: 'sup', c: [t('2')] }, t(', H'), { t: 'sub', c: [t('2')] }, t('O, '), { t: 'mark', c: [t('marca')] },
            t(' e '), { t: 'link', href: '/concept', c: [t('o Jardim')] }, t('.')),
        { t: 'lead', c: [t('Texto grande')] },
        { t: 'h3', c: [t('Subtítulo')] },
        { t: 'quote', c: [[t('Uma citação escrita só para este teste.')]] },
        { t: 'callout', c: [[t('Uma nota.')], [t('Dois parágrafos.')]] },
        { t: 'ul', c: [[t('um')], [t('dois'), { t: 'br' }, t('linha')]] },
        { t: 'ol', c: [[t('primeiro')], [t('segundo')]], start: 3 },
        { t: 'hr' },
        { t: 'image', src: '/media/text/jardim.jpg', alt: 'O Início do Jardim', caption: 'Com a árvore', wide: true },
        { t: 'video', provider: 'youtube', id: 'dQw4w9WgXcQ', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', caption: 'Uma palestra' },
        { t: 'video', provider: 'vimeo', id: '76979871', url: 'https://vimeo.com/76979871', caption: '' },
        { t: 'book', slug: 'atomic-habits', title: 'Atomic Habits' },
    ];
    const md = roundTrip(doc);
    assert.match(md, /\*\*negrito\*\*/);
    assert.match(md, /\+\+sublinhado\+\+/);
    assert.match(md, /==marca==/);
    assert.match(md, /x\^2\^/);
    assert.match(md, /H~2~O/);
    assert.match(md, /^#### Texto grande$/m);
    assert.match(md, /^> \[!NOTE\]$/m);
    assert.match(md, /^3\. primeiro$/m);
    assert.match(md, /!\[O Início do Jardim\]\(\/media\/text\/jardim\.jpg#largo "Com a árvore"\)/);
    assert.match(md, /\[Atomic Habits\]\(\/livro\/atomic-habits "livro"\)/);
});

test('marcas dentro de marcas e coladas na palavra', () => {
    roundTrip([p({ t: 'strong', c: [t('a '), { t: 'em', c: [t('b')] }] })]);
    roundTrip([p({ t: 'strong', c: [t('a'), { t: 'em', c: [t('b')] }] }, t('c'))]);
    roundTrip([p({ t: 'em', c: [t('a '), { t: 'strong', c: [t('b')] }] })]);
    roundTrip([p(t('anti'), { t: 'em', c: [t('social')] }, t('mente'))]);
    roundTrip([p({ t: 'mark', c: [t('não apenas '), { t: 'strong', c: [t('absorver')] }] }, t(' conhecimento'))]);
    roundTrip([p({ t: 'link', href: 'https://example.com/a_(b)', c: [{ t: 'strong', c: [t('link')] }, t(' forte')] })]);
    assert.deepEqual(parseRich('***tudo***'), [p({ t: 'strong', c: [{ t: 'em', c: [t('tudo')] }] })]);
});

test('texto com sinais do Markdown fica texto', () => {
    const texts = ['2 * 3 = 6 e 4*5', 'snake_case e _sozinho', '# não é título', '> não é citação', '- não é lista', '1. não é lista',
        '2020. Foi um ano', '---', '[não é link](x)', '![não é imagem](/a.jpg)', 'a == b e c ++ d', '~200 páginas e 2^10', 'barra \\ e `crase`',
        '[!NOTE] solto', 'termina com #', '***', 'x ~~não~~ y'];
    for (const text of texts) {
        const doc = [p(t(text))];
        const md = toMarkdown(doc);
        assert.deepEqual(parseRich(md), normalizeDoc(doc), `«${text}» virou ${md}`);
    }
    roundTrip([p(t('linha'), { t: 'br' }, t('# depois da quebra'), { t: 'br' }, t('- e lista'))]);
    roundTrip([{ t: 'h3', c: [t('Título com # no fim #')] }]);
});

test('a forma única: espaço na borda da marca sai dela, duas quebras viram parágrafo, marca vazia some', () => {
    assert.deepEqual(normalizeDoc([p({ t: 'strong', c: [t(' palavra ')] })]), [p({ t: 'strong', c: [t('palavra')] })]);
    assert.deepEqual(normalizeDoc([p(t('um'), { t: 'br' }, { t: 'br' }, t('dois'))]), [p(t('um')), p(t('dois'))]);
    assert.deepEqual(normalizeDoc([p({ t: 'em', c: [] }, t(' a '), { t: 'strong', c: [{ t: 'strong', c: [t('b')] }] })]), [p(t('a '), { t: 'strong', c: [t('b')] })]);
    roundTrip([p(t('a'), { t: 'strong', c: [t(' b ')] }, t('c'))]);
});

test('HTML é texto, e nunca vira etiqueta', () => {
    const md = '<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n<b>negrito?</b>';
    const doc = parseRich(md);
    assert.deepEqual(doc.map((block) => block.t), ['p', 'p', 'p']);
    assert.equal(plainText(doc), '<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n<b>negrito?</b>');
    assert.ok(doc.every((block) => block.c.every((span) => span.t === 'text')));
});

test('endereços: link só web, mail ou do próprio site; imagem só do site ou https; vídeo só YouTube e Vimeo', () => {
    for (const bad of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', ' javascript:alert(1)', 'data:text/html,<b>', 'vbscript:x', '//evil.example', '/\\evil.example', '/%5Cevil.example', '/%5cevil.example', '\\\\evil.example', '/a\\b', 'file:///etc/passwd', 'java\nscript:x']) {
        assert.equal(safeHref(bad), null, bad);
        const [block] = parseRich(`[clique](${bad.replace(/\s/g, '')})`);
        assert.ok(block.c.every((span) => span.t !== 'link'), `sem link para ${bad}`);
    }
    for (const good of ['https://mjrp-lab.com.br', 'http://a.b', 'mailto:a@b.c', '/concept', '#historia']) assert.equal(safeHref(good), good);
    assert.equal(safeImage('/media/text/a.jpg'), '/media/text/a.jpg');
    assert.equal(safeImage('https://cdn.example/a.jpg'), 'https://cdn.example/a.jpg');
    for (const bad of ['http://x/a.jpg', 'javascript:x', 'data:image/png;base64,AAAA', '//x/a.jpg', '/a.jpg" onerror="x']) assert.equal(safeImage(bad), null, bad);
    assert.deepEqual(parseRich('![descrição](javascript:alert(1))'), [p(t('descrição'))]);
    assert.deepEqual(parseRich('![descrição](data:image/png;base64,AAAA)'), [p(t('descrição'))]);
    assert.deepEqual(videoOf('https://youtu.be/dQw4w9WgXcQ'), { provider: 'youtube', id: 'dQw4w9WgXcQ' });
    assert.deepEqual(videoOf('https://www.youtube.com/shorts/dQw4w9WgXcQ'), { provider: 'youtube', id: 'dQw4w9WgXcQ' });
    assert.deepEqual(videoOf('https://player.vimeo.com/video/76979871'), { provider: 'vimeo', id: '76979871' });
    for (const bad of ['https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ', 'https://evil.example/youtube.com/watch?v=dQw4w9WgXcQ', 'https://www.youtube.com/watch?v=<script>', 'javascript://youtube.com/%0aalert(1)', 'https://vimeo.com/abc']) {
        assert.equal(videoOf(bad), null, bad);
    }
    // Um vídeo de outro endereço vira imagem só se o endereço for de imagem segura; aqui não é, e fica a legenda.
    assert.deepEqual(parseRich('![vídeo](https://evil.example/watch?v=x)'), [{ t: 'image', src: 'https://evil.example/watch?v=x', alt: 'vídeo', caption: '', wide: false }]);
    assert.deepEqual(parseRich('[Livro](/livro/../admin "livro")'), [p({ t: 'link', href: '/livro/../admin', c: [t('Livro')] })]);
});

test('lista aninhada sobe, item com quebra, lista solta e citação de vários parágrafos', () => {
    assert.deepEqual(parseRich('- a\n  - b\n- c'), [{ t: 'ul', c: [[t('a')], [t('b')], [t('c')]] }]);
    assert.deepEqual(parseRich('1. a\n\n2. b'), [{ t: 'ol', c: [[t('a')], [t('b')]] }]);
    assert.deepEqual(parseRich('- a\n  continua'), [{ t: 'ul', c: [[t('a'), { t: 'br' }, t('continua')]] }]);
    assert.deepEqual(parseRich('> um\n>\n> dois'), [{ t: 'quote', c: [[t('um')], [t('dois')]] }]);
    assert.deepEqual(parseRich('texto\n- item'), [p(t('texto')), { t: 'ul', c: [[t('item')]] }]);
    assert.deepEqual(parseRich('texto\n2. não interrompe'), [p(t('texto'), { t: 'br' }, t('2. não interrompe'))]);
});

test('o rodapé do campo: palavras, minutos e mídias', () => {
    const doc = parseRich('Um dois três.\n\n![Foto](/a.jpg)\n\n[Livro](/livro/livro "livro")');
    assert.deepEqual(countOf(doc), { words: 3, minutes: 1, media: 2 });
});

test('entrada patológica termina rápido', () => {
    // F136: o limite é de tempo de CPU do processo, não de relógio: com o gate rodando dezenas de testes de navegador ao mesmo
    // tempo, a mesma entrada levava 3 s de relógio e 0,5 s de trabalho. O que se guarda (nada exponencial) segue igual.
    const started = process.cpuUsage();
    parseRich('*'.repeat(20000) + '\n' + '['.repeat(5000) + '_a'.repeat(5000) + '=='.repeat(3000));
    const used = process.cpuUsage(started);
    const ms = (used.user + used.system) / 1000;
    assert.ok(ms < 2000, `${ms.toFixed(0)} ms de CPU`);
});

test('ida e volta com 3000 documentos aleatórios', () => {
    let seed = 128;
    const rand = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
    const pick = (list) => list[rand(list.length)];
    const WORDS = ['a', 'palavra', 'snake_case', '2*3', ' ', '  ', 'x^2', '~200', '[n]', '!', '#', '- ', '1. ', '==', '++', '\\', '`c`', 'é', 'fim.', '_', '*', '>', 'A_B', '(p)', '"q"'];
    const MARKS = ['strong', 'em', 'u', 's', 'mark', 'sup', 'sub'];
    const spans = (depth) => Array.from({ length: 1 + rand(4) }, () => {
        const kind = rand(10);
        if (kind < 5 || depth > 2) return t(Array.from({ length: 1 + rand(3) }, () => pick(WORDS)).join(''));
        if (kind === 5) return { t: 'br' };
        if (kind === 6) return { t: 'link', href: pick(['/concept', 'https://a.b/c_(d)', 'mailto:x@y.z']), c: spans(depth + 1) };
        if (kind === 7) return { t: 'code', v: pick(['x', 'a`b', ' y ']) };
        return { t: pick(MARKS), c: spans(depth + 1) };
    });
    for (let n = 0; n < 3000; n++) {
        const doc = Array.from({ length: 1 + rand(3) }, () => {
            const kind = rand(8);
            if (kind < 3) return p(...spans(0));
            if (kind === 3) return { t: pick(['lead', 'h3']), c: spans(0) };
            if (kind === 4) return { t: pick(['quote', 'callout']), c: [spans(0), spans(0)] };
            if (kind === 5) return { t: pick(['ul', 'ol']), c: [spans(0), spans(0)] };
            if (kind === 6) return { t: 'image', src: '/m/a.jpg', alt: pick(['Foto [1]', 'a"b', 'x\\y']), caption: pick(['', 'Leg "a"', 'c\\d']), wide: !!rand(2) };
            return { t: 'book', slug: 'atomic-habits', title: pick(['Atomic [Habits]', 'Mind\\set']) };
        });
        const normal = normalizeDoc(doc);
        const md = toMarkdown(normal);
        // Duas listas do mesmo tipo seguidas se juntam: a forma única delas é uma lista só.
        const merged = normal.reduce((out, block) => {
            const last = out[out.length - 1];
            if (last && block.t === last.t && (block.t === 'ul' || block.t === 'ol')) { last.c = [...last.c, ...block.c]; return out; }
            out.push(structuredClone(block));
            return out;
        }, []);
        assert.deepEqual(parseRich(md), merged, `documento ${n}:\n${JSON.stringify(doc)}\n---\n${md}`);
    }
});
