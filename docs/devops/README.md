# DevOps Documentation

**Last Updated:** 2025-11-29

---

## 📚 Active Documentation

### Primary Deployment Guide
**Location:** `docs/devops/PRODUCTION_DEPLOY.md`

This is the **single source of truth** for production deployments. It consolidates:
- Pre-deployment checklists
- Cloud Run deployment procedures
- Firebase Hosting deployment
- Post-deployment validation
- Rollback procedures
- CI/CD configuration
- Troubleshooting guide

**Use this document for all deployment activities.**

---

## 📂 Supporting Documentation (This Directory)

### Security & Operations
- [`SECRET_ROTATION_RUNBOOK.md`](./SECRET_ROTATION_RUNBOOK.md) - Secret rotation procedures
- [`SECURITY.md`](./SECURITY.md) - Security policies and best practices
- [`LOCAL_RUN.md`](./LOCAL_RUN.md) - Local development setup

---

## 📦 Archived Documentation

**Location:** `/docs/archive/`

The following files were consolidated into `PRODUCTION_DEPLOY.md` on 2025-11-29:
- `DEPLOYMENT_ARCHIVED_20251129.md` (Original Cloud Run + Firebase guide)
- `PRODUCTION_DEPLOY_ARCHIVED_20251129.md` (Original CI/CD checklist)
- `DEPLOYMENT_CHECKLIST_V2_ARCHIVED_20251129.md` (Sprint 5 checklist)

**These files are preserved for historical reference but should not be used for new deployments.**

---

## 🎯 Quick Links

- **Deploy to Production:** See `PRODUCTION_DEPLOY.md` (this directory)
- **Rotate Secrets:** See `SECRET_ROTATION_RUNBOOK.md`
- **Run Locally:** See `LOCAL_RUN.md`
- **Security Policies:** See `SECURITY.md`

---

## 📝 Documentation Rules

Per project documentation protocol:
1. **Do not create new documents** - Use existing ones
2. **Always use timestamps** when updating
3. **Never delete information** - Move to archive with `_ARCHIVED_YYYYMMDD` suffix
4. **Mark deprecated content** as "deprecated" or "old" if needed

---

**Owner:** DevOps Team  
**Next Review:** Before Sprint 6 deployment
