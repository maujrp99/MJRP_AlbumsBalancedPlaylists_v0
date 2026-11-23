/**
 * StopIcon - the icon above each label of the bottom menu (F88; F83 sync of main): the home's own drawing (public/splash/phoneBar.js, which the
 * static home page uses as a string), made as elements: a real <svg> with its children, no raw HTML (the lint refuses it in React).
 */
import { createElement, type ReactNode } from 'react'
import { stopIcon } from '../../splash/phoneBar.js'

/** `stroke-width` → `strokeWidth`, `class` → `className`: React writes them back as the same attributes. */
const reactName = (name: string): string => (name === 'class' ? 'className' : name.startsWith('aria-') || name === 'xmlns' ? name : name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase()))

function drawNode(node: Element, key: number): ReactNode {
    const props: Record<string, string | number> = { key }
    for (const attribute of Array.from(node.attributes)) props[reactName(attribute.name)] = attribute.value
    return createElement(node.tagName.toLowerCase(), props, ...Array.from(node.children).map(drawNode))
}

const drawn = new Map<string, ReactNode>()

export function StopIcon({ id }: { id: string }) {
    if (!drawn.has(id)) {
        const markup = stopIcon(id) as string
        const root = markup ? new DOMParser().parseFromString(markup, 'image/svg+xml').documentElement : null
        drawn.set(id, root && root.tagName === 'svg' ? drawNode(root, 0) : null)
    }
    return <>{drawn.get(id)}</>
}
