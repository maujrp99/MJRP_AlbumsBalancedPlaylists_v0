---
status: Accepted
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-204"]
planned_for: "[[ROADMAP#^REL-40]]"
accepted_in: "log 2026-11-24 10:30"
---
<!-- docs/specs/features/Fxx-slug/spec.md — the folder is the feature (Fxx, two digits).
     status: In progress while the cycle runs; Done when every task is closed and every REQ has verified_by.
     imports: the requirement nodes this feature delivers (1..n), each Ready, each in no other open feature.
     A transversal NFR node constrains every feature (review it with constitution.md), so a product feature does not import
     it. The exception is an engineering feature (a refactor planned by an ADR, infrastructure): `solution_type: fix`, `fixes: [UAT-xx]` of the
     debt issues (required: the card takes its release from them), and `imports:` only the NFR it serves, named by a
     `violates:: [[NFR-xx-<slug>]]` in the Problem Statement — no story invented for it. A debt against a constitution
     article imports nothing and says `violates:: [[constitution#N]]` of an article that exists. -->
# Feature F67: O Scan da Home responde ao clique
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** Clicar em Scan na Home tem sempre uma resposta visível, de um dono só: buscando (botão ocupado), resultados, sem resultados ou falhou com «tentar de novo». A consulta ao catálogo tem prazo, e os álbuns aparecem assim que o catálogo responde; a lista da IA chega depois.

**Por quê:** Em produção, o clique em Scan pareceu não fazer nada, e o registro do servidor mostra que ele nem chegou ao servidor. Hoje a busca não tem prazo, avisa por `alert` e espera a IA antes de mostrar qualquer álbum.

**Como saber que funcionou:** Com o catálogo travado, a tela mostra «falhou» com «tentar de novo» dentro do prazo; com o catálogo respondendo, os álbuns aparecem antes de a IA responder.

## Problem Statement
O MJRP, em 2026-11-19: «bug em prod, cliquei no botao e scan e parece que nao faz nada»; depois, «agora foi, estranho». Decisão do MJRP de 2026-11-19: o conserto passa na frente assim que a F55 entrar («1. Sim pode»).

O que o código fazia, lido antes do conserto (linhas da `main` em `a5fdf5a`):

- **O catálogo não passa pelo nosso servidor.** A busca de artista vai do navegador direto à Apple pelo MusicKit (`services/musickit/MusicKitCatalog.js:125-198`). O servidor só vê `GET /api/musickit-token`, uma vez por carga de página (`MusicKitAuth.js:73`), e `POST /api/ai/studio-albums`, só quando algum álbum tem gênero eletrônico e só depois de o catálogo responder. Por isso «nenhum pedido no registro do servidor» não diz que o clique não rodou: é o que se vê também quando o catálogo trava ou falha numa página que já tinha o MusicKit iniciado.
- **Sem prazo em nenhum passo da busca.** A consulta ao catálogo (`MusicKitCatalog.js:131,155`), o pedido do token e o `MusicKit.configure` (`MusicKitAuth.js:73,88`) e a leitura do login antes do pedido da IA (`api/serverFetch.js:24`) podiam esperar para sempre, com a tela em «Scanning...».
- **O script do MusicKit podia esperar um evento que já passou.** `MusicKitAuth.js:128-130` só começava a ouvir `musickitloaded` dentro do `onload`; o relógio de 10 segundos só rejeitava se `window.MusicKit` não existisse (`:136-140`). Com o evento disparado antes do `onload`, a espera não acabava nunca, e toda busca seguinte esperava a mesma promessa até recarregar a página.
- **A tela esperava a IA para mostrar qualquer álbum.** `AlbumSearchService._processDiscography` (`:157-193`) classificava álbum por álbum e parava no primeiro que pedisse a lista da IA.
- **Falha e «nenhum álbum» saíam por `alert`** (`components/home/SearchController.js:72,77`), que o navegador pode suprimir; a linha de status ficava em «Scanning...» depois de uma falha, porque `HomeView.setLoading(false)` não a limpava (`views/HomeView.js:250-271`).
- **O estado da busca estava espalhado:** o botão e o status em `HomeView.setLoading`, o status de novo e as quantidades em `SearchController.searchArtist`, a grade no `DiscographyRenderer`, mais `home.state.isScanning`, que ninguém lia. Um segundo clique com a busca correndo começava outra busca, e a resposta que chegasse por último ganhava a tela.
- **O clique lia um campo guardado na montagem** (`SearchController.js:18,26`): se a Home fosse desenhada de novo sem nova montagem, o clique lia o campo antigo, vazio, e saía sem nada (`:31`). Campo vazio também saía sem nada.
- **Defeito do roteador, reproduzido em teste.** `router.js` `renderView` guardava a tela em `this.currentView` e a usava depois de cada espera. Uma rota cuja fábrica navega e devolve `null` (`/callback` da volta do Spotify, `/album-series`, `/series`: `app.js:133-169`) corre junto com a navegação que ela mesma abriu e, ao terminar, punha `currentView = null`; a tela de destino era desenhada e **nunca montada** (`router.js:165,185`): nenhum botão respondia até recarregar a página. É o único caminho achado em que o clique em Scan não roda de fato.

**Qual explica o caso do MJRP:** não dá para determinar pelo código. O defeito do roteador explica «botão com o rótulo normal, nada acontece, nenhum pedido ao servidor, depois funcionou» só se ele chegou à Home pela volta do Spotify (`/callback`) e recarregou a página antes de tentar de novo. Se a página já estava aberta com o MusicKit iniciado, o mais provável é o catálogo da Apple lento ou falhando, sem prazo e com resposta fraca na tela. A issue registra «um círculo pequeno gira», o que aponta para esta segunda leitura. Os dois foram consertados.

## Requirements
<!-- Local IDs, two digits. Each REQ traces to an imported node; none is invented here.
     Functional and non-functional (performance, security, accessibility) alike are REQ-xx. -->
- [REQ-01] A busca da Home está sempre em um só estado (parada, buscando, resultados, sem resultados, falhou), guardado por um dono e desenhado num lugar só; o clique responde na hora com o botão ocupado e desabilitado e uma linha de status. · fixes UAT-204
  verified_by:: `test/models/scanState.test.js`, `test/components/home/SearchController.scan.test.js`
- [REQ-02] Com uma busca correndo, pedir outra (clique, Enter) não começa uma segunda; a resposta de uma busca mais antiga, ou que chega depois de a busca terminar ou de a pessoa sair da tela, não muda a tela. · fixes UAT-204
  verified_by:: `test/models/scanState.test.js`, `test/components/home/SearchController.scan.test.js`
- [REQ-03] A consulta ao catálogo tem prazo de 15 segundos e o início do MusicKit tem prazo de 10 segundos; passado o prazo, o estado é «falhou», com «Try again», e a tentativa seguinte começa do zero. · fixes UAT-204
  verified_by:: `test/utils/deadline.test.js`, `test/services/album-search/AlbumSearchService.scan.test.js`, `test/services/musickit/MusicKitAuth.deadline.test.js`, `test/components/home/SearchController.scan.test.js`
- [REQ-04] Os álbuns aparecem assim que o catálogo responde, classificados sem a lista da IA; a lista é pedida depois, uma vez, e quando chega os álbuns são classificados de novo e as quantidades dos filtros mudam; se não chega, ficam os álbuns mostrados. · fixes UAT-204
  verified_by:: `test/services/album-search/AlbumSearchService.scan.test.js`, `test/components/home/SearchController.scan.test.js`
- [REQ-05] «Nenhum álbum» e «falhou» são mensagens no painel, a segunda com o botão «Try again», que busca o mesmo texto; não há `alert` no fluxo da busca; o campo vazio recebe um aviso. · fixes UAT-204
  verified_by:: `test/components/home/SearchController.scan.test.js`, `test/models/scanState.test.js`
- [REQ-06] Quando duas mudanças de endereço correm ao mesmo tempo, só a mais nova desenha e é montada, uma vez: uma rota que redireciona não deixa a tela seguinte sem montagem. · fixes UAT-204
  verified_by:: `test/router.overlap.test.js`
- [REQ-07] Os comandos da busca leem o campo que está na tela na hora do evento, e a tecla Enter segue o mesmo caminho do clique. · fixes UAT-204
  verified_by:: `test/components/home/SearchController.scan.test.js`

## Observable States
<!-- What the imported nodes point_to: the screen state in info-arch.md (the prototype the human judged —
     PRINCIPLES.md §I.13) or the behavior state in behavior.md. N/A only if the nodes point to none. -->
N/A: a feature não importa nenhum requisito (conserto de issue). Estados do `docs/specs/behavior.md` reescritos para o que o código faz agora: `^home-scan-loading`, `^home-scan-found`, `^home-scan-not-found`, `^home-scan-failed`, `^app-native-dialogs`, `^app-view-error`. Estados novos: `^home-scan-one-state`, `^home-scan-idle`, `^home-scan-empty-field`, `^home-scan-classifying`, `^home-scan-late-answer`, `^app-route-one-owner`.

## Prototype Parity (if the feature touches a screen)
- Prototype: none. Nenhuma tela foi redesenhada. O que muda à vista na Home: o botão Scan mostra «Scanning…» com o círculo e fica desabilitado enquanto busca; o painel da direita mostra a espera, «nenhum álbum» e «falhou» (com o botão «Try again») no lugar da grade; a linha de status ganha «→ Not found», «→ Search failed» e «· confirming album types…»; somem as duas caixas de alerta do navegador.
- Transversal layer touched: `router.js` (`renderView`: uma mudança de endereço mais nova deixa a mais antiga para trás) e `services/musickit/MusicKitAuth.js` (`init` com prazo, usado por toda tela que fala com o catálogo).
- Design-system cuts or swaps: none. O projeto não tem `design-system.md`; as mensagens do painel usam as classes do estado vazio que já existia.

**Prototype**: none — MJRP, 2026-11-20 00:10: «eu dispenso prototipo por que estávamos arrumando e consertando problemas passados com pequenas melhorias e nao trabalhando em grande features nova, portanto por ora os prototipos estao dispensados.»

## Success Criteria
- Com o catálogo sem responder, aos 15 segundos a tela mostra «The catalog did not answer in 15 seconds.» e «Try again», e o botão Scan volta a ficar livre (teste com relógio falso; no navegador, pelo roteiro do relatório de entrega).
- Com o catálogo respondendo e a lista da IA ainda no ar, os álbuns já estão na grade e o botão já está livre; quando a lista chega, as quantidades dos filtros mudam.
- Dois pedidos seguidos de busca fazem uma consulta ao catálogo, não duas.
- Uma rota que redireciona deixa a tela de destino montada uma vez (6 dos 7 casos de `test/router.overlap.test.js` falhavam antes).
- Nenhum `alert(` em `components/home/`, `views/HomeView.js`, `controllers/HomeController.js`, `services/album-search/` e `services/musickit/`.
- Suíte: 982 testes passando (919 antes da feature); `vite build` compila.

## Out of Scope
- O seletor de artista da tela de séries (`components/series/ArtistScanner.js`) continua usando `getArtistDiscography`, que espera a lista da IA: ganha o prazo do início do MusicKit, não o resto.
- Os álbuns de estúdio que caem em «?» (UAT-185) e a regra de classificação em si: não tocadas; a mesma regra roda duas vezes quando a lista da IA é precisa.
- A regra de identidade do álbum e o serviço de carga dos álbuns: não tocados.
- Cancelar de fato a chamada ao catálogo que passou do prazo: o MusicKit não oferece como; a resposta atrasada é ignorada.
- `handleBulkProcess` e `AlbumSearchService.search` seguem acima do limite de complexidade 10 (15 e 11, de antes): são da F58.
- Os ouvintes diretos da grade e da pilha de escolhidos em `HomeController.bindEvents` continuam presos aos nós da montagem; com o roteador consertado não há caminho conhecido que redesenhe a Home sem montar.

## Open Questions
<!-- ALL resolved before Plan. -->
- **Os prazos (15 s para o catálogo, 10 s para o início do MusicKit, 60 s para a lista da IA) — propostos pelo agente, a julgar pelo MJRP.** O de 10 s vale para toda tela que usa o catálogo, inclusive a carga dos álbuns: num início frio do servidor somado a uma rede lenta ele pode falhar onde antes só demorava.
- **Os textos novos, em inglês como o resto do app — propostos pelo agente, a julgar pelo MJRP:** «Scanning…», «Searching the catalog for «x»…», «The albums appear as soon as the catalog answers.», «No albums found for «x».», «Check the spelling or try another name.», «The catalog did not answer in 15 seconds.», «The search could not be completed.», «Nothing was changed. You can ask again.», «Try again», «→ Not found», «→ Search failed», «· confirming album types…», «Type an artist name first.».
