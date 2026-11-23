/**
 * The header of the albums screen (F83 wave 5a; the port of components/series/SeriesHeader.js): the breadcrumb, the title (all the series,
 * or the name of the one on screen), the «⋯» of the series on the phone, and the button to blend. The button moves to the Blend screen
 * from the press itself, with the series on screen when there is one.
 */
import { t } from '../../i18n/t.js'
import { Breadcrumb, albumsTrail } from '../../ui/Breadcrumb'
import { Icon } from '../../ui/Icon'

export interface HeaderProps {
    title: string
    /** The series on screen; null for all of them. */
    seriesId: string | null
    onNavigate: (path: string) => void
    onBlend: () => void
    onMore: (seriesId: string) => void
}

export function Header({ title, seriesId, onNavigate, onBlend, onMore }: HeaderProps) {
    return (
        <div className={`series-page-header ${seriesId ? 'series-page-header--single' : 'series-page-header--all'} view-header mb-8 fade-in`}>
            <Breadcrumb crumbs={albumsTrail()} onNavigate={onNavigate} />
            <div className="header-title-row mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl md:text-4xl font-bold flex items-center gap-3"><Icon name="Disc" className="w-8 h-8 text-accent-primary" />{title}</h1>
                {seriesId ? (
                    <button type="button" className="series-more md:hidden" aria-label={t('albums.series.more', { name: title })} data-action="series-more" data-series-id={seriesId} onClick={(event) => { event.preventDefault(); event.stopPropagation(); onMore(seriesId) }}>
                        <svg className="series-more__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>
                    </button>
                ) : null}
                <button type="button" id="generatePlaylistsBtn" className="tech-btn-primary w-full md:w-auto justify-center px-8 py-3 text-base rounded-2xl flex items-center gap-2 hover:scale-105 transition-transform mt-4 md:mt-0" onClick={onBlend}>
                    <Icon name="Sliders" className="w-5 h-5" />{t('albums.blend')}
                </button>
            </div>
        </div>
    )
}
