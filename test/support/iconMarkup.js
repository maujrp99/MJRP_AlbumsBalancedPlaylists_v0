/**
 * The text form of the site's icons (F83, wave 8d): what components/Icons.js `getIcon()` made for the hand-made screens, from the same data
 * (utils/iconShapes.js) the React `<Icon>` draws. No screen uses it any more (the last user, the dead `btn` branch of the Apple Music export,
 * went with wave 8d); it stays here as the yardstick test/ui/Icon.test.tsx holds `<Icon>` against, icon by icon, with the strings of before
 * (test/fixtures/iconMarkupBeforeF83.json).
 */
import { ICON_SHAPES } from '../../public/js/utils/iconShapes.js'

const attributes = (attrs) => Object.entries(attrs).map(([name, value]) => ` ${name}="${value}"`).join('')

function nodeMarkup(node) {
    if (typeof node === 'string') return node
    const open = `<${node.t}${attributes(node.a)}`
    return node.c?.length ? `${open}>${node.c.map(nodeMarkup).join('')}</${node.t}>` : `${open}/>`
}

/** The SVG text of an icon, with an optional class on the root (the class comes first, as it always did); '' for a name that is not an icon. */
export function iconMarkup(name, className = '') {
    const shape = ICON_SHAPES[name]
    if (!shape) return ''
    const root = `<svg${className ? ` class="${className}"` : ''}${attributes(shape.a)}>`
    return `${root}${shape.n.map(nodeMarkup).join('')}</svg>`
}

export const getIcon = iconMarkup

/** Every icon as text, by name. */
export const Icons = Object.fromEntries(Object.keys(ICON_SHAPES).map(name => [name, iconMarkup(name)]))
