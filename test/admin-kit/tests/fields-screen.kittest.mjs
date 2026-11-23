// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
// The field, the image slot and the translate piece as the author uses them (F332, slice 1b): write in a language, change
// the tab, pass the limit, the required left empty, the phrase with the marker, the translation asked, reviewed, accepted
// and refused, and an image chosen, refused, cut, sent, taken back and removed. Drawn down to the elements
// (`support/deep-render.mjs`) over a schema that turns every option of a field and of an image on; `portraits/` keeps the
// draw of before the split.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import { SKIP, importComponent } from './support/client-harness.mjs';
import { all, createRoot, installDeepRender, portraits, tags, textOf } from './support/deep-render.mjs';

installDeepRender();

let SectionView, KitContext, portrait;
const browser = {
    requestAnimationFrame: (callback) => { callback(0); return 1; }, cancelAnimationFrame() {}, scrollTo() {},
    addEventListener() {}, removeEventListener() {}, innerHeight: 0, scrollY: 0,
    document: { getElementById: () => null, querySelector: () => null, documentElement: { scrollHeight: 0 }, addEventListener() {}, removeEventListener() {} },
};
const kept = {};
const realUrl = { create: URL.createObjectURL, revoke: URL.revokeObjectURL };
const urls = { made: 0, revoked: [] };
before(async () => {
    if (SKIP) return;
    ({ SectionView } = await importComponent('components/SectionView.tsx'));
    ({ KitContext } = await importComponent('components/context.ts'));
    portrait = await portraits(path.join(import.meta.dirname, 'portraits', 'fields.json'));
    for (const key of Object.keys(browser)) { kept[key] = Object.getOwnPropertyDescriptor(globalThis, key); globalThis[key] = browser[key]; }
    URL.createObjectURL = () => `blob:${++urls.made}`;
    URL.revokeObjectURL = (url) => { urls.revoked.push(url); };
});
after(() => {
    for (const key of Object.keys(kept)) { if (kept[key]) Object.defineProperty(globalThis, key, kept[key]); else delete globalThis[key]; }
    URL.createObjectURL = realUrl.create;
    URL.revokeObjectURL = realUrl.revoke;
});

const words = { title: 'The logo', upload: 'Send the logo', replace: 'Send another logo', newMark: 'new logo', pending: 'Waits for the build', inUse: 'In use', stays: 'The logo stays.', sentNote: 'Sent. At the next build.' };
const schema = {
    name: 'Fields', languages: ['en', 'pt'], states: { ok: { label: 'checked', tone: 'accent' } }, editedState: 'touched',
    marker: { key: 'company', token: '{company}', mark: { key: 'brand', group: 'Top', name: 'The box' } },
    sections: [
        { id: 'texts', path: 'texts', title: 'Texts', blocks: [{ id: 'texts', title: 'Texts', elements: [
            { kind: 'field', id: 'company', label: 'Company name', key: 'company', type: 'short', required: true, limit: 12, where: ['Top: Founder, {value}', 'Tab'] },
            { kind: 'field', id: 'line', label: 'Line', key: 'line', type: 'short', marked: true, badge: 'draft', hint: 'One line.', placeholder: 'A line' },
            { kind: 'field', id: 'story', label: 'Story', key: 'story', type: 'long', marked: true },
            { kind: 'field', id: 'note', label: 'Note', key: 'note', type: 'long', limit: 10, required: true },
            { kind: 'field', id: 'site', label: 'Site', key: 'site', type: 'link', single: true, quiet: true, where: ['Foot'] },
            { kind: 'field', id: 'years', label: 'Years', key: 'years', type: 'number', single: true },
            { kind: 'field', id: 'tab-pt', label: 'Tab title', key: 'tab', type: 'short', language: 'pt', required: true },
            { kind: 'field', id: 'synopsis', label: 'Synopsis', key: 'synopsis', type: 'short', pair: { pt: 'synopsis', en: 'synopsis_en' } },
            { kind: 'flag', id: 'show', label: 'Show the photo', key: 'show', requires: 'photo', hint: 'Needs a photo.' },
        ] }] },
        { id: 'images', path: 'images', title: 'Images', blocks: [{ id: 'images', title: 'Images', elements: [
            { kind: 'image', id: 'photo', label: 'Photo', key: 'photo', slot: 'photo' },
            { kind: 'image', id: 'icon', label: 'Icon', key: 'icon', slot: 'icon', square: true, small: true, buildNote: true, standard: { src: '/standard.png', text: 'The one the code carries.' } },
            { kind: 'image', id: 'logo', label: 'Logo', key: 'logo', slot: 'logo', square: true, buildNote: true, quiet: true, standard: { src: '/logo.png', text: 'The standard logo.' }, words },
            { kind: 'image', id: 'screen', label: 'Screen', key: 'screen', slot: 'screen', wide: true, buildNote: true },
        ] }] },
    ],
};
const content = () => ({
    company: { en: 'Acme', pt: '', state: 'ok' }, brand: { en: '' }, line: { en: 'We are {company}', pt: '' }, story: { en: 'Acme began', pt: 'A {company} nasceu' },
    note: { en: 'far too long a note', pt: 'curta' }, site: 'https://acme.test', years: '12', tab: { pt: '' }, synopsis: 'Em português', synopsis_en: '',
    screen: { src: '/img/1700-screen.png', width: 1600, height: 1000, bytes: 2 * 1024 * 1024, position: 'top' }, icon: { src: '/img/1700-icon.png' },
});
const nested = (own = {}) => new Proxy(own, { get: (target, key) => (key in target ? target[key] : `«${String(key)}»`) });
const translateWords = nested({ languages: { en: 'English', pt: 'Portuguese' }, reasons: nested(), from: 'Translate from {language}', nothing: 'Nothing in {language}', original: 'Original ({language})', suggestion: 'Suggestion ({language})', overLimit: '{count} over', failed: 'Failed: {reason}' });
const required = { legend: 'required', rest: 'the rest', missing: 'Missing:', nothingSaved: 'Nothing saved.', field: 'Required.', fieldEn: 'Required in English.', notSaved: 'Not saved' };
const textsOf = (extra = {}) => new Proxy({ problems: { 'too-long': 'Over {limit}' }, measure: '{width} × {height} px · {size}', cropNeeded: '{width} × {height} is {ratio}, the slot is {target}', marker: nested({ hint: '{count} places', first: 'First word: {word}', fix: 'Use {token}', count: '{count} places', goTo: 'Go to {name}', more: '{count} more' }), required, translate: translateWords, ...extra },
    { get: (target, key) => (key === 'rich' ? undefined : key in target ? target[key] : `«${String(key)}»`) });

function screen(sectionId, { problems = [], language = 'en', texts = textsOf(), ports = {} } = {}) {
    const state = { values: content(), checked: [], sent: [], asked: [] };
    const allPorts = {
        texts, imageRule: (slot) => `rule of ${slot}`, hrefOf: (p) => `/kit/${p}`, signInHref: '/in',
        describeImage: (slot, image) => (image.width ? [] : ['no size']),
        checkImage: async (slot, file) => { state.checked.push([slot, file.name]); return { ok: true }; },
        uploadImage: async (slot, file) => { state.sent.push([slot, file.name]); return { ok: true, value: { src: `/img/1800-${file.name}`, width: 800, height: 600, bytes: 512 } }; },
        translate: async (text, target) => { state.asked.push([text, target]); return { ok: true, value: `${text} (${target})` }; },
        ...ports,
    };
    const Host = () => ({ type: KitContext.Provider, props: {
        value: { schema, ports: allPorts, language, extensions: {}, problems, go() {}, all: state.values, saved: content() },
        children: { type: SectionView, props: { section: schema.sections.find((section) => section.id === sectionId), values: state.values, onChange: (next) => { state.values = next; } } },
    } });
    return { root: createRoot({ type: Host, props: {} }), state };
}
const click = (element) => element.props.onClick({ preventDefault() {} });
const field = (tree, key) => { const hit = all(tree, (node) => node.props?.id === `akf-${key}`)[0]; assert.ok(hit, `the field ${key} is on the screen`); return hit; };
const box = (holder) => all(holder, (node) => node.type === 'input' || node.type === 'textarea' || node.type === 'rich-text-field')[0];
const write = (holder, value) => (box(holder).type === 'rich-text-field' ? box(holder).props.onChange(value) : box(holder).props.onChange({ target: { value } }));
const button = (holder, text) => { const hit = tags(holder, 'button', text)[0]; assert.ok(hit, `the button «${text}» is there`); return hit; };

test('os campos de texto: cada tipo, o idioma fixo, o par de chaves, o limite passado e o texto sem tradução', { skip: SKIP }, () => {
    const { root } = screen('texts');
    const tree = root.draw();
    portrait.same('texts in English', tree);
    assert.deepEqual(['company', 'line', 'story', 'note', 'site', 'years'].map((key) => [box(field(tree, key)).type, box(field(tree, key)).props.type]),
        [['input', 'text'], ['input', 'text'], ['rich-text-field', undefined], ['textarea', undefined], ['input', 'url'], ['input', 'text']]);
    assert.equal(box(field(tree, 'note')).props['aria-invalid'], true, 'o limite passado marca o campo');
    assert.equal(box(field(tree, 'years')).props.inputMode, 'decimal');
    portrait.same('texts in Portuguese', screen('texts', { language: 'pt' }).root.draw());
    portrait.same('texts with no marker words, no translation, no required words', screen('texts', { texts: textsOf({ marker: undefined, translate: undefined, required: undefined, paragraphsHint: 'Blank line: paragraph.' }), ports: { translate: undefined } }).root.draw());
});

test('escrever grava no idioma aberto com o estado de editado; a aba troca o idioma; o valor único e o par gravam na chave certa', { skip: SKIP }, () => {
    const { root, state } = screen('texts');
    let tree = root.draw();
    write(field(tree, 'company'), 'Acme Inc');
    assert.deepEqual(state.values.company, { en: 'Acme Inc', pt: '', state: 'touched' });
    click(all(field(tree, 'company'), (node) => node.props?.role === 'tab' && node.props['aria-label'] === 'Portuguese, empty')[0]);
    tree = root.draw();
    assert.equal(box(field(tree, 'company')).props.placeholder, '«untranslated»');
    write(field(tree, 'company'), 'Acme Ltda');
    assert.equal(state.values.company.pt, 'Acme Ltda');
    write(field(tree, 'site'), 'https://other.test');
    assert.equal(state.values.site, 'https://other.test');
    write(field(tree, 'synopsis'), 'In English');
    assert.equal(state.values.synopsis_en, 'In English');
    assert.equal(state.values.synopsis, 'Em português');
    write(field(tree, 'story'), 'A new story');
    assert.equal(state.values.story.en, 'A new story');
    write(field(tree, 'tab@pt'), 'Aba');
    assert.equal(state.values.tab.pt, 'Aba');
    const flag = all(tree, (node) => node.type === 'input' && node.props.type === 'checkbox')[0];
    assert.equal(flag.props.disabled, true, 'a chave espera a imagem');
});

test('a frase com o marcador: o botão põe o marcador no fim, o nome escrito à mão é trocado, e a lista de lugares leva ao bloco', { skip: SKIP }, () => {
    const { root, state } = screen('texts');
    let tree = root.draw();
    click(button(field(tree, 'story'), '«insert» {company}'));
    assert.equal(state.values.story.en, 'Acme began {company}', 'no texto rico, no fim, com um espaço');
    tree = root.draw();
    assert.equal(all(field(tree, 'story'), (node) => node.props?.['data-marker-literal'] === '').length, 1, 'o nome escrito à mão é avisado');
    click(button(field(tree, 'story'), 'Use {company}'));
    assert.equal(state.values.story.en, '{company} began {company}');
    tree = root.draw();
    assert.equal(all(field(tree, 'story'), (node) => node.props?.['data-marker-literal'] === '').length, 0);
    click(button(field(tree, 'line'), '«insert» {company}'));
    assert.equal(state.values.line.en, 'We are {company}{company}', 'na caixa simples, onde está o cursor (aqui, o fim)');
    assert.equal(textOf(all(tree, (node) => String(node.props?.className).includes('ak-mk-where'))[0]).startsWith('«where»'), true);
});

test('o obrigatório vazio e o limite: a frase sob o campo, a borda, e a mensagem do problema com o limite', { skip: SKIP }, () => {
    const problems = [{ code: 'required', path: ['company'], language: 'en' }, { code: 'required', path: ['tab'], language: 'pt' }, { code: 'too-long', path: ['note'], language: 'en', limit: 10 }, { code: 'too-long', path: ['note'], language: 'pt', limit: 10 }, { code: 'odd', path: ['line'] }];
    const tree = screen('texts', { problems }).root.draw();
    portrait.same('texts refused', tree);
    assert.equal(field(tree, 'company').props.className, 'ak-f rq-bad');
    assert.equal(textOf(all(field(tree, 'company'), (node) => node.props?.className === 'rq-msg')[0]), 'Required in English.');
    assert.equal(textOf(all(field(tree, 'tab@pt'), (node) => node.props?.className === 'rq-msg')[0]), 'Required.');
    assert.deepEqual(all(field(tree, 'note'), (node) => node.props?.className === 'ak-err-t').map(textOf), ['Over 10'], 'só o problema do idioma na tela');
    assert.deepEqual(all(field(tree, 'line'), (node) => node.props?.className === 'ak-err-t').map(textOf), ['odd']);
    portrait.same('texts refused, no required words', screen('texts', { problems, texts: textsOf({ required: undefined }) }).root.draw());
});

test('traduzir: pedir, revisar, mudar a sugestão, passar do limite, aceitar; descartar; e cada falha com o motivo dela', { skip: SKIP }, async () => {
    const { root, state } = screen('texts', { language: 'pt' });
    let tree = root.draw();
    assert.equal(textOf(all(field(tree, 'story'), (node) => node.props?.className === 'ak-tr')[0]), 'Translate from English');
    click(button(field(tree, 'company'), 'Translate from English'));
    assert.equal(button(field(root.draw(), 'company'), '«busy»').props.disabled, true);
    tree = await root.settle();
    assert.deepEqual(state.asked, [['Acme', 'pt']]);
    portrait.same('a translation under review', tree);
    const suggestion = () => tags(field(root.draw(), 'company'), 'textarea')[0];
    assert.equal(suggestion().props.value, 'Acme (pt)');
    suggestion().props.onChange({ target: { value: 'Acme, a very long name' } });
    assert.equal(button(field(root.draw(), 'company'), '«accept»').props.disabled, true, 'acima do limite não aceita');
    assert.equal(textOf(all(field(root.draw(), 'company'), (node) => String(node.props?.className).includes('ak-tr-over'))[0]), '10 over');
    suggestion().props.onChange({ target: { value: 'Acme BR' } });
    click(button(field(root.draw(), 'company'), '«accept»'));
    assert.equal(state.values.company.pt, 'Acme BR');
    assert.ok(button(field(root.draw(), 'company'), 'Translate from English'), 'aceita, a peça volta ao botão');
    // Discard.
    click(button(field(root.draw(), 'line'), 'Translate from English'));
    tree = await root.settle();
    click(button(field(tree, 'line'), '«discard»'));
    assert.equal(state.values.line.pt, '');
    assert.equal(tags(field(root.draw(), 'line'), 'textarea').length, 0);
    // Each failure says why, and offers to try again.
    for (const [answer, reason] of [[{ ok: false, failure: 'session-expired' }, '«session»'], [{ ok: false, failure: 'refused', message: 'credit' }, '«credit»'], [{ ok: false, failure: 'network' }, '«service»']]) {
        const answers = [answer];
        const failing = screen('texts', { language: 'pt', ports: { translate: async (text) => answers.shift() ?? { ok: true, value: `${text}!` } } });
        click(button(field(failing.root.draw(), 'company'), 'Translate from English'));
        tree = await failing.root.settle();
        assert.equal(textOf(all(field(tree, 'company'), (node) => node.props?.role === 'alert')[0]), `Failed: ${reason}«retry»`);
        click(button(all(field(tree, 'company'), (node) => node.props?.role === 'alert')[0], '«retry»'));
        tree = await failing.root.settle();
        assert.equal(tags(field(tree, 'company'), 'textarea')[0].props.value, 'Acme!');
    }
});

const file = (name) => new File(['x'], name, { type: 'image/png' });
const slot = (tree, label) => all(tree, (node) => node.props?.className === 'ak-f' && textOf(all(node, (inner) => inner.props?.className === 'ak-lb')[0] ?? '').startsWith(label))[0];
const choose = (holder, picked) => all(holder, (node) => node.type === 'input' && node.props.type === 'file')[0].props.onChange({ target: { files: picked ? [picked] : [], value: 'x' } });

test('a imagem: as quatro formas do espaço, com e sem imagem', { skip: SKIP }, () => {
    const tree = screen('images').root.draw();
    portrait.same('images', tree);
    assert.equal(textOf(button(slot(tree, 'Photo'), '«upload»')), '«upload»');
    assert.ok(button(slot(tree, 'Icon'), '«backToStandard»'));
    assert.ok(button(slot(tree, 'Logo'), 'Send the logo'));
    assert.ok(button(slot(tree, 'Screen'), '«removeImage»'));
});

test('escolher uma imagem: o veredito do projeto, o envio, a medida no aviso; a recusa e a falha dizem por quê', { skip: SKIP }, async () => {
    const { root, state } = screen('images');
    choose(slot(root.draw(), 'Photo'), null);
    assert.deepEqual(state.checked, [], 'sem arquivo, nada acontece');
    choose(slot(root.draw(), 'Photo'), file('me.png'));
    let tree = await root.settle();
    assert.deepEqual([state.checked, state.sent], [[['photo', 'me.png']], [['photo', 'me.png']]]);
    assert.deepEqual(state.values.photo, { src: '/img/1800-me.png', width: 800, height: 600, bytes: 512 });
    assert.equal(textOf(all(slot(tree, 'Photo'), (node) => node.props?.role === 'status')[0]), '«sent» 800 × 600 px · 512 B «sentNext»');
    portrait.same('images, a photo sent', tree);
    click(button(slot(tree, 'Photo'), '«removeImage»'));
    assert.equal(state.values.photo, undefined);
    const refusing = screen('images', { ports: { checkImage: async () => ({ ok: false, message: 'Too small.' }) } });
    choose(slot(refusing.root.draw(), 'Photo'), file('me.png'));
    choose(slot(refusing.root.draw(), 'Icon'), file('i.png'));
    choose(slot(refusing.root.draw(), 'Logo'), file('l.png'));
    tree = await refusing.root.settle();
    assert.deepEqual(['Photo', 'Icon', 'Logo'].map((label) => textOf(all(slot(tree, label), (node) => node.props?.role === 'alert')[0])), ['«notSent» Too small.', '«notSent» Too small. «iconStays»', '«notSent» Too small. The logo stays.']);
    assert.deepEqual(refusing.state.sent, []);
    const failing = screen('images', { ports: { uploadImage: async () => ({ ok: false, failure: 'network' }) } });
    choose(slot(failing.root.draw(), 'Photo'), file('me.png'));
    choose(slot(failing.root.draw(), 'Logo'), file('l.png'));
    tree = await failing.root.settle();
    assert.deepEqual(['Photo', 'Logo'].map((label) => textOf(all(slot(tree, label), (node) => node.props?.role === 'alert')[0])), ['«notSent» «saveFailed»', '«notSent» «saveFailed» The logo stays.']);
    assert.equal(failing.state.values.photo, undefined);
});

test('fora da proporção: o aviso pede o ponto do recorte, a moldura segue o botão, e o envio leva o ponto', { skip: SKIP }, async () => {
    const { root, state } = screen('images', { ports: { checkImage: async () => ({ ok: true, crop: true, width: 800, height: 1200, ratio: [16, 10] }) } });
    choose(slot(root.draw(), 'Photo'), file('tall.png'));
    let tree = await root.settle();
    portrait.same('images, the crop asked', tree);
    assert.equal(textOf(all(slot(tree, 'Photo'), (node) => node.props?.role === 'status')[0]), '800 × 1200 is 2:3, the slot is 16:10«cropTop»«cropCenter»«cropBottom»');
    assert.deepEqual(state.sent, []);
    button(slot(tree, 'Photo'), '«cropBottom»').props.onMouseEnter();
    tree = root.draw();
    assert.equal(all(slot(tree, 'Photo'), (node) => node.props?.className === 'ak-crop')[0].props['data-point'], 'bottom');
    button(slot(tree, 'Photo'), '«cropCenter»').props.onFocus();
    tree = root.draw();
    assert.equal(button(slot(tree, 'Photo'), '«cropCenter»').props['aria-pressed'], true);
    click(button(slot(tree, 'Photo'), '«cropCenter»'));
    tree = await root.settle();
    assert.equal(state.values.photo.position, 'center');
    assert.equal(all(slot(tree, 'Photo'), (node) => node.props?.className === 'ak-crop').length, 0);
    assert.ok(urls.revoked.length > 0, 'a prévia do recorte é solta');
    // No measure from the project: the notice says so, and the frame takes the slot's own proportion.
    const blind = screen('images', { ports: { checkImage: async () => ({ ok: true, crop: true }) } });
    choose(slot(blind.root.draw(), 'Photo'), file('tall.png'));
    assert.equal(textOf(all(slot(await blind.root.settle(), 'Photo'), (node) => node.props?.role === 'status')[0]), '? × ? is ?, the slot is 16:10«cropTop»«cropCenter»«cropBottom»');
});

test('a imagem que só vale no próximo build: a marca de nova, a prévia, e «desfazer» devolve a de antes', { skip: SKIP }, async () => {
    const { root, state } = screen('images');
    for (const [label, name] of [['Icon', 'i.png'], ['Logo', 'l.png'], ['Screen', 's.png']]) choose(slot(root.draw(), label), file(name));
    let tree = await root.settle();
    portrait.same('images, three sent that wait for the build', tree);
    assert.equal(textOf(all(slot(tree, 'Icon'), (node) => node.props?.role === 'status')[0]), '«sentBuild»');
    assert.equal(textOf(all(slot(tree, 'Logo'), (node) => node.props?.role === 'status')[0]), 'Sent. At the next build.');
    assert.equal(all(slot(tree, 'Screen'), (node) => node.props?.role === 'status').length, 0);
    assert.match(tags(slot(tree, 'Screen'), 'img')[0].props.src, /^blob:/);
    // A second file over the first keeps the image of before the first as the way back.
    choose(slot(tree, 'Screen'), file('s2.png'));
    tree = await root.settle();
    click(button(slot(tree, 'Screen'), '«undo»'));
    assert.equal(state.values.screen.src, '/img/1700-screen.png');
    click(button(slot(tree, 'Logo'), '«undo»'));
    assert.equal(state.values.logo, undefined);
    tree = root.draw();
    assert.equal(tags(slot(tree, 'Logo'), 'button', '«undo»').length, 0);
    assert.ok(button(slot(tree, 'Logo'), 'Send the logo'));
});
