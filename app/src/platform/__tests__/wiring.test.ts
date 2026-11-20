import { newId } from '@album-blender/shared/platform/newId.js'
import { newId as newIdByTheSiteAlias } from '@shared/platform/newId.js'
import { wirePlatform, unwirePlatformForTests } from '../wiring'

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('the platform wiring of the app (REQ-07)', () => {
    afterEach(() => unwirePlatformForTests())

    it('before the wiring, the core refuses to make an id and says what to wire', () => {
        unwirePlatformForTests()
        expect(() => newId()).toThrow(/no id source wired/)
    })

    it('after the wiring, the core makes v4 ids, each one new', () => {
        wirePlatform()
        const ids = Array.from({ length: 50 }, () => newId())
        ids.forEach(id => expect(id).toMatch(UUID_V4))
        expect(new Set(ids).size).toBe(50)
    })

    it('the core is one module under its two names: the wiring reaches the rules of the site too', () => {
        wirePlatform()
        expect(newIdByTheSiteAlias()).toMatch(UUID_V4)
        unwirePlatformForTests()
        expect(() => newIdByTheSiteAlias()).toThrow(/no id source wired/)
    })

    it('wiring twice keeps one source', () => {
        wirePlatform()
        wirePlatform()
        expect(newId()).toMatch(UUID_V4)
    })
})
