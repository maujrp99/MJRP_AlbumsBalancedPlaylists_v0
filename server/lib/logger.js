// Lightweight structured logger for local development
function ts () { return new Date().toISOString() }

function format (level, msg, meta) {
  const out = { ts: ts(), level, msg }
  if (meta && typeof meta === 'object') out.meta = meta
  // print JSON for easier ingestion in CI/forwarding
  try { return JSON.stringify(out) } catch (e) { return `${out.ts} ${level} ${msg}` }
}

function info (msg, meta) { console.log(format('info', msg, meta)) }
function warn (msg, meta) { console.warn(format('warn', msg, meta)) }
function error (msg, meta) { console.error(format('error', msg, meta)) }

module.exports = { info, warn, error }
