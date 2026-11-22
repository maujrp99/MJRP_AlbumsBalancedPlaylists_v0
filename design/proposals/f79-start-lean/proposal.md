# F79 · A tela Start no celular, enxuta — prévia

**Data:** 2026-11-22 · **Feature:** `docs/specs/features/F79-home-that-explains-itself/` · **Issue:** UAT-281 · **Ramo:** `wip/f79-start-lean-on-the-phone` (desenho; não é construção)
**Pedido do MJRP** (sobre a captura da tela Start no iPhone dele): «Aqui eu ainda acho que tem muito texto, tá clutter. Como poderíamos melhorar?»; à proposta do orquestrador: «sim faça a prévia pls».

**Arquivos:** comparador https://claude.ai/artifact/U8gE8yHna1UyPjpxujrMn3 (cópia local `comparator.html`) · gerador `build/` (`capture.mjs` captura a tela real de `main`; `build.py` monta o comparador; `check.mjs` conta palavras e confere alvos; `shoot-comparator.mjs` confere o comparador) · capturas e medidas em `caps/` (`counts.json`, `checks.json`, `first-*.png`, `state-lean-*.png`, `in-empty.png`, `out-empty.png`). A captura bruta (`caps/snaps.json`, 5 MB) e as telas soltas (`caps/frames/`) não vão ao git: refazem-se com `node build/capture.mjs` (Vite em 5579, Chrome em 9579) e `python3 build/build.py`.

## Como foi feita

A tela de hoje foi capturada do código de `main` (servidor de desenvolvimento, Chrome a 393 × 852), com conta e sem conta, em oito estados: a marcação real e o CSS que a página carregou. Costuras: o catálogo da Apple Music responde um conjunto de exemplo (capas fictícias); a conta é de teste, escrita no navegador; Firebase Auth, Firestore, instalações e todo host de fora foram bloqueados (`identitytoolkit`, `securetoken`, `firestore.googleapis`, `firebaseinstallations`). «Hoje» é a captura como veio. «Enxuta» é **a mesma marcação e o mesmo CSS**, com as mudanças aplicadas por cima (`LEAN_CSS`, todo dentro da consulta do celular, e `LEAN_JS` em `build/build.py`). Mostrada a 393 × 852 (iPhone 14) e 375 × 667 (iPhone SE).

## O diagnóstico

A mesma instrução («an artist, or paste a list») aparece **quatro vezes** na primeira tela: no texto do campo, na frase sob ele, no passo 1 e na barra de baixo vazia («Search, then tap a cover»). Além disso, a frase que explica a série (24 palavras) e os três passos ocupam a metade de baixo da tela; sem conta, mais 20 palavras do aviso «You're not signed in…».

## As opções

| | Hoje | Enxuta — **recomendada** | Variante: título em duas linhas |
|---|---|---|---|
| Título | 30 px, 4 linhas | 26 px, 3 linhas | ~19 px, uma linha por frase |
| Frase da série | na tela | sai; link «What is a series?» abre a folha de baixo do app com a mesma frase | igual à Enxuta |
| Sob o campo | «Type an artist to see their albums, or paste a list of albums from many artists.» | só o link «or paste a list» (em todo estado do campo) | igual |
| Três passos | na tela vazia | saem do celular, em todos os estados | igual |
| Barra da série | sempre, vazia antes da primeira capa | só com a primeira capa escolhida | igual |
| Aviso sem conta | na tela vazia | só quando a série tem álbuns, no lugar de hoje | igual |
| Computador | — | nada muda | nada muda |

Estados mostrados: primeira visita, digitando, buscando, a discografia, álbuns escolhidos, colando uma lista (o link abre a lista no lugar do campo, como hoje; a volta é só o link «Search an artist instead»), o catálogo não respondeu, artista não encontrado (o link sob o campo sai, porque a mensagem já tem «Paste a list») e «What is a series?» aberto.

**Palavras novas, propostas pelo agente (pendentes da aprovação do MJRP):** «What is a series?» e «or paste a list». Toda outra palavra que fica é a de hoje. Saem da tela no celular: «Paste or type one album per line.» (na lista colada, repetia o rótulo da caixa) e «Press Enter or Search to see their albums. A list with one album per line works too.» (ao digitar).

## A contagem de palavras (primeira tela, sem os menus)

Contada como na régua (`reports/research/2026-11-21-copy-volume-ruler.md` § 6): texto do produto cuja linha aparece ao abrir a tela.

| | iPhone 14 com conta | sem conta | iPhone SE com conta | sem conta |
|---|---|---|---|---|
| Hoje | 84 | 104 | 79 | 97 |
| Enxuta | 16 | 16 | 16 | 16 |
| Variante | 16 | 16 | 16 | 16 |

Os menus somam mais 6 (sem conta) ou 7 (com conta) palavras; o texto de dentro do campo, mais 8. A régua pede até 70 no celular (e 50 para uma tela de trabalho, CV-03): hoje passa nos dois tetos; a Enxuta fica bem abaixo. A variante não muda a contagem, só a altura (o campo sobe de 233 para 195 px do topo).

## Recomendação: Enxuta

Responde ao pedido: tira as quatro repetições e deixa uma ação clara (o campo com «Search» em fogo). O título continua sendo a marca; a variante encurta a tela, mas o título a 19 px perde a força e o campo já está à vista sem ela. Alvos de toque ≥ 44 px em todos os estados (medido); sem rolagem lateral; o menu de baixo com «Go» fica; o equalizador fica, com o movimento reduzido de hoje.

**Risco declarado:** sem os passos e sem a barra vazia, quem chega pela primeira vez só descobre como juntar álbuns depois de buscar (o «+» nas capas). Se isso pesar, uma linha curta pode voltar sob o campo (pergunta 2).

## O que a construção muda (feita duas vezes)

**No código de hoje (`main`):**

| Arquivo | O que muda |
|---|---|
| `public/js/views/HomeView.js` | `renderStage`: o botão «What is a series?» depois do `h1` (só no celular; no computador o parágrafo fica); `drawHint`: no celular, só o link («or paste a list» / «Search an artist instead»), escondido quando a mensagem de não encontrado está na tela; `drawStage`: a linha do visitante só com álbuns na série; abrir a folha com `openSheet({ variant: 'bottom', title: 'What is a series?', … })` de `components/ui/Sheet.js` |
| `public/js/components/home/HomeDock.js` | `phoneDock`: nada quando a série está vazia (o `#homeDockHost` fica vazio no celular) |
| `public/js/models/homeSeries.js` | uma regra pura para «a barra aparece?» e «o aviso aparece?» (testável); `dockEmptyNote({ phone: true })` deixa de ser usada no celular |
| `public/css/mobile/home.css` | `.home-hero h1` 26 px; `.home-hero p` some; `.home-what` com o estilo de link (branco, 700, sublinhado laranja, 44 px); `#homeHow` escondido; o espaço de baixo da página (`padding-bottom`) menor sem a barra |
| testes | `test/architecture/phoneStylesStayOnThePhone.test.js` continua passando; testes novos da regra da barra e do aviso |

**Na linha da migração (`integrate/staging-2026-11-21`, React):** `public/js/screens/start/Stage.tsx` (o link, a `Hint`, a linha do visitante), `Results.tsx` (`#homeHow` fora no celular), `Dock.tsx` (a barra vazia fora no celular), `homeSeries.ts` (a mesma regra pura), `public/js/i18n/en/start.js` e `pt/start.js` (as chaves novas), e o mesmo CSS. Atenção: lá já existe o português; as duas frases novas precisam de tradução aprovada.

## A crítica separada

Agente Opus com a skill `mjrp-critiquing-ux-ui`: **passa, sem P0**; 2 P1 e 5 P2.
- P1 consertados: (1) «What is a series?» estava cinza e mais fino que o outro link; agora usa o estilo de link da casa; (2) nada dizia o que vem depois de buscar: o comparador e esta proposta dizem que o «+» das capas carrega isso, e a pergunta 2 deixa a escolha com o MJRP.
- P2 que ficam (registrados aqui): o link solto do título (a palavra «series» não aparece no título); o texto de dentro do campo, cortado e repetindo «paste a list» (pergunta 3); o aviso sem conta longe da barra; a barra cheia corta nomes longos («Radiohead sel…», já hoje, fora desta proposta); a variante escondida num item dobrado (o rótulo diz o que ela é).

## Perguntas para o MJRP

1. **Enxuta, a variante (título em duas linhas) ou nenhuma?** Recomendo a **Enxuta**: limpa a tela e mantém o título como marca.
2. **Os passos:** (a) saem do celular, o «+» das capas ensina; (b) uma linha curta sob o campo, até 6 palavras, que só aparece na primeira visita. Recomendo **(a)**; se no uso alguém se perder, vamos para (b).
3. **O texto de dentro do campo** («An artist, or paste a list of albums», cortado no iPhone): (a) fica como está; (b) vira «An artist». Recomendo **(b)**, porque o link logo abaixo já oferece a lista; é palavra nova a aprovar.

## O que não pude conferir

- O iPhone de verdade (Safari, teclado, áreas seguras): só o Chrome no tamanho do iPhone.
- O catálogo real: as capas e a discografia são de exemplo; a conta é de teste.
- Na prévia a folha não arrasta e a busca responde sozinha em 1,6 s.
