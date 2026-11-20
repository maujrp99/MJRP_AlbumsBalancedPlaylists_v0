/**
 * ESLint for the whole repository: `npx eslint .` (also `npm run lint`).
 *
 * Each part of the code is linted as what it is (F65, UAT-20):
 *   public/js        ES modules that run in the browser (built by Vite)
 *   public/js/workers  the same, in a web worker
 *   shared           ES modules that run in the browser and in Node
 *   server           CommonJS that runs in Node
 *   scripts, the *.config files   Node
 *   test             ES modules run by Vitest with jsdom (Vitest's globals are on: vitest.config.js)
 *
 * Not linted: what is built or installed, the code of others, the copies of the harness, and
 * the folders that hold no code of the app. The rules are ESLint's recommended set;
 * `no-unused-vars` and `no-undef` warn. Lint is not yet a gate (CI and the deploy scripts do not
 * run it): see docs/specs/features/F65-remove-what-nothing-uses/plan.md for what is left.
 *
 * The complexity limit is a fitness test of its own (test/architecture/complexityLimit.test.js),
 * which runs ESLint without this file.
 */
import globals from "globals";
import pluginJs from "@eslint/js";

/** Vitest's globals (vitest.config.js sets `globals: true`). */
const vitestGlobals = Object.fromEntries(
    ["describe", "it", "test", "expect", "vi", "beforeAll", "beforeEach", "afterAll", "afterEach", "suite", "bench", "assert"]
        .map(name => [name, "readonly"])
);

export default [
    {
        ignores: [
            // built or installed
            "dist/",
            "coverage/",
            "**/node_modules/",
            ".firebase/",
            "server/_shared_temp/",
            // retired code and backups
            "_archive/",
            "_backups/",
            // the code of others
            "public/js/vendor/",
            // stamped copies of the harness: edited there, never here
            "mjrp-scripts/",
            "mjrp-skills/",
            ".mjrp/",
            ".agent/",
            ".specify/",
            ".claude/",
            // no code of the app
            "docs/",
            "reports/",
            "design/",
            "artifacts/",
            "daily-checks/",
            "public/assets/"
        ]
    },
    pluginJs.configs.recommended,
    {
        rules: {
            "no-unused-vars": "warn",
            "no-undef": "warn"
        }
    },
    {
        files: ["public/js/**/*.js"],
        languageOptions: {
            sourceType: "module",
            globals: {
                ...globals.browser,
                MusicKit: "readonly" // Apple's MusicKit JS, loaded from Apple's CDN at run time
            }
        }
    },
    {
        files: ["public/js/workers/**/*.js"],
        languageOptions: { globals: globals.worker }
    },
    {
        files: ["shared/**/*.js"],
        languageOptions: { sourceType: "module", globals: globals["shared-node-browser"] }
    },
    {
        files: ["server/**/*.js"],
        languageOptions: { sourceType: "commonjs", globals: globals.node }
    },
    {
        files: ["scripts/**/*.{js,mjs,cjs}", "*.config.js", "*.config.mjs"],
        languageOptions: { globals: globals.node }
    },
    {
        files: ["test/**/*.js"],
        languageOptions: {
            sourceType: "module",
            globals: { ...globals.node, ...globals.browser, ...vitestGlobals }
        }
    }
];
