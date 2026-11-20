#!/usr/bin/env node
/**
 * F76 evidence: the menu, the Sheet and the windows that existed, opened on the phone (393x852)
 * and, for the comparison, the same windows on the computer (1280x800).
 *   node reports/evidence/F76/sheets.mjs <before|after> [port]
 * Nobody is signed in. The windows are opened by the app's own modules, loaded from the dev server.
 * Writes <label>/window-<name>-<size>.png and <label>/windows.json (the box of each window, whether
 * the page behind is held, the smallest target inside).
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const label = process.argv[2] || 'after'
const port = process.argv[3] || '5183'
const out = path.join(here, label)
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const DEBUG_PORT = 9334
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const ALBUM = `{ id: 'a1', title: 'Brothers In Arms (40th Anniversary Edition)', artist: 'Dire Straits', year: 1985, tracks: [
  'So Far Away', 'Money for Nothing', 'Walk of Life', 'Your Latest Trick', 'Why Worry', 'Ride Across the River', "The Man's Too Strong", 'One World', 'Brothers in Arms'
].map((title, i) => ({ title, position: i + 1, duration: 240 + i * 7, rank: i + 1 })) }`

/** name -> the script that opens the window; `phoneOnly` ones are the phone's own. */
const WINDOWS = [
    { name: 'menu', phoneOnly: true, open: `document.getElementById('phoneMenuBtn').click()` },
    { name: 'clear-cache', phoneOnly: true, open: `document.getElementById('phoneMenuBtn').click(); [...document.querySelectorAll('.phone-menu__row')].find(r => r.textContent.includes('Clear album cache')).click()` },
    { name: 'sheet-full', phoneOnly: true, open: `import('/js/components/ui/Sheet.js').then(m => { const b = document.createElement('button'); b.className = 'btn btn-primary'; b.textContent = 'Save'; const p = document.createElement('div'); p.innerHTML = '<p>' + 'A full sheet: the body scrolls, the footer stays. '.repeat(60) + '</p>'; m.openSheet({ title: 'A long title that wraps instead of being cut: Brothers In Arms (40th Anniversary Edition)', content: p, footer: b }) })` },
    { name: 'login', open: `import('/js/components/LoginModal.js').then(m => m.showLoginModal())` },
    { name: 'confirm', open: `import('/js/services/DialogService.js').then(m => { const s = m.dialogService || m.DialogService || m.default; s.confirm({ title: 'Delete this series?', message: 'The series and its playlists are removed. The albums stay in your inventory.', confirmText: 'Delete', variant: 'danger' }) })` },
    { name: 'edit', open: `import('/js/components/ui/BaseModal.js').then(({ BaseModal }) => { const body = document.createElement('div'); body.innerHTML = '<label class="block mb-2 text-sm">Notes</label><textarea class="form-control w-full" rows="4"></textarea><label class="block my-2 text-sm">Price</label><input class="form-control w-full" value="42.00">'; BaseModal.mount(BaseModal.render({ id: 'evidence-edit', title: 'Edit: Brothers In Arms (40th Anniversary Edition)', content: body, footer: BaseModal.createFooterButtons({ confirmText: 'Save' }) })) })` },
    { name: 'album', open: `import('/js/components/ViewAlbumModal.js').then(m => m.showViewAlbumModal(${ALBUM}))` },
    { name: 'ranking', open: `import('/js/components/ranking/UserRankModal.js').then(m => { const C = m.UserRankModal || m.default; const a = ${ALBUM}; new C({ album: a, onSave() {} }).show() })` }
]

const MEASURE = `(() => {
    const box = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] }
    const covers = (el) => { const r = el.getBoundingClientRect(); return getComputedStyle(el).position === 'fixed' && r.width >= innerWidth * 0.9 && r.height >= innerHeight * 0.9 }
    // The window is found by what it is (the last thing on the page that covers the screen), not by a class name: the same on main and on the branch
    const shell = [...document.body.children].reverse().find(el => el.id !== 'toast-container' && el.id !== 'globalProgress' && covers(el)) || null
    const panel = shell && (shell.querySelector('.sheet__panel') || shell.firstElementChild)
    const targets = shell ? [...shell.querySelectorAll('a[href], button, select, input, textarea')].filter(el => el.getBoundingClientRect().width > 0) : []
    const small = targets.map(el => { const r = el.getBoundingClientRect(); return [(el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 20), Math.round(r.width), Math.round(r.height)] }).filter(t => t[1] < 44 || t[2] < 44)
    const title = shell && shell.querySelector('h1, h2, h3')
    return { open: Boolean(shell), shell: shell ? shell.className.slice(0, 60) : null, panel: box(panel), title: title ? [title.textContent.trim().slice(0, 40), ...box(title)] : null,
        pageHeld: document.body.style.position === 'fixed', role: panel ? panel.getAttribute('role') : null, targets: targets.length, targetsBelow44: small,
        fieldsBelow16: targets.filter(el => /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && parseFloat(getComputedStyle(el).fontSize) < 16).length }
})()`

async function connect(wsUrl) {
    const ws = new WebSocket(wsUrl)
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })
    let id = 0
    const waiting = new Map()
    ws.onmessage = (event) => {
        const message = JSON.parse(event.data)
        if (message.id && waiting.has(message.id)) { waiting.get(message.id)(message); waiting.delete(message.id) }
    }
    return (method, params = {}) => new Promise((resolve, reject) => {
        const mine = ++id
        waiting.set(mine, (message) => message.error ? reject(new Error(method + ': ' + message.error.message)) : resolve(message.result))
        ws.send(JSON.stringify({ id: mine, method, params }))
    })
}

async function main() {
    fs.mkdirSync(out, { recursive: true })
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'f76-'))
    const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${profile}`, `--remote-debugging-port=${DEBUG_PORT}`, 'about:blank'], { stdio: 'ignore' })
    try {
        let target
        for (let i = 0; i < 40 && !target; i++) {
            await sleep(250)
            try { target = (await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`)).json()).find(t => t.type === 'page') } catch { /* not up yet */ }
        }
        const send = await connect(target.webSocketDebuggerUrl)
        await send('Page.enable')
        const results = {}
        for (const size of [{ name: '393x852', width: 393, height: 852, mobile: true }, { name: '1280x800', width: 1280, height: 800, mobile: false }]) {
            await send('Emulation.setDeviceMetricsOverride', { width: size.width, height: size.height, deviceScaleFactor: size.mobile ? 2 : 1, mobile: size.mobile })
            await send('Emulation.setTouchEmulationEnabled', { enabled: size.mobile })
            for (const win of WINDOWS) {
                if (win.phoneOnly && !size.mobile) continue
                await send('Page.navigate', { url: `http://127.0.0.1:${port}/albums` })
                await sleep(3000)
                await send('Runtime.evaluate', { expression: `window.scrollTo(0, 300); document.querySelectorAll('.last-update').forEach(el => { el.textContent = 'Last updated: (frozen for the comparison)' }); document.head.insertAdjacentHTML('beforeend', '<style>*, *::before, *::after { animation-play-state: paused !important; animation-delay: 0s !important; animation-duration: 0s !important; caret-color: transparent !important }</style>')` })
                const opened = await send('Runtime.evaluate', { expression: win.open, awaitPromise: true })
                if (opened.exceptionDetails) results[`${win.name}-${size.name}-error`] = opened.exceptionDetails.exception?.description?.slice(0, 200)
                await sleep(1200)
                results[`${win.name}-${size.name}`] = (await send('Runtime.evaluate', { expression: MEASURE, returnByValue: true })).result.value
                const shot = await send('Page.captureScreenshot', { format: 'png' })
                fs.writeFileSync(path.join(out, `window-${win.name}-${size.name}.png`), Buffer.from(shot.data, 'base64'))
            }
        }
        fs.writeFileSync(path.join(out, 'windows.json'), JSON.stringify(results, null, 1))
        for (const [key, value] of Object.entries(results)) console.log(key, JSON.stringify(value))
    } finally {
        chrome.kill()
    }
}

main().catch(error => { console.error(error); process.exit(1) })
