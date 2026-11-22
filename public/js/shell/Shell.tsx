/**
 * Shell - what frames every screen of the site, in React (F83 wave 3, proposal § 4.1): the top bar and the footer of the computer, the shell
 * of the phone, the window to sign in. app.js starts it once, when the app starts (`startShell`); it is the only file that imports this folder.
 *
 * It lives outside `#app`, which the router empties at each screen: a root for `#header-container`, one for `#footer-container`, and one
 * for what is put straight in the body (the shell of the phone and the window to sign in), and one each for the notices and the loading bar. It hears the router (the end of each navigation),
 * the user store, the language and the width of the screen; stopping it takes everything away and lets go of every listener.
 */
import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { TopNav } from './TopNav'
import { Footer } from './Footer'
import { PhoneShell } from './PhoneShell'
import { LoginWindow } from './LoginWindow'
import { Toasts } from './Toasts'
import { GlobalProgress } from './GlobalProgress'
import { ShellContext, watchRoute, type RouterLike, type ShellDeps, type UserStoreLike } from './context'

export interface ShellOptions {
    router: RouterLike
    userStore: UserStoreLike
    /** Forgets what the browser keeps about albums. */
    clearCaches: () => Promise<void>
    /** Loads the page again; the default is the browser's. */
    reload?: () => void
}

/** An error in a part of the shell takes that part away and nothing else: the screens go on. */
class ShellBarrier extends Component<{ children: ReactNode }, { failed: boolean }> {
    state = { failed: false }

    static getDerivedStateFromError(): { failed: boolean } {
        return { failed: true }
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        console.error('[Shell] A part of the shell could not be drawn:', error, info.componentStack)
    }

    render(): ReactNode {
        return this.state.failed ? null : this.props.children
    }
}

function Layers() {
    return (
        <>
            <PhoneShell />
            <LoginWindow />
        </>
    )
}

/**
 * Puts the shell on the page.
 * @returns what stops it: every root is unmounted and nothing is left listening
 */
export function startShell({ router, userStore, clearCaches, reload = () => window.location.reload() }: ShellOptions): () => void {
    const routeWatch = watchRoute(router)
    const deps: ShellDeps = { userStore, routeWatch, clearCaches, reload }
    const roots: Root[] = []
    const draw = (container: Element, part: ReactNode) => {
        const root = createRoot(container)
        flushSync(() => root.render(
            <StrictMode>
                <ShellContext.Provider value={deps}>
                    <ShellBarrier>{part}</ShellBarrier>
                </ShellContext.Provider>
            </StrictMode>
        ))
        roots.push(root)
    }

    const header = document.getElementById('header-container')
    if (header) draw(header, <TopNav />)
    const footer = document.getElementById('footer-container')
    if (footer) draw(footer, <Footer />)
    // the shell of the phone and the window to sign in write straight in the body: their root has no place of its own on the page
    draw(document.createElement('div'), <Layers />)
    // the notices and the loading bar (wave 8b), each in a root of its own: a part that breaks takes only itself away
    draw(document.createElement('div'), <Toasts />)
    draw(document.createElement('div'), <GlobalProgress />)

    return () => {
        roots.forEach(root => root.unmount())
        routeWatch.stop()
    }
}
