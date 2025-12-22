---
description: Living Rules for documenting accordingly
---

For documenting follow the **Recommended structure**:
```
docs/
├── README.md (index)
├── PROJECT_SUMMARY.md (Executive Summary)
├── ROADMAP.md (Product Roadmap)
├── ARCHITECTURE.md
├── CONSTITUTION.md
├── CHANGELOG.md
├── CONTRIBUTING.md
│
├── onboarding/           # All onboarding guides
│   ├── README.md
│   ├── DEVELOPER.md
│   ├── DEVOPS.md
│   ├── QA_ENGINEER.md
│   └── [ROLE].md
│
├── technical/            # Deep technical specs & data flows
│
├── debug/
│   └── DEBUG_LOG.md      # Living issue tracker
│
└── archive/
    └── archive-backup.tar.gz  # Compressed old files
```

### For architecture and feature development, also check the architecture-protocol.md to folow it accordingly.


## 🚨 Critical Rules

1. **AVOID DELETE information** - Archive instead
2. **Check OUTDATED info and update or archive**
2. **Use git mv** - Preserve file history
3. **if needed Compress, don't delete** - Old archives go to .tar.gz
4. **Commit per phase** - Easier to revert if needed
5. **Update cross-references** - Fix broken links after moves
## 🚨 Critical Rules (ALWAYS ENFORCE)