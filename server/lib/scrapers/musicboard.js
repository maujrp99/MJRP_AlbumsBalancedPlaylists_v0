/**
 * Musicboard Scraper
 * 
 * Puppeteer-based scraper for https://musicboard.app
 * Extracts track ratings from album pages.
 * 
 * Musicboard is a React SPA, so we need a headless browser to render the page
 * before extracting data from the DOM.
 * 
 * @see https://musicboard.app
 */

const puppeteer = require('puppeteer')

// Cache to avoid re-scraping the same album
const cache = new Map()
const CACHE_TTL_MS = 1000 * 60 * 60 // 1 hour

/**
 * Get cached result if available and not expired
 */
function getCached(key) {
    const entry = cache.get(key)
    if (!entry) return null
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        cache.delete(key)
        return null
    }
    return entry.data
}

/**
 * Set cache entry
 */
function setCache(key, data) {
    cache.set(key, { data, timestamp: Date.now() })
}

/**
 * Normalize string for comparison
 */
function normalize(str) {
    return (str || '')
        .toLowerCase()
        .replace(/\(.*?\)/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
}

/**
 * Create URL slug from artist and album name
 * Musicboard uses format: /album/{artist-slug}-{album-slug}/
 */
function createAlbumSlug(artist, album) {
    const artistSlug = normalize(artist).replace(/\s+/g, '-')
    const albumSlug = normalize(album).replace(/\s+/g, '-')
    return `${artistSlug}-${albumSlug}`
}

/**
 * Delay helper (replacement for deprecated page.waitForTimeout)
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Launch Puppeteer browser instance
 */
async function launchBrowser() {
    return puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1920,1080'
        ]
    })
}

/**
 * Get track ratings from Musicboard album page
 * 
 * @param {string} albumTitle - Album title
 * @param {string} albumArtist - Artist name
 * @returns {Promise<Object>} Rating data with evidence array
 */
async function getRankingForAlbum(albumTitle, albumArtist) {
    const cacheKey = `${normalize(albumArtist)}:${normalize(albumTitle)}`

    // Check cache first
    const cached = getCached(cacheKey)
    if (cached) {
        console.log(`[Musicboard] Cache hit for ${albumArtist} - ${albumTitle}`)
        return cached
    }

    console.log(`[Musicboard] Scraping ${albumArtist} - ${albumTitle}`)

    let browser = null

    try {
        // Try constructing URL directly first
        const slug = createAlbumSlug(albumArtist, albumTitle)
        const albumUrl = `https://musicboard.app/album/${slug}/`

        browser = await launchBrowser()
        const page = await browser.newPage()

        // Set user agent
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

        // Set viewport
        await page.setViewport({ width: 1920, height: 1080 })

        console.log(`[Musicboard] Navigating to ${albumUrl}`)

        // Navigate and wait for content
        const response = await page.goto(albumUrl, {
            waitUntil: 'networkidle2',
            timeout: 30000
        })

        // Check if page loaded successfully
        if (!response || response.status() !== 200) {
            console.log(`[Musicboard] Page not found or error: ${response?.status()}`)
            // Try search fallback
            return await searchAndScrape(browser, page, albumTitle, albumArtist)
        }

        // Wait for React to render the track list
        await page.waitForSelector('[class*="track"], [class*="song"], [data-testid*="track"]', {
            timeout: 10000
        }).catch(() => {
            console.log('[Musicboard] Track selector not found, trying alternative selectors')
        })

        // Give React a moment to hydrate
        await delay(2000)

        // Extract track ratings from the page
        const result = await extractTrackRatings(page, albumUrl)

        if (result && result.evidence && result.evidence.length > 0) {
            setCache(cacheKey, result)
            return result
        }

        // Try search fallback if direct URL didn't work
        return await searchAndScrape(browser, page, albumTitle, albumArtist)

    } catch (error) {
        console.error(`[Musicboard] Error scraping ${albumArtist} - ${albumTitle}:`, error.message)
        return { error: error.message }
    } finally {
        if (browser) {
            await browser.close()
        }
    }
}

/**
 * Search for album and scrape from search results
 */
async function searchAndScrape(browser, page, albumTitle, albumArtist) {
    try {
        const searchQuery = encodeURIComponent(`${albumArtist} ${albumTitle}`)
        const searchUrl = `https://musicboard.app/search/?q=${searchQuery}`

        console.log(`[Musicboard] Searching: ${searchUrl}`)

        await page.goto(searchUrl, {
            waitUntil: 'networkidle2',
            timeout: 30000
        })

        // Wait for search results
        await page.waitForSelector('[class*="result"], [class*="album"], a[href*="/album/"]', {
            timeout: 10000
        }).catch(() => {
            console.log('[Musicboard] No search results found')
        })

        await delay(2000)

        // Find and click album link
        const albumLink = await page.evaluate((targetTitle, targetArtist) => {
            const normalize = s => (s || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
            const target = normalize(targetTitle)
            const targetArt = normalize(targetArtist)

            const links = document.querySelectorAll('a[href*="/album/"]')
            for (const link of links) {
                const text = normalize(link.textContent)
                if (text.includes(target) || (targetArt && text.includes(targetArt))) {
                    return link.href
                }
            }
            return null
        }, albumTitle, albumArtist)

        if (!albumLink) {
            console.log('[Musicboard] No matching album found in search results')
            return { error: 'Album not found' }
        }

        console.log(`[Musicboard] Found album link: ${albumLink}`)

        await page.goto(albumLink, {
            waitUntil: 'networkidle2',
            timeout: 30000
        })

        await delay(2000)

        return await extractTrackRatings(page, albumLink)

    } catch (error) {
        console.error('[Musicboard] Search failed:', error.message)
        return { error: error.message }
    }
}

/**
 * Extract track ratings from the current page
 */
async function extractTrackRatings(page, albumUrl) {
    try {
        const data = await page.evaluate(() => {
            const evidence = []

            // Strategy 1: Look for track list containers
            const trackContainers = document.querySelectorAll(
                '[class*="track-list"], [class*="tracklist"], [class*="songlist"], ' +
                '[data-testid*="track"], [class*="TrackRow"], [class*="SongRow"]'
            )

            // Strategy 2: Look for individual track items
            const trackItems = document.querySelectorAll(
                '[class*="track-item"], [class*="song-item"], [class*="TrackItem"], ' +
                'tr[class*="track"], li[class*="track"], div[class*="track"]'
            )

            // Strategy 3: Look for tables with track data
            const tables = document.querySelectorAll('table')

            // Try extracting from track items
            const allItems = [...trackContainers, ...trackItems]

            for (const item of allItems) {
                // Look for track title
                const titleEl = item.querySelector(
                    '[class*="track-name"], [class*="song-name"], [class*="title"], ' +
                    '[class*="TrackName"], [class*="SongName"]'
                ) || item.querySelector('a') || item

                const title = (titleEl?.textContent || '').trim()
                if (!title || title.length < 2 || title.length > 200) continue

                // Look for rating
                let rating = null
                const ratingEl = item.querySelector(
                    '[class*="rating"], [class*="score"], [class*="average"], ' +
                    '[class*="Rating"], [class*="Score"]'
                )

                if (ratingEl) {
                    const ratingText = ratingEl.textContent.trim()
                    // Musicboard uses 0-10 scale typically, or percentage
                    const numMatch = ratingText.match(/(\d+\.?\d*)/)
                    if (numMatch) {
                        rating = parseFloat(numMatch[1])
                    }
                }

                // Avoid duplicates
                if (!evidence.find(e => e.trackTitle === title)) {
                    evidence.push({ trackTitle: title, rating })
                }
            }

            // Try tables as fallback
            if (evidence.length === 0) {
                for (const table of tables) {
                    const rows = table.querySelectorAll('tr')
                    for (const row of rows) {
                        const cells = row.querySelectorAll('td')
                        if (cells.length >= 2) {
                            const title = (cells[0]?.textContent || cells[1]?.textContent || '').trim()
                            if (!title || title.length < 2) continue

                            let rating = null
                            for (const cell of cells) {
                                const text = cell.textContent.trim()
                                const numMatch = text.match(/^(\d+\.?\d*)$/)
                                if (numMatch) {
                                    rating = parseFloat(numMatch[1])
                                    break
                                }
                            }

                            if (!evidence.find(e => e.trackTitle === title)) {
                                evidence.push({ trackTitle: title, rating })
                            }
                        }
                    }
                }
            }

            // Get album info from page
            const albumInfo = {
                title: document.querySelector('h1')?.textContent?.trim() || '',
                artist: document.querySelector('[class*="artist"], [class*="ArtistName"]')?.textContent?.trim() || ''
            }

            return { evidence, albumInfo }
        })

        // Clean up track titles
        const cleanedEvidence = data.evidence
            .map(e => ({
                trackTitle: e.trackTitle
                    .replace(/^\d+\.?\s*/, '') // Remove leading track numbers
                    .replace(/\s*\(.*?\)\s*$/, '') // Remove parentheticals at end
                    .trim(),
                rating: e.rating,
                position: data.evidence.indexOf(e) + 1
            }))
            .filter(e => e.trackTitle.length > 1)

        // Sort by rating if available
        cleanedEvidence.sort((a, b) => {
            if (a.rating === null && b.rating === null) return 0
            if (a.rating === null) return 1
            if (b.rating === null) return -1
            return b.rating - a.rating
        })

        console.log(`[Musicboard] Extracted ${cleanedEvidence.length} tracks`)

        return {
            provider: 'Musicboard',
            providerType: 'community',
            referenceUrl: albumUrl,
            evidence: cleanedEvidence
        }

    } catch (error) {
        console.error('[Musicboard] Failed to extract ratings:', error.message)
        return { error: error.message }
    }
}

/**
 * Get ranking from a specific Musicboard URL
 */
async function getRankingFromUrl(albumUrl) {
    let browser = null

    try {
        browser = await launchBrowser()
        const page = await browser.newPage()

        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
        await page.setViewport({ width: 1920, height: 1080 })

        await page.goto(albumUrl, {
            waitUntil: 'networkidle2',
            timeout: 30000
        })

        await delay(2000)

        return await extractTrackRatings(page, albumUrl)

    } catch (error) {
        console.error('[Musicboard] Error:', error.message)
        return { error: error.message }
    } finally {
        if (browser) {
            await browser.close()
        }
    }
}

/**
 * Clear the cache
 */
function clearCache() {
    cache.clear()
}

module.exports = {
    getRankingForAlbum,
    getRankingFromUrl,
    clearCache
}
