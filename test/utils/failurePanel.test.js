/**
 * F83 TASK-04: the panel a failed screen shows is made in one place. The router writes it as HTML for the hand-made
 * screens and the error barrier of the React bridge draws it from the same model, so the text and the buttons are the
 * same for the person (REQ-01).
 */
import { describe, it, expect } from 'vitest'
import { errorPanelModel, errorPanelHtml } from '../../public/js/utils/failurePanel.js'

describe('the panel of a screen that failed to draw (F83)', () => {
    const error = Object.assign(new Error('albums is not iterable'), { stack: 'Error: albums is not iterable\n    at draw (x.js:1:1)' })

    it('the model names the title, the detail and the button', () => {
        expect(errorPanelModel(error)).toEqual({
            title: 'View Error',
            detail: 'albums is not iterable\nError: albums is not iterable\n    at draw (x.js:1:1)',
            backLabel: 'Go Back'
        })
    })

    it('the HTML is what the router wrote before: the same classes, the same text, the same button', () => {
        const html = errorPanelHtml(errorPanelModel(error))
        const host = document.createElement('div')
        host.innerHTML = html

        expect(host.querySelector('.text-red-500.text-xl.font-bold.mb-2').textContent).toBe('View Error')
        expect(host.querySelector('pre.bg-black\\/30').textContent).toBe('albums is not iterable\nError: albums is not iterable\n    at draw (x.js:1:1)')
        const button = host.querySelector('button.btn.btn-secondary.mt-4')
        expect(button.textContent).toBe('Go Back')
        expect(button.getAttribute('onclick')).toBe('window.history.back()')
    })

    it('what comes from the error is escaped in the HTML', () => {
        const hostile = Object.assign(new Error('<img src=x onerror=alert(1)>'), { stack: '<b>stack</b>' })
        const host = document.createElement('div')
        host.innerHTML = errorPanelHtml(errorPanelModel(hostile))

        expect(host.querySelector('img')).toBeNull()
        expect(host.querySelector('pre').textContent).toContain('<img src=x onerror=alert(1)>')
    })

    it('an error with no message or stack still gives a model', () => {
        expect(errorPanelModel(undefined).detail).toBe('undefined\nundefined')
    })
})
