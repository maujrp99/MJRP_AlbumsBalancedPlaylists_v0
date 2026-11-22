---
type: ux-audit
subject: "Terceira reconferência pré-merge do ramo feat/f75-inventory-values-kept-in-the-database: a origem do cartão em duas linhas, a galeria do celular (F89) com a leitura guardada, os textos finais e a não regressão"
project: mjrpalbumblender-v0
features: [F75, F89]
moment: delivery
date: "2026-11-22 00:30"
judged: "2026-11-22 00:30"
judged_commit: 765dd4a
who_judged: separate-agent
verdict: pass
p0: 0
p1: 0
p2: 4
duration_s: 2400
status: open
---

# Terceira reconferência — os valores do inventário guardados no banco

**Veredito: passa (`pass`), sem P0 e sem P1; 4 P2.** O P1 da segunda passada está resolvido. No computador, o cartão mostra a origem em duas linhas: «Discogs · 18 Nov» em cima de «CD · suggested» ou «CD · lowest». Nada da origem do Discogs fica cortado nas 32 combinações, nem com 99.999,99 em todo cartão. Os dois tipos se distinguem sem passar o mouse, a data se vê, a altura do cartão não mudou (501 px a 1280) e as cinco linhas seguem alinhadas entre vizinhos. Na galeria nova do celular, nada da F75 corta nem se sobrepõe. Os textos estão corretos. Os dados não regrediram.

Ficam quatro pontos menores:
- as palavras soltas «suggested» e «lowest»;
- o celular, que não diz o tipo;
- o «written by you» cortado no pior caso em reais;
- o desalinhamento entre vizinhos na galeria, que é da F89.

## Como foi feito
- **Quem julgou:** o mesmo agente juiz (Opus) das duas passadas anteriores. Ele não construiu o ramo.
- **Objeto:** `765dd4a`, extraído com `git archive`, já com a F89 que veio do `main`. Nada foi escrito no repositório.
- **Testes, pela fila:** a suíte inteira deu 4070 testes em 319 arquivos, verdes.
- **A costura** é a mesma (componentes, serviços e repositório reais; Firebase vazio; Firestore em memória; as chamadas de valor simuladas). Ela ganhou o pior caso:
  - Harvest com sugestão de 99.999,99;
  - Hejira com menor preço de 99.999,99;
  - OK Computer com valor escrito de 99.999,99;
  - um álbum sem valor;
  - dois valores comuns, um de cada tipo.
- **No computador:** Chromium do Playwright 1.56.1 no Vite de desenvolvimento, a 900, 1280, 1440 e 1920, em USD, EUR, GBP e BRL.
- **No celular:** WebKit 26.0 sobre a costura compilada (`vite build`), na galeria e na lista, em USD e BRL, com o pior caso e com valores comuns:
  - perfil iPhone 14 (390 px);
  - perfil iPhone SE (375 px);
  - 820 px.
- Zero pedidos para fora de 127.0.0.1. Os servidores foram fechados no fim.

## O que foi conferido
1. **O cartão do computador** (`results3.json` → `desk`):
   - **A origem do Discogs:** nas 32 combinações, nada cortado e nada sobreposto ao valor.
   - **A altura:** 501 px em todos os cartões a 1280, 1440 e 1920, e 645 px a 900. As posições das cinco linhas são iguais dentro de cada fileira.
   - **O texto:** 11 px, cor sobre fundo 7,17:1 (passa o AA de 4,5:1).
   - **O `title`:**
     - «Lowest asking price for this CD edition on Discogs, read on 18 Nov 2026, 11:05.»
     - «Mean of Mint, Near Mint and Very Good Plus on Discogs, for the most common CD edition, read on 18 Nov 2026, 11:05.»
   - **O pior caso em reais:** «18 Nov» chega a uns 8 px de «≈ R$ 588,999.94». Está apertado, mas não toca (`desk-1280-BRL.png`).
2. **O celular, na galeria e na lista** (`results3.json` → `iphone14-*`, `iphoneSE-*`, `w820-*`):
   - **As colunas:** 2 no iPhone 14 e no SE, 3 a 820, e 1 na lista. Nenhuma rolagem lateral.
   - **O que aparece:** o valor guardado com a data («≈ R$ 588,999.94» / «CD · Discogs · 18 Nov»), o valor escrito («CD · Yours») e o álbum sem valor («— / CD · Waiting for a value»). Nada cortado nem sobreposto no cartão da galeria.
   - **A data** nunca se parte.
   - **A folha «⋯»** de um menor preço diz «Lowest asking price for this CD edition on Discogs.», seguido de «Read on 18 Nov 2026, 11:05.» e «Data provided by Discogs.».
   - **A lista no iPhone SE:** a linha das médias («Avg Pop») é cortada e um nome de artista longo ganha reticências. As duas coisas vêm de antes do ramo (vistas na primeira passada a 320 px) e não são da F75.
3. **Os textos, tal como aparecem:**
   - **Janela, menor preço:** «The lowest price this CD was listed at on Discogs when it was read. It is an asking price, not what the disc usually sells for.» Correto e simples.
   - **`title`, menor preço:** «Lowest asking price for this CD edition on Discogs, read on 18 Nov 2026, 11:05.» Correto.
   - **`title`, sugestão:** «Mean of Mint, Near Mint and Very Good Plus on Discogs, for the most common CD edition, read on 18 Nov 2026, 11:05.» Correto, mas longo. Ele diz «mean», e a linha do cartão diz «suggested» (P2-1).
   - **Aviso da rodada:** «Values read for 2 of 2 albums. 2 values could not be saved to your inventory. This browser keeps them for six hours; Update values tries to save them again.» Correto. Com 1, diz «1 value … keeps it … save it again», também certo.
   - **Aviso de um álbum:** «The value was read but not saved to your inventory. This browser keeps it for six hours; Update values tries to save it again.» Correto.
   - **Folha do celular:** «Lowest asking price for this CD edition on Discogs.» Correto. O erro antigo, que chamava o menor preço de média, está corrigido.
4. **Não regrediu:**
   - o roteiro de dados da primeira passada, contra `765dd4a`, deu os mesmos resultados (`results-re3.json`):
     - «Read them now» leu 2 e gravou 2;
     - a guarda de seis horas valeu: 4 leituras e 0 no segundo aperto;
     - «Stop» gravou só o álbum já lido;
     - com o Discogs fora do ar, 0 escritas;
     - o lote recusado foi gravado na rodada seguinte;
     - a edição durante a rodada guardou os dois;
     - na troca de pessoa, 0 escritas;
     - num perfil novo, valores na hora;
     - a aba antiga manteve o campo;
   - a data na linha do celular continua inteira: «Discogs · 18 Nov», com espaço não separável;
   - a leitura inválida é pulada (só o «Selling England by the Pound» é gravado);
   - a gravação recusada é avisada, e o valor continua na tela.

## Achados
- **P2-1 · «suggested» e «lowest», sozinhos, dizem pouco.**
  - **Para quem lê em inglês:** «CD · suggested» pede um substantivo (suggested o quê?), e «lowest» também. A janela e o `title` chamam o primeiro de «mean».
  - **Para o dono brasileiro:** «lowest» sozinho é «o menor» de quê.
  - **Âncora:** `public/js/views/renderers/InventoryCardValue.js:40`.
  - **A mudança:** «CD · suggested price» e «CD · lowest price». Antes, mede-se em reais a 1280 com o pior caso, porque a linha tem pouca folga. Se não couber, «CD · suggestion» e «CD · lowest ask».
- **P2-2 · O celular não diz o tipo do valor.**
  - **O problema:** a linha e o cartão da galeria dizem «CD · Discogs · 18 Nov» tanto para a sugestão quanto para o menor preço. No celular não há como passar o mouse. Só a folha «⋯» e a faixa do topo («Lowest asking prices · Why?») dizem o tipo, e a faixa não distingue quando há valores dos dois tipos.
  - **Âncora:** `public/js/views/renderers/InventoryPhoneRow.js:39`; `InventoryPhoneTile.js:40`.
  - **A mudança:** o tipo na linha da origem do cartão da galeria («CD · Discogs · lowest · 18 Nov»), que já quebra em duas linhas. Na lista, com a mesma palavra do computador.
- **P2-3 · No pior caso em reais, o computador corta o valor escrito.** Com 99.999,99 (≈ R$ 588,999.94), a 1280, 1440 e 1920, o cartão mostra «CD · written…» (101 px para 76 px). É o valor escrito pela pessoa, não o do Discogs, e só nesse extremo.
  - **Âncora:** `InventoryCardValue.js:99`.
  - **A mudança:** a mesma solução de duas linhas, ou «CD · yours», como no celular.
- **P2-4 · Na galeria do celular (F89, não da F75), os cartões vizinhos desalinham.** Quando um título ou a origem quebra em duas linhas, o valor e a barra de status de um cartão descem em relação ao vizinho: 20 px no iPhone 14 e no SE («In the Land of Grey and Pink» ao lado de «Hejira»). A altura do cartão é igual, mas as linhas não alinham.
  - **Âncora:** `public/css/mobile/inventory.css:641` (`.inv-tile`, `flex-direction: column`).
  - **Evidência:** `iphoneSE-grid-BRL-long-tiles.png`; `results3.json` → `iphone14-grid-*-long`.
  - **A mudança:** a barra de status presa ao fim do cartão (`margin-top: auto`), ou o título reservando duas linhas. Isso é para a F89.

## Não visto
- **Uma conta, o Firestore e o Discogs de verdade.**
- **Um iPhone de verdade e um laptop com tela de toque.**
- **O app pelo próprio `app.html`.**
- **O tamanho de 99.999,99 em EUR e GBP no celular:** medi USD e BRL, o maior.
