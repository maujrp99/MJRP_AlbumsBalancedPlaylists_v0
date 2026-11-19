/**
 * The switch of the debug routes (F59).
 *
 * The debug routes (list of AI models, raw ranking, listing of files, imports) and the raw stage
 * of /api/generate show the inside of the server and spend the paid AI key. They are OFF unless
 * the environment turns them on by name, with ENABLE_DEBUG_ROUTES=true. No other value turns
 * them on, and NODE_ENV does not: a deploy that forgets a variable must end closed, not open.
 */
function debugRoutesEnabled (env) {
  return !!env && env.ENABLE_DEBUG_ROUTES === 'true'
}

module.exports = { debugRoutesEnabled }
