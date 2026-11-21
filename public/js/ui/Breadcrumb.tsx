/**
 * Breadcrumb - the trail at the top of a screen (Start › Blend › Playlists), as a React piece (F83 wave 2). The same HTML and
 * classes as components/Breadcrumb.js, which stays for the hand-made screens that still draw their own until they move.
 * The last step is the screen itself; every other one is a link. A trail of one step draws nothing.
 */
import { Fragment } from 'react'
import { t } from '../i18n/t.js'

export interface Crumb {
    label: string
    path: string
}

/** The trail of the playlists screen: a set that comes from the blend, or a saved batch being edited. */
export function playlistsTrail(editing: boolean): Crumb[] {
    return [
        { label: t('ui.breadcrumb.start'), path: '/start' },
        editing ? { label: t('ui.breadcrumb.savedPlaylists'), path: '/saved-playlists' } : { label: t('ui.breadcrumb.blend'), path: '/blend' },
        { label: editing ? t('ui.breadcrumb.editBatch') : t('ui.breadcrumb.playlists'), path: '/playlists' }
    ]
}

export function Breadcrumb({ crumbs, onNavigate }: { crumbs: Crumb[]; onNavigate: (path: string) => void }) {
    if (crumbs.length <= 1) return null
    return (
        <nav className="breadcrumb" aria-label={t('ui.breadcrumb.label')}>
            {crumbs.map((crumb, index) => (
                index === crumbs.length - 1
                    ? <span key={crumb.path} className="breadcrumb-current">{crumb.label}</span>
                    : (
                        <Fragment key={crumb.path}>
                            <a
                                href={crumb.path}
                                className="breadcrumb-link"
                                data-path={crumb.path}
                                onClick={(event) => { event.preventDefault(); onNavigate(crumb.path) }}
                            >{` ${crumb.label} `}</a>
                            {' '}
                            <span className="breadcrumb-separator">›</span>
                            {' '}
                        </Fragment>
                    )
            ))}
        </nav>
    )
}
