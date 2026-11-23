/**
 * One text of the Painel (F82, REQ-01, REQ-12, REQ-13): the key, the English and the Portuguese side by side, what state
 * it is in, and, open, the two fields of the admin kit. A label, a button or a menu item is a plain one-line field; a
 * running text is the kit's rich editor. Each field has the kit's «translate» from the other language, with its review.
 */
import { useMemo } from 'react'
import { textOf, type KitPorts, type KitResult } from '../../ui/admin-kit/index'
import { TextField } from '../../ui/admin-kit/react'
import { t } from '../../i18n/t.js'
import { LOCALES, isPending, type Locale, type TextKind } from './model'
import type { TranslateAsk } from './translate'
import type { Check, Panel } from './usePanel'

export interface RowDeps {
    ports: KitPorts
    kindOf: (key: string) => TextKind
    check: (text: string, english: string, kind: TextKind) => Check
    translate: (ask: TranslateAsk) => Promise<KitResult<string>>
}

export interface RowProps {
    id: string
    panel: Panel
    deps: RowDeps
    open: boolean
    onOpen: (key: string | null) => void
    selected: boolean
    onSelect: (key: string, on: boolean) => void
    /** The published text of this key was refused by the site's check (the reason's code), by language. */
    rejected: Partial<Record<Locale, string>>
}

const changed = (panel: Panel, key: string, locale: Locale): boolean => textOf(panel.values, key, locale) !== textOf(panel.saved, key, locale)

function Tags({ id, panel, orphan, rich, rejected }: { id: string; panel: Panel; orphan: boolean; rich: boolean; rejected: boolean }) {
    const unsaved = LOCALES.some((locale) => changed(panel, id, locale))
    const waiting = isPending(panel.values, id)
    return (
        <div className="cms-tags">
            {rich && <span className="ak-badge">{t('admin.tag.rich')}</span>}
            {orphan && <span className="ak-badge warn" data-tag="orphan">{t('admin.tag.orphan')}</span>}
            {rejected && <span className="ak-badge err" data-tag="rejected">{t('admin.tag.rejected')}</span>}
            {waiting && <span className="ak-badge new" data-tag="pending">{t('admin.tag.pending')}</span>}
            {unsaved && <span className="ak-badge accent" data-tag="unsaved">{t('admin.tag.unsaved')}</span>}
            {!waiting && !unsaved && !orphan && <span className="ak-badge" data-tag="live">{t('admin.tag.live')}</span>}
        </div>
    )
}

function Field({ id, locale, panel, deps, english }: { id: string; locale: Locale; panel: Panel; deps: RowDeps; english: string }) {
    const kind = deps.kindOf(id)
    const text = textOf(panel.values, id, locale)
    const verdict = changed(panel, id, locale) ? deps.check(text, english, kind) : null
    const words = deps.ports.texts.translate
    const fieldId = ['cms', id, locale].join('-')
    const translate = useMemo(() => (words ? { t: words, run: (source: string, target: string) => deps.translate({ text: source, target, kind, context: id }) } : undefined), [words, deps, kind, id])
    return (
        <div className="cms-field" data-lang={locale}>
            <TextField id={fieldId} label={t(`admin.lang.${locale}`)} kind={kind === 'rich' ? 'rich' : 'short'} languages={LOCALES} tabs={false} showing={locale}
                values={{ en: textOf(panel.values, id, 'en'), pt: textOf(panel.values, id, 'pt') }} invalid={verdict?.ok === false}
                onChange={(_language, next) => panel.edit(id, locale, next)} translate={translate} rich={{ ports: deps.ports.richText, texts: deps.ports.texts.rich }}
                below={verdict && (verdict.ok
                    ? verdict.warning && <span className="ak-hint cms-warn" data-warning={verdict.warning}>{t(`admin.warning.${verdict.warning}`)}</span>
                    : <span className="ak-err-t" role="alert" data-invalid={verdict.reason}>{t(`admin.invalid.${verdict.reason}`)}</span>)} />
        </div>
    )
}

export function TextRow({ id, panel, deps, open, onOpen, selected, onSelect, rejected }: RowProps) {
    const english = panel.stored?.sources.code.en[id]
    const orphan = english === undefined
    const waiting = isPending(panel.values, id)
    return (
        <div className={open ? 'cms-row is-edit' : 'cms-row'} data-key={id}>
            <div className="cms-chk">
                {waiting && <label><input type="checkbox" checked={selected} aria-label={t('admin.texts.select', { key: id })} onChange={(event) => onSelect(id, event.target.checked)} /></label>}
            </div>
            <div className="cms-key">{id}</div>
            {LOCALES.map((locale) => (
                <div key={locale} className={changed(panel, id, locale) ? 'cms-cell ch' : 'cms-cell'} data-cell={locale}>
                    <span className="cms-lbl">{t(`admin.lang.${locale}`)}</span>
                    <span className="cms-text">{textOf(panel.values, id, locale)}</span>
                    {rejected[locale] && <span className="ak-err-t">{t(`admin.invalid.${rejected[locale]}`)}</span>}
                    {locale === 'pt' && <Tags id={id} panel={panel} orphan={orphan} rich={deps.kindOf(id) === 'rich'} rejected={Boolean(rejected.en || rejected.pt)} />}
                </div>
            ))}
            <div className="cms-row-acts">
                {waiting && <button type="button" className="ak-btn sm" data-act="approve" onClick={() => panel.approve([id])}>{t('admin.texts.approveOne')}</button>}
                {!orphan && <button type="button" className="ak-btn sm" data-act="edit" aria-expanded={open} onClick={() => onOpen(open ? null : id)}>{open ? t('admin.texts.close') : t('admin.texts.edit')}</button>}
            </div>
            {orphan && <p className="ak-hint cms-wide">{t('admin.orphan.note')}</p>}
            {open && !orphan && (
                <div className="cms-editor">
                    {LOCALES.map((locale) => <Field key={locale} id={id} locale={locale} panel={panel} deps={deps} english={english} />)}
                </div>
            )}
        </div>
    )
}
