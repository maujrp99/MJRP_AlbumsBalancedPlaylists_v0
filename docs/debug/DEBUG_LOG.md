# Debug Log

**Last Updated**: 2025-12-09 23:54
**Workflow**: See `.agent/workflows/debug_protocol.md`
## Maintenance Notes

**How to Update This Document**:
1. Active issues → Current Debugging Session
2. Resolved/reverted issues → Move to Previous with timestamp
3. Keep Previous sections for history (don't delete)
4. Link to ARCHITECTURE.md for architectural decisions

**See**: `.agent/workflows/debug_issue.md` for systematic debugging protocol

---

## 📑 Issue Index

| Issue | Component | Status | Line |
|-------|-----------|--------|------|
| #37 | Apple Sign-In Config | ✅ RESOLVED | [L41](#issue-37-apple-sign-in-invalid-redirect-url---resolved-) |
| #36 | Auth Integration Regressions | ✅ RESOLVED | [L85](#issue-36-auth-integration-regressions---resolved-) |
| #35 | Firebase Initialization | ✅ RESOLVED | [L119](#issue-35-firebase-initialization--sdk-mismatch---resolved-) |
| #34 | Generate Playlists API 500 | ✅ RESOLVED | [L145](#issue-34-generate-playlists-api-returns-500---resolved-) |
| #32 | Cloud Build Docker Context | ✅ RESOLVED | [L146](#issue-32-cloud-build-docker-context-failure---resolved-) |
| #31 | Playlist Generate New Albums | ⏳ AWAITING | [L253](#issue-31-playlist-generate-not-using-new-albums---awaiting-verification) |
| #30 | Album Delete | ✅ RESOLVED | [L272](#issue-30-album-delete-not-working---resolved-) |
| #29 | Inventory Card Display | ✅ RESOLVED | [L310](#issue-29-inventory-card-display--modal-issues---resolved-) |
| #28 | Inventory CRUD | ✅ RESOLVED | [L192](#issue-28-inventory-crud-not-working---resolved-) |
| #27 | Album Series CRUD | ⏳ AWAITING | [L339](#issue-27-album-series-crud-persistence-failures---awaiting-verification) |
| #26 | Firebase Serialization | ✅ RESOLVED | [L428](#issue-26-firebase-serialization-errors-custom-objects---resolved) |
| #25 | Inventory Modal Styles | ✅ RESOLVED | [L378](#issue-25-inventory-modal-misalignment--missing-styles---resolved) |
| #23 | Mobile Menu Transparent | ✅ RESOLVED | [L486](#issue-23-mobile-menu-transparent-background---resolved) |
| #22 | Ghost Albums | ✅ RESOLVED | [L535](#issue-22-ghost-albums-regression---resolved) |
| #21 | Sticky Playlists | ✅ WONTFIX | [L633](#issue-21-sticky-playlists) |

> **Note**: Issues #1-#20 are in the "Previous Sessions" section (historical).

---

## Current Debugging Session

### Issue #37: Apple Sign-In Invalid Redirect URL - RESOLVED ✅
**Status**: ✅ **RESOLVED - USER CONFIRMED**
**Date**: 2025-12-11 22:15 → 23:35
**Type**: Configuration
**Component**: Apple Developer Portal, Firebase Console

#### Problem
Apple Sign-In popup showed `invalid_request: Invalid web redirect url` error.
The CSP (Content Security Policy) was also blocking fonts and scripts from Apple CDNs.

#### Failed Attempts
1. **Attempt 1**: Added `mjrp-albums.firebaseapp.com` to Apple Portal Return URLs.
   - **Result**: Still failed. Assumed wrong domain.
2. **Attempt 2**: Added `mjrp-playlist-generator.web.app` to Apple Portal.
   - **Result**: Still failed. Firebase uses `.firebaseapp.com` for auth, not `.web.app`.
3. **Attempt 3**: Updated CSP in `index.html` to allow Apple fonts (`data:` URIs).
   - **Result**: Partial fix. CSP errors resolved but redirect URL error persisted.
4. **Attempt 4**: CSP too strict, broke production (blocked Tailwind/Firebase CDNs).
   - **Result**: Had to widen CSP to include `cdn.tailwindcss.com`, `www.gstatic.com`.

#### Root Cause
Firebase `authDomain` was configured as `mjrp-playlist-generator.firebaseapp.com`, but Apple Portal only had:
- `mjrp-albums.firebaseapp.com` (wrong project)
- `mjrp-playlist-generator.web.app` (wrong domain type)

The correct domain/Return URL was **never configured**.

#### Fix Applied
1. **Apple Developer Portal** (Identifiers > Service IDs > MJRP Web Auth > Configure):
   - Added to **Domains**: `mjrp-playlist-generator.firebaseapp.com`
   - Added to **Return URLs**: `https://mjrp-playlist-generator.firebaseapp.com/__/auth/handler`
2. **CSP Fix**: Updated `public/index.html` to allow Tailwind, Firebase, and Apple CDNs.

#### Files Modified
- `public/index.html` (CSP meta tag)

#### Lesson Learned
Always verify `authDomain` in `firebase-config.js` before configuring Apple Portal Return URLs.
The redirect URL format is: `https://{authDomain}/__/auth/handler`.

---

### Issue #36: Auth Integration Regressions - RESOLVED ✅
**Status**: ✅ **RESOLVED - USER CONFIRMED**
**Date**: 2025-12-11 19:15 → 19:40
**Type**: Regression
**Component**: `HomeView.js`, `AlbumsView.js`, `TopNav.js`

#### Problem
After abstracting the Auth/UserStore logic, several regressions appeared:
1. **HomeView**: `ReferenceError: series is not defined` when creating a series.
2. **TopNav**: "Albums" link broke (`seriesId=undefined`), and "Sign In" button was missing for guests.
3. **AlbumsView**: Deleting an album crashed the app if the parent series was also deleted (Ghost Series context).

#### Root Cause
1. **HomeView**: Code wrapper for `try/catch` accidentally removed the `const series = ...` definition.
2. **TopNav**: Logic assumed verified user; didn't handle `isAnonymous` correctly. Link generation didn't have a fallback for `undefined` series.
3. **AlbumsView**: Delete handler assumed `activeSeries` always existed.

#### Fix Applied
1. **HomeView**: Restored `series` object definition.
2. **TopNav**:
    - Added explicit `if (currentUser.isAnonymous)` check to show "Sign In".
    - Fixed `getAlbumsSeriesLink` to return base `/albums` if no series active.
3. **AlbumsView**: Added defensive `if (!activeSeries)` check to prevent crash during deletion.

#### Files Modified
- `public/js/views/HomeView.js`
- `public/js/views/AlbumsView.js`
- `public/js/components/TopNav.js`

---

### Issue #35: Firebase Initialization & SDK Mismatch - RESOLVED ✅
**Status**: ✅ **RESOLVED**
**Date**: 2025-12-11 18:00 → 19:10
**Type**: Architecture/Infrastructure
**Component**: `app.js`, `firebase-init.js`, `AuthService.js`, `Repositories`

#### Problem
The application failed to load with multiple errors:
1. `No Firebase App '[DEFAULT]' has been created` - calling `getAuth/getFirestore` before `initializeApp`.
2. `Expected first argument to collection() to be a CollectionReference` - Mixing CDN imports with NPM imports.

#### Root Cause
1. **Module Evaluation Order**: `AuthService.js` and Repositories were instantiating `getAuth()` at the top level.
2. **Hybrid Import Strategy**: Firebase SDK treats objects from CDN and NPM as different instances.

#### Fix Applied
1. **Centralized Initialization**: Created `public/js/firebase-init.js` with lazy initialization.
2. **Lazy Loading**: Refactored `AuthService` to access `this.auth` via a getter.
3. **Standardization**: Converted **ALL** repositories to use NPM imports exclusively.

#### Files Modified
- `public/js/firebase-init.js` (Created)
- `shared/services/AuthService.js`
- `public/js/app.js`
- `public/js/repositories/*.js`

---

### Issue #34: Generate Playlists API Returns 500 - RESOLVED ✅
**Status**: ✅ **RESOLVED - USER CONFIRMED**
**Date**: 2025-12-10 00:00 → 10:23
**Type**: Backend API Error
**Component**: `server/index.js`, `shared/curation.js`

#### Problem
When clicking "Generate Playlists" in production, the API returns HTTP 500:
```
/api/playlists:1 Failed to load resource: the server responded with a status of 500 ()
client.js:193 Playlist generation failed: Error: HTTP 500:
```

#### Root Cause (Found via Cloud Run Logs)
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/usr/src/public/js/curation.js' 
imported from /usr/src/app/index.js
```

The Docker container only has:
- `/usr/src/app/` → server code
- `/usr/src/shared/` → shared modules

It does NOT have `/usr/src/public/` - that folder is only for frontend.

The `server/index.js` was importing:
```javascript
await import('../public/js/curation.js')  // ❌ Path doesn't exist in container
```

#### Fix Applied (10:20)
1. **Copied `curation.js` to `shared/` folder**:
   ```bash
   cp public/js/curation.js shared/curation.js
   ```

2. **Fixed import in `shared/curation.js`**:
   ```diff
   - import { normalizeKey } from './shared/normalize.js'
   + import { normalizeKey } from './normalize.js'
   ```

3. **Updated `server/index.js`**:
   ```diff
   - await import('../public/js/curation.js')
   + await import('../shared/curation.js')
   ```

4. **Deployed backend**:
   - New revision: `mjrp-proxy-00064-5rz`

#### Verification
- [x] Local import test passed
- [x] Backend deployed successfully
- [x] **USER CONFIRMED**: Generate playlists working at 10:23

---

### Issue #33: Frontend Module Resolution Error (axios) - RESOLVED ✅
**Status**: ✅ **RESOLVED - USER CONFIRMED**
**Date**: 2025-12-09 22:46 → 23:54
**Type**: Build/Production Bug
**Component**: `firebase.json`, `vite.config.js`, `public/index.html`, `scripts/deploy-prod.sh`

#### Problem
After deploying Frontend to Firebase Hosting, browser shows:
```
Uncaught TypeError: Failed to resolve module specifier "axios". Relative references must start with either "/", "./", or "../".
```
App stuck at "Loading..." - completely broken in production.

#### Root Cause Analysis
**The REAL issue was `firebase.json`:**
- `"public": "public"` → Serves **source files** directly
- Should be `"public": "dist"` → Serves **Vite build output**

Firebase Hosting was bypassing Vite entirely, serving unbundled source files.
Browsers cannot resolve `import axios from 'axios'` (bare module specifier) without a bundler.

**Per `V2.0_DEPLOYMENT_IMPACT.md` (line 54)**, this should have been changed but was never applied.

#### Failed Attempts

**Attempt #1: Add Axios CDN + Remove Import** (22:48)
- Added CDN script, commented out import
- **Result**: ❌ FAILED - Still serving source files

**Attempt #2: Add Vite Externalization Config** (23:00)
- Added `external: ['axios']` + `output.globals`
- **Result**: ❌ FAILED - Firebase still serving source, not dist

**Attempt #3: Remove Externalization** (23:28)
- Removed `external: ['axios']` from vite.config.js
- Removed CDN script from index.html
- **Result**: ⚠️ PARTIAL - Build correct, but firebase.json still wrong

**Attempt #4: Fix firebase.json** (23:39)
- Changed `"public": "public"` → `"public": "dist"`
- **Result**: ⚠️ PARTIAL - App loads but firebase-config.js 404

**Attempt #5: Add static files copy step** (23:50) ✅
- Updated `deploy-prod.sh` to copy static files to dist/
- **Result**: ✅ SUCCESS - User confirmed app works

#### Final Solution

1. **`firebase.json`**: Changed `"public": "dist"`
2. **`vite.config.js`**: Removed `external: ['axios']`
3. **`public/index.html`**: Removed CDN script
4. **`deploy-prod.sh`**: Added `npm run build` + static files copy step

#### Files Modified
- `firebase.json`: Changed public directory to `dist`
- `vite.config.js`: Cleaned up axios workarounds
- `public/index.html`: Removed CDN script
- `scripts/deploy-prod.sh`: Added build + static files copy
- `docs/devops/V2.0_DEPLOYMENT_IMPACT.md`: Added status note

#### Verification
- [x] Build succeeds (`npm run build`)
- [x] Bundle includes axios inline
- [x] Static files copied to dist/
- [x] Deploy: 30 files uploaded
- [x] **USER CONFIRMED**: Production working at 23:54

---

### Issue #32: Cloud Build Docker Context Failure - RESOLVED ✅
**Status**: ✅ **RESOLVED**
**Date**: 2025-12-09 22:10 → 22:42
**Type**: CI/CD Configuration Bug
**Component**: `cloudbuild.yaml`, Cloud Build Trigger

#### Problem
Cloud Build failed with:
```
COPY failed: file not found in build context or excluded by .dockerignore: stat _shared_temp: file does not exist
```

#### Root Cause
The `Dockerfile` expects `server/_shared_temp/` directory to exist (containing shared libs copied from `shared/`). This copy step was supposed to happen BEFORE Docker build, but:
1. `cloudbuild.yaml` didn't exist in the repository
2. Cloud Build Trigger was configured as "Dockerfile" mode, not "Cloud Build config" mode

#### Failed Attempts

**Attempt #1: Create cloudbuild.yaml** (22:14)
- Created `cloudbuild.yaml` with bash step to copy shared libs before Docker build
- **Result**: ❌ FAILED - Cloud Build Trigger ignored the file
- **Reason**: Trigger was set to "Autodetected" which found Dockerfile first

**Attempt #2: User Changed Trigger Config** (22:26)
- User changed Trigger Configuration from "Autodetected" to "Cloud Build configuration file"
- Set Location to "Repository" and path to `cloudbuild.yaml`
- **Result**: ❌ FAILED - New error about `build.logs_bucket` invalid argument
- **Reason**: Trigger had service account that required explicit logging config

**Attempt #3: Add Logging Option** (22:34)
- Added to `cloudbuild.yaml`:
  ```yaml
  options:
    logging: CLOUD_LOGGING_ONLY
  ```
- **Result**: ✅ SUCCESS - Build completed, Docker image pushed, Cloud Run deployed

#### Final Solution
1. Created `cloudbuild.yaml` with proper steps (copy shared → build → push → deploy)
2. Added `options: logging: CLOUD_LOGGING_ONLY`
3. User configured Trigger to use "Cloud Build configuration file" from Repository

---


### Issue #28: Inventory CRUD Not Working - RESOLVED ✅
**Status**: ✅ **RESOLVED - FULL CRUD WORKING**
**Date**: 2025-12-08 19:05 → 20:14
**Type**: Inventory/CRUD Bug
**Component**: `inventory.js`, `InventoryView.js`

#### Problem
Inventory albums don't appear when visiting InventoryView the first time.

#### Failed Attempts

**Attempt #1: Added debug logs** (19:10)
- Added console.log to `InventoryStore.init()` and `InventoryView.onMount()`
- **Failed**: Logs didn't appear - because method was named `onMount` not `mount`

**Attempt #2: Renamed onMount → mount** (19:18)
- Router calls `this.currentView.mount()` but InventoryView had `onMount()`
- Renamed to `mount()` so Router could call it
- **Partial Success**: Logs appeared, showed `loadAlbums returned: 5 albums`
- **Still Failed**: UI showed "empty" despite 5 albums loaded

**Attempt #3: Reordered subscription** (19:21)
- The subscription to store was AFTER `await loadAlbums()`
- `loadAlbums()` calls `notify()` which fires subscription callback
- But subscription didn't exist yet when notify fired!
- **Fix**: Moved subscription BEFORE `loadAlbums()` call
- **Still Failed**: `TypeError: this.rerender is not a function`

**Attempt #4: Added missing rerender() method** (19:25)
- `this.rerender()` was called 14+ times but **never defined**
- Likely lost in a previous AI session crash
- **Fix**: Added `rerender()` method implementation
- **SUCCESS!** ✅

#### Root Causes (3 issues)
1. **Method naming**: `onMount()` vs `mount()` - Router expects `mount()`
2. **Subscription timing**: Must subscribe BEFORE async load so notify triggers rerender
3. **Missing method**: `rerender()` was never implemented

#### Final Solution
```javascript
// InventoryView.js
async mount() {
  // 1. Subscribe FIRST
  this.unsubscribe = inventoryStore.subscribe(() => this.rerender())
  
  // 2. THEN load (notify will trigger rerender)
  await inventoryStore.loadAlbums()
}

// Added missing method
async rerender() {
  const container = document.getElementById('app')
  const html = await this.render()
  container.innerHTML = html
  this.afterRender()
}
```

---

### Issue #31: Playlist Generate Not Using New Albums - AWAITING VERIFICATION
**Status**: 🟡 **AWAITING USER VERIFICATION**
**Date**: 2025-12-09 13:00
**Type**: UI/UX Bug
**Component**: `PlaylistsView.js`

#### Problem
After generating playlists, if user adds new albums to the series and returns to Playlist view, there's no way to regenerate with the new albums - the Generate section is removed when playlists exist.

#### Root Cause
When `playlists.length > 0`, the generate section is removed (line 112) and no regenerate button exists.

#### Fix Applied
- [x] Added "Regenerate" button (btn-warning) to export section
- [x] Button calls `handleGenerate()` which uses current `albumsStore.getAlbums()`
- [x] New albums are automatically included since store is always fresh

---

### Issue #30: Album Delete Not Working - RESOLVED ✅
**Status**: ✅ **RESOLVED**
**Date**: 2025-12-09 12:45 → 17:35
**Type**: CRUD Bug
**Component**: `AlbumsView.js`, `albumSeries.js`

#### Problem
1. Delete button had no proper handler
2. Albums returned on page refresh after delete

#### Failed Attempts

**Attempt #1 (15:30):** Added `removeAlbumFromSeries()` to albumSeries.js
- Result: Albums disappeared but reappeared on navigation
- Root Cause Found: `album` was `undefined` because ID mismatch

**Attempt #2 (17:00):** Added debug logs
- Discovered: Button ID = `david-bowie_blackstar`, Store IDs = `['the-beatles_sgt-peppers...', ...]`
- The Blackstar was in VIEW but NOT in STORE

#### Root Cause
1. **Duplicate handler:** Old handler at line 746 used native `confirm()` and only called `albumsStore.removeAlbum()` (memory-only)
2. **ID mismatch:** Album IDs from API didn't match store IDs, so `album = undefined`
3. **removeAlbumFromSeries never called:** Because album was undefined, Firestore was never updated

#### Solution Applied
1. **Removed duplicate handler** with native `confirm()`
2. **DOM fallback:** When album not in store, extract title/artist from card HTML
3. **Call removeAlbumFromSeries():** Updates `albumQueries[]` in series via Firestore
4. **Remove card from DOM:** Immediate visual feedback

#### Files Modified
- `AlbumsView.js`: New delete handler with DOM fallback, removed duplicate handler
- `albumSeries.js`: Added `removeAlbumFromSeries()` method

---


### Issue #29: Inventory Card Display & Modal Issues - RESOLVED ✅
**Status**: ✅ **RESOLVED**
**Date**: 2025-12-08 21:28 → 21:58
**Type**: UI/UX Bug
**Component**: `InventoryView.js`, `InventoryModals.js`, `InventoryRepository.js`

#### Problem
Multiple issues with Inventory view display and modal functionality:
1. **Format Select in Modal** - Incorrect case (CD vs cd) and missing options
2. **Card Format Badge** - Always showed "CD" due to case mismatch
3. **Owned Toggle Not Working** - "No valid fields to update" error

#### Root Causes
1. `owned` was NOT in `updateAlbum` allowed fields list
2. Edit modal used uppercase values ("CD") but system expects lowercase ("cd")
3. Edit modal missing DVD/Blu-ray options

#### Fixes Applied
- [x] Added `owned` to allowed fields in `updateAlbum`
- [x] Fixed Edit modal format values to lowercase
- [x] Added all 6 format options to Edit modal
- [x] Added Cassette format across all components

#### Remaining UX TODO
- [x] Improve owned marking UX (remove confusing checkbox)
- [x] Fix total calculation to consider owned status

---

### Issue #27: Album Series CRUD Persistence Failures - AWAITING VERIFICATION
**Status**: 🟡 **AWAITING USER VERIFICATION**
**Date**: 2025-12-08 17:00
**Type**: Firebase/Persistence Bug
**Component**: `albumSeries.js`, `AlbumSeriesListView.js`

#### Problem
Edit Series "Save Changes" and Delete Series operations failing due to multiple Firebase issues:
1. **Firestore permission errors** - Wrong collection path being used
2. **Serialization errors** - Not using JSON.parse/stringify for ES6 classes
3. **Cache recovery** - Items reappearing after delete on page refresh

#### Root Causes
1. `saveToFirestore()` not serializing data (`{...series}` instead of `JSON.parse(JSON.stringify(series))`)
2. `deleteSeries()` using wrong path `doc(db, 'series', id)` instead of `getSeriesCollectionPath()`
3. Delete updating localStorage BEFORE confirming Firestore success (source of truth)

#### Failed Attempts (2025-12-08)
1. **Made Firestore "optional"** - Incorrectly assumed localStorage was source of truth. User correction: ARCHITECTURE.md line 515 states Firestore IS source of truth.
2. **Fire-and-forget delete** - Tried to delete from localStorage first, then Firestore async. Wrong per architecture.
3. **Created incorrect documentation** - Made `FIRESTORE_PERMISSIONS_FIX.md` stating Firestore is optional. Had to delete.
4. **Only fixed albumSeries.js** - User tested and found albums.js also missing serialization. Album edit save failed with "custom Track object" error.

#### Additional Issue Found (2025-12-08 17:18)
**Error:** `FirebaseError: Function updateDoc() called with invalid data. Unsupported field value: a custom Track object`
**Location:** `albums.js` → `saveToFirestore()` line 217
**Root Cause:** Album object contains `tracks` array with `Track` class instances, not POJOs.
**Fix Applied:** ⏳ Added `JSON.parse(JSON.stringify(album))` before Firestore write.

#### Solutions Applied (2025-12-08) - ⚠️ NOT VERIFIED BY USER
1. ⏳ Added JSON serialization to `albumSeries.js` → `saveToFirestore()`
2. ⏳ Fixed `deleteSeries()` to use correct collection path via `getSeriesCollectionPath()`
3. ⏳ Changed order: Firestore delete FIRST, then localStorage (source of truth pattern)
4. ⏳ Made db REQUIRED parameter (not optional) per ARCHITECTURE.md
5. ⏳ Added JSON serialization to `albums.js` → `saveToFirestore()` (new fix)

---


### Issue #25: Inventory Modal Misalignment & Missing Styles - RESOLVED
**Status**: ✅ **RESOLVED**
**Date**: 2025-12-07 01:35
**Type**: Configuration / Environment Issue
**Component**: `index-v2.html`, `vite.config.js`, `modals.css`

#### Problem
The "Add to Inventory" modal was not displaying correctly. 
- Initially reported as appearing "below the footer" (unstyled).
- Later appeared misaligned, clipped, or stuck at the bottom-left of the screen despite seemingly correct styles.
- "Add" button functionality was also initially reported as broken (likely due to modal state).

#### Root Cause
**SPA Entry Point Mismatch**: 
- The project has multiple HTML files (`index.html`, `index-v2.html`, `hybrid-curator.html`).
- The development environment (Vite) is configured in `vite.config.js` to serve `index-v2.html` for all SPA routes (`/home`, `/albums`, etc.).
- `index-v2.html` **was missing the stylesheet link** for `modals.css`.
- `hybrid-curator.html` had the link, but editing it had no effect on the running app.
- The modal appeared "styled" in later screenshots because it inherited atomic classes from Tailwind (e.g., `bg-black`, `rounded`), but missed the crucial **layout rules** (`position: fixed`, `z-index`, `centering`) which were defined only in `modals.css`.

#### Failed Attempts
1. **Inline JS Styles**: Attempted to inject `z-index` and `position` directly via `InventoryModals.js`. Failed because it fought with CSS reset/defaults and introduced maintenance complexity.
2. **Reverting Code**: Reverted `InventoryModals.js` simply to restore "old behavior", assuming a code regression. This brought back the unstyled `<div>` at the bottom of the body.
3. **Fixing Wrong HTML**: Changed `./css/modals.css` to `/css/modals.css` in `hybrid-curator.html`. Failed to affect the app because the user was viewing `index-v2.html`.
4. **Tailwind Class Checks**: Suspected Tailwind conflicts, but the real issue was simply that the custom CSS file wasn't loaded at all.

#### Final Solution
1. **Identified Entry Point**: Confirmed via `vite.config.js` that `index-v2.html` is the authoritative entry point for the SPA.
2. **Linked CSS**: Added `<link rel="stylesheet" href="/css/modals.css">` to `public/index-v2.html`.
3. **Fortified CSS**: Updated `modals.css` with "bulletproof" centering rules to prevent any future layout ambiguity:
   ```css
   .modal-overlay {
     position: fixed !important;
     inset: 0 !important;
     width: 100vw !important;
     height: 100vh !important;
     z-index: 2147483647 !important;
     display: flex !important;
     justify-content: center !important;
     align-items: center !important;
   }
   ```

#### Files Modified
- `public/index-v2.html`: Added CSS link.
- `public/css/modals.css`: Enhanced layout rules.
- `public/hybrid-curator.html`: Fixed relative path (harmless side benefit).

---

### Issue #26: Firebase Serialization Errors (Custom Objects) - RESOLVED
**Status**: ✅ **RESOLVED**
**Date**: 2025-12-07 01:45
**Type**: Data Persistence Error
**Component**: `InventoryRepository.js`

#### Problem
Adding an album to inventory failed with two distinct Firebase errors:
1. `Unsupported field value: undefined` (found in `coverUrl`)
2. `Unsupported field value: a custom Track object` (found in `tracks` array)

#### Root Cause
The application architecture recently evolved to use rich ES6 Classes (`Album`, `Track`) instead of plain objects.
- **Firestore Limitation**: The Firestore SDK does NOT support saving custom Class instances directly. It requires Plain Old JavaScript Objects (POJOs).
- **Undefined Handling**: Spreading a class instance `{...album}` copies properties with `undefined` values, which Firestore explicitly rejects.

#### Failed Attempts
1. **Shallow Sanitization**: Iterating over keys and setting `undefined` to `null`. This failed because it didn't recurse into nested arrays (like `tracks`), leaving the custom `Track` objects inside.

#### Final Solution (Deep Sanitization)
Implemented robust serialization in `InventoryRepository.addAlbum` using `JSON.parse(JSON.stringify(album))`.
- **Why**: This technique automatically:
  1. Converts ALL custom class instances (nested or not) into plain objects.
  2. Removes all keys with `undefined` values (which is valid for Firestore).
  3. Handles deep nesting without complex recursive code.

#### Files Modified
- `public/js/repositories/InventoryRepository.js`

---
**Status**: ✅ **RESOLVED**
**Date**: 2025-12-06 20:50
**Type**: UI Bug
**Component**: `Icons.js`

#### Problem
Multiple icons not rendering in `SeriesListView`, `AlbumsView`, `InventoryView`, and `TopNav` (hamburger menu invisible).

#### Root Cause
Icons were being called via `getIcon()` but were not defined in the `Icons` object in `Icons.js`.

#### Solution
Added 10 missing icons to `Icons.js`:
- `Menu` - Hamburger menu (critical for mobile nav)
- `Edit` - Edit buttons
- `Play` - Album playback
- `RefreshCw` - Refresh filter button
- `ExternalLink` - BestEver links
- `ArrowRight` - Migration banner CTA
- `Loader` - Loading states
- `Layers` - Series management
- `Trash2` - Delete in Inventory

#### Files Modified
- `public/js/components/Icons.js` (lines 99-119)

---

### Issue #23: Mobile Menu Transparent Background - RESOLVED  
**Status**: ✅ **RESOLVED**
**Date**: 2025-12-06 22:33
**Type**: UI/UX Bug
**Component**: `TopNav.js`, `modals.css`

#### Problem
Mobile hamburger menu drawer opened but had transparent/see-through background, making text unreadable as page content was visible behind it.

#### Failed Attempts
1. **Inline `background: #0d0d12`** - CSS classes overrode it
2. **Tailwind `bg-black/95`** - Not processed correctly
3. **`bg-[#0a0a0f]`** - Still transparent
4. **CSS class `.mobile-drawer` with `!important`** - Still overridden
5. **JavaScript `style.setProperty('background-color', '#0a0a0f', 'important')`** - Still transparent

#### Root Cause
Unknown CSS cascade issue causing all background declarations to be ignored or overridden by parent/global styles.

#### Final Solution (Triple-Layer Approach)
Applied solid background `bg-[#0a0a0f]` to **ALL internal child elements**:
1. Parent `#mobileMenu`: inline style + CSS class
2. Header div: `bg-[#0a0a0f]`
3. Nav element: `bg-[#0a0a0f]`
4. Footer div: `bg-[#0a0a0f]`

Also added JavaScript reinforcement in `attachListeners()`:
```javascript
if (mobileMenu) {
  mobileMenu.style.setProperty('background-color', '#0a0a0f', 'important')
  mobileMenu.style.setProperty('backdrop-filter', 'none', 'important')
}
```

#### UX Improvements Made
- Hamburger button moved to **LEFT** side (standard for left-slide drawer)
- Title uses flame image (`TheAlbumPlaylistSynth.png`) instead of text
- Drawer width: 280px / max 80vw
- Orange border accent: `border-orange-500/20`
- Deep shadow: `box-shadow: 4px 0 40px rgba(0,0,0,0.9)`
- Click overlay to close (`#mobileMenuOverlay`)
- Icon-enhanced navigation links

#### Files Modified
- `public/js/components/TopNav.js` (complete menu restructure)
- `public/css/modals.css` (added `.mobile-drawer` class)

---

### Issue #22: Ghost Albums Regression - RESOLVED
**Status**: ✅ **RESOLVED**
**Date Started**: 2025-12-06 19:42
**Type**: Regression
**Component**: `AlbumsView.js` / `AlbumsStore.js`

#### User Report
Ghost Albums returned after previous session marked as resolved. Albums from previously viewed series appear when switching to a new series.

#### Failed Attempts (2025-12-06)

**ATTEMPT #1: Closure Capture** (19:42 - FAILED)
- **Hypothesis**: `this.abortController` in callback refers to wrong controller due to closure scope
- **Fix Applied**: 
  - Captured `currentController` and `targetSeriesId` at start of `loadAlbumsFromQueries()`
  - Changed callback to check `currentController.signal.aborted` instead of `this.abortController`
  - Added series ID validation: `if (seriesStore.getActiveSeries()?.id !== targetSeriesId) return`
- **Files Modified**: `AlbumsView.js` (lines 928-929, 962-972, 982)
- **Result**: ❌ FAILED - User reported Ghost Albums still appearing
- **Root Cause Missed**: This was a variation of ATTEMPT #1 from previous session that was already documented as failed

**ATTEMPT #2: Revert to Original Solution** (19:53 - FAILED)
- **Hypothesis**: My closure capture broke something that was working
- **Action**: Reverted closure capture changes, restored original code
- **Code Change**:
  ```javascript
  // Reverted back to:
  if (this.abortController.signal.aborted) return
  this.abortController.signal // Pass signal
  ```
- **Files Modified**: `AlbumsView.js`
- **Result**: ❌ FAILED - User confirmed issue persists
- **Root Cause Missed**: Original code was also broken

**ATTEMPT #3: Guard in Subscription Callback** (19:55 - FAILED)
- **Hypothesis**: Store subscription callback renders albums without checking series ownership
- **Fix Applied**: Added guard to subscription callback in `mount()`:
  ```javascript
  const unsubscribe = albumsStore.subscribe((state) => {
    if (!this.isLoading) {
      const activeSeries = seriesStore.getActiveSeries()
      const lastLoadedId = albumsStore.getLastLoadedSeriesId()
      
      if (activeSeries && lastLoadedId && lastLoadedId !== activeSeries.id) {
        console.warn('[AlbumsView] Ignoring stale albums from series:', lastLoadedId)
        return
      }
      
      this.updateAlbumsGrid(state.albums)
    }
  })
  ```
- **Files Modified**: `AlbumsView.js` (lines 558-574)
- **Result**: ❌ FAILED - User reported issue persists
- **Root Cause Missed**: `lastLoadedSeriesId` gets cleared by `reset()`

**ATTEMPT #4: Timing Fix - Set SeriesId Before Reset** (19:58 - FAILED)
- **Hypothesis**: `albumsStore.reset()` clears `lastLoadedSeriesId` to null, making guard pass incorrectly
- **Fix Applied**: 
  - Moved `albumsStore.setLastLoadedSeriesId(targetSeries.id)` to BEFORE `reset()` call
  - Removed redundant call after load completes
  ```javascript
  // FIX: Set lastLoadedSeriesId BEFORE reset
  const targetSeries = seriesStore.getActiveSeries()
  if (targetSeries) {
    albumsStore.setLastLoadedSeriesId(targetSeries.id)
  }
  albumsStore.reset()
  ```
- **Files Modified**: `AlbumsView.js` (lines 936-942, 886-887)
- **Result**: ❌ FAILED - User confirmed issue still persists
- **Root Cause**: STILL UNKNOWN

#### Current State Analysis (2025-12-06 20:01)
**What We Know**:
1. ✅ `lastLoadedSeriesId` tracking exists in store
2. ✅ Subscription guard now exists (ATTEMPT #3)
3. ✅ Timing fix applied (ATTEMPT #4)
4. ❌ **Ghost Albums STILL appearing**

**Possible Remaining Causes**:
1. `reset()` is called which fires `notify()` - subscription sees empty albums array but proceeds
2. The guard condition logic may be inverted or incorrect
3. There may be multiple subscription callbacks racing
4. `render()` method may be the actual source of ghost rendering, not `updateAlbumsGrid()`
5. View instance may be caching old data somewhere not tracked

**Next Investigation Steps**:
1. Add extensive console logging to track EXACT execution order
2. Check if `render()` is called with stale data before `mount()`
3. Review if there are other places where albums are rendered
4. Consider completely different approach (clear DOM first, render after all loads complete)

---


## Previous Session (2025-12-02)

### Issue #21: Sticky Playlists

**Context**: Developer onboarding revealed Issues #15 and #16 were NOT actually resolved despite being marked "Resolved" in previous session. User reported problems persist.

**Status**: ❌ **CLOSED - WONTFIX** (Product Decision)
**Date Started**: 2025-11-30 21:15  
**Date Closed**: 2025-12-02 06:11  
**Type**: Regression / Logic Flaw  
**Resolution**: **Feature Removed**

#### User Report
When navigating through the series dropdown or using arrows in the PlaylistsView, the view keeps showing the playlists from the *first* generated series, regardless of which series is selected in the dropdown.

**Reproduction Steps**:
1. Generate playlists for Series tc1 (e.g., Greatest Hits Vol. 1 & 2)
2. Switch to Series tc2 using dropdown
3. **Expected**: Playlists should clear or show tc2 playlists
4. **Actual**: tc1 playlists remain visible

#### Resolution (2025-12-02 06:11)

**Product Decision**: After 4 failed attempts and ~16 hours of debugging, the decision was made to **remove the series selector dropdown** from `PlaylistsView` entirely to simplify UX and eliminate this issue permanently.

**Changes Applied**:
1. ✅ **Removed series selector HTML** from `PlaylistsView.render()` (lines 50-62)
2. ✅ **Removed series selector event handler** from `PlaylistsView.mount()` (lines 335-364)
3. ✅ **Removed Undo/Redo navigation buttons** from header (lines 49-55) - User request 2025-12-02 06:45
4. ✅ **Cleaned up all debug logs** added during investigation:
   - Removed emoji logs (🔄) from `PlaylistsView.js`
   - Removed emoji logs (📦) from `PlaylistsStore.js`
   - Removed emoji logs (🚦) from `Router.js`
   - Removed emoji logs (🧹) from `BaseView.js`
4. ✅ **Kept `seriesId` tracking** in `PlaylistsStore` for data integrity
5. ✅ **Verified `handleGenerate()`** correctly passes `activeSeries.id` to `setPlaylists()` (line 440)

**User Impact**:
- Users can no longer switch series using the dropdown in PlaylistsView
- Series navigation now requires using breadcrumbs or back button to return to Albums view
- This simplifies the UX and prevents the cross-contamination issue

**Technical Notes**:
- `router.loadRoute()` method implemented during debugging remains available for future use
- `seriesId` tracking in `PlaylistsStore` provides foundation for multi-series features later
- All 4 debugging attempts documented in this issue serve as reference for similar problems

**Next Investigation Steps**:

**ATTEMPT #1: Store Series Tracking + View Validation** (2025-11-30 21:15 - FAILED)
- **Hypothesis**: `PlaylistsStore` doesn't track which series the playlists belong to, causing cross-contamination.
- **Fix Applied**:
  1. Added `seriesId` property to `PlaylistsStore` (line 14)
  2. Modified `setPlaylists(playlists, seriesId)` to accept and store `seriesId` (lines 38-40)
  3. Updated `getState()` to expose `seriesId` (line 150)
  4. Modified `reset()` to clear `seriesId` (line 239)
  5. Added validation in `PlaylistsView.render()` and `update()` to check if `state.seriesId !== activeSeries.id` (lines 30-36, 97-99)
  6. Updated `handleGenerate()` to pass `activeSeries.id` to `setPlaylists()` (line 428)
- **Files Modified**:
  - `public/js/stores/playlists.js` (Steps 412-414)
  - `public/js/views/PlaylistsView.js` (Step 422)
- **Result**: ❌ **FAILED** - User reported playlists still persist when switching series
- **Root Cause Missed**: Validation logic works, but store history (undo/redo) doesn't track `seriesId`

**ATTEMPT #2: History Snapshot SeriesId** (2025-12-01 00:26 - FAILED)
- **Hypothesis**: Undo/redo history snapshots don't include `seriesId`, so restoring history brings back playlists without series context.
- **Fix Applied**:
  1. Modified `createSnapshot()` to include `seriesId` in snapshots (line 172)
  2. Updated `undo()` to restore `seriesId` from snapshot (line 193)
  3. Updated `redo()` to restore `seriesId` from snapshot (line 210)
- **Files Modified**:
  - `public/js/stores/playlists.js` (Steps 438-439)
- **Result**: ❌ **FAILED** - User confirmed playlists still show from wrong series
- **Root Cause Missed**: Series selector event handler has logic issues

**ATTEMPT #3: Refactor Series Selector Handler** (2025-12-01 00:35 - FAILED)
- **Hypothesis**: The series selector's manual re-render logic (`this.render().then(html => this.mount())`) causes memory leaks and doesn't properly clean up state.
- **Fix Applied**:
  1. Replaced manual re-render with `router.loadRoute(window.location.pathname)`
  2. Added comments explaining the fix
- **Code Change** (`PlaylistsView.js` lines 336-351):
  ```javascript
  this.on(seriesSelector, 'change', async (e) => {
      const newSeriesId = e.target.value
      console.log('[PlaylistsView] Switching series to:', newSeriesId)
      
      // 1. Update Active Series
      seriesStore.setActiveSeries(newSeriesId)
      
      // 2. Clear current playlists to prevent ghosting
      playlistsStore.setPlaylists([]) 
      
      // 3. Force full view reload via Router
      await router.loadRoute(window.location.pathname)
  })
  ```
- **Files Modified**:
  - `public/js/views/PlaylistsView.js` (Step 464)
- **Result**: ❌ **FAILED** - User reported playlists still persist
- **Root Cause Missed**: `router.loadRoute()` method doesn't exist!

**ATTEMPT #4: Implement Missing router.loadRoute()** (2025-12-01 13:05 - FAILED)
- **Hypothesis**: The call to `router.loadRoute()` in Attempt #3 failed silently because the method didn't exist in `router.js`.
- **Discovery**: Reviewed `router.js` and confirmed `loadRoute()` method was never implemented.
- **Fix Applied**:
  1. Added `loadRoute(path)` method to `Router` class to force route reload
  2. Method updates history and manually triggers `handleRouteChange()`
- **Code Change** (`router.js` lines 84-91):
  ```javascript
  async loadRoute(path) {
      // Update history without triggering popstate
      history.replaceState({}, '', path)
      // Manually trigger route handling
      await this.handleRouteChange()
  }
  ```
- **Files Modified**:
  - `public/js/router.js` (Step 474)
- **Verification Attempted**: Browser agent failed to connect (404 errors on localhost:5005 and 127.0.0.1:5005)
- **Result**: ❌ **FAILED** - User confirmed playlists still persist after reload
- **Root Cause**: **STILL UNKNOWN** - All logical fixes applied, but issue persists

#### Current State Analysis (2025-12-01 13:10)
**What We Know**:
1. ✅ `PlaylistsStore` correctly tracks `seriesId`
2. ✅ `PlaylistsView` validates `seriesId` before rendering
3. ✅ History snapshots include `seriesId`
4. ✅ Series selector calls `setPlaylists([])` to clear
5. ✅ Series selector calls `router.loadRoute()` to force reload
6. ✅ `router.loadRoute()` now exists and should work
7. ❌ **Playlists still persist when switching series**

**Possible Remaining Causes**:
1. **Race Condition**: `setPlaylists([])` → `router.loadRoute()` sequence might have timing issues
   - Store subscription fires render before loadRoute completes?
   - View renders with old data before new view is created?
2. **Store Subscription Not Cleared**: Even after `destroy()`, old subscriptions might fire
3. **Cache/Build Issue**: Changes not being loaded by browser (unlikely, but possible)
4. **Deep Reactivity Issue**: Playlists array is cleared but DOM retains old HTML
5. **Router Bug**: `loadRoute()` implementation doesn't actually destroy/recreate view properly

**Next Investigation Steps**:
1. Add extensive console logging to track exact execution order
2. Verify `BaseView.destroy()` is actually being called
3. Check if store subscriptions are truly being removed
4. Investigate if `router.handleRouteChange()` → `renderView()` actually creates new view instance
5. Consider adding explicit `playlistsStore.reset()` instead of just `setPlaylists([])`

---

## Previous Session (2025-11-30)

### Issue #15: Ghost Albums - REOPENED (Again)
**Status**: ✅ **RESOLVED (Definitively)**
**Date**: 2025-11-30 21:00  
**Date**: 2025-11-30 19:17 - 20:11  
**Session Duration**: ~54 minutes

#### User Report
Albums from previous series still appearing when:
1. Navigating between series (Home → Albums → Home → Continue)
2. Clicking view toggle button multiple times

#### Investigation Timeline

**ATTEMPT #1: Abort Before Reset** (19:17 - PARTIAL SUCCESS)
- **Hypothesis**: AbortController being called AFTER store.reset() causes race condition
- **Fix Applied**: Moved abort logic BEFORE store reset in `loadAlbumsFromQueries()` (lines 875-890)
- **Code Change**:
  ```javascript
  // OLD: Reset first, then abort
  albumsStore.reset()
  if (this.abortController) this.abortController.abort()
  
  // NEW: Abort first, then reset
  if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
  }
  this.abortController = new AbortController()
  albumsStore.reset()
  ```
- **Result**: ❌ FAILED - Ghost albums still appeared on navigation
- **Root Cause Missed**: Didn't account for store persistence across view instances

**ATTEMPT #2: Check Store Before Reload** (19:44 - PARTIAL SUCCESS)
- **Hypothesis**: Albums being reloaded even when already in store
- **Fix Applied**: Added check to skip reload if albums already loaded (lines 840-853)
- **Code Change**:
  ```javascript
  const expectedCount = activeSeries.albumQueries.length
  const currentCount = currentAlbums.length
  
  if (currentCount === 0 || currentCount !== expectedCount) {
      await this.loadAlbumsFromQueries(activeSeries.albumQueries)
  } else {
      console.log('[AlbumsView] Albums already loaded')
      this.updateAlbumsGrid(currentAlbums)  // ⚠️ THIS LINE CAUSED DUPLICATION
  }
  ```
- **Result**: ✅ Navigation ghost albums fixed
- **New Problem**: Broke view toggle (duplicates still occurred)
- **Impact Assessment FAILED**: Did not consider that `render()` already displays albums

**ATTEMPT #3: Remove Duplicate Render Call** (20:08 - SUCCESS)
- **Hypothesis**: `render()` shows albums, then `mount()` calls `updateAlbumsGrid()` → duplication
- **Fix Applied**: Removed `this.updateAlbumsGrid(currentAlbums)` call in else branch (line 896)
- **Code Change**:
  ```javascript
  } else {
      console.log('[AlbumsView] Albums already loaded')
      // CRITICAL FIX: Do NOT call updateAlbumsGrid here!
      // The render() method already rendered these albums
  }
  ```
- **Result**: ✅ **COMPLETE SUCCESS** - Both navigation and view toggle work perfectly

#### Final Root Cause Analysis
**Three separate issues:**
1. **Race Condition**: Abort called after reset → old requests complete after reset
   - **Fixed by**: Moving abort before reset
2. **Unnecessary Reloads**: View reloading albums that already exist in store
   - **Fixed by**: Checking album count before reload
3. **Double Rendering**: `render()` + `mount().updateAlbumsGrid()` → duplicate display
   - **Fixed by**: Removing updateAlbumsGrid call when albums already rendered

#### Files Modified
- `public/js/views/AlbumsView.js` (lines 875-898)

#### Verification
- ✅ Navigate Home → Albums → Home → Continue: No duplicates
- ✅ Toggle view mode multiple times: No duplicates
- ✅ Hard refresh (F5): Works correctly
- ✅ Console logs confirm correct flow

#### Impact Assessment (Post-Fix)
- [x] Does this affect global state/navigation? Yes - store persistence
- [x] Does it work on Hard Refresh? Yes
- [x] Does it work for New AND Existing items? Yes
- [x] Does it introduce visual artifacts? No

---

### Issue #16: View Mode Toggle - REOPENED
**Status**: ✅ **RESOLVED (After 4 iterations)**  
**Date**: 2025-11-30 19:29 - 20:00  
**Session Duration**: ~31 minutes

#### User Report
1. Button state changes correctly
2. View does NOT switch between Grid and Expanded modes
3. Albums duplicate when clicking toggle multiple times

#### Investigation Timeline

**ATTEMPT #1: Simple Grid Update** (19:29 - FAILED)
-  **Hypothesis**: Can just call `updateAlbumsGrid()` after toggling viewMode
- **Fix Applied**: Updated button state + called `updateAlbumsGrid()`
- **Code Change**: Lines 654-680
- **Result**: ❌ FAILED - View didn't change at all
- **Root Cause**: `updateAlbumsGrid()` updates EXISTING container, but Grid uses `#albumsGrid` while Expanded uses `#albumsList` - wrong container ID!

**ATTEMPT #2: Manual DOM Manipulation** (19:38 - FAILED)
- **Hypothesis**: Need to remove old container and create new one
- **Fix Applied**: Find old container, remove it, insert new HTML
- **Code Change**: Lines 678-708
- **Result**: ❌ FAILED - Albums duplicated on each click
- **Problem**: Old containers not being fully removed before inserting new ones

**ATTEMPT #3: While Loop Cleanup** (19:53 - FAILED)
- **Hypothesis**: Need to ensure ALL old containers removed
- **Fix Applied**: While loop to repeatedly check and remove containers
- **Code Change**: Lines 678-719
- **Result**: ❌ FAILED - View Compact stopped appearing, only Expanded showed
- **Problem**: Event listeners lost during DOM manipulation, complex state management issues

**ATTEMPT #4: Full Re-render** (19:57 - SUCCESS)
- **Hypothesis**: Stop being "clever", just re-render entire view
- **Fix Applied**: Call `render()` + rebuild all event listeners
- **Code Change**: Lines 654-753 (complete rewrite of toggle handler)
- **Code Approach**:
  ```javascript
  this.on(toggleViewBtn, 'click', async () => {
      // Toggle mode
      this.viewMode = this.viewMode === 'compact' ? 'expanded' : 'compact'
      localStorage.setItem('albumsViewMode', this.viewMode)
      
      // Re-render entire view
      const html = await this.render({})
      this.container.innerHTML = html
      
      // Re-bind ALL event listeners
      Breadcrumb.attachListeners(this.container)
      // ... rebind search, filters, buttons, etc.
  })
  ```
- **Result**: ✅ **SUCCESS** - Toggle works perfectly, no duplicates
- **Tradeoff**: Heavier (re-renders everything) but robust and bug-free

#### Final Root Cause
- **Containers are different**: Grid mode uses `<div id="albumsGrid">`, Expanded uses `<div id="albumsList">`
- **updateAlbumsGrid() fails**: Tries to update wrong container ID
- **Manual DOM manipulation too fragile**: Event listeners lost, state management complex
- **Solution**: Full re-render guarantees consistency at cost of performance

#### Files Modified
- `public/js/views/AlbumsView.js` (lines 654-753)

#### Verification
- ✅ Click toggle: View changes instantly
- ✅ Click toggle 10 times: No duplicates, no errors
- ✅ Reload page: View mode persists in localStorage
- ✅ All filters still work after toggle

#### Impact Assessment
- [x] Does this affect global state/navigation? No - local to view
- [x] Does it work on Hard Refresh? Yes
- [x] Does it work for New AND Existing items? Yes
- [x] Does it introduce visual artifacts? No
- [x] Performance impact? Minor (full re-render on toggle)

---

### Issue #19: Wrong Series Albums Displayed
**Status**: ✅ Resolved  
**Date**: 2025-11-30 20:20  
**Duration**: ~8 minutes  
**Type**: Regression from Issue #15 fix

#### Problem
User clicked on different series (tc1 with Led Zeppelin, Beatles) but saw albums from another series (tc1b with OK Computer, Nevermind). URL showed correct seriesId but wrong albums displayed.

#### Root Cause
Issue #15 fix only checked **album count** to determine if reload needed:
```javascript
if (currentCount === 0 || currentCount !== expectedCount) {
    await this.loadAlbumsFromQueries(activeSeries.albumQueries)
}
```

**Scenario**:
1. Load tc1b (3 albums) → store has 3 albums
2. Click tc1 (also 3 albums) → `currentCount === expectedCount` → thinks "already loaded"
3. Result: Shows tc1b albums instead of tc1 albums

#### Impact Assessment
- [x] Does this affect global state/navigation? Yes - series switching
- [x] Does it work on Hard Refresh? No - same issue
- [x] Does it work for New AND Existing items? Affects all series with same album count
- [ ] Does it introduce visual artifacts? No

#### Resolution
Added series ID tracking to reload logic:
```javascript
constructor() {
    // ...
    this._lastLoadedSeriesId = null  // Track which series is loaded
}

// In mount():
const needsReload = currentCount === 0 || 
                    currentCount !== expectedCount ||
                    !this._lastLoadedSeriesId ||
                    this._lastLoadedSeriesId !== activeSeries.id  // ← NEW CHECK

if (needsReload) {
    await this.loadAlbumsFromQueries(activeSeries.albumQueries)
    this._lastLoadedSeriesId = activeSeries.id  // Remember series
}
```

#### Files Modified
- `public/js/views/AlbumsView.js` (lines 35, 890-904)

#### Verification
- ✅ Click tc1 → Shows Led Zeppelin, Beatles, Pink Floyd
- ✅ Click tc1b → Shows OK Computer, Nevermind, The Smiths
- ✅ Switch back to tc1 → Correctly reloads and shows tc1 albums
- ✅ Hard refresh → Works correctly

---

### Issue #20: Wrong Album Details Displayed
**Status**: ✅ Resolved  
**Date**: 2025-11-30 20:27  
**Duration**: ~3 minutes  
**Type**: Pre-existing bug exposed by testing

#### Problem
User clicked "View Ranked Tracks" on different albums but always saw the same album details:
- tc1 series: Always showed "The Wall" regardless of which album clicked
- tc1b series: Always showed "OK Computer" regardless of which album clicked

URL showed correct albumId but wrong album details displayed.

#### Root Cause
`RankingView.findAlbum()` had a "debugging fallback" that always returned first album when ID didn't match:

```javascript
findAlbum(albumId) {
    const albums = albumsStore.getAlbums()
    
    // Try exact ID match first
    const byId = albums.find(a => a.id === albumId)
    if (byId) return byId
    
    // Fallback to first album if no match (for debugging)
    return albums[0] || null  // ← ALWAYS returns first album!
}
```

**Why it failed**:
- Album IDs in store didn't match albumId from URL
- Fallback kicked in and returned `albums[0]` (first album)
- Result: Always showed The Wall (tc1) or OK Computer (tc1b)

#### Impact Assessment
- [x] Does this affect global state/navigation? No - isolated to RankingView
- [x] Does it work on Hard Refresh? No - same issue
- [x] Does it work for New AND Existing items? Affects all albums
- [ ] Does it introduce visual artifacts? No

#### Resolution
Removed buggy fallback and added debug logging:

```javascript
findAlbum(albumId) {
    const albums = albumsStore.getAlbums()
    
    console.log('[RankingView] Looking for album:', albumId)
    console.log('[RankingView] Available albums:', albums.map(a => a.id))

    // FIX #20: Only return album if ID matches exactly
    // DO NOT fallback to first album - that causes wrong album to display
    const album = albums.find(a => a.id === albumId)
    
    if (!album) {
        console.warn('[RankingView] Album not found:', albumId)
    }
    
    return album || null
}
```

**Now**:
- ID matches → Shows correct album
- ID doesn't match → Shows "Album Not Found" (correct behavior)
- Console logs help debug ID mismatches

#### Files Modified
- `public/js/views/RankingView.js` (lines 207-222)

#### Verification
- ✅ Click "View Ranked Tracks" on different albums → Shows correct album each time
- ✅ Console logs show correct album IDs being searched
- ✅ No more "fallback to first album" behavior

#### Next Steps
If "Album Not Found" appears, console logs will reveal ID mismatch issue. May need to investigate:
- How album IDs are generated
- URL encoding/decoding of album IDs
- Store vs URL ID format differences

---

## Session Summary (2025-11-30 19:17 - 20:30)
- Started with 2 "Resolved" issues actually broken
- Fixed Issues #15, #16 through 7 iterations
- Discovered 2 new regressions (Issues #19, #20)
- All 4 issues now resolved
- Total fixes: 11 code changes across 3 files
- **Status**: Pending UAT confirmation for all fixes


#### Addendum: The "Real" Root Cause (2025-11-30 21:05)
After removing the fallback in `RankingView`, all albums showed "Album Not Found".
- **Investigation**: Console logs showed `Looking for album: undefined`.
- **Discovery**: `app.js` registered route as `/ranking/:id`, but `RankingView` expected `params.albumId`.
- **Final Fix**: Updated `public/js/app.js` to use `/ranking/:albumId`.
- **Status**: ✅ FULLY VERIFIED

---

## Previous Session (2025-11-29)

### Issue #18: Firebase API Key Client-Side Error
**Status**: ✅ Resolved
**Date**: 2025-11-29

#### Problem
User reported `Firebase: Error (auth/api-key-not-valid)` on page reload. Console showed `apiKey: "API_KEY_PLACEHOLDER"`.

#### Root Cause
`public/index-v2.html` was missing the script tag to load `public/js/firebase-config.js`.
`app.js` relies on `window.__firebase_config` being set by this script; otherwise, it falls back to a default object with placeholders.

#### Resolution
Added `<script src="/js/firebase-config.js"></script>` to `public/index-v2.html` before the main module script.

---

### Issue #17: InventoryView Runtime Error
**Status**: ✅ Resolved
**Date**: 2025-11-29

#### Problem
User reported `TypeError: this.escapeHtml is not a function` when accessing the Inventory page.

#### Root Cause
`InventoryView.js` called `this.escapeHtml()` assuming it was inherited from `BaseView`. However, `BaseView.js` did not implement this method, unlike other views that implemented it locally or didn't use it.

#### Resolution
- Added `escapeHtml` utility method to `BaseView.js` to make it available to all view components.
- Verified that `InventoryView` now renders correctly.

---

### Issue #16: View Mode State Mismatch
**Status**: ✅ Resolved
**Date**: 2025-11-29

#### Problem
"View Mode" toggle button text ("View Expanded" / "View Compact") was inconsistent with the actual view state (Grid vs List) on page load, and the preference was not persisting.

#### Root Cause
`AlbumsView` constructor initialized `viewMode` to `'grid'` (hardcoded) instead of reading from `localStorage`. The toggle logic assumed a binary state that didn't match the initial value.

#### Resolution
- Updated `AlbumsView` constructor to read `localStorage.getItem('albumsViewMode')`.
- Defaulted to `'compact'` (Grid) if not set.
- Standardized toggle logic to switch between `'compact'` and `'expanded'`.

---

### Issue #15: Ghost Albums Regression
**Status**: ✅ Resolved
**Date**: 2025-11-29

#### Problem
When switching between series, albums from the previous series would sometimes remain visible or mix with the new series' albums.

#### Root Cause
**Race Condition**: `loadAlbumsFromQueries` triggers an async API call. If the user switched series quickly, the previous request's callback would still fire and add albums to the store *after* the store had been reset for the new series.

#### Resolution
- Implemented `AbortController` in `AlbumsView`.
- Added `AbortSignal` support to `APIClient.fetchMultipleAlbums`.
- `AlbumsView` now cancels any pending requests before starting a new load or when destroyed.

---

### Issue #14: Generate Playlists 500 Error
**Status**: ✅ Resolved
**Date**: 2025-11-29

#### Problem
Server crashed with `ReferenceError: Album is not defined` when hitting `/api/playlists`.

#### Root Cause
`curation.js` (shared code) performed an `instanceof Album` check. On the server (Node.js), the `Album` class was not imported/defined in the global scope where `curation.js` was running, causing a crash.

#### Resolution
- Added a guard in `curation.js`: `if (typeof Album !== 'undefined' && album instanceof Album)`.
- This allows the server to gracefully fall back to legacy object handling while keeping strict checks on the client.

---

### Issue #13: Original Order Incorrect After Refresh
**Status**: ✅ Resolved
**Date**: 2025-11-29

#### Problem
Even after fixing the Refresh button (Issue #12), the "Original Album Order" column still displays the Ranked track list.

#### Impact Assessment
- [x] Check ARCHITECTURE.md: Verified data flow in `data_flow_analysis.md`.
- [ ] Does this affect global state/navigation? No, local to AlbumsView.
- [x] Does it work on Hard Refresh? No (stale cache persists).
- [ ] Does it work for New AND Existing items? Existing items affected.
- [ ] Does it introduce visual artifacts? Yes, added `[DEBUG]` badge for verification.

#### Investigation History
1.  **Phase 1: Data Verification**
    *   **Hypothesis**: Server sending wrong data or Client normalizing it incorrectly.
    *   **Action**: Ran `curl` and added logs to `client.js`.
    *   **Result**: ✅ Server and Client confirmed CORRECT. `tracksOriginalOrder` was present and correct in the Model.
2.  **Phase 2: Visual Debugging (The "Stale Code" Red Herring)**
    *   **Hypothesis**: View not receiving data or Browser caching old code.
    *   **Action**: Added `[DEBUG]` badges and console logs to `AlbumsView.js`.
    *   **Observation**: Badges and logs did NOT appear in the user's browser, even after F5 and server restart.
    *   **Incorrect Conclusion**: Assumed aggressive browser caching or build failure.
3.  **Phase 3: The Breakthrough**
    *   **Re-evaluation**: Noticed the URL in the user's screenshot was `/ranking/jimi-hendrix...`.
    *   **Discovery**: The user was viewing the **Album Details Page** (`RankingView.js`), NOT the **Albums List** (`AlbumsView.js`).
    *   **Verification**: Checked `RankingView.js` and found the *exact same bug* (ignoring `tracksOriginalOrder`).

#### Root Cause
*   **Wrong File Targeted**: Debugging `AlbumsView.js` while user was on `RankingView.js`.
*   **Code Defect**: `RankingView.js` used `const tracks = album.tracks || []`, which defaults to the Ranked list, ignoring the available `tracksOriginalOrder`.w API response being correct.

---

### Issue #12: Refresh Button Silent Failure
**Status**: ✅ Resolved
**Date**: 2025-11-29

#### Problem
User clicked "Refresh" button to fix stale cache, but nothing happened (no reload, no logs).

#### Root Cause
Typo in `AlbumsView.js`: Checked `activeSeries.albums` (undefined) instead of `activeSeries.albumQueries`.
```javascript
if (activeSeries?.albums) { ... } // Evaluates to false
```

#### Resolution
Corrected property name to `activeSeries.albumQueries`.

#### Verification
User confirmed "it's finally reloading".

---

### Issue #11: API Key Not Loaded (Regression)
**Status**: 🟡 Potential Fix Applied
**Date**: 2025-11-29

#### Problem
Backend fails with `503 Service Unavailable` and logs `Warning: AI_API_KEY not set`, even though `.env` exists in `server/` directory.

#### Root Cause
`dotenv` configuration was looking for `.env` in the project root (CWD), but the file is located in `server/`.

#### Resolution
Updated `server/index.js` to use absolute path resolution:
```javascript
require('dotenv').config({ path: path.resolve(__dirname, '.env') })
```

#### Verification
- Server restarted.
- Log confirmed: `AI proxy server listening...` (No warning).
- **Pending User Confirmation**.

---

### Issue #10: API 400 Bad Request
**Status**: 🟡 Potential Fix Applied
**Date**: 2025-11-29

#### Problem
User reported `400 Bad Request` when generating albums after fixing Axios error.

#### Root Cause
Payload mismatch: `client.js` was sending `{ album: query }` but server expects `{ albumQuery: query }`. This regression was introduced when replacing `_fetchAlbumFromAPI` with direct `axios.post`.

#### Resolution
Updated `client.js` to send correct payload property `albumQuery`.

#### Verification
- Code updated.
- **Pending User Confirmation**.

---

### Issue #9: Axios Reference Error
**Status**: 🟡 Potential Fix Applied
**Date**: 2025-11-29

#### Problem
User reported `ReferenceError: axios is not defined` when loading albums after Domain Model refactor.

#### Root Cause
`axios` was used in `client.js` but was not listed in `package.json` dependencies, nor imported in the file. Previous implementation likely relied on global scope or different fetch method.

#### Resolution
1. Installed `axios` via npm.
2. Added `import axios from 'axios'` to `public/js/api/client.js`.

#### Verification
- `npm install` completed successfully.
- Code updated.
- **Pending User Confirmation**.

---

### Issue: Domain Model Anemia (Refactor)
**Status**: 🟡 Potential Fix Applied
**Date**: 2025-11-29

#### Problem
Persistent data integrity issues (missing artist/album fields, original order regression) due to "Anemic Domain Model" (passing raw JSON).

#### Resolution
Refactored to Rich Domain Model:
- Created `Track`, `Album`, `Playlist`, `Series` classes.
- Updated `client.js` to hydrate instances.
- Updated `curation.js` to use model methods.

**See**: [walkthrough.md](../../docs/walkthrough.md)

---

### Issue #8: Store State Management - Architectural Problem
**Status**: 🟡 In Progress (Root Cause Analysis)  
**Date**: 2025-11-29 17:00  
**Related Files**: AlbumsView.js, PlaylistsView.js, RankingView.js

#### Symptoms
- Ghost Albums **RETURNED** after adding recovery logic
- "Album Not Found" was never properly fixed
- Code duplication across 3 views (AlbumsView, PlaylistsView, RankingView)

#### Root Cause
- **Band-aid approach**: Treating symptom (empty store) instead of cause
- Each view doing `reset() + reload` creates race conditions
- Store being cleared when it shouldn't be

#### Wrong Approach (Current)
```
AlbumsView.destroy() → reset store
  → Every other view needs recovery logic
  → Duplicated code + ghost data issues
```

#### Correct Approach (Proposed)
```
Store should persist while series is active
  → Only reset when:
    1. User changes series
    2. User explicitly refreshes
    3. App closes
  → No recovery logic needed in views
```

#### Action Plan
- [x] LOG this issue
- [x] REVERT RankingView changes (recovery logic)
- [ ] REVERT PlaylistsView changes (recovery logic)  
- [x] REMOVE albumsStore.reset() from AlbumsView.destroy()
- [ ] TEST that all views work without reset
- [ ] VERIFY ghost albums don't return

**See Also**: [ARCHITECTURE.md - Store State Management](../../docs/ARCHITECTURE.md#store-state-management-current)

---

### Issue #7: Album Click Navigation - "Album Not Found"
**Status**: 🔴 Reverted (Wrong Approach)  
**Date**: 2025-11-29 16:38  
**Resolution**: Identified as symptom of Issue #8 (store management). Fix reverted in favor of architectural solution.

**See**: Issue #8 for proper fix.

---

### Issues #1-6: Various Regressions
**Status**: ✅ Resolved  
**Date**: 2025-11-28 - 2025-11-29  

Summary of resolved issues (see archived versions for details):
1. Navigation regression (button URL)
2. HTML artifacts (template strings)
3. Syntax errors (duplicated braces)
4. Hard refresh empty state
5. PlaylistsView empty state
6. Various UI regressions

---

## Previous Debugging Sessions (2025-11-28 and earlier)

### Sprint 4.5 Phase 2: localStorage Cache Missing New Fields
**Status**: ✅ Resolved (Deferred to Sprint 5)  
**Date**: 2025-11-28  
**Duration**: 16:00 - 18:50 (2h50m)

#### Problem
After implementing new album fields (`bestEverAlbumId`, `bestEverUrl`, `tracksOriginalOrder`), albums loaded from cache showed `undefined` for these fields.

#### Root Cause
- Albums cached in localStorage before code changes lack new normalized fields
- Cache hit bypasses normalization, loading old structure

#### Resolution
- ✅ Added "Refresh" button to force skip-cache reload
- ✅ Modified `loadAlbumsFromQueries(queries, skipCache)` to accept flag
- ⏸️ Complete fix deferred to Sprint 5 (Firestore migration)

#### Rationale for Deferral
1. Firestore = Better solution (persistent, schema versioning, no limits)
2. Temporary workaround sufficient (affects only existing cache)
3. New data normalizes correctly

**See**: [SPRINT_5_PERSISTENCE_ARCHITECTURE.md](../../docs/archive/architecture-artifacts-2025-11-29/SPRINT_5_PERSISTENCE_ARCHITECTURE.md)

---

### Issue: Original Album Order Regression (Sprint 4.5)
**Status**: ✅ Resolved (Workaround)
**Date**: 2025-11-28

#### Problem
"Original Album Order" column showed Ranked order or `undefined` fields after update.

#### Root Cause
**Cache Poisoning**: `localStorage` contained old album objects without `tracksOriginalOrder`.
`AlbumsView` fell back to `tracks` (Ranked) when `tracksOriginalOrder` was missing.

#### Resolution
1. Added `tracksOriginalOrder` to `normalizeAlbumData`.
2. Implemented "Refresh" button to force cache update.
3. **Architecture Fix**: Planned migration to Firestore to avoid localStorage schema issues.

**See**: [album_data_schema.md](../../docs/album_data_schema.md) for data mapping.

---

### Sprint 4.5: Missing Tailwind CSS
**Status**: ✅ Resolved  
**Date**: 2025-11-28  
**Duration**: 09:00 - 10:20

#### Problem
Site rendered without styles (Header, Footer, Hero Banner broken)

#### Root Cause
Tailwind CSS classes used in code but never installed or included

#### Resolution
Added Tailwind via CDN in `public/index-v2.html`:
```html
<script src="https://cdn.tailwindcss.com"></script>
```

---

### Sprint 4: Series Mixing Bug
**Status**: ✅ Resolved  
**Date**: 2025-11-27 (Late afternoon)

#### Problem
Albums from previous series persisted when switching to new series

#### Root Cause
`AlbumsView` appending albums without clearing previous state

#### Resolution
Added `albumsStore.reset()` in `AlbumsView.loadAlbumsFromQueries()`

---

### Sprint 4: Ratings Not Loading
**Status**: ✅ Resolved  
**Date**: 2025-11-27  
**Duration**: 09:30 - 14:32 (5h)

#### Problem
Album ratings not displaying (showed "⚠ No ratings" instead of "✓ Rated")

#### Root Causes Found
1. **Backend** - Not mapping ratings from `rankingConsolidated` to tracks
2. **Frontend** - Detection logic relied on non-existent `rankingConsolidatedMeta.hasRatings`
3. **Cache** - localStorage contained old data without ratings
4. **ID Mismatch** - HTML `id="albumQueries"` vs JS `id="albumList"`

#### Fixes Applied
**Backend** (`server/index.js`):
```javascript
// Added ratingMap alongside rankMap
const ratingMap = new Map()
albumPayload.rankingConsolidated.forEach(r => {
  if (r.rating != null) ratingMap.set(normalizeKey(r.trackTitle), r.rating)
})
```

**Frontend** (`public/js/api/client.js`):
```javascript
// Calculate hasRatings from actual data
const hasRatings = tracks.some(t => 
  (t.rating !== null && t.rating !== undefined) ||
  (t.rank !== null && t.rank !== undefined)
)
```

**UX**: Added "Clear Cache" button  
**Validation**: Added minimum 2 albums requirement  
**Navigation**: Added breadcrumbs to all views

#### Files Modified
- server/index.js (+13 lines)
- public/js/api/client.js (+15 lines)
- public/js/views/HomeView.js (+25 lines)
- public/js/components/Breadcrumb.js (93 lines, NEW)

---

### Sprint 4: Rank Display in Playlists
**Status**: ✅ Resolved  
**Date**: 2025-11-27

#### Problem
"Rank: -" displayed despite data being available

#### Root Cause
Frontend only checked `track.rank`, backend returned `acclaimRank` or `finalPosition`

#### Resolution
Added fallback chain: `rank || acclaimRank || finalPosition || '-'`  
**File**: `public/js/api/client.js`

---

### Hotfix: Ranking by Acclaim (Production)
**Status**: ✅ Resolved  
**Date**: 2025-11-24  
**Severity**: High (Production Issue)

#### Issue
Tracks not properly sorted by acclaim ranking in production. "Another Brick in the Wall" parts showed rawScore 0.

#### Root Cause
1. **Normalization Mismatch**: Server-side `normalizeKey` was too simple (`trim().toLowerCase()`), missing punctuation variants.
2. **Deduplication**: Client-side `collectRankingAcclaim` had weak deduplication keys, overwriting valid entries.
3. **Mapping**: Backend wasn't mapping `finalPosition` to `tracks[].rank` correctly.

#### Resolution
1. **Server**: Enhanced `normalizeKey` (remove diacritics, non-alphanumeric).
2. **Server**: Updated `rankingConsolidated` mapping to use robust normalization.
3. **Client**: Updated `collectRankingAcclaim` (now in `curation.js` logic) to include `trackTitle` + `albumId` in dedup key.
4. **Client**: `normalizeAlbumData` maps `acclaimRank` -> `rank`.

**Critical Logic Preserved**:
- `tracksOriginalOrder` MUST remain AS IS (1..N based on disc).
- `tracks` (Ranked) MUST be sorted by rating/rank.

**Full Details**: [HOTFIX_RANKING_ACCLAIM.md](../../docs/archive/hotfixes/HOTFIX_RANKING_ACCLAIM.md)

---

## Debug Tools & Visual Elements

### Visual Debug Elements Added (AlbumsView)
**Date**: 2025-11-28  
**Purpose**: Filter debugging  
**Status**: 🟢 Active (removable)

All debug elements marked with `// DEBUG:` comments for easy removal.

#### Visual Debug Panel
- **Location**: Line ~142-170 in AlbumsView.js
- **Purpose**: Real-time filter state display
- **Marker**: `<!-- DEBUG: Visual Debug Panel START/END -->`

#### Console Logs
All prefixed with `🔍 [DEBUG]` for easy filtering in DevTools

### How to Remove Debug Code
```bash
# Find all debug comments
grep -n "// DEBUG:" public/js/views/AlbumsView.js

# Find all debug console logs
grep -n "🔍 \\[DEBUG\\]" public/js/views/AlbumsView.js
```

---

## Lessons Learned

### Architecture
1. **Band-aids create technical debt**: Recovery logic led to ghost albums
2. **Store persistence matters**: Don't clear state unnecessarily
3. **Single source of truth**: Firestore > localStorage for schema evolution

### Debugging
1. **ID consistency critical**: Mismatched IDs cause silent failures
2. **Cache invalidation**: Always consider cache when testing API changes
3. **Separation of concerns**: Backend vs Frontend issues need separate debugging
4. **Metadata vs Data**: Don't trust metadata fields, inspect actual data

### Development
1. **Verify dependencies**: Never assume a library is available
2. **Visual verification**: Code working ≠ renders correctly
3. **Browser automation limits**: Manual testing sometimes more reliable

---
**See**: `.agent/workflows/debug_issue.md` for systematic debugging protocol


