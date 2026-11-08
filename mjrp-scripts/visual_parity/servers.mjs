// cópia carimbada do MJRP Harness · versão 2026-11-07 · fonte b4a466ac2 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel`
// Starts the two sides of the comparison — the server of the approved prototype and the product — from the
// project's commands, and hands back their URLs. A side whose URL is already given (config `url`, or the
// environment variable named in `env`) is not started: the project may point at a running server.
//
// server = { name, cmd: [program, ...args], cwd, ready: 'regex with one group or none', url: 'template with $1',
//            env: 'VISUAL_..._URL', timeoutMs }
// The URL may carry a session token: it lives only in this process tree's memory, never on disk.
//
// Surface (architecture audit of ADR-0017, 2026-10-12, finding 6): a server the kit starts must answer on loopback —
// a URL on any other host is refused and the server stopped (the prototype's folder and the product's real data are
// not for the local network; bind the command to 127.0.0.1). Each server runs in its own process group, and stop()
// ends the whole group — SIGTERM, a wait, then SIGKILL — so an `npm run preview` leaves no `vite` behind.
import { spawn } from 'node:child_process';

const LOOPBACK = new Set(['127.0.0.1', 'localhost', '[::1]', '::1']);

/** Whether a server URL answers on loopback only (file: URLs have no host and pass). */
export function isLoopback(url) {
  const u = new URL(url);
  return u.protocol === 'file:' || LOOPBACK.has(u.hostname);
}

const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

/** Ends a child's whole process group: SIGTERM, up to `graceMs` for it to go, then SIGKILL. */
export async function stopGroup(child, graceMs = 3000) {
  if (!child?.pid) return;
  const group = -child.pid;
  try { process.kill(group, 'SIGTERM'); } catch { /* already gone */ }
  const until = Date.now() + graceMs;
  while (alive(child.pid) && Date.now() < until) await new Promise((r) => setTimeout(r, 50));
  try { process.kill(group, 'SIGKILL'); } catch { /* the group is gone */ }
}

/** Resolves with the first match of `pattern` in the child's stdout or stderr. */
export function waitForLine(child, pattern, what, timeoutMs) {
  return new Promise((resolveLine, reject) => {
    let buffer = '';
    const timer = setTimeout(() => reject(new Error(`${what}: no start line after ${timeoutMs} ms`)), timeoutMs);
    const onData = (chunk) => {
      buffer += chunk.toString('utf-8');
      const match = buffer.match(pattern);
      if (match) {
        clearTimeout(timer);
        resolveLine(match);
      }
    };
    child.stdout?.on('data', onData);
    child.stderr?.on('data', onData);
    child.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`${what} exited with ${code} before starting`));
    });
  });
}

/** Starts each server that has no URL yet; returns { urls: { name: url }, stop() }. */
export async function startServers(servers) {
  const children = [];
  const urls = {};
  const stop = async () => {
    for (const child of children) await stopGroup(child);
  };
  try {
    for (const s of servers) {
      const given = s.url && !s.cmd ? s.url : s.env ? process.env[s.env] : undefined;
      if (given) {
        urls[s.name] = given;
        continue;
      }
      const [program, ...args] = s.cmd;
      const child = spawn(program, args, { cwd: s.cwd, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
      children.push(child);
      const match = await waitForLine(child, new RegExp(s.ready), s.name, s.timeoutMs ?? 60_000);
      const url = (s.url ?? '$0').replace(/\$(\d)/g, (_, i) => match[Number(i)] ?? '');
      if (!isLoopback(url)) throw new Error(`${s.name}: o servidor respondeu em ${new URL(url).host}, fora do loopback — prenda o comando em 127.0.0.1 (--bind / --host)`);
      urls[s.name] = url;
    }
  } catch (e) {
    await stop();
    throw e;
  }
  return { urls, stop };
}
