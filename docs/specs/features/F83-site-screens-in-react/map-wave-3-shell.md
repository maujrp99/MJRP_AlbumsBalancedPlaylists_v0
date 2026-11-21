# Mapa da moldura do site (F83, onda 3, TASK-18)

Escrito antes de qualquer código da onda, a partir da leitura dos arquivos em 2026-11-21 (ramo `claude/f83-wave-3-shell`, empilhado sobre a onda 2, `610fc1b`). Lê-se com a proposta (§ 4.3, § 4.4, § 5.4, § 15) e os mapas das ondas 1 e 2. **Estado:** o mapa; o que a onda construiu está em «Onde parou», no fim.

A «tela» desta onda não é uma rota: é o que está em toda tela. Mora fora de `#app` e não é trocada pelo roteador: a barra do topo e o rodapé do computador (`#header-container`, `#footer-container`), a moldura do celular (barra do topo, barra de abas, «voltar ao topo», o menu e a pergunta de limpar o cache, folhas de baixo) e a janela de entrar.

## O tamanho do trabalho

| Pedaço de hoje | Linhas | Quem mais o usa | Decisão |
|---|---|---|---|
| `components/TopNav.js` (barra do computador, gaveta da tela média, desenhados em texto; redesenha tudo a cada aviso do `userStore`) | 271 | — | `shell/TopNav.tsx` |
| `components/navigation/SeriesDropdown.js` (o menu de séries) | 216 | — | `shell/SeriesDropdown.tsx` |
| `components/navigation/AuthNav.js` (conta, menu da conta, sair; `isSignedIn`, `signOut`) | 182 | **`controllers/HomeController.js` usa `isSignedIn`** (Start, onda 4) | conta em `shell/AccountMenu.tsx`; `isSignedIn` vai para `utils/isSignedIn.js` (uma linha, sem desenho); `signOut` para `shell/signOut.ts` |
| `components/SpotifyConnectButton.js` (o botão de conectar; uma instância na barra, outra na gaveta e outra na folha do celular) | 116 | — | `shell/SpotifyConnect.tsx` |
| `components/Footer.js` (rodapé, limpar o cache, a frase da API do Discogs) | 97 | **`views/InventoryView.js` liga e desliga a frase do Discogs por `showDiscogsNotice` e lê `DISCOGS_NOTICE`** (inventário, onda 6) | `shell/Footer.tsx`; `showDiscogsNotice` passa a escrever numa loja pequena (`stores/discogsNotice.js`), que o rodapé lê |
| `components/LoginModal.js` (a janela de entrar) | 128 | **`controllers/HomeController.js` abre** (Start, onda 4); `app.js` abre pelo `?signin` (F80) | `shell/LoginWindow.tsx`; quem abre chama `openLoginWindow()` de uma loja pequena (`stores/loginWindow.js`) |
| `components/navigation/PhoneShell.js` (barra do topo, barra de abas, «voltar ao topo», só no celular; **`nameThisScreen`**) | 183 | **`views/SeriesView.js` e `react-bridge/useScreenTitle.ts` chamam `nameThisScreen`** | `shell/PhoneShell.tsx`; o nome dado vai para uma loja pequena (`stores/screenName.js`) |
| `components/navigation/PhoneMenu.js` (o menu e o «limpar o cache?») | 134 | — | `shell/PhoneMenu.tsx` sobre `ui/SheetWindow` |
| `components/navigation/phoneTabs.js` (as 5 abas e o nome de cada endereço) | 67 | — | `shell/phoneTabs.ts` (dados) |
| `components/navigation/barName.js` | 8 | — | constante em `shell/` |
| `components/navigation/startRoute.js`, `signInFromLink.js` | 62 + 30 | `app.js` | **ficam**: funções puras sem desenho |

1.402 linhas à mão saem (10 arquivos); entram o `shell/` e três lojas pequenas. Testes de hoje que se levam: `Footer`, `AuthNav.menu`, `AuthNav.signout`, `LoginModal.guestNotice`, `TopBarNames`, `PhoneShell`, `PhoneMenu`, mais os que tocam `showDiscogsNotice`/`nameThisScreen`.

## As lojas e as fontes que a moldura lê

- **`userStore`** (barra do computador, barra do celular, menu do celular): os três `set` (`setUser`, `setLoading`, `setError`) chamam `notify()`; nenhum é silencioso. `getState()` devolve **um objeto novo a cada chamada** e o aviso o passa (forma «com foto»): `useStore` lê os getters no desenho e não usa a foto. `currentUser` é **trocado** inteiro por `setUser` (o objeto do Firebase não é mudado por dentro por nada do site). Sem lista nenhuma.
- **O que a moldura de hoje redesenha, e quando** (isto é o que a nova tem de repetir, porque redesenhar tira o foco do que estava focado e fecha o que estava aberto): a barra do computador inteira (`innerHTML`) a **cada aviso do `userStore`**, e **não** quando o endereço muda; a barra do topo do celular a cada aviso do `userStore`, a cada fim de navegação e a cada nome dado por uma tela; a barra de abas a cada fim de navegação. O rodapé nunca. Na nova, essas partes ganham uma `key` que muda nos mesmos momentos: o React as refaz por inteiro e o foco volta para a página como hoje, sem um segundo gancho (o `useFocusLikeAfterAnewDraw` da onda 2 resolve o mesmo para `#app`, que o React não refaz).
- **Achado: a barra do computador de hoje não segue o endereço.** O destaque do link atual (e o rótulo do menu de séries) é escrito uma vez, no endereço de quando a barra foi desenhada, e só muda se o `userStore` avisar. **Decidido pelo agente, revisável:** a nova segue o endereço (o roteador avisa no fim de cada navegação), porque o destaque parado é um defeito da antiga e o código dela já diz querer o contrário («FIX: strict prefix matching»). Um estado do teste de «igual ao de antes» fica no endereço de partida (onde as duas coincidem); um teste a mais prova o destaque seguindo.
- **O sinal do Spotify não é loja:** `localStorage` + o evento `spotify-auth-change` na janela (sem objeto de estado, sem `subscribe`). Cada botão lê `isAuthenticated()` uma vez e a cada evento, e pede o perfil (`getUserProfile`, uma chamada por vez por botão). Na nova, cada botão é um componente com o mesmo comportamento e o ouvinte da janela desfeito ao sair (o de hoje nunca se desfazia: a cada redesenho da barra sobrava um).
- **A tela estreita:** `onPhoneChange`/`isPhone` (uma consulta de mídia), pelo `usePhone` da ponte. **O endereço:** `router.afterNavigate` (devolve o jeito de parar de ouvir) e `window.location.pathname` lido na hora. **O idioma:** `useLocale`.
- **Lojas novas, pequenas, sem regra:** `screenName` (o nome que uma tela dá para si, até a próxima tela: apagado no fim de cada navegação, como hoje), `loginWindow` (aberta ou não), `discogsNotice` (ligada ou não). São o jeito de uma tela antiga, no script principal, falar com a moldura sem importar `shell/` nem React (só `app.js` importa `shell/`).

## O que muda de lugar, e o que é o React

- O `app.js` monta tudo com **um** `startShell({ router, userStore, clearCaches })` (devolve o jeito de parar), no lugar de `initUI`, e é o único arquivo que importa `shell/`. **O `react-vendor` passa a ser baixado na abertura** (o script principal o importa): `bundle-budget.json` `reactAtStart: true`; o teto do script principal e o de «depois da primeira tela» refeitos; as telas do menu em React passam a ser baixadas em segundo plano pelo `prefetchScreensAfterTheFirstScreen` (sai de `KEPT_ON_PURPOSE`).
- Uma raiz de React para `#header-container`, uma para `#footer-container` e uma para a moldura do celular, que escreve por um portal direto no `body` (a barra do topo, a barra de abas e o botão, nessa ordem, os mesmos três filhos de hoje), só enquanto a tela é estreita.
- O menu e a pergunta de limpar o cache são `ui/SheetWindow` (motor da Folha de hoje; ganha `id` e rodapé, sem mudar o que já faz). A janela de entrar é um portal no `body` com as mesmas classes.
- Tudo que fecha por fora (menu da conta, menu de séries, gaveta) usa ouvintes no documento e na janela desfeitos ao sair da moldura; o teste-molde da onda 0 é refeito para a moldura (`startShell` e `stop` cinco vezes: zero ouvintes).

## Os textos

Cerca de 60 lugares de texto à mão (rótulos, a gaveta, a conta, a janela de entrar com os avisos, o menu do celular, o rodapé, as abas, os nomes de tela da barra do celular, a frase do Discogs). Inglês aberto, português fechado como nas ondas 1 e 2 (`i18n/en/shell.js`, `i18n/pt/shell.js`). O nome de quem entrou e de quem o Spotify diz ser vai como texto, nunca como HTML.

## O seletor de idioma

Não é desta onda construir o desenho dele (é da F81). Fica **o lugar**: na barra do computador, à direita, entre o grupo do Spotify e o da conta, e na linha do topo do menu do celular, acima da lista de lugares; vazio enquanto `OPEN_LOCALES` tem só `en`.

## O que a música toca aqui

O que a moldura mostra de serviço de música: o botão **Spotify** (conectar, desconectar com pergunta) e **entrar com a Apple** (a janela de entrar e o avatar da Apple na conta). **Não há botão de Apple Music na moldura**: a exportação para o Apple Music mora na tela das playlists (onda 2). Entrar com a Apple e com o Google precisa de conta e de janela do provedor: os testes e o navegador exercitam a nossa janela e a chamada do serviço (trocado por um falso), não o provedor.

## Os estados a conferir (a lista da prova de HTML igual)

Computador (1280): carregando; sem conta; entrou pelo Google; entrou pela Apple; visitante; o menu da conta aberto por clique, por teclado (seta) e fechado por fora e por Escape; o menu de séries aberto, em cada endereço (álbuns, playlists, «em breve»); a gaveta aberta (tela média), fechada pelo fundo, por um link, por voltar; a lista de séries da gaveta aberta; o Spotify desconectado, conectado com e sem o nome, a pergunta de desconectar; a janela de entrar, entrando, com erro de cada tipo, fechada; sair; o rodapé, limpar o cache (certo e com erro), a frase do Discogs ligada e desligada.
Celular (393): sem conta e com conta; cada aba atual; o nome dado por uma tela e apagado na seguinte; o menu aberto (sem conta e com conta); a pergunta de limpar o cache (cancelar, limpar, erro); «voltar ao topo» escondido e à mostra; a aba atual levando ao topo; virar computador e voltar; a janela de entrar (folha de baixo).

## Onde parou (atualizado ao fim da onda)

A onda 3 foi construída inteira (TASK-18 e TASK-19; a reconferência visual, TASK-32, é de quem não construiu). O que saiu diferente do mapa:

- **Duas diferenças de comportamento, de propósito, reveláveis:** a barra do computador segue o endereço (a antiga não seguia); a gaveta da tela média gira o chevron de «Music Series» (a antiga, por um `svg:last-of-type` que acha o primeiro ícone do botão, girava a nota). Cada uma tem seu teste; o resto da página é comparado letra a letra.
- **Uma coisa que a antiga não precisava e a nova precisa:** o React, quando um desenho tira o foco de um elemento, põe de volta a rolagem da página no valor daquele instante, o que **parava a rolagem suave do «voltar ao topo»** no meio quando o botão se escondia no caminho (visto no navegador, com um toque de verdade: parava em 1.409 px). O botão agora solta o foco antes de rolar; `Shell.carried.test.tsx` e o navegador cobrem. Vale para as ondas seguintes: um controle que se esconde sozinho durante uma rolagem suave.
- **Um defeito da antiga mantido de propósito:** depois de um erro ao entrar, o botão que foi tocado volta sem a sombra de passar o mouse (a antiga refazia o conteúdo do botão sem a caixa `absolute inset-0`); a nova faz igual.
- **Defeito da antiga NÃO mexido, fora do escopo:** o fundo da gaveta da tela média (`#mobileMenuOverlay`) tem o tamanho da barra e não da tela (a barra tem `backdrop-filter`, que vira a caixa de referência do `fixed`), então tocar ao lado da gaveta não a fecha, nas duas.
- **A janela de entrar já não se abre duas vezes** (a antiga empilhava uma por chamada; a nova é uma janela só).
- O seletor de idioma não foi construído (é da F81); o lugar está dito acima.
- `react-vendor` na abertura: `reactAtStart` verdadeiro; o script principal cresceu 4.147 B (294.753 B contra 290.606 B) e o primeiro carregamento ganhou os 68.691 B do React: ver `reports/evidence/F83/wave-3/bundle-budget-wave-3.txt` e `first-load` na mesma pasta.
