# Mapa das telas `/playlists` e `/playlists/edit` (F83, onda 2, TASK-15)

Escrito antes de qualquer código da onda, a partir da leitura dos arquivos em 2026-11-21 (ramo `claude/f83-wave-2-playlists-edit`, empilhado sobre a onda 1). **Estado:** só o mapa; a tela não foi construída (ver «Onde parou»). Lê-se com a proposta (§ 4.3, § 4.5, § 9.2) e o `map-wave-1-saved-playlists.md`.

## O tamanho do trabalho

A onda 2 é a «tela difícil» de propósito (proposta § 15): ~2.600 linhas de tela à mão, contra 1.800 da onda 1.

| Pedaço de hoje | Linhas | Quem mais o usa | Decisão proposta |
|---|---|---|---|
| `views/PlaylistsView.js` (a tela: desenha tudo de novo a cada aviso das 3 stores, depois religa ouvintes e o arrastar) | 383 | — | `screens/playlists/Playlists.tsx`; o React troca o «redesenhar tudo» por componentes |
| `components/playlists/PlaylistsGridRenderer.js` (cabeçalho, nome do lote, controles de gerar, exportar, vazio, grade; HTML em texto) | 183 | — | porte, por componentes |
| `components/playlists/PlaylistGrid.js` (a playlist e suas faixas, em texto) | 187 | — | porte |
| `components/playlists/PhonePlaylists.js` (o celular: chips, faixas, barra de ação; HTML em texto) | 187 | — | porte; `minutes()` passa a ser a de `screens/saved-playlists/listText.ts` (uma só) |
| `components/playlists/PhoneUndoNotice.js` | 45 | — | porte |
| `components/playlists/PlaylistsDragHandler.js` (`sortablejs`) | 85 | `ranking/` usa `sortablejs` à parte | ponte para o `sortablejs` (TASK-14) |
| `components/playlists/RegeneratePanel.js` (estado estático ligado ao DOM: `reset`, `mount`, `getConfig`) | 182 | **`controllers/BlendingController.js`** (Blend, onda 7) | **fica o antigo**, por invólucro em `react-bridge/legacy/` até a Blend migrar (mesmo motivo da onda 1: o controlador da Blend está no script principal) |
| `views/playlists/playlistEditActions.js` (desfazer, refazer, apagar playlist, título: ouvintes delegados) | 81 | — | vira manipuladores de componentes; os testes vão junto |
| `views/playlists/phonePlaylistActions.js` (as folhas do celular, desfazer, mover faixa, salvar, exportar) | 206 | — | manipuladores + `ui/SheetWindow` |
| `views/playlists/unsavedChangesGuard.js` (o guarda de sair, F60) | 39 | só esta tela | `useEffect` com o mesmo `installUnsavedChangesGuard` (o roteador não muda) |
| `views/playlists/PlaylistsExport.js` e `index.js` (exportar JSON e Apple Music) | 127 | — | a tela chama; os textos pelo dicionário |
| `components/SpotifyExportModal.js` (janela de exportar, carregada sob demanda) | 434 | só esta tela | **decisão da onda 2: fica a antiga**, chamada como hoje por `import()`; porta-se à parte (não é «a tela») |
| `components/ui/TrackRow.js` (a linha de faixa) | 247 | `PlaylistGrid` (esta onda), invólucro da onda 1 | **porta-se uma vez para `ui/TrackRow.tsx`** e `react-bridge/legacy/TrackRows.tsx` sai da lista `BRIDGE_USES` (`BatchCard.tsx` e `PlaylistDetails.tsx` passam à peça nova, a asserção dos testes intacta) |
| `components/Breadcrumb.js` | 63 | álbuns, inventário (antigas) | a tela daqui **tem migalhas** (`/playlists` → Start › Blend › Playlists; editando: Start › Saved Playlists › Edit Batch): peça nova em `ui/`, a antiga fica para as telas antigas até o fecho |
| `utils/keepField.js` (devolver o campo em uso depois de redesenhar) | 63 | `InventoryView` | deixa de ser preciso nesta tela (o React não troca o campo) |
| `controllers/PlaylistsController.js` | 262 | — | fica; recebe `view` hoje (a tela passa a entregar só o que o controlador usa); a conferir o que ele faz no DOM |
| `stores/playlists.js` | 169 | — | fica (ver abaixo) |

Peças da onda 1 que esta onda reaproveita: `ui/Icon`, `ui/AlbumCascade` (não), `ui/SheetWindow`, `ui/ModalWindow`, `useStore`, `usePhone`, `useLocale`, `navigate`.

## As stores que a tela lê, e o que muda por dentro

Três: `playlistsStore`, `albumSeriesStore`, `albumsStore` (a tela redesenha a cada aviso de qualquer uma).

- **Auditoria dos `set` de `playlistsStore`:** todos chamam `notify()` **menos `setBatchName`** (de propósito: o campo do nome é da pessoa, e redesenhar tiraria o cursor, F73). Na tela nova isso passa a ser trivial (o campo é controlado e o React não o substitui), mas a regra «uma mudança sem aviso fica invisível» vale: a tela mantém o nome no estado do campo e **só** o entrega à store; o nome ao lado de cada título (computador) precisa redesenhar a grade a cada letra, como hoje (`gridContainer.innerHTML = …` no `input`), então o campo escreve na store **e** o estado da tela (a leitura do nome vem do estado, não da store).
- **`getState()` devolve um objeto novo a cada chamada** e o aviso passa esse objeto (`notify()` chama o ouvinte com `getState()`): forma «com foto»; `useStore` lê os getters durante o desenho e não usa a foto.
- **As listas mudam por dentro:** `playlists` é a lista do serviço (`moveTrack`, `deleteTrack`, desfazer/refazer trocam ou mudam faixas); nada derivado dela pode ficar em `useMemo` nem sob `React.memo`; **a conferir no serviço (`services/playlists/PlaylistsService`) se ele troca a lista ou a muda por dentro** antes de a tela existir: é o ponto de maior risco de dado velho (R4).
- **Escritas e leitura do DOM:** o arrastar termina e o serviço é pedido uma microtarefa depois (`queueMicrotask`) para o `sortablejs` acabar de soltar; o aviso da store redesenha depois disso. Na tela nova o `sortablejs` mexe nos nós que o React acha que são dele: ver TASK-14.

## O que o controlador faz (o que mexe no DOM)

`PlaylistsController` recebe a view; a conferir linha a linha qual uso da view é desenho (`isGenerating`, painel aberto). A tela nova guarda `isGenerating` como estado; o controlador passa a avisar por retorno ou por callback, não por campo da view.

## TASK-14, o arrastar e soltar: decisão e o que falta

- **Decisão (técnica, revisável, decidida pelo agente):** ponto de partida da proposta: manter o `sortablejs` atrás de uma ponte (`react-bridge/legacy/` não: é permanente até a decisão), sem dependência nova e sem mudar o comportamento (toque com atraso de 100 ms, alça de 44 px no celular, arrastar entre playlists). O `@dnd-kit` só entra se a medição provar que a ponte quebra; ele **mudaria o comportamento** (toque longo, rolagem, animação), e isso, pela regra da própria tarefa, **vai ao MJRP antes de construir**.
- **A ponte, em desenho:** a lista de faixas de cada playlist é React; ao arrastar, o `sortablejs` move o nó no DOM; no `onEnd` a ponte **devolve o nó ao lugar que o React lhe deu** (`from.insertBefore`) e só então pede `moveTrack`; o React redesenha pela store com a ordem nova. Assim o React nunca vê um DOM que não escreveu. Falta medir isso num navegador, no computador e no celular (toque), e escrever o relatório em `reports/audits/` com a escolha e o motivo. **Não foi medido.**

## Os estados a conferir a 1280 e a 393 (a lista da prova de HTML igual)

Computador: sem playlists e nada em edição (estado vazio); gerada pela Blend (3 playlists, com o nome do lote nos títulos); o campo do nome digitado (a grade redesenha a cada letra, o campo guarda o foco); o painel de gerar fechado e aberto; gerando (cobertura); desfazer e refazer ligados e desligados; apagar uma playlist; remover uma faixa; editando um lote guardado (migalhas «Edit Batch»); editando e lote não achado («Batch Not Found»); salvando; os três botões de exportar; arrastar uma faixa dentro e entre playlists.
Celular: uma playlist por vez com os chips (a chip aberta, a rolagem dos chips guardada); a linha do nome com desfazer e refazer; a barra de ação (salvar, exportar); as folhas de ação da faixa (subir, descer, outra playlist, remover) e o aviso de desfazer depois de remover; apagar com pergunta; virar computador (a grade volta).

## Os textos

Cerca de 90 lugares de texto à mão nesses arquivos (a contar com o script de `migration-status`); inglês aberto, português fechado como na onda 1. As frases das playlists, o aviso de desfazer, as folhas, o painel de gerar (que fica antigo: seus textos ficam em inglês até a Blend), o «Batch Not Found», o «Generating balanced playlists...».

## Onde parou

Este mapa (TASK-15) está escrito. **Não foram construídos** a tela, o porte da linha de faixa nem a medição do arrastar (TASK-14, 16). Motivo: a medição do arrastar precisa de navegador real com toque, e a tela (2.600 linhas, três stores, arrastar, desfazer, celular) não cabe inteira numa sessão com a prova de HTML igual que a onda 1 teve; parar no meio de uma onda não vai para a `main` (proposta § 4.6). Duas decisões que são do MJRP, se o coordenador não as tomar: ver o relatório da sessão.
