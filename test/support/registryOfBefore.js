/**
 * The registry of recipes as it was when the pictures of the hand-made screens were taken (test/fixtures/blendBeforeF83.json,
 * regenerateBeforeF83.json): the four recipes, without the two that F92 added («Deep cuts», «Least played»). The tests «same as before»
 * compare a page with those pictures, so they draw it with the recipes of then; the new cards are proven by their own tests
 * (test/algorithms/blockRecipes.test.js, test/ui/recipe/Ingredients.test.tsx) and in the browser (reports/evidence/F92/).
 *
 * Use: vi.mock('<path>/public/js/algorithms/index.js', async (importOriginal) => registryOfBefore(await importOriginal()))
 */
export const ADDED_BY_F92 = Object.freeze(['deep-cuts', 'least-played'])

export function registryOfBefore(real) {
    return { ...real, getAllAlgorithms: () => real.getAllAlgorithms().filter(recipe => !ADDED_BY_F92.includes(recipe.id)) }
}
