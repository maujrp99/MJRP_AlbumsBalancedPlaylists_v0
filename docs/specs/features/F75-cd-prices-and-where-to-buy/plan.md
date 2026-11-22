# Plan — Feature F75: Preço de CDs e onde comprar, no inventário · Spec: [[spec]]
**Approved**: pendente (o MJRP priorizou em 2026-11-20 01:32 e saiu; as decisões abaixo marcadas «decidido pelo agente — revisável» esperam o julgamento dele)

## Emenda de 2026-11-21 — decidida pelo MJRP: a leitura do Discogs é guardada no banco (REQ-14 a REQ-16)
Palavras do MJRP: «quero os dados persistidos sim e o botão serviria para atualizar valores»; «1.a» (guardar já, no lugar de ler sozinho e pedir autorização ao Discogs antes). Ele decidiu sabendo que os termos só puderam ser lidos de segunda mão (`reports/research/2026-11-21-discogs-terms-on-storing-prices.md`). **O que a decisão troca:** as seções abaixo que dizem «nenhum preço vai ao Firestore» e «seis horas no navegador» valem como história; o que vale é isto.
- **Onde mora.** No documento do item do inventário da pessoa (`artifacts/{app}/users/{uid}/inventory/{item}`), no campo `discogsReading`, ao lado de `value` e `discogs`. As regras do Firestore já fecham essa coleção ao dono e deixam o campo passar: **sem mudança de regras nem de índices.** O servidor continua sem guardar nada.
- **O que guarda:** os três estados (ou o menor preço e quantos à venda), a moeda, a edição (id, título, link), o tipo da leitura, a hora em que foi lida e `source: 'discogs'`. Nunca o valor que a pessoa escreveu.
- **Uma regra só, agora:** o que a pessoa escreveu vence; senão, a leitura guardada mais nova (banco ou navegador), com a data; senão, nenhum, com o motivo. A idade não esconde mais nada.
- **O navegador.** O cache de seis horas fica só como guarda: «Update values» não pergunta de novo ao Discogs o álbum lido há menos de seis horas. Uma leitura fresca que só o navegador tem (de antes desta mudança) é gravada no banco na próxima rodada, sem nova pergunta ao Discogs; nada é gravado em silêncio ao abrir a tela. Entre banco e navegador a leitura mais nova vence, e o «Clear Cache» continua guardando o cache dos valores.
- **Quem vê.** O valor guardado é lido com o inventário, na tela da pessoa dona e só nela; ao trocar de pessoa, o que estava na tela é esquecido.
- **Aberto, não resolvido aqui:** um produto com outros usuários pede autorização escrita do Discogs (os termos, de segunda mão, dizem licença pessoal, sem uso comercial, sem repasse).

## Architecture Approach
O valor de um álbum tem **uma regra só**, pura, no navegador (`models/inventoryValue.js`): o que a pessoa escreveu vence; senão, uma leitura do Discogs com menos de seis horas; senão, nenhum valor, com o motivo. Tudo o que a tela mostra de valor (cartão, janela, totais, ordem) pergunta a essa regra.

O preço do Discogs passa por **três lugares, e para em um**:

1. **Servidor**: uma fonte de valor tipada (`server/lib/valueSources/`), ao lado das fontes de notas, com a mesma resposta tipada (`server/lib/outcome.js`) e a mesma fila educada com prazo. O token mora só no servidor. Nada é guardado depois do pedido.
2. **Navegador**: a leitura fica no cache do navegador, uma chave por pessoa e item, por seis horas. A regra confere a idade de novo ao mostrar.
3. **Firestore**: **nenhum preço do Discogs chega aqui.** O item guarda só `value` (o que a pessoa escreveu, em USD) e `discogs` (qual edição foi usada: dado de catálogo).

O **interruptor** é do servidor (`DISCOGS_TOKEN` presente e `DISCOGS_VALUES` diferente de `off`), lido a cada pedido; o app pergunta uma vez, ao abrir o inventário. Desligado, o app não mostra botão, valor nem aviso do Discogs, e o valor escrito à mão, os totais, a moeda, a ordem e os links de compra seguem.

Os links de compra saem de **um módulo só** (`models/buyLinks.js`), onde uma marca de afiliado entra depois; hoje nenhum endereço leva parâmetro de afiliado.

## Technical Design

### Servidor (`server/`)

| Módulo | O que faz | REQ |
|---|---|---|
| `lib/valueSources/discogsSource.js` | A fonte: acha a edição em CD mais comum e pede a sugestão de preço. Um pedido por vez, no máximo um por segundo (`DISCOGS_PACE`), pela fila educada; cabeçalho `Authorization: Discogs token=…` e `User-Agent` que nomeia o app. Falha de fora é lançada como `UpstreamError`. | REQ-04, REQ-13 |
| `lib/valueSources/discogsParse.js` | Leitores puros das respostas: os candidatos de uma busca, a versão em CD mais colecionada, os três estados da sugestão. | REQ-04 |
| `lib/valueSources/valueSwitch.js` | O interruptor: `on` só com `DISCOGS_TOKEN` e sem `DISCOGS_VALUES=off`; opcional `DISCOGS_VALUES_FOR`; visitante nunca tem `on`. | REQ-10 |
| `lib/services/valueService.js` | O resultado tipado de um álbum, com prazo de 20 s por pedido. | REQ-04, REQ-13 |
| `lib/services/exchangeRates.js` | O câmbio do dia (Frankfurter), guardado em memória pelo dia. | REQ-08, REQ-13 |
| `routes/values.js`, `routes/handlers/values.js` | `POST /api/album-value`, `GET /api/value-sources`, `GET /api/exchange-rates`. | REQ-04, REQ-08, REQ-10 |
| `lib/outcome.js` | Dois desfechos a mais (`no_value`, `not_configured`) e um código de erro (`upstream_unauthorized`). | REQ-13 |
| `lib/politeQueue.js` | `pause(ms)`: a fonte disse, numa resposta boa, que o limite está no fim. | REQ-09 |
| `lib/auth/guards.js` | A porta `value`: pessoa com conta, limite próprio (`VALUE_CALLS_PER_HOUR`, 900). | REQ-09 |

**Como a edição é escolhida.** `GET /database/search?type=master&artist=…&release_title=…` lista os masters; a regra de identidade (`shared/albumIdentity.js`, `pickAlbum`) diz qual é o álbum, com os candidatos ordenados pelo número de pessoas que o têm; `GET /masters/{id}/versions?format=CD&per_page=100` lista as versões em CD e vale a de maior `stats.community.in_collection`. Sem master, ou master sem CD, uma segunda busca (`type=release&format=CD`) lista lançamentos e a regra escolhe de novo. O título procurado é o da regra (`titlesToSearch`). Nenhum segundo comparador foi escrito.

**As respostas de `POST /api/album-value`.**

| Resposta | Quando |
|---|---|
| `found` | `{ release: { id, title, url }, conditions: { mint, nearMint, veryGoodPlus }, currency, readAt }` |
| `not_found` | o Discogs não tem edição em CD que a regra aceite |
| `no_value` | a edição existe e o Discogs não sugere preço para os três estados; vai com `{ release }` |
| `not_configured` | o interruptor está desligado para quem pede; o Discogs não foi consultado |
| `upstream_unauthorized` (502) | o token foi recusado (401 ou 403 do Discogs) |
| `upstream_busy` (503, `Retry-After`) | o limite de pedidos (429) |
| `upstream_timeout` (504), `upstream_failed` (502) | o Discogs demorou ou falhou |
| `invalid_request` (400) | faltou artista ou título, ou a edição não é um número |

Decidido pelo agente — revisável: o pedido falava em `source_busy` e `upstream_error`; ficaram os nomes que o contrato já tinha (`upstream_busy`, `upstream_failed`), para não haver dois nomes para a mesma coisa.

### Navegador (`public/js/`)

| Módulo | O que faz | REQ |
|---|---|---|
| `models/inventoryValue.js` | O valor de um item, os dois totais, as quatro moedas, o que se diz. | REQ-03, REQ-04, REQ-05, REQ-07, REQ-08, REQ-10 |
| `models/inventoryValueRun.js` | O que uma rodada lê, o que cada resposta vale, o progresso e o fim. | REQ-09, REQ-13 |
| `models/buyLinks.js` | O endereço de cada loja para um álbum. | REQ-11 |
| `models/inventorySort.js` | «Value (↓)» e «Value (↑)»; sem valor fica no fim. | REQ-12 |
| `api/valueApi.js` | As três chamadas ao servidor, lidas por `api/serverResult.js`; nunca lançam. | REQ-04, REQ-08, REQ-10 |
| `services/inventory/InventoryValueService.js`, `inventoryValueWiring.js` | O interruptor, o câmbio (guardado pelo dia), as leituras no cache por seis horas, um álbum, a fila. | REQ-05, REQ-09, REQ-10 |
| `repositories/InventoryRepository.js`, `services/inventory/InventoryService.js` | `value` pela porta `updateAlbum`; `setEditions` grava `discogs` em lote. | REQ-03, REQ-04 |
| `controllers/InventoryValues.js`, `controllers/InventoryController.js` | O estado dos valores e as ações: moeda, contagem como filtro, «Update values», «Stop», escrever, voltar, ler um álbum. | REQ-02, REQ-03, REQ-08, REQ-09 |
| `views/renderers/InventoryCardValue.js`, `InventoryGridRenderer.js` | O cartão como superfície e as cinco linhas. | REQ-01, REQ-06, REQ-11 |
| `views/renderers/InventoryValueHeader.js`, `views/InventoryView.js` | A faixa dos totais com as moedas, os avisos, as contagens como botões, o botão «Update values». | REQ-02, REQ-07, REQ-08, REQ-09, REQ-10 |
| `components/InventoryValueSection.js`, `components/ViewAlbumModal.js` | «Estimated value» e «Where to buy» na janela. | REQ-03, REQ-04, REQ-06, REQ-11 |
| `components/Footer.js` | A frase sobre a API do Discogs, enquanto a fonte está ligada. | REQ-06 |

**A fila (REQ-09).** Um álbum por vez. «Espere» é esperado (até duas vezes por álbum, no máximo cinco minutos cada); token recusado, falta de login e interruptor desligado param a rodada; qualquer outra falha conta e a rodada segue. As edições achadas são gravadas nos itens em partes de 25. Sair da tela ou apertar «Stop» derruba a rodada pelo `AbortSignal`.

**Desenho em uma passada.** O cartão continua saindo de uma passada só de HTML; durante uma rodada só o cartão do álbum lido, a faixa dos totais, o aviso e o botão são redesenhados no lugar.

### Decisões tomadas sem o MJRP (decidido pelo agente — revisável)

1. **Abrir o inventário não lê nada do Discogs.** Conta quantos álbuns esperam e oferece «Read them now». O protótipo dizia que eram lidos sozinhos; o limite de pedidos é da conta dele, e um redesenho não pode começar uma segunda rodada.
2. **O preço pago saiu do cartão** e aparece na janela como «Paid:». O cartão mostra o valor estimado; `purchasePrice` não é tratado como valor.
3. **A porta `value` tem limite próprio.** A porta paga tem 60 chamadas por hora por pessoa, somadas com as da IA; 211 álbuns não passariam.
4. **`DISCOGS_VALUES_FOR`** (opcional): os ids das pessoas para quem a fonte fica ligada. Nasceu da leitura dos termos; sem ela, a fonte fica ligada para toda pessoa com conta.
5. **O valor exige os três estados.** Com um faltando, a resposta é `no_value`: a média de dois não é a média que o MJRP pediu.
6. **A média é arredondada ao centavo**; o que a pessoa escreve numa moeda que não o dólar é convertido e guardado em USD com duas casas.
7. **«Sell» e «Trade» aparecem desligados**; «Where to buy» do cartão do que é dele é um botão com a aparência de link.
8. **«Pick an edition on Discogs»**, do protótipo, não foi construído e não aparece (escolher a edição ficou fora desta iteração, por decisão dele).
9. **«Data provided by Discogs.» no cartão**: a palavra «Discogs» da origem é o link para a página da edição; a frase inteira aparece uma vez, na faixa dos totais, e na janela ao lado dos valores.
10. **Um total sem nenhum valor mostra «—»**, não «$0.00».
11. **O texto das contagens** («N of M albums have a value») é o do protótipo, sem variar no singular.
12. **Um commit só para modelo, serviço e tela.** Separados, o modelo e o serviço seriam módulos que nada carrega, e o teste de módulos mortos recusa.

### Depois da primeira rodada em produção (2026-11-20): a sugestão recusada e o menor preço à venda

**O que a produção mostrou.** Com o token do MJRP, a busca e as versões funcionam; toda `GET /marketplace/price_suggestions/{id}` responde HTTP 404 com «You must fill out your seller settings first.». O Discogs só dá a sugestão por estado a conta com as configurações de vendedor preenchidas. O código lia esse 404 como «sem edição em CD», o que era falso.

**O desenho (decidido pelo agente — revisável).**
- **A recusa tem nome e vai do lado do sucesso.** A fonte reconhece a recusa (404, 401 ou 403 com a frase das «seller settings») e a diz dentro da resposta: `suggestions: 'seller_settings_missing'`. Não é um código de falha porque o álbum foi respondido, com um valor mais fraco; uma falha faria o app contar 211 falhas e não mostrar nada. Um 401 ou 403 com outra frase continua sendo `upstream_unauthorized`.
- **O valor de reserva é o menor preço à venda.** `GET /marketplace/stats/{id}` responde sem as configurações de vendedor. A resposta é `found` com uma leitura de outro TIPO: `{ release, kind: 'lowest_for_sale', lowest: { value, currency }, forSale, suggestions, readAt }`. Sem nada à venda: `no_value` com `reason: 'none_for_sale'`. O app nunca o chama de sugestão nem de média.
- **A página de preço não é pedida 211 vezes.** O servidor não guarda estado. O app, ao saber da recusa, lembra por seis horas na memória da página e manda `prices: 'lowest'`: um pedido por álbum, no lugar do de preço.
- **Como os três estados voltam.** Cada rodada nova de «Update values» tenta a sugestão uma vez, no primeiro álbum; se vier, a rodada inteira lê sugestões; se for recusada, o resto lê o menor preço. Uma página recarregada também tenta de novo. Nenhuma mudança de código quando o MJRP preencher as configurações. Limite: um menor preço lido há menos de seis horas não é relido por «Update values»; «Read again», na janela, relê um álbum.
- **A moeda.** A documentação, como o agente a lembra (não foi relida agora), lista `curr_abbr` em `/marketplace/stats`; o pedido sem token aceitou o parâmetro sem erro. O app não o manda: a moeda vem como o Discogs der e é convertida por USD.
- **As leituras erradas da primeira rodada** não sobrevivem: a chave da leitura no navegador passou a `inventoryvalue:v2:`.

**Termos de uso, para as estatísticas do marketplace (leitura do agente).** É conteúdo do Discogs como o resto: valem a atribuição («Data provided by Discogs.», com link para a página da edição) e as seis horas, e nada vai ao Firestore. O menor preço e a quantidade à venda são dados do marketplace, a mesma categoria das sugestões: pela leitura já feita, **«Restricted Data»**, de uso pessoal. A recomendação de `DISCOGS_VALUES_FOR` e a questão de levar tráfego a outras lojas ficam como estavam.

**O formato real de `/marketplace/stats/{id}`** (6 pedidos sem token, 2026-11-20): `{"num_for_sale":124,"lowest_price":{"value":0.53,"currency":"USD"},"blocked_from_sale":false}`; sem nada à venda, `{"num_for_sale":0,"lowest_price":null,"blocked_from_sale":false}`; edição inexistente, 404 `{"message":"Release not found."}`.

**O que não foi verificado.** A resposta de `/marketplace/stats` COM o token (a moeda pode ser a da conta). Quantas das 211 edições escolhidas têm algo à venda: a edição escolhida é a mais colecionada, não a mais vendida, e a de «The Dark Side of the Moon» (5012948) tinha zero à venda. Se forem muitas, o passo seguinte é procurar o menor preço entre as edições em CD do master, e não só na mais comum. O caminho dos três estados continua sem prova: nenhuma sugestão foi lida de verdade.

## Dependencies
- O segredo `discogs-token` mapeado para `DISCOGS_TOKEN` no serviço `mjrp-proxy` (do integrador).
- `api.frankfurter.app` (câmbio de referência, sem chave).
- Nenhuma dependência nova de código: o servidor usa `axios`, que já usava.
- Contas de afiliado da Amazon e da iMusic (do MJRP): fora desta feature.

## Documents Consulted
`AGENTS.md`, `MEMORY.md`, `docs/specs/features/F75-cd-prices-and-where-to-buy/spec.md`, `design/proposals/f75-inventory-value/proposal.md`, `design/inception/inventory-value-v5.1.html`, `docs/specs/info-arch.md`, `reports/audits/2026-11-20-mjrpalbumblender-v0-cd-prices-feasibility.md` (com os termos de uso da API do Discogs), `server/lib/outcome.js`, `server/lib/rankingSources/`, `server/lib/politeQueue.js`, `shared/albumIdentity.js`, `public/js/api/serverResult.js`, `public/js/models/inventoryRatings.js`, `test/architecture/`.

Declarações:
- `docs/specs/constitution.md` — sem mudança: nenhum padrão de código novo; a fonte de valor segue os moldes que já existiam
- `docs/specs/arch.md` — atualizado: a fonte de valor ao lado das fontes de notas, o interruptor, os dois desfechos e o código de erro novos
- `docs/specs/data-model.md` — atualizado: `value` e `discogs` no item do inventário; a leitura do Discogs e o câmbio nos dados locais do navegador
- `docs/specs/tech-stack.md` — sem mudança: nenhuma dependência nova; a API do Discogs e a do Frankfurter são integrações, descritas no `arch.md`
- `docs/specs/design-system.md` — sem mudança: o projeto não tem `docs/specs/design-system.md`; o cartão usa as classes que o app já usava e as três cores do protótipo
- `docs/specs/behavior.md` — atualizado: a seção «Inventário»
- `docs/specs/info-arch.md` — atualizado: os estados construídos, com os IDs de bloco, e os que o protótipo não mostrava
- `docs/manual/` — atualizado: `00_Deployment_and_Setup.md` (as variáveis e o interruptor), `21_Dynamic_UI_Mapping.md` (o inventário) e as linhas do inventário em `09_Frontend_Views.md`, `10_Frontend_Renderers.md` e `14_Frontend_Components_Feature_Map.md`
- `docs/wiki/` — sem mudança: nenhuma página descreve uma regra do app que esta feature mudou

## Risks & Considerations

### Termos de uso da API do Discogs (leitura do agente, não é parecer jurídico)
- **Dado restrito, de uso pessoal.** A sugestão de preço é «Marketplace Data». O desenho serve o uso pessoal do MJRP; a rota exige conta, e `DISCOGS_VALUES_FOR` limita a quem for nomeado. **Sem essa variável, qualquer pessoa com conta no app vê preços lidos com o token dele.** Recomendação: definir `DISCOGS_VALUES_FOR` com o id dele ao ligar a fonte.
- **Seis horas, e nada guardado além do necessário.** A leitura vive seis horas no cache do navegador e não vai ao Firestore; o servidor não guarda preço. A regra confere a idade ao mostrar.
- **O aviso.** «Data provided by Discogs.» com link para a página da edição, na janela ao lado dos valores e uma vez na tela; no cartão, a origem «Discogs» é o link. A frase de não afiliação fica no rodapé enquanto a fonte está ligada.
- **Uma chave só.** O servidor usa um token; a fila é por instância. Com mais de uma instância do Cloud Run, cada uma tem a sua fila, mas a rodada do app pede um álbum por vez, então o ritmo real é o da rodada.
- **Levar tráfego a outras lojas (não resolvido).** Os termos proíbem usar o conteúdo «com a intenção de levar tráfego» a sites que não são do Discogs. O cartão do que não é dele mostra o valor do Discogs acima dos links da Amazon e da iMusic. O MJRP escolheu a opção B sabendo disso, para um teste em uso pessoal; a saída é o interruptor. Abrir isso a outros usuários, ou pôr marca de afiliado, pede autorização escrita do Discogs.

### O que não foi verificado
- **A chamada de preço nunca foi feita.** `GET /marketplace/price_suggestions/{id}` exige o token, que o agente não leu. O leitor foi escrito do formato documentado (`{"Mint (M)": {"currency", "value"}, …}`) e não acredita em nada que não seja um número com moeda. Se o formato real for outro, a resposta será `no_value` para todo álbum: é o primeiro sinal a olhar na prova.
- **Sem token, o Discogs respondeu 401** a esse endereço, com `{"message": "You must authenticate…"}` (um pedido, em 2026-11-20). O 401 com token inválido é presumido igual.
- **Em que moeda a sugestão vem.** A documentação diz que é a da conta. O app converte por USD; uma moeda sem taxa no dia aparece na própria moeda e não entra no total.
- **Se a sugestão exige as configurações de vendedor preenchidas** na conta dele (lido em fonte de terceiros).
- **O cabeçalho `Retry-After` num 429 do Discogs.** Se não vier, a espera é de 30 s, dobrando até 120 s.
- **Nada foi publicado nem provado com a conta do MJRP.** O desenho da tela foi conferido num navegador com o CSS do build, sem servidor e sem login: seis cartões de 501 px, as cinco linhas com a mesma altura em todos, a 1440 e a 390 px.

### Limites conhecidos
- **Até 100 versões em CD.** A lista de versões vem em ordem de lançamento, 100 por página; um master com mais de 100 edições em CD («The Dark Side of the Moon» tem 349) tem a escolhida entre as 100 primeiras. Ler todas as páginas custaria mais pedidos por álbum.
- **Tempo.** Até três pedidos por álbum na primeira leitura: cerca de 13 minutos para 211 álbuns. Depois, com a edição guardada, um pedido por álbum.
- **A rodada mora na aba.** Fechar a aba ou sair da tela a derruba; o que foi lido fica no navegador por seis horas.
- **Formato.** O valor é sempre o da edição em CD, mesmo que o item diga outro formato.
