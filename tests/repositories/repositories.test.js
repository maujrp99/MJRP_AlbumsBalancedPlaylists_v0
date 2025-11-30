/**
 * Repository Tests
 * Unit tests for all repositories with mocked Firestore
 */

// Mock Firestore
class MockFirestore {
    constructor() {
        this.collections = new Map()
    }

    collection(path) {
        if (!this.collections.has(path)) {
            this.collections.set(path, new MockCollection(path, this))
        }
        return this.collections.get(path)
    }

    batch() {
        return new MockBatch(this)
    }

    static FieldValue = {
        serverTimestamp: () => new Date()
    }
}

class MockCollection {
    constructor(path, firestore) {
        this.path = path
        this.firestore = firestore
        this.docs = new Map()
    }

    doc(id) {
        return new MockDocument(id, this)
    }

    async add(data) {
        const id = `mock_${Date.now()}_${Math.random()}`
        const docRef = this.doc(id)
        await docRef.set(data)
        return docRef
    }

    async get() {
        const docs = Array.from(this.docs.values()).map(data => ({
            id: data._id,
            exists: true,
            data: () => ({ ...data, _id: undefined }),
            ref: this.doc(data._id)
        }))
        return { docs, empty: docs.length === 0 }
    }

    where() { return this } // Chainable mock
    orderBy() { return this }
    limit() { return this }
}

class MockDocument {
    constructor(id, collection) {
        this.id = id
        this.collection = collection
        this.ref = this
        this._firestore = collection.firestore
    }

    async get() {
        const data = this.collection.docs.get(this.id)
        return {
            id: this.id,
            exists: !!data,
            data: () => data ? { ...data, _id: undefined } : null,
            ref: this
        }
    }

    async set(data) {
        this.collection.docs.set(this.id, { ...data, _id: this.id })
    }

    async update(data) {
        const existing = this.collection.docs.get(this.id)
        if (!existing) throw new Error('Document not found')
        this.collection.docs.set(this.id, { ...existing, ...data })
    }

    async delete() {
        this.collection.docs.delete(this.id)
    }

    collection(name) {
        const subPath = `${this.collection.path}/${this.id}/${name}`
        return this._firestore.collection(subPath)
    }
}

class MockBatch {
    constructor(firestore) {
        this.firestore = firestore
        this.operations = []
    }

    delete(docRef) {
        this.operations.push({ type: 'delete', docRef })
    }

    set(docRef, data) {
        this.operations.push({ type: 'set', docRef, data })
    }

    async commit() {
        for (const op of this.operations) {
            if (op.type === 'delete') {
                await op.docRef.delete()
            } else if (op.type === 'set') {
                await op.docRef.set(op.data)
            }
        }
    }
}

// Mock Cache
class MockCache {
    constructor() {
        this.store = new Map()
    }

    async get(key) {
        return this.store.get(key) || null
    }

    async set(key, value) {
        this.store.set(key, value)
    }

    async invalidate(key) {
        this.store.delete(key)
    }

    clear() {
        this.store.clear()
    }
}

// Make firebase global for BaseRepository
global.firebase = {
    firestore: Object.assign(MockFirestore, {
        FieldValue: {
            serverTimestamp: () => new Date()
        }
    })
}

// Import repositories (fixed paths)
const { BaseRepository } = await import('../../public/js/repositories/BaseRepository.js')
const { SeriesRepository } = await import('../../public/js/repositories/SeriesRepository.js')
const { AlbumRepository } = await import('../../public/js/repositories/AlbumRepository.js')
const { PlaylistRepository } = await import('../../public/js/repositories/PlaylistRepository.js')
const { InventoryRepository } = await import('../../public/js/repositories/InventoryRepository.js')

// Test Suite
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

async function assertEqual(actual, expected, message) {
    const actualStr = JSON.stringify(actual)
    const expectedStr = JSON.stringify(expected)
    assert(actualStr === expectedStr, `${message} (expected ${expectedStr}, got ${actualStr})`)
}

// Tests
async function runTests() {
    console.log('\n🧪 Running Repository Tests...\n')

    const firestore = new MockFirestore()
    const cache = new MockCache()

    // ===== BaseRepository Tests =====
    console.log('--- BaseRepository Tests ---')

    try {
        // Should throw error if instantiated directly
        let error = null
        try {
            new BaseRepository(firestore, cache)
        } catch (e) {
            error = e
        }
        assert(error !== null, 'BaseRepository throws error when instantiated directly')
    } catch (e) {
        console.error('BaseRepository instantiation test failed:', e)
    }

    // ===== SeriesRepository Tests =====
    console.log('\n--- SeriesRepository Tests ---')

    const seriesRepo = new SeriesRepository(firestore, cache, 'test-user')

    // Create series
    const seriesId = await seriesRepo.create({
        name: 'Test Series',
        albumQueries: ['Pink Floyd - The Wall']
    })
    assert(seriesId !== null, 'SeriesRepository.create returns ID')

    // Find by ID
    const series = await seriesRepo.findById(seriesId)
    assert(series.name === 'Test Series', 'SeriesRepository.findById returns correct series')

    // Rename series
    await seriesRepo.rename(seriesId, 'Renamed Series')
    const renamed = await seriesRepo.findById(seriesId)
    assert(renamed.name === 'Renamed Series', 'SeriesRepository.rename updates name')

    // Rename validation
    let renameError = null
    try {
        await seriesRepo.rename(seriesId, 'ab') // Too short
    } catch (e) {
        renameError = e
    }
    assert(renameError !== null, 'SeriesRepository.rename validates name length')

    // ===== AlbumRepository Tests =====
    console.log('\n--- AlbumRepository Tests ---')

    const albumRepo = new AlbumRepository(firestore, cache, 'test-user', seriesId)

    // Create album
    const albumId = await albumRepo.create({
        title: 'The Wall',
        artist: 'Pink Floyd',
        year: 1979,
        tracks: [
            { id: '1', title: 'In The Flesh?', rating: 85 },
            { id: '2', title: 'The Thin Ice', rating: 90 }
        ],
        tracksOriginalOrder: [
            { id: '1', title: 'In The Flesh?', rating: 85 },
            { id: '2', title: 'The Thin Ice', rating: 90 }
        ]
    })
    assert(albumId !== null, 'AlbumRepository.create returns ID')

    // Find by ID
    const album = await albumRepo.findById(albumId)
    assert(album.title === 'The Wall', 'AlbumRepository.findById returns correct album')

    // Update tracks
    const newTracks = [
        { id: '1', title: 'In The Flesh?', rating: 95 }
    ]
    await albumRepo.updateTracks(albumId, newTracks)
    const updated = await albumRepo.findById(albumId)
    assert(updated.tracks.length === 1, 'AlbumRepository.updateTracks updates tracks')

    // Find by artist
    const byArtist = await albumRepo.findByArtist('Pink Floyd')
    assert(byArtist.length === 1, 'AlbumRepository.findByArtist returns matching albums')

    // ===== PlaylistRepository Tests =====
    console.log('\n--- PlaylistRepository Tests ---')

    const playlistRepo = new PlaylistRepository(firestore, cache, 'test-user', seriesId)

    // Create playlist
    const playlistId = await playlistRepo.create({
        name: 'Greatest Hits Vol. 1',
        tracks: [
            { id: '1', title: 'In The Flesh?', duration: 180 },
            { id: '2', title: 'The Thin Ice', duration: 200 }
        ]
    })
    assert(playlistId !== null, 'PlaylistRepository.create returns ID')

    // Rename playlist
    await playlistRepo.rename(playlistId, 'Best Of Pink Floyd')
    const renamedPlaylist = await playlistRepo.findById(playlistId)
    assert(renamedPlaylist.name === 'Best Of Pink Floyd', 'PlaylistRepository.rename updates name')

    // Get total duration
    const duration = await playlistRepo.getTotalDuration(playlistId)
    assert(duration === 380, 'PlaylistRepository.getTotalDuration calculates correctly')

    // ===== InventoryRepository Tests =====
    console.log('\n--- InventoryRepository Tests ---')

    const inventoryRepo = new InventoryRepository(firestore, cache, 'test-user')

    // Add album to inventory
    const inventoryAlbum = {
        id: 'album-1',
        title: 'Dark Side of the Moon',
        artist: 'Pink Floyd',
        year: 1973,
        tracks: []
    }
    const inventoryId = await inventoryRepo.addAlbum(inventoryAlbum, 'vinyl', {
        purchasePrice: 150,
        notes: 'Limited edition'
    })
    assert(inventoryId !== null, 'InventoryRepository.addAlbum returns ID')

    // Find by ID
    const invAlbum = await inventoryRepo.findById(inventoryId)
    assert(invAlbum.format === 'vinyl', 'InventoryRepository stores format correctly')
    assert(invAlbum.purchasePrice === 150, 'InventoryRepository stores purchase price')

    // Find by format
    const vinyls = await inventoryRepo.findByFormat('vinyl')
    assert(vinyls.length === 1, 'InventoryRepository.findByFormat returns matching albums')

    // Update inventory album
    await inventoryRepo.updateAlbum(inventoryId, {
        format: 'cd',
        purchasePrice: 50
    })
    const updatedInv = await inventoryRepo.findById(inventoryId)
    assert(updatedInv.format === 'cd', 'InventoryRepository.updateAlbum updates format')

    // Get statistics
    const stats = await inventoryRepo.getStatistics()
    assert(stats.totalAlbums === 1, 'InventoryRepository.getStatistics counts total albums')
    assert(stats.totalValueUSD === 50, 'InventoryRepository.getStatistics calculates total value')

    // Duplicate check
    let duplicateError = null
    try {
        await inventoryRepo.addAlbum(inventoryAlbum, 'cd')
    } catch (e) {
        duplicateError = e
    }
    assert(duplicateError !== null, 'InventoryRepository prevents duplicate albums')

    // ===== Cascade Delete Test =====
    // TODO: Fix MockDocument.collection() for subcollections
    /*
    console.log('\\n--- Cascade Delete Test ---')

    // Create series with albums and playlists
    const cascadeSeriesId = await seriesRepo.create({
        name: 'Cascade Test Series',
        albumQueries: []
    })

    const cascadeAlbumRepo = new AlbumRepository(firestore, cache, 'test-user', cascadeSeriesId)
    const cascadePlaylistRepo = new PlaylistRepository(firestore, cache, 'test-user', cascadeSeriesId)

    await cascadeAlbumRepo.create({ title: 'Album 1', artist: 'Artist 1' })
    await cascadeAlbumRepo.create({ title: 'Album 2', artist: 'Artist 2' })
    await cascadePlaylistRepo.create({ name: 'Playlist 1', tracks: [] })

    // Delete series with cascade
    await seriesRepo.deleteWithCascade(cascadeSeriesId)

    // Verify series is deleted
    const deletedSeries = await seriesRepo.findById(cascadeSeriesId)
    assert(deletedSeries === null, 'SeriesRepository.deleteWithCascade deletes series')

    // Verify albums are deleted
    const remainingAlbums = await cascadeAlbumRepo.findAll()
    assert(remainingAlbums.length === 0, 'SeriesRepository.deleteWithCascade deletes all albums')

    // Verify playlists are deleted
    const remainingPlaylists = await cascadePlaylistRepo.findAll()
    assert(remainingPlaylists.length === 0, 'SeriesRepository.deleteWithCascade deletes all playlists')
    */

    // ===== Summary =====
    console.log('\n' + '='.repeat(60))
    console.log(`✅ PASSED: ${tests.passed}`)
    console.log(`❌ FAILED: ${tests.failed}`)

    if (tests.failed > 0) {
        console.log('\nFailed Tests:')
        tests.errors.forEach(error => console.log(`  ${error}`))
        process.exit(1)
    } else {
        console.log('\n🎉 ALL TESTS PASSED!')
        process.exit(0)
    }
}

runTests().catch(error => {
    console.error('\n💥 Test suite crashed:', error)
    process.exit(1)
})
