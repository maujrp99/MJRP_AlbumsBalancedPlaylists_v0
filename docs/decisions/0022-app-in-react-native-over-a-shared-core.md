# ADR-0022: The App Is React Native With Expo Over a Shared JavaScript Core

**Date**: 2026-11-20
**Status**: Proposed
**Deciders**: Claude agent (drafter); the owner's acceptance pending, because it needs the constitution amended
**Acceptance**: MJRP
**Related work**: release v6.0, feature F78, story S-60

## Context
The MJRP wants the Album Blender in the App Store and in Google Play, and the site stays. The product's rules (recipes, rankings, album and track identity, inventory) are JavaScript, written and tested for the site. Measured on 2026-11-20: about 34% of the site's code does not touch the browser and runs elsewhere after one small fix (`crypto.randomUUID`); nothing has run on a phone yet. The screens (46% of the site) are rewritten in any native option.

The analysis, the options measured side by side, the risks and the spikes are in the proposal, not here: `design/proposals/f78-app-architecture/architecture-proposal.md` (§ 4, § 12, § 15), judged in `reports/audits/2026-11-20-mjrpalbumblender-v0-f78-architecture-critique.md` and revised after it (§ 16, § 17). On 2026-11-20 the MJRP said «Vc consegue seguir sua recomendação da f78 e construir a app» and, on the proposal's decisions, «Recomendação sua da proposta».

## Decision
- **The app is React Native with Expo**, one code base for iPhone and Android, in `app/` with its own `package.json`. The screens are native components, drawn from the F76 mobile design; the site does not move.
- **The app is written in TypeScript** (the MJRP, 2026-11-20 14:04: «Ignora o sem typescript, podemos ter typescript, creio que devemos inclusive»). The core in `shared/` stays JavaScript with JSDoc until an ADR moves it, with the server's build path measured (it is CommonJS and receives `shared/` copied, with no compile step).
- **The rules live in one shared JavaScript core, `shared/`**, used by the site, the app and the server. The core imports no browser, React, Expo, Firebase, `fetch` nor PostHog: what it needs from outside it asks through a port, and each side wires its own. What depends on the engine (`newId`, text comparison and normalization) lives only in `shared/platform/`. The data paths and the document shape live in `shared/data/`, which receives the Firestore functions from outside. A sensor in the suite holds each of these lines.
- **Firebase in the app is the native SDK package (React Native Firebase)**: disk persistence of Firestore, pending writes that survive closing the app, the sign-in kept in the system keychain. Spike S2 confirms it; if it fails, the app gets thin repositories of its own and the document shape stays one, in `shared/data/`.
- **Native Swift and Kotlin only where the platform demands it**, starting with the Apple Music user token: a small module that asks permission and returns the token. The catalog and the playlist calls go to the Apple Music API by path, as the site already does.
- **Every write has a deadline and a visible state**, and the coexistence rules between app versions and the site hold (proposal § 5.3 and § 6.2): write only the changed fields, keep unknown fields, `_schemaVersion` never lowered, a minimum app version.
- **The stack stands on spike S1**: the core gives byte-for-byte the same output on the phone as on the site. A «no» reopens this record before any app code.

## Options
- **Flutter** — lost because the rules would be written a second time in Dart (or moved to the server, losing offline); comes back if the site ends or if S1 fails.
- **Two native apps (Swift and Kotlin)** — lost on three code bases of screens and up to three of rules for one maintainer; comes back if the product becomes iPhone-only for a long time.
- **Full Swift app for iPhone, React Native for Android** — lost on three screen code bases; comes back if spike S7 passes (the core runs the same on the iOS JavaScript engine) and S1 fails, or if Android can wait a year or more.
- **The site wrapped with Capacitor** — lost on App Store rule 4.2 and on Apple Music sign-in failing inside a web frame; comes back only as a personal, internal-only step, never as the store product.

## Consequences
- On 2026-11-20 the MJRP chose to supersede the constitution instead of amending it («Sobre a constitution pode ser superseded já envelheceu»): this record now depends on constitution v2.0.0 being accepted, proposed in `design/proposals/f78-app-architecture/constitution-v2.md`; the amendment below stays as the record of why.
- The constitution (Art. II, IV and V) does not allow this as written. This record is accepted only together with an amendment for `app/`, proposed in `design/proposals/f78-app-architecture/constitution-amendment.md`; the MJRP decides both.
- The site is refactored in slices (Ref-0, Ref-A, Ref-B, then Ref-C and Ref-D), each published alone with the suite green. It is worth doing even without the app (ADR-0016, ADR-0017).
- Three targets to maintain instead of one: estimated 6 to 11 hours a month (proposal § 10, an estimate, not measured).
- A released app version cannot be undone: `/api` responses and Firestore documents become backward compatible, and the server states the minimum app version.
- Builds need Xcode and Android Studio on the MJRP's Mac, or the Expo build service; the core depends on neither.
- `docs/specs/tech-stack.md` gains the app rows when this record is accepted; its line «Framework de UI — decidido não usar» becomes «no site».
