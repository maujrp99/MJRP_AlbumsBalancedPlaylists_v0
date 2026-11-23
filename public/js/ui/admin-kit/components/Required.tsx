// cópia carimbada do kit do admin do MJRP Harness · admin-kit v0.9.0 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
/**
 * O obrigatório (F125, S-151; a peça do kit v1, aprovada pelo MJRP em 2026-11-17: o CMS profissional v30 e o CMS do Jardim v30,
 * `design/prototypes/assets/cms/required-v1.css`), nos dois CMS: o nome do campo com o * preso à última palavra, a legenda no
 * topo da tela e o aviso de quem tenta salvar com um obrigatório vazio, com um botão por campo que leva até ele.
 *
 * Só React e a pele do kit (`required.css`): o CMS do Jardim usa as mesmas peças, com as palavras dele.
 */
import type { MouseEvent } from 'react';

/** As palavras da peça, que cada projeto entrega (o kit pelas `KitTexts`, o Jardim pelas dele). */
export interface RequiredTexts {
    /** «obrigatório: não salva vazio», depois do *. */
    legend: string;
    /** «Os outros, vazios, somem do site com o que depende deles». */
    rest: string;
    /** «Falta preencher:». */
    missing: string;
    /** «Nada foi gravado.». */
    nothingSaved: string;
    /** A frase no campo que falta: «Obrigatório: sem este texto, o site não mostra esta parte.». */
    field: string;
    /** A mesma, quando falta o inglês. */
    fieldEn: string;
    /** «Não salvou»: o estado de salvar depois da recusa. */
    notSaved: string;
}

/** The piece's words in English (F332): the kit's code speaks English; a project in another language hands its own. */
export const REQUIRED_TEXTS_EN: RequiredTexts = {
    legend: 'required: does not save empty',
    rest: 'The others, left empty, leave the site with what depends on them',
    missing: 'Still to fill in:',
    nothingSaved: 'Nothing was saved.',
    field: 'Required: without this text, the site does not show this part.',
    fieldEn: 'Required: without the English text, the site does not show this part in English.',
    notSaved: 'Not saved',
};

/** O nome do campo; com `required`, o * vai preso à última palavra e nunca cai sozinho na linha de baixo (UAT-262). */
export function RequiredName({ text, required, markClass = 'ak-req' }: { text: string; required?: boolean; markClass?: string }) {
    if (!required) return <>{text}</>;
    const at = text.lastIndexOf(' ');
    return (
        <span className="rq-name">
            {text.slice(0, at + 1)}
            <span className="rq-last">{text.slice(at + 1)}<span className={markClass} aria-hidden="true">*</span></span>
        </span>
    );
}

/** A legenda no topo da tela que tem obrigatório: o que o * quer dizer, e o que acontece com o resto. */
export function RequiredLegend({ t }: { t: Pick<RequiredTexts, 'legend' | 'rest'> }) {
    return <p className="rq-legend"><span><b>*</b> {t.legend}</span><span>{t.rest}</span></p>;
}

/** Um obrigatório que falta, no aviso: o nome que o autor vê, o idioma (quando o campo tem um por idioma) e para onde leva. */
export interface MissingItem {
    id: string;
    label: string;
    lang?: string;
}

/** «Falta preencher: …. Nada foi gravado.», com um botão por campo; o clique leva ao campo, no idioma dele. */
export function MissingNotice({ items, t, onGo }: { items: MissingItem[]; t: Pick<RequiredTexts, 'missing' | 'nothingSaved'>; onGo: (item: MissingItem) => void }) {
    if (!items.length) return null;
    const named = (item: MissingItem) => (item.lang && item.lang !== 'pt' ? `${item.label} (${item.lang.toUpperCase()})` : item.label);
    return (
        <div className="rq-miss" role="alert">
            <p><b>{t.missing}</b> {items.map(named).join(', ')}. <b>{t.nothingSaved}</b></p>
            <ul>
                {items.map((item) => (
                    <li key={`${item.id}-${item.lang ?? ''}`}>
                        <a href={`#${item.id}`} onClick={(event: MouseEvent) => { event.preventDefault(); onGo(item); }}>
                            {item.label}{item.lang && <i>{item.lang.toUpperCase()}</i>}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/** A frase sob o campo que falta. */
export function RequiredMessage({ id, english, t }: { id?: string; english?: boolean; t: Pick<RequiredTexts, 'field' | 'fieldEn'> }) {
    return <span className="rq-msg" id={id}>{english ? t.fieldEn : t.field}</span>;
}

/** Where `focusField` scrolls to: under the bar that stays on top of the screen (F332: the project names its own). */
export interface FocusFieldOptions {
    /** The selector of the sticky bar whose height is the margin; the kit's own `.ak-top` when not given. */
    stickyBar?: string;
}

/** Leva ao campo: rola até ele, com a barra do topo de margem, e põe o cursor no primeiro lugar de escrever. */
export function focusField(id: string, { stickyBar = '.ak-top' }: FocusFieldOptions = {}): boolean {
    const target = document.getElementById(id);
    if (!target) return false;
    const bar = document.querySelector(stickyBar)?.getBoundingClientRect().height ?? 0;
    target.style.scrollMarginTop = `${Math.ceil(bar + 12)}px`;
    target.scrollIntoView({ block: 'start' });
    // campo-proprio: só procura o primeiro campo para o foco, não desenha um
    target.querySelector<HTMLElement>('input, textarea, [contenteditable="true"]')?.focus({ preventScroll: true });
    return true;
}
