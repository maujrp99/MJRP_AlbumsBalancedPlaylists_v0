/**
 * The scenarios of the phone's sheet engine of F83 wave 8c, written once so the hand-made engine (components/ui/Sheet.js, drawn through
 * ui/SheetWindow.tsx's `useSheetWindow`) and the React one are asked the same thing: the same openings, presses, keys, touches, the same
 * passing of time (fake timers), the same changes of the screen (phone or not, less motion), and what stands in the page after each step,
 * the focus, what the page behind was told (the pinned body, the scroll put back) and what whoever opened the sheet was told.
 *
 * Used by reports/evidence/F83/wave-8c/capture-before.test.js (run once, on the hand-made engine, before it was deleted: it wrote
 * test/fixtures/sheetEngineBeforeF83.json) and by test/ui/SheetWindow.sameAsBefore.test.tsx (the React engine, against that file).
 *
 * A scenario is `{ name, run(w) }`; `w` is the world test/support/sheetWorld.js builds: `w.a` and `w.b` (two `useSheetWindow()`s, as two screens
 * or a screen and a question hold two), `w.h` (createElement), `w.advance`, the person (`press`, `click`, `key`, `touch`), the screen (`setPhone`,
 * `setLessMotion`), and the notebook (`snap`, `state`, `note`, `log`).
 */

/** What the world tells that is not in the page: the page behind, the scroll put back, the order of what the opener heard. */
const request = (w, extra = {}) => ({
    title: 'Filters',
    closeLabel: 'Close',
    onClose: () => w.log('closed'),
    render: () => w.h('p', { className: 'inner' }, 'Body text'),
    ...extra
})

/** Writes the state of the page behind (the pinned body, the scroll put back) in the notebook. */
const state = (w, label) => w.note(`state · ${label}`, w.stateNow())

const field = (w, id) => w.h('button', { id, type: 'button' }, id)

const FORMS = ['bottom', 'full'].flatMap((variant) => [
    {
        name: `${variant}: opens with its handle, header, body and close button, and goes after the slide`,
        run: async (w) => {
            await w.snap('before')
            w.a.show(request(w, { variant, id: `${variant}Sheet`, render: () => w.h('p', { className: 'inner' }, 'Body text') }))
            state(w, 'just opened')
            await w.snap('just opened')
            await w.advance(16)
            await w.snap('one frame')
            await w.advance(184)
            await w.snap('200 ms')
            w.a.close()
            state(w, 'just closed')
            await w.snap('just closed')
            await w.advance(1)
            await w.snap('1 ms after')
            await w.advance(198)
            await w.snap('199 ms after')
            state(w, '199 ms after')
            await w.advance(1)
            await w.snap('200 ms after')
            state(w, '200 ms after')
            await w.advance(40)
            await w.snap('240 ms after')
            w.note('is it open', w.a.isOpen())
            w.note('the log', w.logged())
        }
    },
    {
        name: `${variant}: with a footer and something drawn in the title, focus on the first thing to act on`,
        run: async (w) => {
            w.a.show(request(w, {
                variant,
                titleExtra: () => w.h('span', { className: 'count' }, '3 albums'),
                render: () => w.h('div', null, w.h('p', null, 'Choose'), field(w, 'first'), field(w, 'second')),
                footer: () => field(w, 'save')
            }))
            await w.snap('opened with a footer')
            state(w, 'opened with a footer')
            await w.hit('Tab')
            await w.snap('Tab from the first')
            w.a.close()
            await w.snap('closed')
            await w.advance(200)
            await w.snap('gone')
        }
    },
    {
        name: `${variant}: focus stays on the sheet itself when the opener asks (focusFirst false), and comes back to the opener`,
        run: async (w) => {
            w.opener().focus()
            await w.snap('the opener has the focus')
            w.a.show(request(w, { variant, focusFirst: false, render: () => w.h('div', null, field(w, 'first')) }))
            await w.snap('opened, focus on the panel')
            w.a.close()
            await w.snap('closed, focus back')
            w.note('focus when onClose was called', w.logged())
        }
    },
    {
        name: `${variant}: the focus goes back to the opener before whoever opened it is told, and the page is let go before both`,
        run: async (w) => {
            w.opener().focus()
            w.a.show(request(w, { variant, onClose: () => w.log(`onClose: body ${w.pinned() ? 'pinned' : 'free'}, focus ${w.focus()}`) }))
            w.a.close()
            w.note('the order', w.logged())
        }
    }
])

const SCENARIOS = [
    ...FORMS,
    {
        name: 'the close button closes it, a second close is nothing, and the opener is told once',
        run: async (w) => {
            w.a.show(request(w, { variant: 'full' }))
            await w.click('.sheet__close')
            w.a.close()
            await w.snap('after the button and a second close')
            w.note('the log', w.logged())
            w.note('is it open', w.a.isOpen())
        }
    },
    {
        name: 'a bottom sheet closes on a tap outside; a full one does not; a tap on the panel is nothing',
        run: async (w) => {
            w.a.show(request(w, { variant: 'bottom' }))
            await w.click('.sheet__panel')
            await w.snap('tap on the panel')
            await w.click('.sheet__backdrop')
            await w.snap('tap outside')
            await w.advance(200)
            w.a.show(request(w, { variant: 'full' }))
            await w.click('.sheet__backdrop')
            await w.snap('full sheet, tap outside')
            w.note('is it open', w.a.isOpen())
        }
    },
    {
        name: 'Escape closes it and nobody under it hears the key',
        run: async (w) => {
            w.opener().addEventListener('keydown', (event) => w.log(`the opener heard ${event.key}`))
            w.opener().focus()
            w.a.show(request(w, { variant: 'bottom' }))
            await w.hit('Escape', document.activeElement)
            await w.snap('after Escape')
            w.note('the log', w.logged())
            await w.hit('Escape', w.opener())
            w.note('Escape with nothing open', w.logged())
        }
    },
    {
        name: 'a sheet over a sheet: Escape closes both, the page is given back once, when the last one closes',
        run: async (w) => {
            w.a.show(request(w, { variant: 'full', title: 'Menu', onClose: () => w.log('menu closed') }))
            w.b.show(request(w, { variant: 'bottom', title: 'Sure?', onClose: () => w.log('question closed') }))
            await w.snap('two open')
            state(w, 'two open')
            w.b.close()
            await w.snap('the one over it closed')
            state(w, 'one closed')
            w.a.close()
            await w.snap('both closed')
            state(w, 'both closed')
            await w.advance(240)
            w.note('the log', w.logged())
        }
    },
    {
        name: 'a sheet over a sheet: Escape is heard by both, the first opened is told first',
        run: async (w) => {
            w.a.show(request(w, { variant: 'full', title: 'Menu', onClose: () => w.log('menu closed') }))
            w.b.show(request(w, { variant: 'bottom', title: 'Sure?', onClose: () => w.log('question closed') }))
            await w.hit('Escape', document.activeElement)
            await w.snap('after Escape')
            w.note('the log', w.logged())
            state(w, 'after Escape')
        }
    },
    {
        name: 'Tab and Shift+Tab go round inside the sheet, and bring a focus that got out back in',
        run: async (w) => {
            w.a.show(request(w, { variant: 'full', render: () => w.h('div', null, field(w, 'first')), footer: () => field(w, 'save') }))
            const focused = async (label) => { await w.snap(label) }
            await focused('start')
            w.focusById('save')
            await w.hit('Tab', document.activeElement)
            await focused('Tab from the last goes to the first (the close button)')
            await w.hit('Tab', document.activeElement)
            await focused('Tab from the close button goes on')
            w.focusById('first')
            await w.hit('Tab', document.activeElement, { shiftKey: true })
            await focused('Shift+Tab from the middle goes back')
            w.focusById('save')
            await w.hit('Tab', document.activeElement, { shiftKey: true })
            await focused('Shift+Tab')
            w.opener().focus()
            await w.hit('Tab', document.activeElement)
            await focused('Tab with the focus out')
            w.opener().focus()
            await w.hit('Tab', document.activeElement, { shiftKey: true })
            await focused('Shift+Tab with the focus out')
        }
    },
    {
        name: 'a sheet with nothing to act on keeps the focus on itself on Tab',
        run: async (w) => {
            w.a.show(request(w, { variant: 'bottom', closeLabel: 'Close' }))
            w.removeCloseButton()
            await w.hit('Tab', document.activeElement)
            await w.snap('Tab with nothing to focus')
        }
    },
    {
        name: 'a drag down on the handle follows the finger, snaps back when let go early and closes past 80 px',
        run: async (w) => {
            w.a.show(request(w, { variant: 'bottom' }))
            const handle = () => document.querySelector('.sheet__handle')
            await w.touch(handle(), 'touchstart', 300)
            await w.touch(handle(), 'touchmove', 340)
            await w.snap('40 px down')
            await w.touch(handle(), 'touchmove', 280)
            await w.snap('up past where it began')
            await w.touch(handle(), 'touchend', 340)
            await w.snap('let go at 40 px')
            w.note('open after 40 px', w.a.isOpen())
            await w.touch(handle(), 'touchstart', 300)
            await w.touch(handle(), 'touchend', 380)
            await w.snap('let go at exactly 80 px')
            w.note('open at 80 px', w.a.isOpen())
            await w.touch(handle(), 'touchstart', 300)
            await w.touch(handle(), 'touchend', 381)
            await w.snap('let go at 81 px')
            w.note('open at 81 px', w.a.isOpen())
        }
    },
    {
        name: 'a drag down on the header does the same; a move with no start and the body are nothing; a full sheet is not dragged',
        run: async (w) => {
            w.a.show(request(w, { variant: 'bottom' }))
            const header = () => document.querySelector('.sheet__header')
            await w.touch(header(), 'touchmove', 400)
            await w.snap('a move with no start')
            await w.touch(document.querySelector('.sheet__body'), 'touchstart', 300)
            await w.touch(document.querySelector('.sheet__body'), 'touchmove', 400)
            await w.touch(document.querySelector('.sheet__body'), 'touchend', 500)
            await w.snap('a drag on the body')
            w.note('open after the body', w.a.isOpen())
            await w.touch(header(), 'touchstart', 300)
            await w.touch(header(), 'touchmove', 330)
            await w.snap('header, 30 px down')
            await w.touch(header(), 'touchend', 450)
            await w.snap('header, let go at 150 px')
            w.note('open after the header', w.a.isOpen())
            await w.advance(240)
            w.a.show(request(w, { variant: 'full' }))
            await w.touch(document.querySelector('.sheet__header'), 'touchstart', 300)
            await w.touch(document.querySelector('.sheet__header'), 'touchend', 500)
            w.note('a full sheet dragged', w.a.isOpen())
        }
    },
    {
        name: 'a drag whose end has no changed touch ends where it began, and a drag the sheet closed on does not move a closed sheet',
        run: async (w) => {
            w.a.show(request(w, { variant: 'bottom' }))
            const handle = document.querySelector('.sheet__handle')
            await w.touch(handle, 'touchstart', 300)
            await w.touch(handle, 'touchend', null)
            await w.snap('an end with no touch')
            w.note('open', w.a.isOpen())
            await w.touch(handle, 'touchstart', 300)
            w.a.close()
            await w.touch(handle, 'touchmove', 380)
            await w.snap('moved after it was closed')
        }
    },
    {
        name: 'it closes when the screen stops being a phone, and not before',
        run: async (w) => {
            w.a.show(request(w, { variant: 'full' }))
            w.setPhone(true)
            await w.snap('still a phone')
            w.note('open while still a phone', w.a.isOpen())
            w.setPhone(false)
            await w.snap('not a phone')
            w.note('open when it is not a phone', w.a.isOpen())
            state(w, 'after the change')
            w.note('listeners left', w.phoneListeners())
            await w.advance(240)
            await w.snap('gone')
        }
    },
    {
        name: 'a sheet closed when the screen is not a phone: the next one on a phone hears the change again',
        run: async (w) => {
            w.a.show(request(w, { variant: 'full' }))
            w.a.close()
            w.note('listeners left after a close', w.phoneListeners())
            w.a.show(request(w, { variant: 'full' }))
            w.note('listeners with the next one', w.phoneListeners())
            w.setPhone(false)
            w.note('open', w.a.isOpen())
        }
    },
    {
        name: 'for who asked the system for less motion it leaves at once, with no slide',
        run: async (w) => {
            w.setLessMotion(true)
            w.a.show(request(w, { variant: 'bottom' }))
            await w.snap('open, less motion')
            w.a.close()
            await w.snap('just closed, less motion')
            state(w, 'closed, less motion')
            w.note('is it open', w.a.isOpen())
        }
    },
    {
        name: 'the page behind is held at its place while open and found there after, with the real scroll',
        run: async (w) => {
            w.scrollAt(640)
            state(w, 'before')
            w.a.show(request(w, { variant: 'bottom' }))
            state(w, 'open at 640')
            await w.snap('open at 640')
            w.a.close()
            state(w, 'closed')
            await w.snap('closed')
            w.scrollAt(0)
            w.a.show(request(w, { variant: 'bottom' }))
            state(w, 'open at 0')
            w.a.close()
            state(w, 'closed at 0')
        }
    },
    {
        name: 'the screen is left with a sheet open: the page is let go, the focus goes back, the opener is told, the sheet is gone',
        run: async (w) => {
            w.opener().focus()
            w.a.show(request(w, { variant: 'bottom', onClose: () => w.log(`onClose focus ${w.focus()}`) }))
            await w.snap('open')
            w.leaveTheScreen()
            await w.snap('screen left')
            state(w, 'screen left')
            await w.advance(240)
            await w.snap('after the slide')
            w.note('the log', w.logged())
        }
    },
    {
        name: 'a title that changes while it is open, and a close button that has a name',
        run: async (w) => {
            w.a.show(request(w, { variant: 'full', title: 'Filters', closeLabel: 'Done' }))
            await w.snap('first title')
            w.a.setTitle('Filters (2)')
            await w.snap('new title')
            w.a.close()
            w.a.setTitle('Late')
            await w.snap('a title after it closed')
        }
    },
    {
        name: 'a title with HTML in it is text, and so is a body given as a string',
        run: async (w) => {
            w.a.show(request(w, { variant: 'bottom', title: '<img src=x onerror="window.__xss=1">', render: () => '<b>bold</b>' }))
            await w.snap('text, not HTML')
            w.note('an image in the title', document.querySelector('.sheet img') ? 'yes' : 'no')
        }
    },
    {
        name: 'the id of the sheet, the class it takes, the id of its title that goes up by one, and the name for the screen reader',
        run: async (w) => {
            w.a.show(request(w, { variant: 'bottom', id: 'mySheet', className: 'extra-one extra-two' }))
            const first = document.querySelector('.sheet__title').id
            w.a.close()
            await w.advance(240)
            w.a.show(request(w, { variant: 'full' }))
            const second = document.querySelector('.sheet__title').id
            w.note('the titles go up by', Number(second.replace('sheetTitle', '')) - Number(first.replace('sheetTitle', '')))
            await w.snap('the second')
            w.a.close()
            await w.advance(240)
        }
    },
    {
        name: 'open, close and open again at once: the second is a sheet of its own, and what is drawn in the first goes with it',
        run: async (w) => {
            w.a.show(request(w, { variant: 'bottom', title: 'First', render: () => w.h('p', null, 'one') }))
            w.a.close()
            w.a.show(request(w, { variant: 'bottom', title: 'Second', render: () => w.h('p', null, 'two') }))
            await w.snap('the second is up while the first slides')
            await w.advance(200)
            await w.snap('the first has gone')
            await w.advance(40)
            await w.snap('and what it held')
        }
    },
    {
        name: 'what is inside draws again when it asks to (the owner draws again), and a footer that takes the focus on mounting keeps it',
        run: async (w) => {
            w.a.show(request(w, {
                variant: 'full',
                focusFirst: false,
                render: () => w.h('p', null, 'Body'),
                footer: () => w.h(w.Autofocus, { id: 'apply' })
            }))
            await w.snap('the footer took the focus')
            w.a.close()
            await w.advance(240)
            w.a.show(request(w, {
                variant: 'full',
                render: () => w.h('div', null, field(w, 'first')),
                footer: () => w.h(w.Autofocus, { id: 'apply' })
            }))
            await w.snap('focusFirst true: the first thing in the body wins')
        }
    },
    {
        name: 'the owner is told when it opens a sheet with no body at all, and the first thing to act on is the footer',
        run: async (w) => {
            w.a.show(request(w, { variant: 'full', render: () => null, footer: () => field(w, 'only') }))
            await w.snap('only a footer')
            w.a.close()
            await w.advance(240)
            w.a.show(request(w, { variant: 'bottom', render: () => null }))
            await w.snap('nothing inside: the panel has the focus')
        }
    },
    {
        name: 'a sheet opened from a window that already pinned the page: the page is let go only by the last',
        run: async (w) => {
            w.scrollAt(300)
            w.pinTheBodyLikeAWindow()
            w.a.show(request(w, { variant: 'bottom' }))
            state(w, 'window and sheet')
            w.a.close()
            state(w, 'the sheet closed')
            w.unpinTheBodyLikeAWindow()
            state(w, 'the window closed')
        }
    },
    {
        name: 'the keyboard of the phone opens over a sheet (a field in it takes the focus): Escape still closes the sheet',
        run: async (w) => {
            w.a.show(request(w, { variant: 'full', focusFirst: false, render: () => w.h('input', { id: 'search', type: 'text', defaultValue: 'abc' }) }))
            w.focusById('search')
            await w.snap('a field has the focus')
            await w.hit('Escape', document.activeElement)
            await w.snap('after Escape')
            w.note('the log', w.logged())
        }
    }
]

export const SHEET_SCENARIOS = SCENARIOS
export const sheetKeyOf = (scenario) => scenario.name
