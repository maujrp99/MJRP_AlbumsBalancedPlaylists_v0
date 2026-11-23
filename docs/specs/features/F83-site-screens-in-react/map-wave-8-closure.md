# Mapa do fecho da migração (F83, onda 8: TASK-28, TASK-29 e a TASK-17 que nunca foi escrita)

Escrito em 2026-11-22, antes de qualquer código da onda, a partir da leitura dos arquivos na ponta da onda 6b (`claude/f83-wave-6b-inventory-windows`, `6622654`) e do mapa da onda 7 (`map-wave-7-blend.md`), que se supõe feita (7a e 7b). Lê-se com a proposta (§ 9, § 11, § 15), a spec (REQ-03, REQ-09, REQ-10 e os «Success Criteria») e `wave-lessons.md`. **Estado:** só o mapa; nenhuma linha de produto.

**O que «feito» quer dizer** (spec, «Success Criteria», «No fim»): 0 arquivos em `public/js/views` e `public/js/components`; 0 pontes; 0 textos visíveis fora do dicionário; a suíte, o lint, os tipos e o build verdes; o peso dentro do teto, com os números. E (memória do projeto) **a linha do React só vai à produção quando a migração inteira acabar**: a publicação do fecho é a primeira do React em produção.

## O que sobra depois das ondas 6 e 7 (o inventário exato)

Hoje (`node scripts/migration-status.mjs`, 2026-11-22): 24 arquivos à mão, 4.007 linhas; 3 invólucros em `react-bridge/legacy/`; 182 textos fora do dicionário (177 à mão, 5 em React). A onda 7 tira 7 arquivos da lista (1.815 linhas), o invólucro do painel de gerar de novo e ≈ 103 textos. **Sobram 17 arquivos (2.192 linhas no disco), 2 invólucros (51 linhas), 3 entradas em `BRIDGE_USES` e ≈ 75 textos à mão.**

### A lista `handMadeScreensBaseline`, arquivo por arquivo

| Arquivo | Linhas | Quem o usa depois da onda 7 | Decisão |
|---|---|---|---|
| `components/SpotifyExportModal.js` (a janela de exportar ao Spotify) | 461 | `react-bridge/legacy/OutputWindows.ts` | **reescrever** em `ui/SpotifyExportWindow.tsx` sobre `ui/ModalShell` (8a; ver «As exportações») |
| `views/playlists/PlaylistsExport.js` (o arquivo JSON e a exportação ao Apple Music) | 142 | `OutputWindows.ts` | **mudar de lugar sem reescrever**: não desenha nada (o ramo `btn`, que escrevia no botão, está morto desde a F90: todo chamador passa `onStatus`); vai para `controllers/playlistExports.js` sem o ramo morto (8a) |
| `components/Toast.js` (os avisos) | 154 | ≈ 20 arquivos: controladores, serviços (`albumLoading`, `SpotifyAuthService`), telas, a moldura, três peças de `ui/` | **reescrever**: a mesma API (`toast.success/error/warning/info(texto, ms)`) numa loja sem React, `stores/toasts.js`, desenhada pela moldura (`shell/Toasts.tsx`, uma raiz que já existe); as três peças de `ui/` que a importam (`albumPicker/pickerController.ts`, `inventoryItem/AddWindow.tsx`, `EditWindow.tsx`) recebem `notify` de quem as abre (`ui/` não importa loja) (8b) |
| `components/GlobalProgress.js` (a barra fina de progresso, `#globalProgress`) | 80 | `router.js`, `services/SeriesService.js` (um serviço importando um componente) | **reescrever**: `stores/progress.js` + `shell/GlobalProgress.tsx`; o id e as classes iguais (os dourados da 5b o veem de lado) (8b) |
| `components/ui/BaseModal.js` (o casco da janela) | 178 | `ui/ModalWindow.tsx`, `screens/albums/RankWindow.tsx`, os dois de baixo | **reescrever**: `ui/ModalShell.tsx` já é o casco em React (mantido igual ao `BaseModal.render` por teste desde a 5b); `useModalWindow` passa a usá-lo; o teste que compara os dois passa a comparar com um retrato capturado antes (8b) |
| `components/ui/modals/ConfirmModal.js`, `InputModal.js` | 67 + 113 | `services/DialogService.js`, `RankWindow.tsx` (a pergunta de descartar) | **reescrever** em `ui/dialogs/ConfirmWindow.tsx`, `InputWindow.tsx`, abertas por `ui/windowLayer.tsx` (da 6b) (8b) |
| `services/DialogService.js` (as perguntas: `confirm`, `prompt`, `dismiss`) | 147 | `screens/` (5 arquivos), `shell/connections.ts` | **reescrever e mudar de lugar**: a mesma API em `ui/dialogs/dialogs.ts` (quem a chama é tela ou moldura, nunca controlador: conferido); os 4 casos de `DialogService.dismiss.test.js` levados (8b) |
| `components/ui/Sheet.js` (o motor da Folha do celular) | 173 | `ui/SheetWindow.tsx` (todas as folhas de todas as telas) | **reescrever** o motor dentro de `ui/SheetWindow.tsx`: segurar a página, o foco preso, Escape, toque fora, arrastar para baixo, fechar quando deixa de ser celular; os 13 casos de `Sheet.test.js` levados. **O de mais risco do fecho** (o toque e o WebKit): sub-onda própria (8c) |
| `components/ui/windowsHoldThePage.js` | 58 | `shell/PhoneShell.tsx` | **reescrever** como gancho em `shell/` (só a moldura o usa); 8 casos levados (8b) |
| `components/ui/coverImage.js` (o substituto da capa e o ouvinte de falha) | 67 | `ui/CoverImage.tsx` (a cascata à mão sai na 7b) | **mudar para `ui/`** (`ui/coverStandIn.ts`: o endereço do substituto e `watchCovers`), sem desenho; os casos de `coverImage.test.js` apontam para lá (8b) |
| `components/Icons.js` (`getIcon` como texto) | 23 (a lista diz 178: número velho, nunca baixado) | `BaseModal`, `Sheet`, `SpotifyExportModal`, `PlaylistsExport` | **apagar** quando os quatro saírem; `utils/iconShapes.js` e `ui/Icon.tsx` ficam; os 3 casos de `Icons.test.js` vão para o teste do ícone (8d) |
| `components/navigation/signInFromLink.js`, `startRoute.js` | 30 + 62 | `app.js` | **mudar de lugar**: funções sem desenho, para `shell/` (ou `utils/`); 5 + 7 casos movidos (8b) |
| `utils/SafeDOM.js` | 237 | os motores acima | **apagar** quando o último motor sair; `complexityAllowlist` perde `utils/SafeDOM.js:arrow function` (8d) |
| `views/BaseView.js` | 144 | `react-bridge/useScreenTitle.ts` (só `setTitle`) | **apagar**; o único lugar que escreve `document.title` passa a ser `react-bridge/useScreenTitle.ts` (ou `utils/tabTitle.js`), e `oneTabTitle` muda o arquivo que aceita (8d) |
| `utils/pageScrollLock.js` | 56 | o motor da Folha, `windowsHoldThePage` | **manter, com o motivo**: segura a rolagem da página escrevendo o estilo do `body` (a contagem de trancas que a lição 15 descreve); não é tela, o React não tem equivalente, e as duas telas de cima e a moldura o partilham. Sai da lista com a nota «utilitário de página, não desenho»; `handMadeScreensOnlyShrink` deixa de vigiá-lo (8d) |

Fora da lista, e que o fecho precisa ver:
- **`router.js` e `utils/failurePanel.js`** escrevem HTML por `innerHTML` (o painel de falha, «sem rede», «versão nova») com **textos em inglês fora do dicionário**. O roteador fica (REQ-04), mas os textos vão ao dicionário (REQ-08 «0 textos visíveis fora»), e o painel de React (`ReactView`) e o do roteador continuam um modelo só (8d).
- **`controllers/PlaylistsController.js`** tem 13 textos à mão (os avisos), `SeriesController.js` 1: vão ao dicionário neles (8d).

### `react-bridge/legacy/` e `BRIDGE_USES`

| Invólucro | Linhas | Quem usa | Decisão |
|---|---|---|---|
| `OutputWindows.ts` (Spotify, arquivo, Apple Music, as pastas do Apple Music) | 38 | `ui/PlaylistExportWindow.tsx`, `screens/playlists/Playlists.tsx` | **sai na 8a**: as quatro funções vão para `controllers/playlistExports.js` (com a promessa única do MusicKit da lição 13); `ui/PlaylistExportWindow` não pode importar controlador (`reactStaysAtTheEdge`, regra 2), então **as recebe** de quem a abre: `usePlaylistExport({ seriesName, exports })`, e as duas telas passam `exports` |
| `SessionSeriesController.ts` (o controlador da sessão de álbuns, um por visita ao site) | 13 | `screens/albums/index.ts` | **sai na 8d sem reescrever o controlador**: o `let made` vai para `screens/albums/index.ts`, que importa `controllers/SeriesController.js` direto (como o inventário faz com o dele: `const made: object = new Controller()`). Ver «O controlador da sessão em TypeScript» |
| `RegeneratePanel.tsx` | 66 | — | sai na 7a |

`BRIDGE_USES` depois da onda 7: `screens/albums/index.ts`, `screens/playlists/Playlists.tsx`, `ui/PlaylistExportWindow.tsx` (3). Depois da 8a: 1. Depois da 8d: 0, e a pasta não existe. **`mountReactPiece` nunca foi construído** (só a proposta e um comentário de teste o citam): nada a apagar.

### Os sensores e os testes que só existem pelas telas antigas

| Sensor | O que faz com as telas antigas | Decisão |
|---|---|---|
| `handMadeScreensOnlyShrink` + `handMadeScreensBaseline.js` | a lista que só encolhe | **virar a regra final** (8d): `views/` e `components/` não existem, e nenhum arquivo novo desenha à mão fora de `screens/`, `ui/`, `shell/` (o levantamento da onda 0 de quem escreve `innerHTML`, cria elementos ou mexe no estilo do `body`, com o roteador, o `failurePanel`, `stringUtils`, `MusicKitAuth`, `AuthService` e `pageScrollLock` na lista de exceções com motivo). O arquivo da lista sai |
| `bridgesOnlyShrink` | `BRIDGE_USES` | **virar** «a pasta `react-bridge/legacy/` não existe» (8d) |
| `viewLifecycle` | a metade das `views/*View.js` (4 casos) | a metade à mão **sai na 7b** (sem a Blend sobra só `BaseView.js` e o caso «há telas a conferir» quebra); a metade de React fica |
| `oneTabTitle` | aceita só `views/BaseView.js` | **muda o arquivo aceito** (8d) |
| `outsideTextEscaped` | lê as strings de HTML | **fica**: o roteador, o `failurePanel` e `iconMarkup` ainda montam HTML como texto; perde as entradas dos arquivos que saem |
| `outsideUrlChecked` | `views/playlists/PlaylistsExport.js: url` | a entrada segue o arquivo para `controllers/` (8a) |
| `tailwindBuiltWithSite`, `complexityAllowlist`, `screensLoadThroughTheService`, `coverImage.test` | listas com caminhos antigos | as entradas saem ou mudam de caminho no commit que apaga cada arquivo |
| `everyScreenHasTheLeaveTest`, `reactStaysAtTheEdge`, `lazyOnlyAtTheRoute`, `oneReact`, `oneStyleSystem` | são das telas novas | **ficam** |
| `test/architecture/fixtures/` | os exemplos errados de cada sensor | os dos sensores que viram regra final são refeitos para a regra nova |

## O controlador da sessão de álbuns em TypeScript

`controllers/SeriesController.js`: 578 linhas, 39 métodos, uma função de complexidade 16 (na lista), importa o roteador, o `toast`, o dicionário e sete lojas e serviços; 23 casos próprios (`SeriesController.test` 17, `.address` 3, `.defaultOrder` 3) e as provas da tela de álbuns (os dourados de 36 e 50 cenários, ≈ 120 casos levados). É um por visita ao site: a carga dos álbuns continua no serviço depois de sair da tela e a próxima visita mostra o que ela andou.

- **O que o fecho precisa:** tirar o invólucro (`BRIDGE_USES` em zero). Isso **não** pede reescrever o controlador: basta o `let made` ir para `screens/albums/index.ts` (13 linhas, risco quase nulo; provado pelos testes de hoje sem mudar).
- **Reescrever em TypeScript:** a spec põe «passar o JavaScript existente para TypeScript» **fora do escopo**, e os outros quatro controladores (`Playlists`, `SavedPlaylists`, `Inventory`, `InventoryValues`) ficam em JavaScript. Custo estimado: um dia de construção e um de prova (a tela de álbuns inteira, os dois dourados, o navegador no build e no WebKit), para nenhuma linha à mão a menos. Risco: a sessão que guarda a carga entre visitas e o filtro, a ordem e as páginas (as lojas `albumLoadStore` e `ownRankingsStore` mudam o `Map` por dentro, mapa da onda 5).
- **Recomendação:** **não reescrever na F83**; tirar o invólucro pela importação direta e registrar «os controladores em TypeScript» como candidata própria, depois do fecho, para os cinco de uma vez.

## As exportações à mão atrás de `OutputWindows.ts` (Spotify, arquivo, Apple Music)

O dono exporta para o **Apple Music**: esse caminho pede a prova mais cuidadosa.

- **Apple Music** (`handleExportToAppleMusic` em `PlaylistsExport.js` → `AppleMusicExportService.exportPlaylists` com o `musicKitService`; as pastas por `musicKitService.listFolders`): **migrar o lugar, não a lógica**. O que desenha já é React (a janela de exportar e o passo da pasta, F90, sync 2); o que sobra à mão é um módulo sem desenho. Vai para `controllers/playlistExports.js` sem o ramo `btn`; `AppleMusicExportService` e `MusicKitService` não mudam.
- **Arquivo JSON** (`handleExportJson`): o mesmo módulo; nada muda.
- **Spotify** (`SpotifyExportModal.js`, 461 linhas, a última janela à mão): **migrar** para `ui/SpotifyExportWindow.tsx` no casco `ui/ModalShell` (com `closeOnBackdrop`, que a janela à mão tem), `SpotifyExportService` e `SpotifyAuthService` sem mudar. Os 9 casos de `SpotifyExportModal.test.js` levados; o dourado da janela à mão capturado antes (os estados: pronta, sem conexão, exportando, o relatório do fim com o que foi criado e o que não foi, a falha, o modo de uma playlist da F90, Escape e fundo enquanto exporta e depois).
- **Por que migrar e não manter:** manter deixa `components/` com um arquivo e o `SafeDOM`/`Icons` vivos por ele; o critério de «feito» é zero.
- **A prova do Apple Music, a mais cuidadosa:** (1) sem mudar: `AppleMusicExport.test` 20, `PlaylistExportWindow.test` 20, `AppleFolderStep.test` 23 e o dourado `exportWindowFromMain.json` (15 cenários), `SavedPlaylists.export` 6; (2) um caso novo de caracterização **antes** de mover: a sequência inteira de chamadas ao MusicKit (procurar a pasta, criar a pasta, criar cada playlist, pôr as faixas, o relatório) com um MusicKit de mentira que anota, gravada da versão à mão e comparada com a movida; (3) no site construído, a página responde `js-cdn.music.apple.com` e `/api/musickit-token` (receita da lição 14) e o roteiro exporta um lote pelas duas telas, antiga contra nova, comparando as chamadas e os avisos; (4) **o que só o dono prova:** uma exportação de verdade para a biblioteca dele, no canal de prévia, antes do carimbo (uma pasta nova, uma pasta escolhida, sem pasta). Dizer com todas as letras que os passos (1) a (3) não tocam a Apple de verdade.

## O roteador depois da última tela antiga (TASK-29)

O roteador da casa (`router.js`, 408 linhas) faz: as rotas com um parâmetro, a consulta, os guardas de saída (`beforeNavigate`/`canNavigate`, o aviso de mudanças não salvas da tela de playlists), os ganchos depois de navegar (a moldura, a medição de uso, o título), a barra de progresso depois de um atraso, os três desfechos de carregar uma tela (chegou; arquivo de publicação antiga → recarregar uma vez; sem rede → «sem rede» e «Try again» sem recarregar, F64 e TASK-05), o painel de erro partilhado com o `ReactView`, e o dono único do histórico (`historyOwnedByRouter`). São 9 telas e um parâmetro (`/albums/:seriesId`).

| Opção | O que ganha | O que custa |
|---|---|---|
| **Manter o da casa** (recomendada) | nada a reprovar; os sensores (`historyOwnedByRouter`, `lazyOnlyAtTheRoute`) e os testes de sair continuam valendo; zero peso a mais | uma limpeza opcional: com todas as telas sendo `ReactView`, o contrato `render`/`mount`/`destroy` tem um só implementador (pode ficar como está) |
| Adotar o React Router (modo de dados) | rotas aninhadas, `loader`, tipos dos parâmetros | ≈ 15 a 20 kB comprimidos no script principal (contra um teto que só desce); reescrever os guardas, os três desfechos da carga e a recuperação da aba antiga sobre a API dele; refazer a moldura e a medição de uso que ouvem `afterNavigate`; reprovar todas as telas (sair, voltar, o histórico) no navegador e no WebKit; ≈ 3 a 5 dias e uma onda inteira de prova, sem nenhuma mudança que a pessoa veja |
| TanStack Router | tipos fortes de ponta a ponta | o mesmo custo, mais uma biblioteca que o app (Expo, F78) não usa |

**Recomendação:** **manter o roteador da casa**; registrar a decisão como **nota no plano** (não ADR: nada muda), com a revisão marcada para quando uma tela precisar de rotas aninhadas ou de carga por rota que o `prepare` do `ReactView` não dê. No fecho: os textos dos painéis do roteador ao dicionário (acima).

## A revisão que nunca foi escrita (TASK-17): proposta de entrar no relatório do fecho

A TASK-17 pedia, depois da onda 2, o custo medido e a estimativa refeita, para o MJRP confirmar o ritmo. As ondas seguiram por ordem dele sem ela. **Proposta:** dobrá-la no **relatório do fecho** (`reports/audits/<data>-mjrpalbumblender-v0-f83-closure.md`), com o custo medido de todas as ondas, numa página para o dono e o detalhe atrás:

| Medida | De onde vem | Já se sabe |
|---|---|---|
| Duração de cada onda (início e fim) e commits | `docs/log.md` (as entradas `step — F83, onda N`) | por onda |
| Testes levados (casos), cenários dourados, conferências no navegador (passaram / total) | os mapas, as linhas da TASK-30 e os `proof*.md` | onda 1: 16 cenários, 65/66; onda 2: 13, 70/82; onda 3: 47, 130/133; onda 4: 30; 5a: 36; 5b: 50; 6a: 45; 6b: 40 |
| Achados dos juízes (P0/P1/P2) | a reconferência visual por quem não construiu (TASK-32) e as críticas | **pendente:** a TASK-32 está «a fazer» nas ondas 1, 2, 3 e 5a, e não tem linha nas 4, 5b, 6a e 6b. Rodá-las antes do relatório |
| Peso do script principal antes e depois | `scripts/bundle-budget.json` e as evidências por onda | onda 0: 301.830 B; depois da 6b: 213.079 B (−88.751 B, −29%); o React (68.691 B) carrega na abertura desde a onda 3 |
| O que a primeira tela baixa e o tempo até ela | o roteiro `first-load` da onda 3 (perfil lento) | onda 3: +85 kB e ≈ +0,4 s; medir de novo no fecho, no mesmo perfil, contra a `main` |
| Tamanho da suíte | os totais do último commit de cada onda | depois da 6b: 365 arquivos, 4.814 testes |
| Arquivos e linhas à mão, textos fora do dicionário | `migration-status` | onda 0: 102 arquivos, 17.277 linhas; hoje 24 e 4.007; textos 182 |
| Diferenças de propósito (todas as ondas) | `KNOWN_DIFFERENCES` dos testes e os `proof*.md` | ver «O que o MJRP precisa ler» |

## A divisão do fecho em sub-ondas, e a ordem

1. **8a — as exportações** (o Spotify em React, o Apple Music e o arquivo mudados de lugar, `OutputWindows.ts` fora, a injeção em `usePlaylistExport`): **primeiro**, porque toca o caminho do dono e precisa de tempo para ele exportar de verdade na prévia. ≈ 600 linhas à mão saem.
2. **8b — os motores sem toque**: avisos, barra de progresso, janela e perguntas (`BaseModal`, `ConfirmModal`, `InputModal`, `DialogService`), a capa substituta, `windowsHoldThePage`, as duas funções de navegação. ≈ 960 linhas saem. A prova: o dourado de cada motor capturado antes, e o navegador em cada tela que abre uma pergunta ou janela.
3. **8c — o motor da Folha em React**: o de mais risco (toque, foco, arrastar, WebKit). A prova: os 13 casos levados, o dourado do motor, e **toda folha de toda tela** no site construído no WebKit com perfil de iPhone, com toques de verdade (≈ 20 folhas: álbuns, inventário 6, playlists, playlists guardadas, Start, Blend, a moldura). ≈ 175 linhas saem.
4. **8d — o fecho**: `SafeDOM`, `BaseView`, `Icons.js` e o invólucro do controlador da sessão fora; os sensores virados para a regra final; os textos do roteador e dos controladores no dicionário; a nota do roteador no plano (TASK-29); o relatório do fecho (com a TASK-17); a documentação; a publicação.

## A lista do «feito» (pronto para o carimbo do dono)

- [ ] `public/js/views/` e `public/js/components/` não existem; `react-bridge/legacy/` não existe; `migration-status` diz 0 arquivos à mão, 0 pontes, 0 textos fora do dicionário.
- [ ] Os sensores virados (acima) e verdes; os casos levados contados no relatório, nenhuma asserção mudada de sentido.
- [ ] Pela fila da máquina, no último commit: a suíte inteira, `typecheck`, `lint` (0 erros), `test/architecture`, o build com as chaves; o teto de peso respeitado e **baixado** ao medido.
- [ ] A TASK-30 (HTML igual) e a TASK-31 (os totais) de cada onda completas; a **TASK-32 (a reconferência visual por quem não construiu) feita em todas as ondas**, sem P0.
- [ ] O relatório do fecho escrito (com a TASK-17 dentro).
- [ ] O português lido por um olho, tela a tela (até aqui só o teste o leu), com os textos propostos pelo agente revistos pelo MJRP; a chave da F81 decide se abre.
- [ ] A documentação: `tech-stack.md` e a constituição sem «durante a migração»; `arch.md` (o mapa de componentes: `screens/`, `ui/`, `shell/`, `react-bridge/`, `i18n/`; sem `views/` nem `components/`); `design-system.md` (a tabela de portes completa); a feature `Done` em `spec.md`.
- [ ] **Do MJRP, não do agente:** aceitar a ADR-0023 (commit dele com o carimbo) e as emendas da constituição; usar cada tela com a conta dele (UAT); a exportação de verdade ao Apple Music.

### O que o MJRP vai precisar ler

1. **A ADR-0023** (`docs/decisions/0023-site-screens-in-react-screen-by-screen.md`): a decisão de usar React com TypeScript no site, tela a tela. Hoje está «Proposed»; as ondas foram construídas no ramo de integração por ordem dele.
2. **As emendas da constituição** (proposta § 9.1, a tabela): o site pode usar React nas telas e `.ts`/`.tsx` em `screens/`, `ui/`, `react-bridge/` (Proibições, art. II, Tipagem); o art. I.2 «a interface fala inglês» passa a «o código fala inglês, todo texto visível vem do dicionário»; e no art. III.1 a palavra «view» passa a incluir a tela em React.
3. **A página de cima do relatório do fecho**: o custo (dias, testes), o peso antes e depois, o tempo da primeira tela, o que os juízes acharam.
4. **As diferenças de propósito de todas as ondas, numa lista** (cada uma no sentido de melhor, para ele concordar): a barra do topo segue o endereço e a gaveta gira a seta (onda 3); com um Undo valendo, fechar a folha do celular mostra a faixa de Undo de novo (onda 4); «Connect» mantém o painel aberto (junta 1); o botão «Exportar» mantém o foco (junta 2); o «Search» recebe o toque no WebKit (junta 3); a janela do álbum fecha quando a tela sai (6b); as capas chegando na Blend não roubam o foco (7b, se o orquestrador aceitar).
5. **Os textos em português** que o agente propôs (ondas 4 a 7), à espera da revisão dele.

Ele não precisa ler os mapas, os dourados nem os roteiros.

## O que a publicação final em produção tem de verificar

É a primeira publicação da linha do React em produção, com todas as ondas juntas (memória do projeto). Antes, no canal de prévia; depois, em produção:

1. **O caminho de sempre:** `npm run deploy:site`, que confere os tipos, o teto de peso e um só `react-vendor` (TASK-08); anotar antes o id da versão anterior do Hosting e **ensaiar a volta** na prévia (REQ-10).
2. **Uma aba aberta na versão antiga se recupera sozinha** ao pedir uma tela que mudou de arquivo (aberta antes da publicação, navegada depois); **sem rede**, ir a uma tela ainda não baixada diz «sem rede» e «Try again» funciona sem recarregar (REQ-10).
3. **Cada rota abre** a 1280 no Chromium e no WebKit com iPhone 14 e SE, no site publicado: `/start`, `/albums`, `/albums/:id`, `/inventory`, `/blend` (e `?seriesId=`), `/playlists`, `/playlists/edit`, `/saved-playlists`, `/artists`, `/genres`, `/tracks`, e os desvios (`/home`, `/album-series`, `/series`, `/playlist-series`, `/callback`).
4. **A conta:** entrar, sair, a home com conta levando ao app (F85); o inventário lido na entrada (a armadilha da 6a).
5. **O Apple Music:** o botão da moldura e o estado da conexão; a busca da Start pelo catálogo; **uma exportação de verdade pelo dono**.
6. **O Spotify:** conectar e voltar por `/callback`; uma exportação (se o dono quiser; ele não usa).
7. **O português fechado** em produção (a chave da F81), salvo decisão dele.
8. **O peso e o tempo da primeira tela** medidos no site publicado, no perfil lento da onda 3, contra a produção de antes.
9. **Nenhum painel de erro** nas telas durante a passada; e, se a medição de uso estiver ligada, `screen_error` em zero no primeiro dia (hoje ela está desligada: o único sinal é o painel que o dono vê).

## Perguntas abertas (o orquestrador decide; cada uma com a recomendação)

1. **O controlador da sessão em TypeScript no fecho?** Recomendação: **não**; tirar o invólucro pela importação direta e abrir a candidata «os controladores em TypeScript», fora da F83 (a spec o põe fora do escopo).
2. **O roteador:** recomendação: **manter o da casa**, nota no plano, sem ADR.
3. **As exportações:** recomendação: **o Spotify reescrito em React; o Apple Music e o arquivo mudados de lugar sem mudar a lógica**, com a prova de chamadas ao MusicKit e a exportação de verdade pelo dono.
4. **`pageScrollLock` fica?** Recomendação: **sim**, fora da lista, como utilitário de página com o motivo escrito no sensor.
5. **A TASK-17 dentro do relatório do fecho?** Recomendação: **sim**; e as TASK-32 pendentes rodadas antes, para o relatório ter os achados dos juízes.
6. **A ordem:** recomendação: 8a, 8b, 8c, 8d. A 8c pode ir antes da 8b se o orquestrador quiser o risco cedo; a 8a primeiro em qualquer caso (o tempo do dono).

## Onde parou

O mapa está escrito; nada foi construído. A onda 8 começa depois da 7b, com a 8a.
