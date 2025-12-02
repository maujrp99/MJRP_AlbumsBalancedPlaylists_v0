---
description: Documentation Audit & Reorganization Protocol
---

# Documentation Audit & Reorganization Protocol

**Purpose**: Systematically audit, consolidate, and reorganize project documentation to eliminate redundancy, improve discoverability, and reduce maintenance burden.

**When to Use**: 
- Documentation feels scattered or duplicated
- Archive folders are bloated
- Multiple folders serve unclear purposes (e.g., `reports/`, `docs/`, scattered guides)
- Hard to find current, relevant documentation

---

## 📋 Phase 0: Initial Assessment

### 0.1 Inventory Current State
```bash
# Count all markdown files
find . -name "*.md" -not -path "*/node_modules/*" | wc -l

# List all documentation directories
find . -maxdepth 2 -type d -name "docs" -o -name "reports" -o -name "archive"

# Measure documentation size
du -sh docs/ reports/ 2>/dev/null
```

### 0.2 Identify Documentation Folders
Common patterns:
- `docs/` - Main documentation
- `reports/` - Often temporary/snapshot reports
- `archive/` - Historical documents
- Scattered onboarding guides (across multiple folders)

### 0.3 Create Analysis Artifact
Create `documentation_audit_analysis.md` artifact with:
- Total file count
- Folder structure
- Identified problems (duplicates, obsolete, scattered)
- Proposed consolidation plan

**Output**: Analysis artifact for user review

---

## 📊 Phase 1: Problem Identification

### 1.1 Find Duplicates
**Check for**:
- Multiple README files (root vs docs/)
- Duplicate CHANGELOGs
- Multiple onboarding guides in different locations
- Archived versions of active docs

**Command**:
```bash
# Find duplicate filenames
find docs/ reports/ -name "*.md" -exec basename {} \; | sort | uniq -d
```

### 1.2 Identify Obsolete Content
**Red flags**:
- Mission/audit reports with completion dates (snapshots, not living docs)
- Files with "archived", "old", "backup" in name
- Folders dated older than 30 days
- Reports from completed sprints/missions

**Questions to ask**:
- Is this a living document or a snapshot?
- Is this referenced anywhere?
- Is the information still current?

### 1.3 Identify Scattered Content
**Common issues**:
- Onboarding guides in 3+ different folders
- Archive files in multiple locations
- No clear folder purpose

**Goal**: Group similar content together

---

## 🎯 Phase 2: Consolidation Strategy

### 2.1 Define Target Structure
**Recommended structure**:
```
docs/
├── README.md (index)
├── ARCHITECTURE.md
├── CHANGELOG.md
├── CONTRIBUTING.md
│
├── onboarding/           # All onboarding guides
│   ├── README.md
│   ├── DEVELOPER.md
│   ├── DEVOPS.md
│   └── [ROLE].md
│
├── [domain]/             # Domain-specific docs
│   ├── devops/
│   ├── technical/
│   ├── product-management/
│   └── ux/
│
├── debug/
│   └── DEBUG_LOG.md      # Living issue tracker
│
└── archive/
    └── archive-backup.tar.gz  # Compressed old files
```

### 2.2 Categorize All Files
For each file, decide:
- **Keep active**: Essential, living document
- **Consolidate**: Merge with similar docs
- **Archive**: Snapshot, completed mission, old version
- **Delete**: Truly obsolete (rare - prefer archive)

### 2.3 Create Multi-Phase Plan
**Typical phases**:
1. **Archive Mission Reports** - Move snapshots to dated archive
2. **Consolidate Onboarding** - Centralize all guides
3. **Archive Cleanup** - Organize by date, compress old
4. **Eliminate Redundant Folders** - Remove purpose-less folders

---

## ⚙️ Phase 3: Execution

### 3.1 Phase 1: Archive Mission Reports
```bash
# Create audit snapshot folder
mkdir -p docs/archive/audit-YYYY-MM-DD/

# Move mission/audit reports
git mv reports/[MISSION]*.md docs/archive/audit-YYYY-MM-DD/
```

**What to archive**:
- Files with completion dates
- Mission summaries (mjrp_doc_audit, etc.)
- Sprint audit reports
- Code review snapshots

### 3.2 Phase 2: Consolidate Onboarding
```bash
# Create onboarding directory
mkdir -p docs/onboarding/

# Move all onboarding guides
git mv reports/[ROLE]_ONBOARDING*.md docs/onboarding/[ROLE].md
git mv docs/[scattered-location]/ONBOARDING*.md docs/onboarding/

# Create index
cat > docs/onboarding/README.md << 'EOF'
# Onboarding Guides
- [Developer](DEVELOPER.md)
- [DevOps](DEVOPS.md)
- [QA Engineer](QA_ENGINEER.md)
EOF
```

### 3.3 Phase 3: Archive Cleanup (by Date)
```bash
# Create monthly archive folders
mkdir -p docs/archive/YYYY-MM/

# Move dated archives
git mv docs/archive/*_archived_YYYYMM*.md docs/archive/YYYY-MM/

# Compress old months (>30 days)
tar -czf docs/archive/YYYY-MM.tar.gz docs/archive/YYYY-MM/
git rm -r docs/archive/YYYY-MM/
git add docs/archive/YYYY-MM.tar.gz
```

**Retention policy**:
- Keep last 30 days uncompressed
- Compress 30-90 days old
- Archive 90+ days (tar.gz)

### 3.4 Phase 4: Eliminate Redundant Folders
```bash
# Move useful content out of reports/
git mv reports/[USEFUL_FILE] docs/[appropriate-location]/

# Remove empty folder
rmdir reports/
```

### 3.5 Final Compression
```bash
# Compress all archives into single backup
cd docs/archive
tar -czf archive-backup.tar.gz */
git rm -r [all-folders]
git add archive-backup.tar.gz
```

---

## ✅ Phase 4: Verification & Commit

### 4.1 Verify Structure
```bash
# Check docs/ structure
tree -L 2 docs/ || find docs/ -maxdepth 2 -type d

# Verify only archive backup exists
ls docs/archive/

# Count reduction
find docs -name "*.md" | wc -l
```

### 4.2 Update docs/README.md
Add/update sections:
- Quick Start (if added onboarding/)
- Onboarding Guides (link to onboarding/README.md)
- Update directory tree

### 4.3 Commit Strategy
**Commit per phase**:
```bash
# Phase 1
git commit -m "docs: archive mission reports to audit-YYYY-MM-DD"

# Phase 2
git commit -m "docs: consolidate onboarding guides to docs/onboarding/"

# Phase 3
git commit -m "docs: organize archives by month and compress old files"

# Phase 4
git commit -m "docs: eliminate [FOLDER] folder"

# Final compression
git commit -m "docs: compress all archives into single backup file"
```

### 4.4 Final Verification
```bash
# Ensure working tree clean
git status

# No scattered files
find . -maxdepth 1 -name "*.md" -not -name "README.md"

# Archive size
du -sh docs/archive/
```

---

## 📈 Success Metrics

**Target reductions**:
- 📉 **-40% to -60%** total .md files
- 📉 **-50% to -70%** active archive files
- 📦 **Single .tar.gz** in archive/ (not folders)
- 🎯 **1 location** for each content type (onboarding, etc.)

**Quality improvements**:
- ✅ Clear folder purposes
- ✅ Easy to find current docs
- ✅ Historical docs preserved but out of the way
- ✅ Reduced maintenance burden

---

## 🚨 Critical Rules

1. **NEVER DELETE information** - Archive instead
2. **Use git mv** - Preserve file history
3. **Compress, don't delete** - Old archives go to .tar.gz
4. **Commit per phase** - Easier to revert if needed
5. **Update cross-references** - Fix broken links after moves

---

## 🔄 When to Re-run

**Triggers**:
- Every 3-6 months (routine maintenance)
- After major project milestones (releases, sprints)
- When archive/ has 20+ files
- When documentation feels "hard to navigate"

**Quick check** (run monthly):
```bash
# Archive health
ls -1 docs/archive/ | wc -l  # Should be 1 (archive-backup.tar.gz)

# Recent archives needing compression
find docs/archive -name "*_archived_*" -mtime +30
```

---

## 📞 Support

See also:
- `architecture_protocol.md` - For architecture decisions
- `debug_protocol.md` - For issue tracking
- Project-specific `docs/README.md` - For current structure

**End of Protocol**
