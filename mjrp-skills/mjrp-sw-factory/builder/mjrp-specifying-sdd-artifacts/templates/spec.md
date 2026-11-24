---
status: In progress
lane: standard          # standard | fast — the PDLC lane the feature runs (pdlc-loops § 2)
solution_type: feature  # feature | fix — fix pays a debt (`fixes:` issues, or an NFR by `violates::`); feature delivers a new requirement
imports: ["[[S-xx-<slug>]]"]
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte ea9bb8495 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
<!-- docs/specs/features/Fxx-slug/spec.md — the folder is the feature (Fxx, two digits).
     status: In progress while the cycle runs; Done when every task is closed and every REQ has verified_by.
     imports: the requirement nodes this feature delivers (1..n), each Ready, each in no other open feature.
     A transversal NFR node constrains every feature (review it with constitution.md), so a product feature does not import
     it. The exception is an engineering feature (a refactor planned by an ADR, infrastructure): `solution_type: fix`, `fixes: [UAT-xx]` of the
     debt issues (required: the card takes its release from them), and `imports:` only the NFR it serves, named by a
     `violates:: [[NFR-xx-<slug>]]` in the Problem Statement — no story invented for it. A debt against a constitution
     article imports nothing and says `violates:: [[constitution#N]]` of an article that exists. -->
# Feature Fxx: [Name]
**Approved**: [human, YYYY-MM-DD HH:MM when the contract's `gates:` lists this stage — empty until then; otherwise `not a gate`]

## Problem Statement
[the problem, in the user's terms — not the solution]

## Requirements
<!-- Local IDs, two digits. Each REQ traces to an imported node; none is invented here.
     Functional and non-functional (performance, security, accessibility) alike are REQ-xx. -->
- [REQ-01] [what the system does — WHAT, never HOW] · from [[S-xx-<slug>|S-xx]]
  verified_by:: [test path or [[uat#^UAT-01]] — filled when it is verified; required before Done]
- [REQ-02] …

## Observable States
<!-- What the imported nodes point_to: the screen state in info-arch.md (the prototype the human judged —
     PRINCIPLES.md §I.13) or the behavior state in behavior.md. N/A only if the nodes point to none. -->
- [[info-arch#^state-id]] · [[behavior#^state-id]]

## Prototype Parity (if the feature touches a screen)
<!-- What the approved visual reference holds across every screen and no node carries: the design system's tokens and fonts,
     the shared components, the shell (brand, menu order, context bar, the behaviour every card has), the
     responsiveness (widths, tables, drawers). The product's FIRST screen feature ports the design system's CSS, fonts
     and components. A cut or swap of anything of the design system points to its recorded decision. -->
- Prototype: [design/inception/<name>-vN.html — approved in info-arch.md § Protótipos aprovados]
- Transversal layer touched: [tokens and fonts · shared components · shell · responsiveness]
- Design-system cuts or swaps: [none · or the decision that records it]

## Success Criteria
<!-- One measurable item per acceptance criterion of the imported nodes. -->
- [measurable, testable]

## Out of Scope
- [what this feature does not do]

## Open Questions
<!-- ALL resolved before Plan. -->
- [question] — [answer, who, when]
