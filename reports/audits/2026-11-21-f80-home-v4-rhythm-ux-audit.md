---
type: ux-audit
subject: "F80 · página de entrada «A barra é o menu» v4 — o ritmo das histórias (design/inception/splash-menu-bar-v4.html)"
project: MJRP_AlbumsBalancedPlaylists_v0
moment: discovery
judged: "2026-11-21"
who_judged: separate-agent
verdict: passes
p0: 0
p1: 2
p2: 5
human_decisions: 0
status: open
---

# UX audit — F80 home v4, o ritmo · 2026-11-21

> Momento: Discovery · Gênero: documento (página de entrada que conta uma história) · Cânone: design-canon.md + design-system.md § Página de entrada (F80)
> Objeto: `design/inception/splash-menu-bar-v4.html` (gerador `design/proposals/f80-splash/home-menu/build_v4.mjs`), comparado à v3 · Viewports: 393×852 e 1280×900; PT fora, EN dentro, movimento reduzido, pausado, parado 12 s
> Quem julgou: agente separado (recebeu só a skill e os artefatos). Capturas no scratchpad do agente, não citadas no git.

## Veredito
Passa (nenhum P0) — pode ir ao MJRP. O vazio que ele apontou sumiu: o maior trecho sem nada caiu de 308–468 px (v3) para 125–173 px no computador e fica ≤ 91 px no celular; cada história abre com texto + vinheta. Dois P1 antes de mostrar: o equalizador espalhado fora do papel que o design system lhe dá, e os chips de exportação que parecem botões.

## Achados
| # | ID | Sev | Âncora | Evidência | Check de aceite (S/N) | Esforço/Impacto | Antes → Depois | Skill dona |
|---|---|---|---|---|---|---|---|---|
| 1 | design-system § Página de entrada, «Fio do equalizador» / «Equalizador na ação principal»; AH-08 | P1 | `.m-albums .a-eq` (9 barras), `.v4-eqi` em «Venus In Furs», `.p-eq` em `.m-pl` | O design system declara o equalizador da página de entrada como «o fio e mais nada» e a ação principal como «o único outro lugar»; a v4 cria três equalizadores novos que significam «tocando». No celular, a vinheta de Álbuns é quase só um equalizador de 78 px, a 60 px do fio da barra de baixo — duas leituras do mesmo sinal na mesma tela | Fora do fio e de «Abrir o app», há algum equalizador na página? S/N (aceita: N, ou a linha nova aprovada no design-system.md) | baixo / médio | 3 equalizadores novos → «tocando» com outro sinal (um ▶ ou um anel girando no disco), ou uma linha nova no design-system.md, aprovada pelo MJRP, que dá esse papel ao equalizador | mjrp-designing-ui (vinheta) / mjrp-defining-design-systems (se o papel mudar) |
| 2 | CP-06; IN-03 | P1 | `.m-pl .chip.ch-sp`, `.chip.ch-am` | «Spotify ↗» e «Apple Music ↗» são pílulas com contorno, seta de link externo e brilho que acende; no celular medem 74×24 e 102×24 px e são `aria-hidden` — no iPhone o dedo vai tocar e nada acontece | Algum elemento decorativo da vinheta tem forma de botão ou link (contorno de pílula + ↗)? S/N | baixo / alto | pílula com ↗ que acende → o nome do serviço com um ✓ «exportada» ao lado da playlist, sem contorno nem seta (estado, não ação) | mjrp-designing-ui |
| 3 | design-system § «Movimento que para sozinho» | P2 | `html:not(.moving) .v4-motif *` (pausa de `animation-play-state`) | Parado 12 s em Inicie, a máscara congela em `translateX(67 px)`: o campo fica em «Pink Fl…» com o cursor parado. O botão de pausa mostra os quadros compostos, mas o descanso automático não | Depois de 10 s sem rolar, cada vinheta mostra o seu quadro composto («Pink Floyd» inteiro, as linhas acesas)? S/N | baixo / médio | congela no quadro do meio → ao descansar, tirar `.live` (como a pausa já faz) | mjrp-designing-ui |
| 4 | AH-01 (componente de UI, 3:1) | P2 | `.s-rows b/s`, `.b-list li b` | Os resultados da busca e as faixas do Blend são barras a 10–20 % de branco sobre `#0f0f13`; no ciclo, duas de três linhas ficam a 30 % — no computador as linhas de Inicie quase não se veem (captura 1280, Inicie) | As linhas de resultado e de playlist chegam a 3:1 contra o fundo da vinheta no quadro composto? S/N | baixo / médio | 20 % / 10 % → ~45 % / 25 %, e o «apagado» do ciclo em 55 %, não 30 % | mjrp-designing-ui |
| 5 | HI-06 (sentido da vinheta) | P2 | `#albums .v4-lead .m-albums` (celular) | No celular a vinheta de Álbuns é «↑» + barras: não mostra uma faixa subindo; o cartão do ranking que mostra isso fica abaixo, na mesma tela. As outras quatro vinhetas leem como a história (busca, três discos → uma lista, playlists salvas, vinil/CD/fita na prateleira) | A vinheta de Álbuns no celular mostra uma lista em que uma linha sobe? S/N | baixo / baixo | ↑ + equalizador → três linhas, a do meio sobe para o topo (a mesma regra do cartão), sem equalizador (resolve junto com o #1) | mjrp-designing-ui |
| 6 | design-system § Componentes (padrão repetido não declarado) | P2 | `.v4-motif` (5 histórias) | A vinheta é um padrão novo repetido em cinco histórias, sem linha no design-system.md (tamanho 420×200 / 172 px, fundo `#0f0f13` com brasa, fade pelo scroll ±10 px) | Há uma linha «Vinheta da história» no design-system.md § Página de entrada? S/N | baixo / baixo | sem linha → uma linha, pendente de aprovação, quando o MJRP aprovar a v4 | mjrp-defining-design-systems |
| 7 | DE-02 | P2 | `.hero .ctas` + `header .top` (celular, fora da conta) | No primeiro celular, «Entrar» aparece duas vezes com o mesmo peso (no topo e ao lado de «Abrir o app»), a 400 px uma da outra | Há um só «Entrar» visível no primeiro celular? S/N | baixo / baixo | dois «Entrar» → só o do topo; «Abrir o app» ocupa a linha | mjrp-designing-ui |

## O que está bom, manter
- Abertura: o título é só «Mergulhe nos álbuns que você ama.», a linha menor laranja embaixo; a caixa aparece no primeiro celular (213–330 px conforme estado e idioma). Nada transborda (0 px de lado nos 8 estados), sem erro de script.
- Regras de movimento: só `transform`/`opacity`; vinhetas de tamanho fixo (`contain: layout paint`), sem pular a página; nada atrás de texto. Pausa: 0 animações rodando depois do clique, mesmo rolando. Movimento reduzido: 0 animações, ícone de pausa some, cada vinheta é um quadro legível (o vinil saindo da capa, CD, fita).
- Blend (três discos → uma lista, cor por disco), Playlists e Inventário leem como a história sem legenda. O cartão real do Velvet: «Venus In Furs» sobe com «você subiu» — o melhor momento da página.
- No celular, a vinheta ao lado da capa ocupou o vão da v3 (32 580 px² vazios → 2 408 px²).

## Próximos checks (Discovery)
1. Rodar de novo só os checks dos achados 1 e 2 depois da correção; o resto pode ir junto com a aprovação do MJRP.
2. A entrada de review no `docs/log.md` fica com quem comita (este agente só escreveu este relatório, a pedido).

## Fora do cânone (candidatos)
- Nenhum.

---
**Desfecho (o designer, 2026-11-21 14:32):** corrigidos antes de publicar os dois P1 (os equalizadores novos trocados por ▶ e pela faixa que sobe; «Spotify ✓» e «Apple Music ✓» sem contorno nem seta) e três P2 (em repouso as vinhetas mostram a imagem parada; linhas a 36 % de branco e ciclo a partir de 55 %; a vinheta do Álbuns no celular mostra uma faixa subindo; os padrões no `design-system.md`). Fica: «Entrar» duas vezes na primeira tela do celular.
