---
type: ux-audit
subject: "Reconferência visual independente da onda 5a da F83 (a tela de álbuns em React, ramo claude/f83-wave-5a-albums-screen) contra a tela antiga — 1280 e 393, Chromium e WebKit com perfil de iPhone no site construído"
project: mjrpalbumblender-v0
features: [F83]
moment: delivery
date: "2026-11-21 23:00"
judged: "2026-11-21 23:00"
judged_commit: 499399c
who_judged: separate-agent
verdict: pass
p0: 0
p1: 0
p2: 3
duration_s: 7200
status: open
---

# Reconferência visual — a tela de álbuns em React (F83, onda 5a, TASK-32)

**Veredito: passa (`pass`); 0 P0, 0 P1, 3 P2 — os três são defeitos da tela de hoje, mantidos de propósito, que valem linhas de issue; nenhum é diferença nova.** Em 1280 e 393, em grade e em lista, o HTML de `#app` e do que abre por cima da página é igual ao da antiga em **todos** os passos que os dois lados executaram (0 diferenças de página, de endereço, de rolagem e de chamadas ao que está fora), e as janelas que ficam à mão abrem, mostram o mesmo e alcançam as mesmas chamadas. A folha de filtros, consertada pelo construtor, está certa no site construído no WebKit com perfil de iPhone. A única diferença de comportamento que vi é de foco e só no servidor de desenvolvimento: no celular, na primeira abertura da janela do álbum pela folha «⋯», o foco não volta ao «⋯» (no site construído, em Chromium e WebKit, e mesmo com o arquivo da janela atrasado 900 ms, é igual; ver «Não é achado»). Os 11–20 px da barra de filtros são ruído: o **mesmo conjunto de pixels** aparece de antiga contra antiga.

## Como foi feito
- **Quem julgou:** agente juiz separado (Opus); não construiu a onda.
- **Objeto:** nova = worktree `agent-ae7a55a04e5ae0f39`, `499399c` (limpo). Antiga = `/private/tmp/claude-501/old5a`, conferido: está em `8e685cd`, que é `f08c279` (o pai da onda) mais só testes, fixture, um roteiro de captura e dois documentos — nada em `public/`. Servidores próprios: dev antiga 5191, dev nova 5192; **build** próprio de cada um (`npx vite build --outDir` pela fila) servido por `vite preview` em 5193 (antiga) e 5194 (nova). Os quatro parados ao fim.
- **Firebase Auth e Firestore bloqueados** em todo contexto (`identitytoolkit`, `securetoken`, `firestore.googleapis`, `firebaseinstallations` abortados antes de a página abrir). Nenhum login; nada escrito: `albumLoadService` com cada método gravado e as cargas silenciadas; no dev, `SeriesService.prototype` (`removeAlbumFromSeries`, `updateSeries`, `deleteSeries`, `countSavedPlaylists`) trocado por um substituto que só anota a chamada, e um `db` de mentira posto em `albumSeriesStore.setDb` para que a janela de editar chegue ao «salvar». Capas servidas localmente.
- **Roteiros próprios** (não os do construtor), ao lado deste relatório: `judge.mjs` (por passo: `#app` e tudo o que a página põe no `body` normalizados, foco, endereço, rolagem, chamadas, captura pixel a pixel; o relógio do rodapé e a barra do topo escondidos nas capturas — a barra do topo é ruído já conhecido e não é desta onda), `pixel.mjs` (perícia da barra de filtros), `speed.mjs` (velocidade no build), `probe-sheet.mjs`, `probe-toast.mjs`, `crop.mjs`, `fullpage.mjs`. Saídas em `work/` (`run-*.log`, `judge-results-*.json`, `speed-built.json`, `pixel*/report.txt`).
- **O mundo posto nas lojas** (o que a resposta do Apple Music teria feito): 7 séries — uma com 4 álbuns achados, uma com a nota e a popularidade **falhadas** (`enrichment.acclaim/popularity = failed`), uma de 14 (para «Load N more»), uma toda falhada, uma com o último falhado, **uma sem álbuns** e uma **ainda procurando** (`finding`); marcas «My Ranking» (`hasUserRanking`), BestEverAlbums, Spotify alternados. Mais dois mundos: **vazio** (nenhuma série) e **muitas** (23 séries, 3 páginas de 10).
- **Rodadas:** dev Chromium 1280 + 393 (425 conferências), janelas e paginador (119 + 58), build Chromium 393 (janelas), **build WebKit iPhone 14 Pro** 393 (94), e os controles **antiga contra antiga** no dev 1280 (218) e no WebKit build (10).

## O que foi conferido (igual, salvo onde dito)
- **Estados a 1280, grade e lista:** vazio («No albums in library» com «Go to Start»; Tab a partir do topo); primeira página com esqueleto da série que procura, série vazia, série toda falhada com «1 album did not load / Try again» (na grade), série meio falhada, contagem «Showing 1–7 of 7 series · 28 albums»; busca com teclas reais, busca sem resultado («No albums match your filters»), busca + artista, busca + ano + fonte; cada ano (1970s, 2000s+, All); cada fonte (My Ranking, Pending, BestEverAlbums, Popularity, AI Enriched, All); as seis ordens nas duas direções (`count_asc/desc`, `alpha/alpha_desc`, `recent_asc/desc`); série escolhida no filtro (endereço `/albums/s1` igual), Refresh com série escolhida, volta a todas; «Try again» (a mesma chamada à carga); «Load 13… more»; tamanho da página; a tabela de faixas ordenada por coluna (lista). **0 diferenças de página, endereço, rolagem e chamadas.**
- **Muitas séries:** paginador em cima e embaixo, página seguinte pelos dois, ordem e filtro de artista encolhendo as páginas: iguais a 1280 e 393.
- **Celular 393:** grade e lista; busca; «Try again» (grade); «Load more»; a folha de filtros (abrir, escolher artista, «Show albums», o chip, **reabrir mostra a escolha**, ano + ordem, reabrir mostra ambos, fechar pelo X, tirar o chip, reabrir) — igual no dev e **no build com WebKit/iPhone** (`captures/webkit-iphone-built-sheet-reopened-keeps-choices.*.jpg`: «Name (Z-A)», «Pink Floyd», «1970s», «Filters · 2 on» nos dois). A barra de baixo não cobre as últimas linhas: topo da barra em 795 px, o conteúdo mais baixo termina em 724 px, nos dois e nos dois mundos.
- **Virar o celular com a folha aberta** (393 → 1280): foco, quadro a quadro, antiga `25 ms botão da folha → 226 ms página`, nova `47 ms botão da folha → 245 ms página`. A diferença declarada de «250 ms» é **a mesma sequência com cerca de 20 ms de atraso** — ninguém a percebe; depois do giro e na volta a 393, página, foco e pixels iguais (0 px).
- **Janelas atrás de invólucros (dev, 1280):** janela do álbum com a nota falhada — «BestEverAlbums did not answer.» + «Try again» igual nas duas (`captures/1280-album-window-ratings-failed-notice.*.jpg`); janela de álbum normal; fechar por Escape e pelo botão; «Add to Inventory» (abre, Cancel); classificar (abre, Back); editar série (abre; nome mudado; «Save Changes» chama `series.update(s0, name|albumQueries)` e depois a carga, igual); apagar série (`series.count(s4)` → pergunta com as playlists guardadas → `series.delete(s4)`, igual); remover álbum (`series.remove(s0, s0-1)`, igual) e o caminho da segunda pergunta («query não achada» → `prompt`) igual, cancelado igual. Foco depois de cada uma: igual. **No celular:** folha do álbum, janela do álbum pela folha, folha da série, editar pela folha — iguais (com a nota (a), só no dev).
- **Pixels:** das 41 capturas com diferença no dev, todas com no máximo 4/255 (ruído de rasterização), salvo o anel de foco da nota (a) abaixo (255/255, só no dev); o controle antiga-contra-antiga mostra o mesmo padrão (19 capturas com até 2/255, inclusive 55.988 px de 2/255 na ordem `count_asc`). No WebKit, a página rolada até o fim difere em 941 mil px de até 9/255 **também de antiga contra antiga** (941.156 px, 8/255).

## As diferenças que o construtor declara
| Diferença | Juízo |
|---|---|
| A lista de séries diz «All Series» desde o primeiro desenho (a antiga escrevia «All Albums Series» na fábrica e trocava para «All Series» no primeiro aviso) | **Melhor** (some um rótulo errado por um instante); invisível nas capturas depois do primeiro aviso. |
| O observador dos grupos fora da tela saiu | **Igual** para quem usa: com a lista sempre em páginas nenhum grupo usa o esqueleto de «fora da tela»; em todos os passos o HTML é igual. |
| Foco por 250 ms ao virar com a folha aberta | **Igual** na prática (ver acima: mesma sequência, ~20 ms). |
| «All Years» e «All Sources» duas vezes nas listas | **Igual** (mantido). É defeito de hoje: a lista abre com a entrada «All…» repetida. Uma diferença interna: a antiga marca a 2ª «All Sources» como escolhida, a nova a 1ª (`selectedIndex` 1 contra 0); o texto mostrado é o mesmo. Vale linha de issue (P2-1). |
| «Refresh» recarrega o escopo do endereço de abertura, não a série escolhida | **Igual** (provado: série escolhida, Refresh → o mesmo `load` nas duas). Defeito real de hoje: quem escolhe uma série e aperta Refresh recarrega o escopo errado. Vale linha de issue (P2-1). |
| «Go to Start» recarrega a página inteira | **Igual**. Defeito pequeno de hoje (a página inteira volta a baixar, o estado em memória se perde); vale uma linha junto da P2-2 (P2-3). |
| Todo filtro conta como «ligado» para o aviso «No albums match» | **Igual**; não vi efeito visível nos estados testados (o aviso só aparece quando a lista está vazia). Sem issue. |

## A alegação dos pixels (os 11–20 px de 1 nível na barra de filtros)
**Ruído, provado.** Na minha rodada a sobra é de 39 px a 1280 (lista, depois de um filtro), caixa x 827–1215, y 146–195, no máximo 1/255. Os pixels estão nos **quatro cantos arredondados** dessa caixa (838,146 · 1204,146 · 827,157 · 1215,158 · 827,184 · 1214,184 · 838,195 · 1203,195 …). O controle **antiga contra antiga** do mesmo passo dá **exatamente os mesmos 39 pixels, coordenada por coordenada** (`captures/pixel-bar-old-vs-new-1280-list-year.png` e `pixel-bar-OLD-vs-OLD-1280-list-year.png`). Numa página aberta de novo, sem a história de cliques, a barra dá 0 px antes e depois de escolher um ano, depois de forçar um novo desenho (redimensionar 1 px e voltar; `transform` ligado e desligado; rolar e voltar): 0 px em todos (`work/pixel/report.txt`). Recortando cada um dos elementos da barra: nenhum difere. Conclusão: anti-serrilhado dos cantos que depende da história de pintura da camada, não do código da tela. (O construtor não viu isso de antiga contra antiga; eu vi.)

## Velocidade (300 capas, sites construídos, Chromium, antiga e nova intercaladas)
Medido por `speed.mjs` no **build** (`vite preview` dos meus dois builds), 25 séries de 12 álbuns (300 capas na página, conferido antes da rolagem), grade, quatro rodadas por largura com a ordem alternada (antiga-nova, nova-antiga…), pela fila da máquina (que no dia atendia também outras sessões). Medianas, em ms: o redesenho depois de um aviso da loja (até o layout pronto); um filtro de artista (do evento até o quadro depois de a grade mudar); uma busca (idem); a rolagem da página inteira em 2,5 s, um passo por quadro (intervalo entre quadros).

| | redesenho | filtro | busca | rolagem p50 / p95 | quadros > 33 ms |
|---|---|---|---|---|---|
| 1280 antiga | 48,3 | 26,4 | 28,2 | 16,7 / 18,2 | 0 |
| 1280 nova | **42,1** | **17,9** | **19,1** | 16,7 / 18,3 | 0 |
| 393 antiga | 22,3 | 13,4 | 11,2 | 16,7 / 18,25 | 0 |
| 393 nova | **18,9** | **8,8** | **9,4** | 16,7 / 18,25 | 0 |

**Nada fica mais lento no site construído;** a nova é igual ou mais rápida em tudo, e a rolagem é a mesma (60 quadros por segundo, nenhum quadro perdido, nas duas). Os +8 % que o construtor mediu na grade a 393 (24,7 contra 22,9 ms) **não se repetem** aqui (18,9 contra 22,3): é variação do dia, dentro do teto de 1,2 vez de qualquer forma. (Uma primeira rodada minha deu números inválidos para a nova — a lista de artista é trocada a cada desenho e o roteiro segurava a lista velha; corrigido, a rodada inválida fica em `work/speed-run1-invalid-filter.log`.) Não medido: rolagem na lista e no WebKit.

## Achados
- **P2-1 — (defeito de hoje, mantido) «All Years» e «All Sources» aparecem duas vezes nas listas.** Anchor: `public/js/screens/albums/Albums.tsx` (`toolbarOf`: as listas de ano e fonte começam com `{ value: 'all', … }` além do rótulo da peça), igual a `views/helpers/SeriesComponentFactory.js` e `SeriesViewUpdater.js` da antiga. Mudança: tirar a entrada `all` das opções (o rótulo da peça já é a entrada «All…»). Abrir linha de issue; não bloqueia a onda (é «igual»).
- **P2-2 — (defeito de hoje, mantido) «Refresh» recarrega o escopo do endereço de abertura, não a série escolhida no filtro.** Anchor: `Albums.tsx`, `onRefresh: … controller.loadScope(route.scope, route.seriesId, true)`; antiga `SeriesComponentFactory.js:140`. Evidência: série Zeppelin escolhida, Refresh → `load` do escopo de todas as séries nas duas. Mudança (depois da onda, com decisão do MJRP): recarregar `controller.getState().currentScope/targetSeriesId`. Abrir linha de issue.
- **P2-3 — (defeito de hoje, mantido) «Go to Start» do estado vazio recarrega a página inteira.** Anchor: `Albums.tsx`, `EmptyState` (`window.location.href = '/start'`); antiga `SeriesEmptyState.js:28`. Mudança: `navigate('/start')`. Pode ir na mesma linha de issue da P2-2.

**Não é achado, registrado:** (a) **no servidor de desenvolvimento**, a 393, na **primeira** abertura da janela do álbum pela folha «⋯», o foco fica na página na nova e volta ao «⋯» na antiga (e ao fechar, o anel de foco aparece só na antiga: 617 px, `captures/dev-only-393-focus-ring-after-album-window-first-open-old-new-diff.png`); da 2ª à 4ª abertura, iguais. A causa provável: a nova pede a janela por `import()` (`react-bridge/legacy/AlbumWindows.ts`), a antiga a importava direto (`SeriesEventHandler.js`), e o servidor de desenvolvimento demora a transformar o arquivo na primeira vez. **No site construído não acontece**: iguais nas quatro aberturas em Chromium e em WebKit/iPhone, e iguais também com os arquivos `ViewAlbumModal/UserRankModal/InventoryAddModal-*.js` atrasados 900 ms por rota (`work/run-win2-built-delay.log`, 40 de 40). Se o construtor quiser fechar a porta: guardar o elemento com foco antes do `import()` e devolvê-lo ao fechar. (b) Escolher um valor numa lista da folha **sem tocá-la antes** (só possível por roteiro) deixa o foco na página na antiga e no botão «Grid» da folha na nova; com o toque/foco real na lista, as duas ficam na lista (`probe-sheet.mjs`, dev e build WebKit). (c) Na lista do celular, a série toda falhada não mostra «Try again» — nas duas (igual).

## O que o catálogo real ainda precisa provar (Apple Music)
Esta tela não chama o catálogo: ela desenha o que a carga põe em `albumLoadStore` (achado, procurando, falhado com razão; nota e popularidade `done/empty/failed/not-connected`). Tudo isso foi provado aqui com entradas postas na loja. **Não foi visto, e uma chamada real ao Apple Music ainda precisa provar:** (1) que o token do desenvolvedor vem do servidor e o MusicKit responde à busca «Artista - Título» de uma série real; (2) que a resposta do catálogo vira as entradas `found` com capa, ano e faixas que esta tela mostra (e as que não acha viram `failed` com a razão certa, com «Try again» que pede de novo); (3) que a sequência real procurando → achado, em séries chegando uma a uma, redesenha igual (aqui as entradas foram postas de uma vez); (4) a popularidade real do Spotify, que só chega com conta conectada (o aviso de popularidade falhada na janela do álbum não apareceu neste mundo, porque o álbum não estava ligado ao Spotify; o HTML foi igual nas duas); (5) o salvar de uma classificação (`ownRankingService.save`), que escreve na conta — não apertei «Save» na janela de classificar.

## Não visto
- O catálogo real e a conta (acima). Português lido por um olho (só o inglês foi visto).
- O passo «Load more» e a tabela de faixas no WebKit (só no Chromium). O caminho «Try again» na lista do celular (não existe nas duas).
- Arrastar na janela de classificar (é a peça à mão, não desta onda).
