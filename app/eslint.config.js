// ESLint for the app: Expo's flat config for SDK 58 (eslint-config-expo), plus the app's two lines
// of the dependency rule (proposal § 4.3): the app never imports the site (public/) or the server
// (server/), and the native packages are imported only by their adapter. The root's
// test/architecture/appAndSiteApart.test.js checks the first line again, transitively.
const { defineConfig } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')

const ADAPTERS = {
    '@react-native-firebase/firestore': 'src/data/firebaseStore.ts',
    '@react-native-firebase/auth': 'src/auth/nativeAuth.ts',
    '@invertase/react-native-apple-authentication': 'src/auth/nativeAuth.ts',
    '@react-native-google-signin/google-signin': 'src/auth/nativeAuth.ts',
    'posthog-react-native': 'src/usage/posthogAdapter.ts'
}

module.exports = defineConfig([
    expoConfig,
    { ignores: ['dist/*', '.expo/*', 'node_modules/*', 'ios/*', 'android/*'] },
    {
        rules: {
            'no-restricted-imports': ['error', {
                patterns: [
                    { group: ['**/public/**', '**/server/**', '@/*', '@stores/*', '@components/*', '@views/*'], message: 'The app never imports the site or the server: what both need lives in shared/ (F78, REQ-08).' },
                    ...Object.keys(ADAPTERS).map(pkg => ({ group: [pkg, `${pkg}/*`], message: `Only ${ADAPTERS[pkg]} imports ${pkg} (the native package stays behind its port).` }))
                ]
            }]
        }
    },
    ...Object.entries(ADAPTERS).map(([pkg, file]) => ({
        files: [file],
        rules: {
            'no-restricted-imports': ['error', {
                patterns: [
                    { group: ['**/public/**', '**/server/**'], message: 'The app never imports the site or the server (F78, REQ-08).' },
                    ...Object.keys(ADAPTERS).filter(other => ADAPTERS[other] !== file).map(other => ({ group: [other, `${other}/*`], message: `Only ${ADAPTERS[other]} imports ${other}.` }))
                ]
            }]
        }
    })),
    {
        // the golden self-test reaches the corpus in test/fixtures (and, through its runner, the
        // rules where they live today): the one allowance, also named in appAndSiteApart.test.js
        files: ['src/selftest/goldenSelfTest.ts'],
        rules: { 'import/no-unresolved': 'off' }
    },
    {
        files: ['jest/**', '*.config.js', 'tsvTransformer.js', 'metro.config.js'],
        languageOptions: { globals: { jest: 'readonly', require: 'readonly', module: 'writable', __dirname: 'readonly' } }
    }
])
