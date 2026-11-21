---
type: ux-audit
subject: "Reconferência visual independente da F79 «A Home que se explica»: a Home construída contra design/inception/home-transformar-v2.html, 18 estados, 1280 e 393"
project: mjrpalbumblender-v0
feature: F79
moment: delivery
date: "2026-11-21 00:02"
judged: "2026-11-21 00:02"
judged_commit: 1d875bc
who_judged: separate-agent
verdict: fail
p0: 0
p1: 2
p2: 7
human_decisions: 1
status: open
---

# Reconferência visual da F79 — a Home que se explica

**Veredito: não passa (`fail`), sem P0: 2 P1 e 7 P2.** A Home construída bate com o protótipo aprovado no leiaute, no texto, no fogo, no equalizador, na base da série, no Undo e no depois de criar, nas duas larguras. Ela se afasta em dois pontos visíveis: **a tipografia da lista colada** (as linhas maiores e em negrito; a linha pulada sem o negrito do Syne, dentro de uma caixa contornada) e **a barra de ação do celular em «Criando»** (o mini equalizador cai para uma linha própria e a barra cresce). Pela regra do portão, `fail` com `p0: 0` pode ir para a `main`. Cada divergência volta para a F79, e o MJRP decide cada uma.

## Como foi feito

- **Quem julgou:** um agente que não implementou a F79 nem as correções dela (pedido do orquestrador, via padrão).
- **O objeto:** o ramo `feat/f79-home-that-explains-itself` no último commit de tela, `1d875bc`, servido pelo Vite deste worktree (`npx vite --port 5185 --host 127.0.0.1`), como visitante. Nada foi gravado no Firestore: a escrita da série foi trocada na página por uma promessa do script, como na prova do implementador, e nenhuma série foi criada.
- **A referência:** `design/inception/home-transformar-v2.html` (`reference_kind:: live`), aprovada pelo MJRP em 2026-11-20. Os 18 estados são os do `shows::` em `docs/specs/info-arch.md` § Protótipos aprovados.
- **Condições:** Chrome headless a 1280 x 900 e a 393 x 852 (celular emulado), tema escuro (a única paleta do app).
- **As capturas foram refeitas** sobre o código atual. Os scripts do implementador (`reports/evidence/F79/shoot.sh` e `shoot.mjs`) foram reaproveitados sem mudança. Isso inclui as duas correções que vieram depois das capturas dele: o «Not saved» do celular e o campo do artista ocupando a caixa. Resultado: **36 pares, todos olhados um a um**, em `reports/evidence/F79/recheck/pairs/`. As capturas soltas estão em `recheck/shots/`.
- **Os fatos medidos:** o kit `mjrp-scripts/visual_parity/` **não pôde rodar**. O contrato não declara `sensors.visual`, não há `visual.config.mjs` e o Playwright não está no `node_modules`. Isso é o A2 do doctor, já conhecido. No lugar dele rodei, nos 72 cenários e nos dois lados, um coletor de fatos meu, pelo mesmo protocolo de depuração (`recheck/facts.mjs` → `recheck/facts.json`): o Syne carregado (`document.fonts`), o título, os botões com o degradê do fogo à vista, a rolagem lateral e os textos à vista. Um segundo coletor (`recheck/fonts2.mjs`) mediu a família, o tamanho e o peso das linhas da lista colada, dos números e do aviso de Undo. Recortes ampliados em `recheck/zoom/`.
- **A janela de editar a série**, que usa a mesma peça de escolher álbuns, foi aberta no navegador. Usei uma série falsa montada na página (`recheck/editmodal.mjs`): nada foi salvo, nem «Save Changes» foi clicado. Ela foi aberta a 1280 e a 393, com a discografia carregada e rolada até o fim (`recheck/edit-modal/`).

## O que bate (medido e olhado)

- **Syne carregado** nos 72 cenários, nos dois lados (`document.fonts.check('700 32px Syne')` verdadeiro; as faces 400, 700 e 800 `loaded`). O título «Pick the albums. / We blend the playlists.» tem a mesma face, o mesmo tamanho e o mesmo degradê.
- **O fogo:** os botões com o degradê à vista são **idênticos nos 36 pares**, estado por estado. Há um botão de ação com fogo por estado: «Search» → «Searching…» → «Create series» → «Creating…» → «Blend it now» / «Try again»; «Add 3 albums» na lista. No computador há ainda o «Sign In» do topo, igual nos dois lados. Na Folha do celular aparecem dois «Create series», o da Folha e o da barra por trás, também iguais nos dois lados.
- **O equalizador nos três estados:** parado (barras altas), buscando (traços baixos e vivos) e erro (traços apagados), iguais a 1280 e a 393.
- **A base da série (computador) e a barra de ação (celular):** «Your series is empty» e «No albums yet», o nome sugerido com «suggested · edit it», a contagem «N albums from 1 artist · the order counts», «Edit order», «Next: the Blend turns the series into playlists.», as capas numeradas com o mesmo número (sistema 19 px, peso 800, nos dois lados), «+N» no «Muitos».
- **Undo:** «Added N albums. Undo» e «Removed «…». Undo» na mesma posição e na mesma forma, a 1280 e a 393.
- **Depois de criar:** a faixa verde «… is saved and won't change here», «Open the series», «Blend it now», «Start another series», iguais. No celular, o nome cortado (««Pink Fl…») aparece cortado também no protótipo.
- **Os demais estados:** digitando, artista não encontrado, catálogo sem resposta, nome faltando (computador), criando (computador), falhou (computador) e visitante batem.
- **Nenhuma rolagem lateral** em nenhum dos 72 cenários.
- **A janela de editar a série não está quebrada:** cabeçalho, nome, lista com ✕, a busca com «Scan», as fichas «Studio (17)»… «Other» e a grade com títulos e anos. O rodapé «Cancel» / «Save Changes» fica preso, não há rolagem lateral e o fim da lista é alcançável, nas duas larguras.

## Os achados

### P1

**P1-1 · A lista colada: a tipografia das linhas difere do protótipo e a linha pulada perde a forma.** Âncoras: `^home-paste-list` e `^home-paste-report`.
- Colando (`#s=paste`): as linhas do protótipo usam **Syne 15 px, peso 400** a 1280 e **sistema 16 px, peso 400** a 393. As construídas usam **Syne 18 px, peso 600** a 1280 e **sistema 16 px, peso 600** a 393. Ficam maiores e em negrito, com linhas mais altas (36 px a 1280 e 44 px a 393), e a caixa inteira fica cerca de 50 px mais alta no celular.
- Lista adicionada (`#s=pastereport`): no protótipo a linha pulada é o texto em **Syne 18 px, peso 600**, sobre a faixa vermelha. Na construção ela é um **campo contornado de branco, em sistema 16 px, peso 400**, dentro da faixa. «Added 2 albums.» perde o negrito (no protótipo, `<b>` Syne 14 px, peso 700).
- É a forma invertida nos dois estados: negrito onde o protótipo é leve, leve onde ele é negrito. A lista editável linha a linha foi uma decisão declarada e, como comportamento, se sustenta. Mas a tipografia não decorre dela: um campo pode ter a face, o tamanho e o peso do protótipo. A entrada do log do implementador diz «a linha colada sem negrito», e a medição mostra peso 600 nas duas larguras.
- Evidência: `recheck/pairs/pair-paste-1280.jpg`, `pair-paste-393.jpg`, `pair-pastereport-1280.jpg`, `pair-pastereport-393.jpg`, `recheck/zoom/z-paste.jpg`, `recheck/zoom/z-pastereport.jpg`; as medições vêm de `recheck/fonts2.mjs` e estão transcritas acima.
- Dono: o implementador da F79 (`public/js/components/home/HomePasteList.js` e o CSS da Home).

**P1-2 · Celular, «Criando»: o mini equalizador cai para uma linha própria e a barra de ação cresce.** Âncora: `^home-creating` (393).
- No protótipo, a barra mantém a altura: o mini equalizador fica na mesma linha de «Saving your series…», e «Tap to edit or reorder» vem logo abaixo. Na construção, «Saving your series…» fica sozinho, desalinhado para a direita, o equalizador vai para uma terceira linha, e a barra sobe cerca de 18 px (o topo passa de cerca de y 760 para cerca de y 742). Ela cobre mais da grade e salta de altura no momento do toque.
- A 1280 o mesmo estado bate.
- Evidência: `recheck/pairs/pair-creating-393.jpg`, `recheck/zoom/z-creating.jpg`.
- Dono: o implementador da F79 (`HomeDock.js` e `public/css/mobile/home.css`).

### P2

- **P2-1 · A Folha da série no celular** (`^home-dock-reorder`, `^home-dock-removed-undo`, `^home-name-missing` a 393). É a decisão declarada de fechar com ✕ em vez de «Done». O cabeçalho vira «Your series · 4 albums» em Syne, com a contagem no mesmo peso, onde o protótipo tem «Your series» mais «4 albums» apagado e o botão «Done». O nome da série fica maior. Os títulos dos álbuns quebram em duas linhas («The Endless / River (Deluxe…»), onde o protótipo corta em uma linha com reticências; as linhas ficam mais altas e a lista, mais longa. O fecho pelo ✕ da Folha do design system se sustenta no mérito. O que diverge é o cabeçalho e a quebra dos títulos. Evidência: `pair-reorder-393.jpg`, `pair-removed-393.jpg`, `pair-noname-393.jpg`.
- **P2-2 · Celular, «Não deu para gravar»** (`^home-create-failed`, 393). A barra corta «Not saved: the connection …» com reticências, e o protótipo quebra em duas linhas e mostra o motivo inteiro («dropped»). O texto ficou certo depois da correção, mas o motivo não se lê. Evidência: `pair-createfail-393.jpg`, `recheck/zoom/z-createfail.jpg`.
- **P2-3 · Celular, lista colada: a última linha cortada sem reticências.** «Caravan - In the Land of Grey and Pin» é cortado seco dentro do campo, onde o protótipo mostra a linha inteira. A caixa aparece com o contorno laranja de foco, que o protótipo não tem nesse estado. Evidência: `pair-paste-393.jpg`.
- **P2-4 · Os números de linha e o aviso de Undo em fonte do sistema** (decisão declarada). Os números de linha da lista colada usam sistema 12 px no lugar do Syne 12 px do protótipo, a 1280. O aviso «Added 17 albums.» do celular usa sistema 14 px no lugar do Syne 14 px, então os algarismos perdem o desenho do Syne. É um detalhe pequeno, mas é uma troca de face num papel que o design system dá ao Syne. As capas numeradas não entram nisso: lá os dois lados usam sistema 19 px, peso 800. Evidência: `recheck/zoom/z-toast.jpg`, `recheck/facts.json`.
- **P2-5 · Celular, as fichas da discografia.** «Compendiums · 15» cabe numa linha, onde o protótipo quebra em duas. A fileira de fichas fica cerca de 4 px mais baixa, e «17 studio albums · newest first» fica um pouco maior. A construção é até mais limpa, mas a forma difere. Evidência: `pair-results-393.jpg`, `pair-chosen-393.jpg`.
- **P2-6 · Computador, a borda da base sobre a segunda fileira.** Com álbuns escolhidos, os títulos da segunda fileira de capas ficam meio escondidos sob a base, com o ano à vista logo abaixo dela. No protótipo, o título aparece inteiro abaixo da base. É uma diferença de poucos pixels no deslocamento da grade. Evidência: `pair-chosen-1280.jpg`, `pair-created-1280.jpg`.
- **P2-7 · O sensor visual do projeto não existe** (processo, não tela). Sem `sensors.visual` no `.mjrp-project.yml`, sem `visual.config.mjs` e sem Playwright, a metade «sensor» desta reconferência foi feita por um coletor improvisado, não pelo kit. As regras do kit (fontes, tokens, texto espremido, transbordo por componente) não rodaram. Dono: o contrato do projeto (`mjrp-pdlc-bootstrap` / quem fecha o A2 do doctor).

### Diferenças julgadas como não divergência

- **«Muitos» com 17 álbuns em vez de 13** (decisão declarada): **falso positivo de dado.** A forma é a mesma: o aviso de Undo, «+N» e o nome «Pink Floyd, the …». Os números e as capas a mais vêm do caminho real («Add all» com a série vazia). Por isso o botão «Add the other N» some e a grade sobe, como o app deve fazer quando nada resta para adicionar.
- **As capas dos álbuns colados**: o disco cinza do app no lugar das iniciais do protótipo. O protótipo avisa na própria tela que as capas ali são substitutas, e o disco é o substituto único do app (F70). Não é divergência.
- **A lista colada editável, um campo por linha** (decisão declarada): o comportamento é aceito no mérito. O que diverge é a tipografia, e isso está no P1-1.
- **A Folha fecha pelo ✕** (decisão declarada): aceita no mérito, por ser o fechar da Folha `full` do design system. O cabeçalho e a quebra dos títulos estão no P2-1.
- **O que o coletor de textos acusou** («only proto» / «only built»): são diferenças de estrutura do DOM entre o protótipo e o app (folhas de texto contadas em níveis diferentes). Olhei cada caso nos pares e nenhum é texto faltando ou sobrando na tela.

## Issues

**Nenhuma issue foi aberta em `docs/specs/uat.md` nesta passada**, por instrução explícita do orquestrador («commit ONLY the report (and its captures)»). Pela skill, cada divergência confirmada viraria agora uma issue `bug`, com `fixing (F79)`, `Reportado por` `juiz` e `**Aberta por:** agente (juiz da F79)`. **Isto fica pendente para quem orquestra**: os P1-1, P1-2 e os P2-1 a P2-6 acima, cada um já com «o que acontece», «o que deveria», «como ver» e a evidência. O P2-7 é do contrato, não da tela.

## O que fica com o humano

- **1 decisão:** se a lista colada deve ter a tipografia do protótipo (o caminho deste relatório) ou se a forma nova, maior e em negrito, fica como está. O mesmo vale para o cabeçalho da Folha (P2-1).

## O que não pôde ser conferido

- **O kit de paridade visual** (P2-7): nenhuma das regras dele rodou. Os fatos vieram de um coletor improvisado, e o peso do julgamento ficou com os olhos.
- **Safari, WebKit, um aparelho de verdade e o toque:** só o Chrome com as larguras emuladas.
- **Uma conta de verdade** (só visitante) e **o catálogo de verdade:** a resposta foi a captura do protótipo, trocada na página.
- **Criar a série de verdade:** não foi feito, para não escrever no Firestore de produção. O estado «criada» é o da página, com a escrita trocada.
- **As animações e o tempo real** (o equalizador em movimento, o Undo sumindo em 8 s): só quadros parados.
- **A janela de editar a série** foi aberta com uma série montada na página, não com uma série real da conta. Ela não tem par de referência, porque não está no protótipo aprovado: julguei só se está inteira. No computador, a lista dela não tem ↑ ↓ e no celular tem. Não comparei com a `main` para saber se isso já era assim antes.

## Como rodar de novo

```sh
npx vite --port 5185 --host 127.0.0.1 --strictPort          # no worktree do ramo
sh reports/evidence/F79/shoot.sh reports/evidence/F79/recheck/shots http://127.0.0.1:5185
python3 reports/evidence/F79/pairs.py reports/evidence/F79/recheck/shots reports/evidence/F79/recheck/pairs
# os fatos: no shoot.sh, trocar shoot.mjs por recheck/facts.mjs ou recheck/fonts2.mjs, com outra porta de depuração
```
