/**
 * The Painel's «Caixa» section (F82, REQ-03, REQ-09; F95): the crate of albums of the entry page, «Caixa do The Album
 * Blender». The crate as it is published (or the fixed set of the code when nothing is), in its two sides with the front
 * record first; each album moves up and down, goes to the other side or out, by buttons a keyboard reaches; a new one comes
 * in by a search of Apple Music's catalogue (album or artist) or by an album's link. One «Save» that confirms what goes and
 * publishes at once, as the texts': the save bar, its confirmation, saving, saved, failed with the reason, and the conflict.
 *
 * It is drawn with the admin kit's pieces (`ak-*`) and the Painel's own (`cms-*`), under the same skin.
 */
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { coverUrl } from '@shared/content/crate.js'
import { t, tPlural } from '../../i18n/t.js'
import { FailedMessage, SavingMessage } from './SaveBar'
import { canTake, changesOf, holds, limitsOf, otherSide, SIDES, type Album, type Side } from './crateModel'
import type { Crate } from './useCrate'

const LINE = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, 'aria-hidden': true } as const
const UP = <svg width="16" height="16" viewBox="0 0 24 24" {...LINE}><path d="M12 19V5M5 12l7-7 7 7" /></svg>
const DOWN = <svg width="16" height="16" viewBox="0 0 24 24" {...LINE}><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
/** The side of a cover in the lists, in CSS pixels; the image asked for is twice that, for a sharp screen. */
const COVER = 56

/** The id of a side's heading and the name of «add to that side», written whole (no name is glued at run time). */
const HEADING: Record<Side, string> = { a: 'cms-side-a', b: 'cms-side-b' }
const ADD: Record<Side, string> = { a: 'add-a', b: 'add-b' }

const sideName = (side: Side): string => t(`admin.crate.side.${side}`)
const counted = (count: number): string => tPlural('admin.crate.count', count, { count })

function Cover({ album }: { album: Album }) {
    return <img className="cms-cover" src={coverUrl(album.art, COVER * 2)} alt="" width={COVER} height={COVER} decoding="async" />
}

function Names({ album }: { album: Album }) {
    return <span className="cms-album-t"><b>{album.title}</b><small>{album.artist} · {album.year}</small></span>
}

/** What a button of a row is asked to do, and where the keyboard's focus goes after it. */
type Act = 'up' | 'down' | 'across' | 'remove'

function Row({ crate, side, index, album, onAct }: { crate: Crate; side: Side; index: number; album: Album; onAct: (act: Act, album: Album) => void }) {
    const last = index === crate.sides[side].length - 1
    const to = otherSide(side)
    const named = (key: string) => `${t(key)}: ${album.title}`
    return (
        <li className="cms-album" data-album={album.id}>
            <span className="cms-album-n" aria-hidden="true">{index + 1}</span>
            <Cover album={album} />
            <Names album={album} />
            <span className="cms-row-acts">
                <button type="button" className="ak-icon" data-act="up" aria-label={named('admin.crate.up')} title={t('admin.crate.up')} disabled={index === 0} onClick={() => onAct('up', album)}>{UP}</button>
                <button type="button" className="ak-icon" data-act="down" aria-label={named('admin.crate.down')} title={t('admin.crate.down')} disabled={last} onClick={() => onAct('down', album)}>{DOWN}</button>
                <button type="button" className="ak-btn sm" data-act="across" aria-label={named(`admin.crate.toSide.${to}`)} disabled={!canTake(crate.sides, to)} onClick={() => onAct('across', album)}>{t(`admin.crate.toSide.${to}`)}</button>
                <button type="button" className="ak-btn sm" data-act="remove" aria-label={named('admin.crate.remove')} onClick={() => onAct('remove', album)}>{t('admin.crate.remove')}</button>
            </span>
        </li>
    )
}

function SideList({ crate, side }: { crate: Crate; side: Side }) {
    const list = crate.sides[side]
    const { min, max } = limitsOf(side)
    const state = crate.counts[side]
    const box = useRef<HTMLElement>(null)
    // After a move the keyboard stays on the album that moved: its button of the same direction, or the other at an end.
    // After an album leaves the side (out, or to the other side), it goes to the album that took its place.
    const [focus, setFocus] = useState<{ id: string; index: number; act: Act } | null>(null)
    useEffect(() => {
        if (!focus) return
        const rows = box.current?.querySelectorAll('[data-album]') ?? []
        const row = box.current?.querySelector(`[data-album="${focus.id}"]`) ?? rows[Math.min(focus.index, rows.length - 1)]
        const wanted = row?.querySelector<HTMLButtonElement>(`[data-act="${focus.act}"]:not(:disabled)`) ?? row?.querySelector<HTMLButtonElement>('[data-act="up"]:not(:disabled), [data-act="down"]:not(:disabled)')
        wanted?.focus()
        setFocus(null)
    }, [focus])
    const onAct = (act: Act, album: Album) => {
        const index = list.findIndex((entry) => entry.id === album.id)
        if (act === 'up' || act === 'down') crate.move(side, index, index + (act === 'up' ? -1 : 1))
        else if (act === 'across') crate.across(side, index)
        else crate.remove(side, index)
        setFocus({ id: album.id, index, act })
    }
    return (
        <section className="cms-side" data-side={side} data-count={list.length} data-count-state={state} aria-labelledby={HEADING[side]} ref={box}>
            <header className="cms-side-h">
                <h2 id={HEADING[side]}>{sideName(side)}</h2>
                <span className={state === 'ok' ? 'ak-badge' : 'ak-badge err'} data-count-tag>{counted(list.length)} · {t('admin.crate.limits', { min, max })}</span>
            </header>
            <p className="cms-soft">{t(`admin.crate.side.hint.${side}`)}</p>
            {state !== 'ok' && <p className="ak-err-t" role="alert" data-count-problem={state}>{t(`admin.crate.${state}`, { side: sideName(side), min, max })}</p>}
            <ol className="cms-albums">
                {list.map((album, index) => <Row key={album.id} crate={crate} side={side} index={index} album={album} onAct={onAct} />)}
            </ol>
        </section>
    )
}

function Result({ crate, album }: { crate: Crate; album: Album }) {
    const inCrate = holds(crate.sides, album.id)
    return (
        <li className="cms-album" data-result={album.id}>
            <Cover album={album} />
            <Names album={album} />
            <span className="cms-row-acts">
                {inCrate
                    ? <span className="ak-badge" data-in-crate>{t('admin.crate.add.inCrate')}</span>
                    : SIDES.map((side) => (
                        <button key={side} type="button" className="ak-btn sm" data-act={ADD[side]} aria-label={`${t(`admin.crate.add.to.${side}`)}: ${album.title}`}
                            disabled={!canTake(crate.sides, side)} title={canTake(crate.sides, side) ? undefined : t('admin.crate.full', { side: sideName(side), max: limitsOf(side).max })}
                            onClick={() => crate.add(side, album)}>{t(`admin.crate.add.to.${side}`)}</button>
                    ))}
            </span>
        </li>
    )
}

function Found({ crate }: { crate: Crate }) {
    const found = crate.found
    if (found.step === 'busy') return <p className="cms-soft" role="status" data-search="busy">{t('admin.crate.add.busy')}</p>
    if (found.step === 'none') return <p className="cms-soft" role="status" data-search="none">{t('admin.crate.add.none')}</p>
    if (found.step === 'failed') return <p className="ak-err-t" role="alert" data-search="failed">{t('admin.crate.add.failed', { reason: t(`admin.crate.add.reason.${found.reason}`) })}</p>
    if (found.step !== 'found') return null
    return <ul className="cms-albums" data-search="found" aria-label={t('admin.crate.add.results')}>{found.albums.map((album) => <Result key={album.id} crate={crate} album={album} />)}</ul>
}

function Add({ crate }: { crate: Crate }) {
    const [query, setQuery] = useState('')
    const submit = (event: FormEvent) => { event.preventDefault(); crate.seek(query) }
    return (
        <section className="cms-side cms-add" aria-labelledby="cms-add-t">
            <header className="cms-side-h"><h2 id="cms-add-t">{t('admin.crate.add.title')}</h2></header>
            <form className="cms-tools" role="search" onSubmit={submit}>
                <label className="ak-vh" htmlFor="cms-crate-q">{t('admin.crate.add.label')}</label>
                <input id="cms-crate-q" type="search" className="ak-input" placeholder={t('admin.crate.add.label')} value={query} autoComplete="off" maxLength={300} onChange={(event) => setQuery(event.target.value)} />
                <button type="submit" className="ak-btn" data-act="search" disabled={!query.trim() || crate.found.step === 'busy'}>{t('admin.crate.add.search')}</button>
            </form>
            <Found crate={crate} />
        </section>
    )
}

const named = (key: string, names: string[]) => tPlural(key, names.length, { count: names.length, names: names.join(' · ') })

function Confirm({ crate }: { crate: Crate }) {
    const changes = changesOf(crate.saved, crate.sides)
    const same = !changes.added.length && !changes.removed.length && !changes.moved
    return (
        <div className="cms-msg conf" role="alertdialog" aria-label={t('admin.confirm.label')} data-state="confirm">
            <b>{t('admin.crate.confirm.title', { a: counted(crate.sides.a.length), b: counted(crate.sides.b.length) })}</b>
            {changes.added.length > 0 && <span data-change="added">{named('admin.crate.confirm.added', changes.added)}</span>}
            {changes.removed.length > 0 && <span data-change="removed">{named('admin.crate.confirm.removed', changes.removed)}</span>}
            {changes.moved && <span data-change="moved">{t('admin.crate.confirm.moved')}</span>}
            {same && <span data-change="same">{t('admin.crate.confirm.same')}</span>}
            <span className="cms-soft">{t('admin.confirm.note')}</span>
            <div className="cms-acts">
                <button type="button" className="ak-btn pri" data-act="save-confirm" onClick={crate.confirm}>{t('admin.confirm.go')}</button>
                <button type="button" className="ak-btn" data-act="save-back" onClick={crate.back}>{t('admin.confirm.back')}</button>
            </div>
        </div>
    )
}

function Conflict({ crate, a, b }: { crate: Crate; a: number; b: number }) {
    return (
        <div className="cms-msg conf" role="alert" data-state="conflict">
            <b>{t('admin.crate.conflict.title')}</b>
            <span>{t('admin.crate.conflict.theirs', { a: counted(a), b: counted(b) })}</span>
            <div className="cms-acts">
                <button type="button" className="ak-btn" data-act="conflict-mine" onClick={() => crate.resolve('mine')}>{t('admin.conflict.mine')}</button>
                <button type="button" className="ak-btn" data-act="conflict-theirs" onClick={() => crate.resolve('theirs')}>{t('admin.conflict.theirs')}</button>
            </div>
        </div>
    )
}

function Message({ crate }: { crate: Crate }) {
    const state = crate.save
    switch (state.step) {
        case 'confirm': return <Confirm crate={crate} />
        case 'saving': return <SavingMessage />
        case 'saved': return <div className="cms-msg ok" role="status" data-state="saved">✓ {t('admin.crate.saved')}</div>
        case 'failed': return <FailedMessage reason={state.reason} detail={state.detail} onRetry={crate.confirm} />
        case 'conflict': return <Conflict crate={crate} a={state.theirs.a.length} b={state.theirs.b.length} />
        default: return null
    }
}

/** What the bar says of the crate: saved, or changed and whether it can be saved. */
function BarInfo({ crate }: { crate: Crate }) {
    if (!crate.unsaved) return <div className="cms-bar-info" aria-live="polite"><b>{t('admin.bar.saved')}</b><span>{t('admin.crate.bar.savedHint')}</span></div>
    return (
        <div className="cms-bar-info" aria-live="polite">
            <b>{t('admin.crate.bar.unsaved')}</b>
            <span>{t(crate.valid ? 'admin.bar.unsavedHint' : 'admin.crate.bar.invalid')}</span>
        </div>
    )
}

/** The save bar of the crate: the same bar as the texts', saying the crate. */
function CrateBar({ crate }: { crate: Crate }) {
    const busy = crate.save.step === 'saving'
    const held = busy || crate.save.step === 'confirm' || crate.save.step === 'conflict'
    const canSave = crate.unsaved && crate.valid && !held
    return (
        <div className={crate.unsaved ? 'cms-bar has' : 'cms-bar'} data-unsaved={crate.unsaved ? 1 : 0}>
            <BarInfo crate={crate} />
            <div className="cms-acts">
                <button type="button" className="ak-btn pri" data-act="save" disabled={!canSave} onClick={crate.askSave}>{t('admin.bar.save')}</button>
                <button type="button" className="ak-btn" data-act="discard" disabled={!crate.unsaved || busy} onClick={crate.discard}>{t('admin.bar.discard')}</button>
            </div>
            <Message crate={crate} />
        </div>
    )
}

/** What the entry page shows of the crate now: the published one, or the fixed set and why. */
export function CrateSource({ crate }: { crate: Crate }) {
    const source = crate.read?.source ?? 'fixed'
    return (
        <p className="cms-site" data-crate-source={source}>
            <span className="cms-soft">{t('admin.crate.source.label')}:</span> <b>{t(`admin.crate.source.${source}`)}</b>
        </p>
    )
}

export function CrateSection({ crate }: { crate: Crate }) {
    return (
        <>
            <CrateBar crate={crate} />
            <div className="cms-crate">
                {SIDES.map((side) => <SideList key={side} crate={crate} side={side} />)}
            </div>
            <Add crate={crate} />
        </>
    )
}
