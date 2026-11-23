/**
 * The words of the kit's rich editor in the site's language (F82, REQ-12): the bar's buttons with what each one does, the
 * styles, the «+» menu, the link box, the footer. They come from the dictionary (`admin.rich.*`, English and Portuguese) and
 * reach the kit through `KitTexts.rich`. Image, video and book are hidden in The Album Blender (D-06), so their words are
 * never drawn and stay the kit's own.
 */
import { RICH_TEXTS_EN, type RichTexts } from '../../ui/admin-kit/index'

type Translator = (key: string, values?: Record<string, string | number>) => string
type Plural = (key: string, count: number, values?: Record<string, string | number>) => string

const TOOLS = ['style', 'bold', 'italic', 'underline', 'strike', 'sup', 'sub', 'mark', 'link', 'quote', 'ul', 'ol', 'hr', 'box', 'clear', 'plus', 'big'] as const
const INSERTS = ['p', 'lead', 'h3', 'quote', 'ul', 'ol', 'hr', 'box'] as const
const LINK = ['title', 'address', 'placeholder', 'outside', 'remove', 'apply', 'invalid'] as const

const pair = (t: Translator, key: string) => ({ name: t(`${key}.name`), does: t(`${key}.does`) })

export function richTexts(t: Translator, tPlural: Plural): RichTexts {
    const link = Object.fromEntries(LINK.map((name) => [name, t(`admin.rich.link.${name}`)])) as RichTexts['link']
    return {
        ...RICH_TEXTS_EN,
        tools: {
            ...RICH_TEXTS_EN.tools,
            ...Object.fromEntries(TOOLS.map((id) => [id, pair(t, `admin.rich.tools.${id}`)])),
            undo: { name: t('admin.rich.tools.undo.name'), does: '' },
            redo: { name: t('admin.rich.tools.redo.name'), does: '' },
        },
        styles: { p: t('admin.rich.styles.p'), lead: t('admin.rich.styles.lead'), h3: t('admin.rich.styles.h3') },
        groups: { ...RICH_TEXTS_EN.groups, text: t('admin.rich.groups.text'), blocks: t('admin.rich.groups.blocks') },
        inserts: { ...RICH_TEXTS_EN.inserts, ...Object.fromEntries(INSERTS.map((id) => [id, pair(t, `admin.rich.inserts.${id}`)])) },
        toolbar: t('admin.rich.toolbar'),
        count: (words, minutes) => tPlural('admin.rich.count', words, { count: words, minutes }),
        footHint: t('admin.rich.footHint'),
        pasted: t('admin.rich.pasted'),
        calloutPlaceholder: t('admin.rich.callout'),
        expanded: { kicker: t('admin.rich.expanded.kicker'), close: t('admin.rich.expanded.close') },
        link,
        plainHint: t('admin.rich.plainHint'),
    }
}
