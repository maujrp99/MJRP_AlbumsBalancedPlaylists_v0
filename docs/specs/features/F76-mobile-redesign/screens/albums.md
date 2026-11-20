# Albums no celular (TASK-02 · REQ-01, REQ-05)

Nota da tela, para o integrador dobrar em `info-arch.md`, `behavior.md` e no manual. Tudo aqui é **decidido pelo agente — revisável** (o MJRP deu liberdade de desenho na F76 e julga no iPhone). «Celular» = até 767 px (`isPhone()`); o computador não muda (REQ-12, provado pixel a pixel).

## O que a tela é no celular

`/albums` (todas as séries) e `/albums?seriesId=…` (uma série), de cima para baixo:

| Bloco | O que mostra | Ao tocar |
|---|---|---|
| Barra do topo (base) | «Albums»; numa série, **o nome da série** (`nameThisScreen`, achado 19) | — |
| Cabeçalho de uma série (só `?seriesId`) | o nome inteiro (20/24, quebra), o «⋯» de 44 px, «Blend your Albums» (48 px, a ação principal, laranja) | «⋯» → folha da série; Blend → `/blend?seriesId=…` |
| Barra de busca | campo de busca (44 px, 16 px) + botão **«Filters»** com a contagem dos ligados (bolinha laranja = estado «ligado») | Filters → folha de filtros |
| Fichas (só com filtro ligado) | uma por filtro, «Artist: Rush ✕» (36 px desenhados, 44 de toque), e «Clear all» com duas ou mais | a ficha desliga o seu filtro |
| Pager de cima | uma linha: «1–10 of 50 series · 71 albums» e, em páginas, ‹ › de 44 px | página anterior / seguinte |
| Série | cabeçalho preso sob a barra do topo enquanto seus álbuns rolam: nome em até 2 linhas (18/22), «N albums», «⋯» | «⋯» → folha da série |
| Álbum, grade | ladrilho em 2 colunas: capa quadrada (raio 10, a protagonista), título em até 2 linhas (15/20, 600), «artista · ano» em até 2 linhas, uma linha de selos em texto («My ranking · BestEverAlbums · Spotify», cortada com reticências), «⋯» de 44 px | capa ou texto → janela do álbum (como hoje); «⋯» → folha do álbum |
| Álbum, lista | uma linha compacta: capa de 56, título (16/21, até 2 linhas), «artista · ano», selos em pílula de 12 px, «⋯» | linha → janela do álbum; «⋯» → folha do álbum |
| «Load N more albums» | botão de largura toda, 48 px | abre a série inteira (F49) |
| Pager de baixo | a contagem; ‹ «Page 2 of 5» › (o meio é um seletor que pula a qualquer página); «Series per page» e Pages/Scroll (44 px); no modo Scroll, «Load N more» de largura toda e o carregar ao chegar ao fim | os mesmos `onPage`/`onSize`/`onMode`/`onMore` do computador |

**Folhas** (todas `openSheet`, de baixo):
- **Filters** («Filters · 2 on»): View (Grid | List, controle segmentado), Sort series by, Series, Artist, Year, Source (seletores de 16 px), «Reload albums from the sources»; no pé, «Clear filters» e «Show albums». Cada controle chama o mesmo handler do computador; a folha segue as props enquanto aberta (uma troca de série zera os outros filtros e a folha mostra).
- **Álbum** (título = o álbum; «artista · ano»): View album and tracks · Rank the tracks / Edit my ranking · Add to inventory · Fetch the details again · Open in Spotify ↗ · See on BestEverAlbums ↗ — linha — **Remove from this series** (vermelho, último, separado; pede confirmação como hoje).
- **Série** (título = a série; «N albums»): Edit series — linha — **Delete series** (vermelho; confirmação como hoje).

**Estados:** carregando (esqueleto da série em 2 colunas, 4 ladrilhos), vazio da biblioteca (ícone de 48, frase, um botão «Go to Home»; o «No albums match your filters» que vinha junto sai no celular), série que falhou (aviso e «Try again» de 44), nenhum resultado dos filtros (frase do pager), uma série só (sem pager, com o cabeçalho próprio).

## Decisões e por quê

1. **Filtros numa folha, com contagem e fichas** — achado 8 (640 px antes do 1º álbum). Benchmark § 1 (NN/g, mobile faceted search: bandeja de filtros com rótulo em palavra e contagem à vista). O botão se chama «Filters» (palavra, não ícone); a contagem é o único laranja da barra.
2. **Grade e lista e Refresh dentro da folha de filtros** — «um lugar quieto» (benchmark § 1: «alternador lista/grade dentro da folha de filtros, não na tela»). Refresh virou «Reload albums from the sources», a última linha da folha.
3. **O pager de cima é uma linha** (contagem + ‹ ›): mantém o F72 (contagem, as duas formas, cima e baixo) sem empurrar os álbuns; tamanho e forma ficam só no de baixo. O de baixo troca a fila de números (até 11 botões) por ‹ «Page n of m» › — o seletor alcança qualquer página com um alvo só. A forma preferida continua escolha da pessoa (Pages/Scroll), não foi forçada.
4. **Ladrilho em 2 colunas** (capa de ~172 px, nos tamanhos do benchmark § 9.1) e não 3: com 3 colunas o título em 2 linhas não caberia (achado 7 pedia título e artista inteiros). Toque no álbum abre a janela do álbum como hoje; as ações (Rank, Add, Remove, Refetch, View, e os links de fonte, que no ladrilho eram selos-link de 9 px) foram para a folha do «⋯», nomeadas; Remove por último, em vermelho, separado por uma linha (nunca ao lado de Add).
5. **Lista = linha compacta sem a tabela de faixas** (achado 1: 205 896 px de página). As faixas estão na janela do álbum, a um toque.
6. **Cabeçalho da série preso** sob a barra do topo (benchmark § 1, NN/g acordeão com cabeçalho preso), opaco, com o nome inteiro em até 2 linhas; Edit e Delete numa folha pelo «⋯» de 44 px (achado 2: os botões ficavam fora da tela). O cartão de borda da série saiu no celular: a grade usa a largura toda.
7. **Breadcrumb e título grande saem no celular** (achado 22: breadcrumb de 19 px): a barra do topo diz onde se está e a barra de baixo leva a Home e a Blend. Em todas as séries o botão Blend sai (a aba Blend faz o mesmo); numa série ele fica, porque leva à mistura **daquela** série.
8. **Texto dos álbuns na fonte do sistema** (SF Pro no iPhone): Syne fica no nome da tela; a 13–16 px ela perde leitura (benchmark § 9.2). Cinza secundário `#A0A0A8` (≈7:1 sobre o preto, benchmark § 9.5; nada de `#6E6E76` em texto).
9. **Laranja**: só a ação principal (Blend numa série; «Show albums» na folha), a contagem de filtros ligados e a forma de paginação ligada.

## O que mudou no código (para o integrador)

- Novos: `components/ui/AlbumPhoneCard.js` (ladrilho e linha), `components/ui/FilterSheet.js` (folha de filtros), `components/series/SeriesPhoneSheets.js` (folhas do álbum e da série).
- `FilterToolbar` ganha a prop `filtersInSheet` (só a tela de Albums liga; a de playlists salvas não muda). `Pager` desenha a forma do celular quando `isPhone()` e redesenha na rotação. `AlbumsGridRenderer` escolhe ladrilho/linha no celular. `renderSeriesHeader` e `SeriesHeader` ganham o «⋯» com `md:hidden`. `SeriesEventHandler` ouve `album-more` e `series-more`. `SeriesView` chama `nameThisScreen` e redesenha ao cruzar a linha do celular.
- CSS só em `public/css/mobile/albums.css`, todo dentro da consulta de mídia.

## Medido (harness, `reports/evidence/F76/albums/2026-11-20-albums-proof.md`)

A 393x852: 1º álbum de 1126 px para **261 px** (a capa termina em 436), alvos < 44 de 356 para **0**, botões só-ícone sem nome de 6 para **0**, nada passa da borda direita (antes, 6 elementos do cabeçalho de série), texto < 12 e campo < 16: 0. A lista: 7 431 px para 10 séries (antes 21 991 no harness; 205 896 na crítica). A 1280x800, 7 cenários idênticos pixel a pixel antes e depois.

## Não verificado

iPhone de verdade (barras do Safari, ilha, áreas seguras no app da tela de início); a tela com login e dados reais; o efeito real dos filtros (no harness o controlador é um substituto); arrastar a folha com o dedo; o desempenho da lista de artistas com centenas de nomes dentro da folha.
