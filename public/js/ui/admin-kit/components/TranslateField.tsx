// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
"use client";

/**
 * A peça de traduzir de um campo (F96, S-128; `^translate-offered` … `^translate-failed`): o botão com a direção clara, a
 * espera, a revisão abaixo do campo (o original acima da sugestão editável) e a falha com o motivo. Recebe tudo por props,
 * sem `useKit`, para servir também ao editor do Jardim, que ainda não usa o kit (ADR-0011, item 5).
 *
 * A sugestão vive aqui, fora do conteúdo: só `onAccept` a leva ao campo, e descartar, trocar de idioma ou desmontar a
 * peça não deixam nada nele (R4). `onReview` avisa a quem salva que há uma sugestão sem revisão.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { fill, type KitResult, type KitTranslateTexts } from '../ports';
import { translationRoute } from '../values';

type Phase =
    | { step: 'idle' }
    | { step: 'busy' }
    | { step: 'review'; from: string; source: string; suggestion: string }
    | { step: 'failed'; reason: string };

export interface TranslateFieldProps {
    /** The field's text in each language, as it is now. */
    texts: Record<string, string>;
    languages: readonly string[];
    /** The language open on the screen: the target of the translation. */
    onScreen: string;
    /** The field's limit of characters; the suggestion past it cannot be accepted. */
    limit?: number;
    translate: (text: string, target: string) => Promise<KitResult<string>>;
    t: KitTranslateTexts;
    /** The suggestion the author accepted, as edited: the only way it reaches the content. */
    onAccept: (text: string) => void;
    /** Tells who saves that a suggestion waits for review (`open`) or no longer does; `id` names the field. Keep it stable. */
    reviewId?: string;
    onReview?: (id: string, open: boolean) => void;
}

/** Why the translation failed, in the project's words: the session, the service's credit, or the service not answering. */
function reasonOf(result: Extract<KitResult<string>, { ok: false }>, t: KitTranslateTexts): string {
    if (result.failure === 'session-expired') return t.reasons.session;
    return result.message === 'credit' ? t.reasons.credit : t.reasons.service;
}

/** The review under the field: the original above the suggestion, which the author edits before accepting it. */
function Review({ phase, id, t, limit, replaces, name, target, onEdit, onAgain, onDiscard, onAccept }: {
    phase: Extract<Phase, { step: 'review' }>; id: string; t: KitTranslateTexts; limit?: number; replaces: boolean; name: (language: string) => string; target: string;
    onEdit: (suggestion: string) => void; onAgain: () => void; onDiscard: () => void; onAccept: () => void;
}) {
    const over = limit !== undefined && phase.suggestion.length > limit;
    return (
        <div className="ak-tr-rev" role="group" aria-label={t.review}>
            <div className="ak-tr-src">
                <span className="ak-tr-lb">{fill(t.original, { language: name(phase.from) })}</span>
                <p>{phase.source}</p>
            </div>
            <div className="ak-f">
                <label className="ak-tr-lb" htmlFor={id}>{fill(t.suggestion, { language: name(target) })}</label>
                {/* campo-proprio: a sugestão da tradução, para revisar antes de aceitar */}
                <textarea id={id} className="ak-input ak-tr-sug" value={phase.suggestion} aria-invalid={over}
                    onChange={(event) => onEdit(event.target.value)} />
            </div>
            <div className="ak-tr-foot">
                {replaces && <span className="ak-tr-swap">{t.replaces}</span>}
                {limit !== undefined && <span className={over ? 'ak-count over' : 'ak-count'}>{phase.suggestion.length} / {limit}</span>}
                {over && <span className="ak-err-t ak-tr-over">{fill(t.overLimit, { count: phase.suggestion.length - limit })}</span>}
                <span className="ak-tr-acts">
                    <button type="button" className="ak-btn sm" onClick={onAgain}>{t.again}</button>
                    <button type="button" className="ak-btn sm" onClick={onDiscard}>{t.discard}</button>
                    <button type="button" className="ak-btn sm pri" disabled={over} onClick={onAccept}>{t.accept}</button>
                </span>
            </div>
        </div>
    );
}

export function TranslateField({ texts, languages, onScreen, limit, translate, t, onAccept, reviewId = '', onReview }: TranslateFieldProps) {
    const [phase, setPhase] = useState<Phase>({ step: 'idle' });
    const id = useId();
    const asked = useRef(0);
    const route = translationRoute(texts, languages, onScreen);
    const current = (texts[onScreen] ?? '').trim() !== '';
    const name = (language: string) => t.languages[language] ?? language;
    const reviewing = phase.step === 'review';

    useEffect(() => {
        onReview?.(reviewId, reviewing);
        return () => onReview?.(reviewId, false);
    }, [reviewing, reviewId, onReview]);

    const ask = async () => {
        if (!route) return;
        const turn = ++asked.current;
        const source = texts[route.from] ?? '';
        setPhase({ step: 'busy' });
        const result = await translate(source, route.to);
        if (turn !== asked.current) return;
        if (!result.ok) {
            setPhase({ step: 'failed', reason: reasonOf(result, t) });
            return;
        }
        setPhase({ step: 'review', from: route.from, source, suggestion: result.value });
    };
    const close = () => {
        asked.current++;
        setPhase({ step: 'idle' });
    };

    if (phase.step === 'review') {
        return (
            <Review phase={phase} id={id} t={t} limit={limit} replaces={current} name={name} target={onScreen}
                onEdit={(suggestion) => setPhase({ ...phase, suggestion })} onAgain={() => void ask()} onDiscard={close} onAccept={() => { onAccept(phase.suggestion); close(); }} />
        );
    }
    return (
        <div className="ak-tr" aria-live="polite">
            {phase.step === 'busy'
                ? <button type="button" className="ak-tr-btn" disabled><i className="ak-tr-spin" aria-hidden="true" />{t.busy}</button>
                : route
                    ? <button type="button" className="ak-tr-btn" onClick={() => void ask()}>{fill(t.from, { language: name(route.from) })}</button>
                    : <span className="ak-hint">{fill(t.nothing, { language: languages.filter((language) => language !== onScreen).map(name).join(' / ') })}</span>}
            {phase.step === 'failed' && (
                <div className="ak-tr-fail" role="alert">
                    <span>{fill(t.failed, { reason: phase.reason })}</span>
                    <button type="button" className="ak-btn sm" onClick={() => void ask()}>{t.retry}</button>
                </div>
            )}
        </div>
    );
}
