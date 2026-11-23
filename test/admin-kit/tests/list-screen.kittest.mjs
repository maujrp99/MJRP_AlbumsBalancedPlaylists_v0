// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
// The list, the section and the pieces of a block as the author uses them (F332, TASK-27): open and close a row, remove in
// two clicks, add, move, put on and off the air, the one in the spotlight, the role, pass to another list, pick an image
// already sent, drag; the section of one item with its way back; each kind of element. Drawn down to the elements
// (`support/deep-render.mjs`) over a schema that turns every option of a list on; `portraits/` keeps the draw of before the split.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import { SKIP, importComponent } from './support/client-harness.mjs';
import { all, createRoot, installDeepRender, portraits, tags, textOf } from './support/deep-render.mjs';

installDeepRender();

let SectionView, KitContext, portrait;
const timers = [];
const browser = {
    requestAnimationFrame: (callback) => { callback(0); return 1; }, cancelAnimationFrame() {}, scrollTo() {},
    addEventListener() {}, removeEventListener() {}, innerHeight: 0, scrollY: 0,
    setTimeout: (callback) => { timers.push(callback); return timers.length; }, clearTimeout: (id) => { timers[id - 1] = null; },
    document: { getElementById: () => null, querySelector: () => null, documentElement: { scrollHeight: 0 }, addEventListener() {}, removeEventListener() {} },
};
const kept = {};
before(async () => {
    if (SKIP) return;
    ({ SectionView } = await importComponent('components/SectionView.tsx'));
    ({ KitContext } = await importComponent('components/context.ts'));
    portrait = await portraits(path.join(import.meta.dirname, 'portraits', 'list-and-section.json'));
    for (const key of Object.keys(browser)) { kept[key] = Object.getOwnPropertyDescriptor(globalThis, key); globalThis[key] = browser[key]; }
});
after(() => {
    for (const key of Object.keys(kept)) { if (kept[key]) Object.defineProperty(globalThis, key, kept[key]); else delete globalThis[key]; }
});

const screens = {
    kind: 'list', id: 'screens', label: 'Screens', key: 'screens', addLabel: '+ New screen', titleField: 'caption', summaryField: 'note', fallbackTitle: 'alt',
    ordered: true, empty: 'No screen yet.', live: { initial: true, on: 'Shown', off: 'Hidden' }, offHint: 'Hidden: off the page', max: 5, preview: { title: 'Screens' },
    unique: { key: 'cover', label: 'Cover' }, removeAlso: '(and its notes)', titleState: true, thumb: 'shot', thumbShape: 'wide', freshLabel: 'draft', group: 'case',
    badges: [{ key: 'source', value: 'pasted', label: 'pasted', tone: 'warn' }], badgeDetail: (item) => ` · ${String(item.caption?.en ?? '').length} letters`,
    roles: { key: 'role', label: 'On arrival', none: 'Not there', badge: 'on arrival: {role}', fixed: [{ at: 0, label: 'The problem' }], pick: [{ value: 'result', label: 'The result' }, { value: 'turn', label: 'The turn' }] },
    moveTo: [{ list: 'extras', label: 'Move to More screens' }], newItem: { source: 'typed' },
    pick: { label: 'Use a screen of the case', field: 'shot', sources: [{ list: 'extras', key: 'shot' }, { key: 'hero' }] },
    directUpload: { field: 'shot', slot: 'screen', label: 'Or send it' },
    fields: [
        { kind: 'field', id: 'caption', label: 'Caption', key: 'caption', type: 'short', required: true },
        { kind: 'field', id: 'note', label: 'Note', key: 'note', type: 'short', single: true },
        { kind: 'image', id: 'shot', label: 'Screen', key: 'shot', slot: 'screen' },
    ],
};
const extras = { kind: 'list', id: 'extras', label: 'More screens', key: 'extras', addLabel: '+ New extra', titleField: 'caption', ordered: true, empty: 'No extra yet.', group: 'case', thumb: 'shot', thumbShape: 'round', fields: [{ kind: 'image', id: 'shot', label: 'Screen', key: 'shot', slot: 'screen' }] };
const people = { kind: 'list', id: 'people', label: 'People', key: 'people', addLabel: '+ New person', titleField: 'name', ordered: false, empty: 'Nobody yet.', opens: { section: 'case', label: 'Open →' }, openOnAdd: true, thumb: 'photo', fields: [{ kind: 'field', id: 'name', label: 'Name', key: 'name', type: 'short', single: true }] };
const schema = {
    name: 'Cases', languages: ['en', 'pt'], states: { ok: { label: 'checked', tone: 'accent' } },
    sections: [
        { id: 'cases', path: 'cases', title: 'Cases', blocks: [
            { id: 'cases', number: '1', title: 'Cases', subtitle: 'Each one a page', elements: [{ kind: 'list', id: 'cases', label: 'Cases', key: 'cases', addLabel: '+ New case', titleField: 'name', ordered: true, empty: 'No case yet.', opens: { section: 'case', label: 'Open the case →' }, fields: [{ kind: 'field', id: 'name', label: 'Name', key: 'name', type: 'short' }] }] },
            { id: 'people', title: 'People', inIndex: false, elements: [people, { kind: 'note', id: 'n1', text: 'A note.' }, { kind: 'note', id: 'n2', text: 'A warning.', tone: 'warn' }] },
            { id: 'bare', elements: [
                { kind: 'flag', id: 'open', label: 'Open to work', key: 'open' },
                { kind: 'custom', id: 'browser-identity-tab', data: { iconKey: 'icon', titleKey: 'tab', standard: '/icon.png', fallback: 'Cases', wide: 'yes' } },
                { kind: 'custom', id: 'browser-identity-tab' },
                { kind: 'custom', id: 'mine' },
                { kind: 'custom', id: 'nobody' },
                { kind: 'list', id: 'drawn', label: 'Drawn', key: 'drawn', view: 'table', addLabel: '+', titleField: 'name', ordered: false, empty: '', fields: [] },
            ] },
        ] },
        {
            id: 'case', path: 'case', title: 'A case', hidden: true, scope: { list: 'cases', freshNotice: 'A new case: fill it in.' },
            steps: { by: 'model', titles: { lift: 'Lift' }, options: { lift: [{ n: '1', label: 'The screens', block: 'screens', effect: 'slides in', addLabel: '+ New layered screen' }] } },
            blocks: [
                { id: 'model', title: 'Model', elements: [{ kind: 'choice', id: 'model', label: 'Model', key: 'model', options: [{ value: 'lift', label: 'Lift' }, { value: 'plain', label: 'Plain' }] }, { kind: 'image', id: 'hero', label: 'Hero', key: 'hero', slot: 'screen' }] },
                { id: 'screens', title: 'Screens', elements: [screens] },
                { id: 'extras', title: 'More screens', elements: [extras] },
            ],
        },
    ],
};
const shot = (name, more = {}) => ({ src: `/img/${name}.png`, ...more });
const content = () => ({
    open: true, tab: { en: 'My cases' }, icon: shot('icon'),
    people: [{ id: 'p1', name: 'Ana Maria Lima', photo: shot('ana', { position: 'top' }) }, { id: 'p2', name: '' }],
    cases: [
        { id: 'k1', name: { en: 'Bank' }, model: 'lift', hero: shot('hero'), screens: [
            { id: 's1', caption: { en: 'First', state: 'ok' }, note: 'the start', live: true, cover: true, shot: shot('one', { width: 1600, height: 1000, bytes: 204800 }), source: 'pasted' },
            { id: 's2', caption: { en: '' }, alt: { en: 'Kept caption' }, live: false, role: 'result', shot: shot('two') },
            { id: 's3', caption: { en: 'Third' }, live: true, fresh: true },
        ], extras: [{ id: 'e1', shot: shot('extra') }, { id: 'e2', shot: shot('hero') }] },
        { id: 'k2', name: { en: 'Shop' }, fresh: true },
    ],
});

const words = new Proxy({ problems: {}, onPage: 'On the page · {title}', measure: '{width} × {height} px · {size}' }, { get: (target, key) => (key === 'rich' || key === 'required' ? undefined : key in target ? target[key] : `«${String(key)}»`) });

/** A section over the content, which the screen changes; `moves` are the places it asked for. */
function screen(sectionId, { itemId, problems = [], language = 'en' } = {}) {
    const state = { values: content(), moves: [] };
    const ports = { texts: words, imageRule: (slot) => `rule of ${slot}`, hrefOf: (p) => `/kit/${p}`, signInHref: '/in', describeImage: (slot, image) => (image.width ? [] : ['no size']) };
    const extensions = { mine: ({ values, dirty }) => ({ type: 'p', props: { className: 'mine', children: `mine: ${Object.keys(values).length} keys, dirty ${dirty}` } }), table: ({ values }) => ({ type: 'table', props: { children: String(values.drawn ?? 'no rows') } }) };
    const Host = () => ({ type: KitContext.Provider, props: {
        value: { schema, ports, language, extensions, problems, go: (...args) => state.moves.push(args) },
        children: { type: SectionView, props: { section: schema.sections.find((section) => section.id === sectionId), values: state.values, onChange: (next) => { state.values = next; }, itemId } },
    } });
    return { root: createRoot({ type: Host, props: {} }), state };
}
const click = (element) => element.props.onClick({ preventDefault() {} });
const button = (tree, text, nth = 0) => { const hit = tags(tree, 'button', text)[nth]; assert.ok(hit, `the button «${text}» is on the screen`); return hit; };
const rows = (tree, label) => tags(all(tree, (node) => node.type === 'ol' && node.props['aria-label'] === label)[0], 'li').filter((row) => String(row.props.className).startsWith('ak-row'));
const theCase = (state) => state.values.cases[0];

test('a seção com as peças de cada tipo: a lista, a nota, a chave, a aba do navegador, a peça do projeto', { skip: SKIP }, () => {
    const { root, state } = screen('cases');
    const tree = root.draw();
    portrait.same('the section with every kind of piece', tree);
    assert.match(textOf(all(tree, (node) => node.props?.className === 'mine')[0]), /^mine: \d+ keys, dirty false$/);
    assert.equal(all(tree, (node) => node.props?.role === 'img').length, 2, 'as duas amostras da aba');
    click(button(tree, 'Open the case →'));
    assert.deepEqual(state.moves, [['case', 'k1']]);
});

test('uma lista cujos itens abrem página: o novo item leva o autor à página dele', { skip: SKIP }, () => {
    const { root, state } = screen('cases');
    click(button(root.draw(), '+ New person'));
    const created = state.values.people.at(-1);
    assert.equal(created.fresh, true);
    assert.deepEqual(state.moves, [['case', created.id]]);
    assert.equal(rows(root.draw(), 'People').length, 3);
});

test('a seção de um item: os passos do modelo, o caminho de volta, e o item que não existe', { skip: SKIP }, () => {
    const { root, state } = screen('case', { itemId: 'k1' });
    const tree = root.draw();
    portrait.same('one case, with steps', tree);
    assert.ok(button(tree, '+ New layered screen'), 'o passo dá as palavras dele ao botão da lista');
    click(button(tree, '← Cases'));
    assert.deepEqual(state.moves, [['cases', undefined, 'blk-cases']]);
    click(tags(tree, 'a').find((link) => link.props.href === '#blk-screens'));
    assert.deepEqual(state.moves.at(-1), ['case', 'k1', 'blk-screens']);
    const fresh = screen('case', { itemId: 'k2' });
    portrait.same('a new case, no model', fresh.root.draw());
    const gone = screen('case', { itemId: 'nobody' });
    assert.equal(textOf(gone.root.draw()), '«empty»');
});

test('a linha: abrir mostra os campos, mudar um campo muda o item, fechar os esconde', { skip: SKIP }, () => {
    const { root, state } = screen('case', { itemId: 'k1' });
    let tree = root.draw();
    const edit = tags(rows(tree, 'Screens')[0], 'button', '«edit»')[0];
    assert.equal(edit.props['aria-expanded'], false);
    click(edit);
    tree = root.draw();
    portrait.same('one case, the first screen open', tree);
    const field = all(rows(tree, 'Screens')[0], (node) => node.type === 'input' && node.props.value === 'First')[0];
    field.props.onChange({ target: { value: 'The first' } });
    assert.equal(theCase(state).screens[0].caption.en, 'The first');
    tree = root.draw();
    const close = tags(rows(tree, 'Screens')[0], 'button', '«close»')[0];
    assert.equal(close.props['aria-expanded'], true);
    click(close);
    assert.equal(all(rows(root.draw(), 'Screens')[0], (node) => node.type === 'input' && node.props.type === 'text').length, 0);
});

test('remover pede confirmação no próprio botão, volta sozinho, e no segundo clique remove', { skip: SKIP }, () => {
    const { root, state } = screen('case', { itemId: 'k1' });
    timers.length = 0;
    click(tags(rows(root.draw(), 'Screens')[1], 'button', '«remove»')[0]);
    assert.equal(theCase(state).screens.length, 3, 'o primeiro clique não remove');
    let asking = tags(rows(root.draw(), 'Screens')[1], 'button', '«confirmRemove» (and its notes)')[0];
    assert.equal(asking.props.className, 'ak-btn sm confirm');
    timers.filter(Boolean).forEach((back) => back());
    assert.ok(tags(rows(root.draw(), 'Screens')[1], 'button', '«remove»')[0], 'passado o tempo, o botão volta');
    click(tags(rows(root.draw(), 'Screens')[1], 'button', '«remove»')[0]);
    asking = tags(rows(root.draw(), 'Screens')[1], 'button', '«confirmRemove» (and its notes)')[0];
    click(asking);
    assert.deepEqual(theCase(state).screens.map((item) => item.id), ['s1', 's3']);
    assert.equal(rows(root.draw(), 'Screens').length, 2);
});

test('o novo item entra no fim, aberto, com os valores de partida; no limite o botão some', { skip: SKIP }, () => {
    const { root, state } = screen('case', { itemId: 'k1' });
    click(button(root.draw(), '+ New layered screen'));
    const created = theCase(state).screens.at(-1);
    assert.deepEqual({ fresh: created.fresh, live: created.live, source: created.source }, { fresh: true, live: true, source: 'typed' });
    let tree = root.draw();
    assert.equal(tags(rows(tree, 'Screens')[3], 'button', '«close»')[0].props['aria-expanded'], true);
    assert.equal(textOf(all(rows(tree, 'Screens')[3], (node) => node.props?.className === 'ak-badge new')[0]), 'draft');
    click(button(tree, '+ New layered screen'));
    assert.equal(tags(root.draw(), 'button', '+ New layered screen').length, 0, 'cinco é o limite');
});

test('a ordem pelas setas e pelo arrasto; a posição só conta quem está no ar', { skip: SKIP }, () => {
    const { root, state } = screen('case', { itemId: 'k1' });
    let tree = root.draw();
    const positions = (drawn) => rows(drawn, 'Screens').map((row) => textOf(all(row, (node) => node.props?.className === 'ak-pos')[0]));
    assert.deepEqual(positions(tree), ['01', '—', '02']);
    const first = rows(tree, 'Screens')[0];
    assert.equal(tags(first, 'button', '↑')[0].props.disabled, true);
    click(tags(first, 'button', '↓')[0]);
    assert.deepEqual(theCase(state).screens.map((item) => item.id), ['s2', 's1', 's3']);
    tree = root.draw();
    assert.deepEqual(positions(tree), ['—', '01', '02']);
    // The lists of a group share the dragging space of their scope: the drop is the scope's.
    const scope = tags(tree, 'dnd-context')[0];
    scope.props.onDragEnd({ active: { id: 's3', data: { current: { list: 'screens', drops: 'role' } } }, over: { id: 's2', data: { current: { list: 'screens' } } } });
    assert.deepEqual(theCase(state).screens.map((item) => item.id), ['s3', 's2', 's1']);
});

test('no ar e fora do ar, o item em destaque (um só), o papel escolhido, e passar para a outra lista', { skip: SKIP }, () => {
    const { root, state } = screen('case', { itemId: 'k1' });
    let tree = root.draw();
    const second = () => rows(root.draw(), 'Screens')[1];
    assert.equal(textOf(all(second(), (node) => node.props?.className === 'ak-hint')[0]), 'Hidden: off the page');
    click(all(second(), (node) => node.props?.role === 'switch')[0]);
    assert.equal(theCase(state).screens[1].live, true);
    assert.equal(textOf(all(second(), (node) => node.props?.role === 'switch')[0]), 'Shown');
    // The spotlight: one at most.
    all(second(), (node) => node.type === 'input' && node.props.type === 'radio')[0].props.onChange();
    assert.deepEqual(theCase(state).screens.map((item) => item.cover === true), [false, true, false]);
    // The role: fixed by the position in the first row, picked in the others.
    tree = root.draw();
    const selects = rows(tree, 'Screens').map((row) => tags(row, 'select')[0]);
    assert.equal(selects[0].props.disabled, true);
    assert.equal(selects[1].props.value, 'result');
    assert.equal(selects[1].props['aria-label'], 'On arrival: Kept caption');
    selects[2].props.onChange({ target: { value: 'result' } });
    assert.deepEqual(theCase(state).screens.map((item) => item.role), [undefined, undefined, 'result'], 'um papel, um item');
    click(tags(second(), 'button', 'Move to More screens')[0]);
    assert.deepEqual(theCase(state).screens.map((item) => item.id), ['s1', 's3']);
    assert.deepEqual(theCase(state).extras.map((item) => item.id), ['e1', 'e2', 's2']);
    assert.equal(rows(root.draw(), 'More screens').length, 3);
});

test('usar uma imagem que já está no caso: as opções sem repetir, e o item novo com ela', { skip: SKIP }, () => {
    const { root, state } = screen('case', { itemId: 'k1' });
    let tree = root.draw();
    const picker = () => all(root.draw(), (node) => node.type === 'select' && node.props['aria-label'] === 'Use a screen of the case')[0];
    assert.deepEqual(tags(picker(), 'option').map((option) => option.props.value), ['', '/img/extra.png', '/img/hero.png']);
    assert.equal(button(tree, '«usePicked»').props.disabled, true);
    picker().props.onChange({ target: { value: '/img/extra.png' } });
    tree = root.draw();
    click(button(tree, '«usePicked»'));
    const created = theCase(state).screens.at(-1);
    assert.deepEqual({ fresh: created.fresh, shot: created.shot }, { fresh: true, shot: { src: '/img/extra.png' } });
    assert.equal(picker().props.value, '');
});

test('depois de uma gravação recusada, o item com o obrigatório vazio fica aberto e marcado', { skip: SKIP }, () => {
    const problems = [{ code: 'required', path: ['cases', 'k1', 'screens', 's2', 'caption'], language: 'en' }, { code: 'limit', path: ['cases', 'k1', 'screens', 's3', 'caption'], language: 'en' }];
    const { root } = screen('case', { itemId: 'k1', problems });
    const tree = root.draw();
    portrait.same('one case, refused', tree);
    const [first, second, third] = rows(tree, 'Screens');
    assert.equal(tags(first, 'button', '«edit»').length, 1);
    assert.equal(tags(second, 'button', '«close»')[0].props['aria-expanded'], true);
    assert.equal(all(second, (node) => node.props?.className === 'ak-badge err').length, 1);
    assert.equal(tags(third, 'button', '«edit»').length, 1, 'outro problema marca, e não abre');
    assert.equal(all(third, (node) => node.props?.className === 'ak-badge err').length, 1);
});

test('em outro idioma, o título do item cai no idioma principal', { skip: SKIP }, () => {
    const { root } = screen('case', { itemId: 'k1', language: 'pt' });
    portrait.same('one case, in Portuguese', root.draw());
});
