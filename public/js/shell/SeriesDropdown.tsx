/**
 * SeriesDropdown - the menu of the kinds of series in the top bar (F83 wave 3; was components/navigation/SeriesDropdown.js).
 * An entity that exists is a link of the app; one that is not there yet shows «Soon» and is not a link, so a click goes nowhere (F63).
 * It opens with a click on its button and closes with a click on one of its links or anywhere outside it.
 */
import { useEffect, useRef, useState } from 'react'
import { Icon } from '../ui/Icon'
import { t } from '../i18n/t.js'

interface Entity {
    labelKey: string
    route: string
    icon: string
    available: boolean
}

const ENTITIES: Array<Entity | 'separator'> = [
    { labelKey: 'shell.series.byAlbum', route: '/albums', icon: 'Disc', available: true },
    { labelKey: 'shell.series.byArtist', route: '/artists', icon: 'User', available: false },
    { labelKey: 'shell.series.byGenre', route: '/genres', icon: 'Music', available: false },
    { labelKey: 'shell.series.byTrack', route: '/tracks', icon: 'ListMusic', available: false },
    'separator',
    { labelKey: 'shell.series.playlists', route: '/playlist-series', icon: 'List', available: true }
]

const real = (entry: Entity | 'separator'): entry is Entity => entry !== 'separator'

/** The entity the address belongs to, if any: the first whose route the address begins with. */
const activeEntity = (path: string): Entity | undefined => ENTITIES.filter(real).find(entity => path.startsWith(entity.route))

function Link({ entity, path, onClick }: { entity: Entity; path: string; onClick: () => void }) {
    const isActive = path.startsWith(entity.route)
    const tone = isActive ? 'text-accent-primary bg-white/10' : 'text-muted hover:text-white hover:bg-white/5'
    return (
        <a href={entity.route} className={`flex items-center gap-3 px-4 py-2 text-sm transition-all duration-200 ${tone}`} data-link="" onClick={onClick}>
            <Icon name={entity.icon} className="w-4 h-4" />
            <span className="flex-1">{t(entity.labelKey)}</span>
            {isActive ? <Icon name="Check" className="w-4 h-4 text-accent-primary" /> : null}
        </a>
    )
}

function Soon({ entity }: { entity: Entity }) {
    return (
        <span role="link" aria-disabled="true" className="flex items-center gap-3 px-4 py-2 text-sm text-muted/50 cursor-not-allowed">
            <Icon name={entity.icon} className="w-4 h-4" />
            <span className="flex-1">{t(entity.labelKey)}</span>
            <span className="text-xs text-muted/50">{t('shell.series.soon')}</span>
        </span>
    )
}

export function SeriesDropdown({ path }: { path: string }) {
    const [isOpen, setOpen] = useState(false)
    const box = useRef<HTMLDivElement>(null)
    const active = activeEntity(path)

    // A click anywhere outside the menu closes it
    useEffect(() => {
        const outside = (event: MouseEvent) => {
            if (box.current && !box.current.contains(event.target as Node)) setOpen(false)
        }
        document.addEventListener('click', outside)
        return () => document.removeEventListener('click', outside)
    }, [])

    return (
        <div className="relative" id="seriesDropdownContainer" ref={box}>
            <button
                id="seriesDropdownBtn"
                className={`nav-link-glow text-xs font-semibold uppercase tracking-wide px-2.5 py-1.5 rounded-lg transition-all duration-300 flex items-center gap-1 whitespace-nowrap ${active ? 'text-accent-primary bg-white/5' : 'text-muted'}`}
                // the click stops here: the hand-made button did the same, so nothing else listening to the page hears it
                onClick={(event) => { event.stopPropagation(); setOpen(open => !open) }}
            >
                {` ${active ? t(active.labelKey) : t('shell.series.label')} `}
                <Icon name="ChevronDown" className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <div
                id="seriesDropdownMenu"
                className={`absolute top-full left-0 mt-2 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-xl py-2 transition-all duration-200 ${isOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}
            >
                {ENTITIES.map((entity, index) => {
                    if (!real(entity)) return <div key={index} className="border-t border-white/10 my-2" />
                    return entity.available ? <Link key={entity.route} entity={entity} path={path} onClick={() => setOpen(false)} /> : <Soon key={entity.route} entity={entity} />
                })}
            </div>
        </div>
    )
}
