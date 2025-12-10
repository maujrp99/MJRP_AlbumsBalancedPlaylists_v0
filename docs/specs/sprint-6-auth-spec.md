# Feature Specification: Authentication (Apple & Google) + Persistence

**Feature Branch**: `06-auth-persistence`  
**Created**: 2025-12-10  
**Status**: Draft  
**Input**: User description: "Sprint 6: Authentication (Apple & Google) and User Data Persistence" (Source: Roadmap.md)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sign In with Google (Priority: P1)

A user wants to sign in using their Google Account to access personalized features.

**Why this priority**: Core requirement for user identification. Google is a primary identity provider.

**Independent Test**: Can be tested by clicking "Sign In" -> "Google" and verifying the user state changes to authenticated.

**Acceptance Scenarios**:

1. **Given** user is guest, **When** they click "Sign In" > "Google", **Then** a popup appears for Google Auth.
2. **Given** successful Google Auth, **When** popup closes, **Then** UI updates to show User Avatar/Name in header.
3. **Given** auth error (e.g. closed popup), **When** flow ends, **Then** an error toast is displayed and user remains guest.

---

### User Story 2 - Sign In with Apple (Priority: P1)

A user wants to sign in using their Apple ID for privacy and convenience.

**Why this priority**: Required for iOS ecosystem integration and user choice.

**Independent Test**: Can be tested by clicking "Sign In" -> "Apple" and verifying authentication.

**Acceptance Scenarios**:

1. **Given** user is guest, **When** they click "Sign In" > "Apple", **Then** they are redirected/popup to Apple Sign In.
2. **Given** successful Apple Auth, **When** returned to app, **Then** UI updates to show User state.
3. **Given** successful auth, **When** inspecting user data, **Then** email is present (if shared by user).

---

### User Story 3 - Persistence: User Profile (Priority: P1)

The system must persist basic user identity to the cloud.

**Why this priority**: Required to identify the owner of the data.

**Independent Test**: Verify Firestore document `/users/{uid}` exists after login.

**Acceptance Scenarios**:

1. **Given** a new user, **When** they sign in, **Then** a profile is created at `/users/{uid}` with `displayName` and `email`.
2. **Given** an existing user, **When** they sign in, **Then** `lastLoginAt` is updated.

---

### User Story 6 - Persistence: Business Data (Priority: P1)

Users expect their Albums, Inventory, and Playlists to be saved to their account.

**Why this priority**: **Critical User Value**. Without this, login has no utility.

**Independent Test**: Create inventory as Guest -> Login -> Verify inventory exists in Firestore under `/users/{uid}/inventory` (or linked collection).

**Acceptance Scenarios**:

1. **Given** a Guest user with local Inventory/Playlists, **When** they Sign In (Google/Apple), **Then** their local data is merged/uploaded to their Cloud account.
2. **Given** a Logged In user, **When** they add an album to Inventory, **Then** it is saved to Firestore.
3. **Given** a Logged In user, **When** they log out and log in on another device, **Then** their Inventory matches the cloud state.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to authenticate via Google and Apple.
- **FR-002**: System MUST persist User Profile (`/users/{uid}`) with name and email.
- **FR-003**: System MUST persist User Inventory (`/users/{uid}/inventory` or structured collection).
- **FR-004**: System MUST persist User Playlists (`/users/{uid}/playlists`).
- **FR-005**: System MUST persist User Custom Series & Albums (`/users/{uid}/series`, `/users/{uid}/albums`).
- **FR-006**: System MUST migrate Guest Data (LocalStorage) to CloudStore upon first login.
- **FR-007**: System MUST maintain user session across page reloads.
- **FR-008**: UI MUST display `UserMenu` in Header when authenticated.
- **FR-009**: Manual Registration (Email/Password) is **OUT OF SCOPE**.

### Key Entities *(include if feature involves data)*

- **User**: `/users/{uid}`
    - `uid`, `email`, `displayName`, `photoURL`, `lastLoginAt`.

- **UserInventory**: `/users/{uid}/inventory/{albumId}`
    - Stores ownership status and added date.

- **UserPlaylists**: `/users/{uid}/playlists/{playlistId}`
    - Stores generated playlists.

- **UserCustomData**:
    - `/users/{uid}/series/{seriesId}`: Custom series definitions.
    - `/users/{uid}/albums/{albumId}`: Custom album definitions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: User can complete Sign In flow in under 15 seconds.
- **SC-002**: Local Inventory items appear in Firestore immediately after login.
- **SC-003**: User can access their Inventory on a second device (simulated via Incognito).
- **SC-004**: No data is lost during the Guest -> Auth transition.

## 💬 User Review & Comments

> Use this section to leave feedback, request changes, or approve the spec.
> Format: `> [!NOTE] Your comment here`

### General Feedback
[x] Approved
[ ] Changes Requested

- User confirmed Social Login Only.
- User confirmed Business Data Persistence is required.

