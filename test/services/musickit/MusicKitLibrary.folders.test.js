/**
 * F90 - the folders of the Apple Music library are read page by page to the end (the API gives a
 * page and says where the next one is), both to list them and to find one by name. MusicKit is a
 * stub that answers in several pages: no Apple Music is called.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const auth = vi.hoisted(() => ({ music: null }))
vi.mock('../../../public/js/services/musickit/MusicKitAuth.js', () => ({
    musicKitAuth: { authorize: async () => { }, init: async () => auth.music }
}))

import { musicKitLibrary } from '../../../public/js/services/musickit/MusicKitLibrary.js'

const PATH = '/v1/me/library/playlist-folders'
const folder = (n) => ({ id: `f${n}`, attributes: { name: `Folder ${n}` } })

/** A library of `total` folders, `size` to a page, with `next` as the API gives it. */
function stubLibrary(total, size) {
    const created = []
    const music = {
        calls: [],
        api: {
            music: vi.fn(async (path, params, options) => {
                if (options?.fetchOptions?.method === 'POST') {
                    created.push(JSON.parse(options.fetchOptions.body))
                    return { data: { data: [{ id: 'new-folder' }] } }
                }
                const offset = Number(params?.offset || 0)
                const data = Array.from({ length: Math.min(size, total - offset) }, (_, i) => folder(offset + i + 1))
                const more = offset + size < total
                return { data: { data, next: more ? `${PATH}?offset=${offset + size}` : undefined } }
            })
        }
    }
    auth.music = music
    return { music, created }
}

describe('the folders of the Apple Music library, page by page (F90)', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('lists every folder on every page', async () => {
        stubLibrary(7, 3)
        const folders = await musicKitLibrary.listFolders()

        expect(folders.map(f => f.id)).toEqual(['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7'])
    })

    it('a typed name equal to a folder on a later page reuses it, and creates nothing', async () => {
        const { created } = stubLibrary(7, 3)
        const id = await musicKitLibrary.createOrGetFolder('folder 7')

        expect(id).toBe('f7')
        expect(created).toEqual([])
    })

    it('a name no page has creates one folder', async () => {
        const { created } = stubLibrary(7, 3)
        const id = await musicKitLibrary.createOrGetFolder('Brand new')

        expect(id).toBe('new-folder')
        expect(created).toEqual([{ attributes: { name: 'Brand new' } }])
    })

    it('stops when the API repeats the same next page', async () => {
        auth.music = { api: { music: vi.fn(async () => ({ data: { data: [folder(1)], next: `${PATH}?offset=1` } })) } }
        const folders = await musicKitLibrary.listFolders()

        expect(folders.length).toBeLessThan(100)
    })
})
