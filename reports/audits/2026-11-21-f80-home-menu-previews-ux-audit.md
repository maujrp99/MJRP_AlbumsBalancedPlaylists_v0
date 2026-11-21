---
type: ux-audit
subject: "F80 · página de entrada com o menu como fio (UAT-241, UAT-240): prévias A (paradas), B (menu é a barra), C (deck embaixo), contra a de hoje"
project: MJRP_AlbumsBalancedPlaylists_v0
moment: discovery
judged: "2026-11-21 12:56"
who_judged: separate-agent
verdict: passes
p0: 0
p1: 5
p2: 7
human_decisions: 2
status: open
---

# UX audit — F80 · a home com o menu como fio (três prévias) · 2026-11-21 12:56

> Momento: Discovery (Explorar, `design/inception/`) · Gênero: documento (página de leitura) com navegação; disciplinas HI, CO/CW, CP, IN, AH, IA
> Objeto: `design/inception/splash-menu-stops-v1.html` (A), `splash-menu-bar-v1.html` (B), `splash-menu-deck-v1.html` (C); referência `design/proposals/f80-splash/home-menu/today.html`; gerador `build.mjs`. Servidas em `http://127.0.0.1:5077/`, sem conta e com conta (`?in=1`), movimento reduzido; medidas com playwright-core (Chromium headless) · Viewports: 1280×800 e 393×852 · Cânone: `docs/wiki/harness/design-canon.md`; régua de volume: `reports/research/2026-11-21-copy-volume-ruler.md` (proposta, ainda sem ID no cânone)
> Quem julgou: agente separado (recebeu só a skill e os artefatos)
> Capturas: as do autor em `design/proposals/f80-splash/home-menu/caps/*.webp` (citadas abaixo como `caps/…`); as medidas foram refeitas nesta passada, em resolução cheia, fora do git.

## Veredito

**Passa — pode ir ao MJRP** (nenhum P0). A recomendação não é a aprovação: a aprovação é dele. Antes de ele escolher, duas perguntas são dele (abaixo). Os cinco P1 entram no próximo corte; três deles mudam conforme a prévia escolhida. **Ordem sugerida: B, depois A, depois C.**

## O pedido contra as prévias (S/N)

| Pedido do MJRP (2026-11-21) | A | B | C |
|---|---|---|---|
| Com conta: sem «Sign in» e «Open the app», com um «Start» que vai para `/start` | S | S | S |
| Fio contínuo, uma fila só de barras, como na Elevar (`splash-sides-v1`) | S (largura toda) | S (até 620 px no topo) | S (largura toda) |
| O menu e a página contam a história de cada item do menu (cinco seções, uma por item) | S | S | S |
| Pausa como ícone discreto, com nome acessível | S (`aria-label` e `title` «Pause motion» / «Play motion», `aria-pressed`) | S | S |
| Com conta, a home abre sempre pela página principal, com o menu e o Start | S (estado `?in=1`) | S | S |
| No telefone, o menu continua legível como menu | S, com ressalva (P1 #3) | S | **N** (P1 #2) |

## Achados

| # | ID | Sev | Âncora | Evidência | Check de aceite (S/N) | Esforço/Impacto | Antes → Depois | Skill dona |
|---|---|---|---|---|---|---|---|---|
| 1 | IA-02 (e CP-06) | P1 | `SLIDER` (`nav.ms .stop`, `href="#albums"` …) contra `door()` e o `nav[aria-label=Footer]` em `build.mjs`; nas três | Com conta, o mesmo rótulo leva a dois lugares na mesma página. No menu, «Albums» rola até a história (`#albums`); em «Open Albums →» e no rodapé, abre o app (`/albums`). «Start» aparece duas vezes no topo: a parada leva a `#start` e o botão leva a `/start`. Em B, os dois estão na mesma linha, a ~200 px um do outro (`caps/b-in-1280-top.webp`). No telefone, a barra de baixo tem os cinco rótulos do app, no lugar da barra de abas do app (`design-system.md` § Barra de baixo), mas não sai da página. | Com conta, todo «Albums» (e «Start», «Blend», «Playlists», «Inventory») visível na página leva ao mesmo destino? S/N | médio / alto | mesmo rótulo, dois destinos → um rótulo, um destino (a forma é da decisão 1) | `mjrp-designing-ui`, depois da decisão 1 do MJRP |
| 2 | design-system § Barra de baixo (REQ-03): «rótulo curto em toda aba» | P1 | C · `.ms .lb{position:absolute;width:1px;…clip}` em `@media (max-width:899px)` | A 393 px, os cinco itens do menu são cinco faixas de barras sem rótulo visível (largura do rótulo medida: 1 px). Só o `now-track` diz em que item se está, em 11 px. Para achar «Inventory», é preciso tocar às cegas (`caps/c-out-393-albums.webp`). | A 393 px, cada um dos cinco itens do menu mostra o seu nome? S/N | baixo / alto | segmentos mudos → cinco rótulos visíveis (como em A e B) | `mjrp-designing-ui` |
| 3 | design-system § Medidas mínimas (texto ≥ 12 px) · CP-04 | P1 | A · `.ms .stop{font-size:11px;letter-spacing:.04em}` (≤899 px); C · `.now-track{font-size:11px}` (≤899 px) | A 393 px, os rótulos de A ficam em 11 px, em caixa alta. «PLAYLISTS» (66 px) e «INVENTORY» (71 px), em células de 72 px, ficam a ~3,5 px um do outro: leem como um item só (`caps/a-in-393-top.webp`, rodapé). O `now-track` de C também fica em 11 px. B, a 12 px e em caixa normal, deixa ~19 px entre os dois e passa. | A 393 px, todo texto do menu e do fio tem 12 px ou mais, e o espaço entre dois rótulos vizinhos é maior que o espaço entre as letras de um rótulo? S/N | baixo / médio | 11 px, «PLAYLISTS INVENTORY» colados → ≥ 12 px, rótulos separados | `mjrp-designing-ui` |
| 4 | design-system § Página de entrada · rodada 2 («Fio do equalizador», «“Pause motion” no fio») | P1 | `SLIDER`, `PAUSE` e `SHARED_CSS` em `build.mjs`; `docs/specs/design-system.md` | Os padrões aprovados dizem: no telefone, o fio é «só progresso, sem toque»; o «Pause motion» fica no fim do fio no computador e sob as chamadas no telefone, com 44 px. As prévias trocam isso por: um fio com cinco paradas rotuladas e tocáveis no telefone, a marca «Flip the record» (⟲) e a pausa como ícone de 40 px no canto do palco (a pedido do MJRP). Nenhuma linha nova, nem pendente, está no `design-system.md`. | O `design-system.md` tem as linhas «fio-menu» e «pausa em ícone», marcadas como pendentes de aprovação do MJRP, ao lado das que elas substituem? S/N | baixo / médio | divergência sem linha → linha pendente, aprovada ou recusada com o protótipo | `mjrp-designing-ui`, por `mjrp-defining-design-systems` |
| 5 | moment-checks § A descrição bate com a versão julgada | P1 | `docs/specs/info-arch.md` (linhas 4–5, 22, 96; § Decisões de IA) | O `info-arch.md` não cita esta rodada: nem os três arquivos, nem o eixo («quanto o menu e o fio se fundem»), nem o estado com conta. O texto dele ainda diz que «quem entrou com conta e abre a raiz cai direto em `/start`», o contrário do que o MJRP pediu e do que as prévias mostram. | O `info-arch.md` nomeia as três prévias, o eixo e o estado com conta, e o fluxo 5 diz o que a pessoa com conta vê na raiz? S/N | baixo / médio | rodada sem registro → registrada (e o `behavior.md` § A raiz do site acompanha) | `mjrp-designing-ui` |
| 6 | AH-04 · WCAG 2.2.2 (candidato) | P2 | `PAUSE` inserido depois de `#embers`, dentro do palco | No teclado, a pausa é a 18ª parada no computador e a 24ª no telefone: vem depois de todas as portas da história (na de hoje, era a 13ª, logo depois do fio). No telefone, ela rola com o palco e sai da tela (em `scrollY` 1600, `top` −1170), enquanto as barras da barra de baixo se mexem na rolagem. O movimento para sozinho 10 s depois de carregar ou da última rolagem (medido): o mecanismo existe, mas é difícil de alcançar. | A pausa é alcançável em até 6 Tabs desde o topo, e fica à vista enquanto algo se mexe, nas duas larguras? S/N | baixo / médio | 18ª/24ª parada, fora da tela no telefone → perto do fio, sempre à vista | `mjrp-designing-ui` / esta skill |
| 7 | IN-03 | P2 | `.motion-icon{width:40px;height:40px}` (≥900 px); `.ms .flipmark{width:24px;height:24px}` | A pausa tem 40×40 no computador (44×44 no telefone). A marca ⟲ tem 24×24: está no mínimo do WCAG 2.5.8 e abaixo dos 44 px que a casa declara. | Pausa e marca ⟲ respondem a uma área de 44×44 ou mais nas duas larguras? S/N | baixo / baixo | 40 e 24 px → 44 px de área de toque (o desenho pode continuar discreto) | `mjrp-designing-ui` |
| 8 | AH-04 | P2 | `.ms .flipmark{pointer-events:none;font-size:0}` (≤899 px) | No telefone, a ⟲ some e não aceita toque, mas continua na ordem do Tab: o foco cai numa caixa vazia de 24×24 na barra de baixo (4ª parada, nas três). | No telefone, todo elemento que recebe foco tem conteúdo visível? S/N | baixo / baixo | foco numa caixa vazia → fora da ordem do Tab, ou visível | `mjrp-designing-ui` |
| 9 | CW-04 · CO-06 (medida da régua de volume) | P2 | `.hero .only-out` (`STORY`), herdado da página de hoje | Sem conta: 97 palavras na primeira tela do computador (teto 100) e 69/69/72 no telefone (teto 70; C passa). Título + subtítulo: 52 palavras (teto 40). Subtítulo: 43 palavras em 5 linhas (teto ~25 e 4). H1 em 5 linhas (teto 3). Os H2 das histórias têm 6 ou 7 palavras (alvo 4). Com conta, tudo fica dentro do teto: 64 a 67 palavras, H1 em 3 linhas, subtítulo de 20 palavras em 2 linhas. A barra «Prototype» já avisa que o texto é proposta. | Sem conta, título + subtítulo do topo somam 40 palavras ou menos, e o H1 cabe em 3 linhas a 393 px? S/N | baixo / médio | 52 palavras e H1 em 5 linhas → ≤ 40 e ≤ 3 linhas | `mjrp-copywriting` (F81) |
| 10 | HI-06 (e a régua: um botão de cada na 1ª tela) | P2 | `accountOut` / `accountIn` e `.hero .ctas` | Sem conta, no computador, «Open the app» e «Sign in» aparecem duas vezes na primeira tela (no topo e na abertura). Com conta, «Start» aparece duas vezes nas duas larguras. Somado ao «Start» do menu (#1), são três «Start» numa só tela. | A primeira tela mostra cada chamada uma vez só, nas duas larguras e nos dois estados? S/N | baixo / médio | 2× cada → 1× cada | `mjrp-designing-ui` |
| 11 | HI-03 · DE-02 | P2 | A e C · `.now-track` no estado inicial | No topo da página, o fio diz «THE ALBUM BLENDER» a ~160 px do logotipo, que diz o mesmo (`caps/a-out-1280-top.webp`). B não tem esse rótulo. | No estado inicial, o fio diz algo que o logotipo não diz? S/N | baixo / baixo | o nome repetido → a faixa atual, ou nada | `mjrp-designing-ui` |
| 12 | CP-06 | P2 | C · `.thread{position:fixed;bottom:0}` também ≥900 px | Num site visto no computador, C põe a navegação principal no pé da tela. É desvio de convenção, sem decisão registrada. No telefone, a barra embaixo é a convenção da casa. | Se C for a escolhida, a navegação embaixo no computador tem decisão escrita no `info-arch.md`? S/N | baixo / baixo | desvio sem registro → decisão registrada | `mjrp-designing-ui` |

## Decisões do MJRP (não são achados)

1. **Com conta, o menu leva à história ou ao app?** O pedido tem as duas leituras: «a landing page contar a story de cada item do menu» e «home com os menus … um Start button que vai pra Start». As três prévias escolheram a história, e o app fica nas portas «Open X →» e no rodapé. É isso que abre o achado #1. Uma forma que fecha o #1, para ele escolher: sem conta, o menu conta a história; com conta, o mesmo menu abre as telas do app e a história fica nas portas. Outra forma, para a mesma escolha: o menu sempre conta a história e não usa os rótulos do app (por exemplo, «Side A · Albums»). O desenho é da `mjrp-designing-ui`.
2. **Com conta, a home é a história inteira ou uma home curta?** Hoje, com conta, a página abre com «Welcome back», «Start» e «Your playlists». Depois vêm as mesmas sete faixas de quem não tem conta, de «Flip the record» ao convite final: 317 a 320 palavras no computador. Não há nada da pessoa, como a última série ou quantas playlists ela tem (HI-02). Fica aberto se a home de quem tem conta deve ser só o menu e o Start, ou continuar a história.

## O conjunto

- **O eixo só existe no computador.** No telefone, A e B dão a mesma barra de baixo, com cinco rótulos sobre as barras; só muda a caixa (A em maiúsculas, a 11 px; B em caixa normal, a 12 px). C dá a mesma barra sem rótulos. O MJRP escolhe, de fato, o desenho do computador e, no telefone, «com ou sem rótulo».
- **O que é comum às três** (corrigir uma vez só, no `build.mjs`): os achados #1, #4, #5, #6, #7, #8, #9 e #10.
- **Ordem sugerida:** **B** primeiro. É a leitura mais literal de «o slider do menu»: o menu está no próprio topo, com rótulos de 14 px e, no telefone, de 12 px bem separados. Não repete o nome do logotipo, e o fio cabe na linha do cabeçalho sem roubar altura do palco. O seu risco, os dois «Start» na mesma linha (#1), é comum às três e cai com a decisão 1. **A** vem em segundo: o mesmo desenho, com uma linha a mais e o telefone a corrigir (#3). **C** por último: tira os rótulos no telefone (#2) e põe a navegação embaixo no computador (#12).

## O que está bom, manter

- O fio é uma fila contínua de barras, com o fogo enchendo até o ponto lido, como na Elevar. A parada atual tem `aria-current="step"`, além da cor e do preenchimento: a cor não é o único sinal (AH-02).
- O `nav` diz o que faz: «Menu: each item takes you to its story on this page». Clicar numa parada leva à seção certa, com o título dela à vista (medido: o H2 de Playlists fica entre 277 e 438 px do topo).
- Os rótulos do menu são os do app (`phoneTabs.js`: Start, Albums, Blend, Playlists, Inventory), um rótulo por conceito. Quem fere o IA-02 é o destino, não o nome (#1).
- A pausa em ícone tem nome acessível, `title`, `aria-pressed`, e troca o nome para «Play motion». Ela para as barras do fio (a animação mede `none` depois do clique) e some com movimento reduzido, quando nada se mexe e a rolagem não é suave. O movimento ainda para sozinho em 10 s.
- O foco é visível em tudo (contorno âmbar de 3 px), e a ordem de foco segue a visual. Os rótulos do menu têm contraste de 10,2:1 sobre o fio, a parada atual 8:1 e o ícone de pausa 13,7:1. O fogo fica embaixo do texto, nunca atrás.
- Com conta, a primeira tela cumpre a régua de volume, e as portas «Open X →» têm 44 px de altura e verbo e destino no texto (CW-09).
- Sem conta, o telefone esconde o «Open the app» do topo, como a régua pede.

## Próximos checks (Discovery)

1. O MJRP responde às decisões 1 e 2 e escolhe a prévia.
2. A nova passada roda só os checks: #1 a #5 (P1) e, se a prévia escolhida for C, #2 e #12; os P2 que ele quiser no corte.
3. Esta passada não gravou a entrada no `docs/log.md` nem fez commit: quem a pediu restringiu a escrita a este relatório. A entrada a gravar, por quem integra: `## [2026-11-21 12:56] review — mjrp-critiquing-ux-ui: F80 home com o menu como fio (A/B/C) · passa, sem P0` — `reports/audits/2026-11-21-f80-home-menu-previews-ux-audit.md` · P0 0 · P1 5 · P2 7 · quem julgou: agente separado.

## Fora do cânone (candidatos)

- **WCAG 2.2.2 (Pause, Stop, Hide)**, no achado #6. O cânone não tem ID para movimento automático. A pausa existe, e o movimento para sozinho em 10 s (mais que os 5 s da isenção), então a regra se cumpre. O que falha é alcançar a pausa. Fonte: W3C, *Understanding SC 2.2.2*. Ficou candidato, sem virar retorno ao harness nesta passada.
- **A régua de volume de texto (CV-01 a CV-07)**, no achado #9. Ainda é proposta da pesquisa de 2026-11-21. Usei as medidas dela com os IDs CW-04 e CO-06, sem tratá-la como regra do cânone.
