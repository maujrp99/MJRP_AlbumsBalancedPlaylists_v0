// cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
// The kit's contract with the projects that consume it — versioned (architecture audit of ADR-0017, 2026-10-12,
// finding 7). The kit is vendored into a child that IMPORTS it (the Control Center's judge imports rules.mjs and
// judge.mjs), so its surface is a contract like any other.
//
// The rule of compatibility (semver on KIT_VERSION):
//   - MAJOR: a stable export is removed or renamed, a config key changes meaning, or CONFIG_FORMAT changes — the
//     child's refresh must come with its own change; the kit refuses a config of another format (exit 2);
//   - MINOR: an export, a config key or a check is added — old configs and old imports keep working;
//   - PATCH: a fix that changes no surface.
// kit.test.mjs fails when a stable export disappears; run.mjs refuses a config whose `format` is not CONFIG_FORMAT and
// a Playwright outside PLAYWRIGHT_RANGE (both exit 2, not evaluable).

export const KIT_VERSION = '1.3.1';

/** The format of the project's visual.config (its `format` key; absent reads as 1). */
export const CONFIG_FORMAT = 1;

/** The config keys of format 1 (README § O config do projeto). */
export const CONFIG_KEYS = ['format', 'name', 'evidenceDir', 'deps', 'prototype', 'product', 'conditions', 'scenarios',
  'facts', 'rules', 'checks', 'pairs'];

/** The Playwright the kit needs: `locator().filter({ visible })` (1.51) and the APIs of capture.mjs; below 2. */
export const PLAYWRIGHT_RANGE = { min: '1.51.0', below: '2.0.0' };

/** The exports a project may import, per module. Removing or renaming one is a MAJOR change. */
export const STABLE_EXPORTS = {
  'rules.mjs': ['LABELS', 'simpleTitle', 'drawnFamilies', 'family', 'missingWebfonts', 'AH01_MIN', 'AH01_TEXT_TOKENS',
    'JND', 'parseColor', 'toHex', 'contrast', 'deltaE', 'ah01Grounds', 'ah01Adjust', 'tokenMatches',
    'RAW_MARKDOWN_PATTERNS', 'rawMarkdownMarkers', 'SQUEEZE_MAX_WIDTH', 'SQUEEZE_MIN_LINES', 'SQUEEZE_MAX_CHARS_PER_LINE',
    'SQUEEZE_MIN_WORD_LINES', 'isSqueezed', 'TEXT_HEALTH_OPTIONS', 'typographyChecks', 'webfontChecks', 'tokenChecks',
    'layoutChecks', 'textHealthChecks', 'orderChecks', 'cardChecks', 'componentChecks', 'actionChecks', 'baseChecks',
    'IMAGE_DIFF_MAX', 'staticChecks', 'componentKey', 'SQUEEZE_MIN_RATIO', 'squeezeDivergences', 'markdownDivergences',
    'TABLE_MIN_CELL_WIDTH', 'TABLE_PROBLEMS', 'tableDivergences', 'overflowDivergences', 'DRAWER_RATIO_TOLERANCE',
    'drawerTextHealth', 'drawerChecks'],
  'judge.mjs': ['exitCode', 'readRecords', 'expectedRecords', 'aggregate', 'summaryMarkdown', 'drawPairs', 'judge'],
  'facts.mjs': ['collectFacts'],
  'capture.mjs': ['conditionsOf', 'capture', 'staticReference', 'imageDiff'],
  'servers.mjs': ['waitForLine', 'isLoopback', 'stopGroup', 'startServers'],
  'run.mjs': ['loadPlaywright', 'run'],
  'collect.mjs': ['keepsCaptures', 'sizeOf', 'holdsVersioned', 'promotedPairs', 'removeChildren', 'collectRun'],
};

const parts = (v) => String(v).split('.').map((x) => parseInt(x, 10) || 0);
const cmp = (a, b) => {
  const [x, y] = [parts(a), parts(b)];
  for (let i = 0; i < 3; i += 1) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) - (y[i] ?? 0);
  return 0;
};

/** Whether a Playwright version is inside PLAYWRIGHT_RANGE. */
export const playwrightCompatible = (version) => cmp(version, PLAYWRIGHT_RANGE.min) >= 0 && cmp(version, PLAYWRIGHT_RANGE.below) < 0;

/** Why a config cannot be read by this kit, or null: another format, or keys this format does not know. */
export function configProblem(config) {
  const format = config?.format ?? 1;
  if (format !== CONFIG_FORMAT) return `config no formato ${format}; este kit (${KIT_VERSION}) lê o formato ${CONFIG_FORMAT}`;
  const unknown = Object.keys(config ?? {}).filter((k) => !CONFIG_KEYS.includes(k));
  return unknown.length ? `chaves que o formato ${CONFIG_FORMAT} não conhece: ${unknown.join(', ')}` : null;
}
