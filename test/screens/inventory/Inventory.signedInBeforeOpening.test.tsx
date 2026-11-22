/**
 * F83 wave 6a, the trap of the map («A armadilha da assinatura»): `services/inventory/inventoryWiring.js` hears who signed in the moment it is loaded
 * (`userStore.subscribe(...)`, which does not call the listener at once), and `handleUserChange` reads the inventory of the person from the cloud into
 * the store. The hand-made screen was in the main script, so the wiring was loaded with the app and the inventory was read at sign-in, for everyone, before
 * the screen opened. Now that the screen's file comes down on demand, a wiring that came down WITH it would miss the person who signed in before it
 * (the service would stay with the anonymous visitor and the inventory would show empty). So app.js imports the wiring itself, once, at the top.
 *
 * Two tests: the behaviour (a person signed in, the screen's file is loaded after, the inventory is there), and that app.js keeps the import.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const rows = vi.hoisted(() => [{ id: 'a', title: 'Fragile', artist: 'Yes', owned: true, format: 'cd', albumData: { id: 'yes-fragile' } }])

vi.mock('../../../public/js/firebase-init.js', () => ({ db: { name: 'db' } }))
vi.mock('../../../shared/data/InventoryRepository.js', () => ({ InventoryRepository: class { findAll() { return Promise.resolve(rows) } } }))
vi.mock('../../../public/js/cache/CacheManager.js', () => ({ cacheManager: {} }))
vi.mock('../../../public/js/services/SeriesService.js', () => ({ getSeriesService: vi.fn() }))
vi.mock('../../../public/js/services/albums/albumLoading.js', () => ({ albumAsks: { albumsOf: vi.fn() } }))
vi.mock('../../../public/js/services/inventory/inventoryValueWiring.js', async () => ({ inventoryValues: (await import('../../helpers/inventoryValuesStub.js')).valuesOff() }))
vi.mock('../../../public/js/services/OptimizedAlbumLoader.js', () => ({ optimizedAlbumLoader: { load: vi.fn(async () => { }) } }))
vi.mock('../../../public/js/components/Toast.js', () => ({ default: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }))

import { act } from 'react'
import { userStore } from '../../../public/js/stores/UserStore.js'
import { inventoryStore } from '../../../public/js/stores/inventory.js'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const tick = () => new Promise(resolve => setImmediate(resolve))

// nothing of the screen is imported at the top of this file: its file must come down only when the person opens it
const asPhone = () => { window.matchMedia = (() => ({ matches: true, addEventListener() { }, removeEventListener() { } })) as never }

describe('a person who signed in before the inventory screen was opened', () => {
    afterEach(() => { document.body.innerHTML = ''; inventoryStore.reset(); vi.restoreAllMocks() })

    it('finds the inventory read: the wiring was loaded with the app, not with the screen', async () => {
        vi.spyOn(console, 'log').mockImplementation(() => { })
        // what app.js does at the start: the wiring starts to hear the user store
        await import('../../../public/js/services/inventory/inventoryWiring.js')
        // the person signs in (the screen's file has not been asked for yet)
        await act(async () => { userStore.setUser({ uid: 'person-1', isAnonymous: false }); for (let i = 0; i < 6; i++) await tick() })
        expect(inventoryStore.getAlbums()).toHaveLength(1)

        // the person opens /inventory for the first time: the file of the screen comes down now
        asPhone()
        const { inventoryParts } = await import('../../../public/js/screens/inventory/index')
        document.body.innerHTML = '<div id="app"></div>'
        const { view } = inventoryParts()
        await act(async () => { await view.render({}); view.mount({}) })
        await act(async () => { for (let i = 0; i < 4; i++) await tick() })
        expect(document.querySelectorAll('.inv-row')).toHaveLength(1)
        expect(document.querySelector('.inv-row__title')!.textContent).toBe('Fragile')
        await act(async () => { view.destroy() })
    })

    it('app.js imports the wiring itself, as a static import at the top (a screen that loads on demand would miss the person who signed in)', () => {
        const app = fs.readFileSync(path.resolve(process.cwd(), 'public/js/app.js'), 'utf8')
        expect(app).toMatch(/^import '\.\/services\/inventory\/inventoryWiring\.js'/m)
    })
})
