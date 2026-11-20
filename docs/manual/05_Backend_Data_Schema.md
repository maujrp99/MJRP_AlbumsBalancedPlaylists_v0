# Album Data Schema Definition (v1.1)
> **Active Reference**: Defines the shape of Album, Series, and Ranking objects in the application.
> **Source of Truth**: `public/js/models/Album.js` & `server/schema/album.schema.json`.
> The Firestore documents (series with `albumQueries`, own rankings) are described in `32_Data_Schema_Reference.md`.

## 1. Album Object (`Album.js`)
The core domain entity representing a music album. The frontend model bifurcates tracks into two lists.

```javascript
{
  "id": "string (slug: artist_title)",
  "title": "string",
  "artist": "string",
  "year": "string | number", 
  "coverUrl": "string (Primary Display Image)",
  
  // Track Collections (The Dual-List Pattern)
  "tracks": ["Track Object"] // (Default: Ranked by Acclaim),
  "tracksOriginalOrder": ["Track Object"] // (Disc Order 1..N),

  // Metadata & Enrichment
  "bestEverAlbumId": "string | null",
  "bestEverUrl": "string | null",
  "acclaim": "object",
  
  // Spotify Specifics
  "spotifyId": "string | null",
  "spotifyUrl": "string | null",
  "spotifyPopularity": "number (0-100)",
  "spotifyImages": [
      { "url": "string", "height": "number", "width": "number" }
  ],

  // Generic Metadata Bag
  "metadata": "object"
}
```

## 2. Track Object (`Track.js`)
Individual song entity.

```javascript
{
  "id": "string",
  "title": "string",
  "artist": "string", // Contextual inheritance from Album
  
  "album": "string", // Contextual inheritance from Album

  // Sorting Metrics
  "acclaimRank": "number | null", // Acclaim Rank (1 = Highest)
  "rank": "number | null", // Alias of acclaimRank
  "acclaimScore": "number | null",
  "rating": "number | null",
  "position": "number | null", // Disc Position (1 = First Track)
  "spotifyRank": "number | null",
  "spotifyPopularity": "number (0-100) | null", // Spotify Pop Index

  // Audio Properties
  "duration": "number (seconds)",
  "previewUrl": "string (URL | null)",

  // Platform ids
  "spotifyId": "string | null",
  "spotifyUri": "string | null",
  "appleMusicId": "string | null",
  "isrc": "string | null",

  "originAlbumId": "string | null",
  "metadata": "object"
}
```

## 3. Series Object (`Series.js`)

> **F65 (2026-11-19):** the class `public/js/models/Series.js` was removed (no module imported it). The shape below is still the one the app keeps in memory for a series, as plain objects.
The in-memory model: a named collection of `Album` objects. The stored series document has a different shape (a list of `albumQueries`); see `32_Data_Schema_Reference.md`, section 3.

```javascript
{
  "id": "string (UUID)",
  "name": "string (e.g., 'Pink Floyd Studio')",
  "description": "string",
  "createdAt": "string (ISO date)",
  "albums": ["Album Object"]
}
```

## 4. Ranking Object (`rankingConsolidated`)
The track acclaim merged from multiple sources, as returned by `consolidateRanking` (`server/lib/ranking.js`) in the response of `POST /api/generate`. Beside it, since F52 (slice 5), the response carries `ratings: { acclaim, popularity, aiRanking }`: what happened to each source of ratings (`found`, `not_found`, `no_ratings`, `not_configured`, `failed`, `not_asked`), so an album with no ratings is told apart from one whose ratings could not be fetched (`03_Backend_API_Layer.md`).

```javascript
[
  {
    "trackTitle": "string (title as in the album tracklist)",
    "finalPosition": "number (1-N)",
    "rating": "number | null (BestEverAlbums rating preferred)",
    "rawScore": "number (Borda points)",
    "normalizedScore": "number (rawScore / (N * providers))",
    "supporting": [
      {
        "provider": "string (e.g. 'BestEverAlbums', 'Spotify')",
        "position": "number | null",
        "referenceUrl": "string",
        "rating": "number | null"
      }
    ]
  }
]
```
