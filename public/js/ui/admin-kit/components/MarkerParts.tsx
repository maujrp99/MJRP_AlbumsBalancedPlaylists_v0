// cópia carimbada do kit do admin do MJRP Harness · admin-kit v0.9.0 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
"use client";

/**
 * The marker's pieces on the screen (F127, S-153; `^cms-company-where`, `^cms-company-changed`, `^cms-company-marker`,
 * `^cms-company-literal`; the approved CMS v29): beside the field of the value, the list of every place that carries it,
 * grouped, following what the author types; under each phrase that can carry it, the button that puts the token in, the line
 * that shows the phrase as the site has it, and the notice when the value is typed by hand.
 */
import { Fragment, useState, type ReactNode } from 'react';
import { fill } from '../ports';
import { excerpt, firstWord, followsValue, groupPlaces, hasLiteral, markerNames, markerPlaces, markerValue } from '../marker';
import { useKit } from './context';

/** The phrase with the token swapped for the value, the value in bold: what the site shows, and where the name is. */
function Phrase({ text, token, value }: { text: string; token: string; value: string }): ReactNode {
    const parts = text.split(token);
    return <>{parts.map((part, index) => <Fragment key={index}>{index > 0 && (value ? <strong>{value}</strong> : token)}{part}</Fragment>)}</>;
}

/** «Onde o nome aparece · N trechos»: the places grouped by section, four groups and «Ver os outros N». */
export function MarkerWhere() {
    const { schema, ports, all = {}, language, go } = useKit();
    const [open, setOpen] = useState(false);
    const marker = schema.marker;
    const t = ports.texts.marker;
    if (!marker || !t) return null;
    const value = markerValue(schema, all, language);
    const places = markerPlaces(schema, all, language);
    const groups = groupPlaces(places);
    const shown = open ? groups : groups.slice(0, 4);
    const left = groups.slice(4).reduce((sum, entry) => sum + entry.places.length, 0);
    return (
        <aside className="ak-where ak-mk-where" aria-live="polite" aria-label={t.where}>
            <header><b>{t.where}</b><span>{fill(places.length === 1 ? t.countOne : t.count, { count: places.length })}</span></header>
            {shown.map((entry) => (
                <div className="ak-mk-g" key={entry.group}>
                    <p>{entry.group}</p>
                    {entry.places.map((place) => {
                        const body = (
                            <>
                                <span>{place.phrase ? <Phrase text={excerpt(place.phrase, marker.token)} token={marker.token} value={value} /> : <strong>{place.highlight ?? value}</strong>}</span>
                                <i>{place.name}</i>
                            </>
                        );
                        if (!place.go) return <span className="ak-mk-p" key={`${place.group}-${place.name}`}>{body}</span>;
                        const { path, itemId, block } = place.go;
                        return (
                            <a key={`${path}-${itemId ?? ''}-${block}-${place.name}`} className="ak-mk-p" href={`${ports.hrefOf(path, itemId)}#blk-${block}`}
                                aria-label={fill(t.goTo, { name: place.name })}
                                onClick={(event) => { event.preventDefault(); go(path, itemId, `blk-${block}`); }}>{body}</a>
                        );
                    })}
                </div>
            ))}
            {left > 0 && <button type="button" className="ak-mk-more" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? t.less : fill(t.more, { count: left })}</button>}
        </aside>
    );
}

/** The hint under the value's field: how many places change with it, and the word the box at the top takes. */
export function MarkerHint() {
    const { schema, ports, all = {}, language } = useKit();
    const marker = schema.marker;
    const t = ports.texts.marker;
    if (!marker || !t) return null;
    const count = markerPlaces(schema, all, language).length;
    return (
        <>
            <span className="ak-hint">{fill(t.hint, { count })}</span>
            {followsValue(marker, schema, all) && <span className="ak-hint">{fill(t.first, { word: firstWord(markerValue(schema, all, language)) })}</span>}
        </>
    );
}

/** Under a phrase that can carry the value: the button, the line «No site» and, when the name is typed by hand, the notice. */
export function PhraseTools({ text, lang, onInsert, onFix }: { text: string; lang: string; onInsert: () => void; onFix: (names: string[]) => void }) {
    const { schema, ports, all = {}, saved = {} } = useKit();
    const marker = schema.marker;
    const t = ports.texts.marker;
    if (!marker || !t) return null;
    const value = markerValue(schema, all, lang);
    const names = markerNames(schema, all, saved);
    const literal = text.trim() !== '' && hasLiteral(text, names);
    return (
        <>
            <div className="ak-mk-tools">
                <button type="button" className="ak-mk-ins" onClick={onInsert}>{t.insert} <b>{marker.token}</b></button>
                <span className="ak-hint">{t.insertHint}</span>
            </div>
            {text.trim() !== '' && (
                <p className="ak-mk-prev" data-marker-preview=""><small>{t.preview}</small><Phrase text={text} token={marker.token} value={value} /></p>
            )}
            {literal && (
                <div className="ak-notice warn" role="status" data-marker-literal="">
                    <span><b>{t.literal}</b> {t.literalWhy}</span>
                    <button type="button" className="ak-btn" onClick={() => onFix(names)}>{fill(t.fix, { token: marker.token })}</button>
                </div>
            )}
        </>
    );
}
