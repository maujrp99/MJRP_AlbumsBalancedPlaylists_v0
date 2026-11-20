// Autolinking (F78): in the demo build the native packages that need Firebase, Google or Apple
// credentials are not linked into ios/ and android/ (see nativeBuild.js). Their JavaScript is
// bundled but never run: src/composition.ts requires the real adapters only in Firebase mode.
const { NATIVE_ONLY_FOR_FIREBASE, isFirebaseBuild } = require('./nativeBuild')

const unlinked = { platforms: { ios: null, android: null } }

module.exports = {
    dependencies: isFirebaseBuild() ? {} : Object.fromEntries(NATIVE_ONLY_FOR_FIREBASE.map(name => [name, unlinked]))
}
