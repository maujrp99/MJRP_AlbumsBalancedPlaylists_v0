# ROADMAP - MJRP_AlbumsBalancedPlaylists_v0

Em que ordem, com que prova. Os resultados nascem aqui, da Visão; cada épico do `docs/specs/prd.md` serve a um deles (`serves::`). O ROADMAP não deriva do PRD. Cada resultado leva de 1 a 3 tags de categoria (`tags::`, em inglês e kebab-case); o épico que o serve as herda.

<!-- Conform, pacote A, 2026-10-28 (revisado 2026-10-28 12:05). Este ROADMAP reescreve a forma do roadmap legado (docs/ROADMAP.md, que continua onde está), sem mudar o conteúdo de produto:
     - Now = os quatro objetivos permanentes da seção «Product Vision» do legado (linhas 293-298). O sprint corrente do legado (Sprint 24 «QA & Stability», linhas 13-16) NÃO é resultado:
       saúde técnica é restrição, não resultado (regra da mjrp-coaching-pm, the-top-of-the-graph.md); os itens dele estão em Candidatos no PRD e viram requisito não funcional mais itens de conserto;
     - Next = o sprint futuro do legado (Sprint 22, linhas 285-289);
     - Later = «Long-Term Vision» do legado (linhas 300-305).
     Problema, quem sente e medida: só o que a documentação do v0 diz está escrito, com a fonte; o resto está marcado «a perguntar ao MJRP (P-NN)» e a pergunta está no relatório do pacote A.
     Abreviações: Prod_Vision = docs/MJRP_Album_Blender_Prod_Vision.md · CONSTITUIÇÃO = docs/CONSTITUTION.md. -->

## Now

### Ouvir uma mistura coerente e equilibrada feita a partir dos álbuns escolhidos
tags:: #playlist-blending #ranking-data
- **Problema:** o consumo superficial de música e as bolhas dos algoritmos de recomendação (do nível do produto; a documentação não separa o problema por resultado).
- **Quem sente:** a perguntar ao MJRP (P-03)
- **Medida:** a perguntar ao MJRP (P-04) ^OUT-01
<!-- origem: docs/ROADMAP.md:295 («A mixer that takes raw data (albums, AOTY ratings, Spotify popularity) and blends them into a coherent, balanced listening experience») · Prod_Vision:11,14-15 (problema). -->

### Escolher o estilo da mistura num menu padronizado e ajustável
tags:: #blending-menu
- **Problema:** o atrito técnico de escolher um «algoritmo»: a documentação quer eliminá-lo e proíbe o termo na interface, que fala em «receita» (Mix Styles).
- **Quem sente:** a perguntar ao MJRP (P-05)
- **Medida:** a perguntar ao MJRP (P-06) ^OUT-02
<!-- origem: docs/ROADMAP.md:296 («A standardized, highly parametrized interface for choosing Mix Styles») · Prod_Vision:54-69 (problema na linha 56: «We are eliminating technical friction»). -->

### Começar a mistura por um álbum, um artista ou um gênero
tags:: #series-entry-points
- **Problema:** manter o núcleo centrado em álbuns e, ao mesmo tempo, atender um público mais amplo, aceitando outras entidades como porta de entrada (palavras da documentação).
- **Quem sente:** a perguntar ao MJRP (P-07)
- **Medida:** a perguntar ao MJRP (P-08) ^OUT-03
<!-- origem: docs/ROADMAP.md:297 («Entity Agnosticism») · Prod_Vision:21-36 (as quatro séries; problema na linha 21). No código do v0 as rotas de artista, gênero e faixas aparecem como «em breve» (inventário do V1, §1.9). -->

### Usar o Album Blender no computador e no celular
tags:: #responsive-ui
- **Problema:** a perguntar ao MJRP (P-09)
- **Quem sente:** quem usa o computador com intensidade («Power User», que organiza arrastando e soltando e lê grades densas de informação) e quem escuta no celular («Consumption», com toque e visões simples).
- **Medida:** a perguntar ao MJRP (P-10) ^OUT-04
<!-- origem: docs/ROADMAP.md:298 («Responsive Componentization: Write Once, Adapt Everywhere») · Prod_Vision:80-87 (quem sente nas linhas 85-86). Horizonte dos quatro resultados de Now: P-14. -->

## Next

### Misturar séries diferentes numa só receita e receber recomendações
tags:: #cross-series #discovery
- **Problema:** a perguntar ao MJRP (P-11)
- **Quem sente:** a perguntar ao MJRP (P-12)
- **Medida:** a perguntar ao MJRP (P-13) ^OUT-05
<!-- origem: docs/ROADMAP.md:285-289 (Sprint 22 «Blending Context & Discovery»: «Expand the blending experience with cross-series context and enhanced discovery tools»; escopo: execução de receita entre séries e integração de um motor de recomendação). -->

## Later

<!-- origem: docs/ROADMAP.md:300-305 («Long-Term Vision»), na ordem em que a documentação os lista. -->
- Compartilhar séries com outras pessoas.
- Formas mais avançadas de montar a playlist.
- Usar a mesma conta entre plataformas, com aplicativos para celular.
- Usar outros serviços de música, como YouTube Music e Tidal.
- Receber recomendações de playlist feitas por inteligência artificial.

## Releases

<!-- Uma linha por release, em ordem, com o block ID. O Control Center lê releases só daqui e monta o Board por release;
     o nome em negrito é o que a rodada de UAT cita (`## Rodada 1 — R1 · [nome]`). Cada story aponta a sua (`planned_for:`).
     Agrupamento decidido pelo agente em 2026-10-28 12:00, revisável pelo MJRP: os 23 sprints do legado (docs/ROADMAP.md:22-281) em 5 marcos
     de histórico, em ordem de data. Todos já estão entregues em produção. Sprint 24 e Sprint 22 não são release (sprint é janela de tempo).
       R1 = Sprints 1, 2, 3, 4 e 4.5 · 2025-11-10 a 2025-11-28 · tags v0.2.0, v1.5.0, v1.6working-in-prod, sprint-4.5-done
       R2 = Sprints 5 e 6 · 2025-12-09 a 2025-12-12 · tags v2.1.0-ready-for-prod-20251209, prod-google-login-implemented, v2.1.1
       R3 = Sprints 7, 7.5, 8, 8.5, 9+10 e 11 · 2025-12-15 a 2025-12-19 · tags v2.2.0 a v2.6.0 (2025-12-12 a 14), v2.7.0, v2.7.1, v2.8.0, v2.8.5, v2.9.0
            (o legado diz v2.11.0 para o Sprint 11; esse nome de tag não existe, a mais próxima é v2.9.5 de 2025-12-23)
       R4 = Sprints 12, 13, 14, 15, 15.5 e 16 · 2025-12-24 a 2026-01-03 · tags v2.98, v2.99, v3.05, v3.10, v3.15, v3.15.5, v3.16
       R5 = Sprints 17, 17.75, 17.9, 18, 19, 20, 21, 21.5 e 23 · 2026-01-04 a 2026-01-19 · tags v3.17, v3.17.5, v3.1775, v3.19.0, v3.215, v3.225; v3.20.0 só no CHANGELOG (2026-01-12)
     As descrições abaixo só dizem o que a pessoa passou a poder fazer e que a documentação do v0 declara; o que o mapa do V1 mostra que não funciona (por exemplo desfazer/refazer sem botão, excluir item do inventário) ficou de fora.
     A atribuição de stories a cada release é do pacote seguinte (mjrp-writing-reqs). -->
- **R1 · Primeiras telas e primeira playlist** — a pessoa cria uma série de álbuns na tela inicial, vê a biblioteca de álbuns e o ranking das faixas com a nota do BestEverAlbums, gera a primeira playlist e a reorganiza arrastando as faixas. kind:: release ^REL-01
- **R2 · Dados na nuvem e inventário** — a pessoa entra com a conta Google ou Apple, tem suas séries, playlists e álbuns guardados na nuvem e passa a cadastrar e editar os álbuns que possui num inventário. kind:: release ^REL-02
- **R3 · Spotify, Apple Music e mais formas de montar a playlist** — a pessoa conecta o Spotify e o Apple Music, envia as playlists para eles, escolhe entre mais de uma forma de montar a playlist, edita um lote já salvo e compara a nota da crítica com a popularidade no Spotify. kind:: release ^REL-03
- **R4 · Nova aparência e nomes claros** — a pessoa usa a nova aparência da versão 3, com montagem em painel dividido e busca de álbuns, deixa de ver janela de login ao abrir o app, escolhe formas de montar a playlist com nomes que se explicam, escolhe como agrupar as faixas e dá nome a um lote de playlists. kind:: release ^REL-04
- **R5 · Ranking pessoal, receitas e celular** — a pessoa dá a sua própria ordem às faixas e mistura por ela, vê de onde vem a nota de cada faixa, chama as formas de montar a playlist de receitas, usa o app no celular e ordena as séries por nome, quantidade de álbuns ou data. kind:: release ^REL-05
