# Sprint 5 Architecture Updates

**Date**: 2025-11-28  
**Changes**: Per user feedback

---

## Major Changes

### 1. ❌ **Removed Cascade Delete**

**Rationale**: Series deletion should NOT delete albums.

**Before**:
```javascript
// SeriesRepository.deleteWithCascade()
await seriesRepo.deleteWithCascade(seriesId)
// ❌ Deleted series + all albums + all playlists
```

**After**:
```javascript
// SeriesRepository.delete() (inherited from BaseRepository)
await seriesRepo.delete(seriesId)
// ✅ Only deletes the series
// Albums remain and can be reassigned to another series
```

**Albums**: Can only be deleted individually with confirmation.

---

### 2. ✅ **Multi-Currency Support**

**Added Currencies**: USD and BRL (Brazilian Reais)

**InventoryRepository Changes**:

```javascript
// Data model
{
  purchasePrice: 150.00,
  currency: "USD" | "BRL",  // NEW field
  // ...
}

// Methods
addAlbum(album, format, { purchasePrice, currency: 'USD' })
updatePrice(albumId, newPrice, currency)
```

**Statistics by Currency**:
```javascript
const stats = await inventoryRepo.getStatistics()
// Returns:
{
  totalValueUSD: 450.00,
  totalValueBRL: 1200.00,
  averagePriceUSD: 150.00,
  averagePriceBRL: 400.00,
  // ...
}
```

---

### 3. ✅ **Inline Price Editing**

**New Method**: `updatePrice(albumId, newPrice, currency)`

**UI Flow**:
1. Click on price → becomes editable input
2. User types new value
3. Blur/Enter → auto-save
4. Statistics recalculate in real-time

**Implementation**:
```javascript
// Quick price update without full form
await inventoryRepo.updatePrice(albumId, 200, 'USD')

// Triggers cache invalidation + stats refresh
```

---

### 4. 🎨 **UI Theme Updates**

**Color Scheme**: Flame/Amber tones (not blue)

**Primary Colors**:
- Accent: `#f97316` (flame orange)
- Hover: `#fb923c` (lighter flame)
- Text: `#fdba74` (amber)

**Icons**: SVG from `icons.js` (no emojis)

**Format Icons**:
- CD: `Disc` icon
- Vinyl: `Disc` icon with variant
- DVD/Blu-ray: `Film` icon
- Digital: `Download` icon

---

### 5. 📊 **Currency Display Formatting**

**USD**:
```
$150.00
$1,234.56
```

**BRL (Brazilian Reais)**:
```
R$ 450,00
R$ 3.456,78
```

**Conversion**: NOT automatic. User enters price in chosen currency.

---

## Migration Utility - Clarification

**Purpose**: Migrate data from localStorage (old v1.0) to Firestore (new v2.0)

**Scenario**:
- User has been using app with localStorage (offline-only)
- Upgrades to v2.0 with Firestore (cloud sync)
- MigrationUtility detects old data
- Shows banner: "Migrate your collection to the cloud?"
- Copies all series/albums/playlists to Firestore

**If NOT needed**: Can be removed if starting fresh with Firestore from day 1.

**User Decision**: Keep for future-proofing or remove?

---

## Updated Files

1. `SeriesRepository.js` - Removed `deleteWithCascade()`
2. `InventoryRepository.js`:
   - Added `currency` field
   - Added `updatePrice()` method
   - Updated `getStatistics()` for multi-currency
3. UI Specs updated (flame/amber theme, SVG icons)

---

## Tests to Update

**Repository Tests** (need adjustments):
- ❌ Remove cascade delete test
- ✅ Add multi-currency tests
- ✅ Add inline price update test

**New Test Cases**:
```javascript
// Currency tests
test('InventoryRepository stores currency', async () => {
  await repo.addAlbum(album, 'vinyl', { purchasePrice: 450, currency: 'BRL' })
  const inv = await repo.findById(id)
  assert(inv.currency === 'BRL')
})

// Price update test
test('InventoryRepository updates price inline', async () => {
  await repo.updatePrice(id, 200, 'USD')
  const stats = await repo.getStatistics()
  assert(stats.totalValueUSD === 200)
})
```

---

## Next Steps

1. ⏳ Update tests (remove cascade, add currency)
2. ⏳ Generate new mockups (flame/amber theme, SVG icons)
3. ⏳ Implement InventoryView UI with inline editing
4. ⏳ Add currency selector to header
5. ⏳ Format currency display (USD vs BRL)
