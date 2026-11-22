/**
 * Step 1 of the Blend on the computer, and what the phone shares with it (F83 wave 7b; the port of components/blend/BlendSeriesSelector.js): the kind of
 * thing to blend (only albums can be chosen), and the list of series in a box that scrolls, each one a card with a cascade of up to three covers, its
 * name, how many albums it has and a check when it is the one chosen. The same HTML and the same classes as the hand-made selector.
 *
 * A card is a `div` that acts as a button for the keyboard (Enter and Space, as before). The covers that arrive in the background draw the list again
 * WITHOUT letting the focus go and without taking the list back to the top: the one difference of this wave on purpose (the hand-made selector drew
 * everything anew at each arrival and the focus on a card was lost). A series chosen by the address is scrolled to once.
 */
import { useLayoutEffect, useRef } from 'react'
import { Icon } from '../../ui/Icon'
import { AlbumCascade } from '../../ui/AlbumCascade'
import { broken } from '../../ui/recipe/broken'
import { t, tPlural } from '../../i18n/t.js'
import { albumCountOf } from '../../models/seriesCovers.js'
import type { BlendVisit } from './blendVisit'
import type { Series } from './types'

const ENTITY_TYPES = [
    { id: 'albums', available: true },
    { id: 'artists', available: false },
    { id: 'genres', available: false },
    { id: 'tracks', available: false }
]

/** The options of «Blend your Music by»: the three that are not made yet are off. The text has the white space of the hand-made template. */
export function EntityOptions() {
    return (
        <>
            {ENTITY_TYPES.map(type => (
                <option key={type.id} value={type.id} disabled={!type.available}>
                    {broken(`${t(`blend.entity.${type.id}`)}${type.available ? '' : t('blend.entity.comingSoon')}`, 16, 12)}
                </option>
            ))}
        </>
    )
}

export const albumsText = (series: Series): string => tPlural('blend.series.albums', albumCountOf(series), { count: albumCountOf(series) })

interface Props {
    visit: BlendVisit
    chosen: Series | null
    onChoose: (series: Series) => void
    onEntity: (entity: string) => void
}

export function SeriesStep({ visit, chosen, onChoose, onEntity }: Props) {
    const box = useRef<HTMLDivElement>(null)
    // a series chosen by the address may be below what shows: the list scrolls to it, once
    useLayoutEffect(() => {
        if (!visit.reveal) return
        const card = box.current?.querySelector<HTMLElement>('.blend-series-card[aria-pressed="true"]')
        if (!card) return
        visit.reveal = false
        card.scrollIntoView({ block: 'nearest' })
    })
    return (
        <div id="blend-series-selector" ref={box}>
            <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-muted">{t('blend.entity.label')}</label>
                <select id="blend-entity-select" className="w-full bg-surface/60 border border-white/10 rounded-lg px-4 py-3 focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-all" defaultValue="albums" onChange={(event) => onEntity(event.target.value)}>
                    <EntityOptions />
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium mb-3 text-muted">{t('blend.series.label')}</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {visit.loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-400 border-t-transparent"></div>
                        </div>
                    ) : visit.series.length === 0 ? (
                        <p className="text-muted text-center py-4">{t('blend.series.none')}</p>
                    ) : visit.series.map(series => (
                        <SeriesCard key={series.id} series={series} covers={visit.coversOf(series)} isSelected={chosen?.id === series.id} onChoose={() => onChoose(series)} />
                    ))}
                </div>
            </div>
        </div>
    )
}

function SeriesCard({ series, covers, isSelected, onChoose }: { series: Series; covers: Array<string | null>; isSelected: boolean; onChoose: () => void }) {
    return (
        <div
            className={`blend-series-card group cursor-pointer p-4 rounded-lg border transition-all duration-200 ${isSelected ? 'border-orange-400 bg-orange-400/10 ring-1 ring-orange-400' : 'border-white/10 bg-white/5 hover:border-orange-400/50 hover:bg-white/10'}`}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            data-series-id={series.id}
            onClick={onChoose}
            onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return
                event.preventDefault()
                onChoose()
            }}
        >
            <div className="flex items-center gap-3">
                <AlbumCascade thumbnails={covers} />
                <div className="flex-1 min-w-0">
                    {/* the name with its entities as the hand-made card wrote it: «Rush &amp; Friends» shows as it is stored (a defect kept) */}
                    <h4 className={`font-medium truncate ${isSelected ? 'text-orange-400' : ''}`}>{series.name}</h4>
                    <p className="text-xs text-muted">{albumsText(series)}</p>
                </div>
                {isSelected ? <div className="text-orange-400"><Icon name="Check" className="w-5 h-5" /></div> : null}
            </div>
        </div>
    )
}
