# QA Engineer Onboarding Guide - MJRP Albums Balanced Playlists v2.0

**Created**: 2025-11-30  
**Updated**: 2025-12-01 (v2.0 - Expanded QA Scope)  
**Role**: QA Engineer / Test Specialist  
**Goal**: Own the quality strategy for the MJRP Albums Balanced Playlists v2.0 project.

---

## Part 1: Your Role as QA Engineer

### 🎯 Responsibilities
You are **NOT** just a UAT executor. You are the **Quality Owner** of the project.

- **Test Strategy**: Define what gets tested and how.
- **Coverage Analysis**: Identify gaps in automated tests.
- **Risk Assessment**: Prioritize testing based on business impact.
- **Release Sign-Off**: Final approval before Production deployment.
- **Test Automation Partnership**: Work with developers to expand automated coverage.

### 📊 Quality Metrics You Own
- **Test Coverage**: Target 80%+ (unit + integration).
- **Bug Escape Rate**: Bugs found in production vs caught in QA.
- **Regression Pass Rate**: % of regression suite passing.
- **Automation Coverage**: % of test cases automated.

---

## Part 2: Test Infrastructure

### 🧪 Current Test Coverage

**Automated Tests (Vitest)**:
- `tests/stores/` - **55 tests**, 82.57% coverage
  - `albums.test.js` (16 tests)
  - `playlists.test.js` (22 tests)
  - `series.test.js` (17 tests)
- `tests/router.test.js` - **12 tests**

**Total**: **67 automated tests** passing ✅

### Your Mission
1. **Review**: Analyze existing tests for gaps.
2. **Complement**: Add missing edge cases to test files.
3. **Document**: Create test case matrix (see Part 3).

### Running Automated Tests
```bash
# Run all tests (Vitest)
npm test

# Open interactive test dashboard
npm run test:ui

# Check coverage gaps
npm run test:coverage
```

---

## Part 3: Test Planning

### 📝 Test Case Template
Use this format in a shared document (e.g., `reports/test_cases.md`).

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

### 🔄 Regression Test Suite
Run this checklist before **EVERY** release.

#### Core Flows
- [ ] Create Series → Load Albums → Generate Playlists
- [ ] Navigation: Home ↔ Albums ↔ Playlists ↔ Ranking
- [ ] Hard Refresh (F5) on each page
- [ ] Browser Back/Forward buttons

#### Data Persistence
- [ ] localStorage survives refresh
- [ ] Series state persists across navigation
- [ ] View mode preference persists

#### Edge Cases
- [ ] Empty state (no series)
- [ ] Network failures (offline mode simulation)
- [ ] Large datasets (50+ albums)

---

## Part 4: Manual Testing (Current UAT Focus)

### 🚨 Priority Test Scenarios (Must Pass)

#### 1. Verify Fix: Ghost Albums (Issue #15)
**Scenario**: Rapidly switching between series.
1. Go to **Home**.
2. Click on a Series (e.g., "The Clash").
3. Wait for albums to load.
4. Click **Home** immediately.
5. Click a DIFFERENT Series (e.g., "Radiohead").
6. **Pass Criteria**: Only Radiohead albums appear. No "ghost" albums from The Clash.
7. **Fail Criteria**: You see a mix of albums or the count is wrong.

#### 2. Verify Fix: View Mode Toggle (Issue #16)
**Scenario**: Switching between Grid and List views.
1. Go to **Albums** page.
2. Click "View Expanded" (List icon).
3. **Pass Criteria**:
   - View changes to detailed list.
   - "View Compact" button appears.
   - **Reload Page (F5)**: View stays in Expanded mode (Persistence).
4. Click "View Compact".
5. **Pass Criteria**: View returns to Grid.

#### 3. Verify Fix: Wrong Series Display (Issue #19)
**Scenario**: Series with same album counts.
1. Load a series with 3 albums (e.g., Series A).
2. Go Home.
3. Load a DIFFERENT series with 3 albums (e.g., Series B).
4. **Pass Criteria**: You see Series B albums (check titles).
5. **Fail Criteria**: You see Series A albums again.

### 🔍 Component Validation (UI/UX)

#### 4. Migration Banner
- **Where**: Home Page (top).
- **Action**: Click "Start Migration".
- **Expectation**: Should open a modal or navigate to migration flow. (Note: Backend might be mocked).

#### 5. Edit Album Modal
- **Where**: Albums Page (Grid View) → Hover over album → Click "Edit" (Pencil icon).
- **Test**:
  - Change Title.
  - Save.
  - **Expectation**: Card updates immediately.

#### 6. Inventory Actions
- **Where**: Albums Page → Hover → Click "Add to Inventory" (Archive icon).
- **Expectation**: Success message or console log.
- **Then**: Go to `/inventory` (via URL or Menu if available).
- **Expectation**: Album should appear there.

### 🐛 How to Report Bugs

Log issues in `docs/debug/DEBUG_LOG.md` (or tell the Developer Agent) using this format:

```markdown
### Issue #[NextNumber]: [Title]
**Status**: 🔴 Open
**Date**: [Today]
**Severity**: [High/Medium/Low]

#### Steps to Reproduce
1. Go to...
2. Click...
3. ...

#### Expected Behavior
[What should happen]

#### Actual Behavior
[What actually happened]
```

---

## Part 5: Integration & Reporting

### 🤖 Automated Test Integration

#### Identify Gaps
1. Review `tests/` directory.
2. Compare coverage report to feature list.
3. Flag scenarios that **SHOULD** be automated but aren't.

**Example Gaps**:
- Drag-and-drop playlist reordering (manual only).
- Album image loading fallback (manual only).

#### Puppeteer E2E (Planned)
```bash
# Coming soon
npm run test:e2e  # Run automated browser tests
```

### 📊 Weekly QA Report Template

Create a report in `reports/qa_weekly_YYYYMMDD.md`:

```markdown
# QA Weekly Report - [Date]

## Summary
- Tests Executed: X
- Bugs Found: Y (Critical/High/Medium/Low)
- Regression Status: PASS/FAIL

## Coverage Gaps
- [List features without automated tests]

## Recommendations
- [Priority areas for automation]
```

### ✅ Release Sign-Off Checklist
Before approving Production:
- [ ] All Priority 1 test scenarios passed.
- [ ] No Critical/High severity bugs open.
- [ ] Regression suite passed 100%.
- [ ] UX Report reviewed (from UX/UI Agent).
- [ ] Performance: Lighthouse score > 90.

---

## 🛠️ Testing Toolkit

### Manual Testing
- **URL**: `http://localhost:5000/`
- **Browser**: Chrome (recommended) or Firefox.
- **Debug Panel**: Floating panel in bottom-right corner.
  - Use to verify Total Albums vs Filtered Albums count.
  - Check Active Filters (Artist, Year, Status).
  - View Mode State (Compact vs Expanded).

### Automated Testing
- **Vitest**: Unit/Integration tests.
- **Coverage**: `npm run test:coverage` (output in `coverage/` directory).

### Performance Testing
- **Lighthouse**: Chrome DevTools → Lighthouse tab.
- **Network Throttling**: Chrome DevTools → Network → "Slow 3G".

---

## ⚠️ Known Limitations (Don't Report)
1. **Refresh Button**: Might show an alert saying "Not fully implemented". This is expected.
2. **Slow Images**: Images load from external URLs (Last.fm/Spotify), might be slow.
3. **Debug Panel**: It covers some content. This is temporary for UAT.

---

**Ready to own Quality? Let's ship a bug-free v2.0!** 🚀
