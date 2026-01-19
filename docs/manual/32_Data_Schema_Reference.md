# Album Data Schema Definition (v1.1)
> **Active Reference**: Defines the shape of Album, Series, and Ranking objects in the application.
> **Source of Truth**: `public/js/models/Album.js` & `server/schema/album.schema.json`.

## 1. Album Object (`Album.js`)
The core domain entity representing a music album. The frontend model bifurcates tracks into two lists.

```javascript
{
  "id": "string (UUID or SpotifyID)",
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
  
  // Sorting Metometrics
  "rank": "number", // Acclaim Rank (1 = Highest)
  "position": "number", // Disc Position (1 = First Track)
  "popularity": "number (0-100)", // Spotify Pop Index
  "rating": "number (0-100)", // Legacy BEA Rating (Backward Comp)

  // Ranking & Evidence (Sprint 23+)
  "ranking": {
      "rank": "number",
      "evidence": [
          {
              "source": "string ('BestEverAlbums' | 'Spotify')",
              "score": "number",
              "votes": "number | null",
              "url": "string | null"
          }
      ]
  },
  
  // Audio Properties
  "durationMs": "number",
  "previewUrl": "string (URL | null)",
  
  // Physical Metadata
  "discNumber": "number (Default: 1)",
  "trackNumber": "number"
}
```

## 3. Series Object (`Series.js`)
A collection of albums (Discography) with curation scope.

```javascript
{
  "id": "string (UUID)",
  "name": "string (e.g., 'Pink Floyd Studio')",
  "type": "string ('artist' | 'curated')",
  "albumIds": ["string"],
  "createdAt": "timestamp",
  "settings": {
    "excludeLive": "boolean",
    "excludeCompilations": "boolean"
  }
}
```

## 4. Ranking Object (`rankingConsolidated`)
The source-of-truth for track acclaim, merged from multiple sources.

```javascript
[
  {
    "trackTitle": "string (Normalized)",
    "finalScore": "number (0-100)",
    "position": "number (1-N)",
    "sources": [
      {
        "provider": "string ('besteveralbums' | 'spotify' | 'ai')",
        "rawScore": "number",
        "weight": "number (float)"
      }
    ],
    "meta": {
      "isInstrumental": "boolean",
      "isLive": "boolean"
    }
  }
]
```
