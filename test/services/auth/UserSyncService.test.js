import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UserSyncService } from '../../../public/js/services/auth/UserSyncService.js'

// Mock DataSyncService default export
const mockDataSync = {
    saveSeries: vi.fn()
}

vi.mock('../../../public/js/services/DataSyncService.js', () => ({
    dataSyncService: mockDataSync
}))

describe('UserSyncService', () => {
    let service

    beforeEach(() => {
        vi.clearAllMocks()
        service = new UserSyncService()
    })

    describe('handleUserChange', () => {
        it('should trigger callback when guest migrates to user', async () => {
            const newUser = { id: 'user-1' }
            const currentUserId = 'guest'
            const callback = vi.fn()

            await service.handleUserChange(newUser, currentUserId, callback)
            expect(callback).toHaveBeenCalled()
        })

        it('should NOT trigger callback if users match', async () => {
            const newUser = { id: 'user-1' }
            const currentUserId = 'user-1'
            const callback = vi.fn()

            await service.handleUserChange(newUser, currentUserId, callback)
            expect(callback).not.toHaveBeenCalled()
        })
    })

    describe('migrateSeries', () => {
        it('should delegate to DataSyncService', async () => {
            const series = { id: 's1' }
            mockDataSync.saveSeries.mockResolvedValue(true)

            const result = await service.migrateSeries(series)
            expect(mockDataSync.saveSeries).toHaveBeenCalledWith(series)
            expect(result).toBe(true)
        })
    })
})
