---
type: research
subject: "Inventário: o valor lido do Discogs é guardado ou não? Por que a pessoa precisa apertar «Read them now» toda vez (F75)"
project: mjrpalbumblender-v0
feature: F75
date: "2026-11-21 20:05"
who_researched: separate-agent
---

# O valor do inventário é lido de novo toda vez: design ou defeito?

Pergunta do MJRP (2026-11-21): «temos um bug no inventory, a questao dos preços não é persistida no banco né, toda vez tenho que clicar no read them, é by design isso ou bug?»

## Resposta curta

O preço não ir ao banco é de propósito (constituição, artigo VI, item 1; F75). O que o navegador guarda, guarda de verdade: em IndexedDB, por seis horas, e sobrevive a recarregar, fechar a aba e voltar. Passadas as seis horas, o app não lê sozinho: pede o clique. Isso também é de propósito (REQ-09). O que se vive é, quase todo, o desenho. Há um defeito pequeno: «Clear Cache» apaga as leituras sem dizer.

## a. Onde o navegador guarda a leitura, e se sobrevive

- Guarda em memória e em IndexedDB (`mjrp-cache`, tabela `cache`), com seis horas de validade: `services/inventory/InventoryValueService.js:144` (`cache.set(chave, leitura, READING_TTL_MS)`), `cache/CacheManager.js:91-111` (grava nas duas camadas), `cache/IndexedDBCache.js:7` e `:74-78` (a validade).
- Não usa localStorage nem sessionStorage. IndexedDB persiste: sobrevive a recarregar a página, a fechar a aba e a voltar na hora seguinte; some só às seis horas (`models/inventoryValue.js:83-88`, `isFresh`: leitura com menos de seis horas desde `readAt`).
- Ao abrir a tela, `controllers/InventoryValues.js:105-114` (`syncReadings`) relê do navegador o que ficou, e os cartões mostram o valor sem pedir nada ao servidor.
- Conclusão: não é só memória. Não contradiz «o navegador guarda até seis horas». Não é defeito.

## b. A chave acha o mesmo álbum de novo? Algum caso em que a leitura cai cedo?

- Chave: `inventoryvalue:v2:<uid>:<id do item>` (`InventoryValueService.js:28`, `:116-118`). Por pessoa e por item do inventário (o id do documento, estável). Outra conta no mesmo navegador não enxerga a leitura (verificado abaixo).
- Entrada e saída da conta: se a tela abre antes de o login ser conhecido, `InventoryValues.js:91-99` (`inventoryChanged`) esquece o que sabia e relê para quem chegou; as leituras do navegador voltam pela chave da pessoa certa. Nada cai cedo aqui.
- Nada limpa o cache ao carregar: `cleanExpired` não é chamado por ninguém fora do próprio `CacheManager`; a versão do banco é fixa em 1.
- O prefixo `v2` (`InventoryValueService.js:24-28`) foi trocado em 2026-11-20 e jogou fora as leituras da primeira rodada em produção: aconteceu uma vez, por escolha, e não se repete sem nova troca.
- **Defeito encontrado:** o botão «Clear Cache» do rodapé apaga as leituras do Discogs, e o câmbio, junto com os álbuns. `services/albums/clearAlbumCaches.js:26` chama `cache.clear()`, que esvazia o IndexedDB inteiro (`CacheManager.js:140-153`). O texto do comportamento diz que o botão apaga «os álbuns, as notas e os rankings lidos e só isso» (`docs/specs/behavior.md:234`, `^app-clear-cache`): as leituras de valor não estão na lista. Quem aperta «Clear Cache» (para resolver outro problema) perde até 211 leituras, cerca de 13 minutos de pedidos ao Discogs, sem aviso.

## c. O que a tela pede quando as leituras passam de seis horas

- Ao abrir o inventário nada é lido do Discogs (`InventoryValues.js:10-12`, `:71-83`). A tela só conta os itens sem valor escrito e sem leitura fresca (`models/inventoryValue.js:163-165`, `needsReading`; `models/inventoryValueRun.js:23`, `itemsToRead`).
- Se há algum, um aviso diz: «N albums are waiting for a value.» e «Reading them takes about M minutes.», com o botão «Read them now» (`inventoryValueRun.js:158-162`, `waitingNotice`). A barra de filtros tem também «Update values» (`views/InventoryView.js:433`). Os dois chamam `handleUpdateValues` (`controllers/InventoryController.js:299`), que chama `updateAll` (`InventoryValues.js:176`).
- A leitura nunca começa sem clique: `updateAll` só é chamado por esses dois botões (nenhum outro chamador em `public/js`). Com 211 álbuns o aviso diz cerca de 13 minutos (3,5 s por álbum, `inventoryValueRun.js:14`).
- É o desenho: REQ-09 e `docs/specs/behavior.md` (`^inventory-value-update`): «Abrir o inventário não lê nada do Discogs».

## d. O guardado é por aparelho?

Sim. IndexedDB é do navegador e do aparelho: ler no Mac nunca ajuda o iPhone, nem o Safari ajuda o Chrome do mesmo Mac. É consequência direta de a leitura não poder ir à nuvem (constituição VI.1), então é desenho. No iPhone cada navegador recomeça do zero.

## Verificação executável

`test/visual/inventoryValuesStayInBrowser.mjs`: Chromium de verdade, o `CacheManager` real (memória e IndexedDB) e o `InventoryValueService` real, servidos pelo Vite de desenvolvimento; só a chamada ao servidor é falsa, e todo endereço que não é localhost é recusado (nem Firebase Auth nem Firestore nem Discogs). Rodado pela fila (`machine_load.py`). Nenhum preço foi gravado em lugar nenhum.

Resultado (9 de 9 conferências ok): lida uma vez, a leitura fica; continua achada depois de recarregar a página; continua achada com a aba fechada e uma aba nova no mesmo navegador; nada vai ao localStorage nem ao sessionStorage; 5 h 59 min depois ainda vale; 6 h 01 min depois some; outra conta no mesmo navegador não a vê; um perfil de navegador novo (outro aparelho) não a vê; depois do «Clear Cache» ela some.

## Veredito

**Os dois.** O que o MJRP vive é, quase todo, o desenho; há um defeito pequeno, e a falta de um modo de poupar o clique é uma escolha de desenho que se pode mudar.

- **Desenho (preço fora do banco, seis horas, por aparelho, ler só com clique):** vem dos termos do Discogs e da constituição. Mudar o clique não pede mudar a regra das seis horas nem a constituição; só o aparelho continua separado.
- **Defeito («Clear Cache» apaga as leituras sem dizer):** custo pequeno, uma tarefa. Duas saídas: o botão passa a apagar só o que é de álbuns e deixa as chaves `inventoryvalue:` e `exchangerates:` (as leituras já expiram sozinhas); ou o texto do botão e do comportamento passa a dizer que apaga também os valores lidos. Registrado como UAT-267.

## Opções para a parte do desenho (nada construído)

| Opção | O que ele ganha | O que custa |
|---|---|---|
| 1. Ler sozinho ao abrir o inventário, quando há leituras com mais de seis horas: com progresso visível e «Stop» | Não precisa mais do clique; os valores estão lá quando ele olha | Uma mudança de regra (REQ-09: «abrir não lê nada») e no texto de comportamento; o Discogs recebe pedidos a cada abertura depois de seis horas, mesmo sem a pessoa querer valores; 13 minutos de pedidos para 211 álbuns, um álbum por vez, e o app já pede devagar para respeitar o limite deles. Dentro das seis horas, é a mesma regra. Trabalho: uma tarefa média, no `InventoryValues.open()` e no aviso |
| 2. Manter o clique e lembrar a escolha: «Read them now» e «Always read when I open» (uma caixa, na tela, guardada no aparelho) | Quem quer leitura automática liga uma vez; quem não quer continua com o clique | Uma preferência nova guardada (localStorage, só um sim ou não, nada do Discogs); um estado novo da tela. Mais barato que a opção 1 e não muda o padrão |
| 3. Só ajustar a mensagem: dizer quando a leitura anterior vence («Values read at 14:10 are valid until 20:10») | Ele passa a ver que não é defeito e planeja o clique | Quase nada; não tira o clique |

Recomendação: a opção 2 (ou 3 sozinha, se ele só quer entender). A 1 muda o padrão para todos e gasta o limite do Discogs sem pedido.

Todas ficam dentro da regra das seis horas do Discogs: nenhuma guarda preço por mais tempo, nenhuma o leva ao Firestore.

## O que não foi checado

- A produção com conta de verdade e o servidor real: o servidor foi trocado por um falso, sem Firebase, sem Firestore e sem Discogs, de propósito. A causa do que o MJRP viu em produção hoje (passaram seis horas? foi «Clear Cache»? outro aparelho? outro navegador?) não foi perguntada a ele: está em aberto.
- Safari do iPhone: o IndexedDB dele pode limpar dados de sites pouco usados e em modo privado; as seis horas não chegam perto dos limites que ele costuma ter, mas não foi medido.
