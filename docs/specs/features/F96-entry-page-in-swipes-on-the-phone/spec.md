---
status: In Progress
lane: fast
solution_type: feature
imports: ["[[S-78-swipe-through-the-entry-page-on-the-phone]]"]
planned_for: "[[ROADMAP#^REL-41]]"
---
# Feature F96: A página de entrada no celular, organizada em swipes
**Approved**: pendente. Em esboço: o MJRP escolheu a versão em 2026-11-23, sobre o protótipo, e pôs a feature na «Priorizada»; faltam duas respostas dele (ver Open Questions).

> **O nome e a pasta são históricos.** A feature nasceu como «organizada em swipes» (dois deslizes). Depois do protótipo, o MJRP escolheu uma página vertical com **um deslize só**, o da caixa «Na caixa do The Album Blender». O título, o identificador e a pasta ficam como nasceram, para não quebrar as ligações; o que vale é o texto abaixo.

> **Via rápida.** O MJRP, 2026-11-23: «tudo em fast lane.» Como o orquestrador leu (interpretação dele, revisável pelo MJRP): vale para o que está sendo trabalhado agora na página de entrada, esta feature e a F95. Na via rápida a construção parte do protótipo que ele escolheu e deste resumo; ele valida olhando a tela; os documentos vêm depois, no passo retroativo, antes de a feature fechar.

## Summary
**A feature:** No celular, a página de entrada (F80) continua vertical, mas arrumada: a abertura mostra a caixa de álbuns na diagonal, sem botão grande; a parte que ensina o app ganha um título próprio; cada passo abre com rótulo, título e texto, e só depois a sua ilustração; os álbuns saem de dentro dos passos e vão para um lugar só, no fim, a caixa «Na caixa do The Album Blender», que é o único trecho que se passa de lado com o dedo.

**Por quê:** O MJRP queria a tela do celular mais limpa e pensou em pôr os passos num carrossel. O especialista de UX e UI mostrou que os cinco passos são a explicação do produto e não devem depender de um gesto; perder um álbum da caixa não custa nada. O MJRP ficou com a versão do especialista e com a abertura da versão dele: «escolho a do especialista, mas com essa landing aqui, muito melhor».

**Como saber que funcionou:** Quem abre a página de entrada no celular vê a caixa na diagonal logo na abertura, lê os cinco passos só rolando a página (cada um com o texto antes da ilustração), e no fim passa os álbuns da caixa de lado. Quem não tem conta consegue abrir o app sem procurar.

## Problem Statement
Dito pelo MJRP em 2026-11-23: «Para a versão mobile, to pensando aqui que em vez de a home ser vertical, se nao seria melhor os passos do que ela ensina, ser em formato de swipe para o usuario como num carrossel com os labels Lado A · 1 — Criar...Lado B · 2 — Inventário. Acho que a experiencia e o unclutter da tela ficariam melhor, o que nosso expert de UX e UI diria? Ah e abaixo do carrossel teria a caixa do The Album Blender em Swipe, aí...aí neste caso, no primeiro swipe teríamos somente o os elementos de UI ilustrativos pra como funcionaria a app.»

E a estrutura, nas palavras dele: «Entao ficaria assim no mobile: 1. Hero/Header com a caixa na diagonal - o botao criar creio que poderia sair, pois já aparece no top nav 2. Swipe 1 - a parte educativa da app 3. Swipe 2 - a parte da caixa do the album blender 4. footer».

Sobre a página de hoje, também dele: «o que está ruim na atual é que o titulo do mapa educativo nao começa logo depois do velvet, fica abaixo, isso teria que ser invertido se for pra continuar vertical e nao ter swipe»; «e talvez ter um titulo apropriado pra essa seção».

**A rodada de protótipo (2026-11-23).** O comparador https://claude.ai/artifact/Qs64Xut1fuKQ6z1Sf8tjTd (ramo `wip/f96-phone-home-prototype`: `design/proposals/f96-phone-home/proposal.md`) mostrou três versões: a de hoje, «A sua» (a que ele descreveu) e «A do especialista». A crítica separada está em `reports/audits/2026-11-23-mjrpalbumblender-v0-f96-phone-home-swipe-ux-audit.md`, no mesmo ramo.

**A escolha do MJRP (2026-11-23)**, com uma captura da abertura da versão «A sua» (sem botão grande, a caixa na diagonal, a legenda com álbum e ano e o botão «Ouça no Apple Music»): «escolho a do especialista, mas com essa landing aqui, muito melhor». E a confirmação: «agora creio com minha decisao só vai ter swipe para a caixa, certo?» (sim).

Como o orquestrador leu a escolha (interpretação dele, revisável pelo MJRP): o corpo da página é o da versão do especialista; a abertura é a da versão dele.

**Quem não tem conta.** O achado mais grave do especialista: sem conta, o alto da tela mostra só «Entrar», e a abertura escolhida não tem botão; nada abriria o app. O orquestrador propôs: «"Entrar" fica no alto; o "Criar" da barra de baixo abre o app em vez de rolar até o passo». O MJRP respondeu «ok», numa mensagem cujo resto tratava de outro assunto («arrume as features do board e sugira a prioridade»). Fica registrado como aceito, com esta ressalva: é a leitura do orquestrador de um «ok» curto.

Fatos conferidos (2026-11-23; só leitura):
- Os rótulos dos passos já existem na página de entrada (`public/splash/copy.js`, na `main`): «Lado A · 1 — Criar», «Lado A · 2 — Álbuns», «Lado A · 3 — Blend», «Lado B · 1 — Playlists», «Lado B · 2 — Inventário».
- A curadoria dos álbuns da caixa está registrada na F95, com o nome «Na caixa do The Album Blender» (escolha do MJRP, 2026-11-23).
- A cena 3D da caixa no celular custa 152 KB a mais na primeira visita, de 378 KB para 533 KB (medido no ramo `fix/f80-crate-animation-break`, `reports/evidence/F80/crate-diagonal-on-phone/results.txt`). No protótipo, a caixa na diagonal é a caixa leve, em CSS, girada 30 graus, sem esse custo.

**Regras de texto, do MJRP (2026-11-23), para tudo o que esta feature escrever:** o produto se chama «The Album Blender», inteiro, nunca «Blender» sozinho («Blend», o nome da tela, fica); em português diz-se «álbum» e «álbuns», nunca «disco» e «discos».

**Prototype**: quick — MJRP, 2026-11-23: pediu o protótipo («traga o prototipo com a minha versao e com uma versao do especialista») e escolheu sobre ele; o comparador é https://claude.ai/artifact/Qs64Xut1fuKQ6z1Sf8tjTd.

## Requirements
- [REQ-01] No celular, a página de entrada é vertical e tem, nesta ordem: a abertura com a caixa de álbuns na diagonal; a parte que ensina o app, sob um título próprio, com os cinco passos; a caixa «Na caixa do The Album Blender»; o rodapé · fixes S-78
- [REQ-02] A abertura não tem botão grande: mostra o título, a caixa na diagonal, a legenda com o álbum e o ano, e o botão «Ouça no Apple Music» · fixes S-78
- [REQ-03] A parte que ensina tem um título próprio, e cada passo abre com o seu rótulo (de «Lado A · 1 — Criar» a «Lado B · 2 — Inventário»), o título e o texto, e só depois mostra a ilustração; os cinco passos se leem só rolando a página, sem gesto de lado · fixes S-78
- [REQ-04] Os álbuns saem de dentro dos passos: cada passo fica com uma ilustração só, e os álbuns aparecem num lugar só, a caixa «Na caixa do The Album Blender» (a curadoria da F95) · fixes S-78
- [REQ-05] A página tem um deslize de lado só, o da caixa, no fim: a ponta do álbum seguinte fica à vista, há setas que se tocam, e nada avança sozinho · fixes S-78
- [REQ-06] Quem não tem conta abre o app a partir da página: «Entrar» continua no alto, e o «Criar» da barra de baixo abre o app em vez de rolar até o passo · fixes S-78
- [REQ-07] A página de entrada no celular segue garantindo o que já garante (S-62): lê-se inteira sem script, nada se move com «reduzir movimento», e as capas reais seguem com o seu crédito · fixes S-78
- [REQ-08] Todo texto desta página diz «The Album Blender» inteiro e, em português, «álbum» e «álbuns» · fixes S-78

## Observable States
A escrever no passo retroativo, do que for construído. Já sabidos pelo protótipo: sem conta e com conta; português e inglês; 390 × 844 e 375 × 667; sem script; com «reduzir movimento».

## Success Criteria
A escrever no passo retroativo.

## Out of Scope
A página de entrada no computador (o MJRP falou só do celular); o que resta da curadoria fora do celular (F95: o selo no computador, as datas ou notas, a escolha dos álbuns no CMS); o menu do alto (F88, F91); as telas do app; um carrossel para os cinco passos (descartado pela escolha de 2026-11-23).

## Open Questions
**Abertas com o MJRP** (pela regra do projeto, feature com pergunta aberta não abre a construção; estas duas só tocam a parte que ensina, a TASK-03):
- **O título da parte que ensina.** Três redações no protótipo: «Como funciona o The Album Blender», «O que o app faz», «O que você faz no The Album Blender».
- **Como marcar a troca de passo.** Três formas no protótipo: rótulo e linha (a recomendada pelo especialista); faixas alternadas de fundo (a ideia do MJRP; quase não se vê em alguns aparelhos); dois lados (o lado B sobre outro tom). As duas últimas pedem uma linha nova no `design-system.md`.

**Fechadas em 2026-11-23:**
- **Dois deslizes ou um.** Um só, o da caixa (o MJRP: «só vai ter swipe para a caixa, certo?»; sim).
- **O botão grande da abertura.** Sai (a abertura é a da versão dele).
- **O que abre o app para quem não tem conta.** «Entrar» no alto e o «Criar» da barra de baixo abrindo o app; aceito com a ressalva escrita no Problem Statement.
- **O que o computador mantém.** Fica como está; a feature é só do celular.
- **O que o especialista diria.** A crítica separada respondeu, e ele ficou com a recomendação dela.
- **A relação com a F95.** No celular, a curadoria é o deslize único desta feature, com o nome «Na caixa do The Album Blender».

**A conferir na construção (não é pergunta para ele):**
- **A caixa na diagonal.** A caixa leve em CSS, girada como no protótipo, serve na página de verdade? Se não servir, a cena 3D custa 152 KB a mais na primeira visita, e aí a escolha volta para ele.
- **O que só o iPhone dele responde** (lista na proposta): o gesto na borda do Safari, descer a página por cima do deslize, o que cabe na primeira tela com as barras do Safari.
