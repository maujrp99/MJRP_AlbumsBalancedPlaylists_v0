/**
 * F64 (UAT-20) - the icon registry had `Plus` written twice. An object keeps the LAST value of a
 * key, so the app has always drawn the second one (two lines); the first (two paths) was never
 * seen. The second stays and the first left. This pins which drawing the app gets.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { Icons, getIcon } from '../../public/js/components/Icons.js'

describe('Icons', () => {
    it('Plus is the drawing the app has always shown: a vertical and a horizontal line', () => {
        expect(Icons.Plus).toContain('<line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/>')
        expect(Icons.Plus).not.toContain('<path')
    })

    it('getIcon puts the classes asked for on the drawing', () => {
        const drawn = getIcon('Plus', 'w-4 h-4')

        expect(drawn).toContain('w-4 h-4')
        expect(drawn).toContain('<line x1="12" x2="12" y1="5" y2="19"/>')
    })

    it('no icon is written twice in the registry', () => {
        const source = fs.readFileSync(path.resolve(process.cwd(), 'public/js/components/Icons.js'), 'utf8')
        const names = [...source.matchAll(/^ {2}([A-Za-z0-9_]+):\s*`<svg/gm)].map(match => match[1])
        const twice = names.filter((name, index) => names.indexOf(name) !== index)

        expect(names.length).toBeGreaterThan(30)
        expect(twice).toEqual([])
    })
})
