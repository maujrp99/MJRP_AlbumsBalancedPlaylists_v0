// cópia carimbada do kit do admin do MJRP Harness · admin-kit v0.9.0 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
/**
 * The limits of a schema, checked in one place (critique of ADR-0011, P1-6): the screen calls it while the author types,
 * and the project calls the same function on the server before it writes, because the browser is not to be trusted. An
 * image's rule is the project's (its ports); here only what the schema declares: characters, required fields, the size
 * of a list, and a flag that waits on its image.
 *
 * Pure: no React, no project import.
 */
import { elementsOf, type KitElement, type KitList, type KitSchema } from './schema';
import { imageOf, itemsOf, textOf, type KitValues } from './values';

export type KitProblemCode = 'too-long' | 'required' | 'too-few' | 'too-many' | 'needs-image' | 'live-without-title' | 'not-a-list' | 'role-twice';

export interface KitProblem {
    /** The keys from the top of the content to the value: `['services', '<id>', 'title']`. */
    path: string[];
    code: KitProblemCode;
    /** The limit that was passed, for the message. */
    limit?: number;
    language?: string;
}

type Scoped = Exclude<KitElement, { kind: 'note' } | { kind: 'custom' }>;

function checkElements(schema: KitSchema, elements: Scoped[], container: KitValues, at: string[], out: KitProblem[]): void {
    for (const element of elements) {
        if (element.kind === 'field') {
            const languages = element.single ? [null] : schema.languages;
            for (const language of languages) {
                const text = language === null ? (typeof container[element.key] === 'string' ? (container[element.key] as string) : '') : textOf(container, element.key, language);
                const where = { path: [...at, element.key], ...(language ? { language } : {}) };
                if (element.limit !== undefined && !element.advisory && text.length > element.limit) out.push({ ...where, code: 'too-long', limit: element.limit });
                // A required text is required in the main language, a translation can wait; or in every language, when the project
                // says so (F125, the MJRP's option A, 2026-11-17: «Aprovo, com A»: a blank English text vanishes from /en).
                const counts = language === null || language === schema.languages[0] || schema.requiredIn === 'every';
                if (element.required && !text.trim() && counts) out.push({ ...where, code: 'required' });
            }
        } else if (element.kind === 'flag') {
            if (element.requires && container[element.key] === true && !imageOf(container, element.requires)) {
                out.push({ path: [...at, element.key], code: 'needs-image' });
            }
        } else if (element.kind === 'list') {
            checkList(schema, element, container, at, out);
        }
    }
}

function checkList(schema: KitSchema, list: KitList, container: KitValues, at: string[], out: KitProblem[]): void {
    const raw = container[list.key];
    if (raw !== undefined && !Array.isArray(raw)) {
        out.push({ path: [...at, list.key], code: 'not-a-list' });
        return;
    }
    const items = itemsOf(container, list.key);
    if (list.min !== undefined && items.length < list.min) out.push({ path: [...at, list.key], code: 'too-few', limit: list.min });
    if (list.max !== undefined && items.length > list.max) out.push({ path: [...at, list.key], code: 'too-many', limit: list.max });
    for (const item of items) {
        const where = [...at, list.key, item.id];
        if (list.live && item.live === true && !textOf(item, list.titleField, schema.languages[0]).trim() && typeof item[list.titleField] !== 'string') {
            out.push({ path: [...where, list.titleField], code: 'live-without-title' });
        }
        checkElements(schema, list.fields, item, where, out);
    }
    // A picked role is held by one item at most (F85): the second one that claims it is the problem.
    if (list.roles) {
        const roles = list.roles;
        const held = new Set<unknown>();
        for (const item of items) {
            const value = item[roles.key];
            if (!roles.pick.some((role) => role.value === value)) continue;
            if (held.has(value)) out.push({ path: [...at, list.key, item.id, roles.key], code: 'role-twice' });
            held.add(value);
        }
    }
}

export function validate(schema: KitSchema, values: KitValues): KitProblem[] {
    const out: KitProblem[] = [];
    for (const section of schema.sections) {
        const elements = elementsOf(section.blocks);
        if (!section.scope) {
            checkElements(schema, elements, values, [], out);
            continue;
        }
        for (const item of itemsOf(values, section.scope.list)) checkElements(schema, elements, item, [section.scope.list, item.id], out);
    }
    return out;
}

type Labeled = ReturnType<typeof elementsOf>[number];

/** Where a problem's field is on the screen: its name as the author sees it, its section, the item a scoped section shows, and whether the field is pinned to one language. */
export interface KitPlace {
    label: string;
    section: string;
    itemId?: string;
    pinned: boolean;
}

function placeIn(elements: Labeled[], path: string[], trail: string[]): { names: string[]; pinned: boolean } | null {
    const [key, ...rest] = path;
    const element = elements.find((candidate) => candidate.key === key);
    if (!element) return null;
    if (!rest.length) return { names: [...trail, element.label], pinned: element.kind === 'field' && element.language !== undefined };
    if (element.kind !== 'list' || rest.length < 2) return null;
    // `[lista, id do item, campo]`: o campo do item, dito com o nome da lista na frente («Formação › Escola»).
    return placeIn(element.fields, rest.slice(1), [...trail, element.label]);
}

/** Where the field of a problem path is (F125: the notice «Falta preencher» names it and leads to it). `null` when the path leads to no field. */
export function placeOf(schema: KitSchema, path: string[]): KitPlace | null {
    for (const section of schema.sections) {
        const elements = elementsOf(section.blocks);
        if (!section.scope) {
            const found = placeIn(elements, path, []);
            if (found) return { label: found.names.join(' › '), section: section.path, pinned: found.pinned };
            continue;
        }
        if (path[0] !== section.scope.list || path.length < 3) continue;
        const found = placeIn(elements, path.slice(2), [section.title]);
        if (found) return { label: found.names.join(' › '), section: section.path, itemId: path[1], pinned: found.pinned };
    }
    return null;
}

/** O nome do campo de um problema, como o autor o vê na tela (F125, REQ-01). `null` quando o caminho não leva a um campo do esquema. */
export function labelOf(schema: KitSchema, path: string[]): string | null {
    return placeOf(schema, path)?.label ?? null;
}

/** Whether a section has a required field, its lists' fields included: the screen then shows the legend of the * (F125). */
export function hasRequired(blocks: Parameters<typeof elementsOf>[0]): boolean {
    return elementsOf(blocks).some((element) => (element.kind === 'field' && element.required) || (element.kind === 'list' && element.fields.some((field) => field.kind === 'field' && field.required)));
}

/**
 * Os nomes dos obrigatórios que faltam, sem repetir, na ordem do esquema, com o idioma quando falta o inglês («Nome da empresa (EN)»):
 * para o aviso de quem tenta salvar e a recusa do servidor.
 */
export function missingLabels(schema: KitSchema, problems: KitProblem[]): string[] {
    const main = schema.languages[0];
    const names = problems.filter((problem) => problem.code === 'required').map((problem) => {
        const name = labelOf(schema, problem.path) ?? problem.path.join('.');
        return problem.language && problem.language !== main ? `${name} (${problem.language.toUpperCase()})` : name;
    });
    return [...new Set(names)];
}
