# Plan — Feature F87: Um ambiente separado para validar o site antes da produção · Spec: [[spec]]
**Approved**: pendente

## Architecture Approach
Fatia A (escolhida pelo MJRP em 2026-11-21): `scripts/deploy-preview.sh`, com as mesmas verificações de `deploy-site.sh` (lint, testes, build, conferência do build), termina com `firebase hosting:channel:deploy <canal> --expires 7d` e mostra o endereço. Fatia B (não escolhida): um segundo projeto Firebase, seu Firestore, seu Cloud Run, segredos e endereços de retorno; pediria um ADR.

## Technical Design
Esboço. As funções de preparar, construir e conferir saem de `deploy-site.sh` para `scripts/lib/site-build.sh`, usado pelos dois scripts. O script da prévia não tem passo de produção.

## Dependencies
A versão em React (F83) e a nova home são o que se quer validar.

## Documents Consulted
`docs/specs/arch.md` § Delivery strategy, `scripts/deploy-site.sh`, `firebase.json`.

## Risks & Considerations
A prévia usa os dados e o login reais: uma escrita errada nela é escrita na produção (REQ-04).
