/**
 * Icons.js
 * Centralized registry of SVG icons (Lucide style)
 * Replaces emojis with professional vector graphics.
 *
 * F83 (TASK-06): the drawings are data now (utils/iconShapes.js), shared with the React `<Icon>` (ui/Icon.tsx); this file
 * makes the same text as before from that data. The text of each icon is the string it had, byte for byte
 * (test/ui/Icon.test.tsx), but for MJRPLogo, which no screen uses and lost its comments and the white space between its elements.
 */
import { ICON_SHAPES, iconMarkup } from '../utils/iconShapes.js'

/** Every icon as text, by name. */
export const Icons = Object.fromEntries(Object.keys(ICON_SHAPES).map(name => [name, iconMarkup(name)]))

/**
 * Helper to render an icon with optional class
 * @param {string} name - Icon name key
 * @param {string} className - Optional CSS class
 * @returns {string} SVG HTML string
 */
export function getIcon(name, className = '') {
  return iconMarkup(name, className)
}
