# Tasks — Feature F75: Preço de CDs e onde comprar, no inventário · Plan: [[plan]]
**Approved**: pendente (o MJRP priorizou em 2026-11-20 01:32; o plano espera o julgamento dele)

## Pre-Implementation
- [x] ramo criado da `main` local (`6172c64`), depois de priorizada: `feat/f75-cd-prices-and-where-to-buy`
- [x] lidos o `AGENTS.md`, o `spec.md`, a proposta, o protótipo v5.1, o `info-arch.md` e o relatório de viabilidade (com os termos de uso da API do Discogs)
- [x] nomes de campo do Discogs conferidos em respostas reais (5 pedidos sem token, um a cada 2 a 3 segundos): busca e versões; a sugestão de preço exige o token e não foi chamada

## Implementation
- [x] TASK-01 o cartão no padrão da v5.1 (`views/renderers/InventoryCardValue.js`, `InventoryGridRenderer.js`) e as contagens como filtro (`views/InventoryView.js`, `InventoryController.handleStatusCount`); testes em `test/views/InventoryView.values.test.js` e `InventoryView.statusAndSeries.test.js` · implements:: REQ-01, REQ-02 · model:: opus · rounds:: 1
- [x] TASK-02 o valor escrito à mão, gravado no item (`models/inventoryValue.js`, `InventoryRepository.updateAlbum`), e os dois totais do cabeçalho (`views/renderers/InventoryValueHeader.js`); testes em `test/models/inventoryValue.test.js` e `test/repositories/InventoryRepository.value.test.js` · implements:: REQ-03, REQ-07 · model:: opus · rounds:: 1
- [x] TASK-03 «Where to buy» no cartão e na janela (`models/buyLinks.js`, `components/InventoryValueSection.js`); a ordem por valor (`models/inventorySort.js`) · implements:: REQ-11, REQ-12 · model:: opus · rounds:: 1
- [x] TASK-04 a fonte de valor do Discogs no servidor (`server/lib/valueSources/`, `lib/services/valueService.js`, `routes/values.js`), com o interruptor e a resposta tipada de cada falha; testes em `test/server/discogsSource.test.js` e `test/server/valueRoutes.test.js` · implements:: REQ-04, REQ-10, REQ-13 · model:: opus · rounds:: 1
- [x] TASK-05 a leitura no app (`services/inventory/InventoryValueService.js`, `controllers/InventoryValues.js`): a fila, a validade de seis horas, o aviso «Data provided by Discogs.», a janela com os três estados; testes em `test/services/inventory/InventoryValueService.test.js` e `test/controllers/InventoryController.values.test.js` · implements:: REQ-04, REQ-05, REQ-06, REQ-09, REQ-13 · model:: opus · rounds:: 1
- [x] TASK-06 as quatro moedas com o câmbio do dia (`server/lib/services/exchangeRates.js`, `models/inventoryValue.js`); sem a taxa, a tela mostra em dólar e diz por quê · implements:: REQ-08, REQ-13 · model:: opus · rounds:: 1

- [x] TASK-09 **decidido pelo MJRP em 2026-11-21** (REQ-14): a leitura do Discogs guardada no item (`discogsReading`): o repositório (`InventoryRepository.setReadings`), a regra (`models/inventoryValue.js`: a leitura guardada com a data, sem esconder pela idade) e o serviço que grava ao ler; o teste antigo «o repositório não tem porta para o preço» passa a dizer o contrato novo · implements:: REQ-14 · model:: opus · rounds:: 3 · evidência: `discogsReading` em `shared/data/InventoryRepository.js` e `public/js/models/inventoryValue.js`; a terceira reconferência do juiz independente passou (`reports/audits/2026-11-21-mjrpalbumblender-v0-inventory-values-kept-visual-parity-recheck-3.md`, 0 P0, 0 P1); em produção desde 2026-11-22 00:11 (`docs/log.md`)
- [x] TASK-10 **decidido pelo MJRP em 2026-11-21** (REQ-15): «Update values» e «Read them now» atualizam (a guarda de seis horas, a leitura mais nova vence, o que só o navegador tem vai ao banco na rodada); o aviso conta só quem nunca foi lido · implements:: REQ-15 · model:: opus · rounds:: 3 · evidência: a mesma reconferência (a terceira, que passa) e a publicação de 2026-11-22 00:11 (`docs/log.md`)
- [x] TASK-11 **decidido pelo MJRP em 2026-11-21** (REQ-16): «Read on <date>» na janela do álbum e na linha de origem do cartão; provas no navegador a 1280 e 393 px, sem banco de verdade · implements:: REQ-16 · model:: opus · rounds:: 3 · evidência: a mesma reconferência, com as capturas em `reports/evidence/F75/values-kept/recheck-3/`

## Verification
- [x] TASK-07 suíte (2852 testes), lint e build verdes; o desenho do cartão e da janela conferido num navegador com o CSS do build, sem conta e sem servidor, a 1440 e a 390 px · implements:: REQ-01, REQ-02, REQ-03, REQ-07, REQ-08, REQ-11, REQ-12 · model:: opus · rounds:: 1
- [x] TASK-08 ligar a fonte e provar em produção: o servidor e o site da `70e63da` estão no ar, a revisão `mjrp-proxy-00213-qpq` recebe o secret `discogs-token` como `DISCOGS_TOKEN`; a leitura na conta do MJRP deu valor a 198 de 211 álbuns (`reports/evidence/F75/2026-11-20-production-proof.md`). Não verificado: a tela do site publicado, com login, não foi aberta pelo agente (a prova foi o app local falando com o servidor de produção) · implements:: REQ-04, REQ-05, REQ-06, REQ-09, REQ-10, REQ-13 · model:: opus · rounds:: 1

## Documentation
- [x] `docs/specs/behavior.md`: a seção «Inventário» (`^inventory-value-card`, `^inventory-value-totals`, `^inventory-value-update`, `^inventory-value-switch`, `^inventory-where-to-buy`)
- [x] `docs/specs/data-model.md`: `value` e `discogs` no item; a leitura do Discogs e o câmbio nos dados locais do navegador
- [x] `docs/specs/arch.md`: «A fonte de valor do Discogs e o seu interruptor (F75)»
- [x] `docs/specs/info-arch.md`: os estados construídos e os que o protótipo não mostrava
- [x] `docs/manual/00_Deployment_and_Setup.md` (as variáveis, os comandos do interruptor) e `docs/manual/21_Dynamic_UI_Mapping.md` (o inventário)

## For the owner at UAT
- julgar as doze decisões «decidido pelo agente — revisável» do `plan.md`, em especial: abrir o inventário não lê nada sozinho; o preço pago saiu do cartão
- decidir se `DISCOGS_VALUES_FOR` fica definida com o id dele (os termos do Discogs dão o preço para uso pessoal)
- a primeira rodada de «Update values» dirá quantos dos 211 álbuns têm edição em CD e sugestão de preço
