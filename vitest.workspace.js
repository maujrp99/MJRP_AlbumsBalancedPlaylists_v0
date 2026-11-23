/**
 * Two runs of the tests (F78, REQ-08):
 *   the site   every test, with jsdom (vitest.config.js), as always;
 *   core-node  the tests of the shared core (test/shared/, and test/repositories/ for shared/data/) a second time, in plain Node with no
 *              jsdom: the core runs on engines with no browser (the server, the phone's Hermes),
 *              so its tests must pass where `window` and `document` do not exist.
 * `npx vitest run` runs both. The core-node project takes the aliases and the setup of the site's
 * config, not its list of files (an `extends` would add the two lists together).
 */
import siteConfig from './vitest.config.js'

// The rules test has its own step (F82 TASK-05): with MJRP_RULES_STEP=1 (scripts/rules-emulator.mjs) the
// only project is vitest.rules.config.js, so that step runs that one file and not the whole suite.
const rulesStep = process.env.MJRP_RULES_STEP === '1'

export default rulesStep ? ['vitest.rules.config.js'] : [
    'vitest.config.js',
    {
        resolve: { alias: siteConfig.resolve.alias },
        test: {
            name: 'core-node',
            environment: 'node',
            globals: true,
            setupFiles: siteConfig.test.setupFiles,
            // the repositories of the core (shared/data/, F78 Ref-A) run without a browser too
            include: ['test/shared/**/*.test.js', 'test/repositories/**/*.test.js']
        }
    }
]
