# Spike S1 (F78) — the rules on Hermes

The question: do the product's rules (every recipe of the registry, every ranking strategy, the
Album and Track models, the transformer, the album identity rule and the track identity rule) give,
on Hermes, the engine of React Native, the same output as on the site, byte for byte?

The answer and its evidence: `reports/evidence/F78/2026-11-20-spike-s1-core-on-hermes.md`.

## Promoted (2026-11-20, branch `feat/f78-core-foundations`)

The two changes the spike asked for are in the site now (the id port `shared/platform/newId.js`;
the `TrackEnrichmentMixin` retired, it was dead), and the corpus and the run became an asset of the
repository:

- the inputs: `test/fixtures/golden-core/inputs/` (the extracted calls, the hand-made albums, the
  measured catalog albums), and the run: `test/fixtures/golden-core/run/` (engine-neutral, the id
  port wired by the host instead of a global `crypto` stand-in);
- ONE reference, the output of the current rules on Node: `test/fixtures/golden-core/reference/`
  (`output.jsonl.gz`, one line per case, and `cases.tsv`, the id and a hash of each case: the diff
  a reviewer reads); the suite compares with it on every run
  (`test/architecture/goldenCoreUnchanged.test.js`);
- the Hermes run, optional (it needs this folder's engine and never runs in the suite):

  ```sh
  cd spikes/f78-s1-core-on-hermes && npm install && sh scripts/get-hermes.sh   # once
  cd ../.. && node scripts/golden-core.mjs --hermes                            # «N of N match»
  ```

  On 2026-11-20, after the two changes: 3,343 of 3,343 match on Hermes from source and from bytecode
  (the 58 `mixin:enrichTracks` cases left with the mixin).

This folder stays as the record of the spike. Its own `npm run spike` reproduces that record on the
code of `main` at `79b36d3`; on later code its `src/run-core.js` names the retired mixin and does not
run as it is.

## Rerun it (one command)

```sh
cd spikes/f78-s1-core-on-hermes
npm install          # esbuild 0.28.2 and hermes-compiler 260318099.0.5, here only
npm run spike        # about 2.5 minutes
```

Needs: macOS with the Command Line Tools (clang), Node 26, and the repository's own `npm install`
at its root (the extraction runs the repository's Vitest). The first run downloads the engine
(`scripts/get-hermes.sh`): `com.facebook.hermes:hermes-ios:260318099.0.5` from Maven Central (25 MB,
sha256 checked), the build React Native 0.88.1 uses; its macOS slice of `hermesvm.framework` is
linked into `host/hermes-run.cpp`, a small host (about 80 lines) that adds only `print()`.

`npm run spike` runs `scripts/run-all.mjs` twice: as the site is, then with `--patched` (the
spike's small rewrites, `src/patches.js`, applied to the files as they are read — the files on
disk are never changed).

Everything generated (the engine, the host binary, the bundles, the bytecode) goes to
`node_modules/.s1-build/`, out of version control and out of the repository's lint.

## What is where

| Path | What |
|---|---|
| `extract/` | the recorder: runs the repository's own tests of the rules and writes what they pass in |
| `corpus/extracted/` | those inputs (938 calls, 921 replayable), one file per test file |
| `corpus/handmade.js` | the hand-made albums and name variants (accents, scripts, editions, medleys, ties, gaps, empty, one track, 20 tracks, no ids) |
| `corpus/measured.js` | 28 real catalog albums from `test/fixtures/trackIdentity/` turned into albums |
| `src/run-core.js` | the golden run: 3,401 cases |
| `src/harness.js`, `src/canon.js` | seeded `Math.random`, console collector; canonical JSON with generated ids and timestamps marked, not dropped |
| `src/polyfill-crypto.js` | the spike's stand-in for `crypto.randomUUID` (bare Hermes has none) |
| `src/probes.js` | each engine-dependent feature, measured |
| `host/hermes-run.cpp`, `scripts/get-hermes.sh` | the engine and its host |
| `out/summary.json` | the result of the as-is pass (cases, differences, sha256 of every output) |
| `out/patched/summary.json` | the result with the patches |
| `out/node-reference.json.gz`, `out/hermes-polyfill-source.json.gz` | the two outputs (54 MB each plain) |
| `out/diff-hermes-polyfill-source.txt` | their diff (7 cases, all in the mixin outside the registry) |
| `out/hermes-bare.json.gz` | the run on bare Hermes, no polyfill (1,241 cases fail on `crypto`) |
| `out/features-*.json` | the feature probes on Node, Hermes from source, Hermes from bytecode |
