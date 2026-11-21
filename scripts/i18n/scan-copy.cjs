#!/usr/bin/env node
/**
 * F81 — scan every user-visible text candidate in the Album Blender source.
 *
 *   NODE_PATH=<a node_modules with acorn> node scripts/i18n/scan-copy.cjs [--out file.json] [--summary]
 *
 * Reads public/**\/*.js (not vendor), public/*.html, public/splash/*, server/**\/*.js.
 * Output: one record per candidate {file,line,tier,ctx,text,kind}. Deterministic (sorted).
 * Tiers: "sure" = the syntax says the text reaches a person (DOM text call, textContent,
 * aria-label/title/placeholder/alt, toast/alert/confirm/prompt, HTML text node/attribute,
 * `error`/`message` field of a server response); "maybe" = a string that reads as a sentence
 * or label but whose use the scanner cannot prove (needs a human look).
 * What it cannot see: see reports/audits/2026-11-21-f81-copy-survey.md § "O que a busca não vê".
 */
const fs = require('fs'), path = require('path')
const acorn = require('acorn')
const ROOT = path.resolve(__dirname, '..', '..')
const args = process.argv.slice(2)
const outIdx = args.indexOf('--out')
const OUT = outIdx >= 0 ? args[outIdx + 1] : null

const walkDir = (d, acc = []) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) { if (!['node_modules', 'vendor', 'assets'].includes(e.name)) walkDir(p, acc) }
    else acc.push(p)
  }
  return acc
}
const files = [
  ...walkDir(path.join(ROOT, 'public')).filter(f => /\.(js|html)$/.test(f)),
  ...walkDir(path.join(ROOT, 'server')).filter(f => /\.js$/.test(f) && !/\.test\./.test(f))
].sort()

const TEXT_KEYS = new Set(['title', 'placeholder', 'aria-label', 'ariaLabel', 'alt', 'label', 'text', 'textContent', 'innerText', 'message', 'error', 'description', 'heading', 'subtitle', 'hint', 'empty', 'caption', 'tooltip', 'summary', 'name', 'detail', 'reason', 'note', 'confirmText', 'cancelText', 'body'])
const ATTR_NAMES = new Set(['title', 'placeholder', 'aria-label', 'alt', 'aria-description', 'aria-valuetext'])
const ICON_NAMES = new Set([...fs.readFileSync(path.join(ROOT, 'public/js/components/Icons.js'), 'utf8').matchAll(/^\s{2}([A-Za-z0-9]+): `/gm)].map(m => m[1]).concat(['Mic2', 'Mic', 'Tag', 'List', 'Sliders', 'Edit', 'Award', 'Layers', 'ArrowUp', 'ArrowDown', 'ChevronUp', 'ChevronDown']))
const FIXTURE_FILES = new Set(['public/splash/covers.js']) // fictional demo covers of the entry page: data, not interface copy
const TEXT_CALLS = /^(showToast|toast|alert|confirm|prompt|notify|announce|setStatus|showError|showMessage)$/
const DOM_CALLS = new Set(['button', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'li', 'a', 'label', 'strong', 'em', 'small', 'td', 'th', 'legend', 'option', 'text', 'text_', 'summary'])
const NOISE_CALLS = /^(querySelector(All)?|getElementById|addEventListener|removeEventListener|classList|add|remove|toggle|contains|closest|matches|createElement|getItem|setItem|removeItem|require|import|fetch|log|warn|error|info|debug|on|off|emit|has|get|set|delete|includes|startsWith|endsWith|indexOf|split|join|replace|replaceAll|test|match|push|resolve|dispatchEvent|CustomEvent|Event|setProperty|getPropertyValue|dataset|key|from|mark|measure)$/

const isHumanText = (s) => {
  const t = s.trim()
  if (ICON_NAMES.has(t) || /^[A-Z][A-Za-z]*(Error|Exception)$/.test(t) || /^[A-Z][a-z]+([A-Z][a-z0-9]+)+$/.test(t)) return false
  if (t.length < 2) return false
  if (!/[A-Za-zÀ-ú]{2,}/.test(t)) return false
  if (/^(https?:|\/|\.|#|data:|mailto:)/.test(t)) return false
  if (/^[a-z0-9_.:\-\/\[\]="'#> *,~+()%]+$/.test(t) && !/\s{1}[A-Z]/.test(t)) return false // selector / class list / id / key
  if (/^[a-z]+([A-Z][a-z0-9]+)+$/.test(t)) return false // camelCase identifier
  if (/^[A-Z0-9_]+$/.test(t)) return false // CONSTANT
  if (/^[a-z]+(-[a-z0-9]+)+$/.test(t)) return false // kebab id
  if (/^[a-z]+(_[a-z0-9]+)+$/.test(t)) return false // snake id
  if (/(\bfunction\b|=>|\bconst\b|\breturn\b)/.test(t)) return false
  if (/^(\d|[a-z]+\/[a-z]+)/.test(t) && !/\s/.test(t)) return false
  return /\s/.test(t) ? true : /^[A-ZÀ-Ú][a-zà-ú]{2,}/.test(t) || /…|!|\?|:$/.test(t)
}

const records = []
const push = (file, line, tier, ctx, text, kind) => {
  const t = text.replace(/\s+/g, ' ').trim()
  if (!t) return
  records.push({ file: path.relative(ROOT, file), line, tier, ctx, kind, text: t })
}

// ---- HTML text nodes / attributes (no script: what a reader sees before any JS) ----
function scanHtml(file, src) {
  const noScript = src.replace(/<script[\s\S]*?<\/script>/gi, m => m.replace(/[^\n]/g, ' ')).replace(/<style[\s\S]*?<\/style>/gi, m => m.replace(/[^\n]/g, ' ')).replace(/<!--[\s\S]*?-->/g, m => m.replace(/[^\n]/g, ' '))
  const lineAt = (i) => noScript.slice(0, i).split('\n').length
  let m
  const tagRe = /<([a-zA-Z][\w-]*)([^>]*)>/g
  while ((m = tagRe.exec(noScript))) {
    const attrRe = /\s(title|placeholder|aria-label|alt|content|value)\s*=\s*"([^"]*)"/g
    let a
    while ((a = attrRe.exec(m[2]))) {
      if (a[1] === 'content' && !/(name|property)="(description|og:[a-z:]+|twitter:[a-z:]+)"/.test(m[2])) continue
      if (a[1] === 'value' && !/type="(submit|button)"/.test(m[2])) continue
      if (isHumanText(a[2])) push(file, lineAt(m.index), 'sure', `${m[1]}[${a[1]}]`, a[2], 'html-attr')
    }
  }
  const textRe = />([^<>]+)</g
  while ((m = textRe.exec(noScript))) {
    const t = m[1].replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&middot;/g, '·').trim()
    if (/[A-Za-zÀ-ú]{2,}/.test(t) && !/^\{\{/.test(t)) push(file, lineAt(m.index + 1), 'sure', 'html-text', t, 'html-text')
  }
  const tt = /<title>([^<]*)<\/title>/.exec(noScript)
  if (tt) push(file, lineAt(tt.index), 'sure', 'title', tt[1], 'html-title')
  // scripts embedded in html
  const sre = /<script(?![^>]*(?:\bsrc=|type="(?!module)))[^>]*>([\s\S]*?)<\/script>/gi
  while ((m = sre.exec(src))) {
    const base = src.slice(0, m.index + m[0].indexOf('>') + 1).split('\n').length - 1
    scanJs(file, m[1], base)
  }
}

// text out of an HTML string built inside JS (innerHTML / template literals)
function htmlStringTexts(file, line, s, ctx) {
  const stripped = s.replace(/\$\{[^}]*\}/g, '{}')
  const attrRe = /\s(title|placeholder|aria-label|alt)\s*=\s*"([^"]*)"/g
  let a
  while ((a = attrRe.exec(stripped))) if (isHumanText(a[2].replace(/\{\}/g, 'x'))) push(file, line, 'sure', `${ctx} html[${a[1]}]`, a[2], 'html-in-js')
  const textRe = />([^<>]+)</g
  let m
  while ((m = textRe.exec(stripped))) {
    const t = m[1].trim()
    if (/[A-Za-zÀ-ú]{2,}/.test(t.replace(/\{\}/g, ''))) push(file, line, 'sure', `${ctx} html-text`, t, 'html-in-js')
  }
}

function scanJs(file, src, lineBase = 0) {
  let ast
  try { ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'module', locations: true, allowHashBang: true }) }
  catch (e) {
    try { ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script', locations: true, allowHashBang: true }) }
    catch (e2) { console.error('PARSE FAIL', file, e2.message); records.push({ file: path.relative(ROOT, file), line: 0, tier: 'unparsed', ctx: 'parse', kind: 'parse-fail', text: e2.message }); return }
  }
  const isServer = file.includes(path.sep + 'server' + path.sep)
  const seen = new Set()
  const text = (n) => {
    if (n.type === 'Literal' && typeof n.value === 'string') return n.value
    if (n.type === 'TemplateLiteral') return n.quasis.map((q, i) => q.value.cooked + (i < n.expressions.length ? '{}' : '')).join('')
    if (n.type === 'BinaryExpression' && n.operator === '+') { const l = text(n.left), r = text(n.right); if (l != null || r != null) return (l ?? '{}') + (r ?? '{}') }
    return null
  }
  const calleeName = (c) => c.type === 'Identifier' ? c.name : c.type === 'MemberExpression' ? (c.property.name || c.property.value) : ''
  const calleeFull = (c) => c.type === 'MemberExpression' ? (c.object.type === 'Identifier' ? c.object.name : c.object.type === 'ThisExpression' ? 'this' : '') + '.' + (c.property.name || c.property.value) : c.name || ''
  const emit = (node, tier, ctx, kind, forced) => {
    const t = text(node); if (t == null) return
    if (/^(\{(className|Content-Type|Authorization|User-Agent|Accept|action|rest|undefined|type|id|key|role|method|mode|cache|credentials|href|src|class):\}|arg of \.(includes|get|has|startsWith|test)\(\))$/.test(ctx) && !/\s/.test(t.trim()) ) return
    if (/^\{(className|Content-Type|Authorization|User-Agent|Accept|Cache-Control|Accept-Language):\}$/.test(ctx)) return
    if (/getIcon\(\)|icon\(\)|\{icon:\}|Icon\(\)/.test(ctx) || (ICON_NAMES.has(t) && /icon|Icon/i.test(ctx))) return
    const key = node.start
    if (seen.has(key)) return
    const has = t.includes('<') && /<\/?[a-z]/i.test(t)
    if (has) { seen.add(key); htmlStringTexts(file, node.loc.start.line + lineBase, t, ctx); return }
    if (tier === 'sure' && !forced && !/[A-Za-zÀ-ú]{2,}/.test(t.replace(/\{\}/g, ''))) return
    if (tier === 'sure' && !forced && !isHumanText(t.replace(/\{\}/g, 'x')) && !/\s/.test(t) ) { /* single token: keep only if capitalised */ if (!/^[A-ZÀ-Ú]/.test(t)) return }
    seen.add(key)
    push(file, node.loc.start.line + lineBase, tier, ctx, t, kind)
  }
  const visit = (n, parent, ancestors) => {
    if (!n || typeof n.type !== 'string') return
    switch (n.type) {
      case 'CallExpression': {
        const name = calleeName(n.callee), full = calleeFull(n.callee)
        if (/^(console|logger|log)\./.test(full) || /^(console)$/.test(full.split('.')[0])) { markSkip(n); break }
        if (TEXT_CALLS.test(name) || /^toast\./.test(full) || /^(this\.)?(toast|notify)\.(success|error|warning|info|show)$/.test(full) || /^this\.(showToast|_toast|toast)$/.test(full)) n.arguments.forEach(a => emit(a, 'sure', `${full}()`, 'call-text', false))
        else if (full.startsWith('SafeDOM.') && DOM_CALLS.has(name)) n.arguments.slice(1).forEach(a => collectText(a, `${full}()`))
        else if (name === 'setAttribute' && n.arguments.length === 2) { const k = text(n.arguments[0]); if (k && ATTR_NAMES.has(k)) emit(n.arguments[1], 'sure', `setAttribute(${k})`, 'attr', false) }
        else if (name === 'Error' || (n.callee.type === 'Identifier' && /Error$/.test(n.callee.name))) n.arguments.slice(0, 1).forEach(a => emit(a, 'sure', `${full}()`, 'error-text', false))
        else if ((isServer && /^(json|send|status|end)$/.test(name))) n.arguments.forEach(a => scanResponse(a))
        break
      }
      case 'NewExpression': {
        const nm = n.callee.name || ''
        if (/Error$/.test(nm)) n.arguments.slice(0, 1).forEach(a => emit(a, 'sure', `new ${nm}()`, 'error-text', false))
        break
      }
      case 'AssignmentExpression': {
        const l = n.left
        if (l.type === 'MemberExpression') {
          const p = l.property.name || l.property.value
          if (['textContent', 'innerText', 'title', 'placeholder', 'ariaLabel', 'alt', 'label', 'value'].includes(p) && p !== 'value') emit(n.right, 'sure', `.${p} =`, 'assign', false)
          if (['innerHTML', 'outerHTML', 'insertAdjacentHTML'].includes(p)) emit(n.right, 'sure', `.${p} =`, 'html-in-js', false)
          if (p === 'message' || p === 'error') emit(n.right, 'sure', `.${p} =`, 'message', false)
        }
        break
      }
      case 'Property': {
        const k = n.key.name || n.key.value
        if (k && TEXT_KEYS.has(k) && !n.computed) {
          if (['name', 'summary', 'detail', 'reason', 'note', 'body', 'text', 'label', 'description'].includes(k)) { const t = text(n.value); if (t != null && isHumanText(t.replace(/\{\}/g, 'x'))) emit(n.value, 'sure', `{${k}:}`, 'prop', true) }
          else emit(n.value, 'sure', `{${k}:}`, 'prop', false)
        }
        if (['innerHTML'].includes(k)) emit(n.value, 'sure', `{${k}:}`, 'html-in-js', false)
        break
      }
      case 'ReturnStatement': break
      case 'TemplateLiteral': case 'Literal': {
        if (typeof n.value === 'string' || n.type === 'TemplateLiteral') {
          const t = text(n)
          if (t != null && !seen.has(n.start) && !skipSet.has(n.start)) {
            const raw = t.replace(/\{\}/g, 'x')
            if (/<\/?[a-z][^>]*>/i.test(t)) emit(n, 'maybe', 'html string', 'html-in-js', false)
            else if (isHumanText(raw) && parent && !/^(ImportDeclaration|ExportAllDeclaration|ExportNamedDeclaration)$/.test(parent.type)) {
              const tagged = parent.type === 'TaggedTemplateExpression'
              if (!tagged) emit(n, 'maybe', ctxOf(parent), 'string', false)
            }
          }
        }
        break
      }
    }
    for (const k of Object.keys(n)) {
      if (k === 'loc') continue
      const v = n[k]
      if (Array.isArray(v)) v.forEach(c => visit(c, n)); else if (v && typeof v.type === 'string') visit(v, n)
    }
  }
  const skipSet = new Set()
  const markSkip = (call) => call.arguments.forEach(function m(a) { skipSet.add(a.start); for (const k of Object.keys(a)) { const v = a[k]; if (k !== 'loc' && v && typeof v === 'object') { if (Array.isArray(v)) v.forEach(x => x && x.type && (skipSet.add(x.start), m(x))); else if (v.type) (skipSet.add(v.start), m(v)) } } })
  const ctxOf = (p) => p.type === 'CallExpression' ? `arg of ${calleeFull(p.callee)}()` : p.type === 'Property' ? `{${p.key.name || p.key.value}:}` : p.type === 'ReturnStatement' ? 'return' : p.type === 'VariableDeclarator' ? `const ${p.id.name || ''}` : p.type === 'ArrayExpression' ? 'array item' : p.type
  function collectText(a, ctx) {
    if (a.type === 'ArrayExpression') a.elements.forEach(e => e && collectText(e, ctx))
    else if (a.type === 'ConditionalExpression') { collectText(a.consequent, ctx); collectText(a.alternate, ctx) }
    else if (a.type === 'LogicalExpression') { collectText(a.left, ctx); collectText(a.right, ctx) }
    else if (a.type === 'Literal' || a.type === 'TemplateLiteral' || a.type === 'BinaryExpression') emit(a, 'sure', ctx, 'dom-text', true)
  }
  function scanResponse(a) {
    if (a.type === 'ObjectExpression') a.properties.forEach(p => { const k = p.key && (p.key.name || p.key.value); if (['error', 'message', 'detail', 'reason', 'warning', 'hint'].includes(k)) emit(p.value, 'sure', `response.${k}`, 'server-message', true) })
    else emit(a, 'sure', 'response body', 'server-message', false)
  }
  visit(ast, null)
}

for (const f of files) {
  if (FIXTURE_FILES.has(path.relative(ROOT, f))) { records.push({ file: path.relative(ROOT, f), line: 0, tier: 'fixture', ctx: 'file', kind: 'fixture', text: '(demo data: fictional covers of the entry page — not interface copy)' }); continue }
  const src = fs.readFileSync(f, 'utf8')
  if (f.endsWith('.html')) scanHtml(f, src); else scanJs(f, src)
}
records.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.text.localeCompare(b.text))
const uniq = []
const seenK = new Set()
for (const r of records) { const k = `${r.file}:${r.line}:${r.text}`; if (!seenK.has(k)) { seenK.add(k); uniq.push(r) } }
if (OUT) fs.writeFileSync(OUT, JSON.stringify(uniq, null, 1))
const by = (f) => uniq.reduce((m, r) => (m[f(r)] = (m[f(r)] || 0) + 1, m), {})
console.log(JSON.stringify({ files: files.length, total: uniq.length, byTier: by(r => r.tier), byKind: by(r => r.kind), unparsed: uniq.filter(r => r.tier === 'unparsed').length }, null, 1))
