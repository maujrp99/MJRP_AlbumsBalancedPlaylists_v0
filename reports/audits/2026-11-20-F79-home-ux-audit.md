---
type: ux-audit
subject: "F79 · a Home que se explica · rodada 1, três níveis (Consolidar, Elevar, Transformar) antes da escolha do MJRP"
project: MJRP_AlbumsBalancedPlaylists_v0
moment: discovery
judged: "2026-11-20 18:05"
who_judged: separate-agent
verdict: passes
p0: 0
p1: 8
p2: 9
human_decisions: 1
status: open
---
<!-- status open: há P1 e a escolha do nível é do MJRP. Fecha quando ele escolher e os P1 do nível escolhido tiverem o check S. -->

# UX audit — a Home (F79), três níveis · 2026-11-20 18:05

> Momento: Discovery (Explorar, antes da escolha) · Gênero: fluxo (montar uma série) · Disciplinas em foco: IN, CP, CO-05/06, AH-04; sempre HI, DE; e MP-01, IA-02
> Objeto: `design/inception/home-consolidar-v1.html`, `home-elevar-v1.html`, `home-transformar-v1.html`; Referência `design/proposals/f79-home/reference.html`; comparador `design/proposals/f79-home/comparator.html`; texto `design/proposals/2026-11-20-home-copy-proposal.md` · Viewports: 1280×900 e 393×852 · Cânone: `docs/wiki/harness/design-canon.md`
> Quem julgou: agente separado (recebeu só a skill e os artefatos, não a conversa que os produziu)
> Capturas: headless Chrome (porta 9333), `design/proposals/f79-home/build/shots.mjs`, na pasta de rascunho da sessão (não entram no git: a passada foi pedida só-leitura; o check de cada achado diz o que medir de novo). Vistos em imagem: `empty`, `chosen` e `error` dos três níveis nas duas larguras (Consolidar `error`; Elevar e Transformar `empty` e `chosen`). Os estados `scanning`, `results`, `paste` e `notfound` foram julgados pelo código do nível (`build/elevar.js`, `transformar.js`, `consolidar.js`) — uma recaptura ficou na fila da máquina (doctor em curso) e não chegou antes do fechamento desta passada.
> Contraste medido nas capturas (pixel mais claro do texto contra o fundo, fórmula WCAG).

## Veredito

**Passa para a escolha do MJRP — os três níveis** (nenhum P0). A recomendação do autor (Elevar) se sustenta: é o nível com menos P1 próprios (1) e resolve os quatro defeitos medidos da tela de hoje (ação fora da tela, clique sem retorno na capa, nome antes do conteúdo, vocabulário de código). Consolidar carrega 5 P1, quase todos herdados da tela de hoje; Transformar, 1 P1 de função não desenhada (ordem e remoção). A aprovação é dele; os P1 do nível escolhido entram na rodada de convergência.

| Nível | P0 | P1 | P2 | Leitura |
|---|---|---|---|---|
| Consolidar | 0 | 5 | 3 | limpa as palavras, mas herda contraste, retorno do clique e ordem só por arrastar; o celular perde o erro abaixo da dobra |
| Elevar | 0 | 1 | 5 | o fluxo certo e a identidade com papel; um defeito de sobreposição no celular |
| Transformar | 0 | 1 | 6 | a forma mais clara de "o que é isto", mas a série não se edita (ordem, remover) |
| A descrição (os três) | 0 | 1 | 0 | wireframes citados no `info-arch.md` não existem |

Um P2 (#10, #11, #12, #13) pode valer para mais de um nível; o total do frontmatter conta cada achado uma vez.

## Achados

| # | ID | Sev | Âncora | Evidência | Check de aceite (S/N) | Esforço/Impacto | Antes → Depois | Skill dona |
|---|---|---|---|---|---|---|---|---|
| 1 | AH-01 | P1 | Consolidar · `empty`/`error`/`notfound` · 1280 · `#discographyGrid` (título e detalhe do painel; ajuda sob «Scan») | «The catalog did not answer in 15 seconds.» e «Scan an artist to see their discography here.» medem **2,78:1** (`#4b5563` sobre `#000`); o detalhe e a ajuda, **4,34:1** (`#6b7280`) | Todo texto do painel da discografia e da ajuda mede ≥ 4,5:1 nas duas larguras? | baixo / alto | cinza 600/500 → um papel de texto secundário declarado (≥ 4,5:1, como os 7,4:1 do Elevar) | `mjrp-defining-design-systems` (token) / esta skill reconfere |
| 2 | IN-06 · RC-08 | P1 | Consolidar · `error` (e `empty`) · 393 · `#discographyGrid` | no primeiro viewport só aparece a lupa (y≈700); a frase do erro e «Try again» ficam abaixo da dobra, atrás da barra de ação; acima delas, seis filtros apagados que não filtram nada | A 393×852, sem rolar, a frase do erro e «Try again» estão à vista? | baixo / alto | filtros apagados + lupa → a mensagem e «Try again» logo sob a busca; filtros só com resultado | `mjrp-designing-ui` |
| 3 | CW-10 (+ ativo quebrado) | P1 | Consolidar · todos os estados · 393 · topo do painel, acima de «Build a series» | imagem quebrada com o texto alternativo «bg» visível sobre o título (x 16, y≈70) | A 393 nenhuma imagem quebrada aparece, e a imagem decorativa tem `alt=""`? | baixo / médio | ícone quebrado «bg» → imagem que carrega, ou nenhuma | `mjrp-designing-ui` |
| 4 | IN-04 | P1 | Consolidar · `chosen` · 1280 · cartões da `#discographyGrid` e lista «03 // Your series» | «Animals 50», já na série, ainda mostra «+»; o retorno do clique só aparece na lista da esquerda, que a 1280×900 mostra 2 das 4 linhas (o resto rola dentro do painel) | A 1280, a capa escolhida mostra na própria capa que está na série (e a ordem)? | médio / alto | capa sem mudança → o padrão «capa escolhida numerada» (já pendente no design system) também no Consolidar — ou o MJRP aceita o limite do nível | `mjrp-designing-ui` |
| 5 | IN-16 | P1 | Consolidar · `chosen` · 1280 · linhas de «03 // Your series» | só ✕ por linha; «drag to change the order» é o único jeito de mudar a ordem | Existe, sem arrastar, como subir e descer um álbum na série? | baixo / médio | só arrastar → ↑ ↓ por linha, como no Elevar | `mjrp-designing-ui` |
| 6 | AH-11 | P1 | Elevar · `chosen` · 393 · `.e-bar-note` (barra de ação) | a pilha de capas cobre «Tap» em «Tap to review, reorder or rename»; o nome corta em «Floyd, the lo…» | A 393, todo o texto da barra de ação se lê, sem nada por cima? | baixo / médio | pilha sobre o texto → pilha numa coluna própria (ou só a contagem) e a nota numa linha | `mjrp-designing-ui` |
| 7 | IN-16 | P1 | Transformar · `chosen` · 1280 e 393 · `.t-dock` («change the order») | «change the order» não abre nada (sem estado desenhado); a base não tem ✕ por álbum — um álbum vindo da lista colada, que não está na grade, não tem como sair | Há um estado desenhado em que cada álbum da série sobe, desce e sai, sem arrastar? | médio / alto | link sem destino → a base expande (ou folha no celular) com as linhas ↑ ↓ ✕ | `mjrp-designing-ui` |
| 8 | (descrição bate com a versão) | P1 | `docs/specs/info-arch.md` § A Home (F79) | cita `design/wireframes/home-<nível>-v1-desktop.png` e `-phone.png`; nenhum existe em `design/wireframes/` | Os seis wireframes citados existem e mostram a versão v1? | baixo / médio | citação sem arquivo → wireframes gerados (`build/wireframes.sh`) | `mjrp-designing-ui` |
| 9 | IA-02 | P2 | Consolidar · todos · 1280 e 393 · `#home-tech-panel` e `#home-toolbar` | dois passos numerados «02» («02 // FIND ALBUMS» e «02 // PICK ALBUMS…»), contra a própria prova da proposta de copy («os números 01, 02 e 03») | Cada número de passo aparece uma vez só, em ordem? | baixo / baixo | 01, 02, 02, 03 → 01, 02, 03, 04 (ou 02A/02B de hoje) | `mjrp-designing-ui` |
| 10 | HI-05 · HI-06 | P2 | os três · `chosen` · 1280 · «Scan»/«Search» e «Create series» | as duas ações com o degradê «flame» ao mesmo tempo; no Consolidar somam-se «By artist», «Studio», «02 //» e a contagem em laranja | No estado `chosen`, «Create series» é o único elemento preenchido com o fogo? | baixo / médio | dois botões de fogo → «Scan» em superfície neutra depois do primeiro resultado; o fogo fica na ação que conclui | `mjrp-designing-ui` |
| 11 | IA-02 · CO-06 | P2 | Elevar · `results`/`chosen` · 393 · `.e-status p`; Transformar · `empty` · 393 · `.t-dock` | no celular: «Click a cover to add it; click again…» (Elevar) e «Click a cover to drop it in» (Transformar), enquanto a barra do Elevar diz «Tap a cover» | No celular, toda palavra de gesto diz «Tap»? | baixo / baixo | «Click» → «Tap» abaixo de 768 px | `mjrp-designing-ui` |
| 12 | design-system § Medidas mínimas (margem lateral) | P2 | Elevar e Transformar · todos · 393 · `.e-wrap`, `.t-wrap` | conteúdo começa em x = 32; o declarado é 16 px (o Consolidar segue 16) | A 393 a margem lateral é 16 px (ou a área segura)? | baixo / baixo | 32 → 16 px | `mjrp-designing-ui` |
| 13 | AH-08 · AH-09 | P2 | Elevar `.e-eyebrow`, `.e-num`; Transformar `.t-hint button`, `.t-hero h1 span`, `.t-eq`; Elevar `.e-eq` | `#fb923c` faz rótulo, número de ordem e link — o design system o declara só como cor da fonte BestEverAlbums, «não vale para botões»; o degradê do título e dos equalizadores começa em `#fdba74`, fora do «flame» `#f97316 → #dc2626` da identidade | Toda cor laranja da tela tem um papel declarado, e o degradê do fogo é o da identidade (ou a terceira parada foi aprovada pelo MJRP)? | baixo / médio | `#fb923c` solto e três paradas → papel «laranja de texto» declarado; degradê de duas paradas, ou a terceira aprovada | `mjrp-defining-design-systems` |
| 14 | CP-08 | P2 | Elevar · `.e-eyebrow`, `.e-num` (bandeja; no celular, a folha) | terceira família (`ui-monospace`) a 11–13 px; o rótulo a 11 px fica abaixo do piso de 12 px quando a bandeja abre como folha no celular | Cada tamanho e família da bandeja mapeia a um papel declarado, e nada fica abaixo de 12 px no celular? | baixo / baixo | mono 11 px → rótulo pequeno 12/16 (mono declarado como papel, se o MJRP mantiver a voz de console) | `mjrp-defining-design-systems` |
| 15 | CP-04 | P2 | Transformar · `chosen` · 393 e 1280 · `.t-dock` | a 393 o nome corta sem reticências («Floyd, the long o») sob «Create series» e «· change the order» vai para a terceira linha; a 1280 a base cobre a segunda fila de capas | A 393 o nome mostra reticências e a base cabe em duas linhas; a 1280 a última fila rola para cima da base? | baixo / baixo | corte seco → reticências e padding inferior da página = altura da base | `mjrp-designing-ui` |
| 16 | (a conferir) | P2 | Transformar · `empty` · 1280 · `.t-hero p` | na captura, a palavra «albums» aparece partida («albu|ns») na frase da série; pode ser artefato da captura | Numa nova captura, a frase da série se lê inteira? | baixo / baixo | — | esta skill (recaptura) |
| 17 | HI-05 | P2 | Consolidar · `empty`/`error` · 1280 · `#home-toolbar` | os filtros, com «Studio» ligado em laranja e «Compend…» cortado, aparecem antes de qualquer busca e com «Search failed» | Os filtros por tipo só aparecem quando há discografia na tela? | baixo / baixo | filtros sem dado → escondidos até o resultado | `mjrp-designing-ui` |

Contagem por nível: Consolidar P1 #1–#5, P2 #9, #10, #17; Elevar P1 #6, P2 #10–#14; Transformar P1 #7, P2 #10, #11, #12, #13, #15, #16; descrição P1 #8.

## O que está bom, manter

- **MP-01 cumprido:** três opções sobre um eixo nomeado (a ambição), a âncora no meio e recomendada, igualmente acabadas (sete estados, duas larguras, cliques reais), lado a lado com a tela de hoje no comparador; o registro está no `info-arch.md` § A Home (F79) e em `proposal.md`, com as perguntas ao MJRP.
- **IN-10 / IN-06:** os três mostram o primeiro uso com o sistema vazio, cada vazio apontando a ação («Start with an artist», os três passos, «Pick at least one album to create the series.»); erro e «não encontrado» dizem o que ainda vale («Nothing was changed: your series still has its albums.») — RC-08.
- **Identidade respeitada nos três:** logotipo e degradê do fogo na ação principal; o equalizador do fundo preservado (Elevar), promovido a medidor com a contagem escrita ao lado (HI-04 respeitado: a barra é sinal, não o único canal), e vivo como indicador de busca com `prefers-reduced-motion` (Transformar).
- **Elevar, o fluxo:** buscar primeiro, nomear no fim; «Create series» sempre à vista na bandeja (y 803–855 a 1280×900); a capa escolhida com anel e número onde o olho está (IN-04); ↑ ↓ ✕ com `aria-label` e o ↑ do primeiro e o ↓ do último desligados (IN-16); a linha colada marcada antes do clique; fichas de tipo em superfície neutra (HI-05: o laranja fica para a ação e o escolhido); contraste do texto secundário 5,3–8,7:1.
- **Transformar, a resposta primeiro:** o título diz o que a tela faz antes de qualquer controle (HI-02, CP-02); um campo só; a base resume a série em capas; texto secundário 6,2–7,4:1.
- **Consolidar:** o texto novo, a ação «Create series» à vista no computador, o próximo passo junto do botão, «Other» no lugar de «?» (IA-02) — vale mesmo como conserto isolado, como a proposta diz.
- **Os padrões novos estão declarados** em `design-system.md` § Home · padrões propostos, marcados pendentes — nenhum padrão novo sem linha.

## Próximos checks (Discovery)

1. Ao escolher o nível, rodar só os checks dos P1 dele (Elevar: #6 e #8; Transformar: #7 e #8; Consolidar: #1 a #5 e #8) e recapturar `scanning`, `results`, `paste` e `notfound` nas duas larguras — estes quatro estados não foram vistos em imagem nesta passada.
2. Abrir a bandeja do Elevar como folha no celular (`data-open`) e medir #14 ali.
3. Para o spec, não para a tela: o Elevar e o Transformar trocam um comportamento descrito — «clicar de novo não o tira» (`behavior.md` ^home-album-added-to-stack) vira «click again to take it out»; e o nome sugerido existe só como `placeholder` («Pink Floyd selection»), que some ao focar e se lê como campo vazio. As duas entram na lacuna do nome vazio já registrada no `info-arch.md`.

**Decisão do MJRP (1):** o nível (ou a mistura), com as sete perguntas de `design/proposals/f79-home/proposal.md` § 4 — entre elas «Add all 17», a voz de console, «Compendiums» e para onde «Create series» leva (o texto «Next: open it in the Blend» promete o Blend, e hoje a tela abre a série na tela de séries: IN-08 depende dessa resposta).

## Fora do cânone (candidatos)

- Nenhum. O ativo quebrado (#3) foi ancorado em CW-10 (texto alternativo) por falta de uma regra de "imagem que não carrega"; a busca por fonte não foi feita nesta passada.

## Entrada do log (não gravada: passada só-leitura, pedida assim)

```markdown
## [2026-11-20 18:05] review — mjrp-critiquing-ux-ui: F79 a Home, três níveis · passa para a escolha (0 P0)

- Relatório: `reports/audits/2026-11-20-F79-home-ux-audit.md` · P0 0 · P1 8 · P2 9 · quem julgou: agente separado.
```
