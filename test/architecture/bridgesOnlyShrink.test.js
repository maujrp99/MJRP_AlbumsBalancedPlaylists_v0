// @vitest-environment node
/**
 * Fitness function of F83 (REQ-03, risk R1): the bridges to the old pieces are temporary. A React screen that still
 * holds a hand-made piece does it through a wrapper in react-bridge/legacy/ (one per piece), and a hand-made screen that
 * holds a new piece does it through `mountReactPiece`, from the same folder. Every file that uses the folder is in the
 * list below, with its reason; a new use fails, and so does an entry that no longer uses it (take it out in the commit
 * that migrates the piece). The list is empty when wave 0 closes and ends empty: wave 8 deletes the folder.
 */
import { describe, it, expect } from 'vitest'
import { siteFiles, importsOfFiles, folderOf } from './support/siteImports.js'

/** `file` -> why it still holds a bridge. Only shrinks. */
export const BRIDGE_USES = {}

const LEGACY = 'react-bridge/legacy/'

/** The files that use the legacy bridges, given the imports of the site. */
export const usesOf = (imports) => [...new Set(imports
    .filter(({ target, file }) => target && target.startsWith(LEGACY) && !file.startsWith(LEGACY))
    .map(({ file }) => file))].sort()

/** What breaks the rule, given who uses the bridges and the list. */
export function breaches(uses, listed) {
    return [
        ...uses.filter(file => !(file in listed)).map(file => `${file} uses react-bridge/legacy/ and is not in the list`),
        ...Object.keys(listed).filter(file => !uses.includes(file)).map(file => `${file} is in the list and no longer uses react-bridge/legacy/: take it out`)
    ]
}

describe('the bridges to the old pieces only shrink (F83)', () => {
    it('the code of today uses only the bridges the list names', () => {
        expect(breaches(usesOf(importsOfFiles(siteFiles())), BRIDGE_USES)).toEqual([])
    })

    it('a screen that starts using a bridge is accused (the wrong example)', () => {
        const imports = [{ file: 'screens/saved-playlists/SavedPlaylists.tsx', specifier: '../../react-bridge/legacy/FilterBar.tsx', target: 'react-bridge/legacy/FilterBar.tsx' }]
        expect(breaches(usesOf(imports), BRIDGE_USES)).toEqual(['screens/saved-playlists/SavedPlaylists.tsx uses react-bridge/legacy/ and is not in the list'])
    })

    it('an entry that no longer uses a bridge is accused until it is taken out', () => {
        expect(breaches([], { 'views/Old.js': 'a piece waiting for wave 3' })).toHaveLength(1)
    })

    it('the files of the folder do not count as users of themselves', () => {
        const imports = [{ file: 'react-bridge/legacy/FilterBar.tsx', specifier: './Other.tsx', target: 'react-bridge/legacy/Other.tsx' }]
        expect(usesOf(imports)).toEqual([])
        expect(folderOf('react-bridge/legacy/FilterBar.tsx')).toBe('react-bridge')
    })
})
