# Documentation

**Project**: MJRP Album-Balanced Playlists Generator  
**Last Updated**: 2025-12-08

> **Note**: This is the documentation index. For quick start, see below.

---

## 🚀 Quick Start

> [!IMPORTANT]
> **Ports**: Dev = **5000**, Preview = **5005**, API = **3000**  
> **NOT 5173** (that's Vite default, we explicitly use 5000)  
> See [PORT_CONFIGURATION.md](devops/PORT_CONFIGURATION.md)

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
**v2.0.4** - Sprint 5 Phase 3 (🔴 UAT BLOCKED - see [SPRINT5_UAT Report](tester/SPRINT5_UAT_20251206.md))

See [CHANGELOG.md](CHANGELOG.md) for full version history.

---

## 📂 Active Documentation Structure

```
docs/
├── README.md                 # This index
├── ARCHITECTURE.md           # System design & decisions
├── CHANGELOG.md              # Version history
├── SPRINT5_TASKS.md          # Current sprint tasks
│
├── onboarding/               # Guides for new team members
│   ├── DEVELOPER.md          # Dev setup & context
│   ├── DEVOPS.md             # Infrastructure & deploy
│   ├── QA_ENGINEER.md        # Testing protocols
│   ├── UX_UI.md              # Design system
│   └── README.md             # Onboarding index
│
├── tester/                   # QA & Testing
│   ├── GAP_ANALYSIS.md       # Implementation gaps
│   ├── TEST_SPECIFICATION.md # Full test specs
│   └── SPRINT5_UAT_*.md      # Current UAT reports
│
├── product-management/       # Product Planning
│   ├── ROADMAP.md            # Future plans
│   ├── PROJECT_SUMMARY.md    # Executive summary
│   └── [Requirements Docs]
│
├── devops/                   # Operations
│   ├── PORT_CONFIGURATION.md # Port reference
│   ├── LOCAL_RUN.md          # Run guides
│   └── PRODUCTION_DEPLOY.md  # Deploy runbooks
│
├── technical/                # Low-level specs
│   ├── album_data_schema.md
│   └── data_flow_architecture.md
│
├── ux/                       # Design & UX
│   ├── LOGO_IMPLEMENTATION_GUIDE.md
│   └── UI_CONSISTENCY_AUDIT.md
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
- **Test Specs**: [tester/TEST_SPECIFICATION.md](tester/TEST_SPECIFICATION.md)
- **Current Blocks**: [tester/SPRINT5_UAT_20251206.md](tester/SPRINT5_UAT_20251206.md)

### For DevOps
- **Start here**: [Onboarding → DevOps](onboarding/DEVOPS.md)
- **Ports**: [devops/PORT_CONFIGURATION.md](devops/PORT_CONFIGURATION.md)
