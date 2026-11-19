# Data Model: MJRP_AlbumsBalancedPlaylists_v0 (Album Blender v0)

> Escrito em 2026-10-28 (conform do harness) **do que o código grava e lê**, não do ideal. Fontes: `docs/manual/05_Backend_Data_Schema.md` e `32_Data_Schema_Reference.md` (a forma pretendida), o Apêndice F do mapa do código feito pelo V1 (`MJRPalbumblender-v1/reports/audits/2026-10-27-mjrpalbumblender-v1-project-bootstrap-report.md`, §7 e §8, com `arquivo:linha` do v0; nada foi executado) e o Apêndice B §3.7 (modelos). Onde o manual e o código discordam, vale o código. `firestore.rules` e os repositórios em `public/js/repositories/` são a prova.
> Corrigido no mesmo dia depois da crítica independente (`reports/audits/2026-10-28-mjrpalbumblender-v0-architecture-audit.md`), que releu as âncoras no código.
> Estado: **Draft**. Campos que o mapa não leu por inteiro vão marcados `TBD`.

Convenções: `Timestamp (servidor)` é `serverTimestamp()` do Firestore, escrito por `BaseRepository` (`repositories/BaseRepository.js:158-251`); `uid` é o id do usuário do Firebase Auth (login anônimo automático). `appId` é a constante `mjrp-albums` no caminho `artifacts/{appId}/...` (`InventoryRepository.js:20-21`): é um **segmento de caminho**, não o projeto Firebase (o projeto é `mjrp-playlist-generator`, ver *Persistence*).

## Entities

### Series (série de álbuns) - `artifacts/mjrp-albums/users/{uid}/curator/data/series/{seriesId}`
Guarda a **lista de pedidos** de álbuns, não os álbuns (Apêndice B §2). O segmento `data` existe porque `curator` é coleção (`SeriesRepository.js:21-23`).
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (id automático; também gravado como campo no upsert) | ✅ | identificador da série |
| name | string | ✅ | nome da série |
| albumQueries | lista de texto («Artista - Título») ou de objetos `{artist, title ou album, year, coverUrl, appleMusicId, facts}` | ✅ | os pedidos de álbum que o carregamento resolve. `appleMusicId` é a edição que a pessoa escolheu na Home, e a carga a usa primeiro. `facts` (desde a v4.0) é `{year, sources: {acclaim, popularity}, checkedAt}`: o que os filtros leem sem carregar o álbum; é gravado pelo app quando a série termina de carregar, só quando mudou (`services/series/SeriesFactsService.js`, `SeriesRepository.saveAlbumFacts`, que não mexe em `updatedAt`). **O array inteiro é regravado a cada inclusão e a cada gravação de `facts`**: duas abas ou aparelhos editando a mesma série, o último a gravar vence |
| status | string (padrão `'pending'`) | ✅ | estado de carga da série |
| notes | string | ❌ | notas livres |
| sourceType | string (`'manual'`, `'inventory'`) | ❌ | só nos caminhos de migração e em `createFromInventory` |
| createdAt | Timestamp (servidor) | ✅ | a data enviada pelo cliente é sobrescrita (`BaseRepository.js:161`) |
| updatedAt | Timestamp | ❌ | a data da última edição feita pela pessoa; a lista de séries é ordenada por ele no navegador, com a série sem data por último (`SeriesService.js`, `loadFromFirestore`); `createSeries` o grava, os caminhos de migração e `createFromInventory` não |
| _schemaVersion | número `1` | ✅ | versão do esquema; o `update` direto não a grava |
| _migratedFrom, _migrationDate | string, data | ❌ | só em série vinda de migração |

**Lista de séries inteira (desde a v4.0).** A lista é lida sem limite e sem `orderBy` na consulta (o Firestore deixa de fora o documento que não tem o campo ordenado). Até a v3.x era lida com `limit 20`: quem tinha 21 séries ou mais deixava de ver o resto, sem aviso (issue UAT-24; uma conta real tinha 45 séries e via 20).

### Playlist (playlist gerada) - `.../series/{seriesId}/playlists/{playlistId}`
Não existe documento de "lote": o lote é o campo `batchName` repetido em cada playlist (Apêndice D §2).
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | ✅ | identificador |
| batchName | string | ✅ | nome do lote a que pertence |
| seriesId | string | ✅ | série de origem |
| order | número | ❌ | posição no lote (gravada por `saveBatch`, `PlaylistsService.js:236-266`) |
| name / title | string | ✅ | o nome aparece como `name` (`PlaylistRepository.rename`, `:56`) ou como `title` (`models/Playlist.js:14`); TBD qual é o canônico |
| tracks | lista de Track (cópia) | ✅ | as faixas da playlist, com os campos de Track abaixo |
| createdAt | Timestamp ou texto ISO | ✅ | o tipo depende do caminho que gravou |
| updatedAt | Timestamp ou texto ISO | ❌ | texto ISO quando o documento nasce por `create` (`PlaylistsService.js:248`); Timestamp quando passa por `save`/`update` |
| _schemaVersion | número `1` | ✅ | versão do esquema |

Os demais campos vêm do objeto que o gerador produz e dependem do módulo gerador: TBD.

### InventoryItem (item da coleção do usuário) - `artifacts/mjrp-albums/users/{uid}/inventory/{idAutomático}`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title, artist | string | ✅ | exigidos na criação (`InventoryRepository.js:33-39`) |
| year | número ou texto | ❌ | cópia de `album.year` |
| format | `cd`, `vinyl`, `cassette`, `dvd`, `bluray`, `digital` | ✅ | validado na criação |
| owned | boolean ou `null` | ❌ | `true` possuído, `false` wishlist, `null` nem um nem outro (item novo entra `null`) |
| purchasePrice | número ou `null` | ❌ | digitado pelo usuário; `0` na criação vira `null` (`InventoryRepository.js:66`) |
| currency | `'USD'` ou `'BRL'` | ✅ | não há conversão entre as duas moedas |
| purchaseDate | TBD | ❌ | a interface nunca o preenche |
| condition | texto ou `null` | ❌ | a interface nunca o preenche |
| notes | string (padrão `''`) | ❌ | notas livres |
| albumData | objeto (cópia completa do Album) | ✅ | `JSON.parse(JSON.stringify(album))`; o id do álbum original fica em `albumData.id` |
| addedToInventory | Timestamp (servidor) | ✅ | data de entrada |
| createdAt, updatedAt | Timestamp (servidor) | ✅ / ❌ | `updatedAt` só depois da 1ª atualização |
| _schemaVersion | número `1` | ✅ | versão do esquema |

### Album (álbum hidratado) - `albums/{albumId}` (coleção na raiz) e `models/Album.js` (memória)
O app grava o álbum na coleção raiz `albums` só no «Refetch Metadata», por `repositories/SharedAlbumRepository.js` (`saveAlbum`, `setDoc(..., { merge: true })` sob o `id` do álbum; álbum sem `id` é recusado); a carga da tela não grava nessa coleção, e nenhum ponto do app a lê de volta. **Ciclo de vida:** a coleção é **global e sem dono**: quem escreve é qualquer visitante autenticado (inclusive anônimo, `firestore.rules:42-43`); não há regra de conflito (o último a gravar vence, com `merge`); não há retenção nem purga (cresce sem limite); e a serialização grava também o campo de execução `seriesIds`; o que é de uma pessoa só (o ranking pessoal) fica fora desde a F48. O `id` é o "slug" `artista_album` (`api/client.js:534-538`); duplicata é o mesmo título e artista exatos (`stores/albums.js:78-100`).
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | ✅ | slug `artista_album` ou id do provedor |
| title | string (padrão 'Unknown Album') | ✅ | título |
| artist | string (padrão 'Unknown Artist') | ✅ | artista |
| year | número ou texto | ❌ | ano |
| coverUrl | string (URL) | ❌ | capa principal |
| tracks | lista de Track | ✅ | ordenada por aclamação (`data.tracksByAcclaim \|\| data.tracks`) |
| tracksOriginalOrder | lista de Track | ✅ | ordem do disco (1..N) |
| bestEverAlbumId, bestEverUrl | string ou `null` | ❌ | ligação com o BestEverAlbums |
| acclaim | objeto (`hasRatings`, `source`, `enrichedAt`, `providerType`, `trackCount`) | ❌ | resumo do ranking externo (padrão `{}`) |
| spotifyId, spotifyUrl | string ou `null` | ❌ | ligação com o Spotify |
| spotifyPopularity | número 0-100 ou `null` | ❌ | popularidade |
| spotifyImages | lista de `{url, height, width}` | ❌ | imagens do Spotify |
| metadata | objeto (p. ex. `{source, sourceId, fetchedAt}`) | ❌ | saco de metadados |
| seriesIds | lista | ❌ | campo de execução que a carga acrescenta e que acaba gravado |
| updatedAt, _schemaVersion | Timestamp, número | ❌ | gravados pelo `BaseRepository.save` a cada «Refetch» (desde a F48) |
| userRanking, hasUserRanking; `userRank` em cada faixa | objeto, boolean; número | — | **não são mais gravados** (F48): são da pessoa logada e a coleção é compartilhada. Documentos gravados antes de 2026-11-19 podem ainda trazê-los, porque a gravação é `merge` e não os apaga |

### Track (faixa) - dentro de `Album.tracks` e de `Playlist.tracks` (`models/Track.js:30-78`)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string (ou `crypto.randomUUID()`) | ✅ | identificador |
| title, artist, album | string | ✅ | identidade da faixa |
| duration | número, **segundos** segundo o modelo | ✅ | a unidade é inconsistente em partes da interface (hipótese do mapa, Apêndice B §3.7); TBD |
| rank / acclaimRank | número (1 = melhor) | ❌ | posição por aclamação |
| acclaimScore, rating | número | ❌ | nota de aclamação |
| spotifyRank, spotifyPopularity, spotifyId, spotifyUri | número, número, string, string | ❌ | dados do Spotify |
| appleMusicId, isrc, previewUrl | string | ❌ | identificadores e prévia |
| position | número | ❌ | posição no disco |
| originAlbumId | string | ❌ | álbum de origem na playlist |
| metadata | objeto | ❌ | saco de metadados |

### UserRanking (ranking do usuário por álbum) - `users/{uid}/albumRankings/{albumIdSanitizado}`
**Esta coleção é legível e gravável por qualquer pessoa, até sem login** (`firestore.rules:32-35`, `allow read, write: if true`, com o comentário "DEBUG ... antes do lançamento"). O `albumId` troca `/` e `\` por `_` (`UserRankingRepository.js:55`).
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| albumId | string | ✅ | álbum ranqueado |
| albumTitle, artistName | string (padrão `''`) | ❌ | cópia para exibição |
| rankings | lista de `{trackTitle, userRank}` | ✅ | `userRank` a partir de 1 (`UserRankModal.js:98-101`) |
| createdAt | Timestamp (servidor) | ✅ | só quando o documento ainda não existe |
| updatedAt | Timestamp (servidor) | ✅ | última gravação |

### SpotifyEnrichment (cache global de enriquecimento) - `spotify_enrichment/{chaveNormalizada}`
Coleção **global**, compartilhada por todos os usuários, sem dono: qualquer visitante autenticado, inclusive anônimo, lê e escreve (`firestore.rules:49-51`); quem escreve no código é `SpotifyEnrichmentRepository`. **Ciclo de vida:** o último a gravar vence; os 30 dias de validade só valem na **leitura** (um registro vencido é tratado como inexistente), nada apaga o registro vencido; só a leitura preguiçosa remove órfãos (`SpotifyEnrichmentStore.js:49-55`). A chave é `artista-álbum` em minúsculas, sem acento, não alfanumérico vira `-`, no máximo 100 caracteres (`SpotifyEnrichmentRepository.js:35-44`).
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| spotifyId | string | ✅ | sem ele o registro é inválido (`:67`) |
| artist, album | string | ✅ | origem da chave |
| (dados do Spotify) | objeto | ✅ | o que a API devolveu (`...enrichmentData`); TBD o detalhe |
| enrichedAt | número (ms) | ✅ | registro com mais de 30 dias é inválido (`:12, 56`) |
| schemaVersion, _schemaVersion | número `1` | ✅ | versão diferente de 1 invalida o registro |
| updatedAt | Timestamp (servidor) | ✅ | última gravação |

### Ranking consolidado (não persistido)
Resultado da consolidação do servidor (`server/lib/ranking.js`, Borda Count) devolvido pela API: faixas com nota final, posição e as fontes que a compuseram. A forma exata está no manual (`05_Backend_Data_Schema.md` §4) e não foi conferida contra o código: TBD.

### Dados locais do navegador (não são entidades do Firestore)
| Armazenamento / chave | Conteúdo |
|---|---|
| IndexedDB `mjrp-cache` v1, tabela `cache` (índice `expiresAt`) | cache L2 (TTL padrão 7 dias, `cache/CacheManager.js:77`) |
| `mjrp_series` | cópia local da lista de séries |
| `mjrp_current_playlists` | rascunho das playlists em edição |
| `mjrp_inventory_view_mode`, `inventoryCurrency`, `albumsViewMode` | preferências de exibição |
| `mjrp_migration_status`, `album_cache_migration_start` e as chaves legadas (`albumCache`, `seriesCache`, `album_*`, `series_*`, `playlist_*`) | migração de versões antigas |
| `spotify_code_verifier`, `spotify_auth_state`, `spotify_access_token`, `spotify_refresh_token`, `spotify_expires_at` | sessão do Spotify (PKCE); os valores não são documentados aqui |

`sessionStorage` não é usado (Apêndice F §8).

## Relationships
- User (`uid`) → has many → Series; User → has many → InventoryItem; User → has many → UserRanking.
- Series → has many → Playlist (subcoleção `playlists`). Playlist → belongs to → Series (`seriesId`).
- Series → refers to many → Album **por pedido** (`albumQueries`), não por chave: o álbum é resolvido na carga e fica em memória e no cache; não há lista de ids de álbum na série.
- Album → has many → Track (duas listas: por aclamação e na ordem do disco). Playlist → has many → Track (cópias, não referências).
- InventoryItem → embeds → Album (`albumData`, cópia completa). InventoryItem → refers to → Album por `albumData.id`.
- UserRanking → refers to → Album por `albumId`. SpotifyEnrichment → refers to → Album por `artista-álbum` normalizado (sem dono).

## Persistence
- Primary: **Firestore** do projeto Firebase **`mjrp-playlist-generator`**, acessado só pelo navegador. O projeto vem de `public/js/firebase-config.js:3-10` (`window.__firebase_config`), carregado por `public/index.html:111` antes do `app.js`; o bloco `mjrp-albums` de `public/js/firebase-init.js:6-13` é só um valor reserva com chave de marcador, que não funciona. Caminhos e regras (`firestore.rules`): inventário e `curator` sob `artifacts/{appId}/users/{uid}/` escopados ao dono (`:8-13`); `users/{uid}/series/**` ao dono (`:19-28`, sem uso); `users/{uid}/albumRankings` **aberta a qualquer pessoa** (`:32-35`); `albums` e `spotify_enrichment` abertas a **qualquer autenticado, inclusive anônimo** (`:42-43`, `:49-51`), porque o app faz login anônimo sozinho. Nenhum pipeline do repositório publica `firestore.rules` (`firebase.json` sem bloco `firestore`; a CI implanta só o hosting). Regra: dado do usuário não fica aberto a qualquer visitante (constituição, Art. V). Conserto: achado 2 da auditoria. O SDK do Firestore é importado por três arquivos fora de `repositories/` (ver `arch.md`). Não há `firestore.indexes.json`: a única consulta ordenada é `orderBy('updatedAt', 'desc')` com `limit 20` nas séries, de campo único; o corte em 20 é descrito na entidade Series.
- Cache: IndexedDB `mjrp-cache` (L2) e memória (L1) no navegador; TTL padrão de 7 dias; `findAll` do repositório não passa pelo cache.
- Sync: o `localStorage` guarda cópia local da lista de séries (`mjrp_series`, que pode divergir do Firestore) e o rascunho de playlists, e o login anônimo do Firebase dá um `uid` desde a primeira visita. **A migração do convidado para o usuário existe no código mas não executa**: `UserSyncService.js:22` só migra se o usuário anterior for `'guest'`, valor que nenhum código atribui (a store usa `'anonymous-user'`, `stores/albumSeries.js:19, 74`); e, se rodasse, `UserSyncService.js:38` chama `dataSyncService.saveSeries`, que não existe (`DataSyncService` só tem `migrateInventory` e `migrateSeries`), e `SeriesService.js:63` chama `migrateSeries(repositório, séries)` onde a assinatura é `migrateSeries(series)`. Além disso, o login com Google/Apple (`signInWithPopup`, `shared/services/AuthService.js:22`) troca de `uid`, deixando os dados da sessão anônima no `uid` antigo. Regra: sem falha silenciosa (`PRINCIPLES.md` §I.8). Conserto: achado 6 da auditoria.
- Versão de esquema: `_schemaVersion` é gravado por `BaseRepository` em todos os documentos criados ou salvos por ele, mas **só `SpotifyEnrichmentRepository` o lê** (versão diferente de 1 invalida o registro); nenhum outro leitor confere versão.

## Migration Notes
- `_schemaVersion` é `1` em todos os repositórios, exceto `AlbumRepository` (2, usado só pela migração).
- O layout `users/{uid}/series/{seriesId}/albums` (`AlbumRepository.js`, `MigrationUtility.js:223`) e as regras `users/{uid}/series/*` e `.../playlists` existem, mas o app não lê nem grava as séries nesse layout; o layout em uso é o de `artifacts/mjrp-albums/...`.
- Não há migração em andamento. `MigrationUtility` (local para Firestore) é legado e marca o fim em `mjrp_migration_status`.
