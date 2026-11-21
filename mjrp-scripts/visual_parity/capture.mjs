// cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
// Captures every scenario on both sides — the approved prototype and the product — under every condition of the
// project (browser × viewport × palette), and writes the pair of screenshots and the facts of both sides in the
// layout judge.mjs reads. It only captures; the judge compares.
//
// A scenario: { id, title, ui: [inventory ids], proto: { path, eval, actions }, product: { path, eval, actions },
//               actions: [applied on both sides, after each side's own] }
// `path` is resolved against the side's base URL (a hash, a query, a route). An action is one user gesture:
//   { click: selector } · { clickText: 'regex source', scope: selector } · { select: selector, label }
//   { press: key } · { eval: code } · { wait: ms }
// Each action is recorded as { action, available }: a gesture the prototype accepts and the product refuses is a P0.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { collectFacts } from './facts.mjs';
import { TEXT_HEALTH_OPTIONS } from './rules.mjs';

/** The conditions of the project as named records: `${browser}-${viewport}-${palette}`. */
export function conditionsOf(c = {}) {
  const browsers = c.browsers ?? ['chromium'];
  const viewports = c.viewports ?? [{ id: 'desktop', width: 1440, height: 900 }];
  const palettes = c.palettes ?? [{ id: 'light', colorScheme: 'light' }];
  return browsers.flatMap((browser) => viewports.flatMap((vp) => palettes.map((pal) => ({
    name: `${browser}-${vp.id}-${pal.id}`, browser, viewport: vp, palette: pal,
    context: {
      viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1,
      isMobile: browser === 'chromium' ? !!vp.isMobile : false, hasTouch: !!vp.isMobile,
      colorScheme: pal.colorScheme ?? 'light', locale: c.locale ?? 'pt-BR', timezoneId: c.timezoneId ?? 'America/Sao_Paulo',
    },
  }))));
}

async function settle(page, ms) {
  await page.evaluate(() => document.fonts.ready.then(() => true)).catch(() => true);
  await page.waitForTimeout(ms);
}

async function act(page, a) {
  const describe = (k) => `${k}:${a[k]}`;
  try {
    if (a.wait !== undefined) {
      await page.waitForTimeout(a.wait);
      return { action: describe('wait'), available: true };
    }
    if (a.eval !== undefined) {
      await page.evaluate((code) => (0, eval)(code), a.eval);
      return { action: 'eval', available: true };
    }
    if (a.press !== undefined) {
      await page.keyboard.press(a.press);
      return { action: describe('press'), available: true };
    }
    if (a.select !== undefined) {
      const select = page.locator(a.select).filter({ visible: true }).first();
      if ((await select.count()) === 0) return { action: `select:${a.label}`, available: false };
      await select.selectOption({ label: a.label }).catch(() => undefined);
      const now = await select.evaluate((el) => el.selectedOptions[0]?.textContent?.trim() ?? '');
      return { action: `select:${a.label}`, available: now === a.label };
    }
    const target = a.click !== undefined
      ? page.locator(a.click).filter({ visible: true }).first()
      : page.locator(a.scope ?? 'button, a, [role="button"]').filter({ hasText: new RegExp(a.clickText, 'i') }).filter({ visible: true }).first();
    const name = a.click !== undefined ? describe('click') : describe('clickText');
    if ((await target.count()) === 0) return { action: name, available: false };
    await target.click();
    return { action: name, available: true };
  } finally {
    await page.waitForTimeout(a.settleMs ?? 300);
  }
}

async function openSide(page, side, sc, cfg, base) {
  const s = sc[side] ?? {};
  await page.goto(new URL(s.path ?? '', base).href, { waitUntil: 'load' });
  if (cfg.ready) await page.waitForSelector(cfg.ready, { timeout: cfg.readyTimeoutMs ?? 30_000 });
  if (s.eval) await page.evaluate((code) => (0, eval)(code), s.eval);
  if (cfg.hideCss) await page.addStyleTag({ content: cfg.hideCss });
  await settle(page, cfg.settleMs ?? 600);
}

/**
 * The approved reference of a scenario when it is STATIC (exports of a design tool, e.g. Figma — MJRP 2026-10-12):
 * the first image found for (scenario, condition), most specific first — `<id>.<condition>.png`, `<id>.<viewport>.png`,
 * `<id>.png` — in the config's `prototype.images` folder, or the scenario's own `proto.image`. Null when none exists.
 */
export function staticReference(config, sc, cond, baseDir = '.') {
  const ref = config.prototype ?? {};
  if (sc.proto?.image) {
    const own = resolve(baseDir, sc.proto.image);
    return existsSync(own) ? own : null;
  }
  const dir = resolve(baseDir, ref.images ?? '.');
  for (const name of [`${sc.id}.${cond.name}.png`, `${sc.id}.${cond.viewport.id}.png`, `${sc.id}.png`]) {
    if (existsSync(join(dir, name))) return join(dir, name);
  }
  return null;
}

/**
 * The visual difference of two PNGs, measured in the browser (no image library in the kit): both drawn at the
 * reference's width, compared pixel by pixel over the height they share; a pixel differs when a channel moves more
 * than 32 of 255. Returns { ratio, refWidth, refHeight, productWidth, productHeight }.
 */
export async function imageDiff(page, refPath, productPath) {
  const url = (f) => `data:image/png;base64,${readFileSync(f).toString('base64')}`;
  await page.setContent('<html><body style="margin:0"></body></html>');
  return page.evaluate(async ([a, b]) => {
    const load = (src) => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = src; });
    const [ra, rb] = await Promise.all([load(a), load(b)]);
    const w = ra.naturalWidth;
    const hb = Math.round(rb.naturalHeight * (w / rb.naturalWidth));
    const h = Math.min(ra.naturalHeight, hb);
    const draw = (img, height) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, height);
      return c.getContext('2d').getImageData(0, 0, w, h).data;
    };
    const [da, db] = [draw(ra, ra.naturalHeight), draw(rb, hb)];
    let diff = 0;
    for (let i = 0; i < da.length; i += 4) {
      if (Math.abs(da[i] - db[i]) > 32 || Math.abs(da[i + 1] - db[i + 1]) > 32 || Math.abs(da[i + 2] - db[i + 2]) > 32) diff += 1;
    }
    return { ratio: h && w ? diff / (w * h) : 1, refWidth: ra.naturalWidth, refHeight: ra.naturalHeight, productWidth: rb.naturalWidth, productHeight: rb.naturalHeight };
  }, [url(refPath), url(productPath)]);
}

/**
 * Runs the capture. `playwright` is the project's module (it pins the version), `urls` the two bases
 * ({ prototype, product }), `outDir` the evidence dir of the run. Returns the number of (condition, scenario) records
 * whose capture failed on either side — the judge still reads them, as a P0 `capture` line.
 */
export async function capture({ playwright, config, urls, outDir, log = () => {}, baseDir = '.' }) {
  const isStatic = (config.prototype?.kind ?? 'live') === 'static';
  const factsOpts = { ...(config.facts ?? {}) };
  if (factsOpts.text === undefined) factsOpts.text = TEXT_HEALTH_OPTIONS;
  else if (factsOpts.text === false) delete factsOpts.text;
  let failed = 0;
  for (const cond of conditionsOf(config.conditions)) {
    const browser = await playwright[cond.browser].launch();
    const shots = join(outDir, cond.name);
    const factsDir = join(outDir, 'facts', cond.name);
    mkdirSync(shots, { recursive: true });
    mkdirSync(factsDir, { recursive: true });
    for (const sc of config.scenarios) {
      const rec = { scenario: sc.id, title: sc.title ?? sc.id, ui: sc.ui ?? [], project: cond.name };
      if (isStatic) rec.reference = 'static';
      for (const [side, key] of [['proto', 'prototype'], ['product', 'product']]) {
        if (side === 'proto' && isStatic) {
          // the static reference: no facts on its side; its image stands where the prototype's capture would be
          const ref = staticReference(config, sc, cond, baseDir);
          rec.proto = null;
          rec.protoActions = [];
          rec.protoError = ref ? null : `sem imagem de referência para ${sc.id} em ${cond.name}`;
          if (ref) copyFileSync(ref, join(shots, `${sc.id}.proto.png`));
          rec.referenceImage = ref;
          continue;
        }
        const context = await browser.newContext(cond.context);
        const page = await context.newPage();
        const actions = [];
        let facts = null;
        let error = null;
        try {
          await openSide(page, side, sc, config[key] ?? {}, urls[key]);
          for (const a of [...(sc[side]?.actions ?? []), ...(sc.actions ?? [])]) actions.push(await act(page, a));
          facts = await page.evaluate(collectFacts, factsOpts);
          await page.screenshot({ path: join(shots, `${sc.id}.${side}.png`), fullPage: true });
        } catch (e) {
          error = String(e).slice(0, 400);
          await page.screenshot({ path: join(shots, `${sc.id}.${side}.png`), fullPage: true }).catch(() => undefined);
        }
        rec[side] = facts;
        rec[`${side}Actions`] = actions;
        rec[`${side}Error`] = error;
        if (isStatic && side === 'product' && rec.referenceImage && !error) {
          rec.imageDiff = await imageDiff(page, rec.referenceImage, join(shots, `${sc.id}.product.png`)).catch((e) => ({ error: String(e).slice(0, 200) }));
        }
        await context.close();
      }
      if (rec.protoError || rec.productError) failed += 1;
      writeFileSync(join(factsDir, `${sc.id}.json`), JSON.stringify(rec, null, 2));
      log(`${cond.name} · ${sc.id}${rec.protoError || rec.productError ? ' · captura falhou' : ''}`);
    }
    await browser.close();
  }
  return failed;
}
