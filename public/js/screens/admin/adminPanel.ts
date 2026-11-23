/**
 * The route of the Painel (/admin): what app.js asks for AFTER the administrator's record was read (F82, REQ-01). This file,
 * the kit, the skin and the Painel's own texts come down only then: nobody else ever asks for them.
 *
 * It hands the Painel everything it uses: the storage on the content repository, the site's check of a text, the kit's
 * ports (the router, the translation by the server's route, the kit's words from the dictionary) and what the site reads.
 */
import '../../ui/admin-kit/kit.css'
import '../../ui/admin-kit/required.css'
import '../../../css/admin-skin.css'
import { parseRich } from '@mjrp/admin-kit-core'
import { basicParseRich, readTextsDocument, validateText } from '@shared/content/texts.js'
import { serverFetch } from '../../api/serverFetch.js'
import { en } from '../../i18n/en/index.js'
import { admin as adminEn } from '../../i18n/en/admin.js'
import { pt } from '../../i18n/pt/index.js'
import { admin as adminPt } from '../../i18n/pt/admin.js'
import { registerPublishedTexts, registerTexts, t, tPlural } from '../../i18n/t.js'
import { kindOf } from '../../i18n/textKinds.js'
import { ReactView } from '../../react-bridge/ReactView'
import { router } from '../../router.js'
import { AuthService } from '../../services/AuthService.js'
import { contentWriter } from '../../services/content/adminContent.js'
import { getContentState } from '../../services/content/contentWiring.js'
import { TextsPanel, type PanelProps } from './TextsPanel'
import { contentStore, type ContentRepository } from './contentStore'
import { albumBlenderPorts, kitTexts, routerNavigation } from './kitPorts'
import { installLeaveGuard } from './leaveGuard'
import { richTexts } from './richTexts'
import type { TextKind } from './model'
import { translateText, type TranslateAsk, type TranslateBody, type TranslateReason } from './translate'

const MEDIA = new Set(['image', 'video', 'book'])
/** The pages of the site a running text may link to, as the link box of the rich editor offers them. */
const PAGES = [
    { label: 'Create', href: '/start' }, { label: 'Albums', href: '/albums' }, { label: 'Blend', href: '/blend' },
    { label: 'Inventory', href: '/inventory' }, { label: 'Playlists', href: '/saved-playlists' },
]

registerTexts('en', adminEn)
registerTexts('pt', adminPt)

/** A running text is read by the site's parser, and carries no image, video or book (the owner hid them here: D-06). */
function readRich(text: string): { ok: boolean; links: string[] } {
    if (parseRich(text).some((block) => MEDIA.has(block.t))) return { ok: false, links: [] }
    return basicParseRich(text)
}

async function post(path: string, body: TranslateBody): Promise<{ status: number; body: unknown }> {
    const response = await serverFetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    return { status: response.status, body: await response.json().catch(() => null) }
}

function panelProps(): PanelProps {
    let reason: TranslateReason = 'service'
    const translate = (ask: TranslateAsk) => translateText({ post, onFailure: (why) => { reason = why } }, ask)
    const store = contentStore({
        repository: (): Promise<ContentRepository> => contentWriter(),
        uid: () => AuthService.getCurrentUser()?.uid ?? '',
        // The site's own dictionaries only: the Painel's words (admin.*) are not edited here in this iteration (the site's reader knows the site's keys alone)
        code: { en, pt },
        readDocument: readTextsDocument,
    })
    const ports = albumBlenderPorts({
        store,
        navigation: routerNavigation({
            pathname: () => window.location.pathname,
            setAddress: (path, options) => router.setAddress(path, options),
            afterNavigate: (hook) => router.afterNavigate(hook) as () => void,
        }),
        translate: (text, target) => translate({ text, target, kind: 'plain' }),
        texts: { ...kitTexts(t, () => reason), rich: richTexts(t, tPlural) },
        pages: PAGES,
    })
    return {
        store, ports, translate,
        kindOf: (key): TextKind => kindOf(key),
        check: (text, english, of) => {
            const verdict = validateText(text, english, { kind: of, parseRich: readRich })
            return verdict.ok ? { ok: true, warning: verdict.warning } : { ok: false, reason: verdict.reason }
        },
        published: (locale, texts) => registerPublishedTexts(locale, texts),
        siteState: (locale) => getContentState(locale),
        guardLeave: (unsaved) => installLeaveGuard({ beforeNavigate: (hook) => router.beforeNavigate(hook) as () => void, question: () => t('admin.leave') }, unsaved),
    }
}

export function adminView() {
    return new ReactView(TextsPanel, panelProps(), { screen: 'admin' })
}
