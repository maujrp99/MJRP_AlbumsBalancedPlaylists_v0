/**
 * Fitness functions of UAT-14 (F58): the app has ONE Firebase, the one of the package
 * (`firebase-init.js`), and only the repositories talk to Firestore (ADR-0017; PRINCIPLES.md
 * I.3: changing the data source is one place). They read the source files and fail when either
 * comes back.
 */
import { describe, it, expect } from 'vitest'
import { appFiles, importsOf, offenders, read } from './support/sourceImports.js'

const files = appFiles()

describe('one Firebase, and Firestore behind the repositories (UAT-14)', () => {
    it('no file of the app imports code from an address: a second Firebase SDK from a CDN never comes back', () => {
        expect(offenders(files, specifier => /^(https?:)?\/\//.test(specifier))).toEqual([])
    })

    it('the Firebase SDK is imported by name, from the one package', () => {
        const firebase = files.flatMap(file => importsOf(file).filter(specifier => /firebase/i.test(specifier) && !specifier.startsWith('.')))

        expect([...new Set(firebase)].sort()).toEqual(['firebase/app', 'firebase/auth', 'firebase/firestore'])
    })

    it('only the repositories and the file that starts Firebase import the Firestore SDK', () => {
        const outside = files.filter(file => !file.startsWith('repositories/') && file !== 'firebase-init.js')

        expect(offenders(outside, specifier => /firebase\/firestore|firebase-firestore/.test(specifier))).toEqual([])
    })

    it('no file outside the repositories calls the Firestore API on a database it was handed', () => {
        const calls = /\b(collection|doc|getDocs?|setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction|onSnapshot)\s*\(\s*(this\.)?(db|firestore)\b/
        const outside = files.filter(file => !file.startsWith('repositories/'))

        expect(outside.filter(file => calls.test(read(file)))).toEqual([])
    })
})
