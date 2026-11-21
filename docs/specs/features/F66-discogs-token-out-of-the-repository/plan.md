<!-- docs/specs/features/Fxx-slug/plan.md — HOW. No edge of its own in the graph: the trace to the REQs is the
     cross-check before approval. -->
# Plan — Feature F66: O token do Discogs sai do repositório · Spec: [[spec]]
**Approved**: not a gate (via rápida; o MJRP julga)

## Architecture Approach
<!-- How it fits arch.md; components affected; what this plan refines in arch.md and data-model.md. -->
O conserto aconteceu por outros caminhos, antes de a F66 ser construída, e esta feature só o registra e fecha (decidido pelo agente — revisável; o MJRP disse em 2026-11-20: «a f66 creio que pode fechar, pq resolvemos ontem a questao do token da discogs, apaguei o antigo e colocamos no novo»): os dois scripts com o token saíram na F65 (`f9d1abd`), junto com a varredura de segredos como teste; o MJRP apagou o token antigo no Discogs e criou o secret `discogs-token` (F75). Nada muda no `arch.md` nem no `data-model.md`.

## Technical Design
<!-- Data flow first · components/modules (what each receives, renders or returns, emits) · API/interface
     changes · explicit file paths. Each component names the REQ-xx it addresses. -->
Nenhum código novo. REQ-01: `test/security/noSecretsInRepo.test.js` e `test/security/support/secretScan.js` (F65). REQ-02: o secret `discogs-token` no Secret Manager, mapeado em `DISCOGS_TOKEN` (F75, `docs/manual/00_Deployment_and_Setup.md` § 2.4b).

## Dependencies
<!-- New dependencies with their justification — aligned with constitution.md and PRINCIPLES.md (Constitution
     Check); contradicting either needs a recorded decision first (mjrp-recording-decisions). -->
Nenhuma.

## Documents Consulted
<!-- arch.md, data-model.md, info-arch.md, behavior.md, design-system.md, constitution.md, the NFR nodes. -->
«a escrever: arch.md, data-model.md, info-arch.md, behavior.md, design-system.md, constitution.md, os NFR»

## Risks & Considerations
«a escrever: riscos e o que mais pesa, ou "Nenhum conhecido."»

## Test plan
> Derivado dos REQ do `spec.md` e dos critérios dos requisitos importados · «a escrever: data e hora de Brasília»

| REQ | Caso de teste | Critério / estado | Camada | Automatizado? |
|---|---|---|---|---|
| REQ-01 | «a escrever: o caso de teste que prova o REQ» | «a escrever: critério do nó ou estado observável» | «a escrever: camada» | «a escrever: sim ou não» |

Bordas fora dos critérios (achados para a `mjrp-writing-reqs` se mudam o comportamento): «a escrever: ou "Nenhuma."»
