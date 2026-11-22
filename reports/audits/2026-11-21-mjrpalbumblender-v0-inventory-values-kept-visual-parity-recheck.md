---
type: ux-audit
subject: "Reconferência pré-merge do ramo feat/f75-inventory-values-kept-in-the-database (REQ-14 a REQ-16): a leitura do Discogs guardada no item do inventário, «Update values» que atualiza, a data na tela, e nada mais desenhado diferente"
project: mjrpalbumblender-v0
features: [F75]
moment: delivery
date: "2026-11-21 23:40"
judged: "2026-11-21 23:40"
judged_commit: 84dbddc
who_judged: separate-agent
verdict: fail
p0: 0
p1: 1
p2: 4
duration_s: 3600
status: open
---

# Reconferência — os valores do inventário guardados no banco

**Veredito: não passa (`fail`), sem P0; 1 P1 e 4 P2.** Os dados estão certos:
- cada leitura vai só para o item da própria pessoa;
- o valor escrito pela pessoa sempre vence;
- nada é apagado nem trocado por um vazio;
- o código antigo convive com o campo novo;
- o servidor continua sem guardar nada.

O que reprova é a tela. No computador, o cartão de um valor de «menor preço à venda» corta a data («CD · Discogs · lowest f…»). Com a conta de hoje (sem as configurações de vendedor), esse é o caso da maioria dos cartões, então o REQ-16 não aparece onde mais importa.

## Como foi feito
- **Quem julgou:** um agente juiz (Opus) que não construiu o ramo.
- **Objeto:** `84dbddc` (depois) contra `394c8e0` (antes, a base de onde o ramo saiu; o `main` andou depois só com a F80). Cada um foi extraído com `git archive` para a pasta de rascunho. Nada foi escrito no repositório.
- **Testes, pela fila** (`machine_load.py`):
  - os 9 arquivos tocados: 180 testes verdes;
  - a suíte inteira: 4031 testes em 315 arquivos, verdes.
- **Costura própria** (`captures/scripts/inventory.js`):
  - **Reais:** a `InventoryView`, o controlador, o `InventoryService`, o `InventoryRepository` (a validação de `discogsReading` incluída), o `InventoryValueService` e o cache do navegador do app (IndexedDB).
  - **Substituídos:** o Firebase (um módulo vazio); as funções do Firestore (um banco em memória, por caminho, que registra cada escrita e pode recusar um lote); as três chamadas de valor ao servidor.
  - **Bloqueado:** todo endereço que não é 127.0.0.1 foi recusado, e nenhum foi pedido (zero).
  - **Sem login, e nada escrito fora da memória da página.**
- **Navegadores:**
  - Chromium do Playwright 1.56.1 (`/Users/maujrp/mjrp/projects/MJRPpersonal/node_modules/playwright`), no Vite de desenvolvimento (portas 5711 e 5712), a 1280, 1440, 1024, 393 e 320;
  - WebKit 26.0 com o perfil iPhone 15 Pro, a 393 e 320, sobre a **costura compilada** (`vite build` da árvore do ramo, servida em 5713).
  - Relógio fixo em 2026-11-21 15:00 UTC; as leituras guardadas são de 18 Nov.
  - Os três servidores foram fechados no fim.

## A. Os dados
1. **Ninguém vê a leitura de outra pessoa.**
   - `firestore.rules:24-27` não mudou: o inventário só abre para o dono, sem lista de campos.
   - O campo vive no documento do item, sob `artifacts/mjrp-albums/users/{uid}/inventory`.
   - **A troca de pessoa no meio de uma rodada** (anônimo → `person-2`, e depois a saída): zero escritas depois da troca e nenhum documento criado em `person-2`. A tela fica vazia, sem «Discogs» nem valor, e o mapa de leituras na memória fica com zero itens (`results.json` → `switch`).
   - **O que protege:**
     - `InventoryService.setReadings` filtra pelos itens da pessoa de agora;
     - `inventoryChanged` esquece as leituras e para a rodada;
     - a chave do cache leva o uid.
   - Uma colisão de id entre pessoas não acontece, porque os ids são do Firestore.
2. **O valor escrito vence em todo caminho.**
   - Ele vence no cartão («CD · written by you», com uma leitura guardada no mesmo item), na linha do celular («Yours»), nos totais e na ordem, porque todos usam `valueOfItem`.
   - A rodada nunca lê um item com valor escrito: o OK Computer não foi perguntado em nenhuma rodada.
   - **A escrita é por campo:** `batch.update` toca só `discogsReading`, `discogs` e `updatedAt` (as escritas registradas). `notes`, `owned` e `averages` ficaram intactos.
   - **Edição durante a rodada:** a pessoa gravou US$ 40 e uma nota no Harvest enquanto ele era lido. No banco ficaram os dois, a leitura nova e o valor escrito, e na tela «written by you ≈ $40.00» (`concurrent`).
3. **Documentos antigos e aba antiga.**
   - Item sem o campo: «Waiting for a value», contado no aviso.
   - **A costura com o código da base, contra documentos que já têm o campo:**
     - a tela abre e mostra «6 albums are waiting» (ela ignora o campo);
     - a rodada antiga grava só `discogs` e `updatedAt`;
     - o `discogsReading` e a nota ficam iguais (`oldTab`).
4. **O servidor não guarda nada.** O diff não toca `server/`. O log da rota (`server/routes/handlers/values.js:23`) registra o desfecho e o tempo, nunca o preço.
5. **A rodada.**
   - **«Read them now»:** leu só os 2 nunca lidos e gravou só esses 2. O aviso some.
   - **«Update values»:** leu os 4 com leitura mais velha que seis horas e pulou os 2 lidos agora e o que tem valor escrito.
   - **Segundo aperto, em seguida:** 0 perguntas e o aviso «Every album already has a value written by you or read in the last six hours.»
   - **«Stop»:** grava só o álbum já lido; os outros ficam como estavam.
   - **Discogs fora do ar em todos os álbuns:** 0 escritas, e os valores guardados continuam na tela com a data. O aviso diz «Values read for 0 of 6 albums. 6 albums could not be read: Discogs did not answer (6).»
   - **Token recusado no 2º álbum:** grava o 1º e para.
   - **O banco recusa o lote:** nada é escrito e a tela mostra a leitura do navegador. A rodada seguinte grava essas leituras sem perguntar de novo ao Discogs.
   - **Escritas para 300 itens:** 300 documentos em 12 lotes de 25 por rodada completa, e só depois de seis horas. É razoável.
6. **Os textos (constituição VI.1, log, spec, plano, tarefas, pesquisa).**
   - Dizem o que o código faz.
   - Citam as palavras dele fielmente («quero os dados persistidos sim e o botão serviria para atualizar valores»; «1.a»).
   - Guardam a regra antiga inteira, com o motivo.
   - Registram que os termos foram lidos de segunda mão e que um produto com outros usuários precisa da autorização escrita do Discogs.
   - **Nenhum carimbo de aceite nem ratificação** foi escrito pelo agente: a constituição diz isso com todas as letras, e as tarefas TASK-09 a TASK-11 seguem `[ ]`.
   - Uma afirmação vai além do código (P2-4).

## B. A tela
- **No computador, 1280:**
  - **Cartão com valor guardado:** «CD · Discogs · 18 Nov ≈ $12.00». «Discogs» é o link da edição, e o `title` traz «… Read on 18 Nov 2026, 11:05.» (`b1280-card-kept.png`).
  - **Janela do álbum:** «Read on 18 Nov 2026, 11:05. Read again», «See it on Discogs» e «Data provided by Discogs.», com link (`b1280-window-a.png`, `-c.png`).
  - **Valor escrito ao lado de uma leitura guardada** e **«No CD edition found»** (`b1280-card-written.png`, `-notfound.png`).
- **O aviso de espera** conta só os nunca lidos: «2 albums are waiting for a value.» Num perfil novo em que todo item tem leitura guardada, os valores aparecem na hora, sem aviso, sem pergunta e sem escrita (`b1280-allkept-top.png`).
- **A rodada:**
  - em curso: «Reading values… 0 of 6», com «Stop»;
  - parada;
  - com falha;
  - com o token recusado.
  - Capturas: `b1280-readnow-running`, `-after-readnow`, `-update-running`, `-update-stopped`, `-failed-fail`, `-failed-tokenAfter1`.
- **No celular** (Chromium e WebKit compilado):
  - a linha diz «Discogs · read 18 Nov», sem corte e sem rolagem lateral, a 393 e a 320;
  - a folha «⋯» traz «Read on 18 Nov 2026, 11:05.», «This edition on Discogs ↗» e «Data provided by Discogs.»;
  - o topo mantém «Data provided by Discogs.» (`wk393-rows-crop`, `wk320-rows-crop`, `b393-sheet`, `wk393-sheet`).
- **Nada mais desenhado diferente** (`parity.json`, página inteira, limiar 16):
  - **antes contra antes:** 0 px a 1280 e a 393;
  - **antes contra depois,** com itens sem o campo novo: 0 px a 1280 e a 393;
  - **com o campo novo:** só os cartões que ganham valor e data mudam. É o esperado.

## Achados
- **P1-1 · No computador, o cartão de «menor preço à venda» esconde a data da leitura.**
  - **O que se vê:** a linha de origem vira «CD · Discogs · lowest f…». O texto inteiro (205 px) não cabe na coluna (135 px a 1280 e 1440; 174 px a 1024).
  - **Em reais:** a 1280, até o cartão comum corta a data («CD · Discogs · 18 Nov» mede 118 px numa coluna de 109 px).
  - **Por que pesa:** a conta de hoje não tem as configurações de vendedor, então em produção a maioria dos valores é «lowest for sale». A data (REQ-16) só fica no `title`, que o toque não abre.
  - **Âncora:** `public/js/views/renderers/InventoryCardValue.js:50` (o texto) e `:109` (`whitespace-nowrap truncate`).
  - **Evidência:** `b1280-card-lowest.png`; `extra.json` (por largura e moeda).
  - **A mudança:** a data vem antes da qualificação, ou numa segunda linha («CD · Discogs · 18 Nov» / «lowest for sale»), ou «lowest» encurtado. Mede-se com o valor em BRL a 1280.
- **P2-1 · No celular, a data se parte em duas linhas** («Discogs · read 18» / «Nov»), a 393 e a 320, no Chromium e no WebKit. A linha fica com três linhas de altura.
  - **Âncora:** `public/js/models/inventoryValue.js:352-358` (`shortDayText`/`readOnText`), usado em `InventoryPhoneRow.js:38`.
  - **Evidência:** `wk393-rows-crop.png`, `wk320-rows-crop.png`.
  - **A mudança:** espaço não separável entre o dia e o mês (ou `white-space: nowrap` na data).
- **P2-2 · O «now» do menor preço já não é verdade.** A janela diz «The lowest price this CD is for sale at on Discogs now», e o `title` do cartão «… for sale at on Discogs now», para uma leitura que pode ter semanas. O «Read on 18 Nov» está logo abaixo, mas a frase afirma o presente.
  - **Âncora:** `public/js/components/InventoryValueSection.js:102`; `public/js/models/inventoryValue.js:333` (`DISCOGS_LOWEST_TITLE`).
  - **Evidência:** `b1280-window-c.png`.
  - **A mudança:** «… was for sale at on Discogs when it was read».
- **P2-3 · Uma leitura inválida derruba o lote inteiro, em silêncio** (visto no código, não provocado).
  - **Onde:** `setReadings` valida dentro do `map` (`shared/data/InventoryRepository.js:240-245`). Uma condição ou um menor preço que não seja um número acima de zero, ou o id de uma edição que não seja inteiro, lança antes do `updateMany`. Os 25 do lote ficam sem gravar, e só aparece um `console.error` (`InventoryValueService.js:155-165`).
  - **Por que pesa:** como `readingsToKeep` reenvia essa leitura a cada rodada por seis horas, ela também segura as outras.
  - **A mudança:** separar a entrada inválida (gravar as válidas e contar a recusada), ou validar em `keepReadings` antes de montar o lote.
- **P2-4 · A constituição promete mais que a tela.** VI.1 diz que o link «Data provided by Discogs.» aparece onde o valor aparece. A linha do celular mostra «Discogs · read 18 Nov» sem link: a atribuição fica uma vez no topo e na folha «⋯», como já era antes do ramo. Do mesmo jeito, o REQ-16 descreve «Read on 21 Nov 2026», e o cartão diz só «18 Nov», sem «read», enquanto o celular diz «read 18 Nov». Esse texto está marcado como pendente de aprovação no `design-system.md`.
  - **Âncora:** `docs/specs/constitution.md:96`; `docs/specs/features/F75-cd-prices-and-where-to-buy/spec.md:74`.
  - **A mudança:** o texto diz «no topo da lista e junto de cada valor na janela e na folha», ou a linha ganha o link. Cartão e celular passam a usar a mesma forma da data.

## Não visto
- **Uma conta de verdade e o Firestore de verdade:** as regras foram lidas, não exercidas no emulador. As escritas foram as de um banco em memória com as mesmas chamadas.
- **O Discogs de verdade:** as respostas da rota foram simuladas, então não vi uma leitura real passar pela validação de `discogsReading` (P2-3).
- **Um iPhone de verdade:** só o WebKit do Playwright.
- **O app pelo próprio `app.html`:** julguei pela costura, com os componentes reais.
- **Uma rodada de 300 itens medida:** a conta das escritas veio do código (lotes de 25).
