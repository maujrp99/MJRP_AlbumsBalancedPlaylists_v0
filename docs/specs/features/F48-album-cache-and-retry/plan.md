# Plan — Feature F48: O guardado de álbuns é confiável: nova tentativa, sem gravar à toa, e o Clear Cache limpa de verdade · Spec: [[spec]]
**Approved**: not a gate (via rápida; o MJRP julga)

> Escrito depois do código (passo retroativo da via rápida), em 2026-11-19 13:16.

## Architecture Approach
Encaixa na seção «Carga da tela de álbuns — proposta» do `arch.md` (seções 15 e 17): o Firestore só atrás de repositório, a store como estado puro, as fontes externas por adaptador, e as dependências injetadas onde há regra a testar. Quatro movimentos, cada um no seu endereço:
- A política de nova tentativa vira um utilitário sem conhecimento do projeto (`utils/retry.js`, padrão `DP-23`), e o cliente de API diz quais falhas passam. O prazo por chamada (`DP-22`) entra junto, porque o `DP-23` o exige.
- O repositório de ranking passa a receber o cache por injeção, com a instância do app como padrão.
- A limpeza do guardado vira uma função de serviço com as dependências injetadas; a composição (`albumLoading.js`) liga as reais, e o rodapé recebe a função pronta: o componente não importa serviço nenhum.
- A gravação na coleção compartilhada `albums` sai da store e vai para um repositório novo sobre `BaseRepository`.

Refina o `arch.md` (seção 17, tabela «proposto × construído», e o parágrafo das funções de aptidão) e o `data-model.md` (o que se grava em `albums`).

## Technical Design
**Fluxo da nova tentativa (REQ-01, REQ-02, REQ-03).** `CatalogAdapter.find` → `apiClient._fetchAlbumFromAPI(query)` → `retryWithBackoff(() => _postGenerate(queryStr))`.
- `public/js/utils/retry.js`: `retryWithBackoff(attempt, { retries, baseMs, capMs, shouldRetry, pause, random, onRetry })` e `backoffWaitMs(n)` = `min(capMs, baseMs × 2^n)` com a metade de cima sorteada. Devolve o que a tentativa devolveu; ao desistir, levanta o último erro real.
- `public/js/api/client.js`: `ApiError` (`kind`: `http`, `network`, `timeout`; `status`; `isTransient`); `_postGenerate` faz uma chamada com prazo de 90 s (`AbortController`); `_fetchAlbumFromAPI` monta o texto do pedido fora do `try` (a causa da UAT-175) e pede nova tentativa só para `isTransient` (rede ou 5xx). Duas novas tentativas, esperas de 1 s e 2 s antes do sorteio, teto de 8 s.
- `public/js/services/albums/adapters/CatalogAdapter.js`: a falha da segunda fonte continua virando «não encontrado», mas o motivo vai ao console.

**Fluxo do ranking (REQ-04, REQ-05).** `UserRankingEnricher` → `userRankingRepository.getRanking(userId, albumId)`.
- `public/js/repositories/UserRankingRepository.js`: `constructor(cache = cacheManager)`; a entrada guardada é `{ ranking }` (com `null` para «sem ranking»), válida por `USER_RANKING_TTL_MS` (1 hora); `saveRanking` e `deleteRanking` esquecem a entrada; leitura que falha não é guardada; falha do cache custa só a próxima leitura.

**Fluxo da limpeza (REQ-06, REQ-07, REQ-08).** Botão do rodapé → `clearCaches()` injetado → `clearAlbumCaches({ loadService, cache, storage })`.
- `public/js/services/albums/clearAlbumCaches.js`: `loadService.stop()`, `await cache.clear()`, remove as chaves `album_cache_v…` do `storage`; devolve `{ legacyEntriesRemoved }`; falha se o cache não limpou.
- `public/js/services/albums/albumLoading.js`: exporta `clearAppAlbumCaches`, com o `albumLoadService`, o `cacheManager` e o `localStorage`.
- `public/js/cache/CacheManager.js`: `clear()` passa a falhar quando o IndexedDB não limpa (antes só registrava no console).
- `public/js/components/Footer.js`: `new Footer({ clearCaches, reload, reloadDelayMs })`; espera a limpeza, mostra o aviso e recarrega; na falha, avisa e não recarrega. Não chama mais `localStorage.clear()`.
- `public/js/app.js`: entrega `clearAppAlbumCaches` ao rodapé.

**Fluxo do «Refetch» (REQ-09, REQ-10).** `SeriesController.refetchAlbumMetadata` → `SeriesService.refetchAlbumMetadata` → `this.albumRepository.saveAlbum(enriched)`.
- `public/js/repositories/SharedAlbumRepository.js`: coleção raiz `albums`; `toSharedAlbumData(album)` devolve dado simples sem `hasUserRanking`, `userRanking` e sem `userRank` nas listas de faixas; `saveAlbum` recusa álbum sem `id` e grava por `BaseRepository.save` (`merge`).
- `public/js/services/SeriesService.js`: cria o repositório no construtor e o chama no lugar de `albumsStore.updateAlbum(this.db, enriched)`. A atualização da tela continua por `injectAlbumsIntoViewCache` e por `albumLoadService.adoptAlbum`, como já era.
- `public/js/stores/albums.js`: saem `saveToFirestore`, `loadFromFirestore` (sem chamador), `updateAlbum(db, album)` e o `import` do Firestore.
- Removidos: `public/js/views/controllers/AlbumsStateController.js` (código morto que chamava `albumsStore.updateAlbum`) e `public/legacy/AlbumsView_DEPRECATED.js` (o único arquivo que o importava, também sem quem o importe).

## UI/UX Design (if the feature touches a screen)
Só o rodapé. O aviso ao lado do botão já existia («Cache Cleared!»); ganhou um segundo texto para a falha («Could not clear the cache») e `role="status"`. O botão fica desabilitado enquanto a limpeza corre. Nenhuma peça da camada transversal muda; não há cenário para sensor visual.

## Dependencies
Nenhuma.

## Documents Consulted
`docs/specs/arch.md` (seção «Carga da tela de álbuns — proposta», 1 a 17), `docs/specs/data-model.md`, `docs/specs/uat.md` (UAT-14, UAT-175, UAT-176, UAT-177), `docs/specs/constitution.md`, `docs/wiki/harness/design-patterns.md` (`DP-01`, `DP-22`, `DP-23`), `docs/manual/` (06, 07, 07b, 08, 11, 19). `info-arch.md`, `behavior.md` e `design-system.md`: o primeiro e o terceiro não existem no v0; o segundo não descreve nada do que mudou aqui.

## Risks & Considerations
- A nova tentativa numa rota de IA paga pode custar mais. Limitado a duas, só em falha de rede ou 5xx; prazo estourado não repete.
- O prazo de 90 s é novo: uma geração mais lenta que isso passa a falhar. Não há medição do tempo real da rota (ela responde 402 hoje).
- O `CacheManager.clear()` agora falha quando o IndexedDB não limpa. O único outro chamador é `albumCache.clearAll`, que não tem chamador.
- O ranking guardado por uma hora pode mostrar um ranking velho se ele foi editado noutro aparelho dentro dessa hora.
- O ranking guardado vai ao IndexedDB com os carimbos de data do Firestore, que viram objetos simples (`seconds`, `nanoseconds`); nenhum leitor usa essas datas.
- Documentos da coleção `albums` gravados antes desta feature podem ainda ter o ranking pessoal: a gravação é `merge` e não apaga campo.
- A conferência no navegador não foi feita por esta sessão; é da sessão de integração.

## Test plan
> Derivado dos REQ do `spec.md` · 2026-11-19 13:16

| REQ | Caso de teste | Critério / estado | Camada | Automatizado? |
|---|---|---|---|---|
| REQ-01 | 503 e depois 200: dois pedidos e o álbum; rede fora: três pedidos, esperas de 1000 e 2000 ms com o sorteio no topo; o pedido em objeto vai como o mesmo texto nas três | tenta de novo até duas vezes, esperando mais | API (`fetch` dublê) | sim |
| REQ-01 | as esperas crescem até o teto e o sorteio só encurta até a metade; desiste com o último erro real | recuo exponencial com variação e teto | utilitário | sim |
| REQ-02 | 400, 402, 404 e 429: um pedido, nenhuma espera; prazo estourado: um pedido | nunca repete 4xx nem prazo | API | sim |
| REQ-03 | o erro é `ApiError` com `status` (402, 500) ou `kind` (`network`, `timeout`) | o erro verdadeiro | API | sim |
| REQ-04 | duas leituras, uma ida à nuvem; «sem ranking» também guardado; validade de 1 hora; a instância do cache, não a classe; duas pessoas não se misturam; leitura que falha não é guardada | o ranking lido não é pedido de novo | repositório (Firestore dublê) | sim |
| REQ-05 | depois de salvar ou apagar, a leitura seguinte vai à nuvem | o dado novo aparece | repositório | sim |
| REQ-06 | para a carga antes de limpar; limpa o cache; remove as chaves antigas e conta; o `CacheManager` limpa memória e IndexedDB | apaga o guardado de álbuns | serviço, cache, componente | sim |
| REQ-07 | as chaves do Spotify, das séries, da tela e a data da migração ficam; o rodapé não chama `localStorage.clear()` | o resto fica | serviço, componente | sim |
| REQ-08 | limpeza que falha: aviso de falha, sem recarregar, botão liberado; `CacheManager.clear` falha quando o IndexedDB falha | não mente | componente, cache | sim |
| REQ-09 | o documento gravado não tem `hasUserRanking`, `userRanking` nem `userRank`; o álbum original não muda; só dado simples; sem `id` é recusado | nada pessoal no documento compartilhado | repositório | sim |
| REQ-10 | a store fora da lista de exceções do Firestore; o «Refetch» grava pelo repositório e devolve o álbum mesmo se a gravação falha | a store só guarda estado | arquitetura, serviço | sim |
| REQ-04, REQ-06, REQ-07 | os passos no navegador do relatório de entrega | segunda visita sem leitura de ranking; «Clear Cache» refaz a busca e mantém o Spotify | navegador | não (sessão de integração) |

Bordas fora dos critérios (achados para a `mjrp-writing-reqs` se mudam o comportamento): quando a segunda fonte falha, a tela diz «não encontrado» e não «falhou»; o «Clear Cache» apaga também o que os repositórios guardam de séries e o ranking lido, porque tudo mora no mesmo cache.
