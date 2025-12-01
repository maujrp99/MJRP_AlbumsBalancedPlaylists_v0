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
📄 **Read**: `reports/sprint_history_analysis.md`
- **Purpose**: Understand development chronology (8 sprints)
- **Focus on**: 
  - Sprint timeline (pages 1-3)
  - Architecture evolution (4 phases)
  - Legacy v1.6 vs v2.0 comparison table
- **⏭️ Skip**: Detailed sprint deliverables (come back later if needed)

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
  - 🚨 Known Issues (Issues #15 & #16 UNRESOLVED)
  - Session Timeline Phases 10-12 (**CODE EXISTS BUT NOT VERIFIED**)
  - 🚨 CRITICAL DEVELOPER NOTICE section
- **Key takeaway**: Don't assume Phases 10-12 work!

### **Step 3.2: Issue Audit**
📄 **Read**: `reports/issue_audit_report.md`
- **Purpose**: Understand all 10 issues (#9-18) and their TRUE status
- **Focus on**:
  - Issues #15 & #16: Marked "Resolved" but ARE NOT (start here!)
  - Issues #9-14, #17-18: Need UAT validation
  - Recommended actions for each issue

### **Step 3.3: Code vs Documentation Contradictions**
📄 **Skim**: `reports/CodeVerificationReport.md`
- **Purpose**: See what was claimed vs what exists in code
- **Focus on**: Summary table (page 1)
- **Key insight**: 62.5% of "Remaining Work" claims were incorrect

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

**⚠️ CRITICAL**: When reading `AlbumsView.js`:
- Look for `AbortController` implementation (Issue #15 fix - doesn't work)
- Look for `localStorage.getItem('albumsViewMode')` (Issue #16 fix - doesn't work)

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
- Open `http://localhost:5173/`
- **⚠️ Expected**: You WILL encounter bugs (Issues #15 & #16)

### **Step 5.4: Debug Log Review**
📄 **Read**: `docs/debug/DEBUG_LOG.md`
- **Purpose**: See history of bugs and fixes
- **Focus on**: Issues #9-18 (most recent)

**✅ Checkpoint**: You should now have a working dev environment.

---

## 🎯 What to Work On First

Based on current status, here's the priority order:

### **Priority 1: Fix Known Issues (CRITICAL)**
- **Issue #15: Ghost Albums** 
  - File: `public/js/views/AlbumsView.js`
  - Problem: AbortController exists but doesn't prevent ghost albums
  - Action: Re-investigate race condition logic
  
- **Issue #16: View Mode State Mismatch**
  - File: `public/js/views/AlbumsView.js`
  - Problem: localStorage read exists but toggle state still wrong
  - Action: Debug timing/initialization order

### **Priority 2: UAT Testing (Verify Implementations)**
Test these 6 UI components manually:
1. Migration Banner (HomeView)
2. Edit Album Modal
3. Delete Album Modal
4. InventoryView
5. Add to Inventory action
6. Generate Playlists button

### **Priority 3: Complete Pending Features**
- Migration Progress Modal (optional polish)
- Create Series from Inventory backend (TODO at line 228)

---

## 📋 Quick Reference Cheat Sheet

### **"I need to understand..."**

| Topic | Document | Location |
|-------|----------|----------|
| What the project does | README.md | docs/ |
| System architecture | ARCHITECTURE.md | docs/ |
| Data models | album_data_schema.md | docs/technical/ |
| Current status | CHANGELOG.md (line 5) | docs/ |
| Known bugs | issue_audit_report.md | reports/ |
| Sprint history | sprint_history_analysis.md | reports/ |
| How to run locally | LOCAL_RUN.md | docs/devops/ |
| Security & secrets | SECURITY.md | docs/devops/ |

### **"I need to work on..."**

| Task | Primary Files | Secondary Files |
|------|---------------|-----------------|
| Fix Issue #15 | AlbumsView.js | APIClient.js, AbortController usage |
| Fix Issue #16 | AlbumsView.js | localStorage logic |
| Add new UI component | BaseView.js (extend) | app.js (routing) |
| Add new repository | BaseRepository.js (extend) | - |
| Debug data flow | client.js → Repository → Cache | - |
| Update domain model | models/*.js | All consumers |

---

## ⚠️ Common Pitfalls (Learn from our mistakes)

1. **Don't trust "Resolved" in DEBUG_LOG** - Always verify issues yourself
2. **Don't assume Phases 10-12 work** - They need UAT testing
3. **Don't modify v1.6 (hybrid-curator.html)** - It's frozen for production
4. **Don't skip CHANGELOG "Remaining Work"** - It's your source of truth
5. **Don't work on new features before fixing #15 & #16** - These are critical

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
1. `reports/comprehensive_audit_report.md` - Full project audit
2. `docs/CHANGELOG.md` - Session timeline (58 steps documented)
3. `reports/issue_audit_report.md` - Issue details

**Still stuck?**: Refer to architecture diagrams in ARCHITECTURE.md

---

**Last Updated**: 2025-11-30 17:09  
**Next Update**: After Issues #15 & #16 are resolved and UAT completes
