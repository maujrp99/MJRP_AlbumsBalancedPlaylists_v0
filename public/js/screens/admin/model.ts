/**
 * The Painel's texts, as plain data (F82, REQ-01, REQ-06, REQ-09; TASK-01): the adapter between the site's dictionaries
 * (one file per language, `key -> text`) and the pairs the admin kit edits (`key -> { en, pt, state }`), and the questions
 * the screen asks of them: which screen a key belongs to, what waits for the owner, what changed, what a search finds.
 *
 * Pure: no React, no Firebase, no `t()`. The published layer wins over the code's, as on the site.
 */
import { changedKeys, stateOf, textOf, withText, type KitText, type KitValues } from '../../ui/admin-kit/index'

export type Locale = 'en' | 'pt'
export type Dict = Record<string, string>
export type TextKind = 'plain' | 'short' | 'rich'

export const LOCALES: readonly Locale[] = ['en', 'pt']
/** The state of a Portuguese text an agent proposed and the owner has not approved yet. */
export const PENDING = 'pending'

export interface Sources {
    /** The dictionaries of the code, by language. */
    code: Record<Locale, Dict>
    /** What is published (only the keys that differ from the code), by language. */
    published: Record<Locale, Dict>
    /** The keys whose Portuguese the owner approved. */
    approved: readonly string[]
}

const layered = (sources: Sources, locale: Locale, key: string): string => sources.published[locale][key] ?? sources.code[locale][key] ?? ''

/** Every key the Painel shows, in the dictionary's order: the code's, then the published ones the code lost (the orphans). */
export function allKeys(sources: Sources): string[] {
    const orphans = [...Object.keys(sources.published.en), ...Object.keys(sources.published.pt)].filter((key) => !(key in sources.code.en)).sort()
    return [...new Set([...Object.keys(sources.code.en), ...orphans])]
}

/** The dictionaries as the kit's pairs: `{ key: { en, pt, state? } }`. */
export function toKitValues(sources: Sources): KitValues {
    const approved = new Set(sources.approved)
    const values: KitValues = {}
    for (const key of allKeys(sources)) {
        const pair: KitText = { en: layered(sources, 'en', key), pt: layered(sources, 'pt', key) }
        if (pair.pt && !approved.has(key)) pair.state = PENDING
        values[key] = pair
    }
    return values
}

/** What the owner changed in one language since the read: `key -> new text` (the `edits` of the save). */
export function editsOf(saved: KitValues, values: KitValues, locale: Locale): Dict {
    const edits: Dict = {}
    for (const key of changedKeys(saved, values)) {
        const now = textOf(values, key, locale)
        if (now !== textOf(saved, key, locale)) edits[key] = now
    }
    return edits
}

/** The keys with a change not saved, in any language. */
export function unsavedKeys(saved: KitValues, values: KitValues): string[] {
    return LOCALES.flatMap((locale) => Object.keys(editsOf(saved, values, locale))).filter((key, index, all) => all.indexOf(key) === index)
}

export const isPending = (values: KitValues, key: string): boolean => stateOf(values, key) === PENDING

/** A text typed by the owner; the review state of the pair is kept as it is (approving is its own act). */
export function withEdit(values: KitValues, key: string, locale: Locale, text: string): KitValues {
    return withText(values, key, locale, text)
}

/** The screen (the dictionary's area) a key belongs to: `albums.card.title` is of `albums`. */
export const screenOf = (key: string): string => key.split('.')[0] ?? ''

/** The screens, in the dictionary's order, with how many Portuguese texts of each wait for the owner. */
export function screensOf(values: KitValues): Array<{ id: string; waiting: number }> {
    const screens = new Map<string, number>()
    for (const key of Object.keys(values)) {
        const id = screenOf(key)
        screens.set(id, (screens.get(id) ?? 0) + (isPending(values, key) ? 1 : 0))
    }
    return [...screens].map(([id, waiting]) => ({ id, waiting }))
}

const has = (text: string, query: string): boolean => text.toLowerCase().includes(query)

export interface Filter {
    screen: string
    query: string
    onlyPending: boolean
}

/** The keys of the list: with a search, of every screen (the English, the Portuguese and the key); without, of the screen. */
export function visibleKeys(values: KitValues, filter: Filter): string[] {
    const query = filter.query.trim().toLowerCase()
    return Object.keys(values).filter((key) => {
        if (query) return has(key, query) || has(textOf(values, key, 'en'), query) || has(textOf(values, key, 'pt'), query)
        return screenOf(key) === filter.screen && (!filter.onlyPending || isPending(values, key))
    })
}

/** The keys of a screen whose Portuguese waits. */
export function pendingOf(values: KitValues, screen: string): string[] {
    return Object.keys(values).filter((key) => screenOf(key) === screen && isPending(values, key))
}
