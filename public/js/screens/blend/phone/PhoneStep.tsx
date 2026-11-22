/**
 * Step 1 of the Blend on the phone, and its bar (F83 wave 7b; the port of components/blend/BlendSeriesPhonePicker.js and the bar of views/BlendingMenuView.js,
 * F76 REQ-10): the series are reached without a box that scrolls inside the page. The page shows one row (the series chosen, or «Choose a series») and a tap
 * opens a full sheet with a search field and every series; a tap on one closes the sheet FIRST and then chooses it (the next thing that opens is never under
 * the sheet). The Blend takes ONE series, so the sheet is a single choice. «Blend it!» stays in an action bar, off while a step is missing, with the note
 * saying which. The sheet is ui/SheetWindow.tsx; what is inside is React. Styles: public/css/mobile/blend.css.
 *
 * The search is read from the `input` event of the field itself (the field is not controlled: React's `onChange` does not hear a value written by a script).
 */
import { useState } from 'react'
import { Icon } from '../../../ui/Icon'
import { AlbumCascade } from '../../../ui/AlbumCascade'
import { useSheetWindow } from '../../../ui/SheetWindow'
import { t, tPlural } from '../../../i18n/t.js'
import { decodeEntities } from '../../../models/text.js'
import { EntityOptions, albumsText } from '../SeriesStep'
import type { BlendVisit } from '../blendVisit'
import type { Series } from '../types'

const nameOf = (series: Series): string => decodeEntities(series.name || '') || t('blend.phone.untitled')

interface StepProps {
    visit: BlendVisit
    chosen: Series | null
    onChoose: (series: Series) => void
    onEntity: (entity: string) => void
}

export function PhoneStep({ visit, chosen, onChoose, onEntity }: StepProps) {
    const sheet = useSheetWindow()
    const count = visit.series.length
    const meta = visit.loading ? t('blend.phone.loading') : count === 0 ? t('blend.phone.noSeries') : chosen ? albumsText(chosen) : t('blend.phone.toChoose', { count })
    const open = () => {
        if (sheet.isOpen()) return
        sheet.show({
            variant: 'full',
            title: t('blend.phone.choose'),
            closeLabel: t('blend.sheet.close'),
            render: (close) => <SeriesList visit={visit} chosen={chosen} onPick={(series) => { close(); onChoose(series) }} />
        })
    }
    return (
        <div id="blend-series-selector">
            <div className="blend-entity">
                <label htmlFor="blend-entity-select" className="blend-entity__label">{t('blend.entity.label')}</label>
                <select id="blend-entity-select" className="w-full bg-surface/60 border border-white/10 rounded-lg px-4 py-3" defaultValue="albums" onChange={(event) => onEntity(event.target.value)}>
                    <EntityOptions />
                </select>
            </div>
            <p className="blend-pick__label">{t('blend.phone.seriesLabel')}</p>
            <button type="button" id="blend-series-pick" className={`blend-pick${chosen ? ' is-chosen' : ''}`} disabled={visit.loading || count === 0} onClick={open}>
                {chosen ? <AlbumCascade thumbnails={visit.coversOf(chosen)} /> : <span className="blend-pick__icon"><Icon name="Layers" className="w-6 h-6" /></span>}
                <span className="blend-pick__text">
                    <span className="blend-pick__title">{chosen ? nameOf(chosen) : t('blend.phone.choose')}</span>
                    <span className="blend-pick__meta">{meta}</span>
                </span>
                <span className="blend-pick__action">{chosen ? t('blend.phone.actionChange') : t('blend.phone.actionChoose')}</span>
            </button>
            {sheet.layer}
        </div>
    )
}

/** What is inside the sheet: the search, the line that says how many, and the list. The search is kept while the covers arrive and the list is drawn again. */
function SeriesList({ visit, chosen, onPick }: { visit: BlendVisit; chosen: Series | null; onPick: (series: Series) => void }) {
    const [query, setQuery] = useState('')
    const words = query.trim().toLowerCase()
    const all = visit.series
    const shown = words ? all.filter(series => nameOf(series).toLowerCase().includes(words)) : all
    return (
        <>
            <div className="blend-sheet__search-wrap">
                <input type="search" className="blend-sheet__search" placeholder={t('blend.sheet.search')} aria-label={t('blend.sheet.search')} autoComplete="off" onInput={(event) => setQuery(event.currentTarget.value)} />
            </div>
            <p className="blend-sheet__status" role="status" aria-live="polite">{words ? t('blend.sheet.countOf', { shown: shown.length, all: all.length }) : tPlural('blend.sheet.count', all.length, { count: all.length })}</p>
            <div className="blend-sheet__list" role="list">
                {shown.length === 0 ? <p className="blend-sheet__empty">{t('blend.sheet.empty')}</p> : shown.map(series => {
                    const isChosen = series.id === chosen?.id
                    return (
                        <button key={series.id} type="button" role="listitem" className={`blend-sheet__row${isChosen ? ' is-chosen' : ''}`} aria-pressed={isChosen} data-series-id={series.id} onClick={() => onPick(series)}>
                            <AlbumCascade thumbnails={visit.coversOf(series)} />
                            <span className="blend-sheet__text">
                                <span className="blend-sheet__name">{nameOf(series)}</span>
                                <span className="blend-sheet__meta">{albumsText(series)}</span>
                            </span>
                            {isChosen ? <span className="blend-sheet__check" aria-hidden="true"><Icon name="Check" className="w-5 h-5" /></span> : null}
                        </button>
                    )
                })}
            </div>
        </>
    )
}

/** The action bar of the phone: the note (the step that is missing, or what will be blended) and «Blend it!». */
/** `drawn` counts the times the hand-made bar was written anew (each choice, each step of the slider, the start and the end of a generation): the note and the button are new elements each time. */
export function PhoneBar({ drawn, note, ready, generating, onGenerate }: { drawn: number; note: string; ready: boolean; generating: boolean; onGenerate: () => void }) {
    return (
        <div id="blend-phone-bar" className="phone-action-bar blend-bar md:hidden">
            <span key={`note${drawn}`} className="phone-action-bar__note blend-bar__note" role="status" aria-live="polite">{note}</span>
            <button key={`button${drawn}`} type="button" id="blend-bar-btn" className="btn btn-primary blend-bar__btn" disabled={!ready || generating} aria-busy={generating ? 'true' : undefined} onClick={onGenerate}>
                {generating ? t('blend.bar.busy') : t('blend.bar.button')}
            </button>
        </div>
    )
}
