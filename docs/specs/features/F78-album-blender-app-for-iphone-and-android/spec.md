---
status: Draft
lane: standard
solution_type: feature
imports: ["[[S-60-use-the-album-blender-as-an-app-from-the-store]]"]
planned_for: "[[ROADMAP#^REL-41]]"
---
# Feature F78: O Album Blender como app para iPhone e Android
**Approved**: pendente

## Summary
**A feature:** Um app do Album Blender para iPhone e Android, em React Native com Expo, com as mesmas contas e dados do site.

**Por quê:** O MJRP quer evoluir o produto para as lojas de apps, nas duas plataformas.

**Como saber que funcionou:** A escrever com a proposta de arquitetura: o primeiro marco é o app instalado no iPhone e num Android de teste, com as séries e os álbuns da conta.

## Problem Statement
Dito pelo MJRP em 2026-11-20: «gostaria de considerar Android e ser pública … Seria uma evolução do produto» e «Vamos criar a V6.0 para implementação da app». O estudo de viabilidade diz o que trava um lançamento público (Spotify, preço do Discogs, autorização do BestEverAlbums); esta feature constrói o app, e o lançamento público é uma decisão à parte.

## Requirements
- [REQ-01] «a escrever depois da proposta de arquitetura: as fatias do app (base e conta; Albums e janela do álbum; ranking; playlists com Apple Music; inventário) viram requisitos» · fixes S-60

## Observable States
A escrever.

## Success Criteria
A escrever.

## Out of Scope
A escrever.

## Open Questions
- A pilha: React Native com Expo é a recomendação do agente; o MJRP perguntou «pq não flutter?». A decisão vira ADR depois da proposta de arquitetura (a resposta do agente está no log de 2026-11-20).
- O que fica de fora do primeiro marco: Spotify (acesso público travado), preço do Discogs.
- Apple Music no Android: o SDK da Apple para Android parece parado; medir antes de prometer.
- O núcleo de regras (receitas, ranking, identidade) vai para `shared/` e o site passa a usá-lo de lá: é pré-requisito, e vale por si.
- Contas de desenvolvedor da Apple e do Google: são do MJRP.
