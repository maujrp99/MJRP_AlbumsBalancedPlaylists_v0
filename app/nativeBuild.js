// Which native build this is (F78): the demo build, the default, or the Firebase build.
// Read by app.config.js (which config plugins run at prebuild) and react-native.config.js (which
// native packages are autolinked into the iOS and Android projects). Same switch as the JavaScript
// composition root (src/composition.ts): EXPO_PUBLIC_DATA_MODE=firebase, anything else is the demo.
//
// Why the demo build leaves these packages out natively, instead of only never calling them:
//   - @react-native-firebase/app's config plugin makes the AppDelegate call FirebaseApp.configure()
//     at launch and copies GoogleService-Info.plist into the project; there is no plist (no Firebase
//     iOS app is registered yet), and we do not fake the credentials file.
//   - Google Sign-In's plugin needs the iOS URL scheme of a real OAuth client.
//   - Sign in with Apple needs the entitlement, which needs a paid Apple developer team.
// The JavaScript of these packages is still bundled (the composition root `require`s the adapters
// lazily, only in Firebase mode), so `expo export` keeps checking that Metro resolves them.
const NATIVE_ONLY_FOR_FIREBASE = [
    '@react-native-firebase/app',
    '@react-native-firebase/auth',
    '@react-native-firebase/firestore',
    '@react-native-google-signin/google-signin',
    '@invertase/react-native-apple-authentication'
]

const isFirebaseBuild = (env = process.env) => env.EXPO_PUBLIC_DATA_MODE === 'firebase'

module.exports = { NATIVE_ONLY_FOR_FIREBASE, isFirebaseBuild }
