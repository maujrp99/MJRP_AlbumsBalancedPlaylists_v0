# Album Data Schema Definition (v1.1)
> **Active Reference**: Defines the shape of Album, Series, and Ranking objects in the application.
> **Source of Truth**: `public/js/models/Album.js` & `server/schema/album.schema.json`.

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

## 3. Series document
A series is a named list of album queries. Path: `artifacts/mjrp-albums/users/{uid}/curator/data/series/{seriesId}`. The albums themselves are not stored: they are resolved from the queries when the screen loads.

```javascript
{
  "name": "string (e.g., 'Robert Plant 80-90s')",
  "albumQueries": [
    // either plain text: "Artist - Title"
    // or the album the person chose in Home:
    {
      "artist": "string",
      "title": "string",              // some older entries use "album"
      "year": "string",
      "coverUrl": "string",
      "appleMusicId": "string",       // the chosen edition; the load uses it first, and corrects it (F55)
      "facts": {                      // v4.0, written by the app after the album loads
        "year": "number | null",
        "sources": { "acclaim": "boolean", "popularity": "boolean" },
        "checkedAt": "number (ms)"
      }
    }
  ],
  "status": "string",
  "notes": "string",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

*   `facts` is a copy for the filters; the loaded album is the authority. A query without `facts` has not been checked yet.
*   `appleMusicId` is checked on every load: the album it leads to has to be the album asked for (`artist`, `title`), by the identity rule. When it is not (or the id is gone) and the album asked for is found by name, the app writes the new id here, with `coverUrl` and `year` of the loaded album when the query stores them (F55, slice 2; `SeriesFactsService`, in the same write as `facts`). The app never changes `artist` or `title`.
*   The person's own track ranking is not in the series: it lives in `users/{uid}/albumRankings/{albumId}`.
*   The album id is the slug `artist_title` (`api/client.js`, `generateAlbumId`), not a UUID or a Spotify id.

## 4. Ranking Object (`rankingConsolidated`)
The track acclaim merged from multiple sources, as returned by `consolidateRanking` (`server/lib/ranking.js`) in the response of `POST /api/generate`.

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
