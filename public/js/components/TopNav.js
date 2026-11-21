/**
 * TopNav - the top menu of the computer (F88, the level «Transformar»): the home's bar continues
 * inside the app. The mark that leads to the home, the five stops over one row of bars (fire on the
 * current screen), the account and the connections in one panel, and under the bar a line for Albums
 * and for Playlists. On the phone it is hidden by the stylesheet (public/css/mobile.css) and the
 * phone's own shell takes its place (navigation/PhoneShell.js).
 */
import { userStore } from '../stores/UserStore.js'
import { AuthNav } from './navigation/AuthNav.js'
import { renderBarMenu, fitBars, wakeBars } from './navigation/barMenu.js'
import { renderSubRow } from './navigation/subRow.js'
import { MENU_TEXT } from './navigation/menuText.js'
import { WORDMARK_URL, WORDMARK_WIDTH, WORDMARK_HEIGHT } from './navigation/wordmark.js'

export class TopNav {
  /**
   * @param {Object} [deps]
   * @param {Function} [deps.clearCaches] - () => Promise: forgets what the browser keeps about albums (the panel asks before it)
   */
  constructor({ clearCaches } = {}) {
    this.userState = userStore.getState()
    this.authNav = new AuthNav(this.userState, { clearCaches })
    this.path = window.location.pathname
    this.onResize = () => fitBars(document.querySelector('#top-menu-bar nav.ms'), this.path)

    userStore.subscribe(this.handleAuthChange.bind(this))
  }

  handleAuthChange(state) {
    this.userState = state
    this.authNav.updateState(state)
    // Re-render only if mounted
    const container = document.getElementById('header-container')
    if (container) {
      container.innerHTML = this.render()
      this.attachListeners()
    }
  }

  /**
   * The screen changed: the current stop and the line under the bar follow it. Only those two parts
   * are drawn again; the panel keeps its state.
   * @param {string} path
   */
  followScreen(path) {
    this.path = path
    const bar = document.getElementById('top-menu-bar')
    const sub = document.getElementById('top-menu-sub')
    if (bar) bar.innerHTML = renderBarMenu(path)
    if (sub) sub.innerHTML = renderSubRow(path)
    this.fitAndWake()
  }

  fitAndWake() {
    fitBars(document.querySelector('#top-menu-bar nav.ms'), this.path)
    wakeBars(window)
  }

  render() {
    this.path = window.location.pathname
    return `
      <header class="top-menu">
        <div class="top-menu__row">
          <a class="top-menu__home" href="/home" data-full-page aria-label="${MENU_TEXT.entryPage}">
            <img class="top-menu__logo" src="${WORDMARK_URL}" alt="The Album Blender" width="${WORDMARK_WIDTH}" height="${WORDMARK_HEIGHT}">
          </a>
          <div class="top-menu__bar" id="top-menu-bar">${renderBarMenu(this.path)}</div>
          <div class="top-menu__acct">${this.authNav.renderDesktop()}</div>
        </div>
        <div class="top-menu__sub" id="top-menu-sub">${renderSubRow(this.path)}</div>
      </header>
    `
  }

  attachListeners() {
    this.authNav.attachListeners()
    this.fitAndWake()
    window.removeEventListener('resize', this.onResize)
    window.addEventListener('resize', this.onResize)
  }
}
