// cópia carimbada do kit do admin do MJRP Harness · admin-kit v0.9.0 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
/**
 * The contract of a skin (ADR-0011; critique P1-4 and P2-10): the only tokens the kit's components read. A skin is CSS
 * that declares every one of them on the element that carries `data-admin-skin`; the kit has no color, font or radius of
 * its own. `--ak-new` is the «novo» badge, kept from the panel's skin of today. The states (`ok`, `warn`, `err`) are
 * declared by each skin, because each tone needs its own contrast.
 *
 * `scripts/skin_tokens_check.mjs` holds the contract against the kit and against every skin.
 */
export const SKIN_ATTRIBUTE = 'data-admin-skin';

export const SKIN_TOKENS = [
    '--ak-bg', '--ak-panel', '--ak-panel-2', '--ak-fg', '--ak-soft', '--ak-line',
    '--ak-accent', '--ak-accent-fg', '--ak-accent-soft',
    '--ak-ok', '--ak-ok-soft', '--ak-warn', '--ak-warn-soft', '--ak-err', '--ak-err-soft', '--ak-new', '--ak-new-soft',
    '--ak-preview-bg', '--ak-preview-fg',
    // F151 (UAT-258): the light plate a logo sits on, in a row and in the image space; the pro skin's is the mist of the v26. F150 (UAT-247):
    // `--ak-deep` is the dark that goes with it (the dark strip of the tab sample, the text on the plate); both stay the same in the day tone.
    '--ak-plate', '--ak-deep',
    // F158 (UAT-348): the shadow under a lifted row (the order list being dragged), seen on the dark panel too, and the thin line
    // around a color square, which must show on a light and on a dark square alike.
    '--ak-shadow', '--ak-swatch-line',
    '--ak-display', '--ak-sans', '--ak-mono', '--ak-radius',
    // F128: the site's reading font and the highlight, for the rich text field.
    '--ak-text', '--ak-mark',
] as const;

export type SkinToken = (typeof SKIN_TOKENS)[number];
