/**
 * PhoneShell - what frames every screen on the phone (F76, REQ-03): a low top bar that says where
 * the person is and opens the menu, the tab bar at the bottom with the five destinations, and a
 * «back to top» button after two screens of scroll. Styles: public/css/mobile.css.
 *
 * It exists only on the phone: its elements are put on the page when the screen is a phone and
 * taken away when it stops being one (a turn of the phone, a resized window). On the computer
 * nothing of it is on the page. The top nav and the footer of the computer stay in the page and
 * are hidden on the phone by the stylesheet.
 */
import { getIcon } from '../Icons.js'
import { isPhone, onPhoneChange } from '../../utils/isPhone.js'
import { giveBackAStrayHold, holdPageBehindWindows } from '../ui/windowsHoldThePage.js'
import { renderTabBar, screenName, currentTab } from './phoneTabs.js'
import { openPhoneMenu, accountInitial } from './PhoneMenu.js'
import { isSignedIn } from './AuthNav.js'
import { MENU_TEXT } from './menuText.js'
import { WORDMARK_URL, WORDMARK_WIDTH, WORDMARK_HEIGHT } from './wordmark.js'

/** «Back to top» shows after this many screens of scroll (finding 23 of the UX audit). */
const SCREENS_BEFORE_TO_TOP = 2

export class PhoneShell {
    /**
     * @param {Object} deps
     * @param {Object} deps.router - tells when the screen changes (afterNavigate)
     * @param {Object} deps.userStore - who is signed in (getState, subscribe)
     * @param {Function} deps.clearCaches - () => Promise: forgets what the browser keeps about albums
     * @param {Window} [deps.win]
     */
    constructor({ router, userStore, clearCaches, win = window }) {
        this.router = router
        this.userStore = userStore
        this.clearCaches = clearCaches
        this.win = win
        this.doc = win.document
        this.parts = null
        this.menu = null
        this.nameGiven = null
        this.lastPath = null
        this.onScroll = () => this.showToTop()
    }

    /** Called once, when the app starts. */
    start() {
        this.sync(isPhone(this.win))
        onPhoneChange((phone) => this.sync(phone), this.win)
        this.router.afterNavigate((path) => this.screenChanged(path))
        this.userStore.subscribe(() => this.drawTopBar())
    }

    sync(phone) {
        if (phone) this.mount()
        else this.unmount()
    }

    get path() {
        return this.win.location.pathname
    }

    mount() {
        if (this.parts) return
        const topBar = this.doc.createElement('header')
        topBar.id = 'phone-topbar'
        topBar.className = 'phone-topbar'
        const tabBar = this.doc.createElement('div')
        tabBar.id = 'phone-tabbar'
        tabBar.className = 'phone-tabbar'
        const toTop = this.doc.createElement('button')
        toTop.type = 'button'
        toTop.className = 'phone-to-top'
        toTop.hidden = true
        toTop.setAttribute('aria-label', 'Back to top')
        toTop.innerHTML = getIcon('ArrowUp', 'phone-to-top__icon')

        this.parts = { topBar, tabBar, toTop, giveThePageBack: holdPageBehindWindows(this.win) }
        this.doc.body.append(topBar, tabBar, toTop)

        topBar.addEventListener('click', (event) => { if (event.target.closest('#phoneMenuBtn')) this.openMenu() })
        tabBar.addEventListener('click', (event) => this.tabTapped(event))
        toTop.addEventListener('click', () => this.toTop())
        this.win.addEventListener('scroll', this.onScroll, { passive: true })

        this.lastPath = this.path
        this.drawTopBar()
        this.drawTabBar()
        this.showToTop()
    }

    unmount() {
        if (!this.parts) return
        const { topBar, tabBar, toTop, giveThePageBack } = this.parts
        this.win.removeEventListener('scroll', this.onScroll)
        giveThePageBack()
        this.menu?.close()
        this.menu = null
        for (const part of [topBar, tabBar, toTop]) part.remove()
        this.parts = null
    }

    /**
     * A screen may give itself a more exact name than its address has (the name of a series, say).
     * It lasts until the next screen.
     * @param {string|null} text
     */
    setScreenName(text) {
        this.nameGiven = text || null
        this.drawTopBar()
    }

    screenChanged(path) {
        this.nameGiven = null
        if (!this.parts) return
        this.menu?.close()
        giveBackAStrayHold(this.win) // a hold left with nothing open never outlives its screen (recheck N22)
        // A new screen starts at its top; the same screen drawn again stays where it was
        if (path !== this.lastPath) this.win.scrollTo(0, 0)
        this.lastPath = path
        this.drawTopBar()
        this.drawTabBar()
    }

    drawTopBar() {
        if (!this.parts) return
        const user = this.userStore.getState().currentUser
        const account = isSignedIn(user)
            ? '<span class="phone-avatar" data-account-initial></span>'
            : getIcon('Menu', 'phone-topbar__menu-icon')
        this.parts.topBar.innerHTML = `
          <a class="phone-topbar__logo-link" href="/home" data-full-page aria-label="${MENU_TEXT.entryPage}"><img class="phone-topbar__logo" src="${WORDMARK_URL}" alt="" width="${WORDMARK_WIDTH}" height="${WORDMARK_HEIGHT}"></a>
          <span class="phone-topbar__title" data-screen-name></span>
          <button type="button" id="phoneMenuBtn" class="phone-topbar__menu" aria-haspopup="dialog" aria-label="Menu and account">${account}</button>`
        // What a person wrote goes in as text, never as HTML
        this.parts.topBar.querySelector('[data-screen-name]').textContent = this.nameGiven || screenName(this.path)
        const initial = this.parts.topBar.querySelector('[data-account-initial]')
        if (initial) initial.textContent = accountInitial(user)
    }

    drawTabBar() {
        if (this.parts) this.parts.tabBar.innerHTML = renderTabBar(this.path)
    }

    /** A tap on the tab of the screen the person is on goes to the top of it, as on the iPhone. */
    tabTapped(event) {
        const tab = event.target.closest('a[data-tab]')
        if (!tab || tab.getAttribute('href') !== this.path || currentTab(this.path)?.id !== tab.dataset.tab) return
        event.preventDefault()
        event.stopPropagation()
        this.toTop()
    }

    openMenu() {
        if (this.menu?.isOpen()) return
        this.menu = openPhoneMenu({ user: this.userStore.getState().currentUser, clearCaches: this.clearCaches })
    }

    showToTop() {
        if (!this.parts) return
        this.parts.toTop.hidden = this.win.scrollY < this.win.innerHeight * SCREENS_BEFORE_TO_TOP
    }

    toTop() {
        const still = this.win.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        this.win.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' })
    }
}

let started = null

/** Starts the shell of the phone, once, when the app starts (app.js). */
export function startPhoneShell(deps) {
    started = new PhoneShell(deps)
    started.start()
    return started
}

/**
 * For a screen: its own name in the top bar of the phone, in place of the name of its address
 * (the name of the series being shown, say). It lasts until the next screen; on the computer it
 * does nothing.
 * @param {string} text
 */
export function nameThisScreen(text) {
    started?.setScreenName(text)
}
