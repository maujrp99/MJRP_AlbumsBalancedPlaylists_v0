/**
 * The app's look, from docs/specs/design-system.md (Identidade; § Celular): black background, the
 * sheet panel #101014, the orange accent #f97316 (the primary action, the current tab, the chosen
 * item, never a segmented control), danger red, white text with secondary text at 60 % or more.
 * Measures: 44 px touch targets, 12 px the smallest text, 16 px side margin, 48 px primary button,
 * a 48 px top bar and a 56 px bottom bar (plus the safe areas).
 *
 * Not yet: the Syne display font (the system font stands in until the font is bundled with
 * expo-font; design-system.md § Família de fonte).
 */
export const colors = {
    background: '#000000',
    panel: '#101014',
    raised: '#2a2a30',
    border: 'rgba(255,255,255,0.14)',
    accent: '#f97316',
    accentPressed: '#dc2626',
    danger: '#f87171',
    text: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.68)',
    textMuted: '#a0a0a8',
    bar: 'rgba(8,8,10,0.94)'
} as const

export const size = {
    target: 44,
    primaryButton: 48,
    margin: 16,
    topBar: 48,
    bottomBar: 56,
    cover: 56
} as const

export const type = {
    screenTitle: { fontSize: 17, lineHeight: 22, fontWeight: '700' },
    title: { fontSize: 20, lineHeight: 24, fontWeight: '700' },
    body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
    secondary: { fontSize: 14, lineHeight: 18, fontWeight: '400' },
    label: { fontSize: 12, lineHeight: 16, fontWeight: '700' }
} as const
