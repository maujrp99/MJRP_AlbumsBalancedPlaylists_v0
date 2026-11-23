# ADR-0024: The CMS's Published Content Lives in Firestore, Read Without Waiting, Written Only by the Administrator

**Status**: Proposed
**Date**: 2026-11-22
**Acceptance**: MJRP — it decides who may change what the site shows (security), that saving publishes with no undo (product) and what the guests may write; the technical parts (the emulator, the server reading one public document) ride on the same acceptance
**Deciders**: drafted by the Claude agent (session `wip/cms-adr-and-specs`), pending acceptance. The product, money and security choices are the MJRP's, in conversation on 2026-11-22 (`docs/log.md`): Painel first, «Sigamos sua recomendação» (20:26); saving publishes, «1. Mantém» (19:40); the administrator is recognised by a record he creates in the Firebase console, «Aceito» (21:18); the previous value kept, point-in-time recovery not turned on, «1 sua recomendação»; the stored copy only switches OFF, usage measurement the exception, «Aceito»; close the guests' write to Spotify popularity before the block recipes, «Agree» (21:35); only his account is administrator now, roles later with him as super administrator, «poderíamos evoluir o kit do CMS pra ter rbac em que eu sou o super admins. Atriibuo e crio roles» (13:38). The technical choices are the proposal's, pending the tech lead; he has not read this record
**Supersedes / Superseded by**: none. It changes one line of `tech-stack.md` («o servidor não acessa o Firestore») and keeps ADR-0016, ADR-0017, ADR-0022 and ADR-0023
**Critique**: `reports/audits/2026-11-22-mjrpalbumblender-v0-cms-published-content-architecture-audit.md` (can go: 0 P0, 9 P1, 9 P2; answered in the proposal's revision)
**Related work**: features F82, F92, F93; stories S-64, S-74, S-75; the CMS kit (harness F332)

## Decision
The content the owner edits in the CMS (texts, feature switches, recipes) lives in `published/*` in Firestore, only what differs from the code, which stays the fallback. The site reads it on open without waiting, keeps a copy in the browser (at most 30 days; it can only switch a function OFF; it is erased when the document is gone) and checks every key with one validator in `shared/content` that the Painel, the site, the entry page and the server all use. Only the signed-in, non-anonymous owner, listed in `cmsAdmins/{uid}` (a record he creates once in the console), writes it, with `rev` in sequence and the previous value of each changed key in the same write; the rules are proven by running them in the Firestore emulator. The server starts reading one public Firestore document (the Discogs switch). The analysis, the risks and the slices are in `design/proposals/f82-cms/architecture-proposal.md`, not here.

## Options
- **A. Firestore, read without waiting, copy in the browser, code as fallback (chosen)** — no build per save, one small read, the server reads the same document.
- **B. Files generated at build time** — lost: every save would be a build and a deploy, which the constitution forbids (V.1).
- **C. Remote Config** — lost: made for switches, not for 2,300 texts; hours of cache; a second stack.
- **D. The server delivers the content** — lost for the site: a cold start on the path of opening; kept as the entry page's path on the App Check day (proposal § 8.1).
- **Who writes — A: the uid in the rules; B: a login attribute** — lost against `cmsAdmins/{uid}` (chosen): no uid in the repository, no credential, and roles arrive without rewriting rules.

## Consequences
- **New tool:** the Firestore rules emulator (`@firebase/rules-unit-testing`, a development dependency, one step in the suite). Today's rules test reads the file as text and proves no refusal. `tech-stack.md` gains the row once this record is accepted (as ADR-0023 did), and its server line changes to «lê um documento público do Firestore».
- Saving publishes: a bad save reaches everyone at once. The nets are the three checks (Painel, rules, each reader) and the previous value; the next save overwrites it and nobody reads it in v1, so going back is copying the value in the console. Point-in-time recovery is not turned on.
- The MJRP himself publishes the rules and creates his `cmsAdmins/{uid}` record, in the console; nothing in the repository holds his identifier.
- The guests' write to `spotify_enrichment/` closes before the slice of recipes from blocks; a test holds that slice until then.
- Trigger written: when App Check is enforced on Firestore, the server reads with its service account and the entry page asks the server (proposal § 8.1). The free read quota (50,000 a day) runs out near 20,000 openings a day.

## Files
- `design/proposals/f82-cms/architecture-proposal.md` — the design, the risks, the slices, the fitness functions F-1 to F-15
- `docs/specs/features/F82-admin-with-the-cms-kit/`, `F92-blend-algorithms-managed-in-the-cms/`, `F93-feature-toggles-in-the-cms/` — spec, plan, tasks
- `firestore.rules` (his, published by him), `test/security/` (the emulator), `shared/content/`, `server/lib/valueSources/` and `server/routes/values.js`, `docs/specs/tech-stack.md`, `docs/specs/arch.md` — slice 0 and after acceptance
