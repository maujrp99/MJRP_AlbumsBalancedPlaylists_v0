/**
 * The ranking window («my ranking») on the phone (F76, REQ-07; audit finding 14; F83 wave 5b: it was components/ranking/rankWindowPhone.js).
 *
 * What the computer has, laid out for a finger: a bar with Back and Reset; the album, the hint and the tracks in one body that scrolls;
 * Save always in view at the foot. Each track has its title on a line of its own (it wraps), the BEA and Spotify references and the duration
 * below it, and a handle to drag it. A track also moves WITHOUT dragging (WCAG 2.2, SC 2.5.7): tap it, and the foot offers Up, Down and
 * «Move to…» (a sheet with the numbers). Reset can be undone for 5 seconds.
 *
 * Drawn by RankWindow only when the screen is a phone; the window draws itself again when the screen stops (or starts) being one. The state
 * (the order, the track picked) is the session's. As the hand-made window did, the buttons of the foot take their state (hidden, disabled)
 * at the press that moves or picks (`refresh`), not at a drag: a drag does not touch them. Styles: public/css/mobile/ranking.css.
 */
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { t } from '../../i18n/t.js'
import { formatDuration } from '../../utils/duration.js'
import { Icon } from '../../ui/Icon'
import { trackKey, type RankSession, type RankTrack } from './rankSession'

const hasRank = (value: number | undefined): boolean => Boolean(value) && (value as number) < 999

/** What is said of a track below its title: its BEA rank, its Spotify rank, its duration. */
export function referencesOf(track: RankTrack): string {
    return [
        hasRank(track.rank) ? t('albums.rankWindow.referenceBea', { rank: track.rank as number }) : null,
        hasRank(track.spotifyRank) ? t('albums.rankWindow.referenceSpotify', { rank: track.spotifyRank as number }) : null,
        formatDuration(track.duration)
    ].filter(Boolean).join(' · ')
}

export interface PhoneActions {
    onBack: () => void
    onSave: () => void
    /** Reset, with a way back for 5 seconds. */
    onReset: (refresh: () => void) => void
    onMoveTo: (refresh: () => void, announce: (text: string) => void) => void
}

interface Foot {
    hidden: boolean
    upDisabled: boolean | undefined
    downDisabled: boolean | undefined
}

function Row({ session, track, index, onPick }: { session: RankSession; track: RankTrack; index: number; onPick: (id: string) => void }) {
    const picked = session.pickedId === trackKey(track)
    return (
        <li className={`rank-row${picked ? ' is-picked' : ''}`} data-track-id={trackKey(track)}>
            <button type="button" className="rank-row__pick" aria-pressed={picked} onClick={() => onPick(trackKey(track))}>
                <span className="rank-row__number" data-role="rank-number">{String(index + 1)}</span>
                <span className="rank-row__text">
                    <span className="rank-row__title">{track.title}</span>
                    <span className="rank-row__refs">{referencesOf(track)}</span>
                </span>
            </button>
            <span className="rank-row__handle" aria-hidden="true"><Icon name="GripVertical" className="rank-icon" /></span>
        </li>
    )
}

/** The key of a row: the track, and which of the tracks with that name it is (two tracks may have the same title and no id). */
export function keysOf(order: RankTrack[]): string[] {
    const seen = new Map<string, number>()
    return order.map(track => {
        const key = trackKey(track)
        const nth = seen.get(key) ?? 0
        seen.set(key, nth + 1)
        return `${key}#${nth}`
    })
}

export function RankPhone({ session, box, actions, children }: { session: RankSession; box: React.RefObject<HTMLDivElement | null>; actions: PhoneActions; children?: ReactNode }) {
    const [foot, setFoot] = useState<Foot>({ hidden: true, upDisabled: undefined, downDisabled: undefined })
    const [announcement, setAnnouncement] = useState('')
    const [refreshes, setRefreshes] = useState(0)
    const keys = keysOf(session.rankedOrder)

    /** The list drawn again, the foot told of the track picked, and that track kept in view and in focus. */
    const refresh = (): void => {
        const at = session.pickedIndex()
        setFoot({ hidden: at < 0, upDisabled: at <= 0, downDisabled: at < 0 || at >= session.rankedOrder.length - 1 })
        setRefreshes(count => count + 1)
    }

    const focusing = useRef(0)
    useLayoutEffect(() => {
        if (refreshes === 0 || refreshes === focusing.current) return
        focusing.current = refreshes
        const at = session.pickedIndex()
        if (at < 0) return
        const row = box.current?.querySelectorAll<HTMLElement>('.rank-row__pick')[at]
        row?.focus({ preventScroll: true })
        row?.scrollIntoView?.({ block: 'nearest' })
    }, [refreshes, session, box])

    const announce = (text: string): void => setAnnouncement(text)
    const pick = (id: string | null): void => {
        session.pick(id)
        refresh()
    }
    /** The track picked one place up (-1) or down (+1). */
    const moveBy = (step: number): void => {
        const from = session.pickedIndex()
        if (from < 0 || !session.moveTrack(from, from + step)) return
        announce(t('albums.rankWindow.nowNumber', { title: session.rankedOrder[from + step]?.title ?? '', number: from + step + 1 }))
        refresh()
    }

    return (
        <div className="rank-window rank-window--phone fixed inset-0 z-50 flex" ref={box}>
            <div className="glass-panel flex flex-col fullscreen-modal rank-phone" role="dialog" aria-modal="true" aria-labelledby="rankPhoneTitle">
                <div className="rank-phone__bar">
                    <button type="button" className="rank-phone__back" onClick={actions.onBack}>
                        <Icon name="ChevronRight" className="rank-icon rank-icon--back" />
                        {t('albums.rankWindow.back')}
                    </button>
                    <h2 id="rankPhoneTitle" className="rank-phone__title">{t('albums.rankWindow.phoneTitle')}</h2>
                    <button type="button" className="rank-phone__reset" onClick={() => { pick(null); actions.onReset(refresh) }}>
                        <Icon name="Undo" className="rank-icon" />
                        {t('albums.rankWindow.reset')}
                    </button>
                </div>
                <div className="rank-phone__body">
                    <div className="rank-phone__intro">
                        <p className="rank-phone__album">{session.album.title}</p>
                        <p className="rank-phone__artist">{session.album.artist}</p>
                        <p className="rank-phone__hint">{t('albums.rankWindow.hint')}</p>
                    </div>
                    <ol id="rank-track-list" className="rank-phone__list">
                        {session.rankedOrder.map((track, index) => <Row key={keys[index]} session={session} track={track} index={index} onPick={pick} />)}
                    </ol>
                    <p className="rank-phone__note">{t('albums.rankWindow.note')}</p>
                </div>
                <div className="rank-phone__foot">
                    <div className="rank-phone__mover" role="group" aria-label={t('albums.rankWindow.moveGroup')} hidden={foot.hidden}>
                        <button type="button" className="rank-phone__move" aria-label={t('albums.rankWindow.moveUpLabel')} disabled={foot.upDisabled} onClick={() => moveBy(-1)}>
                            <Icon name="ArrowUp" className="rank-icon" />
                            {t('albums.rankWindow.up')}
                        </button>
                        <button type="button" className="rank-phone__move" aria-label={t('albums.rankWindow.moveDownLabel')} disabled={foot.downDisabled} onClick={() => moveBy(1)}>
                            <Icon name="ArrowUp" className="rank-icon rank-icon--down" />
                            {t('albums.rankWindow.down')}
                        </button>
                        <button type="button" className="rank-phone__move" onClick={() => actions.onMoveTo(refresh, announce)}>{t('albums.rankWindow.moveTo')}</button>
                        <button type="button" className="rank-phone__move rank-phone__done" onClick={() => pick(null)}>{t('albums.rankWindow.done')}</button>
                    </div>
                    <button type="button" className="btn btn-primary rank-phone__save" onClick={actions.onSave}>
                        <Icon name="Save" className="rank-icon" />
                        {t('albums.rankWindow.saveRanking')}
                    </button>
                </div>
                <div className="sr-only" aria-live="polite" data-role="rank-live">{announcement}</div>
            </div>
            {children}
        </div>
    )
}
