---
status: Done
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-205"]
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
# Feature F68: As regras de identidade de álbum revistas, fáceis de ler e de manter
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** Uma revisão de todas as regras que decidem «este é o álbum pedido» (`shared/albumIdentity.js` e os lugares que a chamam): o que normaliza, o que conta como o mesmo artista, o que conta como edição, como trata subtítulo e parênteses, como escolhe entre candidatos, como lê o que cada fonte escreve e com que texto a fonte é procurada. O resultado é uma regra que se lê de cima a baixo, feita de listas em que cada caso de borda tem nome, exemplo real e teste, e um desenho que aguenta crescer quando entrarem as seções por gênero.

**Por quê:** A regra única nasceu na F55 e já ganhou a primeira exceção (o subtítulo de «No Quarter»). O MJRP prevê o algoritmo ficando mais complexo com as futuras seções de gênero e quer que a manutenção e o entendimento continuem fáceis. No mesmo dia, uma varredura dos 199 álbuns dele contra a fonte de notas mostrou que a regra exata deixou 16 sem página (8%).

**Como saber que funcionou:** Quem nunca viu o código explica, lendo um arquivo, por que dois álbuns são ou não o mesmo; cada exceção tem nome, exemplo real e teste; dos 16 álbuns da varredura, os 10 que a fonte tem voltam a ser achados, cada um por um motivo com nome, e os outros 6 seguem «não tem» com a razão escrita; a contagem de álbuns trocados na conta do MJRP segue em zero.

## Problem Statement
O MJRP, em 2026-11-19: «o no quarter é um edge case, vamos tratá-lo com afrouxamento mas coloca no Do not forget do memory e abre uma feature pra revisao das regras todas pra encontrar a identidade de album, até pq depois com as futuras seções de genero, prevejo termos um algoritmo ficando mais complexo e precisamos revisar pra que a manutencao e o entendimento do mesmo seja fácil de entender.»

A entrada do trabalho é a varredura `reports/audits/2026-11-19-mjrpalbumblender-v0-ratings-source-sweep.md`: 16 álbuns reais que a fonte de notas deixou de achar. Antes da F55 a comparação era «um título contém o outro», que achava vários deles e também carregava álbuns errados. O objetivo não é voltar ao «contém»: é uma regra que explica cada aceite.

## Requirements
<!-- Local IDs, two digits. Each REQ traces to an imported node; none is invented here.
     Functional and non-functional (performance, security, accessibility) alike are REQ-xx. -->
- [REQ-01] A regra de identidade é um módulo só, puro, usado pelo app e pelo servidor, organizado na ordem em que uma comparação acontece (normalização; artista; título em dois degraus; uma comparação; a escolha entre candidatos; os leitores de rótulo de fonte; os textos de busca). O artista e o segundo degrau do título são listas de regras, cada uma com nome próprio, uma frase e um exemplo real; todos os motivos, de aceite e de recusa, estão numa tabela no topo do arquivo e na mesma tabela como dado, com um exemplo cada. Não há nota, limiar nem «um texto contém o outro». · fixes UAT-205
  verified_by:: `test/shared/albumIdentityRules.test.js`, `test/shared/albumIdentity.test.js`
- [REQ-02] Dois nomes são o mesmo artista quando são as mesmas palavras depois de normalizados (o que junta os nomes, «&», «and», «+», «,», e o «The» do começo não contam) ou os mesmos nomes em outra ordem («Robert Plant & Jimmy Page» = «Jimmy Page & Robert Plant»). Um nome mais curto ou mais longo é outro artista («Page & Plant», «James Brown And His Famous Flames»). · fixes UAT-205
  verified_by:: `test/shared/albumIdentityRules.test.js`, `test/models/askedAlbumOtherSources.test.js`
- [REQ-03] O segundo degrau («é o álbum, se a fonte não tiver nada melhor») reconhece, além do título antes de um subtítulo: o título do candidato com algo mais entre parênteses que não é nota de edição nem número; o título pedido escrito entre parênteses ou colchetes no candidato; o nome do artista na frente do título; e as duas escritas de um mesmo álbum listadas, por artista, como fatos (`KNOWN_WRITINGS`). Todas num sentido só (o pedido é o curto), nunca para consulta sem artista, e nunca disputando com o primeiro degrau. · fixes UAT-205
  verified_by:: `test/shared/albumIdentityRules.test.js`
- [REQ-04] Só a escolha entre os candidatos de uma fonte transforma o segundo degrau em «igual», e só quando os candidatos do segundo degrau são um álbum só; o álbum aceito assim fica marcado com o motivo da regra (`metadata.identityReason`), o cartão dele mostra uma linha que diz por qual regra, verdadeira para cada uma, e a contagem só-leitura o conta como igual, com o motivo. · fixes UAT-205
  verified_by:: `test/shared/albumIdentityRules.test.js`, `test/components/ui/AlbumCardIdentityNote.test.js`, `test/architecture/albumIdentityRule.test.js`
- [REQ-05] A fonte de notas é procurada por uma lista explícita e ordenada de tentativas (a página do artista; artista e título; título sozinho; artista sozinho; busca em HTML), cada uma julgada pela mesma regra, pela fila educada e dentro do prazo que já existem. O título mandado à busca é o da própria regra (sem notas de edição; depois as outras escritas conhecidas); não existe outro limpador de título no app nem no servidor. · fixes UAT-205
  verified_by:: `test/server/ratingsSourceSweep.test.js`, `test/server/scraperIdentity.test.js`, `test/architecture/albumIdentityRule.test.js`
- [REQ-06] Os 16 álbuns da varredura de 2026-11-19 e os casos que a regra já tratava rodam offline, pela regra e pela busca do raspador, contra as respostas da fonte guardadas como vieram: 10 são achados, cada um com o motivo e a tentativa esperados; 3 são outro lançamento e 3 não existem na fonte, e seguem «não tem». Um texto de busca sem resposta guardada reprova o teste. · fixes UAT-205
  verified_by:: `test/server/ratingsSourceSweep.test.js`
- [REQ-07] Um «não tem» da fonte de notas decidido por outra versão da regra não é acreditado: o servidor carimba o `not_found` com a versão da regra que o decidiu, o carimbo vai com o motivo até o registro guardado no navegador, e o registro só vale enquanto essa for a versão do app. Um registro sem versão (de antes desta feature, ou de um servidor de antes) não vale. O «página sem notas» não depende da regra e mantém o seu prazo. · fixes UAT-205
  verified_by:: `test/services/albums/emptyTrust.test.js`, `test/server/ratings.test.js`
- [REQ-08] O teste de arquitetura falha quando o veredito «igual» é construído fora do primeiro degrau e da porta única do segundo, quando uma regra do segundo degrau constrói veredito ou compara por «contém», quando um lugar nomeia um motivo do segundo degrau, quando as listas da regra mudam sem a versão subir junto, e quando aparece um limpador de título que não é o da regra. · fixes UAT-205
  verified_by:: `test/architecture/albumIdentityRule.test.js`
- [REQ-09] O arquivo da regra e o plano dizem como acrescentar uma regra (onde entra e com o que tem de vir: nome, exemplo real, teste, degrau, frase no cartão, versão) e onde uma regra de um gênero entraria nesta estrutura, sem construí-la. · fixes UAT-205
  verified_by:: `test/shared/albumIdentityRules.test.js`
- [REQ-10] Em produção, com a conta do MJRP, a mesma varredura rodada de novo devolve `not_found` só para os 6 álbuns que a tabela diz que a fonte não tem, e a contagem só-leitura de álbuns trocados segue em zero. · fixes UAT-205
  verified_by:: [[uat#^UAT-205]]

## Observable States
<!-- What the imported nodes point_to: the screen state in info-arch.md (the prototype the human judged —
     PRINCIPLES.md §I.13) or the behavior state in behavior.md. N/A only if the nodes point to none. -->
A feature não importa nó de requisito com estado de tela e não cria tela. Um estado de comportamento muda de texto: o cartão do álbum aceito pelo segundo degrau (`docs/specs/behavior.md`, `^library-album-subtitle-note`) passa a ter uma frase por regra:

| Regra | Linha no cartão |
|---|---|
| `title-before-subtitle` | «Asked for by its short title: the catalog only has this one, with a subtitle.» (sem mudança) |
| `title-without-parentheses` | «Asked for by its short title: the catalog only has this one, with more in parentheses.» |
| `title-in-parentheses` | «Asked for by the name the catalog writes in parentheses.» |
| `title-with-artist-name` | «Asked for by its title: the catalog writes the artist's name in front of it.» |
| `title-written-otherwise` | «Asked for in another spelling: the catalog writes the title this way.» |

**Mudança de comportamento declarada:** (1) álbuns que hoje ficam sem notas voltam a tê-las (10 dos 16 da varredura). (2) No catálogo, um pedido curto cujo único candidato tem algo mais entre parênteses passa a carregar esse álbum, com a linha no cartão, onde antes dava «não encontrado»: «Weezer» com só «Weezer (Green Album)» na lista; «Hotel California» com só «Hotel California (Live at the Forum '76)». Com o álbum pedido na lista, é ele que vem; com dois candidatos assim, segue «não encontrado». (3) Na primeira carga depois de publicar, cada álbum com «não tem» guardado pergunta as notas de novo, uma vez.

**Prototype**: none — MJRP, 2026-11-20 00:10: «eu dispenso prototipo por que estávamos arrumando e consertando problemas passados com pequenas melhorias e nao trabalhando em grande features nova, portanto por ora os prototipos estao dispensados.»

## Success Criteria
<!-- One measurable item per acceptance criterion of the imported nodes. -->
- Cada linha de `REASONS_EXPLAINED` (11 motivos) devolve, no teste, o veredito e o motivo que a tabela diz.
- Cada regra do segundo degrau passa pelos mesmos seis testes: sozinha não é «igual»; única entre os candidatos é escolhida com o motivo; nunca antes do álbum pedido; o artista tem de ser o mesmo e a consulta sem artista não entra; o álbum guardado só vale com o motivo; a fonte de um álbum só é acreditada.
- Offline, contra as respostas guardadas: 10 dos 16 achados (páginas 1169, 1715, 179658, 2006, 935, 23608, 8269, 144, 101825, 117), 6 «não tem».
- Um álbum que a fonte não tem custa três textos de busca («Solarstone», «Solarstone Rain Stars Eternal», «Rain Stars Eternal»), a página do artista e a busca em HTML.
- `npx eslint --rule 'complexity: [2, 10]' shared/albumIdentity.js` não acusa nenhuma função.
- `npx vitest run` verde (1343 testes, 110 arquivos; eram 1217, 107) e `npx vite build` compila.
- Em produção (prova do integrador): a varredura devolve `not_found` só para os álbuns 3, 9, 11, 12, 13 e 16 da tabela; `await albumIdentityAudit()` termina com `different: 0`.

## Out of Scope
- Voltar ao «um título contém o outro», dar nota de semelhança ou usar limiar.
- Aceitar o álbum curto quando o pedido é o longo («Unreal Unearth: Unheard» → «Unreal Unearth»): é outro lançamento.
- Uma regra geral para o intervalo de anos no título: o «Greatest Hits 1970-2002» do Elton John não é o «Greatest Hits» dele; «Substance 1977-1980» entrou como fato na lista de escritas conhecidas.
- A forma curta de um artista que nenhuma regra deriva («Page & Plant» para «Jimmy Page & Robert Plant»).
- A regra de um gênero (música clássica): o lugar dela está descrito, não construído.
- A varredura das outras três fontes (o que a Apple Music e o Spotify listam para os mesmos álbuns): o que a regra dá de graça a elas está testado com as formas que elas devolvem; a verdade delas pede a sua própria varredura.
- Escolher entre dois álbuns do segundo degrau (F57); a loja da Apple; os controladores e a carga das outras telas (F56, F63).
- Mandar ao app o motivo pelo qual o servidor achou a página de notas.

## Open Questions
<!-- ALL resolved before Plan. -->
- A lista de escritas conhecidas (`KNOWN_WRITINGS`) é aceitável como lugar do que nenhuma regra deriva? — Decidido pelo agente em 2026-11-19 20:08, revisável pelo MJRP: sim, com três entradas, cada uma com onde foi vista; tirar uma entrada devolve aquele álbum ao «não tem».
- Um álbum do segundo degrau que é o único na lista pode ser um vizinho («Hotel California (Live at the Forum '76)»)? — Decidido pelo agente em 2026-11-19 20:08, revisável: segue a decisão do MJRP para o subtítulo («The Wall» → «The Wall: Live in Berlin»): aceito, com a linha no cartão.
- Um número depois de «:» entra no segundo degrau («Greatest Hits: Vol 2») e o mesmo número entre parênteses não. — Fica como está: o primeiro é comportamento da F55 fixado em teste e a varredura não mostrou que esteja errado; registrado em «Riscos» do plano para o MJRP decidir.
