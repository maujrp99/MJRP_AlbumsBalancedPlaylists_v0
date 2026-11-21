---
type: ux-audit
subject: "F88 — o menu do topo do app na linguagem da home, rodada 1 (Elevar, Transformar e o comparador)"
project: MJRP_AlbumsBalancedPlaylists_v0
moment: discovery
judged: "2026-11-21 16:30"
who_judged: separate-agent
verdict: passes
p0: 0
p1: 7
p2: 8
human_decisions: 1
status: open
---

# UX audit — o menu do topo do app (F88), rodada 1 · 2026-11-21 16:30

> Momento: Discovery · Gênero: fluxo (navegação global do app) · disciplinas em foco: IN, CP, AH-04, IA, HI, DE; MP-01
> Objeto: `design/inception/f88-top-menu-elevar-v1.html`, `design/inception/f88-top-menu-transformar-v1.html`, `design/proposals/f88-top-menu/comparator.html` (#passagem, #estados, #notas), fonte `design/proposals/f88-top-menu/build/proto.tpl.html` · Viewports: 393×852, 1280×800 e o comparador a 375×812 · Cânone: `docs/wiki/harness/design-canon.md` · identidade: `docs/specs/design-system.md` (§ Celular, § Página de entrada · rodada 3)
> Quem julgou: agente separado (recebeu só a skill e os artefatos). As telas sob o menu são capturas e não foram julgadas.

## Veredito

**Passa — pode ir ao MJRP** (nenhum P0). Os dois níveis mantêm tudo o que o menu faz hoje, com alvos de 44 px, texto ≥ 12 px e contraste AA medidos. Antes da construção ficam 7 P1: os dois maiores são do Transformar — a barra da home muda de sentido e de comportamento dentro do app (achados 1 e 2) — e o comparador mostra o celular encolhido a 79 %, abaixo do piso de 12 px (achado 4). Decisão dele já pedida em #notas: qual nível (e, com ele, Apple Music no menu e ícones na barra de baixo).

## Achados

| # | ID | Sev | Âncora | Evidência | Check de aceite (S/N) | Esforço/Impacto | Antes → Depois | Skill dona |
|---|---|---|---|---|---|---|---|---|
| 1 | AH-08 | P1 | Transformar · 1280 e 393 · `nav.ms` (`msNav()`, lado A `lit = f < b`, `.stop.done`) | Na home o fogo e o branco querem dizer «já lido»; no app, no lado A, o fogo enche de Inicie até o lugar atual e Inicie/Álbuns ficam brancos como «feitos» mesmo para quem chegou direto em /blend; no lado B só o próprio trecho acende. A mesma codificação diz duas coisas, e muda no meio da barra | Num lugar do lado A, só o lugar atual se distingue (sem «feitos»), e o mesmo desenho vale nos dois lados? S/N | baixo / alto | «fogo = caminho percorrido no lado A, lugar no lado B» → «fogo = onde você está, igual nos cinco lugares» (ou o sentido de passos declarado e explicado) | mjrp-designing-ui |
| 2 | IA-03 | P1 | Transformar · passagem #passagem · `homeChrome()` (todo `.stop` com `data-act="enter"`) vs `splash-menu-bar-v4.html` (`.stop href="#albums"`…) | Na home aprovada, cada item da barra rola até a história dele na página (navegação local); no app, a mesma barra leva a outra tela (global). O preview da passagem esconde isso: todo item da home entra no app em Inicie | O protótipo declara e mostra o que um clique em «Álbuns» faz na home e no app, e os dois são o mesmo tipo de navegação ou a diferença está marcada? S/N | médio / alto | «barra igual, comportamento diferente, não declarado» → «comportamento de cada item declarado no info-arch.md e visível na passagem» | mjrp-designing-ui |
| 3 | HI-03 · design-system § Celular › Barra do topo | P1 | Transformar · 393 · `transformarPhone()` (sem `.e-name`) | A barra do topo do celular perde o nome da tela (declarado no design system, 17/22 px). As telas capturadas no celular (Álbuns) não têm título próprio; em telas fundas (Editar playlists, Séries por artista) só resta o rótulo de 12 px da barra de baixo, que nomeia a seção e não a tela | Em todas as telas do celular, inclusive /playlists/edit e /artists, o nome da tela aparece no topo ou no conteúdo? S/N | baixo / médio | «nome só na barra de baixo» → «nome da tela no topo (ou o desvio aprovado e escrito no design-system § Barra do topo)» | mjrp-designing-ui / mjrp-defining-design-systems |
| 4 | candidato (fidelidade do comparador) · design-system § Celular › Medidas mínimas | P1 | comparador · 375 e 393 · `.frame` / `fit()` (`k = clientWidth / 393`) | No celular do MJRP o aparelho é desenhado em escala 0,786 (a 375) a ~0,83 (a 393): os rótulos de 12 px aparecem com 9,4–10 px e os alvos de 44 px com 35–37 px. Ele julga legibilidade e toque numa imagem menor que o produto | No celular, há um jeito de ver o nível a 100 % (escala 1, sem moldura) a partir do comparador? S/N | baixo / alto | «só miniatura encolhida» → «miniatura + link "ver em tela cheia" que abre o nível a 1:1» | mjrp-designing-ui |
| 5 | candidato (WCAG 2.2.2 Pausar, parar, ocultar) · design-system § Página de entrada › «Movimento que para sozinho» | P1 | os dois níveis · 1280 e 393 · `.moving .bars i.cur` (animação `infinite`) | Medido: 12 s depois de chegar no app, as 4 barras do item atual seguem animando; não há parada automática nem botão de pausa no app (a home para em 10 s e tem pausa). O menu fica em toda tela | O movimento do menu para sozinho (≤ 5 s ou como a home, 10 s) ou tem controle de pausa? S/N | baixo / médio | «barras do item atual em laço infinito» → «respiram na chegada e param, como a home» | mjrp-designing-ui |
| 6 | MP-01 | P1 | rodada 1 · comparador e `notes.html` | Só dois níveis (Elevar, Transformar); falta o Consolidar e não há registro de por que o eixo ficou com dois, nem o eixo nomeado | Há três níveis no eixo, com o âncora no meio, ou a dispensa do terceiro registrada com data em info-arch.md § Decisões de IA? S/N | baixo / médio | «2 opções, eixo implícito» → «3 opções num eixo nomeado, ou a dispensa escrita» | mjrp-designing-ui |
| 7 | AH-04 | P1 | Transformar · 1280 · painel da conta (`data-act="sp"`, `"am"`, `"clear"`) | Medido: depois de «Conectar» (Spotify) ou «Limpar o cache», o foco cai no `BODY` — quem usa teclado perde o lugar dentro do painel aberto | Depois de conectar, desconectar ou limpar, o foco fica no controle acionado (ou no seu substituto)? S/N | baixo / médio | «foco perdido no re-render» → «foco devolvido ao botão trocado» | mjrp-designing-ui |
| 8 | DE-07 | P2 | Transformar · 393 · `.t-sub` em Álbuns | A sub-linha tem 426 px num espaço de 393 (rolagem escondida); «…em breve» aparece cortado em «em brev». O nível agrupa um só lugar vivo («Séries de álbuns») | Em Álbuns no celular, a sub-linha cabe sem corte, ou some enquanto houver um só lugar vivo? S/N | baixo / baixo | «linha com 1 item vivo + frase cortada» → «sem sub-linha até haver o 2º tipo de série (o "em breve" vai ao painel)» | mjrp-designing-ui |
| 9 | AH-02 | P2 | Transformar · 1280 e 393 · `.t-acct .dots` | As conexões no botão da conta são só dois pontos de 11 px, verde e rosa; o rosa sobre o avatar de fogo dá 1,35:1. O nome está no `aria-label`, não na tela | Quem vê sabe, sem abrir o painel, qual serviço está conectado por algo além da cor? S/N | baixo / baixo | «ponto colorido» → «ponto com a marca do serviço, ou só no painel» | mjrp-designing-ui |
| 10 | IN-03 | P2 | Elevar · 1280 · `.sp-pill .x` | O «×» de desconectar o Spotify tem 40 × 44 px (o resto do menu respeita 44) | O «×» tem ≥ 44 × 44 px? S/N | baixo / baixo | 40 → 44 px | mjrp-designing-ui |
| 11 | AH-04 | P2 | Elevar · 1280 · «Álbuns ▾» (`role="menu"`/`menuitem`) | O papel `menu` promete setas, Home/End; o protótipo só tem Tab e Esc | O menu de Álbuns anda pelas setas, ou usa papel de lista de links (sem `menu`)? S/N | baixo / baixo | «role=menu sem setas» → «setas, ou disclosure com links» | mjrp-designing-ui |
| 12 | DE-02 | P2 | Transformar · 1280 · sem conta | «Entrar» aparece duas vezes: o botão fantasma e o ícone da pessoa, que abre o painel com outro «Entrar» | Sem conta, há um só caminho visível para entrar? S/N | baixo / baixo | «2 portas para o mesmo» → «1» | mjrp-designing-ui |
| 13 | CO-01 | P2 | Transformar · 1280 · `.flipmark` (⟲) | O ⟲ acende em laranja no lado B e não tem nome nem explicação no app; só faz sentido para quem leu a home | O ⟲ tem nome acessível ou legenda, ou sai do app? S/N | baixo / baixo | «símbolo mudo» → «símbolo com nome, ou fora do app» | mjrp-designing-ui |
| 14 | candidato (comparador: mesma condição) | P2 | comparador · 1280 · Referência | Os níveis estão «com conta · Álbuns», mas a Referência no computador cai na captura sem conta (falta `ref-in-albums-d`); a nota diz «(sem conta)» | A Referência mostra o mesmo estado (conta e tela) que os níveis ao lado? S/N | baixo / baixo | «estado diferente» → «captura com conta» | mjrp-designing-ui |
| 15 | candidato (comparador: decisão visível) | P2 | comparador · 375 | O cartão «Recomendada» começa a 1172 px, depois de um aparelho inteiro do Elevar; na primeira tela não se vê qual é a recomendação | A recomendação aparece na primeira tela do celular (na pergunta ou num resumo)? S/N | baixo / baixo | «selo só no 2º cartão» → «uma linha com a recomendação sob a pergunta» | mjrp-designing-ui |

## Check do que falta (Discovery)

- **Nada do que o menu faz hoje se perde** (confere com `TopNav.js`, `SeriesDropdown.js`, `PhoneMenu.js`, `AuthNav.js`, `Footer.js`): logotipo → home, os cinco lugares, séries (álbum; artista, gênero, faixa «em breve»; séries de playlists), novas playlists, Spotify conectar/desconectar, entrar/sair/«Entrou como», limpar o cache com confirmação. Exceção: o nome da tela no celular do Transformar (achado 3). S.
- **Registro do protótipo (W14):** o `info-arch.md` não tem entrada da F88, nem wireframes; `notes.html` aponta para `design/proposals/f88-top-menu/proposal.md`, que não existe. Junto do achado 6 — a descrição tem de nomear a versão julgada antes da aprovação. N.
- **Estados:** sem conta, com conta, Spotify/Apple Music, PT/EN, menu aberto, teclado, movimento reduzido — todos em #estados. Erro de conexão (o Spotify recusa) e carregando a conta não estão desenhados (IN-06, menor num menu; fica para a construção). Parcial.
- **Pesquisa:** não se aplica — ajuste de um componente existente seguindo o padrão da home (rodada 3).

## Medidas

| Medida | Elevar | Transformar |
|---|---|---|
| Alvos no celular (393) | abas 75×56; botão do menu 44×44; linhas da folha 52; PT/EN 44×44; fechar 44×44 | itens da barra de baixo 75×67; conta 44×44; PT/EN 44×44; sub-linha 44 |
| Alvos no computador (1280) | itens 68–101×56; conta 146×44; «×» do Spotify **40×44** | itens 128×52; conta 44×44; linhas do painel 44 |
| Menor texto | 12 px (abas, «Em breve») | 12 px (rótulos da barra de baixo) |
| Contraste (sobre `#0b0b0d` / painel `#141418`) | `#b9b9c2` 10,1:1 · `#fb923c` 8,7:1 · `#a0a0a8` 7,6:1 · desabilitado `#8a8a94` 5,8:1 / 5,4:1 · `#86efac` 13,1:1 · `#1ed760` 9,6:1 | iguais |
| PT/EN | rótulos cabem a 1280 e 393 nos dois idiomas | idem; sub-linha de Álbuns corta a 393 (achado 8) |
| Teclado | Tab, Enter, Esc, volta do foco ao abrir/fechar, prisão do foco na folha: S | idem: S; foco perdido depois de conectar (achado 7) |
| Movimento reduzido | `prefers-reduced-motion` e a chave «Reduzido» desligam tudo; a passagem fica imediata: S | S |
| Comparador a 375 | sem rolagem lateral (375 = 375): S · pergunta única no topo: S · celular primeiro: S · Referência: S · links de passagem, estados e notas: S · recomendada marcada: S (fora da 1ª tela, achado 15) | |

## O que está bom, manter

- A pergunta única do comparador e as três portas secundárias (passagem, estados, notas); o celular abre primeiro.
- A passagem é julgável: a mesma moldura, a home v4 viva por cima da captura, o fogo enchendo na chegada, e o logotipo que volta à home.
- Conta e conexões num painel só, com Apple Music ao lado do Spotify, e «Limpar o cache» saindo do rodapé para um lugar previsível.
- Folha do celular conforme o design system: `role="dialog"`, `aria-modal`, prisão do foco, Esc, volta do foco ao botão.
- Contraste folgado em todo texto; o laranja de texto `#fb923c` só no item atual; o fogo nunca atrás de texto.
- «Pular para o conteúdo», `aria-current="page"` e o foco que acompanha a navegação até o item atual.

## Próximos checks (Discovery)

Ao voltar, a nova passada roda só os checks dos achados 1 a 7 (e os P2 que o autor tocar). Antes da aprovação: a entrada da F88 em `info-arch.md` (versão julgada, níveis, eixo) e o `proposal.md` citado.

## Fora do cânone (candidatos)

- **Fidelidade do comparador no celular** (achado 4) e **mesma condição na Referência** (achado 14): nenhum ID cobre a escala da prévia; fonte: o próprio piso do design system (§ Medidas mínimas) e a regra do MJRP de protótipo fiel no comparador. Vale levar a `reports/harness-feedback/` se repetir.
- **Movimento sem fim no menu** (achado 5): WCAG 2.2, critério 2.2.2 (Pause, Stop, Hide), já usado pelo projeto na home; nenhum ID do cânone o cita.

## O que não pude conferir

- iPhone de verdade (Safari, áreas seguras, toque): só Chrome emulado a 393×852.
- Larguras entre 768 e 1100 px: o protótipo só desenha 393 e 1280; o Transformar põe logotipo, cinco rótulos, PT/EN e conta numa linha só.
- Leitor de tela (VoiceOver): só os nomes e papéis no código.
- As telas de «Novas playlists» e «Séries de playlists» (sem captura).
- As capturas citadas não foram gravadas em `reports/evidence/` e a entrada de revisão não foi escrita em `docs/log.md`: a ordem foi editar só este relatório.
