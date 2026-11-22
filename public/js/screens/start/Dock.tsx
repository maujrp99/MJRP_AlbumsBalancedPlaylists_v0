/**
 * Dock - the series being built, always in view (F79, HOME-09; ported from components/home/HomeDock.js, the same elements and classes).
 *
 * On the computer it is a bar fixed at the bottom of the window: the covers with their place (up to seven, then «+N»), the name
 * (suggested from the artists, editable), the count, «Edit order» and «Create series»; «Edit order» opens the series panel above it
 * (↑ ↓ ✕ of 44 px, no dragging); the «Undo» strip sits right above it for 8 seconds after a removal or «Add all».
 *
 * On the phone the dock IS the action bar of F76 (`.phone-action-bar`): one cover with the count, the name, «Tap to edit or reorder» and
 * «Create series»; a tap opens the series in a full sheet (components/ui/Sheet.js, through ui/SheetWindow) with the name on top and
 * «Create series» at its foot.
 *
 * It decides nothing: it draws the picture the controller took (`controller.model`) and hands every gesture to the controller. The old
 * dock was drawn anew at each picture and gave the focus back to the control that had it, by a selector: here the body of the dock is keyed
 * on the number of pictures, and a layout effect gives the focus back the same way, so the page and the focus come out as they did.
 */
import { Fragment, useEffect, useLayoutEffect, type ReactNode } from 'react'
import { Icon } from '../../ui/Icon'
import { CoverImage } from '../../ui/CoverImage'
import { useSheetWindow } from '../../ui/SheetWindow'
import { t, tPlural } from '../../i18n/t.js'
import { Equalizer } from './Equalizer'
import { NameState, barShows, dockEmptyNote, seriesCountLine } from './homeSeries'
import { coverOf } from './text'
import type { DockModel, StartController, Undo } from './StartController'

const COVERS_ON_COMPUTER = 7

const plural = (n: number): string => tPlural('start.dock.albums', n, { count: n })

interface ButtonProps {
    text: string
    className?: string
    action?: string
    id?: string
    disabled?: boolean
    label?: string
    onClick?: () => void
    children?: ReactNode
    expanded?: boolean
    busy?: boolean
}

function DockButton({ text, className = 'home-btn', action, id, disabled = false, label, onClick, children, expanded, busy }: ButtonProps) {
    return (
        <button type="button" className={className} id={id} aria-label={label} data-dock={action} disabled={disabled} onClick={onClick}
            aria-expanded={expanded} aria-busy={busy ? 'true' : undefined}>
            {text}{children}
        </button>
    )
}

/** The «Undo» strip: what just happened, and the way back. */
function UndoStrip({ controller, undo }: { controller: StartController; undo: Undo | null }) {
    if (!undo) return null
    const text = undo.kind === 'remove' ? t('start.dock.undo.removed', { title: undo.album?.title ?? '' }) : tPlural('start.dock.undo.added', undo.n ?? 0, { count: undo.n ?? 0 })
    return (
        <div className="home-undo" role="status">
            <span>{text}</span>
            <DockButton text={t('start.dock.undo.button')} className="home-undo__btn" action="undo" onClick={() => controller.undo()} />
        </div>
    )
}

/** The line of the visitor who did not sign in (D7). */
export function GuestLine({ controller, action = 'sign-in' }: { controller: StartController; action?: string }) {
    return (
        <p className="home-guest">
            {`${t('start.guest.before')} `}
            <DockButton text={t('start.guest.signIn')} className="home-link" action={action} onClick={() => controller.signIn()} />
            {` ${t('start.guest.after')}`}
        </p>
    )
}

function Pile({ model, max, onOpen }: { model: DockModel; max: number; onOpen?: () => void }) {
    const n = model.albums.length
    const opens = Boolean(onOpen) && n > 0
    return (
        <div className="home-pile" data-n={String(n)} aria-hidden={opens ? undefined : 'true'} data-dock={opens ? 'open' : undefined} role={opens ? 'button' : undefined} tabIndex={opens ? -1 : undefined} onClick={opens ? onOpen : undefined}>
            {n
                ? <>
                    {model.albums.slice(0, max).map((album, i) => (
                        <span key={album.id} className="home-dcv">
                            <CoverImage src={coverOf(album, '100')} className="home-dcv__img" alt="" />
                            <span className="home-dn">{String(i + 1)}</span>
                        </span>
                    ))}
                    {n > max ? <span className="home-more">{`+${n - max}`}</span> : null}
                </>
                : <><span className="home-slot" /><span className="home-slot" /><span className="home-slot" /></>}
        </div>
    )
}

/** The name: suggested as real text, with «suggested · edit it»; empty on create, it asks for one. The field is read live: the person types in it. */
function NameBox({ controller, model, id }: { controller: StartController; model: DockModel; id: string }) {
    const need = model.create === 'noname'
    const type = (value: string) => controller.setName(value)
    return (
        <div className={`home-namebox${need ? ' is-need' : ''}`}>
            <label className="home-name__label" htmlFor={id}>
                {t('start.dock.name.label')}
                {model.nameState === NameState.SUGGESTED ? <span className="home-name__sugg">{t('start.dock.name.suggested')}</span> : null}
            </label>
            <input
                type="text" id={id} className="home-name" autoComplete="off" data-dock="name" value={controller.state.name}
                aria-invalid={need ? 'true' : undefined} aria-describedby={need ? `${id}Error` : undefined}
                onChange={() => {}} onInput={(event) => type(event.currentTarget.value)}
                onKeyDown={(event) => { if (event.key === 'Enter') void controller.createSeries() }}
            />
            {need
                ? <p className="home-name__error" id={`${id}Error`} role="alert">
                    {`${t('start.dock.name.missing')} `}
                    <DockButton text={t('start.dock.name.use', { name: model.suggestion })} className="home-link" action="use-name" onClick={() => controller.useSuggestedName()} />
                </p>
                : null}
        </div>
    )
}

function Status({ model }: { model: DockModel }) {
    if (model.create === 'creating') {
        return <span className="home-busy" role="status"><Equalizer bars={5} state="live" className="home-eq--mini" />{` ${t('start.dock.saving')}`}</span>
    }
    if (model.create === 'failed') return <span className="home-fail" role="alert">{model.failure}</span>
    return <span className="home-count">{seriesCountLine(model.albums)}</span>
}

function CreateButton({ controller, model, id, phone }: { controller: StartController; model: DockModel; id: string; phone: boolean }) {
    if (model.create === 'creating') return <DockButton text={t('start.dock.creating')} className="home-btn is-big is-flame" id={id} disabled busy />
    return (
        <DockButton
            text={t(model.create === 'failed' ? 'start.dock.tryAgain' : 'start.dock.create')}
            className={`home-btn is-big${model.flame === 'create' ? ' is-flame' : ''}`} id={id} action="create" disabled={model.albums.length === 0}
            onClick={() => { void controller.createSeries() }}
        >
            {phone ? null : <Icon name="ArrowRight" className="home-ico home-ico--arrow" />}
        </DockButton>
    )
}

function AfterButtons({ controller, phone }: { controller: StartController; phone: boolean }) {
    return (
        <div className="home-go home-go--after">
            <DockButton text={t('start.dock.open')} className="home-btn is-ghost" action="open-series" id="btnOpenSeries" onClick={() => controller.openSeries()} />
            <DockButton text={t('start.dock.blend')} className="home-btn is-big is-flame" action="blend" id="btnBlendNow" onClick={() => controller.blendNow()}>
                {phone ? null : <Icon name="ArrowRight" className="home-ico home-ico--arrow" />}
            </DockButton>
        </div>
    )
}

function SavedLine({ model }: { model: DockModel }) {
    return (
        <strong className="home-saved"><Icon name="Check" className="home-ico home-saved__ico" />{` ${t('start.dock.saved', { name: model.created?.name ?? '' })}`}</strong>
    )
}

function RowButton({ action, icon, label, id, disabled, onClick }: { action: string; icon: string; label: string; id: string; disabled: boolean; onClick: () => void }) {
    return (
        <button type="button" className={`home-rbtn__${action}`} aria-label={label} data-dock={action} data-id={id} disabled={disabled} onClick={onClick}>
            <Icon name={icon} className={`home-ico pointer-events-none${action === 'down' ? ' home-ico--down' : ''}`} />
        </button>
    )
}

/** The rows of the series with ↑ ↓ ✕, in the panel of the computer and in the sheet of the phone. */
function Rows({ controller, model }: { controller: StartController; model: DockModel }) {
    const last = model.albums.length - 1
    return (
        <ol className="home-rows">
            {model.albums.map((album, i) => {
                const moved = model.moved?.id === album.id
                const small = [album.artist, album.year].filter(Boolean).join(' · ') + (moved && model.moved ? ` · ${t(`start.panel.moved.${model.moved.dir}`)}` : '')
                const title = album.title ?? ''
                return (
                    <li key={album.id} className={moved ? 'is-moved' : ''}>
                        <span className="home-num">{String(i + 1)}</span>
                        <span className="home-rcv"><CoverImage src={coverOf(album, '100')} className="home-rcv__img" alt="" /></span>
                        <span className="home-rt"><strong>{title}</strong><small>{small}</small></span>
                        <span className="home-rbtn">
                            <RowButton action="up" icon="ArrowUp" label={t('start.row.up', { title })} id={String(album.id)} disabled={i === 0} onClick={() => controller.move(album.id, -1)} />
                            <RowButton action="down" icon="ArrowUp" label={t('start.row.down', { title })} id={String(album.id)} disabled={i === last} onClick={() => controller.move(album.id, 1)} />
                            <RowButton action="remove" icon="X" label={t('start.row.remove', { title })} id={String(album.id)} disabled={false} onClick={() => controller.removeWithUndo(album.id)} />
                        </span>
                    </li>
                )
            })}
        </ol>
    )
}

/** The series panel (computer): the rows with ↑ ↓ ✕, above the dock. */
function Panel({ controller, model }: { controller: StartController; model: DockModel }) {
    return (
        <div className="home-panel" role="region" aria-label={t('start.panel.region')} id="homeSeriesPanel">
            <div className="home-panel__head">
                <h3>{`${t('start.panel.title')} `}<span>{plural(model.albums.length)}</span></h3>
                <DockButton text={t('start.dock.done')} className="home-btn is-ghost" action="close" onClick={() => controller.closePanel()} />
            </div>
            <p className="home-order">{t('start.panel.order')}</p>
            <Rows controller={controller} model={model} />
        </div>
    )
}

function ComputerMeta({ controller, model }: { controller: StartController; model: DockModel }) {
    if (model.create === 'created') {
        return (
            <div className="home-dock__meta">
                <SavedLine model={model} />
                <span>{t('start.dock.savedMeta', { albums: plural(model.created?.count ?? 0) })}</span>
            </div>
        )
    }
    if (!model.albums.length) {
        const empty = dockEmptyNote({ phone: false, covers: model.coversOnScreen })
        return <div className="home-dock__meta"><strong>{empty.title}</strong><span>{empty.note}</span></div>
    }
    return <div className="home-dock__meta"><NameBox controller={controller} model={model} id="seriesNameInput" /><Status model={model} /></div>
}

function ComputerGo({ controller, model }: { controller: StartController; model: DockModel }) {
    if (model.create === 'created') return <AfterButtons controller={controller} phone={false} />
    if (!model.albums.length) {
        return <div className="home-go"><small>{t('start.dock.addOne')}</small><CreateButton controller={controller} model={model} id="btnCreateSeries" phone={false} /></div>
    }
    return (
        <div className="home-go">
            <DockButton text={t(model.open ? 'start.dock.done' : 'start.dock.editOrder')} className="home-btn is-ghost" action="toggle" id="btnEditOrder" expanded={model.open} onClick={() => controller.toggleOpen()} />
            <CreateButton controller={controller} model={model} id="btnCreateSeries" phone={false} />
        </div>
    )
}

function ComputerDock({ controller, model }: { controller: StartController; model: DockModel }) {
    const n = model.albums.length
    return (
        <div className="home-dockwrap">
            {model.open ? <Panel controller={controller} model={model} /> : null}
            <UndoStrip controller={controller} undo={model.undo} />
            <div className={`home-dock${n ? ' is-full' : ''}${model.create === 'created' ? ' is-done' : ''}`} role="region" aria-label={t('start.dock.region')}>
                {model.guest ? <GuestLine controller={controller} /> : null}
                <div className="home-dock__row">
                    <Pile model={model} max={COVERS_ON_COMPUTER} />
                    <ComputerMeta controller={controller} model={model} />
                    <ComputerGo controller={controller} model={model} />
                </div>
                {model.create === 'created'
                    ? <DockButton text={t('start.dock.another')} className="home-link home-restart" action="restart" onClick={() => controller.startAnother()} />
                    : n ? <small className="home-next">{t('start.dock.next')}</small> : null}
            </div>
        </div>
    )
}

function PhoneMeta({ model, onOpen }: { model: DockModel; onOpen: () => void }) {
    if (model.create === 'created') return <div className="home-dock__meta"><SavedLine model={model} /></div>
    if (!model.albums.length) {
        const empty = dockEmptyNote({ phone: true, covers: model.coversOnScreen })
        return <div className="home-dock__meta"><strong>{empty.title}</strong><span>{empty.note}</span></div>
    }
    const n = model.albums.length
    const short = t(model.failureNetwork ? 'start.dock.failed.phoneNetwork' : 'start.dock.failed.phone')
    return (
        <div className="home-dock__meta">
            <button type="button" className="home-dock__open" data-dock="open" aria-label={t('start.dock.phone.label', { albums: plural(n), name: model.name || t('start.dock.phone.noNameLabel') })} onClick={onOpen}>
                <strong>{model.name || t('start.dock.phone.noName')}</strong>
                {model.create === 'failed' ? <span className="home-fail" role="alert">{short}</span> : <Status model={model} />}
                <small>{t('start.dock.phone.edit')}</small>
            </button>
        </div>
    )
}

function PhoneDock({ controller, model, sheetOpen, onOpen }: { controller: StartController; model: DockModel; sheetOpen: boolean; onOpen: () => void }) {
    const n = model.albums.length
    // No bar until the first cover is chosen (UAT-281); an «Undo» of the last removal still has its strip
    const shown = barShows({ chosen: n, created: model.create === 'created' })
    return (
        <div className={`home-dockwrap is-phone${shown ? '' : ' is-barless'}`}>
            {sheetOpen ? null : <UndoStrip controller={controller} undo={model.undo} />}
            {shown ? (
                <div className={`home-dock phone-action-bar md:hidden${n ? ' is-full' : ''}${model.create === 'created' ? ' is-done' : ''}`} role="region" aria-label={t('start.dock.region')}>
                    {model.create === 'created' ? null : <Pile model={model} max={1} onOpen={onOpen} />}
                    <PhoneMeta model={model} onOpen={onOpen} />
                    {model.create === 'created' ? <AfterButtons controller={controller} phone /> : <div className="home-go"><CreateButton controller={controller} model={model} id="btnCreateSeriesPhone" phone /></div>}
                </div>
            ) : null}
        </div>
    )
}

/** The dock is drawn anew at each picture, and the focus goes back to the control that had it when it is still there and can be used. */
function DrawnAnew({ controller, children }: { controller: StartController; children: ReactNode }) {
    useLayoutEffect(() => {
        const kept = controller.dockFocus
        if (!kept) return
        // the control that had the focus was taken out with the old dock, so the focus is on the page; if it is somewhere else the focus is not ours to move
        // (the strict mode runs this twice, and the second time must not take the focus back from the field a gesture just gave it to)
        if (document.activeElement && document.activeElement !== document.body) return
        const element = document.getElementById('homeDockHost')?.querySelector<HTMLInputElement>(kept.selector)
        if (!element || element.disabled) return
        element.focus()
        if (kept.start !== null) element.setSelectionRange?.(kept.start, kept.end)
    }, [controller])
    return <>{children}</>
}

/** The inside of the series sheet of the phone: the name, the order and the rows; what is at its foot is the next function. */
function SheetBody({ controller }: { controller: StartController }) {
    const model = controller.model
    const named = controller.sheetName ?? model
    const requestId = controller.focusRequest?.id
    // «Create series» with no name asked for the name field: on the phone it is the one in this sheet
    useLayoutEffect(() => {
        if (controller.focusRequest?.request.to === 'name') document.getElementById('homeChosenName')?.focus()
    }, [controller, requestId])
    if (!model || !named) return null
    return (
        <>
            <div className="home-sheet__name"><Fragment key={controller.sheetNameDraw}><NameBox controller={controller} model={named} id="homeChosenName" /></Fragment></div>
            <p className="home-order">{t('start.panel.order')}</p>
            <div className="home-sheet__rows"><Fragment key={controller.dockDraws}><Rows controller={controller} model={model} /></Fragment></div>
        </>
    )
}

function SheetFoot({ controller }: { controller: StartController }) {
    const model = controller.model
    if (!model) return null
    return (
        <div className="home-sheet__foot">
            <Fragment key={controller.dockDraws}>
                <UndoStrip controller={controller} undo={model.undo} />
                <CreateButton controller={controller} model={model} id="btnCreateSeriesSheet" phone />
            </Fragment>
        </div>
    )
}

export function Dock({ controller, phone }: { controller: StartController; phone: boolean }) {
    const sheet = useSheetWindow()
    const model = controller.model
    const requestId = controller.focusRequest?.id

    const open = () => {
        const now = controller.model
        if (!now?.albums.length || sheet.isOpen()) return
        sheet.show({
            variant: 'full', id: 'homeSeriesSheet', title: t('start.panel.title'), closeLabel: t('start.dock.done'), focusFirst: false,
            titleExtra: () => <span className="home-sheet__count">{plural(controller.model?.albums.length ?? 0)}</span>,
            onClose: () => controller.closePanel(),
            render: () => <SheetBody controller={controller} />,
            footer: () => <SheetFoot controller={controller} />
        })
    }

    // The sheet is closed when the series is empty, created, or being created (the old dock closed it when it drew).
    const closing = Boolean(model) && (!model?.albums.length || model?.create === 'created' || model?.create === 'creating')
    useEffect(() => {
        if (closing && sheet.isOpen()) sheet.close()
    })

    // The name is missing: on the computer the field of the dock; on the phone the sheet opens on its own field.
    useEffect(() => {
        if (controller.focusRequest?.request.to !== 'name') return
        if (phone) open()
        else document.getElementById('seriesNameInput')?.focus()
        // eslint-disable-next-line react-hooks/exhaustive-deps -- it runs once for each ask for the focus
    }, [controller, requestId])

    if (!model) return null
    return (
        <>
            <DrawnAnew key={controller.dockDraws} controller={controller}>
                {phone ? <PhoneDock controller={controller} model={model} sheetOpen={sheet.isOpen()} onOpen={open} /> : <ComputerDock controller={controller} model={model} />}
            </DrawnAnew>
            {sheet.layer}
        </>
    )
}
