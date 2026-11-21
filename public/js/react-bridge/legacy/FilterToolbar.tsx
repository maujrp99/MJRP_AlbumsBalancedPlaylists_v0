/**
 * LegacyFilterToolbar - the search, filter and sort bar of the lists (components/ui/FilterToolbar.js and FilterSheet.js) inside
 * a React screen (F83 wave 1; proposal § 4.2, rule 2). TEMPORARY: it goes when the last hand-made screen that uses the bar
 * (the albums screen, wave 5) is in React; each screen that uses it is listed in test/architecture/bridgesOnlyShrink.test.js.
 *
 * Why the old piece and not a port: the bar is also on the albums screen, which is hand-made and loads in the main script;
 * a React port there would have to call React, and the main script must not (the site's first load downloads no React until
 * the shell is React, wave 3; test/architecture and scripts/bundle-budget.mjs hold it). One source, so one piece: the old one.
 *
 * It does what the hand-made screen did: one box, the toolbar built in it once (its search field is one element for as long
 * as the screen lives, UAT-179), `update(props)` on every draw (the toolbar redraws only the controls whose picture changed),
 * and the toolbar taken down when the screen goes. Its own texts («Search...», «Refresh», «Filters») are the old piece's and
 * stay in English until it is ported; the texts the screen gives it (titles, labels, options) come from the dictionary.
 */
import { useLayoutEffect, useRef } from 'react'
import FilterToolbar from '../../components/ui/FilterToolbar.js'

export interface FilterOption {
    value: string
    label: string
}

export interface FilterGroupProps {
    id: string
    title?: string
    label: string
    value: string
    options: FilterOption[]
    onChange: (value: string) => void
    icon?: string
}

export interface FilterToolbarProps {
    searchQuery: string
    onSearch: (value: string) => void
    sortOptions: FilterOption[]
    currentSort: string
    onSort: (value: string) => void
    filtersInSheet?: boolean
    sheetText?: { reload: string; done: string }
    filterGroups: FilterGroupProps[]
    onRefresh?: () => void
}

interface Toolbar {
    mount: () => void
    update: (props: FilterToolbarProps) => void
    unmount: () => void
}

export function LegacyFilterToolbar({ toolbar }: { toolbar: FilterToolbarProps }) {
    const box = useRef<HTMLDivElement>(null)
    const built = useRef<Toolbar | null>(null)
    const latest = useRef(toolbar)
    latest.current = toolbar

    useLayoutEffect(() => {
        const element = box.current
        if (!element) return undefined
        const bar: Toolbar = new FilterToolbar({ container: element, props: latest.current })
        bar.mount()
        built.current = bar
        return () => {
            built.current = null
            bar.unmount()
        }
    }, [])

    // every draw after the first hands the toolbar what the screen shows now
    useLayoutEffect(() => {
        built.current?.update(toolbar)
    })

    return <div ref={box} />
}
