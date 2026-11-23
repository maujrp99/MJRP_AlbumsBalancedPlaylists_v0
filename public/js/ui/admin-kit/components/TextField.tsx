// cópia carimbada do kit do admin do MJRP Harness · admin-kit v0.9.0 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
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

export function TextField({ id, label, labelText, tabs = true, kind, languages, values, onChange, initial, showing, onOpen, required, autoFocus, disabled, readOnly, labelHidden, inputRef, describedBy, bare, rows, invalid, placeholder, hint, limit, keyName, rich, translate, onReview, words, classes, below }: TextFieldProps) {
    const auto = useId();
    const base = id ?? auto;
    const [open, setOpen] = useState(showing && languages.includes(showing) ? showing : initial && languages.includes(initial) ? initial : languages[0]);
    const [seen, setSeen] = useState(showing);
    if (seen !== showing) {
        setSeen(showing);
        if (showing && languages.includes(showing)) setOpen(showing);
    }
    const lang = languages.includes(open) ? open : languages[0];
    const many = languages.length > 1;
    const plainLabel = labelText ?? (typeof label === 'string' ? label : '');
    const text = values[lang] ?? '';
    const w = { ...WORDS, ...words };
    const name = (code: string) => translate?.t.languages[code] ?? code.toUpperCase();
    const hold = typeof placeholder === 'object' ? placeholder[lang] : placeholder;
    const over = limit !== undefined && text.length > limit;
    const bad = invalid || over;
    return (
        <div className={[bare ? '' : 'ak-f', 'ak-tf', classes?.root].filter(Boolean).join(' ')} data-kind={kind} data-lang={lang}>
            <div className="ak-tf-h">
                <label className={labelHidden ? 'ak-lb ak-vh' : 'ak-lb'} htmlFor={base}>
                    {typeof label === 'string' ? <RequiredName text={label} required={required} /> : label}
                    {keyName && <span className="ak-key">{keyName}</span>}
                </label>
                {many && tabs && (
                    <div className="ak-tf-langs" role="tablist" aria-label={plainLabel}>
                        {languages.map((code) => {
                            const empty = !(values[code] ?? '').trim();
                            return (
                                <button key={code} type="button" role="tab" aria-selected={code === lang} tabIndex={code === lang ? 0 : -1}
                                    className={empty ? 'empty' : undefined} aria-label={`${name(code)}${empty ? `, ${w.empty}` : ''}`} onClick={() => { setOpen(code); onOpen?.(code); }}>
                                    {code.toUpperCase()}{empty && <small>{w.empty}</small>}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
            {kind === 'plain' ? (
                // campo-proprio: o próprio campo padrão do kit
                <textarea ref={inputRef as Ref<HTMLTextAreaElement>} id={base} rows={rows ?? 4} disabled={disabled} className="ak-input" value={text} aria-invalid={bad} aria-required={required || undefined} aria-describedby={describedBy}
                    placeholder={hold} onChange={(event) => onChange(lang, event.target.value)} />
            ) : kind === 'link' || kind === 'number' || kind === 'date' ? (
                // campo-proprio: o próprio campo padrão do kit (o link, o número e a data são ele com o tipo da caixa)
                <input id={base} type={kind === 'link' ? 'url' : kind === 'date' && (!text || ISO_DATE.test(text)) ? 'date' : 'text'} inputMode={kind === 'number' ? 'decimal' : undefined}
                    className="ak-input" value={text} readOnly={readOnly} disabled={disabled} aria-invalid={bad} aria-required={required || undefined} aria-describedby={describedBy}
                    placeholder={hold} onChange={(event) => onChange(lang, event.target.value)} />
            ) : kind === 'short' ? (
                // campo-proprio: o próprio campo padrão do kit
                <input ref={inputRef as Ref<HTMLInputElement>} id={base} type="text" disabled={disabled} autoFocus={autoFocus} className="ak-input" value={text} aria-invalid={bad} aria-required={required || undefined} aria-describedby={describedBy}
                    placeholder={hold} onChange={(event) => onChange(lang, event.target.value)} />
            ) : (
                <RichTextField key={`rich-${lang}`} id={base} label={many && tabs ? `${plainLabel} (${name(lang)})` : plainLabel} value={text} invalid={bad} required={required}
                    placeholder={hold} ports={rich?.ports} texts={rich?.texts ?? RICH_TEXTS_EN} onChange={(markdown) => onChange(lang, markdown)} />
            )}
            {below}
            {(kind === 'plain' || kind === 'long' || kind === 'rich') && <span className="ak-hint">{kind === 'plain' ? w.plain : w.paragraphs}</span>}
            {limit !== undefined && <span className={over ? 'ak-count over' : 'ak-count'}>{text.length}/{limit}</span>}
            {many && translate && kind !== 'link' && kind !== 'number' && kind !== 'date' && (
                <TranslateField key={`translate-${lang}`} languages={languages} onScreen={lang} limit={limit} reviewId={base} onReview={onReview}
                    texts={Object.fromEntries(languages.map((code) => [code, values[code] ?? '']))}
                    translate={translate.run} t={translate.t} onAccept={(accepted) => onChange(lang, accepted)} />
            )}
            {hint && <span className="ak-hint">{hint}</span>}
        </div>
    );
}
