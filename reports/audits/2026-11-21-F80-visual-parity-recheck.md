---
type: ux-audit
subject: "Reconferência visual independente da página de entrada: a caixa de discos em diagonal com palco largo (UAT-235) e a capa da banana na frente (UAT-236)"
project: mjrpalbumblender-v0
feature: [F80, UAT-235, UAT-236]
date: "2026-11-21 11:56"
moment: delivery
judged: "fix/f80-uat-entry-page @ 46fea62 (últimos commits de tela d88b0cf e 42d4cad) contra a prévia 2 «Palco largo» do comparador (https://claude.ai/artifact/5hDJr8qToYkAEsgCrfUK8e, arquivos b-*) e as palavras do MJRP; o resto da página contra main @ 5310864"
who_judged: separate-agent
verdict: fail
p0: 0
p1: 0
p2: 1
human_decisions: 0
status: open
---

# Reconferência visual — a caixa em diagonal e a capa da banana

**Veredito: não passa limpo, sem P0 e sem P1 (`fail`, `p0: 0`).** Os dois pedidos do MJRP estão feitos. A caixa em 3D aparece em diagonal, como na prévia 2, e fica **inteira** no quadro em todas as posições da rolagem, de 900 a 1920 px. O palco vai até a borda direita da janela. O disco puxado fica legível e o fogo ilumina por baixo. A capa da banana é o primeiro disco, o King Crimson é o segundo e nenhum disco sumiu. Fica **um P2**, fora do 3D: na caixa em CSS (sem WebGL ou com «menos movimento»), girada para o lado, o disco da frente se inclina para fora da caixa. Com a capa da banana, que é quase toda branca, isso aparece como uma cunha branca. Virou a issue **UAT-237**, que volta para a F80. O ramo pode ir para a `main`.

## Como foi feito

- **Quem julgou:** um agente que não implementou a F80, os consertos UAT-235 e UAT-236, nem as prévias. Li a prova do implementador (`reports/evidence/F80/uat/2026-11-21-uat-235-crate-diagonal-proof.md`) e as linhas UAT-235 e UAT-236 de `docs/specs/uat.md`, mas tirei minhas próprias capturas.
- **Servidores** (Vite de desenvolvimento, já parados):
  - o ramo com capas reais: `VITE_SPLASH_COVERS=real npx vite --port 5191`;
  - o ramo com o conjunto padrão, de capas fictícias: porta 5192;
  - a `main` (5310864, sem nenhuma mudança em `public/` desde a base do ramo), com capas reais: porta 5193.
- **Referência:** a prévia 2, «Três-quartos, palco mais largo», do comparador publicado (arquivos `b-<largura>-<pose>.webp`). As imagens dela são de antes da UAT-236, por isso mostram o King Crimson na frente. Para a ordem dos discos, a referência são as palavras do MJRP: «pode colocar a capa inicial com a do velvet underground & nico a capa da banana?» e «mas mantenha o king crimson so nao ser a primeira».
- **Capturas próprias:** Chromium headless (Playwright 1.56.1, emprestado de `MJRPpersonal`), com WebGL por SwiftShader, sem nada instalado. Os scripts estão em `reports/evidence/F80/recheck-uat235/` (`cap.mjs`, `edges.py`, `dom.mjs`, `phone.mjs`, `thread.mjs`).
  - Capas reais, em 10 posições (A1 a A5, a virada a 25%, 50% e 75%, B1, B2), nas larguras 1280, 1440, 1920, **900, 1000, 1100 e 1200**. Também a 393, no celular.
  - Capas fictícias, a 1280 e 1440.
  - `?nogl` a 1280 e 1440, «reduzir movimento» a 1440 e a `main` com `?nogl` a 1440.
  - Medido em cada captura: os pixels claros nas bordas de cima, da esquerda e da direita do quadro 3D, para ver se a caixa encosta na borda ou é cortada; o retângulo da cena contra a largura da janela; a largura da página; a faixa e a legenda.
- **O sensor.** O contrato ainda não declara `sensors.visual`, então rodei o kit (`mjrp-scripts/visual_parity/run.mjs`) com uma config desta rodada: `reports/evidence/F80/recheck-uat235/visual-main-vs-branch.config.mjs`. Ela compara a `main` (no lugar do protótipo) com o ramo, em Chromium, a 1440, 1280 e 393, nos cenários início, A3, virada, B1 e B2. São 15 registros. Pus o comando na fila da máquina (`machine_load.py`), mas ele ficou em 10º lugar. Tirei da fila e rodei direto, porque são só capturas.

## O resultado do sensor

| Exit | P0 · P1 · P2 | Resumo |
|---|---|---|
| 0 | 0 · 0 · 0 | `reports/evidence/F80/recheck-uat235/sensor/2026-11-21/summary.md` |

Não há linha para julgar. O sensor lê o DOM e não enxerga o desenho do 3D. O zero dele confirma que **o resto da página não mudou** (cabeçalho, textos, botões, rodapé). O que muda na caixa foi julgado pelos olhos, abaixo. Um diff próprio do DOM (`dom.mjs`) a 1440 também deu igual à `main`; só as barras animadas do equalizador mudam. A 393, tudo abaixo da legenda desce 38 px, porque a legenda ficou mais alta (ver «Não são achados»).

## O que foi conferido, ponto a ponto

| Pedido | Resultado | Evidência |
|---|---|---|
| Caixa em diagonal, como a prévia 2, a 1280, 1440 e 1920 | **Sim.** Mesmo ângulo, mesmo tamanho e mesma posição da prévia, lado a lado, na abertura, em A3, na virada e em B1. | `pair-preview2-vs-branch-1440-a1.webp`, `-1280-a3`, `-1920-flip`, `-1280-b1` |
| Caixa **inteira** no quadro em todas as posições (abertura, cada disco puxado, a virada, o lado B) | **Sim**, de A1 a B1, em todas as larguras de 900 a 1920. Nenhum pixel claro encosta nas bordas de cima, da esquerda ou da direita do quadro (`edges.py`: 0 em todas). Em B2 o cabeçalho fixo cobre o alto do palco, como na `main`, e a caixa fica inteira abaixo dele. | `branch-1280-poses.webp`, `branch-1440-poses.webp`, `branch-1920-poses.webp`, `branch-1440-1920-b2.webp`, `branch-real-facts.json` |
| O palco vai até a borda direita da janela | **Sim.** A cena termina em x = largura da janela em todas as larguras (1280→1280, 1440→1440, 1920→1920, 900→900), e a legenda fica na coluna. A página não ganha rolagem lateral (largura da página = largura da janela). | `branch-real-facts.json` (`scene`, `sw`, `cw`) |
| A capa do disco puxado legível | **Sim:** Low, The Dark Side of the Moon, Dummy, Illmatic e In the Aeroplane Over the Sea aparecem de frente o bastante para ler o título. | as folhas de poses |
| O fogo ilumina por baixo | **Sim:** brilho laranja na base e nas capas da frente, nas três larguras. | as folhas de poses |
| Primeiro disco = a capa da banana; King Crimson em segundo; nenhum disco faltando | **Sim.** 15 capas reais: VU & Nico, King Crimson, Dark Side, Low, Power Corruption & Lies, Dummy, Illmatic, Harvest \| Close to the Edge, Homogenic, Mezzanine, Aeroplane, Admirável Chip Novo, Desire, To Pimp a Butterfly. As 14 da `main` estão todas lá; o Harvest foi para o fim do lado A. As capas fictícias continuam 14, na ordem de antes. A legenda da abertura diz «The Velvet Underground & Nico». | `branch-real-facts.json`, `branch-fictional-facts.json`, `branch-fictional-1440-poses.webp` |
| A faixa Lado A / Lado B e «Flip the record» com 8 + 7 | **Sim.** Cada parada da faixa leva à sua parte e põe na legenda o mesmo disco da `main`: A3 Low, A2 Dark Side, B1 Aeroplane, B2 To Pimp a Butterfly. «Flip the record» gira a caixa (`flip` vai de 0 a 1). «Pause motion» pausa. | `thread.mjs` (saída no fim deste relatório) |
| Menos movimento e sem WebGL: a caixa em CSS | Aparece girada −15° nos dois casos, com a banana na frente e inteira. **Mas** nas posições com disco puxado, os discos inclinados passam da frente: **P2-1**. | `css-crate-nogl-reduce-main-1440-1280.webp`, `css-crate-main-vs-branch-1440-a3.webp` |
| 393 (celular): a caixa como antes, sem passar da largura | **Sim.** Sem 3D, sem giro, sem palco largo; cada faixa traz o seu disco, como na `main`. Largura da página: 393. A única diferença é a capa da banana na frente e a legenda dela. | `phone-393-main-top-branch-bottom.webp`, `phone-393-caption-main-vs-branch.webp` |
| De 900 a 1280, no navegador (o implementador só testou por teste unitário) | **Inteira em todas** as posições, a 900, 1000, 1100 e 1200. A 900 a caixa fica menor que a da `main` na abertura, mas a `main` cortava a caixa na virada; agora não corta. | `branch-900-1100-poses.webp`, `main-vs-branch-900-a1-flip.webp` |
| O resto da página igual à `main` | **Sim** (sensor 0 · 0 · 0; diff do DOM a 1440 igual). | `sensor/2026-11-21/summary.md` |

## Achados

### P2-1 — Na caixa em CSS, o disco da frente sai da caixa como uma cunha branca (UAT-237)

- **Onde:** a página sem WebGL (`?nogl`) ou com «reduzir movimento», no computador (1280 e 1440 conferidos), sempre que um disco é puxado: Lado A · 2 a 5 e Lado B · 1.
- **O que se vê:** a caixa em CSS gira −15°. Os discos à frente do puxado se inclinam para a frente e passam da borda esquerda da tábua da frente, com uma faixa preta em cima. A banana é quase toda branca, então o que sobra para fora é um triângulo branco, sem desenho, que não se lê como capa. Na `main`, sem o giro, sobrava só uma borda fina dos dois lados. Na prova do implementador (`uat-235-1440x900-a3-reduce.webp`, ainda com o King Crimson na frente) o mesmo pedaço já saía da caixa, mas vermelho, e chamava menos atenção. A troca para a banana deixou o defeito visível.
- **Por que P2:** é o caminho de reserva: quem tem WebGL e movimento normal vê o 3D, que está certo. A caixa continua se lendo como caixa, nada some e nenhum texto é afetado. Mas quem pede «menos movimento» vê isso em cinco das sete partes.
- **Dono:** a F80 (`mjrp-implementing-tasks`, nova rodada). Issue **UAT-237**, `fixing (F80)`, aberta por agente.
- **Evidência:** `reports/evidence/F80/recheck-uat235/css-crate-main-vs-branch-1440-a3.webp` (`main` à esquerda, o ramo à direita), `css-crate-nogl-reduce-main-1440-1280.webp`.

## Não são achados (julgados e deixados)

- **A legenda da banana no celular (393).** O nome «The Velvet Underground & Nico» aparece duas vezes, como título e como artista, e cada vez quebra em três linhas ao lado do botão «Listen on Apple Music». A legenda tem 8 linhas, contra 7 do King Crimson na `main`, e fica 38 px mais alta, o que desce o resto da página. Não passa da largura e tudo se lê. É o mesmo desenho da `main`: o título do King Crimson também quebrava em três linhas. Muda só o tamanho do nome, então é **dado, não forma** (falso positivo de dado). Não abri issue. Se o MJRP achar a legenda alta demais, é uma escolha de desenho dele, não um defeito.
- **A 900 e 1000 px, o título da legenda é cortado com reticências** («The Velvet …»), e o artista quebra em três ou quatro linhas. A `main` já fazia o mesmo («In the Cour…»): é anterior a este ramo e vem da coluna estreita, não do conserto.
- **Durante a virada a caixa fica menor** do que na abertura. A câmera se afasta para caber a caixa girando: a 1440, a caixa passa de cerca de 577 px de largura na abertura para cerca de 353 a 25% da virada. É o preço de «inteira no quadro», que a prévia 2 já mostrava e o MJRP escolheu.
- **Durante «Flip the record» a legenda continua a dizer a banana.** É o disco da frente do lado A, como o King Crimson era na `main`.

## O que fica com o MJRP

Nenhuma decisão. A UAT-237 é do agente: o conserto volta para a F80 e outro agente o fecha.

## O que não pude conferir

- Safari e Firefox de verdade, e uma GPU real: só Chromium, com WebGL por software (SwiftShader).
- O movimento em si: julguei posições paradas, depois de 2,2 s de espera em cada uma. A transição entre as posições e o fade do 3D ao carregar não foram vistos quadro a quadro.
- O toque num celular de verdade e o iPhone.
- A prévia 2 nas larguras de 900 a 1200: o comparador só tem 1024, 1280, 1440 e 1920. Entre 900 e 1200 comparei com a `main` e com a regra «inteira no quadro».
- A caixa em CSS a 1920 e com capas fictícias.

## Como rodar de novo

1. No worktree do ramo: `VITE_SPLASH_COVERS=real npx vite --port 5191 --strictPort --host 127.0.0.1`. Na `main`, o mesmo na porta 5193. O conjunto padrão roda sem a variável, na 5192.
2. Sensor: `node mjrp-scripts/visual_parity/run.mjs reports/evidence/F80/recheck-uat235/visual-main-vs-branch.config.mjs`.
3. Poses e bordas: `node cap.mjs http://127.0.0.1:5191/ real out 1280,1440,1920,900,1000,1100,1200,393` e depois `python3 edges.py out/real-facts.json out real`. `cap.mjs` aceita `few,nogl` ou `few,reduce` como 5º argumento. O caminho do Playwright fica no topo de cada script.

Saída de `thread.mjs` (1440, capas reais), na ordem: parada clicada, faixa, giro, rótulo, legenda.

```
#a3 ["a3","0.00","Side A · 3 — Ranking","Low | David Bowie · 1977"]
#flip ["flip","0.61","Flip the record","The Velvet Underground & Nico | The Velvet Underground & Nico · 1967"]
#b1 ["b1","1.00","Side B · 1 — Why whole albums","In the Aeroplane Over the Sea | Neutral Milk Hotel · 1998"]
#a2 ["a2","0.00","Side A · 2 — Series","The Dark Side of the Moon | Pink Floyd · 1973"]
pause [ 'true', 'js moving paused' ]
```
