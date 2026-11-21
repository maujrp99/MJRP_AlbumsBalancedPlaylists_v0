/**
 * startHarness - the old tests of the Home, carried to the Start screen in React (F83 wave 4; proposal § 9.2: «muda o andaime, não a asserção»).
 *
 * Those tests built the hand-made view (`new HomeView()`, `render`, `mount`, `destroy`), read the page by selector and pressed it
 * with `.click()` and `dispatchEvent`, and read the controller through `view.controller`. This is the same handle over the screen in React:
 * `new HomeView()` here makes the controller and the route's view (ReactView, with its strict mode and its error barrier) and mounts it in
 * `#app` the way the router does; `view.controller` is the controller; and while the screen is mounted a press or an event is run inside
 * React's `act`, so the page is drawn again by the time the call returns (as the hand-made page was). What the tests assert did not change.
 */
import { act } from 'react'
import { ReactView } from '../../public/js/react-bridge/ReactView'
import { Start } from '../../public/js/screens/start/Start'
import { StartController } from '../../public/js/screens/start/StartController'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const realClick = HTMLElement.prototype.click
const realDispatch = EventTarget.prototype.dispatchEvent
let mounted = 0

function inAct(work) {
    let result
    act(() => { result = work() })
    return result
}

export class HomeView {
    constructor() {
        this.controller = new StartController()
        // The old tests called the controller (`view.controller.setMode(...)`) and a timer or a promise drew the page, all by themselves; here each
        // notice of the controller is drawn inside `act`, so the page is drawn again by the time the call returns, whoever made the call.
        const touch = this.controller.touch.bind(this.controller)
        this.controller.touch = () => { act(() => { touch() }) }
        this.view = new ReactView(Start, { controller: this.controller }, {
            screen: 'start',
            prepare: async () => { this.controller.initialize() },
            dispose: () => this.controller.dispose()
        })
    }

    render(params = {}) {
        return this.view.render(params)
    }

    async mount(params = {}) {
        mounted += 1
        if (mounted === 1) {
            HTMLElement.prototype.click = function click() { return inAct(() => realClick.call(this)) }
            EventTarget.prototype.dispatchEvent = function dispatchEvent(event) { return inAct(() => realDispatch.call(this, event)) }
        }
        await act(async () => { this.view.mount(params) })
    }

    destroy() {
        act(() => { this.view.destroy() })
        mounted -= 1
        if (mounted === 0) {
            HTMLElement.prototype.click = realClick
            EventTarget.prototype.dispatchEvent = realDispatch
        }
    }

    /** What the tests wait with: the page is drawn again when a timer of 0 ms has run, inside `act`. */
    static async flush() {
        await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)) })
    }
}

export const flush = HomeView.flush
