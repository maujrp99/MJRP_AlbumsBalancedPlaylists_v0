# Specification: Ranking Strategy Selection

**Status**: IMPLEMENTED
**Sprint**: 11.5 - Stabilization & Refactor
**Authors**: Antigravity

---

## 1. Problem Statement
Currently, playlist generation algorithms (like `MJRPBalancedCascadeAlgorithm`) are tightly coupled with a single, hardcoded ranking logic (found in `LegacyRoundRobinAlgorithm.enrichTracks`). This makes it impossible for users to choose alternative "Sources of Truth" for ranking, such as strictly using Spotify Popularity or strictly BestEverAlbums (BEA) ratings.

## 2. Objective
Implement a **Ranking Strategy Pattern** that decouples the sorting/ranking of tracks (Input Selection) from the distribution/balancing logic (Algorithm execution). This allows the system to be extensible for new ranking sources and gives users control over how their playlists are prioritized.

## 3. Success Criteria
- [ ] **Decoupling**: Algorithms receive a list of "ranked" tracks without knowing *how* they were ranked.
- [ ] **Extensibility**: Adding a new ranking source (e.g., Last.fm scrobbles) should only require a new strategy class.
- [ ] **User Control**: The UI allows selecting a ranking preference (Balanced, Spotify, BEA) before generating playlists.
- [ ] **Algorithm Compatibility**: The ranking selection dynamically enables/disables compatible algorithms if necessary (per user feedback).

## 4. Requirement Overview
- A common interface for all Ranking Strategies.
- At least three initial strategies:
    1. **Balanced** (Current hybrid: Acclaim Rank > Rating > Score).
    2. **Spotify Priority** (Spotify Popularity as primary metric).
    3. **BEA Priority** (BestEverAlbums Rating/Rank as primary metric).
- UI integration in the Playlist Generation view.

## 5. Scope
- **In-Scope**:
    - Creation of the `RankingStrategy` architecture.
    - Implementation of the 3 strategies mentioned.
    - Modification of Algorithm inputs to accept these strategies.
    - UI Selectors in `PlaylistsView`.
- **Out-of-Scope**:
    - Scraping new data sources (we use existing enriched data).
    - Changing the core balancing logic of Cascading/Serpentine.

---

## User Review Required
> [!IMPORTANT]
> **Key Decision**: As per your feedback, choosing a ranking source should be the "gatekeeper" or the first step that determines which algorithms are available or how they behave. 

**Does this specification accurately capture the "WHAT" and "WHY" of the ranking strategy refactor?**
