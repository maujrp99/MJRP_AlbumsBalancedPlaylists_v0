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
 * Create album URL from artist and album name
 * 
 * Musicboard URL pattern (discovered 2025-12-17):
 * https://musicboard.app/album/{album-slug}/{artist-slug}/
 * 
 * Examples:
 * - Metallica (self-titled): /album/metallica/metallica/
 * - Ride The Lightning: /album/ride-the-lightning/metallica/
 * - Nevermind: /album/nevermind/nirvana/
 */
function createAlbumUrl(artist, album) {
    const artistSlug = normalize(artist).replace(/\s+/g, '-')
    const albumSlug = normalize(album).replace(/\s+/g, '-')
    // Pattern: /album/{album-slug}/{artist-slug}/
    return `https://musicboard.app/album/${albumSlug}/${artistSlug}/`
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
        // Construct URL using correct pattern
        const albumUrl = createAlbumUrl(albumArtist, albumTitle)

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
 * 
 * CSS Selectors discovered via browser inspection (2025-12-17):
 * - Track row: div[class*="trackitem_container"]
 * - Track title: .link-overlay-title (or .link-overlay span.link-overlay-title)
 * - Track number: div[class*="trackitem_itemContainer"] p
 * - Rating: p tag containing decimal like "4.4"
 * 
 * NOTE: Musicboard uses 0-5 scale, we convert to 0-100 for consistency
 */
async function extractTrackRatings(page, albumUrl) {
    try {
        const data = await page.evaluate(() => {
            const evidence = []

            // Primary Strategy: Use actual Musicboard selectors (discovered 2025-12-17)
            // Musicboard uses CSS modules with hashed class names, so we use partial matching
            const trackRows = document.querySelectorAll('div[class*="trackitem_container"]')

            console.log(`[Musicboard] Found ${trackRows.length} track rows`)

            for (const row of trackRows) {
                // Extract track number
                const numberEl = row.querySelector('div[class*="trackitem_itemContainer"] p, div[class*="itemContainer"] p')
                const position = numberEl ? parseInt(numberEl.innerText.trim(), 10) : null

                // Extract track title (using link-overlay pattern)
                const titleEl = row.querySelector('.link-overlay-title') ||
                    row.querySelector('span.link-overlay-title') ||
                    row.querySelector('a.link-overlay')
                const title = titleEl ? titleEl.innerText.trim() : ''

                if (!title || title.length < 2) continue

                // Extract rating: format is "X.X / 5" (e.g., "4.4 / 5")
                // Class is "black" but that's not specific enough
                // Use regex to match "4.4 / 5" or just "4.4" patterns
                let rating = null
                const allParagraphs = row.querySelectorAll('p')
                for (const p of allParagraphs) {
                    const text = p.innerText.trim()

                    // Primary pattern: "4.4 / 5" format (discovered 2025-12-17)
                    const slashMatch = text.match(/^(\d+\.?\d*)\s*\/\s*\d+$/)
                    if (slashMatch) {
                        const ratingValue = parseFloat(slashMatch[1])
                        // Musicboard uses 0-5 scale, convert to 0-100
                        rating = Math.round(ratingValue * 20) // 4.4 -> 88
                        break
                    }

                    // Fallback: just decimal number like "4.4"
                    if (/^\d+\.\d+$/.test(text)) {
                        const ratingValue = parseFloat(text)
                        if (ratingValue >= 0 && ratingValue <= 5) {
                            rating = Math.round(ratingValue * 20)
                        } else if (ratingValue >= 0 && ratingValue <= 10) {
                            rating = Math.round(ratingValue * 10)
                        }
                        break
                    }
                }

                // Avoid duplicates
                if (!evidence.find(e => e.trackTitle === title)) {
                    evidence.push({
                        trackTitle: title,
                        rating,
                        position: position || evidence.length + 1
                    })
                }
            }

            // Fallback Strategy: Try original generic selectors if primary found nothing
            if (evidence.length === 0) {
                console.log('[Musicboard] Primary selectors failed, trying fallback...')

                // Look for any elements that might contain track data
                const fallbackItems = document.querySelectorAll(
                    '[class*="track"], [class*="song"], [class*="Track"], [class*="Song"]'
                )

                for (const item of fallbackItems) {
                    const text = item.innerText.trim()
                    if (text.length > 2 && text.length < 100) {
                        // Try to parse as track
                        const titleMatch = text.match(/^(?:\d+\.)?\s*(.+?)(?:\s+\d+\.\d+)?$/)
                        if (titleMatch && titleMatch[1]) {
                            const title = titleMatch[1].trim()
                            const ratingMatch = text.match(/(\d+\.\d+)/)
                            const rating = ratingMatch ? Math.round(parseFloat(ratingMatch[1]) * 20) : null

                            if (!evidence.find(e => e.trackTitle === title)) {
                                evidence.push({ trackTitle: title, rating, position: evidence.length + 1 })
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
                    .replace(/^\d+\.\s*/, '') // Remove leading track numbers like "1. "
                    .replace(/\s*\(.*?\)\s*$/, '') // Remove parentheticals at end
                    .trim(),
                rating: e.rating,
                position: e.position
            }))
            .filter(e => e.trackTitle.length > 1)

        // Sort by position (original tracklist order)
        cleanedEvidence.sort((a, b) => (a.position || 999) - (b.position || 999))

        console.log(`[Musicboard] Extracted ${cleanedEvidence.length} tracks`)

        if (cleanedEvidence.length > 0) {
            console.log('[Musicboard] Sample:', cleanedEvidence.slice(0, 3))
        }

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
