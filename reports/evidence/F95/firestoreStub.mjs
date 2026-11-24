// A stand-in for firestore.googleapis.com, at the network layer of a Playwright context: the Listen and Write streams (WebChannel,
// answered whole, never streamed), batchGet and commit. Documents live in memory, as plain objects.
// The F82 proof's stand-in (reports/evidence/F82/texts-panel/firestoreStub.mjs) plus ONE thing for F95: `refuseWrites(test)`, which makes
// the stand-in answer a write as the database's RULES do when they refuse it (PERMISSION_DENIED), writing nothing. It is how the proof
// shows the Painel under the rules as they are published today, which do not list `published/crate`.
const enc = (value) => {
  if (value === null || value === undefined) return { nullValue: null }
  if (typeof value === 'string') return { stringValue: value }
  if (typeof value === 'boolean') return { booleanValue: value }
  if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(enc) } }
  return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([k, v]) => [k, enc(v)])) } }
}
const dec = (value) => {
  if ('stringValue' in value) return value.stringValue
  if ('integerValue' in value) return Number(value.integerValue)
  if ('doubleValue' in value) return value.doubleValue
  if ('booleanValue' in value) return value.booleanValue
  if ('arrayValue' in value) return (value.arrayValue.values ?? []).map(dec)
  if ('mapValue' in value) return Object.fromEntries(Object.entries(value.mapValue.fields ?? {}).map(([k, v]) => [k, dec(v)]))
  if ('timestampValue' in value) return value.timestampValue
  return null
}
const ascii = (json) => json.replace(/[\u007f-￿]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'))
const frame = (payload) => { const text = ascii(JSON.stringify(payload)); return `${text.length}\n${text}` }
const stamp = () => new Date().toISOString().replace(/\.(\d{3})Z$/, '.$1000Z')

export function firestoreStub(initial = {}) {
  /** short path («published/texts_en») -> { data, updateTime } */
  const docs = new Map(Object.entries(initial).map(([path, data]) => [path, { data, updateTime: stamp() }]))
  const sessions = new Map()
  const log = []
  const reads = []
  let sid = 0
  let beforeBatchGet = null
  let beforeRead = null
  let refused = () => false
  const DENIED = { code: 403, message: 'Missing or insufficient permissions.', status: 'PERMISSION_DENIED' }
  const pathOfWrite = (write) => short(write.update?.name ?? write.delete ?? '')
  const refusesAny = (writes) => (writes ?? []).some((write) => refused(pathOfWrite(write)))
  const short = (name) => name.split('/documents/')[1]
  const wire = (name) => { const doc = docs.get(short(name)); return doc && { name, fields: enc(doc.data).mapValue.fields, createTime: doc.updateTime, updateTime: doc.updateTime } }

  function push(session, payload) { session.queue.push([++session.aid, [payload]]); flush(session) }
  function flush(session) {
    if (!session.waiting || !session.queue.length) return
    const body = frame(session.queue.splice(0))
    const done = session.waiting
    session.waiting = null
    done(body)
  }
  function applyWrite(write) {
    const now = stamp()
    if (write.update) {
      const data = dec({ mapValue: { fields: write.update.fields ?? {} } })
      for (const transform of write.updateTransforms ?? []) data[transform.fieldPath] = now
      docs.set(short(write.update.name), { data, updateTime: now })
      log.push({ write: short(write.update.name), data })
    } else if (write.delete) docs.delete(short(write.delete))
    const transforms = write.updateTransforms ?? []
    return transforms.length ? { updateTime: now, transformResults: transforms.map(() => ({ timestampValue: now })) } : { updateTime: now }
  }
  function onListen(session, request) {
    const add = request.addTarget
    if (!add) return
    const targetId = add.targetId
    push(session, { targetChange: { targetChangeType: 'ADD', targetIds: [targetId] } })
    for (const name of add.documents?.documents ?? []) {
      if (beforeRead && short(name) === beforeRead.path) { const once = beforeRead.run; beforeRead = null; once(api) }
      reads.push(short(name))
      const document = wire(name)
      if (document) push(session, { documentChange: { document, targetIds: [targetId] } })
    }
    const readTime = stamp()
    push(session, { targetChange: { targetChangeType: 'CURRENT', targetIds: [targetId], resumeToken: 'AA==', readTime } })
    push(session, { targetChange: { targetChangeType: 'NO_CHANGE', targetIds: [], resumeToken: 'AA==', readTime } })
  }
  function onWrite(session, request) {
    if (!request.writes) return push(session, { streamToken: 'AA==' })
    if (refusesAny(request.writes)) { log.push({ refused: request.writes.map(pathOfWrite) }); return push(session, { error: DENIED }) }
    const writeResults = request.writes.map(applyWrite)
    push(session, { streamToken: 'AA==', writeResults, commitTime: stamp() })
  }
  const cors = (route) => ({ 'access-control-allow-origin': route.request().headers().origin ?? '*', 'access-control-allow-credentials': 'true', 'access-control-expose-headers': 'X-HTTP-Session-Id', vary: 'Origin' })
  const text = (route, body, status = 200) => route.fulfill({ status, contentType: 'text/plain', body, headers: cors(route) })
  const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body), headers: cors(route) })

  async function channel(route, url, kind) {
    const request = route.request()
    const params = url.searchParams
    if (request.method() === 'GET') {
      const session = sessions.get(params.get('SID'))
      if (!session) return text(route, '', 400)
      const body = await new Promise((resolve) => {
        session.waiting?.(frame([[++session.aid, ['noop']]]))
        session.waiting = resolve
        flush(session)
        setTimeout(() => { if (session.waiting === resolve) { session.waiting = null; resolve(frame([[++session.aid, ['noop']]])) } }, 20000)
      })
      return text(route, body).catch(() => {})
    }
    const form = new URLSearchParams(request.postData() ?? '')
    let session = sessions.get(params.get('SID'))
    const fresh = !session
    if (!session) { session = { id: `s${++sid}`, aid: 0, queue: [], waiting: null, kind }; sessions.set(session.id, session) }
    const count = Number(form.get('count') ?? 0)
    for (let i = 0; i < count; i++) {
      const raw = form.get(`req${i}___data__`)
      if (!raw) continue
      const message = JSON.parse(raw)
      if (kind === 'Listen') onListen(session, message)
      else onWrite(session, message)
    }
    if (fresh) return text(route, frame([[0, ['c', session.id, '', 8, 12, 30000]]]))
    return text(route, frame([1, session.aid, 7]))
  }

  async function handle(route) {
    const request = route.request()
    const url = new URL(request.url())
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { ...cors(route), 'access-control-allow-headers': request.headers()['access-control-request-headers'] ?? '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' } })
    const stream = /Firestore\/(Listen|Write)\/channel/.exec(url.pathname)
    if (stream) return channel(route, url, stream[1])
    if (url.pathname.endsWith(':batchGet')) {
      const body = JSON.parse(request.postData() ?? '{}')
      if (beforeBatchGet) { const once = beforeBatchGet; beforeBatchGet = null; once(api) }
      const readTime = stamp()
      return json(route, body.documents.map((name) => { const found = wire(name); return found ? { found, readTime } : { missing: name, readTime } }))
    }
    if (url.pathname.endsWith(':commit')) {
      const body = JSON.parse(request.postData() ?? '{}')
      if (refusesAny(body.writes)) { log.push({ refused: body.writes.map(pathOfWrite) }); return json(route, { error: DENIED }, 403) }
      return json(route, { writeResults: (body.writes ?? []).map(applyWrite), commitTime: stamp() })
    }
    log.push({ unhandled: url.pathname })
    return json(route, { error: { code: 404, message: 'fixture', status: 'NOT_FOUND' } }, 404)
  }

  const api = {
    handle, log, reads,
    /** Runs once, right before the next read of that document: another device saving in between. */
    beforeNextRead: (path, run) => { beforeRead = { path, run } },
    get: (path) => docs.get(path)?.data,
    set: (path, data) => docs.set(path, { data, updateTime: stamp() }),
    /** From now on a write of a document whose short path passes `test` is refused as the rules refuse it, and nothing is written. */
    refuseWrites: (test) => { refused = test ?? (() => false) },
    /** Runs once, right before the next transaction reads: another device saving in between. */
    beforeNextTransaction: (fn) => { beforeBatchGet = fn },
  }
  return api
}
