# PRD - MJRP_AlbumsBalancedPlaylists_v0
**Status**: Draft · **Atualizado**: 2026-10-28

<!-- Conform, pacote A, 2026-10-28. Tudo aqui vem da documentação do v0 ou do mapa do código do v0 feito pelo V1; a fonte vem entre parênteses.
     Abreviações: Prod_Vision = docs/MJRP_Album_Blender_Prod_Vision.md · README = README.md · CONSTITUIÇÃO = docs/CONSTITUTION.md ·
     ROADMAP legado = docs/ROADMAP.md · mapa do V1 = /Users/maujrp/mjrp/projects/MJRPalbumblender-v1/reports/audits/2026-10-27-mjrpalbumblender-v1-project-bootstrap-report.md ·
     inventário do V1 = /Users/maujrp/mjrp/projects/MJRPalbumblender-v1/reports/audits/2026-10-27-mjrpalbumblender-v0-feature-inventory.md.
     Os requisitos de cada épico (stories) são do próximo pacote; as seções abaixo deles não as têm ainda. -->

## Objetivo

Misturar dados de álbuns, aclamação da crítica e popularidade em playlists coerentes e equilibradas, como uma camada de inteligência acima dos serviços de streaming (README:6; Prod_Vision:13-15). Os resultados e as medidas moram no [ROADMAP.md](../../ROADMAP.md).

## Contexto e encaixe estratégico

O v0 já está em produção («Production Stable», README:3) e este PRD descreve o produto que existe, para que o trabalho daqui em diante parta do que está entregue. Ele serve o propósito do [VISION.md](../../VISION.md) (resgatar a apreciação profunda da música) pela mistura de dados descrita na seção «Core Philosophy» da visão de produto (Prod_Vision:9-15). O roadmap legado tem 23 sprints entregues, o Sprint 24 («QA & Stability») como o corrente e o Sprint 22 («Blending Context & Discovery») como o seguinte (ROADMAP legado:13-16,22-281,285-289).

## Personas e cenários

A documentação do v0 não traz personas nomeadas; traz estes perfis e situações, que ficam como estão:

- **Usuário avançado no computador («Power User»)**: organiza arrastando e soltando, lê grades densas de informação e usa o menu completo («Power Menu») (Prod_Vision:85).
- **Quem escuta no celular («Consumption»)**: usa toque, visões simplificadas de consumo e menus em folha inferior (Prod_Vision:86).
- **Colecionador**: administra o seu «Pool» de álbuns no inventário, uma utilidade separada do fluxo de mistura (Prod_Vision:38-39).
- **Quem quer curar**, em quatro situações, nas palavras da documentação: «quero curar um conjunto específico de álbuns»; «quero curar a discografia de um artista»; «quero curar uma vibe ou gênero»; «quero misturar faixas soltas ou singles» (Prod_Vision:26-34).

## Regras de negócio e restrições

- A interface nunca usa a palavra «Algorithm» (algoritmo); o termo preferido para as estratégias de mistura é «Recipe» (receita) (Prod_Vision:56).
- Nenhum clique morto e nenhuma falha silenciosa na interface (CONSTITUIÇÃO:8).
- Todo contexto de curadoria leva o sufixo `Series` (`AlbumSeries`, `ArtistSeries`, `GenreSeries`) e passa pelo Menu de Mistura antes de virar playlist (CONSTITUIÇÃO:21-22; Prod_Vision:36).
- Segredos e chaves nunca ficam no código: ficam em variáveis de ambiente ou no gerenciador de segredos (CONSTITUIÇÃO:43).

## Dependências

Tudo que vem de fora do produto e que o v0 usa. A documentação não registra prazo nem o que acontece se uma delas falhar, exceto onde dito; o que falta está em «Premissas e questões em aberto».

- **Spotify** (login com PKCE, popularidade das faixas de 0 a 100, exportação de playlists) (Prod_Vision:49; ROADMAP legado:188-190).
- **Apple Music** (login pelo MusicKit, busca no catálogo, exportação; o servidor assina o token de desenvolvedor) (ROADMAP legado:228; mapa do V1, seção 2.E).
- **Firebase** (login com Google e Apple, Firestore como armazenamento, Hosting para o front-end) (README:61; ROADMAP legado:236-237,244; CONSTITUIÇÃO:54).
- **Google Cloud Run** (o servidor Node, sem estado) (CONSTITUIÇÃO:48-52).
- **BestEverAlbums** (notas de usuários e listas; o v0 busca os dados primeiro ali e, se falhar, recorre à inteligência artificial) (README:53; Prod_Vision:47).
- **Album of The Year** (sinal da crítica, citado como fonte) (Prod_Vision:48).
- **Serviço de inteligência artificial** (Gemini, no código do v0), para classificar álbuns e como alternativa de ranking (ROADMAP legado:105; README:53; mapa do V1, seção 2.C e 2.G).

## Fora de escopo

- **Ser uma plataforma de streaming.** O Album Blender não toca música: o Spotify e o Apple Music são os players (saída) e o Album Blender é o curador (entrada) (Prod_Vision:13).
- Nada mais foi rejeitado na documentação do v0 até 2026-10-28; o que ficou para depois está na ordem do ROADMAP.md, não aqui.

## Desenho e protótipo

A desenhar: ainda não há protótipo aprovado nem `docs/specs/info-arch.md`, e `design/wireframes/` está vazio (2026-10-28); quem decide é o MJRP. A referência da tela hoje é o v0 em produção (https://mjrp-playlist-generator.web.app, README:67), o guia de estilo `docs/manual/31_UI_Style_Guide.md` e o inventário do V1, que lista as capacidades visíveis ao usuário rota por rota.

## Epics

| Épico | Serve |
|---|---|
| **EP-01 · Montar uma série de álbuns** | `^OUT-03` |
| **EP-02 · Misturar uma série escolhendo a receita** | `^OUT-02` |
| **EP-03 · Revisar as playlists geradas e guardadas** | `^OUT-01` |
| **EP-04 · Exportar a playlist para Spotify ou Apple Music** | `^OUT-01` |
| **EP-05 · Ordenar as faixas por crítica, popularidade ou gosto pessoal** | `^OUT-01` |
| **EP-06 · Usar o Album Blender no celular** | `^OUT-04` |
| **EP-07 · Gerenciar o inventário de álbuns que a pessoa possui** | `^OUT-03` |
| **EP-08 · Entrar com a conta e guardar tudo na nuvem** | `^OUT-01` |
| **EP-09 · Achar o álbum certo no catálogo oficial (capas, discografia oficial, busca por artista, filtros por tipo, correspondência aproximada)** | `^OUT-03` |

<!-- Como os épicos foram derivados (decidido pelo agente, revisável pelo MJRP, 2026-10-28): um por grande área funcional do produto, na ordem do fluxo (série, mistura, playlist, exportação, ranking), uma para o celular e duas para áreas
     que a documentação não liga a nenhum resultado (inventário e conta/nuvem); cada um serve o objetivo permanente do ROADMAP.md que a documentação liga àquela área:
       EP-01 série → OUT-03 «Entity Agnosticism» (ROADMAP legado:297; Prod_Vision:23-36)
       EP-02 mistura → OUT-02 «Blending Menu» (ROADMAP legado:296; Prod_Vision:58-77)
       EP-03, EP-04, EP-05 playlist, exportação e ranking → OUT-01 «The Album Blender: dados brutos numa audição equilibrada» (ROADMAP legado:295; Prod_Vision:15,44-50 e a saída pelos players, :13)
       EP-06 celular → OUT-04 «Responsive Componentization» (ROADMAP legado:298; Prod_Vision:80-87)
     Colocação PROVISÓRIA — decidido pelo agente, pendente do MJRP (P-15 e P-16): os dois épicos abaixo existem porque já têm stories entregues (R2) e uma story precisa de épico.
       EP-07 inventário → OUT-03: o Prod_Vision:38-39 chama o inventário de reserva («Pool») de álbuns de onde o colecionador escolhe o que colocar numa série, isto é, uma porta de entrada da mistura.
       EP-08 conta e nuvem → OUT-01: o login e o Firestore guardam as séries e as playlists (ROADMAP legado:236-237,244), a base para ouvir uma mistura montada a partir dos álbuns escolhidos.
     Nome do EP-08: «Entrar … e guardar …» tem dois verbos e reprova a linha 2 do checklist de epic-naming.md (P2); mantido como veio do coordenador, a renomear se o MJRP quiser.
     Saúde técnica (testes, desempenho, modularização) não é épico nem resultado: é restrição (NFR) e itens de conserto; ver Candidatos. -->

## Candidatos (Intake)

- **Séries por artista, por gênero e de faixas soltas.** A documentação descreve os quatro fluxos de série (Prod_Vision:26-34); no código as rotas de artista, gênero e faixas mostram «em breve» (inventário do V1, seção 1.9). A triar: vira épico de OUT-03 quando o MJRP decidir.
- **Achados do mapa do V1 sobre o v0.** Problemas e riscos já verificados no código, por exemplo regras do Firestore abertas para rankings, servidor sem autenticação nem limite de taxa, exclusão de item do inventário que não funciona, migração de usuário convidado quebrada, desfazer/refazer sem botão (mapa do V1, seções 2.D a 2.G). Triados em 2026-10-28: o que o código tenta e não cumpre virou as issues UAT-01 a UAT-13 e a dívida técnica virou UAT-14 a UAT-25, na trilha do agente (`docs/specs/uat.md`); o que vira risco aceito segue com o MJRP.
- **Inventário com foco de colecionador.** O MJRP disse em 2026-11-20 que o inventário vai precisar de bastante evolução e pediu, para depois, uma pesquisa e um benchmark de apps que já fazem controle de coleção de CDs, vinis e fitas cassete. A primeira peça é a F75 (valor estimado e onde comprar). A triar: o benchmark decide os próximos requisitos do EP-07.

## Premissas e questões em aberto

- **Premissa:** o mapa do código do v0 feito pelo V1 é tomado como fato sobre o código (o juiz independente do V1 o aprovou). Dono: o agente do projeto.
- **Questão — qual é a versão em produção?** O README diz v3.16.0 (README:3), o roadmap legado diz v3.20.0 (ROADMAP legado:4), o CHANGELOG tem a entrada [3.20.0] de 2026-01-12 (docs/CHANGELOG.md:38) e a tag mais nova é v3.225, de 2026-01-18. Dono: MJRP.
- **Questão — o Sprint 24 continua sendo o corrente?** O cabeçalho do roadmap legado diz «Current Sprint: Sprint 21» (ROADMAP legado:5) e o corpo diz Sprint 24 (ROADMAP legado:13); o último commit do v0 é de 2026-01-19 (Sprint 23 concluído). Dono: MJRP.
- **Questão — prazo e consequência de cada dependência externa.** A documentação não diz até quando cada dependência é necessária nem o que acontece se uma delas falhar (a única exceção: a busca no BestEverAlbums recorre à inteligência artificial, README:53). Dono: MJRP.

## Riscos

Nenhum risco foi registrado na documentação do v0 até 2026-10-28. Os achados do mapa do V1 aguardam triagem em Candidatos; cada um vira aqui um bloco `### R-01 · …` quando o MJRP o aceitar como risco.

## Mudanças

2026-10-28 12:02 · PRD criado a partir da documentação do v0 e do mapa do V1, com seis épicos derivados das áreas funcionais e as lacunas de produto marcadas como perguntas ao MJRP (conform, pacote A).
2026-10-28 12:05 · Revisão do pacote A: saúde técnica (Sprint 24) saiu do ROADMAP e foi para Candidatos como requisito não funcional mais conserto; resultados renumerados de OUT-01 a OUT-05; entraram os épicos EP-07 (inventário) e EP-08 (conta e nuvem), com colocação provisória pendente do MJRP.

## Requisitos por épico

O mapa dos requisitos: cada requisito é um arquivo em `docs/specs/requirements/<pasta do épico>/<ID>-<slug>.md` (o slug vem do título em inglês, minúsculo, com hífens, até 50 caracteres; fixo desde o nascimento), no formato de `requirements.format` do contrato, escrito pela mjrp-writing-reqs. Aqui cada épico declara a pasta dos seus requisitos (`folder::`, em inglês), o resultado que serve, e embute os seus requisitos. **Todo requisito (story, caso de uso, NFR) está embutido aqui, pelo nome inteiro do arquivo:** o PRD é a fonte do conteúdo e a tela só o organiza - um nó que existe e não está embutido é um achado. O épico herda as tags do resultado que serve; se precisar, soma até 3 próprias numa linha `tags::`.

### EP-01 · Montar uma série de álbuns
folder:: ep-01-album-series
serves:: [[ROADMAP#^OUT-03]] ^EP-01









![[S-49-build-a-series-from-an-artists-discography]]

![[S-50-build-a-series-from-a-genre-or-a-vibe]]

![[S-51-build-a-series-from-loose-tracks-or-singles]]

![[S-52-see-every-series-finish-loading-on-albums-screen]]
![[S-53-every-screen-shows-the-album-i-asked-for]]
![[S-55-see-how-many-albums-the-albums-screen-holds]]

### EP-02 · Misturar uma série escolhendo a receita
folder:: ep-02-blend-recipes
serves:: [[ROADMAP#^OUT-02]] ^EP-02






### EP-03 · Revisar as playlists geradas e guardadas
folder:: ep-03-review-playlists
serves:: [[ROADMAP#^OUT-01]] ^EP-03








### EP-04 · Exportar a playlist para Spotify ou Apple Music
folder:: ep-04-export-playlists
serves:: [[ROADMAP#^OUT-01]] ^EP-04





### EP-05 · Ordenar as faixas por crítica, popularidade ou gosto pessoal
folder:: ep-05-track-ranking
serves:: [[ROADMAP#^OUT-01]] ^EP-05






### EP-06 · Usar o Album Blender no celular
folder:: ep-06-mobile-use
serves:: [[ROADMAP#^OUT-04]] ^EP-06




### EP-07 · Gerenciar o inventário de álbuns que a pessoa possui
folder:: ep-07-album-inventory
serves:: [[ROADMAP#^OUT-03]] ^EP-07

![[S-54-have-every-album-of-my-series-in-my-inventory]]
![[S-56-rank-my-inventory-by-acclaim-and-popularity]]
![[S-57-see-what-a-cd-costs-and-where-to-buy-it]]





### EP-08 · Entrar com a conta e guardar tudo na nuvem
folder:: ep-08-account-cloud
serves:: [[ROADMAP#^OUT-01]] ^EP-08





### EP-09 · Achar o álbum certo no catálogo oficial (capas, discografia oficial, busca por artista, filtros por tipo, correspondência aproximada)
folder:: ep-09-achar-o-album-certo-no-catalog
serves:: [[ROADMAP#^OUT-03]] ^EP-09

### Transversais

Os requisitos não funcionais valem para todas as features e não são importados por nenhuma: cada um é um arquivo `docs/specs/requirements/nfr/NFR-xx-<slug>.md`.

![[NFR-01-the-products-main-flows-have-end-to-end-tests]]

![[NFR-02-the-apps-performance-is-measured-with-lighthouse]]
