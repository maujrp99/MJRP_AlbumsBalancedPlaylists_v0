# F76 · TASK-03 — a janela do álbum e o meu ranking no celular

REQ-06 e REQ-07; achados 3 e 14 da crítica de UX de 2026-11-20 e o aviso próprio do ranking (kit); benchmark, seções 2 e 3. Ramo `feat/f76-mobile-album-window`. Celular = até 767 px; a 768 px ou mais nada muda (provado: 0 pixels diferentes a 1280x800, `reports/evidence/F76/album-window/`). Tudo aqui foi **decidido pelo agente — revisável**, salvo onde a fonte é dita.

## A janela do álbum (aberta por Albums e pelo Inventário)

**O que é no celular.** Tela cheia (a casca é da base, `mobile.css` § 8.3). Uma rolagem só: a janela inteira rola, e o cabeçalho sai de cena para as faixas.

Inventário de elementos, de cima para baixo:

| Bloco | O que mostra | Onde |
|---|---|---|
| Barra (48 px + área segura do topo), presa no alto | à esquerda o título do álbum numa linha (aparece só quando o título do cabeçalho saiu da vista), à direita **fechar** (X, 44 px, `aria-label="Close"`) | `ViewAlbumModal.js` (`createPhoneBar`, montada só se `isPhone()`, com `md:hidden`); `album-window.css` § 2 |
| Cabeçalho (o herói) | capa de 112 px (raio 10, sombra, fio interno de 1 px) ao lado do **título inteiro** (20/24, 700, quebra de linha, nunca cortado), artista (15/20, branco 78 %), ano, formato e estado (12 px); no inventário, pago e condição | § 3 |
| Fundo do cabeçalho | a própria capa, ampliada, desfocada (40 px, saturação 1,4) e escurecida em degradê até o fundo da janela | `setGlow` (só no celular); § 3 |
| Notas (inventário) | o texto da pessoa, em amarelo | inalterado; margem de 16 |
| Valor estimado e Onde comprar (F75, inventário) | os mesmos blocos e comportamentos; os quatro preços em grade de 2x2; o campo a 16 px ocupa a linha; os links de texto («Read again», «See it on Discogs», «Data provided by Discogs») respondem em 44 px; as lojas em grade de 2 | só CSS, § 6 |
| As três fontes | **um controle segmentado** de três rótulos curtos — «Original», «BEA», «Spotify» (`aria-label` com o nome inteiro, `aria-pressed`) —, preso logo abaixo da barra enquanto as faixas rolam; a fonte ligada em laranja com texto escuro | `TracksTabs.js`; § 4 |
| Faixa (60 px no mínimo) | número (13 px, cinza), **título sozinho na primeira linha** (16/22, 600, quebra), o artista da faixa só quando não é o do álbum, e embaixo «BEA #4» e «Spotify 61%» (12 px; a referência da ordem ligada em branco, a outra em cinza); a duração à direita, na linha do título, com algarismos tabulares | `TracksTabs.js`; § 5 |

**Estados.** Carregando / sem faixas / faixas não carregadas: a linha de texto de sempre no lugar das faixas. Rolado: a barra fica opaca com o título e o fio de baixo (`album-window--scrolled`, por `IntersectionObserver` no título do cabeçalho). Deitado e baixo (altura até 500 px, ex. 667x375): capa de 72 px. Sem capa: sem o fundo desfocado. Movimento reduzido: sem transições.

**Nada abre como folha** nesta janela.

**Decisões.**
- Uma rolagem só, com a janela como a coisa que rola, em vez de uma caixa de faixas com rolagem própria: o achado 3 mediu 286 px de lista (uma ou duas faixas) e 48 px deitado. Fonte: kit, regra 4; benchmark § 2 «Evitar: caixa de rolagem interna».
- O cabeçalho rola embora em vez de encolher por animação ligada à rolagem: mais simples, nenhum custo no Safari, e a barra com o título faz o papel do cabeçalho encolhido. O benchmark dá o cabeçalho que encolhe como «de memória» (conferência C, linha 2).
- Capa de 112 px ao lado do título, não de 200 px centrada como no benchmark: com 200 px o cabeçalho passa de 300 px e não sobram cinco faixas na área que o Safari deixa (393x660). Medido: 8 faixas inteiras a 393x852, 5 a 393x660.
- Fechar à direita, na barra, como o fechar da folha do kit (`Sheet.js`); o «Close» do rodapé e o X do cabeçalho saem no celular (o mesmo `handleClose`), o que devolve 72 px às faixas.
- Rótulo «BEA» no segmentado e nas referências: é a sigla que o app já usa no ranking («#4 BEA»); o nome inteiro vai no `aria-label`. HIG, controle segmentado: rótulos curtos, larguras iguais, só texto.
- Laranja: só a fonte ligada (estado «ligado»). O artista deixou de ser laranja no celular (laranja não é para rótulo; brief, correções da conferência).
- No inventário o valor e a compra continuam **antes** das faixas (decisão do F75; é o que se vai ver ao abrir pelo inventário): ali as faixas ficam abaixo da dobra e se alcançam pela mesma rolagem.

## O meu ranking

**O que é no celular.** Tela cheia (casca da base, `mobile.css` § 8.4). O desenho é outro só no celular: `UserRankModal` chama `rankWindowPhone.js` quando `isPhone()`, e se a tela deixa de ser (ou passa a ser) celular com a janela aberta, ela se redesenha na mesma ordem.

| Bloco | O que mostra |
|---|---|
| Barra (48 px), fixa | «‹ Back» (44 px) · «My ranking» (17/22) · «↶ Reset» (44 px). Reset fica longe de Save |
| Corpo, a única parte que rola | o álbum (20/24, inteiro), o artista, a dica «Tap a track to move it with the buttons below, or drag it by its handle.», as faixas, e a nota de rodapé de antes («BEA and Spotify ranks are shown for reference…») |
| Faixa (60 px no mínimo) | um botão que a escolhe (`aria-pressed`): o número da posição (18 px, 700) e o **título em linha própria** (16/22, quebra; o mais estreito tem 267 px, 25+ letras), embaixo «BEA #4 · Spotify #3 · 5:12» em 12 px; à direita a **alça** de 44 px, a única parte que arrasta (`touch-action: none`) |
| Faixa escolhida | anel laranja de 2 px e fundo elevado; no pé aparece «↑ Up», «↓ Down», «Move to…», «Done» (44 px) |
| Pé, sempre à vista | «Save ranking», 48 px, a largura toda, laranja com texto escuro |
| «Move to…» | **folha de baixo** (`openSheet`) com os números de 1 a n em grade de 5 (48 px); o lugar atual marcado e desligado; um toque e a faixa vai |
| Aviso da janela | abaixo da barra (8 px), largura da tela menos as margens; depois de Reset diz «Back to the order of the album.» com **«Undo»** (44 px) por 5 s; «Ranking saved!» e o erro de gravar no mesmo lugar |

**Estados.** Nenhuma escolhida (o pé só com Save); uma escolhida (fila de mover; «Up» desligado na primeira, «Down» na última); arrastando (a linha levantada, sombra); folha aberta (Escape fecha a folha, não a janela); depois de Reset (aviso com Undo); gravado (aviso, a janela fecha em 0,5 s, como antes). Mudança de posição anunciada a leitor de tela («Money is now number 3», região `aria-live`).

**Decisões.**
- Mover sem arrastar por **tocar e escolher**, com Up/Down e «Move to…» no pé, em vez de dois botões em cada linha: o título fica com 267 px em vez de cerca de 177, e «Move to…» resolve o caso comum (a faixa 14 para o 2º lugar) num toque. Fontes: WCAG 2.2, SC 2.5.7 (alternativa sem arrastar, nível AA); NN/g, arrastar (no celular mover por menu erra menos); IMDb e Plex (digitar/escolher a posição) — benchmark § 3.
- Arrastar só pela alça no celular (no computador segue a linha inteira): um dedo no título rola a lista. Provado em `touch-drag.mjs`: a alça leva a faixa 1 ao 4º lugar; o mesmo gesto no título rola 235 px sem mudar a ordem.
- Reset **desfazível** (5 s) em vez de confirmado: não interrompe quem quer recomeçar, e o erro tem volta. O computador continua sem Undo (REQ-12).
- Save no pé, sempre à vista; Reset na barra do topo, do outro lado da tela. Benchmark § 3 «Evitar: Salvar no fim da lista».
- O azul-céu do ranking sai no celular: laranja é Save e a faixa escolhida (as duas únicas cores de destaque); os números e referências em branco e cinza. Correção da conferência sobre o laranja (um papel: ação principal e estado ligado).
- O aviso abaixo da barra, nunca sobre o Save (design-system, Regras 5).
- Não pedi «Descartar mudanças?» ao sair com mudanças (o benchmark sugere): mudaria o que Back faz hoje; fica como proposta.

## O que mudou no código

- `components/ViewAlbumModal.js`: `phonePartsOf` (barra, capa desfocada, título que vem para a barra) — só no celular; no computador nada muda.
- `components/ranking/TracksTabs.js`: reescrito (é desenhado só abaixo de 768 px): segmentado + linhas de duas linhas. `TracksRankingComparison.js` passa o artista do álbum.
- `components/ranking/UserRankModal.js`: desenho do celular por `rankWindowPhone.js` (novo), `moveTrack(from, to)`, alça por tela, redesenho na troca de tela, o aviso ganha a classe `rank-toast`, `role="status"` e uma ação opcional; o número da posição é achado por `data-role="rank-number"`.
- CSS: `public/css/mobile/album-window.css` e `public/css/mobile/ranking.css`, inteiros dentro da consulta do celular.
- Nenhum arquivo fora da lista da tarefa.

## Medido (banco de prova, `reports/evidence/F76/album-window/`)

393x852 e 393x660: nada rola de lado; 0 alvos abaixo de 44 px, 0 textos abaixo de 12 px, 0 campos abaixo de 16 px; uma caixa que rola por janela (a própria janela, ou o corpo do ranking). Janela do álbum: 8 faixas inteiras à vista a 393x852, 5 a 393x660; título do álbum inteiro. Ranking: 10 e 7 faixas; nenhum título cortado; Save sempre à vista. 1280x800: idêntico ao antes, pixel a pixel.

## O que não verifiquei

O iPhone de verdade (Safari, áreas seguras, o arrastar com o dedo no iOS); o desempenho do desfoque da capa no Safari; as janelas abertas pelo app com login; VoiceOver.
