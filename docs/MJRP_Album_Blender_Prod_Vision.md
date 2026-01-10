# MJRP "The Album Blender" - Product Vision

**Version**: 3.0 (Draft)
**Date**: 2025-12-21
**Status**: Living Document

---

## 1. 🏛️ Core Philosophy (The Foundation)

We aim to rescue the deep appreciation of music in an era of superficial consumption. "The Album Blender" is not just a tool; it's a manifesto for active listening.

*   **Complementary Intelligence**: We are not a streaming platform. We are the **intelligence layer** that sits above them. Spotify and Apple Music are the players (output); we are the curators (input).
*   **User Sovereignty**: We empower the user to transcend algorithmic bubbles, offering tools to curate, organize, and sequence their music with precision.
*   **The "Album Blender" Concept**: A mixer that takes raw data (albums, ratings, popularity) and blends them into a coherent, balanced listening experience.

---

## 2. 🚀 The Pivot: Strategic Evolution

We are maintaining our **"Album-Centric"** core while effectively satisfying a broader audience by supporting other entities as entry points.

### 2.2. The Universal "Series" Model (Core Concept)
Every curation action creates a **Series**. The "Series" is the fundamental unit of context.

1.  **Album Series Flow**: "I want to curate a specific set of albums." (The Classic Flow).
    *   *Action*: Select Albums -> Create `AlbumSeries` -> Blending Menu -> Generate Playlist.
2.  **Artist Series Flow**: "I want to curate an Artist's discography."
    *   *Action*: Select Artist -> Create `ArtistSeries` (Auto-Populated) -> Blending Menu -> Generate Playlist.
    *   *Note*: The system treats the Artist context as a dynamic Series.
3.  **Genre Series Flow**: "I want to curate a specific Vibe/Genre."
    *   *Action*: Select Genre -> Create `GenreSeries` -> Blending Menu -> Generate Playlist.
4.  **Track Series Flow (Singles)**: "I want to blend specific loose tracks/singles."
    *   *Action*: Select Singles/Tracks -> Create `TrackSeries` -> Blending Menu -> Generate Playlist.

**The Golden Pipeline**: `Entity Series` -> `Blending Menu` (Algorithm) -> `Playlist`.
*   **Inventory**: Remains a separate utility for collectors to manage their "Pool" of albums.


---

## 3. 🧠 Smart Data Sources (The Brain)

Our recommendations are grounded in a triangulation of specific data points to ensure quality and relevance:

1.  **Human Curation (Critical Acclaim)**:
    *   **BestEverAlbums (BEA)**: Deep user ratings and charts.
*   **Album of The Year (AOTY)**: The "Critic's Choice" signal. Used to identify "Must-Haves".
*   **Spotify Popularity (The Crowd)**: The "Mass Appeal" signal. Measures current track popularity (0-100) to distinguish "Hits" from "Deep Cuts".
*   **Artificial Intelligence (Planned)**: The "Vibe" signal. Used for semantic understanding and genre classification.

---

## 4. 🎨 UX Reframing: "Mix Styles"

We are eliminating technical friction. The term "Algorithm" is forbidden in user-facing UI. "Recipe" is the preferred term for algorithmic strategies.

### "The Blending Menu" & Parametrization
To enable a true "Menu" experience, the algorithms must be highly parametrized. The user configures the "Order", and the kitchen (Algorithm) cooks it.

**Required Parameters (The Inputs)**:
*   **Ranking Logic**: (e.g., "Spotify Pop", "AOTY", "BEA", "Balanced Mix").
*   **Scope**: (e.g., "Top 10 Tracks", "3 Tracks per Album").
*   **Constraints**: (e.g., "Max 3 Hours", "Min 2 Tracks").
*   **Output Format**: (e.g., "Single Playlist", "One Playlist per Series").

### Flexible Output
*   **Single Playlist**: The consolidated "Best Of".
*   **Multiple Playlists (Series)**: Breaking down large collections (e.g., "The Experimental Years", "The Pop Years").

## 6. The Blending Menu Metaphor
The Blending Menu is the heart of the experience, designed around a "Restaurant" metaphor:

1.  **"Choose your Blend"**: A filter/dropdown to select the Entity (Core Ingredient).
2.  **"Pick your Ingredients"**: Parametrization section for the algorithm (Duration, Discovery Mode, # of Playlists).
3.  **"Cook"**: The "Blend It" action that generates the final playlist(s).

---

## 5. 📱 Architectural Imperative: Responsive Componentization

We need a robust experience on both Desktop (Power User) and Mobile (Consumption).

*   **Strategy**: "Write Once, Adapt Everywhere".
*   **Desktop Focus**: Drag & drop organization, dense information grids, "Power Menu" visibility.
*   **Mobile Focus**: Touch targets, simplified "consumption" views, bottom-sheet menus.
*   **Implementation**: A UI Component Library that renders adaptive layouts based on screen context.

---

