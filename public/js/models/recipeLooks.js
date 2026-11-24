/**
 * recipeLooks - how a recipe card of the blend looks (F83 wave 7a): the icon and the colors of each recipe, the class of its badge and the
 * class of the card. Pure: no text (the names, descriptions and badges are the dictionary's, by the id of the recipe), no drawing.
 *
 * Every class is written whole, here, so that Tailwind finds it in the source (the hand-made card put the two colors together with a «/10» at run time
 * and needed a safelist for it). A recipe the table does not know gets the music note and gray.
 */

/** id of a recipe -> the icon of its card and the colors of its gradient (`from`, `to`) and the same two at 10 % (`fromTint`, `toTint`). */
const LOOKS = Object.freeze({
    // Recommended: golden gradient
    'mjrp-balanced-cascade': { icon: 'Sparkles', from: 'from-amber-400', to: 'to-orange-500', fromTint: 'from-amber-400/10', toTint: 'to-orange-500/10' },
    // Top N (curated selection)
    'top-n-popular': { icon: 'TrendingUp', from: 'from-green-500', to: 'to-emerald-600', fromTint: 'from-green-500/10', toTint: 'to-emerald-600/10' }, // Spotify green
    'top-n-acclaimed': { icon: 'Award', from: 'from-rose-500', to: 'to-orange-500', fromTint: 'from-rose-500/10', toTint: 'to-orange-500/10' }, // BestEverAlbums red and orange
    'top-n-user': { icon: 'User', from: 'from-sky-500', to: 'to-blue-600', fromTint: 'from-sky-500/10', toTint: 'to-blue-600/10' }, // the person's blue
    // F92: the recipes made of blocks
    'deep-cuts': { icon: 'Compass', from: 'from-violet-500', to: 'to-purple-600', fromTint: 'from-violet-500/10', toTint: 'to-purple-600/10' }, // digging past the hits
    'least-played': { icon: 'Search', from: 'from-teal-500', to: 'to-cyan-600', fromTint: 'from-teal-500/10', toTint: 'to-cyan-600/10' } // the opposite of the top
})

const UNKNOWN = Object.freeze({ icon: 'Music', from: 'from-gray-500', to: 'to-gray-600', fromTint: 'from-gray-500/10', toTint: 'to-gray-600/10' })

/**
 * @param {string} id - id of the recipe
 * @returns {{ icon: string, from: string, to: string, fromTint: string, toTint: string }}
 */
export const recipeLooksOf = (id) => LOOKS[id] || UNKNOWN

/**
 * The class of the little label on a card: amber for the recommended one, then by the code the recipe carries.
 * @param {{ badge?: string, isRecommended?: boolean }} recipe
 * @returns {string}
 */
export function badgeClassOf({ badge, isRecommended }) {
    if (isRecommended) return 'bg-amber-400/20 text-amber-400 font-bold'
    if (badge === 'SPOTIFY') return 'bg-green-500/20 text-green-400 font-semibold'
    if (badge === 'BEA') return 'bg-rose-500/20 text-rose-400 font-semibold'
    if (badge === 'TOP 3') return 'bg-orange-500/20 text-orange-400'
    if (badge === 'TOP 5') return 'bg-blue-500/20 text-blue-400'
    return 'bg-gray-500/20 text-gray-400'
}

/**
 * The class of a card by its state: the chosen one has the ring and the gradient of its recipe, the recommended one that is not chosen is amber.
 * @param {{ isSelected: boolean, isRecommended: boolean }} state
 * @param {ReturnType<typeof recipeLooksOf>} looks
 * @returns {string}
 */
export function cardClassOf({ isSelected, isRecommended }, looks) {
    if (isSelected) return `border-amber-400 bg-gradient-to-br ${looks.fromTint} ${looks.toTint} ring-2 ring-orange-400 shadow-lg shadow-orange-400/20`
    if (isRecommended) return 'border-amber-400/40 bg-gradient-to-br from-amber-900/10 to-orange-900/5 hover:border-amber-400/60'
    return 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
}

/**
 * The recipes of the registry (algorithms/index.js `getAllAlgorithms()`) as the cards take them: in the order of the registry, with what a
 * card needs besides the words.
 * @param {Array<{ id: string, badge?: string, isRecommended?: boolean }>} algorithms
 * @returns {Array<{ id: string, badge?: string, isRecommended: boolean, looks: ReturnType<typeof recipeLooksOf> }>}
 */
export const recipesOf = (algorithms) => algorithms.map(({ id, badge, isRecommended }) => ({ id, badge, isRecommended: Boolean(isRecommended), looks: recipeLooksOf(id) }))
