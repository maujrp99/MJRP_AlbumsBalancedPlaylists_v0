# ADR-0021: Tailwind Is Built With the Site

**Date**: 2026-11-19
**Status**: Proposed
**Deciders**: Claude agent (drafter); owner's acceptance pending
**Acceptance**: MJRP
**Related work**: release v5.0, feature F59 (slice E), issue UAT-25

## Context
The app writes its look with Tailwind utility classes: 758 different classes in `public/index.html` and in the JavaScript under `public/js`. Until F59 the page loaded Tailwind as a script from `cdn.tailwindcss.com` on every opening, and that script made the CSS in the browser. Three costs came with it:

- a script from another host ran in the page with full access to it, and the page's content policy had to allow that host in `script-src` and in `style-src`;
- the version was whatever the host served that day: nothing in the repository fixed it;
- the look of the app depended on that host answering.

The constitution (Art. II) accepts Tailwind "only if requested" and no record said it was requested. Issue UAT-25 asks for one of two things: the styles made at build time, or the use of Tailwind recorded as a decision. This record does both.

## Decision
Tailwind stays, and it is built with the site.

- Tailwind `3.4.19` is a development dependency (`package.json`, fixed by `package-lock.json`). Tailwind 3 is the line the classes were written for: that address serves the last 3.x (3.4, as far as the drafter knows; the host was not called from the drafting session, so the exact number it served is not confirmed).
- Vite runs it through PostCSS: `vite.config.js` (`css.postcss`) reads `tailwind.config.js`. The dev server (`npx vite`) and the build (`npx vite build`) make the same CSS. There is no other build of the styles.
- The entry is `public/css/tailwind.css`, imported by `public/js/app.js` after `index.css`, so Tailwind's rules still come after the app's own, as they did when the script added them at the end of the page.
- `tailwind.config.js` names where classes are written (`public/index.html` and `public/js/**/*.js`) and holds the theme that was written inside `index.html` (the Syne font, the `brand` colors, the two gradients), unchanged. A class the app puts together when it runs is written in full in the `safelist` there.
- The page no longer loads the script, and the host left its content policy.
- `test/architecture/tailwindBuiltWithSite.test.js` holds the rule: no page of the site names the host; every class Tailwind finds in the source is in the built CSS; every class name put together at run time is read and listed.

## Options
- **Keep the script from the CDN and record it** — no work, no risk to the look; keeps the three costs above. The host itself says the script is not for production. Refused.
- **Build with the site, Tailwind 3.4 (PostCSS in Vite)** — same line as before, so the same classes mean the same CSS; one new development dependency; the page loads one stylesheet from the site. Chosen.
- **Build with the site, Tailwind 4** — the current line, with its own Vite plugin; it changes defaults (border color, ring width, the way the theme is written) and would change the look without anyone asking. Not chosen now; it is a separate decision, with a visual check of every screen.
- **Remove Tailwind and write the CSS by hand** — what Art. II prefers; it means rewriting the look of every screen. Not chosen for the v0.

## Consequences
- Whoever builds needs `npm ci` once after this change (a new package). `scripts/deploy-site.sh` already runs `npm ci` and `npx vite build` in a clean copy: nothing changes there.
- The built stylesheet goes from about 11 kB to 76.7 kB (13.0 kB compressed); the page stops downloading and running the CDN script.
- Tailwind writes only the classes it finds whole in the files of `content`. A class assembled from pieces, or written in a folder outside `content`, gets no style and nothing warns in the browser. The test above is the net for that; it reads shapes, not meaning, so a new way of assembling a class name can pass it.
- `'unsafe-inline'` stays in `script-src` and in `style-src`: the app still has inline event handlers and inline styles. Removing it is other work.
- Four pages that are not part of the published site (`public/typography-preview.html`, `public/static_prototype_v3.html`, `public/debug-curator.html`, `public/legacy/hybrid-curator.html`) still load the CDN script when opened in the dev server.
- `docs/specs/tech-stack.md` cites this record in the Tailwind row.
