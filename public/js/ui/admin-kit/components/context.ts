// cópia carimbada do kit do admin do MJRP Harness · admin-kit v0.9.0 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
"use client";

/**
 * What every element of a screen needs from the screen it is on: the schema, the language being edited, the ports, the
 * project's own pieces and the problems the check found.
 */
import { createContext, useContext, type ReactNode } from 'react';
import type { KitProblem } from '../validate';
import type { KitPorts } from '../ports';
import type { KitSchema } from '../schema';
import type { KitValues } from '../values';

/** A piece the project draws itself, given the scope it sits in and a way to change it. */
export type KitExtension = (props: {
    values: KitValues;
    onChange: (next: KitValues) => void;
    language: string;
    /** O conteúdo gravado, o que o site tem de verdade (F87). */
    saved: KitValues;
    /** Há alterações ainda não salvas no painel. */
    dirty: boolean;
    /** Grava o conteúdo dado pela porta, com a versão lida, e diz se gravou (F87); a falha aparece no aviso do painel. */
    save: (next: KitValues) => Promise<boolean>;
}) => ReactNode;

export interface KitContextValue {
    schema: KitSchema;
    ports: KitPorts;
    language: string;
    extensions: Record<string, KitExtension>;
    problems: KitProblem[];
    /** O conteúdo gravado, as alterações sem salvar e a gravação, que uma peça do projeto usa (F87). */
    saved?: KitValues;
    /** Todo o conteúdo do painel, com o que ainda não foi salvo: o marcador (F127) lê dele o nome e os trechos de todas as seções. */
    all?: KitValues;
    dirty?: boolean;
    save?: (next: KitValues) => Promise<boolean>;
    /** Opens another section of the panel without leaving it (so nothing unsaved is lost), through the router's port; `block` is where to land. */
    go: (path: string, itemId?: string, block?: string) => void;
}

export const KitContext = createContext<KitContextValue | null>(null);

export function useKit(): KitContextValue {
    const value = useContext(KitContext);
    if (!value) throw new Error('admin-kit: an element was drawn outside a KitApp');
    return value;
}

/**
 * The anchor of a field on the screen (F125): the notice «Falta preencher» leads to it. A field pinned to one language (the tab's
 * title in PT and in EN, side by side) carries its language, since the two share the key.
 */
export function fieldAnchor(path: string[], language?: string): string {
    return `akf-${path.join('.')}${language ? `@${language}` : ''}`;
}

/** The problems at a path, or under it. */
export function problemsAt(problems: KitProblem[], path: string[]): KitProblem[] {
    return problems.filter((problem) => path.every((key, index) => problem.path[index] === key));
}
