---
status: In Progress
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-206"]
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
# Feature F69: Popularidade do Spotify: falha é falha, e «não conectado» não é «sem dado»
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** A popularidade do Spotify passa a ter três desfechos separados: o Spotify não tem o álbum («sem dado»), a consulta falhou (token vencido, 401, 429, rede: «falhou», com «tentar de novo») e a conta não está conectada (nem falha nem «sem dado»; nada é gravado na série). O mesmo vale para o caminho do servidor, se alguma rota o expõe.

**Por quê:** Hoje os três casos terminam como «sem dado», que é guardado por 1 hora e gravado nos fatos da série como «a popularidade não tem dado». A proposta emendada da F52 deixou este ponto fora e pediu uma feature própria.

**Como saber que funcionou:** Com o Spotify desconectado, nenhuma série passa a dizer «sem popularidade»; com o acesso vencido, o álbum mostra «falhou» e «tentar de novo» traz o dado depois de reconectar.

## Problem Statement
Achado pelo auxiliar da F52 em 2026-11-19 (`PopularityEnricher` termina em `empty` sempre que o álbum não tem `spotifyId`). Criada pelo agente sob a dispensa do MJRP de 2026-11-19 19:03 («decida e registre»).

Lido no código em 2026-11-19, antes de mexer (os caminhos e as linhas estão no `plan.md`, «Diagnóstico»): a falha era engolida em três camadas (`SpotifyService.enrichAlbumData` devolvia `null` para tudo; a busca só pelo artista lia falha como «nenhum candidato»; `applyEnrichmentToAlbum` engolia o resto), «conectado» queria dizer «o acesso ainda não venceu» (depois de uma hora, com a renovação disponível, ninguém perguntava ao Spotify), e dois caminhos perguntavam ao Spotify fora da fila da carga.

## Requirements
<!-- Local IDs, two digits. Each REQ traces to an imported node; none is invented here.
     Functional and non-functional (performance, security, accessibility) alike are REQ-xx. -->
- [REQ-01] A consulta da popularidade de um álbum tem três desfechos que não se misturam, decididos na camada mais baixa e levados até a tela: «o Spotify não tem este álbum» (resposta, com o motivo), «a consulta falhou» (erro tipado, nunca uma resposta) e «a pessoa não está conectada ao Spotify» (ninguém é perguntado). · fixes UAT-206
  verified_by:: `test/services/spotify/SpotifyAlbumPopularity.test.js`, `test/services/albums/spotifyPopularity.test.js` («SpotifyPopularitySource», «PopularityEnricher»), `test/services/spotify/SpotifyAlbumMatch.test.js`
- [REQ-02] «Não conectado» não é falha nem «sem dado»: é um estado próprio da fonte, que não é guardado no navegador nem escrito nos fatos da série; o álbum fica pronto, a comparação de faixas mostra uma linha discreta («Connect Spotify to see popularity.»), e o aviso do blend diz «because Spotify is not connected» em vez de «none at the source». Um acesso que não pôde ser renovado (a sessão acabou) vira «não conectado», não falha de cada álbum. · fixes UAT-206
  verified_by:: `test/services/albums/spotifyPopularity.test.js` («the load with the three outcomes»), `test/models/popularityOutcomes.test.js`, `test/components/ranking/TracksRankingComparison.popularity.test.js`
- [REQ-03] Quando a pessoa conecta o Spotify, as fontes «não conectado» dos álbuns na tela são pedidas pela fila da carga, só essa fonte, sem recarregar álbum. · fixes UAT-206
  verified_by:: `test/services/albums/spotifyPopularity.test.js` («the person connects…»)
- [REQ-04] A falha é falha: a fonte fica em `failed`, nunca é guardada, e é pedida de novo pelo «tentar de novo» da série, pelo «Refetch» do álbum ou pelo botão da própria linha. Um pedido de espera do Spotify (429) de até 30 segundos segura a popularidade e a retoma sozinho, com um aviso só; mais longo, ou sem tempo dito, é falha; e o Spotify não é perguntado de novo antes da hora que deu. · fixes UAT-206
  verified_by:: `test/services/albums/spotifyPopularity.test.js` («a failure is failed…», «Spotify asks to wait…», «Spotify says "wait N seconds"…», «a wait longer than the load may hold…»)
- [REQ-05] «O Spotify não tem este álbum» é guardado com o motivo e vale pelo mesmo tempo do «sem página» das notas (24 horas), e só enquanto a versão da regra de identidade que o decidiu for a do app. · fixes UAT-206
  verified_by:: `test/services/albums/spotifyPopularity.test.js` («what the browser keeps of the popularity»), `test/services/albums/emptyTrust.test.js`
- [REQ-06] O que já está gravado errado se refaz uma vez: um «sem dado» de popularidade guardado no navegador sem motivo não vale, e um `popularity: false` nos fatos da série sem a versão nova é lido como «não se sabe» e reescrito na próxima carga do álbum. Os fatos passam a ter uma resposta por fonte, e só o que a fonte disse. · fixes UAT-206
  verified_by:: `test/models/popularityOutcomes.test.js` («the facts of the series…», «the filters read "unknown" as unknown»), `test/services/albums/spotifyPopularity.test.js`, `test/services/series/SeriesFactsService.test.js`
- [REQ-07] Um caminho só pergunta ao Spotify pela popularidade de um álbum: a fonte de popularidade da carga. O laço de fundo sobre as séries saiu, o botão da comparação de faixas pede pela carga, e a tela não escreve dado do Spotify em álbum carregado. Um teste reprova quem voltar a perguntar por fora. · fixes UAT-206
  verified_by:: `test/architecture/spotifyPopularityOnePath.test.js`, `test/architecture/screensLoadThroughTheService.test.js`
- [REQ-08] O gêmeo do servidor (`server/lib/services/spotifyPopularity.js`, alcançado por `POST /api/generate`) segue o contrato de resposta da F52: «achou», «o Spotify não tem» e «o servidor não tem credencial do Spotify» são desfechos; a consulta que falhou é lançada como `UpstreamError`. · fixes UAT-206
  verified_by:: `test/server/spotifyPopularityOutcome.test.js`, `test/server/spotifyAlbumIdentity.test.js`

## Observable States
<!-- What the imported nodes point_to: the screen state in info-arch.md (the prototype the human judged —
     PRINCIPLES.md §I.13) or the behavior state in behavior.md. N/A only if the nodes point to none. -->
A feature não importa nenhum requisito (conserto, via rápida). Os estados de comportamento que mudam, em `docs/specs/behavior.md`: `^library-loading-skeleton` (os três desfechos da popularidade), `^album-enrich-spotify` (a linha da popularidade na comparação de faixas, no lugar do botão «Enrich Data»), `^blend-source-missing` (o motivo «because Spotify is not connected»), `^spotify-background-enrichment` (ao conectar; a espera do Spotify) e `^local-album-cache` (o que é guardado da popularidade).

## Prototype Parity (if the feature touches a screen)
- Prototype: none. Nenhuma tela foi redesenhada. O que a pessoa vê de diferente é texto: a linha da popularidade na comparação de faixas da vista expandida (quatro textos, um botão que já existia com outro rótulo), um motivo novo no aviso do blend e um aviso de espera novo. Não foi visto num navegador (TASK-12).

**Prototype**: none — MJRP, 2026-11-20 00:10: «eu dispenso prototipo por que estávamos arrumando e consertando problemas passados com pequenas melhorias e nao trabalhando em grande features nova, portanto por ora os prototipos estao dispensados.»

## Success Criteria
<!-- One measurable item per acceptance criterion of the imported nodes. -->
- Com o Spotify desconectado, carregar uma série não grava `popularity: false` nos fatos de nenhum álbum nem `empty` no registro do navegador; o estado da fonte é `not-connected`.
- Uma consulta que falha (rede, 5xx, 429 longo) deixa a fonte em `failed` e nada guardado; «tentar de novo» a pede outra vez.
- Um álbum que o Spotify não tem fica `empty` com `reason: 'not_found'` e a versão da regra, e não é perguntado de novo por 24 horas.
- Ao conectar, os álbuns da tela em `not-connected` passam a `done` (ou ao seu desfecho) sem nova busca no catálogo.
- `git grep` não acha `SpotifyEnrichmentService`, `enrichAlbumData` nem `applyEnrichmentToAlbum` em `public/js`; `npx vitest run test/architecture/spotifyPopularityOnePath.test.js` passa.
- `npx vitest run` verde (1933 testes; 1765 antes da F69, 1855 na `main` com a F58) e `npx vite build` compilando.

## Out of Scope
- Onde ficam as chaves do Spotify enquanto a pessoa está conectada (UAT-28): só a análise, no `plan.md`; o armazenamento não mudou.
- A exportação para o Spotify (`SpotifyExportService.js`, `SpotifyExportModal.js`, `services/export/**`), a regra de identidade de álbum, o seletor e o classificador de álbuns, as playlists guardadas.
- `SpotifyAuthService._requestNewAccess` encerra a sessão em qualquer falha da renovação, a de rede incluída: fica como está (ver Open Questions).
- `server/lib/fetchRanking.js`: a cadeia de fontes do ranking (notas, popularidade, IA) segue como era; só o que o módulo do Spotify devolve e lança mudou.
- Mostrar o estado de cada fonte no cartão do álbum da vista compacta: o cartão nunca mostrou estado de fonte, e a feature não inventa esse lugar.

## Open Questions
<!-- ALL resolved before Plan. -->
- Por quanto tempo vale «o Spotify não tem este álbum»? — Decidido pelo agente, revisável: 24 horas, o mesmo `EMPTY_TRUST.not_found` das notas, e só sob a versão da regra de identidade que o decidiu.
- Um 429 do Spotify segura a carga ou falha a fonte? — Decidido pelo agente, revisável: segura quando a espera é de até 30 s (`MAX_SPOTIFY_HOLD_MS`, o teto que a exportação já espera); acima disso, ou sem tempo dito, é falha com «tentar de novo». Motivo: enquanto há espera, nenhuma tela espera fonte alguma, e o Spotify pode pedir horas.
- O laço de fundo e o botão «Enrich Data»: manter, rotear ou tirar? — Decidido pelo agente, revisável: o laço saiu (a carga já pede a popularidade de todo álbum que carrega, e ao conectar pede a dos que estão na tela); o botão foi roteado pela carga e mudou de rótulo conforme o estado.
- Os fatos antigos `popularity: false`: confiar ou refazer? — Decidido pelo agente, revisável: lidos como «não se sabe» e reescritos na próxima carga. Custo: uma gravação a mais por série na primeira carga depois da F69 (os fatos ganham a versão), e cada álbum com «sem dado» guardado sem motivo é perguntado ao Spotify uma vez (nenhuma chamada se a pessoa não está conectada).
- Mudanças de comportamento para o MJRP julgar: (1) a janela do álbum («View») e o inventário não têm mais o botão «Enrich Data»; (2) ao conectar, a popularidade das séries que não estão na tela só é buscada quando a série carrega, e os avisos «Enriching N albums…» saíram; (3) depois de uma hora, com a sessão renovável, a popularidade volta a ser buscada (antes ficava «sem dado» até reconectar); (4) o filtro «Spotify popularity» conta como «não conferido» o álbum cuja popularidade não se sabe; (5) os fatos de uma série passam a ser escritos mesmo quando uma fonte falhou, com a fonte que falhou de fora (antes, a falha de uma fonte segurava os fatos do álbum inteiro); (6) álbum com mais de 50 faixas passa a ter popularidade (antes a leitura falhava calada).
- A renovação do acesso que falha por rede encerra a sessão do Spotify (`SpotifyAuthService._requestNewAccess` chama `logout()` em qualquer erro). — Aberta para o MJRP: com a F69 isso aparece como «não conectado» e não como falha; o conserto mexe no caminho que a exportação também usa, e não foi feito aqui.
