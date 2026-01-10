# Developer Onboarding Guide - MJRP Albums Balanced Playlists

**Created**: 2025-11-30 17:09
**Last Updated**: 2026-01-10
**Purpose**: Sequential reading guide for new developers  
**Estimated Time**: 2-3 hours for complete onboarding

---

## 🎯 Onboarding Path Overview

```
1. Project Context & Status (15 min)
   ↓
2. Methodology (Specification) (15 min)
   ↓
3. Architecture & Codebase (45 min)
   ↓
4. Setup & Quick Start (15 min)
```

---

## 📚 PHASE 1: Project Context (15 minutes)

### **Step 1.0: The North Star**
📄 **Read**: `docs/MJRP_Album_Blender_Prod_Vision.md`
- **Purpose**: Understand the core philosophy and long-term vision
- **Focus on**: The "Why" behind the project

### **Step 1.1: What is this project?**
📄 **Read**: `docs/README.md`
- **Purpose**: Understand project goals, live demo, key links
- **Focus on**: Project description, key features, documentation references

### **Step 1.3: The Reference Guide**
📄 **Read**: `docs/manual/00_MJRP_Album_Blender_Ref_Guide_Index.md`
- **Purpose**: The "Single Source of Truth" technical manual
- **Focus on**: The table of contents (Deep Dive Modules)

### **Step 1.4: Status & Roadmap**
📄 **Read**: `docs/ROADMAP.md` and `docs/debug/DEBUG_LOG.md`
- **Purpose**: Understand where we are and what is broken.
- **Focus on**: 
  - The "Current Sprint" in ROADMAP.
  - Active issues/blockers in DEBUG LOG.

**✅ Checkpoint**: You should now understand WHAT the project does, WHY it exists, and its CURRENT STATE.

---

## 🚀 PHASE 2: Methodology (How We Work)

### **Step 2.1: Spec-Driven Development (SDD)**
We follow a strict **Spec-First** approach. We do not write complex code without a plan.

📄 **Read**: `docs/CONSTITUTION.md` (Section IV)
- **Key Concept**: "Design before you build"

### **Step 2.2: Developer Standards**
> [!IMPORTANT]
> **Linting Policy**:
> *   **ALWAYS** run `npm run lint` before committing.

**Your Workflow**:
1. Received a feature request? Check if a Spec exists in `docs/technical/specs/`.
2. If not, create one or update the plan.
3. Get User approval.
4. Implement.
5. Verify.

---

## 🏗️ PHASE 3: Architecture & Codebase Map (45 minutes)

Use this section as a **Reference Menu**.
**Choose the module relevant to your specific task/feature.**

### **3.1 The "Big Picture"**
📄 **Read**: `docs/manual/01_System_Architecture.md`
- **Why**: High-Level Architecture, Repository Pattern, Router Lifecycle.

### **3.2 Domain Models (Data Contracts)**
📂 **Location**: `public/js/models/`
- `Track.js`: Atomic unit.
- `Album.js`: Core entity (Dual-Tracklist).
- `Series.js`: Grouping logic.

### **3.3 UI Layer (Views & Renderers)**
📂 **Location**: `public/js/views/` and `public/js/renderers/`
- **Core**: `BaseView.js` (Lifecycle).
- **Navigation**: `HomeView.js`.
- **Logic-Heavy**: `SeriesView.js` (Grid Controller) & `BlendingMenuView.js` (Wizard).
- **Rendering**: `SeriesGridRenderer.js` (HTML generation).

### **3.4 Persistence Layer (Data)**
📂 **Location**: `public/js/repositories/`
- **Pattern**: View -> Repository -> Cache -> API.
- **Key Files**: `BaseRepository.js`, `SeriesRepository.js`.
- **Infrastructure**: `public/js/cache/IndexedDBCache.js`.

### **3.5 Logic & Algorithms (Backend)**
� **Location**: `server/` and `server/lib/`
- **API Definition**: `server/routes/` (Endpoints).
- **Ranking Logic**: `server/lib/ranking/` (Borda Count, Scoring).
- **Enrichment**: `server/lib/enrichment/` (BestEverAlbums integration).
- **Proxy**: `server/index.js` (Main entry point).

**✅ Checkpoint**: You now know where to find the code relevant to your task.

---

## 🛠️ PHASE 4: Local Setup (Quick Start)

### **Step 4.1: Installation**
Refer to **[`docs/manual/00_Deployment_and_Setup.md`](../manual/00_Deployment_and_Setup.md)** for prerequisites.

### **Step 4.2: Start Dev Servers**

> [!IMPORTANT]
> **Use port 5000 (NOT 5173!)**

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend Proxy
cd server && node index.js
```
- Open `http://localhost:5000/`.

### **Step 4.3: Running Tests**
For detailed testing protocols (Unit/E2E), refer to:
👉 **[QA Engineer Onboarding](QA_ENGINEER.md)**

**✅ Checkpoint**: You are ready to code.

---

## 🎯 What to Work On First

Ask the human user for guidance on this.
---

## 📋 Quick Reference Cheat Sheet

### **"I need to understand..."**

| Topic | Document | Location |
|-------|----------|----------|
| What the project does | README.md | Root |
| System architecture | 01_System_Architecture.md | docs/manual/ |
| Data models | album_data_schema.md | docs/technical/ |
| Current status | CHANGELOG.md | docs/ |
| **Deep Dives** | 00_MJRP_Album_Blender_Ref_Guide_Index.md | docs/manual/ |
| Known bugs | DEBUG_LOG.md | docs/debug/ |
| Sprint history | ROADMAP.md | docs/ |
| How to run locally | 00_Deployment_and_Setup.md | docs/manual/ |
| Security & secrets | 00_Deployment_and_Setup.md | docs/manual/ |


---
## 📏 Standards & Protocols (Merged from CONTRIBUTING)

### 🔀 Git Workflow & Branching

**Branch Strategy**:
- `main`: Production-ready code
- `feature/*`: New features (e.g., `feature/albums-view-refinement`)
- `fix/*`: Bug fixes (e.g., `fix/issue-description`)
- `refactor/*`: Code refactoring
- `hotfix/*`: Production hotfixes

**Tagging**:
- `vX.Y.Z`: Releases (SemVer)
- `sprint-X.Y-done`: Milestones
- `pre-*` / `backup-*`: Checkpoints

### 📝 Commit Conventions
Format: `<type>(<scope>): <subject>`

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring
- `docs`: Documentation
- `style`: Formatting
- `test`: Adding/updating tests
- `chore`: Maintenance
- `perf`: Performance

**Examples**:
- `feat(playlists): add series consolidation`
- `fix(ranking): correct track order display`

### 🎨 Code Style

**JavaScript/ES6+**:
- Use ES6 modules (`import`/`export`)
- Prefer `const` over `let`/`var`
- Arrow functions for callbacks
- Template literals for strings

**View Pattern (BaseView)**:
All views extend `BaseView` and implement `render(params)` and `mount(params)`.
```javascript
import { BaseView } from './BaseView.js'
export class MyView extends BaseView { ... }
```

**Tailwind CSS**:
- Use utilities over custom CSS.
- Group by purpose: Layout -> Box Model -> Visuals -> Interaction.

### 🧪 Testing Guidelines
Run tests: `npm test`
Location: `/test`
Format:
```javascript
import { describe, it, expect } from '@jest/globals'
describe('Component', () => { ... })
```

### 🚀 Release Process
1. `npm test` && `npm run build`
2. Update `package.json` version.
3. Commit: `chore(release): bump version to ...`
4. Tag: `git tag -a vX.Y.Z -m "..."`
5. Push: `git push origin main --tags`
6. Deploy: human user

