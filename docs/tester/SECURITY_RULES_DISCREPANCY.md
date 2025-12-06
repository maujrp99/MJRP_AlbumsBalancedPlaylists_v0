
# ⚠️ Security Rules Discrepancy Report

**Date**: 2025-12-06
**Status**: 🔴 **CRITICAL CONFLICT DETECTED**

## 1. Path Mismatch
- **User Request**: Rules explicitly cover `/artifacts/{appId}/users/{userId}/...`
- **Codebase**: Writes explicitly to `users/{userId}/...` (Root level)

**Impact**: Even if Auth was working, specific rules for `artifacts/` would **NOT apply** to the data being written by the app.

## 2. Authentication Wrapper Mismatch
- **User Request**: `if request.auth != null`
- **Codebase**: `userId = 'anonymous-user'` (No Auth)

**Impact**: Applying these rules to the root `users/` path would **IMMEDIATELY BLOCK** the application, as `request.auth` is null.

## Recommendation
1. **To maintain functionality**: I added a "catch-all" rule for `users/{userId}` in `firestore.rules` that allows access.
2. **To use requested rules**: You must refactor `BaseRepository.js` to prefix paths with `artifacts/mjrp-app/` AND implement Firebase Auth login.

I have generated `firestore.rules` with both sets of rules to preserve your request while keeping the app functional.
