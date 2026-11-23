// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
/**
 * The admin kit's one entrance (ADR-0011; critique P2-9): a project imports the kit only from here, so the folder can
 * leave for a package of its own without breaking anyone. The layer sensor refuses an import of the kit's inside.
 */
export type {
    KitBlock, KitChoice, KitCustom, KitElement, KitField, KitFieldType, KitFlag, KitImage, KitImageWords, KitList, KitMarker, KitNote, KitOrder, KitOrderRow, KitRoles, KitSchema, KitSection, KitStep,
} from './schema';
export { elementsOf, listByKey, sectionByPath } from './schema';
export type { KitImageValue, KitItem, KitText, KitValues } from './values';
export { changedKeys, forStore, imageOf, itemsOf, newItemId, orderOf, pairText, roleHolders, roleOf, stateOf, textOf, translationRoute, withItem, withItemPassed, withMovedId, withPairText, withRole, withText, withValue, withoutRoleFlag } from './values';
export type { KitProblem, KitProblemCode } from './validate';
export { hasRequired, labelOf, missingLabels, placeOf, validate, type KitPlace } from './validate';
export type { KitFailure, KitImageVerdict, KitLocation, KitMarkerTexts, KitNavigation, KitPorts, KitRichPorts, KitPublication, KitResult, KitTexts, KitTranslateTexts } from './ports';
export { fill } from './ports';
export { SKIN_ATTRIBUTE, SKIN_TOKENS, type SkinToken } from './skin-contract';
// The rich text's document, reader and writer live in the kit's core (F332): `ui/` takes them from it, by its alias.
export type { RichBlock, RichDoc, RichInline, RichMarkKind, RichSize } from '@mjrp/admin-kit-core';
export { RICH_SIZES, bookPath, bookSlugOf, countOf, inlineText, normalizeDoc, parseInline, parseRich, plainText, safeHref, safeImage, toMarkdown, videoEmbed, videoOf } from '@mjrp/admin-kit-core';
export type { EditorBook } from './rich/editor-html';
export { RICH_TEXTS_EN, type RichTexts } from './rich/tools';
