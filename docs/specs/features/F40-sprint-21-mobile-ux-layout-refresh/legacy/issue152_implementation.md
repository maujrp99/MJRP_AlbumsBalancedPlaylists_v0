# Issue #152 - Skeleton UX Implementation Details

**Date**: 2026-01-15  
**Status**: 🔴 FAILED (Caused Regressions)

---

## Objetivo Original

Implementar "Ghost Series" skeletons para mascarar latência durante carregamento de albums.

---

## Mudanças Implementadas

### 1. `animations.css` (Inofensivo)
```css
+ .animate-pulse  // Adicionei classe CSS para animação de pulso
```

---

### 2. `SeriesController.js`

#### Mudança A - Linha 227 (Adicionado):
```javascript
// Fix #152: Ensure view has metadata *before* we start fetching
// This triggers the "All Skeletons" render in SeriesGridRenderer
+ this.notifyView('albums', []);
```
**Propósito**: Disparar render inicial com array vazio para mostrar skeletons.

#### Mudança B - Linhas 535-538 (REMOVIDAS):
```javascript
- if (this.state.isLoading && Array.isArray(data) && data.length === 0) {
-     console.log('[SeriesController] 🛡️ Suppressing empty album update during load');
-     return;
- }
```
**Propósito**: Esta supressão impedia o skeleton de aparecer.

---

### 3. `SeriesGridRenderer.js` ⚠️ PROBLEMA PRINCIPAL

#### Mudança A - Linha 112 (REMOVIDA):
```javascript
- if (group.albums.length === 0) return;
```
**Propósito Original**: Esconder séries sem albums.  
**Impacto da Remoção**: TODAS as séries aparecem, mesmo quando filtros de album eliminam todos os albums.

#### Mudança B - Lógica Condicional Alterada (Linhas 115-123):
```javascript
// ANTES:
- if (isVisibleInitially) {
-     html += this._renderRealSeriesGroup(...);
- } else {
-     // Render Skeleton
- }

// DEPOIS:
+ if (group.albums.length > 0 && isVisibleInitially) {
+     html += this._renderRealSeriesGroup(...);
+ } else {
+     // Render Skeleton (for both "Loading" and "Lazy" series)
+ }
```
**Propósito**: Séries com 0 albums agora vão para skeleton.

#### Mudança C - `_renderRealSeriesGroup` linha 163:
```javascript
// ANTES:
- ${wrapInGrid(renderAlbumsGrid(shownAlbums, context))}

// DEPOIS:
+ ${total > 0 ? wrapInGrid(renderAlbumsGrid(shownAlbums, context)) : '<div class="text-white/30 italic p-4 text-center">No albums found</div>'}
```
**Propósito**: Mostrar "No albums found" para séries vazias após hidratação.

#### Mudança D - Guards de `isLoading` em `_attachObservers`:
```javascript
+ const { isLoading = false } = this.props;
+ if (isLoading) {
+     console.log('[SeriesGridRenderer] ⏳ Skipping observer attachment (isLoading=true)');
+     return;
+ }
```
**Propósito**: Não hidrologizar skeletons enquanto está carregando.

#### Mudança E - Guard em `_hydrateSeriesGroup`:
```javascript
+ const { isLoading = false } = this.props;
+ if (isLoading && group.albums.length === 0) {
+     return;
+ }
```
**Propósito**: Manter skeletons durante carregamento.

---

### 4. `SeriesView.js` - Linha 173

```javascript
// ANTES:
- sortedSeriesList // <--- Pass sorted list

// DEPOIS:
+ sortedSeriesList, // <--- Pass sorted list
+ this.isLoading // <--- Pass loading state to prevent premature skeleton hydration
```
**Propósito**: Passar estado de loading para o updater.

---

### 5. `SeriesViewUpdater.js` - Linhas 53-72

```javascript
// ANTES:
- updateGrid(albums, viewMode, currentScope, filters, searchQuery, sortedSeriesList = null) {
-     const seriesList = sortedSeriesList || albumSeriesStore.getSeries();
-     this.components.grid.update({
-         ...
-         context: { searchQuery, filters }
-     });

// DEPOIS:
+ updateGrid(albums, viewMode, currentScope, filters, searchQuery, sortedSeriesList = null, isLoading = false) {
+     let seriesList = sortedSeriesList || albumSeriesStore.getSeries();
+     
+     // FIX: Filter seriesList by scope (NÃO RESOLVE O PROBLEMA)
+     if (currentScope !== 'ALL' && currentScope) {
+         seriesList = seriesList.filter(s => s.id === currentScope);
+     }
+     
+     this.components.grid.update({
+         ...
+         context: { searchQuery, filters },
+         isLoading: isLoading
+     });
```
**Propósito**: Filtrar séries por scope e passar isLoading.

---

## Problema Central

A linha removida `if (group.albums.length === 0) return;` era **crítica**. 

Ela não era apenas para "esconder séries vazias durante loading" — ela **escondia séries que não tinham albums após filtros (Year, Artist, Source) serem aplicados**.

### Comportamento Anterior (Correto):
1. Usuário seleciona filtro "1980s"
2. Albums são filtrados
3. `groupAlbumsBySeries()` agrupa albums filtrados por série
4. `if (group.albums.length === 0) return;` **ESCONDE** séries sem albums correspondentes
5. Grid mostra apenas séries com albums de 1980s

### Comportamento Após Patch (Quebrado):
1. Usuário seleciona filtro "1980s"
2. Albums são filtrados
3. `groupAlbumsBySeries()` agrupa - algumas séries têm 0 albums
4. Linha removida → séries vazias vão para `else` → renderiza Skeleton ou "No albums found"
5. Grid mostra TODAS as séries, com "No albums found" nas que foram filtradas

---

## Solução Correta Necessária

Precisamos de lógica que distinga:

| Cenário | Estado | Ação |
|---------|--------|------|
| Série vazia **porque está carregando** | `isLoading = true` | Mostrar Skeleton |
| Série vazia **porque filtros removeram albums** | `isLoading = false` | **Esconder completamente** |

```javascript
// Proposta de fix:
seriesGroups.forEach(group => {
    const hasNoAlbums = group.albums.length === 0;
    const { isLoading = false } = this.props;
    
    if (hasNoAlbums && !isLoading) {
        return; // Esconder - filtros removeram todos os albums
    }
    
    if (hasNoAlbums && isLoading) {
        // Renderizar Skeleton - ainda carregando
        html += SeriesSkeleton.render();
    } else {
        // Renderizar Real
        html += this._renderRealSeriesGroup(...);
    }
});
```

---

## Regressões Causadas

1. **Bug A**: Série "test aaa" não carrega albums mesmo existindo
2. **Bug B**: Filtros (Year, Artist, Source) não escondem séries sem matches

---

## Próximos Passos

1. Reverter mudanças ou aplicar fix correto
2. Verificar com testes manuais
3. Atualizar DEBUG_LOG.md
