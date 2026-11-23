/**
 * The Painel (/admin), first iteration: the Texts section (F82, REQ-01, REQ-09; the «Painel» level of the approved
 * prototype, design/proposals/f82-cms/). The texts of the site by screen, English and Portuguese side by side; the search by
 * word; the Portuguese texts that wait for the owner, approved one by one, the selected ones or all of a screen; the save
 * bar. Switches and recipes come later: their entries are in the menu, turned off.
 *
 * It is drawn with the admin kit's fields and skin (ui/admin-kit, a stamped copy never edited here) and given everything it
 * uses (`PanelProps`), so a test hands it a storage of its own.
 */
import { useEffect, useMemo, useState } from 'react'
import type { KitPorts } from '../../ui/admin-kit/index'
import { t, tPlural } from '../../i18n/t.js'
import { useLocale } from '../../react-bridge/useLocale'
import { SaveBar } from './SaveBar'
import { TextRow, type RowDeps } from './TextRow'
import { pendingOf, screensOf, visibleKeys, type Locale } from './model'
import { usePanel, type Panel, type PanelDeps } from './usePanel'

/** What the site shows of a language now, as its reader says (services/content). */
export interface SiteState {
    source: 'published' | 'copy' | 'code'
    rejected: Array<{ key: string; reason: string }>
}

export interface PanelProps extends PanelDeps, RowDeps {
    ports: KitPorts
    siteState: (locale: Locale) => SiteState
    /** Asks before the person leaves the Painel with changes not saved; returns the way to stop asking (leaveGuard.ts). */
    guardLeave?: (unsaved: () => boolean) => () => void
}

const LATER = ['switches', 'recipes'] as const

function Rail() {
    return (
        <nav className="cms-rail" aria-label={t('admin.nav.label')}>
            <div className="cms-who"><span className="cms-avatar" aria-hidden="true">M</span><div><b>{t('admin.who.you')}</b><small>{t('admin.who.role')}</small></div></div>
            <button type="button" className="cms-navb" aria-current="page">{t('admin.nav.texts')}</button>
            {LATER.map((id) => <button key={id} type="button" className="cms-navb" disabled data-later={id}>{t(`admin.nav.${id}`)}</button>)}
        </nav>
    )
}

function SiteLine({ state }: { state: SiteState }) {
    const count = state.rejected.length
    return (
        <p className="cms-site" data-site={state.source}>
            <span className="cms-soft">{t('admin.site.label')}:</span> <b>{t(`admin.site.${state.source}`)}</b>
            {count > 0 && <span className="ak-badge err" data-rejected={count}>{tPlural('admin.site.rejected', count, { count })}</span>}
        </p>
    )
}

function Empty({ query, onClear, onShowAll }: { query: string; onClear: () => void; onShowAll: () => void }) {
    if (query) {
        return (
            <div className="cms-empty" data-empty="search">
                <b>{t('admin.empty.search.title', { query })}</b>{t('admin.empty.search.body')}
                <button type="button" className="cms-lnk" onClick={onClear}>{t('admin.empty.search.clear')}</button>
            </div>
        )
    }
    return (
        <div className="cms-empty" data-empty="pending">
            <b>{t('admin.empty.pending.title')}</b>{t('admin.empty.pending.body')}
            <button type="button" className="cms-lnk" onClick={onShowAll}>{t('admin.empty.pending.showAll')}</button>
        </div>
    )
}

function Bulk({ panel, waiting, selected }: { panel: Panel; waiting: string[]; selected: string[] }) {
    if (!waiting.length) return null
    return (
        <div className="cms-bulk">
            <span>{tPlural('admin.texts.bulk', waiting.length, { count: waiting.length })}</span>
            <button type="button" className="ak-btn sm" data-act="approve-selected" disabled={!selected.length} onClick={() => panel.approve(selected)}>{t('admin.texts.approveSelected', { count: selected.length })}</button>
            <button type="button" className="ak-btn sm" data-act="approve-screen" onClick={() => panel.approve(waiting)}>{t('admin.texts.approveScreen')}</button>
        </div>
    )
}

/** What the read is doing, when there is nothing to edit yet: reading, could not read, or no permission. */
function Gate({ panel }: { panel: Panel }) {
    if (panel.phase === 'reading') return <div className="ak-notice" role="status" data-read="reading">{t('admin.read.reading')}</div>
    if (panel.phase === 'failed') {
        return <div className="ak-notice err" role="alert" data-read="failed">{t('admin.read.failed')}<button type="button" className="ak-btn" onClick={panel.read}>{t('admin.read.retry')}</button></div>
    }
    return <div className="ak-notice warn" role="alert" data-read="denied"><b>{t('admin.noPermission.title')}</b> {t('admin.noPermission.body')}</div>
}

function Texts({ props, panel }: { props: PanelProps; panel: Panel }) {
    const navigation = props.ports.navigation
    const screens = useMemo(() => screensOf(panel.values), [panel.values])
    const [screen, setScreen] = useState(() => navigation.where().path)
    const [query, setQuery] = useState('')
    const [onlyPending, setOnlyPending] = useState(false)
    const [open, setOpen] = useState<string | null>(null)
    const [picked, setPicked] = useState<readonly string[]>([])
    useEffect(() => navigation.listen(() => setScreen(navigation.where().path)), [navigation])
    const current = screens.some((entry) => entry.id === screen) ? screen : screens[0]?.id ?? ''
    const keys = useMemo(() => visibleKeys(panel.values, { screen: current, query, onlyPending }), [panel.values, current, query, onlyPending])
    const waiting = pendingOf(panel.values, current)
    const selected = picked.filter((key) => waiting.includes(key))
    const rejected = (key: string) => Object.fromEntries((['en', 'pt'] as const).map((locale) => [locale, props.siteState(locale).rejected.find((entry) => entry.key === key)?.reason]))
    // The Painel replaces its own address: «back» leaves the Painel (and asks first), it never redraws it over what was typed.
    const go = (id: string) => { setQuery(''); setScreen(id); navigation.go({ path: id }, { replace: true }) }
    return (
        <>
            <SaveBar panel={panel} />
            <div className="cms-screens" role="group" aria-label={t('admin.texts.screens')}>
                {screens.map((entry) => (
                    <button key={entry.id} type="button" className="cms-chip" data-screen={entry.id} aria-pressed={!query && entry.id === current} onClick={() => go(entry.id)}>
                        {t(`admin.screens.${entry.id}`)}{entry.waiting > 0 && <span className="cms-n" title={t('admin.tag.pending')}>{entry.waiting}</span>}
                    </button>
                ))}
            </div>
            <div className="cms-tools">
                <label className="ak-vh" htmlFor="cms-q">{t('admin.texts.search')}</label>
                <input id="cms-q" type="search" className="ak-input" placeholder={t('admin.texts.search')} value={query} autoComplete="off" onChange={(event) => setQuery(event.target.value)} />
                <label className="cms-only"><input type="checkbox" checked={onlyPending} onChange={(event) => setOnlyPending(event.target.checked)} /> {t('admin.texts.onlyPending', { count: waiting.length })}</label>
            </div>
            {!query && <Bulk panel={panel} waiting={waiting} selected={selected} />}
            <div className="cms-rows">
                {keys.map((key) => (
                    <TextRow key={key} id={key} panel={panel} deps={props} open={open === key} onOpen={setOpen} rejected={rejected(key)}
                        selected={picked.includes(key)} onSelect={(id, on) => setPicked((now) => (on ? [...now, id] : now.filter((other) => other !== id)))} />
                ))}
                {!keys.length && <Empty query={query.trim()} onClear={() => setQuery('')} onShowAll={() => setOnlyPending(false)} />}
            </div>
        </>
    )
}

export function TextsPanel(props: PanelProps) {
    const locale = useLocale() // draws again when the language or the published texts change
    const panel = usePanel(props)
    // What is not saved now, for the question at the moment of leaving.
    const [draft] = useState(() => ({ unsaved: 0 }))
    useEffect(() => { draft.unsaved = panel.unsaved.length }, [draft, panel.unsaved.length])
    const guardLeave = props.guardLeave
    useEffect(() => guardLeave?.(() => draft.unsaved > 0), [guardLeave, draft])
    return (
        <div className="cms" data-admin-skin="albumblender" data-phase={panel.phase}>
            <Rail />
            <section className="cms-main">
                <header className="cms-head">
                    <h1>{t('admin.texts.title')}</h1>
                    <p>{t('admin.texts.lead')}</p>
                    {panel.phase === 'ready' && <SiteLine state={props.siteState(locale === 'pt' ? 'pt' : 'en')} />}
                </header>
                {panel.phase === 'ready' ? <Texts props={props} panel={panel} /> : <Gate panel={panel} />}
            </section>
        </div>
    )
}
