// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
/**
 * The kit's boundary, written down (critique of ADR-0011, P1-1): everything the project hands the kit. Besides these
 * ports, the kit imports only `react`, `react-dom`, `@dnd-kit/*` and `clsx` — the layer sensor holds that list
 * (`scripts/merge_gate.mjs`, `KIT_ALLOWED`).
 *
 * Every port that can fail says how (P1-8): a failed read is never an empty content, and a save that did not happen is
 * never «Tudo salvo».
 */
import type { KitValues } from './values';
import type { EditorBook } from './rich/editor-html';
import type { RichTexts } from './rich/tools';
import type { RequiredTexts } from './components/Required';

export type KitFailure = 'read-failed' | 'save-failed' | 'conflict' | 'session-expired' | 'refused';

export type KitResult<T> = { ok: true; value: T } | { ok: false; failure: KitFailure; message?: string };

/**
 * The publication of the site, when the project has one to show: the card at the top of the content (the CMS v33). `build` names the
 * latest build, so the kit can tell the one a save started from an older one; `none` says there is no build to follow at all (a host
 * that does not publish), so the card after a save does not wait for one (UAT-347). `unknown` is a query that failed: the card says the
 * publication could not be confirmed, instead of waiting for a build nobody can see (UAT-349).
 */
export type KitPublication =
    | { state: 'idle'; build?: string; none?: boolean }
    | { state: 'publishing'; message: string; build?: string }
    | { state: 'failed'; message: string; build?: string }
    | { state: 'unknown'; message: string; build?: undefined };

/** What the project says about an image before it is sent, by the rule of its slot. */
export type KitImageVerdict =
    | { ok: true; width?: number; height?: number; crop?: boolean; /** The slot's proportion, for the frame of the crop (UAT-154): `[16, 10]`. */ ratio?: readonly [number, number] }
    | { ok: false; message: string };

/** The texts of the translate piece (F96, S-128): `{language}` is the language's name, `{count}` a number, `{reason}` the cause. */
export interface KitTranslateTexts {
    /** The names of the languages, by code, in the project's words («português», «inglês»). */
    languages: Record<string, string>;
    /** «Traduzir do {language}». */
    from: string;
    busy: string;
    /** «Sem texto em {language} para traduzir»: the other languages are empty. */
    nothing: string;
    /** «Original em {language}». */
    original: string;
    /** «Sugestão em {language} · revise antes de aceitar». */
    suggestion: string;
    /** The warning when the field already has text: accepting replaces it. */
    replaces: string;
    /** «Passa do limite em {count} caracteres. Encurte antes de aceitar.». */
    overLimit: string;
    /** «Não deu para traduzir: {reason}. O campo continua como estava.». */
    failed: string;
    /** The causes of a failure: the service did not answer, the session is over, the service's credit is over. */
    reasons: { service: string; session: string; credit: string };
    accept: string;
    discard: string;
    again: string;
    retry: string;
    /** The name of the review, read by the screen reader. */
    review: string;
}

/**
 * The words of the marker (F127): `{count}` is a number, `{token}` the token, `{word}` the value's first word. Without them
 * (or without `schema.marker`) the kit draws none of it.
 */
export interface KitMarkerTexts {
    /** «Onde o nome aparece»: the title of the list beside the field. */
    where: string;
    /** «{count} trechos», and «1 trecho». */
    count: string;
    countOne: string;
    /** «Ver os outros {count}», and what closes the list again. */
    more: string;
    less: string;
    /** The hint under the field: changing it changes every place of the list, with no deploy. */
    hint: string;
    /** «A caixa do topo usa a primeira palavra: {word}.»: only while the box follows the value. */
    first: string;
    /** «+ Nome da empresa»: the button that puts the token in the phrase, and its hint. */
    insert: string;
    insertHint: string;
    /** «No site»: the line that shows the phrase as the site has it. */
    preview: string;
    /** «O nome está escrito à mão.» and why it matters; the button's «Trocar por {token}». */
    literal: string;
    literalWhy: string;
    fix: string;
    /** The screen reader's name of a place's link: «Ir para {name}». */
    goTo: string;
}

/** The interface texts of the kit itself, in the project's language (the project reads them from its own dictionary). */
export interface KitTexts {
    saved: string;
    /** `{count}` changes not saved; `unsavedOne` when there is one. */
    unsaved: string;
    unsavedOne: string;
    save: string;
    saving: string;
    day: string;
    night: string;
    loadFailed: string;
    retry: string;
    saveFailed: string;
    conflict: string;
    reload: string;
    sessionExpired: string;
    signIn: string;
    refused: string;
    untranslated: string;
    edit: string;
    close: string;
    remove: string;
    confirmRemove: string;
    moveUp: string;
    moveDown: string;
    drag: string;
    live: string;
    offAir: string;
    fresh: string;
    empty: string;
    onPage: string;
    whereItShows: string;
    upload: string;
    replace: string;
    removeImage: string;
    /** «nova · vale no próximo build»: the mark of an image sent and not yet in the site; and the button that takes it back. */
    newMark: string;
    undo: string;
    /** «Enviado. Vale no próximo build.»: the answer to an icon sent. */
    sentBuild: string;
    uploading: string;
    uploaded: string;
    noImage: string;
    /** The tab icon's block (F113, `^browser-identity-*`): «Ícone atual», «Em uso nesta aba.», «Voltar ao padrão», «Enviar outro ícone». */
    standardTitle: string;
    inUse: string;
    backToStandard: string;
    uploadIcon: string;
    /** «novo · vale no próximo build»: the mark of an icon sent and not yet in the site (the image's `newMark` is the feminine one). */
    iconNewMark: string;
    /** «O ícone de hoje continua até o próximo build.»: under the icon sent and not yet in the site. */
    keepsUntilBuild: string;
    /** «O ícone atual continua.»: the end of an icon's refusal. */
    iconStays: string;
    /** The name of the sample tab, for the screen reader. */
    tabSample: string;
    /** «Falta o recorte»: the image is not in the slot's proportion; `{ratio}` is the image's («4:3»), `{target}` the slot's («16:10»); and the three crop points. */
    cropNeeded: string;
    /** «Não enviada»: the title of a refusal. «Enviada»: the title of an upload, and what to do next. */
    notSent: string;
    sent: string;
    sentNext: string;
    /** «pronta»: a screen with no warning. */
    ready: string;
    /** The button that adds the image picked from the ones already in the scope. */
    usePicked: string;
    cropTop: string;
    cropCenter: string;
    cropBottom: string;
    /** `{width} × {height} px · {size}`. */
    measure: string;
    back: string;
    /** The name of the bar of steps, read by the screen reader. */
    sequence: string;
    /** The title of the index of the sections beside a long screen (F112). */
    sectionIndex: string;
    /** The name of that index, read by the screen reader. */
    sectionIndexLabel: string;
    menu: string;
    openSection: string;
    /** `{fields}` fields · `{states}`: the overview's line of a section. */
    sectionCount: string;
    /**
     * The messages of each problem the schema's check finds, by code (`{limit}` is replaced), and `summary`, with `{count}`;
     * `missing`, with `{fields}`, names the required fields left empty (F125, REQ-01).
     */
    problems: Record<string, string>;
    /** The required piece (F125): the legend, the notice «Falta preencher: …», the sentence under the field and «Não salvou». */
    required?: RequiredTexts;
    /** The translate piece's words; without them (or without `ports.translate`) the kit offers no translation. */
    translate?: KitTranslateTexts;
    /** The rich field's words (F128); without them, the kit's English (`RICH_TEXTS_EN`). */
    rich?: RichTexts;
    /** The marker's words (F127); the kit draws the list, the button, the line and the notice only with them and `schema.marker`. */
    marker?: KitMarkerTexts;
    /** The hint under a long plain text (`^cms-text-paragraphs`): «a linha em branco vira parágrafo no site». */
    paragraphsHint?: string;
}

/** What the rich field needs of the project (F128): the slot its images go to, the Jardim's shelf, the pages for a link. */
export interface KitRichPorts {
    imageSlot?: string;
    books?(): Promise<EditorBook[]>;
    pages?: Array<{ label: string; href: string }>;
}

/** A place of the panel: a section's path ('' for the overview), the item of a scoped section, and a block to land on. */
export interface KitLocation {
    path: string;
    itemId?: string;
    /** The anchor of a block (`blk-<id>`) or of a field, to scroll to. */
    block?: string;
}

/**
 * How the panel moves (F332, REQ-01 and REQ-05): the project's router owns the browser's history, and the kit only asks it.
 * The kit never calls `history`, never writes the hash and never listens to `popstate` or `hashchange`.
 */
export interface KitNavigation {
    /** Where the panel is now, as the router reads its address. */
    where(): KitLocation;
    /** Takes the panel to a place; `replace` takes the place of the current entry instead of adding one. */
    go(target: KitLocation, options?: { replace?: boolean }): void;
    /** Tells the kit when the place changed (the back button, an address typed by hand); returns the way to stop. */
    listen(changed: () => void): () => void;
}

export interface KitPorts {
    /** The content as the store holds it now, with the version the save will be checked against. */
    load(): Promise<KitResult<{ values: KitValues; version: string }>>;
    /** All the content at once, on the version that was read: all or nothing. */
    save(values: KitValues, version: string): Promise<KitResult<{ version: string }>>;
    /** The rule of a slot, in one line, shown before the author picks a file. */
    imageRule(slot: string): string;
    /** The project's verdict on a file for a slot, before it is sent (the same rule the server applies). */
    checkImage(slot: string, file: File): Promise<KitImageVerdict>;
    uploadImage(slot: string, file: File): Promise<KitResult<{ src: string; width?: number; height?: number; bytes?: number; note?: string }>>;
    /** The warnings of an image already in a slot (below the least size, out of proportion), in the project's words. */
    describeImage?(slot: string, image: { width?: number; height?: number }): string[];
    /**
     * The translation of a text into a language (F96, S-128): the project's service, through its existing action. The kit
     * offers the translate piece only when this port exists. A failure says why: `session-expired`, or a `message` of
     * `credit` (the service's credit is over); any other failure is the service not answering.
     */
    translate?(text: string, target: string): Promise<KitResult<string>>;
    /** The publication band, when the project has one. */
    publication?(): Promise<KitPublication>;
    /**
     * What the band says from the moment a save is done, before the first answer of `publication` (the build takes a while to start):
     * «Salvo. Publicando: …». Without it, the band waits for the poll (F158, UAT-344).
     */
    publishingAfterSave?: string;
    /** Where the author signs in again when the session is over. */
    signInHref: string;
    /** The address of a section inside the panel, from its path (and the item, for a scoped section): the links' `href`. */
    hrefOf(path: string, itemId?: string): string;
    /** The router's port: where the panel is, how it moves, and when the place changed (F332). */
    navigation: KitNavigation;
    texts: KitTexts;
    /** The rich text field's ports (F128); without them, the field has no image and no book card. */
    richText?: KitRichPorts;
}

/** A text with its `{name}` holes filled. */
export function fill(text: string, values: Record<string, string | number>): string {
    return text.replace(/\{(\w+)\}/g, (whole, name: string) => (name in values ? String(values[name]) : whole));
}
