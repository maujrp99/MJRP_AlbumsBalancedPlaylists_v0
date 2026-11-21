/**
 * The playlists side by side on the computer (F83 wave 2; it was components/playlists/PlaylistGrid.js and the part of
 * PlaylistsGridRenderer.js that drew the grid): a card per playlist, with its title (typed over in place), its totals, the button
 * that deletes it and its tracks. The tracks of a card are the rows the drag and drop moves (react-bridge/sortableTracks.ts).
 */
import { useLayoutEffect, useRef, type KeyboardEvent } from 'react'
import { Icon } from '../../ui/Icon'
import { TrackRow, formatTrackDuration, type RowAction } from '../../ui/TrackRow'
import { t } from '../../i18n/t.js'
import { playlistNameOf } from './text'
import type { Playlist, PlaylistActions } from './types'

/** The scrollbar of the list of tracks of a card, one set of rules per card (the class carries the number of the card). */
const scrollbarRules = (index: number): string => `
    .custom-scrollbar-${index}::-webkit-scrollbar {
        width: 6px;
    }
    .custom-scrollbar-${index}::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
    }
    .custom-scrollbar-${index}::-webkit-scrollbar-thumb {
        background: rgba(249, 115, 22, 0.3); /* brand-orange with opacity */
        border-radius: 4px;
    }
    .custom-scrollbar-${index}::-webkit-scrollbar-thumb:hover {
        background: rgba(249, 115, 22, 0.6);
    }
`

/**
 * The title of a playlist, a field to type over (a span that can be edited, on the card and on the phone). What is typed is taken
 * when the field loses the focus: Enter ends the edit, Escape gives it up. React does not hold the text of the field (the person
 * is typing in it): the text is put in when the title changes, never while the person is writing, so no draw of the screen
 * (a store that changed) takes away what was typed.
 */
export function EditableTitle({ index, title, className, onRename }: { index: number; title: string; className?: string; onRename: (index: number, title: string) => void }) {
    const field = useRef<HTMLSpanElement>(null)
    const shown = useRef<string | null>(null)
    const original = useRef<string | null>(null)

    useLayoutEffect(() => {
        if (field.current && shown.current !== title) {
            field.current.textContent = title
            shown.current = title
        }
    }, [title])

    const end = () => {
        const element = field.current
        if (!element || original.current === null) return
        const before = original.current
        original.current = null
        const typed = (element.textContent ?? '').trim()
        if (typed && typed !== before.trim()) onRename(index, typed)
        else element.textContent = before // nothing to keep: the field shows the title again
    }

    const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault() // a title has one line
            field.current?.blur()
        } else if (event.key === 'Escape') {
            if (field.current && original.current !== null) field.current.textContent = original.current
            field.current?.blur()
        }
    }

    return (
        <span
            ref={field}
            className={className ?? 'playlist-name cursor-text hover:bg-white/5 focus:bg-white/10 rounded px-1 outline-none'}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-label={t('playlists.card.titleLabel', { n: index + 1 })}
            data-playlist-index={index}
            spellCheck={false}
            onFocus={() => { original.current = field.current?.textContent ?? '' }}
            onBlur={end}
            onKeyDown={onKeyDown}
        />
    )
}

function PlaylistCard({ playlist, index, batchName, actions }: { playlist: Playlist; index: number; batchName: string; actions: PlaylistActions }) {
    const tracks = playlist.tracks || []
    const title = playlistNameOf(playlist, index)
    // the ranking this playlist is read by: its own recipe says, else the grid's (the blend of acclaim and the artists' own)
    const rankingId = playlist._meta?.rankingId
    const primaryRanking = rankingId && rankingId === 'spotify' ? 'spotify' : 'acclaim'
    const prefix = batchName ? `${index + 1}. ${batchName} - ` : `${index + 1}. `
    const total = formatTrackDuration(tracks.reduce((sum, track) => sum + (track.duration || 0), 0))
    return (
        <div className="playlist-card bg-surface rounded-xl border border-white/10 overflow-hidden" data-playlist-index={index}>
            <div className="playlist-header p-4 bg-white/5 border-b border-white/10 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold">
                        <span className="playlist-title-prefix text-muted">{prefix}</span>
                        <EditableTitle index={index} title={title} onRename={actions.renamePlaylist} />
                    </h3>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted">
                    <span className="flex items-center gap-1"><Icon name="Music" className="w-4 h-4" />{' '}{tracks.length}{' '}</span>
                    <span className="font-mono">{total}</span>
                    <button
                        type="button"
                        className="text-muted hover:text-red-400 p-1 rounded"
                        data-action="delete-playlist"
                        data-playlist-index={index}
                        aria-label={t('playlists.card.deleteLabel', { title })}
                        title={t('playlists.card.deleteTitle')}
                        onClick={() => actions.deletePlaylist(index)}
                    >
                        <Icon name="Trash2" className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <style>{scrollbarRules(index)}</style>
            <div className={`playlist-tracks custom-scrollbar-${index} p-3 space-y-2 max-h-[260px] overflow-y-auto md:max-h-none md:overflow-visible`} data-playlist-index={index}>
                {tracks.length === 0 ? <div className="text-center text-muted py-8">{t('playlists.card.noTracks')}</div> : tracks.map((track, trackIndex) => {
                    const remove: RowAction = { icon: 'X', label: t('playlists.card.removeTrack'), action: 'remove-track', class: 'text-muted hover:text-red-400 p-1', onSelect: () => actions.removeTrack(index, trackIndex) }
                    return <TrackRow key={trackIndex} track={track} index={trackIndex + 1} playlistIndex={index} trackIndex={trackIndex} primaryRanking={primaryRanking} draggable variant="compact" actions={[remove]} />
                })}
            </div>
        </div>
    )
}

export function PlaylistCards({ playlists, batchName, actions }: { playlists: Playlist[]; batchName: string; actions: PlaylistActions }) {
    if (playlists.length === 0) return null
    return (
        <div className="playlist-grid grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {playlists.map((playlist, index) => <PlaylistCard key={index} playlist={playlist} index={index} batchName={batchName} actions={actions} />)}
        </div>
    )
}
