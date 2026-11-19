import { describe, it, expect, vi } from 'vitest'
import { SafeDOM } from '../../public/js/utils/SafeDOM.js'

describe('SafeDOM', () => {
    it('text given as the textContent property is the text of the element (UAT-195)', () => {
        const button = SafeDOM.button({ className: 'btn', textContent: 'Close' })
        expect(button.textContent).toBe('Close')
        expect(button.hasAttribute('textcontent')).toBe(false)
    })

    it('text given as textContent is never read as HTML', () => {
        const el = SafeDOM.div({ textContent: '<b>bold</b>' })
        expect(el.querySelector('b')).toBeNull()
        expect(el.textContent).toBe('<b>bold</b>')
    })

    it('children still work, and a click handler is attached', () => {
        const onClick = vi.fn()
        const button = SafeDOM.button({ onClick }, 'Save')
        button.click()
        expect(button.textContent).toBe('Save')
        expect(onClick).toHaveBeenCalledTimes(1)
    })
})
