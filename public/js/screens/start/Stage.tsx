/**
 * Stage - the top of the Start screen (F79, `design/inception/home-transformar-v2.html`; the old views/HomeView.js `renderStage` and
 * `drawStage`, the same elements and classes): the title and what a series is (before anything is found), the one field (an artist or a
 * pasted list), the hint that points to the next gesture, the line of the visitor on the phone, and the equalizer.
 *
 * The old stage wrote into blocks it hid and showed; this one draws every block always, with `hidden` in the same cases, so the page is
 * the same. The field of the artist is the browser's, not React's: the old screen read it when it was asked, and the browser proof of
 * the Home writes into it by code and tells the page, which a field React owns would not take (hence `onInput` and no value).
 */
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { Icon } from '../../ui/Icon'
import { t } from '../../i18n/t.js'
import { ScanStatus } from '../../models/scanState.js'
import { isPhone } from '../../utils/isPhone.js'
import { Equalizer } from './Equalizer'
import { PasteList } from './PasteList'
import { GuestLine } from './Dock'
import { useSheetWindow } from '../../ui/SheetWindow'
import { equalizerState, guestNoticeShows, hintLink, stageIsBig } from './homeSeries'
import type { StartController } from './StartController'

/** The bars under the field: 48 on the computer, 32 on the phone, counted once when the screen is made (the old screen made them once). */
const BARS = { phone: 32, computer: 48 }

function ModeLink({ controller, mode, children }: { controller: StartController; mode: 'artist' | 'paste'; children: string }) {
    return <button type="button" className="home-link" data-home-mode={mode} onClick={() => controller.setMode(mode)}>{children}</button>
}

/** The one link under the field, on both sizes (UAT-281; the computer's lean, F79): none when the «not found» message has its own «Paste a list». */
function Hint({ controller, paste, notFound }: { controller: StartController; paste: boolean; notFound: boolean }) {
    const link = hintLink({ paste, notFound: notFound && !paste })
    if (link === 'artist') return <ModeLink controller={controller} mode="artist">{t('start.hint.link.artist')}</ModeLink>
    return link === 'paste' ? <ModeLink controller={controller} mode="paste">{t('start.hint.link.paste')}</ModeLink> : null
}

/**
 * «What is a series?». On the phone the link opens the sentence in the app's bottom sheet (a dialog: `aria-haspopup`, no expanded state);
 * on the computer it opens the sentence IN PLACE under the title (`aria-expanded`, `aria-controls`), and a second click closes it. One
 * Escape closes one thing: the sentence only when the focus is on the link or inside the sentence, and never when another layer (a menu, a
 * window, a sheet) already took the key (`defaultPrevented`). The sentence closes by itself when the screen becomes a phone.
 */
function WhatIsASeries({ phone, open, setOpen }: { phone: boolean; open: boolean; setOpen: (open: boolean) => void }) {
    const sheet = useSheetWindow()
    const showSheet = () => {
        if (sheet.isOpen()) return
        sheet.show({
            variant: 'bottom', id: 'whatIsASeries', title: t('start.what.link'), closeLabel: t('ui.window.close'),
            render: () => <p className="home-what__text">{t('start.stage.about')}</p>
        })
    }
    useEffect(() => {
        if (phone) setOpen(false)
    }, [phone, setOpen])
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key !== 'Escape' || event.defaultPrevented) return
            const focus = document.activeElement
            if (focus && (focus.closest('.home-what') || focus.closest('#homeWhatText'))) setOpen(false)
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [setOpen])
    const attributes = phone
        ? { 'aria-haspopup': 'dialog' as const }
        : { 'aria-expanded': open, 'aria-controls': 'homeWhatText' }
    return (
        <>
            <button type="button" className="home-what" {...attributes} onClick={phone ? showSheet : () => setOpen(!open)}>{t('start.what.link')}</button>
            {phone ? sheet.layer : null}
        </>
    )
}

/** The line under the field: there when it has its one link. */
const hintShows = (paste: boolean, scan: string): boolean => hintLink({ paste, notFound: scan === ScanStatus.EMPTY && !paste }) !== null

/** The one field: an artist; Enter or «Search» asks the catalog. The field is the browser's, not React's (see the top of the file). */
function ArtistField({ controller, field, hidden, busy }: { controller: StartController; field: RefObject<HTMLInputElement | null>; hidden: boolean; busy: boolean }) {
    return (
        <div id="homeField" className="home-field" hidden={hidden}>
            <Icon name="Search" className="home-field__ico" />
            <input
                ref={field} type="text" id="artistScanInput" autoComplete="off" spellCheck={false}
                placeholder={t('start.field.placeholder')} aria-label={t('start.field.label')}
                onKeyDown={(event) => { if (event.key === 'Enter') void controller.search(event.currentTarget.value) }}
                onInput={() => controller.fieldChanged()}
                onFocus={() => controller.fieldChanged()}
                onBlur={() => controller.fieldChanged()}
                onPaste={(event) => { if (controller.pasteIntoField(event.clipboardData?.getData('text') || '')) event.preventDefault() }}
            />
            <button
                type="button" id="btnScanArtist" className={`home-btn${controller.flame() === 'search' ? ' is-flame' : ''}`}
                disabled={busy} aria-busy={busy ? 'true' : undefined}
                onClick={() => { void controller.search(field.current?.value ?? '') }}
            >
                {t(busy ? 'start.field.searching' : 'start.field.search')}
            </button>
        </div>
    )
}

/** The title and «What is a series?» with its sentence: only before anything is found. */
function Hero({ phone, big }: { phone: boolean; big: boolean }) {
    const [whatOpen, setWhatOpen] = useState(false)
    return (
        <div id="homeHero" className="home-hero" hidden={!big}>
            <h1><span className="home-hero__l1">{t('start.stage.title.first')}</span>{' '}<span className="home-hero__l2">{t('start.stage.title.second')}</span></h1>
            <WhatIsASeries phone={phone} open={whatOpen} setOpen={setWhatOpen} />
            <p id="homeWhatText" hidden={phone || !whatOpen}>{t('start.stage.about')}</p>
        </div>
    )
}

export function Stage({ controller, phone }: { controller: StartController; phone: boolean }) {
    const field = useRef<HTMLInputElement>(null)
    const [bars] = useState(() => (isPhone() ? BARS.phone : BARS.computer))
    const { state } = controller
    const scan = controller.scan
    const requestId = controller.focusRequest?.id

    useLayoutEffect(() => {
        if (controller.focusRequest?.request.to === 'artist') field.current?.focus()
    }, [controller, requestId])

    if (!scan) return null
    const paste = state.mode === 'paste'
    const big = stageIsBig({ scan: scan.status, paste, report: state.report, phone })
    // Before a search the block sits a little lower, on the computer (css/views/home.css)
    const calm = big && !paste && scan.status === ScanStatus.IDLE
    const busy = scan.status === ScanStatus.SCANNING
    const showGuest = phone && guestNoticeShows({ guest: state.guest, chosen: controller.albums().length })

    return (
        <section id="homeStage" className={`home-stage ${big ? 'is-big' : 'is-small'}${calm ? ' is-calm' : ''}`}>
            <Hero phone={phone} big={big} />
            <ArtistField controller={controller} field={field} hidden={paste} busy={busy} />
            <PasteList controller={controller} hidden={!paste} />
            <p id="homeHint" className="home-hint" hidden={!hintShows(paste, scan.status)}><Hint controller={controller} paste={paste} notFound={scan.status === ScanStatus.EMPTY} /></p>
            <div id="homeGuestStage" className="home-guest-stage" hidden={!showGuest}>
                {showGuest ? <GuestLine controller={controller} action="stage-sign-in" /> : null}
            </div>
            <Equalizer bars={bars} state={equalizerState(scan.status)} />
        </section>
    )
}
