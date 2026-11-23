// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
"use client";

/**
 * O campo de texto padrão do kit (F135, S-161; `^cms-text-field*`, a peça `text-field-v1`): o mesmo campo nos dois CMS.
 * Curto é texto simples; longo e rico são texto rico (o `RichTextField`, F128); onde o campo tem mais de um idioma, ganha as
 * abas dos idiomas e o «Traduzir» nos dois sentidos, com a revisão antes de aceitar (`TranslateField`, F96).
 *
 * Só props, sem `useKit`: serve à ficha do livro e às telas do Jardim, que não estão dentro de um `KitApp`. Cada idioma é um
 * texto; quem usa decide onde ele mora (uma chave por idioma, um par de chaves soltas como `synopsis`/`synopsis_en`, ou
 * `{ pt, en }`), e recebe de volta só `onChange(idioma, texto)`.
 */
import { useId, useState, type ReactNode, type Ref } from 'react';
import type { KitResult, KitTranslateTexts } from '../ports';
import { RICH_TEXTS_EN, type RichTexts } from '../rich/tools';
import { RichTextField, type RichFieldPorts } from './RichTextField';
import { RequiredName } from './Required';
import { TranslateField } from './TranslateField';
import { nameOf } from '../values';

export type TextFieldKind = 'short' | 'plain' | 'long' | 'rich' | 'link' | 'number' | 'date';

export interface TextFieldProps {
    id?: string;
    label: ReactNode;
    /** O rótulo em texto, para o leitor de tela e a barra de ferramentas, quando `label` é um desenho. */
    labelText?: string;
    /** `short`: texto simples de uma linha; `plain`: texto simples de várias linhas; `long` e `rich`: texto rico (a regra proposta, F135). */
    kind: TextFieldKind;
    /** Os idiomas do campo, o primeiro é o principal. Um só: sem abas e sem «Traduzir». */
    languages: readonly string[];
    /** O texto de cada idioma, como está agora. */
    values: Record<string, string>;
    onChange: (language: string, text: string) => void;
    /** Sem as abas: o idioma aberto é o da tela do projeto (o editor de páginas tem a chave de idioma dele); o «Traduzir» segue. */
    tabs?: boolean;
    /** O idioma que abre primeiro. */
    initial?: string;
    /** Muda o idioma aberto de fora (um texto achado em inglês abre a aba inglesa); a aba segue livre depois. */
    showing?: string;
    /** Avisa quem usa qual idioma está aberto (o aviso das partes do resumo segue a aba). */
    onOpen?: (language: string) => void;
    required?: boolean;
    /** Só para ler: o valor aparece e não muda (a ordem pública, que muda na aba dela). */
    readOnly?: boolean;
    /** O que descreve a falta do campo (a frase do obrigatório vazio), lido junto com a caixa. */
    describedBy?: string;
    /** A caixa de texto simples, para quem põe algo onde está o cursor (o marcador da frase, F127). */
    inputRef?: Ref<HTMLInputElement & HTMLTextAreaElement>;
    /** O rótulo fica só para o leitor de tela (a linha de uma lista que já diz o que é). */
    labelHidden?: boolean;
    /** O campo some para o autor enquanto o painel espera uma confirmação. */
    disabled?: boolean;
    /** A altura da caixa simples, em linhas (o texto de um prompt é longo). */
    rows?: number;
    /** O foco entra no campo ao abrir (a linha de «Adicionar estado»). */
    autoFocus?: boolean;
    invalid?: boolean;
    /** O que o campo vazio mostra; um texto para todos os idiomas, ou um por idioma. */
    placeholder?: string | Record<string, string>;
    hint?: string;
    limit?: number;
    /** O nome do campo no dado (a chave), ao lado do rótulo. */
    keyName?: string;
    /** O texto simples não muda de lugar; só o rico leva as portas do projeto. */
    rich?: { ports?: RichFieldPorts; texts?: RichTexts };
    /** A porta de traduzir e as palavras dela; sem uma das duas, o campo não oferece tradução. */
    translate?: { run: (text: string, target: string) => Promise<KitResult<string>>; t: KitTranslateTexts };
    /** Avisa quem grava que há uma sugestão sem revisão (`open`) ou que não há mais. */
    onReview?: (id: string, open: boolean) => void;
    /** As palavras do campo: as abas, o vazio e a dica de parágrafo (`^cms-text-paragraphs`). */
    words?: { empty?: string; paragraphs?: string; plain?: string };
    classes?: { root?: string };
    /** What goes right under the field, before its hints and its translate piece (the sentence of the required one, UAT-267). */
    below?: ReactNode;
    /** Sem a classe `ak-f` na raiz: o campo vive dentro do `ak-f` de quem o usa (a âncora, o aviso e as listas dele). */
    bare?: boolean;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
/** The kit's own words, in English (F332); a project hands its own through `words`. */
const WORDS = { empty: 'empty', paragraphs: 'A blank line opens a paragraph; a single break stays.', plain: 'Plain text: a blank line becomes a paragraph on the site.' };

/** The language that opens first: the one asked from outside, the initial one, or the field's first. */
function firstOpen(languages: readonly string[], showing?: string, initial?: string): string {
    if (showing && languages.includes(showing)) return showing;
    return initial && languages.includes(initial) ? initial : languages[0];
}

/** The open language: it follows `showing` when that changes from outside, and the tab stays free afterwards. */
function useOpenLanguage(languages: readonly string[], showing?: string, initial?: string): [string, (language: string) => void] {
    const [open, setOpen] = useState(firstOpen(languages, showing, initial));
    const [seen, setSeen] = useState(showing);
    if (seen !== showing) {
        setSeen(showing);
        if (showing && languages.includes(showing)) setOpen(showing);
    }
    return [languages.includes(open) ? open : languages[0], setOpen];
}

/** The id of the box: the one given, or one of the field's own. */
function useFieldId(id?: string): string {
    const auto = useId();
    return id ?? auto;
}

/** The label as text, for the screen reader and the toolbar. */
const plainOf = (label: ReactNode, labelText?: string): string => labelText ?? (typeof label === 'string' ? label : '');

/** What the empty field shows, in the open language. */
const holdOf = (placeholder: TextFieldProps['placeholder'], lang: string): string | undefined => (typeof placeholder === 'object' ? placeholder[lang] : placeholder);

/** The field's text in a language, empty when it has none. */
const textIn = (values: Record<string, string>, code: string): string => values[code] ?? '';

const isOver = (text: string, limit?: number): boolean => limit !== undefined && text.length > limit;

const rootClass = (bare?: boolean, classes?: TextFieldProps['classes']): string => [bare ? '' : 'ak-f', 'ak-tf', classes?.root].filter(Boolean).join(' ');

/** A link, a number and a date are one value: they offer no translation. */
const hasProse = (kind: TextFieldKind): boolean => kind !== 'link' && kind !== 'number' && kind !== 'date';

function FieldLabel({ base, label, labelHidden, required, keyName }: Pick<TextFieldProps, 'label' | 'labelHidden' | 'required' | 'keyName'> & { base: string }) {
    return (
        <label className={labelHidden ? 'ak-lb ak-vh' : 'ak-lb'} htmlFor={base}>
            {typeof label === 'string' ? <RequiredName text={label} required={required} /> : label}
            {keyName && <span className="ak-key">{keyName}</span>}
        </label>
    );
}

/** One tab per language; the empty one says so. */
function LanguageTabs({ languages, lang, values, label, name, empty, onPick }: {
    languages: readonly string[]; lang: string; values: Record<string, string>; label: string; name: (code: string) => string; empty: string; onPick: (code: string) => void;
}) {
    return (
        <div className="ak-tf-langs" role="tablist" aria-label={label}>
            {languages.map((code) => {
                const blank = !(values[code] ?? '').trim();
                return (
                    <button key={code} type="button" role="tab" aria-selected={code === lang} tabIndex={code === lang ? 0 : -1}
                        className={blank ? 'empty' : undefined} aria-label={`${name(code)}${blank ? `, ${empty}` : ''}`} onClick={() => onPick(code)}>
                        {code.toUpperCase()}{blank && <small>{empty}</small>}
                    </button>
                );
            })}
        </div>
    );
}

type BoxProps = Pick<TextFieldProps, 'kind' | 'rows' | 'disabled' | 'readOnly' | 'autoFocus' | 'required' | 'describedBy' | 'inputRef' | 'rich'> & {
    base: string; lang: string; text: string; bad: boolean; hold?: string; onText: (text: string) => void;
    /** The label as text and, in a field with tabs, the open language's name: the rich editor's own name («Resumo (inglês)»). */
    label: string; langName?: string;
};

function PlainBox({ base, text, bad, hold, onText, rows, disabled, required, describedBy, inputRef }: BoxProps) {
    return (
        // campo-proprio: o próprio campo padrão do kit
        <textarea ref={inputRef as Ref<HTMLTextAreaElement>} id={base} rows={rows ?? 4} disabled={disabled} className="ak-input" value={text} aria-invalid={bad} aria-required={required || undefined} aria-describedby={describedBy}
            placeholder={hold} onChange={(event) => onText(event.target.value)} />
    );
}

/** The box's type: a date only while the value is one (or empty), so an old free text still shows. */
function lineType(kind: TextFieldKind, text: string): 'url' | 'date' | 'text' {
    if (kind === 'link') return 'url';
    return kind === 'date' && (!text || ISO_DATE.test(text)) ? 'date' : 'text';
}

function LineBox({ base, kind, text, bad, hold, onText, readOnly, disabled, required, describedBy }: BoxProps) {
    return (
        // campo-proprio: o próprio campo padrão do kit (o link, o número e a data são ele com o tipo da caixa)
        <input id={base} type={lineType(kind, text)} inputMode={kind === 'number' ? 'decimal' : undefined}
            className="ak-input" value={text} readOnly={readOnly} disabled={disabled} aria-invalid={bad} aria-required={required || undefined} aria-describedby={describedBy}
            placeholder={hold} onChange={(event) => onText(event.target.value)} />
    );
}

function ShortBox({ base, text, bad, hold, onText, disabled, autoFocus, required, describedBy, inputRef }: BoxProps) {
    return (
        // campo-proprio: o próprio campo padrão do kit
        <input ref={inputRef as Ref<HTMLInputElement>} id={base} type="text" disabled={disabled} autoFocus={autoFocus} className="ak-input" value={text} aria-invalid={bad} aria-required={required || undefined} aria-describedby={describedBy}
            placeholder={hold} onChange={(event) => onText(event.target.value)} />
    );
}

/** Where the author writes: the plain box of many lines, the one-value box, the short one, or the rich editor. */
function Box(props: BoxProps) {
    const { kind, lang, base, label, langName, text, bad, required, hold, rich, onText } = props;
    if (kind === 'plain') return <PlainBox {...props} />;
    if (!hasProse(kind)) return <LineBox {...props} />;
    if (kind === 'short') return <ShortBox {...props} />;
    return (
        <RichTextField key={nameOf('rich', lang)} id={base} label={langName !== undefined ? `${label} (${langName})` : label} value={text} invalid={bad} required={required}
            placeholder={hold} ports={rich?.ports} texts={rich?.texts ?? RICH_TEXTS_EN} onChange={onText} />
    );
}

/** Under the box: how a paragraph is made, in a text of many lines, and the count against the limit. */
function Measures({ kind, text, limit, w }: { kind: TextFieldKind; text: string; limit?: number; w: typeof WORDS }) {
    return (
        <>
            {(kind === 'plain' || kind === 'long' || kind === 'rich') && <span className="ak-hint">{kind === 'plain' ? w.plain : w.paragraphs}</span>}
            {limit !== undefined && <span className={isOver(text, limit) ? 'ak-count over' : 'ak-count'}>{text.length}/{limit}</span>}
        </>
    );
}

export function TextField({ id, label, labelText, tabs = true, kind, languages, values, onChange, initial, showing, onOpen, required, autoFocus, disabled, readOnly, labelHidden, inputRef, describedBy, bare, rows, invalid, placeholder, hint, limit, keyName, rich, translate, onReview, words, classes, below }: TextFieldProps) {
    const base = useFieldId(id);
    const [lang, setOpen] = useOpenLanguage(languages, showing, initial);
    const many = languages.length > 1;
    const tabbed = many && tabs;
    const plainLabel = plainOf(label, labelText);
    const text = textIn(values, lang);
    const w = { ...WORDS, ...words };
    const name = (code: string) => translate?.t.languages[code] ?? code.toUpperCase();
    const bad = invalid || isOver(text, limit);
    return (
        <div className={rootClass(bare, classes)} data-kind={kind} data-lang={lang}>
            <div className="ak-tf-h">
                <FieldLabel base={base} label={label} labelHidden={labelHidden} required={required} keyName={keyName} />
                {tabbed && <LanguageTabs languages={languages} lang={lang} values={values} label={plainLabel} name={name} empty={w.empty} onPick={(code) => { setOpen(code); onOpen?.(code); }} />}
            </div>
            <Box kind={kind} base={base} lang={lang} text={text} bad={bad} hold={holdOf(placeholder, lang)} label={plainLabel} langName={tabbed ? name(lang) : undefined}
                rows={rows} disabled={disabled} readOnly={readOnly} autoFocus={autoFocus} required={required} describedBy={describedBy} inputRef={inputRef} rich={rich}
                onText={(next) => onChange(lang, next)} />
            {below}
            <Measures kind={kind} text={text} limit={limit} w={w} />
            {many && translate && hasProse(kind) && (
                <TranslateField key={nameOf('translate', lang)} languages={languages} onScreen={lang} limit={limit} reviewId={base} onReview={onReview}
                    texts={Object.fromEntries(languages.map((code) => [code, textIn(values, code)]))}
                    translate={translate.run} t={translate.t} onAccept={(accepted) => onChange(lang, accepted)} />
            )}
            {hint && <span className="ak-hint">{hint}</span>}
        </div>
    );
}
