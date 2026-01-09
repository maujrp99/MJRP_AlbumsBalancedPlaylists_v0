# Feature Specification: Algorithm Strategy Pattern

**Feature Branch**: `feature/sprint8-algorithm-strategy`  
**Created**: 2025-12-16  
**Status**: Draft  
**Input**: User requirement: "Modular algorithm selection for playlist generation"

## User Scenarios & Testing

> **IMPORTANT**: The generated playlist output (UI, drag&drop, displayed information) remains **exactly the same** as today. Only the generation engine (algorithm) changes.

### User Story 1 - Select Algorithm Before Generation (Priority: P1)

User navigates to the playlist generation screen/modal and sees a list of available algorithms with descriptions. They can select one before generating.

**Why this priority**: Core functionality - without algorithm selection, the feature has no value.

**Independent Test**: Open PlaylistsView, verify algorithm selector is visible, select an algorithm, and generate playlists.

**Acceptance Scenarios**:

1. **Given** user is on PlaylistsView, **When** they click "Generate Playlists", **Then** an algorithm selector is displayed
2. **Given** algorithm selector is visible, **When** user selects "S-Draft MJRP Balanced", **Then** the description updates to match
3. **Given** an algorithm is selected, **When** user clicks "Generate", **Then** playlists are created using that algorithm

---

### User Story 2 - Default to Recommended Algorithm (Priority: P1)

When user opens the generation UI, the recommended algorithm (S-Draft MJRP Balanced) is pre-selected.

**Why this priority**: Essential UX - new users shouldn't need to understand algorithms to get started.

**Independent Test**: Open generation UI, verify "S-Draft MJRP Balanced" is pre-selected with [RECOMMENDED] badge.

**Acceptance Scenarios**:

1. **Given** user opens generation modal, **When** modal loads, **Then** "S-Draft MJRP Balanced" is pre-selected
2. **Given** recommended algorithm is selected, **When** user generates immediately, **Then** playlists use the recommended algorithm

---

### User Story 3 - View Algorithm Descriptions (Priority: P2)

Each algorithm in the selector displays its name, badge, and a brief description explaining what it does.

**Why this priority**: Helps users make informed choices, but not blocking for basic functionality.

**Independent Test**: View selector, verify each option shows name + badge + description.

**Acceptance Scenarios**:

1. **Given** algorithm selector is open, **When** user views options, **Then** each shows name, badge (LEGACY/ORIGINAL/RECOMMENDED), and description
2. **Given** user hovers/focuses an algorithm, **When** reading description, **Then** it explains what playlists will be generated

---

### User Story 4 - Legacy Algorithm Available (Priority: P1)

Users can use the Legacy Round-Robin algorithm - the currently tested and working implementation.

**Why this priority**: Essential - this is the only algorithm that is currently tested and functionally working. Must be available as a baseline.

**Independent Test**: Select Legacy algorithm, generate, verify P1/P2/Deep Cuts structure as before.

**Acceptance Scenarios**:

1. **Given** user selects "Legacy Round-Robin", **When** they generate, **Then** output matches current behavior

---

### Edge Cases

- What happens when 0 albums are loaded? → Show error toast
- What happens when algorithm fails? → Catch error, show message, keep UI responsive
- What happens with very short series (< 5 tracks)? → Algorithm handles gracefully

## Requirements

### Functional Requirements

> **IMPORTANT**: Playlist output (UI, drag&drop, track display) remains unchanged.

- **FR-001**: System MUST provide a registry of available algorithms
- **FR-002**: System MUST display algorithm selector in PlaylistsView before generation
- **FR-003**: System MUST show algorithm description when selected
- **FR-004**: System MUST execute the selected algorithm via a unified interface
- **FR-008**: Generated playlists MUST have the same structure/UI as today (no output changes)
- **FR-009**: Drag & drop editing MUST continue to work on generated playlists
- **FR-005**: System MUST default to "S-Draft MJRP Balanced" as recommended
- **FR-006**: Old inputs (playlistCount, minDuration, maxDuration) MUST be removed
- **FR-007**: All 3 algorithms (Legacy, Original, Balanced) MUST be available

### Key Entities

- **BaseAlgorithm**: Abstract base class defining generate() interface
- **AlgorithmRegistry**: Factory/registry for available algorithms
- **AlgorithmMetadata**: id, name, badge, description, isRecommended

## Success Criteria

### Measurable Outcomes

- **SC-001**: User can generate playlists using any of the 3 algorithms
- **SC-002**: Default algorithm produces correct output per ALGORITHM_MENU.md spec
- **SC-003**: Build passes with no lint errors
- **SC-004**: Existing tests continue to pass (backward compatible)
