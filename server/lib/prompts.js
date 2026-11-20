/**
 * The prompts the paid AI provider is asked with (config/prompts.json).
 *
 * A server without its prompts is a broken deploy, so it is said, loudly (F52, slice 5): the file
 * missing, unreadable, not JSON, or without one of the prompts a route needs makes `loadPrompts`
 * THROW a PromptsError. The server loads them when it starts (server/index.js), so it does not
 * start without them, and the deploy's smoke test stops there. Before, all of that became `{}`
 * with a line in the log, and the routes ran with no prompt.
 *
 * `requirePrompt(prompts, name)` is how a route reads one: a prompt that is not there is thrown
 * (the route's error path answers `internal`), never rendered as an empty text.
 */
const path = require('path')
const nodeFs = require('fs')

/** In the image the config folder is beside the app; in the repository it is one level up. */
const PROMPTS_PATHS = Object.freeze([
  path.join(__dirname, '..', 'config', 'prompts.json'),
  path.join(__dirname, '..', '..', 'config', 'prompts.json')
])
/** The prompts a route needs: without any of these the file is not usable. */
const REQUIRED_PROMPTS = Object.freeze(['albumSearchPrompt', 'rankingPrompt'])

class PromptsError extends Error {
  constructor (message) {
    super(`Could not load config/prompts.json: ${message}`)
    this.name = 'PromptsError'
  }
}

const isPrompt = (value) => typeof value === 'string' && value.trim() !== ''

/**
 * @param {Object} prompts - what loadPrompts gave
 * @param {string} name - e.g. 'rankingPrompt'
 * @returns {string} the template
 * @throws {PromptsError} when there is no such prompt
 */
function requirePrompt (prompts, name) {
  const template = prompts && prompts[name]
  if (!isPrompt(template)) throw new PromptsError(`it has no "${name}"`)
  return template
}

function parsed (raw, file) {
  try {
    return JSON.parse(raw)
  } catch (error) {
    throw new PromptsError(`${file} is not valid JSON (${error.message})`)
  }
}

function usable (prompts, file) {
  if (!prompts || typeof prompts !== 'object' || Array.isArray(prompts)) throw new PromptsError(`${file} is not an object of prompts`)
  REQUIRED_PROMPTS.forEach(name => requirePrompt(prompts, name))
  return prompts
}

/**
 * @param {Object} [options]
 * @param {Object} [options.fs] - { existsSync, readFileSync }
 * @param {string[]} [options.paths] - where the file may be; the first that exists is read
 * @returns {Function} loadPrompts() -> the prompts, read once; it throws until the file is usable
 */
function createPromptsLoader ({ fs = nodeFs, paths = PROMPTS_PATHS } = {}) {
  let cached = null

  function read () {
    const file = paths.find(candidate => fs.existsSync(candidate))
    if (!file) throw new PromptsError('the file is missing')
    let raw
    try {
      raw = fs.readFileSync(file, 'utf8')
    } catch (error) {
      throw new PromptsError(`${file} could not be read (${error.code || error.message})`)
    }
    return usable(parsed(raw, file), file)
  }

  return function loadPrompts () {
    if (!cached) cached = read()
    return cached
  }
}

function renderPrompt (template, context = {}) {
  if (!template || typeof template !== 'string') return ''
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
    if (context[key] || context[key] === 0) {
      return String(context[key])
    }
    return ''
  })
}

module.exports = { loadPrompts: createPromptsLoader(), renderPrompt, requirePrompt, createPromptsLoader, PromptsError, REQUIRED_PROMPTS }
