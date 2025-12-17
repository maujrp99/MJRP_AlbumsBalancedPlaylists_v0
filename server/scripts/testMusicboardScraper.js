/**
 * Test script for Musicboard scraper
 * 
 * Run with: node server/scripts/testMusicboardScraper.js
 */

const { getRankingForAlbum, getRankingFromUrl } = require('../lib/scrapers/musicboard')

async function testScraper() {
    console.log('=== Musicboard Scraper Test ===\n')

    // Test 1: Direct album lookup
    console.log('Test 1: Metallica - Metallica (Black Album)')
    console.log('---')

    try {
        const result1 = await getRankingForAlbum('Metallica', 'Metallica')

        if (result1.error) {
            console.log('❌ Error:', result1.error)
        } else {
            console.log('✅ Found', result1.evidence?.length || 0, 'tracks')
            console.log('Reference URL:', result1.referenceUrl)
            console.log('Top 5 tracks:')
            result1.evidence?.slice(0, 5).forEach((t, i) => {
                console.log(`  ${i + 1}. ${t.trackTitle} - Rating: ${t.rating || 'N/A'}`)
            })
        }
    } catch (err) {
        console.log('❌ Exception:', err.message)
    }

    console.log('\n---\n')

    // Test 2: Another album
    console.log('Test 2: Pink Floyd - The Dark Side of the Moon')
    console.log('---')

    try {
        const result2 = await getRankingForAlbum('The Dark Side of the Moon', 'Pink Floyd')

        if (result2.error) {
            console.log('❌ Error:', result2.error)
        } else {
            console.log('✅ Found', result2.evidence?.length || 0, 'tracks')
            console.log('Reference URL:', result2.referenceUrl)
            console.log('Top 5 tracks:')
            result2.evidence?.slice(0, 5).forEach((t, i) => {
                console.log(`  ${i + 1}. ${t.trackTitle} - Rating: ${t.rating || 'N/A'}`)
            })
        }
    } catch (err) {
        console.log('❌ Exception:', err.message)
    }

    console.log('\n=== Tests Complete ===')
}

testScraper().catch(console.error)
