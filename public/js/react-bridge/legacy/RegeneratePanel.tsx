/**
 * LegacyRegeneratePanel - the panel «Reconfigure your Music Playlist Blend» (components/playlists/RegeneratePanel.js) inside a React
 * screen (F83 wave 2; proposal § 4.2, rule 2). TEMPORARY: the panel is also used by the Blend controller (controllers/BlendingController.js,
 * which is in the main script), so it is ported with the Blend screen (wave 7); each screen that uses it is in the list of
 * test/architecture/bridgesOnlyShrink.test.js.
 *
 * The box is React's. What is inside is the old panel's: its HTML is written in by hand and its recipe card and ingredients panel are
 * mounted into it by the old code, and React never touches it. The panel is written again only when what it is made from changes
 * (the playlists on screen, the series, the batch name), not when the screen is drawn for another reason (a letter typed in the name
 * field): the recipe the person changed and did not generate yet is kept by the old panel (`pending`) through every redraw.
 * Opening and closing it, and the generate button, are heard here (the old view heard them); the rest is the old panel's.
 */
import { useLayoutEffect, useRef } from 'react'
import { RegeneratePanel } from '../../components/playlists/RegeneratePanel.js'

export interface RegenerateProps {
    seriesId?: string
    batchName: string
    ids: string[]
    count: number
    generatedWith: object | null
    /** Called with the recipe in the panel when the generate button is pressed. */
    onRegenerate: (config: object) => void
}

/** The panel opens on the recipe of the playlists of the screen that opens (no change of a former visit is kept). */
export const resetRegeneratePanel = (): void => RegeneratePanel.reset()

/** Opens the panel if it is shut, and brings it into view (the phone asks for it from the «⋯» of a playlist). */
export function showRegeneratePanel(root: HTMLElement | null): void {
    const panel = root?.querySelector<HTMLElement>('.regenerate-panel')
    if (!panel) return
    if (panel.querySelector('.regenerate-content')?.classList.contains('hidden')) {
        panel.querySelector<HTMLElement>('[data-action="toggle-regenerate-panel"]')?.click()
    }
    panel.scrollIntoView({ block: 'start' })
}

export function LegacyRegeneratePanel({ seriesId, batchName, ids, count, generatedWith, onRegenerate }: RegenerateProps) {
    const box = useRef<HTMLDivElement>(null)
    const expanded = useRef(false)
    const asked = useRef(onRegenerate)
    asked.current = onRegenerate
    const made = JSON.stringify({ seriesId, batchName, ids, count, generatedWith })

    useLayoutEffect(() => {
        if (!box.current) return
        box.current.innerHTML = RegeneratePanel.render({ seriesId: seriesId ?? '', batchName, existingPlaylistIds: ids, count, generatedWith, expanded: expanded.current })
        RegeneratePanel.mount()
        // eslint-disable-next-line react-hooks/exhaustive-deps -- `made` says whether any of the values changed
    }, [made])

    const onClick = (event: React.MouseEvent<HTMLDivElement>) => {
        const target = event.target as HTMLElement
        if (target.closest('[data-action="toggle-regenerate-panel"]')) {
            const content = box.current?.querySelector('.regenerate-content')
            content?.classList.toggle('hidden')
            box.current?.querySelector('.regenerate-chevron')?.classList.toggle('rotate-180')
            expanded.current = !content?.classList.contains('hidden')
        } else if (target.closest('[data-action="regenerate-playlists"]')) {
            asked.current(RegeneratePanel.getConfig())
        }
    }

    return <div ref={box} id="regeneratePanelMount" className="mb-6 fade-in" style={{ animationDelay: '0.05s' }} onClick={onClick} />
}
