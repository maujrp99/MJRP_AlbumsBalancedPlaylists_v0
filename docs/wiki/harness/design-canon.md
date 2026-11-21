---
title: Cânone de design
aliases: [design-canon, canone de design, cânone de UX, cânone de UI, ux canon, design canon]
summary: as fontes elevadas que fundamentam UX, UI, conteúdo explicativo e copy de site no MJRP — organizadas em dez disciplinas com regras de ID estável que as skills citam em vez de recitar
tags: [harness, design, ux, kernel]
status: vivo
atualizado: 2026-11-07
fontes: [few-information-dashboard-design, tufte-visual-display, knaflic-storytelling-with-data, wexler-big-book-of-dashboards, shneiderman-the-eyes-have-it, nngroup-dashboards-preattentive, smashing-dashboard-decluttering, a11y-collective-accessible-charts, sigma-color-blindness, 925studios-whoop-breakdown, sahha-readiness-scores, nielsen-ten-heuristics, krug-dont-make-me-think, cooper-about-face, yablonski-laws-of-ux, google-apple-m3-hig, w3c-wcag-2-2, gigerenzer-risk-communication, case-calm-technology, cdc-clear-communication-index, andrews-info-we-trust, design-council-double-diamond-knapp-sprint, baghai-three-horizons, tmap-crud-test, kaplan-nngroup-empty-states, larson-czerwinski-web-page-design, zaphiris-shneiderman-norman-expandable-indexes, nielsen-nngroup-progressive-disclosure, nngroup-flat-vs-deep-hierarchies, baymard-truncation-design, nngroup-accordions-complex-content, baymard-pagination-infinite-scroll-load-more, munzner-marks-and-channels, nngroup-scrolling-and-attention, han-nacenta-heatmap-digits, nngroup-infinite-scrolling, atlassian-elevation, carbon-accordion, carbon-color-layering, govuk-accordion, govuk-pagination, rosenfeld-morville-arango-information-architecture, morkes-nielsen-concise-scannable-objective, redish-letting-go-of-the-words, moran-nngroup-tone-of-voice-dimensions, mailchimp-voice-and-tone, handley-everybody-writes, dunford-obviously-awesome, cialdini-influence, w3c-wai-images-tutorial, iso-24495-1-plain-language, brasil-cdc-publicidade, ftc-endorsement-guides]
---
<!-- kernel do MJRP Harness · versão 2026-11-21 · fonte 61d4f2a91 · cópia derivada: não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->

## Definition
O **cânone de design** é o corpo de referência externo que fundamenta as regras de UX, UI e
conteúdo explicativo do MJRP — 53 fontes fichadas em `docs/wiki/sources/`, organizadas em dez
disciplinas (a IA, arquitetura da informação, e a CW, copy de site, desde 2026-11-07), cada regra com um **ID estável** que as skills de design citam em vez de recitar.
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
  `mjrp-critiquing-ux-ui` verifica.

A `mjrp-critiquing-ux-ui` verifica os dois tipos. A fonte de cada regra é a ficha em `docs/wiki/sources/`;
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
| **HI-08** | O `design-system.md` declara, por tema, a **proporção de cor recomendada**, com a cor principal no topo — a que o humano declarou — e a fonte da escolha (data e decisão). Ao lado, como **fato**, vem a medida do protótipo aprovado: cada pixel da página inteira levado à cor mais próxima da paleta, em 1440 e em 390 px. A proporção é recomendação para peça nova, conferida com o humano antes de construir; a medida nunca vira meta, e nenhuma das duas reprova ou muda uma tela já aprovada. **Dois eixos que não se misturam** (emenda de 2026-11-07, F214): o **papel** (a ordem de destaque, a principal primeiro) e a **área** (quanto da tela cada cor ocupa), declarados em linhas separadas, por tema. A cor principal não é necessariamente a de maior área: a base neutra de leitura costuma ser a maior, e uma cor de apoio mais escura pesa mais ao olho (Itten) e fica com menos área que a principal. Teste: a cor principal da proporção escrita é a que o humano declarou, a ordem de destaque não foi lida como ordem de área, e nenhuma tela aprovada foi mudada para chegar à proporção. | produção | Origem do formato: a proporção 60-30-10 do design de interiores, com variantes de quatro níveis (como 70/20/5/5), o Material (cor por papel, sem percentuais) e Itten (proporção pelo brilho de cada cor) — referências de fora, ainda sem ficha; o cânone só tinha o acento, em HI-05 e HI-06 · a recomendação como intenção do humano, separada da medida do aprovado: decisão do MJRP 2026-11-06 (MJRPpersonal) |

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
| **CO-04** | Nenhum número sem referência: baseline, meta, Δ ou micro-tendência (sparkline) ao lado do valor. Número puro é achado. Sparkline é uma *forma* da referência, não regra própria (decisão 21/09, teste da `ux-critic`). Quando a vista mostra só parte do universo que o filtro casa (um mapa em que só alguns itens têm lugar), a tela mostra os dois números, diz por quê e aponta o caminho para ver os outros; total que diz um número enquanto a tela mostra outro, sem explicar, é achado. | produção | Wexler (KPI com contexto); Few (bullet graph); RC-03 (classe de referência) · o subconjunto da vista: MJRPpersonal 2026-11-06 («2 na floresta · 18 acesos»), emenda de 2026-11-07 |
| **CO-05** | Todo número diz o que fazer ou o que significa (CDC item 16): "X — abaixo da sua média; nada a fazer" vale; "X" sozinho não. | produção | CDC; Gigerenzer |
| **CO-06** | Voz ativa, uma ideia por frase, palavra do dia a dia; jargão só com definição inline. | produção | CDC; Krug (omit needless words) |
| **CO-07** | Anotação de insight (o que este gráfico mostra de relevante) aparece no próprio gráfico, não só no texto ao redor. | julgamento | Knaflic; Andrews |
| **CO-08** | O explicativo (CO-01/02/03) tem peso visual de **guia de leitura**, não de rodapé: rótulo/eyebrow, fundo ou borda, cor de texto plena (não *muted*) — o bastante para ser lido antes do gráfico, nunca maior que o veredito (HI-05/06). Explicativo em cor de nota, sem rótulo e sem separação do fundo é achado. | produção | Knaflic (anotação precisa de proeminência); NN/g (hierarquia dirige a leitura); MJRP (health-control R23c, 21/09) |
| **CO-09** | Texto feito para uma pessoa ler: um assunto por parágrafo; linha em branco entre blocos; cada rótulo (`**Campo**: valor`) em sua linha própria; itens numa lista, com a fonte ao lado de cada um que cita algo. Texto corrido quebrado à mão continua um parágrafo só. | julgamento | MJRP (UAT-485, 2026-11-04: a ADR lida grudada; F177) |
| **CO-10** | Texto com `text-transform: uppercase` (ou caixa alta digitada) que contém um nome de marca com caixa própria deixa o nome fora da transformação. Teste: a marca aparece na grafia oficial em toda tela, também dentro de rótulo em caixa alta. | produção | MJRPpersonal 2026-11-06 (pedido do MJRP: «com K maiúsculo, nao está maiusculo em todos os lugares»; «FOUNDER · ZenKraft ENTERPRISES»); sem fonte externa |

### CW · Copy de site

O texto que apresenta e vende um site: posicionamento, prova, chamada, descrição de serviço e de projeto, texto alternativo.
Complementa o CO (o texto que explica um dado na tela); a skill que produz é a `mjrp-copywriting`. As fontes estão no
`README.md` das fichas, § *Fichas do copy de site*.

| ID | Regra (testável) | Tipo | Fonte |
|---|---|---|---|
| **CW-01** | Cada linha de copy proposta abre dizendo que tipo de texto é, onde aparece e quem a lê, antes das opções (o texto alternativo diz que só o leitor de tela o lê). | produção | Redish (conteúdo é conversa com quem lê); ISO 24495-1 (relevante); MJRP (S-216: não entendeu propostas sem isso) |
| **CW-02** | Título, subtítulo e descrições de serviço respondem à mesma frase de posicionamento — para quem, contra que alternativa real, com que atributo único, entregando que valor. Opção que serve a qualquer empresa é achado. | produção | Dunford (as alternativas reais antes da categoria e do slogan) |
| **CW-03** | Nenhuma afirmação de superioridade sem fato: «o melhor», «líder», «inovador», «excelência», «soluções completas» saem; o fato que as sustentaria entra no lugar. | produção | Morkes e Nielsen (o texto promocional perde em quase toda medida); Mailchimp (cortar o exagero); Handley |
| **CW-04** | A mensagem principal vem primeiro, numa frase; uma ideia por frase; o título e a chamada carregam a palavra que o visitante procura. | produção | Morkes e Nielsen (conciso e escaneável); Redish (comece pela mensagem-chave); ISO 24495-1 (encontrável) |
| **CW-05** | Toda prova (número, cliente, resultado, prêmio) tem o dado que a sustenta, guardado e mostrado a quem aprova; sem ele, a afirmação sai do texto e vira pergunta. Número que o dono disse não valer mais não entra, nem arredondado. | produção | CDC arts. 36 e 38 (o dado guardado; o ônus da prova é de quem anuncia); FTC 16 CFR 255.2 (sustentação); Handley |
| **CW-06** | Depoimento é a opinião real de quem o deu, nas palavras dela quando aparece como citação; resultado fora do comum não se apresenta como o esperado; a competência de quem endossa é a verdadeira. | produção | FTC 16 CFR 255.1–255.3; Cialdini (prova social e autoridade verdadeiras) |
| **CW-07** | Persuasão só com o que existe: prova social, autoridade e escassez apontam um fato verdadeiro; urgência, escassez ou omissão que induz a erro são achado. | julgamento | Cialdini (o uso honesto aponta, o desonesto fabrica); CDC art. 37 (enganosa também por omissão) |
| **CW-08** | A voz é uma por marca e constante; o tom muda com o estado de quem lê. A proposta declara a voz e de onde a leu — nas quatro dimensões (formal↔casual, sério↔engraçado, respeitoso↔irreverente, objetivo↔entusiasmado) e com palavras de antitom quando o projeto as tiver. | produção | Moran (NN/g); Mailchimp (voz constante, tom que muda); Handley (a voz definida de propósito) |
| **CW-09** | A chamada diz a ação e o que a pessoa ganha; o texto de um link faz sentido sozinho ou com o contexto imediato — «clique aqui» e «saiba mais» sozinhos são achado. | produção | WCAG 2.4.4 (propósito do link no contexto); Redish (o link diz para onde vai) |
| **CW-10** | O texto alternativo segue o tipo da imagem: informativa → o significado, numa frase curta; decorativa ou repetida no texto ao lado → vazio (`alt=""`); funcional → a ação ou o destino; com texto → o texto; complexa → uma frase e a informação completa na página. Sem «imagem de». | produção | W3C WAI Images Tutorial e a árvore de decisão; WCAG 1.1.1 |
| **CW-11** | O texto alternativo é escrito olhando a imagem que a página publica, e diz «dados de exemplo» só quando os dados são inventados; dado pessoal real exposto numa imagem é pergunta ao dono, salvo se ele já aprovou mostrá-lo. | produção | W3C WAI (transmitir o que a imagem mostra); MJRP (F204, rodada real: 3 de 6 textos descreviam outra tela) |
| **CW-12** | Linguagem simples se mede pelo uso — o leitor acha, entende e consegue agir —, nunca por fórmula de legibilidade. | julgamento | ISO 24495-1; CDC Clear Communication Index |
| **CW-13** | Um nome (antigo empregador, cliente, quem recomendou) só entra no texto quando o dono pode citá-lo: sem acordo de confidencialidade ou de saída que o impeça, e a recomendação pública, nunca a mensagem privada. Sem saber, a opção evita o nome e a linha pergunta. | produção | FTC 16 CFR 255.1 (o endosso é de quem o deu, como ele o deu); decisão do agente, revisável pelo MJRP (nenhuma ficha cobre a confidencialidade) |

### CP · Composição

| ID | Regra (testável) | Tipo | Fonte |
|---|---|---|---|
| **CP-01** | Mesmo esqueleto para o mesmo tipo de tela: todos os domínios/seções do mesmo nível usam o mesmo template (zonas, ordem, componentes). | produção | Wexler (consistência entre views); Nielsen H4 |
| **CP-02** | Uma pergunta por tela: a tela responde a uma pergunta declarável em uma frase; se responde a duas, são duas telas. | produção | Wexler (scenario-driven); 925 Studios |
| **CP-03** | Sequência de leitura segue o olho (topo-esquerda → baixo-direita em LTR); o mais importante ocupa o quadrante de entrada. | produção | Few; Krug (scan) |
| **CP-04** | Elementos relacionados agrupados por proximidade e alinhamento; relação que precisa de linha ou caixa para existir é relação mal composta. Exemplo: num bloco de número grande com explicação, o número, a explicação e o título do grupo dividem o mesmo eixo de alinhamento; número centralizado com a explicação à esquerda falha. | produção | Few; Tufte · o exemplo: MJRPpersonal 2026-11-06 (decisão do MJRP entre três prévias: «Número e texto no centro») |
| **CP-05** | Small multiples para comparar séries do mesmo tipo — não um gráfico com 8 linhas. | produção | Tufte |
| **CP-06** | Convenção de plataforma antes de invenção: navegação, gestos, alvos e estados seguem Material/HIG; desvio é decisão registrada, não default. | produção | Google/Apple; Krug; Jakob's Law |
| **CP-07** | Fundo escuro ou claro é decisão com função declarada (contexto de uso, paleta), não estética; o design system registra o porquê. | julgamento | 925 Studios; palette-library |
| **CP-08** | Tipografia usa a escala e os papéis declarados no `design-system.md` (por exemplo display, headline, title, body, label) e poucas famílias; nenhum tamanho ou família fora deles. A razão da escala é convenção, não regra. Teste: cada tamanho e família da tela mapeia a um papel declarado. | produção | Apple HIG Typography (limitar famílias; hierarquia por peso, tamanho e cor); material-web Typography (papéis como tokens) · `visual-foundations.md` § Escala |
| **CP-09** | Um título de display declara os grupos de palavras que não se separam (`white-space: nowrap` por grupo) e quebra só entre eles. O tamanho do display não é reduzido para caber numa linha. Teste: nenhuma linha quebra dentro de um grupo e o tamanho nunca cai abaixo do declarado no CP-08 para caber. | produção | CP-08 (escala declarada) · os grupos inquebráveis: MJRPpersonal 2026-11-06 (o MJRP desfez a fonte menor no computador: «acho que vamos ter que quebrar mesmo») |

### IN · Interação

| ID | Regra (testável) | Tipo | Fonte |
|---|---|---|---|
| **IN-01** | Overview → zoom & filter → details-on-demand: a interação segue o mantra; detalhe nunca esconde o contexto de onde veio. Do detalhe, a volta (o link de volta ou o voltar do navegador) reabre o contexto do jeito que estava: a mesma escolha, a mesma forma de ver e o mesmo zoom. O estado viaja no endereço, e o link de volta só aceita destino do próprio site. | produção | Shneiderman · a volta que preserva o estado: MJRPpersonal 2026-11-06 (pedido do MJRP: «qdo clicar no livro poder voltar para a constelação com a seleção feita»), emenda de 2026-11-07 |
| **IN-02** | Período/tempo tem controle direto: presets + navegação ‹/› + range; nenhum filtro só por tooltip. | produção | Shneiderman (zoom e filtro como controle direto); Cooper (modeless) |
| **IN-03** | Alvo de toque ≥ 44×44 pt (HIG) / 48×48 dp (Material); WCAG 2.5.8 mínimo 24×24. | produção | Google/Apple; WCAG 2.2 |
| **IN-04** | Resposta < 400 ms ou feedback de progresso visível (Doherty); status do sistema sempre visível (Nielsen H1). | produção | Yablonski; Nielsen |
| **IN-05** | Toda ação destrutiva tem desfazer ou confirmação proporcional ao dano (Nielsen H3, H5); nenhum "delete" a um clique sem saída. | produção | Nielsen; Cooper (forgiveness) |
| **IN-06** | Estados vazio, carregando, erro e offline existem e dizem o que fazer — tela sem estado vazio desenhado é achado. | produção | Nielsen H1, H9; Cooper |
| **IN-07** | Interatividade custa acessibilidade: o estático é o default; interação é camada adicional que não remove o acesso ao dado. | julgamento | A11Y Collective |
| **IN-08** | O fim do fluxo é desenhado com cuidado (Peak-End): a última tela confirma, resume e aponta o próximo passo. | julgamento | Yablonski |
| **IN-09** | Toda entidade que o usuário mantém tem, no protótipo, onde **criar, ver, editar e excluir/inativar** — ou a ausência é decisão escrita. Teste: a matriz entidade × operação (entidades do `data-model.md`) sem célula vazia sem motivo. | produção | TMAP (teste CRUD); Kaplan/NN/g |
| **IN-10** | O protótipo mostra o **primeiro uso com o sistema vazio** — o caminho de "zero" até "pronto para o dia a dia", cada vazio apontando a ação que o preenche. Dado de exemplo pronto esconde esse caminho. | produção | Kaplan/NN/g |
| **IN-11** | Um link ou botão cujo rótulo nomeia um subconjunto («Ver os 21 resumos abertos») abre a lista com o filtro já aplicado e visível. Teste: o clique chega à lista só com o subconjunto prometido; abrir a lista inteira falha. | produção | CO-05 (o número diz o que fazer; aqui a ação prometida chega cumprida) · MJRPpersonal 2026-11-06 (ressalva do MJRP à sinopse: «qdo clico pra ver os 21 livros ele volta pra estante mas sem os 21 livros com resumo estarem selecionados») |
| **IN-12** | Com filtro ativo, o que não casa recua (opacidade de 10% ou menos) sem mudar de lugar. Num grafo, todo nome sem nenhum item aceso e toda linha que chega a um item apagado recuam junto. Teste: não sobra aceso um rótulo ou uma linha que não leva a nada aceso, e nenhum item muda de posição ao filtrar. | produção | DE-03 (remove-se ruído, não informação) · o efeito em cascata do filtro e a constância de posição, para o mapa mental não se perder: MJRPpersonal 2026-11-06 (pedido do MJRP: «seria legal “apagar” tudo que nao for selecionado, hj parece que atua somente no nós») |
| **IN-13** | Num mapa com níveis, a 100% de zoom só os rótulos do primeiro nível aparecem; cada nível mais fundo aparece a partir de um limiar de zoom declarado. Nomes e linhas mantêm o tamanho na tela e os pontos crescem devagar. Teste: a 100%, rótulos de dois níveis não competem. | produção | IN-01 (overview first); DE-04 (agrupar antes de listar) · o zoom semântico: Perlin e Fox 1993 (Pad), referência de fora ainda sem ficha · MJRPpersonal 2026-11-06 (pedido do MJRP: as categorias primeiro, as subcategorias com o zoom) |
| **IN-14** | Num mapa ou gráfico embutido numa página que rola, a roda do mouse sem modificador não é capturada: a página rola. O zoom fica com a pinça, Ctrl ou ⌘ com a roda, botões e duplo clique, e uma legenda no canto diz isso. Teste: rolar com a roda sobre o mapa rola a página. | produção | CP-06 (convenção de plataforma) · a referência de fora é o `gestureHandling: 'cooperative'` da Google Maps JavaScript API, ainda sem ficha |
| **IN-15** | Um grafo com centenas de pontos não aparece em tela de celular: vira a lista dos mesmos grupos, que abre e fecha, e o item tocado abre a mesma ficha numa folha de baixo (padrão **grafo em lista com folha de baixo**). Teste: no celular não existe o grafo em miniatura sem como tocar um ponto de 44 pt. | produção | IN-03 (alvo de 44 pt); IN-07 (o estático é o padrão) · MJRPpersonal 2026-11-06 (a Constelação, no mesmo modelo do mapa da wiki do Control Center) |
| **IN-16** | Ao arrastar um item numa lista ou num Kanban: o item sobe e um espaço marcado mostra onde cai; os vizinhos deslizam para abrir o espaço (técnica FLIP) em vez de saltar; o número de ordem pulsa ao mudar; Esc desfaz; no toque é preciso segurar antes de arrastar. Existe sempre a alternativa sem arrastar (↑, ↓ e «Mover para»). Teste: sem a alternativa, ou com vizinhos que saltam, falha. | produção | AH-04 (teclado); WCAG 2.2 SC 2.5.7 (Dragging Movements) · FLIP (Paul Lewis) e as diretrizes do Pragmatic drag and drop (Atlassian): referências de fora ainda sem ficha · MJRPpersonal 2026-11-06 (pedido do MJRP: dar «efeito que está empurrando pra cima e pra baixo os items») |

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
| **AH-09** | Toda cor de superfície, texto, acento e status vem de um papel declarado no `design-system.md`, não de valor solto; a mesma cor não faz dois papéis (separador como texto, rótulo secundário como fundo). Teste: nenhuma cor na tela sem papel nomeado. | produção | Apple HIG Color (cor por papel); `visual-foundations.md` § Papéis |
| **AH-10** | Em modo claro e escuro cada papel de cor mantém o mesmo significado e passa em AH-01; o escuro não é a inversão do claro e não se justifica como ganho de legibilidade. Teste: o par de capturas tem os mesmos papéis e contraste medido ≥ 4.5:1 nas duas aparências. | julgamento | WCAG 1.4.3; Apple HIG Dark Mode; Piepenbrock 2013; Sethi e Ziat 2023 (`visual-foundations.md` § Modo escuro) |
| **AH-11** | Texto aguenta o uso: na web amplia a 200% sem perder conteúdo ou função e reflui a 320 px CSS de largura (tabela de dados e diagrama isentos); em app nativo nenhum texto fica abaixo do mínimo da plataforma (iOS e iPadOS 11 pt, macOS 10 pt). | julgamento | WCAG 1.4.4 e 1.4.10; Apple HIG Typography |
| **AH-12** | Texto corrido (três ou mais linhas) tem linha de até ~80 caracteres e entrelinha ≥ 1,5; nível AAA do WCAG, adotado como piso de legibilidade, não como ótimo comprovado. Nenhum texto corrido usa `text-align: justify` (abre vãos desiguais numa coluna estreita, e a web não garante a hifenização); a frase que é uma ideia só fica num parágrafo, sem `<br>` dentro, com `text-wrap: pretty`. | julgamento | WCAG 1.4.8; Butterick, *Practical Typography* («Justified text»: só com hifenização); evidência de linha curta ou longa é mista (Ling e van Schaik 2006: `visual-foundations.md` § Legibilidade) · piso: decisão do agente, revisável pelo MJRP · sem justificado e sem quebra manual: MJRPpersonal 2026-11-06 (o MJRP recusou a quebra manual: «achei que com a quebra ficaria mellhor [...] mas ficou pior»), emenda de 2026-11-07 |

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

### IA · Arquitetura da informação

Os quatro sistemas de Rosenfeld, Morville e Arango (organização, rotulagem, navegação e busca) e o tripé de onde nasce cada decisão — contexto, conteúdo e usuários. As regras julgam o `info-arch.md` e a tela que ele descreve. São todas de produção: a `mjrp-designing-ui` as escreve no `info-arch.md`, e a `mjrp-critiquing-ux-ui` as confere.

| ID | Regra (testável) | Tipo | Fonte |
|---|---|---|---|
| **IA-01** | Cada seção do Sitemap do `info-arch.md` declara o seu **esquema de organização** — exato (alfabético, cronológico, geográfico) ou ambíguo (por assunto, tarefa ou público) — e qual, um por nível. Teste: nenhuma seção do Sitemap sem esquema nomeado, e nenhum nível com dois esquemas misturados. | produção | Rosenfeld, Morville e Arango 2015 (sistemas de organização) · onde apareceu: a estante do MJRPpersonal (categoria, estágio, ordem de leitura) |
| **IA-02** | Um conceito tem **um rótulo só** em todas as telas e em todos os idiomas do produto — no menu, nos títulos, nos botões e nos links. O `info-arch.md` mantém a lista dos rótulos. Teste: nenhum conceito com dois nomes («Depoimentos» no menu e «Recomendações» no admin) e nenhum rótulo de tela fora da lista. | produção | Rosenfeld, Morville e Arango 2015 (sistemas de rotulagem); CO-06 (palavra do dia a dia) · MJRPpersonal 2026-11-07 (decisão do MJRP: «Remover», nunca «Tirar») |
| **IA-03** | Cada modelo de página declara a navegação **global, local e contextual**. O projeto declara no `info-arch.md` a partir de quantas páginas a navegação **suplementar** (mapa do site, índice ou busca) passa a ser exigida; sem a declaração, a decisão de ter ou não ter uma fica escrita, com o motivo. Teste: nenhum modelo sem as três; nenhum produto sem a decisão sobre a suplementar. | produção | Rosenfeld, Morville e Arango 2015 (sistemas de navegação) · onde apareceu: o rodapé completo e a faixa das etapas nas páginas de caso do MJRPpersonal · o limiar declarado pelo projeto, não fixado aqui: o livro não dá número |
| **IA-04** | Um produto com busca declara no `info-arch.md` **o que entra no índice, a forma do resultado e o estado sem resultado** (que diz o que fazer, IN-06). Teste: as três declarações existem para cada busca do produto. | produção | Rosenfeld, Morville e Arango 2015 (sistemas de busca) · onde apareceu: a busca do Jardim no MJRPpersonal |
| **IA-05** | As categorias e subcategorias vêm de um **mapa declarado**; um sinônimo leva ao termo do mapa. Teste: nenhuma categoria na tela fora do mapa, e a busca por um sinônimo chega ao termo do mapa. | produção | Rosenfeld, Morville e Arango 2015 (vocabulários controlados, ligados à rotulagem) · onde apareceu: a regra do MJRP de só usar as subcategorias dos mapas dele (MJRPpersonal) |

### MP · Método de produção

As oito disciplinas acima julgam **o artefato**. Esta julga **como ele foi produzido**: as regras de produção
e o checklist são filtros convergentes — matam a opção ruim, não geram a boa. Onde o gosto do humano é o
insumo que decide, entregar uma opção só lê como rigidez (achado do `mjrp-health-control`, 21/09/2026).

| ID | Regra (testável) | Tipo | Fonte |
|---|---|---|---|
| **MP-01** | **Divergir antes de convergir.** Onde a decisão de tratamento visual ou de estrutura tem latitude (mais de uma solução defensável, e o humano decide pelo gosto), a skill produtora entrega **três opções** espalhadas sobre **um eixo nomeado**, igualmente acabadas, com a âncora no meio (o sistema como projetado), nomeadas por intenção — **Consolidar / Elevar / Transformar** — e cada uma com a régua *toca / preserva / arrisca*. O humano escolhe; só a escolhida segue para o checklist e o gate. Sem latitude (tela fechada por template e tokens), uma opção só — três seria teatro. **A forma muda com o momento** (emenda de 2026-11-07, F214): na **primeira rodada do redesenho** de uma tela que o humano já usa, o eixo é a ambição, com **dois** níveis, Elevar e Transformar, e a **tela de hoje** como âncora («Referência», no lugar do «sistema como projetado»), sem perguntar o tamanho; Consolidar entra só quando apertar o que existe responde ao pedido. Num **elemento novo** dentro de uma direção já escolhida, os **três** níveis. Numa **dúvida visual** dentro do nível escolhido, **duas ou três prévias** num eixo. Variantes soltas, sem eixo nomeado, falham em todos os casos. | produção | Design Council (Double Diamond); Knapp (*Sprint*); Baghai, Coley e White (três horizontes) |

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
   ID não é reusado — a auditoria antiga que o citava continua legível.

## How MJRP uses it

- **Esta página é do kernel** — vai carimbada para dentro de todo projeto em
  `docs/wiki/harness/`, e o I5 do `doctor` confere que chegou e que o carimbo não envelheceu.
- **Lê-se sob demanda.** Quem vai desenhar uma tela, escrever o texto dela ou julgá-la abre;
  as skills de design citam o ID e mandam ler daqui. Nenhuma sessão carrega o cânone inteiro.
- **As skills que citam:** `mjrp-designing-ui` (Explorar e Desenhar — a tela e a descrição dela: HI, DE, CP, IN, MP-01, a arquitetura da informação no `info-arch.md`: IA, e o
  texto da tela: CO, AH-06/07, RC), `mjrp-defining-design-systems` (Desenhar, sistema visual — AH-01/02/08, CP-07, HI-08), `mjrp-critiquing-ux-ui` (tudo, os dois tipos), `mjrp-infographic-designer` (CO, HI,
  AH no toolkit), `mjrp-copywriting` (o copy de site: CW, com CO-06 e AH-03).
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

- **2026-10-07 20:29** · Onda E do PDLC em loops (`design/proposals/pdlc-loops-migration-plan.md`): a numeração antiga de fases deu lugar às etapas e ao contrato de [[pdlc-loops]] §11.
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
- **2026-11-04 23:58** · **CO-09: texto para pessoa ler tem linha e parágrafo** (UAT-485, F177). O MJRP mostrou a gaveta da ADR com o cabeçalho grudado; a tela já desenha cada rótulo em sua linha. O que o cânone passa a exigir é a forma do texto que se escreve: um assunto por parágrafo, espaço entre blocos, lista para item. Sem sensor: um parágrafo por assunto é juízo, e a máquina só contaria linhas, o que não diz isso.

- **2026-11-04 12:33** · a cor e a tipografia não tinham regra testável → AH-09 a AH-12 e CP-08 (papéis de cor, modo escuro, ampliação e linha, escala tipográfica), cada uma com a fonte aberta em `visual-foundations.md` (F174). Nenhuma assenta em «cor = emoção», que fica na página como pesquisa e contexto.
- **2026-11-07 08:57** · **As lições de design do MJRPpersonal entram (F200).** Dois relatórios do projeto filho, lidos inteiros:
  `reports/harness-feedback/2026-11-06-mjrppersonal-personal-design-lessons.md` (30 lições, três comparadores de tela e a decisão do MJRP de 2026-11-03 a 06) e
  `reports/harness-feedback/2026-11-07-mjrppersonal-information-architecture-source.md` (Rosenfeld, Morville e Arango). **Entram:** HI-08 (proporção de cor como
  recomendação, a medida do aprovado como fato); CO-10 (marca em caixa alta); CP-09 (título que quebra entre grupos de palavras); IN-11 a IN-16 (o botão que nomeia um
  subconjunto, o filtro que apaga sem reorganizar, o zoom por camadas, a roda que rola a página, o grafo em lista no celular, o arrastar que mostra para onde vai);
  e a disciplina nova **IA** (IA-01 a IA-05), com a ficha `2015-rosenfeld-morville-arango-information-architecture.md`, que sobe a contagem para 42 fontes e nove
  disciplinas. **Emendas na mesma linha:** IN-01 (a volta preserva o estado), CO-04 (a vista que mostra só parte do universo mostra os dois números), CP-04
  (número e explicação no mesmo eixo), AH-12 (sem texto justificado nem quebra manual). **Decidido pelo agente, revisável pelo MJRP:** IA vira disciplina própria em
  vez de IDs espalhados em CO, CP e IN, porque as cinco regras vêm de uma fonte só e o `info-arch.md` as reúne; o limiar de páginas da IA-03 fica a cargo do projeto
  (o livro não dá número). As referências de fora das regras novas (Itten, FLIP, Pragmatic drag and drop, Google Maps, Perlin e Fox) estão marcadas *ainda sem ficha*.
  Fora do cânone, nas skills: a comparação de versões, a prévia, a revisão de texto e o vocabulário (`mjrp-designing-ui`), as checagens de manutenção do protótipo
  (`mjrp-critiquing-ux-ui`) e o registro de decisão de identidade no log (`mjrp-saving-context`).

- **2026-11-07 09:54** · **Nasce a disciplina CW · Copy de site** (F204, S-216). O MJRP devolveu a skill `mjrp-copywriting` antes do merge: «a 204 precisa mesmo ser devolvida e baseada em fontes externas, me diga quais foram». Onze fontes novas fichadas (Morkes e Nielsen, Redish, Moran, Mailchimp, Handley, Dunford, Cialdini, W3C WAI, ISO 24495-1, CDC arts. 36–38, FTC 16 CFR 255), mais a WCAG 2.2, o CDC Clear Communication Index e Krug, já fichados: doze regras, CW-01 a CW-12. A disciplina entra nesta página, e não num cânone de copy à parte, porque esta já viaja no kernel e um arquivo novo pediria mudar a lista do kernel (decidido pelo agente, revisável pelo MJRP). Sem sensor novo: a forma da proposta já tem juiz (`copy_proposal_check.py`, na skill), que cobra CW-01, CW-05, o tipo da imagem de CW-10 e o teto do texto alternativo.

- **2026-11-07 11:39** · **CW-13: citar um nome só quando se pode** (F204, revisão independente da skill, P1-6). A regra de nome que a `mjrp-copywriting` já trazia não tinha ID nem fonte; entra com a FTC (o endosso é de quem o deu) e, na parte da confidencialidade, como decisão do agente, revisável pelo MJRP. Os números do título da aba e da descrição para busca saem da skill: nenhuma fonte fichada os dá.

- **2026-11-07 14:15** · **Duas emendas da F214 (S-222): a MP-01 e a HI-08.** O how-to da sessão Designer do `MJRPpersonal`, aprovado pelo MJRP, trouxe duas lições que divergiam do cânone. **MP-01 × B5 (dois níveis de ambição):** não é contradição, é a forma que a MP-01 toma na primeira rodada de um redesenho — o humano pediu um redesenho, apertar o que existe raramente responde, e a tela de hoje, posta como «Referência», faz o papel da âncora; o padrão se repetiu fora do filho (a F205, as telas do iPhone, escolheu Transformar na primeira olhada). Os três níveis ficam para o elemento novo numa direção escolhida, e as prévias, para a dúvida visual. **HI-08 × A6 (proporção como recomendação), refinada pelo MJRP em 2026-11-07:** o papel e a área são eixos diferentes; a regra antiga lia a ordem de destaque como ordem de área («a minha cor principal é a vinho, é a primeira pra destaque e depois é navy, o prata é pra contrastar com ambas e o nevoa creio que seria o maior percentual da tela»). Itten continua *ainda sem ficha*. O porquê da rodada inteira está em [[design-round]]. Decidido pelo agente sobre o que o MJRP aprovou, revisável por ele.

## Related
[[engineering-canon]] · [[palette-library]] · [[harness-elements]] · [[terms]] · [[harness-kaizen]] · [[doctor]]
