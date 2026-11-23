// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
"use client";

/**
 * A field, a flag, a choice and an image slot: each edits one value of the scope it is given and hands back the new scope.
 */
import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react';
import type { KitChoice, KitField, KitFlag, KitImage, KitSchema } from '../schema';
import { fill, type KitImageVerdict, type KitPorts, type KitTexts } from '../ports';
import type { KitProblem } from '../validate';
import { imageOf, pairText, stateOf, textOf, withPairText, withText, withValue, type KitImageValue, type KitValues } from '../values';
import { Badge, Notice } from './bits';
import { TextField, type TextFieldKind } from './TextField';
import type { RichFieldPorts } from './RichTextField';
import { RICH_TEXTS_EN } from '../rich/tools';
import { fieldAnchor, problemsAt, useKit } from './context';
import { nameOf } from '../values';
import { RequiredMessage, RequiredName } from './Required';
import { MarkerHint, MarkerWhere, PhraseTools } from './MarkerParts';
import { insertToken, withToken } from '../marker';

interface Props<E> {
    element: E;
    values: KitValues;
    onChange: (next: KitValues) => void;
    at: string[];
}

/** The languages a field is written in: its pair's, the main one for a single value, its fixed one, or the schema's. */
function languagesOf(element: KitField, schema: KitSchema, single: boolean): string[] {
    if (element.pair) return Object.keys(element.pair);
    if (single) return [schema.languages[0]];
    return element.language ? [element.language] : [...schema.languages];
}

/**
 * Where the text of each language lives (F135, REQ-01): a pair of loose keys (`synopsis`/`synopsis_en`), one value only, one
 * fixed language or one per language. `lang` is the language the field shows (none for a single value).
 */
function fieldStore(element: KitField, values: KitValues, schema: KitSchema, language: string) {
    const pair = element.pair;
    const single = !pair && element.single === true;
    const own = values[element.key];
    const read = (code: string): string => {
        if (pair) return pairText(values, pair, code);
        if (!single) return textOf(values, element.key, code);
        return typeof own === 'string' ? own : '';
    };
    const write = (code: string, text: string): KitValues => (pair ? withPairText(values, pair, code, text) : withText(values, element.key, single ? null : code, text, schema.editedState));
    const lang = single ? null : element.language ?? language;
    return { main: schema.languages[0], languages: languagesOf(element, schema, single), read, write, lang };
}

/** What the field is: short, link and number are plain; the long one is rich, and plain when it has a limit of characters (F135). */
function kindOf(element: KitField): TextFieldKind {
    if (element.type === 'short' || element.type === 'link' || element.type === 'number') return element.type;
    return element.type === 'long' && element.limit !== undefined ? 'plain' : 'rich';
}

/** The marker (F127): whether this field holds the value (`source`) or is a phrase that can carry it (`phrase`). */
function markerRoleOf(schema: KitSchema, ports: KitPorts, element: KitField, lang: string | null): { source: boolean; phrase: boolean } {
    const marker = schema.marker;
    if (!marker || !ports.texts.marker) return { source: false, phrase: false };
    const prose = element.type === 'short' || element.type === 'long';
    return { source: element.id === marker.key, phrase: Boolean(element.marked && prose && lang !== null) };
}

type Caret = { selectionStart: number | null; selectionEnd: number | null } | null;

/** In the plain box the marker goes where the cursor is; in the rich text, at the end, since the editable box gives no position. */
function tokenPut(kind: TextFieldKind, now: string, field: Caret, token: string): { text: string; caret: number } {
    if (kind === 'rich') return { text: `${now}${now && !/\s$/.test(now) ? ' ' : ''}${token}`, caret: -1 };
    return insertToken(now, field?.selectionStart ?? now.length, field?.selectionEnd ?? now.length, token);
}

/** The rich field (F128): the project's slot for the images of a text, its shelf and its pages, through the ports. */
function richPortsOf(ports: KitPorts): RichFieldPorts {
    const slot = ports.richText?.imageSlot;
    return {
        pages: ports.richText?.pages,
        books: ports.richText?.books ? () => ports.richText!.books!() : undefined,
        imageRule: slot ? ports.imageRule(slot) : undefined,
        uploadImage: slot ? async (file) => {
            const verdict = await ports.checkImage(slot, file);
            if (!verdict.ok) return { ok: false, message: verdict.message };
            const sent = await ports.uploadImage(slot, file);
            return sent.ok ? { ok: true, src: sent.value.src } : { ok: false, message: sent.message ?? ports.texts.saveFailed };
        } : undefined,
    };
}

/** What the text field takes from the ports: the rich editor's, the translation (F96: only with a version per language, the port and the words) and the hint of the paragraphs. */
function textOptionsOf(ports: KitPorts, languages: string[]) {
    const t = ports.texts;
    return {
        rich: { ports: richPortsOf(ports), texts: t.rich ?? RICH_TEXTS_EN },
        translate: languages.length > 1 && ports.translate && t.translate ? { run: ports.translate, t: t.translate } : undefined,
        words: t.paragraphsHint ? { paragraphs: t.paragraphsHint, plain: t.paragraphsHint } : undefined,
    };
}

/**
 * The required one left empty, in the language on the screen (F125; the kit v1 piece): the sentence under the field and the id
 * that ties it to the box. Without the project's words for it, only the id (the problem's own line says it).
 */
function lackOf(mine: KitProblem[], required: KitTexts['required'], id: string, lang: string | null): { describedBy?: string; message?: ReactNode } {
    const problem = mine.find((candidate) => candidate.code === 'required');
    if (!problem) return {};
    const describedBy = nameOf(id, 'missing');
    return { describedBy, message: required ? <RequiredMessage id={describedBy} english={(problem.language ?? lang) === 'en'} t={required} /> : undefined };
}

const overLimit = (element: KitField, text: string): boolean => element.limit !== undefined && text.length > element.limit;

/** The field's name: with the * of the required one tied to its last word (F125; UAT-262), its badge and its review state. */
function FieldName({ element, values }: { element: KitField; values: KitValues }) {
    const { schema } = useKit();
    const state = stateOf(values, element.key);
    return (
        <>
            <RequiredName text={element.label} required={element.required} />
            {element.badge && <Badge tone="warn">{element.badge}</Badge>}
            {state && schema.states[state] && <Badge tone={schema.states[state].tone}>{schema.states[state].label}</Badge>}
        </>
    );
}

/** The field's problems, one line each; the required one left empty has its own sentence, when the project has the words. */
function ProblemLines({ mine }: { mine: KitProblem[] }) {
    const { ports } = useKit();
    const lines = ports.texts.required ? mine.filter((problem) => problem.code !== 'required') : mine;
    return <>{lines.map((problem) => <span key={problem.code} className="ak-err-t">{fill(ports.texts.problems[problem.code] ?? problem.code, { limit: problem.limit ?? '' })}</span>)}</>;
}

/** Beside the field: the list of the marker's places for the value's field, or «Onde aparece» with the text in each place. */
function framed(field: ReactNode, element: KitField, source: boolean, text: string, title: string) {
    if (source) return <div className="ak-split">{field}<MarkerWhere /></div>;
    if (!element.where?.length) return field;
    return (
        <div className="ak-split">
            {field}
            <aside className="ak-where" aria-live="polite">
                <b>{title}</b>
                {element.where.map((place) => {
                    // «O topo: Founder, {value}»: the value inside the phrase it shows in; without `{value}`, the value alone.
                    const [name, phrase = '{value}'] = place.split(/:\s*(.+)/);
                    const [before, after = ''] = phrase.split('{value}');
                    return <span key={place}>{name}: {before}<strong>{text}</strong>{after}</span>;
                })}
            </aside>
        </div>
    );
}

export function FieldInput({ element, values, onChange, at }: Props<KitField>) {
    const { schema, language, ports, problems } = useKit();
    const id = useId();
    // O campo da frase (F127): o botão do marcador põe o marcador onde está o cursor.
    const box = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
    const { main, languages, read, write, lang } = fieldStore(element, values, schema, language);
    const open = lang ?? main;
    const text = read(open);
    const mine = problemsAt(problems, [...at, element.key]).filter((problem) => !problem.language || problem.language === (element.language ?? language));
    const { source, phrase } = markerRoleOf(schema, ports, element, lang);
    const kind = kindOf(element);
    const [shown, setShown] = useState(language);
    const putToken = () => {
        const field = box.current;
        const put = tokenPut(kind, read(shown), field, schema.marker!.token);
        onChange(write(shown, put.text));
        if (put.caret >= 0) requestAnimationFrame(() => { field?.focus(); field?.setSelectionRange(put.caret, put.caret); });
    };
    const fixHand = (names: string[]) => onChange(write(shown, withToken(read(shown), names, schema.marker!.token)));
    // A frase de um idioma que ainda não tem tradução diz isso no próprio campo.
    const untranslatedIn = (code: string) => code !== main && !read(code).trim() && read(main).trim() !== '';
    const placeholder = Object.fromEntries(languages.map((code) => [code, untranslatedIn(code) ? ports.texts.untranslated : element.placeholder ?? '']));
    const lack = lackOf(mine, ports.texts.required, id, lang);
    const options = textOptionsOf(ports, languages);
    const field = (
        <div className={lack.message ? 'ak-f rq-bad' : 'ak-f'} id={fieldAnchor([...at, element.key], element.language)} data-pin={element.language ? '' : undefined}>
            <TextField id={id} kind={kind} languages={languages} showing={open} onOpen={setShown} values={Object.fromEntries(languages.map((code) => [code, read(code)]))}
                label={<FieldName element={element} values={values} />}
                labelText={element.label} keyName={element.quiet ? undefined : element.id} required={element.required} invalid={mine.length > 0 || overLimit(element, text)}
                limit={element.limit} placeholder={placeholder} hint={element.hint} inputRef={box} describedBy={lack.describedBy} bare
                below={lack.message}
                rich={options.rich} translate={options.translate} words={options.words}
                onChange={(code, next) => onChange(write(code, next))} />
            {lang !== null && untranslatedIn(lang) && <span className="ak-hint">{ports.texts.untranslated}</span>}
            {source && <MarkerHint />}
            {phrase && <PhraseTools text={read(shown)} lang={shown} onInsert={putToken} onFix={fixHand} />}
            <ProblemLines mine={mine} />
        </div>
    );
    return framed(field, element, source, text, ports.texts.whereItShows);
}

export function FlagInput({ element, values, onChange, at }: Props<KitFlag>) {
    const { ports, problems } = useKit();
    const blocked = element.requires !== undefined && !imageOf(values, element.requires);
    const on = values[element.key] === true && !blocked;
    const mine = problemsAt(problems, [...at, element.key]);
    return (
        <div className="ak-f">
            <label className="ak-check">
                <input type="checkbox" checked={on} disabled={blocked} onChange={(event) => onChange(withValue(values, element.key, event.target.checked))} />
                <span>{element.label}{element.hint && <><br /><span className="ak-hint">{element.hint}</span></>}</span>
            </label>
            {mine.map((problem) => <span key={problem.code} className="ak-err-t">{ports.texts.problems[problem.code] ?? problem.code}</span>)}
        </div>
    );
}

export function ChoiceInput({ element, values, onChange }: Props<KitChoice>) {
    const name = useId();
    const current = typeof values[element.key] === 'string' ? values[element.key] : '';
    return (
        <fieldset className="ak-f" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="ak-lb">{element.label}</legend>
            <div className="ak-choice">
                {element.options.map((option) => (
                    <label key={option.value}>
                        <span><input type="radio" name={name} value={option.value} checked={current === option.value}
                            onChange={() => onChange(withValue(values, element.key, option.value))} /> <b>{option.label}</b></span>
                        <small>{option.description}</small>
                    </label>
                ))}
            </div>
        </fieldset>
    );
}

/** The size of a file in the panel's words. */
export function sizeOf(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB` : `${Math.round(bytes / 1024)} KB`;
}

/** The shape of an image in words a person knows («4:3»): a common one when it is within 1%, else the ratio to one. */
const SHAPES: ReadonlyArray<readonly [number, number]> = [[4, 3], [3, 2], [5, 4], [1, 1], [3, 4], [2, 3], [16, 9], [9, 16], [21, 9], [2, 1], [1, 2]];
export function shapeOf(width: number, height: number, language: string): string {
    const ratio = width / height;
    const known = SHAPES.find(([a, b]) => Math.abs(ratio - a / b) <= (a / b) * 0.01);
    return known ? `${known[0]}:${known[1]}` : `${ratio.toLocaleString(language, { maximumFractionDigits: 2 })}:1`;
}

/**
 * The image with the frame of the cut over it (UAT-154; the professional panel v2's `ccrop`): the part the slot's proportion keeps
 * is bright inside the frame, the rest is dimmed, and the frame sits at the point the author is about to choose.
 */
function CropFrame({ url, width, height, target, point }: { url: string; width?: number; height?: number; target: readonly [number, number]; point: 'top' | 'center' | 'bottom' }) {
    const ratio = width && height ? width / height : target[0] / target[1];
    const want = target[0] / target[1];
    // An image taller than the slot's proportion loses its top or bottom; a wider one, its left or right.
    const tall = ratio < want;
    const keep = Math.min(100, (tall ? ratio / want : want / ratio) * 100);
    const at = point === 'top' ? 0 : point === 'center' ? (100 - keep) / 2 : 100 - keep;
    return (
        <div className="ak-crop" style={{ aspectRatio: String(ratio) }} data-point={point} aria-hidden="true">
            <img src={url} alt="" />
            <i style={tall ? { left: 0, right: 0, height: `${keep}%`, top: `${at}%` } : { top: 0, bottom: 0, width: `${keep}%`, left: `${at}%` }} />
        </div>
    );
}

type CropPoint = 'top' | 'center' | 'bottom';
type SlotResult = { tone: 'ok' | 'err' | 'info'; text: string };
type Cropping = { file: File; width?: number; height?: number; target?: readonly [number, number]; url: string };
/** The image the upload replaced, kept while the author can still take it back (the Harness site, F101). */
type Undo = { previous: KitImageValue | null };
type Sent = { src: string; width?: number; height?: number; bytes?: number };

/** «Não enviada», why, and for a space with a standard, that the one in use stays. */
const refusalOf = (element: KitImage, t: KitTexts, why: string): SlotResult => ({ tone: 'err', text: [t.notSent, why, element.standard ? (element.words?.stays ?? t.iconStays) : ''].filter(Boolean).join(' ') });

/** The value of an image sent: its address, what the project measured of it, and the crop point the author chose. */
const sentValue = ({ src, width, height, bytes }: Sent, position?: CropPoint): KitImageValue => ({ src, ...(width ? { width } : {}), ...(height ? { height } : {}), ...(bytes ? { bytes } : {}), ...(position ? { position } : {}) });

/** What is said of an image the site shows only at the next build: the project's words, or for an icon the sentence of the v18. */
function buildNoteOf(element: KitImage, t: KitTexts): SlotResult | null {
    if (element.words) return { tone: 'info', text: element.words.sentNote };
    return element.square ? { tone: 'ok', text: t.sentBuild } : null;
}

/** «Enviada», its measure and what to do next. */
const sentNoteOf = (t: KitTexts, { width, height, bytes }: Sent): SlotResult => ({ tone: 'ok', text: [t.sent, width && height ? fill(t.measure, { width, height, size: sizeOf(bytes) }) : '', t.sentNext].filter(Boolean).join(' ') });

/** The upload of a slot: the project's verdict, the crop point when the image is out of proportion, the sending and the way back. */
function useImageUpload(element: KitImage, values: KitValues, onChange: (next: KitValues) => void, image: KitImageValue | null) {
    const { ports } = useKit();
    const t = ports.texts;
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<SlotResult | null>(null);
    const [undo, setUndo] = useState<Undo | null>(null);
    const [cropping, setCropping] = useState<Cropping | null>(null);
    // The crop point the frame shows: the one under the pointer or the focus, «Topo» to begin (UAT-154).
    const [framed, setFramed] = useState<CropPoint>('top');
    useEffect(() => () => { if (cropping) URL.revokeObjectURL(cropping.url); }, [cropping]);
    // The file just sent, shown from the browser while the site does not carry it yet: the address of an image sent is only served after the next build.
    const [preview, setPreview] = useState<string | null>(null);
    const send = async (file: File, position?: CropPoint) => {
        setBusy(true);
        setResult(null);
        setCropping(null);
        const sent = await ports.uploadImage(element.slot, file);
        setBusy(false);
        if (!sent.ok) {
            setResult(refusalOf(element, t, sent.message ?? t.saveFailed));
            return;
        }
        if (element.buildNote) setPreview((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(file); });
        onChange(withValue(values, element.key, sentValue(sent.value, position)));
        if (element.buildNote) {
            // The site shows it only at the next build: the mark and the way back.
            setUndo((kept) => kept ?? { previous: image });
            setResult(buildNoteOf(element, t));
            return;
        }
        setResult(sentNoteOf(t, sent.value));
    };
    const crop = (file: File, verdict: Extract<KitImageVerdict, { ok: true }>) => {
        setFramed('top');
        setCropping({ file, width: verdict.width, height: verdict.height, target: verdict.ratio, url: URL.createObjectURL(file) });
    };
    const choose = async (file: File) => {
        setResult(null);
        const verdict = await ports.checkImage(element.slot, file);
        if (!verdict.ok) {
            setResult(refusalOf(element, t, verdict.message));
            return;
        }
        if (verdict.crop) {
            crop(file, verdict);
            return;
        }
        await send(file);
    };
    const takeBack = () => {
        onChange(withValue(values, element.key, undo?.previous ?? undefined));
        setUndo(null);
        setResult(null);
    };
    return { busy, result, undo, cropping, framed, setFramed, preview, send, choose, takeBack };
}

/** What the thumbnail shows: the file just sent, the image of the slot, or the standard the code carries (F113). */
function shownOf(element: KitImage, image: KitImageValue | null, undo: Undo | null, preview: string | null): { src: string } | null {
    if (undo && preview) return { src: preview };
    if (image) return image;
    return element.standard ? { src: element.standard.src } : null;
}

function thumbClass(element: KitImage): string {
    if (element.square) return element.small ? 'ak-img-thumb square small' : 'ak-img-thumb square';
    return element.wide ? 'ak-img-thumb wide' : 'ak-img-thumb';
}

/** The name of the image's file, without the stamp the store puts before it. */
const fileNameOf = (image: KitImageValue): string | undefined => image.src.split('/').pop()?.replace(/^\d+-/, '');

function SlotLabel({ element, undo, warnings, t }: { element: KitImage; undo: Undo | null; warnings: string[]; t: KitTexts }) {
    const words = element.words;
    const marked = undo && (!element.standard || words);
    return <span className="ak-lb">{element.label}{marked && <Badge tone="new">{words?.newMark ?? t.newMark}</Badge>}{warnings.map((warning) => <Badge key={warning} tone="warn">{warning}</Badge>)}{words && <span className="ak-key">{element.id}</span>}</span>;
}

/** Under the name of an image with a standard: in use, waiting for the build, or the standard's own sentence. */
function standingOf(element: KitImage, image: KitImageValue | null, undo: Undo | null, t: KitTexts): string {
    const words = element.words;
    if (!image) return element.standard!.text;
    return undo ? (words?.pending ?? t.keepsUntilBuild) : (words?.inUse ?? t.inUse);
}

/** An icon with a standard (F113): which image is in use, by its name, and what stands now. */
function StandardNow({ element, image, undo, t }: { element: KitImage; image: KitImageValue | null; undo: Undo | null; t: KitTexts }) {
    const words = element.words;
    if (!element.standard) return null;
    return (
        <span className="ak-img-now">
            {image ? <b>{fileNameOf(image)}{undo && !words && <Badge tone="new">{t.iconNewMark}</Badge>}</b> : <b>{words?.title ?? t.standardTitle}</b>}
            <small>{standingOf(element, image, undo, t)}</small>
        </span>
    );
}

/** The upload button's words: the project's own for the space (the header logo, F122), the icon's, or the image's. */
function uploadLabelOf(element: KitImage, has: boolean, busy: boolean, t: KitTexts): string {
    if (busy) return t.uploading;
    if (element.words) return has ? element.words.replace : element.words.upload;
    if (element.standard) return t.uploadIcon;
    return has ? t.replace : t.upload;
}

function SlotActions({ element, image, undo, busy, t, input, onUndo, onRemove }: {
    element: KitImage; image: KitImageValue | null; undo: Undo | null; busy: boolean; t: KitTexts; input: RefObject<HTMLInputElement | null>; onUndo: () => void; onRemove: () => void;
}) {
    return (
        <span className="ak-img-acts">
            <button type="button" className="ak-btn sm" disabled={busy} onClick={() => input.current?.click()}>
                {uploadLabelOf(element, image !== null, busy, t)}
            </button>
            {undo && <button type="button" className="ak-btn sm" onClick={onUndo}>{t.undo}</button>}
            {image && !undo && <button type="button" className="ak-btn sm danger" onClick={onRemove}>{element.standard ? t.backToStandard : t.removeImage}</button>}
        </span>
    );
}

const CROP_POINTS = ['top', 'center', 'bottom'] as const;
const cropWord = (t: KitTexts, point: CropPoint): string => ({ top: t.cropTop, center: t.cropCenter, bottom: t.cropBottom })[point];

/** «Falta o recorte»: the image is out of the slot's proportion; the three points, and the frame of the one about to be chosen. */
function CropAsk({ cropping, framed, onFrame, onSend, t, language }: { cropping: Cropping; framed: CropPoint; onFrame: (point: CropPoint) => void; onSend: (point: CropPoint) => void; t: KitTexts; language: string }) {
    return (
        <>
            <Notice tone="warn" action={(
                <span className="ak-img-acts">
                    {CROP_POINTS.map((point) => (
                        <button key={point} type="button" className="ak-btn sm" aria-pressed={framed === point}
                            onMouseEnter={() => onFrame(point)} onFocus={() => onFrame(point)} onClick={() => onSend(point)}>
                            {cropWord(t, point)}
                        </button>
                    ))}
                </span>
            )}>{fill(t.cropNeeded, {
                width: cropping.width ?? '?', height: cropping.height ?? '?',
                ratio: cropping.width && cropping.height ? shapeOf(cropping.width, cropping.height, language) : '?',
                target: cropping.target ? `${cropping.target[0]}:${cropping.target[1]}` : '16:10',
            })}</Notice>
            <CropFrame url={cropping.url} width={cropping.width} height={cropping.height} target={cropping.target ?? [16, 10]} point={framed} />
        </>
    );
}

/**
 * The image of a slot (`^pro-case-images`, `^pro-case-image-refused`): the thumbnail, its size and weight, the project's
 * warnings, the rule in one line before choosing, the project's verdict and the result. An image out of the slot's
 * proportion asks for its crop point (Topo, Centro, Base) before it is sent.
 */
export function ImageSlot({ element, values, onChange }: Props<KitImage>) {
    const { ports, language } = useKit();
    const t = ports.texts;
    const input = useRef<HTMLInputElement>(null);
    const image = imageOf(values, element.key);
    const { busy, result, undo, cropping, framed, setFramed, preview, send, choose, takeBack } = useImageUpload(element, values, onChange, image);
    const warnings = image ? ports.describeImage?.(element.slot, image) ?? [] : [];
    const shown = shownOf(element, image, undo, preview);
    return (
        <div className="ak-f">
            <SlotLabel element={element} undo={undo} warnings={warnings} t={t} />
            <div className="ak-img">
                <span className={thumbClass(element)}>
                    {shown ? <img src={shown.src} alt="" style={image?.position ? { objectFit: 'cover', objectPosition: image.position } : undefined} /> : t.noImage}
                </span>
                <StandardNow element={element} image={image} undo={undo} t={t} />
                <SlotActions element={element} image={image} undo={undo} busy={busy} t={t} input={input} onUndo={takeBack} onRemove={() => onChange(withValue(values, element.key, undefined))} />
                <Measure image={image} t={t} />
                {!element.quiet && <span className="ak-img-rule">{ports.imageRule(element.slot)}</span>}
                <input ref={input} type="file" hidden accept="image/png, image/jpeg, image/webp" onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (file) void choose(file);
                }} />
            </div>
            <div aria-live="polite">
                {cropping && <CropAsk cropping={cropping} framed={framed} onFrame={setFramed} onSend={(point) => void send(cropping.file, point)} t={t} language={language} />}
                {result && <Notice tone={result.tone}>{result.text}</Notice>}
            </div>
        </div>
    );
}

/** The image's size and weight, when the project measured it. */
function Measure({ image, t }: { image: KitImageValue | null; t: KitTexts }) {
    if (!image?.width || !image.height) return null;
    return <span className="ak-hint">{fill(t.measure, { width: image.width, height: image.height, size: sizeOf(image.bytes) })}</span>;
}
