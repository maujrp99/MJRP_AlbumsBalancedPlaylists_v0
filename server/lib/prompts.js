const path = require('path')
const fs = require('fs')

const configPathLocal = path.join(__dirname, '..', '..', 'config', 'prompts.json')
const configPathContainer = path.join(__dirname, '..', 'config', 'prompts.json')
let cachedPrompts = null

function loadPrompts() {
  if (cachedPrompts) return cachedPrompts
  try {
    if (fs.existsSync(configPathContainer)) {
      const raw = fs.readFileSync(configPathContainer, 'utf8')
      cachedPrompts = JSON.parse(raw)
    } else {
      const raw = fs.readFileSync(configPathLocal, 'utf8')
      cachedPrompts = JSON.parse(raw)
    }
  } catch (error) {
    console.warn('Could not load config/prompts.json:', error.message || error)
    cachedPrompts = {}
  }
  return cachedPrompts
}

function renderPrompt(template, context = {}) {
  if (!template || typeof template !== 'string') return ''
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
    if (context[key] || context[key] === 0) {
      return String(context[key])
    }
    return ''
  })
}

module.exports = { loadPrompts, renderPrompt }
