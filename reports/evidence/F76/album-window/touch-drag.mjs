#!/usr/bin/env node
/**
 * F76 TASK-03: does dragging by touch still work in «my ranking» on the phone? Headless Chrome at
 * 393x852 with touch, a finger put on the handle of the first track, moved down, lifted; then the
 * order the window holds. And a finger on the title (not the handle) must scroll, not drag.
 *   node reports/evidence/F76/album-window/touch-drag.mjs [port]
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../../../..')
const port = process.argv[2] || '5263'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const DEBUG_PORT = 9600 + Math.floor(Math.random() * 300)
const URL = `http://127.0.0.1:${port}/@fs${root}/reports/evidence/F76/harness/album-window.html?screen=rank`
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function connect(wsUrl) {
    const ws = new WebSocket(wsUrl)
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })
    let id = 0
    const waiting = new Map()
    ws.onmessage = (event) => {
        const message = JSON.parse(event.data)
        if (message.id && waiting.has(message.id)) { waiting.get(message.id)(message); waiting.delete(message.id) }
    }
    const send = (method, params = {}) => new Promise((resolve, reject) => {
        const mine = ++id
        waiting.set(mine, (message) => message.error ? reject(new Error(method + ': ' + message.error.message)) : resolve(message.result))
        ws.send(JSON.stringify({ id: mine, method, params }))
    })
    return { send, close: () => ws.close() }
}

const value = async (page, expression) => (await page.send('Runtime.evaluate', { expression, returnByValue: true })).result.value

async function swipe(page, from, to) {
    await page.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from.x, y: from.y }] })
    const steps = 16
    for (let i = 1; i <= steps; i++) {
        await sleep(30)
        await page.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: from.x + (to.x - from.x) * i / steps, y: from.y + (to.y - from.y) * i / steps }] })
    }
    await sleep(100)
    await page.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await sleep(400)
}

async function main() {
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'f76-drag-'))
    const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', `--user-data-dir=${profile}`, `--remote-debugging-port=${DEBUG_PORT}`, 'about:blank'], { stdio: 'ignore' })
    try {
        let target
        for (let i = 0; i < 40 && !target; i++) {
            await sleep(250)
            try { target = (await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`)).json()).find(t => t.type === 'page') } catch { /* not up yet */ }
        }
        const page = await connect(target.webSocketDebuggerUrl)
        await page.send('Page.enable')
        await page.send('Emulation.setDeviceMetricsOverride', { width: 393, height: 852, deviceScaleFactor: 2, mobile: true })
        await page.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
        await page.send('Page.navigate', { url: URL })
        await sleep(3000)
        const order = () => value(page, 'window.rankModal.rankedOrder.slice(0, 4).map(t => t.title).join(" | ")')
        const rect = (selector, index) => value(page, `(() => { const r = document.querySelectorAll('${selector}')[${index}].getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, h: r.height } })()`)
        const report = { before: await order() }

        const handle = await rect('.rank-row__handle', 0)
        await swipe(page, handle, { x: handle.x, y: handle.y + handle.h * 2.6 })
        report.afterDragByHandle = await order()
        report.numbersOnScreen = await value(page, '[...document.querySelectorAll("[data-role=rank-number]")].slice(0, 4).map(e => e.textContent).join(",")')

        const title = await rect('.rank-row__title', 1)
        const scrollBefore = await value(page, 'document.querySelector(".rank-phone__body").scrollTop')
        await swipe(page, title, { x: title.x, y: title.y - 250 })
        report.afterSwipeOnTitle = await order()
        report.scrolledBy = (await value(page, 'document.querySelector(".rank-phone__body").scrollTop')) - scrollBefore
        console.log(JSON.stringify(report, null, 1))
        fs.writeFileSync(path.join(here, 'after', 'touch-drag.json'), JSON.stringify(report, null, 1))
        page.close()
    } finally {
        chrome.kill()
    }
}

main().catch(error => { console.error(error); process.exit(1) })
