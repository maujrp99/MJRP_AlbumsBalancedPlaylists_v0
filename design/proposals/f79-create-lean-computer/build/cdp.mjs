// A small DevTools-protocol client for the checks of this proposal (headless Chrome on 9582).
export const PORT = 9582
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
export async function open() {
  const t = await (await fetch('http://127.0.0.1:9582/json/new?about:blank', { method: 'PUT' })).json()
  const ws = new WebSocket(t.webSocketDebuggerUrl)
  await new Promise((r) => ws.addEventListener('open', r, { once: true }))
  let seq = 0; const waiting = new Map(); const errors = []
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data)
    if (d.id && waiting.has(d.id)) { waiting.get(d.id)(d); waiting.delete(d.id); return }
    if (d.method === 'Runtime.exceptionThrown') errors.push((d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text).slice(0, 300))
  })
  const send = (method, params = {}) => new Promise((r) => { const i = ++seq; waiting.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })
  const run = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(expression.slice(0, 80) + ' ' + JSON.stringify(r.result.exceptionDetails).slice(0, 400)); return r.result?.result?.value }
  await send('Page.enable'); await send('Runtime.enable')
  const size = (width, height, mobile = true) => send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile })
  const shot = async (file) => { const r = await send('Page.captureScreenshot', { format: 'png' }); (await import('node:fs')).writeFileSync(file, Buffer.from(r.result.data, 'base64')) }
  const go = async (url, wait = 1500) => { await send('Page.navigate', { url }); await sleep(wait) }
  return { send, run, size, shot, go, errors, close: async () => { ws.close(); await fetch('http://127.0.0.1:9582/json/close/' + t.id).catch(() => {}) } }
}
