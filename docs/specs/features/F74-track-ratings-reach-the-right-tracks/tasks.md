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

## Verification
- [x] TASK-02 medida antes e depois nos 12 álbuns (`scripts/measure-track-identity.mjs`: 96 notas antes, 12 delas em duas faixas e 2 de outro disco; 102 depois, de 105 que as páginas têm); suíte (2623 testes), lint e build verdes · implements:: REQ-01, REQ-02, REQ-03 · model:: opus · rounds:: 1
- [x] TASK-08 servidor publicado (`mjrp-proxy-00208-kzm`) e site publicado (`8efa91c`) em 2026-11-20; prova na conta do MJRP: Crimson King 5 de 8, High Voltage 9 de 9; medida do inventário depois de «Update ratings» · evidência: `reports/evidence/F74/2026-11-20-production-proof.md` · implements:: REQ-01, REQ-02, REQ-05, REQ-06 · model:: opus · rounds:: 1
- [ ] TASK-09 segunda fatia: a regressão de «Close to the Edge» (título seguido da lista das suas partes) e as outras escritas achadas na medida de produção · implements:: REQ-01, REQ-02 · model:: opus · waiting:: human — a fatia está com o auxiliar no ramo `fix/f74-track-titles-second-slice` · action:: o integrador revisa, junta, publica o servidor e o site e refaz a medida

## Documentation
- [x] `docs/specs/behavior.md`: `^track-ratings-right-track` (nasce), `^local-album-cache` (muda)
- [x] `docs/specs/arch.md`: a seção «Uma regra só para dizer que é a mesma faixa (F74)» e o mapa de componentes
- [x] o manual: `23_Shared_Code.md`, `02_Server_Structure.md`, `03_Backend_API_Layer.md`, `04_Backend_Logic_Services.md`, `07_Frontend_Data_Infra.md`, `07b_Frontend_Utilities_and_Workers.md`, `08_Frontend_Models.md`, `00_Dir_File_Structure_Map.md`

## For the owner at UAT
- «In the Court of the Crimson King (Expanded Edition)»: cinco faixas com nota (93, 90, 93, 82, 93) e as três extras sem
- «High Voltage» (AC/DC): nove faixas com nota
- «Live At The Apollo (1962)»: «Lost Someone» fica sem nota (a fonte dá nota a duas metades); dizer se deve receber uma delas
- «Mirage (Deluxe Edition)»: seis faixas com nota, não dez; os remixes ficam sem
