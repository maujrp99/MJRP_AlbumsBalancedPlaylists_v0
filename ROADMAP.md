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

- **v1.5 · v1.5 Refactor** — 2025-11-25 · «v1.5 Refactor»; anterior à Sprint 1 numerada, sem feature SDD · tag v1.5.0. version:: v1.5 ^REL-06
- **v1.6.1 · Hotfix: Production Deployment** — 2025-11-26 · «Hotfix: Production Deployment»; anterior à Sprint 1 numerada, sem feature SDD · sem tag no git. version:: v1.6.1 ^REL-07
- **v2.0.0-alpha.1 · Sprint 1: Foundation Setup** — 2025-11-26 · Sprint 1: Foundation Setup · sem tag no git. version:: v2.0.0-alpha.1 ^REL-08
- **v2.0.0-alpha.2 · Sprint 2: Router & Views** — 2025-11-26 · Sprint 2: Router & Views · sem tag no git. version:: v2.0.0-alpha.2 ^REL-09
- **v2.0.0-alpha.3 · Sprint 3: Albums & Ranking Views** — 2025-11-26 · Sprint 3: Albums & Ranking Views · sem tag no git. version:: v2.0.0-alpha.3 ^REL-10
- **v2.0.0-alpha.4 · Sprint 4: Playlists Management** — 2025-11-26 · Sprint 4: Playlists Management · tag v2.0.0-alpha.4. version:: v2.0.0-alpha.4 ^REL-11
- **v2.0.0-alpha.5 · Sprint 4.5 Phase 1: Landing View UI/UX** — 2025-11-28 · Sprint 4.5 Phase 1: Landing View UI/UX · sem tag no git. version:: v2.0.0-alpha.5 ^REL-12
- **v2.0.0-alpha.6 · Sprint 4.5 Phase 2: Albums View Modes** — 2025-11-28 · Sprint 4.5 Phase 2: Albums View Modes · sem tag no git. version:: v2.0.0-alpha.6 ^REL-13
- **v2.0.3 · Critical Bug Fixes & UAT Ready** — 2025-11-30 · Critical Bug Fixes & UAT Ready (ciclo da Sprint 5) · tag v2.0.3. version:: v2.0.3 ^REL-14
- **v2.0.4 · First Production Deployment v1.6 → v2.0** — 2025-12-02 · First Production Deployment v1.6 → v2.0 (ciclo da Sprint 5) · tag v2.0.4. version:: v2.0.4 ^REL-15
- **v2.1.0 · Sprint 5 Complete: Persistence & Production Ready** — 2025-12-09 · Sprint 5 Complete: Persistence & Production Ready; o CHANGELOG cita a tag v2.1.0, que o git não tem (só v2.1.0-ready-for-prod-20251209 e pré-lançamentos) · tag v2.1.0-ready-for-prod-20251209. version:: v2.1.0 ^REL-16
- **v2.1.1 · Sprint 6** — 2025-12-12 · Sprint 6 segundo o roadmap; o CHANGELOG arquivado põe a Sprint 6 em v2.2.0 e v2.2.1 · tag v2.1.1. version:: v2.1.1 ^REL-17
- **v2.2.0 · Sprint 6 Feature Freeze** — 2025-12-12 · Sprint 6 Feature Freeze · tag v2.2.0. version:: v2.2.0 ^REL-18
- **v2.2.1 · Sprint 6 Complete & Mobile Polish** — 2025-12-13 · Sprint 6 Complete & Mobile Polish · tag v2.2.1. version:: v2.2.1 ^REL-19
- **v2.4.0 · UX Revamp & Autocomplete** — 2025-12-13 · UX Revamp & Autocomplete (Sprint 7, Load Albums) · tag v2.4.0. version:: v2.4.0 ^REL-20
- **v2.4.1 · Navigation Fixes** — 2025-12-13 · Navigation Fixes (Sprint 7) · tag v2.4.1. version:: v2.4.1 ^REL-21
- **v2.5.0 · Sprint 7 Phase C: Apple Music & Drag-n-Drop Stability** — 2025-12-14 · Sprint 7 Phase C: Apple Music & Drag-n-Drop Stability · tag v2.5.0. version:: v2.5.0 ^REL-22
- **v2.6.0 · Sprint 7 Phase D: UI Polish & Style Guide** — 2025-12-14 · Sprint 7 Phase D: UI Polish & Style Guide · tag v2.6.0. version:: v2.6.0 ^REL-23
- **v2.7.0 · Sprint 7.5: AlbumsView Polish & Refactor** — 2025-12-15 · Sprint 7.5: AlbumsView Polish & Refactor · tag v2.7.0. version:: v2.7.0 ^REL-24
- **v2.7.1 · Sprint 7.5.1: SeriesView Consolidation** — 2025-12-15 · Sprint 7.5.1: SeriesView Consolidation · tag v2.7.1. version:: v2.7.1 ^REL-25
- **v2.8.0 · Sprint 8: Algorithm Strategy Pattern** — 2025-12-16 · Sprint 8: Algorithm Strategy Pattern · tag v2.8.0. version:: v2.8.0 ^REL-26
- **v2.8.5 · Sprint 8.5: Algorithm Improvements & Playlist Fixes** — 2025-12-17 · Sprint 8.5: Algorithm Improvements & Playlist Fixes · tag v2.8.5. version:: v2.8.5 ^REL-27
- **v2.9.0 · Sprint 9+10: Ranking Enrichment, EditPlaylistView & Loading UX** — 2025-12-18 · Sprint 9+10: Ranking Enrichment, EditPlaylistView & Loading UX · tag v2.9.0. version:: v2.9.0 ^REL-28
- **v2.11.0 · Sprint 11** — 2025-12-19 · Sprint 11 segundo o roadmap · sem tag no git. version:: v2.11.0 ^REL-29
- **v3.0.0 · Sprint 12** — 2025-12-24 · Sprint 12 segundo o roadmap · sem tag no git. version:: v3.0.0 ^REL-30
- **v3.1.0 · Sprint 13** — 2025-12-26 · Sprint 13 segundo o roadmap · sem tag no git. version:: v3.1.0 ^REL-31
- **v3.2.0 · Sprint 14** — 2025-12-28 · Sprint 14 segundo o roadmap · sem tag no git. version:: v3.2.0 ^REL-32
- **v3.15 · Sprint 15: Structural Integrity & SafeDOM** — 2025-12-31 · Sprint 15: Structural Integrity & SafeDOM · tag v3.15. version:: v3.15 ^REL-33
- **v3.15.5 · Sprint 15.5: Prod Polish & Blending Fixes** — 2026-01-02 · Sprint 15.5: Prod Polish & Blending Fixes · tag v3.15.5. version:: v3.15.5 ^REL-34
- **v3.16.0 · Sprint 16: SafeDOM e Batch Naming** — 2026-01-03 no roadmap e na tag v3.16; 2026-01-08 no CHANGELOG (data em conflito) · Sprint 16: SafeDOM e Batch Naming · tag v3.16. version:: v3.16.0 ^REL-35
- **v3.17.0 · Sprint 17: Architectural Modularization** — 2026-01-08 no roadmap; a tag v3.17 é de 2026-01-04 · Sprint 17: Architectural Modularization · tag v3.17. version:: v3.17.0 ^REL-36
- **v3.17.5 · Sprint 17.75: Classification Modularization** — 2026-01-10 no roadmap; a tag v3.17.5 é de 2026-01-04 · Sprint 17.75: Classification Modularization · tag v3.17.5. version:: v3.17.5 ^REL-37
- **v3.20.0 · Sprint 20: User Ranking** — 2026-01-12 · Sprint 20: User Ranking (CHANGELOG e «Current Version» do roadmap) · sem tag no git. version:: v3.20.0 ^REL-38
- **v4.0 · Carregamento e estabilidade** — aberta em 2026-11-19, em fecho · consertos do que já está em produção, do mais grave ao menos grave, começando pela carga da tela de álbuns (pedido do MJRP de 2026-11-19; as issues estão na Rodada 2 do `docs/specs/uat.md`) · sem tag no git. version:: v4.0 ^REL-39
- **v5.0 · Uma arquitetura só para carregar e escolher álbuns** — aberta em 2026-11-19 · o que a regressão de 2026-11-19 mostrou e que depende de mudar o desenho: o álbum certo ou aviso, todas as telas pelo serviço de carga, uma peça só para escolher álbuns, o contrato de erros e o cache do servidor; pela via rápida (decisão do MJRP de 2026-11-19: a v4.0 fecha com o que não depende da arquitetura; o resto vem para cá) · decisão do MJRP de 2026-11-19: **tudo** o que o cruzamento com os relatórios anteriores deixou em aberto entra aqui (segurança, perda de dado, blend e exportação, Home e navegação, publicação, limpeza), e **cada feature pronta e testada vai para produção sozinha**, sem esperar as outras · sem tag no git. version:: v5.0 ^REL-40
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
