# F76 TASK-03 — prova da janela do álbum e do meu ranking no celular · 2026-11-20

**Ramo:** `feat/f76-mobile-album-window`. **Como:** o banco de prova `reports/evidence/F76/harness/album-window.html` desenha os componentes de verdade (`ViewAlbumModal`, `UserRankModal`) com dados de exemplo — título de 72 letras («The Dark Side of the Moon (50th Anniversary Remastered Deluxe Edition)»), 16 faixas com títulos longos, um item de inventário com notas, valor do Discogs e onde comprar (F75). Servido pelo Vite do worktree (porta 5263) e fotografado pelo Chrome sem cabeça com porta própria (`shoot.mjs`), a 393x852 e 393x660 (o que o Safari deixa no iPhone 15 Pro), 667x375 (celular pequeno deitado) e 1280x800. `before/` é o código de `feat/f76-mobile-redesign` (a base), `after/` o deste ramo.

```sh
npx vite --port 5263 --strictPort --host 127.0.0.1
SCROLLED=1 node reports/evidence/F76/album-window/shoot.mjs after 5263
python3 reports/evidence/F76/album-window/compare.py
node reports/evidence/F76/album-window/touch-drag.mjs 5263
```

## O computador não muda (REQ-12)

`compare.py`: a 1280x800, janela do álbum, janela do inventário e ranking — **0 pixels diferentes** entre antes e depois, mesmas medidas (largura, alvos, caixas). As três capturas `rank-picked`, `rank-moveto` e `rank-reset` a 1280 são estados do celular forçados pelo banco de prova (no computador o app não chega a eles); não entram na comparação.

## O celular (depois)

| Tela | 393x852 | 393x660 | 667x375 |
|---|---|---|---|
| Janela do álbum: faixas inteiras à vista sem rolar | **8** | **5** | 2 (o cabeçalho sai ao rolar; a lista é a rolagem) |
| Inventário (valor e onde comprar antes das faixas, F75) | 0 | 0 | 0 |
| Meu ranking: faixas inteiras à vista | **10** (12 com uma escolhida) | **7** | 3 |
| Rolagem de lado | nenhuma | nenhuma | nenhuma |
| Alvos < 44 px / texto < 12 px / campo < 16 px | 0 / 0 / 0 em toda tela | idem | idem |
| Caixas que rolam | 1 (a própria janela, ou o corpo do ranking) | 1 | 1 |
| Título de faixa mais estreito | 288 px (álbum), 267 px (ranking): 25+ letras por linha, nenhum cortado | idem | 562 / 541 px |
| Título do álbum | inteiro, 233 px de largura, 5 linhas | idem | inteiro |
| Save do ranking | sempre à vista, 48 px, no pé | idem | idem |
| Aviso do ranking | 8 px abaixo da barra (y 56), com «Undo» de 44 px | idem | idem |

Antes (`before/*-393x852.png`): na janela do álbum as três abas com ícone e «BESTEVERALBUMS» em caixa alta, linhas em cartão com «Pink Floyd» repetido e o selo à direita, o rodapé «Close» de 72 px, a lista numa caixa com rolagem própria; no ranking os títulos cortados («Time / Breat…», «The Great Gig in the S…»), Back 36x24, Reset 67x36, Save 82x36 no topo, só arrastar. (As contagens de faixas do `before/measures.json` são 0 porque a marcação antiga não tem as classes que o script conta; vale a captura.)

## Arrastar por toque

`touch-drag.mjs` (Chrome a 393x852 com toque emulado; `after/touch-drag.json`): um dedo na alça da faixa 1 descendo cerca de 2,6 linhas leva «Speak to Me» ao 4º lugar e os números da tela se refazem (1, 2, 3, 4); o mesmo gesto sobre o título da faixa 2 **rola** a lista 235 px e não muda a ordem. A SortableJS trata o toque; no computador a alça continua sendo a linha inteira (`handle: '.group'`, provado no teste de unidade).

## O que vi nas capturas

- Janela do álbum: a capa à esquerda, o título inteiro ao lado, a capa desfocada atrás dando cor ao topo; o segmentado laranja só na fonte ligada; as faixas em duas linhas, a duração alinhada com o título. Ao rolar, a barra fica opaca com o título numa linha e o fechar à direita (`album-393x852-scrolled.png`). Corrigido depois da primeira captura: o segmento ligado media 38 px de altura (agora 44, a pílula desenhada por dentro), a capa ficava presa embaixo do cabeçalho (agora no topo), sobrava um vão de 24 px herdado da tabela do computador.
- Inventário: as notas em amarelo, o valor em grade de 2x2, os links do Discogs com área de 44 px (as linhas do parágrafo ficam mais espaçadas: legível, um pouco solto), a compra em grade de 2.
- Ranking: número grande, título em linha própria, referências e duração embaixo em 12 px, alça à direita; a faixa escolhida com anel laranja e a fila «Up · Down · Move to… · Done» acima de «Save ranking»; «Move to…» abre os números de 1 a 16 em grade de 5 (48 px), com o lugar atual marcado. Corrigido: «Down» encostava nas bordas do botão; os números de dois dígitos encostavam na margem.

## O que não verifiquei

- O iPhone de verdade (Safari, áreas seguras reais, o arrastar com o dedo no iOS, que usa eventos de toque e não de ponteiro como o Chrome). O desfoque de 40 px da capa no Safari não foi medido em desempenho.
- A janela aberta pelo app com login (Albums e Inventário): só pelo banco de prova.
- VoiceOver lendo a linha do ranking e o anúncio «… is now number N».
