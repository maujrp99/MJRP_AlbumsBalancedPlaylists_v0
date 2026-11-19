---
status: In Progress
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-186"]
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
# Feature F61: Playlists guardadas em poucos segundos
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** A tela de playlists guardadas desenha na hora e mostra cada série assim que as playlists dela chegam. A leitura tem um dono só, lê várias séries ao mesmo tempo e guarda o estado de cada série: lendo, pronta, vazia ou falhou com «Try again».

**Por quê:** A tela lia as playlists de cada série em fila e só desenhava depois da última: 20 segundos na conta do MJRP (47 séries). Apagar um lote relia tudo, mais 20 segundos. É leitura de documentos da própria pessoa, não carga de álbuns, por isso tem desenho próprio, no molde da carga de álbuns da v4.0.

**Como saber que funcionou:** Medido no navegador, com a conta do MJRP: a primeira série aparece em cerca de 1 segundo e a lista inteira em poucos segundos; voltar à tela mostra a lista na hora.

## Problem Statement
O MJRP, em 2026-11-19: «temos problemas de carregamento lento nas playlists no inventory». Medido na regressão do mesmo dia (`reports/audits/2026-11-19-mjrpalbumblender-v0-browser-regression.md`, cenário 10): 20,1 s e 19,9 s até a lista aparecer, com «Scanning all series for playlists...» na tela. Decisão do MJRP de 2026-11-19: tudo entra na v5.0, e cada feature pronta e testada vai para produção sozinha.

O que o código fazia, lido antes do conserto (linhas da `main` em `c72dcc2`):

- **1 + N idas ao banco, em fila.** `SavedPlaylistsController.loadData` lia a coleção de séries (`:50`, uma leitura) e depois, num `for` com `await` dentro, a coleção `playlists` de cada série (`:56-62`; `BaseRepository.findAll`, `repositories/BaseRepository.js:130`, um `getDocs` por série). Para 47 séries: 48 leituras, nunca duas no ar. 20 s por 48 leituras dá cerca de 0,4 s por ida.
- **As playlists moram debaixo de cada série** (`artifacts/mjrp-albums/users/{uid}/curator/data/series/{seriesId}/playlists`, `repositories/PlaylistRepository.js:29-32`), e o documento da série não diz se ela tem playlists. Por isso toda série é lida, inclusive as que não têm nenhuma, e cada playlist vem inteira, com as faixas.
- **A tela só desenhava depois da última leitura.** `SavedPlaylistsView.mount` esperava `loadData` inteiro (`views/SavedPlaylistsView.js:46`) com um `isLoading` só para a tela toda (`:31,47,77`); a mensagem de espera era o único conteúdo até lá.
- **Apagar um lote relia tudo.** `deleteBatch` lia as playlists da série (`:217`), apagava uma por uma, sem transação (`:222`), e chamava `loadData` de novo (`:226`): outras 48 leituras em fila, com a tela parada. O botão Refresh fazia o mesmo (`views/SavedPlaylistsView.js:232-239`).
- **Uma falha derrubava a tela.** Qualquer leitura que falhasse rejeitava o `loadData` inteiro (`:80-84`): «Failed to load data.», sem «tentar de novo» e sem o que já tinha sido lido.
- **Sem identidade de carga.** Dois `loadData` ao mesmo tempo (Refresh duas vezes, apagar durante um Refresh) escreviam em `this.data` na ordem em que terminassem. Sair da tela não parava a leitura.
- **Tudo era desenhado de novo a cada mudança, inclusive o que não aparece.** Cada cartão de lote construía todas as linhas de playlist e todas as faixas dentro de recipientes escondidos (`components/playlists/SavedPlaylistCard.js:99-109`, `SavedPlaylistRow.js:57-67`), e a lista inteira era refeita a cada capa que chegava (`views/SavedPlaylistsView.js:332-338`), fechando o lote que a pessoa tivesse aberto.
- **O que não era causa:** as capas não seguravam o desenho (`preloadAllThumbnails` corre depois, `:78`), nenhum dado de álbum era carregado, e a tela não relia a cada aviso de store (ela não escuta nenhum).
- **O controlador falava com os repositórios** (`:13-14,48,59,215,239`), fora do desenho da v4.0 (ADR-0016, ADR-0019).

## Requirements
<!-- Local IDs, two digits. Each REQ traces to an imported node; none is invented here.
     Functional and non-functional (performance, security, accessibility) alike are REQ-xx. -->
- [REQ-01] A lista é lida com uma leitura das séries e uma leitura das playlists de cada série, nunca mais que isso, e as leituras das séries correm juntas até um limite, com prazo: a lista inteira chega em 1 + teto(N / limite) esperas em fila, não em 1 + N. · fixes UAT-186
  verified_by:: `test/services/playlists/SavedPlaylistsReader.reads.test.js`
- [REQ-02] A tela desenha sem esperar a leitura: a página aparece na hora, com uma linha que diz o que está sendo lido, e cada série aparece quando as playlists dela chegam, na ordem da lista (a mais recentemente atualizada primeiro), sem mexer nas que já estão na tela. · fixes UAT-186
  verified_by:: `test/views/SavedPlaylistsView.test.js`, `test/services/playlists/SavedPlaylistsReader.reads.test.js`
- [REQ-03] Cada série tem um estado próprio (lendo, pronta, vazia, falhou). A falha de uma série aparece nela, com «Try again» que relê só aquela série, e não apaga as outras; a falha da leitura das séries aparece como aviso com «Try again», e o que já estava na tela fica. Uma leitura que passa do prazo é uma falha, não uma espera sem fim. · fixes UAT-186
  verified_by:: `test/services/playlists/SavedPlaylistsReader.test.js`, `test/views/SavedPlaylistsView.test.js`
- [REQ-04] A resposta de uma leitura mais antiga nunca escreve por cima de uma mais nova, nem da lista nem de uma série; voltar à tela com uma leitura em curso entra nela em vez de começar outra; ao sair, a tela para de escutar e não desenha mais. · fixes UAT-186
  verified_by:: `test/services/playlists/SavedPlaylistsReader.test.js`, `test/views/SavedPlaylistsView.test.js`
- [REQ-05] Apagar um lote, ou todas as playlists de uma série, custa uma leitura e uma gravação atômica, e só aquela série muda na lista; nada relê a lista inteira além do botão Refresh e do «Try again» da lista. · fixes UAT-186
  verified_by:: `test/services/playlists/SavedPlaylistsReader.test.js`, `test/services/playlists/SavedPlaylistsReader.reads.test.js`, `test/components/playlists/SavedPlaylistsController.test.js`
- [REQ-06] O que a lista não mostra não é carregado nem construído antes: capas só das séries que têm playlists e só as três do cartão; as playlists de um lote e as faixas de uma playlist são desenhadas quando a pessoa abre. · fixes UAT-186
  verified_by:: `test/services/playlists/SavedPlaylistsReader.test.js`, `test/views/SavedPlaylistsView.test.js`, `test/models/savedPlaylists.test.js`
- [REQ-07] Ao voltar à tela na mesma sessão, o que já foi lido aparece na hora e é relido por trás; uma resposta igual à que está na tela não redesenha nada. · fixes UAT-186
  verified_by:: `test/services/playlists/SavedPlaylistsReader.test.js`
- [REQ-08] A leitura tem um dono só: a tela e o controlador não importam repositório nem Firestore; o leitor só alcança o banco pelo que recebe; o store só guarda estado. · fixes UAT-186
  verified_by:: `test/architecture/savedPlaylistsBoundaries.test.js`

## Observable States
<!-- What the imported nodes point_to: the screen state in info-arch.md (the prototype the human judged —
     PRINCIPLES.md §I.13) or the behavior state in behavior.md. N/A only if the nodes point to none. -->
N/A: a feature não importa nenhum requisito (conserto de issue). Estados do `docs/specs/behavior.md` reescritos para o que o código faz agora: `^saved-loading`, `^saved-load-failed`, `^saved-empty`, `^saved-batch-card`, `^saved-series-header`, `^saved-playlist-details`, `^saved-batch-delete`, `^saved-series-delete-all`. Estados novos: `^saved-series-arriving`, `^saved-series-failed`, `^saved-back-again`.

## Prototype Parity (if the feature touches a screen)
- Prototype: none. Nenhuma tela foi redesenhada. O que muda à vista: some o bloco «Scanning all series for playlists...» no meio da tela; no lugar, uma linha pequena acima da lista («Reading your series...», «Reading playlists: 12 of 47 series», «Updating...») e as séries entrando uma a uma; uma série que falhou mostra um aviso vermelho com «Try again» dentro do próprio bloco; a falha da lista mostra um aviso com «Try again» no lugar de «Failed to load data.»; a lixeira da série só aparece quando há playlists.
- Transversal layer touched: none. `test/helpers/fakeFirestore.js` ganhou a contagem de leituras, usada só por testes.
- Design-system cuts or swaps: none. O projeto não tem `design-system.md`; os avisos usam as classes que a tela já usava.

## Success Criteria
- Com o banco falso e 47 séries: 48 leituras, nenhum caminho lido duas vezes, 8 no ar ao mesmo tempo; a lista de séries está no store depois de 1 espera, as primeiras séries depois de 2, a lista inteira depois de 7 (antes: 48, 48 e 48).
- «Try again» numa série: 1 leitura. Apagar um lote: 1 leitura e 1 gravação (antes: 1 + P apagamentos soltos + 48 leituras).
- No navegador, com a conta do MJRP (47 séries): primeira série na tela em cerca de 1 s e lista inteira em poucos segundos; a medir pelo integrador, pelo roteiro do relatório de entrega (TASK-11).
- Suíte: 1046 testes passando (982 antes da feature); `vite build` compila; complexidade até 10 nas funções novas.

## Out of Scope
- **Mudar o modelo de dados.** Um resumo das playlists gravado no documento da série (quantos lotes, quantas playlists, faixas, duração) deixaria a tela desenhar com uma leitura só e ler as faixas quando a pessoa abre o lote. Pede migração dos documentos existentes e muda quem grava playlists: fica como proposta no plano, não foi feito.
- **Uma consulta só para as playlists de todas as séries** (`collectionGroup`). As regras em vigor (`firestore.rules`) só liberam o caminho `artifacts/{appId}/users/{userId}/curator/{document=**}`; uma consulta por grupo de coleção precisa de uma regra `match /{path=**}/playlists/{id}` e de um índice de grupo. Nenhum dos dois pode ser publicado por esta feature.
- A tela de edição do lote (`PlaylistsController`), o blend e o inventário (a outra metade da UAT-186: o inventário foi medido em 1,2 s).
- A ordenação «Recently Updated» de `utils/FilterUtils.js`, que não sabe ler a data do Firestore e por isso deixa a ordem como recebe; a lista já chega na ordem certa do leitor.
- O botão «Create Series» do estado vazio (UAT-27).

## Open Questions
<!-- ALL resolved before Plan. -->
- Mostrar as séries ainda em leitura como blocos de espera? — Não: a maior parte das séries pode não ter playlists, e os blocos sumiriam em seguida. A linha acima da lista diz quantas já responderam. Decidido pelo agente — revisável.
- Ao voltar à tela, confiar no que está na memória ou reler? — Mostrar na hora o que está na memória e reler tudo por trás, em paralelo. Reler só a série alterada exigiria que todo lugar que grava playlists avisasse o leitor (hoje é mais de um serviço), e uma gravação esquecida deixaria a lista errada. Decidido pelo agente — revisável.
- Quantas leituras ao mesmo tempo? — 8, com prazo de 15 s por leitura (`READ_LIMITS`). Não foi medido no navegador; o integrador pode ajustar depois de medir. Decidido pelo agente — revisável.
- Sair da tela cancela a leitura? — Não: a tela para de escutar, e a leitura termina por trás (poucos segundos, com prazo) para a volta encontrar a lista pronta. Uma nova leitura pedida pelo Refresh descarta a anterior. Decidido pelo agente — revisável.
