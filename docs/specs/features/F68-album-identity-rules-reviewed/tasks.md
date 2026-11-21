<!-- docs/specs/features/Fxx-slug/tasks.md — WHEN. Every TASK implements at least one REQ of the spec beside
     it; every REQ is implemented by at least one TASK. -->
# Tasks — Feature F68: As regras de identidade de álbum revistas, fáceis de ler e de manter · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

## Pre-Implementation
- [x] create the branch `fix/f68-album-identity-rules-reviewed` (da ponta da `main` local, `de43bf7`)
- [x] verify the spec and the plan of F68 passed their cross-checks (and were approved, where gated): via rápida, sem portão; o `spec.md` e o `plan.md` foram escritos depois do código, e o MJRP julga

## Implementation
<!-- Atomic (one focused session), verifiable (a clear "done"), ordered by dependency: data → logic →
     components → composition → polish. -->
<!-- Marks, after `implements::`, separated by ` · `:
     model:: sonnet|opus — MANDATORY on every task; the author of this file decides, the implementer never does.
                        sonnet = MECHANICAL: texts and registry keys, summaries, format samples and tests, derived
                        files, renames. opus = code design, architecture, critique, visual recheck. There is no
                        default: a task without the mark fails the cross-check.
     rounds:: N       — written when the task CLOSES ([x]): how many Execute ⇄ Verify rounds it took (ceiling 3).
                        `python3 mjrp-scripts/loop.py --check-tasks tasks.md` fails a closed task without it. -->
- [x] TASK-01 a verdade da fonte: 56 pedidos educados a `suggest.php` do BestEverAlbums para os 16 álbuns da varredura e os casos anteriores, guardados como vieram em `test/fixtures/besteveralbums/suggest/`, e a tabela em `test/fixtures/besteveralbums/sweep-2026-11-19.json` — cada álbum tem o que a fonte tem, por que era recusado e o que deve acontecer · implements:: REQ-06 · model:: opus · rounds:: 1
- [x] TASK-02 `shared/albumIdentity.js` reescrito em sete seções, de cima a baixo: normalização; `ARTIST_EQUIVALENCES` e `sameArtist`; notas de edição, `firstTier`, `SECOND_TIER_RULES` e `KNOWN_WRITINGS`; `compareAlbumIdentity` e `REASONS_EXPLAINED`; `pickAlbum`, `compareKeptAlbum`, `compareOnlyAnswer` e a porta `acceptedAlone`; os leitores de rótulo; `titleWithoutEditionNotes` e `titlesToSearch`; o cabeçalho com a tabela dos motivos, «How to add a rule» e a regra de um gênero — `test/shared/albumIdentityRules.test.js` e `test/shared/albumIdentity.test.js` passam · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-09 · model:: opus · rounds:: 2
- [x] TASK-03 `server/lib/scrapers/besteveralbums.js`: a busca por tentativas ordenadas e nomeadas (`locateAlbum`, `searchAttempts`, `albumFromSuggest`, `albumFromArtistPage`, `albumFromHtmlSearch`), com os títulos de `titlesToSearch`; saem `_standardFindAlbumId`, `_fuzzyFindAlbumId` e o corte de título por conta própria — `test/server/ratingsSourceSweep.test.js` e `test/server/scraperIdentity.test.js` passam · implements:: REQ-05, REQ-06 · model:: opus · rounds:: 1
- [x] TASK-04 um só «título sem notas de edição»: `cleanTitle` sai de `server/lib/normalize.js` e de `public/js/utils/NormalizationUtils.js`; `server/lib/services/spotifyPopularity.js` e `public/js/services/SpotifyService.js` usam o `titleWithoutEditionNotes` da regra — `test/models/askedAlbumOtherSources.test.js` e `test/server/spotifyAlbumIdentity.test.js` passam · implements:: REQ-05, REQ-02 · model:: sonnet · rounds:: 1
- [x] TASK-05 `public/js/models/askedAlbum.js`: `identityNotice` com uma frase por regra do segundo degrau (`IDENTITY_NOTICES`) — `test/components/ui/AlbumCardIdentityNote.test.js` passa · implements:: REQ-04 · model:: sonnet · rounds:: 1
- [x] TASK-06 a versão da regra no «não tem»: `IDENTITY_RULE_VERSION` ao lado da regra; `server/lib/services/EnrichmentService.js` carimba o `not_found` (`identityRule`); `adapters/enrichers.js` devolve `rule`; `AlbumLoadService._publishSource` repassa; `adapters/AlbumCacheAdapter.js` guarda e confere na leitura — `test/services/albums/emptyTrust.test.js` e `test/server/ratings.test.js` passam · implements:: REQ-07 · model:: opus · rounds:: 1
- [x] TASK-07 `test/architecture/albumIdentityRule.test.js`: a porta única do segundo degrau, as regras que não constroem veredito, as listas e a versão lado a lado, o limpador único, nenhum lugar nomeia um motivo do segundo degrau · implements:: REQ-08 · model:: opus · rounds:: 1

## Verification
- [x] TASK-08 suíte (`npx vitest run`: 1343 testes, 110 arquivos; eram 1217, 107), `npx vite build`, e `npx eslint --rule 'complexity: [2, 10]' shared/albumIdentity.js` sem nenhuma função acima de 10 · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07, REQ-08, REQ-09 · model:: sonnet · rounds:: 1
- [x] TASK-09 rodar de novo, em produção e com a conta do MJRP, a varredura da fonte de notas (o trecho de console está no `plan.md`, «A prova em produção»): `not_found` só para os álbuns 3, 9, 11, 12, 13 e 16 da tabela do plano; `await albumIdentityAudit()` com `different: 0`; a linha nova do cartão vista num álbum do segundo degrau — prova: `reports/evidence/F68/2026-11-19-identity-rules-reviewed-proof.md` · implements:: REQ-10, REQ-04, REQ-07 · model:: opus · rounds:: 1
- [ ] TASK-10 o que a trava do passo retroativo ainda cobra antes do `Done` (`python3 mjrp-scripts/retro_step_check.py . --staged` com a feature em `Done`, conferido em 2026-11-21): Reconferência visual: a feature mexeu na tela e não há relatório `visual-parity-recheck` nem nota de Touch ID (`mjrp-visual-ok`) que a cubra. É trabalho de agente; nenhum item é do MJRP. O que falta de verdade é a reconferência visual independente (relatório `reports/audits/<data>-F68-visual-parity-recheck.md`, por quem não implementou, num navegador): nenhum merge traz nota de Touch ID. «Prototype: none» já está gravada na spec (MJRP, 2026-11-20 00:10). · implements:: REQ-01 · model:: opus

## Documentation
- [x] update the specs affected (`docs/specs/arch.md`: a seção de identidade reescrita como uma descrição só; `docs/specs/behavior.md`: a linha do cartão e o prazo do «não tem»; no manual: `23_Shared_Code.md`, `02_Server_Structure.md`, `04_Backend_Logic_Services.md`, `06_Frontend_Data_Store.md`, `07_Frontend_Data_Infra.md`, `07b_Frontend_Utilities_and_Workers.md`, `08_Frontend_Models.md`, `10_Frontend_Renderers.md`, `24_Test_Suite.md`)
- [x] mark F68 Done in spec.md · commit: feat: implement album-identity-rules-reviewed (só depois da prova em produção, TASK-09) — a prova em produção existe; `status: Done` posto

## For the owner at UAT
- Falta o que a tarefa aberta acima descreve (trabalho de agente); o aceite é dele no UAT, depois do `Done`.
