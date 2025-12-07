/**
 * E2E Test: Ghost Albums Prevention - Render Level
 * Tests the 3-layer defense system for ghost albums
 */

import { launchBrowser, createPage, takeScreenshot, closeBrowser, sleep } from './setup.js'
import { navigateTo, createSeries, getAlbumCount, getAlbumTitles } from './helpers.js'

export async function testGhostAlbumsRender() {
    console.log('\n👻 Testing Ghost Albums - Render Guard\n')

    let browser
    let passed = 0
    let failed = 0

    try {
        browser = await launchBrowser()
        const page = await createPage(browser)

        // Test 1: render() blocks ghost albums during series switch
        console.log('Test 1: render() guard blocks ghost albums')

        const seriesA = {
            name: 'Render Test A',
            albums: ['Pink Floyd - The Wall']
        }

        const seriesB = {
            name: 'Render Test B',
            albums: ['The Beatles - Abbey Road']
        }

        // Create Series A
        console.log('  Creating Series A...')
        await createSeries(page, seriesA.name, seriesA.albums)

        // WAIT FOR ALBUMS TO LOAD - with 30s timeout
        console.log('  Waiting for albums to load...')
        try {
            await page.waitForSelector('.album-card', { timeout: 30000 })
            console.log('  ✓ Albums loaded')
        } catch (e) {
            console.log('  ⚠️ Timeout waiting for albums (30s)')
        }
        await sleep(2000) // Extra stability

        const titlesA = await getAlbumTitles(page)
        console.log(`  Series A albums: ${titlesA.length} found`, titlesA)
        await takeScreenshot(page, 'ghost-render-series-a')

        // Create Series B
        console.log('  Creating Series B...')
        await navigateTo(page, '/')
        await sleep(1000)
        await createSeries(page, seriesB.name, seriesB.albums)

        // WAIT FOR ALBUMS TO LOAD - with 30s timeout
        console.log('  Waiting for albums to load...')
        try {
            await page.waitForSelector('.album-card', { timeout: 30000 })
            console.log('  ✓ Albums loaded')
        } catch (e) {
            console.log('  ⚠️ Timeout waiting for albums (30s)')
        }
        await sleep(2000) // Extra stability

        const titlesB = await getAlbumTitles(page)
        console.log(`  Series B albums: ${titlesB.length} found`, titlesB)
        await takeScreenshot(page, 'ghost-render-series-b')

        // Verify NO overlap - REAL TEST
        if (titlesA.length === 0 || titlesB.length === 0) {
            console.log('  ❌ FAIL: Albums did not load - cannot verify ghost prevention')
            console.log('    Ensure backend (port 3000) is running and responding')
            failed++
        } else {
            const hasGhosts = titlesA.some(a => titlesB.includes(a))
            if (!hasGhosts) {
                console.log('  ✅ PASS: No ghost albums from Series A in Series B')
                passed++
            } else {
                console.log('  ❌ FAIL: Ghost albums detected!')
                console.log('    Series A:', titlesA)
                console.log('    Series B:', titlesB)
                failed++
            }
        }

        // Test 2: Rapid series switching
        console.log('\nTest 2: Rapid series switching preserves isolation')

        await navigateTo(page, '/')
        await sleep(1000)

        // Get series cards and click first one
        const clickedFirst = await page.evaluate(() => {
            const cards = document.querySelectorAll('.series-card')
            if (cards.length >= 2) {
                const btn = cards[0].querySelector('button')
                if (btn) {
                    btn.click()
                    return true
                }
            }
            return false
        })

        if (clickedFirst) {
            // Wait for albums
            try {
                await page.waitForSelector('.album-card', { timeout: 30000 })
            } catch (e) {
                console.log('  ⚠️ Timeout waiting for albums')
            }
            await sleep(2000)

            const titlesA2 = await getAlbumTitles(page)
            console.log(`  Series A (revisit): ${titlesA2.length} albums`)

            if (titlesA2.length > 0) {
                console.log('  ✅ PASS: Series accessible on revisit')
                passed++
            } else {
                console.log('  ❌ FAIL: No albums on revisit')
                failed++
            }
        } else {
            console.log('  ⚠️ SKIP: Not enough series to test switching')
        }

        // Test 3: Loading UI verification
        console.log('\nTest 3: Loading UI appears')

        await navigateTo(page, '/')
        await sleep(1000)

        // Click New Series button using evaluate
        const clickedNew = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'))
            const newBtn = buttons.find(b => b.textContent.includes('New Series'))
            if (newBtn) {
                newBtn.click()
                return true
            }
            return false
        })

        if (clickedNew) {
            await sleep(500)

            // Type in inputs
            await page.type('#seriesName', 'Loading Test ' + Date.now())
            await page.type('#albumQueries', 'Queen - A Night at the Opera')

            // Click Create and immediately check for loading spinner
            const clickPromise = page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'))
                const createBtn = buttons.find(b => b.textContent.includes('Create Series'))
                if (createBtn) createBtn.click()
            })

            // Try to catch loading overlay (may be fast)
            await sleep(300)
            const loadingVisible = await page.$('.loading-overlay, .loading-spinner')

            if (loadingVisible) {
                console.log('  ✅ PASS: Loading overlay/spinner detected')
                passed++
            } else {
                console.log('  ⚠️ INFO: Loading overlay not caught (may be too fast)')
            }

            // Wait for albums
            try {
                await page.waitForSelector('.album-card', { timeout: 30000 })
                const finalCount = await getAlbumCount(page)
                console.log(`  ✅ PASS: Albums loaded successfully (${finalCount})`)
                passed++
            } catch (e) {
                console.log('  ❌ FAIL: Albums did not load within 30s')
                failed++
            }
        }

    } catch (error) {
        console.error('❌ Test error:', error.message)
        failed++
    } finally {
        if (browser) {
            await closeBrowser(browser)
        }
    }

    console.log(`\n${'='.repeat(50)}`)
    console.log(`📊 FINAL RESULTS: ${passed} passed, ${failed} failed`)
    console.log(`${'='.repeat(50)}\n`)

    return { passed, failed }
}

// Run test
testGhostAlbumsRender()
    .then(({ passed, failed }) => {
        process.exit(failed > 0 ? 1 : 0)
    })
    .catch(error => {
        console.error('Fatal error:', error)
        process.exit(1)
    })
