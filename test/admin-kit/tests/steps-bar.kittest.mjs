// cópia carimbada do kit do admin do MJRP Harness · admin-kit v0.9.0 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
// A click on the steps bar tells the router's port which block the panel is on (F332, recheck P2-7 of TASK-14): before the
// navigation port the step was a plain `#blk-…` link, the browser wrote the hash and the menu marked that block; with the
// port, the click goes through `go(path, itemId, block)`, so the place has the block and the submenu's mark follows it
// (the other half, the menu marking `where.block`, is in navigation-port.kittest.mjs). No DOM: the component is called as a
// function (client-harness) and the test calls the link's handler, as a click would.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';

import { SKIP, find, importComponent, installClientHarness, mount, stub } from './support/client-harness.mjs';

const part = (name) => stub(`export const ${name} = () => null;`);
installClientHarness({
    './context': stub('export const useKit = () => globalThis.__kit;'),
    './ElementView': part('ElementView'),
    './dnd-scope': part('DndScope'),
    './bits': part('Notice'),
    './SectionIndex': stub('export const READING_LINE = 120; export const WithSectionIndex = () => null;'),
});

let SectionView, EXAMPLE_SCHEMA;
before(async () => {
    if (SKIP) return;
    ({ SectionView } = await importComponent('components/SectionView.tsx'));
    ({ EXAMPLE_SCHEMA } = await importComponent('example/example-schema.ts'));
});

const all = (node, predicate, hits = []) => {
    if (!node || typeof node !== 'object') return hits;
    if (predicate(node)) hits.push(node);
    for (const child of [node.props?.children].flat(Infinity)) all(child, predicate, hits);
    return hits;
};

test('o clique num passo da barra vai pela porta com o bloco: o lugar passa a apontar o bloco, e o menu o marca', { skip: SKIP }, () => {
    const moves = [];
    const landed = [];
    const saved = { ...globalThis };
    Object.assign(globalThis, {
        __kit: { schema: EXAMPLE_SCHEMA, ports: { texts: { sequence: 'Steps', empty: 'Nothing', back: 'Back' } }, go: (...args) => moves.push(args) },
        document: { getElementById: (id) => { landed.push(id); return null; }, querySelector: () => null, documentElement: { scrollHeight: 0 } },
        addEventListener: () => {}, removeEventListener: () => {}, innerHeight: 0, scrollY: 0,
    });
    try {
        const section = EXAMPLE_SCHEMA.sections.find((candidate) => candidate.id === 'recipe');
        const values = { recipes: [{ id: 'a', name: 'Bread', style: 'quick' }] };
        const tree = mount(SectionView, { section, values, onChange() {}, itemId: 'a' }).render();
        const bar = find(tree, (node) => typeof node.type === 'function' && node.type.name === 'StepsBar');
        assert.ok(bar, 'a seção de um item com modelo escolhido desenha a barra de passos');
        const links = all(mount(bar.type, bar.props).render(), (node) => node.type === 'a');
        assert.deepEqual(links.map((link) => link.props.href), ['#blk-style', '#blk-steps']);
        let prevented = 0;
        links[1].props.onClick({ preventDefault() { prevented += 1; } });
        assert.equal(prevented, 1, 'o navegador não escreve o hash: o endereço é do roteador');
        assert.deepEqual(moves, [['recipe', 'a', 'blk-steps']]);
    } finally {
        for (const key of ['__kit', 'document', 'addEventListener', 'removeEventListener', 'innerHeight', 'scrollY']) {
            if (key in saved) globalThis[key] = saved[key]; else delete globalThis[key];
        }
    }
});
