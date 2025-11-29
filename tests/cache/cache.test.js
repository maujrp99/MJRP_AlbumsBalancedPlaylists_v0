/**
 * Cache Layer Tests
 * Tests for MemoryCache, IndexedDBCache, and CacheManager
 */

// Import cache classes
import { MemoryCache } from '../../public/js/cache/MemoryCache.js'
import { CacheManager } from '../../public/js/cache/CacheManager.js'

// Test suite
const tests = {
    passed: 0,
    failed: 0,
    errors: []
}

function assert(condition, message) {
    if (!condition) {
        tests.failed++
        const error = `❌ FAILED: ${message}`
        tests.errors.push(error)
        console.error(error)
    } else {
        tests.passed++
        console.log(`✅ PASSED: ${message}`)
    }
}

// Helper to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function runTests() {
    console.log('\n🧪 Running Cache Tests...\n')

    // ===== MemoryCache Tests =====
    console.log('--- MemoryCache (L1) Tests ---')

    const memCache = new MemoryCache()

    // Set and get
    await memCache.set('test-key', { data: 'hello' })
    const value = await memCache.get('test-key')
    assert(value && value.data === 'hello', 'MemoryCache.set and get work')

    // Has
    const hasKey = await memCache.has('test-key')
    assert(hasKey === true, 'MemoryCache.has returns true for existing key')

    // Size
    assert(memCache.size() === 1, 'MemoryCache.size returns correct count')

    // TTL expiration
    await memCache.set('expire-key', { data: 'will expire' }, 100) // 100ms TTL
    await wait(150) // Wait for expiration
    const expired = await memCache.get('expire-key')
    assert(expired === null, 'MemoryCache respects TTL and expires entries')

    // Invalidate
    await memCache.set('delete-me', { data: 'bye' })
    await memCache.invalidate('delete-me')
    const deleted = await memCache.get('delete-me')
    assert(deleted === null, 'MemoryCache.invalidate removes entry')

    // Clear
    await memCache.set('key1', 'value1')
    await memCache.set('key2', 'value2')
    await memCache.clear()
    assert(memCache.size() === 0, 'MemoryCache.clear removes all entries')

    // ===== CacheManager Tests =====
    console.log('\n--- CacheManager (L1+L2) Tests ---')

    const cacheManager = new CacheManager()
    await cacheManager.init()

    // Set and get
    await cacheManager.set('manager-key', { data: 'unified cache' })
    const managerValue = await cacheManager.get('manager-key')
    assert(managerValue && managerValue.data === 'unified cache', 'CacheManager.set and get work')

    // L1 promotion (get from L2, promotes to L1)
    await cacheManager.clear()

    // Set directly in L2 (if available)
    if (cacheManager.l2Available) {
        await cacheManager.l2.set('l2-only', { data: 'from L2' })

        // Get should promote to L1
        const promoted = await cacheManager.get('l2-only')
        assert(promoted && promoted.data === 'from L2', 'CacheManager promotes L2 hits to L1')

        // Verify it's now in L1
        const fromL1 = await cacheManager.l1.get('l2-only')
        assert(fromL1 && fromL1.data === 'from L2', 'CacheManager promoted value is in L1')
    }

    // Schema version validation
    const validData = { _schemaVersion: 2, data: 'test' }
    const isValid = cacheManager.validateSchemaVersion(validData, 2)
    assert(isValid === true, 'CacheManager validates matching schema versions')

    const mismatchData = { _schemaVersion: 1, data: 'old' }
    const isMismatch = cacheManager.validateSchemaVersion(mismatchData, 2)
    assert(isMismatch === false, 'CacheManager detects schema version mismatch')

    // Cache stats
    await cacheManager.clear()
    await cacheManager.set('stat-key-1', 'value1')
    await cacheManager.set('stat-key-2', 'value2')

    const stats = await cacheManager.getStats()
    assert(stats.l1Size === 2, 'CacheManager.getStats reports L1 size correctly')
    assert(typeof stats.l2Available === 'boolean', 'CacheManager.getStats includes L2 availability')

    // Invalidate from both layers
    await cacheManager.invalidate('stat-key-1')
    const invalidated = await cacheManager.get('stat-key-1')
    assert(invalidated === null, 'CacheManager.invalidate removes from both L1 and L2')

    // ===== Integration Test =====
    console.log('\n--- Integration Tests ---')

    // Multi-layer consistency
    await cacheManager.clear()
    await cacheManager.set('integration-key', { multi: 'layer', number: 42 })

    // Should be in L1
    const fromL1Integration = await cacheManager.l1.get('integration-key')
    assert(fromL1Integration && fromL1Integration.number === 42, 'Integration: Value cached in L1')

    // Should be in L2 if available
    if (cacheManager.l2Available) {
        const fromL2Integration = await cacheManager.l2.get('integration-key')
        assert(fromL2Integration && fromL2Integration.number === 42, 'Integration: Value cached in L2')
    }

    // TTL consistency across layers
    await cacheManager.set('ttl-test', { ttl: 'test' }, 100)
    await wait(150)
    const ttlExpired = await cacheManager.get('ttl-test')
    assert(ttlExpired === null, 'Integration: TTL works across both cache layers')

    // ===== Summary =====
    console.log('\n' + '='.repeat(60))
    console.log(`✅ PASSED: ${tests.passed}`)
    console.log(`❌ FAILED: ${tests.failed}`)

    if (tests.failed > 0) {
        console.log('\nFailed Tests:')
        tests.errors.forEach(error => console.log(`  ${error}`))
        process.exit(1)
    } else {
        console.log('\n🎉 ALL CACHE TESTS PASSED!')
        process.exit(0)
    }
}

runTests().catch(error => {
    console.error('\n💥 Test suite crashed:', error)
    process.exit(1)
})
