/**
 * Icon - the site's icons for a React screen (F83, TASK-06; proposal § 4.4).
 *
 * The same drawings the hand-made screens use (utils/iconShapes.js), made as
 * elements: a real <svg> with its children, and no raw HTML anywhere (the lint refuses it in React screens). The HTML it
 * gives is the one the string icons gave: test/ui/Icon.test.tsx proves it for every icon.
 */
import { createElement, type ReactNode } from 'react'
import { ICON_SHAPES } from '../utils/iconShapes.js'

type Attributes = Record<string, string>
type IconNode = string | { t: string; a: Attributes; c?: IconNode[] }

/** `stroke-width` → `strokeWidth`, `class` → `className`: React writes them back as the same attributes. */
function reactName(name: string): string {
    if (name === 'class') return 'className'
    if (name.startsWith('aria-') || name.startsWith('data-') || name === 'xmlns') return name
    return name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())
}

const reactProps = (attrs: Attributes): Attributes => Object.fromEntries(Object.entries(attrs).map(([name, value]) => [reactName(name), value]))

function drawNode(node: IconNode, key: number): ReactNode {
    if (typeof node === 'string') return node
    return createElement(node.t, { key, ...reactProps(node.a) }, ...(node.c ?? []).map(drawNode))
}

export function Icon({ name, className = '' }: { name: string; className?: string }) {
    const shape = (ICON_SHAPES as Record<string, { a: Attributes; n: IconNode[] } | undefined>)[name]
    if (!shape) return null
    // the class goes first, as getIcon puts it, so the attributes come out in the same order
    const root = className ? { class: className, ...shape.a } : shape.a
    return createElement('svg', reactProps(root), ...shape.n.map(drawNode))
}
