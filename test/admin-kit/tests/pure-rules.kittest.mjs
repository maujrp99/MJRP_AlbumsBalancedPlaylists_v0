// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
// The pure rules of the screens as they answered before they were split (F332, slice 1b; complexity 10): the publication
// card's reading of every answer (`readAnswer`), the conference of a content (`validate`) and the places of the marker
// (`markerPlaces`), each over a grid of cases wide enough to walk every branch. `portraits/pure-rules.json` keeps what each
// answered BEFORE the rewrite; `ADMIN_KIT_PORTRAIT=write` records it again, only when a change of a rule is meant.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { installTsHooks } from './support/ts-hooks.mjs';

installTsHooks();
const UI = path.resolve(import.meta.dirname, '..', process.env.ADMIN_KIT_UI ?? 'ui');
const load = (file) => import(pathToFileURL(path.join(UI, file)).href);
const { readAnswer, BUILD_START } = await load('publication.ts');
const { validate, placeOf, hasRequired } = await load('validate.ts');
const { markerPlaces } = await load('marker.ts');

const FILE = path.join(import.meta.dirname, 'portraits', 'pure-rules.json');
const known = existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : {};
const writing = process.env.ADMIN_KIT_PORTRAIT === 'write';
/** `undefined` kept apart from an absent key, so «the card stays» and «no mark» are told apart. */
const plain = (value) => JSON.parse(JSON.stringify(value, (key, inner) => (inner === undefined ? '«undefined»' : inner)));
function same(name, answers) {
    if (writing) {
        known[name] = plain(answers);
        writeFileSync(FILE, `${JSON.stringify(known)}\n`);
        return;
    }
    assert.ok(name in known, `nothing recorded for «${name}»`);
    assert.equal(answers.length, known[name].length);
    plain(answers).forEach((answer, index) => assert.deepEqual(answer, known[name][index], `${name}, case ${index}`));
}

test('o cartão de publicação: cada resposta da porta, em cada estado do cartão e da espera', () => {
    const answers = [];
    const nows = [
        { state: 'idle' }, { state: 'idle', none: true }, { state: 'idle', build: 'a' }, { state: 'idle', build: 'b' },
        { state: 'publishing', message: 'p' }, { state: 'publishing', message: 'p', build: 'b' }, { state: 'publishing', message: 'p', build: 'a' },
        { state: 'failed', message: 'f' }, { state: 'failed', message: 'f', build: 'b' }, { state: 'unknown', message: 'u' },
    ];
    const marks = [null, { at: 1000, seen: false, known: false }, { at: 1000, seen: false, known: true }, { at: 1000, seen: false, known: true, before: 'a' }, { at: 1000, seen: true, known: true, before: 'a' }, { at: 1000, seen: true, known: false }];
    for (const now of nows) for (const mark of marks) for (const asked of [500, 1500]) for (const shown of ['idle', 'publishing', 'failed', 'unknown']) for (const clock of [1600, 1000 + BUILD_START + 1]) {
        answers.push(readAnswer(now, asked, mark, shown, clock));
    }
    assert.equal(answers.length, 960);
    same('readAnswer', answers);
});

const list = {
    kind: 'list', id: 'steps', label: 'Steps', key: 'steps', addLabel: '+', titleField: 'title', ordered: true, empty: '', min: 1, max: 2, live: { initial: false },
    roles: { key: 'role', label: 'Role', none: 'None', badge: '{role}', fixed: [{ at: 0, label: 'First' }], pick: [{ value: 'end', label: 'The end' }] },
    fields: [
        { kind: 'field', id: 'title', label: 'Title', key: 'title', type: 'short', required: true, limit: 5 },
        { kind: 'field', id: 'code', label: 'Code', key: 'code', type: 'short', single: true, required: true, limit: 3 },
        { kind: 'image', id: 'photo', label: 'Photo', key: 'photo', slot: 'photo' },
        { kind: 'flag', id: 'show', label: 'Show', key: 'show', requires: 'photo' },
    ],
};
const schemaOf = (requiredIn) => ({
    name: 'Rules', languages: ['en', 'pt'], states: {}, ...(requiredIn ? { requiredIn } : {}),
    marker: { key: 'company', token: '{company}', mark: { key: 'brand', group: 'Top', name: 'The box' }, elsewhere: [{ group: 'Elsewhere', name: 'About' }] },
    sections: [
        { id: 'home', path: 'home', title: 'Home', blocks: [
            { id: 'top', title: 'Top', elements: [
                { kind: 'field', id: 'company', label: 'Company', key: 'company', type: 'short', required: true },
                { kind: 'field', id: 'brand', label: 'Brand', key: 'brand', type: 'short' },
                { kind: 'field', id: 'line', label: 'Line', key: 'line', type: 'short', marked: true, limit: 12 },
                { kind: 'field', id: 'soft', label: 'Soft', key: 'soft', type: 'short', limit: 2, advisory: true },
                { kind: 'field', id: 'tab', label: 'Tab', key: 'tab', type: 'short', single: true, limit: 4, marked: true },
                { kind: 'note', id: 'note', text: 'A note' }, { kind: 'custom', id: 'piece' },
                { kind: 'flag', id: 'photo-on', label: 'Photo on', key: 'photoOn', requires: 'photo' },
                { kind: 'flag', id: 'free', label: 'Free', key: 'free' },
                { kind: 'image', id: 'photo', label: 'Photo', key: 'photo', slot: 'photo' },
            ] },
            { id: 'projects', title: 'Projects', elements: [{ kind: 'list', id: 'projects', label: 'Projects', key: 'projects', addLabel: '+', titleField: 'name', ordered: true, empty: '', live: { initial: true }, fields: [
                { kind: 'field', id: 'name', label: 'Name', key: 'name', type: 'short' },
                { kind: 'field', id: 'summary', label: 'Summary', key: 'summary', type: 'long', marked: true },
            ] }] },
        ] },
        { id: 'project', path: 'project', title: 'A project', hidden: true, scope: { list: 'projects' }, blocks: [
            { id: 'text', title: 'Text', elements: [{ kind: 'field', id: 'summary', label: 'Summary', key: 'summary', type: 'long', marked: true }, { kind: 'field', id: 'body', label: 'Body', key: 'body', type: 'long', marked: true, required: true }] },
            { id: 'steps', title: 'Steps', elements: [list, { ...list, id: 'more', key: 'more', min: undefined, max: undefined, live: undefined, roles: undefined, fields: [{ kind: 'field', id: 'title', label: 'Title', key: 'title', type: 'short', marked: true }] }] },
        ] },
    ],
});
const photo = { src: '/p.png' };
const contents = [
    {},
    { company: { en: 'Acme', pt: '' }, brand: { en: '' }, line: { en: 'We are {company}', pt: 'Somos {company}' }, soft: { en: 'too long' }, tab: 'x {company} long', photoOn: true, free: true },
    { company: { en: '  ', pt: 'Acme Brasil' }, brand: { en: 'ACME' }, line: { en: 'no token', pt: 'Somos {company} mesmo' }, tab: '{company}', photoOn: true, photo, projects: 'not a list' },
    { company: { en: 'Acme Corp' }, line: { en: 'a line that is too long {company}' }, projects: [
        { id: 'p1', live: true, name: { en: 'One' }, summary: { en: 'By {company}' }, body: { en: '' }, steps: [], more: [{ id: 'm1', title: { en: '{company} did it' } }, { id: 'm2', title: { pt: 'sem nada' } }] },
        { id: 'p2', live: true, name: { en: '', pt: 'Dois' }, summary: { pt: 'Da {company}' }, body: { en: 'Body {company}', pt: '' }, steps: [
            { id: 's1', live: true, title: { en: '' }, code: 'ABCD', role: 'end', show: true },
            { id: 's2', live: true, title: 'plain', code: '', role: 'end', show: true, photo },
            { id: 's3', live: false, title: { en: 'too long', pt: 'x' }, code: 7, role: 'other' },
        ], more: 'nope' },
        { id: 'p3', live: false, name: 'Three', summary: { en: 'By {company}' }, body: { en: 'x' }, steps: [{ id: 's4', title: { en: 'ok' }, code: 'ok', role: 'end' }] },
    ] },
];

test('a conferência: cada regra do esquema, na língua principal e em todas', () => {
    const answers = [];
    for (const requiredIn of [undefined, 'main', 'every']) for (const values of contents) answers.push(validate(schemaOf(requiredIn), values));
    assert.ok(answers.flat().length > 30, 'a grade acha problemas de todo tipo');
    assert.deepEqual([...new Set(answers.flat().map((problem) => problem.code))].sort(), ['live-without-title', 'needs-image', 'not-a-list', 'required', 'role-twice', 'too-few', 'too-long', 'too-many'].sort());
    same('validate', answers);
    const schema = schemaOf();
    same('placeOf', answers.flat().map((problem) => placeOf(schema, problem.path)));
    assert.deepEqual(schema.sections.map((section) => hasRequired(section.blocks)), [true, true]);
});

test('os lugares do marcador: a caixa do topo, os campos, os itens das listas e das seções de um item, sem repetir, e os de fora', () => {
    const answers = [];
    const schema = schemaOf();
    for (const language of ['en', 'pt']) for (const values of contents.filter((content) => typeof content.projects !== 'string')) answers.push(markerPlaces(schema, values, language));
    answers.push(markerPlaces({ ...schema, marker: undefined }, contents[1], 'en'));
    answers.push(markerPlaces({ ...schema, marker: { key: 'company', token: '{company}' } }, contents[3], 'en'));
    assert.ok(answers.flat().length > 30);
    same('markerPlaces', answers);
});
