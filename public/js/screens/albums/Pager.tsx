/**
 * Pager - the pager of the series on the albums screen (F83 wave 5a; the port of components/ui/Pager.js): the same one above the list and
 * below it (F72), the numbered pages or the list that grows on scroll, the size of a page, the form, and on the phone a short bar with
 * arrows and a jump. What one changes both show.
 *
 * Like the hand-made pager, it is made again only when what it says changes (its `key` is the paging it was given): a press that changes
 * the page or the size makes it new, and the focus goes back to the page; a notice that does not touch the paging (an album arriving)
 * leaves it, and the focus on it, alone. The «load more» of the scroll form asks once when its line comes into view.
 */
import { useEffect, useRef, type ReactNode } from 'react'
import { t, tPlural } from '../../i18n/t.js'
import { PAGE_SIZES, PagingMode } from '../../models/paging.js'
import { Icon } from '../../ui/Icon'
import type { Paging } from './types'

const MAX_PAGE_BUTTONS = 9

export interface PagerProps {
    paging: Paging | null
    place?: 'top' | 'bottom'
    phone: boolean
    onPage: (page: number) => void
    onSize: (size: number) => void
    onMode: (mode: string) => void
    onMore: () => void
}

const bold = (text: string | number) => <b className="text-white">{text}</b>

function Count({ paging, showing }: { paging: Paging; showing: boolean }) {
    if (paging.total === 0) return <>{t('albums.pager.noSeries')}</>
    const filtered = paging.total < paging.totalSeries ? ` ${t('albums.pager.ofAll', { total: paging.totalSeries })}` : ''
    const albums = Number(paging.albums)
    const hasAlbums = Number.isFinite(albums) && paging.albums !== undefined && paging.albums !== null
    return (
        <>
            {showing ? `${t('albums.pager.showing')} ` : ''}{bold(`${paging.from}–${paging.to}`)}{` ${t('albums.pager.of')} `}{bold(paging.total)}{` ${t('albums.pager.series')}${filtered}${hasAlbums ? ' · ' : ''}`}
            {hasAlbums ? <>{bold(albums)}{` ${albums === 1 ? t('albums.pager.albumOne') : t('albums.pager.albumOther')}`}</> : null}
        </>
    )
}

function Unchecked({ paging }: { paging: Paging }) {
    const count = Number(paging.unchecked) || 0
    if (count <= 0) return null
    return <p className="series-pager-unchecked text-xs text-amber-400" role="status">{tPlural('albums.pager.unchecked', count, { count })}</p>
}

function pageNumbers(current: number, pages: number): Array<number | null> {
    if (pages <= MAX_PAGE_BUTTONS) return Array.from({ length: pages }, (_, i) => i + 1)
    const keep = new Set([1, 2, pages - 1, pages, current - 1, current, current + 1])
    const list: Array<number | null> = []
    for (let page = 1; page <= pages; page++) {
        if (keep.has(page)) list.push(page)
        else if (list[list.length - 1] !== null) list.push(null)
    }
    return list
}

function SizeSelect({ paging, onSize, className }: { paging: Paging; onSize: PagerProps['onSize']; className: string }) {
    return (
        <select className={className} aria-label={t('albums.pager.perPage')} value={String(paging.size)} onChange={(event) => onSize(Number(event.target.value))}>
            {(PAGE_SIZES as number[]).map(size => <option key={size} value={size}>{size}</option>)}
        </select>
    )
}

function ModeButtons({ paging, onMode, phone }: { paging: Paging; onMode: PagerProps['onMode']; phone: boolean }) {
    const scroll = paging.mode === PagingMode.SCROLL
    const on = 'bg-brand-orange text-white'
    const off = 'bg-brand-dark/50 text-gray-400 hover:text-white'
    const choose = (mode: string) => () => { if (mode !== paging.mode) onMode(mode) }
    return (
        <>
            <button type="button" data-pager-mode={PagingMode.PAGES} aria-pressed={!scroll} className={phone ? undefined : `px-3 py-1 text-xs ${scroll ? off : on}`} onClick={choose(PagingMode.PAGES)}>{t('albums.pager.pages')}</button>
            <button type="button" data-pager-mode={PagingMode.SCROLL} aria-pressed={scroll} className={phone ? undefined : `px-3 py-1 text-xs ${scroll ? on : off}`} onClick={choose(PagingMode.SCROLL)}>{t('albums.pager.scroll')}</button>
        </>
    )
}

function More({ paging, onMore }: { paging: Paging; onMore: () => void }) {
    const sentinel = useRef<HTMLDivElement>(null)
    useEffect(() => {
        const line = sentinel.current
        if (!line || typeof IntersectionObserver === 'undefined') return undefined
        let asked = false
        const observer = new IntersectionObserver((entries) => {
            if (asked || !entries.some(entry => entry.isIntersecting)) return
            asked = true
            onMore()
        }, { rootMargin: '0px 0px 300px 0px' })
        observer.observe(line)
        return () => observer.disconnect()
    }, [onMore])
    if (!paging.hasMore) {
        return paging.total > 0 ? <p className="text-center text-sm text-gray-500">{t('albums.pager.allOnScreen', { total: paging.total })}</p> : null
    }
    const next = Math.min(paging.size, paging.total - paging.to)
    return (
        <div className="series-pager-more text-center text-sm text-gray-500" data-pager-sentinel="" ref={sentinel}>
            <button type="button" data-pager-more="" className="btn btn-secondary btn-sm" onClick={onMore}>{t('albums.pager.loadMore', { count: next })}</button>
        </div>
    )
}

function Pages({ paging, onPage }: { paging: Paging; onPage: PagerProps['onPage'] }) {
    if (paging.pages <= 1) return null
    const button = (page: number, label: ReactNode, current: boolean, off: boolean, active: boolean) => (
        <button key={`${page}-${String(label)}`} type="button" data-pager-page={page} disabled={off} aria-current={current ? 'page' : undefined}
            className={`min-w-[2.25rem] px-3 py-1.5 rounded-lg border text-sm ${active ? 'bg-brand-orange border-brand-orange text-white font-bold' : 'bg-brand-dark/50 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'} disabled:opacity-40 disabled:cursor-default`}
            onClick={() => { if (!off) onPage(page) }}>{label}</button>
    )
    return (
        <nav className="series-pager-pages flex flex-wrap items-center justify-center gap-2" aria-label={t('albums.pager.pages')}>
            {button(paging.page - 1, t('albums.pager.previous'), false, paging.page === 1, false)}
            {pageNumbers(paging.page, paging.pages).map((page, index) => (page === null
                ? <span key={`gap-${index}`} className="px-1 text-gray-500">…</span>
                : button(page, page, page === paging.page, false, page === paging.page)))}
            {button(paging.page + 1, t('albums.pager.next'), false, paging.page === paging.pages, false)}
        </nav>
    )
}

function Step({ paging, step, onPage }: { paging: Paging; step: -1 | 1; onPage: PagerProps['onPage'] }) {
    const page = paging.page + step
    const off = step < 0 ? paging.page === 1 : paging.page === paging.pages
    return (
        <button type="button" className={step < 0 ? 'series-pager-step series-pager-step--back' : 'series-pager-step'} aria-label={step < 0 ? t('albums.pager.previousPage') : t('albums.pager.nextPage')} data-pager-page={page} disabled={off} onClick={() => { if (!off) onPage(page) }}>
            <Icon name="ChevronRight" className="series-pager-step__icon" />
        </button>
    )
}

function PhonePages({ paging, onPage }: { paging: Paging; onPage: PagerProps['onPage'] }) {
    return (
        <nav className="series-pager-pages series-pager-pages--phone" aria-label={t('albums.pager.pages')}>
            <Step paging={paging} step={-1} onPage={onPage} />
            <select className="series-pager-jump form-control" aria-label={t('albums.pager.goTo')} value={String(paging.page)} onChange={(event) => onPage(Number(event.target.value))}>
                {Array.from({ length: paging.pages }, (_, i) => i + 1).map(page => <option key={page} value={page}>{t('albums.pager.pageOf', { page, pages: paging.pages })}</option>)}
            </select>
            <Step paging={paging} step={1} onPage={onPage} />
        </nav>
    )
}

function ComputerPager({ paging, top, props }: { paging: Paging; top: boolean; props: PagerProps }) {
    const scroll = paging.mode === PagingMode.SCROLL
    return (
        <div className={`series-pager glass-panel p-4 ${top ? 'mb-6' : 'mt-6'} flex flex-col gap-4`} data-paging-mode={paging.mode} data-pager-place={top ? 'top' : 'bottom'}>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-400">
                <p className="series-pager-count" aria-live={top ? undefined : 'polite'}><Count paging={paging} showing /></p>
                <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2">{`${t('albums.pager.perPage')} `}<SizeSelect paging={paging} onSize={props.onSize} className="series-pager-size form-control text-sm py-1" /></label>
                    <div className="flex rounded-lg overflow-hidden border border-white/10" role="group" aria-label={t('albums.pager.form')}><ModeButtons paging={paging} onMode={props.onMode} phone={false} /></div>
                </div>
            </div>
            {top ? null : <Unchecked paging={paging} />}
            {scroll ? (top ? null : <More paging={paging} onMore={props.onMore} />) : <Pages paging={paging} onPage={props.onPage} />}
        </div>
    )
}

function PhonePager({ paging, top, props }: { paging: Paging; top: boolean; props: PagerProps }) {
    const scroll = paging.mode === PagingMode.SCROLL
    const paged = !scroll && paging.pages > 1
    if (top) {
        return (
            <div className="series-pager series-pager--phone series-pager--phone-top" data-paging-mode={paging.mode} data-pager-place="top">
                <p className="series-pager-count"><Count paging={paging} showing={false} /></p>
                {paged ? <div className="series-pager-arrows"><Step paging={paging} step={-1} onPage={props.onPage} /><Step paging={paging} step={1} onPage={props.onPage} /></div> : null}
            </div>
        )
    }
    return (
        <div className="series-pager series-pager--phone" data-paging-mode={paging.mode} data-pager-place="bottom">
            <p className="series-pager-count" aria-live="polite"><Count paging={paging} showing /></p>
            <Unchecked paging={paging} />
            {scroll ? <More paging={paging} onMore={props.onMore} /> : (paged ? <PhonePages paging={paging} onPage={props.onPage} /> : null)}
            <div className="series-pager-settings">
                <label className="series-pager-size-label">{`${t('albums.pager.perPage')} `}<SizeSelect paging={paging} onSize={props.onSize} className="series-pager-size form-control" /></label>
                <div className="series-pager-form" role="group" aria-label={t('albums.pager.form')}><ModeButtons paging={paging} onMode={props.onMode} phone /></div>
            </div>
        </div>
    )
}

export function Pager(props: PagerProps) {
    const { paging, place, phone } = props
    if (!paging || paging.totalSeries === 0) return null
    const top = place === 'top'
    if (paging.single) {
        const hasNotice = !top && (Number(paging.unchecked) || 0) > 0
        return hasNotice ? <div className="series-pager glass-panel p-4 mt-6"><Unchecked paging={paging} /></div> : null
    }
    // made again when what it says changes: the focus on a control that was pressed goes back to the page
    const picture = JSON.stringify([paging, phone])
    return phone ? <PhonePager key={picture} paging={paging} top={top} props={props} /> : <ComputerPager key={picture} paging={paging} top={top} props={props} />
}
