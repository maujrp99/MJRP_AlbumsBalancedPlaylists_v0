// Jest for the app: the preset Expo's docs give for SDK 58 (jest-expo, Jest 30, React Native Testing
// Library 14; docs.expo.dev/develop/unit-testing). Additions, each for the monorepo:
//   - the core by its two names (the package `@album-blender/shared` and the site's alias `@shared`)
//     maps to ONE folder, ../shared, as in Metro (metro.config.js);
//   - the core, the golden corpus and the site's rule files are plain ES modules outside app/, so
//     they are transformed too (Jest only transforms what is not in node_modules by default; the
//     preset's own pattern covers the React Native packages);
//   - `.tsv` is read as text (the golden reference index), as tsvTransformer.js does for Metro.
const path = require('node:path')

const SHARED = path.resolve(__dirname, '../shared')

module.exports = {
    preset: 'jest-expo',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.test.ts?(x)'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'tsv'],
    moduleNameMapper: {
        '^@album-blender/shared/(.*)$': `${SHARED}/$1`,
        '^@shared/(.*)$': `${SHARED}/$1`
    },
    transform: {
        '\\.tsv$': '<rootDir>/jest/tsvTransform.js'
    },
    setupFiles: ['<rootDir>/jest/setup.js'],
    // the golden self-test runs ~3,300 cases over the real rules: it takes seconds, not milliseconds
    testTimeout: 120000
}
