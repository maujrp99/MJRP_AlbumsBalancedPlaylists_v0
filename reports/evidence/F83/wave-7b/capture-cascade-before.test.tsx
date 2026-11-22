/**
 * F83 wave 7b - written once, on the hand-made cascade of covers (components/common/AlbumCascade.js) before it was deleted: the picture of the elements the
 * React cascade (ui/AlbumCascade.tsx) must draw, for none, one, two, three and four covers, written to test/fixtures/albumCascadeBeforeF83.json.
 * A RECORD, NOT A TEST THAT RUNS: it ran from test/ui/ against the tree before the file was deleted.
 */
import { it } from 'vitest'
import fs from 'node:fs'
import { AlbumCascade as HandMade } from '../../public/js/components/common/AlbumCascade.js'
import { normalize } from '../support/savedPlaylistsScenarios.js'

const SETS: (string | null)[][] = [[], ['https://c/a.jpg'], ['https://c/a.jpg', null], ['https://c/a.jpg', '', 'https://c/c.jpg'], ['a', 'b', 'c', 'd']]

it('writes the picture', () => {
    const picture: Record<string, string> = {}
    for (const thumbnails of SETS) {
        const wrapper = document.createElement('div')
        wrapper.appendChild(HandMade.renderNode(thumbnails))
        picture[JSON.stringify(thumbnails)] = normalize(wrapper)
    }
    fs.writeFileSync('test/fixtures/albumCascadeBeforeF83.json', JSON.stringify(picture, null, 1) + '\n')
})
