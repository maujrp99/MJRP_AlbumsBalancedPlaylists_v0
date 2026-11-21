---
status: Done
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-06"]
planned_for: "[[ROADMAP#^REL-40]]"
---
<!-- docs/specs/features/Fxx-slug/spec.md — the folder is the feature (Fxx, two digits).
     status: In progress while the cycle runs; Done when every task is closed and every REQ has verified_by.
     imports: the requirement nodes this feature delivers (1..n), each Ready, each in no other open feature.
     A transversal NFR node constrains every feature (review it with constitution.md), so a product feature does not import
     it. The exception is an engineering feature (a refactor planned by an ADR, infrastructure): `solution_type: fix`, `fixes: [UAT-xx]` of the
     debt issues (required: the card takes its release from them), and `imports:` only the NFR it serves, named by a
     `violates:: [[NFR-xx-<slug>]]` in the Problem Statement — no story invented for it. A debt against a constitution
     article imports nothing and says `violates:: [[constitution#N]]` of an article that exists. -->
# Feature F49: O botão de carregar mais álbuns de uma série funciona
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** O botão «Load N more albums», que aparece numa série com mais de 12 álbuns no painel de todas as séries, passa a mostrar os álbuns que faltam, ali mesmo. A série fica aberta enquanto a pessoa estiver no painel de todas as séries.

**Por quê:** O clique não fazia nada: os demais álbuns só apareciam abrindo a série sozinha.

**Como saber que funcionou:** Numa série com mais de 12 álbuns, clicar no botão mostra todos os álbuns da série e o botão some; trocar de página e voltar encontra a série ainda aberta.

## Problem Statement
No painel de todas as séries, cada série mostra no máximo 12 álbuns e um botão para ver o resto. O botão existe, mas clicar nele não faz nada.

O que o código fazia, lido antes do conserto (linhas da `main` em `4dc353a`):

- **Quem desenha o botão.** `components/series/SeriesGridRenderer.js:198-214` (`_renderRealSeriesGroup`) cortava a série em 12 (`INITIAL_LIMIT`) e chamava `components/ui/LoadMoreButton.js:12-25`, que escreve um `<button data-action="load-more-series" data-series-id="…">`. O corte só existe na grade compacta do painel de todas as séries: a lista expandida (`SeriesGridRenderer.js:72-79`, `views/albums/AlbumsScopedRenderer.js:194-228`) e a série aberta sozinha (`SeriesGridRenderer.js:81-89`) desenham tudo.
- **O clique chega e é jogado fora.** A tela tem um ouvinte só, na raiz `#app`: `components/series/SeriesEventHandler.js:48` (ligado em `mount`; o tratador é `handleClick`, `:62`). Ele acha o `[data-action]`, vê o `data-series-id` e chama `handleSeriesAction` (`:83-86`), cujo `switch` (`:153-163`) só conhece `retry-series`, `edit-series` e `delete-series`: `load-more-series` cai fora sem fazer nada. O ouvinte próprio do botão existia no `SeriesGridRenderer.js:227-238` (`_attachEventListeners`), mas ninguém o chamava: `render` só chama `_attachObservers` (`:101`).
- **Mesmo ligado, o ouvinte antigo não serviria.** `_handleLoadMore` (`:240-274`) colava os cartões direto no DOM e apagava o botão. A grade é redesenhada inteira a cada mudança da store de carga (`SeriesController.renderFromStore`, `controllers/SeriesController.js:320-329` → `SeriesGridRenderer.render`, `:97`), então a série voltaria a 12 álbuns no redesenho seguinte.
- **Os álbuns depois do décimo segundo já estão carregados.** O controlador pede ao serviço de carga todas as consultas de cada série da página (`controllers/SeriesController.js:176`) e entrega à tela todos os álbuns achados (`:466-470`). O corte em 12 é só de desenho; nada precisa ser carregado no clique.
- **A paginação da F51 não interage com o corte.** Ela corta séries, não álbuns (`SeriesController.getPageView`, `:187-220`); cada série da página chega inteira à grade.
- **Não há cartão por álbum para «carregando» ou «falhou».** A grade só recebe álbuns achados (`SeriesController.js:469`); o álbum que falhou vira a linha «N albums did not load · Try again» da série (`SeriesGridRenderer.js:178-187`), e o que ainda carrega simplesmente não está lá. O número do botão é, por isso, o de álbuns achados e ainda não desenhados, e cresce enquanto a carga corre.

## Requirements
<!-- Local IDs, two digits. Each REQ traces to an imported node; none is invented here.
     Functional and non-functional (performance, security, accessibility) alike are REQ-xx. -->
- [REQ-01] No painel de todas as séries, clicar em «Load N more albums» mostra, na própria série, os álbuns que passam do décimo segundo, na ordem da série, e o botão some; as outras séries não mudam e nada é carregado de novo. · fixes UAT-06
  verified_by:: `test/views/SeriesView.loadMore.test.js`, `test/components/series/SeriesGridRenderer.loadMore.test.js`
- [REQ-02] A série aberta continua aberta quando a tela é desenhada de novo pela carga e quando a pessoa troca de página, de filtro, de busca ou de grade para lista e volta; é esquecida quando o escopo muda (abrir uma série sozinha, voltar ao painel) e quando a pessoa sai da tela. · fixes UAT-06
  verified_by:: `test/views/SeriesView.loadMore.test.js`, `test/models/seriesExpansion.test.js`
- [REQ-03] O botão diz quantos álbuns da série estão achados e não desenhados («Load 3 more albums», «Load 1 more album»), e só aparece quando há algum; o cabeçalho da série conta todos. · fixes UAT-06
  verified_by:: `test/components/series/SeriesGridRenderer.loadMore.test.js`, `test/models/seriesExpansion.test.js`
- [REQ-04] O botão é um botão de verdade (`<button type="button">`), alcançável pelo teclado; depois do clique, o foco vai para o primeiro álbum que apareceu. · fixes UAT-06
  verified_by:: `test/components/series/SeriesGridRenderer.loadMore.test.js`, `test/views/SeriesView.loadMore.test.js`
- [REQ-05] A lista expandida e a série aberta sozinha continuam sem corte e sem botão. · fixes UAT-06
  verified_by:: `test/components/series/SeriesGridRenderer.loadMore.test.js`, `test/views/SeriesView.loadMore.test.js`

## Observable States
<!-- What the imported nodes point_to: the screen state in info-arch.md (the prototype the human judged —
     PRINCIPLES.md §I.13) or the behavior state in behavior.md. N/A only if the nodes point to none. -->
N/A: a feature não importa nenhum requisito (conserto de issue). Estado novo no `docs/specs/behavior.md`, para o que o código faz agora: `^library-series-more-albums`.

## Prototype Parity (if the feature touches a screen)
<!-- What the approved visual reference holds across every screen and no node carries: the design system's tokens and fonts,
     the shared components, the shell (brand, menu order, context bar, the behaviour every card has), the
     responsiveness (widths, tables, drawers). The product's FIRST screen feature ports the design system's CSS, fonts
     and components. A cut or swap of anything of the design system points to its recorded decision. -->
- Prototype: none. Nenhuma tela foi redesenhada: o botão é o que já existia, com as mesmas classes; muda o texto no singular («Load 1 more album») e o que acontece no clique.
- Transversal layer touched: none. `components/ui/LoadMoreButton.js` só é usado pela grade da tela de álbuns.
- Design-system cuts or swaps: none. O projeto não tem `design-system.md`.

**Prototype**: none — MJRP, 2026-11-20 00:10: «eu dispenso prototipo por que estávamos arrumando e consertando problemas passados com pequenas melhorias e nao trabalhando em grande features nova, portanto por ora os prototipos estao dispensados.»

## Success Criteria
<!-- One measurable item per acceptance criterion of the imported nodes. -->
- Numa série com 15 álbuns achados, o painel de todas as séries desenha 12 cartões e «Load 3 more albums»; depois do clique, 15 cartões na ordem da série e nenhum botão naquela série.
- O clique não faz nenhum pedido novo ao serviço de carga (contado no teste).
- Depois de uma mudança na store de carga, de ir à página 2 e voltar, e de buscar e limpar a busca, a série continua com os 15 cartões.
- Depois de abrir uma série sozinha e voltar ao painel, ou de sair da tela e voltar, a série está de novo com 12 cartões e o botão.
- Suíte: 1330 testes passando (1307 antes da feature); `vite build` compila.

## Out of Scope
- Mudar o limite de 12, ou guardar a escolha no navegador entre visitas: a escolha vale só para a visita.
- Um botão para fechar a série de novo («mostrar menos»): a issue pede que o botão suma.
- Cartões por álbum para «carregando» e «falhou»: a tela não os tem hoje; a falha continua na linha «N albums did not load · Try again» da série.
- Manter o foco do teclado através dos redesenhos da carga: a grade é redesenhada inteira a cada mudança da store, e o foco se perde nesses redesenhos como já se perdia para qualquer botão da grade.
- `SeriesView.updateAlbums` (complexidade 19) e `SeriesEventHandler.handleRemoveAlbum` (21) seguem acima do limite de 10, de antes: são da F58. A feature não acrescentou caminho a nenhuma das duas.
- `SeriesController.js` e `AlbumLoadService.js`: não tocados.

## Open Questions
<!-- ALL resolved before Plan. -->
- **Onde mora a escolha — decidido pelo agente, revisável (2026-11-19).** Num objeto só, `SeriesExpansion` (`public/js/models/seriesExpansion.js`), que a tela (`SeriesView`) cria a cada visita. O controlador, que vive a sessão inteira e está sendo mexido pela F56, não foi tocado.
- **O texto do botão — a julgar pelo MJRP.** Ficou «Load N more albums», como a issue cita, e ganhou o singular «Load 1 more album». O clique não carrega nada (os álbuns já estão carregados); «Show N more albums» diria melhor o que acontece.
- **O foco depois do clique — a julgar no navegador.** O primeiro álbum que apareceu recebe o foco (`tabindex="-1"`); com o teclado, o navegador deve mostrar o contorno de foco nesse cartão. Não visto num navegador por quem implementou.
