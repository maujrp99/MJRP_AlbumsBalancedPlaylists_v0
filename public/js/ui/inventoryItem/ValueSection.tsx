/**
 * «Estimated value» - the section the album window of an inventory item gains (F75; F83 wave 6b: the port of the first half of
 * components/InventoryValueSection.js, with the same HTML and the same classes): the three conditions of the disc and their mean, the edition
 * used with its link, when it was read, «Read again», the field to write a value, and the way back to the Discogs value (REQ-03, REQ-04, REQ-06).
 * Beside every value that came from Discogs it says «Data provided by Discogs.», linked to the page of that edition (a term of use; it stays in
 * English). On the phone (F76, recheck N7) the window shows it folded, one line (`ValueAndBuy`).
 *
 * The section draws what it is told (`host.view()`), asks its host for every action and draws again when the action ends: it holds no value of its
 * own. It is made again whole at each draw (the hand-made one wrote its HTML again), with what the person was typing still in the field, and the
 * cursor in it. Every text from outside is text; every address goes through `safeUrl`. All money goes through models/inventoryValue.js.
 */
import { Fragment, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { t } from '../../i18n/t.js'
import {
    DISCOGS_CREDIT, NoValue, SourceState, ValueBasis, ValueOrigin, dayText, formatMoney, meanOfConditions, momentText, readOnText
} from '../../models/inventoryValue.js'
import { failureText, noValueText } from '../../i18n/inventoryTexts.js'
import { safeUrl } from '../../utils/safeUrl.js'
import { Icon } from '../Icon'
import { moneyText, type Money } from './money'
import { BuyLinks, PhoneBuyLinks } from './BuyLinks'
import type { ItemLike } from './types'

type Item = ItemLike

/** The edition of Discogs a value was read from. */
interface Release {
    title?: string
    url?: string
}

/** The value of an item as models/inventoryValue.js gives it (valueOfItem): what it is made of depends on where it comes from, or why it has none. */
interface Value {
    origin?: string | null
    reason?: string
    basis?: string
    failure?: string
    amount?: number | null
    currency?: string
    at?: string | null
    readAt?: string
    forSale?: number | null
    release?: Release | null
    conditions?: { mint: number; nearMint: number; veryGoodPlus: number }
}

/** What the section draws: the value of the item, the money of the screen, whether the switch is on and whether «Update values» runs. */
export interface Shown {
    value: Value
    money: Money
    source: string | null
    busy: boolean
}

/** What the section asks of the inventory: every action, answered when it ends. */
export interface ValueHost {
    view: () => Shown
    onWrite: (text: string) => Promise<boolean>
    onForget: () => Promise<unknown>
    onRead: () => Promise<unknown>
}

const BOX = 'bg-black/20 rounded-xl border border-white/10 p-3'
const TAG = 'text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5'
const HEADING = 'text-xs font-bold text-gray-400 uppercase tracking-widest mb-1'
const LEAD = 'text-sm text-gray-400 mb-3'
const SMALL = 'text-xs text-gray-400 mt-3'
const INPUT_ID = 'inventoryValueInput'

const Lead = ({ children }: { children: ReactNode }) => <p className={LEAD}>{children}</p>
const TextButton = ({ action, label }: { action: string; label: string }) => <button type="button" className="text-accent-primary underline" data-action={action}>{label}</button>

/** A link to a page of Discogs, or the plain text when the address is not a web address. */
function discogsLink(url: string | undefined, label: string): ReactNode {
    const address = safeUrl(url)
    if (!address) return label
    return <a className="text-accent-primary underline" href={address} target="_blank" rel="noopener">{label}</a>
}

/** «Data provided by Discogs.», linked to the page of the edition the data is of. */
const Credit = ({ release }: { release?: Release | null }) => <p className="text-xs text-gray-400 mt-1" data-role="discogs-credit">{discogsLink(release?.url, DISCOGS_CREDIT)}</p>

/** The field where the person writes a value, in the currency the screen shows. */
function Field({ label, money }: { label: string; money: Money }) {
    const symbol = formatMoney(0, money.currency).replace(/[\d.,]+$/, '').trim()
    return (
        <>
            <div className="flex flex-wrap items-center gap-3 mt-3">
                <label className="text-sm text-gray-400" htmlFor={INPUT_ID}>{label}</label>
                <input id={INPUT_ID} className="form-control" style={{ width: '140px' }} inputMode="decimal" autoComplete="off" placeholder={`${symbol} 0.00`} />
                <button type="button" className="btn btn-secondary" data-action="save-value">{t('inventory.value.save')}</button>
            </div>
            {money.currency === 'USD' ? null : <p className="text-xs text-gray-400 mt-1">{t('inventory.value.writtenIn', { currency: money.currency })}</p>}
        </>
    )
}

/** The button that reads the value of this album now; it waits while «Update values» runs. */
function ReadButton({ label, busy, primary = false }: { label: string; busy: boolean; primary?: boolean }) {
    const waits = busy ? { disabled: true, title: t('inventory.value.runWaits') } : {}
    return primary
        ? <button type="button" className="btn btn-primary" data-action="read-value" {...waits}>{label}</button>
        : <button type="button" className="text-accent-primary underline" data-action="read-value" {...waits}>{label}</button>
}

const isOn = (shown: Shown): boolean => shown.source === SourceState.ON

type BodyProps = { shown: Shown }

function Yours({ shown }: BodyProps) {
    const { value, money } = shown
    const on = isOn(shown)
    const back = t(on ? 'inventory.value.useDiscogs' : 'inventory.value.removeMine')
    return (
        <>
            <Lead>{t(on ? 'inventory.value.yoursLeadOn' : 'inventory.value.yoursLead')}</Lead>
            <div className="flex items-center gap-2"><span className="text-2xl font-bold text-white" data-role="amount">{moneyText(value, money)}</span><span className={TAG}>{t('inventory.value.yours')}</span></div>
            <Field label={t('inventory.value.changeIt')} money={money} />
            <p className={SMALL}>{`${value.at ? t('inventory.value.writtenByOn', { day: dayText(value.at) }) : t('inventory.value.writtenBy')} `}<TextButton action="forget-value" label={back} /></p>
        </>
    )
}

function Cell({ label, amount, value, money, strong = false }: { label: string; amount: number | null; value: Value; money: Money; strong?: boolean }) {
    return (
        <div className={BOX} style={strong ? { borderColor: '#f97316' } : undefined}>
            <div className="text-xs text-gray-400">{label}</div>
            <div className="text-lg font-bold text-white">{moneyText({ amount, currency: value.currency }, money)}</div>
        </div>
    )
}

/** "Edition: Harvest 1984, Europe (CD), the most common CD edition on Discogs." */
function EditionLine({ release, link = true }: { release?: Release | null; link?: boolean }) {
    const line = release?.title ? t('inventory.value.editionNamed', { title: release.title }) : t('inventory.value.editionUnnamed')
    return <>{link ? `${line} ` : line}{link ? discogsLink(release?.url, t('inventory.value.seeIt')) : null}</>
}

/** «Read on …» with the currency the reading was in, when it is not the one shown. */
const readOnLine = (value: Value, money: Money): string => (value.currency === money.currency
    ? t('inventory.value.readOn', { moment: momentText(value.readAt) })
    : t('inventory.value.readOnConverted', { moment: momentText(value.readAt), currency: value.currency ?? '' }))

function FromDiscogs({ shown }: BodyProps) {
    const { value, money } = shown
    const { mint, nearMint, veryGoodPlus } = value.conditions as NonNullable<Value['conditions']>
    return (
        <>
            <Lead>{t('inventory.value.discogsLead')}</Lead>
            <div className="flex flex-wrap gap-3" data-role="conditions">
                <Cell label={t('inventory.value.mint')} amount={mint} value={value} money={money} />
                <Cell label={t('inventory.value.nearMint')} amount={nearMint} value={value} money={money} />
                <Cell label={t('inventory.value.veryGoodPlus')} amount={veryGoodPlus} value={value} money={money} />
                <Cell label={t('inventory.value.mean')} amount={meanOfConditions(value.conditions)} value={value} money={money} strong />
            </div>
            <p className={SMALL}><EditionLine release={value.release} /><br />{` ${readOnLine(value, money)} `}<ReadButton label={t('inventory.value.readAgain')} busy={shown.busy} /></p>
            <Credit release={value.release} />
            <Field label={t('inventory.value.writeYours')} money={money} />
        </>
    )
}

/** The weaker Discogs value: the lowest price the edition is for sale at. Never called a suggestion or a mean. */
function LowestForSale({ shown }: BodyProps) {
    const { value, money } = shown
    return (
        <>
            <Lead>{t('inventory.value.lowestLead')}</Lead>
            <div className="flex flex-wrap items-center gap-2" data-role="lowest">
                <span className="text-sm text-gray-400">{t('inventory.value.lowestLabel')}</span>{' '}
                <span className="text-2xl font-bold text-white" data-role="amount">{moneyText(value, money)}</span>{' '}
                {Number.isInteger(value.forSale) && (value.forSale ?? 0) > 0 ? <span className="text-xs text-gray-400">{`(${t('inventory.value.forSale', { count: value.forSale ?? 0 })})`}</span> : null}
            </div>
            <p className={SMALL}><EditionLine release={value.release} /><br />{` ${readOnLine(value, money)} `}<ReadButton label={t('inventory.value.readAgain')} busy={shown.busy} /></p>
            <Credit release={value.release} />
            <p className="text-xs text-gray-400 mt-1">{t('inventory.value.needsSettings')}</p>
            <Field label={t('inventory.value.writeYours')} money={money} />
        </>
    )
}

const LookedFor = ({ value, busy }: { value: Value; busy: boolean }) => (
    <p className={SMALL}>{`${t('inventory.value.lookedFor', { moment: momentText(value.readAt) })} `}<ReadButton label={t('inventory.value.lookAgain')} busy={busy} /></p>
)

function NoneForSale({ shown }: BodyProps) {
    const { value, money } = shown
    return (
        <>
            <Lead>{t('inventory.value.noneForSaleLead')}</Lead>
            <p className="text-sm text-white">{t('inventory.value.noneForSale')}</p>
            <p className="text-xs text-gray-400 mt-1"><EditionLine release={value.release} /></p>
            <Credit release={value.release} />
            <Field label={t('inventory.value.writeYourself')} money={money} />
            <LookedFor value={value} busy={shown.busy} />
        </>
    )
}

function NoEdition({ shown }: BodyProps) {
    const { value, money } = shown
    return (
        <>
            <Lead>{t('inventory.value.noEditionLead')}</Lead>
            <p className="text-sm text-white">{t('inventory.value.noEdition')}</p>
            <Field label={t('inventory.value.writeYourself')} money={money} />
            <LookedFor value={value} busy={shown.busy} />
        </>
    )
}

function NoSuggestion({ shown }: BodyProps) {
    const { value, money } = shown
    return (
        <>
            <Lead>{t('inventory.value.noSuggestionLead')}</Lead>
            <p className="text-sm text-white">{t('inventory.value.noSuggestion')}</p>
            <p className="text-xs text-gray-400 mt-1"><EditionLine release={value.release} /></p>
            <Credit release={value.release} />
            <Field label={t('inventory.value.writeYourself')} money={money} />
            <LookedFor value={value} busy={shown.busy} />
        </>
    )
}

function NotReadYet({ shown }: BodyProps) {
    return (
        <>
            <Lead>{t('inventory.value.notReadLead')}</Lead>
            <ReadButton label={t('inventory.value.readNow')} busy={shown.busy} primary />
            <Field label={t('inventory.value.orWriteYourself')} money={shown.money} />
        </>
    )
}

function Reading({ shown }: BodyProps) {
    return (
        <>
            <Lead>{t('inventory.value.readingLead')}</Lead>
            <button type="button" className="btn btn-primary" disabled aria-busy="true">{t('inventory.value.reading')}</button>
            <Field label={t('inventory.value.orWriteYourself')} money={shown.money} />
        </>
    )
}

function Failed({ shown }: BodyProps) {
    return (
        <>
            <Lead>{t('inventory.value.notRead', { reason: failureText(shown.value.failure) })}</Lead>
            <ReadButton label={t('inventory.value.tryAgain')} busy={shown.busy} primary />
            <Field label={t('inventory.value.orWriteYourself')} money={shown.money} />
        </>
    )
}

function NothingWritten({ shown }: BodyProps) {
    return (
        <>
            <Lead>{t('inventory.value.nothingWrittenLead')}</Lead>
            <Field label={t('inventory.value.writeYourself')} money={shown.money} />
        </>
    )
}

/** What the section shows for each origin of a value, and for each reason of having none. */
const BODIES: Record<string, (props: BodyProps) => ReactNode> = {
    [ValueOrigin.YOURS]: Yours,
    [ValueOrigin.DISCOGS]: FromDiscogs,
    [NoValue.NO_CD_EDITION]: NoEdition,
    [NoValue.NO_SUGGESTION]: NoSuggestion,
    [NoValue.NONE_FOR_SALE]: NoneForSale,
    [ValueBasis.LOWEST_FOR_SALE]: LowestForSale,
    [NoValue.WAITING]: NotReadYet,
    [NoValue.READING]: Reading,
    [NoValue.FAILED]: Failed,
    [NoValue.SOURCE_OFF]: NothingWritten,
    [NoValue.NEVER_READ]: NothingWritten
}

/** What the person was typing before the section was drawn again, and whether the cursor was in the field. */
export interface Typed {
    text: string
    inUse: boolean
}

export interface ValueSectionProps {
    host: ValueHost
    /** How many times the section was drawn: a new number makes the body again, whole. */
    draws: number
    /** Draws the section (and what follows it) again. */
    draw: () => void
    /** What was typed before the last `draw`; written back into the new field. */
    typed: { current: Typed | null }
    sectionRef: { current: HTMLDivElement | null }
}

/** The «Estimated value» section of the album window. */
export function ValueSection({ host, draws, draw, typed, sectionRef }: ValueSectionProps) {
    const input = (): HTMLInputElement | null => sectionRef.current?.querySelector<HTMLInputElement>(`#${INPUT_ID}`) ?? null

    // drawn again, with what the person was typing still in the field, and the cursor in it
    useLayoutEffect(() => {
        const kept = typed.current
        typed.current = null
        const field = input()
        if (!kept || !field) return
        field.value = kept.text
        if (kept.inUse) field.focus()
        // eslint-disable-next-line react-hooks/exhaustive-deps -- after each draw of the section, and only then
    }, [draws])

    const actions: Record<string, () => Promise<unknown> | unknown> = {
        'save-value': async () => {
            const saved = await host.onWrite(input()?.value ?? '')
            const field = input()
            if (saved && field) field.value = '' // what was typed is the value now
        },
        'forget-value': () => host.onForget(),
        'read-value': () => {
            const done = host.onRead()
            draw() // the host already says "reading": show it while the answer is on its way
            return done
        }
    }
    const run = async (action: string): Promise<void> => {
        try {
            await actions[action]()
        } finally {
            draw()
        }
    }

    const shown = host.view()
    const Body = BODIES[shown.value.basis || shown.value.origin || shown.value.reason || ''] || NothingWritten
    return (
        <div
            ref={sectionRef}
            className={`${BOX} mb-6`}
            data-role="estimated-value"
            style={{ padding: '1rem' }}
            onClick={(event) => {
                const action = (event.target as Element).closest<HTMLElement>('[data-action]')?.dataset.action
                if (action && actions[action]) void run(action)
            }}
            onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.target as Element).id === INPUT_ID) void run('save-value')
            }}
        >
            <Fragment key={draws}>
                <h3 className={HEADING}>{t('inventory.value.estimatedValue')}</h3>
                <Body shown={shown} />
            </Fragment>
        </div>
    )
}

/* ── The phone (F76, recheck N7) ─────────────────────────────────────────────────────────────── */

/** The value in one line: the amount (or what stands for none) and where it comes from, and the edition of Discogs it was read from, for the credit. */
function summaryOf({ value, money }: Shown): { amount: string; origin: string; release: Release | null } {
    const amount = value.amount ?? (value.conditions ? meanOfConditions(value.conditions) : null)
    if (!value.origin || amount === null || amount === undefined) return { amount: '—', origin: noValueText(value), release: null }
    const discogs = value.origin === ValueOrigin.DISCOGS
    return {
        amount: `≈ ${moneyText({ amount, currency: value.currency }, money)}`,
        origin: discogs ? ['Discogs', readOnText(value)].filter(Boolean).join(' · ') : t('inventory.value.yours'),
        release: discogs ? value.release || {} : null
    }
}

/**
 * «Estimated value» folded to one line: a button with the value and its origin that opens the whole section below it, and the Discogs credit beside
 * it (a term of use: never folded away).
 */
function ValueFold({ host, draws, section }: { host: ValueHost; draws: number; section: ReactNode }) {
    const [open, setOpen] = useState(false)
    const { amount, origin, release } = summaryOf(host.view())
    return (
        <div className="value-fold" data-role="value-fold">
            {/* drawn again each time the section is, and a button that was drawn again loses the focus, as the hand-made line did */}
            <div key={draws} className="value-fold__line">
                <button type="button" className="value-fold__toggle" aria-expanded={String(open) as 'true' | 'false'} aria-controls="albumWindowValueDetails" onClick={() => setOpen(current => !current)}>
                    <span className="value-fold__label">{t('inventory.value.estimatedValue')}</span>
                    <span className="value-fold__value"><span className="value-fold__amount" data-role="amount">{amount}</span><span className="value-fold__origin">{origin}</span></span>
                    <Icon name="ChevronDown" className="value-fold__chevron" />
                </button>
                {release ? <a className="value-fold__credit" href={safeUrl(release.url) || 'https://www.discogs.com/'} target="_blank" rel="noopener" data-role="discogs-credit">{DISCOGS_CREDIT}</a> : null}
            </div>
            <div id="albumWindowValueDetails" className="value-fold__panel" hidden={!open}>{section}</div>
        </div>
    )
}

/** The tick that tells the window «draw the value again» (the controller's `redrawValue`): a number that goes up, and who listens. */
export function createTicker() {
    const listeners = new Set<() => void>()
    let count = 0
    return {
        subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } },
        snapshot: () => count,
        bump: () => { count += 1; listeners.forEach(listener => listener()) }
    }
}
export type Ticker = ReturnType<typeof createTicker>

/**
 * What the album window of an inventory item shows above its tracks (F75): its value, and where to buy it. On the computer the two boxes; on the phone
 * (F76, recheck N7) both folded to one line each.
 */
export function ValueAndBuy({ item, host, phone, ticker }: { item: Item; host: ValueHost; phone: boolean; ticker: Ticker }) {
    const outside = useSyncExternalStore(ticker.subscribe, ticker.snapshot)
    const [inside, setInside] = useState(0)
    const typed = useRef<Typed | null>(null)
    const sectionRef = useRef<HTMLDivElement | null>(null)
    const draws = outside + inside
    // the controller says the value changed: the section is drawn again, as the hand-made `redrawValue` did
    const seen = useRef(outside)
    if (seen.current !== outside) {
        seen.current = outside
        typed.current = typedOf(sectionRef.current)
    }
    useEffect(() => () => { typed.current = null }, [])

    const draw = (): void => {
        typed.current = typedOf(sectionRef.current)
        setInside(current => current + 1)
    }
    const section = <ValueSection host={host} draws={draws} draw={draw} typed={typed} sectionRef={sectionRef} />
    if (!phone) return <>{section}<BuyLinks album={item} /></>
    return <><ValueFold host={host} draws={draws} section={section} /><PhoneBuyLinks album={item} /></>
}

function typedOf(section: HTMLElement | null): Typed | null {
    const field = section?.querySelector<HTMLInputElement>(`#${INPUT_ID}`)
    return field ? { text: field.value, inUse: field.ownerDocument.activeElement === field } : null
}
