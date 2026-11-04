// cópia carimbada do MJRP Harness · versão 2026-11-03 · fonte 79ddf31a1 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
// The judge of the visual parity kit: reads the facts a capture wrote (both sides, every scenario and condition),
// runs the project's checks over each record, writes summary.md and diff.json next to the captures, draws the
// side-by-side pairs (prototype left, product right) for the eyes, and says 0 (parity) or 1 (a P0 or P1 diverges).
//
// Layout it reads and writes, under the evidence dir:
//   facts/<condition>/<scenario>.json         one record: { scenario, title, ui, proto, product, protoActions, ... }
//   <condition>/<scenario>.proto.png          the captures
//   <condition>/<scenario>.product.png
//   summary.md · diff.json · pairs/<condition>/<scenario>.pair.jpg
//
// No dependency of its own: the pairs need a Chromium, which the caller passes (it resolves Playwright from the
// project, where the dependency is pinned).
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The records this run is asked to judge: the expected (condition, scenario) pairs only — facts left on disk by a
 * scenario since removed from the config are not judged — and an expected pair with no facts becomes a P0 `capture`
 * record (it was not compared). Without `expect`, every record on disk.
 * Born from the architecture audit of ADR-0017 (2026-10-12, finding 4): an empty `facts/` judged as parity.
 */
export function expectedRecords(records, expect) {
  if (!expect) return records;
  const byKey = new Map(records.map((r) => [`${r.condition}\u0000${r.rec.scenario}`, r]));
  const out = [];
  for (const condition of expect.conditions) {
    for (const scenario of expect.scenarios) {
      const found = byKey.get(`${condition}\u0000${scenario}`);
      out.push(found ?? { condition, rec: { scenario, title: scenario, ui: [], proto: null, product: null, protoError: 'sem fatos desta execução', productError: 'sem fatos desta execução' } });
    }
  }
  return out;
}

/** Exit code of a judgement: 1 when a P0 or P1 line diverges, 0 on parity. */
export const exitCode = (total) => (total.P0 + total.P1 > 0 ? 1 : 0);

/** The records under `<dir>/facts/`, one per (condition, scenario); null when there are no facts. */
export function readRecords(dir) {
  const factsRoot = join(dir, 'facts');
  if (!existsSync(factsRoot)) return null;
  const out = [];
  for (const condition of readdirSync(factsRoot).sort()) {
    for (const file of readdirSync(join(factsRoot, condition)).filter((f) => f.endsWith('.json')).sort()) {
      out.push({ condition, rec: JSON.parse(readFileSync(join(factsRoot, condition, file), 'utf-8')) });
    }
  }
  return out;
}

/** One line per (scenario, check), with the conditions where it diverges, sorted by severity; and the totals. */
export function aggregate(records, checks) {
  const agg = new Map();
  for (const { condition, rec } of records) {
    for (const c of checks(rec)) {
      const key = `${rec.scenario}\u0000${c.id}`;
      if (!agg.has(key)) agg.set(key, { scenario: rec.scenario, title: rec.title, id: c.id, sev: c.sev, projects: [], proto: c.proto, product: c.product });
      agg.get(key).projects.push(condition);
    }
  }
  const lines = [...agg.values()].sort((a, b) => a.sev.localeCompare(b.sev) || a.id.localeCompare(b.id) || a.scenario.localeCompare(b.scenario));
  const total = { P0: 0, P1: 0, P2: 0 };
  for (const l of lines) total[l.sev] += 1;
  return { lines, total };
}

const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ').slice(0, 220);

/** The summary in Markdown: totals, one line per check across scenarios, one line per (scenario, check). */
export function summaryMarkdown({ lines, total }, { heading, generator, conditionsCount }) {
  const byCheck = new Map();
  for (const l of lines) {
    if (!byCheck.has(l.id)) byCheck.set(l.id, { id: l.id, sev: l.sev, scenarios: new Set(), conditions: new Set() });
    const b = byCheck.get(l.id);
    b.scenarios.add(l.scenario);
    l.projects.forEach((x) => b.conditions.add(x));
  }
  const checkLines = [...byCheck.values()].sort((a, b) => a.sev.localeCompare(b.sev) || b.scenarios.size - a.scenarios.size);
  const where = (l) => (conditionsCount && l.projects.length === conditionsCount ? `todas (${conditionsCount})` : l.projects.join(', '));
  return [
    `# ${heading}`,
    '',
    `Gerado por \`${generator}\`. Linhas: (cenário, checagem) que divergem; "projetos" são as condições (navegador-viewport-paleta) onde diverge. Dado diferente não conta.`,
    '',
    `**Totais (linhas):** P0 ${total.P0} · P1 ${total.P1} · P2 ${total.P2}`,
    '',
    '## Por checagem',
    '',
    '| Sev | Checagem | Cenários | Condições |',
    '|---|---|---|---|',
    ...checkLines.map((b) => `| ${b.sev} | ${esc(b.id)} | ${b.scenarios.size} | ${b.conditions.size} |`),
    '',
    '## Por cenário',
    '',
    '| Sev | Checagem | Cenário | Condições | Protótipo | Produto |',
    '|---|---|---|---|---|---|',
    ...lines.map((l) => `| ${l.sev} | ${esc(l.id)} | ${l.scenario} | ${where(l)} | ${esc(l.proto)} | ${esc(l.product)} |`),
    '',
  ].join('\n');
}

/** Draws prototype | product side by side, one JPEG per scenario, for each named condition that has captures. */
export async function drawPairs({ dir, chromium, conditions, labels = { proto: 'PROTÓTIPO', product: 'PRODUTO' } }) {
  const present = conditions.filter((c) => c && existsSync(join(dir, c)));
  if (!present.length || !chromium) return 0;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  let n = 0;
  for (const condition of present) {
    const shots = join(dir, condition);
    const outDir = join(dir, 'pairs', condition);
    mkdirSync(outDir, { recursive: true });
    for (const file of readdirSync(shots).filter((f) => f.endsWith('.proto.png'))) {
      const id = file.replace('.proto.png', '');
      const prodFile = join(shots, `${id}.product.png`);
      if (!existsSync(prodFile)) continue;
      const img = (f) => `data:image/png;base64,${readFileSync(f).toString('base64')}`;
      await page.setContent(`<html><body style="margin:0;background:#888;font:600 14px sans-serif">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px;align-items:start">
        <div><div style="color:#fff;padding:4px">${labels.proto} · ${id} · ${condition}</div><img style="width:100%;display:block" src="${img(join(shots, file))}"></div>
        <div><div style="color:#fff;padding:4px">${labels.product} · ${id} · ${condition}</div><img style="width:100%;display:block" src="${img(prodFile)}"></div>
        </div></body></html>`);
      await page.waitForTimeout(50);
      const height = await page.evaluate(() => Math.min(document.body.scrollHeight, 2600));
      await page.screenshot({ path: join(outDir, `${id}.pair.jpg`), type: 'jpeg', quality: 72, clip: { x: 0, y: 0, width: 1600, height } });
      n += 1;
    }
  }
  await browser.close();
  return n;
}

/**
 * The whole judgement over an evidence dir: aggregate, summary.md, diff.json, the pairs. Returns
 * { code, total, lines, summary, judged } — code 0 parity, 1 divergence, 2 not evaluable: no facts, or zero records
 * to judge (an empty run is never parity). `expect` = { scenarios: [ids], conditions: [names] } limits the judgement
 * to this run's records (expectedRecords).
 */
export async function judge({ dir, checks, date, heading = 'Paridade visual — protótipo × produto', generator = 'mjrp-scripts/visual_parity/judge.mjs',
  conditionsCount, pairs = [], chromium, pairLabels, expect } = {}) {
  const onDisk = readRecords(dir);
  if (!onDisk) return { code: 2, total: null, lines: [], summary: null, judged: 0 };
  const records = expectedRecords(onDisk, expect);
  if (records.length === 0) return { code: 2, total: null, lines: [], summary: null, judged: 0 };
  const result = aggregate(records, checks);
  const summary = join(dir, 'summary.md');
  writeFileSync(summary, summaryMarkdown(result, { heading: date ? `${heading} (${date})` : heading, generator, conditionsCount }));
  writeFileSync(join(dir, 'diff.json'), JSON.stringify({ date, total: result.total, lines: result.lines }, null, 2));
  if (pairs.length) await drawPairs({ dir, chromium, conditions: pairs, labels: pairLabels });
  return { code: exitCode(result.total), ...result, summary, judged: records.length };
}
