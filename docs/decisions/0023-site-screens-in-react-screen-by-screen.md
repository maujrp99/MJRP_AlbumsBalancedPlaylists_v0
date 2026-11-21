# ADR-0023: The Site's Screens Move to React and TypeScript, Screen by Screen, With the Texts in a Dictionary per Language

**Status**: Proposed
**Date**: 2026-11-21
**Acceptance**: MJRP — it brings a UI framework into the site and amends the constitution he ratified (v2.0.0: *Proibições*, *Tipagem*, art. I.2, art. II); it records a choice of his («sim vamos com react», 2026-11-21)
**Deciders**: drafted by the Claude agent (session `claude/f83-site-screens-in-react`), pending acceptance. The MJRP chose React in conversation on 2026-11-21 (`docs/log.md`, 08:53 and 08:58); he has not read this record
**Supersedes / Superseded by**: none. It keeps ADR-0016, ADR-0017, ADR-0019, ADR-0021 and ADR-0022 (the last still Proposed, accepted in conversation «pra essa iteração»)
**Critique**: `reports/audits/2026-11-21-mjrpalbumblender-v0-f83-architecture-critique.md` (can go to the MJRP: 0 P0, 10 P1, 3 P2; answered in the proposal, § 17)
**Related work**: release v6.0, features F83, F81, F82, stories S-65, S-63

## Decision
The screens of the site (`public/js/views`, `components`) are rewritten in React 19 with TypeScript on the Vite build that exists, one screen at a time with the site in production: a React screen is one more «view» of the site's own router, mounted in the same `#app`. Everything under the screen stays as it is (controllers, stores, services, models, algorithms, repositories, `shared/`, the CSS and the phone layer; the router keeps its behaviour, with a small refactor of its error panel), and every visible text comes from a plain-JavaScript dictionary per language (`en`, `pt`) that hand-made and React screens both call. The analysis, the options measured, the risks and the order of work are in `design/proposals/f83-react-screens/architecture-proposal.md`, not here.

## Options
- **React with the existing Vite, screen by screen (chosen)** — the library of the CMS kit and of the app; the site never stops; hosting, server and data do not move.
- **Stay hand-made** — lost because every screen feature keeps paying for hand-written drawing, and the CMS kit would be a foreign body; comes back only if the site were to be replaced by the app.
- **Vue with the existing Vite** — technically equal here; lost on three ways of making screens in one product (Vue, React for the kit, React Native).
- **Next.js** — lost because it is a rewrite with a change of hosting, for an app that lives behind sign-in; comes back if the public product gains many open, indexable pages.
- **A library router or state library now (React Router, Zustand, TanStack Query)** — lost because the house router and the stores are guarded by sensors and already do the work; the router is reviewed when the last hand-made screen leaves.

## Consequences
- Two ways of making a screen live together until the migration ends: bridges, sensors that read both, two test scaffolds. Lists that only shrink (hand-made files, bridges, texts outside the dictionary) keep it moving; the pace is the MJRP's choice (proposal, D-1).
- The constitution is amended by the MJRP: React and `.ts`/`.tsx` allowed in `public/js/screens`, `ui`, `shell` and `react-bridge`; «the interface speaks English» becomes «the code speaks English, every visible text comes from the dictionary». `tech-stack.md` gains the rows.
- One React for the site and the app (the root `overrides`, 19.3.0): an update moves both.
- The architecture sensors learn `.ts`/`.tsx` before the first screen; new ones hold the edge («React does not go below the screen»), the dictionaries and a download budget.
- React costs 68,922 B gzipped in the spike's raw evidence (the analysis estimated 45 KB); every screen change becomes a network fetch, so «no network» gets its own state and the menu's screens are fetched in the background.
- Open when this record was drafted: drag and drop under React, the cost of a hard screen (both measured in wave 2, before the shell migrates), the store bridge (designed, not measured), the country of access through Firebase Hosting, and when Portuguese opens to users (the MJRP's choice). The measurement spike was not delivered yet.

## Files
- `design/proposals/f83-react-screens/architecture-proposal.md` — the design, the risks, the waves, the decisions for the MJRP
- `docs/specs/features/F83-site-screens-in-react/` — spec, plan and tasks
- `docs/specs/constitution.md`, `docs/specs/tech-stack.md`, `docs/specs/arch.md` — updated after acceptance (`mjrp-syncing-docs`)
- `public/js/screens/`, `ui/`, `shell/`, `react-bridge/`, `i18n/` — new, from wave 0 on; nothing is created before acceptance
- `public/js/router.js`, `public/js/app.js`, `public/js/utils/staleBuild.js` — the error panel shared, «no network» apart from «new version», the routes that load React screens
- `vite.config.js`, `vitest.config.js`, `eslint.config.mjs`, `tailwind.config.js`, `package.json`, `tsconfig.json`, `.github/workflows/ci.yml`, `scripts/deploy-site.sh`, `test/architecture/` — the build, the checks, the budget and the sensors
- For the languages (F81): `firebase.json`, `firestore.rules` (published by the MJRP), `scripts/entryPage.mjs`, `public/splash/gate.js`, `docs/specs/data-model.md` (the language preference); `docs/specs/design-system.md` (the table of ports)
