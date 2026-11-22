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

O menu do topo foi refeito à parte (F88, na `main`) enquanto as ondas avançavam; o passo de integração (ver 12) levou a F88 para a moldura em React, com o mesmo desenho. **Numa onda de tela, não toque o menu da moldura**: ele é a `main`, e quem o muda de novo na `main` o porta para `shell/` do mesmo modo.

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

## 10. Notas que a onda 5a deixou (da construção e da prova)

- **Um peça que lê as propriedades de uma ref para desenhar uma camada (a folha) tem de atribuir a ref ANTES de chamar o gancho que faz a camada.** Em `ui/FilterToolbar.tsx` a folha mostrou a escolha do desenho anterior no site publicado; o modo estrito (segundo desenho) escondia isso nos testes e no servidor de desenvolvimento. Só o WebKit sobre o build achou. A passada no build com um clique/seleção de verdade nas folhas não é opcional.
- **`select` controlado não deixa o atributo `selected`** e `defaultValue` deixa: para a asserção de uma tela antiga que lê o atributo, use `defaultValue` com a chave da lista (ela é feita de novo quando a figura muda, como a antiga). Um `input` com `defaultValue` ganha o atributo `value`; escreva a propriedade num efeito. Um campo que a tela antiga ouvia pelo evento `input` fica com o ouvinte `input` na mão (o `onChange` do React não ouve um valor escrito por script).
- **A folha da antiga desliza para fora com o que tinha dentro**; `useSheetWindow` agora solta o que o React desenha nela só quando a folha sai da página.
- **O gancho do foco ganhou `keep` (o que a antiga escrevia no lugar: barra e paginadores) e `after` (só depois de um aviso do controlador, não quando uma folha fecha e devolve o foco).**
- **A tela antiga redesenha só quando o controlador avisa; o gancho, por padrão, solta o foco em todo desenho.** Diga a qual desenho a antiga reagia.
- **Peça à mão desenhada por React:** a caixa em volta (`display: contents`, `data-legacy-host`) é desembrulhada na comparação (`normalize`) e fica no DOM.
- **Medir o redesenho no build, não no servidor de desenvolvimento**: o React de desenvolvimento mais o modo estrito dão 1,6 a 1,9 vez, e o build dá igual ou menos. O roteiro `redraw-300-covers.mjs` aceita o endereço de qualquer servidor (`vite preview` de duas pastas de build).
- **`git worktree remove` do worktree de comparação pode ser recusado pela trava; deixe e diga o caminho.**

## 11. Notas que a onda 5b deixou (da construção e da prova das janelas)

- **Uma janela cujo rodapé lê o que o corpo edita não cabe em `useModalWindow`** (o rodapé e o corpo são dois portais, sem estado em comum, e o rodapé vira uma caixa de dentro do rodapé do casco). Use `ui/ModalShell.tsx`: a janela inteira em React, no mesmo casco; `test/ui/ModalShell.test.tsx` o mantém igual ao `BaseModal.render` (tamanho a tamanho, com e sem rodapé) até a onda 8.
- **A ponte do arrastar é uma só**: o que muda de uma tela para outra é um `DragProfile` (as listas, o número de cada lista, as opções do `sortablejs`, a classe da página durante o arrasto). O padrão é o da tela de playlists; a janela de classificar dá o dela (uma lista, a linha inteira no computador e a alça no celular, sem grupo, sem espera de toque). Não chame `option()` do Sortable a cada desenho: só quando a alça muda.
- **O modo estrito faz e solta o Sortable de cada lista e o faz de novo** (efeito rodado duas vezes). O teste «igual ao de antes» toca cada cenário duas vezes: sem o modo estrito, comparando tudo (as chamadas inclusive); com ele, comparando tudo menos esse par.
- **`vi.mock('sortablejs', factory)` que importa um arquivo de teste que importa a janela trava o teste** (a fábrica espera o módulo que está sendo carregado, que importa o módulo que ela substitui): a fábrica deve carregar um arquivo que não importa nada do aplicativo (`test/support/sortableStandIn.ts`).
- **`SafeDOM.button` põe `type="button"`** em todo botão; e a janela antiga de classificar **pede dois ícones que não existem** (`ChevronLeft`, `RotateCcw`: nada é desenhado nos botões «Back» e «Reset» do computador). O teste dourado acusa as duas coisas: copie o que a antiga desenha, não o que ela pede.
- **O dourado também guarda o que a antiga tinha de lado**: a barra de progresso do app (`#globalProgress`) aparece na primeira página de quem importou o módulo dela primeiro; não é da janela, e o `layerOf` do teste o ignora.
- **A prova no navegador tira as chamadas de fora**: os módulos do servidor de desenvolvimento são os mesmos objetos que as janelas usam, então a página troca `albumSearchService.scanArtist`, o protótipo de `SeriesService` (`updateSeries`, `deleteSeries`, `countSavedPlaylists`) e `userRankingRepository.saveRanking` por funções que escrevem em `window.__calls`: a classificação percorre a janela, a tela, o controlador e o serviço de classificações e para no repositório, e o que iria para os dados da pessoa é comparado, antiga contra nova. No site construído os módulos são empacotados e não há como trocá-los: lá só se prova o que não pede o serviço (abrir, digitar, tirar, mover, o caminho do visitante sem conta, cancelar, Escape, arrastar).
- **Depois de pôr o `userId` numa loja, espere o controlador desenhar a tela de novo (≈ 1,5 s) antes do primeiro clique**: um clique que chega antes perde o foco para o desenho que vem atrás, e isso parece (e não é) uma diferença da janela nova.
- **O arrastar com o dedo precisa de CDP** (`Input.dispatchTouchEvent`); o WebKit não o tem, então no WebKit com perfil de iPhone o celular só prova os toques (os botões), e o arrastar com toque fica no Chromium com emulação de toque.
- **O que a janela de classificar grava**: todas as faixas da ordem na tela, de 1 a N, as sem classificação própria depois das classificadas; a classificação «parcial» que a janela permite (mover uma faixa e deixar o resto) é gravada como uma classificação inteira (os dados da pessoa não distinguem o que ela deixou de classificar). É assim desde a janela antiga; fica como candidata a issue.

## 12. Notas que o passo de integração com a `main` deixou (F88 em React)

- **A `main` anda em código à mão enquanto as ondas andam em React: junte cedo.** Cada mudança da `main` num arquivo que uma onda já apagou volta como conflito «modificado de um lado, apagado do outro». A regra que funcionou: apague o arquivo de novo, leia o diff da `main` contra a base (`git diff <base> main -- <arquivo>`) e porte o que importa para a peça em React **com um teste vermelho antes**. No passo foram só dois portes (a grade de capas `md:` para `sm:` e a linha do celular de 767 para 899 px); tudo o mais em arquivos já trocados era comentário.
- **O dourado muda de dono quando a `main` muda a referência.** Um retrato capturado da tela antiga vale até a `main` redesenhar essa tela: aí recapture da `main` (um `git worktree add --detach <área> main`, o `node_modules` clonado com `cp -Rc`, o arquivo de cenários e o de apoio copiados e um teste de captura como o de `reports/evidence/F83/sync-main/capture-before.test.js`). Reescreva os cenários para o desenho novo antes: os do desenho antigo (a gaveta, o menu de séries, o botão do Spotify) saem, e os novos entram (cada estado do Apple Music, o painel, os pontos, a linha de baixo). 55 cenários cobrem a moldura; 54 passaram na primeira rodada.
- **Um stand-in com `vi.mock` de fábrica que importa o arquivo de cenários não pode ser importado pelo arquivo de cenários** (círculo: a fábrica espera o módulo que importa o módulo que ela substitui; o teste trava sem mensagem). `forgetApple()` mora no andaime (`renderShell.tsx`) e na captura, não em `shellScenarios.js`.
- **`Account.tsx` e `account.ts` são o mesmo arquivo para o disco do Mac** (maiúscula e minúscula): o TypeScript acusa «differs only in casing». Nomes de arquivo do `shell/` diferem por mais que a caixa.
- **Um modelo sem desenho para o que o `mountConnections` fazia** (`shell/connections.ts`: o estado de cada serviço, `check`, `run`, o foco que volta; quem ouve é o `useSyncExternalStore`) deixa a lógica igual e testável com os mesmos 22 casos. **A função de assinatura do `useSyncExternalStore` tem de ser estável** (`useCallback`): uma nova a cada desenho assina de novo, e o modelo que ouve os serviços só enquanto alguém o ouve refaz a assinatura e redesenha sem fim (o teste travou).
- **Um clique em «Connect» no painel da `main` fecha o painel** (a linha é refeita dentro do clique, e o painel toma o clique, já sem o botão no documento, por «fora»). A versão em React o mantém aberto, que é o que o commit «confirmar Disconnect mantém o painel aberto» da F88 queria; é a única diferença de propósito (`KNOWN_DIFFERENCES` em `Shell.sameAsBefore.test.tsx`). Quem quiser o fechar, o faça nas duas.
- **Ordem entre perguntar ao Apple Music e focar o primeiro controle**: na `main` o `setMenuOpen` pergunta (a linha vira «Checking…», sem botão) e só então foca o primeiro botão que sobrou. Em React, `flushSync` na seta para baixo: abre, `model.check()`, `flushSync(() => {})`, foca. Com o foco num `useEffect` o botão que ele pegava sumia no desenho seguinte e o foco ia para a página (visto só no navegador, no site construído).
- **Sem `dangerouslySetInnerHTML`**: a fileira de barras (`style="--h:..;--d:..;--o:.."` de `threadBarStyle`) vira objeto de estilo com propriedades personalizadas, e o ícone de cada parada (uma string de SVG da home, `splash/phoneBar.js`) é lido com `DOMParser` e refeito como elementos (`StopIcon.tsx`). O desenho da home continua uma função só, usada pela página estática e pelo app.
- **Peso**: o script principal cresceu 1.878 B (233.446 B contra 231.568 B): o menu novo é mais código que o antigo, as 25 chaves em inglês entram no script principal, e `splash/menu.js` virou um arquivo pequeno de que a primeira tela também depende. O teto subiu para 233.590 B.
- **Prova no navegador, o que ela mostrou**: a 1280 (Chromium) e a 800 px (a faixa de 768 a 899 que agora usa o layout do celular), e no WebKit com iPhone 14 e SE, as capturas da `main` e as da linha do React ficaram em 0 pixels de diferença, menos a faixa das telas «Em breve», com no máximo 1 de 255 por pixel, que também aparece de antiga contra antiga. Um defeito só apareceu no navegador: a seta para baixo no botão da conta (ver acima).
