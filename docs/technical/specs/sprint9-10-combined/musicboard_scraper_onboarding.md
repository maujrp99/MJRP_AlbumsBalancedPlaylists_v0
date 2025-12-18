# Musicboard Scraper - Onboarding Document

**Created**: 2025-12-17 17:51
**Status**: 🚧 In Progress (needs debugging)
**Assignee**: Agent B

---

## 📋 Context

We need a scraper for https://musicboard.app to extract track ratings as a secondary source after BestEverAlbums.

### Why Puppeteer?
- Musicboard is a **React SPA** - the HTML comes empty (`<div id="root"></div>`)
- Data is loaded via JavaScript after page render
- Cannot use simple `axios + cheerio` like BestEverAlbums

---

## 📁 Files Created

| File | Description |
|------|-------------|
| `server/lib/scrapers/musicboard.js` | Main scraper (~400 lines) |
| `server/scripts/testMusicboardScraper.js` | Test script |
| `server/scripts/debugMusicboard.js` | Debug script (captures HTML/screenshot) |

---

## 🐛 Current Issue

**Problem**: Scraper runs but extracts 0 tracks

```
[Musicboard] Navigating to https://musicboard.app/album/metallica-metallica/
[Musicboard] Track selector not found, trying alternative selectors
[Musicboard] Extracted 0 tracks
```

**Root Cause**: Generic CSS selectors are not matching Musicboard's actual DOM structure.

### What's Needed

1. **Run debug script** to capture actual page HTML:
   ```bash
   cd server && node scripts/debugMusicboard.js
   ```

2. **Analyze** `server/scripts/musicboard-debug.html` to find correct selectors

3. **Update** `extractTrackRatings()` in `musicboard.js` with correct selectors

---

## 📖 Reference: BestEver Scraper

See `server/lib/scrapers/besteveralbums.js` for pattern:
- Uses `axios + cheerio` (simpler because server-rendered)
- Returns format:
  ```javascript
  {
    provider: 'BestEverAlbums',
    providerType: 'community',
    referenceUrl: '...',
    evidence: [
      { trackTitle: 'Enter Sandman', rating: 94, position: 1 },
      ...
    ]
  }
  ```

---

## 🎯 Expected Output Format

Same structure as BestEver:

```javascript
{
  provider: 'Musicboard',
  providerType: 'community',
  referenceUrl: 'https://musicboard.app/album/...',
  evidence: [
    { trackTitle: 'Enter Sandman', rating: 4.2, position: 1 },
    { trackTitle: 'Sad But True', rating: 4.1, position: 2 },
    // Musicboard uses 0-10 scale (not 0-100 like BestEver)
  ]
}
```

---

## 🔧 Technical Notes

### Puppeteer v24 Changes
- `page.waitForTimeout()` is **DEPRECATED** ❌
- Use `delay()` helper instead (already added)

### Memory Issue
- Puppeteer tests were timing out due to Mac memory constraints
- Consider running with `--disable-dev-shm-usage` flag (already in config)

### URL Pattern
```
https://musicboard.app/album/{artist-slug}-{album-slug}/
Example: https://musicboard.app/album/metallica-metallica/
```

---

## ✅ Tasks

- [x] Create `musicboard.js` scraper skeleton
- [x] Add caching layer (1 hour TTL)
- [x] Create test script
- [x] Fix deprecated `waitForTimeout`
- [ ] **Debug actual DOM structure** (Run debugMusicboard.js)
- [ ] **Update CSS selectors** in `extractTrackRatings()`
- [ ] Verify with test albums (Metallica, Pink Floyd)
- [ ] Integrate with `fetchRanking.js` as secondary source

---

## 📌 Test Commands

```bash
# Run debug (captures HTML)
cd server && node scripts/debugMusicboard.js

# Run test scraper
cd server && node scripts/testMusicboardScraper.js
```

---

## 🔗 Integration Point

After scraper works, integrate in `server/lib/fetchRanking.js`:

```javascript
// After BestEver scraping, try Musicboard as fallback
if (!result || result.evidence.length === 0) {
  const musicboard = require('./scrapers/musicboard')
  result = await musicboard.getRankingForAlbum(title, artist)
}
```
