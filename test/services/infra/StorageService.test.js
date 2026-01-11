import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StorageService } from '../../../public/js/services/infra/StorageService.js'

describe('StorageService', () => {
    let service
    const mockStorage = {}

    beforeEach(() => {
        service = new StorageService('test_')
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
            mockStorage[key] = value
        })
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
            return mockStorage[key] || null
        })
        vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => {
            delete mockStorage[key]
        })
        // Clear mock storage
        for (const key in mockStorage) delete mockStorage[key]
    })

    it('should save data with prefix', () => {
        const success = service.save('key1', { foo: 'bar' })
        expect(success).toBe(true)
        expect(localStorage.setItem).toHaveBeenCalledWith('test_key1', '{"foo":"bar"}')
    })

    it('should load data with prefix', () => {
        mockStorage['test_key2'] = '{"baz":123}'
        const data = service.load('key2')
        expect(data).toEqual({ baz: 123 })
    })

    it('should return default value if load fails or missing', () => {
        const data = service.load('missing', 'default')
        expect(data).toBe('default')
    })

    it('should remove data', () => {
        mockStorage['test_key3'] = 'del'
        service.remove('key3')
        expect(localStorage.removeItem).toHaveBeenCalledWith('test_key3')
        expect(mockStorage['test_key3']).toBeUndefined()
    })

    it('should handle serialization errors gracefully', () => {
        // Circular reference throws in JSON.stringify
        const circular = {}
        circular.self = circular

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })
        const success = service.save('bad', circular)

        expect(success).toBe(false)
        expect(consoleSpy).toHaveBeenCalled()
    })
})
