# F79 · A tela Create no computador, enxuta — prévia

**Data:** 2026-11-22 · **Feature:** `docs/specs/features/F79-home-that-explains-itself/` · **Origem:** a tela enxuta do celular (UAT-281), aprovada hoje · **Ramo:** `wip/f79-create-lean-on-the-computer` (desenho; não é construção)
**Pedido do MJRP:** «podemos aplicar na sessão create o mesmo conceito de lean da versao mobile?»

**Arquivos:** comparador `comparator.html` (abre em «Hoje» ao lado de «Enxuta», primeira visita, sem conta) · gerador `build/` (reuso do gerador do celular, `design/proposals/f79-start-lean/build/`: `capture.mjs` captura a tela real de `main` a 1440 × 900; `build.py` aplica a proposta por cima da marcação e do CSS de hoje; `check.mjs` conta as palavras e confere os alvos; `shoot-comparator.mjs` passa por todo estado do comparador) · `caps/` (`counts.json` e duas capturas da primeira visita a 1280). A captura bruta (vários MB) e as telas soltas não vão ao git: refazem-se com Vite em 5582, Chrome em 9582 e `F79C_RAW=<pasta> node build/capture.mjs && python3 build/build.py`.

## Como foi feita

Igual à prévia do celular: a tela de hoje capturada do código de `main` (Chrome, 1440 × 900), com e sem conta, em oito estados; capas de exemplo (o catálogo respondeu um conjunto fictício); conta de teste escrita no navegador; Firebase Auth, Firestore, instalações e todo host de fora bloqueados. «Enxuta» é **a mesma marcação e o mesmo CSS**, com as mudanças por cima, todas dentro de `@media (min-width: 900px)`: o celular não muda. Mostrada a 1280 × 800 e 1440 × 900.

## O que muda

| | Hoje | Enxuta — **recomendada** | Variante: os três passos numa linha discreta |
|---|---|---|---|
| Título | 52 px, duas linhas | igual | igual |
| Frase da série | na tela | sai; o link «What is a series?» a abre **no mesmo lugar**, sob o título (segundo clique ou Esc fecha) | igual à Enxuta |
| Sob o campo | «Type an artist to see their albums, or paste a list of albums from many artists.»; ao digitar, «Press Enter or Search…» | só o link «or paste a list» (na lista, «Search an artist instead»); some no «não encontrado» | igual |
| Texto de dentro do campo | «An artist, or paste a list of albums» | «Type an artist» (o do celular) | igual |
| Três passos | três caixas na primeira visita | saem | ficam, com as palavras de hoje, numa linha baixa sob o equalizador, sem caixas |
| Barra da série | sempre, vazia antes da primeira capa | só com a primeira capa (ou depois de criar) | igual |
| Aviso sem conta | na barra vazia | vem com a barra, só com álbuns | igual |
| A tela vazia | — | antes da busca, o conjunto desce um pouco (`padding-top` cresce com a altura da janela); a luz do fogo e o equalizador vão junto | igual |
| Celular | — | nada muda | nada muda |

**Por que abrir a frase no lugar, e não num balão:** o sistema de desenho não tem balão (popover); no computador a folha vira janela, pesada para 24 palavras. Abrindo no lugar, nada cobre o campo e, aberta, a tela fica igual à de hoje. É só um link com `aria-expanded`.

**Palavras novas:** nenhuma. «What is a series?», «or paste a list» e «Type an artist» já foram aprovadas no celular. Saem do computador: a frase sob o campo, a frase ao digitar, «Paste or type one album per line.», os passos (na Enxuta) e o texto da barra vazia.

## As palavras da primeira tela (sem o menu do topo)

A mesma régua do celular (`reports/research/2026-11-21-copy-volume-ruler.md` § 6). Para tela de trabalho no computador: alvo 60, teto 100.

| | 1280, com conta | sem conta | 1440, com conta | sem conta |
|---|---|---|---|---|
| Hoje | 104 | 124 | 104 | 124 |
| Enxuta | 16 | 16 | 16 | 16 |
| Variante | 42 | 42 | 42 | 42 |

O menu do topo soma mais 6 ou 7. Hoje passa do teto nas quatro medidas; a Enxuta fica igual ao celular.

## O que a construção mexe (feita duas vezes)

**No código de hoje (`main`):**

| Arquivo | O que muda |
|---|---|
| `public/js/views/HomeView.js` | `drawHint`: o ramo do celular vale para as duas larguras (só o link); `renderStage`/`drawStage`: o texto de dentro do campo «Type an artist» nas duas; «What is a series?» no computador vira o botão que mostra e esconde o parágrafo (`aria-expanded`), no celular continua abrindo a folha; `drawSeries`: `is-barless` sem a condição do celular; `drawResults`: `#homeHow` não aparece mais |
| `public/js/components/home/HomeDock.js` | `computerDock`: nada quando `barShows` diz que não (como `phoneDock`) |
| `public/js/models/homeSeries.js` | `phoneHintLink` e `guestNoticeShows` deixam de ser só do celular (renomear, ex. `hintLink`); `dockEmptyNote({ phone: false })` deixa de ser usada |
| `public/css/views/home.css` | `.home-what` visível no computador, com o estilo de link; `.home-hero p` escondido até abrir; `.home-page.is-barless` com menos espaço embaixo; `padding-top` maior no palco antes da busca; `.home-how` sai (ou vira a linha da variante) |
| testes | os testes da regra da barra e do link passam a valer nas duas larguras; `phoneStylesStayOnThePhone` continua passando |

**Na linha da migração (`integrate/staging-2026-11-21`, React):** `public/js/screens/start/Stage.tsx` (`Hint` e `hintShows` sem o desvio do computador; `What` também no computador, abrindo no lugar; o placeholder), `Results.tsx` (`#homeHow` fora), `Dock.tsx` (`ComputerDock` com `barShows`), `homeSeries.ts` (a mesma regra), `public/js/i18n/en/start.js` e `pt/start.js` (as chaves `start.hint.artist.*`, `start.hint.typing`, `start.hint.paste.before`, `start.field.placeholder`, `start.how.*` e o texto da barra vazia ficam sem uso), e o mesmo `home.css`.

## O risco

1. **Uma tela grande quase vazia.** Num monitor de 1440 × 900, a Enxuta ocupa a metade de cima; embaixo fica preto. Como preenche: com nada novo. O conjunto desce para perto do meio, a luz do fogo vai junto e o equalizador fecha o bloco. Num monitor maior (não visto) o vazio cresce; se incomodar, a variante põe uma linha ali.
2. **Quem chega pela primeira vez** só vê como juntar álbuns depois de buscar (o «+» nas capas, a barra que surge). No computador isso pesa menos que no celular (as capas são grandes e o «+» aparece no primeiro resultado), mas é o mesmo risco já aceito no celular. A variante é a resposta, se ele pesar.

## Perguntas para o MJRP

1. **Enxuta ou a variante (os passos numa linha discreta)?** Recomendo a **Enxuta**: é o mesmo conceito que você aprovou no celular, as duas telas ficam iguais, e o «+» das capas ensina o caminho.
2. **«What is a series?» abre a frase no lugar (sob o título) ou na janela do app?** Recomendo **no lugar**: nada cobre o campo e não entra peça nova no sistema de desenho.
3. **O texto de dentro do campo vira «Type an artist», como no celular?** Recomendo **sim**: o link «or paste a list» logo abaixo já oferece a lista, e a frase de hoje fica cortada repetindo isso.

## O que não pude conferir

- Monitores maiores que 1440 × 900, e Safari ou Firefox: só o Chrome.
- O catálogo real: capas e discografia de exemplo; a conta é de teste.
- Uma crítica de UX separada (`mjrp-critiquing-ux-ui`) não foi feita nesta rodada.
