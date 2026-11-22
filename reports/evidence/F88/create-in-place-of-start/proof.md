# Prova no navegador: «Start» vira «Create» / «Criar», com um «+» (F88)

Branch `wip/create-in-place-of-start` contra `main` (`44137fb`). Os dois sites foram construídos com `vite build` e servidos por um servidor estático que responde as rotas fundas (`/start`, `/albums`, `/blend` -> `app.html`; `/home` -> `index.html`). Playwright de `MJRPpersonal`; as chamadas ao Firebase (`identitytoolkit`, `securetoken`, `firestore.googleapis`, `firebaseinstallations`) bloqueadas; sem login, sem chave, movimento reduzido ligado. Perfis: Chromium 1280x800, WebKit 1280x800, WebKit iPhone 393x852 e 375x667.

## O item

| Onde | main | branch |
|---|---|---|
| Menu do computador (`/start`, `/albums`, `/blend`) | Start | Create; leva a `/start`; na `/start` fica `cur` + `aria-current="page"` |
| Barra de baixo do celular (393 e 375) | ícone «Go» + «Start» | «+» + «Create»; leva a `/start`; ativo na `/start` |
| Home em português (computador e celular) | Inicie | Criar |
| Home em inglês | Start | Create |

Toque no item a partir de `/albums` (todos os 4 perfis): main e branch terminam em `/start`. Na home sem conta o item rola até a história (`#start`), igual nos dois (com conta ele vai a `/start`, como antes; não provado aqui: exige entrar).

## Caixa do item e vizinhos (medido)

- Computador: caixa do item `[330, 10, 124 x 52]` nos dois; «Create» cabe na mesma caixa. As caixas dos outros quatro itens e da barra: idênticas (0 deslocamento) em Chromium e WebKit, em todas as telas.
- Celular 393: item `[0, 777, 78,6 x 75]`; 375: `[0, 592, 75 x 75]`; ícone 24x24 nos dois, mesma posição, alvo de toque idêntico; vizinhos e barra sem deslocamento.

## Pixels fora da caixa do item (união da caixa de main e da de branch, +1 px)

| Perfil / tela | ruído main x main | main x branch | de onde vem a diferença |
|---|---|---|---|
| /start, /blend, Chromium e WebKit 1280 | 0 | 0 | nada |
| /albums, 1280 (Chromium 955, WebKit 1014) | 0 | 955 / 1014 | só o caminho de migalhas «Start ›» -> «Create ›» (`[54,136]-[188,169]`) |
| /blend 393 e 375 | 0 | 0 | nada |
| /start 393 (3655) e 375 (1849) | 0 | 3655 / 1849 | só o nome da tela na barra do topo (`[149,11]-[233,43]`): «Start» -> «Create» |
| /albums 393 (76865) e 375 (33140) | 0 | idem | só o botão do estado vazio «Go to Start» -> «Go to Create» (`[88..97,307]-[286..296,395]`) |
| home pt/en, todos os perfis | 82 a 4287 | 0 a 3555 | só a arte animada da história (a mesma faixa que o ruído main x main varre); a barra e o resto, iguais |

Ou seja: fora da caixa do item, o único que muda são os textos que NOMEIAM a tela (migalhas, nome no topo, botão do vazio), como pedido; mais nada se mexe, no computador ou no celular. O ruído da home (arte animada) é do próprio main (main x main) e do mesmo tamanho.

## Arquivos (antes e depois, main em cima, branch embaixo)

`desktop-start-header.png`, `desktop-home-pt-header.png`, `desktop-albums-breadcrumb.png`, `phone393-start-bottom.png`, `phone393-start-top.png`, `phone393-home-pt-bottom.png`, `phone375-start-bottom.png`, `phone375-albums-bottom.png`.

## Não provado

- A home com conta (item leva a `/start`): exige entrar; coberto só por teste unitário (`menuHref`).
- Safari de verdade no iPhone: só o perfil WebKit do Playwright.
- A home tem arte animada; o ruído impede a igualdade byte a byte da área da arte, não da barra nem do resto.
