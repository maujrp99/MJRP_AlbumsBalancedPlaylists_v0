// cópia carimbada do MJRP Harness · versão 2026-11-10 · fonte 77b3a80a7 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
// The kit collects what it creates (F52 TASK-00; harness-kaizen 2026-10-19 22:59). A run writes its captures, its facts
// and its Playwright artifacts next to the verdict; a judge run is ~10 GB, and 400+ of them filled the MJRP's disk. After
// the verdict is written, the run folder keeps only the summary, the diff and the images PROMOTED to evidence — the
// side-by-side pair of every scenario that diverged (P0 or P1), in the conditions where it diverged. The rest is derived
// and regenerable, so it is removed, never copied into `_backups/` (the harness's "nothing is deleted without a copy"
// rule is for the MJRP's data, not for derived captures).
//
// NEVER what git versions (F52 judge P1-2; harness-kaizen 2026-10-23 21:11: a cleanup deleted 1,628 versioned images once). Every
// removal first asks `git ls-files`: a file git holds survives, whatever folder it is in; a folder that holds one loses only its
// untracked files. No git at all around the folder (a scratch run) means nothing is versioned; a git that cannot be asked means
// "cannot prove it is not versioned", and nothing is removed.
//
//   VISUAL_KEEP_CAPTURES=1   keeps everything (debugging a capture); the folder stays and the disk pays for it.
//
// Conservative on purpose: it removes only direct children of the run folder that it can name (the condition folders,
// `facts/`, `.playwright/`), only after `summary.md` exists (a run that was not judged is never collected), and it
// never follows a symbolic link out of the run folder.
import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, readdirSync, rmSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve, sep } from 'node:path';

/** Whether the environment asks to keep the captures. */
export const keepsCaptures = (env = process.env) => env.VISUAL_KEEP_CAPTURES === '1';

/** Bytes under a path (a file, or a folder recursively); symbolic links count as themselves. */
export function sizeOf(path) {
  const st = lstatSync(path);
  if (!st.isDirectory()) return st.size;
  return readdirSync(path).reduce((sum, name) => sum + sizeOf(join(path, name)), 0);
}

/** `git ls-files` inside `cwd`: the lines it answers, [] when `cwd` is in no repository, null when git cannot be asked at all. */
function gitFiles(cwd, args) {
  const run = spawnSync('git', ['-C', cwd, 'ls-files', '-z', ...args], { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (run.error) return null;                                   // no git: nothing can be proved
  if (run.status !== 0) return [];                              // not a repository: nothing is versioned here
  return run.stdout.split('\0').filter(Boolean);
}

/** Whether git versions `path` or anything under it. A path that cannot be checked counts as versioned. */
export function holdsVersioned(path) {
  const isDir = lstatSync(path).isDirectory();
  const found = isDir ? gitFiles(path, ['--', '.']) : gitFiles(dirname(path), ['--', basename(path)]);
  return found === null || found.length > 0;
}

/** The files under the folder `path` that git does NOT version (ignored ones included), as absolute paths. */
function untrackedFiles(path) {
  const all = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const st = lstatSync(full);
      if (st.isDirectory()) walk(full);
      else all.push(full);
    }
  };
  walk(path);
  const tracked = gitFiles(path, ['--', '.']);
  if (tracked === null) return [];
  const versioned = new Set(tracked.map((rel) => join(path, rel)));
  return all.filter((file) => !versioned.has(file));
}

/** Removes the empty folders left under `path` (deepest first), `path` itself when it ends up empty. */
function pruneEmpty(path) {
  for (const name of readdirSync(path)) {
    const full = join(path, name);
    if (lstatSync(full).isDirectory()) pruneEmpty(full);
  }
  if (readdirSync(path).length === 0) rmSync(path, { recursive: true, force: true });
}

/** The side-by-side pairs promoted to evidence: `pairs/<condition>/<scenario>.pair.jpg` of every P0/P1 line. */
export function promotedPairs(lines) {
  const keep = new Set();
  for (const l of lines ?? []) {
    if (l.sev !== 'P0' && l.sev !== 'P1') continue;
    for (const condition of l.projects ?? []) keep.add(join('pairs', condition, `${l.scenario}.pair.jpg`));
  }
  return keep;
}

const lstatSafe = (p) => {
  try {
    return lstatSync(p);
  } catch {
    return null;
  }
};

/**
 * Removes `names` (direct children of `dir`) and returns the bytes freed; refuses anything that leaves `dir`, and never touches a
 * file git versions: a child that holds one loses only its untracked files. `kept` (an array) receives what it left because git versions it.
 */
export function removeChildren(dir, names, { kept = [] } = {}) {
  const base = resolve(dir);
  let freed = 0;
  for (const name of new Set(names)) {
    const target = resolve(base, name);
    if (!target.startsWith(base + sep) || target === base) continue;          // never the folder itself, never outside it
    if (!lstatSafe(target)) continue;
    if (!holdsVersioned(target)) {
      freed += sizeOf(target);
      rmSync(target, { recursive: true, force: true });
      continue;
    }
    kept.push(name);
    if (!lstatSync(target).isDirectory()) continue;                           // a versioned file: it stays, whole
    for (const file of untrackedFiles(target)) {
      freed += lstatSync(file).size;
      rmSync(file, { force: true });
    }
    pruneEmpty(target);
  }
  return freed;
}

/**
 * Collects a judged run folder in the kit layout (judge.mjs): keeps `summary.md`, `diff.json` and the promoted pairs;
 * removes the condition folders, `facts/`, `.playwright/` and the pairs that are not evidence — all but what git versions.
 * Returns { collected, freed, kept, versioned } — `collected` false when the run was kept on purpose or was not judged;
 * `versioned` names what was left because git holds it.
 */
export function collectRun({ dir, lines = [], conditions = [], env = process.env, log = () => {} }) {
  const base = resolve(dir);
  if (keepsCaptures(env)) {
    log(`visual: VISUAL_KEEP_CAPTURES=1 — capturas mantidas em ${base}`);
    return { collected: false, freed: 0, kept: [], versioned: [] };
  }
  if (!existsSync(join(base, 'summary.md'))) return { collected: false, freed: 0, kept: [], versioned: [] };   // not judged: nothing to collect
  const versioned = [];
  const factsDir = join(base, 'facts');
  const named = existsSync(factsDir) ? readdirSync(factsDir) : [];
  let freed = removeChildren(base, [...named, ...conditions, 'facts', '.playwright'], { kept: versioned });
  const promoted = promotedPairs(lines);
  const kept = [];
  const pairsDir = join(base, 'pairs');
  if (existsSync(pairsDir)) {
    for (const condition of readdirSync(pairsDir)) {
      const folder = join(pairsDir, condition);
      if (!statSync(folder).isDirectory()) continue;
      for (const file of readdirSync(folder)) {
        const rel = join('pairs', condition, file);
        if (promoted.has(rel)) kept.push(rel);
        else freed += removeChildren(base, [rel], { kept: versioned });
      }
      if (readdirSync(folder).length === 0) freed += removeChildren(base, [join('pairs', condition)], { kept: versioned });
    }
    if (readdirSync(pairsDir).length === 0) freed += removeChildren(base, ['pairs'], { kept: versioned });
  }
  log(`visual: pasta da rodada recolhida em ${base} — ${(freed / 1048576).toFixed(0)} MB liberados; ficam o resumo, o diff e ${kept.length} par(es) de evidência`
    + (versioned.length ? `; ${versioned.length} item(ns) que o git versiona não foram tocados` : ''));
  return { collected: true, freed, kept, versioned };
}
