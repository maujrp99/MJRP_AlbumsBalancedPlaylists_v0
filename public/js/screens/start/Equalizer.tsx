/**
 * Equalizer - the bars of the Start screen (F79, D6): in the colours of the fire, part of the site's identity, with a meaning. `still`
 * (half light, varied heights): ready, nothing asked; `live` (moving): waiting for an answer (the catalog, the save of the series); `flat`
 * (low): the answer did not come. The words of the screen always say the same, so the bars are never the only sign. With
 * `prefers-reduced-motion` nothing moves (css/views/home.css). Ported from components/home/HomeEqualizer.js: the same elements and classes.
 */
import type { CSSProperties } from 'react'

/** The height of a bar, between a quarter and the whole: varied, never random (the same on every draw). */
const heightOf = (i: number): string => (0.25 + 0.75 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.37))).toFixed(2)

/** The class of each state, written whole (the build reads class names from the source: test/architecture/tailwindBuiltWithSite.test.js). */
const STATE_CLASSES = { still: 'is-still', live: 'is-live', flat: 'is-flat' } as const

export type EqualizerState = keyof typeof STATE_CLASSES

interface Props {
    /** 48 under the field, 32 on the phone, 5 beside «Saving your series…». */
    bars: number
    state: EqualizerState
    className?: string
}

export function Equalizer({ bars, state, className = '' }: Props) {
    return (
        <div className={`home-eq ${STATE_CLASSES[state]} ${className}`.trim()} aria-hidden="true" data-state={state}>
            {Array.from({ length: bars }, (_, i) => (
                <i key={i} style={{ '--h': heightOf(i), '--d': `${(i % 7) * -0.13}s` } as CSSProperties} />
            ))}
        </div>
    )
}
