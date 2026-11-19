---
status: In Progress
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-184"]
planned_for: "[[ROADMAP#^REL-40]]"
---
<!-- docs/specs/features/Fxx-slug/spec.md — the folder is the feature (Fxx, two digits).
     status: In progress while the cycle runs; Done when every task is closed and every REQ has verified_by.
     imports: the requirement nodes this feature delivers (1..n), each Ready, each in no other open feature.
     A transversal NFR node constrains every feature (review it with constitution.md), so a product feature does not import
     it. The exception is an engineering feature (a refactor planned by an ADR, infrastructure): `solution_type: fix`, `fixes: [UAT-xx]` of the
     debt issues (required: the card takes its release from them), and `imports:` only the NFR it serves, named by a
     `violates:: [[NFR-xx-<slug>]]` in the Problem Statement — no story invented for it. A debt against a constitution
     article imports nothing and says `violates:: [[constitution#N]]` of an article that exists. -->
# Feature F55: Os álbuns pedidos, ou um aviso: uma regra só para dizer que é o mesmo álbum
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** Uma regra só decide «este é o álbum pedido», e ela vale nos cinco lugares que hoje decidem cada um do seu jeito: o catálogo da Apple Music, o Spotify, o BestEverAlbums no servidor, a capa local e a busca por IA. O título tem de bater por conta própria; sem resultado que bata, a série avisa em vez de mostrar outro álbum. Quando o identificador guardado não vale mais e o álbum certo é achado, o identificador novo é gravado na série, por um único escritor. A feature começa contando quantos álbuns da conta estão trocados hoje.

**Por quê:** Hoje, com o artista certo, qualquer álbum passa na conferência; e a mesma falha existe em cinco lugares.

**Como saber que funcionou:** Nenhuma série mostra um álbum diferente do pedido; a contagem de álbuns trocados na conta do MJRP vai a zero ou vira aviso.

## Problem Statement
O MJRP, em 2026-11-19: «eu nuca adicionei esse album do stone temple pilots, provavelmente era o core»; e «pq "o album pedido" e nao "os"». Decisão do MJRP de 2026-11-19: tudo entra na v5.0, e cada feature pronta e testada vai para produção sozinha. Origem: o cruzamento dos relatórios anteriores (`reports/audits/2026-11-19-mjrpalbumblender-v0-earlier-reports-vs-v5-plan.md`).

## Fatias (cada uma vai para produção sozinha)
- **1. Uma regra, usada em todos os lugares, e a contagem** — **feita em 2026-11-19 no ramo `fix/f55-one-album-identity-rule`** (falta entrar na `main`, rodar a contagem com o login do MJRP e ir para produção: site e servidor). A regra única de «este é o álbum pedido», num módulo puro que o app e o servidor usam; os lugares que aceitam um álbum passam a perguntar a ela; o identificador guardado da Apple é conferido; uma contagem só-leitura diz quantos álbuns estão trocados hoje.
- **2. O identificador corrigido gravado, e o guardado antigo descartado** — não feita. Quando o identificador guardado não vale mais e o álbum certo é achado, o identificador novo é gravado na série, por um único escritor; o que o navegador guarda de álbum trocado é descartado; adicionar e remover álbum de uma série usam a mesma regra; a contagem na conta do MJRP vai a zero ou vira aviso.

## Requirements
<!-- Local IDs, two digits. Each REQ traces to an imported node; none is invented here.
     Functional and non-functional (performance, security, accessibility) alike are REQ-xx. -->
- [REQ-01] Uma regra só decide «este é o álbum pedido», a mesma no app e no servidor: o título tem de bater por conta própria, inteiro, depois de tirar acento, caixa, pontuação, «&»/«and», o «The» do começo e as notas de edição; o artista tem de bater do mesmo jeito; um título conter o outro não é acerto; o ano nunca reprova, só ordena os que passaram; sem candidato que passe, o resultado é «não achei», nunca outro álbum do artista. A resposta é tipada (igual ou diferente, com o motivo). · fixes UAT-184
  verified_by:: `test/shared/albumIdentity.test.js`
- [REQ-02] A busca no catálogo da Apple Music, na carga de álbuns e no caminho antigo (blend e edição de playlists), só aceita o álbum pedido, escolhido pela regra entre os resultados; sem resultado que passe, segue o caminho de «não achei» que já existe. · fixes UAT-184
  verified_by:: `test/services/albums/catalogIdentity.test.js`, `test/api/clientIdentity.test.js`, `test/services/albums/adapters.test.js`
- [REQ-03] O identificador da Apple guardado na série não vale sozinho: o álbum a que ele leva é conferido pela regra; se for outro álbum (ou se o identificador não existir mais), o álbum é buscado por artista e título, e o resultado diz qual identificador guardado não foi usado. Nada é gravado na série nesta fatia. · fixes UAT-184
  verified_by:: `test/services/albums/catalogIdentity.test.js`
- [REQ-04] O álbum do Spotify usado para a popularidade, no app e no servidor, é o álbum pedido pela regra, ou nenhum: não há «primeiro resultado» nem «um título contém o outro». · fixes UAT-184
  verified_by:: `test/services/spotify/SpotifyAlbumMatch.test.js`, `test/server/spotifyAlbumIdentity.test.js`
- [REQ-05] O raspador de notas do servidor só aceita a página do álbum pedido, pela regra, em todos os pontos em que aceitava por «um texto contém o outro»; um álbum ausente da fonte, com o artista presente, é «não achei». Uma falha da fonte continua sendo falha. · fixes UAT-184
  verified_by:: `test/server/scraperIdentity.test.js`, `test/server/ratings.test.js`
- [REQ-06] A capa tirada dos dados locais é a do álbum pedido pela regra, ou nenhuma: a primeira linha da busca não serve de reserva. · fixes UAT-184
  verified_by:: `test/services/OptimizedAlbumLoader.identity.test.js`
- [REQ-07] A resposta da busca de álbum por IA só é aceita pelo app quando é o álbum pedido pela regra; outro álbum é tratado como «o servidor não tem», sem nova chamada paga. · fixes UAT-184
  verified_by:: `test/api/clientIdentity.test.js`
- [REQ-08] Uma contagem só-leitura, rodável pelo console do navegador com a conta do dono, percorre as séries e diz, para cada álbum pedido, qual álbum o app tem para ele e o veredito da regra (série, pedido, mostrado, veredito). Não grava nada e não pergunta a nenhuma fonte. · fixes UAT-184
  verified_by:: `test/services/albums/albumIdentityAudit.test.js`
- [REQ-09] Um teste de arquitetura falha quando um dos lugares que aceitam um álbum deixa de perguntar à regra, volta a comparar texto por conta própria, ou guarda um «primeiro resultado» de reserva. · fixes UAT-184
  verified_by:: `test/architecture/albumIdentityRule.test.js`
- [REQ-10] O identificador corrigido é gravado na série por um único escritor; o que o navegador guarda de álbum trocado é descartado; adicionar e remover álbum de uma série usam a regra; a contagem na conta do dono vai a zero ou vira aviso. (fatia 2, não feita) · fixes UAT-184
  verified_by:: «a escrever na fatia 2»

## Observable States
<!-- What the imported nodes point_to: the screen state in info-arch.md (the prototype the human judged —
     PRINCIPLES.md §I.13) or the behavior state in behavior.md. N/A only if the nodes point to none. -->
N/A: a feature não importa nó de requisito com estado de tela, e a fatia 1 não cria tela. O que se vê é o que a carga de álbuns já mostra: o álbum pedido, ou o aviso de «não encontrado» que cada lugar já tinha (o estado por álbum e o aviso da série, da v4.0). A popularidade e as notas de um álbum que a fonte não tem ficam como «sem dado», como hoje.

**Mudança de comportamento declarada:** um álbum que hoje aparece (trocado, ou certo mas com o título do catálogo diferente do título guardado por um qualificador que não é edição, como «Weezer (Blue Album)» pedido como «Weezer») passa a dar «não encontrado». A capa tirada dos dados locais deixa de aparecer quando os dados locais não têm o álbum pedido (antes vinha a capa da primeira linha da busca, de outro álbum). O que o navegador já guarda não é mexido nesta fatia: um álbum trocado já guardado continua aparecendo até o registro vencer (7 dias) ou o «Clear Cache».

## Success Criteria
<!-- One measurable item per acceptance criterion of the imported nodes. -->
- Pedido «Stone Temple Pilots - Core»: nenhum lugar aceita «Shangri-La Dee Da» nem «Core Memories»; todos aceitam «Core» e as suas edições («Core (Deluxe Edition)», «Core - 2011 Remaster»).
- Com só outros álbuns do artista entre os candidatos, cada lugar termina em «não achei» (Apple: segunda fonte e depois `AlbumNotFoundError`; Spotify e dados locais: `null`; raspador: `null`, que o serviço responde como `not_found`; IA: `null`).
- Um identificador guardado que leva a outro álbum não é obedecido, e o álbum carregado traz `metadata.replacedSourceId` com o identificador que não foi usado.
- A contagem devolve uma linha por álbum pedido e os totais (`asked`, `same`, `different`, `notLoaded`), sem nenhuma escrita.
- `npx vitest run` verde (919 testes) e `npx vite build` compila.

## Out of Scope
- Gravar na série o identificador corrigido, e descartar o que o navegador já guarda (fatia 2).
- Adicionar e remover álbum de uma série pela regra (`SeriesService`, itens 3.15 e 3.16 do mapa da v5.0): fatia 2.
- A conferência da resposta da IA dentro do servidor (`GenerationService`): nesta fatia quem confere é o app, que é quem aceita o álbum.
- A busca de álbuns que a pessoa usa para escolher (`album-search/`): ela ordena opções para a pessoa decidir, não decide sozinha; é da F57.
- O casamento de faixas (notas e popularidade por faixa, exportação): outra regra, de outra feature (F62).
- A loja da Apple usada na busca (itens 3.17 e 3.23 do mapa).
- Uma tela nova para «não bate»: o desfecho é o «não encontrado» que já existe.

## Open Questions
<!-- ALL resolved before Plan. -->
- Um subtítulo depois de «:» ou « - » que não é nota de edição conta como parte do título («The Wall: Live in Berlin» não é «The Wall»; «Unreal Unearth: Unheard» não é «Unreal Unearth»)? — Sim, nos dois sentidos; decisão do agente na construção, revisável pelo MJRP. O custo está dito em «Mudança de comportamento declarada».
- «(Live)» sozinho entre parênteses é nota de edição (a Apple o acrescenta ao título de álbuns ao vivo)? — Sim, só quando é a nota inteira; «(Live at the Forum '76)» não é. Decisão do agente, revisável.
- «IV» e «4» são o mesmo número? — Não nesta fatia: romano e arábico não são igualados. Decisão do agente, revisável.
- Quantos álbuns da conta do MJRP estão trocados hoje? — Não se sabe: a contagem existe e falta rodá-la com o login dele (`await albumIdentityAudit()` no console). Do MJRP ou do integrador, antes de publicar.
