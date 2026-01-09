# Changelog

All notable changes to the "The Album Blender" (MJRP) project will be documented in this file.

> **Note**: This changelog starts fresh from **January 2026**.
> Historical changes (2025) are archived in [docs/archive/CHANGELOG_ARCHIVED_20260108.md](../archive/CHANGELOG_ARCHIVED_20260108.md) and [docs/ROADMAP.md](../ROADMAP.md).

---

## [Unreleased]

### Added
- **Manual v3.0**: Published the [Comprehensive Manual](../manual/00_Manual_Index.md) ("Deep Dive") to `docs/manual/`.
- **New Protocols**: Implemented `onboarding_protocol_v2` and `documentation_audit_v2`.
- **Docs**: Created `docs/manual/00_Deployment_and_Setup.md` as the unified deployment guide.

### Changed
- **Documentation Overhaul**: Restructured `docs/` folder.
    - Promoted "Forensic Analysis" files to be the Active Manual.
    - Archived legacy technical specs to `docs/archive/2025_technical/`.
    - Consolidated `PROJECT_SUMMARY.md` into the Root `README.md`.
- **Code Structure**:
    - Moved root test scripts to `test/scripts/`.
    - Archived `deprecated_curation.js` and removed legacy `api.js`.

### Fixed
- **Link Rot**: Updated all internal links in `proj-documentation-task.md` and architecture maps.
- **Redundancy**: Removed duplicate READMEs and Project Summary files.

---

## [3.16.0] - 2026-01-08
### Added
- **SafeDOM**: Full migration to `SafeDOM` utility for XSS prevention.
- **Batch Naming**: Implemented new naming convention for generated playlists.

### Fixed
- **Export Data Loss**: Resolved issue where exporting large playlists dropped tracks.
