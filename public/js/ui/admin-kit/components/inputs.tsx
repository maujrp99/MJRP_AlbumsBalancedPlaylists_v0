// cópia carimbada do kit do admin do MJRP Harness · admin-kit v0.9.0 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
"use client";

/**
 * A field, a flag, a choice and an image slot: each edits one value of the scope it is given and hands back the new scope.
 */
import { useEffect, useId, useRef, useState } from 'react';
import type { KitChoice, KitField, KitFlag, KitImage } from '../schema';
import { fill } from '../ports';
import { imageOf, pairText, stateOf, textOf, withPairText, withText, withValue, type KitImageValue, type KitValues } from '../values';
import { Badge, Notice } from './bits';
import { TextField, type TextFieldKind } from './TextField';
import type { RichFieldPorts } from './RichTextField';
import { RICH_TEXTS_EN } from '../rich/tools';
import { fieldAnchor, problemsAt, useKit } from './context';
import { RequiredMessage, RequiredName } from './Required';
import { MarkerHint, MarkerWhere, PhraseTools } from './MarkerParts';
import { insertToken, withToken } from '../marker';

interface Props<E> {
    element: E;
    values: KitValues;
    onChange: (next: KitValues) => void;
    at: string[];
}

export function FieldInput({ element, values, onChange, at }: Props<KitField>) {
    const { schema, language, ports, problems } = useKit();
    const id = useId();
    // O campo da frase (F127): o botão do marcador põe o marcador onde está o cursor.
    const box = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
    const main = schema.languages[0];
    // Onde mora o texto de cada idioma (F135, REQ-01): um par de chaves soltas (`synopsis`/`synopsis_en`), um valor só, um idioma fixo ou um por idioma.
    const pair = element.pair;
    const single = !pair && element.single === true;
    const languages = pair ? Object.keys(pair) : single ? [main] : element.language ? [element.language] : [...schema.languages];
    const read = (code: string) => pair ? pairText(values, pair, code) : single ? (typeof values[element.key] === 'string' ? (values[element.key] as string) : '') : textOf(values, element.key, code);
    const write = (code: string, text: string): KitValues => pair ? withPairText(values, pair, code, text) : withText(values, element.key, single ? null : code, text, schema.editedState);
    const lang = single ? null : element.language ?? language;
    const text = read(lang ?? main);
    const state = stateOf(values, element.key);
    const mine = problemsAt(problems, [...at, element.key]).filter((problem) => !problem.language || problem.language === (element.language ?? language));
    const over = element.limit !== undefined && text.length > element.limit;
    // O que o campo é: curto, link e número são simples; o longo é rico, e simples quando tem limite de caracteres ou leva o marcador no cursor (F135).
    const marker = schema.marker;
    const markerTexts = ports.texts.marker;
    const source = Boolean(marker && markerTexts && element.id === marker.key);
    const phrase = Boolean(marker && markerTexts && element.marked && (element.type === 'short' || element.type === 'long') && lang !== null);
    const kind: TextFieldKind = element.type === 'short' ? 'short' : element.type === 'link' ? 'link' : element.type === 'number' ? 'number'
        : element.type === 'long' && element.limit !== undefined ? 'plain' : 'rich';
    const [shown, setShown] = useState(language);
    const putToken = () => {
        const code = shown;
        const now = read(code);
        const field = box.current;
        // Na caixa simples o marcador entra onde está o cursor; no texto rico, no fim, que a caixa editável não dá a posição.
        const put = kind === 'rich' ? { text: `${now}${now && !/\s$/.test(now) ? ' ' : ''}${marker!.token}`, caret: -1 } : insertToken(now, field?.selectionStart ?? now.length, field?.selectionEnd ?? now.length, marker!.token);
        onChange(write(code, put.text));
        if (put.caret >= 0) requestAnimationFrame(() => { field?.focus(); field?.setSelectionRange(put.caret, put.caret); });
    };
    const fixHand = (names: string[]) => onChange(write(shown, withToken(read(shown), names, marker!.token)));
    // The rich field (F128): the project's slot for the images of a text, its shelf and its pages, through the ports.
    const slot = ports.richText?.imageSlot;
    const richPorts: RichFieldPorts = {
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
    // A tradução do campo (F96): só onde há uma versão por idioma e texto, e o projeto entregou a porta e as palavras.
    const translate = languages.length > 1 && ports.translate && ports.texts.translate ? { run: ports.translate, t: ports.texts.translate } : undefined;
    // A frase de um idioma que ainda não tem tradução diz isso no próprio campo.
    const untranslatedIn = (code: string) => code !== main && !read(code).trim() && read(main).trim() !== '';
    const placeholder = Object.fromEntries(languages.map((code) => [code, untranslatedIn(code) ? ports.texts.untranslated : element.placeholder ?? '']));
    // The required one left empty, in the language on the screen (F125; the kit v1 piece): red border and the sentence under it.
    const required = ports.texts.required;
    const missing = mine.some((problem) => problem.code === 'required');
    const missingId = missing ? `${id}-missing` : undefined;
    const field = (
        <div className={missing && required ? 'ak-f rq-bad' : 'ak-f'} id={fieldAnchor([...at, element.key], element.language)} data-pin={element.language ? '' : undefined}>
            <TextField id={id} kind={kind} languages={languages} showing={lang ?? main} onOpen={setShown} values={Object.fromEntries(languages.map((code) => [code, read(code)]))}
                label={(
                    <>
                        {/* O obrigatório leva * preso à última palavra do nome (F125; UAT-262). */}
                        <RequiredName text={element.label} required={element.required} />
                        {element.badge && <Badge tone="warn">{element.badge}</Badge>}
                        {state && schema.states[state] && <Badge tone={schema.states[state].tone}>{schema.states[state].label}</Badge>}
                    </>
                )}
                labelText={element.label} keyName={element.quiet ? undefined : element.id} required={element.required} invalid={mine.length > 0 || over}
                limit={element.limit} placeholder={placeholder} hint={element.hint} inputRef={box} describedBy={missingId} bare
                below={missing && required ? <RequiredMessage id={missingId} english={(mine.find((problem) => problem.code === 'required')?.language ?? lang) === 'en'} t={required} /> : undefined}
                rich={{ ports: richPorts, texts: ports.texts.rich ?? RICH_TEXTS_EN }} translate={translate}
                words={ports.texts.paragraphsHint ? { paragraphs: ports.texts.paragraphsHint, plain: ports.texts.paragraphsHint } : undefined}
                onChange={(code, next) => onChange(write(code, next))} />
            {lang !== null && untranslatedIn(lang) && <span className="ak-hint">{ports.texts.untranslated}</span>}
            {source && <MarkerHint />}
            {phrase && <PhraseTools text={read(shown)} lang={shown} onInsert={putToken} onFix={fixHand} />}
            {mine.map((problem) => problem.code === 'required' && required
                ? null
                : <span key={problem.code} className="ak-err-t">{fill(ports.texts.problems[problem.code] ?? problem.code, { limit: problem.limit ?? '' })}</span>)}
        </div>
    );
    if (source) return <div className="ak-split">{field}<MarkerWhere /></div>;
    if (!element.where?.length) return field;
    return (
        <div className="ak-split">
            {field}
            <aside className="ak-where" aria-live="polite">
                <b>{ports.texts.whereItShows}</b>
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
            {/* eslint-disable-next-line @next/next/no-img-element -- o kit não importa o Next (ADR-0011): a prévia vem do arquivo escolhido */}
            <img src={url} alt="" />
            <i style={tall ? { left: 0, right: 0, height: `${keep}%`, top: `${at}%` } : { top: 0, bottom: 0, width: `${keep}%`, left: `${at}%` }} />
        </div>
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
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<{ tone: 'ok' | 'err' | 'info'; text: string } | null>(null);
    // The image the upload replaced, kept while the author can still take it back (the Harness site, F101).
    const [undo, setUndo] = useState<{ previous: KitImageValue | null } | null>(null);
    const [cropping, setCropping] = useState<{ file: File; width?: number; height?: number; target?: readonly [number, number]; url: string } | null>(null);
    // The crop point the frame shows: the one under the pointer or the focus, «Topo» to begin (UAT-154).
    const [framed, setFramed] = useState<'top' | 'center' | 'bottom'>('top');
    useEffect(() => () => { if (cropping) URL.revokeObjectURL(cropping.url); }, [cropping]);
    // The file just sent, shown from the browser while the site does not carry it yet: the address of an image sent is only served after the next build.
    const [preview, setPreview] = useState<string | null>(null);
    const image = imageOf(values, element.key);
    const warnings = image ? ports.describeImage?.(element.slot, image) ?? [] : [];
    // An icon with a standard (F113): the thumbnail shows the image the code carries until one is sent, and says which is in use.
    const standard = element.standard;
    // The project's own words for the image space (the header logo, F122); without them, the tab icon's, from the ports.
    const words = element.words;
    const shown = undo && preview ? { src: preview } : image ?? (standard ? { src: standard.src } : null);
    const fileName = image ? image.src.split('/').pop()?.replace(/^\d+-/, '') : undefined;
    const send = async (file: File, position?: 'top' | 'center' | 'bottom') => {
        setBusy(true);
        setResult(null);
        setCropping(null);
        const sent = await ports.uploadImage(element.slot, file);
        setBusy(false);
        if (!sent.ok) {
            setResult({ tone: 'err', text: [t.notSent, sent.message ?? t.saveFailed, element.standard ? (words?.stays ?? t.iconStays) : ''].filter(Boolean).join(' ') });
            return;
        }
        const { src, width, height, bytes } = sent.value;
        if (element.buildNote) setPreview((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(file); });
        onChange(withValue(values, element.key, { src, ...(width ? { width } : {}), ...(height ? { height } : {}), ...(bytes ? { bytes } : {}), ...(position ? { position } : {}) }));
        if (element.buildNote) {
            // The site shows it only at the next build: the mark and the way back, and for an icon the sentence of the v18.
            setUndo((kept) => kept ?? { previous: image });
            setResult(words ? { tone: 'info', text: words.sentNote } : element.square ? { tone: 'ok', text: t.sentBuild } : null);
            return;
        }
        setResult({ tone: 'ok', text: [t.sent, width && height ? fill(t.measure, { width, height, size: sizeOf(bytes) }) : '', t.sentNext].filter(Boolean).join(' ') });
    };
    const choose = async (file: File) => {
        setResult(null);
        const verdict = await ports.checkImage(element.slot, file);
        if (!verdict.ok) {
            setResult({ tone: 'err', text: [t.notSent, verdict.message, element.standard ? (words?.stays ?? t.iconStays) : ''].filter(Boolean).join(' ') });
            return;
        }
        if (verdict.crop) {
            setFramed('top');
            setCropping({ file, width: verdict.width, height: verdict.height, target: verdict.ratio, url: URL.createObjectURL(file) });
            return;
        }
        await send(file);
    };
    return (
        <div className="ak-f">
            <span className="ak-lb">{element.label}{undo && (!standard || words) && <Badge tone="new">{words?.newMark ?? t.newMark}</Badge>}{warnings.map((warning) => <Badge key={warning} tone="warn">{warning}</Badge>)}{words && <span className="ak-key">{element.id}</span>}</span>
            <div className="ak-img">
                <span className={element.square ? (element.small ? 'ak-img-thumb square small' : 'ak-img-thumb square') : element.wide ? 'ak-img-thumb wide' : 'ak-img-thumb'}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- o kit não importa o Next (ADR-0011): a miniatura do envio é uma imagem simples */}
                    {shown ? <img src={shown.src} alt="" style={image?.position ? { objectFit: 'cover', objectPosition: image.position } : undefined} /> : t.noImage}
                </span>
                {standard && (
                    <span className="ak-img-now">
                        {image ? <b>{fileName}{undo && !words && <Badge tone="new">{t.iconNewMark}</Badge>}</b> : <b>{words?.title ?? t.standardTitle}</b>}
                        <small>{image ? (undo ? (words?.pending ?? t.keepsUntilBuild) : (words?.inUse ?? t.inUse)) : standard.text}</small>
                    </span>
                )}
                <span className="ak-img-acts">
                    <button type="button" className="ak-btn sm" disabled={busy} onClick={() => input.current?.click()}>
                        {busy ? t.uploading : words ? (image ? words.replace : words.upload) : standard ? t.uploadIcon : image ? t.replace : t.upload}
                    </button>
                    {undo && <button type="button" className="ak-btn sm" onClick={() => { onChange(withValue(values, element.key, undo.previous ?? undefined)); setUndo(null); setResult(null); }}>{t.undo}</button>}
                    {image && !undo && <button type="button" className="ak-btn sm danger" onClick={() => onChange(withValue(values, element.key, undefined))}>{standard ? t.backToStandard : t.removeImage}</button>}
                </span>
                {image?.width && image.height ? <span className="ak-hint">{fill(t.measure, { width: image.width, height: image.height, size: sizeOf(image.bytes) })}</span> : null}
                {!element.quiet && <span className="ak-img-rule">{ports.imageRule(element.slot)}</span>}
                <input ref={input} type="file" hidden accept="image/png, image/jpeg, image/webp" onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (file) void choose(file);
                }} />
            </div>
            <div aria-live="polite">
                {cropping && (
                    <>
                        <Notice tone="warn" action={(
                            <span className="ak-img-acts">
                                {(['top', 'center', 'bottom'] as const).map((point) => (
                                    <button key={point} type="button" className="ak-btn sm" aria-pressed={framed === point}
                                        onMouseEnter={() => setFramed(point)} onFocus={() => setFramed(point)} onClick={() => void send(cropping.file, point)}>
                                        {point === 'top' ? t.cropTop : point === 'center' ? t.cropCenter : t.cropBottom}
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
                )}
                {result && <Notice tone={result.tone}>{result.text}</Notice>}
            </div>
        </div>
    );
}
