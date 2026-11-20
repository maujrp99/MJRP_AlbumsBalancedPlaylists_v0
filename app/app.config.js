// The Expo config (F78): app.json is the base; in the demo build (the default) this file leaves out
// the native packages that need credentials the project does not have yet (see nativeBuild.js):
//   1. their config plugins (no FirebaseApp.configure() in the AppDelegate, no plist, no URL scheme);
//   2. Sign in with Apple's entitlement (it needs a paid developer team);
//   3. their Expo-module half: Google Sign-In also ships an Expo adapter (ExpoAdapterGoogleSignIn,
//      which pulls the GoogleSignIn pod), and Expo's autolinking does not read react-native.config.js,
//      so the Podfile's `use_expo_modules!` gets an `exclude` list. The React Native half of each
//      package is left out by react-native.config.js.
// The Firebase build (EXPO_PUBLIC_DATA_MODE=firebase) gets app.json as it is.
const { withPodfile } = require('expo/config-plugins')
const { NATIVE_ONLY_FOR_FIREBASE, isFirebaseBuild } = require('./nativeBuild')

const pluginName = plugin => (Array.isArray(plugin) ? plugin[0] : plugin)

const USE_EXPO_MODULES = /^(\s*)use_expo_modules!.*$/m

function withoutFirebaseExpoModules(config) {
    return withPodfile(config, podfile => {
        const list = NATIVE_ONLY_FOR_FIREBASE.map(name => `'${name}'`).join(', ')
        if (!USE_EXPO_MODULES.test(podfile.modResults.contents)) {
            throw new Error('app.config.js: the Podfile has no use_expo_modules! line to add the demo build\'s exclude list to')
        }
        podfile.modResults.contents = podfile.modResults.contents.replace(USE_EXPO_MODULES, `$1use_expo_modules!({ exclude: [${list}] }) # demo build: app/app.config.js`)
        return podfile
    })
}

module.exports = ({ config }) => {
    if (isFirebaseBuild()) return config
    const demo = {
        ...config,
        plugins: (config.plugins ?? []).filter(plugin => !NATIVE_ONLY_FOR_FIREBASE.includes(pluginName(plugin))),
        ios: { ...config.ios, usesAppleSignIn: false }
    }
    return withoutFirebaseExpoModules(demo)
}
