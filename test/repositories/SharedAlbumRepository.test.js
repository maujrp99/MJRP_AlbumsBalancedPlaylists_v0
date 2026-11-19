/**
 * The write of an album into the shared root collection `albums` lives in a repository (F48, UAT-14),
 * and what belongs to one person (the personal ranking) never goes into the shared document.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('firebase/firestore', () => ({
    serverTimestamp: vi.fn(() => 'SERVER_TIME'),
    collection: vi.fn(),
    doc: vi.fn((db, path, id) => ({ path: `${path}/${id}` })),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    addDoc: vi.fn(),
    setDoc: vi.fn(async () => {}),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    writeBatch: vi.fn()
}))

import { setDoc } from 'firebase/firestore'
import { SharedAlbumRepository } from '../../public/js/repositories/SharedAlbumRepository.js'
import { Album } from '../../public/js/models/Album.js'

const rankedAlbum = () => {
    const tracks = [{ title: 'One', rating: 90 }, { title: 'Two', rating: 80 }]
    const album = new Album({ id: 'alb-1', title: 'Album', artist: 'Artist', tracks, tracksOriginalOrder: tracks })
    album.setUserRankings([{ trackTitle: 'One', userRank: 2 }, { trackTitle: 'Two', userRank: 1 }])
    return album
}

describe('SharedAlbumRepository (F48)', () => {
    let repository

    beforeEach(() => {
        vi.clearAllMocks()
        repository = new SharedAlbumRepository({}, null)
    })

    it('writes the album into the root collection `albums`, merging, under its own id', async () => {
        await expect(repository.saveAlbum(rankedAlbum())).resolves.toBe('alb-1')

        const [ref, data, options] = setDoc.mock.calls[0]
        expect(ref.path).toBe('albums/alb-1')
        expect(options).toEqual({ merge: true })
        expect(data).toMatchObject({ id: 'alb-1', title: 'Album', artist: 'Artist' })
        expect(data.tracks.map(t => t.rating)).toEqual([90, 80])
    })

    it('never writes the personal ranking of the person into the shared document', async () => {
        const album = rankedAlbum()
        expect(album.hasUserRanking).toBe(true)

        await repository.saveAlbum(album)

        const data = setDoc.mock.calls[0][1]
        expect(data).not.toHaveProperty('hasUserRanking')
        expect(data).not.toHaveProperty('userRanking')
        const everyTrack = [...data.tracks, ...data.tracksOriginalOrder]
        expect(everyTrack.length).toBeGreaterThan(0)
        expect(everyTrack.every(track => !('userRank' in track))).toBe(true)
    })

    it('leaves the album it was given untouched', async () => {
        const album = rankedAlbum()

        await repository.saveAlbum(album)

        expect(album.hasUserRanking).toBe(true)
        expect(album.tracks.some(track => track.userRank === 1)).toBe(true)
    })

    it('writes plain data only: nothing undefined, no class instance', async () => {
        const album = rankedAlbum()
        album.bestEverUrl = undefined

        await repository.saveAlbum(album)

        const data = setDoc.mock.calls[0][1]
        expect('bestEverUrl' in data).toBe(false)
        expect(Object.getPrototypeOf(data.tracks[0])).toBe(Object.prototype)
    })

    it('refuses an album without an id', async () => {
        await expect(repository.saveAlbum({ title: 'No id' })).rejects.toThrow(/id/i)
        expect(setDoc).not.toHaveBeenCalled()
    })
})
