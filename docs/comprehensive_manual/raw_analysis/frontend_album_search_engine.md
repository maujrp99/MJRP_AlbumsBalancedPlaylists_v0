# Deep Dive: Album Search & Classification Engine (Batch 11)

This document covers the **Search Pipeline** and the sophisticated **Classification System** used to distinguish "Studio Albums" from Singles, EPs, and Compilations, particularly for Electronic Music.

## 1. Album Search Service (`public/js/services/album-search/AlbumSearchService.js`)
*   **Role**: The orchestrator for finding albums via the Apple Music API.
*   **Architecture**: Implements a Multi-Strategy Search.
    *   **Strategy 1**: Direct Search using Normalized Artist Name.
    *   **Fallback**: If confidence is low, tries "Alternative Artist Names" (e.g. `Anjunabeats` vs `Anjunabeats Worldwide`).
    *   **Scoring**: Uses `ScoreCalculator` to sort results.
*   **Integration**: Connects `MusicKitService` (Raw API) with `AlbumTypeClassifier` (Logic).

## 2. The Classification Pipeline (`AlbumTypeClassifier.js`)
*   **Pattern**: **Chain of Responsibility** (Funnel Model) with **Feedback Loop**.
*   **Goal**: To solve the "Electronic Music Problem" where Apple Music misclassifies almost all Singles/EPs as "Albums".
*   **The Feedback Loop (Scorecard Pattern)**:
    *   Unlike a standard Chain of Responsibility that exits on the first match, this pipeline allows "Preliminary Classifications".
    *   If `RemixTracks` or `TrackCount` identifies an album as "EP", it doesn't return immediately if the genre is **Electronic**.
    *   Instead, it carries this `preliminaryType` forward to the **AIWhitelistStrategy** (Judgment Day).
    *   This allows the AI to say "I know you think it's an EP because it has 6 tracks, but I have it on my list of Studio Albums, so I am overruling you."

### Pipeline Stages:
    1.  **AppleMetadataStrategy**: Checks if Apple explicitly calls it a "Single" or "Compilation".
    2.  **TitleKeywordStrategy**: Regex checks for keywords like "Live", "EP", "Mix", "Remixes".
    3.  **GenreGateStrategy (Bifurcation Point)**:
        *   If **Non-Electronic** (Rock, Jazz, Pop): Trust the metadata immediately (Exit).
        *   If **Electronic**: Continue down the funnel (Entrance to Heuristics).
    4.  **RemixTracksStrategy**: Analyzes the tracklist. If >50% of tracks are remixes, it's a Single/EP.
    5.  **TrackCountStrategy**: Heuristic based on track count (< 4 = Single, 4-6 = EP).
    6.  **AIWhitelistStrategy ("Judgment Day")**
        *   **Role**: The final arbiter for Electronic Music. Due to Apple Music's tendency to split electronic albums into "Singles" or "EPs" based on track count or duration (erroneously), this strategy consults a **Curated/AI-Generated Whitelist** of known Studio Albums for the artist.
        *   **Lazy Loading Architecture**:
            *   Does *not* fetch the whitelist for every album.
            *   Only fetches if the album is identified as **Electronic** (via `GenreGateStrategy`) AND reaches this stage in the pipeline.
            *   Uses the `context.getAiList()` callback to fetch (and cache) the artist's studio discography from the server `/api/ai/studio-albums`.
        *   **Matching Logic**:
            1.  **Exact Match**: Comparison of normalized titles.
            2.  **Fuzzy Token Match**: If exact match fails, it splits titles into tokens (checking if all words in the whitelist title exist in the target album title).
        *   **The "Rescue" Mechanism (Feedback Loop)**:
            *   If a previous strategy (e.g., `TrackCountStrategy`) classified an album as "EP" or "Single", but it appears in the **Studio Album Whitelist**, this strategy attempts to **OVERRIDE** the classification back to "Album".
        *   **Safety Net (`_isSafeToRescue`)**:
            *   **Problem**: "Album Title - Single" often fuzzy-matches "Album Title". We don't want to classify the Single as the Album.
            *   **Solution**: The `_isSafeToRescue(albumTitle, matchedAiTitle)` method enforces a strict "Risk Table".
            *   **The Risk Table**: keywords like `Single`, `EP`, `Remix`, `Mix`, `Live`, `Vol.`, `Compilation`, `Club`.
            *   **Rule**: If the candidate album title contains a "Risk Word" (e.g., "Club Mix") but the Whitelist Title *does not*, the Rescue is **BLOCKED**.
        *   **Blocked Rescue Fallback**:
            *   If a rescue is blocked (e.g., it matched but was unsafe), the system explicitly downgrades it to `Compilation` or `EP` to be safe, rather than leaving it ambiguous.
    7.  **TypeSanityCheckStrategy (Post-Process)**:
        *   A final safety net. Even if AI says "Album", if the title says "EP", we force downgrade it.

## 3. Strategies Deep Dive

### Score Calculator (`ScoreCalculator.js`)
*   **Algorithm**: Weighted Average of Levenshtein Distance.
*   **Weights**: Title (60%), Artist (40%).
*   **Penalties**: Applies penalties for "Deluxe", "Live", or "Compilation" unless explicitly requested by the user.

### Electronic Genre Detector (`ElectronicGenreDetector.js`)
*   **Role**: The source of truth for what constitutes "Electronic Music".
*   **Logic**: Contains a comprehensive whitelist of genres (`house`, `trance`, `dubstep`, `techno`, etc.). Used by `GenreGateStrategy`.

### AI Whitelist Strategy (`AIWhitelistStrategy.js`)
*   **Feedback Loop**: Implements a "Rescue" mechanism.
*   **Logic**:
    *   Fetching is lazy/async.
    *   Supports **Exact Match** and **Fuzzy Token Match**.
    *   **Safety Logic Example**:
        ```javascript
        // Conceptual Logic
        if (matchedInWhitelist) {
            if (_isSafeToRescue(albumTitle, whitelistTitle)) {
                 return "Album"; // OVERRIDE previous "EP" classification
            } else {
                 return "EP"; // BLOCK rescue (e.g. "Club Mix" matched "Original")
            }
        }
        ```
    *   **Safety Check**: `_isSafeToRescue` ensures we don't accidentally promote a "Single" just because the album name matches the studio album name (common in generic titles).

## 4. Key Takeaways for Synthesis
*   **Specialization**: The system is highly specialized for Electronic Music but explicitly "Gates" other genres to standard metadata to avoid over-engineering.
*   **Robustness**: The pipeline uses multiple "Safety Nets" (Sanity Check, Rescue Logic) to prevent AI hallucinations from breaking the library.
*   **Modularity**: Adding a new specific rule (e.g. for "DJ Mixes") is as simple as adding a new Strategy class and inserting it into the pipeline array.
