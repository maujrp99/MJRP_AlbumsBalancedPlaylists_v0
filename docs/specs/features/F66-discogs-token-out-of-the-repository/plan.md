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
`reports/evidence/F66/2026-11-20-token-out-of-the-repository.md`, `docs/manual/00_Deployment_and_Setup.md` § 2.4b, `uat.md` (UAT-17).

Declarações do passo retroativo da via rápida (conferidas no histórico do repositório em 2026-11-21; nenhum commit que cita a F66 toca estes arquivos além do registro do fecho):
- `docs/specs/constitution.md` — sem mudança
- `docs/specs/arch.md` — sem mudança: nenhum código novo
- `docs/specs/data-model.md` — sem mudança
- `docs/specs/tech-stack.md` — sem mudança: nenhuma dependência nova
- `docs/specs/design-system.md` — sem mudança: nenhuma tela
- `docs/specs/behavior.md` — sem mudança: nenhum comportamento do app mudou
- `docs/wiki/` — sem mudança: nenhuma página descreve uma regra do app que esta feature mudou

## Risks & Considerations
- O token antigo está no histórico do git, morto se foi apagado no Discogs; a única prova de que foi apagado é a palavra do MJRP.

## Test plan
> Derivado dos REQ do `spec.md` e dos critérios dos requisitos importados · 2026-11-21 11:39 (Brasília)

| REQ | Caso de teste | Critério / estado | Camada | Automatizado? |
|---|---|---|---|---|
| REQ-01 | `test/security/noSecretsInRepo.test.js` (a varredura de segredos nos arquivos versionados) | nenhum arquivo versionado traz credencial | teste de repositório | sim |

Bordas fora dos critérios (achados para a `mjrp-writing-reqs` se mudam o comportamento): Nenhuma.
