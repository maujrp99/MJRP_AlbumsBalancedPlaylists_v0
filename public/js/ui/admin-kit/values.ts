// cópia carimbada do kit do admin do MJRP Harness · admin-kit v0.9.0 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
/**
 * The content the kit edits, as a plain tree (ADR-0011): a text field is `{ <language>: text, state? }`, a list is an array
 * of items, each item `{ id, live?, fresh?, ...its own fields }`, and an image is `{ src }`. The project reads and writes
 * this tree through its ports; where it lives (here, a note's frontmatter) is the project's. Every change returns a new
 * tree, so the screen can compare what was read with what will be saved.
 *
 * Pure: no React, no project import.
 */
import type { KitList, KitRoles } from './schema';

export type KitValues = Record<string, unknown>;
export type KitText = Record<string, string> & { state?: string };
export interface KitItem {
    id: string;
    /** On the air, when the list has the switch. */
    live?: boolean;
    /** Created in this session and not saved yet: the «novo» badge. */
    fresh?: boolean;
    [key: string]: unknown;
}
export interface KitImageValue {
    src: string;
    width?: number;
    height?: number;
    bytes?: number;
    /** Where the image is cut when it is not in the slot's proportion. */
    position?: 'top' | 'center' | 'bottom';
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

export function textOf(container: KitValues, key: string, language: string): string {
    const value = container[key];
    if (typeof value === 'string') return value;
    return isRecord(value) && typeof value[language] === 'string' ? (value[language] as string) : '';
}

/** A text kept in loose keys, one per language (F135, REQ-01): `synopsis` and `synopsis_en`. */
export function pairText(container: KitValues, pair: Record<string, string>, language: string): string {
    const value = container[pair[language]];
    return typeof value === 'string' ? value : '';
}

/** The pair with one language changed; the other keys are left as they are. */
export function withPairText(container: KitValues, pair: Record<string, string>, language: string, text: string): KitValues {
    return { ...container, [pair[language]]: text };
}

export function stateOf(container: KitValues, key: string): string | undefined {
    const value = container[key];
    return isRecord(value) && typeof value.state === 'string' ? value.state : undefined;
}

/** A text changed by the author: the language's value, and the state the project gives an edited field. */
export function withText(container: KitValues, key: string, language: string | null, text: string, editedState?: string): KitValues {
    const before = isRecord(container[key]) ? (container[key] as KitText) : ({} as KitText);
    if (language === null) return { ...container, [key]: text };
    const next: KitText = { ...before, [language]: text };
    if (editedState) next.state = editedState;
    return { ...container, [key]: next };
}

/**
 * De onde para onde traduzir um texto (F96, S-128 R3): o destino é o idioma aberto na tela, que o autor escolhe ao trocar de
 * idioma (o protótipo aprovado: «Traduzir do português» no campo em inglês, e o inverso). A origem é o primeiro outro idioma
 * do esquema que tem texto. `null` quando nenhum outro idioma tem texto: não há o que traduzir.
 */
export function translationRoute(texts: Record<string, string>, languages: readonly string[], onScreen: string): { from: string; to: string } | null {
    const from = languages.find((language) => language !== onScreen && (texts[language] ?? '').trim() !== '');
    return from === undefined ? null : { from, to: onScreen };
}

export function withValue(container: KitValues, key: string, value: unknown): KitValues {
    const next = { ...container };
    if (value === undefined) delete next[key];
    else next[key] = value;
    return next;
}

export function itemsOf(container: KitValues, key: string): KitItem[] {
    const value = container[key];
    return Array.isArray(value) ? value.filter((item): item is KitItem => isRecord(item) && typeof item.id === 'string') : [];
}

export function imageOf(container: KitValues, key: string): KitImageValue | null {
    const value = container[key];
    return isRecord(value) && typeof value.src === 'string' && value.src ? (value as unknown as KitImageValue) : null;
}

export function newItemId(): string {
    const random = globalThis.crypto?.randomUUID?.();
    return (random ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`).slice(0, 12);
}

/** A new item at the end, empty but for the list's own starting values (`newItem`), off the air when the list has the switch, marked new. */
export function withNewItem(container: KitValues, list: KitList, id = newItemId()): KitValues {
    const item: KitItem = { ...list.newItem, id, fresh: true };
    if (list.live) item.live = list.live.initial;
    return { ...container, [list.key]: [...itemsOf(container, list.key), item] };
}

export function withoutItem(container: KitValues, key: string, id: string): KitValues {
    return { ...container, [key]: itemsOf(container, key).filter((item) => item.id !== id) };
}

/** The item moved to another position; positions outside the list are clamped. */
export function withMovedItem(container: KitValues, key: string, from: number, to: number): KitValues {
    const items = [...itemsOf(container, key)];
    if (from < 0 || from >= items.length) return container;
    const target = Math.max(0, Math.min(items.length - 1, to));
    const [moved] = items.splice(from, 1);
    items.splice(target, 0, moved);
    return { ...container, [key]: items };
}

/**
 * The ids of an order list, in order (F158): what the content holds, cleaned. A name that is not one of `initial` and a repeat
 * are dropped, and an id the content lacks goes to the end in `initial`'s order, so the list always carries every item once.
 */
export function orderOf(container: KitValues, key: string, initial: readonly string[]): string[] {
    const value = container[key];
    const written = (Array.isArray(value) ? value : []).filter((id): id is string => typeof id === 'string' && initial.includes(id)).filter((id, index, all) => all.indexOf(id) === index);
    return [...written, ...initial.filter((id) => !written.includes(id))];
}

/** The id moved to another place of an order list; places outside the list are clamped. */
export function withMovedId(container: KitValues, key: string, initial: readonly string[], from: number, to: number): KitValues {
    const order = orderOf(container, key, initial);
    if (from < 0 || from >= order.length) return container;
    const target = Math.max(0, Math.min(order.length - 1, to));
    const [moved] = order.splice(from, 1);
    order.splice(target, 0, moved);
    return { ...container, [key]: order };
}

export function withItem(container: KitValues, key: string, id: string, change: (item: KitItem) => KitItem): KitValues {
    return { ...container, [key]: itemsOf(container, key).map((item) => (item.id === id ? change(item) : item)) };
}

/** The one item that carries the flag; every other loses it. */
export function withUnique(container: KitValues, key: string, flag: string, id: string): KitValues {
    return { ...container, [key]: itemsOf(container, key).map((item) => ({ ...item, [flag]: item.id === id })) };
}

/** The role an item plays (F85): the one its position fixes, else the picked one its flag holds; `null` for none. */
export function roleOf(item: KitItem, index: number, roles: KitRoles): { value?: string; label: string; fixed: boolean } | null {
    const fixed = roles.fixed?.find((role) => role.at === index);
    if (fixed) return { label: fixed.label, fixed: true };
    const picked = roles.pick.find((role) => role.value === item[roles.key]);
    return picked ? { value: picked.value, label: picked.label, fixed: false } : null;
}

/** Each role of the list, fixed and picked, in order, with the item that holds it (`-1` for none): the case's three (F85). */
export function roleHolders(items: KitItem[], roles: KitRoles): Array<{ label: string; at: number }> {
    return [...(roles.fixed ?? []), ...roles.pick].map((role) => ({
        label: role.label,
        at: items.findIndex((item, index) => roleOf(item, index, roles)?.label === role.label),
    }));
}

/** The item without the role's flag. */
export function withoutRoleFlag(item: KitItem, roles: Pick<KitRoles, 'key'>): KitItem {
    if (!(roles.key in item)) return item;
    const next = { ...item };
    delete next[roles.key];
    return next;
}

/** The role picked for one item, and taken from any other item of the list that held it (a role, one item); `''` takes it off. */
export function withRole(container: KitValues, list: KitList, id: string, value: string): KitValues {
    const roles = list.roles;
    if (!roles) return container;
    return {
        ...container,
        [list.key]: itemsOf(container, list.key).map((item) => {
            if (item.id === id) return value ? { ...item, [roles.key]: value } : withoutRoleFlag(item, roles);
            return value && item[roles.key] === value ? withoutRoleFlag(item, roles) : item;
        }),
    };
}

/**
 * The item passed from one list to another of the same scope (the chapters and the extra screens), at `index` or at the end.
 * `drop` names the role's flag it leaves behind: a role belongs to the list it was picked in (F85, REQ-02).
 */
export function withItemPassed(container: KitValues, from: string, to: string, id: string, index?: number, drop?: string): KitValues {
    const moving = itemsOf(container, from).find((item) => item.id === id);
    if (!moving) return container;
    const target = [...itemsOf(container, to)];
    target.splice(index ?? target.length, 0, drop ? withoutRoleFlag(moving, { key: drop }) : moving);
    return { ...container, [from]: itemsOf(container, from).filter((item) => item.id !== id), [to]: target };
}

/** What goes to the store: the «novo» mark is the session's, not the content's. */
export function forStore(values: KitValues): KitValues {
    const clean = (value: unknown): unknown => {
        if (Array.isArray(value)) return value.map(clean);
        if (!isRecord(value)) return value;
        const out: Record<string, unknown> = {};
        for (const [name, inner] of Object.entries(value)) if (name !== 'fresh') out[name] = clean(inner);
        return out;
    };
    return clean(values) as KitValues;
}

/** The same tree, compared by content: «N alterações sem salvar» counts the top-level keys that differ. */
export function changedKeys(before: KitValues, after: KitValues): string[] {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    return [...keys].filter((key) => JSON.stringify(forStore({ v: before[key] })) !== JSON.stringify(forStore({ v: after[key] })));
}
