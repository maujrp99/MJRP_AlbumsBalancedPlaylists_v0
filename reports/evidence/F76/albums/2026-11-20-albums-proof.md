# F76 TASK-02 · Albums no celular — prova em navegador

**Como:** Chrome sem cabeça (protocolo DevTools), 393x852 como celular (toque, escala 2) e 1280x800 como computador, sobre o **harness** `reports/evidence/F76/harness/albums.html`: a `SeriesView` de verdade, com seus componentes, o CSS do app e a casca do celular, sobre 50 séries (nomes longos: «Alternative R&B/Psychedelic/Avant-garde Soul of the Seventies») e 230 álbuns de dados de fixture; o controlador é um substituto que pagina pelo modelo real (`models/paging.js`). Sem login não se chega à tela com dados no app.

```sh
npx vite --port 5241 --strictPort --host 127.0.0.1 .          # da raiz do worktree (o harness fica fora de public/)
node reports/evidence/F76/albums/shoot-albums.mjs after 5241 9471
```

`before/` é o mesmo harness sobre `feat/f76-mobile-redesign` (d185836, só a base); `after/` é este ramo. `measures.json` de cada pasta tem tudo por cenário.

## Celular, 393x852 (antes → depois)

| Cenário | Topo do 1º álbum | Alvos < 44 | Botões só ícone sem nome | Passa da borda direita | Altura da página |
|---|---|---|---|---|---|
| Todas as séries, grade | 1126 px (abaixo da dobra) → **261** (capa até 436) | 356 → **0** | 6 → **0** | 6 → **0** | 15 915 → 11 031 |
| Todas as séries, lista | 1126 → **261** (linha de 84 px) | 376 → **0** | 6 → **0** | 6 → **0** | 21 991 → 7 431 |
| Uma série | 774 → **320** | 19 → **0** | 6 → **0** | 0 → 0 | 1 698 → 1 005 |
| Filtros ligados | 1126 → **351** | 356 → **0** | 6 → **0** | 6 → **0** | — |
| Carregando / vazio | — | 2 → **0** | 2 → **0** | 0 → 0 | 9 508 → 6 629 / 1 425 → 852 |
| As quatro folhas abertas | — | **0** | **0** | **0** | — |

Texto < 12 px e campo < 16 px: 0 em todos (antes e depois). «Passa da borda» conta o que vai além de 393 px dentro de `#app` e da folha: o `html` do celular corta a rolagem lateral (rede da base), então `scrollWidth` sozinho não prova nada — antes, o cabeçalho da série passava da borda e os botões Edit/Delete ficavam cortados (achado 2).

## Computador, 1280x800 (REQ-12)

Os 7 cenários (grade, lista, uma série, filtros, rolagem, carregando, vazio), antes e depois: **idênticos pixel a pixel**, na tela e na página inteira (até 5000 px, com as capas carregadas antes da captura), e as medidas iguais (altura, alvos, texto). As capturas da página inteira e dos outros cenários de computador ficaram fora do commit (só `grid-all` e `list-all` a 1280 entram, de amostra).

## O que vi nas capturas

- Antes: breadcrumb, título, «BLEND YOUR ALBUMS» em duas linhas, seis controles empilhados e o pager com «Series per page» quebrado em três linhas; o primeiro álbum só a 1126 px.
- Depois: busca + «Filters» numa linha, a contagem numa linha com ‹ ›, o nome da série inteiro em duas linhas com o «⋯», e a capa do primeiro álbum inteira na primeira tela. Corrigido ao olhar: a lupa sobre o «S» da busca (padding), selos que quebravam linha no ladrilho (viraram uma linha de texto cortada com reticências), o vão de 90 px entre séries na lista (`space-y-12`), o botão «voltar ao topo» sobre o «Next» do fim (respiro de 72 px), a seta gigante no botão do vazio, e o «No albums match your filters» que aparecia junto do vazio da biblioteca.

## Não verificado

iPhone de verdade (Safari, barras do Safari, área segura com a ilha); a tela com login e dados reais; o filtro aplicado de verdade (no harness o substituto do controlador só guarda os filtros: as fichas e a contagem são reais, a lista não filtra); o arrastar da folha com o dedo.
