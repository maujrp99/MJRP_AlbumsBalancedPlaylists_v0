// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
import type { KitItem, KitValues } from './values';
/**
 * The contract of a schema (ADR-0011; `info-arch.md` § «O kit do admin (CMS)»): what a project hands the kit so the kit can
 * build its screens. Everything about the project is data here — the languages, the review states, the image slots, the
 * sections and their fields. The kit itself knows none of it (critique of ADR-0011, P1-2).
 *
 * Pure types and lookups, no React, no project import.
 */

/** `long` is plain text with paragraphs; `rich` is the rich text field, saved as the kit's Markdown (F128, ADR-0015). */
export type KitFieldType = 'short' | 'long' | 'rich' | 'link' | 'number';

/** A text the author writes, once per language unless `single` (a link, a date, a name kept as written). */
export interface KitField {
    kind: 'field';
    /** The id the project knows the field by (in this project, the copy deck's). */
    id: string;
    /** Where the text shows, in the project's words: the field's label. */
    label: string;
    /** Where the value lives, relative to the scope: the content's top level or the list item. */
    key: string;
    type: KitFieldType;
    /** One value for every language, not one per language. */
    single?: boolean;
    limit?: number;
    /** The limit only warns (the counter turns red): content written before the limit still saves. */
    advisory?: boolean;
    required?: boolean;
    hint?: string;
    /**
     * «Onde aparece»: the places the value shows, beside the field while the author types; `{value}` in a place is the
     * value inside the phrase it shows in («O topo: Founder, {value}»).
     */
    where?: string[];
    /** A badge beside the label (the company's «nome provisório»). */
    badge?: string;
    /** No key chip beside the label: the field is not an item of a copy deck the author knows by id. */
    quiet?: boolean;
    /** What the empty field shows: the value the place has while the author writes none (the tab's standard title: F113). */
    placeholder?: string;
    /** The field edits this language's text whatever the language open on the screen (two fields of one key, side by side: F113). */
    language?: string;
    /**
     * The text lives in loose keys of the scope, one per language, instead of `{ pt, en }` under `key`: `{ pt: 'synopsis', en: 'synopsis_en' }`
     * (F135, REQ-01). The field then has its own language tabs.
     */
    pair?: Record<string, string>;
    /**
     * A phrase the schema's `marker` can stand in (F127, `^cms-company-marker`): the field gets the button that puts the
     * marker in, the line that shows the phrase as the site has it, and the notice when the name is typed by hand.
     */
    marked?: boolean;
}

/**
 * A value written once and carried by a marker in the phrases that need it (F127, `^cms-company-where`): the company's name,
 * typed in one field, stands in the phrases wherever they write the token. The kit knows no name: the project says which
 * field it is and which token the readers swap.
 */
export interface KitMarker {
    /** The field (top-level key) that holds the value. */
    key: string;
    /** What the author writes in a phrase where the value goes: `{empresa}`. */
    token: string;
    /**
     * The field that, when blank in every language, makes the value's first word the mark in the box at the top («marca no
     * topo»): while it does, the list names the box as a place (`group`, `name`).
     */
    mark?: { key: string; group: string; name: string };
    /** Places outside this panel that also carry the token (the Garden's «Sobre mim»): named in the list, with no phrase. */
    elsewhere?: Array<{ group: string; name: string }>;
}

/** A yes or no the author sets, with what it waits on to be switched on (an image, for a photo that shows). */
export interface KitFlag {
    kind: 'flag';
    id: string;
    label: string;
    key: string;
    hint?: string;
    /** The key of an image in the same scope: without it the flag stays off and says why. */
    requires?: string;
}

/** An image in a slot the project declares; the rule of the slot is the project's, handed in through the ports. */
export interface KitImage {
    kind: 'image';
    id: string;
    label: string;
    key: string;
    slot: string;
    /** A square thumbnail (an icon), not the wide one of a screen. */
    square?: boolean;
    /** The square thumbnail at the size of the icon on the tab, about 40 px (the blocks of F113). */
    small?: boolean;
    /** The rule is said once by the group, not under each image. */
    quiet?: boolean;
    /** The image changes the site only at the next build (the Harness site, F101): an upload is marked «new» and can be undone. */
    buildNote?: boolean;
    /**
     * What the place shows while the author sends none (F113, `^browser-identity-default`): the image the code carries, drawn in the
     * thumbnail with `text` under «Ícone atual»; with an image sent, «Remover» becomes «Voltar ao padrão».
     */
    standard?: { src: string; text: string };
    /** The project's own words for an image with a standard that is not an icon (the header logo: «Logo atual», «O logo atual continua.»). */
    words?: KitImageWords;
    /** A wide thumbnail, for a logo that is wider than tall. */
    wide?: boolean;
}

/** The words the image space says when the project does not want the tab icon's (F113): each one replaces the port's text of the same job. */
export interface KitImageWords {
    /** «Logo atual»: the title while no image was sent. */
    title: string;
    /** «Enviar outro logo»: the button while no image was sent; `replace` is the one once one was («Trocar imagem»). */
    upload: string;
    replace: string;
    /** «Em uso no topo do site.»: under the image in use. */
    inUse: string;
    /** «Ainda não está no site: falta salvar.»: under an image sent and not yet saved. */
    pending: string;
    /** «novo»: the mark beside the file name of an image sent and not yet in the site. */
    newMark: string;
    /** «O logo atual continua.»: the end of a refusal. */
    stays: string;
    /** «Imagem enviada. Salve para levar ao site.»: the answer to an upload. */
    sentNote: string;
}

/** One choice among page models (the case page's Transformar or Elevar), each saying what it has. */
export interface KitChoice {
    kind: 'choice';
    id: string;
    label: string;
    key: string;
    options: Array<{ value: string; label: string; description: string }>;
}

/** What the site builds by itself and the panel only shows, with the reason; or a notice the project writes. */
export interface KitNote {
    kind: 'note';
    id: string;
    text: string;
    tone?: 'info' | 'warn';
}

/** A piece the project draws itself (the LinkedIn paste, the tilted wall), mounted by id from the project's extensions. */
export interface KitCustom {
    kind: 'custom';
    id: string;
    /** The list it works on, when it adds items to one. */
    list?: string;
    /** What the piece needs to know, in words the project and the piece agree on (the keys of the tab's icon and title: F113). */
    data?: Record<string, string>;
}

/** A list: create, edit, order and remove items, each item with its own fields. */
export interface KitList {
    kind: 'list';
    id: string;
    label: string;
    key: string;
    /** «+ Novo serviço»: the add button's text. */
    addLabel: string;
    /** The field whose value is the item's title in the row. */
    titleField: string;
    /** The field shown under the title, when there is one. */
    summaryField?: string;
    fields: Array<KitField | KitFlag | KitImage | KitChoice>;
    min?: number;
    max?: number;
    /** «No ar»: each item can be on or off the air; a new one starts as `initial`. */
    live?: { initial: boolean; /** The switch's words, when «No ar» is not the right ones (a badge is marked). */ on?: string; off?: string };
    /** One item at most carries this flag (the project in the spotlight). */
    unique?: { key: string; label: string };
    ordered: boolean;
    empty: string;
    /** What removing takes along, said on the button («remove o caso junto»). */
    removeAlso?: string;
    /** «Na página»: the live items, in order, beside the list. */
    preview?: { title: string };
    /** A badge an item shows when a field of it has a value (the recommendation «colado do LinkedIn»). */
    badges?: Array<{ key: string; value: string; label: string; tone?: 'accent' | 'warn' | 'neutral' }>;
    /**
     * The roles the items play somewhere else (the case's arrival, F85, `^pro-case-arrival-mark`): a role fixed by position (the
     * first chapter is the problem), or one the author picks in the row, each held by one item at most. The picked role is a flag
     * on the item itself (`key`), so it travels with the item when the order changes and leaves with it when it changes list.
     */
    roles?: KitRoles;
    /** What an item's badges add after their name («Transformar · 3 capítulos · 4 telas extras», UAT-150): computed from the item. */
    badgeDetail?: (item: KitItem) => string;
    /** The values a new item starts with, besides its id (a new project starts as «Transformar», UAT-151). */
    newItem?: Record<string, string | boolean>;
    /** The review state of the title field, as a badge in the row. */
    titleState?: boolean;
    /** An image of the item, small, in the row (the school's logo, the person's photo, a case's screen). */
    thumb?: string;
    /**
     * The thumbnail's form: `round` for a person, `plate` for a logo (whole, on a light plate), `wide` for a screen (16:10,
     * with its size, its weight and its warnings in the row, and above the buttons on the phone).
     */
    thumbShape?: 'round' | 'plate' | 'wide';
    /** The field that names an item when its title is empty (an extra screen dragged to the chapters keeps its caption). */
    fallbackTitle?: string;
    /** «Ou envie direto»: an image sent below the list becomes a new item at its end, with the image in this field. */
    directUpload?: { field: string; slot: string; label: string };
    /** The badge of an item created in this session, in place of «novo» (a project's «rascunho»). */
    freshLabel?: string;
    /** A new item opens its page at once (a new project opens its empty case). */
    openOnAdd?: boolean;
    /** What a switch off says («Fora do ar: some da página nos dois idiomas»). */
    offHint?: string;
    /** Lists of one group, in the same scope, take each other's items by dragging (the chapters and the extra screens). */
    group?: string;
    /** «Mover para Mais telas»: buttons that pass the item to another list of the same scope, at its end. */
    moveTo?: Array<{ list: string; label: string }>;
    /** «Usar uma tela do caso»: a new item made from an image already in the scope, without sending it again. */
    pick?: { label: string; field: string; sources: Array<{ list?: string; key: string }> };
    /** A piece the project draws for this list, by id from its extensions, in place of the kit's rows (the badges' box over the card's cover). */
    view?: string;
    /** Each item opens a page of its own (the case of a project): the section that shows it. */
    opens?: { section: string; label: string };
}

/** The roles of a list's items (`KitList.roles`). */
export interface KitRoles {
    /** The item's key that holds the picked role. */
    key: string;
    /** The selector's name in the row («Na chegada»). */
    label: string;
    /** The selector's empty choice («Não vai»). */
    none: string;
    /** The row's badge, with `{role}` for the role's name («na chegada: {role}»). */
    badge: string;
    /** Roles given by the position, counted from 0: the selector shows them, turned off. */
    fixed?: Array<{ at: number; label: string }>;
    /** Roles the author picks, each one held by one item at most. */
    pick: Array<{ value: string; label: string }>;
}

/** What one row of an order list says: its place and what it is (F158, `^pro-cms-order-list`). */
export interface KitOrderRow {
    /** The row's name. */
    name: string;
    /** The number of its place; `null` when it has none now (a section that is out of the site shows «—»). */
    number: string | null;
    /** A small square of the color the place gives, drawn in the row: any CSS color, which the project chooses. */
    swatch?: string;
    /** The line under the name: what the place gives («Fundo névoa (clara)»). */
    detail: string;
    /** A tag that replaces the detail when the row is out («Fora do site: nenhum depoimento no ar»); the row dims. */
    tag?: string;
}

/**
 * A list whose items are fixed and only change place (F158, S-173; `^cms-kit-fixed-order`): the rows of a list with create, edit and
 * remove, without «+ Novo» and without «Remover». Each row has the grip (drag), ↑ and ↓ (the keyboard's and the phone's way), the
 * number of its place and its name. A sentence under the list says the new place of whoever moved, for the screen reader and for
 * whoever sees. The value is the ids in order, an array of text under `key`; nothing about what the items are lives in the kit.
 */
export interface KitOrder {
    kind: 'order';
    id: string;
    /** The list's name, for the screen reader. */
    label: string;
    /** Where the ids in order live, in the scope's content. */
    key: string;
    /** The ids, in the order the list has while the content holds none (and the items it must always carry). */
    initial: readonly string[];
    /** One row, from the content and the order now. */
    row: (id: string, context: { values: KitValues; order: readonly string[] }) => KitOrderRow;
    /** The sentence after a move («Portfólio agora é a 01, com fundo névoa.»); `{name}` is the row's name in bold. */
    moved: (id: string, context: { values: KitValues; order: readonly string[] }) => string;
    /**
     * The sentence while a row is dragged («Arrastando Serviços: solte entre Portfólio e Mauctus Founder.»; the CMS v33, UAT-347), from the
     * order the list would have if the row dropped where it is now; the row's name goes in bold. Without it, the list says nothing until the drop.
     */
    dragging?: (id: string, context: { values: KitValues; order: readonly string[] }) => string;
}

export type KitElement = KitField | KitFlag | KitImage | KitChoice | KitNote | KitCustom | KitList | KitOrder;

/** One step of a page with a sequence: its number and name, and the block it leads to. */
export interface KitStep {
    n: string;
    label: string;
    block: string;
    /** What the step does on the page («inclinado», «pousa», «órbita»). */
    effect?: string;
    /** The words of the step's lists that differ from the block's (the button of the extras in Elevar: «+ Nova tela em camadas», UAT-156). */
    addLabel?: string;
}

export interface KitBlock {
    id: string;
    number?: string;
    title: string;
    subtitle?: string;
    elements: KitElement[];
    /** `false` keeps the block out of the screen's index: a block that is a notice and not a section (UAT-246). */
    inIndex?: false;
}

export interface KitSection {
    id: string;
    /** The address of the section inside the panel, without the panel's own prefix: `servicos`. */
    path: string;
    title: string;
    /** The name in the side menu, when it is not the page's title (F87: «Copy em arquivo (.md)» in the menu, «Copy em arquivo» on the page). */
    menuTitle?: string;
    subtitle?: string;
    /** The line under the title computed from what is in the panel now (a count that follows the edits); it wins over `subtitle`. */
    subtitleOf?: (values: KitValues) => string;
    blocks: KitBlock[];
    /** A section that shows one item of a list (the case of a project): the keys of its elements are the item's. */
    scope?: { list: string; /** The notice a page opened from a new item says (a project just created, UAT-151). */ freshNotice?: string };
    /** The steps of the page, by the value of a choice in the scope (the case's model). */
    steps?: { by: string; options: Record<string, KitStep[]>; titles?: Record<string, string> };
    /** Left out of the menu: reached only from a list row. */
    hidden?: boolean;
    /** The blocks listed under the section in the menu while it is open, each one leading to its block (`^pro-admin-harness-subnav`). */
    subnav?: string[];
}

export interface KitSchema {
    name: string;
    /** The project's languages; the first is the main one. */
    languages: readonly string[];
    /** The review states a value can carry, with the label and the tone of its badge. */
    states: Record<string, { label: string; plural?: string; tone: 'accent' | 'warn' | 'neutral' }>;
    /** The state a field takes when the author changes it, if the project keeps one. */
    editedState?: string;
    /** The value written once and carried by a token in the phrases (F127). */
    marker?: KitMarker;
    /**
     * Where a required text is required: `main`, the main language only, a translation can wait (the default); `every`, in
     * every language, for a project whose blank translation leaves the page (F125, the MJRP's option A).
     */
    requiredIn?: 'main' | 'every';
    sections: KitSection[];
    /**
     * The sections as the content has them now (F158): the menu's order and names, the page's titles and the order of the fields
     * the content rules. Called with the saved content for the menu and with the content on screen for the section's page; with
     * none, the sections stay as listed. A section keeps its `id` and `path`; only its place, its titles and its blocks change.
     */
    arrange?: (values: KitValues) => KitSection[];
}

/** Every field, flag, image, choice and list of a block list, in order, without notes, custom pieces and order lists. */
export function elementsOf(blocks: KitBlock[]): Array<KitField | KitFlag | KitImage | KitChoice | KitList> {
    return blocks.flatMap((block) => block.elements).filter((element): element is KitField | KitFlag | KitImage | KitChoice | KitList =>
        element.kind !== 'note' && element.kind !== 'custom' && element.kind !== 'order');
}

export function sectionByPath(schema: KitSchema, path: string): KitSection | undefined {
    return schema.sections.find((section) => section.path === path);
}

export function listByKey(schema: KitSchema, key: string): KitList | undefined {
    for (const section of schema.sections) {
        if (section.scope) continue;
        for (const element of elementsOf(section.blocks)) {
            if (element.kind === 'list' && element.key === key) return element;
        }
    }
    return undefined;
}
