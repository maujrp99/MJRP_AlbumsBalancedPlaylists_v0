import { describe, it, expect, beforeEach } from 'vitest'
import { PlaylistHistoryService } from '../../../public/js/services/playlists/PlaylistHistoryService.js'

describe('PlaylistHistoryService', () => {
    let service

    beforeEach(() => {
        service = new PlaylistHistoryService(5) // Max 5 items
    })

    it('should initialize with empty state', () => {
        const stats = service.getStats()
        expect(stats.canUndo).toBe(false)
        expect(stats.canRedo).toBe(false)
        expect(stats.count).toBe(0)
    })

    it('should create snapshot and advance index', () => {
        service.createSnapshot([{ id: 1 }], 's1', 'init')
        service.createSnapshot([{ id: 2 }], 's1', 'update')

        const stats = service.getStats()
        expect(stats.count).toBe(2)
        expect(stats.index).toBe(1) // 0-based
        expect(stats.canUndo).toBe(true)
        expect(stats.canRedo).toBe(false)
    })

    it('should undo to previous state', () => {
        service.createSnapshot([{ v: 1 }], 's1', 'v1')
        service.createSnapshot([{ v: 2 }], 's1', 'v2')

        const result = service.undo()
        expect(result.playlists[0].v).toBe(1)

        const stats = service.getStats()
        expect(stats.index).toBe(0)
        expect(stats.canRedo).toBe(true)
    })

    it('should redo to future state', () => {
        service.createSnapshot([{ v: 1 }], 's1', 'v1')
        service.createSnapshot([{ v: 2 }], 's1', 'v2')
        service.undo()

        const result = service.redo()
        expect(result.playlists[0].v).toBe(2)

        const stats = service.getStats()
        expect(stats.index).toBe(1)
        expect(stats.canRedo).toBe(false)
    })

    it('should branch history when creating snapshot after undo', () => {
        service.createSnapshot([{ v: 1 }], 's1', 'v1')
        service.createSnapshot([{ v: 2 }], 's1', 'v2')
        service.undo() // Back to v1

        // Fork
        service.createSnapshot([{ v: 3 }], 's1', 'v3')

        const stats = service.getStats()
        expect(stats.count).toBe(2) // v1, v3
        expect(stats.index).toBe(1)

        expect(service.versions[1].description).toBe('v3')
    })
})
