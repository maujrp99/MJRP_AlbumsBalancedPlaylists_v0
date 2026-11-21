# Mapa da tela `/saved-playlists` (F83, onda 1, TASK-11)

Escrito antes da tela, conferido depois dela (o que mudou entre o mapa e a construção está no fim). Lê-se junto com a proposta (§ 4.3, § 4.4, § 9.2) e o `tasks.md`.

## Os pedaços

A tela antiga tinha 8 pedaços além do controlador. O que cada um virou:

| Pedaço de antes | Linhas | Agora | Como |
|---|---|---|---|
| `views/SavedPlaylistsView.js` (a tela) | 354 | `screens/saved-playlists/SavedPlaylists.tsx` + `index.ts` (a rota) | porte; o estado dos filtros é `useState`, a lista é `useStore` |
| `components/playlists/SavedSeriesGroup.js` | 154 | `screens/saved-playlists/SeriesGroup.tsx` | porte; computador e celular são dois componentes (trocar de um para outro desenha de novo, como antes) |
| `components/playlists/SavedPlaylistCard.js` + `SavedPlaylistRow.js` + `SavedPlaylistActions.js` | 113 + 95 + 104 | `screens/saved-playlists/BatchCard.tsx` | porte; o que só se desenhava ao abrir continua só se desenhando ao abrir |
| `components/playlists/SavedPlaylistsPhone.js` | 174 | `screens/saved-playlists/PhoneParts.tsx` | porte; as folhas pelo `ui/SheetWindow` |
| `components/playlists/PlaylistDetailsModal.js` | 68 | `screens/saved-playlists/PlaylistDetails.tsx` | porte; a casca da janela pelo `ui/ModalWindow` |
| `components/playlists/batchNames.js` + as frases de `SavedPlaylistsPhone.js` e `SavedSeriesGroup.js` | 47 | `screens/saved-playlists/listText.ts` | porte, pelo dicionário |
| `components/ui/FilterToolbar.js` + `FilterSheet.js` (a barra e a folha de filtros) | 291 + 129 | **a mesma peça antiga**, por `react-bridge/legacy/FilterToolbar.tsx` | ver «as peças partilhadas» |
| os diálogos de apagar (`services/DialogService.js`) | — | o mesmo serviço, chamado pela tela com os textos do dicionário | o serviço fica (§ 4.4) |
| `components/playlists/SavedPlaylistsController.js` | 137 | `controllers/SavedPlaylistsController.js` (o JavaScript, a mesma lógica) | nunca foi um componente; recebia uma `view` que não usava (tirada); os avisos de apagar vêm do dicionário |

Saíram do `handMadeScreensBaseline.js` no mesmo commit que os apagou: 9 arquivos (os 7 acima mais `batchNames.js` e o controlador, que mudou de pasta).

## Os estados a conferir, a 1280 e a 393

Os cenários de `test/support/savedPlaylistsScenarios.js`, cada um com o que a tela antiga desenhava (guardado em `test/fixtures/savedPlaylistsBeforeF83.json`) e, no navegador, com a tela antiga e a nova lado a lado (`reports/evidence/F83/wave-1/browser-proof.mjs`).

1280: esperando a lista (primeira carga); lista que não pôde ser lida; séries chegando (uma de três, duas de três); duas séries fechadas; um lote aberto; uma playlist aberta (as faixas desenhadas só agora); fechar de novo; lote vazio e playlist sem faixas; as duas falhas (da série, da lista, com e sem séries na tela); estado vazio (também enquanto atualiza); atualizando; sem capas; busca («floyd», sem resultado), filtro de série e de lote, ordem por nome; a janela da playlist (abrir e fechar); as perguntas antes de apagar o lote e antes de apagar tudo (Cancelar).

393: a lista fechada; uma série aberta; um lote aberto; a folha das ações da série e a do lote (abrir, fechar por Escape e pelo ✕); um filtro ligado (o botão «Filters (1)» e o chip) e dois; a folha dos filtros; a falha de uma série.

## O que a tela lê, e o que muda por dentro

Uma store só: `SavedPlaylistsStore` (`stores/savedPlaylists.js`), pelo controlador. Auditoria dos `set` (proposta § 4.3, o que nenhum sensor prova):

- Todo setter (`begin`, `setSeries`, `setListFailed`, `patchEntry`) chama `_changed()`: nenhum muda sem avisar. O aviso é em lote, numa microtarefa, **sem foto do estado** (`flush()` chama o ouvinte com a própria store): é a forma «aviso em lote» do contrato de `useStore`; a tela lê os mesmos `get…` de hoje durante o desenho.
- Uma entrada é **trocada, nunca mudada** por dentro (`patchEntry` faz `{...atual, ...mudança}`); quem lê pode comparar por identidade, e a tela compara os campos que uma série mostra (`shownOf`) para saber se o grupo dela é desenhado de novo.
- Mudam por dentro: o `Map` de `entries` (`patchEntry` faz `entries.set`) e a lista `order` (trocada inteira em `setSeries`). Nada derivado delas fica guardado em `useMemo` nem sob `React.memo`: a tela refaz a lista a cada desenho (`visibleGroups`, `toolbarOf`).
- O React desenha **depois** do aviso, não dentro dele. Nenhum código da tela escreve na store e lê o DOM em seguida (a tela só lê a store; quem escreve é o leitor).
- Ouvinte: um fixo da ponte na store (descontado pelo teste de sair) e um por tela, que sai ao desmontar (`bridgeListenerCount()` volta a zero: `SavedPlaylists.test.tsx`, o teste-molde).

## O que o controlador faz

Pede a leitura (`open`, `reload`, `retrySeries`), entrega o que a store tem (`getList`, `isFirstLoad`, `findPlaylist`), apaga pelo leitor e avisa (`deleteBatch`, `deleteAllPlaylists`), e navega (`editBatch` põe o modo de edição no serviço das playlists e vai a `/playlists/edit`; `navigateBlend`; `openSeriesManager`). **Não mexe no DOM** e não conhece repositório (`savedPlaylistsBoundaries.test.js`, agora sobre os arquivos novos). Navega direto pelo roteador, de dentro de um clique (nunca de um efeito), então não precisa do `navigate()` da ponte; só o botão «Create Series» do estado vazio, que é da tela, usa o da ponte.

## As peças partilhadas com telas de outras ondas, e a fonte única de cada uma (proposta § 4.4)

A proposta manda portar uma vez, para `ui/`, na primeira onda que usa, e montar a peça nova nas telas antigas por `mountReactPiece`. **Isto não cabe nesta onda** para o que a tela antiga chama de dentro do script principal: uma peça em React chamada por uma tela antiga faria o script principal importar o React, e a decisão da onda 0 (REQ-07, `bundle-budget.json` `reactAtStart: false`) é que a primeira carga do site não baixa React até uma tela em React abrir. Então, por peça:

| Peça | Quem mais a usa | Decisão | Fonte única |
|---|---|---|---|
| Ícones | quase tudo | já é de dados desde a onda 0 | `utils/iconShapes.js` |
| Barra de filtros e a Folha dela | tela dos álbuns (onda 5) | **fica a antiga**; invólucro em `react-bridge/legacy/FilterToolbar.tsx` (lista `BRIDGE_USES`) | `components/ui/FilterToolbar.js`, até a onda 5 |
| Linha de faixa (`TrackRow`) | tela das playlists (onda 2) | **fica a antiga**; invólucro `react-bridge/legacy/TrackRows.tsx` | `components/ui/TrackRow.js`, até a onda 2 |
| Cascata de capas | tela Blend (onda 7), que a escreve como texto | **porte para `ui/AlbumCascade.tsx`; a antiga fica para a Blend**: duas escritas de umas 15 linhas, mantidas iguais por teste (`test/ui/AlbumCascade.test.tsx`) | duas, até a onda 7 (aceito, o único caso) |
| Imagem de capa com reserva | muitas telas | `ui/CoverImage.tsx` sobre o módulo antigo (a escuta do erro e o endereço da reserva são dele) | `components/ui/coverImage.js` |
| A Folha (motor) e a janela (casca) | 8 e 10 arquivos | o motor fica (§ 4.4, caso 2); `ui/SheetWindow.tsx` e `ui/ModalWindow.tsx` o abrem e desenham o conteúdo em React | `components/ui/Sheet.js`, `BaseModal.js` |
| O aviso (`Toast`) e o diálogo (`DialogService`) | tudo | o serviço fica; a tela o chama | os serviços |
| O aviso «sem séries» e a barra do topo | — | não há; o `Breadcrumb` desta tela desenha nada (a rota `/saved-playlists` não tem migalhas) | — |

## O que mudou entre o mapa e a construção

- O mapa previa portar a barra de filtros; ficou a antiga, pelo motivo acima (a decisão tem de ir ao MJRP: ver o plano).
- O grupo de uma série é desenhado de novo quando o que ele mostra muda (uma capa que chegou): o lote que a pessoa abriu volta a fechado. É o comportamento da tela antiga (o grupo era um nó trocado), mantido de propósito; o React sozinho o manteria aberto. Se o MJRP preferir o outro, é uma linha.
- A tela pede a lista uma vez só, mesmo com o modo estrito do React ligado (que roda cada efeito duas vezes no desenvolvimento e nos testes).
