# Documentation Audit Protocol

**Purpose**: Systematic process to verifying that the **Manuals** match the **Code**.

## 1. Identify Changes
Assess which functional areas have been modified in the current task.

## 2. Map to Manual (The Map)
Consult this map to find the relevant Manual Chapters (`docs/manual/`).

### 🛠️ System & Infra
-   **Architecture & Deployment**: `00_Deployment_and_Setup.md`, `01_System_Architecture.md`
-   **Tests**: `24_Test_Suite.md`
-   **Shared Utils**: `23_Shared_Code.md`

### 🔙 Backend (Node/Python)
-   **Core Server**: `02_Server_Core.md` (App Entry)
-   **Libraries**: `03_Server_Libraries.md` (Helpers)
-   **Business Logic**: `04_Server_Logic.md` (Controllers)
-   **API Routes**: `05_Server_Routes.md` (Endpoints)

### 💾 Frontend Data Layer
-   **Stores (State)**: `06_Frontend_Data_Store.md`
-   **Infrastructure**: `07_Frontend_Data_Infra.md`, `28_Frontend_Infra_Utilities.md`
-   **Models**: `08_Frontend_Models.md`

### 🖼️ Frontend UI & Components
-   **Views (Pages)**: `09_Frontend_Views.md`
-   **Renderers**: `10_Frontend_Renderers.md`
-   **Components (Root)**: `11_Frontend_Components_Root.md`
-   **Components (Core)**: `12_Frontend_Components_Core.md`
-   **Components (Shared)**: `13_Frontend_Components_Shared.md`
-   **Components (Features)**: `14_Frontend_Components_Features.md`, `14b_Frontend_Components_Feature.md`
-   **Complexity/Refactors**: `15_Frontend_Complexity.md`, `25_Legacy_Analysis.md`
-   **Reference**: `30_Component_Reference.md`
-   **Style Guide**: `31_UI_Style_Guide.md`

### 🧠 Frontend Logic & Services
-   **Search & Ranking**: `16_Frontend_Search_Ranking.md`, `22_Album_Search_Engine.md`
-   **Services (API)**: `17_Frontend_Services.md`
-   **Core Logic**: `18_Frontend_Logic_Core.md`, `27_Frontend_Core.md`
-   **Entry Points**: `19_Frontend_JS_Root.md`
-   **Integrations**: `20_MusicKit_Internals.md`
-   **Data Schemas**: `32_Data_Schema_Reference.md`

### 🗺️ Maps & Checklists
-   **UI Mapping**: `21_Dynamic_UI_Mapping.md`
-   **Regression**: `regression_checklist.md`

### 🧑‍🤝‍🧑 Context Loading (Agents & Humans)
-   **Developers**: `docs/onboarding/DEVELOPER.md` (Verify against `package.json` scripts)
-   **Setup**: `docs/onboarding/LOCAL_DOMAIN_SETUP.md` (Verify against `.env.example`)
-   **QA**: `docs/onboarding/QA_ENGINEER.md`
-   **Vision**: `docs/MJRP_Product_Vision.md`

### ⚖️ Governance (Agent Context)
-   **Rules**: `.agent/rules/` (Verify align with `CONSTITUTION.md`)
-   **Workflows**: `.agent/workflows/` (Verify align with actual agent behavior)
-   **Constitution**: `docs/CONSTITUTION.md`

## 3. Update Documentation
1.  **Read** the relevant manual file.
2.  **Update** the file to reflect the new code reality.
    -   *Rule*: Documentation must match Code. If Code changes, Docs MUST change.

## 4. Changelog
// turbo
1.  Read `docs/CHANGELOG.md`.
2.  Add a concise entry under the [Unreleased] section.

## 5. The Snapshot Protocol (Master Manual)
~ **Logic**: The `docs/manual/MasterManualSnapshot_YYYYMMDD.md` is a static "State of the Union".
1.  **Inspect**: Check the date in the filename against `docs/ROADMAP.md`.
2.  **Decide**: If the Snapshot is > 1 significant Sprint old or Key Features have changed:
    -   **Archive**: Move the old Snapshot to `docs/archive/`.
    -   **Regenerate**: Create a NEW `manual/MasterManualSnapshot_YYYYMMDD.md` reflecting the current state.
