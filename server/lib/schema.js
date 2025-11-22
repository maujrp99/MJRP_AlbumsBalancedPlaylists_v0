const fs = require('fs');
const path = require('path');

let validateAlbum = null;
let ajvAvailable = false;

try {
  const Ajv = require('ajv');
  const ajv = new Ajv({ allErrors: true, coerceTypes: true });
  const schemaPath = path.join(__dirname, '..', 'schema', 'album.schema.json');
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  validateAlbum = ajv.compile(schema);
  ajvAvailable = true;
  console.log('schema: AJV validator loaded');
} catch (e) {
  console.warn('schema: AJV not available; validation disabled. Install "ajv" to enable.');
}

module.exports = {
  validateAlbum,
  ajvAvailable
};
