# E2E Testing with Puppeteer

Automated end-to-end tests for the MJRP Albums Balanced Playlists application.

## Quick Start

```bash
# Run all E2E tests (headless mode)
npm run test:e2e

# Run with visible browser (for debugging)
npm run test:e2e:headful

# Run with slow motion (500ms delays between actions)
SLOW_MO=500 npm run test:e2e:headful
```

## Test Suites

### 1. **Smoke Test** (`smoke.test.js`)
Basic functionality verification:
- App loads at `http://localhost:5005`
- Header and logo are present
- Navigation works
- Pages render correctly

### 2. **Issue #15: Ghost Albums** (`issue-15-ghost-albums.test.js`)
Verifies fix for ghost albums appearing when switching series:
- Creates two series with different albums
- Switches between series
- Verifies no albums from previous series persist

**Reference**: `docs/debug/DEBUG_LOG.md` Issue #15

### 3. **Issue #16: View Toggle** (`issue-16-view-toggle.test.js`)
Verifies view mode toggle functionality:
- Switches between Grid and List views
- Checks for album duplication
- Verifies persistence after page reload

**Reference**: `docs/debug/DEBUG_LOG.md` Issue #16

## Project Structure

```
test/e2e/
├── setup.js              # Browser launch & utilities
├── helpers.js            # App-specific selectors & helpers
├── run-all.js            # Test runner
├── smoke.test.js         # Smoke tests
├── issue-15-*.test.js    # Issue-specific tests
├── issue-16-*.test.js
└── screenshots/          # Test screenshots
```

## Writing New Tests

### Basic Test Template

```javascript
const { launchBrowser, createPage, closeBrowser } = require('./setup');
const { navigateTo } = require('./helpers');

async function testMyFeature() {
    let browser;
    try {
        browser = await launchBrowser();
        const page = await createPage(browser);
        
        await navigateTo(page, '/albums');
        
        // Your test logic here
        const element = await page.$('#myElement');
        if (element) {
            console.log('✅ PASS: Element found');
        }
        
    } finally {
        await closeBrowser(browser);
    }
}
```

### Available Helpers

See `helpers.js` for:
- `SELECTORS` - Common CSS selectors
- `navigateTo(page, path)` - Navigate to a page
- `createSeries(page, name, albums)` - Create a new series
- `getAlbumCount(page)` - Get number of displayed albums
- `getAlbumTitles(page)` - Get all album titles
- `waitForAlbumsLoaded(page, count)` - Wait for albums to finish loading

## Environment Variables

- `HEADLESS=false` - Run with visible browser
- `SLOW_MO=500` - Add 500ms delay between actions (for debugging)
- `BASE_URL=http://localhost:5005` - Change base URL (default: localhost:5005)

## Debugging

### Take Screenshots

```javascript
const { takeScreenshot } = require('./setup');
await takeScreenshot(page, 'my-test-step');
// Saves to: test/e2e/screenshots/my-test-step-TIMESTAMP.png
```

### View Browser Console

Console logs from the browser are automatically piped to terminal output.

### Slow Motion Mode

```bash
SLOW_MO=1000 npm run test:e2e:headful
```

## Integration with Debug Protocol

Test failures should be logged in `docs/debug/DEBUG_LOG.md` following the protocol:

1. Run tests
2. If test fails, note the issue
3. Log in DEBUG_LOG.md with:
   - Issue number
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshot reference

## Future Enhancements

- [ ] Issue #19 test (Series switching with same count)
- [ ] Issue #21 test (Sticky playlists)
- [ ] UI Components test (modals, banners)
- [ ] GitHub Actions CI integration
- [ ] Test coverage reporting
- [ ] Performance testing with Lighthouse
