// @vitest-environment node
/**
 * Fitness function of F83 (REQ-03, risk R1): the bridges to the old pieces are temporary. A React screen that still
 * holds a hand-made piece does it through a wrapper in react-bridge/legacy/ (one per piece), and a hand-made screen that
 * holds a new piece does it through `mountReactPiece`, from the same folder. Every file that uses the folder is in the
 * list below, with its reason; a new use fails, and so does an entry that no longer uses it (take it out in the commit
 * that migrates the piece). It ends empty: wave 8 deletes the folder.
 */
import { describe, it, expect } from 'vitest'
import { siteFiles, importsOfFiles, folderOf } from './support/siteImports.js'

/**
 * `file` -> why it still holds a bridge. Only shrinks. It started empty (wave 0); wave 1 (the saved playlists screen) put in the
 * three entries below, the only ones: a piece shared with a screen of a later wave stays the hand-made one, reached through a
 * wrapper, because porting it to React now would make the main script call React (see react-bridge/legacy/FilterToolbar.tsx).
 */
export const BRIDGE_USES = {
    // wave 5a (the albums screen): the controller of the session stays hand-made behind a wrapper (it is rewritten in wave 8). Wave 5b took out the windows to
    // edit and delete a series and to rank the tracks (they are React, screens/albums/), and `Albums.tsx` left the list; wave 6b took out the album window, the
    // window Add to inventory and the table of the tracks (ui/albumWindow/, ui/tracks/, screens/albums/InventoryAdd.tsx), and `AlbumCard.tsx` and `albumActions.ts` left it.
    // The inventory (wave 6) has no entry: its two windows are React (wave 6b).
    'screens/albums/index.ts': 'the controller of the session is hand-written JavaScript (rewritten in wave 8)',
    // wave 8a (the exports): the Spotify window is React (ui/SpotifyExportWindow.tsx) and the file and Apple Music exports moved to controllers/ (playlistExports.js,
    // playlistExportEntries.js); react-bridge/legacy/OutputWindows.ts went, and `screens/playlists/Playlists.tsx` and `ui/PlaylistExportWindow.tsx` left the list.
}

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
        const imports = [{ file: 'screens/playlists/Playlists.tsx', specifier: '../../react-bridge/legacy/FilterBar.tsx', target: 'react-bridge/legacy/FilterBar.tsx' }]
        expect(breaches(usesOf(imports), {})).toEqual(['screens/playlists/Playlists.tsx uses react-bridge/legacy/ and is not in the list'])
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
