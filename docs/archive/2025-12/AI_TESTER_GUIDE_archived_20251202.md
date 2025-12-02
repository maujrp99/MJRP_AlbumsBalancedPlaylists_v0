# AI Tester Onboarding Guide

**Project**: MJRP Album Playlist Generator v2.0  
**Testing Framework**: Puppeteer  
**Last Updated**: 2025-12-01

---

## 🎯 Project Overview

This is a web application for creating balanced playlists from ranked albums. It uses:
- **Frontend**: Vite + Vanilla JavaScript (SPA with custom router)
- **Backend**: Node.js/Express + AI API proxy
- **Database**: Firebase Firestore
- **Ports**: 
  - Dev Server: `http://localhost:5000` (Vite dev - configured in vite.config.js)
  - Preview Server: `http://localhost:5005` (Vite preview)
  - Backend API: `http://localhost:3000`

---

## 🔧 Environment Setup

### Starting the Application

```bash
# Terminal 1: Backend Server
cd server && node index.js

# Terminal 2: Frontend Dev Server
npm run dev

# Terminal 3: Preview Server (for production-like testing)
npm run preview -- --port 5005
```

### Puppeteer Configuration

```javascript
const browser = await puppeteer.launch({
  headless: false, // Set to true for CI
  defaultViewport: { width: 1920, height: 1080 },
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const page = await browser.newPage();
await page.goto('http://localhost:5005'); // Use preview server
```

---

## 🚨 Known Critical Issues

### Issue #21: Sticky Playlists (CURRENTLY OPEN)

**Symptom**: When switching between series using the dropdown in PlaylistsView, playlists from the first series persist instead of clearing.

**Reproduction**:
1. Navigate to `/albums`
2. Select a series (e.g., "Greatest Hits tc1")
3. Click "Generate Playlists"
4. Switch to a different series (e.g., "tc2") using the dropdown
5. **Bug**: tc1 playlists remain visible instead of clearing

**Expected**: Playlists should clear or show empty state for the new series.

**Test Case**:
```javascript
// Navigate and generate playlists for series 1
await page.goto('http://localhost:5005/albums');
await page.click('[data-series-id="tc1"]'); // Adjust selector
await page.click('#generatePlaylistsBtn');
await page.waitForSelector('.playlist-column'); // Wait for playlists

// Capture series 1 playlists
const series1Playlists = await page.$$eval('.playlist-column', cols => 
  cols.map(col => col.querySelector('.playlist-name').textContent)
);

// Switch to series 2
await page.select('#seriesSelector', 'tc2'); // Dropdown in /playlists view
await page.waitForTimeout(2000); // Wait for transition

// Check if playlists cleared or changed
const series2Playlists = await page.$$eval('.playlist-column', cols => 
  cols.map(col => col.querySelector('.playlist-name').textContent)
);

// Assertion
console.assert(
  JSON.stringify(series1Playlists) !== JSON.stringify(series2Playlists),
  'ERROR: Playlists did not change when switching series!'
);
```

**Debug Logs**: Look for these console markers:
- `🔄 [PlaylistsView] ===== SERIES CHANGE START =====`
- `📦 [PlaylistsStore] setPlaylists called`
- `🚦 [Router] loadRoute called`
- `🧹 [BaseView] destroy called`

---

## 📋 Critical Test Flows

### Flow 1: Series Creation & Album Loading
```javascript
await page.goto('http://localhost:5005/home');
await page.click('#createSeriesBtn');
await page.type('#seriesName', 'Test Series');
await page.type('#albumQueries', 'OK Computer\nNevermind');
await page.click('#submitSeriesBtn');
await page.waitForSelector('.album-card');

const albums = await page.$$('.album-card');
console.assert(albums.length === 2, 'Expected 2 albums');
```

### Flow 2: Playlist Generation
```javascript
await page.goto('http://localhost:5005/albums');
await page.click('#generatePlaylistsBtn');
await page.waitForSelector('.playlist-column');

const playlists = await page.$$('.playlist-column');
console.assert(playlists.length > 0, 'No playlists generated');
```

### Flow 3: View Mode Toggle (AlbumsView)
```javascript
await page.goto('http://localhost:5005/albums');
await page.click('#toggleViewMode');
await page.waitForTimeout(500);

const expandedView = await page.$('#albumsList');
console.assert(expandedView !== null, 'Expanded view not rendered');
```

---

## 🔍 Key Selectors

### Navigation
- Home: `a[href="/home"]`
- Albums: `a[href="/albums"]`
- Playlists: `a[href="/playlists"]`

### Albums View
- Album Card: `.album-card`
- View Toggle: `#toggleViewMode`
- Generate Playlists: `#generatePlaylistsBtn`
- Search: `#albumSearch`

### Playlists View
- Series Selector: `#seriesSelector`
- Generate Button: `#generateBtn`
- Playlist Column: `.playlist-column`
- Track Item: `.track-item`

### Series Management
- Series Card: `.series-card`
- Create Series: `#createSeriesBtn`

---

## 📊 Test Assertions

### Data Integrity
- Albums match query count
- Tracks have ratings
- Playlists have balanced durations
- Series context is preserved

### UI State
- No duplicate albums (Ghost Albums)
- No mixed-series data
- Filters work correctly
- View modes persist

### Performance
- Page load < 2s
- Navigation < 500ms
- API calls complete < 5s

---

## 🐛 Debugging Tips

1. **Enable Verbose Logging**: Check console for emoji-prefixed logs:
   - 🔄 = View lifecycle
   - 📦 = Store operations
   - 🚦 = Router actions
   - 🧹 = Cleanup/destroy

2. **Check Network Tab**: 
   - API calls to `/api/albums` should not fail
   - Firebase auth should succeed

3. **Local Storage**:
   ```javascript
   await page.evaluate(() => localStorage.clear());
   await page.reload();
   ```

4. **Take Screenshots on Failure**:
   ```javascript
   if (testFailed) {
     await page.screenshot({ path: `./error-${Date.now()}.png` });
   }
   ```

---

## 📁 Project Structure

```
public/
├── js/
│   ├── views/          # View components (AlbumsView, PlaylistsView)
│   ├── stores/         # State management (albumsStore, playlistsStore)
│   ├── api/            # API client
│   ├── router.js       # SPA router
│   └── app.js          # Entry point
├── css/
└── index-v2.html       # Main HTML

server/
└── index.js            # Backend API

docs/
└── debug/
    └── DEBUG_LOG.md    # Issue tracking
```

---

## 🎓 Best Practices

1. **Wait for Elements**: Always use `waitForSelector` before interacting
2. **Avoid Fixed Timeouts**: Use `waitForFunction` when possible
3. **Clean State**: Reset localStorage between test suites
4. **Screenshot Evidence**: Capture before/after states
5. **Console Logs**: Monitor for errors and warnings
6. **Test Isolation**: Each test should be independent

---

## 📞 Support

- **Debug Log**: `/docs/debug/DEBUG_LOG.md`
- **Architecture**: `/docs/ARCHITECTURE.md`
- **Task Tracking**: `/.gemini/antigravity/brain/.../task.md`

Good luck! 🚀
