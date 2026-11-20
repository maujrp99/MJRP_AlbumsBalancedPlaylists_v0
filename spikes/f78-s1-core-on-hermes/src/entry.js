// The one entry, the same on every engine: install the harness, run the rules, hand the canonical
// JSON (pretty-printed by the engine's own JSON.stringify) to the host's __emit.
import { installHarness } from './harness.js'
import { runCore } from './run-core.js'

installHarness()
globalThis.__emit(JSON.stringify(runCore(), null, 1))
