/**
 * Stage - the top of the Start screen (F79, `design/inception/home-transformar-v2.html`; the old views/HomeView.js `renderStage` and
 * `drawStage`, the same elements and classes): the title and what a series is (before anything is found), the one field (an artist or a
 * pasted list), the hint that points to the next gesture, the line of the visitor on the phone, and the equalizer.
 *
 * The old stage wrote into blocks it hid and showed; this one draws every block always, with `hidden` in the same cases, so the page is
 * the same. The field of the artist is the browser's, not React's: the old screen read it when it was asked, and the browser proof of
 * the Home writes into it by code and tells the page, which a field React owns would not take (hence `onInput` and no value).
 */
import { useLayoutEffect, useRef, useState } from 'react'
import { Icon } from '../../ui/Icon'
import { t } from '../../i18n/t.js'
import { ScanStatus } from '../../models/scanState.js'
import { isPhone } from '../../utils/isPhone.js'
import { Equalizer } from './Equalizer'
import { PasteList } from './PasteList'
import { GuestLine } from './Dock'
import { equalizerState, stageIsBig } from './homeSeries'
import type { StartController } from './StartController'

/** The bars under the field: 48 on the computer, 32 on the phone, counted once when the screen is made (the old screen made them once). */
const BARS = { phone: 32, computer: 48 }

function ModeLink({ controller, mode, children }: { controller: StartController; mode: 'artist' | 'paste'; children: string }) {
    return <button type="button" className="home-link" data-home-mode={mode} onClick={() => controller.setMode(mode)}>{children}</button>
}

function Hint({ controller, paste, typing }: { controller: StartController; paste: boolean; typing: boolean }) {
    if (paste) return <>{t('start.hint.paste.before')}{' '}<ModeLink controller={controller} mode="artist">{t('start.hint.paste.link')}</ModeLink></>
    if (typing) return <>{t('start.hint.typing')}</>
    return <>{t('start.hint.artist.before')}{' '}<ModeLink controller={controller} mode="paste">{t('start.hint.artist.link')}</ModeLink>{' '}{t('start.hint.artist.after')}</>
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
    const busy = scan.status === ScanStatus.SCANNING
    const showGuest = state.guest && phone

    return (
        <section id="homeStage" className={`home-stage ${big ? 'is-big' : 'is-small'}`}>
            <div id="homeHero" className="home-hero" hidden={!big}>
                <h1><span className="home-hero__l1">{t('start.stage.title.first')}</span>{' '}<span className="home-hero__l2">{t('start.stage.title.second')}</span></h1>
                <p>{t('start.stage.about')}</p>
            </div>
            <div id="homeField" className="home-field" hidden={paste}>
                <Icon name="Search" className="home-field__ico" />
                <input
                    ref={field} type="text" id="artistScanInput" autoComplete="off" spellCheck={false}
                    placeholder={t('start.field.placeholder')} aria-label={t('start.field.label')}
                    onKeyDown={(event) => { if (event.key === 'Enter') void controller.search(event.currentTarget.value) }}
                    onInput={(event) => controller.typed(event.currentTarget.value, document.activeElement === event.currentTarget)}
                    onFocus={() => controller.focusChanged(true)}
                    onBlur={() => controller.focusChanged(false)}
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
            <PasteList controller={controller} hidden={!paste} />
            <p id="homeHint" className="home-hint"><Hint controller={controller} paste={paste} typing={controller.isTyping()} /></p>
            <div id="homeGuestStage" className="home-guest-stage" hidden={!showGuest}>
                {showGuest ? <GuestLine controller={controller} action="stage-sign-in" /> : null}
            </div>
            <Equalizer bars={bars} state={equalizerState(scan.status)} />
        </section>
    )
}
