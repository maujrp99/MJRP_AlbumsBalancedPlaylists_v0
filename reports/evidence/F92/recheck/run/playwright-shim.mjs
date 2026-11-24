// Judge shim: the project's Playwright, every context aborting any host that is not 127.0.0.1 and any non-http scheme
// (music.apple.com, itunes, spotify, Firebase... and music://, itms://, spotify:).
import { createRequire } from 'node:module';
const req = createRequire('/Users/maujrp/mjrp/projects/MJRP_AlbumsBalancedPlaylists_v0/.claude/worktrees/f92-deep-cuts-judge/noop.js');
const real = req('@playwright/test');
export const blocked = [];
function wrap(type) {
  return new Proxy(type, { get(t, k) {
    if (k !== 'launch') return Reflect.get(t, k);
    return async (...a) => { const b = await t.launch(...a); const nc = b.newContext.bind(b);
      b.newContext = async (o) => { const c = await nc({ ...(o || {}), serviceWorkers: 'block' });
        await c.route(() => true, (r) => { const u = r.request().url(); let h = ''; try { h = new URL(u).hostname; } catch {}
          if (/^https?:/.test(u) && h === '127.0.0.1') return r.continue(); blocked.push(u.slice(0, 80)); return r.abort(); });
        return c; };
      b.newPage = async (o) => (await b.newContext(o)).newPage();
      return b; };
  } });
}
export const chromium = wrap(real.chromium);
export const webkit = wrap(real.webkit);
export const firefox = wrap(real.firefox);
export default { chromium, webkit, firefox };
