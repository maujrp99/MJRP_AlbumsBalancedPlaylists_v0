---
status: Draft
lane: standard
solution_type: feature
imports: ["[[S-63-use-the-album-blender-in-my-language]]"]
planned_for: "[[ROADMAP#^REL-41]]"
---
# Feature F81: O site em mais de um idioma
**Approved**: pendente

## Summary
**A feature:** O site passa a existir em mais de um idioma, com a escolha do idioma e os textos fora do código.

**Por quê:** Hoje o site só existe em inglês; o produto vai a público (v6.0) e o dono é brasileiro.

**Como saber que funcionou:** A escrever com a proposta.

## Problem Statement
Dito pelo MJRP em 2026-11-21: «As próximas features agora serao de internacionalizar o site e criar um admin como temos nos sites do MJRP personal, utilizando o CMS-kit nosso.»

## Requirements
- [REQ-01] «a escrever depois das conversas com o MJRPpersonal e o harness e da proposta de arquitetura» · fixes S-63

## Observable States
A escrever.

## Success Criteria
A escrever.

## Out of Scope
A escrever.

## Decided by the owner
- **Como o idioma é escolhido** (MJRP, 2026-11-21 09:05, Control Center, lote `reports/proposals/2026-11-21-0845-v0-pending-decisions.md`, D-03): «De acordo com a geo location primeiro e depois a selecao do user toma precedencia».
- Como foi lido pelo agente: na primeira visita o idioma vem do lugar de onde a pessoa acessa (Brasil → português do Brasil; outro lugar → inglês); quando a pessoa escolhe um idioma, a escolha dela vale dali em diante, acima do lugar. Os idiomas são inglês e português do Brasil.
- O que ele não disse, decidido pelo agente — revisável: sem saber o lugar, o site abre em inglês (é o idioma de hoje); a escolha da pessoa fica guardada no aparelho e, com conta, na conta.
- A conferir na proposta: de onde vem o lugar (o país que o Firebase Hosting ou o servidor informa, sem pedir a localização ao navegador) e o que os buscadores veem.

## Open Questions
- De onde vêm os textos: arquivos no repositório, ou o admin (F82) com o CMS-kit.
- O que não se traduz: nomes de álbuns, artistas e faixas, que vêm dos catálogos.
- A página de entrada (F80) e o app (F78) entram nesta feature ou em outra.
- Como o MJRPpersonal internacionalizou os sites dele: o que se reaproveita.
