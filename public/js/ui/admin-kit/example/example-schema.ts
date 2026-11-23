// cópia carimbada do kit do admin do MJRP Harness · admin-kit v0.9.0 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
/**
 * A project that is not this one (ADR-0011; S-112): a cookbook in English and Spanish, with its own review states and
 * image slots. The kit's tests build it with no import from the project, to prove the kit knows nothing of the MJRP site.
 */
import type { KitSchema } from '../schema';

export const EXAMPLE_SCHEMA: KitSchema = {
    name: 'Cookbook',
    languages: ['en', 'es'],
    states: { draft: { label: 'draft', tone: 'warn' }, ok: { label: 'checked', tone: 'accent' }, touched: { label: 'touched', tone: 'neutral' } },
    editedState: 'touched',
    sections: [
        {
            id: 'front', path: 'front', title: 'Front page', subtitle: 'What a visitor sees first',
            blocks: [{
                id: 'hero', number: '1', title: 'Hero', elements: [
                    { kind: 'field', id: 'headline', label: 'Headline', key: 'headline', type: 'short', limit: 40, required: true, where: ['Hero', 'Browser tab'] },
                    { kind: 'field', id: 'intro', label: 'Intro', key: 'intro', type: 'long' },
                    { kind: 'image', id: 'cover', label: 'Cover', key: 'cover', slot: 'cover' },
                ],
            }],
        },
        {
            id: 'recipes', path: 'recipes', title: 'Recipes',
            blocks: [{
                id: 'list', number: '2', title: 'Recipes', elements: [{
                    kind: 'list', id: 'recipes', label: 'Recipes', key: 'recipes', addLabel: '+ New recipe', titleField: 'name', summaryField: 'time',
                    ordered: true, empty: 'No recipe yet.', live: { initial: false }, max: 3, preview: { title: 'Recipes' },
                    opens: { section: 'recipe', label: 'Open the recipe →' }, removeAlso: '(and its steps)',
                    fields: [
                        { kind: 'field', id: 'name', label: 'Name', key: 'name', type: 'short', required: true, limit: 30 },
                        { kind: 'field', id: 'time', label: 'Time', key: 'time', type: 'short', single: true },
                        { kind: 'image', id: 'photo', label: 'Photo', key: 'photo', slot: 'photo' },
                        { kind: 'flag', id: 'show-photo', label: 'Show the photo', key: 'showPhoto', requires: 'photo' },
                    ],
                }],
            }],
        },
        {
            id: 'recipe', path: 'recipe', title: 'A recipe', hidden: true, scope: { list: 'recipes' },
            steps: { by: 'style', options: { quick: [{ n: '1', label: 'Style', block: 'style' }, { n: '2', label: 'Steps', block: 'steps' }], slow: [{ n: '1', label: 'Style', block: 'style' }] } },
            blocks: [
                { id: 'style', title: 'Style', elements: [{ kind: 'choice', id: 'style', label: 'Style', key: 'style', options: [{ value: 'quick', label: 'Quick', description: 'Two steps' }, { value: 'slow', label: 'Slow', description: 'One step' }] }] },
                { id: 'steps', title: 'Steps', elements: [{ kind: 'list', id: 'steps', label: 'Steps', key: 'steps', addLabel: '+ New step', titleField: 'text', ordered: true, empty: 'No step yet.', fields: [{ kind: 'field', id: 'text', label: 'Step', key: 'text', type: 'long', limit: 160 }] }] },
            ],
        },
    ],
};
