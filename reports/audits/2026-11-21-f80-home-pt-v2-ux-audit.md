---
type: ux-audit
subject: "F80 · a home «A barra é o menu», v2 em português (UAT-241, UAT-240): design/inception/splash-menu-bar-v2.html contra a v1 (B)"
project: MJRP_AlbumsBalancedPlaylists_v0
moment: discovery
judged: "2026-11-21 13:26"
who_judged: separate-agent
verdict: passes
p0: 0
p1: 5
p2: 8
human_decisions: 3
status: open
---

# UX audit — F80 · a home «A barra é o menu», v2 em português · 2026-11-21 13:26

> Momento: Discovery (Explorar, `design/inception/`) · Gênero: documento (página de leitura) com navegação; disciplinas HI, CW/CO, CP, IN, AH, IA
> Objeto: `design/inception/splash-menu-bar-v2.html` (gerador `design/proposals/f80-splash/home-menu/build_v2.mjs`), revisando `splash-menu-bar-v1.html` (B). Servida em `http://127.0.0.1:5077/inception/splash-menu-bar-v2.html`, sem conta e com conta (`?in=1`), PT e EN (`?lang=en`), caixote em CSS (`&nogl`), com movimento e com movimento reduzido; medidas com playwright-core (Chromium headless shell 1243) · Viewports: 1280×800 e 393×852 (e 360×780 para um caso) · Cânone: `docs/wiki/harness/design-canon.md`; régua de volume: `reports/research/2026-11-21-copy-volume-ruler.md` (proposta CV-01 a CV-07, ainda sem ID no cânone; medidas citadas com CW-04 e CO-06, como na passada anterior)
> Quem julgou: agente separado (recebeu só a skill e os artefatos)
> Capturas: fora do git, nesta passada (não citadas por caminho do repositório). A rodada WebGL do caixote não foi capturada; tudo foi medido com `&nogl`.

## Veredito

**Passa — pode ir ao MJRP** (nenhum P0). Isto é uma recomendação. A aprovação é dele. Os quatro pedidos dele desta rodada estão atendidos: o texto em português, o ranking parcial, um álbum real no cartão e a faixa do «Vire o disco» que agora se explica. Ficam cinco P1. Dois deles são de registro e de medida (#4, #5). Um depende da decisão 1 dele, que segue aberta (#1). Os outros dois são do próprio português: o verbo do ranking (#2) e, no telefone, a capa que não bate com o cartão (#3).

## O pedido contra a v2 (S/N)

| Pedido (MJRP 2026-11-21, e padrões do orquestrador) | S/N | Evidência |
|---|---|---|
| «rever o protótipo já com texto tudo em português» | S | `lang="pt-BR"`; todo texto visível em PT. Ficam em inglês só os nomes próprios e de marca (The Album Blender, Blend, Playlists, Apple Music, Spotify). Ressalva: o `aria-label` do rodapé fica «Rodapé» também em EN (#12) |
| Ranking flexível: «ele ranqueia o que ele quer» | S | «Suba a faixa que quiser para o topo — uma só ou várias. O que você não mexer fica como está.» Bate com o app: `UserRankModal` põe as faixas sem posição depois, na ordem do disco. O verbo diverge do app (#2) |
| Cartão com dados reais, sem notas de terceiros | S | «The Velvet Underground & Nico · 1967», 11 faixas reais (4 mostradas, «+ 7 faixas, como estavam»), «Venus In Furs» sobe; nenhuma nota. No telefone, a capa ao lado é outra (#3) |
| O flip «faz sentido?» → uma faixa curta | S | 143 px no computador e 94 px no telefone (era uma tela inteira). «Vire o disco» + «No lado B fica o que você guarda: suas playlists e seu inventário.» No telefone é uma faixa reduzida, não um filete (#13) |
| Menu com os rótulos do documento de copy, «Inicie» primeiro | S | Inicie · Álbuns · Blend · Playlists · Inventário. Nenhum rótulo cortado a 1280 (14 px, células de 124 px, vãos de 62 a 82 px) nem a 393 (12 px, células de 72 px, vãos de 18 a 36 px), em PT e EN |
| Chave PT/EN | S, com defeito | Troca todos os textos, `lang`, `title` e os `aria-label`. O estado da chave está errado (#12) |
| Banana primeiro, caixote na diagonal, pausa discreta | S | Capa da frente: The Velvet Underground & Nico. Pausa: ícone de 44 px no palco, «Pausar o movimento»/«Retomar o movimento» |
| Com conta, o topo só com «Inicie» de fogo | S | O topo tem só «Inicie». A primeira tela repete «Inicie» na abertura (#9) |
| Régua: título ≤ 12 palavras, parágrafo ≤ 40, 1ª tela ≤ 100 / ≤ 70 | S, com ressalva | H1 com 9 palavras, subtítulo com 32. 1ª tela sem conta: 83 palavras (1280) e 60 (393); com conta: 63 e 43. Ressalvas: título + subtítulo somam 41, e o H1 ocupa 5 linhas nas duas larguras (#8) |

## Os P1 da passada anterior (`2026-11-21-f80-home-menu-previews-ux-audit.md`)

| # anterior | Situação na v2 |
|---|---|
| 1 · IA-02, mesmo rótulo, dois destinos (com conta) | **Aberto** → #1 abaixo. Depende da decisão 1 do MJRP, que não aparece no log |
| 2 · C sem rótulos no telefone | Não se aplica (a escolha foi B) |
| 3 · 11 px no telefone | **Fechado a 393** (12 px, vãos ≥ 18 px). **Volta abaixo de 380 px** → #5 |
| 4 · design-system sem as linhas novas | Fechado para a v1. **Aberto de novo para a v2** (faixa do flip, chave de idioma, cartão real) → #4 |
| 5 · info-arch sem a rodada | Fechado para a v1. **Aberto de novo para a v2** (textos SPL-22 e SPL-25 mudaram, faixa do flip e cartão sem registro) → #4 |

Dos P2 anteriores: #8 (foco numa caixa vazia no telefone) está **fechado**, porque a ⟲ saiu da ordem do Tab. Seguem abertos o #6 (→ #6), o #7 (→ #7), o #9 (→ #8) e o #10 (→ #9). O #11 e o #12 não se aplicam a B.

## Achados

| # | ID | Sev | Âncora | Evidência | Check de aceite (S/N) | Esforço/Impacto | Antes → Depois | Skill dona |
|---|---|---|---|---|---|---|---|---|
| 1 | IA-02 (e CP-06) | P1 | `SLIDER` (`href="#${id}"`) contra `accountIn`, `.hero .only-in .btn-primary` e o `nav[aria-label=Rodapé]` com `MENU` (`href` do app), em `build_v2.mjs` | Com conta, «Inicie» do menu leva a `#start`, e «Inicie» do topo e da abertura leva a `/start`. «Álbuns», «Blend», «Playlists» e «Inventário» do menu rolam até a história; os do rodapé abrem o app. Medido: o rodapé com conta lista `Álbuns->/albums`… | Com conta, todo rótulo do menu visível na página leva ao mesmo destino que o rótulo igual no topo, na abertura e no rodapé? S/N | médio / alto | mesmo rótulo, dois destinos → um rótulo, um destino (a forma sai da decisão 1) | `mjrp-designing-ui`, depois da decisão 1 do MJRP |
| 2 | IA-02 | P1 | `T['t.albums']` «Ranqueie as faixas do seu jeito.» e `T['r.tag']` «Seu ranking»; contra `design/copy/album-blender-copy.md` `ser.rank` «Classificar», `ser.rank-the-tracks` «Classificar as faixas», `ser.edit-my-ranking` «Editar meu ranking» | Um conceito com três formas em PT: a home diz «Ranqueie»; o app diz «Classificar» e «Classificado»; os dois dizem «ranking». Isso entra antes do D-09 do documento de copy («Rank»/«Popularity», proposta «Ranking»), que ainda espera o MJRP. | O verbo da ação de ordenar as faixas é o mesmo na home e no documento de copy do app, em PT? S/N | baixo / médio | «Ranqueie» aqui, «Classificar» no app → um verbo só, o que o D-09 decidir | `mjrp-copywriting` (F81), depois do D-09 |
| 3 | info-arch `^splash-v2-track` («o disco da faixa sobe do caixote; a legenda troca para ele») | P1 | `#albums .slot.pre[data-pull="3"]` (telefone) contra `TRACKS.albums.pull: 0` (computador) | No telefone, a história «Álbuns» mostra a capa e a legenda de *Low · David Bowie* logo acima do cartão «Seu ranking · The Velvet Underground & Nico». No computador, o palco mostra a banana, e as duas coisas batem. Num cartão que o MJRP pediu com dados reais, a capa ao lado é de outro disco. | A 393 px, a capa e a legenda da história «Álbuns» são do mesmo álbum do cartão? S/N | baixo / médio | Low ao lado do cartão do VU → a capa do VU (ou nenhuma) | `mjrp-designing-ui` |
| 4 | moment-checks § A descrição bate com a versão julgada · design-system § Página de entrada · rodada 3 | P1 | `docs/specs/info-arch.md` (SPL-20 a SPL-26, linha 5, `^splash-v2-flip`); `docs/specs/design-system.md` § rodada 3 | Nenhum dos dois arquivos cita `splash-menu-bar-v2.html`. O SPL-22 ainda descreve «Welcome back» / «Start». O SPL-25 ainda diz «Open <item> →» (na v2 é «Ir para X →»). O `^splash-v2-flip` descreve o flip como uma seção em que o caixote gira; na v2 é uma faixa de 94 a 143 px. O cartão com álbum real e a chave PT/EN não têm linha. | O `info-arch.md` nomeia a v2 com os textos dela (SPL-22, SPL-25), a faixa do flip e o cartão, e o `design-system.md` tem «faixa do flip», «cartão de ranking real» e «chave de idioma» como pendentes? S/N | baixo / médio | v2 sem registro → registrada, com os pendentes ao lado do que substituem | `mjrp-designing-ui`, por `mjrp-defining-design-systems` |
| 5 | design-system § Medidas mínimas (texto ≥ 12 px) · CP-04 | P1 | `V2_CSS`: `@media (max-width:380px){.ms .stop{font-size:11px}}` | Abaixo de 380 px, os rótulos da barra de baixo voltam a 11 px (medido a 360: 11 px). E não precisam: a 12 px, «Inventário» mede 59 px numa célula de 66. É a regressão do P1 #3 anterior numa largura comum de Android. | A 360 px, os cinco rótulos do menu têm 12 px ou mais e cabem na célula? S/N | baixo / médio | 11 px abaixo de 380 → 12 px em toda largura | `mjrp-designing-ui` |
| 6 | AH-04 · WCAG 2.2.2 (candidato) | P2 | `PAUSE`, inserido depois de `#embers`, no palco | Com movimento, a pausa é a 19ª parada do Tab a 1280 e a 22ª a 393. No telefone, com `scrollY` 1600, ela fica em `top` −958 (fora da tela), enquanto a barra de baixo se mexe. O movimento para sozinho em ~10 s (medido: `moving` sai). | A pausa é alcançável em até 6 Tabs desde o topo e fica à vista enquanto algo se mexe, nas duas larguras? S/N | baixo / médio | 19ª/22ª parada, fora da tela → perto do menu, sempre à vista | `mjrp-designing-ui` / esta skill |
| 7 | IN-03 | P2 | `.ms .flipmark{width:24px;height:24px}` (≥ 900 px) | A ⟲ do menu, no computador, aceita clique numa área de 24×24: o mínimo do WCAG 2.5.8, abaixo dos 44 px da casa. | A ⟲ responde a uma área de 44×44 ou mais? S/N | baixo / baixo | 24 → 44 px de área | `mjrp-designing-ui` |
| 8 | CW-04 · CO-06 (régua: CV-02, CV-05) | P2 | `T['h.kick']`, `T['h.title']`, `T['h.what']`; `.hero .h1` | O H1 (9 palavras) ocupa 5 linhas a 1280 (240 px em linhas de 48) e a 393 (187 px em linhas de 37). Título + subtítulo somam 41 palavras (teto 40). A primeira frase do subtítulo, «The Album Blender é um app web para quem ouve álbuns inteiros.», repete o kicker «Para quem ouve álbuns inteiros», logo acima. | O H1 cabe em 3 linhas a 1280 e a 393, título + subtítulo somam ≤ 40 palavras, e a primeira tela diz «para quem ouve álbuns inteiros» uma vez só? S/N | baixo / médio | 5 linhas, 41 palavras, a frase dita duas vezes → ≤ 3 linhas, ≤ 40 palavras, uma vez | `mjrp-copywriting` (F81) / `mjrp-designing-ui` (tamanho) |
| 9 | HI-06 (régua: CV-06) | P2 | `accountIn` + `.hero .only-in .ctas`; `accountOut` + `#hero-ctas` | Com conta, «Inicie» aparece duas vezes na primeira tela, nas duas larguras (topo e abertura). Somando o «Inicie» do menu, são três. Sem conta, a 393: «Entrar» duas vezes (topo e abertura). A 1280: «Entrar» e «Abrir o app» duas vezes cada. | A primeira tela mostra cada chamada uma vez só, nas duas larguras e nos dois estados? S/N | baixo / médio | 2× cada → 1× cada | `mjrp-designing-ui` |
| 10 | CW-09 | P2 | `T['p.albums']`, `T['r.note']`, `T['p.blend']` | A história do ranking não diz o que a pessoa ganha. O app usa a ordem dela no Blend quando a receita pede (`TopNUserAlgorithm`, `UserRankingStrategy`), e a história do Blend não fala disso. O cartão diz «exemplo» duas vezes («Seu ranking · exemplo» e a nota) e «como estavam» duas vezes («+ 7 faixas, como estavam» e a nota). | A história do ranking diz, numa frase, para que serve a ordem da pessoa, e o cartão diz «exemplo» e «como estavam» uma vez cada? S/N | baixo / médio | sem o porquê, a nota repete o cartão → o porquê numa frase, a nota sai | `mjrp-copywriting` |
| 11 | CO-06 | P2 | `door()`: `T['d.start']` «Ir para Inicie» (e «Go to Start») | O «Inicie» é um verbo e, na porta, vira o lugar de destino: «Ir para Inicie →» não é português natural. As outras portas («Ir para Álbuns →») funcionam. | Cada porta lê como uma frase natural em PT? S/N | baixo / baixo | «Ir para Inicie →» → uma ação («Começar uma série →») | `mjrp-copywriting` |
| 12 | AH-04 (estado anunciado) · IA-02 nos dois idiomas | P2 | `SLIDER_JS` `setIn()`: `D.querySelectorAll('.proto button')` também pega `[data-lang]`; `pageV2()`: `<nav aria-label="Rodapé">` sem `data-i18n-aria` | Medido: sem conta, `PT=true, EN=true`; com conta, as duas `false`. A chave de idioma mostra os dois idiomas acesos, ou os dois apagados (é a tira do protótipo, mas é a chave que o MJRP vai usar para comparar). Em EN, o rodapé continua com o nome «Rodapé» para o leitor de tela. | Só o idioma em uso tem `aria-pressed="true"` nos dois estados de conta, e o rodapé se chama «Footer» em EN? S/N | baixo / baixo | os dois acesos / «Rodapé» em EN → um aceso / «Footer» | `mjrp-designing-ui` |
| 13 | padrão do pedido (o flip, «um filete no telefone») | P2 | `.story > section.flip-band` (≤ 899 px: `padding:14px 0`, título 16 px + linha 14 px) | No telefone, o flip é uma faixa de 94 px, com título e frase, e não o filete fino do pedido. A frase é o que responde ao «faz sentido?» do MJRP, então a forma é escolha dele. | O flip no telefone tem a forma que o MJRP escolheu (faixa com frase ou filete)? S/N | baixo / baixo | faixa de 94 px → a forma escolhida | `mjrp-designing-ui` |

## Decisões do MJRP (não são achados)

1. **Com conta, o menu leva à história ou ao app?** É a decisão 1 da passada anterior, e não está no log. Ela fecha o #1.
2. **Com conta, a home é a história inteira ou uma home curta?** É a decisão 2 anterior. A resposta dele («conta aberta sempre home … botão para start») diz onde a pessoa cai, não o tamanho da home. A v2 segue com a história inteira depois da abertura.
3. **O verbo do ranking em PT** (D-09 do documento de copy). A home usa «Ranqueie», e o app usa «Classificar». Ele fecha o #2. Na mesma linha, o D-06 («Inventário» ou «Coleção») ainda está aberto: a história do Inventário usa as duas palavras, «Inventário» no rótulo e «coleção» no parágrafo.

## O que está bom, manter

- O português lê como português, não como tradução: «Comece por um artista ou por uma lista», «Guarde os Blends que você curtiu», «De volta ao caixote», «nenhum disco abafa os outros». Os rótulos do menu são os do documento de copy (`nav.*`), e «Blend» e «Playlists» ficam como o D-01 propõe.
- A história do ranking diz o que o MJRP pediu, e o app faz o que ela promete: subir uma faixa e deixar o resto como está. O cartão é honesto: álbum real, títulos reais, 4 de 11 faixas com a conta certa («+ 7»), nenhuma nota de terceiros.
- A faixa do flip explica a metáfora numa frase (lado A = fazer, lado B = guardar) e reduz uma tela inteira a 94–143 px. Os kickers «Lado A · 1 — Inicie» … «Lado B · 2 — Inventário» seguem essa ordem.
- Os rótulos do menu não se cortam em nenhuma das duas línguas, a 1280 e a 393. Não há rolagem horizontal. A barra de baixo do telefone tem cinco alvos de 72×56 px, o item atual em laranja com `aria-current="step"`, e a ⟲ fica fora da ordem do Tab.
- Contraste medido sobre o fundo: rótulos do menu 10,2:1; «você subiu» 8,3:1 (12 px, 700); «+ 7 faixas» 9,6:1; nota do cartão 6,7:1 (13 px); frase do flip 10,2:1; portas 8,7:1.
- Com movimento reduzido, nada anima (`getAnimations()` = 0, barras com `animation: none`), a rolagem não é suave, e a pausa some porque não há o que pausar. Com movimento, ele para sozinho em ~10 s.
- A primeira tela fica dentro do teto: 83/60 palavras sem conta e 63/43 com conta (100/70).

## Próximos checks (Discovery)

1. O MJRP responde às decisões 1, 2 e 3.
2. A nova passada roda só os checks: #1 a #5 (P1). Dos P2, roda os que ele quiser no corte; #8 e #9 são os de mais retorno.
3. Esta passada não gravou a entrada no `docs/log.md` nem fez commit: quem a pediu limitou a escrita a este relatório. A entrada a gravar, por quem integra: `## [2026-11-21 13:26] review — mjrp-critiquing-ux-ui: F80 home «A barra é o menu» v2 em português · passa, sem P0` — `reports/audits/2026-11-21-f80-home-pt-v2-ux-audit.md` · P0 0 · P1 5 · P2 8 · quem julgou: agente separado.

## Fora do cânone (candidatos)

- **WCAG 2.2.2 (Pause, Stop, Hide)**, no #6. Como na passada anterior, a regra se cumpre pelo fim automático em ~10 s. O que falha é alcançar a pausa. Fonte: W3C, *Understanding SC 2.2.2*. Fica como candidato.
- **A régua de volume (CV-01 a CV-07)**, no #8 e no #9. Ainda é proposta. Usei as medidas dela com os IDs CW-04, CO-06 e HI-06.
