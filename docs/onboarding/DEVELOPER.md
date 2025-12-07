# Developer Onboarding Guide - MJRP Albums Balanced Playlists

**Created**: 2025-11-30 17:09  
**Purpose**: Sequential reading guide for new developers  
**Estimated Time**: 2-3 hours for complete onboarding

---

## 🎯 Onboarding Path Overview

```
1. Project Context (15 min)
   ↓
2. Architecture & Tech Stack (30 min)
   ↓
3. Current Status & Issues (30 min)
   ↓
4. Code Exploration (45 min)
   ↓
5. Development Setup (30 min)
```

---

## 📚 PHASE 1: Project Context (15 minutes)

### **Step 1.1: What is this project?**
📄 **Read**: `docs/README.md`
- **Purpose**: Understand project goals, live demo, key links
- **Focus on**: Project description, key features, documentation references

### **Step 1.2: Executive Summary**
📄 **Read**: `docs/product-management/PROJECT_SUMMARY.md`
- **Purpose**: High-level product vision, business context
- **Focus on**: Problem being solved, target users, key differentiators

### **Step 1.3: How did we get here?**
📄 **Read**: `docs/CHANGELOG.md` and `docs/product-management/ROADMAP.md`
- **Purpose**: Understand development chronology (Sprints 1-9)
- **Focus on**: 
  - Sprint history in ROADMAP.md (completed sprints section)
  - Current sprint status and blockers
  - Architecture evolution (4 phases)
- **Note**: Historical sprint analysis was archived to `docs/archive/archive-backup.tar.gz`

**✅ Checkpoint**: You should now understand WHAT the project does and WHY it exists.

---

## 🏗️ PHASE 2: Architecture & Tech Stack (30 minutes)

### **Step 2.1: Technical Architecture**
📄 **Read**: `docs/ARCHITECTURE.md`
- **Purpose**: Understand system design, patterns, data flow
- **Focus on**:
  - Tech stack (Vite, Vitest, Firestore, IndexedDB)
  - Repository Pattern (BaseRepository → 4 specific repos)
  - Domain Model (Album, Track, Playlist, Series classes)
  - Cache strategy (L1 Memory + L2 IndexedDB)
  - File structure overview
- **⏭️ Skip**: Deprecated sections (marked as such)

### **Step 2.2: Data Schemas**
📄 **Read**: `docs/technical/album_data_schema.md`
- **Purpose**: Understand data structures
- **Focus on**: Album, Track, Playlist, Series object shapes

### **Step 2.3: Data Flow**
📄 **Read**: `docs/technical/data_flow_architecture.md`
- **Purpose**: Understand how data moves through the system
- **Focus on**: API → Client → Repository → Cache → View flow

**✅ Checkpoint**: You should now understand HOW the system is built.

---

## ⚠️ PHASE 3: Current Status & Known Issues (30 minutes)

### **Step 3.1: Where are we now?**
📄 **Read**: `docs/CHANGELOG.md` - **CRITICAL SECTION**
- **Start at**: Line 5 - "Phase 3 - Remaining Work"
- **Purpose**: Know what's done vs what's pending
- **Focus on**:
  - ⚠️ UI Components status (IMPLEMENTED but NOT VERIFIED)
  - ✅ Known Issues (Issues #15 & #16 RESOLVED - Pending UAT)
  - Session Timeline Phases 10-12 (**CODE EXISTS BUT NOT VERIFIED**)
  - 🚨 CRITICAL DEVELOPER NOTICE section
- **Key takeaway**: Focus on UAT Verification!

### **Step 3.2: Current Issues & Blockers**
📄 **Read**: `docs/debug/DEBUG_LOG.md` and `docs/tester/SPRINT5_UAT_20251206.md`
- **Purpose**: Understand current blockers and active issues
- **Focus on**:
  - Issue #22: Ghost Albums (4 fix attempts failed)
  - Firebase SDK Mismatch (nothing saves to Firestore)
  - Series UI Buttons (non-functional)
- **Note**: Historical issue audit archived. Current issues tracked in DEBUG_LOG.md

### **Step 3.3: Implementation Gaps**
📄 **Read**: `docs/tester/GAP_ANALYSIS.md`
- **Purpose**: See what's documented vs what actually works
- **Focus on**: Persistence gaps (Firestore vs localStorage)
- **Key insight**: Repositories exist but aren't integrated into Views

**✅ Checkpoint**: You should now know what's ACTUALLY done, what NEEDS FIXING, and what NOT to trust.

---

## 💻 PHASE 4: Code Exploration (45 minutes)

### **Step 4.1: Domain Model (Start Here)**
📂 **Location**: `public/js/models/`

**Read in this order**:
1. `Track.js` (50 lines) - Simplest, guarantees artist/album context
2. `Album.js` (120 lines) - Manages tracks + original order
3. `Playlist.js` (80 lines) - Playlist logic
4. `Series.js` (60 lines) - Series aggregation

**Why start here?**: These are the data contracts. Everything else depends on these.

### **Step 4.2: Repository Layer**
📂 **Location**: `public/js/repositories/`

**Read in this order**:
1. `BaseRepository.js` (200 lines) - Abstract base with CRUD
2. **Pick ONE** to understand pattern:
   - `SeriesRepository.js` OR
   - `PlaylistRepository.js` OR
   - `InventoryRepository.js`

**Focus on**: `create()`, `findAll()`, `update()`, `delete()` methods

### **Step 4.3: Views (UI Layer)**
📂 **Location**: `public/js/views/`

**Read in this order**:
1. `BaseView.js` (150 lines) - Lifecycle, subscriptions, escapeHtml utility
2. **Pick ONE view to understand pattern**:
   - `HomeView.js` (369 lines) - Migration banner, series creation
   - `AlbumsView.js` (1,011 lines) - **⚠️ Contains Issue #15 & #16 bugs**
   - `InventoryView.js` (593 lines) - CRUD operations

**Note**: Issues #15 (Ghost Albums) and #16 (View Mode) were closed.
Current active issue: **Issue #22 (Ghost Albums in Expanded View)** - See `docs/debug/DEBUG_LOG.md`

**⚠️ CRITICAL Sprint 5 Blockers** (as of 2025-12-06):
1. 🔴 **Firebase SDK Mismatch** - Nothing saves to Firestore
2. 🔴 **Series UI Buttons** - Non-functional (Edit/Delete/Open)
3. 🔴 **Ghost Albums (Issue #22)** - 4 fix attempts failed

### **Step 4.4: API Client**
📄 **Read**: `public/js/api/client.js`
- **Purpose**: Understand how we fetch data from backend
- **Focus on**: 
  - `fetchMultipleAlbums()` - Has AbortSignal support (Issue #15)
  - Album normalization logic

### **Step 4.5: Cache Layer**
📄 **Read**: `public/js/cache/IndexedDBCache.js`
- **Purpose**: Understand L2 cache (persistence)
- **Focus on**: `get()`, `set()`, `clear()` methods

**✅ Checkpoint**: You should now understand the codebase structure and key patterns.

---

## 🛠️ PHASE 5: Development Setup (30 minutes)

### **Step 5.1: Local Development**
📄 **Read**: `docs/devops/LOCAL_RUN.md`
- **Purpose**: Get dev environment running
- **Action**: Follow setup steps

### **Step 5.2: Run Tests**
```bash
npm test  # Should see 34/34 passing
```
- **Note**: Tests cover Repositories + Cache, NOT UI components

### **Step 5.3: Start Dev Servers**
```bash
# Terminal 1
npm run dev

# Terminal 2
cd server && node index.js
```
- Open `http://localhost:5000/`
- **⚠️ Expected**: You might encounter bugs (Issues #15 & #16 should be fixed)

### **Step 5.4: Debug Log Review**
📄 **Read**: `docs/debug/DEBUG_LOG.md`
- **Purpose**: See history of bugs and fixes
- **Focus on**: Issues #9-18 (most recent)

**✅ Checkpoint**: You should now have a working dev environment.

---

## 🎯 What to Work On First

Based on current status, here's the priority order:

### **Priority 1: Fix Critical Blockers (Sprint 5)**
See `docs/tester/SPRINT5_UAT_20251206.md` for details:
1. 🔴 **P0**: Firebase SDK Mismatch (modular vs compat API)
2. 🔴 **P0**: Series Management Buttons (event delegation issue)
3. 🔴 **P0**: Ghost Albums Issue #22 (4 fix attempts failed)
4. 🔴 **P0**: Playlists/Series not persisted to Firestore

### **Priority 2: Integrate Repositories**
- Connect `PlaylistRepository` to `PlaylistsView`
- Connect `SeriesRepository` to `HomeView`
- Connect `InventoryRepository` to `InventoryView`

---

## 📋 Quick Reference Cheat Sheet

### **"I need to understand..."**

| Topic | Document | Location |
|-------|----------|----------|
| What the project does | README.md | docs/ |
| System architecture | ARCHITECTURE.md | docs/ |
| Data models | album_data_schema.md | docs/technical/ |
| Current status | CHANGELOG.md | docs/ |
| **Current blockers** | SPRINT5_UAT_20251206.md | docs/tester/ |
| Known bugs | DEBUG_LOG.md | docs/debug/ |
| Sprint history | ROADMAP.md | docs/product-management/ |
| How to run locally | LOCAL_RUN.md | docs/devops/ |
| Security & secrets | SECURITY.md | docs/devops/ |

### **"I need to work on..."**

| Task | Primary Files | Secondary Files |
|------|---------------|-----------------|
| Fix Firebase SDK | series.js, albums.js | BaseRepository.js |
| Fix Series Buttons | SeriesListView.js | Event delegation |
| Fix Ghost Albums (#22) | AlbumsView.js, albums.js | DEBUG_LOG.md |
| Add new UI component | BaseView.js (extend) | app.js (routing) |
| Add new repository | BaseRepository.js (extend) | - |
| Debug data flow | client.js → Repository → Cache | - |
| Update domain model | models/*.js | All consumers |

---

## ⚠️ Common Pitfalls (Learn from our mistakes)

1. **Don't trust documentation blindly** - Verify features actually work
2. **Don't assume Repositories are integrated** - They exist but aren't connected to Views
3. **Don't modify v1.6 (hybrid-curator.html)** - It's frozen for production
4. **Check SPRINT5_UAT_20251206.md first** - It has the current blockers
5. **Don't work on new features** - Fix Firebase SDK and Series buttons first

---

## 🎓 Learning Path Summary

**Total Time**: ~2.5 hours

**Phase 1** (15 min): Context → You know WHAT and WHY  
**Phase 2** (30 min): Architecture → You know HOW  
**Phase 3** (30 min): Status → You know WHERE WE ARE  
**Phase 4** (45 min): Code → You know THE IMPLEMENTATION  
**Phase 5** (30 min): Setup → You can START CODING

---

## 📞 Questions After Onboarding?

**Check these first**:
1. `docs/tester/SPRINT5_UAT_20251206.md` - Current blockers
2. `docs/debug/DEBUG_LOG.md` - Issue history (see Issue #22)
3. `docs/tester/GAP_ANALYSIS.md` - Implementation gaps

**Still stuck?**: Refer to architecture diagrams in ARCHITECTURE.md

---

**Last Updated**: 2025-12-06
**Next Update**: After Sprint 5 blockers resolved
