/**
 * F88 (the owner's finding on his iPhone, 2026-11-21: «Os menus não eram pra ser iguais?»): the bottom menu of the phone is ONE
 * component, in the home and in the app. Its icons live in one small module of the site (public/splash/phoneBar.js), which the
 * home's script and the app's bar both draw from.
 */
import { describe, it, expect } from 'vitest'
import { stopIcon, STOP_ICON_SIZE } from '../../public/splash/phoneBar.js'
import { Icons } from '../../public/js/components/Icons.js'
import { MENU } from '../../public/splash/menu.js'

describe('the icon above each label of the phone\'s bottom menu', () => {
    it.each(MENU.map(item => [item.id]))('%s has an icon: one svg, drawn in the colour of its label, 24 px', (id) => {
        document.body.innerHTML = stopIcon(id)
        const svg = document.querySelector('svg.ic')
        expect(document.body.children.length).toBe(1)
        expect(svg).not.toBeNull()
        expect(svg.getAttribute('stroke')).toBe('currentColor')
        expect(svg.getAttribute('aria-hidden')).toBe('true')
        expect(STOP_ICON_SIZE).toBe(24)
    })

    it('the app calls its first stop «home»: the same icon as the home\'s «start»', () => {
        expect(stopIcon('home')).toBe(stopIcon('start'))
    })

    it('Create is a plus (the owner, 2026-11-22: «E ao invés de um ícone de go seja algo relacionado a adição?»; «confirmo, ajuste e já pode publicar»): two strokes crossing at the centre, the same plus as the app\'s Plus icon, no «Go» letters, no house', () => {
        const icon = stopIcon('start')
        expect(icon).not.toContain('M3 10.5 12 3l9 7.5')
        expect(icon).not.toMatch(/A5\.5 8/)
        expect(icon).not.toMatch(/<circle /)
        expect(icon).toContain('<line x1="12" x2="12" y1="4" y2="20"/>')
        expect(icon).toContain('<line x1="4" x2="20" y1="12" y2="12"/>')
        expect(icon).not.toMatch(/<text|font/)
        expect(icon).toContain('aria-hidden="true"')
        expect(Icons.Plus).toContain('<line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/>')
    })

    it('the five icons are five different pictures', () => {
        expect(new Set(MENU.map(item => stopIcon(item.id))).size).toBe(5)
    })

    it('an item no stop stands for has no icon, and says nothing', () => {
        expect(stopIcon('nothing')).toBe('')
    })
})
