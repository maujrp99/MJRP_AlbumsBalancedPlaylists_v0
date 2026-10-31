---
status: Accepted
lane: standard
solution_type: feature
imports: []
epic: EP-09
sprint: SPR-6
planned_for: "[[ROADMAP#^REL-19]]"
delivered_by: ["143d0d8", "a046143", "64bec24", "18fbfc4", "0d1d57f"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# Feature F20: Sprint 6: Authentication (Apple & Google) + Persistence + Data Enrichment
**Approved**: not a gate (histórico anterior ao harness; reconstruída do de-para aprovado, `docs/specs/board-mapping.json`)

## Summary
**A feature:** o que a pasta SDD da Sprint 6: Authentication especificou e o trabalho implementou — a lista em `## Functionalities`. Os arquivos SDD originais estão em `legacy/`, sem reescrita.

**Por quê:** o objetivo que a spec original declara, em `legacy/`. É histórico anterior ao harness, reconstruído do de-para aprovado sem inventar o que a sprint não escreveu.

**Como saber que funcionou:** cada funcionalidade traz a evidência que o projeto deixou (a tarefa marcada, o commit, a linha do CHANGELOG); o que foi especificado e não foi feito ficou fora da lista.

**Versões do produto:** REL-17 (Versão do produto v2.1.1), REL-18 (Versão do produto v2.2.0), REL-19 (Versão do produto v2.2.1); mora na REL-19, a última.

**Épico:** EP-09 (também EP-08).

## Functionalities
- Entrar com a conta Google (popup) e sair — *evidência:* roadmap Sprint 6 «Google Sign-In»; commit 143d0d8 (AuthService e testes); tag prod-google-login-implemented
- Entrar com a conta Apple — *evidência:* roadmap Sprint 6 «Apple Sign-In»; commits a046143, 64bec24; CHANGELOG arquivado v2.2.1 «Final CSP fixes for Apple Sign-In»
- Perfil do usuário em /users/{uid} (nome, e-mail, último login) e estado do usuário (UserStore) — *evidência:* AuthService.js e UserStore.js (+ UserStore.test.js) no código; commit 18fbfc4 «stabilize Sprint 6 features»
- Dados da pessoa (séries, álbuns, playlists, inventário) guardados sob a conta (/users/{uid}/...) — *evidência:* commit 18fbfc4; Repositórios com escopo de usuário; DataSyncService.js no código
- Dataset estático enriquecido com capas (Discogs) e discografia expandida para o autocomplete — *evidência:* sprint-6-data-enrichment §3; commits a046143 «data enrichment script», 0d1d57f «coverUrl from albums-expanded.json»

## Sources
- `legacy/sprint-6-auth-spec.md` (spec) ← `docs/specs/sprint-6-auth-spec.md` em `143d0d8`
- `legacy/sprint-6-auth-plan.md` (plan) ← `docs/specs/sprint-6-auth-plan.md` em `143d0d8`
- `legacy/sprint-6-data-enrichment.md` (spec) ← `docs/specs/sprint-6-data-enrichment.md` em `a046143`
