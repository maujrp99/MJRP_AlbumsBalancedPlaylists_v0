---
description: Protocol for agents to read and analyze documentation for context (Deep Context Loading)
---

# Check Documentation Protocol (Context Loading)

**Purpose**: Systematic method for an Agent to "Download" the project context into its context window by traversing the Manual Index.

**Goal**: Gain a deep understanding of Architecture, Business Logic, and UI Patterns *before* touching code.

> **Trigger**: Run this at the start of a session, before a complex refactor, or when asked to "Audit" or "Understand" a feature.

## Phase 1: The Index (The Map)
1.  **Read the Single Source of Truth**:
    *   `docs/manual/00_MJRP_Album_Blender_Ref_Guide_Index.md`
2.  **Analyze the Structure**:
    *   Understand how the project is divided (Backend, Frontend Data, Frontend Views, Components, Logic).

## Phase 2: Targeted Consumption
*Select the areas relevant to your current task (or "All" if onboarding).*

### 🛠️ Architecture & Infrastructure
*Files to Read:* `01_System_Architecture.md`, `02_Server_Structure.md`
*Goal:* Understand the high-level data flow, server constraints, and deployment model.

### 🧠 Logic & Services (The "Brain")
*Files to Read:* `17_Frontend_Services.md`, `18_Frontend_Logic_Core.md`, `04_Backend_Logic_Services.md`
*Goal:* Understand *how* things work. Key algorithms, service orchestration, state management strategies.

### 🖼️ UI & Experience (The "Face")
*Files to Read:* `31_UI_Style_Guide.md`, `09_Frontend_Views.md`, `10_Frontend_Renderers.md`, `14_Frontend_Components_Feature_Map.md`
*Goal:* Understand the Visual System, Component Hierarchy, and Rendering Patterns (e.g., SafeDOM usage).

### 💾 Data & State
*Files to Read:* `06_Frontend_Data_Stores.md`, `32_Data_Schema_Reference.md`
*Goal:* Understand the shape of the data, Store patterns (Pinia-like), and Persistence models.

## Phase 3: Synthesis & Strategy
**After reading the selected files:**
1.  **Identify Constraints**: What patterns MUST be followed? (e.g., "Always use SafeDOM", "Never query DOM directly").
2.  **Spot Dependencies**: What services/stores interact with the feature you are about to modify?
3.  **Check for "Magic"**: Are there background workers, complex regexes, or hidden state machines?

## Phase 4: Output
*   **Brief Summary**: "I have read X, Y, Z. I understand that the system uses Pattern A for this feature..."
*   **Ready**: explicit confirmation that you are ready to proceed with code changes, armed with full context.