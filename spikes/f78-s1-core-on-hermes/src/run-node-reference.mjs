// The reference run: Node, the site's ES modules as they are (unbundled), the browser's own id
// generator (Node's global crypto.randomUUID, the same Web Crypto API the site calls).
// Usage: node --import ./src/node-alias-hooks.mjs src/run-node-reference.mjs <out.json>
import fs from 'node:fs'

const out = process.argv[2]
globalThis.__emit = (text) => fs.writeFileSync(out, text + '\n')
await import('./entry.js')
