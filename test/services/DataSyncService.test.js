import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DataSyncService } from '../../public/js/services/DataSyncService.js'

describe('DataSyncService', () => {
    let service

    beforeEach(() => {
        service = new DataSyncService()
    })

    describe('migrateInventory', () => {
        it('should add all local albums to new repository', async () => {
            const mockRepo = {
                addAlbum: vi.fn().mockResolvedValue('new-id')
            }
            const localAlbums = [
                { title: 'Album 1', artist: 'Artist 1', format: 'cd' },
                { title: 'Album 2', artist: 'Artist 2', format: 'digital' }
            ]

            const count = await service.migrateInventory(mockRepo, localAlbums)

            expect(count).toBe(2)
            expect(mockRepo.addAlbum).toHaveBeenCalledTimes(2)
            // Verify correct args
            expect(mockRepo.addAlbum).toHaveBeenCalledWith(
                localAlbums[0],
                'cd',
                expect.objectContaining({ currency: 'USD' }) // Defaults
            )
        })

        it('should handle duplicates/errors gracefully', async () => {
            const mockRepo = {
                addAlbum: vi.fn()
                    .mockResolvedValueOnce('id1')
                    .mockRejectedValueOnce(new Error('Already exists'))
            }
            const localAlbums = [
                { title: 'A1', artist: 'A1' },
                { title: 'A2', artist: 'A2' }
            ]

            const count = await service.migrateInventory(mockRepo, localAlbums)

            expect(count).toBe(1) // Only 1 successful
        })
    })

    describe('migrateSeries', () => {
        it('should recreate series in new repository', async () => {
            const mockRepo = {
                create: vi.fn().mockResolvedValue('new-series-id')
            }
            const localSeries = [
                { name: 'Series 1', albumQueries: ['Q1'] }
            ]

            const count = await service.migrateSeries(mockRepo, localSeries)

            expect(count).toBe(1)
            expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
                name: 'Series 1',
                albumQueries: ['Q1']
            }))
        })
    })
})
