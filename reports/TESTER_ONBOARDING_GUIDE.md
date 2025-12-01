# Tester Onboarding Guide - MJRP Albums Balanced Playlists v2.0

**Created**: 2025-11-30
**Role**: QA / Tester / UAT Specialist
**Goal**: Verify system stability and validate critical bug fixes before Production release.

---

## 🎯 Your Mission
We are in the **User Acceptance Testing (UAT)** phase for version 2.0.
Your job is to break the app, verify fixes, and ensure the UX is smooth.

**Current Status**:
- **Version**: 2.0.0-alpha.1
- **Environment**: Localhost (Port 5000)
- **Key Focus**: Critical Bug Verification & UI Component Validation

---

## 🛠️ Setup & Access

### 1. Access the App
The application should be running locally.
- **URL**: `http://localhost:5000/`
- **Browser**: Chrome (recommended) or Firefox.

### 2. The Debug Panel
You will see a **floating Debug Panel** in the bottom-right corner.
- **Use this to verify**:
  - Total Albums vs Filtered Albums count.
  - Active Filters (Artist, Year, Status).
  - View Mode State (Compact vs Expanded).
- *Note*: If this panel is missing, ask a developer to enable it.

---

## 🧪 Priority Test Scenarios (Must Pass)

### 1. 🚨 Verify Fix: Ghost Albums (Issue #15)
**Scenario**: Rapidly switching between series.
1. Go to **Home**.
2. Click on a Series (e.g., "The Clash").
3. Wait for albums to load.
4. Click **Home** immediately.
5. Click a DIFFERENT Series (e.g., "Radiohead").
6. **Pass Criteria**: Only Radiohead albums appear. No "ghost" albums from The Clash.
7. **Fail Criteria**: You see a mix of albums or the count is wrong.

### 2. 🚨 Verify Fix: View Mode Toggle (Issue #16)
**Scenario**: Switching between Grid and List views.
1. Go to **Albums** page.
2. Click "View Expanded" (List icon).
3. **Pass Criteria**:
   - View changes to detailed list.
   - "View Compact" button appears.
   - **Reload Page (F5)**: View stays in Expanded mode (Persistence).
4. Click "View Compact".
5. **Pass Criteria**: View returns to Grid.

### 3. 🚨 Verify Fix: Wrong Series Display (Issue #19)
**Scenario**: Series with same album counts.
1. Load a series with 3 albums (e.g., Series A).
2. Go Home.
3. Load a DIFFERENT series with 3 albums (e.g., Series B).
4. **Pass Criteria**: You see Series B albums (check titles).
5. **Fail Criteria**: You see Series A albums again.

---

## 🔍 Component Validation (UI/UX)

### 4. Migration Banner
- **Where**: Home Page (top).
- **Action**: Click "Start Migration".
- **Expectation**: Should open a modal or navigate to migration flow. (Note: Backend might be mocked).

### 5. Edit Album Modal
- **Where**: Albums Page (Grid View) -> Hover over album -> Click "Edit" (Pencil icon).
- **Test**:
  - Change Title.
  - Save.
  - **Expectation**: Card updates immediately.

### 6. Inventory Actions
- **Where**: Albums Page -> Hover -> Click "Add to Inventory" (Archive icon).
- **Expectation**: Success message or console log.
- **Then**: Go to `/inventory` (via URL or Menu if available).
- **Expectation**: Album should appear there.

---

## 🐛 How to Report Bugs

Please log issues in `docs/debug/DEBUG_LOG.md` (or tell the Developer Agent) using this format:

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

## ⚠️ Known Limitations (Don't Report)
1. **Refresh Button**: Might show an alert saying "Not fully implemented". This is expected.
2. **Slow Images**: Images load from external URLs (Last.fm/Spotify), might be slow.
3. **Debug Panel**: It covers some content. This is temporary for UAT.

---

**Ready? Start with Scenario #1 (Ghost Albums). Good luck!** 🕵️‍♀️
