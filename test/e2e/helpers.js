/**
 * E2E Test Helpers
 * Common selectors, navigation helpers, and test utilities specific to the MJRP app
 */

export const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// Common Selectors
export const SELECTORS = {
    // Navigation
    nav: {
        home: 'a[href="/home"]',
        albums: 'a[href="/albums"]',
        playlists: 'a[href="/playlists"]',
        blend: 'a[href="/blend"]',
        inventory: 'a[href="/inventory"]'
    },

    // Home View
    home: {
        seriesInput: '#albumList, #albumQueries',
        loadButton: 'button:has-text("Load Albums"), button:has-text("🚀")',
        recentSeries: '.series-card',
        continueButton: 'button:has-text("Continue")'
    },

    // Albums View
    albums: {
        grid: '#albumsGrid',
        list: '#albumsList',
        albumCard: '.album-card',
        viewToggle: 'button:has-text("View"), button[title*="View"]',
        searchInput: '#albumSearch, input[placeholder*="Search"]',
        refreshButton: 'button:has-text("Refresh")'
    },

    // Playlists View
    playlists: {
        container: '.playlists-container',
        playlist: '.playlist-column',
        track: '.track-item',
        seriesSelector: '#seriesSelector, select[name="series"]',
        generateButton: 'button:has-text("Generate")'
    },

    // Blending Wizard
    blend: {
        seriesSelector: '#blend-series-selector',
        seriesCard: '.blend-series-card',
        recipeCard: '.blend-recipe-card',
        ingredientsPanel: '#blend-ingredients-panel',
        generateButton: '#blend-generate-btn',
        results: '#blend-results'
    },

    // Common UI
    common: {
        header: 'header',
        logo: 'img[alt*="Logo"], .logo',
        modal: '.modal, [role="dialog"]',
        modalClose: '.modal-close, button[aria-label="Close"]',
        debugPanel: '#debugPanel, .debug-panel'
    }
};

/**
 * Navigate to a specific page
 * @param {Page} page - Puppeteer page
 * @param {string} path - Path to navigate to (e.g., '/albums')
 */
export async function navigateTo(page, path) {
    const url = `${BASE_URL}${path}`;
    await page.goto(url, { waitUntil: 'networkidle0' });
    console.log(`✓ Navigated to: ${url}`);
}

/**
 * Wait for albums to finish loading
 * @param {Page} page - Puppeteer page
 * @param {number} expectedCount - Expected number of albums (optional)
 */
export async function waitForAlbumsLoaded(page, expectedCount = null) {
    // Wait for either grid or list container
    await page.waitForSelector('#albumsGrid, #albumsList', { timeout: 10000 });

    // Wait for album cards to appear
    await page.waitForSelector('.album-card', { timeout: 10000 });

    // If expected count provided, verify
    if (expectedCount !== null) {
        await page.waitForFunction(
            (count) => document.querySelectorAll('.album-card').length === count,
            { timeout: 5000 },
            expectedCount
        );
    }

    console.log('✓ Albums loaded');
}

/**
 * Get album count from the page
 * @param {Page} page - Puppeteer page
 * @returns {Promise<number>} Number of albums displayed
 */
export async function getAlbumCount(page) {
    const count = await page.$$eval('.album-card', cards => cards.length);
    return count;
}

/**
 * Get album titles from the page
 * @param {Page} page - Puppeteer page
 * @returns {Promise<string[]>} Array of album titles
 */
export async function getAlbumTitles(page) {
    const titles = await page.$$eval('.album-card', cards =>
        cards.map(card => {
            const titleEl = card.querySelector('h3, .album-title, [class*="title"]');
            return titleEl ? titleEl.textContent.trim() : '';
        }).filter(t => t)
    );
    return titles;
}

/**
 * Create a new series with albums
 * @param {Page} page - Puppeteer page
 * @param {string} seriesName - Name of the series
 * @param {string[]} albums - Array of "Artist - Album" strings
 */
export async function createSeries(page, seriesName, albums) {
    await navigateTo(page, '/');

    // Fill in series name
    const seriesNameInput = await page.$('#seriesNameInput');
    if (seriesNameInput) {
        // Clear existing value if any
        await seriesNameInput.click({ clickCount: 3 });
        await seriesNameInput.type(seriesName);
    } else {
        console.warn('⚠️ Could not find #seriesNameInput');
    }

    // Switch to Bulk Mode
    const bulkBtn = await page.$('#btnModeBulk');
    if (bulkBtn) {
        await bulkBtn.click();
        await new Promise(r => setTimeout(r, 500)); // Animation
    }

    // Fill in albums (Bulk Input)
    const albumsText = albums.join('\n');
    const bulkInput = await page.$('#bulkPasteInput');
    if (bulkInput) {
        await bulkInput.click();
        await bulkInput.type(albumsText);
    } else {
        console.error('❌ Could not find #bulkPasteInput');
        return;
    }

    // Process List
    const processBtn = await page.$('#btnProcessBulk');
    if (processBtn) {
        await processBtn.click();
        // Wait for staging area to fill (simple pause or check count)
        await new Promise(r => setTimeout(r, 1000));
    }

    // Initialize Load Sequence
    const initBtn = await page.$('#btnInitializeLoad');
    if (initBtn) {
        await initBtn.click();
    } else {
        console.error('❌ Could not find #btnInitializeLoad');
    }

    // Wait for navigation to albums page
    try {
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
        // Double check we are on /albums
        const url = page.url();
        if (!url.includes('/albums')) {
            console.warn(`⚠️ Navigation might have failed, current URL: ${url}`);
        }
    } catch (e) {
        // May not navigate immediately - wait using standard Promise
        console.warn('⚠️ waitForNavigation timed out, continuing...');
        await new Promise(r => setTimeout(r, 2000));
    }

    console.log(`✓ Created series: ${seriesName}`);
}

/**
 * Switch between series using the selector/dropdown
 * @param {Page} page - Puppeteer page
 * @param {string} seriesName - Name of series to switch to
 */
export async function switchSeries(page, seriesName) {
    // Try dropdown/select first
    const selector = await page.$(SELECTORS.playlists.seriesSelector);
    if (selector) {
        await selector.select(seriesName);
        await new Promise(r => setTimeout(r, 1000)); // Wait for state update
        console.log(`✓ Switched to series: ${seriesName}`);
        return;
    }

    // Alternative: Navigate home and click series card
    await navigateTo(page, '/');
    const seriesCard = await page.$(`text="${seriesName}"`);
    if (seriesCard) {
        await seriesCard.click();
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        console.log(`✓ Switched to series: ${seriesName}`);
    }
}

/**
 * Get debug panel info (if visible)
 * @param {Page} page - Puppeteer page
 * @returns {Promise<object|null>} Debug panel data
 */
export async function getDebugInfo(page) {
    const debugPanel = await page.$(SELECTORS.common.debugPanel);
    if (!debugPanel) return null;

    const text = await debugPanel.evaluate(el => el.textContent);
    return { text };
}


