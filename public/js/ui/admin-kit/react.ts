// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
"use client";

/**
 * The kit's screens, for a client component of the project: a second entrance only because a server file must not pull
 * React's client code (`index.ts` stays pure, for the server's check). The layer sensor accepts these two and no other.
 *
 * It imports no stylesheet (F332): the project imports `kit.css` and `required.css` where it mounts the panel, with its
 * own bundler, so a compiler that checks a side-effect import has nothing to refuse here.
 */
export { KitApp, type KitAppProps } from './components/KitApp';
export type { KitExtension } from './components/context';
export { useKit } from './components/context';
export { MissingNotice, REQUIRED_TEXTS_EN, RequiredLegend, RequiredMessage, RequiredName, focusField, type FocusFieldOptions, type MissingItem, type RequiredTexts } from './components/Required';
export { TranslateField, type TranslateFieldProps } from './components/TranslateField';
export { BrowserIdentityTab } from './components/BrowserIdentity';
export { KitScreen } from './components/KitScreen';
export { SectionIndex, WithSectionIndex, type SectionIndexEntry } from './components/SectionIndex';
export { RichTextField, type RichFieldPorts, type RichTextFieldProps } from './components/RichTextField';
export { Suggest, SuggestAsk, SuggestBusy, SuggestNote, SuggestOne, SuggestPick, SuggestWas } from './components/Suggest';
export type { SuggestAskProps, SuggestOption, SuggestState, SuggestTexts, SuggestWasProps } from './components/Suggest';
export { TextField, type TextFieldKind, type TextFieldProps } from './components/TextField';
