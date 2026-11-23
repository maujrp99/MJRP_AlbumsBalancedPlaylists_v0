// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
// The panel as the author uses it (F332, TASK-27; the 2nd critique asked for more than a still portrait): the content read,
// a click on the menu, a text changed, the save with the version read, each failure of a save and of a read with its notice
// and its way out, the required left empty, the language, the tone and the publication card. Every component is drawn down to
// its elements (`support/deep-render.mjs`), so the test holds whatever the components the screen is made of; `portraits/`
// keeps the draw of each state as it was before the screens were split (complexity 10, slice 1b).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import { SKIP, importComponent } from './support/client-harness.mjs';
import { createRoot, installDeepRender, portraits, tags, textOf, all } from './support/deep-render.mjs';

installDeepRender();

let KitApp, EXAMPLE_SCHEMA, memoryNavigation, portrait;
const browser = {
    requestAnimationFrame: (callback) => { callback(0); return 1; }, cancelAnimationFrame() {}, scrollTo() {},
    addEventListener() {}, removeEventListener() {}, innerHeight: 0, scrollY: 0,
    setInterval: () => 1, clearInterval() {},
    document: { getElementById: () => null, querySelector: () => null, documentElement: { scrollHeight: 0 }, addEventListener() {}, removeEventListener() {} },
};
const saved = {};
before(async () => {
    for (const key of Object.keys(browser)) { saved[key] = Object.getOwnPropertyDescriptor(globalThis, key); globalThis[key] = browser[key]; }
    if (SKIP) return;
    ({ KitApp } = await importComponent('components/KitApp.tsx'));
    ({ EXAMPLE_SCHEMA } = await import('./example/example-schema.mjs'));
    ({ memoryNavigation } = await import('./example/example-navigation.mjs'));
    portrait = await portraits(path.join(import.meta.dirname, 'portraits', 'kit-app.json'));
});
after(() => {
    for (const key of Object.keys(browser)) { if (saved[key]) Object.defineProperty(globalThis, key, saved[key]); else delete globalThis[key]; }
});

const words = (extra = {}) => new Proxy({ problems: {}, unsaved: '{count} unsaved', ...extra }, { get: (target, key) => (key === 'rich' ? undefined : key in target ? target[key] : `«${String(key)}»`) });
const required = { legend: 'required', rest: 'the rest', missing: 'Missing:', nothingSaved: 'Nothing saved.', field: 'Required.', fieldEn: 'Required in English.', notSaved: 'Not saved' };
const content = () => ({
    headline: { en: 'Good food', es: '', state: 'ok' },
    recipes: [
        { id: 'a', live: true, name: { en: 'Soup' }, time: '20 min' },
        { id: 'b', live: false, name: { en: 'Bread' } },
        { id: 'c', live: true, name: { en: 'Cake' }, style: 'quick', steps: [{ id: 's', text: { en: 'Mix' } }] },
    ],
});

/** The panel over the cookbook, with ports that remember what they were asked. */
function panel({ at = { path: '' }, texts = words({ required }), ports = {}, schema = EXAMPLE_SCHEMA, values = content(), props = {} } = {}) {
    const calls = { load: 0, saves: [], tones: [] };
    const navigation = memoryNavigation(at);
    const allPorts = {
        texts, navigation, imageRule: (slot) => `rule of ${slot}`, hrefOf: (p, item) => `/kit/${p}${item ? `/${item}` : ''}`, signInHref: '/in',
        load: async () => { calls.load += 1; return { ok: true, value: { values, version: 'v1' } }; },
        save: async (sent, version) => { calls.saves.push({ sent, version }); return { ok: true, value: { version: `v${calls.saves.length + 1}` } }; },
        ...ports,
    };
    const root = createRoot({ type: KitApp, props: {
        schema, ports: allPorts, brand: { name: 'Cookbook', small: 'admin' }, group: 'Sections',
        overview: { title: 'Overview', subtitle: 'All of it' }, tone: 'day', onTone: (tone) => calls.tones.push(tone), ...props,
    } });
    return { root, calls, navigation };
}
const click = (element) => element.props.onClick({ preventDefault() {} });
const button = (tree, text) => { const hit = tags(tree, 'button', text)[0]; assert.ok(hit, `the button «${text}» is on the screen`); return hit; };
const status = (tree) => textOf(all(tree, (node) => node.props?.['aria-live'] === 'polite' && String(node.props.className).startsWith('ak-savest'))[0]);
const headline = (tree) => all(tree, (node) => (node.type === 'input' || node.type === 'textarea') && node.props.value === 'Good food')[0];
const type = (field, value) => field.props.onChange({ target: { value }, currentTarget: { value } });

test('antes de ler, a tela não mostra conteúdo nem deixa salvar; lido, mostra o mapa do site', { skip: SKIP }, async () => {
    const { root, calls } = panel();
    const first = root.draw();
    portrait.same('loading', first);
    assert.equal(button(first, '«save»').props.disabled, true);
    const tree = await root.settle();
    portrait.same('overview', tree);
    assert.equal(calls.load, 1);
    assert.equal(textOf(tags(tree, 'h1')[0]), 'OverviewAll of it');
    assert.deepEqual(all(tree, (node) => node.props?.className === 'ak-map-row').map((row) => row.props.href), ['/kit/front', '/kit/recipes']);
    assert.equal(status(tree), '«saved»');
    root.unmount();
});

test('o clique no menu e no mapa vai pela porta, mostra a seção e marca o item do menu; ☰ abre e o clique fecha', { skip: SKIP }, async () => {
    const { root, navigation } = panel();
    let tree = await root.settle();
    click(button(tree, '☰ «menu»'));
    tree = root.draw();
    assert.equal(all(tree, (node) => node.props?.className === 'ak')[0].props['data-menu'], 'open');
    click(tags(tree, 'a', 'Recipes')[0]);
    tree = await root.settle();
    assert.equal(all(tree, (node) => node.props?.className === 'ak')[0].props['data-menu'], undefined);
    assert.deepEqual(navigation.moves, [{ target: { path: 'recipes' }, replace: false }]);
    assert.equal(textOf(tags(tree, 'h1')[0]), 'Recipes');
    assert.equal(tags(tree, 'a', 'Recipes')[0].props['aria-current'], 'page');
    portrait.same('recipes', tree);
    // The map's row, from the overview.
    click(tags(tree, 'a', 'Overview')[0]);
    tree = await root.settle();
    click(all(tree, (node) => node.props?.className === 'ak-map-row')[0]);
    tree = await root.settle();
    assert.equal(textOf(tags(tree, 'h1')[0]), 'Front pageWhat a visitor sees first');
    assert.deepEqual(navigation.where(), { path: 'front' });
    portrait.same('front', tree);
    // The back button of the browser: the router tells, the panel follows.
    navigation.back();
    tree = await root.settle();
    assert.equal(textOf(tags(tree, 'h1')[0]), 'OverviewAll of it');
    root.unmount();
});

test('o submenu leva ao bloco pela porta e o marca', { skip: SKIP }, async () => {
    const schema = { ...EXAMPLE_SCHEMA, sections: EXAMPLE_SCHEMA.sections.map((section) => (section.id === 'front' ? { ...section, subnav: ['hero'], menuTitle: 'Front' } : section)) };
    const { root, navigation } = panel({ at: { path: 'front' }, schema });
    let tree = await root.settle();
    const sub = tags(tree, 'a', 'Hero').find((link) => link.props.href === '/kit/front#blk-hero');
    assert.equal(sub.props['aria-current'], undefined);
    click(sub);
    tree = await root.settle();
    assert.deepEqual(navigation.moves, [{ target: { path: 'front', block: 'blk-hero' }, replace: false }]);
    assert.equal(tags(tree, 'a', 'Hero').find((link) => link.props.href === '/kit/front#blk-hero').props['aria-current'], 'location');
    portrait.same('front with the submenu', tree);
    root.unmount();
});

test('a seção de um item leva o nome do item no título, e a lista que o guarda fica marcada no menu', { skip: SKIP }, async () => {
    const { root, navigation } = panel({ at: { path: 'recipe', itemId: 'c' } });
    let tree = await root.settle();
    assert.equal(textOf(tags(tree, 'h1')[0]), 'CakeA recipe');
    assert.equal(tags(tree, 'a', 'Recipes')[0].props['aria-current'], 'page');
    portrait.same('one recipe', tree);
    click(button(tree, '← Recipes'));
    tree = await root.settle();
    assert.deepEqual(navigation.moves, [{ target: { path: 'recipes', block: 'blk-recipes' }, replace: false }]);
    root.unmount();
});

test('mudar um texto conta a alteração e libera Salvar; salvar grava com a versão lida e a seguinte com a nova', { skip: SKIP }, async () => {
    const { root, calls } = panel({ at: { path: 'front' } });
    let tree = await root.settle();
    assert.equal(button(tree, '«save»').props.disabled, true);
    type(headline(tree), 'Better food');
    tree = root.draw();
    assert.equal(status(tree), '«unsavedOne»');
    assert.equal(button(tree, '«save»').props.disabled, false);
    portrait.same('front with a change', tree);
    click(button(tree, '«save»'));
    assert.equal(status(root.draw()), '«saving»');
    tree = await root.settle();
    assert.equal(calls.saves.length, 1);
    assert.equal(calls.saves[0].version, 'v1');
    assert.equal(calls.saves[0].sent.headline.en, 'Better food');
    assert.equal(status(tree), '«saved»');
    assert.equal(button(tree, '«save»').props.disabled, true);
    const field = all(tree, (node) => (node.type === 'input' || node.type === 'textarea') && node.props.value === 'Better food')[0];
    type(field, 'Best food');
    tree = root.draw();
    click(button(tree, '«save»'));
    await root.settle();
    assert.equal(calls.saves[1].version, 'v2', 'a segunda gravação vai com a versão que a primeira devolveu');
    root.unmount();
});

test('duas alterações: a contagem no plural, e o interruptor de uma lista conta como alteração', { skip: SKIP }, async () => {
    const { root } = panel({ at: { path: 'front' } });
    let tree = await root.settle();
    type(headline(tree), 'Better food');
    tags(root.draw(), 'rich-text-field')[0].props.onChange('A new intro');
    tree = root.draw();
    assert.equal(status(tree), '2 unsaved');
    click(tags(tree, 'a', 'Recipes')[0]);
    tree = await root.settle();
    assert.equal(status(tree), '2 unsaved', 'trocar de seção não perde o que não foi salvo');
    click(all(tree, (node) => node.props?.role === 'switch')[0]);
    tree = root.draw();
    assert.equal(status(tree), '3 unsaved');
    portrait.same('recipes with changes', tree);
    root.unmount();
});

test('salvar com o obrigatório vazio: nada é gravado, o aviso nomeia o campo, o idioma leva a conta e o clique leva ao campo', { skip: SKIP }, async () => {
    const { root, calls, navigation } = panel({ at: { path: 'front' } });
    let tree = await root.settle();
    type(headline(tree), '');
    tree = root.draw();
    click(button(tree, '«save»'));
    tree = await root.settle();
    assert.equal(calls.saves.length, 0);
    assert.equal(status(tree), 'Not saved');
    portrait.same('front refused', tree);
    const notice = all(tree, (node) => node.props?.className === 'rq-miss')[0];
    assert.match(textOf(notice), /Missing:.*Headline.*Nothing saved\./);
    assert.equal(button(tree, 'EN').props['data-miss'], 1);
    assert.equal(button(tree, 'ES').props['data-miss'], undefined);
    // To the overview and back by the notice's link: the place of the field, through the port.
    click(tags(tree, 'a', 'Overview')[0]);
    tree = await root.settle();
    click(tags(all(tree, (node) => node.props?.className === 'rq-miss')[0], 'a')[0]);
    tree = await root.settle();
    assert.deepEqual(navigation.moves.at(-1), { target: { path: 'front', block: 'akf-headline' }, replace: false });
    assert.equal(button(tree, 'EN').props['aria-pressed'], true);
    root.unmount();
});

test('sem as palavras do obrigatório, a recusa mostra o resumo dos problemas', { skip: SKIP }, async () => {
    const { root } = panel({ at: { path: 'front' }, texts: words({ required: undefined, problems: { summary: '{count} problems' } }) });
    let tree = await root.settle();
    type(headline(tree), '');
    click(button(root.draw(), '«save»'));
    tree = await root.settle();
    assert.equal(textOf(all(tree, (node) => node.props?.role === 'alert')[0]), '1 problems');
    assert.equal(status(tree), '«unsavedOne»');
    portrait.same('front refused, no required words', tree);
    root.unmount();
});

const failing = (failure, message) => {
    const answers = [{ ok: false, failure, ...(message ? { message } : {}) }];
    return async () => answers.shift() ?? { ok: true, value: { version: 'v2' } };
};
const changeAndSave = async (root) => {
    type(headline(await root.settle()), 'Better food');
    click(button(root.draw(), '«save»'));
    return root.settle();
};

test('conflito: o aviso oferece recarregar, que lê de novo', { skip: SKIP }, async () => {
    const { root, calls } = panel({ at: { path: 'front' }, ports: { save: failing('conflict') } });
    let tree = await changeAndSave(root);
    portrait.same('save conflict', tree);
    assert.match(textOf(all(tree, (node) => node.props?.role === 'status' && String(node.props.className).includes('ak-notice'))[0]), /«conflict»/);
    click(button(tree, '«reload»'));
    tree = await root.settle();
    assert.equal(calls.load, 2);
    assert.equal(status(tree), '«saved»');
    assert.ok(headline(tree), 'o conteúdo lido de novo volta à tela');
    root.unmount();
});

test('sessão vencida: o aviso leva a entrar de novo', { skip: SKIP }, async () => {
    const { root } = panel({ at: { path: 'front' }, ports: { save: failing('session-expired') } });
    const tree = await changeAndSave(root);
    portrait.same('save session expired', tree);
    assert.equal(tags(tree, 'a', '«signIn»')[0].props.href, '/in');
    root.unmount();
});

test('recusa do servidor: a mensagem dele, ou a do kit', { skip: SKIP }, async () => {
    const first = panel({ at: { path: 'front' }, ports: { save: failing('refused', 'Too long') } });
    let tree = await changeAndSave(first.root);
    assert.equal(textOf(all(tree, (node) => node.props?.role === 'alert')[0]), 'Too long');
    first.root.unmount();
    const second = panel({ at: { path: 'front' }, ports: { save: failing('refused') } });
    tree = await changeAndSave(second.root);
    assert.equal(textOf(all(tree, (node) => node.props?.role === 'alert')[0]), '«refused»');
    portrait.same('save refused', tree);
    second.root.unmount();
});

test('falha ao gravar: «tentar de novo» grava de novo; mudar o texto tira o aviso', { skip: SKIP }, async () => {
    const calls = [];
    const save = async (sent, version) => { calls.push(version); return calls.length === 1 ? { ok: false, failure: 'network', message: 'offline' } : { ok: true, value: { version: 'v2' } }; };
    const { root } = panel({ at: { path: 'front' }, ports: { save } });
    let tree = await changeAndSave(root);
    portrait.same('save failed', tree);
    assert.equal(textOf(all(tree, (node) => node.props?.role === 'alert')[0]), '«saveFailed» offline«retry»');
    const field = all(tree, (node) => (node.type === 'input' || node.type === 'textarea') && node.props.value === 'Better food')[0];
    type(field, 'Other food');
    tree = root.draw();
    assert.equal(all(tree, (node) => node.props?.role === 'alert').length, 0, 'o aviso sai quando o autor volta a escrever');
    click(button(tree, '«save»'));
    tree = await root.settle();
    assert.deepEqual(calls, ['v1', 'v1']);
    assert.equal(status(tree), '«saved»');
    root.unmount();
});

test('falha ao gravar: o botão do aviso grava de novo', { skip: SKIP }, async () => {
    const calls = [];
    const save = async () => { calls.push(1); return calls.length === 1 ? { ok: false, failure: 'network' } : { ok: true, value: { version: 'v2' } }; };
    const { root } = panel({ at: { path: 'front' }, ports: { save } });
    let tree = await changeAndSave(root);
    assert.equal(textOf(all(tree, (node) => node.props?.role === 'alert')[0]), '«saveFailed»«retry»');
    click(button(tree, '«retry»'));
    tree = await root.settle();
    assert.equal(calls.length, 2);
    assert.equal(status(tree), '«saved»');
    root.unmount();
});

test('a leitura que falha diz «não carregou», nunca um conteúdo vazio, e tenta de novo', { skip: SKIP }, async () => {
    let asked = 0;
    const load = async () => { asked += 1; return asked === 1 ? { ok: false, failure: 'network', message: 'offline' } : { ok: true, value: { values: content(), version: 'v1' } }; };
    const { root } = panel({ at: { path: 'front' }, ports: { load } });
    let tree = await root.settle();
    portrait.same('load failed', tree);
    assert.equal(textOf(all(tree, (node) => node.props?.role === 'alert')[0]), '«loadFailed» offline«retry»');
    assert.equal(all(tree, (node) => node.type === 'input' || node.type === 'textarea').length, 0);
    assert.equal(button(tree, '«save»').props.disabled, true);
    click(button(tree, '«retry»'));
    tree = await root.settle();
    assert.equal(asked, 2);
    assert.ok(headline(tree));
    root.unmount();
});

test('o idioma e o tom: o botão do idioma troca o campo, o do tom pede o outro tom', { skip: SKIP }, async () => {
    const { root, calls } = panel({ at: { path: 'front' } });
    let tree = await root.settle();
    assert.equal(button(tree, 'EN').props['aria-pressed'], true);
    click(button(tree, 'ES'));
    tree = root.draw();
    assert.equal(button(tree, 'ES').props['aria-pressed'], true);
    assert.equal(headline(tree), undefined, 'em espanhol o título não tem o texto inglês');
    portrait.same('front in Spanish', tree);
    click(button(tree, '«night»'));
    assert.deepEqual(calls.tones, ['night']);
    const night = panel({ props: { tone: 'night' } });
    click(button(await night.root.settle(), '«day»'));
    assert.deepEqual(night.calls.tones, ['day']);
    night.root.unmount();
    root.unmount();
});

test('o cartão de publicação: aparece ao salvar, e segue o que a porta responde', { skip: SKIP }, async () => {
    const answers = [{ state: 'idle' }];
    const publication = async () => answers.at(-1);
    const { root } = panel({ at: { path: 'front' }, ports: { publication, publishingAfterSave: 'Saved. Publishing…' } });
    let tree = await root.settle();
    assert.equal(all(tree, (node) => node.props?.role === 'status' && node.type === 'div').length, 0);
    tree = await changeAndSave(root);
    const card = all(tree, (node) => node.props?.role === 'status' && node.type === 'div')[0];
    assert.equal(textOf(card), 'Saved. Publishing…');
    assert.equal(card.props.className, 'ak-notice');
    portrait.same('publishing after a save', tree);
    root.unmount();
    // A host with no build to follow gets no card.
    const none = panel({ at: { path: 'front' }, ports: { publication: async () => ({ state: 'idle', none: true }), publishingAfterSave: 'Saved. Publishing…' } });
    tree = await changeAndSave(none.root);
    assert.equal(all(tree, (node) => node.props?.role === 'status' && node.type === 'div').length, 0);
    none.root.unmount();
    // A failed publication, read at the start.
    const failed = panel({ at: { path: 'front' }, ports: { publication: async () => ({ state: 'failed', message: 'The build failed' }) } });
    tree = await failed.root.settle();
    assert.equal(all(tree, (node) => node.props?.role === 'status' && node.type === 'div')[0].props.className, 'ak-notice err');
    portrait.same('publication failed', tree);
    failed.root.unmount();
});

test('o rodapé do menu, a abertura do projeto e as seções arrumadas pelo conteúdo', { skip: SKIP }, async () => {
    const schema = { ...EXAMPLE_SCHEMA, arrange: (values) => (values.headline?.en === 'Good food' ? [...EXAMPLE_SCHEMA.sections].reverse() : EXAMPLE_SCHEMA.sections) };
    const { root } = panel({ schema, props: { foot: { type: 'a', props: { href: '/site', children: 'The site' } }, overview: { title: 'Overview', subtitle: 'All of it', lead: (values) => `${values.recipes.length} recipes` } } });
    const tree = await root.settle();
    assert.deepEqual(all(tree, (node) => node.props?.className === 'ak-map-row').map((row) => row.props.href), ['/kit/recipes', '/kit/front']);
    assert.equal(textOf(all(tree, (node) => node.props?.className === 'ak-side-end')[0]), 'The site');
    portrait.same('overview arranged, with foot and lead', tree);
    root.unmount();
});
