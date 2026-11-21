---
status: Done
lane: fast
solution_type: fix
needs_human: "segurança: o token antigo do Discogs apagado — só pela palavra do MJRP, o agente não o testou; o histórico do git ainda guarda o token morto"
imports: []
fixes: ["UAT-17"]
planned_for: "[[ROADMAP#^REL-40]]"
---
<!-- docs/specs/features/Fxx-slug/spec.md — the folder is the feature (Fxx, two digits).
     status: In progress while the cycle runs; Done when every task is closed and every REQ has verified_by.
     imports: the requirement nodes this feature delivers (1..n), each Ready, each in no other open feature.
     A transversal NFR node constrains every feature (review it with constitution.md), so a product feature does not import
     it. The exception is an engineering feature (a refactor planned by an ADR, infrastructure): `solution_type: fix`, `fixes: [UAT-xx]` of the
     debt issues (required: the card takes its release from them), and `imports:` only the NFR it serves, named by a
     `violates:: [[NFR-xx-<slug>]]` in the Problem Statement — no story invented for it. A debt against a constitution
     article imports nothing and says `violates:: [[constitution#N]]` of an article that exists. -->
# Feature F66: O token do Discogs sai do repositório
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** O token de acesso ao Discogs deixa de estar escrito em arquivos do repositório: o token antigo é trocado no Discogs (deixa de valer) e os scripts passam a ler o token de uma variável de ambiente.

**Por quê:** Dois scripts versionados trazem o token escrito (`scripts/generate-dataset.js` e `scripts/fetch-missing-artists.js`). Quem tem o repositório tem o token. O app em produção não usa esses scripts nem o Discogs: eles serviram para montar, uma vez, o arquivo de álbuns da busca com autocompletar (`public/assets/data/`), lendo discografias do Discogs.

**Como saber que funcionou:** O token antigo responde «não autorizado» no Discogs; nenhum arquivo do repositório traz um token; o script, rodado sem a variável, para e diz o que falta.

## Problem Statement
O MJRP, em 2026-11-19: «Fatia D deixe pra depois, pode até abrir uma feat nova qqr coisa pra não impedir a issue de fechar, até pq nem me lembro o que seria essa feature com discogs». Era a fatia D da F59; saiu dela para a F59 poder fechar. Depende de uma ação dele: gerar um token novo no site do Discogs (ou apagar o antigo, se os scripts não forem mais usados). O token continua no histórico do git mesmo depois de sair dos arquivos; por isso a troca no Discogs é o que resolve.

## Requirements
<!-- Local IDs, two digits. Each REQ traces to an imported node; none is invented here.
     Functional and non-functional (performance, security, accessibility) alike are REQ-xx. -->
- [REQ-01] Nenhum arquivo versionado do repositório traz um token ou outra credencial escrita. · fixes UAT-17
  verified_by:: `test/security/noSecretsInRepo.test.js`
- [REQ-02] O token do Discogs que esteve escrito no repositório não vale mais no Discogs, e o token em uso fica fora do repositório. · fixes UAT-17
  verified_by:: [[uat#^UAT-17]]

## Observable States
<!-- What the imported nodes point_to: the screen state in info-arch.md (the prototype the human judged —
     PRINCIPLES.md §I.13) or the behavior state in behavior.md. N/A only if the nodes point to none. -->
N/A: não importa nenhum nó de requisito; conserta a issue UAT-17.

**Prototype**: none — MJRP, 2026-11-20 00:10: «eu dispenso prototipo por que estávamos arrumando e consertando problemas passados com pequenas melhorias e nao trabalhando em grande features nova, portanto por ora os prototipos estao dispensados.»

## Success Criteria
<!-- One measurable item per acceptance criterion of the imported nodes. -->
- Nenhum arquivo versionado traz um token: `git ls-files` não lista os dois scripts que o traziam e `test/security/noSecretsInRepo.test.js` passa (11 testes, 2026-11-20 17:38, na evidência).
- O token antigo do Discogs não vale mais: apagado pelo MJRP no Discogs em 2026-11-20 (palavra dele, na evidência); o agente não o testou.
- O token em uso fica no Secret Manager (`discogs-token`) e chega ao servidor como `DISCOGS_TOKEN`.

## Out of Scope
- Reescrever o histórico do git: o token antigo continua escrito nos commits anteriores à `f9d1abd`; está morto se foi apagado no Discogs. Não foi pedido nem feito.
- Reescrever os dois scripts: saíram do repositório na F65; o app nunca os usou.

## Open Questions
<!-- ALL resolved before Plan. -->
- O token antigo foi mesmo apagado no Discogs? — o MJRP disse que sim (2026-11-20 01:2x e 17:38, na evidência); o agente não conferiu. Fica na marca `needs_human` da spec.
