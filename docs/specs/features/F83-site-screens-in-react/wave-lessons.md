# As lições das ondas 0 a 4 (F83), num arquivo só

Para quem constrói a onda 5 em diante: leia este arquivo e o mapa da última onda, e não redescubra o que já custou caro. Escrito no começo da onda 5 (2026-11-21) a partir dos mapas das ondas 1 a 4, do registro (`docs/log.md`) e do que o coordenador repassou. Quando uma onda aprender algo novo, acrescente aqui.

## 1. «Igual no aspecto e no comportamento» inclui o foco e o teclado

- As telas antigas redesenham tudo. Depois de uma ação que muda a lista, o foco **volta para a página** e o próximo Tab começa no topo. A tela em React tem de fazer o mesmo: use o gancho `useFocusLikeAfterAnewDraw` (onda 2); nunca escreva outro. (Na onda 2 ele nasceu dentro de `screens/playlists/Playlists.tsx`; a onda 5 o põe em `react-bridge/` para as telas partilharem.) A onda 3 imita os momentos de redesenho da antiga com `key`.
- A **rolagem para o topo** que a antiga faz num redesenho **não** é reproduzida (decisão do coordenador, revisável).
- O React **devolve a rolagem** quando um desenho tira o foco de um elemento. Cuidado com qualquer controle que se esconde sozinho durante uma rolagem suave: na onda 3 o «voltar ao topo» parava no meio (1.409 px) até o botão soltar o foco antes de rolar.
- Um painel controlado pelo React (a «doca») não pode tomar o foco de volta sob o `StrictMode`: o efeito roda duas vezes; devolva o foco só se ele está na página (onda 4).
- **Texto em pedaços vira um nó de texto só**, como no HTML da antiga (`{`a ${b}`}` em vez de `a {b}`): separados, o Chromium compõe as pontas de outro jeito (136 px de diferença na onda 4).

## 2. Um link do React dentro do app navega uma vez

O roteador tem o próprio ouvinte de cliques em links. Um componente que navega no `onClick` precisa **impedir que o clique chegue ao roteador** (veja `ui/Breadcrumb.tsx`), senão a navegação acontece duas vezes.

## 3. As lojas: auditar antes de desenhar as leituras

Para cada loja que a tela lê, conferir e **escrever no mapa**: as listas são trocadas ou mudadas por dentro? Quais `set` são silenciosos de propósito (ex.: `setBatchName`, `setName`)? `getState()` devolve objeto novo a cada chamada? O aviso é em lote ou com foto? **Sem `useMemo` nem `React.memo` em lista que uma loja muda por dentro**: a tela refaz a lista a cada desenho. Uma escrita na loja nunca é seguida de leitura do DOM; o React desenha depois do aviso.

## 4. A prova

- **Dourado capturado da tela ANTIGA**, no padrão dos cenários (`test/support/*Scenarios.js`, o retrato guardado em `test/fixtures/`). Mostre que o teste «igual ao de antes» **acusa uma diferença posta de propósito** (uma palavra, uma classe, um foco).
- **No navegador, bloqueie o Firebase Auth e o Firestore** (hospedeiros com `identitytoolkit`, `securetoken`, `firestore.googleapis`, `firebaseinstallations`) em **todo** roteiro que abre o app, antigo ou novo: o app entra anônimo em produção com cada visitante, e essas chamadas são também fonte de ruído de pixel.
- **Antiga contra antiga é o controle de ruído** (com e sem transições) antes de chamar uma diferença de pixel de ruído. Localize os pixels de qualquer sobra (DOM, estilos computados, caixas, forçar novo desenho); nunca entregue uma diferença sem explicação sem dizer isso com todas as letras.
- Uma vez, um defeito só apareceu **no site construído, no motor do Safari** (o empacotador mudou a ordem das folhas de estilo). Para toda tela com CSS próprio do celular, uma passagem no **build** (`npx vite build`, pela fila) no **Playwright WebKit com perfil de iPhone**.

## 5. Apple Music em primeiro lugar

O dono usa Apple Music, não Spotify. Onde a tela toca um serviço de música ou o catálogo, o caminho do Apple Music é de primeira classe e provado com o mesmo cuidado do Spotify. Diga com todas as letras o que não dá para exercitar sem conta (o MusicKit real: o token de desenvolvedor vem do servidor e a busca precisa do catálogo da Apple).

## 6. Textos, peças partilhadas, peso

- Textos pelo dicionário: inglês aberto, português fechado (`i18n/en/<tela>.js`, `i18n/pt/<tela>.js`). `models/` não importa `i18n/`.
- Peça à mão ainda usada por tela não migrada fica atrás de um invólucro em `react-bridge/legacy/`, listado em `BRIDGE_USES`. `AlbumPickerController` e `DiscographyRenderer` na forma de cartão **ficam à mão** enquanto a janela de editar série os usa.
- Apague a tela antiga e as entradas dela no `handMadeScreensBaseline` **no mesmo commit** que põe a rota nova.
- Respeite o teto de peso (`bundle-budget.json`): se o script principal encolheu, **baixe o teto**; se precisa crescer, diga quanto e por quê.

## 7. A barra do topo é da F88, não da onda

O menu do topo foi refeito à parte (F88, já na `main`); a moldura em React da onda 3 ainda desenha o menu antigo e será refeita para o novo num passo posterior. **Numa onda de tela, não toque o menu da moldura.**

## 8. O ritual de fechar uma onda

- Antes do relatório final, no **último commit**, pela fila da máquina, cole os totais impressos: a suíte inteira, o `typecheck`, o `lint` e `test/architecture`. Pare todo servidor que subiu.
- Fila: `VITEST_MIN_THREADS=1 MJRP_MACHINE_HOME=$HOME/.mjrp/album-blender MJRP_HEAVY_NICE=off python3 mjrp-scripts/machine_load.py run --label <nome> --wait 1800 -- <comando>`. Nada pesado fora dela.
- A tela antiga, para comparar, em um `git worktree add --detach` próprio na área de rascunho; no fim, tente `git worktree remove`; se a trava recusar, deixe e diga o caminho.
- Commit por pathspec, um por assunto, cada um com a entrada no `docs/log.md` antes da primeira linha `## [`. Hook que recusa: pare e diga as palavras dele.

## 9. Notas que a onda 4 deixou para a onda 5 (do mapa e do registro dela)

- **Ficam à mão por serem do seletor único que a janela de editar série usa**: `components/album-picker/*` e `views/renderers/DiscographyRenderer.js` (a forma de cartão). Na onda 5 a janela de editar série passa a React, e então o seletor e o cartão podem ser portados (ou continuam atrás de invólucro; decida no mapa).
- O seletor partilhado ganhou a opção `emptyQueryMessage` (a Start passa a dela) e `models/albumPicker.js` a função `badgeCodesOf` (a antiga `badgesOf` devolve texto, para a janela de editar série).
- A **barra de filtros e a Folha dela** (`components/ui/FilterToolbar.js`, `FilterSheet.js`) esperam a onda 5 (invólucro `react-bridge/legacy/FilterToolbar.tsx`): é a onda em que se porta, e o invólucro e o uso na lista `BRIDGE_USES` saem se a tela de playlists guardadas (onda 1) passar a usar a peça nova.
- A cascata de capas tem duas escritas (`ui/AlbumCascade.tsx` e `components/common/AlbumCascade.js`) até a onda 7 (a Blend), mantidas iguais por teste.
- O sensor visual da F84 (`test/visual/visual.config.mjs`) conduz a Start por `window.controller`; as costuras `picker.service`, `albumSearchService`, `writeSeries` existem para ele.
- A Start baixa o arquivo na abertura (é a primeira tela). As demais telas baixam na hora da rota e ficam na lista do segundo plano (`prefetchScreensAfterTheFirstScreen`).
- Para o roteiro de navegador de uma onda: modelo em `reports/evidence/F83/wave-4/browser-proof.mjs`; o ruído conhecido (3 capturas de 24 mil pixels na moldura do topo) existe também de antiga contra antiga.
- O que a Start não prova sem conta: o MusicKit real; o Spotify nem é tocado por ela.
