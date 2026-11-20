import { redrawKeepingField } from '../../public/js/utils/keepField.js'

const draw = (container, html) => () => { container.innerHTML = html }

describe('a screen drawn again keeps the field in use (F73, UAT-212)', () => {
    let container

    beforeEach(() => {
        document.body.innerHTML = '<div id="app"></div><input id="outside">'
        container = document.getElementById('app')
        container.innerHTML = '<input id="batchNameInput" type="text" value="My mix"><button id="save">Save</button>'
    })

    it('hands back the field, the text typed and the cursor', () => {
        const before = container.querySelector('#batchNameInput')
        before.focus()
        before.value = 'My mix of the 70s'
        before.setSelectionRange(6, 6)

        redrawKeepingField(container, draw(container, '<input id="batchNameInput" type="text" value="My mix"><button id="save">Save</button>'))

        const after = container.querySelector('#batchNameInput')
        expect(after).not.toBe(before)
        expect(document.activeElement).toBe(after)
        expect(after.value).toBe('My mix of the 70s')
        expect(after.selectionStart).toBe(6)
        expect(after.selectionEnd).toBe(6)
    })

    it('does nothing more than draw when no field is in use', () => {
        redrawKeepingField(container, draw(container, '<input id="batchNameInput" type="text" value="Other">'))
        expect(document.activeElement).toBe(document.body)
        expect(container.querySelector('#batchNameInput').value).toBe('Other')
    })

    it('leaves a field outside the container alone', () => {
        const outside = document.getElementById('outside')
        outside.focus()
        redrawKeepingField(container, draw(container, '<input id="batchNameInput" type="text">'))
        expect(document.activeElement).toBe(outside)
    })

    it('draws and moves on when the field is gone from the new screen', () => {
        container.querySelector('#batchNameInput').focus()
        redrawKeepingField(container, draw(container, '<p>No playlists</p>'))
        expect(container.textContent).toBe('No playlists')
    })

    it('does not take the focus for a button that was in use', () => {
        container.querySelector('#save').focus()
        redrawKeepingField(container, draw(container, '<button id="save">Save</button>'))
        expect(document.activeElement).toBe(document.body)
    })

    it('hands back a number field, which has no cursor to set', () => {
        container.innerHTML = '<input id="price" type="number" value="1">'
        const before = container.querySelector('#price')
        before.focus()
        before.value = '12'
        redrawKeepingField(container, draw(container, '<input id="price" type="number" value="1">'))
        const after = container.querySelector('#price')
        expect(document.activeElement).toBe(after)
        expect(after.value).toBe('12')
    })
})

describe('a screen drawn again stays where the person was on the page (F73, UAT-219)', () => {
    let container
    let scrollTo

    beforeEach(() => {
        document.body.innerHTML = '<div id="app"><p>long list</p></div>'
        container = document.getElementById('app')
        scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation((x, y) => { window.scrollX = x; window.scrollY = y })
        window.scrollX = 0
        window.scrollY = 1800
    })
    afterEach(() => {
        scrollTo.mockRestore()
        window.scrollX = 0
        window.scrollY = 0
    })

    it('puts the scroll back when the redraw took it to the top', () => {
        redrawKeepingField(container, () => {
            container.innerHTML = '' // the page is short for a moment: the browser goes to the top
            window.scrollY = 0
            container.innerHTML = '<p>long list, drawn again</p>'
        })
        expect(scrollTo).toHaveBeenCalledWith(0, 1800)
        expect(window.scrollY).toBe(1800)
    })

    it('does not touch the scroll when the redraw left it alone', () => {
        redrawKeepingField(container, () => { container.innerHTML = '<p>same height</p>' })
        expect(scrollTo).not.toHaveBeenCalled()
    })
})
