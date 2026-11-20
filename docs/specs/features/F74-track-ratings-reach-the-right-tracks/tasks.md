# Tasks — Feature F74: A nota de cada faixa chega à faixa certa · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

## Pre-Implementation
- [x] a feature priorizada pelo MJRP; só então o ramo (`fix/f74-track-ratings-reach-the-right-tracks`, da `main` local em `7d16022`)
- [x] a investigação antes do desenho: as 12 páginas da fonte lidas, cada faixa sem nota posta numa causa (`reports/evidence/F74/2026-11-20-track-identity-measure.md`)

## Implementation
- [x] TASK-01 a regra de identidade de faixa (`shared/trackIdentity.js`: degraus, notas que descrevem, escritas conhecidas, `matchTracks` de uma para uma, versão), com `test/shared/trackIdentity.test.js` · implements:: REQ-01, REQ-02, REQ-03, REQ-04 · model:: opus · rounds:: 1
- [x] TASK-03 o servidor pergunta à regra: `lib/trackIdentity.js`, `EnrichmentService`, `ranking.js`, `completeRanking.js`, `rankingPlan.js`, `fetchRanking.js`, `albumAnswer.js`, `GenerationService`; `shared/normalize.js` e os limpadores de `server/lib/normalize.js` saíram; teste antes (`test/server/trackRatings.test.js`) · implements:: REQ-04, REQ-07 · model:: opus · rounds:: 1
- [x] TASK-04 a página da edição: o raspador guarda o número da faixa e escolhe, pelas faixas, entre as páginas de mesmo nome (`pageOfTheEdition`; `candidatesOfTheSameName` em `shared/albumIdentity.js`); teste antes, com as páginas reais reduzidas (`test/server/scraperEdition.test.js`) · implements:: REQ-05 · model:: opus · rounds:: 1
- [x] TASK-05 o app pergunta à regra: `models/sameTrack.js`, `BEAEnrichmentHelper`, `SpotifyEnrichmentHelper`, `albumAverages`, `Album`, `UserRankingStrategy`, `BalancedRankingStrategy`, `TrackEnrichmentMixin`; `utils/NormalizationUtils.js` saiu; teste antes (`test/services/albums/trackRatings.test.js`) · implements:: REQ-04, REQ-07 · model:: opus · rounds:: 1
- [x] TASK-06 as notas guardadas de antes da regra são pedidas de novo: `trackRule` na resposta do servidor, no `AcclaimEnricher`, em `sourceOutcome` e no `AlbumCacheAdapter` · implements:: REQ-06 · model:: opus · rounds:: 1
- [x] TASK-07 a função de aptidão `test/architecture/trackIdentityRule.test.js`: os lugares que perguntam à regra, nenhuma chave de título de volta, a lista de degraus presa à versão · implements:: REQ-04 · model:: opus · rounds:: 1
- [x] TASK-09 a segunda fatia da regra (versão 2): os degraus `title-with-its-parts`, `first-of-titles-listed-together`, `letters-starred-out` e `title-in-its-brackets`, o que é só escrita e duas escritas conhecidas; teste antes (`test/shared/trackIdentitySecondSlice.test.js`) · implements:: REQ-08, REQ-09 · model:: opus · rounds:: 1
- [x] TASK-10 o número da faixa é o que a faixa traz (`position`), não o lugar na lista enviada · implements:: REQ-10 · model:: opus · rounds:: 1
- [x] TASK-11 o raspador lê títulos de uma letra e não corta o número de um título quando a página dá o número à parte; teste com as páginas reais reduzidas · implements:: REQ-11 · model:: opus · rounds:: 1

## Verification
- [x] TASK-02 medida antes e depois nos 12 álbuns (`scripts/measure-track-identity.mjs`: 96 notas antes, 12 delas em duas faixas e 2 de outro disco; 102 depois, de 105 que as páginas têm); suíte (2623 testes), lint e build verdes · implements:: REQ-01, REQ-02, REQ-03 · model:: opus · rounds:: 1
- [x] TASK-08 publicar o servidor e provar no navegador: feito pelo integrador em 2026-11-20 (servidor `mjrp-proxy-00208-kzm`, site de `8efa91c`; «Update ratings» nos 211 álbuns: 2106 de 2612 faixas com nota, a medida dos 12 álbuns confirmada) · implements:: REQ-01, REQ-02, REQ-05, REQ-06 · model:: opus · rounds:: 1
- [x] TASK-12 a segunda medida, nos 16 álbuns da segunda fatia (`node scripts/measure-track-identity.mjs --second`: 127 faixas com nota na versão 1, 149 depois); suíte (2667 testes), lint e build verdes · implements:: REQ-08, REQ-09, REQ-10, REQ-11 · model:: opus · rounds:: 1
- [x] TASK-13 segunda fatia publicada (servidor `mjrp-proxy-00209-prz`, site de `4350564`) e provada na conta do MJRP em 2026-11-20: «Close to the Edge» 3 de 3; inventário com 130 álbuns com nota em tudo, 66 em parte, 13 sem nenhuma · evidência: `reports/evidence/F74/2026-11-20-production-proof.md` · implements:: REQ-08, REQ-09, REQ-10, REQ-11 · model:: opus · rounds:: 1
- [ ] TASK-14 o passo retroativo da via rápida (a declaração dos documentos e o `verified_by` de cada REQ) e o julgamento do MJRP: «Aisle of Plenty» sem nota quando a fonte lista «The Cinema Show / Aisle Of Plenty» numa entrada só · implements:: REQ-01 · model:: sonnet · waiting:: human — falta o julgamento do MJRP e o passo retroativo · action:: o MJRP diz se as duas faixas recebem a mesma nota; o integrador fecha o passo retroativo

## Documentation
- [x] `docs/specs/behavior.md`: `^track-ratings-right-track` (nasce), `^local-album-cache` (muda)
- [x] `docs/specs/arch.md`: a seção «Uma regra só para dizer que é a mesma faixa (F74)» e o mapa de componentes
- [x] o manual: `23_Shared_Code.md`, `02_Server_Structure.md`, `03_Backend_API_Layer.md`, `04_Backend_Logic_Services.md`, `07_Frontend_Data_Infra.md`, `07b_Frontend_Utilities_and_Workers.md`, `08_Frontend_Models.md`, `00_Dir_File_Structure_Map.md`

## For the owner at UAT
- «In the Court of the Crimson King (Expanded Edition)»: cinco faixas com nota (93, 90, 93, 82, 93) e as três extras sem
- «High Voltage» (AC/DC): nove faixas com nota
- «Live At The Apollo (1962)»: «Lost Someone» fica sem nota (a fonte dá nota a duas metades); dizer se deve receber uma delas
- «Mirage (Deluxe Edition)»: seis faixas com nota, não dez; os remixes ficam sem
- «Close to the Edge» (Yes): as três faixas com nota
- «Selling England By the Pound»: «Aisle of Plenty» fica sem nota (a fonte dá uma nota só às duas últimas faixas); dizer se deve repetir a de «The Cinema Show»
