// cópia carimbada do kit do admin do MJRP Harness · admin-kit v1.0.1 · não edite aqui — edite no harness (kits/admin-kit/) e rode `new_project.py --refresh-admin-kit`
"use client";

/** One element of a block, drawn by its kind; a custom piece comes from the project's extensions, by id. */
import type { KitElement } from '../schema';
import type { KitValues } from '../values';
import { useKit, type KitContextValue, type KitExtension } from './context';
import { ChoiceInput, FieldInput, FlagInput, ImageSlot } from './inputs';
import { BrowserIdentityTab } from './BrowserIdentity';
import { ListView } from './ListView';
import { OrderList } from './OrderList';

type ProjectElement = Extract<KitElement, { kind: 'list' | 'custom' }>;

/** What a piece of the project is handed: its scope, the way to change it, and the panel's saved content and its save (F87). */
function extensionProps(kit: KitContextValue, values: KitValues, onChange: (next: KitValues) => void): Parameters<KitExtension>[0] {
    return { values, onChange, language: kit.language, saved: kit.saved ?? values, dirty: kit.dirty ?? false, save: kit.save ?? (async () => false) };
}

/** The project's own drawing of an element: of a custom piece by its id, of a list by its `view`. */
function drawingOf(extensions: Record<string, KitExtension>, element: ProjectElement): KitExtension | undefined {
    if (element.kind === 'custom') return extensions[element.id];
    return element.view ? extensions[element.view] : undefined;
}

/** A list or a custom piece: the kit's tab sample, the project's drawing when it has one, or the kit's list. */
function projectPiece(kit: KitContextValue, element: ProjectElement, values: KitValues, onChange: (next: KitValues) => void, at: string[]) {
    // The tab sample is the kit's own piece (F113): every place that has a tab says its keys in `data`.
    if (element.kind === 'custom' && element.id === 'browser-identity-tab') return <BrowserIdentityTab values={values} language={kit.language} data={element.data} />;
    const draw = drawingOf(kit.extensions, element);
    if (draw) return <>{draw(extensionProps(kit, values, onChange))}</>;
    return element.kind === 'list' ? <ListView list={element} values={values} onChange={onChange} at={at} /> : null;
}

export function ElementView({ element, values, onChange, at }: { element: KitElement; values: KitValues; onChange: (next: KitValues) => void; at: string[] }) {
    const kit = useKit();
    switch (element.kind) {
        case 'field': return <FieldInput element={element} values={values} onChange={onChange} at={at} />;
        case 'flag': return <FlagInput element={element} values={values} onChange={onChange} at={at} />;
        case 'choice': return <ChoiceInput element={element} values={values} onChange={onChange} at={at} />;
        case 'image': return <ImageSlot element={element} values={values} onChange={onChange} at={at} />;
        case 'order': return <OrderList element={element} values={values} onChange={onChange} />;
        case 'note': return <p className={element.tone === 'warn' ? 'ak-note warn' : 'ak-note'}>{element.text}</p>;
        default: return projectPiece(kit, element, values, onChange, at);
    }
}
