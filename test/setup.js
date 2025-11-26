import { beforeEach, vi } from 'vitest'

// Mock Firebase globally
global.firebase = {
    initializeApp: vi.fn(),
    firestore: vi.fn(() => ({
        collection: vi.fn((name) => ({
            doc: vi.fn((id) => ({
                set: vi.fn(() => Promise.resolve()),
                get: vi.fn(() => Promise.resolve({
                    exists: true,
                    id,
                    data: () => ({})
                })),
                update: vi.fn(() => Promise.resolve())
            })),
            add: vi.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
            where: vi.fn(() => ({
                get: vi.fn(() => Promise.resolve({
                    docs: []
                }))
            })),
            orderBy: vi.fn(() => ({
                limit: vi.fn(() => ({
                    get: vi.fn(() => Promise.resolve({ docs: [] }))
                }))
            })),
            get: vi.fn(() => Promise.resolve({ docs: [] }))
        }))
    })),
    FieldValue: {
        serverTimestamp: vi.fn(() => new Date())
    }
}

// Reset mocks before each test
beforeEach(() => {
    vi.clearAllMocks()
})
