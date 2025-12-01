# Documentation

**Project**: MJRP Album-Balanced Playlists Generator  
**Last Updated**: 2025-11-29

> **Note**: This is the documentation index. For project overview, see [main README](../README.md) in the root.

---

## 📐 Architecture

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Consolidated architecture decisions
  - Current: Store State Management, Album Data Schema
  - Previous: Caching Strategy, Routing Decision, Repository Pattern
  - Cross-references: Sprint 5 Persistence, Apple Music Integration, SDD
  - **This is the single source of truth for architectural decisions**

- **[DEBUG_LOG.md](DEBUG_LOG.md)** - Debugging sessions & troubleshooting
  - Current debugging session (Issue #8: Store State Management)
  - Previous debugging sessions (Sprint 4, 4.5, hotfixes)
  - Debug tools documentation
  - Lessons learned

---

## 🚀 DevOps

- **[devops/LOCAL_RUN.md](devops/LOCAL_RUN.md)** - How to run locally
- **[devops/PRODUCTION_DEPLOY.md](devops/PRODUCTION_DEPLOY.md)** - Production deployment guide
- **[devops/PRODUCTION_DEPLOY.md](devops/PRODUCTION_DEPLOY.md)** - Production deployment procedures
- **[devops/SECRET_ROTATION_RUNBOOK.md](devops/SECRET_ROTATION_RUNBOOK.md)** - Secret rotation procedures
- **[devops/SECURITY.md](devops/SECURITY.md)** - Security guidelines

---

## 📦 Product Management

- **[product-management/PROJECT_SUMMARY.md](product-management/PROJECT_SUMMARY.md)** - Project overview
- **[product-management/SPRINT_5_UI_SPECS.md](product-management/SPRINT_5_UI_SPECS.md)** - Sprint 5 specifications
- **[product-management/V2.0_ANALYSIS.md](product-management/V2.0_ANALYSIS.md)** - V2.0 analysis
- **[product-management/V2.0_DEPLOYMENT_IMPACT.md](product-management/V2.0_DEPLOYMENT_IMPACT.md)** - V2.0 deployment impact
- **[product-management/V2.0_DESIGN_MOCKUPS.md](product-management/V2.0_DESIGN_MOCKUPS.md)** - V2.0 design mockups
- **[product-management/mjrp-playlist-generator-2.0.md](product-management/mjrp-playlist-generator-2.0.md)** - V2.0 specification

---

## 📝 Project History

- **[CHANGELOG.md](CHANGELOG.md)** - Version history and release notes

---

## 📚 Archive

- **[archive/architecture-artifacts-2025-11-29/](archive/architecture-artifacts-2025-11-29/)** - Consolidated architecture artifacts (Nov 29, 2025)
  - Includes: Sprint 5 Persistence Architecture, Apple Music Architecture, SDD, and others
- **[archive/hotfixes/](archive/hotfixes/)** - Historical hotfix documentation
- **[archive/](archive/)** - Other archived documents

---

## 🔍 Quick Links

### For Developers
- Start here: [DevOps → Local Run](devops/LOCAL_RUN.md)
- Architecture decisions: [ARCHITECTURE.md](ARCHITECTURE.md)
- Deployment: [DevOps → Production Deploy](devops/PRODUCTION_DEPLOY.md)

### For Product Managers
- Project overview: [Product Management → Project Summary](product-management/PROJECT_SUMMARY.md)
- Latest changes: [CHANGELOG.md](CHANGELOG.md)
- Sprint specs: [Product Management → Sprint 5 UI Specs](product-management/SPRINT_5_UI_SPECS.md)

### For Architects
- Current architecture: [ARCHITECTURE.md](ARCHITECTURE.md)
- Historical decisions: [archive/architecture-artifacts-2025-11-29/](archive/architecture-artifacts-2025-11-29/)

---

## 📂 Documentation Structure

```
docs/
├── README.md (this file)
├── ARCHITECTURE.md (consolidated architecture)
├── CHANGELOG.md (version history)
│
├── devops/
│   ├── LOCAL_RUN.md
│   ├── PRODUCTION_DEPLOY.md
│   ├── PRODUCTION_DEPLOY.md
│   ├── SECRET_ROTATION_RUNBOOK.md
│   └── SECURITY.md
│
├── product-management/
│   ├── PROJECT_SUMMARY.md
│   ├── SPRINT_5_UI_SPECS.md
│   ├── V2.0_ANALYSIS.md
│   ├── V2.0_DEPLOYMENT_IMPACT.md
│   ├── V2.0_DESIGN_MOCKUPS.md
│   └── mjrp-playlist-generator-2.0.md
│
└── archive/
    ├── architecture-artifacts-2025-11-29/ (13 files)
    ├── hotfixes/ (historical hotfixes)
    └── [other archived documents]
```

---

## 🔄 Maintenance

**When to update this index:**
- New top-level document added to /docs
- Folder structure changes
- Major documentation reorganization

**Workflow documentation:**
- Architecture updates: See `.agent/workflows/architecture_documentation.md`
- Debug workflow: See `.agent/workflows/debug_issue.md`
