/**
 * The scenarios of the engines of F83 wave 8b (the notices, the question windows and the loading bar), written once so the hand-made engines
 * (components/Toast.js, services/DialogService.js with BaseModal, ConfirmModal and InputModal, components/GlobalProgress.js) and the React ones
 * are asked the same thing: the same calls, the same presses and keys, the same passing of time (fake timers), and what stands in the page
 * after each step, the focus, and what the caller was answered.
 *
 * Used by reports/evidence/F83/wave-8b/capture-before.test.js (run once, on the hand-made engines, before they were deleted: it wrote
 * test/fixtures/engines*BeforeF83.json) and by test/ui/engines.sameAsBefore.test.tsx (the React engines, against those files).
 *
 * A scenario is `{ name, run(w) }`; `w` is the world the test builds: the engine under test (`toast`, `showToast`, `dialogs`, `progress`), the
 * clock (`advance(ms)`), the person (`click`, `type`, `key`), and the notebook (`snap`, `note`).
 */
import { normalize } from './savedPlaylistsScenarios.js'

/** What has the focus, in words. */
export function focusOf() {
    const active = document.activeElement
    if (!active || active === document.body) return 'body'
    return `${active.tagName.toLowerCase()} ${active.id || active.getAttribute('aria-label') || active.className}`
}

/** A piece of the page as the proof compares it: every element, attribute, state of a field, the focused one and every text node as written. */
export function pageOf(root = document.body) {
    if (!root) return null
    const clone = root.cloneNode(true)
    const live = [root, ...root.querySelectorAll('*')]
    const copy = [clone, ...clone.querySelectorAll('*')]
    live.forEach((element, index) => {
        if (element === document.activeElement && element !== document.body) copy[index].setAttribute('data-focused', 'true')
        if (element.tagName === 'INPUT') copy[index].setAttribute('data-typed', element.value)
        if (element.tagName === 'BUTTON') copy[index].setAttribute('data-is-disabled', String(element.disabled))
    })
    const texts = []
    const walk = (node) => {
        for (const child of node.childNodes) {
            if (child.nodeType === 3) { if (child.textContent.trim()) texts.push(child.textContent) } else walk(child)
        }
    }
    walk(root)
    return `${normalize(clone)}\n${JSON.stringify(texts)}`
}

const KINDS = ['success', 'error', 'warning', 'info']

const TOAST = KINDS.map((kind) => ({
    name: `toast ${kind}: it comes in, stays 4 s, goes out in 300 ms`,
    run: async (w) => {
        w.snap('before')
        w.toast[kind](`A ${kind} notice`)
        w.snap('just called')
        await w.advance(16)
        w.snap('one frame')
        await w.advance(3983)
        w.snap('3999 ms')
        await w.advance(1)
        w.snap('4000 ms')
        await w.advance(299)
        w.snap('4299 ms')
        await w.advance(1)
        w.snap('4300 ms')
    }
}))

const TOASTS = [
    ...TOAST,
    {
        name: 'toast with a duration of its own',
        run: async (w) => {
            w.toast.info('Short', 1000)
            await w.advance(16)
            await w.advance(983)
            w.snap('999 ms')
            await w.advance(1)
            w.snap('1000 ms')
            await w.advance(300)
            w.snap('1300 ms')
        }
    },
    {
        name: 'showToast with no type is an info notice, and with all three arguments is that notice',
        run: async (w) => {
            w.showToast('Plain')
            w.showToast('Typed', 'warning', 500)
            await w.advance(16)
            w.snap('both')
            await w.advance(484)
            w.snap('500 ms')
            await w.advance(300)
            w.snap('800 ms')
            await w.advance(3200)
            w.snap('4000 ms')
            await w.advance(300)
            w.snap('4300 ms')
        }
    },
    {
        name: 'a duration of zero: the notice leaves at once, and a frame later it is drawn as shown for what is left of the 300 ms',
        run: async (w) => {
            w.toast.success('Gone fast', 0)
            await w.advance(1)
            w.snap('1 ms')
            await w.advance(15)
            w.snap('one frame')
            await w.advance(284)
            w.snap('300 ms')
            await w.advance(1)
            w.snap('301 ms')
        }
    },
    {
        name: 'several notices stack, the newest last, and each goes on its own time',
        run: async (w) => {
            w.toast.success('First')
            await w.advance(1000)
            w.toast.error('Second')
            await w.advance(1000)
            w.toast.warning('Third')
            await w.advance(16)
            w.snap('three, 2016 ms')
            await w.advance(1984)
            w.snap('first leaves, 4000 ms')
            await w.advance(300)
            w.snap('first gone, 4300 ms')
            await w.advance(700)
            w.snap('second leaves, 5000 ms')
            await w.advance(300)
            w.snap('second gone')
            await w.advance(700)
            w.snap('third leaves, 6000 ms')
            await w.advance(300)
            w.snap('all gone')
        }
    },
    {
        name: 'five at once, then the same message twice',
        run: async (w) => {
            for (let i = 1; i <= 5; i++) w.toast.info(`Notice ${i}`)
            w.toast.info('Same')
            w.toast.info('Same')
            await w.advance(16)
            w.snap('seven')
            await w.advance(4284)
            w.snap('all gone')
        }
    },
    {
        name: 'the close button: out in 300 ms, and the timer of the 4 s does nothing afterwards',
        run: async (w) => {
            w.toast.success('Closable')
            await w.advance(16)
            await w.click('.toast-close')
            w.snap('pressed')
            await w.advance(299)
            w.snap('299 ms after')
            await w.advance(1)
            w.snap('gone')
            await w.advance(5000)
            w.snap('after the 4 s')
        }
    },
    {
        name: 'the close button of the middle one, and a second press while it leaves',
        run: async (w) => {
            w.toast.success('One')
            w.toast.error('Two')
            w.toast.info('Three')
            await w.advance(16)
            const buttons = [...document.querySelectorAll('.toast-close')]
            await w.press(buttons[1])
            await w.advance(100)
            await w.press(buttons[1])
            w.snap('pressed twice')
            await w.advance(200)
            w.snap('the middle one is gone')
            await w.advance(4000)
            w.snap('all gone')
        }
    },
    {
        name: 'a text is text, not markup',
        run: async (w) => {
            w.toast.error('<img src=x onerror="window.__xss=1"> & "quoted" <b>bold</b>')
            await w.advance(16)
            w.snap('drawn')
            w.note('xss', window.__xss ?? null)
            await w.advance(4300)
        }
    },
    {
        name: 'a notice called after the others left draws again where they were',
        run: async (w) => {
            w.toast.info('Early')
            await w.advance(4300)
            w.snap('empty')
            w.toast.success('Late')
            await w.advance(16)
            w.snap('late')
            await w.advance(4300)
            w.snap('empty again')
        }
    }
]

const PROGRESS = [
    {
        name: 'progress: one loader, hidden 200 ms after it finishes',
        run: async (w) => {
            w.snapBar('idle')
            w.progress.start()
            w.snapBar('started')
            w.note('active', w.progress.isActive())
            w.progress.finish()
            w.note('active after finish', w.progress.isActive())
            w.snapBar('finished, 0 ms')
            await w.advance(199)
            w.snapBar('199 ms')
            await w.advance(1)
            w.snapBar('200 ms')
        }
    },
    {
        name: 'progress: the bar stays while any loader is on, and an extra finish does not go below zero',
        run: async (w) => {
            w.progress.start()
            w.progress.start()
            w.progress.finish()
            await w.advance(500)
            w.snapBar('one of two done')
            w.note('active', w.progress.isActive())
            w.progress.finish()
            w.progress.finish()
            w.note('active after the extra finish', w.progress.isActive())
            await w.advance(200)
            w.snapBar('both done')
            w.progress.start()
            w.note('active after a new start', w.progress.isActive())
            w.snapBar('one again')
            w.progress.finish()
            await w.advance(200)
            w.snapBar('hidden')
        }
    },
    {
        name: 'progress: a loader that starts inside the 200 ms keeps the bar',
        run: async (w) => {
            w.progress.start()
            w.progress.finish()
            await w.advance(100)
            w.progress.start()
            await w.advance(300)
            w.snapBar('kept by the new loader')
            w.progress.finish()
            await w.advance(200)
            w.snapBar('hidden')
        }
    },
    {
        name: 'progress: forceHide hides it now and forgets the loaders',
        run: async (w) => {
            w.progress.start()
            w.progress.start()
            w.progress.forceHide()
            w.snapBar('forced')
            w.note('active', w.progress.isActive())
            w.progress.start()
            w.snapBar('a new one shows it')
            w.progress.forceHide()
        }
    }
]

const opener = (w) => {
    const button = document.body.appendChild(document.createElement('button'))
    button.id = 'opener'
    button.textContent = 'Open'
    button.focus()
    w.note('focus at the start', focusOf())
}

const DIALOGS = [
    {
        name: 'confirm: the window, with no focus taken, and nothing a click on the backdrop or the panel does',
        run: async (w) => {
            opener(w)
            const answer = w.track(w.dialogs.confirm({ title: 'Delete the series?', message: 'It cannot be undone.' }))
            w.snap('open')
            w.note('focus open', focusOf())
            await w.advance(50)
            w.note('focus a frame later', focusOf())
            await w.press(document.getElementById('confirm-modal'))
            await w.press(document.querySelector('.app-modal__panel'))
            await w.press(document.querySelector('.app-modal__body'))
            w.snap('after the clicks')
            w.note('answered', answer.state)
            await w.press(document.querySelector('[data-action="cancel"]'))
            w.note('answered after cancel', answer.state)
            w.note('focus after', focusOf())
            w.snap('closed')
        }
    },
    ...['primary', 'danger', 'warning', 'unknown'].map((variant) => ({
        name: `confirm: the variant ${variant}, with its own words`,
        run: async (w) => {
            const answer = w.track(w.dialogs.confirm({ title: 'Title', message: 'Message', confirmText: 'Yes, do it', cancelText: 'No', variant }))
            w.snap('open')
            await w.press(document.querySelector('[data-action="confirm"]'))
            w.note('answered', answer.state)
            w.snap('closed')
        }
    })),
    {
        name: 'confirm: the cross is Cancel, Escape is Cancel and removes its own listener',
        run: async (w) => {
            let answer = w.track(w.dialogs.confirm({ title: 'T', message: 'M' }))
            await w.press(document.querySelector('.app-modal__close'))
            w.note('cross', answer.state)
            w.snap('after the cross')
            answer = w.track(w.dialogs.confirm({ title: 'T', message: 'M' }))
            await w.key('Escape')
            w.note('escape', answer.state)
            w.snap('after escape')
            await w.key('Escape')
            await w.key('Enter')
            w.snap('after escape and enter with nothing open')
        }
    },
    {
        name: 'confirm: one window at a time, the first is answered as cancelled',
        run: async (w) => {
            const first = w.track(w.dialogs.confirm({ title: 'First', message: '1' }))
            const second = w.track(w.dialogs.confirm({ title: 'Second', message: '2', variant: 'danger' }))
            await w.advance(5)
            w.note('first', first.state)
            w.note('second', second.state)
            w.snap('second on the page')
            await w.key('Escape')
            w.note('second after escape', second.state)
            const third = w.track(w.dialogs.prompt({ title: 'Third', message: '3' }))
            const fourth = w.track(w.dialogs.confirm({ title: 'Fourth', message: '4' }))
            await w.advance(5)
            w.note('third', third.state)
            w.snap('fourth on the page')
            w.dialogs.dismiss()
            await w.advance(5)
            w.note('fourth', fourth.state)
            w.snap('nothing')
            w.dialogs.dismiss()
        }
    },
    {
        name: 'confirm: the text of the title and the message is text',
        run: async (w) => {
            w.track(w.dialogs.confirm({ title: '<b>Bold</b> & "title"', message: '<img src=x onerror="window.__xss=1"> message' }))
            w.snap('open')
            w.note('xss', window.__xss ?? null)
            w.dialogs.dismiss()
        }
    },
    {
        name: 'alert: one window with OK and an empty cancel, answered with nothing',
        run: async (w) => {
            const answer = w.track(w.dialogs.alert('Heads up', 'Something happened.'))
            w.snap('open')
            await w.press(document.querySelector('[data-action="confirm"]'))
            w.note('answered', answer.state)
            w.snap('closed')
            const second = w.track(w.dialogs.alert('Again', 'Escape this one.'))
            await w.key('Escape')
            w.note('answered by escape', second.state)
        }
    },
    {
        name: 'prompt: the window, the focus on the field a frame later, the confirm button off until there is text',
        run: async (w) => {
            opener(w)
            const answer = w.track(w.dialogs.prompt({ title: 'Name the series' }))
            w.snap('open')
            w.note('focus open', focusOf())
            await w.advance(16)
            w.note('focus a frame later', focusOf())
            w.snap('a frame later')
            await w.type('input', 'Rock classics')
            w.snap('typed')
            await w.type('input', '   ')
            w.snap('only spaces')
            await w.type('input', 'Jazz')
            await w.press(document.querySelectorAll('.app-modal__footer button')[1])
            w.note('answered', answer.state)
            w.note('focus after', focusOf())
            w.snap('closed')
        }
    },
    {
        name: 'prompt: message, label, initial value, placeholder, its own words and its own rule',
        run: async (w) => {
            const answer = w.track(w.dialogs.prompt({
                title: 'Rename', message: 'Pick a short name.', label: 'Name', initialValue: 'Old name', placeholder: 'A name',
                confirmText: 'Rename it', cancelText: 'Leave', validate: (value) => value.length >= 3 && value !== 'Old name'
            }))
            await w.advance(16)
            w.snap('open, the old name is not valid')
            await w.type('input', 'ab')
            w.snap('two letters')
            await w.type('input', 'abc')
            w.snap('three letters')
            await w.key('Enter', document.querySelector('input'))
            w.note('answered by Enter', answer.state)
            w.snap('closed')
        }
    },
    {
        name: 'prompt: Enter does nothing while the text is not valid, and on a valid one it answers once',
        run: async (w) => {
            const answer = w.track(w.dialogs.prompt({ title: 'T', initialValue: '' }))
            await w.advance(16)
            await w.key('Enter', document.querySelector('input'))
            w.note('answered by Enter on an empty field', answer.state)
            w.snap('still open')
            await w.type('input', 'x')
            await w.key('Enter', document.querySelector('input'))
            w.note('answered', answer.state)
            w.snap('closed')
        }
    },
    {
        name: 'prompt: Escape, the cross and Cancel answer null',
        run: async (w) => {
            let answer = w.track(w.dialogs.prompt({ title: 'T', message: 'M' }))
            await w.key('Escape')
            w.note('escape', answer.state)
            answer = w.track(w.dialogs.prompt({ title: 'T' }))
            await w.press(document.querySelector('.app-modal__close'))
            w.note('cross', answer.state)
            answer = w.track(w.dialogs.prompt({ title: 'T' }))
            await w.press(document.querySelectorAll('.app-modal__footer button')[0])
            w.note('cancel', answer.state)
            w.snap('closed')
        }
    },
    {
        name: 'prompt: a valid initial value answers with it, and a second prompt starts clean',
        run: async (w) => {
            let answer = w.track(w.dialogs.prompt({ title: 'T', initialValue: 'Kept' }))
            w.snap('open, valid')
            await w.press(document.querySelectorAll('.app-modal__footer button')[1])
            w.note('answered', answer.state)
            answer = w.track(w.dialogs.prompt({ title: 'T2' }))
            w.snap('the second one, empty and off')
            await w.key('Escape')
        }
    },
    {
        name: 'prompt: the text of the title, message, label and placeholder is text',
        run: async (w) => {
            w.track(w.dialogs.prompt({ title: '<i>t</i>', message: '<b>m</b>', label: '<u>l</u>', placeholder: '"<p>"', initialValue: '<s>v</s>' }))
            w.snap('open')
            w.dialogs.dismiss()
        }
    },
    {
        name: 'a question that stays over a screen change is not taken off by closing what a screen opened',
        run: async (w) => {
            const answer = w.track(w.dialogs.confirm({ title: 'T', message: 'M' }))
            w.screenLeft()
            await w.advance(5)
            w.snap('after the screen was left')
            w.note('answered', answer.state)
            w.dialogs.dismiss()
        }
    }
]

export const TOAST_SCENARIOS = TOASTS
export const PROGRESS_SCENARIOS = PROGRESS
export const DIALOG_SCENARIOS = DIALOGS
export const keyOf = (scenario) => scenario.name

/** The sizes and shapes of the shell of a window (components/ui/BaseModal.js), for the picture kept of it. */
export const SHELL_CASES = ['sm', 'md', 'lg', 'xl', 'unknown'].flatMap((size) => ['full', 'bottom', undefined].flatMap((sheet) => [true, false].map((withFooter) => ({ size, sheet, withFooter }))))
