# Specification: CRIT-1 Atomic Playlist Saves ✅ IMPLEMENTED

## 1. Problem Description
The current `saveToFirestore` implementation in `PlaylistsStore.js` saves playlists individually using `Promise.all()`. 
This is **non-atomic**. If the user has 5 playlists to save and the network cuts out after the 2nd one:
- 2 playlists are saved.
- 3 are lost (or remain dirty locally).
- The state is inconsistent between Client and Server.
- No automatic rollback mechanism exists.

## 2. Goal
Ensure that the "Save to Firestore" operation is **Transactional (Atomic)**. Either ALL playlists in the current series are saved, or NONE are.

## 3. Scope
- **Component**: `PlaylistsStore.js`
- **Method**: `saveToFirestore(db, cacheManager, userId)`
- **Affected Data**: `users/{userId}/curator/playlists` (assuming this is the valid path managed by `PlaylistRepository`).

## 4. Success Criteria
1.  **Atomicity**: Saving N playlists results in exactly N writes in a single batch commit.
2.  **Failure Safety**: If any write in the batch fails, no changes are committed to Firestore.
3.  **UI Feedback**: The user receives a single Success or Error notification for the entire operation.
4.  **Batch Limit Handling**: (Edge Case) If playlists exceed 500 writes (Firestore limit), the operation must be split or guarded (though unlikely for this app's scale).

## 5. Constraints & Risks
- **Firestore Batch Limit**: Max 500 operations per batch.
    - *Mitigation*: We will implement a check. If `playlists.length` > 450, we might need chunking, but for now, we assume < 50 playlists per series.
- **Repository Pattern**: `PlaylistRepository` currently encapsulates `save/create`. We need to expose a way to **add to batch** instead of executing immediately.
    - *Decision*: We will expand `BaseRepository` or `PlaylistRepository` to support `getCreateBatchOperation` / `getSetBatchOperation` OR pass the `batch` object to the repository methods.

## 6. User Review Required
- **Architecture Change**: This requires modifying the `BaseRepository` (or `PlaylistRepository`) pattern to support passing a `WriteBatch` object. Are you comfortable with methods accepting an optional `batch` parameter?

> [!IMPORTANT]
> This change prevents partial data loss, which is critical for user trust.
