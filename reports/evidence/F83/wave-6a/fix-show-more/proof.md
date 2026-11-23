# F83 onda 6a, correção dos dois achados do juiz independente: «Mostrar mais 50» com os valores ligados, e «No value yet» em um só nó de texto

Sites CONSTRUÍDOS, esta ponta (`claude/f83-wave-6a-fix-show-more`) contra o pai à mão (`12f0234`, a construção que o juiz usou), com **os valores do Discogs LIGADOS**: o servidor de valores do próprio app respondido por um roteiro (`/api/value-sources` ligado, `/api/exchange-rates`, `/api/album-value`), os itens com leituras do Discogs de cada tipo, valores escritos e itens nunca lidos. Servidor estático próprio com a regra da hospedagem (`/inventory` responde `app.html`). Firebase bloqueado (`identitytoolkit`, `securetoken`, `firestore.googleapis`, `firebaseinstallations`); nenhuma chave escrita. Playwright emprestado de `MJRPpersonal`. A costura dos itens é a do §15 do `wave-lessons.md`.

## Achado 1 (bloqueante): a página pulava para o fim do pedaço novo

**Correção escolhida: a chave do aviso** (`Inventory.tsx`: `<p className="inv-discogs-notice" key={`notice.${bridge.gridKey()}`}>`), em vez de `overflow-anchor: none` ou de mover o aviso para dentro da caixa. Porquê: a tela antiga refazia o aviso a cada desenho; com a mesma chave da caixa ele é refeito quando a caixa é refeita, e isso devolve o comportamento do pai sem tocar no DOM, nas classes nem no CSS (o aviso continua irmão da caixa, depois dela; mover para dentro mudaria o DOM e a ordem dos filhos; `overflow-anchor: none` seria uma regra nova que o pai não tem e que valeria também para outros usos do aviso). O prefixo `notice.` é necessário: a caixa e o aviso são irmãos e **uma `key` repetida entre irmãos faz o React duplicar os filhos** (os dourados acusaram na primeira tentativa).

Teste que falha antes (`test/screens/inventory/Inventory.showMore.notice.test.js`): com os valores ligados, na lista e na galeria, depois de «Show 50 more» a caixa e o aviso são elementos novos, o aviso continua com a classe `inv-discogs-notice` e vem logo depois da caixa. Vermelho sem a chave, verde com ela.

Rolagem depois de tocar em «Show 50 more» (rolar até o fim da página, ou até o botão, e tocar), pai contra ponta, 60 e 130 itens, lista e galeria: **24 de 24 iguais no Chromium** (393, 820, 899 × 60 e 130 itens × lista e galeria × dois jeitos de rolar) e **8 de 8 no WebKit iPhone 14** (`more-chromium.json`, `more-webkit.json`). A rolagem, as linhas desenhadas, o foco dentro da tela e a presença do aviso são iguais; a rolagem não se mexe com o toque:

| Chromium | lista (60 e 130 itens) | galeria (60 e 130 itens) |
|---|---|---|
| 393 | pai 5.299, ponta 5.299 | pai 8.341, ponta 8.341 |
| 820 | pai 5.283, ponta 5.283 | pai 6.963, ponta 6.963 |
| 899 | pai 5.267, ponta 5.267 | pai 7.395, ponta 7.395 |

**O controle:** o mesmo roteiro contra a construção do juiz (sem a correção) falha: lista 393 com 60 itens, pai 5.299 contra 6.321; galeria, pai 8.341 contra 9.984 (`more-control-unfixed-build.json`). Sem esse controle a prova não valeria: ela vê o defeito e vê a correção.

## Achado 2 (menor): «No value yet» em dois nós de texto

Correção (`CardValue.tsx`, `RowValue`): o texto e o espaço depois dele viram **um nó só** (`{`${text} `}`), como no HTML antigo; o mesmo para a linha do Discogs (o último pedaço leva o espaço) e, onde não há ligação para a edição, «CD · Discogs · tipo» é um nó só (o HTML antigo escrevia um; o mesmo para a linha de origem do cartão, «Discogs · data»). Onde há ligação, o `<a>` continua separando os pedaços, como antes. Procurei o mesmo padrão em `screens/inventory/`: os outros `{' '}` (`Totals.tsx`, `Notices.tsx`, `CardValue.tsx:114`) ficam entre **elementos irmãos**, onde o HTML antigo também tinha o espaço como nó à parte; não mexi.

Testes que falham antes (mesmo arquivo): «No value yet» é um nó de texto e depois o `<strong>`; a linha do Discogs termina em um nó com o espaço; sem ligação, a linha da lista é um nó só e o pedaço de origem do cartão é um só.

Prova no navegador (Chromium, computador, lista): os nós de texto de 12 linhas da lista com valores de todo tipo são **iguais aos do pai** (`nodes.mjs`: 12 de 12; antes da segunda parte da correção, as linhas do Discogs sem ligação tinham 3 nós contra 1). Pixels contra o pai, estados de lista com valores ligados: 1280 «list» e «list remembered» **0 pixels**; 900 «list», «list remembered», «search no match list» **0 pixels**.

Resto que **não** é zero e que não é destes achados (mesmos números do relatório do juiz, ou ruído de relógio e de animação): «list full page» a 1280 (a faixa do rodapé com o relógio, que o juiz mediu também pai contra pai, e o botão de trocar de vista que fica em destaque depois do clique na captura de página inteira, 4.505 px); 1/255 em algumas bordas depois de mudar uma ordem ou um formato (as listadas pelo juiz); «update values running» (animação). Nenhuma é de texto ou de caixa: textos, caixas, altura, rolagem, foco e chamadas ao servidor iguais em todos os estados (as comparações que não são de imagem: zero falhas).

## O que não está provado

- A passada inteira do computador (42 estados) foi feita com a primeira versão da correção do achado 2; depois dela só os estados de lista foram repetidos. O resto do código não mudou.
- O dedo real num Android: o juiz usou o perfil de iPhone 14 do Chromium com toque (`tap`); usei o mesmo.
- O pai foi a construção que o juiz deixou (`12f0234`), não reconstruída por mim.

## Sensores da ponta

Suíte inteira pela fila: 364 arquivos, 4.772 testes, todos verdes (inclui `test/architecture`, 43 arquivos, e `noSecretsInRepo`); `typecheck` sem erro e `lint` 0 erros e 68 avisos (os de antes); build dentro do teto (primeira tela 303.415 B, teto 313.842 B).
