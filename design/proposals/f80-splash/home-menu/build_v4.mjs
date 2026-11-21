/**
 * F80 · «A barra é o menu» v4, 2026-11-21: the rhythm of the scroll. The owner, looking at the stretch after
 * «Lado A · 1 — Inicie»: «o espçamento aqui tem um vázio muito grande, ou reduzimos ou colocamos animacoes ligadas a
 * fogo e musica...motions fading in e fading out»; then «gaste um tempo pra repensar nesse ultimo ponto e caprichar na v4».
 *
 * What v4 changes over v3 (v3 stays intact; this script reads it):
 * 1. The rhythm: shorter stories on the computer (70dvh, 540 to 680 px, instead of 88dvh) and, under each story's
 *    text, a «vignette»: a quiet panel with a motif that means the story (fire and music), fading in as the story
 *    enters and out as it leaves, tied to the scroll. On the phone the vignette sits beside the story's cover,
 *    in the space v3 left empty, and the dead band between stories goes.
 * 2. The motifs: Inicie, a search field types an artist and the results gather into a series; Álbuns, the real
 *    Velvet Underground & Nico card: «Venus In Furs» rises to the top (and, on the phone, beside
 *    the banana, a track climbing from fourth to first); Blend, three records feed one playlist in turn, no record twice in a row; Playlists, saved playlists,
 *    one playing (▶), each marked as exported to Spotify and Apple Music (✓, a state, not a button); Inventário, a shelf with a vinyl sliding out of its
 *    sleeve, a CD and a cassette whose reels turn.
 * 3. Motion rules (as the page already had them): transform and opacity only; the loops run only while the vignette is
 *    on screen and while the page is «moving» (10 s after the last scroll; at rest each shows its still); the pause icon stops everything and shows
 *    each vignette's composed still; with reduced motion nothing moves and every vignette is its still.
 * 4. The opening: the title is only «Mergulhe nos álbuns que você ama.»; «Seus álbuns do momento, numa playlist
 *    balanceada.» is a smaller line under it; on the phone the two calls share one row, so the crate shows on the first
 *    screen.
 *
 * Usage: node design/proposals/f80-splash/home-menu/build_v4.mjs
 * Writes: design/inception/splash-menu-bar-v4.html (never over an existing file unless V4_REBUILD=1).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '../../../..')
const SRC = path.join(REPO, 'design/inception/splash-menu-bar-v3.html')
const OUT = 'design/inception/splash-menu-bar-v4.html'

let html = fs.readFileSync(SRC, 'utf8')
const swap = (a, b) => {
    const n = html.split(a).length - 1
    if (n !== 1) throw new Error(`expected once (${n}): ${a.slice(0, 80)}`)
    html = html.replace(a, () => b)
}

// ---------- 1. the copy: the opening split in title + line (the owner's words, 2026-11-21) ----------
const m = html.match(/  const T = (\{.*\})\n/)
if (!m) throw new Error('dictionary not found')
const T = JSON.parse(m[1])
T['h.title'] = ['Mergulhe nos álbuns que você ama.', 'Dig through the albums you love.']
T['h.sub'] = ['Seus álbuns do momento, numa playlist balanceada.', 'Your albums of the moment, in one balanced playlist.']
html = html.replace(m[0], () => `  const T = ${JSON.stringify(T)}\n`)
swap('<h1 id="h1" data-i18n="h.title">Mergulhe nos álbuns que você ama. <em>Seus álbuns do momento, numa playlist balanceada.</em></h1>',
    '<h1 id="h1" data-i18n="h.title">Mergulhe nos álbuns que você ama.</h1>\n      <p class="h-sub" data-i18n="h.sub">Seus álbuns do momento, numa playlist balanceada.</p>')

// ---------- 2. the vignettes: one per story, decorative (aria-hidden), fixed size (no layout shift) ----------
const disc = (c = '') => `<i class="v4-disc${c}"></i>`
const MOTIF = {
    // Inicie: type an artist; the results gather into a series
    start: `<div class="v4-motif m-start" aria-hidden="true">
        <div class="s-field"><svg class="s-lens" viewBox="0 0 16 16" width="14" height="14"><circle cx="7" cy="7" r="4.6"/><path d="M10.4 10.4 14 14"/></svg><span class="s-q">Pink Floyd<i class="s-mask"></i></span></div>
        <ul class="s-rows"><li class="r1">${disc(' hot')}<b></b><s></s></li><li class="r2">${disc()}<b></b><s></s></li><li class="r3">${disc()}<b></b><s></s></li></ul>
      </div>`,
    // Álbuns, phone only (beside the banana): the track you lift plays
    albums: `<div class="v4-motif m-albums" aria-hidden="true">
        <span class="a-row"></span><span class="a-row"></span><span class="a-row"></span><span class="a-row"></span>
        <span class="a-hot"><b>↑</b><i></i></span>
      </div>`,
    // Blend: three records feed one playlist in turn
    blend: `<div class="v4-motif m-blend" aria-hidden="true">
        <span class="b-src">${disc(' c1')}${disc(' c2')}${disc(' c3')}</span>
        <svg class="b-lines" viewBox="0 0 100 120" preserveAspectRatio="none">${[0, 1, 2, 3, 4, 5].map(k => `<path class="ln l${k}" d="M0 ${[20, 60, 100][k % 3]} C50 ${[20, 60, 100][k % 3]} 50 ${10 + 20 * k} 100 ${10 + 20 * k}"/>`).join('')}</svg>
        <ol class="b-list">${[0, 1, 2, 3, 4, 5].map(k => `<li class="k${k} c${(k % 3) + 1}"><i></i><b></b></li>`).join('')}</ol>
      </div>`,
    // Playlists: saved playlists, one playing; the export lights Spotify, then Apple Music
    playlists: `<div class="v4-motif m-pl" aria-hidden="true">
        <ul class="p-list"><li class="p1"><span class="mos"><i></i><i></i><i></i><i></i></span><b></b><s></s><span class="p-play">▶</span></li><li class="p2"><span class="mos"><i></i><i></i><i></i><i></i></span><b></b><s></s></li></ul>
        <span class="p-out"><span class="ex ex-sp">Spotify <i>✓</i></span><span class="ex ex-am">Apple Music <i>✓</i></span></span>
      </div>`,
    // Inventário: physical media on a shelf — vinyl, CD, cassette
    inventory: `<div class="v4-motif m-inv" aria-hidden="true">
        <span class="i-row">
          <span class="i-vinyl"><i class="i-disc"></i><i class="i-sleeve"></i></span>
          <span class="i-stack"><span class="i-tape"><i class="i-reel"></i><i class="i-reel"></i></span><span class="i-cd"><i class="i-cdd"></i></span></span>
        </span>
        <i class="i-plank"></i>
      </div>`,
}
const PULL = { start: 2, albums: 0, blend: 5, playlists: 10, inventory: 12 }
for (const [id, n] of Object.entries(PULL)) {
    swap(`<section id="${id}" data-track="${id}" aria-labelledby="t-${id}">\n    <div class="slot pre" data-pull="${n}" aria-hidden="true"></div>`,
        `<section id="${id}" data-track="${id}" aria-labelledby="t-${id}">\n    <div class="v4-lead"><div class="slot pre" data-pull="${n}" aria-hidden="true"></div>${MOTIF[id]}</div>`)
}
// the ranking card: the lifted track rises, once per visit
swap('<div class="ranked rank-real" role="group"', '<div class="ranked rank-real" data-v4-card role="group"')

// ---------- 3. the style ----------
const CSS = `
/* ===== v4 (2026-11-21): the rhythm. Every story = text + a vignette that means it; no dead stretch ===== */
.hero .h-sub{font:700 clamp(22px,2.1vw,27px)/1.18 var(--display);letter-spacing:-.01em;color:var(--orange-text);margin:14px 0 0;max-width:24ch;text-wrap:balance}
.hero .what{margin-top:18px}
/* the computer: shorter stories, centred; the vignette under the text, the crate on the right as before */
.story > section{min-height:clamp(540px,70dvh,680px);padding:48px 0}
.story > section.final{min-height:clamp(440px,56dvh,560px)}
.v4-lead{order:9;display:block}
.v4-lead .slot{display:none}
.v4-motif{position:relative;display:block;width:min(100%,420px);height:200px;margin:28px 0 0;border:1px solid rgba(255,255,255,.08);border-radius:14px;overflow:hidden;contain:layout paint;
  background:radial-gradient(110% 80% at 50% 125%,rgba(249,115,22,.13),rgba(220,38,38,.04) 55%,transparent 75%),#0f0f13}
.v4-motif *{box-sizing:border-box}
.m-albums{display:none}
.v4-disc{position:relative;display:block;flex:0 0 auto;width:24px;height:24px;border-radius:50%;
  background:radial-gradient(circle,#0f0f13 0 7%,var(--lab,#f97316) 8% 30%,#141418 31% 34%,transparent 35%),repeating-radial-gradient(circle,#1c1c22 0 1.4px,#26262d 1.4px 2.8px);box-shadow:0 0 0 1px rgba(255,255,255,.08)}
.v4-disc::after{content:"";position:absolute;left:50%;top:30%;width:2px;height:2px;margin-left:-1px;border-radius:50%;background:rgba(255,255,255,.55)}
/* Inicie */
.m-start{padding:18px}
.s-field{display:flex;align-items:center;gap:10px;height:40px;padding:0 12px;border-radius:10px;border:1px solid rgba(255,255,255,.2);background:#15151a}
.s-lens{flex:0 0 auto;fill:none;stroke:#9a9aa4;stroke-width:1.6;stroke-linecap:round}
.s-q{position:relative;display:block;overflow:hidden;font:600 15px/1 var(--body);color:#e9e9ee;white-space:nowrap;padding:3px 2px 3px 0}
.s-mask{position:absolute;inset:0;background:#15151a;transform:translateX(101%)}
.s-mask::before{content:"";position:absolute;left:0;top:2px;bottom:2px;width:2px;border-radius:1px;background:var(--orange-text)}
.s-rows{list-style:none;margin:14px 0 0;padding:0;display:grid;gap:10px}
.s-rows li{display:flex;align-items:center;gap:12px}
.s-rows b{display:block;height:7px;width:46%;border-radius:4px;background:rgba(255,255,255,.36)}
.s-rows s{display:block;height:6px;width:18%;border-radius:3px;background:rgba(255,255,255,.2)}
.s-rows .r1 b{background:linear-gradient(90deg,rgba(249,115,22,.75),rgba(220,38,38,.45))}
.v4-disc.hot{box-shadow:0 0 0 1px rgba(255,255,255,.1),0 0 14px rgba(249,115,22,.45)}
/* Álbuns (the card on every width; beside the banana on the phone, a track climbing to the top) */
.rank-real li{height:38px;padding:0}
.rank-real .tt,.rank-real .mv{transition:transform .9s cubic-bezier(.2,.7,.2,1),opacity .5s ease .55s}
html.v4-armed .rank-real:not(.go) li.up .tt,html.v4-armed .rank-real:not(.go) li.up .mv{transform:translateY(38px)}
html.v4-armed .rank-real:not(.go) li:nth-child(2) .tt{transform:translateY(-38px)}
html.v4-armed .rank-real:not(.go) li.up .mv{opacity:0}
.m-albums{padding:0}
.a-row{position:absolute;left:34px;right:16px;height:7px;border-radius:4px;background:rgba(255,255,255,.3)}
.a-row:nth-child(1){top:30px}.a-row:nth-child(2){top:64px;right:36px}.a-row:nth-child(3){top:98px;right:26px}.a-row:nth-child(4){top:132px;right:44px}
.a-hot{position:absolute;left:12px;right:16px;top:25px;height:17px;display:flex;align-items:center;gap:8px}
.a-hot b{font:800 15px/1 var(--display);color:var(--orange-text);width:14px}
.a-hot i{flex:1;height:9px;border-radius:5px;background:linear-gradient(90deg,#f97316,#dc2626);box-shadow:0 0 12px rgba(249,115,22,.45)}
.m-albums.live .a-hot{animation:v4climb 6s cubic-bezier(.3,.6,.2,1) infinite both}
@keyframes v4climb{0%,12%{transform:translateY(102px);opacity:0}20%{transform:translateY(102px);opacity:1}55%,90%{transform:none;opacity:1}100%{transform:none;opacity:0}}
/* Blend */
.m-blend{display:grid;grid-template-columns:28px minmax(0,1fr) 44%;grid-template-rows:minmax(0,1fr);column-gap:0;padding:16px 18px;height:200px}
.m-blend > *{min-height:0;height:100%}
.b-src{display:flex;flex-direction:column;justify-content:space-around;align-items:center}
.b-src .v4-disc{width:28px;height:28px}
.v4-disc.c1{--lab:#f97316}.v4-disc.c2{--lab:#dc2626}.v4-disc.c3{--lab:#fbbf24}
.b-lines{width:100%;height:100%;overflow:visible}
.b-lines .ln{fill:none;stroke:rgba(255,255,255,.11);stroke-width:1.2;vector-effect:non-scaling-stroke}
.b-list{list-style:none;margin:0;padding:0;display:grid;grid-template-rows:repeat(6,1fr);align-items:center}
.b-list li{display:flex;align-items:center;gap:8px}
.b-list li i{flex:0 0 auto;width:8px;height:8px;border-radius:50%;background:var(--lab)}
.b-list li b{display:block;height:6px;flex:1;max-width:120px;border-radius:3px;background:rgba(255,255,255,.36)}
.b-list .c1{--lab:#f97316}.b-list .c2{--lab:#dc2626}.b-list .c3{--lab:#fbbf24}
.m-blend.live .b-list li{animation:v4row 7.2s ease-in-out infinite both}
.m-blend.live .b-list .k1{animation-delay:.45s}.m-blend.live .b-list .k2{animation-delay:.9s}.m-blend.live .b-list .k3{animation-delay:1.35s}.m-blend.live .b-list .k4{animation-delay:1.8s}.m-blend.live .b-list .k5{animation-delay:2.25s}
.m-blend.live .b-src .v4-disc{animation:v4spin 3.6s linear infinite}
.m-blend.live .b-src .c2{animation-duration:4.4s}.m-blend.live .b-src .c3{animation-duration:3.1s}
/* Playlists */
.m-pl{padding:16px 18px;display:flex;flex-direction:column;justify-content:space-between}
.p-list{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.p-list li{display:grid;grid-template-columns:44px minmax(0,1fr) auto;grid-template-rows:auto auto;column-gap:12px;row-gap:7px;align-items:center;padding:8px;border-radius:10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06)}
.mos{grid-row:1 / span 2;display:grid;grid-template-columns:1fr 1fr;gap:2px;width:44px;height:44px;border-radius:5px;overflow:hidden}
.mos i{display:block;background:var(--c)}
.p1 .mos i:nth-child(1){--c:#4a2a1a}.p1 .mos i:nth-child(2){--c:#2a2238}.p1 .mos i:nth-child(3){--c:#5a4a1f}.p1 .mos i:nth-child(4){--c:#1f3b3a}
.p2 .mos i:nth-child(1){--c:#3a1f24}.p2 .mos i:nth-child(2){--c:#26323d}.p2 .mos i:nth-child(3){--c:#40301c}.p2 .mos i:nth-child(4){--c:#2b2b30}
.p-list b{display:block;height:7px;width:70%;border-radius:4px;background:rgba(255,255,255,.22)}
.p-list s{display:block;grid-column:2;height:6px;width:38%;border-radius:3px;background:rgba(255,255,255,.1)}
.p-play{grid-column:3;grid-row:1 / span 2;font-size:11px;line-height:1;color:var(--orange-text)}
.p-out{display:flex;gap:14px;flex-wrap:wrap;padding:0 2px}
.ex{display:inline-flex;align-items:center;gap:5px;font:600 12px/1.2 var(--body);color:#b9b9c2;white-space:nowrap}
.ex i{font-style:normal;color:var(--orange-text)}
.m-pl.live .p-play{animation:v4pulse 1.6s ease-in-out infinite}
.m-pl.live .ex i{animation:v4chip 6s ease-in-out infinite both}
.m-pl.live .ex-am i{animation-delay:-3s}
/* Inventário */
.m-inv{padding:0 18px}
.i-row{position:absolute;left:22px;right:18px;bottom:30px;display:flex;align-items:flex-end;gap:16px}
.i-vinyl{position:relative;display:block;width:104px;height:104px;margin-right:42px}
.i-sleeve{position:absolute;inset:0;border-radius:3px;background:linear-gradient(160deg,#2b1a10,#160e09);box-shadow:0 0 0 1px rgba(255,255,255,.08),0 10px 24px rgba(0,0,0,.6)}
.i-sleeve::after{content:"";position:absolute;left:12%;right:12%;top:44%;height:12%;border-radius:2px;background:linear-gradient(90deg,#dc2626,#f97316 60%,#fbbf24);opacity:.75}
.i-disc{position:absolute;top:3%;left:3%;width:94%;height:94%;border-radius:50%;transform:translateX(40%);
  background:radial-gradient(circle,#0f0f13 0 3%,#f97316 4% 26%,#151519 27% 29%,transparent 30%),repeating-radial-gradient(circle,#17171c 0 1.6px,#222228 1.6px 3.2px);box-shadow:0 0 0 1px rgba(255,255,255,.06)}
.i-disc::after{content:"";position:absolute;left:50%;top:30%;width:3px;height:3px;margin-left:-1.5px;border-radius:50%;background:rgba(255,255,255,.55)}
.i-stack{display:flex;align-items:flex-end;gap:16px}
.i-cd{position:relative;display:block;width:72px;height:64px;border-radius:3px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.04)}
.i-cd::before{content:"";position:absolute;left:0;top:0;bottom:0;width:8px;border-right:1px solid rgba(255,255,255,.14)}
.i-cdd{position:absolute;left:16px;top:6px;width:52px;height:52px;border-radius:50%;
  background:radial-gradient(circle,#0f0f13 0 12%,rgba(255,255,255,.18) 13% 16%,transparent 17%),conic-gradient(from 30deg,#3a3a44,#5a5a66,#3a3a44,#4b4038,#3a3a44)}
.i-tape{position:relative;display:block;width:92px;height:58px;border-radius:5px;background:#1d1d23;box-shadow:0 0 0 1px rgba(255,255,255,.1)}
.i-tape::before{content:"";position:absolute;left:8px;right:8px;top:6px;height:10px;border-radius:2px;background:linear-gradient(90deg,#dc2626,#f97316 60%,#fbbf24);opacity:.7}
.i-tape::after{content:"";position:absolute;left:22px;right:22px;top:24px;height:22px;border-radius:11px;background:#0d0d10;box-shadow:inset 0 0 0 1px rgba(255,255,255,.1)}
.i-reel{position:absolute;z-index:1;top:27px;width:16px;height:16px;border-radius:50%;border:2px dashed rgba(255,255,255,.45)}
.i-reel:first-child{left:27px}.i-reel:last-child{right:27px}
.i-plank{position:absolute;left:0;right:0;bottom:16px;height:14px;background:linear-gradient(180deg,#3a2616,#24170d 70%,#1a0f08);box-shadow:0 -1px 0 rgba(255,200,150,.16) inset}
.m-inv.live .i-disc{animation:v4slide 8s cubic-bezier(.3,.6,.2,1) infinite both}
.m-inv.live .i-reel{animation:v4spin 2.6s linear infinite}
/* the loops */
@keyframes v4eq{from{transform:scaleY(.25)}to{transform:scaleY(1)}}
@keyframes v4spin{to{transform:rotate(360deg)}}
@keyframes v4rise{0%,100%{transform:translateY(6px);opacity:.55}50%{transform:translateY(-4px);opacity:1}}
@keyframes v4type{0%,8%{transform:translateX(0)}38%,100%{transform:translateX(101%)}}
@keyframes v4blink{0%,49%{opacity:1}50%,100%{opacity:0}}
@keyframes v4row{0%{opacity:.5}8%,82%{opacity:1}100%{opacity:.5}}
@keyframes v4chip{0%,8%{opacity:.35}20%,42%{opacity:1}54%,100%{opacity:.35}}
@keyframes v4pulse{0%,100%{opacity:.5}50%{opacity:1}}
@keyframes v4slide{0%{transform:translateX(4%) rotate(0)}22%,78%{transform:translateX(40%) rotate(220deg)}100%{transform:translateX(4%) rotate(360deg)}}
@keyframes v4fade{0%,92%{opacity:1}100%{opacity:0}}
@keyframes v4r1{0%,40%{opacity:.55}47%,90%{opacity:1}100%{opacity:.55}}
@keyframes v4r2{0%,46%{opacity:.55}53%,90%{opacity:1}100%{opacity:.55}}
@keyframes v4r3{0%,52%{opacity:.55}59%,90%{opacity:1}100%{opacity:.55}}
.m-start.live .s-mask{animation:v4type 7s steps(11,end) infinite both}
.m-start.live .s-mask::before{animation:v4blink .9s step-end infinite}
.m-start.live .s-q{animation:v4fade 7s linear infinite both}
.m-start.live .r1{animation:v4r1 7s ease-out infinite both}
.m-start.live .r2{animation:v4r2 7s ease-out infinite both}
.m-start.live .r3{animation:v4r3 7s ease-out infinite both}
/* motion: the loops freeze when the page rests (10 s after the last scroll); the pause shows the stills */
html.paused .rank-real .tt,html.paused .rank-real .mv{transition:none}
html:not(.moving) .v4-motif *,html:not(.moving) .v4-motif *::before{animation-play-state:paused!important}
@media (prefers-reduced-motion:reduce){.v4-motif,.v4-motif *,.v4-motif *::before{animation:none!important;transition:none!important}.rank-real .tt,.rank-real .mv{transition:none!important}}

/* the phone: the vignette beside the story's cover (where v3 had nothing), the dead band between stories gone */
@media (max-width:899px){
  .hero .h-sub{font-size:20px;margin-top:10px}
  .hero .what{font-size:16px;margin:12px 0 18px}
  .hero .ctas .btn{flex:1 1 auto;padding:0 16px}
  .story > section{min-height:0;padding:36px 0}
  .story > section.final{min-height:0}
  .v4-lead{order:0;display:flex;align-items:stretch;gap:14px;margin:0 0 60px}
  .v4-lead .slot{display:block;flex:0 0 172px;width:172px;height:172px;margin:0}
  .v4-motif{flex:1 1 auto;min-width:0;width:auto;height:172px;margin:0}
  .m-albums{display:grid}
  .m-start{padding:12px}
  .s-field{height:34px;gap:7px;padding:0 9px}
  .s-q{font-size:13px}
  .s-rows{margin-top:12px;gap:9px}
  .s-rows li{gap:9px}
  .s-rows b{width:58%}.s-rows s{width:20%}
  .v4-disc{width:20px;height:20px}
  .m-blend{height:172px;padding:12px;grid-template-columns:24px minmax(0,1fr) 46%}
  .b-src .v4-disc{width:24px;height:24px}
  .b-list li{gap:6px}
  .m-pl{padding:10px}
  .p-list{gap:6px}
  .p-list li{grid-template-columns:30px minmax(0,1fr) auto;column-gap:8px;row-gap:5px;padding:5px}
  .mos{width:30px;height:30px}
  .p-list b{width:80%}.p-list s{width:46%}
  .p-out{flex-direction:column;gap:5px}
  .p-out{gap:4px}
  .ex{font-size:11px}
  .m-inv{padding:0}
  .i-row{left:10px;right:6px;bottom:24px;gap:8px}
  .i-vinyl{width:72px;height:72px;margin-right:24px}
  .i-stack{flex-direction:column;align-items:flex-start;gap:3px}
  .i-cd{width:44px;height:40px}
  .i-cd::before{width:5px}
  .i-cdd{left:9px;top:4px;width:31px;height:31px}
  .i-tape{width:50px;height:32px;border-radius:4px}
  .i-tape::before{left:5px;right:5px;top:4px;height:6px}
  .i-tape::after{left:11px;right:11px;top:13px;height:13px}
  .i-reel{top:15px;width:9px;height:9px;border-width:1.5px}
  .i-reel:first-child{left:14px}.i-reel:last-child{right:14px}
  .i-plank{bottom:12px;height:12px}
}
`
const styleEnd = html.indexOf('</style>')
if (styleEnd < 0) throw new Error('no style')
html = html.slice(0, styleEnd) + CSS + html.slice(styleEnd)

// ---------- 4. the script: the vignettes fade with the scroll; loops only while seen; the pause shows the stills ----------
const JS = `
// ===== v4: the vignettes fade in as their story enters and out as it leaves, tied to the scroll =====
{
  const D = document, H = D.documentElement
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const motifs = [...D.querySelectorAll('.v4-motif')], card = D.querySelector('[data-v4-card]')
  if (!reduce) {
    H.classList.add('v4-armed')
    // how far an element's centre is from the viewport's centre: 0 in the middle, 1 at an edge
    const off = (el) => { const r = el.getBoundingClientRect(); return r.height ? (r.top + r.height / 2 - innerHeight / 2) / (innerHeight / 2) : 9 }
    let raf = 0
    const tick = () => {
      raf = 0
      const still = H.classList.contains('paused') || !H.classList.contains('moving')
      for (const m of motifs) {
        const c = off(m), a = Math.abs(c)
        if (H.classList.contains('paused')) { m.style.opacity = ''; m.style.transform = ''; m.classList.remove('live'); continue }
        // fully there across the middle of the screen; fades over the outer fifth
        const o = a < 0.62 ? 1 : Math.max(0, 1 - (a - 0.62) / 0.33)
        m.style.opacity = o.toFixed(3)
        m.style.transform = 'translate3d(0,' + (c * 10).toFixed(1) + 'px,0)'
        m.classList.toggle('live', o > 0.02 && !still)
      }
      if (card) {
        const a = Math.abs(off(card))
        if (still) { card.classList.add('go'); card.classList.remove('live') }
        else {
          if (a < 0.55) card.classList.add('go'); else if (a > 1.05) card.classList.remove('go')
          card.classList.toggle('live', a < 1)
        }
      }
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick) }
    addEventListener('scroll', kick, { passive: true }); addEventListener('resize', kick)
    D.addEventListener('motionchange', kick)
    tick()
  }
}
`
const anchor = 'startSplash(window)\n'
if (html.split(anchor).length !== 2) throw new Error('no startSplash anchor')
html = html.replace(anchor, () => anchor + JS)

// ---------- 5. guards ----------
for (const bad of ['<em>Seus álbuns do momento']) if (html.includes(bad)) throw new Error('left in v4: ' + bad)
if ((html.match(/class="v4-motif /g) || []).length !== 5) throw new Error('expected 5 vignettes')
const p = path.join(REPO, OUT)
if (fs.existsSync(p) && !process.env.V4_REBUILD) throw new Error('exists: ' + OUT + ' (V4_REBUILD=1 only before it is shown)')
fs.writeFileSync(p, html)
console.log(OUT, Math.round(Buffer.byteLength(html) / 1024) + ' KB')
