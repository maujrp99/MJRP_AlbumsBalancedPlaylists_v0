// Stand-in for public/js/services/inventory/inventoryWiring.js (vite alias): the REAL InventoryService
// on an in-memory repository. Nothing is read from or written to Firestore; "writes" change the array
// in window.__memory, which inventory.js fills with the fixture items.
import { inventoryStore } from '/public/js/stores/inventory.js'
import { InventoryService } from '/public/js/services/inventory/InventoryService.js'
import { Album } from '/public/js/models/Album.js'

const memory = () => (window.__memory ||= [])
let counter = 0

const repository = {
    async findAll() { return memory().map(item => ({ ...item })) },
    async addBatch(albums) {
        const ids = albums.map(album => {
            const id = `series-added-${++counter}`
            memory().push({
                id, title: album.title, artist: album.artist, year: album.year ?? null, format: null, owned: null,
                purchasePrice: null, currency: null, notes: '', albumData: JSON.parse(JSON.stringify(album)), addedAt: new Date().toISOString()
            })
            return id
        })
        window.__writes = (window.__writes || 0) + albums.length
        return ids
    },
    async removeAlbum(id) {
        window.__memory = memory().filter(item => item.id !== id)
        window.__removed = [...(window.__removed || []), id]
    },
    async updateAlbum() { },
    async updatePrice() { },
    async setAverages() { },
    async setEditions() { },
    async findByAlbumId() { return null }
}

// the album load's one door: «the album as it is now», made from the fixture item
const albumAsks = {
    async albumsOf({ series }) {
        const id = String(series?.[0]?.id || '').replace('inventory-album:', '')
        const item = memory().find(one => one.id === id)
        const data = window.__albumDataOf?.(item)
        return { albums: data ? [new Album(data)] : [] }
    }
}

export const inventoryService = new InventoryService({ store: inventoryStore, createRepository: () => repository, albumAsks })

/** The person's series (stand-in): some albums are already in the inventory, some are new, one repeats, one is incomplete. */
export async function readSeriesOfThePerson() {
    return window.__series || []
}
