---
type: ux-audit
subject: "Reconferência visual em lote, grupo «álbuns e séries» (/albums e a janela do álbum): F45, F46, F47, F48, F49, F51, F52, F55, F68, F69, F72, F74 — a tela de hoje, 1280 e 393, contra o design system"
project: mjrpalbumblender-v0
features: [F45, F46, F47, F48, F49, F51, F52, F55, F68, F69, F72, F74]
moment: delivery
date: "2026-11-21 13:30"
judged: "2026-11-21 13:30"
judged_commit: 2540cb7
who_judged: separate-agent
verdict: fail
p0: 0
p1: 2
p2: 5
duration_s: 3000
status: open
---

# Reconferência visual em lote — álbuns e séries

**Veredito: não passa (`fail`), sem P0; 2 P1 e 5 P2.** A tela de álbuns de hoje mostra a maior parte do que estas features pediram: contagem, páginas, filtros que valem para todas as séries, estados por série, «Load N more albums», as notas de identidade do álbum e as notas das faixas certas. Dois estados de falha que dois requisitos descrevem não aparecem em tela nenhuma (P1). Nenhum P0: nada impede usar a tela.

## Como foi feito
- **Quem julgou:** um agente juiz (Opus) que não implementou nenhuma destas features; capturas por um agente de captura (Sonnet) com roteiro.
- **Referência:** nenhuma destas features teve protótipo aprovado (via rápida). A referência é o `docs/specs/design-system.md` e o que o MJRP aprovou usando o site — a camada do celular da F76, em produção desde 2026-11-20, redesenhou esta tela no celular depois de todas estas features; julgo a tela de hoje.
- **Objeto:** o código da `main` local (`1101874`). Sem entrar com conta não se chega à tela com dados; usei a costura das provas da F76: a `SeriesView` real, os componentes, o CSS e a casca do celular reais, com 50 séries e ~230 álbuns de fixture e um substituto do controlador que chama o código real de filtro, contagem, paginação e estado de série (`filterSeries`, `countAlbums`, `paginate`, `deriveSeriesState`). A janela do álbum é a `ViewAlbumModal` e a `UserRankModal` reais, com um `Album` de fixture. Nada gravado, nenhuma rede do Firebase.
- **Capturas e medidas:** `reports/evidence/visual-recheck-batch/2026-11-21/albums/` (`NOTES.md`, `measures.json`, `shoot.mjs`, `harness/`). 1280 x 800 e 393 x 852 (celular, toque, escala 2). Mais a produção deslogada em `.../shell/prod-albums-*.png`.

## Por feature — o que olhei e contra o quê
- **F45 (álbuns em paralelo):** o tempo de carga não se vê num harness; o visível é cada série desenhar a sua parte assim que chega, sem bloco cinza de página inteira — `loading-*` (esqueletos por série) e `series-states-*` (séries prontas ao lado de séries carregando). Tempo: não visto aqui (a prova da F45 mediu em produção).
- **F46 (estado claro por série):** carregando (esqueleto), carregada, com aviso «1 album did not load. Try again» e tudo falhou «5 albums did not load. Try again» estão na tela, nas duas larguras (`series-states-*`). A série «sem álbuns» não tem estado: ela não é desenhada (`hidden`). Ver P2-2. «Sair e voltar» e «My Ranking em todas as séries» são comportamento: não vistos.
- **F47 (sem corte em 20):** com 50 séries a tela diz «Showing 1–10 of 50 series» e pagina por 5 páginas (`grid-all-*`). O corte real vinha do serviço que lê as séries, que o harness não usa: o visível (a tela aceita mais de 20) bate; a leitura sem corte não foi vista aqui.
- **F48 (cache e «Clear Cache»):** o botão está no rodapé do computador (`footer-1280.png`) e no menu do celular como «Clear album cache» (`footer-393.png`); não cliquei. O resto é comportamento.
- **F49 («Load N more albums»):** a série de 15 álbuns mostra 12 e «Load 3 more albums»; um clique de verdade mostra os 15 e o botão some (`load-more-*`, `load-more-open-*`).
- **F51 (filtros, busca, páginas):** a barra de filtros (série, artista, ano, fonte, ordem), o paginador e a contagem filtrada «Showing 1–10 of 12 series (of 50 in all) · 10 albums» (`filtered-*`). Digitando «discipline» tecla por tecla, o campo manteve o foco e o texto inteiro depois de cada tecla, nas duas larguras (`measures.json`, `_extra.typing-discipline-*`), com o redesenho a cada tecla — no substituto do controlador, que redesenha como o real (sem atraso).
- **F52 (o servidor diz a verdade; a nota «falhou» com «tentar de novo»):** **não visto** — esse estado não existe na tela. O resultado da nota é guardado no álbum (`metadata.ratingsOutcome`, `api/client.js:246`) e nenhuma tela o lê (`ratingsOutcomeOf` não tem quem chame). Ver P1-1. (A F52 ainda tem tarefas abertas.)
- **F55 (o álbum pedido, ou um aviso):** a nota «aceito com subtítulo» está no cartão, no computador e no celular (`album-notices-*`): «Asked for by its short title: the catalog only has this one, with a subtitle.» O aviso de «álbum pedido não encontrado» aparece só como contagem genérica («1 album did not load. Try again»); o motivo não é dito. Ver P2-1.
- **F68 (regras de identidade revistas):** as três razões com nome aparecem no cartão (subtítulo, mais em parênteses, outra grafia — `album-notices-*`). O resto é regra, sem tela.
- **F69 (a falha da popularidade do Spotify é falha):** **não visto** — o aviso «falhou» / «sem dado» com «tentar de novo» existe só no componente de faixas quando recebe `popularity`, e a janela do álbum o cria sem isso (`ViewAlbumModal.js:178`); `SeriesController.getPopularityStatus/askPopularity` não têm quem chame na tela. Ver P1-2.
- **F72 (quantos álbuns e séries):** todas as séries: «Showing 1–10 of 50 series · 67 albums» (celular «1–10 of 50 series · 67 albums»); filtrado: «… of 12 series (of 50 in all) · 10 albums». Numa série só, nada diz quantos álbuns ela tem: o paginador some e o título é só o nome (`single-*`). Ver P2-3.
- **F74 (a nota da faixa na faixa certa):** na janela do álbum de «In the Court of the Crimson King (Expanded Edition)», as cinco faixas originais têm a nota e a posição do BestEverAlbums e as três extras mostram «BEA —» (`ranking-window-*`); cada faixa tem a duração m:ss.

## Design system — o que bateu
Preto, painel, Syne nos títulos, sistema no corpo do celular, laranja na página atual e no modo escolhido, botão de fogo «Blend your Albums» um por tela, cartão do celular como o design system descreve (capa, título em duas linhas, artista em `#a0a0a8`, «⋯» de 44 px). Nada passa da borda direita em nenhuma captura; no celular, nenhum texto abaixo de 12 px nem campo abaixo de 16 px; alvos abaixo de 44 px só o logotipo e o «Connect» (UAT-242) e a ficha «Series» de 158 x 36 numa série só.

## Achados
- **P1-1 · F52 · a nota que falhou não tem estado na tela.** O requisito diz: com a fonte fora do ar, a nota do álbum fica em «falhou», com «tentar de novo». Hoje o desfecho é guardado e não é mostrado; para quem usa, a falha volta a ser silenciosa. Âncora: `public/js/api/client.js:246`, `public/js/models/ratingsOutcome.js` sem leitor. Issue: UAT-244.
- **P1-2 · F69 · a popularidade que falhou não tem estado na tela.** O requisito diz: com o acesso vencido, o álbum mostra «falhou» e «tentar de novo». O aviso existe no componente mas não é ligado. Âncora: `public/js/components/ViewAlbumModal.js:178`, `TracksRankingComparison.renderPopularityNotice`. Issue: UAT-245.
- **P2-1 · F55 · o motivo «não encontrado» virou contagem.** «1 album did not load. Try again» serve para falha e para não encontrado; a pessoa não sabe que o álbum pedido não existe no catálogo. Âncora: `SeriesGridRenderer._renderFailureNotice`, `album-notices-1280.png`. Issue: UAT-246.
- **P2-2 · F46 · série sem álbuns não aparece.** A F46 nomeia «sem álbuns» como um dos estados; hoje a série some da lista. Âncora: `series-states-*` (`emptySeriesS4InDom: false`). Issue: UAT-247.
- **P2-3 · F72 · numa série só, a contagem não aparece.** O requisito: «numa série só, mostra os álbuns dela». Âncora: `single-1280.png`, `single-393.png`. A F76 (celular) e a paginação da F51 mudaram o lugar da contagem. Issue: UAT-248.
- **P2-4 · acabamento do cartão no computador:** a lupa fica sobre o «S» de «Search…» (`grid-all-1280.png`); o selo «MY RANKING» quebra em duas linhas e passa da borda do cartão (`load-more-1280.png`, «Animals»); o ano do cartão em 10 px, abaixo do piso de 12 px do design system (67 ocorrências em `grid-all-1280`). Issue: UAT-249.
- **P2-5 · a janela de ranking no computador fora da paleta:** título «Rank Your Album», números e «Save» em azul; o design system põe a ação em laranja e não tem azul (no celular a mesma janela usa laranja). Âncora: `ranking-window-rank-1280.png`. Issue: UAT-250.

## Não visto
- Tempos de carga (F45), sair e voltar no meio da carga e «My Ranking» sobre todas as séries (F46), a leitura das séries sem corte no serviço (F47), o que «Clear Cache» apaga (F48): comportamento, fora do alcance sem conta.
- A duração na janela de ranking (`ranking-window-rank-*` mostra «--:--»): o fixture só dá duração às faixas na ordem do disco, e a janela de ranking lê a lista por aclamação; com dados reais não vi. A janela do álbum mostra as durações (F54).
- Os estados de F52 e F69 (P1-1, P1-2): não existem na tela.
