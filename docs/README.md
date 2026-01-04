# Documentation

**Project**: MJRP Album-Balanced Playlists Generator  
**Last Updated**: 2026-01-04

> **Note**: This is the documentation index. For quick start, see below.

---

## 🚀 Quick Start

> [!IMPORTANT]
> **Ports**: Dev = **5000**, Preview = **5005**, API = **3000**  
> **NOT 5173** (that's Vite default, we explicitly use 5000)  
> See [PORT_CONFIGURATION.md](technical/devops/PORT_CONFIGURATION.md)

### Development
```bash
# Terminal 1: Backend
cd server && node index.js

# Terminal 2: Frontend
npm run dev
```

- **Frontend**: http://localhost:5000 ← **USE THIS PORT**
- **Backend**: http://localhost:3000 (Express proxy)

### Testing
```bash
npm test              # Unit tests (Vitest)
npm run test:e2e      # E2E tests (Puppeteer)
```

### Current Version
**v3.16.0** - Sprint 16 Complete: SafeDOM Migration & Batch Naming (✅ DEPLOYED)

See [CHANGELOG.md](CHANGELOG.md) for full version history.

---

## 📂 Active Documentation Structure

```
docs/
├── README.md                 # This index
├── PROJECT_SUMMARY.md        # Executive summary
├── MJRP_PRODUCT_VISION.md    # Product Vision & North Star 🌟
├── ROADMAP.md                # Future plans
├── ARCHITECTURE.md           # System design & decisions
├── CONSTITUTION.md           # Core Methodology (Spec-Kit)
├── CHANGELOG.md              # Version history
├── CONTRIBUTING.md           # Pointer to Onboarding
│
├── onboarding/               # Guides for new team members
│   ├── DEVELOPER.md          # Dev setup & context
│   ├── DEVOPS.md             # Infrastructure & deploy
│   ├── QA_ENGINEER.md        # Testing protocols
│   ├── UX_UI.md              # Design & UX specs
│   └── README.md             # Onboarding index
│
├── archive/                  # Historical specs (organized by date)
│   ├── 2025-12/              # Sprint 1-15 archives
│   └── 2026-01/              # Sprint 16+ archives
│
├── technical/                # Single Source for Engineering Docs
│   ├── devops/               # Infrastructure & deploy guides
│   ├── tester/               # QA & Testing specs
│   ├── ux/                   # Design & UX specs
│   ├── specs/                # Feature Specifications
│   └── analysis/             # Technical deep dives
│
└── debug/                    # Troubleshooting
    └── DEBUG_LOG.md          # Active debug history
```

---

## 🗄️ Historical Archives

Old documentation is preserved in `docs/archive/`. 
Use `tar -xzvf [filename]` to access contents.

| Archive File | Contents | Reason for Archiving |
|--------------|----------|----------------------|
| **SPRINT5_UAT_20251206_CLOSED.md** | Sprint 5 UAT Final Report | Sprint 5 closed 2025-12-10; all blockers resolved |
| **sprint5-analysis-20251202.tar.gz** | `GAP_ANALYSIS.md`, `PERSISTENCE_IMPLEMENTATION_REPORT.md`, `TESTABLE_FEATURES.md`, `TEST_PLAN_SPRINT5_HARDENING.md`, `TEST_SPEC_SPRINT5.md` | Pre-UAT analysis and planning docs (Dec 2-3) |
| **tester-reports-20251208.tar.gz** | `CRUD_REVIEW_REPORT.md`, `GHOST_ALBUMS_REPORT.md`, `UX_ANALYSIS_REPORT_20251130.md`, and 5 others | Snapshots of completed testing phases (Nov/Dec 2025) |
| **v2.0-planning-docs.tar.gz** | `V2.0_ANALYSIS.md`, `mjrp-playlist-generator-2.0.md` | Initial V2.0 planning docs (superseded by ROADMAP.md) |
| **archive-backup.tar.gz** | `mission_reports/`, `audit_reports/` (Nov 2025) | Phase 1 & 2 mission reports |

> **Note**: All file history is preserved in git. You can also view previous versions of any file using `git log`.

---

## 🔍 Quick Links

### For Developers
- **Start here**: [Onboarding → Developer](onboarding/DEVELOPER.md)
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Debug Log**: [debug/DEBUG_LOG.md](debug/DEBUG_LOG.md)

### For Testers
- **Start here**: [Onboarding → QA Engineer](onboarding/QA_ENGINEER.md)
- **Test Specs**: [technical/tester/TEST_SPECIFICATION.md](technical/tester/TEST_SPECIFICATION.md)

### For DevOps
- **Start here**: [Onboarding → DevOps](onboarding/DEVOPS.md)
- **Ports**: [technical/devops/PORT_CONFIGURATION.md](technical/devops/PORT_CONFIGURATION.md)
