---
status: Done
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
**A feature:** Uma regra só decide «este é o álbum pedido», e ela vale nos cinco lugares que hoje decidem cada um do seu jeito: o catálogo da Apple Music, o Spotify, o BestEverAlbums no servidor, a capa local e a busca por IA. O título tem de bater por conta própria; sem resultado que bata, a série avisa em vez de mostrar outro álbum. Quando o catálogo só tem o título pedido com um subtítulo, e não há outro álbum assim, esse álbum é aceito, e o cartão dele diz isso. Quando o identificador guardado não vale mais e o álbum certo é achado, o identificador novo é gravado na série, por um único escritor. A feature começa contando quantos álbuns da conta estão trocados hoje.

**Por quê:** Hoje, com o artista certo, qualquer álbum passa na conferência; e a mesma falha existe em cinco lugares.

**Como saber que funcionou:** Nenhuma série mostra um álbum diferente do pedido; a contagem de álbuns trocados na conta do MJRP vai a zero ou vira aviso.

## Problem Statement
O MJRP, em 2026-11-19: «eu nuca adicionei esse album do stone temple pilots, provavelmente era o core»; e «pq "o album pedido" e nao "os"». Decisão do MJRP de 2026-11-19: tudo entra na v5.0, e cada feature pronta e testada vai para produção sozinha. Origem: o cruzamento dos relatórios anteriores (`reports/audits/2026-11-19-mjrpalbumblender-v0-earlier-reports-vs-v5-plan.md`).

## Fatias (cada uma vai para produção sozinha)
- **1. Uma regra, usada em todos os lugares, e a contagem** — **feita e em produção desde 2026-11-19 18:18** (site e servidor; prova em `reports/evidence/F55/2026-11-19-slice-1-browser-proof.md`). A regra única de «este é o álbum pedido», num módulo puro que o app e o servidor usam; os lugares que aceitam um álbum passam a perguntar a ela; o identificador guardado da Apple é conferido; uma contagem só-leitura diz quantos álbuns estão trocados hoje (8 álbuns em 227, em 9 linhas, na conta do MJRP).
- **2. O segundo degrau, o identificador corrigido gravado, e o guardado antigo descartado** — **construída em 2026-11-19 no ramo `fix/f55-identity-slice-2`** (falta a prova no navegador com a conta do MJRP, entrar na `main` e ir para produção: site e servidor). (a) O afrouxamento decidido pelo MJRP em 2026-11-19 («o no quarter é um edge case, vamos tratá-lo com afrouxamento»): um segundo degrau da regra, que nunca disputa com o primeiro. (b) O identificador corrigido é gravado na série, por um único escritor. (c) O que o navegador guarda de álbum trocado é descartado quando é lido. (d) Adicionar e remover álbum de uma série usam a regra.

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
- [REQ-10] Quando o álbum pedido é achado sob outro identificador da Apple que o guardado na série (o guardado sumiu, ou leva a outro álbum), o identificador novo é gravado na consulta da série, junto com a capa e o ano que estavam guardados ao lado do antigo (só se a consulta os guarda). Um único escritor faz isso, o mesmo que já grava os fatos da carga, numa escrita por série terminada, uma vez. O artista e o título pedidos nunca mudam. A falha dessa escrita é avisada, tentada de novo na passada seguinte, e nunca derruba a carga. · fixes UAT-184
  verified_by:: `test/services/series/SeriesFactsService.test.js`, `test/services/albums/catalogIdentity.test.js`, `test/architecture/albumIdentityRule.test.js`
- [REQ-11] Um álbum guardado no navegador que não é o álbum pedido pela consulta não sobrevive: cada leitura do guardado (a carga de álbuns; o caminho antigo do blend e das playlists) pergunta à regra e descarta o registro que não passa, que é buscado de novo. O registro que passa fica, com as notas e a popularidade que já tinha. A leitura da contagem continua sem mexer em nada. · fixes UAT-184
  verified_by:: `test/services/albums/adapters.test.js`, `test/api/clientIdentity.test.js`, `test/services/albums/albumIdentityAudit.test.js`
- [REQ-12] Adicionar e remover álbum de uma série perguntam à regra qual consulta da série é «este álbum»: nenhum casa texto por «um contém o outro». Ao remover, a consulta que guarda o id do álbum é a dele; senão, a que a regra diz, o título próprio antes da consulta de que o álbum é só uma edição. Ao adicionar, só o título próprio é repetição. · fixes UAT-184
  verified_by:: `test/services/SeriesService.identity.test.js`
- [REQ-13] A regra tem um segundo degrau, que nunca disputa com o primeiro: o título PEDIDO é o título do candidato antes de um separador de subtítulo («:» ou « - »), com o mesmo artista. Só num sentido (o pedido é o curto: «The Wall: Live in Berlin» pedido nunca aceita «The Wall»), e nunca para uma consulta sem artista. A comparação sozinha responde `same-if-alone`, que não é `same`; só a escolha entre candidatos aceita, e só quando nenhum candidato passou no primeiro degrau e os do segundo são um álbum só (dois álbuns diferentes é «não achei»). A resposta continua tipada, com os motivos fechados. · fixes UAT-184
  verified_by:: `test/shared/albumIdentity.test.js`
- [REQ-14] O segundo degrau vale onde a regra vê a lista inteira de uma fonte (a busca da Apple, do Spotify no app e no servidor, as sugestões e a página do artista no raspador, os dados locais), e não vale onde só há um candidato à vista: o identificador guardado, a resposta da IA e a página que o raspador confere sozinha aceitam só o primeiro degrau. · fixes UAT-184
  verified_by:: `test/services/albums/catalogIdentity.test.js`, `test/api/clientIdentity.test.js`, `test/services/spotify/SpotifyAlbumMatch.test.js`, `test/server/spotifyAlbumIdentity.test.js`, `test/server/scraperIdentity.test.js`
- [REQ-15] O álbum carregado diz por qual motivo da regra foi aceito (`metadata.identityReason`). O cartão do álbum aceito pelo segundo degrau mostra uma linha dizendo que o catálogo só o tem com subtítulo; os outros não mostram nada. A contagem só-leitura conta esse álbum como igual, com o motivo; o mesmo título guardado sem que uma carga o tenha aceito conta como diferente. · fixes UAT-184
  verified_by:: `test/components/ui/AlbumCardIdentityNote.test.js`, `test/services/albums/albumIdentityAudit.test.js`, `test/shared/albumIdentity.test.js`
- [REQ-16] O teste de arquitetura falha quando um lugar nomeia ou concede o segundo degrau por conta própria (compara o tipo do veredito, entrega à escolha uma lista de um candidato só), quando um leitor do guardado ou o `SeriesService` deixam de perguntar à regra, ou quando aparece um segundo caminho para gravar o identificador corrigido. · fixes UAT-184
  verified_by:: `test/architecture/albumIdentityRule.test.js`

## Observable States
<!-- What the imported nodes point_to: the screen state in info-arch.md (the prototype the human judged —
     PRINCIPLES.md §I.13) or the behavior state in behavior.md. N/A only if the nodes point to none. -->
N/A para a fatia 1: a feature não importa nó de requisito com estado de tela, e a fatia 1 não cria tela. O que se vê é o que a carga de álbuns já mostra: o álbum pedido, ou o aviso de «não encontrado» que cada lugar já tinha (o estado por álbum e o aviso da série, da v4.0). A popularidade e as notas de um álbum que a fonte não tem ficam como «sem dado», como hoje.

**Fatia 2, um estado novo:** o cartão do álbum aceito pelo segundo degrau mostra, na linha dos selos (grade e lista), o texto «Asked for by its short title: the catalog only has this one, with a subtitle.» (`docs/specs/behavior.md`, `^library-album-subtitle-note`). Pela via rápida, não passou por protótipo: o MJRP julga na prova do navegador.

**Mudança de comportamento declarada (fatia 1):** um álbum que hoje aparece (trocado, ou certo mas com o título do catálogo diferente do título guardado por um qualificador que não é edição, como «Weezer (Blue Album)» pedido como «Weezer») passa a dar «não encontrado». A capa tirada dos dados locais deixa de aparecer quando os dados locais não têm o álbum pedido (antes vinha a capa da primeira linha da busca, de outro álbum).

**Mudança de comportamento declarada (fatia 2):** (1) «No Quarter» e os casos iguais voltam a carregar, com a linha no cartão. (2) O álbum trocado já guardado no navegador deixa de aparecer na primeira carga depois de publicar, sem esperar os 7 dias: é buscado de novo e vira o álbum pedido, ou o aviso de «não encontrado». (3) A série passa a guardar o identificador da Apple do álbum que foi de fato carregado; a capa e o ano guardados na consulta acompanham. (4) Remover um álbum de uma série deixa de casar por «contém»: uma consulta em texto que só contém o título e o artista do álbum não é mais removida no lugar da certa.

**Prototype**: none — MJRP, 2026-11-20 00:10: «eu dispenso prototipo por que estávamos arrumando e consertando problemas passados com pequenas melhorias e nao trabalhando em grande features nova, portanto por ora os prototipos estao dispensados.»

## Success Criteria
<!-- One measurable item per acceptance criterion of the imported nodes. -->
- Pedido «Stone Temple Pilots - Core»: nenhum lugar aceita «Shangri-La Dee Da» nem «Core Memories»; todos aceitam «Core» e as suas edições («Core (Deluxe Edition)», «Core - 2011 Remaster»).
- Com só outros álbuns do artista entre os candidatos, cada lugar termina em «não achei» (Apple: segunda fonte e depois `AlbumNotFoundError`; Spotify e dados locais: `null`; raspador: `null`, que o serviço responde como `not_found`; IA: `null`).
- Um identificador guardado que leva a outro álbum não é obedecido, e o álbum carregado traz `metadata.replacedSourceId` com o identificador que não foi usado.
- A contagem devolve uma linha por álbum pedido e os totais (`asked`, `same`, `different`, `notLoaded`), sem nenhuma escrita.
- `npx vitest run` verde (919 testes na fatia 1) e `npx vite build` compila.

**Fatia 2:**
- Pedido «Jimmy Page & Robert Plant - No Quarter», e o catálogo só com «No Quarter: Jimmy Page & Robert Plant Unledded»: carrega esse álbum, com `metadata.identityReason = 'title-before-subtitle'` e a linha no cartão.
- Pedido «The Wall» com «The Wall» e «The Wall: Live in Berlin» entre os candidatos: «The Wall», em qualquer ordem. Só com «The Wall: Live in Berlin»: ele, marcado. «The Wall: Live in Berlin» pedido nunca aceita «The Wall».
- Pedido «Greatest Hits» com «Greatest Hits: 1970-2002» e «Greatest Hits: Vol 2»: «não achei».
- O identificador guardado que não foi obedecido é trocado na série, uma vez, numa escrita só; uma falha dessa escrita não muda nada na tela.
- Na primeira carga depois de publicar, só os álbuns trocados são buscados de novo; nenhum álbum que passa na regra é buscado de novo.
- Na conta do MJRP, a contagem (`await albumIdentityAudit()`) termina com `different: 0`, ou cada linha `different` corresponde a um aviso de «não encontrado» na tela (prova do integrador).
- `npx vitest run` verde (1053 testes) e `npx vite build` compila.

## Out of Scope
- Escolher entre dois álbuns que têm o título pedido antes de um subtítulo («Greatest Hits: 1970-2002» e «Greatest Hits: Vol 2»): é «não achei» até existir a escolha de álbum pela pessoa (F57). Nenhuma tela é criada aqui para isso.
- Afrouxar o qualificador entre parênteses que não é edição («Weezer (Blue Album)» pedido como «Weezer»): a decisão do MJRP foi sobre o subtítulo; a revisão de todas as regras é a F68.
- Limpar o identificador guardado quando o álbum veio da segunda fonte (a IA) e não da Apple: não há identificador novo para gravar; o guardado fica como está e não é obedecido.
- O caminho de «remoção manual» do `SeriesEventHandler` (espera uma mensagem de erro que o serviço nunca emite): código morto, não mexido.
- A conferência da resposta da IA dentro do servidor (`GenerationService`): nesta fatia quem confere é o app, que é quem aceita o álbum.
- A busca de álbuns que a pessoa usa para escolher (`album-search/`): ela ordena opções para a pessoa decidir, não decide sozinha; é da F57.
- O casamento de faixas (notas e popularidade por faixa, exportação): outra regra, de outra feature (F62).
- A loja da Apple usada na busca (itens 3.17 e 3.23 do mapa).
- Uma tela nova para «não bate»: o desfecho é o «não encontrado» que já existe.

## Open Questions
<!-- ALL resolved before Plan. -->
- Um subtítulo depois de «:» ou « - » que não é nota de edição conta como parte do título («The Wall: Live in Berlin» não é «The Wall»; «Unreal Unearth: Unheard» não é «Unreal Unearth»)? — Sim, no primeiro degrau, nos dois sentidos. Revisto pelo MJRP em 2026-11-19 depois do caso «No Quarter»: quando o título pedido é o curto e o catálogo só tem um álbum com ele antes do subtítulo, esse álbum é aceito pelo segundo degrau (fatia 2, REQ-13).
- «(Live)» sozinho entre parênteses é nota de edição (a Apple o acrescenta ao título de álbuns ao vivo)? — Sim, só quando é a nota inteira; «(Live at the Forum '76)» não é. Decisão do agente, revisável.
- «IV» e «4» são o mesmo número? — Não nesta fatia: romano e arábico não são igualados. Decisão do agente, revisável.
- Quantos álbuns da conta do MJRP estão trocados hoje? — 8 álbuns em 227 (9 linhas), contados pelo integrador em 2026-11-19 antes de publicar a fatia 1; com a regra nova, 7 carregam o álbum certo e 1 («No Quarter») falhava, o que a fatia 2 conserta.
- O identificador é gravado quando o álbum foi aceito pelo segundo degrau? — Sim: é o álbum que a pessoa vê. Não congela o afrouxamento: o identificador guardado que leva ao título com subtítulo nunca é obedecido sozinho, então cada carga sem guardado passa pela busca por nome, e se o catálogo passar a ter o álbum pedido ele ganha e o identificador é trocado de novo. Decisão do agente, revisável.
- Nova versão do registro guardado, ou conferir na leitura? — Conferir na leitura. A versão nova jogaria fora os 227 álbuns e as notas guardadas da conta, e pediria tudo de novo às fontes; a conferência só refaz os registros trocados e vale igual para a memória, o IndexedDB e o localStorage antigo. Decisão do agente.
- Dois registros do mesmo álbum com subtítulo (a edição simples e a «Deluxe») contam como dois candidatos? — Não: são um álbum só (o mesmo título sem as notas de edição), e a escolha entre eles segue a ordem de sempre (o simples antes da edição, depois o ano mais próximo). Decisão do agente, revisável na F68.
