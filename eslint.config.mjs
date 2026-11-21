/**
 * ESLint for the whole repository: `npx eslint .` (also `npm run lint`).
 *
 * Each part of the code is linted as what it is (F65, UAT-20):
 *   public/js        ES modules that run in the browser (built by Vite)
 *   public/splash    the entry page's modules (F80), in the browser
 *   public/js/workers  the same, in a web worker
 *   shared           ES modules that run in the browser and in Node
 *   server           CommonJS that runs in Node
 *   scripts, the *.config files   Node
 *   test             ES modules run by Vitest with jsdom (Vitest's globals are on: vitest.config.js)
 *
 * Not linted: what is built or installed, the code of others, the copies of the harness, and
 * the folders that hold no code of the app. The rules are ESLint's recommended set;
 * `no-unused-vars` and `no-undef` warn; an error is meant to block and a warning is not.
 * Lint is a gate since 2026-11-19 (F64, UAT-20): the CI workflow and the two deploy scripts run
 * `npx eslint . --quiet` before the tests, and an error stops them.
 *
 * The complexity limit is a fitness test of its own (test/architecture/complexityLimit.test.js),
 * which runs ESLint without this file.
 */
import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

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
            // the phone app (F78): TypeScript, linted by its own config (app/eslint.config.js, `npm run app:check`)
            "app/",
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
        // the entry page (F80): its own small modules, in the browser; covers.js is also read by the build (Node)
        files: ["public/splash/**/*.js"],
        languageOptions: { sourceType: "module", globals: globals.browser }
    },
    {
        // The React screens (F83, ADR-0023): TypeScript and JSX in public/js and in the tests that read them.
        // The ceiling of 10 holds here with no list of exceptions; the hooks rules are errors; HTML never goes
        // in as a string; `any` and `as unknown as` are refused where the screens are written (the casts live in
        // react-bridge/, in a list that only shrinks: test/architecture/reactStaysAtTheEdge.test.js).
        files: ["public/js/**/*.{ts,tsx}", "test/**/*.{ts,tsx}"],
        languageOptions: {
            parser: tseslint.parser,
            sourceType: "module",
            globals: { ...globals.browser, ...vitestGlobals }
        },
        plugins: { "@typescript-eslint": tseslint.plugin, "react-hooks": reactHooks },
        rules: {
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "error",
            complexity: ["error", 10],
            "no-restricted-syntax": ["error", {
                selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
                message: "No HTML as a string in a React screen (ADR-0023): build the element."
            }],
            "no-undef": "off", // the type check says it better
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": "warn"
        }
    },
    {
        files: ["public/js/screens/**/*.{ts,tsx}", "public/js/ui/**/*.{ts,tsx}", "public/js/shell/**/*.{ts,tsx}"],
        rules: {
            "@typescript-eslint/no-explicit-any": "error",
            "no-restricted-syntax": ["error",
                { selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']", message: "No HTML as a string in a React screen (ADR-0023): build the element." },
                { selector: "TSAsExpression[expression.type='TSAsExpression'][expression.typeAnnotation.type='TSUnknownKeyword']", message: "No `as unknown as` in a screen: the casts live in react-bridge/." }
            ]
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
