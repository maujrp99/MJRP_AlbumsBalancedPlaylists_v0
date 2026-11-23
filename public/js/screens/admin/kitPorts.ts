/**
 * What The Album Blender hands the admin kit (F82; the kit's boundary is `KitPorts`, ui/admin-kit/ports.ts): the kit's own
 * words from the site's dictionary (`admin.kit.*`, English and Portuguese), the storage on the content repository, the
 * navigation on the app's router (the kit never touches `history`), the translation by the server's route and the rich
 * field's pages. The copy of the kit is never edited: what it lacks comes through here and through the skin.
 */
import type { KitLocation, KitNavigation, KitPorts, KitResult, KitTexts, KitTranslateTexts, KitValues } from '../../ui/admin-kit/index'
import { editsOf, toKitValues, type Dict, type Locale, type Sources } from './model'
import type { TranslateReason } from './translate'

/** The words the kit asks for one by one (`KitTexts`), each `admin.kit.<name>` in the dictionary. */
const KIT_WORDS = [
    'saved', 'unsaved', 'unsavedOne', 'save', 'saving', 'day', 'night', 'loadFailed', 'retry', 'saveFailed', 'conflict', 'reload', 'sessionExpired',
    'signIn', 'refused', 'untranslated', 'edit', 'close', 'remove', 'confirmRemove', 'moveUp', 'moveDown', 'drag', 'live', 'offAir', 'fresh', 'empty',
    'onPage', 'whereItShows', 'upload', 'replace', 'removeImage', 'newMark', 'undo', 'sentBuild', 'uploading', 'uploaded', 'noImage', 'standardTitle',
    'inUse', 'backToStandard', 'uploadIcon', 'iconNewMark', 'keepsUntilBuild', 'iconStays', 'tabSample', 'cropNeeded', 'notSent', 'sent', 'sentNext',
    'ready', 'usePicked', 'cropTop', 'cropCenter', 'cropBottom', 'measure', 'back', 'sequence', 'sectionIndex', 'sectionIndexLabel', 'menu',
    'openSection', 'sectionCount',
] as const
const TRANSLATE_WORDS = ['from', 'busy', 'nothing', 'original', 'suggestion', 'replaces', 'overLimit', 'failed', 'accept', 'discard', 'again', 'retry', 'review'] as const

type Translator = (key: string) => string
type Plain = Omit<KitTexts, 'problems' | 'required' | 'translate' | 'rich' | 'marker' | 'paragraphsHint'>

/**
 * The words of the translate piece. The kit knows three reasons of a failure; the Painel has six (REQ-13: «not configured»
 * is said in plain words), so the reason the kit reads as «the service did not answer» is the one `reason()` names now.
 */
export function kitTranslateTexts(t: Translator, reason: () => TranslateReason): KitTranslateTexts {
    const words = Object.fromEntries(TRANSLATE_WORDS.map((name) => [name, t(`admin.kit.translate.${name}`)])) as Omit<KitTranslateTexts, 'languages' | 'reasons'>
    return {
        ...words,
        languages: { en: t('admin.kit.translate.lang.en'), pt: t('admin.kit.translate.lang.pt') },
        reasons: {
            get service() { return t(`admin.translate.reason.${reason()}`) },
            session: t('admin.translate.reason.session'),
            credit: t('admin.translate.reason.credit'),
        },
    }
}

/** The kit's interface words in the language the site speaks now. */
export function kitTexts(t: Translator, reason: () => TranslateReason = () => 'service'): KitTexts {
    const plain = Object.fromEntries(KIT_WORDS.map((name) => [name, t(`admin.kit.${name}`)])) as Plain
    return { ...plain, problems: { summary: t('admin.kit.problems.summary') }, translate: kitTranslateTexts(t, reason) }
}

/** The address of the Painel and of a screen's texts inside it. */
export const ADMIN_PATH = '/admin'
export const hrefOf = (path: string): string => (path ? `${ADMIN_PATH}/texts/${path}` : ADMIN_PATH)

/** The screen an address of the Painel names: `/admin/texts/blend` is `blend`. */
export function locationOf(pathname: string): KitLocation {
    const [, , section, screen] = pathname.split('/')
    return { path: section === 'texts' && screen ? decodeURIComponent(screen) : '' }
}

export interface RouterPort {
    /** The address the browser is at. */
    pathname: () => string
    /** Writes the address of the same screen (the router owns the history: router.setAddress). */
    setAddress: (path: string, options?: { replace?: boolean }) => void
    /** Be told after the router moved; returns the way to stop. */
    afterNavigate: (hook: () => void) => () => void
}

/** The kit's navigation on the app's router: the Painel asks, the router writes the history. */
export function routerNavigation(router: RouterPort): KitNavigation {
    return {
        where: () => locationOf(router.pathname()),
        go: (target, options) => router.setAddress(hrefOf(target.path), options),
        listen: (changed) => router.afterNavigate(changed),
    }
}

/** The stored content the Painel works on: what was read, with the revisions the saves are checked against. */
export interface Stored {
    sources: Sources
    revs: Record<Locale, number>
    /** The account still has its administrator record (it can be taken away while the Painel is open). */
    allowed: boolean
}

export type SaveAnswer =
    | { status: 'saved' | 'unchanged'; rev: number; texts: Dict; changed?: string[] }
    | { status: 'conflict'; rev: number; texts: Dict; conflicts: Array<{ key: string; loaded: string | null; other: string | null; yours: string | null }> }

/** The storage the Painel is given (the content repository behind it; a test hands its own). */
export interface ContentStore {
    read: () => Promise<Stored>
    saveTexts: (locale: Locale, ask: { loadedRev: number; loadedTexts: Dict; edits: Dict }) => Promise<SaveAnswer>
    /** Keeps the keys whose Portuguese the owner approved (the whole list). */
    saveApproved: (keys: string[]) => Promise<void>
}

const versionOf = (revs: Record<Locale, number>): string => `${revs.en}.${revs.pt}`

/** The failure of a save, in the kit's names, from what the database said. */
export function failureOf(error: unknown): { failure: 'refused' | 'session-expired' | 'save-failed'; message?: string } {
    const code = String((error as { code?: unknown } | null)?.code ?? '')
    if (code.includes('permission-denied')) return { failure: 'refused' }
    if (code.includes('unauthenticated')) return { failure: 'session-expired' }
    return { failure: 'save-failed', message: code || undefined }
}

export interface KitPortsDeps {
    store: ContentStore
    navigation: KitNavigation
    translate: (text: string, target: string) => Promise<KitResult<string>>
    texts: KitTexts
    /** The pages of the site a running text may link to. */
    pages: Array<{ label: string; href: string }>
}

/** `KitPorts` for The Album Blender: no image slot (the owner hid image, video and book), the rest on the site's own pieces. */
export function albumBlenderPorts(deps: KitPortsDeps): KitPorts {
    let stored: Stored | null = null
    return {
        async load() {
            try {
                stored = await deps.store.read()
                return { ok: true, value: { values: toKitValues(stored.sources), version: versionOf(stored.revs) } }
            } catch (error) {
                return { ok: false, failure: 'read-failed', message: String((error as Error)?.message ?? '') }
            }
        },
        async save(values: KitValues, version: string) {
            if (!stored || version !== versionOf(stored.revs)) return { ok: false, failure: 'conflict' }
            const before = toKitValues(stored.sources)
            try {
                for (const locale of ['en', 'pt'] as const) {
                    const edits = editsOf(before, values, locale)
                    if (!Object.keys(edits).length) continue
                    const answer = await deps.store.saveTexts(locale, { loadedRev: stored.revs[locale], loadedTexts: stored.sources.published[locale], edits })
                    if (answer.status === 'conflict') return { ok: false, failure: 'conflict' }
                    stored = { ...stored, sources: { ...stored.sources, published: { ...stored.sources.published, [locale]: answer.texts } }, revs: { ...stored.revs, [locale]: answer.rev } }
                }
                return { ok: true, value: { version: versionOf(stored.revs) } }
            } catch (error) {
                return { ok: false, ...failureOf(error) }
            }
        },
        imageRule: () => '',
        checkImage: async () => ({ ok: false, message: deps.texts.refused }),
        uploadImage: async () => ({ ok: false, failure: 'refused' }),
        translate: deps.translate,
        signInHref: '/start?signin',
        hrefOf: (path) => hrefOf(path),
        navigation: deps.navigation,
        texts: deps.texts,
        richText: { pages: deps.pages },
    }
}
