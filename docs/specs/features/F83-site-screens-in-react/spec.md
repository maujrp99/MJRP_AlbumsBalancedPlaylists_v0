---
status: Draft
lane: standard
solution_type: feature
imports: ["[[S-65-keep-the-site-screens-on-one-framework]]"]
planned_for: "[[ROADMAP#^REL-41]]"
---
# Feature F83: As telas do site em React, tela a tela
**Approved**: pendente

## Summary
**A feature:** As telas do site passam a ser feitas em React com TypeScript, sobre o Vite que já existe, uma tela por vez, com o site no ar.

**Por quê:** O produto vai a público; o kit do CMS é React e o app é React Native; hoje cada tela é DOM montado à mão.

**Como saber que funcionou:** A escrever com a proposta: nenhuma tela muda de comportamento ao migrar, e tela nova nasce em React.

## Problem Statement
Dito pelo MJRP em 2026-11-21: «Sobre a tech diferente do album blender, como ele vai virar um produto, acha que está na hora de usar um framework mais moderno? React, vue ou o next?» e, depois da análise (`reports/audits/2026-11-21-mjrpalbumblender-v0-frontend-framework-analysis.md`): «Ok transforme a opiniao em fato checado e sim vamos com react, qual a vantagem de fazer a migracao e internacionalizacao juntas? O cms nao deveria surgir depois?»

## Requirements
- [REQ-01] «a escrever depois da medição numa tela real e da proposta de arquitetura» · fixes S-65

## Observable States
Nenhum novo: a migração não muda o que a tela mostra.

## Success Criteria
A escrever.

## Out of Scope
O Next.js e o Vue (análise de 2026-11-21); reescrever regras, serviços e o núcleo partilhado, que não dependem de tela.

## Open Questions
- A regra de convivência: tela nova ou redesenhada nasce em React; tela antiga migra quando for mexida — ou a migração é um esforço dedicado.
- Rotas, estado e formulários: o que do código da casa fica e o que vira biblioteca.
- A ordem com a F81 (idiomas): o agente recomenda as duas juntas, tela a tela; o CMS (F82) depois.
- A ADR que registra a adoção, com a aceitação do MJRP.
