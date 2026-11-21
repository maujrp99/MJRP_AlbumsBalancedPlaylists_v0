/**
 * OPEN_LOCALES - the languages the site speaks to the public (F83 wave 0, risk R21; F81 owns the decision to open one).
 *
 * While it holds only `en`, the site opens in English for everybody, the language picker does not show and the Portuguese
 * dictionary is not asked for. Portuguese is already in the code and in the tests: the owner reads it in his own browser
 * (mark `mjrp.lang.preview`, see t.js). Opening it is changing this list to ['en', 'pt'] and publishing, when the coverage the
 * MJRP chose (proposal D-8: all the screens, at the end of the waves) is reached.
 */
export const OPEN_LOCALES = Object.freeze(['en'])
