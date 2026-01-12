# Changelog

All notable changes to the "The Album Blender" (MJRP) project will be documented in this file.

> **Note**: This changelog starts fresh from **January 2026**.
> Historical changes (2025) are archived in [docs/archive/CHANGELOG_ARCHIVED_20260108.md](../archive/CHANGELOG_ARCHIVED_20260108.md) and [docs/ROADMAP.md](../ROADMAP.md).

---

## [Unreleased]

### Added
- **Manual v3.0**: Published the [Reference Guide](MJRP_Album_Blender_Ref_Guide.md) ("Deep Dive") to `docs/`.
- **New Protocols**: Implemented `onboarding_protocol_v2` and `documentation_audit_v2`.
- **Docs**: Created `docs/manual/00_Deployment_and_Setup.md` as the unified deployment guide.
- **Testing**: Added `blending-wizard.test.js` for golden path verification.

### Changed
- **Documentation Overhaul**: Restructured `docs/` folder.
    - Established **Snapshot Strategy**: `docs/manual/MasterManualSnapshot_*.md` is now the static content source.
    - Created **Reference Guide**: `docs/MJRP_Album_Blender_Ref_Guide.md` as the primary index.
    - Archived legacy technical specs to `docs/archive/2025_technical/`.
    - Consolidated `PROJECT_SUMMARY.md` into the Root `README.md`.
- **Code Structure**:
    - Moved root test scripts to `test/scripts/`.
    - Archived `deprecated_curation.js` and removed legacy `api.js`.
- **Test Suite**:
    - Revamped `helpers.js` to support V3 Home View workflow (Batch/Process/Initialize).
    - Removed deprecated `waitForTimeout` in favor of implementation-agnostic `sleep`.
    - Updated `topn.test.js` to match Sprint 17.5 Generic Algorithm architecture.

### Fixed
- **Link Rot**: Updated all internal links in `proj-documentation-task.md` and architecture maps.
- **Redundancy**: Removed duplicate READMEs and Project Summary files.

---

## [3.20.0] - 2026-01-12
### Added
- **User Ranking System**: Drag-and-drop modal for custom track ranking within albums.
- **"My Own Ranking" Recipe**: New blending recipe that prioritizes user-defined track orders.
- **Persistence Layer**: Firestore and IndexedDB storage for user rankings with full hydration on load.
- **UGR Prefix**: Integrated "UGR" (User-Generated Rank) prefix in playlist titles.

### Changed
- **TracksTable**: Repositioned average statistics to a cleaner header row.
- **System Architecture**: Codified Ground Rules for modularity and componentization in `01_System_Architecture.md`.

### Fixed
- **Hydration Race Condition**: Ensured rankings are fully loaded before rendering the Blending Menu (Issue #148).
- **PlaylistsView TypeError**: Fixed method call mismatch (`setBatchName` vs `updateBatchName`) in the batch naming input (Issue #149).

---

## [3.16.0] - 2026-01-08
### Added
- **SafeDOM**: Full migration to `SafeDOM` utility for XSS prevention.
- **Batch Naming**: Implemented new naming convention for generated playlists.

### Fixed
- **Export Data Loss**: Resolved issue where exporting large playlists dropped tracks.
