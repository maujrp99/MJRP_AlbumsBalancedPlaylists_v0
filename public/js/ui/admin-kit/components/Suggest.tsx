// cópia carimbada do kit do admin do MJRP Harness · admin-kit v0.9.0 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
"use client";

/**
 * «Propor, escolher, aplicar» (F134, S-160; `^cms-book-category-suggest`, `design-system.md`): a peça do kit que serve às duas
 * telas que pedem uma proposta e deixam o autor decidir: o botão que a pede (`SuggestAsk`), o quadro da resposta (`Suggest`) e a
 * marca do campo que a recebeu, com «Antes: …» e «Desfazer» (`SuggestWas`). Recebe tudo por props, sem `useKit`: os textos são
 * de quem usa, e a peça nunca chama um serviço nem grava um campo. Nada muda no campo sem o clique em «Aplicar» (ou em «Usar»).
 *
 * O quadro tem quatro formas: espera (`busy`), várias propostas para escolher uma (`pick`, nenhuma vem marcada), uma proposta
 * para conferir e usar (`one`) e um aviso (`note`). Para uma proposta nova, quem usa troca a `key` do quadro: a escolha da
 * anterior não passa para ela.
 */
import { useId, useState, type ReactNode } from 'react';

export interface SuggestOption {
    /** A linha de cima: a categoria, ou o texto da proposta. */
    main: string;
    /** A de baixo (a subcategoria); sem ela, a opção é um texto só. */
    sub?: string;
    /** O porquê, numa linha. */
    why?: string;
}

interface Head {
    /** A etiqueta da fonte («IA», «Google Books»). */
    badge?: string;
    /** O que a fonte trouxe («3 sugestões dos mapas»). */
    source?: string;
    title: string;
}

export type SuggestState =
    | { step: 'idle' }
    | { step: 'busy'; text: string }
    | (Head & {
        step: 'pick';
        /** O que está hoje no campo, para ver o que troca (`<s>` marca o valor). */
        now?: ReactNode;
        options: readonly SuggestOption[];
        apply: string;
        /** A dica sem escolha, e a dica com ela; os padrões são os de `SuggestTexts`. */
        hintNone?: string;
        hintChosen?: string;
        onApply: (option: SuggestOption, index: number) => void;
        onDiscard: () => void;
    })
    | (Head & {
        step: 'one';
        text: string;
        meta?: ReactNode;
        apply: string;
        hint?: string;
        onApply: (text: string) => void;
        onDiscard: () => void;
    })
    | {
        step: 'note';
        tone: 'warn' | 'err' | 'note';
        message: ReactNode;
        /** O botão de tentar de novo; sem ele, o aviso só fecha. */
        retry?: string;
        onRetry?: () => void;
        onClose: () => void;
    };

export interface SuggestTexts {
    discard: string;
    close: string;
    /** «Escolha uma para aplicar.» */
    hintNone: string;
    /** «Troca o que está no campo.» */
    hintChosen: string;
}

const Header = ({ head, id, now }: { head: Head; id: string; now?: ReactNode }) => (
    <div className="ak-sg-h">
        <span className="ak-sg-src">{head.badge && <i>{head.badge}</i>}{head.source}</span>
        <b id={id}>{head.title}</b>
        {now && <span className="ak-sg-now">{now}</span>}
    </div>
);

/** Quando o quadro espera: o giro, a frase do que está sendo feito e uma linha fantasma onde a resposta vai chegar. */
export function SuggestBusy({ text }: { text: string }) {
    return (
        <div className="ak-sg is-note" role="status" aria-live="polite">
            <div className="ak-sg-busy"><span className="ak-sg-spin" aria-hidden="true" /><span>{text}</span></div>
            <div className="ak-sg-ghost" aria-hidden="true" />
        </div>
    );
}

/** Várias propostas, uma escolhida por vez. «Aplicar» só acende com uma escolhida, e nenhuma vem marcada. */
export function SuggestPick({ state, t }: { state: Extract<SuggestState, { step: 'pick' }>; t: SuggestTexts }) {
    const id = useId();
    const [chosen, setChosen] = useState<number | null>(null);
    return (
        <div className="ak-sg" role="group" aria-labelledby={id}>
            <Header head={state} id={id} now={state.now} />
            <fieldset className="ak-sg-list" role="radiogroup" aria-labelledby={id}>
                {state.options.map((option, index) => (
                    <label key={index} className={`ak-sg-opt${option.sub ? '' : ' txt'}`}>
                        <input type="radio" name={`${id}-r`} value={index} checked={chosen === index} onChange={() => setChosen(index)} />
                        <span className="ak-sg-main">{option.main}</span>
                        {option.sub && <span className="ak-sg-sub">{option.sub}</span>}
                        {option.why && <small className="ak-sg-why">{option.why}</small>}
                        <span className="ak-sg-n" aria-hidden="true">{index + 1}</span>
                    </label>
                ))}
            </fieldset>
            <div className="ak-sg-f">
                <button type="button" className="ak-sg-btn pri" disabled={chosen === null} onClick={() => chosen !== null && state.onApply(state.options[chosen], chosen)}>{state.apply}</button>
                <button type="button" className="ak-sg-btn" onClick={state.onDiscard}>{t.discard}</button>
                <small className="ak-sg-hint" aria-live="polite">{chosen === null ? (state.hintNone ?? t.hintNone) : (state.hintChosen ?? t.hintChosen)}</small>
            </div>
        </div>
    );
}

/** Uma proposta só, para conferir: o texto, de onde veio e «Usar». */
export function SuggestOne({ state, t }: { state: Extract<SuggestState, { step: 'one' }>; t: SuggestTexts }) {
    const id = useId();
    return (
        <div className="ak-sg" role="group" aria-labelledby={id}>
            <Header head={state} id={id} />
            <blockquote className="ak-sg-one">{state.text}</blockquote>
            {state.meta && <span className="ak-sg-one-meta">{state.meta}</span>}
            <div className="ak-sg-f">
                <button type="button" className="ak-sg-btn pri" onClick={() => state.onApply(state.text)}>{state.apply}</button>
                <button type="button" className="ak-sg-btn" onClick={state.onDiscard}>{t.discard}</button>
                {state.hint && <small className="ak-sg-hint">{state.hint}</small>}
            </div>
        </div>
    );
}

/** O aviso: não achou, a cota acabou, a IA não respondeu. O vermelho é `alert`; o resto, `status`. */
export function SuggestNote({ state, t }: { state: Extract<SuggestState, { step: 'note' }>; t: SuggestTexts }) {
    return (
        <div className={`ak-sg is-${state.tone}`} role={state.tone === 'err' ? 'alert' : 'status'}>
            <p className="ak-sg-msg">{state.message}</p>
            {state.retry && (
                <div className="ak-sg-f">
                    <button type="button" className="ak-sg-btn" onClick={state.onRetry}>{state.retry}</button>
                    <button type="button" className="ak-sg-btn" onClick={state.onClose}>{t.close}</button>
                </div>
            )}
        </div>
    );
}

/** O quadro da proposta, pela forma que o estado pede; `idle` não desenha nada. */
export function Suggest({ state, t }: { state: SuggestState; t: SuggestTexts }) {
    switch (state.step) {
        case 'busy': return <SuggestBusy text={state.text} />;
        case 'pick': return <SuggestPick state={state} t={t} />;
        case 'one': return <SuggestOne state={state} t={t} />;
        case 'note': return <SuggestNote state={state} t={t} />;
        default: return null;
    }
}

export interface SuggestAskProps {
    /** O que o botão diz parado: «Buscar sinopse». */
    label: string;
    /** E enquanto espera: «Buscando…». */
    busyLabel: string;
    /** Depois de uma resposta: «Buscar de novo». */
    againLabel?: string;
    /** Um sinal curto antes do rótulo (⌕, ✦). */
    icon?: string;
    busy: boolean;
    /** Já houve uma resposta: o botão diz `againLabel`. */
    asked?: boolean;
    /** A linha ao lado, que diz o que o botão faz e que nada muda sem o clique. */
    hint: string;
    onAsk: () => void;
}

/** O botão que pede a proposta, ao lado do campo, com a linha que diz o que ele faz. */
export function SuggestAsk({ label, busyLabel, againLabel, icon, busy, asked, hint, onAsk }: SuggestAskProps) {
    return (
        <div className="ak-sg-ask">
            <button type="button" className="ak-sg-btn" data-ico={icon} disabled={busy} aria-busy={busy || undefined} onClick={onAsk}>
                {busy ? busyLabel : asked && againLabel ? againLabel : label}
            </button>
            <span className="ak-hint">{hint}</span>
        </div>
    );
}

export interface SuggestWasProps {
    /** «Do Google Books. Antes: vazia.» / «Aplicada da sugestão. Antes: …» */
    children: ReactNode;
    undo: string;
    onUndo: () => void;
}

/** A linha sob o campo que acabou de receber a proposta: o que tinha antes e «Desfazer». */
export function SuggestWas({ children, undo, onUndo }: SuggestWasProps) {
    return (
        <span className="ak-sg-was">
            <span>{children}</span>
            <button type="button" onClick={onUndo}>{undo}</button>
        </span>
    );
}
