/**
 * The schema an album answered by the AI has to pass (schema/album.schema.json, checked with ajv).
 *
 * ajv and the schema file ship with the server: without them the server would answer albums it
 * cannot check. So a failure to load either is thrown when the server starts (F52, slice 5), and
 * the deploy's smoke test stops there. Before, it became "validation disabled" with a line in the log.
 */
const fs = require('fs')
const path = require('path')
const Ajv = require('ajv')

const schemaPath = path.join(__dirname, '..', 'schema', 'album.schema.json')
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'))
const validateAlbum = new Ajv({ allErrors: true, coerceTypes: true }).compile(schema)

module.exports = {
  validateAlbum,
  // Kept for the callers that ask: since F52 the validator is always there, or the server did not start
  ajvAvailable: true
}
