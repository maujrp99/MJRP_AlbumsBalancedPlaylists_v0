# F79 · a Home que se explica · prova no navegador (2026-11-20)

**Ramo:** `feat/f79-home-that-explains-itself` · **onde:** servidor local deste ramo (Vite, `http://127.0.0.1:5079/home`), nunca produção · **referência:** `design/inception/home-transformar-v2.html`, aprovado pelo MJRP em 2026-11-20 (`docs/specs/info-arch.md` § Protótipos aprovados) · **quem conferiu:** o agente que construiu (não é a reconferência visual independente).

## Como foi feito

- Chrome sem janela pelo protocolo de depuração (`shoot.sh` + `shoot.mjs`, pela fila da máquina), 1280 x 900 e 393 x 852 (celular emulado), os 18 estados do protótipo (`#s=<id>`) e os mesmos 18 na Home construída, levada a cada estado pelo controlador que a página expõe (`window.controller`).
- **Duas costuras, só na página, só para a prova:** (1) o catálogo responde com a busca «Pink Floyd» que o protótipo capturou (`design/proposals/f79-home/build/capture.json`; os outros tipos — 15 singles, 5 ao vivo, 15 compêndios — são enchimento só para a contagem das fichas, escondidos pelo filtro); (2) **a série nunca é gravada**: `HomeController.writeSeries` é trocado por uma promessa que o script decide (gravada, pendente, falhou). Nada foi escrito no Firestore.
- A página entrou como visitante (o app faz o login anônimo do Firebase sozinho, como para todo visitante). Nos 17 estados que não são «Visitante», o aviso de visitante foi desligado na página, para comparar com o protótipo, que só o mostra no estado 18.
- Os pares lado a lado (protótipo à esquerda, construído à direita) foram montados por `pairs.py`.

## Os pares

| Estado (info-arch) | 1280 | 393 |
|---|---|---|
| Primeira visita `^home-empty` | [par](pairs/pair-empty-1280.jpg) | [par](pairs/pair-empty-393.jpg) |
| Digitando `^home-typing` | [par](pairs/pair-typing-1280.jpg) | [par](pairs/pair-typing-393.jpg) |
| Buscando `^home-searching` | [par](pairs/pair-scanning-1280.jpg) | [par](pairs/pair-scanning-393.jpg) |
| Discografia `^home-discography` | [par](pairs/pair-results-1280.jpg) | [par](pairs/pair-results-393.jpg) |
| Um álbum `^home-dock-one` | [par](pairs/pair-chosen1-1280.jpg) | [par](pairs/pair-chosen1-393.jpg) |
| Vários `^home-albums-chosen` | [par](pairs/pair-chosen-1280.jpg) | [par](pairs/pair-chosen-393.jpg) |
| Muitos `^home-dock-many` | [par](pairs/pair-many-1280.jpg) | [par](pairs/pair-many-393.jpg) |
| Mudando a ordem `^home-dock-reorder` | [par](pairs/pair-reorder-1280.jpg) | [par](pairs/pair-reorder-393.jpg) |
| Removido, com Undo `^home-dock-removed-undo` | [par](pairs/pair-removed-1280.jpg) | [par](pairs/pair-removed-393.jpg) |
| Colando uma lista `^home-paste-list` | [par](pairs/pair-paste-1280.jpg) | [par](pairs/pair-paste-393.jpg) |
| Lista adicionada, uma linha pulada `^home-paste-report` | [par](pairs/pair-pastereport-1280.jpg) | [par](pairs/pair-pastereport-393.jpg) |
| Artista não encontrado `^home-artist-not-found` | [par](pairs/pair-notfound-1280.jpg) | [par](pairs/pair-notfound-393.jpg) |
| O catálogo não respondeu `^home-catalog-error` | [par](pairs/pair-error-1280.jpg) | [par](pairs/pair-error-393.jpg) |
| Nome faltando `^home-name-missing` | [par](pairs/pair-noname-1280.jpg) | [par](pairs/pair-noname-393.jpg) |
| Criando `^home-creating` | [par](pairs/pair-creating-1280.jpg) | [par](pairs/pair-creating-393.jpg) |
| Criada `^home-created` | [par](pairs/pair-created-1280.jpg) | [par](pairs/pair-created-393.jpg) |
| Não deu para gravar `^home-create-failed` | [par](pairs/pair-createfail-1280.jpg) | [par](pairs/pair-createfail-393.jpg) |
| Visitante `^home-guest` | [par](pairs/pair-guest-1280.jpg) | [par](pairs/pair-guest-393.jpg) |

As capturas soltas estão em `shots/` (`proto-<estado>-<largura>.jpg`, `built-<estado>-<largura>.jpg`).

## O que se viu

- **Igual ao protótipo** (olhado par a par nos estados empty, scanning, chosen, many, reorder, paste, pastereport, created, noname, error e guest a 1280, e empty, chosen, reorder, removed, paste, created e createfail a 393; os outros 15 pares estão gravados e não foram olhados um a um): leiaute, texto, o fogo num botão só, o equalizador, as fichas, a capa numerada, a base, o painel com ↑ ↓ ✕ e a linha movida marcada, a folha do celular, a faixa verde depois de criar.
- **Diferenças, e por quê:**
  - «Muitos»: o protótipo mostra 13 álbuns («Added 13 albums», «Add the other 4»); a construção chega lá por «Add all» com a série vazia, e por isso mostra 17 («Added 17 albums», «+10»). O comportamento é o mesmo; os números são os do caminho real.
  - A folha do celular fecha pelo botão da própria Folha (✕, «Done» para o leitor de tela), não pelo «Done» em texto do protótipo (decidido pelo agente — revisável; a Folha `full` do design system tem o fechar sempre à vista).
  - A lista colada é editável linha a linha (um campo por linha); no celular as linhas ficam um pouco mais altas que no protótipo, porque cada uma é um campo de 16 px (o iPhone não amplia).
  - «Não deu para gravar» no celular: a captura mostra «Not saved: try again»; o protótipo diz «Not saved: the connection dropped». Corrigido depois da captura: a barra diz «Not saved: the connection dropped» quando a falha é de rede e «Not saved» nas outras (a captura não foi refeita).
  - As capas dos álbuns que vêm da lista colada mostram a capa substituta do app (o disco cinza); o protótipo desenhava iniciais. É o que o app faz para um álbum sem capa (F70).
- **Medido no navegador (painel do Claude, mesma página):** a 1280 x 900, na primeira visita o campo termina em y = 410 e «Create series» em y = 869 (à vista); com quatro álbuns, «Create series» termina em y = 832. A 393 x 852: a barra de ação tem 64–66 px, «Create series» tem 48 px e termina em y = 789, o campo começa em x = 16, nenhum botão ou campo do app abaixo de 44 px, nenhuma rolagem lateral (largura da página 393). A 1280 o campo de texto do artista media 22 px de altura dentro da caixa de 64 px: passou a ocupar a altura da caixa (a captura é de antes desse ajuste, que não muda o que se vê).

## O que a prova por testes cobre (e o navegador não)

- **Criar a série de verdade** não foi feito no navegador (escreveria no Firestore de produção; o projeto não tem emulador). Está provado por `test/controllers/HomeController.create.test.js`, com o serviço trocado: o nome e os álbuns na ordem da série chegam a `createSeries({ name, albumQueries, status: 'pending' })`; «Blend it now» abre `/blend?seriesId=<id>`; «Open the series», `/albums/<id>`; a falha de rede e a outra dizem coisas diferentes; com o nome vazio nada é criado.
- A edição de série (a mesma peça de escolher álbuns): `test/components/series/SeriesEditModal.test.js` e `test/architecture/oneAlbumPicker.test.js`, verdes. **Não foi aberta no navegador.**
- `prefers-reduced-motion`: provado pelo CSS (`test/components/home/HomeMotion.test.js`); não foi emulado no navegador.

## O que não foi conferido

- Um aparelho de verdade, o Safari, o toque (só larguras emuladas no Chrome).
- A Home com uma conta de verdade (só visitante), e a busca no catálogo de verdade (a resposta foi a capturada pelo protótipo).
- O tempo real das esperas (busca, gravação).
- A reconferência visual independente (o projeto não declara `sensors.visual`; ver o relatório da F79).
- A página publicada: nada foi para produção.

## Depois da reconferência visual independente (2026-11-21)

A reconferência (`reports/audits/2026-11-20-F79-visual-parity-recheck.md`, juiz separado, `fail` sem P0: 2 P1, 7 P2) foi lida inteira; o relatório dela não foi tocado. O que mudou, cada um com o teste escrito antes (`test/components/home/HomeRecheckShapes.test.js`, que falhou antes da correção, e asserções novas em `HomeController.bulk.test.js` e `HomePhone.dock.test.js`):

- **P1-1 · a lista colada.** A causa: a regra do campo do artista (`.home-field input`, Syne 18/600) alcançava as linhas da lista, que também são campos dentro da mesma caixa. Agora ela vale só para o campo do artista (`.home-field > input`). As linhas estão em Syne 15/400 a 1280 e na fonte de texto 16/400 a 393, como no protótipo. A linha que ficou para corrigir aparece como o protótipo a mostra: Syne 18/600 direto sobre a faixa vermelha, sem caixa contornada (a fonte de texto 16/600 a 393). «Added 2 albums.» está em negrito. Pares refeitos: `pairs/pair-paste-1280.jpg`, `pair-paste-393.jpg`, `pair-pastereport-1280.jpg`, `pair-pastereport-393.jpg`.
- **P1-2 · a barra do celular em «Criando».** O mini equalizador fica na linha de «Saving your series…». A regra do celular para o equalizador grande (margem de 14 px, 22 px de altura) passava por cima da dele; a barra não cresce mais. Par refeito: `pairs/pair-creating-393.jpg`.
- **P2-2 · «Not saved: the connection dropped»** aparece inteiro, em duas linhas, como no protótipo (`pair-createfail-393.jpg`).
- **P2-3 · a última linha colada no celular:** a linha ganhou espaço para o texto e termina em «…» quando não cabe (`pair-paste-393.jpg`). O contorno laranja da caixa nesse estado é o do foco: a lista recebe o cursor ao abrir. Ficou assim por decisão.
- **P2-6 · a segunda fileira de capas sob a base (computador).** O ano agora corre na linha do cartão (inline), como no protótipo. O cartão voltou aos 243 px de altura. Medido no mesmo estado («Vários», 1280 x 900) nos dois lados: a capa da segunda fileira vai de y = 694 a 868 e o título de y = 878 a 896, iguais ao protótipo (antes, 688 e 872). Pares refeitos: `pair-chosen-1280.jpg`, `pair-created-1280.jpg`, `pair-noname-1280.jpg`.
- **P2-1 · a Folha do celular.** O cabeçalho diz «Your series» com a contagem «4 albums» mais clara ao lado, como no protótipo. Os títulos dos álbuns ficam em uma linha, com «…». O fechar continua sendo o ✕ da Folha (decisão de antes). Pares refeitos: `pair-reorder-393.jpg`, `pair-removed-393.jpg`, `pair-noname-393.jpg`.

**Deixado como está, de propósito:** os números de linha da lista e o aviso de Undo do celular na fonte de texto do sistema (P2-4, a decisão declarada sobre os algarismos), e as fichas do celular («Compendiums · 15» numa linha, P2-5). O P2-7 (o sensor visual do projeto) é do contrato, não da tela.

**Não refeito:** os outros pares (os estados que as correções não tocam) continuam os da primeira prova.
