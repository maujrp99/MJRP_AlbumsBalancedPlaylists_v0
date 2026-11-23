/**
 * Fitness functions of UAT-14 (F58): the app has ONE Firebase, the one of the package
 * (`firebase-init.js`), and only the repositories talk to Firestore (ADR-0017; PRINCIPLES.md
 * I.3: changing the data source is one place). They read the source files and fail when either
 * comes back.
 *
 * F78, REQ-09 (Ref-A): the repositories live in the shared core (shared/data/) and import no
 * Firestore: each is given a store (shared/data/store.js). The site's store, made of the Firebase JS
 * SDK, is the one file of public/js/repositories/ that imports it (firestoreStore.js).
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { appFiles, importsOf, listJs, offenders, read } from './support/sourceImports.js'

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

    it('the repositories live in shared/data/; the site keeps only its store and its ranking instance (F78, REQ-09)', () => {
        const DATA = path.resolve(process.cwd(), 'shared/data')
        const core = fs.readdirSync(DATA).filter(name => name.endsWith('.js')).sort()

        expect(core).toEqual(['BaseRepository.js', 'InventoryRepository.js', 'PlaylistRepository.js', 'PublishedContentRepository.js',
            'PublishedContentSaveRepository.js', 'SeriesRepository.js', 'SpotifyEnrichmentRepository.js', 'UserRankingRepository.js', 'batchTransaction.js', 'schemaVersion.js', 'store.js'])
        // F82: the CMS's published content has its instance (publishedContent.js) and, in a file only the Painel downloads,
        // the repository that saves (publishedContentWriter.js). It saves in one batch locked by the rules (shared/data/batchTransaction.js), so it
        // imports no SDK: firestoreStore.js is again the only file of the repositories that does (the judge of 2026-11-23, P2-1).
        expect(listJs('repositories').sort()).toEqual(['repositories/firestoreStore.js', 'repositories/publishedContent.js',
            'repositories/publishedContentWriter.js', 'repositories/userRankings.js'])
        expect(offenders(listJs('repositories'), specifier => /firebase\/firestore/.test(specifier)).sort()).toEqual([
            'repositories/firestoreStore.js -> firebase/firestore'])
    })

    it('a repository of the core reaches Firestore only through the store it is given', () => {
        const DATA = path.resolve(process.cwd(), 'shared/data')
        const direct = /(?<![.\w])(collection|doc|getDocs?|setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction|onSnapshot|serverTimestamp)\s*\(/
        const offending = fs.readdirSync(DATA).filter(name => name.endsWith('Repository.js'))
            .filter(name => fs.readFileSync(path.join(DATA, name), 'utf8').split('\n')
                .some(line => !/^\s*(\*|\/\/)/.test(line) && direct.test(line)))

        expect(offending).toEqual([])
    })
})
