/**
 * OPEN_LOCALES - the languages the site speaks to the public (F83 wave 0, risk R21; F81 owns the decision to open one).
 *
 * English and Portuguese, both open since the owner approved the Portuguese texts in the Painel and said the app speaks Portuguese in
 * Brazil and English elsewhere (MJRP, 2026-11-23; F81, REQ-02). Which of the two a visit gets is decided in language.js (the person's
 * choice, then the country). A language taken out of this list is refused by `setLocale`, but for whoever carries the preview mark
 * (`mjrp.lang.preview`, see t.js).
 */
export const OPEN_LOCALES = Object.freeze(['en', 'pt'])
