# QA Engineer Onboarding Guide - MJRP Albums Balanced Playlists v2.0

**Created**: 2025-12-02  
**Role**: QA Engineer / Test Specialist  
**Goal**: Own the quality strategy for the MJRP Albums Balanced Playlists v2.0 project.

---

## Part 1: Business Context

### What is This App?
> **Context**: Read the [Product Vision](../MJRP_PRODUCT_VISION.md) first.

MJRP Albums Balanced Playlists is a **hybrid music curator** that generates balanced playlists from ranked albums. It combines:
- **BestEver Albums** acclaim data
- **AI-powered** track ranking enrichment
- **User-defined** album collections (series)

### Who Uses It?
- Music curators creating themed playlists
- Fans exploring critically-acclaimed albums
- DJs balancing tracklists across multiple albums

### Key Value Propositions
1. **Data-Driven**: Uses actual acclaim ratings from BestEver Albums
2. **Balanced**: Distributes tracks evenly across albums
3. **Flexible**: Create multiple series for different themes
4. **Persistent**: Firestore-backed data survives across devices

---

## Part 2: Technical Context

### Tech Stack
- **Frontend**: Vite + Vanilla JavaScript (SPA with custom router)
- **Backend**: Node.js/Express + AI API proxy
- **Database**: Firebase Firestore
- **Testing**: Vitest (unit), Puppeteer (E2E)
- **Styling**: Tailwind CSS (via CDN)

### Architecture
- **Pattern**: Rich Domain Model (ES6 classes)
- **Router**: Custom client-side router (`public/js/router.js`)
- **State**: Store pattern (`albumsStore`, `playlistsStore`, `seriesStore`)
- **Views**: BaseView pattern (lifecycle: render → mount → unmount)

### Environment Setup
**Ports**:
- Dev Server: `http://localhost:5000` (Vite dev)
- Preview Server: `http://localhost:5005` (Vite preview - for E2E tests)
- Backend API: `http://localhost:3000`

**Commands**:
```bash
# Terminal 1: Backend
cd server && node index.js

# Terminal 2: Frontend
npm run dev

# Terminal 3: Preview (for E2E)
npm run preview -- --port 5005
```

### Data Flow
```
User Action → View → Store → API Client → Backend → Firestore
                ↓             ↓
            Update UI    Cache (IndexedDB)
```

**Key Files**:
- `public/js/router.js` - Route handling
- `public/js/stores/*.js` - State management
- `public/js/views/*.js` - UI components
- `public/js/models/*.js` - Domain classes (Album, Track, Playlist, Series)

---

## Part 3: Design & UX Standards

### Theme: "Nebula"
- **Palette**: Flame (Primary), Amber (Secondary), Deep Slate (Backgrounds)
- **Style**: Dark mode, Glassmorphism, Vibrant Gradients
- **Typography**: Modern Sans-Serif (Inter/Roboto)

### Critical Rules
- ❌ **NO EMOJIS** in the UI (use SVG icons from Heroicons/Lucide)
- ✅ **Text-based indicators OK**: ✅ ❌ ⚠️ 🔄 (for status)
- ✅ **Glassmorphism**: `backdrop-blur-md`, `bg-white/10`

### UI Testing Considerations
- **Visual Regression**: Compare before/after screenshots for UI changes
- **Responsive**: Test 3 breakpoints (mobile 375px, tablet 768px, desktop 1920px)
- **Accessibility**: Keyboard navigation (Tab, Enter, Esc), color contrast

---

## Part 4: Testing Protocols

### Test Framework
- **Vitest**: Unit tests (`tests/stores/`, `tests/router.test.js`)
- **Puppeteer**: E2E tests (`test/e2e/`)
- **Setup**: `npm run test:e2e` (launches Puppeteer suite)

### Running Tests
```bash
# Unit tests
npm test

# Unit tests (interactive dashboard)
npm run test:ui

# Coverage report
npm run test:coverage

# E2E tests (Puppeteer)
npm run test:e2e
```

### Test Specification
- **Location**: `artifacts/test_specification.md`
- **Contains**: User Stories, Acceptance Criteria, Test Cases
- **Update when**: New features added

### Test Case Template (Generic)
```markdown
### TC-[ID]: [Feature Name]
**Priority**: High/Medium/Low  
**Type**: Smoke/Regression/Integration  
**Pre-conditions**: [State required]

**Steps**:
1. Action
2. Action

**Expected**: [Result]  
**Actual**: [What happened]  
**Status**: ✅ Pass / ❌ Fail
```

### Regression Checklist (Generic)

#### Navigation Flows
- [ ] Home → Albums → Ranking → Playlists
- [ ] Browser back/forward
- [ ] Direct URLs (e.g., `/albums`, `/ranking`, `/playlists`)

#### Data Integrity
- [ ] Album count matches queries
- [ ] Track artist/album fields populated
- [ ] Durations calculated correctly

#### View Modes
- [ ] Grid ↔ List toggle
- [ ] Persistence after reload
- [ ] No duplicate data

#### Series Management
- [ ] Switch series clears old data
- [ ] No cross-contamination

#### Drag-and-Drop
- [ ] Track moves correctly
- [ ] Durations recalculate
- [ ] No track loss

---

## Part 5: Key Architectural Decisions

### Why Firestore over localStorage?
- **Schema Versioning**: Built-in migration support
- **No Size Limits**: localStorage capped at ~5MB
- **Cross-Device Sync**: Future-ready for multi-device
- **Offline Support**: Firestore persistence SDK

### Why Custom Router vs React Router?
- **Simplicity**: Vanilla JS, no framework overhead
- **Learning**: Educational value for custom SPA patterns
- **Control**: Full control over lifecycle (mount/unmount)

### Domain Model Pattern
- **Classes**: `Album`, `Track`, `Playlist`, `Series` (ES6 classes)
- **Why**: Prevents data anemia, guarantees context (artist/album on tracks)
- **Hydration**: Centralized in `client.js` and `MigrationUtility.js`

---

## Part 6: Reference Links

### Current Status (Transiente)
- [DEBUG_LOG.md](../debug/DEBUG_LOG.md) - Open/resolved issues
- [CHANGELOG.md](../CHANGELOG.md) - Development history (sprints, UAT issues/fixes, architectural changes, refactors, new designs)

### Deep Dive (Permanente)
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Technical architecture
- [data_flow_architecture.md](../technical/data_flow_architecture.md) - Data flows

### Test Artifacts
- [test/e2e/README.md](../../test/e2e/README.md) - Puppeteer framework setup
- [test_specification.md](../../artifacts/test_specification.md) - Complete test spec
- [Test Results](../../test/e2e/screenshots/) - Evidence screenshots

---

## Part 7: Test Artifacts & Evidence

### Test Specifications
- **Location**: `artifacts/test_specification.md`
- **Contents**: Navigation scenarios, User Stories, ACs, TCs
- **Ownership**: QA Engineer maintains

### Test Results
- **E2E Screenshots**: `test/e2e/screenshots/`
- **Naming**: `{test-name}-{timestamp}.png`
- **Retention**: Keep last 5 runs

### Test Reports
- **Format**: Markdown summary + screenshots
- **Location**: Artifacts directory
- **CRITICAL**: Attach evidence (screenshots) for **ALL tests** (passed AND failed)
- **Example**:
```markdown
## Test Run - 2025-12-02
Total: 18 TCs | Passed: 15 ✅ | Failed: 3 ❌ | Pass Rate: 83%
```

### Evidence for Bug Reports
When filing bugs in `DEBUG_LOG.md`:
- Include screenshot from `test/e2e/screenshots/`
- Reference TC-ID from `test_specification.md`
- Link to test run output

**Example**:
```markdown
### Issue #22: Navigation Regression
**Evidence**: ![screenshot](../../test/e2e/screenshots/issue-22-nav-fail-20251202.png)
**Related TC**: TC-NAV-01 (see test_specification.md)
```

---

## 🎯 Your Responsibilities as QA Engineer

- **Test Strategy**: Define what gets tested and how
- **Coverage Analysis**: Identify gaps in automated tests
- **Risk Assessment**: Prioritize testing based on business impact
- **Release Sign-Off**: Final approval before Production deployment
- **Test Automation Partnership**: Work with developers to expand automated coverage

### Quality Metrics You Own
- **Test Coverage**: Target 80%+ (unit + integration)
- **Bug Escape Rate**: Bugs found in production vs caught in QA
- **Regression Pass Rate**: % of regression suite passing
- **Automation Coverage**: % of test cases automated

---

**Ready to own Quality? Let's ship a bug-free v2.0!** 🚀
