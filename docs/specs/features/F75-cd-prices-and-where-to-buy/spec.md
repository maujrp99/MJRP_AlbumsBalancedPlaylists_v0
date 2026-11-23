---
status: Done
lane: standard
solution_type: feature
needs_human: "decidir: as doze decisões «decidido pelo agente — revisável» do plan.md e se `DISCOGS_VALUES_FOR` fica definida com o id dele"
imports: ["[[S-57-see-what-a-cd-costs-and-where-to-buy-it]]"]
planned_for: "[[ROADMAP#^REL-40]]"
---
# Feature F75: Preço de CDs e onde comprar, no inventário
**Approved**: pendente (o MJRP priorizou em 2026-11-20 01:32, com o protótipo v5.1 escolhido, e saiu; o plano e as decisões do agente esperam o julgamento dele)

> **Nota de 2026-11-23 (arrumação do board).** As telas feitas à mão que esta spec cita (arquivos de `public/js/views/` e `public/js/components/`) não existem mais: o site foi reescrito em React (F83, em produção desde 2026-11-23) e as telas moram em `public/js/screens/` e `public/js/ui/`. Os nomes de arquivo abaixo são históricos; o comportamento pedido continua valendo. As tarefas TASK-09 a TASK-11 (a leitura do Discogs guardada no banco) foram construídas, julgadas por agente separado e publicadas em 2026-11-22 (`docs/log.md`, 00:11); marcadas hoje no `tasks.md`, com a evidência. O que segue aberto é do MJRP: as doze decisões «revisáveis» do plano.

## Summary
**A feature:** Cada álbum do inventário mostra quanto custa o CD e traz o link de compra na Amazon, no Discogs e na iMusic; a busca vale para um álbum ou para o inventário inteiro.

**Por quê:** O MJRP quer decidir o que comprar e onde, e no futuro entrar em programas de afiliação.

**Como saber que funcionou:** Com a fonte ligada, «Update values» lê os 211 álbuns do inventário dele sem travar a tela e o fim diz quantos têm valor; os dois totais do cabeçalho somam o que ele tem e o que falta; com a fonte desligada, nada do Discogs aparece e o resto segue.

## Problem Statement
Pedido do MJRP de 2026-11-20 00:14. A viabilidade foi conferida antes de qualquer desenho: `reports/audits/2026-11-20-mjrpalbumblender-v0-cd-prices-feasibility.md`. Links de compra: viáveis nos três. Preço: só o Discogs entrega hoje; a Amazon exige conta de afiliado com vendas; a iMusic não tem interface pública.

**Propósito, dito pelo MJRP em 2026-11-20 00:14:** estimar o valor do inventário. O preço vem sozinho e a pessoa pode alterá-lo à mão, como já faz hoje.

O que isso decide no desenho (decidido pelo agente — revisável):
- O valor de um item tem origem: lido de uma loja (qual, quando) ou escrito pela pessoa. O que a pessoa escreveu nunca é trocado por uma leitura automática.
- O total do inventário soma o valor de cada item e diz quantos itens entraram na soma e quantos ficaram sem valor.
- Para estimar valor de coleção, a fonte certa no Discogs é a sugestão de preço por estado do disco (exige a conta dele); o menor preço anunciado é um piso, não uma estimativa.

**Respostas do MJRP em 2026-11-20 00:22:**
1. Conta do Discogs: «sim tenho conta lá e aceitaria» ligar um token.
2. Estado do disco: «poderíamos guardar o valor de 3 estados e apresentar os 3 e a media».
3. Edição: «vamos começar com a mais comum numa primeira iteracao e depois melhoramos».
4. Moeda: «USD, Euro, Libra (os 3 mais comuns no discogs) e Real, creio que precisamos ter o cambio do dia pra calcular de USD pra real».
5. Rumo: «dar um foco para colecionador vai impactar bastante nessa funcionalidade de inventory … precisamos depois pesquisar e fazer benchmark de apps que já fazem esse controle de inventário de coleção de CDs e Vinis e fitas cassete».

Conferido em 2026-11-20: uma fonte pública de câmbio (`api.frankfurter.app`, taxas de referência do dia, sem chave) respondeu com USD para BRL, EUR e GBP.
Termos de uso da API do Discogs lidos em 2026-11-20 01:24 (relatório de viabilidade, última seção): o preço é dado restrito, de uso pessoal e não comercial; não pode servir para levar tráfego a outras lojas; não pode ser mostrado com mais de seis horas de atraso nem guardado além do necessário; exige o aviso «Data provided by Discogs.» com link. A proposta precisa mudar: o valor do Discogs é relido, não guardado por semanas; e juntá-lo com links de afiliado de outras lojas depende de autorização escrita do Discogs.

**Decisões do MJRP em 2026-11-20 01:32:** opção B («pra fazer um full teste, depois eu abro outra feature pra desligar o discogs, poderiamos usar feature toggle aqui»): o valor do Discogs entra já, em uso pessoal, atrás de um interruptor. O cartão é o da v5.1 (`design/inception/inventory-value-v5.1.html`). O token novo do Discogs está no Secret Manager (`discogs-token`).

**Decidido pelo agente — revisável (a parte sobre guardar o valor foi REVERTIDA pelo MJRP em 2026-11-21, REQ-14):** os três estados são «Mint», «Near Mint» e «Very Good Plus»; o valor do Discogs não é gravado no Firestore (os termos pedem que não seja guardado além do necessário nem mostrado com mais de seis horas): fica só no navegador, por até seis horas; o que se grava no item é o valor que a pessoa escreve e qual edição do Discogs foi usada; as perguntas ao virar «Owned» (quanto pagou, estado do disco) ficam fora desta feature.

## Requirements
- [REQ-01] O cartão do inventário segue o padrão da v5.1: uma superfície com a capa até as bordas e cinco linhas iguais em todo cartão: o rótulo do valor conforme o status («In my collection · worth» ou «Not mine yet · costs»), a origem e o valor, as duas médias, o rótulo das ações, as ações. · fixes S-57
  verified_by:: `test/views/InventoryView.values.test.js`
- [REQ-02] As contagens por status do cabeçalho são botões que filtram o inventário por aquele status; o seletor de status sai da barra. · fixes S-57
  verified_by:: `test/views/InventoryView.values.test.js`
- [REQ-03] A pessoa escreve o valor de um álbum na janela dele; esse valor aparece com a origem «written by you», é gravado no item e nunca é trocado por uma leitura. Ela pode voltar ao valor do Discogs. · fixes S-57
  verified_by:: `test/models/inventoryValue.test.js`, `test/repositories/InventoryRepository.value.test.js`
- [REQ-04] O app lê do Discogs, pelo servidor, a sugestão de preço da edição em CD mais comum do álbum, nos estados «Mint», «Near Mint» e «Very Good Plus»; o valor do álbum é a média dos três; a janela mostra os três, a média, a edição usada e quando foi lido. · fixes S-57
  verified_by:: `reports/evidence/F75/2026-11-20-production-proof.md`, `test/controllers/InventoryController.values.test.js`, `test/server/discogsSource.test.js`, `test/server/valueRoutes.test.js`, `test/services/inventory/InventoryValueService.test.js`
- [REQ-05] ~~Um valor do Discogs só é mostrado se foi lido há menos de seis horas, e não é guardado além disso.~~ **Substituído em 2026-11-21 pelo REQ-14 a REQ-16, por decisão do MJRP** («quero os dados persistidos sim e o botão serviria para atualizar valores»). Das seis horas fica só uma guarda: o navegador não pergunta duas vezes ao Discogs, em seguida, pelo mesmo álbum (REQ-15). · fixes S-57
  verified_by:: `reports/evidence/F75/2026-11-20-production-proof.md`, `test/controllers/InventoryController.values.test.js`, `test/services/inventory/InventoryValueService.test.js`
- [REQ-06] Ao lado de todo valor vindo do Discogs aparece «Data provided by Discogs.», com link para a página do Discogs daquela edição; o app diz, à vista, que usa a API do Discogs e não é afiliado a ele. · fixes S-57
  verified_by:: `reports/evidence/F75/2026-11-20-production-proof.md`, `test/controllers/InventoryController.values.test.js`, `test/services/inventory/InventoryValueService.test.js`
- [REQ-07] O cabeçalho mostra «Estimated value of what I own» e «To buy the rest», cada um com quantos álbuns entraram na soma («N of M»). · fixes S-57
  verified_by:: `test/models/inventoryValue.test.js`, `test/repositories/InventoryRepository.value.test.js`
- [REQ-08] A pessoa escolhe a moeda (USD, EUR, GBP, BRL); os valores são convertidos pelo câmbio do dia, e fora do dólar a tela diz a taxa usada. Sem a taxa, a tela mostra em dólar e diz por quê. · fixes S-57
  verified_by:: `test/models/inventoryValue.test.js`, `test/server/valueRoutes.test.js`
- [REQ-09] «Update values» lê os valores de todo o inventário respeitando o limite de pedidos do Discogs, mostra o progresso, pode ser parado e não trava a tela; um álbum que entra no inventário sem valor é lido na vez seguinte, e a tela diz quantos esperam. · fixes S-57
  verified_by:: `reports/evidence/F75/2026-11-20-production-proof.md`, `test/controllers/InventoryController.values.test.js`, `test/services/inventory/InventoryValueService.test.js`
- [REQ-10] O valor do Discogs tem um interruptor no servidor: desligado, sem publicar código de novo, o app não mostra valor, botão nem aviso do Discogs, e o valor escrito à mão, o total e os links de compra seguem funcionando. · fixes S-57
  verified_by:: `reports/evidence/F75/2026-11-20-production-proof.md`, `test/server/discogsSource.test.js`, `test/server/valueRoutes.test.js`
- [REQ-11] «Where to buy»: no cartão do álbum que a pessoa não tem, três links (Discogs, Amazon, iMusic) numa busca pronta por artista, título e CD; no cartão do que ela tem, um link que abre a janela do álbum; na janela, os três links. · fixes S-57
  verified_by:: `test/views/InventoryView.values.test.js`
- [REQ-12] O inventário ordena pelo valor, nas duas direções; o álbum sem valor fica no fim. · fixes S-57
  verified_by:: `test/models/inventorySort.test.js`
- [REQ-13] Cada falha diz o que houve e nada é inventado: o Discogs não tem edição em CD, o Discogs não respondeu, o limite de pedidos foi atingido, o token foi recusado, o câmbio não chegou. · fixes S-57
  verified_by:: `reports/evidence/F75/2026-11-20-production-proof.md`, `test/controllers/InventoryController.values.test.js`, `test/server/discogsSource.test.js`, `test/server/valueRoutes.test.js`, `test/services/inventory/InventoryValueService.test.js`
- [REQ-14] **Decidido pelo MJRP em 2026-11-21** («quero os dados persistidos sim e o botão serviria para atualizar valores»; à pergunta «guardar no banco já (a), ou ler sozinho ao abrir e pedir autorização ao Discogs antes de guardar (b)?»: «1.a»). A leitura do Discogs de um álbum é guardada no banco, no documento do item da pessoa, só dela: o que o cache do navegador guarda hoje (os três estados, ou o menor preço e quantos à venda; a moeda; a edição e o link; de que tipo foi a leitura) e o momento em que foi lida. Nunca se mistura com o valor que a pessoa escreveu, que continua vencendo. Abrir o inventário, em qualquer aparelho da pessoa, mostra o valor guardado na hora, e o aviso «N albums are waiting for a value» conta só os álbuns que nunca tiveram leitura. O servidor continua sem guardar nada. · fixes S-57
  verified_by:: `test/repositories/InventoryRepository.value.test.js`, `test/models/inventoryValue.test.js`, `test/controllers/InventoryController.values.test.js`
- [REQ-15] **Decidido pelo MJRP em 2026-11-21.** «Update values» e «Read them now» ATUALIZAM: leem de novo do Discogs, pelo servidor, um álbum por vez, e trocam a leitura guardada pela nova (a mais nova vence entre o banco e o navegador). «Update values» lê todo álbum sem valor escrito pela pessoa, salvo o que foi lido há menos de seis horas (a guarda contra perguntar duas vezes seguidas); «Read them now» lê só os que nunca tiveram leitura. · fixes S-57
  verified_by:: `test/services/inventory/InventoryValueService.test.js`, `test/controllers/InventoryController.values.test.js`
- [REQ-16] **Decidido pelo MJRP em 2026-11-21.** Onde o valor do Discogs aparece, a tela diz quando ele foi lido, e a data nunca fica escondida: no cartão do computador e na linha do celular, curta e do mesmo jeito («CD · Discogs · 21 Nov», «Discogs · 21 Nov», a data inteira no `title`), qualquer que seja o tipo de leitura, inclusive o menor preço à venda; na janela, «Read on 21 Nov 2026, 14:05». A atribuição «Data provided by Discogs.», com o link da edição, fica na janela e na folha do celular, no aviso da faixa dos totais e, no cartão, no link «Discogs»; a linha do celular não traz o link. · fixes S-57
  verified_by:: `test/views/InventoryView.values.test.js`

## Observable States
Os estados estão no `docs/specs/info-arch.md`, seção «Estados», cada um com o seu ID de bloco; o comportamento, no `docs/specs/behavior.md`, seção «Inventário».

| Estado | ID de bloco | REQ |
|---|---|---|
| Fonte do Discogs desligada | `^inventory-value-source-off` | REQ-10 |
| Álbuns esperando valor | `^inventory-value-waiting` | REQ-09 |
| Lendo os valores | `^inventory-value-reading` | REQ-09 |
| Valores lidos | `^inventory-value-read` | REQ-01, REQ-07 |
| Filtrado por status | `^inventory-filtered-by-status-count` | REQ-02 |
| O câmbio não chegou | `^inventory-value-rates-missing` | REQ-08, REQ-13 |
| A rodada terminou com falhas, ou parou | `^inventory-value-run-ended` | REQ-09, REQ-13 |
| Janela: valor do Discogs | `^inventory-item-value-discogs` | REQ-04, REQ-06 |
| Janela: valor escrito à mão | `^inventory-item-value-yours` | REQ-03 |
| Janela: sem valor ainda | `^inventory-item-value-none` | REQ-04 |
| Janela: edição não achada | `^inventory-item-value-not-found` | REQ-13 |
| Janela: edição sem sugestão de preço | `^inventory-item-value-no-suggestion` | REQ-13 |
| Janela: a leitura falhou | `^inventory-item-value-failed` | REQ-13 |

## Success Criteria
- **O cartão.** Todo cartão da grade tem as mesmas cinco linhas, com a mesma altura, qualquer que seja o status e haja ou não valor (medido num navegador: seis cartões, 501 px cada). Falta ver com os 211 itens dele.
- **O valor à mão.** Escrever um valor na janela o grava no item, ele aparece como «written by you», entra no total, e uma rodada de «Update values» não o toca.
- **O valor do Discogs.** Com o token mapeado, «Read the value now» num álbum mostra os três estados, a média, a edição com link e «Data provided by Discogs.». **Não provado:** a chamada de preço nunca foi feita.
- **Seis horas.** ~~Nenhum preço do Discogs no Firestore~~ (REQ-05, substituído em 2026-11-21 por decisão do MJRP). **Agora:** a leitura fica no item, com a data (REQ-14); as seis horas são só a guarda do navegador contra perguntar duas vezes ao Discogs (REQ-15).
- **A rodada.** «Update values» nos 211 álbuns termina, pode ser parado, não trava a tela e diz no fim quantos foram lidos, quantos não têm edição em CD e quantos falharam, com o motivo.
- **O interruptor.** `DISCOGS_VALUES=off` no serviço, sem publicar código: ao reabrir o inventário não há botão, valor nem aviso do Discogs; o valor à mão, os totais, a moeda, a ordem e os links seguem.
- **As moedas.** Trocar para BRL converte cartões e totais e diz a taxa; sem câmbio, a tela fica em dólar e diz por quê.
- **Os portões.** Suíte (2852 testes), lint e build verdes; os testes de arquitetura (complexidade 10, fronteiras, módulos mortos, texto de fora escapado, endereços conferidos, a regra de identidade) passam sem exceção nova.

## Out of Scope
- Ler preço da página da Amazon ou da iMusic por conta própria (fere os termos delas).
- Marca de afiliado nos links: o lugar existe (`models/buyLinks.js`), a marca não.
- Escolher a edição exata do Discogs («Pick an edition on Discogs», do protótipo, não foi construído e não aparece).
- Vinil, fita e outros formatos: a leitura é sempre da edição em CD.
- As perguntas ao virar «Owned» (quanto pagou, estado do disco) e o valor pelo estado do disco informado.
- Vender e trocar entre colecionadores: «Sell» e «Trade» aparecem desligados.
- Histórico de valor e quanto a coleção valorizou.
- Ler os valores sozinho, com o app aberto: nesta versão a leitura só começa quando a pessoa pede.
- **Aberto, não resolvido aqui:** um produto com outros usuários precisa da autorização escrita do Discogs antes de guardar e mostrar o preço (os termos, lidos só de segunda mão: `reports/research/2026-11-21-discogs-terms-on-storing-prices.md`).
- Abrir o valor do Discogs a outros usuários de forma comercial, ou junto de links de afiliado: depende de autorização escrita do Discogs.

## Open Questions
- Respondida pelo agente — revisável: os três estados são Mint, Near Mint e Very Good Plus.
- Respondida pela leitura dos termos (2026-11-20): a sugestão de preço pode ser mostrada em uso pessoal, por até seis horas, com o aviso; não pode ser guardada além disso. **Revertida pelo MJRP em 2026-11-21** (REQ-14), sabendo que os termos só puderam ser lidos de segunda mão.
- O formato real da resposta de preço do Discogs é o documentado? Só a primeira chamada com o token diz.
- `DISCOGS_VALUES_FOR` fica definida com o id do MJRP? Sem ela, toda pessoa com conta no app vê preços lidos com o token dele.
- O valor do Discogs ao lado dos links da Amazon e da iMusic cabe nos termos («levar tráfego a outras lojas»)? O MJRP escolheu testar em uso pessoal, com o interruptor como saída.
- As doze decisões «decidido pelo agente — revisável» do `plan.md`.
