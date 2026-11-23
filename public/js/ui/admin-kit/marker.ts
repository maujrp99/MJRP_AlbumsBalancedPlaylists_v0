// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
/**
 * The marker (F127, S-153; `info-arch.md` `^cms-company-where`, `^cms-company-changed`, `^cms-company-marker`,
 * `^cms-company-literal`): a value the author types once, in one field, and the phrases that need it carry a token. This
 * file holds the rules the screen needs and no more: which places carry the token, the value in a language, the phrase as
 * the site will have it, where the author typed the value by hand, and the token put in a phrase.
 *
 * Pure: no React, no project import. The kit knows no name; the schema says which field it is and which token.
 */
import { elementsOf, type KitField, type KitList, type KitMarker, type KitSchema, type KitSection } from './schema';
import { itemsOf, textOf, type KitValues } from './values';

/** One place of the site that carries the token: where it is, what it is called, and the phrase. */
export interface MarkerPlace {
    /** The section's title: the places are grouped by it. */
    group: string;
    /** The field's name, and the item's, when the field is one of a list's. */
    name: string;
    /** The phrase in the language on the screen (or in the other one, when only that one carries the token), with the token. */
    phrase: string;
    /** What the list shows in bold in place of the whole value: the box at the top takes only its first word. */
    highlight?: string;
    /** Where the author goes to edit it; absent for a place outside this panel. */
    go?: { path: string; itemId?: string; block: string };
}

/** The value in a language, as the readers read it: the main language's when the language asked for is blank. */
export function markerValue(schema: KitSchema, values: KitValues, language: string): string {
    const marker = schema.marker;
    if (!marker) return '';
    return (textOf(values, marker.key, language).trim() || textOf(values, marker.key, schema.languages[0]).trim());
}

/** Every distinct value the field holds, in every language: what the author may have typed by hand in a phrase. */
export function markerNames(schema: KitSchema, ...sources: KitValues[]): string[] {
    const marker = schema.marker;
    if (!marker) return [];
    const names = sources.flatMap((values) => schema.languages.map((language) => textOf(values, marker.key, language).trim()));
    return [...new Set(names.filter(Boolean))];
}

const escape = (word: string): string => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The name typed by hand: the first word of a known name, then as many of its next words as follow it. «Mauctus» and
 * «MAUCTUS Systems» both match the name «Mauctus Systems & Advisory» (the migration's own rule, F127), in any case, as whole
 * words.
 */
export function literalPattern(names: string[]): RegExp | null {
    const parts = names.map((name) => name.trim().split(/\s+/).filter(Boolean).map(escape)).filter((words) => words.length > 0).map((words) =>
        words[0] + words.slice(1).reduceRight((tail, word) => `(?:\\s+${word}${tail})?`, ''));
    if (!parts.length) return null;
    return new RegExp(`(?<![\\p{L}\\p{N}])(?:${parts.join('|')})(?![\\p{L}\\p{N}])`, 'giu');
}

/** Whether the phrase has the name typed by hand. */
export function hasLiteral(text: string, names: string[]): boolean {
    const pattern = literalPattern(names);
    return pattern !== null && pattern.test(text);
}

/** The phrase with every name typed by hand swapped for the token. */
export function withToken(text: string, names: string[], token: string): string {
    const pattern = literalPattern(names);
    return pattern ? text.replace(pattern, () => token) : text;
}

/** The phrase as the site has it: the token swapped for the value. With no value, as it is. */
export function phraseWithValue(text: string, token: string, value: string): string {
    return value && text.includes(token) ? text.split(token).join(value) : text;
}

/** The token put in a phrase where the cursor is (or over the selection); `caret` is where the cursor goes after it. */
export function insertToken(text: string, start: number, end: number, token: string): { text: string; caret: number } {
    const from = Math.max(0, Math.min(start, text.length));
    const to = Math.max(from, Math.min(end, text.length));
    return { text: text.slice(0, from) + token + text.slice(to), caret: from + token.length };
}

/** The word the box at the top shows when the author leaves «marca no topo» blank: the value's first word, in capitals. */
export function firstWord(value: string): string {
    return (value.trim().split(/\s+/)[0] ?? '').toUpperCase();
}

/** Whether the box at the top follows the value: its field (`marker.mark`) is blank in every language. */
export function followsValue(marker: KitMarker, schema: KitSchema, values: KitValues): boolean {
    return !marker.mark || schema.languages.every((language) => !textOf(values, marker.mark!.key, language).trim());
}

/** What the search of the places carries: the token, the languages, and the places already listed. */
interface PlaceSearch {
    schema: KitSchema;
    language: string;
    token: string;
    /** The same text can sit on two screens (a project's summary, in its list and in its case): it is one place, the first. */
    fresh: (...path: Array<string | undefined>) => boolean;
}

type Go = NonNullable<MarkerPlace['go']>;

/** The phrase of a field that carries the token: the language on the screen's, or the other's when only that one carries it. */
function phraseOf(search: PlaceSearch, container: KitValues, field: KitField): string | null {
    const order = [search.language, ...search.schema.languages.filter((code) => code !== search.language)];
    const found = order.map((code) => textOf(container, field.key, code)).find((text) => text.includes(search.token));
    return found ?? null;
}

/** The place of one field, when it is `marked`, its phrase carries the token and it was not listed yet. */
function fieldPlace(search: PlaceSearch, field: KitField, container: KitValues, path: Array<string | undefined>, place: { group: string; name: string; go: Go }): MarkerPlace[] {
    if (!field.marked) return [];
    const phrase = phraseOf(search, container, field);
    if (phrase === null || !search.fresh(...path, field.key)) return [];
    return [{ group: place.group, name: place.name, phrase, go: { ...place.go } }];
}

/** The places in the items of a list: each marked field, named with the item's title. */
function listPlaces(search: PlaceSearch, list: KitList, container: KitValues, path: Array<string | undefined>, group: string, go: Go): MarkerPlace[] {
    const out: MarkerPlace[] = [];
    for (const item of itemsOf(container, list.key)) {
        const title = textOf(item, list.titleField, search.language) || textOf(item, list.titleField, search.schema.languages[0]);
        for (const field of list.fields) {
            if (field.kind !== 'field') continue;
            out.push(...fieldPlace(search, field, item, [...path, list.key, item.id], { group, name: title ? `${field.label} · ${title}` : field.label, go }));
        }
    }
    return out;
}

/** The contents a section reads: the panel's, or each item of the list it shows one of. */
function holdersOf(section: KitSection, values: KitValues): Array<{ container: KitValues; itemId: string | undefined }> {
    if (!section.scope) return [{ container: values, itemId: undefined }];
    return itemsOf(values, section.scope.list).map((item) => ({ container: item as KitValues, itemId: item.id }));
}

/** The places of one section, block by block, in the order of the screen. */
function sectionPlaces(search: PlaceSearch, section: KitSection, values: KitValues): MarkerPlace[] {
    const out: MarkerPlace[] = [];
    for (const { container, itemId } of holdersOf(section, values)) {
        const path = section.scope ? [section.scope.list, itemId] : [];
        for (const block of section.blocks) {
            const go: Go = { path: section.path, itemId, block: block.id };
            for (const element of elementsOf([block])) {
                if (element.kind === 'field') out.push(...fieldPlace(search, element, container, path, { group: section.title, name: element.label, go }));
                else if (element.kind === 'list') out.push(...listPlaces(search, element, container, path, section.title, go));
            }
        }
    }
    return out;
}

/**
 * Every place of the panel whose phrase carries the token, in the order of the menu, then the places outside the panel.
 * A phrase counts when it is a `marked` field with the token in any language; the one shown is the language on the screen's,
 * or the other's when only that one carries it.
 */
export function markerPlaces(schema: KitSchema, values: KitValues, language: string): MarkerPlace[] {
    const marker = schema.marker;
    if (!marker) return [];
    const out: MarkerPlace[] = [];
    const seen = new Set<string>();
    const fresh = (...path: Array<string | undefined>): boolean => {
        const id = path.join('/');
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
    };
    const search: PlaceSearch = { schema, language, token: marker.token, fresh };
    // The box at the top is the first place while it follows the value: it shows the value's first word.
    if (marker.mark && followsValue(marker, schema, values)) out.push({ group: marker.mark.group, name: marker.mark.name, phrase: '', highlight: firstWord(markerValue(schema, values, language)) });
    for (const section of schema.sections) out.push(...sectionPlaces(search, section, values));
    for (const place of marker.elsewhere ?? []) out.push({ group: place.group, name: place.name, phrase: '' });
    return out;
}

/** The places grouped by the group's name, in the order they first appear. */
export function groupPlaces(places: MarkerPlace[]): Array<{ group: string; places: MarkerPlace[] }> {
    const groups: Array<{ group: string; places: MarkerPlace[] }> = [];
    for (const place of places) {
        const found = groups.find((entry) => entry.group === place.group);
        if (found) found.places.push(place);
        else groups.push({ group: place.group, places: [place] });
    }
    return groups;
}

/**
 * A long phrase cut around the token, so the list always shows where the name enters: some words before it, some after,
 * and an ellipsis where the phrase goes on.
 */
export function excerpt(text: string, token: string, before = 36, after = 28): string {
    const at = text.indexOf(token);
    const limit = before + token.length + after;
    if (text.length <= limit) return text;
    if (at < 0) return `${text.slice(0, limit).trimEnd()}…`;
    const start = Math.max(0, at - before);
    const end = Math.min(text.length, at + token.length + after);
    return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
}
