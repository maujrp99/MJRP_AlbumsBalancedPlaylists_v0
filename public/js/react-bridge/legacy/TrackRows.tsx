/**
 * TrackRows - the rows of tracks of the hand-made piece (components/ui/TrackRow.js) inside a React screen (F83 wave 1;
 * proposal § 4.2, rule 2). TEMPORARY: it goes when the playlists screen (wave 2) is in React and the row is ported once, to ui/;
 * each screen that uses it is listed in test/architecture/bridgesOnlyShrink.test.js.
 *
 * The box is React's (its classes and attributes are given); its children are the rows the old piece builds, put in by hand
 * and never touched by React, so the old row, with its badges and its hover actions, is the same one. A box given no tracks
 * draws its children, which is how a screen says «No tracks». The texts the rows hold (the badges) are the old piece's and stay
 * in English until it is ported.
 */
import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { TrackRow } from '../../components/ui/TrackRow.js'

export interface RowTrack {
    title?: string
    duration?: number
    [field: string]: unknown
}

/** `detailed`: a playlist of a saved batch (the position is its place); `compact`: the window of a playlist, no actions. */
export type RowKind = 'detailed' | 'compact'

interface Props {
    tracks: RowTrack[]
    kind: RowKind
    className: string
    filled?: boolean
    children?: ReactNode
}

const rowOf = (track: RowTrack, i: number, kind: RowKind) => (kind === 'detailed'
    ? { track, index: i + 1, variant: 'detailed' as const, playlistIndex: -1, trackIndex: i }
    : { track, index: i + 1, variant: 'compact' as const, actions: [] })

/** «3:45»: how the old row writes a length (the window of a playlist says the total the same way). */
export const formatTrackDuration = (seconds: number): string => TrackRow.formatDuration(seconds)

export function TrackRows({ tracks, kind, className, filled, children }: Props) {
    const box = useRef<HTMLDivElement>(null)

    useLayoutEffect(() => {
        if (tracks.length === 0) return
        box.current?.replaceChildren(...tracks.map((track, i) => TrackRow.render(rowOf(track, i, kind))))
    }, [tracks, kind])

    return (
        <div ref={box} className={className} data-filled={filled ? 'true' : undefined}>
            {tracks.length === 0 ? children : null}
        </div>
    )
}
