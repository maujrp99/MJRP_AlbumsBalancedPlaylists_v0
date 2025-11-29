# MJRP Playlist Generator 2.0 — Plano de Evolução

## 0. Pré-requisitos (Refactor 1.5)
- Consolidar normalização cliente/servidor em `shared/normalize.js` e publicar o bundle no browser.
- Extrair `buildTracksForCurationInput` + índices para `public/js/shared/tracks.js`, exportando testes headless para garantir “acclaim order == playlist order”.
- Adicionar telemetria no front (logs/flags) quando o pipeline cai para ordenação canônica ou quando BestEver falha.

## 1. Fundação técnica
1. Modularizar `public/js/app.js` em stores/módulos (`stores/albums.js`, `stores/playlists.js`), deixando a UI consumir um estado único.
2. Adotar bundler leve (Vite ou Rollup) para empacotar módulos ES, compartilhar `shared/normalize.js` e facilitar imports relativos.
3. Criar suíte de testes de UI headless (Vitest + jsdom) cobrindo: 
   - ordenação de `buildTracksForCurationInput`,
   - anotações do `CurationEngine`,
   - telemetria emitida em cenários de fallback.

## 2. Arquitetura SPA / Navegação
1. Introduzir roteamento leve (HashRouter ou um state machine) com estados: `home`, `albums`, `ranking`, `playlists`.
2. Componentizar as seções em arquivos dedicados (`views/home.js`, `views/albums.js`, etc.) e compartilhar layout/topo (`components/topNav.js`).
3. Garantir carregamento independente por seção (cada view aciona `load`/`render` sem bloquear as demais).

## 3. Home / Landing (1.0)
1. Criar formulário para inserir: (a) lista de álbuns ou queries, (b) nome da “série de playlists”.
2. Persistir metadados da série no Firestore (coleção `series`, campos: `name`, `albumIds`, `createdAt`, `notes`).
3. Exibir atalho para retomar séries recentes e botão "Gerar ranking agora" que aciona pipeline completo.

## 4. Ver Álbuns Salvos (1.1)
1. Tela listando álbuns com filtros (artista, ano, status de ranking, presença de BestEver).
2. Ações rápidas: remover, reprocessar aclamação, abrir referência BestEver.
3. Badge de sincronização (ex.: "Pendente de save" quando `currentAlbums` ≠ Firestore).

## 5. Ranking de Aclamação (1.2)
1. Página dedicada exibindo `rankingAcclaim`, `rankingSummary` e `rankingSources` por álbum/fornecedor.
2. Tabs: "Resumo por álbum", "Fontes" (lista deduplicada com referência/fonte) e "Logs" (telemetria).
3. Botão "Atualizar aclamação" por álbum com feedback visual e integração ao footer log.

## 6. Séries de Playlists (1.3)
1. Reusar grid atual de playlists com Sortable, mas permitir selecionar a série (dropdown com `series` gravadas na Home).
2. Adicionar snapshot/versionamento simples: a cada `save`, criar documento `series/{id}/history/{timestamp}` para revert.
3. Mostrar badges por playlist (ex.: "Drag aplicado" ou "Sincronizado") e manter botão "Salvar alterações" contextual.

## 7. Deploy & Migração
1. Atualizar `README.md`, `CHANGELOG.md` e `docs/PROJECT_SUMMARY.md` com o fluxo 2.0 e nova topologia (coleção `series`).
2. Criar script de migração Firestore (Node CLI) para criar coleções `series` e mover playlists existentes para `series/default`.
3. Executar `npm test` (server + Vitest), revisar bundle, abrir branch `mjrp-playlist-generator-2.0` e preparar PR com checklist (tests, deploy dry-run, release tag).
