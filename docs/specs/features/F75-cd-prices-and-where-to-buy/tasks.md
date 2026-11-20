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

## Verification
- [x] TASK-07 suíte (2852 testes), lint e build verdes; o desenho do cartão e da janela conferido num navegador com o CSS do build, sem conta e sem servidor, a 1440 e a 390 px · implements:: REQ-01, REQ-02, REQ-03, REQ-07, REQ-08, REQ-11, REQ-12 · model:: opus · rounds:: 1
- [ ] TASK-08 ligar a fonte e provar em produção · implements:: REQ-04, REQ-05, REQ-06, REQ-09, REQ-10, REQ-13 · model:: opus · waiting:: human — a chamada de preço do Discogs exige o token, que só o integrador mapeia, e a prova pede a conta do MJRP · action:: mapear `discogs-token` em `DISCOGS_TOKEN`, publicar o servidor e depois o site, e provar no navegador com a conta do MJRP

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
