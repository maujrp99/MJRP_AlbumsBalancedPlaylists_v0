---
id: NFR-01
aliases: [NFR-01]
type: nfr
status: Backlog
---
# NFR-01 · Os fluxos principais do produto têm teste ponta a ponta

## pt-BR

Os fluxos principais do Album Blender (montar uma série, misturar, revisar as playlists e exportar) têm testes ponta a ponta que rodam por um comando e reprovam quando um fluxo quebra. Quais são os fluxos principais, a ferramenta (a constituição, Art. IV, diz Puppeteer; o roadmap legado diz Cypress ou Playwright) e a meta de cobertura: a perguntar ao MJRP (pergunta P-17 do relatório do pacote C1).
Vale para: todas as features · conferida na revisão, com a `constitution.md`
Origem: `docs/ROADMAP.md:13-16` (Sprint 24 «QA & Stability»: «End-to-End Testing (Cypress/Playwright)»); `docs/specs/constitution.md` Art. IV; PRD, Candidatos. Hoje os testes de curadoria apontam para um arquivo que não existe e `tests/` não roda em comando nenhum (achado do pacote B, item 8): cada lugar assim é um item de conserto, não parte desta regra.

## en

**The product's main flows have end-to-end tests**

The Album Blender's main flows (build a series, blend, review the playlists and export) have end-to-end tests that run with one command and fail when a flow breaks. Which flows are the main ones, the tool (the constitution, Art. IV, says Puppeteer; the legacy roadmap says Cypress or Playwright) and the coverage target: to ask the MJRP (question P-17 of the package C1 report).
Applies to: all features · checked in review, with `constitution.md`
Origin: `docs/ROADMAP.md:13-16` (Sprint 24 “QA & Stability”: “End-to-End Testing (Cypress/Playwright)”); `docs/specs/constitution.md` Art. IV; PRD, Candidates. Today the curation tests point to a file that does not exist and `tests/` runs under no command (package B finding, item 8): each such place is a fix item, not part of this rule.
