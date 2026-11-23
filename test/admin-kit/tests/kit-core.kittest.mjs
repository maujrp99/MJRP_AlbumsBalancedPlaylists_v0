// cópia carimbada do kit do admin do MJRP Harness · admin-kit v0.9.0 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
// O miolo do kit do admin (F75, TASK-01; ADR-0011, S-112): os valores, as listas e a conferência dos limites, montados com
// o esquema de um projeto de exemplo, sem nada deste projeto (`ui/example/`).
// Trazido do MJRPpersonal (tests/admin-kit/kit-core.test.mjs, c33a33a4) para o kit no harness (F332, TASK-08): a pasta do kit por parâmetro.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { installTsHooks } from './support/ts-hooks.mjs';

installTsHooks();
const ROOT = path.resolve(import.meta.dirname, '..');
const UI = path.resolve(ROOT, process.env.ADMIN_KIT_UI ?? 'ui');
const kit = await import(pathToFileURL(path.join(UI, 'index.ts')).href);
const values = await import(pathToFileURL(path.join(UI, 'values.ts')).href);
const { EXAMPLE_SCHEMA: schema } = await import(pathToFileURL(path.join(UI, 'example/example-schema.ts')).href);
const recipes = kit.listByKey(schema, 'recipes');

test('os idiomas, os estados e os espaços de imagem são do esquema, não do kit', () => {
    assert.deepEqual(schema.languages, ['en', 'es']);
    const edited = values.withText({}, 'headline', 'es', 'Hola', schema.editedState);
    assert.deepEqual(edited.headline, { es: 'Hola', state: 'touched' });
    assert.equal(values.textOf(edited, 'headline', 'es'), 'Hola');
    assert.equal(values.textOf(edited, 'headline', 'en'), '');
});

test('a lista: o item novo entra no fim, vazio, fora do ar e marcado novo; mover, tirar e o destaque único', () => {
    let content = { recipes: [{ id: 'a', live: true, name: { en: 'Soup' } }, { id: 'b', live: true, name: { en: 'Bread' } }] };
    content = values.withNewItem(content, recipes, 'c');
    assert.deepEqual(content.recipes.at(-1), { id: 'c', fresh: true, live: false });
    content = values.withMovedItem(content, 'recipes', 2, 0);
    assert.deepEqual(content.recipes.map((item) => item.id), ['c', 'a', 'b']);
    content = values.withUnique(content, 'recipes', 'star', 'a');
    assert.deepEqual(content.recipes.map((item) => item.star), [false, true, false]);
    content = values.withoutItem(content, 'recipes', 'c');
    assert.deepEqual(content.recipes.map((item) => item.id), ['a', 'b']);
});

test('o que vai ao armazenamento perde a marca de novo; as mudanças contam por chave', () => {
    const before = { headline: { en: 'Hi' }, recipes: [] };
    const after = values.withNewItem({ ...before, headline: { en: 'Hello' } }, recipes, 'x');
    assert.deepEqual(values.forStore(after).recipes, [{ id: 'x', live: false }]);
    assert.deepEqual(values.changedKeys(before, after).sort(), ['headline', 'recipes']);
});

test('a conferência: o limite, o obrigatório na língua principal, o tamanho da lista, a bandeira sem imagem e o caso', () => {
    const content = {
        headline: { en: 'x'.repeat(41), es: '' },
        recipes: [
            { id: 'a', live: true, name: { en: '' }, showPhoto: true },
            { id: 'b', name: { en: 'Bread' }, style: 'quick', steps: [{ id: 's', text: { en: 'y'.repeat(161) } }] },
            { id: 'c', name: { en: 'Cake' } }, { id: 'd', name: { en: 'Pie' } },
        ],
    };
    const found = kit.validate(schema, content).map((problem) => `${problem.path.join('/')}:${problem.code}${problem.language ? `@${problem.language}` : ''}`);
    assert.deepEqual(found.sort(), [
        'headline:too-long@en',
        'recipes/a/name:live-without-title',
        'recipes/a/name:required@en',
        'recipes/a/showPhoto:needs-image',
        'recipes/b/steps/s/text:too-long@en',
        'recipes:too-many',
    ].sort());
    assert.deepEqual(kit.validate(schema, { headline: { en: 'Fine' } }), []);
});

test('uma lista que não é lista é um problema, não uma lista vazia', () => {
    assert.deepEqual(kit.validate(schema, { headline: { en: 'Fine' }, recipes: 'oops' }).map((p) => p.code), ['not-a-list']);
});

// F85, TASK-01 (REQ-01, REQ-02; S-117): os papéis de uma lista — fixos por posição e únicos escolhidos — moram numa bandeira
// do próprio item, que viaja com ele ao mudar a ordem e some quando ele sai da lista.
const CHAPTERS = {
    kind: 'list', id: 'chapters', label: 'Chapters', key: 'chapters', addLabel: '+', titleField: 'label', ordered: true, empty: '', fields: [],
    roles: {
        key: 'arrival', label: 'On arrival', none: 'Not going', badge: 'on arrival: {role}',
        fixed: [{ at: 0, label: 'The problem' }, { at: 1, label: 'The solution' }], pick: [{ value: 'result', label: 'The result' }],
    },
};
const chapters = (...ids) => ids.map((id) => (typeof id === 'string' ? { id } : id));

test('F85: o papel é o fixo pela posição; nos outros, o da bandeira', () => {
    const items = chapters('a', 'b', 'c', { id: 'd', arrival: 'result' });
    assert.deepEqual(items.map((item, index) => values.roleOf(item, index, CHAPTERS.roles)),
        [{ label: 'The problem', fixed: true }, { label: 'The solution', fixed: true }, null, { value: 'result', label: 'The result', fixed: false }]);
    // uma bandeira numa posição fixa não conta: ali vale o papel da posição
    assert.equal(values.roleOf({ id: 'x', arrival: 'result' }, 1, CHAPTERS.roles).label, 'The solution');
    assert.equal(values.roleOf({ id: 'x', arrival: 'other' }, 3, CHAPTERS.roles), null, 'um valor fora dos papéis não é papel');
});

test('F85: um papel, um item — marcar outro tira do anterior; «Não vai» tira a bandeira', () => {
    let content = { chapters: chapters('a', 'b', 'c', { id: 'd', arrival: 'result' }) };
    content = values.withRole(content, CHAPTERS, 'c', 'result');
    assert.deepEqual(content.chapters.map((item) => item.arrival), [undefined, undefined, 'result', undefined]);
    assert.ok(!('arrival' in content.chapters[3]), 'a bandeira sai do item, não fica vazia');
    content = values.withRole(content, CHAPTERS, 'c', '');
    assert.ok(content.chapters.every((item) => !('arrival' in item)));
});

test('F85: a bandeira acompanha o item ao mudar a ordem, e some quando ele passa para outra lista', () => {
    let content = { chapters: chapters('a', 'b', 'c', { id: 'd', arrival: 'result' }), extras: chapters('x') };
    content = values.withMovedItem(content, 'chapters', 3, 2);
    assert.deepEqual(content.chapters.map((item) => item.arrival ?? '-'), ['-', '-', 'result', '-']);
    content = values.withItemPassed(content, 'chapters', 'extras', 'd', undefined, 'arrival');
    assert.deepEqual(content.chapters.map((item) => item.id), ['a', 'b', 'c']);
    assert.deepEqual(content.extras, [{ id: 'x' }, { id: 'd' }], 'chega ao fim da outra lista sem a bandeira');
    // num lugar escolhido (o arraste), e sem chave de papel a tirar
    content = values.withItemPassed(content, 'extras', 'chapters', 'x', 0);
    assert.deepEqual(content.chapters.map((item) => item.id), ['x', 'a', 'b', 'c']);
    assert.ok(!('arrival' in values.withoutRoleFlag({ id: 'q', arrival: 'result' }, CHAPTERS.roles)));
});

test('F85: a conferência recusa o mesmo papel em dois itens', () => {
    const one = { languages: ['en'], states: {}, sections: [{ id: 's', path: 's', title: 'S', blocks: [{ id: 'b', title: 'B', elements: [CHAPTERS] }] }] };
    assert.deepEqual(kit.validate(one, { chapters: chapters('a', 'b', { id: 'c', arrival: 'result' }) }), []);
    const twice = kit.validate(one, { chapters: chapters('a', 'b', { id: 'c', arrival: 'result' }, { id: 'd', arrival: 'result' }) });
    assert.deepEqual(twice.map((problem) => [problem.code, problem.path.join('/')]), [['role-twice', 'chapters/d/arrival']]);
});
