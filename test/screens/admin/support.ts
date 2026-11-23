/**
 * The scaffold of the Painel's tests (F82): a storage in memory in place of the content repository, a check with the
 * rules the screen names (empty, the {placeholders} of the English, three times its size), and the kit's ports with a
 * navigation in memory. The real check is shared/content's and has its own tests.
 */
import { admin as adminEn } from '../../../public/js/i18n/en/admin.js'
import { admin as adminPt } from '../../../public/js/i18n/pt/admin.js'
import { registerTexts, t, tPlural } from '../../../public/js/i18n/t.js'
import { richTexts } from '../../../public/js/screens/admin/richTexts'
import type { PanelProps, SiteState } from '../../../public/js/screens/admin/TextsPanel'
import { albumBlenderPorts, kitTexts, type ContentStore, type SaveAnswer, type Stored } from '../../../public/js/screens/admin/kitPorts'
import type { Dict, Locale } from '../../../public/js/screens/admin/model'
import type { TranslateAsk, TranslateReason } from '../../../public/js/screens/admin/translate'
import type { Check } from '../../../public/js/screens/admin/usePanel'
import type { KitLocation, KitNavigation, KitResult } from '../../../public/js/ui/admin-kit/index'

registerTexts('en', adminEn)
registerTexts('pt', adminPt)

export const CODE: Record<Locale, Dict> = {
    en: { 'albums.title': 'Albums', 'albums.count': '{count} albums', 'blend.title': 'Blend', 'start.lead': '**Running** text' },
    pt: { 'albums.title': 'Álbuns', 'albums.count': '{count} álbuns', 'blend.title': 'Mistura', 'start.lead': '**Texto** corrido' },
}

export function stored(over: Partial<Stored> = {}): Stored {
    return { sources: { code: CODE, published: { en: {}, pt: {} }, approved: ['blend.title', 'start.lead'] }, revs: { en: 3, pt: 5 }, allowed: true, ...over }
}

const holes = (text: string): string => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort().join(',')

export function check(text: string, english: string): Check {
    if (!text.trim()) return { ok: false, reason: 'empty' }
    if (holes(text) !== holes(english)) return { ok: false, reason: 'placeholders' }
    if (text.length > english.length * 3) return { ok: false, reason: 'too_long' }
    return { ok: true, warning: text.length > english.length * 1.5 ? 'long' : null }
}

export interface FakeStore extends ContentStore {
    saves: Array<{ locale: Locale; loadedRev: number; edits: Dict }>
    approved: string[][]
}

export interface FakeOptions {
    start?: Stored
    /** What the read does instead of answering. */
    read?: () => Promise<Stored>
    /** What a save answers instead of «saved» (once; the next save goes through). */
    answer?: (locale: Locale, ask: { loadedRev: number; loadedTexts: Dict; edits: Dict }) => Promise<SaveAnswer>
}

export function fakeStore(options: FakeOptions = {}): FakeStore {
    let now = options.start ?? stored()
    let answer = options.answer
    const store: FakeStore = {
        saves: [],
        approved: [],
        read: options.read ?? (async () => now),
        async saveTexts(locale, ask) {
            store.saves.push({ locale, loadedRev: ask.loadedRev, edits: ask.edits })
            if (answer) {
                const once = answer
                answer = undefined
                return once(locale, ask)
            }
            const texts = { ...ask.loadedTexts }
            for (const [key, text] of Object.entries(ask.edits)) {
                if (text === null) delete texts[key]
                else texts[key] = text
            }
            now = { ...now, sources: { ...now.sources, published: { ...now.sources.published, [locale]: texts } }, revs: { ...now.revs, [locale]: ask.loadedRev + 1 } }
            return { status: 'saved', rev: ask.loadedRev + 1, texts, changed: Object.keys(ask.edits) }
        },
        async saveApproved(keys) { store.approved.push(keys) },
    }
    return store
}

export function memoryNavigation(start = ''): KitNavigation & { went: Array<KitLocation & { replace?: boolean }> } {
    let where: KitLocation = { path: start }
    const listeners = new Set<() => void>()
    const went: Array<KitLocation & { replace?: boolean }> = []
    return {
        went,
        where: () => where,
        go: (target, options) => { where = target; went.push({ ...target, ...options }) },
        listen: (changed) => { listeners.add(changed); return () => { listeners.delete(changed) } },
    }
}

export interface PropsOptions extends FakeOptions {
    site?: SiteState
    translate?: (ask: TranslateAsk) => Promise<KitResult<string>>
    reason?: () => TranslateReason
    screen?: string
    guardLeave?: PanelProps['guardLeave']
}

export function panelProps(options: PropsOptions = {}): PanelProps & { store: FakeStore; went: Array<KitLocation & { replace?: boolean }> } {
    const store = fakeStore(options)
    const translate = options.translate ?? (async (ask) => ({ ok: true as const, value: `[${ask.target}] ${ask.text}` }))
    const navigation = memoryNavigation(options.screen ?? 'albums')
    const ports = albumBlenderPorts({
        store, navigation, pages: [{ label: '/start', href: '/start' }],
        translate: (text, target) => translate({ text, target, kind: 'plain' }),
        texts: { ...kitTexts(t, options.reason), rich: richTexts(t, tPlural) },
    })
    return {
        store, ports, translate, check, went: navigation.went, guardLeave: options.guardLeave,
        kindOf: (key) => (key === 'start.lead' ? 'rich' : 'plain'),
        siteState: () => options.site ?? { source: 'published', rejected: [] },
    }
}

/** Types in a field the way a person does: React hears the `input` event of the browser's own setter. */
export function type(field: HTMLInputElement | HTMLTextAreaElement, text: string): void {
    const proto = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(field, text)
    field.dispatchEvent(new Event('input', { bubbles: true }))
}
