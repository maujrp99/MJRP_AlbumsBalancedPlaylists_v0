/**
 * BarMenu - the home's bar, inside the app (F88, the level «Transformar» on the computer; F83 sync of main: was components/navigation/barMenu.js
 * and bars.js): five stops over ONE row of equalizer bars, ⟲ between the two sides, the fire on the stretch of the current screen. The look is
 * public/splash/bar-menu.css, shared with the home (public/splash.html); each bar's height, speed and offset come from the home's own function
 * (public/splash/menu.js, threadBarStyle) and the icon of each stop from the home's phoneBar.js, so the passage from the home to the app does not
 * change the bar. Here the fire marks WHERE THE PERSON IS (on the home it follows the reading).
 *
 * The same component is the phone's bottom menu (`icons`, no ⟲, 64 bars to start with). The row is drawn again for the width the bar has (the
 * hand-made `fitBars`), at the first draw and at each resize of the window. `wakeBars` lets the last bars of the lit stretch move for a short
 * while, never when the person asked the system for less motion.
 */
import { useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import { threadBarStyle } from '../../splash/menu.js'
import { t } from '../i18n/t.js'
import { PHONE_TABS, currentTab, type PhoneTab } from './phoneTabs'
import { MENU_TEXT } from './menuText'
import { StopIcon } from './StopIcon'

/** How many bars a bar of the computer has before it is measured (about its width over six). */
export const DEFAULT_BARS = 104
/** How many bars the phone's bottom menu has before it is measured. */
export const PHONE_BARS = 64
const MIN_BARS = 30
const PIXELS_PER_BAR = 6
/** The bars move for this long after the screen changes (the home's rest time), then rest. */
export const BAR_REST_MS = 10000
/** Side B starts at this stop: Playlists. */
const SIDE_B_FROM = 3
/** How many bars at the end of the lit stretch move. */
const MOVING_BARS = 4

/** `--h:60%;--d:1.2s;--o:-0.3s` as the object React writes custom properties from. */
function styleOf(text: string): CSSProperties {
    const style: Record<string, string> = {}
    for (const declaration of text.split(';')) {
        const at = declaration.indexOf(':')
        if (at > 0) style[declaration.slice(0, at)] = declaration.slice(at + 1)
    }
    return style as CSSProperties
}

/** The index of the stop the path stands for, -1 on a screen no stop stands for. */
const stopIndexOf = (path: string): number => {
    const tab = currentTab(path)
    return tab ? PHONE_TABS.indexOf(tab) : -1
}

/** The row of bars: the stretch of the current stop is lit in fire and its last bars move. */
function Bars({ count, index, stops }: { count: number; index: number; stops: number }) {
    const from = index / stops
    const to = (index + 1) / stops
    const end = Math.round(to * count)
    return (
        <>
            {Array.from({ length: count }, (_, k) => {
                const lit = index >= 0 && k / count >= from && k / count < to
                const moving = lit && k >= end - MOVING_BARS && k < end
                return <i key={k} className={`${lit ? 'on' : ''}${moving ? ' cur' : ''}`} style={styleOf(threadBarStyle(k))} />
            })}
        </>
    )
}

function Stop({ tab, current, icons, onStop }: { tab: PhoneTab; current: boolean; icons: boolean; onStop?: (event: MouseEvent<HTMLAnchorElement>, tab: PhoneTab) => void }) {
    return (
        <a className={`stop${current ? ' cur' : ''}`} href={`/${tab.route}`} data-link="" data-tab={tab.id} data-for={tab.id} aria-current={current ? 'page' : undefined} onClick={onStop ? (event) => onStop(event, tab) : undefined}>
            {icons ? <StopIcon id={tab.id} /> : null}
            <span className="lb">{t(tab.labelKey)}</span>
        </a>
    )
}

export interface BarMenuProps {
    /** The path of the address (no query). */
    path: string
    bars?: number
    /** An icon above each label (the phone's bottom menu). */
    icons?: boolean
    /** The ⟲ between the two sides. */
    flip?: boolean
    onStop?: (event: MouseEvent<HTMLAnchorElement>, tab: PhoneTab) => void
}

/** The bar: a navigation with the five stops, the flip mark and the row of bars, drawn again for the width the row has. */
export function BarMenu({ path, bars = DEFAULT_BARS, icons = false, flip = true, onStop }: BarMenuProps) {
    const row = useRef<HTMLDivElement>(null)
    const [count, setCount] = useState(bars)
    useLayoutEffect(() => {
        const fit = () => setCount(Math.max(MIN_BARS, Math.round((row.current?.getBoundingClientRect().width || 600) / PIXELS_PER_BAR)))
        fit()
        window.addEventListener('resize', fit)
        return () => window.removeEventListener('resize', fit)
    }, [])
    const current = currentTab(path)
    const index = stopIndexOf(path)
    return (
        <nav className="ms" aria-label={t('shell.phone.tabsLabel')}>
            {PHONE_TABS.map(tab => <Stop key={tab.id} tab={tab} current={tab === current} icons={icons} onStop={onStop} />)}
            {flip ? <span className={`flipmark${index >= SIDE_B_FROM ? ' on' : ''}`} aria-hidden="true" title={MENU_TEXT.flipMark}>⟲</span> : null}
            <div className="eqbar" aria-hidden="true" ref={row}><Bars count={count} index={index} stops={PHONE_TABS.length} /></div>
        </nav>
    )
}

let restTimer: ReturnType<typeof setTimeout> | null = null

/** The last bars of the lit stretch move, and rest after BAR_REST_MS. With less motion asked for they never move. */
export function wakeBars(): void {
    const root = document.documentElement
    if (restTimer) clearTimeout(restTimer)
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        root.classList.remove('moving')
        return
    }
    root.classList.add('moving')
    restTimer = setTimeout(() => root.classList.remove('moving'), BAR_REST_MS)
}

/** Lets the bars rest at once (the shell is gone). */
export function restBars(): void {
    if (restTimer) clearTimeout(restTimer)
    restTimer = null
    document.documentElement.classList.remove('moving')
}
