---
title: Cânone de design
aliases: [design-canon, canone de design, cânone de UX, cânone de UI, ux canon, design canon]
summary: as fontes elevadas que fundamentam UX, UI e conteúdo explicativo no MJRP — organizadas em oito disciplinas com regras de ID estável que as skills citam em vez de recitar
tags: [harness, design, ux, kernel]
status: vivo
atualizado: 2026-10-18
fontes: [few-information-dashboard-design, tufte-visual-display, knaflic-storytelling-with-data, wexler-big-book-of-dashboards, shneiderman-the-eyes-have-it, nngroup-dashboards-preattentive, smashing-dashboard-decluttering, a11y-collective-accessible-charts, sigma-color-blindness, 925studios-whoop-breakdown, sahha-readiness-scores, nielsen-ten-heuristics, krug-dont-make-me-think, cooper-about-face, yablonski-laws-of-ux, google-apple-m3-hig, w3c-wcag-2-2, gigerenzer-risk-communication, case-calm-technology, cdc-clear-communication-index, andrews-info-we-trust, design-council-double-diamond-knapp-sprint, baghai-three-horizons, tmap-crud-test, kaplan-nngroup-empty-states, larson-czerwinski-web-page-design, zaphiris-shneiderman-norman-expandable-indexes, nielsen-nngroup-progressive-disclosure, nngroup-flat-vs-deep-hierarchies, baymard-truncation-design, nngroup-accordions-complex-content, baymard-pagination-infinite-scroll-load-more, munzner-marks-and-channels, nngroup-scrolling-and-attention, han-nacenta-heatmap-digits, nngroup-infinite-scrolling, atlassian-elevation, carbon-accordion, carbon-color-layering, govuk-accordion, govuk-pagination]
---
<!-- kernel do MJRP Harness · versão 2026-11-03 · fonte 79ddf31a1 · cópia derivada: não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->

## Definition
O **cânone de design** é o corpo de referência externo que fundamenta as regras de UX, UI e
conteúdo explicativo do MJRP — 41 fontes fichadas em `docs/wiki/sources/`, organizadas em oito
disciplinas, cada regra com um **ID estável** que as skills de design citam em vez de recitar.
A barra de qualidade não vem do gosto do agente: vem daqui. É **referência inicial, não teto** —
o cânone cresce com o que os projetos-filho descobrem (ver § *Como o cânone evolui*).

> **Por que existe (19/09/2026).** O MJRP, no `mjrp-health-control`: *"hoje acredito que as
> skills mjrp quanto a UX e UI são bem pobres"*. A auditoria de lá (`ux-audit.md`, 36 princípios
> contra as telas) provou que o julgamento é possível — e mostrou que recitar o princípio dentro
> da auditoria incha o documento. Os princípios moram aqui; a auditoria, a skill e o spec **citam
> o ID**.

## What it is

### Como ler as regras

Cada regra tem três partes: **ID** (estável — nunca se renumera; regra retirada fica marcada
*retirada*, o número não é reusado), **a regra** escrita como teste (pass/fail, não direção) e o
**tipo**:

- **produção** — a skill produtora aplica no momento de desenhar; teria mudado o código se
  existisse. É o que `mjrp-designing-ui` e `mjrp-defining-design-systems`
  carregam como checklist.
- **julgamento** — não dá para impor na produção; só se pega na crítica. É o que só a
  `mjrp-critiquing-ux` verifica.

A `mjrp-critiquing-ux` verifica os dois tipos. A fonte de cada regra é a ficha em `docs/wiki/sources/`;
o *porquê* mora lá e nesta página, nunca na skill.

### HI · Hierarquia

| ID | Regra (testável) | Tipo | Fonte |
|---|---|---|---|
| **HI-01** | O maior elemento da tela é o veredito ou a métrica principal — nunca o rótulo de categoria, a marca ou a navegação. Tamanho = importância. | produção | Few; Knaflic; 925 Studios |
| **HI-02** | Toda tela abre com a resposta (BLUF/answer-first): um veredito ou número no topo, antes de qualquer gráfico ou tile. | produção | Knaflic; Wexler; CDC (mensagem principal primeiro) |
| **HI-03** | Marca do produto e categoria têm posição fixa e discreta em todas as telas; não competem com o conteúdo. | produção | Krug (billboard, convenção); Cooper (postura) |
| **HI-04** | Só comprimento e posição 2D codificam quantidade com precisão; cor, área e ângulo são cue secundário — nunca o único canal de magnitude. | produção | NN/g preattentive; Tufte |
| **HI-05** | A atenção é dirigida com um atributo pré-atentivo por vez (cor de destaque única, tamanho ou posição); dois destaques competindo = nenhum destaque. | julgamento | Knaflic; NN/g; Few |
| **HI-06** | Há um elemento de destaque claro por tela (Von Restorff); se tudo é destaque, a regra falha. | julgamento | Yablonski |
| **HI-07** | Cada nível de aninhamento difere do nível-pai em **pelo menos dois canais visuais**, entre: recuo, tamanho ou peso da tipografia, filete ou borda, e degrau de tom. O tom só conta como canal quando o design system não lhe dá outro significado (se o tom é o papel do card, ele não marca nível). Nunca só o matiz. | produção | Munzner (canais separáveis); Carbon (camadas por degrau de luminosidade); Atlassian (o tom também sinaliza estado); Krug (aninhamento = contenção visual); NN/g preattentive e WCAG 1.4.1 (matiz sozinho não basta) · dois canais: decisão da casa — MJRP 2026-10-18 |

### DE · Densidade

| ID | Regra (testável) | Tipo | Fonte |
|---|---|---|---|
| **DE-01** | A visão de monitorar cabe em ~1 viewport, sem rolar; profundidade é *details-on-demand*, não scroll. O primeiro viewport responde à pergunta da tela. Com todos os grupos abertos ("Expandir tudo") e cada "Ver mais" fechado, a visão de um card ou aba de monitoramento não passa da altura que o projeto declara no `design-system.md`; sem declaração, vale a referência de ~3 viewports a 1440×900. | produção | Few (single screen, at a glance); Shneiderman; NN/g scrolling 2018 (a atenção cai depois da terceira tela) · a referência de ~3 viewports: decisão da casa — MJRP 2026-10-18 |
| **DE-02** | Todo pixel que não é dado nem estrutura necessária é removido: gridlines pesadas, bordas, fundos, 3D, ícones decorativos. | produção | Tufte (data-ink); Few (non-data pixels); Smashing |
| **DE-03** | Decluttering não é simplificar o conteúdo: remove-se ruído, não informação. Uma tela pode ser densa e limpa. | julgamento | Smashing; Tufte (elegância) |
| **DE-04** | Nenhuma escolha com mais de ~7 opções visíveis sem agrupamento; nenhum menu ou conjunto de ações sem hierarquia (Hick, Miller). | produção | Yablonski; Krug |
| **DE-05** | Produto multi-domínio começa **overview-first**: uma tela de visão geral com um card por domínio (com sparkline/estado), depois zoom e filtro, depois detalhe. | produção | Shneiderman (mantra); Wexler |
| **DE-06** | Ao adicionar dado novo, abre-se uma porta nova (tela/aba) — não se empilha no mesmo tile. | produção | 925 Studios; Cooper (excise) |
| **DE-07** | Lista longa mostra as primeiras N linhas e um **"Ver mais"** que traz o resto. O projeto declara N no `design-system.md`; sem declaração: 6–10 para lista curta de valores, 10–30 para linhas, e nunca se esconde menos de 2 itens. Um nível novo de aninhamento só existe quando agrupa por um atributo real (juiz, dono, status) — nunca para esconder o tamanho de uma lista. O "Ver mais" é explícito, não rolagem infinita; "Expandir tudo" e a busca continuam funcionando. A contagem do que resta é opcional. | produção | Shneiderman (details-on-demand); Baymard 2014 (truncar com 6–10 valores; nunca um só); Baymard 2016 e NN/g infinite scrolling 2022 ("carregar mais" para achar e comparar); GOV.UK pagination (rolagem infinita e teclado); NN/g accordions 2014 (custo de interação) · N, faixas e "Ver mais" sem contagem: decisão da casa — MJRP 2026-10-18 |
| **DE-08** | Itens julgados em duas dimensões (item × juiz, projeto × status) aparecem como **matriz, mapa de calor ou small multiples** — não como listas aninhadas. Na matriz a célula carrega ícone e palavra além do tom (AH-02); só o tom não basta. | produção | Tufte (small multiples); Munzner (a posição é o canal mais eficaz); Han e Nacenta 2020 (mapa de calor com dígitos acerta mais que só com cor); Sigma (heatmap precisa de número ou rótulo); Shneiderman (dado multidimensional) · a matriz no lugar de lista aninhada é inferência dessas fontes — nenhuma compara os dois: pendente — decisão do MJRP 2026-10-18 (incidente v4.10) |
| **DE-09** | O projeto declara no `design-system.md` quantos níveis uma estrutura aninhada tem; sem declaração: no máximo **3 níveis visíveis** (o container — o card ou a aba — é o nível 0) e **2 níveis de divulgação**, contando o recolher do próprio container como o 1º (o card recolhe e um grupo dentro dele recolhe; um terceiro recolhível dentro do grupo passa da referência). | produção | Zaphiris, Shneiderman e Norman 2002 (profundidade 4 é pior; 2 e 3 aceitáveis); NN/g progressive disclosure 2006 (mais de 2 níveis de divulgação, baixa usabilidade); GOV.UK accordion (mais estrito: nenhum acordeão dentro de acordeão, 1 nível, em página de conteúdo — o projeto declara onde está); Carbon accordion (aninhado = árvore) · limite de 2 e 3: decisão da casa — MJRP 2026-10-18 (Larson e Czerwinski 1998 acharam a profundidade média melhor que a mais rasa: o limite é teto, não meta) |

### CO · Conteúdo explicativo

| ID | Regra (testável) | Tipo | Fonte |
|---|---|---|---|
| **CO-01** | Toda métrica não-óbvia tem definição de uma linha, em linguagem simples, ao lado da métrica — não em glossário separado. | produção | CDC (letramento é do emissor); Andrews |
| **CO-02** | Todo gráfico incomum tem um "como ler" de uma a duas linhas. | produção | Andrews (anotação como guia); Knaflic |
| **CO-03** | O conteúdo explicativo fica **acima** do gráfico ou do número que explica, nunca abaixo nem em tooltip apenas (regra do MJRP, 19/09). | produção | MJRP (health-control Wave 2); CDC (mensagem principal primeiro) |
| **CO-04** | Nenhum número sem referência: baseline, meta, Δ ou micro-tendência (sparkline) ao lado do valor. Número puro é achado. Sparkline é uma *forma* da referência, não regra própria (decisão 21/09, teste da `ux-critic`). | produção | Wexler (KPI com contexto); Few (bullet graph) |
| **CO-05** | Todo número diz o que fazer ou o que significa (CDC item 16): "X — abaixo da sua média; nada a fazer" vale; "X" sozinho não. | produção | CDC; Gigerenzer |
| **CO-06** | Voz ativa, uma ideia por frase, palavra do dia a dia; jargão só com definição inline. | produção | CDC; Krug (omit needless words) |
| **CO-07** | Anotação de insight (o que este gráfico mostra de relevante) aparece no próprio gráfico, não só no texto ao redor. | julgamento | Knaflic; Andrews |
| **CO-08** | O explicativo (CO-01/02/03) tem peso visual de **guia de leitura**, não de rodapé: rótulo/eyebrow, fundo ou borda, cor de texto plena (não *muted*) — o bastante para ser lido antes do gráfico, nunca maior que o veredito (HI-05/06). Explicativo em cor de nota, sem rótulo e sem separação do fundo é achado. | produção | Knaflic (anotação precisa de proeminência); NN/g (hierarquia dirige a leitura); MJRP (health-control R23c, 21/09) |

### CP · Composição

| ID | Regra (testável) | Tipo | Fonte |
|---|---|---|---|
| **CP-01** | Mesmo esqueleto para o mesmo tipo de tela: todos os domínios/seções do mesmo nível usam o mesmo template (zonas, ordem, componentes). | produção | Wexler (consistência entre views); Nielsen H4 |
| **CP-02** | Uma pergunta por tela: a tela responde a uma pergunta declarável em uma frase; se responde a duas, são duas telas. | produção | Wexler (scenario-driven); 925 Studios |
| **CP-03** | Sequência de leitura segue o olho (topo-esquerda → baixo-direita em LTR); o mais importante ocupa o quadrante de entrada. | produção | Few; Krug (scan) |
| **CP-04** | Elementos relacionados agrupados por proximidade e alinhamento; relação que precisa de linha ou caixa para existir é relação mal composta. | produção | Few; Tufte |
| **CP-05** | Small multiples para comparar séries do mesmo tipo — não um gráfico com 8 linhas. | produção | Tufte |
| **CP-06** | Convenção de plataforma antes de invenção: navegação, gestos, alvos e estados seguem Material/HIG; desvio é decisão registrada, não default. | produção | Google/Apple; Krug; Jakob's Law |
| **CP-07** | Fundo escuro ou claro é decisão com função declarada (contexto de uso, paleta), não estética; o design system registra o porquê. | julgamento | 925 Studios; palette-library |

### IN · Interação

| ID | Regra (testável) | Tipo | Fonte |
|---|---|---|---|
| **IN-01** | Overview → zoom & filter → details-on-demand: a interação segue o mantra; detalhe nunca esconde o contexto de onde veio. | produção | Shneiderman |
| **IN-02** | Período/tempo tem controle direto: presets + navegação ‹/› + range; nenhum filtro só por tooltip. | produção | Shneiderman (zoom e filtro como controle direto); Cooper (modeless) |
| **IN-03** | Alvo de toque ≥ 44×44 pt (HIG) / 48×48 dp (Material); WCAG 2.5.8 mínimo 24×24. | produção | Google/Apple; WCAG 2.2 |
| **IN-04** | Resposta < 400 ms ou feedback de progresso visível (Doherty); status do sistema sempre visível (Nielsen H1). | produção | Yablonski; Nielsen |
| **IN-05** | Toda ação destrutiva tem desfazer ou confirmação proporcional ao dano (Nielsen H3, H5); nenhum "delete" a um clique sem saída. | produção | Nielsen; Cooper (forgiveness) |
| **IN-06** | Estados vazio, carregando, erro e offline existem e dizem o que fazer — tela sem estado vazio desenhado é achado. | produção | Nielsen H1, H9; Cooper |
| **IN-07** | Interatividade custa acessibilidade: o estático é o default; interação é camada adicional que não remove o acesso ao dado. | julgamento | A11Y Collective |
| **IN-08** | O fim do fluxo é desenhado com cuidado (Peak-End): a última tela confirma, resume e aponta o próximo passo. | julgamento | Yablonski |
| **IN-09** | Toda entidade que o usuário mantém tem, no protótipo, onde **criar, ver, editar e excluir/inativar** — ou a ausência é decisão escrita. Teste: a matriz entidade × operação (entidades do `data-model.md`) sem célula vazia sem motivo. | produção | TMAP (teste CRUD); Kaplan/NN/g |
| **IN-10** | O protótipo mostra o **primeiro uso com o sistema vazio** — o caminho de "zero" até "pronto para o dia a dia", cada vazio apontando a ação que o preenche. Dado de exemplo pronto esconde esse caminho. | produção | Kaplan/NN/g |

### AH · Acessibilidade e honestidade

| ID | Regra (testável) | Tipo | Fonte |
|---|---|---|---|
| **AH-01** | Contraste ≥ 4.5:1 texto normal, ≥ 3:1 texto grande e componentes de UI (WCAG 1.4.3, 1.4.11). | julgamento | WCAG 2.2; A11Y Collective |
| **AH-02** | Cor nunca é o único diferenciador: rótulo direto, padrão ou forma como redundância (WCAG 1.4.1). Paleta categórica testada para daltonismo. | julgamento | Sigma; A11Y Collective; WCAG |
| **AH-03** | Todo gráfico tem alternativa textual em três níveis: alt de uma frase, resumo do que mostra, tabela de dados acessível. | produção | A11Y Collective; WCAG 1.1.1 |
| **AH-04** | Tudo alcançável por teclado, foco visível, ordem de foco = ordem visual (WCAG 2.1.1, 2.4.7, 2.4.3). | julgamento | WCAG 2.2 |
| **AH-05** | Integridade gráfica: a variação visual é proporcional à variação do dado (lie factor ≈ 1); eixo começa em zero para barras; nenhum 3D. | julgamento | Tufte; NN/g |
| **AH-06** | Precisão honesta: casas decimais limitadas pela qualidade do dado, não pela planilha; incerteza declarada em palavras simples. | produção | Gigerenzer; Andrews |
| **AH-07** | Score composto mostra os fatores, não só a nota; janela, escala e pergunta que ele responde são explícitas. | produção | Sahha; Gigerenzer |
| **AH-08** | Uma cor, um conceito, em todo o produto (consistência semântica); a mesma cor não significa duas coisas. | produção | Sigma; Wexler |

### RC · Comunicação de risco e calm technology

| ID | Regra (testável) | Tipo | Fonte |
|---|---|---|---|
| **RC-01** | Risco em frequência natural ("3 em cada 100"), com denominador fixo e explícito, antes de qualquer percentual. | produção | Gigerenzer |
| **RC-02** | Nunca variação relativa sem a base absoluta ao lado ("+30%" → "de 2 para 3 em cada 1.000"). | produção | Gigerenzer |
| **RC-03** | Classe de referência sempre visível: por pessoa, por dia, por medição — número sem classe é ambíguo por construção. | produção | Gigerenzer |
| **RC-04** | Nenhum resultado apresentado como certeza: margem de erro e falso positivo/negativo fazem parte do valor, não do rodapé. | julgamento | Gigerenzer (ilusão de certeza) |
| **RC-05** | Comparação de opções com trade-off usa o padrão *fact box*: benefícios e danos lado a lado, números absolutos, mesma escala. | produção | Gigerenzer / Harding Center |
| **RC-06** | A tecnologia pede a menor quantidade de atenção possível: o normal vive na periferia; só a exceção vem ao centro. | produção | Case (princípios I, III) |
| **RC-07** | Informar **e** acalmar: alerta é proporcional ao dano e reversível; nenhum alarme para o que não pede ação. Contra a sobrecarga de notificação. | julgamento | Case (princípio II); Gigerenzer |
| **RC-08** | Funciona mesmo quando falha: sem dado, a tela diz o que falta e o que ainda vale, em vez de tela vazia ou número zerado. | produção | Case (princípio VI); Nielsen H9 |
| **RC-09** | Tom não-clínico em dado de saúde: linguagem de bem-estar, sem vermelho/alarme por default; cor de alerta reservada ao que exige ação. | produção | Case; 925 Studios; palette-library (Zen/Calma) |

### MP · Método de produção

As sete disciplinas acima julgam **o artefato**. Esta julga **como ele foi produzido**: as regras de produção
e o checklist são filtros convergentes — matam a opção ruim, não geram a boa. Onde o gosto do humano é o
insumo que decide, entregar uma opção só lê como rigidez (achado do `mjrp-health-control`, 21/09/2026).

| ID | Regra (testável) | Tipo | Fonte |
|---|---|---|---|
| **MP-01** | **Divergir antes de convergir.** Onde a decisão de tratamento visual ou de estrutura tem latitude (mais de uma solução defensável, e o humano decide pelo gosto), a skill produtora entrega **três opções** espalhadas sobre **um eixo nomeado**, igualmente acabadas, com a âncora no meio (o sistema como projetado), nomeadas por intenção — **Consolidar / Elevar / Transformar** — e cada uma com a régua *toca / preserva / arrisca*. O humano escolhe; só a escolhida segue para o checklist e o gate. Sem latitude (tela fechada por template e tokens), uma opção só — três seria teatro. | produção | Design Council (Double Diamond); Knapp (*Sprint*); Baghai, Coley e White (três horizontes) |

Os três níveis, por intenção (do parecer):

    Consolidar
        apertar o que já existe · toca o mínimo · risco quase nulo

    Elevar (a âncora)
        o sistema como projetado · risco baixo

    Transformar
        reenquadrar · toca estrutura ou identidade · arrisca contraste ou calma, exige teste

Cada opção entregue preenche a própria régua de uma linha — o que **toca**, o que **preserva**, o que
**arrisca** — e é a régua, não o nome, que garante que quem produz e quem julga leiam o nível do mesmo jeito.

O extremo Transformar se ancora em fonte (regra viva das skills: buscar antes de assumir), não em
invenção solta.

## O que é opinião de gênero ou de contexto

> **A regra de leitura:** o cânone vale para dashboard, formulário, fluxo e documento. O que só
> vale num gênero é regra de projeto — mora na `constitution.md` ou no `design-system.md` dele.

| O que a fonte diz | Por que não é universal |
|---|---|
| **"Cabe em 1 viewport"** (Few, DE-01) | é regra de *monitoramento*; exploração, leitura longa e formulário rolam por natureza |
| **Fundo escuro** (WHOOP) | opinião de produto; o gênero e a paleta decidem (CP-07) |
| **Um número resume tudo** (WHOOP, Sahha) | funciona em wearable; em finanças ou obra o composto esconde o fator que importa (AH-07 já corrige) |
| **Estático é o default** (A11Y Collective, IN-07) | vale para gráfico publicado; ferramenta de análise é interativa por definição — a regra vira "acessível *também* estático" |
| **Frequências naturais** (Gigerenzer, RC-01) | obrigatório em saúde e finanças; num dashboard de latência, "p95 = 240 ms" é a forma certa |
| **Convenções de 2000** (Krug: web desktop) | o *princípio* (não me faça pensar) é universal; os exemplos de navegação são datados |
| **Postura sovereign/transient** (Cooper) | pré-mobile; em app de bolso a postura muda por contexto, não por produto |

## Como o cânone evolui

O cânone é **referência inicial, não limitante** (MJRP, 19/09/2026). Três mecanismos:

1. **Busca antes de assumir.** Toda skill de design carrega a regra: *quando a necessidade do
   projeto não estiver coberta por um ID daqui, buscar na web se existe fonte elevada para ela
   antes de decidir por conta própria* — e registrar o que achou, inclusive o que decidiu não
   usar (mesma disciplina do tools-catalog). Fonte nova que sustenta regra nova vira ficha em
   `docs/wiki/sources/` e regra com ID aqui. **E a skill também muda** (emenda do MJRP, 19/09): se o
   contexto do projeto revelou conceitos ou regras que ajudam de verdade, a skill se refina com a
   `mjrp-crafting-skills` — o cânone guarda o *o que é*; a skill incorpora o *como* que o projeto
   ensinou. Skill viva aprende nos dois lugares.
2. **Retroalimentação dos projetos-filho.** Achado de UX/UI num projeto-filho entra pela pasta
   `reports/harness-feedback/` dele; o sensor do harness traz para o intake (EP-90 do `prd.md`);
   o que vira regra sobe com o antes/depois como evidência. As cinco primeiras regras assim
   (HI-01, HI-02, DE-05, CO-04, CO-01/CO-03) vieram do `mjrp-health-control`.
3. **Regra retirada não some.** Fica marcada *retirada*, com data e motivo, no `## History`; o
- **2026-10-07 20:29** · Onda E do PDLC em loops (`design/proposals/pdlc-loops-migration-plan.md`): a numeração antiga de fases deu lugar às etapas e ao contrato de [[pdlc-loops]] §11.
   ID não é reusado — a auditoria antiga que o citava continua legível.

## How MJRP uses it

- **Esta página é do kernel** — vai carimbada para dentro de todo projeto em
  `docs/wiki/harness/`, e o I5 do `doctor` confere que chegou e que o carimbo não envelheceu.
- **Lê-se sob demanda.** Quem vai desenhar uma tela, escrever o texto dela ou julgá-la abre;
  as skills de design citam o ID e mandam ler daqui. Nenhuma sessão carrega o cânone inteiro.
- **As skills que citam:** `mjrp-designing-ui` (Explorar e Desenhar — a tela e a descrição dela: HI, DE, CP, IN, MP-01, e o
  texto da tela: CO, AH-06/07, RC), `mjrp-defining-design-systems` (Desenhar, sistema visual — AH-01/02/08, CP-07), `mjrp-critiquing-ux` (tudo, os dois tipos), `mjrp-infographic-designer` (CO, HI,
  AH no toolkit).
- **Quando o cânone e o projeto discordarem, o projeto decide** — desde que a decisão esteja
  escrita na `constitution.md` ou no `design-system.md` dele, e desde que não contrarie um
  princípio do `PRINCIPLES.md`.

## History

> A decisão mora na página do assunto que ela muda, com data (ADR-0008).
- **2026-09-19 14:40** · **A página nasce do EP-07 (Discovery & Prototipação).** Brief aprovado
  pelo MJRP com três emendas: sem checkpoints (iterar depois); reescrever skill datada ou
  limitante está no escopo; o cânone é referência inicial — skills vivas, com regra de buscar na
  web o que não está aqui. 21 fontes fichadas em `docs/sources/` no mesmo turno; 51 regras em
  sete disciplinas; IDs estáveis. Entra no **kernel** por decisão dele (opção entre
  `docs/wiki/` e `docs/wiki/kernel/`). Fonte da estrutura: `design/proposals/design-skills-consolidation-proposal.md`
  v2 e o parecer do `mjrp-health-control` (`docs/harness-feedback/2026-09-19-design-skills.md`).

- **2026-09-21 15:49** · **Primeiro retorno do campo em 48 h.** Dois pareceres do `mjrp-health-control`
  (`docs/wiki/feedback-from-other-projects/2026-09-20-ux-critic-test-run.md` e
  `2026-09-21-co08-explicativo-peso-de-guia.md`): (1) a `mjrp-ux-critic`, rodada do zero por ID,
  redescobriu 12 dos 13 achados da auditoria manual — o cânone e o formato do juiz se sustentam;
  (2) **CO-08 entra** como regra de produção (explicativo com peso de guia) — o defeito só era pego
  no julgamento via HI-05/06, agora nasce certo; a alternativa "emendar CO-03" foi recusada porque
  CO-03 governa *onde* e CO-08 governa *quanto peso*. O gap do sparkline (A7) foi **subsumido em
  CO-04** (sparkline é forma da referência), sem ID novo — opção (a) do parecer.

- **2026-09-27 11:18** · **MP-01 entra: divergir antes de convergir.** Parecer do `mjrp-health-control`
  (`docs/wiki/feedback-from-other-projects/2026-09-21-design-skills-3-niveis-divergencia.md`): o MJRP achou as
  skills de design rígidas — uma resposta "certa" passada pelo checklist, onde a decisão era de gosto. A proposta em
  três níveis (Consolidar / Elevar / Transformar, nomes escolhidos por ele em 21/09) foi demonstrada no color-code
  por domínio e aprovada lá. **Decisão dele (27/09):** vira regra com ID no cânone, numa disciplina nova, MP (método
  de produção), em vez de cláusula na regra viva das skills — para a `mjrp-ux-critic` ter o ID a citar. Duas fichas
  novas: Double Diamond + *Sprint* (divergir/convergir) e os três horizontes (os nomes). As skills refinadas em 22/09
  tinham sido apagadas do Cowork por uma subida do repo; foram refeitas a partir do parecer.
- **2026-09-28 13:15** · **IN-09 e IN-10 entram — completude, não só qualidade do que está na tela.** Parecer do
  `mjrp-pedroso-construction-sw`: protótipo aprovado em três auditorias da `mjrp-ux-critic` sem onde
  criar uma obra; a passada de estrutura feita depois achou mais 12 lacunas. O cânone julgava o que
  está na tela e não perguntava o que falta nela. IN-09 (matriz entidade × operação, fonte TMAP) e
  IN-10 (primeiro uso com o sistema vazio, fonte Kaplan/NN/g); criação ausente de entidade central é
  P0 na critic. A 2c passa a exigir o `info-arch.md` com a matriz e as jornadas — inclusive sobre
  protótipo que já existia (Inception).

- **2026-10-18 12:45** · **Informação densa em vários níveis: HI-07, DE-07, DE-08 entram e DE-01 ganha um orçamento.**
  Incidente do protótipo v4.10 do Control Center: o card de conformidade aberto tinha 121 linhas e, com "Expandir tudo",
  8.985 px a 1440 (18.068 a 390); a crítica de UX marcou a sobrecarga como P1 (DE-01) mas não propôs forma visual
  nenhuma (`apps/control-center/reports/audits/2026-10-18-control-center-v410-ux-review.md`, achado 5). **Decisão do
  MJRP (18/10):** quando a tela tem muita informação em muitos níveis, as skills pensam em solução visual (contraste,
  hierarquia, codificação visual), em vez de listas mais longas e mais aninhamento; e **lista longa usa "Ver mais"** (as
  primeiras N, depois mais) em vez de criar níveis. Regras novas: **DE-07** ("Ver mais" com a contagem; nível novo só
  agrupa por atributo real), **HI-07** (cada nível difere do pai em dois canais visuais, nunca só o matiz), **DE-08**
  (duas dimensões = matriz, heatmap ou small multiples). **DE-01 emendada** com o orçamento medido: expandida, a visão de
  monitoramento fica em ~3 viewports a 1440 px. Fontes: as fichas existentes (Shneiderman, Yablonski, Krug, NN/g, Few,
  Tufte, Sigma); o que nenhuma ficha sustenta ficou marcado *pendente* na própria linha da regra — o limiar de dois canais,
  o orçamento de 3 viewports, "Ver mais" sobre rolagem infinita e a matriz como forma preferida — até haver ficha ou o
  MJRP decidir que a decisão basta. Referência de projeto: o desk de Reports do Control Center já mostra "as primeiras 40
  e Ver os n". As skills `mjrp-designing-ui` (passada de densidade, `reference/dense-information.md`) e
  `mjrp-critiquing-ux` (família de checks de densidade e hierarquia) citam os IDs.

- **2026-10-18 13:20** · **A informação densa, decidida número a número.** Depois do juiz (can-go com correções) e de uma pesquisa
  que trouxe 16 fichas (`docs/wiki/sources/`; cada citação e número reconferido na página), o MJRP decidiu os números, e esta
  entrada **substitui** a anterior nos pontos em que elas divergem. (1) **N** — cada projeto declara no `design-system.md`;
  referência do cânone: 6–10 para lista curta de valores, 10–30 para linhas (Baymard), nunca esconder menos de 2 itens.
  (2) **"Ver mais" sem a contagem** — "(n restantes)" sai do cânone; o projeto pode mostrar a contagem (o Reports do Control Center
  mostra "Ver os n"), mas o cânone não a exige. O argumento: o "Ver mais" explícito vale mais que a rolagem infinita porque o
  total continua à vista e "Expandir tudo" e a busca continuam funcionando (NN/g 2022, Baymard 2016, GOV.UK). (3) **Dois canais
  por nível** — decisão da casa; canais: recuo, tamanho ou peso da tipografia, filete ou borda, degrau de tom; **o tom só conta
  quando o design system não lhe dá outro significado** — no Control Center o tom é o papel do card (o Elevar), então ali
  são recuo, peso e filete; nunca só o matiz. (4) **Níveis** — o projeto declara, a partir da referência: no máximo 2 níveis de
  divulgação e 3 visíveis, com o container em 0 (regra nova **DE-09**; Zaphiris, Shneiderman e Norman 2002 — par revisado:
  profundidade 4 pior, 2 e 3 aceitáveis; NN/g 2006, opinião de especialista; GOV.UK e Carbon); contradição registrada: Larson e
  Czerwinski 1998 acharam a profundidade média melhor que a mais plana — o limite é teto, não meta; menos níveis onde se compara
  ou se lê tudo (orientação, não regra: NN/g accordions, GOV.UK). (5) **Altura** — o projeto declara; referência de ~3 viewports expandida a 1440×900 (âncora: NN/g 2018, 81% da
  atenção nas três primeiras telas, em páginas gerais, não de monitoramento); o primeiro viewport responder à pergunta da tela
  tem apoio. (6) **O gatilho** da passada de densidade e da família de checks é o mesmo nas duas skills: a tela estoura um limite
  que o projeto declarou (N, níveis, altura) ou mostra duas dimensões como listas aninhadas; sem declaração, valem as
  referências do cânone. O que continua *pendente*: a matriz no lugar de lista aninhada (DE-08) — as fontes dão o canal e o
  cuidado com a cor, nenhuma compara matriz com lista. As fichas de Yablonski e de Few saíram das fontes de DE-07 e HI-07 (não
  sustentavam o que a regra diz).

- **2026-10-18 13:45** · **DE-09 sem contradição.** O recolher do próprio container conta como o 1º nível de divulgação: a referência de 2 é "o card
  recolhe e um grupo dentro dele recolhe"; um terceiro recolhível dentro do grupo passa dela. A cláusula "divulgação dentro de
  divulgação não existe" saiu (contradizia o 2). O GOV.UK é mais estrito (nenhum acordeão dentro de acordeão, 1 nível) para página de
  conteúdo; o projeto declara onde está. "Menos níveis onde se compara ou se lê tudo" ficou como orientação, aqui.

## Related
[[engineering-canon]] · [[palette-library]] · [[harness-elements]] · [[terms]] · [[harness-kaizen]] · [[doctor]]
