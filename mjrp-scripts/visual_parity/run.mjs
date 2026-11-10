#!/usr/bin/env node
// cópia carimbada do MJRP Harness · versão 2026-11-10 · fonte 77b3a80a7 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
// The visual parity sensor of a project: the approved prototype against the product, same screen, same state, same
// conditions — exit 0 parity, 1 a real P0/P1 divergence, 2 not evaluable (no config, no Playwright, no facts).
//
//   node mjrp-scripts/visual_parity/run.mjs <visual.config.mjs>              capture + judge
//   node mjrp-scripts/visual_parity/run.mjs <visual.config.mjs> --judge DIR  judge facts already captured
//   VISUAL_PAIRS=none …                                                       skip the side-by-side pairs
//
// The config is the project's (it declares it in the contract, `sensors.visual`): where the prototype and the
// product are served, the scenarios, the conditions, the selectors of its design system, and, optionally, its own
// checks. Playwright is the project's dependency, resolved from the config's folder (or `deps`), never from here.
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { capture, conditionsOf } from './capture.mjs';
import { collectRun } from './collect.mjs';
import { judge } from './judge.mjs';
import { baseChecks } from './rules.mjs';
import { startServers } from './servers.mjs';
import { configProblem, KIT_VERSION, PLAYWRIGHT_RANGE, playwrightCompatible } from './version.mjs';

const today = () => process.env.VISUAL_DATE ?? new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());

/** The project's Playwright, resolved from `from` (a folder): the kit pins nothing. */
export async function loadPlaywright(from) {
  const req = createRequire(join(resolve(from), 'noop.js'));
  const entry = req.resolve('@playwright/test');
  const mod = await import(pathToFileURL(entry).href);
  const pw = mod.chromium ? mod : mod.default;     // a CommonJS build arrives under default
  let version = null;
  for (let d = dirname(entry); d !== dirname(d); d = dirname(d)) {   // the package's own package.json, walking up
    const pj = join(d, 'package.json');
    if (!existsSync(pj)) continue;
    const meta = JSON.parse(readFileSync(pj, 'utf-8'));
    if (meta.name === '@playwright/test') {
      version = meta.version;
      break;
    }
  }
  return { ...pw, kitPlaywrightVersion: version };
}

/** The server spec of one side: a URL as given, or the command that serves it. */
function sideServer(name, side, configDir) {
  if (!side) throw new Error(`config sem \`${name}\``);
  if (side.kind === 'static') return null;      // exported images: nothing to serve
  if (side.server) return { name, ...side.server, cwd: resolve(configDir, side.server.cwd ?? '.') };
  return { name, url: side.url, env: side.env };
}

/** Runs the sensor; returns the exit code. */
export async function run(configPath, { judgeDir, log = console.log } = {}) {
  const configFile = resolve(configPath);
  const configDir = dirname(configFile);
  const config = (await import(pathToFileURL(configFile).href)).default;
  const bad = configProblem(config);
  if (bad) {
    log(`visual: ${bad} — não avaliável (kit ${KIT_VERSION})`);
    return 2;
  }
  const checks = config.checks ?? ((rec) => baseChecks(rec, config.rules ?? {}));
  const date = today();
  const dir = judgeDir ? resolve(judgeDir) : join(resolve(configDir, config.evidenceDir ?? 'reports/evidence/UAT-visual'), date);
  const pairsEnv = process.env.VISUAL_PAIRS;
  const pairs = pairsEnv === 'none' ? [] : pairsEnv ? pairsEnv.split(',') : config.pairs ?? conditionsOf(config.conditions).map((c) => c.name);

  let playwright = null;
  try {
    playwright = await loadPlaywright(resolve(configDir, config.deps ?? '.'));
  } catch (e) {
    if (!judgeDir) {
      log(`visual: Playwright não encontrado a partir de ${resolve(configDir, config.deps ?? '.')} — não avaliável (${String(e).slice(0, 120)})`);
      return 2;
    }
  }
  const pwVersion = playwright?.kitPlaywrightVersion;
  if (playwright && pwVersion && !playwrightCompatible(pwVersion)) {
    log(`visual: Playwright ${pwVersion} fora da faixa do kit (>= ${PLAYWRIGHT_RANGE.min}, < ${PLAYWRIGHT_RANGE.below}) — não avaliável`);
    return 2;
  }
  if (!judgeDir) {
    const { urls, stop } = await startServers([sideServer('prototype', config.prototype, configDir), sideServer('product', config.product, configDir)].filter(Boolean));
    try {
      await capture({ playwright, config, urls, outDir: dir, log, baseDir: configDir });
    } finally {
      await stop();
    }
  }
  const result = await judge({
    dir, checks, date, pairs: playwright ? pairs : [], chromium: playwright?.chromium,
    heading: `Paridade visual — ${config.name ?? 'protótipo'} × produto`, generator: 'mjrp-scripts/visual_parity/run.mjs',
    conditionsCount: conditionsOf(config.conditions).length,
    // only this run's records: facts of a scenario since removed from the config are not judged
    expect: { scenarios: (config.scenarios ?? []).map((sc) => sc.id), conditions: conditionsOf(config.conditions).map((c) => c.name) },
  });
  if (result.code === 2) {
    log(`visual: nada foi julgado (sem fatos em ${join(dir, 'facts')}, ou nenhum cenário no config) — não avaliável, nunca paridade`);
    return 2;
  }
  log(`visual: P0 ${result.total.P0} · P1 ${result.total.P1} · P2 ${result.total.P2} — ${result.summary}`);
  // F52 TASK-00: the harness collects what it creates. A run that captured (not a re-judge of a stored folder) keeps only
  // the verdict and the pairs promoted to evidence; VISUAL_KEEP_CAPTURES=1 keeps it all.
  if (!judgeDir) collectRun({ dir, lines: result.lines, conditions: conditionsOf(config.conditions).map((c) => c.name), log });
  return result.code;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const [configPath, flag, judgeDir] = process.argv.slice(2);
  if (!configPath) {
    console.error('uso: node mjrp-scripts/visual_parity/run.mjs <visual.config.mjs> [--judge <dir>]');
    process.exit(2);
  }
  run(configPath, { judgeDir: flag === '--judge' ? judgeDir : undefined })
    .then((code) => process.exit(code))
    .catch((e) => {
      console.error(`visual: ${e.stack ?? e}`);
      process.exit(2);
    });
}
