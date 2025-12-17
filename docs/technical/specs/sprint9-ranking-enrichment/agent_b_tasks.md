# Agent B Onboarding - Sprint 9 UI Features

## 🎯 Your Mission

Implement Album Type Filter and Artist Search enhancements in the frontend while Agent A builds the Musicboard scraper backend.

---

## 📖 Essential Reading (Start Here)

### 1. Project Constitution (Rules You MUST Follow)
```
docs/CONSTITUTION.md
```
Read this FIRST - contains core principles and coding guidelines.

### 2. Sprint 9 Specification (YOUR TASKS)
```
docs/technical/specs/sprint9-ranking-enrichment/sprint9-specs.md
```
Full technical analysis and decisions made.

### 3. Architecture Overview
```
docs/ARCHITECTURE.md
```
Understand the store/view/repository pattern.

### 4. Current Sprint Context
```
docs/ROADMAP.md (lines 185-230)
```
Sprint 9 scope and goals.

### 3. Current Sprint Context
```
docs/ROADMAP.md (lines 185-230)
```
Sprint 9 scope and goals.

### 4. Debug Protocol
```
.agent/workflows/debug_protocol.md
```
Follow this for any bug fixes.

---

## 🏗️ Key Files to Understand

### Stores (State Management)
| File | Purpose |
|------|---------|
| `public/js/stores/albums.js` | Album data, `activeAlbumSeriesId` |
| `public/js/stores/albumSeries.js` | Series metadata |

### Views
| File | Lines | Purpose |
|------|-------|---------|
| `public/js/views/AlbumsView.js` | ~800+ | Main album grid, filters |
| `public/js/views/BaseView.js` | ~100 | Lifecycle: `mount()`, `unmount()`, `update()` |

### Services
| File | Key Methods |
|------|-------------|
| `public/js/services/MusicKitService.js` | `getArtistAlbums()`, `_classifyAlbumType()` |

---

## 📋 Your Tasks

### Task 1: Album Type Filter (Priority 1)

**Goal**: Add dropdown to filter albums by type (Studio, Live, Compilation, EP)

**Location**: `AlbumsView.js` filter bar section

**Steps**:
1. Find the filter bar rendering (search for `renderFilterBar` or similar)
2. Add a new dropdown: `<select id="typeFilter">`
3. Options: All, Album (Studio), Live, Compilation, EP, Single
4. On change, filter the displayed albums
5. Persist selection in localStorage

**Reference**: `MusicKitService._classifyAlbumType()` at line 297 already classifies albums:
```javascript
_classifyAlbumType(attributes) {
    if (attributes.isSingle) return 'Single';
    if (attributes.isCompilation) return 'Compilation';
    if (name.includes('live')) return 'Live';
    if (name.includes(' ep')) return 'EP';
    return 'Album'; // Default: studio
}
```

### Task 2: Artist Search Enhancement (Priority 2)

**Goal**: Ensure artist search works with ANY Apple Music artist

**Current State**: Artist autocomplete in HomeView uses Apple Music API

**Verify**:
1. Search for obscure artists (not just mainstream)
2. Check `MusicKitService.getArtistAlbums()` has no BestEver filtering
3. Add artist avatar/image to search results if not present

### Task 3: Rankings Editor UI (Stretch Goal)

**Goal**: UI to view/edit track rankings per album

**Location**: New modal or section in album detail view

**Data Model** (Firestore):
```javascript
// In album document
{
  rankings: {
    "track-1": { rank: 1, source: "bestever" | "musicboard" | "user" },
    "track-2": { rank: 2, source: "user" }
  }
}
```

---

## ⚠️ Coordination Rules

1. **Branch**: Work on `feature/sprint9-ranking-enrichment`
2. **No Overlap**: Only edit files in `public/js/` folder
3. **Don't Touch**: `server/` folder (Agent A is working there)
4. **Commits**: Use conventional commits (`feat:`, `fix:`, `docs:`)
5. **Test Before Commit**: Run `npm run build` to verify

---

## 🔍 Quick Start Commands

```bash
# Verify you're on correct branch
git checkout feature/sprint9-ranking-enrichment
git pull origin feature/sprint9-ranking-enrichment

# Start dev server
npm run dev

# Build to verify no errors
npm run build

# View the app
# Open http://localhost:5173
```

---

## 💡 Tips

1. **UI Style**: Follow existing patterns - glass panels, neon accents
2. **Toast Messages**: Use `import toast from '../components/Toast.js'`
3. **Icons**: Use `import { getIcon } from '../components/Icons.js'`
4. **Store Updates**: Call `store.notify()` after state changes

---

## ❓ Questions?

If blocked, check:
1. `docs/debug/DEBUG_LOG.md` for known issues
2. `docs/technical/UI_STYLE_GUIDE.md` for styling
3. `docs/technical/data_flow_architecture.md` for data flow
