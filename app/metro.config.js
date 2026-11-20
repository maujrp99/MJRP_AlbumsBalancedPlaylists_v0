// Metro for the app (F78). Expo configures a monorepo by itself since SDK 52 (npm workspaces: the
// root's node_modules and the workspace packages are watched and resolved; docs.expo.dev/guides/monorepos).
// Two additions, and nothing else:
//   1. `@shared/…` — the alias the SITE's modules use for the shared core (vite.config.js). The app
//      itself imports the core by its package name (`@album-blender/shared/…`); the alias is here
//      only because the golden self-test runs the rules where they live today (public/js), and
//      those files name the core by the alias. Both names land on the same file of ../shared, so
//      the core is ONE module instance (one id port, one store): scripts/scanBundles.mjs checks it
//      in the source map of each export.
//   2. `.tsv` — the golden reference index (test/fixtures/golden-core/reference/cases.tsv) is
//      bundled as a text module by tsvTransformer.js, so the self-test compares against the very
//      file the root suite commits, with no copy that could drift.
const path = require('node:path')
const { getDefaultConfig } = require('expo/metro-config')

const SHARED = path.resolve(__dirname, '../shared')

const config = getDefaultConfig(__dirname)

config.resolver.sourceExts = [...config.resolver.sourceExts, 'tsv']
config.transformer.babelTransformerPath = require.resolve('./tsvTransformer.js')

const upstreamResolve = config.resolver.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
    const target = moduleName.startsWith('@shared/') ? path.join(SHARED, moduleName.slice('@shared/'.length)) : moduleName
    return upstreamResolve
        ? upstreamResolve(context, target, platform)
        : context.resolveRequest(context, target, platform)
}

module.exports = config
