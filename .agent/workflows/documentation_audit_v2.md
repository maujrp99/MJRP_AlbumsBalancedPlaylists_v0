---
description: "Forensic Documentation Audit V2"
---
# Documentation Audit Protocol v2

## 1. Identify Changes
Assess which functional areas have been modified in the current task.

## 2. Map to Manual
Consult `docs/MJRP_Album_Blender_Ref_Guide.md` to find the relevant chapters.
- **Backend/Route Changes**: `02_Server_Core.md` through `05_Server_Routes.md`
- **Frontend State/Store**: `06_Frontend_Data_Store.md`
- **UI/Components**: `11_Frontend_Components_Root.md` through `16_Frontend_Search_Ranking.md`

## 3. Update Documentation
1. **Read** the relevant manual file.
2. **Update** the file to reflect the new code reality.
   - *Rule*: Documentation must match Code. If Code changes, Docs MUST change.
3. **Link** new files in `00_Manual_Index.md` if created.

## 4. Changelog
// turbo
1. Read `docs/CHANGELOG.md`.

## 5. The Snapshot Protocol (Master Manual)
~ **Logic**: The `docs/MasterManualSnapshot_YYYYMMDD.md` is a static "State of the Union".
1. **Inspect**: Check the date in the filename against `docs/ROADMAP.md`.
2. **Decide**: If the Snapshot is > 1 significant Sprint old or Key Features have changed:
   - **Archive**: Move the old Snapshot to `docs/archive/`.
   - **Regenerate**: Create a NEW `MasterManualSnapshot_YYYYMMDD.md` reflecting the current state.
3. **Verify**: Ensure the new Snapshot accurately summarizes the "Deep Dive" chapters in `docs/manual/`.
